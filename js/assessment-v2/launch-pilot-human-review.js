import { ASSESSMENT_V2_LAUNCH_PILOT_CANDIDATE_POOL } from './launch-pilot-candidate-pool.js';

const DECISIONS = new Set(['APPROVE', 'REVISE', 'REJECT']);
const PII_KEYS = new Set(['name', 'fullName', 'email', 'phone', 'address', 'tcKimlik', 'nationalId', 'birthDate']);
export const LAUNCH_PILOT_REVIEW_DIMENSIONS = Object.freeze([
  'correctness',
  'curriculumAlignment',
  'optionOrRubricQuality',
  'ageLanguageFit',
  'hintNonLeakage',
  'feedbackTeachingValue',
  'naturalness',
  'gameFit',
  'pilotSuitability'
]);

function piiErrors(value, path = '') {
  if (!value || typeof value !== 'object') return [];
  const out = [];
  for (const [key, child] of Object.entries(value)) {
    const next = path ? `${path}.${key}` : key;
    if (PII_KEYS.has(key)) out.push(`pii-forbidden:${next}`);
    out.push(...piiErrors(child, next));
  }
  return out;
}
function text(value, field) {
  const output = String(value ?? '').trim();
  if (!output) throw new Error(`${field}:required`);
  return output;
}
function score(value, field) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1 || number > 5) throw new Error(`${field}:must-be-1-5`);
  return number;
}

export function requiredLaunchPilotReviewerCount(candidate) {
  if (!candidate) return 2;
  if (candidate.risk === 'HIGH') return 2;
  if (candidate.routeConfidence === 'LOW') return 2;
  if (candidate.itemFormat !== 'single-choice') return 2;
  if (candidate.curriculumAlignmentStatus !== 'EXACT_OUTCOME_REFERENCE') return 2;
  return 1;
}

export function defineLaunchPilotReviewDecision(input = {}, candidatePool = ASSESSMENT_V2_LAUNCH_PILOT_CANDIDATE_POOL) {
  const pii = piiErrors(input);
  if (pii.length) throw new Error(pii.join(','));
  const candidateId = text(input.candidateId, 'candidateId');
  const candidate = candidatePool.candidates.find((row) => row.candidateId === candidateId);
  if (!candidate) throw new Error('candidateId:not-found');
  const questionId = text(input.questionId, 'questionId');
  if (questionId !== candidate.questionId) throw new Error('questionId:candidate-mismatch');
  const reviewerAnonId = text(input.reviewerAnonId, 'reviewerAnonId');
  if (!/^reviewer_[a-z0-9_-]{6,80}$/i.test(reviewerAnonId)) throw new Error('reviewerAnonId:not-anonymous');
  const reviewerRole = text(input.reviewerRole || 'CONTENT_AND_GAME_REVIEWER', 'reviewerRole');
  if (!['CONTENT_AND_GAME_REVIEWER', 'CURRICULUM_REVIEWER'].includes(reviewerRole)) throw new Error('reviewerRole:unsupported');
  const decision = text(input.decision, 'decision');
  if (!DECISIONS.has(decision)) throw new Error('decision:unsupported');
  const confirmedGameId = text(input.confirmedGameId || candidate.suggestedGameId, 'confirmedGameId');
  if (!candidate.allowedGameIds.includes(confirmedGameId)) throw new Error('confirmedGameId:not-allowed-for-course-group');
  const scores = Object.fromEntries(LAUNCH_PILOT_REVIEW_DIMENSIONS.map((dimension) => [dimension, score(input.scores?.[dimension], `scores.${dimension}`)]));
  const criticalBlockers = Object.freeze([...(input.criticalBlockers || [])].map(String).filter(Boolean));
  if (decision === 'APPROVE' && (criticalBlockers.length || Object.values(scores).some((value) => value < 4))) {
    throw new Error('approve:quality-threshold-not-met');
  }
  const reviewedAt = text(input.reviewedAt, 'reviewedAt');
  if (!Number.isFinite(Date.parse(reviewedAt))) throw new Error('reviewedAt:invalid');
  return Object.freeze({
    schemaVersion: '1.0',
    reviewId: text(input.reviewId, 'reviewId'),
    batchId: text(input.batchId || 'PHASE5H_LAUNCH_PILOT_30', 'batchId'),
    candidateId,
    questionId,
    suggestedGameId: candidate.suggestedGameId,
    confirmedGameId,
    reviewerAnonId,
    reviewerRole,
    decision,
    scores: Object.freeze(scores),
    criticalBlockers,
    notes: String(input.notes || '').trim(),
    reviewedAt
  });
}

export function auditLaunchPilotReviewDecisions(rows = [], candidatePool = ASSESSMENT_V2_LAUNCH_PILOT_CANDIDATE_POOL) {
  const errors = [];
  const normalized = [];
  for (let index = 0; index < rows.length; index += 1) {
    try { normalized.push(defineLaunchPilotReviewDecision(rows[index], candidatePool)); }
    catch (error) { errors.push(`${index}:${error.message}`); }
  }
  if (new Set(normalized.map((row) => row.reviewId)).size !== normalized.length) errors.push('duplicate-review-id');
  const pairs = normalized.map((row) => `${row.candidateId}:${row.reviewerAnonId}`);
  if (new Set(pairs).size !== pairs.length) errors.push('duplicate-reviewer-candidate');
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors), rows: Object.freeze(normalized) });
}

export function buildLaunchPilotReviewConsensus({ candidatePool = ASSESSMENT_V2_LAUNCH_PILOT_CANDIDATE_POOL, decisions = [] } = {}) {
  const audit = auditLaunchPilotReviewDecisions(decisions, candidatePool);
  const byCandidate = new Map();
  for (const decision of audit.rows) {
    const list = byCandidate.get(decision.candidateId) || [];
    list.push(decision);
    byCandidate.set(decision.candidateId, list);
  }
  const rows = candidatePool.candidates.map((candidate) => {
    const reviews = byCandidate.get(candidate.candidateId) || [];
    const requiredReviewerCount = requiredLaunchPilotReviewerCount(candidate);
    const uniqueReviewerCount = new Set(reviews.map((review) => review.reviewerAnonId)).size;
    const confirmedGames = [...new Set(reviews.filter((review) => review.decision === 'APPROVE').map((review) => review.confirmedGameId))];
    const approveCount = reviews.filter((review) => review.decision === 'APPROVE').length;
    const curriculumReviewerRequired = candidate.curriculumAlignmentStatus !== 'EXACT_OUTCOME_REFERENCE';
    const curriculumReviewerCount = reviews.filter((review) => review.reviewerRole === 'CURRICULUM_REVIEWER').length;
    const rejectCount = reviews.filter((review) => review.decision === 'REJECT').length;
    const reviseCount = reviews.filter((review) => review.decision === 'REVISE').length;
    const averageScores = Object.fromEntries(LAUNCH_PILOT_REVIEW_DIMENSIONS.map((dimension) => [
      dimension,
      reviews.length ? Number((reviews.reduce((sum, review) => sum + review.scores[dimension], 0) / reviews.length).toFixed(2)) : null
    ]));
    let status = 'PENDING';
    if (rejectCount > 0) status = 'REJECTED';
    else if (reviseCount > 0) status = 'REVISION_REQUIRED';
    else if (confirmedGames.length > 1) status = 'ROUTE_CONFLICT';
    else if (
      uniqueReviewerCount >= requiredReviewerCount
      && reviews.length >= requiredReviewerCount
      && approveCount === reviews.length
      && (!curriculumReviewerRequired || curriculumReviewerCount >= 1)
      && Object.values(averageScores).every((value) => value >= 4)
    ) status = 'APPROVED_FOR_ADAPTATION';
    else if (reviews.length) status = 'MORE_REVIEWS_REQUIRED';
    return Object.freeze({
      candidateId: candidate.candidateId,
      questionId: candidate.questionId,
      suggestedGameId: candidate.suggestedGameId,
      confirmedGameId: confirmedGames.length === 1 ? confirmedGames[0] : null,
      requiredReviewerCount,
      completedReviewerCount: uniqueReviewerCount,
      curriculumReviewerRequired,
      curriculumReviewerCount,
      status,
      averageScores: Object.freeze(averageScores),
      decisions: Object.freeze(reviews.map((review) => review.decision)),
      gameAdaptationAllowed: status === 'APPROVED_FOR_ADAPTATION',
      publicationAllowed: false
    });
  });
  const metrics = Object.freeze({
    total: rows.length,
    approvedForAdaptation: rows.filter((row) => row.status === 'APPROVED_FOR_ADAPTATION').length,
    pending: rows.filter((row) => ['PENDING', 'MORE_REVIEWS_REQUIRED'].includes(row.status)).length,
    revisionRequired: rows.filter((row) => row.status === 'REVISION_REQUIRED').length,
    rejected: rows.filter((row) => row.status === 'REJECTED').length,
    routeConflict: rows.filter((row) => row.status === 'ROUTE_CONFLICT').length,
    completedDecisionCount: audit.rows.length
  });
  return Object.freeze({
    schemaVersion: '1.0',
    phase: '5H',
    status: audit.ok ? (metrics.approvedForAdaptation === rows.length ? 'HUMAN_REVIEW_COMPLETE' : 'HUMAN_REVIEW_REQUIRED') : 'INVALID_DECISIONS',
    generatedAt: new Date().toISOString(),
    productReady: false,
    publicationAllowed: false,
    metrics,
    rows: Object.freeze(rows),
    errors: audit.errors
  });
}

export const ASSESSMENT_V2_LAUNCH_PILOT_EMPTY_CONSENSUS = buildLaunchPilotReviewConsensus();
