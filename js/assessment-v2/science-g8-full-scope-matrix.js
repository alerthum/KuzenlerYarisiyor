import { GRADE8_SCIENCE_OUTCOMES_2018 } from '../curriculum/outcomes/tr-g8-fen-2018.js';
import { buildGrade8ScienceCrossPilotQuestions } from './science-g8-cross-pilot.js';
import { buildGrade8ScienceBroadWaveQuestions, GRADE8_SCIENCE_BROAD_WAVE_OUTCOME_CODES } from './science-g8-wave1-broad.js';
import { buildGrade8ScienceCompletionQuestions, GRADE8_SCIENCE_COMPLETION_OUTCOME_CODES } from './science-g8-completion-wave.js';

export const GRADE8_SCIENCE_CROSS_PILOT_OUTCOME_CODES = Object.freeze(['F.8.1.1.1','F.8.2.2.2','F.8.3.1.1','F.8.4.5.3','F.8.5.1.1']);
const IMPLEMENTED = new Set([...GRADE8_SCIENCE_CROSS_PILOT_OUTCOME_CODES,...GRADE8_SCIENCE_BROAD_WAVE_OUTCOME_CODES,...GRADE8_SCIENCE_COMPLETION_OUTCOME_CODES]);

function isPerformance(text){return /(tasarlar|tartışır|özen gösterir|araştırır|öneriler sunar|fikirler üretir|tahminde bulunur)/i.test(text);}
function requiresExperiment(text){return /(deney|gözlem|model üzerinde|şema üzerinde|grafiğini)/i.test(text);}
function solverFamily(row){
  const c=row.officialOutcomeCode;
  if(c.startsWith('F.8.1'))return 'earth-sun-climate-evidence-solver';
  if(c.startsWith('F.8.2'))return 'genetics-inheritance-biology-model-solver';
  if(c.startsWith('F.8.3'))return 'pressure-variable-control-solver';
  if(c.startsWith('F.8.4'))return 'matter-chemistry-experiment-solver';
  if(c.startsWith('F.8.5'))return 'simple-machine-design-principle-solver';
  if(c.startsWith('F.8.6'))return 'ecosystem-energy-sustainability-solver';
  return 'electric-charge-energy-transformation-solver';
}
function verifierFamily(row){
  if(requiresExperiment(row.officialOutcomeText))return 'independent-variable-and-evidence-checker';
  if(isPerformance(row.officialOutcomeText))return 'rubric-constraint-and-counterexample-checker';
  return 'independent-concept-map-verifier';
}
function questionFamilies(row){
  const base=['evidence-selection','model-interpretation','misconception-diagnosis'];
  if(requiresExperiment(row.officialOutcomeText))base.push('controlled-experiment','data-table-or-graph');
  if(isPerformance(row.officialOutcomeText))base.push('claim-evidence-reasoning','design-or-decision-task');
  else base.push('classification-or-explanation');
  return base;
}
function misconceptionFamilies(row){
  const c=row.officialOutcomeCode;
  if(c.startsWith('F.8.1'))return ['distance-causes-seasons','weather-equals-climate','single-observation-generalization'];
  if(c.startsWith('F.8.2'))return ['hierarchy-reversal','dominant-means-common','acquired-trait-inherited'];
  if(c.startsWith('F.8.3'))return ['one-variable-ignored','pressure-force-confusion','area-relation-reversed'];
  if(c.startsWith('F.8.4'))return ['physical-chemical-confusion','ph-direction-reversed','heat-temperature-confusion'];
  if(c.startsWith('F.8.5'))return ['machine-creates-energy','force-gain-means-work-gain','distance-tradeoff-ignored'];
  if(c.startsWith('F.8.6'))return ['energy-cycles-completely','producer-consumer-role-confusion','local-action-no-system-effect'];
  return ['neutral-means-no-charge','same-charges-attract','energy-source-conversion-confusion'];
}

export const GRADE8_SCIENCE_FULL_SCOPE_MATRIX=Object.freeze(GRADE8_SCIENCE_OUTCOMES_2018.map(row=>{
  const performance=isPerformance(row.officialOutcomeText);
  const experiment=requiresExperiment(row.officialOutcomeText);
  const implemented=IMPLEMENTED.has(row.officialOutcomeCode);
  return Object.freeze({
    outcomeId:row.id,outcomeCode:row.officialOutcomeCode,outcomeText:row.officialOutcomeText,
    unitId:row.unitId,unitName:row.unitName,topicId:row.topicId,topicName:row.topicName,sourceLocator:row.sourceLocator,
    assessmentMode:performance?'PERFORMANCE_OR_CER_TASK':experiment?'EXPERIMENT_OR_MODEL_TASK':'CANONICAL_EVIDENCE_TASK',
    assessmentChannel:experiment?'VISUAL_DATA_EXPERIMENT':performance?'OPEN_RESPONSE_OR_DECISION':'TEXT_MODEL_CLASSIFICATION',
    recommendedItemFormats:Object.freeze([...row.assessmentEvidenceTypes]),requiresVisual:experiment,requiresHumanScoring:performance,
    automatedScoringAllowed:!performance||row.assessmentEvidenceTypes.includes('single-choice'),solverFamily:solverFamily(row),independentVerifier:verifierFamily(row),
    questionFamilies:Object.freeze(questionFamilies(row)),misconceptionFamilies:Object.freeze(misconceptionFamilies(row)),
    implementationStatus:implemented?'ENGINEERING_ITEM_EXISTS':'NOT_YET_IMPLEMENTED',implementedItemCount:implemented?1:0,
    humanReviewStatus:'NOT_MEASURED',gameAdaptationAllowed:false
  });
}));

export function auditGrade8ScienceFullScopeMatrix(rows=GRADE8_SCIENCE_FULL_SCOPE_MATRIX){
  const errors=[];
  if(rows.length!==61)errors.push(`outcome-count:${rows.length}`);
  if(new Set(rows.map(r=>r.outcomeCode)).size!==61)errors.push('duplicate-outcome-code');
  for(const row of rows){
    if(!row.solverFamily||!row.independentVerifier)errors.push(`${row.outcomeCode}:verification`);
    if(row.questionFamilies.length<4)errors.push(`${row.outcomeCode}:families`);
    if(row.misconceptionFamilies.length<3)errors.push(`${row.outcomeCode}:misconceptions`);
    if(row.gameAdaptationAllowed!==false)errors.push(`${row.outcomeCode}:game-open`);
  }
  const implementedOutcomeCount=rows.filter(r=>r.implementedItemCount>0).length;
  const implementedItemCount=buildGrade8ScienceCrossPilotQuestions().length+buildGrade8ScienceBroadWaveQuestions().length+buildGrade8ScienceCompletionQuestions().length;
  return Object.freeze({ok:errors.length===0,errors:Object.freeze(errors),metrics:Object.freeze({officialOutcomeCount:rows.length,implementedOutcomeCount,implementedItemCount,uncoveredOutcomeCount:rows.length-implementedOutcomeCount,humanRubricOutcomeCount:rows.filter(r=>r.requiresHumanScoring).length,visualExperimentOutcomeCount:rows.filter(r=>r.requiresVisual).length,productReady:false,humanReviewStatus:'NOT_MEASURED',gameAdaptationAllowed:false})});
}

export const GRADE8_SCIENCE_FULL_SCOPE_AUDIT=auditGrade8ScienceFullScopeMatrix();
