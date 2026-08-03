export function buildLearningMemory(profile, attempts = []) {
  const bySkill = new Map();
  const byGame = new Map();
  for (const attempt of attempts) {
    const skill = attempt.skill || 'general';
    const gameId = attempt.gameId || 'unknown';
    const skillRow = bySkill.get(skill) || { attempts: 0, correct: 0, hints: 0, seconds: 0 };
    skillRow.attempts += 1; skillRow.correct += attempt.correct ? 1 : 0; skillRow.hints += Number(attempt.hintsUsed || 0); skillRow.seconds += Number(attempt.elapsedSeconds || 0); bySkill.set(skill, skillRow);
    const gameRow = byGame.get(gameId) || { attempts: 0, correct: 0, lastSeenAt: null };
    gameRow.attempts += 1; gameRow.correct += attempt.correct ? 1 : 0; gameRow.lastSeenAt = attempt.createdAt || gameRow.lastSeenAt; byGame.set(gameId, gameRow);
  }
  return { learnerId: profile?.id, grade: Number(profile?.grade || 1), age: Number(profile?.age || 0), examPlans: profile?.examPlans || [], bySkill: Object.fromEntries(bySkill), byGame: Object.fromEntries(byGame), lastUpdatedAt: new Date().toISOString() };
}
