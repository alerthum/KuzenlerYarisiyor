import { CORE_GAME_RELEASE_PROFILE } from './core-game-release-profile.js';
import { CORE_GAME_REVIEW_SPRINTS } from './core-game-review-sprints.js';
import { ASSESSMENT_V2_GAME_ADAPTATION_LAB_AUDIT } from './game-adaptation-lab.js';

const freeze=value=>{
  if(Array.isArray(value))return Object.freeze(value.map(freeze));
  if(value&&typeof value==='object')return Object.freeze(Object.fromEntries(Object.entries(value).map(([k,v])=>[k,freeze(v)])));
  return value;
};

export function evaluateCoreGameReleaseReadiness({
  profile=CORE_GAME_RELEASE_PROFILE,
  reviewPlan=CORE_GAME_REVIEW_SPRINTS,
  studentPilot=null,
  liveBattery=null,
  buildEvidence={status:'NOT_MEASURED'},
  accessibilityEvidence={status:'NOT_MEASURED'},
  securityEvidence={status:'NOT_MEASURED'}
}={}){
  const checks=[];
  const add=(id,label,passed,evidence,blocker)=>checks.push({id,label,passed:Boolean(passed),evidence,blocker:passed?null:blocker});
  add('core-curriculum','5–8 ana derslerde 24/24 hücre ve tam resmî kapsam',profile.metrics.activeCellCount===24&&profile.metrics.missingCellCount===0&&profile.metrics.coveredOutcomeCount===profile.metrics.officialOutcomeCount,profile.metrics,'Ana ders müfredat kapsamı eksik.');
  add('game-routing','23/23 oyun yönlendirme matrisi',profile.metrics.routedGameCount===23&&profile.metrics.unknownGameIds.length===0,{routed:profile.metrics.routedGameCount,required:23,unknown:profile.metrics.unknownGameIds},'En az bir oyun için ders/beceri yönlendirmesi eksik.');
  add('human-review','Çekirdek görevlerin insan incelemesi',reviewPlan.sprints.every(s=>s.metrics.pending===0)&&reviewPlan.totalItems>0,{total:reviewPlan.totalItems,pending:reviewPlan.sprints.reduce((n,s)=>n+s.metrics.pending,0)},'Çekirdek görevlerde insan incelemesi bekleyen kayıt var.');
  add('semantic-adapter','Onaylı içerikte semantik round-trip',ASSESSMENT_V2_GAME_ADAPTATION_LAB_AUDIT.ok===true&&ASSESSMENT_V2_GAME_ADAPTATION_LAB_AUDIT.metrics.adaptedCount>0,ASSESSMENT_V2_GAME_ADAPTATION_LAB_AUDIT.metrics,'Onaylı oyun adaptasyon laboratuvarı geçmedi.');
  add('real-student-pilot','Gerçek öğrenci pilotu',studentPilot?.publicationAllowed===true&&studentPilot?.evidenceSource==='REAL_STUDENT_PILOT'&&studentPilot?.status==='PILOT_PASS',studentPilot||{status:'MISSING'},'Gerçek öğrenci pilotu tamamlanmadı.');
  add('live-game-battery','23 oyun × 500 oturum',liveBattery?.gameCount===23&&liveBattery?.sessionsPerGame>=500&&liveBattery?.underfill===0&&liveBattery?.semanticRepeats===0&&liveBattery?.failedGames?.length===0,liveBattery||{status:'MISSING'},'23 oyun × 500 oturum canlı bataryası tamamlanmadı.');
  add('production-build','Production build',buildEvidence?.status==='PASS',buildEvidence,'Production build PASS değil.');
  add('accessibility','Çekirdek oyun erişilebilirliği',accessibilityEvidence?.status==='PASS',accessibilityEvidence,'Çekirdek oyun erişilebilirliği tamamlanmadı.');
  add('security','Çekirdek oyun güvenliği',securityEvidence?.status==='PASS',securityEvidence,'Çekirdek oyun güvenliği tamamlanmadı.');
  const releaseReady=checks.every(check=>check.passed);
  return freeze({schemaVersion:'1.0',profileId:profile.id,status:releaseReady?'CORE_GAME_RELEASE_READY':'CORE_GAME_RELEASE_BLOCKED',releaseReady,publicationAllowed:releaseReady,fullProductReady:false,checks,blockers:checks.filter(x=>!x.passed).map(x=>x.blocker),metrics:{checkCount:checks.length,passed:checks.filter(x=>x.passed).length,blocked:checks.filter(x=>!x.passed).length}});
}

export function auditCoreGameReleaseReadiness(result=evaluateCoreGameReleaseReadiness()){
  const errors=[];
  if(result.checks.length!==9)errors.push(`check-count:${result.checks.length}`);
  if(result.releaseReady!==result.checks.every(x=>x.passed))errors.push('derivation');
  if(result.publicationAllowed!==result.releaseReady)errors.push('publication-mismatch');
  if(result.fullProductReady!==false)errors.push('full-product-leak');
  if(!result.releaseReady&&result.blockers.length===0)errors.push('missing-blockers');
  return freeze({ok:errors.length===0,errors,metrics:result.metrics});
}

export const CORE_GAME_RELEASE_READINESS=evaluateCoreGameReleaseReadiness();
export const CORE_GAME_RELEASE_READINESS_AUDIT=auditCoreGameReleaseReadiness(CORE_GAME_RELEASE_READINESS);
