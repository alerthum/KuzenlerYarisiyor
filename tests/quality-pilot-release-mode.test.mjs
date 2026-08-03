import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PREMIUM_GAME_IDS, premiumQuestionSummary } from '../js/content/premium-question-bank.js';
import { RUNTIME_CONFIG } from '../js/runtime-config.js';

test('premium geliştirme modu canlı yapılandırmada açıktır', () => {
  assert.equal(RUNTIME_CONFIG.features.qualityPilotMode, true);
});

test('premium geliştirme modunda yalnız kalite kapısından geçmiş yirmi yedi oyun görünür', () => {
  assert.deepEqual([...PREMIUM_GAME_IDS].sort(), [
    'ayt-focus',
    'english-cloze',
    'english-sentence-builder',
    'english-vocabulary',
    'error-detective',
    'forbidden-story',
    'geometry-lab',
    'kpss-focus',
    'lgs-focus',
    'lgs-foundation',
    'logic-station',
    'meaning-hunt',
    'olympiad-ladder',
    'paragraph-detective',
    'pattern-lab',
    'problem-hunter',
    'religion-practice',
    'science-lab',
    'science-reasoning',
    'social-citizenship',
    'social-map-skills',
    'social-time-travel',
    'speed-math',
    'target-number',
    'tyt-focus',
    'word-ladder',
    'word-mine'
  ]);
});

test('premium envanteri toplam 604 insan yazımı soru taşır', () => {
  const summary = premiumQuestionSummary();
  assert.equal(summary.questionCount, 604);
  assert.equal(summary.gameCount, 27);
  assert.equal(summary.allHaveThreeMisconceptions, true);
  assert.equal(summary.allTasksHaveDiagnosticRules, true);
  assert.equal(summary.choiceQuestionCount, 524);
  assert.equal(summary.premiumTaskCount, 80);
});

test('çocuk arayüzü premium oyun filtresi ve doğrudan başlatma koruması taşır', async () => {
  const app = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');
  assert.match(app, /USER_GAME_CATALOG/);
  assert.match(app, /isGameVisibleInCurrentRelease/);
  assert.match(app, /Bu oyun kalite pilotunda henüz yayınlanmadı/);
  assert.match(app, /PREMIUM_GAME_IDS/);
});
