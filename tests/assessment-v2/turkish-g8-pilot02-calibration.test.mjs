import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GRADE8_TURKISH_PILOT02_CALIBRATION_IDS,
  auditGrade8TurkishPilot02CalibrationCatalog,
  buildGrade8TurkishPilot02CalibrationQuestions,
  grade8TurkishPilot02CalibrationEngine
} from '../../js/assessment-v2/turkish-g8-pilot02-calibration.js';
import { produceCanonicalQuestion } from '../../js/assessment-v2/question-production-pipeline.js';
import { auditGrade8TurkishCalibrationQuestion } from '../../js/assessment-v2/turkish-g8-reading-calibration.js';
import { grade8TurkishOutcomeByCode } from '../../js/curriculum/outcomes/tr-g8-turkce-2019.js';

const items = buildGrade8TurkishPilot02CalibrationQuestions();
const audit = auditGrade8TurkishPilot02CalibrationCatalog(items);

test('Pilot-02 ilk kalibrasyon grubu beş farklı eksik kazanımı kapsar', () => {
  assert.equal(audit.ok, true, audit.errors.join('\n'));
  assert.equal(items.length, 5);
  const codes = items.map(item => {
    const outcomeId = item.curriculum.outcomeIds[0];
    return ['T.8.3.6', 'T.8.3.7', 'T.8.3.11', 'T.8.3.21', 'T.8.3.26']
      .find(code => grade8TurkishOutcomeByCode(code)?.id === outcomeId);
  });
  assert.deepEqual(codes, ['T.8.3.6', 'T.8.3.7', 'T.8.3.11', 'T.8.3.21', 'T.8.3.26']);
});

test('beş sorunun tamamı çoklu kanıt ve kör şık kapısından geçer', () => {
  for (const item of items) {
    const row = auditGrade8TurkishCalibrationQuestion(item);
    assert.equal(row.ok, true, `${item.id}: ${row.errors.join(', ')}`);
    assert.equal(row.metrics.requiredEvidenceCount >= 3, true);
    assert.equal(row.metrics.partialDistractorCount, 3);
    assert.equal(row.metrics.blindOptionCueRisk, 0);
  }
});

test('çözücü ve bağımsız doğrulayıcı doğru cevapta birleşir', () => {
  for (const questionId of GRADE8_TURKISH_PILOT02_CALIBRATION_IDS) {
    const result = produceCanonicalQuestion({
      request: { grade: 8, courseId: 'turkce', questionId },
      subjectEngine: grade8TurkishPilot02CalibrationEngine
    });
    assert.equal(result.proof.independentlyVerified, true);
    assert.equal(result.proof.solved.optionId, result.canonical.answerKey.optionId);
    assert.notEqual(result.canonical.verifier.solverId, result.canonical.verifier.independentVerifierId);
  }
});

test('her soru üç ipucu ve dört öğretici seçenek açıklaması taşır', () => {
  for (const item of items) {
    assert.deepEqual(item.hints.map(hint => hint.level), [1, 2, 3]);
    assert.equal(item.optionFeedback.length, 4);
    assert.equal(item.optionFeedback.every(entry => entry.text.length >= 70), true);
    assert.equal(new Set(item.optionFeedback.filter(entry => !entry.correct).map(entry => entry.misconceptionId)).size, 3);
  }
});

test('uydurma yazar alıntısı kullanılmaz ve insan onayından önce oyun adaptasyonu kapalıdır', () => {
  for (const item of items) {
    assert.equal(item.provenance.copiedText, false);
    assert.equal(item.content.humanReview.status, 'NOT_MEASURED');
    assert.equal(item.content.humanReview.gameAdaptationAllowed, false);
    assert.equal(item.gameBindings.length, 0);
    assert.equal(item.contentStatus, 'HUMAN_REVIEW_REQUIRED');
  }
});

test('doğru seçenek anlamsal olarak bozulursa kalite kapısı RED verir', () => {
  const item = structuredClone(items[0]);
  const correct = item.content.optionSemantics.find(entry => entry.correct);
  correct.support = correct.support.slice(0, 1);
  const row = auditGrade8TurkishCalibrationQuestion(item);
  assert.equal(row.ok, false);
  assert.equal(row.errors.includes('independent-verification-failed'), true);
});
