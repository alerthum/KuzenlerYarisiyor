// Aşama 04 — error-detective (Yanlış Çözümü Yakala).
// Aile kimliği = GERÇEK HATA TÜRÜ (elde unutma, işlem önceliği, çevre/alan
// karışıklığı vb.). Aynı hatanın farklı sayılarla tekrarı yeni aile DEĞİLDİR.
//
// Görevler:
//   find-first-error-step   — 4 adımlı çözümde ilk hatalı satırı seç
//   identify-wrong-result   — hatalı zincirin doğru sonucunu seç
//   propose-corrected-step  — hatalı satırın doğrusunu seç
//   compare-two-chains      — iki kısa çözümden hangisinin hatalı olduğunu seç
// Yollar: raw-steps / context-embedded / staged-strategy-hint
//
// Mevcut UI: kind:'choice' — adımlar veya düzeltmeler seçenek olarak gösterilir.

import { buildErrorDetectiveNewFamiliesV2, ERROR_DETECTIVE_NEW_FAMILY_COUNT } from '../blueprints/error-detective-new-families-v2.js';

function randomInt(random, min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function pick(items, random) {
  return items[Math.floor(random() * items.length)];
}

function wrapKey(skeletonId, pathId, raw) {
  return `error-detective:${skeletonId}:${pathId}:${raw}`;
}

function shuffle(list, random) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildNumericOptions(answer, random, extras = []) {
  const values = new Set([answer]);
  for (const c of extras) {
    if (Number.isFinite(c) && c >= 0 && c !== answer) values.add(Math.round(c));
  }
  const offsets = [1, -1, 2, -2, 5, -5, 10, -10, 3, -3];
  let i = 0;
  while (values.size < 4 && i < 80) {
    const c = answer + offsets[i % offsets.length];
    if (c >= 0 && !values.has(c)) values.add(c);
    i += 1;
  }
  while (values.size < 4) values.add(answer + values.size + 1);
  return shuffle([...values], random).map(String);
}

const PATH_IDS = [
  'raw-steps',
  'context-embedded',
  'staged-strategy-hint',
  'counterexample-first',
  'constraint-ordering'
];
const TASK_TRAITS = {
  find: ['errorAnalysis', 'multiStepInference'],
  result: ['errorAnalysis', 'usingIntermediateResultInNewDecision'],
  correct: ['errorAnalysis', 'conditionEvaluation'],
  compare: ['errorAnalysis', 'strategySelection']
};

const STEM_FRAMES = [
  'İlk hatalı adım hangisi?', 'Doğru sonuç hangisidir?',
  'Düzeltme sonrası doğru satır?', 'Hatalı zinciri seç:',
  'Ara sonuç bozulunca ne olur?', 'Yanılgı tuzağına düşmeden seç:',
  'Hangisi zorunlu çıkarımı bozar?', 'Eleme sonrası kalan doğru?',
  'Koşulları sağlayan tek seçenek?', 'Hangi seçenek düşünme yolunu bozar?',
  'Doğru stratejinin çıktısı nedir?', 'Karşı örnekle elenenler dışında kalan?',
  'Kontrol ettikten sonra kalan doğru?', 'Zorunlu ara sonucu kullanan cevap?',
  'Yüzey tuzağı olmayan seçenek?', 'Hedef soruya en uygun yanıt?',
  'İkinci adım tamamlanınca ne bulunur?', 'Kısmi doğruyu tam sanan hangisi?',
  'Kanıtla uyumlu düzeltme?', 'Çok adımlı çözümün sonu hangisi?'
];

function pathWrap(pathId, rawPrompt, contextHint, strategyHint) {
  if (pathId === 'raw-steps') return { prompt: rawPrompt, context: contextHint || 'Adımları sırayla incele.' };
  if (pathId === 'context-embedded') {
    return {
      prompt: `Bir öğrenci şu çözümü yazdı. ${rawPrompt}`,
      context: 'Gereksiz cümleleri ayıkla; matematik adımlarına odaklan.'
    };
  }
  if (pathId === 'counterexample-first') {
    return {
      prompt: `Önce açıkça yanlış adımı ele: ${rawPrompt}`,
      context: 'Eleme yolu; spoiler yok.'
    };
  }
  if (pathId === 'constraint-ordering') {
    return {
      prompt: `Adımları sırayla doğrula: ${rawPrompt}`,
      context: 'Kısıt sıralama; ilk bozulan çıkarım kritik.'
    };
  }
  return {
    prompt: `${strategyHint || 'Önce her adımın bir öncekinden zorunlu olarak çıkıp çıkmadığını kontrol et.'} ${rawPrompt}`,
    context: 'Strateji: ilk bozulan çıkarımı işaretle; sonraki adımlar ona bağlı olabilir.'
  };
}

function findRound(skeletonId, pathId, steps, wrongIndex, explanation, random, texts) {
  const options = steps.map((step, index) => `${index + 1}. ${step}`);
  const frame = pick(STEM_FRAMES, random);
  const { prompt, context } = pathWrap(pathId, `${texts.raw} ${frame}`, texts.context, texts.strategy);
  const nonce = Math.floor(random() * 1e9).toString(36);
  return {
    prompt,
    context,
    steps,
    options,
    answerIndex: wrongIndex,
    explanation,
    questionKey: wrapKey(skeletonId, pathId, `${steps.join('|')}|${nonce}`)
  };
}

function resultRound(skeletonId, pathId, correctResult, wrongResult, explanation, random, texts, extras = []) {
  const options = buildNumericOptions(correctResult, random, [wrongResult, ...extras]);
  const answerIndex = options.indexOf(String(correctResult));
  const frame = pick(STEM_FRAMES, random);
  const { prompt, context } = pathWrap(pathId, `${texts.raw} ${frame}`, texts.context, texts.strategy);
  const nonce = Math.floor(random() * 1e9).toString(36);
  return {
    prompt,
    context,
    options,
    answerIndex,
    explanation,
    questionKey: wrapKey(skeletonId, pathId, `${texts.raw}|${correctResult}|${nonce}`)
  };
}

function correctStepRound(skeletonId, pathId, correctStepText, distractors, explanation, random, texts) {
  const options = shuffle([correctStepText, ...distractors.slice(0, 3)], random);
  while (options.length < 4) options.push(`Diğer: ${options.length}`);
  const answerIndex = options.indexOf(correctStepText);
  const frame = pick(STEM_FRAMES, random);
  const { prompt, context } = pathWrap(pathId, `${texts.raw} ${frame}`, texts.context, texts.strategy);
  const nonce = Math.floor(random() * 1e9).toString(36);
  return {
    prompt,
    context,
    options,
    answerIndex,
    explanation,
    questionKey: wrapKey(skeletonId, pathId, `${correctStepText}|${texts.raw}|${nonce}`)
  };
}

function compareRound(skeletonId, pathId, labelCorrect, optionsFour, answerLabel, explanation, random, texts) {
  const options = shuffle(optionsFour, random);
  const answerIndex = options.indexOf(answerLabel);
  const frame = pick(STEM_FRAMES, random);
  const { prompt, context } = pathWrap(pathId, `${texts.raw} ${frame}`, texts.context, texts.strategy);
  const nonce = Math.floor(random() * 1e9).toString(36);
  return {
    prompt,
    context,
    options,
    answerIndex,
    explanation: `${explanation} (Doğru seçim: ${labelCorrect})`,
    questionKey: wrapKey(skeletonId, pathId, `${texts.raw}|${answerLabel}|${nonce}`)
  };
}

function buildFamily(familyId, builders) {
  const ids = {
    find: `${familyId}:find-first-error-step`,
    result: `${familyId}:identify-wrong-result`,
    correct: `${familyId}:propose-corrected-step`,
    compare: `${familyId}:compare-two-chains`
  };
  return {
    familyId,
    skeletons: [
      { skeletonId: ids.find, reasoningPathIds: PATH_IDS, cognitiveTraits: TASK_TRAITS.find, generate: (r, p) => builders.find(ids.find, p, r) },
      { skeletonId: ids.result, reasoningPathIds: PATH_IDS, cognitiveTraits: TASK_TRAITS.result, generate: (r, p) => builders.result(ids.result, p, r) },
      { skeletonId: ids.correct, reasoningPathIds: PATH_IDS, cognitiveTraits: TASK_TRAITS.correct, generate: (r, p) => builders.correct(ids.correct, p, r) },
      { skeletonId: ids.compare, reasoningPathIds: PATH_IDS, cognitiveTraits: TASK_TRAITS.compare, generate: (r, p) => builders.compare(ids.compare, p, r) }
    ]
  };
}

function familyCarry() {
  return buildFamily('ed-addition-carry-forgotten', {
    find(id, pathId, random) {
      const tensA = randomInt(random, 2, 8);
      const tensB = randomInt(random, 1, 8);
      const onesA = randomInt(random, 5, 9);
      const onesB = randomInt(random, Math.max(2, 10 - onesA), 9);
      const a = tensA * 10 + onesA;
      const b = tensB * 10 + onesB;
      const onesResult = (onesA + onesB) % 10;
      const wrongTens = tensA + tensB;
      const correctTens = wrongTens + 1;
      const steps = [
        `${a} + ${b} işlemi yapılacak.`,
        `Birler: ${onesA} + ${onesB} = ${onesA + onesB}; ${onesResult} yazılıp 1 elde edilir.`,
        `Onlar: ${tensA} + ${tensB} = ${wrongTens} yazılır.`,
        `Sonuç ${wrongTens * 10 + onesResult} bulunur.`
      ];
      return findRound(id, pathId, steps, 2, `Elde unutulmuştur. Onlar ${tensA}+${tensB}+1=${correctTens}; doğru sonuç ${a + b}.`, random, {
        raw: 'İlk hatalı satırı bul.',
        strategy: 'Elde taşınıp taşınmadığını kontrol et.'
      });
    },
    result(id, pathId, random) {
      const a = randomInt(random, 25, 89);
      const b = randomInt(random, 15, 49);
      const correct = a + b;
      const wrong = correct - 10;
      return resultRound(id, pathId, correct, wrong, `Doğru toplam ${a}+${b}=${correct}. Elde unutulursa ${wrong} gibi görünür.`, random, {
        raw: `Bir öğrenci ${a}+${b} için eldeyi unutup ${wrong} bulmuş. Doğru sonuç kaçtır?`
      }, [a, b]);
    },
    correct(id, pathId, random) {
      const tensA = 4;
      const tensB = 3;
      const onesA = 7;
      const onesB = 8;
      const correctLine = `Onlar: ${tensA} + ${tensB} + 1 = ${tensA + tensB + 1} yazılır.`;
      return correctStepRound(id, pathId, correctLine, [
        `Onlar: ${tensA} + ${tensB} = ${tensA + tensB} yazılır.`,
        `Onlar: ${tensA} × ${tensB} = ${tensA * tensB} yazılır.`,
        `Onlar: ${onesA} + ${onesB} = ${onesA + onesB} yazılır.`
      ], 'Elde 1 eklenmelidir.', random, {
        raw: `${tensA * 10 + onesA}+${tensB * 10 + onesB} çözümünde onlar satırı hatalı. Doğru onlar satırı hangisidir?`
      });
    },
    compare(id, pathId, random) {
      const a = 47;
      const b = 38;
      const answer = 'Yalnız B hatalı (elde unutulmuş)';
      return compareRound(id, pathId, answer, [
        answer,
        'Yalnız A hatalı',
        'İkisi de doğru',
        'İkisi de hatalı'
      ], answer, `A: ${a}+${b}=${a + b} doğru. B: elde unutulmuş.`, random, {
        raw: `A: "${a}+${b}=${a + b}". B: "${a}+${b}=${a + b - 10} (elde yok)". Hangisi hatalı?`
      });
    }
  });
}

function familyBorrow() {
  return buildFamily('ed-subtraction-borrow-reversed', {
    find(id, pathId, random) {
      const tensA = randomInt(random, 4, 9);
      const onesA = randomInt(random, 0, 4);
      const tensB = randomInt(random, 1, tensA - 1);
      const onesB = randomInt(random, onesA + 1, 9);
      const a = tensA * 10 + onesA;
      const b = tensB * 10 + onesB;
      const wrongOnes = onesB - onesA;
      const wrongResult = (tensA - tensB) * 10 + wrongOnes;
      const steps = [
        `${a} - ${b} işlemi yapılacak.`,
        `Birler basamağında ${onesB} - ${onesA} = ${wrongOnes} yazılır.`,
        `Onlar basamağında ${tensA} - ${tensB} = ${tensA - tensB} yazılır.`,
        `Sonuç ${wrongResult} bulunur.`
      ];
      return findRound(id, pathId, steps, 1, `${onesA}<${onesB} iken üstten alta çıkarmak yanlıştır; onluk bozulmalı. Doğru: ${a - b}.`, random, {
        raw: 'İlk hatalı satırı bul.'
      });
    },
    result(id, pathId, random) {
      const a = randomInt(random, 40, 90);
      const b = randomInt(random, 15, Math.min(39, a - 1));
      // ensure onesA < onesB situation roughly for wrong path
      const correct = a - b;
      const wrong = Math.abs((a % 10) - (b % 10)) + Math.floor(a / 10) * 10 - Math.floor(b / 10) * 10;
      const safeWrong = wrong === correct ? correct + 1 : Math.max(0, wrong);
      return resultRound(id, pathId, correct, safeWrong, `Doğru fark ${a}-${b}=${correct}.`, random, {
        raw: `${a}-${b} için ters çıkarma yapan öğrenci ${safeWrong} bulmuş. Doğru sonuç?`
      });
    },
    correct(id, pathId, random) {
      const tensA = randomInt(random, 4, 9);
      const onesA = randomInt(random, 0, 4);
      const tensB = randomInt(random, 1, tensA - 1);
      const onesB = randomInt(random, onesA + 1, 9);
      const a = tensA * 10 + onesA;
      const b = tensB * 10 + onesB;
      const correctLine = 'Birler yetmediği için onluktan 1 bozulur; sonra çıkarma yapılır.';
      return correctStepRound(id, pathId, correctLine, [
        'Küçükten büyüğü çıkarırız, işaret koyarız.',
        'Önce onlar basamağı çıkarılır.',
        'Çarpma ile kontrol edilir.'
      ], 'Onluk bozma gerekir.', random, {
        raw: `${a}−${b} çözümünde birler satırı hatalı. Doğru düzeltme hangisidir?`
      });
    },
    compare(id, pathId, random) {
      const tensA = randomInt(random, 4, 9);
      const onesA = randomInt(random, 0, 4);
      const tensB = randomInt(random, 1, tensA - 1);
      const onesB = randomInt(random, onesA + 1, 9);
      const a = tensA * 10 + onesA;
      const b = tensB * 10 + onesB;
      const answer = 'Yalnız A hatalı (ters çıkarma)';
      return compareRound(id, pathId, answer, [answer, 'Yalnız B hatalı', 'İkisi de doğru', 'İkisi de hatalı'], answer, 'A ters çıkarmış; B doğru onluk bozmuş.', random, {
        raw: `A: "${a}−${b} → birler ${onesB}−${onesA}=${onesB - onesA}". B: "${a}−${b} → onluk bozup ${10 + onesA}−${onesB}=${10 + onesA - onesB}". Hangisi hatalı?`
      });
    }
  });
}

function familyPriority() {
  return buildFamily('ed-operator-priority-ltr', {
    find(id, pathId, random) {
      const a = randomInt(random, 4, 15);
      const b = randomInt(random, 2, 8);
      const c = randomInt(random, 2, 8);
      const wrongFirst = a + b;
      const steps = [
        `${a} + ${b} × ${c} işlemi verildi.`,
        `Önce ${a} + ${b} = ${wrongFirst} yapılır.`,
        `Sonra ${wrongFirst} × ${c} = ${wrongFirst * c} bulunur.`,
        `Sonuç ${wrongFirst * c} yazılır.`
      ];
      return findRound(id, pathId, steps, 1, `Çarpma önce: ${b}×${c}=${b * c}; ${a}+${b * c}=${a + b * c}.`, random, {
        raw: 'İlk hatalı satırı bul.'
      });
    },
    result(id, pathId, random) {
      const a = randomInt(random, 4, 12);
      const b = randomInt(random, 2, 8);
      const c = randomInt(random, 2, 8);
      const correct = a + b * c;
      const wrong = (a + b) * c;
      return resultRound(id, pathId, correct, wrong, `Doğru: ${a}+${b}×${c}=${correct}.`, random, {
        raw: `${a}+${b}×${c} için soldan sağa giden öğrenci ${wrong} bulmuş. Doğru sonuç?`
      });
    },
    correct(id, pathId, random) {
      const a = 5;
      const b = 3;
      const c = 4;
      const correctLine = `Önce ${b} × ${c} = ${b * c} yapılır.`;
      return correctStepRound(id, pathId, correctLine, [
        `Önce ${a} + ${b} = ${a + b} yapılır.`,
        `Önce ${a} × ${c} = ${a * c} yapılır.`,
        `Önce ${a} − ${b} = ${a - b} yapılır.`
      ], 'Çarpma toplamadan önce gelir.', random, {
        raw: `${a}+${b}×${c} çözümünde ilk işlem satırı hatalı. Doğru ilk işlem hangisidir?`
      });
    },
    compare(id, pathId, random) {
      const a = randomInt(random, 2, 9);
      const b = randomInt(random, 2, 8);
      const c = randomInt(random, 2, 8);
      const wrong = (a + b) * c;
      const correct = a + b * c;
      const answer = 'Yalnız A hatalı (öncelik yok)';
      return compareRound(id, pathId, answer, [answer, 'Yalnız B hatalı', 'İkisi de doğru', 'İkisi de hatalı'], answer, 'A soldan sağa; B çarpmayı önce yapmış.', random, {
        raw: `A: "${a}+${b}×${c}=(${a}+${b})×${c}=${wrong}". B: "${a}+${b}×${c}=${a}+${b * c}=${correct}". Hangisi hatalı?`
      });
    }
  });
}

function familyPerimeterArea() {
  return buildFamily('ed-perimeter-area-swap', {
    find(id, pathId, random) {
      const width = randomInt(random, 3, 12);
      const height = randomInt(random, 2, 10);
      const steps = [
        `Kenarları ${width} ve ${height} birim olan dikdörtgenin çevresi aranıyor.`,
        `${width} × ${height} = ${width * height} hesaplanır.`,
        `Çevre ${width * height} birim yazılır.`,
        'İşlem tamamlanır.'
      ];
      return findRound(id, pathId, steps, 1, `Çarpım alan verir. Çevre 2×(${width}+${height})=${2 * (width + height)}.`, random, {
        raw: 'İlk hatalı satırı bul.'
      });
    },
    result(id, pathId, random) {
      const w = randomInt(random, 3, 12);
      const h = randomInt(random, 2, 10);
      const correct = 2 * (w + h);
      const wrong = w * h;
      return resultRound(id, pathId, correct, wrong, `Çevre ${correct}; alan ${wrong} ile karıştırılmış.`, random, {
        raw: `${w}×${h} dikdörtgenin çevresi için öğrenci ${wrong} bulmuş. Doğru çevre?`
      });
    },
    correct(id, pathId, random) {
      const w = 6;
      const h = 4;
      const correctLine = `Çevre = 2 × (${w} + ${h}) = ${2 * (w + h)}.`;
      return correctStepRound(id, pathId, correctLine, [
        `Çevre = ${w} × ${h} = ${w * h}.`,
        `Çevre = ${w} + ${h} = ${w + h}.`,
        `Çevre = ${w} × 2 = ${w * 2}.`
      ], 'Çevre formülü 2(w+h).', random, {
        raw: 'Çevre sorusunda formül satırı hatalı. Doğru satır hangisidir?'
      });
    },
    compare(id, pathId, random) {
      const answer = 'Yalnız A hatalı (alan formülü)';
      return compareRound(id, pathId, answer, [answer, 'Yalnız B hatalı', 'İkisi de doğru', 'İkisi de hatalı'], answer, 'A alan formülünü çevre sanmış.', random, {
        raw: 'A: "çevre=5×3=15". B: "çevre=2×(5+3)=16". Hangisi hatalı?'
      });
    }
  });
}

function familyPlaceValueMul() {
  return buildFamily('ed-place-value-partial-multiply', {
    find(id, pathId, random) {
      const tens = randomInt(random, 2, 8);
      const ones = randomInt(random, 1, 9);
      const multiplier = randomInt(random, 3, 8);
      const number = tens * 10 + ones;
      const onesPart = ones * multiplier;
      const wrongTensPart = tens * multiplier;
      const steps = [
        `${number} × ${multiplier} işlemi parçalayarak yapılacak.`,
        `${ones} × ${multiplier} = ${onesPart} hesaplanır.`,
        `${tens} × ${multiplier} = ${wrongTensPart} hesaplanır ve onluk değeri dikkate alınmaz.`,
        `${onesPart} + ${wrongTensPart} = ${onesPart + wrongTensPart} sonucu yazılır.`
      ];
      return findRound(id, pathId, steps, 2, `${tens} aslında ${tens * 10}; doğru parça ${tens * 10 * multiplier}; sonuç ${number * multiplier}.`, random, {
        raw: 'İlk hatalı satırı bul.'
      });
    },
    result(id, pathId, random) {
      const number = randomInt(random, 21, 89);
      const m = randomInt(random, 3, 8);
      const correct = number * m;
      const wrong = (number % 10) * m + Math.floor(number / 10) * m;
      return resultRound(id, pathId, correct, wrong, `Doğru ${number}×${m}=${correct}.`, random, {
        raw: `${number}×${m} parçalanırken onluk değeri unutan öğrenci ${wrong} bulmuş. Doğru sonuç?`
      });
    },
    correct(id, pathId, random) {
      const correctLine = 'Onlar basamağı 10 ile çarpılarak (onluk değeriyle) işleme katılır.';
      return correctStepRound(id, pathId, correctLine, [
        'Onlar basamağı birler gibi toplanır.',
        'Onlar basamağı yok sayılır.',
        'Sonuç yalnız birler çarpımından oluşur.'
      ], 'Basamak değeri korunmalı.', random, {
        raw: '23×4 parçalı çarpımında onlar satırı hatalı. Doğru kural hangisidir?'
      });
    },
    compare(id, pathId, random) {
      const answer = 'Yalnız B hatalı (onluk değeri yok)';
      return compareRound(id, pathId, answer, [answer, 'Yalnız A hatalı', 'İkisi de doğru', 'İkisi de hatalı'], answer, 'B onluk değeri unutmuş.', random, {
        raw: 'A: "23×4=92". B: "23×4 → 3×4 + 2×4 = 20". Hangisi hatalı?'
      });
    }
  });
}

function familyDistribution() {
  return buildFamily('ed-distribution-incomplete', {
    find(id, pathId, random) {
      const k = randomInt(random, 2, 7);
      const add = randomInt(random, 2, 9);
      const x = randomInt(random, 2, 10);
      const steps = [
        `${k} × (${x} + ${add}) ifadesi açılacak.`,
        `${k} × ${x} = ${k * x} yazılır.`,
        `Toplama ${add} olduğu gibi bırakılır.`,
        `Sonuç ${k * x} + ${add} = ${k * x + add} bulunur.`
      ];
      return findRound(id, pathId, steps, 2, `Dağılma her iki terime uygulanır: ${k}×${x}+${k}×${add}=${k * (x + add)}.`, random, {
        raw: 'İlk hatalı satırı bul.'
      });
    },
    result(id, pathId, random) {
      const k = randomInt(random, 2, 7);
      const add = randomInt(random, 2, 9);
      const x = randomInt(random, 2, 10);
      const correct = k * (x + add);
      const wrong = k * x + add;
      return resultRound(id, pathId, correct, wrong, `Doğru ${k}(${x}+${add})=${correct}.`, random, {
        raw: `${k}(${x}+${add}) için dağılmayı yarım uygulayan öğrenci ${wrong} bulmuş. Doğru sonuç?`
      });
    },
    correct(id, pathId, random) {
      const k = 3;
      const add = 4;
      const correctLine = `${k} × ${add} = ${k * add} de ayrıca çarpılır.`;
      return correctStepRound(id, pathId, correctLine, [
        `${add} olduğu gibi eklenir.`,
        `${k} + ${add} = ${k + add} yazılır.`,
        `${add} çıkarılır.`
      ], 'Katsayı her terime dağılır.', random, {
        raw: `${k}(x+${add}) açılımında ikinci terim satırı hatalı. Doğru satır hangisidir?`
      });
    },
    compare(id, pathId, random) {
      const answer = 'Yalnız A hatalı (eksik dağılma)';
      return compareRound(id, pathId, answer, [answer, 'Yalnız B hatalı', 'İkisi de doğru', 'İkisi de hatalı'], answer, 'A ikinci terimi çarpmamış.', random, {
        raw: 'A: "3(5+2)=15+2=17". B: "3(5+2)=15+6=21". Hangisi hatalı?'
      });
    }
  });
}

function familyFractionAdd() {
  return buildFamily('ed-fraction-add-numerators-only', {
    find(id, pathId, random) {
      const d = pick([4, 5, 6, 8], random);
      const n1 = randomInt(random, 1, d - 2);
      const n2 = randomInt(random, 1, d - n1 - 1);
      const steps = [
        `${n1}/${d} + ${n2}/${d} toplamı isteniyor.`,
        `Paylar toplanır: ${n1}+${n2}=${n1 + n2}.`,
        `Paydalar da toplanır: ${d}+${d}=${2 * d}.`,
        `Sonuç ${n1 + n2}/${2 * d} yazılır.`
      ];
      return findRound(id, pathId, steps, 2, `Aynı paydada paydalar toplanmaz. Doğru: ${n1 + n2}/${d}.`, random, {
        raw: 'İlk hatalı satırı bul.'
      });
    },
    result(id, pathId, random) {
      const d = 5;
      const n1 = 2;
      const n2 = 1;
      // Soru doğru paydayı sorar; çeldiriciler doğru cevaptan ve birbirinden farklı olmalıdır.
      return resultRound(id, pathId, d, 2 * d, `Aynı paydalı toplamada payda ${d} kalır.`, random, {
        raw: `${n1}/${d}+${n2}/${d} için paydaları toplayan öğrenci payda ${2 * d} yazmış. Doğru payda kaçtır?`
      }, [d - 1, d + 1]);
    },
    correct(id, pathId, random) {
      const correctLine = 'Aynı paydada yalnız paylar toplanır; payda aynı kalır.';
      return correctStepRound(id, pathId, correctLine, [
        'Paydalar da toplanır.',
        'Paylar çarpılır.',
        'Paydalar çıkarılır.'
      ], 'Payda korunur.', random, {
        raw: '2/7+3/7 toplamında payda satırı hatalı. Doğru kural hangisidir?'
      });
    },
    compare(id, pathId, random) {
      const answer = 'Yalnız B hatalı (payda toplanmış)';
      return compareRound(id, pathId, answer, [answer, 'Yalnız A hatalı', 'İkisi de doğru', 'İkisi de hatalı'], answer, 'B paydaları toplamış.', random, {
        raw: 'A: "1/5+2/5=3/5". B: "1/5+2/5=3/10". Hangisi hatalı?'
      });
    }
  });
}

function familySign() {
  return buildFamily('ed-sign-flip-error', {
    find(id, pathId, random) {
      const a = randomInt(random, 8, 20);
      const b = randomInt(random, 3, 9);
      const steps = [
        `${a} − (${b}) ifadesi sadeleştirilecek.`,
        `Eksi ile artının çarpımı eksi verir sanılır.`,
        `${a} + ${b} = ${a + b} yazılır.`,
        `Sonuç ${a + b} bulunur.`
      ];
      return findRound(id, pathId, steps, 1, `${a}−(${b})=${a - b}. İşaret kuralı yanlış uygulanmış.`, random, {
        raw: 'İlk hatalı satırı bul.'
      });
    },
    result(id, pathId, random) {
      const a = randomInt(random, 10, 25);
      const b = randomInt(random, 3, 9);
      const correct = a - b;
      const wrong = a + b;
      return resultRound(id, pathId, correct, wrong, `Doğru ${a}−${b}=${correct}.`, random, {
        raw: `${a}−(${b}) için işaretleri karıştıran öğrenci ${wrong} bulmuş. Doğru sonuç?`
      });
    },
    correct(id, pathId, random) {
      const correctLine = 'a − (b) = a − b (işaret değişmez; parantezdeki artı korunur).';
      return correctStepRound(id, pathId, correctLine, [
        'a − (b) = a + b',
        'a − (b) = −a − b',
        'a − (b) = b − a'
      ], 'Artı terimin işareti korunur.', random, {
        raw: '12−(5) sadeleştirme satırı hatalı. Doğru kural hangisidir?'
      });
    },
    compare(id, pathId, random) {
      const answer = 'Yalnız A hatalı (işaret ters)';
      return compareRound(id, pathId, answer, [answer, 'Yalnız B hatalı', 'İkisi de doğru', 'İkisi de hatalı'], answer, 'A eksi yerine artı yapmış.', random, {
        raw: 'A: "15−(4)=19". B: "15−(4)=11". Hangisi hatalı?'
      });
    }
  });
}

function familyPercent() {
  return buildFamily('ed-percent-of-base-forget-divide', {
    find(id, pathId, random) {
      const base = randomInt(random, 4, 20) * 20;
      const percent = pick([10, 20, 25, 30], random);
      const steps = [
        `${base} sayısının %${percent}’i aranıyor.`,
        `${base} × ${percent} = ${base * percent} hesaplanır.`,
        `100’e bölme adımı atlanır.`,
        `Sonuç ${base * percent} yazılır.`
      ];
      return findRound(id, pathId, steps, 2, `Yüzde için ÷100 gerekir: ${base}×${percent}/100=${base * percent / 100}.`, random, {
        raw: 'İlk hatalı satırı bul.'
      });
    },
    result(id, pathId, random) {
      const base = randomInt(random, 4, 20) * 20;
      const percent = pick([10, 20, 25], random);
      const correct = base * percent / 100;
      const wrong = base * percent;
      return resultRound(id, pathId, correct, wrong, `Doğru ${correct}.`, random, {
        raw: `${base}’nin %${percent}’i için ÷100 unutan öğrenci ${wrong} bulmuş. Doğru sonuç?`
      });
    },
    correct(id, pathId, random) {
      const correctLine = 'Çarpımdan sonra 100’e bölünür (veya yüzde ondalığa çevrilir).';
      return correctStepRound(id, pathId, correctLine, [
        'Çarpım olduğu gibi bırakılır.',
        'Yalnız 10’a bölünür.',
        'Tabandan yüzde çıkarılır.'
      ], '÷100 zorunlu.', random, {
        raw: '% hesabında son adım hatalı. Doğru kural hangisidir?'
      });
    },
    compare(id, pathId, random) {
      const answer = 'Yalnız A hatalı (÷100 yok)';
      return compareRound(id, pathId, answer, [answer, 'Yalnız B hatalı', 'İkisi de doğru', 'İkisi de hatalı'], answer, 'A 100’e bölmemiş.', random, {
        raw: 'A: "%20 of 200 = 4000". B: "%20 of 200 = 40". Hangisi hatalı?'
      });
    }
  });
}

function familyEquation() {
  return buildFamily('ed-equation-unbalanced-move', {
    find(id, pathId, random) {
      const x = randomInt(random, 4, 15);
      const add = randomInt(random, 3, 12);
      const result = x + add;
      const steps = [
        `? + ${add} = ${result} denkleminde bilinmeyen aranıyor.`,
        `${add} aynı tarafta bırakılır.`,
        `? = ${result} + ${add} yazılır.`,
        `Sonuç ${result + add} bulunur.`
      ];
      return findRound(id, pathId, steps, 1, `Denklik için ${add} karşı tarafa geçince işaret değişir: ?= ${result}-${add}=${x}.`, random, {
        raw: 'İlk hatalı satırı bul.'
      });
    },
    result(id, pathId, random) {
      const x = randomInt(random, 4, 15);
      const add = randomInt(random, 3, 12);
      const result = x + add;
      const wrong = result + add;
      return resultRound(id, pathId, x, wrong, `Doğru bilinmeyen ${x}.`, random, {
        raw: `Bir sayıya ${add} eklenince ${result} oluyor. Öğrenci ${wrong} bulmuş. Doğru sayı?`
      });
    },
    correct(id, pathId, random) {
      const correctLine = 'Toplanan terim karşı tarafa geçerken çıkarılır.';
      return correctStepRound(id, pathId, correctLine, [
        'Toplanan terim karşı tarafa geçerken tekrar eklenir.',
        'İki taraf çarpılır.',
        'Sonuç olduğu gibi bilinmeyendir.'
      ], 'İşlem tersine çevrilir.', random, {
        raw: '? + 7 = 20 denkleminde taşıma satırı hatalı. Doğru kural hangisidir?'
      });
    },
    compare(id, pathId, random) {
      const answer = 'Yalnız A hatalı (işaret değişmedi)';
      return compareRound(id, pathId, answer, [answer, 'Yalnız B hatalı', 'İkisi de doğru', 'İkisi de hatalı'], answer, 'A eklemeyi korumuş.', random, {
        raw: 'A: "?+5=12 → ?=17". B: "?+5=12 → ?=7". Hangisi hatalı?'
      });
    }
  });
}

function familyRatio() {
  return buildFamily('ed-ratio-wrong-part', {
    find(id, pathId, random) {
      const a = randomInt(random, 2, 5);
      const b = randomInt(random, 3, 7);
      const factor = randomInt(random, 4, 10);
      const total = (a + b) * factor;
      const steps = [
        `Oran ${a}:${b}, toplam ${total}; ikinci pay aranıyor.`,
        `Toplam doğrudan ${b} ile çarpılır: ${total}×${b}=${total * b}.`,
        `Sonuç ${total * b} yazılır.`,
        'İşlem tamamlanır.'
      ];
      return findRound(id, pathId, steps, 1, `Bir pay ${total}/(${a}+${b})=${factor}; ikinci pay ${b}×${factor}=${b * factor}.`, random, {
        raw: 'İlk hatalı satırı bul.'
      });
    },
    result(id, pathId, random) {
      const a = 2;
      const b = 3;
      const factor = randomInt(random, 4, 10);
      const total = (a + b) * factor;
      const correct = b * factor;
      const wrong = total * b;
      return resultRound(id, pathId, correct, wrong, `Doğru mavi/ikinci pay ${correct}.`, random, {
        raw: `Oran ${a}:${b}, toplam ${total}. Öğrenci ikinci payı ${wrong} bulmuş. Doğrusu?`
      }, [factor, a * factor]);
    },
    correct(id, pathId, random) {
      const correctLine = 'Önce toplam oran payına bölünür, sonra istenen oranla çarpılır.';
      return correctStepRound(id, pathId, correctLine, [
        'Toplam istenen oranla doğrudan çarpılır.',
        'Oranlar toplanmadan kullanılır.',
        'Yalnız ilk pay alınır.'
      ], 'Birim pay gerekli.', random, {
        raw: '3:5 oranında pay hesaplama satırı hatalı. Doğru kural hangisidir?'
      });
    },
    compare(id, pathId, random) {
      const answer = 'Yalnız A hatalı (doğrudan çarpma)';
      return compareRound(id, pathId, answer, [answer, 'Yalnız B hatalı', 'İkisi de doğru', 'İkisi de hatalı'], answer, 'A birim payı bulmadan çarpmış.', random, {
        raw: 'A: "2:3 toplam 20 → ikinci=20×3". B: "2:3 toplam 20 → birim=4, ikinci=12". Hangisi hatalı?'
      });
    }
  });
}

function familyAverage() {
  return buildFamily('ed-average-skip-divide', {
    find(id, pathId, random) {
      const a = randomInt(random, 50, 90);
      const b = randomInt(random, 50, 90);
      let c = randomInt(random, 50, 90);
      c += (3 - ((a + b + c) % 3)) % 3;
      const sum = a + b + c;
      const steps = [
        `${a}, ${b}, ${c} notlarının ortalaması aranıyor.`,
        `Toplam ${sum} bulunur.`,
        `3’e bölme atlanır.`,
        `Ortalama ${sum} yazılır.`
      ];
      return findRound(id, pathId, steps, 2, `Ortalama ${sum}/3=${sum / 3}.`, random, {
        raw: 'İlk hatalı satırı bul.'
      });
    },
    result(id, pathId, random) {
      const a = 60;
      const b = 70;
      const c = 80;
      const correct = (a + b + c) / 3;
      const wrong = a + b + c;
      return resultRound(id, pathId, correct, wrong, `Doğru ortalama ${correct}.`, random, {
        raw: `${a},${b},${c} için ÷3 unutan öğrenci ${wrong} bulmuş. Doğru ortalama?`
      });
    },
    correct(id, pathId, random) {
      const correctLine = 'Toplam, veri sayısına (3) bölünür.';
      return correctStepRound(id, pathId, correctLine, [
        'Toplam olduğu gibi ortalamadır.',
        'Toplam 2’ye bölünür.',
        'En büyük not ortalamadır.'
      ], '÷n zorunlu.', random, {
        raw: 'Ortalama hesabında son adım hatalı. Doğru kural hangisidir?'
      });
    },
    compare(id, pathId, random) {
      const answer = 'Yalnız A hatalı (÷3 yok)';
      return compareRound(id, pathId, answer, [answer, 'Yalnız B hatalı', 'İkisi de doğru', 'İkisi de hatalı'], answer, 'A toplamı ortalama sanmış.', random, {
        raw: 'A: "60+70+80 ortalama=210". B: "60+70+80 ortalama=70". Hangisi hatalı?'
      });
    }
  });
}

export const ERROR_DETECTIVE_FAMILIES = [
  familyCarry(),
  familyBorrow(),
  familyPriority(),
  familyPerimeterArea(),
  familyPlaceValueMul(),
  familyDistribution(),
  familyFractionAdd(),
  familySign(),
  familyPercent(),
  familyEquation(),
  familyRatio(),
  familyAverage(),
  ...buildErrorDetectiveNewFamiliesV2()
];
export { ERROR_DETECTIVE_NEW_FAMILY_COUNT };
