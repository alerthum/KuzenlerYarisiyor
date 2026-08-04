import { ASSESSMENT_V2_LAUNCH_PILOT_CANDIDATE_POOL_AUDIT } from './launch-pilot-candidate-pool.js';
import { ASSESSMENT_V2_LAUNCH_PILOT_ASSIGNMENT_PLAN_AUDIT } from './launch-pilot-assignment-plan.js';
import { ASSESSMENT_V2_LAUNCH_PILOT_CONTENT_QUALITY_AUDIT } from './launch-pilot-content-quality.js';

const freeze = (value) => {
  if (Array.isArray(value)) return Object.freeze(value.map(freeze));
  if (value && typeof value === 'object') return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, child]) => [key, freeze(child)])));
  return value;
};

export function evaluateControlledLaunchPilotGate({
  candidatePoolAudit = ASSESSMENT_V2_LAUNCH_PILOT_CANDIDATE_POOL_AUDIT,
  assignmentPlanAudit = ASSESSMENT_V2_LAUNCH_PILOT_ASSIGNMENT_PLAN_AUDIT,
  contentQualityAudit = ASSESSMENT_V2_LAUNCH_PILOT_CONTENT_QUALITY_AUDIT,
  humanReviewConsensus = null,
  adaptationEvidence = null,
  studentPilotAnalysis = null,
  technicalReleaseEvidence = null,
  privacyChecklist = null
} = {}) {
  const checks = [];
  const add = (id, label, passed, evidence, blocker) => checks.push({ id, label, passed: Boolean(passed), evidence, blocker: passed ? null : blocker });
  add('candidate-pool', '30 görev, 24 hücre ve 23 oyun dengeli aday havuzu', candidatePoolAudit?.ok === true, candidatePoolAudit, 'Kontrollü pilot aday havuzu denetimi geçmedi.');
  add('content-quality', '30/30 gerçek metin, kazanım, şık/rubrik ve oyun-native kalite denetimi', contentQualityAudit?.ok === true && contentQualityAudit?.metrics?.passed === 30, contentQualityAudit, 'Pilot görevlerin içerik kalite denetimi geçmedi.');
  add('assignment-plan', '100 öğrenci slotu ve görev başına 80 yanıt planı', assignmentPlanAudit?.ok === true, assignmentPlanAudit, 'Öğrenci atama planı dengeli değil.');
  add('human-review', '30/30 görev insan onayı ve oyun rotası doğrulaması', humanReviewConsensus?.status === 'HUMAN_REVIEW_COMPLETE' && humanReviewConsensus?.metrics?.approvedForAdaptation === 30, humanReviewConsensus || { status: 'MISSING' }, '30 pilot görevinin insan incelemesi tamamlanmadı.');
  add('semantic-adaptation', '30/30 semantik round-trip ve 23 oyun rotası', adaptationEvidence?.status === 'ADAPTATION_READY_FOR_STUDENT_PILOT' && adaptationEvidence?.adaptedCount === 30 && adaptationEvidence?.semanticRoundTripPassCount === 30 && adaptationEvidence?.representedGameCount === 23, adaptationEvidence || { status: 'MISSING' }, 'İnsan onaylı görevlerin oyun adaptasyonu ve semantik round-trip kanıtı eksik.');
  add('real-student-pilot', '100+ anonim öğrenci ve görev başına 80+ gerçek yanıt', studentPilotAnalysis?.status === 'PILOT_PASS' && studentPilotAnalysis?.evidenceType === 'REAL_STUDENT_PILOT' && studentPilotAnalysis?.metrics?.participantCount >= 100 && studentPilotAnalysis?.items?.length === 30 && studentPilotAnalysis.items.every((item) => item.status === 'PILOT_PASS' && item.responseCount >= 80), studentPilotAnalysis || { status: 'MISSING' }, 'Gerçek öğrenci pilotu yayın eşiğini geçmedi.');
  add('technical-release', 'Phase 5G teknik yayın kanıtı', technicalReleaseEvidence?.status === 'PASS' && technicalReleaseEvidence?.technicalStatus === 'PASS', technicalReleaseEvidence || { status: 'MISSING' }, 'Teknik yayın kanıtı PASS değil.');
  add('privacy-consent', 'Anonimlik, veli/onam, okul yetkisi, salt güvenliği ve veri saklama kontrolü', privacyChecklist?.status === 'PASS' && privacyChecklist?.piiCollectionAllowed === false && privacyChecklist?.consentEvidenceRecorded === true && privacyChecklist?.guardianConsentTemplatePrepared === true && privacyChecklist?.schoolAuthorizationRecorded === true && privacyChecklist?.pilotSaltStoredOutsideClient === true && privacyChecklist?.retentionPolicyAccepted === true, privacyChecklist || { status: 'MISSING' }, 'Pilot gizlilik, onam, okul yetkisi, anonimleştirme saltı veya saklama politikası tamamlanmadı.');
  const controlledPilotReady = checks.every((check) => check.passed);
  return freeze({
    schemaVersion: '1.0',
    phase: '5H',
    status: controlledPilotReady ? 'CONTROLLED_LAUNCH_PILOT_READY' : 'CONTROLLED_LAUNCH_PILOT_BLOCKED',
    controlledPilotReady,
    publicationAllowed: controlledPilotReady,
    publicProductionReleaseAllowed: false,
    fullProductReady: false,
    checks,
    blockers: checks.filter((check) => !check.passed).map((check) => check.blocker),
    metrics: { checkCount: checks.length, passed: checks.filter((check) => check.passed).length, blocked: checks.filter((check) => !check.passed).length }
  });
}

export function auditControlledLaunchPilotGate(result = evaluateControlledLaunchPilotGate()) {
  const errors = [];
  if (result.checks.length !== 8) errors.push(`check-count:${result.checks.length}`);
  if (result.controlledPilotReady !== result.checks.every((check) => check.passed)) errors.push('derivation');
  if (result.publicationAllowed !== result.controlledPilotReady) errors.push('publication-mismatch');
  if (result.publicProductionReleaseAllowed !== false || result.fullProductReady !== false) errors.push('scope-leak');
  if (!result.controlledPilotReady && result.blockers.length === 0) errors.push('missing-blockers');
  return freeze({ ok: errors.length === 0, errors, metrics: result.metrics });
}

export const ASSESSMENT_V2_CONTROLLED_LAUNCH_PILOT_GATE = evaluateControlledLaunchPilotGate();
export const ASSESSMENT_V2_CONTROLLED_LAUNCH_PILOT_GATE_AUDIT = auditControlledLaunchPilotGate(ASSESSMENT_V2_CONTROLLED_LAUNCH_PILOT_GATE);
