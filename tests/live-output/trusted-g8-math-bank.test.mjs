import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TRUSTED_G8_MATH_DEEP_KEYS,
  TRUSTED_G8_MATH_DEEP_ROUNDS
} from '../../js/assessment-v2/trusted-authored-g8-math-deep-bank.js';
import { createGameSession } from '../../js/games/registry.js';
import { SOLVER_BACKED_PRIORITY_MATH_KEYS } from '../../js/assessment-v2/solver-backed-priority-math-bank.js';
import { auditLiveOutputRound, normalizeTrustedLiveRound } from '../../js/quality/live-output-gate.js';

const profile = { id: 'trusted-g8-math-deep', name: '8. Sınıf Matematik Testi', age: 14, grade: 8, level: 10, skills: {} };
const FORBIDDEN_OLD_SURFACES = [
  /Olimpiyat kulübünde çözülen bir soru/i,
  /Senaryodaki sayıları ayıkla/i,
  /para üstü/i,
  /yalnızca tek işlem/i,
  /(?:^|\s)W[ABCD](?:\s|$)/
];

test('8. sınıf güvenli matematik bankası 12 insan-onaylı çok adımlı madde içerir', () => {
  assert.equal(TRUSTED_G8_MATH_DEEP_ROUNDS.length, 12);
  assert.equal(TRUSTED_G8_MATH_DEEP_KEYS.length, 12);
  assert.equal(new Set(TRUSTED_G8_MATH_DEEP_KEYS).size, 12);

  for (const round of TRUSTED_G8_MATH_DEEP_ROUNDS) {
    assert.equal(round.trustedHumanReview?.status, 'APPROVED', round.questionKey);
    assert.equal(round.trustedHumanReview?.difficultyVerdict, 'HARD', round.questionKey);
    assert.equal(round.intendedDifficultyBand, 'LGS_HIGH', round.questionKey);
    assert.equal(round.solverProof?.verified, true, round.questionKey);
    assert.equal(round.difficulty, 5, round.questionKey);
    assert.ok(round.authoredReasoningStepCount >= 4, round.questionKey);
    assert.ok(round.reasoningStepCount >= 5, round.questionKey);
    assert.equal(round.options.length, 4, round.questionKey);
    assert.equal(new Set(round.options).size, 4, round.questionKey);
    assert.equal(round.optionDiagnostics.filter((row) => !row.isCorrect && row.misconceptionId).length, 3, round.questionKey);

    const normalized = normalizeTrustedLiveRound(round, { gameId: 'problem-hunter', grade: 8 });
    const audit = auditLiveOutputRound(normalized, { gameId: 'problem-hunter', grade: 8 });
    assert.equal(audit.ok, true, `${round.questionKey}: ${audit.errors.join(',')}`);
    const visible = [normalized.context, normalized.prompt, ...normalized.options, ...normalized.hints].join(' ');
    for (const pattern of FORBIDDEN_OLD_SURFACES) assert.doesNotMatch(visible, pattern, round.questionKey);
  }
});

test('sabit 12 soruluk banka golden sample olarak kalır; canlı Problem Avcısı 45 motor çıktısını teslim eder', () => {
  const engineKeys = SOLVER_BACKED_PRIORITY_MATH_KEYS.grade8.problemHunter;
  assert.equal(engineKeys.length, 45);
  const seen = new Set();
  const lengths = [];
  for (let index = 0; index < 12 && seen.size < engineKeys.length; index += 1) {
    const session = createGameSession('problem-hunter', profile, 2026080801 + index, {
      controlledLaunchPilot: true,
      completedSessionCount: index + 1,
      seenQuestionKeys: seen,
      attempts: []
    });
    lengths.push(session.rounds.length);
    session.rounds.forEach((round) => seen.add(round.questionKey));
    assert.equal(session.globalQualityAudit?.premiumBank?.fallbackToLegacy, false);
    assert.ok(session.rounds.every((round) => round.publicationStatus === 'CONTROLLED_BETA_SURFACE_APPROVED'));
  }
  const exhausted = createGameSession('problem-hunter', profile, 2026080899, {
    controlledLaunchPilot: true,
    completedSessionCount: 20,
    seenQuestionKeys: seen,
    attempts: []
  });

  assert.deepEqual(lengths, Array(9).fill(5));
  assert.equal(exhausted.rounds.length, 0);
  assert.equal(exhausted.globalQualityAudit?.premiumBank?.fallbackToLegacy, false);
  assert.deepEqual(seen, new Set(engineKeys));
  assert.notDeepEqual(seen, new Set(TRUSTED_G8_MATH_DEEP_KEYS));
});
