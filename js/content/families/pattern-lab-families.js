// Aşama 04 — pattern-lab (Örüntü Laboratuvarı) için gerçek Aile→İskelet→Düşünme
// Yolu içeriği. Bu dosya `js/quality/family-skeleton-engine.js` sözleşmesine
// uyar: her aile (familyId) gerçekten farklı bir DİZİ KURALI (recurrence) temsil
// eder — sayı/isim/bağlam değişimi burada AİLE sayılmaz, yalnız aynı ailenin
// farklı çağrılarında yüzey çeşitliliği sağlar.
//
// Her ailede 4 iskelet (görev türü), her iskelette 3 düşünme yolu (temsil) var:
//   İskeletler (görev):
//     - next-term          : ileri dışa vurma (forward extrapolation)
//     - missing-middle      : aradaki eksik terimi bul (enterpolasyon)
//     - extended-position   : gösterilenin ötesindeki bir terimi bul (çok adımlı)
//     - error-detection     : kuralı bozan terimi bul ve doğrusunu hesapla (hata analizi)
//   Düşünme yolları (temsil):
//     - induction-raw        : sayılar doğrudan verilir, kural ÇIKARILMALI
//     - induction-context    : aynı çıkarım görevi gerçek bir bağlama gömülü
//     - rule-application     : kural AÇIKÇA verilir, öğrenci yalnız uygular (tümdengelim)
//
// Bu üçlü, gerçek bir "reasoningPathId" ayrımıdır: ilk ikisi tümevarım
// (induction) gerektirir, üçüncüsü tümdengelim/uygulama gerektirir — kozmetik
// bir değişiklik değildir.

function randomInt(random, min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function digitSum(value) {
  return String(Math.trunc(Math.abs(value))).split('').reduce((sum, digit) => sum + Number(digit), 0);
}

function buildSeq(seed, stepFn, length) {
  const arr = [...seed];
  while (arr.length < length) arr.push(stepFn(arr));
  return arr;
}

function capitalize(text) {
  return text.charAt(0).toLocaleUpperCase('tr-TR') + text.slice(1);
}

const STORY_CONTEXTS = [
  { label: 'bir kitap kulübüne haftalık eklenen kitap sayıları', unit: 'kitap' },
  { label: 'bir okul bahçesine dikilen fidan sayıları', unit: 'fidan' },
  { label: 'bir kumbaraya art arda atılan kuruş sayıları', unit: 'kuruş' },
  { label: 'bir atölyede günlük üretilen parça sayıları', unit: 'parça' },
  { label: 'bir sınıfın topladığı geri dönüşüm kağıdı sayıları', unit: 'kağıt' },
  { label: 'bir koleksiyoncunun biriktirdiği pul sayıları', unit: 'pul' }
];

function pickContext(random) {
  return STORY_CONTEXTS[Math.floor(random() * STORY_CONTEXTS.length)];
}

function buildOptions(answer, random, typicalStep, extraCandidates = []) {
  const values = new Set([answer]);
  for (const candidate of extraCandidates) {
    if (values.size >= 4) break;
    if (Number.isFinite(candidate) && candidate >= 0 && candidate !== answer) values.add(candidate);
  }
  const step = Math.max(1, Math.round(typicalStep));
  const half = Math.max(1, Math.round(step / 2));
  const offsetCandidates = [step, -step, step * 2, -step * 2, half, -half, 1, -1, 3, -3];
  let index = 0;
  let guard = 0;
  while (values.size < 4 && guard < 200) {
    const candidate = answer + offsetCandidates[index % offsetCandidates.length];
    if (candidate >= 0 && !values.has(candidate)) values.add(candidate);
    index += 1;
    guard += 1;
  }
  let fallbackGuard = 0;
  while (values.size < 4 && fallbackGuard < 200) {
    const candidate = Math.max(0, answer + Math.floor(random() * 40) - 20);
    if (!values.has(candidate)) values.add(candidate);
    fallbackGuard += 1;
  }
  const list = [...values];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list.map(String);
}

function wrapKey(skeletonId, pathId, raw) {
  return `pattern-lab:${skeletonId}:${pathId}:${raw}`;
}

const PATH_IDS = ['induction-raw', 'induction-context', 'rule-application'];

const TASK_TRAITS = {
  next: ['multiStepInference', 'strategySelection'],
  middle: ['informationLinking', 'reverseThinking'],
  position: ['multiStepInference', 'usingIntermediateResultInNewDecision'],
  error: ['errorAnalysis', 'conditionEvaluation']
};

function generateNextTerm(skeletonId, core, pathId, random) {
  const shown = core.arr.slice(0, 5);
  const answer = core.arr[5];
  const typicalStep = Math.max(1, Math.abs(core.arr[1] - core.arr[0]));
  const options = buildOptions(answer, random, typicalStep);
  const answerIndex = options.indexOf(String(answer));
  if (pathId === 'induction-raw') {
    return {
      prompt: `${shown.join('  •  ')}  •  ?`,
      context: 'Dizinin kuralını bul ve sıradaki sayıyı seç.',
      options, answerIndex,
      explanation: `${core.ruleText} Diziyi bir terim daha uzatınca: ${core.arr.slice(0, 6).join(' → ')}.`,
      questionKey: wrapKey(skeletonId, pathId, `${shown.join(',')}:${answer}`)
    };
  }
  if (pathId === 'induction-context') {
    const ctx = pickContext(random);
    return {
      prompt: `${capitalize(ctx.label)}: ${shown.join(', ')} ${ctx.unit}. Bir sonraki değer kaç ${ctx.unit} olur?`,
      context: 'Önce cümledeki sayıları bir diziye çevir, sonra kuralı bul.',
      options, answerIndex,
      explanation: `Sayı dizisi: ${shown.join(', ')}. ${core.ruleText} Bu yüzden sıradaki değer ${answer} ${ctx.unit} olur.`,
      questionKey: wrapKey(skeletonId, pathId, `${shown.join(',')}:${answer}:${ctx.unit}`)
    };
  }
  const anchor = core.arr.slice(0, 2);
  return {
    prompt: `Kural: ${core.ruleText} İlk iki terim ${anchor.join(' ve ')}. Bu kurala göre 6. terim kaçtır?`,
    context: 'Kuralı ilk terimden başlayarak sırayla uygula; çıkarım yapmana gerek yok, yalnız uygula.',
    options, answerIndex,
    explanation: `Kuralı sırayla uygulayınca: ${core.arr.slice(0, 6).join(' → ')}.`,
    questionKey: wrapKey(skeletonId, pathId, `${anchor.join(',')}:${answer}:rule`)
  };
}

function generateMissingMiddle(skeletonId, core, pathId, random) {
  const shown = core.arr.slice(0, 6);
  const hiddenIndex = 3;
  const answer = shown[hiddenIndex];
  const typicalStep = Math.max(1, Math.abs(core.arr[1] - core.arr[0]));
  const options = buildOptions(answer, random, typicalStep);
  const answerIndex = options.indexOf(String(answer));
  const displayed = shown.map((value, i) => (i === hiddenIndex ? '?' : value));
  const positionLabel = `${hiddenIndex + 1}.`;
  if (pathId === 'induction-raw') {
    return {
      prompt: `${displayed.join('  •  ')}`,
      context: `Dizideki eksik (${positionLabel} sıradaki) terimi bul.`,
      options, answerIndex,
      explanation: `${core.ruleText} Bu kurala göre ${positionLabel} terim ${answer} olmalıdır.`,
      questionKey: wrapKey(skeletonId, pathId, `${displayed.join(',')}:${answer}`)
    };
  }
  if (pathId === 'induction-context') {
    const ctx = pickContext(random);
    return {
      prompt: `${capitalize(ctx.label)}: ${displayed.join(', ')} ${ctx.unit}. Eksik olan (${positionLabel} sıradaki) değer kaç ${ctx.unit}dir?`,
      context: 'Önce baştaki ve sondaki terimlerden kuralı çıkar, sonra eksik terimi doldur.',
      options, answerIndex,
      explanation: `Tam dizi: ${shown.join(', ')} ${ctx.unit}. ${core.ruleText}`,
      questionKey: wrapKey(skeletonId, pathId, `${displayed.join(',')}:${answer}:${ctx.unit}`)
    };
  }
  const anchor = core.arr.slice(0, 2);
  return {
    prompt: `Kural: ${core.ruleText} İlk iki terim ${anchor.join(' ve ')}. Bu kurala göre ${positionLabel} terim kaçtır?`,
    context: 'Kuralı ilk terimden başlayarak sırayla uygula.',
    options, answerIndex,
    explanation: `Kuralı sırayla uygulayınca: ${shown.join(' → ')}; ${positionLabel} terim ${answer} olur.`,
    questionKey: wrapKey(skeletonId, pathId, `${anchor.join(',')}:${answer}:pos${hiddenIndex}`)
  };
}

function generateExtendedPosition(skeletonId, core, pathId, random, targetIndex) {
  const shown = core.arr.slice(0, 5);
  const answer = core.arr[targetIndex];
  const typicalStep = Math.max(1, Math.abs(core.arr[1] - core.arr[0]));
  const options = buildOptions(answer, random, typicalStep);
  const answerIndex = options.indexOf(String(answer));
  const positionLabel = `${targetIndex + 1}.`;
  if (pathId === 'induction-raw') {
    return {
      prompt: `${shown.join('  •  ')}  •  …  •  ${positionLabel} terim = ?`,
      context: `Dizinin kuralını bul ve ${positionLabel} terimi hesapla (dizi gösterilenle bitmiyor).`,
      options, answerIndex,
      explanation: `${core.ruleText} Diziyi ${positionLabel} terime kadar uzatınca: ${core.arr.slice(0, targetIndex + 1).join(' → ')}.`,
      questionKey: wrapKey(skeletonId, pathId, `${shown.join(',')}:${targetIndex}:${answer}`)
    };
  }
  if (pathId === 'induction-context') {
    const ctx = pickContext(random);
    return {
      prompt: `${capitalize(ctx.label)}: ilk günler sırasıyla ${shown.join(', ')} ${ctx.unit}. Bu kural sürerse ${positionLabel} gün kaç ${ctx.unit} olur?`,
      context: 'Önce kuralı bul, sonra istenen sıraya kadar dikkatle uygula.',
      options, answerIndex,
      explanation: `${core.ruleText} ${positionLabel} değer ${answer} ${ctx.unit} olur.`,
      questionKey: wrapKey(skeletonId, pathId, `${shown.join(',')}:${targetIndex}:${answer}:${ctx.unit}`)
    };
  }
  const anchor = core.arr.slice(0, 2);
  return {
    prompt: `Kural: ${core.ruleText} İlk iki terim ${anchor.join(' ve ')}. Bu kurala göre ${positionLabel} terim kaçtır?`,
    context: 'Kuralı adım adım, hatasız şekilde tekrar tekrar uygula.',
    options, answerIndex,
    explanation: `Kuralı sırayla uygulayarak ${positionLabel} terime ulaşılır: ${core.arr.slice(0, targetIndex + 1).join(' → ')}.`,
    questionKey: wrapKey(skeletonId, pathId, `${anchor.join(',')}:${targetIndex}:${answer}:rule`)
  };
}

function generateErrorDetection(skeletonId, core, pathId, random) {
  const shown = core.arr.slice(0, 6);
  const corruptIndex = 3;
  const correctValue = shown[corruptIndex];
  const typicalStep = Math.max(1, Math.abs(core.arr[1] - core.arr[0]));
  let wrongValue = correctValue;
  let guard = 0;
  const wrongOffsets = [1, -1, 2, -2, Math.max(1, Math.round(typicalStep / 2)), -Math.max(1, Math.round(typicalStep / 2))];
  while ((wrongValue === correctValue || wrongValue < 0) && guard < wrongOffsets.length * 3) {
    wrongValue = correctValue + wrongOffsets[guard % wrongOffsets.length];
    guard += 1;
  }
  if (wrongValue === correctValue || wrongValue < 0) wrongValue = correctValue + 1;
  const corrupted = [...shown];
  corrupted[corruptIndex] = wrongValue;
  const options = buildOptions(correctValue, random, typicalStep, [wrongValue]);
  const answerIndex = options.indexOf(String(correctValue));
  const positionLabel = `${corruptIndex + 1}.`;
  if (pathId === 'induction-raw') {
    return {
      prompt: `${corrupted.join('  •  ')}  — bu dizide kural bir yerde bozulmuş.`,
      context: `${positionLabel} terim kuralı bozuyor. Kurala göre bu terim gerçekte kaç olmalıydı?`,
      options, answerIndex,
      explanation: `${core.ruleText} Bu kurala göre ${positionLabel} terim ${correctValue} olmalıydı; verilen ${wrongValue} değeri kuralı bozuyor.`,
      questionKey: wrapKey(skeletonId, pathId, `${corrupted.join(',')}:${correctValue}`)
    };
  }
  if (pathId === 'induction-context') {
    const ctx = pickContext(random);
    return {
      prompt: `${capitalize(ctx.label)} kayıt defterine sırasıyla ${corrupted.join(', ')} ${ctx.unit} yazılmış, ama biri yanlış yazılmış.`,
      context: `${positionLabel} kayıt kurala uymuyor. Doğrusu kaç ${ctx.unit} olmalıydı?`,
      options, answerIndex,
      explanation: `${core.ruleText} Doğru dizi: ${shown.join(', ')} ${ctx.unit}.`,
      questionKey: wrapKey(skeletonId, pathId, `${corrupted.join(',')}:${correctValue}:${ctx.unit}`)
    };
  }
  const anchor = core.arr.slice(0, 2);
  return {
    prompt: `Kural: ${core.ruleText} İlk iki terim ${anchor.join(' ve ')}. Verilen dizi: ${corrupted.join('  •  ')}.`,
    context: `Kuralı baştan uygulayarak ${positionLabel} terimin doğrusunu bul.`,
    options, answerIndex,
    explanation: `Kuralı sırayla uygulayınca: ${shown.join(' → ')}; ${positionLabel} terim ${correctValue} olmalıdır.`,
    questionKey: wrapKey(skeletonId, pathId, `${anchor.join(',')}:${corrupted.join(',')}:${correctValue}:rule`)
  };
}

function buildFamily(familyId, buildCore, extendedIndex) {
  const nextId = `${familyId}:next-term`;
  const middleId = `${familyId}:missing-middle`;
  const positionId = `${familyId}:extended-position`;
  const errorId = `${familyId}:error-detection`;
  return {
    familyId,
    skeletons: [
      { skeletonId: nextId, reasoningPathIds: PATH_IDS, cognitiveTraits: TASK_TRAITS.next,
        generate: (random, pathId) => generateNextTerm(nextId, buildCore(random), pathId, random) },
      { skeletonId: middleId, reasoningPathIds: PATH_IDS, cognitiveTraits: TASK_TRAITS.middle,
        generate: (random, pathId) => generateMissingMiddle(middleId, buildCore(random), pathId, random) },
      { skeletonId: positionId, reasoningPathIds: PATH_IDS, cognitiveTraits: TASK_TRAITS.position,
        generate: (random, pathId) => generateExtendedPosition(positionId, buildCore(random), pathId, random, extendedIndex) },
      { skeletonId: errorId, reasoningPathIds: PATH_IDS, cognitiveTraits: TASK_TRAITS.error,
        generate: (random, pathId) => generateErrorDetection(errorId, buildCore(random), pathId, random) }
    ]
  };
}

// ---- 12 gerçekten farklı dizi kuralı (aile) ----

function coreArithmeticAdd(random) {
  const step = randomInt(random, 2, 9);
  const start = randomInt(random, 3, 20);
  const arr = buildSeq([start], (a) => a.at(-1) + step, 12);
  return { arr, ruleText: `Her terimde ${step} ekleniyor.` };
}

function coreArithmeticSubtract(random) {
  const step = randomInt(random, 3, 9);
  const start = randomInt(random, 110, 160);
  const arr = buildSeq([start], (a) => a.at(-1) - step, 12);
  return { arr, ruleText: `Her terimde ${step} çıkarılıyor.` };
}

function coreGeometricMultiply(random) {
  const ratio = randomInt(random, 2, 3);
  const start = ratio === 3 ? randomInt(random, 1, 2) : randomInt(random, 1, 4);
  const arr = buildSeq([start], (a) => a.at(-1) * ratio, 7);
  return { arr, ruleText: `Her terim, bir önceki terimin ${ratio} katıdır.` };
}

function coreGeometricDivide(random) {
  const ratio = 2;
  const base = randomInt(random, 1, 3);
  const length = 8;
  const start = base * ratio ** (length - 1);
  const arr = buildSeq([start], (a) => a.at(-1) / ratio, length);
  return { arr, ruleText: `Her terim, bir önceki terimin ${ratio}'ye bölünmüş halidir.` };
}

function coreTwoStepAlternating(random) {
  const start = randomInt(random, 2, 6);
  const add = randomInt(random, 2, 5);
  const mult = 2;
  const arr = [start];
  while (arr.length < 10) {
    const i = arr.length;
    arr.push(i % 2 === 1 ? arr.at(-1) + add : arr.at(-1) * mult);
  }
  return { arr, ruleText: `Sırayla +${add} ve ×${mult} uygulanıyor (bir ekleme, bir çarpma dönüşümlü).` };
}

function coreThreeTermCycle(random) {
  const d1 = randomInt(random, 2, 6);
  const d2 = randomInt(random, 2, 6);
  const d3 = randomInt(random, 2, 6);
  const deltas = [d1, d2, d3];
  const start = randomInt(random, 2, 10);
  const arr = [start];
  while (arr.length < 12) arr.push(arr.at(-1) + deltas[(arr.length - 1) % 3]);
  return { arr, ruleText: `Sırayla +${d1}, +${d2}, +${d3} ekleniyor; bu üçlü kalıp tekrar ediyor.` };
}

function coreGrowingDifference(random) {
  const start = randomInt(random, 2, 10);
  const firstDiff = randomInt(random, 2, 5);
  const diffGrowth = randomInt(random, 1, 3);
  const arr = [start];
  let diff = firstDiff;
  while (arr.length < 10) { arr.push(arr.at(-1) + diff); diff += diffGrowth; }
  return { arr, ruleText: `Ardışık farklar her adımda ${diffGrowth} artıyor (ilk fark ${firstDiff}).` };
}

function coreAcceleratingDifference(random) {
  const start = randomInt(random, 2, 8);
  const firstDiff = randomInt(random, 2, 4);
  const arr = [start];
  let diff = firstDiff;
  while (arr.length < 8) { arr.push(arr.at(-1) + diff); diff *= 2; }
  return { arr, ruleText: 'Ardışık farklar her adımda 2 katına çıkıyor.' };
}

function coreQuadraticOffset(random) {
  const offset = randomInt(random, 0, 6);
  const arr = Array.from({ length: 10 }, (_, i) => (i + 1) ** 2 + offset);
  return { arr, ruleText: `Terimler, sırasıyla 1², 2², 3², ... sayılarına ${offset} eklenerek bulunuyor.` };
}

function coreFibonacci(random) {
  const x = randomInt(random, 1, 5);
  const y = randomInt(random, 2, 6);
  const arr = buildSeq([x, y], (a) => a.at(-1) + a.at(-2), 9);
  return { arr, ruleText: 'Her terim, kendinden önceki iki terimin toplamıdır.' };
}

function coreTriangular(random) {
  const k = randomInt(random, 1, 3);
  const arr = Array.from({ length: 9 }, (_, i) => (k * (i + 1) * (i + 2)) / 2);
  return { arr, ruleText: `Terimler üçgensel sayı deseniyle artıyor: ${k}×1, ${k}×3, ${k}×6, ${k}×10, ... (n. terim = ${k}×n×(n+1)÷2).` };
}

function coreDigitSumGrowth(random) {
  const start = randomInt(random, 12, 40);
  const arr = buildSeq([start], (a) => a.at(-1) + digitSum(a.at(-1)), 10);
  return { arr, ruleText: 'Her terime, kendi rakamlarının toplamı ekleniyor.' };
}

export const PATTERN_LAB_FAMILIES = [
  buildFamily('pattern-lab-arithmetic-add', coreArithmeticAdd, 8),
  buildFamily('pattern-lab-arithmetic-subtract', coreArithmeticSubtract, 8),
  buildFamily('pattern-lab-geometric-multiply', coreGeometricMultiply, 6),
  buildFamily('pattern-lab-geometric-divide', coreGeometricDivide, 7),
  buildFamily('pattern-lab-two-step-alternating', coreTwoStepAlternating, 8),
  buildFamily('pattern-lab-three-term-cycle', coreThreeTermCycle, 8),
  buildFamily('pattern-lab-growing-difference', coreGrowingDifference, 8),
  buildFamily('pattern-lab-accelerating-difference', coreAcceleratingDifference, 6),
  buildFamily('pattern-lab-quadratic-offset', coreQuadraticOffset, 8),
  buildFamily('pattern-lab-fibonacci-recurrence', coreFibonacci, 6),
  buildFamily('pattern-lab-triangular-cumulative', coreTriangular, 7),
  buildFamily('pattern-lab-digit-sum-growth', coreDigitSumGrowth, 8)
];
