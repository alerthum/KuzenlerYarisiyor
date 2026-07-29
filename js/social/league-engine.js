const LEAGUES = [
  { id: 'bronze', name: 'Bronz', minXp: 0, icon: '🥉' },
  { id: 'silver', name: 'Gümüş', minXp: 350, icon: '🥈' },
  { id: 'gold', name: 'Altın', minXp: 900, icon: '🥇' },
  { id: 'diamond', name: 'Elmas', minXp: 1800, icon: '💎' },
  { id: 'master', name: 'Usta', minXp: 3200, icon: '🛡️' },
  { id: 'champion', name: 'Şampiyon', minXp: 5200, icon: '👑' }
];

export function isoWeekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function seasonKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function weeklyXp(attempts = [], now = new Date()) {
  const key = isoWeekKey(now);
  return attempts
    .filter((attempt) => isoWeekKey(new Date(attempt.createdAt || attempt.date || now)) === key)
    .reduce((sum, attempt) => sum + Number(attempt.xp || 0), 0);
}

export function leagueForXp(xp = 0) {
  return [...LEAGUES].reverse().find((league) => Number(xp) >= league.minXp) || LEAGUES[0];
}

export function leagueProgress(xp = 0) {
  const current = leagueForXp(xp);
  const index = LEAGUES.findIndex((item) => item.id === current.id);
  const next = LEAGUES[index + 1] || null;
  const progress = next ? Math.max(0, Math.min(100, Math.round((xp - current.minXp) / (next.minXp - current.minXp) * 100))) : 100;
  return { current, next, progress };
}

export function earnedBadges(profile, attempts = []) {
  const correct = attempts.filter((item) => item.correct).length;
  const noHintCorrect = attempts.filter((item) => item.correct && Number(item.hintsUsed || 0) === 0).length;
  const games = new Set(attempts.map((item) => item.gameId)).size;
  const badges = [];
  if (attempts.length >= 10) badges.push({ id: 'starter', icon: '🚀', name: 'Arena Başlangıcı', detail: '10 soru çözdü' });
  if (correct >= 50) badges.push({ id: 'fifty', icon: '🎯', name: 'Keskin Zihin', detail: '50 doğru cevap' });
  if (noHintCorrect >= 25) badges.push({ id: 'independent', icon: '🧠', name: 'Bağımsız Çözücü', detail: '25 ipucusuz doğru' });
  if (games >= 8) badges.push({ id: 'explorer', icon: '🧭', name: 'Oyun Kaşifi', detail: '8 farklı oyun' });
  if (Number(profile?.streak || 0) >= 7) badges.push({ id: 'streak7', icon: '🔥', name: 'Yedi Gün Serisi', detail: '7 gün devamlılık' });
  return badges;
}

export function socialSnapshot(profile, attempts = []) {
  const weekXp = weeklyXp(attempts);
  const league = leagueProgress(weekXp);
  const today = new Date().toISOString().slice(0, 10);
  return {
    seasonId: seasonKey(),
    weekId: isoWeekKey(),
    weeklyXp: weekXp,
    league,
    badges: earnedBadges(profile, attempts),
    dailyChallenge: {
      targetQuestions: 12,
      solved: attempts.filter((item) => item.date === today).length
    }
  };
}

export { LEAGUES };
