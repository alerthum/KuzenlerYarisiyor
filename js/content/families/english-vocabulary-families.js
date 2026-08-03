// Aşama 04 — english-vocabulary (Günün 20 İngilizce Kelimesi).
// UI: tüm iskeletler kind:'choice'.
// Aile = kelime bilme düşüncesi (eşanlam, karşıt, tanım, bağlam, eşdizim, yanlış dost,
// kök/aile, kayıt, kategori, phrasal, sesteş, yanlış-okuma taksonomisi).
// Yüzey kelime değişimi ≠ yeni aile. Cevaplar kısa tutulur (answer_leak kapısı).

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
  return `english-vocabulary:${skeletonId}:${pathId}:${simpleHash(raw)}`;
}

const PATH_IDS = ['raw-letters', 'context-embedded', 'staged-strategy-hint'];

const TASK_TRAITS = {
  select: ['strategySelection', 'multiStepInference'],
  forced: ['informationLinking', 'conditionEvaluation'],
  spot: ['errorAnalysis', 'conditionEvaluation'],
  compare: ['strategySelection', 'usingIntermediateResultInNewDecision']
};

export const EV_MISREAD = {
  SURFACE: 'yuzey',
  FALSE_FRIEND: 'yanlis-dost',
  HOMOPHONE: 'sestes',
  COLLOCATION: 'esdizim'
};

function pathWrap(pathId, rawPrompt, contextHint, strategyHint) {
  if (pathId === 'raw-letters') {
    return {
      prompt: rawPrompt,
      context: contextHint || 'Hedef kelimenin düşünme türünü ayır; yüzey çeviriye düşme.'
    };
  }
  if (pathId === 'context-embedded') {
    return {
      prompt: `English word lab review: ${rawPrompt}`,
      context: 'Senaryo süsünü ayıkla; yalnız kelime bilme türüne odaklan.'
    };
  }
  return {
    prompt: `${strategyHint || 'Önce ilişki türünü belirle, sonra seçenekleri eleye.'} ${rawPrompt}`,
    context: 'Strateji ipucu cevabı vermez; yalnız düşünme sırasını gösterir.'
  };
}

function roundChoice(skeletonId, pathId, answerText, distractors, random, texts) {
  const pool = [answerText, ...distractors];
  const unique = [...new Set(pool.map(String))];
  while (unique.length < 4) unique.push(`X${unique.length}`);
  const options = shuffle(unique.slice(0, 4), random);
  const answerIndex = options.indexOf(String(answerText));
  const { prompt, context } = pathWrap(pathId, texts.raw, texts.context, texts.strategy);
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

// ---- 1. ev-synonym ----
const SYN = [
  { word: 'happy', syn: 'glad', distractors: ['angry', 'tired', 'lonely'] },
  { word: 'big', syn: 'large', distractors: ['tiny', 'slow', 'cold'] },
  { word: 'smart', syn: 'clever', distractors: ['rude', 'lazy', 'noisy'] },
  { word: 'quick', syn: 'fast', distractors: ['late', 'soft', 'dark'] }
];

function familySynonym() {
  return buildFamily('ev-synonym', {
    select(id, pathId, random) {
      const item = pick(SYN, random);
      return roundChoice(id, pathId, item.syn, item.distractors, random, {
        raw: `Which word is a synonym of “${item.word}”?`,
        strategy: 'Find the closest same-meaning word.',
        explanation: `${item.syn} ≈ ${item.word}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(SYN, random);
      return roundChoice(id, pathId, 'ESANLAM', ['KARSIT', 'SESTES', 'KOK'], random, {
        raw: `“${item.word}” ↔ “${item.syn}” ilişkisi zorunlu olarak hangisidir?`,
        explanation: 'Aynı anlam → ESANLAM.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(SYN, random);
      const wrong = item.distractors[0];
      return roundChoice(id, pathId, wrong, [item.syn, item.distractors[1], item.distractors[2]], random, {
        raw: `Student picked a non-synonym for “${item.word}”. Which choice is the violation?`,
        explanation: `${wrong} is not a synonym of ${item.word}.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(SYN, random);
      return roundChoice(id, pathId, 'B', ['A', 'IKISI', 'HIC'], random, {
        raw: `A: ${item.word}=${item.distractors[0]}. B: ${item.word}=${item.syn}. Which world matches synonym meaning?`,
        explanation: 'B carries the synonym link.'
      });
    }
  });
}

// ---- 2. ev-antonym ----
const ANT = [
  { word: 'hot', ant: 'cold', distractors: ['warm', 'fire', 'sun'] },
  { word: 'early', ant: 'late', distractors: ['soon', 'fast', 'ready'] },
  { word: 'full', ant: 'empty', distractors: ['heavy', 'open', 'rich'] },
  { word: 'loud', ant: 'quiet', distractors: ['strong', 'bright', 'hard'] }
];

function familyAntonym() {
  return buildFamily('ev-antonym', {
    select(id, pathId, random) {
      const item = pick(ANT, random);
      return roundChoice(id, pathId, item.ant, item.distractors, random, {
        raw: `What is the antonym of “${item.word}”?`,
        strategy: 'Pick the opposite meaning, not a related word.',
        explanation: `${item.ant} ↔ ${item.word}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(ANT, random);
      return roundChoice(id, pathId, 'KARSIT', ['ESANLAM', 'SESTES', 'TUR'], random, {
        raw: `“${item.word}” ↔ “${item.ant}” zorunlu ilişki hangisidir?`,
        explanation: 'Zıt anlam → KARSIT.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(ANT, random);
      const wrong = item.distractors[0];
      return roundChoice(id, pathId, wrong, [item.ant, item.distractors[1], item.distractors[2]], random, {
        raw: `Student chose a related word, not the antonym of “${item.word}”. Which is the violation?`,
        explanation: `${wrong} is related, not opposite.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(ANT, random);
      return roundChoice(id, pathId, 'A', ['B', 'IKISI', 'HIC'], random, {
        raw: `A: ${item.word}≠${item.ant}. B: ${item.word}=${item.ant}. Which world is antonym-correct?`,
        explanation: 'A encodes opposition.'
      });
    }
  });
}

// ---- 3. ev-definition-match ----
const DEF = [
  { word: 'pencil', def: 'yazım aracı', distractors: ['yiyecek', 'hayvan', 'renk'] },
  { word: 'library', def: 'kitap yeri', distractors: ['spor salonu', 'mutfak', 'bahçe'] },
  { word: 'doctor', def: 'hekim', distractors: ['öğretmen', 'şoför', 'aşçı'] },
  { word: 'river', def: 'akarsu', distractors: ['dağ', 'okul', 'köprü'] }
];

function familyDefinitionMatch() {
  return buildFamily('ev-definition-match', {
    select(id, pathId, random) {
      const item = pick(DEF, random);
      return roundChoice(id, pathId, item.def, item.distractors, random, {
        raw: `“${item.word}” için doğru kısa tanım hangisidir?`,
        strategy: 'Tanımı kelimeyle eşle; çağrışım tuzağına düşme.',
        explanation: `${item.word} → ${item.def}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(DEF, random);
      return roundChoice(id, pathId, item.word, ['apple', 'music', 'cloud'], random, {
        raw: `Tanım: “${item.def}”. Zorunlu İngilizce kelime hangisidir?`,
        explanation: `Tanım ${item.word} kelimesini zorlar.`
      });
    },
    spot(id, pathId, random) {
      const item = pick(DEF, random);
      const wrong = item.distractors[0];
      return roundChoice(id, pathId, wrong, [item.def, item.distractors[1], item.distractors[2]], random, {
        raw: `Öğrenci “${item.word}” için yanlış tanım seçti. İhlal hangisi?`,
        explanation: `${wrong} tanım değildir.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(DEF, random);
      return roundChoice(id, pathId, 'B', ['A', 'IKISI', 'HIC'], random, {
        raw: `A: ${item.word}=${item.distractors[0]}. B: ${item.word}=${item.def}. Hangisi doğru tanım dünyası?`,
        explanation: 'B tanımı eşler.'
      });
    }
  });
}

// ---- 4. ev-context-cloze ----
const CTX = [
  { sentence: 'I ___ water every day.', answer: 'drink', distractors: ['sleep', 'write', 'jump'] },
  { sentence: 'She ___ a book now.', answer: 'reads', distractors: ['flies', 'cooks', 'drives'] },
  { sentence: 'They ___ to school.', answer: 'walk', distractors: ['swim', 'bake', 'paint'] },
  { sentence: 'We ___ football outside.', answer: 'play', distractors: ['wash', 'sing', 'open'] }
];

function familyContextCloze() {
  return buildFamily('ev-context-cloze', {
    select(id, pathId, random) {
      const item = pick(CTX, random);
      return roundChoice(id, pathId, item.answer, item.distractors, random, {
        raw: `Fill the blank from meaning: “${item.sentence}”`,
        strategy: 'Use sentence meaning, not letter length.',
        explanation: `Blank needs ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(CTX, random);
      return roundChoice(id, pathId, 'BAGLAM', ['SESTES', 'KOK', 'TUR'], random, {
        raw: `“${item.sentence}” → “${item.answer}” seçiminin zorunlu gerekçesi hangisidir?`,
        explanation: 'Cümle anlamı → BAGLAM.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(CTX, random);
      const wrong = item.distractors[0];
      return roundChoice(id, pathId, wrong, [item.answer, item.distractors[1], item.distractors[2]], random, {
        raw: `Student ignored sentence meaning in “${item.sentence}”. Which word is the violation?`,
        explanation: `${wrong} breaks context.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(CTX, random);
      return roundChoice(id, pathId, 'B', ['A', 'IKISI', 'HIC'], random, {
        raw: `A fills with ${item.distractors[0]}; B fills with ${item.answer}. Sentence: “${item.sentence}”. Which world fits?`,
        explanation: 'B fits context.'
      });
    }
  });
}

// ---- 5. ev-collocation ----
const COL = [
  { cue: 'make a ___', answer: 'decision', distractors: ['photo', 'music', 'rain'] },
  { cue: 'do ___', answer: 'homework', distractors: ['a photo', 'a party', 'noise'] },
  { cue: 'catch a ___', answer: 'bus', distractors: ['book', 'idea', 'room'] },
  { cue: 'pay ___', answer: 'attention', distractors: ['football', 'lunch', 'sleep'] }
];

function familyCollocation() {
  return buildFamily('ev-collocation', {
    select(id, pathId, random) {
      const item = pick(COL, random);
      return roundChoice(id, pathId, item.answer, item.distractors, random, {
        raw: `Best collocation: “${item.cue}”`,
        strategy: 'Pick the word that naturally pairs.',
        explanation: `Natural pair → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(COL, random);
      return roundChoice(id, pathId, 'ESDIZIM', ['ESANLAM', 'KARSIT', 'SESTES'], random, {
        raw: `“${item.cue.replace('___', item.answer)}” zorunlu ilişki türü hangisidir?`,
        explanation: 'Doğal eşleşme → ESDIZIM.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(COL, random);
      const wrong = item.distractors[0];
      return roundChoice(id, pathId, wrong, [item.answer, item.distractors[1], item.distractors[2]], random, {
        raw: `Which word breaks the collocation “${item.cue}”?`,
        explanation: `${wrong} is unnatural here.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(COL, random);
      return roundChoice(id, pathId, 'A', ['B', 'IKISI', 'HIC'], random, {
        raw: `A: ${item.cue.replace('___', item.answer)}. B: ${item.cue.replace('___', item.distractors[0])}. Which world is natural?`,
        explanation: 'A is the collocation.'
      });
    }
  });
}

// ---- 6. ev-false-friend ----
const FF = [
  { word: 'actual', trFalse: 'aktüel', trTrue: 'gerçek', distractors: ['güncel', 'aktif', 'acil'] },
  { word: 'library', trFalse: 'kırtasiye', trTrue: 'kütüphane', distractors: ['kitabevi', 'arşiv', 'okul'] },
  { word: 'sympathetic', trFalse: 'sempatik', trTrue: 'duyarlı', distractors: ['neşeli', 'güzel', 'hızlı'] },
  { word: 'fabric', trFalse: 'fabrika', trTrue: 'kumaş', distractors: ['bina', 'makine', 'işçi'] }
];

function familyFalseFriend() {
  return buildFamily('ev-false-friend', {
    select(id, pathId, random) {
      const item = pick(FF, random);
      return roundChoice(id, pathId, item.trTrue, [item.trFalse, ...item.distractors.slice(0, 2)], random, {
        raw: `“${item.word}” için doğru Türkçe hangisidir? (yanlış dost tuzağı)`,
        strategy: 'Türkçe benzerine değil İngilizce anlamına bak.',
        explanation: `${item.word} → ${item.trTrue} (tuzak: ${item.trFalse}).`
      });
    },
    forced(id, pathId, random) {
      const item = pick(FF, random);
      return roundChoice(id, pathId, 'YANLIS-DOST', ['ESANLAM', 'SESTES', 'KOK'], random, {
        raw: `“${item.word}” ≠ “${item.trFalse}” hatasının zorunlu etiketi hangisidir?`,
        explanation: 'Benzer görünen yanlış anlam → YANLIS-DOST.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(FF, random);
      return roundChoice(id, pathId, item.trFalse, [item.trTrue, item.distractors[0], item.distractors[1]], random, {
        raw: `Öğrenci “${item.word}” için yanlış dost seçti. İhlal hangisi?`,
        explanation: `${item.trFalse} yanlış dosttur.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(FF, random);
      return roundChoice(id, pathId, 'B', ['A', 'IKISI', 'HIC'], random, {
        raw: `A: ${item.word}=${item.trFalse}. B: ${item.word}=${item.trTrue}. Hangisi doğru?`,
        explanation: 'B gerçek anlamdır.'
      });
    }
  });
}

// ---- 7. ev-word-family ----
const WF = [
  { root: 'happy', form: 'happiness', role: 'isim', distractors: ['happily', 'unhappy', 'happy'] },
  { root: 'decide', form: 'decision', role: 'isim', distractors: ['decisive', 'decide', 'deciding'] },
  { root: 'create', form: 'creative', role: 'sıfat', distractors: ['creation', 'create', 'creatively'] },
  { root: 'care', form: 'careful', role: 'sıfat', distractors: ['care', 'careless', 'caring'] }
];

function familyWordFamily() {
  return buildFamily('ev-word-family', {
    select(id, pathId, random) {
      const item = pick(WF, random);
      return roundChoice(id, pathId, item.form, item.distractors, random, {
        raw: `Same family as “${item.root}”, needed as ${item.role}: which form?`,
        strategy: 'Pick the correct derived form for the role.',
        explanation: `${item.form} is the ${item.role} of ${item.root}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(WF, random);
      return roundChoice(id, pathId, 'KOK-AILE', ['SESTES', 'KARSIT', 'ESDIZIM'], random, {
        raw: `“${item.root}” → “${item.form}” zorunlu ilişki hangisidir?`,
        explanation: 'Türeme → KOK-AILE.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(WF, random);
      const wrong = item.distractors[0];
      return roundChoice(id, pathId, wrong, [item.form, item.distractors[1], item.distractors[2]], random, {
        raw: `Needed ${item.role} from “${item.root}”. Which form is the wrong choice?`,
        explanation: `${wrong} is the wrong form here.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(WF, random);
      return roundChoice(id, pathId, 'A', ['B', 'IKISI', 'HIC'], random, {
        raw: `A uses ${item.form} as ${item.role}. B uses ${item.distractors[0]}. Which world fits?`,
        explanation: 'A has the right word-family form.'
      });
    }
  });
}

// ---- 8. ev-register ----
const REG = [
  { formal: 'purchase', informal: 'buy', distractors: ['sell', 'rent', 'lend'] },
  { formal: 'assist', informal: 'help', distractors: ['hurt', 'hide', 'hope'] },
  { formal: 'depart', informal: 'leave', distractors: ['arrive', 'stay', 'wait'] },
  { formal: 'commence', informal: 'start', distractors: ['finish', 'pause', 'stop'] }
];

function familyRegister() {
  return buildFamily('ev-register', {
    select(id, pathId, random) {
      const item = pick(REG, random);
      return roundChoice(id, pathId, item.informal, [item.formal, ...item.distractors.slice(0, 2)], random, {
        raw: `Everyday register for “${item.formal}”?`,
        strategy: 'Map formal ↔ informal, same meaning.',
        explanation: `${item.formal} (formal) ≈ ${item.informal} (everyday).`
      });
    },
    forced(id, pathId, random) {
      const item = pick(REG, random);
      return roundChoice(id, pathId, 'KAYIT', ['KARSIT', 'SESTES', 'TUR'], random, {
        raw: `“${item.formal}” / “${item.informal}” zorunlu fark türü hangisidir?`,
        explanation: 'Resmi/günlük → KAYIT.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(REG, random);
      const wrong = item.distractors[0];
      return roundChoice(id, pathId, wrong, [item.informal, item.formal, item.distractors[1]], random, {
        raw: `Student mismatched register for “${item.formal}”. Which word is the violation?`,
        explanation: `${wrong} is not the informal pair.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(REG, random);
      return roundChoice(id, pathId, 'B', ['A', 'IKISI', 'HIC'], random, {
        raw: `A: formal=${item.informal}. B: formal=${item.formal}, informal=${item.informal}. Which world is correct?`,
        explanation: 'B keeps register mapping.'
      });
    }
  });
}

// ---- 9. ev-category-member ----
const CAT = [
  { category: 'fruit', member: 'apple', distractors: ['chair', 'car', 'pencil'] },
  { category: 'animal', member: 'tiger', distractors: ['table', 'river', 'shirt'] },
  { category: 'color', member: 'green', distractors: ['happy', 'knife', 'door'] },
  { category: 'tool', member: 'hammer', distractors: ['banana', 'cloud', 'song'] }
];

function familyCategoryMember() {
  return buildFamily('ev-category-member', {
    select(id, pathId, random) {
      const item = pick(CAT, random);
      return roundChoice(id, pathId, item.member, item.distractors, random, {
        raw: `Which word belongs to the category “${item.category}”?`,
        strategy: 'Pick the member, not a random noun.',
        explanation: `${item.member} ∈ ${item.category}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(CAT, random);
      return roundChoice(id, pathId, item.category, ['music', 'weather', 'number'], random, {
        raw: `“${item.member}” için zorunlu üst kategori hangisidir?`,
        explanation: `Category: ${item.category}.`
      });
    },
    spot(id, pathId, random) {
      const item = pick(CAT, random);
      const wrong = item.distractors[0];
      return roundChoice(id, pathId, wrong, [item.member, item.distractors[1], item.distractors[2]], random, {
        raw: `Which word does NOT belong to “${item.category}”?`,
        explanation: `${wrong} is outside the category.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(CAT, random);
      return roundChoice(id, pathId, 'A', ['B', 'IKISI', 'HIC'], random, {
        raw: `A: ${item.member}∈${item.category}. B: ${item.distractors[0]}∈${item.category}. Which world is true?`,
        explanation: 'Only A is a valid membership.'
      });
    }
  });
}

// ---- 10. ev-phrasal ----
const PHR = [
  { verb: 'look up', meaning: 'araştır', distractors: ['yukarı bak', 'kaç', 'kapat'] },
  { verb: 'give up', meaning: 'vazgeç', distractors: ['ver', 'kalk', 'sakla'] },
  { verb: 'turn on', meaning: 'aç', distractors: ['dön', 'kapat', 'at'] },
  { verb: 'find out', meaning: 'öğren', distractors: ['kaybol', 'buluş', 'saklan'] }
];

function familyPhrasal() {
  return buildFamily('ev-phrasal', {
    select(id, pathId, random) {
      const item = pick(PHR, random);
      return roundChoice(id, pathId, item.meaning, item.distractors, random, {
        raw: `Meaning of the phrasal verb “${item.verb}”?`,
        strategy: 'Treat particle+verb as one unit.',
        explanation: `${item.verb} → ${item.meaning}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(PHR, random);
      return roundChoice(id, pathId, 'PHRASAL', ['TEK-KELIME', 'SESTES', 'KARSIT'], random, {
        raw: `“${item.verb}” = “${item.meaning}” için zorunlu yapı etiketi hangisidir?`,
        explanation: 'Fiil+edat bütünü → PHRASAL.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(PHR, random);
      const wrong = item.distractors[0];
      return roundChoice(id, pathId, wrong, [item.meaning, item.distractors[1], item.distractors[2]], random, {
        raw: `Student read “${item.verb}” word-by-word. Which meaning is the violation?`,
        explanation: `${wrong} is a literal misread.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(PHR, random);
      return roundChoice(id, pathId, 'B', ['A', 'IKISI', 'HIC'], random, {
        raw: `A: ${item.verb}=${item.distractors[0]}. B: ${item.verb}=${item.meaning}. Which world is correct?`,
        explanation: 'B uses phrasal meaning.'
      });
    }
  });
}

// ---- 11. ev-homophone-trap ----
const HOM = [
  { heard: 'sea', correct: 'sea', trap: 'see', distractors: ['say', 'she'] },
  { heard: 'flour', correct: 'flour', trap: 'flower', distractors: ['floor', 'flyer'] },
  { heard: 'pair', correct: 'pair', trap: 'pear', distractors: ['peer', 'poor'] },
  { heard: 'right', correct: 'right', trap: 'write', distractors: ['rite', 'rate'] }
];

function familyHomophoneTrap() {
  return buildFamily('ev-homophone-trap', {
    select(id, pathId, random) {
      const item = pick(HOM, random);
      return roundChoice(id, pathId, item.correct, [item.trap, ...item.distractors], random, {
        raw: `Spelling for the meaning of “${item.heard}” (not the sound-alike trap)?`,
        strategy: 'Separate sound from spelling/meaning.',
        explanation: `Correct spelling: ${item.correct} (trap: ${item.trap}).`
      });
    },
    forced(id, pathId, random) {
      const item = pick(HOM, random);
      return roundChoice(id, pathId, 'SESTES', ['ESANLAM', 'KARSIT', 'KOK'], random, {
        raw: `“${item.correct}” / “${item.trap}” zorunlu tuzak türü hangisidir?`,
        explanation: 'Aynı ses, farklı yazım → SESTES.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(HOM, random);
      return roundChoice(id, pathId, item.trap, [item.correct, item.distractors[0], item.distractors[1]], random, {
        raw: `Which spelling is the homophone trap against “${item.correct}”?`,
        explanation: `${item.trap} is the sound-alike trap.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(HOM, random);
      return roundChoice(id, pathId, 'A', ['B', 'IKISI', 'HIC'], random, {
        raw: `A: ${item.correct}≠${item.trap} (same sound). B: they are synonyms. Which world is true?`,
        explanation: 'A is the homophone relation.'
      });
    }
  });
}

// ---- 12. ev-misread-taxonomy ----
const MISREAD = [
  { word: 'actual', wrong: 'aktüel sandı', type: EV_MISREAD.FALSE_FRIEND },
  { word: 'look up', wrong: 'yukarı bak sandı', type: EV_MISREAD.SURFACE },
  { word: 'flour', wrong: 'flower yazdı', type: EV_MISREAD.HOMOPHONE },
  { word: 'make a decision', wrong: 'do a decision dedi', type: EV_MISREAD.COLLOCATION }
];

function familyMisreadTaxonomy() {
  return buildFamily('ev-misread-taxonomy', {
    select(id, pathId, random) {
      const item = pick(MISREAD, random);
      const distractors = Object.values(EV_MISREAD).filter((t) => t !== item.type);
      return roundChoice(id, pathId, item.type, distractors.slice(0, 3), random, {
        raw: `Word “${item.word}”; error “${item.wrong}”. Misread type?`,
        strategy: 'Classify: surface / false-friend / homophone / collocation.',
        explanation: `Type: ${item.type}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(MISREAD, random);
      const distractors = Object.values(EV_MISREAD).filter((t) => t !== item.type);
      return roundChoice(id, pathId, item.type, distractors.slice(0, 3), random, {
        raw: `“${item.wrong}” için zorunlu taksonomi etiketi hangisidir?`,
        explanation: `Zorunlu etiket: ${item.type}.`
      });
    },
    spot(id, pathId, random) {
      const item = pick(MISREAD, random);
      const wrongLabel = Object.values(EV_MISREAD).find((t) => t !== item.type);
      const others = Object.values(EV_MISREAD).filter((t) => t !== wrongLabel);
      return roundChoice(id, pathId, wrongLabel, [item.type, others[0], others[1] || others[0]], random, {
        raw: `True type for “${item.word}” error is ${item.type}. Which label is a wrong taxonomy pick?`,
        explanation: `Correct is ${item.type}; other labels are mislabels.`
      });
    },
    compare(id, pathId, random) {
      const a = MISREAD[0];
      const b = MISREAD[2];
      return roundChoice(id, pathId, `${a.type}≠${b.type}`, ['aynı', 'ikisi-dost', 'ikisi-ses'], random, {
        raw: `A: “${a.word}”→${a.type}. B: “${b.word}”→${b.type}. Relation?`,
        explanation: 'Different misread cells.'
      });
    }
  });
}

export const ENGLISH_VOCABULARY_FAMILIES = [
  familySynonym(),
  familyAntonym(),
  familyDefinitionMatch(),
  familyContextCloze(),
  familyCollocation(),
  familyFalseFriend(),
  familyWordFamily(),
  familyRegister(),
  familyCategoryMember(),
  familyPhrasal(),
  familyHomophoneTrap(),
  familyMisreadTaxonomy()
];
