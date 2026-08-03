import test from 'node:test';
import assert from 'node:assert/strict';
import { ALL_PHASE3_READING_MODELS } from '../../js/assessment-v2/reading-model-catalog.js';
import { auditReadingSurfaceModels } from '../../js/assessment-v2/reading-surface-quality.js';

test('paragraf yüzey kalite kapısı tür, ses, kök ve metin kalıbı çeşitliliğini zorunlu tutar', () => {
  const report = auditReadingSurfaceModels(ALL_PHASE3_READING_MODELS);
  assert.equal(report.ok, true, report.errors.join('\n'));
  assert.equal(report.metrics.modelCount, 12);
  assert.ok(report.metrics.genreCount >= 8);
  assert.ok(report.metrics.voiceCount >= 7);
  assert.ok(report.metrics.sourceModeCount >= 8);
  assert.ok(report.metrics.stemFamilyCount >= 10);
  assert.ok(report.metrics.dataHeavyCount <= 3);
  assert.ok(report.metrics.maxTrigramSimilarity <= 0.16);
  assert.ok(report.metrics.longestAnswerRate <= 0.58);
});

test('TYT düzeyi inceleme yüzeyinde her soru beş seçenek ve dört ayrı hata yolu taşır', () => {
  for (const model of ALL_PHASE3_READING_MODELS) {
    const task = model.generateTask({});
    assert.equal(task.options.length, 5, model.id);
    assert.equal(model.misconceptions.length, 4, model.id);
    assert.equal(new Set(model.misconceptions.map(row => row.id)).size, 4, model.id);
  }
});


test('reddedilmiş yapay taslaktan kalan ifade seçenek geri bildirimine bile sızamaz', () => {
  const base = ALL_PHASE3_READING_MODELS[0];
  const mutated = {
    ...base,
    id: `${base.id}-stale-feedback-mutation`,
    misconceptions: base.misconceptions.map((row, index) => index === 0
      ? { ...row, feedback: 'Okur mektuplarının sayısı bu sonucu kanıtlamaz.' }
      : row)
  };
  const report = auditReadingSurfaceModels([mutated, ...ALL_PHASE3_READING_MODELS.slice(1)]);
  assert.equal(report.ok, false);
  assert.ok(report.errors.some(error => error.includes('rejected-draft-leak:okur mektuplarının sayısı')));
});
