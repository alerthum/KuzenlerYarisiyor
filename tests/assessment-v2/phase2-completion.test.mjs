import test from 'node:test';
import assert from 'node:assert/strict';
import { pigeonholeModel } from '../../js/assessment-v2/pilots.js';
import { ALL_PHASE2_MATH_MODELS, PHASE2_MATH_IDEAS } from '../../js/assessment-v2/math-model-catalog.js';
import { materializeItemModel } from '../../js/assessment-v2/materialize.js';
import { evaluateV2Publication } from '../../js/assessment-v2/publication-gate.js';

test('Faz 2 kataloğu 12 farklı matematik-olimpiyat ana fikrini tamamlar', () => {
  const models = [pigeonholeModel, ...ALL_PHASE2_MATH_MODELS];
  assert.equal(models.length, 12);
  assert.equal(PHASE2_MATH_IDEAS.length, 11);
  assert.equal(new Set(models.map(model => model.id)).size, 12);
  assert.equal(new Set(models.map(model => model.construct.id)).size, 12);
  assert.equal(new Set(models.map(model => model.cognitiveExperienceId)).size, 12);
});

test('Faz 2 modellerinin tamamı bağımsız doğrulama, çözüm grafı ve üç hata yolu taşır', () => {
  const models = [pigeonholeModel, ...ALL_PHASE2_MATH_MODELS];
  for (const model of models) {
    const item = materializeItemModel(model, {});
    assert.equal(item.solverProof.verified, true, model.id);
    assert.equal(item.hints.length, model.solutionGraph.steps.length, model.id);
    assert.equal(item.solution.length, model.solutionGraph.steps.length, model.id);
    assert.deepEqual(item.hints, model.solutionGraph.steps.map(step => step.hint), model.id);
    assert.equal(item.distractors.length, 3, model.id);
    assert.equal(new Set(item.distractors.map(d => d.misconceptionId)).size, 3, model.id);
    assert.equal(new Set(item.distractors.map(d => d.text)).size, 3, model.id);
    assert.equal(evaluateV2Publication(item, { gameId: model.compatibleGameIds[0] }).ok, true, model.id);
  }
});
