// Aşama 04 — religion-practice (Din Kültürü Öğrenme Alanı).
// UI: tüm iskeletler kind:'choice'.
// Aile = din kültürü düşüncesi (inanç/pratik, değer-durum, saygı, ibadet anlamı,
// ahlak, toplum rolü, sembol, metin-bağlam, empati, sorumluluk, kavram yanılgısı, yanlış okuma).
// Yüzey isim/yer değişimi ≠ yeni aile. Cevaplar kısa (answer_leak kapısı).

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
  return `religion-practice:${skeletonId}:${pathId}:${simpleHash(raw)}`;
}

const PATH_IDS = ['raw-letters', 'context-embedded', 'staged-strategy-hint'];

const TASK_TRAITS = {
  select: ['strategySelection', 'multiStepInference'],
  forced: ['informationLinking', 'conditionEvaluation'],
  spot: ['errorAnalysis', 'conditionEvaluation'],
  compare: ['strategySelection', 'usingIntermediateResultInNewDecision']
};

export const RP_MISREAD = {
  BELIEF: 'inanc-pratik-karisik',
  VALUE: 'deger-yok-sayma',
  RESPECT: 'saygi-ihlali',
  ETHICS: 'ahlak-tuzagi'
};

function pathWrap(pathId, rawPrompt, contextHint, strategyHint) {
  if (pathId === 'raw-letters') {
    return {
      prompt: rawPrompt,
      context: contextHint || 'Din kültürü düşünme türünü ayır; yüzey isim tuzağına düşme.'
    };
  }
  if (pathId === 'context-embedded') {
    return {
      prompt: `Din kültürü atölyesinde tartışılan bir örnek: ${rawPrompt}`,
      context: 'Senaryo süsünü ayıkla; yalnız kavram/değer ilişkisine odaklan.'
    };
  }
  return {
    prompt: `${strategyHint || 'Önce düşünme türünü belirle, sonra seçenekleri eleye.'} ${rawPrompt}`,
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

// ---- 1. rp-belief-practice ----
const BP = [
  { item: 'irade', answer: 'inanc-kavram', wrong: 'yemek-adi' },
  { item: 'namaz kilmak', answer: 'pratik', wrong: 'renk' },
  { item: 'tevekkul', answer: 'inanc-kavram', wrong: 'spor' },
  { item: 'sadaka vermek', answer: 'pratik', wrong: 'saka' }
];

function familyBeliefPractice() {
  return buildFamily('rp-belief-practice', {
    select(id, pathId, random) {
      const item = pick(BP, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'renk', 'saka'], random, {
        raw: `“${item.item}” inanç kavramı mı yoksa pratik/davranış mı?`,
        strategy: 'Kavram mı, yapılan eylem mi ayır.',
        explanation: `${item.item} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      return roundChoice(id, pathId, 'INANC-PRATIK', ['YUZET', 'RENK', 'YOK'], random, {
        raw: 'Bu ailenin zorunlu düşünme türü hangisi?',
        explanation: 'İnanç/pratik ayrımı.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(BP, random);
      return roundChoice(id, pathId, item.wrong, [item.answer, 'inanc-kavram', 'pratik'], random, {
        raw: `“${item.item}” için hangisi yanlış etiket tuzağıdır?`,
        explanation: item.wrong
      });
    },
    compare(id, pathId, random) {
      const item = pick(BP, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'renk', 'saka'], random, {
        raw: `Doğru sınıf hangisi? (${item.item})`,
        explanation: item.answer
      });
    }
  });
}

// ---- 2. rp-value-situation ----
const VS = [
  { sit: 'Hatasını kabul edip düzeltmek', value: 'sorumluluk', wrong: 'kibir' },
  { sit: 'Başkasının hakkını gözetmek', value: 'adalet', wrong: 'israf' },
  { sit: 'Gerekli çabayı gösterip sonucu Allah’a bırakmak', value: 'tevekkul', wrong: 'tembellik' },
  { sit: 'İhtiyaç sahibine yardım etmek', value: 'dayanisma', wrong: 'kibir' }
];

function familyValueSituation() {
  return buildFamily('rp-value-situation', {
    select(id, pathId, random) {
      const item = pick(VS, random);
      return roundChoice(id, pathId, item.value, [item.wrong, 'renk', 'saka'], random, {
        raw: `Durum: “${item.sit}”. Desteklenen değer hangisi?`,
        strategy: 'Davranışın taşıdığı değeri seç.',
        explanation: `${item.sit} → ${item.value}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(VS, random);
      return roundChoice(id, pathId, item.value, [item.wrong, 'renk', 'saka'], random, {
        raw: `Zorunlu değer etiketi? (${item.sit})`,
        explanation: item.value
      });
    },
    spot(id, pathId, random) {
      const item = pick(VS, random);
      return roundChoice(id, pathId, item.wrong, [item.value, 'adalet', 'sorumluluk'], random, {
        raw: `“${item.sit}” için hangisi değer tuzağıdır?`,
        explanation: item.wrong
      });
    },
    compare(id, pathId, random) {
      const item = pick(VS, random);
      return roundChoice(id, pathId, item.value, [item.wrong, 'renk', 'saka'], random, {
        raw: 'Doğru değer hangisi?',
        explanation: item.value
      });
    }
  });
}

// ---- 3. rp-respect-diversity ----
const RD = [
  { act: 'Farklı inançlara saygılı konuşmak', answer: 'saygi', wrong: 'alay' },
  { act: 'Başkasının ibadetine engel olmak', answer: 'ihlal', wrong: 'saygi' },
  { act: 'Ortak yaşamda nezaket göstermek', answer: 'saygi', wrong: 'dislama' },
  { act: 'İnanç farkını küçümsemek', answer: 'ihlal', wrong: 'saygi' }
];

function familyRespectDiversity() {
  return buildFamily('rp-respect-diversity', {
    select(id, pathId, random) {
      const item = pick(RD, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'renk', 'saka'], random, {
        raw: `“${item.act}” saygı mı ihlal mi?`,
        strategy: 'Çeşitliliğe saygı ölçütünü uygula.',
        explanation: `${item.act} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      return roundChoice(id, pathId, 'SAYGI', ['ALAY', 'RENK', 'YOK'], random, {
        raw: 'Bu ailenin zorunlu hedef değeri hangisi?',
        explanation: 'Saygı/çeşitlilik.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(RD.filter((x) => x.answer === 'ihlal'), random);
      return roundChoice(id, pathId, item.act, ['Farklı inançlara saygılı konuşmak', 'Nezaket göstermek', 'Dinlemek'], random, {
        raw: 'Hangisi saygı ihlalidir?',
        explanation: item.act
      });
    },
    compare(id, pathId, random) {
      const item = pick(RD, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'renk', 'saka'], random, {
        raw: `Doğru etiket? (${item.act})`,
        explanation: item.answer
      });
    }
  });
}

// ---- 4. rp-ritual-meaning ----
const RM = [
  { ritual: 'zekat', meaning: 'dayanisma', wrong: 'israf' },
  { ritual: 'namaz', meaning: 'ibadet-duzen', wrong: 'oyun' },
  { ritual: 'oruc', meaning: 'ozdenetim', wrong: 'israf' },
  { ritual: 'dua', meaning: 'yonelis', wrong: 'alay' }
];

function familyRitualMeaning() {
  return buildFamily('rp-ritual-meaning', {
    select(id, pathId, random) {
      const item = pick(RM, random);
      return roundChoice(id, pathId, item.meaning, [item.wrong, 'renk', 'saka'], random, {
        raw: `“${item.ritual}” ile en güçlü ilişkili anlam hangisi?`,
        strategy: 'Biçimi değil anlamı seç.',
        explanation: `${item.ritual} → ${item.meaning}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(RM, random);
      return roundChoice(id, pathId, item.meaning, [item.wrong, 'renk', 'saka'], random, {
        raw: `Zorunlu anlam? (${item.ritual})`,
        explanation: item.meaning
      });
    },
    spot(id, pathId, random) {
      const item = pick(RM, random);
      return roundChoice(id, pathId, item.wrong, [item.meaning, 'dayanisma', 'ozdenetim'], random, {
        raw: `“${item.ritual}” için hangisi yanlış anlam tuzağıdır?`,
        explanation: item.wrong
      });
    },
    compare(id, pathId, random) {
      const item = pick(RM, random);
      return roundChoice(id, pathId, item.meaning, [item.wrong, 'renk', 'saka'], random, {
        raw: 'Doğru anlam hangisi?',
        explanation: item.meaning
      });
    }
  });
}

// ---- 5. rp-ethics-choice ----
const EC = [
  { choice: 'Gıybet etmek', answer: 'yanlis', right: 'Susturmak/uzaklaşmak' },
  { choice: 'Emaneti korumak', answer: 'dogru', right: 'Emaneti korumak' },
  { choice: 'Kul hakkına dikkat etmek', answer: 'dogru', right: 'Kul hakkına dikkat' },
  { choice: 'Dedikodu yaymak', answer: 'yanlis', right: 'Doğru bilgiyle susmak' }
];

function familyEthicsChoice() {
  return buildFamily('rp-ethics-choice', {
    select(id, pathId, random) {
      const item = pick(EC, random);
      return roundChoice(id, pathId, item.answer, [item.answer === 'dogru' ? 'yanlis' : 'dogru', 'renk', 'saka'], random, {
        raw: `“${item.choice}” ahlaki olarak doğru mu yanlış mı?`,
        strategy: 'Başkasına zarar / hak ihlali ölçütünü kullan.',
        explanation: `${item.choice} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      return roundChoice(id, pathId, 'AHLAK', ['RENK', 'YUZET', 'YOK'], random, {
        raw: 'Bu ailenin zorunlu düşünme türü?',
        explanation: 'Ahlaki seçim.'
      });
    },
    spot(id, pathId, random) {
      const bad = pick(EC.filter((x) => x.answer === 'yanlis'), random);
      return roundChoice(id, pathId, bad.choice, ['Emaneti korumak', 'Kul hakkına dikkat', 'Yardım etmek'], random, {
        raw: 'Hangisi ahlaki olarak sorunlu davranıştır?',
        explanation: bad.choice
      });
    },
    compare(id, pathId, random) {
      const item = pick(EC, random);
      return roundChoice(id, pathId, item.answer, ['renk', 'saka', item.answer === 'dogru' ? 'yanlis' : 'dogru'], random, {
        raw: `Doğru etik etiket? (${item.choice})`,
        explanation: item.answer
      });
    }
  });
}

// ---- 6. rp-community-role ----
const CR = [
  { role: 'İstişare yapmak', answer: 'ortak-karar', wrong: 'tekbasina-zor' },
  { role: 'Zekât ile dayanışma', answer: 'toplumsal-destek', wrong: 'yalnizlasma' },
  { role: 'Komşuya zarar vermemek', answer: 'huzur', wrong: 'kargaşa' },
  { role: 'Yardımlaşma', answer: 'dayanisma', wrong: 'rekabet-kirici' }
];

function familyCommunityRole() {
  return buildFamily('rp-community-role', {
    select(id, pathId, random) {
      const item = pick(CR, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'renk', 'saka'], random, {
        raw: `“${item.role}” toplumda hangi role/sonuca hizmet eder?`,
        strategy: 'Bireysel değil toplumsal etkiyi seç.',
        explanation: `${item.role} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(CR, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'renk', 'saka'], random, {
        raw: `Zorunlu toplumsal sonuç? (${item.role})`,
        explanation: item.answer
      });
    },
    spot(id, pathId, random) {
      const item = pick(CR, random);
      return roundChoice(id, pathId, item.wrong, [item.answer, 'dayanisma', 'huzur'], random, {
        raw: `“${item.role}” için hangisi yanlış sonuç tuzağıdır?`,
        explanation: item.wrong
      });
    },
    compare(id, pathId, random) {
      const item = pick(CR, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'renk', 'saka'], random, {
        raw: 'Doğru toplumsal rol hangisi?',
        explanation: item.answer
      });
    }
  });
}

// ---- 7. rp-symbol-meaning ----
const SM = [
  { symbol: 'El-Emin', meaning: 'guvenilirlik', wrong: 'zenginlik' },
  { symbol: 'meal', meaning: 'anlam-aktarimi', wrong: 'ezber-zorun' },
  { symbol: 'Kur’an rehberliği', meaning: 'dogru-yol', wrong: 'oyun-kitabi' },
  { symbol: 'emanet', meaning: 'sorumluluk', wrong: 'israf' }
];

function familySymbolMeaning() {
  return buildFamily('rp-symbol-meaning', {
    select(id, pathId, random) {
      const item = pick(SM, random);
      return roundChoice(id, pathId, item.meaning, [item.wrong, 'renk', 'saka'], random, {
        raw: `“${item.symbol}” en çok hangi anlamı taşır?`,
        strategy: 'Sembol/kavramın öz anlamını seç.',
        explanation: `${item.symbol} → ${item.meaning}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(SM, random);
      return roundChoice(id, pathId, item.meaning, [item.wrong, 'renk', 'saka'], random, {
        raw: `Zorunlu anlam? (${item.symbol})`,
        explanation: item.meaning
      });
    },
    spot(id, pathId, random) {
      const item = pick(SM, random);
      return roundChoice(id, pathId, item.wrong, [item.meaning, 'guvenilirlik', 'sorumluluk'], random, {
        raw: `“${item.symbol}” için hangisi yanlış anlamdır?`,
        explanation: item.wrong
      });
    },
    compare(id, pathId, random) {
      const item = pick(SM, random);
      return roundChoice(id, pathId, item.meaning, [item.wrong, 'renk', 'saka'], random, {
        raw: 'Doğru sembol anlamı hangisi?',
        explanation: item.meaning
      });
    }
  });
}

// ---- 8. rp-text-context ----
const TC = [
  { claim: 'Kur’an’ın temel amacı doğru yolu göstermektir', answer: 'destekli', wrong: 'yalan' },
  { claim: 'Tevekkül çabasız beklemektir', answer: 'yanlis-okuma', wrong: 'destekli' },
  { claim: 'Sadaka yalnız para ile olur', answer: 'yanlis-okuma', wrong: 'destekli' },
  { claim: 'İrade seçim gücüdür', answer: 'destekli', wrong: 'yalan' }
];

function familyTextContext() {
  return buildFamily('rp-text-context', {
    select(id, pathId, random) {
      const item = pick(TC, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'renk', 'saka'], random, {
        raw: `İfade: “${item.claim}”. Metin-bağlam açısından etiket?`,
        strategy: 'Kavramın doğru tanımına göre destekli / yanlış-okuma ayır.',
        explanation: `${item.claim} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      return roundChoice(id, pathId, 'METIN-BAGLAM', ['RENK', 'YUZET', 'YOK'], random, {
        raw: 'Bu ailenin zorunlu düşünme türü?',
        explanation: 'Metin-bağlam.'
      });
    },
    spot(id, pathId, random) {
      const bad = pick(TC.filter((x) => x.answer === 'yanlis-okuma'), random);
      return roundChoice(id, pathId, bad.claim, ['İrade seçim gücüdür', 'Kur’an doğru yolu gösterir', 'Emaneti korumak sorumluluktur'], random, {
        raw: 'Hangisi yanlış okuma / hatalı tanımdır?',
        explanation: bad.claim
      });
    },
    compare(id, pathId, random) {
      const item = pick(TC, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'renk', 'saka'], random, {
        raw: 'Doğru etiket hangisi?',
        explanation: item.answer
      });
    }
  });
}

// ---- 9. rp-empathy-perspective ----
const EP = [
  { sit: 'Arkadaşının üzüntüsünü dinlemek', answer: 'empati', wrong: 'alay' },
  { sit: 'Başkasının hatasını herkese anlatmak', answer: 'zarar', wrong: 'empati' },
  { sit: 'Özür dilemek', answer: 'empati', wrong: 'kibir' },
  { sit: 'İhtiyacı olanı küçümsemek', answer: 'zarar', wrong: 'empati' }
];

function familyEmpathy() {
  return buildFamily('rp-empathy-perspective', {
    select(id, pathId, random) {
      const item = pick(EP, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'renk', 'saka'], random, {
        raw: `“${item.sit}” empati mi zarar mı?`,
        strategy: 'Karşı tarafın duygusunu gözetmeyi ölç.',
        explanation: `${item.sit} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      return roundChoice(id, pathId, 'EMPATI', ['ALAY', 'RENK', 'YOK'], random, {
        raw: 'Bu ailenin zorunlu hedefi?',
        explanation: 'Empati/bakış.'
      });
    },
    spot(id, pathId, random) {
      const bad = pick(EP.filter((x) => x.answer === 'zarar'), random);
      return roundChoice(id, pathId, bad.sit, ['Arkadaşının üzüntüsünü dinlemek', 'Özür dilemek', 'Yardım etmek'], random, {
        raw: 'Hangisi empatiye aykırıdır?',
        explanation: bad.sit
      });
    },
    compare(id, pathId, random) {
      const item = pick(EP, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'renk', 'saka'], random, {
        raw: 'Doğru etiket hangisi?',
        explanation: item.answer
      });
    }
  });
}

// ---- 10. rp-responsibility-faith ----
const RF = [
  { act: 'Trafik kurallarına uymak', answer: 'can-koruma', wrong: 'israf' },
  { act: 'Emaneti geciktirmek', answer: 'ihlal', wrong: 'sorumluluk' },
  { act: 'Çaba gösterip tevekkül etmek', answer: 'sorumluluk', wrong: 'tembellik' },
  { act: 'İsraf etmek', answer: 'ihlal', wrong: 'sorumluluk' }
];

function familyResponsibility() {
  return buildFamily('rp-responsibility-faith', {
    select(id, pathId, random) {
      const item = pick(RF, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'renk', 'saka'], random, {
        raw: `“${item.act}” sorumluluk açısından etiket?`,
        strategy: 'Koruma / ihlal ayrımını yap.',
        explanation: `${item.act} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      return roundChoice(id, pathId, 'SORUMLULUK', ['ISRAF', 'RENK', 'YOK'], random, {
        raw: 'Bu ailenin zorunlu düşünme türü?',
        explanation: 'Sorumluluk.'
      });
    },
    spot(id, pathId, random) {
      const bad = pick(RF.filter((x) => x.answer === 'ihlal'), random);
      return roundChoice(id, pathId, bad.act, ['Trafik kurallarına uymak', 'Çaba gösterip tevekkül etmek', 'Emaneti korumak'], random, {
        raw: 'Hangisi sorumluluk ihlalidir?',
        explanation: bad.act
      });
    },
    compare(id, pathId, random) {
      const item = pick(RF, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'renk', 'saka'], random, {
        raw: 'Doğru etiket hangisi?',
        explanation: item.answer
      });
    }
  });
}

// ---- 11. rp-misconception-fix ----
const MC = [
  { myth: 'Tevekkül = çabasız beklemek', truth: 'caba+guven', wrong: 'tembellik-iyi' },
  { myth: 'Sadaka yalnız paradır', truth: 'iyilik-genis', wrong: 'sadece-para' },
  { myth: 'İrade yoktur', truth: 'irade-var', wrong: 'zorunluluk-tek' },
  { myth: 'Gıybet zararsızdır', truth: 'giybet-zarar', wrong: 'zararsiz' }
];

function familyMisconception() {
  return buildFamily('rp-misconception-fix', {
    select(id, pathId, random) {
      const item = pick(MC, random);
      return roundChoice(id, pathId, item.truth, [item.wrong, 'renk', 'saka'], random, {
        raw: `Yanlış kanı: “${item.myth}”. Doğru düzeltme etiketi?`,
        strategy: 'Yaygın yanılgıyı doğru kavramla değiştir.',
        explanation: `${item.myth} → ${item.truth}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(MC, random);
      return roundChoice(id, pathId, item.truth, [item.wrong, 'renk', 'saka'], random, {
        raw: `Zorunlu doğru etiket? (${item.myth})`,
        explanation: item.truth
      });
    },
    spot(id, pathId, random) {
      const item = pick(MC, random);
      return roundChoice(id, pathId, item.myth, ['İrade seçim gücüdür', 'Sadaka iyiliği kapsar', 'Tevekkül çaba ister'], random, {
        raw: 'Hangisi yaygın kavram yanılgısıdır?',
        explanation: item.myth
      });
    },
    compare(id, pathId, random) {
      const item = pick(MC, random);
      return roundChoice(id, pathId, item.truth, [item.wrong, 'renk', 'saka'], random, {
        raw: 'Doğru düzeltme hangisi?',
        explanation: item.truth
      });
    }
  });
}

// ---- 12. rp-misread-taxonomy ----
const MIS = [
  { text: 'Öğrenci namazı “oyun” sandı.', error: RP_MISREAD.BELIEF },
  { text: 'Öğrenci adaleti yok sayıp kul hakkını önemsiz gördü.', error: RP_MISREAD.VALUE },
  { text: 'Öğrenci farklı inanca alay etti.', error: RP_MISREAD.RESPECT },
  { text: 'Öğrenci gıybeti zararsız sandı.', error: RP_MISREAD.ETHICS }
];

function familyMisreadTaxonomy() {
  return buildFamily('rp-misread-taxonomy', {
    select(id, pathId, random) {
      const item = pick(VS, random);
      return roundChoice(id, pathId, item.value, [item.wrong, 'renk', 'saka'], random, {
        raw: `Durum: “${item.sit}”. Doğru değeri seç (yanlış okuma türlerini aklında tut).`,
        strategy: 'İnanç/pratik, değer, saygı ve ahlak hatalarını ayrı kontrol et.',
        explanation: item.value
      });
    },
    forced(id, pathId, random) {
      const s = pick(MIS, random);
      return roundChoice(id, pathId, s.error, Object.values(RP_MISREAD).filter((e) => e !== s.error), random, {
        raw: `${s.text} Zorunlu yanlış-okuma etiketi?`,
        explanation: `→ ${s.error}`
      });
    },
    spot(id, pathId, random) {
      const s = pick(MIS, random);
      return roundChoice(id, pathId, s.error, shuffle(Object.values(RP_MISREAD).filter((e) => e !== s.error), random).slice(0, 3), random, {
        raw: `Durum: ${s.text} Hangi yanlış okuma?`,
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
        `${RP_MISREAD.BELIEF}|${RP_MISREAD.BELIEF}`,
        `${RP_MISREAD.ETHICS}|${RP_MISREAD.ETHICS}`
      ].filter((x) => x !== answer);
      return roundChoice(id, pathId, answer, distractors.slice(0, 3), random, {
        raw: `A: ${a.text} · B: ${b.text}. Etiket çifti (A|B)?`,
        explanation: `A→${a.error}, B→${b.error}`
      });
    }
  });
}

export const RELIGION_PRACTICE_FAMILIES = [
  familyBeliefPractice(),
  familyValueSituation(),
  familyRespectDiversity(),
  familyRitualMeaning(),
  familyEthicsChoice(),
  familyCommunityRole(),
  familySymbolMeaning(),
  familyTextContext(),
  familyEmpathy(),
  familyResponsibility(),
  familyMisconception(),
  familyMisreadTaxonomy()
];
