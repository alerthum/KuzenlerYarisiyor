import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PREMIUM_HIGHSCHOOL_GAME_IDS_O,
  generatePremiumHighschoolRoundsO,
  premiumHighschoolInventoryO,
  premiumHighschoolBlueprintReportO
} from '../js/content/premium-highschool-blueprint-bank-o.js';
import { createGameSession, GAME_CATALOG } from '../js/games/registry.js';
import { evaluatePremiumQuestionFactory } from '../js/quality/question-factory-v13.js';
import { evaluateOptionQuality } from '../js/quality/premium-options-engine.js';
import { auditChoiceIntegrity } from '../js/quality/choice-integrity-engine-v11.js';
import { attachCognitiveDepth } from '../js/quality/cognitive-depth-engine.js';
import { solveRoundIndependently } from '../js/quality/independent-solver.js';

const EXPECTED = Object.freeze({
  'logic-station': { questions: 16, families: 8, sessionLength: 8 },
  'problem-hunter': { questions: 10, families: 5, sessionLength: 5 },
  'science-lab': { questions: 12, families: 6, sessionLength: 6 }
});
const EXPECTED_GAMES = Object.keys(EXPECTED);

function allRounds(grade = 9) {
  return EXPECTED_GAMES.flatMap((gameId) => generatePremiumHighschoolRoundsO(gameId, {
    seed: 20260803,
    count: 999,
    grade
  }).rounds);
}

test('9–10 premium dalga O 19 blueprint ve 38 bağımsız doğrulanmış varyant taşır', () => {
  assert.deepEqual(PREMIUM_HIGHSCHOOL_GAME_IDS_O, EXPECTED_GAMES);
  assert.equal(premiumHighschoolBlueprintReportO.blueprintCount, 19);
  assert.equal(premiumHighschoolBlueprintReportO.variantCount, 38);
  assert.equal(premiumHighschoolBlueprintReportO.verifiedInstances, 38);

  const inventory = premiumHighschoolInventoryO();
  assert.equal(Object.values(inventory).reduce((sum, row) => sum + row.questionCount, 0), 38);
  for (const gameId of EXPECTED_GAMES) {
    assert.equal(inventory[gameId].questionCount, EXPECTED[gameId].questions, gameId);
    assert.equal(inventory[gameId].familyCount, EXPECTED[gameId].families, gameId);
    assert.deepEqual(inventory[gameId].gradeBands, ['9-10'], gameId);
    assert.equal(inventory[gameId].allHaveThreeMisconceptions, true, gameId);
  }
});

test('dalga O içeriğinin tamamı beş yayın kapısından ve bağımsız solverdan geçer', () => {
  const rounds = allRounds(9);
  assert.equal(rounds.length, 38);
  for (const round of rounds) {
    assert.equal(round.solverProof?.verifiedCorrect, true, round.questionKey);
    assert.equal(round.solverProof?.verifiedDistractorCount, 3, round.questionKey);
    const factory = evaluatePremiumQuestionFactory(round, { grade: 9 });
    const options = evaluateOptionQuality(round);
    const integrity = auditChoiceIntegrity(round);
    const depth = attachCognitiveDepth(round, { grade: 9 }).cognitiveDepthGate;
    const solver = solveRoundIndependently(round);
    assert.equal(factory.ok, true, `${round.questionKey}: ${factory.violations.join(',')}`);
    assert.equal(options.ok, true, `${round.questionKey}: ${options.violations.join(',')}`);
    assert.equal(integrity.passed, true, `${round.questionKey}: ${integrity.errors.join(',')}`);
    assert.equal(depth.publicationAllowed, true, `${round.questionKey}: ${depth.violations.join(',')}`);
    assert.equal(solver.ok, true, `${round.questionKey}: ${solver.errors.join(',')}`);
  }
});

test('dalga O aynı blueprint varyantlarında yapısal kimliği korur, yüzey kimliğini ayırır', () => {
  const groups = new Map();
  for (const round of allRounds(9)) {
    if (!groups.has(round.blueprintId)) groups.set(round.blueprintId, []);
    groups.get(round.blueprintId).push(round);
  }
  assert.equal(groups.size, 19);
  for (const [blueprintId, rounds] of groups) {
    assert.equal(rounds.length, 2, blueprintId);
    assert.equal(new Set(rounds.map((round) => round.structuralId)).size, 1, `${blueprintId}: structuralId`);
    assert.equal(new Set(rounds.map((round) => round.cognitiveExperienceId)).size, 1, `${blueprintId}: cognitiveExperienceId`);
    assert.equal(new Set(rounds.map((round) => round.surfaceFingerprint)).size, 2, `${blueprintId}: surfaceFingerprint`);
    assert.equal(new Set(rounds.map((round) => round.questionKey)).size, 2, `${blueprintId}: questionKey`);
  }
});

test('9. ve 10. sınıf canlı oturumları dalga O oyunlarında yalnız premium blueprint içeriğiyle dolar', () => {
  for (const grade of [9, 10]) {
    for (const gameId of EXPECTED_GAMES) {
      const game = GAME_CATALOG.find((entry) => entry.id === gameId);
      assert.ok(game, gameId);
      assert.equal(game.sessionLength, EXPECTED[gameId].sessionLength, gameId);
      const session = createGameSession(gameId, {
        id: `grade-${grade}-wave-o-${gameId}`,
        grade,
        age: grade + 5,
        skills: {}
      }, 370900 + grade, {
        completedSessionCount: 1,
        currentSessionIndex: 1,
        academicYear: '2026-2027',
        simulatedDate: '2026-10-08',
        attempts: []
      });
      assert.equal(session.rounds.length, game.sessionLength, `${grade}/${gameId}: underfill`);
      assert.ok(session.rounds.every((round) => round.premiumQuestion === true), `${grade}/${gameId}: legacy fallback`);
      assert.ok(session.rounds.every((round) => round.gradeBand === '9-10'), `${grade}/${gameId}: wrong grade band`);
      assert.ok(session.rounds.every((round) => round.blueprintId && round.solverProof?.verifiedCorrect), `${grade}/${gameId}: unverified content`);
      assert.equal(session.globalQualityAudit?.premiumBank?.fallbackToLegacy, false, `${grade}/${gameId}: audit fallback`);
    }
  }
});

test('dalga O 8. ve 11. sınıfa sızmaz', () => {
  for (const gameId of EXPECTED_GAMES) {
    assert.equal(generatePremiumHighschoolRoundsO(gameId, { count: 50, grade: 8 }).rounds.length, 0, `${gameId}: grade 8 leak`);
    assert.equal(generatePremiumHighschoolRoundsO(gameId, { count: 50, grade: 11 }).rounds.length, 0, `${gameId}: grade 11 leak`);
  }
});
