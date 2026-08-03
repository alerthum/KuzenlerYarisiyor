import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STAGE07_ACCURACY_MIN,
  solveChoiceIndependently,
  scoreIndependentSolverAudit
} from '../js/quality/independent-solver.js';
import { createGameSession, GAME_CATALOG, isGameAvailableForProfile } from '../js/games/registry.js';

test('çoklu doğru / doğru yok / açıklama eksik yakalanır', () => {
  assert.ok(solveChoiceIndependently({
    options: ['A', 'A', 'B', 'C'], answerIndex: 0, explanation: 'A doğru'
  }).errors.includes('multiple_correct_options')
    || solveChoiceIndependently({
      options: ['A', 'A', 'B', 'C'], answerIndex: 0, explanation: 'A doğru'
    }).errors.includes('duplicate_options_multiple_correct_risk'));

  assert.ok(solveChoiceIndependently({
    options: ['A', 'B', 'C', 'D'], answerIndex: 9, explanation: 'x'
  }).errors.includes('no_correct_option'));

  assert.ok(solveChoiceIndependently({
    options: ['A', 'B', 'C', 'D'], answerIndex: 0, explanation: ''
  }).errors.includes('explanation_missing'));
});

test('CANLI: yayınlanan turlarda doğruluk %100 ve kritik sayaçlar 0', () => {
  const games = GAME_CATALOG.filter((g) => ![
    'lgs-focus', 'tyt-focus', 'ayt-focus', 'kpss-focus'
  ].includes(g.id)).map((g) => g.id);
  const samples = [];
  let seed = 70707;
  // Yoğun örneklem (~birkaç bin tur) — tam 10k stage kapanışında genişletilebilir.
  for (let wave = 0; wave < 8; wave += 1) {
    for (const gameId of games) {
      const game = GAME_CATALOG.find((g) => g.id === gameId);
      const grade = gameId === 'lgs-foundation' || gameId === 'religion-practice' ? 8 : 6;
      const profile = { id: `s07-${gameId}-${wave}`, age: Math.max(game.minAge || 8, 12), grade, skills: {} };
      if (!isGameAvailableForProfile(game, profile)) continue;
      const session = createGameSession(gameId, profile, seed, { completedSessionCount: 1 + wave });
      seed += 11;
      for (const round of session.rounds) samples.push({ round });
    }
  }
  assert.ok(samples.length >= 500, `örneklem yetersiz: ${samples.length}`);
  const audit = scoreIndependentSolverAudit(samples);
  assert.equal(audit.wrongAnswer, 0);
  assert.equal(audit.multipleCorrect, 0);
  assert.equal(audit.noCorrect, 0);
  assert.equal(audit.explanationMismatch, 0);
  assert.ok(audit.accuracyPercent >= STAGE07_ACCURACY_MIN, `accuracy ${audit.accuracyPercent}`);
  assert.equal(audit.meetsStageGate, true);
});
