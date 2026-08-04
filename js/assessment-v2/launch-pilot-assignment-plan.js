import { ASSESSMENT_V2_LAUNCH_PILOT_CANDIDATE_POOL } from './launch-pilot-candidate-pool.js';

const freeze = (value) => {
  if (Array.isArray(value)) return Object.freeze(value.map(freeze));
  if (value && typeof value === 'object') return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, child]) => [key, freeze(child)])));
  return value;
};

function spreadAcrossSessions(candidates) {
  const buckets = new Map();
  for (const candidate of candidates) {
    const list = buckets.get(candidate.suggestedGameId) || [];
    list.push(candidate);
    buckets.set(candidate.suggestedGameId, list);
  }
  const ordered = [];
  while ([...buckets.values()].some((list) => list.length)) {
    for (const gameId of [...buckets.keys()].sort()) {
      const row = buckets.get(gameId).shift();
      if (row) ordered.push(row);
    }
  }
  return ordered;
}

export function buildLaunchPilotAssignmentPlan({
  candidatePool = ASSESSMENT_V2_LAUNCH_PILOT_CANDIDATE_POOL,
  participantSlotCount = 100,
  itemsPerParticipant = 24,
  itemsPerSession = 6
} = {}) {
  const candidates = [...candidatePool.candidates];
  if (candidates.length !== 30) throw new Error(`assignment-plan:expected-30-candidates:${candidates.length}`);
  if (participantSlotCount !== 100 || itemsPerParticipant !== 24) throw new Error('assignment-plan:locked-sampling-plan');
  if (itemsPerParticipant % itemsPerSession !== 0) throw new Error('assignment-plan:session-size');
  const participantSlots = [];
  for (let cycle = 0; cycle < 20; cycle += 1) {
    const permutation = Array.from({ length: 30 }, (_, index) => candidates[(index * 7 + cycle) % 30]);
    for (let omissionGroup = 0; omissionGroup < 5; omissionGroup += 1) {
      const omitted = new Set(permutation.slice(omissionGroup * 6, omissionGroup * 6 + 6).map((row) => row.candidateId));
      const included = spreadAcrossSessions(candidates.filter((row) => !omitted.has(row.candidateId)));
      const slotNumber = participantSlots.length + 1;
      const sessions = [];
      for (let index = 0; index < included.length; index += itemsPerSession) {
        sessions.push({
          sessionNo: sessions.length + 1,
          itemCount: included.slice(index, index + itemsPerSession).length,
          candidateIds: included.slice(index, index + itemsPerSession).map((row) => row.candidateId),
          questionIds: included.slice(index, index + itemsPerSession).map((row) => row.questionId),
          gameIds: included.slice(index, index + itemsPerSession).map((row) => row.suggestedGameId)
        });
      }
      participantSlots.push({
        participantSlotId: `pilot_slot_${String(slotNumber).padStart(3, '0')}`,
        cycle: cycle + 1,
        omissionGroup: omissionGroup + 1,
        itemCount: included.length,
        omittedCandidateIds: [...omitted],
        sessions
      });
    }
  }
  const exposureCounts = Object.fromEntries(candidates.map((candidate) => [
    candidate.candidateId,
    participantSlots.filter((slot) => slot.sessions.some((session) => session.candidateIds.includes(candidate.candidateId))).length
  ]));
  const gameExposureCounts = Object.fromEntries([...new Set(candidates.map((row) => row.suggestedGameId))].sort().map((gameId) => [
    gameId,
    participantSlots.reduce((sum, slot) => sum + slot.sessions.flatMap((session) => session.gameIds).filter((id) => id === gameId).length, 0)
  ]));
  return freeze({
    schemaVersion: '1.0',
    phase: '5H',
    pilotId: 'ASSESSMENT_V2_CONTROLLED_LAUNCH_PILOT_30',
    status: 'ASSIGNMENT_PLAN_READY_HUMAN_REVIEW_REQUIRED',
    datasetSourceRequired: 'REAL_STUDENT_PILOT',
    privacy: {
      piiCollectionAllowed: false,
      anonymousParticipantIdRequired: true,
      consentRequired: true,
      assignmentSlotsContainRealIdentity: false
    },
    sampling: {
      participantSlotCount,
      candidateCount: candidates.length,
      itemsPerParticipant,
      itemsPerSession,
      sessionsPerParticipant: itemsPerParticipant / itemsPerSession,
      expectedResponsesPerItem: 80,
      expectedTotalResponses: participantSlotCount * itemsPerParticipant
    },
    participantSlots,
    exposureCounts,
    gameExposureCounts,
    humanReviewComplete: false,
    publicationAllowed: false,
    productReady: false
  });
}

export function auditLaunchPilotAssignmentPlan(plan = buildLaunchPilotAssignmentPlan()) {
  const errors = [];
  if (plan.participantSlots.length !== 100) errors.push(`participant-slots:${plan.participantSlots.length}`);
  if (new Set(plan.participantSlots.map((slot) => slot.participantSlotId)).size !== 100) errors.push('duplicate-participant-slot');
  if (plan.participantSlots.some((slot) => slot.itemCount !== 24)) errors.push('participant-item-count');
  if (plan.participantSlots.some((slot) => slot.sessions.length !== 4 || slot.sessions.some((session) => session.itemCount !== 6))) errors.push('session-shape');
  if (plan.participantSlots.some((slot) => new Set(slot.sessions.flatMap((session) => session.candidateIds)).size !== 24)) errors.push('participant-duplicate-item');
  if (Object.values(plan.exposureCounts).some((count) => count !== 80)) errors.push('item-exposure-not-80');
  if (Object.keys(plan.exposureCounts).length !== 30) errors.push('item-exposure-count');
  if (plan.sampling.expectedTotalResponses !== 2400) errors.push(`total-responses:${plan.sampling.expectedTotalResponses}`);
  if (plan.privacy.piiCollectionAllowed !== false || plan.publicationAllowed !== false || plan.productReady !== false) errors.push('premature-release');
  return freeze({ ok: errors.length === 0, errors, metrics: { participantSlots: plan.participantSlots.length, itemCount: Object.keys(plan.exposureCounts).length, expectedResponsesPerItem: 80, expectedTotalResponses: plan.sampling.expectedTotalResponses, sessionCount: plan.participantSlots.reduce((sum, slot) => sum + slot.sessions.length, 0) } });
}

export const ASSESSMENT_V2_LAUNCH_PILOT_ASSIGNMENT_PLAN = buildLaunchPilotAssignmentPlan();
export const ASSESSMENT_V2_LAUNCH_PILOT_ASSIGNMENT_PLAN_AUDIT = auditLaunchPilotAssignmentPlan(ASSESSMENT_V2_LAUNCH_PILOT_ASSIGNMENT_PLAN);
