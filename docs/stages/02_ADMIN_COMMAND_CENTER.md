# Aşama 02 — Admin soru motoru komuta merkezi

## Amaç

Admin menüsüne ayrı analiz butonu ve sayfası ekle.
Gerçek zamanlı göster: aşama, puan, sınıf/ders/oyun kapsamı, GOLD/REVIEW/QUARANTINE, seçenek kalitesi, tekrar ihlalleri, canlı örnekler, açık engeller.
Veri yoksa “Veri yok” yaz; olumlu metrik uydurma.
Her aşama sonunda bu veri otomatik güncellenir.


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
