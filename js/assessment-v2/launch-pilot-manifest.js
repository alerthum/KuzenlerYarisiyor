import { ASSESSMENT_V2_LAUNCH_PILOT_CANDIDATE_POOL } from './launch-pilot-candidate-pool.js';
import { ASSESSMENT_V2_LAUNCH_PILOT_ASSIGNMENT_PLAN } from './launch-pilot-assignment-plan.js';

function responseModeFor(format) {
  if (format === 'single-choice') return 'CHOICE';
  if (format === 'matching') return 'MATCHING';
  if (format === 'interactive-simulation') return 'INTERACTION';
  return 'RUBRIC';
}

export function launchPilotItemDescriptors(candidatePool = ASSESSMENT_V2_LAUNCH_PILOT_CANDIDATE_POOL) {
  return Object.freeze(candidatePool.candidates.map((candidate) => {
    const options = candidate.reviewMaterial?.options || [];
    return Object.freeze({
      candidateId: candidate.candidateId,
      itemId: candidate.questionId,
      gameId: candidate.suggestedGameId,
      grade: candidate.grade,
      courseId: candidate.courseId,
      courseGroup: candidate.courseGroup,
      curriculumReferenceQuestionId: candidate.curriculumReferenceQuestionId,
      curriculumAlignmentStatus: candidate.curriculumAlignmentStatus,
      curriculumAlignmentMode: candidate.curriculumAlignmentMode,
      outcomeIds: Object.freeze([...candidate.outcomeIds]),
      itemFormat: candidate.itemFormat,
      responseMode: responseModeFor(candidate.itemFormat),
      correctOptionId: candidate.itemFormat === 'single-choice' ? candidate.answerOptionId : null,
      optionIds: Object.freeze(options.map((option) => option.id)),
      maximumRubricScore: candidate.itemFormat === 'single-choice' ? 1 : 4,
      humanReviewRequired: true,
      gameAdaptationAllowed: false,
      publicationAllowed: false
    });
  }));
}

export function buildLaunchPilotManifest({
  candidatePool = ASSESSMENT_V2_LAUNCH_PILOT_CANDIDATE_POOL,
  assignmentPlan = ASSESSMENT_V2_LAUNCH_PILOT_ASSIGNMENT_PLAN
} = {}) {
  return Object.freeze({
    schemaVersion: '2.0',
    phase: '5H',
    pilotId: 'ASSESSMENT_V2_CONTROLLED_LAUNCH_PILOT_30',
    title: '5–8 ana dersler ve 23 oyun kontrollü canlı öğrenci pilotu',
    status: 'ENGINE_AND_ASSIGNMENT_READY_HUMAN_REVIEW_REQUIRED',
    productReady: false,
    publicationAllowed: false,
    datasetSourceRequired: 'REAL_STUDENT_PILOT',
    privacy: Object.freeze({
      piiCollectionAllowed: false,
      anonymousParticipantIdRequired: true,
      informedConsentRequired: true,
      guardianConsentRequiredForMinors: true,
      rawResponseRetentionDays: 90,
      aggregateRetentionAllowed: true,
      assignmentSlotsContainRealIdentity: false
    }),
    sampling: Object.freeze({
      minimumUniqueParticipants: 100,
      targetUniqueParticipants: 100,
      minimumResponsesPerItem: 80,
      itemCount: candidatePool.candidateCount,
      itemsPerParticipant: assignmentPlan.sampling.itemsPerParticipant,
      sessionsPerParticipant: assignmentPlan.sampling.sessionsPerParticipant,
      itemsPerSession: assignmentPlan.sampling.itemsPerSession,
      expectedTotalResponses: assignmentPlan.sampling.expectedTotalResponses,
      gradeBands: Object.freeze([5, 6, 7, 8]),
      pilotMode: 'CONTROLLED_SCHOOL_OR_INVITED_COHORT'
    }),
    items: launchPilotItemDescriptors(candidatePool),
    assignmentPlanId: assignmentPlan.pilotId,
    gates: Object.freeze([
      '30-of-30-engineering-content-quality-pass',
      '30-of-30-human-review-approved-for-adaptation',
      '23-of-23-game-routes-confirmed-by-human-review',
      '24-of-24-grade-course-cells-retained',
      'curriculum-reference-confirmed-by-human-review',
      '30-of-30-semantic-round-trip-pass',
      'real-student-pilot-evidence-only',
      'at-least-100-anonymous-participants',
      'at-least-80-responses-per-item',
      'item-difficulty-0.20-0.90',
      'item-discrimination-at-least-0.20',
      'maximum-one-nonfunctional-distractor-for-choice-items',
      'omission-rate-at-most-0.10',
      'technical-release-evidence-pass'
    ])
  });
}

export const ASSESSMENT_V2_LAUNCH_PILOT_MANIFEST = buildLaunchPilotManifest();
