import test from 'node:test';
import assert from 'node:assert/strict';
import { materializeItemModel } from '../../js/assessment-v2/materialize.js';
import { evaluateV2Publication } from '../../js/assessment-v2/publication-gate.js';
import {
  PHASE2C_MATH_MODELS,
  divisorStructureMinimumModel,
  geometricReflectionPathModel
} from '../../js/assessment-v2/math-models-phase2c.js';

test('Faz 2C bölen yapısı ve geometrik dönüşüm modelleri üç özgün hata yolu ile yayınlanabilir', () => {
  for (const model of PHASE2C_MATH_MODELS) {
    const item = materializeItemModel(model, {});
    assert.equal(item.solverProof.verified, true, model.id);
    assert.equal(item.distractors.length, 3, model.id);
    assert.equal(new Set(item.distractors.map(d => d.misconceptionId)).size, 3, model.id);
    assert.equal(new Set(item.distractors.map(d => d.text)).size, 3, model.id);
    assert.equal(evaluateV2Publication(item, { gameId: model.compatibleGameIds[0] }).ok, true, model.id);
  }
});

test('bölen yapısı modeli 18 bölen için tüm üs kalıplarını karşılaştırıp 180 bulur', () => {
  const item = materializeItemModel(divisorStructureMinimumModel, { divisorCount: 18 });
  assert.equal(item.answer, 180);
  assert.deepEqual(item.distractors.map(d => d.value), [768, 288, 5400]);
  assert.match(item.solution[0].explanation, /18, 9·2, 6·3 ve 3·3·2/);
  assert.match(item.solution[2].explanation, /180/);
});

test('geometrik dönüşüm modeli yansımayı sayısal minimizasyonla bağımsız doğrular', () => {
  const item = materializeItemModel(geometricReflectionPathModel, {});
  assert.equal(item.answer, 10);
  assert.deepEqual(item.distractors.map(d => d.text), ['6,32', '8', '14']);
  assert.match(item.solution[0].explanation, /B′/);
  assert.match(item.solution[2].explanation, /6²\+8²/);
});
