import { GRADE_8_TURKISH_OUTCOMES_2019 } from '../curriculum/outcomes/tr-g8-turkce-2019.js';
import { defineSubjectEngine } from './subject-engine-contract.js';
import { buildGrade8TurkishPilot01Questions } from './turkish-g8-reading-pilot01.js';
import { buildGrade8TurkishPilot02CalibrationQuestions } from './turkish-g8-pilot02-calibration.js';
import { buildGrade8TurkishReadingLanguageWave1Questions } from './turkish-g8-reading-language-wave1.js';
import { buildGrade8TurkishVisualGrammarWave2Questions } from './turkish-g8-visual-grammar-wave2.js';
import { defineCurriculumPerformanceTask, auditCurriculumPerformanceTask, solveCurriculumPerformanceTask, verifyCurriculumPerformanceTask } from './curriculum-outcome-task-factory.js';
import { buildTurkishCompletionTaskSpec } from './turkish-completion-task-planner.js';

const existingOutcomeIds = new Set([
  ...buildGrade8TurkishPilot01Questions(),
  ...buildGrade8TurkishPilot02CalibrationQuestions(),
  ...buildGrade8TurkishReadingLanguageWave1Questions(),
  ...buildGrade8TurkishVisualGrammarWave2Questions()
].flatMap(item => item.curriculum.outcomeIds));

const remainingOutcomes = GRADE_8_TURKISH_OUTCOMES_2019.filter(outcome => !existingOutcomeIds.has(outcome.id));
const items = Object.freeze(remainingOutcomes.map(outcome => {
  const spec = buildTurkishCompletionTaskSpec(outcome, 8);
  return defineCurriculumPerformanceTask({
    id: `turkish-g8-complete-${outcome.officialOutcomeCode.toLocaleLowerCase('en-US').replaceAll('.', '-')}`,
    outcome,
    ...spec
  });
}));

export const GRADE8_TURKISH_COMPLETION_OUTCOME_CODES = Object.freeze(remainingOutcomes.map(outcome => outcome.officialOutcomeCode));
export function buildGrade8TurkishCompletionTasks() { return items; }

export const grade8TurkishCompletionEngine = defineSubjectEngine({
  id: 'grade8-turkish-full-scope-completion-engine-v1',
  domain: 'turkish-language-arts',
  supportedCourseIds: ['turkce'],
  supportedItemFormats: ['open-response', 'interactive-simulation'],
  misconceptionCatalogId: 'g8-turkish-full-scope-completion-misconceptions-v1',
  styleCatalogId: 'g8-turkish-full-scope-performance-styles-v1',
  plan: request => ({ questionId: request.questionId }),
  generate: plan => structuredClone(items.find(item => item.id === plan.questionId) || (() => { throw new Error(`unknown ${plan.questionId}`); })()),
  solve: solveCurriculumPerformanceTask,
  verifyIndependent: verifyCurriculumPerformanceTask,
  explain: item => item.solutionGraph,
  qualityAudit: auditCurriculumPerformanceTask
});

export function auditGrade8TurkishCompletionCatalog(rows = items) {
  const errors = rows.flatMap(item => auditCurriculumPerformanceTask(item).errors.map(error => `${item.id}:${error}`));
  const uniqueOutcomes = new Set(rows.flatMap(item => item.curriculum.outcomeIds));
  if (rows.length !== remainingOutcomes.length) errors.push(`item-count:${rows.length}`);
  if (uniqueOutcomes.size !== remainingOutcomes.length) errors.push(`outcome-count:${uniqueOutcomes.size}`);
  for (const item of rows) {
    const solved = grade8TurkishCompletionEngine.solve(item);
    if (!grade8TurkishCompletionEngine.verifyIndependent(item, solved)) errors.push(`${item.id}:independent-verification`);
  }
  return Object.freeze({
    ok: errors.length === 0,
    errors: Object.freeze(errors),
    metrics: Object.freeze({
      itemCount: rows.length,
      outcomeCount: uniqueOutcomes.size,
      officialOutcomeCount: GRADE_8_TURKISH_OUTCOMES_2019.length,
      engineeringScopeComplete: uniqueOutcomes.size + existingOutcomeIds.size === GRADE_8_TURKISH_OUTCOMES_2019.length,
      humanReviewStatus: 'NOT_MEASURED',
      gameAdaptationAllowed: false
    })
  });
}

export const GRADE8_TURKISH_COMPLETION_AUDIT = auditGrade8TurkishCompletionCatalog();
