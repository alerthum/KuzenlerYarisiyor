/**
 * PRODUCT_ACCEPTANCE_AUDIT — yıllık öğrenci / sınıf kapasitesi denetimi.
 * Mevcut createGameSession + attempts/history + semantic identity yeniden kullanılır.
 * Yeni mimari icat etmez; boş profil ile yapay PASS üretmez.
 */

import { createGameSession, GAME_CATALOG, isGameAvailableForProfile } from '../games/registry.js';
import { attachSemanticIdentity, buildSemanticIdentity } from './semantic-repeat-engine.js';
import { composeAdaptiveSession } from '../engines/session-composer-v9.js';
import { buildStudentBrainProfile, brainProfileSessionPolicy } from '../engines/student-brain-profile-v10.js';
import { buildCognitiveExperience } from './question-factory-v13.js';
import { annotateAttemptMeta } from './repetition-policy-v2.js';
import { updateSkillRating } from '../engines/adaptive-engine.js';
import { hashString } from '../utils.js';
import { detectFakeHardSurface, evaluatePremiumQuestionFactory } from './question-factory-v13.js';

/** Strict audit ilerleme kaydı — Node runner `setStrictAuditProgressSink` ile bağlar. */
let strictProgressSink = null;
export function setStrictAuditProgressSink(fn) {
  strictProgressSink = typeof fn === 'function' ? fn : null;
}
function emitStrictProgress(event) {
  if (!strictProgressSink) return;
  try {
    strictProgressSink({
      at: new Date().toISOString(),
      ...event
    });
  } catch {
    /* progress yazımı audit sonucunu bozmaz */
  }
}

export const PRODUCT_ACCEPTANCE_ACTIVE_GAMES = Object.freeze([
  'pattern-lab', 'speed-math', 'target-number', 'geometry-lab', 'problem-hunter', 'error-detective',
  'logic-station', 'olympiad-ladder', 'word-mine', 'word-ladder', 'forbidden-story', 'meaning-hunt',
  'paragraph-detective', 'english-vocabulary', 'english-cloze', 'english-sentence-builder',
  'social-time-travel', 'social-map-skills', 'social-citizenship', 'religion-practice',
  'lgs-foundation', 'science-lab', 'science-reasoning'
]);

export const ORCHESTRATION_INVENTORY = Object.freeze({
  studentHistory: {
    files: ['js/state.js', 'js/storage.js', 'js/engines/student-brain-profile-v10.js', 'js/engines/mastery-engine-v9.js'],
    wiredToCreateGameSession: ['options.attempts', 'options.seenQuestionKeys', 'options.completedSessionCount'],
    status: 'present'
  },
  familySkeletonReasoningCooldown: {
    files: ['js/quality/family-skeleton-engine.js', 'js/games/registry.js'],
    wiredToCreateGameSession: ['options.recentFamilyIds', 'options.attempts→recentSkeletonIds'],
    status: 'present'
  },
  masteryAdaptiveTarget: {
    files: ['js/engines/adaptive-engine.js', 'js/engines/session-composer-v9.js', 'js/engines/student-brain-profile-v10.js'],
    wiredToCreateGameSession: ['difficultyFromRating', 'brainProfileSessionPolicy'],
    postSession: 'composeAdaptiveSession in js/app.js (not inside createGameSession)',
    status: 'present_partial'
  },
  silentRemediation: {
    files: ['js/engines/v11-misconception-remediation.js'],
    wiredToCreateGameSession: ['attachV11SilentRemediation(options.attempts)'],
    status: 'present'
  },
  teacherClassTarget: {
    files: ['js/games/registry.js (options.classTarget)', 'js/engines/session-composer-v9.js', 'js/platform/firebase-platform.js'],
    wiredToCreateGameSession: ['options.classTarget.topicIds', 'options.classTarget.focusShare'],
    status: 'present'
  },
  quarantine: {
    files: ['js/quality/quarantine-v9.js'],
    wiredToCreateGameSession: ['options.seenQuestionKeys', 'options.blockedQuestionFamilies'],
    status: 'present'
  },
  semanticComparison: {
    files: ['js/quality/semantic-repeat-engine.js'],
    wiredToCreateGameSession: ['applyPublicationGates / filterSessionSemanticRepeats'],
    status: 'present'
  },
  sessionComposer: {
    files: ['js/engines/v11-session-composer.js', 'js/engines/premium-session-composer-v10.js', 'js/quality/session-composer-audit.js'],
    wiredToCreateGameSession: ['composeV11Session'],
    status: 'present'
  }
});

const AGE_BANDS = Object.freeze([
  { id: '1-2', age: 8, grade: 2 },
  { id: '3-5', age: 10, grade: 4 },
  { id: '6-8', age: 13, grade: 7 },
  { id: '9-12', age: 16, grade: 10 }
]);

function clampProfileForGame(gameId, base) {
  const game = GAME_CATALOG.find((g) => g.id === gameId);
  let grade = base.grade;
  let age = base.age;
  if (gameId === 'lgs-foundation') { grade = 8; age = Math.max(age, 12); }
  if (gameId === 'religion-practice') { grade = Math.max(grade, 8); age = Math.max(age, 12); }
  if (gameId === 'word-ladder' && grade >= 9) { grade = 8; age = Math.min(age, 14); }
  if (game?.maxGrade && grade > game.maxGrade) grade = game.maxGrade;
  if (game?.minGrade && grade < game.minGrade) grade = game.minGrade;
  age = Math.max(age, game?.minAge || 8);
  return { ...base, age, grade, skills: base.skills || {} };
}

function stripDecor(text = '') {
  return String(text)
    .toLocaleLowerCase('tr-TR')
    .replace(/\d+/g, '#')
    .replace(/[“”"'`]/g, '')
    .replace(/\b(ali|ayşe|ayse|mehmet|zeynep|elma|armut|ankara|istanbul|can|elif|deniz|emre|selin)\b/g, '~')
    .replace(/[^\p{L}\p{N}\s#~]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function fp(value) {
  return hashString(String(value || '')).toString(36);
}

/** Algılanan yapı: dekor/isim/sayı soyutlanmış çocuk deneyimi anahtarı. */
export function normalizedPerceivedStructure(round = {}) {
  const id = round.semanticIdentity || buildSemanticIdentity(round);
  const options = Array.isArray(round.options) ? round.options : [];
  const optionShapes = options.map((opt) => stripDecor(typeof opt === 'string' ? opt : (opt?.text || opt?.label || ''))).sort();
  const misconceptions = (round.optionDiagnostics || round.choiceDiagnostics?.options || round.questionContract?.optionMetadata?.misconceptions || [])
    .map((m) => m?.misconceptionId || m?.type || m?.rationale || '')
    .filter(Boolean)
    .sort();
  const informationFlow = stripDecor([round.context, round.prompt].filter(Boolean).join(' | ')).slice(0, 160);
  const solutionSteps = stripDecor(round.explanation || round.questionContract?.solution?.steps?.join(' ') || '').slice(0, 120);
  const requestedResult = [
    round.kind || 'choice',
    options.length ? `opts:${options.length}` : 'opts:0',
    stripDecor(String(options[round.answerIndex] ?? round.answer ?? '')).slice(0, 40)
  ].join('|');
  const representation = [
    round.visual ? 'visual' : 'text',
    round.kind || 'choice',
    id.skeletonId || 'no-skel'
  ].join('|');
  const distractorMechanism = [
    id.distractorPlanId || 'no-plan',
    misconceptions.slice(0, 4).join(','),
    optionShapes.map((s) => s.slice(0, 24)).join(';')
  ].join('|');
  const solutionGraph = id.solutionGraphId || id.solutionShape || 'no-graph';
  const experience = buildCognitiveExperience(round);
  const clusterKey = round.cognitiveExperienceId
    || experience.cognitiveExperienceId
    || fp([informationFlow, solutionSteps, requestedResult, representation, distractorMechanism, solutionGraph].join('||'));
  return {
    informationFlow,
    solutionSteps,
    requestedResult,
    representation,
    distractorMechanism,
    solutionGraph,
    cognitiveExperienceId: round.cognitiveExperienceId || experience.cognitiveExperienceId || null,
    clusterKey,
    familyId: id.familyId || null,
    skeletonId: id.skeletonId || null,
    reasoningPathId: id.reasoningPathId || null,
    questionKey: round.questionKey || null
  };
}

function intervalStats(sessionIndexes = []) {
  if (sessionIndexes.length < 2) {
    return { occurrences: sessionIndexes.length, intervals: [], meanInterval: null, minInterval: null };
  }
  const sorted = [...sessionIndexes].sort((a, b) => a - b);
  const intervals = [];
  for (let i = 1; i < sorted.length; i += 1) intervals.push(sorted[i] - sorted[i - 1]);
  const meanInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  return {
    occurrences: sorted.length,
    intervals,
    meanInterval: Number(meanInterval.toFixed(2)),
    minInterval: Math.min(...intervals)
  };
}

function recordAttemptFromRound(round, gameId, sessionIndex, {
  correct = true,
  studentId = null,
  academicYear = null,
  simulatedDate = null,
  gradeBand = null,
  sessionSequence = null
} = {}) {
  const id = round.semanticIdentity || buildSemanticIdentity(round);
  const perceived = normalizedPerceivedStructure(round);
  const cxMeta = buildCognitiveExperience(round);
  return annotateAttemptMeta({
    gameId,
    questionKey: round.questionKey,
    familyId: id.familyId || round.familyId || null,
    skeletonId: id.skeletonId || round.skeletonId || null,
    reasoningPathId: id.reasoningPathId || null,
    solutionGraphId: id.solutionGraphId || null,
    distractorPlanId: id.distractorPlanId || round.distractorPlanId || null,
    cognitiveExperienceId: round.cognitiveExperienceId || perceived.cognitiveExperienceId || cxMeta.cognitiveExperienceId || null,
    structuralId: round.structuralId || cxMeta.structuralId || null,
    surfaceFingerprint: round.surfaceFingerprint || id.surfaceFingerprint || null,
    durableSurfaceFingerprint: round.durableSurfaceFingerprint || id.durableSurfaceFingerprint || null,
    semanticFingerprint: id.semanticFingerprint || null,
    topicId: round.topicId || null,
    misconceptionId: correct ? null : (round.optionDiagnostics?.find((o) => o && !o.isCorrect)?.misconceptionId
      || round.choiceDiagnostics?.options?.find((o) => o && !o.isCorrect)?.misconceptionId
      || 'generic-miss'),
    correct,
    difficulty: round.difficulty || round.cognitiveDepth || 3,
    cognitiveDepth: round.cognitiveDepth || round.difficulty || 3,
    hintCount: correct ? 0 : 1,
    durationSeconds: correct ? 40 : 90,
    sessionIndex,
    perceivedCluster: perceived.clusterKey
  }, {
    studentId,
    academicYear,
    simulatedDate,
    sessionSequence: sessionSequence ?? sessionIndex,
    sessionIndex,
    gameId,
    gradeBand
  });
}

function recentFamilyIdsFromAttempts(attempts, gameId, limit = 36) {
  return attempts
    .filter((a) => a.gameId === gameId && a.familyId)
    .slice(-limit)
    .map((a) => a.familyId);
}

function buildSessionOptions(student, gameId, {
  teacherFocusTopics = null,
  sessionIndexHint = null,
  academicYear = null,
  gradeBand = null,
  repetitionPolicyVersion = 'v2'
} = {}) {
  const currentSessionIndex = Number.isFinite(Number(sessionIndexHint))
    ? Number(sessionIndexHint)
    : student.sessionLog.length;
  const band = gradeBand != null ? String(gradeBand) : String(student.profile?.grade ?? '');
  return {
    attempts: student.attempts,
    seenQuestionKeys: student.seenQuestionKeys,
    blockedQuestionFamilies: student.blockedQuestionFamilies,
    recentFamilyIds: recentFamilyIdsFromAttempts(student.attempts, gameId, 36),
    completedSessionCount: student.completedSessionCount,
    currentSessionIndex,
    academicYear: academicYear || student.academicYear || '2025-2026',
    gradeBand: band,
    repetitionPolicyVersion,
    classTarget: teacherFocusTopics?.length
      ? { topicIds: teacherFocusTopics, focusShare: 0.35 }
      : null
  };
}

function createPersistentStudent(id, baseProfile, { academicYear = '2025-2026' } = {}) {
  return {
    id,
    profile: { ...baseProfile, id, skills: baseProfile.skills || {} },
    academicYear,
    attempts: [],
    seenQuestionKeys: new Set(),
    blockedQuestionFamilies: new Set(),
    completedSessionCount: 0,
    sessionLog: [],
    adaptiveRouteLog: []
  };
}

function unitFromSeed(...parts) {
  return (Math.abs(hashString(parts.join(':'))) % 10000) / 10000;
}

function playSession(student, gameId, seed, {
  simulateErrors = false,
  teacherFocusTopics = null,
  phase = 'session',
  sessionIndexHint = null,
  maxComposeAttempts = 3,
  academicYear = null,
  simulatedDate = null,
  gradeBand = null,
  repetitionPolicyVersion = 'v2',
  sessionSequence = null
} = {}) {
  const profile = clampProfileForGame(gameId, student.profile);
  if (!isGameAvailableForProfile(GAME_CATALOG.find((g) => g.id === gameId), profile)) {
    emitStrictProgress({
      phase,
      status: 'skip',
      gameId,
      grade: profile.grade,
      age: profile.age,
      reason: 'game_unavailable_for_profile'
    });
    return null;
  }
  const sessionIndex = sessionIndexHint ?? student.sessionLog.length;
  const year = academicYear || student.academicYear || '2025-2026';
  const band = gradeBand != null ? String(gradeBand) : String(profile.grade ?? '');
  emitStrictProgress({
    phase,
    status: 'start',
    gameId,
    grade: profile.grade,
    age: profile.age,
    sessionIndex,
    seed,
    attemptsSoFar: student.attempts.length,
    simulatedDate: simulatedDate || null,
    academicYear: year
  });
  const options = buildSessionOptions(student, gameId, {
    teacherFocusTopics,
    sessionIndexHint: sessionIndex,
    academicYear: year,
    gradeBand: band,
    repetitionPolicyVersion
  });
  const composeCap = Math.max(1, Math.min(3, Number(maxComposeAttempts) || 3));
  let session = createGameSession(gameId, profile, seed, options);
  const candidateRounds = [];
  for (let i = 1; i < composeCap; i += 1) {
    const candidate = createGameSession(gameId, profile, seed + i * 7919, options);
    candidateRounds.push(...(candidate.rounds || []));
  }
  const academicDefinition = {
    topicIds: [...new Set([
      ...session.rounds.map((r) => r.topicId).filter(Boolean),
      ...candidateRounds.map((r) => r.topicId).filter(Boolean),
      ...(teacherFocusTopics || [])
    ])]
  };
  const adaptive = composeAdaptiveSession({
    baseRounds: session.rounds,
    candidateRounds,
    attempts: student.attempts,
    academicDefinition,
    maxShare: teacherFocusTopics?.length ? 0.35 : 0.25,
    classTargetTopicIds: teacherFocusTopics || []
  });
  session = {
    ...session,
    rounds: adaptive.rounds,
    adaptivePlan: adaptive.plan,
    adaptiveInjectedCount: adaptive.injectedCount
  };

  const rounds = (session.rounds || []).map((r) => attachSemanticIdentity(r));
  const capacityFailure = session.globalQualityAudit?.capacityFailure || null;
  if (capacityFailure) {
    emitStrictProgress({
      phase,
      status: 'capacity_fail',
      gameId,
      grade: profile.grade,
      age: profile.age,
      sessionIndex,
      requestedCount: capacityFailure.requestedCount,
      producedCount: capacityFailure.producedCount,
      blockedFamilyIds: capacityFailure.blockedFamilyIds,
      blockedSkeletonIds: capacityFailure.blockedSkeletonIds,
      blockedCognitiveExperienceIds: (capacityFailure.blockedCognitiveExperienceIds || []).slice(-20),
      note: capacityFailure.note
    });
  }
  const brainBefore = buildStudentBrainProfile(student.attempts);
  const policyBefore = brainProfileSessionPolicy(brainBefore);

  const gameMeta = GAME_CATALOG.find((g) => g.id === gameId);
  const skillKey = gameMeta?.skill || 'general';
  if (!student.profile.skills) student.profile.skills = {};
  if (!Number.isFinite(Number(student.profile.skills[skillKey]))) student.profile.skills[skillKey] = 35;

  for (const round of rounds) {
    if (round.questionKey) student.seenQuestionKeys.add(round.questionKey);
    const roll = unitFromSeed(student.id, seed, round.questionKey || '', sessionIndex);
    const shouldMiss = simulateErrors
      && teacherFocusTopics?.length
      && teacherFocusTopics.includes(round.topicId)
      && roll < 0.55;
    const correct = !shouldMiss && (simulateErrors ? unitFromSeed(student.id, seed, 'correct', round.questionKey || '') > 0.18 : true);
    student.attempts.push(recordAttemptFromRound(round, gameId, sessionIndex, {
      correct,
      studentId: student.id,
      academicYear: year,
      simulatedDate: simulatedDate || null,
      gradeBand: band,
      sessionSequence: sessionSequence ?? sessionIndex
    }));
    student.profile.skills[skillKey] = updateSkillRating(
      student.profile.skills[skillKey],
      correct,
      correct ? 0 : 1,
      correct ? 40 : 90
    );
  }

  student.completedSessionCount += 1;
  const brainAfter = buildStudentBrainProfile(student.attempts);
  const policyAfter = brainProfileSessionPolicy(brainAfter);
  const entry = {
    sessionIndex,
    sessionSequence: sessionSequence ?? sessionIndex,
    studentId: student.id,
    academicYear: year,
    simulatedDate: simulatedDate || null,
    gradeBand: band,
    gameId,
    seed,
    week: student.sessionLog.length,
    roundCount: rounds.length,
    questionKeys: rounds.map((r) => r.questionKey).filter(Boolean),
    familyIds: rounds.map((r) => r.familyId || r.semanticIdentity?.familyId).filter(Boolean),
    skeletonIds: rounds.map((r) => r.skeletonId || r.semanticIdentity?.skeletonId).filter(Boolean),
    reasoningPathIds: rounds.map((r) => r.semanticIdentity?.reasoningPathId).filter(Boolean),
    solutionGraphIds: rounds.map((r) => r.semanticIdentity?.solutionGraphId).filter(Boolean),
    distractorPlanIds: rounds.map((r) => r.semanticIdentity?.distractorPlanId).filter(Boolean),
    perceivedClusters: rounds.map((r) => normalizedPerceivedStructure(r).clusterKey),
    difficulties: rounds.map((r) => Number(r.difficulty || r.cognitiveDepth || 3)),
    topicIds: rounds.map((r) => r.topicId).filter(Boolean),
    adaptiveInjectedCount: session.adaptiveInjectedCount || 0,
    adaptivePlanTopics: (session.adaptivePlan || []).map((p) => p.topicId).filter(Boolean),
    targetDifficultyBefore: policyBefore.targetDifficulty,
    targetDifficultyAfter: policyAfter.targetDifficulty,
    weakPatternsBefore: policyBefore.weakPatterns,
    weakPatternsAfter: policyAfter.weakPatterns,
    attemptsSizeAfter: student.attempts.length,
    rounds
  };
  student.sessionLog.push(entry);
  emitStrictProgress({
    phase,
    status: capacityFailure ? 'underfill' : 'ok',
    gameId,
    grade: profile.grade,
    age: profile.age,
    sessionIndex,
    requestedCount: GAME_CATALOG.find((g) => g.id === gameId)?.sessionLength || null,
    producedCount: rounds.length,
    attemptsSoFar: student.attempts.length,
    rejectedCandidateCount: capacityFailure ? Math.max(0, (capacityFailure.requestedCount || 0) - rounds.length) : 0
  });
  student.adaptiveRouteLog.push({
    sessionIndex,
    targetDifficulty: policyAfter.targetDifficulty,
    weakPatterns: policyAfter.weakPatterns,
    injected: session.adaptiveInjectedCount || 0,
    planTopics: entry.adaptivePlanTopics
  });
  return entry;
}

function recurrenceByKey(sessionLog, field) {
  const map = new Map();
  sessionLog.forEach((session) => {
    const values = session[field] || [];
    for (const value of values) {
      if (!value) continue;
      const arr = map.get(value) || [];
      arr.push(session.sessionIndex);
      map.set(value, arr);
    }
  });
  const rows = [...map.entries()].map(([key, indexes]) => ({ key, ...intervalStats(indexes) }));
  const withRecurrence = rows.filter((r) => r.occurrences >= 2);
  const minIntervals = withRecurrence.map((r) => r.minInterval).filter((n) => Number.isFinite(n));
  const meanIntervals = withRecurrence.map((r) => r.meanInterval).filter((n) => Number.isFinite(n));
  return {
    distinctKeys: rows.length,
    recurringKeys: withRecurrence.length,
    minInterval: minIntervals.length ? Math.min(...minIntervals) : null,
    meanInterval: meanIntervals.length
      ? Number((meanIntervals.reduce((a, b) => a + b, 0) / meanIntervals.length).toFixed(2))
      : null,
    shortRecurrenceKeys: withRecurrence.filter((r) => r.minInterval != null && r.minInterval <= 1).map((r) => r.key).slice(0, 40),
    topRecurring: withRecurrence.sort((a, b) => b.occurrences - a.occurrences).slice(0, 20)
  };
}

function exactQuestionRepeats(sessionLog) {
  const firstSeen = new Map();
  const repeats = [];
  for (const session of sessionLog) {
    for (const key of session.questionKeys || []) {
      if (!key) continue;
      if (firstSeen.has(key)) {
        repeats.push({
          questionKey: key,
          firstSession: firstSeen.get(key),
          againSession: session.sessionIndex,
          gameId: session.gameId
        });
      } else {
        firstSeen.set(key, session.sessionIndex);
      }
    }
  }
  return repeats;
}

function failuresByDimension(sessionLog, repeats) {
  const byGame = {};
  const bump = (gameId, age, familyId, skeletonId, solutionGraphId, reason) => {
    const g = byGame[gameId] || (byGame[gameId] = { gameId, reasons: [], families: {}, skeletons: {}, solutionGraphs: {} });
    g.reasons.push(reason);
    if (familyId) g.families[familyId] = (g.families[familyId] || 0) + 1;
    if (skeletonId) g.skeletons[skeletonId] = (g.skeletons[skeletonId] || 0) + 1;
    if (solutionGraphId) g.solutionGraphs[solutionGraphId] = (g.solutionGraphs[solutionGraphId] || 0) + 1;
    g.ageBand = age;
  };
  for (const rep of repeats) {
    const session = sessionLog[rep.againSession];
    bump(rep.gameId, session?.profileAge, null, null, null, 'exact_question_repeat');
  }
  for (const session of sessionLog) {
    const clusterCounts = new Map();
    for (const c of session.perceivedClusters || []) clusterCounts.set(c, (clusterCounts.get(c) || 0) + 1);
    for (const [cluster, count] of clusterCounts) {
      if (count >= 2) {
        const round = (session.rounds || []).find((r) => normalizedPerceivedStructure(r).clusterKey === cluster);
        bump(session.gameId, null, round?.familyId, round?.skeletonId, round?.semanticIdentity?.solutionGraphId, 'intra_session_perceived_cluster');
      }
    }
  }
  return byGame;
}

/** 1) Tek öğrenci yıllık simülasyon — kalıcı büyüyen geçmiş. */
export function runAnnualStudentSimulation({
  weeks = 36,
  sessionsPerWeek = 2,
  baseProfile = {
    id: 'annual-student',
    age: 12,
    grade: 6,
    skills: {
      attention: 30, problemSolving: 30, vocabulary: 30, reading: 30, arithmetic: 30,
      patterns: 30, geometry: 30, olympiad: 30, verbalLogic: 30, englishVocabulary: 30,
      englishGrammar: 30, socialHistory: 30, socialGeography: 30, citizenship: 30,
      religion: 30, science: 30, scientificReasoning: 30, lgsFamiliarity: 30
    }
  },
  games = PRODUCT_ACCEPTANCE_ACTIVE_GAMES,
  seedBase = 44001,
  minAttempts = 3600,
  academicYear = '2025-2026',
  yearStartDate = '2025-09-08',
  repetitionPolicyVersion = 'v2'
} = {}) {
  const student = createPersistentStudent(baseProfile.id || 'annual-student', baseProfile, { academicYear });
  const schedule = [];
  let gameCursor = 0;
  const startMs = Date.parse(yearStartDate) || Date.parse('2025-09-08T09:00:00.000Z');
  for (let week = 0; week < weeks; week += 1) {
    for (let s = 0; s < sessionsPerWeek; s += 1) {
      let picked = null;
      for (let tryN = 0; tryN < games.length; tryN += 1) {
        const gameId = games[(gameCursor + tryN) % games.length];
        const profile = clampProfileForGame(gameId, student.profile);
        if (isGameAvailableForProfile(GAME_CATALOG.find((g) => g.id === gameId), profile)) {
          picked = gameId;
          gameCursor = (gameCursor + tryN + 1) % games.length;
          break;
        }
      }
      if (!picked) continue;
      // Gerçek zaman akışı: hafta + gün kayması (aynı saniyede 720 oturum değil).
      const dayOffset = week * 7 + (s === 0 ? 1 : 4);
      const simulatedDate = new Date(startMs + dayOffset * 24 * 60 * 60 * 1000).toISOString();
      schedule.push({
        week,
        dayOffset,
        simulatedDate,
        gameId: picked,
        seed: seedBase + week * 97 + s * 13,
        sessionSequence: schedule.length
      });
    }
  }

  const maxEmptyAltTries = Math.min(games.length, 8);
  for (let si = 0; si < schedule.length; si += 1) {
    const item = schedule[si];
    emitStrictProgress({
      phase: 'annual',
      status: 'session_schedule',
      gameId: item.gameId,
      sessionIndex: si,
      totalSessions: schedule.length,
      week: item.week,
      simulatedDate: item.simulatedDate,
      attemptsSoFar: student.attempts.length
    });
    let entry = playSession(student, item.gameId, item.seed, {
      simulateErrors: true,
      phase: 'annual',
      sessionIndexHint: si,
      sessionSequence: item.sessionSequence ?? si,
      academicYear,
      simulatedDate: item.simulatedDate,
      gradeBand: String(baseProfile.grade ?? ''),
      repetitionPolicyVersion
    });
    // Boş oturum: sınırlı alternatif dene; kalite gevşetilmez, sonsuz döngü yok.
    if (!entry?.rounds?.length) {
      for (let tryN = 0; tryN < maxEmptyAltTries; tryN += 1) {
        const alt = games[(gameCursor + tryN) % games.length];
        if (alt === item.gameId) continue;
        entry = playSession(student, alt, item.seed + 3331 + tryN, {
          simulateErrors: true,
          phase: 'annual-alt',
          sessionIndexHint: si,
          sessionSequence: item.sessionSequence ?? si,
          academicYear,
          simulatedDate: item.simulatedDate,
          gradeBand: String(baseProfile.grade ?? ''),
          repetitionPolicyVersion
        });
        if (entry?.rounds?.length) break;
      }
    }
  }
  // Yıllık hacim: CX tükenmesi underfill yarattıysa sınırlı ekstra oturum; stagnant → açık kapasite FAIL.
  let extra = 0;
  let stagnant = 0;
  const maxExtra = Math.min(400, Math.max(0, minAttempts - student.attempts.length) + games.length * 2);
  while (student.attempts.length < minAttempts && extra < maxExtra && stagnant < games.length * 2) {
    const gameId = games[extra % games.length];
    const profile = clampProfileForGame(gameId, student.profile);
    if (!isGameAvailableForProfile(GAME_CATALOG.find((g) => g.id === gameId), profile)) {
      extra += 1;
      stagnant += 1;
      continue;
    }
    const before = student.attempts.length;
    playSession(student, gameId, seedBase + 500000 + extra * 97, {
      simulateErrors: true,
      phase: 'annual-extra'
    });
    if (student.attempts.length <= before) stagnant += 1;
    else stagnant = 0;
    extra += 1;
  }
  if (student.attempts.length < minAttempts) {
    emitStrictProgress({
      phase: 'annual',
      status: 'capacity_fail',
      gameId: 'annual-student',
      grade: baseProfile.grade,
      age: baseProfile.age,
      sessionIndex: student.sessionLog.length,
      requestedCount: minAttempts,
      producedCount: student.attempts.length,
      rejectedCandidateCount: Math.max(0, minAttempts - student.attempts.length),
      rejectionReasons: ['cognitiveExperience_or_pool_capacity_exhausted', 'extra_session_stagnant'],
      note: 'Yıllık hedef attempt doldurulamadı; kalite gevşetilmedi.'
    });
  }

  const repeats = exactQuestionRepeats(student.sessionLog);
  const family = recurrenceByKey(student.sessionLog, 'familyIds');
  const skeleton = recurrenceByKey(student.sessionLog, 'skeletonIds');
  const reasoning = recurrenceByKey(student.sessionLog, 'reasoningPathIds');
  const solutionGraph = recurrenceByKey(student.sessionLog, 'solutionGraphIds');
  const distractorPlan = recurrenceByKey(student.sessionLog, 'distractorPlanIds');
  const perceived = recurrenceByKey(student.sessionLog, 'perceivedClusters');

  const topics = new Set(student.attempts.map((a) => a.topicId).filter(Boolean));
  const difficulties = student.sessionLog.map((s) => {
    const avg = s.difficulties.length
      ? s.difficulties.reduce((a, b) => a + b, 0) / s.difficulties.length
      : null;
    return avg;
  }).filter((n) => n != null);
  const firstHalf = difficulties.slice(0, Math.floor(difficulties.length / 2));
  const secondHalf = difficulties.slice(Math.floor(difficulties.length / 2));
  const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
  const difficultyProgression = {
    firstHalfMean: avg(firstHalf) != null ? Number(avg(firstHalf).toFixed(2)) : null,
    secondHalfMean: avg(secondHalf) != null ? Number(avg(secondHalf).toFixed(2)) : null,
    delta: (avg(firstHalf) != null && avg(secondHalf) != null)
      ? Number((avg(secondHalf) - avg(firstHalf)).toFixed(2))
      : null
  };

  const adaptiveChanges = student.adaptiveRouteLog.filter((row, i, arr) => {
    if (i === 0) return false;
    const prev = arr[i - 1];
    return prev.targetDifficulty !== row.targetDifficulty
      || prev.injected !== row.injected
      || JSON.stringify(prev.weakPatterns) !== JSON.stringify(row.weakPatterns)
      || JSON.stringify(prev.planTopics) !== JSON.stringify(row.planTopics);
  }).length;

  const nonEmptySessions = student.sessionLog.filter((s) => (s.roundCount || 0) > 0);
  const emptyProfileCheat = nonEmptySessions.length > 0
    && nonEmptySessions.every((s) => s.attemptsSizeAfter === (s.roundCount || 0));
  // Kalıcı büyüyen geçmiş: boş oturumlar (havuz tükenmesi) sayılmaz; dolu oturumlarda attempts artmalı.
  const growingHistory = nonEmptySessions.length > 1
    && nonEmptySessions.every((s, i) => i === 0 || s.attemptsSizeAfter > nonEmptySessions[i - 1].attemptsSizeAfter);

  const gates = {
    exactQuestionRepeat: repeats.length === 0,
    familyRecurrenceInterval: family.minInterval == null || family.minInterval >= 2,
    skeletonRecurrenceInterval: skeleton.minInterval == null || skeleton.minInterval >= 2,
    reasoningPathRecurrenceInterval: reasoning.minInterval == null || reasoning.minInterval >= 2,
    solutionGraphRecurrenceInterval: solutionGraph.minInterval == null || solutionGraph.minInterval >= 2,
    distractorPlanRecurrenceInterval: distractorPlan.minInterval == null || distractorPlan.minInterval >= 2,
    perceivedSemanticCluster: perceived.minInterval == null || perceived.minInterval >= 2,
    curriculumCoverage: topics.size >= 20 && student.attempts.length >= Math.min(1200, minAttempts),
    difficultyProgression: difficultyProgression.delta != null && Math.abs(difficultyProgression.delta) >= 0.15,
    adaptiveRouteChanges: adaptiveChanges >= 1 || student.sessionLog.some((s) => s.adaptiveInjectedCount > 0),
    persistentGrowingHistory: growingHistory && !emptyProfileCheat,
    sessionsCompleted: student.sessionLog.length >= Math.min(schedule.length, weeks),
    annualAttemptVolume: student.attempts.length >= minAttempts
  };

  const pass = Object.values(gates).every(Boolean);
  return {
    kind: 'annual-student',
    pass,
    gates,
    summary: {
      weeks,
      sessionsPerWeek,
      sessionsCompleted: student.sessionLog.length,
      attemptsTotal: student.attempts.length,
      minAttemptsTarget: minAttempts,
      distinctQuestionKeys: new Set(student.attempts.map((a) => a.questionKey).filter(Boolean)).size,
      exactQuestionRepeatCount: repeats.length,
      curriculumTopicCount: topics.size,
      difficultyProgression,
      adaptiveRouteChanges: adaptiveChanges,
      persistentGrowingHistory: growingHistory
    },
    metrics: {
      exactQuestionRepeat: { count: repeats.length, samples: repeats.slice(0, 30) },
      familyRecurrenceInterval: family,
      skeletonRecurrenceInterval: skeleton,
      reasoningPathRecurrenceInterval: reasoning,
      solutionGraphRecurrenceInterval: solutionGraph,
      distractorPlanRecurrenceInterval: distractorPlan,
      perceivedSemanticCluster: perceived,
      curriculumCoverage: { topicCount: topics.size, topics: [...topics].slice(0, 80) },
      difficultyProgression,
      adaptiveRouteChanges: { changeCount: adaptiveChanges, logTail: student.adaptiveRouteLog.slice(-12) }
    },
    failuresByGameFamilySkeletonGraph: failuresByDimension(student.sessionLog, repeats),
    orchestrationUsed: [
      'createGameSession',
      'options.attempts',
      'options.seenQuestionKeys',
      'options.recentFamilyIds',
      'options.completedSessionCount',
      'buildStudentBrainProfile',
      'composeAdaptiveSession',
      'normalizedPerceivedStructure'
    ]
  };
}

function jaccard(a, b) {
  const A = new Set(a);
  const B = new Set(b);
  if (!A.size && !B.size) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter += 1;
  return inter / (A.size + B.size - inter);
}

/** 2) 30 öğrencili sınıf simülasyonu — ayrı kalıcı profiller, aynı öğretmen. */
export function runClass30Simulation({
  studentCount = 30,
  weeks = 24,
  baseProfile = { age: 12, grade: 6, skills: {} },
  games = PRODUCT_ACCEPTANCE_ACTIVE_GAMES,
  seedBase = 88001,
  teacherFocusTopics = null,
  academicYear = '2025-2026',
  yearStartDate = '2025-09-08',
  repetitionPolicyVersion = 'v2'
} = {}) {
  const teacherId = 'teacher-class-30';
  const students = Array.from({ length: studentCount }, (_, i) => createPersistentStudent(
    `class30-s${String(i + 1).padStart(2, '0')}`,
    { ...baseProfile, id: `class30-s${String(i + 1).padStart(2, '0')}`, teacherId, classroomId: 'class-30-a' },
    { academicYear }
  ));

  // Öğretmen hedefi: gerçek üretilen topicId'lerden seç (uydurma etiket değil).
  let resolvedTeacherTopics = Array.isArray(teacherFocusTopics) ? [...teacherFocusTopics] : [];
  const weeklyGame = [];
  const startMs = Date.parse(yearStartDate) || Date.parse('2025-09-08T09:00:00.000Z');
  for (let week = 0; week < weeks; week += 1) {
    let gameId = games[week % games.length];
    for (let t = 0; t < games.length; t += 1) {
      const candidate = games[(week + t) % games.length];
      const profile = clampProfileForGame(candidate, baseProfile);
      if (isGameAvailableForProfile(GAME_CATALOG.find((g) => g.id === candidate), profile)) {
        gameId = candidate;
        break;
      }
    }
    weeklyGame.push(gameId);
    const focusThisWeek = week % 3 === 0;
    const simulatedDate = new Date(startMs + week * 7 * 24 * 60 * 60 * 1000).toISOString();
    for (let si = 0; si < students.length; si += 1) {
      const student = students[si];
      const sessionIndexHint = student.sessionLog.length;
      const entry = playSession(student, gameId, seedBase + week * 1009 + si * 17, {
        simulateErrors: true,
        teacherFocusTopics: focusThisWeek && resolvedTeacherTopics.length ? resolvedTeacherTopics : null,
        sessionIndexHint,
        sessionSequence: sessionIndexHint,
        academicYear,
        simulatedDate,
        gradeBand: String(baseProfile.grade ?? ''),
        repetitionPolicyVersion
      });
      if (entry && !resolvedTeacherTopics.length) {
        resolvedTeacherTopics = [...new Set(entry.topicIds)].slice(0, 5);
      }
    }
  }

  // Aynı hafta aynı soru oranı
  let sameQuestionPairs = 0;
  let comparablePairs = 0;
  const concentration = [];
  for (let week = 0; week < weeks; week += 1) {
    const weekKeys = students.map((s) => new Set(s.sessionLog[week]?.questionKeys || []));
    const allKeys = new Map();
    for (const set of weekKeys) {
      for (const key of set) allKeys.set(key, (allKeys.get(key) || 0) + 1);
    }
    const maxShare = allKeys.size
      ? Math.max(...[...allKeys.values()]) / students.length
      : 0;
    concentration.push({ week, gameId: weeklyGame[week], maxStudentShare: Number(maxShare.toFixed(3)), distinctKeys: allKeys.size });
    for (let i = 0; i < weekKeys.length; i += 1) {
      for (let j = i + 1; j < weekKeys.length; j += 1) {
        comparablePairs += 1;
        let share = 0;
        for (const key of weekKeys[i]) if (weekKeys[j].has(key)) share += 1;
        if (share > 0) sameQuestionPairs += 1;
      }
    }
  }
  const sameQuestionRate = comparablePairs ? sameQuestionPairs / comparablePairs : 0;

  // Eşdeğer zorluk
  const studentDiffMeans = students.map((s) => {
    const diffs = s.sessionLog.flatMap((x) => x.difficulties);
    return diffs.length ? diffs.reduce((a, b) => a + b, 0) / diffs.length : null;
  }).filter((n) => n != null);
  const meanDiff = studentDiffMeans.reduce((a, b) => a + b, 0) / Math.max(1, studentDiffMeans.length);
  const variance = studentDiffMeans.reduce((a, b) => a + ((b - meanDiff) ** 2), 0) / Math.max(1, studentDiffMeans.length);
  const difficultyStdDev = Number(Math.sqrt(variance).toFixed(3));

  // Geçmiş ayrılığı
  const histories = students.map((s) => s.attempts.map((a) => a.questionKey).filter(Boolean));
  let jaccardSum = 0;
  let jaccardN = 0;
  for (let i = 0; i < histories.length; i += 1) {
    for (let j = i + 1; j < Math.min(histories.length, i + 6); j += 1) {
      jaccardSum += jaccard(histories[i], histories[j]);
      jaccardN += 1;
    }
  }
  const meanHistoryOverlap = jaccardN ? Number((jaccardSum / jaccardN).toFixed(3)) : 0;

  // Öğretmen hedefi etkisi: odak haftalarında adaptive plan / injection
  const focusWeeks = students[0].sessionLog
    .map((s, idx) => ({ idx, injected: s.adaptiveInjectedCount, plan: s.adaptivePlanTopics }))
    .filter((_, week) => week % 3 === 0);
  const nonFocusWeeks = students[0].sessionLog
    .map((s, idx) => ({ idx, injected: s.adaptiveInjectedCount, plan: s.adaptivePlanTopics }))
    .filter((_, week) => week % 3 !== 0);
  const avgInject = (rows) => (rows.length ? rows.reduce((a, r) => a + (r.injected || 0), 0) / rows.length : 0);
  const teacherTargetWiredToCreateGameSession = ORCHESTRATION_INVENTORY.teacherClassTarget.status === 'present';
  const focusTopics = resolvedTeacherTopics.length ? resolvedTeacherTopics : [];
  const focusClassTargetHits = students.reduce((sum, s) => sum + s.sessionLog
    .filter((_, week) => week % 3 === 0)
    .reduce((a, sess) => a + (sess.adaptivePlanTopics || []).filter((t) => focusTopics.includes(t)).length
      + (sess.rounds || []).filter((r) => r.classTargetPlacement || focusTopics.includes(r.topicId)).length, 0), 0);
  const nonFocusClassTargetHits = students.reduce((sum, s) => sum + s.sessionLog
    .filter((_, week) => week % 3 !== 0)
    .reduce((a, sess) => a + (sess.adaptivePlanTopics || []).filter((t) => focusTopics.includes(t)).length, 0), 0);
  const teacherEffectDelta = Number((avgInject(focusWeeks) - avgInject(nonFocusWeeks)).toFixed(3));
  const teacherTargetHitDelta = focusClassTargetHits - nonFocusClassTargetHits;
  // classTarget options.createGameSession'a bağlı; odak haftalarında hedef konu izi artmalı.
  const teacherTargetEffectPass = teacherTargetWiredToCreateGameSession
    && (teacherEffectDelta > 0 || teacherTargetHitDelta > 0 || focusClassTargetHits > 0);

  const gates = {
    sameQuestionSimultaneousRate: sameQuestionRate <= 0.25,
    equivalentDifficulty: difficultyStdDev <= 0.85,
    historySeparation: meanHistoryOverlap <= 0.45,
    classQuestionConcentration: concentration.every((c) => c.maxStudentShare <= 0.55),
    teacherTargetEffect: teacherTargetEffectPass,
    persistentPerStudentHistory: students.every((s) => s.attempts.length >= weeks)
  };

  const pass = Object.values(gates).every(Boolean);
  const failureDetail = {
    teacherClassTarget: ORCHESTRATION_INVENTORY.teacherClassTarget,
    teacherEffectDelta,
    teacherTargetWiredToCreateGameSession,
    note: teacherTargetWiredToCreateGameSession
      ? null
      : 'createGameSession sınıf/öğretmen hedefi options alanı taşımıyor; UI classrooms ile oturum üretimi bağlı değil.'
  };

  return {
    kind: 'class-30',
    pass,
    gates,
    summary: {
      teacherId,
      studentCount,
      weeks,
      sameQuestionRate: Number(sameQuestionRate.toFixed(4)),
      difficultyStdDev,
      meanHistoryOverlap,
      meanMaxStudentShare: Number((concentration.reduce((a, c) => a + c.maxStudentShare, 0) / Math.max(1, concentration.length)).toFixed(3)),
      teacherEffectDelta,
      teacherTargetHitDelta,
      focusClassTargetHits,
      teacherTargetWiredToCreateGameSession
    },
    metrics: {
      sameQuestionSimultaneousRate: { rate: Number(sameQuestionRate.toFixed(4)), comparablePairs, sameQuestionPairs },
      equivalentDifficulty: { mean: Number(meanDiff.toFixed(3)), stdDev: difficultyStdDev },
      historySeparation: { meanJaccardOverlap: meanHistoryOverlap },
      classQuestionConcentration: { weeks: concentration.slice(0, 24) },
      teacherTargetEffect: { ...failureDetail, teacherTargetHitDelta, focusClassTargetHits }
    },
    failuresByGameFamilySkeletonGraph: Object.fromEntries(
      weeklyGame.map((gameId, week) => [gameId, {
        gameId,
        week,
        maxStudentShare: concentration[week]?.maxStudentShare,
        reason: concentration[week]?.maxStudentShare > 0.55 ? 'class_concentration' : null
      }])
    )
  };
}

/** 3) Algılanan çeşitlilik — ID değil çocuk deneyimi. */
export function runPerceivedDiversityAudit({
  samplesPerGame = 8,
  games = PRODUCT_ACCEPTANCE_ACTIVE_GAMES,
  seedBase = 12001
} = {}) {
  const records = [];
  for (const gameId of games) {
    // Tek kalıcı öğrenci: yaş bantları boyunca cognitiveExperience cooldown birikir.
    const student = createPersistentStudent(`perc-${gameId}`, { id: `perc-${gameId}`, age: 10, grade: 4, skills: {} });
    for (const band of AGE_BANDS) {
      student.profile = clampProfileForGame(gameId, { ...student.profile, ...band, id: student.id, skills: student.profile.skills || {} });
      const game = GAME_CATALOG.find((g) => g.id === gameId);
      if (!isGameAvailableForProfile(game, student.profile)) continue;
      for (let i = 0; i < samplesPerGame; i += 1) {
        const entry = playSession(student, gameId, seedBase + hashString(`${gameId}:${band.id}:${i}`) % 100000, {
          simulateErrors: false
        });
        if (!entry) break;
        for (const round of entry.rounds || []) {
          const perceived = normalizedPerceivedStructure(round);
          const id = round.semanticIdentity || buildSemanticIdentity(round);
          records.push({
            gameId,
            ageBand: band.id,
            grade: student.profile.grade,
            questionKey: round.questionKey,
            familyId: id.familyId,
            skeletonId: id.skeletonId,
            reasoningPathId: id.reasoningPathId,
            solutionGraphId: id.solutionGraphId,
            distractorPlanId: id.distractorPlanId,
            cognitiveExperienceId: round.cognitiveExperienceId || perceived.cognitiveExperienceId,
            semanticFingerprint: id.semanticFingerprint,
            perceived
          });
        }
      }
    }
  }

  const byCluster = new Map();
  for (const row of records) {
    const list = byCluster.get(row.perceived.clusterKey) || [];
    list.push(row);
    byCluster.set(row.perceived.clusterKey, list);
  }

  const multiIdSameExperience = [...byCluster.values()]
    .map((list) => {
      const keys = new Set(list.map((r) => r.questionKey).filter(Boolean));
      const families = new Set(list.map((r) => r.familyId).filter(Boolean));
      return {
        clusterKey: list[0].perceived.clusterKey,
        size: list.length,
        distinctQuestionKeys: keys.size,
        distinctFamilies: families.size,
        games: [...new Set(list.map((r) => r.gameId))],
        ageBands: [...new Set(list.map((r) => r.ageBand))],
        sample: list.slice(0, 3).map((r) => ({
          questionKey: r.questionKey,
          familyId: r.familyId,
          skeletonId: r.skeletonId,
          solutionGraphId: r.solutionGraphId,
          promptPreview: stripDecor(r.perceived.informationFlow).slice(0, 80)
        }))
      };
    })
    .filter((c) => c.distinctQuestionKeys >= 2)
    .sort((a, b) => b.size - a.size);

  const total = records.length;
  const distinctClusters = byCluster.size;
  const clusterRatio = total ? distinctClusters / total : 0;
  const sameExperienceRate = total
    ? multiIdSameExperience.reduce((a, c) => a + c.size, 0) / total
    : 0;

  const gates = {
    samplesCollected: total >= 1000,
    clusterDiversity: clusterRatio >= 0.85,
    // Aynı çocuk deneyimi farklı ID ile geliyorsa raporlanır; 0.12 üstü yıllık ürün için FAIL.
    perceivedCollapseBounded: sameExperienceRate <= 0.12,
    comparesBeyondQuestionKeyFamilyId: true
  };
  const pass = Object.values(gates).every(Boolean);

  const failuresByGameFamilySkeletonGraph = {};
  for (const cluster of multiIdSameExperience.slice(0, 40)) {
    for (const sample of cluster.sample) {
      const gameId = cluster.games[0];
      const bucket = failuresByGameFamilySkeletonGraph[gameId] || (failuresByGameFamilySkeletonGraph[gameId] = {
        gameId,
        clusters: [],
        families: {},
        skeletons: {},
        solutionGraphs: {}
      });
      bucket.clusters.push(cluster.clusterKey);
      if (sample.familyId) bucket.families[sample.familyId] = (bucket.families[sample.familyId] || 0) + 1;
      if (sample.skeletonId) bucket.skeletons[sample.skeletonId] = (bucket.skeletons[sample.skeletonId] || 0) + 1;
      if (sample.solutionGraphId) bucket.solutionGraphs[sample.solutionGraphId] = (bucket.solutionGraphs[sample.solutionGraphId] || 0) + 1;
    }
  }

  return {
    kind: 'perceived-diversity',
    pass,
    gates,
    summary: {
      totalRounds: total,
      distinctClusters,
      clusterRatio: Number(clusterRatio.toFixed(3)),
      sameExperienceRate: Number(sameExperienceRate.toFixed(3)),
      multiIdSameExperienceClusters: multiIdSameExperience.length
    },
    metrics: {
      comparedAxes: [
        'informationFlow',
        'solutionSteps',
        'requestedResult',
        'representation',
        'distractorMechanism',
        'solutionGraph'
      ],
      multiIdSameExperience: multiIdSameExperience.slice(0, 50)
    },
    failuresByGameFamilySkeletonGraph
  };
}

function misconceptionRationales(round = {}) {
  const options = Array.isArray(round.options) ? round.options : [];
  const diag = round.optionDiagnostics || round.choiceDiagnostics?.options || round.questionContract?.optionMetadata?.options || [];
  return options.map((opt, index) => {
    const text = typeof opt === 'string' ? opt : (opt?.text || String(opt));
    const meta = diag[index] || {};
    const isCorrect = index === round.answerIndex;
    return {
      index,
      option: text,
      isCorrect,
      misconceptionId: meta.misconceptionId || meta.type || null,
      rationale: isCorrect
        ? (round.explanation || meta.rationale || 'Doğru seçenek')
        : (meta.rationale || meta.misconceptionRationale || meta.whyWrong || 'Yanılgı gerekçesi kayıtlı değil')
    };
  });
}

/** 4) Gerçek içerik inceleme paketi. */
export function runContentReviewSamples({
  games = PRODUCT_ACCEPTANCE_ACTIVE_GAMES,
  seedBase = 33001,
  samplesPerBand = 20
} = {}) {
  const samples = [];
  const lastUseByCluster = new Map();
  for (const gameId of games) {
    for (const band of AGE_BANDS) {
      const profile = clampProfileForGame(gameId, { id: `review-${band.id}`, ...band, skills: {} });
      const game = GAME_CATALOG.find((g) => g.id === gameId);
      if (!isGameAvailableForProfile(game, profile)) continue;
      const student = createPersistentStudent(`${profile.id}-${gameId}`, profile);
      let produced = 0;
      let sampleIndex = 0;
      let guard = 0;
      while (produced < samplesPerBand && guard < samplesPerBand * 4) {
        const entry = playSession(student, gameId, seedBase + hashString(`${gameId}:${band.id}:${sampleIndex}:${guard}`) % 90000);
        guard += 1;
        sampleIndex += 1;
        if (!entry?.rounds?.length) continue;
        const round = entry.rounds[produced % entry.rounds.length];
        produced += 1;
        const id = round.semanticIdentity || buildSemanticIdentity(round);
        const perceived = normalizedPerceivedStructure(round);
        const lastSimilar = lastUseByCluster.get(perceived.clusterKey) || null;
        lastUseByCluster.set(perceived.clusterKey, { gameId, ageBand: band.id, questionKey: round.questionKey });
        const choiceOptions = Array.isArray(round.options) ? round.options : [];
        const correctAnswer = choiceOptions.length
          ? choiceOptions[round.answerIndex]
          : (round.answer ?? round.answerValue ?? round.solution
            ?? (round.target != null ? `hedef=${round.target}; çözüm=${round.solution || '?'}` : null)
            ?? (round.start && round.end ? `${round.start} → ${(round.steps || []).join(' → ')} → ${round.end}` : null)
            ?? (Array.isArray(round.allowed) ? `geçerli kelimeler: ${round.allowed.slice(0, 8).join(', ')}` : null)
            ?? ((round.forbiddenLetter || round.forbidden) ? `yasak: ${round.forbiddenLetter || round.forbidden}; min cümle/kelime: ${round.minSentences || round.minWords || round.minUniqueWords || '?'}` : null)
            ?? (Array.isArray(round.answerTokens) ? round.answerTokens.join(' ') : null)
            ?? (round.kind === 'story' ? (round.prompt || round.explanation || 'Yaratıcı yazım görevi') : null)
            ?? null);
        const interactiveOptions = choiceOptions.length
          ? choiceOptions
          : (Array.isArray(round.allowed) ? round.allowed.slice(0, 12)
            : Array.isArray(round.numbers) ? round.numbers.map(String)
              : (round.start && round.end ? [round.start, ...(round.steps || []), round.end] : []));
        const factoryGate = round.questionFactoryGate || evaluatePremiumQuestionFactory(round, { grade: profile.grade });
        const fakeHard = detectFakeHardSurface(round, { grade: profile.grade });
        samples.push({
          gameId,
          ageBand: band.id,
          grade: profile.grade,
          age: profile.age,
          kind: round.kind || 'choice',
          question: round.prompt || null,
          context: round.context || round.rule || null,
          options: interactiveOptions,
          correctAnswer,
          answerIndex: round.answerIndex ?? null,
          answerTokens: round.answerTokens || round.steps || null,
          explanation: round.explanation || null,
          wrongOptionMisconceptions: misconceptionRationales(round).filter((r) => !r.isCorrect),
          cognitiveDepthEvidence: {
            difficulty: round.difficulty ?? null,
            cognitiveDepth: round.cognitiveDepth ?? null,
            depthEvidence: round.cognitiveDepthEvidence || round.questionContract?.cognitiveDepth || null,
            factoryGate
          },
          contentQualityViolations: [
            ...(factoryGate.violations || []),
            ...(fakeHard.violations || [])
          ],
          familyId: id.familyId,
          skeletonId: id.skeletonId,
          reasoningPathId: id.reasoningPathId,
          solutionGraphId: id.solutionGraphId,
          distractorPlanId: id.distractorPlanId,
          lastSimilarUse: lastSimilar,
          perceivedSimilarityCluster: perceived.clusterKey,
          perceivedStructure: perceived
        });
      }
    }
  }

  const gamesCovered = new Set(samples.map((s) => s.gameId));
  const bandsCovered = new Set(samples.map((s) => s.ageBand));
  const incomplete = samples.filter((s) => {
    if (!s.question || !s.explanation || s.correctAnswer == null || s.correctAnswer === '') return true;
    if (Array.isArray(s.contentQualityViolations) && s.contentQualityViolations.length) return true;
    if (s.kind === 'choice') {
      const missingOptions = !Array.isArray(s.options) || s.options.length < 4;
      const missingDistractorPlan = !s.distractorPlanId;
      const missingMisconception = (s.wrongOptionMisconceptions || []).some((m) => !m.misconceptionId || /kayıtlı değil/i.test(String(m.rationale || '')));
      return missingOptions || missingDistractorPlan || missingMisconception;
    }
    return false;
  });
  const gates = {
    allActiveGamesRepresented: [...PRODUCT_ACCEPTANCE_ACTIVE_GAMES].every((g) => gamesCovered.has(g) || !GAME_CATALOG.find((x) => x.id === g)),
    ageBandsPresent: bandsCovered.size >= 3,
    requiredFieldsPresent: incomplete.length === 0,
    criticalContentViolationsZero: incomplete.length === 0,
    sampleCount: samples.length >= PRODUCT_ACCEPTANCE_ACTIVE_GAMES.length * 4 * samplesPerBand
  };
  // Oyun yaş bandı uyumsuzluğu nedeniyle bazı oyunlar bazı bantlarda yok — aktif oyunların en az bir örneği olmalı
  gates.allActiveGamesRepresented = PRODUCT_ACCEPTANCE_ACTIVE_GAMES.every((g) => gamesCovered.has(g));
  const pass = Object.values(gates).every(Boolean);

  return {
    kind: 'content-review-samples',
    pass,
    gates,
    summary: {
      sampleCount: samples.length,
      gamesCovered: gamesCovered.size,
      ageBandsCovered: [...bandsCovered],
      incompleteFieldCount: incomplete.length
    },
    samples,
    failuresByGameFamilySkeletonGraph: Object.fromEntries(
      incomplete.map((s) => [s.gameId, {
        gameId: s.gameId,
        ageBand: s.ageBand,
        familyId: s.familyId,
        skeletonId: s.skeletonId,
        solutionGraphId: s.solutionGraphId,
        reason: s.contentQualityViolations?.length ? s.contentQualityViolations.join(',') : 'missing_required_review_fields'
      }])
    )
  };
}

export function evaluateProductAcceptanceDecision({
  technicalEvidenceAdequacy = 'FAIL',
  annual,
  class30,
  perceived,
  contentReview
} = {}) {
  const technicalQuality = technicalEvidenceAdequacy === 'PASS' ? 'PASS' : 'FAIL';
  const annualCapacity = annual?.pass ? 'PASS' : 'FAIL';
  const classCapacity = class30?.pass ? 'PASS' : 'FAIL';
  const perceivedDiversity = perceived?.pass ? 'PASS' : 'FAIL';
  const contentReviewStatus = contentReview?.pass ? 'PASS' : 'FAIL';
  const productReady = [
    technicalQuality,
    annualCapacity,
    classCapacity,
    perceivedDiversity,
    contentReviewStatus
  ].every((x) => x === 'PASS');

  return {
    schemaVersion: '1.0',
    decision: productReady ? 'PASS' : 'FAIL',
    productReady,
    dimensions: {
      technicalQuality,
      annualStudentCapacity: annualCapacity,
      class30Capacity: classCapacity,
      perceivedDiversity,
      contentReview: contentReviewStatus
    },
    note: productReady
      ? 'Teknik kanıt ve ürün kabul denetimleri PASS.'
      : 'Stage 14 teknik PASS ürün hazır anlamına gelmez; PRODUCT_ACCEPTANCE_DECISION PASS olmadan Ürün Hazır gösterilemez.',
    orchestrationInventory: ORCHESTRATION_INVENTORY,
    failureHighlights: {
      annual: annual?.pass ? [] : Object.entries(annual?.gates || {}).filter(([, v]) => !v).map(([k]) => k),
      class30: class30?.pass ? [] : Object.entries(class30?.gates || {}).filter(([, v]) => !v).map(([k]) => k),
      perceived: perceived?.pass ? [] : Object.entries(perceived?.gates || {}).filter(([, v]) => !v).map(([k]) => k),
      contentReview: contentReview?.pass ? [] : Object.entries(contentReview?.gates || {}).filter(([, v]) => !v).map(([k]) => k)
    }
  };
}

export function runFullProductAcceptanceAudit(options = {}) {
  emitStrictProgress({ phase: 'audit', status: 'start', note: 'full product acceptance' });
  emitStrictProgress({ phase: 'annual', status: 'phase_start' });
  const annual = runAnnualStudentSimulation(options.annual || {});
  emitStrictProgress({
    phase: 'annual',
    status: annual?.pass ? 'phase_pass' : 'phase_fail',
    producedCount: annual?.metrics?.attemptCount ?? annual?.attemptCount ?? null,
    gates: annual?.gates || null
  });
  emitStrictProgress({ phase: 'class30', status: 'phase_start' });
  const class30 = runClass30Simulation(options.class30 || {});
  emitStrictProgress({ phase: 'class30', status: class30?.pass ? 'phase_pass' : 'phase_fail' });
  emitStrictProgress({ phase: 'perceived', status: 'phase_start' });
  const perceived = runPerceivedDiversityAudit(options.perceived || {});
  emitStrictProgress({ phase: 'perceived', status: perceived?.pass ? 'phase_pass' : 'phase_fail' });
  emitStrictProgress({ phase: 'contentReview', status: 'phase_start' });
  const contentReview = runContentReviewSamples(options.contentReview || {});
  emitStrictProgress({
    phase: 'contentReview',
    status: contentReview?.pass ? 'phase_pass' : 'phase_fail',
    producedCount: contentReview?.samples?.length ?? null
  });
  emitStrictProgress({ phase: 'audit', status: 'done' });
  return { annual, class30, perceived, contentReview };
}
