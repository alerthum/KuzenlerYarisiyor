import { createPremiumTaskPack, definePremiumTask } from './premium-task-core.js';

const TRAITS = ['multiStepInference', 'conditionEvaluation', 'informationLinking', 'constraintTracking'];

function ladderTask({ id, path, focus }) {
  const [start, ...rest] = path;
  const end = rest.at(-1);
  const steps = rest.slice(0, -1);
  return definePremiumTask({
    id,
    gameId: 'word-ladder',
    kind: 'wordLadder',
    familyId: `g35-ladder-${focus}`,
    skeletonId: `g35-ladder-${focus}:verified-single-letter-path`,
    reasoningPathId: 'compare-positions-plan-path-verify',
    subjectId: 'turkish',
    topicId: 'word-relations',
    learningOutcomeId: 'transform-word-with-one-letter-valid-steps',
    gradeBand: '3-5',
    difficulty: 4,
    prompt: `“${start}” kelimesinden “${end}” kelimesine ulaş. Her basamakta yalnız bir harf değiştir ve her ara basamakta anlamlı bir Türkçe kelime oluştur.`,
    context: `Doğrulanmış çözüm yolu ${steps.length} ara basamak içerir. Kelime uzunluğu bütün yol boyunca korunmalıdır.`,
    explanation: `Doğrulanmış yol: ${path.join(' → ')}. Ardışık her iki kelime arasında tam bir harf değişir.`,
    hints: ['Başlangıç ve hedefte aynı kalan harfleri işaretle.', 'Her yeni kelimeyi hem sözlük anlamı hem tek harf kuralı açısından denetle.'],
    cognitiveTraits: [...TRAITS, 'searchPlanning'],
    reasoningStepCount: Math.max(3, path.length - 1),
    evidence: [
      'Başlangıç ve hedef kelimelerin harf sayısı aynıdır.',
      'Ardışık her kelime çifti arasında tam bir konum değişir.',
      'Bütün ara biçimler anlamlı ve doğrulanmış Türkçe kelimelerdir.'
    ],
    diagnostics: [
      { id: `${id}:multi-change`, why: 'Öğrenci hedefe hızlı yaklaşmak için aynı adımda birden fazla harfi değiştirir.', detectionRule: 'adjacent-hamming-distance-equals-one' },
      { id: `${id}:nonword`, why: 'Tek harf kuralı sağlansa bile anlamlı olmayan bir harf dizisi ara basamak yapılır.', detectionRule: 'every-step-in-verified-dictionary' },
      { id: `${id}:length`, why: 'Öğrenci harf ekleyerek veya silerek kelime uzunluğunu değiştirir.', detectionRule: 'constant-codepoint-length' }
    ],
    task: {
      start,
      end,
      steps,
      dictionary: path,
      minSteps: Math.max(1, steps.length - 1),
      maxSteps: steps.length + 2,
      rubric: ['Her basamak anlamlı kelimedir.', 'Her adımda yalnız bir harf değişir.', 'Kelime uzunluğu korunur.', 'Hedef kelimeye ulaşılır.']
    }
  });
}

const LADDER_ITEMS = [
  ladderTask({ id:'g35-ladder-kar-ses-01', path:['kar','kas','kes','ses'], focus:'initial-middle-final' }),
  ladderTask({ id:'g35-ladder-fil-diz-01', path:['fil','fiş','diş','diz'], focus:'terminal-initial-terminal' }),
  ladderTask({ id:'g35-ladder-can-tas-01', path:['can','cam','tam','tas'], focus:'final-initial-final' }),
  ladderTask({ id:'g35-ladder-para-kere-01', path:['para','kara','kare','kere'], focus:'four-letter-position-shift' }),
  ladderTask({ id:'g35-ladder-kedi-geri-01', path:['kedi','dedi','deri','geri'], focus:'four-letter-consonant-shift' }),
  ladderTask({ id:'g35-ladder-kafa-masa-01', path:['kafa','kasa','masa','maşa'], focus:'four-letter-mixed-position' }),
  ladderTask({ id:'g35-ladder-yol-sel-01', path:['yol','kol','kel','sel'], focus:'initial-vowel-initial' }),
  ladderTask({ id:'g35-ladder-nar-kol-01', path:['nar','kar','kor','kol'], focus:'initial-vowel-final' }),
  ladderTask({ id:'g35-ladder-dik-bal-01', path:['dik','dil','dal','bal'], focus:'final-vowel-initial' }),
  ladderTask({ id:'g35-ladder-son-tel-01', path:['son','ton','ten','tel'], focus:'initial-vowel-final-chain' })
];

function orderTask({ id, sentence, translation, focus, diagnostics }) {
  const answerTokens = sentence.split(' ');
  return definePremiumTask({
    id,
    gameId: 'english-sentence-builder',
    kind: 'wordOrder',
    familyId: `g35-english-order-${focus}`,
    skeletonId: `g35-english-order-${focus}:meaning-to-syntax`,
    reasoningPathId: 'find-subject-verb-place-modifiers-check-meaning',
    subjectId: 'english',
    topicId: 'sentence-building',
    learningOutcomeId: `build-${focus}-sentence-from-meaning`,
    gradeBand: '3-5',
    difficulty: 4,
    prompt: 'Karışık kelimelerin tamamını birer kez kullanarak anlam ve dilbilgisi bakımından doğru İngilizce cümleyi kur.',
    context: `Türkçesi: ${translation}`,
    explanation: `Doğru sıra: ${sentence}. Türkçe anlamı: ${translation}`,
    hints: [`Önce ${diagnostics.anchorHint}`, 'Son kontrolde bütün kelimeleri bir kez kullandığını ve cümlenin Türkçe anlamı koruduğunu denetle.'],
    cognitiveTraits: [...TRAITS, 'syntaxPlanning'],
    reasoningStepCount: 3,
    evidence: [
      `Türkçe anlam, ${focus} yapısını gerektirir.`,
      'Özne ve çekimli fiilin yeri belirlendikten sonra nesne veya tamamlayıcı yerleştirilir.',
      'Zaman, yer, bağlaç ve niteleyiciler anlam ilişkisine göre doğru konuma bağlanır.'
    ],
    diagnostics: [
      { id:`${id}:subject-verb`, why:diagnostics.subjectVerb, detectionRule:'subject-and-finite-verb-order' },
      { id:`${id}:phrase-unit`, why:diagnostics.phraseUnit, detectionRule:'required-phrase-tokens-remain-adjacent' },
      { id:`${id}:modifier`, why:diagnostics.modifier, detectionRule:'modifier-attaches-to-intended-head' }
    ],
    task: {
      answerTokens,
      rubric: ['Bütün kelimeler bir kez kullanılır.', 'Özne ve çekimli fiil doğru sıradadır.', 'Sözcük grupları parçalanmaz.', 'Cümle verilen Türkçe anlamı korur.']
    }
  });
}

const ORDER_ITEMS = [
  orderTask({ id:'g35-order-reading-night-01', sentence:'My sister reads a book every night', translation:'Kız kardeşim her gece bir kitap okur.', focus:'simple-present-routine', diagnostics:{ anchorHint:'özne olan “My sister” grubunu ve simple present fiili “reads” sözcüğünü bul', subjectVerb:'Tekil özneyle kullanılan reads fiili özneden koparılır veya fiilin yeri değiştirilir.', phraseUnit:'“a book” nesne grubu parçalanarak article ile isim ayrılır.', modifier:'“every night” zaman ifadesi okuma alışkanlığına bağlanmayacak yere konur.' } }),
  orderTask({ id:'g35-order-lights-01', sentence:'We should turn off the lights', translation:'Işıkları kapatmalıyız.', focus:'modal-verb', diagnostics:{ anchorHint:'“We should turn off” özne-modal-fiil zincirini kur', subjectVerb:'Should modalı özne veya yalın fiilden ayrılarak modal yapı bozulur.', phraseUnit:'“turn off” öbek fiili parçalanır veya off yanlış isme bağlanır.', modifier:'“the lights” nesnesi kapatma eyleminden koparılır.' } }),
  orderTask({ id:'g35-order-heavier-bag-01', sentence:'The blue bag is heavier than mine', translation:'Mavi çanta benimkinden daha ağırdır.', focus:'comparative-adjective', diagnostics:{ anchorHint:'karşılaştırma çekirdeği olan “is heavier than” yapısını bul', subjectVerb:'“The blue bag” öznesi ile “is” yüklemi arasındaki sıra bozulur.', phraseUnit:'“heavier than” karşılaştırma yapısı parçalanır.', modifier:'“blue” sıfatı nitelediği bag isminden veya “mine” karşılaştırma tamamlayıcısından koparılır.' } }),
  orderTask({ id:'g35-order-watering-now-01', sentence:'Ece is watering the flowers now', translation:'Ece şimdi çiçekleri suluyor.', focus:'present-continuous', diagnostics:{ anchorHint:'“Ece is watering” özne-yardımcı fiil-fiil dizisini kur', subjectVerb:'Present continuous yapısında is ile watering sözcüklerinin sırası bozulur.', phraseUnit:'“the flowers” nesne grubu article ile isim ayrılarak parçalanır.', modifier:'“now” zaman zarfı sürmekte olan eyleme bağlanmayacak yere yerleştirilir.' } }),
  orderTask({ id:'g35-order-cold-coat-01', sentence:'Because it is cold I wear a coat', translation:'Hava soğuk olduğu için palto giyerim.', focus:'because-cause', diagnostics:{ anchorHint:'because ile başlayan neden bölümünü, ardından sonuç bölümünü kur', subjectVerb:'Neden yan cümlesindeki “it is” veya ana cümledeki “I wear” sırası bozulur.', phraseUnit:'“a coat” nesne grubu parçalanır.', modifier:'Because yan cümlesi sonuç cümlesine neden ilişkisi kurmayacak biçimde yerleştirilir.' } }),
  orderTask({ id:'g35-order-help-box-01', sentence:'Can you help me carry this box', translation:'Bu kutuyu taşımama yardım edebilir misin?', focus:'can-question', diagnostics:{ anchorHint:'soru başındaki “Can you” yardımcı fiil-özne yapısını kur', subjectVerb:'Soru cümlesinde Can öznenin önüne getirilmez.', phraseUnit:'“help me carry” fiil zinciri parçalanır veya me yanlış fiile bağlanır.', modifier:'“this box” nesne grubu carry fiilinden koparılır.' } }),
  orderTask({ id:'g35-order-apples-table-01', sentence:'There are three apples on the table', translation:'Masanın üzerinde üç elma var.', focus:'there-are-location', diagnostics:{ anchorHint:'varlık bildiren “There are” kalıbını başa yerleştir', subjectVerb:'There are kalıbında yardımcı fiilin yeri veya çoğul uyumu bozulur.', phraseUnit:'“three apples” sayı-isim grubu parçalanır.', modifier:'“on the table” yer grubu apples varlığına bağlanmayacak yere taşınır.' } }),
  orderTask({ id:'g35-order-before-sleep-01', sentence:'I brush my teeth before I sleep', translation:'Uyumadan önce dişlerimi fırçalarım.', focus:'before-time-clause', diagnostics:{ anchorHint:'ana eylem “I brush my teeth” ile before yan cümlesini ayır', subjectVerb:'Ana cümlede veya before yan cümlesinde özne-fiil sırası bozulur.', phraseUnit:'“my teeth” nesne grubu parçalanır.', modifier:'Before bağlacı uyuma eylemiyle fırçalama eylemi arasındaki zaman sırasını ters kurar.' } }),
  orderTask({ id:'g35-order-bus-eight-01', sentence:'The bus arrives at school at eight', translation:'Otobüs okula saat sekizde varır.', focus:'place-and-time', diagnostics:{ anchorHint:'“The bus arrives” özne-fiil çekirdeğini kur', subjectVerb:'Tekil özne bus ile arrives fiili birbirinden koparılır.', phraseUnit:'“at school” yer veya “at eight” zaman grubu parçalanır.', modifier:'Yer ve zaman grupları birbirine karıştırılarak sekiz sayısı okula bağlanır.' } }),
  orderTask({ id:'g35-order-science-history-01', sentence:'Ali likes science but dislikes history', translation:'Ali fen bilimlerini sever ama tarihi sevmez.', focus:'but-contrast', diagnostics:{ anchorHint:'Ali öznesine bağlı iki karşıt fiili but ile bağla', subjectVerb:'Likes ve dislikes fiillerinden biri Ali öznesinden koparılır.', phraseUnit:'“but dislikes” karşıtlık bağlantısı parçalanır veya but yanlış iki ismi bağlar.', modifier:'Science ve history nesneleri ait oldukları fiillerle yer değiştirir.' } })
];

function storyTask({ id, letter, focus, prompt, plan }) {
  return definePremiumTask({
    id,
    gameId: 'forbidden-story',
    kind: 'story',
    familyId: `g35-story-${focus}`,
    skeletonId: `g35-story-${focus}:plan-draft-letter-audit`,
    reasoningPathId: 'select-safe-words-build-causal-story-audit',
    subjectId: 'turkish',
    topicId: 'creative-writing',
    learningOutcomeId: 'write-coherent-three-part-story-under-letter-constraint',
    gradeBand: '3-5',
    difficulty: 4,
    prompt,
    context: `Metinde “${letter.toLocaleUpperCase('tr-TR')}” harfi kullanılmayacak. En az 3 tamamlanmış cümle ve 18 farklı kelime gereklidir.`,
    explanation: 'Başarılı metin; yasak harfi içermez, başlangıç-gelişme-sonuç akışını korur, en az üç cümle ve yeterli kelime çeşitliliği taşır.',
    hints: [`Önce “${letter.toLocaleUpperCase('tr-TR')}” harfi içermeyen kişi, yer ve eylem sözcüklerinden küçük bir havuz oluştur.`, 'Taslağı bitirdikten sonra harf taraması, cümle sayısı ve olay tutarlılığı kontrollerini ayrı ayrı yap.'],
    cognitiveTraits: [...TRAITS, 'creativeConstraintPlanning', 'selfMonitoring'],
    reasoningStepCount: 4,
    evidence: [
      'Yasak harfi içermeyen uygun sözcükler yazmadan önce planlanır.',
      'Olaylar neden-sonuç ilişkisiyle başlangıç, gelişme ve sonuca bağlanır.',
      'Taslak yasak harf, cümle sayısı, kelime çeşitliliği ve konu bütünlüğü açısından yeniden denetlenir.'
    ],
    diagnostics: [
      { id:`${id}:letter`, why:'Öğrenci olay örgüsüne odaklanırken yasak harfi içeren yaygın bir sözcüğü fark etmeden kullanır.', detectionRule:'case-insensitive-forbidden-letter-scan' },
      { id:`${id}:sentences`, why:'Tek uzun cümle kurmak, üç aşamalı olay gelişimi ve en az üç cümle koşulunu karşılamaz.', detectionRule:'minimum-complete-sentence-count' },
      { id:`${id}:lexicon`, why:'Aynı güvenli sözcükleri tekrarlamak kelime çeşitliliği hedefini karşılamaz.', detectionRule:'minimum-normalized-unique-word-count' },
      { id:`${id}:coherence`, why:'Yasak harften kaçınmak için ilişkisiz cümleler sıralamak tutarlı hikâye oluşturmaz.', detectionRule:'topic-causal-coherence-rubric' }
    ],
    task: {
      forbiddenLetter: letter,
      minSentences: 3,
      minUniqueWords: 18,
      rubric: ['Yasak harf kullanılmaz.', 'En az üç tamamlanmış cümle vardır.', 'En az 18 farklı kelime kullanılır.', 'Olaylar konuya bağlı ve neden-sonuç bakımından tutarlıdır.'],
      modelPlan: plan
    }
  });
}

const STORY_ITEMS = [
  storyTask({ id:'g35-story-z-01', letter:'z', focus:'lost-kite', prompt:'Rüzgârda uzaklaşan uçurtmasını arayan iki arkadaşın bulduğu yaratıcı çözümü anlat.', plan:['uçurtmanın kaybolması','izlerin takip edilmesi','güvenli çözüm'] }),
  storyTask({ id:'g35-story-j-01', letter:'j', focus:'library-note', prompt:'Kütüphanedeki eski bir kitabın arasından çıkan notun öğrencileri götürdüğü yeri anlat.', plan:['notun bulunması','ipuçlarının çözülmesi','sonucun paylaşılması'] }),
  storyTask({ id:'g35-story-f-01', letter:'f', focus:'garden-help', prompt:'Okul bahçesinde susuz kalan bitkilere yardım eden bir sınıfın çalışmasını anlat.', plan:['sorunun görülmesi','görev paylaşımı','bitkilerin toparlanması'] }),
  storyTask({ id:'g35-story-v-01', letter:'v', focus:'lost-dog', prompt:'Mahallede kaybolan bir köpeğin sahibine ulaştırılmasını anlatan kısa bir öykü yaz.', plan:['köpeğin bulunması','ipucunun fark edilmesi','sahibine ulaşılması'] }),
  storyTask({ id:'g35-story-p-01', letter:'p', focus:'rain-shelter', prompt:'Ani yağmurda küçük hayvanlar için güvenli bir sığınak hazırlayan çocukların öyküsünü anlat.', plan:['yağmurun başlaması','güvenli alan kurulması','hayvanların korunması'] }),
  storyTask({ id:'g35-story-h-01', letter:'h', focus:'island-signal', prompt:'Kıyıdaki küçük adada yönünü şaşıran bir grubun güvenli bir işaretle yardım istemesini anlat.', plan:['yönün kaybolması','işaret planı','yardımın gelmesi'] }),
  storyTask({ id:'g35-story-c-01', letter:'c', focus:'museum-sound', prompt:'Müzede duyulan gizemli sesin gerçek nedenini araştıran bir öğrencinin öyküsünü yaz.', plan:['sesin duyulması','kanıtların toplanması','nedenin bulunması'] }),
  storyTask({ id:'g35-story-scedilla-01', letter:'ş', focus:'recycling-team', prompt:'Geri dönüşüm kutularını doğru kullanmayı öğreten bir öğrenci grubunun çalışmasını anlat.', plan:['karışıklığın fark edilmesi','örnek uygulama','alışkanlığın değişmesi'] }),
  storyTask({ id:'g35-story-g-01', letter:'g', focus:'picnic-map', prompt:'Piknik alanında bulunan eski bir krokiyi izleyen ailenin ulaştığı sürprizi anlat.', plan:['krokinin bulunması','işaretlerin izlenmesi','sürprizin açığa çıkması'] }),
  storyTask({ id:'g35-story-b-01', letter:'b', focus:'science-trial', prompt:'Basit bir deneyde ilk denemesi başarısız olan öğrencinin hatasını bulup yöntemi düzeltmesini anlat.', plan:['ilk deneme','hatanın incelenmesi','yeni sonucun görülmesi'] })
];

export const PREMIUM_TASK_PACK_M = createPremiumTaskPack({
  version: '3.2.0',
  sourceLabel: 'Zihin Arenası Premium 3–5. Sınıf Görev Bankası',
  items: [...LADDER_ITEMS, ...ORDER_ITEMS, ...STORY_ITEMS]
});

export const PREMIUM_TASK_GAME_IDS_M = PREMIUM_TASK_PACK_M.gameIds;
export const generatePremiumTaskRoundsM = PREMIUM_TASK_PACK_M.generate;
export const premiumTaskInventoryM = PREMIUM_TASK_PACK_M.inventory;
