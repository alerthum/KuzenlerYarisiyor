import { ASSESSMENT_V2_PRODUCTION_PORTFOLIO } from './production-portfolio.js';
import { ASSESSMENT_V2_PHASE4P_HUMAN_REVIEW_BATCH } from './human-review-batch.js';

const freeze=value=>{
  if(Array.isArray(value))return Object.freeze(value.map(freeze));
  if(value&&typeof value==='object')return Object.freeze(Object.fromEntries(Object.entries(value).map(([k,v])=>[k,freeze(v)])));
  return value;
};

export const PRODUCT_READINESS_REQUIREMENTS=freeze({
  requiredCourseCells:112,
  requiredActiveGradeCount:12,
  requiredLiveGameCount:23,
  requiredSessionsPerGame:500,
  requiredHumanReviewPending:0,
  requiredHumanRevisionOrReject:0,
  realStudentPilotRequired:true,
  accessibilityRequired:true,
  securityRequired:true,
  mediaAndRubricAssetsRequired:true,
  productionBuildRequired:true,
  legacyQuarantineCount:604
});

export function evaluateAssessmentV2ProductReadiness({
  portfolio=ASSESSMENT_V2_PRODUCTION_PORTFOLIO,
  humanReview=ASSESSMENT_V2_PHASE4P_HUMAN_REVIEW_BATCH.consensus,
  studentPilot=null,
  liveBattery=null,
  buildEvidence={status:'PASS'},
  accessibilityEvidence={status:'NOT_MEASURED'},
  securityEvidence={status:'NOT_MEASURED'},
  mediaRubricEvidence={status:'INCOMPLETE'},
  legacyEvidence={count:604,status:'UNVERIFIED_LEGACY',quarantined:true}
}={}){
  const checks=[];
  const add=(id,label,passed,evidence,blocker)=>checks.push({id,label,passed:Boolean(passed),evidence,blocker:passed?null:blocker});
  add('course-cell-coverage','112 zorunlu sınıf–ders hücresi',portfolio.summary.activeEngineCellCount===112,{active:portfolio.summary.activeEngineCellCount,required:112},`${112-portfolio.summary.activeEngineCellCount} sınıf–ders hücresi henüz açılmadı.`);
  add('grade-coverage','1–12 sınıf kapsamı',portfolio.summary.activeGradeCount===12,{active:portfolio.summary.activeGradeCount,required:12},`${12-portfolio.summary.activeGradeCount} sınıf düzeyinde aktif motor yok.`);
  add('active-engine-curriculum','Aktif motorlarda tam resmî kapsam',portfolio.engines.every(e=>e.coveredOutcomeCount===e.officialOutcomeCount),{engines:portfolio.engines.length},'Aktif motorlardan en az birinde kazanım boşluğu var.');
  add('human-review','İnsan inceleme konsensüsü',humanReview?.metrics?.pending===0&&humanReview?.metrics?.revisionRequired===0&&humanReview?.metrics?.rejected===0&&humanReview?.metrics?.approved===humanReview?.metrics?.total,{...(humanReview?.metrics||{})},'İnsan incelemesi tamamlanmadı veya revizyon/reddedilen görev var.');
  add('real-student-pilot','Gerçek öğrenci pilotu ve madde analizi',studentPilot?.publicationAllowed===true&&studentPilot?.evidenceSource==='REAL_STUDENT_PILOT'&&studentPilot?.status==='PILOT_PASS',{status:studentPilot?.status||'MISSING',source:studentPilot?.evidenceSource||'MISSING'},'Gerçek öğrenci pilotu kanıtı yok; simülasyon yayın yetkisi vermez.');
  add('live-session-battery','23 oyun × 500 oturum canlı bataryası',liveBattery?.gameCount===23&&liveBattery?.sessionsPerGame>=500&&liveBattery?.underfill===0&&liveBattery?.semanticRepeats===0&&liveBattery?.failedGames?.length===0,{gameCount:liveBattery?.gameCount||0,sessionsPerGame:liveBattery?.sessionsPerGame||0,underfill:liveBattery?.underfill??null,semanticRepeats:liveBattery?.semanticRepeats??null},'23 oyun için 500 oturumluk canlı tekrar/underfill kanıtı tamamlanmadı.');
  add('production-build','Production build',buildEvidence?.status==='PASS',buildEvidence,'Production build kanıtı PASS değil.');
  add('accessibility','Erişilebilirlik kapısı',accessibilityEvidence?.status==='PASS',accessibilityEvidence,'Erişilebilirlik kanıtı tamamlanmadı.');
  add('security','Güvenlik ve veri gizliliği kapısı',securityEvidence?.status==='PASS',securityEvidence,'Güvenlik/veri gizliliği kanıtı tamamlanmadı.');
  add('media-rubric-assets','Gerçek medya ve rubrik varlıkları',mediaRubricEvidence?.status==='PASS',mediaRubricEvidence,'Ses, görsel, deney, kaynak ve rubrik varlıklarının tamamlanma kanıtı yok.');
  add('legacy-quarantine','604 legacy içeriğin karantinası',legacyEvidence?.count===604&&legacyEvidence?.status==='UNVERIFIED_LEGACY'&&legacyEvidence?.quarantined===true,legacyEvidence,'Legacy 604 karantina politikası bozuldu.');
  const blockers=checks.filter(c=>!c.passed).map(c=>c.blocker);
  const productReady=checks.every(c=>c.passed);
  return freeze({
    schemaVersion:'1.0',generatedAt:new Date().toISOString(),status:productReady?'PRODUCT_READY':'PRODUCT_BLOCKED',
    productReady,publicationAllowed:productReady,gameAdaptationAllowed:productReady,
    requirements:PRODUCT_READINESS_REQUIREMENTS,
    metrics:{checkCount:checks.length,passed:checks.filter(c=>c.passed).length,blocked:checks.filter(c=>!c.passed).length},
    checks,blockers
  });
}

export function auditAssessmentV2ProductReadiness(result=evaluateAssessmentV2ProductReadiness()){
  const errors=[];
  if(result.checks.length!==11)errors.push(`check-count:${result.checks.length}`);
  if(result.productReady!==result.checks.every(c=>c.passed))errors.push('readiness-derivation');
  if(result.publicationAllowed!==result.productReady||result.gameAdaptationAllowed!==result.productReady)errors.push('gate-mismatch');
  if(!result.productReady&&result.blockers.length===0)errors.push('missing-blockers');
  if(result.productReady&&result.blockers.length)errors.push('ready-with-blockers');
  return freeze({ok:errors.length===0,errors,metrics:result.metrics});
}

export const ASSESSMENT_V2_PRODUCT_READINESS=evaluateAssessmentV2ProductReadiness();
export const ASSESSMENT_V2_PRODUCT_READINESS_AUDIT=auditAssessmentV2ProductReadiness(ASSESSMENT_V2_PRODUCT_READINESS);
