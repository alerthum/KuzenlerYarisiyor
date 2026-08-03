# Assessment Engineering Engine V2 — Phase 4H

## Ürün Şekillendirme ve Ders Motorları Panosu

**Durum:** ENGINEERING PASS — HUMAN REVIEW IN PROGRESS  
**Ürün yayını:** `productReady=false`  
**Oyun uyarlaması:** Kilitli  
**Legacy içerik:** `604 × UNVERIFIED_LEGACY`

## Kilitli nihai hedef

1–12. sınıf, tüm dersler ve ilgili merkezî sınavlar için müfredata bağlı ayrı ders motorları kurulacak; doğrulanmış kanonik soru ve görevler oyunlara en son aşamada uyarlanacak.

## Bu fazda yapılanlar

- Mevcut V2 soru üretim varlıklarını tek portföyde birleştiren `production-portfolio.js` oluşturuldu.
- 2026–2027 program yönlendirmesi, zorunlu ders kataloğu, aktif ders motorları, kanonik soru sayıları ve insan inceleme kuyruğu tek JSON kaynağında toplandı.
- Admin > Soru Motoru Komuta Merkezi ekranına “Ders Motorları ve Müfredat Üretim Haritası” paneli eklendi.
- Panelde üretim hattı ayrı kapılar hâlinde gösteriliyor:
  1. Resmî müfredat
  2. Derse özel motor
  3. Kanonik soru/görev
  4. İnsan kalibrasyonu
  5. Oyun uyarlaması
  6. Öğrenci pilotu
  7. Yayın
- Panelin statik gözle kontrol önizlemesi üretildi.
- Portföy sayaçlarının yapay olarak yükselmesini engelleyen mutasyon testi eklendi.

## Güncel dürüst sayaçlar

| Gösterge | Değer |
|---|---:|
| Hedef sınıf | 12 |
| Zorunlu sınıf–ders hücresi | 112 |
| Aktif ders motoru hücresi | 4 |
| Aktif sınıf | 2 |
| Kayıtlı resmî kazanım / öğrenme çıktısı | 91 |
| İçerikle kapsanan kazanım | 46 |
| Kanonik soru / görev | 66 |
| İnsan onaylı soru | 5 |
| İnsan inceleme kuyruğu | 61 |
| Oyuna uyarlanmış V2 soru | 0 |
| Legacy karantina | 604 |

## Aktif motorlar

### 8. sınıf Türkçe
- Program: PRE_TYMM
- Tam resmî kapsam: 76/76 kayıtlı
- Kapsanan kazanım: 31/76
- Kanonik soru: 51
- İnsan onaylı: 5
- Durum: EXPANDING

### 8. sınıf Matematik
- Program: PRE_TYMM
- Pilot kazanım: 5
- Kanonik soru: 5
- Durum: PILOT_VALIDATED
- Tam kapsam aktarımı bekliyor.

### 8. sınıf Fen Bilimleri
- Program: PRE_TYMM
- Pilot kazanım: 5
- Kanonik soru: 5
- Durum: PILOT_VALIDATED
- Tam kapsam aktarımı bekliyor.

### 5. sınıf Türkçe
- Program: TYMM
- Pilot öğrenme çıktısı: 5
- Kanonik soru: 5
- Durum: PILOT_VALIDATED
- Tam kapsam aktarımı bekliyor.

## Sıradaki kesin geliştirme sırası

1. 8. sınıf Matematik tam kapsam matrisi
2. 8. sınıf Fen Bilimleri tam kapsam matrisi
3. 5. sınıf Türkçe TYMM tam kapsam matrisi
4. 8. sınıf Türkçedeki kalan 45 kazanımın dalgalarla kapatılması
5. İnsan inceleme kuyruğunun ürün içinde yönetilmesi

Bu sıra yeni proje açmaz; aynı fabrikanın ders motorlarını genişletir.

## Test kanıtları

- Phase 4H portföy ve panel testleri: **8/8 PASS**
- Assessment V2 tam regresyon: **131/131 PASS**
- Legacy yayın politikası: **2/2 PASS**
- Production build: **PASS**

## Üretilen ana dosyalar

- `js/assessment-v2/production-portfolio.js`
- `js/quality/assessment-v2-production-panel.js`
- `public/assessment-v2-production-dashboard.json`
- `quality-reports/assessment-engine-v2-phase4h-production-dashboard.json`
- `quality-reports/assessment-v2-production-dashboard-preview.html`
- `scripts/build-assessment-v2-phase4h-production-dashboard.mjs`
- `tests/assessment-v2/production-portfolio.test.mjs`
