# Zihin Arenası 13.5.1 — Kalite Pilotu

## Yayın kararı

Bu paket **tam ürün yayını değildir**. Çocukların gerçek kullanıcı deneyimiyle değerlendirmesi için hazırlanmış, Git/Vercel'e aktarılabilir kontrollü kalite pilotudur.

- `productReady`: **false**
- `gitReadyPilot`: **true**
- Kalite pilotu modu: **açık** (`QUALITY_PILOT_MODE=true`)
- Kullanıcı ekranında açık oyunlar:
  - **Yanlış Çözümü Yakala** — Matematik
  - **Paragraf Dedektifi** — Türkçe
  - **Deney Dedektifi** — Fen/Bilimsel Muhakeme

Diğer oyunlar kaynak kodda korunur; çocuk arayüzünde görünmez ve doğrudan başlatılmaları engellenir.

## Onaylanan içerik

Toplam **34 insan yazımı özgün soru**:

| Oyun | Ders | Soru | Aile | Konu |
|---|---|---:|---:|---:|
| Yanlış Çözümü Yakala | Matematik | 14 | 7 | 8 |
| Paragraf Dedektifi | Türkçe | 10 | 5 | 6 |
| Deney Dedektifi | Fen | 10 | 5 | 7 |

Her soru:

- tek ve bağımsız doğrulanabilir doğru cevap,
- en az iki bağımlı düşünme adımı,
- üç ayrı öğrenci yanılgısına bağlı çeldirici,
- her çeldirici için `misconceptionId`, `constructionRule` ve seçilme gerekçesi,
- çözüm kanıtı ve çözüm grafiği,
- yüzeysel sayı/isim değişikliğinden bağımsız kimlik

taşır.

Pilot havuzu tükendiğinde uygulama eski düşük kaliteli sorulara sessizce dönmez; kullanılabilir soru kalmadığını bildirir.

## Doğrulama sonuçları

- Premium pilot kalite kapısı: **5/5 PASS**
- Premium çekirdek kalite kapıları: **20/20 PASS**
- Pilot + içerik bütünlüğü + mobil/admin ilgili regresyon: **13/13 PASS**
- Üretim/Vercel derlemesi: **PASS**
- Pilot kalite raporu: `quality-reports/premium-pilot-release.json`

Tam eski test takımında pilot kapsamı dışındaki açık problemler vardır. Bunlar gizlenmemiştir:

- İngilizce kelime oyununda 20 yerine 12 tur üretimi,
- Geometri oyununda görev türü çeşitliliğinin 2/4'te kalması,
- Zekâ İstasyonu ve Olimpiyat Merdiveni uzun oturumlarında underfill,
- bazı eski admin/LGS testlerinin güncel veri modeline göre yenilenmemiş beklentileri.

Bu nedenlerle yalnız üç onaylı oyun çocuk testine açılmıştır.

## Çocuk testi

Her çocuk için önerilen ilk tur:

1. Yanlış Çözümü Yakala: 2 oturum
2. Paragraf Dedektifi: 1 oturum
3. Deney Dedektifi: 2 oturum

Gözlemlenecek noktalar:

- Soruyu anlamak için gereken süre,
- bütün seçeneklerin okunup okunmadığı,
- yanlış seçeneğin neden cazip geldiği,
- çözüm açıklamasının gerçekten öğretip öğretmediği,
- soru dili veya seçeneklerde yapaylık hissi,
- aynı zihinsel görevin tekrar ediyormuş gibi hissedilmesi.

Bu pilotun amacı büyük soru sayısı göstermek değil, sonraki bütün ders ve konular için kullanılacak kalite standardını gerçek çocuk geri bildirimiyle kilitlemektir.
