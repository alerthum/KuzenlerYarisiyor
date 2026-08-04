import { ASSESSMENT_V2_PRODUCTION_PORTFOLIO } from './production-portfolio.js';
import { ASSESSMENT_V2_HUMAN_REVIEW_QUEUE } from './human-review-queue.js';

export function buildAssessmentV2AutonomousExpansionPlan(portfolio=ASSESSMENT_V2_PRODUCTION_PORTFOLIO,queue=ASSESSMENT_V2_HUMAN_REVIEW_QUEUE){
  const engines=portfolio.engines.map(engine=>Object.freeze({
    engineId:engine.id,grade:engine.grade,courseId:engine.courseId,officialOutcomeCount:engine.officialOutcomeCount,coveredOutcomeCount:engine.coveredOutcomeCount,
    remainingOutcomeCount:Math.max(0,engine.officialOutcomeCount-engine.coveredOutcomeCount),canonicalQuestionCount:engine.canonicalQuestionCount,
    reviewQueueCount:engine.humanReviewQueueCount,engineeringScopeComplete:engine.coveredOutcomeCount===engine.officialOutcomeCount,gameAdaptationAllowed:false
  }));
  const backlog=Object.freeze([
    Object.freeze({order:1,id:'calibrate-risk-sample',kind:'HUMAN_REVIEW',scope:`${portfolio.summary.activeEngineCellCount} aktif motor için risk tabakalı örneklem`,reason:`${queue.metrics.pending} görevin tümünü sırayla okumadan önce her format, kazanım ve zorluk katmanından dengeli örneklem onaylanmalı.`,count:113}),
    Object.freeze({order:2,id:'media-asset-pipeline',kind:'MEDIA_AND_RUBRIC',scope:'İngilizce dinleme, Türkçe dinleme/konuşma, tarih kaynakları ve Fen deneyleri',reason:'Kanonik görevler gerçek medya, kaynak provenansı ve rubrik örnekleriyle tamamlanmalı.',count:1}),
    Object.freeze({order:3,id:'game-adaptation-lab',kind:'GAME_ADAPTATION',scope:'Yalnız insan onaylı örneklem',reason:'Anlam koruma ve tersine doğrulama kapılarıyla ilk oyun adaptasyon laboratuvarı kurulmalı.',count:1}),
    Object.freeze({order:4,id:'student-pilot',kind:'PILOT',scope:'Küçük öğrenci grupları',reason:'Madde güçlüğü, ayırt edicilik, çeldirici performansı ve rubrik tutarlılığı gerçek veriyle ölçülmeli.',count:1}),
    Object.freeze({order:5,id:'expand-grade-map',kind:'NEW_ENGINE',scope:'1–12 zorunlu ders hücreleri',reason:'112 hücrenin 30’u aktif; yerel resmî kanıtı bulunan köprü hücreleri açıldı, kalanlar kaynak edinimi sonrası ilerlemeli.',count:82})
  ]);
  return Object.freeze({schemaVersion:'2.0',generatedAt:new Date().toISOString(),target:portfolio.target,status:'PRIMARY_BRIDGE_AND_GRADES5_8_CORE_AUTONOMOUS_REVIEW_AND_EXPANSION_PLAN',productReady:false,gameAdaptationAllowed:false,
    metrics:Object.freeze({activeEngineCount:engines.length,engineeringScopeCompleteEngineCount:engines.filter(e=>e.engineeringScopeComplete).length,remainingOutcomeCount:engines.reduce((s,e)=>s+e.remainingOutcomeCount,0),humanReviewQueueCount:queue.metrics.pending,unopenedCourseCellCount:portfolio.summary.courseScheduleCellCount-portfolio.summary.activeEngineCellCount}),
    engines:Object.freeze(engines),backlog});
}
export function auditAssessmentV2AutonomousExpansionPlan(plan=buildAssessmentV2AutonomousExpansionPlan()){
  const errors=[];
  if(plan.metrics.activeEngineCount!==30)errors.push('active-engine-count');
  if(plan.metrics.engineeringScopeCompleteEngineCount!==30)errors.push(`scope-complete:${plan.metrics.engineeringScopeCompleteEngineCount}`);
  if(plan.metrics.remainingOutcomeCount!==0)errors.push(`remaining-outcomes:${plan.metrics.remainingOutcomeCount}`);
  if(plan.metrics.humanReviewQueueCount!==1891)errors.push(`review-queue:${plan.metrics.humanReviewQueueCount}`);
  if(plan.metrics.unopenedCourseCellCount!==82)errors.push(`unopened-cells:${plan.metrics.unopenedCourseCellCount}`);
  if(plan.gameAdaptationAllowed!==false||plan.productReady!==false)errors.push('release-leak');
  if(plan.backlog.some((row,index)=>row.order!==index+1))errors.push('backlog-order');
  return Object.freeze({ok:errors.length===0,errors:Object.freeze(errors),metrics:plan.metrics});
}
export const ASSESSMENT_V2_AUTONOMOUS_EXPANSION_PLAN=buildAssessmentV2AutonomousExpansionPlan();
export const ASSESSMENT_V2_AUTONOMOUS_EXPANSION_PLAN_AUDIT=auditAssessmentV2AutonomousExpansionPlan(ASSESSMENT_V2_AUTONOMOUS_EXPANSION_PLAN);
