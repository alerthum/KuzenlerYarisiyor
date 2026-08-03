# Zihin Arenası Assessment Engineering Engine V2 — Master Plan

## Amaç
Zihin Arenası'nın bütün sınıf, ders ve oyunlarında soru metni üretmek yerine ölçülebilir bir öğrenme kanıtı üreten ortak değerlendirme mühendisliği motoru kurmak.

## Değişmez kurallar
1. Oyunlar soru üretmez; yalnız doğrulanmış item modellerini sunar.
2. LLM doğru cevabı belirlemez; alan çözücüsü veya kanıt modeli belirler.
3. Çeldirici rastgele yakın değer değildir; tanımlı öğrenci hata yolunun sonucudur.
4. İpucu ve çözüm ayrı metinler değildir; çözüm grafından türetilir.
5. Yüzey değişikliği yeni bilişsel deneyim sayılmaz.
6. Zorluk etiketi elle basılmaz; karar sayısı, dallanma, temsil dönüşümü ve ön koşul yükünden hesaplanır.
7. Bir model bütün kapılardan geçmeden hiçbir oyun onu PREMIUM olarak göremez.
8. Her faz ayrı Git commit, tag ve bağımsız ZIP checkpoint ile kilitlenir.

## Ortak veri modeli
Her item modeli şu katmanlardan oluşur:
- Construct: ölçülen kazanım ve alt beceriler
- Evidence: öğrencinin hangi davranışı beceriyi kanıtlar
- Task: veriler, kısıtlar, temsil ve etkileşim
- Solution graph: bağımlı çözüm adımları
- Domain solver: doğru cevabı bağımsız hesaplayan motor
- Misconception graph: gerçek yanlış stratejiler
- Feedback graph: hataya özel açıklama
- Hint graph: çözümü söylemeden ilerleten kademeler
- Identity: structural, cognitive, surface kimlikleri
- Calibration: güçlük, ayırt edicilik ve çeldirici çalışma verileri

## Fazlar

### Faz 0 — Güvenli taban ve içerik karantinası
- 13.6.0 baseline commit/tag/ZIP
- Eski 604 içerik `UNVERIFIED_LEGACY`
- V2 onayı olmayan içerik PREMIUM sayılmaz
Kabul: eski uygulama silinmeden V2 paralel çalışır.

### Faz 1 — Ortak Assessment Item Model sözleşmesi
- Construct/Evidence/Task/Solution/Misconception/Hint sözleşmeleri
- Kimlik ve sürümleme
- Domain adapter arayüzü
- Bilinen kötü örneklerden negatif test paketi
Kabul: yanlış cevap, çözüm sızıntısı, rastgele çeldirici, oyun-beceri uyumsuzluğu ve yüzey tekrarı otomatik RED.

### Faz 2 — Matematik ve Olimpiyat alan motoru
- Sembolik doğrulama
- kombinatorik, sayı teorisi, cebir, geometri, değişmez, ekstremal, geri çalışma item modelleri
- buggy-rule tabanlı çeldirici
- çözüm grafından 3 kademe ipucu ve hataya özel geri bildirim
Kabul: en az 12 farklı ana fikir; mutasyonlu yanlış cevapların %100'ü RED; insan örnekleminde 0 kritik hata.

**2026-08-03 mühendislik durumu:** 12/12 solver-backed ana fikir tamamlandı; her modelde bağımsız doğrulayıcı, üç farklı buggy-rule çeldirici ve çözüm grafından türetilen ipuçları mevcut. Otomatik mühendislik kapısı PASS. İnsan uzman örneklemi `NOT_MEASURED`; `productReady=false` ve 604 eski içerik `UNVERIFIED_LEGACY` olarak korunuyor.

### Faz 3 — Okuma/Paragraf kanıt motoru
- iddia, kanıt, kapsam, karşıtlık, amaç, tutum, çıkarım haritası
- doğru seçeneği kanıt kapsama testiyle belirleme
- kapsam genişletme, yardımcı fikri ana fikir yapma, kesinlik ekleme gibi dönüşümler
Kabul: aynı metin haritasının sayı/kelime değişmiş varyantları aynı CX; fen değişken sorusu paragraf oyununa giremez.

### Faz 4 — Sözel mantık ve kısıt çözme motoru
- sıralama, eşleştirme, yerleştirme, zamanlama, grup, koşullu seçim
- bütün çözümleri enumerasyon/SAT-benzeri çözümle doğrulama
- tablo, çizelge, zaman şeridi ve ilişki diyagramı üretimi
Kabul: her seçenek zorunlu/mümkün/imkânsız olarak çözücüyle kanıtlı; tek çözüm gerekiyorsa tam tek çözüm.

### Faz 5 — Fen, sosyal bilim, dil ve görsel alan motorları
- Fen nedensellik/deney modeli
- tarihsel kaynak, kronoloji, harita ve yurttaşlık kanıt modeli
- Türkçe/İngilizce morfoloji-sözdizimi-bağlam modeli
- görsel-uzamsal dönüşüm modeli
Kabul: her alan için en az 10 item model ve alan çözücüsü/kanıt doğrulayıcısı.

### Faz 6 — Müfredat ve knowledge-component grafı
- 1–12 sınıf, ders, ünite, konu, kazanım
- ön koşul ilişkileri
- item model ↔ kazanım ↔ oyun bağlantısı
Kabul: hiçbir model yalnız gameId ile sınıflandırılmaz; bütün modeller kazanım ve beceri kanıtı taşır.

### Faz 7 — Oturum bestecisi ve bilişsel tekrar politikası
- öğrenci bilgi durumu
- hazır oluş ve ön koşul
- bilişsel deneyim pencereleri
- yüzey değil çözüm yolu çeşitliliği
Kabul: 100 oturumda forbidden repeat 0, underfill yerine açık SOURCE_GAP.

### Faz 8 — Kalibrasyon ve canlı öğrenme verisi
- madde güçlüğü
- ayırt edicilik
- çeldirici seçim oranı
- hata sonrası öğrenme kazanımı
- düşük çalışan item model karantinası
Kabul: veri yoksa NOT_MEASURED; sentetik puanla PASS yok.

### Faz 9 — İnsan denetimi ve yayın akışı
- branş uzmanı örneklem denetimi
- hata bildirim ağı
- kaynak/telif kaydı
- model sürümleme ve rollback
Kabul: kritik hata 0; her sürümde rastgele örneklem raporu.

### Faz 10 — Tüm oyunların V2'ye taşınması
- oyunlar alan motorlarından item talep eder
- legacy üreticiler kapatılır
- 1–12 kapsam ve yıllık kapasite
Kabul: bütün aktif oyunlar yalnız V2 item modeli kullanır; ürün kabulü gerçek öğrenci verisiyle tamamlanır.

## Geliştirme sırası
İlk üç motor kabul laboratuvarıdır, hedef değildir:
1. Olimpiyat/Matematik
2. Paragraf/Okuma
3. Sözel Mantık
Bu üç motorun ortak sözleşmesi kanıtlandıktan sonra Faz 5'teki bütün alanlara aynı yapı taşınır.

## Başarı göstergeleri
- Soru sayısı değil doğrulanmış item model sayısı
- Model başına gerçek yanılgı sayısı
- Solver ile doğrulanan varyant sayısı
- Bilişsel benzersizlik
- İpucu sonrası başarı artışı
- Çeldirici çalışma oranı
- Kritik hata oranı
- SOURCE_GAP ve NOT_MEASURED alanlarının dürüst raporu
