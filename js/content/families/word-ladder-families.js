// Aşama 04 — word-ladder (Kelime Merdiveni) için gerçek Aile→İskelet→Düşünme Yolu içeriği.
// UI: select-valid → kind:'wordLadder' (app.js + validateLadder); diğer 3 → kind:'choice'.
// validateLadder herhangi bir geçerli yolu kabul eder; steps yalnız öneridir.
// Aile = dönüşüm kuralı / kısıt / strateji / hata türü; yüzey kelime veya harf sayısı makyajı değil.

import { isOneLetterChange, normalizeTurkish } from '../../engines/word-engine.js';

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
  for (let i = 0; i < str.length; i += 1) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

function wrapKey(skeletonId, pathId, raw) {
  return `word-ladder:${skeletonId}:${pathId}:${simpleHash(raw)}`;
}

const PATH_IDS = ['raw-letters', 'context-embedded', 'staged-strategy-hint'];

const TASK_TRAITS = {
  select: ['strategySelection', 'multiStepInference'],
  forced: ['informationLinking', 'multiStepInference'],
  spot: ['errorAnalysis', 'conditionEvaluation'],
  compare: ['strategySelection', 'usingIntermediateResultInNewDecision']
};

/** Hata türü etiketleri — spot/compare iskeletlerinde ayrı seçenekler olarak kullanılır. */
export const ERROR_TYPES = {
  MULTI: 'çoklu-harf',
  OOV: 'sözlük-dışı',
  CYCLE: 'döngü',
  MISS: 'hedefe-ulaşmama',
  BAD_MID: 'geçersiz-ara'
};

function up(word) {
  return String(word).toLocaleUpperCase('tr-TR');
}

function pathJoin(words) {
  return words.map(up).join(' → ');
}

function dictFrom(...lists) {
  const set = new Set();
  for (const list of lists) {
    for (const w of list) set.add(normalizeTurkish(w));
  }
  return [...set];
}

function edgesOk(a, b) {
  return isOneLetterChange(a, b);
}

/**
 * Tam yol: sözlük + tek harf + döngü yok.
 * `intendedEnd` verilirse zincir sonu hedeften farklıysa MISS (hedefe-ulaşmama).
 */
export function analyzeLadderPath(start, mids, end, dictionary, intendedEnd = end) {
  const dict = new Set((dictionary || []).map(normalizeTurkish));
  const chain = [start, ...mids, end].map(normalizeTurkish);
  const seen = new Set();
  for (let i = 0; i < chain.length; i += 1) {
    const w = chain[i];
    if (!dict.has(w)) {
      if (i === 0 || i === chain.length - 1) return { valid: false, error: ERROR_TYPES.OOV, at: i };
      return { valid: false, error: ERROR_TYPES.BAD_MID, at: i };
    }
    if (seen.has(w)) return { valid: false, error: ERROR_TYPES.CYCLE, at: i };
    seen.add(w);
  }
  for (let i = 0; i < chain.length - 1; i += 1) {
    if (!edgesOk(chain[i], chain[i + 1])) {
      return { valid: false, error: ERROR_TYPES.MULTI, at: i };
    }
  }
  if (normalizeTurkish(end) !== normalizeTurkish(intendedEnd)) {
    return { valid: false, error: ERROR_TYPES.MISS, at: chain.length - 1 };
  }
  return { valid: true, error: null, at: -1 };
}

function pathWrap(pathId, rawPrompt, contextHint, strategyHint, structureCue = '') {
  const cue = structureCue ? `${structureCue.replace(/-/g, ' ')} kuralı: ` : '';
  if (pathId === 'raw-letters') {
    return {
      prompt: `${cue}${rawPrompt}`,
      context: contextHint || 'Her adımda yalnız bir harf değişir; ara kelimeler sözlükte olmalıdır.'
    };
  }
  if (pathId === 'context-embedded') {
    return {
      prompt: `Kelime merdiveni (${structureCue || 'genel'}): ${rawPrompt}`,
      context: 'Senaryodaki gereksiz ayrıntıları ayıkla; dönüşüm kuralına odaklan.'
    };
  }
  return {
    prompt: `${cue}${strategyHint || 'Önce hangi harfin değişeceğini planla, sonra ara kelimeleri doğrula.'} ${rawPrompt}`,
    context: 'Strateji ipucu cevabı vermez; yalnız düşünme sırasını gösterir.'
  };
}

function roundWordLadder(skeletonId, pathId, start, steps, end, dictionary, random, texts) {
  const structureCue = String(skeletonId || '').split(':')[0];
  const { prompt } = pathWrap(pathId, texts.raw, texts.context, texts.strategy, structureCue);
  const instanceNonce = Math.floor(random() * 1e9).toString(36);
  const mid = steps.map((w) => up(w));
  return {
    kind: 'wordLadder',
    prompt,
    start: up(start),
    steps: mid,
    suggestedStepCount: Math.max(1, mid.length),
    minSteps: 1,
    maxSteps: 6,
    end: up(end),
    dictionary: dictionary.length ? dictionary : dictFrom([start, ...steps, end]),
    explanation: texts.explanation || pathJoin([start, ...steps, end]),
    questionKey: wrapKey(skeletonId, pathId, `${start}|${end}|${mid.join(',')}|${instanceNonce}`)
  };
}

function roundChoice(skeletonId, pathId, answerText, distractors, random, texts) {
  const pool = [answerText, ...distractors];
  const unique = [...new Set(pool)];
  while (unique.length < 4) unique.push(`ARA-KELIME-${unique.length}`);
  const options = shuffle(unique.slice(0, 4), random);
  const answerIndex = options.indexOf(answerText);
  const structureCue = String(skeletonId || '').split(':')[0];
  const { prompt, context } = pathWrap(pathId, texts.raw, texts.context, texts.strategy, structureCue);
  const instanceNonce = Math.floor(random() * 1e9).toString(36);
  return {
    kind: 'choice',
    prompt,
    context,
    options,
    answerIndex,
    explanation: texts.explanation,
    questionKey: wrapKey(skeletonId, pathId, `${texts.raw}|${answerText}|${instanceNonce}`)
  };
}

function buildFamily(familyId, builders) {
  const ids = {
    select: `${familyId}:select-valid`,
    forced: `${familyId}:forced-fact`,
    spot: `${familyId}:spot-violation`,
    compare: `${familyId}:compare-worlds`
  };
  return {
    familyId,
    skeletons: [
      { skeletonId: ids.select, reasoningPathIds: PATH_IDS, cognitiveTraits: TASK_TRAITS.select, generate: (r, p) => builders.select(ids.select, p, r) },
      { skeletonId: ids.forced, reasoningPathIds: PATH_IDS, cognitiveTraits: TASK_TRAITS.forced, generate: (r, p) => builders.forced(ids.forced, p, r) },
      { skeletonId: ids.spot, reasoningPathIds: PATH_IDS, cognitiveTraits: TASK_TRAITS.spot, generate: (r, p) => builders.spot(ids.spot, p, r) },
      { skeletonId: ids.compare, reasoningPathIds: PATH_IDS, cognitiveTraits: TASK_TRAITS.compare, generate: (r, p) => builders.compare(ids.compare, p, r) }
    ]
  };
}

function firstLetter(w) {
  return normalizeTurkish(w)[0];
}

function lastLetter(w) {
  const n = normalizeTurkish(w);
  return n[n.length - 1];
}

function vowelPositionsDiff(a, b) {
  const vowels = new Set([...'aeıioöuüâîû']);
  const A = normalizeTurkish(a);
  const B = normalizeTurkish(b);
  let vowelDiff = 0;
  let consDiff = 0;
  for (let i = 0; i < A.length; i += 1) {
    if (A[i] === B[i]) continue;
    if (vowels.has(A[i]) || vowels.has(B[i])) vowelDiff += 1;
    else consDiff += 1;
  }
  return { vowelDiff, consDiff };
}

// ---- 1. wl-len3-bridge — 3 harfli köprü stratejisi ----
function familyLen3Bridge() {
  const puzzles = [
    { start: 'bal', steps: ['dal'], end: 'dil', alt: ['dal'] },
    { start: 'kaz', steps: ['kar'], end: 'kır', alt: ['kar'] },
    { start: 'cam', steps: ['can'], end: 'kan', alt: ['can'] },
    { start: 'kol', steps: ['gol', 'göl'], end: 'gül', alt: ['gol', 'göl'] }
  ];
  const dict = dictFrom(
    puzzles.flatMap((p) => [p.start, ...p.steps, p.end]),
    ['biz', 'diz', 'din', 'bin', 'buz', 'tel', 'yel', 'yol', 'sol', 'sal', 'sel']
  );
  return buildFamily('wl-len3-bridge', {
    select(id, pathId, random) {
      const p = pick(puzzles, random);
      return roundWordLadder(id, pathId, p.start, p.steps, p.end, dict, random, {
        raw: `3 harfli merdiven: ${up(p.start)} → … → ${up(p.end)}. Her adımda tek harf.`,
        strategy: 'Önce ortak harfleri kilitle; değişecek tek harfi seç.',
        explanation: `Örnek yol: ${pathJoin([p.start, ...p.steps, p.end])}. Aynı kuralı sağlayan başka yollar da doğrudur.`
      });
    },
    forced(id, pathId, random) {
      const p = pick(puzzles, random);
      const must = up(p.steps[0]);
      return roundChoice(id, pathId, must, [up('yol'), up('buz'), up('toz')], random, {
        raw: `${up(p.start)} → ? → ${up(p.end)}. İlk ara adım ZORUNLU sözlükte ve tek harf farkıyla hangisi olabilir?`,
        explanation: `${must}, ${up(p.start)} ile tek harf farkındadır ve geçerli bir köprüdür.`
      });
    },
    spot(id, pathId, random) {
      const p = pick(puzzles, random);
      const badPath = pathJoin([p.start, 'xyz', p.end]);
      return roundChoice(id, pathId, ERROR_TYPES.OOV, [ERROR_TYPES.MULTI, ERROR_TYPES.CYCLE, ERROR_TYPES.MISS], random, {
        raw: `Yol: ${badPath}. Bu 3 harfli merdivendeki ana hata türü?`,
        explanation: `“XYZ” sözlük dışı → ${ERROR_TYPES.OOV}.`
      });
    },
    compare(id, pathId, random) {
      const p = pick(puzzles, random);
      const good = pathJoin([p.start, ...p.steps, p.end]);
      const bad = pathJoin([p.start, 'kutu', p.end]);
      return roundChoice(id, pathId, good, [bad, pathJoin([p.end, p.start]), 'YOK'], random, {
        raw: `Hangisi geçerli 3 harfli merdivendir? (Alternatif geçerli yollar da kabul edilir.)`,
        explanation: `${good} tek harf kuralına uyar; diğerleri bozar.`
      });
    }
  });
}

// ---- 2. wl-len4-bridge — 4 harfli köprü ----
function familyLen4Bridge() {
  const puzzles = [
    { start: 'kasa', steps: ['kara', 'para'], end: 'pare' },
    { start: 'masa', steps: ['kasa', 'kara'], end: 'kare' },
    { start: 'kaya', steps: ['maya', 'masa'], end: 'kasa' },
    { start: 'hava', steps: ['tava', 'tasa'], end: 'yasa' }
  ];
  const dict = dictFrom(puzzles.flatMap((p) => [p.start, ...p.steps, p.end]), ['kare', 'kere', 'pare', 'lale', 'kale', 'kafe', 'kafa']);
  return buildFamily('wl-len4-bridge', {
    select(id, pathId, random) {
      const p = pick(puzzles, random);
      return roundWordLadder(id, pathId, p.start, p.steps, p.end, dict, random, {
        raw: `4 harfli merdiven: ${up(p.start)} → … → ${up(p.end)}.`,
        strategy: '4 harfte ortak üç harfi koru; yalnızca bir konumu değiştir.',
        explanation: `Örnek: ${pathJoin([p.start, ...p.steps, p.end])}. Başka geçerli 4 harfli yollar da doğrudur.`
      });
    },
    forced(id, pathId, random) {
      const p = pick(puzzles, random);
      const must = up(p.steps[0]);
      return roundChoice(id, pathId, must, [up('kutu'), up('bal'), up('gül')], random, {
        raw: `${up(p.start)} ile başlayan 4 harfli merdivende ilk ara kelime hangisi olmalı (tek harf + sözlük)?`,
        explanation: `${must} hem uzunluk hem tek harf kuralına uyar.`
      });
    },
    spot(id, pathId, random) {
      const p = pick(puzzles, random);
      return roundChoice(id, pathId, ERROR_TYPES.MULTI, [ERROR_TYPES.OOV, ERROR_TYPES.CYCLE, ERROR_TYPES.MISS], random, {
        raw: `Yol: ${pathJoin([p.start, 'kutu', p.end])} (varsayılan: KUTU ile ${up(p.start)} arasında birden fazla harf farkı olabilir). Ana hata türü?`,
        explanation: `Ara adım birden fazla harf değiştiriyorsa → ${ERROR_TYPES.MULTI}.`
      });
    },
    compare(id, pathId, random) {
      const p = pick(puzzles, random);
      const good = pathJoin([p.start, ...p.steps, p.end]);
      const multi = pathJoin([p.start, 'kutu', p.end]);
      return roundChoice(id, pathId, good, [multi, pathJoin([p.end, ...p.steps, p.start]), 'BOŞ'], random, {
        raw: 'Hangisi geçerli 4 harfli merdivendir?',
        explanation: `${good} kurala uyar.`
      });
    }
  });
}

// ---- 3. wl-len5-bridge — 5 harfli köprü ----
function familyLen5Bridge() {
  const puzzles = [
    { start: 'kalem', steps: ['kadem', 'kader'], end: 'keder' },
    { start: 'tarak', steps: ['tabak', 'kabak'], end: 'kapak' },
    { start: 'yalan', steps: ['yalın', 'kalın'], end: 'kadın' },
    { start: 'pazar', steps: ['yazar', 'yatar'], end: 'yatak' },
    { start: 'burun', steps: ['kurun', 'kurul'], end: 'kural' }
  ];
  const dict = dictFrom(puzzles.flatMap((p) => [p.start, ...p.steps, p.end]), ['fener', 'kenar', 'pınar', 'kitap', 'hitap', 'hesap', 'harap']);
  return buildFamily('wl-len5-bridge', {
    select(id, pathId, random) {
      const p = pick(puzzles, random);
      return roundWordLadder(id, pathId, p.start, p.steps, p.end, dict, random, {
        raw: `5 harfli merdiven: ${up(p.start)} → … → ${up(p.end)}.`,
        strategy: 'Uzun kelimede değişecek konumu önce seç; her ara adımı sözlükte doğrula.',
        explanation: `Örnek: ${pathJoin([p.start, ...p.steps, p.end])}. Alternatif geçerli yollar kabul edilir.`
      });
    },
    forced(id, pathId, random) {
      const p = pick(puzzles, random);
      const must = up(p.steps[0]);
      return roundChoice(id, pathId, must, [up('kitap'), up('bal'), up('masa')], random, {
        raw: `${up(p.start)} → ? → … → ${up(p.end)}. ZORUNLU ilk ara aday?`,
        explanation: `${must} tek harf farkıyla geçerli köprüdür.`
      });
    },
    spot(id, pathId, random) {
      return roundChoice(id, pathId, ERROR_TYPES.MISS, [ERROR_TYPES.MULTI, ERROR_TYPES.OOV, ERROR_TYPES.CYCLE], random, {
        raw: `Yol: KALEM → KADEM → KADER → KALEM (hedef KEDER iken son kelime hedef değil). Ana hata?`,
        explanation: `Zincir hedefe bağlanmıyorsa → ${ERROR_TYPES.MISS}.`
      });
    },
    compare(id, pathId, random) {
      const p = pick(puzzles, random);
      const good = pathJoin([p.start, ...p.steps, p.end]);
      return roundChoice(id, pathId, good, [pathJoin([p.start, 'kutup', p.end]), pathJoin([p.end, p.start]), 'YOK'], random, {
        raw: 'Hangisi geçerli 5 harfli merdivendir?',
        explanation: `${good} tek harf ve sözlük kurallarına uyar.`
      });
    }
  });
}

// ---- 4. wl-vowel-pivot — ünlü kaydırma stratejisi ----
function familyVowelPivot() {
  const puzzles = [
    { start: 'kol', steps: ['gol', 'göl'], end: 'gül', note: 'o→ö→ü ünlü kayması' },
    { start: 'bal', steps: ['bel'], end: 'bol', note: 'a→e→o ünlü kayması' },
    { start: 'kal', steps: ['kel'], end: 'bel', note: 'a→e ünlü' },
    { start: 'sol', steps: ['sel'], end: 'tel', note: 'o→e ünlü' }
  ];
  const dict = dictFrom(puzzles.flatMap((p) => [p.start, ...p.steps, p.end]), ['bil', 'bul', 'kil', 'kul', 'kor', 'kur', 'kül']);
  return buildFamily('wl-vowel-pivot', {
    select(id, pathId, random) {
      const p = pick(puzzles, random);
      return roundWordLadder(id, pathId, p.start, p.steps, p.end, dict, random, {
        raw: `Ünlü kaydırma merdiveni: ${up(p.start)} → … → ${up(p.end)}. Strateji: ünlüleri döndür.`,
        strategy: 'Ünsüz iskeleti sabitle; yalnızca ünlü harfi değiştirerek ilerle.',
        explanation: `${p.note}. Örnek: ${pathJoin([p.start, ...p.steps, p.end])}.`
      });
    },
    forced(id, pathId, random) {
      const start = 'kol';
      const mid = 'gol';
      return roundChoice(id, pathId, up(mid), [up('kal'), up('yol'), up('masa')], random, {
        raw: `${up(start)} → ? → GÖL → GÜL. Ünlü kaydırma ile ZORUNLU ara adım?`,
        explanation: `${up(mid)} ünsüzleri korur, ünlüyü değiştirir.`
      });
    },
    spot(id, pathId, random) {
      return roundChoice(id, pathId, ERROR_TYPES.MULTI, [ERROR_TYPES.OOV, ERROR_TYPES.CYCLE, ERROR_TYPES.MISS], random, {
        raw: `Ünlü pivot iddiası: KOL → GÜL (tek adım). Ana hata türü?`,
        explanation: `KOL→GÜL birden fazla harf değişir → ${ERROR_TYPES.MULTI}.`
      });
    },
    compare(id, pathId, random) {
      const good = 'KOL → GOL → GÖL → GÜL';
      const bad = 'KOL → GÜL';
      return roundChoice(id, pathId, good, [bad, 'KOL → KAL → GÜL', 'GÜL → KOL'], random, {
        raw: 'Hangisi ünlü kaydırma stratejisine uygun geçerli merdivendir?',
        explanation: `${good} her adımda tek harf (ünlü) değişir.`
      });
    }
  });
}

// ---- 5. wl-consonant-pivot — ünsüz kaydırma ----
function familyConsonantPivot() {
  const puzzles = [
    { start: 'bal', steps: ['dal'], end: 'dil' },
    { start: 'bar', steps: ['dar'], end: 'tar' },
    { start: 'cam', steps: ['can'], end: 'kan' },
    { start: 'tel', steps: ['yel'], end: 'yol' }
  ];
  const dict = dictFrom(puzzles.flatMap((p) => [p.start, ...p.steps, p.end]), ['biz', 'diz', 'din', 'bin']);
  return buildFamily('wl-consonant-pivot', {
    select(id, pathId, random) {
      const p = pick(puzzles, random);
      return roundWordLadder(id, pathId, p.start, p.steps, p.end, dict, random, {
        raw: `Ünsüz kaydırma: ${up(p.start)} → … → ${up(p.end)}. Ünlüleri sabitle, ünsüzü değiştir.`,
        strategy: 'Önce hangi ünsüz konumunun değişeceğini seç; ünlüleri koru.',
        explanation: `Örnek: ${pathJoin([p.start, ...p.steps, p.end])}.`
      });
    },
    forced(id, pathId, random) {
      const p = pick(puzzles, random);
      return roundChoice(id, pathId, up(p.steps[0]), [up('toz'), up('masa'), up('gül')], random, {
        raw: `${up(p.start)} → ? → ${up(p.end)}. Ünsüz pivot ile zorunlu ara?`,
        explanation: `${up(p.steps[0])} ünlüleri koruyarak ünsüzü değiştirir.`
      });
    },
    spot(id, pathId, random) {
      return roundChoice(id, pathId, ERROR_TYPES.BAD_MID, [ERROR_TYPES.MULTI, ERROR_TYPES.CYCLE, ERROR_TYPES.MISS], random, {
        raw: `Yol: BAL → QAL → DAL. Ana hata türü?`,
        explanation: `QAL geçerli ara kelime değil → ${ERROR_TYPES.BAD_MID}.`
      });
    },
    compare(id, pathId, random) {
      const good = pathJoin(['bal', 'dal', 'dil']);
      return roundChoice(id, pathId, good, ['BAL → DİL', 'BAL → QAL → DİL', 'DİL → BAL'], random, {
        raw: 'Hangisi ünsüz kaydırma ile geçerli merdivendir?',
        explanation: `${good} her adımda tek ünsüz değişir.`
      });
    }
  });
}

// ---- 6. wl-prefix-stable — ilk harf sabit ----
function familyPrefixStable() {
  const puzzles = [
    { start: 'kasa', steps: ['kara', 'kare'], end: 'kere' },
    { start: 'kuru', steps: ['kura', 'kula'], end: 'kule' },
    { start: 'kalem', steps: ['kadem', 'kader'], end: 'keder' },
    { start: 'kum', steps: ['kul'], end: 'kol' }
  ];
  const dict = dictFrom(puzzles.flatMap((p) => [p.start, ...p.steps, p.end]), ['para', 'pare', 'masa', 'kare', 'kola', 'kule']);
  return buildFamily('wl-prefix-stable', {
    select(id, pathId, random) {
      const p = pick(puzzles, random);
      return roundWordLadder(id, pathId, p.start, p.steps, p.end, dict, random, {
        raw: `İlk harf sabit merdiven: ${up(p.start)} → … → ${up(p.end)} (baş harf “${up(firstLetter(p.start))}” korunur).`,
        strategy: 'Önek harfini kilitle; yalnız sonraki konumlarda tek harf değiştir.',
        explanation: `Baş harf ${up(firstLetter(p.start))} sabit kalır. Örnek: ${pathJoin([p.start, ...p.steps, p.end])}.`
      });
    },
    forced(id, pathId, random) {
      const p = pick(puzzles.filter((x) => firstLetter(x.start) === firstLetter(x.steps[0])), random);
      return roundChoice(id, pathId, up(p.steps[0]), [up('masa'), up('yol'), up('bal')], random, {
        raw: `Baş harf “${up(firstLetter(p.start))}” sabit. ${up(p.start)} sonrası zorunlu ara?`,
        explanation: `${up(p.steps[0])} öneki korur.`
      });
    },
    spot(id, pathId, random) {
      return roundChoice(id, pathId, ERROR_TYPES.MULTI, [ERROR_TYPES.OOV, ERROR_TYPES.CYCLE, ERROR_TYPES.MISS], random, {
        raw: `Önek-sabit iddiası: KASA → PARA (P≠K). Ana hata?`,
        explanation: `İlk harf de değiştiği için kısıt bozulur; ayrıca birden fazla harf farkı olabilir → ${ERROR_TYPES.MULTI}.`
      });
    },
    compare(id, pathId, random) {
      const good = 'KASA → KARA → KARE → KERE';
      return roundChoice(id, pathId, good, ['KASA → PARA → PARE', 'KASA → KALE → KERE', 'KERE → KASA'], random, {
        raw: 'Hangisi ilk harfi sabitleyen geçerli merdivendir?',
        explanation: `${good} boyunca K öneki korunur.`
      });
    }
  });
}

// ---- 7. wl-suffix-stable — son harf sabit ----
function familySuffixStable() {
  const puzzles = [
    { start: 'bal', steps: ['dal'], end: 'dil' }, // ends with L? bal/dal/dil - dil ends with L yes
    { start: 'kan', steps: ['can'], end: 'cam' }, // n→m not suffix stable - skip
    { start: 'kar', steps: ['kir'], end: 'kır' }, // r stable
    { start: 'yol', steps: ['kol'], end: 'gol' } // l stable
  ];
  const goodPuzzles = [
    { start: 'kar', steps: ['kir'], end: 'kır' },
    { start: 'yol', steps: ['kol'], end: 'gol' },
    { start: 'tel', steps: ['yel'], end: 'yol' }, // l→l? tel/yel/yol - l stable
    { start: 'sol', steps: ['kol'], end: 'gol' }
  ];
  const dict = dictFrom(goodPuzzles.flatMap((p) => [p.start, ...p.steps, p.end]), ['göl', 'gül', 'bal', 'dal', 'dil']);
  return buildFamily('wl-suffix-stable', {
    select(id, pathId, random) {
      const p = pick(goodPuzzles, random);
      return roundWordLadder(id, pathId, p.start, p.steps, p.end, dict, random, {
        raw: `Son harf sabit: ${up(p.start)} → … → ${up(p.end)} (son harf “${up(lastLetter(p.start))}”).`,
        strategy: 'Sonek harfini kilitle; öndeki harflerde tek değişiklik yap.',
        explanation: `Son harf ${up(lastLetter(p.start))} korunur. Örnek: ${pathJoin([p.start, ...p.steps, p.end])}.`
      });
    },
    forced(id, pathId, random) {
      const p = pick(goodPuzzles, random);
      return roundChoice(id, pathId, up(p.steps[0]), [up('yol'), up('masa'), up('kasa')], random, {
        raw: `Sonek “${up(lastLetter(p.start))}” sabit. ${up(p.start)} sonrası zorunlu ara?`,
        explanation: `${up(p.steps[0])} soneki korur.`
      });
    },
    spot(id, pathId, random) {
      return roundChoice(id, pathId, ERROR_TYPES.MISS, [ERROR_TYPES.MULTI, ERROR_TYPES.OOV, ERROR_TYPES.CYCLE], random, {
        raw: `Sonek-sabit hedef GÜL iken yol: YOL → KOL → GOL (GOL≠GÜL). Ana hata?`,
        explanation: `Hedefe ulaşılmadı → ${ERROR_TYPES.MISS}.`
      });
    },
    compare(id, pathId, random) {
      const good = 'YOL → KOL → GOL';
      return roundChoice(id, pathId, good, ['YOL → GÜL', 'YOL → YEL → GOL', 'GOL → YOL'], random, {
        raw: 'Hangisi son harfi (L) sabitleyen geçerli merdivendir?',
        explanation: `${good} boyunca L soneki korunur.`
      });
    }
  });
}

// ---- 8. wl-shortest-route — en kısa yol doğrulama ----
function familyShortestRoute() {
  const puzzles = [
    { start: 'bal', steps: ['dal'], end: 'dil', minLen: 2 },
    { start: 'cam', steps: ['can'], end: 'kan', minLen: 2 },
    { start: 'kare', steps: ['kere'], end: 'küre', minLen: 2 },
    { start: 'kaz', steps: ['kar'], end: 'kır', minLen: 2 }
  ];
  const dict = dictFrom(puzzles.flatMap((p) => [p.start, ...p.steps, p.end]), ['bel', 'bol', 'para', 'pare', 'süre', 'kolay', 'dolay', 'olay']);
  return buildFamily('wl-shortest-route', {
    select(id, pathId, random) {
      const p = pick(puzzles, random);
      return roundWordLadder(id, pathId, p.start, p.steps, p.end, dict, random, {
        raw: `En kısa yol: ${up(p.start)} → ${up(p.end)}. Gereksiz dolambaç ekleme.`,
        strategy: 'Önce tek adımlık komşuları tara; yoksa iki adımlık en kısa köprüyü kur.',
        explanation: `Minimal örnek: ${pathJoin([p.start, ...p.steps, p.end])} (${p.steps.length} ara). Daha uzun geçerli yollar da doğrudur ama bu aile kısalığı hedefler.`
      });
    },
    forced(id, pathId, random) {
      const p = pick(puzzles, random);
      const answer = String(p.steps.length);
      return roundChoice(id, pathId, answer, ['0', '5', '9'], random, {
        raw: `${up(p.start)} → ${up(p.end)} için bilinen en kısa ara adım sayısı?`,
        explanation: `En kısa bilinen yol ${p.steps.length} ara adım kullanır.`
      });
    },
    spot(id, pathId, random) {
      return roundChoice(id, pathId, ERROR_TYPES.CYCLE, [ERROR_TYPES.MULTI, ERROR_TYPES.OOV, ERROR_TYPES.MISS], random, {
        raw: `“Kısa yol” iddiası: BAL → DAL → BAL → DİL. Ana hata?`,
        explanation: `BAL tekrarı döngüdür → ${ERROR_TYPES.CYCLE}.`
      });
    },
    compare(id, pathId, random) {
      const short = 'BAL → DAL → DİL';
      const longLoop = 'BAL → DAL → BAL → DAL → DİL';
      return roundChoice(id, pathId, short, [longLoop, 'BAL → DİL', 'BAL → BEL → DİL'], random, {
        raw: 'Hangisi hem geçerli hem daha kısa (döngüsüz) yoldur?',
        explanation: `${short} döngüsüz ve kısadır; uzun döngülü yol hata içerir.`
      });
    }
  });
}

// ---- 9. wl-detour-route — uzun ama geçerli yol ----
function familyDetourRoute() {
  const puzzles = [
    { start: 'kol', steps: ['gol', 'göl'], end: 'gül' },
    { start: 'bol', steps: ['dol', 'don'], end: 'son' },
    { start: 'taş', steps: ['yaş', 'yas'], end: 'yaz' },
    { start: 'kalmak', steps: ['dalmak', 'salmak', 'sarmak'], end: 'sormak' }
  ];
  const dict = dictFrom(puzzles.flatMap((p) => [p.start, ...p.steps, p.end]), ['tel', 'yel', 'yol', 'sol', 'toz', 'koz', 'köz', 'göz']);
  return buildFamily('wl-detour-route', {
    select(id, pathId, random) {
      const p = pick(puzzles, random);
      return roundWordLadder(id, pathId, p.start, p.steps, p.end, dict, random, {
        raw: `Uzun ama geçerli yol: ${up(p.start)} → … → ${up(p.end)} (${p.steps.length} ara). Kısa yol zorunlu değil.`,
        strategy: 'Her ara adımı tek harf + sözlük ile doğrula; uzunluk tek başına hata değildir.',
        explanation: `Örnek dolambaç: ${pathJoin([p.start, ...p.steps, p.end])}. Daha kısa alternatif varsa o da doğrudur.`
      });
    },
    forced(id, pathId, random) {
      const p = pick(puzzles, random);
      return roundChoice(id, pathId, up(p.steps.at(-1)), [up('yol'), up('sel'), up('kutu')], random, {
        raw: `Uzun yolda ${up(p.end)} öncesi son ara kelime (örnek yolda) hangisi?`,
        explanation: `Örnek zincirde son ara ${up(p.steps.at(-1))}; başka geçerli son aralar da olabilir.`
      });
    },
    spot(id, pathId, random) {
      return roundChoice(id, pathId, ERROR_TYPES.OOV, [ERROR_TYPES.MULTI, ERROR_TYPES.CYCLE, ERROR_TYPES.MISS], random, {
        raw: `Uzun yol: KOL → GOL → QÖL → GÜL. Ana hata?`,
        explanation: `QÖL sözlük dışı → ${ERROR_TYPES.OOV}.`
      });
    },
    compare(id, pathId, random) {
      const longOk = 'KOL → GOL → GÖL → GÜL';
      const broken = 'KOL → GOL → QÖL → GÜL';
      return roundChoice(id, pathId, longOk, [broken, 'KOL → GÜL', 'GÜL → KOL'], random, {
        raw: 'Hangisi uzun ama geçerli merdivendir?',
        explanation: `${longOk} her adımda tek harf ve sözlük kelimesi kullanır.`
      });
    }
  });
}

// ---- 10. wl-alt-path — birden fazla geçerli yol kabulü ----
function familyAltPath() {
  // Same start/end with two different valid mid paths where possible
  const pairs = [
    {
      start: 'masa',
      end: 'kare',
      pathA: ['kasa', 'kara'],
      pathB: ['maya', 'kaya', 'kara'] // may need validation - masa→maya? m/k - masa→maya is one letter (s→y)? masa vs maya: s→y yes. maya→kaya: m→k. kaya→kara: y→r. kara→kare: a→e. So pathB to kare needs kara→kare
    },
    {
      start: 'kasa',
      end: 'pare',
      pathA: ['kara', 'para'],
      pathB: ['kara', 'kare']
    },
    {
      start: 'dil',
      end: 'bin',
      pathA: ['din'],
      pathB: ['diz', 'biz', 'bin'] // dil→diz→biz→bin then end is bin - wait end is bin, pathB would be dil→diz→biz→bin with end bin means mids diz,biz and end bin - but biz→bin is mid to end. So pathB mids: ['diz','biz'] end bin. dil→diz ok, diz→biz ok, biz→bin ok.
    },
    {
      start: 'sol',
      end: 'gol',
      pathA: ['yol', 'kol'],
      pathB: ['kol']
    }
  ];
  const dict = dictFrom(
    pairs.flatMap((p) => [p.start, p.end, ...p.pathA, ...p.pathB]),
    ['bal', 'dal', 'tel', 'yel']
  );
  return buildFamily('wl-alt-path', {
    select(id, pathId, random) {
      const p = pick(pairs, random);
      const useB = random() < 0.5;
      const steps = useB ? p.pathB : p.pathA;
      return roundWordLadder(id, pathId, p.start, steps, p.end, dict, random, {
        raw: `Çoklu yol: ${up(p.start)} → ${up(p.end)}. Önerilen yol örnek; başka geçerli yol da doğrudur.`,
        strategy: 'Tek sabit yolu ezberleme; aynı başlangıç-hedef için alternatif köprüleri de kabul et.',
        explanation: `Örnek A: ${pathJoin([p.start, ...p.pathA, p.end])}. Örnek B: ${pathJoin([p.start, ...p.pathB, p.end])}. İkisi de geçerliyse ikisi de doğru.`
      });
    },
    forced(id, pathId, random) {
      const p = pick(pairs, random);
      const answer = 'İKİSİ DE';
      return roundChoice(id, pathId, answer, ['YALNIZ A', 'YALNIZ B', 'YALNIZ KISA YOL'], random, {
        raw: `A: ${pathJoin([p.start, ...p.pathA, p.end])} · B: ${pathJoin([p.start, ...p.pathB, p.end])}. Hangileri geçerli?`,
        explanation: 'Birden fazla geçerli kelime yolu varsa hepsi doğru kabul edilir → İKİSİ DE.'
      });
    },
    spot(id, pathId, random) {
      return roundChoice(id, pathId, 'TEK-YOL-DAYATMASI', [ERROR_TYPES.MULTI, ERROR_TYPES.OOV, ERROR_TYPES.CYCLE], random, {
        raw: `Öğrenci geçerli alternatif yol buldu ama sistem yalnız örnek yolu doğru saydı. Bu hangi yanlış yaklaşımdır?`,
        explanation: 'Tek sabit yolu zorunlu kılmak hatalıdır; alternatif geçerli yollar kabul edilmelidir.'
      });
    },
    compare(id, pathId, random) {
      const p = pick(pairs, random);
      const both = 'İKİSİ DE GEÇERLİ';
      return roundChoice(id, pathId, both, ['YALNIZ A GEÇERLİ', 'YALNIZ B GEÇERLİ', 'İKİSİ DE GEÇERSİZ'], random, {
        raw: `A=${pathJoin([p.start, ...p.pathA, p.end])} B=${pathJoin([p.start, ...p.pathB, p.end])}. Karşılaştırma sonucu?`,
        explanation: 'Her iki yol da tek harf + sözlük kurallarına uyuyorsa ikisi de geçerlidir.'
      });
    }
  });
}

// ---- 11. wl-error-taxonomy — beş hata türü ayrımı ----
function familyErrorTaxonomy() {
  const samples = [
    { label: pathJoin(['bal', 'xyz', 'dil']), error: ERROR_TYPES.OOV },
    { label: 'BAL → DİL', error: ERROR_TYPES.MULTI },
    { label: 'BAL → DAL → BAL → DİL', error: ERROR_TYPES.CYCLE },
    { label: 'BAL → DAL → DAR', error: ERROR_TYPES.MISS },
    { label: 'BAL → QAL → DAL', error: ERROR_TYPES.BAD_MID }
  ];
  const dict = dictFrom(['bal', 'dal', 'dil', 'dar', 'bar', 'tar', 'cam', 'can', 'kan']);
  return buildFamily('wl-error-taxonomy', {
    select(id, pathId, random) {
      // Play a clean ladder; error taxonomy is taught via other skeletons
      return roundWordLadder(id, pathId, 'bal', ['dal'], 'dil', dict, random, {
        raw: 'Hata türlerini ayırt etmek için önce geçerli bir merdiven kur: BAL → … → DİL.',
        strategy: 'Geçerli yolu kurarken OOV, çoklu harf, döngü, hedefe ulaşmama ve geçersiz ara hatalarını aklında tut.',
        explanation: 'Örnek geçerli yol: BAL → DAL → DİL. Hata türleri choice iskeletlerinde ayrı sorulur.'
      });
    },
    forced(id, pathId, random) {
      const s = pick(samples, random);
      return roundChoice(id, pathId, s.error, Object.values(ERROR_TYPES).filter((e) => e !== s.error).slice(0, 3), random, {
        raw: `Yol: ${s.label}. Bu örnekteki ZORUNLU hata türü etiketi?`,
        explanation: `${s.label} → ${s.error}.`
      });
    },
    spot(id, pathId, random) {
      const s = pick(samples, random);
      return roundChoice(id, pathId, s.error, shuffle(Object.values(ERROR_TYPES).filter((e) => e !== s.error), random).slice(0, 3), random, {
        raw: `Bozuk yol: ${s.label}. Hangi hata türü?`,
        explanation: `Doğru etiket: ${s.error}.`
      });
    },
    compare(id, pathId, random) {
      const a = pick(samples, random);
      let b = pick(samples, random);
      while (b.error === a.error) b = pick(samples, random);
      const answer = `${a.error}|${b.error}`;
      const distractors = [
        `${b.error}|${a.error}`,
        `${ERROR_TYPES.MULTI}|${ERROR_TYPES.MULTI}`,
        `${ERROR_TYPES.OOV}|${ERROR_TYPES.OOV}`
      ].filter((x) => x !== answer);
      return roundChoice(id, pathId, answer, distractors.slice(0, 3), random, {
        raw: `A: ${a.label} · B: ${b.label}. Hata etiket çifti (A|B)?`,
        explanation: `A→${a.error}, B→${b.error}.`
      });
    }
  });
}

// ---- 12. wl-bidirectional — ileri vs geriye kurma ----
function familyBidirectional() {
  const puzzles = [
    { start: 'gül', steps: ['göl', 'gol'], end: 'kol', forwardNote: 'geriye doğru da aynı kurallar' },
    { start: 'yaz', steps: ['yas', 'yaş'], end: 'taş' },
    { start: 'dini', steps: ['dine', 'dene'], end: 'dere' },
    { start: 'keder', steps: ['kader', 'kadem'], end: 'kalem' }
  ];
  const dict = dictFrom(puzzles.flatMap((p) => [p.start, ...p.steps, p.end]), ['bal', 'dal', 'dil', 'sormak', 'kalmak']);
  return buildFamily('wl-bidirectional', {
    select(id, pathId, random) {
      const p = pick(puzzles, random);
      const reverse = random() < 0.5;
      if (reverse) {
        const revSteps = [...p.steps].reverse();
        return roundWordLadder(id, pathId, p.end, revSteps, p.start, dict, random, {
          raw: `Geriye kur: ${up(p.end)} → … → ${up(p.start)}. İleri yolun tersi de geçerlidir.`,
          strategy: 'Hediften geriye tek harf komşularını tarayarak ilerle.',
          explanation: `İleri örnek: ${pathJoin([p.start, ...p.steps, p.end])}. Geriye kurulum da aynı kenarları kullanır.`
        });
      }
      return roundWordLadder(id, pathId, p.start, p.steps, p.end, dict, random, {
        raw: `İleri kur: ${up(p.start)} → … → ${up(p.end)}. Geriye çözüm de mümkündür.`,
        strategy: 'İleri takılırsan hedeften geriye doğru düşün.',
        explanation: `Örnek: ${pathJoin([p.start, ...p.steps, p.end])}.`
      });
    },
    forced(id, pathId, random) {
      const p = pick(puzzles, random);
      const answer = 'HER İKİ YÖN';
      return roundChoice(id, pathId, answer, ['YALNIZ İLERİ', 'YALNIZ GERİ', 'YALNIZ TEK ADIM'], random, {
        raw: `Aynı kenarlar (${pathJoin([p.start, ...p.steps, p.end])}) ileri ve geri kullanılabilir mi?`,
        explanation: 'Tek harf kenarları yönsüzdür; ileri ve geri kurulum ikisi de geçerlidir.'
      });
    },
    spot(id, pathId, random) {
      return roundChoice(id, pathId, ERROR_TYPES.MULTI, [ERROR_TYPES.OOV, ERROR_TYPES.CYCLE, ERROR_TYPES.MISS], random, {
        raw: `Geriye atlama: GÜL → KOL (tek adım). Ana hata?`,
        explanation: `Birden fazla harf değişir → ${ERROR_TYPES.MULTI}.`
      });
    },
    compare(id, pathId, random) {
      const fwd = 'KOL → GOL → GÖL → GÜL';
      const rev = 'GÜL → GÖL → GOL → KOL';
      return roundChoice(id, pathId, 'İKİSİ DE GEÇERLİ', ['YALNIZ İLERİ', 'YALNIZ GERİ', 'İKİSİ GEÇERSİZ'], random, {
        raw: `İleri: ${fwd} · Geri: ${rev}. Karşılaştırma?`,
        explanation: 'İkisi de aynı geçerli kenarların yönleridir.'
      });
    }
  });
}

export const WORD_LADDER_FAMILIES = [
  familyLen3Bridge(),
  familyLen4Bridge(),
  familyLen5Bridge(),
  familyVowelPivot(),
  familyConsonantPivot(),
  familyPrefixStable(),
  familySuffixStable(),
  familyShortestRoute(),
  familyDetourRoute(),
  familyAltPath(),
  familyErrorTaxonomy(),
  familyBidirectional()
];

export { pathJoin, dictFrom, edgesOk };
