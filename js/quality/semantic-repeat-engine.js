// Aşama 08 — Semantik tekrar ve kapasite motoru.
// Sayı/isim/dekor değişmiş aynı çözüm grafiği yeni soru değildir.
// family + skeleton + reasoningPath + solutionGraph + semanticFingerprint zorunlu.

import { hashString } from '../utils.js';

export const STAGE08_REPEAT_MUST_BE = 0;

function fingerprint(value) {
  return hashString(String(value || '')).toString(36);
}

function stripSurface(text = '') {
  return String(text)
    .toLocaleLowerCase('tr-TR')
    .replace(/\d+/g, '#')
    .replace(/[“”"'`]/g, '')
    .replace(/\b(ali|ayşe|ayse|mehmet|zeynep|elma|armut|ankara|istanbul)\b/g, '~')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildSemanticIdentity(round = {}) {
  const familyId = round.familyId || round.questionContract?.family?.familyId || null;
  const skeletonId = round.skeletonId || round.questionContract?.skeleton?.skeletonId || null;
  const reasoningPathId = round.reasoningPathId
    || round.questionContract?.reasoningPath?.reasoningPathId
    || null;
  const solutionGraphId = round.questionContract?.solution?.solutionGraphId
    || (skeletonId ? `${skeletonId}#solution1` : null);
  const distractorPlanId = round.distractorPlanId || round.questionContract?.optionMetadata?.distractorPlanId || null;
  const cognitiveExperienceId = round.cognitiveExperienceId || round.premiumBlueprint?.cognitiveExperienceId || null;
  const structuralId = round.structuralId || round.premiumBlueprint?.structuralId || null;

  const solutionShape = [
    cognitiveExperienceId || structuralId || skeletonId,
    reasoningPathId,
    round.kind || 'choice',
    stripSurface(round.prompt || '').slice(0, 96),
    stripSurface(round.explanation || '').slice(0, 64)
  ].join('|');

  const semanticFingerprint = familyId && skeletonId
    ? fingerprint(`${familyId}|${skeletonId}|${reasoningPathId || ''}|${solutionShape}`)
    : null;

  const surfaceFingerprint = fingerprint(
    `${round.questionKey || ''}|${stripSurface(round.prompt || '')}|${stripSurface(round.context || '')}`
  );
  // Akademik yıl yüzey tekrarı: sayı/isim değişimi yeni sayılmaz; questionKey nonce YOK.
  const durableSurfaceFingerprint = fingerprint([
    familyId || '',
    skeletonId || '',
    reasoningPathId || '',
    stripSurface(round.prompt || '').slice(0, 120),
    stripSurface(round.context || '').slice(0, 80)
  ].join('|'));

  return {
    familyId,
    skeletonId,
    reasoningPathId,
    solutionGraphId,
    distractorPlanId,
    semanticFingerprint,
    surfaceFingerprint,
    durableSurfaceFingerprint,
    solutionShape: fingerprint(solutionShape),
    cognitiveExperienceId,
    structuralId
  };
}

export function attachSemanticIdentity(round = {}) {
  const identity = buildSemanticIdentity(round);
  return {
    ...round,
    semanticIdentity: identity,
    // questionContract.repeat alanları attachQuestionContract sonrası güncellenir
    _semanticFingerprintOverride: identity.semanticFingerprint
  };
}

/**
 * Oturum içi kritik semantik tekrar: aynı semanticFingerprint veya aynı solutionShape+family.
 */
export function findSessionSemanticRepeats(rounds = []) {
  const seenFp = new Map();
  const seenShape = new Map();
  const repeats = [];
  rounds.forEach((round, index) => {
    const id = round.semanticIdentity || buildSemanticIdentity(round);
    if (id.semanticFingerprint) {
      if (seenFp.has(id.semanticFingerprint)) {
        repeats.push({
          index,
          type: 'semanticFingerprint',
          with: seenFp.get(id.semanticFingerprint),
          fingerprint: id.semanticFingerprint
        });
      } else {
        seenFp.set(id.semanticFingerprint, index);
      }
    }
    const shapeBase = id.cognitiveExperienceId || id.structuralId || id.familyId;
    const shapeKey = `${shapeBase}|${id.solutionShape}`;
    if (shapeBase && id.solutionShape) {
      if (seenShape.has(shapeKey)) {
        repeats.push({
          index,
          type: 'solutionGraphSurfaceVariant',
          with: seenShape.get(shapeKey),
          shapeKey
        });
      } else {
        seenShape.set(shapeKey, index);
      }
    }
  });
  return repeats;
}

export function filterSessionSemanticRepeats(rounds = []) {
  const kept = [];
  const rejected = [];
  const seenFp = new Set();
  const seenShape = new Set();
  for (const round of rounds) {
    const enriched = attachSemanticIdentity(round);
    const id = enriched.semanticIdentity;
    const shapeBase = id.cognitiveExperienceId || id.structuralId || id.familyId;
    const shapeKey = `${shapeBase}|${id.solutionShape}`;
    const fpDup = id.semanticFingerprint && seenFp.has(id.semanticFingerprint);
    const shapeDup = shapeBase && id.solutionShape && seenShape.has(shapeKey);
    if (fpDup || shapeDup) {
      rejected.push(enriched);
      continue;
    }
    if (id.semanticFingerprint) seenFp.add(id.semanticFingerprint);
    if (shapeBase && id.solutionShape) seenShape.add(shapeKey);
    kept.push(enriched);
  }
  return { kept, rejected };
}

export function scoreSemanticRepeatAudit(sessions = []) {
  let totalRounds = 0;
  let sessionSemanticRepeatCount = 0;
  let missingIdentity = 0;
  for (const session of sessions) {
    const rounds = (session.rounds || []).map((r) => attachSemanticIdentity(r));
    totalRounds += rounds.length;
    for (const round of rounds) {
      const id = round.semanticIdentity;
      if (!id.familyId || !id.skeletonId || !id.reasoningPathId || !id.solutionGraphId || !id.semanticFingerprint) {
        missingIdentity += 1;
      }
    }
    sessionSemanticRepeatCount += findSessionSemanticRepeats(rounds).length;
  }
  return {
    totalRounds,
    sessionSemanticRepeatCount,
    missingIdentity,
    meetsStageGate: sessionSemanticRepeatCount === STAGE08_REPEAT_MUST_BE && missingIdentity === 0 && totalRounds > 0
  };
}
