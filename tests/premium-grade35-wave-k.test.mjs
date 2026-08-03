import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PREMIUM_EXPANSION_GAME_IDS_K,
  generatePremiumExpansionRoundsK,
  premiumExpansionInventoryK
} from '../js/content/premium-expansion-bank-k.js';
import { createGameSession, GAME_CATALOG } from '../js/games/registry.js';
import { evaluatePremiumQuestionFactory } from '../js/quality/question-factory-v13.js';
import { evaluateOptionQuality } from '../js/quality/premium-options-engine.js';
import { auditChoiceIntegrity } from '../js/quality/choice-integrity-engine-v11.js';
import { attachCognitiveDepth } from '../js/quality/cognitive-depth-engine.js';
import { solveRoundIndependently } from '../js/quality/independent-solver.js';

const EXPECTED_GAMES = [
  'problem-hunter',
  'science-lab',
  'pattern-lab',
  'geometry-lab',
  'speed-math'
];

test('3–5 premium dalga K beş oyunda 50 bağımsız soru taşır', () => {
  assert.deepEqual(PREMIUM_EXPANSION_GAME_IDS_K, EXPECTED_GAMES);
  const inventory = premiumExpansionInventoryK();
  assert.equal(Object.values(inventory).reduce((sum, row) => sum + row.questionCount, 0), 50);
  for (const gameId of EXPECTED_GAMES) {
    assert.equal(inventory[gameId].questionCount, 10, gameId);
    assert.equal(inventory[gameId].familyCount, 10, gameId);
    assert.deepEqual(inventory[gameId].gradeBands, ['3-5'], gameId);
    assert.equal(inventory[gameId].allHaveThreeMisconceptions, true, gameId);
  }
});

test('dalga K içeriğinin tamamı beş yayın kapısından geçer', () => {
  let total = 0;
  for (const gameId of EXPECTED_GAMES) {
    const rounds = generatePremiumExpansionRoundsK(gameId, { seed: 20260803, count: 999, grade: 4 }).rounds;
    for (const round of rounds) {
      total += 1;
      const factory = evaluatePremiumQuestionFactory(round, { grade: 4 });
      const options = evaluateOptionQuality(round);
      const integrity = auditChoiceIntegrity(round);
      const depth = attachCognitiveDepth(round, { grade: 4 }).cognitiveDepthGate;
      const solver = solveRoundIndependently(round);
      assert.equal(factory.ok, true, `${round.questionKey}: ${factory.violations.join(',')}`);
      assert.equal(options.ok, true, `${round.questionKey}: ${options.violations.join(',')}`);
      assert.equal(integrity.passed, true, `${round.questionKey}: ${integrity.errors.join(',')}`);
      assert.equal(depth.publicationAllowed, true, `${round.questionKey}: ${depth.violations.join(',')}`);
      assert.equal(solver.ok, true, `${round.questionKey}: ${solver.errors.join(',')}`);
    }
  }
  assert.equal(total, 50);
});

test('4. sınıf canlı oturumları legacy içeriğe düşmeden eksiksiz dolar', () => {
  for (const gameId of EXPECTED_GAMES) {
    const game = GAME_CATALOG.find((entry) => entry.id === gameId);
    assert.ok(game, gameId);
    const session = createGameSession(gameId, {
      id: `grade4-wave-k-${gameId}`,
      grade: 4,
      age: 9,
      skills: {}
    }, 340504, {
      completedSessionCount: 1,
      currentSessionIndex: 1,
      academicYear: '2026-2027',
      simulatedDate: '2026-10-05',
      attempts: []
    });
    assert.equal(session.rounds.length, game.sessionLength, `${gameId}: underfill`);
    assert.ok(session.rounds.every((round) => round.premiumQuestion === true), `${gameId}: legacy fallback`);
    assert.ok(session.rounds.every((round) => round.gradeBand === '3-5'), `${gameId}: wrong grade content`);
    assert.equal(session.globalQualityAudit?.premiumBank?.fallbackToLegacy, false, `${gameId}: audit fallback`);
  }
});

test('dalga K soruları 2. ve 6. sınıfa yanlışlıkla açılmaz', () => {
  for (const gameId of EXPECTED_GAMES) {
    assert.equal(generatePremiumExpansionRoundsK(gameId, { count: 20, grade: 2 }).rounds.length, 0, `${gameId}: grade 2 leak`);
    assert.equal(generatePremiumExpansionRoundsK(gameId, { count: 20, grade: 6 }).rounds.length, 0, `${gameId}: grade 6 leak`);
  }
});
