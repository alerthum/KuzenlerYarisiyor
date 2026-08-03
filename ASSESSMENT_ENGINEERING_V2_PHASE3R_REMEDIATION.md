# Assessment Engineering Engine V2 — Faz 3R Doğal Paragraf Revizyonu

## Revizyon nedeni

Faz 3D otomatik kanıt testlerini geçmesine rağmen ilk insan gözleminde metinlerin aynı üretim kalıbından çıktığı görüldü. Özellikle kurum adı, ölçüm, sınırlayıcı son cümle ve “olabilir” biçimindeki tekrarlar gerçek sınav kitabı çeşitliliğini karşılamadı.

Bu nedenle Faz 3D sonucu yalnız **solver/kanıt mühendisliği PASS** olarak tutuldu. İçerik yüzeyi kabul edilmedi. Önceki 12 örnek `quality-reports/rejected/phase3d-ai-template-failure/` altında reddedilmiş kanıt olarak saklandı.

## Yapısal benchmarktan çıkarılan ölçütler

Kullanıcının sağladığı paragraf soru bankası yalnız yapısal benchmark olarak incelendi; kaynak metinler kopyalanmadı veya varyasyon üretmek için kullanılmadı.

- Aynı test içinde farklı metin türleri bulunmalı: deneme, anekdot, edebî eleştiri, kişisel değerlendirme, iki metin, araştırma özeti ve kaynak sorgulama.
- Soru kökleri tek bir “ana düşünce/çıkarım” şablonuna sıkışmamalı.
- Metinlerde yazar sesi, mecaz, alıntı, karşıtlık, retorik soru ve örtük anlam bulunabilmeli.
- Seçeneklerin tamamı aynı anlam alanında ve makul uzunlukta olmalı.
- Doğru cevap sürekli en uzun seçenek olmamalı.
- TYT düzeyi gözle test yüzeyi beş seçenek taşımalı.

## Uygulanan değişiklikler

- 12 paragraf modelinin metinleri ve seçenekleri yeniden yazıldı.
- 12 farklı tür, 11 farklı anlatıcı sesi, 10 farklı kaynak biçimi ve 12 farklı soru kökü ailesi oluşturuldu.
- Araştırma/ölçüm kalıbı 12 sorunun yalnız ikisinde kullanıldı.
- Her model beş seçenek ve dört ayrı öğrenci hata yolu taşıyor.
- Üçlü kelime dizisi benzerliği, metin uzunluğu, seçenek uzunluk dengesi, doğru cevap kopyalama oranı ve yapay kalıp ifadeleri otomatik kapıya bağlandı.
- Doğru cevabın en uzun seçenek olma oranı %50’ye indirildi.
- En yüksek katalog içi üçlü kelime benzerliği 0.008 olarak ölçüldü.

## Durum

- Solver-backed doğruluk: korunuyor.
- Bağımsız doğrulayıcı: korunuyor.
- Eski 604 içerik: `UNVERIFIED_LEGACY`.
- `productReady=false`.
- İnsan örneklemi: `NOT_MEASURED`.
- Sonraki kapı: yeni 12 soruluk doğal paragraf paketinin gözle değerlendirilmesi.


## Final doğrulama

- Assessment Engine V2: **54/54 PASS**.
- 604 içerik koruma paketi: **11/11 PASS**.
- Üretim build: **PASS**.
- Yeni stale-draft mutasyonu: reddedilmiş taslaktan kalan bir ifade seçenek geri bildirimine sızarsa **RED**.
- İnceleme paketi: 12 özgün soru, her biri 5 seçenekli ve 4 ayrı hata yoluna sahip.
