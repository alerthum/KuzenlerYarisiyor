import { buildGrade8TurkishPilot01Questions } from './turkish-g8-reading-pilot01.js';
import { buildGrade8TurkishPilot02CalibrationQuestions } from './turkish-g8-pilot02-calibration.js';
import { buildGrade8TurkishReadingLanguageWave1Questions } from './turkish-g8-reading-language-wave1.js';
import { buildGrade8TurkishVisualGrammarWave2Questions } from './turkish-g8-visual-grammar-wave2.js';
import { buildGrade8MathCrossPilotQuestions } from './math-g8-cross-pilot.js';
import { buildGrade8MathWave1Questions } from './math-g8-wave1.js';
import { buildGrade8MathCompletionQuestions } from './math-g8-completion-waves.js';
import { buildGrade8ScienceCrossPilotQuestions } from './science-g8-cross-pilot.js';
import { buildGrade8ScienceBroadWaveQuestions } from './science-g8-wave1-broad.js';
import { buildGrade8ScienceCompletionQuestions } from './science-g8-completion-wave.js';
import { buildGrade5TurkishCrossPilotQuestions } from './turkish-g5-cross-pilot.js';
import { buildGrade5TurkishBroadWaveQuestions } from './turkish-g5-broad-wave.js';
import { buildGrade5TurkishCompletionTasks } from './turkish-g5-completion-wave.js';
import { buildGrade8TurkishCompletionTasks } from './turkish-g8-completion-wave.js';
import { buildGrade8HistoryFullScopeTasks } from './history-g8-full-scope-engine.js';
import { buildGrade8DkabFullScopeTasks } from './dkab-g8-full-scope-engine.js';
import { buildGrade8EnglishFullScopeTasks } from './english-g8-full-scope-engine.js';
import { buildGrade5MathFullScopeTasks, buildGrade5ScienceFullScopeTasks, buildGrade5SocialFullScopeTasks, buildGrade5DkabFullScopeTasks, buildGrade5EnglishFullScopeTasks } from './grade5-core-full-scope-engines.js';
import { buildMiddleSchoolTymmCoreTasks } from './middle-school-tymm-core-engines.js';
import { buildPrimaryBridgeCoreTasks } from './primary-bridge-core-engines.js';
import { buildPrimaryTymmAcademicCoreTasks } from './primary-tymm-academic-core-engines.js';
import { buildPrimaryTymmVisualArtsTasks } from './primary-tymm-visual-arts-engines.js';
import { buildPrimaryTymmMusicTasks } from './primary-tymm-music-engines.js';
import { buildMiddleSchoolTymmVisualArtsTasks } from './middle-school-tymm-visual-arts-engines.js';

const freezeRows=rows=>Object.freeze(rows.map(row=>Object.freeze(row)));

export function buildAssessmentV2CanonicalCatalog(){
  return freezeRows([
    ...buildGrade8TurkishPilot01Questions(),
    ...buildGrade8TurkishPilot02CalibrationQuestions(),
    ...buildGrade8TurkishReadingLanguageWave1Questions(),
    ...buildGrade8TurkishVisualGrammarWave2Questions(),
    ...buildGrade8MathCrossPilotQuestions(),
    ...buildGrade8MathWave1Questions(),
    ...buildGrade8MathCompletionQuestions(),
    ...buildGrade8ScienceCrossPilotQuestions(),
    ...buildGrade8ScienceBroadWaveQuestions(),
    ...buildGrade8ScienceCompletionQuestions(),
    ...buildGrade5TurkishCrossPilotQuestions(),
    ...buildGrade5TurkishBroadWaveQuestions(),
    ...buildGrade5TurkishCompletionTasks(),
    ...buildGrade8TurkishCompletionTasks(),
    ...buildGrade8HistoryFullScopeTasks(),
    ...buildGrade8DkabFullScopeTasks(),
    ...buildGrade8EnglishFullScopeTasks(),
    ...buildGrade5MathFullScopeTasks(),
    ...buildGrade5ScienceFullScopeTasks(),
    ...buildGrade5SocialFullScopeTasks(),
    ...buildGrade5DkabFullScopeTasks(),
    ...buildGrade5EnglishFullScopeTasks(),
    ...buildMiddleSchoolTymmCoreTasks(),
    ...buildPrimaryBridgeCoreTasks(),
    ...buildPrimaryTymmAcademicCoreTasks(),
    ...buildPrimaryTymmVisualArtsTasks(),
    ...buildPrimaryTymmMusicTasks(),
    ...buildMiddleSchoolTymmVisualArtsTasks()
  ]);
}

export function auditAssessmentV2CanonicalCatalog(items=buildAssessmentV2CanonicalCatalog()){
  const errors=[];
  if(items.length!==2234)errors.push(`item-count:${items.length}`);
  if(new Set(items.map(item=>item.id)).size!==items.length)errors.push('duplicate-item-id');
  for(const item of items){
    if(!item.curriculum?.grade||!item.curriculum?.courseId)errors.push(`${item.id}:curriculum`);
    if(!item.curriculum?.outcomeIds?.length)errors.push(`${item.id}:outcome`);
    if(!item.hints?.length)errors.push(`${item.id}:hints`);
    if(!item.solutionGraph?.length)errors.push(`${item.id}:solution-graph`);
    if(item.gameBindings?.length)errors.push(`${item.id}:game-binding`);
    if(item.content?.humanReview?.gameAdaptationAllowed!==false)errors.push(`${item.id}:game-open`);
    if(item.contentStatus!=='HUMAN_REVIEW_REQUIRED'&&!String(item.contentStatus||'').includes('REVIEW'))errors.push(`${item.id}:status`);
  }
  const byEngine=items.reduce((acc,item)=>{
    const key=`g${item.curriculum.grade}:${item.curriculum.courseId}`;
    acc[key]=(acc[key]||0)+1;
    return acc;
  },{});
  return Object.freeze({ok:errors.length===0,errors:Object.freeze(errors),metrics:Object.freeze({itemCount:items.length,byEngine:Object.freeze(byEngine),gameAdaptedCount:items.filter(x=>x.gameBindings?.length).length,productReady:false})});
}

export const ASSESSMENT_V2_CANONICAL_CATALOG=buildAssessmentV2CanonicalCatalog();
export const ASSESSMENT_V2_CANONICAL_CATALOG_AUDIT=auditAssessmentV2CanonicalCatalog(ASSESSMENT_V2_CANONICAL_CATALOG);
