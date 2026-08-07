# Zihin Arenası V10 — Cognitive Engine Ana Yol Haritası

## Değişmez sürüm kuralı
Her yeni sürüm; önceki sürümün görünümünü, çalışan özelliklerini, veri modelini, ustalık ve sessiz telafi motorunu, yönetim araçlarını, AI orkestrasyonunu ve test kapsamını korur. Bitmeyen işler sonraki sprint backlog’una otomatik taşınır. Regresyon testleri geçmeden sürüm kabul edilmez.

## V9’dan taşınan zorunlu işler
- Ders başına 8–10 güçlü görünür kart.
- Kart arkasında konu, alt konu, beceri, kazanım ve soru ailesi haritası.
- Konu ustalığı: Keşfediliyor, Gelişiyor, Pekişiyor, Ustalaştı, Kalıcılaştı.
- Sessiz telafi: oturumun en fazla %25’i.
- Mikro öğretim ve aralıklı kalıcılık kontrolü.
- Başarıya göre otomatik zorluk, çeldirici ve bilişsel derinlik artışı.
- Soru ve soru ailesinin global karantinası.
- Öğrenci, veli, öğretmen ve admin için konu/kazanım raporları.

## V10 ana epikleri
1. Cognitive Engine: thinkingPatternId, bilişsel çeşitlilik ve oturum dengesi.
2. İçerik Kalite Motoru: cevap sızıntısı, tek doğru, çeldirici, doğal dil, sınıf uygunluğu.
3. Soru Baş Editörü AI ve Cognitive Designer AI.
4. Premium soru aileleri: önce Zekâ/Sözel Mantık, sonra Matematik, Türkçe, İngilizce, Olimpiyat.
5. Question Studio: soru, aile, pattern, kazanım, kalite puanı, karantina ve yayın akışı.
6. Adaptive Session: ustalık + düşünme kalıbı + konu çeşitliliği + sessiz telafi.
7. Brain Profile: çıkarım, planlama, tablo kurma, transfer, dikkat ve görsel okuma profili.
8. Teacher/Parent Intelligence raporları.

## Sprint planı
### V10 Alpha 1 — Temel koruma ve bilişsel kalite
- thinkingPatternId zorunlu altyapısı.
- Aynı soru ailesi ve düşünme kalıbının oturumda tekrarlanmaması.
- 8. sınıf ve üstünde mini egzersiz düzeyindeki zayıf mantık ailelerinin yayından kaldırılması.
- Cevabın soru metninde açıkça verilmesini yakalayan kalite kapısı.
- Cognitive session audit ve regresyon testleri.

### V10 Alpha 2 — Premium Sözel Mantık yeniden yapımı
- Gerçek tablo, sıralama, eşleştirme, yerleştirme ve çoklu koşul aileleri.
- En az iki/üç bağlantılı çıkarım.
- Gerçek hata modellerine dayalı çeldiriciler.
- 8 soruluk oturumda en az 6 farklı düşünme modeli.
- İlk oturum vitrini için yalnız doğrulanmış soru aileleri.

### V10 Alpha 3 — Soru Baş Editörü AI
- Kural tabanlı denetim + yerel AI değerlendirmesi.
- Soru kalite puanı ve reddetme gerekçeleri.
- Soru ailesi düzeyinde risk puanı.
- Admin Question Studio ilk sürümü.

### V10 Alpha 4 — Matematik/Türkçe/İngilizce içerik derinliği
- Kart arkasındaki konu üreticilerinin genişletilmesi.
- Premium orta-zor soru aileleri.
- Kazanım ve thinkingPattern çapraz raporu.

### V10 Beta — Bütünleşik adaptasyon ve raporlar
- Cognitive Engine + ustalık + sessiz telafi birleşimi.
- Öğrenci Brain Profile.
- Veli/öğretmen/admin bilişsel gelişim raporları.
- Tam regresyon, performans ve yayın kabul testleri.

## V10 Alpha 2 — Global Quality Engine (Tamamlandı)
- [x] Kalite denetimini yalnız Sözel Mantık yerine tüm Zihin Arenası içeriklerine uygulama
- [x] Ortak kalite boyutları ve puanlama
- [x] Kritik ret kapıları
- [x] Oturum bilişsel çeşitlilik denetimi
- [x] Kalite metadata'sını bütün oyun oturumlarına bağlama
- [ ] Mevcut tüm soru ailelerinin toplu kalite envanteri ve otomatik karantina
- [ ] Ders/sınıf özel eşik profilleri
- [ ] Premium soru ailelerinin içerik bazında yeniden yazımı

## V10 Alpha 3 — Tamamlandı

- Global kalite puanı gerçek oturum yayın kapısına bağlandı.
- Cevap sızıntısı, doğru cevabın seçeneklerde bulunmaması ve üst sınıfta yapay bağlam şablonları anında engelleniyor.
- İlgisiz çeldiriciler, zorluk uyuşmazlığı, tekrar eden aile/pattern/bağlam şablonları envanterde karantina adayı olarak kaydediliyor.
- `npm run quality:inventory` ile oyun/sınıf bazlı kalite envanteri üretildi.
- Geriye uyumluluk için havuzu boşaltabilecek ikincil hatalar bu fazda raporlanıyor; premium alternatif havuz tamamlandıkça zorunlu engel seviyesine geçirilecek.

## Sıradaki zorunlu faz: V10 Alpha 4 — Premium İçerik Yeniden Yapımı

1. Envanterde düşük puan alan aileleri dersler arasında dengeli biçimde yeniden yaz.
2. Önce doğrulanmış alternatif havuz oluştur, sonra ikincil kalite hatalarını bloklayıcı kurala yükselt.
3. Matematik, Türkçe, Fen, İngilizce, Sosyal, Din, Zekâ ve Olimpiyat için ders-uzmanı denetleyicileri ekle.
4. Yeni öğrenci vitrini için insan onaylı GOLD soru havuzu oluştur.
5. Question Studio ve aile bazlı yayın/karantina ekranını admin komuta merkezine bağla.

## Gece Birleşik Geliştirme — Alpha 4 Checkpoint

Tamamlandı:
- Node/SSR localStorage güvenliği ve temiz test çıktısı.
- Paket, uygulama ve içerik sürümünün 10.0.0-alpha.4 olarak tek merkezden eşitlenmesi.
- Tüm dersleri kapsayan ders özel Quality Orchestra eşikleri.
- Chief Quality Judge yayın kararı.
- İlk oturum için GOLD/APPROVE vitrin seçimi; REVIEW içeriklerin ilk deneyimden çıkarılması.
- Kategori bazlı içerik kalite öncelik raporu.
- `npm run quality:gate` yayın öncesi kalite kapısı.
- 135/135 test, build ve kalite envanteri doğrulaması.

Sıradaki birleşik paket işleri:
- Kalite envanterindeki en yüksek öncelikli ailelerin gerçek premium alternatiflerle değiştirilmesi.
- İlgisiz çeldirici ve yapay bağlam uyarılarının alternatif havuz yeterli olduğunda kesin engel yapılması.
- Matematik, Türkçe, Fen, İngilizce, Sosyal, Din, Zekâ ve Olimpiyat için dengeli GOLD örnek aileleri.
- V9'dan kalan kart kataloğu ve rol bazlı konu/ustalık raporlarının tamamlanması.
