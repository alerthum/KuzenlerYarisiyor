function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function patternOf(item = {}) {
  return item.thinkingPatternId || item.cognitivePattern || item.familyId || item.questionFamilyId || 'unknown';
}

function difficultyOf(item = {}) {
  return clamp(item.cognitiveDepth || item.cognitiveLevel || item.difficulty || 3, 1, 5);
}

export function buildStudentBrainProfile(attempts = [], { recentLimit = 80 } = {}) {
  const recent = [...attempts].slice(-Math.max(10, recentLimit));
  const rows = new Map();
  let correct = 0;
  let hints = 0;
  let seconds = 0;

  for (const attempt of recent) {
    const pattern = patternOf(attempt);
    const row = rows.get(pattern) || { pattern, attempts: 0, correct: 0, hints: 0, seconds: 0, difficulty: 0 };
    row.attempts += 1;
    row.correct += attempt.correct ? 1 : 0;
    row.hints += Number(attempt.hintCount ?? attempt.hintsUsed ?? 0);
    row.seconds += Number(attempt.durationSeconds ?? attempt.elapsedSeconds ?? 0);
    row.difficulty += difficultyOf(attempt);
    rows.set(pattern, row);
    correct += attempt.correct ? 1 : 0;
    hints += Number(attempt.hintCount ?? attempt.hintsUsed ?? 0);
    seconds += Number(attempt.durationSeconds ?? attempt.elapsedSeconds ?? 0);
  }

  const patternStats = [...rows.values()].map((row) => {
    const accuracy = row.attempts ? row.correct / row.attempts : 0;
    const avgHints = row.hints / Math.max(1, row.attempts);
    const avgSeconds = row.seconds / Math.max(1, row.attempts);
    const confidence = Math.min(1, row.attempts / 8);
    const strength = clamp((accuracy * 0.7 + (1 - Math.min(1, avgHints / 3)) * 0.15 + (1 - Math.min(1, avgSeconds / 180)) * 0.15) * confidence, 0, 1);
    return {
      pattern: row.pattern,
      attempts: row.attempts,
      accuracy: Math.round(accuracy * 100),
      averageHints: Number(avgHints.toFixed(2)),
      averageSeconds: Math.round(avgSeconds),
      averageDifficulty: Number((row.difficulty / Math.max(1, row.attempts)).toFixed(2)),
      strength: Math.round(strength * 100)
    };
  }).sort((a, b) => a.strength - b.strength);

  const total = recent.length;
  const overallAccuracy = total ? correct / total : 0;
  const averageHints = hints / Math.max(1, total);
  const averageSeconds = seconds / Math.max(1, total);
  const preferredDifficulty = total < 5 ? 3 : overallAccuracy >= 0.86 && averageHints <= 0.35 ? 5 : overallAccuracy >= 0.68 ? 4 : 3;

  return {
    sampleSize: total,
    overallAccuracy: Math.round(overallAccuracy * 100),
    averageHints: Number(averageHints.toFixed(2)),
    averageSeconds: Math.round(averageSeconds),
    preferredDifficulty,
    weakPatterns: patternStats.filter((item) => item.attempts >= 2).slice(0, 3).map((item) => item.pattern),
    strongPatterns: [...patternStats].filter((item) => item.attempts >= 2).sort((a, b) => b.strength - a.strength).slice(0, 3).map((item) => item.pattern),
    patternStats,
    evidenceLevel: total >= 30 ? 'high' : total >= 10 ? 'medium' : 'low'
  };
}

export function brainProfileSessionPolicy(profile = {}) {
  const weak = new Set(profile.weakPatterns || []);
  const strong = new Set(profile.strongPatterns || []);
  return {
    targetDifficulty: clamp(profile.preferredDifficulty || 3, 3, 5),
    weakPatterns: [...weak],
    strongPatterns: [...strong],
    remediationShare: profile.evidenceLevel === 'high' ? 0.25 : profile.evidenceLevel === 'medium' ? 0.2 : 0.15,
    challengeShare: profile.overallAccuracy >= 80 ? 0.3 : profile.overallAccuracy >= 65 ? 0.2 : 0.1
  };
}
