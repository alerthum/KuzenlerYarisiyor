import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ASSESSMENT_V2_LAUNCH_PILOT_CANDIDATE_POOL,
  ASSESSMENT_V2_LAUNCH_PILOT_CANDIDATE_POOL_AUDIT
} from '../../js/assessment-v2/launch-pilot-candidate-pool.js';
import {
  ASSESSMENT_V2_LAUNCH_PILOT_ASSIGNMENT_PLAN,
  ASSESSMENT_V2_LAUNCH_PILOT_ASSIGNMENT_PLAN_AUDIT
} from '../../js/assessment-v2/launch-pilot-assignment-plan.js';
import {
  defineLaunchPilotReviewDecision,
  auditLaunchPilotReviewDecisions,
  buildLaunchPilotReviewConsensus,
  requiredLaunchPilotReviewerCount,
  LAUNCH_PILOT_REVIEW_DIMENSIONS
} from '../../js/assessment-v2/launch-pilot-human-review.js';
import { materializeLaunchPilotAdaptations, auditLaunchPilotAdaptations } from '../../js/assessment-v2/launch-pilot-adaptation.js';
import { ASSESSMENT_V2_LAUNCH_PILOT_CONTENT_QUALITY_AUDIT } from '../../js/assessment-v2/launch-pilot-content-quality.js';
import { ASSESSMENT_V2_LAUNCH_PILOT_MANIFEST } from '../../js/assessment-v2/launch-pilot-manifest.js';
import { evaluateControlledLaunchPilotGate, auditControlledLaunchPilotGate } from '../../js/assessment-v2/controlled-launch-pilot-gate.js';
import { defineStudentPilotResponse } from '../../js/assessment-v2/student-pilot-contract.js';
import { adaptAttemptToStudentPilotResponse } from '../../js/assessment-v2/student-pilot-attempt-adapter.js';
import { auditLaunchPilotStudentResponses, analyzeLaunchPilotStudentResponses } from '../../js/assessment-v2/launch-pilot-student-analysis.js';

const scores = Object.fromEntries(LAUNCH_PILOT_REVIEW_DIMENSIONS.map((dimension) => [dimension, 5]));

function approvedDecisions() {
  return ASSESSMENT_V2_LAUNCH_PILOT_CANDIDATE_POOL.candidates.flatMap((candidate, candidateIndex) => {
    const count = requiredLaunchPilotReviewerCount(candidate);
    return Array.from({ length: count }, (_, reviewerIndex) => defineLaunchPilotReviewDecision({
      reviewId: `phase5h_${candidateIndex}_${reviewerIndex}`,
      batchId: 'PHASE5H_LAUNCH_PILOT_30',
      candidateId: candidate.candidateId,
      questionId: candidate.questionId,
      reviewerAnonId: `reviewer_phase5h_${reviewerIndex + 1}`,
      reviewerRole: candidate.curriculumAlignmentStatus !== 'EXACT_OUTCOME_REFERENCE' && reviewerIndex === 1 ? 'CURRICULUM_REVIEWER' : 'CONTENT_AND_GAME_REVIEWER',
      confirmedGameId: candidate.suggestedGameId,
      decision: 'APPROVE',
      scores,
      criticalBlockers: [],
      notes: 'Sentetik sözleşme testi; gerçek insan kararı değildir.',
      reviewedAt: `2026-08-04T19:${String(candidateIndex).padStart(2, '0')}:00.000Z`
    }));
  });
}

test('kontrollü pilot aday havuzu 30 benzersiz görevle 24 hücreyi ve 23 oyunu kapsar', () => {
  assert.equal(ASSESSMENT_V2_LAUNCH_PILOT_CANDIDATE_POOL_AUDIT.ok, true, ASSESSMENT_V2_LAUNCH_PILOT_CANDIDATE_POOL_AUDIT.errors.join('\n'));
  assert.equal(ASSESSMENT_V2_LAUNCH_PILOT_CANDIDATE_POOL.candidateCount, 30);
  assert.equal(ASSESSMENT_V2_LAUNCH_PILOT_CANDIDATE_POOL.metrics.representedCurriculumCellCount, 24);
  assert.equal(ASSESSMENT_V2_LAUNCH_PILOT_CANDIDATE_POOL.metrics.representedGameCount, 23);
  assert.equal(ASSESSMENT_V2_LAUNCH_PILOT_CANDIDATE_POOL.metrics.highRiskCount, 0);
  assert.equal(ASSESSMENT_V2_LAUNCH_PILOT_CANDIDATE_POOL.metrics.independentlyVerifiedCount, 30);
  assert.ok(ASSESSMENT_V2_LAUNCH_PILOT_CANDIDATE_POOL.candidates.every((candidate) => candidate.publicationAllowed === false));
});

test('30 pilot görevin tamamı gerçek metin, şık/rubrik, kazanım ve oyun-native kalite denetimini geçer', () => {
  assert.equal(ASSESSMENT_V2_LAUNCH_PILOT_CONTENT_QUALITY_AUDIT.ok, true, JSON.stringify(ASSESSMENT_V2_LAUNCH_PILOT_CONTENT_QUALITY_AUDIT, null, 2));
  assert.equal(ASSESSMENT_V2_LAUNCH_PILOT_CONTENT_QUALITY_AUDIT.metrics.passed, 30);
  assert.equal(ASSESSMENT_V2_LAUNCH_PILOT_CONTENT_QUALITY_AUDIT.metrics.goldCount, 30);
  assert.equal(ASSESSMENT_V2_LAUNCH_PILOT_CONTENT_QUALITY_AUDIT.metrics.answerBalanceSpread <= 1, true);
});

test('100 anonim öğrenci slotu her göreve tam 80 yanıt ve öğrenci başına 4x6 görev planlar', () => {
  assert.equal(ASSESSMENT_V2_LAUNCH_PILOT_ASSIGNMENT_PLAN_AUDIT.ok, true, ASSESSMENT_V2_LAUNCH_PILOT_ASSIGNMENT_PLAN_AUDIT.errors.join('\n'));
  assert.equal(ASSESSMENT_V2_LAUNCH_PILOT_ASSIGNMENT_PLAN.participantSlots.length, 100);
  assert.deepEqual([...new Set(Object.values(ASSESSMENT_V2_LAUNCH_PILOT_ASSIGNMENT_PLAN.exposureCounts))], [80]);
  assert.equal(ASSESSMENT_V2_LAUNCH_PILOT_ASSIGNMENT_PLAN.sampling.expectedTotalResponses, 2400);
  assert.ok(ASSESSMENT_V2_LAUNCH_PILOT_ASSIGNMENT_PLAN.participantSlots.every((slot) => slot.sessions.length === 4 && slot.sessions.every((session) => session.itemCount === 6)));
});

test('oyun uyumu ve pilot uygunluğu 4 altında olan görev APPROVE edilemez', () => {
  const candidate = ASSESSMENT_V2_LAUNCH_PILOT_CANDIDATE_POOL.candidates[0];
  assert.throws(() => defineLaunchPilotReviewDecision({
    reviewId: 'invalid_low_game_fit',
    candidateId: candidate.candidateId,
    questionId: candidate.questionId,
    reviewerAnonId: 'reviewer_phase5h_x',
    confirmedGameId: candidate.suggestedGameId,
    decision: 'APPROVE',
    scores: { ...scores, gameFit: 3 },
    reviewedAt: '2026-08-04T19:00:00.000Z'
  }), /quality-threshold/);
});

test('etkileşimli veya exact olmayan kazanım eşleşmesi iki bağımsız uzman ister', () => {
  const candidate = ASSESSMENT_V2_LAUNCH_PILOT_CANDIDATE_POOL.candidates.find((row) => row.itemFormat !== 'single-choice' || row.curriculumAlignmentStatus !== 'EXACT_OUTCOME_REFERENCE');
  assert.equal(requiredLaunchPilotReviewerCount(candidate), 2);
  const one = approvedDecisions().filter((row) => row.candidateId === candidate.candidateId).slice(0, 1);
  const consensus = buildLaunchPilotReviewConsensus({ decisions: one });
  assert.equal(consensus.rows.find((row) => row.candidateId === candidate.candidateId).status, 'MORE_REVIEWS_REQUIRED');
});

test('exact olmayan kazanım eşleşmesi en az bir müfredat uzmanı kararı olmadan onaylanmaz', () => {
  const candidate = ASSESSMENT_V2_LAUNCH_PILOT_CANDIDATE_POOL.candidates.find((row) => row.curriculumAlignmentStatus !== 'EXACT_OUTCOME_REFERENCE');
  const decisions = Array.from({ length: 2 }, (_, reviewerIndex) => defineLaunchPilotReviewDecision({
    reviewId: `missing_curriculum_role_${reviewerIndex}`,
    candidateId: candidate.candidateId,
    questionId: candidate.questionId,
    reviewerAnonId: `reviewer_no_curriculum_${reviewerIndex}`,
    reviewerRole: 'CONTENT_AND_GAME_REVIEWER',
    confirmedGameId: candidate.suggestedGameId,
    decision: 'APPROVE', scores, reviewedAt: `2026-08-04T20:0${reviewerIndex}:00.000Z`
  }));
  const consensus = buildLaunchPilotReviewConsensus({ decisions });
  assert.equal(consensus.rows.find((row) => row.candidateId === candidate.candidateId).status, 'MORE_REVIEWS_REQUIRED');
});



test('inceleme sözleşmesi PII, desteklenmeyen rol ve çift reviewer-candidate kararını reddeder', () => {
  const candidate = ASSESSMENT_V2_LAUNCH_PILOT_CANDIDATE_POOL.candidates[0];
  assert.throws(() => defineLaunchPilotReviewDecision({
    reviewId: 'pii_review',
    candidateId: candidate.candidateId,
    questionId: candidate.questionId,
    reviewerAnonId: 'reviewer_phase5h_pii',
    reviewerRole: 'CONTENT_AND_GAME_REVIEWER',
    confirmedGameId: candidate.suggestedGameId,
    decision: 'APPROVE',
    scores,
    email: 'forbidden@example.com',
    reviewedAt: '2026-08-04T20:10:00.000Z'
  }), /pii-forbidden/);
  assert.throws(() => defineLaunchPilotReviewDecision({
    reviewId: 'bad_role_review',
    candidateId: candidate.candidateId,
    questionId: candidate.questionId,
    reviewerAnonId: 'reviewer_phase5h_role',
    reviewerRole: 'ADMIN',
    confirmedGameId: candidate.suggestedGameId,
    decision: 'APPROVE',
    scores,
    reviewedAt: '2026-08-04T20:11:00.000Z'
  }), /reviewerRole:unsupported/);
  const decision = defineLaunchPilotReviewDecision({
    reviewId: 'duplicate_pair_1',
    candidateId: candidate.candidateId,
    questionId: candidate.questionId,
    reviewerAnonId: 'reviewer_phase5h_dup',
    reviewerRole: 'CONTENT_AND_GAME_REVIEWER',
    confirmedGameId: candidate.suggestedGameId,
    decision: 'APPROVE',
    scores,
    reviewedAt: '2026-08-04T20:12:00.000Z'
  });
  const audit = auditLaunchPilotReviewDecisions([decision, { ...decision, reviewId: 'duplicate_pair_2' }]);
  assert.equal(audit.ok, false);
  assert.ok(audit.errors.includes('duplicate-reviewer-candidate'));
});
test('30 görev yapay sözleşme kararlarıyla onaylandığında semantik round-trip 30/30 ve oyun 23/23 olur', () => {
  const consensus = buildLaunchPilotReviewConsensus({ decisions: approvedDecisions() });
  assert.equal(consensus.status, 'HUMAN_REVIEW_COMPLETE');
  assert.equal(consensus.metrics.approvedForAdaptation, 30);
  const adaptations = materializeLaunchPilotAdaptations({ consensus });
  const audit = auditLaunchPilotAdaptations(adaptations);
  assert.equal(audit.ok, true, audit.errors.join('\n'));
  assert.equal(adaptations.adaptedCount, 30);
  assert.equal(adaptations.semanticRoundTripPassCount, 30);
  assert.equal(adaptations.representedGameCount, 23);
  assert.equal(adaptations.publicationAllowed, false);
  assert.ok(adaptations.rows.every((row) => row.semanticRoundTrip.explanationPreserved));
  assert.ok(adaptations.rows.every((row) => row.semanticRoundTrip.gamePayloadPreserved));
  assert.ok(adaptations.rows.every((row) => row.semanticRoundTrip.curriculumReferencePreserved));
});

test('kontrollü pilot manifesti 30 görev, 100 katılımcı ve görev başına 80 yanıt eşiğini kilitler', () => {
  assert.equal(ASSESSMENT_V2_LAUNCH_PILOT_MANIFEST.items.length, 30);
  assert.equal(ASSESSMENT_V2_LAUNCH_PILOT_MANIFEST.sampling.minimumUniqueParticipants, 100);
  assert.equal(ASSESSMENT_V2_LAUNCH_PILOT_MANIFEST.sampling.minimumResponsesPerItem, 80);
  assert.equal(ASSESSMENT_V2_LAUNCH_PILOT_MANIFEST.sampling.expectedTotalResponses, 2400);
  assert.equal(ASSESSMENT_V2_LAUNCH_PILOT_MANIFEST.privacy.piiCollectionAllowed, false);
  assert.equal(ASSESSMENT_V2_LAUNCH_PILOT_MANIFEST.publicationAllowed, false);
  assert.ok(ASSESSMENT_V2_LAUNCH_PILOT_MANIFEST.items.every((item) => item.curriculumReferenceQuestionId));
  assert.ok(ASSESSMENT_V2_LAUNCH_PILOT_MANIFEST.items.every((item) => item.curriculumAlignmentStatus));
});

test('açık yanıt pilot kaydı seçenek kimliği olmadan rubrik puanı taşıyabilir', () => {
  const response = defineStudentPilotResponse({
    responseId: 'rubric_response_1',
    pilotId: 'ASSESSMENT_V2_CONTROLLED_LAUNCH_PILOT_30',
    datasetSource: 'REAL_STUDENT_PILOT',
    participantAnonId: 'anon_rubric_0001',
    itemId: 'open_item_1',
    gameId: 'science-lab',
    grade: 6,
    responseMode: 'RUBRIC',
    selectedOptionId: null,
    omitted: false,
    score: 3,
    maxScore: 4,
    responseTimeMs: 65000,
    hintsUsed: 1,
    attemptNumber: 1,
    startedAt: '2026-08-04T19:00:00.000Z',
    submittedAt: '2026-08-04T19:01:05.000Z'
  });
  assert.equal(response.responseMode, 'RUBRIC');
  assert.equal(response.selectedOptionId, null);
  assert.equal(response.score, 3);
});

test('uygulama denemesi açık yanıtı yanlışlıkla boş saymadan pilot yanıtına dönüştürür', () => {
  const descriptor = ASSESSMENT_V2_LAUNCH_PILOT_MANIFEST.items.find((item) => item.itemFormat !== 'single-choice');
  const response = adaptAttemptToStudentPilotResponse({
    pilotId: ASSESSMENT_V2_LAUNCH_PILOT_MANIFEST.pilotId,
    pilotSalt: 'phase5h-secret',
    profileId: 'local-profile-22',
    itemDescriptor: descriptor,
    attempt: {
      id: 'open_attempt_1',
      sourceQuestionId: descriptor.itemId,
      gameId: descriptor.gameId,
      grade: descriptor.grade,
      score: 3,
      maxScore: 4,
      elapsedSeconds: 75,
      answeredAt: '2026-08-04T19:02:00.000Z'
    }
  });
  assert.equal(response.omitted, false);
  assert.equal(response.responseMode === 'RUBRIC' || response.responseMode === 'INTERACTION' || response.responseMode === 'MATCHING', true);
  assert.equal(response.score, 3);
  assert.equal(response.maxScore, 4);
});



test('Phase 5H öğrenci protokolü oyun, sınıf, kaynak ve participant-item tekrarını doğrular', () => {
  const descriptor = ASSESSMENT_V2_LAUNCH_PILOT_MANIFEST.items[0];
  const base = {
    responseId: 'phase5h_protocol_1',
    pilotId: ASSESSMENT_V2_LAUNCH_PILOT_MANIFEST.pilotId,
    datasetSource: 'REAL_STUDENT_PILOT',
    participantAnonId: 'anon_phase5h_0001',
    itemId: descriptor.itemId,
    gameId: descriptor.gameId,
    grade: descriptor.grade,
    responseMode: descriptor.responseMode,
    selectedOptionId: descriptor.itemFormat === 'single-choice' ? descriptor.correctOptionId : null,
    omitted: false,
    score: 1,
    maxScore: 1,
    responseTimeMs: 42000,
    hintsUsed: 0,
    attemptNumber: 1,
    startedAt: '2026-08-04T20:20:00.000Z',
    submittedAt: '2026-08-04T20:20:42.000Z'
  };
  const invalid = auditLaunchPilotStudentResponses([
    base,
    { ...base, responseId: 'phase5h_protocol_2', gameId: 'wrong-game' }
  ]);
  assert.equal(invalid.ok, false);
  assert.ok(invalid.errors.some((error) => error.startsWith('game-mismatch:')));
  assert.ok(invalid.errors.includes('duplicate-participant-item-response'));
  const simulated = analyzeLaunchPilotStudentResponses({ rows: [{ ...base, datasetSource: 'SIMULATED_FIXTURE' }] });
  assert.equal(simulated.status, 'INVALID_DATA');
  assert.ok(simulated.errors.some((error) => error.startsWith('dataset-source:')));
});
test('simülasyon veya eksik insan kararı kontrollü canlı pilot kapısını açamaz', () => {
  const result = evaluateControlledLaunchPilotGate({
    studentPilotAnalysis: { status: 'PILOT_PASS', evidenceType: 'SIMULATED_OR_MIXED', metrics: { participantCount: 120 }, items: [] },
    technicalReleaseEvidence: { status: 'PASS', technicalStatus: 'PASS' },
    privacyChecklist: { status: 'PASS', piiCollectionAllowed: false, consentEvidenceRecorded: true, guardianConsentTemplatePrepared: true, schoolAuthorizationRecorded: true, pilotSaltStoredOutsideClient: true, retentionPolicyAccepted: true }
  });
  assert.equal(result.controlledPilotReady, false);
  assert.equal(result.publicationAllowed, false);
  assert.ok(result.blockers.some((blocker) => blocker.includes('insan incelemesi')));
  assert.ok(result.blockers.some((blocker) => blocker.includes('Gerçek öğrenci')));
});

test('bütün kontrollü pilot kanıtları geçse bile tam kamu yayını ve tam ürün otomatik açılmaz', () => {
  const consensus = buildLaunchPilotReviewConsensus({ decisions: approvedDecisions() });
  const adaptations = materializeLaunchPilotAdaptations({ consensus });
  const items = adaptations.rows.map((row) => ({ itemId: row.sourceQuestionId, status: 'PILOT_PASS', responseCount: 80 }));
  const result = evaluateControlledLaunchPilotGate({
    humanReviewConsensus: consensus,
    adaptationEvidence: adaptations,
    studentPilotAnalysis: { status: 'PILOT_PASS', evidenceType: 'REAL_STUDENT_PILOT', metrics: { participantCount: 100 }, items },
    technicalReleaseEvidence: { status: 'PASS', technicalStatus: 'PASS' },
    privacyChecklist: { status: 'PASS', piiCollectionAllowed: false, consentEvidenceRecorded: true, guardianConsentTemplatePrepared: true, schoolAuthorizationRecorded: true, pilotSaltStoredOutsideClient: true, retentionPolicyAccepted: true }
  });
  const audit = auditControlledLaunchPilotGate(result);
  assert.equal(audit.ok, true, audit.errors.join('\n'));
  assert.equal(result.checks.length, 8);
  assert.equal(result.controlledPilotReady, true);
  assert.equal(result.publicationAllowed, true);
  assert.equal(result.publicProductionReleaseAllowed, false);
  assert.equal(result.fullProductReady, false);
});
