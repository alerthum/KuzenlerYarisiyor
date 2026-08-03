// Aşama 04 — logic-station (Zekâ İstasyonu).
// Cevap seçenekleri kısa kod (<12 normalize) — answer_leak kapısı için;
// açıklama alanı uzun olabilir.

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

function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

function wrapKey(skeletonId, pathId, raw) {
  return `logic-station:${skeletonId}:${pathId}:${simpleHash(raw)}`;
}

const PATH_IDS = ['raw-clues', 'context-embedded', 'staged-strategy-hint'];
const TASK_TRAITS = {
  select: ['conditionEvaluation', 'multiStepInference'],
  forced: ['informationLinking', 'multiStepInference'],
  spot: ['errorAnalysis', 'conditionEvaluation'],
  compare: ['strategySelection', 'usingIntermediateResultInNewDecision']
};

const DAY_ABBR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const NAMES = ['Ada', 'Bora', 'Cem', 'Deniz', 'Ece', 'Fatih', 'Gül', 'Hakan', 'Işıl', 'Jale', 'Kaan', 'Lale'];

function dayAbbr(idx) {
  return DAY_ABBR[idx];
}

function chainOrder(a, b, c) {
  return `${a[0]}>${b[0]}>${c[0]}`;
}

function dirNet(east, north) {
  return `D${east}K${north}`;
}

function teamPick(must, ban) {
  return `+${must[0]}-${ban[0]}`;
}

function matchRow(p1, p2, p3) {
  return `${p1[0]}K/${p2[0]}M/${p3[0]}Y`;
}

const TRUTH_OK = 'A=Y,B=D,C=D';
const SCHED_OK = 'Sa-M/Ça-F/Pe-T';

function pathWrap(pathId, rawPrompt, contextHint, strategyHint) {
  if (pathId === 'raw-clues') {
    return { prompt: rawPrompt, context: contextHint || 'İpuçlarını sırayla birleştir; çelişen olasılıkları ele.' };
  }
  if (pathId === 'context-embedded') {
    return {
      prompt: `Sınıfta çözülen bir mantık sorusu: ${rawPrompt}`,
      context: 'Senaryodaki gereksiz ayrıntıları ayıkla; yalnız mantıksal ipuçlarına odaklan.'
    };
  }
  return {
    prompt: `${strategyHint || 'Önce sabit kısıtları işaretle, sonra olasılıkları eleyerek ilerle.'} ${rawPrompt}`,
    context: 'Strateji ipucu cevabı doğrudan vermez; yalnız düşünme sırasını gösterir.'
  };
}

function roundChoice(skeletonId, pathId, answerText, distractors, random, texts) {
  const pool = [answerText, ...distractors];
  const unique = [...new Set(pool)];
  while (unique.length < 4) unique.push(`X${unique.length}`);
  const options = shuffle(unique.slice(0, 4), random);
  const answerIndex = options.indexOf(answerText);
  const { prompt, context } = pathWrap(pathId, texts.raw, texts.context, texts.strategy);
  const instanceNonce = Math.floor(random() * 1e9).toString(36);
  return {
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

function pickThreeNames(random) {
  const pool = shuffle([...NAMES], random);
  return [pool[0], pool[1], pool[2]];
}

function applySwitchToggle(bits, toggles) {
  const next = [...bits];
  for (const t of toggles) next[t - 1] = 1 - next[t - 1];
  return next;
}

function switchesOnShort(bits) {
  const on = bits.map((b, i) => (b ? i + 1 : null)).filter(Boolean);
  if (!on.length) return '0';
  if (on.length === 1) return String(on[0]);
  return `${on.slice(0, -1).join('+')} ve ${on[on.length - 1]}`;
}

// ---- 1. ls-multi-clue-order ----
function familyMultiClueOrder() {
  return buildFamily('ls-multi-clue-order', {
    select(id, pathId, random) {
      const [a, b, c] = pickThreeNames(random);
      const answer = chainOrder(a, b, c);
      return roundChoice(id, pathId, answer, [
        chainOrder(b, a, c),
        chainOrder(a, c, b),
        chainOrder(c, b, a)
      ], random, {
        raw: `Üç kişi sırayla duruyor. İpuçları: (1) ${a}, ${b}'den öndedir. (2) ${c} ortada değildir. (3) ${b}, ${c}'den öndedir. Sıra kodu (X>Y>Z)?`,
        strategy: 'Sabit kısıtları yaz; ortada olmayan kişiyi ve öncelik zincirini birleştir.',
        explanation: `${a}→${b}→${c} tek tutarlı sıra; kod ${answer}.`
      });
    },
    forced(id, pathId, random) {
      const [a, b, c] = pickThreeNames(random);
      const answer = a[0];
      return roundChoice(id, pathId, answer, [b[0], c[0], '?'], random, {
        raw: `${a} her zaman ${b}'den öndedir; ${b} her zaman ${c}'den öndedir. En öndeki kişinin baş harfi?`,
        explanation: `Zincir ${a}→${b}→${c}; en önde ${a} (${answer}).`
      });
    },
    spot(id, pathId, random) {
      const [a, b, c] = pickThreeNames(random);
      const bad = chainOrder(b, a, c);
      return roundChoice(id, pathId, bad, [
        chainOrder(a, b, c),
        chainOrder(a, c, b),
        chainOrder(c, a, b)
      ], random, {
        raw: `İpuçları: ${a} ${b}'den önde; ${c} ortada değil; ${b} ${c}'den önde. Hangi sıra kodu ipuçlarını BOZAR?`,
        explanation: `${bad}: ${a}, ${b}'den sonra gelir — 1. ipucu ihlal.`
      });
    },
    compare(id, pathId, random) {
      const [a, b, c] = pickThreeNames(random);
      const good = chainOrder(a, b, c);
      const bad = chainOrder(a, c, b);
      return roundChoice(id, pathId, good, [bad, chainOrder(b, a, c), chainOrder(c, b, a)], random, {
        raw: `İpuçları: ${a} ${b}'den önde; ${c} ortada değil; ${b} ${c}'den önde. Tutarlı sıra kodu?`,
        explanation: `Yalnız ${good}; ${bad}'de ${b}, ${c}'den sonra gelir.`
      });
    }
  });
}

// ---- 2. ls-weekly-schedule ----
function familyWeeklySchedule() {
  return buildFamily('ls-weekly-schedule', {
    select(id, pathId, random) {
      const todayIdx = randomInt(random, 0, 6);
      const offset = randomInt(random, 2, 9);
      const answer = dayAbbr((todayIdx + offset) % 7);
      return roundChoice(id, pathId, answer, shuffle(DAY_ABBR.filter((d) => d !== answer), random).slice(0, 3), random, {
        raw: `Bugün ${dayAbbr(todayIdx)}. ${offset} gün sonra hangi gün kısaltması doğrudur?`,
        explanation: `${dayAbbr(todayIdx)} + ${offset} gün = ${answer}.`
      });
    },
    forced(id, pathId, random) {
      const todayIdx = randomInt(random, 0, 6);
      const offset = randomInt(random, 1, 6);
      const answer = dayAbbr((todayIdx + offset) % 7);
      return roundChoice(id, pathId, answer, shuffle(DAY_ABBR.filter((d) => d !== answer), random).slice(0, 3), random, {
        raw: `Bugün kesinlikle ${dayAbbr(todayIdx)}. Tam ${offset} gün sonra gün kısaltması ne olmalıdır?`,
        explanation: `Mod 7 ile ${offset} gün ileri → ${answer}.`
      });
    },
    spot(id, pathId, random) {
      const todayIdx = randomInt(random, 0, 6);
      const offset = randomInt(random, 3, 10);
      const wrong = dayAbbr((todayIdx + offset + 1) % 7);
      const correct = dayAbbr((todayIdx + offset) % 7);
      return roundChoice(id, pathId, wrong, [correct, dayAbbr((todayIdx + offset + 2) % 7), dayAbbr((todayIdx + offset - 1 + 7) % 7)], random, {
        raw: `Bugün ${dayAbbr(todayIdx)}. ${offset} gün sonrası için bir öğrenci bir gün fazla saymış. Yanlış kısaltma hangisi?`,
        explanation: `Doğru ${correct}; ${wrong} bir gün fazladır.`
      });
    },
    compare(id, pathId, random) {
      const todayIdx = randomInt(random, 0, 6);
      const offset = randomInt(random, 4, 11);
      const correct = dayAbbr((todayIdx + offset) % 7);
      const wrong = dayAbbr((todayIdx + offset + 1) % 7);
      return roundChoice(id, pathId, correct, [wrong, dayAbbr((todayIdx + offset + 2) % 7), dayAbbr((todayIdx + offset + 3) % 7)], random, {
        raw: `Bugün ${dayAbbr(todayIdx)}. ${offset} gün sonraki doğru kısaltmayı seç (mod-7 sayım).`,
        explanation: `${offset} gün sonrası ${correct}; diğerleri fazla/eksik sayım.`
      });
    }
  });
}

// ---- 3. ls-conditional-team ----
function familyConditionalTeam() {
  return buildFamily('ls-conditional-team', {
    select(id, pathId, random) {
      const must = pick(NAMES, random);
      let ban = pick(NAMES, random);
      while (ban === must) ban = pick(NAMES, random);
      const answer = teamPick(must, ban);
      return roundChoice(id, pathId, answer, [
        teamPick(ban, must),
        `+${must[0]}+${ban[0]}`,
        `-${must[0]}-${ban[0]}`
      ], random, {
        raw: `Takım kuralları: ${must} mutlaka seçilir; ${ban} asla seçilmez. Uygun seçim kodu (+zorunlu -yasak)?`,
        explanation: `${must} zorunlu, ${ban} yasak → ${answer}.`
      });
    },
    forced(id, pathId, random) {
      const must = pick(NAMES, random);
      const answer = must[0];
      const others = shuffle(NAMES.filter((n) => n !== must), random).slice(0, 3).map((n) => n[0]);
      return roundChoice(id, pathId, answer, others, random, {
        raw: `${must} takıma girmek ZORUNLU. Diğerleri serbest. Zorunlu kişinin baş harfi?`,
        explanation: `Kural yalnız ${must}'yı zorunlu kılar (${answer}).`
      });
    },
    spot(id, pathId, random) {
      const must = pick(NAMES, random);
      let ban = pick(NAMES, random);
      while (ban === must) ban = pick(NAMES, random);
      const violation = teamPick(ban, must);
      return roundChoice(id, pathId, violation, [
        teamPick(must, ban),
        `+${must[0]}`,
        `-${ban[0]}`
      ], random, {
        raw: `Kurallar: ${must} zorunlu; ${ban} yasak. Hangi kod KURAL İHLALİDİR?`,
        explanation: `${violation}: yasak ${ban} alınmış, zorunlu ${must} yok.`
      });
    },
    compare(id, pathId, random) {
      const must = pick(NAMES, random);
      let ban = pick(NAMES, random);
      while (ban === must) ban = pick(NAMES, random);
      const good = teamPick(must, ban);
      const bad = teamPick(ban, must);
      return roundChoice(id, pathId, good, [bad, `+${must[0]}+${ban[0]}`, `00`], random, {
        raw: `${must} zorunlu, ${ban} yasak. Tutarlı seçim kodu hangisi?`,
        explanation: `${good} kurallara uyar; ${bad} hem yasağı hem zorunluluğu ihlal eder.`
      });
    }
  });
}

// ---- 4. ls-truth-liar-trio ----
function familyTruthLiarTrio() {
  return buildFamily('ls-truth-liar-trio', {
    select(id, pathId, random) {
      const answer = TRUTH_OK;
      return roundChoice(id, pathId, answer, [
        'B=Y,A=D,C=D',
        'C=Y,A=D,B=D',
        'A=Y,B=Y,C=Y'
      ], random, {
        raw: `Ada: "Bora yalancıdır." Bora: "Cem doğrucudur." Cem: "Ada yalancıdır." Tutarlı kod (Y=yalancı, D=doğrucu)?`,
        strategy: 'Her olası yalancıyı dene; çelişen atamayı ele.',
        explanation: `Ada yalancı → Bora doğrucu → Cem doğrucu → ${answer}.`
      });
    },
    forced(id, pathId, random) {
      const answer = 'A=Y';
      return roundChoice(id, pathId, answer, ['B=Y', 'C=Y', '0=Y'], random, {
        raw: `Ada: "Bora yalancıdır." Bora: "Cem doğrucudur." Cem: "Ada yalancıdır." Yalancı kodu (X=Y)?`,
        explanation: `Yalnız Ada yalancı ataması tutarlı → ${answer}.`
      });
    },
    spot(id, pathId, random) {
      const answer = 'B=Y';
      return roundChoice(id, pathId, answer, ['A=Y', 'C=Y', 'Hepsi=D'], random, {
        raw: `Aynı üç ifade. Hangi yalancı kodu tutarsızdır / imkânsızdır?`,
        explanation: `Bora yalancı varsayımı çelişir; yalnız Ada-yalancı modeli çalışır.`
      });
    },
    compare(id, pathId, random) {
      const answer = 'W1';
      return roundChoice(id, pathId, answer, ['W2', 'W3', 'W4'], random, {
        raw: `Ada→Bora yalancı; Bora→Cem doğrucu; Cem→Ada yalancı. Tutarlı dünya kodu?`,
        explanation: `W1 = Ada yalancı (${TRUTH_OK}); diğerleri çelişki üretir.`
      });
    }
  });
}

// ---- 5. ls-two-step-code ----
function familyTwoStepCode() {
  return buildFamily('ls-two-step-code', {
    select(id, pathId, random) {
      const start = randomInt(random, 10, 40);
      const add = randomInt(random, 2, 9);
      const mul = randomInt(random, 2, 4);
      const answer = String((start + add) * mul);
      return roundChoice(id, pathId, answer, [
        String(start + add * mul),
        String(start * mul + add),
        String((start + add) + mul)
      ], random, {
        raw: `Başlangıç: ${start}. Adım 1: ${add} ekle. Adım 2: sonucu ${mul} ile çarp. Kod kaçtır?`,
        explanation: `(${start}+${add})×${mul}=${answer}.`
      });
    },
    forced(id, pathId, random) {
      const start = randomInt(random, 5, 25);
      const add = randomInt(random, 3, 8);
      const answer = String((start + add) * 2);
      return roundChoice(id, pathId, answer, [
        String(start + add),
        String(start * 2 + add),
        String(start + add * 2)
      ], random, {
        raw: `Başlangıç ${start}; önce ${add} ekle, sonra 2 ile çarp. Kesin sonuç kaçtır?`,
        explanation: `Sıra zorunlu: toplama sonra çarpma → ${answer}.`
      });
    },
    spot(id, pathId, random) {
      const start = randomInt(random, 12, 30);
      const add = randomInt(random, 2, 7);
      const wrong = String(start + add * 2);
      const correct = String((start + add) * 2);
      return roundChoice(id, pathId, wrong, [correct, String(start * 2 + add), String(start + add + 2)], random, {
        raw: `Başlangıç ${start}; +${add} sonra ×2. Bir öğrenci işlem sırasını karıştırmış. Yanlış sonuç hangisi?`,
        explanation: `Doğru ${correct}; ${wrong} çarpmayı toplamadan önce uygulamış.`
      });
    },
    compare(id, pathId, random) {
      const start = randomInt(random, 8, 20);
      const add = randomInt(random, 2, 6);
      const a = String((start + add) * 2);
      const b = String(start + add * 2);
      return roundChoice(id, pathId, a, [b, String(start * 2 + add), String((start + 2) * add)], random, {
        raw: `Başlangıç ${start}; +${add} sonra ×2. Doğru sonuç hangisi?`,
        explanation: `Önce toplama: ${a}; ${b} sırayı karıştırır.`
      });
    }
  });
}

// ---- 6. ls-direction-route ----
function familyDirectionRoute() {
  return buildFamily('ls-direction-route', {
    select(id, pathId, random) {
      const n = randomInt(random, 2, 5);
      const e = randomInt(random, 1, 4);
      const s = randomInt(random, 0, n - 1);
      const netN = n - s;
      const answer = dirNet(e, netN);
      return roundChoice(id, pathId, answer, [
        dirNet(e, -netN),
        dirNet(-e, netN),
        dirNet(e + 1, netN)
      ], random, {
        raw: `Başlangıç noktasından ${n} kuzey, ${e} doğu, ${s} güney gidildi. Net kod (D=doğu, K=kuzey)?`,
        explanation: `Kuzey-güney: ${n}-${s}=${netN}; doğu: ${e} → ${answer}.`
      });
    },
    forced(id, pathId, random) {
      const e = randomInt(random, 2, 6);
      const answer = dirNet(e, 0);
      return roundChoice(id, pathId, answer, [
        dirNet(-e, 0),
        dirNet(e - 1, 0),
        'D0K0'
      ], random, {
        raw: `3 kuzey, ${e} doğu, 3 güney. Doğu-batı net kod (D{doğu}K{kuzey})?`,
        explanation: `Kuzey-güney sıfırlanır; net ${answer}.`
      });
    },
    spot(id, pathId, random) {
      const answer = dirNet(2, 4);
      return roundChoice(id, pathId, answer, [
        dirNet(2, 1),
        dirNet(2, 2),
        dirNet(1, 2)
      ], random, {
        raw: `2 kuzey, 2 doğu, 1 güney. Bir öğrenci kuzeyi iki kat saymış. Yanlış net kod hangisi?`,
        explanation: `Doğru ${dirNet(2, 1)}; ${answer} kuzeyi fazla saymış.`
      });
    },
    compare(id, pathId, random) {
      const answer = dirNet(3, 2);
      return roundChoice(id, pathId, answer, [
        dirNet(3, -2),
        dirNet(3, 1),
        dirNet(1, 3)
      ], random, {
        raw: `3 kuzey, 3 doğu, 1 güney. Doğru net kod (D{doğu}K{kuzey}) hangisi?`,
        explanation: `Net 2 kuzey 3 doğu → ${answer}.`
      });
    }
  });
}

// ---- 7. ls-venn-intersection ----
function familyVennIntersection() {
  return buildFamily('ls-venn-intersection', {
    select(id, pathId, random) {
      const onlyA = randomInt(random, 3, 8);
      const both = randomInt(random, 2, 6);
      const onlyB = randomInt(random, 3, 8);
      const answer = String(both);
      return roundChoice(id, pathId, answer, [
        String(onlyA + both),
        String(onlyB + both),
        String(onlyA + onlyB)
      ], random, {
        raw: `A kümesinde ${onlyA + both} öğrenci, B kümesinde ${onlyB + both} öğrenci var. Yalnız A'da ${onlyA}, yalnız B'de ${onlyB}. Kesişim (A∩B) kaçtır?`,
        explanation: `A∩B = A_toplam - yalnız_A = ${onlyA + both}-${onlyA}=${both}.`
      });
    },
    forced(id, pathId, random) {
      const answer = '10';
      return roundChoice(id, pathId, answer, ['8', '6', '14'], random, {
        raw: `Spor kulübünde 20 kişi; 14'ü satranç, 12'si robotik. Yalnız satranç 6, yalnız robotik 4. Kesişim kaç olmalıdır?`,
        explanation: `20=6+4+∩ → ∩=10; kontrol 14=6+10, 12=4+10 ✓`
      });
    },
    spot(id, pathId, random) {
      const answer = '8';
      return roundChoice(id, pathId, answer, ['10', '6', '4'], random, {
        raw: `A=14, B=12, yalnız A=6, yalnız B=4. Bir öğrenci kesişimi 8 buldu. Yanlış cevap hangisi?`,
        explanation: `Doğru kesişim 10; 8 toplamları yanlış birleştirmiş.`
      });
    },
    compare(id, pathId, random) {
      const answer = '10';
      return roundChoice(id, pathId, answer, ['6', '8', '14'], random, {
        raw: `Toplam 20; yalnız A 6; yalnız B 4. Kesişim sayısı hangisi?`,
        explanation: `Kesişim 10; 6 yalnız A sayısıyla karıştırılmamalı.`
      });
    }
  });
}

// ---- 8. ls-matching-table ----
function familyMatchingTable() {
  return buildFamily('ls-matching-table', {
    select(id, pathId, random) {
      const [p1, p2, p3] = pickThreeNames(random);
      const answer = matchRow(p1, p2, p3);
      return roundChoice(id, pathId, answer, [
        matchRow(p1, p2, p3).replace(`${p1[0]}K`, `${p1[0]}M`).replace(`${p2[0]}M`, `${p2[0]}K`),
        `${p1[0]}Y/${p2[0]}M/${p3[0]}K`,
        `${p1[0]}K/${p2[0]}Y/${p3[0]}M`
      ], random, {
        raw: `${p1} kırmızıyı sever. ${p2} mavi ${p3}'ten önce gelir. ${p3} yeşili sever. Eşleştirme kodu (K/M/Y)?`,
        explanation: `${p3}→Y; ${p2}→M; ${p1}→K → ${answer}.`
      });
    },
    forced(id, pathId, random) {
      const [, , p3] = pickThreeNames(random);
      const answer = 'Y';
      return roundChoice(id, pathId, answer, ['K', 'M', '?'], random, {
        raw: `${p3} yeşili sever. ${p3}'ün renk kodu (K=kırmızı, M=mavi, Y=yeşil) ne olmalıdır?`,
        explanation: `Doğrudan ipucu: ${p3}→Y.`
      });
    },
    spot(id, pathId, random) {
      const [p1, p2, p3] = pickThreeNames(random);
      const bad = `${p1[0]}M/${p2[0]}K/${p3[0]}Y`;
      return roundChoice(id, pathId, bad, [
        matchRow(p1, p2, p3),
        `${p1[0]}K/${p2[0]}Y/${p3[0]}M`,
        `${p1[0]}Y/${p2[0]}M/${p3[0]}K`
      ], random, {
        raw: `${p1} kırmızı; ${p2} mavi ${p3}'ten önce; ${p3} yeşil. Hangi kod BOZUK?`,
        explanation: `${bad}: ${p1} mavi almış; kırmızı ipucu ihlal.`
      });
    },
    compare(id, pathId, random) {
      const [p1, p2, p3] = pickThreeNames(random);
      const good = matchRow(p1, p2, p3);
      const bad = `${p1[0]}M/${p2[0]}K/${p3[0]}Y`;
      return roundChoice(id, pathId, good, [bad, `${p1[0]}Y/${p2[0]}M/${p3[0]}K`, `${p1[0]}K/${p2[0]}Y/${p3[0]}M`], random, {
        raw: `Renk ipuçları aynı. Tutarlı eşleştirme kodu?`,
        explanation: `Yalnız ${good} üç ipucuyla uyumlu.`
      });
    }
  });
}

// ---- 9. ls-binary-switches ----
function familyBinarySwitches() {
  return buildFamily('ls-binary-switches', {
    select(id, pathId, random) {
      let bits = [0, 0, 0];
      bits = applySwitchToggle(bits, [1, 2]);
      bits = applySwitchToggle(bits, [2, 3]);
      bits = applySwitchToggle(bits, [1, 2]);
      const answer = switchesOnShort(bits);
      return roundChoice(id, pathId, answer, ['1 ve 2', '1 ve 3', '0'], random, {
        raw: `Başlangıç 000. A anahtarı 1+2'yi, B anahtarı 2+3'ü tersler. Sıra A,B,A. Hangi anahtarlar AÇIK?`,
        explanation: `000→110→101→011; açık: ${answer}.`
      });
    },
    forced(id, pathId, random) {
      const answer = '2 ve 3';
      return roundChoice(id, pathId, answer, ['1 ve 2', '1 ve 3', '1+2+3'], random, {
        raw: `000 başlangıç; A(1+2), B(2+3), A(1+2) sırası. Son durumda açık anahtarlar?`,
        explanation: `Son durum 011 → ${answer} açık.`
      });
    },
    spot(id, pathId, random) {
      const answer = '1 ve 2';
      return roundChoice(id, pathId, answer, ['2 ve 3', '1 ve 3', '0'], random, {
        raw: `Aynı sıra. Bir öğrenci sonucu yanlış bulmuş. Yanlış cevap hangisi?`,
        explanation: `Doğru 2 ve 3; ${answer} son A'dan sonra kalmaz.`
      });
    },
    compare(id, pathId, random) {
      const answer = '2 ve 3';
      return roundChoice(id, pathId, answer, ['1 ve 2', '1 ve 3', '0'], random, {
        raw: `000; A(1+2), B(2+3), A(1+2). Doğru son durum hangisi?`,
        explanation: `011 → ${answer} açık tek doğru sonuç.`
      });
    }
  });
}

// ---- 10. ls-constraint-schedule ----
function familyConstraintSchedule() {
  return buildFamily('ls-constraint-schedule', {
    select(id, pathId, random) {
      const answer = SCHED_OK;
      return roundChoice(id, pathId, answer, [
        'Sa-F/Ça-M/Pe-T',
        'Sa-M/Pe-F/Ça-T',
        'Sa-T/Ça-F/Pe-M'
      ], random, {
        raw: `Salı-Perşembe üç ders: Mat, Fen, Türkçe. Mat, Fen'den önceki günde. Türkçe Çarşamba değil. Program kodu (Sa/Ça/Pe + ders)?`,
        explanation: `Mat Salı, Fen Çarşamba, Türkçe Perşembe → ${answer}.`
      });
    },
    forced(id, pathId, random) {
      const answer = 'Sa';
      return roundChoice(id, pathId, answer, ['Ça', 'Pe', '?'], random, {
        raw: `Mat Fen'den önceki günde; Türkçe Çarşamba değil. Matematik hangi gün kodu olmalıdır?`,
        explanation: `Mat en erken gün → Salı (${answer}).`
      });
    },
    spot(id, pathId, random) {
      const answer = 'Ça-T';
      return roundChoice(id, pathId, answer, ['Sa-M', 'Ça-F', 'Pe-T'], random, {
        raw: `Aynı kurallar. Hangi gün-ders kodu kuralı BOZAR?`,
        explanation: `Ça-T: Türkçe Çarşamba — yasak ipucu ihlali.`
      });
    },
    compare(id, pathId, random) {
      const answer = 'W1';
      return roundChoice(id, pathId, answer, ['W2', 'W3', 'W4'], random, {
        raw: `Mat Fen'den bir gün önce; Türkçe Çarşamba değil. Tutarlı program dünyası?`,
        explanation: `W1 = ${SCHED_OK}; W2 Mat'ı Fen'den sonraya iter.`
      });
    }
  });
}

// ---- 11. ls-digit-code ----
function familyDigitCode() {
  return buildFamily('ls-digit-code', {
    select(id, pathId, random) {
      const d1 = randomInt(random, 1, 4);
      const d2 = randomInt(random, 5, 8);
      const answer = `${d1}${d2}`;
      return roundChoice(id, pathId, answer, [
        `${d2}${d1}`,
        `${d1}${d1}`,
        `${d2}${d2}`
      ], random, {
        raw: `İki basamaklı kod: birler 5-9 arası, onlar 1-4 arası, basamaklar farklı, toplam ${d1 + d2}. Kod?`,
        explanation: `Onlar ${d1}, birler ${d2}; toplam ${d1 + d2} ✓.`
      });
    },
    forced(id, pathId, random) {
      const answer = '7';
      return roundChoice(id, pathId, answer, ['3', '5', '9'], random, {
        raw: `Kod 2a+biçiminde; a∈{1,2}, b∈{5,6,7}, a+b=9, a≠b. Birler basamağı (b) kaç olmalıdır?`,
        explanation: `a=2 → b=7; a=1 → b=8 listede yok → b=7.`
      });
    },
    spot(id, pathId, random) {
      const answer = '38';
      return roundChoice(id, pathId, answer, ['27', '16', '47'], random, {
        raw: `Onlar 1-4, birler 5-9, toplam 9. Öğrenci toplamı yanlış hesaplamış. Yanlış kod hangisi?`,
        explanation: `3+8=11≠9; 38 kuralı bozar.`
      });
    },
    compare(id, pathId, random) {
      const answer = '27';
      return roundChoice(id, pathId, answer, ['36', '45', '18'], random, {
        raw: `Onlar çift (2 veya 4), birler tek, toplam 9. Doğru kod hangisi?`,
        explanation: `2+7=9, 2 çift 7 tek ✓; 3 tek olduğu için 36 elenir.`
      });
    }
  });
}

// ---- 12. ls-conditional-chain ----
function familyConditionalChain() {
  return buildFamily('ls-conditional-chain', {
    select(id, pathId, random) {
      const answer = '+Ö';
      return roundChoice(id, pathId, answer, ['-Ö', '+İ', '?'], random, {
        raw: `Kural 1: Yağmur varsa okul erken biter. Kural 2: Erken biterse ödev verilir. Bugün yağmur var. Sonuç kodu (+Ö=ödev var)?`,
        explanation: `Yağmur→erken bitiş→ödev; ${answer}.`
      });
    },
    forced(id, pathId, random) {
      const answer = '+Ö';
      return roundChoice(id, pathId, answer, ['-Ö', '+İ', '?'], random, {
        raw: `Erken bitiş → ödev. Bugün erken bitti. Sonuç kodu (+Ö=ödev var)?`,
        explanation: `Modus ponens: ${answer}.`
      });
    },
    spot(id, pathId, random) {
      const answer = '-E';
      return roundChoice(id, pathId, answer, ['+Ö', '+Y', '+Z'], random, {
        raw: `Yağmur→erken bitiş→ödev. Yağmur varken hangi kod 1. kuralı BOZAR?`,
        explanation: `-E = erken bitmez; yağmur varken imkânsız.`
      });
    },
    compare(id, pathId, random) {
      const answer = 'WA';
      return roundChoice(id, pathId, answer, ['WB', 'WC', 'WD'], random, {
        raw: `Yağmur var; kurallar aynı. Tutarlı sonuç dünyası?`,
        explanation: `WA = +Ö (ödev var); yağmur zinciri zorunlu kılar.`
      });
    }
  });
}

export const LOGIC_STATION_FAMILIES = [
  familyMultiClueOrder(),
  familyWeeklySchedule(),
  familyConditionalTeam(),
  familyTruthLiarTrio(),
  familyTwoStepCode(),
  familyDirectionRoute(),
  familyVennIntersection(),
  familyMatchingTable(),
  familyBinarySwitches(),
  familyConstraintSchedule(),
  familyDigitCode(),
  familyConditionalChain()
];
