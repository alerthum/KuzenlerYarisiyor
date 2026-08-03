import test from 'node:test';
import assert from 'node:assert/strict';
import { materializeItemModel } from '../../js/assessment-v2/materialize.js';
import { evaluateV2Publication } from '../../js/assessment-v2/publication-gate.js';
import {
  PHASE3B_READING_MODELS,
  authorPurposeModel,
  authorAttitudeModel,
  contrastRelationModel,
  paragraphFunctionModel
} from '../../js/assessment-v2/reading-models-phase3b.js';

function materializeAndPass(model, seed = {}) {
  const item = materializeItemModel(model, seed);
  assert.equal(item.solverProof.verified, true, model.id);
  assert.equal(item.distractors.length, 3, model.id);
  assert.equal(new Set(item.distractors.map(d => d.misconceptionId)).size, 3, model.id);
  assert.equal(evaluateV2Publication(item, { gameId: 'meaning-hunt' }).ok, true, model.id);
  return item;
}

test('Faz 3B amaç, tutum, karşıtlık ve paragraf işlevi modelleri yayın kapısını geçer', () => {
  for (const model of PHASE3B_READING_MODELS) materializeAndPass(model);
});

test('amaç modeli bilgilendirme ile katılım çağrısını birlikte taşır', () => {
  const item = materializeAndPass(authorPurposeModel, { district: 'Çamlık', varieties: 52, day: 'pazar' });
  assert.match(item.answerText, /önemini açıklamak/);
  assert.match(item.answerText, /katkı vermeye yöneltmek/);
});

test('tutum modeli koşulsuz övgü yerine temkinli desteği seçer', () => {
  const item = materializeAndPass(authorAttitudeModel);
  assert.match(item.answerText, /temkinli/);
  assert.equal(item.distractors.some(d => /hiçbir çekince/.test(d.text)), true);
});

test('karşıtlık modeli kısa rahatlama ile talep azaltma yönünü ters çevirmeden kurar', () => {
  const item = materializeAndPass(contrastRelationModel, { city: 'Uşak' });
  assert.match(item.answerText, /kısa süreli/);
  assert.match(item.answerText, /araç talebini azaltmaya/);
});

test('paragraf işlevi modeli ikinci paragrafı çözüm denemesi ve sonuç olarak sınıflandırır', () => {
  const item = materializeAndPass(paragraphFunctionModel, { museum: 'Arkeoloji Müzesi', duration: 8 });
  assert.match(item.answerText, /çözüm denemesini ve sonucunu/);
  assert.equal(item.context.includes('\n\n'), true);
});
