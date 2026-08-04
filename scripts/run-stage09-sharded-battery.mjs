import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { STAGE09_ACTIVE_GAMES } from '../js/quality/session-composer-audit.js';
import { buildStage09SourceFingerprint } from './lib/stage09-source-fingerprint.mjs';

const totalPerGame = Number(process.argv[2] || 500);
const shardSize = Number(process.argv[3] || 100);
const requestedConcurrency = Number(process.argv[4] || Math.min(4, os.availableParallelism?.() || os.cpus().length || 2));
const timeoutMs = Math.max(60_000, Number(process.argv[5] || 300_000));
const maxRetries = Math.max(0, Number(process.argv[6] || 1));

if (!Number.isInteger(totalPerGame) || totalPerGame < 1) throw new Error('totalPerGame pozitif tam sayı olmalı');
if (!Number.isInteger(shardSize) || shardSize < 1) throw new Error('shardSize pozitif tam sayı olmalı');
if (totalPerGame % shardSize !== 0) throw new Error('totalPerGame shardSize ile tam bölünmeli');

const concurrency = Math.max(1, Math.min(requestedConcurrency, os.availableParallelism?.() || os.cpus().length || requestedConcurrency));
const shardCount = totalPerGame / shardSize;
const root = path.resolve('quality-reports/stage09-sharded', `${totalPerGame}-${shardSize}`);
const finalFile = path.resolve('quality-reports', `stage09-live-platform-sharded-${totalPerGame}.json`);
const progressFile = path.resolve('quality-reports', `stage09-live-platform-sharded-${totalPerGame}.progress.json`);
const worker = path.resolve('scripts/stage09-game-battery-worker.mjs');
const sourceEvidence = buildStage09SourceFingerprint(process.cwd());
fs.mkdirSync(root, { recursive: true });

const jobs = STAGE09_ACTIVE_GAMES.flatMap((gameId) =>
  Array.from({ length: shardCount }, (_, shardNo) => ({ gameId, shardNo, start: shardNo * shardSize }))
);

function fileOf(job) {
  return path.join(root, `${job.gameId}--${job.shardNo}.json`);
}

function readCached(job) {
  try {
    const row = JSON.parse(fs.readFileSync(fileOf(job), 'utf8'));
    return row.gameId === job.gameId
      && row.startSessionIndex === job.start
      && row.targetSessions === shardSize
      && row.produced === shardSize
      && row.sourceFingerprint === sourceEvidence.fingerprint
      && row.ok === true
      ? row
      : null;
  } catch {
    return null;
  }
}

function atomicWriteJson(file, value) {
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2));
  fs.renameSync(tmp, file);
}

const completed = new Map();
for (const job of jobs) {
  const hit = readCached(job);
  if (hit) completed.set(`${job.gameId}:${job.shardNo}`, hit);
}

const startedAt = Date.now();
let running = 0;
let finishedNew = 0;

function writeProgress(status = 'RUNNING') {
  const rows = [...completed.entries()].map(([key, result]) => ({ key, result }));
  atomicWriteJson(progressFile, {
    schemaVersion: '2.0',
    status,
    totalPerGame,
    shardSize,
    shardCount,
    gameCount: STAGE09_ACTIVE_GAMES.length,
    totalJobs: jobs.length,
    completedJobs: completed.size,
    cachedJobs: completed.size - finishedNew,
    newJobs: finishedNew,
    running,
    concurrency,
    timeoutMs,
    maxRetries,
    sourceFingerprint: sourceEvidence.fingerprint,
    sourceFileCount: sourceEvidence.fileCount,
    durationMs: Date.now() - startedAt,
    rows,
    generatedAt: new Date().toISOString()
  });
}

function runAttempt(job, attemptNo) {
  return new Promise((resolve) => {
    const jobStartedAt = Date.now();
    const label = `${job.gameId} shard=${job.shardNo + 1}/${shardCount}`;
    console.log(`[start] ${label} attempt=${attemptNo + 1}/${maxRetries + 1}`);
    const child = spawn(process.execPath, [worker, job.gameId, String(shardSize), String(job.start)], {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let out = '';
    let err = '';
    let settled = false;

    const settle = (row) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ ...row, attemptNo: attemptNo + 1, durationMs: row.durationMs ?? Date.now() - jobStartedAt });
    };

    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      setTimeout(() => settle({
        gameId: job.gameId,
        startSessionIndex: job.start,
        produced: 0,
        targetSessions: shardSize,
        underfill: shardSize,
        semanticRepeats: 0,
        ok: false,
        infrastructureError: `timeout:${timeoutMs}`
      }), 2_000).unref();
    }, timeoutMs);

    child.stdout.on('data', (chunk) => { out += chunk; });
    child.stderr.on('data', (chunk) => { err += chunk; });
    child.on('error', (error) => settle({
      gameId: job.gameId,
      startSessionIndex: job.start,
      produced: 0,
      targetSessions: shardSize,
      underfill: shardSize,
      semanticRepeats: 0,
      ok: false,
      infrastructureError: `spawn:${error.message}`
    }));
    child.on('close', (code, signal) => {
      let row;
      try {
        row = JSON.parse(out.trim() || '{}');
      } catch (error) {
        row = {
          gameId: job.gameId,
          startSessionIndex: job.start,
          produced: 0,
          targetSessions: shardSize,
          underfill: shardSize,
          semanticRepeats: 0,
          ok: false,
          infrastructureError: `json:${error.message}`
        };
      }
      if (code !== 0 || signal) {
        row = {
          ...row,
          ok: false,
          infrastructureError: row.infrastructureError || `exit:${code ?? 'null'}:${signal || 'none'}`,
          stderr: err.slice(0, 2_000)
        };
      }
      settle(row);
    });
  });
}

async function runJob(job) {
  const hit = readCached(job);
  if (hit) return hit;
  let row;
  for (let attemptNo = 0; attemptNo <= maxRetries; attemptNo += 1) {
    row = await runAttempt(job, attemptNo);
    if (row.ok && row.produced === shardSize && row.startSessionIndex === job.start) break;
    if (attemptNo < maxRetries) console.log(`[retry] ${job.gameId} shard=${job.shardNo + 1}/${shardCount} reason=${row.infrastructureError || 'quality-gate'}`);
  }
  row = {
    ...row,
    sourceFingerprint: sourceEvidence.fingerprint,
    sourceFileCount: sourceEvidence.fileCount
  };
  atomicWriteJson(fileOf(job), row);
  return row;
}

const pendingJobs = jobs.filter((job) => !readCached(job));
console.log(JSON.stringify({
  status: 'STARTED',
  totalPerGame,
  shardSize,
  shardCount,
  gameCount: STAGE09_ACTIVE_GAMES.length,
  totalJobs: jobs.length,
  cachedJobs: jobs.length - pendingJobs.length,
  pendingJobs: pendingJobs.length,
  concurrency,
  timeoutMs,
  maxRetries
}));
writeProgress();

let cursor = 0;
async function lane() {
  while (cursor < pendingJobs.length) {
    const job = pendingJobs[cursor++];
    running += 1;
    writeProgress();
    const row = await runJob(job);
    running -= 1;
    finishedNew += 1;
    completed.set(`${job.gameId}:${job.shardNo}`, row);
    console.log(`[done] ${job.gameId} shard=${job.shardNo + 1}/${shardCount} ok=${row.ok} produced=${row.produced}/${shardSize} underfill=${row.underfill} repeats=${row.semanticRepeats} ms=${row.durationMs}`);
    writeProgress();
  }
}

await Promise.all(Array.from({ length: Math.min(concurrency, Math.max(1, pendingJobs.length)) }, () => lane()));

const games = STAGE09_ACTIVE_GAMES.map((gameId) => {
  const shards = Array.from({ length: shardCount }, (_, shardNo) => completed.get(`${gameId}:${shardNo}`)).filter(Boolean);
  return {
    gameId,
    shardCount,
    produced: shards.reduce((n, x) => n + Number(x.produced || 0), 0),
    targetSessions: totalPerGame,
    underfill: shards.reduce((n, x) => n + Number(x.underfill || 0), 0),
    semanticRepeats: shards.reduce((n, x) => n + Number(x.semanticRepeats || 0), 0),
    failedShards: shards.map((x, index) => ({ x, index })).filter(({ x }) => !x.ok).map(({ index }) => index),
    durationMs: shards.reduce((n, x) => n + Number(x.durationMs || 0), 0),
    shards,
    ok: shards.length === shardCount && shards.every((x) => x.ok)
  };
});

const report = {
  schemaVersion: '2.0',
  executionMode: 'RESUMABLE_SHARDED_PROCESS_PER_GAME',
  sessionsPerGame: totalPerGame,
  shardSize,
  shardCount,
  gameCount: games.length,
  totalSessions: games.length * totalPerGame,
  durationMs: Date.now() - startedAt,
  concurrency,
  timeoutMs,
  maxRetries,
  sourceFingerprint: sourceEvidence.fingerprint,
  sourceFileCount: sourceEvidence.fileCount,
  sourceFiles: sourceEvidence.files,
  results: games,
  underfill: games.reduce((n, x) => n + x.underfill, 0),
  semanticRepeats: games.reduce((n, x) => n + x.semanticRepeats, 0),
  failedGames: games.filter((x) => !x.ok).map((x) => x.gameId),
  allGamesOnSharedComposer: true,
  generatedAt: new Date().toISOString(),
  productReady: false
};
report.meetsStageGate = report.underfill === 0 && report.semanticRepeats === 0 && report.failedGames.length === 0;
atomicWriteJson(finalFile, report);
writeProgress(report.meetsStageGate ? 'PASS' : 'RED');
console.log(JSON.stringify({
  status: report.meetsStageGate ? 'PASS' : 'RED',
  gameCount: report.gameCount,
  totalSessions: report.totalSessions,
  underfill: report.underfill,
  semanticRepeats: report.semanticRepeats,
  failedGames: report.failedGames,
  durationMs: report.durationMs,
  file: finalFile
}, null, 2));
if (!report.meetsStageGate) process.exitCode = 1;
