export const V4_QUALITY_POLICY = Object.freeze({
  version: '4.0.0',
  minCognitiveDepthForChallenge: 3,
  maxSameFamilyPerSession: 1,
  maxSameFamilyAcrossRecentSessions: 2,
  curriculumMix: { review: 0.30, current: 0.50, preview: 0.20 },
  labels: {
    review: 'Geçen sınıf tekrarı',
    current: 'Bulunduğu sınıf',
    preview: 'Bir üst sınıfa hazırlık'
  }
});

export const GRADE_CURRICULUM = Object.freeze({
  1: { turkish:['Ses-harf ilişkisi','Kısa metin anlama'], math:['20 içinde sayılar','Toplama-çıkarma'], science:['Canlı-cansız','Duyu organları'], social:['Aile ve okul'], english:['Selamlaşma','Renkler-sayılar'] },
  2: { turkish:['Akıcı okuma','Metin sıralama'], math:['100 içinde işlemler','Örüntü'], science:['Madde ve çevre'], social:['Yakın çevre'], english:['Sınıf eşyaları','Basit yönergeler'] },
  3: { turkish:['Ana fikir başlangıcı','Sözcük anlamı'], math:['Çarpma-bölme','Kesre giriş'], science:['Kuvvet ve madde'], social:['Harita-yön başlangıcı'], english:['Günlük rutin','Basit cümle'] },
  4: { turkish:['Paragrafta çıkarım','Neden-sonuç'], math:['Çok adımlı problemler','Kesir-geometri'], science:['Besinler-kuvvet-madde'], social:['Kronoloji-yön-bilinçli tüketim'], english:['Present simple','Kelime ve cümle kurma'] },
  5: { turkish:['Paragraf yapısı','Sözel mantığa giriş'], math:['Kesirler-ondalık','Veri ve geometri'], science:['Güneş-Dünya-canlılar'], social:['Kültür-harita-haklar'], english:['Günlük yaşam','Saat ve sıklık'] },
  6: { turkish:['Çıkarım ve metinler arası ilişki'], math:['Oran-cebir-veri'], science:['Sistemler-kuvvet-madde'], social:['Tarihî süreçler-kaynak'], english:['Past simple','Karşılaştırma'] },
  7: { turkish:['Çeldirici analizi','Sözel mantık'], math:['Oran-yüzde-denklemler'], science:['Hücre-kuvvet-enerji'], social:['Osmanlı-ekonomi-demokrasi'], english:['Biographies-environment'] },
  8: { turkish:['LGS paragraf ve mantık'], math:['Çarpanlar-üslü-kareköklü-olasılık'], science:['Mevsimler-DNA-basınç-enerji'], social:['İnkılap tarihi'], english:['LGS dil işlevleri'] },
  9: { turkish:['Metin türleri-anlatım'], math:['Mantık-kümeler-denklemler'], science:['Fizik-kimya-biyoloji temelleri'], social:['Tarih-coğrafya temelleri'], english:['A2-B1 dil yapıları'] },
  10:{ turkish:['Edebî dönem ve türler'], math:['Fonksiyonlar-geometri'], science:['Basınç-dalgalar-kimya-biyoloji'], social:['Tarih-coğrafya yorum'], english:['B1 okuma-yazma'] },
  11:{ turkish:['Edebiyat ve yorum'], math:['Trigonometri-analitik'], science:['Elektrik-organik-sistemler'], social:['Tarih-coğrafya analiz'], english:['B1-B2 akademik kelime'] },
  12:{ turkish:['TYT-AYT paragraf-edebiyat'], math:['Limit-türev-integral'], science:['AYT fizik-kimya-biyoloji'], social:['TYT-AYT sosyal'], english:['B2 sınav okuması'] }
});

export const DISCOVERY_CARDS = [
  { id:'d-azim-1', minGrade:1, maxGrade:5, theme:'persistence', title:'Bugünün keşfi: Bir hata, yeni bir yol', body:'Bir soruda yanılmak beynin “burada yeni bir bağlantı kurmalıyım” demesidir. Çözümü inceledikten sonra benzer bir soruyu yeniden denemek öğrenmeyi güçlendirir.', author:'Öğrenme notu', book:'Matilda — Roald Dahl' },
  { id:'d-merak-1', minGrade:3, maxGrade:8, theme:'curiosity', title:'Merak pusuladır', body:'Bilimde güçlü sorular çoğu zaman doğru cevaptan önce gelir. “Neden böyle?” sorusunu bir kez daha sormak yeni bir çözüm yolu açabilir.', author:'Bilimsel düşünme notu', book:'Meraklı Zihinler İçin Bilim — yaşa uygun bilim seçkisi' },
  { id:'d-strateji-1', minGrade:3, maxGrade:12, theme:'strategy', title:'Zor soruyu küçült', body:'Bir problem karmaşık görünüyorsa önce daha küçük sayılarla veya daha basit bir şekille dene. Küçük örnekte gördüğün düzen, büyük sorunun anahtarı olabilir.', author:'Olimpiyat stratejisi', book:'Şeytanın Altın Tüyü — Matematik öyküleri seçkisi' },
  { id:'d-okuma-1', minGrade:4, maxGrade:12, theme:'reading', title:'Metnin söylediği ile düşündürdüğünü ayır', body:'Paragraf sorularında doğru seçenek çoğu zaman metnin aynısını tekrar etmez; metindeki iki bilgiyi birleştirerek ulaşılabilen sonucu söyler.', author:'Okuma stratejisi', book:'Momo — Michael Ende' },
  { id:'d-zaman-1', minGrade:5, maxGrade:12, theme:'time', title:'Süreyi soruya göre böl', body:'Her soruya eşit süre vermek adil görünür ama doğru değildir. Hız sorularını seri çöz, çok koşullu sorularda ise önce kısa bir plan kur.', author:'Sınav stratejisi', book:'Zaman Makinesi — H. G. Wells' },
  { id:'d-lgs-1', minGrade:7, maxGrade:8, theme:'lgs', title:'LGS kalıbı: veriyi dönüştürme', body:'LGS’de birçok soru işlemi doğrudan istemez. Metin, tablo veya grafikteki bilgiyi matematiksel ilişkiye dönüştürmeni bekler. Önce “hangi bilgi hangi büyüklüğü temsil ediyor?” diye sor.', author:'LGS çalışma notu', book:'İnsan Ne ile Yaşar? — Lev Tolstoy' },
  { id:'d-english-1', minGrade:3, maxGrade:8, theme:'english', title:'Kelimeyi tek başına değil cümleyle öğren', body:'Bir İngilizce kelimeyi Türkçe karşılığıyla birlikte kısa bir cümlede görmek, kelimeyi daha uzun süre hatırlamana yardımcı olur.', author:'Dil öğrenme notu', book:'The Little Prince / Küçük Prens — Antoine de Saint-Exupéry' }
];

export const V4_PARAGRAPH_BANK = [
  {
    id:'p4-evidence-01', familyId:'evidence-selection', minGrade:3, maxGrade:5, cognitiveDepth:3,
    context:'Bir sınıf, aynı tür iki bitkiden birini güneş alan pencereye, diğerini karanlık dolaba koydu. İki bitkiye de eşit miktarda su verildi. Bir hafta sonra pencere önündeki bitki daha canlıydı.',
    prompt:'Bu deneyden çıkarılabilecek en güvenilir sonuç hangisidir?',
    options:['Işık, bitkinin gelişimini etkileyebilir.','Dolaptaki bütün bitkiler ölür.','Bitkiler yalnız suyla büyür.','Pencere önündeki toprak her zaman daha verimlidir.'], answerValue:'Işık, bitkinin gelişimini etkileyebilir.',
    explanation:'Yalnız ışık koşulu değiştirilmiştir. Sonuç “etkileyebilir” biçiminde sınırlı kurulmalıdır.',
    detailedOptions:['Doğru: Deneyde değiştirilen koşul ışık miktarıdır.','Bir haftalık deney bütün bitkiler için kesin hüküm vermez.','İki bitki de su aldığı hâlde sonuç farklıdır.','Toprak verimliliği değiştirilmemiş veya ölçülmemiştir.']
  },
  {
    id:'p4-order-01', familyId:'event-order', minGrade:3, maxGrade:5, cognitiveDepth:3,
    context:'Mert önce kitaplıktaki kitapları türlerine göre ayırdı. Ardından her grubu yazar adına göre sıraladı. Son olarak etiketleri raflara yapıştırdı.',
    prompt:'Mert’in yaptığı işlerin doğru sırası hangisidir?',
    options:['Türlere ayırma → Yazara göre sıralama → Etiketleme','Etiketleme → Türlere ayırma → Yazara göre sıralama','Yazara göre sıralama → Etiketleme → Türlere ayırma','Türlere ayırma → Etiketleme → Yazara göre sıralama'], answerValue:'Türlere ayırma → Yazara göre sıralama → Etiketleme',
    explanation:'“Önce, ardından, son olarak” ifadeleri olay sırasını doğrudan verir.'
  },
  {
    id:'p4-mainidea-01', familyId:'main-idea', minGrade:3, maxGrade:6, cognitiveDepth:3,
    context:'Bir müzik aleti çalmayı öğrenen kişi ilk günlerde birçok hata yapabilir. Düzenli ve kısa çalışmalar, tek seferde yapılan uzun çalışmalardan daha kalıcı sonuç verebilir. Önemli olan her gün küçük de olsa ilerlemektir.',
    prompt:'Parçanın ana düşüncesi hangisidir?',
    options:['Düzenli küçük çalışmalar kalıcı gelişim sağlayabilir.','Müzik aleti çalmak yalnız yetenek işidir.','Uzun çalışmalar her zaman daha etkilidir.','Hata yapan kişi çalışmayı bırakmalıdır.'], answerValue:'Düzenli küçük çalışmalar kalıcı gelişim sağlayabilir.',
    explanation:'Metindeki tüm cümleler düzenli ve sürdürülebilir çalışmanın değerini destekler.'
  },
  {
    id:'p4-irrelevant-01', familyId:'irrelevant-information', minGrade:4, maxGrade:7, cognitiveDepth:4,
    context:'Bir okulun geri dönüşüm kulübü üç ay boyunca kâğıt atık miktarını ölçtü. İlk ay 40, ikinci ay 55, üçüncü ay 70 kilogram kâğıt toplandı. Kulüp odasının duvarları geçen yıl maviye boyanmıştı.',
    prompt:'Kulübün topladığı kâğıt miktarındaki değişimi yorumlamak için hangi bilgi gereksizdir?',
    options:['Kulüp odasının duvarlarının rengi','İlk ay toplanan miktar','İkinci ay toplanan miktar','Üçüncü ay toplanan miktar'], answerValue:'Kulüp odasının duvarlarının rengi',
    explanation:'Duvar rengi, kâğıt miktarının aylara göre değişimiyle ilişkili değildir.'
  },
  {
    id:'p8-inference-01', familyId:'implicit-inference', minGrade:6, maxGrade:9, cognitiveDepth:4,
    context:'Bir araştırmada öğrencilerin bir bölümü ders çalışırken telefonlarını başka bir odada bıraktı, diğer grup telefonu masada tuttu. Her iki grup aynı metni aynı sürede okudu. İlk grup metinle ilgili sorularda daha yüksek başarı gösterdi.',
    prompt:'Bu araştırmaya dayanarak aşağıdakilerden hangisine ulaşılabilir?',
    options:['Telefonun görünür olması dikkati olumsuz etkileyebilir.','Telefon kullanan herkes başarısız olur.','Okuma başarısını yalnız telefon belirler.','İlk gruptaki öğrenciler daha zekidir.'], answerValue:'Telefonun görünür olması dikkati olumsuz etkileyebilir.',
    explanation:'Araştırma olası bir dikkat etkisini gösterir; kesin ve genelleyici hükümler desteklenmez.',
    detailedOptions:['Doğru ve ölçülü çıkarımdır.','“Herkes” ifadesi veriyi aşar.','Başarıyı etkileyen tek unsur olduğu gösterilmemiştir.','Zekâ ölçülmemiştir.']
  },
  {
    id:'p8-argument-01', familyId:'argument-evaluation', minGrade:6, maxGrade:10, cognitiveDepth:5,
    context:'Bir öğrenci, “Okul kütüphanesi daha geç kapanmalı çünkü sınav haftasında çalışma salonundaki bütün masalar doluyor.” diyor.',
    prompt:'Öğrencinin görüşünü en güçlü biçimde destekleyecek ek bilgi hangisidir?',
    options:['Akşam saatlerinde kütüphaneyi kullanmak isteyen çok sayıda öğrenci olduğu','Kütüphanenin duvarlarının yeni boyandığı','Bazı öğrencilerin spor kulübüne katıldığı','Okuldaki kitapların farklı renklerde olduğu'], answerValue:'Akşam saatlerinde kütüphaneyi kullanmak isteyen çok sayıda öğrenci olduğu',
    explanation:'Öneri kapanış saatinin uzatılmasıdır; akşam talebini gösteren veri görüşü doğrudan destekler.'
  },
  {
    id:'p8-tabletext-01', familyId:'text-data-integration', minGrade:6, maxGrade:9, cognitiveDepth:5,
    context:'Bir okuma kulübünde ocakta 24, şubatta 30, martta 29 kitap okunmuştur. Mart ayında kulübe yeni üyeler katılmış ancak sınav haftası nedeniyle toplantı sayısı azaltılmıştır.',
    prompt:'Veriler ve açıklama birlikte düşünüldüğünde en uygun yorum hangisidir?',
    options:['Yeni üyelere rağmen toplantıların azalması marttaki artışı sınırlamış olabilir.','Mart ayında hiç kitap okunmamıştır.','Üye sayısı azaldığı için kitap sayısı düşmüştür.','Ocak ayı en fazla kitabın okunduğu aydır.'], answerValue:'Yeni üyelere rağmen toplantıların azalması marttaki artışı sınırlamış olabilir.',
    explanation:'Şubattan marta küçük düşüş vardır; yeni üyeler artış yönünde, toplantı azalması ise düşüş yönünde etki etmiş olabilir.'
  },
  {
    id:'p8-assumption-01', familyId:'hidden-assumption', minGrade:7, maxGrade:11, cognitiveDepth:5,
    context:'Bir belediye, şehir merkezinde bisiklet yolu sayısını artırırsa kısa mesafeli otomobil kullanımının azalacağını savunuyor.',
    prompt:'Bu görüşün dayandığı temel varsayım hangisidir?',
    options:['Güvenli yol bulunduğunda bazı kişiler kısa mesafede bisikleti tercih edecektir.','Şehirdeki bütün insanlar bisiklet sahibidir.','Otomobiller tamamen yasaklanacaktır.','Bisiklet yolları hiçbir bakım gerektirmez.'], answerValue:'Güvenli yol bulunduğunda bazı kişiler kısa mesafede bisikleti tercih edecektir.',
    explanation:'Bisiklet yolu ile otomobil kullanımındaki azalma arasındaki bağ, insanların ulaşım tercihini değiştireceği varsayımına dayanır.'
  },
  {
    id:'p4-compare-01', familyId:'comparison-two-sources', minGrade:3, maxGrade:5, cognitiveDepth:4,
    context:'Deniz, aynı uzunluktaki iki kitabı okudu. Birinci kitabı günde 12 sayfa okuyarak 5 günde; ikinci kitabı günde 10 sayfa okuyarak 6 günde bitirdi.',
    prompt:'Bu bilgilerden hangisi kesinlikle doğrudur?',
    options:['İki kitap da 60 sayfadır.','Birinci kitap daha uzundur.','Deniz ikinci kitabı daha hızlı okumuştur.','Kitapların türleri aynıdır.'], answerValue:'İki kitap da 60 sayfadır.',
    explanation:'12×5 ve 10×6 işlemlerinin ikisi de 60’tır. Tür ve okuma hızı hakkında ek bilgi yoktur.'
  },
  {
    id:'p4-cause-01', familyId:'cause-effect-chain', minGrade:3, maxGrade:6, cognitiveDepth:4,
    context:'Okul bahçesine yağmur suyunu biriktiren depolar yerleştirildi. Biriken su, yaz aylarında bahçe sulamasında kullanıldı. Böylece şebeke suyunun kullanımı azaldı.',
    prompt:'Metindeki neden-sonuç zinciri hangisidir?',
    options:['Yağmur suyu biriktirildi → Sulamada kullanıldı → Şebeke suyu az tüketildi.','Bahçe sulandı → Yağmur başladı → Depolar kaldırıldı.','Şebeke suyu arttı → Depolar boşaldı → Bahçe kurudu.','Yaz geldi → Yağmur suyu yok edildi → Su tüketimi arttı.'], answerValue:'Yağmur suyu biriktirildi → Sulamada kullanıldı → Şebeke suyu az tüketildi.',
    explanation:'Metin üç olayı bu sırada ve neden-sonuç ilişkisiyle bağlar.'
  },
  {
    id:'p4-insert-01', familyId:'sentence-insertion', minGrade:4, maxGrade:6, cognitiveDepth:4,
    context:'(1) Arılar çiçeklerden nektar toplar. (2) ______ (3) Bu sırada çiçeklerin polenleri başka çiçeklere taşınır. (4) Böylece birçok bitkinin çoğalmasına katkı sağlarlar.',
    prompt:'Boşluğa düşüncenin akışını en iyi tamamlayan cümle hangisidir?',
    options:['Nektarı kovana taşımak için çiçekten çiçeğe uçarlar.','Bazı kuşlar kışın sıcak bölgelere göç eder.','Çiçeklerin renkleri her mevsim aynıdır.','Bal kavanozları camdan yapılabilir.'], answerValue:'Nektarı kovana taşımak için çiçekten çiçeğe uçarlar.',
    explanation:'Sonraki cümledeki polen taşıma olayı, arıların çiçekler arasında uçmasıyla bağlantılıdır.'
  },
  {
    id:'p4-title-01', familyId:'best-title', minGrade:3, maxGrade:6, cognitiveDepth:3,
    context:'Bir tohum toprağa düştüğünde hemen büyük bir ağaca dönüşmez. Önce su alır, kabuğu açılır, küçük bir kök çıkarır. Sonra ışığa doğru uzanan filiz oluşur. Her aşama bir öncekine dayanır.',
    prompt:'Bu metne en uygun başlık hangisidir?',
    options:['Tohumdan Filize Adım Adım','Ormandaki En Büyük Ağaç','Toprağın Renkleri','Yağmursuz Bir Gün'], answerValue:'Tohumdan Filize Adım Adım',
    explanation:'Metin bir tohumun aşamalı gelişimini anlatır; başlık bütün metni kapsar.'
  },
  {
    id:'p4-data-01', familyId:'simple-data-interpretation', minGrade:4, maxGrade:6, cognitiveDepth:4,
    context:'Bir sınıfta pazartesi 18, salı 24, çarşamba 21 kitap ödünç alındı. Salı günü kütüphane teneffüste de açık kaldı.',
    prompt:'Veriler ve açıklama birlikte düşünüldüğünde en uygun yorum hangisidir?',
    options:['Ek açık kalma süresi salı günkü ödünç sayısının artmasına katkı sağlamış olabilir.','Çarşamba hiç kitap alınmamıştır.','Pazartesi en fazla kitabın alındığı gündür.','Kütüphane her gün aynı süre açık kalmıştır.'], answerValue:'Ek açık kalma süresi salı günkü ödünç sayısının artmasına katkı sağlamış olabilir.',
    explanation:'Salı en yüksek değere sahiptir ve o güne özgü ek açık kalma bilgisi olası bir açıklama sunar; kesinlik iddia edilmez.'
  },
  {
    id:'p4-rule-01', familyId:'hidden-classification-rule', minGrade:4, maxGrade:7, cognitiveDepth:4,
    context:'Bir oyunda “kalem, masa, kapı” A kutusuna; “elma, armut, kiraz” B kutusuna konuyor.',
    prompt:'Aynı kurala göre “sandalye” hangi kutuya konmalıdır?',
    options:['A kutusuna; çünkü bir eşyadır.','B kutusuna; çünkü yenebilir.','B kutusuna; çünkü kırmızıdır.','Hiçbirine; çünkü uzun bir kelimedir.'], answerValue:'A kutusuna; çünkü bir eşyadır.',
    explanation:'A kutusundakiler eşya, B kutusundakiler meyvedir. Sandalye eşya grubundadır.'
  },
  {
    id:'p4-contradiction-01', familyId:'contradiction-detection', minGrade:4, maxGrade:7, cognitiveDepth:4,
    context:'Gezi planında “Müze pazartesi kapalıdır.” ve “Sınıf müzeyi pazartesi sabahı ziyaret edecektir.” bilgileri birlikte yazılmıştır.',
    prompt:'Planla ilgili temel sorun hangisidir?',
    options:['İki bilgi birbiriyle çelişmektedir.','Müze çok uzaktadır.','Sınıfta yeterli öğrenci yoktur.','Ziyaret süresi çok uzundur.'], answerValue:'İki bilgi birbiriyle çelişmektedir.',
    explanation:'Müze kapalıyken ziyaret planlanması aynı anda gerçekleşemeyecek iki bilgidir.'
  },
  {
    id:'p4-purpose-01', familyId:'authors-purpose', minGrade:4, maxGrade:7, cognitiveDepth:4,
    context:'“Musluğu diş fırçalarken kapatmak, her gün birçok litre suyun boşa akmasını önler. Küçük bir alışkanlık, yıl boyunca büyük bir tasarruf sağlar.”',
    prompt:'Yazarın bu metni yazma amacı nedir?',
    options:['Su tasarrufu davranışına yönlendirmek','Bir masal kahramanını tanıtmak','Muslukların tarihini anlatmak','Suyun rengini betimlemek'], answerValue:'Su tasarrufu davranışına yönlendirmek',
    explanation:'Metin bir davranışın yararını açıklayarak okuyucuyu o davranışa teşvik eder.'
  },
  {
    id:'p8-source-01', familyId:'multiple-source-synthesis', minGrade:6, maxGrade:9, cognitiveDepth:5,
    context:'Kaynak 1: Şehirde toplu taşıma seferleri artırıldıktan sonra merkezdeki araç sayısı %8 azaldı. Kaynak 2: Aynı dönemde akaryakıt fiyatları yükseldi. Kaynak 3: Bisiklet yolu uzunluğu değişmedi.',
    prompt:'Araç sayısındaki azalmayı yorumlarken en dikkatli sonuç hangisidir?',
    options:['Toplu taşıma artışı etkili olmuş olabilir ancak fiyat artışının etkisi de ayrıştırılmalıdır.','Azalmanın tek nedeni kesinlikle bisiklet yollarıdır.','Akaryakıt fiyatlarının hiçbir etkisi olamaz.','Araç sayısı aslında artmıştır.'], answerValue:'Toplu taşıma artışı etkili olmuş olabilir ancak fiyat artışının etkisi de ayrıştırılmalıdır.',
    explanation:'İki değişken aynı dönemde değişmiştir; tek nedene kesin bağ kurmak için ek karşılaştırma gerekir.'
  },
  {
    id:'p8-claim-01', familyId:'claim-evidence-match', minGrade:6, maxGrade:10, cognitiveDepth:5,
    context:'İddia: “Kısa aralıklarla yapılan tekrarlar, tek seferde uzun süre çalışmaktan daha kalıcı öğrenme sağlar.”',
    prompt:'Bu iddiayı en doğrudan destekleyen bulgu hangisidir?',
    options:['Aynı toplam sürede çalışan iki gruptan aralıklı çalışan grup bir hafta sonra daha çok bilgiyi hatırlamıştır.','Uzun çalışan grup daha çok kalem kullanmıştır.','Öğrenciler farklı renklerde defter seçmiştir.','Sınıfın pencereleri çalışma sırasında açıktır.'], answerValue:'Aynı toplam sürede çalışan iki gruptan aralıklı çalışan grup bir hafta sonra daha çok bilgiyi hatırlamıştır.',
    explanation:'Toplam süre eşit tutulmuş, çalışma biçimi değiştirilmiş ve kalıcılık doğrudan ölçülmüştür.'
  },
  {
    id:'p8-weakness-01', familyId:'argument-weakness', minGrade:7, maxGrade:10, cognitiveDepth:5,
    context:'Bir kişi, “Bu uygulamayı kullanan iki arkadaşım sınavda yüksek not aldı; demek ki uygulamayı kullanan herkes yüksek not alır.” diyor.',
    prompt:'Bu akıl yürütmenin temel zayıflığı hangisidir?',
    options:['Çok küçük bir örnekten bütün kullanıcılar için genelleme yapması','Arkadaşlarının notlarını karşılaştırması','Uygulamadan söz etmesi','Sınav sonucunu dikkate alması'], answerValue:'Çok küçük bir örnekten bütün kullanıcılar için genelleme yapması',
    explanation:'İki kişi bütün kullanıcıları temsil etmeyebilir; başka etkenler de başarıyı açıklayabilir.'
  },
  {
    id:'p8-flow-01', familyId:'paragraph-coherence', minGrade:6, maxGrade:9, cognitiveDepth:5,
    context:'I. Bu yüzden çözümden önce hangi bilgilerin gerekli olduğunu belirlemek önemlidir. II. Uzun problemler, her cümlesi işlemde kullanılacakmış gibi görünebilir. III. Oysa bazı bilgiler yalnızca dikkat dağıtmak amacıyla verilmiştir. IV. Gereksiz bilgiyi elemek işlem yükünü azaltır.',
    prompt:'Cümlelerin anlamlı bir paragraf oluşturacak sırası hangisidir?',
    options:['II – III – I – IV','I – II – IV – III','III – II – I – IV','II – I – III – IV'], answerValue:'II – III – I – IV',
    explanation:'II konuyu tanıtır, III “oysa” ile karşıtlığı kurar, I “bu yüzden” sonucu çıkarır, IV yararı açıklar.'
  },
  {
    id:'p8-tone-01', familyId:'tone-and-attitude', minGrade:6, maxGrade:10, cognitiveDepth:4,
    context:'“Yeni köprünün bütün trafik sorunlarını bir gecede çözeceğini düşünmek fazla iyimser olur; ulaşım planı, toplu taşıma ve yaya yollarıyla birlikte değerlendirilmelidir.”',
    prompt:'Yazarın tutumu en iyi nasıl tanımlanır?',
    options:['Temkinli ve bütüncül','Koşulsuz destekleyici','Alaycı ve ilgisiz','Kanıtsız biçimde kesin'], answerValue:'Temkinli ve bütüncül',
    explanation:'Yazar tek çözüm iddiasına mesafeli yaklaşır ve birden fazla unsurun birlikte değerlendirilmesini ister.'
  },
  {
    id:'p8-condition-01', familyId:'multi-condition-text', minGrade:7, maxGrade:10, cognitiveDepth:5,
    context:'Bir sunumun kabul edilmesi için kaynakça içermesi, 8 dakikayı aşmaması ve en az bir görsel veri kullanması gerekir. A sunumu 7 dakika, kaynakçalı fakat görselsizdir. B sunumu 9 dakika, kaynakçalı ve görsellidir. C sunumu 8 dakika, kaynakçalı ve görsellidir.',
    prompt:'Hangi sunum bütün koşulları sağlar?',
    options:['Yalnız C','A ve C','Yalnız B','B ve C'], answerValue:'Yalnız C',
    explanation:'A görsel koşulunu, B süre koşulunu karşılamaz. C üç koşulu da sağlar.'
  },
  {
    id:'p8-media-01', familyId:'media-literacy', minGrade:7, maxGrade:11, cognitiveDepth:5,
    context:'Bir paylaşım, “Uzmanlar bu yöntemin kesinlikle işe yaradığını kanıtladı.” diyor ancak uzman adı, araştırma bağlantısı, örneklem büyüklüğü ve tarih vermiyor.',
    prompt:'Paylaşımın güvenilirliğini değerlendirmek için ilk yapılması gereken hangisidir?',
    options:['İddianın dayandığı özgün araştırma ve kaynağı aramak','Paylaşım çok beğeni aldıysa doğru kabul etmek','Başlığın büyük harfle yazılmasına bakmak','Yorumlardan en kısa olanı seçmek'], answerValue:'İddianın dayandığı özgün araştırma ve kaynağı aramak',
    explanation:'Doğrulanabilir kaynak, yöntem ve tarih bilgisi olmadan kesinlik iddiası güvenilir kabul edilemez.'
  },
  {
    id:'p8-variable-01', familyId:'experimental-variable-analysis', minGrade:6, maxGrade:10, cognitiveDepth:5,
    context:'Bir öğrenci, farklı gübrelerin bitki büyümesine etkisini araştırmak istiyor. Birinci saksıyı güneşte ve az suyla, ikinciyi gölgede ve çok suyla tutup farklı gübreler kullanıyor.',
    prompt:'Deneyin güvenilir bir karşılaştırma vermemesinin temel nedeni nedir?',
    options:['Gübre dışında ışık ve su miktarının da değiştirilmesi','İki farklı gübre kullanılması','Bitki büyümesinin ölçülmek istenmesi','Saksıların numaralandırılması'], answerValue:'Gübre dışında ışık ve su miktarının da değiştirilmesi',
    explanation:'Bağımsız değişken gübre olmalı; diğer koşullar sabit tutulmazsa sonuç hangi etkenden kaynaklandı bilinemez.'
  },
  {
    id:'p8-optiontrap-01', familyId:'distractor-analysis', minGrade:7, maxGrade:10, cognitiveDepth:5,
    context:'Metin: “Bazı şehirlerde bisiklet kullanımı, güvenli yollar ve uygun hava koşulları olduğunda artmıştır.”',
    prompt:'Aşağıdaki seçeneklerden hangisi metindeki bilgiyi aşan bir genellemedir?',
    options:['Güvenli yol bulunan bütün şehirlerde herkes bisiklet kullanır.','Bazı şehirlerde koşullar uygun olduğunda kullanım artabilir.','Hava koşulları kullanım tercihini etkileyebilir.','Güvenli yollar kullanım artışıyla ilişkili olabilir.'], answerValue:'Güvenli yol bulunan bütün şehirlerde herkes bisiklet kullanır.',
    explanation:'“Bazı” ve “artabilir” ifadeleri, “bütün şehirlerde herkes” biçiminde kesin ve evrensel sonuca dönüştürülemez.'
  }

];
