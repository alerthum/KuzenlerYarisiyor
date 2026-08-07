import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const platform = await readFile(new URL('../js/platform/firebase-platform.js', import.meta.url), 'utf8');
const analysisRaw = await readFile(new URL('../public/question-engine-analysis.json', import.meta.url), 'utf8');
const analysis = JSON.parse(analysisRaw);

test('teknik komuta merkezi ayrıntıları sade ekranın altında kapalı bölümlerde korunur', () => {
  const requiredFragments = [
    'Canlı çalışma ayrıntısını göster',
    'Müfredat ve soru portföyü ayrıntısını göster',
    'Teknik kalite ayrıntılarını göster',
    'Oyun İlerleme Matrisi',
    'Semantik Kalite Matrisi'
  ];
  for (const fragment of requiredFragments) {
    assert.ok(platform.includes(fragment), `Komuta merkezinde eksik ayrıntı: ${fragment}`);
  }
});

test('gameProgressMatrix: pattern-lab, speed-math ve target-number PASS, gerçek 12/12 aile ve 48/48 iskelet ile işaretli; uydurma satır yok', () => {
  const rows = analysis.gameProgressMatrix?.rows;
  assert.ok(Array.isArray(rows) && rows.length >= 6, 'gameProgressMatrix.rows eksik veya çok kısa');
  const patternLab = rows.find((r) => r.game === 'pattern-lab');
  const speedMath = rows.find((r) => r.game === 'speed-math');
  const targetNumber = rows.find((r) => r.game === 'target-number');
  assert.equal(patternLab.status, 'PASS');
  assert.equal(patternLab.completedFamilies, 12);
  assert.equal(patternLab.verifiedSkeletons, 48);
  assert.equal(speedMath.status, 'PASS');
  assert.equal(speedMath.completedFamilies, 12);
  assert.equal(speedMath.verifiedSkeletons, 48);
  assert.equal(targetNumber.status, 'PASS');
  assert.equal(targetNumber.completedFamilies, 12);
  assert.equal(targetNumber.verifiedSkeletons, 48);
  const geometryLab = rows.find((r) => r.game === 'geometry-lab');
  assert.equal(geometryLab.status, 'PASS');
  assert.equal(geometryLab.completedFamilies, 12);
  assert.equal(geometryLab.verifiedSkeletons, 48);
  const problemHunter = rows.find((r) => r.game === 'problem-hunter');
  assert.equal(problemHunter.status, 'PASS');
  assert.equal(problemHunter.completedFamilies, 12);
  assert.equal(problemHunter.verifiedSkeletons, 48);
  const errorDetective = rows.find((r) => r.game === 'error-detective');
  assert.equal(errorDetective.status, 'PASS');
  assert.equal(errorDetective.completedFamilies, 12);
  assert.equal(errorDetective.verifiedSkeletons, 48);
});

test('stage06OptionQualityInfra: 13 alanın tamamı NOT_MEASURED_YET (uydurma pozitif değer yok)', () => {
  const infra = analysis.stage06OptionQualityInfra;
  const requiredKeys = [
    'irrelevantOptionCount', 'absurdOptionCount', 'uniqueNegativeOptionCount', 'grammarShapeMismatchCount',
    'optionLengthCueCount', 'correctOptionVerbosityCueCount', 'semanticCategoryMismatchCount',
    'readAllOptionsFailureCount', 'blindOptionClassifierAccuracy', 'misconceptionCoverage',
    'strongDistractorCount', 'weakDistractorCount', 'optionQualityScore'
  ];
  for (const key of requiredKeys) {
    assert.equal(infra[key], 'NOT_MEASURED_YET', `${key} NOT_MEASURED_YET olmalı, henüz Aşama 06 başlamadı`);
  }
});

test('stageProgressView: 15 aşamanın tamamı listelenir ve Aşama 1-4 PASS görünür', () => {
  const stages = analysis.stageProgressView?.stages;
  assert.ok(Array.isArray(stages) && stages.length === 15, 'tam olarak 15 aşama listelenmeli');
  for (const id of [1, 2, 3, 4]) {
    const stage = stages.find((s) => s.id === id);
    assert.equal(stage.status, 'PASS');
    assert.equal(stage.percentComplete, 100);
  }
});

test('blockerView: hiçbir blocker CRITICAL değil ve B-006 RESOLVED', () => {
  const blockers = analysis.blockerView?.blockers;
  assert.ok(Array.isArray(blockers) && blockers.length >= 6);
  assert.ok(blockers.every((b) => b.severity !== 'CRITICAL'), 'CRITICAL blocker kalmamış olmalı');
  const b006 = blockers.find((b) => b.id === 'B-006');
  assert.equal(b006.status, 'RESOLVED');
});

test('testCostAndQuota: yalnız gerçekten çalıştırılan komutlar var, kota/token tahmini uydurulmamış', () => {
  const cost = analysis.testCostAndQuota;
  assert.ok(cost.lastFullRegression?.command.startsWith('npm run check'));
  assert.ok(Number.isFinite(cost.fullRegressionRunCountThisStage));
  assert.ok(Array.isArray(cost.fullRegressionRunLog));
  assert.ok(!('estimatedTokens' in cost), 'token tahmini uydurulmamalı');
});

test('liveGeneratedQuestionSamples.samples: options her zaman Array; expression NOT_APPLICABLE; kimlik alanları dolu', () => {
  const samples = analysis.liveGeneratedQuestionSamples?.samples;
  assert.ok(Array.isArray(samples) && samples.length >= 2);
  for (const sample of samples) {
    assert.ok(sample.familyId && sample.skeletonId && sample.reasoningPathId);
    assert.ok(Array.isArray(sample.options), `${sample.game}: options Array olmalı`);
    if (sample.questionKind === 'expression' || sample.optionsStatus === 'NOT_APPLICABLE') {
      assert.equal(sample.options.length, 0);
      assert.ok(typeof sample.correctAnswer === 'string');
      assert.ok(sample.optionsNote);
    } else if (sample.options.length > 0) {
      assert.ok(sample.options.includes(sample.correctAnswer));
    }
  }
});

test('gameProgressMatrix.summary: 23 PASS / 0 WAITING / 23 total (rows ile uyumlu)', () => {
  const rows = analysis.gameProgressMatrix.rows;
  const summary = analysis.gameProgressMatrix.summary;
  const pass = rows.filter((r) => r.status === 'PASS').length;
  const waiting = rows.filter((r) => r.status === 'WAITING').length;
  assert.equal(pass, 23);
  assert.equal(waiting, 0);
  assert.equal(rows.length, 23);
  assert.equal(summary.pass, pass);
  assert.equal(summary.waiting, waiting);
  assert.equal(summary.totalGames, 23);
  const wordMine = rows.find((r) => r.game === 'word-mine');
  assert.equal(wordMine.status, 'PASS');
  assert.equal(wordMine.completedFamilies, 12);
  assert.equal(wordMine.verifiedSkeletons, 48);
});
