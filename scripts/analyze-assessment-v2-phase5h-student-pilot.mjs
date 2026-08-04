import fs from 'node:fs';
import path from 'node:path';
import { analyzeLaunchPilotStudentResponses } from '../js/assessment-v2/launch-pilot-student-analysis.js';
import { evaluateControlledLaunchPilotGate, auditControlledLaunchPilotGate } from '../js/assessment-v2/controlled-launch-pilot-gate.js';
import { ASSESSMENT_V2_LAUNCH_PILOT_CONTENT_QUALITY_AUDIT } from '../js/assessment-v2/launch-pilot-content-quality.js';

const input = process.argv[2];
if (!input) {
  console.error('Kullanım: node scripts/analyze-assessment-v2-phase5h-student-pilot.mjs <responses.json> [output.json]');
  process.exit(2);
}
const root = process.cwd();
function readJson(file, fallback = null) {
  try { return JSON.parse(fs.readFileSync(path.resolve(root, file), 'utf8')); }
  catch { return fallback; }
}
function writeJson(file, value) {
  const output = path.resolve(root, file);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(value, null, 2)}\n`);
  return output;
}

let raw;
try { raw = JSON.parse(fs.readFileSync(path.resolve(input), 'utf8')); }
catch (error) { console.error(`Girdi okunamadı: ${error.message}`); process.exit(2); }
const responses = Array.isArray(raw) ? raw : raw?.responses;
if (!Array.isArray(responses)) { console.error('JSON responses dizisi içermelidir.'); process.exit(2); }

const analysis = analyzeLaunchPilotStudentResponses({ rows: responses });
const consensus = readJson('quality-reports/assessment-v2-phase5h-launch-pilot-human-consensus.json');
const adaptations = readJson('quality-reports/assessment-v2-phase5h-launch-pilot-approved-adaptations.json');
const phase5g = readJson('quality-reports/assessment-v2-phase5g-technical-release.json', {});
const privacyChecklist = readJson('public/assessment-v2-phase5h-privacy-checklist.json', readJson('public/assessment-v2-phase5h-privacy-checklist-template.json'));
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
  studentPilotAnalysis: analysis,
  technicalReleaseEvidence: technicalEvidence,
  privacyChecklist
});
const gateAudit = auditControlledLaunchPilotGate(controlledGate);
const report = {
  schemaVersion: '1.0',
  phase: '5H',
  generatedAt: new Date().toISOString(),
  status: analysis.status,
  productReady: false,
  publicProductionReleaseAllowed: false,
  analysis,
  controlledGate,
  controlledGateAudit: gateAudit,
  nextAction: controlledGate.controlledPilotReady
    ? 'Kontrollü pilot kanıtı tamamlandı; kamu production yayını için ayrı release kararı oluştur.'
    : 'Kontrollü kapıdaki blocker listesini kapat; otomatik kamu yayını yapma.'
};
const output = writeJson(process.argv[3] || 'quality-reports/assessment-v2-phase5h-student-pilot-analysis.json', report);
console.log(JSON.stringify({
  status: analysis.status,
  evidenceType: analysis.evidenceType,
  participants: analysis.metrics.participantCount,
  responses: analysis.metrics.responseCount,
  passedItems: analysis.metrics.technicalPassItemCount,
  controlledPilotReady: controlledGate.controlledPilotReady,
  blockers: controlledGate.blockers,
  output
}, null, 2));
if (analysis.status === 'INVALID_DATA' || !gateAudit.ok) process.exitCode = 1;
