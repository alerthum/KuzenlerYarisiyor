// Analiz JSON canlı örnek sözleşmesi (Aşama 04 / B-007).
// options alanı HER ZAMAN Array olmalıdır. Açıklama metinleri options'a
// string olarak yazılamaz; questionKind / optionsStatus / optionsNote kullanılır.

export function summarizeGameProgress(rows = []) {
  const summary = { pass: 0, inProgress: 0, waiting: 0, blocked: 0, totalGames: 0 };
  for (const row of rows) {
    summary.totalGames += 1;
    const status = String(row?.status || '').toUpperCase();
    if (status === 'PASS') summary.pass += 1;
    else if (status === 'IN_PROGRESS') summary.inProgress += 1;
    else if (status === 'BLOCKED') summary.blocked += 1;
    else summary.waiting += 1;
  }
  return summary;
}

/**
 * Tek bir canlı örnek kaydını options sözleşmesine normalize eder.
 * Girdi mutate edilmez; yeni nesne döner.
 */
export function normalizeAnalysisSample(rawSample = {}, { sourceHint = '' } = {}) {
  const sample = rawSample && typeof rawSample === 'object' && !Array.isArray(rawSample) ? rawSample : {};
  const base = { ...sample };
  const receivedType = Array.isArray(sample.options)
    ? 'array'
    : sample.options === null
      ? 'null'
      : typeof sample.options;

  let questionKind = sample.questionKind || null;
  let options;
  let optionsStatus;
  let optionsNote = sample.optionsNote || null;
  let contractViolation = null;

  if (Array.isArray(sample.options)) {
    options = [...sample.options];
    if (options.length === 0) {
      questionKind = questionKind || (sample.kind === 'expression' ? 'expression' : 'open-ended');
      optionsStatus = sample.optionsStatus || 'NOT_APPLICABLE';
      optionsNote = optionsNote || 'Serbest cevaplı soru — seçenek bulunmaz';
    } else {
      questionKind = questionKind || 'multiple-choice';
      optionsStatus = sample.optionsStatus || 'AVAILABLE';
    }
  } else if (typeof sample.options === 'string') {
    // Legacy: açıklama options alanına yazılmış (B-007 kök nedeni).
    const legacy = sample.options;
    const looksExpression = /expression|serbest|kind:'expression'|kind:"expression"/i.test(legacy)
      || sample.kind === 'expression'
      || /serbest ifade/i.test(legacy);
    options = [];
    questionKind = looksExpression ? 'expression' : (questionKind || 'open-ended');
    optionsStatus = 'NOT_APPLICABLE';
    optionsNote = optionsNote || (looksExpression
      ? 'Serbest cevaplı soru — seçenek bulunmaz'
      : `Legacy string options normalize edildi: ${legacy.slice(0, 120)}`);
    contractViolation = {
      code: 'LEGACY_STRING_OPTIONS',
      receivedType: 'string',
      game: sample.game || null,
      familyId: sample.familyId || null,
      skeletonId: sample.skeletonId || null,
      sourceHint: sourceHint || null,
      rawPreview: legacy.slice(0, 200)
    };
  } else if (sample.options === undefined || sample.options === null) {
    options = [];
    questionKind = questionKind || (sample.kind === 'expression' ? 'expression' : null);
    if (questionKind === 'expression' || sample.kind === 'expression') {
      optionsStatus = 'NOT_APPLICABLE';
      optionsNote = optionsNote || 'Serbest cevaplı soru — seçenek bulunmaz';
    } else {
      optionsStatus = 'INVALID';
      optionsNote = optionsNote || 'Seçenek verisi yok (undefined/null)';
      contractViolation = {
        code: 'MISSING_OPTIONS',
        receivedType,
        game: sample.game || null,
        familyId: sample.familyId || null,
        skeletonId: sample.skeletonId || null,
        sourceHint: sourceHint || null
      };
    }
  } else {
    // object veya beklenmeyen tip
    options = [];
    optionsStatus = 'INVALID';
    optionsNote = optionsNote || 'Seçenek verisi sözleşmeye uymuyor';
    questionKind = questionKind || 'unknown';
    contractViolation = {
      code: 'INVALID_CONTRACT',
      receivedType,
      game: sample.game || null,
      familyId: sample.familyId || null,
      skeletonId: sample.skeletonId || null,
      sourceHint: sourceHint || null,
      rawPreview: (() => {
        try { return JSON.stringify(sample.options).slice(0, 200); } catch { return String(sample.options); }
      })()
    };
  }

  return {
    ...base,
    questionKind,
    options,
    optionsStatus,
    optionsNote,
    contractViolation
  };
}

export function normalizeLiveGeneratedSamples(samples = []) {
  if (!Array.isArray(samples)) return [];
  return samples.map((sample, index) => normalizeAnalysisSample(sample, { sourceHint: `samples[${index}]` }));
}

/** UI için seçenek satırı metni (kaçış fonksiyonu dışarıdan verilir). */
export function formatSampleOptionsLine(sample, esc = (v) => String(v ?? '')) {
  const normalized = sample.optionsStatus
    ? sample
    : normalizeAnalysisSample(sample);
  // UI savunması — veri sözleşmesi ihlalini gizlemez; yalnız .map çökmesini engeller.
  const options = Array.isArray(normalized.options) ? normalized.options : [];

  if (normalized.optionsStatus === 'INVALID' || normalized.contractViolation?.code === 'INVALID_CONTRACT') {
    const v = normalized.contractViolation || {};
    return `INVALID_CONTRACT — oyun: ${esc(v.game || normalized.game || '?')}, familyId: ${esc(v.familyId || normalized.familyId || '?')}, skeletonId: ${esc(v.skeletonId || normalized.skeletonId || '?')}, gelen tip: ${esc(v.receivedType || typeof normalized.options)}`;
  }
  if (normalized.optionsStatus === 'NOT_APPLICABLE' || options.length === 0 && (normalized.questionKind === 'expression' || normalized.kind === 'expression')) {
    return esc(normalized.optionsNote || 'Serbest cevaplı soru — seçenek bulunmaz');
  }
  if (options.length === 0) {
    return esc(normalized.optionsNote || 'Seçenek yok');
  }
  return options.map(esc).join(', ');
}

/** Tek örnek kartı HTML (Komuta Merkezi). Tek örnek hata fırlatmaz. */
export function renderLiveSampleCardHtml(sample, esc = (v) => String(v ?? '')) {
  try {
    const normalized = normalizeAnalysisSample(sample);
    const optionsLine = formatSampleOptionsLine(normalized, esc);
    const badge = normalized.optionsStatus === 'INVALID' ? 'orange' : '';
    return `<article class="admin-entity-card"><div class="entity-icon">🧩</div><div class="entity-main"><h4>${esc(normalized.game)} — <span class="badge ${badge}">${esc(normalized.status)}</span></h4><p>${esc(normalized.prompt)}</p><p><small>Seçenekler: ${optionsLine} • Doğru: <strong>${esc(normalized.correctAnswer)}</strong></small></p><p><small>questionKind: ${esc(normalized.questionKind || 'Veri yok')} • optionsStatus: ${esc(normalized.optionsStatus || 'Veri yok')}</small></p><p><small>familyId: <code>${esc(normalized.familyId)}</code> • skeletonId: <code>${esc(normalized.skeletonId)}</code> • reasoningPathId: <code>${esc(normalized.reasoningPathId)}</code></small></p><p><small>Bilişsel özellikler: ${esc((normalized.cognitiveTraits || []).join(', '))}</small></p><p><small>Zorluk kanıtı: ${esc(normalized.difficultyEvidence)}</small></p><p><small>Bağımsız çözücü: ${esc(normalized.independentSolverResult)}</small></p></div></article>`;
  } catch (error) {
    return `<article class="admin-entity-card"><div class="entity-icon">⚠️</div><div class="entity-main"><h4>Örnek render hatası</h4><p><small>${esc(error?.message || String(error))}</small></p></div></article>`;
  }
}
