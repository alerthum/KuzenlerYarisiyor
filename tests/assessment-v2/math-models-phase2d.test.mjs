import test from 'node:test';
import assert from 'node:assert/strict';
import { materializeItemModel } from '../../js/assessment-v2/materialize.js';
import { evaluateV2Publication } from '../../js/assessment-v2/publication-gate.js';
import {
  PHASE2D_MATH_MODELS,
  takeAwayGameStrategyModel,
  inequalityBoundingWeightedProductModel
} from '../../js/assessment-v2/math-models-phase2d.js';

test('Faz 2D oyun stratejisi ve eşitsizlik modelleri solver-backed yayın kapısını geçer', () => {
  for (const model of PHASE2D_MATH_MODELS) {
    const item = materializeItemModel(model, {});
    assert.equal(item.solverProof.verified, true, model.id);
    assert.equal(item.distractors.length, 3, model.id);
    assert.equal(new Set(item.distractors.map(d => d.misconceptionId)).size, 3, model.id);
    assert.equal(new Set(item.distractors.map(d => d.text)).size, 3, model.id);
    assert.equal(evaluateV2Publication(item, { gameId: model.compatibleGameIds[0] }).ok, true, model.id);
  }
});

test('oyun stratejisi modeli 21 taşta ilk hamleyi 1 bulur ve minimax ile doğrular', () => {
  const item = materializeItemModel(takeAwayGameStrategyModel, { pileSize: 21, maxTake: 3 });
  assert.equal(item.answer, 1);
  assert.deepEqual(item.distractors.map(d => d.value), [3, 2, 0]);
  assert.match(item.solution[1].explanation, /4’ün katları/);
  assert.match(item.solution[2].explanation, /20=5·4/);
});

test('eşitsizlik modeli keskin üst sınırı 2500 bulur ve sayısal optimizasyonla doğrular', () => {
  const item = materializeItemModel(inequalityBoundingWeightedProductModel, { total: 20 });
  assert.equal(item.answer, 2500);
  assert.deepEqual(item.distractors.map(d => d.text), ['1975,31', '296,30', '2304']);
  assert.match(item.solution[0].explanation, /a\/2/);
  assert.match(item.solution[2].explanation, /a=10, b=5, c=5/);
});
