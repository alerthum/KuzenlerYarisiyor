# Diff Analysis protokolü

Her kod değişikliğinden önce `DIFF_ANALYSIS.md` hazırlanır.

## Zorunlu sorular
1. Sorunun yeniden üretilebilir kanıtı nedir?
2. Kök neden hangi dosya veya katmandadır?
3. Bu dosyanın değiştirilmesi gerçekten gerekli mi?
4. Daha küçük değişiklikle çözüm mümkün mü?
5. Değişiklik hangi mevcut davranışları etkiler?
6. Hangi testler önce yazılmalı?
7. Hangi dosyalar kesinlikle değiştirilmemeli?
8. Geri alma planı nedir?
9. Değişiklik token ve bağlam bütçesine uygun mu?

## Değişiklik sınırı
- İlgisiz refactor yasaktır.
- Aynı aşamada zorunlu olmayan tasarım temizliği yasaktır.
- “Hazır buradayken” değişikliği yapılamaz.
- Dosya değişiklik listesi analizde belirtilenden büyürse analiz güncellenir.
