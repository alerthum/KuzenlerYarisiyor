# CONTEXT_SNAPSHOT

**Güncelleme:** 2026-08-03 · **Mevcut aşama:** Assessment Engineering Engine V2 — Phase 4J büyük genişleme

## Değişmeyen nihai hedef
1–12. sınıf, tüm dersler ve ilgili merkezî sınavlar için müfredata bağlı ayrı ders motorları kurulur. Kanonik soru/görevler alan çözücüsü ve bağımsız doğrulayıcıdan geçer; insan incelemesi tamamlanmadan oyun adaptasyonu ve yayın açılmaz.

## Son tamamlanan büyük paket
- 8. sınıf Matematik: 52/52 kazanım için mühendislik nesnesi; 43 solver-backed çoktan seçmeli + 9 etkileşimli inşa görevi.
- 8. sınıf Fen Bilimleri: 61/61 resmî kazanım tam kapsam matrisi; 33 kazanım için görev.
- 5. sınıf TYMM Türkçe: 100/100 öğrenme çıktısı tam kapsam matrisi; 25 görev.
- 8. sınıf Türkçe: 76/76 kayıtlı kazanım; 51 görev, 31 kazanım kapsandı.
- Toplam kanonik katalog: 161 görev.
- İnsan onaylı: 5; inceleme kuyruğu: 156.
- Aktif ders motoru: 4 / 112 zorunlu sınıf-ders hücresi.

## Korunan güvenlik durumları
- `productReady=false`
- `gameAdaptationAllowed=false`
- 604 eski içerik `UNVERIFIED_LEGACY`
- Öğrenci pilotu ve madde analizi başlamadı.
- Performans/çizim kazanımları zorla çoktan seçmeliye çevrilmiyor.

## Tek komut
```powershell
npm run assessment:v2:autonomous
```
Bu komut bütün Assessment V2 testlerini, Phase 4J raporunu ve güncel ders motorları panosunu üretir.

## Sıradaki kesin iş kuyruğu
1. 8. sınıf Matematik 52 görevlik insan kalibrasyonu.
2. 8. sınıf Fen kalan 28 kazanım için görev üretimi.
3. 5. sınıf Türkçe kalan 75 öğrenme çıktısı için beceri alanı dalgaları.
4. 8. sınıf Türkçe kalan 45 kazanım için dinleme/konuşma/yazma ve eksik okuma görevleri.
5. 8. sınıf İnkılap Tarihi, Din Kültürü ve İngilizce motorlarının açılması.
6. Ardından 1–12 sınıf-ders matrisi boyunca aynı hatla genişleme.

## Kanıt dosyaları
- `ASSESSMENT_ENGINEERING_V2_PHASE4J_MEGA_EXPANSION.md`
- `quality-reports/assessment-engine-v2-phase4j-mega-expansion.json`
- `quality-reports/assessment-v2-canonical-catalog-161.json`
- `quality-reports/assessment-v2-phase4j-human-review-24.html`
- `public/assessment-v2-human-review-queue.json`
- `public/assessment-v2-autonomous-expansion-plan.json`
