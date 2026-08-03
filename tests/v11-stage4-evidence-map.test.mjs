import test from 'node:test';
import assert from 'node:assert/strict';
import { createDynamicParagraphSession } from '../js/engines/paragraph-engine-v4.js';

function sampleRounds() {
  const rounds = [];
  for (const grade of [3, 6, 8, 12]) {
    for (let seed = 0; seed < 12; seed += 1) {
      rounds.push(...createDynamicParagraphSession({ id:`stage4-${grade}`, grade, age:grade + 5 }, `stage4-${grade}-${seed}`, 16));
    }
  }
  return rounds;
}

test('her paragraf sorusu doğru cevabı metin kanıtlarına bağlar', () => {
  for (const round of sampleRounds()) {
    assert.ok(round.evidenceMap.evidenceUnits.length >= 1, round.familyId);
    assert.ok(round.evidenceMap.correctAnswerEvidenceIds.length >= 1, round.familyId);
    const ids = new Set(round.evidenceMap.evidenceUnits.map(item => item.evidenceId));
    assert.ok(round.evidenceMap.correctAnswerEvidenceIds.every(id => ids.has(id)), round.familyId);
    assert.equal(round.evidenceMap.coverageStatus, 'COMPLETE');
  }
});

test('her seçenek tanısal kimlik taşır ve yalnız bir seçenek doğrudur', () => {
  for (const round of sampleRounds()) {
    assert.equal(round.optionDiagnostics.length, 4, round.familyId);
    assert.equal(round.optionDiagnostics.filter(item => item.isCorrect).length, 1, round.familyId);
    const correct = round.optionDiagnostics.find(item => item.isCorrect);
    assert.equal(correct.optionText, round.answerValue, round.familyId);
    assert.equal(correct.diagnosticStatus, 'SUPPORTED_CORRECT');
  }
});

test('üç yanlış seçenek üç iskelet yanılgısına bağlanır', () => {
  for (const round of sampleRounds()) {
    assert.equal(round.misconceptionMap.length, 3, round.familyId);
    assert.equal(new Set(round.misconceptionMap.map(item => item.misconceptionId)).size, 3, round.familyId);
    assert.ok(round.misconceptionMap.every(item => item.misconception && item.diagnosticStatus === 'MISCONCEPTION_MAPPED'), round.familyId);
  }
});
