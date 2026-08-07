import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

mkdirSync('quality-reports/final-evidence', { recursive: true });

const npm = spawnSync('npm', ['run', 'test:e2e:full'], {
  cwd: process.cwd(),
  encoding: 'utf8',
  shell: true,
  stdio: 'pipe'
});

const output = `${npm.stdout || ''}\n${npm.stderr || ''}`;
const passed = (output.match(/(\d+) passed/g) || []).pop();
const failed = (output.match(/(\d+) failed/g) || []).pop();
const passCount = passed ? Number(passed.match(/(\d+)/)[1]) : 0;
const failCount = failed ? Number(failed.match(/(\d+)/)[1]) : (npm.status === 0 ? 0 : 1);
const fullE2E = npm.status === 0 && failCount === 0 && passCount >= 5;

const report = {
  generatedAt: new Date().toISOString(),
  command: 'npm run test:e2e:full',
  exitCode: npm.status,
  passCount,
  failCount,
  fullE2E,
  includes: [
    'tests/e2e/full-student-admin.spec.mjs',
    'tests/e2e/smoke.spec.mjs',
    'tests/e2e/accessibility.spec.mjs'
  ],
  tail: output.slice(-4000)
};
writeFileSync('quality-reports/final-evidence/e2e-full.json', `${JSON.stringify(report, null, 2)}\n`);

const index = JSON.parse(readFileSync('FINAL_EVIDENCE_INDEX.json', 'utf8'));
index.actual.fullE2E = fullE2E;
index.actual.e2eSmokeOnly = fullE2E ? 0 : 3;
index.reports.e2e = 'quality-reports/final-evidence/e2e-full.json';
index.lastAction = 'Tam ogrenci+admin Playwright E2E';
index.lastTestResult = `fullE2E=${fullE2E} passed=${passCount} failed=${failCount} exit=${npm.status}`;
index.nextExactCommand = fullE2E
  ? 'node scripts/sync-final-evidence-state.mjs'
  : 'npm run test:e2e:full && node scripts/record-e2e-evidence.mjs';
writeFileSync('FINAL_EVIDENCE_INDEX.json', `${JSON.stringify(index, null, 2)}\n`);

spawnSync(process.execPath, ['scripts/sync-final-evidence-state.mjs'], {
  cwd: process.cwd(),
  encoding: 'utf8',
  stdio: 'inherit'
});

process.stdout.write(output.slice(-2000));
console.log(JSON.stringify({ fullE2E, passCount, failCount, exit: npm.status }, null, 2));
process.exit(fullE2E ? 0 : 1);
