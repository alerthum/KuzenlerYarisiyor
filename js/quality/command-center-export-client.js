/**
 * Tarayıcı: Komuta Merkezi JSON kopyala / indir.
 * DOM metni kopyalamaz; birleşik export + canlı kaynakları kullanır.
 */

export const EXPORT_URL = '/public/question-engine-command-center-export.json';
export const SHARE_URL = '/public/question-engine-command-center-share.json';
export const REBUILD_URL = '/api/rebuild-command-center-export';
export const REBUILD_SHARE_URL = '/api/rebuild-command-center-share';

const BROWSER_SOURCES = [
  { path: 'public/trusted-live-release.json', url: '/public/trusted-live-release.json', required: true },
  { path: 'public/strict-audit-live.json', url: '/public/strict-audit-live.json', required: false },
  { path: 'public/question-engine-analysis.json', url: '/public/question-engine-analysis.json', required: true },
  { path: 'PRODUCT_ACCEPTANCE_DECISION.json', url: '/PRODUCT_ACCEPTANCE_DECISION.json', required: true },
  { path: 'FINAL_EVIDENCE_INDEX.json', url: '/FINAL_EVIDENCE_INDEX.json', required: true },
  { path: 'FINAL_RELEASE_DECISION.json', url: '/FINAL_RELEASE_DECISION.json', required: false },
  { path: 'PROJECT_STATE.json', url: '/PROJECT_STATE.json', required: true },
  { path: 'QUALITY_SCORE.json', url: '/QUALITY_SCORE.json', required: true },
  { path: 'BLOCKERS.json', url: '/BLOCKERS.json', required: true },
  { path: 'md/arsiv/CONTEXT_SNAPSHOT.md', url: '/md/arsiv/CONTEXT_SNAPSHOT.md', required: true },
  { path: 'quality-reports/strict-audit-progress.json', url: '/quality-reports/strict-audit-progress.json', required: false },
  { path: 'quality-reports/strict-audit-checkpoint.json', url: '/quality-reports/strict-audit-checkpoint.json', required: false },
  { path: 'quality-reports/product-acceptance/annual-student.json', url: '/quality-reports/product-acceptance/annual-student.json', required: false },
  { path: 'quality-reports/product-acceptance/class-30.json', url: '/quality-reports/product-acceptance/class-30.json', required: false },
  { path: 'quality-reports/product-acceptance/perceived-diversity.json', url: '/quality-reports/product-acceptance/perceived-diversity.json', required: false },
  { path: 'quality-reports/product-acceptance/content-review-samples.json', url: '/quality-reports/product-acceptance/content-review-samples.json', required: false },
  { path: 'quality-reports/final-evidence/solver-50k.json', url: '/quality-reports/final-evidence/solver-50k.json', required: false },
  { path: 'quality-reports/final-evidence/options-10k.json', url: '/quality-reports/final-evidence/options-10k.json', required: false },
  { path: 'quality-reports/final-evidence/e2e-full.json', url: '/quality-reports/final-evidence/e2e-full.json', required: false },
  { path: 'quality-reports/final-evidence/child-mind-bands.json', url: '/quality-reports/final-evidence/child-mind-bands.json', required: false },
  { path: 'package.json', url: '/package.json', required: false },
  { path: 'public/question-engine-command-center-export.json', url: EXPORT_URL, required: false }
];

let exportInFlight = null;
let shareInFlight = null;

export function formatSize(bytes) {
  const n = Number(bytes) || 0;
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  if (n >= 1024) return `${Math.round(n / 1024)} KB`;
  return `${n} B`;
}

export async function copyTextToClipboard(text) {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return { ok: true, method: 'clipboard-api' };
    } catch {
      /* fallback */
    }
  }
  if (typeof document === 'undefined') return { ok: false, method: 'none' };
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  ta.style.top = '0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  ta.remove();
  return { ok, method: 'textarea-fallback' };
}

export function downloadJsonFile(text, filename) {
  const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function buildLiveSummaryFromExport(doc) {
  const trusted = doc?.trustedLiveRelease || {};
  const truth = doc?.currentTruth || {};
  const live = doc?.liveProgress || doc?.currentLiveOperation || {};
  const work = doc?.currentWork || trusted?.currentWork || {};
  const releaseSummary = trusted?.summary || {};
  const blockerRows = Array.isArray(doc?.currentBlockers)
    ? doc.currentBlockers
    : Array.isArray(doc?.blockers)
      ? doc.blockers
      : (doc?.blockers?.blockers || []);

  const status = truth.status || trusted.releaseStatus || live.status || 'IDLE';
  const safeGameCount = truth.safeGameCount ?? releaseSummary.safeGameCount ?? 0;
  const safeCellCount = truth.safeCellCount ?? releaseSummary.safeCellCount ?? 0;
  const approvedQuestionAssignments = truth.approvedQuestionAssignments
    ?? releaseSummary.approvedQuestionAssignments
    ?? releaseSummary.approvedQuestionAssignmentCount
    ?? 0;
  const uniqueApprovedQuestionCount = truth.uniqueApprovedQuestionCount
    ?? releaseSummary.uniqueApprovedQuestionCount
    ?? 0;

  return {
    schemaVersion: '2.0',
    kind: 'trusted-live-status-summary',
    exportedAt: new Date().toISOString(),
    projectName: doc?.exportMeta?.projectName || 'Zihin Arenası',
    appVersion: doc?.exportMeta?.appVersion || null,
    dataFreshness: doc?.exportMeta?.dataFreshness || null,
    status,
    wholeProductReady: truth.wholeProductReady === true || trusted.wholeProductReady === true,
    productReady: truth.productReady === true || trusted.productReady === true,
    partialSafePilotAllowed: truth.partialSafePilotAllowed === true || status === 'PARTIAL_SAFE_PILOT',
    publicationMode: truth.publicationMode || trusted.publicationMode || null,
    fallbackToLegacyAllowed: truth.fallbackToLegacyAllowed === true || trusted.fallbackToLegacyAllowed === true,
    safeGameCount,
    totalGameCount: truth.totalGameCount ?? releaseSummary.totalGameCount ?? 23,
    safeCellCount,
    approvedQuestionAssignments,
    uniqueApprovedQuestionCount,
    finalSurfaceReview: truth.finalSurfaceReview || {
      status: releaseSummary.finalSurfaceReviewStatus || null,
      reviewed: releaseSummary.finalSurfaceReviewedQuestionCount ?? null,
      failed: releaseSummary.finalSurfaceFailedQuestionCount ?? null,
      legacyFallbackDetected: releaseSummary.legacyFallbackDetected ?? null
    },
    currentTask: work.currentTask || work.title || live.currentTask || null,
    nextAction: work.nextAction || live.nextAction || null,
    phase: live.phase || null,
    phaseLabel: live.phaseLabel || null,
    progressPercent: live.progressPercent ?? null,
    lastActivityMessage: live.lastActivityMessage || null,
    lastRealTestResult: live.lastRealTestResult || null,
    checkpoint: live.checkpoint || doc?.auditSummary?.checkpoint || doc?.strictAuditProgress?.checkpoint || null,
    blockers: blockerRows.map((b) => ({
      id: b.id || b.scope || null,
      severity: b.severity || b.status || null,
      title: b.title || null,
      reason: b.reason || null
    })),
    recentEvents: Array.isArray(live.recentEvents) ? live.recentEvents.slice(-20) : [],
    note: 'Bu özet güncel güvenli yayın gerçeğini ve devam eden işi birlikte taşır; eski Stage PASS sayaçları ürünün tamamı için kullanılmaz.'
  };
}

async function fetchJsonNoStore(url) {
  const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const text = await response.text();
  return { text, data: JSON.parse(text) };
}

async function tryRebuildOnServer(url = REBUILD_URL) {
  try {
    const response = await fetch(`${url}?t=${Date.now()}`, {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: '{}'
    });
    if (!response.ok) return { ok: false, error: `rebuild HTTP ${response.status}` };
    return { ok: true, meta: await response.json() };
  } catch (err) {
    return { ok: false, error: err?.message || 'rebuild_failed' };
  }
}

/**
 * Birleşik export'u getirir (server rebuild tercih).
 * Paralel çağrılar tek promise paylaşır.
 */
export function loadCommandCenterExportBundle() {
  if (exportInFlight) return exportInFlight;
  exportInFlight = (async () => {
    try {
      const rebuild = await tryRebuildOnServer(REBUILD_URL);
      try {
        const { text, data } = await fetchJsonNoStore(EXPORT_URL);
        JSON.parse(text);
        if (!data || typeof data !== 'object' || data.schemaVersion !== '1.0') {
          throw new Error('export_schema_invalid');
        }
        return {
          kind: 'full-export',
          text: JSON.stringify(data, null, 2),
          data,
          rebuild,
          bytes: new TextEncoder().encode(JSON.stringify(data, null, 2)).length
        };
      } catch {
        const assembled = await assembleFromBrowserSources();
        return { ...assembled, kind: 'full-export', rebuild, fallback: true };
      }
    } finally {
      exportInFlight = null;
    }
  })();
  return exportInFlight;
}

/** ChatGPT kompakt share — panoya bunu kopyala; full export değil. */
export function loadCommandCenterShareBundle({ onStale } = {}) {
  if (shareInFlight) return shareInFlight;
  shareInFlight = (async () => {
    try {
      if (typeof onStale === 'function') onStale();
      const rebuild = await tryRebuildOnServer(REBUILD_SHARE_URL);
      const { text, data } = await fetchJsonNoStore(SHARE_URL);
      JSON.parse(text);
      if (!data || typeof data !== 'object' || data.schemaVersion !== '1.0') {
        throw new Error('share_schema_invalid');
      }
      if (data.rawSources) throw new Error('share_contains_rawSources');
      const pretty = JSON.stringify(data, null, 2);
      return {
        kind: 'chatgpt-share',
        text: pretty,
        data,
        rebuild,
        bytes: new TextEncoder().encode(pretty).length
      };
    } finally {
      shareInFlight = null;
    }
  })();
  return shareInFlight;
}

async function assembleFromBrowserSources() {
  const sourceHealth = [];
  const rawSources = {};
  const loaded = {};
  for (const src of BROWSER_SOURCES) {
    if (src.path === 'public/question-engine-command-center-export.json') continue;
    const health = { source: src.path, required: src.required, status: 'MISSING', updatedAt: null, error: null };
    try {
      const response = await fetch(`${src.url}?t=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      if (src.path.endsWith('.md')) {
        health.status = 'OK';
        loaded[src.path] = text;
        rawSources[src.path] = text;
      } else {
        const data = JSON.parse(text);
        health.status = 'OK';
        loaded[src.path] = data;
        rawSources[src.path] = data;
      }
    } catch (err) {
      health.error = err?.message || 'fetch_failed';
      if (src.required) health.status = 'MISSING';
      else health.status = 'MISSING';
      rawSources[src.path] = null;
    }
    sourceHealth.push(health);
  }
  const analysis = loaded['public/question-engine-analysis.json'] || {};
  const trusted = loaded['public/trusted-live-release.json'] || {};
  const live = loaded['public/strict-audit-live.json'] || {};
  const missingRequired = sourceHealth.filter((h) => h.required && h.status !== 'OK');
  const data = {
    schemaVersion: '1.0',
    exportMeta: {
      exportedAt: new Date().toISOString(),
      projectName: 'Zihin Arenası',
      screen: 'Soru Motoru Komuta Merkezi',
      appVersion: loaded['package.json']?.version || 'unknown',
      runId: live.runId || null,
      dataFreshness: missingRequired.length ? 'PARTIAL' : (trusted.generatedAt ? 'LIVE' : 'STALE'),
      sourceCount: sourceHealth.length,
      exportSizeBytes: 0,
      sectionCount: 28,
      missingRequiredCount: missingRequired.length,
      missingRequiredSources: missingRequired.map((h) => h.source),
      assembledInBrowser: true
    },
    trustedLiveRelease: trusted,
    currentLiveOperation: live,
    strictAuditProgress: loaded['quality-reports/strict-audit-progress.json'] || {},
    questionEngineAnalysis: analysis,
    technicalQuality: {
      overallQualityScorePercent: analysis.overallQualityScorePercent ?? null,
      technicalQualityScorePercent: analysis.technicalQualityScorePercent ?? null,
      currentAutonomousStage: analysis.currentAutonomousStage || null,
      qualityScoreFile: loaded['QUALITY_SCORE.json'] || {},
      releaseDecision: loaded['FINAL_RELEASE_DECISION.json'] || {}
    },
    finalEvidence: {
      index: loaded['FINAL_EVIDENCE_INDEX.json'] || {},
      solver: loaded['quality-reports/final-evidence/solver-50k.json'] || null,
      options: loaded['quality-reports/final-evidence/options-10k.json'] || null,
      e2e: loaded['quality-reports/final-evidence/e2e-full.json'] || null,
      childMind: loaded['quality-reports/final-evidence/child-mind-bands.json'] || null,
      fromAnalysis: analysis.finalEvidence || null
    },
    productAcceptance: {
      decision: loaded['PRODUCT_ACCEPTANCE_DECISION.json'] || {},
      fromAnalysis: analysis.productAcceptance || null
    },
    projectState: loaded['PROJECT_STATE.json'] || {},
    qualityScore: loaded['QUALITY_SCORE.json'] || {},
    blockers: loaded['BLOCKERS.json'] || {},
    stageProgress: analysis.stageProgressView || analysis.currentAutonomousStage || {},
    gameProgressMatrix: analysis.gameProgressMatrix || {},
    semanticQualityMatrix: analysis.semanticQualityMatrix || analysis.semanticRepeat || {},
    familyQualityDetails: analysis.familyQualityDetail || analysis.familyStatus || {},
    optionQuality: {
      optionQuality: analysis.optionQuality || {},
      stage06OptionQualityInfra: analysis.stage06OptionQualityInfra || {}
    },
    difficultyQuality: analysis.difficultyCompliance || {},
    solverResults: loaded['quality-reports/final-evidence/solver-50k.json'] || {},
    childMindResults: loaded['quality-reports/final-evidence/child-mind-bands.json'] || {},
    annualStudentCapacity: loaded['quality-reports/product-acceptance/annual-student.json'] || {},
    class30Capacity: loaded['quality-reports/product-acceptance/class-30.json'] || {},
    perceivedDiversity: loaded['quality-reports/product-acceptance/perceived-diversity.json'] || {},
    contentReviewSamples: loaded['quality-reports/product-acceptance/content-review-samples.json'] || {},
    liveGeneratedQuestionSamples: analysis.liveGeneratedQuestionSamples || {},
    testResults: {
      lastTestCommandsAndResults: analysis.lastTestCommandsAndResults || [],
      lastAutomatedAction: analysis.lastAutomatedAction || null
    },
    quotaAndTestCost: analysis.testCostAndQuota || {},
    contextSnapshot: loaded['md/arsiv/CONTEXT_SNAPSHOT.md'] || '',
    recentEvents: Array.isArray(live.recentEvents) ? live.recentEvents : [],
    dashboardComputedValues: {
      deferLegacyEvidence: ['RUNNING', 'STARTING', 'STALLED'].includes(live.status),
      productReadyEffective: trusted.wholeProductReady === true,
      partialSafePilot: trusted.releaseStatus === 'PARTIAL_SAFE_PILOT',
      safeGameCount: trusted.summary?.safeGameCount ?? 0,
      safeCellCount: trusted.summary?.safeCellCount ?? 0,
      approvedAssignments: trusted.summary?.approvedQuestionAssignmentCount ?? trusted.summary?.approvedQuestionAssignments ?? 0,
      liveStatus: trusted.releaseStatus || live.status || 'IDLE'
    },
    sourceHealth,
    rawSources
  };
  const text = JSON.stringify(data, null, 2);
  JSON.parse(text);
  data.exportMeta.exportSizeBytes = new TextEncoder().encode(text).length;
  const finalText = JSON.stringify(data, null, 2);
  return { text: finalText, data, bytes: new TextEncoder().encode(finalText).length };
}

export function successMessage(bundle) {
  const meta = bundle.data?.exportMeta || {};
  const liveStatus = bundle.data?.currentLiveOperation?.status || meta.liveStatus || 'IDLE';
  const size = formatSize(meta.exportSizeBytes || bundle.bytes || 0);
  if (bundle.kind === 'chatgpt-share' || meta.kind === 'chatgpt-share') {
    const shards = meta.failedShardCount ?? bundle.data?.failedShards?.length ?? 0;
    const freshness = meta.dataFreshness || '';
    const base = `ChatGPT JSON’u kopyalandı — ${size}, ${shards} başarısız shard, durum ${liveStatus}`;
    if (freshness === 'STALE') {
      return { level: 'warn', text: `${base} (STALE)` };
    }
    if (freshness === 'PARTIAL') {
      return { level: 'warn', text: `${base} (PARTIAL — bazı kaynaklar eksik)` };
    }
    return { level: 'success', text: base };
  }
  const sections = meta.sectionCount || 28;
  const sources = meta.sourceCount || 0;
  const missing = Number(meta.missingRequiredCount || 0);
  if (missing > 0 || meta.dataFreshness === 'PARTIAL') {
    return {
      level: 'warn',
      text: `Tam JSON hazır — ${missing} zorunlu kaynak eksik. — ${sections} bölüm, ${sources} kaynak, ${size}, ${liveStatus}`
    };
  }
  return {
    level: 'success',
    text: `Tam JSON dosyası hazır — ${sections} bölüm, ${sources} kaynak, ${size}, ${liveStatus}`
  };
}

export function timestampFilename(prefix = 'zihin-arenasi-komuta-merkezi') {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  return `${prefix}-${stamp}.json`;
}
