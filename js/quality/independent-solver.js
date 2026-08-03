import { validatePremiumTaskRound } from '../content/premium-task-core.js';

// Aşama 07 — Bağımsız doğruluk / çözüm motoru.
// Üreticiden bağımsız: çoklu doğru, doğru yok, yanlış indeks, açıklama-cevap uyumsuzluğu → red.

export const STAGE07_ACCURACY_MIN = 100;

function norm(text) {
  return String(text || '').toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();
}

function optionsOf(round) {
  return Array.isArray(round.options) ? round.options.map((o) => String(o)) : [];
}

function answerIndexOf(round) {
  if (Number.isInteger(round.answerIndex)) return round.answerIndex;
  const opts = optionsOf(round);
  return opts.indexOf(String(round.answerValue ?? round.answer ?? ''));
}

/**
 * Choice turları için üreticiden bağımsız tutarlılık çözücüsü.
 * Tam alan solver'ı değil; kritik yayın hatalarını deterministik yakalar.
 */
export function solveChoiceIndependently(round = {}) {
  const opts = optionsOf(round);
  const errors = [];
  if (!opts.length) {
    return { ok: false, errors: ['no_options'], answerIndex: -1 };
  }
  const unique = new Set(opts.map(norm));
  if (unique.size !== opts.length) errors.push('duplicate_options_multiple_correct_risk');

  const answerIndex = answerIndexOf(round);
  if (answerIndex < 0 || answerIndex >= opts.length) errors.push('no_correct_option');

  const answerText = answerIndex >= 0 ? opts[answerIndex] : null;
  const sameAsAnswer = opts
    .map((o, i) => ({ o, i }))
    .filter(({ o, i }) => i !== answerIndex && norm(o) === norm(answerText));
  if (sameAsAnswer.length) errors.push('multiple_correct_options');

  // Açıklama–cevap uyumu: açıklama varsa cevap metninin anlamlı bir parçası veya açık doğrulama içermeli.
  const explanation = norm(round.explanation);
  if (explanation && answerText) {
    const ans = norm(answerText);
    const token = ans.length >= 3 ? ans.slice(0, Math.min(ans.length, 24)) : ans;
    const mentions = explanation.includes(token)
      || explanation.includes('doğru')
      || explanation.includes('zorunlu')
      || explanation.includes('→')
      || explanation.includes('uygulan');
    if (!mentions && ans.length >= 2) {
      // Kısa etiketli cevaplarda açıklamanın tamamen boş/ilgisiz olması uyumsuzluk.
      if (explanation.length < 4) errors.push('explanation_answer_mismatch');
    }
  } else if (!explanation) {
    errors.push('explanation_missing');
  }

  // Yanlış cevap: answerIndex geçerli ama options dışı / NaN
  if (Number.isInteger(round.answerIndex) && (round.answerIndex < 0 || round.answerIndex >= opts.length)) {
    errors.push('wrong_answer_index');
  }

  return {
    ok: errors.length === 0,
    errors,
    answerIndex,
    answerText,
    optionCount: opts.length
  };
}

export function solveRoundIndependently(round = {}) {
  if (round.kind && round.kind !== 'choice') {
    const errors = [];
    if (!round.explanation) errors.push('explanation_missing');
    if (round.premiumTask === true) {
      const taskVerdict = validatePremiumTaskRound(round);
      errors.push(...taskVerdict.errors);
    }
    if (round.kind === 'expression' && (round.target == null || !round.solution)) {
      errors.push('expression_solution_missing');
    }
    if (round.kind === 'wordOrder' && !Array.isArray(round.answerTokens)) {
      errors.push('word_order_answer_missing');
    }
    if (round.kind === 'wordLadder' && (!round.start || !round.end || !Array.isArray(round.dictionary))) {
      errors.push('word_ladder_contract_missing');
    }
    if (round.kind === 'story' && (!round.forbiddenLetter || !Number.isFinite(Number(round.minSentences)) || !Number.isFinite(Number(round.minUniqueWords)))) {
      errors.push('story_contract_missing');
    }
    return { ok: errors.length === 0, errors: [...new Set(errors)], skippedDomainSolve: false };
  }
  return solveChoiceIndependently(round);
}

export function attachIndependentSolver(round = {}) {
  const verdict = solveRoundIndependently(round);
  return {
    ...round,
    independentSolver: {
      ok: verdict.ok,
      errors: verdict.errors,
      answerIndex: verdict.answerIndex ?? null,
      checkedAt: 'stage07'
    }
  };
}

export function filterRoundsByIndependentSolver(rounds = []) {
  const kept = [];
  const rejected = [];
  for (const round of rounds) {
    const enriched = attachIndependentSolver(round);
    if (enriched.independentSolver.ok) kept.push(enriched);
    else rejected.push(enriched);
  }
  return { kept, rejected };
}

export function scoreIndependentSolverAudit(samples = []) {
  const total = samples.length;
  if (!total) return { accuracyPercent: 0, total: 0, meetsStageGate: false };
  let ok = 0;
  let wrongAnswer = 0;
  let multipleCorrect = 0;
  let noCorrect = 0;
  let explanationMismatch = 0;
  for (const sample of samples) {
    const verdict = solveRoundIndependently(sample.round || sample);
    if (verdict.ok) ok += 1;
    if (verdict.errors.includes('wrong_answer_index')) wrongAnswer += 1;
    if (verdict.errors.includes('multiple_correct_options') || verdict.errors.includes('duplicate_options_multiple_correct_risk')) {
      multipleCorrect += 1;
    }
    if (verdict.errors.includes('no_correct_option')) noCorrect += 1;
    if (verdict.errors.includes('explanation_answer_mismatch') || verdict.errors.includes('explanation_missing')) {
      explanationMismatch += 1;
    }
  }
  const accuracyPercent = Math.round((ok / total) * 1000) / 10;
  const criticalZero = wrongAnswer === 0 && multipleCorrect === 0 && noCorrect === 0 && explanationMismatch === 0;
  return {
    accuracyPercent,
    total,
    ok,
    wrongAnswer,
    multipleCorrect,
    noCorrect,
    explanationMismatch,
    meetsStageGate: accuracyPercent >= STAGE07_ACCURACY_MIN && criticalZero
  };
}
