import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';

const root = process.cwd();
const testsDir = path.resolve('tests');
const concurrency = Math.max(1, Math.min(Number(process.argv[2] || 4), os.availableParallelism?.() || os.cpus().length || 2));
const timeoutMs = Math.max(10_000, Number(process.argv[3] || 180_000));
const retryCount = Math.max(0, Number(process.argv[4] || 1));
const output = path.resolve('quality-reports/phase5g-sharded-regression.json');
const progressOutput = path.resolve('quality-reports/phase5g-sharded-regression.progress.json');
const cacheRoot = path.resolve('quality-reports/phase5g-sharded-regression-cache');
const excludedNames = new Set(String(process.env.TEST_FILE_EXCLUDE || '')
  .split(',').map((name) => name.trim()).filter(Boolean));
const includedNames = new Set(String(process.env.TEST_FILE_INCLUDE || '')
  .split(',').map((name) => name.trim()).filter(Boolean));
const testFiles = fs.readdirSync(testsDir)
  .filter((name) => name.endsWith('.test.mjs'))
  .filter((name) => includedNames.size === 0 || includedNames.has(name))
  .filter((name) => !excludedNames.has(name))
  .sort()
  .map((name) => path.join('tests', name));

function atomicWrite(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(value, null, 2));
  fs.renameSync(temp, file);
}

function collectFiles(target, result = []) {
  if (!fs.existsSync(target)) return result;
  const stat = fs.statSync(target);
  if (stat.isFile()) {
    result.push(target);
    return result;
  }
  for (const name of fs.readdirSync(target).sort()) {
    if (['node_modules', 'dist', 'coverage', 'quality-reports', '.git'].includes(name)) continue;
    collectFiles(path.join(target, name), result);
  }
  return result;
}

function workspaceFingerprint() {
  const hash = crypto.createHash('sha256');
  const roots = ['js', 'scripts', 'tests', 'server.mjs', 'package.json', 'firestore.rules'];
  const files = roots.flatMap((entry) => collectFiles(path.resolve(entry)))
    .filter((file) => /\.(?:js|mjs|cjs|json|rules)$/.test(file) || path.basename(file) === 'package.json')
    .sort();
  for (const file of files) {
    hash.update(path.relative(root, file));
    hash.update('\0');
    hash.update(fs.readFileSync(file));
    hash.update('\0');
  }
  return hash.digest('hex');
}

const fingerprint = workspaceFingerprint();
const cacheDir = path.join(cacheRoot, fingerprint);

function cacheFileFor(file) {
  return path.join(cacheDir, `${path.basename(file, '.test.mjs')}.json`);
}

function readCachedPass(file) {
  const cacheFile = cacheFileFor(file);
  if (!fs.existsSync(cacheFile)) return null;
  try {
    const row = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    return row.fingerprint === fingerprint && row.file === file && row.status === 'PASS'
      ? { ...row, cached: true }
      : null;
  } catch {
    return null;
  }
}

function killProcessTree(child) {
  if (!child?.pid) return;
  try {
    if (process.platform !== 'win32') process.kill(-child.pid, 'SIGKILL');
    else child.kill('SIGKILL');
  } catch {
    try { child.kill('SIGKILL'); } catch {}
  }
}

function runFile(file, attempt) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const child = spawn(process.execPath, ['--test', '--test-force-exit', file], {
      cwd: root,
      detached: process.platform !== 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, NODE_NO_WARNINGS: '1' }
    });
    let stdout = '';
    let stderr = '';
    const maxCapture = 2_000_000;
    let timedOut = false;
    let settled = false;
    let forceFinalizeTimer = null;

    const append = (current, chunk) => current.length >= maxCapture
      ? current
      : `${current}${String(chunk)}`.slice(0, maxCapture);
    child.stdout.on('data', (chunk) => { stdout = append(stdout, chunk); });
    child.stderr.on('data', (chunk) => { stderr = append(stderr, chunk); });

    const finalize = ({ exitCode = null, signal = null, error = null } = {}) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (forceFinalizeTimer) clearTimeout(forceFinalizeTimer);
      try { child.stdout.destroy(); } catch {}
      try { child.stderr.destroy(); } catch {}
      const match = stdout.match(/# tests\s+(\d+)[\s\S]*?# pass\s+(\d+)[\s\S]*?# fail\s+(\d+)/);
      resolve({
        file,
        attempt,
        fingerprint,
        status: exitCode === 0 && !timedOut && !error ? 'PASS' : 'FAIL',
        exitCode,
        signal,
        timedOut,
        durationMs: Date.now() - startedAt,
        error,
        metrics: match ? { tests: Number(match[1]), pass: Number(match[2]), fail: Number(match[3]) } : null,
        stdoutTail: stdout.slice(-10_000),
        stderrTail: stderr.slice(-10_000)
      });
    };

    const timer = setTimeout(() => {
      timedOut = true;
      killProcessTree(child);
      forceFinalizeTimer = setTimeout(() => finalize({ signal: 'SIGKILL', error: 'timeout process tree did not close cleanly' }), 5_000);
    }, timeoutMs);

    child.once('error', (error) => finalize({ error: error.message }));
    child.once('close', (exitCode, signal) => finalize({ exitCode, signal }));
  });
}

const startedAt = Date.now();
const queue = [...testFiles];
const finalResults = [];
const attempts = [];
let completed = 0;

function writeProgress() {
  atomicWrite(progressOutput, {
    schemaVersion: '2.0',
    status: 'RUNNING',
    fingerprint,
    totalFiles: testFiles.length,
    excludedFiles: [...excludedNames],
    includedFiles: [...includedNames],
    completedFiles: completed,
    passedFiles: finalResults.filter((row) => row.status === 'PASS').length,
    cachedFiles: finalResults.filter((row) => row.cached).length,
    failedFiles: finalResults.filter((row) => row.status !== 'PASS').map((row) => row.file),
    completed: finalResults.map((row) => ({ file: row.file, status: row.status, cached: Boolean(row.cached), durationMs: row.durationMs })),
    updatedAt: new Date().toISOString()
  });
}

async function worker(workerId) {
  while (queue.length) {
    const file = queue.shift();
    const cached = readCachedPass(file);
    let result = cached;
    if (cached) {
      console.log(`[${completed + 1}/${testFiles.length}] worker=${workerId} CACHE ${file}`);
    } else {
      for (let attempt = 0; attempt <= retryCount; attempt += 1) {
        console.log(`[${completed + 1}/${testFiles.length}] worker=${workerId} START ${file} attempt=${attempt + 1}`);
        result = await runFile(file, attempt + 1);
        attempts.push(result);
        if (result.status === 'PASS') break;
        console.error(`[RETRY] ${file} status=${result.status} timeout=${result.timedOut} exit=${result.exitCode}`);
      }
      if (result.status === 'PASS') atomicWrite(cacheFileFor(file), result);
    }
    finalResults.push(result);
    completed += 1;
    console.log(`[${completed}/${testFiles.length}] ${result.status}${result.cached ? '/CACHE' : ''} ${file} ${result.durationMs}ms`);
    writeProgress();
  }
}

await Promise.all(Array.from({ length: Math.min(concurrency, testFiles.length) }, (_, index) => worker(index + 1)));
finalResults.sort((a, b) => a.file.localeCompare(b.file));
const failures = finalResults.filter((row) => row.status !== 'PASS');
const metrics = finalResults.reduce((sum, row) => ({
  tests: sum.tests + (row.metrics?.tests || 0),
  pass: sum.pass + (row.metrics?.pass || 0),
  fail: sum.fail + (row.metrics?.fail || 0)
}), { tests: 0, pass: 0, fail: 0 });
const report = {
  schemaVersion: '2.0',
  status: failures.length === 0 ? 'PASS' : 'FAIL',
  executionMode: 'PROCESS_GROUP_PER_TEST_FILE_WITH_TIMEOUT_RETRY_PROGRESS_AND_FINGERPRINT_CACHE',
  command: `node scripts/run-test-files-sharded.mjs ${concurrency} ${timeoutMs} ${retryCount}`,
  fingerprint,
  concurrency,
  timeoutMs,
  retryCount,
  excludedFiles: [...excludedNames],
  includedFiles: [...includedNames],
  totalFiles: testFiles.length,
  passedFiles: finalResults.length - failures.length,
  failedFiles: failures.length,
  cachedFiles: finalResults.filter((row) => row.cached).length,
  metrics,
  durationMs: Date.now() - startedAt,
  failures,
  results: finalResults,
  attempts,
  generatedAt: new Date().toISOString()
};
atomicWrite(output, report);
atomicWrite(progressOutput, {
  schemaVersion: '2.0', status: report.status, fingerprint, totalFiles: report.totalFiles, completedFiles: report.totalFiles,
  passedFiles: report.passedFiles, cachedFiles: report.cachedFiles, failedFiles: failures.map((row) => row.file), updatedAt: report.generatedAt
});
console.log(JSON.stringify({ status: report.status, totalFiles: report.totalFiles, passedFiles: report.passedFiles, cachedFiles: report.cachedFiles, failedFiles: failures.map((row) => row.file), metrics, durationMs: report.durationMs, file: output }, null, 2));
if (report.status !== 'PASS') process.exitCode = 1;
