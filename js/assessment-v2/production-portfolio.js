import { COURSE_SCHEDULE_REGISTRY_2026_2027 } from '../curriculum/course-schedule-registry-2026-2027.js';
import { CURRICULUM_ROLLOUT_2026_2027 } from '../curriculum/curriculum-rollout-2026-2027.js';
import { GRADE_8_TURKISH_OUTCOMES_2019 } from '../curriculum/outcomes/tr-g8-turkce-2019.js';
import { GRADE8_MATH_OUTCOMES_2018 } from '../curriculum/outcomes/tr-g8-matematik-2018.js';
import { GRADE8_SCIENCE_OUTCOMES_2018 } from '../curriculum/outcomes/tr-g8-fen-2018.js';
import { GRADE5_TURKISH_OUTCOMES_TYMM_2024 } from '../curriculum/outcomes/tr-g5-turkce-tymm-2024.js';
import { GRADE8_HISTORY_OUTCOMES_2018 } from '../curriculum/outcomes/tr-g8-inkilap-2018.js';
import { GRADE8_DKAB_OUTCOMES_2018 } from '../curriculum/outcomes/tr-g8-dkab-2018.js';
import { GRADE8_ENGLISH_OUTCOMES_2018 } from '../curriculum/outcomes/tr-g8-ingilizce-2018.js';
import { GRADE5_MATH_OUTCOMES_TYMM_2024 } from '../curriculum/outcomes/tr-g5-matematik-tymm-2024.js';
import { GRADE5_SCIENCE_OUTCOMES_TYMM_2024 } from '../curriculum/outcomes/tr-g5-fen-tymm-2024.js';
import { GRADE5_SOCIAL_OUTCOMES_TYMM_2024 } from '../curriculum/outcomes/tr-g5-sosyal-tymm-2024.js';
import { GRADE5_DKAB_OUTCOMES_TYMM_2024 } from '../curriculum/outcomes/tr-g5-dkab-tymm-2024.js';
import { GRADE5_ENGLISH_OUTCOMES_TYMM_2025 } from '../curriculum/outcomes/tr-g5-ingilizce-tymm-2025.js';
import { GRADE8_TURKISH_FULL_SCOPE_AUDIT } from './turkish-g8-full-scope-matrix.js';
import { GRADE8_MATH_FULL_SCOPE_AUDIT } from './math-g8-full-scope-matrix.js';
import { GRADE8_SCIENCE_FULL_SCOPE_AUDIT } from './science-g8-full-scope-matrix.js';
import { GRADE5_TURKISH_FULL_SCOPE_AUDIT } from './turkish-g5-full-scope-matrix.js';
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
import {
  buildGrade5MathFullScopeTasks,
  buildGrade5ScienceFullScopeTasks,
  buildGrade5SocialFullScopeTasks,
  buildGrade5DkabFullScopeTasks,
  buildGrade5EnglishFullScopeTasks,
  GRADE5_MATH_FULL_SCOPE_AUDIT,
  GRADE5_SCIENCE_FULL_SCOPE_AUDIT,
  GRADE5_SOCIAL_FULL_SCOPE_AUDIT,
  GRADE5_DKAB_FULL_SCOPE_AUDIT,
  GRADE5_ENGLISH_FULL_SCOPE_AUDIT
} from './grade5-core-full-scope-engines.js';
import { GRADE8_TURKISH_HUMAN_REVIEW_DECISIONS } from './turkish-g8-human-review-registry.js';
import { QUESTION_ARCHITECTURE_POLICY } from './question-architecture-policy.js';
import { ASSESSMENT_V2_GAME_ADAPTATION_LAB_AUDIT } from './game-adaptation-lab.js';
import { MIDDLE_SCHOOL_TYMM_ENGINE_RECORDS } from './middle-school-tymm-core-engines.js';
import { PRIMARY_BRIDGE_ENGINE_RECORDS } from './primary-bridge-core-engines.js';
import { PRIMARY_TYMM_ACADEMIC_ENGINE_RECORDS } from './primary-tymm-academic-core-engines.js';
import { PRIMARY_TYMM_VISUAL_ARTS_ENGINE_RECORDS } from './primary-tymm-visual-arts-engines.js';
import { PRIMARY_TYMM_MUSIC_ENGINE_RECORDS } from './primary-tymm-music-engines.js';
import { MIDDLE_SCHOOL_TYMM_VISUAL_ARTS_ENGINE_RECORDS } from './middle-school-tymm-visual-arts-engines.js';
import { MIDDLE_SCHOOL_TYMM_MUSIC_ENGINE_RECORDS } from './middle-school-tymm-music-engines.js';
import { MIDDLE_SCHOOL_TYMM_COMPUTING_ENGINE_RECORDS } from './middle-school-tymm-computing-engines.js';

export const ASSESSMENT_V2_TARGET_STATEMENT='1–12. sınıf, tüm dersler ve ilgili merkezî sınavlar için müfredata bağlı ayrı ders motorları; doğrulanmış sorular oyunlara en son uyarlanır.';
const LEGACY_QUARANTINE_COUNT=604;
const frozenArray=rows=>Object.freeze(rows.map(row=>Object.freeze(row)));
const percent=(part,total)=>total>0?Number(((part/total)*100).toFixed(1)):null;

function engineRow(input){
  const approved=new Set(input.approvedQuestionIds||[]);
  const humanApprovedQuestionCount=input.items.filter(item=>approved.has(item.id)).length;
  return Object.freeze({
    id:input.id,grade:input.grade,courseId:input.courseId,scheduleCourseId:input.scheduleCourseId||input.courseId,courseName:input.courseName,programFamily:input.programFamily,
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
  const grade5MathItems=[...buildGrade5MathFullScopeTasks()];
  const grade5ScienceItems=[...buildGrade5ScienceFullScopeTasks()];
  const grade5SocialItems=[...buildGrade5SocialFullScopeTasks()];
  const grade5DkabItems=[...buildGrade5DkabFullScopeTasks()];
  const grade5EnglishItems=[...buildGrade5EnglishFullScopeTasks()];
  const approvedTurkishIds=GRADE8_TURKISH_HUMAN_REVIEW_DECISIONS.map(row=>row.questionId);
  const middleSchoolCourseMeta=Object.freeze({
    turkce:{courseName:'Türkçe',engineType:'age-calibrated receptive/productive language engine',verifierType:'independent evidence and rubric consistency',misconceptionCatalog:'middle-school-turkish-misconceptions-v1'},
    matematik:{courseName:'Matematik',engineType:'mathematical reasoning, modelling and construction engine',verifierType:'independent alternate representation and rubric verification',misconceptionCatalog:'middle-school-math-misconceptions-v1'},
    'fen-bilimleri':{courseName:'Fen Bilimleri',engineType:'scientific inquiry, experiment and model engine',verifierType:'independent evidence and model verification',misconceptionCatalog:'middle-school-science-misconceptions-v1'},
    'sosyal-bilgiler':{courseName:'Sosyal Bilgiler',engineType:'map, source and civic inquiry engine',verifierType:'independent source and rubric verification',misconceptionCatalog:'middle-school-social-misconceptions-v1'},
    'din-kulturu-ve-ahlak-bilgisi':{courseName:'Din Kültürü ve Ahlak Bilgisi',engineType:'neutral curriculum-bound concept and ethical reasoning engine',verifierType:'independent evidence and rubric verification',misconceptionCatalog:'middle-school-dkab-misconceptions-v1'},
    'yabanci-dil':{courseName:'İngilizce',engineType:'CEFR communicative language skill engine',verifierType:'independent communicative task and rubric verification',misconceptionCatalog:'middle-school-english-misconceptions-v1'}
  });
  const middleSchoolRows=MIDDLE_SCHOOL_TYMM_ENGINE_RECORDS.map(record=>{
    const meta=middleSchoolCourseMeta[record.courseId];
    return engineRow({id:`tr-g${record.grade}-${record.courseId}-v2`,grade:record.grade,courseId:record.courseId,courseName:meta.courseName,programFamily:'TYMM',officialOutcomeCount:record.officialOutcomeCount,coveredOutcomeCount:record.audit.metrics.implementedOutcomeCount,items:record.items,engineType:meta.engineType,verifierType:meta.verifierType,misconceptionCatalog:`g${record.grade}-${meta.misconceptionCatalog}`,nextAction:`${record.items.length} görevi alan uzmanı ve yaş uygunluğu açısından kalibre et.`,blockers:[`${record.items.length} görev insan incelemesi bekliyor.`,'Gerçek ses, harita, deney veya performans varlıkları gereken görevler tamamlanmadı.']});
  });
  const primaryCourseMeta=Object.freeze({
    'fen-bilimleri':{courseName:'Fen Bilimleri',engineType:'primary observation, safe experiment and model engine',verifierType:'independent observation/evidence and rubric verification',misconceptionCatalog:'primary-science-misconceptions-v1'},
    'din-kulturu-ve-ahlak-bilgisi':{courseName:'Din Kültürü ve Ahlak Bilgisi',engineType:'neutral primary curriculum-bound concept and ethical reasoning engine',verifierType:'independent evidence and rubric verification',misconceptionCatalog:'primary-dkab-misconceptions-v1'},
    'yabanci-dil':{courseName:'İngilizce',engineType:'primary communicative language and multimodal performance engine',verifierType:'independent communication goal and rubric verification',misconceptionCatalog:'primary-english-misconceptions-v1'}
  });
  const primaryBridgeRows=PRIMARY_BRIDGE_ENGINE_RECORDS.map(record=>{const meta=primaryCourseMeta[record.courseId];return engineRow({id:`tr-g${record.grade}-${record.courseId}-primary-bridge-v2`,grade:record.grade,courseId:record.courseId,courseName:meta.courseName,programFamily:record.grade===4?'PRE_TYMM':'TYMM',officialOutcomeCount:record.officialOutcomeCount,coveredOutcomeCount:record.audit.metrics.implementedOutcomeCount,items:record.items,engineType:meta.engineType,verifierType:meta.verifierType,misconceptionCatalog:`g${record.grade}-${meta.misconceptionCatalog}`,nextAction:`${record.items.length} görevi sınıf öğretmeni/alan uzmanı, yaş uygunluğu ve gerçek medya açısından kalibre et.`,blockers:[`${record.items.length} görev insan incelemesi bekliyor.`,'Ses, görsel, deney veya kültürel varlık gereken görevlerin gerçek materyalleri tamamlanmadı.']});});
  const primaryTymmCourseMeta=Object.freeze({
    turkce:{courseName:'Türkçe',engineType:'primary multimodal language, literacy and performance engine',verifierType:'independent evidence/rubric and age-appropriateness verification',misconceptionCatalog:'primary-tymm-turkish-misconceptions-v1'},
    matematik:{courseName:'Matematik',engineType:'primary mathematical reasoning, representation and construction engine',verifierType:'independent representation, invariant and rubric verification',misconceptionCatalog:'primary-tymm-math-misconceptions-v1'},
    'hayat-bilgisi':{courseName:'Hayat Bilgisi',engineType:'primary life-skills, observation and safe-decision engine',verifierType:'independent evidence, safety and rubric verification',misconceptionCatalog:'primary-tymm-life-science-misconceptions-v1'},
    'beden-egitimi-ve-oyun':{courseName:'Beden Eğitimi ve Oyun',engineType:'primary movement, fair-play and safe-performance engine',verifierType:'independent safety, movement-goal and rubric verification',misconceptionCatalog:'primary-tymm-body-play-misconceptions-v1'}
  });
  const primaryTymmRows=PRIMARY_TYMM_ACADEMIC_ENGINE_RECORDS.map(record=>{const meta=primaryTymmCourseMeta[record.courseId];return engineRow({id:`tr-g${record.grade}-${record.courseId}-tymm-v2`,grade:record.grade,courseId:record.courseId,courseName:meta.courseName,programFamily:'TYMM',officialOutcomeCount:record.officialOutcomeCount,coveredOutcomeCount:record.audit.metrics.implementedOutcomeCount,items:record.items,engineType:meta.engineType,verifierType:meta.verifierType,misconceptionCatalog:`g${record.grade}-${meta.misconceptionCatalog}`,nextAction:`${record.items.length} görevi sınıf öğretmeni/alan uzmanı, yaş uygunluğu ve gerçek materyal açısından kalibre et.`,blockers:[`${record.items.length} görev insan incelemesi bekliyor.`,'Ses, görsel, somut materyal, hareket güvenliği veya performans rubriği gereken görevlerin gerçek varlıkları tamamlanmadı.']});});
  const primaryVisualArtsRows=PRIMARY_TYMM_VISUAL_ARTS_ENGINE_RECORDS.map(record=>engineRow({id:`tr-g${record.grade}-gorsel-sanatlar-tymm-v2`,grade:record.grade,courseId:'gorsel-sanatlar',courseName:'Görsel Sanatlar',programFamily:'TYMM',officialOutcomeCount:record.officialOutcomeCount,coveredOutcomeCount:record.audit.metrics.implementedOutcomeCount,items:record.items,engineType:'primary visual analysis, artistic production and portfolio engine',verifierType:'independent visible-evidence, portfolio and rubric verification',misconceptionCatalog:`g${record.grade}-visual-arts-misconceptions-v1`,nextAction:`${record.items.length} görevi görsel sanatlar öğretmeni, yaş uygunluğu, malzeme güvenliği ve gerçek eser/öğrenci ürünü açısından kalibre et.`,blockers:[`${record.items.length} görev insan incelemesi bekliyor.`,'Gerçek sanat eseri, müze görseli, öğrenci ürünü ve portfolyo rubriği varlıkları tamamlanmadı.']}));
  const primaryMusicRows=PRIMARY_TYMM_MUSIC_ENGINE_RECORDS.map(record=>engineRow({id:`tr-g${record.grade}-muzik-tymm-v2`,grade:record.grade,courseId:'muzik',courseName:'Müzik',programFamily:'TYMM',officialOutcomeCount:record.officialOutcomeCount,coveredOutcomeCount:record.audit.metrics.implementedOutcomeCount,items:record.items,engineType:'primary listening, singing, rhythm and movement performance engine',verifierType:'independent audio evidence, performance and rubric verification',misconceptionCatalog:`g${record.grade}-music-misconceptions-v1`,nextAction:`${record.items.length} görevi müzik öğretmeni, yaş uygunluğu, ses güvenliği ve gerçek ses kaydı açısından kalibre et.`,blockers:[`${record.items.length} görev insan incelemesi bekliyor.`,'Lisanslı veya insan kayıtlı müzik/ses varlıkları ve performans rubrikleri tamamlanmadı.']}));
  const middleVisualArtsRows=MIDDLE_SCHOOL_TYMM_VISUAL_ARTS_ENGINE_RECORDS.map(record=>engineRow({id:`tr-g${record.grade}-gorsel-sanatlar-tymm-v2`,grade:record.grade,courseId:'gorsel-sanatlar',courseName:'Görsel Sanatlar',programFamily:'TYMM',officialOutcomeCount:record.officialOutcomeCount,coveredOutcomeCount:record.audit.metrics.implementedOutcomeCount,items:record.items,engineType:'middle-school visual analysis, artistic production and portfolio engine',verifierType:'independent visible-evidence, portfolio and rubric verification',misconceptionCatalog:`g${record.grade}-visual-arts-misconceptions-v1`,nextAction:`${record.items.length} görevi görsel sanatlar öğretmeni, yaş uygunluğu, malzeme güvenliği ve gerçek eser/öğrenci ürünü açısından kalibre et.`,blockers:[`${record.items.length} görev insan incelemesi bekliyor.`,'Gerçek sanat eseri, müze görseli, öğrenci ürünü ve portfolyo rubriği varlıkları tamamlanmadı.']}));
  const middleMusicRows=MIDDLE_SCHOOL_TYMM_MUSIC_ENGINE_RECORDS.map(record=>engineRow({id:`tr-g${record.grade}-muzik-tymm-v2`,grade:record.grade,courseId:'muzik',courseName:'Müzik',programFamily:'TYMM',officialOutcomeCount:record.officialOutcomeCount,coveredOutcomeCount:record.audit.metrics.implementedOutcomeCount,items:record.items,engineType:'middle-school listening, singing, music literacy and movement performance engine',verifierType:'independent audio evidence, performance and rubric verification',misconceptionCatalog:`g${record.grade}-music-misconceptions-v1`,nextAction:`${record.items.length} görevi müzik öğretmeni, ses sağlığı, müzik yazısı ve gerçek ses kaydı açısından kalibre et.`,blockers:[`${record.items.length} görev insan incelemesi bekliyor.`,'Lisanslı/insan kayıtlı ses, nota görseli ve performans rubriği varlıkları tamamlanmadı.']}));
  const middleComputingRows=MIDDLE_SCHOOL_TYMM_COMPUTING_ENGINE_RECORDS.map(record=>engineRow({id:`tr-g${record.grade}-bilisim-teknolojileri-ve-yazilim-tymm-v2`,grade:record.grade,courseId:'bilisim-teknolojileri-ve-yazilim',courseName:'Bilişim Teknolojileri ve Yazılım',programFamily:'TYMM',officialOutcomeCount:record.officialOutcomeCount,coveredOutcomeCount:record.audit.metrics.implementedOutcomeCount,items:record.items,engineType:'digital literacy, safe product design, AI literacy and computational thinking engine',verifierType:'independent safe-sandbox, product, algorithm and rubric verification',misconceptionCatalog:`g${record.grade}-computing-misconceptions-v1`,nextAction:`${record.items.length} görevi bilişim öğretmeni, siber güvenlik, veri koruma ve gerçek okul yönetimli araçlar açısından kalibre et.`,blockers:[`${record.items.length} görev insan incelemesi bekliyor.`,'Güvenli çevrim dışı/okul yönetimli dijital sandbox, erişilebilir ürün örnekleri ve öğretmen rubrikleri tamamlanmadı.']}));
  const engines=frozenArray([
    engineRow({id:'tr-g8-turkce-v2',grade:8,courseId:'turkce',courseName:'Türkçe',programFamily:'PRE_TYMM',officialOutcomeCount:GRADE_8_TURKISH_OUTCOMES_2019.length,coveredOutcomeCount:GRADE8_TURKISH_FULL_SCOPE_AUDIT.metrics.implementedOutcomeCount,items:grade8TurkishItems,approvedQuestionIds:approvedTurkishIds,gameAdaptedQuestionCount:5,engineType:'semantic-evidence + grammar + visual-reading + performance-rubric',verifierType:'independent semantic/constraint verification',misconceptionCatalog:'tr-g8-turkish-domain-misconceptions',nextAction:'96 Türkçe görevini alan ve yaş uygunluğu açısından insan kalibrasyonundan geçir.',blockers:['91 Türkçe görevi insan incelemesi bekliyor.','Dinleme/konuşma görevleri gerçek medya ve rubrik kalibrasyonu gerektiriyor.']}),
    engineRow({id:'tr-g8-matematik-v2',grade:8,courseId:'matematik',courseName:'Matematik',programFamily:'PRE_TYMM',officialOutcomeCount:GRADE8_MATH_OUTCOMES_2018.length,coveredOutcomeCount:GRADE8_MATH_FULL_SCOPE_AUDIT.metrics.implementedOutcomeCount,items:grade8MathItems,engineType:'symbolic/numeric/geometry solver-backed + interactive construction',verifierType:'independent alternate algorithm and invariant checks',misconceptionCatalog:'tr-g8-math-full-scope-misconceptions',nextAction:'52 Matematik görevini insan örneklemiyle kalibre et.',blockers:['52 Matematik görevinin insan gözle kalibrasyonu yapılmadı.','Etkileşimli çizim görevlerinin UI bileşenleri bağlanmadı.']}),
    engineRow({id:'tr-g8-fen-v2',grade:8,courseId:'fen-bilimleri',courseName:'Fen Bilimleri',programFamily:'PRE_TYMM',officialOutcomeCount:GRADE8_SCIENCE_OUTCOMES_2018.length,coveredOutcomeCount:GRADE8_SCIENCE_FULL_SCOPE_AUDIT.metrics.implementedOutcomeCount,items:grade8ScienceItems,engineType:'model/experiment/data reasoning + CER/design rubrics',verifierType:'evidence-constraint + scientific model verification',misconceptionCatalog:'tr-g8-science-full-scope-misconceptions',nextAction:'61 Fen görevini deney, model ve güvenlik açısından insan kalibrasyonundan geçir.',blockers:['61 Fen görevinin insan gözle kalibrasyonu yapılmadı.','Gerçek deney/medya bileşenleri bağlanmadı.']}),
    engineRow({id:'tr-g5-turkce-v2',grade:5,courseId:'turkce',courseName:'Türkçe',programFamily:'TYMM',officialOutcomeCount:GRADE5_TURKISH_OUTCOMES_TYMM_2024.length,coveredOutcomeCount:GRADE5_TURKISH_FULL_SCOPE_AUDIT.metrics.implementedOutcomeCount,items:grade5TurkishItems,engineType:'age-calibrated listening/reading evidence + speaking/writing rubrics',verifierType:'independent evidence intersection + rubric consistency',misconceptionCatalog:'tr-g5-turkish-full-scope-misconceptions',nextAction:'105 görevi 5. sınıf dil düzeyi ve performans rubrikleri açısından kalibre et.',blockers:['105 görevin insan kalibrasyonu tamamlanmadı.','Ses kayıtları ve üretici görev örnekleri hazırlanmadı.']}),
    engineRow({id:'tr-g8-inkilap-v2',grade:8,courseId:'t-c-inkilap-tarihi-ve-ataturkculuk',courseName:'T.C. İnkılap Tarihi ve Atatürkçülük',programFamily:'PRE_TYMM',officialOutcomeCount:GRADE8_HISTORY_OUTCOMES_2018.length,coveredOutcomeCount:33,items:grade8HistoryItems,engineType:'source criticism + chronology + causality + continuity/change',verifierType:'independent source/rubric constraint verification',misconceptionCatalog:'g8-history-source-reasoning-misconceptions-v1',nextAction:'33 tarihsel sorgulama görevine gerçek kaynak paketleri ve insan tarihçi incelemesi ekle.',blockers:['Kaynak paketleri ve telif/provenans doğrulaması bekliyor.','İnsan alan uzmanı kalibrasyonu yapılmadı.']}),
    engineRow({id:'tr-g8-dkab-v2',grade:8,courseId:'din-kulturu-ve-ahlak-bilgisi',courseName:'Din Kültürü ve Ahlak Bilgisi',programFamily:'PRE_TYMM',officialOutcomeCount:GRADE8_DKAB_OUTCOMES_2018.length,coveredOutcomeCount:28,items:grade8DkabItems,engineType:'curriculum-bound text evidence + concept/ethical reasoning',verifierType:'independent curriculum/evidence/rubric verification',misconceptionCatalog:'g8-dkab-curriculum-bound-misconceptions-v1',nextAction:'28 görevi tarafsız dil, metin bağlamı ve alan uzmanlığı açısından kalibre et.',blockers:['Ayet/hadis ve açıklama materyallerinin kaynak doğrulaması bekliyor.','İnsan alan uzmanı incelemesi yapılmadı.']}),
    engineRow({id:'tr-g8-ingilizce-v2',grade:8,courseId:'ingilizce',scheduleCourseId:'yabanci-dil',courseName:'İngilizce',programFamily:'PRE_TYMM',officialOutcomeCount:GRADE8_ENGLISH_OUTCOMES_2018.length,coveredOutcomeCount:70,items:grade8EnglishItems,engineType:'CEFR A2 listening/interaction/production/reading/writing tasks',verifierType:'independent CEFR task and rubric consistency',misconceptionCatalog:'g8-english-a2-communication-misconceptions-v1',nextAction:'70 A2 görevi için gerçek ses kayıtları, örnek cevaplar ve İngilizce öğretmeni kalibrasyonu ekle.',blockers:['15 dinleme görevi gerçek ses kaydı bekliyor.','Konuşma ve yazma rubriklerinin insan kalibrasyonu yapılmadı.']}),
    engineRow({id:'tr-g5-matematik-v2',grade:5,courseId:'matematik',courseName:'Matematik',programFamily:'TYMM',officialOutcomeCount:GRADE5_MATH_OUTCOMES_TYMM_2024.length,coveredOutcomeCount:GRADE5_MATH_FULL_SCOPE_AUDIT.metrics.implementedOutcomeCount,items:grade5MathItems,engineType:'age-calibrated mathematical investigation + independent verification',verifierType:'rubric criteria plus alternate representation/control check',misconceptionCatalog:'g5-math-misconceptions-v1',nextAction:'23 Matematik görevini yaş uygunluğu ve gerçek problem bağlamları açısından kalibre et.',blockers:['23 görev insan incelemesi bekliyor.','Etkileşimli matematik araçları bağlanmadı.']}),
    engineRow({id:'tr-g5-fen-v2',grade:5,courseId:'fen-bilimleri',courseName:'Fen Bilimleri',programFamily:'TYMM',officialOutcomeCount:GRADE5_SCIENCE_OUTCOMES_TYMM_2024.length,coveredOutcomeCount:GRADE5_SCIENCE_FULL_SCOPE_AUDIT.metrics.implementedOutcomeCount,items:grade5ScienceItems,engineType:'grade5 observation/experiment/model/evidence engine',verifierType:'independent evidence and rubric consistency',misconceptionCatalog:'g5-science-inquiry-misconceptions-v1',nextAction:'28 Fen görevini güvenlik, deney ve model açısından insan kalibrasyonundan geçir.',blockers:['Deney ve model görevleri gerçek bileşen bekliyor.','28 görev insan incelemesi bekliyor.']}),
    engineRow({id:'tr-g5-sosyal-v2',grade:5,courseId:'sosyal-bilgiler',courseName:'Sosyal Bilgiler',programFamily:'TYMM',officialOutcomeCount:GRADE5_SOCIAL_OUTCOMES_TYMM_2024.length,coveredOutcomeCount:GRADE5_SOCIAL_FULL_SCOPE_AUDIT.metrics.implementedOutcomeCount,items:grade5SocialItems,engineType:'map/source/civic project social inquiry engine',verifierType:'independent source and rubric constraint verification',misconceptionCatalog:'g5-social-evidence-misconceptions-v1',nextAction:'19 Sosyal Bilgiler görevine gerçek harita ve kaynak paketleri bağla.',blockers:['Harita ve kaynak varlıkları tamamlanmadı.','19 görev insan incelemesi bekliyor.']}),
    engineRow({id:'tr-g5-dkab-v2',grade:5,courseId:'din-kulturu-ve-ahlak-bilgisi',courseName:'Din Kültürü ve Ahlak Bilgisi',programFamily:'TYMM',officialOutcomeCount:GRADE5_DKAB_OUTCOMES_TYMM_2024.length,coveredOutcomeCount:GRADE5_DKAB_FULL_SCOPE_AUDIT.metrics.implementedOutcomeCount,items:grade5DkabItems,engineType:'neutral curriculum-bound text/concept/ethical reasoning engine',verifierType:'independent evidence and rubric verification',misconceptionCatalog:'g5-dkab-curriculum-misconceptions-v1',nextAction:'18 görevi tarafsız dil, kaynak ve yaş uygunluğu açısından kalibre et.',blockers:['Kültürel görsellerin provenansı bekliyor.','18 görev insan incelemesi bekliyor.']}),
    engineRow({id:'tr-g5-ingilizce-v2',grade:5,courseId:'yabanci-dil',scheduleCourseId:'yabanci-dil',courseName:'İngilizce',programFamily:'TYMM',officialOutcomeCount:GRADE5_ENGLISH_OUTCOMES_TYMM_2025.length,coveredOutcomeCount:GRADE5_ENGLISH_FULL_SCOPE_AUDIT.metrics.implementedOutcomeCount,items:grade5EnglishItems,engineType:'CEFR A2.1 communicative listening/pronunciation/reading/speaking/writing engine',verifierType:'independent A2.1 task and rubric consistency',misconceptionCatalog:'g5-english-a2-1-misconceptions-v1',nextAction:'184 İngilizce görevi için gerçek ses, konuşma örnekleri ve öğretmen kalibrasyonu ekle.',blockers:['Dinleme ve konuşma görevleri gerçek ses varlığı bekliyor.','184 görev insan incelemesi bekliyor.']}),
    ...middleSchoolRows,
    ...primaryBridgeRows,
    ...primaryTymmRows,
    ...primaryVisualArtsRows,
    ...primaryMusicRows,
    ...middleVisualArtsRows,
    ...middleMusicRows,
    ...middleComputingRows
  ]);
  const questionCount=engines.reduce((s,r)=>s+r.canonicalQuestionCount,0);
  const approvedCount=engines.reduce((s,r)=>s+r.humanApprovedQuestionCount,0);
  const ingestedOutcomeCount=engines.reduce((s,r)=>s+r.ingestedOutcomeCount,0);
  const coveredOutcomeCount=engines.reduce((s,r)=>s+r.coveredOutcomeCount,0);
  const scheduleCellKeys=new Set(COURSE_SCHEDULE_REGISTRY_2026_2027.map(row=>`${row.grade}:${row.courseId}`));
  const activeCellKeys=new Set(engines.map(row=>`${row.grade}:${row.scheduleCourseId}`));
  const unmatchedActiveCells=[...activeCellKeys].filter(key=>!scheduleCellKeys.has(key));
  const activeGrades=new Set(engines.map(row=>row.grade));
  return Object.freeze({
    schemaVersion:'3.5',generatedAt:new Date().toISOString(),target:ASSESSMENT_V2_TARGET_STATEMENT,status:'PRIMARY_ACADEMIC_CORE_AND_GRADES5_8_ENGINEERING_SCOPE_COMPLETE',productReady:false,publicationAllowed:false,gameAdaptationAllowed:false,
    legacy:Object.freeze({count:LEGACY_QUARANTINE_COUNT,status:'UNVERIFIED_LEGACY'}),architecture:Object.freeze({policyVersion:QUESTION_ARCHITECTURE_POLICY.version,pipelineOrder:QUESTION_ARCHITECTURE_POLICY.pipelineOrder,sharedContractNotSharedGenerator:true,subjectSpecificEnginesRequired:true}),
    summary:Object.freeze({targetGradeCount:12,activeGradeCount:activeGrades.size,courseScheduleCellCount:scheduleCellKeys.size,activeEngineCellCount:activeCellKeys.size,activeEngineCellPercent:percent(activeCellKeys.size,scheduleCellKeys.size),curriculumOutcomeRecordCount:ingestedOutcomeCount,coveredOutcomeCount,canonicalQuestionCount:questionCount,humanApprovedQuestionCount:approvedCount,humanReviewQueueCount:questionCount-approvedCount,gameAdaptedQuestionCount:engines.reduce((s,r)=>s+r.gameAdaptedQuestionCount,0),legacyQuarantineCount:LEGACY_QUARANTINE_COUNT,unmatchedActiveCourseCellCount:unmatchedActiveCells.length}),
    rollout:frozenArray(CURRICULUM_ROLLOUT_2026_2027.map(row=>({grade:row.grade,programFamily:row.programFamily,status:row.programVersionStatus}))),engines,
    pipeline:frozenArray([
      {id:'curriculum',label:'Resmî müfredat',status:'PASS_FOR_ACTIVE_ENGINES',note:`${engines.length} aktif motorun resmî kapsamı tam aktarıldı.`},
      {id:'subject-engine',label:'Derse özel motor',status:'PASS_FOR_ACTIVE_ENGINES',note:'Her ders kendi çözücü/rubrik ve yanılgı kataloğuyla çalışıyor.'},
      {id:'canonical-content',label:'Kanonik soru/görev',status:'ENGINEERING_SCOPE_COMPLETE',note:`${questionCount} kanonik mühendislik nesnesi mevcut.`},
      {id:'human-review',label:'İnsan kalibrasyonu',status:'BLOCKED',note:`${approvedCount} onaylı, ${questionCount-approvedCount} inceleme bekliyor.`},
      {id:'game-adaptation',label:'Oyun uyarlaması',status:'LAB_ONLY',note:'5 insan onaylı Türkçe sorusu tersine doğrulamalı laboratuvarda; genel açılış kilitli.'},
      {id:'student-pilot',label:'Öğrenci pilotu',status:'NOT_STARTED',note:'Gerçek öğrenci madde analizi ölçülmedi.'},
      {id:'publication',label:'Yayın',status:'LOCKED',note:'productReady=false.'}
    ]),
    nextMilestones:frozenArray([
      {order:1,id:'grades5-7-core-review',title:'5–7. sınıf çekirdek motor kalibrasyonu',reason:'Yeni görevler risk tabakalı insan örneklemiyle doğrulanmalı.'},
      {order:2,id:'media-and-rubrics',title:'Ses, harita, deney ve rubrik varlıkları',reason:'Dil, Sosyal ve Fen performans görevlerinin gerçek materyalleri bağlanmalı.'},
      {order:3,id:'expand-primary-and-highschool',title:'İlkokul ve lise hücrelerini aç',reason:'5–8 çekirdekten sonra 1–4 ve 9–12 motorları tamamlanmalı.'},
      {order:4,id:'expand-grade-map',title:'1–12 sınıf-ders hücrelerini genişlet',reason:`112 zorunlu hücrenin ${activeCellKeys.size}’si aktif.`}
    ])
  });
}

export function auditAssessmentV2ProductionPortfolio(portfolio=buildAssessmentV2ProductionPortfolio()){
  const errors=[];
  if(portfolio.summary.targetGradeCount!==12)errors.push('target-grade-count');
  if(portfolio.summary.courseScheduleCellCount!==112)errors.push(`course-cell-count:${portfolio.summary.courseScheduleCellCount}`);
  if(portfolio.engines.length!==56)errors.push(`engine-count:${portfolio.engines.length}`);
  if(new Set(portfolio.engines.map(r=>r.id)).size!==portfolio.engines.length)errors.push('duplicate-engine-id');
  if(portfolio.summary.activeEngineCellCount!==56)errors.push(`active-cell-count:${portfolio.summary.activeEngineCellCount}`);
  if(portfolio.summary.unmatchedActiveCourseCellCount!==0)errors.push(`unmatched-active-cells:${portfolio.summary.unmatchedActiveCourseCellCount}`);
  if(portfolio.summary.canonicalQuestionCount!==2327)errors.push(`question-count:${portfolio.summary.canonicalQuestionCount}`);
  if(portfolio.summary.curriculumOutcomeRecordCount!==2302)errors.push(`outcome-record-count:${portfolio.summary.curriculumOutcomeRecordCount}`);
  if(portfolio.summary.coveredOutcomeCount!==2302)errors.push(`covered-outcome-count:${portfolio.summary.coveredOutcomeCount}`);
  if(portfolio.summary.humanApprovedQuestionCount!==5)errors.push(`approved-count:${portfolio.summary.humanApprovedQuestionCount}`);
  if(portfolio.summary.humanReviewQueueCount!==2322)errors.push(`review-queue:${portfolio.summary.humanReviewQueueCount}`);
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
