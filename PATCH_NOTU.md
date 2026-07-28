# V5.0.4 Oturum ve Admin Görünüm Yaması

Bu yama çalışan V5.0.3 ana proje klasörünün üzerine kopyalanır.

## Düzeltilenler

- Admin, öğretmen ve veli önizlemelerinde admin görünüm seçici sürekli görünür.
- Öğretmen veya veli görünümünden admin paneline geri dönülebilir.
- Önizleme modu gerçek `admin` rolünü değiştirmez.
- Çıkış işlemi giriş ekranını hemen açar.
- Çıkıştan sonra yeniden giriş için Ctrl+Shift+R gerekmez.
- Çıkış sırasında seçili öğrenci ve önizleme bilgileri temizlenir.
- Service worker önbellek sürümü 5.0.4'e yükseltildi.

## Değiştirilmeyenler

- `KUZENLER_AYARLARI.env`
- Firebase bağlantı bilgileri
- Firestore verileri
- `.git` klasörü ve GitHub bağlantısı
- Firestore güvenlik kuralları

## Uygulama

ZIP içindeki dosya ve klasörleri doğrudan ana proje klasörünün üzerine kopyalayın ve dosyaların değiştirilmesini onaylayın.

Ardından:

```powershell
Ctrl + C
npm run check
npm run dev
```

Test başarılıysa:

```powershell
git add .
git commit -m "V5.0.4 admin gorunum ve oturum duzeltmesi"
git push
```
