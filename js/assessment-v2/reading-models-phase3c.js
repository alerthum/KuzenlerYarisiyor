import { defineReadingEvidenceModel, option, proposition } from './reading-model-factory.js';

const READING_GAMES = Object.freeze(['paragraph-detective', 'meaning-hunt']);

export const necessaryAssumptionModel = defineReadingEvidenceModel({
  id: 'reading-necessary-assumption-v2',
  construct: {
    id: 'construct-reading-necessary-assumption', gradeRange: [7, 12], subjectId: 'turkish',
    curriculumOutcomeIds: ['identify-necessary-assumption'],
    knowledgeComponents: ['claim-premise-gap', 'necessary-assumption', 'alternative-explanation'],
    claim: 'Öğrenci bir sonuç ile kanıt arasındaki boşluğu kapatan zorunlu varsayımı belirler.'
  },
  deepFeatures: ['premise-gap', 'necessity-test', 'proxy-validity'],
  surfaceFeatures: ['district-name', 'station-count', 'sales-change'],
  compatibleGameIds: READING_GAMES,
  solutionGraph: { steps: [
    { id: 's1', action: 'kanıt ile sonuç arasındaki geçişi belirle', dependsOn: [], evidence: 'Kanıt, yakın büfelerdeki tek kullanımlık şişe satışının azalmasıdır; sonuç ise dolum istasyonlarının plastik kullanımını azalttığıdır.', hint: 'Metindeki ölçülen veri ile ulaşılan genel sonuç aynı şeyi mi ifade ediyor?' },
    { id: 's2', action: 'sonucun dayanmak zorunda olduğu bağlantıyı bul', dependsOn: ['s1'], evidence: 'Satış verisinin bölgedeki tek kullanımlık şişe tüketimini anlamlı biçimde yansıtması gerekir.', hint: 'Büfe satışı, hangi görünmeyen davranışın göstergesi olarak kullanılıyor?' },
    { id: 's3', action: 'varsayımı çıkarınca çıkarımın çöküp çökmediğini sınayarak doğrula', dependsOn: ['s2'], evidence: 'Satış verisi tüketimi yansıtmıyorsa satış düşüşünden plastik kullanımının azaldığı sonucu çıkarılamaz; bu nedenle varsayım zorunludur.', hint: 'Seçenekteki varsayım yanlış olsaydı sonuç yine kurulabilir miydi?' }
  ]},
  misconceptions: [
    { id: 'desirable-but-not-necessary', optionRole: 'desirable', description: 'Sonucu destekleyebilecek fakat çıkarım için zorunlu olmayan olumlu bir durumu seçer.', buggyRule: 'choose-helpful-background-fact', feedback: 'Bir varsayım yalnız yararlı değil zorunlu olmalıdır; yanlış olduğunda çıkarım çökmelidir.' },
    { id: 'repeat-explicit-evidence', optionRole: 'repeat-evidence', description: 'Metinde açıkça verilen veriyi gizli varsayım sanır.', buggyRule: 'treat-stated-premise-as-unstated-assumption', feedback: 'Satış düşüşü zaten metinde verilmiştir; soru kanıt ile sonuç arasındaki eksik bağlantıyı sorar.' },
    { id: 'irrelevant-operational-detail', optionRole: 'irrelevant', description: 'İstasyonların teknik ayrıntısını sonucun zorunlu koşulu sanır.', buggyRule: 'select-salient-operational-detail', feedback: 'İstasyonların rengi veya tasarımı, satış verisinin plastik tüketimini temsil edip etmediğini belirlemez.' }
  ],
  createTask: ({ district = 'Çınarlı', stations = 12, decline = 18 } = {}) => ({
    passage: `${district}'ya ${stations} ücretsiz su dolum istasyonu yerleştirildikten sonraki üç ayda, istasyonların yakınındaki büfelerde tek kullanımlık su şişesi satışı önceki yılın aynı dönemine göre yüzde ${decline} azaldı. Belediye bu veriye dayanarak istasyonların bölgede tek kullanımlık plastik tüketimini azalttığını açıkladı.`,
    prompt: 'Belediyenin çıkarımının geçerli olabilmesi için aşağıdakilerden hangisinin varsayılması gerekir?',
    query: { type: 'assumption' },
    evidenceMap: {
      claims: [{ id: 'c1', requires: ['a1'] }],
      assumptions: [
        { id: 'a1', necessary: true },
        { id: 'a2', necessary: false },
        { id: 'a3', necessary: false },
        { id: 'a4', necessary: false }
      ]
    },
    options: [
      option('a', 'correct', 'Yakındaki büfelerin şişe satışları, bölgede kullanılan tek kullanımlık su şişesi miktarını anlamlı ölçüde yansıtmaktadır.', { claimId: 'c1', assumptionId: 'a1' }),
      option('b', 'desirable', 'Bölge sakinlerinin çoğu çevreyi korumayı önemli bulmaktadır.', { claimId: 'c1', assumptionId: 'a2' }),
      option('c', 'repeat-evidence', `Büfelerdeki şişe satışı yüzde ${decline} azalmıştır.`, { claimId: 'c1', assumptionId: 'a3' }),
      option('d', 'irrelevant', 'Dolum istasyonlarının tamamı aynı renkte tasarlanmıştır.', { claimId: 'c1', assumptionId: 'a4' })
    ]
  })
});

export const causalBoundaryModel = defineReadingEvidenceModel({
  id: 'reading-causal-boundary-v2',
  construct: {
    id: 'construct-reading-causal-boundary', gradeRange: [7, 12], subjectId: 'turkish',
    curriculumOutcomeIds: ['distinguish-correlation-and-causation'],
    knowledgeComponents: ['association-vs-causation', 'confounding-variable', 'directionality'],
    claim: 'Öğrenci gözlemsel ilişkiden nedensellik üretmeden en güçlü desteklenen yargıyı seçer.'
  },
  deepFeatures: ['causal-boundary', 'observational-study', 'confound-awareness'],
  surfaceFeatures: ['student-count', 'sleep-threshold', 'subject-name'],
  compatibleGameIds: READING_GAMES,
  solutionGraph: { steps: [
    { id: 's1', action: 'araştırma düzeninin gözlemsel olduğunu belirle', dependsOn: [], evidence: 'Öğrenciler uyku sürelerine göre sonradan gruplandırılmış, uyku süresi araştırmacılar tarafından rastgele belirlenmemiştir.', hint: 'Araştırmacılar değişkeni atadı mı, yoksa yalnız mevcut davranışı mı gözledi?' },
    { id: 's2', action: 'gözlenen ilişkiyi açıkça ifade et', dependsOn: ['s1'], evidence: 'Daha uzun uyuyan grupta ortalama sınav puanı daha yüksektir.', hint: 'Metnin doğrudan gösterdiği iki değişken arasındaki ilişkiyi yaz.' },
    { id: 's3', action: 'nedensellik ve yön varsayımlarını dışarıda bırak', dependsOn: ['s2'], evidence: 'Çalışma alışkanlığı, sağlık veya aile düzeni gibi etkenler ölçülmediği için uyku tek neden olarak gösterilemez.', hint: 'İlişkiyi kabul eden fakat “kesin neden” demeyen seçeneği ara.' }
  ]},
  misconceptions: [
    { id: 'correlation-means-cause', optionRole: 'cause', description: 'Gözlenen ilişkiyi uykunun başarıyı kesin artırdığı nedensel hükme dönüştürür.', buggyRule: 'association-to-cause', feedback: 'Gözlemsel veri ilişki gösterir; diğer etkenler dışlanmadan kesin neden göstermez.' },
    { id: 'reverse-causality-certainty', optionRole: 'reverse-cause', description: 'Nedenselliği ters yönde ve kesin biçimde kurar.', buggyRule: 'reverse-causal-arrow', feedback: 'Yüksek puanın daha uzun uykuya neden olduğu da bu araştırmayla kanıtlanmış değildir.' },
    { id: 'deny-observed-relation', optionRole: 'deny', description: 'Nedensellik kanıtlanmadığı için ölçülen ilişkiyi de yok sayar.', buggyRule: 'no-causation-means-no-association', feedback: 'Nedensellik ayrı bir iddiadır; gruplar arasındaki ortalama puan farkı gözlenmiştir.' }
  ],
  createTask: ({ students = 240, threshold = 8, subject = 'matematik' } = {}) => {
    const association = proposition({ subject: 'longer-sleep', predicate: 'is-associated-with', object: `${subject}-score`, relation: 'association', modality: 'probable', quantifier: 'some', scope: ['observed-students'] });
    return {
      passage: `${students} lise öğrencisinin bir ay boyunca uyku süreleri ve ${subject} sınav puanları kaydedildi. Geceleri ortalama en az ${threshold} saat uyuyan öğrencilerin sınav puanı ortalaması, daha az uyuyanlarınkinden yüksekti. Öğrenciler gruplara rastgele atanmadı; çalışma süresi, sağlık durumu ve aile düzeni gibi etkenler ölçülmedi.`,
      prompt: 'Bu araştırmaya dayanarak aşağıdakilerden hangisi söylenebilir?',
      query: { type: 'causal-boundary' },
      evidenceMap: { claims: [{ id: 'c1', proposition: association }] },
      options: [
        option('a', 'correct', 'İncelenen öğrencilerde daha uzun uyku ile daha yüksek matematik puanı arasında bir ilişki vardır; ancak uyku tek neden olarak gösterilemez.', { claimId: 'c1', proposition: association }),
        option('b', 'cause', `Her gece en az ${threshold} saat uyumak matematik başarısını kesin olarak yükseltir.`, { claimId: 'c1', proposition: proposition({ ...association, predicate: 'causes', relation: 'cause', modality: 'certain', quantifier: 'all' }) }),
        option('c', 'reverse-cause', 'Yüksek matematik puanı öğrencilerin daha uzun uyumasına kesin olarak neden olur.', { claimId: 'c1', proposition: proposition({ ...association, subject: `${subject}-score`, object: 'longer-sleep', predicate: 'causes', relation: 'cause', modality: 'certain' }) }),
        option('d', 'deny', 'Uyku süresi ile matematik puanı arasında hiçbir ilişki yoktur.', { claimId: 'c1', proposition: proposition({ ...association, polarity: 'negative', modality: 'certain' }) })
      ]
    };
  }
});

export const crossTextRelationModel = defineReadingEvidenceModel({
  id: 'reading-cross-text-relation-v2',
  construct: {
    id: 'construct-reading-cross-text-relation', gradeRange: [7, 12], subjectId: 'turkish',
    curriculumOutcomeIds: ['compare-two-texts'],
    knowledgeComponents: ['cross-text-claim-map', 'partial-agreement', 'emphasis-difference'],
    claim: 'Öğrenci iki metnin ortaklaştığı ve ayrıştığı noktaları tek bir ilişki yargısında birleştirir.'
  },
  deepFeatures: ['two-text-claim-alignment', 'partial-agreement', 'different-rationale'],
  surfaceFeatures: ['workplace-type', 'day-count', 'team-name'],
  compatibleGameIds: READING_GAMES,
  solutionGraph: { steps: [
    { id: 's1', action: 'her metnin temel önerisini ayrı çıkar', dependsOn: [], evidence: 'Birinci metin odaklanma için uzaktan çalışma günlerini; ikinci metin etkileşim için yüz yüze günleri savunur.', hint: 'İki metnin önerisini ayrı ayrı birer cümleyle yaz.' },
    { id: 's2', action: 'ortak kabulü ve farklı gerekçeleri belirle', dependsOn: ['s1'], evidence: 'İki metin de tek biçimli çalışma yerine karma düzeni kabul eder; biri bireysel odaklanmayı, diğeri ekip etkileşimini öne çıkarır.', hint: 'Metinler tamamen zıt mı, yoksa aynı düzenin farklı yararlarını mı vurguluyor?' },
    { id: 's3', action: 'kısmi uzlaşmayı doğru yönüyle ifade et', dependsOn: ['s2'], evidence: 'Doğru ilişki, ortak karma düzen önerisini korurken gerekçe farkını da belirtir.', hint: 'Seçenek hem ortak noktayı hem de vurgu farkını içeriyor mu?' }
  ]},
  misconceptions: [
    { id: 'false-total-opposition', optionRole: 'opposition', description: 'Farklı vurguları bütünüyle zıt öneriler olarak yorumlar.', buggyRule: 'different-emphasis-means-total-disagreement', feedback: 'İki metin de karma düzeni kabul eder; ayrılık düzenin gerekçesi ve ağırlığındadır.' },
    { id: 'false-total-agreement', optionRole: 'same-reason', description: 'Ortak öneriden hareketle gerekçelerin de aynı olduğunu sanır.', buggyRule: 'same-recommendation-means-same-rationale', feedback: 'Birinci metin odaklanmayı, ikinci metin spontane ekip etkileşimini temel alır.' },
    { id: 'reverse-emphasis', optionRole: 'reversed', description: 'Metinlerin öne çıkardığı yararları birbirine aktarır.', buggyRule: 'swap-text-rationales', feedback: 'Odaklanma vurgusu birinci, yüz yüze etkileşim vurgusu ikinci metne aittir.' }
  ],
  createTask: ({ remoteDays = 2 } = {}) => ({
    passages: [
      `I. Metin: Derin dikkat gerektiren rapor ve analiz işleri, kesintilerin az olduğu ev ortamında daha verimli yürütülebiliyor. Bu nedenle çalışanlara haftada ${remoteDays} gün uzaktan çalışma olanağı tanıyan karma düzen, bireysel odaklanmayı güçlendirebilir.`,
      'II. Metin: Yeni fikirlerin çoğu planlanmamış kısa konuşmalarda ve aynı masada yapılan hızlı denemelerde gelişiyor. Bu yüzden uzaktan çalışma bütünüyle kaldırılmasa bile ekiplerin belirli günlerde aynı ortamda bulunması yaratıcı iş birliği için önemlidir.'
    ],
    prompt: 'Bu iki metnin görüşleri arasındaki ilişki aşağıdakilerden hangisidir?',
    query: { type: 'cross-text' },
    evidenceMap: { crossTextRelation: { claimA: 'hybrid-for-focus', claimB: 'hybrid-for-collaboration', relation: 'partial-agreement-different-emphasis' } },
    options: [
      option('a', 'correct', 'İki metin de karma çalışma düzenini kabul eder; birincisi bireysel odaklanmayı, ikincisi yüz yüze etkileşimi öne çıkarır.', { claimA: 'hybrid-for-focus', claimB: 'hybrid-for-collaboration', relation: 'partial-agreement-different-emphasis' }),
      option('b', 'opposition', 'Birinci metin uzaktan çalışmayı bütünüyle savunurken ikinci metin uzaktan çalışmaya bütünüyle karşı çıkar.', { claimA: 'remote-only', claimB: 'office-only', relation: 'total-opposition' }),
      option('c', 'same-reason', 'İki metin de karma düzeni yalnız çalışanların bireysel olarak daha iyi odaklanması için savunur.', { claimA: 'hybrid-for-focus', claimB: 'hybrid-for-focus', relation: 'full-agreement-same-rationale' }),
      option('d', 'reversed', 'Birinci metin yüz yüze etkileşimi, ikinci metin evde bireysel odaklanmayı temel gerekçe yapar.', { claimA: 'hybrid-for-collaboration', claimB: 'hybrid-for-focus', relation: 'partial-agreement-reversed-emphasis' })
    ]
  })
});

export const strongestEvidenceModel = defineReadingEvidenceModel({
  id: 'reading-strongest-evidence-v2',
  construct: {
    id: 'construct-reading-strongest-evidence', gradeRange: [6, 12], subjectId: 'turkish',
    curriculumOutcomeIds: ['evaluate-evidence-strength'],
    knowledgeComponents: ['evidence-directness', 'source-reliability', 'controlled-comparison'],
    claim: 'Öğrenci bir iddiayı destekleyen kanıtları doğrudanlık ve güvenilirlik bakımından karşılaştırır.'
  },
  deepFeatures: ['evidence-ranking', 'directness-times-reliability', 'controlled-comparison'],
  surfaceFeatures: ['school-name', 'observation-period', 'pollinator-type'],
  compatibleGameIds: READING_GAMES,
  solutionGraph: { steps: [
    { id: 's1', action: 'iddianın ölçülebilir sonucunu belirle', dependsOn: [], evidence: 'İddia, okul bahçesindeki yerli çiçek düzenlemesinin tozlayıcı ziyaretlerini artırdığıdır.', hint: 'İddiayı doğrulamak için hangi değişimin doğrudan sayılması gerekir?' },
    { id: 's2', action: 'kanıtların doğrudanlık ve kaynak güvenilirliğini karşılaştır', dependsOn: ['s1'], evidence: 'Önce-sonra sayımları ve değişiklik yapılmayan karşılaştırma alanı, iddiayı doğrudan ve denetlenebilir biçimde sınar.', hint: 'Hangi seçenek ölçüm, karşılaştırma ve tekrar içeriyor?' },
    { id: 's3', action: 'en yüksek kanıt değerine sahip seçeneği seç', dependsOn: ['s2'], evidence: 'Tek fotoğraf, öğrenci görüşü ve ürün broşürü iddiayla ilgili olabilir; ancak kontrollü sistematik sayım kadar güçlü değildir.', hint: 'Görüş ile ölçümü; tek gözlem ile tekrarlı karşılaştırmayı ayır.' }
  ]},
  misconceptions: [
    { id: 'anecdote-as-strongest-evidence', optionRole: 'anecdote', description: 'Bir öğrencinin gözlemini sistematik veri kadar güçlü sayar.', buggyRule: 'personal-observation-over-measurement', feedback: 'Tek kişinin gözlemi seçici olabilir; tekrarlı ve karşılaştırmalı sayım daha güçlüdür.' },
    { id: 'single-photo-as-proof', optionRole: 'photo', description: 'Tek bir anda çekilmiş görüntüyü artışın kanıtı sanır.', buggyRule: 'snapshot-proves-change', feedback: 'Tek fotoğraf değişimi göstermez; önceki durum ve karşılaştırma alanı gerekir.' },
    { id: 'interested-source-as-proof', optionRole: 'brochure', description: 'Ürünü satan firmanın tanıtım iddiasını bağımsız kanıt sayar.', buggyRule: 'marketing-claim-as-independent-evidence', feedback: 'Çıkarı bulunan kaynağın genel iddiası, yerel ve kontrollü ölçümden daha zayıftır.' }
  ],
  createTask: ({ school = 'Bilim Ortaokulu', weeks = 10 } = {}) => ({
    passage: `${school}, bahçenin bir bölümüne yerli çiçeklerden oluşan bir alan kurdu ve bu düzenlemenin arı ile kelebek ziyaretlerini artırdığını ileri sürdü.`,
    prompt: 'Aşağıdaki bilgilerden hangisi bu iddiayı en güçlü biçimde destekler?',
    query: { type: 'evidence-strength' },
    evidenceMap: {
      claims: [{ id: 'c1' }],
      evidence: [
        { id: 'e1', supports: ['c1'], directness: 1, reliability: 0.95 },
        { id: 'e2', supports: ['c1'], directness: 0.35, reliability: 0.5 },
        { id: 'e3', supports: ['c1'], directness: 0.25, reliability: 0.7 },
        { id: 'e4', supports: ['c1'], directness: 0.25, reliability: 0.3 }
      ]
    },
    options: [
      option('a', 'correct', `Çiçek alanı kurulmadan önce ve sonra ${weeks} hafta yapılan standart sayımlarda ziyaretler artmış, değişiklik yapılmayan benzer bahçe bölümünde aynı artış görülmemiştir.`, { claimId: 'c1', evidenceId: 'e1' }),
      option('b', 'anecdote', 'Bir öğrenci, geçen hafta bahçede her zamankinden daha çok kelebek gördüğünü söylemiştir.', { claimId: 'c1', evidenceId: 'e2' }),
      option('c', 'photo', 'Çiçeklerin açtığı gün bahçede üç arının göründüğü bir fotoğraf çekilmiştir.', { claimId: 'c1', evidenceId: 'e3' }),
      option('d', 'brochure', 'Tohumları satan firmanın broşüründe yerli çiçeklerin tozlayıcıları çektiği yazmaktadır.', { claimId: 'c1', evidenceId: 'e4' })
    ]
  })
});

export const PHASE3C_READING_MODELS = Object.freeze([
  necessaryAssumptionModel,
  causalBoundaryModel,
  crossTextRelationModel,
  strongestEvidenceModel
]);
