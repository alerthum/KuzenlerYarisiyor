# V11 Aşama 6 — Yanılgıya Göre Mikro Öğretim ve Sessiz Telafi

## Tamamlanan entegrasyon

- Aynı yanılgının en az iki farklı soruda tekrarlanması hedefli müdahale sinyaline dönüştürüldü.
- Sekiz V11 bilişsel ailesi için kısa strateji, örnek yaklaşım ve dikkat noktası tanımlandı.
- Hedef iskelete ait uygun sorular `adaptivePlacement` ile işaretlendi.
- Sessiz telafi toplam oturumun en fazla %25'iyle sınırlandı.
- Müdahale bilgisi `globalQualityAudit.v11MisconceptionRemediation` altında denetlenebilir hâle getirildi.
- Mevcut oyun ekranındaki mikro öğretim alanı V11 yanılgı derslerini doğrudan gösterebilir duruma getirildi.

## Güvenlik kuralları

- Tek bir yanlış cevap öğrenciye kalıcı telafi rotası oluşturmaz.
- Süre aşımı veya tanısız yanlış cevap yanılgı müdahalesi üretmez.
- Telafi yalnız eşleşen `skeletonId` için uygulanır.
- Hedefli sorular oturumun dörtte birini aşamaz.
- Mevcut konu bazlı V9 telafi sistemi korunur; V11 sistemi yalnız bilişsel yanılgı katmanı ekler.
