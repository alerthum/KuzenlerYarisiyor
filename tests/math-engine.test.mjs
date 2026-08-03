import test from 'node:test';
import assert from 'node:assert/strict';
import {
  Fraction,
  createArithmeticRound,
  createPatternRound,
  createTargetRound,
  evaluateExpression,
  validateTargetExpression
} from '../js/engines/math-engine.js';

test('kesir işlemleri tam değerle çalışır', () => {
  assert.equal(new Fraction(1n, 3n).add(new Fraction(1n, 6n)).toString(), '1/2');
  assert.equal(new Fraction(3n, 4n).multiply(new Fraction(8n, 9n)).toString(), '2/3');
});

test('işlem önceliği ve parantez doğru uygulanır', () => {
  assert.equal(evaluateExpression('2 + 3 × 4').toString(), '14');
  assert.equal(evaluateExpression('(2 + 3) * 4').toString(), '20');
  assert.equal(evaluateExpression('1 / 2 + 1 / 4').toString(), '3/4');
});

test('hedef sayı verilen sayıların her birini bir kez ister', () => {
  assert.equal(validateTargetExpression('(8 + 4) * 3 - 2', [8, 4, 3, 2], 34).valid, true);
  assert.equal(validateTargetExpression('(8 + 4) * 3', [8, 4, 3, 2], 36).valid, false);
  assert.equal(validateTargetExpression('(8 + 4) * 3 - 2', [8, 4, 3, 7], 34).valid, false);
});

test('üretilen hedef sayı sorularının çözümü hedefi verir', () => {
  for (const age of [9, 13]) {
    for (let seed = 1; seed <= 100; seed += 1) {
      const round = createTargetRound(age, seed);
      const result = validateTargetExpression(round.solution, round.numbers, round.target);
      assert.equal(result.valid, true, `${age} yaş / seed ${seed}`);
    }
  }
});

test('üretilen işlem ve örüntü sorularında doğru cevap seçeneklerde bulunur', () => {
  for (const age of [9, 13]) {
    for (let seed = 1; seed <= 100; seed += 1) {
      const arithmetic = createArithmeticRound(age, seed);
      assert.ok(arithmetic.options.includes(String(arithmetic.answer)));
      assert.equal(new Set(arithmetic.options).size, 4);
      const pattern = createPatternRound(age, seed);
      assert.ok(pattern.options.includes(String(pattern.answer)));
      assert.equal(new Set(pattern.options).size, 4);
    }
  }
});
