import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  normalizeAnalysisSample,
  normalizeLiveGeneratedSamples,
  formatSampleOptionsLine,
  renderLiveSampleCardHtml,
  summarizeGameProgress
} from '../js/quality/analysis-sample-contract.js';

const analysisRaw = await readFile(new URL('../public/question-engine-analysis.json', import.meta.url), 'utf8');
const analysis = JSON.parse(analysisRaw);
const platform = await readFile(new URL('../js/platform/firebase-platform.js', import.meta.url), 'utf8');
const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[char]));

test('1) options Array olduğunda render — seçenekler listelenir', () => {
  const sample = {
    game: 'pattern-lab',
    prompt: 'Örnek',
    options: ['10', '12', '14', '16'],
    correctAnswer: '14',
    familyId: 'f1',
    skeletonId: 's1',
    status: 'GOLD'
  };
  const normalized = normalizeAnalysisSample(sample);
  assert.equal(normalized.optionsStatus, 'AVAILABLE');
  assert.equal(normalized.questionKind, 'multiple-choice');
  const html = renderLiveSampleCardHtml(normalized, esc);
  assert.match(html, /10, 12, 14, 16/);
  assert.doesNotMatch(html, /INVALID_CONTRACT/);
});

test('2) options [] + questionKind expression — serbest cevap metni', () => {
  const sample = {
    game: 'target-number',
    prompt: 'Hedefe ulaş',
    questionKind: 'expression',
    options: [],
    optionsStatus: 'NOT_APPLICABLE',
    optionsNote: 'Serbest cevaplı soru — seçenek bulunmaz',
    correctAnswer: '(1+2)*3',
    familyId: 'target-sum-then-scale',
    skeletonId: 'sk',
    status: 'REVIEW'
  };
  const line = formatSampleOptionsLine(sample, esc);
  assert.match(line, /Serbest cevaplı soru/);
  const html = renderLiveSampleCardHtml(sample, esc);
  assert.match(html, /Serbest cevaplı soru/);
  assert.doesNotMatch(html, /\.map is not a function/);
});

test('3) options undefined — kontrollü görünüm (çökmez)', () => {
  const sample = { game: 'x', prompt: 'p', familyId: 'f', skeletonId: 's', status: 'REVIEW' };
  const normalized = normalizeAnalysisSample(sample);
  assert.ok(Array.isArray(normalized.options));
  assert.equal(normalized.optionsStatus, 'INVALID');
  const html = renderLiveSampleCardHtml(sample, esc);
  assert.match(html, /INVALID_CONTRACT|Seçenek/);
  assert.ok(html.includes('admin-entity-card'));
});

test('4) options string legacy — Array + NOT_APPLICABLE normalize', () => {
  const sample = {
    game: 'target-number',
    prompt: 'p',
    options: "Yok — kind:'expression' (öğrenci serbest ifade kurar)",
    kind: 'expression',
    familyId: 'target-sum-then-scale',
    skeletonId: 'sk',
    correctAnswer: '1+2',
    status: 'REVIEW'
  };
  const normalized = normalizeAnalysisSample(sample);
  assert.ok(Array.isArray(normalized.options));
  assert.equal(normalized.options.length, 0);
  assert.equal(normalized.questionKind, 'expression');
  assert.equal(normalized.optionsStatus, 'NOT_APPLICABLE');
  assert.equal(normalized.contractViolation?.code, 'LEGACY_STRING_OPTIONS');
  assert.match(formatSampleOptionsLine(normalized, esc), /Serbest cevaplı soru/);
});

test('5) options object — INVALID_CONTRACT + tip/kimlik bilgisi', () => {
  const sample = {
    game: 'speed-math',
    prompt: 'p',
    options: { a: 1 },
    familyId: 'fam-obj',
    skeletonId: 'sk-obj',
    status: 'REVIEW'
  };
  const normalized = normalizeAnalysisSample(sample);
  assert.deepEqual(normalized.options, []);
  assert.equal(normalized.optionsStatus, 'INVALID');
  assert.equal(normalized.contractViolation?.code, 'INVALID_CONTRACT');
  assert.equal(normalized.contractViolation?.receivedType, 'object');
  const line = formatSampleOptionsLine(normalized, esc);
  assert.match(line, /INVALID_CONTRACT/);
  assert.match(line, /speed-math/);
  assert.match(line, /fam-obj/);
  assert.match(line, /object/);
});

test('6) multiple-choice ve expression aynı listede render', () => {
  const samples = normalizeLiveGeneratedSamples([
    {
      game: 'pattern-lab',
      prompt: 'MC',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 'B',
      familyId: 'f-mc',
      skeletonId: 's-mc',
      status: 'GOLD'
    },
    {
      game: 'target-number',
      prompt: 'EXPR',
      questionKind: 'expression',
      options: [],
      optionsStatus: 'NOT_APPLICABLE',
      optionsNote: 'Serbest cevaplı soru — seçenek bulunmaz',
      correctAnswer: '1+2',
      familyId: 'f-ex',
      skeletonId: 's-ex',
      status: 'REVIEW'
    }
  ]);
  const html = samples.map((s) => renderLiveSampleCardHtml(s, esc)).join('');
  assert.match(html, /A, B, C, D/);
  assert.match(html, /Serbest cevaplı soru/);
  assert.match(html, /pattern-lab/);
  assert.match(html, /target-number/);
});

test('7) gerçek public/question-engine-analysis.json — options hiçbir yerde string değil; render PASS', () => {
  const samples = analysis.liveGeneratedQuestionSamples?.samples || [];
  assert.ok(samples.length >= 2);
  for (const sample of samples) {
    assert.ok(Array.isArray(sample.options), `${sample.game}/${sample.familyId}: options Array olmalı, gelen: ${typeof sample.options}`);
    if (sample.questionKind === 'expression' || sample.optionsStatus === 'NOT_APPLICABLE') {
      assert.equal(sample.options.length, 0);
      assert.ok(sample.optionsNote);
    }
  }
  assert.doesNotThrow(() => {
    for (const sample of samples) {
      const html = renderLiveSampleCardHtml(sample, esc);
      assert.ok(html.includes('admin-entity-card'));
      assert.ok(!html.includes('map is not a function'));
    }
  });
});

test('8) admin ekranı hiçbir örnekte çökmez (bozuk örnek kardeşleri bozmaz)', () => {
  const mixed = [
    { game: 'ok', prompt: 'p', options: ['1', '2'], correctAnswer: '1', familyId: 'a', skeletonId: 'b', status: 'GOLD' },
    { game: 'bad-string', prompt: 'p', options: 'legacy string', familyId: 'c', skeletonId: 'd', status: 'REVIEW' },
    { game: 'bad-object', prompt: 'p', options: { x: 1 }, familyId: 'e', skeletonId: 'f', status: 'REVIEW' },
    null,
    { game: 'expr', prompt: 'p', questionKind: 'expression', options: [], familyId: 'g', skeletonId: 'h', status: 'REVIEW' }
  ];
  assert.doesNotThrow(() => {
    const html = mixed.map((sample) => renderLiveSampleCardHtml(sample || {}, esc)).join('');
    assert.match(html, /ok/);
    assert.match(html, /Serbest cevaplı soru|INVALID_CONTRACT|legacy|Seçenek/);
  });
});

test('gameProgressMatrix.summary rows ile aynı tek kaynaktan (23 PASS / 0 WAITING / 23)', () => {
  const rows = analysis.gameProgressMatrix.rows;
  const derived = summarizeGameProgress(rows);
  assert.equal(derived.pass, 23);
  assert.equal(derived.waiting, 0);
  assert.equal(derived.totalGames, 23);
  assert.equal(analysis.gameProgressMatrix.summary.pass, derived.pass);
  assert.equal(analysis.gameProgressMatrix.summary.waiting, derived.waiting);
  assert.equal(analysis.gameProgressMatrix.summary.totalGames, derived.totalGames);
});

test('platform: analysis-sample-contract import + renderLiveSampleCardHtml kullanır; ham .map(options) yok', () => {
  assert.match(platform, /analysis-sample-contract\.js/);
  assert.match(platform, /renderLiveSampleCardHtml/);
  assert.match(platform, /normalizeAnalysisSample/);
  assert.match(platform, /summarizeGameProgress/);
  assert.doesNotMatch(platform, /\(sample\.options\|\|\[\]\)\.map/);
});
