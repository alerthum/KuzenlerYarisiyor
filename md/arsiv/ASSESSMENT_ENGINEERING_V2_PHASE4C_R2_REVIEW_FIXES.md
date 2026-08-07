# Assessment Engineering Engine V2 — Phase 4C R2

## Durum

8. sınıf Türkçe Pilot-01 insan incelemesinden gelen iki somut sorun düzeltildi. Genel yön olumlu değerlendirilmiş olsa da 12 sorunun tamamı için nihai insan kabulü kaydedilmedi. Bu nedenle `productReady=false` ve oyun adaptasyon kilidi korunur.

## Uygulanan geri bildirimler

### Soru 2 — Şıklardan cevap sızıntısı

Önceki sürümde doğru seçenek tek kapsayıcı ve akademik görünen seçenekti. Üç yanlış seçenek yeniden yazıldı:

- her biri metindeki en az iki kanıt alanına temas eder,
- tüm seçenekler benzer uzunluk ve soyutluk düzeyindedir,
- yanlışlık yalnız kanıt kapsamı veya amaç kaymasından doğar,
- kör şık denetimi PASS verir.

### Soru 12 — Tablo anlamının ilk okumada belirsizliği

- İkinci sütunun katılımcı kişi sayısı olduğu açıklandı.
- Üçüncü sütunun ilgili grup içindeki yüzde olduğu açıklandı.
- Sütun başlıklarına `(kişi)` ve `(%)` birimleri eklendi.
- Düz `<pre>` görünümü kaldırıldı.
- HTML çıktısında `thead`, sütun başlıkları ve satır başlıkları bulunan semantik tablo üretildi.

## Sonraki Türkçe dalgası için kilitlenen kapsam

Pilot-02 aşağıdaki resmî kazanımları kapsayacak:

- `T.8.3.6` — Deyim, atasözü ve özdeyişlerin metne katkısı
- `T.8.3.7` — Benzetme, kişileştirme, konuşturma, karşıtlık ve abartma
- `T.8.3.11` — Anlatım biçimleri
- `T.8.3.21` — Yazarın bakış açısı, öznel/nesnel yaklaşım ve ayrıntı yorumu
- `T.8.3.26` — Metin türleri

Zorunlu yüzey aileleri: kısa öykü, deneme, köşe yazısı, edebî eleştiri, şiirsel söyleyiş, yazar görüşü, benzetme ve kişileştirme.

Gerçek yazarlara uydurma söz atfetmek yasaktır. Alıntı yalnız kamu malı, lisanslı, kullanıcı tarafından sağlanan veya kaynak gösterilebilen resmî metinden alınabilir. Hak durumu belirsizse gerçek yazar adı kullanılmaz; özgün ve atıfsız bir yazar görüşü yazılır.

## Doğrulama

- Assessment V2: 89/89 PASS
- Legacy politika: 2/2 PASS
- Build: PASS
- Human review: PARTIAL_ACCEPTANCE_WITH_REVISIONS
- productReady: false
- gameAdaptationAllowed: false
