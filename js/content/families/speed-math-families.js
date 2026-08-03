// Aşama 04 — speed-math (Hızlı İşlem Arenası) için gerçek Aile→İskelet→Düşünme
// Yolu içeriği. `js/quality/family-skeleton-engine.js` sözleşmesine uyar.
//
// Bir ailenin kimliğini SAYI DEĞERİ değil, İŞLEM YAPISI belirler (sayı/isim
// makyajı aile/iskelet saymanın yasak olduğu kuralı gereği): 12 aile, dört
// işlemin (toplama/çıkarma/çarpma/bölme) tek başına, öncelikli (işlem
// sırası), parantezli, zincirleme veya karışık kombinasyonları arasındaki
// GERÇEK yapısal farkı temsil eder.
//
// Her ailede 4 iskelet (görev türü), her iskelette 3 düşünme yolu (temsil) var:
//   İskeletler (görev):
//     - direct-compute        : ifadeyi doğrudan hesapla
//     - verify-and-correct    : bir "arkadaşın" tipik bir hatayla bulduğu
//                                yanlış sonucu görür, doğrusunu bulursun (hata analizi)
//     - missing-operand       : ifadedeki bir sayı "?" ile gizli, sonuç
//                                verilmiş; "?" değerini bulursun (tersine düşünme)
//     - compare-two-instances : aynı ailenin iki ayrı örneğini hesaplayıp
//                                sonuçlarının farkını bulursun (bilgileri
//                                ilişkilendirme + strateji seçme)
//   Düşünme yolları (temsil):
//     - raw-expression        : sembolik ifade doğrudan verilir
//     - context-embedded      : aynı sayılar gerçek bir cümleye gömülü (temsil dönüşümü)
//     - structured-instruction: işlem adımları sözel talimatla verilir,
//                                öğrenci ifadeyi kendi kurup hesaplar (tümdengelim/uygulama)
//
// NOT: Boşluk sembolü olarak harf "x" DEĞİL "?" kullanılır — registry.js'deki
// grade>=4 `trivialLinear` filtresi ("x + 5 = 12" tipi) ile çakışmayı önlemek için.

function randomInt(random, min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function capitalize(text) {
  return text.charAt(0).toLocaleUpperCase('tr-TR') + text.slice(1);
}

const CONTEXTS = [
  { label: 'bir manavda satılan meyve sayıları', unit: 'meyve' },
  { label: 'bir kırtasiyede satılan defter sayıları', unit: 'defter' },
  { label: 'bir kumbaraya biriktirilen kuruşlar', unit: 'kuruş' },
  { label: 'bir otobüs seferinde taşınan yolcu sayıları', unit: 'yolcu' },
  { label: 'bir çiftlikte toplanan yumurta sayıları', unit: 'yumurta' },
  { label: 'bir kütüphaneye gelen kitap sayıları', unit: 'kitap' }
];

function pickContext(random) {
  return CONTEXTS[Math.floor(random() * CONTEXTS.length)];
}

function buildOptions(answer, random, typicalStep, extraCandidates = []) {
  const values = new Set([answer]);
  for (const candidate of extraCandidates) {
    if (values.size >= 4) break;
    if (Number.isFinite(candidate) && candidate >= 0 && candidate !== answer) values.add(Math.round(candidate));
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
  return `speed-math:${skeletonId}:${pathId}:${raw}`;
}

const PATH_IDS = ['raw-expression', 'context-embedded', 'structured-instruction'];

const TASK_TRAITS = {
  direct: ['multiStepInference', 'strategySelection'],
  verify: ['errorAnalysis', 'conditionEvaluation'],
  missing: ['reverseThinking', 'informationLinking'],
  compare: ['usingIntermediateResultInNewDecision', 'strategySelection']
};

function generateDirectCompute(skeletonId, inst, pathId, random) {
  const options = buildOptions(inst.value, random, inst.typicalStep);
  const answerIndex = options.indexOf(String(inst.value));
  if (pathId === 'raw-expression') {
    return {
      prompt: `${inst.exprText} işleminin sonucu kaçtır?`,
      context: 'İşlem önceliğine ve işaretlere dikkat ederek hesapla.',
      options, answerIndex, explanation: `${inst.verbal} Sonuç ${inst.value}.`,
      questionKey: wrapKey(skeletonId, pathId, `${inst.exprText}:${inst.value}`)
    };
  }
  if (pathId === 'context-embedded') {
    const ctx = pickContext(random);
    return {
      prompt: inst.contextSentence(ctx),
      context: 'Cümledeki sayıları çıkar, işlemi doğru sırayla kur ve hesapla.',
      options, answerIndex, explanation: `İşlem: ${inst.exprText} = ${inst.value}. ${inst.verbal}`,
      questionKey: wrapKey(skeletonId, pathId, `${inst.exprText}:${inst.value}:${ctx.unit}`)
    };
  }
  return {
    prompt: `${inst.instruction} Bu adımların sonunda ulaşılan sonuç kaçtır?`,
    context: 'Talimattaki adımları sırayla, atlamadan uygula.',
    options, answerIndex, explanation: `${inst.verbal} Sonuç ${inst.value}.`,
    questionKey: wrapKey(skeletonId, pathId, `${inst.instruction}:${inst.value}`)
  };
}

function generateVerifyAndCorrect(skeletonId, inst, pathId, random) {
  const wrong = Math.round(inst.wrongValue(random));
  const options = buildOptions(inst.value, random, inst.typicalStep, [wrong]);
  const answerIndex = options.indexOf(String(inst.value));
  if (pathId === 'raw-expression') {
    return {
      prompt: `${inst.exprText} işlemini bir arkadaşın ${wrong} olarak hesaplamış. Doğru sonuç kaçtır?`,
      context: 'Arkadaşının cevabına güvenme; işlemi baştan, doğru sırayla kendin yap.',
      options, answerIndex,
      explanation: `${inst.verbal} Doğru sonuç ${inst.value}'dir; ${wrong} yanlış bir işlem sırası veya işlemden kaynaklanmış olabilir.`,
      questionKey: wrapKey(skeletonId, pathId, `${inst.exprText}:${wrong}:${inst.value}`)
    };
  }
  if (pathId === 'context-embedded') {
    const ctx = pickContext(random);
    return {
      prompt: `${inst.contextSentence(ctx)} Bir arkadaşın bu hesabı ${wrong} ${ctx.unit} olarak bulmuş. Doğrusu kaç ${ctx.unit}dir?`,
      context: 'Kendi hesabını baştan yap; arkadaşının sonucuna güvenme.',
      options, answerIndex, explanation: `İşlem: ${inst.exprText} = ${inst.value}. ${inst.verbal}`,
      questionKey: wrapKey(skeletonId, pathId, `${inst.exprText}:${wrong}:${inst.value}:${ctx.unit}`)
    };
  }
  return {
    prompt: `${inst.instruction} Bir arkadaşın bu adımları uygularken ${wrong} sonucunu bulmuş. Doğrusu kaçtır?`,
    context: 'Adımları sırayla, dikkatle tekrar uygula.',
    options, answerIndex, explanation: `${inst.verbal} Doğru sonuç ${inst.value}.`,
    questionKey: wrapKey(skeletonId, pathId, `${inst.instruction}:${wrong}:${inst.value}`)
  };
}

function generateMissingOperand(skeletonId, inst, pathId, random) {
  const options = buildOptions(inst.missingValue, random, inst.typicalStep);
  const answerIndex = options.indexOf(String(inst.missingValue));
  if (pathId === 'raw-expression') {
    return {
      prompt: `${inst.exprBlank} = ${inst.value}`,
      context: '? yerine gelmesi gereken sayıyı bul.',
      options, answerIndex, explanation: `${inst.verbal} Bu yüzden ? = ${inst.missingValue}.`,
      questionKey: wrapKey(skeletonId, pathId, `${inst.exprBlank}:${inst.value}`)
    };
  }
  if (pathId === 'context-embedded') {
    const ctx = pickContext(random);
    return {
      prompt: `${capitalize(ctx.label)} ile ilgili bir hesaplamada "${inst.exprBlank}" işlemi yapılmış ve sonuç ${inst.value} ${ctx.unit} bulunmuş. ? yerine gelmesi gereken sayı kaçtır?`,
      context: 'Bilinen sayılarla sonucu karşılaştırarak eksik sayıyı bul.',
      options, answerIndex, explanation: `${inst.verbal} Bu yüzden ? = ${inst.missingValue} ${ctx.unit}.`,
      questionKey: wrapKey(skeletonId, pathId, `${inst.exprBlank}:${inst.value}:${ctx.unit}`)
    };
  }
  return {
    prompt: `${inst.instructionBlank} Bu adımların sonunda sonuç ${inst.value} bulunuyor. ? yerine gelmesi gereken sayı kaçtır?`,
    context: 'Talimattaki bilinen adımlardan geriye doğru düşün.',
    options, answerIndex, explanation: `${inst.verbal} Bu yüzden ? = ${inst.missingValue}.`,
    questionKey: wrapKey(skeletonId, pathId, `${inst.instructionBlank}:${inst.value}`)
  };
}

function generateCompareTwo(skeletonId, buildInstance, pathId, random) {
  const instA = buildInstance(random);
  let instB = buildInstance(random);
  let guard = 0;
  while (instB.exprText === instA.exprText && guard < 10) { instB = buildInstance(random); guard += 1; }
  const big = Math.max(instA.value, instB.value);
  const small = Math.min(instA.value, instB.value);
  const diff = big - small;
  const typicalStep = Math.max(1, Math.round((instA.typicalStep + instB.typicalStep) / 2));
  const options = buildOptions(diff, random, typicalStep);
  const answerIndex = options.indexOf(String(diff));
  if (pathId === 'raw-expression') {
    return {
      prompt: `A) ${instA.exprText}   B) ${instB.exprText}  — İki işlemin sonuçları arasındaki fark (büyük − küçük) kaçtır?`,
      context: 'Önce her iki işlemi ayrı ayrı hesapla, sonra sonuçları karşılaştır.',
      options, answerIndex, explanation: `A = ${instA.value}, B = ${instB.value}. Fark = ${big} − ${small} = ${diff}.`,
      questionKey: wrapKey(skeletonId, pathId, `${instA.exprText}|${instB.exprText}:${diff}`)
    };
  }
  if (pathId === 'context-embedded') {
    const ctx = pickContext(random);
    return {
      prompt: `${capitalize(ctx.label)} ile ilgili iki ayrı hesaplama var: A) ${instA.exprText}  B) ${instB.exprText} (${ctx.unit} cinsinden). İki sonuç arasındaki fark kaç ${ctx.unit}dir?`,
      context: 'İki hesaplamayı da bitir, sonra büyük olandan küçük olanı çıkar.',
      options, answerIndex, explanation: `A = ${instA.value} ${ctx.unit}, B = ${instB.value} ${ctx.unit}. Fark = ${diff} ${ctx.unit}.`,
      questionKey: wrapKey(skeletonId, pathId, `${instA.exprText}|${instB.exprText}:${diff}:${ctx.unit}`)
    };
  }
  return {
    prompt: `Birinci işlem: ${instA.instruction} İkinci işlem: ${instB.instruction} İki işlemin sonuçları arasındaki fark kaçtır?`,
    context: 'Her iki talimatı da adım adım uygula, sonra sonuçları karşılaştır.',
    options, answerIndex, explanation: `Birinci sonuç ${instA.value}, ikinci sonuç ${instB.value}. Fark = ${diff}.`,
    questionKey: wrapKey(skeletonId, pathId, `${instA.instruction}|${instB.instruction}:${diff}`)
  };
}

function buildFamily(familyId, buildInstance) {
  const directId = `${familyId}:direct-compute`;
  const verifyId = `${familyId}:verify-and-correct`;
  const missingId = `${familyId}:missing-operand`;
  const compareId = `${familyId}:compare-two-instances`;
  return {
    familyId,
    skeletons: [
      { skeletonId: directId, reasoningPathIds: PATH_IDS, cognitiveTraits: TASK_TRAITS.direct,
        generate: (random, pathId) => generateDirectCompute(directId, buildInstance(random), pathId, random) },
      { skeletonId: verifyId, reasoningPathIds: PATH_IDS, cognitiveTraits: TASK_TRAITS.verify,
        generate: (random, pathId) => generateVerifyAndCorrect(verifyId, buildInstance(random), pathId, random) },
      { skeletonId: missingId, reasoningPathIds: PATH_IDS, cognitiveTraits: TASK_TRAITS.missing,
        generate: (random, pathId) => generateMissingOperand(missingId, buildInstance(random), pathId, random) },
      { skeletonId: compareId, reasoningPathIds: PATH_IDS, cognitiveTraits: TASK_TRAITS.compare,
        generate: (random, pathId) => generateCompareTwo(compareId, buildInstance, pathId, random) }
    ]
  };
}

// ---- 12 gerçekten farklı işlem-yapısı ailesi ----

function instTwoTermAddition(random) {
  const a = randomInt(random, 14, 89);
  const b = randomInt(random, 14, 89);
  const value = a + b;
  return {
    exprText: `${a} + ${b}`, exprBlank: `${a} + ?`, missingValue: b, value,
    typicalStep: Math.max(3, Math.round(value * 0.12)),
    verbal: `${a} ile ${b} toplanır: ${a} + ${b} = ${value}.`,
    instruction: `Önce ${a} sayısını al, sonra üzerine ${b} ekle.`,
    instructionBlank: `Önce ${a} sayısını al, sonra üzerine bilinmeyen bir sayı ekle.`,
    contextSentence: (ctx) => `${capitalize(ctx.label)}: önce ${a} ${ctx.unit}, sonra ${b} ${ctx.unit} daha ekleniyor. Toplamda kaç ${ctx.unit} olur?`,
    wrongValue: (random2) => value + randomInt(random2, 3, 9)
  };
}

function instTwoTermSubtraction(random) {
  const b = randomInt(random, 14, 70);
  const diff = randomInt(random, 5, 60);
  const a = b + diff;
  return {
    exprText: `${a} - ${b}`, exprBlank: `${a} - ?`, missingValue: b, value: diff,
    typicalStep: Math.max(3, Math.round(diff * 0.15) || 4),
    verbal: `${a} sayısından ${b} çıkarılır: ${a} - ${b} = ${diff}.`,
    instruction: `Önce ${a} sayısını al, sonra ${b} kadarını çıkar.`,
    instructionBlank: `Önce ${a} sayısını al, sonra bilinmeyen bir miktar çıkar.`,
    contextSentence: (ctx) => `${capitalize(ctx.label)}: başlangıçta ${a} ${ctx.unit} vardı, bunlardan ${b} tanesi kullanıldı. Geriye kaç ${ctx.unit} kaldı?`,
    wrongValue: () => a + b
  };
}

function instTwoTermMultiplication(random) {
  const a = randomInt(random, 4, 17);
  const b = randomInt(random, 4, 14);
  const value = a * b;
  return {
    exprText: `${a} × ${b}`, exprBlank: `${a} × ?`, missingValue: b, value,
    typicalStep: Math.max(2, Math.round(value * 0.1)),
    verbal: `${a} sayısı ${b} defa toplanır (çarpım tablosuyla): ${a} × ${b} = ${value}.`,
    instruction: `${a} sayısını ${b} ile çarp.`,
    instructionBlank: `${a} sayısını bilinmeyen bir sayı ile çarp.`,
    contextSentence: (ctx) => `${capitalize(ctx.label)}: ${a} grubun her birinde ${b} ${ctx.unit} var. Toplamda kaç ${ctx.unit} olur?`,
    wrongValue: () => a + b
  };
}

function instExactDivision(random) {
  const divisor = randomInt(random, 3, 12);
  const quotient = randomInt(random, 4, 15);
  const dividend = divisor * quotient;
  return {
    exprText: `${dividend} ÷ ${divisor}`, exprBlank: `${dividend} ÷ ?`, missingValue: divisor, value: quotient,
    typicalStep: Math.max(1, Math.round(quotient * 0.2)),
    verbal: `${dividend} sayısı ${divisor} eşit parçaya bölünür: ${dividend} ÷ ${divisor} = ${quotient}.`,
    instruction: `${dividend} sayısını ${divisor} eşit gruba paylaştır.`,
    instructionBlank: `${dividend} sayısını bilinmeyen sayıda eşit gruba paylaştır.`,
    contextSentence: (ctx) => `${capitalize(ctx.label)}: toplam ${dividend} ${ctx.unit}, ${divisor} eşit gruba paylaştırılacak. Her grupta kaç ${ctx.unit} olur?`,
    wrongValue: () => Math.max(0, dividend - divisor)
  };
}

function instAddThenMultiply(random) {
  const b = randomInt(random, 2, 9);
  const c = randomInt(random, 2, 8);
  const a = randomInt(random, 5, 40);
  const product = b * c;
  const value = a + product;
  return {
    exprText: `${a} + ${b} × ${c}`, exprBlank: `${a} + ${b} × ?`, missingValue: c, value,
    typicalStep: Math.max(2, Math.round(value * 0.12)),
    verbal: `İşlem önceliği gereği önce çarpma yapılır: ${b} × ${c} = ${product}; sonra ${a} eklenir: ${a} + ${product} = ${value}.`,
    instruction: `Önce ${b} ile ${c}'yi çarp, sonra sonuca ${a} ekle.`,
    instructionBlank: `Önce ${b} ile bilinmeyen bir sayıyı çarp, sonra sonuca ${a} ekle.`,
    contextSentence: (ctx) => `${capitalize(ctx.label)}: zaten ${a} ${ctx.unit} vardı; ayrıca ${b} grup, her birinde ${c} ${ctx.unit} olacak şekilde ekleniyor. Toplamda kaç ${ctx.unit} olur?`,
    wrongValue: () => (a + b) * c
  };
}

function instSubtractThenMultiply(random) {
  const b = randomInt(random, 2, 8);
  const c = randomInt(random, 2, 7);
  const product = b * c;
  const a = product + randomInt(random, 5, 40);
  const value = a - product;
  return {
    exprText: `${a} - ${b} × ${c}`, exprBlank: `${a} - ${b} × ?`, missingValue: c, value,
    typicalStep: Math.max(2, Math.round(value * 0.12)),
    verbal: `İşlem önceliği gereği önce çarpma yapılır: ${b} × ${c} = ${product}; sonra ${a}'dan çıkarılır: ${a} - ${product} = ${value}.`,
    instruction: `Önce ${b} ile ${c}'yi çarp, sonra ${a} sayısından bu sonucu çıkar.`,
    instructionBlank: `Önce ${b} ile bilinmeyen bir sayıyı çarp, sonra ${a} sayısından bu sonucu çıkar.`,
    contextSentence: (ctx) => `${capitalize(ctx.label)}: ${a} ${ctx.unit} vardı; bunlardan ${b} grup, her birinde ${c} ${ctx.unit} olacak şekilde kullanıldı. Geriye kaç ${ctx.unit} kaldı?`,
    wrongValue: () => Math.max(0, (a - b) * c)
  };
}

function instBracketThenMultiply(random) {
  const a = randomInt(random, 3, 20);
  const b = randomInt(random, 3, 20);
  const c = randomInt(random, 2, 9);
  const sum = a + b;
  const value = sum * c;
  return {
    exprText: `(${a} + ${b}) × ${c}`, exprBlank: `(${a} + ${b}) × ?`, missingValue: c, value,
    typicalStep: Math.max(2, Math.round(value * 0.12)),
    verbal: `Parantez önce hesaplanır: ${a} + ${b} = ${sum}; sonra ${c} ile çarpılır: ${sum} × ${c} = ${value}.`,
    instruction: `Önce ${a} ile ${b}'yi topla, sonra çıkan sonucu ${c} ile çarp.`,
    instructionBlank: `Önce ${a} ile ${b}'yi topla, sonra çıkan sonucu bilinmeyen bir sayı ile çarp.`,
    contextSentence: (ctx) => `${capitalize(ctx.label)}: bir grupta ${a} ${ctx.unit}, başka bir grupta ${b} ${ctx.unit} var; bu iki grubun toplamı ${c} takım için aynı şekilde hazırlanacak. Toplamda kaç ${ctx.unit} gerekir?`,
    wrongValue: () => a + b * c
  };
}

function instBracketThenSubtractMultiply(random) {
  const b = randomInt(random, 3, 20);
  const a = b + randomInt(random, 3, 20);
  const c = randomInt(random, 2, 9);
  const diff = a - b;
  const value = diff * c;
  return {
    exprText: `(${a} - ${b}) × ${c}`, exprBlank: `(${a} - ${b}) × ?`, missingValue: c, value,
    typicalStep: Math.max(2, Math.round(value * 0.12)),
    verbal: `Parantez önce hesaplanır: ${a} - ${b} = ${diff}; sonra ${c} ile çarpılır: ${diff} × ${c} = ${value}.`,
    instruction: `Önce ${a}'dan ${b}'yi çıkar, sonra çıkan sonucu ${c} ile çarp.`,
    instructionBlank: `Önce ${a}'dan ${b}'yi çıkar, sonra çıkan sonucu bilinmeyen bir sayı ile çarp.`,
    contextSentence: (ctx) => `${capitalize(ctx.label)}: ${a} ${ctx.unit} vardı, ${b} tanesi ayrıldı; kalan miktar ${c} katına çıkarılıyor. Sonuçta kaç ${ctx.unit} olur?`,
    wrongValue: () => Math.max(0, a - b * c)
  };
}

function instFourTermMixed(random) {
  const a = randomInt(random, 2, 9);
  const b = randomInt(random, 2, 9);
  const c = randomInt(random, 2, 9);
  const d = randomInt(random, 2, 9);
  const p1 = a * b;
  const p2 = c * d;
  const value = p1 + p2;
  return {
    exprText: `${a} × ${b} + ${c} × ${d}`, exprBlank: `${a} × ${b} + ${c} × ?`, missingValue: d, value,
    typicalStep: Math.max(2, Math.round(value * 0.12)),
    verbal: `Önce iki çarpma ayrı ayrı yapılır: ${a} × ${b} = ${p1} ve ${c} × ${d} = ${p2}; sonra toplanır: ${p1} + ${p2} = ${value}.`,
    instruction: `Önce ${a} ile ${b}'yi, ayrı olarak da ${c} ile ${d}'yi çarp; en sonda iki sonucu topla.`,
    instructionBlank: `Önce ${a} ile ${b}'yi, ayrı olarak da ${c} ile bilinmeyen bir sayıyı çarp; en sonda iki sonucu topla.`,
    contextSentence: (ctx) => `${capitalize(ctx.label)}: ${a} kutuda ${b}'şer, ayrıca ${c} kutuda ${d}'er ${ctx.unit} var. Toplamda kaç ${ctx.unit} olur?`,
    wrongValue: () => (p1 + c) * d
  };
}

function instThreeTermChainAddition(random) {
  const a = randomInt(random, 8, 40);
  const b = randomInt(random, 8, 40);
  const c = randomInt(random, 8, 40);
  const value = a + b + c;
  return {
    exprText: `${a} + ${b} + ${c}`, exprBlank: `${a} + ${b} + ?`, missingValue: c, value,
    typicalStep: Math.max(3, Math.round(value * 0.1)),
    verbal: `Üç sayı sırayla toplanır: önce ${a} + ${b} = ${a + b}, sonra + ${c} = ${value}.`,
    instruction: `Önce ${a} ile ${b}'yi topla, çıkan ara sonuca ${c}'yi ekle.`,
    instructionBlank: `Önce ${a} ile ${b}'yi topla, çıkan ara sonuca bilinmeyen bir sayı ekle.`,
    contextSentence: (ctx) => `${capitalize(ctx.label)}: üç ayrı günde sırasıyla ${a}, ${b} ve ${c} ${ctx.unit} toplanıyor. Üç günün toplamı kaç ${ctx.unit}dir?`,
    wrongValue: () => Math.max(0, a + b - c)
  };
}

function instThreeTermChainSubtraction(random) {
  const b = randomInt(random, 5, 30);
  const c = randomInt(random, 5, 30);
  const a = b + c + randomInt(random, 5, 30);
  const value = a - b - c;
  return {
    exprText: `${a} - ${b} - ${c}`, exprBlank: `${a} - ${b} - ?`, missingValue: c, value,
    typicalStep: Math.max(3, Math.round(value * 0.12) || 4),
    verbal: `Sırayla çıkarma yapılır: önce ${a} - ${b} = ${a - b}, sonra - ${c} = ${value}.`,
    instruction: `Önce ${a}'dan ${b}'yi çıkar, çıkan ara sonuçtan bir de ${c}'yi çıkar.`,
    instructionBlank: `Önce ${a}'dan ${b}'yi çıkar, çıkan ara sonuçtan bilinmeyen bir miktar daha çıkar.`,
    contextSentence: (ctx) => `${capitalize(ctx.label)}: başlangıçta ${a} ${ctx.unit} vardı; önce ${b} tanesi, sonra ${c} tanesi daha kullanıldı. Geriye kaç ${ctx.unit} kaldı?`,
    wrongValue: () => a - b + c
  };
}

function instDivisionThenAddition(random) {
  const b = randomInt(random, 2, 10);
  const quotient = randomInt(random, 3, 12);
  const a = b * quotient;
  const c = randomInt(random, 4, 30);
  const value = quotient + c;
  return {
    exprText: `${a} ÷ ${b} + ${c}`, exprBlank: `${a} ÷ ${b} + ?`, missingValue: c, value,
    typicalStep: Math.max(2, Math.round(value * 0.12)),
    verbal: `İşlem önceliği gereği önce bölme yapılır: ${a} ÷ ${b} = ${quotient}; sonra ${c} eklenir: ${quotient} + ${c} = ${value}.`,
    instruction: `Önce ${a} sayısını ${b}'ye böl, çıkan sonuca ${c}'yi ekle.`,
    instructionBlank: `Önce ${a} sayısını ${b}'ye böl, çıkan sonuca bilinmeyen bir sayı ekle.`,
    contextSentence: (ctx) => `${capitalize(ctx.label)}: toplam ${a} ${ctx.unit}, ${b} eşit gruba paylaştırılıyor; ayrıca her gruba ${c} ${ctx.unit} daha ekleniyor. Bir grupta toplam kaç ${ctx.unit} olur?`,
    wrongValue: () => Math.round((a + c) / b)
  };
}

export const SPEED_MATH_FAMILIES = [
  buildFamily('speed-math-two-term-addition', instTwoTermAddition),
  buildFamily('speed-math-two-term-subtraction', instTwoTermSubtraction),
  buildFamily('speed-math-two-term-multiplication', instTwoTermMultiplication),
  buildFamily('speed-math-exact-division', instExactDivision),
  buildFamily('speed-math-add-then-multiply-priority', instAddThenMultiply),
  buildFamily('speed-math-subtract-then-multiply-priority', instSubtractThenMultiply),
  buildFamily('speed-math-bracket-then-multiply', instBracketThenMultiply),
  buildFamily('speed-math-bracket-then-subtract-multiply', instBracketThenSubtractMultiply),
  buildFamily('speed-math-four-term-mixed', instFourTermMixed),
  buildFamily('speed-math-three-term-chain-addition', instThreeTermChainAddition),
  buildFamily('speed-math-three-term-chain-subtraction', instThreeTermChainSubtraction),
  buildFamily('speed-math-division-then-addition', instDivisionThenAddition)
];
