import { readFile, writeFile, mkdir, cp, rm, readdir, stat } from 'node:fs/promises';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

export const projectRoot = fileURLToPath(new URL('../', import.meta.url));
export const configPath = join(projectRoot, 'KUZENLER_AYARLARI.env');

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === '') return fallback;
  return ['true', '1', 'yes', 'evet'].includes(String(value).trim().toLowerCase());
}

export async function loadProjectConfig() {
  const text = await readFile(configPath, 'utf8');
  const raw = {};
  for (const sourceLine of text.split(/\r?\n/)) {
    const line = sourceLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    raw[key] = value;
  }

  const requestedMode = String(raw.CALISMA_MODU || raw.APP_MODE || 'local').trim().toLocaleLowerCase('tr-TR');
  const mode = ['canli', 'canlı', 'live', 'vercel', 'production'].includes(requestedMode) ? 'vercel' : 'local';
  const provider = mode === 'vercel' ? 'firebase' : 'local';
  return {
    mode,
    appName: raw.APP_NAME || 'Zihin Arenası',
    shortName: raw.APP_SHORT_NAME || 'Kuzenler',
    description: raw.APP_DESCRIPTION || 'Öğrenme ve zekâ oyunları.',
    localPort: Number(raw.LOCAL_PORT || 6220),
    dataProvider: provider,
    contentVersion: raw.CONTENT_VERSION || '5.0.0',
    git: {
      repositoryUrl: raw.GIT_REPOSITORY_URL || '',
      defaultBranch: raw.GIT_DEFAULT_BRANCH || 'main',
      userName: raw.GIT_USER_NAME || '',
      userEmail: raw.GIT_USER_EMAIL || ''
    },
    vercel: {
      projectName: raw.VERCEL_PROJECT_NAME || 'kuzenler-yarisiyor',
      teamId: raw.VERCEL_TEAM_ID || '',
      projectId: raw.VERCEL_PROJECT_ID || ''
    },
    firebase: {
      enabled: mode === 'vercel',
      apiKey: raw.FIREBASE_API_KEY || '',
      authDomain: raw.FIREBASE_AUTH_DOMAIN || '',
      projectId: raw.FIREBASE_PROJECT_ID || '',
      storageBucket: raw.FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: raw.FIREBASE_MESSAGING_SENDER_ID || '',
      appId: raw.FIREBASE_APP_ID || '',
      measurementId: raw.FIREBASE_MEASUREMENT_ID || ''
    },
    features: {
      allowAnonymousPlay: parseBoolean(raw.ALLOW_ANONYMOUS_PLAY, true),
      teacherPreview: parseBoolean(raw.ENABLE_TEACHER_PREVIEW, true),
      parentAnalytics: parseBoolean(raw.ENABLE_PARENT_ANALYTICS, true),
      pwa: parseBoolean(raw.ENABLE_PWA, true),
      requireAuthInLive: parseBoolean(raw.REQUIRE_AUTH_IN_LIVE, true),
      allowPublicSignup: parseBoolean(raw.ALLOW_PUBLIC_SIGNUP, true),
      parentAccounts: parseBoolean(raw.ENABLE_PARENT_ACCOUNTS, true),
      teacherAccounts: parseBoolean(raw.ENABLE_TEACHER_ACCOUNTS, true),
      studentAccounts: parseBoolean(raw.ENABLE_STUDENT_ACCOUNTS, true),
      teacherBulkImport: parseBoolean(raw.ENABLE_TEACHER_BULK_IMPORT, true),
      teacherAnalytics: parseBoolean(raw.ENABLE_TEACHER_ANALYTICS, true)
    },
    ownerAdminEmail: (raw.OWNER_ADMIN_EMAIL || '').trim().toLowerCase(),
    studentAuthDomain: raw.STUDENT_AUTH_DOMAIN || 'students.kuzenleryarisiyor.local',
    limits: {
      maxChildrenPerParent: Number(raw.MAX_CHILDREN_PER_PARENT || 8),
      maxStudentsPerClassroom: Number(raw.MAX_STUDENTS_PER_CLASSROOM || 50),
      maxBulkImport: Number(raw.MAX_BULK_IMPORT || 40)
    }
  };
}


export function validateProjectConfig(config) {
  const errors = [];
  if (config.mode === 'vercel') {
    if (config.dataProvider !== 'firebase') errors.push('Canlı modda Firebase veri sağlayıcısı zorunludur.');
    if (!config.firebase.enabled) errors.push('Canlı modda Firebase etkin olmalıdır.');
    for (const [key, label] of [['apiKey','FIREBASE_API_KEY'],['authDomain','FIREBASE_AUTH_DOMAIN'],['projectId','FIREBASE_PROJECT_ID'],['appId','FIREBASE_APP_ID']]) {
      if (!config.firebase[key]) errors.push(`${label} doldurulmalıdır.`);
    }
    if (!config.features.requireAuthInLive) errors.push('Canlı modda REQUIRE_AUTH_IN_LIVE=true zorunludur.');
    if (config.features.allowAnonymousPlay) errors.push('Canlı modda ALLOW_ANONYMOUS_PLAY=false zorunludur.');
  }
  return errors;
}

export async function writeRuntimeConfig(config, targetRoot = projectRoot) {
  const target = join(targetRoot, 'js', 'runtime-config.js');
  await mkdir(dirname(target), { recursive: true });
  const publicConfig = {
    mode: config.mode,
    appName: config.appName,
    shortName: config.shortName,
    description: config.description,
    dataProvider: config.dataProvider,
    contentVersion: config.contentVersion,
    git: { repositoryUrl: config.git.repositoryUrl, defaultBranch: config.git.defaultBranch },
    vercel: { projectName: config.vercel.projectName },
    firebase: config.firebase,
    features: config.features,
    ownerAdminEmail: config.ownerAdminEmail,
    studentAuthDomain: config.studentAuthDomain,
    limits: config.limits
  };
  await writeFile(target, `// Otomatik üretilir. KUZENLER_AYARLARI.env dosyasını düzenleyin.\nexport const RUNTIME_CONFIG = Object.freeze(${JSON.stringify(publicConfig, null, 2)});\n`, 'utf8');
  return target;
}

const COPY_EXCLUDES = new Set(['dist', '.git', 'node_modules', 'KUZENLER_AYARLARI.env', 'tests', 'scripts', 'docs', 'TEST_RAPORU.md', 'package-lock.json']);

async function copyDirectory(source, target) {
  await mkdir(target, { recursive: true });
  for (const entry of await readdir(source)) {
    if (COPY_EXCLUDES.has(entry)) continue;
    const sourcePath = join(source, entry);
    const targetPath = join(target, entry);
    const info = await stat(sourcePath);
    if (info.isDirectory()) await copyDirectory(sourcePath, targetPath);
    else await cp(sourcePath, targetPath);
  }
}

export async function buildDist() {
  const config = await loadProjectConfig();
  const validationErrors = validateProjectConfig(config);
  if (validationErrors.length) throw new Error(`Canlı yapılandırma hatası:\n- ${validationErrors.join('\n- ')}`);
  const dist = join(projectRoot, 'dist');
  await rm(dist, { recursive: true, force: true });
  await copyDirectory(projectRoot, dist);
  await writeRuntimeConfig(config, dist);
  return { config, dist };
}
