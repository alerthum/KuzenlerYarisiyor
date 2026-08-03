import { defineReadingEvidenceModel, option, proposition } from './reading-model-factory.js';

const READING_GAMES = Object.freeze(['paragraph-detective', 'meaning-hunt']);

export const mainIdeaCoverageModel = defineReadingEvidenceModel({
  id: 'reading-main-idea-coverage-v2',
  construct: {
    id: 'construct-reading-main-idea-coverage', gradeRange: [5, 12], subjectId: 'turkish',
    curriculumOutcomeIds: ['determine-main-idea'],
    knowledgeComponents: ['central-claim', 'detail-vs-main-idea', 'scope-control'],
    claim: 'Öğrenci paragrafın merkezî iddialarını birlikte kapsayan ve ayrıntıya sapmayan ana düşünceyi belirler.'
  },
  deepFeatures: ['central-claim-coverage', 'detail-exclusion', 'scope-preservation'],
  surfaceFeatures: ['essay-voice', 'urban-memory', 'map-metaphor'],
  compatibleGameIds: READING_GAMES,
  solutionGraph: { steps: [
    { id: 's1', action: 'paragraf boyunca sürdürülen düşünce çizgisini belirle', dependsOn: [], evidence: 'Yazar eski haritaları yalnız yön bulma aracı olarak değil, kentin belleğini taşıyan belgeler olarak değerlendirir.', hint: 'Tek tek sokak adlarından önce yazarın haritalara yüklediği genel anlamı bul.' },
    { id: 's2', action: 'ana düşüncenin ikinci yönünü ayırt et', dependsOn: ['s1'], evidence: 'Yazar belleği korumanın kenti geçmişte dondurmak anlamına gelmediğini de özellikle söyler.', hint: '“Ne var ki” sonrasındaki sınırlama ana düşünceye hangi ikinci boyutu ekliyor?' },
    { id: 's3', action: 'iki yönü birlikte kapsayan yargıyı seç', dependsOn: ['s2'], evidence: 'Doğru seçenek hem geçmişin izlerini korumayı hem de yaşayan kentin değişimini kabul etmeyi birlikte taşır.', hint: 'Seçenek yalnız korumayı ya da yalnız değişimi değil, ikisinin dengesini veriyor mu?' }
  ]},
  misconceptions: [
    { id: 'detail-as-main-idea', optionRole: 'detail-as-main', description: 'Parçada geçen çarpıcı bir ayrıntıyı ana düşünce sanır.', buggyRule: 'select-salient-map-detail', feedback: 'Sokak adları, yazarın genel düşüncesini destekleyen ayrıntılardır.' },
    { id: 'overgeneralized-main-idea', optionRole: 'overgeneralized', description: 'Belleği koruma düşüncesini kenti değişime kapatma biçiminde aşırı geneller.', buggyRule: 'turn-preservation-into-freezing', feedback: 'Yazar, kentin yaşayan ve değişen bir yapı olduğunu açıkça kabul eder.' },
    { id: 'one-sided-summary', optionRole: 'one-sided', description: 'Ana düşüncenin yalnız değişim yönünü alır.', buggyRule: 'drop-memory-claim', feedback: 'Parçanın ilk bölümü haritaların kent belleğini taşımasını temel bir değer olarak sunar.' },
    { id: 'topic-label-as-main-idea', optionRole: 'topic-only', description: 'Parçanın konusunu, yazarın iletisiyle karıştırır.', buggyRule: 'select-topic-label', feedback: '“Eski kent haritaları” yalnız konudur; ana düşünce bu konu hakkında ileri sürülen yargıdır.' }
  ],
  createTask: ({ city = 'Sarıova' } = {}) => ({
    passage: `Eski ${city} haritalarına baktığımda önce yolları değil, artık kullanılmayan sözcükleri görüyorum. Bir zamanlar çeşmeye, hana ya da bir zanaata açılan sokak adları, kentin kendini nasıl anlattığını bugüne taşıyor. Bu yüzden eski bir haritayı korumak, yalnız kâğıdı değil, bir bakış biçimini de korumaktır. Ne var ki belleğe sahip çıkmak, şehri geçmişin dekoruna çevirmek demek değildir. Kent yaşadıkça değişir; önemli olan, değişirken hangi izleri neden taşıdığını unutmamasıdır.`,
    prompt: 'Bu parçanın ana düşüncesi aşağıdakilerden hangisidir?',
    query: { type: 'main-idea' },
    surfaceProfile: { genre: 'deneme', voice: 'birinci-tekil-düşünsel', sourceMode: 'özgün-edebî', rhetoricalMoves: ['örnekleme', 'karşıtlık', 'sonuç'], stemFamily: 'ana-düşünce' },
    evidenceMap: { claims: [
      { id: 'c1', centrality: 'central' },
      { id: 'c2', centrality: 'central' },
      { id: 'c3', centrality: 'detail' }
    ] },
    options: [
      option('a', 'correct', 'Kent belleğini taşıyan eski haritaları korumak değerlidir; ancak bu koruma, yaşayan şehri değişime kapatmadan sürdürülmelidir.', { focus: 'central', covers: ['c1', 'c2'], addsUnsupported: false, detailOnly: false }),
      option('b', 'detail-as-main', 'Eski sokak adları, geçmişteki çeşme, han ve zanaatların izlerini günümüze ulaştırır.', { focus: 'detail', covers: ['c3'], addsUnsupported: false, detailOnly: true }),
      option('c', 'overgeneralized', 'Kimliğini ve kültürel değerlerini yitirmek istemeyen kentler, geçmişteki sokak düzenini ve yapılarını hiçbir değişikliğe uğratmadan olduğu gibi korumalıdır.', { focus: 'central', covers: ['c1', 'c2'], addsUnsupported: true, detailOnly: false }),
      option('d', 'one-sided', 'Bir kentin canlılığını koruyabilmesi, geçmişten kalan bütün izleri geride bırakmasına bağlıdır.', { focus: 'central', covers: ['c2'], addsUnsupported: true, detailOnly: false }),
      option('e', 'topic-only', 'Parçada eski kent haritaları ile sokak adlarının tarihsel özelliklerinden söz edilmektedir.', { focus: 'topic', covers: ['c1'], addsUnsupported: false, detailOnly: false })
    ]
  })
});

export const supportedInferenceModel = defineReadingEvidenceModel({
  id: 'reading-supported-inference-v2',
  construct: {
    id: 'construct-reading-supported-inference', gradeRange: [6, 12], subjectId: 'turkish',
    curriculumOutcomeIds: ['derive-supported-inference'],
    knowledgeComponents: ['textual-entailment', 'modality-control', 'sample-scope'],
    claim: 'Öğrenci metnin desteklediği çıkarımı kesinlik ve kapsam eklemeden seçer.'
  },
  deepFeatures: ['proposition-entailment', 'modality-ceiling', 'scope-subset'],
  surfaceFeatures: ['anecdote', 'craftsmanship', 'implicit-meaning'],
  compatibleGameIds: READING_GAMES,
  solutionGraph: { steps: [
    { id: 's1', action: 'anekdottaki temel karşıtlığı belirle', dependsOn: [], evidence: 'Müşteri aynı defteri isterken usta, ikinci çalışmayı ilkinden sonra değişen eli nedeniyle birebir tekrar saymaz.', hint: 'Müşterinin “aynı” dediği şeyle ustanın “aynı” saymadığı şeyi ayır.' },
    { id: 's2', action: 'sözün örtük anlamını çıkar', dependsOn: ['s1'], evidence: 'Ustanın sözü, deneyimin yapan kişiyi değiştirdiğini ve tekrarın ilk üretimden bağımsız olamayacağını düşündürür.', hint: '“Elim artık o defteri yapan el değil” sözü yalnız fiziksel eli mi anlatıyor?' },
    { id: 's3', action: 'metnin sınırını aşmayan çıkarımı seç', dependsOn: ['s2'], evidence: 'Doğru yargı ustanın ikinci ürünü birebir kopya saymadığını belirtir; bütün sanatçılar için kesin yasa kurmaz.', hint: 'Seçenek metindeki ustanın düşüncesini mi çıkarıyor, yoksa herkese yayılan kesin bir kural mı koyuyor?' }
  ]},
  misconceptions: [
    { id: 'association-to-certain-success', optionRole: 'universal-law', description: 'Tek bir ustanın sözünü bütün sanatçılar için değişmez yasa yapar.', buggyRule: 'generalize-anecdote-to-all-creators', feedback: 'Parça bir ustanın yaklaşımını verir; bütün yaratıcılar için kesin hüküm kurmaz.' },
    { id: 'reject-observed-association', optionRole: 'literal-only', description: 'Mecazlı sözü yalnız el becerisinin azalması olarak okur.', buggyRule: 'read-metaphor-literally', feedback: 'Ustanın “elim değişti” sözü deneyimle dönüşen üretim anlayışını anlatır.' },
    { id: 'expand-to-all-libraries', optionRole: 'unsupported-motive', description: 'Metinde bulunmayan ekonomik bir neden ekler.', buggyRule: 'invent-financial-motive', feedback: 'Ustanın daha fazla ücret istemek ya da işi reddetmek için böyle söylediğine dair kanıt yoktur.' },
    { id: 'reverse-inference', optionRole: 'reverse', description: 'Deneyimin üretimi değiştirmesi düşüncesini tersine çevirir.', buggyRule: 'experience-guarantees-identical-copy', feedback: 'Usta, deneyim kazandığı için aynı ürünü birebir tekrarlayamayacağını söyler.' }
  ],
  createTask: ({ objectName = 'deri kaplı defter' } = {}) => {
    const supported = proposition({ subject: 'second-work', predicate: 'cannot-be-identical', object: 'first-work', relation: 'inference', modality: 'probable', quantifier: 'one', scope: ['bookbinder-anecdote'] });
    return {
      passage: `Bir cilt ustasının yıllar önce yaptığı ${objectName}i gören müşteri, “Bundan bir tane daha istiyorum, tıpkısının aynısı olsun.” der. Usta defteri uzun uzun inceler, sonra başını sallar: “Benzerini yaparım ama aynısını yapamam; çünkü elim artık bu defteri yapan el değil.”`,
      prompt: 'Bu parçadan aşağıdakilerin hangisine ulaşılabilir?',
      query: { type: 'supported-inference' },
      surfaceProfile: { genre: 'anekdot', voice: 'üçüncü-tekil-anlatıcı', sourceMode: 'özgün-kurmaca', rhetoricalMoves: ['diyalog', 'mecaz', 'örtük-sonuç'], stemFamily: 'çıkarım' },
      evidenceMap: { claims: [{ id: 'c1', centrality: 'central', proposition: supported }] },
      options: [
        option('a', 'correct', 'Usta, kazandığı deneyimin ikinci çalışmayı ilkinden farklı kılacağını düşünmektedir.', { claimId: 'c1', proposition: supported }),
        option('b', 'universal-law', 'Hiçbir sanatçı daha önce yaptığı bir eserin benzerini yeniden ortaya koyamaz.', { claimId: 'c1', proposition: proposition({ ...supported, subject: 'all-artists', modality: 'certain', quantifier: 'all', scope: ['all-creative-work'] }) }),
        option('c', 'literal-only', 'Ustanın yıllar içinde el becerisi azaldığı için nitelikli bir defter yapması artık mümkün değildir.', { claimId: 'c1', proposition: proposition({ ...supported, predicate: 'lost-skill', object: 'bookbinding', relation: 'cause', modality: 'certain' }) }),
        option('d', 'unsupported-motive', 'Usta, müşteriden daha yüksek ücret alabilmek için işi olduğundan güç göstermektedir.', { claimId: 'c1', proposition: proposition({ ...supported, predicate: 'seeks-more-money', object: 'customer', relation: 'motive', modality: 'certain' }) }),
        option('e', 'reverse', 'Usta, deneyimi arttığı için ilk defterin bütünüyle aynısını yapabileceğinden emindir.', { claimId: 'c1', proposition: proposition({ ...supported, polarity: 'negative', modality: 'certain' }) })
      ]
    };
  }
});

export const claimEvidenceMatchModel = defineReadingEvidenceModel({
  id: 'reading-claim-evidence-match-v2',
  construct: {
    id: 'construct-reading-claim-evidence-match', gradeRange: [5, 12], subjectId: 'turkish',
    curriculumOutcomeIds: ['match-claim-with-evidence'],
    knowledgeComponents: ['claim-identification', 'evidence-relevance', 'support-link'],
    claim: 'Öğrenci bir iddiayı doğrudan destekleyen kanıtı ilgisiz ayrıntılardan ayırır.'
  },
  deepFeatures: ['support-edge-validation', 'claim-evidence-specificity'],
  surfaceFeatures: ['literary-magazine', 'archive', 'editorial-change'],
  compatibleGameIds: READING_GAMES,
  solutionGraph: { steps: [
    { id: 's1', action: 'parçadaki temel yargıları ayır', dependsOn: [], evidence: 'Parça derginin ilk sayılarındaki tartışmacı dilin zamanla daha sakin ve çözümleyici bir dile dönüştüğünü ileri sürer.', hint: 'Derginin fiziksel özellikleriyle yayın dilindeki değişimi birbirinden ayır.' },
    { id: 's2', action: 'her yargının doğrudan kanıtını bul', dependsOn: ['s1'], evidence: 'İlk ve son dönem başyazılarından verilen ifade örnekleri, dil değişimini doğrudan gösterir.', hint: 'Hangi ayrıntı iddiayı yalnız tekrarlamıyor, gözlenebilir bir karşılaştırma sunuyor?' },
    { id: 's3', action: 'konu benzerliğiyle kanıt ilişkisini karıştırma', dependsOn: ['s2'], evidence: 'Kapak rengi, arşivin taşınması ve okur sayısı dergiyle ilgilidir; ancak yayın dilinin değiştiğini kanıtlamaz.', hint: 'Ayrıntı dergi hakkında olsa bile hedef yargıyı gerçekten destekliyor mu?' }
  ]},
  misconceptions: [
    { id: 'topic-overlap-as-evidence', optionRole: 'topic-overlap', description: 'Aynı konu alanındaki bir ayrıntıyı doğrudan kanıt sayar.', buggyRule: 'same-topic-means-support', feedback: 'Derginin kapağıyla ilgili bilgi, yazı dilindeki dönüşümü göstermez.' },
    { id: 'historical-detail-as-proof', optionRole: 'archive-detail', description: 'Arşivle ilgili tarihsel ayrıntıyı dil değişiminin kanıtı sanır.', buggyRule: 'salient-history-means-evidence', feedback: 'Arşivin taşınması, başyazıların üslubuyla ilgili değildir.' },
    { id: 'reverse-support-link', optionRole: 'reverse-link', description: 'Bir kanıtı desteklemediği başka bir yargıya bağlar.', buggyRule: 'attach-evidence-to-wrong-claim', feedback: 'Sonraki başyazılardaki ölçülü cümleler, arşivin taşındığını değil yayın dilinin değiştiğini destekler.' },
    { id: 'claim-restatement-as-evidence', optionRole: 'restatement', description: 'İddiayı başka sözcüklerle yinelemeyi kanıt sanır.', buggyRule: 'restatement-counts-as-proof', feedback: 'Kanıt, iddiadan bağımsız bir gözlem ya da örnek sunmalıdır.' }
  ],
  createTask: ({ magazine = 'Kıyı' } = {}) => ({
    passage: `${magazine} dergisinin ilk sayılarındaki başyazılar, okurla konuşmaktan çok rakiplerle hesaplaşan bir tona sahiptir: “Bizden olmayan edebiyatın dışında kalacaktır.” gibi keskin cümleler sıkça yinelenir. On yıl sonraki başyazılarda ise aynı konular, “Bir eseri kendi imkânları içinde anlamadan hüküm vermemeliyiz.” türünden daha ölçülü ifadelerle ele alınır. Derginin kapak rengi bu yıllarda üç kez değişmiş, arşivi de başka bir binaya taşınmıştır.`,
    prompt: 'Aşağıdaki yargı–kanıt eşleştirmelerinden hangisi doğrudur?',
    query: { type: 'claim-evidence' },
    surfaceProfile: { genre: 'edebî-inceleme', voice: 'nesnel-eleştirel', sourceMode: 'özgün-kültür-yazısı', rhetoricalMoves: ['alıntılama', 'karşılaştırma', 'örneklendirme'], stemFamily: 'yargı-kanıt' },
    evidenceMap: {
      claims: [
        { id: 'c1', text: `${magazine} dergisinin yayın dili zamanla daha ölçülü hâle gelmiştir.` },
        { id: 'c2', text: 'Derginin fiziksel arşivi başka bir binaya taşınmıştır.' }
      ],
      evidence: [
        { id: 'e1', supports: ['c1'], directness: 1, reliability: 0.95 },
        { id: 'e2', supports: ['c2'], directness: 1, reliability: 1 },
        { id: 'e3', supports: [], directness: 0, reliability: 1 },
        { id: 'e4', supports: [], directness: 0, reliability: 0.2 }
      ]
    },
    options: [
      option('a', 'correct', `Yargı: ${magazine} dergisinin dili zamanla daha ölçülü olmuştur. Kanıt: İlk ve sonraki dönem başyazılarındaki ifadeler farklı bir söyleyiş tutumu göstermektedir.`, { claimId: 'c1', evidenceId: 'e1' }),
      option('b', 'topic-overlap', `Yargı: ${magazine} dergisinin dili zamanla daha ölçülü olmuştur. Kanıt: Derginin kapak rengi üç kez değiştirilmiştir.`, { claimId: 'c1', evidenceId: 'e3' }),
      option('c', 'archive-detail', `Yargı: ${magazine} dergisinin dili zamanla daha ölçülü olmuştur. Kanıt: Dergi arşivi başka bir binaya taşınmıştır.`, { claimId: 'c1', evidenceId: 'e2' }),
      option('d', 'reverse-link', 'Yargı: Derginin arşivi başka bir binaya taşınmıştır. Kanıt: Sonraki başyazılarda daha ölçülü cümlelere yer verilmiştir.', { claimId: 'c2', evidenceId: 'e1' }),
      option('e', 'restatement', `Yargı: ${magazine} dergisinin dili zamanla daha ölçülü olmuştur. Kanıt: Dergi, ilk yıllardaki sert söyleyişini zaman içinde bırakmış ve daha sakin bir anlatıma yönelmiştir.`, { claimId: 'c1', evidenceId: 'e4' })
    ]
  })
});

export const scopeCertaintyControlModel = defineReadingEvidenceModel({
  id: 'reading-scope-certainty-control-v2',
  construct: {
    id: 'construct-reading-scope-certainty-control', gradeRange: [6, 12], subjectId: 'turkish',
    curriculumOutcomeIds: ['evaluate-scope-and-certainty'],
    knowledgeComponents: ['quantifier-strength', 'time-scope', 'causal-limitation'],
    claim: 'Öğrenci bir araştırma sonucunu örneklem, süre ve kesinlik sınırlarını koruyarak yorumlar.'
  },
  deepFeatures: ['quantifier-order', 'modality-order', 'scope-subset'],
  surfaceFeatures: ['reading-club', 'limited-sample', 'delayed-recall'],
  compatibleGameIds: READING_GAMES,
  solutionGraph: { steps: [
    { id: 's1', action: 'araştırmanın kimlerle ve ne kadar süreyle yapıldığını belirle', dependsOn: [], evidence: 'Çalışma tek bir okulun iki sınıfında ve altı haftalık bir dönemde yürütülmüştür.', hint: 'Yer, öğrenci grubu ve süre sınırlarını ayrı ayrı not et.' },
    { id: 's2', action: 'ölçülen sonuçla ölçülmeyen sonuçları ayır', dependsOn: ['s1'], evidence: 'Ölçülen sonuç altı hafta sonundaki metin hatırlamadır; yaşam boyu okuma alışkanlığı ya da bütün derslerde başarı değildir.', hint: 'Seçenek metinde ölçülmeyen hangi sonucu ekliyor?' },
    { id: 's3', action: 'bulgunun gücünü azaltmadan kapsamını koru', dependsOn: ['s2'], evidence: 'Doğru yorum, tartışma grubunun bu örneklemde daha yüksek hatırlama göstermesini kabul eder fakat evrenselleştirmez.', hint: '“Bu öğrencilerde” ile “bütün öğrencilerde” arasındaki farkı gözet.' }
  ]},
  misconceptions: [
    { id: 'universalize-single-school', optionRole: 'universal', description: 'Tek okul örneklemini bütün öğrencilere geneller.', buggyRule: 'replace-limited-sample-with-all', feedback: 'Araştırma yalnız bir okuldaki iki sınıfla sınırlıdır.' },
    { id: 'temporary-to-permanent', optionRole: 'permanent', description: 'Altı haftalık sonucu yaşam boyu kalıcılığa dönüştürür.', buggyRule: 'extend-time-scope-indefinitely', feedback: 'Çalışma yaşam boyu okuma alışkanlığını ölçmemiştir.' },
    { id: 'single-cause-certainty', optionRole: 'sole-cause', description: 'Gözlenen farkı tek ve kesin nedene bağlar.', buggyRule: 'upgrade-result-to-sole-cause', feedback: 'Gruplar arasındaki bütün farklılıkların dışlandığı belirtilmemiştir.' },
    { id: 'dismiss-limited-evidence', optionRole: 'dismissal', description: 'Sınırlı araştırmayı bütünüyle değersiz sayar.', buggyRule: 'limited-scope-means-no-result', feedback: 'Kapsamın sınırlı olması, incelenen öğrencilerdeki bulguyu yok saymayı gerektirmez.' }
  ],
  createTask: ({ school = 'Aydınlık Ortaokulu', weeks = 6 } = {}) => {
    const supported = proposition({ subject: 'discussion-reading', predicate: 'may-improve', object: 'delayed-text-recall', relation: 'association', modality: 'probable', quantifier: 'some', scope: [school, 'two-grade-7-classes', `${weeks}-weeks`] });
    return {
      passage: `${school}ndaki iki yedinci sınıfta aynı öykü kitabı okundu. Sınıflardan biri her bölümün ardından öğretmen yönetiminde kısa tartışmalar yaptı; diğer sınıf yalnız bireysel okuma notları tuttu. ${weeks} hafta sonra uygulanan metni hatırlama çalışmasında tartışma yapan sınıfın ortalaması daha yüksek çıktı. Uygulama başka okul ve sınıf düzeylerinde denenmedi; grupların okul dışındaki okuma alışkanlıkları da karşılaştırılmadı.`,
      prompt: 'Bu araştırmanın sonuçlarına dayanılarak aşağıdakilerden hangisi söylenebilir?',
      query: { type: 'scope-control' },
      surfaceProfile: { genre: 'bilimsel-popüler', voice: 'nesnel-açıklayıcı', sourceMode: 'sınırlı-araştırma', rhetoricalMoves: ['karşılaştırma', 'sonuç', 'sınırlama'], stemFamily: 'araştırma-yorumu' },
      evidenceMap: { claims: [{ id: 'c1', centrality: 'central', proposition: supported }] },
      options: [
        option('a', 'correct', `Bölüm sonu tartışmaları, bu okuldaki iki sınıfın ${weeks} hafta sonraki metin hatırlamasına katkı sağlamış olabilir.`, { claimId: 'c1', proposition: supported }),
        option('b', 'universal', 'Okudukları metinleri sınıfta tartışan bütün öğrenciler, okul türü ve yaşları ne olursa olsun her derste ve her koşulda daha başarılı olur.', { claimId: 'c1', proposition: proposition({ ...supported, modality: 'certain', quantifier: 'all', scope: ['all-students', 'all-contexts'] }) }),
        option('c', 'permanent', 'Tartışma yöntemiyle okuyan öğrenciler öğrendikleri hiçbir metni yaşamları boyunca unutmaz.', { claimId: 'c1', proposition: proposition({ ...supported, predicate: 'prevents', object: 'all-forgetting', modality: 'certain', quantifier: 'all', scope: ['lifetime'] }) }),
        option('d', 'sole-cause', 'İki sınıf arasındaki farkın tek nedeni bölüm sonu tartışmalarıdır.', { claimId: 'c1', proposition: proposition({ ...supported, relation: 'cause', modality: 'certain', causeId: 'discussion-only' }) }),
        option('e', 'dismissal', 'Çalışma yalnız iki sınıfta yapıldığı için tartışma grubunda görülen farkın hiçbir anlamı yoktur.', { claimId: 'c1', proposition: proposition({ ...supported, polarity: 'negative', modality: 'certain' }) })
      ]
    };
  }
});

export const PHASE3A_READING_MODELS = Object.freeze([
  mainIdeaCoverageModel,
  supportedInferenceModel,
  claimEvidenceMatchModel,
  scopeCertaintyControlModel
]);
