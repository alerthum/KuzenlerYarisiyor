import test from 'node:test';
import assert from 'node:assert/strict';
import { materializeItemModel } from '../../js/assessment-v2/materialize.js';
import { evaluateV2Publication } from '../../js/assessment-v2/publication-gate.js';
import {
  PHASE3C_READING_MODELS,
  necessaryAssumptionModel,
  causalBoundaryModel,
  crossTextRelationModel,
  strongestEvidenceModel
} from '../../js/assessment-v2/reading-models-phase3c.js';

function pass(model, seed = {}) {
  const item = materializeItemModel(model, seed);
  assert.equal(item.solverProof.verified, true, model.id);
  assert.equal(item.distractors.length, 4, model.id);
  assert.equal(new Set(item.distractors.map(d => d.misconceptionId)).size, 4, model.id);
  assert.equal(evaluateV2Publication(item, { gameId: 'paragraph-detective' }).ok, true, model.id);
  return item;
}

test('Faz 3C varsayım, nedensellik, metinler arası ilişki ve kanıt gücü modelleri beş seçenekle yayın kapısını geçer', () => {
  for (const model of PHASE3C_READING_MODELS) pass(model);
});

test('zorunlu varsayım modeli alternatif açıklamayı dışlama gereğini bulur', () => {
  const item = pass(necessaryAssumptionModel, { library: 'Banaz İlçe Kütüphanesi' });
  assert.match(item.answerText, /başka önemli bir uygulama yapılmamıştır/);
  assert.equal(item.distractors.some(d => /bütün okurlar/.test(d.text)), true);
});

test('nedensellik sınırı modeli gözlemsel ilişkiyi kabul eder fakat tek neden üretmez', () => {
  const item = pass(causalBoundaryModel, { students: 180 });
  assert.match(item.answerText, /ilişki görülmüştür/);
  assert.match(item.answerText, /tek neden/);
  assert.equal(item.distractors.some(d => /kesin olarak düşürür/.test(d.text)), true);
});

test('iki metin modeli ortak sahicilik arayışını ve farklı yazma yöntemlerini birlikte eşler', () => {
  const item = pass(crossTextRelationModel);
  assert.match(item.answerText, /sahici bir anlatı/);
  assert.match(item.answerText, /kendiliğindenliği/);
  assert.match(item.answerText, /gözden geçirerek/);
});

test('kanıt gücü modeli tarihli birincil belgeyi anı ve tanıtım metninden üstün tutar', () => {
  const item = pass(strongestEvidenceModel, { year: 1887 });
  assert.match(item.answerText, /1887 tarihli/);
  assert.match(item.answerText, /arşiv kaydıyla doğrulanan/);
  assert.equal(item.distractors.some(d => /albümün tanıtım yazısında/.test(d.text)), true);
});
