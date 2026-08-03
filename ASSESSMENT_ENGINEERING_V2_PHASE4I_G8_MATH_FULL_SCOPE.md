# Assessment Engineering Engine V2 — Phase 4I

## 8. Sınıf Matematik Tam Kapsam Matrisi ve Dalga 1

Durum: `ENGINEERING_PASS_HUMAN_REVIEW_REQUIRED`

- `productReady=false`
- `gameAdaptationAllowed=false`
- Legacy 604 içerik: `UNVERIFIED_LEGACY`
- İnsan gözle kalibrasyonu: `NOT_MEASURED`

## Resmî kapsam

8. sınıf Matematik için etkin önceki programın 52 kazanımı eksiksiz kaydedildi.

| Öğrenme alanı | Kazanım |
|---|---:|
| Sayılar ve İşlemler | 16 |
| Cebir | 13 |
| Geometri ve Ölçme | 16 |
| Veri İşleme | 2 |
| Olasılık | 5 |
| **Toplam** | **52** |

Her kazanım şu sözleşmelere bağlandı:

- uygun ölçme biçimi,
- derse özel solver ailesi,
- farklı bağımsız doğrulayıcı,
- soru ailesi,
- öğrenci yanılgı ailesi,
- görsel/etkileşim gereksinimi,
- insan rubriği gereksinimi,
- oyun adaptasyonu kilidi.

Çizim ve inşa gerektiren kazanımlar yalnız çoktan seçmeli biçime indirgenmedi. On kazanım etkileşimli/geometrik inşa hattına, altı kazanım insan rubriğine bağlandı.

## Dalga 1

Çapraz pilotta bulunan 5 soruya ek olarak 12 yeni solver-backed soru üretildi.

Yeni kazanımlar:

1. Asal çarpanlara ayırma
2. Aralarında asal sayılar
3. Üslü ifade kuralları
4. Kareköklü sayının doğal sayılar arasındaki yeri
5. Kareköklü ifadelerde toplama ve çıkarma
6. Özdeşliklerin alan modeli
7. Birinci dereceden denklem çözme
8. Negatif katsayılı eşitsizlik çözme
9. Üçgen eşitsizliği
10. Doğruya göre yansıma
11. Çoklu veri grubunu yorumlama
12. Tamamlayıcı olay olasılığı

Cevap dağılımı: `A=3, B=3, C=3, D=3`.

Her soruda:

- ana alan çözücüsü,
- farklı algoritmayla bağımsız doğrulama,
- üç ayrı öğrenci hata yolu,
- üç kademeli ipucu,
- dört seçeneğin öğretici açıklaması,
- çözüm grafı,
- insan inceleme ve oyun adaptasyonu kilidi bulunmaktadır.

## Güncel durum

- Resmî kazanım: 52/52 kayıtlı
- Kanonik Matematik sorusu: 17
- İçerikle kapsanan kazanım: 17
- Kalan kazanım: 35
- İnsan onaylı Matematik sorusu: 0

Ürün panosu güncellendi:

- toplam kayıtlı kazanım/çıktı: 138
- toplam kapsanan kazanım: 58
- toplam kanonik soru/görev: 78
- insan inceleme kuyruğu: 73
- oyuna uyarlanmış V2 soru: 0

## Doğrulama

- Phase 4I özel testleri: 8/8 PASS
- Assessment V2 tam paketi: 139/139 PASS
- Legacy yayın koruması: 2/2 PASS
- Production build: PASS

Genel `npm test` denemesi 120 saniyelik yürütme sınırında durmuştur. Görülen canlı `word-ladder` ve `word-mine` aile öneki hataları daha önce Phase 2A tabanında da kaydedilmiş eski regresyonlardır; Phase 4I Matematik dosyalarıyla ilişkili değildir. Phase 4I kabul kapısı Assessment V2, legacy koruması ve production build sonuçlarıdır.
