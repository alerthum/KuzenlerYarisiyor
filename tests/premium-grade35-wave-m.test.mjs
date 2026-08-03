import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PREMIUM_TASK_GAME_IDS_M,
  generatePremiumTaskRoundsM,
  premiumTaskInventoryM
} from '../js/content/premium-expansion-task-bank-m.js';
import { createGameSession, GAME_CATALOG } from '../js/games/registry.js';
import { validatePremiumTaskRound } from '../js/content/premium-task-core.js';
import { evaluatePremiumQuestionFactory } from '../js/quality/question-factory-v13.js';
import { attachCognitiveDepth } from '../js/quality/cognitive-depth-engine.js';
import { solveRoundIndependently } from '../js/quality/independent-solver.js';

const EXPECTED_GAMES = ['word-ladder', 'english-sentence-builder', 'forbidden-story'];

test('3–5 premium dalga M üç görev oyununda 30 bağımsız görev taşır', () => {
  assert.deepEqual(PREMIUM_TASK_GAME_IDS_M, EXPECTED_GAMES);
  const inventory = premiumTaskInventoryM();
  assert.equal(Object.values(inventory).reduce((sum, row) => sum + row.questionCount, 0), 30);
  for (const gameId of EXPECTED_GAMES) {
    assert.equal(inventory[gameId].questionCount, 10, gameId);
    assert.equal(inventory[gameId].familyCount, 10, gameId);
    assert.deepEqual(inventory[gameId].gradeBands, ['3-5'], gameId);
    assert.equal(inventory[gameId].allHaveDiagnosticRules, true, gameId);
  }
});

test('dalga M görevlerinin tamamı sözleşme, solver, fabrika ve derinlik kapılarından geçer', () => {
  let total = 0;
  for (const gameId of EXPECTED_GAMES) {
    const rounds = generatePremiumTaskRoundsM(gameId, { seed: 20260803, count: 99, grade: 4 }).rounds;
    for (const round of rounds) {
      total += 1;
      const task = validatePremiumTaskRound(round);
      const solver = solveRoundIndependently(round);
      const factory = evaluatePremiumQuestionFactory(round, { grade: 4 });
      const depth = attachCognitiveDepth(round, { grade: 4 }).cognitiveDepthGate;
      assert.equal(task.ok, true, `${round.questionKey}: ${task.errors.join(',')}`);
      assert.equal(solver.ok, true, `${round.questionKey}: ${solver.errors.join(',')}`);
      assert.equal(factory.ok, true, `${round.questionKey}: ${factory.violations.join(',')}`);
      assert.equal(depth.publicationAllowed, true, `${round.questionKey}: ${depth.violations.join(',')}`);
    }
  }
  assert.equal(total, 30);
});

test('4. sınıf canlı görev oturumları yalnız premium içerikle eksiksiz dolar', () => {
  for (const gameId of EXPECTED_GAMES) {
    const game = GAME_CATALOG.find((entry) => entry.id === gameId);
    assert.ok(game, gameId);
    const session = createGameSession(gameId, {
      id: `grade4-wave-m-${gameId}`,
      grade: 4,
      age: 9,
      skills: {}
    }, 360504, {
      completedSessionCount: 1,
      currentSessionIndex: 1,
      academicYear: '2026-2027',
      simulatedDate: '2026-10-07',
      attempts: []
    });
    assert.equal(session.rounds.length, game.sessionLength, `${gameId}: underfill`);
    assert.ok(session.rounds.every((round) => round.premiumQuestion === true), `${gameId}: legacy fallback`);
    assert.ok(session.rounds.every((round) => round.premiumTask === true), `${gameId}: task flag`);
    assert.ok(session.rounds.every((round) => round.gradeBand === '3-5'), `${gameId}: wrong grade content`);
    assert.equal(session.globalQualityAudit?.premiumBank?.fallbackToLegacy, false, `${gameId}: audit fallback`);
  }
});

test('dalga M görevleri 2. ve 6. sınıfa yanlışlıkla açılmaz', () => {
  for (const gameId of EXPECTED_GAMES) {
    assert.equal(generatePremiumTaskRoundsM(gameId, { count: 20, grade: 2 }).rounds.length, 0, `${gameId}: grade 2 leak`);
    assert.equal(generatePremiumTaskRoundsM(gameId, { count: 20, grade: 6 }).rounds.length, 0, `${gameId}: grade 6 leak`);
  }
});
