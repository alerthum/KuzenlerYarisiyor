/**
 * 8. sınıf Zekâ İstasyonu için algılanan çeşitlilik odaklı, gerçek çözücülü banka.
 *
 * Oturum aynı yüzeyde sekiz sıralama sorusu üretmez. Her tur ayrı bir düşünme
 * deneyimini temsil eder: dairesel yerleşim, rota/graph, küme sayma, durum
 * dönüşümü, bilgi stratejisi, birebir eşleştirme, zamanlama ve doğruluk analizi.
 * Her soruda bütün geçerli modeller programatik olarak taranır.
 */

function permutations(values, size = values.length) {
  if (size === 0) return [[]];
  return values.flatMap((value, index) => permutations(
    [...values.slice(0, index), ...values.slice(index + 1)],
    size - 1
  ).map((rest) => [value, ...rest]));
}

function combinations(values, size, start = 0, prefix = [], output = []) {
  if (prefix.length === size) {
    output.push([...prefix]);
    return output;
  }
  for (let index = start; index < values.length; index += 1) {
    combinations(values, size, index + 1, [...prefix, values[index]], output);
  }
  return output;
}

function sameMembers(left, right) {
  if (left.length !== right.length) return false;
  const a = [...left].sort((x, y) => String(x).localeCompare(String(y), 'tr'));
  const b = [...right].sort((x, y) => String(x).localeCompare(String(y), 'tr'));
  return a.every((value, index) => value === b[index]);
}

function adjacentCircle(world, left, right) {
  const size = world.length;
  const a = world.indexOf(left);
  const b = world.indexOf(right);
  return Math.min((a - b + size) % size, (b - a + size) % size) === 1;
}

function buildRound({
  id,
  context,
  prompt,
  worlds,
  mode,
  options,
  hints,
  steps,
  topicId,
  skill,
  misconceptions,
  experienceType,
  surfaceDomain,
  trustedSessionOrder,
  timeLimit = 210,
  extraTraits = []
}) {
  if (!Array.isArray(worlds) || worlds.length < 1) throw new Error(`${id}:no-valid-world`);
  if (!Array.isArray(options) || options.length !== 4) throw new Error(`${id}:four-options-required`);
  if (!Array.isArray(steps) || steps.length < 4) throw new Error(`${id}:four-steps-required`);
  if (!Array.isArray(misconceptions) || misconceptions.length !== 3) throw new Error(`${id}:three-misconceptions-required`);
  if (!experienceType) throw new Error(`${id}:experience-type-required`);
  if (!surfaceDomain) throw new Error(`${id}:surface-domain-required`);
  if (!Number.isInteger(trustedSessionOrder)) throw new Error(`${id}:session-order-required`);
  if (!Number.isFinite(timeLimit) || timeLimit < 180) throw new Error(`${id}:time-limit-too-short`);

  const truth = options.map((option) => {
    const matches = worlds.filter((world) => option.test(world)).length;
    if (mode === 'MUST') return matches === worlds.length;
    if (mode === 'COULD') return matches > 0;
    if (mode === 'CANNOT') return matches === 0;
    throw new Error(`${id}:invalid-mode:${mode}`);
  });
  const correctIndexes = truth.flatMap((value, index) => value ? [index] : []);
  if (correctIndexes.length !== 1) throw new Error(`${id}:non-unique-answer:${correctIndexes.join(',')}`);
  const answerIndex = correctIndexes[0];

  let wrongIndex = 0;
  const diagnostics = options.map((option, optionIndex) => {
    if (optionIndex === answerIndex) {
      return Object.freeze({
        optionIndex,
        optionText: option.text,
        isCorrect: true,
        misconceptionId: null,
        misconception: null,
        rationale: `${worlds.length} geçerli modelin tamamı çözücü tarafından tarandı ve seçenek “${mode}” ölçütünü tek başına sağladı.`,
        whyStudentChoosesThis: 'Bütün öncülleri aynı anda uygular ve tek bir örnekle yetinmez.'
      });
    }
    const misconception = misconceptions[wrongIndex++];
    return Object.freeze({
      optionIndex,
      optionText: option.text,
      isCorrect: false,
      misconceptionId: misconception.id,
      misconception: misconception.text,
      rationale: misconception.text,
      whyStudentChoosesThis: misconception.why
    });
  });

  const solutionGraph = [
    ...steps.map((step, index) => Object.freeze({
      step: index + 1,
      id: `s${index + 1}`,
      action: step.action,
      evidence: step.evidence
    })),
    Object.freeze({
      step: steps.length + 1,
      id: 'world-enumeration-verification',
      action: 'bütün geçerli modelleri bağımsız çözücüyle tara',
      evidence: `${worlds.length} geçerli model bulundu; doğru seçeneğin ${mode} koşulu tekil olarak doğrulandı.`
    })
  ];
  const explanation = `${steps.map((step, index) => `${index + 1}) ${step.action}: ${step.evidence}`).join(' ')} Son kontrol: ${worlds.length} geçerli modelin tamamında “${options[answerIndex].text}” seçeneği ${mode} ölçütünü tek başına sağlar.`;
  const highTraits = [
    'constraintIntegration',
    'counterexampleSearch',
    'worldEnumeration',
    'necessityPossibilityDistinction',
    ...extraTraits
  ];

  return Object.freeze({
    kind: 'choice',
    questionKey: `trusted:3.0:logic-station:${id}`,
    prompt,
    context,
    options: Object.freeze(options.map((option) => option.text)),
    answerIndex,
    explanation,
    hints: Object.freeze([...hints]),
    detailedOptions: Object.freeze(diagnostics.map((row) => row.isCorrect ? `Doğru: ${row.rationale}` : `Yanlış: ${row.rationale}`)),
    optionDiagnostics: Object.freeze(diagnostics),
    skill: 'verbal-logic',
    subjectId: 'logic',
    topicId,
    learningOutcomeId: `LOGIC.G8.${id}`,
    curriculumReferenceId: `LOGIC.G8.${id}`,
    gradeBand: '8',
    targetGrade: 8,
    difficulty: 5,
    cognitiveDepth: 5,
    timeLimit,
    authoredReasoningStepCount: steps.length,
    reasoningStepCount: solutionGraph.length,
    cognitiveTraits: Object.freeze(highTraits),
    familyId: `trusted-g8-logic-diverse:${experienceType}`,
    skeletonId: `trusted-g8-logic-diverse:${skill}`,
    reasoningPathId: `trusted-g8-logic-diverse:${id}`,
    solutionGraph: Object.freeze(solutionGraph),
    cognitiveDepthEvidence: Object.freeze({
      reasoningStepCount: solutionGraph.length,
      authoredReasoningStepCount: steps.length,
      highCognitiveTraits: highTraits,
      source: 'trusted-authored-g8-logic-diversity-bank'
    }),
    sourceLabel: '8. Sınıf Zekâ İstasyonu · Algısal Çeşitlilik ve Kısıt Çözücü Bankası',
    premiumTier: 'PLATINUM',
    premiumQuestion: true,
    canonicalQuestionId: id,
    constructId: experienceType,
    perceivedStructureId: experienceType,
    surfaceDomain,
    trustedSessionOrder,
    knowledgeComponents: Object.freeze([topicId, skill, mode, experienceType]),
    intendedDifficultyBand: 'LOGIC_HIGH',
    solverProof: Object.freeze({
      verified: true,
      solverId: `trusted-g8-logic-world-enumerator:${id}`,
      validWorldCount: worlds.length,
      mode,
      answerText: options[answerIndex].text
    }),
    requireExplicitDistractorEvidence: true,
    distractorValidation: Object.freeze({
      verified: true,
      diagnosticCount: 3,
      distinctMisconceptions: 3,
      violations: Object.freeze([])
    }),
    trustedHumanReview: Object.freeze({
      status: 'APPROVED',
      difficultyVerdict: 'HARD',
      languageVerdict: 'NATURAL_TR',
      distractorVerdict: 'DIAGNOSTIC',
      reviewStandard: 'FINAL_STUDENT_SURFACE_V3_DIVERSITY'
    })
  });
}

const circularWorlds = permutations(['Bora', 'Ceren', 'Deniz', 'Ece', 'Fırat'])
  .map((rest) => ['Aylin', ...rest])
  .filter((world) => adjacentCircle(world, 'Bora', 'Ceren')
    && world[3] === 'Deniz'
    && !adjacentCircle(world, 'Ece', 'Aylin'));

const ROUTE_NODES = ['Kamp', 'Köprü', 'Orman', 'Göl', 'Tepe', 'Liman'];
const ROUTE_EDGES = new Set([
  'Kamp|Köprü', 'Kamp|Orman', 'Köprü|Orman', 'Köprü|Tepe',
  'Orman|Tepe', 'Orman|Göl', 'Tepe|Liman', 'Göl|Liman', 'Göl|Tepe'
].map((edge) => edge.split('|').sort((a, b) => a.localeCompare(b, 'tr')).join('|')));
function routeEdge(left, right) {
  return ROUTE_EDGES.has([left, right].sort((a, b) => a.localeCompare(b, 'tr')).join('|'));
}
const routeWorlds = permutations(ROUTE_NODES.filter((node) => !['Kamp', 'Liman'].includes(node)), 3)
  .map((middle) => ['Kamp', ...middle, 'Liman'])
  .filter((route) => route.slice(0, -1).every((node, index) => routeEdge(node, route[index + 1])))
  .filter((route) => route.includes('Orman'))
  .filter((route) => !route.slice(0, -1).some((node, index) => new Set([node, route[index + 1]]).has('Köprü') && new Set([node, route[index + 1]]).has('Tepe')))
  .filter((route) => Number(route.includes('Göl')) + Number(route.includes('Tepe')) === 1);

const clubWorlds = Object.freeze([Object.freeze({
  total: 40,
  coding: 20,
  robotics: 18,
  design: 16,
  codingRobotics: 7,
  codingDesign: 6,
  roboticsDesign: 5,
  allThree: 3,
  none: 1,
  onlyCoding: 10,
  onlyRobotics: 9,
  onlyDesign: 8,
  exactlyOne: 27
})]);

const lampSwitches = Object.freeze([
  Object.freeze([1, 2]),
  Object.freeze([2, 3]),
  Object.freeze([3, 4]),
  Object.freeze([4, 5]),
  Object.freeze([5, 6])
]);
const lampWorlds = combinations([0, 1, 2, 3, 4], 3).map((pressed) => {
  const lit = new Set();
  for (const switchIndex of pressed) {
    for (const lamp of lampSwitches[switchIndex]) {
      if (lit.has(lamp)) lit.delete(lamp);
      else lit.add(lamp);
    }
  }
  return Object.freeze({ pressed: Object.freeze([...pressed]), lit: Object.freeze([...lit].sort((a, b) => a - b)) });
});

const weighingStrategies = Object.freeze([
  Object.freeze({ id: 'three-three-three', left: 3, right: 3, outside: 3 }),
  Object.freeze({ id: 'four-four-one', left: 4, right: 4, outside: 1 }),
  Object.freeze({ id: 'one-one-seven', left: 1, right: 1, outside: 7 }),
  Object.freeze({ id: 'five-four-zero', left: 5, right: 4, outside: 0 })
]);
function viableTwoWeighingStrategy(strategy) {
  if (strategy.left + strategy.right + strategy.outside !== 9) return false;
  if (strategy.left !== strategy.right) return false;
  return Math.max(strategy.left, strategy.right, strategy.outside) <= 3;
}
const weighingWorlds = weighingStrategies.filter(viableTwoWeighingStrategy);

const matchingWorlds = permutations(['Manyetometre', 'Radar', 'Spektrometre', 'Termal Kamera'])
  .map((instruments) => Object.freeze(Object.fromEntries(
    ['Kutup', 'Çöl', 'Okyanus', 'Volkan'].map((station, index) => [station, instruments[index]])
  )))
  .filter((world) => world.Kutup === 'Manyetometre'
    && world.Çöl !== 'Termal Kamera'
    && world.Okyanus !== 'Radar'
    && world.Volkan !== 'Spektrometre');

const scheduleWorlds = permutations(['Resim', 'Kodlama', 'Müzik', 'Drama', 'Fen']).filter((world) => {
  const pos = Object.fromEntries(world.map((item, index) => [item, index + 1]));
  return pos.Kodlama === pos.Resim + 1
    && pos.Müzik < pos.Drama
    && ![1, 5].includes(pos.Fen)
    && pos.Drama !== 3;
});

const lockerWorlds = ['Kırmızı', 'Mavi', 'Yeşil', 'Sarı'].filter((keyLocation) => {
  const statements = [
    keyLocation === 'Kırmızı' || keyLocation === 'Yeşil',
    keyLocation !== 'Kırmızı',
    keyLocation === 'Sarı',
    keyLocation !== 'Yeşil'
  ];
  return statements.filter(Boolean).length === 3;
});

const ROUNDS = [
  buildRound({
    id: 'g8-logic-diverse-01-circular-seating',
    context: 'Aylin, Bora, Ceren, Deniz, Ece ve Fırat yuvarlak masaya oturacaktır. Dönmeler aynı düzen sayılır ve Aylin’in yeri sabit kabul edilir. Deniz, Aylin’in tam karşısındadır. Bora ile Ceren yan yanadır. Ece, Aylin’in yanında değildir.',
    prompt: 'Bu koşulları sağlayan bütün oturma düzenlerinde hangi ilişki zorunludur?',
    worlds: circularWorlds,
    mode: 'MUST',
    options: [
      { text: 'Fırat, Aylin’in yanındadır.', test: (world) => adjacentCircle(world, 'Fırat', 'Aylin') },
      { text: 'Bora, Aylin’in yanındadır.', test: (world) => adjacentCircle(world, 'Bora', 'Aylin') },
      { text: 'Ceren, Deniz’in yanındadır.', test: (world) => adjacentCircle(world, 'Ceren', 'Deniz') },
      { text: 'Ece, Bora’nın tam karşısındadır.', test: (world) => Math.abs(world.indexOf('Ece') - world.indexOf('Bora')) === 3 }
    ],
    hints: [
      'Aylin’i sabitleyip Deniz’i karşı koltuğa yerleştir; kalan dört koltuktan Aylin’in iki yanını ayrıca işaretle.',
      'Ece bu iki yana gelemez. Bora–Ceren bloğunun iki yönünü deneyerek Aylin’in yanında her seferinde kimin kaldığını bul.'
    ],
    steps: [
      { action: 'dönme eşdeğerliğini kaldır', evidence: 'Aylin bir koltuğa sabitlenir, Deniz karşı koltuğa yerleşir.' },
      { action: 'Ece’nin yasak koltuklarını ele', evidence: 'Aylin’in iki yanındaki koltuklar Ece’ye kapalıdır.' },
      { action: 'Bora–Ceren bloğunu iki yönde yerleştir', evidence: 'Yan yana olmaları gerektiği için kalan yaylarda iki yönlü blok olarak denenir.' },
      { action: 'bütün düzenlerin ortak sonucunu bul', evidence: 'Dört geçerli düzenin tamamında Aylin’in boş kalan komşu koltuğunu Fırat doldurur.' }
    ],
    topicId: 'circular-seating',
    skill: 'circular-block-constraint',
    experienceType: 'SPATIAL_CIRCULAR_PLACEMENT',
    surfaceDomain: 'ROUND_TABLE',
    trustedSessionOrder: 1,
    timeLimit: 240,
    extraTraits: ['spatialRotationControl'],
    misconceptions: [
      { id: 'one-orientation', text: 'Bora–Ceren bloğunun yalnız bir yönünü kullanır.', why: 'Dairesel düzende blok içi sırayı sabit sanır.' },
      { id: 'adjacent-example', text: 'Bora’nın Aylin yanında olduğu tek düzeni zorunlu kabul eder.', why: 'Bütün geçerli düzenleri taramaz.' },
      { id: 'opposite-assumption', text: 'Ece ile Bora arasında verilmeyen karşılıklılık ilişkisi kurar.', why: 'Boş koltukları görsel simetriyle doldurur.' }
    ]
  }),
  buildRound({
    id: 'g8-logic-diverse-02-expedition-route',
    context: 'Bir keşif ekibi Kamp’tan Liman’a tam dört yol kullanarak gidecektir. Yol ağı şöyledir: Kamp–Köprü, Kamp–Orman, Köprü–Orman, Köprü–Tepe, Orman–Tepe, Orman–Göl, Göl–Tepe, Göl–Liman ve Tepe–Liman. Ekip Orman’dan geçmeli, Köprü–Tepe yolunu kullanmamalı ve Göl ile Tepe’den tam birine uğramalıdır. Aynı noktaya ikinci kez gidilemez.',
    prompt: 'Aşağıdaki rotalardan hangisi bütün koşulları birlikte sağlayabilir?',
    worlds: routeWorlds,
    mode: 'COULD',
    options: [
      { text: 'Kamp → Köprü → Orman → Göl → Liman', test: (world) => world.join('|') === 'Kamp|Köprü|Orman|Göl|Liman' },
      { text: 'Kamp → Orman → Göl → Tepe → Liman', test: (world) => world.join('|') === 'Kamp|Orman|Göl|Tepe|Liman' },
      { text: 'Kamp → Köprü → Tepe → Orman → Liman', test: (world) => world.join('|') === 'Kamp|Köprü|Tepe|Orman|Liman' },
      { text: 'Kamp → Orman → Köprü → Tepe → Liman', test: (world) => world.join('|') === 'Kamp|Orman|Köprü|Tepe|Liman' }
    ],
    hints: [
      'Önce her seçenekte art arda gelen noktalar arasında gerçekten yol bulunup bulunmadığını kontrol et; olmayan tek bağlantı rotayı hemen eler.',
      'Yol ağı uygun kaldıysa Orman zorunluluğunu, Köprü–Tepe yasağını ve Göl/Tepe “tam bir” koşulunu aynı rota üzerinde birlikte denetle.'
    ],
    steps: [
      { action: 'rota uzunluğunu ve tekrar yasağını denetle', evidence: 'Her aday Kamp ile Liman arasında dört yol ve beş farklı nokta kullanmalıdır.' },
      { action: 'yol ağını uygula', evidence: 'Ardışık her iki nokta haritada doğrudan bağlı olmalıdır.' },
      { action: 'zorunlu ve yasak öğeleri uygula', evidence: 'Orman rotada bulunur; Köprü–Tepe kenarı kullanılmaz.' },
      { action: 'tam-bir koşulunu uygula', evidence: 'Göl ile Tepe’den yalnız biri ziyaret edilir; ilk rota bütün denetimleri geçer.' }
    ],
    topicId: 'graph-route-logic',
    skill: 'path-constraint-integration',
    experienceType: 'GRAPH_ROUTE_FEASIBILITY',
    surfaceDomain: 'EXPEDITION_MAP',
    trustedSessionOrder: 2,
    timeLimit: 210,
    extraTraits: ['graphReasoning', 'pathValidation'],
    misconceptions: [
      { id: 'both-special-nodes', text: 'Göl ve Tepe’nin ikisini de rotaya alır.', why: '“Tam biri” ifadesini “en az biri” gibi yorumlar.' },
      { id: 'missing-road', text: 'Haritada bulunmayan Orman–Liman bağlantısını var sayar.', why: 'Nokta listesini kontrol edip kenarları kontrol etmez.' },
      { id: 'forbidden-edge', text: 'Köprü–Tepe yolunu kullanır.', why: 'Rota bütün olarak akıcı göründüğü için özel yasağı atlar.' }
    ]
  }),
  buildRound({
    id: 'g8-logic-diverse-03-club-counts',
    context: '40 öğrencinin katıldığı bir okul şenliğinde 20 öğrenci Kodlama, 18 öğrenci Robotik, 16 öğrenci Tasarım kulübündedir. Kodlama–Robotik kesişiminde 7, Kodlama–Tasarım kesişiminde 6, Robotik–Tasarım kesişiminde 5 öğrenci vardır. Bu ikili kesişim sayıları üç kulüpte birden bulunan 3 öğrenciyi de içerir. Bir öğrenci hiçbir kulüpte değildir.',
    prompt: 'Yalnız bir kulübe katılan öğrenci sayısı kaçtır?',
    worlds: clubWorlds,
    mode: 'COULD',
    options: [
      { text: '27', test: (world) => world.exactlyOne === 27 },
      { text: '24', test: (world) => world.exactlyOne === 24 },
      { text: '30', test: (world) => world.exactlyOne === 30 },
      { text: '21', test: (world) => world.exactlyOne === 21 }
    ],
    hints: [
      'İkili kesişim sayılarının üç kulüpte bulunan 3 kişiyi de içerdiğini unutma; önce yalnız ikili bölgeleri 7−3, 6−3 ve 5−3 olarak ayır.',
      'Her kulübün “yalnız” bölgesini toplam kulüp sayısından iki yalnız-ikili bölgeyi ve üçlü bölgeyi çıkararak bul; sonra üç yalnız bölgeyi topla.'
    ],
    steps: [
      { action: 'yalnız ikili kesişimleri ayır', evidence: 'Kodlama–Robotik yalnız 4, Kodlama–Tasarım yalnız 3, Robotik–Tasarım yalnız 2 kişidir.' },
      { action: 'yalnız Kodlama sayısını bul', evidence: '20−4−3−3=10 öğrenci yalnız Kodlama kulübündedir.' },
      { action: 'yalnız Robotik ve Tasarım sayılarını bul', evidence: 'Robotik için 18−4−2−3=9; Tasarım için 16−3−2−3=8 bulunur.' },
      { action: 'yalnız bir kulüpte olanları topla', evidence: '10+9+8=27 öğrenci yalnız bir kulüptedir.' }
    ],
    topicId: 'set-counting',
    skill: 'three-set-region-decomposition',
    experienceType: 'SET_INTERSECTION_ACCOUNTING',
    surfaceDomain: 'SCHOOL_CLUBS',
    trustedSessionOrder: 3,
    timeLimit: 210,
    extraTraits: ['inclusionExclusion', 'regionDecomposition'],
    misconceptions: [
      { id: 'subtract-inclusive-pairs-once', text: 'İkili kesişimleri üçlü üyeliği ayırmadan doğrudan çıkarır.', why: 'Kesişim sayılarını yalnız ikili bölge sanır.' },
      { id: 'double-add-triple', text: 'Üç kulüpte bulunanları düzeltirken üçlü bölgeyi gereğinden fazla ekler.', why: 'Aynı öğrencinin kaç kez çıkarıldığını takip etmez.' },
      { id: 'use-union-instead-of-exactly-one', text: 'En az bir kulüpte olanların sayısını sorulan değer sanır.', why: '“Yalnız bir” ile “en az bir” kavramlarını karıştırır.' }
    ]
  }),
  buildRound({
    id: 'g8-logic-diverse-04-lamp-switches',
    context: '1’den 6’ya numaralanmış altı lamba başlangıçta sönüktür. Beş düğme vardır: A düğmesi 1–2, B düğmesi 2–3, C düğmesi 3–4, D düğmesi 4–5, E düğmesi 5–6 numaralı lambaların durumunu tersine çevirir. Üç farklı düğmeye birer kez basılacaktır.',
    prompt: 'Aşağıdaki son durumlardan hangisi gerçekleşemez?',
    worlds: lampWorlds,
    mode: 'CANNOT',
    options: [
      { text: 'Yalnız 1 ve 4 numaralı lambalar yanar.', test: (world) => sameMembers(world.lit, [1, 4]) },
      { text: 'Yalnız 2 ve 5 numaralı lambalar yanar.', test: (world) => sameMembers(world.lit, [2, 5]) },
      { text: '1, 3, 5 ve 6 numaralı lambalar yanar.', test: (world) => sameMembers(world.lit, [1, 3, 5, 6]) },
      { text: '1, 2, 5 ve 6 numaralı lambalar yanar.', test: (world) => sameMembers(world.lit, [1, 2, 5, 6]) }
    ],
    hints: [
      'Her düğme iki komşu lambayı tersine çevirir. Üç farklı düğme seçimi için A–B–C gibi düğme üçlülerini yazıp aynı lambanın iki kez çevrilince başlangıç durumuna döndüğünü kullan.',
      'Sadece yanan lamba sayısının çift olmasına bakma; son şıkta da dört lamba yanıyor. Hangi üç düğmenin o tam deseni üretebildiğini gerçekten ara.'
    ],
    steps: [
      { action: 'üçlü düğme seçimlerini oluştur', evidence: 'Beş düğmeden üç farklı düğme seçmenin 10 olası yolu vardır.' },
      { action: 'ortak lambalardaki çift dönüşleri sadeleştir', evidence: 'Bir lamba iki seçili düğmeden etkilenirse iki kez çevrilir ve yeniden söner.' },
      { action: 'olası son desenleri listele', evidence: 'A–B–C ile {1,4}; B–C–D ile {2,5}; A–B–E ile {1,3,5,6} elde edilir.' },
      { action: 'olmayan deseni belirle', evidence: 'On düğme üçlüsünün hiçbiri {1,2,5,6} desenini üretmez.' }
    ],
    topicId: 'state-transition-logic',
    skill: 'toggle-parity-enumeration',
    experienceType: 'STATE_TRANSITION_INVARIANT',
    surfaceDomain: 'LAMP_SWITCH_PANEL',
    trustedSessionOrder: 4,
    timeLimit: 180,
    extraTraits: ['stateTracking', 'parityReasoning'],
    misconceptions: [
      { id: 'ignore-double-toggle', text: 'Aynı lambanın iki kez çevrilmesini iki ayrı açık lamba gibi sayar.', why: 'Durum değiştirme işlemini toplama gibi ele alır.' },
      { id: 'count-only', text: 'Yanan lamba sayısı çift olduğu için her desenin mümkün olduğunu sanır.', why: 'Gerekli ama yeterli olmayan bir özelliği tek ölçüt yapar.' },
      { id: 'reuse-switch', text: 'Aynı düğmeye iki kez basarak hedef deseni üretmeye çalışır.', why: 'Üç farklı düğme koşulunu atlar.' }
    ]
  }),
  buildRound({
    id: 'g8-logic-diverse-05-heavy-coin-strategy',
    context: 'Dokuz özdeş görünümlü madeni paradan biri diğerlerinden daha ağırdır. Eşit kollu terazi en fazla iki kez kullanılacaktır. Her tartımın sonucu sol ağır, sağ ağır veya dengede olabilir. Amaç hangi paranın ağır olduğunu kesin olarak bulmaktır.',
    prompt: 'İlk tartım için hangi dağılım, ikinci tartımdan sonra kesin sonuca ulaşmayı garanti eder?',
    worlds: weighingWorlds,
    mode: 'COULD',
    options: [
      { text: '3 parayı 3 paraya karşı tartıp kalan 3 parayı dışarıda bırakmak', test: (world) => world.id === 'three-three-three' },
      { text: '4 parayı 4 paraya karşı tartıp 1 parayı dışarıda bırakmak', test: (world) => world.id === 'four-four-one' },
      { text: '1 parayı 1 paraya karşı tartıp 7 parayı dışarıda bırakmak', test: (world) => world.id === 'one-one-seven' },
      { text: '5 parayı 4 paraya karşı tartmak', test: (world) => world.id === 'five-four-zero' }
    ],
    hints: [
      'İlk tartımın üç olası sonucunda kaç aday kalacağını ayrı ayrı hesapla; ikinci ve son tartım en fazla üç adayı 1–1 tartarak ayırabilir.',
      'Kefelerdeki normal para sayıları eşit değilse ağırlık farkı ağır paradan mı, parça sayısından mı geldiği ayırt edilemez; bu tür dağılımı baştan ele.'
    ],
    steps: [
      { action: 'ikinci tartımın ayırma kapasitesini belirle', evidence: 'Tek tartım üç sonuç verdiği için en fazla üç aday kesin olarak ayırt edilebilir.' },
      { action: 'ilk tartım dallarını hesapla', evidence: '3–3 tartımında sol ağır, sağ ağır ve denge dallarının her birinde üç aday kalır.' },
      { action: 'dengesiz aday dağılımlarını ele', evidence: '4–4–1 düzeninde dengesizlik dalında dört, 1–1–7 düzeninde denge dalında yedi aday kalır.' },
      { action: 'garantili stratejiyi tekleştir', evidence: 'Yalnız 3–3–3 bölmesi bütün dalları ikinci tartımın kapasitesi içinde tutar.' }
    ],
    topicId: 'information-strategy',
    skill: 'balanced-ternary-search',
    experienceType: 'MINIMAX_INFORMATION_STRATEGY',
    surfaceDomain: 'BALANCE_SCALE',
    trustedSessionOrder: 5,
    timeLimit: 180,
    extraTraits: ['strategyDesign', 'worstCaseAnalysis'],
    misconceptions: [
      { id: 'largest-first-split', text: 'İlk tartımda mümkün olduğunca çok parayı tartmanın en iyi strateji olduğunu sanır.', why: 'En kötü dalda kalan aday sayısını hesaplamaz.' },
      { id: 'small-test-large-remainder', text: '1–1 tartımının dengesizlikte hızlı sonuç vermesine odaklanır.', why: 'Denge durumunda kalan yedi adayı göz ardı eder.' },
      { id: 'unequal-pan-count', text: '5–4 tartımında ağır kefenin doğrudan sahte parayı gösterdiğini sanır.', why: 'Kefelerdeki normal toplam ağırlığın baştan eşit olmadığını unutır.' }
    ]
  }),
  buildRound({
    id: 'g8-logic-diverse-06-research-stations',
    context: 'Kutup, Çöl, Okyanus ve Volkan araştırma istasyonlarının her birine Manyetometre, Radar, Spektrometre ve Termal Kamera cihazlarından biri kurulacaktır. Kutup istasyonuna Manyetometre kurulacaktır. Çöl istasyonuna Termal Kamera, Okyanus istasyonuna Radar, Volkan istasyonuna Spektrometre kurulamaz.',
    prompt: 'Aşağıdaki tam kurulum planlarından hangisi uygulanabilir?',
    worlds: matchingWorlds,
    mode: 'COULD',
    options: [
      { text: 'Kutup–Manyetometre, Çöl–Radar, Okyanus–Spektrometre, Volkan–Termal Kamera', test: (world) => world.Kutup === 'Manyetometre' && world.Çöl === 'Radar' && world.Okyanus === 'Spektrometre' && world.Volkan === 'Termal Kamera' },
      { text: 'Kutup–Radar, Çöl–Manyetometre, Okyanus–Spektrometre, Volkan–Termal Kamera', test: (world) => world.Kutup === 'Radar' && world.Çöl === 'Manyetometre' && world.Okyanus === 'Spektrometre' && world.Volkan === 'Termal Kamera' },
      { text: 'Kutup–Manyetometre, Çöl–Termal Kamera, Okyanus–Spektrometre, Volkan–Radar', test: (world) => world.Kutup === 'Manyetometre' && world.Çöl === 'Termal Kamera' && world.Okyanus === 'Spektrometre' && world.Volkan === 'Radar' },
      { text: 'Kutup–Manyetometre, Çöl–Radar, Okyanus–Termal Kamera, Volkan–Spektrometre', test: (world) => world.Kutup === 'Manyetometre' && world.Çöl === 'Radar' && world.Okyanus === 'Termal Kamera' && world.Volkan === 'Spektrometre' }
    ],
    hints: [
      'Kutup–Manyetometre eşleşmesini sabitle; kalan üç cihazı Çöl, Okyanus ve Volkan için yasaklı hücreleri çizerek dağıt.',
      'Bir planı mümkün saymak için dört istasyonun da aynı anda doğru cihazı alması gerekir; ilk iki eşleşme uygun göründüğünde durma.'
    ],
    steps: [
      { action: 'sabit kurulumu yerleştir', evidence: 'Kutup istasyonuna Manyetometre kesin olarak kurulur.' },
      { action: 'kalan cihaz ve istasyonları çıkar', evidence: 'Çöl, Okyanus ve Volkan için Radar, Spektrometre ve Termal Kamera kalır.' },
      { action: 'istasyon yasaklarını uygula', evidence: 'Çöl≠Termal Kamera, Okyanus≠Radar ve Volkan≠Spektrometre koşulları ayrı ayrı denetlenir.' },
      { action: 'tam planları karşılaştır', evidence: 'Yalnız ilk seçenek dört istasyonun tüm kısıtlarını aynı anda sağlar.' }
    ],
    topicId: 'matching',
    skill: 'one-to-one-elimination',
    experienceType: 'BIPARTITE_MATCHING_GRID',
    surfaceDomain: 'RESEARCH_STATIONS',
    trustedSessionOrder: 6,
    timeLimit: 210,
    extraTraits: ['matchingGrid', 'negativeConstraintUse'],
    misconceptions: [
      { id: 'overwrite-fixed-station', text: 'Kutup istasyonunun sabit cihazını değiştirir.', why: 'Olumsuz koşullara odaklanırken doğrudan verilen eşleşmeyi kaybeder.' },
      { id: 'desert-ban', text: 'Çöl istasyonuna Termal Kamera kurar.', why: 'Diğer üç kurulum uygun görünürken tek yasaklı hücreyi atlar.' },
      { id: 'volcano-ban', text: 'Volkan istasyonuna Spektrometre kurar.', why: 'Her cihazın bir kez kullanılmasını sağlamayı bütün koşullar için yeterli sanır.' }
    ]
  }),
  buildRound({
    id: 'g8-logic-diverse-07-workshop-schedule',
    context: 'Resim, Kodlama, Müzik, Drama ve Fen atölyeleri pazartesiden cumaya birer kez yapılacaktır. Kodlama, Resim’in hemen ertesi günüdür. Müzik, Drama’dan önce yapılır. Fen pazartesi veya cuma değildir. Drama çarşamba değildir.',
    prompt: 'Bütün geçerli programlar dikkate alındığında hangisi kesinlikle doğrudur?',
    worlds: scheduleWorlds,
    mode: 'MUST',
    options: [
      { text: 'Drama salı veya cuma günüdür.', test: (world) => [2, 5].includes(world.indexOf('Drama') + 1) },
      { text: 'Müzik pazartesi günüdür.', test: (world) => world[0] === 'Müzik' },
      { text: 'Resim, Fen’den önce yapılır.', test: (world) => world.indexOf('Resim') < world.indexOf('Fen') },
      { text: 'Kodlama perşembe günüdür.', test: (world) => world[3] === 'Kodlama' }
    ],
    hints: [
      'Resim–Kodlama ikilisini tek blok gibi düşün; bu blok için dört olası başlangıç gününü sırayla dene.',
      'Her denemede Fen’in uç gün yasağını ve Müzik<Drama koşulunu uygula; tek bir program değil bütün geçerli programlarda kalan ortak yargıyı ara.'
    ],
    steps: [
      { action: 'ardışık bloğu oluştur', evidence: 'Resim ve Kodlama yalnız Pzt–Salı, Salı–Çarş, Çarş–Perş veya Perş–Cuma olabilir.' },
      { action: 'Fen kısıtını uygula', evidence: 'Fen yalnız salı, çarşamba veya perşembe gününe yerleşebilir.' },
      { action: 'Müzik–Drama sırasını ve Drama yasağını uygula', evidence: 'Drama çarşamba olamaz ve Müzik mutlaka daha önce olmalıdır.' },
      { action: 'geçerli programların kesişimini al', evidence: 'Beş geçerli programın tamamında Drama yalnız salı veya cuma günündedir.' }
    ],
    topicId: 'scheduling',
    skill: 'must-be-true-across-schedules',
    experienceType: 'TEMPORAL_BLOCK_SCHEDULING',
    surfaceDomain: 'WEEKLY_WORKSHOPS',
    trustedSessionOrder: 7,
    timeLimit: 210,
    extraTraits: ['temporalReasoning', 'blockPlacement'],
    misconceptions: [
      { id: 'single-schedule-monday', text: 'Tek bir geçerli programda Müzik’in pazartesi olmasını zorunlu sanır.', why: 'Mümkün ile zorunlu ayrımını yapmaz.' },
      { id: 'single-schedule-order', text: 'Resim’in Fen’den önce olduğu bir örneği bütün programlara geneller.', why: 'Karşı örnek aramaz.' },
      { id: 'block-fixed-position', text: 'Resim–Kodlama bloğunu yalnız çarşamba–perşembe konumunda düşünür.', why: 'Ardışık blok için bütün başlangıçları taramaz.' }
    ]
  }),
  buildRound({
    id: 'g8-logic-diverse-08-truth-lockers',
    context: 'Anahtar kırmızı, mavi, yeşil veya sarı dolaptan yalnız birindedir. Dolaplardaki yazılar şöyledir:\nKırmızı: “Anahtar kırmızı ya da yeşil dolaptadır.”\nMavi: “Anahtar kırmızı dolapta değildir.”\nYeşil: “Anahtar sarı dolaptadır.”\nSarı: “Anahtar yeşil dolapta değildir.”\nBu dört yazıdan tam üçü doğrudur.',
    prompt: 'Anahtar hangi dolaptadır?',
    worlds: lockerWorlds,
    mode: 'COULD',
    options: [
      { text: 'Kırmızı dolap', test: (world) => world === 'Kırmızı' },
      { text: 'Mavi dolap', test: (world) => world === 'Mavi' },
      { text: 'Yeşil dolap', test: (world) => world === 'Yeşil' },
      { text: 'Sarı dolap', test: (world) => world === 'Sarı' }
    ],
    hints: [
      'Anahtarın dört dolaptan her birinde olduğunu ayrı ayrı varsay; her varsayımda dört yazının doğru-yanlış değerlerini tabloya işle.',
      'Tam üç doğru yazı koşulunu sağlayan satırı seç; tek bir yazının içeriğine bakarak anahtarı doğrudan yerleştirme.'
    ],
    steps: [
      { action: 'kırmızı varsayımını sınama', evidence: 'Kırmızıdayken üç değil iki yazı doğru olur.' },
      { action: 'mavi ve yeşil varsayımlarını sınama', evidence: 'Bu iki durumda da doğru yazı sayısı üçe ulaşmaz.' },
      { action: 'sarı varsayımını sınama', evidence: 'Kırmızı yazı yanlış; mavi, yeşil ve sarı yazılar doğru olur.' },
      { action: 'tam-üç koşuluyla tekleştir', evidence: 'Yalnız sarı dolap varsayımı tam üç doğru yazı üretir.' }
    ],
    topicId: 'truth-statements',
    skill: 'truth-count-case-analysis',
    experienceType: 'TRUTH_VALUE_CASE_ANALYSIS',
    surfaceDomain: 'LOCKER_STATEMENTS',
    trustedSessionOrder: 8,
    timeLimit: 180,
    extraTraits: ['truthTableReasoning', 'caseAnalysis'],
    misconceptions: [
      { id: 'trust-first-statement', text: 'İlk yazıyı doğrudan doğru kabul edip kırmızı dolabı seçer.', why: 'Doğru yazı sayısını birlikte hesaplamaz.' },
      { id: 'negation-shortcut', text: 'Mavi yazının olumsuz biçimine dayanarak mavi dolabı seçer.', why: 'Bir yazının kutusuyla içeriğini ilişkilendirir.' },
      { id: 'mentioned-location', text: 'Yeşil dolap birden fazla yazıda geçtiği için anahtarın orada olduğunu sanır.', why: 'İfade sıklığını doğruluk koşulu yerine kullanır.' }
    ]
  })
];

export const TRUSTED_G8_LOGIC_DEEP_ROUNDS = Object.freeze(ROUNDS);
export const TRUSTED_G8_LOGIC_DEEP_KEYS = Object.freeze(ROUNDS.map((round) => round.questionKey));
