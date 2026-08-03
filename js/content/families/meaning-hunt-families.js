// Aşama 04 — meaning-hunt (Anlam Avı).
// UI: tüm iskeletler kind:'choice'.
// Aile = anlam ilişkisi türü (gerçek/mecaz, çokanlamlılık, eşanlam, karşıt, deyim,
// eşdizim, çağrışım, kayıt, sesteş, tür kayması, üst/alt anlam, yanlış-okuma taksonomisi).
// Yüzey cümle/kelime değişimi ≠ yeni aile.

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
  return `meaning-hunt:${skeletonId}:${pathId}:${simpleHash(raw)}`;
}

const PATH_IDS = ['raw-letters', 'context-embedded', 'staged-strategy-hint'];

const TASK_TRAITS = {
  select: ['strategySelection', 'multiStepInference'],
  forced: ['informationLinking', 'conditionEvaluation'],
  spot: ['errorAnalysis', 'conditionEvaluation'],
  compare: ['strategySelection', 'usingIntermediateResultInNewDecision']
};

export const MISREAD_TYPES = {
  SURFACE: 'yuzey-okuma',
  CONTEXT: 'baglam-atlatma',
  IDIOM: 'deyim-sozel',
  HOMONYM: 'sestes-karistirma'
};

function pathWrap(pathId, rawPrompt, contextHint, strategyHint) {
  if (pathId === 'raw-letters') {
    return {
      prompt: rawPrompt,
      context: contextHint || 'Hedef sözcüğün cümledeki anlam ilişkisini ayır; yüzey anlam tuzağına düşme.'
    };
  }
  if (pathId === 'context-embedded') {
    return {
      prompt: `Türkçe anlam atölyesinde tartışılan bir örnek: ${rawPrompt}`,
      context: 'Senaryodaki süslemeleri ayıkla; yalnız anlam ilişkisine odaklan.'
    };
  }
  return {
    prompt: `${strategyHint || 'Önce sözcüğün olası anlamlarını listele, sonra bağlamla eleye eleye git.'} ${rawPrompt}`,
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

// ---- 1. mh-literal-vs-figurative ----
const LIT_FIG = [
  { sentence: 'Bu ağır sözleri uzun süre unutamadı.', word: 'ağır', figurative: 'Kırıcı ve üzücü', literal: 'Tartısı fazla', distractors: ['Yavaş hareket eden', 'Değerli metal'] },
  { sentence: 'Sınıfın yıldızı bu yıl Elif oldu.', word: 'yıldız', figurative: 'Çok başarılı kişi', literal: 'Gökyüzü cismi', distractors: ['Geometrik şekil', 'Süsleme ışığı'] },
  { sentence: 'Annem sıcak bir gülümsemeyle bizi karşıladı.', word: 'sıcak', figurative: 'İçten ve samimi', literal: 'Yüksek sıcaklıkta', distractors: ['Acı veren', 'Parlak renkli'] },
  { sentence: 'Yazar, olayları keskin bir gözlem gücüyle aktarıyor.', word: 'keskin', figurative: 'Güçlü ve ayrıntılı', literal: 'İyi bilenmiş', distractors: ['Sert kokulu', 'Acı veren'] }
];

function familyLiteralVsFigurative() {
  return buildFamily('mh-literal-vs-figurative', {
    select(id, pathId, random) {
      const item = pick(LIT_FIG, random);
      return roundChoice(id, pathId, item.figurative, [item.literal, ...item.distractors.slice(0, 2)], random, {
        raw: `“${item.sentence}” cümlesinde “${item.word}” hangi anlamda kullanılmıştır?`,
        strategy: 'Önce sözlükteki gerçek anlamı yaz, sonra cümlenin mecazını test et.',
        explanation: `“${item.word}” burada mecaz anlamdadır: ${item.figurative}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(LIT_FIG, random);
      return roundChoice(id, pathId, 'mecaz', ['gerçek', 'eşses', 'karşıt'], random, {
        raw: `“${item.sentence}” içinde “${item.word}” için zorunlu anlam katmanı hangisidir?`,
        explanation: `Bağlam fiziksel ölçüyü değil duygu/başarı mecazını zorlar → mecaz.`
      });
    },
    spot(id, pathId, random) {
      const item = pick(LIT_FIG, random);
      return roundChoice(id, pathId, item.literal, [item.figurative, ...item.distractors.slice(0, 2)], random, {
        raw: `“${item.sentence}” için bir öğrenci “${item.word}”i yalnızca fiziksel anlamıyla okudu. Yanlış seçim hangisi?`,
        explanation: `${item.literal} gerçek anlamdır; cümlede mecaz (${item.figurative}) gerekir.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(LIT_FIG, random);
      const worldA = `A dünyası: “${item.word}” = ${item.literal}`;
      const worldB = `B dünyası: “${item.word}” = ${item.figurative}`;
      return roundChoice(id, pathId, 'B', ['A', 'İkisi eşit', 'Hiçbiri'], random, {
        raw: `Cümle: “${item.sentence}”. ${worldA}. ${worldB}. Cümleye uyan dünya hangisidir?`,
        explanation: `Bağlam B dünyasını (mecaz) seçer.`
      });
    }
  });
}

// ---- 2. mh-polysemy ----
const POLY = [
  { sentence: 'Kardeşim soruyu hemen çözdü.', word: 'çözmek', correct: 'Bir sonuca ulaştırmak', distractors: ['Düğümü açmak', 'Eritmek', 'Serbest bırakmak'] },
  { sentence: 'Bu haber sınıfta hızla yayıldı.', word: 'yayılmak', correct: 'Birçok kişiye ulaşmak', distractors: ['Yere uzanmak', 'Genişlemek', 'Dağılmak'] },
  { sentence: 'Doktor yarayı dikkatle sardı.', word: 'sarmak', correct: 'Sargı ile örtmek', distractors: ['Etrafını dolanmak', 'Sarılmak', 'Sarhoş etmek'] },
  { sentence: 'Takım yeni bir yol çizdi.', word: 'yol', correct: 'İzlenen yöntem', distractors: ['Cadde', 'Gezi rotası', 'Çizgi'] }
];

function familyPolysemy() {
  return buildFamily('mh-polysemy', {
    select(id, pathId, random) {
      const item = pick(POLY, random);
      return roundChoice(id, pathId, item.correct, item.distractors, random, {
        raw: `“${item.sentence}” cümlesinde “${item.word}” hangi anlamda kullanılmıştır?`,
        strategy: 'Çokanlamlı sözcüğün tüm anlamlarını yaz, sonra bağlamla eleye.',
        explanation: `Bağlam “${item.word}” için şunu seçer: ${item.correct}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(POLY, random);
      return roundChoice(id, pathId, item.correct, item.distractors, random, {
        raw: `“${item.word}” çokanlamlıdır. “${item.sentence}” bağlamında zorunlu anlam hangisidir?`,
        explanation: `Diğer anlamlar sözlükte var ama bu cümlede geçerli değildir.`
      });
    },
    spot(id, pathId, random) {
      const item = pick(POLY, random);
      const wrong = item.distractors[0];
      return roundChoice(id, pathId, wrong, [item.correct, item.distractors[1], item.distractors[2]], random, {
        raw: `Öğrenci “${item.sentence}” içindeki “${item.word}”i yanlış anlamla okudu. Yanlış anlam hangisi?`,
        explanation: `“${wrong}” bu bağlamda ihlaldir; doğru: ${item.correct}.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(POLY, random);
      return roundChoice(id, pathId, item.correct, item.distractors, random, {
        raw: `İki okuma: (1) ${item.distractors[0]} (2) ${item.correct}. “${item.sentence}” hangisine uyar?`,
        explanation: `Bağlam (2) yolunu zorunlu kılar: ${item.correct}.`
      });
    }
  });
}

// ---- 3. mh-synonym-context ----
const SYN = [
  { sentence: 'Öğretmen konuyu açık ve net anlattı.', target: 'açık', correct: 'anlaşılır', distractors: ['şeffaf', 'boş', 'güvenli'] },
  { sentence: 'Bu küçük ayrıntı bütün planın kilidiydi.', target: 'kilit', correct: 'en belirleyici unsur', distractors: ['kapı aracı', 'gizli eşya', 'metal parça'] },
  { sentence: 'Sorunun püf noktasını bulunca hemen çözdü.', target: 'püf noktası', correct: 'çözümü kolaylaştıran önemli ayrıntı', distractors: ['en zor yazı', 'yanlış cevap', 'soru işareti'] },
  { sentence: 'Konuşmacı düşüncelerini sağlam temellere oturttu.', target: 'sağlam temel', correct: 'güvenilir gerekçe', distractors: ['beton yapı', 'yüksek ses', 'uzun cümle'] }
];

function familySynonymContext() {
  return buildFamily('mh-synonym-context', {
    select(id, pathId, random) {
      const item = pick(SYN, random);
      return roundChoice(id, pathId, item.correct, item.distractors, random, {
        raw: `“${item.sentence}” içinde “${item.target}” için bağlama en uygun eşanlam hangisidir?`,
        strategy: 'Aday eşanlamları cümleye yerleştirip anlamı bozmayanı seç.',
        explanation: `Bağlama uygun eşanlam: ${item.correct}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(SYN, random);
      return roundChoice(id, pathId, item.correct, item.distractors, random, {
        raw: `Eşanlam seçiminde zorunlu koşul: cümle anlamı bozulmamalı. “${item.sentence}” için hangisi zorunludur?`,
        explanation: `Yalnız “${item.correct}” anlamı korur.`
      });
    },
    spot(id, pathId, random) {
      const item = pick(SYN, random);
      const wrong = item.distractors[0];
      return roundChoice(id, pathId, wrong, [item.correct, item.distractors[1], item.distractors[2]], random, {
        raw: `Öğrenci “${item.target}” yerine yüzey eşanlam koydu ve anlam bozuldu. Yanlış eşanlam hangisi?`,
        explanation: `“${wrong}” sözlükte yakın görünür ama bağlamda ihlaldir.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(SYN, random);
      return roundChoice(id, pathId, 'bağlama-uygun', ['sözlük-ilk-anlam', 'ses-benzeri', 'rastgele'], random, {
        raw: `A: “${item.distractors[0]}” B: “${item.correct}”. “${item.sentence}” için hangi seçim kuralı doğrudur?`,
        explanation: `Eşanlam seçimi bağlamı bozmayanı zorunlu kılar.`
      });
    }
  });
}

// ---- 4. mh-antonym-contrast ----
const ANT = [
  { sentence: 'Bu karar sorunu çözmedi, tam tersine büyüttü.', pair: 'çözmek × büyütmek', correct: 'karşıt sonuç vurgusu', distractors: ['eş anlamlı tekrar', 'deyim anlamı', 'sesteş oyun'] },
  { sentence: 'Önce umutlandı, sonra umutsuzluğa kapıldı.', pair: 'umut × umutsuzluk', correct: 'duygusal karşıtlık', distractors: ['aynı duygu tekrarı', 'mecaz renk', 'üst anlam'] },
  { sentence: 'Sözleri yumuşak değil, oldukça sertti.', pair: 'yumuşak × sert', correct: 'nitelik karşıtlığı', distractors: ['eşdizim hatası', 'kayıt farkı', 'homonym'] },
  { sentence: 'Plan basit göründü ama uygulaması karmaşıktı.', pair: 'basit × karmaşık', correct: 'zorluk karşıtlığı', distractors: ['eş anlamlılık', 'deyim', 'tür kayması'] }
];

function familyAntonymContrast() {
  return buildFamily('mh-antonym-contrast', {
    select(id, pathId, random) {
      const item = pick(ANT, random);
      return roundChoice(id, pathId, item.correct, item.distractors, random, {
        raw: `“${item.sentence}” cümlesindeki anlam ilişkisi (${item.pair}) neyi gösterir?`,
        strategy: 'Karşıtlık işaretlerini (tersine, değil, ama) bul; sonra ilişkiyi adlandır.',
        explanation: `Cümle ${item.pair} üzerinden ${item.correct} kurar.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(ANT, random);
      return roundChoice(id, pathId, 'karşıt anlam', ['eş anlam', 'üst anlam', 'sesteş'], random, {
        raw: `“${item.sentence}” için zorunlu anlam ilişkisi hangisidir?`,
        explanation: `Zorunlu ilişki: karşıt anlam (${item.pair}).`
      });
    },
    spot(id, pathId, random) {
      const item = pick(ANT, random);
      return roundChoice(id, pathId, 'eş anlamlı tekrar', [item.correct, 'karşıt sonuç vurgusu', 'duygusal karşıtlık'], random, {
        raw: `Öğrenci “${item.sentence}”i eşanlam tekrarı sandı. Yanlış ilişki adı hangisi?`,
        explanation: `Cümle karşıtlık kurar; “eş anlamlı tekrar” ihlaldir.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(ANT, random);
      return roundChoice(id, pathId, 'B-karşıt', ['A-eşanlam', 'C-sesteş', 'D-kayıt'], random, {
        raw: `Dünya A: eşanlam. Dünya B: karşıt anlam. “${item.sentence}” hangi dünyaya aittir?`,
        explanation: `Karşıtlık işaretleri B dünyasını seçer.`
      });
    }
  });
}

// ---- 5. mh-idiom ----
const IDIOM = [
  { sentence: 'Ali, arkadaşının sözünü kesti.', idiom: 'sözünü kesmek', meaning: 'Konuşmasını yarıda bölmek', distractors: ['Kâğıdı kesmek', 'Söz vermek', 'Sessiz konuşmak'] },
  { sentence: 'Bu görüş zamanla toplumda kök saldı.', idiom: 'kök salmak', meaning: 'Kalıcı hâle gelmek', distractors: ['Bitki yetiştirmek', 'Toprağı kazmak', 'Yavaşlamak'] },
  { sentence: 'Yeni bulgu tartışmaya farklı bir pencere açtı.', idiom: 'pencere açmak', meaning: 'Yeni bir bakış açısı kazandırmak', distractors: ['Odayı havalandırmak', 'Konuyu kapatmak', 'Kanıtı yok etmek'] },
  { sentence: 'Eleştirmen eserin zayıf damarını hemen yakaladı.', idiom: 'zayıf damar', meaning: 'Eserin güçsüz yönü', distractors: ['Sağlık sorunu', 'Duygusal davranış', 'Yazarın yaşamı'] }
];

function familyIdiom() {
  return buildFamily('mh-idiom', {
    select(id, pathId, random) {
      const item = pick(IDIOM, random);
      return roundChoice(id, pathId, item.meaning, item.distractors, random, {
        raw: `“${item.sentence}” cümlesinde “${item.idiom}” ne demektir?`,
        strategy: 'Deyimi kelime kelime çevirme; bütünün mecazi anlamını ara.',
        explanation: `“${item.idiom}” = ${item.meaning}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(IDIOM, random);
      return roundChoice(id, pathId, 'deyimsel bütün anlam', ['tek kelime gerçek anlam', 'sesteş anlam', 'kayıt farkı'], random, {
        raw: `“${item.idiom}” için zorunlu okuma biçimi hangisidir?`,
        explanation: `Deyim parçalara ayrılmaz; bütün anlam zorunludur.`
      });
    },
    spot(id, pathId, random) {
      const item = pick(IDIOM, random);
      const wrong = item.distractors[0];
      return roundChoice(id, pathId, wrong, [item.meaning, item.distractors[1], item.distractors[2]], random, {
        raw: `Öğrenci “${item.idiom}”i sözel/parça anlamıyla okudu. Yanlış anlam hangisi?`,
        explanation: `“${wrong}” deyimi bozar; doğru: ${item.meaning}.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(IDIOM, random);
      return roundChoice(id, pathId, item.meaning, item.distractors, random, {
        raw: `Dünya A: sözel çeviri (${item.distractors[0]}). Dünya B: deyim (${item.meaning}). “${item.sentence}” hangisine uyar?`,
        explanation: `Bağlam deyim dünyasını seçer.`
      });
    }
  });
}

// ---- 6. mh-collocation ----
const COLLOC = [
  { prompt: '“karar …” doğal eşdizimi hangisidir?', correct: 'almak', distractors: ['yapmak', 'kesmek', 'açmak'], why: 'Türkçede “karar almak” yerleşik eşdizimdir.' },
  { prompt: '“soru …” doğal eşdizimi hangisidir?', correct: 'sormak', distractors: ['vurmak', 'kesmek', 'yemek'], why: '“soru sormak” doğal eşdizimdir.' },
  { prompt: '“dikkat …” doğal eşdizimi hangisidir?', correct: 'çekmek', distractors: ['atmak', 'kırmak', 'yürümek'], why: '“dikkat çekmek” yerleşik kullanımdır.' },
  { prompt: '“söz …” doğal eşdizimi hangisidir?', correct: 'vermek', distractors: ['içmek', 'yazmak', 'boyamak'], why: '“söz vermek” doğal eşdizimdir.' }
];

function familyCollocation() {
  return buildFamily('mh-collocation', {
    select(id, pathId, random) {
      const item = pick(COLLOC, random);
      return roundChoice(id, pathId, item.correct, item.distractors, random, {
        raw: item.prompt,
        strategy: 'Aday fiilleri hedef isimle birleştir; kulağa doğal gelen eşdizimi seç.',
        explanation: item.why
      });
    },
    forced(id, pathId, random) {
      const item = pick(COLLOC, random);
      return roundChoice(id, pathId, item.correct, item.distractors, random, {
        raw: `${item.prompt} Zorunlu eşdizim fiili hangisidir?`,
        explanation: item.why
      });
    },
    spot(id, pathId, random) {
      const item = pick(COLLOC, random);
      const wrong = item.distractors[0];
      return roundChoice(id, pathId, wrong, [item.correct, item.distractors[1], item.distractors[2]], random, {
        raw: `Öğrenci doğal olmayan fiil seçti. ${item.prompt} Yanlış fiil hangisi?`,
        explanation: `“${wrong}” eşdizim ihlalidir; doğru: ${item.correct}.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(COLLOC, random);
      return roundChoice(id, pathId, item.correct, item.distractors, random, {
        raw: `Dünya A: rastgele fiil. Dünya B: yerleşik eşdizim. ${item.prompt} B dünyasındaki doğru seçim hangisi?`,
        explanation: item.why
      });
    }
  });
}

// ---- 7. mh-connotation ----
const CONNOT = [
  { sentence: 'Çocuk inatçı değil, kararlıydı.', word: 'kararlı', tone: 'olumlu', distractors: ['olumsuz', 'nötr-teknik', 'alaycı'] },
  { sentence: 'Rakipler onu cimri değil, tutumlu buldu.', word: 'tutumlu', tone: 'olumlu', distractors: ['olumsuz', 'nötr-teknik', 'alaycı'] },
  { sentence: 'Bu eleştiri yıkıcı değil, yapıcıydı.', word: 'yapıcı', tone: 'olumlu', distractors: ['olumsuz', 'nötr-teknik', 'alaycı'] },
  { sentence: 'Sözleri kaba değil, sert ama adildi.', word: 'adil', tone: 'olumlu', distractors: ['olumsuz', 'nötr-teknik', 'alaycı'] }
];

function familyConnotation() {
  return buildFamily('mh-connotation', {
    select(id, pathId, random) {
      const item = pick(CONNOT, random);
      return roundChoice(id, pathId, item.tone, item.distractors, random, {
        raw: `“${item.sentence}” içinde “${item.word}” sözcüğünün duygu/çağrışım yönü nedir?`,
        strategy: 'Aynı kavramın olumlu/olumsuz etiketlerini ayır; bağlamın seçtiğini bul.',
        explanation: `“${item.word}” burada ${item.tone} çağrışım taşır.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(CONNOT, random);
      return roundChoice(id, pathId, item.tone, item.distractors, random, {
        raw: `Çağrışım ayrımında zorunlu yön hangisidir? Cümle: “${item.sentence}”`,
        explanation: `Bağlam ${item.tone} çağrışımı zorunlu kılar.`
      });
    },
    spot(id, pathId, random) {
      const item = pick(CONNOT, random);
      return roundChoice(id, pathId, 'olumsuz', [item.tone, 'nötr-teknik', 'alaycı'], random, {
        raw: `Öğrenci “${item.word}”i olumsuz çağrışımlı sandı. Yanlış çağrışım etiketi hangisi?`,
        explanation: `Olumsuz etiket ihlaldir; doğru yön: ${item.tone}.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(CONNOT, random);
      return roundChoice(id, pathId, 'B-olumlu', ['A-olumsuz', 'C-nötr', 'D-alay'], random, {
        raw: `A dünyası olumsuz etiket, B dünyası olumlu etiket. “${item.sentence}” hangi dünyaya aittir?`,
        explanation: `Cümle olumlu çağrışım dünyasını seçer.`
      });
    }
  });
}

// ---- 8. mh-register ----
const REG = [
  { informal: 'Çok iyi oldu.', formal: 'Sonuç olumludur.', ask: 'resmi', correct: 'Sonuç olumludur.', distractors: ['Süper olmuş!', 'Vay be!', 'Hadi ya!'] },
  { informal: 'Bunu hemen yap.', formal: 'Bu işlemi ivedilikle tamamlayınız.', ask: 'resmi', correct: 'Bu işlemi ivedilikle tamamlayınız.', distractors: ['Hemen yap şunu.', 'Çabuk ol!', 'Haydi!'] },
  { informal: 'Anlamadım.', formal: 'İfadeyi netleştirebilir misiniz?', ask: 'resmi', correct: 'İfadeyi netleştirebilir misiniz?', distractors: ['Hiç anlamadım.', 'Ne diyorsun?', 'Anlamıyorum ki.'] },
  { informal: 'Teşekkürler.', formal: 'Katkılarınız için teşekkür ederim.', ask: 'resmi', correct: 'Katkılarınız için teşekkür ederim.', distractors: ['Sağ ol.', 'Eyvallah.', 'Eyvallah abicim.'] }
];

function familyRegister() {
  return buildFamily('mh-register', {
    select(id, pathId, random) {
      const item = pick(REG, random);
      return roundChoice(id, pathId, item.correct, item.distractors, random, {
        raw: `Günlük karşılık: “${item.informal}”. Aynı anlamın ${item.ask} kayıttaki karşılığı hangisidir?`,
        strategy: 'Anlamı sabitle, kayıt (resmi/günlük) farkını ayır.',
        explanation: `Resmi kayıt: ${item.correct}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(REG, random);
      return roundChoice(id, pathId, 'resmi kayıt', ['günlük argo', 'deyim', 'sesteş'], random, {
        raw: `“${item.formal}” ifadesinin zorunlu kayıt türü hangisidir?`,
        explanation: `İfade resmi kayıtta yer alır.`
      });
    },
    spot(id, pathId, random) {
      const item = pick(REG, random);
      const wrong = item.distractors[0];
      return roundChoice(id, pathId, wrong, [item.correct, item.distractors[1], item.distractors[2]], random, {
        raw: `Öğrenci resmi metne günlük ifade koydu. Yanlış seçim hangisi?`,
        explanation: `“${wrong}” kayıt ihlalidir.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(REG, random);
      return roundChoice(id, pathId, item.correct, item.distractors, random, {
        raw: `Dünya A günlük (“${item.informal}”), Dünya B resmi. Resmi dünyadaki doğru cümle hangisi?`,
        explanation: `B dünyası: ${item.correct}.`
      });
    }
  });
}

// ---- 9. mh-homonym-trap ----
const HOM = [
  { sentence: 'Yüz metre koşuda birinci oldu.', word: 'yüz', correct: 'sayı (100)', distractors: ['surat', 'yüzmek eylemi', 'örtü yüzü'] },
  { sentence: 'Göl kenarında balık tuttu.', word: 'göl', correct: 'su kütlesi', distractors: ['gölge kısaltması', 'renk tonu', 'soyadı'] },
  { sentence: 'Çay demlenene kadar bekledi.', word: 'çay', correct: 'içecek', distractors: ['akarsu', 'çayır kısaltması', 'renk'] },
  { sentence: 'Yaz tatilinde köye gitti.', word: 'yaz', correct: 'mevsim', distractors: ['yazı yazmak', 'yazılım', 'yazı tahtası'] }
];

function familyHomonymTrap() {
  return buildFamily('mh-homonym-trap', {
    select(id, pathId, random) {
      const item = pick(HOM, random);
      return roundChoice(id, pathId, item.correct, item.distractors, random, {
        raw: `“${item.sentence}” cümlesinde sesteş “${item.word}” hangi anlamdadır?`,
        strategy: 'Sesteş adayları listele; bağlamın elediği tek anlamı seç.',
        explanation: `Bağlam “${item.word}” için ${item.correct} seçer.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(HOM, random);
      return roundChoice(id, pathId, item.correct, item.distractors, random, {
        raw: `Sesteş tuzakta zorunlu anlam hangisidir? Cümle: “${item.sentence}”`,
        explanation: `Diğer sesteş anlamlar bağlam dışı kalır.`
      });
    },
    spot(id, pathId, random) {
      const item = pick(HOM, random);
      const wrong = item.distractors[0];
      return roundChoice(id, pathId, wrong, [item.correct, item.distractors[1], item.distractors[2]], random, {
        raw: `Öğrenci sesteş tuzağa düştü. “${item.sentence}” için yanlış anlam hangisi?`,
        explanation: `“${wrong}” sesteş karıştırmadır.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(HOM, random);
      return roundChoice(id, pathId, item.correct, item.distractors, random, {
        raw: `Dünya A: “${item.distractors[0]}”. Dünya B: “${item.correct}”. “${item.sentence}” hangi dünyaya uyar?`,
        explanation: `Bağlam B dünyasını seçer.`
      });
    }
  });
}

// ---- 10. mh-part-of-speech-shift ----
const POS = [
  { sentence: 'Koşu sabah erken başladı.', word: 'koşu', correct: 'isim (eylem adı)', distractors: ['fiil çekimi', 'sıfat', 'zarf'] },
  { sentence: 'Yeşil bir çözüm önerdi.', word: 'yeşil', correct: 'sıfat (nitelik)', distractors: ['isim (renk adı yalnız)', 'fiil', 'edat'] },
  { sentence: 'Hızlıca kapıyı kapattı.', word: 'hızlıca', correct: 'zarf (nasıllık)', distractors: ['sıfat', 'isim', 'fiil'] },
  { sentence: 'Bu yazı çok etkiliydi.', word: 'yazı', correct: 'isim (metin)', distractors: ['fiil (yazmak)', 'sıfat', 'bağlaç'] }
];

function familyPosShift() {
  return buildFamily('mh-part-of-speech-shift', {
    select(id, pathId, random) {
      const item = pick(POS, random);
      return roundChoice(id, pathId, item.correct, item.distractors, random, {
        raw: `“${item.sentence}” içinde “${item.word}” sözcüğünün türü/işlevi hangisidir?`,
        strategy: 'Sözcüğün cümledeki görevini (isim/sıfat/zarf/fiil) soruyla test et.',
        explanation: `Tür kayması sonucu: ${item.correct}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(POS, random);
      return roundChoice(id, pathId, item.correct, item.distractors, random, {
        raw: `Tür değişimiyle anlam: “${item.sentence}” için zorunlu tür hangisidir?`,
        explanation: `Zorunlu tür: ${item.correct}.`
      });
    },
    spot(id, pathId, random) {
      const item = pick(POS, random);
      const wrong = item.distractors[0];
      return roundChoice(id, pathId, wrong, [item.correct, item.distractors[1], item.distractors[2]], random, {
        raw: `Öğrenci “${item.word}”ün türünü yanlış okudu. Yanlış tür hangisi?`,
        explanation: `“${wrong}” tür ihlalidir.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(POS, random);
      return roundChoice(id, pathId, item.correct, item.distractors, random, {
        raw: `Dünya A: ${item.distractors[0]}. Dünya B: ${item.correct}. “${item.sentence}” hangi dünyaya aittir?`,
        explanation: `Bağlam B dünyasını (doğru tür) seçer.`
      });
    }
  });
}

// ---- 11. mh-hypernym-hyponym ----
const HYPER = [
  { sentence: 'Elma bir meyvedir.', hyper: 'meyve', hypo: 'elma', ask: 'üst anlam', correct: 'meyve', distractors: ['elma', 'kırmızı', 'ağaç'] },
  { sentence: 'Köpek bir hayvandır.', hyper: 'hayvan', hypo: 'köpek', ask: 'üst anlam', correct: 'hayvan', distractors: ['köpek', 'havlama', 'tasma'] },
  { sentence: 'Gitar bir çalgıdır.', hyper: 'çalgı', hypo: 'gitar', ask: 'alt anlam', correct: 'gitar', distractors: ['çalgı', 'müzik', 'nota'] },
  { sentence: 'Kare bir dörtgendir.', hyper: 'dörtgen', hypo: 'kare', ask: 'alt anlam', correct: 'kare', distractors: ['dörtgen', 'şekil', 'kenar'] }
];

function familyHypernymHyponym() {
  return buildFamily('mh-hypernym-hyponym', {
    select(id, pathId, random) {
      const item = pick(HYPER, random);
      return roundChoice(id, pathId, item.correct, item.distractors, random, {
        raw: `“${item.sentence}” ilişkisinde ${item.ask} hangisidir?`,
        strategy: 'Üst anlam (genel sınıf) ile alt anlamı (örnek) ayır.',
        explanation: `${item.ask}: ${item.correct} (üst=${item.hyper}, alt=${item.hypo}).`
      });
    },
    forced(id, pathId, random) {
      const item = pick(HYPER, random);
      return roundChoice(id, pathId, item.hyper, [item.hypo, item.distractors[2], item.distractors[1]], random, {
        raw: `“${item.hypo}” için zorunlu üst anlam (sınıf) hangisidir?`,
        explanation: `Üst anlam: ${item.hyper}.`
      });
    },
    spot(id, pathId, random) {
      const item = pick(HYPER, random);
      return roundChoice(id, pathId, item.hypo, [item.hyper, 'sınıf adı', 'genel kategori'], random, {
        raw: `Öğrenci üst anlam sorusunda alt örneği seçti. Yanlış (alt anlam) hangisi?`,
        explanation: `${item.hypo} alt anlamdır; üst anlam ${item.hyper} olmalıydı.`
      });
    },
    compare(id, pathId, random) {
      const item = pick(HYPER, random);
      return roundChoice(id, pathId, `${item.hypo} ⊂ ${item.hyper}`, [`${item.hyper} ⊂ ${item.hypo}`, 'eşit anlam', 'karşıt anlam'], random, {
        raw: `“${item.sentence}” için doğru kapsam ilişkisi hangisidir?`,
        explanation: `Alt anlam üst anlama dahildir: ${item.hypo} ⊂ ${item.hyper}.`
      });
    }
  });
}

// ---- 12. mh-misread-taxonomy ----
const MISREAD = [
  { sentence: 'Bu ağır sözleri unutamadı.', wrong: 'Tartısı fazla sandı.', type: MISREAD_TYPES.SURFACE },
  { sentence: 'Ali sözünü kesti.', wrong: 'Makasla kâğıt kesti sandı.', type: MISREAD_TYPES.IDIOM },
  { sentence: 'Yüz metre koştu.', wrong: 'Suratı ölçtü sandı.', type: MISREAD_TYPES.HOMONYM },
  { sentence: 'Haber hızla yayıldı.', wrong: 'Yere uzandı sandı.', type: MISREAD_TYPES.CONTEXT }
];

function familyMisreadTaxonomy() {
  return buildFamily('mh-misread-taxonomy', {
    select(id, pathId, random) {
      const item = pick(MISREAD, random);
      const distractors = Object.values(MISREAD_TYPES).filter((t) => t !== item.type);
      return roundChoice(id, pathId, item.type, distractors.slice(0, 3), random, {
        raw: `Cümle: “${item.sentence}”. Yanlış okuma: “${item.wrong}”. Bu yanlış okuma türü hangisidir?`,
        strategy: 'Yanlışlığın kaynağını sınıfla: yüzey / bağlam / deyim / sesteş.',
        explanation: `Yanlış okuma türü: ${item.type}.`
      });
    },
    forced(id, pathId, random) {
      const item = pick(MISREAD, random);
      const distractors = Object.values(MISREAD_TYPES).filter((t) => t !== item.type);
      return roundChoice(id, pathId, item.type, distractors.slice(0, 3), random, {
        raw: `“${item.wrong}” hatası için zorunlu taksonomi etiketi hangisidir?`,
        explanation: `Zorunlu etiket: ${item.type}.`
      });
    },
    spot(id, pathId, random) {
      const item = pick(MISREAD, random);
      const wrongLabel = Object.values(MISREAD_TYPES).find((t) => t !== item.type);
      const others = Object.values(MISREAD_TYPES).filter((t) => t !== wrongLabel);
      return roundChoice(id, pathId, wrongLabel, [item.type, others[0], others[1] || others[0]], random, {
        raw: `Cümle “${item.sentence}”; gerçek hata türü ${item.type}. Öğrenci yanlış etiket seçti. Yanlış etiket hangisi olabilir?`,
        explanation: `Doğru etiket ${item.type}; diğerleri ihlal/yanlış sınıflama olabilir.`
      });
    },
    compare(id, pathId, random) {
      const a = MISREAD[0];
      const b = MISREAD[2];
      return roundChoice(id, pathId, `${a.type} ≠ ${b.type}`, ['aynı tür', 'ikisi de deyim', 'ikisi de sesteş'], random, {
        raw: `Dünya A: “${a.sentence}” → “${a.wrong}” (${a.type}). Dünya B: “${b.sentence}” → “${b.wrong}” (${b.type}). İlişki hangisi?`,
        explanation: `İki yanlış okuma farklı taksonomi hücrelerindedir.`
      });
    }
  });
}

export const MEANING_HUNT_FAMILIES = [
  familyLiteralVsFigurative(),
  familyPolysemy(),
  familySynonymContext(),
  familyAntonymContrast(),
  familyIdiom(),
  familyCollocation(),
  familyConnotation(),
  familyRegister(),
  familyHomonymTrap(),
  familyPosShift(),
  familyHypernymHyponym(),
  familyMisreadTaxonomy()
];
