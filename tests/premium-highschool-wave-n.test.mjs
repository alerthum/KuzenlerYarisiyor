import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PREMIUM_HIGHSCHOOL_GAME_IDS_N,
  generatePremiumHighschoolRoundsN,
  premiumHighschoolInventoryN,
  premiumHighschoolBlueprintReportN
} from '../js/content/premium-highschool-blueprint-bank-n.js';
import { createGameSession, GAME_CATALOG } from '../js/games/registry.js';
import { evaluatePremiumQuestionFactory } from '../js/quality/question-factory-v13.js';
import { evaluateOptionQuality } from '../js/quality/premium-options-engine.js';
import { auditChoiceIntegrity } from '../js/quality/choice-integrity-engine-v11.js';
import { attachCognitiveDepth } from '../js/quality/cognitive-depth-engine.js';
import { solveRoundIndependently } from '../js/quality/independent-solver.js';

const EXPECTED = Object.freeze({
  'error-detective': { questions: 10, families: 5, sessionLength: 5 },
  'paragraph-detective': { questions: 16, families: 8, sessionLength: 8 },
  'science-reasoning': { questions: 10, families: 5, sessionLength: 5 }
});
const EXPECTED_GAMES = Object.keys(EXPECTED);

function allRounds(grade = 9) {
  return EXPECTED_GAMES.flatMap((gameId) => generatePremiumHighschoolRoundsN(gameId, {
    seed: 20260803,
    count: 999,
    grade
  }).rounds);
}

test('9–10 premium dalga N 18 blueprint ve 36 bağımsız doğrulanmış varyant taşır', () => {
  assert.deepEqual(PREMIUM_HIGHSCHOOL_GAME_IDS_N, EXPECTED_GAMES);
  assert.equal(premiumHighschoolBlueprintReportN.blueprintCount, 18);
  assert.equal(premiumHighschoolBlueprintReportN.variantCount, 36);
  assert.equal(premiumHighschoolBlueprintReportN.verifiedInstances, 36);

  const inventory = premiumHighschoolInventoryN();
  assert.equal(Object.values(inventory).reduce((sum, row) => sum + row.questionCount, 0), 36);
  for (const gameId of EXPECTED_GAMES) {
    assert.equal(inventory[gameId].questionCount, EXPECTED[gameId].questions, gameId);
    assert.equal(inventory[gameId].familyCount, EXPECTED[gameId].families, gameId);
    assert.deepEqual(inventory[gameId].gradeBands, ['9-10'], gameId);
    assert.equal(inventory[gameId].allHaveThreeMisconceptions, true, gameId);
  }
});

test('dalga N içeriğinin tamamı beş yayın kapısından ve bağımsız solverdan geçer', () => {
  const rounds = allRounds(9);
  assert.equal(rounds.length, 36);
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

test('aynı blueprint varyantları aynı yapısal ve bilişsel kimliği, farklı yüzey kimliğini taşır', () => {
  const groups = new Map();
  for (const round of allRounds(9)) {
    if (!groups.has(round.blueprintId)) groups.set(round.blueprintId, []);
    groups.get(round.blueprintId).push(round);
  }
  assert.equal(groups.size, 18);
  for (const [blueprintId, rounds] of groups) {
    assert.equal(rounds.length, 2, blueprintId);
    assert.equal(new Set(rounds.map((round) => round.structuralId)).size, 1, `${blueprintId}: structuralId`);
    assert.equal(new Set(rounds.map((round) => round.cognitiveExperienceId)).size, 1, `${blueprintId}: cognitiveExperienceId`);
    assert.equal(new Set(rounds.map((round) => round.surfaceFingerprint)).size, 2, `${blueprintId}: surfaceFingerprint`);
    assert.equal(new Set(rounds.map((round) => round.questionKey)).size, 2, `${blueprintId}: questionKey`);
  }
});

test('9. ve 10. sınıf canlı oturumları üç oyunda yalnız premium blueprint içeriğiyle dolar', () => {
  for (const grade of [9, 10]) {
    for (const gameId of EXPECTED_GAMES) {
      const game = GAME_CATALOG.find((entry) => entry.id === gameId);
      assert.ok(game, gameId);
      assert.equal(game.sessionLength, EXPECTED[gameId].sessionLength, gameId);
      const session = createGameSession(gameId, {
        id: `grade-${grade}-wave-n-${gameId}`,
        grade,
        age: grade + 5,
        skills: {}
      }, 360900 + grade, {
        completedSessionCount: 1,
        currentSessionIndex: 1,
        academicYear: '2026-2027',
        simulatedDate: '2026-10-07',
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

test('dalga N 8. ve 11. sınıfa sızmaz', () => {
  for (const gameId of EXPECTED_GAMES) {
    assert.equal(generatePremiumHighschoolRoundsN(gameId, { count: 50, grade: 8 }).rounds.length, 0, `${gameId}: grade 8 leak`);
    assert.equal(generatePremiumHighschoolRoundsN(gameId, { count: 50, grade: 11 }).rounds.length, 0, `${gameId}: grade 11 leak`);
  }
});
