// Aşama 04 — english-cloze (İngilizce Boşluk Avı).
// UI: tüm iskeletler kind:'choice' (boşluk + 4 seçenek).
// Aile = dilbilgisi/boşluk düşüncesi (article, preposition, tense, S-V, pronoun,
// connector, quantifier, modal, comparative, phrasal-slot, collocation-gap, misread).
// Yüzey cümle değişimi ≠ yeni aile. Cevaplar kısa (answer_leak kapısı).

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
  return `english-cloze:${skeletonId}:${pathId}:${simpleHash(raw)}`;
}

const PATH_IDS = ['raw-letters', 'context-embedded', 'staged-strategy-hint'];

const TASK_TRAITS = {
  select: ['strategySelection', 'multiStepInference'],
  forced: ['informationLinking', 'conditionEvaluation'],
  spot: ['errorAnalysis', 'conditionEvaluation'],
  compare: ['strategySelection', 'usingIntermediateResultInNewDecision']
};

export const EC_MISREAD = {
  ARTICLE: 'artikel',
  TENSE: 'zaman',
  PREP: 'edat',
  AGREEMENT: 'uyum'
};

function pathWrap(pathId, rawPrompt, contextHint, strategyHint) {
  if (pathId === 'raw-letters') {
    return {
      prompt: rawPrompt,
      context: contextHint || 'Boşluğa dilbilgisi ve anlam bakımından uygun kelimeyi seç.'
    };
  }
  if (pathId === 'context-embedded') {
    return {
      prompt: `Gap lab practice: ${rawPrompt}`,
      context: 'Senaryo süsünü ayıkla; yalnız dilbilgisi kuralına odaklan.'
    };
  }
  return {
    prompt: `${strategyHint || 'Önce boşluğun kural türünü belirle, sonra seçenekleri eleye.'} ${rawPrompt}`,
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
    explanation: /Türkçesi:/i.test(String(texts.explanation || '')) ? texts.explanation : `${texts.explanation} Türkçesi: Doğru seçenek cümlenin anlam ve dilbilgisi yapısını tamamlar.`,
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

function gap(sentence, answer) {
  const escaped = String(answer).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`\\b${escaped}\\b`, 'i');
  return sentence.replace(re, '_____');
}

// ---- 1. ec-article ----
const ART = [
  { sentence: 'I saw a cat.', answer: 'a', distractors: ['an', 'the', '—'] },
  { sentence: 'She ate an apple.', answer: 'an', distractors: ['a', 'the', '—'] },
  { sentence: 'The sun is hot.', answer: 'the', distractors: ['a', 'an', '—'] },
  { sentence: 'He is an engineer.', answer: 'an', distractors: ['a', 'the', 'some'] }
];

function familyArticle() {
  return buildFamily('ec-article', {
    select(id, pathId, random) {
      const item = pick(ART, random);
      return roundChoice(id, pathId, item.answer, item.distractors, random, {
        raw: `Fill: “${gap(item.sentence, item.answer)}”`,
        strategy: 'Check vowel sound and uniqueness.',
        explanation: `Article: ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(ART, random);
      return roundChoice(id, pathId, 'ARTIKEL', ['ZAMAN', 'EDAT', 'UYUM'], random, {
        raw: `“${item.sentence}” boşluk kuralı zorunlu olarak hangisidir?`,
        explanation: 'a/an/the → ARTIKEL.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(ART, random);
      const wrong = item.distractors[0];
      return roundChoice(id, pathId, wrong, [item.answer, item.distractors[1], item.distractors[2]], random, {
        raw: `Student misfilled article in “${gap(item.sentence, item.answer)}”. Which is the violation?`,
        explanation: `${wrong} breaks article rule.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(ART, random);
      return roundChoice(id, pathId, 'B', ['A', 'IKISI', 'HIC'], random, {
        raw: `A uses ${item.distractors[0]}; B uses ${item.answer} in “${gap(item.sentence, item.answer)}”. Which world fits?`,
        explanation: 'B has the correct article.'
      });
    }
  });
}

// ---- 2. ec-preposition ----
const PREP = [
  { sentence: 'The book is on the table.', answer: 'on', distractors: ['in', 'at', 'by'] },
  { sentence: 'She goes to school.', answer: 'to', distractors: ['at', 'in', 'for'] },
  { sentence: 'Wait for me.', answer: 'for', distractors: ['to', 'with', 'from'] },
  { sentence: 'He lives in Ankara.', answer: 'in', distractors: ['on', 'at', 'to'] }
];

function familyPreposition() {
  return buildFamily('ec-preposition', {
    select(id, pathId, random) {
      const item = pick(PREP, random);
      return roundChoice(id, pathId, item.answer, item.distractors, random, {
        raw: `Fill: “${gap(item.sentence, item.answer)}”`,
        strategy: 'Pick the preposition that fits place/direction.',
        explanation: `Prep: ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(PREP, random);
      return roundChoice(id, pathId, 'EDAT', ['ARTIKEL', 'ZAMAN', 'UYUM'], random, {
        raw: `“${item.sentence}” boşluk türü zorunlu hangisidir?`,
        explanation: 'Preposition → EDAT.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(PREP, random);
      const wrong = item.distractors[0];
      return roundChoice(id, pathId, wrong, [item.answer, item.distractors[1], item.distractors[2]], random, {
        raw: `Which preposition is wrong for “${gap(item.sentence, item.answer)}”?`,
        explanation: `${wrong} is the violation.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(PREP, random);
      return roundChoice(id, pathId, 'A', ['B', 'IKISI', 'HIC'], random, {
        raw: `A: ${item.answer}. B: ${item.distractors[0]}. Sentence: “${gap(item.sentence, item.answer)}”. Correct world?`,
        explanation: 'A fits the preposition slot.'
      });
    }
  });
}

// ---- 3. ec-verb-tense ----
const TENSE = [
  { sentence: 'Yesterday I played football.', answer: 'played', distractors: ['play', 'plays', 'playing'] },
  { sentence: 'She is reading now.', answer: 'reading', distractors: ['read', 'reads', 'readed'] },
  { sentence: 'They will come tomorrow.', answer: 'will', distractors: ['did', 'do', 'are'] },
  { sentence: 'He goes every day.', answer: 'goes', distractors: ['go', 'went', 'going'] }
];

function familyVerbTense() {
  return buildFamily('ec-verb-tense', {
    select(id, pathId, random) {
      const item = pick(TENSE, random);
      return roundChoice(id, pathId, item.answer, item.distractors, random, {
        raw: `Fill tense: “${gap(item.sentence, item.answer)}”`,
        strategy: 'Match time words to verb form.',
        explanation: `Tense form: ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(TENSE, random);
      return roundChoice(id, pathId, 'ZAMAN', ['EDAT', 'ARTIKEL', 'BAGLAC'], random, {
        raw: `“${item.sentence}” zorunlu boşluk türü hangisidir?`,
        explanation: 'Verb tense → ZAMAN.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(TENSE, random);
      const wrong = item.distractors[0];
      return roundChoice(id, pathId, wrong, [item.answer, item.distractors[1], item.distractors[2]], random, {
        raw: `Student used wrong tense in “${gap(item.sentence, item.answer)}”. Violation?`,
        explanation: `${wrong} is the tense violation.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(TENSE, random);
      return roundChoice(id, pathId, 'B', ['A', 'IKISI', 'HIC'], random, {
        raw: `A: ${item.distractors[0]}. B: ${item.answer}. “${gap(item.sentence, item.answer)}” — which world?`,
        explanation: 'B matches the tense cue.'
      });
    }
  });
}

// ---- 4. ec-subject-verb ----
const SV = [
  { sentence: 'He runs fast.', answer: 'runs', distractors: ['run', 'running', 'ran'] },
  { sentence: 'They like tea.', answer: 'like', distractors: ['likes', 'liking', 'liked'] },
  { sentence: 'The dog barks.', answer: 'barks', distractors: ['bark', 'barking', 'barked'] },
  { sentence: 'We are ready.', answer: 'are', distractors: ['is', 'am', 'be'] }
];

function familySubjectVerb() {
  return buildFamily('ec-subject-verb', {
    select(id, pathId, random) {
      const item = pick(SV, random);
      return roundChoice(id, pathId, item.answer, item.distractors, random, {
        raw: `Subject–verb agreement: “${gap(item.sentence, item.answer)}”`,
        strategy: 'Match verb number to subject.',
        explanation: `Agreement form: ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(SV, random);
      return roundChoice(id, pathId, 'UYUM', ['ZAMAN', 'EDAT', 'ARTIKEL'], random, {
        raw: `“${item.sentence}” zorunlu kural hangisidir?`,
        explanation: 'S–V agreement → UYUM.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(SV, random);
      const wrong = item.distractors[0];
      return roundChoice(id, pathId, wrong, [item.answer, item.distractors[1], item.distractors[2]], random, {
        raw: `Which form breaks agreement in “${gap(item.sentence, item.answer)}”?`,
        explanation: `${wrong} breaks S–V agreement.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(SV, random);
      return roundChoice(id, pathId, 'A', ['B', 'IKISI', 'HIC'], random, {
        raw: `A: ${item.answer}. B: ${item.distractors[0]}. “${gap(item.sentence, item.answer)}” — correct?`,
        explanation: 'A agrees with the subject.'
      });
    }
  });
}

// ---- 5. ec-pronoun ----
const PRO = [
  { sentence: 'This is my book.', answer: 'my', distractors: ['me', 'I', 'mine'] },
  { sentence: 'Give it to her.', answer: 'her', distractors: ['she', 'hers', 'him'] },
  { sentence: 'They are our friends.', answer: 'our', distractors: ['we', 'us', 'ours'] },
  { sentence: 'He likes himself.', answer: 'himself', distractors: ['him', 'he', 'his'] }
];

function familyPronoun() {
  return buildFamily('ec-pronoun', {
    select(id, pathId, random) {
      const item = pick(PRO, random);
      return roundChoice(id, pathId, item.answer, item.distractors, random, {
        raw: `Pronoun slot: “${gap(item.sentence, item.answer)}”`,
        strategy: 'Pick case/role: subject/object/possessive/reflexive.',
        explanation: `Pronoun: ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(PRO, random);
      return roundChoice(id, pathId, 'ZAMIR', ['EDAT', 'ZAMAN', 'BAGLAC'], random, {
        raw: `“${item.sentence}” boşluk türü zorunlu hangisidir?`,
        explanation: 'Pronoun → ZAMIR.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(PRO, random);
      const wrong = item.distractors[0];
      return roundChoice(id, pathId, wrong, [item.answer, item.distractors[1], item.distractors[2]], random, {
        raw: `Wrong pronoun case in “${gap(item.sentence, item.answer)}”?`,
        explanation: `${wrong} is the case violation.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(PRO, random);
      return roundChoice(id, pathId, 'B', ['A', 'IKISI', 'HIC'], random, {
        raw: `A: ${item.distractors[0]}. B: ${item.answer}. “${gap(item.sentence, item.answer)}” — which?`,
        explanation: 'B has the correct pronoun case.'
      });
    }
  });
}

// ---- 6. ec-connector ----
const CON = [
  { sentence: 'I was tired but happy.', answer: 'but', distractors: ['and', 'because', 'or'] },
  { sentence: 'She stayed home because it rained.', answer: 'because', distractors: ['but', 'or', 'and'] },
  { sentence: 'Tea and coffee are hot.', answer: 'and', distractors: ['but', 'or', 'so'] },
  { sentence: 'Do you want tea or juice?', answer: 'or', distractors: ['and', 'but', 'so'] }
];

function familyConnector() {
  return buildFamily('ec-connector', {
    select(id, pathId, random) {
      const item = pick(CON, random);
      return roundChoice(id, pathId, item.answer, item.distractors, random, {
        raw: `Connector: “${gap(item.sentence, item.answer)}”`,
        strategy: 'Choose contrast / cause / addition / choice.',
        explanation: `Connector: ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(CON, random);
      return roundChoice(id, pathId, 'BAGLAC', ['EDAT', 'ZAMAN', 'ARTIKEL'], random, {
        raw: `“${item.sentence}” zorunlu boşluk türü hangisidir?`,
        explanation: 'Connector → BAGLAC.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(CON, random);
      const wrong = item.distractors[0];
      return roundChoice(id, pathId, wrong, [item.answer, item.distractors[1], item.distractors[2]], random, {
        raw: `Which connector breaks meaning in “${gap(item.sentence, item.answer)}”?`,
        explanation: `${wrong} is the wrong link.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(CON, random);
      return roundChoice(id, pathId, 'A', ['B', 'IKISI', 'HIC'], random, {
        raw: `A: ${item.answer}. B: ${item.distractors[0]}. “${gap(item.sentence, item.answer)}” — correct?`,
        explanation: 'A keeps the logical link.'
      });
    }
  });
}

// ---- 7. ec-quantifier ----
const QUAN = [
  { sentence: 'There is some milk.', answer: 'some', distractors: ['many', 'a', 'an'] },
  { sentence: 'How many books?', answer: 'many', distractors: ['much', 'some', 'any'] },
  { sentence: 'I have much time.', answer: 'much', distractors: ['many', 'a', 'an'] },
  { sentence: 'Do you have any sugar?', answer: 'any', distractors: ['many', 'a', 'an'] }
];

function familyQuantifier() {
  return buildFamily('ec-quantifier', {
    select(id, pathId, random) {
      const item = pick(QUAN, random);
      return roundChoice(id, pathId, item.answer, item.distractors, random, {
        raw: `Quantifier: “${gap(item.sentence, item.answer)}”`,
        strategy: 'Countable vs uncountable; positive vs question.',
        explanation: `Quantifier: ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(QUAN, random);
      return roundChoice(id, pathId, 'MIKTAR', ['ZAMAN', 'EDAT', 'UYUM'], random, {
        raw: `“${item.sentence}” zorunlu boşluk türü hangisidir?`,
        explanation: 'Quantifier → MIKTAR.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(QUAN, random);
      const wrong = item.distractors[0];
      return roundChoice(id, pathId, wrong, [item.answer, item.distractors[1], item.distractors[2]], random, {
        raw: `Wrong quantifier in “${gap(item.sentence, item.answer)}”?`,
        explanation: `${wrong} violates quantity rules.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(QUAN, random);
      return roundChoice(id, pathId, 'B', ['A', 'IKISI', 'HIC'], random, {
        raw: `A: ${item.distractors[0]}. B: ${item.answer}. “${gap(item.sentence, item.answer)}” — which?`,
        explanation: 'B is the right quantifier.'
      });
    }
  });
}

// ---- 8. ec-modal ----
const MOD = [
  { sentence: 'You must stop here.', answer: 'must', distractors: ['can', 'may', 'will'] },
  { sentence: 'She can swim well.', answer: 'can', distractors: ['must', 'should', 'did'] },
  { sentence: 'You should sleep early.', answer: 'should', distractors: ['can', 'must', 'are'] },
  { sentence: 'May I open the door?', answer: 'May', distractors: ['Must', 'Did', 'Are'] }
];

function familyModal() {
  return buildFamily('ec-modal', {
    select(id, pathId, random) {
      const item = pick(MOD, random);
      return roundChoice(id, pathId, item.answer, item.distractors, random, {
        raw: `Modal: “${gap(item.sentence, item.answer)}”`,
        strategy: 'Ability / obligation / advice / permission.',
        explanation: `Modal: ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(MOD, random);
      return roundChoice(id, pathId, 'MODAL', ['ZAMAN', 'EDAT', 'ARTIKEL'], random, {
        raw: `“${item.sentence}” zorunlu boşluk türü hangisidir?`,
        explanation: 'Modal verb → MODAL.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(MOD, random);
      const wrong = item.distractors[0];
      return roundChoice(id, pathId, wrong, [item.answer, item.distractors[1], item.distractors[2]], random, {
        raw: `Wrong modal meaning in “${gap(item.sentence, item.answer)}”?`,
        explanation: `${wrong} is the modal violation.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(MOD, random);
      return roundChoice(id, pathId, 'A', ['B', 'IKISI', 'HIC'], random, {
        raw: `A: ${item.answer}. B: ${item.distractors[0]}. “${gap(item.sentence, item.answer)}” — correct?`,
        explanation: 'A carries the intended modality.'
      });
    }
  });
}

// ---- 9. ec-comparative ----
const COMP = [
  { sentence: 'This box is bigger.', answer: 'bigger', distractors: ['big', 'biggest', 'more big'] },
  { sentence: 'She is more careful.', answer: 'more', distractors: ['most', 'much', 'many'] },
  { sentence: 'He runs faster.', answer: 'faster', distractors: ['fast', 'fastest', 'more fast'] },
  { sentence: 'Today is the hottest day.', answer: 'hottest', distractors: ['hotter', 'hot', 'more hot'] }
];

function familyComparative() {
  return buildFamily('ec-comparative', {
    select(id, pathId, random) {
      const item = pick(COMP, random);
      return roundChoice(id, pathId, item.answer, item.distractors, random, {
        raw: `Comparison form: “${gap(item.sentence, item.answer)}”`,
        strategy: '-er / more / -est for compare vs superlative.',
        explanation: `Form: ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(COMP, random);
      return roundChoice(id, pathId, 'KARSILASTIR', ['ZAMAN', 'EDAT', 'UYUM'], random, {
        raw: `“${item.sentence}” zorunlu boşluk türü hangisidir?`,
        explanation: 'Comparative/superlative → KARSILASTIR.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(COMP, random);
      const wrong = item.distractors[0];
      return roundChoice(id, pathId, wrong, [item.answer, item.distractors[1], item.distractors[2]], random, {
        raw: `Wrong comparison form in “${gap(item.sentence, item.answer)}”?`,
        explanation: `${wrong} is the form violation.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(COMP, random);
      return roundChoice(id, pathId, 'B', ['A', 'IKISI', 'HIC'], random, {
        raw: `A: ${item.distractors[0]}. B: ${item.answer}. “${gap(item.sentence, item.answer)}” — which?`,
        explanation: 'B is the correct comparison form.'
      });
    }
  });
}

// ---- 10. ec-phrasal-slot ----
const PHR = [
  { sentence: 'Please turn on the light.', answer: 'on', distractors: ['off', 'up', 'in'] },
  { sentence: 'Look up the word.', answer: 'up', distractors: ['down', 'on', 'out'] },
  { sentence: 'Give up smoking.', answer: 'up', distractors: ['in', 'on', 'off'] },
  { sentence: 'Put away your books.', answer: 'away', distractors: ['on', 'in', 'up'] }
];

function familyPhrasalSlot() {
  return buildFamily('ec-phrasal-slot', {
    select(id, pathId, random) {
      const item = pick(PHR, random);
      return roundChoice(id, pathId, item.answer, item.distractors, random, {
        raw: `Phrasal particle: “${gap(item.sentence, item.answer)}”`,
        strategy: 'Particle completes the phrasal meaning.',
        explanation: `Particle: ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(PHR, random);
      return roundChoice(id, pathId, 'PHRASAL', ['ARTIKEL', 'ZAMAN', 'UYUM'], random, {
        raw: `“${item.sentence}” zorunlu boşluk türü hangisidir?`,
        explanation: 'Phrasal particle → PHRASAL.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(PHR, random);
      const wrong = item.distractors[0];
      return roundChoice(id, pathId, wrong, [item.answer, item.distractors[1], item.distractors[2]], random, {
        raw: `Wrong particle in “${gap(item.sentence, item.answer)}”?`,
        explanation: `${wrong} breaks the phrasal.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(PHR, random);
      return roundChoice(id, pathId, 'A', ['B', 'IKISI', 'HIC'], random, {
        raw: `A: ${item.answer}. B: ${item.distractors[0]}. “${gap(item.sentence, item.answer)}” — correct?`,
        explanation: 'A completes the phrasal verb.'
      });
    }
  });
}

// ---- 11. ec-collocation-gap ----
const COL = [
  { sentence: 'Please make a decision.', answer: 'make', distractors: ['do', 'take', 'have'] },
  { sentence: 'I did my homework.', answer: 'did', distractors: ['made', 'took', 'had'] },
  { sentence: 'She took a photo.', answer: 'took', distractors: ['made', 'did', 'gave'] },
  { sentence: 'Pay attention now.', answer: 'Pay', distractors: ['Do', 'Make', 'Give'] }
];

function familyCollocationGap() {
  return buildFamily('ec-collocation-gap', {
    select(id, pathId, random) {
      const item = pick(COL, random);
      return roundChoice(id, pathId, item.answer, item.distractors, random, {
        raw: `Collocation gap: “${gap(item.sentence, item.answer)}”`,
        strategy: 'Pick the verb that naturally pairs.',
        explanation: `Collocation verb: ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(COL, random);
      return roundChoice(id, pathId, 'ESDIZIM', ['ZAMAN', 'EDAT', 'UYUM'], random, {
        raw: `“${item.sentence}” zorunlu boşluk türü hangisidir?`,
        explanation: 'Collocation → ESDIZIM.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(COL, random);
      const wrong = item.distractors[0];
      return roundChoice(id, pathId, wrong, [item.answer, item.distractors[1], item.distractors[2]], random, {
        raw: `Which verb breaks collocation in “${gap(item.sentence, item.answer)}”?`,
        explanation: `${wrong} is unnatural.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(COL, random);
      return roundChoice(id, pathId, 'B', ['A', 'IKISI', 'HIC'], random, {
        raw: `A: ${item.distractors[0]}. B: ${item.answer}. “${gap(item.sentence, item.answer)}” — which?`,
        explanation: 'B is the collocation.'
      });
    }
  });
}

// ---- 12. ec-misread-taxonomy ----
const MISREAD = [
  { sentence: 'I saw a cat.', wrong: 'an', type: EC_MISREAD.ARTICLE },
  { sentence: 'Yesterday I played.', wrong: 'play', type: EC_MISREAD.TENSE },
  { sentence: 'The book is on the table.', wrong: 'in', type: EC_MISREAD.PREP },
  { sentence: 'He runs fast.', wrong: 'run', type: EC_MISREAD.AGREEMENT }
];

function familyMisreadTaxonomy() {
  return buildFamily('ec-misread-taxonomy', {
    select(id, pathId, random) {
      const item = pick(MISREAD, random);
      const distractors = Object.values(EC_MISREAD).filter((t) => t !== item.type);
      return roundChoice(id, pathId, item.type, distractors.slice(0, 3), random, {
        raw: `Sentence “${item.sentence}”; wrong fill “${item.wrong}”. Misread type?`,
        strategy: 'Classify: article / tense / prep / agreement.',
        explanation: `Type: ${item.type}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(MISREAD, random);
      const distractors = Object.values(EC_MISREAD).filter((t) => t !== item.type);
      return roundChoice(id, pathId, item.type, distractors.slice(0, 3), random, {
        raw: `“${item.wrong}” hatası için zorunlu taksonomi etiketi hangisidir?`,
        explanation: `Zorunlu etiket: ${item.type}.`
      });
    },
    spot(id, pathId, random) {
      const item = pick(MISREAD, random);
      const wrongLabel = Object.values(EC_MISREAD).find((t) => t !== item.type);
      const others = Object.values(EC_MISREAD).filter((t) => t !== wrongLabel);
      return roundChoice(id, pathId, wrongLabel, [item.type, others[0], others[1] || others[0]], random, {
        raw: `True type is ${item.type} for “${item.sentence}”. Which label is a wrong taxonomy pick?`,
        explanation: `Correct is ${item.type}.`
      });
    },
    compare(id, pathId, random) {
      const a = MISREAD[0];
      const b = MISREAD[1];
      return roundChoice(id, pathId, `${a.type}≠${b.type}`, ['aynı', 'ikisi-edat', 'ikisi-zaman'], random, {
        raw: `A: “${a.sentence}”→${a.type}. B: “${b.sentence}”→${b.type}. Relation?`,
        explanation: 'Different misread cells.'
      });
    }
  });
}

export const ENGLISH_CLOZE_FAMILIES = [
  familyArticle(),
  familyPreposition(),
  familyVerbTense(),
  familySubjectVerb(),
  familyPronoun(),
  familyConnector(),
  familyQuantifier(),
  familyModal(),
  familyComparative(),
  familyPhrasalSlot(),
  familyCollocationGap(),
  familyMisreadTaxonomy()
];
