import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { evaluateCoreGameReleaseReadiness, auditCoreGameReleaseReadiness } from '../js/assessment-v2/core-game-release-gate.js';

const out = path.resolve('quality-reports');
fs.mkdirSync(out, { recursive: true });

function readJson(name, fallback) {
  const file = path.join(out, name);
  if (!fs.existsSync(file)) return fallback;
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (error) { return { ...fallback, parseError: error.message, file }; }
}

function git(command) {
  try { return execFileSync('git', command, { encoding: 'utf8' }).trim(); }
  catch { return ''; }
}

const liveBattery = readJson('stage09-live-platform-sharded-500.json', { status: 'MISSING' });
const buildEvidence = readJson('assessment-v2-phase5g-build-evidence.json', { status: 'NOT_MEASURED' });
const accessibilityEvidence = readJson('assessment-v2-phase5g-accessibility-evidence.json', { status: 'NOT_MEASURED' });
const securityEvidence = readJson('assessment-v2-phase5g-security-evidence.json', { status: 'NOT_MEASURED' });
const readiness = evaluateCoreGameReleaseReadiness({ liveBattery, buildEvidence, accessibilityEvidence, securityEvidence });
const audit = auditCoreGameReleaseReadiness(readiness);
const technicalChecks = readiness.checks.filter((check) => ['live-game-battery', 'production-build', 'accessibility', 'security'].includes(check.id));
const report = {
  schemaVersion: '1.0',
  phase: '5G',
  generatedAt: new Date().toISOString(),
  commit: git(['rev-parse', 'HEAD']),
  branch: git(['branch', '--show-current']),
  technicalStatus: technicalChecks.every((check) => check.passed) ? 'PASS' : 'BLOCKED',
  coreReleaseReady: readiness.releaseReady,
  productReady: false,
  fullProductReady: false,
  evidence: { liveBattery, buildEvidence, accessibilityEvidence, securityEvidence },
  readiness,
  audit,
  metrics: {
    technicalChecks: technicalChecks.length,
    technicalPassed: technicalChecks.filter((check) => check.passed).length,
    totalChecks: readiness.metrics.checkCount,
    totalPassed: readiness.metrics.passed,
    totalBlocked: readiness.metrics.blocked
  }
};
const reportFile = path.join(out, 'assessment-v2-phase5g-technical-release.json');
fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
const rows = readiness.checks.map((check) => `<tr><td>${check.label}</td><td class="${check.passed ? 'pass' : 'block'}">${check.passed ? 'PASS' : 'BLOCKED'}</td><td>${check.blocker || '—'}</td></tr>`).join('');
fs.writeFileSync(path.join(out, 'assessment-v2-phase5g-technical-release-dashboard.html'), `<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Phase 5G Teknik Yayın Kapısı</title><style>body{font:15px/1.5 Segoe UI;background:#07111f;color:#eef6ff;max-width:1100px;margin:auto;padding:28px}header,section{background:#10243d;border:1px solid #29445f;border-radius:18px;padding:20px;margin:14px 0}table{width:100%;border-collapse:collapse}td,th{padding:12px;border-bottom:1px solid #29445f;text-align:left}.pass{color:#86efac}.block{color:#fdba74}</style><header><h1>Phase 5G · Teknik Yayın Kapısı</h1><p>Teknik durum: <strong class="${report.technicalStatus === 'PASS' ? 'pass' : 'block'}">${report.technicalStatus}</strong></p><p>Genel çekirdek yayın: ${readiness.status}</p></header><section><table><thead><tr><th>Kapı</th><th>Durum</th><th>Engel</th></tr></thead><tbody>${rows}</tbody></table></section></html>`);
console.log(JSON.stringify({ technicalStatus: report.technicalStatus, coreReleaseReady: report.coreReleaseReady, metrics: report.metrics, blockers: readiness.blockers, file: reportFile }, null, 2));
if (!audit.ok) process.exitCode = 1;
