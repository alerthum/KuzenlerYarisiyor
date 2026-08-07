import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TRUSTED_G8_LOGIC_DEEP_KEYS,
  TRUSTED_G8_LOGIC_DEEP_ROUNDS
} from '../../js/assessment-v2/trusted-authored-g8-logic-deep-bank.js';
import { createGameSession } from '../../js/games/registry.js';
import { auditLiveOutputRound, normalizeTrustedLiveRound } from '../../js/quality/live-output-gate.js';

const profile = { id: 'trusted-g8-logic-deep', name: '8. Sınıf Zekâ Testi', age: 14, grade: 8, level: 10, skills: {} };

test('8. sınıf Zekâ İstasyonu 8 farklı kısıt çözücülü derin soru içerir', () => {
  assert.equal(TRUSTED_G8_LOGIC_DEEP_ROUNDS.length, 8);
  assert.equal(TRUSTED_G8_LOGIC_DEEP_KEYS.length, 8);
  assert.equal(new Set(TRUSTED_G8_LOGIC_DEEP_KEYS).size, 8);
  assert.equal(new Set(TRUSTED_G8_LOGIC_DEEP_ROUNDS.map((round) => round.constructId)).size, 8);

  const expectedExperiences = [
    'SPATIAL_CIRCULAR_PLACEMENT',
    'GRAPH_ROUTE_FEASIBILITY',
    'SET_INTERSECTION_ACCOUNTING',
    'STATE_TRANSITION_INVARIANT',
    'MINIMAX_INFORMATION_STRATEGY',
    'BIPARTITE_MATCHING_GRID',
    'TEMPORAL_BLOCK_SCHEDULING',
    'TRUTH_VALUE_CASE_ANALYSIS'
  ];
  assert.deepEqual(TRUSTED_G8_LOGIC_DEEP_ROUNDS.map((round) => round.perceivedStructureId), expectedExperiences);
  assert.equal(new Set(TRUSTED_G8_LOGIC_DEEP_ROUNDS.map((round) => round.surfaceDomain)).size, 8);
  assert.deepEqual(TRUSTED_G8_LOGIC_DEEP_ROUNDS.map((round) => round.trustedSessionOrder), [1, 2, 3, 4, 5, 6, 7, 8]);

  for (const round of TRUSTED_G8_LOGIC_DEEP_ROUNDS) {
    assert.equal(round.trustedHumanReview?.status, 'APPROVED', round.questionKey);
    assert.equal(round.trustedHumanReview?.difficultyVerdict, 'HARD', round.questionKey);
    assert.equal(round.intendedDifficultyBand, 'LOGIC_HIGH', round.questionKey);
    assert.equal(round.solverProof?.verified, true, round.questionKey);
    assert.ok(round.solverProof?.validWorldCount >= 1, round.questionKey);
    assert.ok(round.timeLimit >= 180, `${round.questionKey}: 5/5 soru süresi kısa`);
    assert.ok(round.timeLimit <= 240, `${round.questionKey}: soru süresi gereksiz uzun`);
    assert.ok(round.authoredReasoningStepCount >= 4, round.questionKey);
    assert.ok(round.reasoningStepCount >= 5, round.questionKey);
    assert.equal(round.options.length, 4, round.questionKey);
    assert.equal(new Set(round.options).size, 4, round.questionKey);
    assert.equal(round.optionDiagnostics.filter((row) => !row.isCorrect && row.misconceptionId).length, 3, round.questionKey);
    const normalized = normalizeTrustedLiveRound(round, { gameId: 'logic-station', grade: 8 });
    assert.deepEqual(normalized.hints, round.hints, `${round.questionKey}: yazılmış ipuçları korunmalı`);
    const audit = auditLiveOutputRound(normalized, { gameId: 'logic-station', grade: 8 });
    assert.equal(audit.ok, true, `${round.questionKey}: ${audit.errors.join(',')}`);
    const visible = [normalized.context, normalized.prompt, ...normalized.options, ...normalized.hints].join(' ');
    assert.doesNotMatch(visible, /Sınıfta çözülen bir mantık sorusu|(?:^|\s)W[ABCD](?:\s|$)|Which choice/i);
  }
});

test('Zekâ İstasyonu sekiz derin soruyu tek oturumda verir ve sonra eski havuza düşmez', () => {
  const seen = new Set();
  const first = createGameSession('logic-station', profile, 2026081401, {
    controlledLaunchPilot: true,
    completedSessionCount: 1,
    seenQuestionKeys: seen,
    attempts: []
  });
  first.rounds.forEach((round) => seen.add(round.questionKey));
  const exhausted = createGameSession('logic-station', profile, 2026081402, {
    controlledLaunchPilot: true,
    completedSessionCount: 2,
    seenQuestionKeys: seen,
    attempts: []
  });

  assert.equal(first.rounds.length, 8);
  assert.deepEqual(first.rounds.map((round) => round.perceivedStructureId), [
    'SPATIAL_CIRCULAR_PLACEMENT',
    'GRAPH_ROUTE_FEASIBILITY',
    'SET_INTERSECTION_ACCOUNTING',
    'STATE_TRANSITION_INVARIANT',
    'MINIMAX_INFORMATION_STRATEGY',
    'BIPARTITE_MATCHING_GRID',
    'TEMPORAL_BLOCK_SCHEDULING',
    'TRUTH_VALUE_CASE_ANALYSIS'
  ]);
  assert.equal(new Set(first.rounds.map((round) => round.perceivedStructureId)).size, 8);
  assert.ok(first.rounds.every((round) => round.timeLimit >= 180));
  assert.deepEqual(seen, new Set(TRUSTED_G8_LOGIC_DEEP_KEYS));
  assert.equal(exhausted.rounds.length, 0);
  assert.equal(first.globalQualityAudit?.premiumBank?.fallbackToLegacy, false);
  assert.equal(exhausted.globalQualityAudit?.premiumBank?.fallbackToLegacy, false);
});
