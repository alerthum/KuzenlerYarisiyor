/**
 * Capacity Planner — gameId × gradeBand gerçek talep / havuz açığı.
 * Exact soru kapasitesi ile CX kapasitesini ayrı hesaplar; “sınırsız benzersiz CX” varsaymaz.
 */

import { REPETITION_POLICY_V2 } from './repetition-policy-v2.js';

const DEFAULT_WEEKS = 36;
const DEFAULT_SESSIONS_PER_WEEK = 2;

/**
 * @param {object} input
 * @param {string} input.gameId
 * @param {string|number} input.gradeBand
 * @param {number} [input.sessionLength]
 * @param {number} [input.annualSessionsPerStudent] yıllık oturum (öğrenci başına, bu oyun)
 * @param {number} [input.usageShare] oyunun yıllık kullanım payı 0..1
 * @param {number} [input.weeks]
 * @param {number} [input.sessionsPerWeek]
 * @param {number} [input.gameCountInRotation]
 * @param {object} inventory mevcut havuz sayıları
 */
export function planCapacity(input = {}, inventory = {}) {
  const cfg = REPETITION_POLICY_V2;
  const sessionLength = Math.max(1, Number(input.sessionLength) || 5);
  const weeks = Number(input.weeks) || DEFAULT_WEEKS;
  const sessionsPerWeek = Number(input.sessionsPerWeek) || DEFAULT_SESSIONS_PER_WEEK;
  const gameCount = Math.max(1, Number(input.gameCountInRotation) || 23);
  const usageShare = Number.isFinite(Number(input.usageShare))
    ? Number(input.usageShare)
    : 1 / gameCount;
  const annualSessionsTotal = weeks * sessionsPerWeek;
  const annualSessionsForGame = Number.isFinite(Number(input.annualSessionsPerStudent))
    ? Number(input.annualSessionsPerStudent)
    : Math.max(1, Math.round(annualSessionsTotal * usageShare));
  const annualDemand = annualSessionsForGame * sessionLength;

  // Exact: akademik yıl içinde tekrar yok → talep kadar benzersiz questionKey gerekir (+ tampon).
  const exactUniqueNeeded = Math.ceil(annualDemand * (1 + cfg.safetyBuffer));

  // Family: oturumda 1 + son 10 oturumda %20 → pratikte oturum başına farklı aile tercihi.
  // Minimum aile ≈ sessionLength (oturum içi) ama yıllık rotasyon için daha fazla.
  const familyLookback = cfg.familyId.lookbackSessions;
  const maxFamilyShare = cfg.familyId.maxShareLastNSessions;
  const minFamiliesForShare = Math.max(
    sessionLength,
    Math.ceil(1 / Math.max(0.01, maxFamilyShare))
  );
  // Son N oturumda her aile ≤ %20 → en az ceil(1/0.2)=5 aile aktif; güvenlik tamponu.
  // Oturum içi aile tekilliği: en az sessionLength aile + kapı/backfill marjı.
  const minimumFamilyCount = Math.ceil(
    Math.max(minFamiliesForShare, sessionLength + 4) * (1 + cfg.safetyBuffer)
  );

  // Skeleton: son 3 oturum yasak → yaklaşık sessionLength * (3+1) benzersiz iskelet penceresi.
  const skWindow = cfg.skeletonId.forbiddenLookbackSessions + 1;
  const minimumSkeletonCount = Math.ceil(sessionLength * skWindow * (1 + cfg.safetyBuffer));

  // Structural: son 12 oturum → sessionLength * 13
  const stWindow = cfg.structuralId.forbiddenLookbackSessions + 1;
  const minimumStructuralCount = Math.ceil(sessionLength * stWindow * (1 + cfg.safetyBuffer));

  // CX: son 2 oturum yasak → oturumda sessionLength + önceki 2*sessionLength ≈ 3× sessionLength
  // Yıllık “sınırsız benzersiz” DEĞİL — pencere kapasitesi.
  const cxWindow = cfg.cognitiveExperienceId.forbiddenLookbackSessions + 1;
  const minimumCognitiveExperienceCount = Math.ceil(sessionLength * cxWindow * (1 + cfg.safetyBuffer));

  const current = {
    familyCount: Number(inventory.familyCount) || 0,
    skeletonCount: Number(inventory.skeletonCount) || 0,
    structuralCount: Number(inventory.structuralCount) || 0,
    cognitiveExperienceCount: Number(inventory.cognitiveExperienceCount) || 0,
    solutionGraphCount: Number(inventory.solutionGraphCount) || 0,
    distractorPlanCount: Number(inventory.distractorPlanCount) || 0,
    exactQuestionEstimate: Number(inventory.exactQuestionEstimate) || 0
  };

  const currentCapacity = {
    exact: current.exactQuestionEstimate,
    family: current.familyCount,
    skeleton: current.skeletonCount,
    structural: current.structuralCount,
    cognitiveExperience: current.cognitiveExperienceCount,
    solutionGraph: current.solutionGraphCount,
    distractorPlan: current.distractorPlanCount
  };

  const safeCapacity = {
    exact: Math.floor(currentCapacity.exact / (1 + cfg.safetyBuffer)),
    family: Math.floor(currentCapacity.family / (1 + cfg.safetyBuffer)),
    skeleton: Math.floor(currentCapacity.skeleton / (1 + cfg.safetyBuffer)),
    structural: Math.floor(currentCapacity.structural / (1 + cfg.safetyBuffer)),
    cognitiveExperience: Math.floor(currentCapacity.cognitiveExperience / (1 + cfg.safetyBuffer))
  };

  const deficits = {
    exact: Math.max(0, exactUniqueNeeded - currentCapacity.exact),
    family: Math.max(0, minimumFamilyCount - currentCapacity.family),
    skeleton: Math.max(0, minimumSkeletonCount - currentCapacity.skeleton),
    structural: Math.max(0, minimumStructuralCount - currentCapacity.structural),
    cognitiveExperience: Math.max(0, minimumCognitiveExperienceCount - currentCapacity.cognitiveExperience)
  };

  // Blueprint açığı: structural/CX/family eksiklerinin maksimumu (exact varyasyon ayrı).
  const capacityDeficit = Math.max(
    deficits.family,
    deficits.skeleton,
    deficits.structural,
    deficits.cognitiveExperience
  );
  const requiredNewBlueprintCount = capacityDeficit;

  return {
    gameId: input.gameId || null,
    gradeBand: input.gradeBand != null ? String(input.gradeBand) : null,
    annualDemand,
    annualSessionsForGame,
    sessionLength,
    usageShare,
    safetyBuffer: cfg.safetyBuffer,
    minimumFamilyCount,
    minimumSkeletonCount,
    minimumStructuralCount,
    minimumCognitiveExperienceCount,
    exactUniqueNeeded,
    currentCapacity,
    safeCapacity,
    capacityDeficit,
    deficits,
    requiredNewBlueprintCount,
    notes: [
      'Exact kapasite akademik yıl tekrarsızlığına göre hesaplanır.',
      'CX kapasitesi lifetime değil; yasak pencere (2 oturum) + oturum içi tekilliğe göre hesaplanır.',
      'requiredNewBlueprintCount = max(family/skeleton/structural/CX açıkları).'
    ]
  };
}

export function inventoryFromFamilies(families = []) {
  const familyIds = new Set();
  const skeletonIds = new Set();
  const structuralIds = new Set();
  const cxIds = new Set();
  const solutionGraphs = new Set();
  const distractorPlans = new Set();
  let variationEstimate = 0;

  for (const fam of families) {
    if (fam?.id || fam?.familyId) familyIds.add(fam.id || fam.familyId);
    const skeletons = fam?.skeletons || fam?.skeletonIds || [];
    for (const sk of skeletons) {
      const sid = typeof sk === 'string' ? sk : (sk?.id || sk?.skeletonId);
      if (sid) skeletonIds.add(sid);
      const pathIds = Array.isArray(sk?.reasoningPathIds)
        ? sk.reasoningPathIds
        : (sk?.reasoningPaths || sk?.paths || []).map((p) => (typeof p === 'string' ? p : (p?.id || p?.reasoningPathId))).filter(Boolean);
      if (pathIds.length) {
        for (const pid of pathIds) {
          structuralIds.add(`${fam.id || fam.familyId}|${sid}|${pid}`);
        }
      } else if (sid) {
        structuralIds.add(`${fam.id || fam.familyId}|${sid}`);
      }
      for (const p of sk?.reasoningPaths || sk?.paths || []) {
        if (p?.solutionGraphId) solutionGraphs.add(p.solutionGraphId);
        if (p?.distractorPlanId) distractorPlans.add(p.distractorPlanId);
      }
      variationEstimate += Math.max(1, Number(sk?.variations) || Number(fam?.variations) || 8) * Math.max(1, pathIds.length || 1);
    }
  }

  return {
    familyCount: familyIds.size,
    skeletonCount: skeletonIds.size,
    structuralCount: structuralIds.size || skeletonIds.size,
    cognitiveExperienceCount: Math.max(structuralIds.size, skeletonIds.size * 2),
    solutionGraphCount: solutionGraphs.size,
    distractorPlanCount: distractorPlans.size,
    exactQuestionEstimate: variationEstimate * Math.max(1, familyIds.size)
  };
}

export default planCapacity;
