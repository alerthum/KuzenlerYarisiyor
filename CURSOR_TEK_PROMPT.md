# Cursor'a tek sefer gönderilecek prompt

Bu projede yalnız Zihin Arenası ortak premium soru motorunu tamamlayacaksın.

Önce proje kökündeki `00_AUTONOMOUS_MASTER.md`, `AGENTS.md`, `docs/rules` altındaki bütün değişmez kuralları ve `docs/stages` altındaki aşama dosyalarını oku. Ardından mevcut V11 kodunu, soru üreticilerini, oyun kataloğunu, testleri, kalite kayıtlarını, admin panelini ve gerçek oturum akışını incele.

Kesin çalışma biçimi:

- Kullanıcıdan aşamalar arasında yeni komut, onay veya “devam et” mesajı bekleme.
- İlk tamamlanmamış aşamayı bul ve bütün aşamalar PASS olana kadar sırayla otomatik ilerle.
- Her aşamada uygulamayı gerçek tarayıcıda aç, soru üret, oturum çalıştır, sonuçları analiz sayfasına yaz.
- Her aşama sonunda durum, puan, engel, rapor ve analiz JSON dosyalarını güncelle.
- V11’in neden aynı aileden ve aynı iskeletlerden soru ürettiğini kod, veri ve canlı oturum kanıtıyla bulmadan yeni motoru tamamlanmış sayma.
- Sayı, isim, nesne, renk veya cümle makyajı değiştirilmiş aynı çözüm yolu yeni soru değildir.
- 3. sınıf ve sonrasında kolay veya orta soru yayınlama. Bu sınıflarda yaşa uygun ama zorlayıcı, çok adımlı, geliştirici ve gerçek düşünme gerektiren sorular üret.
- Zorluk; yalnız büyük sayı, uzun metin veya karmaşık ifade değildir. Zorluk; ilişki kurma, çıkarım, temsil dönüşümü, gereksiz bilgiyi ayıklama, tersine düşünme, hata analizi ve çok adımlı çözümle ölçülür.
- Soru kaliteli olsa bile seçenekleri zayıfsa GOLD verilemez.
- En az iki yanlış seçenek gerçek öğrenci yanılgısına dayanmalı; bütün yanlış seçenekler konu ve soru köküyle doğrudan ilgili olmalı.
- Bir seçenek olumsuz, diğerleri olumlu; biri aşırı uzun, diğerleri kısa; biri konu dışı; biri saçma; biri dil bilgisel olarak ayrışmış olamaz.
- Öğrenci doğru cevabı bulmak için bütün seçenekleri ciddi biçimde değerlendirmek zorunda kalmalı.
- Soru kökü cevabı doğrudan veya dolaylı biçimde ele vermemeli.
- Yanlış seçenekler rastgele sayı veya rastgele cümle olamaz.
- Her yanlış seçenek için “öğrenci hangi gerçek hatayla bunu seçer?” açıklaması bulunmalı.
- Doğru cevap yalnız içerik ve çözüm nedeniyle doğru olmalı; biçimsel ipucu vermemeli.
- Testleri geçirmek için eşiği düşürme, testi gevşetme, örnek sayısını azaltma, başarısız aileyi gizleme veya sabit seed kullanma.
- Önce deterministik denetçileri çalıştır; AI hakemlerini yalnız örneklenmiş veya sınırda kalan sorularda kullan.
- Aynı hatayı modele tekrar tekrar gönderme; hata imzasını yerel kurala dönüştür.
- Aynı yaklaşım üç kez başarısız olursa yamaya devam etme; aileyi karantinaya al veya mimariyi yeniden tasarla.
- Genel puan %90, her kritik alt puan eşik üstü, kritik/yüksek engel sıfır olmadan tamamlandı deme.

Şimdi `00_AUTONOMOUS_MASTER.md` emrini uygula ve bütün aşamaları kendi kendine tamamla.

Ek token ve kota kuralları:

- İlk V11 keşfi dışında bütün projeyi yeniden tarama.
- İlk aşamadan sonra her çalışma döngüsünde önce yalnız `CONTEXT_SNAPSHOT.md`, durum/puan/engel dosyaları ve aktif aşama dosyasını oku.
- Snapshot'ta belirtilmeyen kaynak dosyaları gerekçesiz açma.
- PASS olmuş aşamaları tekrar analiz etme.
- Kod değiştirmeden önce `DIFF_ANALYSIS.md` oluştur ve değişiklik gerçekten gerekli mi kanıtla.
- Testleri şu sırayla çalıştır: ilgili testler → kalite kapısı → gerekiyorsa tam regresyon.
- İlgili test başarısızsa bütün test paketini çalıştırma.
- AI hakemlerini yalnız yeni aile, düşük puan, şüpheli soru, uyuşmazlık ve final örneklerinde kullan.
- Aynı hata imzasını ikinci kez modele gönderme.
- Her aşama sonunda 2–5 KB hedefli `CONTEXT_SNAPSHOT.md` oluştur veya güncelle.
- Yeni Cursor oturumu tüm projeyi yeniden okumadan bu snapshot üzerinden kaldığı yerden devam edebilmeli.
- Varsayılan model Sonnet 5 High kabul edilir.
- Opus 5 High yalnız üç başarısız doğru deneme sonrası kritik mimari engelde, dar kapsamlı tek oturumluk danışman olarak kullanılabilir.
- Opus'a bütün proje gönderme; yalnız snapshot, aktif aşama, diff analizi, ilgili dosyalar ve test sonuçlarını ver.
- Opus kararı sonrasında uygulamaya yeniden Sonnet 5 High ile devam et.

