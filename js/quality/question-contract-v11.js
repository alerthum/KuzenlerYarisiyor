import { hashString } from '../utils.js';

// Aşama 03 — Ortak Soru Sözleşmesi.
// Bu modül var olan hiçbir alanı değiştirmez veya kaldırmaz; her turun sonuna
// salt-okunur, ek bir `questionContract` alanı ekler. Bilinmeyen bir alan asla
// sessizce uydurulmaz: eldeki veriden gerçekten türetilemeyen her alan `null`
// olarak bırakılır ve `pendingFields` listesinde açıkça işaretlenir.
export const QUESTION_CONTRACT_SCHEMA_VERSION = '3.0.0';

function fingerprint(value) {
  return value ? hashString(String(value)).toString(36) : null;
}

export function attachQuestionContract(round = {}) {
  const familyId = round.familyId || null;
  const familyIsExplicit = Boolean(familyId);
  const skeletonId = round.skeletonId || null;
  const skeletonIsExplicit = Boolean(skeletonId);

  // Aşama 04: aile-iskelet motorunu kullanan üreticiler (bkz.
  // family-skeleton-engine.js) her turu gerçek, birbirinden farklı bir
  // `reasoningPathId` ile etiketler (aynı iskeletin ≥3 gerçek düşünme yolu).
  // Bu alan varsa olduğu gibi korunur. Henüz bu motora geçmemiş eski
  // üreticiler için (yalnız tek kanonik yol üretenler) geriye dönük uyumlu
  // tek-yol türetmesi yapılır; bu sınırlama derivationMethod ile dürüstçe
  // belirtilir.
  const explicitReasoningPathId = round.reasoningPathId || null;
  const reasoningPathId = explicitReasoningPathId || (skeletonIsExplicit ? `${skeletonId}#path1` : null);

  const optionCount = Array.isArray(round.options) ? round.options.length : 0;
  const detailedOptions = Array.isArray(round.detailedOptions) ? round.detailedOptions : [];
  const optionDiagnostics = Array.isArray(round.optionDiagnostics) ? round.optionDiagnostics : [];
  const hasDetailedOptions = detailedOptions.length > 0;
  const wrongDiagnostics = optionDiagnostics.filter((option) => option && option.isCorrect === false);
  const hasMisconceptionDiagnostics = wrongDiagnostics.length > 0
    && wrongDiagnostics.every((option) => option.misconceptionId && (option.rationale || option.whyStudentChoosesThis || option.misconception));
  const distractorPlanId = round.distractorPlanId
    || round.distractorValidation?.distractorPlanId
    || (hasMisconceptionDiagnostics ? fingerprint(`${round.questionKey || ''}:distractor-plan`) : null);

  // Aşama 08: semantik parmak izi family|skeleton|reasoning|solutionShape; yüzey ayrı.
  const semanticFingerprint = round.semanticIdentity?.semanticFingerprint
    || round._semanticFingerprintOverride
    || ((familyIsExplicit && skeletonIsExplicit)
      ? fingerprint(`${familyId}|${skeletonId}|${reasoningPathId || ''}`)
      : null);
  const surfaceFingerprint = round.semanticIdentity?.surfaceFingerprint
    || fingerprint(`${round.questionKey || ''}|${round.prompt || ''}|${round.context || ''}`);
  const solutionGraphId = round.semanticIdentity?.solutionGraphId
    || (skeletonIsExplicit ? `${skeletonId}#solution1` : null);

  const pendingFields = [];
  if (!familyIsExplicit) pendingFields.push('family.familyId');
  if (!skeletonIsExplicit) pendingFields.push('skeleton.skeletonId');
  if (!reasoningPathId) pendingFields.push('reasoningPath.reasoningPathId');
  if (!solutionGraphId) pendingFields.push('solution.solutionGraphId');
  if (!distractorPlanId) pendingFields.push('optionMetadata.distractorPlanId');
  if (!semanticFingerprint) pendingFields.push('repeat.semanticFingerprint');

  const questionContract = {
    schemaVersion: QUESTION_CONTRACT_SCHEMA_VERSION,
    academicIdentity: {
      subjectId: round.subjectId || null,
      topicId: round.topicId || null,
      subtopicId: round.subtopicId || null,
      skillId: round.skillId || round.skill || null,
      learningOutcomeId: round.learningOutcomeId || null
    },
    family: { familyId, isExplicit: familyIsExplicit, legacyFallbackFamilyId: round.questionFamilyId || null },
    skeleton: { skeletonId, isExplicit: skeletonIsExplicit },
    reasoningPath: {
      reasoningPathId,
      thinkingPatternId: round.thinkingPatternId || null,
      derivationMethod: explicitReasoningPathId
        ? 'EXPLICIT_MULTI_PATH'
        : (reasoningPathId ? 'DERIVED_FROM_SKELETON_SINGLE_PATH' : 'PENDING_SKELETON_IDENTITY'),
      cognitiveTraits: Array.isArray(round.cognitiveTraits) ? round.cognitiveTraits : []
    },
    optionMetadata: {
      optionCount,
      hasDetailedOptions,
      hasMisconceptionDiagnostics,
      distractorPlanId
    },
    solution: {
      hasExplanation: Boolean(round.explanation),
      explanationLength: String(round.explanation || '').length,
      solutionGraphId
    },
    quality: {
      globalQualityScore: round.globalQualityScore ?? null,
      globalQualityStatus: round.globalQualityStatus ?? null,
      globalQualityWarnings: round.globalQualityWarnings || [],
      // Aşama 05: bilişsel derinlik kanıtı (etiket değil evidence).
      cognitiveDepthEvidence: round.cognitiveDepthEvidence || null
    },
    repeat: {
      questionKey: round.questionKey || null,
      semanticFingerprint,
      surfaceFingerprint,
      cognitiveExperienceId: round.cognitiveExperienceId || round.premiumBlueprint?.cognitiveExperienceId || null,
      structuralId: round.structuralId || round.premiumBlueprint?.structuralId || null
    },
    publication: {
      status: round.globalQualityStatus || null,
      cognitiveBand: round.cognitiveDepthEvidence?.publicationBand || null,
      cognitiveDepthAllowed: round.cognitiveDepthGate?.publicationAllowed ?? null
    },
    pendingFields
  };
  if (!questionContract.quality.cognitiveDepthEvidence) pendingFields.push('quality.cognitiveDepthEvidence');

  return { ...round, questionContract };
}

export function validateQuestionContract(round = {}) {
  const contract = round.questionContract;
  const errors = [];
  if (!contract) return { ok: false, errors: ['questionContract_missing'] };
  if (!contract.repeat?.surfaceFingerprint) errors.push('surfaceFingerprint_missing');
  if (!contract.repeat?.questionKey) errors.push('questionKey_missing');
  if (!contract.academicIdentity?.subjectId) errors.push('subjectId_missing');
  return { ok: errors.length === 0, errors, pendingFields: contract.pendingFields || [] };
}
