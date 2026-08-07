# Assessment Engineering Engine V2 — Phase 4G

## Ders ve Sınıf Çapraz Aktarılabilirlik Pilotu

**Durum:** ENGINEERING PASS — HUMAN REVIEW REQUIRED  
**Ürün durumu:** `productReady=false`  
**Oyun adaptasyonu:** Kapalı  
**Legacy içerik:** `UNVERIFIED_LEGACY`

## Sabit hedef

1–12. sınıf, bütün dersler ve ilgili merkezî sınavlar için müfredata bağlı ayrı ders motorları kurmak; doğrulanmış soruları oyunlara yalnız insan incelemesinden sonra uyarlamak.

## Bu fazın amacı

8. sınıf Türkçe üzerinde kurulan ortak kanonik soru hattının tek bir sınıfa veya derse aşırı uyarlanmadığını erken aşamada kanıtlamak.

## Uygulanan üç motor

### 8. Sınıf Matematik — PRE_TYMM

Beş resmî kazanım ve beş solver-backed soru:

- `M.8.1.1.2` — EBOB/EKOK problemi
- `M.8.1.2.5` — Bilimsel gösterimle karşılaştırma
- `M.8.2.2.5` — Doğrusal gerçek hayat modeli
- `M.8.3.1.5` — Pisagor bağıntısı
- `M.8.5.1.5` — Basit olay olasılığı

Ana çözücü ile bağımsız doğrulayıcı farklı algoritmalar kullanır. Yanlış seçenekler işlem hatası değil, EBOB–EKOK karışıklığı, üs yönü, başlangıç değeri, koordinat farkı ve örnek uzay hatası gibi ayrı öğrenci yanılgılarından türetilir.

### 8. Sınıf Fen Bilimleri — PRE_TYMM

Beş resmî kazanım ve beş model/deney temelli soru:

- `F.8.1.1.1` — Mevsimlerin oluşumu
- `F.8.2.2.2` — Tek karakter çaprazlaması
- `F.8.3.1.1` — Katı basıncı
- `F.8.4.5.3` — Isınma ve hâl değişimi grafiği
- `F.8.5.1.1` — Basit makinelerin avantajları

Ana çözücü alan modelini uygular; bağımsız doğrulayıcı gerekli kanıtların tek seçenekte kesişip kesişmediğini kontrol eder.

### 5. Sınıf Türkçe — TYMM

Beş öğrenme çıktısı ve yaş düzeyine göre hazırlanmış beş soru:

- `T.O.5.5` — Bağlamdan söz varlığı anlamı
- `T.O.5.8` — Basit çıkarım
- `T.O.5.11` — Metinler arası karşılaştırma
- `T.O.5.14` — Hikâye unsurları
- `T.O.5.20` — Söz sanatları

8. sınıf soruları küçültülüp 5. sınıfa verilmemiştir. Cümle uzunluğu, bağlam yoğunluğu, ipucu dili ve yanılgı yapıları 5. sınıf için ayrı tasarlanmıştır.

## Ortak kalan katman

- resmî kazanım kaydı ve program sürümü yönlendirmesi,
- kanonik soru sözleşmesi,
- üç kademeli ipucu,
- bütün seçenekler için öğretici açıklama,
- ayrı yanılgı kimlikleri,
- bağımsız doğrulama,
- insan inceleme statüsü,
- oyun adaptasyonu kilidi.

## Ayrı kalan katman

- ders çözücüsü,
- bağımsız doğrulama yöntemi,
- yanılgı kataloğu,
- bağlam ve temsil türü,
- çözüm grafı.

## Mutasyon kapıları

- Matematik cevap anahtarı bozulursa RED.
- Fen sorusunda ikinci tam destekli seçenek oluşturulursa RED.
- Türkçe doğru seçeneğinden gerekli kanıt kaldırılırsa RED.

## Test sonuçları

- Phase 4G özel testleri: **10/10 PASS**
- Assessment V2 tam regresyon: **123/123 PASS**
- Legacy yayın koruması: **2/2 PASS**
- Production build: **PASS**
- Soru sayısı: **15**
- Ders motoru sayısı: **3**
- Kazanım sayısı: **15**
- Program ailesi: **TYMM + PRE_TYMM**

## Dürüst kapsam durumu

Bu faz, üç dersin tam müfredatını tamamlamaz. Yalnız ortak mimarinin farklı ders, sınıf ve program sürümlerinde çalıştığını kanıtlayan çapraz pilottur. Sorular `HUMAN_REVIEW_REQUIRED`, insan inceleme sonucu `NOT_MEASURED` durumundadır.
