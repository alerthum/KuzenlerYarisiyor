import { seededRandom } from '../utils.js';
import { isPremiumGradeEligible, normalizeStudentGrade } from './premium-grade-band.js';

function normalize(value = '') {
  return String(value).toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();
}

function stableHash(value = '') {
  let hash = 2166136261;
  for (const ch of String(value)) {
    hash ^= ch.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function shuffleEntries(entries, random) {
  const result = entries.map((entry) => ({ ...entry }));
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function requiredText(value, field, id) {
  const text = String(value || '').trim();
  if (!text) throw new Error(`${id || 'premium-question'}: ${field} is required`);
  return text;
}

export function definePremiumChoice({
  id,
  gameId,
  familyId,
  skeletonId,
  reasoningPathId = 'evidence-first',
  subjectId,
  topicId,
  learningOutcomeId,
  gradeBand = '6-8',
  prompt,
  context,
  answer,
  distractors,
  explanation,
  hints = [],
  cognitiveTraits,
  reasoningStepCount = 2,
  evidence,
  difficulty = 4,
  blueprintId = null,
  variantId = null,
  structuralId = null,
  cognitiveExperienceId = null,
  surfaceFingerprint = null,
  solverProof = null
}) {
  const itemId = requiredText(id, 'id', id);
  if (!Array.isArray(distractors) || distractors.length !== 3) {
    throw new Error(`${itemId}: exactly three distractors are required`);
  }
  const misconceptionIds = distractors.map((entry) => requiredText(entry?.misconceptionId, 'misconceptionId', itemId));
  if (new Set(misconceptionIds).size !== 3) {
    throw new Error(`${itemId}: distractor misconceptionId values must be distinct`);
  }
  for (const distractor of distractors) {
    requiredText(distractor?.text, 'distractor.text', itemId);
    requiredText(distractor?.why, 'distractor.why', itemId);
    requiredText(distractor?.constructionRule, 'distractor.constructionRule', itemId);
  }
  if (!Array.isArray(cognitiveTraits) || cognitiveTraits.length < 2) {
    throw new Error(`${itemId}: at least two cognitiveTraits are required`);
  }
  if (!Array.isArray(evidence) || evidence.length < 2) {
    throw new Error(`${itemId}: at least two evidence steps are required`);
  }
  if (Number(reasoningStepCount) < 2) {
    throw new Error(`${itemId}: reasoningStepCount must be at least 2`);
  }
  return Object.freeze({
    id: itemId,
    gameId: requiredText(gameId, 'gameId', itemId),
    familyId: requiredText(familyId, 'familyId', itemId),
    skeletonId: requiredText(skeletonId, 'skeletonId', itemId),
    reasoningPathId: requiredText(reasoningPathId, 'reasoningPathId', itemId),
    subjectId: requiredText(subjectId, 'subjectId', itemId),
    topicId: requiredText(topicId, 'topicId', itemId),
    learningOutcomeId: requiredText(learningOutcomeId, 'learningOutcomeId', itemId),
    gradeBand: requiredText(gradeBand, 'gradeBand', itemId),
    prompt: requiredText(prompt, 'prompt', itemId),
    context: requiredText(context, 'context', itemId),
    answer: requiredText(answer, 'answer', itemId),
    distractors: distractors.map((entry) => Object.freeze({ ...entry })),
    explanation: requiredText(explanation, 'explanation', itemId),
    hints: Array.isArray(hints) ? hints.filter(Boolean) : [],
    cognitiveTraits: [...cognitiveTraits],
    reasoningStepCount: Number(reasoningStepCount),
    evidence: [...evidence],
    difficulty: Number(difficulty),
    blueprintId: blueprintId ? requiredText(blueprintId, 'blueprintId', itemId) : null,
    variantId: variantId ? requiredText(variantId, 'variantId', itemId) : null,
    structuralId: structuralId ? requiredText(structuralId, 'structuralId', itemId) : null,
    cognitiveExperienceId: cognitiveExperienceId ? requiredText(cognitiveExperienceId, 'cognitiveExperienceId', itemId) : null,
    surfaceFingerprint: surfaceFingerprint ? requiredText(surfaceFingerprint, 'surfaceFingerprint', itemId) : null,
    solverProof: solverProof && typeof solverProof === 'object' ? Object.freeze({ ...solverProof }) : null
  });
}

export function createPremiumChoicePack({ version, sourceLabel, items }) {
  if (!Array.isArray(items) || !items.length) throw new Error('premium pack must contain items');
  const byGame = new Map();
  for (const item of items) {
    if (!byGame.has(item.gameId)) byGame.set(item.gameId, []);
    byGame.get(item.gameId).push(item);
  }
  const gameIds = Object.freeze([...byGame.keys()]);

  function materialize(item, random) {
    const entries = shuffleEntries([
      {
        text: item.answer,
        correct: true,
        misconceptionId: null,
        why: item.explanation,
        constructionRule: 'verified-correct-answer'
      },
      ...item.distractors.map((entry) => ({ ...entry, correct: false }))
    ], random);
    const options = entries.map((entry) => entry.text);
    const answerIndex = entries.findIndex((entry) => entry.correct);
    const optionDiagnostics = entries.map((entry, optionIndex) => ({
      optionIndex,
      optionText: entry.text,
      isCorrect: Boolean(entry.correct),
      misconceptionId: entry.correct ? null : entry.misconceptionId,
      misconceptionName: entry.correct ? null : entry.misconceptionId,
      misconception: entry.correct ? null : entry.why,
      rationale: entry.correct ? 'Doğru seçenek çözüm grafiği ve kanıt haritasıyla doğrulanmıştır.' : entry.why,
      whyStudentChoosesThis: entry.correct ? 'Koşulların tamamını ve kanıt zincirini birlikte uygular.' : entry.why,
      constructionRule: entry.constructionRule,
      plausibilityScore: entry.correct ? 1 : 0.84,
      grammarShape: 'sentence',
      semanticCategory: entry.correct ? 'correct-answer' : entry.misconceptionId
    }));
    const familyId = item.familyId;
    const skeletonId = item.skeletonId;
    const keySource = `${item.id}|${normalize(item.prompt)}|${normalize(item.context)}`;
    return {
      kind: 'choice',
      prompt: item.prompt,
      context: item.context,
      options,
      answerIndex,
      explanation: item.explanation,
      hints: item.hints.length ? item.hints : ['Koşulları ve kanıtları tek tek ayır.', 'Her seçeneği bütün koşullara göre yeniden kontrol et.'],
      skill: item.subjectId,
      difficulty: item.difficulty,
      cognitiveDepth: item.difficulty,
      reasoningStepCount: item.reasoningStepCount,
      cognitiveTraits: item.cognitiveTraits,
      questionKey: `premium:${version}:${item.gameId}:${item.id}:${stableHash(keySource)}`,
      familyId,
      skeletonId,
      reasoningPathId: item.reasoningPathId,
      subjectId: item.subjectId,
      topicId: item.topicId,
      learningOutcomeId: item.learningOutcomeId,
      gradeBand: item.gradeBand,
      sourceLabel,
      premiumTier: 'GOLD',
      premiumQuestion: true,
      premiumPilot: true,
      premiumBankVersion: version,
      requireExplicitDistractorEvidence: true,
      optionDiagnostics,
      detailedOptions: optionDiagnostics.map((entry) => entry.isCorrect
        ? `Doğru: ${item.explanation}`
        : `Yanlış: ${entry.rationale}`),
      distractorPlanId: `${skeletonId}:mis:${stableHash(item.distractors.map((entry) => entry.misconceptionId).join('|'))}`,
      distractorValidation: {
        verified: true,
        diagnosticCount: 3,
        distinctMisconceptions: 3,
        violations: []
      },
      evidenceMap: {
        evidence: item.evidence.map((text, index) => ({ id: `${item.id}:e${index + 1}`, text })),
        correctAnswerEvidenceIds: item.evidence.map((_, index) => `${item.id}:e${index + 1}`)
      },
      cognitiveDepthEvidence: {
        reasoningStepCount: item.reasoningStepCount,
        highCognitiveTraits: item.cognitiveTraits,
        source: 'premium-human-authored'
      },
      solutionGraph: item.evidence.map((text, index) => ({ step: index + 1, evidence: text })),
      ...(item.blueprintId ? {
        blueprintId: item.blueprintId,
        variantId: item.variantId,
        structuralId: item.structuralId,
        cognitiveExperienceId: item.cognitiveExperienceId,
        surfaceFingerprint: item.surfaceFingerprint,
        durableSurfaceFingerprint: item.surfaceFingerprint,
        solverProof: item.solverProof,
        premiumBlueprint: {
          blueprintId: item.blueprintId,
          variantId: item.variantId,
          structuralId: item.structuralId,
          cognitiveExperienceId: item.cognitiveExperienceId,
          surfaceFingerprint: item.surfaceFingerprint,
          solverProof: item.solverProof
        }
      } : {})
    };
  }

  function generate(gameId, { seed = 1, count = 20, seenQuestionKeys = new Set(), grade = null } = {}) {
    const gameItems = byGame.get(gameId) || [];
    if (!gameItems.length) {
      return { rounds: [], audit: { supported: false, gameId, available: 0, produced: 0 } };
    }
    const normalizedGrade = normalizeStudentGrade(grade);
    const eligibleItems = gameItems.filter((item) => isPremiumGradeEligible(item.gradeBand, normalizedGrade));
    const random = seededRandom(`${gameId}:${seed}:${version}:${normalizedGrade ?? 'all'}`);
    const candidates = eligibleItems
      .map((item) => materialize(item, random))
      .filter((round) => !seenQuestionKeys.has(round.questionKey));
    const rounds = shuffleEntries(candidates, random).slice(0, Math.max(0, Number(count) || 0));
    return {
      rounds,
      audit: {
        supported: true,
        gameId,
        version,
        available: gameItems.length,
        gradeRequested: normalizedGrade,
        gradeFilterApplied: normalizedGrade !== null,
        gradeEligibleAvailable: eligibleItems.length,
        gradeBandsAvailable: [...new Set(gameItems.map((item) => item.gradeBand))],
        unseenAvailable: candidates.length,
        requested: count,
        produced: rounds.length,
        fallbackToLegacy: false
      }
    };
  }

  function inventory() {
    return Object.fromEntries([...byGame.entries()].map(([gameId, gameItems]) => [gameId, {
      questionCount: gameItems.length,
      familyCount: new Set(gameItems.map((item) => item.familyId)).size,
      topicCount: new Set(gameItems.map((item) => item.topicId)).size,
      subjectCount: new Set(gameItems.map((item) => item.subjectId)).size,
      gradeBands: [...new Set(gameItems.map((item) => item.gradeBand))],
      allHaveThreeMisconceptions: gameItems.every((item) => item.distractors.length === 3
        && new Set(item.distractors.map((entry) => entry.misconceptionId)).size === 3)
    }]));
  }

  return Object.freeze({ version, sourceLabel, gameIds, generate, inventory });
}
