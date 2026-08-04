import { ASSESSMENT_V2_CANONICAL_CATALOG } from './canonical-catalog.js';
import { ASSESSMENT_V2_LAUNCH_PILOT_CANDIDATE_POOL } from './launch-pilot-candidate-pool.js';

const freeze = (value) => {
  if (Array.isArray(value)) return Object.freeze(value.map(freeze));
  if (value && typeof value === 'object') return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, child]) => [key, freeze(child)])));
  return value;
};

const GENERIC_STUDENT_PHRASES = Object.freeze([
  'öğrenme çıktısını gösterecek biçimde',
  'kazanımını gösterecek şekilde',
  'verilen materyali incele ve gerekçeli bir yanıt oluştur',
  'materyali incele',
  'görevi tamamla',
  'kullandığın kanıtları açıkla'
]);

function normalized(value) {
  return String(value || '').toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();
}
function nonEmpty(value) { return typeof value === 'string' && value.trim().length > 0; }
function hamming(left, right) {
  if (left.length !== right.length) return Infinity;
  let count = 0;
  for (let index = 0; index < left.length; index += 1) if (left[index] !== right[index]) count += 1;
  return count;
}
function multiset(values) {
  const out = new Map();
  for (const value of values) out.set(String(value), (out.get(String(value)) || 0) + 1);
  return [...out.entries()].sort(([a], [b]) => a.localeCompare(b));
}
function sameMultiset(left, right) { return JSON.stringify(multiset(left)) === JSON.stringify(multiset(right)); }

function tokenizeExpression(value) {
  const source = String(value || '').replaceAll('×', '*').replaceAll('÷', '/').replace(/\s+/g, '');
  const tokens = source.match(/\d+(?:[.,]\d+)?|[()+\-*/]/g) || [];
  if (tokens.join('') !== source) throw new Error('unsupported-expression-token');
  return tokens.map((token) => token.replace(',', '.'));
}
function evaluateExpression(value) {
  const tokens = tokenizeExpression(value);
  let cursor = 0;
  function primary() {
    const token = tokens[cursor++];
    if (token === '(') {
      const result = addSub();
      if (tokens[cursor++] !== ')') throw new Error('missing-closing-parenthesis');
      return result;
    }
    if (token === '-') return -primary();
    const number = Number(token);
    if (!Number.isFinite(number)) throw new Error('expected-number');
    return number;
  }
  function mulDiv() {
    let valueNow = primary();
    while (tokens[cursor] === '*' || tokens[cursor] === '/') {
      const operator = tokens[cursor++];
      const right = primary();
      valueNow = operator === '*' ? valueNow * right : valueNow / right;
    }
    return valueNow;
  }
  function addSub() {
    let valueNow = mulDiv();
    while (tokens[cursor] === '+' || tokens[cursor] === '-') {
      const operator = tokens[cursor++];
      const right = mulDiv();
      valueNow = operator === '+' ? valueNow + right : valueNow - right;
    }
    return valueNow;
  }
  const result = addSub();
  if (cursor !== tokens.length || !Number.isFinite(result)) throw new Error('invalid-expression');
  return result;
}

function fractionValues(value) {
  const out = [];
  for (const match of String(value || '').matchAll(/(\d+)\s*\/\s*(\d+)/g)) {
    const numerator = Number(match[1]);
    const denominator = Number(match[2]);
    if (denominator !== 0) out.push({ numerator, denominator, value: numerator / denominator });
  }
  return out;
}

function choiceErrors(candidate) {
  const errors = [];
  const material = candidate.reviewMaterial;
  const options = material.options || [];
  if (options.length !== 4) errors.push(`choice-option-count:${options.length}`);
  if (new Set(options.map((option) => normalized(option.text))).size !== options.length) errors.push('choice-duplicate-options');
  const answerIndex = material.answerKey?.answerIndex;
  if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= options.length) errors.push('choice-invalid-answer-index');
  if (material.answerKey?.optionId !== options[answerIndex]?.id) errors.push('choice-answer-id-index-mismatch');
  if (!nonEmpty(material.explanation) || material.explanation.trim().length < 35) errors.push('choice-explanation-too-short');
  if (!Array.isArray(material.solutionGraph) || material.solutionGraph.length < 3) errors.push('choice-solution-graph-underfill');
  const feedback = material.optionFeedback || [];
  if (feedback.length !== options.length) errors.push('choice-feedback-underfill');
  const wrongFeedback = feedback.filter((row) => !row.isCorrect);
  if (wrongFeedback.length !== 3 || wrongFeedback.some((row) => !nonEmpty(row.misconception) || !nonEmpty(row.rationale))) errors.push('choice-diagnostic-underfill');
  if (new Set(wrongFeedback.map((row) => normalized(row.misconception))).size !== wrongFeedback.length) errors.push('choice-diagnostics-not-distinct');
  const answerText = normalized(options[answerIndex]?.text);
  if (answerText && (material.hints || []).some((hint) => normalized(hint?.text || hint).includes(answerText))) errors.push('choice-hint-leaks-full-answer');
  const correctFractions = fractionValues(options[answerIndex]?.text);
  const finalCorrectFraction = correctFractions.at(-1);
  if (finalCorrectFraction) {
    for (let optionIndex = 0; optionIndex < options.length; optionIndex += 1) {
      if (optionIndex === answerIndex) continue;
      const equivalent = fractionValues(options[optionIndex]?.text).some((fraction) => Math.abs(fraction.value - finalCorrectFraction.value) < 1e-12);
      if (equivalent) errors.push(`choice-equivalent-fraction-distractor:${options[optionIndex]?.id || optionIndex}`);
    }
  }
  return errors;
}

function taskErrors(candidate) {
  const errors = [];
  const round = candidate.reviewMaterial.gamePayload || {};
  const rubric = round.evaluationRubric || [];
  if (round.taskValidation?.verified !== true) errors.push('task-not-verified');
  if (rubric.length < 3) errors.push(`task-rubric-underfill:${rubric.length}`);
  if (!Array.isArray(round.solutionGraph) || round.solutionGraph.length < 3) errors.push('task-solution-graph-underfill');
  if (round.kind === 'wordMine') {
    if (!nonEmpty(round.source) || round.source.length < 5) errors.push('word-mine-source-invalid');
    if ((round.allowed || []).length < 8) errors.push('word-mine-dictionary-underfill');
    for (const word of round.allowed || []) {
      const sourceLetters = multiset([...normalized(round.source)].filter((char) => /[a-zçğıöşü]/i.test(char)));
      const wordLetters = multiset([...normalized(word)].filter((char) => /[a-zçğıöşü]/i.test(char)));
      const inventory = new Map(sourceLetters);
      if (wordLetters.some(([letter, count]) => count > (inventory.get(letter) || 0))) errors.push(`word-mine-invalid-word:${word}`);
    }
  } else if (round.kind === 'wordLadder') {
    const path = [round.start, ...(round.steps || []), round.end];
    if (path.some((word) => !nonEmpty(word))) errors.push('word-ladder-empty-step');
    if (path.some((word) => !(round.dictionary || []).includes(word))) errors.push('word-ladder-unverified-step');
    for (let index = 1; index < path.length; index += 1) if (hamming(path[index - 1], path[index]) !== 1) errors.push(`word-ladder-invalid-transition:${index}`);
  } else if (round.kind === 'story') {
    if (!nonEmpty(round.forbiddenLetter) || round.forbiddenLetter.length !== 1) errors.push('story-forbidden-letter-invalid');
    if (!Number.isInteger(round.minSentences) || round.minSentences < 3) errors.push('story-sentence-threshold-invalid');
    if (!Number.isInteger(round.minUniqueWords) || round.minUniqueWords < 15) errors.push('story-word-threshold-invalid');
  } else if (round.kind === 'expression') {
    if (!Array.isArray(round.numbers) || round.numbers.length !== 4) errors.push('expression-number-count');
    const usedNumbers = String(round.solution || '').match(/\d+(?:[.,]\d+)?/g)?.map((value) => Number(value.replace(',', '.'))) || [];
    if (!sameMultiset(usedNumbers, round.numbers || [])) errors.push('expression-number-multiset-mismatch');
    try {
      if (Math.abs(evaluateExpression(round.solution) - Number(round.target)) > 1e-9) errors.push('expression-target-mismatch');
    } catch (error) { errors.push(`expression-invalid:${error.message}`); }
  } else if (round.kind === 'wordOrder') {
    const sourceTokens = (round.tokens || []).map((token) => typeof token === 'string' ? token : token.value);
    if (!sourceTokens.length || !Array.isArray(round.answerTokens)) errors.push('word-order-token-contract');
    else if (!sameMultiset(sourceTokens, round.answerTokens)) errors.push('word-order-token-multiset-mismatch');
  } else errors.push(`unsupported-task-kind:${round.kind}`);
  return errors;
}

function candidateErrors(candidate, catalog) {
  const errors = [];
  const material = candidate.reviewMaterial;
  const round = material.gamePayload || {};
  if (!candidate.sourceQuestionKey.startsWith('premium') && !candidate.sourceQuestionKey.startsWith('phase5h:')) errors.push('unapproved-source-policy');
  if (material.verifier?.premiumTier !== 'GOLD') errors.push(`premium-tier:${material.verifier?.premiumTier || 'missing'}`);
  if (material.verifier?.verified !== true || !candidate.independentVerificationPassed) errors.push('independent-verification-missing');
  if (!nonEmpty(material.stem) || material.stem.trim().length < 18) errors.push('stem-too-short');
  if (!nonEmpty(material.stimulus) || material.stimulus.trim().length < 20) errors.push('stimulus-too-short');
  const studentText = normalized([material.stimulus, material.stem, ...(material.options || []).map((option) => option.text)].join(' '));
  for (const phrase of GENERIC_STUDENT_PHRASES) if (studentText.includes(normalized(phrase))) errors.push(`generic-student-language:${phrase}`);
  if (!candidate.sourceQuestionKey.startsWith('phase5h:') && !candidate.sourceQuestionKey.includes(`:${candidate.suggestedGameId}:`)) errors.push('source-game-route-mismatch');
  if (!candidate.allowedGameIds.includes(candidate.suggestedGameId) || candidate.routeConfidence !== 'HIGH' || candidate.routeScore !== 100) errors.push('route-contract');
  const reference = catalog.find((item) => item.id === candidate.curriculumReferenceQuestionId);
  if (!reference) errors.push('curriculum-reference-missing');
  else {
    if (reference.curriculum.grade !== candidate.grade) errors.push('curriculum-grade-mismatch');
    if (reference.curriculum.courseId !== candidate.courseId) errors.push('curriculum-course-mismatch');
    if (JSON.stringify(reference.curriculum.outcomeIds || []) !== JSON.stringify(candidate.outcomeIds || [])) errors.push('curriculum-outcome-copy-mismatch');
  }
  if (candidate.curriculumHumanConfirmationRequired !== true || candidate.publicationAllowed || candidate.gameAdaptationAllowed) errors.push('human-gate-contract');
  errors.push(...(candidate.itemFormat === 'single-choice' ? choiceErrors(candidate) : taskErrors(candidate)));
  return errors;
}

export function auditLaunchPilotContentQuality({ candidatePool = ASSESSMENT_V2_LAUNCH_PILOT_CANDIDATE_POOL, catalog = ASSESSMENT_V2_CANONICAL_CATALOG } = {}) {
  const rows = candidatePool.candidates.map((candidate) => {
    const errors = candidateErrors(candidate, catalog);
    return freeze({ candidateId: candidate.candidateId, questionId: candidate.questionId, gameId: candidate.suggestedGameId, grade: candidate.grade, courseGroup: candidate.courseGroup, ok: errors.length === 0, errors });
  });
  const answerCounts = candidatePool.metrics.answerPositionCounts;
  const answerValues = Object.values(answerCounts);
  const answerBalanceSpread = Math.max(...answerValues) - Math.min(...answerValues);
  const globalErrors = [];
  if (candidatePool.candidateCount !== 30) globalErrors.push(`candidate-count:${candidatePool.candidateCount}`);
  if (answerBalanceSpread > 1) globalErrors.push(`answer-position-spread:${answerBalanceSpread}`);
  if (rows.some((row) => !row.ok)) globalErrors.push(`candidate-quality-failures:${rows.filter((row) => !row.ok).length}`);
  const metrics = freeze({
    total: rows.length,
    passed: rows.filter((row) => row.ok).length,
    failed: rows.filter((row) => !row.ok).length,
    choiceCount: candidatePool.candidates.filter((row) => row.itemFormat === 'single-choice').length,
    taskCount: candidatePool.candidates.filter((row) => row.itemFormat !== 'single-choice').length,
    goldCount: candidatePool.candidates.filter((row) => row.reviewMaterial.verifier.premiumTier === 'GOLD').length,
    exactOutcomeReferenceCount: candidatePool.candidates.filter((row) => row.curriculumAlignmentStatus === 'EXACT_OUTCOME_REFERENCE').length,
    explicitCurriculumReferenceCount: candidatePool.candidates.filter((row) => row.curriculumAlignmentMode === 'EXPLICIT_REFERENCE').length,
    skillTransferReferenceCount: candidatePool.candidates.filter((row) => row.curriculumAlignmentMode === 'SKILL_TRANSFER').length,
    answerPositionCounts: answerCounts,
    answerBalanceSpread
  });
  return freeze({ schemaVersion: '1.0', phase: '5H', ok: globalErrors.length === 0, generatedAt: new Date().toISOString(), globalErrors, metrics, rows });
}

export const ASSESSMENT_V2_LAUNCH_PILOT_CONTENT_QUALITY_AUDIT = auditLaunchPilotContentQuality();
