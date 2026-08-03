# Cursor Tek Komut — Assessment Engineering Engine V2 Otonom Devam

Bu projeyi `CONTEXT_SNAPSHOT.md` ve `public/assessment-v2-autonomous-expansion-plan.json` dosyalarındaki güncel durumdan devam ettir.

## Değişmeyen hedef
1–12. sınıf, tüm dersler ve ilgili merkezî sınavlar için müfredata bağlı ayrı ders motorları kur. Kanonik soru/görevler oyunlardan bağımsız üretilecek; alan çözücüsü ve farklı bağımsız doğrulayıcıdan geçecek; insan incelemesi tamamlanmadan oyun adaptasyonu veya yayın açılmayacak.

## Otonom çalışma kuralları
- Benden onay bekleme; bir dalga PASS olduğunda sıradaki backlog işine geç.
- Önce `npm run assessment:v2:autonomous` çalıştır ve mevcut kanıtları doğrula.
- Yalnız resmî MEB/ÖSYM programları kazanım kaynağı olabilir. Kaynak belgesi ve sayfa/konum kaydı zorunludur.
- Ortak soru üreticisi oluşturma. Ortak olan yalnız kanonik sözleşme, kalite kapıları, insan inceleme ve oyun adaptasyon protokolüdür.
- Matematikte sayısal/sembolik/geometry solver; Fende deney/model/CER; Türkçede kanıt ve rubrik; diğer derslerde alana özgü doğrulayıcı kullan.
- Doğru cevap farklı yöntemle doğrulansın. Yanlış seçenekler üç ayrı gerçek öğrenci yanılgısından üretilsin.
- İpuçları çözüm grafından türesin; bütün seçenekler veya rubrik ölçütleri öğretici geri bildirim taşısın.
- Performans, konuşma, yazma, deney ve çizim kazanımlarını zorla çoktan seçmeliye dönüştürme.
- `productReady=false`, `gameAdaptationAllowed=false`, 604 legacy `UNVERIFIED_LEGACY` korunacak.
- Her büyük grup ayrı commit, açıklamalı tag ve `.git` içeren ZIP checkpoint ile kilitlensin.
- Tam proje eski testlerinde tabanda bulunan canlı yönlendirme hatalarını yeni değişikliklerle karıştırma; Assessment V2, legacy koruma ve production build zorunlu kapıdır.

## Kesin iş sırası
1. 8. sınıf Matematik 52 görevlik insan inceleme paketlerini 12’lik gruplara böl; karar kayıt defterini güncelle.
2. 8. sınıf Fen 61 görevlik insan inceleme paketlerini deney/model/araştırma/tasarım gruplarına böl.
3. 5. sınıf Türkçede kalan 75 öğrenme çıktısını dinleme, okuma, konuşma ve yazma dalgalarıyla kapat.
4. 8. sınıf Türkçede kalan 45 kazanımı performans ve eksik okuma/dil alanlarıyla kapat.
5. 8. sınıf İnkılap Tarihi, Din Kültürü ve İngilizce için resmî tam kapsam matrisleri ve ilk 12’şer görevlik pilotları oluştur.
6. Sonra `COURSE_SCHEDULE_REGISTRY_2026_2027` sırasıyla 1–12 sınıf-ders hücrelerine genişle.

Her çalışma sonunda `CONTEXT_SNAPSHOT.md`, üretim panosu, otonom backlog, test raporu ve checkpoint SHA-256 dosyasını güncelle.
