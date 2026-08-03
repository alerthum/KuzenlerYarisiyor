import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GRADE8_TURKISH_FULL_SCOPE_MATRIX,
  GRADE8_TURKISH_FULL_SCOPE_AUDIT,
  GRADE8_TURKISH_PILOT01_COVERED_CODES,
  GRADE8_TURKISH_PILOT02_CALIBRATION_CODES,
  GRADE8_TURKISH_READING_LANGUAGE_WAVE1_CODES,
  auditGrade8TurkishFullScopeMatrix
} from '../../js/assessment-v2/turkish-g8-full-scope-matrix.js';

test('8. sınıf Türkçenin 76 resmî kazanımının tamamı ölçme planına bağlanır', () => {
  const audit = auditGrade8TurkishFullScopeMatrix();
  assert.equal(audit.ok, true, audit.errors.join('\n'));
  assert.equal(GRADE8_TURKISH_FULL_SCOPE_MATRIX.length, 76);
  assert.deepEqual(audit.metrics.domainCounts, {
    'dinleme-izleme': 14,
    konusma: 7,
    okuma: 35,
    yazma: 20
  });
  assert.equal(new Set(GRADE8_TURKISH_FULL_SCOPE_MATRIX.map(row => row.outcomeCode)).size, 76);
});

test('her kazanım en az bir ölçme biçimi ve alana özgü soru ailesi taşır', () => {
  for (const row of GRADE8_TURKISH_FULL_SCOPE_MATRIX) {
    assert.equal(row.recommendedItemFormats.length > 0, true, row.outcomeCode);
    assert.equal(row.questionFamilies.length > 0, true, row.outcomeCode);
    assert.equal(typeof row.assessmentMode, 'string');
    assert.equal(typeof row.assessmentChannel, 'string');
  }
});

test('konuşma ve yazma performans kazanımları zorla çoktan seçmeliye çevrilmez', () => {
  const speaking = GRADE8_TURKISH_FULL_SCOPE_MATRIX.filter(row => row.domainId === 'konusma');
  assert.equal(speaking.every(row => row.requiresHumanScoring), true);
  assert.equal(speaking.some(row => row.automatedScoringAllowed === false), true);
  const writingProduction = GRADE8_TURKISH_FULL_SCOPE_MATRIX.filter(row => row.outcomeCode >= 'T.8.4.1' && row.outcomeCode <= 'T.8.4.17');
  assert.equal(writingProduction.every(row => row.requiresHumanScoring), true);
  assert.equal(writingProduction.some(row => row.recommendedItemFormats.includes('open-response')), true);
});

test('dinleme ve sözlü olmayan iletişim kazanımları gerekli medya kanalını belirtir', () => {
  const listening = GRADE8_TURKISH_FULL_SCOPE_MATRIX.filter(row => row.domainId === 'dinleme-izleme');
  assert.equal(listening.every(row => row.requiresMedia), true);
  const nonverbal = GRADE8_TURKISH_FULL_SCOPE_MATRIX.find(row => row.outcomeCode === 'T.8.1.13');
  assert.equal(nonverbal.assessmentChannel, 'VIDEO');
});

test('41 mühendislik sorusu 25 kazanımı kapsar; tam ders hâlâ tamamlanmış sayılmaz', () => {
  assert.equal(GRADE8_TURKISH_PILOT01_COVERED_CODES.length, 8);
  assert.equal(GRADE8_TURKISH_PILOT02_CALIBRATION_CODES.length, 5);
  assert.equal(GRADE8_TURKISH_READING_LANGUAGE_WAVE1_CODES.length, 12);
  assert.equal(GRADE8_TURKISH_FULL_SCOPE_AUDIT.metrics.implementedOutcomeCount, 25);
  assert.equal(GRADE8_TURKISH_FULL_SCOPE_AUDIT.metrics.implementedItemCount, 41);
  assert.equal(GRADE8_TURKISH_FULL_SCOPE_AUDIT.metrics.uncoveredOutcomeCount, 51);
  assert.equal(GRADE8_TURKISH_FULL_SCOPE_AUDIT.metrics.productReady, false);
});
