import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [app, css] = await Promise.all([
  readFile(new URL('../../js/app.js', import.meta.url), 'utf8'),
  readFile(new URL('../../css/styles.css', import.meta.url), 'utf8')
]);

test('öğrenci ana menüsü beş seçeneklidir ve Yerel Ayarlar alt menüye sızmaz', () => {
  const navBlock = app.match(/const NAV_ITEMS = Object\.freeze\(\[([\s\S]*?)\]\);/)?.[1] || '';
  const items = [...navBlock.matchAll(/\['([^']+)',\s*'[^']*',\s*'([^']+)'\]/g)];
  assert.equal(items.length, 5);
  assert.deepEqual(items.map((row) => row[2]), ['Ana Sayfa', 'Oyunlar', 'Gelişim', 'Sıralama', 'Lig']);
  assert.doesNotMatch(navBlock, /Yerel Ayarlar/);
});

test('masaüstü yatay menü ve görünür profil/çıkış işlemleri vardır', () => {
  assert.match(app, /class="desktop-primary-nav"/);
  assert.match(app, /class="desktop-account-actions"/);
  assert.match(app, /data-action="student-profile"/);
  assert.match(app, /data-action="student-logout"[^>]*>Çıkış Yap</);
  assert.match(app, /class="profile-action-bar"/);
  assert.match(app, /Ana sayfaya dön/);
});

test('bottom navigation masaüstünde gizli, 899px altında görünür ve içerik payı ayrılmıştır', () => {
  assert.match(css, /\.bottom-nav\s*\{[^}]*display\s*:\s*none/s);
  const mobileBlock = css.match(/@media\s*\(max-width\s*:\s*899px\)\s*\{([\s\S]*?)\n\}/)?.[1] || '';
  assert.match(mobileBlock, /\.bottom-nav\s*\{[^}]*display\s*:\s*grid/s);
  assert.match(mobileBlock, /\.app-shell\s*\{[^}]*padding-bottom\s*:/s);
  assert.match(css, /\.bottom-nav\s*\{[^}]*grid-template-columns\s*:\s*repeat\(5/s);
});

test('kontrollü canlı mod adaptif aday üretimini atlar', () => {
  assert.match(app, /if \(CONTROLLED_LAUNCH_PILOT_ENABLED\)\s*\{[\s\S]*mode:\s*'TRUSTED_LIVE_DIRECT'/);
  assert.match(app, /policy:\s*'EXPLICIT_TRUSTED_CELL_WHITELIST'/);
  assert.match(app, /else\s*\{\s*const candidateRounds = \[\]/);
});
