// Aşama 14 — Puanlama ve yayın kapısı.
// Genel kalite ≥90; CRITICAL/HIGH blocker = 0.
// Minimum final kanıt sayıları sağlanmadan PASS üretilmez.

import { assertEvidenceAllowsPass, evaluateFinalEvidence } from './final-evidence-gate.js';

export const STAGE14_OVERALL_MIN = 90;

export function computeOverallQualityScore({
  cognitiveDepthScore = null,
  optionQualityScore = null,
  accuracyPercent = null,
  semanticRepeatCount = null,
  childMindScore = null,
  underfillCount = null,
  openCritical = 0,
  openHigh = 0,
  evidenceAdequate = null
} = {}) {
  // Kanıt yetersizken genel puanı 100 göstermeyiz.
  if (evidenceAdequate === false) {
    return {
      overallScorePercent: null,
      overallScoreDisplay: 'Kanıt yetersiz — final örnek eşikleri karşılanmadı',
      meetsStageGate: false,
      openCritical,
      openHigh
    };
  }
  const parts = [
    Number(cognitiveDepthScore),
    Number(optionQualityScore),
    Number(accuracyPercent),
    Number(childMindScore)
  ].filter((n) => Number.isFinite(n));
  const base = parts.length ? parts.reduce((a, b) => a + b, 0) / parts.length : 0;
  let score = base;
  if (Number(semanticRepeatCount) > 0) score -= Math.min(20, Number(semanticRepeatCount) * 5);
  if (Number(underfillCount) > 0) score -= Math.min(20, Number(underfillCount));
  if (openCritical > 0) score = Math.min(score, 0);
  if (openHigh > 0) score = Math.min(score, STAGE14_OVERALL_MIN - 1);
  score = Math.max(0, Math.round(score * 10) / 10);
  return {
    overallScorePercent: score,
    overallScoreDisplay: String(score),
    meetsStageGate: score >= STAGE14_OVERALL_MIN && openCritical === 0 && openHigh === 0,
    openCritical,
    openHigh
  };
}

export function evaluateReleaseGate(metrics = {}, blockers = {}, evidenceIndex = null) {
  const evidenceCheck = evidenceIndex
    ? assertEvidenceAllowsPass(evidenceIndex)
    : {
      ok: false,
      decision: 'FAIL',
      autoReturnToStage14: true,
      reason: 'final_evidence_index_missing',
      gaps: ['final_evidence_index_missing'],
      verdict: evaluateFinalEvidence({})
    };

  const scored = computeOverallQualityScore({
    ...metrics,
    openCritical: Number(blockers.openCriticalCount || 0),
    openHigh: Number(blockers.openHighCount || 0),
    evidenceAdequate: evidenceCheck.ok
  });

  const criticalFailures = [];
  if (!evidenceCheck.ok) {
    criticalFailures.push(evidenceCheck.reason || 'final_evidence_inadequate');
    for (const gap of evidenceCheck.gaps || []) criticalFailures.push(`evidence_gap:${gap}`);
  }
  if (metrics.grade3PlusEasyMediumPublishedCount > 0) criticalFailures.push('easy_medium_published');
  if (metrics.accuracyPercent != null
    && Number.isFinite(Number(metrics.accuracyPercent))
    && Number(metrics.accuracyPercent) < 100) {
    criticalFailures.push('accuracy_below_100');
  }
  if (Number(metrics.sessionSemanticRepeatCount) > 0) criticalFailures.push('semantic_repeat');
  if (Number(metrics.irrelevantOptionCount) > 0 || Number(metrics.formCueGiveawayCount) > 0) {
    criticalFailures.push('option_quality_critical');
  }

  const qualityOk = !criticalFailures.includes('easy_medium_published')
    && !criticalFailures.includes('accuracy_below_100')
    && !criticalFailures.includes('semantic_repeat')
    && !criticalFailures.includes('option_quality_critical')
    && scored.meetsStageGate;

  const decision = evidenceCheck.ok && qualityOk ? 'PASS' : 'FAIL';

  return {
    ...scored,
    criticalFailures,
    decision,
    autoReturnToStage14: decision !== 'PASS',
    finalEvidenceAdequacy: evidenceCheck.verdict?.finalEvidenceAdequacy || 'FAIL',
    evidenceGaps: evidenceCheck.gaps || [],
    evidenceActual: evidenceCheck.verdict?.actual || null
  };
}
