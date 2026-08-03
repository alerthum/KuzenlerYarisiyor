import { clamp, hashString, seededRandom, shuffle, todayKey } from '../utils.js';

export const SKILLS = {
  vocabulary: 'Kelime Bilgisi',
  reading: 'Okuduğunu Anlama',
  verbalLogic: 'Sözel Mantık',
  arithmetic: 'İşlem Becerisi',
  problemSolving: 'Problem Çözme',
  geometry: 'Geometri',
  patterns: 'Örüntü',
  olympiad: 'Olimpiyat Stratejisi',
  attention: 'Dikkat',
  englishVocabulary: 'İngilizce Kelime',
  englishGrammar: 'İngilizce Cümle',
  science: 'Fen Bilgisi',
  scientificReasoning: 'Bilimsel Akıl Yürütme',
  socialHistory: 'Tarihsel Düşünme',
  socialGeography: 'Harita ve Coğrafya',
  citizenship: 'Vatandaşlık ve Medya',
  religion: 'Din Kültürü',
  lgsFamiliarity: 'LGS Soru Kalıbı' 
};

export const DAILY_CORE_CATEGORIES = ['turkish', 'math', 'olympiad', 'logic'];

export function difficultyFromRating(age, rating = 40) {
  const ageBase = age <= 10 ? 1 : 2;
  if (rating < 28) return ageBase;
  if (rating < 52) return ageBase + 1;
  if (rating < 76) return ageBase + 2;
  return Math.min(5, ageBase + 3);
}

export function updateSkillRating(current, correct, hintsUsed = 0, elapsedSeconds = 0) {
  const base = correct ? 5 : -2.5;
  const hintPenalty = correct ? hintsUsed * 0.7 : 0;
  const persistenceBonus = !correct && elapsedSeconds >= 35 ? 0.6 : 0;
  return Math.round(clamp(current + base - hintPenalty + persistenceBonus, 5, 100) * 10) / 10;
}

export function calculateXpBreakdown({ correct, difficulty = 1, hintsUsed = 0, elapsedSeconds = 0 }) {
  const base = correct ? 18 : 5;
  const difficultyBonus = difficulty * (correct ? 4 : 1);
  const noHintBonus = correct && hintsUsed === 0 ? 7 : 0;
  const persistenceBonus = elapsedSeconds >= 40 ? 3 : 0;
  const hintPenalty = hintsUsed * 2;
  const total = Math.max(3, Math.round(base + difficultyBonus + noHintBonus + persistenceBonus - hintPenalty));
  return { base, difficultyBonus, noHintBonus, persistenceBonus, hintPenalty, total };
}

export function calculateXp(payload) {
  return calculateXpBreakdown(payload).total;
}

export function levelFromXp(xp = 0) {
  const level = Math.floor(Math.sqrt(Math.max(0, xp) / 90)) + 1;
  const levelStart = (level - 1) ** 2 * 90;
  const nextLevel = level ** 2 * 90;
  const progress = ((xp - levelStart) / Math.max(1, nextLevel - levelStart)) * 100;
  return { level, levelStart, nextLevel, progress: clamp(progress, 0, 100) };
}

export function createDailyMissionIds(profile, gameCatalog, date = todayKey()) {
  const grade = Number(profile.grade || Math.max(1, profile.age - 5));
  const available = gameCatalog.filter((game) => game.minAge <= profile.age && game.maxAge >= profile.age && (game.minGrade || 1) <= grade && (game.maxGrade || 12) >= grade);
  const random = seededRandom(hashString(`${profile.id}-${date}-daily-v4`));

  return DAILY_CORE_CATEGORIES.map((category) => {
    const candidates = available
      .filter((game) => game.category === category)
      .sort((a, b) => (profile.skills?.[a.skill] || 40) - (profile.skills?.[b.skill] || 40));
    const weakestRating = candidates.length ? (profile.skills?.[candidates[0].skill] || 40) : 0;
    const weakest = candidates.filter((game) => (profile.skills?.[game.skill] || 40) === weakestRating);
    return shuffle(weakest.length ? weakest : candidates, random)[0]?.id;
  }).filter(Boolean);
}

export function createDailyEnglishWordIds(profile, words, seenQuestionKeys, date = todayKey(), count = 20) {
  const seen = seenQuestionKeys instanceof Set ? seenQuestionKeys : new Set(seenQuestionKeys || []);
  const eligible = words.filter((word) => (word.minAge || 0) <= profile.age && !seen.has(`english-vocabulary:${word.id}`));
  const random = seededRandom(hashString(`${profile.id}-${date}-english-v4`));
  return shuffle(eligible, random).slice(0, count).map((word) => word.id);
}

export function accuracyForAttempts(attempts = []) {
  if (!attempts.length) return 0;
  return Math.round((attempts.filter((attempt) => attempt.correct).length / attempts.length) * 100);
}
