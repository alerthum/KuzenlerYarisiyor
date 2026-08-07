# Zihin Arenası V6.0 + V6.5 Ürün Mimarisi

## Değişmeyen yol haritası

1. **V6.0 — Premium Yönetim ve Regresyon Güvencesi**
2. **V6.5 — Akıllı İçerik Motoru ve MEB Kazanım Sistemi**
3. **V7.0 — Sosyal Platform:** ligler, sezonlar, kulüpler ve aile yarışları
4. **V8.0 — AI Eğitim Asistanı:** koç, öğretmen, analist ve soru denetçisi

## V6.0 güvence sözleşmesi

- Öğrenci, öğretmen, veli, sınıf ve okul işlemleri özellik envanterinden silinemez.
- Mobil kart tasarımı değiştirilse bile eylem yetenekleri merkezi kayıtla korunur.
- Her yeni sürüm, adlandırma, öğrenci oturumu, PIN, düzenleme, sıralama, soru bildirimi ve gelişim kayıtlarını test eder.
- Eski Firebase proje kimliği ve veri koleksiyonları korunur. Marka değişikliği mevcut öğrenci gelişimini sıfırlamaz.

## V6.5 akıllı öğrenme katmanı

Altı uzman ajan aynı öğrenci modeli üzerinde çalışır:

1. **Öğrenci Tanıma AI:** doğruluk, süre, ipucu, tekrar ve alışkanlık örüntüsü.
2. **Sınıf Analisti AI:** ortak eksikler ve öğretmen öncelikleri.
3. **Öğrenme Koçu AI:** günlük kısa rota ve motivasyon.
4. **İçerik Editörü AI:** zorluk, çeşitlilik ve tekrar kapısı.
5. **Ölçme Değerlendirme AI:** ders/kazanım kapsaması ve sınav uyumu.
6. **Soru Denetçisi AI:** öğrenci bildirimi, cevap anahtarı ve tekrar sinyallerini ayırır.

Bu sürümde ajanlar veriye dayalı yerel karar motorlarıdır. Dış bir üretken AI sağlayıcısına bağlanmak için aynı sözleşme korunacaktır. API anahtarı olmadan çalışan özellikler kapanmaz.

## İçerik kalite kapısı

- Aynı oturumda aynı soru imzası ikinci kez kabul edilmez.
- Geçmişte görülen `questionKey` yeniden seçilmez.
- 4. sınıftan sonra tek adımlı ve aşırı kolay soru kalıpları elenir.
- 7–8. sınıfta yorum, çıkarım, tablo/grafik veya çoklu koşul aranır.
- 11–12. sınıfta bilişsel derinlik eşiği yükseltilir.
- Bir soru ailesi oturumun üçte birinden fazlasını kaplayamaz.

## MEB kazanım omurgası

Bu paket ders kapsama matrisini, sınıfa göre ders listesini ve sınav planı varsayımlarını kod seviyesine taşır. Tam kazanım kodlarının ve tüm soru havuzunun editoryal olarak doldurulması devam eden içerik işidir; sistem eksik dersleri görünür kılar ve veri olmayan alanları “Veri bekliyor” olarak gösterir.

## Rakiplerden alınan ürün ilkeleri

- Duolingo: seri, kısa günlük rota ve kişiselleştirilmiş tekrar.
- ClassDojo: öğretmen–veli bağlantısı ve öğrenci portfolyosu.
- Wordwall: aynı içeriği farklı etkinlik şablonlarıyla sunma.
- Kahoot/Quizizz: canlı yarışma, ödev ve anlık rapor.
- Brilliant: adım adım derin düşünme.
- Chess.com/Sudoku: lig, sezon, günlük meydan okuma ve geri dönüş alışkanlığı.

Bu ilkelerin sosyal katmanı V7.0’da tamamlanacaktır.
