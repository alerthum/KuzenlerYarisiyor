import { defineItemModel } from './contracts.js';
import { solveNecessaryClaim } from './logic-solver.js';

export const pigeonholeModel = defineItemModel({
  id: 'math-pigeonhole-guarantee-v2', domain: 'mathematics',
  construct: { id: 'construct-pigeonhole', gradeRange: [7, 12], subjectId: 'mathematics', curriculumOutcomeIds: ['counting-extreme-case'], knowledgeComponents: ['worst-case-reasoning', 'pigeonhole-principle'], claim: 'Öğrenci garanti eşiğini en kötü durum üzerinden kurar.' },
  deepFeatures: ['worst-case-capacity', 'guarantee-threshold'], surfaceFeatures: ['category-label', 'counts'], compatibleGameIds: ['olympiad-ladder', 'problem-hunter'],
  solutionGraph: { steps: [
    { id: 's1', action: 'garanti oluşmadan mümkün olan en kötü durumu kur', dependsOn: [], evidence: 'Her kategoride hedef sayının bir eksiğine kadar kalınabilir.', hint: 'Hedefe ulaşmayı mümkün olduğunca geciktiren durumu düşün.' },
    { id: 's2', action: 'kategori kapasitesini hesapla', dependsOn: ['s1'], evidence: 'Kategori sayısı ile hedef−1 çarpılır.', hint: 'Her kategoriden en fazla kaç tane alınabilir?' },
    { id: 's3', action: 'garanti için bir ekle', dependsOn: ['s2'], evidence: 'Bir sonraki seçim mutlaka bir kategoriyi hedefe ulaştırır.', hint: 'En kötü durum toplamından sonra gelen bir seçim neyi garanti eder?' }
  ]},
  misconceptions: [
    { id: 'use-target-as-category-count', description: 'Kategori sayısı yerine hedef sayıyı çarpan alır.', buggyRule: 'target*(target-1)+1', feedback: 'Çarpan, aynı renkten istenen sayı değil renk sayısıdır.', apply: t => t.target * (t.target - 1) + 1 },
    { id: 'omit-final-guarantee-step', description: 'En kötü durum kapasitesini cevap sanır.', buggyRule: 'categories*(target-1)', feedback: 'Bu toplamda garanti henüz oluşmayabilir; bir seçim daha gerekir.', apply: t => t.categories * (t.target - 1) },
    { id: 'multiply-category-by-target', description: 'Her kategoride hedef sayıya kadar kalınabileceğini varsayar.', buggyRule: 'categories*target', feedback: 'Hedef sayıya ulaşıldığı anda garanti zaten oluşmuştur.', apply: t => t.categories * t.target }
  ],
  generateTask: ({ categories = 6, target = 5 } = {}) => ({ categories, target }),
  solve: t => t.categories * (t.target - 1) + 1,
  verify: (t, v) => Number(v) === t.categories * (t.target - 1) + 1,
  render: (t) => ({ context: `${t.categories} farklı renkte yeterli sayıda bilye vardır.`, prompt: `En az kaç bilye çekilirse ${t.target} bilyenin aynı renkte olması garanti edilir?`, formatOption: String })
});

export const readingEvidenceModel = defineItemModel({
  id: 'reading-claim-evidence-v2', domain: 'reading',
  construct: { id: 'construct-claim-evidence', gradeRange: [6, 12], subjectId: 'turkish', curriculumOutcomeIds: ['evaluate-claim-from-text'], knowledgeComponents: ['claim-evidence', 'scope-limitation'], claim: 'Öğrenci metnin desteklediği en güçlü fakat sınırlı çıkarımı seçer.' },
  deepFeatures: ['evidence-coverage', 'scope-control'], surfaceFeatures: ['topic', 'names', 'numbers'], compatibleGameIds: ['paragraph-detective', 'meaning-hunt'],
  solutionGraph: { steps: [
    { id: 's1', action: 'iddia ve kanıtları ayır', dependsOn: [], evidence: 'Metindeki gözlem ile açıklama birbirinden ayrılır.', hint: 'Önce doğrudan ölçülen bilgileri işaretle.' },
    { id: 's2', action: 'ölçülmeyen değişkenleri belirle', dependsOn: ['s1'], evidence: 'Metnin bilgi vermediği alanlar kesin hükmü sınırlar.', hint: 'Metinde ölçülmeyen hangi etkenler olabilir?' },
    { id: 's3', action: 'kanıtı aşmayan sonucu seç', dependsOn: ['s2'], evidence: 'İlişki kabul edilir; kesin neden-sonuç reddedilir.', hint: 'Hem gözlemi kabul eden hem de kesinlik eklemeyen seçeneği ara.' }
  ]},
  misconceptions: [
    { id: 'correlation-as-causation', description: 'Birlikte görülmeyi tek neden sayar.', buggyRule: 'upgrade-association-to-cause', feedback: 'Metin ilişki gösterir; tek neden olduğunu kanıtlamaz.', apply: t => t.options.causation },
    { id: 'deny-all-effect', description: 'Kesin neden kanıtlanmadığı için bütün ilişkiyi reddeder.', buggyRule: 'absence-of-proof-means-no-effect', feedback: 'Kesin neden kurulamasa da gözlenen ilişki yok sayılamaz.', apply: t => t.options.denial },
    { id: 'overgeneralize-sample', description: 'Sınırlı gözlemi bütün durumlara genişletir.', buggyRule: 'generalize-beyond-scope', feedback: 'Metnin kapsamı dışındaki bütün durumlar için hüküm verilemez.', apply: t => t.options.overgeneralization }
  ],
  generateTask: (input = {}) => ({
    passage: input.passage || 'Duru üç hafta boyunca okula bisikletle gelen öğrenci sayısını kaydetti. Güvenli sürüş etkinliğinin yapıldığı hafta sayı arttı. Hava koşulları benzerdi; öğrencilerin evleri ile okul arasındaki uzaklık ölçülmedi.',
    correct: input.correct || 'Etkinlik artışla ilişkili olabilir; ölçülmeyen başka etkenler bulunduğu için tek neden olarak gösterilemez.',
    options: input.options || { causation: 'Artışın tek nedeni etkinliktir.', denial: 'Etkinliğin hiçbir etkisi yoktur.', overgeneralization: 'Bu etkinlik her okulda aynı artışı sağlar.' }
  }),
  solve: t => t.correct,
  verify: (t, v) => String(v) === t.correct,
  render: t => ({ context: t.passage, prompt: 'Metindeki verilere dayanarak en sağlam yorum hangisidir?', formatOption: String })
});

export const logicConstraintModel = defineItemModel({
  id: 'logic-ordering-v2', domain: 'logic',
  construct: { id: 'construct-ordering-constraints', gradeRange: [5, 12], subjectId: 'verbal-logic', curriculumOutcomeIds: ['derive-order-from-constraints'], knowledgeComponents: ['constraint-propagation', 'necessary-vs-possible'], claim: 'Öğrenci bütün koşulları birlikte kullanarak zorunlu sıralamayı belirler.' },
  deepFeatures: ['constraint-chain', 'necessity-check'], surfaceFeatures: ['person-labels', 'activity-labels'], compatibleGameIds: ['logic-station'], interactionType: 'table-choice',
  solutionGraph: { steps: [
    { id: 's1', action: 'koşulları tabloya aktar', dependsOn: [], evidence: 'Her koşul ayrı ilişki olarak gösterilir.', hint: 'Önce her koşulu ok veya tablo ilişkisine çevir.' },
    { id: 's2', action: 'zincirleri birleştir', dependsOn: ['s1'], evidence: 'A<B ve B<C ilişkileri A<B<C zincirini verir.', hint: 'Aynı kişiyi içeren ilişkileri birbirine bağla.' },
    { id: 's3', action: 'bütün olası sıralamaları denetle', dependsOn: ['s2'], evidence: 'Yalnız bütün çözümlerde doğru kalan yargı zorunludur.', hint: 'Bir yargının zorunlu olması için tüm geçerli sıralamalarda doğru kalması gerekir.' }
  ]},
  misconceptions: [
    { id: 'use-single-rule-only', description: 'Yalnız bir koşulu kullanıp diğerlerini yok sayar.', buggyRule: 'partial-constraint-check', feedback: 'Bir sıralama bütün koşulları aynı anda sağlamalıdır.', apply: t => t.claims.find(c => c.id === 'partial')?.text },
    { id: 'reverse-order-relation', description: 'Önce-sonra ilişkisini ters çevirir.', buggyRule: 'reverse-edge', feedback: '“A, B’den önce” ifadesi A’nın daha küçük sırada olduğunu söyler.', apply: t => t.claims.find(c => c.id === 'reversed')?.text },
    { id: 'possible-as-necessary', description: 'Bir mümkün sıralamayı zorunlu sanır.', buggyRule: 'possible-means-necessary', feedback: 'Tek bir örnek yetmez; yargı bütün geçerli sıralamalarda doğru olmalıdır.', apply: t => t.claims.find(c => c.id === 'possible')?.text }
  ],
  generateTask: (input = {}) => ({
    people: input.people || ['A', 'B', 'C', 'D'],
    constraints: input.constraints || [['A', '<', 'B'], ['B', '<', 'C'], ['D', '<', 'C']],
    claims: input.claims || [
      { id: 'correct', relation: ['A', '<', 'C'], text: 'A, C’den önce olmak zorundadır.' },
      { id: 'partial', relation: ['D', '<', 'A'], text: 'D, A’dan önce olmak zorundadır.' },
      { id: 'reversed', relation: ['C', '<', 'B'], text: 'C, B’den önce olmak zorundadır.' },
      { id: 'possible', relation: ['B', '<', 'D'], text: 'B, D’den önce olmak zorundadır.' }
    ]
  }),
  solve: t => solveNecessaryClaim(t),
  verify: (t, v) => {
    try { return solveNecessaryClaim(t).claimId === v?.claimId; } catch { return false; }
  },
  render: t => ({ context: `Dört kişi sıraya girecektir. Koşullar: ${t.constraints.map(c => `${c[0]} ${c[1] === '<' ? c[2] + "'den önce" : c[2]}`).join('; ')}.`, prompt: 'Hangisi kesinlikle doğrudur?', formatOption: value => typeof value === 'object' ? value.text : String(value), representation: { type: 'ordering-table', columns: ['1', '2', '3', '4'] } })
});

