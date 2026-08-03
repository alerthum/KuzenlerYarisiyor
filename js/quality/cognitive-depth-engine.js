// Aşama 05 — Bilişsel Derinlik Motoru.
// 3–12. sınıf yayınında kolay/orta sıfır. difficulty=hard etiketi kanıt değildir.
// Gerçek cognitiveDepthEvidence: reasoningStepCount≥2 + ≥2 yüksek bilişsel özellik.
// Yalnız büyük sayı / uzun metin / rutin işlem → zor kabul edilmez.

export const HIGH_COGNITIVE_TRAITS = Object.freeze([
  'multiStepInference',
  'strategySelection',
  'errorAnalysis',
  'conditionEvaluation',
  'informationLinking',
  'usingIntermediateResultInNewDecision',
  'reverseThinking',
  'representationTransform',
  'constraintPropagation',
  'hypothesisEvaluation'
]);

export const STAGE05_SCORE_MIN = 95;

const HIGH_SET = new Set(HIGH_COGNITIVE_TRAITS);

function uniqueTraits(traits = []) {
  return [...new Set((Array.isArray(traits) ? traits : []).map(String).filter(Boolean))];
}

function countLargeNumbers(text = '') {
  const matches = String(text).match(/\b\d{4,}\b/g);
  return matches ? matches.length : 0;
}

function promptLength(round = {}) {
  return String(round.prompt || '').length + String(round.context || '').length;
}

function skeletonImpliesSteps(skeletonId = '') {
  const id = String(skeletonId);
  if (/:(select-valid|forced-fact|spot-violation|compare-worlds|verify|missing|compare|error)/i.test(id)) return 2;
  if (/#/.test(id)) return 2;
  return 0;
}

function deriveReasoningStepCount(round = {}, traits = []) {
  if (Number(round.reasoningStepCount) >= 2) return Number(round.reasoningStepCount);
  if (Number(round.cognitiveDepthEvidence?.reasoningStepCount) >= 2) {
    return Number(round.cognitiveDepthEvidence.reasoningStepCount);
  }
  let steps = 0;
  if (traits.includes('multiStepInference')) steps = Math.max(steps, 2);
  if (traits.includes('usingIntermediateResultInNewDecision')) steps = Math.max(steps, 2);
  if (traits.includes('errorAnalysis')) steps = Math.max(steps, 2);
  if (traits.includes('strategySelection') && traits.includes('conditionEvaluation')) steps = Math.max(steps, 2);
  steps = Math.max(steps, skeletonImpliesSteps(round.skeletonId));
  if (Array.isArray(round.hints) && round.hints.length >= 2) steps = Math.max(steps, 2);
  if (String(round.explanation || '').split(/[.!?]|→/).filter((p) => p.trim().length > 8).length >= 2) {
    steps = Math.max(steps, 2);
  }
  if (traits.length >= 2 && steps < 2) steps = 2;
  return steps;
}

function isRoutineComputation(round = {}) {
  const prompt = String(round.prompt || '');
  const text = `${round.prompt || ''} ${round.context || ''}`;
  // Tek adımlı aritmetik / doğrudan sonuç sorusu (sığ rutin).
  if (/sonucu kaçtır\??$/i.test(prompt) && prompt.length < 58 && /\d+\s*(?:[+\-×x*/÷])\s*\d+/.test(prompt)) return true;
  if (/^\s*\d+\s*[+\-×x*/÷]\s*\d+\s*=\s*\??\s*$/i.test(prompt)) return true;
  if (/(?:^|\b)\d+\s*(?:\+|-|×|x|\*|÷|\/)\s*\d+\s*(?:işleminin sonucu kaçtır|sonucu kaçtır)/i.test(text)) return true;
  if (/(çıkarım yapmana gerek yok|yalnız uygula|sadece uygula|doğrudan uygula)/i.test(text)) return true;
  if (/(kural:\s*her terimde\s*\d+\s*(?:ekleniyor|çıkarılıyor)|her terimde\s*\d+\s*(?:ekleniyor|çıkarılıyor).*(?:6\.\s*terim|sıradaki değer|bir sonraki))/i.test(text)) return true;
  return false;
}

function isShallowHardness(round = {}) {
  const text = `${round.prompt || ''} ${round.context || ''}`;
  const largeOnly = countLargeNumbers(text) >= 2 && uniqueTraits(round.cognitiveTraits).filter((t) => HIGH_SET.has(t)).length < 2;
  const longOnly = promptLength(round) >= 280 && uniqueTraits(round.cognitiveTraits).filter((t) => HIGH_SET.has(t)).length < 2;
  return largeOnly || longOnly || isRoutineComputation(round);
}

function declaredHardLabel(round = {}) {
  const label = String(round.difficultyLabel || round.difficultyBand || '').toLowerCase();
  if (label === 'hard' || label === 'zor') return true;
  if (Number(round.cognitiveDepth || 0) >= 4 || Number(round.difficulty || 0) >= 4) return true;
  return false;
}

/**
 * Tur için bilişsel derinlik kanıtı üretir (uydurma yok; mevcut alanlardan türetir).
 */
export function buildCognitiveDepthEvidence(round = {}) {
  const traits = uniqueTraits(
    round.cognitiveTraits
      || round.cognitiveDepthEvidence?.highCognitiveTraits
      || round.questionContract?.reasoningPath?.cognitiveTraits
  );
  const highTraits = traits.filter((t) => HIGH_SET.has(t));
  const reasoningStepCount = deriveReasoningStepCount(round, traits);
  const shallowSurface = isShallowHardness({ ...round, cognitiveTraits: traits });
  const hardLabel = declaredHardLabel(round);
  const meetsTraitFloor = highTraits.length >= 2;
  const meetsStepFloor = reasoningStepCount >= 2;
  // Yalnız büyük sayı/uzun metin/rutin işlem zor sayılmaz. Önceki sürümde
  // traits+steps doluysa rutin soru yine hard olabiliyordu. Artık yüzeysel rutin
  // işlem/örüntü, metadata ne derse desin hard kanıtını düşürür.
  const routineSurface = isRoutineComputation(round);
  const shallowHardness = shallowSurface || routineSurface;
  const evidenceSupportedHard = meetsTraitFloor && meetsStepFloor && !routineSurface;

  let publicationBand = 'hard';
  if (!evidenceSupportedHard) {
    publicationBand = meetsStepFloor || meetsTraitFloor ? 'medium' : 'easy';
  }

  const violations = [];
  if (!meetsStepFloor) violations.push('reasoning_steps_below_2');
  if (!meetsTraitFloor) violations.push('high_cognitive_traits_below_2');
  if (shallowHardness) violations.push('shallow_hardness_only');
  if (routineSurface) violations.push('routine_surface_not_hard');
  if (hardLabel && !evidenceSupportedHard) violations.push('hard_label_without_evidence');

  return {
    reasoningStepCount,
    highCognitiveTraits: highTraits,
    allTraits: traits,
    publicationBand,
    evidenceSupportedHard,
    shallowHardness,
    hardLabelPresent: hardLabel,
    violations,
    source: round.cognitiveDepthEvidence?.source || 'derived-from-traits-skeleton-explanation'
  };
}

/**
 * Grade≥3 yayın denetimi. Grade<3 için engel uygulanmaz (ama evidence yine üretilir).
 */
export function evaluateCognitiveDepth(round = {}, { grade = 0 } = {}) {
  const evidence = round.cognitiveDepthEvidence || buildCognitiveDepthEvidence(round);
  const gradeNum = Number(grade) || 0;
  if (gradeNum < 3) {
    return {
      ok: true,
      publicationAllowed: true,
      gradeExempt: true,
      evidence,
      violations: []
    };
  }
  const blockedBands = evidence.publicationBand === 'easy' || evidence.publicationBand === 'medium';
  const violations = [...(evidence.violations || [])];
  if (blockedBands) violations.push(`grade3plus_${evidence.publicationBand}_blocked`);
  const publicationAllowed = evidence.evidenceSupportedHard && !blockedBands;
  return {
    ok: publicationAllowed,
    publicationAllowed,
    gradeExempt: false,
    evidence,
    violations: [...new Set(violations)]
  };
}

export function attachCognitiveDepth(round = {}, { grade = 0 } = {}) {
  const evidence = buildCognitiveDepthEvidence(round);
  const evaluation = evaluateCognitiveDepth({ ...round, cognitiveDepthEvidence: evidence }, { grade });
  return {
    ...round,
    cognitiveTraits: evidence.allTraits.length ? evidence.allTraits : round.cognitiveTraits,
    cognitiveDepthEvidence: evidence,
    cognitiveDepthGate: {
      publicationAllowed: evaluation.publicationAllowed,
      gradeExempt: evaluation.gradeExempt,
      violations: evaluation.violations
    }
  };
}

/**
 * Canlı örneklem skorlama. easy/medium yayın = kritik ihlal.
 */
export function scoreCognitiveDepthAudit(samples = []) {
  const total = samples.length;
  if (!total) {
    return {
      scorePercent: 0,
      total: 0,
      passing: 0,
      easyMediumPublishedCount: 0,
      criticalViolations: 1,
      meetsStageGate: false,
      note: 'no_samples'
    };
  }
  let passing = 0;
  let easyMediumPublishedCount = 0;
  const violationCounts = {};
  for (const sample of samples) {
    const grade = Number(sample.grade || sample.profileGrade || 0);
    const evaluation = evaluateCognitiveDepth(sample.round || sample, { grade });
    const published = sample.published !== false;
    if (published && grade >= 3 && (evaluation.evidence.publicationBand === 'easy' || evaluation.evidence.publicationBand === 'medium')) {
      easyMediumPublishedCount += 1;
    }
    if (evaluation.ok) passing += 1;
    for (const v of evaluation.violations) {
      violationCounts[v] = (violationCounts[v] || 0) + 1;
    }
  }
  const scorePercent = Math.round((passing / total) * 1000) / 10;
  const criticalViolations = easyMediumPublishedCount;
  return {
    scorePercent,
    total,
    passing,
    easyMediumPublishedCount,
    criticalViolations,
    violationCounts,
    meetsStageGate: scorePercent >= STAGE05_SCORE_MIN && criticalViolations === 0
  };
}

export function filterRoundsByCognitiveDepth(rounds = [], { grade = 0 } = {}) {
  if (Number(grade) < 3) {
    return rounds.map((round) => attachCognitiveDepth(round, { grade }));
  }
  const kept = [];
  const rejected = [];
  for (const round of rounds) {
    const enriched = attachCognitiveDepth(round, { grade });
    if (enriched.cognitiveDepthGate.publicationAllowed) kept.push(enriched);
    else rejected.push(enriched);
  }
  return { kept, rejected };
}
