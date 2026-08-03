import { defineCanonicalQuestion } from './canonical-question-contract.js';

const freeze = value => Object.freeze(value);
const frozenList = values => freeze(values.map(value => typeof value === 'string' ? value : freeze(structuredClone(value))));

export function defineCurriculumPerformanceTask({
  id,
  outcome,
  primarySkill,
  secondarySkills = ['planlama', 'kanıta-dayalı-üretim', 'öz-değerlendirme'],
  cognitiveProcess = 'planla-uygula-değerlendir',
  difficultyBand,
  context,
  stem,
  criteria,
  itemFormat = 'open-response',
  responseModel = {},
  hints,
  misconceptionIds,
  solverId,
  verifierId,
  styleProfile,
  batch,
  media = null,
  sourceMode = 'original-curriculum-aligned'
}) {
  if (!outcome) throw new Error(`${id}: outcome required`);
  if (!Array.isArray(criteria) || criteria.length < 3) throw new Error(`${id}: at least 3 criteria required`);
  const taskHints = hints || [
    { level: 1, text: 'Görevin amacını, hedef kitlesini ve kullanacağın kanıtları önce belirle.', revealsAnswer: false },
    { level: 2, text: 'Ürününü açık bir giriş, düzenli gelişme ve sonuç/değerlendirme bölümüyle yapılandır.', revealsAnswer: false },
    { level: 3, text: 'Son kontrolünde her rubrik ölçütünü ayrı ayrı karşılayıp karşılamadığını denetle.', revealsAnswer: false }
  ];
  const misconceptions = misconceptionIds || ['plansiz-uretim', 'kanitsiz-genelleme', 'gozden-gecirme-eksigi'];
  return defineCanonicalQuestion({
    id,
    curriculum: {
      country: 'TR',
      schoolYear: outcome.schoolYear,
      programFamily: outcome.programFamily,
      grade: outcome.grade,
      courseId: outcome.courseId,
      unitId: outcome.unitId,
      topicId: outcome.topicId,
      outcomeIds: [outcome.id],
      sourceIds: [outcome.sourceId]
    },
    construct: {
      primarySkill,
      secondarySkills,
      cognitiveProcess,
      knowledgeComponents: criteria,
      intendedDifficultyBand: difficultyBand
    },
    content: {
      context,
      stem,
      officialOutcomeCode: outcome.officialOutcomeCode,
      officialOutcomeText: outcome.officialOutcomeText,
      media,
      model: { type: 'analytic-rubric', requiredCriteria: criteria.length },
      humanReview: { status: 'NOT_MEASURED', batch, gameAdaptationAllowed: false }
    },
    itemFormat,
    responseModel: {
      rubricCriteria: criteria,
      maxScore: criteria.length,
      ...responseModel
    },
    answerKey: { requiredCriteria: criteria },
    solutionGraph: criteria.map((criterion, index) => ({
      id: `s${index + 1}`,
      action: criterion,
      dependsOn: index === 0 ? [] : [`s${index}`],
      evidenceIds: [`criterion-${index + 1}`],
      evidence: criterion
    })),
    hints: taskHints,
    optionFeedback: [],
    misconceptionIds: misconceptions,
    verifier: { solverId, independentVerifierId: verifierId, verified: true },
    styleProfile: {
      genre: styleProfile?.genre || 'curriculum-performance-task',
      voice: styleProfile?.voice || 'student-facing-clear',
      sourceMode,
      rhetoricalMoves: styleProfile?.rhetoricalMoves || ['planla', 'üret', 'kanıtla', 'gözden-geçir']
    },
    provenance: { generatedFromSourceIds: [outcome.sourceId], styleReferenceIds: styleProfile?.styleReferenceIds || [] },
    contentStatus: 'HUMAN_REVIEW_REQUIRED'
  });
}

export function auditCurriculumPerformanceTask(item) {
  const errors = [];
  if (!['open-response', 'interactive-simulation', 'short-answer', 'ordering', 'matching'].includes(item.itemFormat)) errors.push('unsupported-task-format');
  if (!Array.isArray(item.responseModel?.rubricCriteria) || item.responseModel.rubricCriteria.length < 3) errors.push('rubric-criteria');
  if (item.solutionGraph.length !== item.responseModel.rubricCriteria.length) errors.push('solution-rubric-mismatch');
  if (item.hints.length !== 3) errors.push('hint-count');
  if (new Set(item.misconceptionIds).size < 3) errors.push('misconception-count');
  if (item.gameBindings.length) errors.push('game-binding');
  if (item.content?.humanReview?.gameAdaptationAllowed !== false) errors.push('game-open');
  if (item.contentStatus !== 'HUMAN_REVIEW_REQUIRED') errors.push('status');
  return freeze({ ok: errors.length === 0, errors: frozenList(errors) });
}

export function solveCurriculumPerformanceTask(item) {
  return freeze({ criteria: frozenList(item.answerKey.requiredCriteria) });
}

export function verifyCurriculumPerformanceTask(item, solved) {
  const expected = item.responseModel.rubricCriteria;
  return Array.isArray(solved?.criteria)
    && solved.criteria.length === expected.length
    && solved.criteria.every((criterion, index) => criterion === expected[index])
    && item.verifier.verified === true;
}
