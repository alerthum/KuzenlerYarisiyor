import { createPremiumTaskPack, definePremiumTask } from './premium-task-core.js';

const TASK_TRAITS = ['multiStepInference', 'conditionEvaluation', 'informationLinking', 'constraintTracking'];

function diagnostics(prefix, labels) {
  return labels.map(([suffix, why, detectionRule]) => ({ id: `${prefix}:${suffix}`, why, detectionRule }));
}

const WORD_MINE_DATA = [
  ['karamel', ['kara','kale','kalem','krem','lama','mal','ara','ela','kar','merak','marka','kamera']],
  ['sandalye', ['sandal','dal','sade','say','sel','yasa','yalan','alan','ada','sal','san','yel']],
  ['merdiven', ['devir','derin','demir','dev','din','ver','evren','verim','emin','verdi']],
  ['portakal', ['portakal','portal','ortak','park','top','pota','rota','kral','kart','kap','kalp','alt','art']],
  ['televizyon', ['televizyon','vizyon','yol','ton','not','net','ten','tez','zeytin','niyet','otel','elin','yeni']],
  ['kalabalık', ['kalabalık','balık','bal','kaba','abla','kal','bak','alık','akıl','alakalı','kabak']],
  ['cumartesi', ['cumartesi','cuma','mart','sima','sera','site','rast','tar','tas','tam','cesur','surat','suret','resim']],
  ['arkadaşlık', ['arkadaşlık','arkadaş','aşk','kış','kaş','daş','kar','ark','ara','akıl','kır','kral','dal','adaş']],
  ['kütüphane', ['kütüphane','hane','tane','küp','tüp','hap','paten','net','kan','hep','tek','ant','hat']],
  ['laboratuvar', ['laboratuvar','lavabo','tabur','araba','rol','var','boru','rota','orta','tablo','oval','tura','tur','barut']]
];

const WORD_MINE_ITEMS = WORD_MINE_DATA.map(([source, allowed], index) => definePremiumTask({
  id: `word-mine-premium-${String(index + 1).padStart(2, '0')}`,
  gameId: 'word-mine',
  kind: 'wordMine',
  familyId: `premium-word-mine-${source}`,
  skeletonId: `premium-word-mine-${source}:inventory-search`,
  subjectId: 'turkish',
  topicId: 'word-formation',
  learningOutcomeId: 'construct-verified-words-from-letter-inventory',
  gradeBand: '3-8',
  context: `Ana kelime “${source.toLocaleUpperCase('tr-TR')}”. Bir harfi, ana kelimede bulunduğundan fazla kullanamazsın.`,
  prompt: `“${source}” kelimesinin harflerinden en az sekiz farklı ve anlamlı kelime üret.`,
  explanation: `Doğrulanmış örneklerden bazıları: ${allowed.slice(0, 8).join(', ')}. Her kelimede harf envanteri yeniden kontrol edilir.`,
  hints: [`Önce 3 ve 4 harfli kelimeleri ara.`, `Aynı harfin ana kelimede kaç kez bulunduğunu işaretle.`],
  cognitiveTraits: TASK_TRAITS,
  reasoningStepCount: 3,
  evidence: [
    `Ana kelimenin doğrulanmış harf kaynağı “${source}”dır.`,
    `Her aday kelime en az üç harfli ve harf envanterine uygun olmalıdır.`,
    `Doğrulanmış örnek havuzunda ${allowed.length} kelime vardır.`
  ],
  diagnostics: diagnostics(`word-mine-${index + 1}`, [
    ['foreign-letter', 'Öğrenci ana kelimede bulunmayan bir harfi aday kelimeye ekler.', 'candidate-contains-letter-outside-source-inventory'],
    ['overuse-letter', 'Öğrenci bir harfi ana kelimedeki sayısından fazla kullanır.', 'candidate-letter-count-exceeds-source-count'],
    ['unverified-form', 'Öğrenci harfleri uygun olsa da doğrulanmış bir Türkçe kelime olmayan dizilim kurar.', 'candidate-not-in-verified-word-list']
  ]),
  task: { source, allowed }
}));

const EXPRESSION_DATA = [
  [[2,3,4,5],25,'(5 + 2) × 4 - 3','group-then-subtract'],
  [[6,3,2,1],19,'6 × 3 + 2 - 1','product-adjustment'],
  [[8,4,3,2],26,'8 × 3 + 4 - 2','product-balance'],
  [[9,5,2,1],18,'9 + 5 × 2 - 1','priority-control'],
  [[7,6,3,2],24,'7 × 6 ÷ 2 + 3','divide-product'],
  [[10,4,3,2],20,'(10 - 4) × 3 + 2','difference-scale'],
  [[12,5,3,2],19,'12 + 5 × 2 - 3','mixed-priority'],
  [[9,8,4,2],30,'(9 - 4) × (8 - 2)','double-difference'],
  [[11,6,3,2],25,'11 × 2 + 6 - 3','odd-target-balance'],
  [[8,7,5,3],30,'(8 + 7) × (5 - 3)','sum-times-difference']
];

const EXPRESSION_ITEMS = EXPRESSION_DATA.map(([numbers, target, solution, structure], index) => definePremiumTask({
  id: `target-number-premium-${String(index + 1).padStart(2, '0')}`,
  gameId: 'target-number',
  kind: 'expression',
  familyId: `premium-target-${structure}`,
  skeletonId: `premium-target-${structure}:exact-use`,
  reasoningPathId: 'constraint-plan-verify',
  subjectId: 'mathematics',
  topicId: 'arithmetic-expression',
  learningOutcomeId: 'construct-expression-under-exact-use-constraints',
  gradeBand: '3-8',
  context: `Sayılar: ${numbers.join(', ')} • Hedef: ${target}`,
  prompt: 'Bütün sayıları birer kez kullanarak hedef sayıya ulaşan bir işlem kur.',
  explanation: `Doğrulanmış çözüm: ${solution} = ${target}. Başka çözümler de bütün sayıları birer kez kullanıyorsa kabul edilir.`,
  hints: ['Hedefe yakın bir çarpım veya parantezli yapı oluştur.', 'Son kontrolünde her sayının tam bir kez kullanıldığını say.'],
  cognitiveTraits: TASK_TRAITS,
  reasoningStepCount: 4,
  evidence: [
    `Kullanılması gereken sayı çokluğu ${numbers.join(', ')} biçimindedir.`,
    `Doğrulanmış ifade ${solution} sonucunu verir.`,
    `İfadenin sonucu hedef ${target} ile aynıdır.`
  ],
  diagnostics: diagnostics(`target-${index + 1}`, [
    ['missing-number', 'Öğrenci hedefe ulaşsa bile verilen sayılardan birini kullanmadan bırakır.', 'used-number-multiset-is-smaller-than-required'],
    ['duplicate-number', 'Öğrenci kolaylaştırmak için verilen sayılardan birini ikinci kez kullanır.', 'used-number-multiset-has-extra-copy'],
    ['priority-error', 'Öğrenci işlem sırası veya parantezleri farklı yorumladığı için hedef dışı sonuca ulaşır.', 'evaluated-result-does-not-equal-target']
  ]),
  task: {
    numbers,
    target,
    solution,
    rule: 'Verilen sayıların her birini yalnız bir kez kullan. +, −, ×, ÷ ve parantezlerden yararlanabilirsin.'
  }
}));

export const PREMIUM_TASK_PACK_G = createPremiumTaskPack({
  version: '2.5.0',
  sourceLabel: 'Zihin Arenası Premium Görev Bankası',
  items: [...WORD_MINE_ITEMS, ...EXPRESSION_ITEMS]
});

export const PREMIUM_TASK_GAME_IDS_G = PREMIUM_TASK_PACK_G.gameIds;
export const generatePremiumTaskRoundsG = PREMIUM_TASK_PACK_G.generate;
export const premiumTaskInventoryG = PREMIUM_TASK_PACK_G.inventory;
