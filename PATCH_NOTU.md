# V5.6.1 — Regresyon Koruma ve Öğrenci İşlemleri

## Geri getirilen ve korumaya alınan işlemler

Öğrenci mobil kartlarında Düzenle, Yeni PIN, Özel PIN, Sınıf/Bağlantılar, Analiz, Oyun görünümü, Aktif/Pasif ve Sil işlemleri birlikte gösterilir.

## Regresyon koruması

`FEATURE_REGISTRY.md` çalışan özelliklerin sözleşmesidir. `tests/v561-regression-registry.test.mjs`, kritik öğrenci işlemlerinden biri kaynak koddan kaybolursa `npm run check` komutunu başarısız yapar.

## Sürüm ilkesi

Yeni tasarım veya özellik mevcut çalışan fonksiyonu açık bir kaldırma kararı olmadan silemez.
