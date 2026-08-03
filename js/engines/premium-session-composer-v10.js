function roundKey(round = {}) {
  return round.questionKey || `${round.prompt || ''}|${round.context || ''}`;
}

function patternOf(round = {}) {
  return round.thinkingPatternId || round.cognitivePattern || round.familyId || round.kind || 'unknown';
}

function difficultyOf(round = {}) {
  return Number(round.cognitiveDepth || round.difficulty || 3);
}

function uniqueRounds(rounds = []) {
  const seen = new Set();
  return rounds.filter((round) => {
    const key = roundKey(round);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function pickDiverseMiddle(rounds = [], count = 0) {
  const selected = [];
  const remaining = [...rounds];
  const patternCounts = new Map();

  while (selected.length < count && remaining.length) {
    remaining.sort((a, b) => {
      const aCount = patternCounts.get(patternOf(a)) || 0;
      const bCount = patternCounts.get(patternOf(b)) || 0;
      if (aCount !== bCount) return aCount - bCount;
      return difficultyOf(a) - difficultyOf(b);
    });
    const next = remaining.shift();
    selected.push(next);
    const pattern = patternOf(next);
    patternCounts.set(pattern, (patternCounts.get(pattern) || 0) + 1);
  }

  return selected;
}

export function composePremiumSession(rounds = [], {
  targetCount = rounds.length,
  firstExperience = false,
  remediationShare = 0.25,
  brainPolicy = null
} = {}) {
  const source = uniqueRounds(rounds);
  const effectiveRemediationShare = Number(brainPolicy?.remediationShare ?? remediationShare);
  const targetDifficulty = Number(brainPolicy?.targetDifficulty || 3);
  const weakPatterns = new Set(brainPolicy?.weakPatterns || []);
  const limit = Math.max(0, Math.min(Number(targetCount || source.length), source.length));
  if (!limit) {
    return {
      rounds: [],
      audit: { targetCount: 0, opening: null, closing: null, patternCount: 0, balanced: true }
    };
  }

  const gold = source.find((round) => round.premiumTier === 'GOLD' || round.premiumShowcase);
  const opening = firstExperience && gold ? gold : source[0];
  const remaining = source.filter((round) => roundKey(round) !== roundKey(opening));

  const remediationLimit = Math.max(1, Math.floor(limit * effectiveRemediationShare));
  let remediationUsed = 0;
  const eligible = remaining.filter((round) => {
    if (!round.adaptivePlacement) return true;
    remediationUsed += 1;
    return remediationUsed <= remediationLimit;
  });

  let closing = null;
  if (limit > 1 && eligible.length) {
    closing = [...eligible].sort((a, b) => difficultyOf(b) - difficultyOf(a))[0];
  }

  const middlePool = closing
    ? eligible.filter((round) => roundKey(round) !== roundKey(closing))
    : eligible;
  const prioritizedMiddlePool = [...middlePool].sort((a, b) => {
    const aWeak = weakPatterns.has(patternOf(a)) ? -1 : 0;
    const bWeak = weakPatterns.has(patternOf(b)) ? -1 : 0;
    if (aWeak !== bWeak) return aWeak - bWeak;
    return Math.abs(difficultyOf(a) - targetDifficulty) - Math.abs(difficultyOf(b) - targetDifficulty);
  });
  const middle = pickDiverseMiddle(prioritizedMiddlePool, Math.max(0, limit - 1 - (closing ? 1 : 0)));
  const composed = uniqueRounds([opening, ...middle, ...(closing ? [closing] : [])]).slice(0, limit);

  const patterns = composed.map(patternOf);
  const patternCounts = patterns.reduce((map, pattern) => {
    map.set(pattern, (map.get(pattern) || 0) + 1);
    return map;
  }, new Map());
  const dominantPatternCount = Math.max(0, ...patternCounts.values());

  return {
    rounds: composed,
    audit: {
      targetCount: limit,
      producedCount: composed.length,
      opening: roundKey(opening),
      closing: closing ? roundKey(closing) : null,
      openingIsGold: Boolean(opening?.premiumTier === 'GOLD' || opening?.premiumShowcase),
      patternCount: patternCounts.size,
      dominantPatternCount,
      balanced: composed.length < 4 || dominantPatternCount <= Math.ceil(composed.length / 2),
      remediationCount: composed.filter((round) => round.adaptivePlacement).length,
      difficultyCurve: composed.map(difficultyOf),
      brainAdaptation: {
        enabled: Boolean(brainPolicy),
        targetDifficulty,
        weakPatterns: [...weakPatterns],
        remediationShare: effectiveRemediationShare
      }
    }
  };
}
