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
  assert.equal(item.distractors.length, 4, model.id);
  assert.equal(new Set(item.distractors.map(d => d.misconceptionId)).size, 4, model.id);
  assert.equal(evaluateV2Publication(item, { gameId: 'meaning-hunt' }).ok, true, model.id);
  return item;
}

test('Faz 3B amaç, tutum, karşıtlık ve paragraf işlevi modelleri beş seçenekle yayın kapısını geçer', () => {
  for (const model of PHASE3B_READING_MODELS) materializeAndPass(model);
});

test('amaç modeli görünüşü koruma ile yaşayan işlevi sürdürme ayrımını yakalar', () => {
  const item = materializeAndPass(authorPurposeModel, { structure: 'semt çeşmesi' });
  assert.match(item.answerText, /yaşam içindeki işlevini/);
  assert.match(item.answerText, /düşündürmek/);
});

test('tutum modeli edebî başarıyı teslim ederken kişi kurulumunu eleştirir', () => {
  const item = materializeAndPass(authorAttitudeModel, { work: 'Kırık Saatler' });
  assert.match(item.answerText, /takdir eden/);
  assert.match(item.answerText, /yetersiz bulan/);
  assert.equal(item.distractors.some(d => /kusursuz/.test(d.text)), true);
});

test('karşıtlık modeli biçimsel sadakat ile etki sadakatini ters çevirmeden kurar', () => {
  const item = materializeAndPass(contrastRelationModel);
  assert.match(item.answerText, /sözcük ve yapıya/);
  assert.match(item.answerText, /sesini ve etkisini/);
});

test('paragraf işlevi modeli ikinci paragrafı alternatif uygulama ve sonuç örneği olarak sınıflandırır', () => {
  const item = materializeAndPass(paragraphFunctionModel, { museum: 'Uşak Kent Müzesi' });
  assert.match(item.answerText, /alternatif bir yöntem/);
  assert.match(item.answerText, /sonucunu örneklemek/);
  assert.equal(item.context.includes('\n\n'), true);
});
