import test from 'node:test';
import assert from 'node:assert/strict';

import {
  generatePremiumPilotRounds,
  PREMIUM_PILOT_GAME_IDS,
  premiumPilotInventory
} from '../js/content/premium-pilot-bank.js';
import { createGameSession, GAME_CATALOG } from '../js/games/registry.js';
import { evaluateOptionQuality } from '../js/quality/premium-options-engine.js';
import { auditChoiceIntegrity } from '../js/quality/choice-integrity-engine-v11.js';
import { evaluatePremiumQuestionFactory } from '../js/quality/question-factory-v13.js';
import { attachCognitiveDepth } from '../js/quality/cognitive-depth-engine.js';
import { solveRoundIndependently } from '../js/quality/independent-solver.js';

const BANNED_ARTIFICIAL = /(hangi seçenek düşünme yolunu bozar|kısmi doğruyu tam sanan|görünmez ruh etkiler|doğru cevaba benzer görünür; ancak soru kökündeki kanıt)/i;
const BANNED_STANDALONE = /^(renk|ses|şarkı|sarki|rastgele|tahmin)$/i;

function rawRounds(gameId) {
  return generatePremiumPilotRounds(gameId, { seed: 20260802, count: 999 }).rounds;
}

test('premium pilot envanteri üç ders grubunda yeterli başlangıç havuzu taşır', () => {
  const inventory = premiumPilotInventory();
  assert.deepEqual(PREMIUM_PILOT_GAME_IDS, ['error-detective', 'paragraph-detective', 'science-reasoning']);
  assert.ok(inventory['error-detective'].questionCount >= 14);
  assert.ok(inventory['paragraph-detective'].questionCount >= 10);
  assert.ok(inventory['science-reasoning'].questionCount >= 10);
  assert.ok(Object.values(inventory).every((row) => row.allHaveThreeMisconceptions));
});

test('34 insan yazımı pilot sorunun tamamı gerçek kalite kapılarından geçer', () => {
  let total = 0;
  for (const gameId of PREMIUM_PILOT_GAME_IDS) {
    for (const round of rawRounds(gameId)) {
      total += 1;
      assert.equal(round.premiumPilot, true);
      assert.equal(round.requireExplicitDistractorEvidence, true);
      assert.equal(round.options.length, 4, round.questionKey);
      assert.equal(new Set(round.options).size, 4, round.questionKey);
      const wrong = round.optionDiagnostics.filter((entry) => !entry.isCorrect);
      assert.equal(wrong.length, 3, round.questionKey);
      assert.equal(new Set(wrong.map((entry) => entry.misconceptionId)).size, 3, round.questionKey);
      assert.ok(wrong.every((entry) => entry.constructionRule && entry.rationale && entry.whyStudentChoosesThis), round.questionKey);
      assert.ok(wrong.every((entry) => !String(entry.constructionRule).startsWith('inferredTextDistractor')), round.questionKey);

      const allText = `${round.context} ${round.prompt} ${round.options.join(' ')} ${round.explanation}`;
      assert.equal(BANNED_ARTIFICIAL.test(allText), false, round.questionKey);
      assert.equal(round.options.some((option) => BANNED_STANDALONE.test(option.trim())), false, round.questionKey);

      const factory = evaluatePremiumQuestionFactory(round, { grade: 8 });
      const options = evaluateOptionQuality(round);
      const integrity = auditChoiceIntegrity(round);
      const depth = attachCognitiveDepth(round, { grade: 8 }).cognitiveDepthGate;
      const solver = solveRoundIndependently(round);
      assert.equal(factory.ok, true, `${round.questionKey}: ${factory.violations.join(',')}`);
      assert.equal(options.ok, true, `${round.questionKey}: ${options.violations.join(',')}`);
      assert.equal(integrity.passed, true, `${round.questionKey}: ${integrity.errors.join(',')}`);
      assert.equal(depth.publicationAllowed, true, `${round.questionKey}: ${depth.violations.join(',')}`);
      assert.equal(solver.ok, true, `${round.questionKey}: ${solver.errors.join(',')}`);
    }
  }
  assert.equal(total, 34);
});

test('canlı çocuk oturumları yalnız premium pilot sorularıyla eksiksiz dolar', () => {
  const cases = [
    ['error-detective', 8, 13],
    ['paragraph-detective', 8, 13],
    ['science-reasoning', 8, 13]
  ];
  for (const [gameId, grade, age] of cases) {
    const game = GAME_CATALOG.find((item) => item.id === gameId);
    const session = createGameSession(gameId, { id: `pilot-${gameId}`, grade, age, skills: {} }, 260802, {
      completedSessionCount: 2,
      currentSessionIndex: 2,
      academicYear: '2026-2027',
      simulatedDate: '2026-10-01',
      attempts: []
    });
    assert.equal(session.rounds.length, game.sessionLength, `${gameId}: underfill`);
    assert.ok(session.rounds.every((round) => round.premiumPilot === true), `${gameId}: legacy fallback`);
    assert.ok(session.rounds.every((round) => round.productQualityGate === 'PASS'), `${gameId}: publish gate`);
    assert.ok(session.rounds.every((round) => ['GOLD', 'APPROVE'].includes(round.globalQualityStatus)), `${gameId}: global quality gate`);
    assert.ok(session.rounds.every((round) => round.optionQuality?.ok && round.choiceIntegrity?.passed), `${gameId}: option gate`);
  }
});

test('pilot havuzu tükenirse düşük kaliteli legacy içeriğe sessiz dönüş yapılmaz', () => {
  for (const gameId of PREMIUM_PILOT_GAME_IDS) {
    const allKeys = new Set(rawRounds(gameId).map((round) => round.questionKey));
    const game = GAME_CATALOG.find((item) => item.id === gameId);
    const session = createGameSession(gameId, { id: `exhaust-${gameId}`, grade: 8, age: 13, skills: {} }, 9182, {
      completedSessionCount: 4,
      currentSessionIndex: 4,
      academicYear: '2026-2027',
      seenQuestionKeys: allKeys,
      attempts: []
    });
    assert.ok(session.rounds.length < game.sessionLength, `${gameId}: havuz tükenmesine rağmen oturum dolduruldu`);
    assert.ok(session.rounds.every((round) => round.premiumPilot === true), `${gameId}: legacy fallback yapıldı`);
  }
});

test('explicit evidence isteyen yeni soruda otomatik genel misconception uydurulmaz', () => {
  const verdict = evaluatePremiumQuestionFactory({
    kind: 'choice',
    prompt: 'Kanıta göre doğru çıkarım hangisidir?',
    context: 'Kısa bir deney açıklaması.',
    options: ['A', 'B', 'C', 'D'],
    answerIndex: 0,
    familyId: 'demo',
    skeletonId: 'demo:select',
    explanation: 'A, deney kanıtıyla uyumludur.',
    requireExplicitDistractorEvidence: true,
    reasoningStepCount: 2,
    cognitiveTraits: ['multiStepInference', 'conditionEvaluation']
  }, { grade: 8 });
  assert.equal(verdict.ok, false);
  assert.ok(verdict.violations.some((item) => item.startsWith('missing_real_misconception')));
});
