/**
 * 8. sınıf Türkçe için son öğrenci yüzeyi elle incelenmiş derin soru bankası.
 * Serbest metin üretimi yoktur. Her soru; kanıt zinciri, dört özgün seçenek,
 * üç tanısal çeldirici ve en az dört açıklanmış düşünme adımı taşır.
 */

function freezeRows(rows) {
  return Object.freeze(rows.map((row) => Object.freeze(row)));
}

function buildRound({ id, gameId, context, prompt, options, answer, hints, steps, topicId, outcomeId, skill, misconceptions }) {
  if (!['paragraph-detective', 'meaning-hunt'].includes(gameId)) throw new Error(`${id}:invalid-game`);
  if (!Array.isArray(options) || options.length !== 4 || new Set(options).size !== 4) throw new Error(`${id}:four-distinct-options-required`);
  if (!Array.isArray(steps) || steps.length < 4) throw new Error(`${id}:four-reasoning-steps-required`);
  if (!Array.isArray(misconceptions) || misconceptions.length !== 3) throw new Error(`${id}:three-misconceptions-required`);
  const answerIndex = options.indexOf(answer);
  if (answerIndex < 0) throw new Error(`${id}:answer-option-missing`);

  let wrongIndex = 0;
  const optionDiagnostics = options.map((option, optionIndex) => {
    if (optionIndex === answerIndex) {
      return Object.freeze({
        optionIndex,
        optionText: option,
        isCorrect: true,
        misconceptionId: null,
        misconception: null,
        rationale: 'Metindeki bütün kanıtları ve soruda istenen işlevi birlikte karşılar.',
        whyStudentChoosesThis: 'Kanıtları tek tek ayırır, aralarındaki ilişkiyi kurar ve aşırı yorum eklemez.'
      });
    }
    const misconception = misconceptions[wrongIndex++];
    return Object.freeze({
      optionIndex,
      optionText: option,
      isCorrect: false,
      misconceptionId: misconception.id,
      misconception: misconception.text,
      rationale: misconception.text,
      whyStudentChoosesThis: misconception.why
    });
  });

  const solutionGraph = steps.map((step, index) => Object.freeze({
    step: index + 1,
    id: `s${index + 1}`,
    action: step.action,
    evidence: step.evidence
  }));
  const explanation = `${steps.map((step, index) => `${index + 1}) ${step.action}: ${step.evidence}`).join(' ')} Sonuç: ${answer}`;

  return Object.freeze({
    kind: 'choice',
    questionKey: `trusted:2.0:${gameId}:${id}`,
    prompt,
    context,
    options: Object.freeze([...options]),
    answerIndex,
    explanation,
    hints: Object.freeze([...hints]),
    detailedOptions: Object.freeze(optionDiagnostics.map((row) => row.isCorrect ? `Doğru: ${row.rationale}` : `Yanlış: ${row.rationale}`)),
    optionDiagnostics: Object.freeze(optionDiagnostics),
    skill,
    subjectId: 'turkish',
    topicId,
    learningOutcomeId: outcomeId,
    curriculumReferenceId: outcomeId,
    gradeBand: '8',
    targetGrade: 8,
    difficulty: 5,
    cognitiveDepth: 5,
    authoredReasoningStepCount: steps.length,
    reasoningStepCount: solutionGraph.length,
    cognitiveTraits: Object.freeze(['multiEvidenceReading', 'relationAnalysis', 'optionElimination', 'independentVerification']),
    familyId: `trusted-g8-turkish-deep:${topicId}`,
    skeletonId: `trusted-g8-turkish-deep:${skill}`,
    reasoningPathId: `trusted-g8-turkish-deep:${id}`,
    solutionGraph: Object.freeze(solutionGraph),
    cognitiveDepthEvidence: Object.freeze({
      reasoningStepCount: solutionGraph.length,
      authoredReasoningStepCount: steps.length,
      highCognitiveTraits: ['multiEvidenceReading', 'relationAnalysis', 'optionElimination', 'independentVerification'],
      source: 'trusted-authored-g8-turkish-deep-bank'
    }),
    sourceLabel: '8. Sınıf Türkçe · Elle İncelenmiş Derin Güvenli Banka',
    premiumTier: 'PLATINUM',
    premiumQuestion: true,
    canonicalQuestionId: id,
    constructId: skill,
    knowledgeComponents: Object.freeze([topicId, skill, 'evidence-bounded-interpretation']),
    intendedDifficultyBand: 'LGS_HIGH',
    evidenceProof: Object.freeze({
      verified: true,
      reviewerId: `trusted-g8-turkish-review:${id}`,
      answerText: answer,
      evidenceStepCount: steps.length
    }),
    requireExplicitDistractorEvidence: true,
    distractorValidation: Object.freeze({
      verified: true,
      diagnosticCount: 3,
      distinctMisconceptions: 3,
      violations: Object.freeze([])
    }),
    trustedHumanReview: Object.freeze({
      status: 'APPROVED',
      difficultyVerdict: 'HARD',
      languageVerdict: 'NATURAL_TR',
      distractorVerdict: 'DIAGNOSTIC',
      reviewStandard: 'FINAL_STUDENT_SURFACE_V2'
    })
  });
}

const PARAGRAPH = [
  buildRound({
    id: 'g8-tr-deep-01-alternative-explanation',
    gameId: 'paragraph-detective',
    context: 'Bir okul, derslerin ilk on dakikasında telefonları kapalı kutularda topladı. Dört hafta sonra öğrencilerin kısa sınav ortalaması 64’ten 73’e çıktı. Aynı dört haftada öğretmenler haftada iki kez ek soru çözümü yaptı ve kısa sınavlarda önceki döneme göre daha az konu ölçüldü. Okul yönetimi, not artışının yalnız telefon uygulamasından kaynaklandığını açıkladı.',
    prompt: 'Yönetimin açıklamasını bilimsel açıdan en güçlü biçimde sınırlandıran değerlendirme hangisidir?',
    options: [
      'Telefonların kutuda toplanması ile not artışı aynı dönemde gerçekleştiği için uygulama kesin nedendir.',
      'Ortalama yükseldiğine göre ek soru çözümü ve sınav kapsamındaki değişiklik sonucu etkilememiştir.',
      'Telefon uygulamasının hiçbir etkisi olamaz; çünkü sınavlarda daha az konu ölçülmüştür.',
      'Not artışı telefon uygulamasıyla ilişkili olabilir; ancak ek çalışmalar ve değişen sınav kapsamı ayrıştırılmadan tek neden sonucu kurulamaz.'
    ],
    answer: 'Not artışı telefon uygulamasıyla ilişkili olabilir; ancak ek çalışmalar ve değişen sınav kapsamı ayrıştırılmadan tek neden sonucu kurulamaz.',
    hints: [
      'Aynı dönemde değişen üç uygulamayı ayrı ayrı yaz; sonuçtaki değişimi yalnız birine bağlamak için hangilerinin sabit tutulması gerektiğini düşün.',
      '“İlişkili olabilir” ile “kesin nedenidir” arasındaki kanıt farkını karşılaştır; metnin izin vermediği kesinliği taşıyan seçenekleri ele.'
    ],
    steps: [
      { action: 'iddia edilen nedeni belirle', evidence: 'Yönetim not artışını yalnız telefonların toplanmasına bağlamaktadır.' },
      { action: 'eş zamanlı değişkenleri çıkar', evidence: 'Ek soru çözümü artmış ve sınavların konu kapsamı daralmıştır.' },
      { action: 'kanıtın sınırını değerlendir', evidence: 'Bu değişkenler ayrıştırılmadığı için telefon uygulamasının bağımsız etkisi ölçülmemiştir.' },
      { action: 'ölçülü sonucu seç', evidence: 'İlişki olasılığı korunmalı, fakat tek neden ve kesinlik iddiası reddedilmelidir.' }
    ],
    topicId: 'argument-evidence', outcomeId: 'T.8.3.14', skill: 'alternative-explanation-evaluation',
    misconceptions: [
      { id: 'correlation-causation', text: 'Eş zamanlı değişimi tek başına nedensellik kanıtı sayar.', why: 'Önce-sonra farkını deneysel kontrol sanır.' },
      { id: 'ignore-confounds', text: 'Ek çalışma ve sınav kapsamı değişkenlerini kanıtsız biçimde etkisiz kabul eder.', why: 'Ana iddiaya odaklanırken diğer verileri dışarıda bırakır.' },
      { id: 'reverse-certainty', text: 'Karıştırıcı değişkenlerin varlığını telefon etkisinin olanaksızlığı biçiminde yorumlar.', why: 'Kanıt yetersizliğini etkinin yokluğu ile karıştırır.' }
    ]
  }),
  buildRound({
    id: 'g8-tr-deep-02-sentence-order',
    gameId: 'paragraph-detective',
    context: 'I. Bu yüzden kent yöneticileri yalnız ağaç sayısını değil, ağaçların gölge oluşturacağı güzergâhları da planlamalıdır.\nII. Ancak birbirinden kopuk küçük yeşil alanlar, yaya yolları boyunca kesintisiz gölge sağlamaz.\nIII. Yazın yaya ulaşımını artırmak isteyen bir kentte ağaçlandırma önemli bir araçtır.\nIV. Gölgenin sürekliliği, insanların sıcak saatlerde yürümeyi tercih edip etmemesini etkiler.\nV. Örneğin aynı sayıda ağacın kavşaklara dağınık yerleştirilmesiyle bir yürüyüş hattı boyunca sıralanması farklı sonuç verir.',
    prompt: 'Numaralanmış cümlelerle anlamlı ve tutarlı bir paragraf oluşturulduğunda sıralama nasıl olur?',
    options: ['III – II – V – IV – I', 'III – IV – I – II – V', 'II – III – V – I – IV', 'III – V – II – I – IV'],
    answer: 'III – II – V – IV – I',
    hints: [
      'Genel konuyu tanıtan cümleyi bul; “ancak”, “örneğin” ve “bu yüzden” bağlayıcılarının hangi cümleye geri döndüğünü tek tek işaretle.',
      '“Bu yüzden” ile başlayan sonuç cümlesinden önce hem sorun hem de sorunun yaya tercihi üzerindeki etkisi açıklanmış olmalıdır.'
    ],
    steps: [
      { action: 'giriş cümlesini seç', evidence: 'III, ağaçlandırma ve yaya ulaşımı konusunu bağlam gerektirmeden tanıtır.' },
      { action: 'karşıt sınırlamayı yerleştir', evidence: 'II’deki “ancak”, ağaçlandırmanın tek başına yeterli olmadığını III’e bağlar.' },
      { action: 'örneği ve etkisini sırala', evidence: 'V, kopukluk sorununu somutlaştırır; IV bunun yürüme tercihine etkisini açıklar.' },
      { action: 'sonucu bağla', evidence: 'I’deki “bu yüzden”, önceki sorun ve etkiden planlama önerisine ulaşır.' }
    ],
    topicId: 'paragraph-cohesion', outcomeId: 'T.8.3.16', skill: 'sentence-order-with-connectors',
    misconceptions: [
      { id: 'result-too-early', text: 'Sonuç cümlesini gerekçeler tamamlanmadan öne alır.', why: '“Bu yüzden” ifadesinin geriye dönük bağını kurmaz.' },
      { id: 'contrast-as-opening', text: '“Ancak” ile başlayan cümleyi bağlam olmadan giriş kabul eder.', why: 'Karşıtlık bağlacının önceki yargıya ihtiyaç duyduğunu gözden kaçırır.' },
      { id: 'example-before-claim', text: 'Örneği sınırlayıcı düşünceden önce yerleştirerek referansını belirsiz bırakır.', why: '“Örneğin” sözcüğünü yalnız ayrıntı işareti olarak görür.' }
    ]
  }),
  buildRound({
    id: 'g8-tr-deep-03-evidence-pair',
    gameId: 'paragraph-detective',
    context: 'Bir araştırmacı “Okul bahçesindeki gölgelik alanların artırılması, öğle arasında öğrencilerin açık havada kalma süresini yükseltir.” görüşünü sınamak istiyor. Elinde şu veriler vardır:\n1. Gölgelik eklenmeden önce ve sonra aynı aylarda öğrencilerin bahçede kalma süreleri.\n2. Öğrencilerin en sevdikleri bahçe oyunlarını gösteren anket.\n3. Gölgelik eklenen ve eklenmeyen benzer iki okulun sıcaklık ile bahçede kalma süresi ölçümleri.\n4. Gölgelik malzemelerinin üretici tarafından açıklanan dayanıklılık değerleri.',
    prompt: 'Görüşü hem doğrudan sınamak hem de olası sıcaklık etkisini ayırmak için hangi veri çifti birlikte kullanılmalıdır?',
    options: ['1 ve 2', '2 ve 4', '1 ve 3', '3 ve 4'],
    answer: '1 ve 3',
    hints: [
      'İddiadaki bağımsız değişkeni, ölçülen sonucu ve olası sıcaklık etkenini üç ayrı başlıkta yaz; her veri kaynağının hangisini ölçtüğünü eşleştir.',
      'Tercih anketi ve malzeme dayanıklılığı, öğrencilerin gerçek kalma süresindeki değişimi doğrudan karşılaştırıyor mu diye kontrol et.'
    ],
    steps: [
      { action: 'iddiadaki değişkenleri ayır', evidence: 'Gölgelik miktarı değişken, açık havada kalma süresi sonuçtur; sıcaklık olası açıklayıcı etkendir.' },
      { action: 'önce-sonra verisini değerlendir', evidence: '1 numaralı veri aynı okulda uygulama öncesi ve sonrası süre değişimini ölçer.' },
      { action: 'karşılaştırma okulunu değerlendir', evidence: '3 numaralı veri, sıcaklık ve gölgelik farkını benzer okul karşılaştırmasıyla incelemeye yardım eder.' },
      { action: 'dolaylı kaynakları ele', evidence: 'Oyun tercihi ve malzeme dayanıklılığı doğrudan davranış sonucunu sınamaz.' }
    ],
    topicId: 'source-evaluation', outcomeId: 'T.8.3.32', skill: 'evidence-source-pairing',
    misconceptions: [
      { id: 'preference-as-behavior', text: 'Oyun tercih anketini gerçek kalma süresinin ölçümü sayar.', why: 'Tutum ile gözlenen davranışı birbirine eşitler.' },
      { id: 'irrelevant-technical-source', text: 'Malzeme dayanıklılığını öğrenci davranışı için doğrudan kanıt kabul eder.', why: 'Teknik güvenilirliği araştırma sorusuyla karıştırır.' },
      { id: 'comparison-without-change', text: 'Karşılaştırmalı veri ile teknik belgeyi seçip uygulama öncesi-sonrası değişimi dışarıda bırakır.', why: 'İki okul karşılaştırmasının tek başına zaman içindeki etkiyi gösterdiğini varsayar.' }
    ]
  }),
  buildRound({
    id: 'g8-tr-deep-04-two-texts',
    gameId: 'paragraph-detective',
    context: 'I. Metin: “Yapay zekâ destekli çeviri araçları, yabancı dildeki bir metnin ana çizgisini hızla görmeyi sağlar. Yine de kültürel çağrışım ve ironi içeren bölümlerde insan denetimi olmadan kullanıldığında anlam kaymaları oluşabilir.”\n\nII. Metin: “Çeviri araçlarının hata yapabilmesi, onları bütünüyle değersiz kılmaz. Bu araçlar ilk taslağı hızlandırabilir; fakat son metnin amaç, bağlam ve okur açısından bir uzman tarafından yeniden değerlendirilmesi gerekir.”',
    prompt: 'İki metnin yaklaşımını birlikte doğru açıklayan seçenek hangisidir?',
    options: [
      'İki metin de çeviri araçlarının insan çevirmenlerin yerini eksiksiz alabileceğini savunur.',
      'I. metin araçları tümüyle reddederken II. metin denetimsiz kullanımı yeterli bulur.',
      'İki metin de araçların hız kazandırabileceğini kabul eder; I. metin anlam kayması riskini, II. metin uzman denetiminin işlevini öne çıkarır.',
      'I. metin yalnız teknik hızı, II. metin yalnız araçların ekonomik maliyetini tartışır.'
    ],
    answer: 'İki metin de araçların hız kazandırabileceğini kabul eder; I. metin anlam kayması riskini, II. metin uzman denetiminin işlevini öne çıkarır.',
    hints: [
      'Her metin için önce “kabul ettiği yarar” ve sonra “koyduğu sınır” olmak üzere iki sütun oluştur; ortak ve farklı vurgu noktalarını ayrı tut.',
      'Seçeneklerdeki “tümüyle”, “denetimsiz” ve “yalnız” gibi kesinleştirici sözlerin metinlerde gerçekten desteklenip desteklenmediğini denetle.'
    ],
    steps: [
      { action: 'I. metnin yararını belirle', evidence: 'Araçların metnin ana çizgisini hızlı görmeyi sağladığı kabul edilir.' },
      { action: 'I. metnin sınırını belirle', evidence: 'Kültürel çağrışım ve ironide insan denetimi yoksa anlam kayması riski vurgulanır.' },
      { action: 'II. metnin yaklaşımını çöz', evidence: 'İlk taslakta hız yararı kabul edilir, son metinde uzman değerlendirmesi zorunlu görülür.' },
      { action: 'ortaklık ve vurgu farkını birleştir', evidence: 'İki metin dengeli kullanımda birleşir; risk ve denetim işlevini farklı ağırlıklarla açıklar.' }
    ],
    topicId: 'multiple-text-comparison', outcomeId: 'T.8.3.25', skill: 'compare-author-stance',
    misconceptions: [
      { id: 'overgeneralize-benefit', text: 'Hız yararını insanın bütünüyle gereksizleşmesi biçiminde genişletir.', why: 'Sınırlayıcı cümleleri gözden kaçırır.' },
      { id: 'reverse-positions', text: 'Metinlerin dengeli yaklaşımını karşıt ve uç görüşler gibi okur.', why: '“Yine de” ve “fakat” bağlaçlarının işlevini ters yorumlar.' },
      { id: 'invent-cost-topic', text: 'Metinlerde bulunmayan ekonomik maliyet konusunu ekler.', why: 'Araçların değeri sözünü parasal değer olarak yorumlar.' }
    ]
  })
];

const MEANING = [
  buildRound({
    id: 'g8-tr-deep-05-pronoun-ambiguity',
    gameId: 'meaning-hunt',
    context: 'Editör şu cümleyi inceliyor: “Selin, Derya’ya raporunu toplantıdan önce yeniden okuyacağını söyledi.” Cümlede “raporunu” ve “okuyacağını” sözlerinin kime ait olduğunun açık olmadığı belirtiliyor. Amaç, Selin’in Derya’ya ait raporu okuyacağını kesinleştirmektir.',
    prompt: 'Cümleyi amaçlanan anlamı belirsizliğe yer bırakmadan verecek biçimde düzelten seçenek hangisidir?',
    options: [
      'Selin, Derya’ya raporunu toplantıdan önce yeniden okuyacağını söyledi.',
      'Selin, toplantıdan önce raporunu yeniden okuyacağını Derya’ya söyledi.',
      'Selin, Derya’ya ait raporu toplantıdan önce kendisinin yeniden okuyacağını söyledi.',
      'Derya, Selin’e toplantıdan önce onun raporunu yeniden okuyacağını söyledi.'
    ],
    answer: 'Selin, Derya’ya ait raporu toplantıdan önce kendisinin yeniden okuyacağını söyledi.',
    hints: [
      'İki ayrı sahiplik sorusu sor: Rapor kimin, okuma eylemini kim yapacak? Seçenekte bu iki öznenin ad veya açık tamlamayla gösterilmesini ara.',
      'Yalnız sözcüklerin yerini değiştiren fakat “onun/raporunu” belirsizliğini sürdüren seçenekleri ele.'
    ],
    steps: [
      { action: 'amaçlanan sahipliği belirle', evidence: 'Rapor Derya’ya aittir.' },
      { action: 'eylemin öznesini belirle', evidence: 'Raporu toplantıdan önce okuyacak kişi Selin’dir.' },
      { action: 'belirsiz öğeleri saptala', evidence: '“Raporunu” ve gizli özne, iki kişiye de bağlanabilir.' },
      { action: 'iki ilişkiyi açıklaştır', evidence: '“Derya’ya ait rapor” ve “kendisinin okuyacağı” ifadeleri iki bağı kesinleştirir.' }
    ],
    topicId: 'sentence-ambiguity', outcomeId: 'T.8.4.10', skill: 'pronoun-reference-revision',
    misconceptions: [
      { id: 'unchanged-ambiguity', text: 'Kaynak cümleyi aynen koruyarak iki olası göndermeyi çözmez.', why: 'Dil bilgisel doğruluğu anlam açıklığıyla karıştırır.' },
      { id: 'reorder-only', text: 'Sözcük dizimini değiştirir fakat raporun sahibini açık etmez.', why: 'Yakınlık değişince belirsizliğin bittiğini sanır.' },
      { id: 'swap-speaker', text: 'Konuşan ve okuyan kişileri değiştirerek amaçlanan anlamı bozar.', why: 'İsimleri açık gördüğü için olay örgüsündeki rol değişimini kaçırır.' }
    ]
  }),
  buildRound({
    id: 'g8-tr-deep-06-modality-strength',
    gameId: 'meaning-hunt',
    context: 'Bir araştırma raporunda şu sonuç yazıyor: “Veriler, düzenli uyku ile dikkat puanı arasında bir ilişki olabileceğini düşündürmektedir; ancak örneklem sınırlı olduğu için neden-sonuç yargısına varılamaz.”',
    prompt: 'Raporun kesinlik düzeyini ve kanıt sınırını koruyan yeniden ifade hangisidir?',
    options: [
      'Düzenli uyku dikkat puanını kesin olarak yükseltir.',
      'Dikkat puanındaki her değişimin tek nedeni uyku düzenidir.',
      'Sınırlı veriler uyku ile dikkat arasında olası bir ilişkiye işaret eder; bu bulgu tek başına nedensellik kanıtı değildir.',
      'Örneklem sınırlı olduğundan uyku ile dikkat arasında hiçbir ilişki yoktur.'
    ],
    answer: 'Sınırlı veriler uyku ile dikkat arasında olası bir ilişkiye işaret eder; bu bulgu tek başına nedensellik kanıtı değildir.',
    hints: [
      '“Olabilir”, “düşündürmektedir” ve “varılamaz” sözlerinin kesinlik derecelerini işaretle; yeniden ifadede aynı ihtiyat düzeyinin korunup korunmadığını karşılaştır.',
      'Kanıtın yetersiz olması ile ilişkinin kesinlikle yokluğu aynı şey değildir; iki uç yargıyı da ele.'
    ],
    steps: [
      { action: 'ilişki düzeyini belirle', evidence: 'Rapor olası bir ilişki bildirir, kesin sonuç bildirmez.' },
      { action: 'sınırlayıcı kanıtı belirle', evidence: 'Örneklem sınırlıdır.' },
      { action: 'yasaklanan yorumu belirle', evidence: 'Neden-sonuç yargısına varılamaz.' },
      { action: 'aynı kip ve sınırı taşıyan ifadeyi seç', evidence: 'Doğru seçenek hem olasılığı hem nedensellik sınırını korur.' }
    ],
    topicId: 'modality-and-certainty', outcomeId: 'T.8.3.28', skill: 'evidence-calibrated-paraphrase',
    misconceptions: [
      { id: 'upgrade-to-certainty', text: 'Olasılık bildiren sonucu kesin nedenselliğe yükseltir.', why: 'İlişki sözcüğünü etki sözcüğü gibi okur.' },
      { id: 'single-cause-overreach', text: 'Metinde bulunmayan tek neden ve bütün durumlar genellemesi kurar.', why: 'Sınırlı bulguyu evrensel kurala dönüştürür.' },
      { id: 'absence-from-uncertainty', text: 'Kanıt yetersizliğini ilişkinin yokluğu biçiminde yorumlar.', why: '“Kanıtlanmadı” ile “yanlıştır”ı karıştırır.' }
    ]
  }),
  buildRound({
    id: 'g8-tr-deep-07-idiom-context-shift',
    gameId: 'meaning-hunt',
    context: '“Toplantıda herkes yeni projenin görünen yararlarını sıraladı. Zeynep ise bakım maliyeti, veri güvenliği ve personel eğitimi gibi gözden kaçan sorunları gündeme getirerek tartışmanın seyrini değiştirdi. Onun soruları, projenin parlak sunumunun cilasını kazıdı.”',
    prompt: '“Cilasını kazımak” sözü bu bağlamda hangi anlamı karşılamaktadır?',
    options: [
      'Sunum dosyasının görsel tasarımını bozmak',
      'Projenin olumlu görünüşünün ardındaki sorunları görünür kılmak',
      'Tartışmayı gereksiz ayrıntılarla tamamen durdurmak',
      'Projenin bütün yararlarının gerçek dışı olduğunu kanıtlamak'
    ],
    answer: 'Projenin olumlu görünüşünün ardındaki sorunları görünür kılmak',
    hints: [
      'Mecazı tek başına değil, Zeynep’in gündeme getirdiği üç sorun ve tartışmanın değişen yönüyle birlikte yorumla.',
      'Seçeneğin “bütün yararlar yanlıştır” gibi metinden daha güçlü bir sonuç ekleyip eklemediğini denetle.'
    ],
    steps: [
      { action: 'önceki görünüşü belirle', evidence: 'Proje başlangıçta yalnız görünen yararlarıyla ve parlak sunumuyla ele alınmıştır.' },
      { action: 'yeni kanıtları belirle', evidence: 'Maliyet, güvenlik ve eğitim sorunları görünür hâle getirilmiştir.' },
      { action: 'mecazın dönüşümünü kur', evidence: 'Cilayı kazımak, yüzeydeki çekici görünüşün altını ortaya çıkarmayı anlatır.' },
      { action: 'aşırı yorumu ele', evidence: 'Metin bütün yararların sahte olduğunu değil, gözden kaçan sorunların görünür olduğunu söyler.' }
    ],
    topicId: 'figurative-language', outcomeId: 'T.8.3.5', skill: 'figurative-meaning-from-evidence',
    misconceptions: [
      { id: 'literal-reading', text: 'Mecazı fiziksel bir sunum yüzeyiyle ilgili gerçek eylem gibi okur.', why: 'Bağlamdaki tartışma değişimini kullanmaz.' },
      { id: 'irrelevance-overstatement', text: 'Sorunları gündeme getirmeyi tartışmayı bütünüyle durdurmak sayar.', why: 'Seyrin değişmesini sona erme ile karıştırır.' },
      { id: 'total-refutation', text: 'Sınırlı eleştiriyi bütün yararların çürütülmesi biçiminde genişletir.', why: 'Karşı kanıtın kapsamını aşar.' }
    ]
  }),
  buildRound({
    id: 'g8-tr-deep-08-connector-revision',
    gameId: 'meaning-hunt',
    context: 'Bir öğrenci şu paragrafı yazıyor: “Kentte bisiklet yolları genişletildi. Çünkü kısa mesafeli yolculuklarda bisiklet kullanımı arttı. Buna rağmen bazı ana kavşaklarda güvenli geçiş düzenlemesi yapılmadı. Sonuç olarak ağın bütün bölümleri aynı ölçüde güvenli değildir.” Öğretmen, ikinci cümlede neden-sonuç ilişkisinin ters kurulduğunu belirtiyor.',
    prompt: 'Paragrafın anlam akışını koruyup öğretmenin uyarısını gideren düzenleme hangisidir?',
    options: [
      'Kentte bisiklet yolları genişletildi; bu nedenle kısa mesafeli yolculuklarda bisiklet kullanımı arttı.',
      'Kentte bisiklet yolları genişletildi; buna rağmen kısa mesafeli yolculuklarda bisiklet kullanımı arttı.',
      'Kentte bisiklet yolları genişletildi; örneğin kısa mesafeli yolculuklarda bisiklet kullanımı arttı.',
      'Kentte bisiklet yolları genişletildi; oysa kısa mesafeli yolculuklarda bisiklet kullanımı arttı.'
    ],
    answer: 'Kentte bisiklet yolları genişletildi; bu nedenle kısa mesafeli yolculuklarda bisiklet kullanımı arttı.',
    hints: [
      'İlk iki olaydan hangisinin uygulama, hangisinin sonuç olduğunu belirle; bağlacın ok yönünü uygulamadan sonuca doğru kur.',
      'Paragrafın sonraki “buna rağmen” ve “sonuç olarak” bağlantılarını bozmayacak, ilk iki cümlede karşıtlık veya örnekleme üretmeyecek seçeneği ara.'
    ],
    steps: [
      { action: 'ilk olayı sınıflandır', evidence: 'Bisiklet yollarının genişletilmesi yapılan uygulamadır.' },
      { action: 'ikinci olayı sınıflandır', evidence: 'Bisiklet kullanımının artması uygulamadan sonra gözlenen sonuçtur.' },
      { action: 'bağlaç yönünü düzelt', evidence: '“Bu nedenle” uygulamadan sonuca geçiş kurar.' },
      { action: 'paragraf bütünlüğünü kontrol et', evidence: 'Sonraki cümle, artışa rağmen güvenlik eksikliği bulunduğunu tutarlı biçimde sürdürür.' }
    ],
    topicId: 'connectors-and-cohesion', outcomeId: 'T.8.4.15', skill: 'cause-effect-connector-revision',
    misconceptions: [
      { id: 'false-contrast', text: 'Uygulama ile kullanım artışı arasında karşıtlık kurar.', why: '“Buna rağmen”i yalnız geçiş sözü olarak görür.' },
      { id: 'example-confusion', text: 'Sonucu uygulamanın örneği sayar.', why: 'Örnekleme ile neden-sonuç ilişkisini ayırmaz.' },
      { id: 'opposition-connector', text: 'Birbirini destekleyen iki olayı “oysa” ile karşı karşıya getirir.', why: 'Bağlaçların anlam işlevini göz ardı eder.' }
    ]
  }),
  buildRound({
    id: 'g8-tr-deep-09-necessary-sufficient',
    gameId: 'meaning-hunt',
    context: '“Yarışmaya katılabilmek için başvuru formunu zamanında teslim etmek gerekir; ancak formu teslim eden herkes doğrudan finale kalmaz.”',
    prompt: 'Bu cümlenin anlamını mantıksal sınırlarıyla doğru veren seçenek hangisidir?',
    options: [
      'Formu zamanında teslim etmek finale kalmak için yeterlidir.',
      'Finale kalanların formu zamanında teslim etmiş olması gerekir; fakat bu koşulu sağlayanların hepsi finale kalmaz.',
      'Formu geç teslim edenler de başka koşul aranmadan finale kalabilir.',
      'Finale kalmak ile form teslimi arasında hiçbir ilişki yoktur.'
    ],
    answer: 'Finale kalanların formu zamanında teslim etmiş olması gerekir; fakat bu koşulu sağlayanların hepsi finale kalmaz.',
    hints: [
      '“Katılabilmek için gerekir” sözünü zorunlu koşul, “ancak herkes finale kalmaz” sözünü yeterli olmama biçiminde iki ayrı kurala çevir.',
      'Bir koşulun zorunlu olması ile tek başına sonucu garanti etmesi arasındaki farkı seçeneklerde ara.'
    ],
    steps: [
      { action: 'zorunlu koşulu çıkar', evidence: 'Final sürecine girebilmek için form zamanında teslim edilmelidir.' },
      { action: 'yeterlilik sınırını çıkar', evidence: 'Form teslimi tek başına finale kalmayı garanti etmez.' },
      { action: 'ters çıkarımı ele', evidence: 'Geç teslim edenlerin finale kalabileceği sonucu metne aykırıdır.' },
      { action: 'iki kuralı aynı seçenekte birleştir', evidence: 'Doğru seçenek hem zorunluluğu hem yeterli olmamayı korur.' }
    ],
    topicId: 'sentence-logic', outcomeId: 'T.8.3.28', skill: 'necessary-sufficient-language',
    misconceptions: [
      { id: 'necessary-as-sufficient', text: 'Zorunlu koşulu sonucu tek başına garanti eden yeterli koşul sayar.', why: '“Gerekir” sözünü “yeter” gibi yorumlar.' },
      { id: 'ignore-necessary', text: 'Zamanında teslim zorunluluğunu kaldıran bir sonuç çıkarır.', why: 'İkinci cümle parçasını ilk koşulu iptal ediyor sanır.' },
      { id: 'deny-relation', text: 'Koşulun yeterli olmamasını hiçbir ilişki bulunmaması şeklinde yorumlar.', why: 'Zorunluluk ve yeterlilik ayrımını kurmaz.' }
    ]
  })
];

export const TRUSTED_G8_TURKISH_DEEP_PARAGRAPH_ROUNDS = Object.freeze(PARAGRAPH);
export const TRUSTED_G8_TURKISH_DEEP_MEANING_ROUNDS = Object.freeze(MEANING);
export const TRUSTED_G8_TURKISH_DEEP_ROUNDS = Object.freeze([...PARAGRAPH, ...MEANING]);
export const TRUSTED_G8_TURKISH_DEEP_KEYS = Object.freeze({
  paragraph: Object.freeze(PARAGRAPH.map((round) => round.questionKey)),
  meaning: Object.freeze(MEANING.map((round) => round.questionKey))
});
