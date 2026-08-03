import { PREMIUM_FAMILY_POOL_BY_GAME, selectPremiumFamily } from './premium-family-pool-v10.js';
const DEFAULT_FAMILY_BY_GAME = Object.freeze({
  'error-detective': 'math-error-chain',
  'paragraph-detective': 'tr-inference-evidence',
  'science-lab': 'science-variable-lab',
  'science-reasoning': 'science-variable-lab',
  'social-time-travel': 'social-source-compare',
  'religion-practice': 'religion-concept-situation',
  'english-cloze': 'english-context-choice',
  'logic-station': 'logic-constraint-grid',
  'olympiad-ladder': 'olympiad-invariant'
});

function roundKey(round = {}) {
  return round.questionKey || `${round.prompt || ''}|${round.context || ''}`;
}

function isPremium(round = {}) {
  return round.premiumTier === 'GOLD' || round.premiumShowcase === true;
}

/**
 * Kalite kapısından sonra eksilen oturumları doğrulanmış premium varyasyonlarla tamamlar.
 * Eski içerikleri körlemesine silmez; yalnız engellenen/eksik kalan kapasiteyi doldurur.
 */
export function transitionLegacyContent({
  gameId,
  game,
  profile,
  sessionSeed,
  rounds = [],
  targetCount = game?.sessionLength || rounds.length,
  seenQuestionKeys = new Set(),
  blockedQuestionFamilies = new Set(),
  generatePremiumQuestion,
  toRound,
  familyByGame = DEFAULT_FAMILY_BY_GAME,
  familyPoolByGame = PREMIUM_FAMILY_POOL_BY_GAME
} = {}) {
  const configuredPool = familyPoolByGame[gameId] || [];
  const fallbackFamily = familyByGame[gameId] || null;
  const familyPool = configuredPool.length ? [...configuredPool] : (fallbackFamily ? [fallbackFamily] : []);
  const familyId = familyPool[0] || null;
  const target = Math.max(0, Number(targetCount || 0));
  const source = [...rounds];
  const existingKeys = new Set([...seenQuestionKeys, ...source.map(roundKey)]);
  const audit = {
    gameId,
    familyId,
    familyPool,
    usedFamilyIds: [],
    requested: target,
    beforeCount: source.length,
    afterCount: source.length,
    attempted: 0,
    inserted: 0,
    skippedSeen: 0,
    skippedBlocked: 0,
    generationErrors: [],
    complete: source.length >= target,
    mode: 'quality-gap-fill'
  };

  if (!familyPool.length || typeof generatePremiumQuestion !== 'function' || typeof toRound !== 'function' || source.length >= target) {
    return { rounds: source.slice(0, target || source.length), audit };
  }
  if (familyPool.every(id => blockedQuestionFamilies.has(id))) {
    audit.skippedBlocked += familyPool.length;
    return { rounds: source.slice(0, target || source.length), audit };
  }

  const needed = target - source.length;
  const maxAttempts = Math.max(needed * 8, 12);
  for (let attempt = 0; attempt < maxAttempts && source.length < target; attempt += 1) {
    audit.attempted += 1;
    const selectedFamilyId = selectPremiumFamily({ gameId, attempt, blockedQuestionFamilies, usedFamilyIds: new Set(audit.usedFamilyIds) }) || familyPool.find(id => !blockedQuestionFamilies.has(id));
    if (!selectedFamilyId) { audit.skippedBlocked += 1; continue; }
    const seed = `${profile?.id || 'profile'}:${gameId}:${sessionSeed}:migration:${selectedFamilyId}:${attempt}`;
    const result = generatePremiumQuestion(selectedFamilyId, seed);
    if (!result?.ok || !result.question) {
      audit.generationErrors.push(result?.error || 'generation_failed');
      continue;
    }
    const question = result.question;
    if (existingKeys.has(question.questionKey)) {
      audit.skippedSeen += 1;
      continue;
    }
    const round = toRound(question, game, Math.max(3, Number(question.difficulty || 3)));
    const premiumRound = {
      ...round,
      subjectId: question.subjectId,
      visibleCardId: question.visibleCardId,
      topicId: question.topicId || null,
      learningOutcomeId: question.learningOutcomeId,
      thinkingPatternId: question.thinkingPatternId,
      cognitiveDepth: question.cognitiveDepth,
      familyId: question.familyId,
      questionKey: question.questionKey,
      distractorValidation: question.distractorValidation,
      premiumTier: 'GOLD',
      premiumMigration: true,
      sourceLabel: 'Zihin Arenası GOLD Geçiş Havuzu'
    };
    existingKeys.add(question.questionKey);
    source.push(premiumRound);
    audit.inserted += 1;
    if (!audit.usedFamilyIds.includes(selectedFamilyId)) audit.usedFamilyIds.push(selectedFamilyId);
  }

  audit.afterCount = source.length;
  audit.complete = source.length >= target;
  return { rounds: source.slice(0, target || source.length), audit };
}

export { DEFAULT_FAMILY_BY_GAME };
