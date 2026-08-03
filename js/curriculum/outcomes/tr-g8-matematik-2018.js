import { defineCurriculumOutcome, defineIngestionStatus } from '../curriculum-ingestion-contract.js';

const SOURCE_ID = 'meb-legacy-programs';
const SOURCE_DOCUMENT = 'Matematik Dersi Öğretim Programı (İlkokul ve Ortaokul 1-8. Sınıflar), 2018';
const SOURCE_URL = 'https://mufredat.meb.gov.tr/Dosyalar/201813017165445-MATEMAT%C4%B0K%20%C3%96%C4%9ERET%C4%B0M%20PROGRAMI%202018v.pdf';

const TOPICS = Object.freeze({
  '1.1': ['sayilar-ve-islemler', 'Sayılar ve İşlemler', 'carpanlar-ve-katlar', 'Çarpanlar ve Katlar', 71],
  '1.2': ['sayilar-ve-islemler', 'Sayılar ve İşlemler', 'uslu-ifadeler', 'Üslü İfadeler', 71],
  '1.3': ['sayilar-ve-islemler', 'Sayılar ve İşlemler', 'karekoklu-ifadeler', 'Kareköklü İfadeler', 71],
  '2.1': ['cebir', 'Cebir', 'cebirsel-ifadeler-ve-ozdeslikler', 'Cebirsel İfadeler ve Özdeşlikler', 72],
  '2.2': ['cebir', 'Cebir', 'dogrusal-denklemler', 'Doğrusal Denklemler', 73],
  '2.3': ['cebir', 'Cebir', 'esitsizlikler', 'Eşitsizlikler', 73],
  '3.1': ['geometri-ve-olcme', 'Geometri ve Ölçme', 'ucgenler', 'Üçgenler', 74],
  '3.2': ['geometri-ve-olcme', 'Geometri ve Ölçme', 'donusum-geometrisi', 'Dönüşüm Geometrisi', 74],
  '3.3': ['geometri-ve-olcme', 'Geometri ve Ölçme', 'eslik-ve-benzerlik', 'Eşlik ve Benzerlik', 75],
  '3.4': ['geometri-ve-olcme', 'Geometri ve Ölçme', 'geometrik-cisimler', 'Geometrik Cisimler', 75],
  '4.1': ['veri-isleme', 'Veri İşleme', 'veri-analizi', 'Veri Analizi', 76],
  '5.1': ['olasilik', 'Olasılık', 'basit-olaylarin-olma-olasiligi', 'Basit Olayların Olma Olasılığı', 76]
});

function row(code, text, notes = [], evidence = ['single-choice', 'worked-solution', 'independent-computation']) {
  const [, , area, topic] = code.split('.');
  const [unitId, unitName, topicId, topicName, page] = TOPICS[`${area}.${topic}`];
  return { code, text, notes, evidence, unitId, unitName, topicId, topicName, page };
}

const RAW = Object.freeze([
  row('M.8.1.1.1', 'Verilen pozitif tam sayıların pozitif tam sayı çarpanlarını bulur, pozitif tam sayıların pozitif tam sayı çarpanlarını üslü ifadelerin çarpımı şeklinde yazar.', ['Bir pozitif tam sayının asal çarpanlarını bulmaya yönelik çalışmalara da yer verilir.']),
  row('M.8.1.1.2', 'İki doğal sayının en büyük ortak bölenini (EBOB) ve en küçük ortak katını (EKOK) hesaplar, ilgili problemleri çözer.', ['Alan ve hacim hesaplamayı gerektiren problemlere girilmez.']),
  row('M.8.1.1.3', 'Verilen iki doğal sayının aralarında asal olup olmadığını belirler.'),
  row('M.8.1.2.1', 'Tam sayıların, tam sayı kuvvetlerini hesaplar.'),
  row('M.8.1.2.2', 'Üslü ifadelerle ilgili temel kuralları anlar, birbirine denk ifadeler oluşturur.', ['Sıfırıncı kuvvet, negatif üs, çarpma-bölme ve kuvvetin kuvveti kuralları ele alınır.']),
  row('M.8.1.2.3', 'Sayıların ondalık gösterimlerini 10’un tam sayı kuvvetlerini kullanarak çözümler.'),
  row('M.8.1.2.4', 'Verilen bir sayıyı 10’un farklı tam sayı kuvvetlerini kullanarak ifade eder.'),
  row('M.8.1.2.5', 'Çok büyük ve çok küçük sayıları bilimsel gösterimle ifade eder ve karşılaştırır.', ['Bilimsel gösterimde katsayının pozitif, 1 veya 1’den büyük ve 10’dan küçük olduğu durumlarla sınırlı kalınır.']),
  row('M.8.1.3.1', 'Tam kare pozitif tam sayılarla bu sayıların karekökleri arasındaki ilişkiyi belirler.', ['Alan ve kenar ilişkisini gösteren kare modellerinden yararlanılabilir.']),
  row('M.8.1.3.2', 'Tam kare olmayan kareköklü bir sayının hangi iki doğal sayı arasında olduğunu belirler.'),
  row('M.8.1.3.3', 'Kareköklü bir ifadeyi a√b şeklinde yazar ve a√b şeklindeki ifadede katsayıyı kök içine alır.'),
  row('M.8.1.3.4', 'Kareköklü ifadelerde çarpma ve bölme işlemlerini yapar.', ['Paydada birden fazla kareköklü terim bulunan ifadelere girilmez.']),
  row('M.8.1.3.5', 'Kareköklü ifadelerde toplama ve çıkarma işlemlerini yapar.', ['Paydada birden fazla kareköklü terim bulunan ifadelere girilmez.']),
  row('M.8.1.3.6', 'Kareköklü bir ifade ile çarpıldığında, sonucu bir doğal sayı yapan çarpanlara örnek verir.'),
  row('M.8.1.3.7', 'Ondalık ifadelerin kareköklerini belirler.', ['Kesir biçiminde payı ve paydası tam kare olan ondalık gösterimlerle çalışılır.']),
  row('M.8.1.3.8', 'Gerçek sayıları tanır, rasyonel ve irrasyonel sayılarla ilişkilendirir.', ['Tam kare olmayan sayıların kareköklerinin rasyonel olmadığına ve π sayısının irrasyonel olduğuna dikkat çekilir.']),
  row('M.8.2.1.1', 'Basit cebirsel ifadeleri anlar ve farklı biçimlerde yazar.', ['Terim, katsayı, değişken ve sabit terim kavramları üzerinde durulur.']),
  row('M.8.2.1.2', 'Cebirsel ifadelerin çarpımını yapar.', ['Katsayılar tam sayılardan seçilir ve modellemeye yer verilir.']),
  row('M.8.2.1.3', 'Özdeşlikleri modellerle açıklar.', ['(a±b)² ve iki kare farkı özdeşlikleriyle sınırlı kalınır.']),
  row('M.8.2.1.4', 'Cebirsel ifadeleri çarpanlara ayırır.', ['Ortak çarpan, iki kare farkı ve tam kare ifadeler ele alınır; gruplandırmaya girilmez.']),
  row('M.8.2.2.1', 'Birinci dereceden bir bilinmeyenli denklemleri çözer.', ['Katsayıları rasyonel sayı olan denklemlere yer verilir.']),
  row('M.8.2.2.2', 'Koordinat sistemini özellikleriyle tanır ve sıralı ikilileri gösterir.', ['Gerçek hayat durumlarıyla koordinat sistemi ilişkilendirilir.'], ['single-choice', 'interactive-simulation', 'independent-computation']),
  row('M.8.2.2.3', 'Aralarında doğrusal ilişki bulunan iki değişkenden birinin diğerine bağlı olarak nasıl değiştiğini tablo ve denklem ile ifade eder.', ['Bağımlı ve bağımsız değişkenler belirlenir.']),
  row('M.8.2.2.4', 'Doğrusal denklemlerin grafiğini çizer.', ['Eksenleri kesme, paralellik ve orijinden geçme durumları ele alınır.'], ['single-choice', 'interactive-simulation', 'worked-solution']),
  row('M.8.2.2.5', 'Doğrusal ilişki içeren gerçek hayat durumlarına ait denklem, tablo ve grafiği oluşturur ve yorumlar.'),
  row('M.8.2.2.6', 'Doğrunun eğimini modellerle açıklar, doğrusal denklemleri ve grafiklerini eğimle ilişkilendirir.', ['Eğimin işareti ve büyüklüğünün anlamı üzerinde durulur.']),
  row('M.8.2.3.1', 'Birinci dereceden bir bilinmeyenli eşitsizlik içeren günlük hayat durumlarına uygun matematik cümleleri yazar.'),
  row('M.8.2.3.2', 'Birinci dereceden bir bilinmeyenli eşitsizlikleri sayı doğrusunda gösterir.', [], ['single-choice', 'interactive-simulation', 'worked-solution']),
  row('M.8.2.3.3', 'Birinci dereceden bir bilinmeyenli eşitsizlikleri çözer.', ['En çok iki işlem gerektiren eşitsizliklerle çalışılır; negatif sayıyla çarpma veya bölmede yön değişimi fark ettirilir.']),
  row('M.8.3.1.1', 'Üçgende kenarortay, açıortay ve yüksekliği inşa eder.', ['Özel üçgenlerde bu elemanların özellikleri de incelenir.'], ['interactive-simulation', 'open-response', 'human-rubric']),
  row('M.8.3.1.2', 'Üçgenin iki kenar uzunluğunun toplamı veya farkı ile üçüncü kenarının uzunluğunu ilişkilendirir.'),
  row('M.8.3.1.3', 'Üçgenin kenar uzunlukları ile bu kenarların karşısındaki açıların ölçülerini ilişkilendirir.'),
  row('M.8.3.1.4', 'Yeterli sayıda elemanının ölçüleri verilen bir üçgeni çizer.', ['Üç kenar; bir kenar ve iki açı; iki kenar ve aralarındaki açı durumları ele alınır.'], ['interactive-simulation', 'open-response', 'human-rubric']),
  row('M.8.3.1.5', 'Pisagor bağıntısını oluşturur, ilgili problemleri çözer.', ['Gerçek hayat, koordinat düzleminde uzaklık ve üçgenin dikliğini belirleme uygulamalarına yer verilir.']),
  row('M.8.3.2.1', 'Nokta, doğru parçası ve diğer şekillerin öteleme sonucundaki görüntülerini çizer.', [], ['interactive-simulation', 'drag-drop', 'independent-computation']),
  row('M.8.3.2.2', 'Nokta, doğru parçası ve diğer şekillerin yansıma sonucu oluşan görüntüsünü oluşturur.', [], ['interactive-simulation', 'drag-drop', 'independent-computation']),
  row('M.8.3.2.3', 'Çokgenlerin öteleme ve yansımalar sonucunda ortaya çıkan görüntüsünü oluşturur.', ['En çok iki ardışık dönüşüme yer verilir; geleneksel sanat motiflerinden yararlanılabilir.'], ['interactive-simulation', 'drag-drop', 'independent-computation']),
  row('M.8.3.3.1', 'Eşlik ve benzerliği ilişkilendirir, eş ve benzer şekillerin kenar ve açı ilişkilerini belirler.', ['Eş şekillerin benzer olduğu ancak benzer şekillerin eş olmak zorunda olmadığı vurgulanır.']),
  row('M.8.3.3.2', 'Benzer çokgenlerin benzerlik oranını belirler, bir çokgene eş ve benzer çokgenler oluşturur.', ['Çokgenlerde benzerlik problemlerine girilmez.'], ['single-choice', 'interactive-simulation', 'independent-computation']),
  row('M.8.3.4.1', 'Dik prizmaları tanır, temel elemanlarını belirler, inşa eder ve açınımını çizer.', [], ['interactive-simulation', 'drag-drop', 'human-rubric']),
  row('M.8.3.4.2', 'Dik dairesel silindirin temel elemanlarını belirler, inşa eder ve açınımını çizer.', [], ['interactive-simulation', 'drag-drop', 'human-rubric']),
  row('M.8.3.4.3', 'Dik dairesel silindirin yüzey alanı bağıntısını oluşturur, ilgili problemleri çözer.'),
  row('M.8.3.4.4', 'Dik dairesel silindirin hacim bağıntısını oluşturur; ilgili problemleri çözer.', ['Hacim tahmini ve dik prizmanın hacmiyle ilişki ele alınır.']),
  row('M.8.3.4.5', 'Dik piramidi tanır, temel elemanlarını belirler, inşa eder ve açınımını çizer.', ['Alan ve hacim problemlerine girilmez.'], ['interactive-simulation', 'drag-drop', 'human-rubric']),
  row('M.8.3.4.6', 'Dik koniyi tanır, temel elemanlarını belirler, inşa eder ve açınımını çizer.', ['Alan ve hacim problemlerine girilmez.'], ['interactive-simulation', 'drag-drop', 'human-rubric']),
  row('M.8.4.1.1', 'En fazla üç veri grubuna ait çizgi ve sütun grafiklerini yorumlar.', [], ['single-choice', 'worked-solution', 'data-verification']),
  row('M.8.4.1.2', 'Verileri sütun, daire veya çizgi grafiği ile gösterir ve bu gösterimler arasında uygun olan dönüşümleri yapar.', ['Farklı gösterimlerin üstün ve zayıf yönleri üzerinde durulur.'], ['single-choice', 'interactive-simulation', 'data-verification']),
  row('M.8.5.1.1', 'Bir olaya ait olası durumları belirler.', ['Birden fazla olayın olası durumları ele alınmaz.']),
  row('M.8.5.1.2', '“Daha fazla”, “eşit”, “daha az” olasılıklı olayları ayırt eder, örnek verir.', ['Olasılık hesabı gerektirmeyen sezgisel durumlar ele alınır.']),
  row('M.8.5.1.3', 'Eşit şansa sahip olan olaylarda her bir çıktının olasılık değerinin eşit olduğunu ve bu değerin 1/n olduğunu açıklar.', ['Eşit şansa sahip olan ve olmayan olaylar ayırt edilir.']),
  row('M.8.5.1.4', 'Olasılık değerinin 0 ile 1 arasında (0 ve 1 dâhil) olduğunu anlar.', ['İmkânsız ve kesin olay ile bir olayın olma ve olmama olasılıklarının toplamı ele alınır.']),
  row('M.8.5.1.5', 'Basit bir olayın olma olasılığını hesaplar.', ['Birden fazla olayın, bağımlı-bağımsız veya ayrık-ayrık olmayan olayların olasılığına girilmez.'])
]);

export const GRADE8_MATH_OUTCOMES_2018 = Object.freeze(RAW.map(record => defineCurriculumOutcome({
  id: `tr.pre-tymm.g8.matematik.${record.code.toLowerCase().replaceAll('.', '-')}`,
  grade: 8,
  schoolType: 'ILKOKUL_ORTAOKUL_GENEL',
  courseId: 'matematik',
  courseName: 'Matematik',
  unitId: record.unitId,
  unitName: record.unitName,
  topicId: record.topicId,
  topicName: record.topicName,
  officialOutcomeCode: record.code,
  officialOutcomeText: record.text,
  officialGuidanceNotes: record.notes,
  sourceId: SOURCE_ID,
  sourceLocator: `${SOURCE_DOCUMENT}; PDF s. ${record.page}; ${record.code}; ${SOURCE_URL}`,
  assessmentEvidenceTypes: record.evidence
})));

export const GRADE8_MATH_INGESTION_STATUS = defineIngestionStatus({
  id: 'tr-2026-2027-g8-matematik-full-scope',
  schoolYear: '2026-2027',
  grade: 8,
  courseId: 'matematik',
  status: 'COMPLETE',
  sourceId: SOURCE_ID,
  outcomeCount: GRADE8_MATH_OUTCOMES_2018.length,
  lastVerifiedAt: '2026-08-03',
  blockers: []
});

export function grade8MathOutcomeByCode(code) {
  return GRADE8_MATH_OUTCOMES_2018.find(record => record.officialOutcomeCode === String(code ?? '').trim()) || null;
}
