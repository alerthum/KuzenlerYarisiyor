// Aşama 04 — paragraph-detective (Paragraf Dedektifi).
// UI: tüm iskeletler kind:'choice'.
// Aile = paragraf düşünme türü (ana fikir, ayrıntı, çıkarım, neden-sonuç, kanıt-sav,
// gereksiz bilgi, başlık, amaç, üslup, karşılaştırma, sıra, yanlış-okuma taksonomisi).
// Metin yüzeyi makyajı ≠ yeni aile.

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
  return `paragraph-detective:${skeletonId}:${pathId}:${simpleHash(raw)}`;
}

const PATH_IDS = ['raw-letters', 'context-embedded', 'staged-strategy-hint'];

const TASK_TRAITS = {
  select: ['strategySelection', 'multiStepInference'],
  forced: ['informationLinking', 'conditionEvaluation'],
  spot: ['errorAnalysis', 'conditionEvaluation'],
  compare: ['strategySelection', 'usingIntermediateResultInNewDecision']
};

export const PD_MISREAD = {
  SURFACE: 'yuzey-okuma',
  INFERENCE: 'asiri-cikarim',
  EVIDENCE: 'kanit-yoksayma',
  PURPOSE: 'amac-kacirma'
};

function pathWrap(pathId, rawPrompt, contextHint, strategyHint) {
  if (pathId === 'raw-letters') {
    return {
      prompt: rawPrompt,
      context: contextHint || 'Metindeki kanıta dayan; metinde olmayanı ekleme.'
    };
  }
  if (pathId === 'context-embedded') {
    return {
      prompt: `Okuma atölyesinde incelenen paragraf: ${rawPrompt}`,
      context: 'Senaryo süsünü ayıkla; sorunun istediği düşünme türüne odaklan.'
    };
  }
  return {
    prompt: `${strategyHint || 'Önce sorunun türünü belirle, sonra ilgili cümleleri işaretle.'} ${rawPrompt}`,
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
  const optionDiagnostics = options.map((optionText, optionIndex) => {
    const isCorrect = optionIndex === answerIndex;
    const distractorIndex = distractors.map(String).indexOf(String(optionText));
    return {
      optionIndex,
      optionText: String(optionText),
      isCorrect,
      misconceptionId: isCorrect ? null : `${skeletonId}:M${Math.max(0, distractorIndex) + 1}`,
      misconception: isCorrect ? null : `Bu seçenek ${skeletonId} düşünme görevinde tipik bir yanlış okuma/çıkarım yolunu temsil eder.`
    };
  });
  return {
    kind: 'choice',
    prompt,
    context,
    options,
    answerIndex,
    explanation: texts.explanation,
    optionDiagnostics,
    detailedOptions: optionDiagnostics.map((item) => item.isCorrect
      ? `Doğru: ${texts.explanation}`
      : `Yanlış: ${item.misconception}`),
    distractorValidation: {
      verified: options.length === 4 && new Set(options.map(String)).size === 4 && answerIndex >= 0,
      diagnosticCount: optionDiagnostics.filter((item) => !item.isCorrect && item.misconceptionId).length
    },
    evidenceMap: {
      evidence: [{ id: 'prompt-evidence-1', text: texts.raw }],
      correctAnswerEvidenceIds: ['prompt-evidence-1']
    },
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

function withPara(para, question) {
  return `Paragraf: “${para}” ${question}`;
}

// ---- 1. pd-main-idea ----
const MAIN = [
  {
    para: 'Küçük bir kasabada her cumartesi kitap değiş tokuş günü yapılır. Komşular okudukları kitapları getirir, yenilerini alır. Böylece hem tasarruf edilir hem okuma alışkanlığı güçlenir.',
    main: 'Kitap paylaşımı okumayı ve tasarrufu destekler',
    detail: 'Etkinlik cumartesi olur',
    trap: 'Kasaba çok büyüktür',
    wrong: 'Kitaplar pahalıdır'
  },
  {
    para: 'Arılar çiçeklerden polen toplayarak hem bal yapar hem bitkilerin üremesine yardım eder. Bahçede çeşitli çiçek bulundurmak arıları çeker.',
    main: 'Arılar ekosisteme ve üretime katkı sağlar',
    detail: 'Polen çiçekten alınır',
    trap: 'Arılar yalnız bal yer',
    wrong: 'Çiçekler arılara zararlıdır'
  }
];

function familyMainIdea() {
  return buildFamily('pd-main-idea', {
    select(id, pathId, random) {
      const item = pick(MAIN, random);
      return roundChoice(id, pathId, item.main, [item.detail, item.trap, item.wrong], random, {
        raw: withPara(item.para, 'Ana düşünce hangisidir?'),
        strategy: 'Ayrıntıları ayır; tüm paragrafı kapsayan cümleyi seç.',
        explanation: `Ana düşünce: ${item.main}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(MAIN, random);
      return roundChoice(id, pathId, 'ANA-DUSUNCE', ['AYRINTI', 'BASLIK', 'YORUM'], random, {
        raw: withPara(item.para, 'Bu sorunun zorunlu hedefi hangi bilgi türüdür?'),
        explanation: 'Ana düşünce ailesi ANA-DUSUNCE ister.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(MAIN, random);
      return roundChoice(id, pathId, item.detail, [item.main, item.trap, item.wrong], random, {
        raw: withPara(item.para, 'Öğrenci ana düşünce yerine hangi ayrıntıyı seçerse hata yapmış olur?'),
        explanation: `${item.detail} yardımcı ayrıntıdır, ana düşünce değildir.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(MAIN, random);
      return roundChoice(id, pathId, item.main, [item.detail, item.trap, item.wrong], random, {
        raw: withPara(item.para, 'Hangisi ana düşünce, hangisi ayrıntı kıyasında ana düşüncedir?'),
        explanation: item.main
      });
    }
  });
}

// ---- 2. pd-supporting-detail ----
const DETAIL = [
  {
    para: 'Okul bahçesine üç yeni bank konuldu. Banklar öğle arasında gölgede oturmak için kullanılıyor. Ayrıca bahçeye iki çöp kutusu eklendi.',
    support: 'Üç yeni bank konuldu',
    main: 'Bahçe düzenlemesi yapıldı',
    irrelevant: 'Okulun adı değişti',
    false: 'Banklar kaldırıldı'
  },
  {
    para: 'Deneyde su 100 dereceye kadar ısıtıldı. Termometre her dakika okundu. Sonuçlar deftere yazıldı.',
    support: 'Termometre her dakika okundu',
    main: 'Deney özenle kaydedildi',
    irrelevant: 'Laboratuvar boyandı',
    false: 'Su soğutulmadı bile'
  }
];

function familySupportingDetail() {
  return buildFamily('pd-supporting-detail', {
    select(id, pathId, random) {
      const item = pick(DETAIL, random);
      return roundChoice(id, pathId, item.support, [item.irrelevant, item.false, 'Metinde yok'], random, {
        raw: withPara(item.para, 'Ana düşünceyi destekleyen doğru ayrıntı hangisidir?'),
        strategy: 'Metinde açıkça geçen ve ana fikri destekleyen cümleyi bul.',
        explanation: item.support
      });
    },
    forced(id, pathId, random) {
      const item = pick(DETAIL, random);
      return roundChoice(id, pathId, item.support, [item.irrelevant, item.false, item.main], random, {
        raw: withPara(item.para, 'Zorunlu destekleyici ayrıntı hangisidir?'),
        explanation: item.support
      });
    },
    spot(id, pathId, random) {
      const item = pick(DETAIL, random);
      return roundChoice(id, pathId, item.irrelevant, [item.support, item.main, 'Doğru ayrıntı'], random, {
        raw: withPara(item.para, 'Hangisi metinde olmayan / desteklemeyen bilgidir?'),
        explanation: `${item.irrelevant} metinde yoktur.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(DETAIL, random);
      return roundChoice(id, pathId, `DESTEK:${item.support}`, [`DESTEK:${item.irrelevant}`, `DESTEK:${item.false}`, 'DESTEK:yok'], random, {
        raw: withPara(item.para, 'Hangisi gerçek destekleyici ayrıntı etiketidir?'),
        explanation: item.support
      });
    }
  });
}

// ---- 3. pd-inference ----
const INFER = [
  {
    para: 'Ela şemsiyesini aldı ve kapıya doğru yürüdü. Dışarıda kaldırımlar ıslaktı.',
    inference: 'Yağmur yağmış veya yağıyor olabilir',
    surface: 'Ela kapıya yürüdü',
    over: 'Ela deniz kenarına gidecek',
    wrong: 'Kaldırımlar hiç ıslanmaz'
  },
  {
    para: 'Sınıfın ışıkları kapalıydı. Öğrenciler fısıltıyla konuşuyordu. Öğretmen film makinesini çalıştırdı.',
    inference: 'Sınıfta film izlenecek',
    surface: 'Işıklar kapalıydı',
    over: 'Okul tatil oldu',
    wrong: 'Öğretmen sınıfta yoktu'
  }
];

function familyInference() {
  return buildFamily('pd-inference', {
    select(id, pathId, random) {
      const item = pick(INFER, random);
      return roundChoice(id, pathId, item.inference, [item.surface, item.over, item.wrong], random, {
        raw: withPara(item.para, 'Metinden güvenli çıkarım hangisidir?'),
        strategy: 'İpuçlarını birleştir; metnin desteklemediği abartıyı ele.',
        explanation: item.inference
      });
    },
    forced(id, pathId, random) {
      const item = pick(INFER, random);
      return roundChoice(id, pathId, 'CIKARIM', ['YUZET', 'BASLIK', 'ALINTI'], random, {
        raw: withPara(item.para, 'Bu sorunun zorunlu düşünme türü?'),
        explanation: 'Çıkarım ailesi CIKARIM ister.'
      });
    },
    spot(id, pathId, random) {
      const item = pick(INFER, random);
      return roundChoice(id, pathId, item.over, [item.inference, item.surface, 'Güvenli çıkarım'], random, {
        raw: withPara(item.para, 'Hangisi aşırı / temelsiz çıkarımdır?'),
        explanation: `${item.over} metnin ipuçlarını aşar.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(INFER, random);
      return roundChoice(id, pathId, item.inference, [item.over, item.wrong, item.surface], random, {
        raw: withPara(item.para, 'Güvenli çıkarım ile aşırı çıkarım kıyasında doğru olan?'),
        explanation: item.inference
      });
    }
  });
}

// ---- 4. pd-cause-effect ----
const CAUSE = [
  {
    para: 'Yağmur yağdığı için maç ertelendi. Seyirciler tribünlerden ayrıldı.',
    cause: 'Yağmur yağması',
    effect: 'Maçın ertelenmesi',
    unrelated: 'Seyircilerin forma alması',
    reverse: 'Erteleme yağmura yol açtı'
  },
  {
    para: 'Bitki yeterince sulanmadığı için yaprakları soldu. Bahçıvan sulama saatini değiştirdi.',
    cause: 'Yetersiz sulama',
    effect: 'Yaprakların solması',
    unrelated: 'Bahçıvanın şapka takması',
    reverse: 'Solma sulamayı azalttı'
  }
];

function familyCauseEffect() {
  return buildFamily('pd-cause-effect', {
    select(id, pathId, random) {
      const item = pick(CAUSE, random);
      return roundChoice(id, pathId, item.cause, [item.unrelated, item.reverse, item.effect], random, {
        raw: withPara(item.para, 'Sonucun nedeni hangisidir?'),
        strategy: '“için / dolayı” bağlarını izle; neden ile sonucu karıştırma.',
        explanation: `Neden: ${item.cause}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(CAUSE, random);
      return roundChoice(id, pathId, item.effect, [item.cause, item.unrelated, item.reverse], random, {
        raw: withPara(item.para, 'Zorunlu sonuç (etki) hangisidir?'),
        explanation: `Etki: ${item.effect}.`
      });
    },
    spot(id, pathId, random) {
      const item = pick(CAUSE, random);
      return roundChoice(id, pathId, item.reverse, [item.cause, item.effect, 'Doğru bağ'], random, {
        raw: withPara(item.para, 'Hangisi neden-sonuç yönünü ters çevirir?'),
        explanation: item.reverse
      });
    },
    compare(id, pathId, random) {
      const item = pick(CAUSE, random);
      return roundChoice(id, pathId, `${item.cause}→${item.effect}`, [`${item.effect}→${item.cause}`, item.unrelated, 'bağ yok'], random, {
        raw: withPara(item.para, 'Doğru neden→sonuç çifti hangisi?'),
        explanation: `${item.cause} → ${item.effect}`
      });
    }
  });
}

// ---- 5. pd-evidence-claim ----
const EVID = [
  {
    para: 'Araştırmacıya göre düzenli uyku dikkat süresini artırır. Deneyde uykusuz gruba göre dinlenmiş grup daha çok soru çözdü.',
    claim: 'Düzenli uyku dikkati artırır',
    evidence: 'Dinlenmiş grup daha çok soru çözdü',
    weak: 'Araştırmacı ünlüdür',
    absent: 'Uyku hapları satıldı'
  },
  {
    para: 'Okul bahçesindeki ağaçlar gölge sağlar. Yazın öğrenciler bu gölgede oturmayı tercih etti.',
    claim: 'Ağaçlar gölge sağlar',
    evidence: 'Öğrenciler gölgede oturmayı tercih etti',
    weak: 'Bahçe büyüktür',
    absent: 'Ağaçlar kesildi'
  }
];

function familyEvidenceClaim() {
  return buildFamily('pd-evidence-claim', {
    select(id, pathId, random) {
      const item = pick(EVID, random);
      return roundChoice(id, pathId, item.evidence, [item.weak, item.absent, 'Kanıt yok'], random, {
        raw: withPara(item.para, `Sav: “${item.claim}”. Bu savı destekleyen kanıt hangisidir?`),
        strategy: 'Savı bul, sonra onu destekleyen ölçülebilir/gözlenen bilgiyi seç.',
        explanation: item.evidence
      });
    },
    forced(id, pathId, random) {
      const item = pick(EVID, random);
      return roundChoice(id, pathId, item.claim, [item.weak, item.absent, item.evidence], random, {
        raw: withPara(item.para, 'Metindeki zorunlu sav hangisidir?'),
        explanation: item.claim
      });
    },
    spot(id, pathId, random) {
      const item = pick(EVID, random);
      return roundChoice(id, pathId, item.weak, [item.evidence, item.claim, 'Güçlü kanıt'], random, {
        raw: withPara(item.para, 'Hangisi zayıf / yanıltıcı “kanıt”tır?'),
        explanation: `${item.weak} savı doğrudan desteklemez.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(EVID, random);
      return roundChoice(id, pathId, `KANIT:${item.evidence}`, [`KANIT:${item.weak}`, `KANIT:${item.absent}`, 'KANIT:yok'], random, {
        raw: withPara(item.para, 'Güçlü kanıt etiketi hangisi?'),
        explanation: item.evidence
      });
    }
  });
}

// ---- 6. pd-irrelevant-info ----
const IRREL = [
  {
    para: 'Bisiklet yolu güvenliği için kask takılmalıdır. Yol çizgileri yenilendi. Ayrıca kafeteryada çilekli pasta vardı.',
    irrelevant: 'Kafeteryada çilekli pasta vardı',
    relevant: 'Kask takılmalıdır',
    also: 'Yol çizgileri yenilendi',
    fake: 'Bisiklet yasaktır'
  },
  {
    para: 'Deprem çantasında su ve düdük bulundurulur. Aile toplanma yeri belirlenir. Komşunun kedisinin adı Pamuk’tur.',
    irrelevant: 'Komşunun kedisinin adı Pamuk’tur',
    relevant: 'Su ve düdük bulundurulur',
    also: 'Toplanma yeri belirlenir',
    fake: 'Çanta gereksizdir'
  }
];

function familyIrrelevant() {
  return buildFamily('pd-irrelevant-info', {
    select(id, pathId, random) {
      const item = pick(IRREL, random);
      return roundChoice(id, pathId, item.irrelevant, [item.relevant, item.also, item.fake], random, {
        raw: withPara(item.para, 'Konuyla en az ilgili / gereksiz bilgi hangisidir?'),
        strategy: 'Ana konuyu belirle; konuya hizmet etmeyen cümleyi ayıkla.',
        explanation: item.irrelevant
      });
    },
    forced(id, pathId, random) {
      const item = pick(IRREL, random);
      return roundChoice(id, pathId, item.irrelevant, [item.relevant, item.also, 'Hepsi gerekli'], random, {
        raw: withPara(item.para, 'Zorunlu olarak ayıklanacak gereksiz bilgi?'),
        explanation: item.irrelevant
      });
    },
    spot(id, pathId, random) {
      const item = pick(IRREL, random);
      return roundChoice(id, pathId, item.relevant, [item.irrelevant, 'Gereksiz cümle', item.fake], random, {
        raw: withPara(item.para, 'Öğrenci yanlışlıkla hangisini “gereksiz” sandı (aslında gerekli)?'),
        explanation: `${item.relevant} konuya hizmet eder.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(IRREL, random);
      return roundChoice(id, pathId, `AYIKLA:${item.irrelevant}`, [`AYIKLA:${item.relevant}`, `AYIKLA:${item.also}`, 'AYIKLA:yok'], random, {
        raw: withPara(item.para, 'Hangisi ayıklanmalı?'),
        explanation: item.irrelevant
      });
    }
  });
}

// ---- 7. pd-title-match ----
const TITLE = [
  {
    para: 'Çocuklar geri dönüşüm kutusuna kâğıt ve plastik attı. Sınıf bir haftada üç kutu doldurdu.',
    best: 'Sınıfta Geri Dönüşüm',
    weak: 'Deniz Yolculuğu',
    narrow: 'Yalnız Plastik',
    off: 'Futbol Maçı'
  },
  {
    para: 'Kütüphane sessiz okuma saatleri düzenledi. Öğrenciler kendi seçtikleri kitapları okudu.',
    best: 'Sessiz Okuma Saatleri',
    weak: 'Spor Şenliği',
    narrow: 'Yalnız Romanlar',
    off: 'Mutfak Tarifi'
  }
];

function familyTitleMatch() {
  return buildFamily('pd-title-match', {
    select(id, pathId, random) {
      const item = pick(TITLE, random);
      return roundChoice(id, pathId, item.best, [item.weak, item.narrow, item.off], random, {
        raw: withPara(item.para, 'Metne en uygun başlık hangisidir?'),
        strategy: 'Başlık tüm metni kapsamalı; dar veya alakasız olmamalı.',
        explanation: item.best
      });
    },
    forced(id, pathId, random) {
      const item = pick(TITLE, random);
      return roundChoice(id, pathId, item.best, [item.weak, item.off, item.narrow], random, {
        raw: withPara(item.para, 'Zorunlu en iyi başlık?'),
        explanation: item.best
      });
    },
    spot(id, pathId, random) {
      const item = pick(TITLE, random);
      return roundChoice(id, pathId, item.off, [item.best, item.narrow, item.weak], random, {
        raw: withPara(item.para, 'Hangisi tamamen konu dışı başlıktır?'),
        explanation: item.off
      });
    },
    compare(id, pathId, random) {
      const item = pick(TITLE, random);
      return roundChoice(id, pathId, item.best, [item.narrow, item.weak, item.off], random, {
        raw: withPara(item.para, 'Kapsayıcı başlık hangisi (dar başlığa karşı)?'),
        explanation: item.best
      });
    }
  });
}

// ---- 8. pd-author-purpose ----
const PURPOSE = [
  {
    para: 'Ellerini yıka, öksürürken ağzını kapat. Mikroplar böyle azalır.',
    purpose: 'Bilgilendirip uyarmak',
    entertain: 'Eğlendirmek',
    sell: 'Ürün satmak',
    insult: 'Alay etmek'
  },
  {
    para: 'Bu yaz kampına katılın! Doğa yürüyüşleri ve yeni arkadaşlar sizi bekliyor.',
    purpose: 'Katılıma teşvik etmek',
    entertain: 'Masal anlatmak',
    sell: 'Matematik öğretmek',
    insult: 'Korkutmak'
  }
];

function familyAuthorPurpose() {
  return buildFamily('pd-author-purpose', {
    select(id, pathId, random) {
      const item = pick(PURPOSE, random);
      return roundChoice(id, pathId, item.purpose, [item.entertain, item.sell, item.insult], random, {
        raw: withPara(item.para, 'Yazarın amacı hangisidir?'),
        strategy: 'Üslup ve çağrıya bak; yazar ne yaptırmak istiyor?',
        explanation: item.purpose
      });
    },
    forced(id, pathId, random) {
      const item = pick(PURPOSE, random);
      return roundChoice(id, pathId, item.purpose, [item.entertain, item.sell, item.insult], random, {
        raw: withPara(item.para, 'Zorunlu yazar amacı?'),
        explanation: item.purpose
      });
    },
    spot(id, pathId, random) {
      const item = pick(PURPOSE, random);
      return roundChoice(id, pathId, item.insult, [item.purpose, item.entertain, item.sell], random, {
        raw: withPara(item.para, 'Hangisi metnin amacına uymayan yanlış etikettir?'),
        explanation: item.insult
      });
    },
    compare(id, pathId, random) {
      const item = pick(PURPOSE, random);
      return roundChoice(id, pathId, item.purpose, [item.entertain, item.sell, item.insult], random, {
        raw: withPara(item.para, 'Doğru amaç hangisi?'),
        explanation: item.purpose
      });
    }
  });
}

// ---- 9. pd-tone-attitude ----
const TONE = [
  {
    para: 'Ne yazık ki parkın çiçekleri ezilmişti. Çocuklar üzgün bakışlarla etrafa baktı.',
    tone: 'Üzgün / kaygılı',
    wrong1: 'Neşeli alay',
    wrong2: 'Resmi duyuru',
    wrong3: 'Kızgın reklam'
  },
  {
    para: 'Harika bir sürprizdi! Herkes alkışladı ve gülümsedi.',
    tone: 'Sevinçli / coşkulu',
    wrong1: 'Korkulu',
    wrong2: 'Soğuk resmi',
    wrong3: 'Alaycı'
  }
];

function familyTone() {
  return buildFamily('pd-tone-attitude', {
    select(id, pathId, random) {
      const item = pick(TONE, random);
      return roundChoice(id, pathId, item.tone, [item.wrong1, item.wrong2, item.wrong3], random, {
        raw: withPara(item.para, 'Metnin üslup / tutumu hangisidir?'),
        strategy: 'Duygu sözcüklerini ve ünlemleri izle.',
        explanation: item.tone
      });
    },
    forced(id, pathId, random) {
      const item = pick(TONE, random);
      return roundChoice(id, pathId, item.tone, [item.wrong1, item.wrong2, item.wrong3], random, {
        raw: withPara(item.para, 'Zorunlu tutum etiketi?'),
        explanation: item.tone
      });
    },
    spot(id, pathId, random) {
      const item = pick(TONE, random);
      return roundChoice(id, pathId, item.wrong1, [item.tone, item.wrong2, item.wrong3], random, {
        raw: withPara(item.para, 'Hangisi üslubu yanlış okuyan etikettir?'),
        explanation: item.wrong1
      });
    },
    compare(id, pathId, random) {
      const item = pick(TONE, random);
      return roundChoice(id, pathId, item.tone, [item.wrong1, item.wrong2, item.wrong3], random, {
        raw: withPara(item.para, 'Doğru üslup hangisi?'),
        explanation: item.tone
      });
    }
  });
}

// ---- 10. pd-compare-contrast ----
const COMP = [
  {
    para: 'Bisiklet sessiz ve ucuzdur; otomobil hızlıdır ama daha pahalıdır. İkisi de ulaşım sağlar.',
    alike: 'İkisi de ulaşım sağlar',
    differ: 'Bisiklet daha sessiz ve ucuzdur',
    false: 'Otomobil hiç kullanılmaz',
    trap: 'Bisiklet uçar'
  },
  {
    para: 'Kışın günler kısa, yazın uzundur. Her iki mevsimde de okula gidilir.',
    alike: 'Her iki mevsimde okula gidilir',
    differ: 'Kışın günler daha kısadır',
    false: 'Yazın okul yoktur',
    trap: 'Mevsimler aynıdır'
  }
];

function familyCompareContrast() {
  return buildFamily('pd-compare-contrast', {
    select(id, pathId, random) {
      const item = pick(COMP, random);
      return roundChoice(id, pathId, item.differ, [item.false, item.trap, 'Fark yok'], random, {
        raw: withPara(item.para, 'Metne göre temel fark hangisidir?'),
        strategy: 'Ortak ve farklı yönleri ayır.',
        explanation: item.differ
      });
    },
    forced(id, pathId, random) {
      const item = pick(COMP, random);
      return roundChoice(id, pathId, item.alike, [item.false, item.trap, item.differ], random, {
        raw: withPara(item.para, 'Zorunlu ortak yön hangisidir?'),
        explanation: item.alike
      });
    },
    spot(id, pathId, random) {
      const item = pick(COMP, random);
      return roundChoice(id, pathId, item.trap, [item.alike, item.differ, item.false], random, {
        raw: withPara(item.para, 'Hangisi metne aykırı karşılaştırmadır?'),
        explanation: item.trap
      });
    },
    compare(id, pathId, random) {
      const item = pick(COMP, random);
      return roundChoice(id, pathId, `ORTAK:${item.alike}`, [`ORTAK:${item.false}`, `ORTAK:${item.trap}`, 'ORTAK:yok'], random, {
        raw: withPara(item.para, 'Doğru ortak yön etiketi?'),
        explanation: item.alike
      });
    }
  });
}

// ---- 11. pd-sequence-structure ----
const SEQ = [
  {
    para: 'Önce tohum ekildi. Sonra sulandı. En sonunda filiz göründü.',
    order: 'ekme → sulama → filiz',
    wrong: 'filiz → ekme → sulama',
    skip: 'yalnız sulama',
    trap: 'önce filiz'
  },
  {
    para: 'Çocuk ödevini bitirdi. Ardından çantasını hazırladı. Daha sonra uyudu.',
    order: 'ödev → çanta → uyku',
    wrong: 'uyku → ödev → çanta',
    skip: 'yalnız çanta',
    trap: 'önce uyku'
  }
];

function familySequence() {
  return buildFamily('pd-sequence-structure', {
    select(id, pathId, random) {
      const item = pick(SEQ, random);
      return roundChoice(id, pathId, item.order, [item.wrong, item.skip, item.trap], random, {
        raw: withPara(item.para, 'Doğru olay sırası hangisidir?'),
        strategy: 'Önce / sonra / en sonunda bağlaçlarını izle.',
        explanation: item.order
      });
    },
    forced(id, pathId, random) {
      const item = pick(SEQ, random);
      return roundChoice(id, pathId, item.order, [item.wrong, item.skip, item.trap], random, {
        raw: withPara(item.para, 'Zorunlu doğru sıra?'),
        explanation: item.order
      });
    },
    spot(id, pathId, random) {
      const item = pick(SEQ, random);
      return roundChoice(id, pathId, item.wrong, [item.order, item.skip, item.trap], random, {
        raw: withPara(item.para, 'Hangisi sırayı bozan seçenektir?'),
        explanation: item.wrong
      });
    },
    compare(id, pathId, random) {
      const item = pick(SEQ, random);
      return roundChoice(id, pathId, item.order, [item.wrong, item.trap, item.skip], random, {
        raw: withPara(item.para, 'Doğru yapısal sıra hangisi?'),
        explanation: item.order
      });
    }
  });
}

// ---- 12. pd-misread-taxonomy ----
const MIS = [
  { text: 'Öğrenci yalnız ilk cümleyi okuyup ana fikir sandı.', error: PD_MISREAD.SURFACE },
  { text: 'Metinde olmayan bir sonucu kesin gibi ekledi.', error: PD_MISREAD.INFERENCE },
  { text: 'Savı okudu ama deney sonucunu yok saydı.', error: PD_MISREAD.EVIDENCE },
  { text: 'Uyarı metnini eğlence yazısı sandı.', error: PD_MISREAD.PURPOSE }
];

function familyMisreadTaxonomy() {
  return buildFamily('pd-misread-taxonomy', {
    select(id, pathId, random) {
      const item = pick(MAIN, random);
      return roundChoice(id, pathId, item.main, [item.detail, item.trap, item.wrong], random, {
        raw: withPara(item.para, 'Doğru ana düşünceyi seç (yanlış okuma türlerini aklında tut).'),
        strategy: 'Yüzey, aşırı çıkarım, kanıt yoksaması ve amaç kaçırmayı ayrı kontrol et.',
        explanation: item.main
      });
    },
    forced(id, pathId, random) {
      const s = pick(MIS, random);
      return roundChoice(id, pathId, s.error, Object.values(PD_MISREAD).filter((e) => e !== s.error), random, {
        raw: `${s.text} Zorunlu yanlış-okuma etiketi?`,
        explanation: `→ ${s.error}`
      });
    },
    spot(id, pathId, random) {
      const s = pick(MIS, random);
      return roundChoice(id, pathId, s.error, shuffle(Object.values(PD_MISREAD).filter((e) => e !== s.error), random).slice(0, 3), random, {
        raw: `Durum: ${s.text} Hangi yanlış okuma?`,
        explanation: s.error
      });
    },
    compare(id, pathId, random) {
      const a = pick(MIS, random);
      let b = pick(MIS, random);
      while (b.error === a.error) b = pick(MIS, random);
      const answer = `${a.error}|${b.error}`;
      const distractors = [
        `${b.error}|${a.error}`,
        `${PD_MISREAD.SURFACE}|${PD_MISREAD.SURFACE}`,
        `${PD_MISREAD.PURPOSE}|${PD_MISREAD.PURPOSE}`
      ].filter((x) => x !== answer);
      return roundChoice(id, pathId, answer, distractors.slice(0, 3), random, {
        raw: `A: ${a.text} · B: ${b.text}. Etiket çifti (A|B)?`,
        explanation: `A→${a.error}, B→${b.error}`
      });
    }
  });
}

export const PARAGRAPH_DETECTIVE_FAMILIES = [
  familyMainIdea(),
  familySupportingDetail(),
  familyInference(),
  familyCauseEffect(),
  familyEvidenceClaim(),
  familyIrrelevant(),
  familyTitleMatch(),
  familyAuthorPurpose(),
  familyTone(),
  familyCompareContrast(),
  familySequence(),
  familyMisreadTaxonomy()
];
