# Aşama 06 — Premium seçenek ve çeldirici motoru

## Amaç

Seçenekleri üretim sonrası eklenen rastgele parçalar olmaktan çıkar; aile tasarımının parçası yap.
Her yanlış seçenek gerçek misconceptionId ile üretilsin.
Dilbilgisel şekil, uzunluk, olumluluk, semantik kategori ve bariz alakasızlık denetçileri yaz.
“Tüm seçenekleri okumadan bulunabilir” denetimini zorunlu yap.


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
