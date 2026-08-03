/**
 * Error Detective — Capacity Policy V2 yeni hata-ailesi genişletmesi.
 */

function randomInt(random, min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}
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

const PATH_IDS = [
  'raw-steps', 'context-embedded', 'staged-strategy-hint',
  'counterexample-first', 'constraint-ordering'
];
const STEM_FRAMES = [
  'İlk hatalı adım hangisi?', 'Doğru sonuç hangisidir?',
  'Düzeltme sonrası doğru satır?', 'Hatalı zinciri seç:',
  'Yanılgı tuzağına düşmeden seç:', 'Eleme sonrası kalan doğru?',
  'Koşulları sağlayan tek seçenek?', 'Kontrol ettikten sonra kalan doğru?',
  'Yüzey tuzağı olmayan seçenek?', 'Hedef soruya en uygun yanıt?'
];

function pathWrap(pathId, raw) {
  if (pathId === 'raw-steps') return { prompt: raw, context: 'Adımları sırayla incele.' };
  if (pathId === 'context-embedded') return { prompt: `Öğrenci çözümü: ${raw}`, context: 'Matematik adımlarına odaklan.' };
  if (pathId === 'counterexample-first') return { prompt: `Önce yanlış adımı ele: ${raw}`, context: 'Eleme yolu.' };
  if (pathId === 'constraint-ordering') return { prompt: `Adımları sırayla doğrula: ${raw}`, context: 'İlk bozulan çıkarım.' };
  return { prompt: `Önce her adımı kontrol et. ${raw}`, context: 'Strateji spoiler değildir.' };
}

function wrapKey(skeletonId, pathId, raw) {
  let h = 0;
  for (let i = 0; i < String(raw).length; i += 1) h = ((h << 5) - h + String(raw).charCodeAt(i)) | 0;
  return `error-detective:${skeletonId}:${pathId}:${Math.abs(h).toString(36)}`;
}

function choiceRound(skeletonId, pathId, answer, distractors, random, raw, explanation) {
  const frame = pick(STEM_FRAMES, random);
  const { prompt, context } = pathWrap(pathId, `${raw} ${frame}`);
  const answerText = String(answer);
  const unique = [...new Set([answerText, ...distractors.map(String)])];
  const numericAnswer = Number(answerText);
  let offset = 2;
  while (unique.length < 4) {
    const candidate = Number.isFinite(numericAnswer)
      ? String(numericAnswer + offset)
      : `Alternatif ${offset}`;
    if (!unique.includes(candidate)) unique.push(candidate);
    offset += 1;
  }
  const options = shuffle(unique.slice(0, 4), random);
  const nonce = Math.floor(random() * 1e9).toString(36);
  return {
    kind: 'choice',
    prompt,
    context,
    options,
    answerIndex: options.indexOf(String(answer)),
    explanation,
    questionKey: wrapKey(skeletonId, pathId, `${raw}|${answer}|${nonce}`),
    difficultyEvidence: 'error-chain-two-step',
    independentSolver: true,
    ageAppropriateLanguage: true
  };
}

const TASK = {
  find: ['errorAnalysis', 'multiStepInference'],
  result: ['errorAnalysis', 'usingIntermediateResultInNewDecision'],
  correct: ['errorAnalysis', 'conditionEvaluation'],
  compare: ['errorAnalysis', 'strategySelection']
};

function buildFamily(familyId, make) {
  const ids = {
    find: `${familyId}:find-first-error-step`,
    result: `${familyId}:identify-wrong-result`,
    correct: `${familyId}:propose-corrected-step`,
    compare: `${familyId}:compare-two-chains`
  };
  return {
    familyId,
    skeletons: [
      { skeletonId: ids.find, reasoningPathIds: PATH_IDS, cognitiveTraits: TASK.find, generate: (r, p) => make.find(ids.find, p, r) },
      { skeletonId: ids.result, reasoningPathIds: PATH_IDS, cognitiveTraits: TASK.result, generate: (r, p) => make.result(ids.result, p, r) },
      { skeletonId: ids.correct, reasoningPathIds: PATH_IDS, cognitiveTraits: TASK.correct, generate: (r, p) => make.correct(ids.correct, p, r) },
      { skeletonId: ids.compare, reasoningPathIds: PATH_IDS, cognitiveTraits: TASK.compare, generate: (r, p) => make.compare(ids.compare, p, r) }
    ]
  };
}

function numericFamily(familyId, buildSteps) {
  return buildFamily(familyId, {
    find(id, pathId, random) {
      const { steps, wrongIndex, explanation, raw } = buildSteps(random);
      const options = steps.map((s, i) => `${i + 1}. ${s}`);
      const frame = pick(STEM_FRAMES, random);
      const { prompt, context } = pathWrap(pathId, `${raw} ${frame}`);
      const nonce = Math.floor(random() * 1e9).toString(36);
      return {
        kind: 'choice', prompt, context, steps, options, answerIndex: wrongIndex, explanation,
        questionKey: wrapKey(id, pathId, `${steps.join('|')}|${nonce}`),
        difficultyEvidence: 'find-first-error', independentSolver: true, ageAppropriateLanguage: true
      };
    },
    result(id, pathId, random) {
      const { correct, wrong, raw, explanation } = buildSteps(random);
      return choiceRound(id, pathId, String(correct), [String(wrong), String(correct + 1), String(Math.max(0, correct - 2))], random, raw, explanation);
    },
    correct(id, pathId, random) {
      const { correctStep, wrongStep, raw, explanation } = buildSteps(random);
      return choiceRound(id, pathId, correctStep, [wrongStep, 'Atla', 'Tahmin et'], random, raw, explanation);
    },
    compare(id, pathId, random) {
      const { raw, explanation } = buildSteps(random);
      return choiceRound(id, pathId, 'A doğru B hatalı', ['B doğru A hatalı', 'İkisi doğru', 'İkisi hatalı'], random, raw, explanation);
    }
  });
}

export function buildErrorDetectiveNewFamiliesV2() {
  return [
    numericFamily('err-sign-flip', (random) => {
      const a = randomInt(random, 8, 20);
      const b = randomInt(random, 3, 9);
      const correct = a - b;
      const wrong = a + b;
      return {
        steps: [`${a} - ${b} yazıldı`, `= ${wrong} hesaplandı`, 'sonuç kutuya yazıldı', 'kontrol edilmedi'],
        wrongIndex: 1,
        correct,
        wrong,
        correctStep: `= ${correct}`,
        wrongStep: `= ${wrong}`,
        raw: `${a}-${b} çözümünde hata var.`,
        explanation: 'Çıkarma yerine toplama yapılmış.'
      };
    }),
    numericFamily('err-zero-identity', (random) => {
      const a = randomInt(random, 4, 12);
      const correct = a;
      const wrong = 0;
      return {
        steps: [`${a} × 1 yazıldı`, `= ${wrong} denildi`, 'sonuç aktarıldı', 'işlem bitti'],
        wrongIndex: 1,
        correct,
        wrong,
        correctStep: `= ${a}`,
        wrongStep: '= 0',
        raw: `${a}×1 çözümünde hata.`,
        explanation: '×1 etkisiz eleman; sonuç aynı kalmalı.'
      };
    }),
    numericFamily('err-fraction-add', (random) => {
      const a = randomInt(random, 1, 4);
      const correct = a;
      const wrong = a * 2;
      return {
        steps: [`${a}/2 + ${a}/2 yazıldı`, `paylar ${wrong} yapıldı`, 'sonuç yazıldı', 'kontrol yok'],
        wrongIndex: 1,
        correct,
        wrong,
        correctStep: `= ${a}`,
        wrongStep: `= ${wrong}`,
        raw: `${a}/2 + ${a}/2 hatalı toplanmış.`,
        explanation: 'Aynı payda: paylar toplanır → bir bütün.'
      };
    }),
    numericFamily('err-perimeter-area', (random) => {
      const s = randomInt(random, 3, 8);
      const correct = 4 * s;
      const wrong = s * s;
      return {
        steps: [`kare kenar ${s}`, `çevre=${wrong} yazıldı`, 'birim cm dendi', 'sonuç onaylandı'],
        wrongIndex: 1,
        correct,
        wrong,
        correctStep: `çevre=${correct}`,
        wrongStep: `çevre=${wrong}`,
        raw: `Kenar ${s} karede çevre/alan karışmış.`,
        explanation: 'Çevre=4×kenar; alan=kenar².'
      };
    }),
    numericFamily('err-percent-of', (random) => {
      const base = pick([40, 60, 80], random);
      const correct = base / 4;
      const wrong = base / 2;
      return {
        steps: [`${base}'nin %25'i`, `= ${wrong} bulundu`, 'sonuç yazıldı', 'kontrol atlandı'],
        wrongIndex: 1,
        correct,
        wrong,
        correctStep: `= ${correct}`,
        wrongStep: `= ${wrong}`,
        raw: `${base} sayısının %25'i hatalı.`,
        explanation: '%25 = 1/4.'
      };
    }),
    numericFamily('err-order-ops', (random) => {
      const a = randomInt(random, 2, 5);
      const correct = a + 2 * 3;
      const wrong = (a + 2) * 3;
      return {
        steps: [`${a}+2×3 yazıldı`, `soldan (${a}+2) yapıldı`, `= ${wrong} bulundu`, 'sonuç onaylandı'],
        wrongIndex: 1,
        correct,
        wrong,
        correctStep: `= ${correct}`,
        wrongStep: `= ${wrong}`,
        raw: `${a}+2×3 işlem önceliği hatalı.`,
        explanation: 'Önce çarpma.'
      };
    })
  ];
}

export const ERROR_DETECTIVE_NEW_FAMILY_COUNT = 6;
export default buildErrorDetectiveNewFamiliesV2;
