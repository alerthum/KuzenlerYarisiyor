# Aşama 01 — V11 kök neden analizi

## Amaç

V11'i değiştirmeden önce canlı oturumlarda aynı soruların neden geldiğini kanıtla.
Kontrol et: sabit seed, cache, fallback aileleri, family ağırlıkları, yetersiz havuz, kimlik üretimi, geçmiş kaydının yazılmaması, benzerlik eşiği, soru adapterleri.
En az 5 sınıf ve 5 oyun için 10'ar oturum üret.
Çıkış: tekrarın kesin kök nedeni ve yeniden üretilebilir testleri olmadan PASS yok.


## Zorunlu yürütme
1. Durum, puan ve engel dosyalarını oku.
2. Mevcut davranışı gerçek uygulamada yeniden üret.
3. Başarısızlığı yakalayan test yaz.
4. En küçük doğru mimari değişikliği uygula.
5. Birim, özellik, kapasite ve canlı oturum testlerini çalıştır.
6. İnsan gözü örneklerini incele.
7. Analiz JSON'unu ve admin ekranını güncelle.
8. Raporu PASS/BLOCKED olarak kapat.
9. PASS ise kullanıcıdan onay beklemeden sonraki aşamaya geç.

## Yasak
- Test gevşetme
- Eşik düşürme
- Sorunu gizleme
- Rastgele çeldirici
- Kolay soruya “zor” etiketi verme
- Sayı/isim değişimini yeni soru sayma
