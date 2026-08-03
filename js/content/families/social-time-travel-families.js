// Aşama 04 — social-time-travel (Zaman Yolculuğu).
// UI: tüm iskeletler kind:'choice'.
// Aile = sosyal/tarih düşüncesi (birincil/ikincil kaynak, kronoloji, neden-sonuç,
// süreklilik/değişim, bakış açısı, kanıt-sav, kültürel miras, sözlü tarih,
// yer-zaman, çağdışılık, yanlış okuma taksonomisi).
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
  return `social-time-travel:${skeletonId}:${pathId}:${simpleHash(raw)}`;
}

const PATH_IDS = ['raw-letters', 'context-embedded', 'staged-strategy-hint'];

const TASK_TRAITS = {
  select: ['strategySelection', 'multiStepInference'],
  forced: ['informationLinking', 'conditionEvaluation'],
  spot: ['errorAnalysis', 'conditionEvaluation'],
  compare: ['strategySelection', 'usingIntermediateResultInNewDecision']
};

export const STT_MISREAD = {
  SOURCE: 'kaynak-karistirma',
  TIME: 'zaman-sirasi',
  CAUSE: 'neden-sonuc',
  ANACH: 'cagdasi-hata'
};

function pathWrap(pathId, rawPrompt, contextHint, strategyHint) {
  if (pathId === 'raw-letters') {
    return {
      prompt: rawPrompt,
      context: contextHint || 'Tarih düşünme türünü ayır; yüzey isim/yer tuzağına düşme.'
    };
  }
  if (pathId === 'context-embedded') {
    return {
      prompt: `Tarih atölyesinde tartışılan bir örnek: ${rawPrompt}`,
      context: 'Senaryo süsünü ayıkla; yalnız kaynak/zaman/kanıt ilişkisine odaklan.'
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

// ---- 1. stt-primary-source ----
const PRIMARY = [
  { item: 'savaş günlüğü', who: 'askerin kendi yazısı', label: 'birincil' },
  { item: 'çarşı faturası', who: 'dönemin belgesi', label: 'birincil' },
  { item: 'tapu kaydı', who: 'resmi arşiv', label: 'birincil' },
  { item: 'duvar resmi', who: 'çağdaş iz', label: 'birincil' }
];

function familyPrimarySource() {
  return buildFamily('stt-primary-source', {
    select(id, pathId, random) {
      const item = pick(PRIMARY, random);
      return roundChoice(id, pathId, 'birincil', ['ikincil', 'efsane', 'yorum'], random, {
        raw: `“${item.item}” (${item.who}) hangi kaynak türüdür?`,
        strategy: 'Olayın tanığı mı, sonradan yazılan mı bak.',
        explanation: 'Döneme ait doğrudan iz → birincil.'
      });
    },
    forced(id, pathId, random) {
      const item = pick(PRIMARY, random);
      return roundChoice(id, pathId, 'dogudan', ['yorum', 'ozet', 'efsane'], random, {
        raw: `“${item.item}” için zorunlu özellik hangisidir?`,
        explanation: 'Birincil kaynak olaydan doğrudan gelir.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(PRIMARY, random);
      return roundChoice(id, pathId, 'ders kitabı', [item.item, 'arşiv belgesi', 'günlük'], random, {
        raw: `Hangisi birincil kaynak DEĞİLDİR?`,
        explanation: 'Ders kitabı sonradan yazılmış ikincildir.'
      });
    },
    compare(id, pathId, random) {
      const item = pick(PRIMARY, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.item}. B: tarih kitabı özeti. Birincil hangisi?`,
        explanation: 'A doğrudan dönem izidir.'
      });
    }
  });
}

// ---- 2. stt-secondary-source ----
const SECONDARY = [
  { item: 'tarih kitabı', why: 'sonradan derlenmiş' },
  { item: 'belgesel yorumu', why: 'araştırmacı anlatımı' },
  { item: 'ansiklopedi', why: 'özet bilgi' },
  { item: 'makale', why: 'ikinci el analiz' }
];

function familySecondarySource() {
  return buildFamily('stt-secondary-source', {
    select(id, pathId, random) {
      const item = pick(SECONDARY, random);
      return roundChoice(id, pathId, 'ikincil', ['birincil', 'kalıntı', 'tanık'], random, {
        raw: `“${item.item}” (${item.why}) hangi kaynak türüdür?`,
        strategy: 'Yazar olayı yaşadı mı, yoksa aktardı mı?',
        explanation: 'Sonradan yazılan analiz → ikincil.'
      });
    },
    forced(id, pathId, random) {
      const item = pick(SECONDARY, random);
      return roundChoice(id, pathId, 'yorum', ['taniklik', 'kalinti', 'resmi-evrak'], random, {
        raw: `“${item.item}” için zorunlu özellik hangisidir?`,
        explanation: 'İkincil kaynak yorum/derleme taşır.'
      });
    },
    spot(id, pathId, random) {
      return roundChoice(id, pathId, 'eski mektup', ['tarih kitabı', 'belgesel', 'ansiklopedi'], random, {
        raw: `Hangisi ikincil kaynak DEĞİLDİR?`,
        explanation: 'Eski mektup birincildir.'
      });
    },
    compare(id, pathId, random) {
      const item = pick(SECONDARY, random);
      return roundChoice(id, pathId, 'B', ['A', 'ikisi', 'hic'], random, {
        raw: `A: savaş günlüğü. B: ${item.item}. İkincil hangisi?`,
        explanation: 'B sonradan yazılmıştır.'
      });
    }
  });
}

// ---- 3. stt-chronology ----
const CHRONO = [
  { events: ['kuruluş', 'fetih', 'reform'], ask: 'ortadaki', answer: 'fetih' },
  { events: ['göç', 'yerleşim', 'şehir'], ask: 'ilk', answer: 'göç' },
  { events: ['barış', 'ticaret', 'zenginlik'], ask: 'son', answer: 'zenginlik' },
  { events: ['keşif', 'koloni', 'bağımsızlık'], ask: 'ortadaki', answer: 'koloni' }
];

function familyChronology() {
  return buildFamily('stt-chronology', {
    select(id, pathId, random) {
      const item = pick(CHRONO, random);
      const distractors = item.events.filter((e) => e !== item.answer);
      while (distractors.length < 3) distractors.push('bilinmez');
      return roundChoice(id, pathId, item.answer, distractors.slice(0, 3), random, {
        raw: `Sıra: ${item.events.join(' → ')}. ${item.ask} olay hangisi?`,
        strategy: 'Zaman okunu soldan sağa oku.',
        explanation: `Kronoloji: ${item.answer}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(CHRONO, random);
      return roundChoice(id, pathId, 'sira', ['neden', 'miras', 'bakis'], random, {
        raw: `“${item.events.join(' → ')}” için zorunlu işlem hangisidir?`,
        explanation: 'Zaman sırası kurmak kronolojidir.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(CHRONO, random);
      const wrong = [...item.events].reverse().join(' → ');
      return roundChoice(id, pathId, wrong, [item.events.join(' → '), 'yalnız ilk', 'yalnız son'], random, {
        raw: `Hangisi kronoloji ihlalidir?`,
        explanation: 'Ters sıra zaman ihlalidir.'
      });
    },
    compare(id, pathId, random) {
      const item = pick(CHRONO, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.events.join('→')}. B: ters sıra. Doğru zaman hangisi?`,
        explanation: 'A doğru kronolojidir.'
      });
    }
  });
}

// ---- 4. stt-cause-effect-history ----
const CAUSE = [
  { cause: 'kuraklık', effect: 'göç', wrong: 'şarkı' },
  { cause: 'yeni yol', effect: 'ticaret', wrong: 'renk' },
  { cause: 'salgın', effect: 'nüfus düşüşü', wrong: 'bayram' },
  { cause: 'buluş', effect: 'üretim artışı', wrong: 'rüya' }
];

function familyCauseEffect() {
  return buildFamily('stt-cause-effect-history', {
    select(id, pathId, random) {
      const item = pick(CAUSE, random);
      return roundChoice(id, pathId, item.effect, [item.wrong, 'rastgele', 'tesadüf'], random, {
        raw: `“${item.cause}” tarihsel olarak en çok neyi doğurur?`,
        strategy: 'Neden → sonuç zincirini kur.',
        explanation: `${item.cause} → ${item.effect}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(CAUSE, random);
      return roundChoice(id, pathId, 'neden', ['sira', 'miras', 'harita'], random, {
        raw: `“${item.cause} → ${item.effect}” için zorunlu bağ hangisidir?`,
        explanation: 'Bu bir neden-sonuç bağdır.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(CAUSE, random);
      return roundChoice(id, pathId, item.wrong, [item.effect, item.cause, 'etki'], random, {
        raw: `“${item.cause}” için hangisi sonuç DEĞİLDİR?`,
        explanation: `${item.wrong} nedensel bağ taşımaz.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(CAUSE, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.cause}→${item.effect}. B: ${item.cause}→${item.wrong}. Hangisi geçerli?`,
        explanation: 'A tarihsel neden-sonuçtur.'
      });
    }
  });
}

// ---- 5. stt-continuity-change ----
const CONT = [
  { topic: 'tarım aleti', keep: 'toprak işi', change: 'makineleşme' },
  { topic: 'yazı', keep: 'bilgi saklama', change: 'dijital ortam' },
  { topic: 'ticaret', keep: 'mal değişimi', change: 'online pazar' },
  { topic: 'eğitim', keep: 'öğrenme', change: 'uzaktan ders' }
];

function familyContinuityChange() {
  return buildFamily('stt-continuity-change', {
    select(id, pathId, random) {
      const item = pick(CONT, random);
      return roundChoice(id, pathId, item.keep, [item.change, 'yok oldu', 'tesadüf'], random, {
        raw: `“${item.topic}”da süreklilik (aynı kalan) hangisidir?`,
        strategy: 'Ne aynı kaldı, ne değişti ayır.',
        explanation: `Süreklilik: ${item.keep}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(CONT, random);
      return roundChoice(id, pathId, 'degisim', ['kaynak', 'efsane', 'renk'], random, {
        raw: `“${item.topic}: ${item.change}” için zorunlu etiket hangisidir?`,
        explanation: 'Yeni biçim = değişim.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(CONT, random);
      return roundChoice(id, pathId, 'hepsi aynı', [item.change, item.keep, 'kısmi'], random, {
        raw: `“${item.topic}” için hangisi süreklilik/değişim ihlalidir?`,
        explanation: '“Hepsi aynı” değişimi yok sayar.'
      });
    },
    compare(id, pathId, random) {
      const item = pick(CONT, random);
      return roundChoice(id, pathId, 'B', ['A', 'ikisi', 'hic'], random, {
        raw: `A yalnız süreklilik. B: ${item.keep}+${item.change}. Hangisi tam okuma?`,
        explanation: 'B hem süreklilik hem değişimi görür.'
      });
    }
  });
}

// ---- 6. stt-perspective ----
const PERS = [
  { event: 'barış antlaşması', a: 'tüccar sevinci', b: 'asker kaygısı' },
  { event: 'yeni vergi', a: 'hazine ihtiyacı', b: 'köylü yükü' },
  { event: 'şehir genişlemesi', a: 'zanaatçı fırsat', b: 'çiftçi toprak kaybı' },
  { event: 'keşif seferi', a: 'denizci umudu', b: 'yerli endişe' }
];

function familyPerspective() {
  return buildFamily('stt-perspective', {
    select(id, pathId, random) {
      const item = pick(PERS, random);
      return roundChoice(id, pathId, 'bakis', ['tek-dogru', 'rastgele', 'efsane'], random, {
        raw: `“${item.event}”: A=${item.a}, B=${item.b}. Bu fark neyi gösterir?`,
        strategy: 'Kim konuşuyor sorusunu sor.',
        explanation: 'Farklı bakış açıları vardır.'
      });
    },
    forced(id, pathId, random) {
      const item = pick(PERS, random);
      return roundChoice(id, pathId, 'coklu', ['tek', 'yok', 'efsane'], random, {
        raw: `“${item.event}” için zorunlu okuma hangisidir?`,
        explanation: 'Olay çoklu bakış ister.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(PERS, random);
      return roundChoice(id, pathId, 'tek doğru var', [item.a, item.b, 'ikisi geçerli'], random, {
        raw: `Hangisi bakış açısı ihlalidir?`,
        explanation: 'Tek doğru iddiası bakışı siler.'
      });
    },
    compare(id, pathId, random) {
      const item = pick(PERS, random);
      return roundChoice(id, pathId, 'ikisi', ['yalnız-A', 'yalnız-B', 'hic'], random, {
        raw: `A: ${item.a}. B: ${item.b}. “${item.event}” için hangisi geçerli olabilir?`,
        explanation: 'Her iki bakış da mümkündür.'
      });
    }
  });
}

// ---- 7. stt-evidence-claim ----
const EVID = [
  { claim: 'şehir büyüdü', evidence: 'vergi kaydı', weak: 'söylenti' },
  { claim: 'ticaret arttı', evidence: 'gümrük defteri', weak: 'dedikodu' },
  { claim: 'kıtlık oldu', evidence: 'fiyat listesi', weak: 'şiir' },
  { claim: 'okul açıldı', evidence: 'vakıf belgesi', weak: 'rivayet' }
];

function familyEvidenceClaim() {
  return buildFamily('stt-evidence-claim', {
    select(id, pathId, random) {
      const item = pick(EVID, random);
      return roundChoice(id, pathId, item.evidence, [item.weak, 'hayal', 'şaka'], random, {
        raw: `“${item.claim}” savını en iyi hangi kanıt destekler?`,
        strategy: 'Kanıt savı doğrulanabilir mi bak.',
        explanation: `${item.evidence} somut kanıttır.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(EVID, random);
      return roundChoice(id, pathId, 'kanit', ['süs', 'renk', 'şarkı'], random, {
        raw: `“${item.claim}” için zorunlu dayanak hangisidir?`,
        explanation: 'Sav kanıt ister.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(EVID, random);
      return roundChoice(id, pathId, item.weak, [item.evidence, 'arşiv', 'belge'], random, {
        raw: `“${item.claim}” için hangisi zayıf dayanak (ihlal)?`,
        explanation: `${item.weak} güvenilir kanıt değildir.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(EVID, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.evidence}. B: ${item.weak}. Sav “${item.claim}” hangisiyle güçlenir?`,
        explanation: 'A somut kanıttır.'
      });
    }
  });
}

// ---- 8. stt-cultural-heritage ----
const HERITAGE = [
  { item: 'çarşı', type: 'somut' },
  { item: 'masal', type: 'soyut' },
  { item: 'cami', type: 'somut' },
  { item: 'halk dansı', type: 'soyut' }
];

function familyCulturalHeritage() {
  return buildFamily('stt-cultural-heritage', {
    select(id, pathId, random) {
      const item = pick(HERITAGE, random);
      return roundChoice(id, pathId, item.type, item.type === 'somut' ? ['soyut', 'yok', 'rastgele'] : ['somut', 'yok', 'rastgele'], random, {
        raw: `“${item.item}” miras türü hangisidir?`,
        strategy: 'Dokunulur mu, yaşanan gelenek mi ayır.',
        explanation: `${item.item} → ${item.type}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(HERITAGE, random);
      return roundChoice(id, pathId, 'miras', ['vergi', 'savaş', 'hava'], random, {
        raw: `“${item.item}” için zorunlu etiket hangisidir?`,
        explanation: 'Kültürel miras kategorisidir.'
      });
    },
    spot(id, pathId, random) {
      return roundChoice(id, pathId, 'bugünkü reklam', ['çarşı', 'masal', 'halk dansı'], random, {
        raw: `Hangisi kültürel miras örneği DEĞİLDİR?`,
        explanation: 'Reklam miras değildir.'
      });
    },
    compare(id, pathId, random) {
      const a = HERITAGE.find((h) => h.type === 'somut');
      const b = HERITAGE.find((h) => h.type === 'soyut');
      return roundChoice(id, pathId, 'farkli', ['ayni', 'ikisi-yok', 'rastgele'], random, {
        raw: `A: ${a.item}(${a.type}). B: ${b.item}(${b.type}). İlişki?`,
        explanation: 'Somut ≠ soyut miras.'
      });
    }
  });
}

// ---- 9. stt-oral-history ----
const ORAL = [
  { source: 'dede anlatısı', strength: 'yaşanmış iz', limit: 'unutkanlık' },
  { source: 'köy sohbeti', strength: 'yerel bellek', limit: 'abartı' },
  { source: 'tanık röportajı', strength: 'kişisel tanıklık', limit: 'tek bakış' },
  { source: 'türkü', strength: 'duygu izi', limit: 'abartı' }
];

function familyOralHistory() {
  return buildFamily('stt-oral-history', {
    select(id, pathId, random) {
      const item = pick(ORAL, random);
      return roundChoice(id, pathId, 'sozlu', ['kazı', 'harita', 'para'], random, {
        raw: `“${item.source}” hangi tarih kaynağına girer?`,
        strategy: 'Yazılı mı, anlatı mı ayır.',
        explanation: 'Anlatıya dayalı → sözlü tarih.'
      });
    },
    forced(id, pathId, random) {
      const item = pick(ORAL, random);
      return roundChoice(id, pathId, 'sinir', ['kusursuz', 'resmi', 'kazı'], random, {
        raw: `“${item.source}” (${item.limit}) için zorunlu uyarı hangisidir?`,
        explanation: 'Sözlü tarihin sınırı vardır.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(ORAL, random);
      return roundChoice(id, pathId, 'tam kesin', [item.strength, item.limit, 'dikkatli kullan'], random, {
        raw: `“${item.source}” için hangisi yanlış iddiadır?`,
        explanation: 'Sözlü tarih her zaman kesin değildir.'
      });
    },
    compare(id, pathId, random) {
      const item = pick(ORAL, random);
      return roundChoice(id, pathId, 'B', ['A', 'ikisi', 'hic'], random, {
        raw: `A: “kusursuz gerçek”. B: “${item.strength}, ama ${item.limit}”. Hangisi doğru?`,
        explanation: 'B dengeli sözlü tarih okumasıdır.'
      });
    }
  });
}

// ---- 10. stt-map-time-link ----
const MAPTIME = [
  { place: 'liman kenti', time: 'ticaret çağı', link: 'deniz yolu' },
  { place: 'bozkır', time: 'göç dönemi', link: 'otlak ihtiyacı' },
  { place: 'dağ geçidi', time: 'ordu yürüyüşü', link: 'kısa rota' },
  { place: 'nehir kenarı', time: 'yerleşim', link: 'su kaynağı' }
];

function familyMapTimeLink() {
  return buildFamily('stt-map-time-link', {
    select(id, pathId, random) {
      const item = pick(MAPTIME, random);
      return roundChoice(id, pathId, item.link, ['rastgele renk', 'şarkı', 'tesadüf'], random, {
        raw: `“${item.place}” + “${item.time}” bağını hangisi açıklar?`,
        strategy: 'Yer özelliği zaman olayını nasıl etkiler bak.',
        explanation: `${item.link} yer-zaman bağdır.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(MAPTIME, random);
      return roundChoice(id, pathId, 'yer-zaman', ['yalnız-isim', 'renk', 'şaka'], random, {
        raw: `“${item.place}/${item.time}” için zorunlu ilişki hangisidir?`,
        explanation: 'Harita ile zaman birlikte okunur.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(MAPTIME, random);
      return roundChoice(id, pathId, 'yer önemsiz', [item.link, item.place, item.time], random, {
        raw: `Hangisi yer-zaman ihlalidir?`,
        explanation: 'Yeri yok saymak bağı koparır.'
      });
    },
    compare(id, pathId, random) {
      const item = pick(MAPTIME, random);
      return roundChoice(id, pathId, 'A', ['B', 'ikisi', 'hic'], random, {
        raw: `A: ${item.place}→${item.link}. B: yer rastgele. Hangisi geçerli?`,
        explanation: 'A yer-zaman bağını kurar.'
      });
    }
  });
}

// ---- 11. stt-anachronism ----
const ANACH = [
  { scene: 'ortaçağ pazarı', wrong: 'akıllı telefon', ok: 'terazi' },
  { scene: 'antik liman', wrong: 'jet uçak', ok: 'yelkenli' },
  { scene: 'osmanlı medrese', wrong: 'dizüstü bilgisayar', ok: 'mürekkep' },
  { scene: 'göçer kampı', wrong: 'metro bileti', ok: 'keçe çadır' }
];

function familyAnachronism() {
  return buildFamily('stt-anachronism', {
    select(id, pathId, random) {
      const item = pick(ANACH, random);
      return roundChoice(id, pathId, item.wrong, [item.ok, 'döneme uygun', 'çağdaş iz'], random, {
        raw: `“${item.scene}”de hangisi çağdışıdır?`,
        strategy: 'Nesne o dönemde var mıydı diye sor.',
        explanation: `${item.wrong} çağ dışıdır.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(ANACH, random);
      return roundChoice(id, pathId, 'cagdasi', ['uygun', 'kanit', 'miras'], random, {
        raw: `“${item.scene}+${item.wrong}” için zorunlu etiket hangisidir?`,
        explanation: 'Zaman uyumsuzluğu = çağdışılık.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(ANACH, random);
      return roundChoice(id, pathId, item.wrong, [item.ok, 'dönem eşyası', 'çağdaş belge'], random, {
        raw: `Hangisi zaman ihlalidir?`,
        explanation: `${item.wrong} sahneye uymaz.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(ANACH, random);
      return roundChoice(id, pathId, 'B', ['A', 'ikisi', 'hic'], random, {
        raw: `A: ${item.ok}. B: ${item.wrong}. “${item.scene}”de hangisi hatalı?`,
        explanation: 'B çağdışıdır.'
      });
    }
  });
}

// ---- 12. stt-misread-taxonomy ----
const MISREAD = [
  { example: 'günlüğü ikincil saymak', type: STT_MISREAD.SOURCE },
  { example: 'olayları ters sıraya dizmek', type: STT_MISREAD.TIME },
  { example: 'sonucu neden sanmak', type: STT_MISREAD.CAUSE },
  { example: 'telefonu ortaçağa koymak', type: STT_MISREAD.ANACH }
];

function familyMisreadTaxonomy() {
  return buildFamily('stt-misread-taxonomy', {
    select(id, pathId, random) {
      const item = pick(MISREAD, random);
      const distractors = Object.values(STT_MISREAD).filter((t) => t !== item.type);
      return roundChoice(id, pathId, item.type, distractors.slice(0, 3), random, {
        raw: `“${item.example}” hangi yanlış okuma türüdür?`,
        strategy: 'Hata hücresini sınıflandır.',
        explanation: `Taksonomi: ${item.type}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(MISREAD, random);
      const distractors = Object.values(STT_MISREAD).filter((t) => t !== item.type);
      return roundChoice(id, pathId, item.type, distractors.slice(0, 3), random, {
        raw: `“${item.example}” için zorunlu etiket hangisidir?`,
        explanation: `Zorunlu etiket: ${item.type}.`
      });
    },
    spot(id, pathId, random) {
      const item = pick(MISREAD, random);
      const wrongLabel = Object.values(STT_MISREAD).find((t) => t !== item.type);
      const others = Object.values(STT_MISREAD).filter((t) => t !== wrongLabel);
      return roundChoice(id, pathId, wrongLabel, [item.type, others[0], others[1] || others[0]], random, {
        raw: `Doğru tür ${item.type} iken hangisi yanlış etikettir?`,
        explanation: `Doğru: ${item.type}.`
      });
    },
    compare(id, pathId, random) {
      const a = MISREAD[0];
      const b = MISREAD[1];
      return roundChoice(id, pathId, `${a.type}≠${b.type}`, ['ayni', 'ikisi-kaynak', 'ikisi-zaman'], random, {
        raw: `A: “${a.example}”→${a.type}. B: “${b.example}”→${b.type}. İlişki?`,
        explanation: 'Farklı yanlış-okuma hücreleri.'
      });
    }
  });
}

export const SOCIAL_TIME_TRAVEL_FAMILIES = [
  familyPrimarySource(),
  familySecondarySource(),
  familyChronology(),
  familyCauseEffect(),
  familyContinuityChange(),
  familyPerspective(),
  familyEvidenceClaim(),
  familyCulturalHeritage(),
  familyOralHistory(),
  familyMapTimeLink(),
  familyAnachronism(),
  familyMisreadTaxonomy()
];
