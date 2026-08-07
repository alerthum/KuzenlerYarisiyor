import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const platform = await readFile(new URL('../js/platform/firebase-platform.js', import.meta.url), 'utf8');
const registry = await readFile(new URL('../md/arsiv/FEATURE_REGISTRY.md', import.meta.url), 'utf8');

const requiredFeatures = [
  ['learner-edit', 'Öğrenci düzenle'],
  ['learner-random-pin', 'Yeni PIN'],
  ['learner-custom-pin', 'Özel PIN'],
  ['learner-links', 'Sınıf / bağlantı yönetimi'],
  ['learner-analysis', 'Analiz'],
  ['learner-preview', 'Oyun görünümü'],
  ['learner-toggle-status', 'Aktif/pasif'],
  ['learner-delete', 'Silme'],
];

test('öğrenci kartı kritik işlemleri yeni tasarımlarda kaybolmaz', () => {
  for (const [feature, label] of requiredFeatures) {
    assert.match(platform, new RegExp(`data-feature=["']${feature}["']`), `${label} işlemi kaybolmuş`);
  }
});

test('özellik envanteri kritik öğrenci işlemlerini kayıt altında tutar', () => {
  for (const phrase of ['Rastgele yeni PIN', 'Özel PIN', 'Okul ve sınıf değiştirme', 'Aktif/pasif', 'Kontrollü silme']) {
    assert.ok(registry.includes(phrase), `Özellik envanterinde eksik: ${phrase}`);
  }
});
