import test from 'node:test';
import assert from 'node:assert/strict';

import {
  generatePremiumRounds,
  PREMIUM_GAME_IDS,
  premiumQuestionInventory,
  premiumQuestionSummary
} from '../js/content/premium-question-bank.js';
import { createGameSession, GAME_CATALOG } from '../js/games/registry.js';
import { evaluateOptionQuality } from '../js/quality/premium-options-engine.js';
import { auditChoiceIntegrity } from '../js/quality/choice-integrity-engine-v11.js';
import { evaluatePremiumQuestionFactory } from '../js/quality/question-factory-v13.js';
import { attachCognitiveDepth } from '../js/quality/cognitive-depth-engine.js';
import { solveRoundIndependently } from '../js/quality/independent-solver.js';
import { validatePremiumTaskRound } from '../js/content/premium-task-core.js';

const BANNED_ARTIFICIAL = /(hangi seçenek düşünme yolunu bozar|kısmi doğruyu tam sanan|görünmez ruh etkiler|doğru cevaba benzer görünür; ancak soru kökündeki kanıt)/i;
const BANNED_STANDALONE = /^(renk|ses|şarkı|sarki|rastgele|tahmin)$/i;

function allRounds(gameId) {
  return generatePremiumRounds(gameId, { seed: 20260803, count: 999 }).rounds;
}

function profileForGame(gameId, prefix = 'premium') {
  if (gameId === 'lgs-focus') return { id: `${prefix}-${gameId}`, grade: 8, age: 13, skills: {} };
  if (['tyt-focus', 'ayt-focus'].includes(gameId)) return { id: `${prefix}-${gameId}`, grade: 12, age: 18, skills: {} };
  if (gameId === 'kpss-focus') return { id: `${prefix}-${gameId}`, grade: 12, age: 20, skills: {} };
  return { id: `${prefix}-${gameId}`, grade: 8, age: 13, skills: {} };
}

test('premium soru bankası yirmi yedi akademik oyunda 604 insan yazımı soru taşır', () => {
  assert.deepEqual(PREMIUM_GAME_IDS, [
    'error-detective',
    'paragraph-detective',
    'science-reasoning',
    'logic-station',
    'social-citizenship',
    'english-cloze',
    'problem-hunter',
    'meaning-hunt',
    'science-lab',
    'pattern-lab',
    'social-map-skills',
    'english-vocabulary',
    'word-ladder',
    'english-sentence-builder',
    'forbidden-story',
    'geometry-lab',
    'social-time-travel',
    'religion-practice',
    'word-mine',
    'target-number',
    'speed-math',
    'olympiad-ladder',
    'lgs-foundation',
    'lgs-focus',
    'tyt-focus',
    'ayt-focus',
    'kpss-focus'
  ]);
  const summary = premiumQuestionSummary();
  const inventory = premiumQuestionInventory();
  assert.equal(summary.gameCount, 27);
  assert.equal(summary.questionCount, 604);
  assert.equal(summary.allHaveThreeMisconceptions, true);
  assert.equal(Object.keys(inventory).length, 27);
  assert.ok(Object.values(inventory).every((row) => row.questionCount >= 10));
});

test('604 premium soru ve görevin tamamı ortak fabrika, seçenek, bütünlük, derinlik ve solver kapılarından geçer', () => {
  let total = 0;
  for (const gameId of PREMIUM_GAME_IDS) {
    for (const round of allRounds(gameId)) {
      total += 1;
      assert.equal(round.premiumQuestion, true, round.questionKey);
      assert.ok(round.reasoningStepCount >= 2, round.questionKey);
      assert.ok(round.evidenceMap?.evidence?.length >= 2, round.questionKey);

      if (round.kind === 'choice') {
        assert.equal(round.requireExplicitDistractorEvidence, true, round.questionKey);
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
      } else {
        assert.equal(round.premiumTask, true, round.questionKey);
        assert.equal(round.taskValidation?.verified, true, round.questionKey);
        assert.ok(round.taskValidation?.diagnostics?.length >= 3, round.questionKey);
        const task = validatePremiumTaskRound(round);
        assert.equal(task.ok, true, `${round.questionKey}: ${task.errors.join(',')}`);
      }

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
  assert.equal(total, 604);
});

test('yirmi yedi premium oyunun canlı oturumu yalnız premium bankadan eksiksiz dolar', () => {
  for (const gameId of PREMIUM_GAME_IDS) {
    const game = GAME_CATALOG.find((entry) => entry.id === gameId);
    assert.ok(game, gameId);
    const session = createGameSession(gameId, profileForGame(gameId, 'premium'), 260803, {
      completedSessionCount: 1,
      currentSessionIndex: 1,
      academicYear: '2026-2027',
      simulatedDate: '2026-10-01',
      attempts: []
    });
    assert.equal(session.rounds.length, game.sessionLength, `${gameId}: underfill`);
    assert.ok(session.rounds.every((round) => round.premiumQuestion === true), `${gameId}: legacy fallback`);
    assert.ok(session.rounds.every((round) => round.productQualityGate === 'PASS'), `${gameId}: product gate`);
    assert.ok(session.rounds.every((round) => ['GOLD', 'APPROVE'].includes(round.globalQualityStatus)), `${gameId}: global gate`);
    assert.ok(session.rounds.every((round) => round.optionQuality?.ok && round.choiceIntegrity?.passed), `${gameId}: option gate`);
  }
});





test('aynı düşünme ailesindeki premium sorular sahte soru-kimliği ekiyle ayrıştırılmaz', () => {
  const rounds = generatePremiumRounds('error-detective', { seed: 99, count: 999, grade: 4 }).rounds;
  const fractionRounds = rounds.filter((round) => round.questionKey.includes('g35-math-fraction-compare-01')
    || round.questionKey.includes('g35-math-equivalent-fraction-01'));
  assert.equal(fractionRounds.length, 2);
  assert.equal(new Set(fractionRounds.map((round) => round.familyId)).size, 1);
  assert.equal(fractionRounds[0].familyId, 'g35-math-fractions');
  assert.equal(new Set(fractionRounds.map((round) => round.questionKey)).size, 2);
  assert.ok(fractionRounds.every((round) => !round.familyId.includes(round.questionKey)));
});

test('premium banka uygun sınıf içeriğini üretir, yanlış sınıfa sızmaz ve açığı gizlemez', () => {
  const gradeFourMeaning = generatePremiumRounds('meaning-hunt', { seed: 42, count: 20, grade: 4 });
  assert.equal(gradeFourMeaning.rounds.length, 10);
  assert.equal(gradeFourMeaning.audit.gradeRequested, 4);
  assert.equal(gradeFourMeaning.audit.gradeFilterApplied, true);
  assert.equal(gradeFourMeaning.audit.gradeEligibleAvailable, 10);
  assert.equal(gradeFourMeaning.audit.fallbackToLegacy, false);
  assert.ok(gradeFourMeaning.rounds.every((round) => round.gradeBand === '3-5'));

  const gradeTwoMeaning = generatePremiumRounds('meaning-hunt', { seed: 42, count: 20, grade: 2 });
  assert.equal(gradeTwoMeaning.rounds.length, 0);
  assert.equal(gradeTwoMeaning.audit.gradeEligibleAvailable, 0);

  const highSchoolOnly = generatePremiumRounds('tyt-focus', { seed: 42, count: 20, grade: 8 });
  assert.equal(highSchoolOnly.rounds.length, 0);
  assert.equal(highSchoolOnly.audit.gradeEligibleAvailable, 0);

  const gradeFourTask = generatePremiumRounds('word-mine', { seed: 42, count: 20, grade: 4 });
  assert.equal(gradeFourTask.rounds.length, 10);
  assert.ok(gradeFourTask.rounds.every((round) => round.gradeBand === '3-8'));
});

test('canlı oturum doğru sınıfta premium içerikle dolar ve legacy havuza düşmez', () => {
  const session = createGameSession('meaning-hunt', { id: 'grade-4-safety', grade: 4, age: 9, skills: {} }, 404, {
    completedSessionCount: 1,
    currentSessionIndex: 1,
    academicYear: '2026-2027',
    simulatedDate: '2026-10-01',
    attempts: []
  });
  assert.equal(session.rounds.length, 5);
  assert.ok(session.rounds.every((round) => round.premiumQuestion === true));
  assert.ok(session.rounds.every((round) => round.gradeBand === '3-5'));
  assert.equal(session.globalQualityAudit?.premiumBank?.fallbackToLegacy, false);
});

test('premium bankası tükenirse hiçbir premium oyunda legacy içeriğe sessiz dönüş olmaz', () => {
  for (const gameId of PREMIUM_GAME_IDS) {
    const keys = new Set(allRounds(gameId).map((round) => round.questionKey));
    const game = GAME_CATALOG.find((entry) => entry.id === gameId);
    const session = createGameSession(gameId, profileForGame(gameId, 'exhaust'), 9182, {
      completedSessionCount: 4,
      currentSessionIndex: 4,
      academicYear: '2026-2027',
      seenQuestionKeys: keys,
      attempts: []
    });
    assert.ok(session.rounds.length < game.sessionLength, `${gameId}: exhausted bank was silently filled`);
    assert.ok(session.rounds.every((round) => round.premiumQuestion === true), `${gameId}: legacy fallback`);
  }
});
