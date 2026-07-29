# Zihin Arenası V6.5.2 Stabilizasyon Yaması

Bu paket, kullanıcının 29 Temmuz 2026 tarihinde yüklediği gerçek V6.5.1 ana proje üzerinden hazırlanmıştır.

## Ana düzeltmeler

- 11. sınıf: TYT ve AYT kategori filtreleri.
- 12. sınıf: TYT, AYT ve KPSS kategori filtreleri.
- 11–12. sınıf filtrelerinden LGS ve Din kaldırıldı.
- TYT/AYT/KPSS kartlarındaki `undefined` düzeltildi.
- Oyun isimleri tek merkezi Türkçe sözlüğe taşındı.
- Admin/öğretmen/veli oyun analizleri Türkçeleştirildi.
- 8, 11 ve 12. sınıf otomatik sınav planı normalizasyonu düzeltildi.
- 6 yeni stabilizasyon kabul testi eklendi.

## Test sonucu

- 90 test başarılı
- 0 başarısız
- Proje kontrolü başarılı
- Vercel build başarılı

## Uygulama

Paket içeriğini ana proje klasörünün üzerine kopyalayın. Ardından:

```powershell
Ctrl + C
npm run check
npm run dev
```

Firebase kuralları değişmediği için `npm run firebase:deploy` gerekli değildir.
