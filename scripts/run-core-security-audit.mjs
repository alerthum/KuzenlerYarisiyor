import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const port = Number(process.argv[2] || 6222);
const output = path.resolve('quality-reports/assessment-v2-phase5g-security-evidence.json');
let server;

function requestRaw(requestPath, method = 'GET') {
  return new Promise((resolve, reject) => {
    const request = http.request({ hostname: '127.0.0.1', port, path: requestPath, method }, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve({
        status: response.statusCode,
        headers: response.headers,
        body: Buffer.concat(chunks).toString('utf8').slice(0, 20_000)
      }));
    });
    request.on('error', reject);
    request.end();
  });
}

async function waitForServer(timeoutMs = 20_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await requestRaw('/');
      if (response.status === 200) return;
    } catch {}
    await sleep(100);
  }
  throw new Error('security-audit-server-timeout');
}

const checks = [];
const add = (id, pass, detail, evidence = null) => checks.push({ id, pass: Boolean(pass), detail, evidence });

try {
  server = spawn(process.execPath, ['server.mjs', '--root', 'dist', '--port', String(port)], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let serverStdout = '';
  let serverStderr = '';
  server.stdout.on('data', (chunk) => { serverStdout += chunk; });
  server.stderr.on('data', (chunk) => { serverStderr += chunk; });
  await waitForServer();

  const root = await requestRaw('/');
  const headers = root.headers;
  add('root-serves-app', root.status === 200 && /<!doctype html>/i.test(root.body), 'Uygulama kökü yalnız statik build içeriğini sunar.', { status: root.status });
  add('content-type-nosniff', headers['x-content-type-options'] === 'nosniff', 'MIME sniffing kapalıdır.', headers['x-content-type-options']);
  add('frame-protection', headers['x-frame-options'] === 'DENY' && String(headers['content-security-policy']).includes("frame-ancestors 'none'"), 'Clickjacking iki katmanlı olarak engellenir.', { xFrameOptions: headers['x-frame-options'], csp: headers['content-security-policy'] });
  add('content-security-policy', String(headers['content-security-policy']).includes("default-src 'self'") && String(headers['content-security-policy']).includes("base-uri 'self'") && String(headers['content-security-policy']).includes("form-action 'self'"), 'CSP kaynak, base URI ve form hedeflerini sınırlar.', headers['content-security-policy']);
  add('permissions-policy', String(headers['permissions-policy']).includes('camera=()') && String(headers['permissions-policy']).includes('microphone=()') && String(headers['permissions-policy']).includes('geolocation=()'), 'Kamera, mikrofon ve konum varsayılan olarak kapalıdır.', headers['permissions-policy']);
  add('referrer-policy', headers['referrer-policy'] === 'strict-origin-when-cross-origin', 'Referer sızıntısı sınırlandırılır.', headers['referrer-policy']);
  add('cross-origin-isolation-headers', headers['cross-origin-opener-policy'] === 'same-origin' && headers['cross-origin-resource-policy'] === 'same-origin', 'Çapraz kaynak pencere ve kaynak kullanımı sınırlandırılır.', { coop: headers['cross-origin-opener-policy'], corp: headers['cross-origin-resource-policy'] });

  const blockedPaths = [
    '/.git/HEAD', '/%2eGit/HEAD', '/KUZENLER_AYARLARI.env', '/.env', '/.env.local',
    '/package.json', '/package-lock.json', '/server.mjs', '/scripts/project-config.mjs',
    '/tests/assessment-v2/phase5f-core-game-release.test.mjs', '/../KUZENLER_AYARLARI.env',
    '/%2e%2e/KUZENLER_AYARLARI.env', '/missing-sensitive-file.js'
  ];
  const blockedResults = [];
  for (const requestPath of blockedPaths) {
    const response = await requestRaw(requestPath);
    blockedResults.push({ path: requestPath, status: response.status, body: response.body.slice(0, 120) });
  }
  add('sensitive-path-denylist', blockedResults.every((row) => row.status === 404), 'Kaynak kontrolü, ortam ayarları, sunucu kodu, testler ve dosya geçişi denemeleri 404 döndürür.', blockedResults);

  const postStatic = await requestRaw('/index.html', 'POST');
  add('static-method-restriction', postStatic.status === 405 && String(postStatic.headers.allow).includes('GET'), 'Statik sunucu yalnız GET/HEAD kabul eder.', { status: postStatic.status, allow: postStatic.headers.allow });
  const apiGet = await requestRaw('/api/rebuild-command-center-export', 'GET');
  add('maintenance-api-method-restriction', apiGet.status === 405 && apiGet.headers.allow === 'POST', 'Bakım API’si GET ile tetiklenemez; yalnız POST kabul eder.', { status: apiGet.status, allow: apiGet.headers.allow });
  const head = await requestRaw('/', 'HEAD');
  add('head-contract', head.status === 200 && head.body.length === 0, 'HEAD isteği gövdesiz yanıtlanır.', { status: head.status, bodyLength: head.body.length });
  const spa = await requestRaw('/library');
  add('safe-spa-fallback', spa.status === 200 && /id="app"/.test(spa.body), 'Uzantısız uygulama rotaları güvenli index fallback kullanır.', { status: spa.status });
  const missingAsset = await requestRaw('/missing-file.js');
  add('missing-asset-no-spa-fallback', missingAsset.status === 404, 'Eksik dosya uzantıları index içeriğiyle maskelenmez.', { status: missingAsset.status });
  const serverErrorLeak = blockedResults.some((row) => /stack|at\s+file:|sunucu hatası:/i.test(row.body));
  add('no-error-detail-leak', !serverErrorLeak && !/Error:| at file:/i.test(postStatic.body), 'HTTP hata yanıtları stack trace veya iç dosya yolu sızdırmaz.');

  const rulesPath = path.resolve('firebase/firestore.rules');
  const rules = fs.readFileSync(rulesPath, 'utf8');
  add('firestore-rules-v2', /rules_version\s*=\s*'2'/.test(rules), 'Firestore rules v2 kullanılır.');
  add('firestore-auth-guard', /function signedIn\(\)\s*\{\s*return request\.auth != null;\s*\}/.test(rules), 'Kimlik doğrulama ortak signedIn korumasıyla tanımlıdır.');
  add('firestore-default-deny', /match \/\{document=\*\*\}[\s\S]*?allow read, write: if false;/.test(rules), 'Tanımsız bütün Firestore yolları varsayılan olarak reddedilir.');
  add('firestore-attempt-immutability', /match \/attempts\/\{attemptId\}[\s\S]*?allow update, delete: if false;/.test(rules), 'Öğrenci deneme kayıtları oluşturulduktan sonra değiştirilemez ve silinemez.');
  add('firestore-content-admin-only', /match \/contentItems\/\{contentId\}[\s\S]*?allow write: if roleIs\('admin'\);/.test(rules), 'Yayın içerikleri yalnız admin rolüyle yazılabilir.');
  add('firestore-no-unconditional-allow', !/allow\s+(?:read|write|create|update|delete)(?:\s*,\s*(?:read|write|create|update|delete))*\s*:\s*if\s+true\s*;/.test(rules), 'Firestore kurallarında koşulsuz allow true bulunmaz.');

  const scanRoots = ['js', 'firebase', 'scripts'];
  const candidateFiles = [];
  for (const rootDir of scanRoots) {
    const queue = [path.resolve(rootDir)];
    while (queue.length) {
      const current = queue.pop();
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) queue.push(full);
        else if (/\.(?:js|mjs|json|rules)$/i.test(entry.name)) candidateFiles.push(full);
      }
    }
  }
  const secretPatterns = [
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    /"private_key"\s*:\s*"-----BEGIN/,
    /AKIA[0-9A-Z]{16}/,
    /(?:client_secret|service_account_secret)\s*[:=]\s*["'][^"']{16,}/i
  ];
  const secretHits = [];
  for (const file of candidateFiles) {
    const content = fs.readFileSync(file, 'utf8');
    if (secretPatterns.some((pattern) => pattern.test(content))) secretHits.push(path.relative(process.cwd(), file));
  }
  add('no-private-key-material', secretHits.length === 0, 'Kaynak kodunda özel anahtar veya servis hesabı sırrı deseni bulunmaz.', secretHits);

  const failures = checks.filter((check) => !check.pass);
  const report = {
    schemaVersion: '2.0',
    status: failures.length === 0 ? 'PASS' : 'FAIL',
    evidenceSource: 'DYNAMIC_LOCAL_HTTP_ATTACK_SURFACE_AND_STATIC_FIRESTORE_RULE_AUDIT',
    scope: {
      httpSecurityHeaders: true,
      sensitiveFileExposure: true,
      pathTraversal: true,
      methodRestrictions: true,
      maintenanceApi: true,
      errorDisclosure: true,
      firestoreRuleContract: true,
      privateKeyPatternScan: true
    },
    checks,
    failureCount: failures.length,
    failures,
    generatedAt: new Date().toISOString(),
    infrastructure: { command: `node scripts/run-core-security-audit.mjs ${port}`, serverStdout: serverStdout.slice(0, 1000), serverStderr: serverStderr.slice(0, 1000) }
  };
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ status: report.status, checks: checks.length, failureCount: report.failureCount, file: output }, null, 2));
  if (report.status !== 'PASS') process.exitCode = 1;
} finally {
  try { server?.kill('SIGKILL'); } catch {}
}
