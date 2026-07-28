# Kuzenler Yarışıyor v5.0.1 — Doğrulama Eki

- Tek `CALISMA_MODU=local|canli` anahtarı doğrulandı.
- Hazır GitHub ve Firebase Web bağlantıları doğrulandı.
- Yerel build `local/local`, canlı build `vercel/firebase` üretti.
- Firebase Authentication içinde elle oluşturulmuş kullanıcının uygulama `accounts` kaydını tamamlayabileceği kurtarma akışı eklendi.
- Paylaşılan hesap parolası proje dosyalarının hiçbirine yazılmadı.
- `npm run check`: 61/61 test başarılı.
- Yerel HTTP sunucusu ana sayfa ve runtime config için HTTP 200 döndürdü.

---

# Kuzenler Yarışıyor v5.0.0 — Test Raporu

## Genel sonuç

V5 kaynak paketi üzerinde **61 otomatik test** çalıştırıldı.

```text
Toplam test: 61
Başarılı: 61
Başarısız: 0
Atlanan: 0
```

Bunlara ek olarak JavaScript sözdizimi, zorunlu dosyalar, yapılandırma doğrulaması, üretim derlemesi, yerel HTTP sunucusu ve temiz ZIP doğrulaması uygulanmıştır.

## Soru kalite kayıtları

`SORU_KALITE_KAYITLARI.md` içindeki 11 kayıt pakette tutulur ve kritik maddeler çalışan kalite kapısına bağlanır.

Karantinaya alınan challenge aileleri:

- `path-through-checkpoint`
- `book-owner-matching`
- `subset-target`
- `digit-reversal-difference`

Kontrol edilen kurallar:

- Olimpiyat ve Zekâ challenge sorularında bilişsel derinlik en az 4
- Bir oturumda aynı düşünme ailesi en fazla bir kez
- En az iki kademeli, soruya bağlı ipucu
- Yasaklı belirsiz ipucu parçalarının bulunmaması
- Alternatif Kelime Merdiveni yollarının kabul edilmesi
- Küçük profilde Din ve LGS’nin görünmemesi ve açılamaması
- Aynı profil için görülen dinamik sorunun yeniden verilmemesi

## Öğretici çözüm testi

Dikdörtgen sayma ailesinde çözümün aşağıdaki bölümleri taşıdığı doğrulandı:

- Soruyu sadeleştirme
- Ana fikir
- En az beş adım
- Neden çarpıldığı
- Sonuç kontrolü
- Benzer soruya aktarılacak kural

## Uzun tekrar testi

Küçük ve büyük profil için 60 ardışık oturum üretildi:

- Olimpiyat: oturum başına 10 farklı aile
- Zekâ: oturum başına 8 farklı aile
- Paragraf: oturum başına 8 farklı beceri

Aynı görünür dinamik soru kısa dönem içinde aynı profile yeniden verilmedi.

## Hesap ve canlı çalışma testleri

Doğrulanan davranışlar:

- Yerel kip hesap gerektirmeden açılır.
- Canlı kip `DATA_PROVIDER=firebase` ister.
- Canlı kip Firebase ayarları eksikken derlenmez.
- `REQUIRE_AUTH_IN_LIVE=true` zorunludur.
- `ALLOW_ANONYMOUS_PLAY=false` zorunludur.
- Veli, öğretmen ve öğrenci giriş akışları platform kodunda bulunur.
- Çoklu çocuk, sınıf, toplu öğrenci kaydı ve merkezi metrik koleksiyonları tanımlıdır.
- Öğrenci kodu benzersizliği yetkisiz genel Firestore sorgusu yerine Firebase Authentication çakışma kontrolüyle sağlanır.
- Veli ve öğretmen panelinde oyun bazında doğruluk, ipucu ve ortalama süre analizi bulunur.

## Firestore güvenlik testi

Kurallarda aşağıdakiler doğrulandı:

- Kullanıcı kendi hesap rolünü değiştiremez.
- Hesabın durum ve rol alanları normal kullanıcı güncellemesinde sabittir.
- Öğrencinin `authUid`, kod, veli, öğretmen ve sınıf sahipliği alanları istemciden değiştirilemez.
- Öğretmen sınıfın öğretmen sahipliğini değiştiremez.
- Denemeler sonradan güncellenemez veya silinemez.
- Tanımsız bütün yollar varsayılan olarak kapalıdır.

## Matematik ve içerik motoru testleri

Yüzlerce ve bazı ailelerde binlerce tohumla:

- Hedef Sayı çözümleri
- Güvenli kesir ve işlem motoru
- Geometri
- Problem
- Örüntü
- Olimpiyat
- Zekâ
- Paragraf
- İngilizce
- Sosyal
- Fen

sorularının cevap ve seçenek bütünlüğü kontrol edilmiştir.


## Yapılandırma ve HTTP doğrulaması

- Sahte ama biçimsel olarak geçerli Firebase Web değerleriyle `APP_MODE=vercel` derlemesi üretildi; runtime yapılandırmasında Firebase ve zorunlu giriş kapısı doğrulandı.
- Ayar dosyası yeniden yerel varsayılana döndürüldü ve son `dist` paketi local modda yeniden üretildi.
- Yerel sunucuda `/`, `/js/bootstrap.js`, `/js/app.js`, `/styles.css` ve `/manifest.webmanifest` adresleri HTTP 200 döndürdü.

## Uçtan uca Firebase sınırı

Gerçek Firebase projesi ve kullanıcıya ait erişim bilgileri bu pakete verilmediği için canlı Authentication/Firestore işlemleri gerçek sunucuda uçtan uca çalıştırılmadı. Kod, yapılandırma kapısı ve Firestore kuralları hazırdır; ilk canlı deploy sonrasında `DEPLOY_REHBERI.md` içindeki pilot kontrolü uygulanmalıdır.
