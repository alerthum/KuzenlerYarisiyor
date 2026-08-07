# Assessment Engineering Engine V2 — Faz 3 Mühendislik Kapanışı

## Durum
- Okuma/Paragraf item modeli: **12/12**
- Otomatik mühendislik kapısı: **PASS**
- Assessment V2 testleri: **51/51 PASS**
- Legacy 604 koruma testleri: **11/11 PASS**
- Build: **PASS**
- İlk insan gözle test paketi: **READY**
- İnsan uzman/öğrenci örneklemi: **NOT_MEASURED**
- Ürün hazır: **HAYIR** (`productReady=false`)
- Eski 604 içerik: **UNVERIFIED_LEGACY**

## Tamamlanan 12 ana fikir
1. Ana düşünce — merkezî iddiaları birlikte kapsama
2. Desteklenen çıkarım — kesinlik ve örneklem sınırı
3. İddia–kanıt eşleştirme — gerçek destek kenarı
4. Kapsam ve kesinlik kontrolü — nicelik, süre ve neden sınırı
5. Yazarın amacı — bilgilendirme ve davranış çağrısını birlikte okuma
6. Yazarın tutumu — olumlu değerlendirme ile çekinceyi birleştirme
7. Karşıtlık ilişkisi — iki yaklaşımın yönünü ve karşılaştırma boyutunu koruma
8. Paragraf işlevi — problem, çözüm denemesi ve sonuç ilişkisi
9. Zorunlu varsayım — kanıt ile sonuç arasındaki gerekli bağlantı
10. Nedensellik sınırı — gözlemsel ilişkiyi nedene dönüştürmeme
11. Metinler arası ilişki — kısmi uzlaşma ve farklı vurgu
12. Kanıt gücü — doğrudanlık, güvenilirlik ve kontrollü karşılaştırma

## Ortak mühendislik sözleşmesi
Her model:
- görevi yapılandırılmış iddia–kanıt haritasından üretir,
- doğru cevabı kanıt sorgusu çözücüsüyle belirler,
- cevabı ayrı kurallar kullanan bağımsız doğrulayıcıyla yeniden denetler,
- üç çeldiriciyi üç farklı öğrenci hata yolundan seçer,
- ipuçlarını ve açıklamaları aynı çözüm grafından türetir,
- aynı bilişsel yapının yüzey varyantlarında aynı CX kimliğini korur,
- uyumsuz oyunlarda `game_construct_mismatch` ile reddedilir.

## Kapanışta yakalanan ve düzeltilen kritik mühendislik kusuru
İlk mutasyon testinde doğru seçenek semantiği ile kanıt haritasındaki iddianın aynı nesne referansını paylaşabildiği görüldü. Seçenek bozulduğunda kanıtın da birlikte değişmesi, hatanın doğrulayıcıdan kaçmasına yol açabiliyordu. Görev üretimi katmanlar arası referansları tamamen ayıracak biçimde değiştirildi. Sonrasında:
- doğru seçeneğe yapay kesinlik ekleme: **RED**,
- iki seçeneği aynı anda geçerli yapma: **RED**,
- iddia–kanıt kenarını değiştirme: cevap yeniden hesaplandı,
- kanıt gücünü değiştirme: eski cevap reddedildi.

## İlk gözle test paketi
- HTML: `quality-reports/assessment-engine-v2-phase3-first-review.html`
- JSON: `quality-reports/assessment-engine-v2-phase3-first-review.json`
- Örnek sayısı: **12**
- Her örnekte: metin, soru kökü, dört seçenek, kapalı cevap alanı, üç hata yolu, geri bildirim ve ipucu grafı bulunur.

## Checkpoint zinciri
- `checkpoint-v2-phase-3a`: kanıt çözücüsü + ilk 4 model — 4/12
- `checkpoint-v2-phase-3b`: amaç, tutum, karşıtlık, paragraf işlevi — 8/12
- `checkpoint-v2-phase-3c`: varsayım, nedensellik, iki metin, kanıt gücü — 12/12
- `checkpoint-v2-phase-3d`: mutasyon kapıları, gözle test paketi, legacy koruması ve build — mühendislik kapanışı

Bu checkpoint Faz 3 mühendislik setini tamamlar. İnsan gözlemi ve gerçek öğrenci verisi henüz ölçülmediği için ürün yayınına izin vermez.
