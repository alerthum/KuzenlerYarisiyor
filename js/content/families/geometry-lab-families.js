// Aşama 04 — geometry-lab (Geometri İnşa Alanı) için gerçek Aile→İskelet→
// Düşünme Yolu içeriği. `js/quality/family-skeleton-engine.js` sözleşmesine uyar.
//
// Bir ailenin kimliğini ŞEKİL İSMİ değil, FORMÜL YAPISI belirler: 12 aile,
// çevre/alan/hacim/açı hesaplarının GERÇEK yapısal farkını temsil eder
// (dikdörtgen çevresi ile dikdörtgen alanı ayrı ailedir çünkü formül farklıdır;
// aynı formülün farklı sayılarla tekrarı YENİ aile SAYILMAZ).
//
// Her ailede 4 iskelet (görev türü), her iskelette 3 düşünme yolu (temsil) var:
//   İskeletler (görev):
//     - direct-compute            : verilen boyutlardan istenen büyüklüğü hesapla
//     - missing-dimension-reverse : sonuç ve diğer boyutlar verili, eksik
//                                    boyutu bul (tersine düşünme)
//     - verify-and-correct        : yaygın bir formül-karıştırma yanılgısıyla
//                                    bulunmuş yanlış sonucu düzelt (hata analizi)
//     - compare-two-shapes        : aynı ailenin iki ayrı örneğini hesaplayıp
//                                    büyük/küçük farkını bul (ara sonucu yeni
//                                    kararda kullanma + strateji seçme)
//   Düşünme yolları (temsil):
//     - raw-numeric        : yalnız sayılar ve şekil görseli
//     - context-embedded   : gerçek dünya sahnesi (bahçe çiti, zemin döşeme,
//                             kutu doldurma, rampa açısı vb.)
//     - staged-strategy-hint: hangi adımın önce yapılacağını sözel anlatan
//                             strateji ipucu, formülü birebir yazmadan
//
// `visual` alanı js/app.js → geometryVisual() içindeki MEVCUT tipleri
// (rectangle/square/triangle/cube/prism/trapezoid/composite/angles) birebir
// yeniden kullanır — yeni UI eklenmedi.

function randomInt(random, min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function wrapKey(skeletonId, pathId, raw) {
  return `geometry-lab:${skeletonId}:${pathId}:${raw}`;
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

const PATH_IDS = ['raw-numeric', 'context-embedded', 'staged-strategy-hint'];

const TASK_TRAITS = {
  direct: ['strategySelection', 'multiStepInference'],
  missing: ['reverseThinking', 'informationLinking'],
  verify: ['errorAnalysis', 'conditionEvaluation'],
  compare: ['usingIntermediateResultInNewDecision', 'strategySelection']
};

function generateDirectCompute(skeletonId, inst, pathId, random) {
  const options = buildOptions(inst.value, random, inst.typicalStep);
  const answerIndex = options.indexOf(String(inst.value));
  if (pathId === 'raw-numeric') {
    return {
      prompt: inst.directPrompt, context: inst.directContext,
      options, answerIndex, explanation: inst.directExplanation, visual: inst.visual,
      questionKey: wrapKey(skeletonId, pathId, `${inst.directContext}:${inst.value}`)
    };
  }
  if (pathId === 'context-embedded') {
    return {
      prompt: inst.contextSentence(), context: 'Şekildeki bilinen ölçüleri kullanarak istenen büyüklüğü hesapla.',
      options, answerIndex, explanation: inst.directExplanation, visual: inst.visual,
      questionKey: wrapKey(skeletonId, pathId, `${inst.contextSentence()}:${inst.value}`)
    };
  }
  return {
    prompt: inst.strategyInstruction, context: 'Adımları sırayla, atlamadan uygula.',
    options, answerIndex, explanation: inst.directExplanation, visual: inst.visual,
    questionKey: wrapKey(skeletonId, pathId, `${inst.strategyInstruction}:${inst.value}`)
  };
}

function generateMissingDimensionReverse(skeletonId, inst, pathId, random) {
  const options = buildOptions(inst.missingValue, random, inst.typicalStep);
  const answerIndex = options.indexOf(String(inst.missingValue));
  if (pathId === 'raw-numeric') {
    return {
      prompt: inst.missingPrompt, context: inst.missingContext,
      options, answerIndex, explanation: inst.missingExplanation, visual: inst.missingVisual,
      questionKey: wrapKey(skeletonId, pathId, `${inst.missingContext}:${inst.missingValue}`)
    };
  }
  if (pathId === 'context-embedded') {
    return {
      prompt: inst.missingContextSentence(), context: 'Bilinen sonuçtan geriye doğru düşünerek eksik ölçüyü bul.',
      options, answerIndex, explanation: inst.missingExplanation, visual: inst.missingVisual,
      questionKey: wrapKey(skeletonId, pathId, `${inst.missingContextSentence()}:${inst.missingValue}`)
    };
  }
  return {
    prompt: inst.missingStrategyInstruction, context: 'Bilinen boyutları formülden çıkararak eksik boyutu izole et.',
    options, answerIndex, explanation: inst.missingExplanation, visual: inst.missingVisual,
    questionKey: wrapKey(skeletonId, pathId, `${inst.missingStrategyInstruction}:${inst.missingValue}`)
  };
}

function generateVerifyAndCorrect(skeletonId, inst, pathId, random) {
  const wrong = Math.round(inst.wrongValue());
  const options = buildOptions(inst.value, random, inst.typicalStep, [wrong]);
  const answerIndex = options.indexOf(String(inst.value));
  if (pathId === 'raw-numeric') {
    return {
      prompt: `${inst.directContext} Bir arkadaşın ${inst.wrongTaskLabel} ${wrong} ${inst.unit} olarak hesaplamış. Doğrusu kaç ${inst.unit}dir?`,
      context: 'Arkadaşının cevabına güvenme; doğru formülü baştan uygula.',
      options, answerIndex, explanation: `${inst.directExplanation} (Arkadaşın hatası: ${inst.wrongMistakeExplanation})`,
      visual: inst.visual,
      questionKey: wrapKey(skeletonId, pathId, `${inst.directContext}:${wrong}:${inst.value}`)
    };
  }
  if (pathId === 'context-embedded') {
    return {
      prompt: `${inst.contextSentence()} Bir arkadaşın bu hesabı ${wrong} ${inst.unit} olarak bulmuş. Doğrusu kaç ${inst.unit}dir?`,
      context: 'Kendi hesabını baştan yap; arkadaşının sonucuna güvenme.',
      options, answerIndex, explanation: `${inst.directExplanation} (Arkadaşın hatası: ${inst.wrongMistakeExplanation})`,
      visual: inst.visual,
      questionKey: wrapKey(skeletonId, pathId, `${inst.contextSentence()}:${wrong}:${inst.value}`)
    };
  }
  return {
    prompt: `${inst.strategyInstruction} Bir arkadaşın bu adımları uygularken ${wrong} ${inst.unit} sonucunu bulmuş. Doğrusu kaçtır?`,
    context: 'Adımları sırayla, dikkatle tekrar uygula.',
    options, answerIndex, explanation: `${inst.directExplanation} (Arkadaşın hatası: ${inst.wrongMistakeExplanation})`,
    visual: inst.visual,
    questionKey: wrapKey(skeletonId, pathId, `${inst.strategyInstruction}:${wrong}:${inst.value}`)
  };
}

function generateCompareTwo(skeletonId, buildInstance, pathId, random) {
  const instA = buildInstance(random);
  let instB = buildInstance(random);
  let guard = 0;
  while (instB.compareLabel === instA.compareLabel && guard < 10) { instB = buildInstance(random); guard += 1; }
  const big = Math.max(instA.value, instB.value);
  const small = Math.min(instA.value, instB.value);
  const diff = big - small;
  const typicalStep = Math.max(1, Math.round((instA.typicalStep + instB.typicalStep) / 2));
  const options = buildOptions(diff, random, typicalStep);
  const answerIndex = options.indexOf(String(diff));
  const unit = instA.unit;
  if (pathId === 'raw-numeric') {
    return {
      prompt: `A) ${instA.compareLabel}   B) ${instB.compareLabel}  — İki şeklin sonuçları arasındaki fark (büyük − küçük) kaç ${unit}dir?`,
      context: 'Önce her iki şekli ayrı ayrı hesapla, sonra sonuçları karşılaştır.',
      options, answerIndex, explanation: `A = ${instA.value} ${unit}, B = ${instB.value} ${unit}. Fark = ${big} − ${small} = ${diff} ${unit}.`,
      questionKey: wrapKey(skeletonId, pathId, `${instA.compareLabel}|${instB.compareLabel}:${diff}`)
    };
  }
  if (pathId === 'context-embedded') {
    return {
      prompt: `İki ayrı ${instA.domainLabel} projesi var: A) ${instA.compareLabel}  B) ${instB.compareLabel}. İki sonuç arasındaki fark kaç ${unit}dir?`,
      context: 'İki hesaplamayı da bitir, sonra büyük olandan küçük olanı çıkar.',
      options, answerIndex, explanation: `A = ${instA.value} ${unit}, B = ${instB.value} ${unit}. Fark = ${diff} ${unit}.`,
      questionKey: wrapKey(skeletonId, pathId, `${instA.compareLabel}|${instB.compareLabel}:${diff}:ctx`)
    };
  }
  return {
    prompt: `Birinci şekil: ${instA.compareLabel}. İkinci şekil: ${instB.compareLabel}. Önce her ikisinin sonucunu ayrı ayrı hesapla, sonra farkını bul. Fark kaç ${unit}dir?`,
    context: 'Her iki hesaplamayı da adım adım tamamla, sonra karşılaştır.',
    options, answerIndex, explanation: `Birinci sonuç ${instA.value} ${unit}, ikinci sonuç ${instB.value} ${unit}. Fark = ${diff} ${unit}.`,
    questionKey: wrapKey(skeletonId, pathId, `${instA.compareLabel}|${instB.compareLabel}:${diff}:strategy`)
  };
}

function buildFamily(familyId, buildInstance) {
  const directId = `${familyId}:direct-compute`;
  const missingId = `${familyId}:missing-dimension-reverse`;
  const verifyId = `${familyId}:verify-and-correct`;
  const compareId = `${familyId}:compare-two-shapes`;
  return {
    familyId,
    skeletons: [
      { skeletonId: directId, reasoningPathIds: PATH_IDS, cognitiveTraits: TASK_TRAITS.direct,
        generate: (random, pathId) => generateDirectCompute(directId, buildInstance(random), pathId, random) },
      { skeletonId: missingId, reasoningPathIds: PATH_IDS, cognitiveTraits: TASK_TRAITS.missing,
        generate: (random, pathId) => generateMissingDimensionReverse(missingId, buildInstance(random), pathId, random) },
      { skeletonId: verifyId, reasoningPathIds: PATH_IDS, cognitiveTraits: TASK_TRAITS.verify,
        generate: (random, pathId) => generateVerifyAndCorrect(verifyId, buildInstance(random), pathId, random) },
      { skeletonId: compareId, reasoningPathIds: PATH_IDS, cognitiveTraits: TASK_TRAITS.compare,
        generate: (random, pathId) => generateCompareTwo(compareId, buildInstance, pathId, random) }
    ]
  };
}

// ---- 12 gerçekten farklı formül-yapısı ailesi ----

function instRectanglePerimeter(random) {
  const width = randomInt(random, 4, 16);
  const height = randomInt(random, 3, 12);
  const value = 2 * (width + height);
  return {
    value, unit: 'birim', typicalStep: Math.max(2, Math.round(value * 0.12)),
    visual: { type: 'rectangle', width, height, task: 'perimeter' },
    directPrompt: 'Dikdörtgenin çevresi kaç birimdir?', directContext: `Uzunluk ${width} birim, genişlik ${height} birimdir.`,
    directExplanation: `Çevre = 2 × (${width} + ${height}) = ${value}.`,
    strategyInstruction: `Önce uzun ve kısa kenarı topla, sonra çıkan sonucu iki katına çıkar. Uzunluk ${width} birim, genişlik ${height} birimdir. Çevre kaç birimdir?`,
    contextSentence: () => `Bir okul bahçesinin çevresine tel çit çekilecek. Bahçenin uzun kenarı ${width} metre, kısa kenarı ${height} metredir. Çit için toplam kaç metre tel gerekir?`,
    missingValue: width, missingVisual: { type: 'missingRectangle', width: height, height: width, perimeter: value },
    missingPrompt: 'Dikdörtgenin bilinmeyen uzun kenarı kaç birimdir?', missingContext: `Çevre ${value} birim, kısa kenar ${height} birimdir.`,
    missingExplanation: `${value} ÷ 2 = ${width + height}; ${width + height} - ${height} = ${width}.`,
    missingContextSentence: () => `Çevresi ${value} metre olan bir bahçenin kısa kenarı ${height} metredir. Uzun kenarı kaç metredir?`,
    missingStrategyInstruction: `Önce çevreyi ikiye böl, sonra bilinen kenarı çıkar. Çevre ${value} birim, kısa kenar ${height} birimdir. Uzun kenar kaç birimdir?`,
    wrongTaskLabel: 'çevreyi', wrongValue: () => width + height, wrongMistakeExplanation: '2 ile çarpmayı unutmuş, yalnız kenarları toplamış.',
    compareLabel: `${width}×${height} dikdörtgenin çevresi`, domainLabel: 'çit'
  };
}

function instRectangleArea(random) {
  // w×h, çevre yanılgısı 2×(w+h)'ye tesadüfen eşit olabilir (ör. 4×4=16=2×(4+4),
  // 3×6=18=2×(3+6)) — bu durumda çeldirici doğru cevapla çakışır, yeniden dene.
  let width, height, value;
  let guard = 0;
  do {
    width = randomInt(random, 4, 16);
    height = randomInt(random, 3, 12);
    value = width * height;
    guard += 1;
  } while (value === 2 * (width + height) && guard < 30);
  return {
    value, unit: 'birimkare', typicalStep: Math.max(2, Math.round(value * 0.12)),
    visual: { type: 'rectangle', width, height, task: 'area' },
    directPrompt: 'Dikdörtgenin alanı kaç birimkaredir?', directContext: `Kenarları ${width} ve ${height} birimdir.`,
    directExplanation: `Alan = ${width} × ${height} = ${value}.`,
    strategyInstruction: `Kenarları çarparak alanı bul. Kenarlar ${width} ve ${height} birimdir. Alan kaç birimkaredir?`,
    contextSentence: () => `Bir sınıfın zeminine kare karo döşenecek. Zeminin kenarları ${width} metre ve ${height} metredir. Toplam kaç metrekarelik karo gerekir?`,
    missingValue: height, missingVisual: { type: 'rectangle', width, height: value / width, task: 'area' },
    missingPrompt: 'Dikdörtgenin bilinmeyen kısa kenarı kaç birimdir?', missingContext: `Alan ${value} birimkare, uzun kenar ${width} birimdir.`,
    missingExplanation: `${value} ÷ ${width} = ${height}.`,
    missingContextSentence: () => `Alanı ${value} metrekare olan bir zeminin bir kenarı ${width} metredir. Diğer kenarı kaç metredir?`,
    missingStrategyInstruction: `Alanı bilinen kenara böl. Alan ${value} birimkare, bir kenar ${width} birimdir. Diğer kenar kaç birimdir?`,
    wrongTaskLabel: 'alanı', wrongValue: () => 2 * (width + height), wrongMistakeExplanation: 'alan yerine yanlışlıkla çevre formülünü uygulamış.',
    compareLabel: `${width}×${height} dikdörtgenin alanı`, domainLabel: 'döşeme'
  };
}

function instSquareArea(random) {
  // side=4 hariç tutulur: side² (doğru alan) ile 4×side (çevre yanılgısı)
  // yalnız side=4 için tesadüfen eşit çıkar (16=16).
  let side = randomInt(random, 3, 14);
  if (side === 4) side = 5;
  const value = side * side;
  return {
    value, unit: 'birimkare', typicalStep: Math.max(2, Math.round(value * 0.12)),
    visual: { type: 'square', side, task: 'area' },
    directPrompt: 'Karenin alanı kaç birimkaredir?', directContext: `Bir kenarı ${side} birimdir.`,
    directExplanation: `Alan = ${side} × ${side} = ${value}.`,
    strategyInstruction: `Kenarı kendisiyle çarparak alanı bul. Bir kenar ${side} birimdir. Alan kaç birimkaredir?`,
    contextSentence: () => `Kare biçimli bir halının bir kenarı ${side} metredir. Halının alanı kaç metrekaredir?`,
    missingValue: side, missingVisual: { type: 'square', side, task: 'area' },
    missingPrompt: 'Karenin bir kenarı kaç birimdir?', missingContext: `Alan ${value} birimkaredir.`,
    missingExplanation: `${side} × ${side} = ${value} olduğuna göre kenar ${side}.`,
    missingContextSentence: () => `Alanı ${value} metrekare olan kare biçimli bir halının bir kenarı kaç metredir?`,
    missingStrategyInstruction: `Hangi sayının kendisiyle çarpımı ${value} eder, onu bul. Alan ${value} birimkaredir. Kenar kaç birimdir?`,
    wrongTaskLabel: 'alanı', wrongValue: () => 4 * side, wrongMistakeExplanation: 'alan yerine yanlışlıkla çevre formülünü (4 × kenar) uygulamış.',
    compareLabel: `bir kenarı ${side} olan karenin alanı`, domainLabel: 'halı'
  };
}

function instSquarePerimeter(random) {
  // side=4 hariç tutulur: 4×side (doğru çevre) ile side² (alan yanılgısı)
  // yalnız side=4 için tesadüfen eşit çıkar (16=16).
  let side = randomInt(random, 3, 18);
  if (side === 4) side = 5;
  const value = 4 * side;
  return {
    value, unit: 'birim', typicalStep: Math.max(2, Math.round(value * 0.12)),
    visual: { type: 'square', side, task: 'perimeter' },
    directPrompt: 'Karenin çevresi kaç birimdir?', directContext: `Bir kenarı ${side} birimdir.`,
    directExplanation: `Çevre = 4 × ${side} = ${value}.`,
    strategyInstruction: `Kenarı 4 ile çarparak çevreyi bul. Bir kenar ${side} birimdir. Çevre kaç birimdir?`,
    contextSentence: () => `Kare biçimli bir resim çerçevesinin bir kenarı ${side} cm'dir. Çerçevenin çevresi kaç cm'dir?`,
    missingValue: side, missingVisual: { type: 'square', side, task: 'perimeter' },
    missingPrompt: 'Karenin bir kenarı kaç birimdir?', missingContext: `Çevre ${value} birimdir.`,
    missingExplanation: `${value} ÷ 4 = ${side}.`,
    missingContextSentence: () => `Çevresi ${value} cm olan kare biçimli bir çerçevenin bir kenarı kaç cm'dir?`,
    missingStrategyInstruction: `Çevreyi 4'e böl. Çevre ${value} birimdir. Kenar kaç birimdir?`,
    wrongTaskLabel: 'çevreyi', wrongValue: () => side * side, wrongMistakeExplanation: 'çevre yerine yanlışlıkla alan formülünü (kenar × kenar) uygulamış.',
    compareLabel: `bir kenarı ${side} olan karenin çevresi`, domainLabel: 'çerçeve'
  };
}

function instTriangleArea(random) {
  const height = randomInt(random, 3, 14);
  const halfBase = randomInt(random, 3, 12);
  const base = halfBase * 2;
  const value = base * height / 2;
  return {
    value, unit: 'birimkare', typicalStep: Math.max(2, Math.round(value * 0.12)),
    visual: { type: 'triangle', base, height },
    directPrompt: 'Üçgenin alanı kaç birimkaredir?', directContext: `Taban ${base}, bu tabana ait yükseklik ${height} birimdir.`,
    directExplanation: `Alan = ${base} × ${height} ÷ 2 = ${value}.`,
    strategyInstruction: `Tabanla yüksekliği çarp, sonra ikiye böl. Taban ${base}, yükseklik ${height} birimdir. Alan kaç birimkaredir?`,
    contextSentence: () => `Üçgen biçimli bir bayrağın tabanı ${base} cm, yüksekliği ${height} cm'dir. Bayrağın alanı kaç cm²'dir?`,
    missingValue: height, missingVisual: { type: 'triangle', base, height: (2 * value) / base },
    missingPrompt: 'Üçgenin yüksekliği kaç birimdir?', missingContext: `Alan ${value} birimkare, taban ${base} birimdir.`,
    missingExplanation: `${value} × 2 ÷ ${base} = ${height}.`,
    missingContextSentence: () => `Alanı ${value} cm² olan üçgen biçimli bir bayrağın tabanı ${base} cm'dir. Yüksekliği kaç cm'dir?`,
    missingStrategyInstruction: `Alanı ikiye katla, sonra tabana böl. Alan ${value} birimkare, taban ${base} birimdir. Yükseklik kaç birimdir?`,
    wrongTaskLabel: 'alanı', wrongValue: () => base * height, wrongMistakeExplanation: 'ikiye bölmeyi unutmuş, taban × yüksekliği doğrudan alan sanmış.',
    compareLabel: `tabanı ${base}, yüksekliği ${height} olan üçgenin alanı`, domainLabel: 'bayrak'
  };
}

function instCubeVolume(random) {
  const side = randomInt(random, 2, 9);
  const value = side ** 3;
  return {
    value, unit: 'birimküp', typicalStep: Math.max(2, Math.round(value * 0.12)),
    visual: { type: 'cube', side },
    directPrompt: 'Küpün hacmi kaç birimküptür?', directContext: `Bir ayrıtı ${side} birimdir.`,
    directExplanation: `Hacim = ${side} × ${side} × ${side} = ${value}.`,
    strategyInstruction: `Ayrıtı kendisiyle iki kez çarp. Bir ayrıt ${side} birimdir. Hacim kaç birimküptür?`,
    contextSentence: () => `Küp biçimli bir hediye kutusunun bir ayrıtı ${side} cm'dir. Kutunun hacmi kaç cm³'tür?`,
    missingValue: side, missingVisual: { type: 'cube', side },
    missingPrompt: 'Küpün bir ayrıtı kaç birimdir?', missingContext: `Hacim ${value} birimküptür.`,
    missingExplanation: `${side} × ${side} × ${side} = ${value} olduğuna göre ayrıt ${side}.`,
    missingContextSentence: () => `Hacmi ${value} cm³ olan küp biçimli bir kutunun bir ayrıtı kaç cm'dir?`,
    missingStrategyInstruction: `Hangi sayının küpü ${value} eder, onu bul. Hacim ${value} birimküptür. Ayrıt kaç birimdir?`,
    wrongTaskLabel: 'hacmi', wrongValue: () => 3 * side, wrongMistakeExplanation: 'ayrıtı küp yerine yalnız 3 ile çarpmış (kenarları toplama hatası).',
    compareLabel: `bir ayrıtı ${side} olan küpün hacmi`, domainLabel: 'kutu'
  };
}

function instPrismVolume(random) {
  const width = randomInt(random, 3, 10);
  const depth = randomInt(random, 2, 8);
  const height = randomInt(random, 2, 9);
  const value = width * depth * height;
  return {
    value, unit: 'birimküp', typicalStep: Math.max(2, Math.round(value * 0.12)),
    visual: { type: 'prism', width, depth, height },
    directPrompt: 'Dikdörtgenler prizmasının hacmi kaç birimküptür?', directContext: `Boyutları ${width} × ${depth} × ${height} birimdir.`,
    directExplanation: `Hacim = ${width} × ${depth} × ${height} = ${value}.`,
    strategyInstruction: `Üç boyutu sırayla çarp. Boyutlar ${width}, ${depth}, ${height} birimdir. Hacim kaç birimküptür?`,
    contextSentence: () => `Dikdörtgenler prizması biçimli bir su deposunun boyutları ${width} × ${depth} × ${height} metredir. Deponun hacmi kaç metreküptür?`,
    missingValue: height, missingVisual: { type: 'prism', width, depth, height: value / (width * depth) },
    missingPrompt: 'Prizmanın bilinmeyen üçüncü boyutu (yüksekliği) kaç birimdir?', missingContext: `Hacim ${value} birimküp, taban kenarları ${width} ve ${depth} birimdir.`,
    missingExplanation: `${value} ÷ (${width} × ${depth}) = ${value} ÷ ${width * depth} = ${height}.`,
    missingContextSentence: () => `Hacmi ${value} m³ olan bir su deposunun taban kenarları ${width} m ve ${depth} m'dir. Yüksekliği kaç metredir?`,
    missingStrategyInstruction: `Hacmi bilinen iki boyutun çarpımına böl. Hacim ${value} birimküp, boyutlar ${width} ve ${depth} birimdir. Üçüncü boyut kaç birimdir?`,
    wrongTaskLabel: 'hacmi', wrongValue: () => width + depth + height, wrongMistakeExplanation: 'çarpma yerine yanlışlıkla üç boyutu toplamış.',
    compareLabel: `${width}×${depth}×${height} prizmanın hacmi`, domainLabel: 'depo'
  };
}

function instTrapezoidArea(random) {
  const a = randomInt(random, 5, 12);
  const bRaw = randomInt(random, 13, 22);
  const height = randomInt(random, 3, 10);
  const sumEven = (a + bRaw) % 2 === 0 ? a + bRaw : a + bRaw + 1;
  const b = sumEven - a;
  const value = sumEven * height / 2;
  return {
    value, unit: 'birimkare', typicalStep: Math.max(2, Math.round(value * 0.12)),
    visual: { type: 'trapezoid', a, b, height },
    directPrompt: 'Yamuğun alanı kaç birimkaredir?', directContext: `Paralel kenarlar ${a} ve ${b}, yükseklik ${height} birimdir.`,
    directExplanation: `Alan = (${a} + ${b}) × ${height} ÷ 2 = ${value}.`,
    strategyInstruction: `Paralel kenarları topla, yükseklikle çarp, sonra ikiye böl. Kenarlar ${a} ve ${b}, yükseklik ${height} birimdir. Alan kaç birimkaredir?`,
    contextSentence: () => `Yamuk biçimli bir arsanın paralel kenarları ${a} m ve ${b} m, genişliği (yüksekliği) ${height} m'dir. Arsanın alanı kaç m²'dir?`,
    missingValue: b, missingVisual: { type: 'trapezoid', a, b: (2 * value) / height - a, height },
    missingPrompt: 'Yamuğun bilinmeyen paralel kenarı kaç birimdir?', missingContext: `Alan ${value} birimkare, bir paralel kenar ${a} birim, yükseklik ${height} birimdir.`,
    missingExplanation: `${value} × 2 ÷ ${height} = ${sumEven}; ${sumEven} - ${a} = ${b}.`,
    missingContextSentence: () => `Alanı ${value} m² olan yamuk biçimli bir arsanın bir paralel kenarı ${a} m, yüksekliği ${height} m'dir. Diğer paralel kenar kaç metredir?`,
    missingStrategyInstruction: `Alanı ikiye katla, yüksekliğe böl, sonra bilinen kenarı çıkar. Alan ${value} birimkare, bir kenar ${a}, yükseklik ${height} birimdir. Diğer kenar kaç birimdir?`,
    wrongTaskLabel: 'alanı', wrongValue: () => sumEven * height, wrongMistakeExplanation: 'ikiye bölmeyi unutmuş, (kenarlar toplamı) × yüksekliği doğrudan alan sanmış.',
    compareLabel: `paralel kenarları ${a} ve ${b} olan yamuğun alanı`, domainLabel: 'arsa'
  };
}

function instCompositeArea(random) {
  const width = randomInt(random, 9, 16);
  const height = randomInt(random, 7, 13);
  const cutW = randomInt(random, 2, width - 4);
  const cutH = randomInt(random, 2, height - 3);
  const value = width * height - cutW * cutH;
  return {
    value, unit: 'birimkare', typicalStep: Math.max(2, Math.round(value * 0.12)),
    visual: { type: 'composite', width, height, cutW, cutH },
    directPrompt: 'L biçimli boyalı bölgenin alanı kaç birimkaredir?', directContext: `${width}×${height} dikdörtgenden ${cutW}×${cutH} dikdörtgen çıkarılmıştır.`,
    directExplanation: `${width * height} - ${cutW * cutH} = ${value}.`,
    strategyInstruction: `Önce büyük dikdörtgenin alanını bul, sonra kesilen küçük dikdörtgenin alanını çıkar. Büyük dikdörtgen ${width}×${height}, kesilen ${cutW}×${cutH} birimdir. Kalan alan kaç birimkaredir?`,
    contextSentence: () => `L biçimli bir bahçenin tamamı ${width}×${height} metrelik bir alandan, köşesinden ${cutW}×${cutH} metrelik bir bölüm çıkarılarak oluşmuştur. Bahçenin gerçek alanı kaç m²'dir?`,
    missingValue: cutH, missingVisual: { type: 'composite', width, height, cutW, cutH: (width * height - value) / cutW },
    missingPrompt: 'Çıkarılan bölgenin bilinmeyen kenarı kaç birimdir?', missingContext: `Büyük dikdörtgen ${width}×${height}, kalan alan ${value} birimkare, çıkarılan bölgenin bir kenarı ${cutW} birimdir.`,
    missingExplanation: `${width * height} - ${value} = ${width * height - value}; ${width * height - value} ÷ ${cutW} = ${cutH}.`,
    missingContextSentence: () => `L biçimli bir bahçenin (${width}×${height} m'lik alandan bir köşe çıkarılarak oluşan) gerçek alanı ${value} m²'dir. Çıkarılan bölgenin bir kenarı ${cutW} m ise diğer kenarı kaç metredir?`,
    missingStrategyInstruction: `Önce büyük alandan kalan alanı çıkar, sonra bilinen kenara böl. Büyük dikdörtgen ${width}×${height}, kalan alan ${value} birimkare, bir kenar ${cutW} birimdir. Diğer kenar kaç birimdir?`,
    wrongTaskLabel: 'kalan alanı', wrongValue: () => width * height + cutW * cutH, wrongMistakeExplanation: 'çıkarma yerine yanlışlıkla kesilen bölgenin alanını toplamış.',
    compareLabel: `${width}×${height}'den ${cutW}×${cutH} çıkarılmış bölgenin alanı`, domainLabel: 'bahçe düzenlemesi'
  };
}

function instTriangleAngleSum(random) {
  const first = randomInt(random, 35, 85);
  const second = randomInt(random, 35, 85 - Math.max(0, first - 85));
  const safeSecond = Math.min(second, 179 - first - 5);
  const value = 180 - first - safeSecond;
  return {
    value, unit: '°', typicalStep: 5,
    visual: { type: 'angles', first, second: safeSecond, answer: value },
    directPrompt: 'Üçgenin bilinmeyen açısı kaç derecedir?', directContext: `Diğer açılar ${first}° ve ${safeSecond}°'dir.`,
    directExplanation: `Üçgenin açıları toplamı 180°: 180 - ${first} - ${safeSecond} = ${value}°.`,
    strategyInstruction: `Bilinen iki açıyı topla, sonra 180'den çıkar. Açılar ${first}° ve ${safeSecond}°'dir. Üçüncü açı kaç derecedir?`,
    contextSentence: () => `Üçgen biçimli bir çatı payandasının iki açısı ${first}° ve ${safeSecond}°'dir. Üçüncü açı kaç derecedir?`,
    missingValue: first, missingVisual: { type: 'angles', first: safeSecond, second: value, answer: first },
    missingPrompt: 'Üçgenin bilinmeyen ilk açısı kaç derecedir?', missingContext: `Diğer iki açı ${safeSecond}° ve ${value}°'dir.`,
    missingExplanation: `180 - ${safeSecond} - ${value} = ${first}.`,
    missingContextSentence: () => `Üçgen biçimli bir çatı payandasının açılarından ikisi ${safeSecond}° ve ${value}°'dir. Üçüncü açı kaç derecedir?`,
    missingStrategyInstruction: `İki bilinen açıyı 180'den çıkar. Açılar ${safeSecond}° ve ${value}°'dir. Diğer açı kaç derecedir?`,
    wrongTaskLabel: 'üçüncü açıyı', wrongValue: () => 360 - first - safeSecond, wrongMistakeExplanation: 'üçgen yerine dörtgenin açı toplamını (360°) kullanmış.',
    compareLabel: `açıları ${first}° ve ${safeSecond}° olan üçgenin üçüncü açısı`, domainLabel: 'çatı payandası'
  };
}

const PYTHAGOREAN_TRIPLES = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [7, 24, 25], [9, 12, 15], [20, 21, 29]];

function instRightTriangleHypotenuse(random) {
  const [legA, legB, hyp] = PYTHAGOREAN_TRIPLES[Math.floor(random() * PYTHAGOREAN_TRIPLES.length)];
  const value = hyp;
  return {
    value, unit: 'birim', typicalStep: Math.max(2, Math.round(value * 0.15)),
    visual: { type: 'triangle', base: legA, height: legB },
    directPrompt: 'Dik üçgenin hipotenüsü kaç birimdir?', directContext: `Dik kenarlar ${legA} ve ${legB} birimdir.`,
    directExplanation: `Pisagor bağıntısı: ${legA}² + ${legB}² = ${legA * legA} + ${legB * legB} = ${legA * legA + legB * legB} = ${hyp}².`,
    strategyInstruction: `Her iki dik kenarın karesini al, topla, sonra toplamın karekökünü bul. Dik kenarlar ${legA} ve ${legB} birimdir. Hipotenüs kaç birimdir?`,
    contextSentence: () => `Bir merdiven duvara ${legA} m mesafede yerden ${legB} m yükseklikte bir noktaya dayanıyor. Merdivenin uzunluğu (hipotenüs) kaç metredir?`,
    missingValue: legB, missingVisual: { type: 'triangle', base: legA, height: legB },
    missingPrompt: 'Dik üçgenin bilinmeyen dik kenarı kaç birimdir?', missingContext: `Hipotenüs ${hyp} birim, bir dik kenar ${legA} birimdir.`,
    missingExplanation: `${hyp}² - ${legA}² = ${hyp * hyp} - ${legA * legA} = ${legB * legB} = ${legB}².`,
    missingContextSentence: () => `Uzunluğu ${hyp} m olan bir merdiven duvara ${legA} m mesafede yerleştiriliyor. Merdivenin ulaştığı yükseklik kaç metredir?`,
    missingStrategyInstruction: `Hipotenüsün karesinden bilinen dik kenarın karesini çıkar, sonra karekökünü al. Hipotenüs ${hyp} birim, bir dik kenar ${legA} birimdir. Diğer dik kenar kaç birimdir?`,
    wrongTaskLabel: 'hipotenüsü', wrongValue: () => legA + legB, wrongMistakeExplanation: 'Pisagor bağıntısını uygulamak yerine iki dik kenarı doğrudan toplamış.',
    compareLabel: `dik kenarları ${legA} ve ${legB} olan üçgenin hipotenüsü`, domainLabel: 'merdiven'
  };
}

function instCubeSurfaceArea(random) {
  // side=6 hariç tutulur: side³ (hacim yanılgısı) ile 6×side² (doğru yüzey
  // alanı) yalnız side=6 için tesadüfen eşit çıkar (216=216) — bu, yanılgı
  // seçeneğinin doğru cevapla çakışmasına yol açardı.
  let side = randomInt(random, 2, 9);
  if (side === 6) side = 7;
  const value = 6 * side * side;
  return {
    value, unit: 'birimkare', typicalStep: Math.max(2, Math.round(value * 0.12)),
    visual: { type: 'cube', side },
    directPrompt: 'Küpün toplam yüzey alanı kaç birimkaredir?', directContext: `Bir ayrıtı ${side} birimdir.`,
    directExplanation: `Yüzey alanı = 6 × ${side} × ${side} = ${value}.`,
    strategyInstruction: `Bir yüzün alanını bul, sonra 6 ile çarp (küpün 6 yüzü var). Bir ayrıt ${side} birimdir. Yüzey alanı kaç birimkaredir?`,
    contextSentence: () => `Küp biçimli bir kutunun tüm yüzeyi kağıtla kaplanacak. Bir ayrıtı ${side} cm'dir. Kaplamak için kaç cm² kağıt gerekir?`,
    missingValue: side, missingVisual: { type: 'cube', side },
    missingPrompt: 'Küpün bir ayrıtı kaç birimdir?', missingContext: `Yüzey alanı ${value} birimkaredir.`,
    missingExplanation: `${value} ÷ 6 = ${side * side}; hangi sayının karesi ${side * side} eder — ${side}.`,
    missingContextSentence: () => `Yüzey alanı ${value} cm² olan küp biçimli bir kutunun bir ayrıtı kaç cm'dir?`,
    missingStrategyInstruction: `Yüzey alanını 6'ya böl, sonra karekökünü bul. Yüzey alanı ${value} birimkaredir. Ayrıt kaç birimdir?`,
    wrongTaskLabel: 'yüzey alanını', wrongValue: () => side * side * side, wrongMistakeExplanation: 'yüzey alanı yerine yanlışlıkla hacim formülünü (ayrıt³) uygulamış.',
    compareLabel: `bir ayrıtı ${side} olan küpün yüzey alanı`, domainLabel: 'ambalaj'
  };
}

export const GEOMETRY_LAB_FAMILIES = [
  buildFamily('geometry-rectangle-perimeter', instRectanglePerimeter),
  buildFamily('geometry-rectangle-area', instRectangleArea),
  buildFamily('geometry-square-area', instSquareArea),
  buildFamily('geometry-square-perimeter', instSquarePerimeter),
  buildFamily('geometry-triangle-area', instTriangleArea),
  buildFamily('geometry-cube-volume', instCubeVolume),
  buildFamily('geometry-prism-volume', instPrismVolume),
  buildFamily('geometry-trapezoid-area', instTrapezoidArea),
  buildFamily('geometry-composite-area', instCompositeArea),
  buildFamily('geometry-triangle-angle-sum', instTriangleAngleSum),
  buildFamily('geometry-right-triangle-hypotenuse', instRightTriangleHypotenuse),
  buildFamily('geometry-cube-surface-area', instCubeSurfaceArea)
];
