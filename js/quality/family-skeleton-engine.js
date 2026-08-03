import { hashString, seededRandom } from '../utils.js';

// Aşama 04 — Ortak Aile-İskelet-Düşünme Yolu Motoru.
// Bu modül, bir oyun için "aile" (family), her ailenin "iskeletleri" (skeleton)
// ve her iskeletin farklı "düşünme yolları" (reasoningPath) arasındaki resmi
// ayrımı ve seçim/soğuma mantığını TEK bir yerde tanımlar. Hiçbir oyuna özel
// mantık içermez; her oyun kendi aile tanımlarını (bkz. js/content/families/*)
// bu motora verir.
//
// Hedefler (00_AUTONOMOUS_MASTER.md / docs/stages/04_FAMILY_SKELETON_ARCHITECTURE.md):
//   - Kritik kart başına en az FAMILY_TARGET gerçek aile
//   - Her aile en az SKELETON_TARGET_PER_FAMILY gerçekten farklı iskelet
//   - Her iskelet en az PATH_TARGET_PER_SKELETON farklı düşünme yolu
// Sayı/isim/bağlam makyajı farklı iskelet SAYILMAZ; bu motor bunu doğrulamaz
// (bu, iskeleti tanımlayan kişinin sorumluluğudur) ama en azından yapısal
// eksiklikleri (eksik iskelet/yol/cognitiveTraits) sessizce geçmez.

export const FAMILY_TARGET = 12;
export const SKELETON_TARGET_PER_FAMILY = 4;
export const PATH_TARGET_PER_SKELETON = 3;

export function validateFamilyDefinition(family = {}) {
  const errors = [];
  const warnings = [];
  if (!family.familyId) errors.push('familyId_missing');
  if (!Array.isArray(family.skeletons) || !family.skeletons.length) {
    errors.push('skeletons_missing');
    return { ok: false, errors, warnings };
  }
  if (family.skeletons.length < SKELETON_TARGET_PER_FAMILY) {
    warnings.push(`skeleton_count_below_target:${family.skeletons.length}/${SKELETON_TARGET_PER_FAMILY}`);
  }
  for (const skeleton of family.skeletons) {
    if (!skeleton.skeletonId) { errors.push('skeleton_id_missing'); continue; }
    if (typeof skeleton.generate !== 'function') errors.push(`generate_not_function:${skeleton.skeletonId}`);
    if (!Array.isArray(skeleton.reasoningPathIds) || !skeleton.reasoningPathIds.length) {
      errors.push(`reasoning_paths_missing:${skeleton.skeletonId}`);
    } else if (skeleton.reasoningPathIds.length < PATH_TARGET_PER_SKELETON) {
      warnings.push(`path_count_below_target:${skeleton.skeletonId}:${skeleton.reasoningPathIds.length}/${PATH_TARGET_PER_SKELETON}`);
    }
    if (!Array.isArray(skeleton.cognitiveTraits) || skeleton.cognitiveTraits.length < 2) {
      errors.push(`cognitive_traits_insufficient:${skeleton.skeletonId}`);
    }
  }
  return { ok: errors.length === 0, errors, warnings };
}

export function capacityReport(families = []) {
  const results = families.map((family) => ({ family, validation: validateFamilyDefinition(family) }));
  const validFamilies = results.filter((r) => r.validation.ok).map((r) => r.family);
  const skeletonCounts = validFamilies.map((family) => family.skeletons.length);
  const pathCounts = validFamilies.flatMap((family) => family.skeletons.map((skeleton) => skeleton.reasoningPathIds.length));
  return {
    familyCount: validFamilies.length,
    invalidFamilyCount: results.length - validFamilies.length,
    meetsFamilyTarget: validFamilies.length >= FAMILY_TARGET,
    minSkeletonsPerFamily: skeletonCounts.length ? Math.min(...skeletonCounts) : 0,
    meetsSkeletonTarget: skeletonCounts.length > 0 && skeletonCounts.every((count) => count >= SKELETON_TARGET_PER_FAMILY),
    minPathsPerSkeleton: pathCounts.length ? Math.min(...pathCounts) : 0,
    meetsPathTarget: pathCounts.length > 0 && pathCounts.every((count) => count >= PATH_TARGET_PER_SKELETON),
    totalSkeletons: skeletonCounts.reduce((a, b) => a + b, 0),
    meetsAllTargets: validFamilies.length >= FAMILY_TARGET
      && skeletonCounts.length > 0 && skeletonCounts.every((count) => count >= SKELETON_TARGET_PER_FAMILY)
      && pathCounts.length > 0 && pathCounts.every((count) => count >= PATH_TARGET_PER_SKELETON),
    errors: results.filter((r) => !r.validation.ok).map((r) => ({ familyId: r.family.familyId, errors: r.validation.errors }))
  };
}

function flattenSkeletons(families) {
  const flat = [];
  for (const family of families) {
    if (!validateFamilyDefinition(family).ok) continue;
    for (const skeleton of family.skeletons) flat.push({ family, skeleton });
  }
  return flat;
}

/**
 * Bir oyun oturumu için aile tanımlarından tur üretir.
 * Öncelik sırası: (1) hiç görülmemiş familyId'ler, (2) hiç görülmemiş skeletonId'ler,
 * (3) havuz gerçekten yetersizse tekrara izin ver (boş oturum yerine).
 */
export function generateFromFamilies(families, { seed, count, seenQuestionKeys = new Set(), recentFamilyIds = [], recentSkeletonIds = [], maxAttemptsPerSlot = 40 } = {}) {
  const pool = flattenSkeletons(families);
  if (!pool.length) return { rounds: [], audit: { poolSize: 0, reason: 'no_valid_families' } };

  const recentFamilySet = new Set(recentFamilyIds);
  const recentSkeletonSet = new Set(recentSkeletonIds);
  const random = seededRandom(seed);
  const rounds = [];
  const usedFamilyIds = new Set();
  const usedSkeletonIds = new Set();
  const usedQuestionKeys = new Set(seenQuestionKeys);

  const rank = (entry) => {
    const familyFresh = !usedFamilyIds.has(entry.family.familyId) && !recentFamilySet.has(entry.family.familyId);
    const skeletonFresh = !usedSkeletonIds.has(entry.skeleton.skeletonId) && !recentSkeletonSet.has(entry.skeleton.skeletonId);
    if (familyFresh && skeletonFresh) return 0;
    if (skeletonFresh) return 1;
    if (!usedFamilyIds.has(entry.family.familyId) && !usedSkeletonIds.has(entry.skeleton.skeletonId)) return 2;
    return 3;
  };

  for (let slot = 0; slot < count; slot += 1) {
    const ordered = [...pool].sort((a, b) => rank(a) - rank(b));
    let picked = null;
    // Oturum içi tekillik + recent cooldown: alternatif varken tekrar/yasak aileye düşme.
    const unusedNonRecentFamilyExists = ordered.some((e) => !usedFamilyIds.has(e.family.familyId) && !recentFamilySet.has(e.family.familyId));
    const unusedFamilyExists = ordered.some((e) => !usedFamilyIds.has(e.family.familyId));
    const unusedNonRecentSkeletonExists = ordered.some((e) => !usedSkeletonIds.has(e.skeleton.skeletonId) && !recentSkeletonSet.has(e.skeleton.skeletonId));
    const unusedSkeletonExists = ordered.some((e) => !usedSkeletonIds.has(e.skeleton.skeletonId));
    for (let attempt = 0; attempt < maxAttemptsPerSlot && !picked; attempt += 1) {
      const candidateEntry = ordered[attempt % ordered.length];
      if (unusedFamilyExists && usedFamilyIds.has(candidateEntry.family.familyId)) continue;
      if (unusedSkeletonExists && usedSkeletonIds.has(candidateEntry.skeleton.skeletonId)) continue;
      if (unusedNonRecentFamilyExists && recentFamilySet.has(candidateEntry.family.familyId)) continue;
      if (unusedNonRecentSkeletonExists && recentSkeletonSet.has(candidateEntry.skeleton.skeletonId)) continue;
      const pathId = candidateEntry.skeleton.reasoningPathIds[Math.floor(random() * candidateEntry.skeleton.reasoningPathIds.length)];
      const roundSeed = hashString(`${seed}:${candidateEntry.skeleton.skeletonId}:${pathId}:${slot}:${attempt}`);
      const generated = candidateEntry.skeleton.generate(seededRandom(roundSeed), pathId);
      if (!generated || !generated.questionKey) continue;
      if (usedQuestionKeys.has(generated.questionKey)) continue;
      picked = {
        ...generated,
        familyId: candidateEntry.family.familyId,
        skeletonId: candidateEntry.skeleton.skeletonId,
        reasoningPathId: `${candidateEntry.skeleton.skeletonId}#${pathId}`,
        cognitiveTraits: candidateEntry.skeleton.cognitiveTraits
      };
    }
    if (!picked) break;
    rounds.push(picked);
    usedFamilyIds.add(picked.familyId);
    usedSkeletonIds.add(picked.skeletonId);
    usedQuestionKeys.add(picked.questionKey);
  }

  return {
    rounds,
    audit: {
      poolSize: pool.length,
      requested: count,
      produced: rounds.length,
      distinctFamiliesUsed: usedFamilyIds.size,
      distinctSkeletonsUsed: usedSkeletonIds.size
    }
  };
}
