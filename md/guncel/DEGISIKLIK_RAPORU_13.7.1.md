# Zihin Arenası 13.7.1 — P0 Canlı Çıktı Güvenliği

## Bu pakette tamamlananlar

- Phase 5I oturumlarında bir doğrulanmış sorunun ardından eski aile/fallback sorularının eklenmesi durduruldu.
- Kontrollü pilot açıkken yalnız `controlledLaunchPilot=true` görevleri teslim edilir.
- Sınıf–oyun eşleşmesinde doğrulanmış görev yoksa sistem soru uydurmaz; kullanıcıya açık bir güncelleme mesajı gösterir.
- Öğrencinin gördüğü son oturumu denetleyen `tests/live-output` testleri eklendi.
- Soru Motoru Komuta Merkezi sade bir işletme görünümüne dönüştürüldü.
- Komuta Merkezi artık `PRODUCT_ACCEPTANCE` ve Assessment V2 yayın izni birlikte geçmeden “Yayına Hazır” göstermez.
- İnsan inceleme ilerlemesi, onaylanan soru / kanonik soru oranından hesaplanır.
- Yönetim sol menüsü ekran yüksekliğine göre sınırlandı ve kendi içinde kaydırılabilir yapıldı.
- Kök dizindeki Markdown ve PowerShell arşivi `md/` ve `ps/` klasörlerine taşındı; eski aşama raporları `md/raporlar`, kural belgeleri `md/kurallar` altında toplandı.
- Stil dosyası `css/styles.css` konumuna taşındı ve bütün çalışma yolları güncellendi.
- Windows için tek komutlu `BASLAT.cmd` eklendi.
- Vercel ortam değişkenleri yerel env dosyası olmadan okunabilir.

## Doğrulama

- Hedefli canlı çıktı / Phase 5I / Komuta Merkezi testleri: PASS.
- `npm run verify:hotfix`: PASS.
- `npm run build`: PASS.
- Eski tam test bataryasının 50/106 dosyası PASS tamamlandı; `stage09-session-composer` işlemi kapanmadığı için kalan eski batarya durduruldu. Eski `qualityPilotMode=true` beklentisi güncel kontrollü pilot sözleşmesine çevrildi. Ürün hazır olarak işaretlenmemiştir.
- Varsayılan `npm test`, artık hızlı ve canlı çıktıya odaklı güvenlik paketini çalıştırır. Eski geniş batarya `npm run test:legacy:sharded` altında ayrıca korunur.

## Bilinen sınır

Bu paket kötü eski üretimi düzeltmez; kontrollü canlı yola sızmasını engeller. Olimpiyat, Zekâ İstasyonu ve İngilizce gibi bozuk aile motorları sonraki içerik aşamasında yeniden yazılacaktır. Doğrulanmamış içerik şu anda yayın yerine kapalı davranır.
