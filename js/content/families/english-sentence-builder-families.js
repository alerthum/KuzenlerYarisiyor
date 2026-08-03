// Aşama 04 — english-sentence-builder (İngilizce Cümle Kurucu).
// UI: select-valid → kind:'wordOrder' (tokens + answerTokens); diğer 3 → kind:'choice'.
// Aile = cümle sırası düşüncesi (SVO, zaman önde, soru, olumsuzluk, sıfat-isim,
// edat, bağlaç, modal, there-be, emir, nesne zamiri, yanlış-sıra taksonomisi).
// Yüzey token makyajı ≠ yeni aile.

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
  return `english-sentence-builder:${skeletonId}:${pathId}:${simpleHash(raw)}`;
}

const PATH_IDS = ['raw-letters', 'context-embedded', 'staged-strategy-hint'];

const TASK_TRAITS = {
  select: ['strategySelection', 'multiStepInference'],
  forced: ['informationLinking', 'conditionEvaluation'],
  spot: ['errorAnalysis', 'conditionEvaluation'],
  compare: ['strategySelection', 'usingIntermediateResultInNewDecision']
};

export const ESB_MISORDER = {
  SVO: 'svo-ters',
  AUX: 'yardimci-yanlis',
  NEG: 'olumsuzluk-yeri',
  ADJ: 'sifat-isim'
};

function pathWrap(pathId, rawPrompt, contextHint, strategyHint) {
  if (pathId === 'raw-letters') {
    return {
      prompt: rawPrompt,
      context: contextHint || 'Kelimeleri doğru İngilizce sıraya diz.'
    };
  }
  if (pathId === 'context-embedded') {
    return {
      prompt: `Sentence lab: ${rawPrompt}`,
      context: 'Senaryo süsünü ayıkla; yalnız sözdizimi kuralına odaklan.'
    };
  }
  return {
    prompt: `${strategyHint || 'Önce özne-fiil-nesne iskeletini kur, sonra ekleri yerleştir.'} ${rawPrompt}`,
    context: 'Strateji ipucu cevabı vermez; yalnız düşünme sırasını gösterir.'
  };
}

function toTokens(answerTokens, random) {
  const shuffled = shuffle(answerTokens.map((value, index) => ({ id: `${index}-${value}`, value })), random);
  return shuffled;
}

function roundWordOrder(skeletonId, pathId, answerTokens, turkish, random, texts) {
  const { prompt, context } = pathWrap(pathId, texts.raw, texts.context || `Türkçesi: ${turkish}`, texts.strategy);
  const instanceNonce = Math.floor(random() * 1e9).toString(36);
  return {
    kind: 'wordOrder',
    prompt,
    context,
    tokens: toTokens(answerTokens, random),
    answerTokens: [...answerTokens],
    explanation: texts.explanation || `Doğru cümle: ${answerTokens.join(' ')}. Türkçesi: ${turkish}`,
    questionKey: wrapKey(skeletonId, pathId, `${answerTokens.join('|')}|${instanceNonce}`)
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

function join(tokens) {
  return tokens.join(' ');
}

// ---- 1. esb-svo-basic ----
const SVO = [
  { tokens: ['She', 'reads', 'a', 'book'], tr: 'O bir kitap okur', first: 'She', bad: 'reads She a book' },
  { tokens: ['They', 'play', 'football'], tr: 'Onlar futbol oynar', first: 'They', bad: 'play They football' },
  { tokens: ['Tom', 'likes', 'apples'], tr: 'Tom elma sever', first: 'Tom', bad: 'likes Tom apples' }
];

function familySvo() {
  return buildFamily('esb-svo-basic', {
    select(id, pathId, random) {
      const item = pick(SVO, random);
      return roundWordOrder(id, pathId, item.tokens, item.tr, random, {
        raw: 'Kelimelere doğru sırayla dokunarak SVO cümlesini kur.',
        strategy: 'Özne → fiil → nesne sırasını kilitle.',
        explanation: `SVO: ${join(item.tokens)}. ${item.tr}`
      });
    },
    forced(id, pathId, random) {
      const item = pick(SVO, random);
      return roundChoice(id, pathId, item.first, ['reads', 'a', 'book'], random, {
        raw: `Cümle hedefi: “${item.tr}”. Zorunlu ilk kelime?`,
        explanation: `SVO özne ile başlar → ${item.first}.`
      });
    },
    spot(id, pathId, random) {
      const item = pick(SVO, random);
      return roundChoice(id, pathId, item.bad, [join(item.tokens), 'She a book reads', 'OK'], random, {
        raw: `Hangisi SVO sırasını bozar? (Hedef: ${item.tr})`,
        explanation: `${item.bad} özne-fiil sırasını bozar.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(SVO, random);
      return roundChoice(id, pathId, join(item.tokens), [item.bad, 'book She reads a', 'a book She reads'], random, {
        raw: `Hangisi doğru SVO sırası?`,
        explanation: join(item.tokens)
      });
    }
  });
}

// ---- 2. esb-time-front ----
const TIME = [
  { tokens: ['Yesterday', 'we', 'visited', 'the', 'museum'], tr: 'Dün müzeyi ziyaret ettik', time: 'Yesterday', bad: 'we Yesterday visited the museum' },
  { tokens: ['Today', 'I', 'feel', 'happy'], tr: 'Bugün mutlu hissediyorum', time: 'Today', bad: 'I Today feel happy' },
  { tokens: ['Tomorrow', 'she', 'will', 'call', 'us'], tr: 'Yarın o bizi arayacak', time: 'Tomorrow', bad: 'she Tomorrow will call us' }
];

function familyTimeFront() {
  return buildFamily('esb-time-front', {
    select(id, pathId, random) {
      const item = pick(TIME, random);
      return roundWordOrder(id, pathId, item.tokens, item.tr, random, {
        raw: 'Zaman ifadesi önde olacak şekilde cümleyi kur.',
        strategy: 'Zaman kelimesini başa koy, sonra özne-fiil.',
        explanation: join(item.tokens)
      });
    },
    forced(id, pathId, random) {
      const item = pick(TIME, random);
      return roundChoice(id, pathId, item.time, ['we', 'visited', 'museum'], random, {
        raw: `Zaman-önde kuralı. Zorunlu ilk kelime? (${item.tr})`,
        explanation: item.time
      });
    },
    spot(id, pathId, random) {
      const item = pick(TIME, random);
      return roundChoice(id, pathId, item.bad, [join(item.tokens), 'OK-A', 'OK-B'], random, {
        raw: 'Hangisi zaman-önde kuralını bozar?',
        explanation: item.bad
      });
    },
    compare(id, pathId, random) {
      const item = pick(TIME, random);
      return roundChoice(id, pathId, join(item.tokens), [item.bad, 'visited Yesterday we the museum', 'the museum Yesterday we visited'], random, {
        raw: 'Doğru zaman-önde sıra hangisi?',
        explanation: join(item.tokens)
      });
    }
  });
}

// ---- 3. esb-question-aux ----
const QAUX = [
  { tokens: ['Do', 'you', 'like', 'tea'], tr: 'Çay sever misin?', aux: 'Do', bad: 'You do like tea' },
  { tokens: ['Does', 'he', 'play', 'chess'], tr: 'O satranç oynar mı?', aux: 'Does', bad: 'He does play chess' },
  { tokens: ['Can', 'they', 'swim', 'well'], tr: 'İyi yüzebilirler mi?', aux: 'Can', bad: 'They can swim well' }
];

function familyQuestionAux() {
  return buildFamily('esb-question-aux', {
    select(id, pathId, random) {
      const item = pick(QAUX, random);
      return roundWordOrder(id, pathId, item.tokens, item.tr, random, {
        raw: 'Yardımcı fiilli soru sırasını kur (aux + özne + fiil…).',
        strategy: 'Önce yardımcı/modal, sonra özne.',
        explanation: join(item.tokens)
      });
    },
    forced(id, pathId, random) {
      const item = pick(QAUX, random);
      return roundChoice(id, pathId, item.aux, ['you', 'like', 'tea'], random, {
        raw: `Soru sırası. Zorunlu ilk yardımcı? (${item.tr})`,
        explanation: item.aux
      });
    },
    spot(id, pathId, random) {
      const item = pick(QAUX, random);
      return roundChoice(id, pathId, item.bad, [join(item.tokens), 'Like you do tea', 'OK'], random, {
        raw: 'Hangisi soru sırasını bozar (düz cümle gibi)?',
        explanation: item.bad
      });
    },
    compare(id, pathId, random) {
      const item = pick(QAUX, random);
      return roundChoice(id, pathId, join(item.tokens), [item.bad, 'like Do you tea', 'tea Do you like'], random, {
        raw: 'Doğru soru sırası hangisi?',
        explanation: join(item.tokens)
      });
    }
  });
}

// ---- 4. esb-negation ----
const NEG = [
  { tokens: ['I', 'do', 'not', 'like', 'noise'], tr: 'Gürültü sevmem', marker: 'not', bad: 'I not do like noise' },
  { tokens: ['She', 'does', 'not', 'eat', 'meat'], tr: 'O et yemez', marker: 'not', bad: 'She not does eat meat' },
  { tokens: ['They', 'are', 'not', 'ready'], tr: 'Onlar hazır değil', marker: 'not', bad: 'They not are ready' }
];

function familyNegation() {
  return buildFamily('esb-negation', {
    select(id, pathId, random) {
      const item = pick(NEG, random);
      return roundWordOrder(id, pathId, item.tokens, item.tr, random, {
        raw: 'Olumsuz cümleyi doğru sırayla kur (do/does/are + not).',
        strategy: 'Yardımcıdan hemen sonra not koy.',
        explanation: join(item.tokens)
      });
    },
    forced(id, pathId, random) {
      const item = pick(NEG, random);
      return roundChoice(id, pathId, item.marker, ['I', 'like', 'noise'], random, {
        raw: `Olumsuzluk işaretçisi zorunlu hangisi? (${item.tr})`,
        explanation: 'not'
      });
    },
    spot(id, pathId, random) {
      const item = pick(NEG, random);
      return roundChoice(id, pathId, item.bad, [join(item.tokens), 'OK-1', 'OK-2'], random, {
        raw: 'Hangisi olumsuzluk yerini bozar?',
        explanation: item.bad
      });
    },
    compare(id, pathId, random) {
      const item = pick(NEG, random);
      return roundChoice(id, pathId, join(item.tokens), [item.bad, 'not I do like noise', 'I like not do noise'], random, {
        raw: 'Doğru olumsuz sıra hangisi?',
        explanation: join(item.tokens)
      });
    }
  });
}

// ---- 5. esb-adj-noun ----
const ADJ = [
  { tokens: ['She', 'has', 'a', 'red', 'bag'], tr: 'Onun kırmızı bir çantası var', adj: 'red', noun: 'bag', bad: 'She has a bag red' },
  { tokens: ['I', 'see', 'a', 'big', 'dog'], tr: 'Büyük bir köpek görüyorum', adj: 'big', noun: 'dog', bad: 'I see a dog big' },
  { tokens: ['He', 'bought', 'new', 'shoes'], tr: 'O yeni ayakkabı aldı', adj: 'new', noun: 'shoes', bad: 'He bought shoes new' }
];

function familyAdjNoun() {
  return buildFamily('esb-adj-noun', {
    select(id, pathId, random) {
      const item = pick(ADJ, random);
      return roundWordOrder(id, pathId, item.tokens, item.tr, random, {
        raw: 'Sıfat isimden önce gelecek şekilde cümleyi kur.',
        strategy: 'adj + noun sırasını bozma.',
        explanation: join(item.tokens)
      });
    },
    forced(id, pathId, random) {
      const item = pick(ADJ, random);
      return roundChoice(id, pathId, `${item.adj} ${item.noun}`, [`${item.noun} ${item.adj}`, item.noun, item.adj], random, {
        raw: `Sıfat-isim çifti zorunlu hangisi? (${item.tr})`,
        explanation: `${item.adj} ${item.noun}`
      });
    },
    spot(id, pathId, random) {
      const item = pick(ADJ, random);
      return roundChoice(id, pathId, item.bad, [join(item.tokens), 'OK-A', 'OK-B'], random, {
        raw: 'Hangisi sıfat-isim sırasını bozar?',
        explanation: item.bad
      });
    },
    compare(id, pathId, random) {
      const item = pick(ADJ, random);
      return roundChoice(id, pathId, join(item.tokens), [item.bad, 'red a She has bag', 'bag red a She has'], random, {
        raw: 'Doğru sıfat-isim sırası hangisi?',
        explanation: join(item.tokens)
      });
    }
  });
}

// ---- 6. esb-prep-phrase ----
const PREP = [
  { tokens: ['The', 'cat', 'is', 'on', 'the', 'table'], tr: 'Kedi masanın üstünde', prep: 'on', bad: 'The cat is the table on' },
  { tokens: ['We', 'live', 'in', 'a', 'small', 'city'], tr: 'Küçük bir şehirde yaşıyoruz', prep: 'in', bad: 'We live a small city in' },
  { tokens: ['Put', 'the', 'book', 'under', 'the', 'desk'], tr: 'Kitabı masanın altına koy', prep: 'under', bad: 'Put the book the desk under' }
];

function familyPrep() {
  return buildFamily('esb-prep-phrase', {
    select(id, pathId, random) {
      const item = pick(PREP, random);
      return roundWordOrder(id, pathId, item.tokens, item.tr, random, {
        raw: 'Edat öbeğini doğru sırayla kur (prep + article + noun).',
        strategy: 'Edatı nesneden önce yerleştir.',
        explanation: join(item.tokens)
      });
    },
    forced(id, pathId, random) {
      const item = pick(PREP, random);
      return roundChoice(id, pathId, item.prep, ['the', 'cat', 'table'], random, {
        raw: `Edat zorunlu hangisi? (${item.tr})`,
        explanation: item.prep
      });
    },
    spot(id, pathId, random) {
      const item = pick(PREP, random);
      return roundChoice(id, pathId, item.bad, [join(item.tokens), 'OK-1', 'OK-2'], random, {
        raw: 'Hangisi edat sırasını bozar?',
        explanation: item.bad
      });
    },
    compare(id, pathId, random) {
      const item = pick(PREP, random);
      return roundChoice(id, pathId, join(item.tokens), [item.bad, 'on is The cat the table', 'table on the The cat is'], random, {
        raw: 'Doğru edatlı sıra hangisi?',
        explanation: join(item.tokens)
      });
    }
  });
}

// ---- 7. esb-connector-clause ----
const CONN = [
  { tokens: ['I', 'was', 'tired', 'but', 'I', 'finished', 'my', 'homework'], tr: 'Yorgundum ama ödevimi bitirdim', conn: 'but', bad: 'I was tired I finished but my homework' },
  { tokens: ['She', 'studied', 'hard', 'so', 'she', 'passed'], tr: 'Çok çalıştı bu yüzden geçti', conn: 'so', bad: 'She studied hard she passed so' },
  { tokens: ['We', 'can', 'go', 'if', 'it', 'is', 'sunny'], tr: 'Güneşliyse gidebiliriz', conn: 'if', bad: 'We can go it is sunny if' }
];

function familyConnector() {
  return buildFamily('esb-connector-clause', {
    select(id, pathId, random) {
      const item = pick(CONN, random);
      return roundWordOrder(id, pathId, item.tokens, item.tr, random, {
        raw: 'Bağlaçlı cümleyi doğru sırayla kur.',
        strategy: 'İki yan cümleyi bağlaçla birleştir; bağlacı ortadan koparma.',
        explanation: join(item.tokens)
      });
    },
    forced(id, pathId, random) {
      const item = pick(CONN, random);
      return roundChoice(id, pathId, item.conn, ['I', 'was', 'tired'], random, {
        raw: `Zorunlu bağlaç hangisi? (${item.tr})`,
        explanation: item.conn
      });
    },
    spot(id, pathId, random) {
      const item = pick(CONN, random);
      return roundChoice(id, pathId, item.bad, [join(item.tokens), 'OK-A', 'OK-B'], random, {
        raw: 'Hangisi bağlaç sırasını bozar?',
        explanation: item.bad
      });
    },
    compare(id, pathId, random) {
      const item = pick(CONN, random);
      return roundChoice(id, pathId, join(item.tokens), [item.bad, 'but I was tired I finished my homework', 'finished but I was tired I my homework'], random, {
        raw: 'Doğru bağlaçlı sıra hangisi?',
        explanation: join(item.tokens)
      });
    }
  });
}

// ---- 8. esb-modal-verb ----
const MODAL = [
  { tokens: ['You', 'must', 'wear', 'a', 'helmet'], tr: 'Kask takmalısın', modal: 'must', bad: 'You wear must a helmet' },
  { tokens: ['She', 'can', 'speak', 'English'], tr: 'O İngilizce konuşabilir', modal: 'can', bad: 'She speak can English' },
  { tokens: ['We', 'should', 'help', 'them'], tr: 'Onlara yardım etmeliyiz', modal: 'should', bad: 'We help should them' }
];

function familyModal() {
  return buildFamily('esb-modal-verb', {
    select(id, pathId, random) {
      const item = pick(MODAL, random);
      return roundWordOrder(id, pathId, item.tokens, item.tr, random, {
        raw: 'Modal + V1 sırasını kur.',
        strategy: 'Modalden sonra yalın fiil gelir.',
        explanation: join(item.tokens)
      });
    },
    forced(id, pathId, random) {
      const item = pick(MODAL, random);
      return roundChoice(id, pathId, item.modal, ['wear', 'helmet', 'You'], random, {
        raw: `Zorunlu modal hangisi? (${item.tr})`,
        explanation: item.modal
      });
    },
    spot(id, pathId, random) {
      const item = pick(MODAL, random);
      return roundChoice(id, pathId, item.bad, [join(item.tokens), 'OK-1', 'OK-2'], random, {
        raw: 'Hangisi modal+V1 sırasını bozar?',
        explanation: item.bad
      });
    },
    compare(id, pathId, random) {
      const item = pick(MODAL, random);
      return roundChoice(id, pathId, join(item.tokens), [item.bad, 'must You wear a helmet', 'wear You must a helmet'], random, {
        raw: 'Doğru modal sırası hangisi?',
        explanation: join(item.tokens)
      });
    }
  });
}

// ---- 9. esb-there-be ----
const THERE = [
  { tokens: ['There', 'is', 'a', 'book', 'on', 'the', 'desk'], tr: 'Masada bir kitap var', head: 'There', bad: 'A book there is on the desk' },
  { tokens: ['There', 'are', 'two', 'cats', 'here'], tr: 'Burada iki kedi var', head: 'There', bad: 'Two cats there are here' },
  { tokens: ['There', 'is', 'milk', 'in', 'the', 'fridge'], tr: 'Buzdolabında süt var', head: 'There', bad: 'Milk there is in the fridge' }
];

function familyThereBe() {
  return buildFamily('esb-there-be', {
    select(id, pathId, random) {
      const item = pick(THERE, random);
      return roundWordOrder(id, pathId, item.tokens, item.tr, random, {
        raw: 'There is/are yapısını doğru sırayla kur.',
        strategy: 'There + is/are ile başla.',
        explanation: join(item.tokens)
      });
    },
    forced(id, pathId, random) {
      const item = pick(THERE, random);
      return roundChoice(id, pathId, item.head, ['book', 'desk', 'is'], random, {
        raw: `There-be. Zorunlu ilk kelime? (${item.tr})`,
        explanation: 'There'
      });
    },
    spot(id, pathId, random) {
      const item = pick(THERE, random);
      return roundChoice(id, pathId, item.bad, [join(item.tokens), 'OK-A', 'OK-B'], random, {
        raw: 'Hangisi there-be sırasını bozar?',
        explanation: item.bad
      });
    },
    compare(id, pathId, random) {
      const item = pick(THERE, random);
      return roundChoice(id, pathId, join(item.tokens), [item.bad, 'is There a book on the desk', 'on the desk There is a book'], random, {
        raw: 'Doğru there-be sırası hangisi?',
        explanation: join(item.tokens)
      });
    }
  });
}

// ---- 10. esb-imperative ----
const IMP = [
  { tokens: ['Open', 'the', 'window', 'please'], tr: 'Lütfen pencereyi aç', verb: 'Open', bad: 'The window open please' },
  { tokens: ['Wash', 'your', 'hands'], tr: 'Ellerini yıka', verb: 'Wash', bad: 'Your hands wash' },
  { tokens: ['Listen', 'to', 'the', 'teacher'], tr: 'Öğretmeni dinle', verb: 'Listen', bad: 'To the teacher listen' }
];

function familyImperative() {
  return buildFamily('esb-imperative', {
    select(id, pathId, random) {
      const item = pick(IMP, random);
      return roundWordOrder(id, pathId, item.tokens, item.tr, random, {
        raw: 'Emir cümlesini fiille başlayarak kur.',
        strategy: 'Özne yok; fiil başta.',
        explanation: join(item.tokens)
      });
    },
    forced(id, pathId, random) {
      const item = pick(IMP, random);
      return roundChoice(id, pathId, item.verb, ['the', 'window', 'please'], random, {
        raw: `Emir. Zorunlu ilk fiil? (${item.tr})`,
        explanation: item.verb
      });
    },
    spot(id, pathId, random) {
      const item = pick(IMP, random);
      return roundChoice(id, pathId, item.bad, [join(item.tokens), 'OK-1', 'OK-2'], random, {
        raw: 'Hangisi emir sırasını bozar?',
        explanation: item.bad
      });
    },
    compare(id, pathId, random) {
      const item = pick(IMP, random);
      return roundChoice(id, pathId, join(item.tokens), [item.bad, 'please Open the window', 'window the Open please'], random, {
        raw: 'Doğru emir sırası hangisi?',
        explanation: join(item.tokens)
      });
    }
  });
}

// ---- 11. esb-pronoun-object ----
const PRON = [
  { tokens: ['Please', 'give', 'me', 'the', 'book'], tr: 'Lütfen bana kitabı ver', obj: 'me', bad: 'Please give the book me' },
  { tokens: ['She', 'told', 'us', 'a', 'story'], tr: 'Bize bir hikâye anlattı', obj: 'us', bad: 'She told a story us' },
  { tokens: ['Can', 'you', 'help', 'him'], tr: 'Ona yardım edebilir misin?', obj: 'him', bad: 'Can you him help' }
];

function familyPronounObject() {
  return buildFamily('esb-pronoun-object', {
    select(id, pathId, random) {
      const item = pick(PRON, random);
      return roundWordOrder(id, pathId, item.tokens, item.tr, random, {
        raw: 'Nesne zamirini fiilden hemen sonra koyarak kur.',
        strategy: 'V + object pronoun (+ noun).',
        explanation: join(item.tokens)
      });
    },
    forced(id, pathId, random) {
      const item = pick(PRON, random);
      return roundChoice(id, pathId, item.obj, ['book', 'Please', 'give'], random, {
        raw: `Nesne zamiri zorunlu hangisi? (${item.tr})`,
        explanation: item.obj
      });
    },
    spot(id, pathId, random) {
      const item = pick(PRON, random);
      return roundChoice(id, pathId, item.bad, [join(item.tokens), 'OK-A', 'OK-B'], random, {
        raw: 'Hangisi nesne zamiri sırasını bozar?',
        explanation: item.bad
      });
    },
    compare(id, pathId, random) {
      const item = pick(PRON, random);
      return roundChoice(id, pathId, join(item.tokens), [item.bad, 'give Please me the book', 'me Please give the book'], random, {
        raw: 'Doğru nesne zamiri sırası hangisi?',
        explanation: join(item.tokens)
      });
    }
  });
}

// ---- 12. esb-misorder-taxonomy ----
const MIS = [
  { text: 'Öğrenci “reads She a book” yazdı.', error: ESB_MISORDER.SVO },
  { text: 'Öğrenci soruda “You do like tea?” sırasını kullandı.', error: ESB_MISORDER.AUX },
  { text: 'Öğrenci “I not do like noise” yazdı.', error: ESB_MISORDER.NEG },
  { text: 'Öğrenci “a bag red” sırasını kullandı.', error: ESB_MISORDER.ADJ }
];

function familyMisorderTaxonomy() {
  return buildFamily('esb-misorder-taxonomy', {
    select(id, pathId, random) {
      const item = pick(SVO, random);
      return roundWordOrder(id, pathId, item.tokens, item.tr, random, {
        raw: 'Doğru sırayı kur; yanlış sıra türlerini aklında tut.',
        strategy: 'SVO / yardımcı / olumsuzluk / sıfat hatalarını ayrı kontrol et.',
        explanation: join(item.tokens)
      });
    },
    forced(id, pathId, random) {
      const s = pick(MIS, random);
      return roundChoice(id, pathId, s.error, Object.values(ESB_MISORDER).filter((e) => e !== s.error), random, {
        raw: `${s.text} Zorunlu yanlış-sıra etiketi?`,
        explanation: `→ ${s.error}`
      });
    },
    spot(id, pathId, random) {
      const s = pick(MIS, random);
      return roundChoice(id, pathId, s.error, shuffle(Object.values(ESB_MISORDER).filter((e) => e !== s.error), random).slice(0, 3), random, {
        raw: `Durum: ${s.text} Hangi yanlış sıra?`,
        explanation: s.error
      });
    },
    compare(id, pathId, random) {
      const a = pick(MIS, random);
      let b = pick(MIS, random);
      while (b.error === a.error) b = pick(MIS, random);
      const answer = `${a.error}|${b.error}`;
      const distractors = [
        `${b.error}|${a.error}`,
        `${ESB_MISORDER.SVO}|${ESB_MISORDER.SVO}`,
        `${ESB_MISORDER.ADJ}|${ESB_MISORDER.ADJ}`
      ].filter((x) => x !== answer);
      return roundChoice(id, pathId, answer, distractors.slice(0, 3), random, {
        raw: `A: ${a.text} · B: ${b.text}. Etiket çifti (A|B)?`,
        explanation: `A→${a.error}, B→${b.error}`
      });
    }
  });
}

export const ENGLISH_SENTENCE_BUILDER_FAMILIES = [
  familySvo(),
  familyTimeFront(),
  familyQuestionAux(),
  familyNegation(),
  familyAdjNoun(),
  familyPrep(),
  familyConnector(),
  familyModal(),
  familyThereBe(),
  familyImperative(),
  familyPronounObject(),
  familyMisorderTaxonomy()
];
