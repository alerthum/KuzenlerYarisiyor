// Aşama 04 — science-reasoning (Deney Dedektifi).
// UI: tüm iskeletler kind:'choice'.
// Aile = bilimsel AKIL YÜRÜTME (iletim çıkarımı, bağımsız değişken, sürtünme,
// hız-sıcaklık, karıştırıcı, hassasiyet/doğruluk, hipotez, kanıt gücü, kontrol
// grubu, tekrarlanabilirlik, model-sınır, yanlış okuma).
// Yüzey sahne değişimi ≠ yeni aile. Cevaplar kısa.

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
  return `science-reasoning:${skeletonId}:${pathId}:${simpleHash(raw)}`;
}

const PATH_IDS = [
  'raw-letters',
  'context-embedded',
  'staged-strategy-hint',
  'counterexample-first',
  'constraint-ordering'
];

const STEM_FRAMES = [
  'Doğru çıkarım hangisidir?', 'Kanıtla uyumlu seçenek?',
  'Hangi sonuç zorunlu adıma uyar?', 'Eleme sonrası kalan doğru?',
  'Ara karar doğruysa sonuç?', 'Yanılgı tuzağına düşmeden seç:',
  'Deney mantığına uygun yanıt?', 'İkinci adım tamamlanınca ne bulunur?',
  'Koşulları sağlayan tek seçenek?', 'Hangi seçenek düşünme yolunu bozar?',
  'Doğru stratejinin çıktısı nedir?', 'Karşı örnekle elenenler dışında kalan?',
  'Kontrol değişkenleri korunursa?', 'Veri ile çelişmeyen hangisi?',
  'Çok adımlı çıkarımın sonu?', 'Kısmi doğruyu tam sanan hangisi?',
  'Kontrol ettikten sonra kalan?', 'Zorunlu ara sonucu kullanan cevap?',
  'Yüzey tuzağı olmayan seçenek?', 'Hedef soruya en uygun yanıt?'
];

const TASK_TRAITS = {
  select: ['strategySelection', 'multiStepInference'],
  forced: ['informationLinking', 'conditionEvaluation'],
  spot: ['errorAnalysis', 'conditionEvaluation'],
  compare: ['strategySelection', 'usingIntermediateResultInNewDecision']
};

export const SR_MISREAD = {
  CONF: 'karistirici-yok-sayma',
  PREC: 'hassas-dogru-karisik',
  VAR: 'degisken-yanlis',
  EV: 'kanit-asim'
};

function pathWrap(pathId, rawPrompt, contextHint, strategyHint) {
  if (pathId === 'raw-letters') {
    return {
      prompt: rawPrompt,
      context: contextHint || 'Deney düşüncesini ayır; yüzey sahne tuzağına düşme.'
    };
  }
  if (pathId === 'context-embedded') {
    return {
      prompt: `Deney defterindeki kayıt: ${rawPrompt}`,
      context: 'Sahne süsünü ayıkla; yalnız çıkarım mantığına odaklan.'
    };
  }
  if (pathId === 'counterexample-first') {
    return {
      prompt: `Önce zayıf iddiayı ele: ${rawPrompt}`,
      context: 'Eleme yolu; spoiler yok.'
    };
  }
  if (pathId === 'constraint-ordering') {
    return {
      prompt: `Koşulları sırayla uygula: ${rawPrompt}`,
      context: 'Kısıt sıralama; ara karar zorunlu.'
    };
  }
  return {
    prompt: `${strategyHint || 'Önce kanıtı ayır, sonra sonucu seç.'} ${rawPrompt}`,
    context: 'Strateji ipucu cevabı vermez; yalnız düşünme sırasını gösterir.'
  };
}

function roundChoice(skeletonId, pathId, answerText, distractors, random, texts) {
  const pool = [answerText, ...distractors];
  const unique = [...new Set(pool.map(String))];
  while (unique.length < 4) unique.push(`X${unique.length}`);
  const options = shuffle(unique.slice(0, 4), random);
  const answerIndex = options.indexOf(String(answerText));
  const frame = pick(STEM_FRAMES, random);
  const { prompt, context } = pathWrap(pathId, `${texts.raw} ${frame}`, texts.context, texts.strategy);
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

const HEAT = [
  { obs: 'metalde buz hızlı erir', answer: 'iletken', wrong: 'yalitkan' },
  { obs: 'tahtada buz yavaş erir', answer: 'yalitkan-daha', wrong: 'iletken' },
  { obs: 'bakır ısıyı taşır', answer: 'iletken', wrong: 'renk-etki' },
  { obs: 'plastik ısıyı tutmaz', answer: 'yalitkan-daha', wrong: 'iletken' }
];

function familyHeat() {
  return buildFamily('sr-heat-conduction-inference', {
    select(id, pathId, random) {
      const item = pick(HEAT, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'renk', 'ses'], random, {
        raw: `Gözlem: “${item.obs}”. En güçlü çıkarım?`,
        strategy: 'Isı iletimini gözleme bağla.',
        explanation: `${item.obs} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(HEAT, random);
      return roundChoice(id, pathId, 'ILETIM-CIKARIM', ['RENK', 'SARKI', 'SES'], random, {
        raw: `“${item.obs}” için zorunlu işlem hangisidir?`,
        explanation: 'İletim çıkarımı zorunludur.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(HEAT, random);
      return roundChoice(id, pathId, item.wrong, [item.answer, 'isi', 'iletken'], random, {
        raw: `“${item.obs}” için hangisi zayıf çıkarımdır?`,
        explanation: `${item.wrong} kanıtı kaçırır.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(HEAT, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.answer}. B: ${item.wrong}. Hangisi?`,
        explanation: 'A gözleme uyar.'
      });
    }
  });
}

const IV = [
  { setup: 'yalnız ışık değişti', answer: 'isik', wrong: 'su' },
  { setup: 'yalnız sıcaklık değişti', answer: 'sicaklik', wrong: 'isik' },
  { setup: 'yalnız su değişti', answer: 'su', wrong: 'gubre' },
  { setup: 'yalnız gübre değişti', answer: 'gubre', wrong: 'su' }
];

function familyIV() {
  return buildFamily('sr-independent-variable', {
    select(id, pathId, random) {
      const item = pick(IV, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'renk', 'ses'], random, {
        raw: `${item.setup}. Bağımsız değişken?`,
        strategy: 'Araştırmacının değiştirdiğini seç.',
        explanation: `${item.setup} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(IV, random);
      return roundChoice(id, pathId, 'BAGIMSIZ', ['SABIT', 'RENK', 'SARKI'], random, {
        raw: `${item.setup} için zorunlu etiket?`,
        explanation: 'Bağımsız değişken zorunludur.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(IV, random);
      return roundChoice(id, pathId, item.wrong, [item.answer, 'bagimsiz', 'kontrol'], random, {
        raw: `${item.setup} için hangisi yanlış değişkendir?`,
        explanation: `${item.wrong} sabit tutulmuştur.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(IV, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.answer}. B: ${item.wrong}. Hangisi bağımsız?`,
        explanation: 'A bağımsız değişkendir.'
      });
    }
  });
}

const FRICTION = [
  { obs: 'halıda kısa yol', answer: 'surutunme-artis', wrong: 'kutle-artis' },
  { obs: 'buzda uzun yol', answer: 'surutunme-azalis', wrong: 'kuvvet-yok' },
  { obs: 'pürüzlü zemin yavaş', answer: 'surutunme-artis', wrong: 'renk' },
  { obs: 'yağlı zemin kaygan', answer: 'surutunme-azalis', wrong: 'kutle-artis' }
];

function familyFriction() {
  return buildFamily('sr-friction-inference', {
    select(id, pathId, random) {
      const item = pick(FRICTION, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'ses', 'renk'], random, {
        raw: `Gözlem: “${item.obs}”. Çıkarım?`,
        strategy: 'Sürtünme etkisini yola bağla.',
        explanation: `${item.obs} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(FRICTION, random);
      return roundChoice(id, pathId, 'SURTUNME', ['RENK', 'SARKI', 'SES'], random, {
        raw: `“${item.obs}” için zorunlu kavram?`,
        explanation: 'Sürtünme kavramı zorunludur.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(FRICTION, random);
      return roundChoice(id, pathId, item.wrong, [item.answer, 'surutunme', 'yol'], random, {
        raw: `“${item.obs}” için hangisi zayıf çıkarımdır?`,
        explanation: `${item.wrong} desteklenmez.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(FRICTION, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.answer}. B: ${item.wrong}. Hangisi?`,
        explanation: 'A sürtünme çıkarımıdır.'
      });
    }
  });
}

const RATE = [
  { data: '20→30°C süre 80→45s', answer: 'hizlandi', wrong: 'yavasladi' },
  { data: 'sıcaklık düştü süre uzadı', answer: 'yavasladi', wrong: 'hizlandi' },
  { data: 'ısı arttı süre kısaldı', answer: 'hizlandi', wrong: 'degismedi' },
  { data: 'ısı aynı süre aynı', answer: 'degismedi', wrong: 'hizlandi' }
];

function familyRate() {
  return buildFamily('sr-rate-temperature', {
    select(id, pathId, random) {
      const item = pick(RATE, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'renk', 'ses'], random, {
        raw: `Veri: ${item.data}. Tepkime hızı?`,
        strategy: 'Süre kısalınca hız artar.',
        explanation: `${item.data} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(RATE, random);
      return roundChoice(id, pathId, 'SURE-HIZ', ['RENK', 'SARKI', 'SES'], random, {
        raw: `${item.data} için zorunlu bağ?`,
        explanation: 'Süre-hız bağı zorunludur.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(RATE, random);
      return roundChoice(id, pathId, item.wrong, [item.answer, 'hiz', 'sure'], random, {
        raw: `${item.data} için hangisi yanlış sonuçtur?`,
        explanation: `${item.wrong} hatalıdır.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(RATE, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.answer}. B: ${item.wrong}. Hangisi?`,
        explanation: 'A veriye uyar.'
      });
    }
  });
}

const CONF = [
  { flaw: 'gübre+su birlikte', answer: 'karistirici', wrong: 'iyi-kontrol' },
  { flaw: 'yalnız gübre', answer: 'iyi-kontrol', wrong: 'karistirici' },
  { flaw: 'ışık+sıcaklık birlikte', answer: 'karistirici', wrong: 'iyi-kontrol' },
  { flaw: 'tek değişken', answer: 'iyi-kontrol', wrong: 'karistirici' }
];

function familyConfound() {
  return buildFamily('sr-confounding-variables', {
    select(id, pathId, random) {
      const item = pick(CONF, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'renk', 'ses'], random, {
        raw: `Düzenek: “${item.flaw}”. Değerlendirme?`,
        strategy: 'İki değişken birden mi değişti bak.',
        explanation: `${item.flaw} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(CONF, random);
      return roundChoice(id, pathId, 'TEK-DEGISKEN', ['COK-DEGISKEN-OK', 'RENK', 'SARKI'], random, {
        raw: `“${item.flaw}” için zorunlu kural?`,
        explanation: 'Tek değişken kuralı zorunludur.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(CONF, random);
      return roundChoice(id, pathId, item.wrong === 'karistirici' ? 'karistirici' : 'iyi-kontrol-yanlis', [item.answer === 'karistirici' ? 'iyi-kontrol' : 'karistirici', 'olcum', 'hipotez'].slice(0, 3), random, {
        raw: `“${item.flaw}” için hangisi yanlış etikettir?`,
        explanation: 'Karıştırıcıyı yanlış etiketlemek ihlaldir.'
      });
    },
    compare(id, pathId, random) {
      const item = pick(CONF, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.answer}. B: ${item.wrong}. Hangisi?`,
        explanation: 'A doğru değerlendirmedir.'
      });
    }
  });
}

const PREC = [
  { data: '50.1 50.0 50.1 gerçek 53', answer: 'hassas-degil-dogru', wrong: 'dogru-hassas' },
  { data: '53.0 53.1 52.9 gerçek 53', answer: 'dogru-hassas', wrong: 'hassas-degil-dogru' },
  { data: '40 60 50 gerçek 53', answer: 'ne-dogru-ne-hassas', wrong: 'dogru-hassas' },
  { data: '53 53 53 gerçek 53', answer: 'dogru-hassas', wrong: 'hassas-degil-dogru' }
];

function familyPrecision() {
  return buildFamily('sr-accuracy-vs-precision', {
    select(id, pathId, random) {
      const item = pick(PREC, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'renk', 'ses'], random, {
        raw: `Ölçüm: ${item.data}. Değerlendirme?`,
        strategy: 'Yakınlık=hassas; gerçeğe yakınlık=doğru.',
        explanation: `${item.data} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(PREC, random);
      return roundChoice(id, pathId, 'HASSAS-DOGRU', ['RENK', 'SARKI', 'SES'], random, {
        raw: `${item.data} için zorunlu ayrım?`,
        explanation: 'Hassas/doğru ayrımı zorunludur.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(PREC, random);
      return roundChoice(id, pathId, item.wrong, [item.answer, 'olcum', 'gercek'], random, {
        raw: `${item.data} için hangisi yanlış etikettir?`,
        explanation: `${item.wrong} hatalıdır.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(PREC, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.answer}. B: ${item.wrong}. Hangisi?`,
        explanation: 'A doğru ölçüm etiketidir.'
      });
    }
  });
}

const HYP = [
  { claim: 'ışık artarsa büyüme artar', answer: 'test-edilebilir', wrong: 'test-edilmez' },
  { claim: 'görünmez ruh etkiler', answer: 'test-edilmez', wrong: 'test-edilebilir' },
  { claim: 'sıcaklık hızı değiştirir', answer: 'test-edilebilir', wrong: 'test-edilmez' },
  { claim: 'şans her şeyi belirler', answer: 'test-edilmez', wrong: 'test-edilebilir' }
];

function familyHypothesis() {
  return buildFamily('sr-hypothesis-testability', {
    select(id, pathId, random) {
      const item = pick(HYP, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'renk', 'ses'], random, {
        raw: `Hipotez: “${item.claim}”. Durum?`,
        strategy: 'Ölçülebilir mi bak.',
        explanation: `${item.claim} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(HYP, random);
      return roundChoice(id, pathId, 'OLCULEBILIR', ['SIHIR', 'RENK', 'SARKI'], random, {
        raw: `“${item.claim}” için zorunlu ölçüt?`,
        explanation: 'Ölçülebilirlik zorunludur.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(HYP, random);
      return roundChoice(id, pathId, item.wrong, [item.answer, 'hipotez', 'test'], random, {
        raw: `“${item.claim}” için hangisi yanlış etikettir?`,
        explanation: `${item.wrong} hatalıdır.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(HYP, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.answer}. B: ${item.wrong}. Hangisi?`,
        explanation: 'A doğru test edilebilirlik etiketidir.'
      });
    }
  });
}

const EV = [
  { claim: 'üç tekrar aynı sonuç', answer: 'guclu-kanit', wrong: 'zayif-kanit' },
  { claim: 'tek gözlem', answer: 'zayif-kanit', wrong: 'guclu-kanit' },
  { claim: 'kontrol+tekrar var', answer: 'guclu-kanit', wrong: 'zayif-kanit' },
  { claim: 'söylenti', answer: 'zayif-kanit', wrong: 'guclu-kanit' }
];

function familyEvidence() {
  return buildFamily('sr-evidence-strength', {
    select(id, pathId, random) {
      const item = pick(EV, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'renk', 'ses'], random, {
        raw: `“${item.claim}”. Kanıt gücü?`,
        strategy: 'Tekrar ve kontrol var mı bak.',
        explanation: `${item.claim} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(EV, random);
      return roundChoice(id, pathId, 'KANIT-GUCU', ['RENK', 'SARKI', 'SES'], random, {
        raw: `“${item.claim}” için zorunlu değerlendirme?`,
        explanation: 'Kanıt gücü değerlendirmesi zorunludur.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(EV, random);
      return roundChoice(id, pathId, item.wrong, [item.answer, 'kanit', 'tekrar'], random, {
        raw: `“${item.claim}” için hangisi yanlış güç etiketidir?`,
        explanation: `${item.wrong} hatalıdır.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(EV, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.answer}. B: ${item.wrong}. Hangisi?`,
        explanation: 'A doğru kanıt gücüdür.'
      });
    }
  });
}

const CTRL = [
  { setup: 'gübre yok grubu var', answer: 'kontrol-var', wrong: 'kontrol-yok' },
  { setup: 'tüm gruplara gübre', answer: 'kontrol-yok', wrong: 'kontrol-var' },
  { setup: 'karşılaştırma grubu yok', answer: 'kontrol-yok', wrong: 'kontrol-var' },
  { setup: 'işlem+kontrol ayrık', answer: 'kontrol-var', wrong: 'kontrol-yok' }
];

function familyControlGroup() {
  return buildFamily('sr-control-group', {
    select(id, pathId, random) {
      const item = pick(CTRL, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'renk', 'ses'], random, {
        raw: `Düzenek: “${item.setup}”. Kontrol grubu?`,
        strategy: 'Karşılaştırma grubu var mı bak.',
        explanation: `${item.setup} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(CTRL, random);
      return roundChoice(id, pathId, 'KARSILASTIRMA', ['RENK', 'SARKI', 'SES'], random, {
        raw: `“${item.setup}” için zorunlu öğe?`,
        explanation: 'Karşılaştırma grubu zorunludur.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(CTRL, random);
      return roundChoice(id, pathId, item.wrong, [item.answer, 'kontrol', 'grup'], random, {
        raw: `“${item.setup}” için hangisi yanlış etikettir?`,
        explanation: `${item.wrong} hatalıdır.`
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

const REP = [
  { act: 'aynı yöntem 3 kez', answer: 'tekrarlanabilir', wrong: 'tek-sefer' },
  { act: 'yöntem gizli', answer: 'tekrarlanamaz', wrong: 'tekrarlanabilir' },
  { act: 'adımlar yazılı', answer: 'tekrarlanabilir', wrong: 'tekrarlanamaz' },
  { act: 'rastgele değişiklik', answer: 'tekrarlanamaz', wrong: 'tekrarlanabilir' }
];

function familyRepeat() {
  return buildFamily('sr-repeatability', {
    select(id, pathId, random) {
      const item = pick(REP, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'renk', 'ses'], random, {
        raw: `“${item.act}”. Tekrarlanabilirlik?`,
        strategy: 'Başkası aynı yöntemi uygulayabilir mi bak.',
        explanation: `${item.act} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(REP, random);
      return roundChoice(id, pathId, 'YONTEM-ACIK', ['GIZLI', 'RENK', 'SARKI'], random, {
        raw: `“${item.act}” için zorunlu koşul?`,
        explanation: 'Yöntemin açık olması zorunludur.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(REP, random);
      return roundChoice(id, pathId, item.wrong, [item.answer, 'yontem', 'tekrar'], random, {
        raw: `“${item.act}” için hangisi yanlış etikettir?`,
        explanation: `${item.wrong} hatalıdır.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(REP, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.answer}. B: ${item.wrong}. Hangisi?`,
        explanation: 'A doğru tekrarlanabilirlik etiketidir.'
      });
    }
  });
}

const MODEL = [
  { claim: 'model her şeyi açıklar', answer: 'asim', wrong: 'sinirli' },
  { claim: 'model belirli koşulda', answer: 'sinirli', wrong: 'asim' },
  { claim: 'basitleştirme vardır', answer: 'sinirli', wrong: 'asim' },
  { claim: 'istisnasız evrensel', answer: 'asim', wrong: 'sinirli' }
];

function familyModel() {
  return buildFamily('sr-model-limits', {
    select(id, pathId, random) {
      const item = pick(MODEL, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'renk', 'ses'], random, {
        raw: `“${item.claim}”. Model değerlendirmesi?`,
        strategy: 'Model sınırını aşma.',
        explanation: `${item.claim} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(MODEL, random);
      return roundChoice(id, pathId, 'SINIR-KONTROL', ['EVRENSEL-SAN', 'RENK', 'SARKI'], random, {
        raw: `“${item.claim}” için zorunlu işlem?`,
        explanation: 'Sınır kontrolü zorunludur.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(MODEL, random);
      return roundChoice(id, pathId, item.wrong === 'asim' ? 'asim' : 'sinir-yok-say', [item.answer, 'model', 'sinir'].slice(0, 3), random, {
        raw: `“${item.claim}” için hangisi model ihlalidir?`,
        explanation: 'Model sınırını aşmak ihlaldir.'
      });
    },
    compare(id, pathId, random) {
      const item = pick(MODEL, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.answer}. B: ${item.wrong}. Hangisi?`,
        explanation: 'A doğru model değerlendirmesidir.'
      });
    }
  });
}

const MIS = [
  { text: 'İki değişkeni yok saydı.', error: SR_MISREAD.CONF },
  { text: 'Hassası doğru sandı.', error: SR_MISREAD.PREC },
  { text: 'Sabiti bağımsız sandı.', error: SR_MISREAD.VAR },
  { text: 'Tek gözlemi güçlü kanıt sandı.', error: SR_MISREAD.EV }
];

function familyMisread() {
  return buildFamily('sr-misread-taxonomy', {
    select(id, pathId, random) {
      const item = pick(MIS, random);
      const distractors = Object.values(SR_MISREAD).filter((e) => e !== item.error);
      return roundChoice(id, pathId, item.error, distractors.slice(0, 3), random, {
        raw: `${item.text} Yanlış okuma türü?`,
        explanation: `${item.text} → ${item.error}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(MIS, random);
      return roundChoice(id, pathId, item.error, Object.values(SR_MISREAD).filter((e) => e !== item.error).slice(0, 3), random, {
        raw: `${item.text} Zorunlu etiket?`,
        explanation: `Zorunlu: ${item.error}.`
      });
    },
    spot(id, pathId, random) {
      const item = pick(MIS, random);
      return roundChoice(id, pathId, item.error, shuffle(Object.values(SR_MISREAD).filter((e) => e !== item.error), random).slice(0, 3), random, {
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
        `${SR_MISREAD.CONF}|${SR_MISREAD.CONF}`,
        `${SR_MISREAD.EV}|${SR_MISREAD.EV}`,
        `${b.error}|${a.error}`
      ].filter((x) => x !== answer);
      return roundChoice(id, pathId, answer, distractors.slice(0, 3), random, {
        raw: `A: ${a.text} · B: ${b.text}. Etiket çifti (A|B)?`,
        explanation: `A→${a.error}, B→${b.error}`
      });
    }
  });
}

export const SCIENCE_REASONING_FAMILIES = [
  familyHeat(),
  familyIV(),
  familyFriction(),
  familyRate(),
  familyConfound(),
  familyPrecision(),
  familyHypothesis(),
  familyEvidence(),
  familyControlGroup(),
  familyRepeat(),
  familyModel(),
  familyMisread()
];
