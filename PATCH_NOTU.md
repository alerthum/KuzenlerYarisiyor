# Kuzenler Yarışıyor V5.4 — Soru İnceleme ve Otomatik Sınav Planı

Bu paket V5.3 ana klasörünün üzerine kopyalanır.

## Gelen değişiklikler

- Bütün soru ekranlarında görünür `Soruyu Durdur` düğmesi.
- Durdurulunca soru ve seçenekler gizlenir; süre ilerlemez.
- Bildirim seçeneklerine `Aynı soru tekrar çıktı` eklendi.
- Admin paneline ayrı `Soru İnceleme` modülü eklendi.
- Bildirimde öğrenci cevabı, sistem cevabı, soru metni, bağlam ve öğrenci notu birlikte gösterilir.
- `AI analiz et` düğmesi kanıtları özetler ve ön değerlendirme üretir.
- Admin kararı: Soru hatalı, Cevap/çözüm hatalı, Öğrenci zorlanmış, Tekrar soru, Geçersiz.
- 8. sınıfa varsayılan LGS planı otomatik atanır.
- 12. sınıfa varsayılan YKS + KPSS planları otomatik atanır.
- 11. sınıfa varsayılan YKS planı otomatik atanır.
- Admin öğrenci düzenlemesinden planları çıkarabilir; `examPlansCustomized` sayesinde sistem tekrar zorla eklemez.
- Service Worker önbelleği V5.4 olarak yenilendi.

## Test sonucu

70 test / 70 başarılı / 0 başarısız.

## Kurulum

ZIP içeriğini mevcut ana klasörün üzerine kopyalayın:

C:\Users\ibrahimyokus\Desktop\Kuzenler_Yarisiyor

Ardından:

```powershell
Ctrl + C
npm run check
npm run dev
```

Yerel test sonrası GitHub:

```powershell
git add .
git commit -m "V5.4 soru inceleme ve otomatik sinav planlari"
git push
```

Vercel GitHub bağlantısı açıksa push sonrasında canlı uygulama otomatik güncellenir.
