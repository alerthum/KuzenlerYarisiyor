function dayKey(value) {
  const date = new Date(value || Date.now());
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0,10);
}

function attemptScore(attempt) {
  const difficulty = Math.max(1, Math.min(5, Number(attempt.difficulty || 3)));
  const cognitive = Math.max(1, Math.min(5, Number(attempt.cognitiveLevel || attempt.cognitiveDepth || difficulty)));
  const hints = Number(attempt.hintCount ?? attempt.hintsUsed ?? 0);
  const seconds = Number(attempt.durationSeconds ?? attempt.elapsedSeconds ?? 0);
  const correctness = attempt.correct ? 1 : 0;
  const challengeWeight = 0.7 + ((difficulty + cognitive) / 10) * 0.6;
  const hintFactor = Math.max(0.45, 1 - hints * 0.12);
  const speedFactor = seconds <= 0 ? 0.9 : seconds < 30 ? 1.05 : seconds < 90 ? 1 : seconds < 180 ? 0.9 : 0.78;
  return Math.max(0, Math.min(1, correctness * challengeWeight * hintFactor * speedFactor));
}

export function masteryStatus(score, distinctDays, attempts) {
  if (attempts < 3) return 'Keşfediliyor';
  if (score < 0.48) return 'Gelişiyor';
  if (score < 0.68 || distinctDays < 2) return 'Pekişiyor';
  if (score < 0.84 || distinctDays < 3) return 'Ustalaştı';
  return 'Kalıcılaştı';
}

export function buildTopicMastery(attempts = []) {
  const rows = new Map();
  for (const attempt of attempts) {
    const topicId = attempt.topicId || 'general';
    const row = rows.get(topicId) || { topicId, attempts:0, correct:0, hints:0, seconds:0, weighted:0, difficultyTotal:0, days:new Set(), cardIds:new Set(), familyIds:new Set() };
    row.attempts += 1;
    row.correct += attempt.correct ? 1 : 0;
    row.hints += Number(attempt.hintCount ?? attempt.hintsUsed ?? 0);
    row.seconds += Number(attempt.durationSeconds ?? attempt.elapsedSeconds ?? 0);
    row.weighted += attemptScore(attempt);
    row.difficultyTotal += Number(attempt.difficulty || 3);
    row.days.add(dayKey(attempt.answeredAt || attempt.createdAt));
    if (attempt.visibleCardId) row.cardIds.add(attempt.visibleCardId);
    if (attempt.questionFamilyId || attempt.familyId) row.familyIds.add(attempt.questionFamilyId || attempt.familyId);
    rows.set(topicId,row);
  }
  return [...rows.values()].map(row => {
    const masteryScore = row.attempts ? row.weighted / row.attempts : 0;
    const accuracy = row.attempts ? Math.round(row.correct / row.attempts * 100) : 0;
    return {
      topicId: row.topicId,
      attempts: row.attempts,
      accuracy,
      masteryScore: Math.round(masteryScore * 100),
      averageHints: Number((row.hints / Math.max(1,row.attempts)).toFixed(2)),
      averageSeconds: Math.round(row.seconds / Math.max(1,row.attempts)),
      averageDifficulty: Number((row.difficultyTotal / Math.max(1,row.attempts)).toFixed(2)),
      distinctDays: row.days.size,
      cardDiversity: row.cardIds.size,
      familyDiversity: row.familyIds.size,
      status: masteryStatus(masteryScore,row.days.size,row.attempts)
    };
  }).sort((a,b)=>a.masteryScore-b.masteryScore);
}

export function silentRemediationPlan(attempts = [], { maxTopics=3, maxShare=0.25 } = {}) {
  const weak = buildTopicMastery(attempts)
    .filter(row => row.attempts >= 2 && row.status !== 'Kalıcılaştı')
    .slice(0,maxTopics);
  return weak.map((row,index)=>({
    topicId: row.topicId,
    priority: index + 1,
    recommendedShare: Math.min(maxShare, Number((0.15 + (100-row.masteryScore)/500).toFixed(2))),
    intervention: row.masteryScore < 45 ? 'micro-teach-and-practice' : row.masteryScore < 68 ? 'distributed-practice' : 'retention-check',
    reason: `${row.status} • %${row.accuracy} doğruluk • ${row.distinctDays} gün`
  }));
}

export function difficultyEscalationForCard(attempts = [], visibleCardId) {
  const related = attempts.filter(item => item.visibleCardId === visibleCardId);
  const recentByDay = new Map();
  for (const item of related) {
    const key = dayKey(item.answeredAt || item.createdAt);
    const list = recentByDay.get(key) || [];
    list.push(item); recentByDay.set(key,list);
  }
  const strongDays = [...recentByDay.values()].filter(dayAttempts => {
    if (dayAttempts.length < 3) return false;
    const accuracy = dayAttempts.filter(x=>x.correct).length / dayAttempts.length;
    const avgHints = dayAttempts.reduce((s,x)=>s+Number(x.hintCount ?? x.hintsUsed ?? 0),0)/dayAttempts.length;
    return accuracy >= 0.9 && avgHints <= 0.35 && new Set(dayAttempts.map(x=>x.questionFamilyId || x.familyId)).size >= 2;
  }).length;
  return {
    visibleCardId,
    strongDays,
    escalate: strongDays >= 5,
    targetDifficulty: strongDays >= 5 ? 5 : strongDays >= 3 ? 4 : 3,
    strategy: strongDays >= 5 ? ['closer-distractors','multi-outcome','reverse-reasoning','error-analysis','justification'] : ['maintain-variety']
  };
}
