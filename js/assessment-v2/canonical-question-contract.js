const ITEM_FORMATS = new Set([
  'single-choice', 'multiple-select', 'short-answer', 'open-response',
  'ordering', 'matching', 'drag-drop', 'interactive-simulation'
]);

const CONTENT_STATUSES = new Set([
  'DRAFT', 'ENGINEERING_VERIFIED', 'HUMAN_REVIEW_REQUIRED', 'PILOT_READY', 'PUBLISHED', 'REJECTED'
]);

function text(value, field, id = 'canonical-question') {
  const output = String(value ?? '').trim();
  if (!output) throw new Error(`${id}: ${field} is required`);
  return output;
}

function list(value, field, min, id) {
  if (!Array.isArray(value) || value.length < min) throw new Error(`${id}: ${field} requires at least ${min}`);
  return Object.freeze(value.map(entry => typeof entry === 'string' ? text(entry, field, id) : Object.freeze(structuredClone(entry))));
}

export function defineCanonicalQuestion(input = {}) {
  const id = text(input.id, 'id');
  const itemFormat = text(input.itemFormat, 'itemFormat', id);
  const contentStatus = text(input.contentStatus || 'DRAFT', 'contentStatus', id);
  if (!ITEM_FORMATS.has(itemFormat)) throw new Error(`${id}: unsupported itemFormat ${itemFormat}`);
  if (!CONTENT_STATUSES.has(contentStatus)) throw new Error(`${id}: unsupported contentStatus ${contentStatus}`);

  const curriculum = Object.freeze({
    country: text(input.curriculum?.country || 'TR', 'curriculum.country', id),
    schoolYear: text(input.curriculum?.schoolYear, 'curriculum.schoolYear', id),
    programFamily: text(input.curriculum?.programFamily, 'curriculum.programFamily', id),
    grade: Number(input.curriculum?.grade),
    courseId: text(input.curriculum?.courseId, 'curriculum.courseId', id),
    unitId: text(input.curriculum?.unitId, 'curriculum.unitId', id),
    topicId: text(input.curriculum?.topicId, 'curriculum.topicId', id),
    outcomeIds: list(input.curriculum?.outcomeIds, 'curriculum.outcomeIds', 1, id),
    sourceIds: list(input.curriculum?.sourceIds, 'curriculum.sourceIds', 1, id)
  });
  if (!Number.isInteger(curriculum.grade) || curriculum.grade < 1 || curriculum.grade > 12) {
    throw new Error(`${id}: curriculum.grade must be 1-12`);
  }

  const construct = Object.freeze({
    primarySkill: text(input.construct?.primarySkill, 'construct.primarySkill', id),
    secondarySkills: Object.freeze([...(input.construct?.secondarySkills || [])].map(value => text(value, 'construct.secondarySkills', id))),
    cognitiveProcess: text(input.construct?.cognitiveProcess, 'construct.cognitiveProcess', id),
    knowledgeComponents: list(input.construct?.knowledgeComponents, 'construct.knowledgeComponents', 1, id),
    intendedDifficultyBand: text(input.construct?.intendedDifficultyBand, 'construct.intendedDifficultyBand', id)
  });

  const solutionGraph = list(input.solutionGraph, 'solutionGraph', 2, id);
  const hints = list(input.hints, 'hints', 2, id);
  const optionFeedback = itemFormat === 'single-choice' || itemFormat === 'multiple-select'
    ? list(input.optionFeedback, 'optionFeedback', 2, id)
    : Object.freeze([...(input.optionFeedback || [])]);

  return Object.freeze({
    schemaVersion: '3.0',
    id,
    curriculum,
    construct,
    content: Object.freeze(structuredClone(input.content || {})),
    itemFormat,
    responseModel: Object.freeze(structuredClone(input.responseModel || {})),
    answerKey: Object.freeze(structuredClone(input.answerKey || {})),
    solutionGraph,
    hints,
    optionFeedback,
    misconceptionIds: list(input.misconceptionIds, 'misconceptionIds', 1, id),
    verifier: Object.freeze({
      solverId: text(input.verifier?.solverId, 'verifier.solverId', id),
      independentVerifierId: text(input.verifier?.independentVerifierId, 'verifier.independentVerifierId', id),
      verified: input.verifier?.verified === true
    }),
    styleProfile: Object.freeze(structuredClone(input.styleProfile || {})),
    provenance: Object.freeze({
      generatedFromSourceIds: Object.freeze([...(input.provenance?.generatedFromSourceIds || [])]),
      styleReferenceIds: Object.freeze([...(input.provenance?.styleReferenceIds || [])]),
      copiedText: false
    }),
    contentStatus,
    gameBindings: Object.freeze([])
  });
}
