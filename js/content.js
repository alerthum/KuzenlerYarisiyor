export const WORD_MINE_SETS = [
  {
    minAge: 8,
    source: 'arkadaşlık',
    allowed: ['ara', 'arka', 'arkadaş', 'aşık', 'aşk', 'adaş', 'adaşlık', 'kar', 'kara', 'karış', 'kaş', 'kış', 'kır', 'şaka', 'şarkı', 'aş']
  },
  {
    minAge: 8,
    source: 'matematikçiler',
    allowed: ['matematik', 'mat', 'tek', 'ter', 'et', 'etik', 'emek', 'etki', 'kiremit', 'tire', 'teker', 'kere', 'krem', 'kremi', 'mert', 'mira', 'mimar', 'tamir', 'tam', 'temel', 'ilim', 'mil', 'iletim', 'iklim', 'kitle', 'kilim']
  },
  {
    minAge: 8,
    source: 'sorumluluk',
    allowed: ['soru', 'sor', 'sulu', 'suluk', 'sululuk', 'sol', 'soluk', 'oluk', 'olur', 'olum', 'olumsu', 'kuru', 'kur', 'kurum', 'kurulu', 'kum', 'kul', 'kulum', 'koru', 'kor', 'lokum', 'mor', 'rum', 'rol', 'sok', 'sokum', 'suluk']
  },
  {
    minAge: 8,
    source: 'bilgisayar',
    allowed: ['bilgi', 'bil', 'silgi', 'sil', 'sal', 'yar', 'yara', 'al', 'ara', 'bar', 'bal', 'biri', 'bir', 'gri', 'say', 'sar']
  },
  {
    minAge: 11,
    source: 'cumhuriyetçilik',
    allowed: ['cumhuriyet', 'cilt', 'ilçe', 'iç', 'içer', 'içeri', 'içim', 'içme', 'içerik', 'terim', 'tercih', 'ter', 'et', 'etik', 'ilim', 'iletim', 'mil', 'yem', 'yer', 'yurt', 'çelik', 'çile', 'çim', 'çit', 'çukur']
  },
  {
    minAge: 11,
    source: 'elektromanyetik',
    allowed: ['elektron', 'elektrik', 'manyetik', 'metal', 'metin', 'metre', 'merak', 'mekan', 'makine', 'tek', 'teker', 'temel', 'terim', 'etki', 'etik', 'krem', 'tren', 'renk', 'yemek', 'yem', 'nota', 'not', 'rota', 'oran', 'orman', 'keman']
  },
  {
    minAge: 11,
    source: 'sorumluluklarımız',
    allowed: ['sorumluluk', 'sorumlu', 'soru', 'sor', 'sulu', 'suluk', 'olum', 'olumlu', 'olumsuz', 'kurum', 'kurumsal', 'kurulu', 'kur', 'kuru', 'koruma', 'koru', 'kor', 'lokum', 'moral', 'mor', 'rumuz', 'uzak', 'uzam', 'sal', 'mola', 'oluk', 'soluk', 'sokum', 'akıl', 'akım', 'kural']
  },
  {
    minAge: 11,
    source: 'karşılaştırmalar',
    allowed: ['araştırma', 'araştırmalar', 'karşı', 'karşılaş', 'karar', 'kar', 'kara', 'kır', 'kış', 'kat', 'tarak', 'tarla', 'taş', 'taşı', 'taşlı', 'artı', 'art', 'ara', 'arı', 'aşırı', 'aşır', 'mart', 'martı', 'şart', 'şaka', 'şarkı']
  }
];

export const WORD_LADDERS = [
  { minAge: 8, start: 'KALE', steps: ['KARE'], end: 'PARE', hint: 'Ortadaki kelime bir şeklin adıdır.' },
  { minAge: 8, start: 'BAL', steps: ['DAL'], end: 'DİL', hint: 'İlk adım ağacın bir parçasıdır.' },
  { minAge: 8, start: 'KOL', steps: ['GOL'], end: 'GÜL', hint: 'Ortadaki kelime futbolda kazanılan sayıdır.' },
  { minAge: 8, start: 'TAŞ', steps: ['YAŞ'], end: 'YAS', hint: 'Ortadaki kelime doğum günlerinde söylenir.' },
  { minAge: 8, start: 'KAZ', steps: ['KAR'], end: 'KIR', hint: 'Ortadaki kelime bir yağış türüdür.' },
  { minAge: 11, start: 'KASA', steps: ['KARA', 'KARE'], end: 'PARE', hint: 'İlk adım bir renktir, ikinci adım bir geometrik şekildir.' },
  { minAge: 11, start: 'YOL', steps: ['KOL', 'KAL'], end: 'BAL', hint: 'Önce vücudumuzdaki bir bölüm, sonra “bulunmak” anlamına gelen bir sözcük.' },
  { minAge: 11, start: 'SARI', steps: ['SARI', 'SARI'], end: 'SARI', invalidDemo: true, hint: 'Bu kayıt eğitim amaçlı değil.' },
  { minAge: 11, start: 'KAT', steps: ['KAR', 'KIR'], end: 'KIZ', hint: 'İlk adım yağış türü, ikinci adım “parçala” anlamına gelen fiildir.' },
  { minAge: 11, start: 'DERE', steps: ['DENE', 'DİNE'], end: 'DİNİ', hint: 'İlk adım bir deneme fiilidir.' }
].filter((item) => !item.invalidDemo);

export const WORD_DICTIONARY = [
  ...new Set([
    ...WORD_MINE_SETS.flatMap((set) => [set.source, ...set.allowed]),
    ...WORD_LADDERS.flatMap((ladder) => [ladder.start, ...ladder.steps, ladder.end]),
    'kale', 'kare', 'pare', 'bal', 'dal', 'dil', 'kol', 'göl', 'gül', 'taş', 'yaş', 'yas', 'kaz', 'kız', 'diz',
    'kasa', 'kara', 'yol', 'kal', 'kat', 'kar', 'kır', 'dere', 'dene', 'dini', 'dizi'
  ])
];

export const FORBIDDEN_STORY_PROMPTS = [
  { minAge: 8, letter: 'e', topic: 'Tatilde geçen üç cümlelik kısa bir hikâye yaz.', minSentences: 3, minUniqueWords: 12 },
  { minAge: 8, letter: 'a', topic: 'Yağmurlu bir okul gününü iki cümleyle anlat.', minSentences: 2, minUniqueWords: 9 },
  { minAge: 8, letter: 'i', topic: 'Bir uzay yolculuğunu üç cümleyle anlat.', minSentences: 3, minUniqueWords: 12 },
  { minAge: 11, letter: 'e', topic: 'Gizemli bir adada bulunan eski bir haritayı dört cümleyle anlat.', minSentences: 4, minUniqueWords: 20 },
  { minAge: 11, letter: 'a', topic: 'Bir bilim yarışmasındaki son dakikaları üç cümleyle anlat.', minSentences: 3, minUniqueWords: 18 },
  { minAge: 11, letter: 'r', topic: 'Geleceğin okulunu dört cümleyle betimle.', minSentences: 4, minUniqueWords: 20 }
];

export const MEANING_QUESTIONS = [
  {
    minAge: 8,
    prompt: '“Bu ağır sözleri uzun süre unutamadı.” cümlesinde “ağır” hangi anlamda kullanılmıştır?',
    options: ['Tartısı fazla', 'Yavaş hareket eden', 'Kırıcı ve üzücü', 'Değerli'],
    answer: 2,
    explanation: '“Ağır söz” ifadesi kırıcı, incitici söz anlamındadır.'
  },
  {
    minAge: 8,
    prompt: '“Kardeşim soruyu hemen çözdü.” cümlesinde “çözmek” sözcüğü hangi anlamdadır?',
    options: ['Düğümü açmak', 'Bir sonuca ulaştırmak', 'Eritmek', 'Serbest bırakmak'],
    answer: 1,
    explanation: 'Burada çözmek, bir problemin sonucunu bulmak anlamındadır.'
  },
  {
    minAge: 8,
    prompt: '“İnce düşüncesi herkesi mutlu etti.” cümlesinde “ince” ne anlatır?',
    options: ['Kalın olmayan', 'Nazik ve özenli', 'Zayıf', 'Tiz'],
    answer: 1,
    explanation: '“İnce düşünce” başkalarını gözeten, nazik düşünce demektir.'
  },
  {
    minAge: 8,
    prompt: '“Sınıfın yıldızı bu yıl Elif oldu.” cümlesinde “yıldız” sözcüğü hangi anlamdadır?',
    options: ['Gökyüzü cismi', 'Çok başarılı kişi', 'Geometrik şekil', 'Süsleme'],
    answer: 1,
    explanation: 'Yıldız, burada öne çıkan ve çok başarılı kişi anlamındadır.'
  },
  {
    minAge: 11,
    prompt: '“Yazar, olayları keskin bir gözlem gücüyle aktarıyor.” cümlesinde “keskin” hangi anlamdadır?',
    options: ['İyi bilenmiş', 'Sert kokulu', 'Güçlü ve ayrıntılı', 'Acı veren'],
    answer: 2,
    explanation: 'Keskin gözlem, ayrıntıları güçlü biçimde fark etme becerisidir.'
  },
  {
    minAge: 11,
    prompt: '“Bu görüş zamanla toplumda kök saldı.” cümlesinde “kök salmak” ne demektir?',
    options: ['Bitki yetiştirmek', 'Kalıcı hâle gelmek', 'Toprağı kazmak', 'Yavaşlamak'],
    answer: 1,
    explanation: 'Kök salmak, yerleşmek ve kalıcı hâle gelmek anlamında kullanılmıştır.'
  },
  {
    minAge: 11,
    prompt: '“Eleştirmen, eserin zayıf damarını hemen yakaladı.” cümlesinde “zayıf damar” neyi anlatır?',
    options: ['Sağlık sorunu', 'Eserin güçsüz yönü', 'Duygusal davranış', 'Yazarın yaşamı'],
    answer: 1,
    explanation: 'Söz grubu, eserin eksik veya güçsüz yönünü anlatır.'
  },
  {
    minAge: 11,
    prompt: '“Sorunun özüne inmeden verilen cevaplar yüzeyde kaldı.” cümlesinde “yüzeyde kalmak” ne demektir?',
    options: ['Su üstünde durmak', 'Ayrıntıya ve temele ulaşmamak', 'Görünür olmak', 'Kolay anlaşılmak'],
    answer: 1,
    explanation: 'Yüzeyde kalmak, konuyu derinlemesine incelememek demektir.'
  }
];

export const PARAGRAPH_QUESTIONS = [
  {
    minAge: 8,
    context: 'Deniz, her sabah okul yolunda aynı yaşlı ağacın önünden geçerdi. Bir gün ağacın dallarına kuşların yuva yaptığını gördü. O günden sonra yolunu biraz uzatsa bile ağacı kontrol etmeden okula gitmedi.',
    prompt: 'Bu metinde Deniz’in davranışının temel nedeni nedir?',
    options: ['Okula geç kalmak istemesi', 'Kuşları ve yuvayı merak etmesi', 'Başka bir yol bilmemesi', 'Ağacın meyvelerini toplamak istemesi'],
    answer: 1,
    explanation: 'Deniz, kuşların yuvasını gördükten sonra merak ettiği için ağacı kontrol etmeye başlamıştır.'
  },
  {
    minAge: 8,
    context: 'Bir işi ilk denemede yapamamak başarısız olduğumuz anlamına gelmez. Bisiklete binmeyi öğrenirken de birkaç kez dengemizi kaybederiz. Önemli olan, hatamızı fark edip yeniden denemektir.',
    prompt: 'Metnin ana düşüncesi hangisidir?',
    options: ['Bisiklet sürmek tehlikelidir.', 'Her işi ilk denemede yapmalıyız.', 'Hatalardan ders çıkarıp yeniden denemeliyiz.', 'Başarılı insanlar hiç hata yapmaz.'],
    answer: 2,
    explanation: 'Metin, hatanın doğal olduğunu ve tekrar denemenin önemini vurguluyor.'
  },
  {
    minAge: 8,
    context: 'Kütüphanedeki kitapların bazıları çok eskiydi. Görevli, bu kitapları onarmak için ince kâğıtlar ve özel yapıştırıcılar kullanıyordu. Böylece kitaplar daha uzun yıllar okunabilecekti.',
    prompt: 'Görevlinin amacı nedir?',
    options: ['Kitapları satmak', 'Kitapları koruyup ömrünü uzatmak', 'Yeni kitaplar yazmak', 'Kütüphaneyi taşımak'],
    answer: 1,
    explanation: 'Onarım işleminin amacı kitapların uzun süre kullanılmasını sağlamaktır.'
  },
  {
    minAge: 11,
    context: 'Bir haritayı yalnızca yolları bulmak için kullanmayız. Haritalar, bir bölgenin yükseltisini, bitki örtüsünü, nüfus dağılımını ya da iklim özelliklerini de gösterebilir. Bu nedenle aynı bölgeyi anlatan haritalar birbirinden oldukça farklı görünebilir.',
    prompt: 'Bu parçadan aşağıdakilerden hangisi çıkarılabilir?',
    options: ['Her bölgenin yalnızca bir haritası vardır.', 'Haritalar sadece ulaşım amacıyla hazırlanır.', 'Haritanın görünümü, gösterdiği bilgi türüne göre değişir.', 'İklim haritalarında yol bilgisi bulunmak zorundadır.'],
    answer: 2,
    explanation: 'Parça, haritaların farklı bilgi türlerini gösterebildiğini ve bu yüzden farklı görünebildiğini söylüyor.'
  },
  {
    minAge: 11,
    context: 'Teknoloji, bilgiye ulaşmayı hızlandırdı; ancak bilgiye hızlı ulaşmak, onu doğru değerlendirdiğimiz anlamına gelmez. Bir iddiayı kabul etmeden önce kaynağını, tarihini ve başka güvenilir kaynaklarla uyumunu kontrol etmek gerekir.',
    prompt: 'Yazarın asıl vurguladığı düşünce nedir?',
    options: ['Teknoloji bilgiye ulaşmayı zorlaştırır.', 'Her çevrim içi bilgi yanlıştır.', 'Bilgiye ulaşma hızı kadar doğruluğunu sorgulamak da önemlidir.', 'Eski bilgiler her zaman daha güvenilirdir.'],
    answer: 2,
    explanation: 'Metin, hızlı erişimin doğruluk kontrolünün yerini tutmadığını vurgular.'
  },
  {
    minAge: 11,
    context: 'Bir problemin çözümünü ezberlemek, benzer görünen her soruda işe yaramaz. Çünkü sorudaki küçük bir koşul değişikliği, kullanılacak yöntemi tamamen değiştirebilir. Bu yüzden çözüm yolunun neden çalıştığını anlamak gerekir.',
    prompt: 'Bu parçaya göre kalıcı öğrenme nasıl gerçekleşir?',
    options: ['Çok sayıda cevabı ezberleyerek', 'Soruları hızlı okuyarak', 'Çözüm yönteminin mantığını anlayarak', 'Sadece kolay soruları çözerek'],
    answer: 2,
    explanation: 'Yazar, yöntemin neden çalıştığını anlamanın kalıcı öğrenme sağladığını savunur.'
  },
  {
    minAge: 11,
    context: 'Bir takımın başarısı yalnızca en yetenekli oyuncusuna bağlı değildir. Oyuncular birbirlerinin güçlü yönlerini tamamlar, görevlerini zamanında yerine getirir ve ortak hedefe odaklanırsa takımın toplam gücü artar.',
    prompt: 'Aşağıdakilerden hangisi metnin ana düşüncesidir?',
    options: ['Takımda yalnızca yetenekli kişiler bulunmalıdır.', 'Bireysel yetenek, iş birliğinden her zaman üstündür.', 'Takım başarısı uyumlu iş birliğiyle güçlenir.', 'Görev paylaşımı takımın hızını azaltır.'],
    answer: 2,
    explanation: 'Metin, bireysel yetenekten çok uyum ve ortak çalışmanın önemini anlatır.'
  }
];

export const PROBLEM_QUESTIONS = [
  {
    minAge: 8,
    context: 'Bir kutuda 24 kırmızı, kırmızılardan 7 eksik mavi ve mavilerden 5 fazla sarı bilye vardır.',
    prompt: 'Kutuda toplam kaç bilye vardır?',
    options: ['53', '58', '61', '65'],
    answer: 1,
    explanation: 'Mavi: 24 - 7 = 17. Sarı: 17 + 5 = 22. Toplam: 24 + 17 + 22 = 63 değil; seçeneklerde hata olmaması için dikkat: Doğru toplam 63 olmalıdır.',
    correctedOptions: ['53', '58', '63', '65'],
    correctedAnswer: 2
  },
  {
    minAge: 8,
    context: 'Bir gezi otobüsünde 18 öğrenci vardı. İlk durakta 6 öğrenci indi, 9 öğrenci bindi. İkinci durakta 4 öğrenci indi.',
    prompt: 'Otobüste son durumda kaç öğrenci vardır?',
    options: ['15', '17', '19', '21'],
    answer: 1,
    explanation: '18 - 6 + 9 - 4 = 17 öğrenci kalır.'
  },
  {
    minAge: 8,
    context: 'Bir çiftçi 5 sıranın her birine 8 fidan dikti. Daha sonra kuruyan 6 fidanı söktü.',
    prompt: 'Bahçede kaç fidan kaldı?',
    options: ['30', '32', '34', '38'],
    answer: 2,
    explanation: 'Önce 5 × 8 = 40 fidan vardı. 40 - 6 = 34 fidan kaldı.'
  },
  {
    minAge: 8,
    context: 'Bir kitabın 96 sayfası vardır. Ece ilk gün 28, ikinci gün ilk günden 6 sayfa fazla okudu.',
    prompt: 'Ece’nin okumadığı kaç sayfa kalmıştır?',
    options: ['28', '32', '34', '40'],
    answer: 2,
    explanation: 'İkinci gün 34 sayfa okur. Toplam 62 sayfa okuduğu için 96 - 62 = 34 sayfa kalır.'
  },
  {
    minAge: 11,
    context: 'Bir depodaki ürünlerin önce %20’si, daha sonra kalan ürünlerin %25’i satılıyor. Başlangıçta 200 ürün vardır.',
    prompt: 'Depoda kaç ürün kalır?',
    options: ['100', '110', '120', '130'],
    answer: 2,
    explanation: 'İlk satıştan sonra 160 ürün kalır. Kalanın %25’i 40 üründür. 160 - 40 = 120.'
  },
  {
    minAge: 11,
    context: 'Bir araç 240 km’lik yolun ilk yarısını saatte 60 km, ikinci yarısını saatte 40 km hızla gidiyor.',
    prompt: 'Yolculuğun toplam süresi kaç saattir?',
    options: ['4', '4,5', '5', '5,5'],
    answer: 2,
    explanation: 'İlk 120 km: 2 saat. İkinci 120 km: 3 saat. Toplam 5 saat.'
  },
  {
    minAge: 11,
    context: 'Bir sınıfta kızların sayısının erkeklerin sayısına oranı 3/2’dir. Sınıfa 4 erkek öğrenci daha gelince oran 3/4 oluyor.',
    prompt: 'Başlangıçta sınıfta toplam kaç öğrenci vardır?',
    options: ['8', '10', '12', '15'],
    answer: 1,
    explanation: 'Kızlar 3k, erkekler 2k olsun. 3k/(2k+4)=3/4 ⇒ 12k=6k+12 ⇒ k=2. Toplam 10.'
  },
  {
    minAge: 11,
    context: 'Bir ürün önce %20 indirimle, ardından indirimli fiyat üzerinden %10 zamla satılıyor. Etiket fiyatı 1.000 TL’dir.',
    prompt: 'Son satış fiyatı kaç TL olur?',
    options: ['880 TL', '900 TL', '920 TL', '980 TL'],
    answer: 0,
    explanation: '1.000 × 0,80 = 800 TL; 800 × 1,10 = 880 TL.'
  }
].map((question) => question.correctedOptions ? {
  ...question,
  options: question.correctedOptions,
  answer: question.correctedAnswer,
  explanation: 'Mavi bilye sayısı 17, sarı bilye sayısı 22’dir. 24 + 17 + 22 = 63.'
} : question);

export const ERROR_QUESTIONS = [
  {
    minAge: 8,
    prompt: 'Aşağıdaki çözümün hatalı adımını bul.',
    context: '48 ÷ 6 + 3 × 4 işlemi çözülüyor.',
    steps: ['48 ÷ 6 = 8', '3 × 4 = 12', '8 + 12 = 20', 'Sonuç 24’tür.'],
    answer: 3,
    explanation: 'İlk üç adım doğru, fakat sonuç 20 olmalıdır.'
  },
  {
    minAge: 8,
    prompt: 'Aşağıdaki çözümün hatalı adımını bul.',
    context: 'Bir kenarı 7 cm olan karenin çevresi hesaplanıyor.',
    steps: ['Karenin 4 eşit kenarı vardır.', '7 + 7 + 7 + 7 işlemi yapılır.', 'Toplam 28 cm bulunur.', 'Karenin çevresi 49 cm’dir.'],
    answer: 3,
    explanation: '49, karenin alanıdır. Çevre 28 cm’dir.'
  },
  {
    minAge: 11,
    prompt: 'Aşağıdaki cebir çözümünün ilk hatalı adımını bul.',
    context: '3(x + 2) = 21 denklemi çözülüyor.',
    steps: ['3x + 2 = 21', '3x = 19', 'x = 19/3', 'Sonuç kontrol edilir.'],
    answer: 0,
    explanation: 'Dağılma özelliğinde 3 sayısı hem x hem 2 ile çarpılmalıydı: 3x + 6 = 21.'
  },
  {
    minAge: 11,
    prompt: 'Aşağıdaki oran çözümünün ilk hatalı adımını bul.',
    context: '4 kalem 60 TL ise 10 kalemin fiyatı bulunuyor.',
    steps: ['Bir kalemin fiyatı 60 ÷ 4 = 15 TL’dir.', '10 kalem için 15 × 10 yapılır.', '15 × 10 = 150 TL’dir.', 'Sonuç 600 TL’dir.'],
    answer: 3,
    explanation: 'İlk üç adım doğru; sonuç 150 TL olmalıdır.'
  }
];

export const OLYMPIAD_QUESTIONS = [
  {
    minAge: 8,
    prompt: '1’den 20’ye kadar olan doğal sayılardan kaç tanesi hem 2’ye hem 3’e tam bölünür?',
    options: ['2', '3', '4', '6'],
    answer: 1,
    hints: ['Hem 2’ye hem 3’e bölünen sayılar 6’ya bölünür.', '20’ye kadar 6’nın katlarını listele.', '6, 12 ve 18 sayılarını say.'],
    explanation: '6’nın 20’ye kadar olan pozitif katları 6, 12 ve 18’dir. Toplam 3 sayı.'
  },
  {
    minAge: 8,
    prompt: 'Bir torbada yalnızca kırmızı ve mavi toplar vardır. Gözün kapalıyken aynı renkten iki top almayı garanti etmek için en az kaç top çekmelisin?',
    options: ['2', '3', '4', '5'],
    answer: 1,
    hints: ['En kötü durumu düşün.', 'İlk iki top farklı renk gelebilir.', 'Üçüncü top mutlaka önceki renklerden biriyle eşleşir.'],
    explanation: 'İlk iki top farklı renk olabilir. Üçüncü top kırmızı ya da mavi olduğundan aynı renkten iki top garanti edilir.'
  },
  {
    minAge: 8,
    prompt: 'Bir sayının 5 ile bölümünden kalan 2 ise, bu sayının 10 fazlasının 5 ile bölümünden kalan kaçtır?',
    options: ['0', '1', '2', '4'],
    answer: 2,
    hints: ['10 sayısı 5’in katıdır.', 'Bir sayıya 5’in katını eklemek kalanı değiştirmez.', 'Kalan yine 2 olur.'],
    explanation: '10, 5’e tam bölündüğü için bölümden kalan değişmez.'
  },
  {
    minAge: 11,
    prompt: 'Ardışık üç tek sayının toplamı 75’tir. En büyük sayı kaçtır?',
    options: ['23', '25', '27', '29'],
    answer: 2,
    hints: ['Ortadaki sayıya x de.', 'Sayılar x-2, x ve x+2 biçimindedir.', '3x = 75 olduğundan x = 25; en büyük 27.'],
    explanation: 'Sayılar 23, 25 ve 27’dir.'
  },
  {
    minAge: 11,
    prompt: '1, 2, 3, 4 ve 5 rakamları birer kez kullanılarak yazılan beş basamaklı sayıların kaç tanesi çifttir?',
    options: ['24', '36', '48', '60'],
    answer: 2,
    hints: ['Çift sayı son basamağı 2 veya 4 olan sayıdır.', 'Son basamak için 2 seçenek vardır.', 'Kalan dört rakam 4! şekilde dizilir: 2 × 24.'],
    explanation: 'Son basamak 2 veya 4 olabilir. Kalan dört basamak 4! = 24 şekilde dizilir. 2 × 24 = 48.'
  },
  {
    minAge: 11,
    prompt: 'Bir 8×8 satranç tahtasında toplam kaç kare vardır?',
    options: ['64', '128', '204', '256'],
    answer: 2,
    hints: ['Yalnızca 1×1 kareleri sayma.', '1² + 2² + ... + 8² toplamını düşün.', 'Toplam 204 olur.'],
    explanation: 'Tüm boyutlardaki kareler sayılır: 1²+2²+...+8²=204.'
  },
  {
    minAge: 11,
    prompt: 'Bir odada 6 kişi vardır. Her iki kişi bir kez tokalaşırsa toplam kaç tokalaşma olur?',
    options: ['12', '15', '18', '30'],
    answer: 1,
    hints: ['Her tokalaşma iki kişilik bir çifttir.', '6 kişiden 2 kişi seçilir.', '6×5÷2 = 15.'],
    explanation: 'Kişi çiftlerinin sayısı C(6,2)=15’tir.'
  },
  {
    minAge: 11,
    prompt: '2⁰ + 2¹ + 2² + 2³ + 2⁴ toplamı kaçtır?',
    options: ['16', '30', '31', '32'],
    answer: 2,
    hints: ['Terimleri tek tek yazabilirsin.', '1 + 2 + 4 + 8 + 16.', 'Toplam 31.'],
    explanation: 'Geometrik toplam 1+2+4+8+16=31’dir.'
  }
];

export const LOGIC_QUESTIONS = [
  {
    minAge: 8,
    context: 'Ali, Buse ve Cem; kırmızı, mavi ve yeşil kalemlerden birer tane aldı. Ali kırmızı almadı. Buse mavi aldı. Cem yeşil almadı.',
    prompt: 'Ali hangi renk kalemi aldı?',
    options: ['Kırmızı', 'Mavi', 'Yeşil', 'Belirlenemez'],
    answer: 2,
    explanation: 'Buse mavi aldığı için Ali mavi alamaz. Ali kırmızı da almadığına göre yeşil almıştır.'
  },
  {
    minAge: 8,
    context: 'Bir yarışta Ece, Can’dan önce; Can da Mert’ten önce bitirdi.',
    prompt: 'Yarışı kim ikinci bitirmiştir?',
    options: ['Ece', 'Can', 'Mert', 'Belirlenemez'],
    answer: 1,
    explanation: 'Sıralama Ece, Can, Mert şeklindedir.'
  },
  {
    minAge: 8,
    context: 'Bir şifrelemede KEDİ kelimesi 2-1-4-3 sırasıyla DİKE oluyor.',
    prompt: 'Aynı kuralla MASA kelimesi nasıl yazılır?',
    options: ['AMAS', 'ASAM', 'SAMA', 'AASM'],
    answer: 1,
    explanation: '2., 1., 4. ve 3. harf sıralanır: A-M-A-S = AMAS olmalı.',
    correctedAnswer: 0
  },
  {
    minAge: 11,
    context: 'Dört kitap soldan sağa dizilecektir: Matematik, Türkçe, Fen ve Tarih. Matematik en soldadır. Fen, Türkçenin hemen sağındadır. Tarih en sağda değildir.',
    prompt: 'Aşağıdaki sıralamalardan hangisi mümkündür?',
    options: ['Matematik - Türkçe - Fen - Tarih', 'Matematik - Tarih - Türkçe - Fen', 'Türkçe - Fen - Matematik - Tarih', 'Matematik - Fen - Türkçe - Tarih'],
    answer: 1,
    explanation: 'Matematik solda, Türkçe-Fen yan yana ve Tarih en sağda olmayacak biçimde yalnız ikinci seçenek uygundur.'
  },
  {
    minAge: 11,
    context: 'Ayşe pazartesi veya çarşamba, Bora salı veya çarşamba, Ceren ise yalnız perşembe günü sunum yapabilir. Her gün yalnız bir sunum vardır.',
    prompt: 'Bora çarşamba sunum yaparsa Ayşe hangi gün sunum yapar?',
    options: ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe'],
    answer: 0,
    explanation: 'Çarşamba Bora’ya ayrıldığı için Ayşe’nin tek seçeneği pazartesidir.'
  },
  {
    minAge: 11,
    context: 'Bir adada doğrucular her zaman doğru, yalancılar her zaman yanlış söyler. Ada sakini “Ben yalancıyım.” diyor.',
    prompt: 'Bu durum için hangisi doğrudur?',
    options: ['Kesinlikle doğrucudur.', 'Kesinlikle yalancıdır.', 'Bu cümleyi hiçbir ada sakini tutarlı biçimde söyleyemez.', 'Her ikisi de olabilir.'],
    answer: 2,
    explanation: 'Doğrucu “yalancıyım” diyemez; yalancı söylerse cümle doğru olur ve yalancı kuralıyla çelişir.'
  }
].map((question) => question.correctedAnswer === undefined ? question : { ...question, answer: question.correctedAnswer });

export const GEOMETRY_QUESTIONS = [
  {
    minAge: 8,
    prompt: 'Şeklin çevresi kaç birimdir?',
    context: 'Dikdörtgenin uzun kenarı 8 birim, kısa kenarı 5 birimdir.',
    visual: 'rectangle-8-5',
    options: ['13', '26', '40', '64'],
    answer: 1,
    explanation: 'Çevre = 2 × (8 + 5) = 26 birim.'
  },
  {
    minAge: 8,
    prompt: 'Karenin alanı kaç birimkaredir?',
    context: 'Karenin bir kenarı 6 birimdir.',
    visual: 'square-6',
    options: ['12', '24', '30', '36'],
    answer: 3,
    explanation: 'Alan = 6 × 6 = 36 birimkare.'
  },
  {
    minAge: 11,
    prompt: 'Boyalı bölgenin alanı kaç birimkaredir?',
    context: '10×8 dikdörtgenin içinden 4×3 dikdörtgen çıkarılmıştır.',
    visual: 'cut-rectangle',
    options: ['56', '64', '68', '72'],
    answer: 2,
    explanation: 'Büyük alan 80, çıkarılan alan 12’dir. 80 - 12 = 68.'
  },
  {
    minAge: 11,
    prompt: 'Üçgenin alanı kaç birimkaredir?',
    context: 'Taban 12 birim, bu tabana ait yükseklik 7 birimdir.',
    visual: 'triangle-12-7',
    options: ['19', '42', '84', '96'],
    answer: 1,
    explanation: 'Alan = 12 × 7 ÷ 2 = 42.'
  }
];

export const CATEGORY_LABELS = {
  turkish: 'Türkçe',
  math: 'Matematik',
  logic: 'Zekâ',
  olympiad: 'Olimpiyat',
  english: 'İngilizce',
  science: 'Fen Bilimleri',
  social: 'Sosyal Bilgiler',
  religion: 'Din Kültürü',
  lgs: 'LGS Arşivi'
};
