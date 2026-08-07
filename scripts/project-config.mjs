import { readFile, writeFile, mkdir, cp, rm, readdir, stat } from 'node:fs/promises';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

export const projectRoot = fileURLToPath(new URL('../', import.meta.url));
export const configPath = join(projectRoot, 'KUZENLER_AYARLARI.env');
export const packagePath = join(projectRoot, 'package.json');

function versionTuple(value = '') {
  const match = String(value).match(/(\d+)\.(\d+)\.(\d+)(?:-([a-z]+)\.?(\d+)?)?/i);
  if (!match) return [0, 0, 0, 0, 0];
  const stage = { alpha: 1, beta: 2, rc: 3 }[String(match[4] || '').toLowerCase()] || 4;
  return [Number(match[1]), Number(match[2]), Number(match[3]), stage, Number(match[5] || 0)];
}

function newestVersion(a, b) {
  const left = versionTuple(a), right = versionTuple(b);
  for (let i = 0; i < left.length; i += 1) {
    if (left[i] > right[i]) return a;
    if (right[i] > left[i]) return b;
  }
  return a || b;
}

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === '') return fallback;
  return ['true', '1', 'yes', 'evet'].includes(String(value).trim().toLowerCase());
}

export async function loadProjectConfig() {
  const [text, packageText] = await Promise.all([
    readFile(configPath, 'utf8').catch((error) => {
      if (error?.code === 'ENOENT') return '';
      throw error;
    }),
    readFile(packagePath, 'utf8')
  ]);
  const packageVersion = JSON.parse(packageText).version || '0.0.0';
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
  Object.assign(raw, process.env);

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
    contentVersion: newestVersion(raw.CONTENT_VERSION || '', packageVersion),
    releaseVersion: packageVersion,
    aiProvider: raw.AI_PROVIDER || 'local',
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
      qualityPilotMode: parseBoolean(raw.QUALITY_PILOT_MODE, false),
      controlledLaunchPilotMode: parseBoolean(raw.CONTROLLED_LAUNCH_PILOT_MODE, true),
      controlledLaunchPilotVersion: String(raw.CONTROLLED_LAUNCH_PILOT_VERSION || 'PHASE5I_PILOT_1').trim(),
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
    if (config.features.controlledLaunchPilotMode && !config.features.controlledLaunchPilotVersion) {
      errors.push('Kontrollü canlı pilot modunda CONTROLLED_LAUNCH_PILOT_VERSION zorunludur.');
    }
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
    releaseVersion: config.releaseVersion,
    aiProvider: config.aiProvider,
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

const COPY_EXCLUDES = new Set(['dist', '.git', 'node_modules', 'KUZENLER_AYARLARI.env', 'tests', 'test-results', 'scripts', 'docs', 'md', 'ps', 'quality-reports', 'package-lock.json']);

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
