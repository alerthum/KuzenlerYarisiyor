import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../js/platform/firebase-platform.js', import.meta.url), 'utf8');

test('admin analiz modülü Map türündeki metrik koleksiyonunu kabul eder', () => {
  assert.match(source, /metrics instanceof Map/);
  assert.doesNotMatch(source, /new Map\(metrics\.map\(/);
});

test('admin modülleri seçilmeden topluca render edilmez', () => {
  assert.match(source, /const renderers=\{/);
  assert.match(source, /const renderSelected = renderers\[adminSection\]/);
  assert.doesNotMatch(source, /const modules=\{\s*overview:adminOverview/);
});

test('tek modül hatası tüm yetişkin portalını çökertmez', () => {
  assert.match(source, /try \{\s*moduleHtml = renderSelected\(\)/);
  assert.match(source, /Genel bakışa dön/);
});
