import test from 'node:test';
import assert from 'node:assert/strict';
import { materializeItemModel } from '../../js/assessment-v2/materialize.js';
import { evaluateV2Publication } from '../../js/assessment-v2/publication-gate.js';
import {
  PHASE2B_MATH_MODELS,
  invariantEuclidModel,
  parityColoringDominoModel,
  extremalGraphDegreeModel
} from '../../js/assessment-v2/math-models-phase2b.js';

test('Faz 2B üç modelin her biri bağımsız doğrulayıcı ve üç ayrı hata yolu ile yayın kapısını geçer', () => {
  for (const model of PHASE2B_MATH_MODELS) {
    const item = materializeItemModel(model, {});
    assert.equal(item.solverProof.verified, true, model.id);
    assert.equal(item.distractors.length, 3, model.id);
    assert.equal(new Set(item.distractors.map(d => d.misconceptionId)).size, 3, model.id);
    assert.equal(new Set(item.distractors.map(d => d.answerText || d.text)).size, 3, model.id);
    assert.equal(evaluateV2Publication(item, { gameId: model.compatibleGameIds[0] }).ok, true, model.id);
  }
});

test('değişmez modeli EBOB engelini ters Öklid doğrulamasıyla ayırır', () => {
  const item = materializeItemModel(invariantEuclidModel, {});
  assert.equal(item.answerText, '(8, 12)');
  assert.deepEqual(item.distractors.map(d => d.text), ['(7, 11)', '(8, 13)', '(5, 12)']);
  assert.match(item.solution[0].explanation, /EBOB/);
  assert.match(item.solution[2].explanation, /Öklid/);
});

test('parite ve boyama modeli çift alan yanılgısını exact-cover çözümünden ayırır', () => {
  const item = materializeItemModel(parityColoringDominoModel, {});
  assert.match(item.answerText, /Döşenemez/);
  assert.match(item.answerText, /6 ve 8|eşit değildir/);
  assert.equal(item.distractors.some(d => /7 domino/.test(d.text)), true);
  assert.equal(item.hints.length, item.solution.length);
});

test('ekstremal model 6 köşe 7 kenar için sıkı en büyük derece sınırını 3 bulur', () => {
  const item = materializeItemModel(extremalGraphDegreeModel, {});
  assert.equal(item.answer, 3);
  assert.deepEqual(item.distractors.map(d => d.value), [2, 1, 4]);
  assert.match(item.solution[2].explanation, /çevrim/);
});
