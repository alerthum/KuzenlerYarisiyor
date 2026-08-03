/**
 * Repetition Policy V2 — tek config kaynağı.
 * Gerçek öğrenci davranışı: exact/surface sıkı; aile/iskelet/CX pencereli; lifetime CX yok.
 */

export const REPETITION_POLICY_V2 = Object.freeze({
  version: '2.0',
  scopes: Object.freeze({
    exactQuestion: ['studentId', 'academicYear'],
    surfaceFingerprint: ['studentId', 'academicYear'],
    familySkeletonStructural: ['studentId', 'gameId', 'gradeBand'],
    cognitiveExperience: ['studentId', 'gradeBand'],
    testIsolation: ['scenarioId', 'studentId']
  }),
  exactQuestion: Object.freeze({
    banWithinAcademicYear: true,
    shareAcrossStudents: false,
    globalClassBan: false
  }),
  surfaceFingerprint: Object.freeze({
    banExactSurfaceRepeat: true,
    numberOrNameOnlyDoesNotCountAsNew: true
  }),
  familyId: Object.freeze({
    maxPerSession: 1,
    previousSessionDominantCannotDominateNext: true,
    maxShareLastNSessions: 0.2,
    lookbackSessions: 10,
    lifetimeBan: false
  }),
  skeletonId: Object.freeze({
    maxPerSession: 1,
    forbiddenLookbackSessions: 3,
    lifetimeBan: false
  }),
  structuralId: Object.freeze({
    maxPerSession: 1,
    forbiddenLookbackSessions: 12,
    lifetimeBan: false,
    reusableAfterWindowWithDifferentGraphAndPlan: true
  }),
  cognitiveExperienceId: Object.freeze({
    maxPerSession: 1,
    forbiddenLookbackSessions: 2,
    lifetimeBan: false,
    reusableAfterWindowWithDifferentStructuralSolutionDistractor: true,
    pedagogicalRepracticeAllowed: true
  }),
  safetyBuffer: 0.2
});

function sessionIndexOf(attempt, fallback = 0) {
  if (Number.isFinite(attempt?.sessionIndex)) return Number(attempt.sessionIndex);
  if (Number.isFinite(attempt?.sessionSequence)) return Number(attempt.sessionSequence);
  return fallback;
}

function attemptsForScope(attempts, { gameId, gradeBand, academicYear, scope }) {
  return (attempts || []).filter((a) => {
    if (!a) return false;
    if (scope.includes('gameId') && gameId && a.gameId && a.gameId !== gameId) return false;
    if (scope.includes('gradeBand') && gradeBand != null && a.gradeBand != null && String(a.gradeBand) !== String(gradeBand)) return false;
    if (scope.includes('academicYear') && academicYear != null && a.academicYear != null && String(a.academicYear) !== String(academicYear)) return false;
    return true;
  });
}

function groupBySession(attempts) {
  const map = new Map();
  for (const a of attempts) {
    const idx = sessionIndexOf(a, 0);
    if (!map.has(idx)) map.set(idx, []);
    map.get(idx).push(a);
  }
  return [...map.entries()].sort((x, y) => x[0] - y[0]);
}

function dominantFamily(sessionAttempts) {
  const counts = new Map();
  for (const a of sessionAttempts) {
    if (!a.familyId) continue;
    counts.set(a.familyId, (counts.get(a.familyId) || 0) + 1);
  }
  let best = null;
  let n = 0;
  for (const [id, c] of counts) {
    if (c > n) {
      best = id;
      n = c;
    }
  }
  return best;
}

/**
 * V1 (hatalı) davranış — karşılaştırma testleri için.
 */
export function buildBlockedSetsV1(attempts = [], { gameId } = {}) {
  const gameAttempts = (attempts || []).filter((a) => a && a.gameId === gameId);
  return {
    policyVersion: '1.0',
    recentFamilyIds: [...new Set(gameAttempts.filter((a) => a.familyId).slice(-36).map((a) => a.familyId))],
    recentSkeletonIds: [...new Set(gameAttempts.filter((a) => a.skeletonId).slice(-48).map((a) => a.skeletonId))],
    recentSolutionGraphIds: new Set(gameAttempts.filter((a) => a.solutionGraphId).slice(-48).map((a) => a.solutionGraphId)),
    recentReasoningPathIds: new Set(gameAttempts.filter((a) => a.reasoningPathId).slice(-48).map((a) => a.reasoningPathId)),
    recentCognitiveExperienceIds: new Set(gameAttempts.filter((a) => a.cognitiveExperienceId).map((a) => a.cognitiveExperienceId)),
    recentStructuralIds: new Set(),
    blockedSurfaceFingerprints: new Set(),
    previousDominantFamilyId: null,
    familyShareBlocked: new Set(),
    lifetimeCx: true
  };
}

/**
 * V2 — pencereli, öğrenci/oyun/band kapsamlı.
 */
export function buildBlockedSetsV2(attempts = [], options = {}) {
  const cfg = REPETITION_POLICY_V2;
  const {
    gameId,
    gradeBand = null,
    academicYear = null,
    currentSessionIndex = 0
  } = options;

  const famScope = attemptsForScope(attempts, {
    gameId,
    gradeBand,
    academicYear,
    scope: cfg.scopes.familySkeletonStructural
  });
  const cxScope = attemptsForScope(attempts, {
    gameId: null,
    gradeBand,
    academicYear,
    scope: cfg.scopes.cognitiveExperience
  });
  const exactScope = attemptsForScope(attempts, {
    gameId: null,
    gradeBand: null,
    academicYear,
    scope: cfg.scopes.exactQuestion
  });

  const bySession = groupBySession(famScope);
  const prevSessions = bySession.filter(([idx]) => idx < currentSessionIndex);
  const lookbackSk = cfg.skeletonId.forbiddenLookbackSessions;
  const lookbackSt = cfg.structuralId.forbiddenLookbackSessions;
  const lookbackCx = cfg.cognitiveExperienceId.forbiddenLookbackSessions;
  const lookbackFam = cfg.familyId.lookbackSessions;

  const recentSkeletonIds = new Set();
  const recentStructuralIds = new Set();
  const recentCognitiveExperienceIds = new Set();
  const recentSolutionGraphIds = new Set();
  const recentReasoningPathIds = new Set();

  for (const [idx, sess] of prevSessions) {
    const age = currentSessionIndex - idx;
    for (const a of sess) {
      if (age <= lookbackSk && a.skeletonId) recentSkeletonIds.add(a.skeletonId);
      if (age <= lookbackSt && a.structuralId) recentStructuralIds.add(a.structuralId);
      if (a.solutionGraphId && age <= lookbackSt) recentSolutionGraphIds.add(a.solutionGraphId);
      if (a.reasoningPathId && age <= lookbackSk) recentReasoningPathIds.add(a.reasoningPathId);
    }
  }

  const cxBySession = groupBySession(cxScope);
  for (const [idx, sess] of cxBySession) {
    if (idx >= currentSessionIndex) continue;
    const age = currentSessionIndex - idx;
    if (age > lookbackCx) continue;
    for (const a of sess) {
      if (a.cognitiveExperienceId) recentCognitiveExperienceIds.add(a.cognitiveExperienceId);
    }
  }

  const lastN = prevSessions.slice(-lookbackFam);
  const familyCounts = new Map();
  let totalQs = 0;
  for (const [, sess] of lastN) {
    for (const a of sess) {
      if (!a.familyId) continue;
      totalQs += 1;
      familyCounts.set(a.familyId, (familyCounts.get(a.familyId) || 0) + 1);
    }
  }
  const familyShareBlocked = new Set();
  if (totalQs > 0) {
    for (const [fid, c] of familyCounts) {
      if (c / totalQs > cfg.familyId.maxShareLastNSessions) familyShareBlocked.add(fid);
    }
  }

  const previousDominantFamilyId = prevSessions.length
    ? dominantFamily(prevSessions[prevSessions.length - 1][1])
    : null;

  // Soft recent families: last session families (for ranking) — NOT lifetime
  const recentFamilyIds = prevSessions.length
    ? [...new Set(prevSessions[prevSessions.length - 1][1].map((a) => a.familyId).filter(Boolean))]
    : [];

  // Yalnız dayanıklı yüzey izi (sayı/isim soyut); semanticFingerprint lifetime ban DEĞİLDİR.
  const blockedSurfaceFingerprints = new Set(
    exactScope
      .map((a) => a.durableSurfaceFingerprint || a.surfaceFingerprint)
      .filter(Boolean)
  );

  return {
    policyVersion: cfg.version,
    recentFamilyIds,
    recentSkeletonIds: [...recentSkeletonIds],
    recentStructuralIds,
    recentSolutionGraphIds,
    recentReasoningPathIds,
    recentCognitiveExperienceIds,
    blockedSurfaceFingerprints,
    previousDominantFamilyId,
    familyShareBlocked,
    lifetimeCx: false,
    config: cfg
  };
}

export function buildBlockedSets(attempts, options = {}) {
  const version = options.repetitionPolicyVersion || options.policyVersion || 'v2';
  if (version === 'v1' || version === '1' || version === '1.0') {
    return buildBlockedSetsV1(attempts, options);
  }
  return buildBlockedSetsV2(attempts, options);
}

export function isFamilyAllowedInSession(familyId, sessionFamilies, blocked) {
  const cfg = REPETITION_POLICY_V2.familyId;
  if (!familyId) return false;
  if (sessionFamilies.has(familyId) && cfg.maxPerSession <= 1) return false;
  if (blocked.familyShareBlocked?.has(familyId)) return false;
  return true;
}

export function annotateAttemptMeta(attempt, meta = {}) {
  return {
    ...attempt,
    studentId: meta.studentId ?? attempt.studentId ?? null,
    academicYear: meta.academicYear ?? attempt.academicYear ?? null,
    simulatedDate: meta.simulatedDate ?? attempt.simulatedDate ?? null,
    sessionSequence: meta.sessionSequence ?? attempt.sessionSequence ?? attempt.sessionIndex ?? null,
    sessionIndex: meta.sessionIndex ?? attempt.sessionIndex ?? meta.sessionSequence ?? null,
    gameId: meta.gameId ?? attempt.gameId ?? null,
    gradeBand: meta.gradeBand ?? attempt.gradeBand ?? null
  };
}

export default REPETITION_POLICY_V2;
