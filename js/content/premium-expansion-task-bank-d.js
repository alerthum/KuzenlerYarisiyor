import { createPremiumTaskPack, definePremiumTask } from './premium-task-core.js';

const HARD = ['multiStepInference', 'conditionEvaluation', 'informationLinking'];

function ladderTask({ id, path, focus }) {
  const [start, ...rest] = path;
  const end = rest.at(-1);
  const steps = rest.slice(0, -1);
  return definePremiumTask({
    id,
    gameId: 'word-ladder',
    kind: 'wordLadder',
    familyId: `premium-ladder-${focus}`,
    skeletonId: 'premium-ladder:single-letter-path',
    reasoningPathId: 'constraint-check-then-search',
    subjectId: 'turkish',
    topicId: 'word-relations',
    learningOutcomeId: 'transform-word-by-one-letter-with-valid-intermediates',
    prompt: `“${start}” kelimesinden “${end}” kelimesine ilerle. Her adımda yalnız bir harf değişsin ve her ara biçim anlamlı bir Türkçe kelime olsun.`,
    context: `Doğrulanmış örnek yol ${path.length - 2} ara kelime içerir; aynı kuralları sağlayan farklı yollar da kabul edilir.`,
    explanation: path.join(' → '),
    hints: ['Önce başlangıç ve hedefte aynı kalan harfleri belirle.', `Doğrulanmış yol ${path.length - 2} ara basamak kullanır.`],
    cognitiveTraits: [...HARD, 'searchPlanning', 'constraintSatisfaction'],
    reasoningStepCount: Math.max(3, path.length - 1),
    evidence: [
      'Bütün kelimelerin harf sayısı aynıdır.',
      'Ardışık her iki kelime arasında tam bir harf değişir.',
      'Ara biçimlerin tamamı doğrulanmış Türkçe kelimelerdir.'
    ],
    diagnostics: [
      { id: `${id}:multiple-letter-change`, why: 'Öğrenci hedefe hızlı yaklaşmak için aynı adımda iki veya daha fazla harfi değiştirir.', detectionRule: 'adjacent-hamming-distance-must-equal-one' },
      { id: `${id}:nonword-intermediate`, why: 'Harf kuralı sağlansa bile sözlükte bulunmayan bir ara biçim kullanılır.', detectionRule: 'every-intermediate-must-exist-in-dictionary' },
      { id: `${id}:length-change`, why: 'Harf ekleme veya silme yapılarak kelime uzunluğu değiştirilir.', detectionRule: 'all-words-must-have-equal-length' }
    ],
    task: {
      start,
      end,
      steps,
      dictionary: path,
      minSteps: Math.max(1, steps.length - 1),
      maxSteps: Math.min(7, steps.length + 2),
      rubric: ['Her adım gerçek kelimedir.', 'Her adımda yalnız bir harf değişir.', 'Kelime uzunluğu korunur.', 'Hedef kelimeye ulaşılır.']
    }
  });
}

const LADDER_ITEMS = [
  ladderTask({ id: 'ladder-kasa-pasa-01', path: ['kasa', 'masa', 'maşa', 'paşa'], focus: 'consonant-shift' }),
  ladderTask({ id: 'ladder-dal-sel-01', path: ['dal', 'bal', 'bel', 'sel'], focus: 'vowel-then-consonant' }),
  ladderTask({ id: 'ladder-tas-kaz-01', path: ['taş', 'yaş', 'yaz', 'kaz'], focus: 'sound-contrast' }),
  ladderTask({ id: 'ladder-kal-sen-01', path: ['kal', 'kel', 'sel', 'sen'], focus: 'vowel-consonant-chain' }),
  ladderTask({ id: 'ladder-nar-kol-01', path: ['nar', 'kar', 'kor', 'kol'], focus: 'semantic-switch' }),
  ladderTask({ id: 'ladder-yol-sel-01', path: ['yol', 'kol', 'kel', 'sel'], focus: 'mixed-position-change' }),
  ladderTask({ id: 'ladder-dik-bal-01', path: ['dik', 'dil', 'dal', 'bal'], focus: 'final-middle-initial' }),
  ladderTask({ id: 'ladder-cam-kaz-01', path: ['cam', 'can', 'kan', 'kaz'], focus: 'terminal-transition' }),
  ladderTask({ id: 'ladder-son-tel-01', path: ['son', 'ton', 'ten', 'tel'], focus: 'initial-vowel-final' }),
  ladderTask({ id: 'ladder-gul-bal-01', path: ['gül', 'göl', 'gol', 'bol', 'bal'], focus: 'four-step-search' })
];

function orderTask({ id, sentence, translation, focus, misconceptionA, misconceptionB, misconceptionC }) {
  const answerTokens = sentence.split(' ');
  return definePremiumTask({
    id,
    gameId: 'english-sentence-builder',
    kind: 'wordOrder',
    familyId: `premium-word-order-${focus}`,
    skeletonId: 'premium-word-order:reconstruct-from-meaning',
    reasoningPathId: 'anchor-grammar-then-place-modifiers',
    subjectId: 'english',
    topicId: 'sentence-building',
    learningOutcomeId: `build-${focus}-sentence`,
    prompt: 'Karışık kelimeleri anlam ve dilbilgisi bakımından doğru İngilizce cümle olacak biçimde sırala.',
    context: `Türkçesi: ${translation}`,
    explanation: `Doğru cümle: ${sentence}. Türkçesi: ${translation}`,
    hints: [`Önce ${focus} yapısının ana parçasını bul.`, `Cümlenin ilk kelimesi “${answerTokens[0]}” olmalıdır.`],
    cognitiveTraits: [...HARD, 'syntaxPlanning', 'dependencyTracking'],
    reasoningStepCount: 3,
    evidence: [
      `Türkçe anlam, ${focus} yapısını gerektirir.`,
      'Özne, yüklem ve tamamlayıcıların İngilizce sözdizimindeki yeri belirlenir.',
      'Bağlaç, zaman ifadesi ve niteleyiciler ana cümleye doğru konumda bağlanır.'
    ],
    diagnostics: [
      { id: `${id}:clause-order`, why: misconceptionA, detectionRule: 'connector-and-dependent-clause-order' },
      { id: `${id}:verb-position`, why: misconceptionB, detectionRule: 'subject-auxiliary-main-verb-sequence' },
      { id: `${id}:modifier-position`, why: misconceptionC, detectionRule: 'time-adverb-relative-clause-placement' }
    ],
    task: {
      answerTokens,
      rubric: ['Bütün kelimeler bir kez kullanılır.', 'Özne ve yüklem sırası doğrudur.', 'Bağlaç ve zaman yapısı korunur.', 'Cümle verilen Türkçe anlamla uyumludur.']
    }
  });
}

const ORDER_ITEMS = [
  orderTask({ id:'order-although-rain-01', sentence:'Although it was raining we continued the match', translation:'Yağmur yağıyor olmasına rağmen maça devam ettik.', focus:'although concession', misconceptionA:'Although yan cümlesi ana sonuçtan sonra rastgele yerleştirilerek karşıtlık ilişkisi bozulur.', misconceptionB:'“was raining” yapısında özne ile yardımcı fiilin yeri değiştirilir.', misconceptionC:'“the match” nesnesi continued fiilinden koparılır.' }),
  orderTask({ id:'order-relative-book-01', sentence:'The book that you lent me was surprisingly useful', translation:'Bana ödünç verdiğin kitap şaşırtıcı derecede yararlıydı.', focus:'relative clause', misconceptionA:'“that you lent me” yan cümlesi nitelediği “book” isminden uzaklaştırılır.', misconceptionB:'Ana yüklem “was” yan cümlenin fiiliyle karıştırılır.', misconceptionC:'“surprisingly” zarfı nitelediği “useful” sıfatından koparılır.' }),
  orderTask({ id:'order-if-finish-01', sentence:'If you finish early you can help the other group', translation:'Erken bitirirsen diğer gruba yardım edebilirsin.', focus:'first conditional', misconceptionA:'If yan cümlesi ile sonuç cümlesinin görevleri yer değiştirilir.', misconceptionB:'If cümlesinde “can” kullanılarak koşul ve sonuç kipleri karıştırılır.', misconceptionC:'“the other group” nesne grubu parçalanır.' }),
  orderTask({ id:'order-present-perfect-since-01', sentence:'She has lived in this town since 2019', translation:'2019’dan beri bu kasabada yaşıyor.', focus:'present perfect with since', misconceptionA:'“since 2019” başlangıç zamanı yerine cümlenin öznesi gibi konumlandırılır.', misconceptionB:'“has lived” yardımcı fiil ve üçüncü hâl sırası bozulur.', misconceptionC:'“in this town” yer tamlayıcısı lived fiilinden koparılır.' }),
  orderTask({ id:'order-because-variable-01', sentence:'The experiment failed because one variable was not controlled', translation:'Bir değişken kontrol edilmediği için deney başarısız oldu.', focus:'because cause clause', misconceptionA:'Neden bildiren because cümlesi sonuçla bağ kurulmayacak yere taşınır.', misconceptionB:'“was not controlled” edilgen yapısında olumsuzluk ve yardımcı fiil sırası bozulur.', misconceptionC:'“one variable” özne grubu parçalanır.' }),
  orderTask({ id:'order-neither-nor-01', sentence:'Neither Ali nor Ece knew the correct route', translation:'Ne Ali ne de Ece doğru güzergâhı biliyordu.', focus:'neither nor coordination', misconceptionA:'Neither ve nor farklı adlarla eşleşmeyerek ikili bağlaç yapısı bozulur.', misconceptionB:'“knew” fiili özne grubunun arasına yerleştirilir.', misconceptionC:'“the correct route” isim grubu parçalanır.' }),
  orderTask({ id:'order-past-perfect-01', sentence:'By the time we arrived the museum had closed', translation:'Biz vardığımızda müze kapanmıştı.', focus:'past perfect sequence', misconceptionA:'“By the time” yan cümlesi ana cümleden bağımsız bırakılır.', misconceptionB:'Daha önce gerçekleşen kapanma için “had closed” sırası bozulur.', misconceptionC:'“the museum” öznesi arrived fiiline yanlış bağlanır.' }),
  orderTask({ id:'order-before-sharing-01', sentence:'Students should check their sources before sharing information', translation:'Öğrenciler bilgi paylaşmadan önce kaynaklarını kontrol etmelidir.', focus:'before gerund phrase', misconceptionA:'“before sharing information” zaman grubu kontrol eylemiyle yanlış sıraya sokulur.', misconceptionB:'“should check” modal ve fiil dizilişi bozulur.', misconceptionC:'“their sources” nesnesi check fiilinden koparılır.' }),
  orderTask({ id:'order-when-battery-01', sentence:'The device works efficiently when the battery is fully charged', translation:'Pil tamamen doluyken cihaz verimli çalışır.', focus:'when condition clause', misconceptionA:'When yan cümlesi ana yükleme bağlanmadan parçalanır.', misconceptionB:'“is fully charged” edilgen sıfat yapısında yardımcı fiil yanlış yere konur.', misconceptionC:'“efficiently” zarfı works fiilinden uzaklaştırılır.' }),
  orderTask({ id:'order-third-conditional-01', sentence:'I would have called you if I had known', translation:'Bilseydim seni arardım.', focus:'third conditional', misconceptionA:'If yan cümlesi ile sonuç cümlesinin yardımcı fiilleri birbirine aktarılır.', misconceptionB:'“would have called” ve “had known” fiil zincirleri kendi içinde bozulur.', misconceptionC:'“you” nesnesi called fiiline bağlanmayacak yere taşınır.' })
];

function storyTask({ id, letter, topic, focus, plan, instruction = null }) {
  return definePremiumTask({
    id,
    gameId: 'forbidden-story',
    kind: 'story',
    familyId: `premium-story-${focus}`,
    skeletonId: 'premium-story:constraint-coherent-narrative',
    reasoningPathId: 'plan-lexicon-draft-audit',
    subjectId: 'turkish',
    topicId: 'creative-writing',
    learningOutcomeId: 'write-coherent-text-under-letter-constraint',
    prompt: topic,
    context: instruction || `Kural yalnızca cevap alanına yazdığın metin için geçerlidir. Cevabında “${letter.toLocaleUpperCase('tr-TR')}” veya “${letter.toLocaleLowerCase('tr-TR')}” harfini hiç kullanma. En az 3 cümle ve 18 farklı kelime yaz.`,
    explanation: 'Başarılı metin; yasak harfi kullanmaz, olay akışını korur, en az üç cümle kurar ve yeterli kelime çeşitliliğine ulaşır.',
    hints: [`Önce “${letter.toLocaleUpperCase('tr-TR')}” harfi içermeyen kişi, yer ve eylem sözcükleri seç.`, 'Taslağı bitirdikten sonra yasak harf, cümle sayısı ve kelime çeşitliliğini ayrı ayrı denetle.'],
    cognitiveTraits: [...HARD, 'creativeConstraintPlanning', 'selfMonitoring'],
    reasoningStepCount: 4,
    evidence: [
      'Yasak harfe uygun bir sözcük havuzu önceden planlanır.',
      'Başlangıç, gelişme ve sonuç arasında neden-sonuç bağı kurulur.',
      'Metin harf, cümle ve kelime çeşitliliği ölçütlerine göre yeniden denetlenir.'
    ],
    diagnostics: [
      { id:`${id}:forbidden-letter`, why:'Öğrenci anlatı akışına odaklanırken yasak harfi içeren yaygın bir sözcüğü fark etmeden kullanabilir.', detectionRule:'case-insensitive-forbidden-letter-scan' },
      { id:`${id}:sentence-underfill`, why:'Uzun tek cümle kurmak, istenen olay gelişimini ve en az üç cümle koşulunu karşılamaz.', detectionRule:'minimum-sentence-count' },
      { id:`${id}:lexical-underfill`, why:'Aynı güvenli kelimeleri tekrar etmek harf koşulunu sağlasa bile kelime çeşitliliği hedefini karşılamaz.', detectionRule:'minimum-unique-word-count' },
      { id:`${id}:topic-drift`, why:'Yasak harften kaçınmak için konu dışı kelimeler sıralamak tutarlı hikâye oluşturmaz.', detectionRule:'topic-and-coherence-rubric' }
    ],
    task: {
      forbiddenLetter: letter,
      minSentences: 3,
      minUniqueWords: 18,
      rubric: ['Yasak harf kullanılmaz.', 'En az üç tamamlanmış cümle vardır.', 'En az 18 farklı kelime kullanılır.', 'Olaylar konuya bağlı ve tutarlı bir akış oluşturur.'],
      modelPlan: plan
    }
  });
}

const STORY_ITEMS = [
  storyTask({ id:'story-forbidden-a-01', letter:'a', focus:'rescue', topic:'Yağmurlu bir gecede kaybolan küçük bir kediyi bulan robotun kısa öyküsünü yaz.', plan:['robotun sesi duyması','iz sürmesi','kediyi güvenli yere götürmesi'] }),
  storyTask({ id:'story-forbidden-e-01', letter:'e', focus:'discovery', topic:'Eski bir gözlemevinde gizli bir yıldız haritası bulan iki arkadaşın yaşadıklarını anlat.', plan:['gözlemevine giriş','haritanın bulunması','işaretlerin çözülmesi'] }),
  storyTask({ id:'story-forbidden-i-01', letter:'i', focus:'journey', topic:'Sisli bir ormanda yönünü bulan gezginin karşılaştığı güçlüğü ve çözümünü anlat.', plan:['yolun kaybolması','doğa işaretlerinin kullanılması','güvenli çıkış'] }),
  storyTask({ id:'story-forbidden-o-01', letter:'o', focus:'invention', topic:'Okul sergisinde çalışan çevreci bir aracın nasıl geliştirildiğini anlat.', plan:['sorunun fark edilmesi','tasarımın denenmesi','sergide sunulması'] }),
  storyTask({ id:'story-forbidden-u-01', letter:'u', focus:'cooperation', topic:'Bozulan bir geçidi birlikte onaran insanların dayanışmasını anlat.', instruction:'Kural yalnızca cevap alanına yazdığın metin için geçerlidir. Cevabında “U” veya “u” harfini hiç kullanma. En az 3 cümle ve 18 farklı kelime yaz.', plan:['geçidin bozulması','görev paylaşımı','yeniden geçişin sağlanması'] }),
  storyTask({ id:'story-forbidden-r-01', letter:'r', focus:'mystery', topic:'Müzede gece duyulan gizemli sesin kaynağını araştıran çocuğun öyküsünü yaz.', plan:['sesin duyulması','ipuçlarının izlenmesi','gerçek kaynağın bulunması'] }),
  storyTask({ id:'story-forbidden-s-01', letter:'s', focus:'nature', topic:'Deniz kıyısında yaralı bir kuşa yardım eden bir ailenin öyküsünü anlat.', plan:['kuşun bulunması','güvenli bakım','doğaya bırakılması'] }),
  storyTask({ id:'story-forbidden-k-01', letter:'k', focus:'time-capsule', topic:'Bahçede eski bir zaman kutusu bulan öğrencilerin içindeki ipuçlarını çözmesini anlat.', plan:['kutunun bulunması','notların okunması','geçmişle bağ kurulması'] }),
  storyTask({ id:'story-forbidden-l-01', letter:'l', focus:'teamwork', topic:'Bilim yarışmasına hazırlanan bir ekibin başarısız ilk denemeden sonra yöntemini değiştirmesini anlat.', plan:['ilk denemenin sorunu','kanıtların incelenmesi','yeni yöntemin başarısı'] }),
  storyTask({ id:'story-forbidden-m-01', letter:'m', focus:'kindness', topic:'Yeni taşınan komşusuna yardım eden bir çocuğun mahallede başlattığı iyilik zincirini anlat.', plan:['ilk yardım','başkalarının katılması','toplulukta değişim'] })
];

export const PREMIUM_TASK_PACK_D = createPremiumTaskPack({
  version: '2.3.0',
  sourceLabel: 'Zihin Arenası Premium Görev Bankası',
  items: [...LADDER_ITEMS, ...ORDER_ITEMS, ...STORY_ITEMS]
});

export const PREMIUM_TASK_GAME_IDS_D = PREMIUM_TASK_PACK_D.gameIds;
export const generatePremiumTaskRoundsD = PREMIUM_TASK_PACK_D.generate;
export const premiumTaskInventoryD = PREMIUM_TASK_PACK_D.inventory;
