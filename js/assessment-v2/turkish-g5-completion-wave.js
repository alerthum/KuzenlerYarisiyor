import { GRADE5_TURKISH_OUTCOMES_TYMM_2024 } from '../curriculum/outcomes/tr-g5-turkce-tymm-2024.js';
import { defineSubjectEngine } from './subject-engine-contract.js';
import { buildGrade5TurkishCrossPilotQuestions } from './turkish-g5-cross-pilot.js';
import { buildGrade5TurkishBroadWaveQuestions } from './turkish-g5-broad-wave.js';
import { defineCurriculumPerformanceTask, auditCurriculumPerformanceTask, solveCurriculumPerformanceTask, verifyCurriculumPerformanceTask } from './curriculum-outcome-task-factory.js';
import { buildTurkishCompletionTaskSpec } from './turkish-completion-task-planner.js';

const existingOutcomeIds = new Set([
  ...buildGrade5TurkishCrossPilotQuestions(),
  ...buildGrade5TurkishBroadWaveQuestions()
].flatMap(item => item.curriculum.outcomeIds));

const remainingOutcomes = GRADE5_TURKISH_OUTCOMES_TYMM_2024.filter(outcome => !existingOutcomeIds.has(outcome.id));
const items = Object.freeze(remainingOutcomes.map(outcome => {
  const spec = buildTurkishCompletionTaskSpec(outcome, 5);
  return defineCurriculumPerformanceTask({
    id: `turkish-g5-complete-${outcome.officialOutcomeCode.toLocaleLowerCase('en-US').replaceAll('.', '-')}`,
    outcome,
    ...spec
  });
}));

export const GRADE5_TURKISH_COMPLETION_OUTCOME_CODES = Object.freeze(remainingOutcomes.map(outcome => outcome.officialOutcomeCode));
export function buildGrade5TurkishCompletionTasks() { return items; }

export const grade5TurkishCompletionEngine = defineSubjectEngine({
  id: 'grade5-turkish-full-scope-completion-engine-v1',
  domain: 'turkish-language-arts',
  supportedCourseIds: ['turkce'],
  supportedItemFormats: ['open-response', 'interactive-simulation'],
  misconceptionCatalogId: 'g5-turkish-full-scope-completion-misconceptions-v1',
  styleCatalogId: 'g5-turkish-full-scope-performance-styles-v1',
  plan: request => ({ questionId: request.questionId }),
  generate: plan => structuredClone(items.find(item => item.id === plan.questionId) || (() => { throw new Error(`unknown ${plan.questionId}`); })()),
  solve: solveCurriculumPerformanceTask,
  verifyIndependent: verifyCurriculumPerformanceTask,
  explain: item => item.solutionGraph,
  qualityAudit: auditCurriculumPerformanceTask
});

export function auditGrade5TurkishCompletionCatalog(rows = items) {
  const errors = rows.flatMap(item => auditCurriculumPerformanceTask(item).errors.map(error => `${item.id}:${error}`));
  const uniqueOutcomes = new Set(rows.flatMap(item => item.curriculum.outcomeIds));
  if (rows.length !== remainingOutcomes.length) errors.push(`item-count:${rows.length}`);
  if (uniqueOutcomes.size !== remainingOutcomes.length) errors.push(`outcome-count:${uniqueOutcomes.size}`);
  for (const item of rows) {
    const solved = grade5TurkishCompletionEngine.solve(item);
    if (!grade5TurkishCompletionEngine.verifyIndependent(item, solved)) errors.push(`${item.id}:independent-verification`);
  }
  return Object.freeze({
    ok: errors.length === 0,
    errors: Object.freeze(errors),
    metrics: Object.freeze({
      itemCount: rows.length,
      outcomeCount: uniqueOutcomes.size,
      officialOutcomeCount: GRADE5_TURKISH_OUTCOMES_TYMM_2024.length,
      existingMatchedOutcomeCount: existingOutcomeIds.size,
      engineeringScopeComplete: uniqueOutcomes.size + GRADE5_TURKISH_OUTCOMES_TYMM_2024.filter(outcome => existingOutcomeIds.has(outcome.id)).length === GRADE5_TURKISH_OUTCOMES_TYMM_2024.length,
      humanReviewStatus: 'NOT_MEASURED',
      gameAdaptationAllowed: false
    })
  });
}

export const GRADE5_TURKISH_COMPLETION_AUDIT = auditGrade5TurkishCompletionCatalog();
