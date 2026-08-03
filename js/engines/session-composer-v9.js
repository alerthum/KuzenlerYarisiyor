import { silentRemediationPlan, buildTopicMastery } from './mastery-engine-v9.js';
import { microLessonForTopic } from './micro-teaching-v9.js';

function uniqueByQuestionKey(rounds = []) {
  const seen = new Set();
  return rounds.filter((round) => {
    const key = round.questionKey || `${round.prompt || ''}|${round.context || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function adaptiveTargetsForGame(attempts = [], academicDefinition, {
  maxTopics = 3,
  maxShare = 0.25,
  classTargetTopicIds = []
} = {}) {
  const allowed = new Set(academicDefinition?.topicIds || []);
  const allow = (topicId) => !allowed.size || allowed.has(topicId);
  const teacherPlan = [...new Set(classTargetTopicIds || [])]
    .filter((topicId) => topicId && allow(topicId))
    .map((topicId) => ({ topicId, reason: 'Öğretmen/sınıf hedefi', source: 'classTarget' }));
  const remediation = silentRemediationPlan(attempts, { maxTopics: maxTopics * 2, maxShare })
    .filter((item) => allow(item.topicId));
  const merged = [];
  const seen = new Set();
  for (const item of [...teacherPlan, ...remediation]) {
    if (seen.has(item.topicId)) continue;
    seen.add(item.topicId);
    merged.push(item);
    if (merged.length >= maxTopics) break;
  }
  return merged;
}

export function composeAdaptiveSession({
  baseRounds = [],
  candidateRounds = [],
  attempts = [],
  academicDefinition,
  maxShare = 0.25,
  classTargetTopicIds = []
} = {}) {
  const rounds = uniqueByQuestionKey(baseRounds);
  if (!rounds.length) return { rounds, plan: [], injectedCount: 0 };

  const plan = adaptiveTargetsForGame(attempts, academicDefinition, { maxShare, classTargetTopicIds });
  if (!plan.length) return { rounds, plan: [], injectedCount: 0 };

  const targetCount = Math.max(1, Math.min(Math.floor(rounds.length * maxShare), plan.length + 1));
  const targetTopics = new Set(plan.map((item) => item.topicId));
  const usedFamilies = new Set(rounds.map((round) => round.familyId).filter(Boolean));
  const usedSkeletons = new Set(rounds.map((round) => round.skeletonId).filter(Boolean));
  const usedCx = new Set(rounds.map((round) => round.cognitiveExperienceId).filter(Boolean));
  const baseKeys = new Set(rounds.map((round) => round.questionKey).filter(Boolean));
  const candidates = uniqueByQuestionKey(candidateRounds)
    .filter((round) => targetTopics.has(round.topicId))
    .filter((round) => !round.questionKey || !baseKeys.has(round.questionKey))
    .filter((round) => !round.familyId || !usedFamilies.has(round.familyId))
    .filter((round) => !round.skeletonId || !usedSkeletons.has(round.skeletonId))
    .filter((round) => !round.cognitiveExperienceId || !usedCx.has(round.cognitiveExperienceId));

  const selected = [];
  const usedTopics = new Set();
  for (const round of candidates) {
    if (selected.length >= targetCount) break;
    if (!usedTopics.has(round.topicId) || selected.length + 1 === targetCount) {
      const mastery = buildTopicMastery(attempts).find((item) => item.topicId === round.topicId) || {};
      selected.push({
        ...round,
        adaptivePlacement: true,
        adaptiveReason: plan.find((item) => item.topicId === round.topicId)?.reason || 'Kişisel gelişim rotası',
        microLesson: microLessonForTopic(round.topicId, mastery),
        classTargetPlacement: plan.find((item) => item.topicId === round.topicId)?.source === 'classTarget'
      });
      usedTopics.add(round.topicId);
      if (round.familyId) usedFamilies.add(round.familyId);
      if (round.skeletonId) usedSkeletons.add(round.skeletonId);
      if (round.cognitiveExperienceId) usedCx.add(round.cognitiveExperienceId);
      if (round.questionKey) baseKeys.add(round.questionKey);
    }
  }

  if (!selected.length) return { rounds, plan, injectedCount: 0 };

  const selectedKeys = new Set(selected.map((round) => round.questionKey));
  const untouched = rounds.filter((round) => !selectedKeys.has(round.questionKey));
  const result = [...untouched];
  const spacing = Math.max(2, Math.floor(result.length / selected.length));
  selected.forEach((round, index) => {
    const insertAt = Math.min(result.length, 1 + index * spacing);
    result.splice(insertAt, 0, round);
  });

  return {
    rounds: uniqueByQuestionKey(result).slice(0, rounds.length),
    plan,
    injectedCount: selected.length
  };
}
