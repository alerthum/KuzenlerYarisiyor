import http from 'node:http';
import { stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { extname, join, normalize, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import { loadProjectConfig } from './scripts/project-config.mjs';
import {
  buildCommandCenterExport,
  EXPORT_PATH,
  formatSize
} from './scripts/lib/command-center-export.mjs';
import {
  buildCommandCenterShare,
  SHARE_PATH
} from './scripts/lib/command-center-share.mjs';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));
const rootArgIndex = process.argv.findIndex((arg) => arg === '--root');
const root = rootArgIndex >= 0 ? resolve(projectRoot, process.argv[rootArgIndex + 1] || '.') : projectRoot;
const projectConfig = await loadProjectConfig();
const cliPortIndex = process.argv.findIndex((arg) => arg === '--port' || arg === '-p');
const cliPort = cliPortIndex >= 0 ? Number(process.argv[cliPortIndex + 1]) : undefined;
const port = cliPort || Number(process.env.PORT) || projectConfig.localPort || 6220;
const host = '0.0.0.0';

const contentTypes = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8'
};

const securityHeaders = Object.freeze({
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "script-src 'self' https://www.gstatic.com https://www.googleapis.com",
    "connect-src 'self' https://www.gstatic.com https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com",
    "img-src 'self' data: blob:",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "worker-src 'self' blob:",
    "manifest-src 'self'"
  ].join('; ')
});

const blockedPathSegments = new Set([
  '.git', '.github', 'node_modules', 'scripts', 'tests', 'test-results', 'playwright-report', 'coverage', 'config'
]);
const blockedFileNames = new Set([
  '.env', 'kuzENLER_AYARLARI.env'.toLowerCase(), 'package.json', 'package-lock.json',
  'server.mjs'
]);

function writeResponse(response, status, body, headers = {}) {
  response.writeHead(status, {
    ...securityHeaders,
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    ...headers
  });
  response.end(body);
}

function isLoopback(address = '') {
  return address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1';
}

function isBlockedRequestPath(urlPath) {
  let decoded;
  try { decoded = decodeURIComponent(urlPath.split('?')[0]); } catch { return true; }
  const normalized = decoded.replace(/\\/g, '/').toLowerCase();
  const segments = normalized.split('/').filter(Boolean);
  if (segments.some((segment) => segment === '..' || blockedPathSegments.has(segment))) return true;
  const name = segments.at(-1) || '';
  return blockedFileNames.has(name) || name.startsWith('.env.') || name.endsWith('.env');
}

let exportRebuildInFlight = null;
let shareRebuildInFlight = null;
async function handleRebuildExport(response) {
  if (!exportRebuildInFlight) {
    exportRebuildInFlight = Promise.resolve().then(() => buildCommandCenterExport({ write: true }))
      .finally(() => { exportRebuildInFlight = null; });
  }
  const result = await exportRebuildInFlight;
  const body = JSON.stringify({
    ok: true,
    path: EXPORT_PATH,
    dataFreshness: result.meta.dataFreshness,
    sourceCount: result.meta.sourceCount,
    sectionCount: result.meta.sectionCount,
    exportSizeBytes: result.meta.exportSizeBytes,
    exportSize: formatSize(result.meta.exportSizeBytes),
    missingRequiredCount: result.meta.missingRequiredCount,
    runId: result.meta.runId
  });
  response.writeHead(200, {
    ...securityHeaders,
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  });
  response.end(body);
}

async function handleRebuildShare(response) {
  if (!shareRebuildInFlight) {
    shareRebuildInFlight = Promise.resolve().then(() => buildCommandCenterShare({ write: true }))
      .finally(() => { shareRebuildInFlight = null; });
  }
  const result = await shareRebuildInFlight;
  const body = JSON.stringify({
    ok: true,
    path: SHARE_PATH,
    kind: 'chatgpt-share',
    dataFreshness: result.meta.dataFreshness,
    liveStatus: result.meta.liveStatus,
    failedShardCount: result.meta.failedShardCount,
    exportSizeBytes: result.bytes,
    exportSize: formatSize(result.bytes),
    runId: result.meta.runId
  });
  response.writeHead(200, {
    ...securityHeaders,
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  });
  response.end(body);
}

function safePath(urlPath) {
  if (isBlockedRequestPath(urlPath)) return null;
  let decoded;
  try { decoded = decodeURIComponent(urlPath.split('?')[0]); } catch { return null; }
  const cleaned = normalize(decoded).replace(/^([/\\])+/, '');
  const fullPath = join(root, cleaned || 'index.html');
  const rel = relative(root, fullPath);
  if (rel.startsWith('..') || rel.includes(`..${process.platform === 'win32' ? '\\' : '/'}`)) return null;
  return fullPath;
}

async function resolveFile(requestPath) {
  let target = safePath(requestPath);
  if (!target) return { kind: 'blocked' };
  try {
    const info = await stat(target);
    if (info.isDirectory()) target = join(target, 'index.html');
    return { kind: 'file', path: target };
  } catch {
    const pathname = (requestPath || '/').split('?')[0];
    if (extname(pathname)) return { kind: 'missing' };
    return { kind: 'file', path: join(root, 'index.html') };
  }
}

const server = http.createServer(async (request, response) => {
  try {
    const urlPath = (request.url || '/').split('?')[0];
    const isRebuildEndpoint = urlPath === '/api/rebuild-command-center-export'
      || urlPath === '/api/rebuild-command-center-share';
    if (isRebuildEndpoint) {
      if (request.method !== 'POST') {
        writeResponse(response, 405, 'Yalnız POST desteklenir.', { Allow: 'POST' });
        return;
      }
      if (projectConfig.mode !== 'local' || !isLoopback(request.socket.remoteAddress)) {
        writeResponse(response, 403, 'Bu bakım işlemi yalnız yerel geliştirme ortamında kullanılabilir.');
        return;
      }
      if (urlPath.endsWith('-export')) await handleRebuildExport(response);
      else await handleRebuildShare(response);
      return;
    }
    if (!['GET', 'HEAD'].includes(request.method || 'GET')) {
      writeResponse(response, 405, 'Yalnız GET ve HEAD desteklenir.', { Allow: 'GET, HEAD' });
      return;
    }
    const resolved = await resolveFile(request.url || '/');
    if (resolved.kind === 'blocked') { writeResponse(response, 404, 'Bulunamadı'); return; }
    if (resolved.kind === 'missing') { writeResponse(response, 404, 'Bulunamadı'); return; }
    const filePath = resolved.path;
    const info = await stat(filePath);
    const extension = extname(filePath).toLowerCase();
    const headers = {
      'Content-Type': contentTypes[extension] || 'application/octet-stream',
      'Content-Length': info.size,
      ...securityHeaders,
      'Cache-Control': filePath.endsWith('sw.js') ? 'no-cache, no-store, must-revalidate' : 'no-cache'
    };
    if (filePath.endsWith('sw.js')) headers['Service-Worker-Allowed'] = '/';
    response.writeHead(200, headers);
    if (request.method === 'HEAD') response.end();
    else createReadStream(filePath).pipe(response);
  } catch (error) {
    console.error(error);
    writeResponse(response, 500, 'Sunucu hatası');
  }
});

server.listen(port, host, () => {
  console.log(`\n${projectConfig.appName} hazır.`);
  console.log(`Çalışma modu: ${projectConfig.mode} • Veri: ${projectConfig.dataProvider}`);
  console.log(`Bilgisayar: http://localhost:${port}`);
  for (const entries of Object.values(os.networkInterfaces())) {
    for (const network of entries || []) {
      if (network.family === 'IPv4' && !network.internal) console.log(`Telefon:     http://${network.address}:${port}`);
    }
  }
  console.log('\nKapatmak için Ctrl+C tuşlarına basın.\n');
});
