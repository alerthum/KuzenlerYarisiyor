import { ASSESSMENT_V2_CANONICAL_CATALOG } from './canonical-catalog.js';
import { CORE_GAME_RELEASE_PROFILE } from './core-game-release-profile.js';
import { ASSESSMENT_V2_LAUNCH_PILOT_PREMIUM_BANK } from './launch-pilot-premium-bank.js';

const freeze = (value) => {
  if (Array.isArray(value)) return Object.freeze(value.map(freeze));
  if (value && typeof value === 'object') return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, child]) => [key, freeze(child)])));
  return value;
};

export const LAUNCH_PILOT_GRADES = freeze([5, 6, 7, 8]);
export const LAUNCH_PILOT_GROUP_GAMES = freeze({
  turkish: ['word-mine', 'word-ladder', 'forbidden-story', 'meaning-hunt', 'paragraph-detective'],
  math: ['target-number', 'speed-math', 'pattern-lab', 'problem-hunter', 'geometry-lab', 'error-detective', 'olympiad-ladder', 'logic-station'],
  english: ['english-vocabulary', 'english-cloze', 'english-sentence-builder'],
  social: ['social-time-travel', 'social-map-skills', 'social-citizenship'],
  religion: ['religion-practice'],
  science: ['science-lab', 'science-reasoning'],
  mixed: ['lgs-foundation']
});

const COURSE_BY_GROUP_AND_GRADE = freeze({
  turkish: { 5: 'turkce', 6: 'turkce', 7: 'turkce', 8: 'turkce' },
  math: { 5: 'matematik', 6: 'matematik', 7: 'matematik', 8: 'matematik' },
  science: { 5: 'fen-bilimleri', 6: 'fen-bilimleri', 7: 'fen-bilimleri', 8: 'fen-bilimleri' },
  social: { 5: 'sosyal-bilgiler', 6: 'sosyal-bilgiler', 7: 'sosyal-bilgiler', 8: 't-c-inkilap-tarihi-ve-ataturkculuk' },
  english: { 5: 'yabanci-dil', 6: 'yabanci-dil', 7: 'yabanci-dil', 8: 'ingilizce' },
  religion: { 5: 'din-kulturu-ve-ahlak-bilgisi', 6: 'din-kulturu-ve-ahlak-bilgisi', 7: 'din-kulturu-ve-ahlak-bilgisi', 8: 'din-kulturu-ve-ahlak-bilgisi' },
  mixed: { 8: 'matematik' }
});

const STOP = new Set('bir ve ile için bu şu olan olarak göre en daha hangi nasıl nedir hangisidir öğrenci öğrencinin biçimde görevi tamamla kullandığın kanıtları açıkla öğrenme çıktısını gösterecek doğru uygun sonucu sonuç'.split(' '));
function tokens(value) {
  return new Set(String(value || '').toLocaleLowerCase('tr-TR').replace(/[^a-z0-9çğıöşü]+/gi, ' ').split(/\s+/).filter((token) => token.length >= 4 && !STOP.has(token)));
}
function overlapScore(left, right) {
  let score = 0;
  for (const token of left) if (right.has(token)) score += token.length >= 8 ? 3 : 1;
  return score;
}

function roundText(round) {
  return [round.prompt, round.context, round.topicId, round.learningOutcomeId, round.subjectId, round.familyId, ...(round.evidenceMap?.evidence || []).map((row) => row.text)].filter(Boolean).join(' ');
}
function catalogText(item) {
  return [item.id, item.curriculum?.topicId, item.content?.stem, item.construct?.primarySkill, ...(item.construct?.secondarySkills || []), ...(item.construct?.knowledgeComponents || [])].filter(Boolean).join(' ');
}

function curriculumReference(slot, round, catalog) {
  const courseId = COURSE_BY_GROUP_AND_GRADE[slot.courseGroup]?.[slot.grade];
  if (!courseId) throw new Error(`launch-pilot:no-course:${slot.slotId}`);
  const reference = catalog.find((item) => item.id === slot.curriculumReferenceId);
  if (!reference) throw new Error(`launch-pilot:curriculum-reference-not-found:${slot.slotId}:${slot.curriculumReferenceId}`);
  if (reference.curriculum.grade !== slot.grade || reference.curriculum.courseId !== courseId) {
    throw new Error(`launch-pilot:curriculum-reference-cell-mismatch:${slot.slotId}:${reference.id}`);
  }
  const exactOutcome = reference.curriculum.outcomeIds?.includes(round.learningOutcomeId);
  const status = exactOutcome
    ? 'EXACT_OUTCOME_REFERENCE'
    : slot.alignmentMode === 'SKILL_TRANSFER'
      ? 'EXPLICIT_SKILL_TRANSFER_HUMAN_CONFIRMATION_REQUIRED'
      : 'EXPLICIT_CURRICULUM_REFERENCE_HUMAN_CONFIRMATION_REQUIRED';
  return {
    courseId,
    reference,
    score: exactOutcome ? 100 : slot.alignmentMode === 'SKILL_TRANSFER' ? 75 : 90,
    status,
    mode: slot.alignmentMode || (exactOutcome ? 'EXACT_OUTCOME' : 'EXPLICIT_REFERENCE')
  };
}

function itemFormat(round) {
  if (round.kind === 'choice') return 'single-choice';
  if (round.kind === 'story') return 'open-response';
  if (round.kind === 'wordOrder') return 'matching';
  return 'interactive-simulation';
}
function rebalanceChoiceRound(round, targetAnswerIndex) {
  if (round.kind !== 'choice') return round;
  const options = [...(round.options || [])];
  const diagnostics = [...(round.optionDiagnostics || [])];
  const detailed = [...(round.detailedOptions || [])];
  const sourceAnswerIndex = round.answerIndex;
  if (sourceAnswerIndex !== targetAnswerIndex) {
    [options[sourceAnswerIndex], options[targetAnswerIndex]] = [options[targetAnswerIndex], options[sourceAnswerIndex]];
    if (diagnostics.length === options.length) [diagnostics[sourceAnswerIndex], diagnostics[targetAnswerIndex]] = [diagnostics[targetAnswerIndex], diagnostics[sourceAnswerIndex]];
    if (detailed.length === options.length) [detailed[sourceAnswerIndex], detailed[targetAnswerIndex]] = [detailed[targetAnswerIndex], detailed[sourceAnswerIndex]];
  }
  return freeze({
    ...round,
    options,
    answerIndex: targetAnswerIndex,
    optionDiagnostics: diagnostics.map((row, optionIndex) => ({ ...row, optionIndex, optionText: options[optionIndex], isCorrect: optionIndex === targetAnswerIndex })),
    ...(detailed.length ? { detailedOptions: detailed } : {}),
    pilotOptionShuffle: { sourceAnswerIndex, targetAnswerIndex }
  });
}
function optionRows(round) {
  return (round.options || []).map((text, index) => freeze({ id: ['A', 'B', 'C', 'D', 'E', 'F'][index] || `O${index + 1}`, text }));
}
function answerKey(round, options) {
  if (round.kind === 'choice') return freeze({ optionId: options[round.answerIndex]?.id || null, answerIndex: round.answerIndex });
  if (round.kind === 'wordOrder') return freeze({ acceptedOrder: round.answerTokens || round.correctOrder || round.answer || round.solution || null });
  if (round.kind === 'wordLadder') return freeze({ start: round.start, end: round.end, verifiedSteps: round.steps || [] });
  if (round.kind === 'wordMine') return freeze({ minimumAccepted: 8, verifiedWords: round.allowed || round.dictionary || [] });
  if (round.kind === 'expression') return freeze({ target: round.target, verifiedExpression: round.solution, sourceNumbers: round.numbers || round.values || [] });
  if (round.kind === 'story') return freeze({ rubric: round.evaluationRubric || [], forbiddenLetter: round.forbiddenLetter, minimumSentences: round.minSentences, minimumUniqueWords: round.minUniqueWords });
  return freeze({ verifiedPayload: true });
}
function verificationPassed(round) {
  if (round.kind === 'choice') return round.distractorValidation?.verified === true && Number.isInteger(round.answerIndex);
  return round.taskValidation?.verified === true;
}
function optionFeedback(round, options) {
  const diagnostics = round.optionDiagnostics || [];
  return options.map((option, index) => {
    const diagnostic = diagnostics.find((row) => row.optionIndex === index);
    return freeze({ optionId: option.id, isCorrect: index === round.answerIndex, rationale: diagnostic?.rationale || (index === round.answerIndex ? round.explanation : null), misconception: diagnostic?.misconception || null });
  });
}
function normalizedSolutionGraph(round) {
  if (Array.isArray(round.solutionGraph) && round.solutionGraph.length >= 3) return round.solutionGraph;
  const evidence = (round.evidenceMap?.evidence || []).map((row) => row.text).filter(Boolean);
  return [
    { step: 1, evidence: evidence[0] || 'Bağlamdaki temel veriler ve koşullar belirlenir.' },
    { step: 2, evidence: evidence[1] || 'Seçenekler bütün koşullar ve kanıtlarla karşılaştırılır.' },
    { step: 3, evidence: round.explanation || evidence[2] || 'Sonuç, verilen kanıtlarla doğrulanır.' }
  ];
}
function reviewMaterial(round, options, key) {
  return freeze({
    stimulus: round.context || null,
    stimulusBlocks: null,
    stem: round.prompt || '',
    options,
    answerKey: key,
    explanation: round.explanation || null,
    solutionGraph: normalizedSolutionGraph(round),
    hints: round.hints || [],
    optionFeedback: optionFeedback(round, options),
    verifier: { verified: verificationPassed(round), source: round.sourceLabel, premiumTier: round.premiumTier, sourceQuestionKey: round.questionKey },
    construct: { primarySkill: round.skill, topicId: round.topicId, learningOutcomeId: round.learningOutcomeId, cognitiveDepth: round.cognitiveDepth, reasoningStepCount: round.reasoningStepCount, cognitiveTraits: round.cognitiveTraits || [] },
    gamePayload: round
  });
}

function buildCandidate(slotRow, catalog, targetAnswerIndex = null) {
  const { slotId, grade, courseGroup, gameId, sourceKey } = slotRow;
  const round = targetAnswerIndex === null ? slotRow.round : rebalanceChoiceRound(slotRow.round, targetAnswerIndex);
  const alignment = curriculumReference(slotRow, round, catalog);
  const options = optionRows(round);
  const key = answerKey(round, options);
  const format = itemFormat(round);
  const questionId = `phase5h:${grade}:${gameId}:${sourceKey.split(':').slice(-2).join('-')}`;
  return freeze({
    schemaVersion: '2.0',
    candidateId: `launch-candidate:${questionId}`,
    slotId,
    questionId,
    sourceQuestionKey: sourceKey,
    grade,
    courseId: alignment.courseId,
    courseGroup,
    outcomeIds: [...(alignment.reference.curriculum.outcomeIds || [])],
    curriculumReferenceQuestionId: alignment.reference.id,
    curriculumAlignmentStatus: alignment.status,
    curriculumAlignmentScore: alignment.score,
    curriculumAlignmentMode: alignment.mode,
    curriculumHumanConfirmationRequired: true,
    itemFormat: format,
    risk: format === 'single-choice' ? 'LOW' : 'MEDIUM',
    suggestedGameId: gameId,
    allowedGameIds: [...LAUNCH_PILOT_GROUP_GAMES[courseGroup]],
    routeScore: 100,
    routeConfidence: 'HIGH',
    routeReasons: ['exact-versioned-game-bank-source'],
    independentVerificationPassed: verificationPassed(round),
    priorHumanContentApproval: false,
    answerOptionId: format === 'single-choice' ? key.optionId : null,
    engineeringSurfaceAuditRequired: true,
    reviewStatus: 'HUMAN_REVIEW_REQUIRED',
    gameAdaptationAllowed: false,
    publicationAllowed: false,
    reviewMaterial: reviewMaterial(round, options, key)
  });
}

export function coreCourseGroup(courseId) {
  if (courseId === 'turkce') return 'turkish';
  if (courseId === 'matematik') return 'math';
  if (courseId === 'fen-bilimleri') return 'science';
  if (['sosyal-bilgiler', 't-c-inkilap-tarihi-ve-ataturkculuk'].includes(courseId)) return 'social';
  if (['yabanci-dil', 'ingilizce'].includes(courseId)) return 'english';
  if (courseId === 'din-kulturu-ve-ahlak-bilgisi') return 'religion';
  return null;
}
export function launchPilotRiskOf(candidate) { return candidate?.risk || 'HIGH'; }

export function buildLaunchPilotCandidatePool({ catalog = ASSESSMENT_V2_CANONICAL_CATALOG, premiumBank = ASSESSMENT_V2_LAUNCH_PILOT_PREMIUM_BANK } = {}) {
  let choiceOrdinal = 0;
  const candidates = premiumBank.rows.map((row) => {
    const targetAnswerIndex = row.round.kind === 'choice' ? choiceOrdinal++ % 4 : null;
    return buildCandidate(row, catalog, targetAnswerIndex);
  });
  const gameCounts = Object.fromEntries([...new Set(candidates.map((row) => row.suggestedGameId))].sort().map((gameId) => [gameId, candidates.filter((row) => row.suggestedGameId === gameId).length]));
  const requiredCells = LAUNCH_PILOT_GRADES.flatMap((grade) => ['turkish', 'math', 'science', 'social', 'english', 'religion'].map((group) => `${grade}:${group}`));
  const cellCounts = Object.fromEntries(requiredCells.map((key) => [key, candidates.filter((row) => `${row.grade}:${row.courseGroup}` === key).length]));
  const answerPositionCounts = Object.fromEntries(['A', 'B', 'C', 'D'].map((id) => [id, candidates.filter((row) => row.answerOptionId === id).length]));
  return freeze({
    schemaVersion: '2.0', phase: '5H', id: 'ASSESSMENT_V2_CONTROLLED_LAUNCH_PILOT_30',
    title: '5–8 ana dersler ve 23 oyun kontrollü canlı pilot premium aday havuzu',
    status: 'ENGINEERING_AUDIT_AND_HUMAN_REVIEW_REQUIRED', generatedAt: new Date().toISOString(), profileId: CORE_GAME_RELEASE_PROFILE.id,
    candidateCount: candidates.length, requiredCurriculumCellCount: 24, requiredGameCount: 23, candidates,
    metrics: {
      uniqueQuestionCount: new Set(candidates.map((row) => row.questionId)).size,
      uniqueSourceQuestionCount: new Set(candidates.map((row) => row.sourceQuestionKey)).size,
      representedCurriculumCellCount: Object.values(cellCounts).filter((count) => count > 0).length,
      representedGameCount: Object.keys(gameCounts).length,
      lowRiskCount: candidates.filter((row) => row.risk === 'LOW').length,
      mediumRiskCount: candidates.filter((row) => row.risk === 'MEDIUM').length,
      highRiskCount: candidates.filter((row) => row.risk === 'HIGH').length,
      independentlyVerifiedCount: candidates.filter((row) => row.independentVerificationPassed).length,
      priorHumanContentApprovalCount: 0,
      exactCurriculumReferenceCount: candidates.filter((row) => row.curriculumAlignmentStatus === 'EXACT_OUTCOME_REFERENCE').length,
      curriculumHumanConfirmationRequiredCount: candidates.filter((row) => row.curriculumHumanConfirmationRequired).length,
      routeConfidence: { high: candidates.length, medium: 0, low: 0 },
      gameCounts, cellCounts, answerPositionCounts
    },
    automaticApproval: false, gameAdaptationAllowed: false, publicationAllowed: false, productReady: false
  });
}

export function auditLaunchPilotCandidatePool(pool = buildLaunchPilotCandidatePool()) {
  const errors = [];
  if (pool.candidateCount !== 30) errors.push(`candidate-count:${pool.candidateCount}`);
  if (pool.metrics.uniqueQuestionCount !== 30 || pool.metrics.uniqueSourceQuestionCount !== 30) errors.push('unique-question-source-count');
  if (pool.metrics.representedCurriculumCellCount !== 24) errors.push(`curriculum-cell-count:${pool.metrics.representedCurriculumCellCount}`);
  if (pool.metrics.representedGameCount !== 23) errors.push(`game-count:${pool.metrics.representedGameCount}`);
  if (pool.metrics.highRiskCount !== 0) errors.push(`high-risk:${pool.metrics.highRiskCount}`);
  if (pool.metrics.independentlyVerifiedCount !== 30) errors.push(`verification:${pool.metrics.independentlyVerifiedCount}`);
  if (Object.values(pool.metrics.cellCounts).some((count) => count < 1)) errors.push('empty-curriculum-cell');
  if (Object.values(pool.metrics.gameCounts).some((count) => count < 1)) errors.push('empty-game-route');
  if (pool.candidates.some((row) => row.routeConfidence !== 'HIGH' || !row.allowedGameIds.includes(row.suggestedGameId))) errors.push('invalid-exact-route');
  if (pool.candidates.some((row) => !row.curriculumReferenceQuestionId || !row.outcomeIds.length || !row.curriculumHumanConfirmationRequired || !row.curriculumAlignmentMode)) errors.push('curriculum-reference-contract');
  if (pool.candidates.some((row) => row.gameAdaptationAllowed || row.publicationAllowed)) errors.push('premature-candidate-release');
  if (pool.automaticApproval !== false || pool.publicationAllowed !== false || pool.productReady !== false) errors.push('premature-pool-release');
  return freeze({ ok: errors.length === 0, errors, metrics: pool.metrics });
}

export const ASSESSMENT_V2_LAUNCH_PILOT_CANDIDATE_POOL = buildLaunchPilotCandidatePool();
export const ASSESSMENT_V2_LAUNCH_PILOT_CANDIDATE_POOL_AUDIT = auditLaunchPilotCandidatePool(ASSESSMENT_V2_LAUNCH_PILOT_CANDIDATE_POOL);
