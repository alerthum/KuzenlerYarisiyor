import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const npm = spawnSync('npm', ['run', 'test:mutation'], {
  cwd: process.cwd(),
  encoding: 'utf8',
  shell: true,
  stdio: 'inherit'
});

let score = null;
const reportPath = 'quality-reports/mutation/mutation-report.json';
if (existsSync(reportPath)) {
  const report = JSON.parse(readFileSync(reportPath, 'utf8'));
  score = report.mutationScore
    ?? report.metrics?.mutationScore
    ?? report.systemUnderTestMetrics?.mutationScore
    ?? null;
  if (score == null) {
    // Stryker schema: files map with mutant status arrays
    const files = report.files ? Object.values(report.files) : [];
    let killed = 0;
    let survived = 0;
    let timeout = 0;
    let noCov = 0;
    for (const file of files) {
      if (Array.isArray(file.mutants)) {
        for (const m of file.mutants) {
          if (m.status === 'Killed') killed += 1;
          else if (m.status === 'Survived') survived += 1;
          else if (m.status === 'TimedOut') timeout += 1;
          else if (m.status === 'NoCoverage') noCov += 1;
        }
      } else {
        killed += Number(file.killed || 0);
        survived += Number(file.survived || 0);
        timeout += Number(file.timeout || 0);
        noCov += Number(file.noCoverage || 0);
      }
    }
    const total = killed + survived + timeout + noCov;
    if (total > 0) score = Math.round((killed / total) * 10000) / 100;
  }
}

const index = JSON.parse(readFileSync('FINAL_EVIDENCE_INDEX.json', 'utf8'));
if (Number.isFinite(Number(score))) {
  index.actual.mutationScorePercent = Number(score);
}
index.reports.mutation = existsSync(reportPath) ? reportPath : 'quality-reports/mutation/index.html';
index.lastAction = 'Mutation evidence kaydedildi';
index.lastTestResult = `mutation=${index.actual.mutationScorePercent} exit=${npm.status}`;
index.nextExactCommand = 'npm run test:e2e:full && node scripts/record-e2e-evidence.mjs';
writeFileSync('FINAL_EVIDENCE_INDEX.json', `${JSON.stringify(index, null, 2)}\n`);

spawnSync(process.execPath, ['scripts/sync-final-evidence-state.mjs'], {
  cwd: process.cwd(),
  encoding: 'utf8',
  stdio: 'inherit'
});

console.log(JSON.stringify({
  mutationScorePercent: index.actual.mutationScorePercent,
  npmStatus: npm.status
}, null, 2));

process.exit(Number(index.actual.mutationScorePercent) >= 90 ? 0 : 1);
