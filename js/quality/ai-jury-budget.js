// Aşama 11 — AI hakemleri ve token bütçesi.
// AI yalnız sınırda / düşük puanlı / uyuşmazlık örneklerinde; aynı hata ikinci kez gönderilmez.

export const AI_JURY_TOKEN_BUDGET_PER_RUN = 12000;
export const AI_JURY_MARGIN_LOW = 90;
export const AI_JURY_MARGIN_HIGH = 96;

const seenErrorKeys = new Set();

export function resetAiJuryMemory() {
  seenErrorKeys.clear();
}

export function shouldEscalateToAiJury(sample = {}) {
  const score = Number(sample.score ?? sample.optionQuality?.score ?? sample.childMindReview?.score ?? 100);
  const violations = sample.violations || sample.optionQuality?.violations || sample.childMindReview?.violations || [];
  const disagreement = Boolean(sample.disagreement);
  const borderline = score >= AI_JURY_MARGIN_LOW && score < AI_JURY_MARGIN_HIGH;
  const low = score < AI_JURY_MARGIN_LOW;
  if (!borderline && !low && !disagreement && !violations.length) return { escalate: false, reason: 'stable_pass' };
  const errorKey = `${sample.gameId || ''}|${(violations || []).join(',')}|${sample.questionKey || ''}`;
  if (seenErrorKeys.has(errorKey)) return { escalate: false, reason: 'duplicate_error_suppressed' };
  seenErrorKeys.add(errorKey);
  return {
    escalate: true,
    reason: disagreement ? 'disagreement' : low ? 'low_score' : violations.length ? 'violations' : 'borderline',
    errorKey
  };
}

export function estimateJuryTokens(promptText = '') {
  return Math.ceil(String(promptText).length / 4) + 80;
}

export function runAiJuryBudgetPlan(samples = [], { budget = AI_JURY_TOKEN_BUDGET_PER_RUN } = {}) {
  resetAiJuryMemory();
  let used = 0;
  const planned = [];
  const skipped = [];
  for (const sample of samples) {
    const decision = shouldEscalateToAiJury(sample);
    if (!decision.escalate) {
      skipped.push({ sample, reason: decision.reason });
      continue;
    }
    const tokens = estimateJuryTokens(sample.prompt || sample.round?.prompt || '');
    if (used + tokens > budget) {
      skipped.push({ sample, reason: 'budget_exhausted' });
      continue;
    }
    used += tokens;
    planned.push({ sample, tokens, reason: decision.reason });
  }
  return {
    plannedCount: planned.length,
    skippedCount: skipped.length,
    tokensUsed: used,
    budget,
    withinBudget: used <= budget,
    planned,
    skipped,
    // Node/promptfoo uyumu: teknik görev kaydı (PAUSED_TECHNICAL değil).
    promptfooNodeNote: 'promptfoo@0.121.20 engines.node>=20; Node 22.22+ tercih edilir ama zorunlu değil'
  };
}
