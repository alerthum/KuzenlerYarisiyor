// Aşama 04 — olympiad-ladder (Olimpiyat Merdiveni).
// Cevap seçenekleri kısa (<12 normalize) — answer_leak kapısı için.

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

function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

function lcm(a, b) {
  return Math.abs(a * b) / gcd(a, b);
}

function choose(n, k) {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  k = Math.min(k, n - k);
  let num = 1;
  let den = 1;
  for (let i = 0; i < k; i += 1) {
    num *= n - i;
    den *= i + 1;
  }
  return Math.round(num / den);
}

function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

function wrapKey(skeletonId, pathId, raw) {
  return `olympiad-ladder:${skeletonId}:${pathId}:${simpleHash(raw)}`;
}

const PATH_IDS = ['raw-numeric', 'context-embedded', 'staged-strategy-hint'];
const TASK_TRAITS = {
  select: ['strategySelection', 'multiStepInference'],
  forced: ['informationLinking', 'multiStepInference'],
  spot: ['errorAnalysis', 'conditionEvaluation'],
  compare: ['strategySelection', 'usingIntermediateResultInNewDecision']
};

const DAY_ABBR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const PARITY_CODES = ['CIFT', 'TEK', 'DEG'];

function dayAbbr(idx) {
  return DAY_ABBR[((idx % 7) + 7) % 7];
}

function sumSquares(n) {
  return (n * (n + 1) * (2 * n + 1)) / 6;
}

function numericOptions(answer, random, step = 1, extras = []) {
  const ans = typeof answer === 'number' ? answer : Number(answer);
  const values = new Set([ans]);
  for (const c of extras) {
    if (values.size >= 4) break;
    const n = Number(c);
    if (Number.isFinite(n) && n !== ans) values.add(n);
  }
  const offsets = [step, -step, step * 2, -step * 2, 1, -1, 3, -3, 5, -5];
  let i = 0;
  let guard = 0;
  while (values.size < 4 && guard < 80) {
    const c = ans + offsets[i % offsets.length];
    if (Number.isFinite(c) && c >= 0 && c !== ans) values.add(c);
    i += 1;
    guard += 1;
  }
  while (values.size < 4 && guard < 120) {
    const c = Math.max(0, ans + randomInt(random, -9, 9));
    if (c !== ans) values.add(c);
    guard += 1;
  }
  return shuffle([...values].slice(0, 4).map(String), random);
}

function stringOptions(answer, distractors, random) {
  const pool = [String(answer), ...distractors.map(String)];
  const unique = [...new Set(pool)];
  while (unique.length < 4) unique.push(`X${unique.length}`);
  return shuffle(unique.slice(0, 4), random);
}

function pathWrap(pathId, rawPrompt, contextHint, strategyHint) {
  if (pathId === 'raw-numeric') {
    return { prompt: rawPrompt, context: contextHint || 'Sayıları düzenle; kısa örnekle deseni doğrula.' };
  }
  if (pathId === 'context-embedded') {
    return {
      prompt: `Olimpiyat kulübünde çözülen bir soru: ${rawPrompt}`,
      context: 'Senaryodaki sayıları ayıkla; genel kuralı bul.'
    };
  }
  return {
    prompt: `${strategyHint || 'Önce küçük n ile dene, sonra genelle.'} ${rawPrompt}`,
    context: 'Strateji ipucu cevabı doğrudan vermez; yalnız düşünme sırasını gösterir.'
  };
}

function roundChoice(skeletonId, pathId, answerText, distractors, random, texts, useNumeric = true) {
  const answerStr = String(answerText);
  const options = useNumeric && Number.isFinite(Number(answerStr))
    ? numericOptions(Number(answerStr), random, Math.max(1, Math.round(Number(answerStr) / 5) || 1), distractors.map(Number).filter(Number.isFinite))
    : stringOptions(answerStr, distractors, random);
  const answerIndex = options.indexOf(answerStr);
  const { prompt, context } = pathWrap(pathId, texts.raw, texts.context, texts.strategy);
  const instanceNonce = Math.floor(random() * 1e9).toString(36);
  return {
    prompt,
    context,
    options,
    answerIndex,
    explanation: texts.explanation,
    questionKey: wrapKey(skeletonId, pathId, `${texts.raw}|${answerStr}|${instanceNonce}`)
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

function oddSequenceText(start, count) {
  const parts = [];
  for (let i = 0; i < count; i += 1) parts.push(start + 2 * i);
  return parts.join('+');
}

// ---- 1. ol-consecutive-sum ----
function familyConsecutiveSum() {
  return buildFamily('ol-consecutive-sum', {
    select(id, pathId, random) {
      const count = randomInt(random, 3, 7);
      const start = randomInt(random, 1, 9) * 2 - 1;
      const middle = start + count - 1;
      const total = count * middle;
      const seq = oddSequenceText(start, count);
      return roundChoice(id, pathId, String(middle), [String(Math.floor(total / (count + 1))), String(middle + 2), String(middle - 2)], random, {
        raw: `${seq} ardışık tek sayının toplamı ${total}. Ortadaki (ortanca) tek sayı kaçtır?`,
        strategy: 'Ardışık teklerde ortanca = toplam ÷ adet.',
        explanation: `Ortanca = ${total}÷${count}=${middle}.`
      });
    },
    forced(id, pathId, random) {
      const count = randomInt(random, 4, 8);
      const middle = randomInt(random, 5, 15);
      const total = count * middle;
      return roundChoice(id, pathId, String(middle), [String(total), String(count), String(middle + count)], random, {
        raw: `${count} ardışık tek sayının toplamı ${total}. Ortanca tek sayı kaç olmalıdır?`,
        explanation: `Simetri: ortanca = ${total}/${count}=${middle}.`
      });
    },
    spot(id, pathId, random) {
      const count = randomInt(random, 3, 6);
      const start = randomInt(random, 1, 7) * 2 - 1;
      const middle = start + count - 1;
      const total = count * middle;
      const wrong = String(Math.floor(total / count) + (random() > 0.5 ? 1 : -1));
      const correct = String(middle);
      return roundChoice(id, pathId, wrong, [correct, String(start), String(middle + 2)], random, {
        raw: `${oddSequenceText(start, count)} toplamı ${total}. Bir öğrenci ortancayı yanlış bölmüş veya çift orta kullanmış. Yanlış ortanca hangisi?`,
        explanation: `Doğru ortanca ${middle}; ${wrong} ya yanlış bölen ya çift sayı.`
      });
    },
    compare(id, pathId, random) {
      const count = randomInt(random, 5, 9);
      const middle = randomInt(random, 7, 13);
      const total = count * middle;
      const good = String(middle);
      const bad = String(Math.floor(total / (count + 1)));
      return roundChoice(id, pathId, good, [bad, String(total), String(count)], random, {
        raw: `${count} ardışık tek toplamı ${total}. Ortanca tek sayı hangisi?`,
        explanation: `${good} doğru (toplam÷adet); ${bad} yanlış bölen.`
      });
    }
  });
}

// ---- 2. ol-pair-sum-count ----
function familyPairSumCount() {
  return buildFamily('ol-pair-sum-count', {
    select(id, pathId, random) {
      const n = randomInt(random, 6, 14);
      const target = n + 1;
      const answer = Math.floor(n / 2);
      const pairs = [];
      for (let i = 1; i <= Math.floor(n / 2); i += 1) pairs.push(`${i}+${n + 1 - i}`);
      return roundChoice(id, pathId, String(answer), [String(n), String(n - 1), String(answer + 2)], random, {
        raw: `1..${n} arasından iki farklı sayı seçiliyor; toplamları ${target}. Kaç farklı çift vardır? Örnek: ${pairs.slice(0, 2).join(', ')}.`,
        strategy: 'Küçükten büyüğe eşleştir; tekrarsız çift sayısını say.',
        explanation: `Uç eşleştirme: ${pairs.join(', ')} → ${answer} çift.`
      });
    },
    forced(id, pathId, random) {
      const n = randomInt(random, 8, 16);
      const answer = Math.floor(n / 2);
      return roundChoice(id, pathId, String(answer), [String(n), String(n - 1), String(answer + 1)], random, {
        raw: `1..${n} toplamı ${n + 1} olan farklı çiftler. Çift sayısı kaç olmalıdır?`,
        explanation: `Her küçük sayı tek büyük eşleşir → floor(${n}/2)=${answer}.`
      });
    },
    spot(id, pathId, random) {
      const n = randomInt(random, 7, 15);
      const answer = String(n);
      const correct = String(Math.floor(n / 2));
      return roundChoice(id, pathId, answer, [correct, String(n - 1), String(Math.floor(n / 2) + 1)], random, {
        raw: `1..${n} toplamı ${n + 1} olan çiftler. Öğrenci ${n} veya ${n - 1} demiş. Yanlış cevap hangisi?`,
        explanation: `Doğru ${correct}; ${answer} tüm sayıları çift sanmış.`
      });
    },
    compare(id, pathId, random) {
      const n = randomInt(random, 10, 18);
      const good = String(Math.floor(n / 2));
      const bad = String(n);
      return roundChoice(id, pathId, good, [bad, String(n - 1), String(Math.floor(n / 2) + 2)], random, {
        raw: `1..${n} toplamı ${n + 1}. Kaç farklı çift?`,
        explanation: `${good} uç eşleştirme; ${bad} sayıları karıştırır.`
      });
    }
  });
}

// ---- 3. ol-digit-reversal ----
function familyDigitReversal() {
  return buildFamily('ol-digit-reversal', {
    select(id, pathId, random) {
      const A = randomInt(random, 2, 9);
      let B = randomInt(random, 1, 9);
      while (B === A) B = randomInt(random, 1, 9);
      const AB = 10 * A + B;
      const BA = 10 * B + A;
      const answer = 9 * Math.abs(A - B);
      return roundChoice(id, pathId, String(answer), [Math.abs(A - B), 10 * Math.abs(A - B), AB - BA === answer ? AB + BA : AB - BA], random, {
        raw: `İki basamaklı ${AB} sayısının basamakları ters çevrilince ${BA} olur. ${AB}−${BA} farkı kaçtır?`,
        strategy: 'AB−BA = 9×(onlar−birler); uzun çarpmaya gerek yok.',
        explanation: `${AB}−${BA}=9×(${A}−${B})=9×${Math.abs(A - B)}=${answer}.`
      });
    },
    forced(id, pathId, random) {
      const A = randomInt(random, 3, 9);
      const B = randomInt(random, 1, A - 1);
      const answer = 9 * (A - B);
      return roundChoice(id, pathId, String(answer), [A - B, 10 * (A - B), (A + B)], random, {
        raw: `Onlar basamağı ${A}, birler ${B} olan sayıdan basamakları ters çevrilmiş hali çıkarılırsa fark kaç olmalıdır?`,
        explanation: `Kural: 9×(${A}−${B})=${answer}.`
      });
    },
    spot(id, pathId, random) {
      const A = randomInt(random, 4, 9);
      const B = randomInt(random, 1, 3);
      const wrong = String(A - B);
      const correct = String(9 * (A - B));
      return roundChoice(id, pathId, wrong, [correct, String(10 * (A - B)), String(A + B)], random, {
        raw: `Onlar=${A}, birler=${B}. Öğrenci farkı ${A - B} veya 10×(${A}−${B}) sanmış. Yanlış cevap hangisi?`,
        explanation: `Doğru 9×(${A}−${B})=${correct}; ${wrong} 9 çarpanını unutmuş.`
      });
    },
    compare(id, pathId, random) {
      const A = randomInt(random, 5, 9);
      const B = randomInt(random, 1, 4);
      const good = String(9 * (A - B));
      const bad = String(A - B);
      return roundChoice(id, pathId, good, [bad, String(10 * (A - B)), String(A + B)], random, {
        raw: `Onlar ${A}, birler ${B}. Ters çevrilince fark hangisi?`,
        explanation: `${good}=9×(${A}−${B}); ${bad} yanlış kural.`
      });
    }
  });
}

// ---- 4. ol-square-grid-count ----
function familySquareGridCount() {
  return buildFamily('ol-square-grid-count', {
    select(id, pathId, random) {
      const n = randomInt(random, 2, 5);
      const answer = sumSquares(n);
      const wrong1 = n * n;
      return roundChoice(id, pathId, String(answer), [wrong1, wrong1 + n, answer - 1], random, {
        raw: `${n}×${n} kareli ızgarada tüm boyutlardaki kareler (1×1, 2×2, …) toplam kaç tanedir?`,
        strategy: 'Her boyut k için k×k kareleri say; 1²+2²+…+n².',
        explanation: `1²+…+${n}²=${answer} (yalnız ${n}×${n}=${wrong1} değil).`
      });
    },
    forced(id, pathId, random) {
      const n = randomInt(random, 3, 6);
      const answer = sumSquares(n);
      return roundChoice(id, pathId, String(answer), [n * n, n * (n + 1), answer + 2], random, {
        raw: `Kenarı ${n} birim olan kare ızgarada farklı boyutlardaki tüm karelerin sayısı kaç olmalıdır?`,
        explanation: `Σk² (k=1..${n})=${answer}.`
      });
    },
    spot(id, pathId, random) {
      const n = randomInt(random, 3, 5);
      const wrong = String(n * n);
      const correct = String(sumSquares(n));
      return roundChoice(id, pathId, wrong, [correct, String(sumSquares(n) + 1), String(n * (n + 1))], random, {
        raw: `${n}×${n} ızgarada bir öğrenci yalnız ${n}×${n} büyük kareyi saymış. Yanlış toplam hangisi?`,
        explanation: `Doğru ${correct}; ${wrong} küçük kareleri atlamış.`
      });
    },
    compare(id, pathId, random) {
      const n = randomInt(random, 4, 6);
      const good = String(sumSquares(n));
      const bad = String(n * n);
      return roundChoice(id, pathId, good, [bad, String(n * (n + 1)), String(sumSquares(n) - 2)], random, {
        raw: `${n}×${n} ızgarada tüm karelerin toplamı hangisi?`,
        explanation: `${good} tüm boyutları kapsar; ${bad} yalnız en büyük.`
      });
    }
  });
}

// ---- 5. ol-path-checkpoint ----
function familyPathCheckpoint() {
  return buildFamily('ol-path-checkpoint', {
    select(id, pathId, random) {
      const a = randomInt(random, 2, 4);
      const b = randomInt(random, 1, 3);
      const c = randomInt(random, 2, 4);
      const d = randomInt(random, 1, 3);
      const w1 = choose(a + b, a);
      const w2 = choose(c + d, c);
      const answer = w1 * w2;
      return roundChoice(id, pathId, String(answer), [w1 + w2, w1 * w2 + w1, choose(a + b + c + d, a + c)], random, {
        raw: `A→B: ${a} sağ, ${b} yukarı; B→C: ${c} sağ, ${d} yukarı (yalnız sağ/yukarı). B'den geçen A→C yolları kaçtır?`,
        strategy: 'İki parçayı ayrı say; çarpma ilkesi.',
        explanation: `C(${a + b},${a})×C(${c + d},${c})=${w1}×${w2}=${answer}.`
      });
    },
    forced(id, pathId, random) {
      const a = 3;
      const b = 2;
      const c = 2;
      const d = 2;
      const answer = choose(a + b, a) * choose(c + d, c);
      return roundChoice(id, pathId, String(answer), [choose(a + b, a) + choose(c + d, c), choose(a + b + c + d, a + c), answer + 5], random, {
        raw: `A→B: 3 sağ 2 yukarı; B→C: 2 sağ 2 yukarı. B kontrol noktasından geçen toplam yol kaç olmalıdır?`,
        explanation: `C(5,3)×C(4,2)=10×6=${answer}.`
      });
    },
    spot(id, pathId, random) {
      const a = randomInt(random, 2, 4);
      const b = randomInt(random, 2, 3);
      const c = randomInt(random, 2, 3);
      const d = randomInt(random, 1, 2);
      const w1 = choose(a + b, a);
      const w2 = choose(c + d, c);
      const wrong = String(w1 + w2);
      const correct = String(w1 * w2);
      return roundChoice(id, pathId, wrong, [correct, String(w1 * w2 + 1), String(choose(a + b + c + d, a))], random, {
        raw: `A→B ${a}S ${b}Y; B→C ${c}S ${d}Y. Öğrenci yolları toplamış. Yanlış cevap hangisi?`,
        explanation: `Doğru ${correct} (çarp); ${wrong} toplama hatası.`
      });
    },
    compare(id, pathId, random) {
      const a = 2;
      const b = 2;
      const c = 3;
      const d = 1;
      const good = String(choose(a + b, a) * choose(c + d, c));
      const bad = String(choose(a + b, a) + choose(c + d, c));
      return roundChoice(id, pathId, good, [bad, String(choose(a + b + c + d, a + c)), String(Number(good) + 3)], random, {
        raw: `A→B 2S 2Y; B→C 3S 1Y. Kontrol noktalı yol sayısı hangisi?`,
        explanation: `${good}=C(4,2)×C(4,3); ${bad} toplama yanlış.`
      });
    }
  });
}

// ---- 6. ol-calendar-mod7 ----
function familyCalendarMod7() {
  return buildFamily('ol-calendar-mod7', {
    select(id, pathId, random) {
      const todayIdx = randomInt(random, 0, 6);
      const jump = randomInt(random, 5, 30);
      const answer = dayAbbr(todayIdx + jump);
      return roundChoice(id, pathId, answer, shuffle(DAY_ABBR.filter((d) => d !== answer), random).slice(0, 3), random, {
        raw: `Bugün ${dayAbbr(todayIdx)}. ${jump} gün sonra hangi gün kısaltması doğrudur?`,
        strategy: '7\'lik döngü: atlanan tam haftaları sil, kalanı ekle.',
        explanation: `${dayAbbr(todayIdx)}+${jump}≡${answer} (mod 7).`
      }, false);
    },
    forced(id, pathId, random) {
      const todayIdx = randomInt(random, 0, 6);
      const jump = randomInt(random, 10, 20);
      const answer = dayAbbr(todayIdx + jump);
      return roundChoice(id, pathId, answer, shuffle(DAY_ABBR.filter((d) => d !== answer), random).slice(0, 3), random, {
        raw: `Kesinlikle ${dayAbbr(todayIdx)}. Tam ${jump} gün sonra gün kodu ne olmalıdır?`,
        explanation: `Mod 7: ${jump} gün ileri → ${answer}.`
      }, false);
    },
    spot(id, pathId, random) {
      const todayIdx = randomInt(random, 0, 6);
      const jump = randomInt(random, 8, 25);
      const wrong = dayAbbr(todayIdx + jump + 1);
      const correct = dayAbbr(todayIdx + jump);
      return roundChoice(id, pathId, wrong, [correct, dayAbbr(todayIdx + jump + 2), dayAbbr(todayIdx + jump - 1)], random, {
        raw: `Bugün ${dayAbbr(todayIdx)}. ${jump} gün sonrası için öğrenci bir gün fazla saymış. Yanlış kısaltma hangisi?`,
        explanation: `Doğru ${correct}; ${wrong} bir gün fazla.`
      }, false);
    },
    compare(id, pathId, random) {
      const todayIdx = randomInt(random, 0, 6);
      const jump = randomInt(random, 14, 28);
      const good = dayAbbr(todayIdx + jump);
      const bad = dayAbbr(todayIdx + jump + 1);
      return roundChoice(id, pathId, good, [bad, dayAbbr(todayIdx + jump + 2), dayAbbr(todayIdx + jump + 3)], random, {
        raw: `Bugün ${dayAbbr(todayIdx)}. ${jump} gün sonraki doğru kısaltma hangisi?`,
        explanation: `${good} mod-7 doğru; ${bad} fazla sayım.`
      }, false);
    }
  });
}

// ---- 7. ol-two-balance ----
function familyTwoBalance() {
  return buildFamily('ol-two-balance', {
    select(id, pathId, random) {
      const sq = randomInt(random, 2, 8);
      const ci = randomInt(random, 2, 8);
      const t1 = 2 * sq + ci;
      const t2 = sq + 2 * ci;
      const answer = (t1 + t2) / 3;
      return roundChoice(id, pathId, String(answer), [sq + ci, (t1 + t2) / 2, answer + 2], random, {
        raw: `2■+●=${t1} ve ■+2●=${t2}. ■+● toplamı kaçtır?`,
        strategy: 'İki denklemi topla; 3(■+●) elde et.',
        explanation: `Toplam: 3(■+●)=${t1 + t2} → ■+●=${answer}.`
      });
    },
    forced(id, pathId, random) {
      const sum = randomInt(random, 5, 12);
      const sq = randomInt(random, 2, 6);
      const ci = sum - sq;
      const t1 = 2 * sq + ci;
      const t2 = sq + 2 * ci;
      return roundChoice(id, pathId, String(sum), [String(t1), String(t2), String(sum + 3)], random, {
        raw: `2■+●=${t1}, ■+2●=${t2}. ■+● kaç olmalıdır?`,
        explanation: `(${t1}+${t2})/3=${sum}.`
      });
    },
    spot(id, pathId, random) {
      const sq = randomInt(random, 3, 7);
      const ci = randomInt(random, 3, 7);
      const t1 = 2 * sq + ci;
      const t2 = sq + 2 * ci;
      const wrong = String(t1 + t2);
      const correct = String((t1 + t2) / 3);
      return roundChoice(id, pathId, wrong, [correct, String(sq + ci), String((t1 + t2) / 2)], random, {
        raw: `2■+●=${t1}, ■+2●=${t2}. Öğrenci ■+●=${t1 + t2} demiş. Yanlış cevap hangisi?`,
        explanation: `Doğru ${correct}; ${wrong} 3'e bölmeyi unutmuş.`
      });
    },
    compare(id, pathId, random) {
      const sq = 4;
      const ci = 5;
      const t1 = 2 * sq + ci;
      const t2 = sq + 2 * ci;
      const good = String((t1 + t2) / 3);
      const bad = String(t1 + t2);
      return roundChoice(id, pathId, good, [bad, String(sq + ci + 2), String((t1 + t2) / 2)], random, {
        raw: `2■+●=${t1}, ■+2●=${t2}. ■+● hangisi?`,
        explanation: `${good}=(T1+T2)/3; ${bad} bölmeyi atlamış.`
      });
    }
  });
}

// ---- 8. ol-pigeonhole ----
function familyPigeonhole() {
  return buildFamily('ol-pigeonhole', {
    select(id, pathId, random) {
      const colors = randomInt(random, 3, 6);
      const perColor = randomInt(random, 4, 8);
      const want = randomInt(random, 3, 5);
      const answer = perColor * (want - 1) + 1;
      return roundChoice(id, pathId, String(answer), [perColor * (want - 1), perColor * want, answer - 1], random, {
        raw: `${colors} renkte her renkten en çok ${perColor} bilye var. En az kaç bilye çekilirse ${want} tanesi aynı renkte garanti olur?`,
        strategy: 'En kötü durum: her renkten (W−1) al; sonra +1.',
        explanation: `${perColor}×(${want}−1)+1=${answer}.`
      });
    },
    forced(id, pathId, random) {
      const perColor = randomInt(random, 5, 9);
      const want = 4;
      const answer = perColor * (want - 1) + 1;
      return roundChoice(id, pathId, String(answer), [perColor * (want - 1), perColor * want, answer + 2], random, {
        raw: `Her renkten en çok ${perColor} bilye. ${want} aynı renk garantisi için en az kaç bilye gerekir?`,
        explanation: `${perColor}×3+1=${answer}.`
      });
    },
    spot(id, pathId, random) {
      const perColor = randomInt(random, 4, 7);
      const want = randomInt(random, 3, 4);
      const wrong = String(perColor * (want - 1));
      const correct = String(perColor * (want - 1) + 1);
      return roundChoice(id, pathId, wrong, [correct, String(perColor * want), String(Number(correct) + 1)], random, {
        raw: `Her renkten en çok ${perColor}; ${want} aynı renk isteniyor. Öğrenci +1'i unutmuş. Yanlış cevap hangisi?`,
        explanation: `Doğru ${correct}; ${wrong} son +1 eksik.`
      });
    },
    compare(id, pathId, random) {
      const perColor = 6;
      const want = 3;
      const good = String(perColor * (want - 1) + 1);
      const bad = String(perColor * (want - 1));
      return roundChoice(id, pathId, good, [bad, String(perColor * want), String(Number(good) + 3)], random, {
        raw: `Her renkten en çok ${perColor}; ${want} aynı renk garantisi. Doğru alt sınır hangisi?`,
        explanation: `${good}=C×(W−1)+1; ${bad} +1 unutulmuş.`
      });
    }
  });
}

// ---- 9. ol-parity-invariant ----
function familyParityInvariant() {
  return buildFamily('ol-parity-invariant', {
    select(id, pathId, random) {
      const black = randomInt(random, 1, 8);
      const start = black % 2 === 0 ? 'CIFT' : 'TEK';
      return roundChoice(id, pathId, 'DEG', shuffle(PARITY_CODES.filter((c) => c !== 'DEG'), random), random, {
        raw: `Tahtada ${black} siyah taş var. Her hamlede tam 2 taş çevrilir. Siyah sayısının tek-çiftliği değişir mi? Kod: CIFT/TEK/DEG (DEG=değişmez).`,
        strategy: '2 taş çevirmek siyah sayısını 0, ±1 veya ±2 değiştirir; tek-çift?',
        explanation: `${black} siyah → başlangıç ${start}; çift adet çevirme pariteyi korur → DEG.`
      }, false);
    },
    forced(id, pathId, random) {
      const black = randomInt(random, 2, 10);
      const start = black % 2 === 0 ? 'CIFT' : 'TEK';
      return roundChoice(id, pathId, start, shuffle(PARITY_CODES.filter((c) => c !== start), random), random, {
        raw: `${black} siyah taş; her hamle 2 taş çevrilir. Başlangıç siyah sayısı tek-çift kodu?`,
        explanation: `${black} siyah → ${start}.`
      }, false);
    },
    spot(id, pathId, random) {
      const black = randomInt(random, 3, 9);
      const wrong = black % 2 === 0 ? 'TEK' : 'CIFT';
      return roundChoice(id, pathId, wrong, ['DEG', black % 2 === 0 ? 'CIFT' : 'TEK', 'CIFT'], random, {
        raw: `${black} siyah taş; 2'li çevirme. Öğrenci "tek-çift değişir" demiş. Yanlış iddia kodu hangisi?`,
        explanation: `Parite korunur → DEG; ${wrong} değişir sanmış.`
      }, false);
    },
    compare(id, pathId, random) {
      const black = randomInt(random, 4, 12);
      const good = 'DEG';
      const bad = black % 2 === 0 ? 'TEK' : 'CIFT';
      return roundChoice(id, pathId, good, [bad, 'CIFT', 'TEK'], random, {
        raw: `${black} siyah; her hamle 2 taş çevrilir. Siyah tek-çiftliği için doğru kod?`,
        explanation: `Çift adet çevirme pariteyi korur → ${good}.`
      }, false);
    }
  });
}

// ---- 10. ol-set-inclusion ----
function familySetInclusion() {
  return buildFamily('ol-set-inclusion', {
    select(id, pathId, random) {
      const onlyA = randomInt(random, 5, 12);
      const onlyB = randomInt(random, 5, 12);
      const both = randomInt(random, 3, 8);
      const aTotal = onlyA + both;
      const bTotal = onlyB + both;
      const answer = aTotal + bTotal - both;
      return roundChoice(id, pathId, String(answer), [aTotal + bTotal, both, answer - both], random, {
        raw: `A kulübünde ${aTotal}, B kulübünde ${bTotal} öğrenci. Yalnız A'da ${onlyA}, yalnız B'de ${onlyB}. En az bir kulübe üye kaç kişi?`,
        strategy: '|A∪B| = |A|+|B|−|A∩B|.',
        explanation: `${aTotal}+${bTotal}−${both}=${answer}.`
      });
    },
    forced(id, pathId, random) {
      const aTotal = randomInt(random, 15, 25);
      const bTotal = randomInt(random, 12, 22);
      const both = randomInt(random, 4, 10);
      const answer = aTotal + bTotal - both;
      return roundChoice(id, pathId, String(answer), [aTotal + bTotal, both, answer + 3], random, {
        raw: `|A|=${aTotal}, |B|=${bTotal}, |A∩B|=${both}. |A∪B| kaç olmalıdır?`,
        explanation: `${aTotal}+${bTotal}−${both}=${answer}.`
      });
    },
    spot(id, pathId, random) {
      const aTotal = randomInt(random, 18, 28);
      const bTotal = randomInt(random, 16, 24);
      const both = randomInt(random, 5, 9);
      const wrong = String(aTotal + bTotal);
      const correct = String(aTotal + bTotal - both);
      return roundChoice(id, pathId, wrong, [correct, String(both), String(aTotal + bTotal - both - 2)], random, {
        raw: `|A|=${aTotal}, |B|=${bTotal}, kesişim ${both}. Öğrenci toplamları doğrudan toplamış. Yanlış |A∪B| hangisi?`,
        explanation: `Doğru ${correct}; ${wrong} kesişimi iki kez saymış.`
      });
    },
    compare(id, pathId, random) {
      const aTotal = 20;
      const bTotal = 18;
      const both = 7;
      const good = String(aTotal + bTotal - both);
      const bad = String(aTotal + bTotal);
      return roundChoice(id, pathId, good, [bad, String(both), String(aTotal + bTotal - both + 4)], random, {
        raw: `|A|=${aTotal}, |B|=${bTotal}, |A∩B|=${both}. |A∪B| hangisi?`,
        explanation: `${good} dahil etme-çıkarma; ${bad} çift sayım.`
      });
    }
  });
}

// ---- 11. ol-cycle-lcm ----
function familyCycleLcm() {
  return buildFamily('ol-cycle-lcm', {
    select(id, pathId, random) {
      const p1 = randomInt(random, 3, 8);
      let p2 = randomInt(random, 4, 10);
      while (gcd(p1, p2) !== 1 && random() > 0.3) p2 = randomInt(random, 4, 12);
      const answer = lcm(p1, p2);
      return roundChoice(id, pathId, String(answer), [p1 * p2, p1 + p2, answer - p1], random, {
        raw: `A lambası ${p1} sn, B lambası ${p2} sn periyotla yanar. İkisi birlikte tekrar aynı anda yanar — kaç saniye sonra?`,
        strategy: 'Ortak periyot = EKOK(p1,p2).',
        explanation: `EKOK(${p1},${p2})=${answer}.`
      });
    },
    forced(id, pathId, random) {
      const p1 = pick([4, 6, 8, 9], random);
      const p2 = pick([6, 10, 12, 15], random);
      const answer = lcm(p1, p2);
      return roundChoice(id, pathId, String(answer), [p1 + p2, p1 * p2, answer + 2], random, {
        raw: `Periyotlar ${p1} sn ve ${p2} sn. Birlikte yanma döngüsü kaç sn olmalıdır?`,
        explanation: `EKOK=${answer}.`
      });
    },
    spot(id, pathId, random) {
      const p1 = randomInt(random, 4, 7);
      const p2 = randomInt(random, 5, 9);
      const wrong = String(p1 * p2);
      const correct = String(lcm(p1, p2));
      return roundChoice(id, pathId, wrong, [correct, String(p1 + p2), String(lcm(p1, p2) + 1)], random, {
        raw: `Periyot ${p1} ve ${p2} sn. Öğrenci EKOK yerine çarpım demiş. Yanlış cevap hangisi?`,
        explanation: `Doğru EKOK ${correct}; ${wrong} çarpım hatası.`
      });
    },
    compare(id, pathId, random) {
      const p1 = 6;
      const p2 = 8;
      const good = String(lcm(p1, p2));
      const bad = String(p1 * p2);
      return roundChoice(id, pathId, good, [bad, String(p1 + p2), String(Number(good) + 6)], random, {
        raw: `${p1} sn ve ${p2} sn periyot. Ortak döngü hangisi?`,
        explanation: `${good}=EKOK; ${bad} gereksiz büyük.`
      });
    }
  });
}

// ---- 12. ol-reverse-machine ----
function familyReverseMachine() {
  return buildFamily('ol-reverse-machine', {
    select(id, pathId, random) {
      const x = randomInt(random, 3, 12);
      const mul = randomInt(random, 2, 5);
      const add = randomInt(random, 3, 15);
      const out = x * mul + add;
      const answer = x;
      return roundChoice(id, pathId, String(answer), [Math.floor((out - add) / mul) + 1, Math.floor(out / mul), out - add], random, {
        raw: `Makine: girdi → ×${mul} → +${add} → ${out}. Girdi kaçtır?`,
        strategy: 'Tersine: önce −${add}, sonra ÷${mul}.',
        explanation: `(${out}−${add})/${mul}=${answer}.`
      });
    },
    forced(id, pathId, random) {
      const mul = randomInt(random, 2, 4);
      const add = randomInt(random, 5, 12);
      const x = randomInt(random, 4, 10);
      const out = x * mul + add;
      return roundChoice(id, pathId, String(x), [(out - add) / mul + 1, out / mul, out - add], random, {
        raw: `×${mul} sonra +${add} makinesi ${out} verdi. Başlangıç sayısı kaç olmalıdır?`,
        explanation: `(${out}−${add})/${mul}=${x}.`
      });
    },
    spot(id, pathId, random) {
      const mul = randomInt(random, 2, 5);
      const add = randomInt(random, 4, 10);
      const x = randomInt(random, 5, 11);
      const out = x * mul + add;
      const wrong = String(Math.floor(out / mul));
      const correct = String(x);
      return roundChoice(id, pathId, wrong, [correct, String(out - add), String(x + 2)], random, {
        raw: `×${mul}→+${add}→${out}. Öğrenci önce bölmüş (+${add} atlamış). Yanlış girdi hangisi?`,
        explanation: `Doğru ${correct}; ${wrong} ters sıra hatası.`
      });
    },
    compare(id, pathId, random) {
      const mul = 3;
      const add = 7;
      const out = 34;
      const good = String((out - add) / mul);
      const bad = String(Math.floor(out / mul));
      return roundChoice(id, pathId, good, [bad, String(out - add), String(Number(good) + 2)], random, {
        raw: `×${mul}→+${add}→${out}. Doğru girdi hangisi?`,
        explanation: `${good}: önce −${add} sonra ÷${mul}; ${bad} sırayı karıştırır.`
      });
    }
  });
}

export const OLYMPIAD_LADDER_FAMILIES = [
  familyConsecutiveSum(),
  familyPairSumCount(),
  familyDigitReversal(),
  familySquareGridCount(),
  familyPathCheckpoint(),
  familyCalendarMod7(),
  familyTwoBalance(),
  familyPigeonhole(),
  familyParityInvariant(),
  familySetInclusion(),
  familyCycleLcm(),
  familyReverseMachine()
];
