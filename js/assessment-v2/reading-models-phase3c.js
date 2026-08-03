import { defineReadingEvidenceModel, option, proposition } from './reading-model-factory.js';

const READING_GAMES = Object.freeze(['paragraph-detective', 'meaning-hunt']);

export const necessaryAssumptionModel = defineReadingEvidenceModel({
  id: 'reading-necessary-assumption-v2',
  construct: {
    id: 'construct-reading-necessary-assumption', gradeRange: [7, 12], subjectId: 'turkish',
    curriculumOutcomeIds: ['identify-necessary-assumption'],
    knowledgeComponents: ['argument-gap', 'necessary-condition', 'alternative-explanation'],
    claim: 'Öğrenci bir sonucun dayandığı fakat açıkça söylenmeyen zorunlu varsayımı belirler.'
  },
  deepFeatures: ['claim-requires-assumption', 'alternative-cause-control', 'necessity-test'],
  surfaceFeatures: ['library-anecdote', 'display-change', 'borrowing-claim'],
  compatibleGameIds: READING_GAMES,
  solutionGraph: { steps: [
    { id: 's1', action: 'gözlem ile sonuç yargısını ayır', dependsOn: [], evidence: 'Gözlem şiir kitaplarının ödünç alınmasının artmasıdır; sonuç bu artışın rafların görünür yere taşınmasından kaynaklandığıdır.', hint: 'Metinde doğrudan görülen değişimle yöneticinin buna getirdiği açıklamayı ayrı yaz.' },
    { id: 's2', action: 'sonucu bozabilecek alternatif açıklamayı ara', dependsOn: ['s1'], evidence: 'Aynı dönemde şiir etkinliği, yeni kitap alımı veya kampanya yapılmışsa artış yalnız yer değişikliğine bağlanamaz.', hint: 'Rafların yeri değişmese bile ödünç sayısını artırabilecek başka ne olmuş olabilir?' },
    { id: 's3', action: 'yargının ayakta kalması için gerekli varsayımı seç', dependsOn: ['s2'], evidence: 'Sonuç, şiir ödünçlerini özellikle etkileyen başka önemli bir değişiklik yapılmadığı varsayımına ihtiyaç duyar.', hint: 'Seçeneği yanlış kabul ettiğinde yöneticinin sonucu çöker mi? Çöküyorsa gerekli varsayıma yaklaşmışsın.' }
  ]},
  misconceptions: [
    { id: 'desirability-as-assumption', optionRole: 'all-like-poetry', description: 'Sonucun gerekli kılmadığı evrensel bir beğeni varsayar.', buggyRule: 'claim-requires-everyone-to-like-poetry', feedback: 'Ödünç artışı için bütün okurların şiiri sevmesi gerekmez.' },
    { id: 'outcome-equivalence', optionRole: 'all-books-read', description: 'Ödünç almayı kitabın bütünüyle okunmasıyla eşitler.', buggyRule: 'borrowing-means-complete-reading', feedback: 'Yöneticinin iddiası ödünç sayısıyla ilgilidir; kitapların bitirilmesi gerekli değildir.' },
    { id: 'universal-rule-as-assumption', optionRole: 'eye-level-always', description: 'Yerel sonucu bütün raf düzenleri için değişmez kurala çevirir.', buggyRule: 'local-effect-needs-universal-law', feedback: 'Bu kütüphanedeki açıklama, her kitap ve her raf için evrensel yasa gerektirmez.' },
    { id: 'duration-as-assumption', optionRole: 'permanent-effect', description: 'Kısa dönem sonucunun sonsuza dek sürmesini gerekli sayar.', buggyRule: 'temporary-claim-requires-permanence', feedback: 'İddia yalnız gözlenen dönemdeki artışı açıklamaktadır.' }
  ],
  createTask: ({ library = 'İskele Kütüphanesi' } = {}) => ({
    passage: `${library}nde şiir kitapları yıllardır arka koridorun alt raflarında duruyordu. Kütüphane yönetimi bu kitapları girişe yakın, göz hizasındaki raflara taşıdı. Sonraki iki ayda şiir kitaplarının ödünç alınma sayısı önceki iki aya göre belirgin biçimde arttı. Müdür, “Demek ki okur şiirden uzak değildi; şiir okurun gözünden uzaktı.” diyerek artışı yeni yerleşime bağladı.`,
    prompt: 'Kütüphane müdürünün çıkarımı aşağıdaki varsayımlardan hangisine dayanır?',
    query: { type: 'assumption' },
    surfaceProfile: { genre: 'kısa-olay-yazısı', voice: 'üçüncü-tekil-anlatıcı', sourceMode: 'özgün-gündelik-gözlem', rhetoricalMoves: ['önce-sonra', 'alıntı', 'çıkarım'], stemFamily: 'zorunlu-varsayım' },
    evidenceMap: {
      claims: [{ id: 'c1', requires: ['a1'] }],
      assumptions: [
        { id: 'a1', necessary: true },
        { id: 'a2', necessary: false },
        { id: 'a3', necessary: false },
        { id: 'a4', necessary: false },
        { id: 'a5', necessary: false }
      ]
    },
    options: [
      option('a', 'correct', 'Aynı dönemde şiir kitaplarının ödünç alınmasını özellikle artırabilecek başka önemli bir uygulama yapılmamıştır.', { claimId: 'c1', assumptionId: 'a1' }),
      option('b', 'all-like-poetry', 'Kütüphaneye gelen bütün okurlar aslında şiir okumayı sevmektedir.', { claimId: 'c1', assumptionId: 'a2' }),
      option('c', 'all-books-read', 'Ödünç alınan her şiir kitabı okurlar tarafından son sayfasına kadar okunmuştur.', { claimId: 'c1', assumptionId: 'a3' }),
      option('d', 'eye-level-always', 'Göz hizasına yerleştirilen her kitap, konusu ne olursa olsun daha çok ödünç alınır.', { claimId: 'c1', assumptionId: 'a4' }),
      option('e', 'permanent-effect', 'Şiir kitaplarının ödünç sayısındaki artış bundan sonra hiç azalmadan sürecektir.', { claimId: 'c1', assumptionId: 'a5' })
    ]
  })
});

export const causalBoundaryModel = defineReadingEvidenceModel({
  id: 'reading-causal-boundary-v2',
  construct: {
    id: 'construct-reading-causal-boundary', gradeRange: [7, 12], subjectId: 'turkish',
    curriculumOutcomeIds: ['distinguish-correlation-and-causation'],
    knowledgeComponents: ['observational-study', 'confounder', 'causal-language'],
    claim: 'Öğrenci gözlemsel bir ilişkiden kesin neden-sonuç üretmeden desteklenen yorumu belirler.'
  },
  deepFeatures: ['association-vs-cause', 'confounder-awareness', 'reverse-causality'],
  surfaceFeatures: ['music-listening', 'study-habits', 'observational-data'],
  compatibleGameIds: READING_GAMES,
  solutionGraph: { steps: [
    { id: 's1', action: 'araştırmada ölçülen ilişkiyi belirle', dependsOn: [], evidence: 'Sessiz ortamı tercih eden öğrencilerle sözsüz müzik dinleyen öğrencilerin okuma puanları arasında ortalama fark gözlenmiştir.', hint: 'Araştırma hangi iki özelliği birlikte kaydetmiş?' },
    { id: 's2', action: 'neden sonucunu sınırlayan etkenleri belirle', dependsOn: ['s1'], evidence: 'Öğrenciler gruplara rastgele atanmadığı ve önceki başarı, çalışma süresi gibi etkenler eşitlenmediği için müziğin tek neden olduğu söylenemez.', hint: 'Gruplar araştırmacı tarafından mı oluşturulmuş, yoksa öğrencilerin alışkanlıkları mı gözlenmiş?' },
    { id: 's3', action: 'ilişkiyi kabul eden fakat kesin neden kurmayan seçeneği seç', dependsOn: ['s2'], evidence: 'Doğru yorum gözlenen ortalama farkı korur, ancak bunu müziğin kesin etkisi diye sunmaz.', hint: 'Seçenek hem bulguyu kabul ediyor hem de “kesin neden” dilinden kaçınıyor mu?' }
  ]},
  misconceptions: [
    { id: 'association-as-cause', optionRole: 'cause', description: 'Gözlenen ilişkiyi doğrudan nedensellik sayar.', buggyRule: 'upgrade-association-to-cause', feedback: 'Gruplar rastgele oluşturulmadığı için müziğin puanı düşürdüğü kesinleşmez.' },
    { id: 'reverse-causality', optionRole: 'reverse-cause', description: 'Neden-sonuç yönünü ters kurar.', buggyRule: 'reverse-causal-direction', feedback: 'Yüksek puanın öğrenciyi sessiz çalışmaya yönelttiği de bu verilerle kanıtlanamaz.' },
    { id: 'deny-observed-relation', optionRole: 'deny', description: 'Nedensellik kanıtlanmadığı için gözlenen farkı da reddeder.', buggyRule: 'no-cause-means-no-association', feedback: 'Neden kesinleşmese de grupların ortalamaları arasında fark kaydedilmiştir.' },
    { id: 'overgeneralize-population', optionRole: 'universal', description: 'Sınırlı öğrenci grubunu bütün insanlara yayar.', buggyRule: 'sample-to-all-people', feedback: 'Çalışma belirli öğrencilerle yapılmıştır; bütün yaş ve gruplara genellenemez.' }
  ],
  createTask: ({ students = 164 } = {}) => {
    const association = proposition({ subject: 'silent-study-preference', predicate: 'associated-with', object: 'higher-reading-score', relation: 'association', modality: 'probable', quantifier: 'some', scope: ['observed-high-school-students'] });
    return {
      passage: `${students} lise öğrencisinden bir ay boyunca ders çalışırken nasıl bir ses ortamını tercih ettikleri kaydedildi. Sessiz ortamda çalışanların okuduğunu anlama puanı ortalaması, sözsüz müzik dinleyenlerinkinden daha yüksekti. Ancak öğrenciler bu iki gruba araştırmacılar tarafından atanmadı; önceki başarı düzeyleri, günlük çalışma süreleri ve metin okuma alışkanlıkları eşitlenmedi.`,
      prompt: 'Bu araştırmaya dayanılarak aşağıdakilerden hangisi söylenebilir?',
      query: { type: 'causal-boundary' },
      surfaceProfile: { genre: 'araştırma-özeti', voice: 'nesnel-bilimsel', sourceMode: 'gözlemsel-araştırma', rhetoricalMoves: ['bulgu', 'yöntem-sınırı', 'karşılaştırma'], stemFamily: 'nedensellik-sınırı' },
      evidenceMap: { claims: [{ id: 'c1', proposition: association }] },
      options: [
        option('a', 'correct', 'İncelenen öğrencilerde sessiz çalışma tercihi ile daha yüksek okuduğunu anlama puanı arasında bir ilişki görülmüştür; ancak sessizliğin tek neden olduğu söylenemez.', { claimId: 'c1', proposition: association }),
        option('b', 'cause', 'Sözsüz müzik dinlemek bütün öğrencilerin okuduğunu anlama başarısını kesin olarak düşürür.', { claimId: 'c1', proposition: proposition({ ...association, subject: 'instrumental-music', predicate: 'causes-lower', relation: 'cause', modality: 'certain', quantifier: 'all', scope: ['all-students'] }) }),
        option('c', 'reverse-cause', 'Yüksek okuma puanı, öğrencilerin sessiz ortamı seçmesine kesin olarak neden olur.', { claimId: 'c1', proposition: proposition({ ...association, subject: 'higher-reading-score', predicate: 'causes', object: 'silent-study-preference', relation: 'cause', modality: 'certain' }) }),
        option('d', 'deny', 'Ses ortamı tercihi ile okuduğunu anlama puanı arasında hiçbir ilişki bulunmamıştır.', { claimId: 'c1', proposition: proposition({ ...association, polarity: 'negative', modality: 'certain' }) }),
        option('e', 'universal', 'Her yaştaki insan en iyi okuma performansını yalnız bütünüyle sessiz ortamlarda gösterir.', { claimId: 'c1', proposition: proposition({ ...association, modality: 'certain', quantifier: 'all', scope: ['all-people', 'all-ages'] }) })
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
  surfaceFeatures: ['diary-writing', 'spontaneity-vs-revision', 'paired-essay'],
  compatibleGameIds: READING_GAMES,
  solutionGraph: { steps: [
    { id: 's1', action: 'iki metnin günlük yazısına yüklediği değeri ayrı ayrı belirle', dependsOn: [], evidence: 'Birinci metin ilk anda yazılanın tazeliğini, ikinci metin yeniden okuma ve düzeltmenin daha sahici bir seçime ulaştırmasını önemser.', hint: 'Her metin “sahicilik” duygusunu hangi yazma davranışına bağlıyor?' },
    { id: 's2', action: 'ortak nokta ile ayrışma noktasını ayır', dependsOn: ['s1'], evidence: 'İki metin de günlüğün kişisel gerçeği yakalayabileceğini kabul eder; yöntem konusunda ayrılır.', hint: 'Metinler günlüğün değerinde mi, bu değere ulaşma biçiminde mi anlaşamıyor?' },
    { id: 's3', action: 'kısmi ortaklığı ve yöntem farkını birlikte ifade et', dependsOn: ['s2'], evidence: 'Doğru ilişki, ortak sahicilik arayışını korurken ilk metnin kendiliğindenliği, ikincinin gözden geçirmeyi savunduğunu belirtir.', hint: 'Seçenek hem ortak amacı hem farklı yöntemi taşıyor mu?' }
  ]},
  misconceptions: [
    { id: 'false-total-opposition', optionRole: 'opposition', description: 'Yöntem farkını günlük türü hakkında bütünüyle zıt görüşler sanır.', buggyRule: 'method-difference-means-total-opposition', feedback: 'İki metin de günlüğün kişisel gerçeği taşıyabileceğini kabul eder.' },
    { id: 'false-total-agreement', optionRole: 'same-method', description: 'Ortak amacı görünce yöntemlerin de aynı olduğunu sanır.', buggyRule: 'same-goal-means-same-method', feedback: 'Birinci metin ilk hâli, ikinci metin yeniden düşünülmüş hâli önemser.' },
    { id: 'reverse-emphasis', optionRole: 'reversed', description: 'Metinlerin savunduğu yöntemleri birbirine aktarır.', buggyRule: 'swap-spontaneity-and-revision', feedback: 'Kendiliğindenlik birinci, gözden geçirme ikinci metne aittir.' },
    { id: 'wrong-common-point', optionRole: 'publication', description: 'Metinlerde bulunmayan yayımlanma amacını ortak nokta yapar.', buggyRule: 'invent-publication-goal', feedback: 'İki metin de günlüklerin yayımlanması hakkında görüş bildirmez.' }
  ],
  createTask: () => ({
    passages: [
      'I. Metin: Günlüğün değeri, cümle daha kendini savunmayı öğrenmeden yakalanan ilk sestedir. Akşam yazılan bir öfkeyi ertesi gün düzeltmek, belki onu daha ölçülü kılar ama o anın sıcaklığını da söndürür. Günlük, kusurunu saklamadığı ölçüde gerçektir.',
      'II. Metin: İlk anda yazdıklarımızın hepsi bize ait olabilir ama hepsi bizi anlatmaz. Günlük sayfasına geri dönmek, yaşananı değiştirmek değil; gürültünün içinden asıl sesi seçmektir. Bazen en sahici cümle, ilk değil üçüncü kez kurduğumuz cümledir.'
    ],
    prompt: 'Bu iki metinle ilgili olarak aşağıdakilerden hangisi söylenebilir?',
    query: { type: 'cross-text' },
    surfaceProfile: { genre: 'iki-metimli-deneme', voice: 'karşılaştırmalı-birinci-çoğul', sourceMode: 'özgün-edebî', rhetoricalMoves: ['özdeyiş', 'karşıtlık', 'tanımlama'], stemFamily: 'iki-metin-ilişkisi' },
    evidenceMap: { crossTextRelation: { claimA: 'authenticity-through-spontaneity', claimB: 'authenticity-through-revision', relation: 'shared-goal-different-method' } },
    options: [
      option('a', 'correct', 'İki metin de günlüğün sahici bir anlatı olabileceğini kabul eder; birincisi kendiliğindenliği, ikincisi gözden geçirerek seçmeyi öne çıkarır.', { claimA: 'authenticity-through-spontaneity', claimB: 'authenticity-through-revision', relation: 'shared-goal-different-method' }),
      option('b', 'opposition', 'Birinci metin günlük yazmayı değerli bulurken ikinci metin günlüklerin gerçeği hiçbir biçimde yansıtamayacağını savunur.', { claimA: 'value-diary', claimB: 'reject-diary', relation: 'total-opposition' }),
      option('c', 'same-method', 'İki metin de günlüğün yalnız ilk anda yazıldığı ve hiç değiştirilmediği zaman sahici olacağını söyler.', { claimA: 'authenticity-through-spontaneity', claimB: 'authenticity-through-spontaneity', relation: 'full-agreement-same-method' }),
      option('d', 'reversed', 'Birinci metin yeniden yazmayı, ikinci metin ilk duyguyu değiştirmeden bırakmayı savunur.', { claimA: 'authenticity-through-revision', claimB: 'authenticity-through-spontaneity', relation: 'shared-goal-reversed-method' }),
      option('e', 'publication', 'İki metin de günlüklerin yazıldıktan hemen sonra okurla paylaşılması gerektiğini ileri sürer.', { claimA: 'publish-immediately', claimB: 'publish-immediately', relation: 'invented-common-goal' })
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
  deepFeatures: ['evidence-ranking', 'directness-times-reliability', 'dated-primary-source'],
  surfaceFeatures: ['folk-song-history', 'archive-document', 'source-criticism'],
  compatibleGameIds: READING_GAMES,
  solutionGraph: { steps: [
    { id: 's1', action: 'iddianın tam olarak neyi ileri sürdüğünü belirle', dependsOn: [], evidence: 'İddia, belirli bir türkünün sanılandan daha eski bir tarihte söylendiğidir.', hint: 'Kanıtlanması gereken şey türkünün güzelliği mi, yaygınlığı mı, yoksa belirli bir tarihten önce var olması mı?' },
    { id: 's2', action: 'kaynakların tarihlendirilebilirliğini ve doğrudanlığını karşılaştır', dependsOn: ['s1'], evidence: 'Tarihi ve kökeni doğrulanmış eski bir defterde sözlerle ezginin bulunması, iddiayı doğrudan geçmişe bağlar.', hint: 'Hangi kaynak hem döneme ait hem de türkünün kendisini içeriyor?' },
    { id: 's3', action: 'anı, internet yazısı ve tanıtım bilgisini birincil belgeden ayır', dependsOn: ['s2'], evidence: 'Aile anlatısı, güncel blog ve albüm tanıtımı destekleyici olabilir; ancak tarihli birincil belge kadar güçlü değildir.', hint: 'Kaynak olaya ne kadar yakın ve bağımsız biçimde doğrulanabilir?' }
  ]},
  misconceptions: [
    { id: 'anecdote-as-strongest-evidence', optionRole: 'family-memory', description: 'Aktarılan aile hatırasını tarihli belge kadar güçlü sayar.', buggyRule: 'oral-memory-over-primary-document', feedback: 'Aile anlatısı değerli olabilir ancak tarih ve içerik bakımından bağımsız doğrulaması daha zordur.' },
    { id: 'single-photo-as-proof', optionRole: 'modern-performance', description: 'Yakın tarihli icrayı eserin eski olduğuna kanıt sayar.', buggyRule: 'current-performance-proves-old-origin', feedback: 'Bugün söylenmesi, türkünün belirli bir geçmiş tarihte var olduğunu göstermez.' },
    { id: 'interested-source-as-proof', optionRole: 'album-brochure', description: 'Tanıtım amacı taşıyan kaynağın iddiasını bağımsız kanıt sayar.', buggyRule: 'marketing-copy-as-historical-proof', feedback: 'Albüm tanıtımı iddiayı yineleyebilir fakat dayandığı belgeyi göstermedikçe güçlü kanıt değildir.' },
    { id: 'topic-popularity-as-proof', optionRole: 'blog-popularity', description: 'İnternette sık yinelenen bilgiyi tarihsel doğruluk sanır.', buggyRule: 'repetition-means-truth', feedback: 'Bir bilginin çok sayıda sayfada tekrarlanması, kaynağının güvenilir olduğunu göstermez.' }
  ],
  createTask: ({ year = 1892 } = {}) => ({
    passage: `“Turnalar Geçerken” adlı türkünün bilinen ilk plak kaydı 1924 yılına aittir. Bu yüzden eser uzun süre o dönemin ürünü sayılmıştır. Bir araştırmacı ise plağın türkünün doğduğu tarihi değil, yalnız kayda geçtiği tarihi gösterdiğini; eserin daha önce de söylendiğini ileri sürüyor.`,
    prompt: 'Aşağıdakilerden hangisi araştırmacının iddiasını en güçlü biçimde destekler?',
    query: { type: 'evidence-strength' },
    surfaceProfile: { genre: 'kaynak-değerlendirme', voice: 'nesnel-sorgulayıcı', sourceMode: 'tarihsel-iddia', rhetoricalMoves: ['iddia', 'kanıt-karşılaştırma'], stemFamily: 'en-güçlü-kanıt' },
    evidenceMap: {
      claims: [{ id: 'c1' }],
      evidence: [
        { id: 'e1', supports: ['c1'], directness: 1, reliability: 0.98 },
        { id: 'e2', supports: ['c1'], directness: 0.45, reliability: 0.45 },
        { id: 'e3', supports: ['c1'], directness: 0.2, reliability: 0.7 },
        { id: 'e4', supports: ['c1'], directness: 0.3, reliability: 0.3 },
        { id: 'e5', supports: ['c1'], directness: 0.25, reliability: 0.35 }
      ]
    },
    options: [
      option('a', 'correct', `${year} tarihli olduğu kâğıt, mürekkep ve arşiv kaydıyla doğrulanan bir nota defterinde türkünün sözleriyle ezgisinin birlikte yer alması`, { claimId: 'c1', evidenceId: 'e1' }),
      option('b', 'family-memory', 'Bir ailenin büyükannesinin, türküyü kendi büyükannesinden öğrendiğini anlatması', { claimId: 'c1', evidenceId: 'e2' }),
      option('c', 'modern-performance', 'Türkünün günümüzde farklı yörelerde çok sayıda sanatçı tarafından seslendirilmesi', { claimId: 'c1', evidenceId: 'e3' }),
      option('d', 'album-brochure', 'Yeni çıkan bir albümün tanıtım yazısında türkünün “yüzyıllık bir eser” olarak nitelenmesi', { claimId: 'c1', evidenceId: 'e4' }),
      option('e', 'blog-popularity', 'Kaynak göstermeyen birçok internet sayfasında türkünün 1900 öncesine ait olduğunun yazılması', { claimId: 'c1', evidenceId: 'e5' })
    ]
  })
});

export const PHASE3C_READING_MODELS = Object.freeze([
  necessaryAssumptionModel,
  causalBoundaryModel,
  crossTextRelationModel,
  strongestEvidenceModel
]);
