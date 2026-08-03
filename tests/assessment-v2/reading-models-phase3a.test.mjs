import test from 'node:test';
import assert from 'node:assert/strict';
import { materializeItemModel } from '../../js/assessment-v2/materialize.js';
import { evaluateV2Publication } from '../../js/assessment-v2/publication-gate.js';
import { explainReadingEvidenceDecision } from '../../js/assessment-v2/reading-evidence-solver.js';
import {
  PHASE3A_READING_MODELS,
  mainIdeaCoverageModel,
  supportedInferenceModel,
  claimEvidenceMatchModel,
  scopeCertaintyControlModel
} from '../../js/assessment-v2/reading-models-phase3a.js';

function assertReadingModelPasses(model, seed = {}) {
  const item = materializeItemModel(model, seed);
  assert.equal(item.solverProof.verified, true, model.id);
  assert.equal(item.distractors.length, 4, model.id);
  assert.equal(new Set(item.distractors.map(d => d.misconceptionId)).size, 4, model.id);
  assert.equal(new Set(item.distractors.map(d => d.text)).size, 4, model.id);
  assert.equal(item.hints.length, model.solutionGraph.steps.length, model.id);
  assert.equal(evaluateV2Publication(item, { gameId: 'paragraph-detective' }).ok, true, model.id);
  assert.equal(evaluateV2Publication(item, { gameId: 'science-lab' }).errors.includes('game_construct_mismatch'), true, model.id);
  return item;
}

test('Faz 3A dört paragraf modeli ayrı kanıt çözümü ve dört hata yolu ile yayın kapısını geçer', () => {
  for (const model of PHASE3A_READING_MODELS) assertReadingModelPasses(model);
});

test('ana düşünce modeli kent belleği ile yaşayan şehrin değişimini birlikte kapsar', () => {
  const item = assertReadingModelPasses(mainIdeaCoverageModel, { city: 'Uşak' });
  assert.match(item.answerText, /Kent belleğini/);
  assert.match(item.answerText, /değişime kapatmadan/);
  assert.match(item.distractors.find(d => d.misconceptionId === 'detail-as-main-idea').text, /sokak adları/);
});

test('desteklenen çıkarım modeli anekdotu evrensel yasaya dönüştürmez', () => {
  const task = supportedInferenceModel.generateTask({ objectName: 'bez kaplı albüm' });
  const decision = explainReadingEvidenceDecision(task);
  assert.deepEqual(decision.filter(row => row.accepted).map(row => row.id), ['a']);
  const item = assertReadingModelPasses(supportedInferenceModel, { objectName: 'bez kaplı albüm' });
  assert.match(item.answerText, /deneyimin/);
  assert.equal(item.distractors.some(d => /Hiçbir sanatçı/.test(d.text)), true);
});

test('iddia-kanıt modeli üslup değişimini dönem başyazılarının karşılaştırmasıyla doğrular', () => {
  const item = assertReadingModelPasses(claimEvidenceMatchModel, { magazine: 'Eşik' });
  assert.match(item.answerText, /İlk ve sonraki dönem başyazılarındaki/);
  assert.equal(item.distractors.some(d => /kapak rengi/.test(d.text)), true);
});

test('kapsam modeli iki sınıf ve sınırlı süreyi evrensel veya kalıcı sonuca dönüştürmez', () => {
  const item = assertReadingModelPasses(scopeCertaintyControlModel, { school: 'Umut Ortaokulu', weeks: 5 });
  assert.match(item.answerText, /bu okuldaki iki sınıfın/);
  assert.match(item.answerText, /5 hafta/);
  assert.equal(item.distractors.some(d => /yaşamları boyunca/.test(d.text)), true);
});

test('aynı paragraf modelinin yüzey değişkenleri aynı CX kimliğini, farklı yüzey parmak izini üretir', () => {
  const a = materializeItemModel(mainIdeaCoverageModel, { city: 'Sarıova' });
  const b = materializeItemModel(mainIdeaCoverageModel, { city: 'Uşak' });
  assert.equal(a.cognitiveExperienceId, b.cognitiveExperienceId);
  assert.equal(a.structuralId, b.structuralId);
  assert.notEqual(a.surfaceFingerprint, b.surfaceFingerprint);
});
