import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameSession } from '../../js/games/registry.js';
import {
  TRUSTED_G7_CORE_DEEP_ROUNDS,
  TRUSTED_G7_CORE_DEEP_KEYS,
  TRUSTED_G7_TURKISH_PARAGRAPH_ROUNDS,
  TRUSTED_G7_TURKISH_MEANING_ROUNDS,
  TRUSTED_G7_MATH_ROUNDS,
  TRUSTED_G7_SCIENCE_ROUNDS
} from '../../js/assessment-v2/trusted-authored-g7-core-deep-bank.js';
import { trustedLiveCell } from '../../js/assessment-v2/trusted-live-policy.js';
import { auditLiveOutputRound } from '../../js/quality/live-output-gate.js';

const CELLS = [
  ['paragraph-detective', TRUSTED_G7_TURKISH_PARAGRAPH_ROUNDS, TRUSTED_G7_CORE_DEEP_KEYS.paragraph],
  ['meaning-hunt', TRUSTED_G7_TURKISH_MEANING_ROUNDS, TRUSTED_G7_CORE_DEEP_KEYS.meaning],
  ['problem-hunter', TRUSTED_G7_MATH_ROUNDS, TRUSTED_G7_CORE_DEEP_KEYS.math],
  ['science-reasoning', TRUSTED_G7_SCIENCE_ROUNDS, TRUSTED_G7_CORE_DEEP_KEYS.science]
];

function profile(gameId) {
  return { id: `g7-deep:${gameId}`, name: '7. Sınıf Güvenli Çekirdek', age: 13, grade: 7, level: 10, skills: {} };
}

function session(gameId, seed, seenQuestionKeys = new Set()) {
  return createGameSession(gameId, profile(gameId), seed, {
    controlledLaunchPilot: true,
    completedSessionCount: 1,
    seenQuestionKeys,
    attempts: []
  });
}

test('7. sınıf derin çekirdek 4+4+8+8 olmak üzere 24 son-ekran sorusudur', () => {
  assert.equal(TRUSTED_G7_TURKISH_PARAGRAPH_ROUNDS.length, 4);
  assert.equal(TRUSTED_G7_TURKISH_MEANING_ROUNDS.length, 4);
  assert.equal(TRUSTED_G7_MATH_ROUNDS.length, 8);
  assert.equal(TRUSTED_G7_SCIENCE_ROUNDS.length, 8);
  assert.equal(TRUSTED_G7_CORE_DEEP_ROUNDS.length, 24);
  assert.equal(new Set(TRUSTED_G7_CORE_DEEP_ROUNDS.map((round) => round.questionKey)).size, 24);
});

test('7. sınıf çekirdeğindeki her soru bağımsız son-ekran kapısından geçer', () => {
  for (const round of TRUSTED_G7_CORE_DEEP_ROUNDS) {
    const audit = auditLiveOutputRound(round, { gameId: round.gameId, grade: 7 });
    assert.equal(audit.ok, true, `${round.questionKey}: ${audit.errors.join(', ')}`);
    assert.equal(round.trustedHumanReview?.status, 'APPROVED');
    assert.equal(round.solverProof?.verified, true);
    assert.ok((round.solutionGraph || []).length >= 4);
    assert.equal(round.distractorValidation?.diagnosticCount, 3);
  }
});

test('7. sınıf yayın politikası banka anahtarlarıyla birebir aynıdır', () => {
  for (const [gameId, rounds, expectedKeys] of CELLS) {
    const policy = trustedLiveCell(gameId, 7);
    assert.ok(policy, `${gameId}: politika yok`);
    assert.deepEqual([...policy.keys], [...expectedKeys]);
    assert.deepEqual(new Set(policy.keys), new Set(rounds.map((round) => round.questionKey)));
  }
});

test('7. sınıf oturumları yalnız güvenli bankayı teslim eder ve tüketilince kapanır', () => {
  for (const [gameId, rounds] of CELLS) {
    const seen = new Set();
    for (let pass = 0; pass < 8 && seen.size < rounds.length; pass += 1) {
      const next = session(gameId, 2026080700 + pass, seen);
      assert.equal(next.globalQualityAudit?.premiumBank?.fallbackToLegacy, false);
      for (const round of next.rounds) {
        assert.equal(round.controlledLaunchPilot, true);
        assert.equal(round.liveOutputAudit?.ok, true);
        assert.equal(seen.has(round.questionKey), false);
        seen.add(round.questionKey);
      }
    }
    assert.equal(seen.size, rounds.length, `${gameId}: bütün banka teslim edilmedi`);
    const exhausted = session(gameId, 2026080799, seen);
    assert.equal(exhausted.rounds.length, 0, `${gameId}: tüketim sonrası eski fallback açıldı`);
    assert.equal(exhausted.globalQualityAudit?.premiumBank?.fallbackToLegacy, false);
  }
});
