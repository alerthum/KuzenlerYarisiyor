# Aşama 13 — Canlı oturum ve E2E

## Amaç

1,2,3,4,6,8,10,12. sınıflarda gerçek tarayıcı ve mobil genişliklerinde oturum aç.
Başlat, cevapla, ipucu, soru bildir, bitir, analiz kaydı akışlarını doğrula.
3. sınıf ve sonrası kolay/orta soru tespit edilirse FAIL.


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
