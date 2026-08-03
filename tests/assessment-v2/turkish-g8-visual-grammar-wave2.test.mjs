import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GRADE8_TURKISH_VISUAL_GRAMMAR_WAVE2_CODES,
  GRADE8_TURKISH_VISUAL_GRAMMAR_WAVE2_IDS,
  auditGrade8TurkishVisualGrammarWave2Catalog,
  buildGrade8TurkishVisualGrammarWave2Questions,
  grade8TurkishVisualGrammarWave2Engine
} from '../../js/assessment-v2/turkish-g8-visual-grammar-wave2.js';
import { auditGrade8TurkishCalibrationQuestion } from '../../js/assessment-v2/turkish-g8-reading-calibration.js';
import { produceCanonicalQuestion } from '../../js/assessment-v2/question-production-pipeline.js';
import { grade8TurkishReadingLanguageWave1QuestionById } from '../../js/assessment-v2/turkish-g8-reading-language-wave1.js';

const items = buildGrade8TurkishVisualGrammarWave2Questions();
const audit = auditGrade8TurkishVisualGrammarWave2Catalog(items);

test('görsel ve dil bilgisi dalgası 10 yeni soruyla 6 kazanımı kapsar', () => {
  assert.equal(audit.ok, true, audit.errors.join('\n'));
  assert.equal(items.length, 10);
  assert.equal(new Set(GRADE8_TURKISH_VISUAL_GRAMMAR_WAVE2_CODES).size, 6);
  assert.deepEqual(audit.metrics.answerDistribution, { A: 3, B: 3, C: 2, D: 2 });
});

test('10 soru kör şık, çoklu kanıt ve öğretici geri bildirim kapılarından geçer', () => {
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

test('ana çözücü ile bağımsız doğrulayıcı 10 soruda birleşir', () => {
  for (const questionId of GRADE8_TURKISH_VISUAL_GRAMMAR_WAVE2_IDS) {
    const result = produceCanonicalQuestion({ request: { grade: 8, courseId: 'turkce', questionId }, subjectEngine: grade8TurkishVisualGrammarWave2Engine });
    assert.equal(result.proof.independentlyVerified, true, questionId);
    assert.equal(result.proof.solved.optionId, result.canonical.answerKey.optionId, questionId);
    assert.notEqual(result.canonical.verifier.solverId, result.canonical.verifier.independentVerifierId);
  }
});

test('görsel paketleri açıklamalı ve oyun adaptasyonuna kapalı kalır', () => {
  for (const item of items) {
    assert.equal(Boolean(item.content.stimulus || item.content.stimulusBlocks?.length), true, item.id);
    assert.equal(item.content.humanReview.status, 'NOT_MEASURED');
    assert.equal(item.content.humanReview.gameAdaptationAllowed, false);
    assert.equal(item.gameBindings.length, 0);
    assert.equal(item.contentStatus, 'HUMAN_REVIEW_REQUIRED');
  }
});

test('Soru 9 insan geri bildirimiyle küçük izler kavramını metin içinde açıkça bağlar', () => {
  const item = grade8TurkishReadingLanguageWave1QuestionById('tr-g8-wave1-09-emphasis-design');
  const stimulus = item.content.stimulusBlocks.join(' ');
  assert.match(stimulus, /küçük izler/);
  assert.match(stimulus, /Bu izler önemsiz görüldüğünde/);
  assert.match(stimulus, /kentin gündelik yaşamına ait tanıklıklar/);
});

test('doğru seçeneğin kanıtı eksiltilince bağımsız doğrulama RED verir', () => {
  const item = structuredClone(items[0]);
  const correct = item.content.optionSemantics.find(entry => entry.correct);
  correct.support = correct.support.slice(0, 1);
  const row = auditGrade8TurkishCalibrationQuestion(item);
  assert.equal(row.ok, false);
  assert.equal(row.errors.includes('independent-verification-failed'), true);
});
