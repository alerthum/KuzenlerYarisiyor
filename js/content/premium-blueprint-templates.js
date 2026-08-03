import { definePremiumBlueprint } from './premium-blueprint-core.js';

export const PREMIUM_DEEP_TRAITS = Object.freeze([
  'multiStepInference',
  'conditionEvaluation',
  'informationLinking'
]);

export function formatPremiumNumber(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error(`premium numeric answer is not finite: ${value}`);
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100).replace('.', ',');
}

export function defineNumericPremiumBlueprint({
  id,
  gameId = 'error-detective',
  familyId,
  skeletonId,
  reasoningPathId = 'model-transform-solve-substitute',
  subjectId = 'mathematics',
  topicId,
  learningOutcomeId,
  gradeBand = '9-10',
  difficulty = 4,
  cognitiveTraits = [...PREMIUM_DEEP_TRAITS, 'symbolicReasoning', 'errorDiagnosis'],
  reasoningStepCount = 3,
  solutionClass,
  variants,
  render,
  solve,
  verify,
  wrongValues,
  explanation,
  evidence,
  formatAnswer
}) {
  return definePremiumBlueprint({
    id,
    gameId,
    familyId,
    skeletonId,
    reasoningPathId,
    subjectId,
    topicId,
    learningOutcomeId,
    gradeBand,
    difficulty,
    cognitiveTraits,
    reasoningStepCount,
    solutionClass,
    variants,
    render,
    solve,
    verify,
    formatAnswer: (value, variant) => formatAnswer
      ? formatAnswer(value, variant)
      : formatPremiumNumber(value),
    buildDistractors: (variant, correct) => wrongValues(variant, correct).map((entry) => ({
      value: entry.value,
      text: entry.text ?? (formatAnswer
        ? formatAnswer(entry.value, variant)
        : formatPremiumNumber(entry.value)),
      misconceptionId: `${id}:${entry.id}`,
      why: entry.why,
      constructionRule: entry.rule
    })),
    buildExplanation: explanation,
    buildEvidence: evidence
  });
}

export function defineCriteriaPremiumBlueprint({
  id,
  gameId,
  familyId,
  skeletonId,
  subjectId,
  topicId,
  learningOutcomeId,
  solutionClass,
  criteria,
  variants,
  gradeBand = '9-10',
  difficulty = 4,
  reasoningPathId = 'extract-evidence-test-options-conclude',
  cognitiveTraits = PREMIUM_DEEP_TRAITS,
  extraTraits = [],
  reasoningStepCount = 3
}) {
  const isValid = (variant, key) => {
    const option = variant.options.find((entry) => entry.key === key);
    return Boolean(option) && criteria.every((criterion) => option.checks?.[criterion] === true);
  };
  return definePremiumBlueprint({
    id,
    gameId,
    familyId,
    skeletonId,
    reasoningPathId,
    subjectId,
    topicId,
    learningOutcomeId,
    gradeBand,
    difficulty,
    cognitiveTraits: [...cognitiveTraits, ...extraTraits],
    reasoningStepCount,
    solutionClass,
    variants,
    render: (variant) => ({ context: variant.context, prompt: variant.prompt, hints: variant.hints || [] }),
    solve: (variant) => {
      const valid = variant.options.filter((entry) => criteria.every((criterion) => entry.checks?.[criterion] === true));
      if (valid.length !== 1) throw new Error(`${id}/${variant.id}: expected exactly one criteria-satisfying option`);
      return valid[0].key;
    },
    verify: (variant, key) => isValid(variant, key),
    formatAnswer: (key, variant) => variant.options.find((entry) => entry.key === key)?.text,
    buildDistractors: (variant) => variant.options
      .filter((entry) => !isValid(variant, entry.key))
      .map((entry) => ({
        value: entry.key,
        text: entry.text,
        misconceptionId: `${id}:${entry.misconceptionId}`,
        why: entry.why,
        constructionRule: entry.rule
      })),
    buildExplanation: (variant) => variant.explanation,
    buildEvidence: (variant) => variant.evidence
  });
}

export function defineCandidatePremiumBlueprint({
  id,
  gameId,
  familyId,
  skeletonId,
  subjectId,
  topicId,
  learningOutcomeId,
  solutionClass,
  variants,
  isValidCandidate,
  gradeBand = '9-10',
  difficulty = 4,
  reasoningPathId = 'extract-constraints-test-candidates-conclude',
  cognitiveTraits = PREMIUM_DEEP_TRAITS,
  extraTraits = [],
  reasoningStepCount = 3
}) {
  if (typeof isValidCandidate !== 'function') throw new Error(`${id}: isValidCandidate function is required`);
  const findCandidate = (variant, candidateId) => variant.candidates.find((entry) => entry.id === candidateId);
  const validCandidates = (variant) => variant.candidates.filter((candidate) => isValidCandidate(variant, candidate));
  return definePremiumBlueprint({
    id,
    gameId,
    familyId,
    skeletonId,
    reasoningPathId,
    subjectId,
    topicId,
    learningOutcomeId,
    gradeBand,
    difficulty,
    cognitiveTraits: [...cognitiveTraits, ...extraTraits],
    reasoningStepCount,
    solutionClass,
    variants,
    render: (variant) => ({ context: variant.context, prompt: variant.prompt, hints: variant.hints || [] }),
    solve: (variant) => {
      const valid = validCandidates(variant);
      if (valid.length !== 1) throw new Error(`${id}/${variant.id}: expected exactly one valid candidate, got ${valid.length}`);
      return valid[0].id;
    },
    verify: (variant, candidateId) => {
      const candidate = findCandidate(variant, candidateId);
      return Boolean(candidate) && isValidCandidate(variant, candidate);
    },
    formatAnswer: (candidateId, variant) => findCandidate(variant, candidateId)?.text,
    buildDistractors: (variant) => variant.candidates
      .filter((candidate) => !isValidCandidate(variant, candidate))
      .map((candidate) => ({
        value: candidate.id,
        text: candidate.text,
        misconceptionId: `${id}:${candidate.misconceptionId}`,
        why: candidate.why,
        constructionRule: candidate.rule
      })),
    buildExplanation: (variant) => variant.explanation,
    buildEvidence: (variant) => variant.evidence
  });
}
