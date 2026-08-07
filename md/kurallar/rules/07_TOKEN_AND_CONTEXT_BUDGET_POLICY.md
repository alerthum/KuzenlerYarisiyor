# Token ve bağlam bütçesi politikası

## Amaç
Ajanın aynı projeyi tekrar tekrar taramasını, başarılı aşamaları yeniden incelemesini ve gereksiz tam test çalıştırmasını önlemek.

## Değişmez kurallar

1. İlk başlangıç dışında bütün proje ağacı yeniden taranamaz.
2. Her yeni oturum önce yalnız şu dosyaları okur:
   - `CONTEXT_SNAPSHOT.md`
   - `PROJECT_STATE.json`
   - `QUALITY_SCORE.json`
   - `BLOCKERS.json`
   - Aktif aşama dosyası
3. Bunlardan sonra yalnız aktif aşamayla ilgili dosyalar açılır.
4. PASS olmuş aşamalar yeniden analiz edilemez.
5. PASS olmuş aşamaların raporları yalnız bağımlılık veya regresyon şüphesi varsa okunabilir.
6. Aynı dosya bir oturum içinde gereksiz yere tekrar okunamaz.
7. Kod değişikliğinden önce `DIFF_ANALYSIS.md` hazırlanır.
8. İlgili testler başarılı olmadan kalite testi çalıştırılmaz.
9. Kalite testi başarılı olmadan tam regresyon çalıştırılmaz.
10. Tam regresyon yalnız:
   - Aşama kapanışında gerekiyorsa
   - Ortak altyapı değiştiyse
   - Final kabulde
   çalıştırılır.
11. AI hakemleri yalnız:
   - Yeni aile
   - Düşük puan
   - Şüpheli soru
   - Denetçi uyuşmazlığı
   - Final örneklemi
   için çağrılır.
12. Aynı hata imzası ikinci kez modele gönderilmez.
13. Aynı sorunun farklı yazımları modele ayrı ayrı gönderilmez.
14. Bir hakem çağrısında yalnız gerekli soru, seçenekler, çözüm ve kalite bağlamı gönderilir.
15. Model cevabı uzun serbest metin yerine yapılandırılmış kısa JSON olmalıdır.

## Test sırası

### Seviye 1 — İlgili test
Yalnız değişen modül, aile, üretici veya denetçi testleri.

### Seviye 2 — Kalite kapısı
Soru doğruluğu, seçenek kalitesi, zorluk, tekrar ve sözleşme testleri.

### Seviye 3 — Tam regresyon
Bütün proje testleri, build, lint, typecheck ve E2E.

Bir alt seviye başarısızken üst seviye çalıştırılamaz.
