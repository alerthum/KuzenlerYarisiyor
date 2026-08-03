# Context Snapshot protokolü

## Dosya
Proje kökünde sürekli güncellenen tek dosya:

`CONTEXT_SNAPSHOT.md`

## Boyut
Hedef 2–5 KB. En fazla 8 KB.
Kod parçaları, uzun loglar ve tekrar eden açıklamalar eklenmez.

## Her aşama sonunda zorunlu içerik
- Çalışma kimliği
- Mevcut aşama
- Tamamlanan aşamalar
- Alınan mimari kararlar
- Değişen dosyalar
- Eklenen testler
- Son test sonuçları
- Açık engeller
- Bilinen riskler
- Sonraki kesin işlem
- Değişmez ürün kuralları
- Yeniden okunması gereken ilgili dosyalar

## Yeni oturum başlangıcı
Yeni oturum:
1. `CONTEXT_SNAPSHOT.md` okur.
2. Durum/puan/engel dosyalarını okur.
3. Aktif aşama dosyasını okur.
4. Snapshot'ta belirtilen ilgili kaynak dosyaları açar.
5. Bütün projeyi yeniden taramaz.

## Snapshot doğruluğu
- Yapılmayan iş yapılmış yazılamaz.
- Çalıştırılmayan test PASS yazılamaz.
- Eski veya geçersiz kararlar tutulamaz.
- Bir karar değiştiyse eski karar “superseded” olarak tek satırla belirtilir.
