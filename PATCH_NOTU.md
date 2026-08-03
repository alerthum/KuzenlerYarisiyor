# Zihin Arenası V8.0.2 — Admin Metrik Hotfix

## Kök neden
`metricsForLearners()` bir `Map` döndürürken yeni `adminAnalytics()` fonksiyonu bunu dizi sanıp `metrics.map(...)` çağırıyordu. Ayrıca yönetim panelindeki bütün modüller, seçili olmasalar bile önceden render edildiği için Analizler ekranındaki bu hata Genel Bakış dahil tüm admin portalını çökertiyordu.

## Düzeltmeler
- `adminAnalytics()` hem `Map` hem dizi metrik girişini güvenli biçimde kabul eder.
- Admin modülleri yalnız seçildiğinde render edilir.
- Bir modülde beklenmeyen hata oluşursa tüm portal yerine yalnız ilgili modülde hata kartı gösterilir.
- Service Worker önbelleği `v8.0.2` olarak yenilendi.
- Hatanın tekrarını engelleyen üç regresyon testi eklendi.

## Doğrulama
- 97 test / 97 başarılı
- Proje kontrolü başarılı
- Vercel build başarılı
