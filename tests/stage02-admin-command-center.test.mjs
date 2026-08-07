import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const platform = await readFile(new URL('../js/platform/firebase-platform.js', import.meta.url), 'utf8');
const analysisRaw = await readFile(new URL('../public/question-engine-analysis.json', import.meta.url), 'utf8');

test('admin panelinde ayrı bir Soru Motoru Komuta Merkezi sekmesi tanımlı', () => {
  assert.match(platform, /\['question-engine','Soru Motoru Komuta Merkezi'/);
  assert.match(platform, /'question-engine':\s*\(\)\s*=>\s*questionEngineCommandCenterModule/);
  assert.match(platform, /function questionEngineCommandCenterModule\(/);
});

test('komuta merkezi modülü canlı analiz dosyasını fetch ile okur ve veri yoksa "Veri yok" gösterir', () => {
  assert.match(platform, /function loadQuestionEngineAnalysis/);
  assert.match(platform, /fetch\('\/public\/question-engine-analysis\.json'/);
  assert.match(platform, /Veri yok/);
});

test('komuta merkezi sade patron görünümünün zorunlu göstergelerini render eder', () => {
  const requiredFragments = [
    'Gerçek ürün durumu',
    'ÜRÜN DURUMU',
    'YAYINA KAPALI',
    'İnsan inceleme ilerlemesi',
    'Tam güvenli oyun',
    'İnsan onaylı soru',
    'Oyuna uyarlanan',
    'Şu anda yapılan iş',
    'Son gerçek test',
    'Sıradaki kesin adım',
    'Açık ürün sorunları',
    'ChatGPT İçin JSON Kopyala'
  ];
  for (const fragment of requiredFragments) {
    assert.ok(platform.includes(fragment), `Komuta merkezinde eksik sade gösterge: ${fragment}`);
  }
});

test('public/question-engine-analysis.json geçerli JSON ve Aşama 02 asgari alanlarını içerir', () => {
  const analysis = JSON.parse(analysisRaw);
  assert.ok(analysis.currentAutonomousStage, 'currentAutonomousStage eksik');
  assert.ok(analysis.lastAutomatedAction, 'lastAutomatedAction eksik');
  assert.ok(analysis.blockers, 'blockers eksik');
  assert.ok(analysis.difficultyCompliance, 'difficultyCompliance eksik');
  assert.ok(analysis.optionQuality, 'optionQuality eksik');
  assert.ok(analysis.semanticRepeat, 'semanticRepeat eksik');
  assert.ok(analysis.familyStatus, 'familyStatus eksik');
  assert.ok(analysis.realCapacityByGradeSubjectGame, 'realCapacityByGradeSubjectGame eksik');
  assert.ok('sixtySessionSimulation' in analysis, 'sixtySessionSimulation eksik');
  assert.ok('liveGeneratedQuestionSamples' in analysis, 'liveGeneratedQuestionSamples eksik');
  assert.ok('misconceptionRationalePerWrongOption' in analysis, 'misconceptionRationalePerWrongOption eksik');
  assert.ok(Array.isArray(analysis.lastTestCommandsAndResults), 'lastTestCommandsAndResults dizi olmalı');
});

test('analiz dosyası ölçülmemiş metrikler için uydurma pozitif değer içermez', () => {
  const analysis = JSON.parse(analysisRaw);
  assert.equal(analysis.overallQualityScorePercent, null, 'genel puan henüz ölçülmeden dolu olamaz');
  assert.match(String(analysis.optionQuality.irrelevantOptionCount), /Veri yok/);
});
