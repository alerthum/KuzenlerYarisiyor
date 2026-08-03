// Aşama 04 — word-mine (Kelime Madeni) için gerçek Aile→İskelet→Düşünme Yolu içeriği.
// UI kısıtı: select-valid → kind:'wordMine'; diğer 3 iskelet → kind:'choice'.
// Her aile farklı harf-yapısı / envanter düşüncesi temsil eder (kaynak kelime makyajı değil).

import { canBuildWord, letterInventory, normalizeTurkish } from '../../engines/word-engine.js';

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
  return `word-mine:${skeletonId}:${pathId}:${simpleHash(raw)}`;
}

const PATH_IDS = ['raw-letters', 'context-embedded', 'staged-strategy-hint'];

const TASK_TRAITS = {
  select: ['strategySelection', 'multiStepInference'],
  forced: ['informationLinking', 'multiStepInference'],
  spot: ['errorAnalysis', 'conditionEvaluation'],
  compare: ['strategySelection', 'usingIntermediateResultInNewDecision']
};

function vowelCount(word) {
  return [...normalizeTurkish(word)].filter((ch) => 'aeıioöuüâîû'.includes(ch)).length;
}

function buildableOnly(source, words) {
  return words.filter((w) => canBuildWord(source, w));
}

function okCode(word) {
  const w = normalizeTurkish(word).slice(0, 7);
  return `OK:${w}`;
}

function noCode(word) {
  const w = normalizeTurkish(word).slice(0, 7);
  return `NO:${w}`;
}

function invalidWordFor(source, random) {
  const inv = letterInventory(source);
  const extras = ['m', 'x', 'q', 'z', 'w', 'p', 'f', 'j'];
  for (const letter of shuffle(extras, random)) {
    if (!inv.has(letter)) return `${letter}ara`;
  }
  const [letter, count] = [...inv.entries()][0];
  return letter.repeat(count + 2);
}

function longestBuildable(source, allowed) {
  return buildableOnly(source, allowed).sort((a, b) => normalizeTurkish(b).length - normalizeTurkish(a).length)[0];
}

function pathWrap(pathId, rawPrompt, contextHint, strategyHint, structureCue = '') {
  const cue = structureCue ? `${structureCue.replace(/-/g, ' ')} envanteri: ` : '';
  if (pathId === 'raw-letters') {
    return {
      prompt: `${cue}${rawPrompt}`,
      context: contextHint || 'Kaynak kelimedeki harf envanterini say; fazla veya eksik harf kullanma.'
    };
  }
  if (pathId === 'context-embedded') {
    return {
      prompt: `Sınıfta çözülen kelime madeni (${structureCue || 'genel'}): ${rawPrompt}`,
      context: 'Senaryodaki gereksiz ayrıntıları ayıkla; yalnız harf envanterine odaklan.'
    };
  }
  return {
    prompt: `${cue}${strategyHint || 'Önce harf sayım tablosunu çıkar, sonra aday kelimeleri eleyerek ilerle.'} ${rawPrompt}`,
    context: 'Strateji ipucu cevabı doğrudan vermez; yalnız düşünme sırasını gösterir.'
  };
}

function roundWordMine(skeletonId, pathId, source, allowed, random, texts) {
  const structureCue = String(skeletonId || '').split(':')[0];
  const { prompt } = pathWrap(pathId, texts.raw, texts.context, texts.strategy, structureCue);
  const instanceNonce = Math.floor(random() * 1e9).toString(36);
  return {
    kind: 'wordMine',
    source,
    allowed: buildableOnly(source, allowed),
    prompt,
    explanation: texts.explanation,
    questionKey: wrapKey(skeletonId, pathId, `${source}|${allowed.slice(0, 4).join(',')}|${instanceNonce}`)
  };
}

function roundChoice(skeletonId, pathId, answerText, distractors, random, texts) {
  const pool = [answerText, ...distractors];
  const unique = [...new Set(pool)];
  while (unique.length < 4) unique.push(`X${unique.length}`);
  const options = shuffle(unique.slice(0, 4), random);
  const answerIndex = options.indexOf(answerText);
  const structureCue = String(skeletonId || '').split(':')[0];
  const { prompt, context } = pathWrap(pathId, texts.raw, texts.context, texts.strategy, structureCue);
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

function parseChoiceWord(code) {
  const m = String(code).match(/^(?:OK|NO):(.+)$/);
  return m ? m[1] : null;
}

// ---- 1. wm-vowel-rich — ünlü zengin kaynak, kısa ünlü ağırlıklı kelimeler ----
function familyVowelRich() {
  const source = 'arkadaşlık';
  const allowed = ['ara', 'arka', 'arkadaş', 'aşık', 'aşk', 'adaş', 'adaşlık', 'kar', 'kara', 'kaş', 'kış', 'kır', 'şaka', 'şarkı', 'aş'];
  return buildFamily('wm-vowel-rich', {
    select(id, pathId, random) {
      return roundWordMine(id, pathId, source, allowed, random, {
        raw: `Kaynak: “${source}”. Ünlü ağırlıklı, envanterden kurulabilir kelimeleri kaz.`,
        strategy: 'Önce ünlü harfleri say; kısa kelimeler genelde daha çok ünlü içerir.',
        explanation: `“${source}” çok ünlü taşır; ara, aşk, şaka gibi kelimeler ünlü zenginliğiyle öne çıkar.`
      });
    },
    forced(id, pathId, random) {
      const target = pick(buildableOnly(source, allowed).filter((w) => vowelCount(w) >= 2), random);
      const answer = okCode(target);
      const bad = invalidWordFor(source, random);
      return roundChoice(id, pathId, answer, [noCode(bad), okCode(pick(allowed, random)), `L${normalizeTurkish(target).length + 1}`], random, {
        raw: `Kaynak “${source}”. En az 2 ünlü içeren ve KESİNLİKLE kurulabilir kelime kodu?`,
        explanation: `“${target}” envanterden kurulur ve ${vowelCount(target)} ünlü taşır → ${answer}.`
      });
    },
    spot(id, pathId, random) {
      const bad = invalidWordFor(source, random);
      const answer = noCode(bad);
      const good = pick(buildableOnly(source, allowed), random);
      return roundChoice(id, pathId, answer, [okCode(good), okCode(pick(allowed, random)), okCode(pick(allowed, random))], random, {
        raw: `Kaynak “${source}”. Aşağıdaki adaylardan hangisi harf envanterini BOZAR?`,
        explanation: `“${bad}” kaynakta olmayan/fazla harf kullanır → ${answer}.`
      });
    },
    compare(id, pathId, random) {
      const a = pick(['ara', 'aşk', 'şaka'], random);
      const b = invalidWordFor(source, random);
      const answer = okCode(a);
      return roundChoice(id, pathId, answer, [noCode(b), noCode(invalidWordFor(source, random)), `S2`], random, {
        raw: `Kaynak “${source}”. Ünlü madenciliği için hangi aday kodu hem geçerli hem ünlü-dostu?`,
        explanation: `“${a}” kurulabilir; diğer adaylar envanter ihlali veya anlamsız kod taşır.`
      });
    }
  });
}

// ---- 2. wm-consonant-cluster — ünsüz kümeleri (mat-, tek-, tir-) ----
function familyConsonantCluster() {
  const source = 'matematikçiler';
  const allowed = ['matematik', 'mat', 'tek', 'ter', 'etik', 'etki', 'kiremit', 'tire', 'teker', 'kere', 'krem', 'mert', 'mimar', 'tamir', 'temel', 'iletim', 'iklim', 'kilim'];
  return buildFamily('wm-consonant-cluster', {
    select(id, pathId, random) {
      return roundWordMine(id, pathId, source, allowed, random, {
        raw: `Kaynak: “${source}”. Ünsüz kümelerini (mat, tek, tir…) koruyarak kelime kaz.`,
        strategy: 'Ünsüz bloklarını tek parça say; araya ünlü eklerken envanterden düş.',
        explanation: 'Bu kaynak mat-/tek-/tir- gibi Türkçe ünsüz kümeleri taşır; kiremit, temel, iklim tipik örneklerdir.'
      });
    },
    forced(id, pathId, random) {
      const target = pick(['mat', 'tek', 'tire', 'krem'], random);
      const answer = okCode(target);
      return roundChoice(id, pathId, answer, [noCode(invalidWordFor(source, random)), okCode('matematik'), `L${normalizeTurkish(target).length - 1}`], random, {
        raw: `Kaynak “${source}”. Ünsüz kümesi “${target.slice(0, 3)}” ile başlayan ve ZORUNLU kurulabilir kod?`,
        explanation: `“${target}” küme harflerini kaynaktan alır → ${answer}.`
      });
    },
    spot(id, pathId, random) {
      const bad = invalidWordFor(source, random);
      return roundChoice(id, pathId, noCode(bad), [okCode('mat'), okCode('tek'), okCode('tire')], random, {
        raw: `Kaynak “${source}”. Hangi aday ünsüz kümesi için imkânsız harf kullanır?`,
        explanation: `“${bad}” envanter dışı harf taşır.`
      });
    },
    compare(id, pathId, random) {
      const answer = okCode('kiremit');
      return roundChoice(id, pathId, answer, [noCode('mxtek'), okCode('mat'), noCode('qzmat')], random, {
        raw: `Kaynak “${source}”. En uzun ünsüz-kümeli geçerli aday kodu hangisi?`,
        explanation: 'kiremit mat+tir+kire envanterini birleştirir; diğerleri daha kısa veya geçersiz.'
      });
    }
  });
}

// ---- 3. wm-repeated-letter — tekrarlı harf envanteri (o, u, l) ----
function familyRepeatedLetter() {
  const source = 'sorumluluk';
  const allowed = ['soru', 'sor', 'sulu', 'suluk', 'sol', 'soluk', 'oluk', 'olur', 'olum', 'kuru', 'kur', 'kurum', 'koru', 'lokum', 'mor', 'rum', 'rol', 'sok', 'sokum'];
  return buildFamily('wm-repeated-letter', {
    select(id, pathId, random) {
      return roundWordMine(id, pathId, source, allowed, random, {
        raw: `Kaynak: “${source}”. Tekrarlı harfleri (o, u, l…) doğru sayarak kelime kaz.`,
        strategy: 'Aynı harfin kaç kez kullanılabileceğini tabloya yaz; çift l ve çift u dikkat.',
        explanation: 'sorumluluk içinde o×2, u×2, l×2 vardır; suluk, kurum, lokum bu kısıtı test eder.'
      });
    },
    forced(id, pathId, random) {
      const target = pick(['suluk', 'kurum', 'lokum'], random);
      return roundChoice(id, pathId, okCode(target), [noCode(invalidWordFor(source, random)), okCode('sor'), `L2`], random, {
        raw: `Kaynak “${source}”. Çift harf gerektiren ve KESİNLİKLE kurulabilir kelime kodu?`,
        explanation: `“${target}” tekrarlı l/u/o harflerini doğru tüketir.`
      });
    },
    spot(id, pathId, random) {
      const inv = letterInventory(source);
      const [letter, count] = pick([...inv.entries()], random);
      const bad = letter.repeat(count + 2);
      return roundChoice(id, pathId, noCode(bad), [okCode('sulu'), okCode('kuru'), okCode('soluk')], random, {
        raw: `Kaynak “${source}”. Hangi aday “${letter}” harfini kaynaktaki ${count} adetten fazla kullanır?`,
        explanation: `“${bad}” ${letter} harfini ${count + 2} kez ister; envanter yetmez.`
      });
    },
    compare(id, pathId, random) {
      return roundChoice(id, pathId, okCode('suluk'), [okCode('sor'), noCode('llll'), okCode('kur')], random, {
        raw: `Kaynak “${source}”. Tekrarlı “l” ve “u” kullanımını en iyi test eden kod?`,
        explanation: 'suluk hem u hem l tekrarını gerektirir; sor/kur tek harfli tekrar test etmez.'
      });
    }
  });
}

// ---- 4. wm-short-dense — kısa kaynak, yoğun geçerli kelime havuzu ----
function familyShortDense() {
  const source = 'bilgisayar';
  const allowed = ['bilgi', 'bil', 'silgi', 'sil', 'sal', 'yar', 'yara', 'al', 'ara', 'bar', 'bal', 'biri', 'bir', 'gri', 'say', 'sar'];
  return buildFamily('wm-short-dense', {
    select(id, pathId, random) {
      return roundWordMine(id, pathId, source, allowed, random, {
        raw: `Kaynak: “${source}” (${normalizeTurkish(source).length} harf). Kısa ama yoğun listeden kelime kaz.`,
        strategy: 'Kısa kaynakta 3–4 harfli kelimeler verimlidir; envanter tablosunu hızlı çıkar.',
        explanation: `${allowed.length} doğrulanmış kelime bu kısa kaynaktan çıkar; bilgi, silgi, yara tipik örneklerdir.`
      });
    },
    forced(id, pathId, random) {
      const target = longestBuildable(source, allowed);
      return roundChoice(id, pathId, okCode(target), [noCode(invalidWordFor(source, random)), okCode('al'), `L${normalizeTurkish(target).length + 3}`], random, {
        raw: `Kaynak “${source}”. Bu kaynaktan kurulabilir EN UZUN kelime kodu?`,
        explanation: `En uzun geçerli aday “${target}” → ${okCode(target)}.`
      });
    },
    spot(id, pathId, random) {
      const bad = invalidWordFor(source, random);
      return roundChoice(id, pathId, noCode(bad), [okCode('bil'), okCode('ara'), okCode('sal')], random, {
        raw: `Kaynak “${source}”. Yoğun havuzda hangi aday imkânsızdır?`,
        explanation: `“${bad}” kısa kaynak envanterini aşar.`
      });
    },
    compare(id, pathId, random) {
      return roundChoice(id, pathId, okCode('silgi'), [okCode('al'), okCode('bil'), noCode('mxgi')], random, {
        raw: `Kaynak “${source}”. Harf verimliliği en yüksek (uzun + geçerli) kod?`,
        explanation: 'silgi 5 harfli ve tamamen kaynaktan; al/bil daha kısa.'
      });
    }
  });
}

// ---- 5. wm-long-sparse — uzun kaynak, seyrek geçerli kelime ----
function familyLongSparse() {
  const source = 'elektromanyetik';
  const allowed = ['elektron', 'elektrik', 'manyetik', 'metal', 'metin', 'metre', 'merak', 'mekan', 'makine', 'tek', 'teker', 'temel', 'terim', 'etki', 'etik', 'krem', 'tren', 'renk', 'yemek', 'yem', 'nota', 'not', 'rota', 'oran', 'orman', 'keman'];
  return buildFamily('wm-long-sparse', {
    select(id, pathId, random) {
      const sparse = buildableOnly(source, allowed).filter((w) => normalizeTurkish(w).length >= 4);
      return roundWordMine(id, pathId, source, sparse.length >= 6 ? sparse : allowed, random, {
        raw: `Kaynak: “${source}” (${normalizeTurkish(source).length} harf). Seyrek ama derin kelimeleri kaz.`,
        strategy: 'Uzun kaynakta nadir harfleri (y, n, m…) önce ayır; kısa kelime avına kapılma.',
        explanation: 'Uzun kaynakta kısa kelime azdır; elektron, manyetik, makine tipik seyrek derin adaylardır.'
      });
    },
    forced(id, pathId, random) {
      return roundChoice(id, pathId, okCode('elektron'), [noCode('xyzab'), okCode('tek'), `L3`], random, {
        raw: `Kaynak “${source}”. En az 7 harfli ve ZORUNLU kurulabilir kod?`,
        explanation: 'elektron 8 harfli ve tam envanterden kurulur.'
      });
    },
    spot(id, pathId, random) {
      const bad = invalidWordFor(source, random);
      return roundChoice(id, pathId, noCode(bad), [okCode('metal'), okCode('terim'), okCode('etki')], random, {
        raw: `Kaynak “${source}”. Uzun madende hangi aday harf ihlali yapar?`,
        explanation: `“${bad}” nadir harfleri fazla kullanır veya olmayan harf ekler.`
      });
    },
    compare(id, pathId, random) {
      return roundChoice(id, pathId, okCode('manyetik'), [okCode('tek'), okCode('et'), noCode('qmany')], random, {
        raw: `Kaynak “${source}”. Seyrek ama anlamlı en uzun geçerli aday?`,
        explanation: 'manyetik 8 harf ve kaynak harflerinin büyük bölümünü kullanır.'
      });
    }
  });
}

// ---- 6. wm-morph-suffix — ek/sonek türetimi (-luk, -lar, -ım) ----
function familyMorphSuffix() {
  const source = 'sorumluluklarımız';
  const allowed = ['sorumluluk', 'sorumlu', 'soru', 'sor', 'sulu', 'suluk', 'olum', 'olumlu', 'olumsuz', 'kurum', 'kurumsal', 'kurulu', 'kur', 'kuru', 'koruma', 'koru', 'kor', 'lokum', 'moral', 'mor', 'rumuz', 'uzak', 'uzam', 'sal', 'mola', 'oluk', 'soluk', 'sokum', 'akıl', 'akım', 'kural'];
  const suffixWords = buildableOnly(source, allowed).filter((w) => /luk$|lar$|ım$|sal$|suz$/.test(normalizeTurkish(w)));
  return buildFamily('wm-morph-suffix', {
    select(id, pathId, random) {
      const pool = suffixWords.length >= 6 ? suffixWords : allowed;
      return roundWordMine(id, pathId, source, pool, random, {
        raw: `Kaynak: “${source}”. Ek/sonek taşıyan (–luk, –lar, –ım…) kelimeleri kaz.`,
        strategy: 'Kök + ek parçalarını envanterden ayrı ayrı say; ek harfleri kökten sonra düş.',
        explanation: 'sorumluluklarımız morfolojik parçalara ayrılır; sorumluluk, kurumsal, olumsuz tipik ekli formdur.'
      });
    },
    forced(id, pathId, random) {
      return roundChoice(id, pathId, okCode('sorumluluk'), [noCode(invalidWordFor(source, random)), okCode('sor'), okCode('kur')], random, {
        raw: `Kaynak “${source}”. “–luk” eki taşıyan ve ZORUNLU kurulabilir kod?`,
        explanation: 'sorumluluk hem kök hem –luk ekini kaynaktan alır.'
      });
    },
    spot(id, pathId, random) {
      const bad = `${invalidWordFor(source, random)}luk`;
      return roundChoice(id, pathId, noCode(bad), [okCode('kurumsal'), okCode('olumsuz'), okCode('sorumlu')], random, {
        raw: `Kaynak “${source}”. Hangi aday ek uydururken envanteri aşar?`,
        explanation: `“${bad}” kök veya ek harflerinde fazlalık taşır.`
      });
    },
    compare(id, pathId, random) {
      return roundChoice(id, pathId, okCode('kurumsal'), [okCode('kur'), okCode('sor'), noCode('mxsal')], random, {
        raw: `Kaynak “${source}”. –sal/–sal türevini en iyi test eden geçerli kod?`,
        explanation: 'kurumsal hem kurum kökünü hem –sal ekini birleştirir.'
      });
    }
  });
}

// ---- 7. wm-loanword-pattern — alıntı kök deseni (mat-, tek-, –er) ----
function familyLoanwordPattern() {
  const source = 'matematikçiler';
  const allowed = ['matematik', 'mat', 'tek', 'ter', 'etik', 'etki', 'kiremit', 'tire', 'teker', 'kere', 'krem', 'mert', 'mimar', 'tamir', 'temel', 'iletim', 'iklim', 'kilim'];
  const loanRoots = buildableOnly(source, allowed).filter((w) => /^(mat|tek|ter|et|ik|im)/.test(normalizeTurkish(w)));
  return buildFamily('wm-loanword-pattern', {
    select(id, pathId, random) {
      const pool = loanRoots.length >= 6 ? loanRoots : allowed;
      return roundWordMine(id, pathId, source, pool, random, {
        raw: `Kaynak: “${source}”. Alıntı kök desenleri (mat–, tek–, –er) taşıyan kelimeleri kaz.`,
        strategy: 'Yabancı kök parçalarını envanter blokları olarak işaretle.',
        explanation: 'matematikçiler alıntı matematik/teknik kökleri taşır; mat, tek, tire, mert örnek desenlerdir.'
      });
    },
    forced(id, pathId, random) {
      return roundChoice(id, pathId, okCode('matematik'), [noCode('xqmat'), okCode('krem'), `L3`], random, {
        raw: `Kaynak “${source}”. “mat–” alıntı kökünü taşıyan ZORUNLU kod?`,
        explanation: 'matematik doğrudan mat kökünü içerir.'
      });
    },
    spot(id, pathId, random) {
      const bad = `xq${pick(['mat', 'tek'], random)}`;
      return roundChoice(id, pathId, noCode(bad), [okCode('tek'), okCode('ter'), okCode('etik')], random, {
        raw: `Kaynak “${source}”. Alıntı desenli hangi aday imkânsız harf kullanır?`,
        explanation: `“${bad}” x/q harfleri kaynakta yoktur.`
      });
    },
    compare(id, pathId, random) {
      return roundChoice(id, pathId, okCode('iletim'), [okCode('mat'), okCode('tek'), noCode('zter')], random, {
        raw: `Kaynak “${source}”. –im/–tim alıntı desenini en iyi temsil eden geçerli kod?`,
        explanation: 'iletim hem ilet kökünü hem alıntı –im desenini taşır.'
      });
    }
  });
}

// ---- 8. wm-semantic-field — aynı anlamsal alan (karşılaştırma) ----
function familySemanticField() {
  const source = 'karşılaştırmalar';
  const allowed = ['araştırma', 'karşı', 'karşılaş', 'karar', 'kar', 'kara', 'kır', 'kış', 'kat', 'tarak', 'tarla', 'taş', 'taşı', 'taşlı', 'artı', 'art', 'ara', 'arı', 'aşırı', 'aşır', 'mart', 'martı', 'şart', 'şaka', 'şarkı'];
  const fieldWords = buildableOnly(source, allowed).filter((w) => /^(kar|ara|tar|taş|art|şar)/.test(normalizeTurkish(w)));
  return buildFamily('wm-semantic-field', {
    select(id, pathId, random) {
      const pool = fieldWords.length >= 6 ? fieldWords : allowed;
      return roundWordMine(id, pathId, source, pool, random, {
        raw: `Kaynak: “${source}”. Karşılaştırma/ölçme alanından (kar–, ara–, tar–) kelimeleri kaz.`,
        strategy: 'Anlam alanı ipucu verir ama harf envanteri yine kesin kuraldır.',
        explanation: 'karşılaştırmalar kar–, ara–, tar– kökleriyle aynı anlamsal alandan kelimeler üretir.'
      });
    },
    forced(id, pathId, random) {
      const target = pick(['karşı', 'ara', 'tarak'], random);
      return roundChoice(id, pathId, okCode(target), [noCode(invalidWordFor(source, random)), okCode('art'), `L2`], random, {
        raw: `Kaynak “${source}”. Karşılaştırma alanından ZORUNLU kurulabilir kod?`,
        explanation: `“${target}” anlamsal alan ve envanter uyumludur.`
      });
    },
    spot(id, pathId, random) {
      const bad = invalidWordFor(source, random);
      return roundChoice(id, pathId, noCode(bad), [okCode('karar'), okCode('tarla'), okCode('ara')], random, {
        raw: `Kaynak “${source}”. Anlamsal alanda hangi aday harf envanterini bozar?`,
        explanation: `“${bad}” alan dışı harf taşır.`
      });
    },
    compare(id, pathId, random) {
      return roundChoice(id, pathId, okCode('karşılaş'), [okCode('kar'), okCode('ara'), noCode('mxlaş')], random, {
        raw: `Kaynak “${source}”. Karşılaştırma eylemini en net taşıyan geçerli kod?`,
        explanation: 'karşılaş hem kar– kökünü hem –laş eylem desenini birleştirir.'
      });
    }
  });
}

// ---- 9. wm-min-length-gate — minimum uzunluk kapısı ----
function familyMinLengthGate() {
  const source = 'paylaşmak';
  const allowed = ['pay', 'paylaş', 'paylaşma', 'yaş', 'yaşamak', 'yaşam', 'aş', 'aşmak', 'mal', 'kal'];
  const minLen = 4;
  const gated = buildableOnly(source, allowed).filter((w) => normalizeTurkish(w).length >= minLen);
  return buildFamily('wm-min-length-gate', {
    select(id, pathId, random) {
      const pool = gated.length >= 6 ? gated : buildableOnly(source, allowed);
      return roundWordMine(id, pathId, source, pool, random, {
        raw: `Kaynak: “${source}”. En az ${minLen} harfli kelimeleri kaz (kısa kelimeler kapı dışı).`,
        strategy: `Önce ${minLen} harften kısa adayları ele; sonra envanter sayımı yap.`,
        explanation: `Minimum ${minLen} harf kuralı paylaş, yaşam, paylaşma gibi kelimeleri öne çıkarır.`
      });
    },
    forced(id, pathId, random) {
      const target = pick(gated, random);
      return roundChoice(id, pathId, okCode(target), [noCode(invalidWordFor(source, random)), okCode('pay'), `L${minLen - 1}`], random, {
        raw: `Kaynak “${source}”. Min ${minLen} harf kapısını geçen ZORUNLU kurulabilir kod?`,
        explanation: `“${target}” ${normalizeTurkish(target).length} harfli ve envanterden kurulur.`
      });
    },
    spot(id, pathId, random) {
      const bad = invalidWordFor(source, random);
      return roundChoice(id, pathId, noCode(bad), [okCode('paylaş'), okCode('yaşam'), okCode('paylaşma')], random, {
        raw: `Kaynak “${source}”. Min ${minLen} harf kuralına uygun madende hangi aday harf envanterini bozar?`,
        explanation: `“${bad}” kaynakta olmayan/fazla harf taşır → ${noCode(bad)}.`
      });
    },
    compare(id, pathId, random) {
      return roundChoice(id, pathId, okCode('paylaşma'), [okCode('pay'), okCode('mal'), noCode('xaş')], random, {
        raw: `Kaynak “${source}”. L${minLen}+ kapısını geçen en uzun geçerli kod?`,
        explanation: 'paylaşma 8 harfli ve kapıyı geçer; pay/mal daha kısa.'
      });
    }
  });
}

// ---- 10. wm-exact-inventory — tam envanter tüketimi ----
function familyExactInventory() {
  const source = 'meraklılık';
  const allowed = ['merak', 'meraklı', 'akıl', 'akıllı', 'kal', 'kır', 'kıl', 'mal', 'kral', 'ılık'];
  return buildFamily('wm-exact-inventory', {
    select(id, pathId, random) {
      return roundWordMine(id, pathId, source, allowed, random, {
        raw: `Kaynak: “${source}”. Harfleri mümkün olduğunca TAM tüketen kelimeleri kaz.`,
        strategy: 'Kalan harf sayısını her kelimeden sonra güncelle; sıfıra yaklaşan adayları ara.',
        explanation: 'meraklılık 10 harf taşır; meraklı gibi kelimeler envanterin büyük bölümünü tüketir.'
      });
    },
    forced(id, pathId, random) {
      return roundChoice(id, pathId, okCode('meraklı'), [okCode('merak'), okCode('kal'), noCode('xyz')], random, {
        raw: `Kaynak “${source}”. En çok harf tüketen ZORUNLU kurulabilir kod?`,
        explanation: 'meraklı 7 harfli ve neredeyse tüm envanteri kullanır.'
      });
    },
    spot(id, pathId, random) {
      const bad = invalidWordFor(source, random);
      return roundChoice(id, pathId, noCode(bad), [okCode('meraklı'), okCode('akıllı'), okCode('kral')], random, {
        raw: `Kaynak “${source}”. Tam tüketim hedefinde hangi aday imkânsızdır?`,
        explanation: `“${bad}” olmayan/fazla harf kullanır.`
      });
    },
    compare(id, pathId, random) {
      return roundChoice(id, pathId, okCode('meraklı'), [okCode('kal'), okCode('mal'), okCode('kır')], random, {
        raw: `Kaynak “${source}”. Envanter tüketim oranı en yüksek geçerli kod?`,
        explanation: 'meraklı 7/10 harf; kal/mal/kır çok daha az tüketir.'
      });
    }
  });
}

// ---- 11. wm-anagram-core — anagram çekirdek (harf yeniden dizilim) ----
function familyAnagramCore() {
  const source = 'yardımlaşma';
  const allowed = ['yardım', 'yardımlaş', 'ara', 'arama', 'yaş', 'yaşam', 'daş', 'dam', 'dal', 'mal', 'aş', 'aşma'];
  return buildFamily('wm-anagram-core', {
    select(id, pathId, random) {
      return roundWordMine(id, pathId, source, allowed, random, {
        raw: `Kaynak: “${source}”. Harfleri yeniden dizerek (anagram) anlamlı kelimeler kaz.`,
        strategy: 'Harfleri alfabetik sırala; aynı çokluktan başka kelime aramak anagram avını kolaylaştırır.',
        explanation: 'yardımlaşma → yardım, arama, yaşam aynı harf çokluklarıyla farklı dizilimlerdir.'
      });
    },
    forced(id, pathId, random) {
      return roundChoice(id, pathId, okCode('yardım'), [okCode('arama'), noCode('xqmal'), `L2`], random, {
        raw: `Kaynak “${source}”. Kaynakla AYNI harf çokluğuna sahip ZORUNLU kod (anagram çekirdek)?`,
        explanation: 'yardım kaynağın harf alt kümesini birebir kullanır.'
      });
    },
    spot(id, pathId, random) {
      const bad = invalidWordFor(source, random);
      return roundChoice(id, pathId, noCode(bad), [okCode('yardımlaş'), okCode('arama'), okCode('yaşam')], random, {
        raw: `Kaynak “${source}”. Anagram avında hangi aday harf çokluğunu bozar?`,
        explanation: `“${bad}” fazla/eksik harf taşır; anagram değildir.`
      });
    },
    compare(id, pathId, random) {
      return roundChoice(id, pathId, okCode('arama'), [okCode('ara'), okCode('mal'), noCode('zdam')], random, {
        raw: `Kaynak “${source}”. a–r–a harf çekirdeğini en iyi genişleten geçerli kod?`,
        explanation: 'arama ara çekirdeğini iki a ve r ile genişletir.'
      });
    }
  });
}

// ---- 12. wm-dual-source-compare — iki kaynak karşılaştırması ----
function familyDualSourceCompare() {
  const sourceA = 'arkadaşlık';
  const sourceB = 'bilgisayar';
  const allowedA = ['ara', 'arka', 'arkadaş', 'aşık', 'aşk', 'adaş', 'kar', 'kara', 'kaş', 'kış', 'şaka'];
  const allowedB = ['bilgi', 'bil', 'silgi', 'sil', 'sal', 'yar', 'yara', 'al', 'ara', 'bar', 'bal', 'bir', 'gri', 'say'];
  const countA = buildableOnly(sourceA, allowedA).length;
  const countB = buildableOnly(sourceB, allowedB).length;
  const betterSource = countA >= countB ? 'S1' : 'S2';
  const betterLabel = countA >= countB ? sourceA : sourceB;
  return buildFamily('wm-dual-source-compare', {
    select(id, pathId, random) {
      const useA = random() < 0.5;
      const src = useA ? sourceA : sourceB;
      const list = useA ? allowedA : allowedB;
      return roundWordMine(id, pathId, src, list, random, {
        raw: `Kaynak: “${src}”. İki kaynaklı madende önce tek kaynaktan derin kazı yap.`,
        strategy: 'Diğer kaynakla karşılaştırmak için önce bu envanterdeki en uzun kelimeleri bul.',
        explanation: `Bu tur ${src} kaynağından; ${betterLabel} karşılaştırmada daha zengin havuza sahiptir.`
      });
    },
    forced(id, pathId, random) {
      const bestWord = longestBuildable(betterLabel, betterSource === 'S1' ? allowedA : allowedB);
      return roundChoice(id, pathId, okCode(bestWord), [noCode(invalidWordFor(betterLabel, random)), okCode(pick(betterSource === 'S1' ? allowedA : allowedB, random)), betterSource === 'S1' ? 'S2' : 'S1'], random, {
        raw: `Kaynak “${betterLabel}” (${betterSource}). S1=“${sourceA}”, S2=“${sourceB}”. Daha zengin kaynaktan ZORUNLU kurulabilir kod?`,
        explanation: `${betterLabel} daha zengin; “${bestWord}” oradan kurulur (${countA} vs ${countB} aday).`
      });
    },
    spot(id, pathId, random) {
      const src = pick([sourceA, sourceB], random);
      const list = src === sourceA ? allowedA : allowedB;
      const bad = invalidWordFor(src, random);
      return roundChoice(id, pathId, noCode(bad), [okCode(pick(list, random)), okCode(pick(list, random)), src === sourceA ? 'S1' : 'S2'], random, {
        raw: `Kaynak “${src}”. Hangi aday bu kaynak envanterini bozar?`,
        explanation: `“${bad}” ${src} envanterinde geçersiz.`
      });
    },
    compare(id, pathId, random) {
      const pairGood = `${betterSource}+${okCode(pick(betterSource === 'S1' ? allowedA : allowedB, random))}`;
      const pairBad = `${betterSource === 'S1' ? 'S2' : 'S1'}+NO:xyz`;
      return roundChoice(id, pathId, pairGood, [pairBad, 'S0+OK:al', 'S3+NO:abc'], random, {
        raw: `S1=“${sourceA}”, S2=“${sourceB}”. Daha zengin kaynak + geçerli kelime çifti hangisi?`,
        explanation: `${pairGood}: ${betterLabel} daha verimli kaynak ve geçerli kelime birleşimi.`
      });
    }
  });
}

export const WORD_MINE_FAMILIES = [
  familyVowelRich(),
  familyConsonantCluster(),
  familyRepeatedLetter(),
  familyShortDense(),
  familyLongSparse(),
  familyMorphSuffix(),
  familyLoanwordPattern(),
  familySemanticField(),
  familyMinLengthGate(),
  familyExactInventory(),
  familyAnagramCore(),
  familyDualSourceCompare()
];

export { parseChoiceWord, buildableOnly, okCode, noCode };
