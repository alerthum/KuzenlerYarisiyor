/**
 * Soru Motoru Komuta Merkezi — birleşik export builder.
 * Atomik yazım; secret redaction; eksik kaynak PARTIAL.
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync
} from 'node:fs';
import { dirname, join } from 'node:path';

export const EXPORT_PATH = 'public/question-engine-command-center-export.json';

const SECRET_KEY_RE = /(private[_-]?key|refresh[_-]?token|access[_-]?token|id[_-]?token|api[_-]?key|apikey|password|passwd|secret|serviceAccount|client_secret|authorization|cookie|session[_-]?secret)/i;
const SECRET_VALUE_RE = /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----|AIza[0-9A-Za-z_-]{20,}|ya29\.[0-9A-Za-z._-]+/i;

export const REQUIRED_SOURCES = Object.freeze([
  'public/trusted-live-release.json',
  'public/question-engine-analysis.json',
  'PRODUCT_ACCEPTANCE_DECISION.json',
  'FINAL_EVIDENCE_INDEX.json',
  'PROJECT_STATE.json',
  'QUALITY_SCORE.json',
  'BLOCKERS.json',
  'md/arsiv/CONTEXT_SNAPSHOT.md'
]);

export const OPTIONAL_SOURCES = Object.freeze([
  'public/strict-audit-live.json',
  'quality-reports/strict-audit-progress.json',
  'quality-reports/strict-audit-checkpoint.json',
  'FINAL_RELEASE_DECISION.json',
  'quality-reports/product-acceptance/annual-student.json',
  'quality-reports/product-acceptance/class-30.json',
  'quality-reports/product-acceptance/perceived-diversity.json',
  'quality-reports/product-acceptance/content-review-samples.json',
  'quality-reports/final-evidence/solver-50k.json',
  'quality-reports/final-evidence/options-10k.json',
  'quality-reports/final-evidence/e2e-full.json',
  'quality-reports/final-evidence/stage09-500.json',
  'quality-reports/final-evidence/child-mind-bands.json',
  'quality-reports/stage05-15-metrics.json',
  'package.json'
]);

export const EXPORT_SECTION_KEYS = Object.freeze([
  'trustedLiveRelease',
  'currentLiveOperation',
  'strictAuditProgress',
  'questionEngineAnalysis',
  'technicalQuality',
  'finalEvidence',
  'productAcceptance',
  'projectState',
  'qualityScore',
  'blockers',
  'stageProgress',
  'gameProgressMatrix',
  'semanticQualityMatrix',
  'familyQualityDetails',
  'optionQuality',
  'difficultyQuality',
  'solverResults',
  'childMindResults',
  'annualStudentCapacity',
  'class30Capacity',
  'perceivedDiversity',
  'contentReviewSamples',
  'liveGeneratedQuestionSamples',
  'testResults',
  'quotaAndTestCost',
  'contextSnapshot',
  'recentEvents',
  'dashboardComputedValues',
  'sourceHealth',
  'rawSources'
]);

export function atomicWriteJson(filePath, data) {
  const dir = dirname(filePath);
  mkdirSync(dir, { recursive: true });
  const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  const payload = typeof data === 'string' ? data : `${JSON.stringify(data, null, 2)}\n`;
  writeFileSync(tmp, payload, 'utf8');
  try {
    renameSync(tmp, filePath);
  } catch {
    try { unlinkSync(filePath); } catch { /* ignore */ }
    renameSync(tmp, filePath);
  }
  return filePath;
}

export function redactSecrets(value, path = '', warnings = []) {
  if (value == null) return value;
  if (typeof value === 'string') {
    if (SECRET_VALUE_RE.test(value) || (SECRET_KEY_RE.test(path) && value.length > 8)) {
      warnings.push({ path, reason: 'secret_value_masked' });
      return '[REDACTED_SECRET]';
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item, i) => redactSecrets(item, `${path}[${i}]`, warnings));
  }
  if (typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      const child = path ? `${path}.${k}` : k;
      if (SECRET_KEY_RE.test(k)) {
        warnings.push({ path: child, reason: 'secret_key_masked' });
        out[k] = '[REDACTED_SECRET]';
      } else {
        out[k] = redactSecrets(v, child, warnings);
      }
    }
    return out;
  }
  return value;
}

function readSource(path, { required = false } = {}) {
  const health = {
    source: path,
    required,
    status: 'MISSING',
    updatedAt: null,
    error: null
  };
  try {
    if (!existsSync(path)) {
      health.error = 'file_not_found';
      return { health, data: required ? null : null, raw: null };
    }
    const st = statSync(path);
    health.updatedAt = st.mtime.toISOString();
    const text = readFileSync(path, 'utf8');
    if (path.endsWith('.md') || path.endsWith('.txt')) {
      health.status = 'OK';
      return { health, data: text, raw: text };
    }
    try {
      const parsed = JSON.parse(text);
      health.status = 'OK';
      return { health, data: parsed, raw: parsed };
    } catch (err) {
      health.status = 'INVALID';
      health.error = err?.message || 'invalid_json';
      return { health, data: null, raw: text };
    }
  } catch (err) {
    health.status = 'MISSING';
    health.error = err?.message || 'read_error';
    return { health, data: null, raw: null };
  }
}

function listFinalEvidenceExtras() {
  const dir = 'quality-reports/final-evidence';
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => join(dir, f).replace(/\\/g, '/'));
}

export function buildCommandCenterExport(options = {}) {
  const securityWarnings = [];
  const sourceHealth = [];
  const rawSources = {};
  const loaded = {};

  const allPaths = [
    ...REQUIRED_SOURCES.map((p) => ({ path: p, required: true })),
    ...OPTIONAL_SOURCES.map((p) => ({ path: p, required: false })),
    ...listFinalEvidenceExtras()
      .filter((p) => !OPTIONAL_SOURCES.includes(p))
      .map((p) => ({ path: p, required: false }))
  ];

  // Deduplicate paths
  const seen = new Set();
  for (const entry of allPaths) {
    if (seen.has(entry.path)) continue;
    seen.add(entry.path);
    const { health, data, raw } = readSource(entry.path, { required: entry.required });
    // STALE: 24h+ for required live file while status claims RUNNING — soft signal
    if (health.status === 'OK' && entry.path === 'public/strict-audit-live.json' && data?.updatedAt) {
      const age = Date.now() - Date.parse(data.updatedAt);
      if (Number.isFinite(age) && age > 6 * 3600 * 1000 && ['RUNNING', 'STARTING'].includes(data.status)) {
        health.status = 'STALE';
      }
    }
    sourceHealth.push(health);
    if (raw != null) {
      const redacted = redactSecrets(raw, entry.path, securityWarnings);
      rawSources[entry.path] = redacted;
      loaded[entry.path] = redacted;
    } else {
      rawSources[entry.path] = null;
      loaded[entry.path] = null;
    }
  }

  if (securityWarnings.length) {
    sourceHealth.push({
      source: '__security__',
      required: false,
      status: 'OK',
      updatedAt: new Date().toISOString(),
      error: null,
      securityWarnings
    });
  }

  const analysis = loaded['public/question-engine-analysis.json'] || {};
  const trusted = loaded['public/trusted-live-release.json'] || {};
  const live = loaded['public/strict-audit-live.json'] || {};
  const progress = loaded['quality-reports/strict-audit-progress.json'] || {};
  const decision = loaded['PRODUCT_ACCEPTANCE_DECISION.json'] || {};
  const evidence = loaded['FINAL_EVIDENCE_INDEX.json'] || {};
  const release = loaded['FINAL_RELEASE_DECISION.json'] || {};
  const projectState = loaded['PROJECT_STATE.json'] || {};
  const qualityScore = loaded['QUALITY_SCORE.json'] || {};
  const blockers = loaded['BLOCKERS.json'] || {};
  const pkg = loaded['package.json'] || {};
  const annual = loaded['quality-reports/product-acceptance/annual-student.json'] || {};
  const class30 = loaded['quality-reports/product-acceptance/class-30.json'] || {};
  const perceived = loaded['quality-reports/product-acceptance/perceived-diversity.json'] || {};
  const content = loaded['quality-reports/product-acceptance/content-review-samples.json'] || {};

  const missingRequired = sourceHealth.filter((h) => h.required && h.status !== 'OK' && h.status !== 'STALE');
  const dataFreshness = missingRequired.length
    ? 'PARTIAL'
    : (trusted?.generatedAt ? 'LIVE' : 'STALE');

  const dashboardComputedValues = {
    deferLegacyEvidence: ['RUNNING', 'STARTING', 'STALLED'].includes(live?.status),
    productReadyEffective: trusted?.wholeProductReady === true,
    partialSafePilot: trusted?.releaseStatus === 'PARTIAL_SAFE_PILOT',
    safeGameCount: trusted?.summary?.safeGameCount ?? 0,
    safeCellCount: trusted?.summary?.safeCellCount ?? 0,
    approvedAssignments: trusted?.summary?.approvedQuestionAssignmentCount ?? trusted?.summary?.approvedQuestionAssignments ?? 0,
    technicalScorePercent: analysis?.technicalQualityScorePercent ?? analysis?.overallQualityScorePercent ?? null,
    finalEvidenceAdequacy: evidence?.finalEvidenceAdequacy || analysis?.finalEvidenceAdequacy || null,
    liveStatus: live?.status || 'IDLE',
    livePhase: live?.phase || null,
    liveElapsedSeconds: live?.elapsedSeconds ?? null,
    completedGames: live?.completedGames ?? null,
    progressPercent: live?.progressPercent ?? null,
    underfillCount: live?.underfillCount ?? null,
    openHighBlockers: blockers?.openHighCount ?? null,
    openCriticalBlockers: blockers?.openCriticalCount ?? null,
    analysisGeneratedAt: analysis?.generatedAt || null,
    decisionUpdatedAt: decision?.updatedAt || null
  };

  const exportDoc = {
    schemaVersion: '1.0',
    exportMeta: {
      exportedAt: new Date().toISOString(),
      projectName: 'Zihin Arenası',
      screen: 'Soru Motoru Komuta Merkezi',
      appVersion: pkg.version || analysis?.schemaVersion || 'unknown',
      runId: live?.runId || progress?.runId || null,
      dataFreshness,
      sourceCount: 0,
      exportSizeBytes: 0,
      sectionCount: EXPORT_SECTION_KEYS.length,
      missingRequiredCount: missingRequired.length,
      missingRequiredSources: missingRequired.map((h) => h.source)
    },
    trustedLiveRelease: trusted || {},
    currentLiveOperation: live || {},
    strictAuditProgress: progress || {},
    questionEngineAnalysis: analysis || {},
    technicalQuality: {
      overallQualityScorePercent: analysis?.overallQualityScorePercent ?? null,
      technicalQualityScorePercent: analysis?.technicalQualityScorePercent ?? null,
      currentAutonomousStage: analysis?.currentAutonomousStage || null,
      qualityScoreFile: qualityScore,
      releaseDecision: release
    },
    finalEvidence: {
      index: evidence,
      solver: loaded['quality-reports/final-evidence/solver-50k.json'],
      options: loaded['quality-reports/final-evidence/options-10k.json'],
      e2e: loaded['quality-reports/final-evidence/e2e-full.json'],
      stage09: loaded['quality-reports/final-evidence/stage09-500.json'],
      childMind: loaded['quality-reports/final-evidence/child-mind-bands.json'],
      fromAnalysis: analysis?.finalEvidence || null
    },
    productAcceptance: {
      decision,
      fromAnalysis: analysis?.productAcceptance || null
    },
    projectState,
    qualityScore,
    blockers,
    stageProgress: analysis?.stageProgressView || analysis?.currentAutonomousStage || {},
    gameProgressMatrix: analysis?.gameProgressMatrix || {},
    semanticQualityMatrix: analysis?.semanticQualityMatrix || analysis?.semanticRepeat || {},
    familyQualityDetails: analysis?.familyQualityDetail || analysis?.familyStatus || {},
    optionQuality: {
      optionQuality: analysis?.optionQuality || {},
      stage06OptionQualityInfra: analysis?.stage06OptionQualityInfra || {}
    },
    difficultyQuality: analysis?.difficultyCompliance || {},
    solverResults: loaded['quality-reports/final-evidence/solver-50k.json'] || analysis?.independentSolver || {},
    childMindResults: loaded['quality-reports/final-evidence/child-mind-bands.json'] || {},
    annualStudentCapacity: annual,
    class30Capacity: class30,
    perceivedDiversity: perceived,
    contentReviewSamples: content,
    liveGeneratedQuestionSamples: analysis?.liveGeneratedQuestionSamples || {},
    testResults: {
      lastTestCommandsAndResults: analysis?.lastTestCommandsAndResults || [],
      lastAutomatedAction: analysis?.lastAutomatedAction || null,
      stage05_15_metrics: loaded['quality-reports/stage05-15-metrics.json'] || null,
      e2eFull: loaded['quality-reports/final-evidence/e2e-full.json'] || null
    },
    quotaAndTestCost: analysis?.testCostAndQuota || {},
    contextSnapshot: loaded['md/arsiv/CONTEXT_SNAPSHOT.md'] || '',
    recentEvents: Array.isArray(live?.recentEvents) ? live.recentEvents : [],
    dashboardComputedValues,
    sourceHealth,
    rawSources
  };

  // Also attach any analysis keys not already covered (no section left out)
  const coveredAnalysisKeys = new Set([
    'overallQualityScorePercent', 'technicalQualityScorePercent', 'currentAutonomousStage',
    'finalEvidence', 'productAcceptance', 'stageProgressView', 'gameProgressMatrix',
    'semanticQualityMatrix', 'semanticRepeat', 'familyQualityDetail', 'familyStatus',
    'optionQuality', 'stage06OptionQualityInfra', 'difficultyCompliance',
    'liveGeneratedQuestionSamples', 'lastTestCommandsAndResults', 'lastAutomatedAction',
    'testCostAndQuota', 'finalEvidenceAdequacy', 'blockers', 'generatedAt', 'generatedByStage'
  ]);
  const analysisExtras = {};
  if (analysis && typeof analysis === 'object') {
    for (const [k, v] of Object.entries(analysis)) {
      if (!coveredAnalysisKeys.has(k)) analysisExtras[k] = v;
    }
  }
  exportDoc.questionEngineAnalysisExtras = analysisExtras;

  const text = `${JSON.stringify(exportDoc, null, 2)}\n`;
  // Validate before write
  JSON.parse(text);
  exportDoc.exportMeta.sourceCount = sourceHealth.filter((h) => h.source !== '__security__').length;
  exportDoc.exportMeta.exportSizeBytes = Buffer.byteLength(`${JSON.stringify(exportDoc, null, 2)}\n`, 'utf8');
  const finalText = `${JSON.stringify(exportDoc, null, 2)}\n`;
  JSON.parse(finalText);

  if (options.write !== false) {
    atomicWriteJson(EXPORT_PATH, finalText);
  }

  return {
    exportDoc,
    text: finalText,
    path: EXPORT_PATH,
    meta: exportDoc.exportMeta,
    missingRequired
  };
}

export function buildLiveSummaryExport(exportDoc) {
  const trusted = exportDoc?.trustedLiveRelease || {};
  const live = exportDoc?.currentLiveOperation || {};
  return {
    schemaVersion: '1.0',
    kind: 'live-operation-summary',
    exportedAt: new Date().toISOString(),
    status: trusted.releaseStatus || live.status || null,
    wholeProductReady: trusted.wholeProductReady === true,
    safeGameCount: trusted.summary?.safeGameCount ?? 0,
    safeCellCount: trusted.summary?.safeCellCount ?? 0,
    approvedQuestionAssignments: trusted.summary?.approvedQuestionAssignments ?? 0,
    fallbackToLegacyAllowed: trusted.fallbackToLegacyAllowed === true,
    currentTask: trusted.currentWork?.currentTask || null,
    nextAction: trusted.currentWork?.nextAction || null,
    phase: live.phase || null,
    phaseLabel: live.phaseLabel || null,
    elapsedSeconds: live.elapsedSeconds ?? null,
    startedAt: live.startedAt || null,
    lastHeartbeatAt: live.lastHeartbeatAt || null,
    lastActivityMessage: live.lastActivityMessage || null,
    currentGameId: live.currentGameId || null,
    currentGradeBand: live.currentGradeBand || null,
    currentSessionIndex: live.currentSessionIndex ?? null,
    checkpoint: live.checkpoint || exportDoc?.strictAuditProgress?.checkpoint || null,
    blockers: {
      openCriticalCount: exportDoc?.blockers?.openCriticalCount ?? null,
      openHighCount: exportDoc?.blockers?.openHighCount ?? null,
      openTitles: [
        ...(exportDoc?.blockers?.blockers || [])
          .filter((b) => b.status === 'OPEN')
          .map((b) => ({ id: b.id, severity: b.severity, title: b.title }))
      ]
    },
    recentEvents: Array.isArray(live.recentEvents) ? live.recentEvents.slice(-20) : [],
    note: 'Bu özet canlı çalışma içindir; eski final kanıtlarla karıştırılmaz.'
  };
}

export function formatSize(bytes) {
  const n = Number(bytes) || 0;
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  if (n >= 1024) return `${Math.round(n / 1024)} KB`;
  return `${n} B`;
}
