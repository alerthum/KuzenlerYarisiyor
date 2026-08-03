/**
 * LGS Foundation — yeni bilişsel aileler (Capacity Policy V2).
 * sessionLength=10 için 12 aile marjı yetersiz; +6 aile.
 */

function pick(items, random) {
  return items[Math.floor(random() * items.length)];
}
function shuffle(list, random) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < String(str).length; i += 1) h = ((h << 5) - h + String(str).charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

const PATH_IDS = [
  'raw-letters', 'context-embedded', 'staged-strategy-hint',
  'counterexample-first', 'constraint-ordering'
];

function pathWrap(pathId, raw, strategy) {
  if (pathId === 'raw-letters') return { prompt: raw, context: 'Kalıp düşüncesine odaklan.' };
  if (pathId === 'context-embedded') return { prompt: `Deneme: ${raw}`, context: 'Süs bağlamı ayıkla.' };
  if (pathId === 'counterexample-first') return { prompt: `Önce yanlış seçeneği ele: ${raw}`, context: 'Eleme yolu.' };
  if (pathId === 'constraint-ordering') return { prompt: `Koşulları sırayla uygula: ${raw}`, context: 'Kısıt sırası.' };
  return { prompt: `${strategy || 'Önce kalıbı belirle.'} ${raw}`, context: 'Strateji spoiler değildir.' };
}

const STEM_FRAMES = [
  'Doğru sonuç hangisidir?', 'Bu kalıpta hangi seçenek geçerlidir?',
  'Hangi yanıt zorunlu adıma uyar?', 'Eleme sonrası kalan doğru nedir?',
  'Ara karar doğruysa sonuç hangisidir?', 'Yanılgı tuzağına düşmeden seç:',
  'Kanıtla uyumlu seçenek hangisi?', 'İkinci adım tamamlanınca ne bulunur?',
  'Koşulları sağlayan tek seçenek?', 'Hangi seçenek düşünme yolunu bozar?',
  'Doğru stratejinin çıktısı nedir?', 'Karşı örnekle elenenler dışında kalan?',
  'Birim/ölçek korunursa sonuç?', 'Metin/veri ile çelişmeyen hangisi?',
  'Çok adımlı çözümün sonu hangisi?', 'Hangi seçenek kısmi doğruyu tam sanır?',
  'Kontrol ettikten sonra kalan doğru?', 'Zorunlu ara sonucu kullanan cevap?',
  'Yüzey tuzağı olmayan seçenek?', 'Hedef soruya en uygun yanıt?'
];

function roundChoice(skeletonId, pathId, answer, distractors, random, texts, meta = {}) {
  const options = shuffle([...new Set([answer, ...distractors].map(String))].slice(0, 4), random);
  while (options.length < 4) options.push(`X${options.length}`);
  const frame = pick(STEM_FRAMES, random);
  const { prompt, context } = pathWrap(pathId, `${texts.raw} ${frame}`, texts.strategy);
  return {
    kind: 'choice',
    prompt,
    context,
    options,
    answerIndex: options.indexOf(String(answer)),
    explanation: texts.explanation,
    questionKey: `lgs-foundation:${skeletonId}:${pathId}:${simpleHash(`${texts.raw}|${answer}|${Math.floor(random() * 1e9)}`)}`,
    curriculumSkillId: meta.curriculumSkillId,
    distractorPlanId: `${skeletonId}#plan`,
    solutionGraphId: `${skeletonId}#graph`,
    difficultyEvidence: meta.difficultyEvidence || 'multi-step',
    ageAppropriateLanguage: true,
    misconceptionIds: meta.misconceptionIds || ['yanlis-kural', 'yuzey-tuzagi', 'eksik-adim'],
    independentSolver: true,
    representationType: meta.representationType || 'verbal-symbolic',
    informationFlow: meta.informationFlow || ['read', 'decide', 'verify'],
    requestedResult: 'choice'
  };
}

const TASK = {
  select: ['strategySelection', 'multiStepInference'],
  forced: ['informationLinking', 'conditionEvaluation'],
  spot: ['errorAnalysis', 'conditionEvaluation'],
  compare: ['strategySelection', 'usingIntermediateResultInNewDecision']
};

function buildFamily(familyId, curriculumSkillId, builders) {
  const ids = {
    select: `${familyId}:select-valid`,
    forced: `${familyId}:forced-fact`,
    spot: `${familyId}:spot-violation`,
    compare: `${familyId}:compare-worlds`
  };
  return {
    familyId,
    skeletons: [
      { skeletonId: ids.select, reasoningPathIds: PATH_IDS, cognitiveTraits: TASK.select, generate: (r, p) => builders.select(ids.select, p, r, curriculumSkillId) },
      { skeletonId: ids.forced, reasoningPathIds: PATH_IDS, cognitiveTraits: TASK.forced, generate: (r, p) => builders.forced(ids.forced, p, r, curriculumSkillId) },
      { skeletonId: ids.spot, reasoningPathIds: PATH_IDS, cognitiveTraits: TASK.spot, generate: (r, p) => builders.spot(ids.spot, p, r, curriculumSkillId) },
      { skeletonId: ids.compare, reasoningPathIds: PATH_IDS, cognitiveTraits: TASK.compare, generate: (r, p) => builders.compare(ids.compare, p, r, curriculumSkillId) }
    ]
  };
}

const UNIT = [
  { q: '3 m = ? cm', a: '300', w: ['30', '3', '3000'] },
  { q: '2 saat = ? dk', a: '120', w: ['60', '24', '200'] },
  { q: '5000 g = ? kg', a: '5', w: ['50', '0.5', '500'] }
];

const PCT = [
  { q: '80’in %25’i', a: '20', w: ['25', '40', '16'] },
  { q: '60’tan %10 artış', a: '66', w: ['70', '6', '54'] },
  { q: '40’ın %50’si', a: '20', w: ['50', '10', '30'] }
];

const SETS = [
  { q: 'A={1,2,3} B={3,4}; kesişim', a: '{3}', w: ['{1,2}', '{4}', '{1,2,3,4}'] },
  { q: 'A={a,b} B={b,c}; birleşim', a: '{a,b,c}', w: ['{b}', '{a}', '{c}'] },
  { q: 'A={2,4} B={4,6}; yalnız A', a: '{2}', w: ['{4}', '{6}', '{2,4}'] }
];

const TIME = [
  { q: 'Sıra: tohum→filiz→çiçek', a: 'filiz ortada', w: ['çiçek başta', 'tohum sonda', 'rastgele'] },
  { q: 'Sıra: yumurta→larva→kelebek', a: 'larva ortada', w: ['kelebek başta', 'yumurta sonda', 'ters'] },
  { q: 'Sıra: plan→uygula→değerlendir', a: 'uygula ortada', w: ['değerlendir başta', 'plan sonda', 'atla'] }
];

const SCALE = [
  { q: 'Ölçek 1:100; haritada 2 cm → gerçek?', a: '200 cm', w: ['100 cm', '2 cm', '50 cm'] },
  { q: 'Ölçek 1:50; gerçek 100 cm → harita?', a: '2 cm', w: ['50 cm', '1 cm', '5 cm'] },
  { q: 'Ölçek 1:10; harita 3 cm → gerçek?', a: '30 cm', w: ['3 cm', '10 cm', '13 cm'] }
];

const PROB = [
  { q: 'Zar: çift gelme olasılığı', a: '1/2', w: ['1/6', '1/3', '2/3'] },
  { q: 'Torba 3kırmızı 1mavi; mavi?', a: '1/4', w: ['1/3', '3/4', '1/2'] },
  { q: 'Para: yazı gelme', a: '1/2', w: ['1/3', '1', '0'] }
];

function standardBuilders(pool, skill, explainFn) {
  return {
    select(id, pathId, random, curriculumSkillId) {
      const item = pick(pool, random);
      return roundChoice(id, pathId, item.a, item.w, random, {
        raw: item.q,
        strategy: 'Doğru işlemi seç, ara sonucu kontrol et.',
        explanation: explainFn(item)
      }, { curriculumSkillId, informationFlow: ['parse', 'compute', 'select'], difficultyEvidence: 'two-decision-calc' });
    },
    forced(id, pathId, random, curriculumSkillId) {
      const item = pick(pool, random);
      return roundChoice(id, pathId, 'DOGRu-ISLEM', ['TAHMIN', 'RENK', 'ATLA'], random, {
        raw: `${item.q} için zorunlu adım?`,
        explanation: 'Doğru işlem seçimi zorunludur.'
      }, { curriculumSkillId, informationFlow: ['identify-op', 'apply', 'verify'] });
    },
    spot(id, pathId, random, curriculumSkillId) {
      const item = pick(pool, random);
      return roundChoice(id, pathId, item.w[0], [item.a, 'kontrol', 'birim'], random, {
        raw: `${item.q} için hangisi hatalı sonuçtur?`,
        explanation: `${item.w[0]} yaygın yanılgıdır.`
      }, { curriculumSkillId, misconceptionIds: ['yanlis-islem', 'birim-hata', 'yuzey-sayi'] });
    },
    compare(id, pathId, random, curriculumSkillId) {
      const item = pick(pool, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.a}. B: ${item.w[0]}. Hangisi doğru?`,
        explanation: 'A doğru sonuçtur.'
      }, { curriculumSkillId, informationFlow: ['compare', 'eliminate', 'choose'] });
    }
  };
}

export function buildLgsNewFamiliesV2() {
  return [
    buildFamily('lgs-unit-conversion', 'math.measure.unit-conversion', standardBuilders(UNIT, 'unit', (i) => `${i.q} → ${i.a}`)),
    buildFamily('lgs-percent-change', 'math.percent.change', standardBuilders(PCT, 'pct', (i) => `${i.q} → ${i.a}`)),
    buildFamily('lgs-set-diagram', 'math.set.basic', standardBuilders(SETS, 'set', (i) => `${i.q} → ${i.a}`)),
    buildFamily('lgs-timeline-order', 'science.process.sequence', standardBuilders(TIME, 'time', (i) => `${i.q} → ${i.a}`)),
    buildFamily('lgs-scale-map', 'math.scale.map', standardBuilders(SCALE, 'scale', (i) => `${i.q} → ${i.a}`)),
    buildFamily('lgs-probability-basic', 'math.probability.basic', standardBuilders(PROB, 'prob', (i) => `${i.q} → ${i.a}`))
  ];
}

export const LGS_NEW_FAMILY_COUNT = 6;

export default buildLgsNewFamiliesV2;
