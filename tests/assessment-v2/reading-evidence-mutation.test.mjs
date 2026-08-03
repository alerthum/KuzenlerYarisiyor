import test from 'node:test';
import assert from 'node:assert/strict';
import { solveReadingEvidenceTask, verifyReadingEvidenceAnswer } from '../../js/assessment-v2/reading-evidence-solver.js';
import { mainIdeaCoverageModel, supportedInferenceModel, claimEvidenceMatchModel } from '../../js/assessment-v2/reading-models-phase3a.js';
import { strongestEvidenceModel } from '../../js/assessment-v2/reading-models-phase3c.js';

function mutableTask(model, seed = {}) {
  return structuredClone(model.generateTask(seed));
}

test('doğru çıkarıma kesinlik eklendiğinde iki bağımsız yol da cevabı reddeder', () => {
  const task = mutableTask(supportedInferenceModel);
  const originalAnswer = solveReadingEvidenceTask(structuredClone(task));
  task.options.find(option => option.id === originalAnswer.id).semantic.proposition.modality = 'certain';
  assert.throws(() => solveReadingEvidenceTask(structuredClone(task)), /expected one answer, found 0/);
  assert.equal(verifyReadingEvidenceAnswer(structuredClone(task), originalAnswer), false);
});

test('iki ana düşünce seçeneği aynı kanıt kapsamına getirildiğinde belirsizlik RED olur', () => {
  const task = mutableTask(mainIdeaCoverageModel);
  const correct = task.options.find(option => option.id === 'a');
  task.options.find(option => option.id === 'b').semantic = structuredClone(correct.semantic);
  assert.throws(() => solveReadingEvidenceTask(structuredClone(task)), /expected one answer, found 2/);
  assert.equal(verifyReadingEvidenceAnswer(structuredClone(task), correct), false);
});

test('iddia-kanıt destek kenarı değiştiğinde eski cevap geçersiz, yeni destek çifti geçerli olur', () => {
  const task = mutableTask(claimEvidenceMatchModel);
  const originalAnswer = solveReadingEvidenceTask(structuredClone(task));
  task.evidenceMap.evidence.find(evidence => evidence.id === 'e1').supports = [];
  task.evidenceMap.evidence.find(evidence => evidence.id === 'e2').supports = ['c1'];
  const mutatedAnswer = solveReadingEvidenceTask(structuredClone(task));
  assert.equal(originalAnswer.id, 'a');
  assert.equal(mutatedAnswer.id, 'b');
  assert.equal(verifyReadingEvidenceAnswer(structuredClone(task), originalAnswer), false);
  assert.equal(verifyReadingEvidenceAnswer(structuredClone(task), mutatedAnswer), true);
});

test('anekdot yapay biçimde en güçlü kanıt yapılırsa çözücü yeni kanıtı seçer ve eski cevap düşer', () => {
  const task = mutableTask(strongestEvidenceModel);
  const originalAnswer = solveReadingEvidenceTask(structuredClone(task));
  const anecdote = task.evidenceMap.evidence.find(evidence => evidence.id === 'e2');
  anecdote.directness = 1.1;
  anecdote.reliability = 1;
  const mutatedAnswer = solveReadingEvidenceTask(structuredClone(task));
  assert.equal(originalAnswer.id, 'a');
  assert.equal(mutatedAnswer.id, 'b');
  assert.equal(verifyReadingEvidenceAnswer(structuredClone(task), originalAnswer), false);
  assert.equal(verifyReadingEvidenceAnswer(structuredClone(task), mutatedAnswer), true);
});
