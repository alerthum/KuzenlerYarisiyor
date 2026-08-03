import test from 'node:test';
import assert from 'node:assert/strict';

import { definePremiumTask, validatePremiumTaskRound } from '../js/content/premium-task-core.js';
import { generatePremiumRounds } from '../js/content/premium-question-bank.js';
import { solveRoundIndependently } from '../js/quality/independent-solver.js';

const BASE = {
  gameId: 'word-ladder',
  familyId: 'test-family',
  skeletonId: 'test-skeleton',
  subjectId: 'turkish',
  topicId: 'word-relations',
  learningOutcomeId: 'test-outcome',
  prompt: 'Görevi kısıtlara göre tamamla.',
  explanation: 'Doğrulanmış çözüm yolu ve görev ölçütleri birlikte kontrol edilir.',
  cognitiveTraits: ['multiStepInference', 'conditionEvaluation'],
  reasoningStepCount: 2,
  evidence: ['İlk kısıt kontrol edilir.', 'İkinci kısıt kontrol edilir.'],
  diagnostics: [
    { id: 'd1', why: 'Birinci gerçek hata açıklaması.', detectionRule: 'rule-1' },
    { id: 'd2', why: 'İkinci gerçek hata açıklaması.', detectionRule: 'rule-2' },
    { id: 'd3', why: 'Üçüncü gerçek hata açıklaması.', detectionRule: 'rule-3' }
  ]
};

test('iki harfi aynı adımda değiştiren premium kelime merdiveni tanım aşamasında reddedilir', () => {
  assert.throws(() => definePremiumTask({
    ...BASE,
    id: 'invalid-ladder',
    kind: 'wordLadder',
    task: { start: 'dal', steps: ['bel'], end: 'son', dictionary: ['dal', 'bel', 'son'] }
  }), /invalid ladder step/);
});

test('beşten az sözcüklü premium cümle kurma görevi reddedilir', () => {
  assert.throws(() => definePremiumTask({
    ...BASE,
    id: 'invalid-order',
    gameId: 'english-sentence-builder',
    kind: 'wordOrder',
    subjectId: 'english',
    task: { answerTokens: ['She', 'is', 'ready'] }
  }), /at least five answer tokens/);
});

test('düşük cümle ve kelime eşiği taşıyan hikâye görevi reddedilir', () => {
  assert.throws(() => definePremiumTask({
    ...BASE,
    id: 'invalid-story',
    gameId: 'forbidden-story',
    kind: 'story',
    task: { forbiddenLetter: 'a', minSentences: 1, minUniqueWords: 5, rubric: ['a', 'b', 'c', 'd'] }
  }), /at least three sentences/);
});

test('4. ve 8. sınıf canlı premium görevlerin sözleşmesi bağımsız çözücü tarafından doğrulanır', () => {
  for (const grade of [4, 8]) {
    for (const gameId of ['word-ladder', 'english-sentence-builder', 'forbidden-story', 'word-mine', 'target-number']) {
      const rounds = generatePremiumRounds(gameId, { seed: 741, count: 99, grade }).rounds;
      assert.equal(rounds.length, 10, `${gameId}/grade-${grade}`);
      for (const round of rounds) {
        assert.equal(validatePremiumTaskRound(round).ok, true, round.questionKey);
        assert.equal(solveRoundIndependently(round).ok, true, round.questionKey);
      }
    }
  }
});

test('sonradan bozulan premium merdiven yolu bağımsız çözücüden geçmez', () => {
  const round = generatePremiumRounds('word-ladder', { seed: 17, count: 1 }).rounds[0];
  const broken = { ...round, steps: ['zzz'] };
  const verdict = solveRoundIndependently(broken);
  assert.equal(verdict.ok, false);
  assert.ok(verdict.errors.includes('word_ladder_invalid_step'));
});


test('kaynak harflerle kurulamayan premium kelime madeni tanım aşamasında reddedilir', () => {
  assert.throws(() => definePremiumTask({
    ...BASE,
    id: 'invalid-word-mine',
    gameId: 'word-mine',
    kind: 'wordMine',
    topicId: 'letter-inventory',
    task: {
      source: 'kalemlik',
      allowed: ['kalem', 'kal', 'kel', 'kim', 'kil', 'liman', 'ekim', 'zeka']
    }
  }), /every wordMine word must be buildable/);
});

test('hedefe ulaşmayan premium sayı ifadesi tanım aşamasında reddedilir', () => {
  assert.throws(() => definePremiumTask({
    ...BASE,
    id: 'invalid-expression',
    gameId: 'target-number',
    kind: 'expression',
    subjectId: 'mathematics',
    topicId: 'target-expression',
    task: { numbers: [2, 3, 4, 5], target: 50, solution: '2 + 3 + 4 + 5' }
  }), /expression solution is invalid/);
});

test('sonradan bozulan kelime madeni ve hedef sayı görevleri bağımsız çözücüden geçmez', () => {
  const mine = generatePremiumRounds('word-mine', { seed: 21, count: 1, grade: 4 }).rounds[0];
  const brokenMine = { ...mine, allowed: [...mine.allowed, 'uygunsuzkelime'] };
  const mineVerdict = solveRoundIndependently(brokenMine);
  assert.equal(mineVerdict.ok, false);
  assert.ok(mineVerdict.errors.includes('word_mine_invalid_word'));

  const expression = generatePremiumRounds('target-number', { seed: 22, count: 1, grade: 4 }).rounds[0];
  const brokenExpression = { ...expression, solution: `${expression.solution} + 1` };
  const expressionVerdict = solveRoundIndependently(brokenExpression);
  assert.equal(expressionVerdict.ok, false);
  assert.ok(expressionVerdict.errors.includes('expression_solution_invalid'));
});
