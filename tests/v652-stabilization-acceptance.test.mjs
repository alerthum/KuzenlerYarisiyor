import test from 'node:test';
import assert from 'node:assert/strict';
import { categoryFiltersForGrade, categoryLabel, gameLabel } from '../js/catalog-labels.js';
import { GAME_CATALOG } from '../js/games/registry.js';
import { readFile } from 'node:fs/promises';

const ids = (grade) => categoryFiltersForGrade(grade).map(([id]) => id);

test('8. sınıf yalnız LGS sınav kategorisini görür', () => {
  assert.ok(ids(8).includes('lgs'));
  assert.ok(!ids(8).includes('tyt'));
  assert.ok(!ids(8).includes('ayt'));
  assert.ok(!ids(8).includes('kpss'));
});

test('11. sınıf TYT ve AYT kategorilerini görür; LGS ve KPSS görmez', () => {
  assert.ok(ids(11).includes('tyt'));
  assert.ok(ids(11).includes('ayt'));
  assert.ok(!ids(11).includes('lgs'));
  assert.ok(!ids(11).includes('kpss'));
  assert.ok(!ids(11).includes('religion'));
});

test('12. sınıf TYT AYT KPSS kategorilerini görür; LGS ve Din filtresi görmez', () => {
  assert.ok(ids(12).includes('tyt'));
  assert.ok(ids(12).includes('ayt'));
  assert.ok(ids(12).includes('kpss'));
  assert.ok(!ids(12).includes('lgs'));
  assert.ok(!ids(12).includes('religion'));
});

test('sınav oyunlarının kategori etiketleri tanımlıdır', () => {
  const expected = new Map([['tyt-focus','TYT'],['ayt-focus','AYT'],['kpss-focus','KPSS']]);
  for (const [id, label] of expected) {
    const game = GAME_CATALOG.find((item) => item.id === id);
    assert.ok(game);
    assert.equal(categoryLabel(game.category), label);
  }
});

test('analizde görülen bütün oyun kimliklerinin Türkçe adı vardır', () => {
  for (const game of GAME_CATALOG) assert.notEqual(gameLabel(game.id), 'Bilinmeyen oyun', game.id);
  assert.equal(gameLabel('speed-math'), 'Hızlı İşlem Arenası');
  assert.equal(gameLabel('english-cloze'), 'İngilizce Boşluk Avı');
  assert.equal(gameLabel('logic-station'), 'Zekâ İstasyonu');
});

test('kullanıcı arayüzü kategori sözlüğüne doğrudan undefined basmaz', async () => {
  const app = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');
  assert.ok(!app.includes('CATEGORY_LABELS[game.category]'));
  assert.ok(app.includes('categoryLabel(game.category)'));
});
