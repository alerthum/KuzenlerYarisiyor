import { COURSE_SCHEDULE_REGISTRY_2026_2027 } from '../curriculum/course-schedule-registry-2026-2027.js';
import { CURRICULUM_ROLLOUT_2026_2027 } from '../curriculum/curriculum-rollout-2026-2027.js';
import { GRADE_8_TURKISH_OUTCOMES_2019 } from '../curriculum/outcomes/tr-g8-turkce-2019.js';
import { GRADE8_MATH_OUTCOMES_2018 } from '../curriculum/outcomes/tr-g8-matematik-2018.js';
import { GRADE8_SCIENCE_OUTCOMES_2018 } from '../curriculum/outcomes/tr-g8-fen-2018.js';
import { GRADE5_TURKISH_OUTCOMES_TYMM_2024 } from '../curriculum/outcomes/tr-g5-turkce-tymm-2024.js';
import { GRADE8_HISTORY_OUTCOMES_2018 } from '../curriculum/outcomes/tr-g8-inkilap-2018.js';
import { GRADE8_DKAB_OUTCOMES_2018 } from '../curriculum/outcomes/tr-g8-dkab-2018.js';
import { GRADE8_ENGLISH_OUTCOMES_2018 } from '../curriculum/outcomes/tr-g8-ingilizce-2018.js';
import { GRADE8_TURKISH_FULL_SCOPE_AUDIT, GRADE8_TURKISH_FULL_SCOPE_MATRIX } from './turkish-g8-full-scope-matrix.js';
import { GRADE8_MATH_FULL_SCOPE_AUDIT, GRADE8_MATH_FULL_SCOPE_MATRIX } from './math-g8-full-scope-matrix.js';
import { GRADE8_SCIENCE_FULL_SCOPE_AUDIT, GRADE8_SCIENCE_FULL_SCOPE_MATRIX } from './science-g8-full-scope-matrix.js';
import { GRADE5_TURKISH_FULL_SCOPE_AUDIT, GRADE5_TURKISH_FULL_SCOPE_MATRIX } from './turkish-g5-full-scope-matrix.js';
import { buildGrade8TurkishPilot01Questions } from './turkish-g8-reading-pilot01.js';
import { buildGrade8TurkishPilot02CalibrationQuestions } from './turkish-g8-pilot02-calibration.js';
import { buildGrade8TurkishReadingLanguageWave1Questions } from './turkish-g8-reading-language-wave1.js';
import { buildGrade8TurkishVisualGrammarWave2Questions } from './turkish-g8-visual-grammar-wave2.js';
import { buildGrade8TurkishCompletionTasks } from './turkish-g8-completion-wave.js';
import { buildGrade8MathCrossPilotQuestions } from './math-g8-cross-pilot.js';
import { buildGrade8MathWave1Questions } from './math-g8-wave1.js';
import { buildGrade8MathCompletionQuestions } from './math-g8-completion-waves.js';
import { buildGrade8ScienceCrossPilotQuestions } from './science-g8-cross-pilot.js';
import { buildGrade8ScienceBroadWaveQuestions } from './science-g8-wave1-broad.js';
import { buildGrade8ScienceCompletionQuestions } from './science-g8-completion-wave.js';
import { buildGrade5TurkishCrossPilotQuestions } from './turkish-g5-cross-pilot.js';
import { buildGrade5TurkishBroadWaveQuestions } from './turkish-g5-broad-wave.js';
import { buildGrade5TurkishCompletionTasks } from './turkish-g5-completion-wave.js';
import { buildGrade8HistoryFullScopeTasks } from './history-g8-full-scope-engine.js';
import { buildGrade8DkabFullScopeTasks } from './dkab-g8-full-scope-engine.js';
import { buildGrade8EnglishFullScopeTasks } from './english-g8-full-scope-engine.js';
import { GRADE8_TURKISH_HUMAN_REVIEW_DECISIONS } from './turkish-g8-human-review-registry.js';
import { QUESTION_ARCHITECTURE_POLICY } from './question-architecture-policy.js';
import { ASSESSMENT_V2_GAME_ADAPTATION_LAB_AUDIT } from './game-adaptation-lab.js';

export const ASSESSMENT_V2_TARGET_STATEMENT='1–12. sınıf, tüm dersler ve ilgili merkezî sınavlar için müfredata bağlı ayrı ders motorları; doğrulanmış sorular oyunlara en son uyarlanır.';
const LEGACY_QUARANTINE_COUNT=604;
const frozenArray=rows=>Object.freeze(rows.map(row=>Object.freeze(row)));
const percent=(part,total)=>total>0?Number(((part/total)*100).toFixed(1)):null;

function engineRow(input){
  const approved=new Set(input.approvedQuestionIds||[]);
  const humanApprovedQuestionCount=input.items.filter(item=>approved.has(item.id)).length;
  return Object.freeze({
    id:input.id,grade:input.grade,courseId:input.courseId,courseName:input.courseName,programFamily:input.programFamily,
    curriculumStatus:'FULL_SCOPE_INGESTED',officialOutcomeCount:input.officialOutcomeCount,ingestedOutcomeCount:input.officialOutcomeCount,
    coveredOutcomeCount:input.coveredOutcomeCount,courseCoveragePercent:percent(input.coveredOutcomeCount,input.officialOutcomeCount),ingestionPercent:100,
    canonicalQuestionCount:input.items.length,humanApprovedQuestionCount,humanReviewQueueCount:input.items.length-humanApprovedQuestionCount,
    gameAdaptedQuestionCount:input.gameAdaptedQuestionCount||0,gameAdaptationAllowed:false,engineStatus:'ENGINEERING_SCOPE_COMPLETE',engineType:input.engineType,
    verifierType:input.verifierType,misconceptionCatalog:input.misconceptionCatalog,nextAction:input.nextAction,blockers:Object.freeze([...input.blockers])
  });
}

export function buildAssessmentV2ProductionPortfolio(){
  const grade8TurkishItems=[...buildGrade8TurkishPilot01Questions(),...buildGrade8TurkishPilot02CalibrationQuestions(),...buildGrade8TurkishReadingLanguageWave1Questions(),...buildGrade8TurkishVisualGrammarWave2Questions(),...buildGrade8TurkishCompletionTasks()];
  const grade8MathItems=[...buildGrade8MathCrossPilotQuestions(),...buildGrade8MathWave1Questions(),...buildGrade8MathCompletionQuestions()];
  const grade8ScienceItems=[...buildGrade8ScienceCrossPilotQuestions(),...buildGrade8ScienceBroadWaveQuestions(),...buildGrade8ScienceCompletionQuestions()];
  const grade5TurkishItems=[...buildGrade5TurkishCrossPilotQuestions(),...buildGrade5TurkishBroadWaveQuestions(),...buildGrade5TurkishCompletionTasks()];
  const grade8HistoryItems=[...buildGrade8HistoryFullScopeTasks()];
  const grade8DkabItems=[...buildGrade8DkabFullScopeTasks()];
  const grade8EnglishItems=[...buildGrade8EnglishFullScopeTasks()];
  const approvedTurkishIds=GRADE8_TURKISH_HUMAN_REVIEW_DECISIONS.map(row=>row.questionId);
  const engines=frozenArray([
    engineRow({id:'tr-g8-turkce-v2',grade:8,courseId:'turkce',courseName:'Türkçe',programFamily:'PRE_TYMM',officialOutcomeCount:GRADE_8_TURKISH_OUTCOMES_2019.length,coveredOutcomeCount:GRADE8_TURKISH_FULL_SCOPE_AUDIT.metrics.implementedOutcomeCount,items:grade8TurkishItems,approvedQuestionIds:approvedTurkishIds,gameAdaptedQuestionCount:5,engineType:'semantic-evidence + grammar + visual-reading + performance-rubric',verifierType:'independent semantic/constraint verification',misconceptionCatalog:'tr-g8-turkish-domain-misconceptions',nextAction:'96 Türkçe görevini alan ve yaş uygunluğu açısından insan kalibrasyonundan geçir.',blockers:['91 Türkçe görevi insan incelemesi bekliyor.','Dinleme/konuşma görevleri gerçek medya ve rubrik kalibrasyonu gerektiriyor.']}),
    engineRow({id:'tr-g8-matematik-v2',grade:8,courseId:'matematik',courseName:'Matematik',programFamily:'PRE_TYMM',officialOutcomeCount:GRADE8_MATH_OUTCOMES_2018.length,coveredOutcomeCount:GRADE8_MATH_FULL_SCOPE_AUDIT.metrics.implementedOutcomeCount,items:grade8MathItems,engineType:'symbolic/numeric/geometry solver-backed + interactive construction',verifierType:'independent alternate algorithm and invariant checks',misconceptionCatalog:'tr-g8-math-full-scope-misconceptions',nextAction:'52 Matematik görevini insan örneklemiyle kalibre et.',blockers:['52 Matematik görevinin insan gözle kalibrasyonu yapılmadı.','Etkileşimli çizim görevlerinin UI bileşenleri bağlanmadı.']}),
    engineRow({id:'tr-g8-fen-v2',grade:8,courseId:'fen-bilimleri',courseName:'Fen Bilimleri',programFamily:'PRE_TYMM',officialOutcomeCount:GRADE8_SCIENCE_OUTCOMES_2018.length,coveredOutcomeCount:GRADE8_SCIENCE_FULL_SCOPE_AUDIT.metrics.implementedOutcomeCount,items:grade8ScienceItems,engineType:'model/experiment/data reasoning + CER/design rubrics',verifierType:'evidence-constraint + scientific model verification',misconceptionCatalog:'tr-g8-science-full-scope-misconceptions',nextAction:'61 Fen görevini deney, model ve güvenlik açısından insan kalibrasyonundan geçir.',blockers:['61 Fen görevinin insan gözle kalibrasyonu yapılmadı.','Gerçek deney/medya bileşenleri bağlanmadı.']}),
    engineRow({id:'tr-g5-turkce-v2',grade:5,courseId:'turkce',courseName:'Türkçe',programFamily:'TYMM',officialOutcomeCount:GRADE5_TURKISH_OUTCOMES_TYMM_2024.length,coveredOutcomeCount:GRADE5_TURKISH_FULL_SCOPE_AUDIT.metrics.implementedOutcomeCount,items:grade5TurkishItems,engineType:'age-calibrated listening/reading evidence + speaking/writing rubrics',verifierType:'independent evidence intersection + rubric consistency',misconceptionCatalog:'tr-g5-turkish-full-scope-misconceptions',nextAction:'105 görevi 5. sınıf dil düzeyi ve performans rubrikleri açısından kalibre et.',blockers:['105 görevin insan kalibrasyonu tamamlanmadı.','Ses kayıtları ve üretici görev örnekleri hazırlanmadı.']}),
    engineRow({id:'tr-g8-inkilap-v2',grade:8,courseId:'t-c-inkilap-tarihi-ve-ataturkculuk',courseName:'T.C. İnkılap Tarihi ve Atatürkçülük',programFamily:'PRE_TYMM',officialOutcomeCount:GRADE8_HISTORY_OUTCOMES_2018.length,coveredOutcomeCount:33,items:grade8HistoryItems,engineType:'source criticism + chronology + causality + continuity/change',verifierType:'independent source/rubric constraint verification',misconceptionCatalog:'g8-history-source-reasoning-misconceptions-v1',nextAction:'33 tarihsel sorgulama görevine gerçek kaynak paketleri ve insan tarihçi incelemesi ekle.',blockers:['Kaynak paketleri ve telif/provenans doğrulaması bekliyor.','İnsan alan uzmanı kalibrasyonu yapılmadı.']}),
    engineRow({id:'tr-g8-dkab-v2',grade:8,courseId:'din-kulturu-ve-ahlak-bilgisi',courseName:'Din Kültürü ve Ahlak Bilgisi',programFamily:'PRE_TYMM',officialOutcomeCount:GRADE8_DKAB_OUTCOMES_2018.length,coveredOutcomeCount:28,items:grade8DkabItems,engineType:'curriculum-bound text evidence + concept/ethical reasoning',verifierType:'independent curriculum/evidence/rubric verification',misconceptionCatalog:'g8-dkab-curriculum-bound-misconceptions-v1',nextAction:'28 görevi tarafsız dil, metin bağlamı ve alan uzmanlığı açısından kalibre et.',blockers:['Ayet/hadis ve açıklama materyallerinin kaynak doğrulaması bekliyor.','İnsan alan uzmanı incelemesi yapılmadı.']}),
    engineRow({id:'tr-g8-ingilizce-v2',grade:8,courseId:'ingilizce',courseName:'İngilizce',programFamily:'PRE_TYMM',officialOutcomeCount:GRADE8_ENGLISH_OUTCOMES_2018.length,coveredOutcomeCount:70,items:grade8EnglishItems,engineType:'CEFR A2 listening/interaction/production/reading/writing tasks',verifierType:'independent CEFR task and rubric consistency',misconceptionCatalog:'g8-english-a2-communication-misconceptions-v1',nextAction:'70 A2 görevi için gerçek ses kayıtları, örnek cevaplar ve İngilizce öğretmeni kalibrasyonu ekle.',blockers:['15 dinleme görevi gerçek ses kaydı bekliyor.','Konuşma ve yazma rubriklerinin insan kalibrasyonu yapılmadı.']})
  ]);
  const questionCount=engines.reduce((s,r)=>s+r.canonicalQuestionCount,0);
  const approvedCount=engines.reduce((s,r)=>s+r.humanApprovedQuestionCount,0);
  const ingestedOutcomeCount=engines.reduce((s,r)=>s+r.ingestedOutcomeCount,0);
  const coveredOutcomeCount=engines.reduce((s,r)=>s+r.coveredOutcomeCount,0);
  const uniqueCourseCells=new Set(COURSE_SCHEDULE_REGISTRY_2026_2027.map(row=>`${row.grade}:${row.courseId}`));
  const activeGrades=new Set(engines.map(row=>row.grade));
  return Object.freeze({
    schemaVersion:'3.0',generatedAt:new Date().toISOString(),target:ASSESSMENT_V2_TARGET_STATEMENT,status:'LGS_CORE_ENGINEERING_SCOPE_COMPLETE',productReady:false,publicationAllowed:false,gameAdaptationAllowed:false,
    legacy:Object.freeze({count:LEGACY_QUARANTINE_COUNT,status:'UNVERIFIED_LEGACY'}),architecture:Object.freeze({policyVersion:QUESTION_ARCHITECTURE_POLICY.version,pipelineOrder:QUESTION_ARCHITECTURE_POLICY.pipelineOrder,sharedContractNotSharedGenerator:true,subjectSpecificEnginesRequired:true}),
    summary:Object.freeze({targetGradeCount:12,activeGradeCount:activeGrades.size,courseScheduleCellCount:uniqueCourseCells.size,activeEngineCellCount:engines.length,activeEngineCellPercent:percent(engines.length,uniqueCourseCells.size),curriculumOutcomeRecordCount:ingestedOutcomeCount,coveredOutcomeCount,canonicalQuestionCount:questionCount,humanApprovedQuestionCount:approvedCount,humanReviewQueueCount:questionCount-approvedCount,gameAdaptedQuestionCount:engines.reduce((s,r)=>s+r.gameAdaptedQuestionCount,0),legacyQuarantineCount:LEGACY_QUARANTINE_COUNT}),
    rollout:frozenArray(CURRICULUM_ROLLOUT_2026_2027.map(row=>({grade:row.grade,programFamily:row.programFamily,status:row.programVersionStatus}))),engines,
    pipeline:frozenArray([
      {id:'curriculum',label:'Resmî müfredat',status:'PASS_FOR_ACTIVE_ENGINES',note:'7 aktif motorun resmî kapsamı tam aktarıldı.'},
      {id:'subject-engine',label:'Derse özel motor',status:'PASS_FOR_ACTIVE_ENGINES',note:'Her ders kendi çözücü/rubrik ve yanılgı kataloğuyla çalışıyor.'},
      {id:'canonical-content',label:'Kanonik soru/görev',status:'ENGINEERING_SCOPE_COMPLETE',note:`${questionCount} kanonik mühendislik nesnesi mevcut.`},
      {id:'human-review',label:'İnsan kalibrasyonu',status:'BLOCKED',note:`${approvedCount} onaylı, ${questionCount-approvedCount} inceleme bekliyor.`},
      {id:'game-adaptation',label:'Oyun uyarlaması',status:'LAB_ONLY',note:'5 insan onaylı Türkçe sorusu tersine doğrulamalı laboratuvarda; genel açılış kilitli.'},
      {id:'student-pilot',label:'Öğrenci pilotu',status:'NOT_STARTED',note:'Madde analizi ve performans verisi ölçülmedi.'},
      {id:'publication',label:'Yayın',status:'LOCKED',note:'productReady=false.'}
    ]),
    nextMilestones:frozenArray([
      {order:1,id:'human-review-sampling',title:'7 motor için dengeli insan örneklemi',reason:'440 görevlik kuyruğu risk ve çeşitliliğe göre örneklemle kalibre et.'},
      {order:2,id:'media-and-rubrics',title:'Ses, kaynak, deney ve rubrik varlıkları',reason:'Dinleme, konuşma, tarih kaynağı ve deney görevlerinin gerçek materyalleri bağlanmalı.'},
      {order:3,id:'game-adaptation-lab',title:'Onaylı içerik için oyun adaptasyon laboratuvarı',reason:'Anlamı koruyan tersine doğrulamalı adaptasyon yalnız onaylı örneklerde başlatılmalı.'},
      {order:4,id:'expand-grade-map',title:'1–12 sınıf-ders hücrelerini genişlet',reason:'112 zorunlu hücrenin 7’si aktif.'}
    ])
  });
}

export function auditAssessmentV2ProductionPortfolio(portfolio=buildAssessmentV2ProductionPortfolio()){
  const errors=[];
  if(portfolio.summary.targetGradeCount!==12)errors.push('target-grade-count');
  if(portfolio.summary.courseScheduleCellCount!==112)errors.push(`course-cell-count:${portfolio.summary.courseScheduleCellCount}`);
  if(portfolio.engines.length!==7)errors.push(`engine-count:${portfolio.engines.length}`);
  if(new Set(portfolio.engines.map(r=>r.id)).size!==portfolio.engines.length)errors.push('duplicate-engine-id');
  if(portfolio.summary.canonicalQuestionCount!==445)errors.push(`question-count:${portfolio.summary.canonicalQuestionCount}`);
  if(portfolio.summary.curriculumOutcomeRecordCount!==420)errors.push(`outcome-record-count:${portfolio.summary.curriculumOutcomeRecordCount}`);
  if(portfolio.summary.coveredOutcomeCount!==420)errors.push(`covered-outcome-count:${portfolio.summary.coveredOutcomeCount}`);
  if(portfolio.summary.humanApprovedQuestionCount!==5)errors.push(`approved-count:${portfolio.summary.humanApprovedQuestionCount}`);
  if(portfolio.summary.humanReviewQueueCount!==440)errors.push(`review-queue:${portfolio.summary.humanReviewQueueCount}`);
  if(portfolio.productReady!==false||portfolio.publicationAllowed!==false)errors.push('product-ready-leak');
  if(portfolio.gameAdaptationAllowed!==false||portfolio.summary.gameAdaptedQuestionCount!==5||!ASSESSMENT_V2_GAME_ADAPTATION_LAB_AUDIT.ok)errors.push('game-adaptation-lab-or-global-lock');
  if(portfolio.legacy.count!==604||portfolio.legacy.status!=='UNVERIFIED_LEGACY')errors.push('legacy-policy');
  if(portfolio.rollout.length!==12)errors.push(`rollout-count:${portfolio.rollout.length}`);
  if(!portfolio.engines.every(r=>r.gameAdaptationAllowed===false&&r.coveredOutcomeCount===r.officialOutcomeCount))errors.push('engine-scope-or-game-lock');
  if(portfolio.engines.filter(r=>r.gameAdaptedQuestionCount>0).length!==1||portfolio.engines.find(r=>r.gameAdaptedQuestionCount>0)?.courseId!=='turkce')errors.push('adaptation-lab-scope');
  if(!portfolio.architecture.sharedContractNotSharedGenerator)errors.push('shared-generator-policy');
  return Object.freeze({ok:errors.length===0,errors:Object.freeze(errors),metrics:portfolio.summary});
}
export const ASSESSMENT_V2_PRODUCTION_PORTFOLIO=buildAssessmentV2ProductionPortfolio();
export const ASSESSMENT_V2_PRODUCTION_PORTFOLIO_AUDIT=auditAssessmentV2ProductionPortfolio(ASSESSMENT_V2_PRODUCTION_PORTFOLIO);
