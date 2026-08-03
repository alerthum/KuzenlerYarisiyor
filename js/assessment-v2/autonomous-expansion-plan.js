import { ASSESSMENT_V2_PRODUCTION_PORTFOLIO } from './production-portfolio.js';
import { ASSESSMENT_V2_HUMAN_REVIEW_QUEUE } from './human-review-queue.js';

export function buildAssessmentV2AutonomousExpansionPlan(portfolio=ASSESSMENT_V2_PRODUCTION_PORTFOLIO,queue=ASSESSMENT_V2_HUMAN_REVIEW_QUEUE){
  const engines=portfolio.engines.map(engine=>Object.freeze({
    engineId:engine.id,
    grade:engine.grade,
    courseId:engine.courseId,
    officialOutcomeCount:engine.officialOutcomeCount,
    coveredOutcomeCount:engine.coveredOutcomeCount,
    remainingOutcomeCount:Math.max(0,engine.officialOutcomeCount-engine.coveredOutcomeCount),
    canonicalQuestionCount:engine.canonicalQuestionCount,
    reviewQueueCount:engine.humanReviewQueueCount,
    engineeringScopeComplete:engine.coveredOutcomeCount===engine.officialOutcomeCount,
    gameAdaptationAllowed:false
  }));
  const backlog=Object.freeze([
    Object.freeze({order:1,id:'review-g8-math',kind:'HUMAN_REVIEW',scope:'8. sınıf Matematik 52 görev',reason:'Mühendislik kapsamı tamamlandı; etkileşim ve soru kalitesi insan onayı bekliyor.',count:52}),
    Object.freeze({order:2,id:'complete-g8-science',kind:'CONTENT_EXPANSION',scope:'8. sınıf Fen Bilimleri',reason:'61 kazanımdan 33’ü görevle kapsandı.',count:28}),
    Object.freeze({order:3,id:'complete-g5-turkish',kind:'CONTENT_EXPANSION',scope:'5. sınıf Türkçe',reason:'100 çıktıdan 25’i görevle kapsandı.',count:75}),
    Object.freeze({order:4,id:'complete-g8-turkish',kind:'CONTENT_EXPANSION',scope:'8. sınıf Türkçe',reason:'76 kazanımdan 31’i görevle kapsandı.',count:45}),
    Object.freeze({order:5,id:'open-lgs-engines',kind:'NEW_ENGINE',scope:'8. sınıf İnkılap Tarihi, Din Kültürü ve İngilizce',reason:'LGS ders motorlarının tamamı açılmalı.',count:3}),
    Object.freeze({order:6,id:'expand-grade-map',kind:'NEW_ENGINE',scope:'1–12 zorunlu ders hücreleri',reason:'112 hücrenin yalnız 4’ü aktif.',count:108})
  ]);
  return Object.freeze({
    schemaVersion:'1.0',generatedAt:new Date().toISOString(),target:portfolio.target,status:'AUTONOMOUS_EXECUTION_PLAN_READY',productReady:false,gameAdaptationAllowed:false,
    metrics:Object.freeze({activeEngineCount:engines.length,engineeringScopeCompleteEngineCount:engines.filter(e=>e.engineeringScopeComplete).length,remainingOutcomeCount:engines.reduce((s,e)=>s+e.remainingOutcomeCount,0),humanReviewQueueCount:queue.metrics.pending,unopenedCourseCellCount:portfolio.summary.courseScheduleCellCount-portfolio.summary.activeEngineCellCount}),
    engines:Object.freeze(engines),backlog
  });
}

export function auditAssessmentV2AutonomousExpansionPlan(plan=buildAssessmentV2AutonomousExpansionPlan()){
  const errors=[];
  if(plan.metrics.activeEngineCount!==4)errors.push('active-engine-count');
  if(plan.metrics.engineeringScopeCompleteEngineCount!==1)errors.push(`scope-complete:${plan.metrics.engineeringScopeCompleteEngineCount}`);
  if(plan.metrics.remainingOutcomeCount!==148)errors.push(`remaining-outcomes:${plan.metrics.remainingOutcomeCount}`);
  if(plan.metrics.humanReviewQueueCount!==156)errors.push(`review-queue:${plan.metrics.humanReviewQueueCount}`);
  if(plan.metrics.unopenedCourseCellCount!==108)errors.push(`unopened-cells:${plan.metrics.unopenedCourseCellCount}`);
  if(plan.gameAdaptationAllowed!==false||plan.productReady!==false)errors.push('release-leak');
  if(plan.backlog.some((row,index)=>row.order!==index+1))errors.push('backlog-order');
  return Object.freeze({ok:errors.length===0,errors:Object.freeze(errors),metrics:plan.metrics});
}

export const ASSESSMENT_V2_AUTONOMOUS_EXPANSION_PLAN=buildAssessmentV2AutonomousExpansionPlan();
export const ASSESSMENT_V2_AUTONOMOUS_EXPANSION_PLAN_AUDIT=auditAssessmentV2AutonomousExpansionPlan(ASSESSMENT_V2_AUTONOMOUS_EXPANSION_PLAN);
