// V13.5 — Question Factory / Premium Blueprint Gate
//
// Bu katman üreticinin kendi etiketlerine güvenmez. Soru metni, çözüm,
// seçenekler ve çeldirici metadata üzerinden gerçek yayın kararını verir.
// Amaç: “hard” etiketi, dolu field veya benzersiz questionKey yüzünden sahte PASS verilmesini engellemek.

import { hashString } from '../utils.js';

export const QUESTION_FACTORY_VERSION = '13.5.0';

const GENERIC_MISCONCEPTION_RE = /(yaygın bir yanlış çözüm|gerçek bir yanlış çözüm|yanılgı gerekçesi kayıtlı değil|ilgili soru ailesindeki|temsil eder)/i;
const NO_REASONING_RE = /(çıkarım yapmana gerek yok|yalnız uygula|sadece uygula|doğrudan uygula)/i;
const DIRECT_ARITHMETIC_RE = /(?:^|\b)\d+\s*(?:\+|-|×|x|\*|÷|\/)\s*\d+\s*(?:işleminin sonucu kaçtır|sonucu kaçtır|=\s*\?)/i;
const OBVIOUS_PATTERN_RE = /(kural:\s*her terimde\s*\d+\s*(?:ekleniyor|çıkarılıyor)|her terimde\s*\d+\s*(?:ekleniyor|çıkarılıyor).*(?:6\.\s*terim|sıradaki değer|bir sonraki))/i;
const TARGET_REACH_RE = /tüm sayıları birer kez kullanarak hedefe ulaş/i;

function trLower(value = '') {
  return String(value || '').toLocaleLowerCase('tr-TR');
}

function normalizeText(value = '') {
  return trLower(value)
    .replace(/\d+(?:[.,]\d+)?/g, '#')
    .replace(/[“”"'`]/g, '')
    .replace(/\b(?:ali|ayşe|ayse|mehmet|zeynep|ece|mira|lena|defter|kitap|kağıt|kagit|puan|fidan|ürün|urun|katılımcı|katilimci)\b/g, '~')
    .replace(/\s+/g, ' ')
    .trim();
}

function numberTokens(value = '') {
  return [...String(value || '').matchAll(/-?\d+(?:[.,]\d+)?/g)].map((m) => Number(String(m[0]).replace(',', '.'))).filter(Number.isFinite);
}

function parseNumericOption(value) {
  const text = String(value || '').trim().replace(',', '.');
  const m = text.match(/^-?\d+(?:\.\d+)?/);
  if (!m) return null;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : null;
}

function optionTexts(round = {}) {
  return Array.isArray(round.options) ? round.options.map((o) => String(o)) : [];
}

function answerIndexOf(round = {}) {
  if (Number.isInteger(round.answerIndex)) return round.answerIndex;
  const opts = optionTexts(round);
  const raw = round.answerValue ?? round.answer ?? round.correctAnswer;
  return opts.indexOf(String(raw ?? ''));
}

function isGenericMisconception(value) {
  return !value || GENERIC_MISCONCEPTION_RE.test(String(value));
}

function isDirectSingleStepArithmetic(round = {}) {
  const text = `${round.prompt || ''} ${round.context || ''}`;
  if (DIRECT_ARITHMETIC_RE.test(text)) return true;
  const nums = numberTokens(round.prompt || '');
  const hasSingleOperator = /\d+\s*(?:\+|-|×|x|\*|÷|\/)\s*\d+/.test(String(round.prompt || ''));
  if (nums.length === 2 && hasSingleOperator && /kaçtır\??$/i.test(String(round.prompt || '').trim())) return true;
  return false;
}

function isObviousNextTermPattern(round = {}) {
  const text = `${round.prompt || ''} ${round.context || ''}`;
  return OBVIOUS_PATTERN_RE.test(text) || (NO_REASONING_RE.test(text) && /(?:terim|sıradaki|bir sonraki|dizi)/i.test(text));
}

function isRoutineTargetReach(round = {}) {
  const text = `${round.prompt || ''} ${round.context || ''}`;
  return TARGET_REACH_RE.test(text) && !/(koşul|yasak|en az|en çok|kanıtla|hatalı|karşılaştır|neden)/i.test(text);
}

export function detectFakeHardSurface(round = {}, { grade = 0 } = {}) {
  const gradeNum = Number(grade || round.grade || round.targetGrade || 0);
  const violations = [];
  if (gradeNum >= 3 && isDirectSingleStepArithmetic(round)) violations.push('grade3plus_direct_single_step_arithmetic');
  if (gradeNum >= 3 && isObviousNextTermPattern(round)) violations.push('grade3plus_obvious_next_term_pattern');
  if (gradeNum >= 6 && isRoutineTargetReach(round)) violations.push('grade6plus_routine_target_reach');
  if (gradeNum >= 3 && NO_REASONING_RE.test(`${round.prompt || ''} ${round.context || ''}`)) violations.push('grade3plus_no_reasoning_instruction');
  return { ok: violations.length === 0, violations };
}

function inferSequenceStep(round = {}) {
  const nums = numberTokens(`${round.prompt || ''} ${round.explanation || ''}`);
  if (nums.length < 4) return null;
  const diffs = [];
  for (let i = 1; i < Math.min(nums.length, 6); i += 1) diffs.push(nums[i] - nums[i - 1]);
  const counts = new Map();
  for (const d of diffs) counts.set(d, (counts.get(d) || 0) + 1);
  let best = null;
  for (const [d, c] of counts.entries()) {
    if (c >= 2 && d !== 0) best = d;
  }
  return best;
}

function buildNumericDiagnostic({ round, optionText, optionIndex, answerIndex, correctValue, optionValue }) {
  const skeleton = round.skeletonId || round.familyId || 'numeric-question';
  const step = inferSequenceStep(round);
  const diff = optionValue - correctValue;
  let misconceptionId = `${skeleton}:numeric-operation-slip`;
  let misconceptionName = 'İşlem hatası';
  let rationale = `Öğrenci doğru çözüm yolunu başlatıp aritmetik hesapta ${Math.abs(diff)} fark oluşturabilir.`;
  let constructionRule = `correctValue(${correctValue}) + diff(${diff})`;

  if (step && diff === -step) {
    misconceptionId = `${skeleton}:previous-step-as-answer`;
    misconceptionName = 'Bir önceki adımı cevap sanma';
    rationale = 'Öğrenci dizide/işlem zincirinde son adıma kadar ilerlemek yerine bir önceki ara sonucu cevap kabul eder.';
    constructionRule = `correctValue - sequenceStep(${step})`;
  } else if (step && diff === step) {
    misconceptionId = `${skeleton}:extra-step-after-answer`;
    misconceptionName = 'Gereksiz bir adım daha uygulama';
    rationale = 'Öğrenci istenen noktaya ulaştıktan sonra kuralı bir kez daha uygulayarak fazla ilerler.';
    constructionRule = `correctValue + sequenceStep(${step})`;
  } else if (Math.abs(diff) <= 12) {
    misconceptionId = `${skeleton}:small-arithmetic-slip`;
    misconceptionName = 'Küçük aritmetik kaydırma';
    rationale = 'Öğrenci doğru stratejiyi seçse bile elde/ödünç alma veya ara toplamda küçük hesap hatası yapar.';
    constructionRule = `correctValue ± smallSlip(${diff})`;
  } else if (Math.abs(diff) <= Math.max(20, Math.abs(correctValue) * 0.35)) {
    misconceptionId = `${skeleton}:operation-choice-confusion`;
    misconceptionName = 'İşlem seçimini karıştırma';
    rationale = 'Öğrenci bağlamdaki sayıları doğru ayıklar fakat toplama/çıkarma/çarpma sırasını karıştırır.';
    constructionRule = `plausibleWrongOperationResult(${optionValue})`;
  } else {
    misconceptionId = `${skeleton}:implausible-numeric-distractor`;
    misconceptionName = 'Aşırı uzak sayısal çeldirici';
    rationale = 'Bu seçenek doğru çözüm yolundaki makul bir öğrenci hatasına yeterince yakın değildir.';
    constructionRule = `implausibleFarValue(${optionValue})`;
  }

  return {
    optionIndex,
    optionText: String(optionText),
    isCorrect: optionIndex === answerIndex,
    misconceptionId,
    misconceptionName,
    misconception: misconceptionName,
    rationale,
    whyStudentChoosesThis: rationale,
    constructionRule,
    plausibilityScore: misconceptionId.includes('implausible') ? 0.25 : 0.78,
    grammarShape: /^-?\d/.test(String(optionText).trim()) ? 'numeric' : 'text',
    semanticCategory: 'numeric-result'
  };
}

function deriveTextDiagnostic({ round, optionText, optionIndex, answerIndex, detailed }) {
  const skeleton = round.skeletonId || round.familyId || 'text-question';
  const detailRaw = String(detailed || '').trim();
  const fallbackDetail = `Bu seçenek doğru cevaba benzer görünür; ancak soru kökündeki kanıt, ilişki ya da dilbilgisi koşulunu eksik/yanlış yorumlar.`;
  const detail = (!detailRaw || isGenericMisconception(detailRaw)) ? fallbackDetail : detailRaw;
  const low = trLower(`${optionText} ${detail}`);
  let type = 'context-misread';
  if (/(ters|karşıt|zıt|opposite|değil|degil)/i.test(low)) type = 'inversion';
  else if (/(aşırı|her zaman|asla|genelleme|always|never)/i.test(low)) type = 'overgeneralization';
  else if (/(metinde yok|bulunmayan|unsupported|kanıt)/i.test(low)) type = 'unsupported-inference';
  else if (/(sıra|yer|bağlaç|özne|yüklem|grammar|tense|zaman)/i.test(low)) type = 'grammar-shape-confusion';
  return {
    optionIndex,
    optionText: String(optionText),
    isCorrect: optionIndex === answerIndex,
    misconceptionId: `${skeleton}:${type}:${optionIndex}`,
    misconceptionName: type,
    misconception: type,
    rationale: detail,
    whyStudentChoosesThis: detail,
    constructionRule: detail === fallbackDetail ? `inferredTextDistractor:${type}` : `fromDetailedOption:${type}`, 
    plausibilityScore: 0.75,
    grammarShape: /[.!?]$/.test(String(optionText).trim()) ? 'sentence' : 'phrase',
    semanticCategory: type
  };
}

export function buildPremiumDistractorDiagnostics(round = {}) {
  const opts = optionTexts(round);
  const answerIndex = answerIndexOf(round);
  if (round.kind && round.kind !== 'choice') {
    return { ok: true, skipped: true, diagnostics: [], detailedOptions: round.detailedOptions || [], violations: [] };
  }
  const violations = [];
  if (opts.length !== 4) violations.push('option_count_not_4');
  if (answerIndex < 0 || answerIndex >= opts.length) violations.push('answer_index_invalid');
  if (violations.length) return { ok: false, diagnostics: [], detailedOptions: [], violations };

  const existing = Array.isArray(round.optionDiagnostics) && round.optionDiagnostics.length === opts.length
    ? round.optionDiagnostics
    : [];
  const detailed = Array.isArray(round.detailedOptions) && round.detailedOptions.length === opts.length
    ? round.detailedOptions
    : [];

  const numericOptions = opts.map(parseNumericOption);
  const correctValue = numericOptions[answerIndex];
  const allNumeric = numericOptions.every((n) => n !== null);
  const diagnostics = [];

  for (let i = 0; i < opts.length; i += 1) {
    if (i === answerIndex) {
      diagnostics[i] = {
        optionIndex: i,
        optionText: opts[i],
        isCorrect: true,
        misconceptionId: null,
        misconceptionName: null,
        misconception: null,
        rationale: 'Doğru seçenek bağımsız çözümle uyumludur.',
        whyStudentChoosesThis: 'Doğru çözüm yolu uygulanır.',
        constructionRule: 'correct-answer',
        plausibilityScore: 1,
        grammarShape: allNumeric ? 'numeric' : 'text',
        semanticCategory: 'correct-answer'
      };
      continue;
    }
    const ex = existing[i] || null;
    const hasExistingDiagnostic = Boolean(ex && Object.keys(ex).length);
    const hasRealExisting = ex?.misconceptionId && !isGenericMisconception(ex.misconception || ex.rationale || ex.whyStudentChoosesThis);
    if (hasRealExisting) {
      diagnostics[i] = {
        optionIndex: i,
        optionText: opts[i],
        isCorrect: false,
        ...ex,
        rationale: ex.rationale || ex.whyStudentChoosesThis || ex.misconception,
        whyStudentChoosesThis: ex.whyStudentChoosesThis || ex.rationale || ex.misconception,
        constructionRule: ex.constructionRule || 'producer-supplied',
        plausibilityScore: Number(ex.plausibilityScore || 0.7),
        grammarShape: ex.grammarShape || (allNumeric ? 'numeric' : 'text'),
        semanticCategory: ex.semanticCategory || 'producer-supplied'
      };
      continue;
    }
    if (hasExistingDiagnostic && (ex.misconceptionId === null || isGenericMisconception(ex.rationale || ex.misconception || ex.whyStudentChoosesThis))) {
      diagnostics[i] = {
        optionIndex: i,
        optionText: opts[i],
        isCorrect: false,
        misconceptionId: null,
        misconceptionName: null,
        misconception: null,
        rationale: ex.rationale || 'Yanılgı gerekçesi kayıtlı değil',
        whyStudentChoosesThis: null,
        constructionRule: null,
        plausibilityScore: 0,
        grammarShape: allNumeric ? 'numeric' : 'text',
        semanticCategory: null
      };
      continue;
    }
    if (allNumeric && correctValue !== null) {
      diagnostics[i] = buildNumericDiagnostic({ round, optionText: opts[i], optionIndex: i, answerIndex, correctValue, optionValue: numericOptions[i] });
      continue;
    }
    const textDiag = round.requireExplicitDistractorEvidence
      ? null
      : deriveTextDiagnostic({ round, optionText: opts[i], optionIndex: i, answerIndex, detailed: detailed[i] });
    if (textDiag) {
      diagnostics[i] = textDiag;
      continue;
    }
    diagnostics[i] = {
      optionIndex: i,
      optionText: opts[i],
      isCorrect: false,
      misconceptionId: null,
      misconceptionName: null,
      misconception: null,
      rationale: 'Yanılgı gerekçesi kayıtlı değil',
      whyStudentChoosesThis: null,
      constructionRule: null,
      plausibilityScore: 0,
      grammarShape: allNumeric ? 'numeric' : 'text',
      semanticCategory: null
    };
  }

  const wrong = diagnostics.filter((d) => !d.isCorrect);
  const missing = wrong.filter((d) => !d.misconceptionId || isGenericMisconception(d.rationale || d.whyStudentChoosesThis)).map((d) => d.optionIndex);
  const distinctMisconceptions = new Set(wrong.map((d) => d.misconceptionId).filter(Boolean)).size;
  if (missing.length) violations.push(`missing_real_misconception:${missing.join(',')}`);
  if (distinctMisconceptions < 2) violations.push('distractor_misconception_variety_below_2');
  // Çok uzak sayısal çeldiriciler ayrıca optionQuality/choiceIntegrity tarafından da denetlenir;
  // burada ölçüm yokluğunu değil yalnız misconception yokluğunu kritik sayıyoruz.

  const detailedOptions = diagnostics.map((d) => d.isCorrect
    ? `Doğru: ${round.explanation || 'Doğru çözüm yolu uygulanır.'}`
    : `Yanlış: ${d.rationale}`);

  return {
    ok: violations.length === 0,
    skipped: false,
    diagnostics,
    detailedOptions,
    violations,
    distractorPlanId: `${round.skeletonId || round.familyId || 'choice'}:dp:${hashString(diagnostics.map((d) => d.misconceptionId || 'correct').join('|')).toString(36)}`,
    distinctMisconceptions
  };
}

function abstractSurfaceLexicon(text = '') {
  // Sayı/isim zaten normalizeText ile soyut; kalan içerik kelimelerini de yüzey say.
  // Böylece aynı iskelet+yol farklı dekor kelimeleriyle aynı cognitiveExperience olur.
  return normalizeText(text)
    .replace(/\b[\p{L}]{3,}\b/gu, '~')
    .replace(/(?:~\s*)+/g, '~ ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildCognitiveExperience(round = {}) {
  const kind = round.kind || 'choice';
  const family = round.familyId || 'unknown-family';
  const skeleton = round.skeletonId || 'unknown-skeleton';
  const reasoningPath = round.reasoningPathId || round.questionContract?.reasoningPath?.reasoningPathId || '';
  const solutionGraph = round.questionContract?.solution?.solutionGraphId || (skeleton ? `${skeleton}#solution1` : '');
  const prompt = normalizeText(round.prompt || '');
  const context = normalizeText(round.context || round.rule || '');
  const explanation = normalizeText(round.explanation || '');
  const requested = `${kind}|options:${Array.isArray(round.options) ? round.options.length : 0}`;
  let pattern = 'general';
  if (isDirectSingleStepArithmetic(round)) pattern = 'routine-single-step-arithmetic';
  else if (isObviousNextTermPattern(round)) pattern = 'obvious-next-term-pattern';
  else if (isRoutineTargetReach(round)) pattern = 'routine-target-reach';
  else if (/hata|yanlış|yanlis|düzelt/i.test(`${prompt} ${context}`)) pattern = 'error-analysis';
  else if (/kanıt|metin|paragraf|çıkarım/i.test(`${prompt} ${context}`)) pattern = 'evidence-inference';
  else if (kind === 'wordLadder' || /merdiven|tek harf/i.test(`${prompt} ${context}`)) pattern = 'word-ladder-transform';
  else if (kind === 'wordMine' || /harf envanter|maden/i.test(`${prompt} ${context}`)) pattern = 'word-mine-inventory';
  else if (kind === 'expression' || /hedefe ulaş/i.test(`${prompt} ${context}`)) pattern = 'expression-construction';
  // Deneyim kimliği: aile + iskelet + yol + soyutlanmış görev şablonu (dekor bağımsız).
  const structure = [
    pattern,
    family,
    skeleton,
    reasoningPath,
    solutionGraph,
    requested,
    abstractSurfaceLexicon(prompt).slice(0, 96),
    abstractSurfaceLexicon(context).slice(0, 64)
  ].join('|');
  const id = hashString(structure).toString(36);
  return {
    cognitiveExperienceId: `cx:${id}`,
    structuralId: `st:${hashString([pattern, family, skeleton, reasoningPath].join('|')).toString(36)}`,
    normalizedPerceivedStructure: structure,
    pattern
  };
}

export function evaluatePremiumQuestionFactory(round = {}, context = {}) {
  const grade = Number(context.grade ?? round.grade ?? round.targetGrade ?? 0);
  const fakeHard = detectFakeHardSurface(round, { grade });
  const distractor = buildPremiumDistractorDiagnostics(round);
  const experience = buildCognitiveExperience(round);
  const violations = [...fakeHard.violations, ...(distractor.violations || [])];
  const ok = violations.length === 0;
  return {
    version: QUESTION_FACTORY_VERSION,
    ok,
    status: ok ? 'PUBLISHABLE' : 'REJECT',
    grade,
    violations,
    fakeHard,
    distractor: {
      ok: distractor.ok,
      skipped: distractor.skipped,
      violations: distractor.violations || [],
      distinctMisconceptions: distractor.distinctMisconceptions || 0,
      distractorPlanId: distractor.distractorPlanId || null
    },
    experience
  };
}

export function normalizeRoundWithQuestionFactory(round = {}, context = {}) {
  const distractor = buildPremiumDistractorDiagnostics(round);
  const experience = buildCognitiveExperience(round);
  let next = {
    ...round,
    structuralId: round.structuralId || experience.structuralId,
    cognitiveExperienceId: round.cognitiveExperienceId || experience.cognitiveExperienceId,
    perceivedStructure: round.perceivedStructure || experience.normalizedPerceivedStructure,
    premiumBlueprint: {
      structuralId: round.structuralId || experience.structuralId,
      cognitiveExperienceId: round.cognitiveExperienceId || experience.cognitiveExperienceId,
      normalizedPerceivedStructure: experience.normalizedPerceivedStructure,
      pattern: experience.pattern
    }
  };
  if (!distractor.skipped && Array.isArray(distractor.diagnostics) && distractor.diagnostics.length) {
    next = {
      ...next,
      optionDiagnostics: distractor.diagnostics,
      detailedOptions: distractor.detailedOptions,
      distractorPlanId: distractor.distractorPlanId,
      distractorValidation: {
        verified: distractor.ok,
        diagnosticCount: distractor.diagnostics.filter((d) => !d.isCorrect && d.misconceptionId).length,
        distinctMisconceptions: distractor.distinctMisconceptions,
        violations: distractor.violations || []
      }
    };
  }
  const gate = evaluatePremiumQuestionFactory(next, context);
  return {
    ...next,
    questionFactoryGate: gate,
    productQualityGate: gate.ok ? 'PASS' : 'REJECT'
  };
}

export function filterRoundsByQuestionFactory(rounds = [], context = {}) {
  const kept = [];
  const rejected = [];
  for (const round of rounds) {
    const enriched = normalizeRoundWithQuestionFactory(round, context);
    if (enriched.questionFactoryGate.ok) kept.push(enriched);
    else rejected.push(enriched);
  }
  return { kept, rejected };
}

// İnsan gözüyle sabitlenmiş minimum GOLD benchmark örnekleri.
// Testler bu örnekleri kabul, bilerek kötü örnekleri ret etmek zorundadır.
export const PREMIUM_GOLD_BENCHMARKS_8TH = Object.freeze([
  {
    subject: 'math', gameId: 'problem-hunter', grade: 8,
    prompt: 'Bir kutudaki kırmızı ve mavi bilyelerin sayıları 3:5 oranındadır. 12 kırmızı eklenip 8 mavi çıkarılınca sayılar eşit oluyor. Başlangıçta toplam kaç bilye vardır?',
    options: ['64', '72', '80', '96'], answerIndex: 2,
    explanation: 'Kırmızı 3k, mavi 5k olsun. 3k+12=5k-8, 2k=20, k=10. Başlangıç toplamı 8k=80.',
    familyId: 'gold-ratio-change', skeletonId: 'gold-ratio-change:equation-from-ratio', reasoningPathId: 'gold-ratio-change:equation-from-ratio#algebraic-model',
    cognitiveTraits: ['representationTransform', 'usingIntermediateResultInNewDecision', 'strategySelection'],
    optionDiagnostics: [
      { optionIndex: 0, optionText: '64', isCorrect: false, misconceptionId: 'ratio-change:net-change-only', rationale: '12 ve 8 değişimlerini oran toplamıyla yanlış ilişkilendirir.' },
      { optionIndex: 1, optionText: '72', isCorrect: false, misconceptionId: 'ratio-change:partial-change', rationale: 'Ekleme ve çıkarma etkisini yalnız bir renge uygular.' },
      { optionIndex: 2, optionText: '80', isCorrect: true, misconceptionId: null, rationale: 'Doğru.' },
      { optionIndex: 3, optionText: '96', isCorrect: false, misconceptionId: 'ratio-change:wrong-k', rationale: 'k değerini 10 yerine 12 alır.' }
    ]
  },
  {
    subject: 'turkish', gameId: 'paragraph-detective', grade: 8,
    prompt: 'Bir teknoloji, insanın işini hızlandırdığı için yararlı kabul edilebilir. Ancak hız, her zaman nitelik anlamına gelmez. Bir metni saniyeler içinde özetleyen program, metindeki ince anlam ilişkilerini gözden kaçırabilir. Bu parçanın ana düşüncesi nedir?',
    options: ['Teknolojik araçlar uzun metinleri anlamayı gereksiz hâle getirir.', 'Teknolojinin hızlı sonuç vermesi sonucun her zaman nitelikli olduğunu göstermez.', 'Metin özetleyen programlar insanlardan daima başarılıdır.', 'Teknoloji yalnız düşünme becerisi gelişmemiş kişiler için zararlıdır.'],
    answerIndex: 1,
    explanation: 'Parça teknolojiyi reddetmez; hız ile nitelik arasındaki farkı vurgular. Bu nedenle ana düşünce B seçeneğidir.',
    familyId: 'gold-main-idea-tech', skeletonId: 'gold-main-idea-tech:infer-claim', reasoningPathId: 'gold-main-idea-tech:infer-claim#evidence-synthesis',
    cognitiveTraits: ['informationLinking', 'hypothesisEvaluation', 'strategySelection'],
    optionDiagnostics: [
      { optionIndex: 0, optionText: 'Teknolojik araçlar uzun metinleri anlamayı gereksiz hâle getirir.', isCorrect: false, misconceptionId: 'main-idea:overstatement', rationale: 'Metindeki uyarıyı gereksiz hâle getirme gibi aşırı bir sonuca taşır.' },
      { optionIndex: 1, optionText: 'Teknolojinin hızlı sonuç vermesi sonucun her zaman nitelikli olduğunu göstermez.', isCorrect: true, misconceptionId: null, rationale: 'Doğru.' },
      { optionIndex: 2, optionText: 'Metin özetleyen programlar insanlardan daima başarılıdır.', isCorrect: false, misconceptionId: 'main-idea:unsupported-comparison', rationale: 'Metinde insanlardan üstünlük karşılaştırması yoktur.' },
      { optionIndex: 3, optionText: 'Teknoloji yalnız düşünme becerisi gelişmemiş kişiler için zararlıdır.', isCorrect: false, misconceptionId: 'main-idea:narrowing', rationale: 'Eleştiriyi belirli bir kişi grubuna indirger.' }
    ]
  },
  {
    subject: 'english', gameId: 'english-vocabulary', grade: 8,
    prompt: 'Lena was reluctant to speak in front of the class. She knew the answer, but she kept looking at her notes and waited for someone else to volunteer. What does reluctant most nearly mean?',
    options: ['unwilling or hesitant', 'fully prepared', 'extremely curious', 'openly disappointed'],
    answerIndex: 0,
    explanation: 'The clues “kept looking at her notes” and “waited for someone else” show that she was hesitant although she knew the answer.',
    familyId: 'gold-context-vocab-reluctant', skeletonId: 'gold-context-vocab-reluctant:context-clue', reasoningPathId: 'gold-context-vocab-reluctant:context-clue#evidence-elimination',
    cognitiveTraits: ['informationLinking', 'hypothesisEvaluation', 'strategySelection'],
    optionDiagnostics: [
      { optionIndex: 0, optionText: 'unwilling or hesitant', isCorrect: true, misconceptionId: null, rationale: 'Correct.' },
      { optionIndex: 1, optionText: 'fully prepared', isCorrect: false, misconceptionId: 'vocab:single-clue-overread', rationale: 'Uses only “knew the answer” and ignores her hesitation.' },
      { optionIndex: 2, optionText: 'extremely curious', isCorrect: false, misconceptionId: 'vocab:mood-substitution', rationale: 'Confuses nervous hesitation with curiosity.' },
      { optionIndex: 3, optionText: 'openly disappointed', isCorrect: false, misconceptionId: 'vocab:unsupported-emotion', rationale: 'Adds an emotion not supported by the context.' }
    ]
  }
]);

export const PREMIUM_REJECT_BENCHMARKS = Object.freeze([
  {
    name: 'grade10_direct_addition_fake_hard', grade: 10, kind: 'choice', prompt: '73 + 88 işleminin sonucu kaçtır?', context: 'İşlem önceliğine ve işaretlere dikkat ederek hesapla.', options: ['180', '199', '161', '142'], answerIndex: 2, explanation: '73 + 88 = 161.', familyId: 'speed-math-two-term-addition', skeletonId: 'speed-math-two-term-addition:direct-compute', cognitiveTraits: ['multiStepInference', 'strategySelection']
  },
  {
    name: 'grade8_obvious_pattern_no_reasoning', grade: 8, kind: 'choice', prompt: 'Kural: Her terimde 4 ekleniyor. İlk iki terim 15 ve 19. Bu kurala göre 6. terim kaçtır?', context: 'Kuralı ilk terimden başlayarak sırayla uygula; çıkarım yapmana gerek yok, yalnız uygula.', options: ['39', '35', '43', '31'], answerIndex: 1, explanation: '15 → 19 → 23 → 27 → 31 → 35.', familyId: 'pattern-lab-arithmetic-add', skeletonId: 'pattern-lab-arithmetic-add:next-term', cognitiveTraits: ['multiStepInference', 'strategySelection']
  },
  {
    name: 'null_misconception_options', grade: 8, kind: 'choice', prompt: 'Parçanın ana düşüncesi nedir?', options: ['A', 'B', 'C', 'D'], answerIndex: 0, explanation: 'Doğru cevap A.', familyId: 'paragraph', skeletonId: 'paragraph:main-idea', optionDiagnostics: [
      { optionIndex: 0, isCorrect: true },
      { optionIndex: 1, isCorrect: false, misconceptionId: null, rationale: 'Yanılgı gerekçesi kayıtlı değil' },
      { optionIndex: 2, isCorrect: false, misconceptionId: null, rationale: 'Yanılgı gerekçesi kayıtlı değil' },
      { optionIndex: 3, isCorrect: false, misconceptionId: null, rationale: 'Yanılgı gerekçesi kayıtlı değil' }
    ] }
]);
