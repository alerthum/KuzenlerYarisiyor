# Kuzenler Yarışıyor — Soru Kalite Kayıtları

Bu dosya, kullanıcı testlerinde tespit edilen hatalı, çelişkili, tekrar eden veya seviye açısından yetersiz soru tiplerini kalıcı olarak izlemek için tutulur.

## Kullanım Kuralı

Her yeni sürüm hazırlanırken bu dosyaya bakılacak ve her kayıt için şu aksiyonlardan biri uygulanacak:

- **Düzeltildi**
- **Karantinaya alındı**
- **Zorluk seviyesi düşürüldü**
- **Isınma/hız turuna taşındı**
- **Soru ailesi yeniden tasarlandı**
- **Otomatik teste eklendi**
- **İçerik havuzundan çıkarıldı**

---

## Kayıt 001 — Kontrol Noktalı Yol Sorusu

**Durum:** Hatalı ve çelişkili  
**Bölüm:** Olimpiyat Merdiveni  
**Görünen zorluk:** 5/5

### Sorunlar

- Metin “sağa ve yukarı” ilerlemeyi söylüyor.
- Görsel alt yazısı “yalnız sağa ve aşağı ilerle” diyor.
- Başlangıç, kontrol noktası ve hedef görselde işaretli değil.
- Izgara boyutu, verilen hareket sayılarıyla uyumlu değil.
- Görsel ile metin aynı matematiksel modeli temsil etmiyor.

### Gerekli aksiyon

- Bu soru ailesi karantinaya alınmalı.
- Başlangıç, kontrol noktası ve hedef görsel üzerinde zorunlu işaretlenmeli.
- Yön bilgisi tek kaynaktan üretilmeli.
- Izgara boyutu hareket sayısından otomatik türetilmeli.
- Doğru cevap bağımsız hesaplayıcıyla doğrulanmalı.
- Görsel-metin uyumu otomatik teste eklenmeli.

---

## Kayıt 002 — “Toplamı 36 Yapan Üçlü” Sorusu

**Durum:** Fazla basit ve yanlış sınıflandırılmış  
**Bölüm:** Olimpiyat Merdiveni  
**Görünen zorluk:** 5/5

### Soru tipi

14, 20, 5, 9, 2 sayılarından toplamı 36 yapan üçlüyü seçme.

### Sorunlar

- Yalnızca dört seçeneği zihinden toplamak yeterli.
- Örüntü, strateji, çıkarım veya çok adımlı düşünme gerektirmiyor.
- Olimpiyat sorusu niteliği taşımıyor.
- 5/5 zorluk etiketi kesinlikle uygun değil.

### Gerekli aksiyon

- Olimpiyat havuzundan çıkarılmalı.
- En fazla “hızlı zihinden işlem” veya “ısınma turu” bölümüne taşınmalı.
- Zorluk seviyesi 1/5 veya 2/5 olmalı.
- Olimpiyat testlerinde bu tür tek adımlı seçim soruları yer almamalı.

---

## Kayıt 003 — “52 Rakamları Yer Değiştirirse Fark Ne Olur?” Sorusu

**Durum:** Fazla basit  
**Bölüm:** Olimpiyat Merdiveni

### Sorunlar

- 52 → 25 dönüşümünden farkı bulmak tek işlemli ve mekanik.
- Olimpiyat düşünmesi, genelleme, örüntü veya strateji içermiyor.
- Büyük olasılıkla çocukta “bu mu olimpiyat sorusu?” hissi oluşturuyor.

### Gerekli aksiyon

- Olimpiyat havuzundan çıkarılmalı.
- Basamak değeri ısınma sorusu olarak düşük zorlukta kullanılabilir.
- Olimpiyat sürümü üretilecekse genelleme içermeli:
  - İki basamaklı tüm sayılar için farkın yapısı
  - Hangi sayılarda fark belirli bir sayıya bölünür?
  - Rakam farkıyla sonuç arasındaki ilişki
  - Ters çevrilmiş sayılarla örüntü çıkarımı

---

## Kayıt 004 — Ela’nın Kartındaki Sayı

**Durum:** Fazla basit ve yanlış zorluk etiketi  
**Bölüm:** Zekâ İstasyonu  
**Görünen zorluk:** 5/5

### Soru tipi

2, 4, 6 ve 8 arasından 4’ten büyük, 8’den küçük olan sayıyı bulma.

### Sorunlar

- Tek koşulla doğrudan 6 bulunuyor.
- Çeldirici veya çok adımlı düşünme yok.
- Zekâ sorusu olarak sunulması uygun değil.
- 5/5 etiketi ciddi kalite sorunu.

### Gerekli aksiyon

- Zekâ havuzundan çıkarılmalı.
- En fazla 1/5 hız ısınması olarak kullanılmalı.
- Zorluk puanı bilişsel adım sayısından otomatik hesaplanmalı.

---

## Kayıt 005 — Harfleri 2-1-4-3 Sırasıyla Yazma

**Durum:** Fazla mekanik  
**Bölüm:** Zekâ İstasyonu

### Soru tipi

KEDİ → EKİD örneğine göre MASA kelimesini aynı sırayla dönüştürme.

### Sorunlar

- Yalnızca verilen permütasyonu uygulamak yeterli.
- Bir kez kural anlaşıldığında sonraki tüm sorular mekanikleşiyor.
- Zekâ veya olimpiyat içeriği olarak kalıcı değer üretmiyor.

### Gerekli aksiyon

- Tek başına challenge sorusu olarak kullanılmamalı.
- Isınma/hız turuna taşınmalı.
- Zor sürümde:
  - Kural örneklerden çıkarılmalı.
  - Birden fazla dönüşüm birlikte kullanılmalı.
  - Eksik kod bulunmalı.
  - Ters işlem veya hata tespiti istenmeli.

---

## Kayıt 006 — Kelime Merdiveninde Geçerli Alternatif Yolun Reddedilmesi

**Durum:** Doğrulama motoru hatası  
**Örnek:** KASA → KARA → PARA → PARE

### Sorunlar

- Yol kurala uygun olmasına rağmen sistem yalnız kayıtlı örnek yolu kabul etti.
- “PARA” doğrulama sözlüğünde olmadığı için doğru zincir yanlış sayıldı.
- Birden fazla geçerli çözüm bulunan oyunlarda tek örneğe bağlı doğrulama kullanıldı.

### Gerekli aksiyon

- Her adım bağımsız doğrulanmalı.
- Kelime geçerliliği geniş Türkçe sözlükten kontrol edilmeli.
- Ardışık kelimeler arasında tam bir harf değişimi denetlenmeli.
- Kayıtlı örnek çözüm yalnız açıklama amacıyla kullanılmalı.
- Alternatif doğru yollar otomatik kabul edilmeli.

---

## Kayıt 007 — Tek Belirgin Şıklı Sözel/Sosyal Soru

**Durum:** Çeldirici kalitesi yetersiz

### Sorun

Bir soruda “en sağda tarih dersi yazamaz” gibi bir koşul vardı ve yalnız tek seçenekte tarih dersi en sağdaydı. Cevap düşünmeden seçilebiliyordu.

### Gerekli aksiyon

- Çeldiriciler aynı koşul ailesinden üretilmeli.
- Tek bir görsel ipucuyla hemen elenen üç seçenek oluşturulmamalı.
- Her yanlış seçenek gerçek öğrenci hata türüne dayanmalı.
- Çeldirici kalite testi eklenmeli.

---

## Kayıt 008 — Aynı Soru ve Aynı Kalıbın Tekrar Gelmesi

**Durum:** Tekrar önleme yetersiz

### Sorunlar

- Aynı görünür soru tekrar gelebiliyor.
- Değerler değişse bile aynı bilişsel kalıp arka arkaya geliyor.
- Çocuk açısından yeni soru değil, aynı sorunun yeniden boyanmış hâli oluyor.

### Gerekli aksiyon

Tekrar kontrolü üç seviyede yapılmalı:

1. **Soru kimliği tekrarı**
2. **Görünür metin tekrarı**
3. **Soru ailesi/bilişsel kalıp tekrarı**

Aynı oturumda aynı aile en fazla bir kez yer almalı. Yakın oturumlarda aile soğuma süresi uygulanmalı.

---

## Yeni Sürüm Öncesi Zorunlu Kontrol Listesi

- [ ] 5/5 zorluk sorularında en az iki bağımsız akıl yürütme adımı var mı?
- [ ] Olimpiyat sorusu yalnız dört şıkkı hesaplayarak çözülebiliyor mu?
- [ ] Görsel ile metin aynı kuralı mı anlatıyor?
- [ ] Aynı soru ailesi test içinde tekrar ediyor mu?
- [ ] Alternatif doğru çözümler kabul ediliyor mu?
- [ ] Çeldiriciler gerçek hata türlerini temsil ediyor mu?
- [ ] Soru, profil yaşına göre küçümseyici derecede kolay mı?
- [ ] Soru yalnız değer değiştirilmiş eski bir kalıp mı?
- [ ] Hatalı bildirilen soru diğer kullanıcılara kapatılıyor mu?
- [ ] Zorluk etiketi bilişsel derinlikle uyumlu mu?

---

Son güncelleme: 28 Temmuz 2026

---

## Kayıt 009 — Dikdörtgen Sayma Sorularında Yetersiz Çözüm Açıklaması

**Durum:** Sonuç doğru olsa bile öğretici açıklama yetersiz  
**Bölüm:** Olimpiyat Merdiveni  
**Örnek:** 4 satır ve 5 sütunluk kareli tabloda toplam dikdörtgen sayısı

### Mevcut açıklama sorunu

Sistem yalnızca:

`C(5,2) × C(6,2) = 150`

ifadesini gösteriyor. Bu ifade, kombinasyon kavramını henüz bilmeyen öğrenci için çözüm değil; yalnızca sonucun sembolik özeti oluyor.

### Gerekli ayrıntılı çözüm yapısı

1. 4 satırlık kareli tabloda yatay sınır çizgisi sayısı 5'tir.
2. 5 sütunluk tabloda düşey sınır çizgisi sayısı 6'dır.
3. Bir dikdörtgen oluşturmak için:
   - üst ve alt sınır olacak iki yatay çizgi,
   - sol ve sağ sınır olacak iki düşey çizgi seçilir.
4. 5 yatay çizgiden 2 tanesini seçmenin 10 yolu vardır:
   - 4 + 3 + 2 + 1 = 10
   - veya C(5,2) = 10
5. 6 düşey çizgiden 2 tanesini seçmenin 15 yolu vardır:
   - 5 + 4 + 3 + 2 + 1 = 15
   - veya C(6,2) = 15
6. Her yatay çizgi çifti, her düşey çizgi çiftiyle bir dikdörtgen oluşturur.
7. Bu nedenle toplam:
   - 10 × 15 = 150 dikdörtgen

### Gerekli aksiyon

- Çözüm yalnız formül göstermemeli.
- Formülden önce çizgi seçme mantığı açıklanmalı.
- Kombinasyon bilmeyen öğrenci için toplama yöntemi de gösterilmeli.
- Görsel üzerinde seçilen iki yatay ve iki düşey çizgi renklendirilerek örnek dikdörtgen gösterilmeli.
- “Neden çarpıyoruz?” sorusu açıkça açıklanmalı.
- Her olimpiyat çözümünde en az şu bölümler bulunmalı:
  - Soruyu sadeleştir
  - Ana fikir
  - Adım adım çözüm
  - Neden bu işlem?
  - Kontrol
  - Benzer soruda kullanılacak kural

---

## Kayıt 010 — Genel ve Sorudan Kopuk İpucu Üretimi

**Durum:** İpuçları belirsiz, genel veya çözüm sırasıyla uyumsuz  
**Bölüm:** Zekâ, Olimpiyat ve Olasılık oyunları

### Tespit edilen örnekler

- “Önce büyük çarpma veya fark olayını bul.”
- Sayılar 7, 14, 2, 4 iken çözümde önce 2 ile 4 çarpıldığı hâlde ipucu çözüm yolunu doğru yönlendirmiyor.
- Olasılık sorularında yalnızca “En kötü olanı düşün.” deniliyor.

### Sorunlar

- İpucu sorunun verilerine doğrudan bağlanmıyor.
- Çocuğa neyi karşılaştıracağı veya hangi küçük adımı atacağı söylenmiyor.
- Çözüm motoru ile ipucu motoru aynı çözüm planını kullanmıyor.
- “En kötü durumu düşün” gibi ifadeler kavramı açıklamadan veriliyor.
- İpucu bazen çözümün gerçek ilk adımıyla çelişiyor.

### Gerekli ipucu mimarisi

Her soru için ipuçları, doğrulanmış çözüm planından otomatik türetilmeli.

#### İpucu 1 — Yön buldurma

Sorunun hangi bilgisinin önemli olduğunu gösterir, işlem vermez.

Örnek:
“Önce hangi iki sayının birlikte kullanıldığında diğer iki sayıyla anlamlı bir ilişki kurduğunu kontrol et.”

#### İpucu 2 — Temsil veya küçük adım

Çocuğa tablo, gruplama veya ilk karşılaştırmayı yaptırır.

Örnek:
“2 × 4 işlemini hesapla. Sonra 14 − 7 sonucuyla karşılaştır.”

#### İpucu 3 — Çözüm kapısı

Çözümün başlangıç adımını açıkça verir ancak son cevabı söylemez.

Örnek:
“2 × 4 = 8 ve 14 − 7 = 7. Bu iki sonucu kullanarak seçeneklerdeki kuralı kontrol et.”

### Olasılıkta “en kötü durum” için doğru ipucu örneği

Belirsiz:
“En kötü olanı düşün.”

Doğru kademeli anlatım:
1. “İstediğin sonuç çıkmadan önce kaç başarısız seçim yapılabilir?”
2. “Garanti sonucu bulmak için, olabilecek en fazla başarısız seçime 1 ekle.”
3. “Örneğin üç farklı renkten aynı renkte iki top garanti etmek istiyorsan, önce her renkten birer tane çekmiş olabileceğin durumu düşün.”

### Gerekli aksiyon

- Her soru ailesinin kendi ipucu şablonları olmalı.
- İpuçları, sorunun gerçek sayıları ve nesneleriyle doldurulmalı.
- İpucu sırası çözüm adımlarıyla aynı olmalı.
- Genel ve her soruya yapıştırılabilecek ifadeler yasaklanmalı.
- İpucu kalite testinde şu kontrol yapılmalı:
  - Soruya özgü sayı veya kavram içeriyor mu?
  - Çözümün doğru adımına mı yönlendiriyor?
  - Son cevabı doğrudan söylüyor mu?
  - Önceki ipucundan daha açıklayıcı mı?
- Hatalı ipucu bildirimi, soru bildiriminden ayrı kategori olarak kaydedilmeli.

---

## Yeni Ek Kontroller

- [ ] Çözüm, formülü bilmeyen öğrenci tarafından anlaşılabilir mi?
- [ ] “Neden çarpıyoruz/topluyoruz/seçiyoruz?” açıklanmış mı?
- [ ] İpucu, sorunun gerçek verilerini kullanıyor mu?
- [ ] İpucu ile çözüm aynı adım sırasını izliyor mu?
- [ ] Genel ve belirsiz ifadeler yerine uygulanabilir bir sonraki adım veriliyor mu?
- [ ] Olasılıkta “en kötü durum” kavramı örnekle açıklanıyor mu?

---

## Kayıt 011 — Kitap Eşleştirme Sorusu Çözümsüz

**Durum:** Mantıksal olarak tutarsız; geçerli çözüm yok  
**Bölüm:** Zekâ İstasyonu / Sözel Mantık  
**Görünen zorluk:** 5/5  
**Soru ailesi:** book-owner-matching

### Verilen koşullar

- Lara, Kaan ve Ceren; Masal, Bilim ve Şiir kitaplarından birer tane okuyor.
- Her kitap yalnızca bir kişiye ait.
- Lara Şiir okumadı.
- Kaan Masal okudu.
- Ceren Şiir okumadı.

### Neden çözümsüz?

1. Kaan'ın kitabı kesin olarak Masal'dır.
2. Geriye Lara ve Ceren için Bilim ile Şiir kalır.
3. Lara Şiir okuyamaz.
4. Ceren de Şiir okuyamaz.
5. Bu durumda Şiir kitabını okuyabilecek hiç kimse kalmaz.

Dolayısıyla bütün koşulları aynı anda sağlayan bir eşleştirme yoktur.

Sistemin “Ceren – Bilim” cevabını doğru kabul etmesi yetersizdir. Ceren Bilim olduğunda Lara'nın Şiir okuması gerekir; bu da “Lara Şiir okumadı” koşuluyla çelişir.

### İpucu sorunu

“Kesin bilgiyi tabloya yerleştir.” ifadesi fazla geneldir ve çelişkiyi fark ettirecek anlamlı bir adım sunmaz.

Daha doğru bir ipucu:

1. “Önce Kaan'ın Masal kitabını kullandığını işaretle.”
2. “Geriye hangi iki kitap kaldı?”
3. “Lara ve Ceren'in ikisi de Şiir okuyamıyorsa Şiir kitabını kim okuyabilir?”

Bu ipuçları sonunda öğrenci, sorunun çözümsüz olduğunu fark edebilmelidir.

### Gerekli aksiyon

- Bu soru mevcut içerik havuzundan çıkarılmalı ve karantinaya alınmalı.
- Tüm eşleştirme soruları yayınlanmadan önce bağımsız mantık çözücüsüyle kontrol edilmeli.
- Her soruda tam olarak:
  - en az bir çözüm,
  - tercihen yalnız bir çözüm,
  - doğru seçenekle aynı çözüm
  bulunmalı.
- Hiç çözümü olmayan veya birden fazla çözümü bulunan sorular otomatik olarak yayın dışı bırakılmalı.
- Açıklama metni elle varsayılmamalı; doğrulanmış çözüm tablosundan üretilmeli.
- Çeldiriciler, geçerli çözümün koşullarını ihlal eden gerçek hata türlerinden oluşturulmalı.
- Otomatik test şu kontrolleri yapmalı:
  - Koşullar birlikte çözülebiliyor mu?
  - Çözüm sayısı tam olarak 1 mi?
  - İşaretli doğru seçenek bu çözümle eşleşiyor mu?
  - Açıklamadaki her çıkarım koşullarla uyumlu mu?
  - İpucu, çözüm veya çelişki yolunun gerçek bir adımını mı gösteriyor?

---

## Yeni Ek Kontroller

- [ ] Sözel mantık sorusunun en az bir geçerli çözümü var mı?
- [ ] Çözüm sayısı tam olarak bir mi?
- [ ] Doğru seçenek, çözücünün bulduğu sonuçla aynı mı?
- [ ] Açıklama bütün koşulları birlikte dikkate alıyor mu?
- [ ] Bir seçenek doğru görünürken başka bir koşulu ihlal ediyor mu?
- [ ] İpucu, genel bir cümle yerine somut bir mantık adımı veriyor mu?

