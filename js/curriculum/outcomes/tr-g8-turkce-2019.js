import { defineCurriculumOutcome, defineIngestionStatus } from '../curriculum-ingestion-contract.js';

const SOURCE_ID = 'meb-legacy-programs';
const SOURCE_DOCUMENT = 'Türkçe Dersi Öğretim Programı (İlkokul ve Ortaokul 1-8. Sınıflar), 2019';
const SOURCE_URL = 'https://mufredat.meb.gov.tr/Dosyalar/20195716392253-02-T%C3%BCrk%C3%A7e%20%C3%96%C4%9Fretim%20Program%C4%B1%202019.pdf';

const RAW_OUTCOMES = Object.freeze([
  {
    "code": "T.8.1.1",
    "text": "Dinlediklerinde/izlediklerinde geçen olayların gelişimi ve sonucu hakkında tahminde bulunur.",
    "guidanceNotes": [],
    "unitId": "dinleme-izleme",
    "unitName": "Dinleme/İzleme",
    "topicId": "dinleme-izleme",
    "topicName": "Dinleme/İzleme",
    "page": 47
  },
  {
    "code": "T.8.1.2",
    "text": "Dinlediklerinde/izlediklerinde geçen bilmediği kelimelerin anlamını tahmin eder.",
    "guidanceNotes": [
      "Öğrencilerin kelime anlamlarına yönelik tahminleri ile sözlük anlamlarını karşılaştırmaları sağlanır."
    ],
    "unitId": "dinleme-izleme",
    "unitName": "Dinleme/İzleme",
    "topicId": "dinleme-izleme",
    "topicName": "Dinleme/İzleme",
    "page": 47
  },
  {
    "code": "T.8.1.3",
    "text": "Dinlediklerini/izlediklerini özetler.",
    "guidanceNotes": [],
    "unitId": "dinleme-izleme",
    "unitName": "Dinleme/İzleme",
    "topicId": "dinleme-izleme",
    "topicName": "Dinleme/İzleme",
    "page": 47
  },
  {
    "code": "T.8.1.4",
    "text": "Dinledikleri/izlediklerine yönelik sorulara cevap verir.",
    "guidanceNotes": [],
    "unitId": "dinleme-izleme",
    "unitName": "Dinleme/İzleme",
    "topicId": "dinleme-izleme",
    "topicName": "Dinleme/İzleme",
    "page": 47
  },
  {
    "code": "T.8.1.5",
    "text": "Dinlediklerinin/izlediklerinin konusunu tespit eder.",
    "guidanceNotes": [],
    "unitId": "dinleme-izleme",
    "unitName": "Dinleme/İzleme",
    "topicId": "dinleme-izleme",
    "topicName": "Dinleme/İzleme",
    "page": 47
  },
  {
    "code": "T.8.1.6",
    "text": "Dinlediklerinin/izlediklerinin ana fikrini/ana duygusunu tespit eder.",
    "guidanceNotes": [],
    "unitId": "dinleme-izleme",
    "unitName": "Dinleme/İzleme",
    "topicId": "dinleme-izleme",
    "topicName": "Dinleme/İzleme",
    "page": 47
  },
  {
    "code": "T.8.1.7",
    "text": "Dinlediklerine/izlediklerine yönelik farklı başlıklar önerir.",
    "guidanceNotes": [],
    "unitId": "dinleme-izleme",
    "unitName": "Dinleme/İzleme",
    "topicId": "dinleme-izleme",
    "topicName": "Dinleme/İzleme",
    "page": 47
  },
  {
    "code": "T.8.1.8",
    "text": "Dinlediği/izlediği hikâye edici metinleri canlandırır.",
    "guidanceNotes": [],
    "unitId": "dinleme-izleme",
    "unitName": "Dinleme/İzleme",
    "topicId": "dinleme-izleme",
    "topicName": "Dinleme/İzleme",
    "page": 47
  },
  {
    "code": "T.8.1.9",
    "text": "Dinlediklerinde/izlediklerinde tutarlılığı sorgular.",
    "guidanceNotes": [],
    "unitId": "dinleme-izleme",
    "unitName": "Dinleme/İzleme",
    "topicId": "dinleme-izleme",
    "topicName": "Dinleme/İzleme",
    "page": 47
  },
  {
    "code": "T.8.1.10",
    "text": "Dinledikleriyle/izledikleriyle ilgili görüşlerini bildirir.",
    "guidanceNotes": [],
    "unitId": "dinleme-izleme",
    "unitName": "Dinleme/İzleme",
    "topicId": "dinleme-izleme",
    "topicName": "Dinleme/İzleme",
    "page": 47
  },
  {
    "code": "T.8.1.11",
    "text": "Dinledikleri/izledikleri medya metinlerini değerlendirir.",
    "guidanceNotes": [
      "Medya metinlerinin amacını ve kaynağını sorgulamaları sağlanır."
    ],
    "unitId": "dinleme-izleme",
    "unitName": "Dinleme/İzleme",
    "topicId": "dinleme-izleme",
    "topicName": "Dinleme/İzleme",
    "page": 47
  },
  {
    "code": "T.8.1.12",
    "text": "Dinlediklerinde/izlediklerinde başvurulan düşünceyi geliştirme yollarını tespit eder.",
    "guidanceNotes": [
      "Düşünceyi geliştirme yollarından örneklendirme, tanık gösterme ve sayısal verilerden yararlanma belirlenir."
    ],
    "unitId": "dinleme-izleme",
    "unitName": "Dinleme/İzleme",
    "topicId": "dinleme-izleme",
    "topicName": "Dinleme/İzleme",
    "page": 47
  },
  {
    "code": "T.8.1.13",
    "text": "Konuşmacının sözlü olmayan mesajlarını kavrar.",
    "guidanceNotes": [],
    "unitId": "dinleme-izleme",
    "unitName": "Dinleme/İzleme",
    "topicId": "dinleme-izleme",
    "topicName": "Dinleme/İzleme",
    "page": 47
  },
  {
    "code": "T.8.1.14",
    "text": "Dinleme stratejilerini uygular.",
    "guidanceNotes": [
      "Seçici, yaratıcı, eleştirel, empati kurarak, not alarak dinleme gibi yöntem ve teknikleri uygulamaları sağlanır."
    ],
    "unitId": "dinleme-izleme",
    "unitName": "Dinleme/İzleme",
    "topicId": "dinleme-izleme",
    "topicName": "Dinleme/İzleme",
    "page": 47
  },
  {
    "code": "T.8.2.1",
    "text": "Hazırlıklı konuşma yapar.",
    "guidanceNotes": [
      "a) Öğrencilerin düşüncelerini mantıksal bir bütünlük içinde sunmaları, görsel, işitsel vb. destekleyici materyaller kullanmaları, sunu hazırlamaları sağlanır.",
      "b)Öğrenciler araştırma sonuçlarını sempozyum, panel, forum vb. ortamlarda sunmaya teşvik edilir."
    ],
    "unitId": "konusma",
    "unitName": "Konuşma",
    "topicId": "konusma",
    "topicName": "Konuşma",
    "page": 47
  },
  {
    "code": "T.8.2.2",
    "text": "Hazırlıksız konuşma yapar.",
    "guidanceNotes": [],
    "unitId": "konusma",
    "unitName": "Konuşma",
    "topicId": "konusma",
    "topicName": "Konuşma",
    "page": 47
  },
  {
    "code": "T.8.2.3",
    "text": "Konuşma stratejilerini uygular.",
    "guidanceNotes": [
      "Yaratıcı, güdümlü, empati kurma, tartışma, ikna etme ve eleştirel konuşma gibi yöntem ve tekniklerinin kullanılması sağlanır."
    ],
    "unitId": "konusma",
    "unitName": "Konuşma",
    "topicId": "konusma",
    "topicName": "Konuşma",
    "page": 47
  },
  {
    "code": "T.8.2.4",
    "text": "Konuşmalarında beden dilini etkili bir şekilde kullanır.",
    "guidanceNotes": [],
    "unitId": "konusma",
    "unitName": "Konuşma",
    "topicId": "konusma",
    "topicName": "Konuşma",
    "page": 47
  },
  {
    "code": "T.8.2.5",
    "text": "Kelimeleri anlamlarına uygun kullanır.",
    "guidanceNotes": [],
    "unitId": "konusma",
    "unitName": "Konuşma",
    "topicId": "konusma",
    "topicName": "Konuşma",
    "page": 47
  },
  {
    "code": "T.8.2.6",
    "text": "Konuşmalarında yabancı dillerden alınmış, dilimize henüz yerleşmemiş kelimelerin Türkçelerini kullanır.",
    "guidanceNotes": [],
    "unitId": "konusma",
    "unitName": "Konuşma",
    "topicId": "konusma",
    "topicName": "Konuşma",
    "page": 47
  },
  {
    "code": "T.8.2.7",
    "text": "Konuşmalarında uygun geçiş ve bağlantı ifadelerini kullanır.",
    "guidanceNotes": [],
    "unitId": "konusma",
    "unitName": "Konuşma",
    "topicId": "konusma",
    "topicName": "Konuşma",
    "page": 47
  },
  {
    "code": "T.8.3.1",
    "text": "Noktalama işaretlerine dikkat ederek sesli ve sessiz okur.",
    "guidanceNotes": [],
    "unitId": "okuma",
    "unitName": "Okuma",
    "topicId": "akici-okuma",
    "topicName": "Akıcı Okuma",
    "page": 48
  },
  {
    "code": "T.8.3.2",
    "text": "Metni türün özelliklerine uygun biçimde okur.",
    "guidanceNotes": [
      "Öğrencilerin seviyelerine uygun, edebî değeri olan şiirleri ve kısa yazıları türünün özelliğine göre okumaları ve ezberlemeleri sağlanır."
    ],
    "unitId": "okuma",
    "unitName": "Okuma",
    "topicId": "akici-okuma",
    "topicName": "Akıcı Okuma",
    "page": 48
  },
  {
    "code": "T.8.3.3",
    "text": "Farklı yazı karakterleri ile yazılmış yazıları okur.",
    "guidanceNotes": [],
    "unitId": "okuma",
    "unitName": "Okuma",
    "topicId": "akici-okuma",
    "topicName": "Akıcı Okuma",
    "page": 48
  },
  {
    "code": "T.8.3.4",
    "text": "Okuma stratejilerini kullanır.",
    "guidanceNotes": [
      "Göz atarak, özetleyerek, not alarak, tartışarak ve eleştirerek okuma gibi yöntem ve teknikleri kullanmaları sağlanır."
    ],
    "unitId": "okuma",
    "unitName": "Okuma",
    "topicId": "akici-okuma",
    "topicName": "Akıcı Okuma",
    "page": 48
  },
  {
    "code": "T.8.3.5",
    "text": "Bağlamdan yararlanarak bilmediği kelime ve kelime gruplarının anlamını tahmin eder.",
    "guidanceNotes": [
      "a) Öğrencilerin tahmin ettikleri kelime ve kelime gruplarını öğrenmek için sözlük, atasözleri ve deyimler sözlüğü vb. araçları kullanmaları sağlanır.",
      "b) Öğrencinin öğrendiği kelime ve kelime gruplarından sözlük oluşturması teşvik edilir."
    ],
    "unitId": "okuma",
    "unitName": "Okuma",
    "topicId": "soz-varligi",
    "topicName": "Söz Varlığı",
    "page": 48
  },
  {
    "code": "T.8.3.6",
    "text": "Deyim, atasözü ve özdeyişlerin metne katkısını belirler.",
    "guidanceNotes": [],
    "unitId": "okuma",
    "unitName": "Okuma",
    "topicId": "soz-varligi",
    "topicName": "Söz Varlığı",
    "page": 48
  },
  {
    "code": "T.8.3.7",
    "text": "Metindeki söz sanatlarını tespit eder.",
    "guidanceNotes": [
      "Benzetme (teşbih), kişileştirme (teşhis), konuşturma (intak) ve karşıtlık (tezat), abartma (mübalağa) söz sanatlarının belirlenmesi sağlanır."
    ],
    "unitId": "okuma",
    "unitName": "Okuma",
    "topicId": "soz-varligi",
    "topicName": "Söz Varlığı",
    "page": 48
  },
  {
    "code": "T.8.3.8",
    "text": "Metindeki anlatım bozukluklarını belirler.",
    "guidanceNotes": [
      "Dil bilgisi yönünden anlatım bozuklukları üzerinde durulur."
    ],
    "unitId": "okuma",
    "unitName": "Okuma",
    "topicId": "soz-varligi",
    "topicName": "Söz Varlığı",
    "page": 48
  },
  {
    "code": "T.8.3.9",
    "text": "Fiilimsilerin cümledeki işlevlerini kavrar.",
    "guidanceNotes": [
      "Fiilimsilerin türleri fark ettirilir. Ekler ezberletilmez."
    ],
    "unitId": "okuma",
    "unitName": "Okuma",
    "topicId": "soz-varligi",
    "topicName": "Söz Varlığı",
    "page": 48
  },
  {
    "code": "T.8.3.10",
    "text": "Geçiş ve bağlantı ifadelerinin metnin anlamına olan katkısını değerlendirir.",
    "guidanceNotes": [
      "Oysaki, başka bir deyişle, özellikle, kısaca, böylece, ilk olarak ve son olarak ifadeleri üzerinde durulur."
    ],
    "unitId": "okuma",
    "unitName": "Okuma",
    "topicId": "soz-varligi",
    "topicName": "Söz Varlığı",
    "page": 48
  },
  {
    "code": "T.8.3.11",
    "text": "Metindeki anlatım biçimlerini belirler.",
    "guidanceNotes": [],
    "unitId": "okuma",
    "unitName": "Okuma",
    "topicId": "soz-varligi",
    "topicName": "Söz Varlığı",
    "page": 48
  },
  {
    "code": "T.8.3.12",
    "text": "Görsel ve başlıktan hareketle okuyacağı metnin konusunu tahmin eder.",
    "guidanceNotes": [],
    "unitId": "okuma",
    "unitName": "Okuma",
    "topicId": "anlama",
    "topicName": "Anlama",
    "page": 48
  },
  {
    "code": "T.8.3.13",
    "text": "Okuduklarını özetler.",
    "guidanceNotes": [],
    "unitId": "okuma",
    "unitName": "Okuma",
    "topicId": "anlama",
    "topicName": "Anlama",
    "page": 48
  },
  {
    "code": "T.8.3.14",
    "text": "Metinle ilgili soruları cevaplar.",
    "guidanceNotes": [
      "Metin içi ve metin dışı anlam ilişkisi kurulur."
    ],
    "unitId": "okuma",
    "unitName": "Okuma",
    "topicId": "anlama",
    "topicName": "Anlama",
    "page": 48
  },
  {
    "code": "T.8.3.15",
    "text": "Metinle ilgili sorular sorar.",
    "guidanceNotes": [],
    "unitId": "okuma",
    "unitName": "Okuma",
    "topicId": "anlama",
    "topicName": "Anlama",
    "page": 48
  },
  {
    "code": "T.8.3.16",
    "text": "Metnin konusunu belirler.",
    "guidanceNotes": [],
    "unitId": "okuma",
    "unitName": "Okuma",
    "topicId": "anlama",
    "topicName": "Anlama",
    "page": 48
  },
  {
    "code": "T.8.3.17",
    "text": "Metnin ana fikrini/ana duygusunu belirler.",
    "guidanceNotes": [],
    "unitId": "okuma",
    "unitName": "Okuma",
    "topicId": "anlama",
    "topicName": "Anlama",
    "page": 48
  },
  {
    "code": "T.8.3.18",
    "text": "Metindeki yardımcı fikirleri belirler.",
    "guidanceNotes": [],
    "unitId": "okuma",
    "unitName": "Okuma",
    "topicId": "anlama",
    "topicName": "Anlama",
    "page": 48
  },
  {
    "code": "T.8.3.19",
    "text": "Metnin içeriğine uygun başlık/başlıklar belirler.",
    "guidanceNotes": [],
    "unitId": "okuma",
    "unitName": "Okuma",
    "topicId": "anlama",
    "topicName": "Anlama",
    "page": 48
  },
  {
    "code": "T.8.3.20",
    "text": "Okuduğu metinlerdeki hikâye unsurlarını belirler.",
    "guidanceNotes": [
      "Olay örgüsü, mekân, zaman, şahıs ve varlık kadrosu, anlatıcı üzerinde durulur."
    ],
    "unitId": "okuma",
    "unitName": "Okuma",
    "topicId": "anlama",
    "topicName": "Anlama",
    "page": 49
  },
  {
    "code": "T.8.3.21",
    "text": "Metnin içeriğini yorumlar.",
    "guidanceNotes": [
      "a) Yazarın olaylara bakış açısının tespit edilmesi sağlanır.",
      "b) Metindeki öznel ve nesnel yaklaşımların tespit edilmesi sağlanır.",
      "c) Metindeki örnek ve ayrıntılara atıf yapılması sağlanır."
    ],
    "unitId": "okuma",
    "unitName": "Okuma",
    "topicId": "anlama",
    "topicName": "Anlama",
    "page": 49
  },
  {
    "code": "T.8.3.22",
    "text": "Metinde ele alınan sorunlara farklı çözümler üretir.",
    "guidanceNotes": [],
    "unitId": "okuma",
    "unitName": "Okuma",
    "topicId": "anlama",
    "topicName": "Anlama",
    "page": 49
  },
  {
    "code": "T.8.3.23",
    "text": "Metinler arasında karşılaştırma yapar.",
    "guidanceNotes": [
      "Aynı metnin çeviri, farklı baskı vb. özellikleri itibarıyla karşılaştırılması sağlanır."
    ],
    "unitId": "okuma",
    "unitName": "Okuma",
    "topicId": "anlama",
    "topicName": "Anlama",
    "page": 49
  },
  {
    "code": "T.8.3.24",
    "text": "Metindeki gerçek ve kurgusal unsurları ayırt eder.",
    "guidanceNotes": [],
    "unitId": "okuma",
    "unitName": "Okuma",
    "topicId": "anlama",
    "topicName": "Anlama",
    "page": 49
  },
  {
    "code": "T.8.3.25",
    "text": "Okudukları ile ilgili çıkarımlarda bulunur.",
    "guidanceNotes": [
      "Neden-sonuç, amaç-sonuç, koşul, karşılaştırma, benzetme, örneklendirme, abartma, nesnel, öznel ve duygu belirten ifadeler üzerinde durulur."
    ],
    "unitId": "okuma",
    "unitName": "Okuma",
    "topicId": "anlama",
    "topicName": "Anlama",
    "page": 49
  },
  {
    "code": "T.8.3.26",
    "text": "Metin türlerini ayırt eder.",
    "guidanceNotes": [
      "a) Fıkra (köşe yazısı), makale, deneme, roman, destan türleri üzerinde durulur.",
      "b) Metin türlerine ilişkin ayrıntılı bilgi verilmemelidir."
    ],
    "unitId": "okuma",
    "unitName": "Okuma",
    "topicId": "anlama",
    "topicName": "Anlama",
    "page": 49
  },
  {
    "code": "T.8.3.27",
    "text": "Görsellerle ilgili soruları cevaplar.",
    "guidanceNotes": [
      "a) Çizgi roman ve karikatürleri yorumlayarak görüşlerini bildirmeleri sağlanır.",
      "b) Haberi/bilgiyi görsel yorumcuların nasıl ilettikleri üzerinde durulur."
    ],
    "unitId": "okuma",
    "unitName": "Okuma",
    "topicId": "anlama",
    "topicName": "Anlama",
    "page": 49
  },
  {
    "code": "T.8.3.28",
    "text": "Metinde önemli noktaların vurgulanış biçimlerini kavrar.",
    "guidanceNotes": [
      "Altını çizmenin, koyu veya italik yazmanın, renklendirmenin, farklı punto veya font kullanmanın işlevi vurgulanır."
    ],
    "unitId": "okuma",
    "unitName": "Okuma",
    "topicId": "anlama",
    "topicName": "Anlama",
    "page": 49
  },
  {
    "code": "T.8.3.29",
    "text": "Medya metinlerini analiz eder.",
    "guidanceNotes": [
      "Medya metinlerinin amaçlarının (kültür aktarma, olay yorumlama, bilgilendirme, eğlendirme, ikna etme) belirlenmesi sağlanır."
    ],
    "unitId": "okuma",
    "unitName": "Okuma",
    "topicId": "anlama",
    "topicName": "Anlama",
    "page": 49
  },
  {
    "code": "T.8.3.30",
    "text": "Bilgi kaynaklarını etkili bir şekilde kullanır.",
    "guidanceNotes": [],
    "unitId": "okuma",
    "unitName": "Okuma",
    "topicId": "anlama",
    "topicName": "Anlama",
    "page": 49
  },
  {
    "code": "T.8.3.31",
    "text": "Bilgi kaynaklarının güvenilirliğini sorgular.",
    "guidanceNotes": [
      "a) Blog ve şahsi internet sayfalarındaki bilgilerin güvenilirliği konusunda çalışmalar yapılır.",
      "b) Bilimsel çalışmalarda ağırlıklı olarak “edu” ve “gov” uzantılı sitelerin kullanıldığı vurgulanır."
    ],
    "unitId": "okuma",
    "unitName": "Okuma",
    "topicId": "anlama",
    "topicName": "Anlama",
    "page": 49
  },
  {
    "code": "T.8.3.32",
    "text": "Grafik, tablo ve çizelgeyle sunulan bilgileri yorumlar.",
    "guidanceNotes": [],
    "unitId": "okuma",
    "unitName": "Okuma",
    "topicId": "anlama",
    "topicName": "Anlama",
    "page": 49
  },
  {
    "code": "T.8.3.33",
    "text": "Edebî eserin yazılı metni ile medya sunumunu karşılaştırır.",
    "guidanceNotes": [
      "Kahramanlar, mekân, zaman ve olay yönünden karşılaştırılması sağlanır."
    ],
    "unitId": "okuma",
    "unitName": "Okuma",
    "topicId": "anlama",
    "topicName": "Anlama",
    "page": 49
  },
  {
    "code": "T.8.3.34",
    "text": "Okuduklarında kullanılan düşünceyi geliştirme yollarını belirler.",
    "guidanceNotes": [],
    "unitId": "okuma",
    "unitName": "Okuma",
    "topicId": "anlama",
    "topicName": "Anlama",
    "page": 49
  },
  {
    "code": "T.8.3.35",
    "text": "Metindeki iş ve işlem basamaklarını kavrar.",
    "guidanceNotes": [
      "Kullanım kılavuzları inceletilir."
    ],
    "unitId": "okuma",
    "unitName": "Okuma",
    "topicId": "anlama",
    "topicName": "Anlama",
    "page": 49
  },
  {
    "code": "T.8.4.1",
    "text": "Şiir yazar.",
    "guidanceNotes": [],
    "unitId": "yazma",
    "unitName": "Yazma",
    "topicId": "yazma",
    "topicName": "Yazma",
    "page": 50
  },
  {
    "code": "T.8.4.2",
    "text": "Bilgilendirici metin yazar.",
    "guidanceNotes": [
      "a) Öğrencilerin belirledikleri bir konu ve ana fikir etrafında giriş, gelişme ve sonuç bölümlerinden oluşan bir metin taslağı oluşturmaları, gelişme bölümünde düşünceyi geliştirme yollarını kullanarak görüşlerini ifade etmeleri, görüşlerini destekleyecek kanıtlar sunmaları, sonuç bölümünde ise görüşlerini sonuca bağlamaları sağlanır.",
      "b) Öğrenciler günlük hayattan örnekler vermeye teşvik edilir."
    ],
    "unitId": "yazma",
    "unitName": "Yazma",
    "topicId": "yazma",
    "topicName": "Yazma",
    "page": 50
  },
  {
    "code": "T.8.4.3",
    "text": "Hikâye edici metin yazar.",
    "guidanceNotes": [
      "a) Öğrencilerin anlatımın türü ve konusuna göre gerçekçi veya hayalî ögeleri tasarlamaları, uyumlu bir zaman ve mekân kurgusu yapmaları, serim, düğüm ve çözüm bölümlerine yer vermeleri sağlanır.",
      "b) Öğrenciler yazım kılavuzundan yaralanmaya, günlük hayattan örnekler vermeye yönlendirilir."
    ],
    "unitId": "yazma",
    "unitName": "Yazma",
    "topicId": "yazma",
    "topicName": "Yazma",
    "page": 50
  },
  {
    "code": "T.8.4.4",
    "text": "Yazma stratejilerini uygular.",
    "guidanceNotes": [
      "Not alma, özet çıkarma, eleştirel, yaratıcı, serbest, kelime ve kavram havuzundan seçerek yazma, bir metinden ve duyulardan hareketle yazma gibi yöntem ve tekniklerin kullanılması sağlanır."
    ],
    "unitId": "yazma",
    "unitName": "Yazma",
    "topicId": "yazma",
    "topicName": "Yazma",
    "page": 50
  },
  {
    "code": "T.8.4.5",
    "text": "Anlatımı desteklemek için grafik ve tablo kullanır.",
    "guidanceNotes": [],
    "unitId": "yazma",
    "unitName": "Yazma",
    "topicId": "yazma",
    "topicName": "Yazma",
    "page": 50
  },
  {
    "code": "T.8.4.6",
    "text": "Bir işi işlem basamaklarına göre yazar.",
    "guidanceNotes": [],
    "unitId": "yazma",
    "unitName": "Yazma",
    "topicId": "yazma",
    "topicName": "Yazma",
    "page": 50
  },
  {
    "code": "T.8.4.7",
    "text": "Yazılarını zenginleştirmek için atasözleri, deyimler ve özdeyişler kullanır.",
    "guidanceNotes": [],
    "unitId": "yazma",
    "unitName": "Yazma",
    "topicId": "yazma",
    "topicName": "Yazma",
    "page": 50
  },
  {
    "code": "T.8.4.8",
    "text": "Yazılarında mizahi ögeler kullanır.",
    "guidanceNotes": [],
    "unitId": "yazma",
    "unitName": "Yazma",
    "topicId": "yazma",
    "topicName": "Yazma",
    "page": 50
  },
  {
    "code": "T.8.4.9",
    "text": "Yazılarında anlatım biçimlerini kullanır.",
    "guidanceNotes": [],
    "unitId": "yazma",
    "unitName": "Yazma",
    "topicId": "yazma",
    "topicName": "Yazma",
    "page": 50
  },
  {
    "code": "T.8.4.10",
    "text": "Yazdıklarında yabancı dillerden alınmış, dilimize henüz yerleşmemiş kelimelerin Türkçelerini kullanır.",
    "guidanceNotes": [],
    "unitId": "yazma",
    "unitName": "Yazma",
    "topicId": "yazma",
    "topicName": "Yazma",
    "page": 50
  },
  {
    "code": "T.8.4.11",
    "text": "Formları yönergelerine uygun doldurur.",
    "guidanceNotes": [],
    "unitId": "yazma",
    "unitName": "Yazma",
    "topicId": "yazma",
    "topicName": "Yazma",
    "page": 50
  },
  {
    "code": "T.8.4.12",
    "text": "Kısa metinler yazar.",
    "guidanceNotes": [
      "Haber metni, günlük ve anı yazmaya teşvik edilir."
    ],
    "unitId": "yazma",
    "unitName": "Yazma",
    "topicId": "yazma",
    "topicName": "Yazma",
    "page": 50
  },
  {
    "code": "T.8.4.13",
    "text": "Yazdıklarının içeriğine uygun başlık belirler.",
    "guidanceNotes": [],
    "unitId": "yazma",
    "unitName": "Yazma",
    "topicId": "yazma",
    "topicName": "Yazma",
    "page": 50
  },
  {
    "code": "T.8.4.14",
    "text": "Araştırmalarının sonuçlarını yazılı olarak sunar.",
    "guidanceNotes": [
      "a) Öğrencilerin taslak hazırlamaları, taslaklarında giriş, gelişme, sonuç bölümlerine yer vermeleri sağlanır.",
      "b) Kaynak gösterme hakkında bilgi verilir."
    ],
    "unitId": "yazma",
    "unitName": "Yazma",
    "topicId": "yazma",
    "topicName": "Yazma",
    "page": 50
  },
  {
    "code": "T.8.4.15",
    "text": "Yazılarında uygun geçiş ve bağlantı ifadelerini kullanır.",
    "guidanceNotes": [
      "Oysaki, başka bir deyişle, özellikle, ilk olarak ve son olarak ifadelerinin kullanılması sağlanır."
    ],
    "unitId": "yazma",
    "unitName": "Yazma",
    "topicId": "yazma",
    "topicName": "Yazma",
    "page": 50
  },
  {
    "code": "T.8.4.16",
    "text": "Yazdıklarını düzenler.",
    "guidanceNotes": [
      "a) Dil bilgisine dayalı anlatım bozuklukları bakımından yazdıklarını gözden geçirmesi ve düzeltmesi sağlanır.",
      "b) Metinde yer alan yazım ve noktalama kuralları ile sınırlı tutulur."
    ],
    "unitId": "yazma",
    "unitName": "Yazma",
    "topicId": "yazma",
    "topicName": "Yazma",
    "page": 50
  },
  {
    "code": "T.8.4.17",
    "text": "Yazdıklarını paylaşır.",
    "guidanceNotes": [
      "Öğrenciler yazdıklarını sınıf ve okul panosu ile sosyal medya ortamlarında paylaşmaya, şiir ve kompozisyon yarışmalarına katılmaya teşvik edilir."
    ],
    "unitId": "yazma",
    "unitName": "Yazma",
    "topicId": "yazma",
    "topicName": "Yazma",
    "page": 50
  },
  {
    "code": "T.8.4.18",
    "text": "Cümlenin ögelerini ayırt eder.",
    "guidanceNotes": [],
    "unitId": "yazma",
    "unitName": "Yazma",
    "topicId": "yazma",
    "topicName": "Yazma",
    "page": 50
  },
  {
    "code": "T.8.4.19",
    "text": "Cümle türlerini tanır.",
    "guidanceNotes": [
      "Kavramsal tanımlamalara girilmez."
    ],
    "unitId": "yazma",
    "unitName": "Yazma",
    "topicId": "yazma",
    "topicName": "Yazma",
    "page": 50
  },
  {
    "code": "T.8.4.20",
    "text": "Fiillerin çatı özelliklerinin anlama olan katkısını kavrar.",
    "guidanceNotes": [
      "Kavram tanımlarına girilmeden anlamsal farklılıklara değinilir."
    ],
    "unitId": "yazma",
    "unitName": "Yazma",
    "topicId": "yazma",
    "topicName": "Yazma",
    "page": 50
  }
]);

export const GRADE_8_TURKISH_OUTCOMES_2019 = Object.freeze(
  RAW_OUTCOMES.map(record => defineCurriculumOutcome({
    id: `tr.pre-tymm.g8.turkce.${record.code.toLocaleLowerCase('tr-TR').replaceAll('.', '-')}`,
    grade: 8,
    schoolType: 'ILKOKUL_ORTAOKUL_GENEL',
    courseId: 'turkce',
    courseName: 'Türkçe',
    unitId: record.unitId,
    unitName: record.unitName,
    topicId: record.topicId,
    topicName: record.topicName,
    officialOutcomeCode: record.code,
    officialOutcomeText: record.text,
    officialGuidanceNotes: record.guidanceNotes,
    sourceId: SOURCE_ID,
    sourceLocator: `${SOURCE_DOCUMENT}; s. ${record.page}; ${record.code}; ${SOURCE_URL}`
  }))
);

export const GRADE_8_TURKISH_INGESTION_STATUS = defineIngestionStatus({
  id: 'tr-2026-2027-g8-turkce-outcomes',
  schoolYear: '2026-2027',
  grade: 8,
  courseId: 'turkce',
  status: 'COMPLETE',
  sourceId: SOURCE_ID,
  outcomeCount: GRADE_8_TURKISH_OUTCOMES_2019.length,
  lastVerifiedAt: '2026-08-03'
});

export function grade8TurkishOutcomeByCode(code) {
  const value = String(code ?? '').trim();
  return GRADE_8_TURKISH_OUTCOMES_2019.find(record => record.officialOutcomeCode === value) || null;
}

export function grade8TurkishOutcomeAudit() {
  const codes = GRADE_8_TURKISH_OUTCOMES_2019.map(record => record.officialOutcomeCode);
  const domainCounts = GRADE_8_TURKISH_OUTCOMES_2019.reduce((counts, record) => {
    counts[record.unitId] = (counts[record.unitId] || 0) + 1;
    return counts;
  }, {});
  return Object.freeze({
    ok: GRADE_8_TURKISH_OUTCOMES_2019.length === 76
      && new Set(codes).size === 76
      && GRADE_8_TURKISH_OUTCOMES_2019.every(record => record.verificationStatus === 'SOURCE_VERIFIED'),
    outcomeCount: GRADE_8_TURKISH_OUTCOMES_2019.length,
    domainCounts: Object.freeze({ ...domainCounts }),
    duplicateCodeCount: codes.length - new Set(codes).size
  });
}
