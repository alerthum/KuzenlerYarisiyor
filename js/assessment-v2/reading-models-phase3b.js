import { defineReadingEvidenceModel, option } from './reading-model-factory.js';

const READING_GAMES = Object.freeze(['paragraph-detective', 'meaning-hunt']);

export const authorPurposeModel = defineReadingEvidenceModel({
  id: 'reading-author-purpose-v2',
  construct: {
    id: 'construct-reading-author-purpose', gradeRange: [5, 12], subjectId: 'turkish',
    curriculumOutcomeIds: ['determine-author-purpose'],
    knowledgeComponents: ['communicative-purpose', 'evidence-purpose-alignment', 'call-to-action'],
    claim: 'Öğrenci metindeki bilgi seçimi ve yönlendirme ifadelerinden yazarın temel iletişim amacını belirler.'
  },
  deepFeatures: ['purpose-from-content-selection', 'critique-plus-principle'],
  surfaceFeatures: ['cultural-heritage', 'rhetorical-question', 'critical-essay'],
  compatibleGameIds: READING_GAMES,
  solutionGraph: { steps: [
    { id: 's1', action: 'yazarın eleştirdiği uygulamayı belirle', dependsOn: [], evidence: 'Yazar, tarihî çeşmelerin dış görünüşü onarılırken su verme işlevinin ortadan kaldırılmasını eleştirir.', hint: 'Parçada onarımın hangi yönü yetersiz bulunuyor?' },
    { id: 's2', action: 'eleştirinin dayandığı temel ölçütü çıkar', dependsOn: ['s1'], evidence: 'Bir yapının yalnız görüntüsünün değil, yaşam içindeki işlevinin de kültürel mirasın parçası olduğu savunulur.', hint: 'Yazar için bir yapıyı “yaşatan” şey yalnız taşları mı, yoksa kullanım biçimi mi?' },
    { id: 's3', action: 'amacı konu ve duygudan ayır', dependsOn: ['s2'], evidence: 'Amaç çeşmeler hakkında bilgi vermekten ya da nostalji oluşturmaktan çok, koruma anlayışını sorgulatmaktır.', hint: 'Doğru seçenek yazarın okurda oluşturmak istediği düşünsel değişimi veriyor mu?' }
  ]},
  misconceptions: [
    { id: 'information-only-purpose', optionRole: 'information-only', description: 'Eleştirel yönü yok sayıp amacı yalnız bilgi vermek sanır.', buggyRule: 'ignore-evaluative-language', feedback: 'Metin tarihî bilgi sıralamıyor; belirli bir koruma anlayışına karşı çıkıyor.' },
    { id: 'entertainment-purpose', optionRole: 'nostalgia', description: 'Geçmişe ait öğeleri görünce amacı duygusal nostalji oluşturmak sanır.', buggyRule: 'heritage-topic-means-nostalgia', feedback: 'Yazar geçmişi anmakla yetinmiyor, bugünkü onarım uygulamasını sorguluyor.' },
    { id: 'criticism-purpose', optionRole: 'blame-residents', description: 'Eleştirinin hedefini mahalle sakinlerine yöneltir.', buggyRule: 'misidentify-criticism-target', feedback: 'Metinde çeşmeleri kullanan insanlara yönelik bir suçlama yoktur.' },
    { id: 'commercial-purpose', optionRole: 'tourism', description: 'Kültürel miras konusunu turizm tanıtımıyla karıştırır.', buggyRule: 'heritage-means-tourism-promotion', feedback: 'Parça ziyaretçi çekme ya da ekonomik kazanç amacı taşımaz.' }
  ],
  createTask: ({ structure = 'mahalle çeşmesi' } = {}) => ({
    passage: `Eski bir ${structure}ni onarıyor, taşlarını temizliyor, kitabesini okunur hâle getiriyoruz; sonra da musluğunu söküp önüne küçük bir zincir çekiyoruz. Böylece yapıyı koruduğumuzu düşünüyoruz. Oysa o çeşmeyi mahalle belleğinin parçası yapan yalnızca yaşı ve süslemeleri değildi; insanların önünde durması, su içmesi, birbirine yol sormasıydı. Bir yapıyı hayattan çekip yalnız seyredilecek bir nesneye dönüştürmek, onu korumak mıdır, yoksa sessizce başka bir şeye çevirmek mi?`,
    prompt: 'Yazarın bu parçayı kaleme alma amacı aşağıdakilerden hangisidir?',
    query: { type: 'purpose' },
    surfaceProfile: { genre: 'eleştirel-deneme', voice: 'birinci-çoğul-sorgulayıcı', sourceMode: 'özgün-kültür-yazısı', rhetoricalMoves: ['örnekleme', 'karşıtlık', 'retorik-soru'], stemFamily: 'yazılış-amacı' },
    evidenceMap: { purpose: 'criticize-display-only-preservation' },
    options: [
      option('a', 'correct', 'Kültürel mirası korumanın yalnız dış görünüşü yenilemek değil, yapının yaşam içindeki işlevini de sürdürmek olduğunu düşündürmek', { purpose: 'criticize-display-only-preservation' }),
      option('b', 'information-only', 'Tarihî çeşmelerin mimari özellikleri ve onarım aşamaları hakkında bilgi vermek', { purpose: 'inform-restoration-steps' }),
      option('c', 'nostalgia', 'Çeşme başında kurulan eski mahalle ilişkilerine duyulan özlemi canlandırmak ve okuru geçmişin daha sıcak bir yaşam sunduğuna inandırmak', { purpose: 'evoke-nostalgia' }),
      option('d', 'blame-residents', 'Mahalle sakinlerini tarihî yapılara yeterince sahip çıkmadıkları için suçlamak', { purpose: 'blame-local-residents' }),
      option('e', 'tourism', 'Onarılan çeşmelerin kente daha fazla turist çekebileceğini göstermek', { purpose: 'promote-cultural-tourism' })
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
  deepFeatures: ['mixed-evaluation', 'qualified-appreciation', 'tone-evidence'],
  surfaceFeatures: ['book-review', 'literary-criticism', 'balanced-judgment'],
  compatibleGameIds: READING_GAMES,
  solutionGraph: { steps: [
    { id: 's1', action: 'olumlu değerlendirmeleri belirle', dependsOn: [], evidence: 'Yazar romanın dili, atmosferi ve ayrıntı seçimini güçlü bulur.', hint: 'Eserin hangi özellikleri açıkça beğeniliyor?' },
    { id: 's2', action: 'eleştirel sınırlamaları belirle', dependsOn: ['s1'], evidence: 'Yan kişilerin yalnız ana kahramanın düşüncesini doğrulayan araçlar gibi kalması önemli bir eksiklik sayılır.', hint: '“Ne var ki” sonrasında eserin hangi yönü yetersiz bulunuyor?' },
    { id: 's3', action: 'iki yönlü tutumu tek ifadede birleştir', dependsOn: ['s2'], evidence: 'Yazar ne eseri bütünüyle över ne de değersiz bulur; güçlü yanlarını teslim ederek belirgin bir kusuru eleştirir.', hint: 'Seçenek hem takdiri hem de eleştiriyi taşıyor mu?' }
  ]},
  misconceptions: [
    { id: 'unconditional-praise', optionRole: 'uncritical', description: 'Beğeni ifadelerini görüp eleştiriyi yok sayar.', buggyRule: 'drop-critical-clause', feedback: 'Yazar yan kişilerin işlenişini açık bir eksiklik olarak görüyor.' },
    { id: 'pure-opposition', optionRole: 'dismissive', description: 'Tek eleştiriden hareketle eserin bütünüyle başarısız bulunduğunu sanır.', buggyRule: 'one-flaw-means-total-rejection', feedback: 'Romanın dili ve atmosferi güçlü biçimde övülmektedir.' },
    { id: 'neutral-reporting', optionRole: 'neutral', description: 'Değer bildiren sözcükleri yok sayar.', buggyRule: 'erase-evaluative-vocabulary', feedback: '“Ustalık”, “canlı”, “eksiklik” gibi sözcükler açık değerlendirme taşır.' },
    { id: 'author-biography-focus', optionRole: 'personal', description: 'Eser değerlendirmesini yazarın kişiliğine yönelik tutum sanır.', buggyRule: 'confuse-work-with-author', feedback: 'Parça romancının kişiliğini değil, romanın anlatım ve kişi kurulumunu değerlendirir.' }
  ],
  createTask: ({ work = 'Kuyudaki Sesler' } = {}) => ({
    passage: `${work}, daha ilk sayfalarda kasabanın ağır sessizliğini okura duyurmayı başarıyor. Yazar, görünüşte önemsiz ayrıntıları öyle yerli yerinde kullanıyor ki kapı gıcırtıları, yarım bırakılmış cümleler ve boş meydan, romanın kişilerinden biri hâline geliyor. Ne var ki bu canlı atmosferin içinde yan kişiler fazla silik kalmış; çoğu, ana kahramanın düşüncelerini doğrulamak için kısa süreliğine sahneye çıkarılmış gibi. Romanın dili ustalıklı, dünyası etkileyici; fakat insanları, mekânları kadar derin değil.`,
    prompt: 'Bu parçada sözü edilen romana yönelik tutum aşağıdakilerden hangisidir?',
    query: { type: 'attitude' },
    surfaceProfile: { genre: 'kitap-eleştirisi', voice: 'üçüncü-tekil-değerlendirici', sourceMode: 'özgün-edebî-eleştiri', rhetoricalMoves: ['örneklendirme', 'övgü', 'sınırlama'], stemFamily: 'tutum' },
    evidenceMap: { attitude: 'appreciative-but-critical' },
    options: [
      option('a', 'correct', 'Anlatım ve atmosferdeki başarısını takdir eden ancak kişi kurulumunu yetersiz bulan dengeli bir tutum', { attitude: 'appreciative-but-critical' }),
      option('b', 'uncritical', 'Romanın dilini, atmosferini ve bütün kişilerini aynı ölçüde başarılı ve kusursuz bulan, hiçbir eleştiri taşımayan koşulsuz bir hayranlık', { attitude: 'unconditionally-positive' }),
      option('c', 'dismissive', 'Eseri dil ve kurgu bakımından bütünüyle başarısız sayan küçümseyici bir yaklaşım', { attitude: 'fully-dismissive' }),
      option('d', 'neutral', 'Romanla ilgili hiçbir değer yargısı içermeyen tarafsız bir aktarım', { attitude: 'neutral-reporting' }),
      option('e', 'personal', 'Yazarın kişiliğine ve yaşamına karşı kuşkulu bir yaklaşım', { attitude: 'suspicious-of-author-personality' })
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
  surfaceFeatures: ['translation-theory', 'paired-views', 'metaphorical-language'],
  compatibleGameIds: READING_GAMES,
  solutionGraph: { steps: [
    { id: 's1', action: 'çeviriye ilişkin iki yaklaşımı belirle', dependsOn: [], evidence: 'Bir yaklaşım sözcük ve söz dizimine bağlılığı, diğeri metnin sesini ve okurda bıraktığı etkiyi yeniden kurmayı öne çıkarır.', hint: '“Birine göre” ve “ötekine göre” bölümlerini ayrı birer yargı hâline getir.' },
    { id: 's2', action: 'karşıtlığın ortak konusunu bul', dependsOn: ['s1'], evidence: 'İki görüş de çeviride sadakati tartışır; ayrılık, sadakatin neye gösterileceğindedir.', hint: 'Görüşler farklı konulardan mı söz ediyor, yoksa aynı kavramı farklı mı tanımlıyor?' },
    { id: 's3', action: 'yönleri ters çevirmeden ilişkiyi ifade et', dependsOn: ['s2'], evidence: 'Doğru seçenek ilk görüşü biçime, ikinciyi ses ve etkiye bağlı sadakat olarak verir.', hint: 'Sözcüğe bağlılık ile etkiye bağlılık doğru görüşe mi yerleştirilmiş?' }
  ]},
  misconceptions: [
    { id: 'reverse-contrast-direction', optionRole: 'reversed', description: 'İki görüşün savunduğu sadakat türlerini ters çevirir.', buggyRule: 'swap-two-translation-views', feedback: 'Sözcük düzenine bağlılık ilk, ses ve etkiyi koruma ikinci görüşe aittir.' },
    { id: 'erase-contrast', optionRole: 'same-view', description: 'İki farklı yaklaşımı bütünüyle aynı sayar.', buggyRule: 'collapse-distinct-definitions', feedback: 'İki görüş sadakati farklı ölçütlerle tanımlar.' },
    { id: 'change-comparison-dimension', optionRole: 'wrong-dimension', description: 'Metinde tartışılmayan hız ve kolaylık boyutunu karşıtlık sanır.', buggyRule: 'replace-fidelity-with-speed', feedback: 'Parçada çevirinin süresi ya da kolaylığı üzerinde durulmaz.' },
    { id: 'false-total-opposition', optionRole: 'translation-vs-original', description: 'Görüşlerden birini çeviriye bütünüyle karşıymış gibi gösterir.', buggyRule: 'turn-method-dispute-into-rejection', feedback: 'İki yaklaşım da çeviriyi mümkün görür; yalnız yöntem anlayışları ayrıdır.' }
  ],
  createTask: () => ({
    passage: `Çeviride sadakat denince iki ayrı yol beliriyor. Birine göre çevirmen, metnin sözcüklerinden ve cümle düzeninden mümkün olduğunca ayrılmamalıdır; çünkü yazarın seçimi en küçük dil biriminde bile görünür. Ötekine göre ise sözcüklere bu ölçüde bağlanmak, metnin sesini öldürebilir. Bu görüşü savunanlar, aynı etkiyi başka araçlarla kurmayı ihanet değil, asıl sadakat sayar. İlki metnin ayak izlerini tek tek korumaya, ikincisi yürüyüşünü yeniden duyurmaya çalışır.`,
    prompt: 'Bu parçada karşılaştırılan iki yaklaşım arasındaki temel ayrım aşağıdakilerden hangisidir?',
    query: { type: 'contrast' },
    surfaceProfile: { genre: 'düşünce-yazısı', voice: 'nesnel-karşılaştırıcı', sourceMode: 'özgün-dil-incelemesi', rhetoricalMoves: ['tanımlama', 'karşılaştırma', 'benzetme'], stemFamily: 'karşıtlık' },
    evidenceMap: { contrasts: [{ left: 'formal-fidelity', right: 'effect-fidelity', relation: 'same-concept-different-criterion' }] },
    options: [
      option('a', 'correct', 'Birinci yaklaşım sadakati sözcük ve yapıya bağlılıkta, ikinci yaklaşım metnin sesini ve etkisini yeniden kurmakta görür.', { left: 'formal-fidelity', right: 'effect-fidelity', relation: 'same-concept-different-criterion' }),
      option('b', 'reversed', 'Birinci yaklaşım metnin etkisini özgürce yeniden kurmayı, ikinci yaklaşım sözcüklere bağlı kalmayı savunur.', { left: 'effect-fidelity', right: 'formal-fidelity', relation: 'same-concept-different-criterion' }),
      option('c', 'same-view', 'İki yaklaşım da sadakatin yalnız cümle yapısını değiştirmemekle sağlanacağını ileri sürer.', { left: 'formal-fidelity', right: 'formal-fidelity', relation: 'full-agreement' }),
      option('d', 'wrong-dimension', 'İlk yaklaşım hızlı, ikinci yaklaşım yavaş çeviri yapmanın daha başarılı olduğunu savunur.', { left: 'fast-translation', right: 'slow-translation', relation: 'speed-contrast' }),
      option('e', 'translation-vs-original', 'Birinci yaklaşım çeviriyi gereksiz bulurken ikinci yaklaşım bütün eserlerin çevrilmesini ister.', { left: 'reject-translation', right: 'translate-all', relation: 'total-opposition' })
    ]
  })
});

export const paragraphFunctionModel = defineReadingEvidenceModel({
  id: 'reading-paragraph-function-v2',
  construct: {
    id: 'construct-reading-paragraph-function', gradeRange: [6, 12], subjectId: 'turkish',
    curriculumOutcomeIds: ['analyze-paragraph-function'],
    knowledgeComponents: ['paragraph-role', 'argument-flow', 'example-counterexample'],
    claim: 'Öğrenci bir paragrafın metnin bütünü içindeki işlevini belirler.'
  },
  deepFeatures: ['discourse-role-map', 'problem-example-refinement'],
  surfaceFeatures: ['museum-labels', 'two-paragraph-essay', 'counterexample'],
  compatibleGameIds: READING_GAMES,
  solutionGraph: { steps: [
    { id: 's1', action: 'ilk paragrafın ileri sürdüğü sorunu belirle', dependsOn: [], evidence: 'İlk paragraf, açıklama levhalarının nesnenin önüne geçerek bakma deneyimini yönettiğini savunur.', hint: 'İlk paragraf hangi genel sorunu dile getiriyor?' },
    { id: 's2', action: 'ikinci paragrafın bu soruna ne yaptığını belirle', dependsOn: ['s1'], evidence: 'İkinci paragraf, kısa ve soru biçimindeki levhaların kullanıldığı bir uygulamayı örnekleyerek soruna alternatif sunar.', hint: 'İkinci paragraf yalnız yeni bilgi mi ekliyor, yoksa ilk soruna bir çözüm örneği mi getiriyor?' },
    { id: 's3', action: 'işlevi metnin akışı içinde adlandır', dependsOn: ['s2'], evidence: 'İkinci paragraf, ilk paragraftaki eleştiriyi somut bir karşı uygulamayla geliştirir.', hint: 'Doğru seçenek “örnek”, “çözüm” ve “ilk düşünceyi geliştirme” ilişkilerinden hangisini birlikte taşıyor?' }
  ]},
  misconceptions: [
    { id: 'repeat-problem', optionRole: 'repetition', description: 'İkinci paragrafı ilk sorunun tekrarı sanır.', buggyRule: 'ignore-alternative-example', feedback: 'İkinci paragraf farklı bir uygulama göstererek eleştiriyi tekrarlamakla kalmaz.' },
    { id: 'unrelated-detail', optionRole: 'unrelated', description: 'İki paragraf arasındaki konu ve işlev bağını göremez.', buggyRule: 'treat-second-paragraph-as-unrelated', feedback: 'İki paragraf da açıklama levhalarının ziyaretçi deneyimine etkisini ele alır.' },
    { id: 'reverse-function', optionRole: 'proof-of-failure', description: 'Başarılı örneği ilk görüşün yanlışlığının kanıtı sayar.', buggyRule: 'counterexample-cancels-critique', feedback: 'Örnek, levhaların her kullanımına değil, ziyaretçiyi yöneten kullanımına getirilen eleştiriyi destekler.' },
    { id: 'historical-background', optionRole: 'background', description: 'Uygulama örneğini tarihsel arka plan sanır.', buggyRule: 'example-means-background', feedback: 'İkinci paragraf geçmiş bilgisi vermiyor; alternatif tasarımın sonucunu gösteriyor.' }
  ],
  createTask: ({ museum = 'Kent Müzesi' } = {}) => ({
    passages: [
      `Müzelerde bazen nesneden önce açıklama levhasını okuruz. Uzun metinler, neye bakacağımızı ve ne düşüneceğimizi baştan söylediğinde vitrindeki eşya yalnız yazının kanıtına dönüşür. Bilgi vermek isterken merakı ortadan kaldıran bu tutum, ziyaretçiyi dikkatli bir gözlemci olmaktan çıkarabilir.`,
      `${museum}, yeni sergisinde levhaları birkaç kısa soruyla sınırladı: “Bu kap neden tek kulplu?”, “Üzerindeki aşınma size ne söylüyor?” Ziyaretçiler önce nesneyi inceleyip kendi tahminlerini yaptı, ayrıntılı bilgiye ise daha sonra açılan bölümlerden ulaştı. Sergi sonunda yapılan görüşmelerde pek çok kişi, eşyalara eskisinden daha uzun süre baktığını belirtti.`
    ],
    prompt: 'İkinci paragrafın metnin bütünü içindeki işlevi aşağıdakilerden hangisidir?',
    query: { type: 'paragraph-function' },
    surfaceProfile: { genre: 'iki-paragraflı-eleştiri', voice: 'açıklayıcı-örnekleyici', sourceMode: 'özgün-müze-yazısı', rhetoricalMoves: ['sorun', 'uygulama-örneği', 'sonuç'], stemFamily: 'paragraf-işlevi' },
    evidenceMap: { paragraphs: [
      { id: 'p1', function: 'state-problem' },
      { id: 'p2', function: 'offer-alternative-and-show-result' }
    ] },
    options: [
      option('a', 'correct', 'İlk paragrafta eleştirilen uygulamaya alternatif bir yöntem sunup bu yöntemin sonucunu örneklemek', { paragraphId: 'p2', function: 'offer-alternative-and-show-result' }),
      option('b', 'repetition', 'İlk paragraftaki eleştiriyi hiçbir yeni yön eklemeden farklı sözcüklerle yinelemek', { paragraphId: 'p2', function: 'repeat-problem' }),
      option('c', 'unrelated', 'Müzelerde sergilenen kapların tarihsel özellikleri hakkında bağımsız bilgi vermek', { paragraphId: 'p2', function: 'unrelated-object-history' }),
      option('d', 'proof-of-failure', 'İlk paragraftaki eleştirinin bütünüyle yanlış olduğunu kanıtlamak', { paragraphId: 'p2', function: 'disprove-first-paragraph' }),
      option('e', 'background', 'Müze açıklama levhalarının geçmişten günümüze gelişimini anlatmak', { paragraphId: 'p2', function: 'historical-background' })
    ]
  })
});

export const PHASE3B_READING_MODELS = Object.freeze([
  authorPurposeModel,
  authorAttitudeModel,
  contrastRelationModel,
  paragraphFunctionModel
]);
