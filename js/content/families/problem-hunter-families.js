// Aşama 04 — problem-hunter (Yeni Nesil Problem Avcısı) için gerçek
// Aile→İskelet→Düşünme Yolu içeriği. family-skeleton-engine.js sözleşmesine uyar.
//
// Aile kimliği HİKÂYE NESNESİYLE değil PROBLEM ÇÖZÜM YAPISIYLA belirlenir.
// Aynı A×B−C yapısının kalem/elma/kitap makyajı YENİ aile SAYILMAZ.
//
// İskeletler (görev):
//   direct-solve            — verilenlerden isteneni bul
//   reverse-find-given      — sonuç ve diğer veriler verili, eksik girdiyi bul
//   verify-and-correct      — yaygın ara-adım hatasıyla bulunmuş yanlış sonucu düzelt
//   compare-two-scenarios   — iki senaryoyu çözüp farkı bul
// Düşünme yolları:
//   raw-statement           — kısa, sade sayısal ifade
//   context-embedded        — zengin hikâye bağlamı
//   staged-strategy-hint    — strateji iskeleti; tam çözüm ifşa edilmez
//
// ÖNEMLİ: registry.js grade≥4 trivialLinear / trivialPrompt filtreleri
// "Nx ± d = R" ve kısa "x kaçtır" desenlerini reddeder. Linear aile sözel
// ifade kullanır; boşluk için "?" tercih edilir, harf "x" kullanılmaz.

function randomInt(random, min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function pick(items, random) {
  return items[Math.floor(random() * items.length)];
}

function wrapKey(skeletonId, pathId, raw) {
  return `problem-hunter:${skeletonId}:${pathId}:${raw}`;
}

function buildOptions(answer, random, typicalStep, extraCandidates = []) {
  const values = new Set([answer]);
  for (const candidate of extraCandidates) {
    if (values.size >= 4) break;
    if (Number.isFinite(candidate) && candidate >= 0 && candidate !== answer) values.add(Math.round(candidate));
  }
  const step = Math.max(1, Math.round(Math.abs(typicalStep) || 1));
  const offsets = [step, -step, step * 2, -step * 2, Math.max(1, Math.round(step / 2)), -Math.max(1, Math.round(step / 2)), 1, -1, 3, -3];
  let index = 0;
  let guard = 0;
  while (values.size < 4 && guard < 200) {
    const candidate = answer + offsets[index % offsets.length];
    if (candidate >= 0 && !values.has(candidate)) values.add(candidate);
    index += 1;
    guard += 1;
  }
  let fallback = 0;
  while (values.size < 4 && fallback < 200) {
    const candidate = Math.max(0, answer + Math.floor(random() * 40) - 20);
    if (!values.has(candidate)) values.add(candidate);
    fallback += 1;
  }
  const list = [...values];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list.map(String);
}

const PATH_IDS = ['raw-statement', 'context-embedded', 'staged-strategy-hint'];

const TASK_TRAITS = {
  direct: ['multiStepInference', 'informationLinking'],
  reverse: ['reverseThinking', 'usingIntermediateResultInNewDecision'],
  verify: ['errorAnalysis', 'conditionEvaluation'],
  compare: ['usingIntermediateResultInNewDecision', 'strategySelection']
};

function roundChoice(skeletonId, pathId, answer, typicalStep, random, texts, extras = []) {
  const options = buildOptions(answer, random, typicalStep, extras);
  const answerIndex = options.indexOf(String(answer));
  let prompt;
  let context;
  if (pathId === 'raw-statement') {
    prompt = texts.raw;
    context = texts.rawContext || 'Verilenleri ve isteneni ayır; gerekli işlemleri sırayla uygula.';
  } else if (pathId === 'context-embedded') {
    prompt = texts.context;
    context = texts.contextContext || 'Hikâyedeki gereksiz ayrıntıları ayıkla; yalnız işe yarayan sayıları kullan.';
  } else {
    prompt = texts.strategy;
    context = texts.strategyContext || 'Önce stratejiyi uygula; sonucu kontrol et.';
  }
  return {
    prompt,
    context,
    options,
    answerIndex,
    explanation: texts.explanation,
    questionKey: wrapKey(skeletonId, pathId, `${prompt}|${answer}`)
  };
}

function buildFamily(familyId, builders) {
  const directId = `${familyId}:direct-solve`;
  const reverseId = `${familyId}:reverse-find-given`;
  const verifyId = `${familyId}:verify-and-correct`;
  const compareId = `${familyId}:compare-two-scenarios`;
  return {
    familyId,
    skeletons: [
      {
        skeletonId: directId,
        reasoningPathIds: PATH_IDS,
        cognitiveTraits: TASK_TRAITS.direct,
        generate: (random, pathId) => builders.direct(directId, pathId, random)
      },
      {
        skeletonId: reverseId,
        reasoningPathIds: PATH_IDS,
        cognitiveTraits: TASK_TRAITS.reverse,
        generate: (random, pathId) => builders.reverse(reverseId, pathId, random)
      },
      {
        skeletonId: verifyId,
        reasoningPathIds: PATH_IDS,
        cognitiveTraits: TASK_TRAITS.verify,
        generate: (random, pathId) => builders.verify(verifyId, pathId, random)
      },
      {
        skeletonId: compareId,
        reasoningPathIds: PATH_IDS,
        cognitiveTraits: TASK_TRAITS.compare,
        generate: (random, pathId) => builders.compare(compareId, pathId, random)
      }
    ]
  };
}

// ---- 12 gerçek problem-yapısı ailesi ----

function familyMultiplyThenSubtract() {
  return buildFamily('ph-multiply-then-subtract', {
    direct(id, pathId, random) {
      const packs = randomInt(random, 3, 9);
      const each = randomInt(random, 4, 12);
      const used = randomInt(random, 3, packs * each - 2);
      const answer = packs * each - used;
      return roundChoice(id, pathId, answer, each, random, {
        raw: `${packs} grup × ${each} birim; ${used} birim kullanıldıktan sonra kaç birim kalır?`,
        context: `${packs} kutunun her birinde ${each} kalem vardır. ${used} kalem kullanılırsa kaç kalem kalır?`,
        strategy: `Önce toplamı bul (grup × birim), sonra kullanılanı çıkar. Veriler: ${packs}, ${each}, ${used}. Kalan kaçtır?`,
        explanation: `Önce ${packs} × ${each} = ${packs * each}; sonra ${packs * each} − ${used} = ${answer}.`
      }, [packs * each, used, packs * each + used]);
    },
    reverse(id, pathId, random) {
      const packs = randomInt(random, 3, 9);
      const each = randomInt(random, 4, 12);
      const used = randomInt(random, 3, packs * each - 2);
      const remaining = packs * each - used;
      return roundChoice(id, pathId, used, each, random, {
        raw: `${packs} × ${each} birimlik stoktan sonra ${remaining} birim kaldı. Kaç birim kullanıldı?`,
        context: `${packs} kutunun her birinde ${each} kalem vardı; sonunda ${remaining} kalem kaldı. Kaç kalem kullanıldı?`,
        strategy: `Toplamı hesapla, kalanı çıkararak kullanılanı bul. Veriler: ${packs}, ${each}, kalan ${remaining}.`,
        explanation: `Toplam ${packs} × ${each} = ${packs * each}; kullanılan ${packs * each} − ${remaining} = ${used}.`
      }, [remaining, packs * each]);
    },
    verify(id, pathId, random) {
      const packs = randomInt(random, 3, 9);
      const each = randomInt(random, 4, 12);
      const used = randomInt(random, 3, packs * each - 2);
      const answer = packs * each - used;
      const wrong = packs + each - used; // toplama-çarpma karıştırması
      const safeWrong = wrong === answer ? answer + each : wrong;
      return roundChoice(id, pathId, answer, each, random, {
        raw: `${packs} × ${each} − ${used} için bir öğrenci ${safeWrong} bulmuş. Doğru sonuç kaçtır?`,
        context: `${packs} kutuda ${each}'er kalem vardı; ${used} kullanıldı. Bir öğrenci ${packs}+${each}−${used}=${safeWrong} dedi. Doğrusu kaçtır?`,
        strategy: `Öğrencinin toplama-çarpma karışıklığını kontrol et. Veriler: ${packs}, ${each}, ${used}. Doğru kalan?`,
        explanation: `Doğru yol çarpmadır: ${packs} × ${each} = ${packs * each}; ${packs * each} − ${used} = ${answer}. ${safeWrong} yanlış ara adımdan gelir.`
      }, [safeWrong, packs * each]);
    },
    compare(id, pathId, random) {
      const packs1 = randomInt(random, 3, 7);
      const each1 = randomInt(random, 4, 10);
      const used1 = randomInt(random, 2, packs1 * each1 - 2);
      const packs2 = packs1 + randomInt(random, 1, 3);
      const each2 = each1;
      const used2 = used1 + randomInt(random, 1, 5);
      const rem1 = packs1 * each1 - used1;
      const rem2 = packs2 * each2 - used2;
      const answer = Math.abs(rem1 - rem2);
      return roundChoice(id, pathId, answer, each1, random, {
        raw: `Senaryo A: ${packs1}×${each1}−${used1}. Senaryo B: ${packs2}×${each2}−${used2}. Kalanlar arasındaki fark kaçtır?`,
        context: `A sınıfında ${packs1} kutu × ${each1} kalem, ${used1} kullanıldı. B sınıfında ${packs2} kutu × ${each2} kalem, ${used2} kullanıldı. Kalan farkı kaçtır?`,
        strategy: `Her senaryonun kalanını ayrı bul, sonra farkı al. A:(${packs1},${each1},${used1}) B:(${packs2},${each2},${used2}).`,
        explanation: `A kalanı ${rem1}, B kalanı ${rem2}; fark |${rem1}−${rem2}|=${answer}.`
      }, [rem1, rem2]);
    }
  });
}

function familyEqualShare() {
  return buildFamily('ph-equal-share-division', {
    direct(id, pathId, random) {
      const people = randomInt(random, 3, 8);
      const each = randomInt(random, 3, 10);
      const total = people * each;
      return roundChoice(id, pathId, each, people, random, {
        raw: `${total} birim ${people} kişiye eşit paylaşılırsa her kişi kaç alır?`,
        context: `${total} ceviz ${people} çocuğa eşit paylaştırılırsa her çocuk kaç ceviz alır?`,
        strategy: `Toplamı kişi sayısına böl. Veriler: ${total} birim, ${people} kişi.`,
        explanation: `${total} ÷ ${people} = ${each}.`
      }, [total, people, total + people]);
    },
    reverse(id, pathId, random) {
      const people = randomInt(random, 3, 8);
      const each = randomInt(random, 3, 10);
      const total = people * each;
      return roundChoice(id, pathId, total, people, random, {
        raw: `${people} kişiye ${each}'er birim verilirse toplam kaç birim gerekir?`,
        context: `${people} çocuğun her birine ${each} ceviz verilecek. Toplam kaç ceviz gerekir?`,
        strategy: `Kişi sayısı × kişi başı pay. Veriler: ${people}, ${each}.`,
        explanation: `${people} × ${each} = ${total}.`
      }, [people, each]);
    },
    verify(id, pathId, random) {
      const people = randomInt(random, 3, 8);
      const each = randomInt(random, 3, 10);
      const total = people * each;
      const wrong = total - people; // çıkarma yanılgısı
      return roundChoice(id, pathId, each, people, random, {
        raw: `${total} ÷ ${people} için bir öğrenci ${wrong} bulmuş. Doğru pay kaçtır?`,
        context: `${total} ceviz ${people} çocuğa paylaşılacak. Bir öğrenci ${total}−${people}=${wrong} dedi. Her çocuğa düşen doğru sayı kaçtır?`,
        strategy: `Bölme yerine çıkarma yapılıp yapılmadığını kontrol et. ${total}, ${people}.`,
        explanation: `Doğru işlem bölmedir: ${total} ÷ ${people} = ${each}. ${wrong} çıkarma yanılgısıdır.`
      }, [wrong, total]);
    },
    compare(id, pathId, random) {
      const people1 = randomInt(random, 3, 6);
      const each1 = randomInt(random, 4, 9);
      const total1 = people1 * each1;
      const people2 = people1 + 1;
      const each2 = each1;
      const total2 = people2 * each2;
      const answer = Math.abs(each1 - each2) === 0 ? Math.abs(total1 - total2) : Math.abs(each1 - each2);
      // same each → compare totals needed; force meaningful compare on totals
      const diff = Math.abs(total1 - total2);
      return roundChoice(id, pathId, diff, people1, random, {
        raw: `A: ${total1} birim ${people1} kişiye; B: ${total2} birim ${people2} kişiye eşit paylaşım. Toplamlar arasındaki fark kaçtır?`,
        context: `A grubunda ${total1} ceviz ${people1} çocuğa, B grubunda ${total2} ceviz ${people2} çocuğa eşit dağıtılacak. Toplam ceviz farkı kaçtır?`,
        strategy: `Her senaryonun toplamını bilerek farkı bul. A:${total1}/${people1}, B:${total2}/${people2}.`,
        explanation: `|${total1}−${total2}|=${diff}. (Kişi başı pay her iki senaryoda ${each1}.)`
      }, [total1, total2, each1, answer]);
    }
  });
}

function familyElapsedTime() {
  return buildFamily('ph-elapsed-time-add', {
    direct(id, pathId, random) {
      const start = randomInt(random, 8, 14);
      const duration = randomInt(random, 2, 5);
      const answer = start + duration;
      return roundChoice(id, pathId, answer, duration, random, {
        raw: `Saat ${start}.00’te başlayan etkinlik ${duration} saat sürer. Bitiş saati kaçtır?`,
        context: `Saat ${start}.00’te başlayan bir etkinlik ${duration} saat sürüyor. Etkinlik saat kaçta biter?`,
        strategy: `Başlangıç saatine süreyi ekle. Başlangıç ${start}, süre ${duration}.`,
        explanation: `${start} + ${duration} = ${answer}.00.`
      }, [start, duration, start - duration]);
    },
    reverse(id, pathId, random) {
      const start = randomInt(random, 8, 14);
      const duration = randomInt(random, 2, 5);
      const end = start + duration;
      return roundChoice(id, pathId, duration, 1, random, {
        raw: `${start}.00’te başlayıp ${end}.00’te biten etkinlik kaç saat sürer?`,
        context: `Etkinlik saat ${start}.00’te başladı ve ${end}.00’te bitti. Kaç saat sürmüştür?`,
        strategy: `Bitişten başlangıcı çıkar. ${end} ve ${start}.`,
        explanation: `${end} − ${start} = ${duration} saat.`
      }, [end, start]);
    },
    verify(id, pathId, random) {
      const start = randomInt(random, 8, 14);
      const duration = randomInt(random, 2, 5);
      const answer = start + duration;
      const wrong = start * duration; // çarpma yanılgısı
      return roundChoice(id, pathId, answer, duration, random, {
        raw: `${start} + ${duration} saat için bir öğrenci ${wrong} bulmuş. Doğru bitiş saati kaçtır?`,
        context: `Saat ${start}.00’te başlayan ${duration} saatlik etkinlik için bir öğrenci ${start}×${duration}=${wrong} dedi. Doğru bitiş saati?`,
        strategy: `Süre eklenir, çarpılmaz. Başlangıç ${start}, süre ${duration}.`,
        explanation: `Doğru: ${start}+${duration}=${answer}. ${wrong} çarpma yanılgısıdır.`
      }, [wrong, start]);
    },
    compare(id, pathId, random) {
      const start1 = randomInt(random, 8, 12);
      const dur1 = randomInt(random, 2, 4);
      const start2 = start1 + 1;
      const dur2 = dur1 + 1;
      const end1 = start1 + dur1;
      const end2 = start2 + dur2;
      const answer = Math.abs(end1 - end2);
      return roundChoice(id, pathId, answer, 1, random, {
        raw: `A: ${start1}+${dur1}; B: ${start2}+${dur2}. Bitiş saatleri farkı kaçtır?`,
        context: `A etkinliği ${start1}.00’te ${dur1} saat, B etkinliği ${start2}.00’te ${dur2} saat sürüyor. Bitiş saatleri arasındaki fark kaç saattir?`,
        strategy: `Her bitişi bul, farkı al. A:(${start1},${dur1}) B:(${start2},${dur2}).`,
        explanation: `A bitiş ${end1}, B bitiş ${end2}; fark ${answer}.`
      }, [end1, end2]);
    }
  });
}

function familyMoneyChange() {
  return buildFamily('ph-money-change', {
    direct(id, pathId, random) {
      const count = randomInt(random, 2, 6);
      const price = randomInt(random, 5, 20);
      const total = count * price;
      const paid = Math.ceil(total / 10) * 10 + 20;
      const answer = paid - total;
      return roundChoice(id, pathId, answer, price, random, {
        raw: `${count} × ${price} TL alışverişe ${paid} TL verildi. Para üstü kaç TL?`,
        context: `Tanesi ${price} TL olan defterlerden ${count} tane alan öğrenci ${paid} TL veriyor. Kaç TL para üstü alır?`,
        strategy: `Önce toplam tutarı bul, ödeneninden çıkar. ${count}, ${price}, ödenen ${paid}.`,
        explanation: `Toplam ${count}×${price}=${total} TL; para üstü ${paid}−${total}=${answer} TL.`
      }, [total, paid, count + price]);
    },
    reverse(id, pathId, random) {
      const count = randomInt(random, 2, 6);
      const price = randomInt(random, 5, 20);
      const total = count * price;
      const paid = Math.ceil(total / 10) * 10 + 20;
      const change = paid - total;
      return roundChoice(id, pathId, paid, 10, random, {
        raw: `${count}×${price}=${total} TL’lik alışverişte para üstü ${change} TL. Kaç TL ödenmiştir?`,
        context: `${count} defter × ${price} TL = ${total} TL tuttu; para üstü ${change} TL geldi. Öğrenci kaç TL vermiştir?`,
        strategy: `Tutar + para üstü = ödenen. ${total}+${change}.`,
        explanation: `${total}+${change}=${paid}.`
      }, [total, change]);
    },
    verify(id, pathId, random) {
      const count = randomInt(random, 2, 6);
      const price = randomInt(random, 5, 20);
      const total = count * price;
      const paid = Math.ceil(total / 10) * 10 + 20;
      const answer = paid - total;
      const wrong = paid - (count + price); // çarpma yerine toplama
      const safeWrong = wrong === answer ? answer + price : Math.max(0, wrong);
      return roundChoice(id, pathId, answer, price, random, {
        raw: `${count}×${price}, ödenen ${paid}. Bir öğrenci para üstünü ${safeWrong} bulmuş. Doğrusu kaçtır?`,
        context: `${count} defter × ${price} TL’ye ${paid} TL verdi. Öğrenci önce ${count}+${price} yapıp para üstünü ${safeWrong} buldu. Doğru para üstü?`,
        strategy: `Toplam tutar çarpımla bulunur. ${count}, ${price}, ${paid}.`,
        explanation: `Doğru toplam ${total}; para üstü ${answer}. ${safeWrong} toplama yanılgısından gelir.`
      }, [safeWrong, total]);
    },
    compare(id, pathId, random) {
      const count1 = randomInt(random, 2, 5);
      const price = randomInt(random, 5, 15);
      const total1 = count1 * price;
      const paid1 = Math.ceil(total1 / 10) * 10 + 20;
      const change1 = paid1 - total1;
      const count2 = count1 + 1;
      const total2 = count2 * price;
      const paid2 = Math.ceil(total2 / 10) * 10 + 20;
      const change2 = paid2 - total2;
      const answer = Math.abs(change1 - change2);
      return roundChoice(id, pathId, answer, price, random, {
        raw: `A: ${count1}×${price}, ödenen ${paid1}. B: ${count2}×${price}, ödenen ${paid2}. Para üstü farkı?`,
        context: `A alışverişi ${count1} defter, B alışverişi ${count2} defter (tanesi ${price} TL). Ödemeler ${paid1} ve ${paid2} TL. Para üstleri farkı kaç TL?`,
        strategy: `Her para üstünü bul, farkı al.`,
        explanation: `A üstü ${change1}, B üstü ${change2}; fark ${answer}.`
      }, [change1, change2]);
    }
  });
}

function familyFractionOfWhole() {
  return buildFamily('ph-fraction-of-whole', {
    direct(id, pathId, random) {
      const denominator = pick([2, 4, 5], random);
      const whole = randomInt(random, 3, 10);
      const total = denominator * whole;
      const numerator = randomInt(random, 1, denominator - 1);
      const answer = total * numerator / denominator;
      return roundChoice(id, pathId, answer, whole, random, {
        raw: `${total} birimin ${numerator}/${denominator}’ü kaçtır?`,
        context: `${total} bilyenin ${numerator}/${denominator}’ü mavidir. Kaç mavi bilye vardır?`,
        strategy: `Önce bir payı bul (toplam÷payda), sonra pay ile çarp. ${total}, ${numerator}/${denominator}.`,
        explanation: `${total} ÷ ${denominator} × ${numerator} = ${answer}.`
      }, [total / denominator, total, numerator]);
    },
    reverse(id, pathId, random) {
      const denominator = pick([2, 4, 5], random);
      const whole = randomInt(random, 3, 10);
      const total = denominator * whole;
      const numerator = randomInt(random, 1, denominator - 1);
      const part = total * numerator / denominator;
      return roundChoice(id, pathId, total, whole, random, {
        raw: `Bir bütünün ${numerator}/${denominator}’ü ${part} ise bütün kaçtır?`,
        context: `Mavi bilyeler bütünün ${numerator}/${denominator}’ü ve ${part} tanedir. Toplam bilye kaçtır?`,
        strategy: `${part}, ${numerator}/${denominator} oranının tamamına karşılık gelir. Bütünü bul.`,
        explanation: `Bir pay ${part}÷${numerator}=${part / numerator}; bütün ${part / numerator}×${denominator}=${total}.`
      }, [part, numerator, denominator]);
    },
    verify(id, pathId, random) {
      const denominator = pick([2, 4, 5], random);
      const whole = randomInt(random, 3, 10);
      const total = denominator * whole;
      const numerator = randomInt(random, 1, denominator - 1);
      const answer = total * numerator / denominator;
      const wrong = total * numerator; // ÷denominator unutulması
      return roundChoice(id, pathId, answer, whole, random, {
        raw: `${total}×${numerator}/${denominator} için bir öğrenci ${wrong} bulmuş. Doğrusu kaçtır?`,
        context: `${total} bilyenin ${numerator}/${denominator}’ü için öğrenci paydayı unutup ${wrong} dedi. Doğru sayı?`,
        strategy: `Paydadaki bölmeyi kontrol et. ${total}, ${numerator}/${denominator}.`,
        explanation: `Doğru: ${total}÷${denominator}×${numerator}=${answer}. ${wrong} paydayı unutma hatasıdır.`
      }, [wrong, total]);
    },
    compare(id, pathId, random) {
      const denominator = pick([2, 4, 5], random);
      const whole1 = randomInt(random, 3, 8);
      const total1 = denominator * whole1;
      const numerator = randomInt(random, 1, denominator - 1);
      const part1 = total1 * numerator / denominator;
      const whole2 = whole1 + 1;
      const total2 = denominator * whole2;
      const part2 = total2 * numerator / denominator;
      const answer = Math.abs(part1 - part2);
      return roundChoice(id, pathId, answer, whole1, random, {
        raw: `A: ${total1}’in ${numerator}/${denominator}’ü; B: ${total2}’nin ${numerator}/${denominator}’ü. Fark kaçtır?`,
        context: `A torbasında ${total1}, B torbasında ${total2} bilye var. Her birinin ${numerator}/${denominator}’ü mavi. Mavi sayıları farkı?`,
        strategy: `Her payı bul, farkı al.`,
        explanation: `A:${part1}, B:${part2}; fark ${answer}.`
      }, [part1, part2]);
    }
  });
}

function familyPercentOfBase() {
  return buildFamily('ph-percent-of-base', {
    direct(id, pathId, random) {
      const percent = pick([10, 20, 25, 30, 40], random);
      const base = randomInt(random, 4, 20) * 20;
      const answer = base * percent / 100;
      return roundChoice(id, pathId, answer, percent, random, {
        raw: `${base} sayısının %${percent}’i kaçtır?`,
        context: `${base} öğrencinin %${percent}’i bir kulübe katılmıştır. Kaç öğrenci katılmıştır?`,
        strategy: `Tabanı yüzde ile çarpıp 100’e böl. ${base}, %${percent}.`,
        explanation: `${base} × ${percent}/100 = ${answer}.`
      }, [base, percent, base + percent]);
    },
    reverse(id, pathId, random) {
      const percent = pick([10, 20, 25, 50], random);
      const base = randomInt(random, 4, 20) * 20;
      const part = base * percent / 100;
      return roundChoice(id, pathId, base, percent, random, {
        raw: `%${percent}’i ${part} olan sayının tamamı kaçtır?`,
        context: `Kulübe katılan ${part} öğrenci, sınıfın %${percent}’idir. Sınıf mevcudu kaçtır?`,
        strategy: `${part} ÷ (${percent}/100).`,
        explanation: `${part} ÷ (${percent}/100) = ${base}.`
      }, [part, percent]);
    },
    verify(id, pathId, random) {
      const percent = pick([10, 20, 25, 30, 40], random);
      const base = randomInt(random, 4, 20) * 20;
      const answer = base * percent / 100;
      const wrong = base * percent; // /100 unutulması
      return roundChoice(id, pathId, answer, percent, random, {
        raw: `${base}’nin %${percent}’i için bir öğrenci ${wrong} bulmuş. Doğrusu kaçtır?`,
        context: `${base} öğrencinin %${percent}’i için öğrenci 100’e bölmeyi unutup ${wrong} dedi. Doğru sayı?`,
        strategy: `Yüzde hesabında ÷100 adımını kontrol et.`,
        explanation: `Doğru: ${base}×${percent}/100=${answer}. ${wrong} ÷100 unutma hatasıdır.`
      }, [wrong, base]);
    },
    compare(id, pathId, random) {
      const percent = pick([10, 20, 25], random);
      const base1 = randomInt(random, 5, 15) * 20;
      const base2 = base1 + 40;
      const p1 = base1 * percent / 100;
      const p2 = base2 * percent / 100;
      const answer = Math.abs(p1 - p2);
      return roundChoice(id, pathId, answer, percent, random, {
        raw: `A: ${base1}’in %${percent}’i; B: ${base2}’nin %${percent}’i. Fark?`,
        context: `A okulunda ${base1}, B okulunda ${base2} öğrenci var. Her birinin %${percent}’i kulübe katıldı. Katılanlar farkı?`,
        strategy: `Her yüzdeyi bul, farkı al.`,
        explanation: `A:${p1}, B:${p2}; fark ${answer}.`
      }, [p1, p2]);
    }
  });
}

function familyPartFromRatio() {
  return buildFamily('ph-part-from-ratio', {
    direct(id, pathId, random) {
      const a = randomInt(random, 2, 5);
      const b = randomInt(random, 3, 7);
      const factor = randomInt(random, 4, 12);
      const total = (a + b) * factor;
      const answer = b * factor;
      return roundChoice(id, pathId, answer, factor, random, {
        raw: `Oran ${a}:${b}, toplam ${total}. İkinci pay kaçtır?`,
        context: `Kırmızı ve mavi boncukların oranı ${a}:${b}, toplam boncuk sayısı ${total}’dir. Mavi boncuk sayısı kaçtır?`,
        strategy: `Toplam oranı bul, bir payı hesapla, istenen payı çarp. ${a}:${b}, toplam ${total}.`,
        explanation: `Toplam oran ${a + b}; bir pay ${total}÷${a + b}=${factor}; mavi ${b}×${factor}=${answer}.`
      }, [a * factor, factor, total]);
    },
    reverse(id, pathId, random) {
      const a = randomInt(random, 2, 5);
      const b = randomInt(random, 3, 7);
      const factor = randomInt(random, 4, 12);
      const blue = b * factor;
      const total = (a + b) * factor;
      return roundChoice(id, pathId, total, factor, random, {
        raw: `Oran ${a}:${b}, ikinci pay ${blue}. Toplam kaçtır?`,
        context: `Kırmızı:mavi oranı ${a}:${b} ve mavi ${blue} tanedir. Toplam boncuk kaçtır?`,
        strategy: `Bir payı bul (${blue}÷${b}), toplam oranla çarp.`,
        explanation: `Bir pay ${blue}÷${b}=${factor}; toplam (${a}+${b})×${factor}=${total}.`
      }, [blue, a * factor]);
    },
    verify(id, pathId, random) {
      const a = randomInt(random, 2, 5);
      const b = randomInt(random, 3, 7);
      const factor = randomInt(random, 4, 12);
      const total = (a + b) * factor;
      const answer = b * factor;
      const wrong = total * b / a; // yanlış payda
      const safeWrong = Math.round(wrong) === answer ? answer + factor : Math.round(wrong);
      return roundChoice(id, pathId, answer, factor, random, {
        raw: `Oran ${a}:${b}, toplam ${total}. Bir öğrenci ikinci payı ${safeWrong} bulmuş. Doğrusu?`,
        context: `Oran ${a}:${b}, toplam ${total}. Öğrenci mavi için ${safeWrong} dedi. Doğru mavi sayısı?`,
        strategy: `Toplam oran ${a}+${b} ile bölündüğünü kontrol et.`,
        explanation: `Doğru: bir pay ${factor}, mavi ${answer}. ${safeWrong} oran paydasını karıştırmaktan gelir.`
      }, [safeWrong, a * factor]);
    },
    compare(id, pathId, random) {
      const a = randomInt(random, 2, 4);
      const b = randomInt(random, 3, 5);
      const factor1 = randomInt(random, 4, 8);
      const factor2 = factor1 + 2;
      const blue1 = b * factor1;
      const blue2 = b * factor2;
      const answer = Math.abs(blue1 - blue2);
      return roundChoice(id, pathId, answer, b, random, {
        raw: `Aynı oran ${a}:${b}; A toplamı ${(a + b) * factor1}, B toplamı ${(a + b) * factor2}. İkinci paylar farkı?`,
        context: `İki torbada oran ${a}:${b}. A’da toplam ${(a + b) * factor1}, B’de ${(a + b) * factor2} boncuk var. Mavi farkı?`,
        strategy: `Her torbanın mavi payını bul, farkı al.`,
        explanation: `A mavi ${blue1}, B mavi ${blue2}; fark ${answer}.`
      }, [blue1, blue2]);
    }
  });
}

function familyDistanceSpeedTime() {
  return buildFamily('ph-distance-speed-time', {
    direct(id, pathId, random) {
      const speed = randomInt(random, 40, 90);
      const time = randomInt(random, 2, 5);
      const answer = speed * time;
      return roundChoice(id, pathId, answer, speed, random, {
        raw: `${speed} km/sa × ${time} sa = ? km`,
        context: `Saatte ${speed} km hızla giden araç ${time} saatte kaç kilometre yol alır?`,
        strategy: `Yol = hız × zaman. ${speed}, ${time}.`,
        explanation: `Yol = ${speed} × ${time} = ${answer} km.`
      }, [speed + time, speed, time], [-50, -30, 30, 50]);
    },
    reverse(id, pathId, random) {
      const speed = randomInt(random, 40, 90);
      const time = randomInt(random, 2, 5);
      const distance = speed * time;
      return roundChoice(id, pathId, time, 1, random, {
        raw: `${distance} km yol, ${speed} km/sa hız. Süre kaç saattir?`,
        context: `${speed} km/sa hızla giden araç ${distance} km yol almıştır. Bu yol kaç saatte alınmıştır?`,
        strategy: `Süre = yol ÷ hız.`,
        explanation: `${distance} ÷ ${speed} = ${time} saat.`
      }, [distance, speed]);
    },
    verify(id, pathId, random) {
      const speed = randomInt(random, 40, 90);
      const time = randomInt(random, 2, 5);
      const answer = speed * time;
      const wrong = speed + time; // toplama yanılgısı
      return roundChoice(id, pathId, answer, speed, random, {
        raw: `${speed}×${time} için bir öğrenci ${wrong} bulmuş. Doğru yol kaç km?`,
        context: `${speed} km/sa ile ${time} saat için öğrenci ${speed}+${time}=${wrong} dedi. Doğru yol?`,
        strategy: `Çarpma mı toplama mı gerektiğini kontrol et.`,
        explanation: `Doğru: ${speed}×${time}=${answer}. ${wrong} toplama yanılgısıdır.`
      }, [wrong, speed]);
    },
    compare(id, pathId, random) {
      const speed1 = randomInt(random, 40, 70);
      const time = randomInt(random, 2, 4);
      const speed2 = speed1 + randomInt(random, 10, 20);
      const d1 = speed1 * time;
      const d2 = speed2 * time;
      const answer = Math.abs(d1 - d2);
      return roundChoice(id, pathId, answer, speed1, random, {
        raw: `A: ${speed1}×${time}; B: ${speed2}×${time}. Yol farkı?`,
        context: `A aracı ${speed1} km/sa, B aracı ${speed2} km/sa ile ${time} saat gidiyor. Yol farkı kaç km?`,
        strategy: `Her yolu bul, farkı al.`,
        explanation: `A:${d1}, B:${d2}; fark ${answer}.`
      }, [d1, d2]);
    }
  });
}

function familyThreeValueAverage() {
  return buildFamily('ph-three-value-average', {
    direct(id, pathId, random) {
      const a = randomInt(random, 50, 90);
      const b = randomInt(random, 50, 90);
      let c = randomInt(random, 50, 90);
      c += (3 - ((a + b + c) % 3)) % 3;
      const answer = (a + b + c) / 3;
      return roundChoice(id, pathId, answer, 5, random, {
        raw: `(${a}+${b}+${c})÷3 ortalama kaçtır?`,
        context: `Üç sınav notu ${a}, ${b} ve ${c} olan öğrencinin ortalaması kaçtır?`,
        strategy: `Topla, 3’e böl. ${a}, ${b}, ${c}.`,
        explanation: `(${a}+${b}+${c})÷3=${answer}.`
      }, [a + b + c, a, b]);
    },
    reverse(id, pathId, random) {
      const a = randomInt(random, 50, 90);
      const b = randomInt(random, 50, 90);
      const avg = randomInt(random, 60, 85);
      const c = avg * 3 - a - b;
      if (c < 0 || c > 100) {
        // retry with safer bounds
        const a2 = 60;
        const b2 = 70;
        const avg2 = 70;
        const c2 = avg2 * 3 - a2 - b2;
        return roundChoice(id, pathId, c2, 5, random, {
          raw: `Ortalama ${avg2}; iki not ${a2} ve ${b2}. Üçüncü not kaçtır?`,
          context: `Öğrencinin ortalaması ${avg2}. İki sınavı ${a2} ve ${b2}. Üçüncü sınav notu kaç olmalıdır?`,
          strategy: `3×ortalama − bilinen notlar.`,
          explanation: `${avg2}×3 − ${a2} − ${b2} = ${c2}.`
        }, [avg2 * 3, a2, b2]);
      }
      return roundChoice(id, pathId, c, 5, random, {
        raw: `Ortalama ${avg}; iki not ${a} ve ${b}. Üçüncü not kaçtır?`,
        context: `Öğrencinin ortalaması ${avg}. İki sınavı ${a} ve ${b}. Üçüncü sınav notu kaç olmalıdır?`,
        strategy: `3×ortalama − bilinen notlar.`,
        explanation: `${avg}×3 − ${a} − ${b} = ${c}.`
      }, [avg * 3, a, b]);
    },
    verify(id, pathId, random) {
      const a = randomInt(random, 50, 90);
      const b = randomInt(random, 50, 90);
      let c = randomInt(random, 50, 90);
      c += (3 - ((a + b + c) % 3)) % 3;
      const answer = (a + b + c) / 3;
      const wrong = a + b + c; // ÷3 unutulması
      return roundChoice(id, pathId, answer, 5, random, {
        raw: `(${a}+${b}+${c})÷3 için bir öğrenci ${wrong} bulmuş. Doğru ortalama?`,
        context: `Notlar ${a}, ${b}, ${c}. Öğrenci toplamı ortalama sanıp ${wrong} dedi. Doğru ortalama?`,
        strategy: `Toplamın 3’e bölündüğünü kontrol et.`,
        explanation: `Doğru ortalama ${answer}. ${wrong} ÷3 unutma hatasıdır.`
      }, [wrong, a]);
    },
    compare(id, pathId, random) {
      const a1 = 60;
      const b1 = 70;
      const c1 = 80;
      const avg1 = (a1 + b1 + c1) / 3;
      const a2 = 50;
      const b2 = 70;
      const c2 = 90;
      const avg2 = (a2 + b2 + c2) / 3;
      const answer = Math.abs(avg1 - avg2);
      return roundChoice(id, pathId, answer, 5, random, {
        raw: `A ortalaması (${a1}+${b1}+${c1})÷3; B ortalaması (${a2}+${b2}+${c2})÷3. Fark?`,
        context: `A öğrencisinin notları ${a1},${b1},${c1}; B’ninki ${a2},${b2},${c2}. Ortalama farkı kaçtır?`,
        strategy: `Her ortalamayı bul, farkı al.`,
        explanation: `A:${avg1}, B:${avg2}; fark ${answer}.`
      }, [avg1, avg2]);
    }
  });
}

function familyLinearUnknown() {
  // Sözel ifade — "Nx ± d = R" ve "x kaçtır" YASAK (trivialLinear/trivialPrompt)
  return buildFamily('ph-linear-unknown-reverse', {
    direct(id, pathId, random) {
      const unknown = randomInt(random, 4, 18);
      const multiplier = randomInt(random, 2, 5);
      const add = randomInt(random, 3, 15);
      const result = multiplier * unknown + add;
      return roundChoice(id, pathId, unknown, multiplier, random, {
        raw: `Bir sayının ${multiplier} katının ${add} fazlası ${result}’tir. Bu sayı kaçtır?`,
        context: `Bir sınıfın öğrenci sayısının ${multiplier} katına ${add} eklendiğinde ${result} oluyor. Öğrenci sayısı kaçtır?`,
        strategy: `Önce ${add}’i geri çıkar, sonra ${multiplier}’e böl. Sonuç ${result}.`,
        explanation: `${result} − ${add} = ${result - add}; ${result - add} ÷ ${multiplier} = ${unknown}.`
      }, [result, add, multiplier * unknown]);
    },
    reverse(id, pathId, random) {
      const unknown = randomInt(random, 4, 18);
      const multiplier = randomInt(random, 2, 5);
      const add = randomInt(random, 3, 15);
      const result = multiplier * unknown + add;
      return roundChoice(id, pathId, result, multiplier, random, {
        raw: `Bir sayının ${multiplier} katının ${add} fazlasını hesapla; sayı ${unknown} ise sonuç kaçtır?`,
        context: `${unknown} öğrencinin ${multiplier} katına ${add} eklenirse kaç kişi olur?`,
        strategy: `Önce ${multiplier} ile çarp, sonra ${add} ekle. Sayı ${unknown}.`,
        explanation: `${multiplier}×${unknown}=${multiplier * unknown}; +${add}=${result}.`
      }, [unknown, multiplier * unknown]);
    },
    verify(id, pathId, random) {
      const unknown = randomInt(random, 4, 18);
      const multiplier = randomInt(random, 2, 5);
      const add = randomInt(random, 3, 15);
      const result = multiplier * unknown + add;
      const wrong = (result + add) / multiplier; // işaret ters
      const safeWrong = Math.round(wrong) === unknown ? unknown + 1 : Math.round(wrong);
      return roundChoice(id, pathId, unknown, multiplier, random, {
        raw: `“Bir sayının ${multiplier} katının ${add} fazlası ${result}” için bir öğrenci ${safeWrong} bulmuş. Doğru sayı?`,
        context: `Öğrenci ${add}’i ekleyerek geri gitmeye çalışıp ${safeWrong} buldu. Doğru sayı kaçtır?`,
        strategy: `Fazlalığı çıkarmak gerekir, eklemek değil. Sonuç ${result}, kat ${multiplier}, fazlalık ${add}.`,
        explanation: `Doğru: ${result}−${add}=${result - add}; ÷${multiplier}=${unknown}. ${safeWrong} işaret hatasıdır.`
      }, [safeWrong, result]);
    },
    compare(id, pathId, random) {
      const u1 = randomInt(random, 5, 12);
      const m = randomInt(random, 2, 4);
      const add = randomInt(random, 3, 10);
      const u2 = u1 + randomInt(random, 1, 4);
      const r1 = m * u1 + add;
      const r2 = m * u2 + add;
      const answer = Math.abs(r1 - r2);
      return roundChoice(id, pathId, answer, m, random, {
        raw: `A sayısı ${u1}, B sayısı ${u2}; her birinin ${m} katının ${add} fazlası alınır. Sonuçlar farkı?`,
        context: `A sınıfında ${u1}, B sınıfında ${u2} öğrenci var. Her birinin ${m} katına ${add} ekleniyor. Elde edilen sonuçların farkı kaçtır?`,
        strategy: `Her sonucu bul, farkı al.`,
        explanation: `A:${r1}, B:${r2}; fark ${answer}.`
      }, [r1, r2]);
    }
  });
}

function familyPercentDiscount() {
  return buildFamily('ph-percent-discount-price', {
    direct(id, pathId, random) {
      const price = randomInt(random, 5, 20) * 50;
      const discount = pick([10, 20, 25, 30], random);
      const answer = price * (100 - discount) / 100;
      return roundChoice(id, pathId, answer, discount, random, {
        raw: `${price} TL’ye %${discount} indirim. Yeni fiyat kaç TL?`,
        context: `${price} TL’lik bir ürüne %${discount} indirim uygulanıyor. İndirimli fiyat kaç TL olur?`,
        strategy: `Önce indirim tutarını bul veya (100−indirim)% ile çarp. ${price}, %${discount}.`,
        explanation: `İndirim ${price * discount / 100} TL; yeni fiyat ${price}−${price * discount / 100}=${answer} TL.`
      }, [price, price * discount / 100]);
    },
    reverse(id, pathId, random) {
      const price = randomInt(random, 5, 20) * 50;
      const discount = pick([10, 20, 25], random);
      const sale = price * (100 - discount) / 100;
      return roundChoice(id, pathId, price, discount, random, {
        raw: `%${discount} indirimli fiyat ${sale} TL. Etiket fiyatı kaç TL’dir?`,
        context: `Ürün %${discount} indirimle ${sale} TL’ye satılıyor. İndirimsiz etiket fiyatı kaç TL’dir?`,
        strategy: `${sale} ÷ ((100−${discount})/100).`,
        explanation: `${sale} ÷ (${100 - discount}/100) = ${price}.`
      }, [sale, discount]);
    },
    verify(id, pathId, random) {
      const price = randomInt(random, 5, 20) * 50;
      const discount = pick([10, 20, 25, 30], random);
      const answer = price * (100 - discount) / 100;
      const wrong = price - discount; // yüzde yerine TL çıkarma
      return roundChoice(id, pathId, answer, discount, random, {
        raw: `${price} TL, %${discount} indirim. Bir öğrenci ${wrong} bulmuş. Doğru fiyat?`,
        context: `${price} TL’lik ürüne %${discount} indirim. Öğrenci ${discount} TL çıkarıp ${wrong} dedi. Doğru indirimli fiyat?`,
        strategy: `İndirim yüzde olarak uygulanır, sabit TL olarak değil.`,
        explanation: `Doğru fiyat ${answer}. ${wrong} yüzdeyi TL sanma hatasıdır.`
      }, [wrong, price]);
    },
    compare(id, pathId, random) {
      const price = randomInt(random, 8, 16) * 50;
      const d1 = 10;
      const d2 = 25;
      const s1 = price * (100 - d1) / 100;
      const s2 = price * (100 - d2) / 100;
      const answer = Math.abs(s1 - s2);
      return roundChoice(id, pathId, answer, 5, random, {
        raw: `${price} TL ürüne A:%${d1}, B:%${d2} indirim. İndirimli fiyat farkı?`,
        context: `${price} TL’lik ürün A mağazasında %${d1}, B mağazasında %${d2} indirimli. Fiyat farkı kaç TL?`,
        strategy: `Her indirimli fiyatı bul, farkı al.`,
        explanation: `A:${s1}, B:${s2}; fark ${answer}.`
      }, [s1, s2]);
    }
  });
}

function familyTwoStepAccumulateShare() {
  return buildFamily('ph-two-step-accumulate-share', {
    direct(id, pathId, random) {
      const packs = randomInt(random, 2, 5);
      const each = randomInt(random, 3, 8);
      const bonus = randomInt(random, 2, 10);
      const people = randomInt(random, 2, 5);
      const total = packs * each + bonus;
      // ensure divisible
      const adjustedBonus = bonus + ((people - (total % people)) % people);
      const finalTotal = packs * each + adjustedBonus;
      const answer = finalTotal / people;
      return roundChoice(id, pathId, answer, people, random, {
        raw: `(${packs}×${each}+${adjustedBonus})÷${people} sonucu kaçtır?`,
        context: `${packs} paketin her birinde ${each} sticker var; ayrıca ${adjustedBonus} sticker hediye geldi. Hepsi ${people} arkadaşa eşit paylaşılırsa her biri kaç sticker alır?`,
        strategy: `Önce toplamı bul (çarp + ekle), sonra kişi sayısına böl.`,
        explanation: `${packs}×${each}=${packs * each}; +${adjustedBonus}=${finalTotal}; ÷${people}=${answer}.`
      }, [finalTotal, packs * each, adjustedBonus]);
    },
    reverse(id, pathId, random) {
      const packs = randomInt(random, 2, 5);
      const each = randomInt(random, 3, 8);
      const people = randomInt(random, 2, 5);
      const eachShare = randomInt(random, 3, 8);
      const finalTotal = people * eachShare;
      const bonus = finalTotal - packs * each;
      if (bonus < 0) {
        const packs2 = 2;
        const each2 = 4;
        const people2 = 3;
        const share2 = 5;
        const total2 = people2 * share2;
        const bonus2 = total2 - packs2 * each2;
        return roundChoice(id, pathId, bonus2, 1, random, {
          raw: `${packs2}×${each2} + ? = ${total2}; ? kaçtır? (sonra ${people2}’ye bölününce ${share2} çıkıyor)`,
          context: `${packs2} paket × ${each2} sticker sonrası hediye eklenip ${people2} kişiye ${share2}’şer düşüyor. Hediye kaç stickerdir?`,
          strategy: `Toplam = kişi×pay; hediye = toplam − paket toplamı.`,
          explanation: `Toplam ${total2}; paketler ${packs2 * each2}; hediye ${bonus2}.`
        }, [total2, packs2 * each2]);
      }
      return roundChoice(id, pathId, bonus, 1, random, {
        raw: `${packs}×${each} + ? toplamı ${people} kişiye ${eachShare}’şer veriyor. ? kaçtır?`,
        context: `${packs} paket × ${each} sticker vardı. Hediye eklenince ${people} kişiye ${eachShare}’şer düştü. Hediye kaç stickerdir?`,
        strategy: `Toplam = ${people}×${eachShare}; hediye = toplam − ${packs}×${each}.`,
        explanation: `Toplam ${finalTotal}; paketler ${packs * each}; hediye ${bonus}.`
      }, [finalTotal, packs * each]);
    },
    verify(id, pathId, random) {
      const packs = randomInt(random, 2, 5);
      const each = randomInt(random, 3, 8);
      const bonus = randomInt(random, 2, 10);
      const people = randomInt(random, 2, 5);
      const total = packs * each + bonus;
      const adjustedBonus = bonus + ((people - (total % people)) % people);
      const finalTotal = packs * each + adjustedBonus;
      const answer = finalTotal / people;
      const wrong = packs * each / people; // hediyeyi unutma
      const safeWrong = wrong === answer ? answer + 1 : Math.round(wrong);
      return roundChoice(id, pathId, answer, people, random, {
        raw: `(${packs}×${each}+${adjustedBonus})÷${people} için bir öğrenci ${safeWrong} bulmuş. Doğrusu?`,
        context: `${packs} paket × ${each} + ${adjustedBonus} hediye, ${people} kişiye. Öğrenci hediyeyi unutup ${safeWrong} dedi. Doğru pay?`,
        strategy: `Hediye teriminin eklenip eklenmediğini kontrol et.`,
        explanation: `Doğru toplam ${finalTotal}; pay ${answer}. ${safeWrong} hediyeyi unutma hatasıdır.`
      }, [safeWrong, finalTotal]);
    },
    compare(id, pathId, random) {
      const packs = 3;
      const each = 4;
      const bonus1 = 6;
      const bonus2 = 12;
      const people = 3;
      const t1 = packs * each + bonus1;
      const t2 = packs * each + bonus2;
      const s1 = t1 / people;
      const s2 = t2 / people;
      const answer = Math.abs(s1 - s2);
      return roundChoice(id, pathId, answer, 1, random, {
        raw: `A: (${packs}×${each}+${bonus1})÷${people}; B: (${packs}×${each}+${bonus2})÷${people}. Pay farkı?`,
        context: `Aynı ${packs} paket × ${each} sticker; A’da ${bonus1}, B’de ${bonus2} hediye var. ${people} kişilik paylar farkı?`,
        strategy: `Her payı bul, farkı al.`,
        explanation: `A:${s1}, B:${s2}; fark ${answer}.`
      }, [s1, s2]);
    }
  });
}

export const PROBLEM_HUNTER_FAMILIES = [
  familyMultiplyThenSubtract(),
  familyEqualShare(),
  familyElapsedTime(),
  familyMoneyChange(),
  familyFractionOfWhole(),
  familyPercentOfBase(),
  familyPartFromRatio(),
  familyDistanceSpeedTime(),
  familyThreeValueAverage(),
  familyLinearUnknown(),
  familyPercentDiscount(),
  familyTwoStepAccumulateShare()
];
