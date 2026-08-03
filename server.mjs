import http from 'node:http';
import { stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { extname, join, normalize, relative } from 'node:path';
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

const root = fileURLToPath(new URL('.', import.meta.url));
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
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  });
  response.end(body);
}

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const cleaned = normalize(decoded).replace(/^([/\\])+/, '');
  const fullPath = join(root, cleaned || 'index.html');
  const rel = relative(root, fullPath);
  if (rel.startsWith('..') || rel.includes(`..${process.platform === 'win32' ? '\\' : '/'}`)) return null;
  return fullPath;
}

async function resolveFile(requestPath) {
  let target = safePath(requestPath);
  if (!target) return null;
  try {
    const info = await stat(target);
    if (info.isDirectory()) target = join(target, 'index.html');
    return target;
  } catch {
    return join(root, 'index.html');
  }
}

const server = http.createServer(async (request, response) => {
  try {
    const urlPath = (request.url || '/').split('?')[0];
    if (urlPath === '/api/rebuild-command-center-export'
      && (request.method === 'POST' || request.method === 'GET')) {
      await handleRebuildExport(response);
      return;
    }
    if (urlPath === '/api/rebuild-command-center-share'
      && (request.method === 'POST' || request.method === 'GET')) {
      await handleRebuildShare(response);
      return;
    }
    const filePath = await resolveFile(request.url || '/');
    if (!filePath) { response.writeHead(400); response.end('Geçersiz istek'); return; }
    const info = await stat(filePath);
    const extension = extname(filePath).toLowerCase();
    const headers = {
      'Content-Type': contentTypes[extension] || 'application/octet-stream',
      'Content-Length': info.size,
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cache-Control': filePath.endsWith('sw.js') ? 'no-cache, no-store, must-revalidate' : 'no-cache'
    };
    if (filePath.endsWith('sw.js')) headers['Service-Worker-Allowed'] = '/';
    response.writeHead(200, headers);
    createReadStream(filePath).pipe(response);
  } catch (error) {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end(`Sunucu hatası: ${error instanceof Error ? error.message : String(error)}`);
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
