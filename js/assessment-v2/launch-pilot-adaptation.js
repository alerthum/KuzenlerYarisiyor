import { ASSESSMENT_V2_LAUNCH_PILOT_CANDIDATE_POOL } from './launch-pilot-candidate-pool.js';
import { ASSESSMENT_V2_LAUNCH_PILOT_EMPTY_CONSENSUS } from './launch-pilot-human-review.js';

const freeze = (value) => {
  if (Array.isArray(value)) return Object.freeze(value.map(freeze));
  if (value && typeof value === 'object') return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, child]) => [key, freeze(child)])));
  return value;
};

function canonicalPayload(candidate, confirmedGameId) {
  return {
    schemaVersion: '1.0',
    mode: 'ASSESSMENT_V2_CANONICAL_PILOT',
    sourceQuestionId: candidate.questionId,
    gameId: confirmedGameId,
    grade: candidate.grade,
    courseId: candidate.courseId,
    courseGroup: candidate.courseGroup,
    outcomeIds: [...candidate.outcomeIds],
    curriculumReferenceQuestionId: candidate.curriculumReferenceQuestionId,
    curriculumAlignmentStatus: candidate.curriculumAlignmentStatus,
    curriculumAlignmentMode: candidate.curriculumAlignmentMode,
    itemFormat: candidate.itemFormat,
    stimulus: candidate.reviewMaterial.stimulus,
    stimulusBlocks: candidate.reviewMaterial.stimulusBlocks,
    question: candidate.reviewMaterial.stem,
    options: candidate.reviewMaterial.options,
    answerKey: candidate.reviewMaterial.answerKey,
    explanation: candidate.reviewMaterial.explanation,
    solutionGraph: candidate.reviewMaterial.solutionGraph,
    hints: candidate.reviewMaterial.hints,
    optionFeedback: candidate.reviewMaterial.optionFeedback,
    construct: candidate.reviewMaterial.construct,
    gamePayload: candidate.reviewMaterial.gamePayload
  };
}

function reverseCheck(candidate, payload, confirmedGameId) {
  return {
    ok: payload.sourceQuestionId === candidate.questionId
      && payload.gameId === confirmedGameId
      && payload.question === candidate.reviewMaterial.stem
      && JSON.stringify(payload.options) === JSON.stringify(candidate.reviewMaterial.options)
      && JSON.stringify(payload.answerKey) === JSON.stringify(candidate.reviewMaterial.answerKey)
      && payload.explanation === candidate.reviewMaterial.explanation
      && JSON.stringify(payload.gamePayload) === JSON.stringify(candidate.reviewMaterial.gamePayload)
      && payload.curriculumReferenceQuestionId === candidate.curriculumReferenceQuestionId
      && JSON.stringify(payload.outcomeIds) === JSON.stringify(candidate.outcomeIds),
    sourceQuestionPreserved: payload.sourceQuestionId === candidate.questionId,
    routePreserved: payload.gameId === confirmedGameId,
    stemPreserved: payload.question === candidate.reviewMaterial.stem,
    optionsPreserved: JSON.stringify(payload.options) === JSON.stringify(candidate.reviewMaterial.options),
    answerPreserved: JSON.stringify(payload.answerKey) === JSON.stringify(candidate.reviewMaterial.answerKey),
    explanationPreserved: payload.explanation === candidate.reviewMaterial.explanation,
    gamePayloadPreserved: JSON.stringify(payload.gamePayload) === JSON.stringify(candidate.reviewMaterial.gamePayload),
    curriculumReferencePreserved: payload.curriculumReferenceQuestionId === candidate.curriculumReferenceQuestionId,
    curriculumPreserved: JSON.stringify(payload.outcomeIds) === JSON.stringify(candidate.outcomeIds)
  };
}

export function materializeLaunchPilotAdaptations({
  candidatePool = ASSESSMENT_V2_LAUNCH_PILOT_CANDIDATE_POOL,
  consensus = ASSESSMENT_V2_LAUNCH_PILOT_EMPTY_CONSENSUS
} = {}) {
  const consensusById = new Map(consensus.rows.map((row) => [row.candidateId, row]));
  const rows = [];
  const blockers = [];
  for (const candidate of candidatePool.candidates) {
    const approval = consensusById.get(candidate.candidateId);
    if (!approval || approval.status !== 'APPROVED_FOR_ADAPTATION' || !approval.confirmedGameId) {
      blockers.push(`${candidate.candidateId}:human-review-required`);
      continue;
    }
    const payload = canonicalPayload(candidate, approval.confirmedGameId);
    const semanticRoundTrip = reverseCheck(candidate, payload, approval.confirmedGameId);
    if (!semanticRoundTrip.ok) blockers.push(`${candidate.candidateId}:semantic-round-trip-failed`);
    rows.push({
      candidateId: candidate.candidateId,
      sourceQuestionId: candidate.questionId,
      gameId: approval.confirmedGameId,
      payload,
      semanticRoundTrip,
      studentPilotAllowed: semanticRoundTrip.ok,
      publicationAllowed: false
    });
  }
  return freeze({
    schemaVersion: '1.0',
    phase: '5H',
    status: blockers.length ? 'BLOCKED' : 'ADAPTATION_READY_FOR_STUDENT_PILOT',
    expectedCount: candidatePool.candidateCount,
    adaptedCount: rows.length,
    semanticRoundTripPassCount: rows.filter((row) => row.semanticRoundTrip.ok).length,
    representedGameCount: new Set(rows.map((row) => row.gameId)).size,
    rows,
    blockers,
    publicationAllowed: false,
    productReady: false
  });
}

export function auditLaunchPilotAdaptations(result) {
  const errors = [];
  if (!result || typeof result !== 'object') errors.push('result-required');
  else {
    if (result.status === 'ADAPTATION_READY_FOR_STUDENT_PILOT') {
      if (result.adaptedCount !== 30) errors.push(`adapted-count:${result.adaptedCount}`);
      if (result.semanticRoundTripPassCount !== 30) errors.push(`round-trip:${result.semanticRoundTripPassCount}`);
      if (result.representedGameCount !== 23) errors.push(`game-count:${result.representedGameCount}`);
      if (result.blockers.length) errors.push('ready-with-blockers');
    }
    if (result.rows?.some((row) => row.publicationAllowed !== false)) errors.push('premature-publication');
    if (result.publicationAllowed !== false || result.productReady !== false) errors.push('premature-release');
  }
  return freeze({ ok: errors.length === 0, errors });
}

export const ASSESSMENT_V2_LAUNCH_PILOT_BLOCKED_ADAPTATIONS = materializeLaunchPilotAdaptations();
