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
  surfaceFeatures: ['city-name', 'temperature-values', 'tree-species'],
  compatibleGameIds: READING_GAMES,
  solutionGraph: { steps: [
    { id: 's1', action: 'tekrarlanan merkezî iddiaları belirle', dependsOn: [], evidence: 'Metin hem ağaç gölgesinin yüzey sıcaklığını azalttığını hem de ağaçlandırmanın yerel koşullara göre planlanması gerektiğini vurgular.', hint: 'Paragrafın birden fazla cümlesinde sürdürülen iki temel düşünceyi işaretle.' },
    { id: 's2', action: 'ayrıntıları merkezî iddialardan ayır', dependsOn: ['s1'], evidence: 'Ölçüm saati ve sıcaklık farkı ana düşünceyi destekleyen ayrıntılardır; tek başlarına paragrafın amacı değildir.', hint: 'Sayılar ve ölçüm ayrıntıları çıkarıldığında geriye kalan ortak mesajı düşün.' },
    { id: 's3', action: 'iki merkezî iddiayı kapsamı aşmadan birleştir', dependsOn: ['s2'], evidence: 'Doğru ana düşünce, gölgenin yararını kabul ederken her yere aynı uygulamayı önermek yerine su ve toprak koşullarına uygun planlamayı da içerir.', hint: 'Seçenek hem yararı hem de planlama koşulunu birlikte taşıyor mu?' }
  ]},
  misconceptions: [
    { id: 'detail-as-main-idea', optionRole: 'detail-as-main', description: 'Destekleyici bir ölçüm ayrıntısını paragrafın ana düşüncesi sanır.', buggyRule: 'select-most-concrete-detail', feedback: 'Ana düşünce tek bir sayıdan daha geniştir; metnin bütün merkezî iddialarını kapsamalıdır.' },
    { id: 'overgeneralized-main-idea', optionRole: 'overgeneralized', description: 'Yerel koşul sınırlamasını kaldırıp öneriyi her yere geneller.', buggyRule: 'drop-planning-limitation', feedback: 'Metin ağaçlandırmayı desteklerken su ve toprak koşullarına göre planlama sınırı koyar.' },
    { id: 'one-sided-summary', optionRole: 'one-sided', description: 'Metnin yalnız planlama yönünü alıp gölge-sıcaklık bulgusunu dışarıda bırakır.', buggyRule: 'cover-only-second-central-claim', feedback: 'Ana düşünce iki merkezî hattı birlikte kapsamalıdır; yalnız birini özetlemek eksik kalır.' }
  ],
  createTask: ({ city = 'Güneydere', difference = 7 } = {}) => ({
    passage: `${city} Belediyesi, aynı sokakta gölge altında ve doğrudan güneş alan kaldırımları öğle saatlerinde ölçtü. Ağaçların gölgelediği yüzeyler ortalama ${difference} derece daha serindi. Uzmanlar bu farkın sıcak günlerde yaya konforunu artırabileceğini, ancak yeni ağaçlandırmada su gereksinimi ve toprak yapısının birlikte değerlendirilmesi gerektiğini belirtti.`,
    prompt: 'Bu parçanın ana düşüncesi aşağıdakilerden hangisidir?',
    query: { type: 'main-idea' },
    evidenceMap: {
      claims: [
        { id: 'c1', centrality: 'central' },
        { id: 'c2', centrality: 'central' },
        { id: 'c3', centrality: 'detail' }
      ]
    },
    options: [
      option('a', 'correct', 'Ağaç gölgesi sıcak yüzeyleri serinletebilir; ancak ağaçlandırma yerel su ve toprak koşullarına göre planlanmalıdır.', { focus: 'central', covers: ['c1', 'c2'], addsUnsupported: false, detailOnly: false }),
      option('b', 'detail-as-main', `Gölgedeki kaldırımlar öğle ölçümünde ortalama ${difference} derece daha serin çıkmıştır.`, { focus: 'detail', covers: ['c3'], addsUnsupported: false, detailOnly: true }),
      option('c', 'overgeneralized', 'Bütün kentlerdeki her sokağa mümkün olduğunca çok ağaç dikilmelidir.', { focus: 'central', covers: ['c1', 'c2'], addsUnsupported: true, detailOnly: false }),
      option('d', 'one-sided', 'Ağaçlandırma çalışmalarında yalnız su gereksinimi ve toprak yapısı dikkate alınmalıdır.', { focus: 'central', covers: ['c2'], addsUnsupported: false, detailOnly: false })
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
  surfaceFeatures: ['library-name', 'duration', 'visitor-count'],
  compatibleGameIds: READING_GAMES,
  solutionGraph: { steps: [
    { id: 's1', action: 'doğrudan gözlem ile yorumu ayır', dependsOn: [], evidence: 'Akşam ziyaretlerinin arttığı doğrudan kayıttır; bunun öğrenciler için yararlı olduğu anket yanıtlarıyla sınırlı bir yorumdur.', hint: 'Metinde sayılan gözlem ve katılımcıların yorumu aynı tür bilgi değildir.' },
    { id: 's2', action: 'çıkarımın kesinlik derecesini sınırla', dependsOn: ['s1'], evidence: 'Not başarısı ölçülmediği için uzatılmış saatlerin başarıyı kesin artırdığı söylenemez.', hint: 'Metinde ölçülmeyen sonuç hakkında kesin hüküm veren seçenekleri ele.' },
    { id: 's3', action: 'çıkarımı örneklem ve zaman kapsamı içinde tut', dependsOn: ['s2'], evidence: 'Sonuç yalnız belirtilen kütüphane, sınav ayı ve ankete katılan bazı öğrenciler için desteklenir.', hint: 'Seçenek başka okulları, bütün öğrencileri veya kalıcı sonuçları kapsıyor mu?' }
  ]},
  misconceptions: [
    { id: 'association-to-certain-success', optionRole: 'causation', description: 'Kullanım artışını akademik başarıda kesin artış olarak yorumlar.', buggyRule: 'upgrade-observed-use-to-certain-outcome', feedback: 'Metin ziyaret sayısını ve anket görüşünü verir; not başarısını ölçmez.' },
    { id: 'reject-observed-association', optionRole: 'denial', description: 'Kesin başarı kanıtı olmadığı için gözlenen kullanım ilişkisini de reddeder.', buggyRule: 'no-grade-data-means-no-benefit', feedback: 'Not verisi yoktur fakat akşam kullanımındaki artış ve bazı öğrencilerin görüşü metinde açıkça vardır.' },
    { id: 'expand-to-all-libraries', optionRole: 'overgeneralized', description: 'Tek kütüphanedeki sınırlı gözlemi bütün kütüphanelere yayar.', buggyRule: 'generalize-beyond-location-and-time', feedback: 'Çıkarım metindeki yer, zaman ve örneklem sınırları içinde kalmalıdır.' }
  ],
  createTask: ({ library = 'Kavaklı Halk Kütüphanesi', weeks = 4 } = {}) => {
    const supported = proposition({ subject: 'extended-hours', predicate: 'may-support', object: 'evening-study-use', relation: 'association', modality: 'possible', quantifier: 'some', scope: [library, 'exam-month'] });
    return {
      passage: `${library}, sınav ayı boyunca kapanış saatini ${weeks} hafta süreyle iki saat ileri aldı. Bu dönemde akşam girişleri önceki aya göre arttı. Ankete katılan bazı öğrenciler sessiz çalışma olanağı nedeniyle daha sık geldiklerini söyledi; öğrencilerin sınav notları ise araştırılmadı.`,
      prompt: 'Bu parçadan aşağıdakilerden hangisi çıkarılabilir?',
      query: { type: 'supported-inference' },
      evidenceMap: { claims: [{ id: 'c1', centrality: 'central', proposition: supported }] },
      options: [
        option('a', 'correct', 'Uzatılan saatler, bu kütüphanede sınav ayındaki akşam çalışma kullanımını bazı öğrenciler için desteklemiş olabilir.', { claimId: 'c1', proposition: supported }),
        option('b', 'causation', 'Kapanış saatinin uzatılması öğrencilerin sınav başarısını kesin olarak yükseltmiştir.', { claimId: 'c1', proposition: proposition({ ...supported, predicate: 'raises', object: 'exam-success', relation: 'cause', modality: 'certain', quantifier: 'all' }) }),
        option('c', 'denial', 'Saatlerin uzatılmasının öğrencilerin kütüphane kullanımına hiçbir etkisi olmamıştır.', { claimId: 'c1', proposition: proposition({ ...supported, polarity: 'negative', modality: 'certain' }) }),
        option('d', 'overgeneralized', 'Kapanış saatini uzatan bütün kütüphanelerde tüm öğrencilerin akşam kullanımı artar.', { claimId: 'c1', proposition: proposition({ ...supported, modality: 'certain', quantifier: 'all', scope: ['all-libraries', 'all-times'] }) })
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
  surfaceFeatures: ['wetland-name', 'bird-count', 'food-density'],
  compatibleGameIds: READING_GAMES,
  solutionGraph: { steps: [
    { id: 's1', action: 'seçenekteki iddiayı açık biçimde belirle', dependsOn: [], evidence: 'İddia, sulak alanın göç sırasında önemli bir durak işlevi gördüğüdür.', hint: 'Önce kanıtlanması istenen yargıyı tek cümleye indir.' },
    { id: 's2', action: 'her ayrıntının iddiayla doğrudan ilişkisini denetle', dependsOn: ['s1'], evidence: 'İşaretli kuşların çoğunun alanda durması ve besin yoğunluğunun yüksek olması durak işlevini doğrudan destekler.', hint: 'Hangi veri kuşların orayı gerçekten kullandığını ve neden kullanabileceğini gösteriyor?' },
    { id: 's3', action: 'yalnız gerçek destek bağlantısı olan çifti seç', dependsOn: ['s2'], evidence: 'Alan adının geçmişi veya gözlem kulübesinin yapım yılı, göç durağı iddiasını kanıtlamaz.', hint: 'Kanıt çıkarıldığında iddia zayıflıyor mu? Zayıflamıyorsa o ayrıntı doğrudan kanıt değildir.' }
  ]},
  misconceptions: [
    { id: 'topic-overlap-as-evidence', optionRole: 'topic-overlap', description: 'Aynı konuya ait her ayrıntıyı iddianın kanıtı sayar.', buggyRule: 'same-topic-means-support', feedback: 'Bir ayrıntının kuşlarla ilgili olması yetmez; belirli iddiayı doğrudan desteklemesi gerekir.' },
    { id: 'historical-detail-as-proof', optionRole: 'historical-detail', description: 'İlgi çekici tarihsel bilgiyi biyolojik işlevin kanıtı sanır.', buggyRule: 'salient-detail-means-evidence', feedback: 'Adın ne zaman verildiği, alanın göç durağı olarak kullanıldığını göstermez.' },
    { id: 'reverse-support-link', optionRole: 'reverse-link', description: 'Başka bir iddiayı destekleyen veriyi hedef iddiaya bağlar.', buggyRule: 'attach-evidence-to-wrong-claim', feedback: 'Kanıt ile iddia arasındaki ilişki özel olmalıdır; her veri her iddiayı desteklemez.' }
  ],
  createTask: ({ wetland = 'Akgöl', tracked = 10, stopped = 8 } = {}) => ({
    passage: `Araştırmacılar göç döneminde verici takılan ${tracked} saz bülbülünü izledi; izlenen kuşlardan ${stopped} tanesi ${wetland}'de en az bir gece durdu. Aynı tarihlerde yapılan örneklemelerde alandaki böcek yoğunluğu çevredeki kuru bölgelere göre daha yüksekti. Sulak alanın bugünkü adı 1960'larda verilmiş, gözlem kulübesi ise geçen yıl yenilenmiştir.`,
    prompt: 'Aşağıdaki iddia–kanıt eşleştirmelerinden hangisi doğrudur?',
    query: { type: 'claim-evidence' },
    evidenceMap: {
      claims: [
        { id: 'c1', text: `${wetland} göç sırasında önemli bir beslenme ve dinlenme durağıdır.` },
        { id: 'c2', text: 'Gözlem altyapısı yakın zamanda yenilenmiştir.' }
      ],
      evidence: [
        { id: 'e1', supports: ['c1'], directness: 1, reliability: 0.9 },
        { id: 'e2', supports: ['c2'], directness: 1, reliability: 1 },
        { id: 'e3', supports: [], directness: 0, reliability: 1 }
      ]
    },
    options: [
      option('a', 'correct', `İddia: ${wetland} önemli bir göç durağıdır. Kanıt: İzlenen kuşlardan ${stopped} tanesi burada durmuş ve bölgede besin yoğunluğu yüksek bulunmuştur.`, { claimId: 'c1', evidenceId: 'e1' }),
      option('b', 'topic-overlap', `İddia: ${wetland} önemli bir göç durağıdır. Kanıt: Bölgede bir kuş gözlem kulübesi vardır.`, { claimId: 'c1', evidenceId: 'e2' }),
      option('c', 'historical-detail', `İddia: ${wetland} önemli bir göç durağıdır. Kanıt: Sulak alanın bugünkü adı 1960'larda verilmiştir.`, { claimId: 'c1', evidenceId: 'e3' }),
      option('d', 'reverse-link', 'İddia: Gözlem altyapısı yakın zamanda yenilenmiştir. Kanıt: İşaretli kuşların çoğu sulak alanda en az bir gece durmuştur.', { claimId: 'c2', evidenceId: 'e1' })
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
  surfaceFeatures: ['school-name', 'sample-size', 'retention-period'],
  compatibleGameIds: READING_GAMES,
  solutionGraph: { steps: [
    { id: 's1', action: 'araştırmanın örneklem ve süre sınırlarını çıkar', dependsOn: [], evidence: 'Çalışma tek okulda 120 dokuzuncu sınıf öğrencisiyle ve iki haftalık hatırlama ölçümüyle sınırlıdır.', hint: 'Kimler, nerede ve ne kadar süreyle incelenmiş?' },
    { id: 's2', action: 'bulgunun kesinlik ve neden sınırını belirle', dependsOn: ['s1'], evidence: 'Aralıklı tekrar grubunun daha çok hatırlaması bu örneklem için güçlü bir bulgudur; bütün öğrenciler ve kalıcı etki için yeterli değildir.', hint: '“Her zaman”, “bütün öğrenciler” ve “tek neden” ifadelerini özellikle denetle.' },
    { id: 's3', action: 'örneklemi aşmayan seçeneği doğrula', dependsOn: ['s2'], evidence: 'Doğru yorum yalnız incelenen okulun dokuzuncu sınıfları ve iki haftalık dönem için olasılıklı bir sonuç bildirir.', hint: 'Seçenekteki kişi grubu ve zaman aralığı metindekinden daha geniş mi?' }
  ]},
  misconceptions: [
    { id: 'universalize-single-school', optionRole: 'universal', description: 'Tek okul örneklemini bütün öğrencilere geneller.', buggyRule: 'replace-some-with-all', feedback: 'Tek okul ve tek sınıf düzeyinden bütün öğrenciler için evrensel sonuç çıkarılamaz.' },
    { id: 'temporary-to-permanent', optionRole: 'permanent', description: 'İki haftalık hatırlama sonucunu kalıcı öğrenme olarak yorumlar.', buggyRule: 'extend-time-scope-indefinitely', feedback: 'Çalışma yalnız iki hafta sonraki hatırlamayı ölçmüştür; kalıcı etki ölçülmemiştir.' },
    { id: 'single-cause-certainty', optionRole: 'sole-cause', description: 'Grup farkını yalnız çalışma yönteminin kesin sonucu sayar.', buggyRule: 'upgrade-study-result-to-sole-cause', feedback: 'Araştırma bulgusu yöntemin etkili olabileceğini destekler; bütün diğer etkenlerin dışlandığını göstermez.' }
  ],
  createTask: ({ school = 'Yelken Anadolu Lisesi', sample = 120, weeks = 2 } = {}) => {
    const supported = proposition({ subject: 'spaced-review', predicate: 'may-improve', object: 'retention', relation: 'association', modality: 'probable', quantifier: 'some', scope: [school, 'grade-9', `${weeks}-weeks`] });
    return {
      passage: `${school}'nde ${sample} dokuzuncu sınıf öğrencisi iki gruba ayrıldı. Aynı konuyu çalışan gruplardan biri tekrarları günlere yaydı, diğeri tek oturumda tamamladı. ${weeks} hafta sonraki ölçümde aralıklı tekrar yapan grup ortalama olarak daha çok bilgiyi hatırladı. Çalışma başka okul veya sınıf düzeylerinde tekrarlanmadı.`,
      prompt: 'Araştırmanın kapsamına en uygun yorum hangisidir?',
      query: { type: 'scope-control' },
      evidenceMap: { claims: [{ id: 'c1', centrality: 'central', proposition: supported }] },
      options: [
        option('a', 'correct', `Aralıklı tekrar, bu okuldaki dokuzuncu sınıf öğrencilerinin ${weeks} hafta sonraki hatırlamasını artırmış olabilir.`, { claimId: 'c1', proposition: supported }),
        option('b', 'universal', 'Aralıklı tekrar bütün öğrencilerde öğrenmeyi kesin olarak artırır.', { claimId: 'c1', proposition: proposition({ ...supported, modality: 'certain', quantifier: 'all', scope: ['all-schools', 'all-grades'] }) }),
        option('c', 'permanent', 'Aralıklı tekrar yapan öğrenciler öğrendiklerini yaşamları boyunca unutmaz.', { claimId: 'c1', proposition: proposition({ ...supported, predicate: 'prevents', object: 'all-forgetting', modality: 'certain', quantifier: 'all', scope: ['lifetime'] }) }),
        option('d', 'sole-cause', 'Gruplar arasındaki farkın tek nedeni tekrarların günlere yayılmasıdır.', { claimId: 'c1', proposition: proposition({ ...supported, relation: 'cause', modality: 'certain', causeId: 'spaced-review-only' }) })
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
