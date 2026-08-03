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
  assert.equal(item.distractors.length, 3, model.id);
  assert.equal(new Set(item.distractors.map(d => d.misconceptionId)).size, 3, model.id);
  assert.equal(new Set(item.distractors.map(d => d.text)).size, 3, model.id);
  assert.equal(item.hints.length, model.solutionGraph.steps.length, model.id);
  assert.equal(evaluateV2Publication(item, { gameId: 'paragraph-detective' }).ok, true, model.id);
  assert.equal(evaluateV2Publication(item, { gameId: 'science-lab' }).errors.includes('game_construct_mismatch'), true, model.id);
  return item;
}

test('Faz 3A dört paragraf modeli ayrı kanıt çözümü ve üç hata yolu ile yayın kapısını geçer', () => {
  for (const model of PHASE3A_READING_MODELS) assertReadingModelPasses(model);
});

test('ana düşünce modeli iki merkezî iddiayı birlikte kapsar, ayrıntıyı cevap yapmaz', () => {
  const item = assertReadingModelPasses(mainIdeaCoverageModel, { city: 'Ihlamur', difference: 6 });
  assert.match(item.answerText, /serinletebilir/);
  assert.match(item.answerText, /su ve toprak/);
  assert.match(item.distractors.find(d => d.misconceptionId === 'detail-as-main-idea').text, /6 derece/);
});

test('desteklenen çıkarım modeli kesinlik ve kapsam yükselten seçenekleri reddeder', () => {
  const task = supportedInferenceModel.generateTask({ library: 'Çınar Kütüphanesi' });
  const decision = explainReadingEvidenceDecision(task);
  assert.deepEqual(decision.filter(row => row.accepted).map(row => row.id), ['a']);
  const item = assertReadingModelPasses(supportedInferenceModel, { library: 'Çınar Kütüphanesi' });
  assert.match(item.answerText, /olabilir/);
  assert.equal(item.distractors.some(d => /kesin/.test(d.text)), true);
});

test('iddia-kanıt modeli yalnız gerçek destek kenarını kabul eder', () => {
  const item = assertReadingModelPasses(claimEvidenceMatchModel, { wetland: 'Turna Sazlığı', tracked: 12, stopped: 9 });
  assert.match(item.answerText, /9 tanesi burada durmuş/);
  assert.equal(item.distractors.some(d => /1960/.test(d.text)), true);
});

test('kapsam modeli tek okul ve iki haftalık ölçümü evrensel veya kalıcı sonuca dönüştürmez', () => {
  const item = assertReadingModelPasses(scopeCertaintyControlModel, { school: 'Umut Lisesi', sample: 96, weeks: 3 });
  assert.match(item.answerText, /bu okuldaki/);
  assert.match(item.answerText, /3 hafta/);
  assert.equal(item.distractors.some(d => /yaşamları boyunca/.test(d.text)), true);
});

test('aynı paragraf modelinin yüzey değişkenleri aynı CX kimliğini, farklı yüzey parmak izini üretir', () => {
  const a = materializeItemModel(mainIdeaCoverageModel, { city: 'Güneydere', difference: 7 });
  const b = materializeItemModel(mainIdeaCoverageModel, { city: 'Ihlamur', difference: 5 });
  assert.equal(a.cognitiveExperienceId, b.cognitiveExperienceId);
  assert.equal(a.structuralId, b.structuralId);
  assert.notEqual(a.surfaceFingerprint, b.surfaceFingerprint);
});
