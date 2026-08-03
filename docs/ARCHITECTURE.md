# Kuzenler Yarışıyor V5 — Mimari

## Çalışma kipleri

### Yerel kip

`APP_MODE=local` ve `DATA_PROVIDER=local` kullanılır.

- Hesap sistemi açılmaz.
- Demo kuzen profilleri doğrudan çalışır.
- İlerleme tarayıcıda saklanır.
- Tek komut: `npm run dev`.

### Canlı kip

`APP_MODE=vercel` ve `DATA_PROVIDER=firebase` kullanılır.

- `js/bootstrap.js` anonim oyun alanını açmaz.
- Firebase yapılandırması eksikse güvenlik kilidi gösterilir.
- Veli/öğretmen e-posta ve şifreyle, öğrenci kod ve PIN ile giriş yapar.
- Öğrenci ilerlemesi Firestore’a senkronize edilir.

## Katmanlar

### Başlatma ve yapılandırma

- `KUZENLER_AYARLARI.env`: kullanıcı tarafından düzenlenen tek dosya
- `scripts/project-config.mjs`: ayar okuma, doğrulama ve güvenli istemci yapılandırması üretimi
- `js/runtime-config.js`: otomatik oluşturulan tarayıcı yapılandırması
- `js/bootstrap.js`: local/canlı çalışma kapısı

### Oyun uygulaması

- `js/app.js`: mobil arayüz, oturum, çözüm, ipucu, rapor ve yerel analiz ekranları
- `js/games/registry.js`: oyun kataloğu ve sınıf görünürlük kuralları
- `js/state.js`: profil, günlük plan, cevap ve gelişim modeli
- `js/storage.js`: yerel saklama ve canlı senkronizasyon olayı

### İçerik ve kalite

- `js/content*.js`: doğrulanmış statik içerik paketleri
- `js/engines/learning-engine-v4.js`: V5 kalite kapısına bağlanmış Olimpiyat ve Zekâ üreticileri
- `js/engines/paragraph-engine-v4.js`: yeni nesil okuma ve paragraf motoru
- `js/content-quality-v5.js`: karantina, bilişsel derinlik ve ipucu kuralları
- `SORU_KALITE_KAYITLARI.md`: kullanıcı testlerinden gelen kalıcı kalite kayıtları
- `ICERIK_KALITE_KURALLARI.md`: yayın öncesi zorunlu içerik standardı

### Firebase platformu

- `js/platform/firebase-platform.js`: Authentication, veli/öğretmen/öğrenci portalları, sınıf ve öğrenci yönetimi, merkezi analiz ve durum senkronizasyonu
- `firebase/firestore.rules`: rol, sahiplik ve alan değişikliği güvenlik kuralları
- `firebase/firestore.indexes.json`: merkezi sorgu indeksleri

## Canlı veri modeli

- `accounts/{authUid}`: rol ve görünen ad
- `learners/{learnerId}`: çocuk profili, sahiplik ve sınıf bağlantıları
- `learnerStates/{learnerId}`: oyun durumu, beceri, günlük plan, görülen/engellenen sorular
- `learnerMetrics/{learnerId}`: hızlı veli ve öğretmen özetleri
- `attempts/{attemptId}`: değiştirilemeyen soru denemeleri
- `questionReports/{reportId}`: kalite bildirimleri
- `classrooms/{classroomId}`: öğretmen ve öğrenci bağlantıları

## Güvenlik sınırları

- Canlı kipte anonim erişim yoktur.
- Kullanıcı kendi `role` alanını değiştiremez.
- Öğrenci sahiplik alanları istemciden değiştirilemez.
- Öğretmen sınıfın `teacherIds` alanını değiştiremez.
- Denemeler oluşturulduktan sonra güncellenemez veya silinemez.
- Son kapı bütün diğer Firestore yollarını reddeder.

V5 kontrollü pilot altyapısıdır. Üretim ölçeğinde öğrenci oluşturma/PIN sıfırlama ve öğretmen onayı Cloud Functions veya ayrı yönetici API’sine taşınacaktır.
