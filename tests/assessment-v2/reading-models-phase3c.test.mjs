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
  assert.equal(item.distractors.length, 3, model.id);
  assert.equal(new Set(item.distractors.map(d => d.misconceptionId)).size, 3, model.id);
  assert.equal(evaluateV2Publication(item, { gameId: 'paragraph-detective' }).ok, true, model.id);
  return item;
}

test('Faz 3C varsayım, nedensellik, metinler arası ilişki ve kanıt gücü modelleri yayın kapısını geçer', () => {
  for (const model of PHASE3C_READING_MODELS) pass(model);
});

test('zorunlu varsayım modeli satış verisinin tüketimi temsil etmesi bağlantısını bulur', () => {
  const item = pass(necessaryAssumptionModel, { district: 'Banaz', stations: 9, decline: 14 });
  assert.match(item.answerText, /satışları/);
  assert.match(item.answerText, /kullanılan tek kullanımlık/);
});

test('nedensellik sınırı modeli gözlemsel ilişkiyi kabul eder fakat tek neden üretmez', () => {
  const item = pass(causalBoundaryModel, { students: 180, threshold: 7, subject: 'fen' });
  assert.match(item.answerText, /fen puanı/);
  assert.match(item.answerText, /ilişki vardır/);
  assert.match(item.answerText, /tek neden/);
  assert.equal(item.distractors.some(d => /fen başarısını kesin olarak yükseltir/.test(d.text)), true);
  assert.equal(item.distractors.some(d => /matematik/.test(d.text)), false);
});

test('iki metin modeli ortak karma düzeni ve farklı gerekçeleri birlikte eşler', () => {
  const item = pass(crossTextRelationModel, { remoteDays: 3 });
  assert.match(item.answerText, /İki metin de karma/);
  assert.match(item.answerText, /birincisi bireysel odaklanmayı/);
});

test('kanıt gücü modeli kontrollü önce-sonra sayımını anekdot ve broşürden üstün tutar', () => {
  const item = pass(strongestEvidenceModel, { school: 'Atatürk Ortaokulu', weeks: 12 });
  assert.match(item.answerText, /standart sayımlarda/);
  assert.match(item.answerText, /değişiklik yapılmayan/);
});
