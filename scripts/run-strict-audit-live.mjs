#!/usr/bin/env node
/**
 * Strict audit canlı telemetri runner.
 * Yalnız sabit komutu çalıştırır: npm run quality:product-acceptance:strict:core
 * Dışarıdan rastgele shell komutu kabul ETMEZ.
 */
import { spawn } from 'node:child_process';
import { existsSync, watch } from 'node:fs';
import { randomUUID } from 'node:crypto';
import {
  FIXED_CORE_COMMAND,
  HEARTBEAT_MS,
  STALL_SECONDS,
  PROGRESS_PATH,
  LIVE_PATH,
  applyProgressEventToLive,
  createEmptyLiveState,
  detectStall,
  finalizeStatusFromExit,
  expectedFullWorkUnits,
  loadCheckpoint,
  pushRecentEvent,
  readJsonSafe,
  writeLiveAndProgress,
  computeElapsedSeconds,
  PHASE_LABELS
} from './lib/strict-audit-live-state.mjs';
import { buildCommandCenterExport } from './lib/command-center-export.mjs';
import { buildCommandCenterShare } from './lib/command-center-share.mjs';

const CORE_SCRIPT = 'scripts/run-product-acceptance-audit.mjs';
const runId = randomUUID();
const startedAt = new Date().toISOString();
const checkpoint = loadCheckpoint();
const resume = Boolean(checkpoint?.checkpoint);

let live = createEmptyLiveState({
  runId,
  status: 'STARTING',
  pid: process.pid,
  startedAt,
  lastHeartbeatAt: startedAt,
  updatedAt: startedAt,
  phase: 'starting',
  phaseLabel: PHASE_LABELS.starting,
  totalWorkUnits: expectedFullWorkUnits(),
  progressPercent: 0,
  completedWorkUnits: Number(checkpoint?.completedWorkUnits || 0),
  checkpoint: {
    lastCompletedGameId: checkpoint?.checkpoint?.lastCompletedGameId || null,
    lastCompletedGradeBand: checkpoint?.checkpoint?.lastCompletedGradeBand || null,
    nextGameId: checkpoint?.checkpoint?.nextGameId || null,
    nextGradeBand: checkpoint?.checkpoint?.nextGradeBand || null,
    completedPhases: checkpoint?.checkpoint?.completedPhases || [],
    completedGames: checkpoint?.checkpoint?.completedGames || [],
    completedGameBands: checkpoint?.checkpoint?.completedGameBands || []
  },
  lastActivityMessage: resume
    ? `Checkpoint’ten devam: sonraki ${checkpoint?.checkpoint?.nextGameId || 'faz'}`
    : 'Strict audit başlatılıyor…'
});
pushRecentEvent(live, 'INFO', resume ? 'Checkpoint’ten devam ediliyor.' : 'Yeni strict audit koşusu başladı.');
writeLiveAndProgress(live, {
  runId,
  startedAt,
  mode: 'full',
  resume,
  livePath: LIVE_PATH,
  last: null,
  games: {},
  events: []
});

let child = null;
let lastProgressFingerprint = '';
let shuttingDown = false;
let heartbeatTimer = null;
let stallTimer = null;
let progressWatcher = null;
let lastExportBuildAt = 0;
let exportBuildTimer = null;

/** Anlamlı ilerleme sonrası Komuta Merkezi birleşik export — throttle 15sn */
function scheduleCommandCenterExportBuild(force = false) {
  const now = Date.now();
  if (!force && now - lastExportBuildAt < 15000) {
    if (!exportBuildTimer) {
      exportBuildTimer = setTimeout(() => {
        exportBuildTimer = null;
        scheduleCommandCenterExportBuild(true);
      }, 15000 - (now - lastExportBuildAt));
    }
    return;
  }
  lastExportBuildAt = now;
  try {
    buildCommandCenterExport({ write: true });
  } catch (err) {
    console.warn('command-center-export build failed:', err?.message || err);
  }
  try {
    buildCommandCenterShare({ write: true });
  } catch (err) {
    console.warn('command-center-share build failed:', err?.message || err);
  }
}

function touchHeartbeat(extra = {}) {
  live = {
    ...live,
    ...extra,
    pid: child?.pid || process.pid,
    lastHeartbeatAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    elapsedSeconds: computeElapsedSeconds(live.startedAt)
  };
  if (live.status === 'STARTING') live.status = 'RUNNING';
  writeLiveAndProgress(live);
}

function syncFromProgressFile() {
  const progress = readJsonSafe(PROGRESS_PATH, null);
  if (!progress) return;
  const fp = `${progress.updatedAt}|${progress.elapsedMs}|${progress.last?.status}|${progress.last?.gameId}|${progress.last?.sessionIndex}`;
  if (fp === lastProgressFingerprint) return;
  lastProgressFingerprint = fp;

  if (progress.last) {
    live = applyProgressEventToLive(live, progress.last);
  }
  if (progress.games && typeof progress.games === 'object') {
    const done = Object.values(progress.games).filter((g) => g?.result?.status === 'done' || g?.lastStatus === 'phase_pass').length;
    if (done > live.completedGames) live.completedGames = done;
  }
  if (progress.checkpoint) {
    live.checkpoint = { ...live.checkpoint, ...progress.checkpoint };
  }
  if (progress.hangFail) {
    live.hangFail = progress.hangFail;
    live.lastError = 'HANG_FAIL';
    live.lastActivityMessage = `HANG_FAIL: ${progress.hangFail.gameId}`;
  }
  // Progress dosyasındaki sayaçlar
  const games = progress.games || {};
  let underfill = 0;
  for (const g of Object.values(games)) underfill += Number(g.underfill || 0) + Number(g.capacityFails || 0);
  if (underfill > live.underfillCount) live.underfillCount = underfill;

  live.lastHeartbeatAt = new Date().toISOString();
  live.updatedAt = new Date().toISOString();
  live.elapsedSeconds = computeElapsedSeconds(live.startedAt);
  if (['STARTING', 'STALLED'].includes(live.status)) live.status = 'RUNNING';
  writeLiveAndProgress(live, progress);
  scheduleCommandCenterExportBuild(false);
}

function checkStall() {
  if (shuttingDown) return;
  const alive = Boolean(child && !child.killed && child.exitCode == null);
  const { stalled, silenceSeconds } = detectStall(live, {
    processAlive: alive,
    stallSeconds: STALL_SECONDS
  });
  if (stalled) {
    live.status = 'STALLED';
    live.lastActivityMessage = `Bu işlem ${silenceSeconds} saniyedir ilerlemiyor (${Math.floor(silenceSeconds / 60)} dk).`;
    pushRecentEvent(live, 'WARN', live.lastActivityMessage);
    writeLiveAndProgress(live);
  } else if (!alive && live.exitCode == null && ['RUNNING', 'STARTING', 'STALLED'].includes(live.status)) {
    live.status = 'ABORTED';
    live.finishedAt = new Date().toISOString();
    live.lastActivityMessage = 'Çalışma tamamlanmadan durmuş.';
    pushRecentEvent(live, 'ERROR', live.lastActivityMessage);
    writeLiveAndProgress(live);
  }
}

function finish(exitCode) {
  if (shuttingDown) return;
  shuttingDown = true;
  clearInterval(heartbeatTimer);
  clearInterval(stallTimer);
  try { progressWatcher?.close?.(); } catch { /* ignore */ }

  syncFromProgressFile();
  const final = finalizeStatusFromExit({ exitCode });
  live.exitCode = exitCode;
  live.status = final.status;
  live.finishedAt = new Date().toISOString();
  live.elapsedSeconds = computeElapsedSeconds(live.startedAt);
  live.lastHeartbeatAt = live.finishedAt;
  live.phase = 'done';
  live.phaseLabel = PHASE_LABELS.done;
  live.lastActivityMessage = final.status === 'PASS'
    ? 'Strict ürün kabul PASS.'
    : `Strict ürün kabul ${final.status}: ${final.reason}`;
  pushRecentEvent(live, final.status === 'PASS' ? 'SUCCESS' : 'ERROR', live.lastActivityMessage);
  writeLiveAndProgress(live);
  scheduleCommandCenterExportBuild(true);
  console.log(JSON.stringify({
    runId,
    status: live.status,
    exitCode,
    reason: final.reason,
    livePath: LIVE_PATH,
    progressPath: PROGRESS_PATH,
    elapsedSeconds: live.elapsedSeconds
  }, null, 2));
  process.exit(final.status === 'PASS' ? 0 : (exitCode === 0 ? 2 : (exitCode ?? 3)));
}

// Sabit komut — argv ile rastgele shell YOK. Yalnız core script + resume bayrağı.
const args = [CORE_SCRIPT, '--live-parent', runId];
if (resume) args.push('--resume');

console.log('STRICT LIVE RUNNER:', FIXED_CORE_COMMAND, { runId, resume, args });
child = spawn(process.execPath, args, {
  cwd: process.cwd(),
  stdio: ['ignore', 'pipe', 'pipe'],
  env: {
    ...process.env,
    STRICT_AUDIT_LIVE: '1',
    STRICT_AUDIT_RUN_ID: runId,
    STRICT_AUDIT_RESUME: resume ? '1' : '0'
  }
});

live.status = 'RUNNING';
live.pid = child.pid;
live.lastActivityMessage = `Core PID ${child.pid} çalışıyor.`;
pushRecentEvent(live, 'INFO', live.lastActivityMessage);
writeLiveAndProgress(live);

child.stdout.on('data', (buf) => {
  const line = String(buf).trim();
  if (!line) return;
  // Çok gürültülü envanteri telemetriye basma
  if (line.includes('Orkestrasyon envanteri')) return;
  if (line.length < 240) {
    live.lastActivityMessage = line.slice(0, 200);
    touchHeartbeat();
  }
  process.stdout.write(buf);
});
child.stderr.on('data', (buf) => {
  process.stderr.write(buf);
  const msg = String(buf).trim().slice(0, 200);
  if (msg) {
    live.lastError = msg;
    pushRecentEvent(live, 'ERROR', msg);
    touchHeartbeat();
  }
});
child.on('error', (err) => {
  live.lastError = String(err?.message || err);
  finish(1);
});
child.on('exit', (code, signal) => {
  if (signal && code == null) {
    live.lastError = `signal:${signal}`;
    finish(1);
    return;
  }
  finish(code ?? 1);
});

heartbeatTimer = setInterval(() => {
  if (shuttingDown) return;
  touchHeartbeat();
  syncFromProgressFile();
}, HEARTBEAT_MS);

stallTimer = setInterval(checkStall, HEARTBEAT_MS);

if (existsSync(PROGRESS_PATH) || true) {
  try {
    progressWatcher = watch(PROGRESS_PATH, { persistent: false }, () => {
      try { syncFromProgressFile(); } catch { /* ignore */ }
    });
  } catch {
    /* watch opsiyonel */
  }
}

function abortHandler() {
  if (shuttingDown) return;
  try { child?.kill('SIGTERM'); } catch { /* ignore */ }
  live.status = 'ABORTED';
  live.lastActivityMessage = 'Çalışma tamamlanmadan durmuş.';
  live.finishedAt = new Date().toISOString();
  writeLiveAndProgress(live);
  process.exit(3);
}
process.on('SIGINT', abortHandler);
process.on('SIGTERM', abortHandler);
