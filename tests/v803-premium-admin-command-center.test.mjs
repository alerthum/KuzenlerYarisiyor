import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const platform = await readFile(new URL('../js/platform/firebase-platform.js', import.meta.url), 'utf8');
const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');

test('admin yönetimi tüm modülleri kalıcı komuta merkezinde sunar', () => {
  for (const label of ['Genel Bakış','Analizler','Okullar','Sınıflar','Öğretmenler','Veliler','Öğrenciler','Soru İnceleme','Hesabım']) {
    assert.match(platform, new RegExp(label));
  }
  assert.match(platform, /admin-command-sidebar/);
  assert.match(platform, /admin-mobile-tabs/);
  assert.match(css, /grid-template-columns:290px minmax\(0,1fr\)/);
});

test('admin yalnız seçili modülü render eder ve menü seçiminde kapanır', () => {
  assert.match(platform, /const renderSelected = renderers\[adminSection\]/);
  assert.match(platform, /moduleHtml = renderSelected\(\)/);
  assert.match(platform, /adminMenuOpen=false/);
});

test('premium modal uygulama dışındaki document delegasyonu ile kapanır', () => {
  assert.match(platform, /document\.addEventListener\('click',handleAdminModalDocumentClick\)/);
  assert.match(platform, /document\.addEventListener\('keydown',handleAdminModalKeydown\)/);
  assert.match(platform, /event\.key==='Escape'/);
  assert.match(platform, /event\.target\.matches\('\[data-modal-backdrop\]'\)/);
  assert.match(platform, /type="button" class="icon-button" data-platform-action="admin-modal-close"/);
});

test('yönetim tarafında native prompt alert confirm kullanılmaz', () => {
  const withoutInstallPrompt = platform.replace(/deferredInstallPrompt\.prompt\(\)/g, '');
  assert.doesNotMatch(withoutInstallPrompt, /\b(?:prompt|alert|confirm)\s*\(/);
});
