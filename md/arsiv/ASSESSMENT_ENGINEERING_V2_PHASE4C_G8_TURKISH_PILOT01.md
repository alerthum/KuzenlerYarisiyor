# Assessment Engineering Engine V2 — Phase 4C

## 8. Sınıf Türkçe Pilot-01

Phase 4C, Phase 4B R1 aşamasında insan tarafından olumlu bulunan beş kalibrasyon sorusunu genişleterek oyunlardan bağımsız ilk ders pilotunu oluşturur.

## Sabit üretim sırası

1. Resmî kazanım seçilir.
2. Kanonik soru üretilir.
3. Doğru cevap semantik çözücüyle hesaplanır.
4. Ayrı kısıt kesişimi doğrulayıcısı aynı sonucu doğrular.
5. Üç farklı öğrenci hata yolu oluşturulur.
6. Üç kademeli ipucu çözüm grafından türetilir.
7. Her seçeneğe öğretici geri bildirim bağlanır.
8. Kör şık ve yüzey kalite kapıları çalışır.
9. İnsan gözlemi yapılır.
10. Yalnız kabul edilen soru oyun adaptörüne açılır.

## Pilot kapsamı

- Sınıf: 8
- Ders: Türkçe
- Program: 2019 Türkçe Öğretim Programı / 2026-2027 için PRE_TYMM rota
- Toplam soru: 24
- Kazanım sayısı: 8
- Her kazanım için soru: 3

Kazanımlar:

- T.8.3.16 — Metnin konusunu belirler.
- T.8.3.17 — Metnin ana fikrini/ana duygusunu belirler.
- T.8.3.18 — Metindeki yardımcı fikirleri belirler.
- T.8.3.23 — Metinler arasında karşılaştırma yapar.
- T.8.3.25 — Okudukları ile ilgili çıkarımlarda bulunur.
- T.8.3.29 — Medya metinlerini analiz eder.
- T.8.3.31 — Bilgi kaynaklarının güvenilirliğini sorgular.
- T.8.3.32 — Grafik, tablo ve çizelgeyle sunulan bilgileri yorumlar.

## İçerik ve seçenek dengesi

- Doğru cevap konumları: A=6, B=6, C=6, D=6
- Metin türü: 23 farklı tür etiketi
- Kaynak/kurgu biçimi: 24 farklı sourceMode
- Her soruda 4 seçenek
- Her soruda 3 farklı yanlış düşünme yolu
- Her soruda en az 2 kanıtın birleştirilmesi
- Her soruda en az 2 kısmen desteklenen çeldirici
- Her soruda 3 kademeli ipucu
- Her seçeneğin ayrı açıklaması

## Yeni şık güvenlik kapıları

Phase 4B R1 kapılarına ek olarak:

- Tek seçenekte “bütün, hiçbir, her durumda, tamamen, bütünüyle” gibi kolay eleme işareti bulunması RED üretir.
- Seçenekler öğrenci yüzeyinde her zaman A-B-C-D sırasıyla sunulur.
- Doğru cevap dağılımı katalog seviyesinde eşit olmak zorundadır.
- 12 soruluk insan inceleme örnekleminde de cevap dağılımı 3-3-3-3 olmak zorundadır.

## Gözle inceleme paketi

24 sorudan 12 soru seçilmiştir:

- 8 kazanımın tamamını kapsar.
- A/B/C/D cevapları üçer kez kullanılır.
- Kör şık modu metni ve soru kökünü gizleyerek yalnız seçeneklerin incelenmesini sağlar.
- Cevaplar, ipuçları ve açıklamalar başlangıçta kapalıdır.

## Otomatik kanıt durumu

- Pilot-01 özel testleri: 10/10 PASS
- Assessment V2 tam regresyon: 85/85 PASS
- Legacy yayın politikası: 2/2 PASS
- Production build: PASS
- productReady: false
- humanReviewStatus: NOT_MEASURED
- gameAdaptationAllowed: false
- UNVERIFIED_LEGACY politikası: korundu

## Yayın kararı

Phase 4C sonucu `ENGINEERING_PASS_HUMAN_REVIEW_REQUIRED` durumundadır.

Bu paket, 24 sorunun otomatik olarak yayınlanabilir olduğu anlamına gelmez. 12 soruluk insan incelemesi kabul edilmeden oyun adaptasyonu ve diğer ders pilotu başlatılmaz.
