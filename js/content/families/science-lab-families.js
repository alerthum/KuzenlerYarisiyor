// Aşama 04 — science-lab (Fen kavramları).
// UI: tüm iskeletler kind:'choice'.
// Aile = fen KAVRAM yapısı (hâl değişimi, fotosentez, ışık kaynağı, mıknatıs,
// dönüş, ses ortamı, iletken, kalp, gölge, kuvvet, kontrollü değişken, kimyasal).
// Yüzey konu/isim değişimi ≠ yeni aile. Cevaplar kısa.

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
  return `science-lab:${skeletonId}:${pathId}:${simpleHash(raw)}`;
}

const PATH_IDS = ['raw-letters', 'context-embedded', 'staged-strategy-hint'];

const TASK_TRAITS = {
  select: ['strategySelection', 'multiStepInference'],
  forced: ['informationLinking', 'conditionEvaluation'],
  spot: ['errorAnalysis', 'conditionEvaluation'],
  compare: ['strategySelection', 'usingIntermediateResultInNewDecision']
};

export const SL_MISREAD = {
  PHASE: 'hal-karisik',
  LIGHT: 'kaynak-yansima-karisik',
  FORCE: 'kuvvet-enerji-karisik',
  CHEM: 'fiziksel-kimyasal-karisik'
};

function pathWrap(pathId, rawPrompt, contextHint, strategyHint) {
  if (pathId === 'raw-letters') {
    return {
      prompt: rawPrompt,
      context: contextHint || 'Fen kavramını ayır; yüzey isim tuzağına düşme.'
    };
  }
  if (pathId === 'context-embedded') {
    return {
      prompt: `Laboratuvardaki bir örnek: ${rawPrompt}`,
      context: 'Sahne süsünü ayıkla; yalnız kavram ilişkisine odaklan.'
    };
  }
  return {
    prompt: `${strategyHint || 'Önce kavramı belirle, sonra seçenekleri eleye.'} ${rawPrompt}`,
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

const PHASE = [
  { event: 'buz erir', answer: 'kati-sivi', wrong: 'sivi-gaz' },
  { event: 'su kaynar', answer: 'sivi-gaz', wrong: 'kati-sivi' },
  { event: 'buhar yoğuşur', answer: 'gaz-sivi', wrong: 'sivi-kati' },
  { event: 'su donar', answer: 'sivi-kati', wrong: 'kati-sivi' }
];

function familyPhase() {
  return buildFamily('sl-phase-change', {
    select(id, pathId, random) {
      const item = pick(PHASE, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'gaz-kati', 'renk'], random, {
        raw: `“${item.event}” hangi hâl değişimidir?`,
        strategy: 'Başlangıç ve bitiş hâlini ayır.',
        explanation: `${item.event} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(PHASE, random);
      return roundChoice(id, pathId, 'HAL-DEGISTIR', ['YENI-MADDE', 'RENK', 'SARKI'], random, {
        raw: `“${item.event}” için zorunlu etiket hangisidir?`,
        explanation: 'Hâl değişimi zorunludur.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(PHASE, random);
      return roundChoice(id, pathId, item.wrong, [item.answer, 'kati-sivi', 'sivi-gaz'], random, {
        raw: `“${item.event}” için hangisi yanlış hâldir?`,
        explanation: `${item.wrong} hatalı etikettir.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(PHASE, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.answer}. B: ${item.wrong}. Hangisi?`,
        explanation: 'A doğru hâl değişimidir.'
      });
    }
  });
}

const PHOTO = [
  { part: 'yaprak', answer: 'fotosentez', wrong: 'kok-su' },
  { part: 'kök', answer: 'su-alimi', wrong: 'fotosentez' },
  { part: 'çiçek', answer: 'ureme', wrong: 'fotosentez' },
  { part: 'gövde', answer: 'tasima', wrong: 'fotosentez' }
];

function familyPhoto() {
  return buildFamily('sl-photosynthesis-structure', {
    select(id, pathId, random) {
      const item = pick(PHOTO, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'renk', 'sarki'], random, {
        raw: `“${item.part}” ana işlevi hangisidir?`,
        strategy: 'Yapı-işlev eşlemesini kur.',
        explanation: `${item.part} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(PHOTO, random);
      return roundChoice(id, pathId, 'YAPI-ISLEV', ['RENK', 'SARKI', 'TAHMIN'], random, {
        raw: `“${item.part}” için zorunlu bağ hangisidir?`,
        explanation: 'Yapı-işlev bağı zorunludur.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(PHOTO, random);
      return roundChoice(id, pathId, item.wrong, [item.answer, 'yaprak', 'besin'], random, {
        raw: `“${item.part}” için hangisi işlev ihlalidir?`,
        explanation: `${item.wrong} yanlış işlevdir.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(PHOTO, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.answer}. B: ${item.wrong}. Hangisi?`,
        explanation: 'A doğru işlevdir.'
      });
    }
  });
}

const LIGHT = [
  { obj: 'Güneş', answer: 'kaynak', wrong: 'yansitici' },
  { obj: 'Ay', answer: 'yansitici', wrong: 'kaynak' },
  { obj: 'lamba', answer: 'kaynak', wrong: 'yansitici' },
  { obj: 'ayna', answer: 'yansitici', wrong: 'kaynak' }
];

function familyLight() {
  return buildFamily('sl-light-source-reflector', {
    select(id, pathId, random) {
      const item = pick(LIGHT, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'ses', 'renk'], random, {
        raw: `“${item.obj}” ışık açısından nedir?`,
        strategy: 'Kendi üretir mi yoksa yansıtır mı ayır.',
        explanation: `${item.obj} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(LIGHT, random);
      return roundChoice(id, pathId, 'KAYNAK-YANSIMA', ['SES', 'RENK', 'SARKI'], random, {
        raw: `“${item.obj}” için zorunlu ayrım hangisidir?`,
        explanation: 'Kaynak/yansıtıcı ayrımı zorunludur.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(LIGHT, random);
      return roundChoice(id, pathId, item.wrong, [item.answer, 'isik', 'optik'], random, {
        raw: `“${item.obj}” için hangisi yanlış etikettir?`,
        explanation: `${item.wrong} hatalıdır.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(LIGHT, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.answer}. B: ${item.wrong}. Hangisi?`,
        explanation: 'A doğru ışık rolüdür.'
      });
    }
  });
}

const MAG = [
  { claim: 'kutuplarda güçlü', answer: 'kutup', wrong: 'orta' },
  { claim: 'ortada zayıf', answer: 'orta-zayif', wrong: 'kutup' },
  { claim: 'demiri çeker', answer: 'cekme', wrong: 'itme-hep' },
  { claim: 'aynı kutup iter', answer: 'itme', wrong: 'cekme' }
];

function familyMagnet() {
  return buildFamily('sl-magnet-poles', {
    select(id, pathId, random) {
      const item = pick(MAG, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'renk', 'ses'], random, {
        raw: `“${item.claim}” mıknatıs kuralı hangisidir?`,
        strategy: 'Kutup davranışını ayır.',
        explanation: `${item.claim} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(MAG, random);
      return roundChoice(id, pathId, 'KUTUP', ['RENK', 'SARKI', 'SES'], random, {
        raw: `“${item.claim}” için zorunlu kavram hangisidir?`,
        explanation: 'Kutup kavramı zorunludur.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(MAG, random);
      return roundChoice(id, pathId, item.wrong, [item.answer, 'kutup', 'alan'], random, {
        raw: `“${item.claim}” için hangisi ihlaldir?`,
        explanation: `${item.wrong} yanlış kuraldır.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(MAG, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.answer}. B: ${item.wrong}. Hangisi?`,
        explanation: 'A doğru mıknatıs kuralıdır.'
      });
    }
  });
}

const EARTH = [
  { motion: 'kendi ekseni', answer: 'gece-gunduz', wrong: 'mevsim' },
  { motion: 'Güneş etrafı', answer: 'yil', wrong: 'gece-gunduz' },
  { motion: 'eksen eğikliği+yıl', answer: 'mevsim', wrong: 'gece-gunduz' },
  { motion: 'günlük dönüş', answer: 'gece-gunduz', wrong: 'yil' }
];

function familyEarth() {
  return buildFamily('sl-earth-rotation-daynight', {
    select(id, pathId, random) {
      const item = pick(EARTH, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'ay-tutulma', 'renk'], random, {
        raw: `“${item.motion}” neyi oluşturur?`,
        strategy: 'Hareket-sonuç eşlemesini kur.',
        explanation: `${item.motion} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(EARTH, random);
      return roundChoice(id, pathId, 'HAREKET-SONUC', ['RENK', 'SARKI', 'SES'], random, {
        raw: `“${item.motion}” için zorunlu bağ hangisidir?`,
        explanation: 'Hareket-sonuç bağı zorunludur.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(EARTH, random);
      return roundChoice(id, pathId, item.wrong, [item.answer, 'donus', 'yil'], random, {
        raw: `“${item.motion}” için hangisi yanlış sonuçtur?`,
        explanation: `${item.wrong} hatalı eşlemedir.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(EARTH, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.answer}. B: ${item.wrong}. Hangisi?`,
        explanation: 'A doğru sonuçtur.'
      });
    }
  });
}

const SOUND = [
  { medium: 'hava', answer: 'yayilir', wrong: 'yayilmaz' },
  { medium: 'su', answer: 'yayilir', wrong: 'yayilmaz' },
  { medium: 'bosluk', answer: 'yayilmaz', wrong: 'yayilir' },
  { medium: 'metal', answer: 'yayilir', wrong: 'yayilmaz' }
];

function familySound() {
  return buildFamily('sl-sound-medium', {
    select(id, pathId, random) {
      const item = pick(SOUND, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'isik', 'renk'], random, {
        raw: `Ses “${item.medium}” ortamında nasıl davranır?`,
        strategy: 'Tanecik var mı bak.',
        explanation: `${item.medium} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(SOUND, random);
      return roundChoice(id, pathId, 'ORTAM-GEREKLI', ['BOSLUK-YETER', 'RENK', 'SARKI'], random, {
        raw: `“${item.medium}” için zorunlu koşul hangisidir?`,
        explanation: 'Ses için ortam gerekir.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(SOUND, random);
      return roundChoice(id, pathId, item.wrong, [item.answer, 'ortam', 'titresim'], random, {
        raw: `“${item.medium}” için hangisi ihlaldir?`,
        explanation: `${item.wrong} yanlış davranıştır.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(SOUND, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.answer}. B: ${item.wrong}. Hangisi?`,
        explanation: 'A doğru ses davranışıdır.'
      });
    }
  });
}

const COND = [
  { mat: 'bakır', answer: 'iletken', wrong: 'yalitkan' },
  { mat: 'plastik', answer: 'yalitkan', wrong: 'iletken' },
  { mat: 'cam', answer: 'yalitkan', wrong: 'iletken' },
  { mat: 'alüminyum', answer: 'iletken', wrong: 'yalitkan' }
];

function familyConductor() {
  return buildFamily('sl-conductor-insulator', {
    select(id, pathId, random) {
      const item = pick(COND, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'ses', 'renk'], random, {
        raw: `“${item.mat}” elektrik açısından nedir?`,
        strategy: 'Akımı iletir mi ayır.',
        explanation: `${item.mat} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(COND, random);
      return roundChoice(id, pathId, 'ILETKEN-YALITKAN', ['RENK', 'SARKI', 'SES'], random, {
        raw: `“${item.mat}” için zorunlu ayrım hangisidir?`,
        explanation: 'İletken/yalıtkan ayrımı zorunludur.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(COND, random);
      return roundChoice(id, pathId, item.wrong, [item.answer, 'metal', 'akim'], random, {
        raw: `“${item.mat}” için hangisi yanlış etikettir?`,
        explanation: `${item.wrong} hatalıdır.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(COND, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.answer}. B: ${item.wrong}. Hangisi?`,
        explanation: 'A doğru iletkenlik etiketidir.'
      });
    }
  });
}

const HEART = [
  { act: 'kan pompalar', answer: 'kalp', wrong: 'akciger' },
  { act: 'gaz değişimi', answer: 'akciger', wrong: 'kalp' },
  { act: 'besin sindirir', answer: 'mide', wrong: 'kalp' },
  { act: 'filtreler', answer: 'bobrek', wrong: 'kalp' }
];

function familyHeart() {
  return buildFamily('sl-heart-pump', {
    select(id, pathId, random) {
      const item = pick(HEART, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'kemik', 'deri'], random, {
        raw: `“${item.act}” hangi organa aittir?`,
        strategy: 'İşlev-organ eşlemesini kur.',
        explanation: `${item.act} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(HEART, random);
      return roundChoice(id, pathId, 'ORGAN-ISLEV', ['RENK', 'SARKI', 'SES'], random, {
        raw: `“${item.act}” için zorunlu bağ hangisidir?`,
        explanation: 'Organ-işlev bağı zorunludur.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(HEART, random);
      return roundChoice(id, pathId, item.wrong, [item.answer, 'organ', 'islev'], random, {
        raw: `“${item.act}” için hangisi yanlış organdır?`,
        explanation: `${item.wrong} hatalı eşlemedir.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(HEART, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.answer}. B: ${item.wrong}. Hangisi?`,
        explanation: 'A doğru organdır.'
      });
    }
  });
}

const SHADOW = [
  { need: 'isik+opak', answer: 'golge', wrong: 'yok' },
  { need: 'yalnız su', answer: 'yok', wrong: 'golge' },
  { need: 'seffaf+karanlik', answer: 'yok', wrong: 'golge' },
  { need: 'lamba+kitap', answer: 'golge', wrong: 'yok' }
];

function familyShadow() {
  return buildFamily('sl-shadow-formation', {
    select(id, pathId, random) {
      const item = pick(SHADOW, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'ses', 'renk'], random, {
        raw: `“${item.need}” gölge oluşur mu?`,
        strategy: 'Işık kaynağı + opak cisim var mı bak.',
        explanation: `${item.need} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(SHADOW, random);
      return roundChoice(id, pathId, 'ISIK-OPAK', ['YALNIZ-SU', 'RENK', 'SARKI'], random, {
        raw: `“${item.need}” için zorunlu koşul hangisidir?`,
        explanation: 'Işık+opak zorunludur.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(SHADOW, random);
      return roundChoice(id, pathId, item.wrong, [item.answer, 'isik', 'opak'], random, {
        raw: `“${item.need}” için hangisi yanlış sonuçtur?`,
        explanation: `${item.wrong} hatalıdır.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(SHADOW, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.answer}. B: ${item.wrong}. Hangisi?`,
        explanation: 'A doğru gölge sonucudur.'
      });
    }
  });
}

const FORCE = [
  { act: 'itmek', answer: 'kuvvet', wrong: 'enerji' },
  { act: 'çekmek', answer: 'kuvvet', wrong: 'sicaklik' },
  { act: 'yol/zaman', answer: 'surat', wrong: 'kuvvet' },
  { act: 'ısıtmak', answer: 'enerji', wrong: 'kuvvet' }
];

function familyForce() {
  return buildFamily('sl-force-push-pull', {
    select(id, pathId, random) {
      const item = pick(FORCE, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'renk', 'ses'], random, {
        raw: `“${item.act}” hangi kavramdır?`,
        strategy: 'İtme-çekme kuvvet; diğerleri ayrı.',
        explanation: `${item.act} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(FORCE, random);
      return roundChoice(id, pathId, 'KAVRAM-AYIR', ['RENK', 'SARKI', 'SES'], random, {
        raw: `“${item.act}” için zorunlu işlem hangisidir?`,
        explanation: 'Kavram ayrımı zorunludur.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(FORCE, random);
      return roundChoice(id, pathId, item.wrong, [item.answer, 'itme', 'cekme'], random, {
        raw: `“${item.act}” için hangisi kavram ihlalidir?`,
        explanation: `${item.wrong} yanlış etikettir.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(FORCE, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.answer}. B: ${item.wrong}. Hangisi?`,
        explanation: 'A doğru kavramdır.'
      });
    }
  });
}

const CTRL = [
  { changed: 'isik', fixed: 'su', answer: 'kontrol-iyi', wrong: 'kontrol-kotu' },
  { changed: 'su+isik', fixed: 'hic', answer: 'kontrol-kotu', wrong: 'kontrol-iyi' },
  { changed: 'sicaklik', fixed: 'isik', answer: 'kontrol-iyi', wrong: 'kontrol-kotu' },
  { changed: 'hepsi', fixed: 'yok', answer: 'kontrol-kotu', wrong: 'kontrol-iyi' }
];

function familyControl() {
  return buildFamily('sl-controlled-variable', {
    select(id, pathId, random) {
      const item = pick(CTRL, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'renk', 'ses'], random, {
        raw: `Değişen: ${item.changed}, sabit: ${item.fixed}. Kontrol?`,
        strategy: 'Tek değişken mi bak.',
        explanation: `${item.changed}/${item.fixed} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(CTRL, random);
      return roundChoice(id, pathId, 'TEK-DEGISKEN', ['COK-DEGISKEN', 'RENK', 'SARKI'], random, {
        raw: `${item.changed} deneyinde zorunlu kural hangisidir?`,
        explanation: 'Tek değişken kuralı zorunludur.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(CTRL, random);
      return roundChoice(id, pathId, item.wrong, [item.answer, 'kontrol', 'olcum'], random, {
        raw: `${item.changed} için hangisi kontrol ihlalidir?`,
        explanation: `${item.wrong} hatalı etikettir.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(CTRL, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.answer}. B: ${item.wrong}. Hangisi?`,
        explanation: 'A doğru kontrol değerlendirmesidir.'
      });
    }
  });
}

const CHEM = [
  { event: 'paslanma', answer: 'kimyasal', wrong: 'fiziksel' },
  { event: 'buz erime', answer: 'fiziksel', wrong: 'kimyasal' },
  { event: 'yanma', answer: 'kimyasal', wrong: 'fiziksel' },
  { event: 'kâğıt yırtma', answer: 'fiziksel', wrong: 'kimyasal' }
];

function familyChem() {
  return buildFamily('sl-chemical-vs-physical', {
    select(id, pathId, random) {
      const item = pick(CHEM, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'ses', 'renk'], random, {
        raw: `“${item.event}” hangi değişimdir?`,
        strategy: 'Yeni madde oluştu mu bak.',
        explanation: `${item.event} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(CHEM, random);
      return roundChoice(id, pathId, 'YENI-MADDE?', ['RENK', 'SARKI', 'SES'], random, {
        raw: `“${item.event}” için zorunlu soru hangisidir?`,
        explanation: 'Yeni madde sorusu zorunludur.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(CHEM, random);
      return roundChoice(id, pathId, item.wrong, [item.answer, 'degisim', 'madde'], random, {
        raw: `“${item.event}” için hangisi yanlış etikettir?`,
        explanation: `${item.wrong} hatalıdır.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(CHEM, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.answer}. B: ${item.wrong}. Hangisi?`,
        explanation: 'A doğru değişim türüdür.'
      });
    }
  });
}

const MIS = [
  { text: 'Erimeyi buharlaşma sandı.', error: SL_MISREAD.PHASE },
  { text: 'Ay’ı ışık kaynağı sandı.', error: SL_MISREAD.LIGHT },
  { text: 'İtmeyi enerji sandı.', error: SL_MISREAD.FORCE },
  { text: 'Paslanmayı fiziksel sandı.', error: SL_MISREAD.CHEM }
];

function familyMisread() {
  return buildFamily('sl-misread-taxonomy', {
    select(id, pathId, random) {
      const item = pick(MIS, random);
      const distractors = Object.values(SL_MISREAD).filter((e) => e !== item.error);
      return roundChoice(id, pathId, item.error, distractors.slice(0, 3), random, {
        raw: `${item.text} Yanlış okuma türü?`,
        explanation: `${item.text} → ${item.error}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(MIS, random);
      return roundChoice(id, pathId, item.error, Object.values(SL_MISREAD).filter((e) => e !== item.error).slice(0, 3), random, {
        raw: `${item.text} Zorunlu etiket?`,
        explanation: `Zorunlu: ${item.error}.`
      });
    },
    spot(id, pathId, random) {
      const item = pick(MIS, random);
      return roundChoice(id, pathId, item.error, shuffle(Object.values(SL_MISREAD).filter((e) => e !== item.error), random).slice(0, 3), random, {
        raw: `Hangisi “${item.text}” ihlalidir?`,
        explanation: item.error
      });
    },
    compare(id, pathId, random) {
      const a = pick(MIS, random);
      let b = pick(MIS, random);
      if (b.error === a.error) b = MIS.find((m) => m.error !== a.error) || a;
      const answer = `${a.error}|${b.error}`;
      const distractors = [
        `${SL_MISREAD.PHASE}|${SL_MISREAD.PHASE}`,
        `${SL_MISREAD.CHEM}|${SL_MISREAD.CHEM}`,
        `${b.error}|${a.error}`
      ].filter((x) => x !== answer);
      return roundChoice(id, pathId, answer, distractors.slice(0, 3), random, {
        raw: `A: ${a.text} · B: ${b.text}. Etiket çifti (A|B)?`,
        explanation: `A→${a.error}, B→${b.error}`
      });
    }
  });
}

export const SCIENCE_LAB_FAMILIES = [
  familyPhase(),
  familyPhoto(),
  familyLight(),
  familyMagnet(),
  familyEarth(),
  familySound(),
  familyConductor(),
  familyHeart(),
  familyShadow(),
  familyForce(),
  familyChem(),
  familyMisread()
];
