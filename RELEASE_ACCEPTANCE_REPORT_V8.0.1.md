# V8.0.1 Sürüm Kabul Raporu

## Düzeltilenler
- Öğrenci alt menüsü 320–430 px aralığında beş öğeyi tek satırda tutacak şekilde sabitlendi.
- Yönetim işlemlerindeki tarayıcı `prompt`, `alert` ve `confirm` pencereleri kaldırıldı.
- Okul, sınıf, öğretmen, veli, öğrenci ve özel PIN işlemleri uygulama içi modal akışına taşındı.
- Silme ve öğrenci çıkış/onay işlemleri uygulama içi onay penceresine taşındı.
- Admin paneli tek uzun sayfa yerine modül bazlı yapıya geçirildi.
- Üst yönetim menüsünden yalnız seçilen modül gösterilir.
- Okul ve sınıf karşılaştırmalı analiz ekranı eklendi.
- Yönetici hesap ayarları ayrı `Hesabım` modülüne taşındı.

## Korunduğu doğrulananlar
- Okul, sınıf, öğretmen, veli ve öğrenci listeleri
- Öğrenci düzenleme, PIN yenileme, özel PIN, analiz ve oyun görünümü
- Pasife alma ve kontrollü silme
- Soru inceleme ve karantina
- PDF öğrenci listesi
- Admin/öğretmen/veli görünüm değiştirme
- LGS, TYT, AYT ve KPSS görünürlük kuralları
- Lig, AI orkestrası, beyaz tahta, hesap makinesi ve soru durdurma

## Test sonucu
- 94 test başarılı
- 0 başarısız
- Proje kontrolü başarılı
- Vercel build başarılı

## Firebase
Firestore kuralları değiştirilmedi. Firebase deploy zorunlu değildir.
