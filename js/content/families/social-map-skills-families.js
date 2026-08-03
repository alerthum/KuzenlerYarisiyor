// Aşama 04 — social-map-skills (Harita ve Dünya).
// UI: tüm iskeletler kind:'choice'.
// Aile = coğrafya düşüncesi (yön, ölçek, lejant, enlem/boylam, iklim, yer şekli,
// kaynak-yer, nüfus, rota, sınır, harita türü, yanlış okuma).
// Yüzey yer adı değişimi ≠ yeni aile. Cevaplar kısa (answer_leak kapısı).

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
  return `social-map-skills:${skeletonId}:${pathId}:${simpleHash(raw)}`;
}

const PATH_IDS = ['raw-letters', 'context-embedded', 'staged-strategy-hint'];

const TASK_TRAITS = {
  select: ['strategySelection', 'multiStepInference'],
  forced: ['informationLinking', 'conditionEvaluation'],
  spot: ['errorAnalysis', 'conditionEvaluation'],
  compare: ['strategySelection', 'usingIntermediateResultInNewDecision']
};

export const SM_MISREAD = {
  DIR: 'yon-hatasi',
  SCALE: 'olcek-hatasi',
  LEGEND: 'lejant-hatasi',
  TYPE: 'harita-turu'
};

function pathWrap(pathId, rawPrompt, contextHint, strategyHint) {
  if (pathId === 'raw-letters') {
    return {
      prompt: rawPrompt,
      context: contextHint || 'Harita düşünme türünü ayır; yüzey yer adı tuzağına düşme.'
    };
  }
  if (pathId === 'context-embedded') {
    return {
      prompt: `Coğrafya atölyesinde tartışılan bir örnek: ${rawPrompt}`,
      context: 'Senaryo süsünü ayıkla; yalnız harita bilgisinin türüne odaklan.'
    };
  }
  return {
    prompt: `${strategyHint || 'Önce hangi harita becerisini kullandığını belirle, sonra seçenekleri eleye.'} ${rawPrompt}`,
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

// ---- 1. sm-cardinal-direction ----
const DIR = [
  { from: 'okul', to: 'park', answer: 'kuzey', wrong: 'güney' },
  { from: 'liman', to: 'dağ', answer: 'doğu', wrong: 'batı' },
  { from: 'köprü', to: 'çayır', answer: 'güney', wrong: 'kuzey' },
  { from: 'istasyon', to: 'göl', answer: 'batı', wrong: 'doğu' }
];

function familyCardinal() {
  return buildFamily('sm-cardinal-direction', {
    select(id, pathId, random) {
      const item = pick(DIR, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'merkez', 'rastgele'], random, {
        raw: `Haritada ${item.from} → ${item.to} yönü hangisidir?`,
        strategy: 'Pusula okunu sabitle, sonra hedefi oku.',
        explanation: `Yön: ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(DIR, random);
      return roundChoice(id, pathId, 'yon', ['olcek', 'lejant', 'iklim'], random, {
        raw: `“${item.from}→${item.to}” için zorunlu işlem hangisidir?`,
        explanation: 'Bu bir yön okumasıdır.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(DIR, random);
      return roundChoice(id, pathId, item.wrong, [item.answer, 'doğru yön', 'pusula'], random, {
        raw: `“${item.from}→${item.to}” için hangisi yön ihlalidir?`,
        explanation: `${item.wrong} ters/yanlış yöndür.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(DIR, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.answer}. B: ${item.wrong}. ${item.from}→${item.to} hangisi?`,
        explanation: 'A doğru yöndür.'
      });
    }
  });
}

// ---- 2. sm-scale-distance ----
const SCALE = [
  { bar: '1 cm=10 km', measure: '3 cm', answer: '30 km', wrong: '3 km' },
  { bar: '1 cm=5 km', measure: '4 cm', answer: '20 km', wrong: '4 km' },
  { bar: '1 cm=2 km', measure: '6 cm', answer: '12 km', wrong: '6 km' },
  { bar: '1 cm=20 km', measure: '2 cm', answer: '40 km', wrong: '20 km' }
];

function familyScale() {
  return buildFamily('sm-scale-distance', {
    select(id, pathId, random) {
      const item = pick(SCALE, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, '1 km', '100 km'], random, {
        raw: `Ölçek ${item.bar}. Haritada ${item.measure} gerçek mesafe?`,
        strategy: 'Ölçek × ölçüm = gerçek mesafe.',
        explanation: `${item.measure} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(SCALE, random);
      return roundChoice(id, pathId, 'olcek', ['yon', 'lejant', 'iklim'], random, {
        raw: `“${item.bar}, ${item.measure}” için zorunlu işlem hangisidir?`,
        explanation: 'Mesafe için ölçek gerekir.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(SCALE, random);
      return roundChoice(id, pathId, item.wrong, [item.answer, 'doğru çarpım', 'ölçekli'], random, {
        raw: `Ölçek ${item.bar}, ${item.measure} için hangisi mesafe ihlalidir?`,
        explanation: `${item.wrong} ölçeği yok sayar.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(SCALE, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.answer}. B: ${item.wrong}. Hangisi geçerli?`,
        explanation: 'A ölçekle hesaplanmıştır.'
      });
    }
  });
}

// ---- 3. sm-legend-symbol ----
const LEGEND = [
  { symbol: 'mavi çizgi', meaning: 'ırmak', wrong: 'sınır' },
  { symbol: 'üçgen', meaning: 'dağ', wrong: 'şehir' },
  { symbol: 'nokta', meaning: 'yerleşim', wrong: 'orman' },
  { symbol: 'yeşil alan', meaning: 'orman', wrong: 'deniz' }
];

function familyLegend() {
  return buildFamily('sm-legend-symbol', {
    select(id, pathId, random) {
      const item = pick(LEGEND, random);
      return roundChoice(id, pathId, item.meaning, [item.wrong, 'renk', 'rastgele'], random, {
        raw: `Lejantta “${item.symbol}” neyi gösterir?`,
        strategy: 'Sembolü lejantla eşleştir.',
        explanation: `${item.symbol} → ${item.meaning}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(LEGEND, random);
      return roundChoice(id, pathId, 'lejant', ['yon', 'olcek', 'iklim'], random, {
        raw: `“${item.symbol}→${item.meaning}” için zorunlu araç hangisidir?`,
        explanation: 'Sembol anlamı lejanttadır.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(LEGEND, random);
      return roundChoice(id, pathId, item.wrong, [item.meaning, 'doğru eşleme', 'lejant'], random, {
        raw: `“${item.symbol}” için hangisi lejant ihlalidir?`,
        explanation: `${item.wrong} yanlış eşlemedir.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(LEGEND, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.meaning}. B: ${item.wrong}. “${item.symbol}” hangisi?`,
        explanation: 'A lejantla uyumludur.'
      });
    }
  });
}

// ---- 4. sm-lat-long ----
const LATLONG = [
  { clue: 'ekvatora yakın', answer: 'dusuk-enlem', wrong: 'yuksek-enlem' },
  { clue: 'kutuplara yakın', answer: 'yuksek-enlem', wrong: 'dusuk-enlem' },
  { clue: 'başlangıç meridyeni', answer: 'boylam-0', wrong: 'enlem-0' },
  { clue: 'ekvator çizgisi', answer: 'enlem-0', wrong: 'boylam-0' }
];

function familyLatLong() {
  return buildFamily('sm-lat-long', {
    select(id, pathId, random) {
      const item = pick(LATLONG, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'olcek', 'lejant'], random, {
        raw: `“${item.clue}” hangi konum bilgisini verir?`,
        strategy: 'Enlem yatay, boylam dikey düşün.',
        explanation: `${item.clue} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(LATLONG, random);
      return roundChoice(id, pathId, 'konum', ['lejant', 'nufus', 'rota'], random, {
        raw: `“${item.clue}” için zorunlu bilgi türü hangisidir?`,
        explanation: 'Enlem/boylam konum bilgisidir.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(LATLONG, random);
      return roundChoice(id, pathId, item.wrong, [item.answer, 'doğru okuma', 'ızgara'], random, {
        raw: `“${item.clue}” için hangisi konum ihlalidir?`,
        explanation: `${item.wrong} yanlış ızgara okumasıdır.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(LATLONG, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.answer}. B: ${item.wrong}. Hangisi geçerli?`,
        explanation: 'A doğru konum okumasıdır.'
      });
    }
  });
}

// ---- 5. sm-climate-zone ----
const CLIMATE = [
  { place: 'ekvator kuşağı', answer: 'sicak', wrong: 'soguk' },
  { place: 'kutup kuşağı', answer: 'soguk', wrong: 'sicak' },
  { place: 'orta kuşak', answer: 'iliman', wrong: 'sicak' },
  { place: 'çöl bölgesi', answer: 'kurak', wrong: 'nemli' }
];

function familyClimate() {
  return buildFamily('sm-climate-zone', {
    select(id, pathId, random) {
      const item = pick(CLIMATE, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'rastgele', 'renk'], random, {
        raw: `“${item.place}” için tipik iklim hangisidir?`,
        strategy: 'Kuşak ile sıcaklık/yağış bağını kur.',
        explanation: `${item.place} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(CLIMATE, random);
      return roundChoice(id, pathId, 'iklim', ['yon', 'olcek', 'sinir'], random, {
        raw: `“${item.place}” için zorunlu okuma hangisidir?`,
        explanation: 'Bu iklim kuşağı okumasıdır.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(CLIMATE, random);
      return roundChoice(id, pathId, item.wrong, [item.answer, 'uygun kuşak', 'iklim'], random, {
        raw: `“${item.place}” için hangisi iklim ihlalidir?`,
        explanation: `${item.wrong} kuşağa uymaz.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(CLIMATE, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.answer}. B: ${item.wrong}. “${item.place}” hangisi?`,
        explanation: 'A tipik iklimdir.'
      });
    }
  });
}

// ---- 6. sm-landform ----
const LAND = [
  { clue: 'yüksek sivri', answer: 'dag', wrong: 'ova' },
  { clue: 'düz geniş', answer: 'ova', wrong: 'dag' },
  { clue: 'deniz girintisi', answer: 'korfez', wrong: 'ada' },
  { clue: 'su çevrili kara', answer: 'ada', wrong: 'korfez' }
];

function familyLandform() {
  return buildFamily('sm-landform', {
    select(id, pathId, random) {
      const item = pick(LAND, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'iklim', 'nufus'], random, {
        raw: `“${item.clue}” hangi yer şeklidir?`,
        strategy: 'Biçim ipucunu yer şekliyle eşleştir.',
        explanation: `${item.clue} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(LAND, random);
      return roundChoice(id, pathId, 'sekil', ['nufus', 'lejant', 'rota'], random, {
        raw: `“${item.clue}” için zorunlu kategori hangisidir?`,
        explanation: 'Bu yer şekli sınıflamasıdır.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(LAND, random);
      return roundChoice(id, pathId, item.wrong, [item.answer, 'doğru şekil', 'fiziki'], random, {
        raw: `“${item.clue}” için hangisi yer şekli ihlalidir?`,
        explanation: `${item.wrong} biçime uymaz.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(LAND, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.answer}. B: ${item.wrong}. Hangisi geçerli?`,
        explanation: 'A doğru yer şeklidir.'
      });
    }
  });
}

// ---- 7. sm-resource-location ----
const RES = [
  { resource: 'balık', place: 'kıyı', wrong: 'çöl' },
  { resource: 'odun', place: 'orman', wrong: 'buzul' },
  { resource: 'maden', place: 'dağ', wrong: 'açık deniz' },
  { resource: 'pamuk', place: 'verimli ova', wrong: 'kutup' }
];

function familyResource() {
  return buildFamily('sm-resource-location', {
    select(id, pathId, random) {
      const item = pick(RES, random);
      return roundChoice(id, pathId, item.place, [item.wrong, 'rastgele', 'uzak'], random, {
        raw: `“${item.resource}” kaynağı en çok nerede beklenir?`,
        strategy: 'Kaynak ile ortam bağını kur.',
        explanation: `${item.resource} → ${item.place}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(RES, random);
      return roundChoice(id, pathId, 'kaynak', ['yon', 'olcek', 'sinir'], random, {
        raw: `“${item.resource}/${item.place}” için zorunlu ilişki hangisidir?`,
        explanation: 'Kaynak-yer ilişkisidir.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(RES, random);
      return roundChoice(id, pathId, item.wrong, [item.place, 'uygun ortam', 'kaynak'], random, {
        raw: `“${item.resource}” için hangisi yer ihlalidir?`,
        explanation: `${item.wrong} kaynakla uyumsuzdur.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(RES, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.place}. B: ${item.wrong}. “${item.resource}” hangisi?`,
        explanation: 'A kaynak-yer bağıdır.'
      });
    }
  });
}

// ---- 8. sm-population-density ----
const POP = [
  { clue: 'küçük alan, çok insan', answer: 'yogun', wrong: 'seyrek' },
  { clue: 'geniş alan, az insan', answer: 'seyrek', wrong: 'yogun' },
  { clue: 'şehir merkezi', answer: 'yogun', wrong: 'seyrek' },
  { clue: 'yüksek dağ köyü', answer: 'seyrek', wrong: 'yogun' }
];

function familyPopulation() {
  return buildFamily('sm-population-density', {
    select(id, pathId, random) {
      const item = pick(POP, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'olcek', 'yon'], random, {
        raw: `“${item.clue}” nüfus yoğunluğu hangisidir?`,
        strategy: 'İnsan sayısı ÷ alan düşün.',
        explanation: `${item.clue} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(POP, random);
      return roundChoice(id, pathId, 'nufus', ['lejant', 'iklim', 'yon'], random, {
        raw: `“${item.clue}” için zorunlu okuma hangisidir?`,
        explanation: 'Nüfus yoğunluğu okumasıdır.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(POP, random);
      return roundChoice(id, pathId, item.wrong, [item.answer, 'doğru yoğunluk', 'nüfus'], random, {
        raw: `“${item.clue}” için hangisi yoğunluk ihlalidir?`,
        explanation: `${item.wrong} ipucuyla çelişir.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(POP, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.answer}. B: ${item.wrong}. Hangisi geçerli?`,
        explanation: 'A doğru yoğunluktur.'
      });
    }
  });
}

// ---- 9. sm-route-planning ----
const ROUTE = [
  { goal: 'en kısa yol', answer: 'kisa', wrong: 'dolambac' },
  { goal: 'dağdan kaçın', answer: 'ovadan', wrong: 'zirveden' },
  { goal: 'nehir geç', answer: 'kopru', wrong: 'tesaduf' },
  { goal: 'limana in', answer: 'kiyiya', wrong: 'ice' }
];

function familyRoute() {
  return buildFamily('sm-route-planning', {
    select(id, pathId, random) {
      const item = pick(ROUTE, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'rastgele', 'ters'], random, {
        raw: `Hedef “${item.goal}” iken uygun rota seçimi hangisidir?`,
        strategy: 'Engel ve hedefi birlikte düşün.',
        explanation: `${item.goal} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(ROUTE, random);
      return roundChoice(id, pathId, 'rota', ['iklim', 'lejant', 'nufus'], random, {
        raw: `“${item.goal}” için zorunlu işlem hangisidir?`,
        explanation: 'Bu rota planlamasıdır.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(ROUTE, random);
      return roundChoice(id, pathId, item.wrong, [item.answer, 'uygun rota', 'plan'], random, {
        raw: `“${item.goal}” için hangisi rota ihlalidir?`,
        explanation: `${item.wrong} hedefe aykırıdır.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(ROUTE, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.answer}. B: ${item.wrong}. Hangisi geçerli?`,
        explanation: 'A hedefe uygundur.'
      });
    }
  });
}

// ---- 10. sm-border-region ----
const BORDER = [
  { clue: 'iki ülke arası çizgi', answer: 'sinir', wrong: 'nehir-adi' },
  { clue: 'aynı iklimli geniş alan', answer: 'bolge', wrong: 'sinir' },
  { clue: 'başkentin bağlı olduğu alan', answer: 'ulke', wrong: 'kita' },
  { clue: 'çok ülke kapsayan kara', answer: 'kita', wrong: 'il' }
];

function familyBorder() {
  return buildFamily('sm-border-region', {
    select(id, pathId, random) {
      const item = pick(BORDER, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'olcek', 'lejant'], random, {
        raw: `“${item.clue}” hangi siyasi/coğrafi birimdir?`,
        strategy: 'Ölçek düzeyini (sınır/bölge/ülke) ayır.',
        explanation: `${item.clue} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(BORDER, random);
      return roundChoice(id, pathId, 'bolgesel', ['iklim', 'olcek', 'yon'], random, {
        raw: `“${item.clue}” için zorunlu okuma hangisidir?`,
        explanation: 'Sınır/bölge okumasıdır.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(BORDER, random);
      return roundChoice(id, pathId, item.wrong, [item.answer, 'doğru birim', 'harita'], random, {
        raw: `“${item.clue}” için hangisi birim ihlalidir?`,
        explanation: `${item.wrong} yanlış düzeydir.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(BORDER, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.answer}. B: ${item.wrong}. Hangisi geçerli?`,
        explanation: 'A doğru birimdir.'
      });
    }
  });
}

// ---- 11. sm-map-type ----
const MAPTYPE = [
  { need: 'dağ-ova görmek', answer: 'fiziki', wrong: 'siyasi' },
  { need: 'ülke sınırları', answer: 'siyasi', wrong: 'fiziki' },
  { need: 'yağış dağılımı', answer: 'tematik', wrong: 'siyasi' },
  { need: 'yol ağı', answer: 'tematik', wrong: 'fiziki' }
];

function familyMapType() {
  return buildFamily('sm-map-type', {
    select(id, pathId, random) {
      const item = pick(MAPTYPE, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'rastgele', 'yok'], random, {
        raw: `Amaç “${item.need}” iken hangi harita türü gerekir?`,
        strategy: 'Amaca göre harita türünü seç.',
        explanation: `${item.need} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(MAPTYPE, random);
      return roundChoice(id, pathId, 'tur', ['yon', 'nufus', 'renk'], random, {
        raw: `“${item.need}” için zorunlu karar hangisidir?`,
        explanation: 'Harita türü seçimi zorunludur.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(MAPTYPE, random);
      return roundChoice(id, pathId, item.wrong, [item.answer, 'uygun tür', 'amaç'], random, {
        raw: `“${item.need}” için hangisi tür ihlalidir?`,
        explanation: `${item.wrong} amaca uymaz.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(MAPTYPE, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.answer}. B: ${item.wrong}. Hangisi geçerli?`,
        explanation: 'A amaçla uyumludur.'
      });
    }
  });
}

// ---- 12. sm-misread-taxonomy ----
const MISREAD = [
  { example: 'kuzeyi güney sanmak', type: SM_MISREAD.DIR },
  { example: 'cm’yi km sanmak', type: SM_MISREAD.SCALE },
  { example: 'üçgeni şehir sanmak', type: SM_MISREAD.LEGEND },
  { example: 'fiziki haritada sınır aramak', type: SM_MISREAD.TYPE }
];

function familyMisread() {
  return buildFamily('sm-misread-taxonomy', {
    select(id, pathId, random) {
      const item = pick(MISREAD, random);
      const distractors = Object.values(SM_MISREAD).filter((t) => t !== item.type);
      return roundChoice(id, pathId, item.type, distractors.slice(0, 3), random, {
        raw: `“${item.example}” hangi yanlış okuma türüdür?`,
        strategy: 'Hata hücresini sınıflandır.',
        explanation: `Taksonomi: ${item.type}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(MISREAD, random);
      const distractors = Object.values(SM_MISREAD).filter((t) => t !== item.type);
      return roundChoice(id, pathId, item.type, distractors.slice(0, 3), random, {
        raw: `“${item.example}” için zorunlu etiket hangisidir?`,
        explanation: `Zorunlu etiket: ${item.type}.`
      });
    },
    spot(id, pathId, random) {
      const item = pick(MISREAD, random);
      const wrongLabel = Object.values(SM_MISREAD).find((t) => t !== item.type);
      const others = Object.values(SM_MISREAD).filter((t) => t !== wrongLabel);
      return roundChoice(id, pathId, wrongLabel, [item.type, others[0], others[1] || others[0]], random, {
        raw: `Doğru tür ${item.type} iken hangisi yanlış etikettir?`,
        explanation: `Doğru: ${item.type}.`
      });
    },
    compare(id, pathId, random) {
      const a = MISREAD[0];
      const b = MISREAD[1];
      return roundChoice(id, pathId, `${a.type}≠${b.type}`, ['ayni', 'ikisi-yon', 'ikisi-olcek'], random, {
        raw: `A: “${a.example}”→${a.type}. B: “${b.example}”→${b.type}. İlişki?`,
        explanation: 'Farklı yanlış-okuma hücreleri.'
      });
    }
  });
}

export const SOCIAL_MAP_SKILLS_FAMILIES = [
  familyCardinal(),
  familyScale(),
  familyLegend(),
  familyLatLong(),
  familyClimate(),
  familyLandform(),
  familyResource(),
  familyPopulation(),
  familyRoute(),
  familyBorder(),
  familyMapType(),
  familyMisread()
];
