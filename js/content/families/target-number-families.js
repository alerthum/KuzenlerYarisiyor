// Aşama 04 — target-number (Hedef Sayı) için gerçek Aile→İskelet→Düşünme
// Yolu içeriği. `js/quality/family-skeleton-engine.js` sözleşmesine uyar.
//
// Bir ailenin kimliğini SAYI DEĞERİ değil, İFADENİN YAPISI belirler: 12 aile,
// hangi işlemlerin hangi sırada/gruplamada birleştiği arasındaki GERÇEK
// yapısal farkı temsil eder (bkz. md/arsiv/DIFF_ANALYSIS.md §5).
//
// target-number'ın arayüz kısıtı (serbest ifade kurucu yalnız "verilen tüm
// sayıları birer kez kullanarak hedefe ulaş" görevini destekler) nedeniyle 4
// görev türünün 2'si `kind:'expression'` (mevcut arayüz, değişmedi), 2'si
// `kind:'choice'` (pattern-lab/speed-math'te zaten var olan ortak arayüz)
// kullanır — bkz. md/arsiv/DIFF_ANALYSIS.md §4.
//
//   İskeletler (görev):
//     - direct-reach            (expression): sayılar+hedef verilir, serbest ifade kur
//     - verify-and-correct      (expression): arkadaşın yanlış ifadesi gösterilir, doğrusu kurulur
//     - missing-number-reverse  (choice): ifadenin yapısı verilir, tek sayı "?" ile gizli
//     - compare-two-expressions (choice): 4 farklı ifadeden hedefi veren tek biri seçilir
//   Düşünme yolları (temsil):
//     - raw-expression        : sayılar/ifade çıplak
//     - context-embedded      : gerçek bir cümleye gömülü
//     - staged-strategy-hint  : hangi sayı/işlem kullanılacağı söylenmeden soyut strateji ipucu

import { evaluateExpression } from '../../engines/math-engine.js';

function randomInt(random, min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function capitalize(text) {
  return text.charAt(0).toLocaleUpperCase('tr-TR') + text.slice(1);
}

function evalNum(expr) {
  return evaluateExpression(expr).toNumber();
}

const CONTEXTS = [
  { label: 'bir yarışma puanlama tablosu', unit: 'puan' },
  { label: 'bir kamp organizasyonundaki malzeme sayıları', unit: 'malzeme' },
  { label: 'bir pazar tezgâhındaki ürün sayıları', unit: 'ürün' },
  { label: 'bir okul etkinliğindeki katılımcı sayıları', unit: 'katılımcı' },
  { label: 'bir bahçedeki fidan sayıları', unit: 'fidan' }
];

function pickContext(random) {
  return CONTEXTS[Math.floor(random() * CONTEXTS.length)];
}

function wrapKey(skeletonId, pathId, raw) {
  return `target-number:${skeletonId}:${pathId}:${raw}`;
}

const PATH_IDS = ['raw-expression', 'context-embedded', 'staged-strategy-hint'];

const TASK_TRAITS = {
  direct: ['strategySelection', 'multiStepInference'],
  verify: ['errorAnalysis', 'conditionEvaluation'],
  missing: ['reverseThinking', 'informationLinking'],
  compare: ['usingIntermediateResultInNewDecision', 'strategySelection']
};

function buildChoiceOptions(correctValue, otherValues, random) {
  const values = [correctValue, ...otherValues];
  const list = [...values];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list.map(String);
}

// ---- İskelet üreticileri (aileden bağımsız, ortak instance şekli üzerinden) ----

function generateDirectReach(skeletonId, inst, pathId, random) {
  const structureCue = inst.structureCue || skeletonId.split(':')[0].replace(/-/g, ' ');
  const base = {
    kind: 'expression',
    prompt: `${capitalize(structureCue)} yapısıyla hedefe ulaş: tüm sayıları birer kez kullan.`,
    numbers: [...inst.numbers],
    target: inst.target,
    solution: inst.solution
  };
  if (pathId === 'raw-expression') {
    return {
      ...base,
      rule: `${capitalize(structureCue)} düzeninde verilen tüm sayıları birer kez kullanarak hedefe ulaş. +, −, ×, ÷ ve parantez kullanabilirsin.`,
      explanation: inst.explanation,
      questionKey: wrapKey(skeletonId, pathId, `${inst.numbers.join(',')}:${inst.target}`)
    };
  }
  if (pathId === 'context-embedded') {
    const ctx = pickContext(random);
    return {
      ...base,
      prompt: `${capitalize(ctx.label)} için ${structureCue} yapısıyla hedefe ulaş.`,
      rule: `${capitalize(ctx.label)} ile ilgili şu sayılar var: ${inst.numbers.join(', ')} ${ctx.unit}. ${capitalize(structureCue)} düzeninde her sayıyı birer kez kullanarak tam ${inst.target} ${ctx.unit} yapacak işlemi kur.`,
      explanation: inst.explanation,
      questionKey: wrapKey(skeletonId, pathId, `${inst.numbers.join(',')}:${inst.target}:${ctx.unit}`)
    };
  }
  return {
    ...base,
    prompt: `${capitalize(structureCue)} stratejisiyle hedefe ulaş.`,
    rule: `${inst.stagedHint} ${capitalize(structureCue)} yapısını koruyarak ${inst.target} hedefine ulaş.`,
    explanation: inst.explanation,
    questionKey: wrapKey(skeletonId, pathId, `${inst.numbers.join(',')}:${inst.target}:staged`)
  };
}

function generateVerifyAndCorrect(skeletonId, inst, pathId, random) {
  const base = { kind: 'expression', prompt: 'Arkadaşının hatasını bul, aynı sayılarla doğru sonuca ulaş.', numbers: [...inst.numbers], target: inst.target, solution: inst.solution };
  const friendNote = `Bir arkadaşın şu işlemi denedi: ${inst.wrongExpr} ve sonucu ${inst.wrongResult} buldu; bu, hedef olan ${inst.target}'ten farklı.`;
  const explanation = `${inst.explanation} ${inst.mistakeExplanation}`;
  if (pathId === 'raw-expression') {
    return {
      ...base,
      rule: `${friendNote} Aynı sayıları kullanarak doğru şekilde ${inst.target} hedefine ulaş.`,
      explanation,
      questionKey: wrapKey(skeletonId, pathId, `${inst.numbers.join(',')}:${inst.wrongExpr}:${inst.target}`)
    };
  }
  if (pathId === 'context-embedded') {
    const ctx = pickContext(random);
    return {
      ...base,
      rule: `${capitalize(ctx.label)} ile ilgili şu sayılar var: ${inst.numbers.join(', ')} ${ctx.unit}. Bir arkadaşın ${inst.wrongExpr} işlemini yapıp ${inst.wrongResult} ${ctx.unit} bulmuş; bu hedef olan ${inst.target} ${ctx.unit}'ten farklı. Sen doğrusunu kur.`,
      explanation,
      questionKey: wrapKey(skeletonId, pathId, `${inst.numbers.join(',')}:${inst.wrongExpr}:${inst.target}:${ctx.unit}`)
    };
  }
  return {
    ...base,
    rule: `${friendNote} ${inst.stagedHint} Bu stratejiyle doğru sonucu bul.`,
    explanation,
    questionKey: wrapKey(skeletonId, pathId, `${inst.numbers.join(',')}:${inst.wrongExpr}:${inst.target}:staged`)
  };
}

function generateMissingNumberReverse(skeletonId, inst, pathId, random) {
  const options = buildChoiceOptions(inst.missingValue, inst.missingDistractors, random);
  const answerIndex = options.indexOf(String(inst.missingValue));
  const explanation = `İfade: ${inst.solution} = ${inst.target}. Bu yüzden ? = ${inst.missingValue}.`;
  if (pathId === 'raw-expression') {
    return {
      kind: 'choice',
      prompt: `${inst.template} = ${inst.target}`,
      context: '? yerine gelmesi gereken sayıyı bul.',
      options, answerIndex, explanation,
      questionKey: wrapKey(skeletonId, pathId, `${inst.template}:${inst.target}`)
    };
  }
  if (pathId === 'context-embedded') {
    const ctx = pickContext(random);
    return {
      kind: 'choice',
      prompt: `${capitalize(ctx.label)} ile ilgili bir hesaplamada "${inst.template}" işlemi yapılmış ve sonuç ${inst.target} ${ctx.unit} bulunmuş.`,
      context: '? yerine gelmesi gereken sayı kaçtır?',
      options, answerIndex, explanation,
      questionKey: wrapKey(skeletonId, pathId, `${inst.template}:${inst.target}:${ctx.unit}`)
    };
  }
  return {
    kind: 'choice',
    prompt: `${inst.template} = ${inst.target}`,
    context: `${inst.stagedHint} Bu ifadedeki ? yerine gelmesi gereken sayıyı bul.`,
    options, answerIndex, explanation,
    questionKey: wrapKey(skeletonId, pathId, `${inst.template}:${inst.target}:staged`)
  };
}

function generateCompareExpressions(skeletonId, inst, pathId, random) {
  const labeled = shuffleLabeled(inst.candidates, random);
  const options = labeled.map((c) => c.expr);
  const answerIndex = labeled.findIndex((c) => c.isCorrect);
  const explanation = `Sonuçlar: ${labeled.map((c) => `${c.expr} = ${c.value}`).join(', ')}. Hedef ${inst.target} olduğu için doğru ifade ${inst.solution}'dir.`;
  if (pathId === 'raw-expression') {
    return {
      kind: 'choice',
      prompt: `Aşağıdaki ifadelerden hangisinin sonucu ${inst.target}'e eşittir?`,
      context: 'Her ifadeyi ayrı ayrı hesapla, sonra hedefle karşılaştır.',
      options, answerIndex, explanation,
      questionKey: wrapKey(skeletonId, pathId, `${options.join('|')}:${inst.target}`)
    };
  }
  if (pathId === 'context-embedded') {
    const ctx = pickContext(random);
    return {
      kind: 'choice',
      prompt: `${capitalize(ctx.label)} için hesaplanan aşağıdaki ifadelerden hangisi tam olarak ${inst.target} ${ctx.unit} verir?`,
      context: 'Her ifadeyi ayrı ayrı hesapla, sonra hedefle karşılaştır.',
      options, answerIndex, explanation,
      questionKey: wrapKey(skeletonId, pathId, `${options.join('|')}:${inst.target}:${ctx.unit}`)
    };
  }
  return {
    kind: 'choice',
    prompt: `Aşağıdaki ifadelerden hangisinin sonucu ${inst.target}'e eşittir?`,
    context: `${inst.stagedHint} Bu stratejiyi kullanarak doğru ifadeyi seç.`,
    options, answerIndex, explanation,
    questionKey: wrapKey(skeletonId, pathId, `${options.join('|')}:${inst.target}:staged`)
  };
}

function shuffleLabeled(candidates, random) {
  const list = [...candidates];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function buildFamily(familyId, buildInstance) {
  const directId = `${familyId}:direct-reach`;
  const verifyId = `${familyId}:verify-and-correct`;
  const missingId = `${familyId}:missing-number-reverse`;
  const compareId = `${familyId}:compare-two-expressions`;
  const structureCue = familyId.replace(/^target-/, '').replace(/-/g, ' ');
  const withCue = (random) => ({ ...buildInstance(random), structureCue });
  return {
    familyId,
    skeletons: [
      { skeletonId: directId, reasoningPathIds: PATH_IDS, cognitiveTraits: TASK_TRAITS.direct,
        generate: (random, pathId) => generateDirectReach(directId, withCue(random), pathId, random) },
      { skeletonId: verifyId, reasoningPathIds: PATH_IDS, cognitiveTraits: TASK_TRAITS.verify,
        generate: (random, pathId) => generateVerifyAndCorrect(verifyId, withCue(random), pathId, random) },
      { skeletonId: missingId, reasoningPathIds: PATH_IDS, cognitiveTraits: TASK_TRAITS.missing,
        generate: (random, pathId) => generateMissingNumberReverse(missingId, withCue(random), pathId, random) },
      { skeletonId: compareId, reasoningPathIds: PATH_IDS, cognitiveTraits: TASK_TRAITS.compare,
        generate: (random, pathId) => generateCompareExpressions(compareId, withCue(random), pathId, random) }
    ]
  };
}

// ---- 12 gerçekten farklı ifade-yapısı ailesi ----
// Her `buildInstance`, ortak alanları döndürür: numbers, target, solution,
// explanation, stagedHint, wrongExpr/wrongResult/mistakeExplanation (verify),
// template/missingValue/missingDistractors (missing-number-reverse),
// candidates (compare-two-expressions, en az 1 isCorrect:true).

function withRetry(build, random, guard = 60) {
  for (let attempt = 0; attempt < guard; attempt += 1) {
    const inst = build(random);
    if (isValidInstance(inst)) return inst;
  }
  throw new Error('target-number: geçerli bir örnek üretilemedi (guard aşıldı)');
}

function isValidInstance(inst) {
  if (!Number.isFinite(inst.target) || !Number.isInteger(inst.target)) return false;
  if (evalNum(inst.solution) !== inst.target) return false;
  if (!Number.isInteger(inst.wrongResult) || inst.wrongResult === inst.target) return false;
  const distractSet = new Set([inst.missingValue, ...inst.missingDistractors]);
  if (distractSet.size !== inst.missingDistractors.length + 1) return false;
  if (inst.missingDistractors.some((v) => !Number.isInteger(v) || v < 0)) return false;
  const candidateValues = inst.candidates.map((c) => c.value);
  if (candidateValues.some((v) => !Number.isInteger(v))) return false;
  if (new Set(candidateValues).size !== candidateValues.length) return false;
  if (inst.candidates.filter((c) => c.isCorrect).length !== 1) return false;
  return true;
}

function instSumThenScale(random) {
  return withRetry((r) => {
    const a = randomInt(r, 2, 8), b = randomInt(r, 2, 8), c = randomInt(r, 2, 5), d = randomInt(r, 1, 5);
    const sum = a + b;
    const target = sum * c - d;
    const solution = `(${a} + ${b}) × ${c} - ${d}`;
    const wrongExpr = `${a} + ${b} × ${c} - ${d}`;
    const altB = `(${a} - ${b}) × ${c} + ${d}`;
    const altC = `${a} × ${b} - ${c} - ${d}`;
    const altD = `(${a} + ${c}) × ${b} - ${d}`;
    return {
      numbers: [a, b, c, d], target, solution,
      explanation: `Önce parantez içi toplanır: ${a} + ${b} = ${sum}; sonra ${c} ile çarpılır: ${sum} × ${c} = ${sum * c}; sonra ${d} çıkarılır: ${sum * c} - ${d} = ${target}.`,
      stagedHint: 'Önce iki sayıyı toplayarak bir ara sonuç oluştur, sonra bu ara sonucu üçüncü sayıyla çarp, en son dördüncü sayıyı çıkar.',
      wrongExpr, wrongResult: evalNum(wrongExpr),
      mistakeExplanation: 'Arkadaşın parantezi göz ardı edip önce çarpmayı yapmış; hâlbuki parantez içindeki toplama önce bitirilmeli.',
      template: `(${a} + ${b}) × ? - ${d}`, missingValue: c, missingDistractors: [c + 1, Math.max(1, c - 1), c + 2],
      candidates: [
        { expr: solution, value: target, isCorrect: true },
        { expr: altB, value: evalNum(altB), isCorrect: false },
        { expr: altC, value: evalNum(altC), isCorrect: false },
        { expr: altD, value: evalNum(altD), isCorrect: false }
      ]
    };
  }, random);
}

function instProductThenAdjust(random) {
  return withRetry((r) => {
    const a = randomInt(r, 2, 9), b = randomInt(r, 2, 7), c = randomInt(r, 1, 9), d = randomInt(r, 1, 6);
    const product = a * b;
    const target = product + c - d;
    const solution = `${a} × ${b} + ${c} - ${d}`;
    const wrongExpr = `${a} × (${b} + ${c}) - ${d}`;
    const altB = `${a} × ${b} - ${c} + ${d}`;
    const altC = `${a} × ${c} + ${b} - ${d}`;
    const altD = `(${a} + ${b}) × ${c} - ${d}`;
    return {
      numbers: [a, b, c, d], target, solution,
      explanation: `Önce çarpma yapılır: ${a} × ${b} = ${product}; sonra ${c} eklenir, ${d} çıkarılır: ${product} + ${c} - ${d} = ${target}.`,
      stagedHint: 'Önce iki sayıyı çarparak bir ara sonuç oluştur, sonra bu ara sonuca üçüncü sayıyı ekle ve dördüncü sayıyı çıkar.',
      wrongExpr, wrongResult: evalNum(wrongExpr),
      mistakeExplanation: 'Arkadaşın toplamayı parantezle çarpmanın içine almış; hâlbuki işlem önceliği gereği çarpma tek başına önce yapılmalı.',
      template: `${a} × ${b} + ? - ${d}`, missingValue: c, missingDistractors: [c + 2, Math.max(0, c - 2), c + 4],
      candidates: [
        { expr: solution, value: target, isCorrect: true },
        { expr: altB, value: evalNum(altB), isCorrect: false },
        { expr: altC, value: evalNum(altC), isCorrect: false },
        { expr: altD, value: evalNum(altD), isCorrect: false }
      ]
    };
  }, random);
}

function instTwoProductsDifference(random) {
  return withRetry((r) => {
    const a = randomInt(r, 3, 9), b = randomInt(r, 2, 6), c = randomInt(r, 2, 5), d = randomInt(r, 1, 4);
    const p1 = a * b, p2 = c * d;
    const target = p1 - p2;
    const solution = `${a} × ${b} - ${c} × ${d}`;
    const wrongExpr = `${a} × (${b} - ${c}) × ${d}`;
    const altB = `${a} × ${d} - ${c} × ${b}`;
    const altC = `${a} × ${b} + ${c} × ${d}`;
    const altD = `(${a} - ${c}) × ${b} × ${d}`;
    return {
      numbers: [a, b, c, d], target, solution,
      explanation: `İki çarpma ayrı ayrı yapılır: ${a} × ${b} = ${p1}, ${c} × ${d} = ${p2}; sonra çıkarılır: ${p1} - ${p2} = ${target}.`,
      stagedHint: 'Sayıları ikişerli iki gruba ayır, her grubu ayrı ayrı çarp, sonra iki çarpımı birbirinden çıkar.',
      wrongExpr, wrongResult: evalNum(wrongExpr),
      mistakeExplanation: 'Arkadaşın iki çarpımı ayrı hesaplamak yerine hepsini tek bir zincire koymuş; hâlbuki iki çarpma birbirinden bağımsız önce bitirilmeli.',
      template: `${a} × ${b} - ${c} × ?`, missingValue: d, missingDistractors: [d + 1, Math.max(1, d - 1), d + 3],
      candidates: [
        { expr: solution, value: target, isCorrect: true },
        { expr: altB, value: evalNum(altB), isCorrect: false },
        { expr: altC, value: evalNum(altC), isCorrect: false },
        { expr: altD, value: evalNum(altD), isCorrect: false }
      ]
    };
  }, random);
}

function instTwoProductsSum(random) {
  return withRetry((r) => {
    const a = randomInt(r, 3, 9), b = randomInt(r, 2, 8), c = randomInt(r, 2, 7), d = randomInt(r, 2, 6);
    const p1 = a * b, p2 = c * d;
    const target = p1 + p2;
    const solution = `${a} × ${b} + ${c} × ${d}`;
    const wrongExpr = `${a} × (${b} + ${c}) × ${d}`;
    const altB = `${a} × ${c} + ${b} × ${d}`;
    const altC = `${a} × ${b} - ${c} × ${d}`;
    const altD = `(${a} + ${c}) × (${b} + ${d})`;
    return {
      numbers: [a, b, c, d], target, solution,
      explanation: `İki çarpma ayrı ayrı yapılır: ${a} × ${b} = ${p1}, ${c} × ${d} = ${p2}; sonra toplanır: ${p1} + ${p2} = ${target}.`,
      stagedHint: 'Sayıları ikişerli iki gruba ayır, her grubu ayrı ayrı çarp, sonra iki çarpımı topla.',
      wrongExpr, wrongResult: evalNum(wrongExpr),
      mistakeExplanation: 'Arkadaşın iki grubu birleştirip tek bir çarpma zincirine koymuş; hâlbuki iki çarpma ayrı ayrı bitirilmeli, sonra toplanmalı.',
      template: `${a} × ${b} + ${c} × ?`, missingValue: d, missingDistractors: [d + 2, Math.max(1, d - 1), d + 3],
      candidates: [
        { expr: solution, value: target, isCorrect: true },
        { expr: altB, value: evalNum(altB), isCorrect: false },
        { expr: altC, value: evalNum(altC), isCorrect: false },
        { expr: altD, value: evalNum(altD), isCorrect: false }
      ]
    };
  }, random);
}

function instBracketProduct(random) {
  return withRetry((r) => {
    const a = randomInt(r, 3, 10), b = randomInt(r, 2, 8), d = randomInt(r, 2, 5), c = randomInt(r, d + 1, d + 7);
    const sum = a + b, diff = c - d;
    const target = sum * diff;
    const solution = `(${a} + ${b}) × (${c} - ${d})`;
    const wrongExpr = `${a} + ${b} × ${c} - ${d}`;
    const altB = `(${a} - ${b}) × (${c} + ${d})`;
    const altC = `${a} × ${c} - ${b} × ${d}`;
    const altD = `(${a} + ${c}) × (${b} - ${d})`;
    return {
      numbers: [a, b, c, d], target, solution,
      explanation: `İki parantez ayrı hesaplanır: ${a} + ${b} = ${sum}, ${c} - ${d} = ${diff}; sonra çarpılır: ${sum} × ${diff} = ${target}.`,
      stagedHint: 'Sayıları ikişerli iki gruba ayır, bir grupta topla, diğer grupta çıkar, sonra iki sonucu çarp.',
      wrongExpr, wrongResult: evalNum(wrongExpr),
      mistakeExplanation: 'Arkadaşın parantezleri hiç kullanmamış; hâlbuki iki ayrı ara sonuç önce parantezle bitirilip sonra çarpılmalı.',
      template: `(${a} + ${b}) × (${c} - ?)`, missingValue: d, missingDistractors: [d + 1, Math.max(1, d - 1), d + 2],
      candidates: [
        { expr: solution, value: target, isCorrect: true },
        { expr: altB, value: evalNum(altB), isCorrect: false },
        { expr: altC, value: evalNum(altC), isCorrect: false },
        { expr: altD, value: evalNum(altD), isCorrect: false }
      ]
    };
  }, random);
}

function instPriorityMix(random) {
  return withRetry((r) => {
    const a = randomInt(r, 3, 12), b = randomInt(r, 2, 8), c = randomInt(r, 2, 9), d = randomInt(r, 1, 8);
    const product = b * c;
    const target = a + product - d;
    const solution = `${a} + ${b} × ${c} - ${d}`;
    const wrongExpr = `(${a} + ${b}) × ${c} - ${d}`;
    const altB = `${a} + ${b} × ${d} - ${c}`;
    const altC = `${a} - ${b} × ${c} + ${d}`;
    const altD = `${a} × ${b} + ${c} - ${d}`;
    return {
      numbers: [a, b, c, d], target, solution,
      explanation: `İşlem önceliği gereği önce çarpma yapılır: ${b} × ${c} = ${product}; sonra ${a} eklenir, ${d} çıkarılır: ${a} + ${product} - ${d} = ${target}.`,
      stagedHint: 'Önce iki sayıyı çarparak bir ara sonuç bul, sonra bu ara sonuca bir sayı ekle, başka bir sayıyı çıkar.',
      wrongExpr, wrongResult: evalNum(wrongExpr),
      mistakeExplanation: 'Arkadaşın toplamı parantezle çarpmanın içine almış; hâlbuki çarpma önceliklidir, toplama ve çıkarma ondan sonra yapılır.',
      template: `${a} + ${b} × ? - ${d}`, missingValue: c, missingDistractors: [c + 1, Math.max(1, c - 1), c + 3],
      candidates: [
        { expr: solution, value: target, isCorrect: true },
        { expr: altB, value: evalNum(altB), isCorrect: false },
        { expr: altC, value: evalNum(altC), isCorrect: false },
        { expr: altD, value: evalNum(altD), isCorrect: false }
      ]
    };
  }, random);
}

function instDifferenceScale(random) {
  return withRetry((r) => {
    const b = randomInt(r, 2, 7), a = randomInt(r, b + 1, b + 8), c = randomInt(r, 2, 6), d = randomInt(r, 1, 7);
    const diff = a - b;
    const target = diff * c + d;
    const solution = `(${a} - ${b}) × ${c} + ${d}`;
    const wrongExpr = `${a} - ${b} × ${c} + ${d}`;
    const altB = `(${a} + ${b}) × ${c} - ${d}`;
    const altC = `${a} × ${c} - ${b} + ${d}`;
    const altD = `(${a} - ${c}) × ${b} + ${d}`;
    return {
      numbers: [a, b, c, d], target, solution,
      explanation: `Önce parantez içi çıkarma yapılır: ${a} - ${b} = ${diff}; sonra ${c} ile çarpılır, ${d} eklenir: ${diff} × ${c} + ${d} = ${target}.`,
      stagedHint: 'Önce iki sayıyı çıkararak bir ara sonuç oluştur, sonra bu ara sonucu üçüncü sayıyla çarp, en son dördüncü sayıyı ekle.',
      wrongExpr, wrongResult: evalNum(wrongExpr),
      mistakeExplanation: 'Arkadaşın parantezi göz ardı edip önce çarpmayı yapmış; hâlbuki parantez içindeki çıkarma önce bitirilmeli.',
      template: `(${a} - ${b}) × ? + ${d}`, missingValue: c, missingDistractors: [c + 1, Math.max(1, c - 1), c + 2],
      candidates: [
        { expr: solution, value: target, isCorrect: true },
        { expr: altB, value: evalNum(altB), isCorrect: false },
        { expr: altC, value: evalNum(altC), isCorrect: false },
        { expr: altD, value: evalNum(altD), isCorrect: false }
      ]
    };
  }, random);
}

function instDivisionCombine(random) {
  return withRetry((r) => {
    const b = randomInt(r, 2, 9), quotient = randomInt(r, 3, 12), a = b * quotient;
    const c = randomInt(r, 2, 8), d = randomInt(r, 2, 7);
    const product = c * d;
    const target = quotient + product;
    const solution = `${a} ÷ ${b} + ${c} × ${d}`;
    const wrongExpr = `${a} ÷ ${b} - ${c} × ${d}`;
    const altB = `${a} ÷ ${b} + ${c} + ${d}`;
    const altC = `${a} ÷ ${b} × ${c} + ${d}`;
    const altD = `${a} ÷ ${b} - ${c} - ${d}`;
    return {
      numbers: [a, b, c, d], target, solution,
      explanation: `İşlem önceliği gereği bölme ve çarpma önce yapılır: ${a} ÷ ${b} = ${quotient}, ${c} × ${d} = ${product}; sonra toplanır: ${quotient} + ${product} = ${target}.`,
      stagedHint: 'İki sayıyı böl, ayrı olarak diğer iki sayıyı çarp, en sonda iki ara sonucu topla.',
      wrongExpr, wrongResult: evalNum(wrongExpr),
      mistakeExplanation: 'Arkadaşın toplama yerine çıkarma yapmış; hâlbuki bölüm ile çarpımın toplanması gerekiyordu.',
      template: `${a} ÷ ${b} + ${c} × ?`, missingValue: d, missingDistractors: [d + 1, Math.max(1, d - 1), d + 2],
      candidates: [
        { expr: solution, value: target, isCorrect: true },
        { expr: altB, value: evalNum(altB), isCorrect: false },
        { expr: altC, value: evalNum(altC), isCorrect: false },
        { expr: altD, value: evalNum(altD), isCorrect: false }
      ]
    };
  }, random);
}

function instTripleChain(random) {
  return withRetry((r) => {
    const a = randomInt(r, 10, 40), b = randomInt(r, 5, 25), c = randomInt(r, 5, 25);
    const d = randomInt(r, 1, Math.max(1, a + b + c - 1));
    const target = a + b + c - d;
    const solution = `${a} + ${b} + ${c} - ${d}`;
    const wrongExpr = `${a} + ${b} - ${c} + ${d}`;
    const altB = `${a} + ${b} - ${c} - ${d}`;
    const altC = `${a} - ${b} + ${c} + ${d}`;
    const altD = `${a} - ${b} - ${c} + ${d}`;
    return {
      numbers: [a, b, c, d], target, solution,
      explanation: `Sayılar sırayla birleştirilir: ${a} + ${b} + ${c} = ${a + b + c}; sonra ${d} çıkarılır: ${a + b + c} - ${d} = ${target}.`,
      stagedHint: 'Üç sayıyı sırayla topla, en sonda dördüncü sayıyı çıkar.',
      wrongExpr, wrongResult: evalNum(wrongExpr),
      mistakeExplanation: 'Arkadaşın işaretleri karıştırmış (çıkarması gereken yerde toplamış); her sayının işaretine dikkatle bakmak gerekir.',
      template: `${a} + ${b} + ? - ${d}`, missingValue: c, missingDistractors: [c + 3, Math.max(1, c - 3), c + 6],
      candidates: [
        { expr: solution, value: target, isCorrect: true },
        { expr: altB, value: evalNum(altB), isCorrect: false },
        { expr: altC, value: evalNum(altC), isCorrect: false },
        { expr: altD, value: evalNum(altD), isCorrect: false }
      ]
    };
  }, random);
}

function instNestedBracket(random) {
  return withRetry((r) => {
    const c = randomInt(r, 2, 9), b = randomInt(r, c + 2, c + 12), a = randomInt(r, b + 1, b + 15), d = randomInt(r, 2, 6);
    const inner = b - c;
    const outer = a - inner;
    const target = outer * d;
    const solution = `(${a} - (${b} - ${c})) × ${d}`;
    const wrongExpr = `${a} - ${b} - ${c} × ${d}`;
    const altB = `((${a} - ${b}) - ${c}) × ${d}`;
    const altC = `(${a} - ${b}) × (${c} + ${d})`;
    const altD = `(${a} + (${b} - ${c})) × ${d}`;
    return {
      numbers: [a, b, c, d], target, solution,
      explanation: `İç parantez önce hesaplanır: ${b} - ${c} = ${inner}; sonra dış parantez: ${a} - ${inner} = ${outer}; en son ${d} ile çarpılır: ${outer} × ${d} = ${target}.`,
      stagedHint: 'Önce iki sayının farkını bul, bu farkı üçüncü sayıdan çıkar, çıkan sonucu dördüncü sayıyla çarp.',
      wrongExpr, wrongResult: evalNum(wrongExpr),
      mistakeExplanation: 'Arkadaşın iç içe parantezleri göz ardı edip her şeyi düz sırayla işlemiş; iç parantez her zaman önce bitirilmeli.',
      template: `(${a} - (${b} - ?)) × ${d}`, missingValue: c, missingDistractors: [c + 1, Math.max(1, c - 1), c + 2],
      candidates: [
        { expr: solution, value: target, isCorrect: true },
        { expr: altB, value: evalNum(altB), isCorrect: false },
        { expr: altC, value: evalNum(altC), isCorrect: false },
        { expr: altD, value: evalNum(altD), isCorrect: false }
      ]
    };
  }, random);
}

function instBracketMinusQuotient(random) {
  return withRetry((r) => {
    const a = randomInt(r, 5, 20), b = randomInt(r, 5, 20);
    const d = randomInt(r, 2, 9), quotient = randomInt(r, 2, 10), c = d * quotient;
    const sum = a + b;
    const target = sum - quotient;
    const solution = `(${a} + ${b}) - (${c} ÷ ${d})`;
    const wrongExpr = `${a} + ${b} - ${c} ÷ ${d} + ${d}`;
    const altB = `(${a} - ${b}) - (${c} ÷ ${d})`;
    const altC = `(${a} + ${b}) + (${c} ÷ ${d})`;
    const altD = `(${a} + ${b}) - ${c} - ${d}`;
    return {
      numbers: [a, b, c, d], target, solution,
      explanation: `İki grup ayrı hesaplanır: ${a} + ${b} = ${sum}, ${c} ÷ ${d} = ${quotient}; sonra çıkarılır: ${sum} - ${quotient} = ${target}.`,
      stagedHint: 'Sayıları ikişerli iki gruba ayır, bir grupta topla, diğer grupta böl, sonra ikinci sonucu birinciden çıkar.',
      wrongExpr, wrongResult: evalNum(wrongExpr),
      mistakeExplanation: 'Arkadaşın bir sayıyı iki kez kullanmış ve bölmeyi yanlış yere eklemiş; her sayı yalnızca bir kez ve doğru grupta kullanılmalı.',
      template: `(${a} + ${b}) - (${c} ÷ ?)`, missingValue: d, missingDistractors: [d + 1, Math.max(1, d - 1), d + 2],
      candidates: [
        { expr: solution, value: target, isCorrect: true },
        { expr: altB, value: evalNum(altB), isCorrect: false },
        { expr: altC, value: evalNum(altC), isCorrect: false },
        { expr: altD, value: evalNum(altD), isCorrect: false }
      ]
    };
  }, random);
}

function instQuotientScale(random) {
  return withRetry((r) => {
    const c = randomInt(r, 2, 9);
    const bMultiplier = randomInt(r, 1, 6);
    const b = c * bMultiplier;
    const innerQuotient = randomInt(r, bMultiplier + 1, bMultiplier + 10);
    const sum = c * innerQuotient;
    const a = sum - b;
    const d = randomInt(r, 2, 8);
    const target = innerQuotient * d;
    // NOT: a ve b, c'nin katı olacak şekilde kurulur (a+b=c×innerQuotient VE
    // b=c×bMultiplier) — böylece hem "(a+b)÷c" hem de olası "b÷c" ifadesi
    // her zaman tam sayı kalır (evalNum ondalık/NaN üretmez).
    const solution = `(${a} + ${b}) ÷ ${c} × ${d}`;
    const wrongExpr = `${a} + ${b} ÷ ${c} × ${d}`;
    const altB = `(${a} - ${b}) ÷ ${c} × ${d}`;
    const altC = `(${a} + ${b}) + ${c} × ${d}`;
    const altD = `(${a} + ${b}) - ${c} × ${d}`;
    return {
      numbers: [a, b, c, d], target, solution,
      explanation: `Önce parantez içi toplanır: ${a} + ${b} = ${sum}; sonra ${c}'ye bölünür: ${sum} ÷ ${c} = ${innerQuotient}; en son ${d} ile çarpılır: ${innerQuotient} × ${d} = ${target}.`,
      stagedHint: 'Önce iki sayıyı toplayarak bir ara sonuç oluştur, bu ara sonucu üçüncü sayıya böl, çıkan sonucu dördüncü sayıyla çarp.',
      wrongExpr, wrongResult: evalNum(wrongExpr),
      mistakeExplanation: 'Arkadaşın parantezi göz ardı edip önce bölmeyi yapmış; hâlbuki parantez içindeki toplama önce bitirilmeli.',
      template: `(${a} + ${b}) ÷ ? × ${d}`, missingValue: c, missingDistractors: [c + 1, Math.max(1, c - 1), c + 2],
      candidates: [
        { expr: solution, value: target, isCorrect: true },
        { expr: altB, value: evalNum(altB), isCorrect: false },
        { expr: altC, value: evalNum(altC), isCorrect: false },
        { expr: altD, value: evalNum(altD), isCorrect: false }
      ]
    };
  }, random);
}

export const TARGET_NUMBER_FAMILIES = [
  buildFamily('target-sum-then-scale', instSumThenScale),
  buildFamily('target-product-then-adjust', instProductThenAdjust),
  buildFamily('target-two-products-difference', instTwoProductsDifference),
  buildFamily('target-two-products-sum', instTwoProductsSum),
  buildFamily('target-bracket-product', instBracketProduct),
  buildFamily('target-priority-mix', instPriorityMix),
  buildFamily('target-difference-scale', instDifferenceScale),
  buildFamily('target-division-combine', instDivisionCombine),
  buildFamily('target-triple-chain', instTripleChain),
  buildFamily('target-nested-bracket', instNestedBracket),
  buildFamily('target-bracket-minus-quotient', instBracketMinusQuotient),
  buildFamily('target-quotient-scale', instQuotientScale)
];
