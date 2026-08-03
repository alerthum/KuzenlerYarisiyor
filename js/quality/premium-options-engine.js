import { buildPremiumDistractorDiagnostics } from './question-factory-v13.js';

// Aşama 06 — Premium seçenek / çeldirici kalite motoru.
// Alakasız, saçma, tek olumsuz, biçimsel ipuçlu seçenek = 0.
// Tüm seçenekleri okumadan cevaplanabilen soru reddedilir.
// Her yanlış seçenek gerçek misconception kaydı taşır.
// Kör seçenek denetçisi (stem’siz) uygulanır.

export const STAGE06_SCORE_MIN = 95;

const ABSURD_RE = /^(xyz+|asdf|qwerty|lorem|test123|!!!+|___+)$/i;
const IRRELEVANT_TOKENS = ['pizza', 'uzaylı', 'futbolcu-adi', 'renk-kodu-xyz'];
const LOW_INFORMATION_TOKENS = ['renk', 'ses', 'şarkı', 'sarki', 'rastgele', 'tahmin'];

function norm(text) {
  return String(text || '').toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();
}

function optionTexts(round = {}) {
  return Array.isArray(round.options) ? round.options.map((o) => String(o)) : [];
}

function answerIndexOf(round = {}) {
  if (Number.isInteger(round.answerIndex)) return round.answerIndex;
  const opts = optionTexts(round);
  const raw = round.answerValue ?? round.answer;
  const idx = opts.indexOf(String(raw ?? ''));
  return idx;
}

function lengths(opts) {
  return opts.map((o) => norm(o).length);
}

function isUniqueNegative(opts) {
  // Yalnız tam “hiçbiri / none of the above” kalıpları; kısa geçerli etiketleri (değil vb.) sayma.
  const neg = opts.map((o) => /^(hiçbiri|hicbiri|none of the above|hiç biri)$/i.test(norm(o)));
  return neg.filter(Boolean).length === 1;
}

function looksLikeParallelStepOptions(opts) {
  // Hata dedektifi adım satırları gibi biçimsel olarak uzun/paralel seçenekler
  // uzunluk farkıyla “ipucu” sayılmaz.
  const stepLike = opts.filter((o) => /^\s*\d+\.\s/.test(String(o))).length >= 3;
  const allLong = opts.every((o) => String(o).length >= 18);
  return stepLike || allLong;
}

function formCueGiveaway(opts, answerIndex) {
  if (answerIndex < 0 || !opts.length) return false;
  if (looksLikeParallelStepOptions(opts)) return false;
  const lens = lengths(opts);
  const ansLen = lens[answerIndex];
  const others = lens.filter((_, i) => i !== answerIndex);
  if (!others.length) return false;
  const maxOther = Math.max(...others);
  const minOther = Math.min(...others);
  // Doğru şık belirgin biçimde daha uzun/kısa ise biçimsel ipucu.
  if (ansLen >= maxOther + 28 && ansLen >= maxOther * 1.8) return true;
  if (ansLen <= Math.max(0, minOther - 16) && ansLen <= 2) return true;
  // Yalnız doğru şıkta noktalama/parantez bolluğu
  const punct = (o) => (String(o).match(/[().,:;]/g) || []).length;
  const ansP = punct(opts[answerIndex]);
  const otherP = opts.filter((_, i) => i !== answerIndex).map(punct);
  if (ansP >= 4 && otherP.every((p) => p === 0)) return true;
  return false;
}

function irrelevantOption(opts, round) {
  const stem = norm(`${round.prompt || ''} ${round.context || ''} ${round.explanation || ''}`);
  const answerIndex = answerIndexOf(round);
  const answer = norm(opts[answerIndex] || '');
  return opts.some((o, optionIndex) => {
    const t = norm(o);
    if (!t) return true;
    if (ABSURD_RE.test(t)) return true;
    // Bir kelime soru bağlamında gerçekten geçiyorsa (ör. dondurma satışı) onu otomatik
    // olarak alakasız sayma. Yalnız bağlam ve doğru cevapta karşılığı olmayan açık dekorları engelle.
    if (IRRELEVANT_TOKENS.some((tok) => t.includes(tok) && !stem.includes(tok) && !answer.includes(tok))) return true;
    if (optionIndex !== answerIndex && t.split(' ').length <= 3
      && LOW_INFORMATION_TOKENS.some((tok) => t === tok || t === `${tok}.`)
      && !stem.includes(t)) return true;
    return false;
  });
}

function absurdOption(opts) {
  return opts.some((o) => ABSURD_RE.test(norm(o)) || norm(o).length === 0);
}

/**
 * Kör denetçi: stem olmadan yalnız seçenek listesinden doğru şık tahmin edilebilir mi?
 * Heuristik: benzersiz uzunluk/olumsuzluk/noktalama ipuçları.
 */
export function blindOptionClassifier(options = [], answerIndex = -1) {
  const opts = options.map(String);
  if (opts.length < 2 || answerIndex < 0) {
    return { predictableWithoutStem: false, reason: 'insufficient' };
  }
  if (looksLikeParallelStepOptions(opts)) {
    return { predictableWithoutStem: false, reason: 'parallel_step_options' };
  }
  if (formCueGiveaway(opts, answerIndex)) {
    return { predictableWithoutStem: true, reason: 'length_or_punct_cue' };
  }
  if (isUniqueNegative(opts)) {
    const negIdx = opts.findIndex((o) => /^(hiçbiri|hicbiri|none of the above|hiç biri)$/i.test(norm(o)));
    if (negIdx === answerIndex) {
      return { predictableWithoutStem: true, reason: 'unique_negative_is_answer' };
    }
  }
  // Tek şık diğerlerinden biçimsel olarak tamamen farklı kategori (yalnız sayı vs yalnız harf)
  const types = opts.map((o) => (/^\d+([.,]\d+)?$/.test(norm(o)) ? 'num' : /[a-zçğıöşü]/i.test(o) ? 'text' : 'other'));
  const ansType = types[answerIndex];
  if (types.filter((t) => t === ansType).length === 1 && types.some((t) => t !== ansType)) {
    return { predictableWithoutStem: true, reason: 'unique_type_cue' };
  }
  return { predictableWithoutStem: false, reason: 'ok' };
}

function misconceptionCoverage(round = {}, answerIndex) {
  const result = buildPremiumDistractorDiagnostics(round);
  if (result.skipped) return { ok: true, missing: [], violations: [] };
  const opts = optionTexts(round);
  const missing = [];
  const violations = [...(result.violations || [])];
  for (let i = 0; i < opts.length; i += 1) {
    if (i === answerIndex) continue;
    const diag = result.diagnostics?.[i];
    const hasId = Boolean(diag?.misconceptionId);
    const hasRationale = Boolean(diag?.rationale || diag?.whyStudentChoosesThis);
    if (!hasId || !hasRationale) missing.push(i);
  }
  return { ok: missing.length === 0 && violations.length === 0, missing, violations, diagnostics: result.diagnostics, detailedOptions: result.detailedOptions, distractorPlanId: result.distractorPlanId };
}

export function evaluateOptionQuality(round = {}) {
  if (round.kind && round.kind !== 'choice') {
    return {
      ok: true,
      skipped: true,
      score: 100,
      violations: [],
      metrics: {}
    };
  }
  const opts = optionTexts(round);
  const answerIndex = answerIndexOf(round);
  const violations = [];
  if (opts.length !== 4) violations.push('option_count_not_4');
  if (new Set(opts.map(norm)).size !== opts.length) violations.push('duplicate_options');
  if (answerIndex < 0 || answerIndex >= opts.length) violations.push('answer_index_invalid');
  if (irrelevantOption(opts, round)) violations.push('irrelevant_option');
  if (absurdOption(opts)) violations.push('absurd_option');
  if (isUniqueNegative(opts)) violations.push('unique_negative_option');
  if (formCueGiveaway(opts, answerIndex)) violations.push('form_cue_giveaway');
  const blind = blindOptionClassifier(opts, answerIndex);
  if (blind.predictableWithoutStem) violations.push(`answerable_without_reading_stem:${blind.reason}`);
  const misc = misconceptionCoverage(round, answerIndex);
  if (!misc.ok) violations.push('missing_misconception_record');
  for (const v of (misc.violations || [])) violations.push(v);

  const critical = [
    'irrelevant_option',
    'absurd_option',
    'unique_negative_option',
    'form_cue_giveaway',
    'missing_misconception_record'
  ];
  const criticalHit = violations.some((v) => critical.includes(v) || v.startsWith('answerable_without_reading'));
  const score = Math.max(0, 100 - violations.length * 20);
  return {
    ok: !criticalHit && violations.length === 0,
    skipped: false,
    score,
    violations,
    metrics: {
      irrelevantOptionCount: violations.includes('irrelevant_option') ? 1 : 0,
      absurdOptionCount: violations.includes('absurd_option') ? 1 : 0,
      uniqueNegativeOptionCount: violations.includes('unique_negative_option') ? 1 : 0,
      formCueGiveawayCount: violations.includes('form_cue_giveaway') ? 1 : 0,
      answerableWithoutReadingAllOptionsCount: blind.predictableWithoutStem ? 1 : 0,
      missingMisconceptionCount: misc.missing.length,
      blind
    }
  };
}

export function attachOptionQuality(round = {}) {
  // Choice dışı: dokunma.
  if (round.kind && round.kind !== 'choice') {
    return { ...round, optionQuality: { skipped: true, ok: true, score: 100, violations: [] } };
  }
  const built = buildPremiumDistractorDiagnostics(round);
  const next = built.skipped ? { ...round } : {
    ...round,
    optionDiagnostics: built.diagnostics,
    detailedOptions: built.detailedOptions,
    distractorPlanId: built.distractorPlanId,
    distractorValidation: {
      verified: built.ok,
      diagnosticCount: (built.diagnostics || []).filter((item) => !item.isCorrect && item.misconceptionId).length,
      distinctMisconceptions: built.distinctMisconceptions || 0,
      violations: built.violations || []
    }
  };
  const evaluation = evaluateOptionQuality(next);
  return {
    ...next,
    optionQuality: evaluation
  };
}

export function filterRoundsByOptionQuality(rounds = []) {
  const kept = [];
  const rejected = [];
  for (const round of rounds) {
    const enriched = attachOptionQuality(round);
    if (enriched.kind && enriched.kind !== 'choice') {
      kept.push(enriched);
      continue;
    }
    if (enriched.optionQuality?.ok) kept.push(enriched);
    else rejected.push(enriched);
  }
  return { kept, rejected };
}

export function scoreOptionQualityAudit(samples = []) {
  const total = samples.length;
  if (!total) {
    return { scorePercent: 0, total: 0, meetsStageGate: false, easyMediumNote: 'no_samples' };
  }
  let scoreSum = 0;
  let irrelevantOptionCount = 0;
  let absurdOptionCount = 0;
  let uniqueNegativeOptionCount = 0;
  let formCueGiveawayCount = 0;
  let answerableWithoutReadingAllOptionsCount = 0;
  let missingMisconceptionCount = 0;
  for (const sample of samples) {
    const round = sample.round || sample;
    const evaluation = evaluateOptionQuality(round);
    scoreSum += evaluation.score;
    irrelevantOptionCount += evaluation.metrics.irrelevantOptionCount || 0;
    absurdOptionCount += evaluation.metrics.absurdOptionCount || 0;
    uniqueNegativeOptionCount += evaluation.metrics.uniqueNegativeOptionCount || 0;
    formCueGiveawayCount += evaluation.metrics.formCueGiveawayCount || 0;
    answerableWithoutReadingAllOptionsCount += evaluation.metrics.answerableWithoutReadingAllOptionsCount || 0;
    missingMisconceptionCount += evaluation.metrics.missingMisconceptionCount || 0;
  }
  const scorePercent = Math.round((scoreSum / total) * 10) / 10;
  const criticalZero = irrelevantOptionCount === 0
    && absurdOptionCount === 0
    && uniqueNegativeOptionCount === 0
    && formCueGiveawayCount === 0
    && answerableWithoutReadingAllOptionsCount === 0
    && missingMisconceptionCount === 0;
  return {
    scorePercent,
    total,
    irrelevantOptionCount,
    absurdOptionCount,
    uniqueNegativeOptionCount,
    formCueGiveawayCount,
    answerableWithoutReadingAllOptionsCount,
    missingMisconceptionCount,
    meetsStageGate: scorePercent >= STAGE06_SCORE_MIN && criticalZero
  };
}
