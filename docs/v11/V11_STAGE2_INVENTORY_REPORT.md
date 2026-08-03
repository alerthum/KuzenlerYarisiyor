# Zihin Arenası V11 — Aşama 2 Envanter Raporu

Üretim zamanı: 2026-08-01T03:23:38.547Z

## Statik kod envanteri

- İçerik sinyali taşıyan kaynak dosya: **20**
- Statik havuz dosyası: **8**
- Dinamik üretici dosyası: **3**
- Karma kaynak: **4**
- Tespit edilen aile/üretici kimliği: **116**
- Soru nesnesi sinyali: **406**

> Bu rakamlar kaynak kod sinyalidir. Dinamik motorların üretebileceği toplam soru sayısını göstermez.

## V11 eşleştirme önerileri

- Eşleştirme adayı: **147**
- Otomatik öneri üretilebilen: **56**
- Eşleşmeyen: **91**
- Önerilerde kullanılan V11 iskeleti: **8 / 40**

## Kesin kural

Otomatik eşleştirme yalnız ön elemedir. İnsan editör onayı olmadan hiçbir mevcut aileye **skeletonId** yazılmaz ve hiçbir soru yayın statüsü değiştirilmez.

## Sonraki uygulama

1. Paragraf motorundaki aileler tek tek doğrulanır.
2. Her aile için Question Identity Card şablonu oluşturulur.
3. Kanıt haritası ve üç yanılgı metadata'sı eklenir.
4. V11 kalite kapıları mevcut Quality Orchestra ile bağlanır.
5. Eski sorular KEEP / UPGRADE / REMAP / QUARANTINE / RETIRE olarak sınıflandırılır.
