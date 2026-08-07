import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TRUSTED_G8_CORE_WAVE2_CANONICAL_IDS,
  TRUSTED_G8_CORE_WAVE2_KEYS,
  TRUSTED_G8_CORE_WAVE2_ROUNDS,
  TRUSTED_G8_MATH_WAVE2_ROUNDS,
  TRUSTED_G8_MEANING_WAVE2_ROUNDS,
  TRUSTED_G8_PARAGRAPH_WAVE2_ROUNDS,
  TRUSTED_G8_SCIENCE_WAVE2_ROUNDS
} from '../../js/assessment-v2/trusted-authored-g8-core-wave2-bank.js';
import { auditLiveOutputRound, normalizeTrustedLiveRound } from '../../js/quality/live-output-gate.js';

const groups = [
  ['paragraph-detective', TRUSTED_G8_PARAGRAPH_WAVE2_ROUNDS, 4],
  ['meaning-hunt', TRUSTED_G8_MEANING_WAVE2_ROUNDS, 3]
];

test('8. sınıf Türkçe ikinci dalgası yalnız seçilmiş 7 kanonik maddeyi içerir', () => {
  assert.equal(TRUSTED_G8_CORE_WAVE2_ROUNDS.length, 7);
  assert.equal(new Set(TRUSTED_G8_CORE_WAVE2_ROUNDS.map((round) => round.questionKey)).size, 7);
  assert.deepEqual(Object.fromEntries(Object.entries(TRUSTED_G8_CORE_WAVE2_KEYS).map(([key, rows]) => [key, rows.length])), {
    paragraph: 4,
    meaning: 3,
    science: 0,
    math: 0
  });
  assert.equal(Object.values(TRUSTED_G8_CORE_WAVE2_CANONICAL_IDS).flat().length, 7);
  assert.equal(TRUSTED_G8_SCIENCE_WAVE2_ROUNDS.length, 0);
  assert.equal(TRUSTED_G8_MATH_WAVE2_ROUNDS.length, 0);

  for (const [gameId, rounds, expected] of groups) {
    assert.equal(rounds.length, expected, gameId);
    for (const round of rounds) {
      assert.equal(round.solverProof?.verified, true, round.questionKey);
      assert.ok(round.reasoningStepCount >= 4, round.questionKey);
      assert.equal(round.options.length, 4, round.questionKey);
      assert.equal(new Set(round.options).size, 4, round.questionKey);
      assert.equal(round.distractorValidation?.verified, true, round.questionKey);
      const normalized = normalizeTrustedLiveRound(round, { gameId, grade: 8 });
      const audit = auditLiveOutputRound(normalized, { gameId, grade: 8 });
      assert.equal(audit.ok, true, `${round.questionKey}: ${audit.errors.join(',')}`);
    }
  }
});
