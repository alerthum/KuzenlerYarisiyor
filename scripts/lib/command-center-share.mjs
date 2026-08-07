/**
 * ChatGPT için kompakt Komuta Merkezi paylaşım JSON’u.
 * Üst sınır 750 KB. Full export yapısını bozmaz / silmez.
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { gradeBandFromGrade } from './strict-audit-live-state.mjs';
import { atomicWriteJson, formatSize, redactSecrets } from './command-center-export.mjs';

export const SHARE_PATH = 'public/question-engine-command-center-share.json';
export const FULL_EXPORT_PATH = 'public/question-engine-command-center-export.json';
export const MAX_SHARE_BYTES = 750 * 1024;
export const TARGET_SHARE_BYTES_SOFT = 500 * 1024;

function readJson(path, fallback = null) {
  try {
    if (!existsSync(path)) return fallback;
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return fallback;
  }
}

function readText(path, fallback = '') {
  try {
    if (!existsSync(path)) return fallback;
    return readFileSync(path, 'utf8');
  } catch {
    return fallback;
  }
}

function fileMeta(path) {
  try {
    if (!existsSync(path)) return { exists: false, updatedAt: null, bytes: 0 };
    const st = statSync(path);
    return { exists: true, updatedAt: st.mtime.toISOString(), bytes: st.size };
  } catch {
    return { exists: false, updatedAt: null, bytes: 0 };
  }
}

function topCounts(map, limit = 8) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id, count]) => ({ id, count }));
}

function bump(map, key, n = 1) {
  if (!key) return;
  map.set(key, (map.get(key) || 0) + n);
}

function bandOf(event) {
  if (event.gradeBand) return event.gradeBand;
  if (event.grade != null) return gradeBandFromGrade(event.grade);
  return 'unknown';
}

/** progress events → gameId+gradeBand özetleri ve failedShards */
export function summarizeAuditProgress(progress = {}, live = {}) {
  const events = Array.isArray(progress.events) ? progress.events : [];
  const games = progress.games && typeof progress.games === 'object' ? progress.games : {};
  const byShard = new Map();

  const ensure = (gameId, gradeBand) => {
    const key = `${gameId}::${gradeBand}`;
    if (!byShard.has(key)) {
      byShard.set(key, {
        gameId,
        gradeBand,
        sessions: 0,
        underfillSessions: 0,
        capacityFailSessions: 0,
        hangFailSessions: 0,
        requested: 0,
        produced: 0,
        attempted: 0,
        accepted: 0,
        rejected: 0,
        firstFailureSession: null,
        lastFailureSession: null,
        rejectionReasons: new Map(),
        blockedFamilies: new Map(),
        blockedSkeletons: new Map(),
        blockedCx: new Map()
      });
    }
    return byShard.get(key);
  };

  for (const ev of events) {
    const gameId = ev.gameId || 'unknown';
    if (gameId === 'annual-student') continue;
    const gradeBand = bandOf(ev);
    const shard = ensure(gameId, gradeBand);
    const sess = ev.sessionIndex;
    const req = Number(ev.requestedCount || 0);
    const prod = Number(ev.producedCount || 0);
    const rej = Number(ev.rejectedCandidateCount || Math.max(0, req - prod));

    if (ev.status === 'ok' || ev.status === 'underfill' || ev.status === 'capacity_fail') {
      shard.sessions += 1;
      shard.requested += req;
      shard.produced += prod;
      shard.accepted += prod;
      shard.rejected += rej;
      shard.attempted += prod + rej;
    }
    if (ev.status === 'underfill' || ev.status === 'capacity_fail' || ev.status === 'hang_fail') {
      if (ev.status === 'underfill') shard.underfillSessions += 1;
      if (ev.status === 'capacity_fail') shard.capacityFailSessions += 1;
      if (ev.status === 'hang_fail') shard.hangFailSessions += 1;
      if (sess != null) {
        if (shard.firstFailureSession == null || sess < shard.firstFailureSession) shard.firstFailureSession = sess;
        if (shard.lastFailureSession == null || sess > shard.lastFailureSession) shard.lastFailureSession = sess;
      }
      const reason = ev.rejectionReasons?.[0]
        || (ev.status === 'capacity_fail' ? 'capacity_underfill' : ev.status)
        || 'unknown';
      bump(shard.rejectionReasons, reason);
      for (const id of ev.blockedFamilyIds || []) bump(shard.blockedFamilies, id);
      for (const id of ev.blockedSkeletonIds || []) bump(shard.blockedSkeletons, id);
      for (const id of ev.blockedCognitiveExperienceIds || []) bump(shard.blockedCx, id);
    }
  }

  // games map doldurucu
  for (const [gameId, g] of Object.entries(games)) {
    const shard = ensure(gameId, 'all');
    shard.sessions = Math.max(shard.sessions, Number(g.sessions || 0));
    shard.underfillSessions = Math.max(shard.underfillSessions, Number(g.underfill || 0));
    shard.capacityFailSessions = Math.max(shard.capacityFailSessions, Number(g.capacityFails || 0));
  }

  const gameBandSummary = [];
  const failedShards = [];
  const globalReject = new Map();
  const globalFam = new Map();
  const globalSkel = new Map();
  const globalCx = new Map();

  for (const shard of byShard.values()) {
    const fillRate = shard.requested ? Number((shard.produced / shard.requested).toFixed(3)) : null;
    const underfillRate = shard.sessions
      ? Number(((shard.underfillSessions + shard.capacityFailSessions) / shard.sessions).toFixed(3))
      : null;
    const row = {
      gameId: shard.gameId,
      gradeBand: shard.gradeBand,
      sessions: shard.sessions,
      requested: shard.requested,
      produced: shard.produced,
      fillRate,
      underfillRate,
      attempted: shard.attempted,
      accepted: shard.accepted,
      rejected: shard.rejected,
      underfillSessions: shard.underfillSessions,
      capacityFailSessions: shard.capacityFailSessions
    };
    gameBandSummary.push(row);

    const failed = shard.underfillSessions + shard.capacityFailSessions + shard.hangFailSessions > 0
      || (fillRate != null && fillRate < 1);
    if (failed && shard.gradeBand !== 'all') {
      const failRow = {
        ...row,
        firstFailureSession: shard.firstFailureSession,
        lastFailureSession: shard.lastFailureSession,
        topRejectionReasons: topCounts(shard.rejectionReasons, 5),
        topBlockedFamilies: topCounts(shard.blockedFamilies, 6),
        topBlockedSkeletons: topCounts(shard.blockedSkeletons, 6),
        topBlockedCognitiveExperiences: topCounts(shard.blockedCx, 6)
      };
      failedShards.push(failRow);
      for (const [k, v] of shard.rejectionReasons) bump(globalReject, k, v);
      for (const [k, v] of shard.blockedFamilies) bump(globalFam, k, v);
      for (const [k, v] of shard.blockedSkeletons) bump(globalSkel, k, v);
      for (const [k, v] of shard.blockedCx) bump(globalCx, k, v);
    }
  }

  failedShards.sort((a, b) => (b.rejected + b.capacityFailSessions) - (a.rejected + a.capacityFailSessions));
  gameBandSummary.sort((a, b) => String(a.gameId).localeCompare(String(b.gameId))
    || String(a.gradeBand).localeCompare(String(b.gradeBand)));

  return {
    auditSummary: {
      runId: progress.runId || live.runId || null,
      mode: progress.mode || null,
      resume: Boolean(progress.resume),
      status: live.status || null,
      startedAt: live.startedAt || progress.startedAt || null,
      finishedAt: live.finishedAt || null,
      elapsedSeconds: live.elapsedSeconds ?? (progress.elapsedMs != null ? Math.floor(Number(progress.elapsedMs) / 1000) : null),
      completedWorkUnits: live.completedWorkUnits ?? progress.completedWorkUnits ?? null,
      totalWorkUnits: live.totalWorkUnits ?? progress.totalWorkUnits ?? null,
      progressPercent: live.progressPercent ?? null,
      underfillCount: live.underfillCount ?? null,
      attemptedCandidates: live.attemptedCandidates ?? null,
      acceptedCandidates: live.acceptedCandidates ?? null,
      rejectedCandidates: live.rejectedCandidates ?? null,
      eventCountInProgressFile: events.length,
      gameCountTracked: Object.keys(games).length,
      checkpoint: live.checkpoint || progress.checkpoint || null,
      hangFail: live.hangFail || progress.hangFail || null,
      decisionInProgress: progress.decision || null
    },
    gameBandSummary: gameBandSummary.slice(0, 200),
    failedShards: failedShards.slice(0, 120),
    topRejectionReasons: topCounts(globalReject, 15),
    blockedFamilySummary: topCounts(globalFam, 20),
    blockedSkeletonSummary: topCounts(globalSkel, 20),
    blockedCognitiveExperienceSummary: topCounts(globalCx, 20)
  };
}

function pickRepresentativeSamples(samples = [], {
  max = 30,
  perFailureFamily = 2,
  onlyFailed = false
} = {}) {
  const out = [];
  const famCounts = new Map();
  const seenCx = new Set();
  const seenSkel = new Set();
  for (const s of samples) {
    if (out.length >= max) break;
    const violations = Array.isArray(s.contentQualityViolations) ? s.contentQualityViolations : [];
    const failed = onlyFailed
      ? (violations.length > 0 || !s.question || s.correctAnswer == null || s.correctAnswer === '')
      : true;
    if (onlyFailed && !failed) continue;
    const fam = s.familyId || 'unknown';
    const cx = s.cognitiveExperienceId || s.perceivedSimilarityCluster || null;
    const sk = s.skeletonId || null;
    if (cx && seenCx.has(cx)) continue;
    if (sk && seenSkel.has(sk) && (famCounts.get(fam) || 0) >= 1) continue;
    if ((famCounts.get(fam) || 0) >= perFailureFamily) continue;
    famCounts.set(fam, (famCounts.get(fam) || 0) + 1);
    if (cx) seenCx.add(cx);
    if (sk) seenSkel.add(sk);
    out.push({
      gameId: s.gameId || null,
      ageBand: s.ageBand || null,
      grade: s.grade ?? null,
      familyId: s.familyId || null,
      skeletonId: s.skeletonId || null,
      cognitiveExperienceId: s.cognitiveExperienceId || null,
      question: String(s.question || s.prompt || '').slice(0, 280),
      correctAnswer: s.correctAnswer != null ? String(s.correctAnswer).slice(0, 120) : null,
      contentQualityViolations: violations.slice(0, 6),
      perceivedSimilarityCluster: s.perceivedSimilarityCluster || null
    });
  }
  return out;
}

function summarizeBlockers(blockersDoc = {}) {
  const all = Array.isArray(blockersDoc.blockers) ? blockersDoc.blockers : [];
  const open = all.filter((b) => b.status === 'OPEN' || b.status === 'open');
  const closed = all.filter((b) => !(b.status === 'OPEN' || b.status === 'open'));
  return {
    open,
    closedSummary: {
      count: closed.length,
      bySeverity: closed.reduce((acc, b) => {
        const k = b.severity || 'UNKNOWN';
        acc[k] = (acc[k] || 0) + 1;
        return acc;
      }, {})
    },
    openCriticalCount: blockersDoc.openCriticalCount ?? open.filter((b) => b.severity === 'CRITICAL').length,
    openHighCount: blockersDoc.openHighCount ?? open.filter((b) => b.severity === 'HIGH').length,
    openMediumCount: blockersDoc.openMediumCount ?? open.filter((b) => b.severity === 'MEDIUM').length
  };
}

function sourceHealthCompact(paths) {
  return paths.map(({ path, required }) => {
    const meta = fileMeta(path);
    let status = meta.exists ? 'OK' : 'MISSING';
    let error = meta.exists ? null : 'file_not_found';
    if (meta.exists && path.endsWith('.json')) {
      try {
        JSON.parse(readFileSync(path, 'utf8'));
      } catch (err) {
        status = 'INVALID';
        error = err?.message || 'invalid_json';
      }
    }
    return {
      source: path,
      required,
      status,
      updatedAt: meta.updatedAt,
      error,
      bytes: meta.bytes
    };
  });
}

function byteSize(obj) {
  return Buffer.byteLength(JSON.stringify(obj), 'utf8');
}

function shrinkShare(doc) {
  // 750KB üstüyse büyük listeleri kademeli kes; kritik karar/blocker/fail shard silinmez.
  const steps = [
    () => { doc.representativeQuestionSamples = (doc.representativeQuestionSamples || []).slice(0, 12); },
    () => { doc.gameBandSummary = (doc.gameBandSummary || []).slice(0, 80); },
    () => {
      doc.failedShards = (doc.failedShards || []).slice(0, 60).map((s) => ({
        ...s,
        topBlockedFamilies: (s.topBlockedFamilies || []).slice(0, 3),
        topBlockedSkeletons: (s.topBlockedSkeletons || []).slice(0, 3),
        topBlockedCognitiveExperiences: (s.topBlockedCognitiveExperiences || []).slice(0, 3)
      }));
    },
    () => { doc.recentEvents = (doc.recentEvents || []).slice(-15); },
    () => {
      doc.blockedFamilySummary = (doc.blockedFamilySummary || []).slice(0, 10);
      doc.blockedSkeletonSummary = (doc.blockedSkeletonSummary || []).slice(0, 10);
      doc.blockedCognitiveExperienceSummary = (doc.blockedCognitiveExperienceSummary || []).slice(0, 10);
    },
    () => { doc.representativeQuestionSamples = (doc.representativeQuestionSamples || []).slice(0, 6); },
    () => { doc.gameBandSummary = (doc.gameBandSummary || []).filter((g) => (g.underfillRate || 0) > 0 || (g.fillRate != null && g.fillRate < 1)).slice(0, 40); }
  ];
  let i = 0;
  while (byteSize(doc) > MAX_SHARE_BYTES && i < steps.length) {
    steps[i]();
    doc.omittedData = doc.omittedData || {};
    doc.omittedData.sizeGuardApplied = true;
    doc.omittedData.sizeGuardStep = i;
    i += 1;
  }
  // Hâlâ büyükse — rastgele metin kesme YOK; yalnız örnek soru metinlerini kısalt
  if (byteSize(doc) > MAX_SHARE_BYTES) {
    doc.representativeQuestionSamples = (doc.representativeQuestionSamples || []).map((s) => ({
      ...s,
      question: String(s.question || '').slice(0, 120),
      correctAnswer: s.correctAnswer != null ? String(s.correctAnswer).slice(0, 60) : null
    }));
    doc.omittedData.questionTextTruncated = true;
  }
  return doc;
}

export function buildCommandCenterShare({ write = true } = {}) {
  const securityWarnings = [];
  const trusted = readJson('public/trusted-live-release.json', {});
  const liveRaw = readJson('public/strict-audit-live.json', {});
  const progress = readJson('quality-reports/strict-audit-progress.json', {});
  const decision = readJson('PRODUCT_ACCEPTANCE_DECISION.json', {});
  const analysis = readJson('public/question-engine-analysis.json', {});
  const qualityScore = readJson('QUALITY_SCORE.json', {});
  const projectState = readJson('PROJECT_STATE.json', {});
  const blockersDoc = readJson('BLOCKERS.json', {});
  const annual = readJson('quality-reports/product-acceptance/annual-student.json', {});
  const class30 = readJson('quality-reports/product-acceptance/class-30.json', {});
  const perceived = readJson('quality-reports/product-acceptance/perceived-diversity.json', {});
  const content = readJson('quality-reports/product-acceptance/content-review-samples.json', {});
  const evidence = readJson('FINAL_EVIDENCE_INDEX.json', {});
  const pkg = readJson('package.json', {});
  const capacityDiagnosis = readJson('quality-reports/capacity-policy-v1-diagnosis.json', null);
  const counterfactual = readJson('quality-reports/repetition-policy-counterfactual.json', null);
  const capacityDev = readJson('quality-reports/capacity-development-live.json', null);

  const live = redactSecrets({ ...liveRaw }, 'live', securityWarnings);
  if (Array.isArray(live.recentEvents)) live.recentEvents = live.recentEvents.slice(-30);

  const audit = summarizeAuditProgress(progress, live);
  const blockerSummary = summarizeBlockers(blockersDoc);

  const contentSamples = Array.isArray(content.samples) ? content.samples : [];
  const liveSamples = Array.isArray(analysis.liveGeneratedQuestionSamples?.samples)
    ? analysis.liveGeneratedQuestionSamples.samples
    : [];

  const failedContentSamples = pickRepresentativeSamples(contentSamples, {
    max: 30,
    perFailureFamily: 2,
    onlyFailed: true
  });
  // Başarısız yoksa yine sınırlı temsilî örnek
  const representativeQuestionSamples = failedContentSamples.length
    ? failedContentSamples
    : [
      ...pickRepresentativeSamples(contentSamples, { max: 15, perFailureFamily: 1, onlyFailed: false }),
      ...pickRepresentativeSamples(liveSamples, { max: 20, perFailureFamily: 1, onlyFailed: false })
    ].slice(0, 20);

  const health = sourceHealthCompact([
    { path: 'public/trusted-live-release.json', required: true },
    { path: 'public/strict-audit-live.json', required: false },
    { path: 'public/question-engine-analysis.json', required: true },
    { path: 'PRODUCT_ACCEPTANCE_DECISION.json', required: true },
    { path: 'QUALITY_SCORE.json', required: true },
    { path: 'PROJECT_STATE.json', required: true },
    { path: 'BLOCKERS.json', required: true },
    { path: 'quality-reports/strict-audit-progress.json', required: false },
    { path: 'quality-reports/product-acceptance/annual-student.json', required: false },
    { path: 'quality-reports/product-acceptance/class-30.json', required: false },
    { path: 'quality-reports/product-acceptance/content-review-samples.json', required: false },
    { path: FULL_EXPORT_PATH, required: false }
  ]);
  if (securityWarnings.length) {
    health.push({
      source: '__security__',
      required: false,
      status: 'OK',
      updatedAt: new Date().toISOString(),
      error: null,
      securityWarnings: securityWarnings.slice(0, 20)
    });
  }

  const trustedUpdated = Date.parse(trusted.generatedAt || 0);
  const trustedAgeMs = Date.now() - (Number.isFinite(trustedUpdated) ? trustedUpdated : 0);
  const missingRequired = health.filter((h) => h.required && h.status !== 'OK');
  let dataFreshness = missingRequired.length ? 'PARTIAL' : 'LIVE';
  if (!Number.isFinite(trustedUpdated) || trustedAgeMs > 30 * 24 * 60 * 60 * 1000) {
    dataFreshness = missingRequired.length ? 'PARTIAL' : 'STALE';
  }

  const fullMeta = fileMeta(FULL_EXPORT_PATH);
  const originalSizeBytes = fullMeta.bytes || 0;

  const omittedSections = [
    { section: 'rawSources', reason: 'Full export içinde mevcut', originalItemCount: null },
    { section: 'contentReviewSamples.samples', reason: 'Tam dizi yerine en fazla 30 temsilî örnek', originalItemCount: contentSamples.length },
    { section: 'strictAuditProgress.events', reason: 'Binlerce event yerine shard özetleri', originalItemCount: Array.isArray(progress.events) ? progress.events.length : 0 },
    { section: 'solver-50k', reason: 'Full export / final-evidence içinde', originalItemCount: null },
    { section: 'options-10k', reason: 'Full export / final-evidence içinde', originalItemCount: null },
    { section: 'md/arsiv/CONTEXT_SNAPSHOT.md full text', reason: 'Full export içinde; kompaktta yok', originalItemCount: 1 },
    { section: 'liveGeneratedQuestionSamples full', reason: 'En fazla 20 temsilî soru', originalItemCount: liveSamples.length }
  ];

  let doc = {
    schemaVersion: '1.0',
    exportMeta: {
      exportedAt: new Date().toISOString(),
      projectName: 'Zihin Arenası',
      screen: 'Soru Motoru Komuta Merkezi',
      kind: 'chatgpt-share',
      appVersion: pkg.version || 'unknown',
      runId: live.runId || trusted.runId || null,
      dataFreshness,
      sourceCount: health.filter((h) => h.source !== '__security__').length,
      liveStatus: trusted.releaseStatus || live.status || null,
      compactMaxBytes: MAX_SHARE_BYTES
    },
    currentTruth: {
      status: trusted.releaseStatus || 'BLOCKED',
      wholeProductReady: trusted.wholeProductReady === true,
      productReady: trusted.productReady === true,
      partialSafePilotAllowed: trusted.publicationAllowed === true,
      publicationMode: trusted.publicationMode || null,
      fallbackToLegacyAllowed: trusted.fallbackToLegacyAllowed === true,
      policyVersion: trusted.policyVersion || null,
      safeGameCount: trusted.summary?.safeGameCount ?? 0,
      totalGameCount: trusted.summary?.totalGameCount ?? 23,
      safeCellCount: trusted.summary?.safeCellCount ?? 0,
      approvedQuestionAssignments: trusted.summary?.approvedQuestionAssignments ?? 0,
      uniqueApprovedQuestionCount: trusted.summary?.uniqueApprovedQuestionCount ?? 0,
      finalSurfaceReview: {
        status: trusted.summary?.finalSurfaceReviewStatus || 'NOT_GENERATED',
        reviewed: trusted.summary?.finalSurfaceReviewedQuestionCount ?? 0,
        failed: trusted.summary?.finalSurfaceFailedQuestionCount ?? null,
        legacyFallbackDetected: trusted.summary?.legacyFallbackDetected ?? null
      },
      note: 'Bu alan güncel yayın gerçeğidir. Eski Stage 14/15 PASS sayaçları ürünün tamamı için geçerli kabul edilmez.'
    },
    safeCells: Array.isArray(trusted.safeCells) ? trusted.safeCells : [],
    blockedScopes: Array.isArray(trusted.blockedPriorities) ? trusted.blockedPriorities : [],
    currentWork: {
      status: trusted.currentWork?.status || live.status || null,
      currentTask: trusted.currentWork?.currentTask || live.currentTask || null,
      completed: Array.isArray(trusted.currentWork?.completed) ? trusted.currentWork.completed : [],
      nextAction: trusted.currentWork?.nextAction || live.nextShard || null,
      changedFiles: Array.isArray(trusted.currentWork?.changedFiles) ? trusted.currentWork.changedFiles : [],
      generatedAt: trusted.generatedAt || null
    },
    liveProgress: {
      status: live.status || null,
      phaseLabel: live.phaseLabel || null,
      completedWorkUnits: live.completedWorkUnits ?? null,
      totalWorkUnits: live.totalWorkUnits ?? null,
      progressPercent: live.progressPercent ?? null,
      lastCompletedStep: live.lastCompletedStep || null,
      lastActivityMessage: live.lastActivityMessage || null,
      lastRealTestResult: live.lastRealTestResult || null,
      updatedAt: live.updatedAt || live.lastHeartbeatAt || null,
      recentEvents: Array.isArray(live.recentEvents) ? live.recentEvents.slice(-12) : []
    },
    latestTests: [
      ...(Array.isArray(trusted.latestTests) ? trusted.latestTests : []),
      ...(trusted.latestTest ? [trusted.latestTest] : [])
    ].filter((row, index, rows) => row && rows.findIndex((x) => x?.command === row?.command && x?.result === row?.result) === index),
    currentBlockers: [
      ...(Array.isArray(trusted.blockedPriorities) ? trusted.blockedPriorities.map((item) => ({
        id: item.scope,
        severity: 'BLOCKING_SCOPE',
        title: item.title,
        reason: item.reason
      })) : []),
      {
        id: 'BROWSER_E2E_POLICY',
        severity: 'VERIFICATION_GAP',
        title: 'Gerçek tarayıcı E2E tamamlanmadı',
        reason: 'Çalışma ortamındaki yönetici politikası Chromium çalıştırılmasını engelledi.'
      }
    ],
    legacyDiagnostics: {
      wholeProductAcceptanceDecision: decision.decision || null,
      wholeProductReady: decision.productReady === true,
      historicalOpenBlockerCount: blockerSummary.open.length,
      note: 'Bu bölüm yalnız tarihsel teşhis içindir; güncel yayın kararı currentTruth alanındadır.'
    },
    evidenceFiles: {
      trustedRelease: 'public/trusted-live-release.json',
      finalSurfaceReviewJson: 'quality-reports/trusted-live-review.json',
      finalSurfaceReviewHtml: 'quality-reports/trusted-live-review.html',
      liveProgress: 'public/strict-audit-live.json',
      projectState: 'PROJECT_STATE.json',
      fullTechnicalExport: 'public/question-engine-command-center-export.json'
    },
    sourceHealth: health,
    omittedData: {
      fullExportAvailable: fullMeta.exists,
      fullExportFile: 'question-engine-command-center-export.json',
      omittedSections: [
        { section: 'rawSources', reason: 'Tam teknik export içinde mevcut' },
        { section: 'eski stage/capacity/shard tabloları', reason: 'Güncel yayın kararını karıştırmaması için kompakt paylaşımdan çıkarıldı' },
        { section: 'binlerce eski soru örneği ve event', reason: 'Son-ekran kanıtı ayrı HTML/JSON dosyasındadır' }
      ],
      originalSizeBytes,
      compactSizeBytes: 0,
      compressionRatio: 0
    }
  };
  doc = shrinkShare(doc);
  const warnings = [];
  doc = redactSecrets(doc, 'share', warnings);
  const compactSizeBytes = byteSize(doc);
  doc.omittedData.compactSizeBytes = compactSizeBytes;
  doc.omittedData.compressionRatio = originalSizeBytes
    ? Number((originalSizeBytes / Math.max(1, compactSizeBytes)).toFixed(2))
    : null;
  doc.exportMeta.exportSizeBytes = compactSizeBytes;
  doc.exportMeta.exportSize = formatSize(compactSizeBytes);

  if (compactSizeBytes > MAX_SHARE_BYTES) {
    // Son çare: failedShards dışında uzun dizileri boşalt (kritik kararlar kalır)
    doc.gameBandSummary = [];
    doc.representativeQuestionSamples = doc.representativeQuestionSamples.slice(0, 3);
    doc.omittedData.emergencyTrim = true;
    doc.omittedData.compactSizeBytes = byteSize(doc);
    doc.exportMeta.exportSizeBytes = doc.omittedData.compactSizeBytes;
  }

  const text = `${JSON.stringify(doc, null, 2)}\n`;
  JSON.parse(text);
  if (write) atomicWriteJson(SHARE_PATH, text);

  return {
    shareDoc: doc,
    text,
    path: SHARE_PATH,
    meta: doc.exportMeta,
    bytes: Buffer.byteLength(text, 'utf8')
  };
}

export { formatSize };
