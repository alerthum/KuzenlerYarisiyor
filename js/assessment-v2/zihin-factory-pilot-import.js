import { defineCanonicalQuestion } from './canonical-question-contract.js';
import { canonicalChoiceItemToTrustedRound } from './trusted-canonical-item-adapter.js';
import { auditLiveOutputRound } from '../quality/live-output-gate.js';

const REVIEW_DIMENSIONS = Object.freeze([
  'correctness',
  'optionOrRubricQuality',
  'ageLanguageFit',
  'hintNonLeakage',
  'feedbackTeachingValue',
  'naturalness'
]);

function fail(code) {
  throw new Error(`factory-pilot-import-blocked:${code}`);
}

function text(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function deepFreeze(value) {
  if (Array.isArray(value)) return Object.freeze(value.map(deepFreeze));
  if (value && typeof value === 'object') {
    return Object.freeze(Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, deepFreeze(entry)])
    ));
  }
  return value;
}

function surface(question) {
  return [
    question.content?.stimulus,
    question.content?.stem,
    ...(question.content?.options || []).map((option) => option.text)
  ].map(text).join(' ');
}

function tokens(value) {
  return new Set(text(value).toLocaleLowerCase('tr-TR')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .split(' ')
    .filter((token) => token.length > 2));
}

function similarity(left, right) {
  const a = tokens(left);
  const b = tokens(right);
  const union = new Set([...a, ...b]);
  if (!union.size) return 0;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection += 1;
  return intersection / union.size;
}

function validateReviewEvidence(row, questionId) {
  if (!row || row.questionId !== questionId) fail(`review-evidence-missing:${questionId}`);
  if (!Number.isInteger(row.reviewerCount) || row.reviewerCount < 1) fail(`reviewer-count:${questionId}`);
  if (!Array.isArray(row.decisions) || row.decisions.length !== 1 || row.decisions[0] !== 'APPROVE') {
    fail(`human-decision:${questionId}`);
  }
  if (Object.keys(row).some((key) => ['reviewerAnonId', 'notes', 'email', 'phone', 'name'].includes(key))) {
    fail(`reviewer-data-leak:${questionId}`);
  }
  for (const dimension of REVIEW_DIMENSIONS) {
    const score = Number(row.minimumScores?.[dimension]);
    if (!Number.isInteger(score) || score < 4 || score > 5) fail(`human-score:${questionId}:${dimension}`);
  }
}

function validateCanonical(raw) {
  if (raw?.schemaVersion !== '3.0') fail(`canonical-schema:${raw?.id || 'unknown'}`);
  if (raw?.provenance?.copiedText !== false) fail(`copied-text:${raw?.id || 'unknown'}`);
  let question;
  try { question = defineCanonicalQuestion(raw); }
  catch (error) { fail(`canonical-contract:${error instanceof Error ? error.message : String(error)}`); }
  if (question.curriculum.grade !== 8 || question.curriculum.courseId !== 'turkce') fail(`wrong-curriculum:${question.id}`);
  if (!question.curriculum.outcomeIds.includes('tr.pre-tymm.g8.turkce.t-8-3-17')) fail(`wrong-outcome:${question.id}`);
  if (question.itemFormat !== 'single-choice') fail(`wrong-item-format:${question.id}`);
  if (question.contentStatus !== 'PILOT_READY') fail(`content-status:${question.id}`);
  if (question.content?.humanReview?.status !== 'APPROVED' || question.content?.humanReview?.gameAdaptationAllowed !== true) {
    fail(`human-review-lock:${question.id}`);
  }
  if (question.verifier.verified !== true || question.verifier.solverId === question.verifier.independentVerifierId) {
    fail(`independent-verifier:${question.id}`);
  }
  const options = question.content?.options || [];
  if (options.length !== 4 || new Set(options.map((option) => text(option.text).toLocaleLowerCase('tr-TR'))).size !== 4) {
    fail(`options:${question.id}`);
  }
  if (question.hints.length !== 3 || question.hints.some((hint) => hint.revealsAnswer === true || text(hint.text).length < 25)) {
    fail(`hints:${question.id}`);
  }
  if (question.optionFeedback.length !== 4 || question.optionFeedback.some((row) => !text(row.text))) {
    fail(`option-feedback:${question.id}`);
  }
  const distractors = question.optionFeedback.filter((row) => row.correct === false);
  if (distractors.length !== 3 || new Set(distractors.map((row) => row.misconceptionId).filter(Boolean)).size !== 3) {
    fail(`diagnostic-distractors:${question.id}`);
  }
  if (question.solutionGraph.length < 3 || question.solutionGraph.some((step) => !text(step.evidence))) {
    fail(`solution-evidence:${question.id}`);
  }
  return question;
}

function validateBatchSurface(questions) {
  const surfaces = questions.map(surface);
  if (new Set(surfaces.map((value) => text(value).toLocaleLowerCase('tr-TR'))).size !== questions.length) {
    fail('exact-question-duplicate');
  }
  for (let left = 0; left < surfaces.length; left += 1) {
    for (let right = left + 1; right < surfaces.length; right += 1) {
      if (similarity(surfaces[left], surfaces[right]) > 0.9) fail(`semantic-question-duplicate:${left}:${right}`);
    }
  }

  const positionCounts = [0, 0, 0, 0];
  let uniqueLongestCorrect = 0;
  for (const question of questions) {
    const options = question.content.options;
    const correctIndex = options.findIndex((option) => option.id === question.answerKey.optionId);
    if (correctIndex < 0) fail(`answer-option:${question.id}`);
    positionCounts[correctIndex] += 1;
    const lengths = options.map((option) => text(option.text).length);
    const maximum = Math.max(...lengths);
    if (lengths[correctIndex] === maximum && lengths.filter((length) => length === maximum).length === 1) {
      uniqueLongestCorrect += 1;
    }
  }
  const minimumPositionCount = Math.floor(questions.length * 0.15);
  const maximumPositionCount = Math.ceil(questions.length * 0.4);
  if (positionCounts.some((count) => count < minimumPositionCount || count > maximumPositionCount)) {
    fail(`answer-position-imbalance:${positionCounts.join('-')}`);
  }
  if (uniqueLongestCorrect / questions.length > 0.35) fail('longest-option-answer-leakage');
  return deepFreeze({ positionCounts, uniqueLongestCorrectRate: uniqueLongestCorrect / questions.length });
}

export function validateZihinFactoryPilotPackage(input = {}) {
  if (input.schemaVersion !== '1.0' || input.kind !== 'zihin-factory-approved-tr8-paragraph-pilot') fail('package-contract');
  if (input.source?.repository !== 'alerthum/zihin-factory' || !text(input.source?.jobId) || !text(input.source?.batchId)) fail('source');
  if (input.target?.repository !== 'alerthum/KuzenlerYarisiyor'
    || Number(input.target?.grade) !== 8
    || input.target?.courseId !== 'turkce'
    || input.target?.gameId !== 'paragraph-detective') fail('target');

  const gate = input.releaseGate || {};
  if (Number(gate.engineeringPassCount) !== 20
    || Number(gate.humanReviewCount) !== 20
    || Number(gate.humanApprovalCount) < 16
    || Number(gate.humanApprovalRate) < 0.8
    || gate.completeCoverage !== true
    || gate.pilotEligible !== true) fail('release-gate');

  const rawQuestions = Array.isArray(input.questions) ? input.questions : [];
  if (rawQuestions.length < 16 || rawQuestions.length > 20 || Number(gate.exportableQuestionCount) !== rawQuestions.length) {
    fail('exportable-question-count');
  }
  const approvedIds = Array.isArray(input.approvedQuestionIds) ? input.approvedQuestionIds.map(String) : [];
  if (approvedIds.length !== rawQuestions.length || new Set(approvedIds).size !== approvedIds.length) fail('approved-question-ids');
  const questions = rawQuestions.map(validateCanonical);
  if (questions.some((question) => !approvedIds.includes(question.id)) || new Set(questions.map((question) => question.id)).size !== questions.length) {
    fail('question-id-mismatch');
  }

  const reviewByQuestion = new Map((input.reviewEvidence || []).map((row) => [row.questionId, row]));
  if (reviewByQuestion.size !== questions.length) fail('review-evidence-coverage');
  for (const question of questions) validateReviewEvidence(reviewByQuestion.get(question.id), question.id);

  const batchSurface = validateBatchSurface(questions);
  if (Number(input.qualityEvidence?.semanticDuplicatePairCount) !== 0) fail('factory-semantic-duplicate-evidence');
  if (Number(input.qualityEvidence?.longestCorrectRate) > 0.35) fail('factory-longest-option-evidence');
  return deepFreeze({
    ok: true,
    source: structuredClone(input.source),
    target: structuredClone(input.target),
    approvedQuestionIds: [...approvedIds],
    questions,
    batchSurface
  });
}

export function importZihinFactoryPilotPackage(input = {}) {
  const validated = validateZihinFactoryPilotPackage(input);
  const rounds = validated.questions.map((question) => {
    const base = canonicalChoiceItemToTrustedRound(question, {
      gameId: 'paragraph-detective',
      subjectId: 'turkce',
      grade: 8,
      sourceLabel: `Zihin Factory · ${validated.source.batchId} · İnsan Onaylı Pilot`,
      questionKeyPrefix: 'factory-pilot:1.0'
    });
    const round = deepFreeze({
      ...base,
      gameId: 'paragraph-detective',
      trustedHumanReview: {
        status: 'APPROVED',
        difficultyVerdict: 'HARD',
        reviewType: 'FACTORY_SIX_DIMENSION_HUMAN_REVIEW'
      },
      factoryPilotSource: structuredClone(validated.source),
      publicationStatus: 'IMPORT_REVIEW_REQUIRED',
      controlledLaunchPilot: false,
      formalCurriculumCertification: false
    });
    const liveAudit = auditLiveOutputRound(round, { gameId: 'paragraph-detective', grade: 8 });
    if (!liveAudit.ok) fail(`live-output:${question.id}:${liveAudit.errors.join(',')}`);
    return round;
  });

  return deepFreeze({
    schemaVersion: '1.0',
    kind: 'kuzenler-factory-pilot-import-candidate',
    source: validated.source,
    target: validated.target,
    canonicalQuestions: validated.questions,
    rounds,
    audit: {
      ok: true,
      canonicalQuestionCount: validated.questions.length,
      gameRoundCount: rounds.length,
      semanticRoundTripRequired: true,
      liveOutputGatePassed: true
    },
    autoPublishAllowed: false,
    publicationStatus: 'EXPLICIT_TRUSTED_LIVE_WHITELIST_PR_REQUIRED'
  });
}
