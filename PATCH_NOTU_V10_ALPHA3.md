# V10 Alpha 3 — Quality Enforcement ve İçerik Envanteri

- Global Quality Engine artık yalnız puan üretmiyor; `REJECT` içerikleri gerçek oturumdan çıkarıyor.
- Üst sınıflarda yapay renkli dosya/rapor bağlamları ve birden fazla ilgisiz çeldirici kritik hata sayılıyor.
- Aynı soru ailesi, düşünme kalıbı ve bağlam şablonunun aynı oturumda tekrarı engelleniyor.
- Yeni öğrencinin ilk oturumunda yalnız APPROVE/GOLD içeriklere izin veriliyor.
- Her oturum `globalQualityAudit.enforcement` altında kabul ve ret gerekçelerini taşıyor.
- `npm run quality:inventory` bütün oyunları örnek sınıflarda tarayarak JSON ve Markdown envanteri oluşturuyor.

Bu sürüm zayıf içerikleri premium içeriklere dönüştürmez; zayıf içeriklerin öğrenciye çıkmasını engelleyen zorunlu kapıyı kurar. Boşalan aileler sonraki premium içerik sprintlerinde yeniden yazılacaktır.
