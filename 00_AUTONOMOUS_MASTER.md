# Zihin Arenası Final Otonom Ana Yürütücüsü

## Sabit başlangıç
Aşama 01, 02, 03 ve 04 tamamlanmıştır. Aşama 04 sonucu 23/23 aktif oyundur.
Bu aşamalar yeniden açılmaz; sonraki aşama gerçek regresyon kanıtı üretirse yalnız ilgili dar dosya düzeltilir.

## Görev
Aşama 05'ten 15'e kadar bütün kalite, doğruluk, seçenek, tekrar, öğrenci simülasyonu, yayın ve final kabul sistemlerini tamamla.

## Kesin döngü
1. CONTEXT_SNAPSHOT.md oku.
2. PROJECT_STATE.json, QUALITY_SCORE.json, BLOCKERS.json oku.
3. İlk tamamlanmamış aşamayı bul.
4. Aktif stage dosyasını oku.
5. DIFF_ANALYSIS.md hazırla.
6. Yalnız ilgili dosyaları aç.
7. Başarısızlığı yakalayan testleri yaz.
8. En küçük kalıcı çözümü uygula.
9. Test merdivenini çalıştır.
10. Gerçek soru/oturum örnekleri üret.
11. Analiz ve durum dosyalarını güncelle.
12. PASS ise kullanıcıya sormadan sonraki aşamaya geç.
13. FAIL ise aynı aşamada düzeltmeye devam et.
14. Aşama 15 PASS olana kadar durma.

## Kullanıcıya soru sorma yasağı
Şunlar sorulamaz:
- Devam edeyim mi?
- Hangi oyundan başlayayım?
- Kapsamı/eşiği düşürelim mi?
- Aşamayı atlayalım mı?
- Tam regresyon çalıştırayım mı?
- Uzun sürecek, azaltalım mı?

## Yalnız teknik durma
- Kaynak kod fiziksel olarak yok.
- Runtime/derleyici erişimi yok.
- Zorunlu harici servis veya gizli anahtar yok.
- Aynı kök neden için üç farklı testli mimari yaklaşım başarısız.
- Araç bağlam/oturum sınırı fiziksel olarak sona erdi.

Durma halinde PAUSED_TECHNICAL yaz; kullanıcıya seçenek listesi sunma; snapshot'a kesin devam noktasını kaydet.

## Tamamlanma
- Aşama 05–15 PASS
- Genel kalite >=90
- Doğruluk ve tek doğru cevap =100
- 3+ sınıfta kolay/orta yayın =0
- Seçenek kalitesi >=95
- Alakasız/saçma/biçimsel ipuçlu seçenek =0
- Tüm şıkları okumadan cevaplanabilen soru =0
- Aynı oturum semantik tekrar =0
- 500 oturum testi PASS
- İnsan gözü >=90
- Tüm oyunlar ortak yayın kapılarında
- Açık CRITICAL/HIGH blocker =0
- Web/mobil E2E PASS
- FINAL_RELEASE_DECISION.json decision=PASS
