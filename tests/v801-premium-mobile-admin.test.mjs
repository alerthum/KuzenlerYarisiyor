import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');
const platform = await readFile(new URL('../js/platform/firebase-platform.js', import.meta.url), 'utf8');
const css = await readFile(new URL('../css/styles.css', import.meta.url), 'utf8');

test('mobil alt menü beş öğeyi tek satırda tutar', () => {
  assert.match(css, /grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
  assert.match(css, /\.bottom-nav\{[^}]*overflow:visible!important/);
});

test('kullanıcı işlemlerinde tarayıcı prompt alert confirm kullanılmaz', () => {
  assert.doesNotMatch(platform, /\b(prompt|alert|confirm)\s*\(/);
  assert.doesNotMatch(app, /window\.(prompt|alert|confirm)\s*\(/);
  assert.match(platform, /openAdminModal/);
  assert.match(app, /askUserConfirm/);
});

test('admin paneli ayrı modüllü premium menü ve analiz içerir', () => {
  assert.match(platform, /admin-command-center/);
  assert.match(platform, /admin-menu-toggle/);
  assert.match(platform, /Okul karşılaştırması/);
  assert.match(platform, /Sınıf karşılaştırması/);
  assert.match(platform, /adminSection/);
});

test('admin dışındaki sayfalarda eski uzun admin hero akışı kullanılmaz', () => {
  assert.match(platform, /const isRealAdmin=/);
  assert.match(platform, /standardOverview=!isRealAdmin/);
});
