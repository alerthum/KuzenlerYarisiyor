import { COURSE_SCHEDULE_REGISTRY_2026_2027 } from '../curriculum/course-schedule-registry-2026-2027.js';
import { CURRICULUM_ROLLOUT_2026_2027 } from '../curriculum/curriculum-rollout-2026-2027.js';
import { GRADE_8_TURKISH_OUTCOMES_2019 } from '../curriculum/outcomes/tr-g8-turkce-2019.js';
import { GRADE8_MATH_OUTCOMES_2018 } from '../curriculum/outcomes/tr-g8-matematik-2018.js';
import { GRADE8_SCIENCE_OUTCOMES_2018 } from '../curriculum/outcomes/tr-g8-fen-2018.js';
import { GRADE5_TURKISH_OUTCOMES_TYMM_2024 } from '../curriculum/outcomes/tr-g5-turkce-tymm-2024.js';
import { GRADE8_TURKISH_FULL_SCOPE_AUDIT, GRADE8_TURKISH_FULL_SCOPE_MATRIX } from './turkish-g8-full-scope-matrix.js';
import { GRADE8_MATH_FULL_SCOPE_AUDIT, GRADE8_MATH_FULL_SCOPE_MATRIX } from './math-g8-full-scope-matrix.js';
import { GRADE8_SCIENCE_FULL_SCOPE_AUDIT, GRADE8_SCIENCE_FULL_SCOPE_MATRIX } from './science-g8-full-scope-matrix.js';
import { GRADE5_TURKISH_FULL_SCOPE_AUDIT, GRADE5_TURKISH_FULL_SCOPE_MATRIX } from './turkish-g5-full-scope-matrix.js';
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
import { GRADE8_TURKISH_HUMAN_REVIEW_DECISIONS } from './turkish-g8-human-review-registry.js';
import { QUESTION_ARCHITECTURE_POLICY } from './question-architecture-policy.js';

export const ASSESSMENT_V2_TARGET_STATEMENT='1–12. sınıf, tüm dersler ve ilgili merkezî sınavlar için müfredata bağlı ayrı ders motorları; doğrulanmış sorular oyunlara en son uyarlanır.';
const LEGACY_QUARANTINE_COUNT=604;
const frozenArray=rows=>Object.freeze(rows.map(row=>Object.freeze(row)));
const percent=(part,total)=>total>0?Number(((part/total)*100).toFixed(1)):null;

function engineRow(input){
  const approved=new Set(input.approvedQuestionIds||[]);
  const humanApprovedQuestionCount=input.items.filter(item=>approved.has(item.id)).length;
  return Object.freeze({
    id:input.id,grade:input.grade,courseId:input.courseId,courseName:input.courseName,programFamily:input.programFamily,
    curriculumStatus:input.curriculumStatus,officialOutcomeCount:input.officialOutcomeCount,ingestedOutcomeCount:input.ingestedOutcomeCount,
    coveredOutcomeCount:input.coveredOutcomeCount,courseCoveragePercent:percent(input.coveredOutcomeCount,input.officialOutcomeCount),
    ingestionPercent:percent(input.ingestedOutcomeCount,input.officialOutcomeCount),canonicalQuestionCount:input.items.length,
    humanApprovedQuestionCount,humanReviewQueueCount:input.items.length-humanApprovedQuestionCount,gameAdaptedQuestionCount:0,
    gameAdaptationAllowed:false,engineStatus:input.engineStatus,engineType:input.engineType,verifierType:input.verifierType,
    misconceptionCatalog:input.misconceptionCatalog,nextAction:input.nextAction,blockers:Object.freeze([...input.blockers])
  });
}

export function buildAssessmentV2ProductionPortfolio(){
  const grade8TurkishItems=[...buildGrade8TurkishPilot01Questions(),...buildGrade8TurkishPilot02CalibrationQuestions(),...buildGrade8TurkishReadingLanguageWave1Questions(),...buildGrade8TurkishVisualGrammarWave2Questions()];
  const grade8MathItems=[...buildGrade8MathCrossPilotQuestions(),...buildGrade8MathWave1Questions(),...buildGrade8MathCompletionQuestions()];
  const grade8ScienceItems=[...buildGrade8ScienceCrossPilotQuestions(),...buildGrade8ScienceBroadWaveQuestions(),...buildGrade8ScienceCompletionQuestions()];
  const grade5TurkishItems=[...buildGrade5TurkishCrossPilotQuestions(),...buildGrade5TurkishBroadWaveQuestions()];
  const approvedTurkishIds=GRADE8_TURKISH_HUMAN_REVIEW_DECISIONS.map(row=>row.questionId);

  const engines=frozenArray([
    engineRow({id:'tr-g8-turkce-v2',grade:8,courseId:'turkce',courseName:'Türkçe',programFamily:'PRE_TYMM',curriculumStatus:'FULL_SCOPE_INGESTED',officialOutcomeCount:GRADE_8_TURKISH_OUTCOMES_2019.length,ingestedOutcomeCount:GRADE8_TURKISH_FULL_SCOPE_MATRIX.length,coveredOutcomeCount:GRADE8_TURKISH_FULL_SCOPE_AUDIT.metrics.implementedOutcomeCount,items:grade8TurkishItems,approvedQuestionIds:approvedTurkishIds,engineStatus:'EXPANDING',engineType:'semantic-evidence + grammar + visual-reading + performance-rubric',verifierType:'independent semantic/constraint verification',misconceptionCatalog:'tr-g8-turkish-domain-misconceptions',nextAction:'Kalan 45 kazanımı dinleme, konuşma, yazma ve eksik okuma dalgalarıyla kapat.',blockers:['45 kazanım henüz kanonik soru veya performans göreviyle kapsanmadı.','İnsan inceleme kuyruğu tamamlanmadı.']}),
    engineRow({id:'tr-g8-matematik-v2',grade:8,courseId:'matematik',courseName:'Matematik',programFamily:'PRE_TYMM',curriculumStatus:'FULL_SCOPE_INGESTED',officialOutcomeCount:GRADE8_MATH_OUTCOMES_2018.length,ingestedOutcomeCount:GRADE8_MATH_FULL_SCOPE_MATRIX.length,coveredOutcomeCount:GRADE8_MATH_FULL_SCOPE_AUDIT.metrics.implementedOutcomeCount,items:grade8MathItems,engineStatus:'ENGINEERING_SCOPE_COMPLETE',engineType:'symbolic/numeric/geometry solver-backed + interactive construction',verifierType:'independent alternate algorithm and invariant checks',misconceptionCatalog:'tr-g8-math-full-scope-misconceptions',nextAction:'52 Matematik görevini insan örneklemiyle kalibre et ve onaylananları oyun adaptasyon laboratuvarına geçir.',blockers:['52 Matematik görevinin insan gözle kalibrasyonu yapılmadı.','Etkileşimli çizim görevlerinin UI bileşenleri henüz bağlanmadı.']}),
    engineRow({id:'tr-g8-fen-v2',grade:8,courseId:'fen-bilimleri',courseName:'Fen Bilimleri',programFamily:'PRE_TYMM',curriculumStatus:'FULL_SCOPE_INGESTED',officialOutcomeCount:GRADE8_SCIENCE_OUTCOMES_2018.length,ingestedOutcomeCount:GRADE8_SCIENCE_FULL_SCOPE_MATRIX.length,coveredOutcomeCount:GRADE8_SCIENCE_FULL_SCOPE_AUDIT.metrics.implementedOutcomeCount,items:grade8ScienceItems,engineStatus:'ENGINEERING_SCOPE_COMPLETE',engineType:'model/experiment/data reasoning + CER/design rubrics',verifierType:'evidence-constraint + scientific model verification',misconceptionCatalog:'tr-g8-science-full-scope-misconceptions',nextAction:'61 Fen görevini insan örneklemiyle kalibre et ve onaylanan deney/tasarım görevlerini etkileşim bileşenlerine bağla.',blockers:['61 Fen görevinin insan gözle kalibrasyonu yapılmadı.','Deney ve tasarım görevlerinin gerçek medya/etkileşim bileşenleri henüz bağlanmadı.']}),
    engineRow({id:'tr-g5-turkce-v2',grade:5,courseId:'turkce',courseName:'Türkçe',programFamily:'TYMM',curriculumStatus:'FULL_SCOPE_INGESTED',officialOutcomeCount:GRADE5_TURKISH_OUTCOMES_TYMM_2024.length,ingestedOutcomeCount:GRADE5_TURKISH_FULL_SCOPE_MATRIX.length,coveredOutcomeCount:GRADE5_TURKISH_FULL_SCOPE_AUDIT.metrics.implementedOutcomeCount,items:grade5TurkishItems,engineStatus:'EXPANDING',engineType:'age-calibrated listening/reading evidence + speaking/writing rubrics',verifierType:'independent evidence intersection + rubric consistency',misconceptionCatalog:'tr-g5-turkish-full-scope-misconceptions',nextAction:'Kalan 75 öğrenme çıktısını beceri alanı dalgalarıyla kapat.',blockers:['75 öğrenme çıktısı henüz görevle kapsanmadı.','Ses kayıtları ve performans rubriklerinin insan kalibrasyonu yapılmadı.']})
  ]);

  const questionCount=engines.reduce((s,r)=>s+r.canonicalQuestionCount,0);
  const approvedCount=engines.reduce((s,r)=>s+r.humanApprovedQuestionCount,0);
  const ingestedOutcomeCount=engines.reduce((s,r)=>s+r.ingestedOutcomeCount,0);
  const coveredOutcomeCount=engines.reduce((s,r)=>s+r.coveredOutcomeCount,0);
  const uniqueCourseCells=new Set(COURSE_SCHEDULE_REGISTRY_2026_2027.map(row=>`${row.grade}:${row.courseId}`));
  const activeGrades=new Set(engines.map(row=>row.grade));
  return Object.freeze({
    schemaVersion:'2.0',generatedAt:new Date().toISOString(),target:ASSESSMENT_V2_TARGET_STATEMENT,status:'MULTI_ENGINE_FULL_SCOPE_EXPANSION',productReady:false,publicationAllowed:false,gameAdaptationAllowed:false,
    legacy:Object.freeze({count:LEGACY_QUARANTINE_COUNT,status:'UNVERIFIED_LEGACY'}),
    architecture:Object.freeze({policyVersion:QUESTION_ARCHITECTURE_POLICY.version,pipelineOrder:QUESTION_ARCHITECTURE_POLICY.pipelineOrder,sharedContractNotSharedGenerator:true,subjectSpecificEnginesRequired:true}),
    summary:Object.freeze({targetGradeCount:12,activeGradeCount:activeGrades.size,courseScheduleCellCount:uniqueCourseCells.size,activeEngineCellCount:engines.length,activeEngineCellPercent:percent(engines.length,uniqueCourseCells.size),curriculumOutcomeRecordCount:ingestedOutcomeCount,coveredOutcomeCount,canonicalQuestionCount:questionCount,humanApprovedQuestionCount:approvedCount,humanReviewQueueCount:questionCount-approvedCount,gameAdaptedQuestionCount:0,legacyQuarantineCount:LEGACY_QUARANTINE_COUNT}),
    rollout:frozenArray(CURRICULUM_ROLLOUT_2026_2027.map(row=>({grade:row.grade,programFamily:row.programFamily,status:row.programVersionStatus}))),engines,
    pipeline:frozenArray([
      {id:'curriculum',label:'Resmî müfredat',status:'IN_PROGRESS',note:'4 aktif motorun tamamında tam kapsam aktarımı yapıldı.'},
      {id:'subject-engine',label:'Derse özel motor',status:'IN_PROGRESS',note:'Ortak üretici yok; alan çözücüleri ve rubrikleri ayrıdır.'},
      {id:'canonical-content',label:'Kanonik soru/görev',status:'IN_PROGRESS',note:`${questionCount} doğrulanmış mühendislik nesnesi mevcut.`},
      {id:'human-review',label:'İnsan kalibrasyonu',status:approvedCount===questionCount?'PASS':'BLOCKED',note:`${approvedCount} onaylı, ${questionCount-approvedCount} inceleme bekliyor.`},
      {id:'game-adaptation',label:'Oyun uyarlaması',status:'LOCKED',note:'Yalnız insan onaylı ve alan kapsamı yeterli içerikler açılabilir.'},
      {id:'student-pilot',label:'Öğrenci pilotu',status:'NOT_STARTED',note:'Madde analizi ve çeldirici performansı ölçülmedi.'},
      {id:'publication',label:'Yayın',status:'LOCKED',note:'productReady=false.'}
    ]),
    nextMilestones:frozenArray([
      {order:1,id:'g8-science-completion',title:'8. sınıf Fen 61 görev insan kalibrasyonu',reason:'Mühendislik kapsamı tamamlandı; deney ve tasarım kalitesi insan onayı bekliyor.'},
      {order:2,id:'g5-turkish-completion',title:'5. sınıf Türkçe kalan 75 çıktı',reason:'Dört beceri alanı tam matriste; yaşa özel görev dalgaları tamamlanmalı.'},
      {order:3,id:'g8-turkish-completion',title:'8. sınıf Türkçe kalan 45 kazanım',reason:'Dinleme, konuşma ve yazma performans görevleri kapatılmalı.'},
      {order:4,id:'human-review-queue',title:'189 görevlik insan inceleme kuyruğu',reason:'Oyun kilidinin ana bağımlılığı insan kalibrasyonudur.'},
      {order:5,id:'lgs-other-engines',title:'8. sınıf diğer LGS ders motorları',reason:'İnkılap Tarihi, Din Kültürü ve İngilizce motorları açılmalı.'}
    ])
  });
}

export function auditAssessmentV2ProductionPortfolio(portfolio=buildAssessmentV2ProductionPortfolio()){
  const errors=[];
  if(portfolio.summary.targetGradeCount!==12)errors.push('target-grade-count');
  if(portfolio.summary.courseScheduleCellCount!==112)errors.push(`course-cell-count:${portfolio.summary.courseScheduleCellCount}`);
  if(portfolio.engines.length!==4)errors.push(`engine-count:${portfolio.engines.length}`);
  if(new Set(portfolio.engines.map(r=>r.id)).size!==portfolio.engines.length)errors.push('duplicate-engine-id');
  if(portfolio.summary.canonicalQuestionCount!==189)errors.push(`question-count:${portfolio.summary.canonicalQuestionCount}`);
  if(portfolio.summary.curriculumOutcomeRecordCount!==289)errors.push(`outcome-record-count:${portfolio.summary.curriculumOutcomeRecordCount}`);
  if(portfolio.summary.coveredOutcomeCount!==169)errors.push(`covered-outcome-count:${portfolio.summary.coveredOutcomeCount}`);
  if(portfolio.summary.humanApprovedQuestionCount!==5)errors.push(`approved-count:${portfolio.summary.humanApprovedQuestionCount}`);
  if(portfolio.summary.humanReviewQueueCount!==184)errors.push(`review-queue:${portfolio.summary.humanReviewQueueCount}`);
  if(portfolio.productReady!==false||portfolio.publicationAllowed!==false)errors.push('product-ready-leak');
  if(portfolio.gameAdaptationAllowed!==false||portfolio.summary.gameAdaptedQuestionCount!==0)errors.push('game-adaptation-leak');
  if(portfolio.legacy.count!==604||portfolio.legacy.status!=='UNVERIFIED_LEGACY')errors.push('legacy-policy');
  if(portfolio.rollout.length!==12)errors.push(`rollout-count:${portfolio.rollout.length}`);
  if(!portfolio.engines.every(r=>r.gameAdaptationAllowed===false))errors.push('engine-game-lock');
  if(!portfolio.architecture.sharedContractNotSharedGenerator)errors.push('shared-generator-policy');
  return Object.freeze({ok:errors.length===0,errors:Object.freeze(errors),metrics:portfolio.summary});
}
export const ASSESSMENT_V2_PRODUCTION_PORTFOLIO=buildAssessmentV2ProductionPortfolio();
export const ASSESSMENT_V2_PRODUCTION_PORTFOLIO_AUDIT=auditAssessmentV2ProductionPortfolio(ASSESSMENT_V2_PRODUCTION_PORTFOLIO);
