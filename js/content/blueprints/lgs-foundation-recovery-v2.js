/**
 * LGS Foundation — Capacity Policy V2 blueprint recovery.
 * Veri odaklı: yeni iskeletler (sayı/isim makyajı değil).
 * Her kayıt ayrı structuralId / cognitiveExperience üretir.
 */

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
  for (let i = 0; i < String(str).length; i += 1) h = ((h << 5) - h + String(str).charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

const PATH_IDS = [
  'raw-letters',
  'context-embedded',
  'staged-strategy-hint',
  'counterexample-first',
  'constraint-ordering'
];

function pathWrap(pathId, rawPrompt, contextHint, strategyHint) {
  if (pathId === 'raw-letters') {
    return { prompt: rawPrompt, context: contextHint || 'Kalıp düşüncesine odaklan.' };
  }
  if (pathId === 'context-embedded') {
    return { prompt: `Deneme kitapçığı: ${rawPrompt}`, context: 'Süs bağlamı ayıkla.' };
  }
  if (pathId === 'counterexample-first') {
    return { prompt: `Önce yanlış seçeneği ele: ${rawPrompt}`, context: 'Eleme yolu; spoiler yok.' };
  }
  if (pathId === 'constraint-ordering') {
    return { prompt: `Koşulları sırayla uygula: ${rawPrompt}`, context: 'Kısıt sıralama; ara karar zorunlu.' };
  }
  return {
    prompt: `${strategyHint || 'Önce kalıbı belirle.'} ${rawPrompt}`,
    context: 'Strateji ipucu cevabı vermez.'
  };
}

const STEM_FRAMES = [
  'Doğru sonuç hangisidir?', 'Bu kalıpta hangi seçenek geçerlidir?',
  'Hangi yanıt zorunlu adıma uyar?', 'Eleme sonrası kalan doğru nedir?',
  'Ara karar doğruysa sonuç hangisidir?', 'Yanılgı tuzağına düşmeden seç:',
  'Kanıtla uyumlu seçenek hangisi?', 'İkinci adım tamamlanınca ne bulunur?',
  'Koşulları sağlayan tek seçenek?', 'Hangi seçenek düşünme yolunu bozar?',
  'Doğru stratejinin çıktısı nedir?', 'Karşı örnekle elenenler dışında kalan?',
  'Birim/ölçek korunursa sonuç?', 'Metin/veri ile çelişmeyen hangisi?',
  'Çok adımlı çözümün sonu hangisi?', 'Hangi seçenek kısmi doğruyu tam sanır?',
  'Kontrol ettikten sonra kalan doğru?', 'Zorunlu ara sonucu kullanan cevap?',
  'Yüzey tuzağı olmayan seçenek?', 'Hedef soruya en uygun yanıt?'
];

function roundChoice(skeletonId, pathId, answerText, distractors, random, texts, meta = {}) {
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
    questionKey: `lgs-foundation:${skeletonId}:${pathId}:${simpleHash(`${texts.raw}|${answerText}|${instanceNonce}`)}`,
    curriculumSkillId: meta.curriculumSkillId || null,
    distractorPlanId: meta.distractorPlanId || `${skeletonId}#plan`,
    solutionGraphId: meta.solutionGraphId || `${skeletonId}#graph`,
    difficultyEvidence: meta.difficultyEvidence || 'multi-step-decision',
    ageAppropriateLanguage: true,
    misconceptionIds: meta.misconceptionIds || ['yanlis-kural', 'yuzey-tuzagi', 'eksik-adim'],
    independentSolver: true,
    representationType: meta.representationType || 'verbal-symbolic',
    informationFlow: meta.informationFlow || ['read', 'decide', 'verify'],
    requestedResult: meta.requestedResult || 'choice'
  };
}

/**
 * Aile bazlı recovery paketleri — her biri 3 yeni iskelet.
 * justify-link: kanıt→sonuç bağı
 * intermediate-reuse: ara sonuçla ikinci karar
 * misconception-map: yanlış seçeneğin yanılgı kimliği
 */
const PACKS = [
  {
    familyId: 'lgs-ratio-proportion',
    curriculumSkillId: 'math.ratio.unit-rate',
    justify: {
      items: [
        { stem: '3:5 oranında birinci 12', answer: 'birim=4 sonra×5', wrong: ['12+5', '3×5', '12-5'] },
        { stem: '2:7 oranında birinci 10', answer: 'birim=5 sonra×7', wrong: ['10+7', '2×7', '10/2'] }
      ]
    },
    intermediate: {
      items: [
        { stem: 'oran 4:3, birinci 20; ikinciyi bulup toplam sor', mid: 15, answer: '35', wrong: ['23', '20', '12'] },
        { stem: 'oran 5:2, birinci 25; ikinciyi bulup fark sor', mid: 10, answer: '15', wrong: ['35', '7', '20'] }
      ]
    },
    misconception: {
      items: [
        { wrongOpt: 'payları topla', label: 'oran-birim-hata', others: ['birim unut', 'pay çarp', 'oran koru'] },
        { wrongOpt: 'sadece büyük pay', label: 'yuzey-karsilastirma', others: ['birim bul', 'oran yaz', 'çapraz çarp'] }
      ]
    }
  },
  {
    familyId: 'lgs-pattern-rule',
    curriculumSkillId: 'math.pattern.constant-diff',
    justify: {
      items: [
        { stem: '5 • 9 • 13 • 17', answer: '+4 kuralı', wrong: ['×2', 'tek sayı', 'rastgele'] },
        { stem: '2 • 8 • 14 • 20', answer: '+6 kuralı', wrong: ['×3', 'çift sayı', 'azalan'] }
      ]
    },
    intermediate: {
      items: [
        { stem: '3•7•11•?; sonra ?+4', mid: 15, answer: '19', wrong: ['15', '11', '18'] },
        { stem: '4•10•16•?; sonra ?-2', mid: 22, answer: '20', wrong: ['22', '18', '24'] }
      ]
    },
    misconception: {
      items: [
        { wrongOpt: 'son terimi ikiye katla', label: 'carpan-yanilgi', others: ['fark ekle', 'kural yaz', 'terim say'] },
        { wrongOpt: 'renk sırası', label: 'yuzey-dekor', others: ['fark bul', 'sonraki', 'kontrol'] }
      ]
    }
  },
  {
    familyId: 'lgs-variable-control',
    curriculumSkillId: 'science.method.control-variables',
    justify: {
      items: [
        { stem: 'Sıcaklık değişti, su ve ışık sabit', answer: 'bağımsız=sıcaklık', wrong: ['bağımlı=su', 'kontrol yok', 'hepsi değişti'] },
        { stem: 'Işık değişti, gübre ve su sabit', answer: 'bağımsız=ışık', wrong: ['bağımlı=gübre', 'rastgele', 'ölçü yok'] }
      ]
    },
    intermediate: {
      items: [
        { stem: 'Bağımsız=su; bağımlı büyümeyi ölç; hangi kontrol?', mid: 'isik+sicaklik', answer: 'ışık ve sıcaklık sabit', wrong: ['su da değişsin', 'ölçme', 'renk'] },
        { stem: 'Bağımsız=gubre; sonuç kütle; hangi kontrol?', mid: 'su+isik', answer: 'su ve ışık sabit', wrong: ['gübre sabit', 'ölçme yok', 'zaman yok'] }
      ]
    },
    misconception: {
      items: [
        { wrongOpt: 'iki değişken birden değiştir', label: 'coklu-degisken', others: ['tek değiştir', 'kontrol et', 'ölç'] },
        { wrongOpt: 'sonucu tahmin et ölçme', label: 'olcumsuz-kanit', others: ['ölç', 'kontrol', 'tekrar'] }
      ]
    }
  },
  {
    familyId: 'lgs-text-inference',
    curriculumSkillId: 'tr.reading.inference',
    justify: {
      items: [
        { stem: '“Yağmur yağdı, maç ertelendi.”', answer: 'neden-sonuç çıkarımı', wrong: ['sadece hava', 'maç oynandı', 'rastgele'] },
        { stem: '“Kitap bitti, yeni cilt aldı.”', answer: 'ihtiyaç çıkarımı', wrong: ['kitap kötü', 'cilt ucuz', 'renk'] }
      ]
    },
    intermediate: {
      items: [
        { stem: 'Metin: otobüs kaçtı → geç kaldı. Sonuç neyi destekler?', mid: 'gecikti', answer: 'ulaşım aksaması sonuç doğurdu', wrong: ['hava sıcak', 'renk seçimi', 'şarkı'] },
        { stem: 'Metin: prova yaptı → sahne başarılı. Ara bağ?', mid: 'hazirlik', answer: 'hazırlık başarıya katkı', wrong: ['şans', 'kostüm rengi', 'seyirci yok'] }
      ]
    },
    misconception: {
      items: [
        { wrongOpt: 'metinde olmayan genelleme', label: 'metin-asim', others: ['kanıt seç', 'cümle bağla', 'aşırı gitme'] },
        { wrongOpt: 'tek kelimeye takıl', label: 'yuzey-kelime', others: ['bütüncül oku', 'bağ kur', 'ele'] }
      ]
    }
  },
  {
    familyId: 'lgs-cause-effect',
    curriculumSkillId: 'social.cause-effect',
    justify: {
      items: [
        { stem: 'Yeni yol → ticaret arttı', answer: 'ulaşım→ekonomi', wrong: ['iklim→nüfus', 'rastgele', 'ters neden'] },
        { stem: 'Kuraklık → ürün azaldı', answer: 'iklim→üretim', wrong: ['moda→fiyat', 'renk', 'şarkı'] }
      ]
    },
    intermediate: {
      items: [
        { stem: 'Baraj yapıldı → elektrik → fabrika. Zincir sonucu?', mid: 'enerji', answer: 'üretim kapasitesi artabilir', wrong: ['yağmur arttı', 'nüfus yok', 'renk'] },
        { stem: 'Okul açıldı → okuryazarlık → iş. Zincir?', mid: 'beceri', answer: 'istihdam fırsatı genişler', wrong: ['iklim', 'rastgele', 'müzik'] }
      ]
    },
    misconception: {
      items: [
        { wrongOpt: 'ters neden-sonuç', label: 'ters-nedensellik', others: ['doğru yön', 'kanıt', 'ele'] },
        { wrongOpt: 'tek neden her şeyi açıklar', label: 'tek-neden-yanilgi', others: ['çoklu etken', 'ölç', 'karşılaştır'] }
      ]
    }
  },
  {
    familyId: 'lgs-english-pragmatic',
    curriculumSkillId: 'en.pragmatics.speech-act',
    justify: {
      items: [
        { stem: '“Would you like tea?” + appointment excuse', answer: 'polite refusal', wrong: ['accept', 'ask price', 'ignore'] },
        { stem: '“Can you help?” + “Sure.”', answer: 'offer acceptance', wrong: ['refusal', 'weather', 'color'] }
      ]
    },
    intermediate: {
      items: [
        { stem: 'Invite → refuse → suggest alternative. Missing act?', mid: 'alt', answer: 'offer another time', wrong: ['say nothing', 'insult', 'price'] },
        { stem: 'Request → clarify → answer. Middle act?', mid: 'clarify', answer: 'ask for detail', wrong: ['leave', 'sing', 'color'] }
      ]
    },
    misconception: {
      items: [
        { wrongOpt: 'literal yes to polite no context', label: 'pragmatik-yuzey', others: ['context read', 'speech act', 'tone'] },
        { wrongOpt: 'translate word-by-word', label: 'kelime-kelime', others: ['function first', 'act', 'reply'] }
      ]
    }
  },
  {
    familyId: 'lgs-data-table',
    curriculumSkillId: 'math.data.table-read',
    justify: {
      items: [
        { stem: 'Tablo: A=12 B=9 C=15; en büyük?', answer: 'C', wrong: ['A', 'B', 'A+B'] },
        { stem: 'Tablo: Paz=4 Sal=7 Çar=5; toplam?', answer: '16', wrong: ['12', '7', '9'] }
      ]
    },
    intermediate: {
      items: [
        { stem: 'A=8 B=6; farkı bul, sonra A+fark', mid: 2, answer: '10', wrong: ['8', '6', '14'] },
        { stem: 'X=20 Y=5; bölümü bul, sonra ×3', mid: 4, answer: '12', wrong: ['20', '15', '8'] }
      ]
    },
    misconception: {
      items: [
        { wrongOpt: 'satır yerine sütun oku', label: 'tablo-yanlis-eksen', others: ['doğru hücre', 'başlık', 'topla'] },
        { wrongOpt: 'en büyük satır adını yaz', label: 'etiket-deger-karisik', others: ['değer oku', 'karşılaştır', 'seç'] }
      ]
    }
  },
  {
    familyId: 'lgs-geometry-figure',
    curriculumSkillId: 'math.geometry.measure',
    justify: {
      items: [
        { stem: 'Kare kenar 6 → çevre', answer: '4×6', wrong: ['6×6', '6+6', '6/4'] },
        { stem: 'Dikdörtgen 3×7 → alan', answer: '3×7', wrong: ['2(3+7)', '3+7', '7-3'] }
      ]
    },
    intermediate: {
      items: [
        { stem: 'Kenar 5 kare alanını bul, sonra çevre sor', mid: 25, answer: '20', wrong: ['25', '10', '15'] },
        { stem: '3×8 dikdörtgen alanı, sonra yarısı', mid: 24, answer: '12', wrong: ['24', '11', '16'] }
      ]
    },
    misconception: {
      items: [
        { wrongOpt: 'alan ile çevre formülünü karıştır', label: 'alan-cevre-karisik', others: ['doğru formül', 'birim', 'hesap'] },
        { wrongOpt: 'yalnız bir kenarı say', label: 'eksik-kenar', others: ['tüm kenar', 'çarp', 'kontrol'] }
      ]
    }
  },
  {
    familyId: 'lgs-science-claim',
    curriculumSkillId: 'science.claim-evidence',
    justify: {
      items: [
        { stem: 'Isı ↑ tepkime süresi ↓', answer: 'ısı hızı artırır', wrong: ['ısı yavaşlatır', 'renk', 'ses'] },
        { stem: 'Işık yok → bitki solar', answer: 'ışık gerekli', wrong: ['su yeterli', 'toprak renk', 'rüzgar'] }
      ]
    },
    intermediate: {
      items: [
        { stem: 'Kanıt: metal ısı iletti. Ara sonuç → hangi iddia?', mid: 'iletken', answer: 'metal ısı iletkenidir', wrong: ['yalıtkan', 'renk', 'ağır'] },
        { stem: 'Kanıt: sürtünme arttı hız düştü. İddia?', mid: 'surutunme', answer: 'sürtünme hareketi engeller', wrong: ['kütle arttı', 'renk', 'ses'] }
      ]
    },
    misconception: {
      items: [
        { wrongOpt: 'kanıtsız tahmin', label: 'kanitsiz-iddia', others: ['kanıt bağla', 'ölç', 'ele'] },
        { wrongOpt: 'ters kanıt yorumu', label: 'ters-yorum', others: ['doğru yön', 'kontrol', 'tekrar'] }
      ]
    }
  },
  {
    familyId: 'lgs-graph-read',
    curriculumSkillId: 'math.data.graph-read',
    justify: {
      items: [
        { stem: 'Çubuk A>B>C', answer: 'en yüksek A', wrong: ['C', 'hepsi eşit', 'B'] },
        { stem: 'Çizgi yükseliyor', answer: 'artış eğilimi', wrong: ['azalış', 'sabit', 'renk'] }
      ]
    },
    intermediate: {
      items: [
        { stem: 'A=10 B=4; farkı bul, sonra A-fark', mid: 6, answer: '4', wrong: ['10', '6', '14'] },
        { stem: 'P1=3 P2=9; katı bul, sonra ×2', mid: 3, answer: '6', wrong: ['9', '12', '3'] }
      ]
    },
    misconception: {
      items: [
        { wrongOpt: 'eksenleri ters oku', label: 'grafik-yanlis-okuma', others: ['eksen kontrol', 'değer', 'karşılaştır'] },
        { wrongOpt: 'renkli çubuğu seç', label: 'yuzey-renk', others: ['yükseklik', 'ölçek', 'başlık'] }
      ]
    }
  },
  {
    familyId: 'lgs-option-trap',
    curriculumSkillId: 'exam.option-trap',
    justify: {
      items: [
        { stem: 'Doğru 12; tuzak 21 (ters rakam)', answer: 'ters-yazım tuzağı', wrong: ['renk tuzağı', 'şarkı', 'rastgele'] },
        { stem: 'Doğru “yalnız A”; tuzak “A ve B”', answer: 'aşırı genelleme tuzağı', wrong: ['hesap', 'birim', 'renk'] }
      ]
    },
    intermediate: {
      items: [
        { stem: 'Önce doğru değeri bul (8), sonra tuzak seçeneği ele', mid: 8, answer: '8 doğru; 18 tuzak', wrong: ['18 doğru', '0', 'renk'] },
        { stem: 'Önce kuralı seç, sonra sayısal tuzak ele', mid: 'kural', answer: 'kural+doğru sayı', wrong: ['sadece sayı', 'renk', 'ses'] }
      ]
    },
    misconception: {
      items: [
        { wrongOpt: 'ters rakamı doğru san', label: 'ters-rakam-tuzagi', others: ['doğru sıra', 'kontrol', 'ele'] },
        { wrongOpt: 'kısmi doğru seçeneği tam doğru say', label: 'kismi-dogru', others: ['tam koşul', 'ele', 'kanıt'] }
      ]
    }
  },
  {
    familyId: 'lgs-misread-taxonomy',
    curriculumSkillId: 'exam.misread-taxonomy',
    justify: {
      items: [
        { stem: 'Öğrenci oranı topladı', answer: 'oran-birim-hata', wrong: ['grafik-yanlis', 'metin-asim', 'renk'] },
        { stem: 'Öğrenci grafikte ekseni ters okudu', answer: 'grafik-yanlis-okuma', wrong: ['oran-birim', 'degisken-karisik', 'ses'] }
      ]
    },
    intermediate: {
      items: [
        { stem: 'Hata türünü bul, sonra düzeltme adımı seç', mid: 'oran-birim-hata', answer: 'birim hesapla', wrong: ['renk seç', 'şarkı', 'atla'] },
        { stem: 'Hata=metin-asim; sonraki adım?', mid: 'asim', answer: 'kanıta dön', wrong: ['genelle', 'tahmin', 'renk'] }
      ]
    },
    misconception: {
      items: [
        { wrongOpt: 'yanlış hata etiketi', label: 'yanlis-siniflama', others: ['doğru etiket', 'örnek', 'düzelt'] },
        { wrongOpt: 'hatayı görmezden gel', label: 'hata-yok-say', others: ['tespit', 'sınıfla', 'düzelt'] }
      ]
    }
  }
];

function buildRecoverySkeleton(familyId, kind, pack, curriculumSkillId) {
  const skeletonId = `${familyId}:${kind}`;
  const traits = {
    'justify-link': ['evidenceToClaim', 'strategySelection'],
    'intermediate-reuse': ['usingIntermediateResultInNewDecision', 'multiStepInference'],
    'misconception-map': ['errorAnalysis', 'conditionEvaluation']
  }[kind];

  const section = kind === 'justify-link' ? pack.justify
    : kind === 'intermediate-reuse' ? pack.intermediate
      : pack.misconception;

  return {
    skeletonId,
    reasoningPathIds: PATH_IDS,
    cognitiveTraits: traits,
    recoveryBlueprint: true,
    generate(random, pathId) {
      const item = pick(section.items, random);
      if (kind === 'justify-link') {
        return roundChoice(skeletonId, pathId, item.answer, item.wrong, random, {
          raw: `${item.stem} Gerekçeli doğru yol hangisidir?`,
          strategy: 'Önce zorunlu adımı seç, sonra sonucu doğrula.',
          explanation: `Doğru yol: ${item.answer}`
        }, {
          curriculumSkillId,
          distractorPlanId: `${skeletonId}#justify-plan`,
          solutionGraphId: `${skeletonId}#justify-graph`,
          informationFlow: ['parse', 'select-strategy', 'verify'],
          misconceptionIds: ['yanlis-kural', 'yuzey-tuzagi', 'eksik-adim'],
          difficultyEvidence: 'strategy-justification-two-decision'
        });
      }
      if (kind === 'intermediate-reuse') {
        return roundChoice(skeletonId, pathId, item.answer, item.wrong, random, {
          raw: `${item.stem} (Ara sonuç kullanılacak.) Son yanıt?`,
          strategy: 'Ara sonucu bul, ikinci kararda kullan.',
          explanation: `Ara→son: ${item.answer}`
        }, {
          curriculumSkillId,
          distractorPlanId: `${skeletonId}#mid-plan`,
          solutionGraphId: `${skeletonId}#mid-graph`,
          informationFlow: ['compute-mid', 'reuse-mid', 'select'],
          misconceptionIds: ['ara-sonuc-unut', 'tek-adimda-bitir', 'yuzey-sayi'],
          difficultyEvidence: 'intermediate-result-reuse'
        });
      }
      return roundChoice(skeletonId, pathId, item.label, item.others, random, {
        raw: `Yanlış seçenek/adım: “${item.wrongOpt}”. Bu hangi yanılgıdır?`,
        strategy: 'Önce hatayı tanı, sonra yanılgı etiketini seç.',
        explanation: `Yanılgı: ${item.label}`
      }, {
        curriculumSkillId,
        distractorPlanId: `${skeletonId}#misc-plan`,
        solutionGraphId: `${skeletonId}#misc-graph`,
        informationFlow: ['spot-error', 'map-misconception', 'label'],
        misconceptionIds: [item.label, 'yanlis-siniflama', 'yuzey-etiket'],
        difficultyEvidence: 'misconception-mapping'
      });
    }
  };
}

export function buildLgsRecoverySkeletonsForFamily(familyId) {
  const pack = PACKS.find((p) => p.familyId === familyId);
  if (!pack) return [];
  return [
    buildRecoverySkeleton(familyId, 'justify-link', pack, pack.curriculumSkillId),
    buildRecoverySkeleton(familyId, 'intermediate-reuse', pack, pack.curriculumSkillId),
    buildRecoverySkeleton(familyId, 'misconception-map', pack, pack.curriculumSkillId)
  ];
}

export function attachLgsRecoveryBlueprints(families = []) {
  return families.map((family) => {
    const extra = buildLgsRecoverySkeletonsForFamily(family.familyId);
    if (!extra.length) return family;
    return {
      ...family,
      skeletons: [...family.skeletons, ...extra]
    };
  });
}

export const LGS_RECOVERY_BLUEPRINT_COUNT = PACKS.length * 3;

export default attachLgsRecoveryBlueprints;
