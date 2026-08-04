import fs from 'node:fs';
import path from 'node:path';
import {
  auditLaunchPilotReviewDecisions,
  buildLaunchPilotReviewConsensus
} from '../js/assessment-v2/launch-pilot-human-review.js';
import {
  materializeLaunchPilotAdaptations,
  auditLaunchPilotAdaptations
} from '../js/assessment-v2/launch-pilot-adaptation.js';
import { evaluateControlledLaunchPilotGate, auditControlledLaunchPilotGate } from '../js/assessment-v2/controlled-launch-pilot-gate.js';
import { ASSESSMENT_V2_LAUNCH_PILOT_CONTENT_QUALITY_AUDIT } from '../js/assessment-v2/launch-pilot-content-quality.js';

const inputFiles = process.argv.slice(2);
if (!inputFiles.length) {
  console.error('Kullanım: node scripts/analyze-assessment-v2-phase5h-reviews.mjs <karar1.json> [karar2.json ...]');
  process.exit(2);
}

const root = process.cwd();
const reportDir = path.resolve(root, 'quality-reports');
fs.mkdirSync(reportDir, { recursive: true });

function readJson(file) {
  const resolved = path.resolve(file);
  const raw = JSON.parse(fs.readFileSync(resolved, 'utf8'));
  const decisions = Array.isArray(raw) ? raw : raw?.decisions;
  if (!Array.isArray(decisions)) throw new Error(`${file}:decisions-array-required`);
  return { file: resolved, decisions };
}
function writeJson(file, value) {
  fs.writeFileSync(path.resolve(root, file), `${JSON.stringify(value, null, 2)}\n`);
}
function readJsonIfExists(file, fallback = null) {
  try { return JSON.parse(fs.readFileSync(path.resolve(root, file), 'utf8')); }
  catch { return fallback; }
}

let bundles;
try {
  bundles = inputFiles.map(readJson);
} catch (error) {
  console.error(error.message);
  process.exit(2);
}

const decisions = bundles.flatMap((bundle) => bundle.decisions);
const decisionAudit = auditLaunchPilotReviewDecisions(decisions);
if (!decisionAudit.ok) {
  const invalid = {
    schemaVersion: '1.0',
    phase: '5H',
    generatedAt: new Date().toISOString(),
    status: 'INVALID_REVIEW_INPUT',
    inputFiles: bundles.map((bundle) => bundle.file),
    submittedDecisionCount: decisions.length,
    errors: decisionAudit.errors
  };
  writeJson('quality-reports/assessment-v2-phase5h-human-review-analysis.json', invalid);
  console.error(JSON.stringify(invalid, null, 2));
  process.exit(1);
}

const consensus = buildLaunchPilotReviewConsensus({ decisions: decisionAudit.rows });
const adaptations = materializeLaunchPilotAdaptations({ consensus });
const adaptationAudit = auditLaunchPilotAdaptations(adaptations);
const phase5g = readJsonIfExists('quality-reports/assessment-v2-phase5g-technical-release.json', {});
const privacyChecklist = readJsonIfExists('public/assessment-v2-phase5h-privacy-checklist.json', readJsonIfExists('public/assessment-v2-phase5h-privacy-checklist-template.json', null));
const technicalEvidence = {
  status: phase5g.technicalStatus === 'PASS' ? 'PASS' : 'FAIL',
  technicalStatus: phase5g.technicalStatus || 'NOT_MEASURED',
  sourcePhase: phase5g.phase || '5G',
  sourceCommit: phase5g.commit || null,
  metrics: phase5g.metrics || null
};
const controlledGate = evaluateControlledLaunchPilotGate({
  contentQualityAudit: ASSESSMENT_V2_LAUNCH_PILOT_CONTENT_QUALITY_AUDIT,
  humanReviewConsensus: consensus,
  adaptationEvidence: adaptations,
  technicalReleaseEvidence: technicalEvidence,
  privacyChecklist
});
const gateAudit = auditControlledLaunchPilotGate(controlledGate);
const roles = Object.fromEntries([...new Set(decisionAudit.rows.map((row) => row.reviewerRole))].sort().map((role) => [role, decisionAudit.rows.filter((row) => row.reviewerRole === role).length]));
const reviewers = [...new Set(decisionAudit.rows.map((row) => row.reviewerAnonId))].sort();
const result = {
  schemaVersion: '1.0',
  phase: '5H',
  generatedAt: new Date().toISOString(),
  status: consensus.status === 'HUMAN_REVIEW_COMPLETE' && adaptationAudit.ok && adaptations.status === 'ADAPTATION_READY_FOR_STUDENT_PILOT'
    ? 'HUMAN_REVIEW_AND_ADAPTATION_COMPLETE'
    : 'HUMAN_REVIEW_IN_PROGRESS',
  productReady: false,
  publicProductionReleaseAllowed: false,
  inputFiles: bundles.map((bundle) => bundle.file),
  submittedDecisionCount: decisions.length,
  normalizedDecisionCount: decisionAudit.rows.length,
  reviewerCount: reviewers.length,
  reviewers,
  roleDecisionCounts: roles,
  decisionAudit: { ok: decisionAudit.ok, errors: decisionAudit.errors },
  consensusMetrics: consensus.metrics,
  adaptationMetrics: {
    status: adaptations.status,
    adaptedCount: adaptations.adaptedCount,
    semanticRoundTripPassCount: adaptations.semanticRoundTripPassCount,
    representedGameCount: adaptations.representedGameCount,
    blockerCount: adaptations.blockers.length
  },
  adaptationAudit,
  controlledGate: controlledGate.metrics,
  controlledGateAudit: gateAudit,
  nextAction: consensus.status === 'HUMAN_REVIEW_COMPLETE'
    ? 'Gizlilik/onam kontrolünü tamamlayıp gerçek öğrenci pilotunu başlat.'
    : 'PENDING, MORE_REVIEWS_REQUIRED veya REVISION_REQUIRED görevleri insan incelemesinde tamamla.'
};

writeJson('quality-reports/assessment-v2-phase5h-launch-pilot-human-consensus.json', consensus);
writeJson('quality-reports/assessment-v2-phase5h-launch-pilot-approved-adaptations.json', adaptations);
writeJson('quality-reports/assessment-v2-phase5h-controlled-launch-gate-after-reviews.json', controlledGate);
writeJson('quality-reports/assessment-v2-phase5h-human-review-analysis.json', result);

console.log(JSON.stringify(result, null, 2));
if (!adaptationAudit.ok || !gateAudit.ok) process.exitCode = 1;
