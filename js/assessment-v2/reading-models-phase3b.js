import { defineReadingEvidenceModel, option } from './reading-model-factory.js';

const READING_GAMES = Object.freeze(['paragraph-detective', 'meaning-hunt']);

export const authorPurposeModel = defineReadingEvidenceModel({
  id: 'reading-author-purpose-v2',
  construct: {
    id: 'construct-reading-author-purpose', gradeRange: [5, 12], subjectId: 'turkish',
    curriculumOutcomeIds: ['determine-author-purpose'],
    knowledgeComponents: ['communicative-purpose', 'evidence-purpose-alignment', 'call-to-action'],
    claim: 'Öğrenci metindeki bilgi seçimi ve çağrı ifadelerinden yazarın temel iletişim amacını belirler.'
  },
  deepFeatures: ['purpose-from-content-selection', 'inform-plus-encourage'],
  surfaceFeatures: ['district-name', 'seed-count', 'collection-day'],
  compatibleGameIds: READING_GAMES,
  solutionGraph: { steps: [
    { id: 's1', action: 'metnin verdiği bilgilerin ortak yönünü belirle', dependsOn: [], evidence: 'Metin yerel tohumların nasıl saklandığını ve neden çeşitlilik için önemli olduğunu açıklar.', hint: 'Yazar hangi bilgileri özellikle seçmiş: tarih, eğlence, eleştiri yoksa koruma süreci mi?' },
    { id: 's2', action: 'okurdan beklenen davranışı çıkar', dependsOn: ['s1'], evidence: 'Son cümlede okurlar, ellerindeki yerel tohumları kayıt gününe getirmeye çağrılır.', hint: 'Metnin sonunda okura yöneltilen somut çağrıyı bul.' },
    { id: 's3', action: 'bilgilendirme ve teşvik işlevini birlikte doğrula', dependsOn: ['s2'], evidence: 'Amaç yalnız bilgi vermek değil, yerel çeşitlerin korunmasına katılımı da artırmaktır.', hint: 'Doğru seçenek hem açıklama bölümünü hem de çağrı bölümünü kapsıyor mu?' }
  ]},
  misconceptions: [
    { id: 'information-only-purpose', optionRole: 'information-only', description: 'Metindeki katılım çağrısını yok sayıp amacı yalnız bilgi verme olarak sınırlar.', buggyRule: 'ignore-call-to-action', feedback: 'Metnin sonundaki kayıt gününe katılım çağrısı temel amacın bir parçasıdır.' },
    { id: 'entertainment-purpose', optionRole: 'entertain', description: 'Somut koruma bilgilerini eğlendirme amacıyla karıştırır.', buggyRule: 'treat-local-topic-as-storytelling', feedback: 'Metin olay örgüsü kurmuyor; süreç açıklıyor ve okuru bir davranışa yönlendiriyor.' },
    { id: 'criticism-purpose', optionRole: 'criticize', description: 'Soruna dikkat çekmeyi kişileri suçlama amacı sanır.', buggyRule: 'convert-problem-awareness-to-blame', feedback: 'Metinde çiftçilere veya kurumlara yönelik bir suçlama yoktur.' }
  ],
  createTask: ({ district = 'Bağpınar', varieties = 46, day = 'cumartesi' } = {}) => ({
    passage: `${district}'da kurulan yerel tohum arşivinde bölgede uzun süredir yetiştirilen ${varieties} çeşit kayıt altına alındı. Her örnek, yetiştiği yer ve özellikleriyle birlikte saklanıyor; böylece kuraklık ya da hastalık gibi koşullara dayanıklı çeşitlerin kaybolması önlenmeye çalışılıyor. Arşiv ekibi, elinde eski yerel tohum bulunanları ${day} günü düzenlenecek kayıt buluşmasına çağırıyor.`,
    prompt: 'Yazarın bu parçayı yazmaktaki temel amacı nedir?',
    query: { type: 'purpose' },
    evidenceMap: { purpose: 'inform-and-encourage-preservation' },
    options: [
      option('a', 'correct', 'Yerel tohum arşivinin önemini açıklamak ve okurları çeşitlerin korunmasına katkı vermeye yöneltmek', { purpose: 'inform-and-encourage-preservation' }),
      option('b', 'information-only', 'Yalnızca arşivde kaç çeşit tohum bulunduğunu bildirmek', { purpose: 'report-count-only' }),
      option('c', 'entertain', 'Yerel tohumlarla ilgili eğlenceli bir olay anlatmak', { purpose: 'entertain-with-anecdote' }),
      option('d', 'criticize', 'Bölgedeki çiftçileri eski tohumları korumadıkları için eleştirmek', { purpose: 'criticize-farmers' })
    ]
  })
});

export const authorAttitudeModel = defineReadingEvidenceModel({
  id: 'reading-author-attitude-v2',
  construct: {
    id: 'construct-reading-author-attitude', gradeRange: [6, 12], subjectId: 'turkish',
    curriculumOutcomeIds: ['determine-author-attitude'],
    knowledgeComponents: ['evaluative-language', 'mixed-attitude', 'certainty-tone'],
    claim: 'Öğrenci olumlu ve sınırlayıcı ifadeleri birlikte değerlendirerek yazarın tutumunu belirler.'
  },
  deepFeatures: ['mixed-evaluation', 'cautious-optimism', 'tone-evidence'],
  surfaceFeatures: ['building-type', 'project-stage', 'opening-date'],
  compatibleGameIds: READING_GAMES,
  solutionGraph: { steps: [
    { id: 's1', action: 'olumlu değerlendirme ifadelerini belirle', dependsOn: [], evidence: 'Yazar yapının yeniden kullanılmasını sevindirici ve değerli bir gelişme olarak görür.', hint: 'Metindeki olumlu yargı bildiren sözcükleri işaretle.' },
    { id: 's2', action: 'çekince ve koşul bildiren ifadeleri belirle', dependsOn: ['s1'], evidence: 'Yazar başarının, özgün ayrıntıların korunmasına ve yapının yalnız ticari kullanıma bırakılmamasına bağlı olduğunu söyler.', hint: '“Ancak”, “başarı sayılabilmesi için” gibi sınırlama bildiren bölümlere bak.' },
    { id: 's3', action: 'iki yönü birleştiren tutumu seç', dependsOn: ['s2'], evidence: 'Tutum ne koşulsuz övgü ne de bütünüyle karşı çıkıştır; olumlu fakat temkinlidir.', hint: 'Seçenek hem memnuniyeti hem de çekinceyi taşıyor mu?' }
  ]},
  misconceptions: [
    { id: 'unconditional-praise', optionRole: 'uncritical', description: 'Olumlu ifadeleri görüp yazarın çekincelerini yok sayar.', buggyRule: 'drop-conditions-from-attitude', feedback: 'Yazar projeyi destekliyor fakat başarıyı belirli koruma koşullarına bağlıyor.' },
    { id: 'pure-opposition', optionRole: 'opposed', description: 'Çekince bildiren cümleyi projeye bütünüyle karşı çıkma sanır.', buggyRule: 'treat-caution-as-rejection', feedback: 'Metin yeniden kullanımı sevindirici buluyor; yalnız uygulamanın niteliğine dikkat çekiyor.' },
    { id: 'neutral-reporting', optionRole: 'neutral', description: 'Değer yargısı taşıyan sözcükleri görmez ve metni tarafsız haber sayar.', buggyRule: 'erase-evaluative-language', feedback: '“Sevindirici” ve “başarı sayılabilmesi” ifadeleri açık değerlendirme içerir.' }
  ],
  createTask: ({ building = 'eski tren garı', use = 'kültür merkezi' } = {}) => ({
    passage: `${building}nın ${use} olarak yeniden kullanılacak olması sevindirici. Yıllardır kapalı kalan bir yapının kent yaşamına dönmesi, belleğin korunması açısından değerli. Ancak projenin gerçek bir başarı sayılabilmesi için özgün mimari ayrıntıların korunması ve yapının yalnız ticari işletmelere ayrılmaması gerekir.`,
    prompt: 'Yazarın projeye yönelik tutumu aşağıdakilerden hangisidir?',
    query: { type: 'attitude' },
    evidenceMap: { attitude: 'cautiously-supportive' },
    options: [
      option('a', 'correct', 'Projeyi olumlu bulmakla birlikte başarısını koruma koşullarına bağlayan temkinli bir tutum', { attitude: 'cautiously-supportive' }),
      option('b', 'uncritical', 'Projeyi hiçbir çekince taşımadan bütünüyle öven bir tutum', { attitude: 'unconditionally-positive' }),
      option('c', 'opposed', 'Yapının yeniden kullanılmasına bütünüyle karşı çıkan bir tutum', { attitude: 'fully-opposed' }),
      option('d', 'neutral', 'Projeyle ilgili hiçbir değerlendirme içermeyen tarafsız bir tutum', { attitude: 'neutral-reporting' })
    ]
  })
});

export const contrastRelationModel = defineReadingEvidenceModel({
  id: 'reading-contrast-relation-v2',
  construct: {
    id: 'construct-reading-contrast-relation', gradeRange: [6, 12], subjectId: 'turkish',
    curriculumOutcomeIds: ['analyze-contrast-in-text'],
    knowledgeComponents: ['contrast-marker', 'compared-dimensions', 'relation-direction'],
    claim: 'Öğrenci karşılaştırılan görüşleri ve aralarındaki karşıtlığın yönünü doğru belirler.'
  },
  deepFeatures: ['two-position-map', 'contrast-dimension', 'relation-direction'],
  surfaceFeatures: ['city-name', 'transport-mode', 'time-horizon'],
  compatibleGameIds: READING_GAMES,
  solutionGraph: { steps: [
    { id: 's1', action: 'karşılaştırılan iki yaklaşımı belirle', dependsOn: [], evidence: 'Metin yol genişletme ile toplu taşıma ve yaya bağlantılarını güçlendirme yaklaşımlarını karşılaştırır.', hint: '“Buna karşılık” bağlacının iki yanında hangi çözümler bulunuyor?' },
    { id: 's2', action: 'yaklaşımların sonuçlarını aynı ölçütte karşılaştır', dependsOn: ['s1'], evidence: 'İlk yaklaşım kısa süreli rahatlama fakat yeniden yoğunluk; ikinci yaklaşım araç bağımlılığını azaltan daha kalıcı çözüm olarak sunulur.', hint: 'İki yaklaşımın kısa ve uzun vadeli etkilerini ayrı yaz.' },
    { id: 's3', action: 'karşıtlığın yönünü bozmayan ifadeyi seç', dependsOn: ['s2'], evidence: 'Doğru seçenek, kısa süreli kapasite artışı ile talebi azaltmaya dönük kalıcı yaklaşımı ters çevirmeden verir.', hint: 'Seçenekte hangi yaklaşımın kısa, hangisinin uzun vadeli sayıldığı doğru mu?' }
  ]},
  misconceptions: [
    { id: 'reverse-contrast-direction', optionRole: 'reversed', description: 'İki yaklaşımın kısa ve uzun vadeli sonuçlarını tersine çevirir.', buggyRule: 'swap-left-and-right-effects', feedback: 'Metin kalıcı etkiyi yol genişletmeye değil, araç bağımlılığını azaltan yaklaşıma bağlar.' },
    { id: 'erase-contrast', optionRole: 'same-view', description: 'Karşıt iki yaklaşımı aynı çözümün parçaları gibi yorumlar.', buggyRule: 'collapse-opposed-positions', feedback: '“Buna karşılık” bağlacı iki farklı çözüm mantığını açıkça ayırır.' },
    { id: 'change-comparison-dimension', optionRole: 'wrong-dimension', description: 'Metinde karşılaştırılmayan maliyet boyutunu temel karşıtlık sanır.', buggyRule: 'replace-time-effect-with-cost', feedback: 'Parçada maliyet karşılaştırması yapılmıyor; trafik etkisinin süresi ve araç bağımlılığı tartışılıyor.' }
  ],
  createTask: ({ city = 'Kıyıkent' } = {}) => ({
    passage: `${city}'te trafik sıkışıklığına çözüm olarak bazı uzmanlar ana yolların genişletilmesini öneriyor. Bu yöntem ilk aylarda akışı rahatlatabilse de yeni araç kullanımını teşvik ederek yoğunluğu yeniden artırabiliyor. Buna karşılık toplu taşıma sıklığını ve güvenli yaya bağlantılarını artırmak, yol kapasitesini büyütmeden özel araç bağımlılığını azaltmayı hedefliyor.`,
    prompt: 'Parçada iki yaklaşım arasındaki temel karşıtlık nasıl kurulmuştur?',
    query: { type: 'contrast' },
    evidenceMap: { contrasts: [{ left: 'road-widening', right: 'transit-and-walking', relation: 'short-relief-versus-demand-reduction' }] },
    options: [
      option('a', 'correct', 'Yol genişletme kısa süreli rahatlama sağlayabilirken toplu taşıma ve yaya bağlantıları araç talebini azaltmaya yönelir.', { left: 'road-widening', right: 'transit-and-walking', relation: 'short-relief-versus-demand-reduction' }),
      option('b', 'reversed', 'Toplu taşıma yalnız kısa süreli rahatlama sağlarken yol genişletme araç bağımlılığını kalıcı olarak azaltır.', { left: 'transit-and-walking', right: 'road-widening', relation: 'short-relief-versus-demand-reduction' }),
      option('c', 'same-view', 'Her iki yaklaşım da yalnız mevcut yolların kapasitesini artırmayı amaçlar.', { left: 'road-widening', right: 'transit-and-walking', relation: 'same-capacity-expansion' }),
      option('d', 'wrong-dimension', 'Yol genişletme ucuz, toplu taşıma ise pahalı olduğu için iki yaklaşım birbirine karşıttır.', { left: 'road-widening', right: 'transit-and-walking', relation: 'cheap-versus-expensive' })
    ]
  })
});

export const paragraphFunctionModel = defineReadingEvidenceModel({
  id: 'reading-paragraph-function-v2',
  construct: {
    id: 'construct-reading-paragraph-function', gradeRange: [6, 12], subjectId: 'turkish',
    curriculumOutcomeIds: ['determine-paragraph-function'],
    knowledgeComponents: ['text-organization', 'problem-solution', 'paragraph-role'],
    claim: 'Öğrenci çok paragraflı metinde bir paragrafın bütün içindeki işlevini belirler.'
  },
  deepFeatures: ['paragraph-role-map', 'problem-to-solution-transition'],
  surfaceFeatures: ['museum-name', 'visitor-behavior', 'pilot-duration'],
  compatibleGameIds: READING_GAMES,
  solutionGraph: { steps: [
    { id: 's1', action: 'ilk paragrafın ortaya koyduğu sorunu belirle', dependsOn: [], evidence: 'İlk paragraf ziyaretçilerin eser etiketlerini okumadan geçmesi ve bilgiyi hatırlamaması sorununu tanımlar.', hint: 'Birinci paragraf hangi eksikliği veya sorunu görünür kılıyor?' },
    { id: 's2', action: 'ikinci paragrafın metne eklediği yeni işi belirle', dependsOn: ['s1'], evidence: 'İkinci paragraf kısa sorular içeren kartların denenmesini ve bu uygulamanın gözlenen sonucunu açıklar.', hint: 'İkinci paragraf yalnız örnek mi veriyor, yoksa soruna yönelik bir uygulama ve sonuç mu sunuyor?' },
    { id: 's3', action: 'paragrafın bütün içindeki işlevini adlandır', dependsOn: ['s2'], evidence: 'İkinci paragraf, ilk paragraftaki soruna yönelik çözüm denemesini ve bu denemenin etkisini sunar.', hint: 'İkinci paragraf çıkarıldığında metindeki hangi problem–çözüm bağlantısı kaybolur?' }
  ]},
  misconceptions: [
    { id: 'repeat-problem-as-function', optionRole: 'repeat-problem', description: 'İkinci paragrafın çözüm işlevini görmeyip sorunu tekrar ettiğini sanır.', buggyRule: 'assign-first-paragraph-role-to-second', feedback: 'Sorun ilk paragraftadır; ikinci paragraf uygulama ve sonuç getirir.' },
    { id: 'unrelated-example-function', optionRole: 'unrelated-example', description: 'Çözüm denemesini ana konudan bağımsız örnek olarak görür.', buggyRule: 'detach-solution-from-problem', feedback: 'Kart uygulaması doğrudan etiketlerin okunmaması sorununa karşı geliştirilmiştir.' },
    { id: 'historical-background-function', optionRole: 'background', description: 'Paragrafta bulunmayan tarihsel arka plan işlevini seçer.', buggyRule: 'infer-common-introduction-role', feedback: 'İkinci paragraf geçmiş bilgi vermiyor; güncel bir deneme ve sonucunu açıklıyor.' }
  ],
  createTask: ({ museum = 'Kent Belleği Müzesi', duration = 6 } = {}) => ({
    passages: [
      `${museum}'nde yapılan gözlemler, ziyaretçilerin birçok eserin etiketine yalnız birkaç saniye baktığını gösterdi. Çıkış görüşmelerinde ziyaretçilerin önemli bir bölümü eserlerin bağlamına ilişkin temel bilgileri hatırlayamadı.`,
      `Bunun üzerine bazı salonlarda, etiketlerin yanına cevabı metinde bulunan kısa sorular eklendi. ${duration} haftalık denemede bu kartları kullanan ziyaretçilerin etiketlerin önünde daha uzun kaldığı ve çıkış sorularına daha ayrıntılı cevap verdiği görüldü.`
    ],
    prompt: 'İkinci paragrafın metnin bütünündeki işlevi nedir?',
    query: { type: 'paragraph-function' },
    evidenceMap: {
      paragraphs: [
        { id: 'p1', function: 'present-problem' },
        { id: 'p2', function: 'present-solution-trial-and-result' }
      ]
    },
    options: [
      option('a', 'correct', 'İlk paragrafta belirtilen soruna yönelik bir çözüm denemesini ve sonucunu sunmak', { paragraphId: 'p2', function: 'present-solution-trial-and-result' }),
      option('b', 'repeat-problem', 'Ziyaretçilerin etiketleri okumama sorununu aynı biçimde yeniden açıklamak', { paragraphId: 'p2', function: 'present-problem' }),
      option('c', 'unrelated-example', 'Müze konusundan bağımsız bir eğitim uygulaması örneği vermek', { paragraphId: 'p2', function: 'unrelated-example' }),
      option('d', 'background', 'Müzenin kuruluş sürecine ilişkin tarihsel arka plan sunmak', { paragraphId: 'p2', function: 'historical-background' })
    ]
  })
});

export const PHASE3B_READING_MODELS = Object.freeze([
  authorPurposeModel,
  authorAttitudeModel,
  contrastRelationModel,
  paragraphFunctionModel
]);
