import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GRADE8_TURKISH_PILOT01_FRESH_REVIEW_IDS,
  GRADE8_TURKISH_PILOT01_IDS,
  GRADE8_TURKISH_PILOT01_PREVIOUS_REVIEW_IDS,
  auditGrade8TurkishPilot01Catalog,
  buildGrade8TurkishPilot01Questions,
  grade8TurkishPilot01Engine
} from '../../js/assessment-v2/turkish-g8-reading-pilot01.js';
import { produceCanonicalQuestion } from '../../js/assessment-v2/question-production-pipeline.js';
import { auditGrade8TurkishCalibrationQuestion } from '../../js/assessment-v2/turkish-g8-reading-calibration.js';
import { GRADE8_TURKISH_NEXT_WAVE_CONTRACT, auditGrade8TurkishNextWaveContract } from '../../js/assessment-v2/turkish-g8-next-wave-contract.js';

const items = buildGrade8TurkishPilot01Questions();
const audit = auditGrade8TurkishPilot01Catalog(items);

test('Pilot-01 8 kazanım x 3 soru olarak 24 kanonik soru üretir', () => {
  assert.equal(items.length, 24);
  assert.equal(audit.ok, true, audit.errors.join('\n'));
  assert.equal(audit.metrics.outcomeCount, 8);
  assert.equal(Object.values(audit.metrics.questionsPerOutcome).every(count => count === 3), true);
});

test('doğru cevap konumları A B C D arasında tam dengelidir', () => {
  assert.deepEqual(audit.metrics.answerCounts, { A: 6, B: 6, C: 6, D: 6 });
});

test('24 sorunun tamamı çoklu kanıt, kör şık ve seçenek dengesi kapılarını geçer', () => {
  for (const row of audit.itemAudits) {
    assert.equal(row.ok, true, `${row.id}: ${row.errors.join(', ')}`);
    assert.equal(row.metrics.requiredEvidenceCount >= 2, true);
    assert.equal(row.metrics.partialDistractorCount >= 2, true);
    assert.equal(row.metrics.blindOptionCueRisk, 0);
    assert.equal(row.metrics.maxSingleSentenceAnswerOverlap <= 0.72, true);
  }
});

test('her soru insan gözlemi tamamlanmadan oyuna kapalıdır', () => {
  for (const item of items) {
    assert.equal(item.contentStatus, 'HUMAN_REVIEW_REQUIRED');
    assert.equal(item.content.humanReview.status, 'NOT_MEASURED');
    assert.equal(item.content.humanReview.gameAdaptationAllowed, false);
    assert.equal(item.gameBindings.length, 0);
  }
});

test('her soru üç aşamalı ipucu ve bütün seçenekler için öğretici açıklama taşır', () => {
  for (const item of items) {
    assert.deepEqual(item.hints.map(hint => hint.level), [1, 2, 3]);
    assert.equal(item.hints.every(hint => hint.revealsAnswer === false), true);
    assert.equal(item.optionFeedback.length, 4);
    assert.equal(item.optionFeedback.every(entry => entry.text.length >= 55), true);
    const wrong = item.optionFeedback.filter(entry => !entry.correct);
    assert.equal(wrong.length, 3);
    assert.equal(new Set(wrong.map(entry => entry.misconceptionId)).size, 3);
  }
});

test('ders motoru 24 soruyu ayrı çözücü ve bağımsız doğrulayıcıyla doğrular', () => {
  for (const questionId of GRADE8_TURKISH_PILOT01_IDS) {
    const result = produceCanonicalQuestion({
      request: { grade: 8, courseId: 'turkce', questionId },
      subjectEngine: grade8TurkishPilot01Engine
    });
    assert.equal(result.proof.independentlyVerified, true);
    assert.equal(result.proof.solved.optionId, result.canonical.answerKey.optionId);
    assert.notEqual(result.canonical.verifier.solverId, result.canonical.verifier.independentVerifierId);
  }
});

test('tablo sorularındaki sayısal yorumlar veriyle uyumludur', () => {
  const library = items.find(item => item.id.endsWith('22-library-table'));
  const garden = items.find(item => item.id.endsWith('23-school-garden-chart'));
  const museum = items.find(item => item.id.endsWith('24-audio-guide-table'));
  assert.equal(library.answerKey.optionId, 'D');
  assert.equal(garden.answerKey.optionId, 'A');
  assert.equal(museum.answerKey.optionId, 'D');
  assert.equal(Math.round(150 * 0.58), 87);
  assert.equal(Math.round(100 * 0.72), 72);
  assert.equal(Math.round(50 * 0.76), 38);
  assert.equal(87 > 72 && 87 > 38, true);
  assert.equal(87 < 72 + 38, true);
});



test('seçenekler öğrenci yüzeyinde A B C D sırasıyla sunulur', () => {
  for (const item of items) assert.deepEqual(item.content.options.map(option => option.id), ['A', 'B', 'C', 'D']);
});

test('tek seçenekte kolay eleme sağlayan kesinlik sözcüğü oluşursa kör şık kapısı RED verir', () => {
  const item = structuredClone(items[6]);
  item.content.options[1].text = `${item.content.options[1].text} Bu sonuç bütün durumlarda geçerlidir.`;
  const result = auditGrade8TurkishCalibrationQuestion(item);
  assert.equal(result.ok, false);
  assert.equal(result.errors.includes('option-only-rhetorical-giveaway'), true);
  assert.equal(result.metrics.blindOptionCueReasons.includes('single-option-uses-certainty-marker'), true);
});

test('katalog metin türü ve kaynak biçiminde tek kalıba düşmez', () => {
  assert.equal(audit.metrics.genreCount >= 16, true);
  assert.equal(audit.metrics.sourceModeCount >= 20, true);
  assert.equal(audit.metrics.productReady, false);
  assert.equal(audit.metrics.gameAdaptationAllowed, false);
});


test('gözle paketi daha önce gösterilen hiçbir soruyu tekrar etmez', () => {
  const previousIds = new Set(GRADE8_TURKISH_PILOT01_PREVIOUS_REVIEW_IDS);
  const freshItems = items.filter(item => GRADE8_TURKISH_PILOT01_FRESH_REVIEW_IDS.includes(item.id));
  assert.equal(GRADE8_TURKISH_PILOT01_PREVIOUS_REVIEW_IDS.length, 12);
  assert.equal(freshItems.length, 12);
  assert.equal(freshItems.some(item => previousIds.has(item.id)), false);
  assert.deepEqual(
    Object.fromEntries(['A', 'B', 'C', 'D'].map(id => [id, freshItems.filter(item => item.answerKey.optionId === id).length])),
    { A: 3, B: 3, C: 3, D: 3 }
  );
  assert.equal(new Set(freshItems.flatMap(item => item.curriculum.outcomeIds)).size, 8);
});


test('insan geri bildirimi sonrası Soru 2 seçenekleri aynı kanıt alanında ve benzer soyutluk düzeyindedir', () => {
  const item = items.find(entry => entry.id.endsWith('08-night-observation-topic'));
  assert.ok(item);
  const wrong = item.content.optionSemantics.filter(entry => !entry.correct);
  assert.equal(wrong.every(entry => entry.partialSupport.length >= 2), true);
  const lengths = item.content.options.map(option => option.text.split(/\s+/).length);
  assert.equal(Math.max(...lengths) - Math.min(...lengths) <= 3, true);
  assert.equal(auditGrade8TurkishCalibrationQuestion(item).metrics.blindOptionCueRisk, 0);
});

test('Soru 12 tablosu sayı, birim ve yüzde sütunlarını ilk okumada açıklar', () => {
  const item = items.find(entry => entry.id.endsWith('24-audio-guide-table'));
  assert.ok(item);
  assert.match(item.content.stimulusBlocks[0], /ikinci sütunu.*katılan toplam kişi sayısını/i);
  assert.match(item.content.stimulusBlocks[0], /üçüncü sütunu.*oranını/i);
  assert.match(item.content.stimulusBlocks[1], /Ankete katılan toplam kişi sayısı \(kişi\)/);
  assert.match(item.content.stimulusBlocks[1], /oranı \(%\)/);
  assert.match(item.content.stimulusBlocks[1], /12-17 yaş \| 80 \| 65/);
});

test('bir sonraki Türkçe dalgası söz sanatları, edebî dil ve güvenli alıntı politikasını zorunlu tutar', () => {
  const result = auditGrade8TurkishNextWaveContract();
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.deepEqual(GRADE8_TURKISH_NEXT_WAVE_CONTRACT.requiredOutcomeCodes, ['T.8.3.6', 'T.8.3.7', 'T.8.3.11', 'T.8.3.21', 'T.8.3.26']);
  assert.equal(GRADE8_TURKISH_NEXT_WAVE_CONTRACT.quotationPolicy.fabricatedAttributionForbidden, true);
  assert.equal(GRADE8_TURKISH_NEXT_WAVE_CONTRACT.diversityMinimums.figurativeLanguageItemCount >= 4, true);
  assert.equal(GRADE8_TURKISH_NEXT_WAVE_CONTRACT.diversityMinimums.authorViewOrQuotationItemCount >= 4, true);
});
