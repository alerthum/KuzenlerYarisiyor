import { GRADE8_MATH_OUTCOMES_2018 } from '../curriculum/outcomes/tr-g8-matematik-2018.js';
import { buildGrade8MathCrossPilotQuestions } from './math-g8-cross-pilot.js';
import { buildGrade8MathWave1Questions, GRADE8_MATH_WAVE1_OUTCOME_CODES } from './math-g8-wave1.js';
import { buildGrade8MathCompletionQuestions, GRADE8_MATH_COMPLETION_OUTCOME_CODES } from './math-g8-completion-waves.js';

export const GRADE8_MATH_CROSS_PILOT_OUTCOME_CODES = Object.freeze([
  'M.8.1.1.2','M.8.1.2.5','M.8.2.2.5','M.8.3.1.5','M.8.5.1.5'
]);

const IMPLEMENTED_CODES = new Set([...GRADE8_MATH_CROSS_PILOT_OUTCOME_CODES, ...GRADE8_MATH_WAVE1_OUTCOME_CODES, ...GRADE8_MATH_COMPLETION_OUTCOME_CODES]);
const VISUAL_TOPIC_IDS = new Set(['dogrusal-denklemler','ucgenler','donusum-geometrisi','eslik-ve-benzerlik','geometrik-cisimler','veri-analizi']);
const CONSTRUCTION_CODES = new Set(['M.8.3.1.1','M.8.3.1.4','M.8.3.2.1','M.8.3.2.2','M.8.3.2.3','M.8.3.3.2','M.8.3.4.1','M.8.3.4.2','M.8.3.4.5','M.8.3.4.6']);

function solverFamily(outcome) {
  const code=outcome.officialOutcomeCode;
  if(code.startsWith('M.8.1.1')) return 'number-theory-factor-solver';
  if(code.startsWith('M.8.1.2')) return 'integer-exponent-symbolic-solver';
  if(code.startsWith('M.8.1.3')) return 'radical-real-number-solver';
  if(code.startsWith('M.8.2.1')) return 'symbolic-algebra-identity-solver';
  if(code.startsWith('M.8.2.2')) return 'linear-model-coordinate-solver';
  if(code.startsWith('M.8.2.3')) return 'inequality-constraint-solver';
  if(code.startsWith('M.8.3.1')) return 'triangle-geometry-solver';
  if(code.startsWith('M.8.3.2')) return 'coordinate-transformation-solver';
  if(code.startsWith('M.8.3.3')) return 'congruence-similarity-solver';
  if(code.startsWith('M.8.3.4')) return 'solid-geometry-net-measure-solver';
  if(code.startsWith('M.8.4')) return 'data-representation-verifier';
  if(code.startsWith('M.8.5')) return 'finite-sample-space-probability-solver';
  return 'mathematics-domain-solver';
}

function independentVerifier(outcome) {
  if(CONSTRUCTION_CODES.has(outcome.officialOutcomeCode)) return 'coordinate-or-geometry-invariant-checker';
  if(outcome.officialOutcomeCode.startsWith('M.8.4')) return 'independent-data-recalculation';
  return 'alternate-enumeration-or-substitution';
}

function questionFamilies(outcome) {
  const topic=outcome.topicId;
  const common=['context-model','error-analysis','representation-translation'];
  if(topic==='carpanlar-ve-katlar') return [...common,'factor-tree','periodic-cycle','coprime-classification'];
  if(topic==='uslu-ifadeler') return [...common,'equivalent-expression','scale-comparison','scientific-notation'];
  if(topic==='karekoklu-ifadeler') return [...common,'area-root-model','number-line-bound','radical-operation'];
  if(topic==='cebirsel-ifadeler-ve-ozdeslikler') return [...common,'algebra-tile-model','identity-area-model','factorization-reconstruction'];
  if(topic==='dogrusal-denklemler') return [...common,'table-equation-graph','coordinate-map','rate-intercept'];
  if(topic==='esitsizlikler') return [...common,'constraint-language','number-line-region','boundary-test'];
  if(topic==='ucgenler') return [...common,'construction-validity','side-angle-relation','distance-model'];
  if(topic==='donusum-geometrisi') return [...common,'coordinate-image','motif-transformation','invariant-check'];
  if(topic==='eslik-ve-benzerlik') return [...common,'corresponding-part-analysis','scale-model','counterexample'];
  if(topic==='geometrik-cisimler') return [...common,'net-selection','surface-volume-model','element-classification'];
  if(topic==='veri-analizi') return [...common,'multi-series-interpretation','representation-choice','graph-conversion'];
  return [...common,'sample-space','comparative-likelihood','complement-event'];
}

function misconceptionFamilies(outcome) {
  const code=outcome.officialOutcomeCode;
  if(code.startsWith('M.8.1')) return ['operation-rule-confusion','representation-loss','boundary-or-sign-error'];
  if(code.startsWith('M.8.2')) return ['term-transfer-error','variable-role-confusion','equivalence-not-preserved'];
  if(code.startsWith('M.8.3')) return ['visual-correspondence-error','property-overgeneralization','measurement-model-error'];
  if(code.startsWith('M.8.4')) return ['axis-scale-error','total-vs-change-confusion','unsupported-trend-inference'];
  return ['sample-space-error','double-counting','probability-range-error'];
}

export const GRADE8_MATH_FULL_SCOPE_MATRIX = Object.freeze(GRADE8_MATH_OUTCOMES_2018.map(outcome => {
  const isConstruction=CONSTRUCTION_CODES.has(outcome.officialOutcomeCode);
  const requiresVisual=VISUAL_TOPIC_IDS.has(outcome.topicId) || isConstruction;
  const implemented=IMPLEMENTED_CODES.has(outcome.officialOutcomeCode);
  return Object.freeze({
    outcomeId:outcome.id,
    outcomeCode:outcome.officialOutcomeCode,
    outcomeText:outcome.officialOutcomeText,
    unitId:outcome.unitId,
    unitName:outcome.unitName,
    topicId:outcome.topicId,
    topicName:outcome.topicName,
    sourceLocator:outcome.sourceLocator,
    assessmentMode:isConstruction?'INTERACTIVE_CONSTRUCTION':'SOLVER_BACKED_CANONICAL',
    assessmentChannel:requiresVisual?'VISUAL_OR_INTERACTIVE':'TEXT_TABLE_SYMBOLIC',
    recommendedItemFormats:Object.freeze([...outcome.assessmentEvidenceTypes]),
    requiresVisual,
    requiresHumanScoring:isConstruction && outcome.assessmentEvidenceTypes.includes('human-rubric'),
    automatedScoringAllowed:!isConstruction || outcome.assessmentEvidenceTypes.includes('independent-computation'),
    solverFamily:solverFamily(outcome),
    independentVerifier:independentVerifier(outcome),
    questionFamilies:Object.freeze(questionFamilies(outcome)),
    misconceptionFamilies:Object.freeze(misconceptionFamilies(outcome)),
    implementationStatus:implemented?'ENGINEERING_ITEM_EXISTS':'NOT_YET_IMPLEMENTED',
    implementedItemCount:implemented?1:0,
    humanReviewStatus:'NOT_MEASURED',
    gameAdaptationAllowed:false
  });
}));

export function auditGrade8MathFullScopeMatrix(rows=GRADE8_MATH_FULL_SCOPE_MATRIX){
  const errors=[];
  if(rows.length!==52)errors.push(`outcome-count:${rows.length}`);
  if(new Set(rows.map(row=>row.outcomeCode)).size!==52)errors.push('duplicate-outcome-code');
  for(const row of rows){
    if(!row.recommendedItemFormats.length)errors.push(`${row.outcomeCode}:item-format`);
    if(!row.questionFamilies.length)errors.push(`${row.outcomeCode}:question-family`);
    if(!row.misconceptionFamilies.length)errors.push(`${row.outcomeCode}:misconception-family`);
    if(!row.solverFamily||!row.independentVerifier)errors.push(`${row.outcomeCode}:verification-contract`);
    if(row.gameAdaptationAllowed!==false)errors.push(`${row.outcomeCode}:game-adaptation-open`);
  }
  const unitCounts=Object.fromEntries([...new Set(rows.map(row=>row.unitName))].map(unit=>[unit,rows.filter(row=>row.unitName===unit).length]));
  const implementedOutcomeCount=rows.filter(row=>row.implementedItemCount>0).length;
  const implementedItemCount=buildGrade8MathCrossPilotQuestions().length+buildGrade8MathWave1Questions().length+buildGrade8MathCompletionQuestions().length;
  const metrics=Object.freeze({
    officialOutcomeCount:rows.length,
    unitCounts,
    implementedOutcomeCount,
    implementedItemCount,
    uncoveredOutcomeCount:rows.length-implementedOutcomeCount,
    visualOrInteractiveOutcomeCount:rows.filter(row=>row.requiresVisual).length,
    humanRubricOutcomeCount:rows.filter(row=>row.requiresHumanScoring).length,
    productReady:false,
    humanReviewStatus:'NOT_MEASURED',
    gameAdaptationAllowed:false
  });
  return Object.freeze({ok:errors.length===0,errors:Object.freeze(errors),metrics});
}

export const GRADE8_MATH_FULL_SCOPE_AUDIT=auditGrade8MathFullScopeMatrix();
