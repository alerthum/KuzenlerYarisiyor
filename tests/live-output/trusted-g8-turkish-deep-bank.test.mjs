import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TRUSTED_G8_TURKISH_DEEP_KEYS,
  TRUSTED_G8_TURKISH_DEEP_MEANING_ROUNDS,
  TRUSTED_G8_TURKISH_DEEP_PARAGRAPH_ROUNDS,
  TRUSTED_G8_TURKISH_DEEP_ROUNDS
} from '../../js/assessment-v2/trusted-authored-g8-turkish-deep-bank.js';
import { createGameSession } from '../../js/games/registry.js';
import { EVIDENCE_BACKED_PRIORITY_TURKISH_KEYS } from '../../js/assessment-v2/evidence-backed-priority-turkish-bank.js';
import { auditLiveOutputRound, normalizeTrustedLiveRound } from '../../js/quality/live-output-gate.js';

const profile = { id: 'trusted-g8-turkish-deep', name: '8. Sınıf Türkçe Testi', age: 14, grade: 8, level: 10, skills: {} };

test('8. sınıf Türkçe derin banka 4 paragraf ve 5 anlam-dil sorusu içerir', () => {
  assert.equal(TRUSTED_G8_TURKISH_DEEP_PARAGRAPH_ROUNDS.length, 4);
  assert.equal(TRUSTED_G8_TURKISH_DEEP_MEANING_ROUNDS.length, 5);
  assert.equal(TRUSTED_G8_TURKISH_DEEP_ROUNDS.length, 9);
  assert.equal(new Set(TRUSTED_G8_TURKISH_DEEP_ROUNDS.map((round) => round.questionKey)).size, 9);

  for (const [gameId, rounds] of [
    ['paragraph-detective', TRUSTED_G8_TURKISH_DEEP_PARAGRAPH_ROUNDS],
    ['meaning-hunt', TRUSTED_G8_TURKISH_DEEP_MEANING_ROUNDS]
  ]) {
    for (const round of rounds) {
      assert.equal(round.trustedHumanReview?.status, 'APPROVED', round.questionKey);
      assert.equal(round.trustedHumanReview?.difficultyVerdict, 'HARD', round.questionKey);
      assert.equal(round.intendedDifficultyBand, 'LGS_HIGH', round.questionKey);
      assert.equal(round.evidenceProof?.verified, true, round.questionKey);
      assert.ok(round.authoredReasoningStepCount >= 4, round.questionKey);
      assert.equal(round.options.length, 4, round.questionKey);
      assert.equal(new Set(round.options).size, 4, round.questionKey);
      assert.equal(round.optionDiagnostics.filter((row) => !row.isCorrect && row.misconceptionId).length, 3, round.questionKey);
      const normalized = normalizeTrustedLiveRound(round, { gameId, grade: 8 });
      assert.deepEqual(normalized.hints, round.hints, `${round.questionKey}: yazılmış ipuçları korunmalı`);
      const audit = auditLiveOutputRound(normalized, { gameId, grade: 8 });
      assert.equal(audit.ok, true, `${round.questionKey}: ${audit.errors.join(',')}`);
    }
  }
});

test('sabit Türkçe bankaları golden sample olarak kalır; canlı oturumlar 18+18 kanıt motoru çıktısını teslim eder', () => {
  for (const [gameId, expectedKeys] of [
    ['paragraph-detective', EVIDENCE_BACKED_PRIORITY_TURKISH_KEYS.grade8.paragraphDetective],
    ['meaning-hunt', EVIDENCE_BACKED_PRIORITY_TURKISH_KEYS.grade8.meaningHunt]
  ]) {
    assert.equal(expectedKeys.length, 18);
    const seen = new Set();
    for (let pass = 0; pass < 10 && seen.size < expectedKeys.length; pass += 1) {
      const session = createGameSession(gameId, profile, 2026081300 + pass, {
        controlledLaunchPilot: true,
        completedSessionCount: pass + 1,
        seenQuestionKeys: seen,
        attempts: []
      });
      session.rounds.forEach((round) => seen.add(round.questionKey));
      assert.equal(session.globalQualityAudit?.premiumBank?.fallbackToLegacy, false);
    }
    assert.deepEqual(seen, new Set(expectedKeys), `${gameId}: kanıt motoru tam teslim edilmedi`);
    const exhausted = createGameSession(gameId, profile, 2026081399, {
      controlledLaunchPilot: true,
      completedSessionCount: 20,
      seenQuestionKeys: seen,
      attempts: []
    });
    assert.equal(exhausted.rounds.length, 0);
    assert.equal(exhausted.globalQualityAudit?.premiumBank?.fallbackToLegacy, false);
  }
  assert.equal(TRUSTED_G8_TURKISH_DEEP_KEYS.paragraph.length, 4);
  assert.equal(TRUSTED_G8_TURKISH_DEEP_KEYS.meaning.length, 5);
});
