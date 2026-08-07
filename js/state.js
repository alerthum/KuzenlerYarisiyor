import { saveStoredState } from './storage.js';
import { calculateXpBreakdown, levelFromXp, updateSkillRating } from './engines/adaptive-engine.js';
import { previousDayKey, todayKey, uid } from './utils.js';
import { normalizeAcademicAttempt } from './curriculum/academic-metadata-v9.js';
import { buildQuarantineRecords, questionFamilyFromPayload, shouldImmediatelyQuarantine } from './quality/quarantine-v9.js';
import { updateV11MisconceptionProfile } from './engines/v11-misconception-profile.js';
import { refreshQuestionHealth } from './quality/question-health-monitor.js';

const DEFAULT_SKILLS = {
  vocabulary: 42,
  reading: 40,
  verbalLogic: 38,
  arithmetic: 43,
  problemSolving: 39,
  geometry: 38,
  patterns: 42,
  olympiad: 28,
  attention: 40,
  englishVocabulary: 35,
  englishGrammar: 34,
  science: 38,
  scientificReasoning: 36,
  socialHistory: 37,
  socialGeography: 36,
  citizenship: 38,
  religion: 35,
  lgsFamiliarity: 20
};

function baseProfile(overrides) {
  return {
    id: uid('profile'),
    name: 'Yeni Kuzen',
    age: 10,
    grade: 5,
    avatar: '🧠',
    subtitle: 'Kişisel Öğrenme Planı',
    xp: 0,
    stars: 0,
    streak: 0,
    lastActiveDate: null,
    skills: { ...DEFAULT_SKILLS },
    completedGames: 0,
    examPlans: [],
    examField: '',
    ...overrides
  };
}

export const DEFAULT_STATE = {
  version: 9,
  activeProfileId: null,
  profiles: [
    baseProfile({
      id: 'kucuk-kuzen',
      name: 'Küçük Kuzen',
      age: 9,
      grade: 4,
      avatar: '🌟',
      subtitle: '4. Sınıf • BİLSEM & Olimpiyat',
      skills: { ...DEFAULT_SKILLS, olympiad: 24, englishVocabulary: 32 }
    }),
    baseProfile({
      id: 'buyuk-kuzen',
      name: 'Büyük Kuzen',
      age: 13,
      grade: 8,
      avatar: '🚀',
      subtitle: '8. Sınıf • LGS & Olimpiyat',
      skills: { ...DEFAULT_SKILLS, reading: 45, arithmetic: 46, olympiad: 34, science: 42 }
    })
  ],
  platform: {
    accountMode: 'local',
    parentAccountId: null,
    organizationIds: [],
    classroomIds: [],
    migrationVersion: 1
  },
  organizations: [],
  classrooms: [],
  teacherImports: [],
  settings: {
    sound: true,
    timer: true,
    dailyMinutes: 25,
    parentPin: '1453'
  },
  attempts: [],
  daily: {},
  badges: [],
  seenQuestions: {},
  questionReports: [],
  questionHealth: {},
  blockedQuestionKeys: {},
  blockedQuestionFamilies: {},
  social: { seasonHistory: [], clubMemberships: [], familyLeagueIds: [] },
  aiMemory: {},
  misconceptionProfiles: {}
};

function normalizeProfile(profile) {
  const inferredGrade = Math.max(1, Math.min(12, Number(profile?.grade || Math.max(1, Number(profile?.age || 10) - 5))));
  return baseProfile({
    ...profile,
    grade: inferredGrade,
    skills: { ...DEFAULT_SKILLS, ...(profile?.skills || {}) },
    examPlans: Array.isArray(profile?.examPlans) && profile.examPlans.length ? profile.examPlans : (inferredGrade >= 12 ? ['YKS','KPSS'] : inferredGrade === 11 ? ['YKS'] : inferredGrade === 8 ? ['LGS'] : []),
    examField: profile?.examField || ''
  });
}

export function createInitialState(stored) {
  if (!stored) return structuredClone(DEFAULT_STATE);

  const storedProfiles = Array.isArray(stored.profiles) ? stored.profiles : [];
  const mergedDefaults = DEFAULT_STATE.profiles.map((profile) => normalizeProfile({
    ...profile,
    ...(storedProfiles.find((item) => item.id === profile.id) || {})
  }));
  const additionalProfiles = storedProfiles
    .filter((profile) => !DEFAULT_STATE.profiles.some((item) => item.id === profile.id))
    .map(normalizeProfile);

  return {
    ...structuredClone(DEFAULT_STATE),
    ...stored,
    version: 9,
    platform: { ...DEFAULT_STATE.platform, ...(stored.platform || {}) },
    organizations: Array.isArray(stored.organizations) ? stored.organizations : [],
    classrooms: Array.isArray(stored.classrooms) ? stored.classrooms : [],
    teacherImports: Array.isArray(stored.teacherImports) ? stored.teacherImports : [],
    settings: { ...DEFAULT_STATE.settings, ...(stored.settings || {}) },
    profiles: [...mergedDefaults, ...additionalProfiles],
    attempts: Array.isArray(stored.attempts) ? stored.attempts : [],
    daily: stored.daily || {},
    badges: Array.isArray(stored.badges) ? stored.badges : [],
    seenQuestions: stored.seenQuestions || {},
    questionReports: Array.isArray(stored.questionReports) ? stored.questionReports : [],
    questionHealth: stored.questionHealth || {},
    blockedQuestionKeys: stored.blockedQuestionKeys || {},
    blockedQuestionFamilies: stored.blockedQuestionFamilies || {},
    social: { ...DEFAULT_STATE.social, ...(stored.social || {}) },
    aiMemory: stored.aiMemory || {},
    misconceptionProfiles: stored.misconceptionProfiles || {}
  };
}

export function getProfile(state, profileId = state.activeProfileId) {
  return state.profiles.find((profile) => profile.id === profileId) || null;
}

export function setActiveProfile(state, profileId) {
  state.activeProfileId = profileId;
  saveStoredState(state);
}

export function ensureDailyPlan(state, profileId, date, missionIds, englishWordIds, options = {}) {
  const dailyKey = `${profileId}:${date}`;
  const current = state.daily[dailyKey] || {};
  const daily = {
    completedGameIds: Array.isArray(current.completedGameIds) ? current.completedGameIds : [],
    sessionCount: Number(current.sessionCount || 0),
    bestScores: current.bestScores || {},
    missionIds: (() => {
      const generated = Array.isArray(missionIds) ? missionIds.filter(Boolean) : [];
      if (options.replaceInvalidMissions === true) {
        const allowed = new Set(generated);
        const currentAllowed = Array.isArray(current.missionIds)
          ? current.missionIds.filter((gameId) => allowed.has(gameId))
          : [];
        return currentAllowed.length === generated.length && generated.length > 0
          ? currentAllowed
          : generated;
      }
      return Array.isArray(current.missionIds) && current.missionIds.length === 4
        ? current.missionIds
        : generated;
    })(),
    englishWordIds: Array.isArray(current.englishWordIds) && current.englishWordIds.length ? current.englishWordIds : englishWordIds,
    createdAt: current.createdAt || new Date().toISOString()
  };
  state.daily[dailyKey] = daily;
  saveStoredState(state);
  return daily;
}

export function recordAttempt(state, payload) {
  const profile = getProfile(state, payload.profileId);
  if (!profile) throw new Error('Profil bulunamadı.');

  const date = todayKey();
  const createdAt = new Date().toISOString();
  const attempt = normalizeAcademicAttempt({
    id: uid('attempt'),
    date,
    createdAt,
    answeredAt: createdAt,
    ...payload
  });
  state.attempts.push(attempt);
  updateV11MisconceptionProfile(state, attempt);
  if (payload.questionKey) refreshQuestionHealth(state, payload.questionKey, payload.responseKind || payload.kind || 'default');

  if (payload.questionKey) {
    state.seenQuestions[payload.profileId] ||= {};
    state.seenQuestions[payload.profileId][payload.questionKey] = attempt.createdAt;
  }

  const rewardEligible = payload.rewardEligible !== false;
  const xpBreakdown = rewardEligible
    ? calculateXpBreakdown(payload)
    : { base: 0, difficultyBonus: 0, noHintBonus: 0, persistenceBonus: 0, hintPenalty: 0, total: 0 };
  attempt.xp = xpBreakdown.total;
  attempt.xpBreakdown = xpBreakdown;
  if (rewardEligible) {
    profile.xp += xpBreakdown.total;
    profile.stars += payload.correct ? Math.max(1, Math.round(payload.difficulty / 2)) : 0;
  }
  profile.skills[payload.skill] = updateSkillRating(
    profile.skills[payload.skill] || 35,
    payload.correct,
    payload.hintsUsed,
    payload.elapsedSeconds
  );

  if (profile.lastActiveDate !== date) {
    profile.streak = profile.lastActiveDate === previousDayKey(date) ? profile.streak + 1 : 1;
    profile.lastActiveDate = date;
  }

  saveStoredState(state);
  return { attempt, xp: xpBreakdown.total, xpBreakdown, level: levelFromXp(profile.xp) };
}

export function completeGameSession(state, profileId, gameId, score, maxScore) {
  const profile = getProfile(state, profileId);
  if (!profile) return;
  profile.completedGames += 1;
  const date = todayKey();
  const dailyKey = `${profileId}:${date}`;
  const daily = state.daily[dailyKey] || { completedGameIds: [], sessionCount: 0, bestScores: {}, missionIds: [], englishWordIds: [] };
  if (!daily.completedGameIds.includes(gameId)) daily.completedGameIds.push(gameId);
  daily.sessionCount += 1;
  daily.bestScores[gameId] = Math.max(daily.bestScores[gameId] || 0, Math.round((score / Math.max(1, maxScore)) * 100));
  state.daily[dailyKey] = daily;
  saveStoredState(state);
}

export function seenQuestionKeysForProfile(state, profileId) {
  return new Set([
    ...Object.keys(state.seenQuestions?.[profileId] || {}),
    ...Object.keys(state.blockedQuestionKeys?.[profileId] || {}),
    ...Object.keys(state.blockedQuestionKeys?.__global || {})
  ]);
}


export function reportQuestion(state, payload) {
  const report = {
    id: uid('report'),
    createdAt: new Date().toISOString(),
    date: todayKey(),
    status: 'pending',
    resolutionNote: '',
    ...payload,
    questionFamilyId: questionFamilyFromPayload(payload)
  };
  state.questionReports.push(report);
  if (payload.profileId && payload.questionKey) {
    state.blockedQuestionKeys[payload.profileId] ||= {};
    state.blockedQuestionKeys[payload.profileId][payload.questionKey] = report.createdAt;
  }
  if (shouldImmediatelyQuarantine(report.reason)) {
    const quarantine = buildQuarantineRecords(report, payload.profileId || 'student');
    state.blockedQuestionKeys.__global ||= {};
    state.blockedQuestionFamilies.__global ||= {};
    if (quarantine.question) state.blockedQuestionKeys.__global[quarantine.question.questionKey] = quarantine.question.blockedAt;
    if (quarantine.family) state.blockedQuestionFamilies.__global[quarantine.family.questionFamilyId] = quarantine.family.blockedAt;
  }
  report.healthEvaluation = payload.questionKey
    ? refreshQuestionHealth(state, payload.questionKey, payload.responseKind || payload.kind || 'default')
    : null;
  saveStoredState(state);
  return report;
}

export function updateQuestionReportStatus(state, reportId, status, resolutionNote = '') {
  const report = state.questionReports.find((item) => item.id === reportId);
  if (!report) return null;
  report.status = status;
  report.resolutionNote = resolutionNote;
  report.reviewedAt = new Date().toISOString();
  saveStoredState(state);
  return report;
}

export function reportsForProfile(state, profileId) {
  return state.questionReports.filter((report) => report.profileId === profileId);
}

export function addProfile(state, overrides = {}) {
  const grade = Math.max(1, Math.min(12, Number(overrides.grade || 1)));
  const profile = baseProfile({
    name: overrides.name || `Kuzen ${state.profiles.length + 1}`,
    age: Number(overrides.age || grade + 5),
    grade,
    avatar: overrides.avatar || '🧠',
    subtitle: overrides.subtitle || `${grade}. Sınıf • Kişisel Öğrenme Planı`
  });
  state.profiles.push(profile);
  saveStoredState(state);
  return profile;
}

export function removeProfile(state, profileId) {
  if (state.profiles.length <= 1) return false;
  state.profiles = state.profiles.filter((profile) => profile.id !== profileId);
  if (state.activeProfileId === profileId) state.activeProfileId = state.profiles[0]?.id || null;
  saveStoredState(state);
  return true;
}

export function updateProfile(state, profileId, updates) {
  const profile = getProfile(state, profileId);
  if (!profile) return;
  Object.assign(profile, updates);
  saveStoredState(state);
}

export function updateSettings(state, updates) {
  Object.assign(state.settings, updates);
  saveStoredState(state);
}

export function attemptsForProfile(state, profileId) {
  return state.attempts.filter((attempt) => attempt.profileId === profileId);
}

export function resetProgress(state) {
  const fresh = structuredClone(DEFAULT_STATE);
  Object.keys(state).forEach((key) => delete state[key]);
  Object.assign(state, fresh);
  saveStoredState(state);
}
