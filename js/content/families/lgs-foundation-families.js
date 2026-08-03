// Aşama 04 — lgs-foundation (LGS soru kalıbı).
// UI: tüm iskeletler kind:'choice'.
// Aile = LGS düşünme kalıbı (oran, örüntü, değişken kontrolü, metin yargısı,
// neden-sonuç, pragmatik, tablo, şekil, fen iddia, grafik, seçenek tuzağı, misread).
// Yüzey sayı/isim değişimi ≠ yeni aile. Cevaplar kısa (answer_leak kapısı).

import { attachLgsRecoveryBlueprints, LGS_RECOVERY_BLUEPRINT_COUNT } from '../blueprints/lgs-foundation-recovery-v2.js';
import { buildLgsNewFamiliesV2, LGS_NEW_FAMILY_COUNT } from '../blueprints/lgs-foundation-new-families-v2.js';

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
  return `lgs-foundation:${skeletonId}:${pathId}:${simpleHash(raw)}`;
}

const PATH_IDS = [
  'raw-letters',
  'context-embedded',
  'staged-strategy-hint'
];

const TASK_TRAITS = {
  select: ['strategySelection', 'multiStepInference'],
  forced: ['informationLinking', 'conditionEvaluation'],
  spot: ['errorAnalysis', 'conditionEvaluation'],
  compare: ['strategySelection', 'usingIntermediateResultInNewDecision']
};

export const LGS_MISREAD = {
  RATIO: 'oran-birim-hata',
  VAR: 'degisken-karisik',
  TEXT: 'metin-asim',
  GRAPH: 'grafik-yanlis-okuma'
};

function pathWrap(pathId, rawPrompt, contextHint, strategyHint) {
  if (pathId === 'raw-letters') {
    return {
      prompt: rawPrompt,
      context: contextHint || 'LGS kalıbını ayır; yüzey sayı/isim tuzağına düşme.'
    };
  }
  if (pathId === 'context-embedded') {
    return {
      prompt: `Deneme kitapçığındaki bir kalıp: ${rawPrompt}`,
      context: 'Süs bağlamı ayıkla; yalnız kalıp düşüncesine odaklan.'
    };
  }
  if (pathId === 'counterexample-first') {
    return {
      prompt: `Önce yanlış seçeneği ele, sonra doğruyu seç: ${rawPrompt}`,
      context: 'Karşı-örnek / eleme yolu; cevabı spoiler yapmaz.'
    };
  }
  if (pathId === 'constraint-ordering') {
    return {
      prompt: `Koşulları sırayla uygula: ${rawPrompt}`,
      context: 'Kısıt sıralama yolu; ara karar zorunludur.'
    };
  }
  return {
    prompt: `${strategyHint || 'Önce kalıp türünü belirle, sonra seçenekleri eleye.'} ${rawPrompt}`,
    context: 'Strateji ipucu cevabı vermez; yalnız düşünme sırasını gösterir.'
  };
}

const STEM_FRAMES = [
  'Doğru sonuç hangisidir?',
  'Bu kalıpta hangi seçenek geçerlidir?',
  'Hangi yanıt zorunlu adıma uyar?',
  'Eleme sonrası kalan doğru nedir?',
  'Ara karar doğruysa sonuç hangisidir?',
  'Yanılgı tuzağına düşmeden seç:',
  'Kanıtla uyumlu seçenek hangisi?',
  'İkinci adım tamamlanınca ne bulunur?',
  'Koşulları sağlayan tek seçenek?',
  'Hangi seçenek düşünme yolunu bozar?',
  'Doğru stratejinin çıktısı nedir?',
  'Karşı örnekle elenenler dışında kalan?',
  'Birim/ölçek korunursa sonuç?',
  'Metin/veri ile çelişmeyen hangisi?',
  'Çok adımlı çözümün sonu hangisi?',
  'Hangi seçenek kısmi doğruyu tam sanır?',
  'Kontrol ettikten sonra kalan doğru?',
  'Zorunlu ara sonucu kullanan cevap?',
  'Yüzey tuzağı olmayan seçenek?',
  'Hedef soruya en uygun yanıt?'
];

function roundChoice(skeletonId, pathId, answerText, distractors, random, texts) {
  const pool = [answerText, ...distractors];
  const unique = [...new Set(pool.map(String))];
  while (unique.length < 4) unique.push(`X${unique.length}`);
  const options = shuffle(unique.slice(0, 4), random);
  const answerIndex = options.indexOf(String(answerText));
  const frame = pick(STEM_FRAMES, random);
  const framedRaw = `${texts.raw} ${frame}`;
  const { prompt, context } = pathWrap(pathId, framedRaw, texts.context, texts.strategy);
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

// ---- 1. lgs-ratio-proportion ----
const RATIO = [
  { a: 2, b: 3, k: 4, label: 'kırmızı:mavi' },
  { a: 3, b: 5, k: 2, label: 'kız:erkek' },
  { a: 4, b: 1, k: 3, label: 'kalem:silgi' },
  { a: 5, b: 2, k: 3, label: 'kitap:defter' }
];

function familyRatio() {
  return buildFamily('lgs-ratio-proportion', {
    select(id, pathId, random) {
      const item = pick(RATIO, random);
      const red = item.a * item.k;
      const blue = item.b * item.k;
      return roundChoice(id, pathId, String(blue), [String(red), String(item.a + item.b), String(item.k)], random, {
        raw: `${item.label} ${item.a}:${item.b}, birinci ${red}. İkinci kaç?`,
        strategy: 'Önce birim değeri bul, sonra ikinci payı çarp.',
        explanation: `Birim=${item.k}; ikinci=${blue}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(RATIO, random);
      return roundChoice(id, pathId, 'ORAN-BIRIM', ['TOPLAM', 'FARK', 'CARPIM'], random, {
        raw: `${item.label} ${item.a}:${item.b} için zorunlu adım hangisidir?`,
        explanation: 'Oran birimi zorunludur.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(RATIO, random);
      return roundChoice(id, pathId, 'paylari-topla', ['birim-bul', 'pay-carp', 'oran-koru'], random, {
        raw: `${item.a}:${item.b} oranında hangisi hatalı adımdır?`,
        explanation: 'Payları toplamak oran birimini vermez.'
      });
    },
    compare(id, pathId, random) {
      const item = pick(RATIO, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: birim×pay. B: payları topla. ${item.a}:${item.b} için hangisi?`,
        explanation: 'A doğru oran yoludur.'
      });
    }
  });
}

// ---- 2. lgs-pattern-rule ----
const PAT = [
  { start: 3, diff: 4, n: 4 },
  { start: 5, diff: 3, n: 5 },
  { start: 2, diff: 6, n: 4 },
  { start: 7, diff: 2, n: 5 }
];

function familyPattern() {
  return buildFamily('lgs-pattern-rule', {
    select(id, pathId, random) {
      const item = pick(PAT, random);
      const seq = Array.from({ length: item.n }, (_, i) => item.start + i * item.diff);
      const next = seq.at(-1) + item.diff;
      return roundChoice(id, pathId, String(next), [String(seq.at(-1) + 1), String(item.diff), String(seq.at(-1) * 2)], random, {
        raw: `${seq.join(' • ')} • ? Sonraki nedir?`,
        strategy: 'Sabit farkı bul, son terime ekle.',
        explanation: `Fark=${item.diff}; sonraki=${next}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(PAT, random);
      return roundChoice(id, pathId, 'SABIT-FARK', ['CARPAN', 'TOPLAM', 'RENK'], random, {
        raw: `Artış ${item.diff} olan dizi için zorunlu kural hangisidir?`,
        explanation: 'Sabit fark zorunludur.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(PAT, random);
      return roundChoice(id, pathId, 'rastgele-atlama', ['fark-ekle', 'kural-koru', 'terim-sirala'], random, {
        raw: `Fark ${item.diff} dizisinde hangisi ihlaldir?`,
        explanation: 'Rastgele atlama kuralı bozar.'
      });
    },
    compare(id, pathId, random) {
      const item = pick(PAT, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: +${item.diff}. B: ×${item.diff}. Hangisi sabit artış?`,
        explanation: 'A sabit farktır.'
      });
    }
  });
}

// ---- 3. lgs-variable-control ----
const VARC = [
  { changed: 'sicaklik', fixed: ['su', 'isik'], answer: 'bagimsiz' },
  { changed: 'isik', fixed: ['su', 'sicaklik'], answer: 'bagimsiz' },
  { changed: 'su', fixed: ['isik', 'sicaklik'], answer: 'bagimsiz' },
  { changed: 'gubre', fixed: ['su', 'isik'], answer: 'bagimsiz' }
];

function familyVariable() {
  return buildFamily('lgs-variable-control', {
    select(id, pathId, random) {
      const item = pick(VARC, random);
      return roundChoice(id, pathId, item.changed, [...item.fixed, 'renk'], random, {
        raw: `Yalnız ${item.changed} değiştirildi, ${item.fixed.join('/')} sabit. Bağımsız değişken?`,
        strategy: 'Araştırmacının değiştirdiğini seç.',
        explanation: `${item.changed} bağımsız değişkendir.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(VARC, random);
      return roundChoice(id, pathId, 'BAGIMSIZ', ['SABIT-HEPSI', 'SONUC', 'RENK'], random, {
        raw: `${item.changed} değişen deneyde zorunlu etiket hangisidir?`,
        explanation: 'Bağımsız değişken etiketi zorunludur.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(VARC, random);
      return roundChoice(id, pathId, 'iki-degisken', ['tek-degisken', 'kontrol-grup', 'olcum'], random, {
        raw: `${item.changed} deneyinde hangisi kontrol ihlalidir?`,
        explanation: 'İki değişken birden değiştirilmez.'
      });
    },
    compare(id, pathId, random) {
      const item = pick(VARC, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: yalnız ${item.changed}. B: ${item.changed}+${item.fixed[0]}. Hangisi adil?`,
        explanation: 'A tek değişken kontrolüdür.'
      });
    }
  });
}

// ---- 4. lgs-text-inference ----
const TEXT = [
  { claim: 'veriyle plan iyileşti', answer: 'yargi-guclu', wrong: 'asiri-genel' },
  { claim: 'herkes her zaman kazanır', answer: 'asiri-genel', wrong: 'yargi-guclu' },
  { claim: 'yöntem sonucu yükseltti', answer: 'yargi-guclu', wrong: 'ters-yargi' },
  { claim: 'metinde yokken iddia', answer: 'asiri-genel', wrong: 'yargi-guclu' }
];

function familyText() {
  return buildFamily('lgs-text-inference', {
    select(id, pathId, random) {
      const item = pick(TEXT, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'renk', 'şaka'], random, {
        raw: `Parça: “${item.claim}”. En uygun etiket?`,
        strategy: 'Metnin desteklediği yargıyı seç.',
        explanation: `${item.claim} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(TEXT, random);
      return roundChoice(id, pathId, 'METIN-DESTEK', ['DUYGU', 'RENK', 'SARKI'], random, {
        raw: `“${item.claim}” için zorunlu ölçüt hangisidir?`,
        explanation: 'Metin desteği zorunludur.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(TEXT, random);
      return roundChoice(id, pathId, item.wrong, [item.answer, 'destek', 'kanit'], random, {
        raw: `“${item.claim}” için hangisi çıkarım ihlalidir?`,
        explanation: `${item.wrong} metni aşar veya ters okur.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(TEXT, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.answer}. B: ${item.wrong}. Hangisi geçerli?`,
        explanation: 'A metin destekli yargıdır.'
      });
    }
  });
}

// ---- 5. lgs-cause-effect ----
const CE = [
  { cause: 'yeni yol', effect: 'ticaret-artis', wrong: 'iklim' },
  { cause: 'fabrika', effect: 'nufus-artis', wrong: 'renk' },
  { cause: 'okul', effect: 'okuryazarlik', wrong: 'hava' },
  { cause: 'sulama', effect: 'urun-artis', wrong: 'sarki' }
];

function familyCauseEffect() {
  return buildFamily('lgs-cause-effect', {
    select(id, pathId, random) {
      const item = pick(CE, random);
      return roundChoice(id, pathId, item.effect, [item.wrong, 'rastgele', 'ters'], random, {
        raw: `${item.cause} sonrası en olası sonuç?`,
        strategy: 'Neden-sonuç zincirini kur.',
        explanation: `${item.cause} → ${item.effect}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(CE, random);
      return roundChoice(id, pathId, 'NEDEN-SONUC', ['TESADUF', 'RENK', 'SARKI'], random, {
        raw: `${item.cause}→${item.effect} için zorunlu bağ hangisidir?`,
        explanation: 'Neden-sonuç bağı zorunludur.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(CE, random);
      return roundChoice(id, pathId, item.wrong, [item.effect, 'neden', 'sonuc'], random, {
        raw: `${item.cause} için hangisi sahte nedendir?`,
        explanation: `${item.wrong} desteklenmez.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(CE, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.effect}. B: ${item.wrong}. Hangisi sonuç?`,
        explanation: 'A neden-sonuçla uyumludur.'
      });
    }
  });
}

// ---- 6. lgs-english-pragmatic ----
const ENG = [
  { cue: 'doctor appointment', answer: 'nazik-ret', wrong: 'kabul' },
  { cue: 'love to come', answer: 'kabul', wrong: 'nazik-ret' },
  { cue: 'sorry busy', answer: 'nazik-ret', wrong: 'kabul' },
  { cue: 'sure thanks', answer: 'kabul', wrong: 'nazik-ret' }
];

function familyEnglish() {
  return buildFamily('lgs-english-pragmatic', {
    select(id, pathId, random) {
      const item = pick(ENG, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'renk', 'sarki'], random, {
        raw: `Mina: “… ${item.cue}.” Davet cevabı hangisi?`,
        strategy: 'Mazeret mi kabul mü ayır.',
        explanation: `${item.cue} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(ENG, random);
      return roundChoice(id, pathId, 'PRAGMATIK', ['KELIME-CEVIR', 'RENK', 'SARKI'], random, {
        raw: `“${item.cue}” için zorunlu işlem hangisidir?`,
        explanation: 'Pragmatik niyet zorunludur.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(ENG, random);
      return roundChoice(id, pathId, item.wrong, [item.answer, 'niyet', 'baglam'], random, {
        raw: `“${item.cue}” için hangisi pragmatik ihlaldir?`,
        explanation: `${item.wrong} niyeti kaçırır.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(ENG, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.answer}. B: ${item.wrong}. Hangisi?`,
        explanation: 'A pragmatik olarak doğrudur.'
      });
    }
  });
}

// ---- 7. lgs-data-table ----
const TAB = [
  { rows: 'A:12 B:8', ask: 'en-cok', answer: 'A', wrong: 'B' },
  { rows: 'X:5 Y:9', ask: 'en-cok', answer: 'Y', wrong: 'X' },
  { rows: 'P:7 Q:7', ask: 'esit', answer: 'esit', wrong: 'P' },
  { rows: 'M:3 N:6', ask: 'fark', answer: '3', wrong: '9' }
];

function familyTable() {
  return buildFamily('lgs-data-table', {
    select(id, pathId, random) {
      const item = pick(TAB, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, '0', 'renk'], random, {
        raw: `Tablo ${item.rows}. Soru: ${item.ask}. Cevap?`,
        strategy: 'Hücreleri karşılaştır, isteneni seç.',
        explanation: `${item.ask} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(TAB, random);
      return roundChoice(id, pathId, 'TABLO-OKU', ['TAHMIN', 'RENK', 'SARKI'], random, {
        raw: `${item.rows} için zorunlu adım hangisidir?`,
        explanation: 'Tablo okuma zorunludur.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(TAB, random);
      return roundChoice(id, pathId, 'satir-atla', ['karsilastir', 'fark-al', 'en-buyuk'], random, {
        raw: `${item.rows} okurken hangisi ihlaldir?`,
        explanation: 'Satır atlamak veri hatasıdır.'
      });
    },
    compare(id, pathId, random) {
      const item = pick(TAB, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.answer}. B: ${item.wrong}. Hangisi tabloya uyar?`,
        explanation: 'A tablo verisine uyar.'
      });
    }
  });
}

// ---- 8. lgs-geometry-figure ----
const GEO = [
  { fig: 'kare kenar 4', ask: 'cevre', answer: '16', wrong: '8' },
  { fig: 'dikdortgen 3x5', ask: 'alan', answer: '15', wrong: '16' },
  { fig: 'ucgen taban 6 yuk 4', ask: 'alan', answer: '12', wrong: '24' },
  { fig: 'kare kenar 5', ask: 'alan', answer: '25', wrong: '20' }
];

function familyGeometry() {
  return buildFamily('lgs-geometry-figure', {
    select(id, pathId, random) {
      const item = pick(GEO, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, '0', '1'], random, {
        raw: `${item.fig}. ${item.ask}?`,
        strategy: 'Doğru formülü seç, hesapla.',
        explanation: `${item.ask}=${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(GEO, random);
      return roundChoice(id, pathId, 'FORMUL', ['RENK', 'SARKI', 'TAHMIN'], random, {
        raw: `${item.fig} için zorunlu adım hangisidir?`,
        explanation: 'Formül seçimi zorunludur.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(GEO, random);
      return roundChoice(id, pathId, 'alan-cevre-karisik', ['dogru-formul', 'birim-kontrol', 'carpma'], random, {
        raw: `${item.fig} hesabında hangisi ihlaldir?`,
        explanation: 'Alan/çevre karıştırmak yaygındır.'
      });
    },
    compare(id, pathId, random) {
      const item = pick(GEO, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.answer}. B: ${item.wrong}. Hangisi doğru?`,
        explanation: 'A doğru ölçü sonucudur.'
      });
    }
  });
}

// ---- 9. lgs-science-claim ----
const SCI = [
  { claim: 'isi arttı tepkime kısaldı', answer: 'hizlandi', wrong: 'yavasladi' },
  { claim: 'isik yok bitki soldu', answer: 'isik-gerekli', wrong: 'su-yetmez' },
  { claim: 'metal buza ısı verdi', answer: 'iletken', wrong: 'yalitkan' },
  { claim: 'hali sürtünme arttı', answer: 'surutunme', wrong: 'kutle' }
];

function familyScienceClaim() {
  return buildFamily('lgs-science-claim', {
    select(id, pathId, random) {
      const item = pick(SCI, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'renk', 'sarki'], random, {
        raw: `Gözlem: “${item.claim}”. En güçlü iddia?`,
        strategy: 'Kanıtı iddiaya bağla.',
        explanation: `${item.claim} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(SCI, random);
      return roundChoice(id, pathId, 'KANIT-IDDIA', ['TAHMIN', 'RENK', 'SARKI'], random, {
        raw: `“${item.claim}” için zorunlu bağ hangisidir?`,
        explanation: 'Kanıt-iddia bağı zorunludur.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(SCI, random);
      return roundChoice(id, pathId, item.wrong, [item.answer, 'kanit', 'gozlem'], random, {
        raw: `“${item.claim}” için hangisi zayıf iddiadır?`,
        explanation: `${item.wrong} kanıtı kaçırır.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(SCI, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.answer}. B: ${item.wrong}. Hangisi?`,
        explanation: 'A kanıtla uyumludur.'
      });
    }
  });
}

// ---- 10. lgs-graph-read ----
const GR = [
  { desc: 'çubuk A>B>C', ask: 'en-yuksek', answer: 'A', wrong: 'C' },
  { desc: 'çizgi yükseliyor', ask: 'egilim', answer: 'artis', wrong: 'azalis' },
  { desc: 'çubuk B=C', ask: 'esit', answer: 'B=C', wrong: 'A=B' },
  { desc: 'çizgi düşüyor', ask: 'egilim', answer: 'azalis', wrong: 'artis' }
];

function familyGraph() {
  return buildFamily('lgs-graph-read', {
    select(id, pathId, random) {
      const item = pick(GR, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'renk', '0'], random, {
        raw: `Grafik: ${item.desc}. ${item.ask}?`,
        strategy: 'Eksen ve yüksekliği oku.',
        explanation: `${item.ask} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(GR, random);
      return roundChoice(id, pathId, 'EKSEEN-OKU', ['TAHMIN', 'RENK', 'SARKI'], random, {
        raw: `${item.desc} için zorunlu adım hangisidir?`,
        explanation: 'Eksen okuma zorunludur.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(GR, random);
      return roundChoice(id, pathId, 'ekseni-atla', ['yukseklik-oku', 'egilim-bak', 'karsilastir'], random, {
        raw: `${item.desc} okurken hangisi ihlaldir?`,
        explanation: 'Eksen atlamak grafik hatasıdır.'
      });
    },
    compare(id, pathId, random) {
      const item = pick(GR, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.answer}. B: ${item.wrong}. Hangisi grafiğe uyar?`,
        explanation: 'A grafik okumasına uyar.'
      });
    }
  });
}

// ---- 11. lgs-option-trap ----
const TRAP = [
  { trap: 'her zaman', answer: 'asiri-genel', wrong: 'dikkatli' },
  { trap: 'yalnızca sayıya bak', answer: 'eksik-okuma', wrong: 'tam-okuma' },
  { trap: 'ters neden', answer: 'ters-neden', wrong: 'dogru-neden' },
  { trap: 'birim unut', answer: 'birim-hata', wrong: 'birim-dogru' }
];

function familyOptionTrap() {
  return buildFamily('lgs-option-trap', {
    select(id, pathId, random) {
      const item = pick(TRAP, random);
      return roundChoice(id, pathId, item.answer, [item.wrong, 'renk', 'sarki'], random, {
        raw: `Seçenek tuzağı: “${item.trap}”. Tuzak türü?`,
        strategy: 'Aşırı genelleme / eksik okuma / ters neden ayır.',
        explanation: `${item.trap} → ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(TRAP, random);
      return roundChoice(id, pathId, 'TUZAK-AYIR', ['RENK', 'SARKI', 'TAHMIN'], random, {
        raw: `“${item.trap}” için zorunlu işlem hangisidir?`,
        explanation: 'Tuzak ayırma zorunludur.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(TRAP, random);
      return roundChoice(id, pathId, item.trap, ['dikkatli-okuma', 'kanit-kontrol', 'birim-kontrol'], random, {
        raw: `Hangisi seçenek tuzağıdır?`,
        explanation: `${item.trap} tipik tuzaktır.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(TRAP, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.answer}. B: ${item.wrong}. Hangisi tuzak etiketi?`,
        explanation: 'A tuzak türünü adlandırır.'
      });
    }
  });
}

// ---- 12. lgs-misread-taxonomy ----
const MIS = [
  { text: 'Payları toplayıp oran sandı.', error: LGS_MISREAD.RATIO },
  { text: 'İki değişkeni birden değiştirdi.', error: LGS_MISREAD.VAR },
  { text: 'Metinde olmayanı iddia etti.', error: LGS_MISREAD.TEXT },
  { text: 'Grafikte ekseni okumadı.', error: LGS_MISREAD.GRAPH }
];

function familyMisread() {
  return buildFamily('lgs-misread-taxonomy', {
    select(id, pathId, random) {
      const item = pick(MIS, random);
      const distractors = Object.values(LGS_MISREAD).filter((e) => e !== item.error);
      return roundChoice(id, pathId, item.error, distractors.slice(0, 3), random, {
        raw: `${item.text} Yanlış okuma türü?`,
        strategy: 'Hata türünü sınıflandır.',
        explanation: `${item.text} → ${item.error}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(MIS, random);
      return roundChoice(id, pathId, item.error, Object.values(LGS_MISREAD).filter((e) => e !== item.error).slice(0, 3), random, {
        raw: `${item.text} Zorunlu etiket?`,
        explanation: `Zorunlu etiket: ${item.error}.`
      });
    },
    spot(id, pathId, random) {
      const item = pick(MIS, random);
      return roundChoice(id, pathId, item.error, shuffle(Object.values(LGS_MISREAD).filter((e) => e !== item.error), random).slice(0, 3), random, {
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
        `${LGS_MISREAD.RATIO}|${LGS_MISREAD.RATIO}`,
        `${LGS_MISREAD.TEXT}|${LGS_MISREAD.TEXT}`,
        `${b.error}|${a.error}`
      ].filter((x) => x !== answer);
      return roundChoice(id, pathId, answer, distractors.slice(0, 3), random, {
        raw: `A: ${a.text} · B: ${b.text}. Etiket çifti (A|B)?`,
        explanation: `A→${a.error}, B→${b.error}`
      });
    }
  });
}

const LGS_FOUNDATION_FAMILIES_BASE = [
  familyRatio(),
  familyPattern(),
  familyVariable(),
  familyText(),
  familyCauseEffect(),
  familyEnglish(),
  familyTable(),
  familyGeometry(),
  familyScienceClaim(),
  familyGraph(),
  familyOptionTrap(),
  familyMisread()
];

// Aşama 04 sözleşmesi tam olarak 12 aile × 4 iskelet × en az 3 yol kullanır.
// Geniş kapasite paketi ayrı dışa aktarılır; çekirdek katalog sessizce şişirilmez.
export const LGS_FOUNDATION_FAMILIES = LGS_FOUNDATION_FAMILIES_BASE;
export const LGS_FOUNDATION_CAPACITY_FAMILIES = [
  ...attachLgsRecoveryBlueprints(LGS_FOUNDATION_FAMILIES_BASE),
  ...buildLgsNewFamiliesV2()
];
export { LGS_RECOVERY_BLUEPRINT_COUNT, LGS_NEW_FAMILY_COUNT };
