import { defineCanonicalQuestion } from './canonical-question-contract.js';
import { defineSubjectEngine } from './subject-engine-contract.js';
import { grade8TurkishOutcomeByCode } from '../curriculum/outcomes/tr-g8-turkce-2019.js';

const STYLE_REFERENCE_IDS = Object.freeze([
  'user-ozdebir-paragraph-sample',
  'user-free-chat-question-architecture'
]);

function option(id, text, {
  correct = false,
  semanticField,
  support = [],
  partialSupport = [],
  contradictions = [],
  scope = 'preserved',
  claimFit = 'full',
  misconceptionId = null,
  feedback
}) {
  return Object.freeze({
    id,
    text,
    correct,
    semanticField,
    support: Object.freeze([...support]),
    partialSupport: Object.freeze([...partialSupport]),
    contradictions: Object.freeze([...contradictions]),
    scope,
    claimFit,
    misconceptionId,
    feedback
  });
}

const CALIBRATION_SPECS = Object.freeze([
  Object.freeze({
    id: 'tr-g8-reading-calibration-01-restoration-main-idea',
    outcomeCode: 'T.8.3.17',
    construct: {
      primarySkill: 'main-idea-synthesis',
      secondarySkills: ['scope-control', 'contrast-integration'],
      cognitiveProcess: 'analysis-and-synthesis',
      knowledgeComponents: ['central-claim', 'qualification', 'detail-vs-thesis'],
      intendedDifficultyBand: 'LGS_CALIBRATION_MEDIUM_HIGH'
    },
    style: {
      genre: 'düşünsel-deneme',
      voice: 'eleştirel-birinci-çoğul',
      sourceMode: 'özgün-kültür-yazısı',
      rhetoricalMoves: ['tanımlama', 'örnekleme', 'karşıtlık', 'sonuç']
    },
    stimulus: `Bir yapıyı onarmak, onu ilk yapıldığı güne döndürmek değildir. Eski bir hanın duvarındaki eğrilik, taş ustasının hatası değil, yapının geçirdiği zamanın kaydı olabilir. Restorasyon sırasında her izi silip yüzeyi pürüzsüzleştirdiğimizde yapıyı kurtarmış görünürüz; oysa bazen tanıklığını eksiltiriz. Elbette çürüyen kirişi değiştirmek, binayı güvenli kılmak gerekir. Ama korumayı yenilemeyle karıştırırsak geçmişten kalan yapıyı değil, geçmişe benzeyen yeni bir dekor üretiriz.`,
    stem: 'Bu parçanın ana düşüncesi aşağıdakilerden hangisidir?',
    evidence: [
      { id: 'e1', sentence: 1, claim: 'Onarmak, yapıyı ilk günkü görünümüne bütünüyle döndürmek değildir.' },
      { id: 'e2', sentence: 2, claim: 'Zamanın bıraktığı bazı izler tarihsel tanıklık taşır.' },
      { id: 'e3', sentence: 4, claim: 'Yapının güvenliği için zorunlu müdahaleler yapılmalıdır.' },
      { id: 'e4', sentence: 5, claim: 'Koruma, geçmişe benzeyen yeni bir dekor üretmeye dönüşmemelidir.' }
    ],
    synthesis: { requiredEvidenceIds: ['e2', 'e3', 'e4'], singleSentenceSufficient: false },
    options: [
      option('A', 'Yapının geçirdiği zamanı gösteren izler korunmalı; güvenliği tehdit eden bölümler ise özgün görünüme uygun biçimde yenilenmelidir.', {
        semanticField: 'restoration-principle', partialSupport: ['e2'], contradictions: ['e3'], scope: 'expanded', claimFit: 'partial', misconceptionId: 'all-damage-is-heritage',
        feedback: 'Seçenek güvenlik müdahalesini kabul eder; ancak hangi izin anlamlı olduğuna yalnız “özgün görünüme uygunluk” üzerinden karar vererek parçadaki tarihsel tanıklık ölçütünü daraltır.'
      }),
      option('B', 'Restorasyon, yapının bugünkü güvenliğini sağlarken zaman içinde kazandığı tarihsel tanıklığı da koruyacak bir denge kurmalıdır.', {
        correct: true, semanticField: 'restoration-principle', support: ['e2', 'e3', 'e4'], scope: 'preserved', claimFit: 'full',
        feedback: 'Parçanın iki yönünü birlikte taşır: yapı güvenli kılınmalı, bunu yaparken zamanın bıraktığı tarihsel tanıklık yok edilmemelidir.'
      }),
      option('C', 'Tarihî yapılara sınırlı müdahale edilmesi özgünlüğü korur; bu nedenle kullanım sürse bile sonradan oluşan izlere dokunulmamalıdır.', {
        semanticField: 'restoration-principle', partialSupport: ['e1', 'e2'], contradictions: ['e3'], scope: 'shifted', claimFit: 'partial', misconceptionId: 'preservation-means-nonuse',
        feedback: 'Parça, bütün sonradan oluşmuş izlerin dokunulmaz olduğunu söylemez; güvenlik için gerekli müdahaleyi kabul eder ve yalnız anlamlı tanıklığın korunmasını ister.'
      }),
      option('D', 'Restorasyonda güvenlik gereksinimleri karşılandıktan sonra yapının ilk dönem görünümüne dönmesi, tarihsel değerini daha belirgin kılar.', {
        semanticField: 'restoration-principle', partialSupport: ['e1'], contradictions: ['e1', 'e4'], scope: 'reversed', claimFit: 'opposite', misconceptionId: 'renewal-equals-preservation',
        feedback: 'Seçenek güvenliği doğru bir ayrıntı olarak kullanır; fakat restorasyonun ölçütünü ilk dönem görünümüne dönmek sayarak parçanın karşı çıktığı yenileme anlayışına yaklaşır.'
      })
    ],
    solutionSteps: [
      { id: 's1', action: 'parçanın karşı çıktığı restorasyon anlayışını belirle', evidenceIds: ['e1', 'e4'], explanation: 'Yazar, onarımı yapıyı ilk günkü görüntüsüne döndürmek ve geçmişe benzeyen yeni bir dekor üretmek olarak görmez.', hint: 'Yazarın “onarmak değildir” ve “dekor üretiriz” sözleri hangi anlayışı reddediyor?' },
      { id: 's2', action: 'yazarın kabul ettiği zorunlu müdahaleyi ayır', evidenceIds: ['e3'], explanation: 'Güvenliği bozan unsurların değiştirilmesi korumaya aykırı sayılmaz.', hint: 'Parça, yapıya hiç dokunulmamasını mı savunuyor; yoksa bazı müdahaleleri gerekli mi görüyor?' },
      { id: 's3', action: 'koruma ile güvenliği birlikte taşıyan seçeneği bul', evidenceIds: ['e2', 'e3', 'e4'], explanation: 'Ana düşünce ancak tarihsel izlerin korunması ile güvenliğin sağlanmasını birlikte içerdiğinde tamamlanır.', hint: 'Doğru seçenek hem “tanıklığı koruma” hem de “güvenli kılma” yönlerini birlikte taşımalı.' }
    ]
  }),
  Object.freeze({
    id: 'tr-g8-reading-calibration-02-contextual-word-inference',
    outcomeCode: 'T.8.3.25',
    construct: {
      primarySkill: 'supported-inference',
      secondarySkills: ['context-clue-use', 'generalization-control'],
      cognitiveProcess: 'inference',
      knowledgeComponents: ['implicit-result', 'example-to-principle', 'scope-boundary'],
      intendedDifficultyBand: 'LGS_CALIBRATION_MEDIUM_HIGH'
    },
    style: {
      genre: 'kısa-anekdot',
      voice: 'üçüncü-tekil-anlatıcı',
      sourceMode: 'özgün-edebiyat-anlatısı',
      rhetoricalMoves: ['öneri', 'uygulama', 'okur-tepkisi']
    },
    stimulus: `Editör, romandaki “göcen” sözcüğünün çoğu okura yabancı gelebileceğini söyleyip yerine “göçebe” yazılmasını önerdi. Yazar sözcüğü değiştirmedi; ancak geçtiği sahnede obanın sökülmesini, yüklerin hayvanlara bağlanmasını ve yol hazırlığını ayrıntılandırdı. Aylar sonra bir okur, imza gününde “göcen”in anlamını sözlüğe bakmadan sezdiğini, yine de sözcüğün sesini merak edip sonradan araştırdığını anlattı.`,
    stem: 'Bu parçadan aşağıdakilerin hangisine ulaşılabilir?',
    evidence: [
      { id: 'e1', sentence: 1, claim: 'Sözcüğün okura yabancı gelebileceği düşünülmüştür.' },
      { id: 'e2', sentence: 2, claim: 'Yazar doğrudan tanım vermek yerine bağlamsal ipuçları kurmuştur.' },
      { id: 'e3', sentence: 3, claim: 'Okur anlamı bağlamdan sezmiş ve sözcüğü ayrıca merak etmiştir.' }
    ],
    synthesis: { requiredEvidenceIds: ['e1', 'e2', 'e3'], singleSentenceSufficient: false },
    options: [
      option('A', 'Yabancı sözcükler okuru araştırmaya yöneltebilir; bu nedenle anlamları bağlamdan sezilse bile metinde açıklanmadan bırakılmalıdır.', {
        semanticField: 'unfamiliar-word-use', partialSupport: ['e3'], contradictions: ['e2'], scope: 'expanded', claimFit: 'partial', misconceptionId: 'research-justifies-no-context',
        feedback: 'Seçenek okurun araştırma isteğini doğru yakalar; ancak bağlam anlamı sezdirdiği hâlde sözcüğün açıklamasız bırakılması gerektiği sonucunu gereksiz biçimde geneller.'
      }),
      option('B', 'Okurun sözcüğü önceden bilmemesi akışı güçleştirebilir; bu yüzden editörün daha yaygın karşılık önerisi anlaşılabilirliği artırır.', {
        semanticField: 'unfamiliar-word-use', partialSupport: ['e1'], contradictions: ['e2', 'e3'], scope: 'reversed', claimFit: 'opposite', misconceptionId: 'unknown-word-blocks-comprehension',
        feedback: 'Editörün kaygısı anlaşılabilir olsa da parça, sözcüğün değiştirilmeden de bağlam sayesinde anlaşılabildiğini gösterir; zorunlu değişiklik sonucu çıkarılamaz.'
      }),
      option('C', 'Sözcüğün anlamını sezdiren bağlam, okurun metinden kopmadan farklı bir söyleyişle karşılaşmasını ve onu merak etmesini sağlayabilir.', {
        correct: true, semanticField: 'unfamiliar-word-use', support: ['e1', 'e2', 'e3'], scope: 'preserved', claimFit: 'full',
        feedback: 'Yazar sözcüğü korurken çevresine anlamı sezdirecek ayrıntılar yerleştirmiş; okur da metinden kopmadan sözcüğü anlamış ve merak etmiştir.'
      }),
      option('D', 'Okurun sonradan sözlüğe bakması sözcüğün ilgi çektiğini gösterir; ancak bağlamın anlamı aktarmakta yetersiz kaldığını da düşündürür.', {
        semanticField: 'unfamiliar-word-use', partialSupport: ['e1'], contradictions: [], scope: 'shifted', claimFit: 'unsupported', misconceptionId: 'single-case-discredits-editing',
        feedback: 'Okurun sonradan araştırması bağlamın yetersiz olduğunu değil, sözcüğün merak uyandırdığını gösterir; anlamı sözlüğe bakmadan sezdiği açıkça belirtilmiştir.'
      })
    ],
    solutionSteps: [
      { id: 's1', action: 'başlangıçtaki anlama riskini belirle', evidenceIds: ['e1'], explanation: 'Editör, sözcüğün çoğu okura yabancı gelebileceğini düşünür.', hint: 'İlk cümlede hangi okuma güçlüğünden söz ediliyor?' },
      { id: 's2', action: 'yazarın bu riski nasıl azalttığını belirle', evidenceIds: ['e2'], explanation: 'Yazar sözcüğü silmek yerine çevresine anlamı sezdirecek olay ayrıntıları yerleştirir.', hint: 'Yazar sözlük tanımı vermeden anlamı hangi ayrıntılarla sezdiriyor?' },
      { id: 's3', action: 'okur tepkisiyle sonucu birleştir', evidenceIds: ['e2', 'e3'], explanation: 'Okurun hem anlaması hem merak etmesi, bağlamlı kullanımın anlaşılabilirlik ile dil zenginliğini birlikte taşıyabildiğini gösterir.', hint: 'Okur sözcük yüzünden metinden kopuyor mu, yoksa hem anlıyor hem de sözcüğe ilgi mi duyuyor?' }
    ]
  }),
  Object.freeze({
    id: 'tr-g8-reading-calibration-03-museum-label-cross-text',
    outcomeCode: 'T.8.3.23',
    construct: {
      primarySkill: 'cross-text-comparison',
      secondarySkills: ['shared-position', 'difference-in-emphasis'],
      cognitiveProcess: 'compare-and-relate',
      knowledgeComponents: ['common-claim', 'method-difference', 'false-opposition'],
      intendedDifficultyBand: 'LGS_CALIBRATION_HIGH'
    },
    style: {
      genre: 'iki-metimli-görüş',
      voice: 'karşılaştırmalı-uzman-görüşü',
      sourceMode: 'özgün-müze-tartışması',
      rhetoricalMoves: ['eleştiri', 'gerekçelendirme', 'sınırlama']
    },
    stimulusBlocks: [
      `I. Metin: Bir tablonun yanına bütün yorumları sıralarsanız ziyaretçi kendi gözünü kullanmadan etiketi okur. Müze yazısı, eserin yerine geçmemeli; bakışı açacak kadar kısa tutulmalıdır.`,
      `II. Metin: Bir nesnenin nereden geldiğini, hangi dönemde ne işe yaradığını söylemezseniz ziyaretçiye yalnız biçimini göstermiş olursunuz. Etiket gereklidir; fakat tek doğru yorumu ilan eden bir hüküm değil, sorulara açılan bir kapı olmalıdır.`
    ],
    stem: 'Bu iki metinle ilgili olarak aşağıdakilerden hangisi söylenebilir?',
    evidence: [
      { id: 'e1', sentence: 'I-1', claim: 'Aşırı açıklama ziyaretçinin bağımsız bakışını zayıflatabilir.' },
      { id: 'e2', sentence: 'I-2', claim: 'Birinci metin kısa ve yön açıcı etiket ister.' },
      { id: 'e3', sentence: 'II-1', claim: 'İkinci metin tarihsel ve işlevsel bağlamı gerekli görür.' },
      { id: 'e4', sentence: 'II-2', claim: 'İkinci metin etiketin tek yorumu dayatmaması gerektiğini savunur.' }
    ],
    synthesis: { requiredEvidenceIds: ['e1', 'e2', 'e3', 'e4'], singleSentenceSufficient: false },
    options: [
      option('A', 'Birinci metin etiketin eseri gölgelemesini, ikinci metin bağlam eksikliğini eleştirir; ikisi de etiketin yönlendirici olup yorumu belirlememesinde birleşir.', {
        correct: true, semanticField: 'museum-label-function', support: ['e1', 'e2', 'e3', 'e4'], scope: 'preserved', claimFit: 'full',
        feedback: 'Her iki metin etiketi ziyaretçinin yerine düşünen bir hükme dönüştürmez; birincisi eseri gölgelememeyi, ikincisi gerekli bağlamı verip yorumu açık tutmayı öne çıkarır.'
      }),
      option('B', 'Birinci metin etiketin gereksizliğini savunurken ikinci metin tarihsel açıklamayı zorunlu görür; bu nedenle etiketin işlevi konusunda karşıt görüştedirler.', {
        semanticField: 'museum-label-function', partialSupport: ['e1', 'e3'], contradictions: ['e2', 'e4'], scope: 'polarized', claimFit: 'opposite', misconceptionId: 'difference-becomes-total-opposition',
        feedback: 'Birinci metin etiketi kaldırmayı değil eseri gölgelemeyecek ölçüde kullanmayı, ikinci metin ise etiketi tek yorum hâline getirmemeyi savunur; tam karşıtlık yoktur.'
      }),
      option('C', 'Birinci metin kısa, ikinci metin ayrıntılı etiketleri savunur; ikisi de ziyaretçinin yorumunu etiketteki bilginin belirlemesi gerektiğini düşünür.', {
        semanticField: 'museum-label-function', partialSupport: ['e1', 'e2'], contradictions: ['e3'], scope: 'expanded', claimFit: 'partial', misconceptionId: 'first-text-applied-to-both',
        feedback: 'İkinci metin bağlam bilgisini gerekli görür; ayrıca iki metinden hiçbiri ziyaretçinin yorumunu etiketin belirlemesini istemez.'
      }),
      option('D', 'Birinci metin görsel deneyimi, ikinci metin tarihsel bilgiyi öne çıkarır; bu yüzden ziyaretçiye yorum alanı bırakma konusunda ayrılırlar.', {
        semanticField: 'museum-label-function', partialSupport: ['e2', 'e4'], contradictions: ['e3', 'e4'], scope: 'misaligned', claimFit: 'partial', misconceptionId: 'swap-common-and-different-points',
        feedback: 'Metinler vurgu bakımından farklılaşsa da ziyaretçinin kendi yorumuna alan bırakma konusunda ayrılmaz; bu, ortak noktalarıdır.'
      })
    ],
    solutionSteps: [
      { id: 's1', action: 'birinci metnin etiket anlayışını belirle', evidenceIds: ['e1', 'e2'], explanation: 'Birinci metin, ziyaretçinin bakışını bastırmayacak kısa ve yön açıcı etiket ister.', hint: 'Birinci metin etiketi kaldırıyor mu, yoksa etiketin ziyaretçinin yerine düşünmesine mi karşı çıkıyor?' },
      { id: 's2', action: 'ikinci metnin etiket anlayışını belirle', evidenceIds: ['e3', 'e4'], explanation: 'İkinci metin bağlam bilgisini gerekli görür; ama etiketin hüküm vermesini istemez.', hint: 'İkinci metin hem hangi bilgiyi gerekli görüyor hem de hangi sınırı koyuyor?' },
      { id: 's3', action: 'ortak ilke ile vurgu farkını birlikte ifade et', evidenceIds: ['e1', 'e2', 'e3', 'e4'], explanation: 'Her ikisi bağımsız yorumu korur; birincisi kısalığı, ikincisi bağlamı öne çıkarır.', hint: 'Doğru seçenek yalnız ortaklığı değil, iki metnin farklı ağırlık noktalarını da göstermeli.' }
    ]
  }),
  Object.freeze({
    id: 'tr-g8-reading-calibration-04-language-app-media-analysis',
    outcomeCode: 'T.8.3.29',
    construct: {
      primarySkill: 'media-persuasion-analysis',
      secondarySkills: ['evidence-vs-appeal', 'disclaimer-interpretation'],
      cognitiveProcess: 'critical-analysis',
      knowledgeComponents: ['anecdotal-proof', 'popularity-cue', 'generalizability'],
      intendedDifficultyBand: 'LGS_CALIBRATION_HIGH'
    },
    style: {
      genre: 'reklam-betimlemesi',
      voice: 'nesnel-medya-gözlemi',
      sourceMode: 'özgün-dijital-reklam',
      rhetoricalMoves: ['başarı-hikâyesi', 'sayıyla-ikna', 'küçük-yazı-sınırlaması']
    },
    stimulus: `Bir yabancı dil uygulamasının reklamında, konuşmaya çekinen bir öğrenci uygulamayı kullanmaya başladıktan üç hafta sonra havaalanında akıcı biçimde yol tarif ediyor. Ekranda “Her gün yalnız 10 dakika” ve “İki milyon indirme” ifadeleri beliriyor. Reklamın sonunda küçük puntolarla “Gösterilen sahne canlandırmadır, sonuçlar kullanıcıya göre değişebilir.” uyarısı yer alıyor.`,
    stem: 'Bu reklamı eleştirel biçimde değerlendiren bir öğrencinin aşağıdakilerden hangisini söylemesi en uygundur?',
    evidence: [
      { id: 'e1', sentence: 1, claim: 'Tek bir öğrencinin kısa sürede başarıya ulaştığı canlandırılmıştır.' },
      { id: 'e2', sentence: 2, claim: 'Kısa günlük süre ve yüksek indirme sayısı ikna unsuru olarak kullanılmıştır.' },
      { id: 'e3', sentence: 3, claim: 'Sahnenin canlandırma olduğu ve sonuçların değişebileceği belirtilmiştir.' }
    ],
    synthesis: { requiredEvidenceIds: ['e1', 'e2', 'e3'], singleSentenceSufficient: false },
    options: [
      option('A', 'Reklam, kısa çalışma süresiyle kolaylık ve indirme sayısıyla yaygınlık izlenimi verir; bu iki bilgi uygulamanın başarı düzeyini karşılaştırmaya yeterlidir.', {
        semanticField: 'advertising-evidence', partialSupport: ['e2'], contradictions: ['e3'], scope: 'expanded', claimFit: 'partial', misconceptionId: 'numbers-equal-effectiveness',
        feedback: 'Süre ve indirme sayısı kolaylık ve yaygınlık izlenimi verir; bunlar başarı düzeyini ölçen karşılaştırmalı sonuçlar değildir.'
      }),
      option('B', 'Reklam, canlandırılmış bir örneği ve popülerlik bilgisini etkililik göstergesi gibi sunar; verilenler konuşma becerisindeki gelişimin düzeyini belirlemeye yetmez.', {
        correct: true, semanticField: 'advertising-evidence', support: ['e1', 'e2', 'e3'], scope: 'preserved', claimFit: 'full',
        feedback: 'Canlandırılmış sahne ile indirme sayısı ikna unsuru olarak kullanılır; ancak bunlar konuşma becerisindeki gelişimin ne kadar olduğunu ölçmez.'
      }),
      option('C', 'Küçük yazı sonuçların değişebileceğini belirtir; buna karşılık reklamda gösterilen gelişimin gerçek kullanıcı verilerine dayandığını da doğrular.', {
        semanticField: 'advertising-evidence', partialSupport: ['e3'], contradictions: ['e3'], scope: 'reversed', claimFit: 'opposite', misconceptionId: 'disclaimer-as-proof',
        feedback: 'Küçük yazı gerçek kullanıcı verisini doğrulamaz; sahnenin canlandırma olduğunu ve sonuçların değişebileceğini bildirerek genelleme sınırı koyar.'
      }),
      option('D', 'Havaalanı sahnesi uygulamanın yolculuk dilinde işe yarayabileceğini düşündürür; fakat günlük on dakikanın başka konuşma durumlarına etkisini göstermez.', {
        semanticField: 'advertising-evidence', partialSupport: ['e1'], contradictions: ['e3'], scope: 'expanded', claimFit: 'partial', misconceptionId: 'single-scene-generalization',
        feedback: 'Sahne yolculuk diline ilişkin bir kullanım örneği oluşturur; ancak canlandırma olduğu için uygulamanın o alandaki gerçek etkisini bile kanıtlamaz.'
      })
    ],
    solutionSteps: [
      { id: 's1', action: 'reklamdaki başarı kanıtının türünü belirle', evidenceIds: ['e1'], explanation: 'Reklam kontrollü bir ölçüm değil, tek kişilik canlandırılmış bir başarı öyküsü sunar.', hint: 'Gösterilen başarı gerçek bir araştırma sonucu mu, yoksa bir örnek sahne mi?' },
      { id: 's2', action: 'sayısal ifadelerin neyi gösterip neyi göstermediğini ayır', evidenceIds: ['e2'], explanation: 'On dakika ve iki milyon indirme ifadeleri kolaylık ve popülerlik izlenimi verir; öğrenme başarısını ölçmez.', hint: '“İki milyon indirme” uygulamanın kullanıldığını mı, etkili olduğunu mu kanıtlar?' },
      { id: 's3', action: 'küçük yazının genelleme sınırını belirle', evidenceIds: ['e3'], explanation: 'Uyarı, sahnenin canlandırma olduğunu ve aynı sonucun herkese uygulanamayacağını belirtir.', hint: 'Son uyarı reklamın iddiasını güçlendiriyor mu, yoksa hangi sınırı kabul ediyor?' }
    ]
  }),
  Object.freeze({
    id: 'tr-g8-reading-calibration-05-blue-light-source-reliability',
    outcomeCode: 'T.8.3.31',
    construct: {
      primarySkill: 'source-reliability-evaluation',
      secondarySkills: ['population-transfer', 'outcome-transfer', 'conflict-of-interest'],
      cognitiveProcess: 'evaluate-evidence',
      knowledgeComponents: ['sample-scope', 'measured-outcome', 'independent-review'],
      intendedDifficultyBand: 'LGS_CALIBRATION_HIGH'
    },
    style: {
      genre: 'çok-kaynaklı-bilgi-notu',
      voice: 'araştırma-değerlendirme',
      sourceMode: 'özgün-kaynak-karşılaştırması',
      rhetoricalMoves: ['araştırma-özeti', 'iddia-genişletme', 'çıkar-ilişkisi', 'derleme-karşılaştırması']
    },
    stimulus: `Bir üniversitede 18-35 yaş arasındaki 60 gönüllüyle üç hafta süren bir çalışma yapılmıştır. Akşamları filtreli gözlük kullanan grup, uykuya ortalama 12 dakika daha erken daldığını bildirmiş; iki grubun toplam uyku süreleri arasında belirgin fark görülmemiştir. Filtreli gözlük satan bir kuruluş, bu çalışmayı “Çocukların gözlerini korur, okul başarısını yükseltir.” başlığıyla paylaşmıştır. Daha sonra yayımlanan ve on iki araştırmayı inceleyen bir derleme, uykuya ilişkin sonuçların birbiriyle tutarlı olmadığını; incelenen çalışmaların çocuklarda okul başarısını veya kalıcı göz hasarını ölçmediğini bildirmiştir.`,
    stem: 'Bu kaynaklardaki bilgileri karşılaştıran bir öğrencinin aşağıdaki değerlendirmelerden hangisine ulaşması en uygundur?',
    evidence: [
      { id: 'e1', sentence: 1, claim: 'İlk çalışma 18-35 yaşındaki 60 gönüllü ve üç haftayla sınırlıdır.' },
      { id: 'e2', sentence: 2, claim: 'Ölçülen bulgu öz bildirime dayalı uykuya dalma süresidir; toplam uyku değişmemiştir.' },
      { id: 'e3', sentence: 3, claim: 'Satış yapan kuruluş iddiayı çocuk, göz sağlığı ve okul başarısına genişletmiştir.' },
      { id: 'e4', sentence: 4, claim: 'Derleme sonuçların tutarsız olduğunu ve genişletilen sonuçların ölçülmediğini belirtmiştir.' }
    ],
    synthesis: { requiredEvidenceIds: ['e1', 'e2', 'e3', 'e4'], singleSentenceSufficient: false },
    options: [
      option('A', 'Çalışmanın üniversitede yürütülmesi bulguyu değerli kılar; ancak yetişkin örneklemi çocukların okul başarısıyla ilgili yorumu doğrudan desteklemez.', {
        semanticField: 'source-scope-reliability', partialSupport: ['e1'], contradictions: ['e3', 'e4'], scope: 'expanded', claimFit: 'partial', misconceptionId: 'institution-authority-overrides-scope',
        feedback: 'Seçenek örneklem sınırını kısmen fark eder; fakat göz sağlığı iddiasını ve derlemenin tutarsızlık bulgusunu değerlendirmediği için kaynakları birlikte çözümlemez.'
      }),
      option('B', 'Derlemenin sonuçları tutarsız bulması ilk çalışmayı geçersiz kılmaz; buna karşılık on iki araştırmada aynı etkinin doğrulandığını gösterir.', {
        semanticField: 'source-scope-reliability', partialSupport: ['e2', 'e4'], contradictions: [], scope: 'overcertain', claimFit: 'partial', misconceptionId: 'inconsistency-means-false',
        feedback: 'Derleme sonuçların tutarsız olduğunu söyler; aynı etkinin on iki araştırmada doğrulandığı sonucuna ulaşılamaz.'
      }),
      option('C', 'İlk bulgu yetişkinlerin uykuya dalma süresiyle sınırlıdır; kuruluşun çocuk, göz sağlığı ve başarı yorumları incelenen verilerin kapsamını aşmaktadır.', {
        correct: true, semanticField: 'source-scope-reliability', support: ['e1', 'e2', 'e3', 'e4'], scope: 'preserved', claimFit: 'full',
        feedback: 'Seçenek ilk çalışmanın örneklem ve ölçüm sınırını korur; kuruluşun çocuk, göz sağlığı ve başarı iddialarının bu sınırları aştığını doğru belirler.'
      }),
      option('D', 'Kuruluşun satış ilişkisi yorumlarına kuşkuyla yaklaşmayı gerektirir; bu nedenle üniversite çalışmasındaki uyku bulgusu da güvenilir sayılamaz.', {
        semanticField: 'source-scope-reliability', partialSupport: ['e3'], contradictions: ['e1', 'e2'], scope: 'expanded', claimFit: 'partial', misconceptionId: 'conflict-means-automatic-falsehood',
        feedback: 'Satış ilişkisi kuruluşun yorumlarına kuşkuyla yaklaşmayı gerektirir; fakat bağımsız üniversite çalışmasının bulgusunu kendiliğinden geçersiz kılmaz.'
      })
    ],
    solutionSteps: [
      { id: 's1', action: 'ilk araştırmanın örneklem ve süre sınırını belirle', evidenceIds: ['e1'], explanation: 'Araştırma yalnız 18-35 yaşındaki 60 gönüllüyü üç hafta boyunca incelemiştir.', hint: 'Araştırmaya kimler katılmış ve çalışma ne kadar sürmüş?' },
      { id: 's2', action: 'ölçülen sonuç ile sonradan ileri sürülen sonuçları ayır', evidenceIds: ['e2', 'e3'], explanation: 'Araştırma uykuya dalma süresini ölçerken paylaşım çocukların göz sağlığı ve okul başarısına geçer.', hint: 'Araştırmanın ölçtüğü değişkenle satış sayfasının iddia ettiği sonuçlar aynı mı?' },
      { id: 's3', action: 'bağımsız derlemenin kanıt sınırını kullan', evidenceIds: ['e4'], explanation: 'Derleme hem uyku sonuçlarının tutarsızlığını hem de çocuk, başarı ve kalıcı hasar sonuçlarının ölçülmediğini gösterir.', hint: 'On iki araştırmayı inceleyen kaynak, hangi iddiaların henüz ölçülmediğini söylüyor?' }
    ]
  })
]);

function canonicalInputFromSpec(spec) {
  const outcome = grade8TurkishOutcomeByCode(spec.outcomeCode);
  if (!outcome) throw new Error(`${spec.id}: unknown outcome ${spec.outcomeCode}`);
  const answer = spec.options.find(entry => entry.correct);
  return {
    id: spec.id,
    curriculum: {
      country: 'TR',
      schoolYear: outcome.schoolYear,
      programFamily: outcome.programFamily,
      grade: 8,
      courseId: outcome.courseId,
      unitId: outcome.unitId,
      topicId: outcome.topicId,
      outcomeIds: [outcome.id],
      sourceIds: [outcome.sourceId]
    },
    construct: spec.construct,
    content: {
      stimulus: spec.stimulus || null,
      stimulusBlocks: spec.stimulusBlocks || null,
      stem: spec.stem,
      options: spec.options.map(({ id, text }) => ({ id, text })),
      evidenceMap: spec.evidence,
      optionSemantics: spec.options.map(({ feedback, ...entry }) => entry),
      synthesisRequirement: spec.synthesis,
      humanReview: {
        status: 'NOT_MEASURED',
        calibrationBatch: 'GRADE8_TURKISH_PILOT_01',
        gameAdaptationAllowed: false
      }
    },
    itemFormat: 'single-choice',
    responseModel: { optionIds: spec.options.map(entry => entry.id), optionCount: 4 },
    answerKey: { optionId: answer.id, supportingEvidenceIds: answer.support },
    solutionGraph: spec.solutionSteps.map(step => ({
      id: step.id,
      action: step.action,
      dependsOn: step.id === 's1' ? [] : [spec.solutionSteps[spec.solutionSteps.indexOf(step) - 1].id],
      evidenceIds: step.evidenceIds,
      evidence: step.explanation
    })),
    hints: spec.solutionSteps.map((step, index) => ({ level: index + 1, text: step.hint, revealsAnswer: false })),
    optionFeedback: spec.options.map(entry => ({
      optionId: entry.id,
      correct: entry.correct,
      misconceptionId: entry.misconceptionId,
      text: entry.feedback,
      supportingEvidenceIds: entry.correct ? entry.support : entry.partialSupport,
      contradictionEvidenceIds: entry.contradictions
    })),
    misconceptionIds: spec.options.filter(entry => !entry.correct).map(entry => entry.misconceptionId),
    verifier: {
      solverId: 'tr-reading-semantic-score-v1',
      independentVerifierId: 'tr-reading-constraint-intersection-v1',
      verified: true
    },
    styleProfile: spec.style,
    provenance: {
      generatedFromSourceIds: [outcome.sourceId],
      styleReferenceIds: STYLE_REFERENCE_IDS
    },
    contentStatus: 'HUMAN_REVIEW_REQUIRED'
  };
}

function semanticScore(entry, requiredEvidenceIds) {
  const required = new Set(requiredEvidenceIds);
  const covered = entry.support.filter(id => required.has(id)).length;
  const penalties = entry.contradictions.length * 5
    + (entry.scope === 'preserved' ? 0 : 3)
    + (entry.claimFit === 'full' ? 0 : 3);
  return covered * 3 - penalties;
}

function solveBySemanticScore(item) {
  const semantics = item.content.optionSemantics;
  const required = item.content.synthesisRequirement.requiredEvidenceIds;
  const ranked = semantics
    .map(entry => ({ id: entry.id, score: semanticScore(entry, required) }))
    .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id));
  if (ranked.length < 2 || ranked[0].score === ranked[1].score) throw new Error(`${item.id}: solver ambiguity`);
  return Object.freeze({ optionId: ranked[0].id, score: ranked[0].score });
}

function verifyByConstraintIntersection(item, solved) {
  const required = new Set(item.content.synthesisRequirement.requiredEvidenceIds);
  const accepted = item.content.optionSemantics.filter(entry =>
    entry.claimFit === 'full'
    && entry.scope === 'preserved'
    && entry.contradictions.length === 0
    && required.size >= 2
    && [...required].every(id => entry.support.includes(id))
  );
  return accepted.length === 1
    && accepted[0].id === solved.optionId
    && solved.optionId === item.answerKey.optionId;
}

function normalize(value) {
  return String(value ?? '')
    .toLocaleLowerCase('tr-TR')
    .replace(/[^a-zçğıöşü0-9\s]/giu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function wordCount(value) {
  return normalize(value).split(' ').filter(Boolean).length;
}

const QUALIFICATION_MARKERS = Object.freeze([
  'ancak', 'fakat', 'buna karşılık', 'oysa', 'ne var ki', 'ise', 'bununla birlikte'
]);

const LIMITATION_MARKERS = Object.freeze([
  'yeterli değildir', 'yetmez', 'kanıtlamaz', 'göstermez', 'desteklemez',
  'sınırlıdır', 'aşmaktadır', 'değişebilir', 'doğrulamaz', 'sayılmaz',
  'gerektirmez', 'kılmaz', 'yetersiz', 'tek başına'
]);

const CERTAINTY_MARKERS = Object.freeze([
  'kesinlikle', 'mutlaka', 'her zaman', 'bütün', 'tümü', 'asla',
  'tek geçerli', 'otomatik olarak', 'doğrudan ve genellenebilir'
]);

function markerCount(value, markers) {
  const text = ` ${normalize(value)} `;
  return markers.reduce((count, marker) => count + (text.includes(` ${normalize(marker)} `) ? 1 : 0), 0);
}

function rhetoricalProfile(value) {
  const text = String(value ?? '');
  const qualifierCount = markerCount(text, QUALIFICATION_MARKERS);
  const limitationCount = markerCount(text, LIMITATION_MARKERS);
  const certaintyCount = markerCount(text, CERTAINTY_MARKERS);
  const semicolonCount = (text.match(/;/g) || []).length;
  return Object.freeze({
    wordCount: wordCount(text),
    qualifierCount,
    limitationCount,
    certaintyCount,
    semicolonCount,
    clauseComplexity: 1 + qualifierCount + semicolonCount
  });
}

function auditOptionOnlyCueRisk(options, answerOptionId) {
  const profiles = options.map(entry => ({ id: entry.id, ...rhetoricalProfile(entry.text) }));
  const correct = profiles.find(entry => entry.id === answerOptionId);
  const distractors = profiles.filter(entry => entry.id !== answerOptionId);
  if (!correct || distractors.length === 0) {
    return Object.freeze({ risk: 1, reasons: Object.freeze(['missing-option-profile']), profiles: Object.freeze(profiles) });
  }

  const reasons = [];
  const maxQualifier = Math.max(...distractors.map(entry => entry.qualifierCount));
  const maxLimitation = Math.max(...distractors.map(entry => entry.limitationCount));
  const minCertainty = Math.min(...distractors.map(entry => entry.certaintyCount));
  const maxComplexity = Math.max(...distractors.map(entry => entry.clauseComplexity));
  const distractorBalancedCount = distractors.filter(entry => entry.qualifierCount > 0 && entry.limitationCount > 0).length;

  if (correct.qualifierCount > maxQualifier) reasons.push('correct-uniquely-qualified');
  if (correct.limitationCount > 0 && maxLimitation === 0) reasons.push('correct-uniquely-limited');
  if (correct.certaintyCount < minCertainty) reasons.push('correct-uniquely-cautious');
  if (correct.clauseComplexity > maxComplexity + 1) reasons.push('correct-uniquely-complex');
  if (correct.qualifierCount > 0 && correct.limitationCount > 0 && distractorBalancedCount === 0) reasons.push('correct-only-balanced-claim');

  return Object.freeze({
    risk: Number((reasons.length / 5).toFixed(3)),
    reasons: Object.freeze(reasons),
    profiles: Object.freeze(profiles)
  });
}

function sentenceOverlap(stimulus, answerText) {
  const answerWords = new Set(normalize(answerText).split(' ').filter(word => word.length > 3));
  const sentences = String(stimulus).split(/[.!?]+/).map(normalize).filter(Boolean);
  let max = 0;
  for (const sentence of sentences) {
    const sentenceWords = new Set(sentence.split(' ').filter(word => word.length > 3));
    if (!answerWords.size) continue;
    let shared = 0;
    for (const word of answerWords) if (sentenceWords.has(word)) shared += 1;
    max = Math.max(max, shared / answerWords.size);
  }
  return max;
}

export function auditGrade8TurkishCalibrationQuestion(item) {
  const errors = [];
  const semantics = item.content.optionSemantics || [];
  const options = item.content.options || [];
  const answer = options.find(entry => entry.id === item.answerKey.optionId);
  const required = item.content.synthesisRequirement?.requiredEvidenceIds || [];
  const correct = semantics.filter(entry => entry.correct);
  const partialDistractors = semantics.filter(entry => !entry.correct && entry.partialSupport.length > 0);
  const semanticFields = new Set(semantics.map(entry => entry.semanticField));
  const lengths = options.map(entry => wordCount(entry.text));
  const sortedLengths = [...lengths].sort((a, b) => a - b);
  const median = (sortedLengths[1] + sortedLengths[2]) / 2;
  const fullStimulus = item.content.stimulus || (item.content.stimulusBlocks || []).join(' ');
  const optionOnlyCueAudit = auditOptionOnlyCueRisk(options, item.answerKey.optionId);

  if (options.length !== 4) errors.push('four-options-required');
  if (correct.length !== 1) errors.push('unique-correct-option-required');
  if (required.length < 2) errors.push('multi-evidence-synthesis-required');
  if (item.content.synthesisRequirement?.singleSentenceSufficient !== false) errors.push('single-sentence-giveaway-not-blocked');
  if (partialDistractors.length < 2) errors.push('at-least-two-partially-supported-distractors-required');
  if (semanticFields.size !== 1) errors.push('options-must-share-semantic-field');
  if (item.hints.length < 3) errors.push('three-progressive-hints-required');
  if (item.optionFeedback.length !== options.length) errors.push('all-options-need-feedback');
  if (item.content.humanReview?.gameAdaptationAllowed !== false) errors.push('game-adaptation-must-remain-locked');
  if (item.contentStatus !== 'HUMAN_REVIEW_REQUIRED') errors.push('human-review-status-required');
  if (sentenceOverlap(fullStimulus, answer?.text || '') > 0.72) errors.push('answer-too-close-to-single-sentence');
  if (lengths.some(length => length < median * 0.55 || length > median * 1.65)) errors.push('option-length-cue');
  if (optionOnlyCueAudit.risk > 0) errors.push('option-only-rhetorical-giveaway');
  try {
    if (!verifyByConstraintIntersection(item, solveBySemanticScore(item))) errors.push('independent-verification-failed');
  } catch {
    errors.push('independent-verification-failed');
  }

  return Object.freeze({
    ok: errors.length === 0,
    errors: Object.freeze(errors),
    metrics: Object.freeze({
      requiredEvidenceCount: required.length,
      partialDistractorCount: partialDistractors.length,
      semanticFieldCount: semanticFields.size,
      maxSingleSentenceAnswerOverlap: Number(sentenceOverlap(fullStimulus, answer?.text || '').toFixed(3)),
      optionWordCounts: Object.freeze(lengths),
      blindOptionCueRisk: optionOnlyCueAudit.risk,
      blindOptionCueReasons: optionOnlyCueAudit.reasons,
      optionRhetoricalProfiles: optionOnlyCueAudit.profiles
    })
  });
}

export function grade8TurkishCalibrationQuestionById(id) {
  const spec = CALIBRATION_SPECS.find(entry => entry.id === id);
  return spec ? defineCanonicalQuestion(canonicalInputFromSpec(spec)) : null;
}

export function buildGrade8TurkishCalibrationQuestions() {
  return Object.freeze(CALIBRATION_SPECS.map(spec => defineCanonicalQuestion(canonicalInputFromSpec(spec))));
}

export function auditGrade8TurkishCalibrationCatalog(items = buildGrade8TurkishCalibrationQuestions()) {
  const itemAudits = items.map(item => ({ id: item.id, ...auditGrade8TurkishCalibrationQuestion(item) }));
  const errors = itemAudits.flatMap(row => row.errors.map(error => `${row.id}:${error}`));
  const outcomeCount = new Set(items.flatMap(item => item.curriculum.outcomeIds)).size;
  const genreCount = new Set(items.map(item => item.styleProfile.genre)).size;
  const sourceModeCount = new Set(items.map(item => item.styleProfile.sourceMode)).size;
  const answerPositions = items.map(item => item.answerKey.optionId);
  if (outcomeCount !== items.length) errors.push(`catalog:outcome-diversity:${outcomeCount}`);
  if (genreCount !== items.length) errors.push(`catalog:genre-diversity:${genreCount}`);
  if (sourceModeCount !== items.length) errors.push(`catalog:source-mode-diversity:${sourceModeCount}`);
  if (new Set(answerPositions).size < 3) errors.push(`catalog:answer-position-diversity:${new Set(answerPositions).size}`);
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
      productReady: false
    }),
    itemAudits: Object.freeze(itemAudits)
  });
}

export const grade8TurkishCalibrationEngine = defineSubjectEngine({
  id: 'tr-g8-turkish-reading-calibration-engine-v1',
  domain: 'reading-turkish',
  supportedCourseIds: ['turkce'],
  supportedItemFormats: ['single-choice'],
  misconceptionCatalogId: 'tr-g8-reading-calibration-misconceptions-v1',
  styleCatalogId: 'tr-g8-reading-calibration-styles-v1',
  plan: request => {
    const spec = CALIBRATION_SPECS.find(entry => entry.id === request.questionId);
    if (!spec) throw new Error(`unknown calibration question ${request.questionId}`);
    return Object.freeze({ questionId: spec.id, outcomeCode: spec.outcomeCode, curriculumRoute: request.curriculumRoute });
  },
  generate: plan => canonicalInputFromSpec(CALIBRATION_SPECS.find(entry => entry.id === plan.questionId)),
  solve: solveBySemanticScore,
  verifyIndependent: verifyByConstraintIntersection,
  explain: item => item.solutionGraph,
  qualityAudit: auditGrade8TurkishCalibrationQuestion
});

export const GRADE8_TURKISH_CALIBRATION_IDS = Object.freeze(CALIBRATION_SPECS.map(entry => entry.id));
