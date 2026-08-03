import { defineCanonicalQuestion } from './canonical-question-contract.js';
import { defineSubjectEngine } from './subject-engine-contract.js';
import { grade8TurkishOutcomeByCode } from '../curriculum/outcomes/tr-g8-turkce-2019.js';
import { auditGrade8TurkishCalibrationQuestion } from './turkish-g8-reading-calibration.js';

const STYLE_REFERENCE_IDS = Object.freeze([
  'user-ozdebir-paragraph-sample',
  'phase4b-human-approved-option-balance',
  'phase4c-human-feedback-literary-diversity'
]);

function opt(id, text, {
  correct = false,
  support = [],
  partial = [],
  contradictions = [],
  scope = 'preserved',
  fit = 'full',
  misconceptionId = null,
  feedback
}) {
  return Object.freeze({
    id,
    text,
    correct,
    semanticField: 'same-question-claim-space',
    support: Object.freeze([...support]),
    partialSupport: Object.freeze([...partial]),
    contradictions: Object.freeze([...contradictions]),
    scope,
    claimFit: fit,
    misconceptionId,
    feedback
  });
}

const SPECS = Object.freeze([
  {
    id: 'tr-g8-pilot02-01-idiom-contribution-community-oven',
    outcomeCode: 'T.8.3.6',
    construct: {
      primarySkill: 'idiom-contribution-analysis',
      secondarySkills: ['context-integration', 'figurative-meaning'],
      cognitiveProcess: 'analysis',
      knowledgeComponents: ['idiom', 'contextual-contribution', 'collective-responsibility'],
      intendedDifficultyBand: 'LGS_HIGH'
    },
    style: {
      genre: 'kisa-toplum-anekdotu',
      voice: 'ucuncu-tekil-nesnel',
      sourceMode: 'ozgun-mahalle-hikayesi',
      rhetoricalMoves: ['ornekleme', 'deyim', 'sonuc']
    },
    stimulus: `Mahallede yıllardır kapalı duran taş fırının yeniden açılması ilk günlerde birkaç kişinin işi sanıldı. Usta çatıyı onardı, lise öğrencileri eski tarifleri derledi, komşular kullanılabilir kapları ayırdı. Muhtar, “Bu işte herkes elini taşın altına koydu.” dedi. Fırın açıldığında ortaya yalnız yenilenmiş bir yapı değil, farklı kuşakların birlikte ürettiği ortak bir buluşma yeri çıktı.`,
    stem: 'Bu parçada “elini taşın altına koydu” sözünün kullanılması anlatıma hangi katkıyı sağlamıştır?',
    evidence: [
      { id: 'e1', sentence: 1, claim: 'İş başlangıçta birkaç kişiye ait görülmüştür.' },
      { id: 'e2', sentence: 2, claim: 'Farklı gruplar ayrı sorumluluklar üstlenmiştir.' },
      { id: 'e3', sentence: 3, claim: 'Deyim, herkesin ortak işe katılımını adlandırır.' },
      { id: 'e4', sentence: 4, claim: 'Ortak katkı kuşakları bir araya getiren bir sonuç doğurmuştur.' }
    ],
    requiredEvidenceIds: ['e2', 'e3', 'e4'],
    options: [
      opt('A', 'Çalışmanın güç gerektiren bölümünü mahalledeki kişilerin birlikte tamamladığını somut bir hareket üzerinden anlatmıştır.', {
        partial: ['e2', 'e3'], scope: 'narrowed', fit: 'partial', misconceptionId: 'idiom-read-as-physical-labor',
        feedback: 'Deyim gerçek bir taşı kaldırmayı ya da yalnız bedensel işi anlatmaz; farklı kişilerin sorumluluk almasını mecazlı biçimde ifade eder.'
      }),
      opt('B', 'Farklı kişilerin ortak iş için sorumluluk üstlenip katkı verdiğini kısa ve etkili bir söyleyişle vurgulamıştır.', {
        correct: true, support: ['e2', 'e3', 'e4'],
        feedback: 'Usta, öğrenciler ve komşular farklı görevler almıştır; deyim bu ortak sorumluluğu ve katkıyı yoğun bir anlatımla birleştirir.'
      }),
      opt('C', 'Fırının açılması için gerekli görevlerin muhtar tarafından mahalleliye eşit biçimde dağıtıldığını belirtmiştir.', {
        partial: ['e2', 'e3'], scope: 'expanded', fit: 'partial', misconceptionId: 'shared-effort-equals-equal-assignment',
        feedback: 'Metinde görevlerin eşit dağıtıldığı ya da muhtarın görev verdiği söylenmez; kişiler farklı biçimlerde kendileri katkı sunar.'
      }),
      opt('D', 'Mahallelinin kişisel beklentilerini geri plana bırakarak fırının yönetimini ortaklaşa üstlendiğini ifade etmiştir.', {
        partial: ['e2', 'e4'], scope: 'shifted', fit: 'partial', misconceptionId: 'contribution-equals-management',
        feedback: 'Ortak katkı ve kuşaklar arası birlik vardır; fakat kişisel beklentilerden vazgeçme ya da fırını birlikte yönetme bilgisi verilmez.'
      })
    ],
    steps: [
      { action: 'deyimin çevresindeki görevleri belirle', evidenceIds: ['e2'], explanation: 'Usta, öğrenciler ve komşular ayrı katkılar sunar.', hint: 'Deyimden önce kimler hangi işleri yapıyor?' },
      { action: 'sözün gerçek mi mecaz mı kullanıldığını ayır', evidenceIds: ['e3'], explanation: 'Burada taş kaldırmak değil, sorumluluk üstlenmek anlatılır.', hint: 'Parçada gerçek bir taşın altına el koyma eylemi var mı?' },
      { action: 'deyimin ortak sonucu nasıl yoğunlaştırdığını bul', evidenceIds: ['e2', 'e3', 'e4'], explanation: 'Deyim, farklı katkıları ortak sorumluluk fikrinde toplar.', hint: 'Doğru seçenek hem sorumluluk almayı hem ortak katkıyı birlikte taşımalı.' }
    ]
  },
  {
    id: 'tr-g8-pilot02-02-figurative-language-station',
    outcomeCode: 'T.8.3.7',
    construct: {
      primarySkill: 'figurative-language-effect',
      secondarySkills: ['personification-vs-speaking', 'mood-inference'],
      cognitiveProcess: 'analysis',
      knowledgeComponents: ['personification', 'simile', 'contrast', 'effect-on-atmosphere'],
      intendedDifficultyBand: 'LGS_HIGH'
    },
    style: {
      genre: 'siirsel-duzyazi',
      voice: 'gozlemci-anlatici',
      sourceMode: 'ozgun-istasyon-betimlemesi',
      rhetoricalMoves: ['kisilestirme', 'benzetme', 'sessizlik']
    },
    stimulus: `Akşam, istasyonun camlarına ağır ağır yaslandı. Raylar, uzaklara giden iki ince cümleydi. Kalabalık çekildi; saat, boş salonda yürümeyi sürdürdü. Bir tek bavul, sahibinden kalan sessizliği bekledi.`,
    stem: 'Bu parçada kullanılan söz sanatlarının anlatıma katkısıyla ilgili aşağıdakilerden hangisi doğrudur?',
    evidence: [
      { id: 'e1', sentence: 1, claim: 'Akşama insana özgü yaslanma hareketi verilmiştir.' },
      { id: 'e2', sentence: 2, claim: 'Raylar cümlelere benzetilmiştir.' },
      { id: 'e3', sentence: 3, claim: 'Saatin yürümesiyle cansız varlık kişileştirilmiştir.' },
      { id: 'e4', sentence: 4, claim: 'Bavulun beklemesi ayrılık ve sessizlik duygusunu güçlendirir.' }
    ],
    requiredEvidenceIds: ['e1', 'e3', 'e4'],
    options: [
      opt('A', 'Rayların cümlelere benzetilmesi yolculuğun düzenini öne çıkarmış, istasyondaki bekleyiş duygusunu arka plana taşımıştır.', {
        partial: ['e2', 'e4'], contradictions: ['e4'], scope: 'shifted', fit: 'partial', misconceptionId: 'simile-effect-misread',
        feedback: 'Rayların cümlelere benzetilmesi uzaklığa ve anlatılmamış yolculuklara çağrışım katar; bekleyiş duygusunu geri plana itmez.'
      }),
      opt('B', 'Bavulun sessizliği beklemesiyle konuşturma yapılmış, ayrılık duygusu bavulun doğrudan sözleri üzerinden aktarılmıştır.', {
        partial: ['e4'], contradictions: ['e4'], scope: 'shifted', fit: 'partial', misconceptionId: 'personification-confused-with-speaking',
        feedback: 'Bavula bekleme özelliği verilerek kişileştirme yapılır; bavul konuşmadığı için konuşturma söz konusu değildir.'
      }),
      opt('C', 'Akşamın yaslanması ve saatin yürümesiyle cansız varlıklar insana özgü davranışlar kazanmış, boşluk ve bekleyiş hissi güçlenmiştir.', {
        correct: true, support: ['e1', 'e3', 'e4'],
        feedback: 'Akşam ve saat insana özgü hareketlerle kişileştirilir; bavulun beklemesi de istasyondaki yalnızlık ve bekleyiş havasını yoğunlaştırır.'
      }),
      opt('D', 'Kalabalıkla boş salon arasındaki karşıtlık abartılı bir büyüklük duygusu oluşturmuş, istasyonun fiziksel yapısını öne çıkarmıştır.', {
        partial: ['e3', 'e4'], scope: 'shifted', fit: 'partial', misconceptionId: 'contrast-read-as-exaggeration',
        feedback: 'Kalabalığın çekilmesiyle boşluk hissi oluşur; metin istasyonun büyüklüğünü abartmaz, ayrılık ve yalnızlık atmosferini kurar.'
      })
    ],
    steps: [
      { action: 'insana özgü hareket verilen varlıkları bul', evidenceIds: ['e1', 'e3', 'e4'], explanation: 'Akşam yaslanır, saat yürür, bavul bekler.', hint: 'Cansız varlıklara hangi insan davranışları verilmiş?' },
      { action: 'kişileştirme ile konuşturmayı ayır', evidenceIds: ['e3', 'e4'], explanation: 'Varlıklar hareket eder fakat konuşmaz.', hint: 'Metinde cansız bir varlığın doğrudan söylediği bir söz bulunuyor mu?' },
      { action: 'söz sanatlarının ortak duygusal etkisini belirle', evidenceIds: ['e1', 'e3', 'e4'], explanation: 'Kişileştirmeler bekleyiş ve yalnızlık duygusunu yoğunlaştırır.', hint: 'Bu hareketler istasyonu canlı mı, neşeli mi, yoksa bekleyen ve yalnız bir yer gibi mi gösteriyor?' }
    ]
  },
  {
    id: 'tr-g8-pilot02-03-narration-description-workshop',
    outcomeCode: 'T.8.3.11',
    construct: {
      primarySkill: 'narrative-mode-analysis',
      secondarySkills: ['dominant-vs-supporting-mode', 'sensory-detail'],
      cognitiveProcess: 'analysis',
      knowledgeComponents: ['narration', 'description', 'exposition', 'dominance'],
      intendedDifficultyBand: 'LGS_HIGH'
    },
    style: {
      genre: 'kisa-ani-parcasi',
      voice: 'birinci-tekil',
      sourceMode: 'ozgun-marangoz-atolyesi',
      rhetoricalMoves: ['olay-akisi', 'duyusal-betimleme', 'sonuc']
    },
    stimulus: `Kapıyı açar açmaz atölyedeki talaş kokusu yüzüme vurdu. Usta, yarım kalmış sandalyeyi tezgâha çekip gevşek ayağı avucuyla yokladı. Önce eski tutkalı ısıttı, sonra ince bir kama yerleştirdi; ben de her hareketini not ettim. Pencereden süzülen ışık havadaki tozu görünür kılıyor, duvardaki aletlerin gölgeleri uzuyordu. Akşam olduğunda sandalye yeniden dengede duruyordu.`,
    stem: 'Bu parçanın anlatımında kullanılan biçimlerle ilgili aşağıdakilerden hangisi doğrudur?',
    evidence: [
      { id: 'e1', sentence: 1, claim: 'Koku ve mekân ayrıntısı betimleme oluşturur.' },
      { id: 'e2', sentence: 2, claim: 'Ustanın eylemi olay akışını başlatır.' },
      { id: 'e3', sentence: 3, claim: 'İşlemler zaman sırasıyla ilerler.' },
      { id: 'e4', sentence: 4, claim: 'Işık, toz ve gölge görsel betimleme sağlar.' },
      { id: 'e5', sentence: 5, claim: 'Olay bir sonuçla tamamlanır.' }
    ],
    requiredEvidenceIds: ['e2', 'e3', 'e5'],
    options: [
      opt('A', 'Olaylar zaman içinde ilerlediği için öyküleme temel, atölyenin duyusal ayrıntıları verildiği için betimleme destekleyici biçimdir.', {
        correct: true, support: ['e1', 'e2', 'e3', 'e4', 'e5'],
        feedback: 'Ustanın sandalyeyi onarması başlangıçtan sonuca ilerleyen bir olay oluşturur; koku, ışık, toz ve gölge ayrıntıları bu akışı betimler.'
      }),
      opt('B', 'Onarımın aşamaları bilgi vermek amacıyla sıralandığı için açıklama temel, sandalyenin sonucu gösterildiği için öyküleme destekleyici biçimdir.', {
        partial: ['e3', 'e5'], scope: 'shifted', fit: 'partial', misconceptionId: 'sequence-equals-exposition',
        feedback: 'İşlem sırası görülse de amaç sandalye onarımını öğretmek değildir; anlatıcı yaşadığı olayı zaman akışı içinde aktarır.'
      }),
      opt('C', 'Atölyenin görünümü ayrıntılı biçimde canlandırıldığı için betimleme temel, ustanın birkaç hareketi verildiği için açıklama destekleyici biçimdir.', {
        partial: ['e1', 'e2', 'e4'], scope: 'narrowed', fit: 'partial', misconceptionId: 'sensory-detail-hides-event',
        feedback: 'Betimleyici ayrıntılar güçlüdür; yine de parça sandalyenin onarılmasını başlangıçtan sonuca izlediği için temel biçim öykülemedir.'
      }),
      opt('D', 'Anlatıcı ustanın yöntemini değerlendirdiği için tartışma temel, atölyedeki nesneleri tanıttığı için betimleme destekleyici biçimdir.', {
        partial: ['e2', 'e4'], scope: 'expanded', fit: 'unsupported', misconceptionId: 'observation-confused-with-argument',
        feedback: 'Anlatıcı bir görüş savunmaz ve karşı düşünceyi çürütmez; bu nedenle tartışmacı anlatım kullanılmamıştır.'
      })
    ],
    steps: [
      { action: 'parçada zaman içinde değişen olayı belirle', evidenceIds: ['e2', 'e3', 'e5'], explanation: 'Sandalye tezgâha alınır, onarılır ve dengeli hâle gelir.', hint: 'Parçada başlangıcı ve sonucu olan hangi olay ilerliyor?' },
      { action: 'duyulara seslenen ayrıntıları ayır', evidenceIds: ['e1', 'e4'], explanation: 'Talaş kokusu, ışık, toz ve gölge mekânı canlandırır.', hint: 'Hangi cümleler atölyeyi kokusu ve görüntüsüyle zihinde canlandırıyor?' },
      { action: 'temel ve destekleyici anlatım biçimini seç', evidenceIds: ['e1', 'e2', 'e3', 'e4', 'e5'], explanation: 'Olay akışı öykülemeyi, duyusal ayrıntılar betimlemeyi oluşturur.', hint: 'Doğru seçenek olayın ilerleyişini temel, mekân ayrıntılarını destekleyici biçim olarak göstermeli.' }
    ]
  },
  {
    id: 'tr-g8-pilot02-04-author-view-story-ending',
    outcomeCode: 'T.8.3.21',
    construct: {
      primarySkill: 'author-view-interpretation',
      secondarySkills: ['qualification', 'whole-text-reference'],
      cognitiveProcess: 'interpretation',
      knowledgeComponents: ['author-position', 'supporting-example', 'evaluative-criterion'],
      intendedDifficultyBand: 'LGS_HIGH'
    },
    style: {
      genre: 'edebi-elestiri',
      voice: 'birinci-tekil-elestirmen',
      sourceMode: 'ozgun-yazar-gorusu',
      rhetoricalMoves: ['karsitlik', 'ornekleme', 'olcut-belirleme']
    },
    stimulus: `Bir öykünün sonunda okuru şaşırtmak kolaydır; asıl güç olan, şaşkınlık geçtikten sonra metnin yeniden düşünülmesini sağlamaktır. Bazı yazarlar son sayfaya sakladıkları bilgiyi bir kilit gibi kullanır, önceki sayfalarda bu kilide açılan izleri bırakmaz. Böyle bir sürpriz okuru bir an etkiler, metnin bütünüyle bağ kurmaz. Ben, iyi sonun beklenmedik olduğu kadar geriye dönüp bakıldığında kaçınılmaz görünmesi gerektiğini düşünüyorum.`,
    stem: 'Yazarın öykü sonlarına ilişkin bakış açısını en doğru yansıtan seçenek aşağıdakilerden hangisidir?',
    evidence: [
      { id: 'e1', sentence: 1, claim: 'Şaşırtmak tek başına yeterli bir başarı ölçütü değildir.' },
      { id: 'e2', sentence: 2, claim: 'Önceki sayfalarda sona hazırlayan izler bulunmalıdır.' },
      { id: 'e3', sentence: 3, claim: 'Metnin bütünüyle ilişkisiz sürpriz kısa süreli etki yaratır.' },
      { id: 'e4', sentence: 4, claim: 'İyi son hem beklenmedik hem geriye dönük olarak tutarlı görünmelidir.' }
    ],
    requiredEvidenceIds: ['e1', 'e2', 'e4'],
    options: [
      opt('A', 'Sürpriz son, önceki sayfalarda belirgin ipuçları verilmeden kurulursa okurun dikkatini daha uzun süre canlı tutar.', {
        partial: ['e1', 'e2'], contradictions: ['e2', 'e3'], scope: 'reversed', fit: 'opposite', misconceptionId: 'surprise-needs-no-foreshadowing',
        feedback: 'Yazar ipucu bırakılmayan sürprizin metnin bütünüyle bağ kurmadığını söyler; bu yaklaşımı başarılı bulmaz.'
      }),
      opt('B', 'Öykünün kalıcılığı, finalde verilen bilginin beklenmedik olmasına ve önceki olayların anlamını değiştirmesine bağlıdır.', {
        partial: ['e1', 'e4'], scope: 'expanded', fit: 'partial', misconceptionId: 'unexpectedness-as-sole-criterion',
        feedback: 'Beklenmedik olma önemlidir; fakat yazar finalin önceki olaylarla tutarlı bağ kurmasını da zorunlu bir ölçüt sayar.'
      }),
      opt('C', 'Öykü sonu, okurun önceden tahmin edebileceği biçimde hazırlanmalı ve şaşırtıcı yönünü ikinci planda tutmalıdır.', {
        partial: ['e2', 'e4'], contradictions: ['e4'], scope: 'narrowed', fit: 'partial', misconceptionId: 'coherence-means-predictability',
        feedback: 'Yazar sonun beklenmedik olmasını reddetmez; beklenmedik sonun geriye dönük olarak tutarlı görünmesini ister.'
      }),
      opt('D', 'Etkili bir son, okuru şaşırtırken önceki ayrıntılarla ilişki kurmalı ve sonradan metnin doğal sonucu gibi görünmelidir.', {
        correct: true, support: ['e1', 'e2', 'e3', 'e4'],
        feedback: 'Yazarın ölçütü iki yönlüdür: son beklenmedik bir etki yaratmalı, önceki sayfalardaki izlerle yeniden bakıldığında tutarlı görünmelidir.'
      })
    ],
    steps: [
      { action: 'yazarın yetersiz bulduğu son türünü belirle', evidenceIds: ['e1', 'e3'], explanation: 'Yalnız şaşırtan ve bütüne bağlanmayan son yetersizdir.', hint: 'Yazar hangi tür sürprizin etkisini kısa süreli buluyor?' },
      { action: 'önceki sayfaların sonla ilişkisini belirle', evidenceIds: ['e2'], explanation: 'Sona hazırlayan izler metnin içine yerleştirilmelidir.', hint: 'Kilidi açacak izlerin nerede bulunması gerektiği söyleniyor?' },
      { action: 'iki ölçütü birlikte taşıyan seçeneği bul', evidenceIds: ['e1', 'e2', 'e4'], explanation: 'İyi son hem şaşırtıcı hem geriye dönük tutarlıdır.', hint: 'Doğru seçenek “beklenmedik olma” ile “doğal sonuç gibi görünme”yi birlikte taşımalı.' }
    ]
  },
  {
    id: 'tr-g8-pilot02-05-text-types-essay-article',
    outcomeCode: 'T.8.3.26',
    construct: {
      primarySkill: 'text-type-distinction',
      secondarySkills: ['evidence-from-style', 'purpose-analysis'],
      cognitiveProcess: 'classification-and-analysis',
      knowledgeComponents: ['essay', 'article', 'subjectivity', 'evidence-use'],
      intendedDifficultyBand: 'LGS_HIGH'
    },
    style: {
      genre: 'iki-metin-karsilastirmasi',
      voice: 'karsilastirmali',
      sourceMode: 'ozgun-deneme-ve-makale-parcalari',
      rhetoricalMoves: ['kisisel-dusunme', 'arastirma-verisi', 'tur-karsilastirma']
    },
    stimulusBlocks: [
      `I. Metin: Her sabah aynı parkta yürürüm. Ağaçların arasından geçen yol değişmez ama ben her gün başka bir ayrıntıya takılırım. Bazen bir bankın boşluğu, bazen erken açan bir çiçek bana şehrin düşündüğümden daha yavaş konuştuğunu hissettirir. Belki de yürüyüş dediğimiz şey, bir yere varmaktan çok kendi dikkatimizi yeniden toplamaktır.`,
      `II. Metin: Kent parklarının ruh sağlığı üzerindeki etkisini inceleyen araştırmada 420 katılımcının haftalık park kullanım süresi ile stres ölçeği sonuçları karşılaştırılmıştır. Parkta daha uzun süre geçiren grupta ortalama stres puanı daha düşük bulunmuş, araştırmacılar yaş ve çalışma düzeni gibi değişkenlerin de sonucu etkileyebileceğini belirtmiştir.`
    ],
    stem: 'Bu iki metnin tür özellikleriyle ilgili aşağıdakilerden hangisi doğrudur?',
    evidence: [
      { id: 'e1', sentence: 1, claim: 'I. metin kişisel deneyim ve çağrışımlarla ilerler.' },
      { id: 'e2', sentence: 1, claim: 'I. metin kesin sonuca bağlanmayan öznel bir düşünme taşır.' },
      { id: 'e3', sentence: 2, claim: 'II. metin araştırma örneklemi ve ölçüm sonucuna dayanır.' },
      { id: 'e4', sentence: 2, claim: 'II. metin sonucu etkileyebilecek değişkenleri belirtir.' }
    ],
    requiredEvidenceIds: ['e1', 'e2', 'e3', 'e4'],
    options: [
      opt('A', 'I. metin güncel kent yaşamını ele aldığı için köşe yazısına, II. metin ölçüm sonuçları sunduğu için makaleye yaklaşır.', {
        partial: ['e1', 'e3'], scope: 'shifted', fit: 'partial', misconceptionId: 'current-topic-equals-column',
        feedback: 'I. metin güncel bir sorunu yorumlamaz; kişisel deneyimden serbest düşünceye geçtiği için deneme özelliği gösterir.'
      }),
      opt('B', 'I. metin kişisel gözlem ve serbest düşünceyle denemeye, II. metin araştırma verisi ve kanıtla makaleye yaklaşır.', {
        correct: true, support: ['e1', 'e2', 'e3', 'e4'],
        feedback: 'Birinci metin öznel çağrışımlarla düşünür; ikinci metin örneklem, ölçüm ve sınırlılık bildiren araştırma dili kullanır.'
      }),
      opt('C', 'I. metin öznel anlatımı nedeniyle denemeye, II. metin toplumsal yararı güncel bir görüşle ele aldığı için köşe yazısına yaklaşır.', {
        partial: ['e1', 'e2', 'e3'], scope: 'shifted', fit: 'partial', misconceptionId: 'research-summary-confused-with-column',
        feedback: 'I. metnin deneme özelliği doğru belirlenir; II. metin kişisel güncel yorum değil araştırma yöntemi ve verisi sunduğu için makaledir.'
      }),
      opt('D', 'I. metin kişi ve mekân çevresinde bir kesit sunduğu için romana, II. metin nesnel açıklamalar yaptığı için makaleye yaklaşır.', {
        partial: ['e1', 'e3', 'e4'], scope: 'shifted', fit: 'partial', misconceptionId: 'first-person-scene-equals-novel',
        feedback: 'I. metinde olay örgüsü ve kurmaca karakter gelişimi yoktur; kişisel düşünce ve çağrışım ağırlığı deneme türünü gösterir.'
      })
    ],
    steps: [
      { action: 'birinci metnin düşünceyi kurma biçimini belirle', evidenceIds: ['e1', 'e2'], explanation: 'Kişisel deneyimden serbest ve öznel bir düşünce geliştirilir.', hint: 'Birinci metin kanıt mı sunuyor, yoksa kişisel çağrışımlarla mı ilerliyor?' },
      { action: 'ikinci metnin bilgi sunma biçimini belirle', evidenceIds: ['e3', 'e4'], explanation: 'Örneklem, ölçüm sonucu ve sınırlılık bilgisi kullanılır.', hint: 'İkinci metinde hangi araştırma öğeleri bulunuyor?' },
      { action: 'iki metni uygun türlerle eşleştir', evidenceIds: ['e1', 'e2', 'e3', 'e4'], explanation: 'Kişisel serbest düşünce denemeyi, araştırma kanıtı makaleyi gösterir.', hint: 'Doğru seçenek birinci metni deneme, ikinci metni makale yapan özellikleri birlikte açıklamalı.' }
    ]
  }
]);

function makeCanonical(spec) {
  const outcome = grade8TurkishOutcomeByCode(spec.outcomeCode);
  if (!outcome) throw new Error(`${spec.id}: unknown outcome ${spec.outcomeCode}`);
  const answer = spec.options.find(entry => entry.correct);
  if (!answer) throw new Error(`${spec.id}: correct option missing`);
  const orderedOptions = [...spec.options].sort((left, right) => left.id.localeCompare(right.id));
  return defineCanonicalQuestion({
    id: spec.id,
    curriculum: {
      country: 'TR', schoolYear: '2026-2027', programFamily: 'PRE_TYMM', grade: 8,
      courseId: 'turkce', unitId: outcome.unitId, topicId: outcome.topicId,
      outcomeIds: [outcome.id], sourceIds: [outcome.sourceId]
    },
    construct: spec.construct,
    content: {
      stimulus: spec.stimulus || null,
      stimulusBlocks: spec.stimulusBlocks || null,
      stem: spec.stem,
      options: orderedOptions.map(({ id, text }) => ({ id, text })),
      evidenceMap: spec.evidence,
      optionSemantics: orderedOptions.map(({ feedback, ...entry }) => entry),
      synthesisRequirement: { requiredEvidenceIds: spec.requiredEvidenceIds, singleSentenceSufficient: false },
      humanReview: { status: 'NOT_MEASURED', calibrationBatch: 'GRADE8_TURKISH_PILOT_02_CALIBRATION_5', gameAdaptationAllowed: false }
    },
    itemFormat: 'single-choice',
    responseModel: { optionIds: orderedOptions.map(entry => entry.id), optionCount: 4 },
    answerKey: { optionId: answer.id, supportingEvidenceIds: answer.support },
    solutionGraph: spec.steps.map((step, index) => ({
      id: `s${index + 1}`,
      action: step.action,
      dependsOn: index === 0 ? [] : [`s${index}`],
      evidenceIds: step.evidenceIds,
      evidence: step.explanation
    })),
    hints: spec.steps.map((step, index) => ({ level: index + 1, text: step.hint, revealsAnswer: false })),
    optionFeedback: orderedOptions.map(entry => ({
      optionId: entry.id,
      correct: entry.correct,
      misconceptionId: entry.misconceptionId,
      text: entry.feedback,
      supportingEvidenceIds: entry.correct ? entry.support : entry.partialSupport,
      contradictionEvidenceIds: entry.contradictions
    })),
    misconceptionIds: orderedOptions.filter(entry => !entry.correct).map(entry => entry.misconceptionId),
    verifier: {
      solverId: 'tr-g8-pilot02-semantic-score-v1',
      independentVerifierId: 'tr-g8-pilot02-constraint-intersection-v1',
      verified: true
    },
    styleProfile: spec.style,
    provenance: { generatedFromSourceIds: [outcome.sourceId], styleReferenceIds: STYLE_REFERENCE_IDS },
    contentStatus: 'HUMAN_REVIEW_REQUIRED'
  });
}

function semanticScore(entry, requiredEvidenceIds) {
  const required = new Set(requiredEvidenceIds);
  const covered = entry.support.filter(id => required.has(id)).length;
  const penalties = entry.contradictions.length * 5 + (entry.scope === 'preserved' ? 0 : 3) + (entry.claimFit === 'full' ? 0 : 3);
  return covered * 3 - penalties;
}

function solve(item) {
  const required = item.content.synthesisRequirement.requiredEvidenceIds;
  const ranked = item.content.optionSemantics
    .map(entry => ({ id: entry.id, score: semanticScore(entry, required) }))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  if (ranked.length < 2 || ranked[0].score === ranked[1].score) throw new Error(`${item.id}: solver ambiguity`);
  return Object.freeze({ optionId: ranked[0].id, score: ranked[0].score });
}

function verify(item, solved) {
  const required = new Set(item.content.synthesisRequirement.requiredEvidenceIds);
  const accepted = item.content.optionSemantics.filter(entry =>
    entry.claimFit === 'full' && entry.scope === 'preserved' && entry.contradictions.length === 0
    && [...required].every(id => entry.support.includes(id))
  );
  return accepted.length === 1 && accepted[0].id === solved.optionId && solved.optionId === item.answerKey.optionId;
}

const ITEMS = Object.freeze(SPECS.map(makeCanonical));

export function buildGrade8TurkishPilot02CalibrationQuestions() {
  return ITEMS;
}

export function grade8TurkishPilot02CalibrationQuestionById(id) {
  return ITEMS.find(item => item.id === id) || null;
}

export function auditGrade8TurkishPilot02CalibrationCatalog(items = ITEMS) {
  const itemAudits = items.map(item => ({ id: item.id, ...auditGrade8TurkishCalibrationQuestion(item) }));
  const errors = itemAudits.flatMap(row => row.errors.map(error => `${row.id}:${error}`));
  const outcomeCount = new Set(items.flatMap(item => item.curriculum.outcomeIds)).size;
  const genreCount = new Set(items.map(item => item.styleProfile.genre)).size;
  const sourceModeCount = new Set(items.map(item => item.styleProfile.sourceMode)).size;
  const answerPositions = items.map(item => item.answerKey.optionId);
  if (items.length !== 5) errors.push(`catalog:item-count:${items.length}`);
  if (outcomeCount !== 5) errors.push(`catalog:outcome-count:${outcomeCount}`);
  if (genreCount !== 5) errors.push(`catalog:genre-count:${genreCount}`);
  if (sourceModeCount !== 5) errors.push(`catalog:source-mode-count:${sourceModeCount}`);
  if (new Set(answerPositions).size < 4) errors.push(`catalog:answer-position-diversity:${new Set(answerPositions).size}`);
  if (items.some(item => item.provenance.styleReferenceIds.includes('fabricated-author-quotation'))) errors.push('fabricated-attribution');
  return Object.freeze({
    ok: errors.length === 0,
    errors: Object.freeze(errors),
    metrics: Object.freeze({
      itemCount: items.length,
      outcomeCount,
      genreCount,
      sourceModeCount,
      answerPositionCount: new Set(answerPositions).size,
      humanReviewStatus: 'NOT_MEASURED',
      gameAdaptationAllowed: false,
      productReady: false
    }),
    itemAudits: Object.freeze(itemAudits)
  });
}

export const grade8TurkishPilot02CalibrationEngine = defineSubjectEngine({
  id: 'tr-g8-turkish-pilot02-calibration-engine-v1',
  domain: 'reading-turkish-literary-language',
  supportedCourseIds: ['turkce'],
  supportedItemFormats: ['single-choice'],
  misconceptionCatalogId: 'tr-g8-pilot02-misconceptions-v1',
  styleCatalogId: 'tr-g8-pilot02-styles-v1',
  plan: request => {
    const item = grade8TurkishPilot02CalibrationQuestionById(request.questionId);
    if (!item) throw new Error(`unknown pilot02 question ${request.questionId}`);
    return Object.freeze({ questionId: item.id, curriculumRoute: request.curriculumRoute });
  },
  generate: plan => structuredClone(grade8TurkishPilot02CalibrationQuestionById(plan.questionId)),
  solve,
  verifyIndependent: verify,
  explain: item => item.solutionGraph,
  qualityAudit: auditGrade8TurkishCalibrationQuestion
});

export const GRADE8_TURKISH_PILOT02_CALIBRATION_IDS = Object.freeze(ITEMS.map(item => item.id));
