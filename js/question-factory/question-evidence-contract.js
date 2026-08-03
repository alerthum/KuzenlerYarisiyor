/**
 * Genel Soru Kanıtı Sözleşmesi — kaynakta görünmeyen alan uydurulmaz.
 * Ortak pipeline: SOURCE → … → PUBLISH GATE
 */

export const EVIDENCE_CONTRACT_VERSION = '1.0.0';

export const SOURCE_TYPES = Object.freeze(['OFFICIAL', 'AUTHORIZED_PREVIEW', 'ACADEMIC']);
export const VERIFICATION_STATUSES = Object.freeze(['VERIFIED', 'PARTIAL', 'REJECTED']);

export const PIPELINE_STAGES = Object.freeze([
  'SOURCE',
  'DOCUMENT',
  'QUESTION_EVIDENCE',
  'CURRICULUM_MAPPING',
  'BLUEPRINT_EXTRACTION',
  'SOLUTION_GRAPH',
  'INDEPENDENT_SOLVER',
  'MISCONCEPTION_MODEL',
  'DISTRACTOR_PLAN',
  'AGE_DIFFICULTY_VALIDATION',
  'SEMANTIC_CX_IDENTITY',
  'PUBLISH_GATE'
]);

/**
 * Boş kanıt iskeleti — tüm alanlar null/boş; uydurma yok.
 */
export function emptyQuestionEvidence(overrides = {}) {
  return {
    evidenceId: overrides.evidenceId || null,
    sourceId: overrides.sourceId || null,
    sourceType: overrides.sourceType || null,
    documentUrl: overrides.documentUrl || null,
    page: overrides.page ?? null,
    questionNo: overrides.questionNo ?? null,

    grade: overrides.grade ?? null,
    subject: overrides.subject || null,
    unit: overrides.unit || null,
    topic: overrides.topic || null,
    curriculumSkillIds: Array.isArray(overrides.curriculumSkillIds) ? [...overrides.curriculumSkillIds] : [],

    questionType: overrides.questionType || null,
    questionExcerpt: overrides.questionExcerpt || null,
    optionCount: overrides.optionCount ?? null,
    optionsVisible: overrides.optionsVisible === true,
    answerVisible: overrides.answerVisible === true,
    solutionVisible: overrides.solutionVisible === true,

    representationType: overrides.representationType || null,
    informationFlow: Array.isArray(overrides.informationFlow) ? [...overrides.informationFlow] : [],
    solutionGraph: Array.isArray(overrides.solutionGraph) ? [...overrides.solutionGraph] : [],
    dependentDecisionCount: Number(overrides.dependentDecisionCount) || 0,

    blueprintCandidate: overrides.blueprintCandidate ?? null,
    structuralIdCandidate: overrides.structuralIdCandidate ?? null,
    cognitiveExperienceIdCandidate: overrides.cognitiveExperienceIdCandidate ?? null,

    distractorEvidence: Array.isArray(overrides.distractorEvidence) ? [...overrides.distractorEvidence] : [],
    misconceptionEvidence: Array.isArray(overrides.misconceptionEvidence) ? [...overrides.misconceptionEvidence] : [],

    evidenceCompleteness: Number(overrides.evidenceCompleteness) || 0,
    verificationStatus: overrides.verificationStatus || 'PARTIAL',

    contractVersion: EVIDENCE_CONTRACT_VERSION
  };
}

/** Kaynakta görünmeyen alanı doldurma — yalnız açıkça sağlanan alanlar. */
export function mergeEvidenceFromSource(base, observed = {}) {
  const next = emptyQuestionEvidence(base);
  for (const [key, value] of Object.entries(observed)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value) && value.length === 0) continue;
    next[key] = Array.isArray(value) ? [...value] : value;
  }
  next.evidenceCompleteness = computeEvidenceCompleteness(next);
  next.verificationStatus = inferVerificationStatus(next);
  return next;
}

export function computeEvidenceCompleteness(evidence = {}) {
  const weights = [
    ['sourceId', 1],
    ['sourceType', 1],
    ['grade', 1],
    ['subject', 1],
    ['questionExcerpt', 2],
    ['questionType', 1],
    ['curriculumSkillIds', 2],
    ['solutionGraph', 2],
    ['dependentDecisionCount', 1],
    ['distractorEvidence', 1],
    ['misconceptionEvidence', 1]
  ];
  let score = 0;
  let max = 0;
  for (const [key, w] of weights) {
    max += w;
    const v = evidence[key];
    if (v == null || v === '') continue;
    if (Array.isArray(v) && v.length === 0) continue;
    if (key === 'dependentDecisionCount' && Number(v) <= 0) continue;
    score += w;
  }
  return max ? Number((score / max).toFixed(3)) : 0;
}

export function inferVerificationStatus(evidence = {}) {
  const c = Number(evidence.evidenceCompleteness) || computeEvidenceCompleteness(evidence);
  if (!evidence.sourceId || !SOURCE_TYPES.includes(evidence.sourceType)) return 'REJECTED';
  if (c >= 0.75 && (evidence.curriculumSkillIds || []).length && (evidence.solutionGraph || []).length) {
    return 'VERIFIED';
  }
  if (c >= 0.35) return 'PARTIAL';
  return 'REJECTED';
}

export function validateEvidenceContract(evidence = {}) {
  const errors = [];
  if (!evidence || typeof evidence !== 'object') {
    return { ok: false, errors: ['evidence_not_object'] };
  }
  if (evidence.sourceType && !SOURCE_TYPES.includes(evidence.sourceType)) {
    errors.push('invalid_sourceType');
  }
  if (evidence.verificationStatus && !VERIFICATION_STATUSES.includes(evidence.verificationStatus)) {
    errors.push('invalid_verificationStatus');
  }
  // Uydurma yasağı: answerVisible false iken answer alanı olmamalı (kısa kontrol)
  if (evidence.answerVisible === false && evidence.correctAnswer != null) {
    errors.push('answer_invented_without_visibility');
  }
  return { ok: errors.length === 0, errors };
}

export default {
  EVIDENCE_CONTRACT_VERSION,
  PIPELINE_STAGES,
  emptyQuestionEvidence,
  mergeEvidenceFromSource,
  computeEvidenceCompleteness,
  validateEvidenceContract
};
