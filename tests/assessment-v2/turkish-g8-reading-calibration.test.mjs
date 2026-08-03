import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GRADE8_TURKISH_CALIBRATION_IDS,
  auditGrade8TurkishCalibrationCatalog,
  auditGrade8TurkishCalibrationQuestion,
  buildGrade8TurkishCalibrationQuestions,
  grade8TurkishCalibrationEngine
} from '../../js/assessment-v2/turkish-g8-reading-calibration.js';
import { bindQuestionToGame, produceCanonicalQuestion } from '../../js/assessment-v2/question-production-pipeline.js';
import { defineGameAdapter } from '../../js/assessment-v2/game-adapter-contract.js';

const items = buildGrade8TurkishCalibrationQuestions();

test('kalibrasyon paketi 5 farklı resmî kazanıma bağlı 5 kanonik soru üretir', () => {
  assert.equal(items.length, 5);
  assert.equal(new Set(items.flatMap(item => item.curriculum.outcomeIds)).size, 5);
  assert.equal(items.every(item => item.curriculum.grade === 8 && item.curriculum.courseId === 'turkce'), true);
  assert.equal(items.every(item => item.contentStatus === 'HUMAN_REVIEW_REQUIRED'), true);
  assert.equal(items.every(item => item.content.humanReview.gameAdaptationAllowed === false), true);
});

test('her soru tek cümle ipucunu engeller ve çoklu kanıt sentezi ister', () => {
  for (const item of items) {
    const audit = auditGrade8TurkishCalibrationQuestion(item);
    assert.equal(audit.ok, true, `${item.id}: ${audit.errors.join(', ')}`);
    assert.equal(audit.metrics.requiredEvidenceCount >= 2, true);
    assert.equal(audit.metrics.partialDistractorCount >= 2, true);
    assert.equal(audit.metrics.semanticFieldCount, 1);
    assert.equal(audit.metrics.maxSingleSentenceAnswerOverlap <= 0.72, true);
    assert.equal(audit.metrics.blindOptionCueRisk, 0);
  }
});

test('ders motoru her soruyu ayrı semantik puanlama ile çözüp farklı kısıt kesişimiyle doğrular', () => {
  for (const questionId of GRADE8_TURKISH_CALIBRATION_IDS) {
    const result = produceCanonicalQuestion({
      request: { grade: 8, courseId: 'turkce', questionId },
      subjectEngine: grade8TurkishCalibrationEngine
    });
    assert.equal(result.proof.independentlyVerified, true);
    assert.equal(result.proof.solved.optionId, result.canonical.answerKey.optionId);
    assert.equal(result.canonical.verifier.solverId === result.canonical.verifier.independentVerifierId, false);
  }
});

test('her yanlış seçenek gerçek hata yolu ve öğretici geri bildirim taşır', () => {
  for (const item of items) {
    assert.equal(item.optionFeedback.length, 4);
    const wrong = item.optionFeedback.filter(entry => !entry.correct);
    assert.equal(wrong.length, 3);
    assert.equal(new Set(wrong.map(entry => entry.misconceptionId)).size, 3);
    assert.equal(wrong.every(entry => entry.text.length > 45), true);
    assert.equal(wrong.filter(entry => entry.supportingEvidenceIds.length > 0).length >= 2, true);
  }
});

test('ipuçları çözümü bir anda söylemeden kanıtları aşamalı daraltır', () => {
  for (const item of items) {
    assert.equal(item.hints.length, 3);
    assert.deepEqual(item.hints.map(entry => entry.level), [1, 2, 3]);
    assert.equal(item.hints.every(entry => entry.revealsAnswer === false), true);
    assert.equal(new Set(item.hints.map(entry => entry.text)).size, 3);
  }
});

test('katalog tür, kaynak biçimi, kazanım ve cevap konumu bakımından tek kalıba düşmez', () => {
  const audit = auditGrade8TurkishCalibrationCatalog(items);
  assert.equal(audit.ok, true, audit.errors.join(', '));
  assert.deepEqual(audit.metrics, {
    itemCount: 5,
    outcomeCount: 5,
    genreCount: 5,
    sourceModeCount: 5,
    answerPositionCount: 3,
    humanReviewStatus: 'NOT_MEASURED',
    productReady: false
  });
});

test('yalnız seçeneklere bakılarak doğruyu ele veren retorik yapı reddedilir', () => {
  const item = structuredClone(items[3]);
  const correct = item.content.options.find(entry => entry.id === item.answerKey.optionId);
  correct.text = 'Ancak verilenler, uygulamanın bütün kullanıcılarda aynı sonucu oluşturduğunu kanıtlamak için tek başına yeterli değildir.';
  for (const distractor of item.content.options.filter(entry => entry.id !== item.answerKey.optionId)) {
    distractor.text = 'Reklamdaki bilgiler uygulamanın kullanıcılar üzerindeki etkisini açık biçimde ortaya koymaktadır.';
  }
  const audit = auditGrade8TurkishCalibrationQuestion(item);
  assert.equal(audit.ok, false);
  assert.equal(audit.errors.includes('option-only-rhetorical-giveaway'), true);
});

test('doğru seçeneğin tek kanıta düşürülmesi mutasyon kapısını kırar', () => {
  const item = structuredClone(items[0]);
  const correct = item.content.optionSemantics.find(entry => entry.correct);
  correct.support = [correct.support[0]];
  const audit = auditGrade8TurkishCalibrationQuestion(item);
  assert.equal(audit.ok, false);
  assert.equal(audit.errors.includes('independent-verification-failed'), true);
});

test('ikinci doğru seçenek oluşturulması bağımsız doğrulamayı ve kalite kapısını düşürür', () => {
  const item = structuredClone(items[1]);
  const correct = item.content.optionSemantics.find(entry => entry.correct);
  const distractor = item.content.optionSemantics.find(entry => !entry.correct);
  distractor.claimFit = 'full';
  distractor.scope = 'preserved';
  distractor.contradictions = [];
  distractor.support = [...correct.support];
  const audit = auditGrade8TurkishCalibrationQuestion(item);
  assert.equal(audit.ok, false);
  assert.equal(audit.errors.includes('independent-verification-failed'), true);
});


test('insan kalibrasyonu tamamlanmamış soru oyun adaptörüne geçirilemez', () => {
  const adapter = defineGameAdapter({
    id: 'locked-calibration-adapter-test',
    gameId: 'paragraph-detective',
    supportedItemFormats: ['single-choice'],
    supports: () => true,
    adapt: item => ({ gamePayload: { question: item.content.stem } }),
    reverseCheck: () => ({ ok: true })
  });
  assert.throws(
    () => bindQuestionToGame({ canonicalQuestion: items[0], gameAdapter: adapter }),
    /locked until human calibration approval/
  );
});
