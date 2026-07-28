# Kuzenler Yarışıyor v5.0.1

V5; yerelde tek komutla çalışan oyun alanını korur, canlı yayında ise Firebase Authentication ve Firestore üzerinden zorunlu veli–öğretmen–öğrenci hesabı, çoklu çocuk, sınıf, toplu öğrenci kaydı ve merkezi analiz altyapısını açar.

## 1. Yerelde çalıştırma

`KUZENLER_AYARLARI.env` varsayılan olarak hazırdır:

```text
CALISMA_MODU=local
```

Terminal:

```bash
npm run dev
```

Adres:

```text
http://localhost:6220
```

`npm install` gerekmez. Yerel modda hesap sistemi çalışmaz. İki demo kuzen doğrudan kullanılır; “Yerel Ayarlar” ekranındaki PIN yalnız aynı tarayıcıdaki test profillerini korur.

## 2. V5 içerik kalite değişiklikleri

`SORU_KALITE_KAYITLARI.md` içindeki 11 kayıt, otomatik test ve içerik karantinasına bağlandı.

Challenge havuzundan çıkarılan aileler:

- `path-through-checkpoint`: görsel–yön–ızgara çelişkisi
- `book-owner-matching`: çözümsüz koşul kümesi riski
- `subset-target`: Olimpiyat için tek adımlı ve fazla basit
- `digit-reversal-difference`: mekanik basamak farkı

Yeni kurallar:

- Olimpiyat ve Zekâ sorularında bilişsel derinlik en az 4.
- Aynı oturumda aynı soru ailesi yalnız bir kez.
- Challenge sorularında en az iki kademeli ipucu.
- Belirsiz “en kötü olanı düşün” türü ipuçları yasak.
- Dikdörtgen sayma çözümü; sadeleştirme, ana fikir, adımlar, neden çarpma, kontrol ve transfer kuralını gösterir.
- Hatalı soru bildiriminde “kötü ipucu”, “yetersiz çözüm” ve “görsel çelişkisi” kategorileri bulunur.

## 3. Canlı hesap modeli

Canlı modda giriş zorunludur:

### Veli

- E-posta/şifreyle hesap açar.
- Aynı hesap altında birden fazla çocuk oluşturur.
- Her çocuk için öğrenci kodu ve dört haneli PIN üretir.
- Çocukların soru, doğruluk, süre ve ipucu analizlerini toplu görür.
- Her çocuk için oyun bazında güçlü/zayıf alan ve soru kalite bildirimlerini açar.
- İstediği çocuğun oyun görünümüne geçer.

### Öğretmen

- E-posta/şifreyle hesap açar.
- Bir veya daha fazla sınıf oluşturur.
- `Ad Soyad;Sınıf;Yaş` biçiminde toplu liste aktarır.
- Öğrenciler için kod/PIN üretir.
- Sınıf filtresiyle merkezi analiz tablosu görür.
- Her öğrenci için oyun bazında soru, doğruluk, ipucu ve ortalama süre detayını açar.

### Öğrenci

- `KY123456` biçimindeki kod ve dört haneli PIN ile giriş yapar.
- Yalnız kendisine bağlı oyun ve gelişim ekranlarını görür.
- Küçük sınıf profilinde Din/LGS görünmez; sınıf görünürlüğü oyun kataloğu tarafından uygulanır.

## 4. Merkezi veri

Firestore koleksiyonları:

```text
accounts
learners
learnerStates
learnerMetrics
attempts
questionReports
classrooms
organizations
contentItems
```

- `learnerStates`: günlük plan, XP, beceriler, görülen ve engellenen sorular
- `attempts`: her soru denemesi
- `learnerMetrics`: veli/öğretmen paneli için özet metrikler
- `questionReports`: merkezi hatalı soru bildirimleri

## 5. Tek ayar dosyası

Bütün kullanıcı tarafından girilecek yayın ayarları:

```text
KUZENLER_AYARLARI.env
```

GitHub ve Firebase bağlantıları bu pakette hazırdır. Canlıya geçerken yalnızca ilk satırı değiştirin:

```text
CALISMA_MODU=canli
```

Canlı modda şu güvenlik değerleri zorunludur:

```text
REQUIRE_AUTH_IN_LIVE=true
ALLOW_ANONYMOUS_PLAY=false
```

Eksik veya güvensiz ayarla `npm run check` ve `npm run build` başarısız olur.

## 6. Kontrol komutları

```bash
npm test
npm run check
npm run build
```

Tek dosyadaki ayarlarla yardımcı yayın komutları:

```bash
npm run git:publish
npm run firebase:deploy
npm run vercel:deploy
```

Git, Firebase ve Vercel oturum bilgileri ayar dosyasına yazılmaz; ilgili CLI aracında bir kez giriş yapılır.

`npm run check` sırasıyla ayarları üretir, testleri çalıştırır, dosya ve JavaScript sözdizimini doğrular ve `dist` klasörünü hazırlar.

## 7. Pilot sınırları

- Firebase Web bağlantıları hazırdır; gerçek Firestore veritabanı ve kurallar Firebase Console/CLI üzerinden etkinleştirilmelidir.
- Veli/öğretmen rolü pilotta kayıt sırasında kullanıcı tarafından seçilir. Açık okul yayını öncesinde öğretmen rolü davet veya yönetici onayına bağlanmalıdır.
- Öğrenci PIN’i yalnız oluşturma ekranında gösterilir. Yetişkin panelinden PIN sıfırlama için sonraki sürümde güvenli Admin/Cloud Function gerekir.
- İçerik omurgası 1–12. sınıfı kapsar; her sınıfta tam müfredat derinliği ayrı içerik üretim planıyla büyütülmeye devam edecektir.

Ayrıntılar için:

- `DEPLOY_REHBERI.md`
- `GELISIM_PLANI.md`
- `ICERIK_KALITE_KURALLARI.md`
- `SORU_KALITE_KAYITLARI.md`
- `TEST_RAPORU.md`


## 9. Hazır kurulum komutları

Kısa ve doğrudan yayın akışı için `KURULUM_KOMUTLARI.md` dosyasını kullanın.
