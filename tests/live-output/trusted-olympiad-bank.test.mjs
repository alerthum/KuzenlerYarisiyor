import test from 'node:test';
import assert from 'node:assert/strict';
import { TRUSTED_AUTHORED_LIVE_ROUNDS, TRUSTED_OLYMPIAD_GRADE8_KEYS } from '../../js/assessment-v2/trusted-authored-live-bank.js';
import { createGameSession } from '../../js/games/registry.js';
import { auditLiveOutputRound } from '../../js/quality/live-output-gate.js';

const profile = { id: 'trusted-olympiad-g8', name: 'Olimpiyat Testi', age: 14, grade: 8, level: 10, skills: {} };
const FORBIDDEN_FOUNDATION_SURFACES = [
  /Olimpiyat kulübünde çözülen bir soru/i,
  /kaç gün sonra/i,
  /rakamlarını ters çevir/i,
  /küme(?:lerin)? birleşimi/i,
  /^\s*\d+\s*[+−\-*÷/]\s*\d+\s*[=?]?\s*$/
];

test('8. sınıf güvenli olimpiyat bankası 9 farklı çözücü-doğrulamalı model içerir', () => {
  assert.equal(TRUSTED_AUTHORED_LIVE_ROUNDS.length, 9);
  assert.equal(TRUSTED_OLYMPIAD_GRADE8_KEYS.length, 9);
  assert.equal(new Set(TRUSTED_OLYMPIAD_GRADE8_KEYS).size, 9);
  assert.equal(new Set(TRUSTED_AUTHORED_LIVE_ROUNDS.map((round) => round.constructId)).size, 9);

  for (const round of TRUSTED_AUTHORED_LIVE_ROUNDS) {
    assert.ok(round.itemModelId);
    assert.equal(round.solverProof?.verified, true, round.questionKey);
    assert.equal(round.trustedHumanReview?.status, 'APPROVED', round.questionKey);
    assert.equal(round.trustedHumanReview?.difficultyVerdict, 'HARD', round.questionKey);
    assert.equal(round.difficulty, 5);
    assert.equal(round.cognitiveDepth, 5);
    assert.ok(round.reasoningStepCount >= 4, round.questionKey);
    assert.equal(round.options.length, 4);
    assert.equal(new Set(round.options).size, 4);
    assert.ok(round.optionDiagnostics.filter((row) => !row.isCorrect && row.misconceptionId).length >= 3);
    const visible = [round.context, round.prompt, ...round.options].filter(Boolean).join(' ');
    for (const pattern of FORBIDDEN_FOUNDATION_SURFACES) assert.doesNotMatch(visible, pattern, round.questionKey);
    const audit = auditLiveOutputRound(round, { gameId: 'olympiad-ladder', grade: 8 });
    assert.equal(audit.ok, true, `${round.questionKey}: ${audit.errors.join(',')}`);
  }
});

test('Olimpiyat Merdiveni 9 farklı modeli tek güvenli oturumda teslim eder ve sonra kapanır', () => {
  const seen = new Set();
  const first = createGameSession('olympiad-ladder', profile, 2026080609, {
    controlledLaunchPilot: true,
    completedSessionCount: 1,
    seenQuestionKeys: seen,
    attempts: []
  });
  first.rounds.forEach((round) => seen.add(round.questionKey));
  const exhausted = createGameSession('olympiad-ladder', profile, 2026080610, {
    controlledLaunchPilot: true,
    completedSessionCount: 2,
    seenQuestionKeys: seen,
    attempts: []
  });

  assert.equal(first.rounds.length, 9);
  assert.equal(exhausted.rounds.length, 0);
  assert.equal(first.globalQualityAudit?.premiumBank?.fallbackToLegacy, false);
  assert.equal(exhausted.globalQualityAudit?.premiumBank?.fallbackToLegacy, false);
  assert.deepEqual(seen, new Set(TRUSTED_OLYMPIAD_GRADE8_KEYS));
  assert.ok(first.rounds.every((round) => round.publicationStatus === 'CONTROLLED_BETA_SURFACE_APPROVED'));
});
