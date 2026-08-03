import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GRADE8_TURKISH_READING_LANGUAGE_WAVE1_CODES,
  GRADE8_TURKISH_READING_LANGUAGE_WAVE1_IDS,
  auditGrade8TurkishReadingLanguageWave1Catalog,
  buildGrade8TurkishReadingLanguageWave1Questions,
  grade8TurkishReadingLanguageWave1Engine
} from '../../js/assessment-v2/turkish-g8-reading-language-wave1.js';
import { auditGrade8TurkishCalibrationQuestion } from '../../js/assessment-v2/turkish-g8-reading-calibration.js';
import { produceCanonicalQuestion } from '../../js/assessment-v2/question-production-pipeline.js';

const items = buildGrade8TurkishReadingLanguageWave1Questions();
const audit = auditGrade8TurkishReadingLanguageWave1Catalog(items);

test('okuma ve dil dalgası 12 farklı resmî kazanımı kapsar', () => {
  assert.equal(audit.ok, true, audit.errors.join('\n'));
  assert.equal(items.length, 12);
  assert.equal(new Set(GRADE8_TURKISH_READING_LANGUAGE_WAVE1_CODES).size, 12);
  assert.deepEqual(audit.metrics.answerDistribution, { A: 3, B: 3, C: 3, D: 3 });
});

test('12 sorunun tamamı kör şık, çoklu kanıt ve öğretici geri bildirim kapılarından geçer', () => {
  for (const item of items) {
    const row = auditGrade8TurkishCalibrationQuestion(item);
    assert.equal(row.ok, true, `${item.id}: ${row.errors.join(', ')}`);
    assert.equal(row.metrics.requiredEvidenceCount >= 3, true, item.id);
    assert.equal(row.metrics.partialDistractorCount, 3, item.id);
    assert.equal(row.metrics.blindOptionCueRisk, 0, item.id);
    assert.deepEqual(item.hints.map(hint => hint.level), [1, 2, 3]);
    assert.equal(item.optionFeedback.length, 4);
    assert.equal(item.optionFeedback.every(entry => entry.text.length >= 70), true, item.id);
  }
});

test('ana çözücü ile bağımsız doğrulayıcı 12 soruda birleşir', () => {
  for (const questionId of GRADE8_TURKISH_READING_LANGUAGE_WAVE1_IDS) {
    const result = produceCanonicalQuestion({ request: { grade: 8, courseId: 'turkce', questionId }, subjectEngine: grade8TurkishReadingLanguageWave1Engine });
    assert.equal(result.proof.independentlyVerified, true, questionId);
    assert.equal(result.proof.solved.optionId, result.canonical.answerKey.optionId, questionId);
    assert.notEqual(result.canonical.verifier.solverId, result.canonical.verifier.independentVerifierId);
  }
});

test('insan onayından önce oyun adaptasyonu kapalı kalır', () => {
  for (const item of items) {
    assert.equal(item.content.humanReview.status, 'NOT_MEASURED');
    assert.equal(item.content.humanReview.gameAdaptationAllowed, false);
    assert.equal(item.gameBindings.length, 0);
    assert.equal(item.contentStatus, 'HUMAN_REVIEW_REQUIRED');
  }
});

test('doğru seçeneğin kanıtı eksiltilince bağımsız doğrulama RED verir', () => {
  const item = structuredClone(items[0]);
  const correct = item.content.optionSemantics.find(entry => entry.correct);
  correct.support = correct.support.slice(0, 1);
  const row = auditGrade8TurkishCalibrationQuestion(item);
  assert.equal(row.ok, false);
  assert.equal(row.errors.includes('independent-verification-failed'), true);
});
