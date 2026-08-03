import test from 'node:test';
import assert from 'node:assert/strict';
import { ALL_PHASE3_READING_MODELS, PHASE3_READING_IDEAS } from '../../js/assessment-v2/reading-model-catalog.js';
import { materializeItemModel } from '../../js/assessment-v2/materialize.js';
import { evaluateV2Publication } from '../../js/assessment-v2/publication-gate.js';
import { assessmentV2Inventory } from '../../js/assessment-v2/registry.js';

const EXPECTED_QUERY_TYPES = Object.freeze([
  'main-idea',
  'supported-inference',
  'claim-evidence',
  'scope-control',
  'purpose',
  'attitude',
  'contrast',
  'paragraph-function',
  'assumption',
  'causal-boundary',
  'cross-text',
  'evidence-strength'
]);

test('Faz 3 kataloğu 12 farklı okuma-paragraf ana fikrini tamamlar', () => {
  assert.equal(ALL_PHASE3_READING_MODELS.length, 12);
  assert.equal(PHASE3_READING_IDEAS.length, 12);
  assert.equal(new Set(ALL_PHASE3_READING_MODELS.map(model => model.id)).size, 12);
  assert.equal(new Set(ALL_PHASE3_READING_MODELS.map(model => model.construct.id)).size, 12);
  assert.equal(new Set(ALL_PHASE3_READING_MODELS.map(model => model.structuralId)).size, 12);
  assert.equal(new Set(ALL_PHASE3_READING_MODELS.map(model => model.cognitiveExperienceId)).size, 12);
});

test('Faz 3 on iki ayrı kanıt sorgusu türü taşır', () => {
  const queryTypes = ALL_PHASE3_READING_MODELS.map(model => model.generateTask({}).query.type);
  assert.deepEqual(queryTypes, EXPECTED_QUERY_TYPES);
  assert.equal(new Set(queryTypes).size, 12);
});

test('Faz 3 modellerinin tamamı bağımsız doğrulama, çözüm grafı ve dört ayrı öğrenci hata yolu taşır', () => {
  for (const model of ALL_PHASE3_READING_MODELS) {
    const task = model.generateTask({});
    const item = materializeItemModel(model, {});
    assert.equal(item.solverProof.verified, true, model.id);
    assert.equal(item.hints.length, model.solutionGraph.steps.length, model.id);
    assert.equal(item.solution.length, model.solutionGraph.steps.length, model.id);
    assert.deepEqual(item.hints, model.solutionGraph.steps.map(step => step.hint), model.id);
    assert.equal(item.distractors.length, 4, model.id);
    assert.equal(new Set(item.distractors.map(d => d.misconceptionId)).size, 4, model.id);
    assert.equal(new Set(item.distractors.map(d => d.text)).size, 4, model.id);
    assert.equal(evaluateV2Publication(item, { gameId: model.compatibleGameIds[0] }).ok, true, model.id);
    assert.equal(evaluateV2Publication(item, { gameId: 'science-lab' }).errors.includes('game_construct_mismatch'), true, model.id);

    const answer = model.solve(structuredClone(task));
    assert.equal(model.verify(structuredClone(task), structuredClone(answer)), true, model.id);
    for (const candidate of task.options.filter(option => option.id !== answer.id)) {
      assert.equal(model.verify(structuredClone(task), structuredClone(candidate)), false, `${model.id}:${candidate.id}`);
    }
  }
});

test('V2 envanteri Faz 3 modellerini reading alanına eklerken legacy politikasını değiştirmez', () => {
  const inventory = assessmentV2Inventory();
  assert.equal(inventory.domains.reading, 13); // 1 Faz-1 pilotu + 12 Faz-3 modeli
  assert.equal(inventory.legacyContentPolicy, 'UNVERIFIED_LEGACY');
  assert.equal(inventory.verifiedPremiumPolicy, 'ONLY_ASSESSMENT_V2_MODELS');
});
