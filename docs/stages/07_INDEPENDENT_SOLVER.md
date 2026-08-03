# Aşama 07 — Bağımsız doğruluk ve çözüm

## Amaç

Üreticiden bağımsız çözücüyle doğru cevabı hesapla.
Birden fazla doğru, doğru seçenek yok, açıklama–cevap uyumsuzluğu veya çeldirici de doğruysa karantina.
10.000 örnekte kritik doğruluk hatası 0.


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
