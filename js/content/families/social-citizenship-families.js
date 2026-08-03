// Aşama 04 — social-citizenship (Vatandaşlık).
// UI: tüm iskeletler kind:'choice'.
// Aile = vatandaşlık düşüncesi (hak/ödev, hukuk, kamu hizmeti, katılım, eşitlik,
// sorumluluk, çatışma, medya, çevre, yerel-küresel, dijital, yanlış okuma).
// Yüzey kişi/yer değişimi ≠ yeni aile. Cevaplar kısa (answer_leak kapısı).

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
  return `social-citizenship:${skeletonId}:${pathId}:${simpleHash(raw)}`;
}

const PATH_IDS = ['raw-letters', 'context-embedded', 'staged-strategy-hint'];

const TASK_TRAITS = {
  select: ['strategySelection', 'multiStepInference'],
  forced: ['informationLinking', 'conditionEvaluation'],
  spot: ['errorAnalysis', 'conditionEvaluation'],
  compare: ['strategySelection', 'usingIntermediateResultInNewDecision']
};

export const SC_MISREAD = {
  RIGHT: 'hak-odev-karisik',
  LAW: 'hukuk-yok-sayma',
  EQ: 'esitlik-ihlali',
  MEDIA: 'medya-tuzagi'
};

function pathWrap(pathId, rawPrompt, contextHint, strategyHint) {
  if (pathId === 'raw-letters') {
    return {
      prompt: rawPrompt,
      context: contextHint || 'Vatandaşlık düşünme türünü ayır; yüzey isim tuzağına düşme.'
    };
  }
  if (pathId === 'context-embedded') {
    return {
      prompt: `Vatandaşlık atölyesinde tartışılan bir örnek: ${rawPrompt}`,
      context: 'Senaryo süsünü ayıkla; yalnız hak/ödev/kural ilişkisine odaklan.'
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

// ---- 1. sc-rights-duties ----
const RD = [
  { act: 'okula gitmek', answer: 'odev', wrong: 'keyfi-hak' },
  { act: 'düşünceyi açıklamak', answer: 'hak', wrong: 'ceza' },
  { act: 'vergi ödemek', answer: 'odev', wrong: 'hediye' },
  { act: 'güvenli yaşamak', answer: 'hak', wrong: 'luks' }
];

function familyRightsDuties() {
  return buildFamily('sc-rights-duties', {
    select(id, pathId, random) {
      const item = pick(RD, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'renk', 'şaka'], random, {
        raw: `“${item.act}” hak mı ödev mi?`,
        strategy: 'İstenebilir koruma mı, yerine getirilmesi gereken mi ayır.',
        explanation: `${item.act} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(RD, random);
      return roundChoice(id, pathId, 'ayrim', ['rastgele', 'renk', 'şarkı'], random, {
        raw: `“${item.act}” için zorunlu işlem hangisidir?`,
        explanation: 'Hak/ödev ayrımı zorunludur.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(RD, random);
      return roundChoice(id, pathId, item.wrong, [item.answer, 'doğru etiket', 'ayrım'], random, {
        raw: `“${item.act}” için hangisi hak/ödev ihlalidir?`,
        explanation: `${item.wrong} yanlış etikettir.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(RD, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.answer}. B: ${item.wrong}. “${item.act}” hangisi?`,
        explanation: 'A doğru ayrımdır.'
      });
    }
  });
}

// ---- 2. sc-rule-of-law ----
const LAW = [
  { scene: 'herkes aynı kurala uyar', answer: 'hukuk', wrong: 'keyfi' },
  { scene: 'güçlü kişi kural dışı', answer: 'ihlal', wrong: 'adalet' },
  { scene: 'mahkeme karar verir', answer: 'hukuk', wrong: 'keyfi' },
  { scene: 'ceza yasasız verilir', answer: 'ihlal', wrong: 'adalet' }
];

function familyRuleOfLaw() {
  return buildFamily('sc-rule-of-law', {
    select(id, pathId, random) {
      const item = pick(LAW, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'şaka', 'renk'], random, {
        raw: `“${item.scene}” hukukun üstünlüğü açısından neyi gösterir?`,
        strategy: 'Kural herkese eşit mi bak.',
        explanation: `${item.scene} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(LAW, random);
      return roundChoice(id, pathId, 'kural', ['hediye', 'şarkı', 'renk'], random, {
        raw: `“${item.scene}” için zorunlu ölçüt hangisidir?`,
        explanation: 'Hukuk kurala bağlılığı ölçer.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(LAW, random);
      const trap = item.answer === 'hukuk' ? 'keyfi' : 'adalet';
      return roundChoice(id, pathId, trap, [item.answer === 'hukuk' ? 'hukuk' : 'ihlal', 'kural', 'eşitlik'], random, {
        raw: `“${item.scene}” için hangisi hukuk ihlali etiketidir?`,
        explanation: `${trap} yanlış okumadır.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(LAW, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.answer}. B: ${item.wrong}. Hangisi geçerli?`,
        explanation: 'A hukuk okumasına uyar.'
      });
    }
  });
}

// ---- 3. sc-public-service ----
const PUB = [
  { service: 'okul', answer: 'egitim', wrong: 'eglence' },
  { service: 'hastane', answer: 'saglik', wrong: 'tatil' },
  { service: 'itfaiye', answer: 'guvenlik', wrong: 'oyun' },
  { service: 'kütüphane', answer: 'bilgi', wrong: 'reklam' }
];

function familyPublicService() {
  return buildFamily('sc-public-service', {
    select(id, pathId, random) {
      const item = pick(PUB, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'şaka', 'renk'], random, {
        raw: `“${item.service}” hangi kamu hizmeti alanıdır?`,
        strategy: 'Topluma ortak faydayı ayır.',
        explanation: `${item.service} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(PUB, random);
      return roundChoice(id, pathId, 'kamu', ['ozel-saka', 'renk', 'şarkı'], random, {
        raw: `“${item.service}” için zorunlu etiket hangisidir?`,
        explanation: 'Kamu hizmetidir.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(PUB, random);
      return roundChoice(id, pathId, item.wrong, [item.answer, 'kamu', 'hizmet'], random, {
        raw: `“${item.service}” için hangisi hizmet ihlalidir?`,
        explanation: `${item.wrong} kamu hizmeti değildir.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(PUB, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.answer}. B: ${item.wrong}. Hangisi geçerli?`,
        explanation: 'A kamu hizmeti alanıdır.'
      });
    }
  });
}

// ---- 4. sc-participation ----
const PART = [
  { act: 'oy kullanmak', answer: 'katilim', wrong: 'sessizlik' },
  { act: 'sınıf önerisi vermek', answer: 'katilim', wrong: 'kayitsiz' },
  { act: 'toplantıya gitmemek', answer: 'kayitsiz', wrong: 'katilim' },
  { act: 'görüş yazmak', answer: 'katilim', wrong: 'kayitsiz' }
];

function familyParticipation() {
  return buildFamily('sc-participation', {
    select(id, pathId, random) {
      const item = pick(PART, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'renk', 'şaka'], random, {
        raw: `“${item.act}” katılım açısından neyi gösterir?`,
        strategy: 'Karara etki var mı bak.',
        explanation: `${item.act} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(PART, random);
      return roundChoice(id, pathId, 'etki', ['renk', 'şarkı', 'şaka'], random, {
        raw: `“${item.act}” için zorunlu ölçüt hangisidir?`,
        explanation: 'Katılım karar etkisini ölçer.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(PART, random);
      return roundChoice(id, pathId, item.wrong, [item.answer, 'katılım', 'görüş'], random, {
        raw: `“${item.act}” için hangisi katılım ihlalidir?`,
        explanation: `${item.wrong} yanlış etikettir.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(PART, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.answer}. B: ${item.wrong}. Hangisi geçerli?`,
        explanation: 'A doğru katılım okumasıdır.'
      });
    }
  });
}

// ---- 5. sc-equality ----
const EQ = [
  { scene: 'aynı kural herkese', answer: 'esit', wrong: 'ayrimci' },
  { scene: 'birine özel izin', answer: 'ayrimci', wrong: 'esit' },
  { scene: 'kız-erkek aynı hak', answer: 'esit', wrong: 'ayrimci' },
  { scene: 'yalnız zenginler oy', answer: 'ayrimci', wrong: 'esit' }
];

function familyEquality() {
  return buildFamily('sc-equality', {
    select(id, pathId, random) {
      const item = pick(EQ, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'renk', 'şaka'], random, {
        raw: `“${item.scene}” eşitlik açısından neyi gösterir?`,
        strategy: 'Aynı durumda aynı muamele var mı bak.',
        explanation: `${item.scene} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(EQ, random);
      return roundChoice(id, pathId, 'esitlik', ['renk', 'şarkı', 'şaka'], random, {
        raw: `“${item.scene}” için zorunlu ölçüt hangisidir?`,
        explanation: 'Eşitlik ölçütü zorunludur.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(EQ, random);
      return roundChoice(id, pathId, item.wrong, [item.answer, 'adalet', 'hak'], random, {
        raw: `“${item.scene}” için hangisi eşitlik ihlalidir?`,
        explanation: `${item.wrong} yanlış etikettir.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(EQ, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.answer}. B: ${item.wrong}. Hangisi geçerli?`,
        explanation: 'A doğru eşitlik okumasıdır.'
      });
    }
  });
}

// ---- 6. sc-responsibility ----
const RESP = [
  { act: 'çöpü çöpe atmak', answer: 'sorumlu', wrong: 'kayitsiz' },
  { act: 'sözünü tutmak', answer: 'sorumlu', wrong: 'kayitsiz' },
  { act: 'dağınıklığı bırakmak', answer: 'kayitsiz', wrong: 'sorumlu' },
  { act: 'arkadaşına yardım', answer: 'sorumlu', wrong: 'kayitsiz' }
];

function familyResponsibility() {
  return buildFamily('sc-responsibility', {
    select(id, pathId, random) {
      const item = pick(RESP, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'renk', 'şaka'], random, {
        raw: `“${item.act}” sorumluluk açısından neyi gösterir?`,
        strategy: 'Sonuç üstleniliyor mu bak.',
        explanation: `${item.act} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(RESP, random);
      return roundChoice(id, pathId, 'sonuc', ['renk', 'şarkı', 'şaka'], random, {
        raw: `“${item.act}” için zorunlu ölçüt hangisidir?`,
        explanation: 'Sorumluluk sonuç üstlenmektir.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(RESP, random);
      return roundChoice(id, pathId, item.wrong, [item.answer, 'görev', 'özen'], random, {
        raw: `“${item.act}” için hangisi sorumluluk ihlalidir?`,
        explanation: `${item.wrong} yanlış etikettir.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(RESP, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.answer}. B: ${item.wrong}. Hangisi geçerli?`,
        explanation: 'A doğru sorumluluk okumasıdır.'
      });
    }
  });
}

// ---- 7. sc-conflict-resolution ----
const CONF = [
  { method: 'dinleyip uzlaşmak', answer: 'cozum', wrong: 'siddet' },
  { method: 'bağırmak', answer: 'siddet', wrong: 'cozum' },
  { method: 'arabulucu istemek', answer: 'cozum', wrong: 'siddet' },
  { method: 'itmek', answer: 'siddet', wrong: 'cozum' }
];

function familyConflict() {
  return buildFamily('sc-conflict-resolution', {
    select(id, pathId, random) {
      const item = pick(CONF, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'renk', 'şaka'], random, {
        raw: `“${item.method}” çatışma çözümü açısından neyi gösterir?`,
        strategy: 'Zararsız uzlaşı mı, zarar mı ayır.',
        explanation: `${item.method} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(CONF, random);
      return roundChoice(id, pathId, 'uzlasi', ['renk', 'şarkı', 'şaka'], random, {
        raw: `“${item.method}” için zorunlu ölçüt hangisidir?`,
        explanation: 'Çatışmada uzlaşı ölçülür.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(CONF, random);
      return roundChoice(id, pathId, item.wrong, [item.answer, 'barış', 'dinleme'], random, {
        raw: `“${item.method}” için hangisi çözüm ihlalidir?`,
        explanation: `${item.wrong} yanlış etikettir.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(CONF, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.answer}. B: ${item.wrong}. Hangisi geçerli?`,
        explanation: 'A doğru çözüm okumasıdır.'
      });
    }
  });
}

// ---- 8. sc-media-literacy ----
const MEDIA = [
  { clue: 'kaynak yok haber', answer: 'supheli', wrong: 'guvenilir' },
  { clue: 'resmi kurum duyurusu', answer: 'guvenilir', wrong: 'supheli' },
  { clue: 'abartılı başlık', answer: 'supheli', wrong: 'guvenilir' },
  { clue: 'çok kaynaklı doğrulama', answer: 'guvenilir', wrong: 'supheli' }
];

function familyMedia() {
  return buildFamily('sc-media-literacy', {
    select(id, pathId, random) {
      const item = pick(MEDIA, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'renk', 'şaka'], random, {
        raw: `“${item.clue}” medya okuryazarlığı açısından neyi gösterir?`,
        strategy: 'Kaynak ve kanıt var mı bak.',
        explanation: `${item.clue} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(MEDIA, random);
      return roundChoice(id, pathId, 'kaynak', ['renk', 'şarkı', 'şaka'], random, {
        raw: `“${item.clue}” için zorunlu kontrol hangisidir?`,
        explanation: 'Medyada kaynak kontrolü zorunludur.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(MEDIA, random);
      return roundChoice(id, pathId, item.wrong, [item.answer, 'doğrulama', 'kanıt'], random, {
        raw: `“${item.clue}” için hangisi medya ihlalidir?`,
        explanation: `${item.wrong} yanlış etikettir.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(MEDIA, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.answer}. B: ${item.wrong}. Hangisi geçerli?`,
        explanation: 'A doğru medya okumasıdır.'
      });
    }
  });
}

// ---- 9. sc-environment-civic ----
const ENV = [
  { act: 'geri dönüşüm', answer: 'koruma', wrong: 'zarar' },
  { act: 'su israfı', answer: 'zarar', wrong: 'koruma' },
  { act: 'ağaç dikmek', answer: 'koruma', wrong: 'zarar' },
  { act: 'çöpü doğaya atmak', answer: 'zarar', wrong: 'koruma' }
];

function familyEnvironment() {
  return buildFamily('sc-environment-civic', {
    select(id, pathId, random) {
      const item = pick(ENV, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'renk', 'şaka'], random, {
        raw: `“${item.act}” çevresel vatandaşlık açısından neyi gösterir?`,
        strategy: 'Ortak çevreye etkiyi ayır.',
        explanation: `${item.act} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(ENV, random);
      return roundChoice(id, pathId, 'cevre', ['renk', 'şarkı', 'şaka'], random, {
        raw: `“${item.act}” için zorunlu ölçüt hangisidir?`,
        explanation: 'Çevre etkisi ölçülür.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(ENV, random);
      return roundChoice(id, pathId, item.wrong, [item.answer, 'doğa', 'özen'], random, {
        raw: `“${item.act}” için hangisi çevre ihlalidir?`,
        explanation: `${item.wrong} yanlış etikettir.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(ENV, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.answer}. B: ${item.wrong}. Hangisi geçerli?`,
        explanation: 'A doğru çevre okumasıdır.'
      });
    }
  });
}

// ---- 10. sc-local-global ----
const LG = [
  { act: 'mahalle temizliği', answer: 'yerel', wrong: 'kuresel' },
  { act: 'iklim anlaşması', answer: 'kuresel', wrong: 'yerel' },
  { act: 'okul meclisi', answer: 'yerel', wrong: 'kuresel' },
  { act: 'uluslararası yardım', answer: 'kuresel', wrong: 'yerel' }
];

function familyLocalGlobal() {
  return buildFamily('sc-local-global', {
    select(id, pathId, random) {
      const item = pick(LG, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'renk', 'şaka'], random, {
        raw: `“${item.act}” hangi ölçekte vatandaşlık eylemidir?`,
        strategy: 'Etki alanı yerel mi küresel mi bak.',
        explanation: `${item.act} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(LG, random);
      return roundChoice(id, pathId, 'olcek', ['renk', 'şarkı', 'şaka'], random, {
        raw: `“${item.act}” için zorunlu ayrım hangisidir?`,
        explanation: 'Yerel/küresel ölçek ayrımı gerekir.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(LG, random);
      return roundChoice(id, pathId, item.wrong, [item.answer, 'ölçek', 'bağ'], random, {
        raw: `“${item.act}” için hangisi ölçek ihlalidir?`,
        explanation: `${item.wrong} yanlış ölçekdir.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(LG, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.answer}. B: ${item.wrong}. Hangisi geçerli?`,
        explanation: 'A doğru ölçek okumasıdır.'
      });
    }
  });
}

// ---- 11. sc-digital-citizenship ----
const DIG = [
  { act: 'şifreyi gizli tutmak', answer: 'guvenli', wrong: 'riskli' },
  { act: 'izinsiz foto paylaşmak', answer: 'riskli', wrong: 'guvenli' },
  { act: 'nezaketli yorum', answer: 'guvenli', wrong: 'riskli' },
  { act: 'yabancı linke tıklamak', answer: 'riskli', wrong: 'guvenli' }
];

function familyDigital() {
  return buildFamily('sc-digital-citizenship', {
    select(id, pathId, random) {
      const item = pick(DIG, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'renk', 'şaka'], random, {
        raw: `“${item.act}” dijital vatandaşlık açısından neyi gösterir?`,
        strategy: 'Güvenlik ve saygı var mı bak.',
        explanation: `${item.act} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(DIG, random);
      return roundChoice(id, pathId, 'dijital', ['renk', 'şarkı', 'şaka'], random, {
        raw: `“${item.act}” için zorunlu alan hangisidir?`,
        explanation: 'Dijital vatandaşlık alanıdır.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(DIG, random);
      return roundChoice(id, pathId, item.wrong, [item.answer, 'güvenlik', 'saygı'], random, {
        raw: `“${item.act}” için hangisi dijital ihlalidir?`,
        explanation: `${item.wrong} yanlış etikettir.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(DIG, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.answer}. B: ${item.wrong}. Hangisi geçerli?`,
        explanation: 'A doğru dijital okumasıdır.'
      });
    }
  });
}

// ---- 12. sc-misread-taxonomy ----
const MISREAD = [
  { example: 'ödevi hak sanmak', type: SC_MISREAD.RIGHT },
  { example: 'güçlüyü yasasız tutmak', type: SC_MISREAD.LAW },
  { example: 'bir gruba özel kural', type: SC_MISREAD.EQ },
  { example: 'kaynaksız habere inanmak', type: SC_MISREAD.MEDIA }
];

function familyMisread() {
  return buildFamily('sc-misread-taxonomy', {
    select(id, pathId, random) {
      const item = pick(MISREAD, random);
      const distractors = Object.values(SC_MISREAD).filter((t) => t !== item.type);
      return roundChoice(id, pathId, item.type, distractors.slice(0, 3), random, {
        raw: `“${item.example}” hangi yanlış okuma türüdür?`,
        strategy: 'Hata hücresini sınıflandır.',
        explanation: `Taksonomi: ${item.type}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(MISREAD, random);
      const distractors = Object.values(SC_MISREAD).filter((t) => t !== item.type);
      return roundChoice(id, pathId, item.type, distractors.slice(0, 3), random, {
        raw: `“${item.example}” için zorunlu etiket hangisidir?`,
        explanation: `Zorunlu etiket: ${item.type}.`
      });
    },
    spot(id, pathId, random) {
      const item = pick(MISREAD, random);
      const wrongLabel = Object.values(SC_MISREAD).find((t) => t !== item.type);
      const others = Object.values(SC_MISREAD).filter((t) => t !== wrongLabel);
      return roundChoice(id, pathId, wrongLabel, [item.type, others[0], others[1] || others[0]], random, {
        raw: `Doğru tür ${item.type} iken hangisi yanlış etikettir?`,
        explanation: `Doğru: ${item.type}.`
      });
    },
    compare(id, pathId, random) {
      const a = MISREAD[0];
      const b = MISREAD[1];
      return roundChoice(id, pathId, `${a.type}≠${b.type}`, ['ayni', 'ikisi-hak', 'ikisi-hukuk'], random, {
        raw: `A: “${a.example}”→${a.type}. B: “${b.example}”→${b.type}. İlişki?`,
        explanation: 'Farklı yanlış-okuma hücreleri.'
      });
    }
  });
}

export const SOCIAL_CITIZENSHIP_FAMILIES = [
  familyRightsDuties(),
  familyRuleOfLaw(),
  familyPublicService(),
  familyParticipation(),
  familyEquality(),
  familyResponsibility(),
  familyConflict(),
  familyMedia(),
  familyEnvironment(),
  familyLocalGlobal(),
  familyDigital(),
  familyMisread()
];
