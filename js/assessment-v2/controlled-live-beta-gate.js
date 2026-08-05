import { ASSESSMENT_V2_LAUNCH_PILOT_CANDIDATE_POOL_AUDIT } from './launch-pilot-candidate-pool.js';
import { ASSESSMENT_V2_LAUNCH_PILOT_CONTENT_QUALITY_AUDIT } from './launch-pilot-content-quality.js';
import { QUESTION_HEALTH_POLICY } from '../quality/question-health-monitor.js';

const freeze = (value) => {
  if (Array.isArray(value)) return Object.freeze(value.map(freeze));
  if (value && typeof value === 'object') return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, child]) => [key, freeze(child)])));
  return value;
};

export const PHASE5I_PRODUCT_OWNER_REVIEW_EVIDENCE = freeze({
  schemaVersion: '1.0',
  phase: '5I',
  reviewType: 'PRODUCT_OWNER_VISUAL_REVIEW',
  reviewDate: '2026-08-04',
  formalCurriculumReview: false,
  formalContentExpertApproval: false,
  positiveOverallAssessmentRecorded: true,
  namedConcerns: [
    {
      slotId: 'turkish:7:forbidden-story',
      concern: 'Yasak harf kuralının yalnız öğrenci cevap alanına ait olduğu ilk okumada anlaşılmıyordu.',
      resolution: 'Kural kapsamı açıklaştırıldı ve canlı cümle, farklı kelime, yasak harf sayaçları eklendi.',
      status: 'RESOLVED'
    },
    {
      slotId: 'math:8:logic-station',
      concern: 'Üç günlük ve iki koşullu program sorusu 8. sınıf için çok kolaydı.',
      resolution: 'Beş günlük, beş atölyeli, dört kısıtlı ve zorunlu sonuç gerektiren solver-doğrulamalı sürümle değiştirildi.',
      status: 'RESOLVED'
    }
  ],
  statement: 'Ürün sahibi yeni havuzun eski canlı havuzdan belirgin biçimde daha iyi olduğunu bildirmiş; iki somut sorunu işaretlemiş ve kontrollü canlı beta yaklaşımını onaylamıştır.'
});

export function evaluateControlledLiveBetaGate({
  candidateAudit = ASSESSMENT_V2_LAUNCH_PILOT_CANDIDATE_POOL_AUDIT,
  contentQualityAudit = ASSESSMENT_V2_LAUNCH_PILOT_CONTENT_QUALITY_AUDIT,
  runtimeAudit = null,
  technicalEvidence = null,
  ownerEvidence = PHASE5I_PRODUCT_OWNER_REVIEW_EVIDENCE,
  telemetryEvidence = null
} = {}) {
  const checks = [];
  const add = (id, label, passed, evidence, blocker) => checks.push({ id, label, passed: Boolean(passed), evidence, blocker: passed ? null : blocker });
  add('candidate-pool', '30 görev, 24 ana ders hücresi ve 23 oyun kapsamı', candidateAudit?.ok === true, candidateAudit, 'Pilot aday havuzu denetimi geçmedi.');
  add('content-quality', '30/30 mühendislik ve içerik kalite denetimi', contentQualityAudit?.ok === true && contentQualityAudit?.metrics?.passed === 30, contentQualityAudit, 'İçerik kalite denetimi 30/30 değil.');
  add('product-owner-review', 'Ürün sahibi görsel değerlendirmesi ve iki somut düzeltmenin kapanması', ownerEvidence?.positiveOverallAssessmentRecorded === true && ownerEvidence?.namedConcerns?.length === 2 && ownerEvidence.namedConcerns.every((row) => row.status === 'RESOLVED'), ownerEvidence, 'Ürün sahibi geri bildirimi veya düzeltmeler tamamlanmadı.');
  add('runtime-delivery', '30/30 pilot slotunun gerçek sınıf ve oyun oturumuna teslimi', runtimeAudit?.status === 'PASS' && runtimeAudit?.deliveredCount === 30 && runtimeAudit?.slotCount === 30 && runtimeAudit?.legacyLeakCount === 0, runtimeAudit || { status: 'MISSING' }, 'Pilot görevler gerçek oturuma eksiksiz girmiyor veya legacy sızıntısı var.');
  add('telemetry-quarantine', 'Bağımsız bildirim, tekrar ve çok kolay soru otomatik karantinası', telemetryEvidence?.status === 'PASS' && telemetryEvidence?.severeReporterThreshold === QUESTION_HEALTH_POLICY.severeIndependentReporterThreshold && telemetryEvidence?.tooEasyMinimumAttempts === QUESTION_HEALTH_POLICY.tooEasyMinimumAttempts, telemetryEvidence || { status: 'MISSING' }, 'Canlı telemetri ve otomatik karantina kanıtı eksik.');
  add('technical-baseline', 'Phase 5G teknik yayın tabanı', technicalEvidence?.technicalStatus === 'PASS', technicalEvidence || { status: 'MISSING' }, 'Teknik yayın tabanı PASS değil.');

  const ready = checks.every((check) => check.passed);
  return freeze({
    schemaVersion: '1.0',
    phase: '5I',
    releaseVersion: 'PHASE5I_PILOT_1',
    status: ready ? 'CONTROLLED_LIVE_BETA_READY' : 'CONTROLLED_LIVE_BETA_BLOCKED',
    controlledLiveBetaAllowed: ready,
    formalCurriculumCertification: false,
    formalExpertReviewComplete: false,
    realStudentPilotComplete: false,
    fullPublicProductionReleaseAllowed: false,
    fullProductReady: false,
    checks,
    blockers: checks.filter((check) => !check.passed).map((check) => check.blocker),
    metrics: { checkCount: checks.length, passed: checks.filter((check) => check.passed).length, blocked: checks.filter((check) => !check.passed).length }
  });
}

export function auditControlledLiveBetaGate(gate) {
  const errors = [];
  if (!gate || gate.checks?.length !== 6) errors.push('check-count');
  if (gate?.controlledLiveBetaAllowed !== gate?.checks?.every((check) => check.passed)) errors.push('derivation');
  if (gate?.formalCurriculumCertification !== false || gate?.formalExpertReviewComplete !== false || gate?.realStudentPilotComplete !== false) errors.push('false-certification');
  if (gate?.fullPublicProductionReleaseAllowed !== false || gate?.fullProductReady !== false) errors.push('scope-leak');
  return freeze({ ok: errors.length === 0, errors, metrics: gate?.metrics || null });
}
