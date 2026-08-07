# Assessment Engineering Engine V2 — Phase 4F

## 8. Sınıf Türkçe Görsel Okuma ve Dil Bilgisi Dalgası 2

Durum: `ENGINEERING_PASS_HUMAN_REVIEW_REQUIRED`

## Uygulanan insan geri bildirimi

Önceki Phase 4E gözle paketindeki `tr-g8-wave1-09-emphasis-design` sorusunda “küçük izler” kavramı ilk paragrafla tasarım açıklaması arasında açık bağ taşımıyordu. Metin şu şekilde düzeltildi:

- Çeşme kitabesi, dükkân tabelası ve aşınmış taş açıkça “küçük izler” olarak adlandırıldı.
- Bu izlerin önemsiz görülmesi hâlinde kent belleğindeki gündelik tanıklıkların kaybolacağı belirtildi.
- Tipografik tekrar ve koyu yazı artık aynı düşünceye doğrudan bağlanıyor.

Bu bağın yeniden zayıflamasını engelleyen regresyon testi eklendi.

## Yeni içerik grubu

10 yeni kanonik soru, 6 yeni resmî kazanım:

- `T.8.3.12` — Görsel ve başlıktan metnin konusunu tahmin etme
- `T.8.3.27` — Görsellerle ilgili soruları cevaplama
- `T.8.3.33` — Edebî eser ile medya sunumunu karşılaştırma
- `T.8.4.18` — Cümlenin ögelerini ayırt etme
- `T.8.4.19` — Cümle türlerini tanıma
- `T.8.4.20` — Fiilde çatının anlama katkısını kavrama

Soru dağılımı:

- Görsel + başlıktan konu tahmini: 1
- Karikatür ve görsel haber yorumu: 2
- Öykü/film ve şiir/animasyon karşılaştırması: 2
- Cümlenin ögeleri: 2
- Cümle türleri: 1
- Fiilde çatı ve sorumluluk/odak: 2

## Kalite sözleşmesi

Her soru:

- En az üç kanıt düğümü,
- Üç kademeli ipucu,
- Dört ayrı seçenek açıklaması,
- Üç farklı öğrenci hata yolu,
- Ana çözücü + ayrı kısıt kesişimi doğrulayıcısı,
- Kör şık sızıntısı denetimi,
- `HUMAN_REVIEW_REQUIRED`,
- `gameAdaptationAllowed=false`

taşır.

## Güncel kapsam

- Resmî 8. sınıf Türkçe kazanımı: 76
- Kanonik mühendislik sorusu: 51
- İçerikle kapsanan kazanım: 31
- Kalan kazanım: 45
- Ürün durumu: `productReady=false`
- Legacy içerik: `UNVERIFIED_LEGACY`

## Teknik doğrulama

- Assessment V2 tam regresyon: `113/113 PASS`
- Yeni Phase 4F özel testleri: `6/6 PASS`
- Production build: `PASS`
- Oyun adaptasyonu: kilitli

## Sonraki sabit aşama

Türkçe motorundaki aktarılabilir ortak kalite hattı artık görsel ve dil bilgisi alanlarında da doğrulandı. Sonraki aşama, yeni bir mimari kurmak değil, aynı kanonik sözleşmeyi erken çapraz pilotla sınamaktır:

- 8. sınıf Matematik küçük pilot,
- 8. sınıf Fen Bilimleri küçük pilot,
- farklı sınıf düzeyinde Türkçe küçük pilot.

Her ders kendi alan çözücüsüne sahip olacak; ortak kalan yalnız müfredat kaydı, kanonik soru sözleşmesi, kalite kapıları ve insan inceleme sürecidir.
