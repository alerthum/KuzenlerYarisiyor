/**
 * Targeted capacity shard runner — eski/yeni politika karşılaştırma + diagnostic matrix.
 */

import { createGameSession, GAME_CATALOG, isGameAvailableForProfile } from '../games/registry.js';
import { attachSemanticIdentity, buildSemanticIdentity } from './semantic-repeat-engine.js';
import { buildCognitiveExperience } from './question-factory-v13.js';
import { annotateAttemptMeta } from './repetition-policy-v2.js';
import { REPETITION_POLICY_V2 } from './repetition-policy-v2.js';

function createStudent(id, baseProfile, academicYear = '2025-2026') {
  return {
    id,
    profile: { ...baseProfile, id, skills: baseProfile.skills || {} },
    academicYear,
    attempts: [],
    seenQuestionKeys: new Set(),
    blockedQuestionFamilies: new Set(),
    completedSessionCount: 0,
    sessionLog: []
  };
}

function recordAttempt(round, meta, correct = true) {
  const id = round.semanticIdentity || buildSemanticIdentity(round);
  const cx = buildCognitiveExperience(round);
  return annotateAttemptMeta({
    gameId: meta.gameId,
    questionKey: round.questionKey,
    familyId: id.familyId || round.familyId || null,
    skeletonId: id.skeletonId || round.skeletonId || null,
    reasoningPathId: id.reasoningPathId || null,
    solutionGraphId: id.solutionGraphId || null,
    distractorPlanId: id.distractorPlanId || round.distractorPlanId || null,
    cognitiveExperienceId: round.cognitiveExperienceId || cx.cognitiveExperienceId,
    structuralId: round.structuralId || cx.structuralId,
    surfaceFingerprint: round.surfaceFingerprint || id.surfaceFingerprint || null,
    durableSurfaceFingerprint: round.durableSurfaceFingerprint || id.durableSurfaceFingerprint || null,
    semanticFingerprint: id.semanticFingerprint || null,
    correct,
    sessionIndex: meta.sessionIndex,
    perceivedCluster: cx.normalizedPerceivedStructure || null
  }, meta);
}

function clampProfile(gameId, profile) {
  const game = GAME_CATALOG.find((g) => g.id === gameId);
  if (!game) return profile;
  const next = { ...profile };
  if (Number(next.age) < game.minAge) next.age = game.minAge;
  if (Number(next.age) > game.maxAge) next.age = game.maxAge;
  return next;
}

function playOne(student, gameId, seed, {
  sessionIndex,
  academicYear,
  simulatedDate,
  gradeBand,
  repetitionPolicyVersion
}) {
  const profile = clampProfile(gameId, student.profile);
  const game = GAME_CATALOG.find((g) => g.id === gameId);
  if (!game || !isGameAvailableForProfile(game, profile)) {
    return { underfill: true, requested: game?.sessionLength || 0, produced: 0, rounds: [], attemptsUsed: 0 };
  }
  const options = {
    attempts: student.attempts,
    seenQuestionKeys: student.seenQuestionKeys,
    blockedQuestionFamilies: student.blockedQuestionFamilies,
    completedSessionCount: student.completedSessionCount,
    currentSessionIndex: sessionIndex,
    academicYear,
    gradeBand: String(gradeBand),
    repetitionPolicyVersion
  };
  // Aday üretimi: kabul başına deneme ölçümü
  let attemptsUsed = 0;
  let session = null;
  for (let i = 0; i < 3; i += 1) {
    session = createGameSession(gameId, profile, seed + i * 7919, options);
    attemptsUsed += (session.rounds || []).length || 1;
    if ((session.rounds || []).length >= game.sessionLength) break;
  }
  const rounds = (session?.rounds || []).map((r) => attachSemanticIdentity(r));
  const requested = game.sessionLength;
  const produced = rounds.length;
  const underfill = produced < requested;
  const meta = {
    studentId: student.id,
    academicYear,
    simulatedDate,
    sessionSequence: sessionIndex,
    sessionIndex,
    gameId,
    gradeBand: String(gradeBand)
  };
  for (const round of rounds) {
    if (round.questionKey) student.seenQuestionKeys.add(round.questionKey);
    student.attempts.push(recordAttempt(round, meta, true));
  }
  student.completedSessionCount += 1;
  student.sessionLog.push({
    sessionIndex,
    gameId,
    simulatedDate,
    gradeBand: String(gradeBand),
    requested,
    produced,
    underfill,
    familyIds: rounds.map((r) => r.familyId).filter(Boolean),
    skeletonIds: rounds.map((r) => r.skeletonId).filter(Boolean),
    structuralIds: rounds.map((r) => r.structuralId || buildCognitiveExperience(r).structuralId).filter(Boolean),
    cognitiveExperienceIds: rounds.map((r) => r.cognitiveExperienceId || buildCognitiveExperience(r).cognitiveExperienceId).filter(Boolean),
    questionKeys: rounds.map((r) => r.questionKey).filter(Boolean),
    surfaceFingerprints: rounds.map((r) => r.durableSurfaceFingerprint || r.semanticIdentity?.durableSurfaceFingerprint || r.surfaceFingerprint || r.semanticIdentity?.surfaceFingerprint).filter(Boolean),
    perceived: rounds.map((r) => buildCognitiveExperience(r).normalizedPerceivedStructure).filter(Boolean)
  });
  return { underfill, requested, produced, rounds, attemptsUsed, capacityFailure: session?.globalQualityAudit?.capacityFailure || null };
}

function countWindowViolations(sessionLog, key, lookbackSessions) {
  let violations = 0;
  for (let i = 0; i < sessionLog.length; i += 1) {
    const cur = new Set(sessionLog[i][key] || []);
    for (let j = Math.max(0, i - lookbackSessions); j < i; j += 1) {
      for (const id of sessionLog[j][key] || []) {
        if (cur.has(id)) violations += 1;
      }
    }
  }
  return violations;
}

function sameSessionFamilyRepeats(sessionLog) {
  let bad = 0;
  let total = 0;
  for (const s of sessionLog) {
    const fams = s.familyIds || [];
    total += fams.length;
    const seen = new Set();
    for (const f of fams) {
      if (seen.has(f)) bad += 1;
      seen.add(f);
    }
  }
  return { bad, total };
}

function rate(n, d) {
  if (!d) return 0;
  return Number((n / d).toFixed(4));
}

/**
 * Tek öğrenci veya class30 shard ölçümü.
 */
export function runCapacityShard({
  gameId,
  grade,
  age,
  sessions = 100,
  studentCount = 1,
  seedBase = 91001,
  repetitionPolicyVersion = 'v2',
  academicYear = '2025-2026',
  yearStartDate = '2025-09-08',
  sessionsPerWeek = 2
} = {}) {
  const t0 = Date.now();
  const gradeBand = grade === '6-8' ? '6-8' : String(grade);
  const baseAge = Number(age) || (Number(grade) === 8 ? 14 : Number(grade) === 4 ? 10 : 12);
  const baseGrade = grade === '6-8' ? 7 : Number(grade) || 6;
  const startMs = Date.parse(yearStartDate) || Date.parse('2025-09-08T09:00:00.000Z');
  const students = Array.from({ length: studentCount }, (_, i) => createStudent(
    studentCount === 1 ? `shard-${gameId}-g${gradeBand}` : `shard-${gameId}-s${i + 1}`,
    {
      age: baseAge,
      grade: baseGrade,
      skills: { lgsFamiliarity: 40, scientificReasoning: 40, attention: 40, science: 40 }
    },
    academicYear
  ));

  let requested = 0;
  let produced = 0;
  let underfillSessions = 0;
  let attemptsUsed = 0;
  let accepted = 0;
  const allQuestionKeys = [];
  const allSurfaces = [];
  let sameSessionFamilyBad = 0;
  let sameSessionFamilyTotal = 0;
  let skViol = 0;
  let stViol = 0;
  let cxViol = 0;
  let perceivedSame = 0;
  let perceivedTotal = 0;

  for (let si = 0; si < sessions; si += 1) {
    const week = Math.floor(si / sessionsPerWeek);
    const dayInWeek = si % sessionsPerWeek === 0 ? 1 : 4;
    const simulatedDate = new Date(startMs + (week * 7 + dayInWeek) * 86400000).toISOString();
    for (const student of students) {
      const result = playOne(student, gameId, seedBase + si * 97 + hashId(student.id), {
        sessionIndex: si,
        academicYear,
        simulatedDate,
        gradeBand,
        repetitionPolicyVersion
      });
      requested += result.requested;
      produced += result.produced;
      attemptsUsed += result.attemptsUsed;
      accepted += result.produced;
      if (result.underfill) underfillSessions += 1;
    }
  }

  for (const student of students) {
    const fam = sameSessionFamilyRepeats(student.sessionLog);
    sameSessionFamilyBad += fam.bad;
    sameSessionFamilyTotal += fam.total;
    skViol += countWindowViolations(student.sessionLog, 'skeletonIds', REPETITION_POLICY_V2.skeletonId.forbiddenLookbackSessions);
    stViol += countWindowViolations(student.sessionLog, 'structuralIds', REPETITION_POLICY_V2.structuralId.forbiddenLookbackSessions);
    cxViol += countWindowViolations(student.sessionLog, 'cognitiveExperienceIds', REPETITION_POLICY_V2.cognitiveExperienceId.forbiddenLookbackSessions);

    const qSeen = new Set();
    const sSeen = new Set();
    for (const s of student.sessionLog) {
      for (const q of s.questionKeys || []) {
        if (qSeen.has(q)) allQuestionKeys.push(q);
        qSeen.add(q);
      }
      for (const fp of s.surfaceFingerprints || []) {
        if (sSeen.has(fp)) allSurfaces.push(fp);
        sSeen.add(fp);
      }
      for (const p of s.perceived || []) {
        perceivedTotal += 1;
      }
    }
    // Algılanan aynı deneyim: yasak CX penceresi (önceki 2 oturum) içindeki tekrar.
    // Lifetime tekrar V2'de pedagojik olarak serbesttir; onu bu orana yazmayız.
    const cxLookback = REPETITION_POLICY_V2.cognitiveExperienceId.forbiddenLookbackSessions;
    for (let i = 0; i < student.sessionLog.length; i += 1) {
      const recent = new Set();
      for (let j = Math.max(0, i - cxLookback); j < i; j += 1) {
        for (const p of student.sessionLog[j].perceived || []) recent.add(p);
        for (const cx of student.sessionLog[j].cognitiveExperienceIds || []) recent.add(cx);
      }
      for (const p of student.sessionLog[i].perceived || []) {
        if (recent.has(p)) perceivedSame += 1;
      }
    }
  }

  const elapsedSeconds = Number(((Date.now() - t0) / 1000).toFixed(2));
  const totalSessions = sessions * studentCount;
  const metrics = {
    requested,
    produced,
    fillRate: rate(produced, requested),
    underfillRate: rate(underfillSessions, totalSessions),
    exactQuestionRepeatRate: rate(allQuestionKeys.length, Math.max(1, produced)),
    surfaceRepeatRate: rate(allSurfaces.length, Math.max(1, produced)),
    sameSessionFamilyRepeatRate: rate(sameSessionFamilyBad, Math.max(1, sameSessionFamilyTotal)),
    forbiddenWindowSkeletonRepeatRate: rate(skViol, Math.max(1, produced)),
    forbiddenWindowStructuralRepeatRate: rate(stViol, Math.max(1, produced)),
    forbiddenWindowCXRepeatRate: rate(cxViol, Math.max(1, produced)),
    perceivedSameExperienceRate: rate(perceivedSame, Math.max(1, perceivedTotal)),
    attemptsPerAccepted: accepted ? Number((attemptsUsed / accepted).toFixed(3)) : 999,
    elapsedSeconds,
    underfillSessions,
    totalSessions,
    studentCount,
    sessions
  };

  const pass = metrics.fillRate === 1
    && metrics.underfillRate === 0
    && metrics.exactQuestionRepeatRate === 0
    && metrics.surfaceRepeatRate === 0
    && metrics.sameSessionFamilyRepeatRate === 0
    && metrics.forbiddenWindowSkeletonRepeatRate === 0
    && metrics.forbiddenWindowStructuralRepeatRate === 0
    && metrics.forbiddenWindowCXRepeatRate === 0
    && metrics.perceivedSameExperienceRate < 0.12
    && metrics.attemptsPerAccepted <= 10
    && metrics.elapsedSeconds <= 120;

  return {
    gameId,
    gradeBand,
    grade: baseGrade,
    repetitionPolicyVersion,
    pass,
    metrics,
    failReasons: pass ? [] : Object.entries({
      fillRate: metrics.fillRate === 1,
      underfillRate: metrics.underfillRate === 0,
      exactQuestionRepeatRate: metrics.exactQuestionRepeatRate === 0,
      surfaceRepeatRate: metrics.surfaceRepeatRate === 0,
      sameSessionFamilyRepeatRate: metrics.sameSessionFamilyRepeatRate === 0,
      forbiddenWindowSkeletonRepeatRate: metrics.forbiddenWindowSkeletonRepeatRate === 0,
      forbiddenWindowStructuralRepeatRate: metrics.forbiddenWindowStructuralRepeatRate === 0,
      forbiddenWindowCXRepeatRate: metrics.forbiddenWindowCXRepeatRate === 0,
      perceivedSameExperienceRate: metrics.perceivedSameExperienceRate < 0.12,
      attemptsPerAccepted: metrics.attemptsPerAccepted <= 10,
      elapsedSeconds: metrics.elapsedSeconds <= 120
    }).filter(([, ok]) => !ok).map(([k]) => k)
  };
}

function hashId(id) {
  let h = 0;
  for (let i = 0; i < String(id).length; i += 1) h = ((h << 5) - h) + String(id).charCodeAt(i);
  return Math.abs(h) % 10007;
}

export default runCapacityShard;
