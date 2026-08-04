import { GRADE5_PHYSICAL_EDUCATION_OUTCOMES_TYMM_2024 } from '../curriculum/outcomes/tr-g5-beden-egitimi-ve-spor-tymm-2024.js';
import { GRADE6_PHYSICAL_EDUCATION_OUTCOMES_TYMM_2024 } from '../curriculum/outcomes/tr-g6-beden-egitimi-ve-spor-tymm-2024.js';
import { GRADE7_PHYSICAL_EDUCATION_OUTCOMES_TYMM_2024 } from '../curriculum/outcomes/tr-g7-beden-egitimi-ve-spor-tymm-2024.js';
import { defineSubjectEngine } from './subject-engine-contract.js';
import { defineCurriculumPerformanceTask, auditCurriculumPerformanceTask, solveCurriculumPerformanceTask, verifyCurriculumPerformanceTask } from './curriculum-outcome-task-factory.js';

const freeze=value=>Object.freeze(value);
const hints=(a,b,c)=>freeze([{level:1,text:a,revealsAnswer:false},{level:2,text:b,revealsAnswer:false},{level:3,text:c,revealsAnswer:false}]);
const slug=value=>String(value).toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

function taskSpec(outcome,index){
  const text=outcome.officialOutcomeText.toLocaleLowerCase('tr-TR');
  const safety=/güvenli ortam|yaralanma|ilk yardım/.test(text);
  const physicalFitness=/fiziksel uygunluk|zindelik|egzersiz ve beslenme|hareketsizliğin/.test(text);
  const sourceEvaluation=/kaynakların güvenirliğini/.test(text);
  const culture=/atatürk|öncülerini|olimpik|paralimpik/.test(text);
  const design=/özgün bir oyun|tasarlayacakları oyun/.test(text);
  const strategy=/taktik ve strateji|grup liderliği/.test(text);
  const rhythm=/dans|halk oyunu|hareket örüntüleri/.test(text);
  const movement=/hareket kavramlarını|hareket becerilerini|hareket becerisi|fiziksel uygunluğu sağlayabilme/.test(text);
  const taskKind=safety?'supervised-safety-and-first-aid-simulation':sourceEvaluation?'health-media-source-evaluation':design?'safe-game-design-performance':culture?'sports-culture-evidence-task':strategy?'supervised-tactical-decision-performance':rhythm?'supervised-rhythmic-movement-performance':physicalFitness?'supervised-fitness-inquiry-and-performance':movement?'supervised-movement-skill-performance':'supervised-physical-education-performance';
  const mediaStatus=(sourceEvaluation||culture)?'VERIFIED_SOURCE_OR_LICENSED_VISUAL_REQUIRED':'SAFE_SPACE_EQUIPMENT_AND_TEACHER_SUPERVISION_REQUIRED';
  const criteria=safety?[
    'Etkinlik alanındaki riski veya örnek yaralanma durumunu gözlemleyip doğru biçimde tanımlar; gerçek yaralanmada yetişkin/sağlık desteğine başvurur.',
    'Yalnız öğretmenin hazırladığı güvenli simülasyonda, yaş düzeyine uygun önleyici tedbir ya da temel ilk yardım basamaklarını doğru sırayla gösterir.',
    'Kişisel sınırlar, hijyen, ekipman ve çevre güvenliği kurallarını korur; tehlikeli müdahale yapmaz.'
  ]:sourceEvaluation?[
    'Egzersiz ve beslenme iddiasının kaynağını, güncelliğini, uzmanlığını ve kanıt türünü ayrı ayrı inceler.',
    'Reklam, kişisel deneyim ve bilimsel/kurumsal kanıt arasındaki farkı somut gerekçeyle açıklar.',
    'Kararını yalnız doğrulanmış kaynaklara dayandırır; sağlık önerisini genellemez ve gerektiğinde uzman desteği gerektiğini belirtir.'
  ]:design?[
    'Oyunun amacı, katılımcı sayısı, alanı, malzemesi ve kurallarını açık ve uygulanabilir biçimde tanımlar.',
    'Riskleri önceden belirleyip güvenli alan, yaşa uygun ekipman ve adil katılım için önlemler ekler.',
    'Oyunu deneyip gözlem/akran geri bildirimiyle bir kural, malzeme ya da akış iyileştirmesi yapar.'
  ]:culture?[
    'Sporun tarihsel, kültürel veya kapsayıcı yönüyle ilgili bilgiyi doğrulanmış kaynak, görsel ya da belgeye dayandırır.',
    'Olimpik/paralimpik değer, Atatürk’ün spora yaklaşımı veya spor öncüsünün katkısını bağlamı bozmadan açıklar.',
    'Poster, kısa sunum ya da yorumunda adil oyun, dayanışma, eşitlik ve kültürel saygıyı görünür kılar.'
  ]:strategy?[
    'Oyun ya da etkinlikteki taktiksel problemi veya liderlik ihtiyacını gözlemleyerek açıkça tanımlar.',
    'Alan, zamanlama, iletişim, iş birliği ve katılımcı güvenliğini gözeten uygulanabilir bir çözüm önerir.',
    'Seçtiği taktik/stratejiyi öğretmen gözetiminde uygular; sonuç ve geri bildirime göre düzenler.'
  ]:rhythm?[
    'Hareket ya da halk oyunu örüntüsünün başlangıç, yön, denge, ritim ve sıra basamaklarını doğru algılar.',
    'Yaşa ve fiziksel yeterliğe uygun hareketleri güvenli alanda müzik/ritimle uyumlu biçimde uygular.',
    'Akranlarıyla alan ve tempo paylaşımını korur; performansını rubrik ve geri bildirimle geliştirir.'
  ]:physicalFitness?[
    'Fiziksel uygunluk, zindelik, egzersiz, beslenme veya hareketsizlik bileşenlerini yaşa uygun kanıtla açıklar.',
    'Öğretmen gözetimindeki güvenli etkinlik/veri kaydında vücudundaki değişimi veya uygunluk bileşenini doğru gözlemler.',
    'Kişisel veriyi karşılaştırma ya da yargılama amacıyla kullanmadan, kendi gelişimi için güvenli ve gerçekçi bir iyileştirme hedefi belirler.'
  ]:[
    'Hareket kavramını veya beceri basamaklarını görsel, model ve öğretmen gösterimiyle doğru ayırt eder.',
    'Beceriyi güvenli alan, uygun ekipman ve kişisel sınırlar içinde kontrollü biçimde uygular.',
    'Öz/akran değerlendirmesini saygılı geri bildirimle kullanır ve sonraki denemede somut bir düzeltme yapar.'
  ];
  return {
    primarySkill:safety?'physical-activity-safety':sourceEvaluation?'health-media-literacy':design?'safe-game-design':strategy?'sports-tactical-reasoning':culture?'sports-culture-literacy':rhythm?'rhythmic-movement-performance':physicalFitness?'physical-fitness-inquiry':'movement-skill-performance',
    secondarySkills:['güvenli-fiziksel-katılım','öz-ve-akran-değerlendirme','adil-oyun-ve-iş-birliği'],
    cognitiveProcess:safety?'riski-belirle-önlemi-seç-güvenli-simülasyonda-uygula':sourceEvaluation?'kaynağı-incele-kanıtı-karşılaştır-sınırlı-sonuç-çıkar':design?'tasarla-riskleri-denetle-dene-iyileştir':strategy?'problemi-belirle-strateji-seç-uygula-değerlendir':'gözlemle-basamaklandır-güvenle-uygula-değerlendir',
    difficultyBand:`G${outcome.grade}_${index%4===0?'CHALLENGING':'CORE'}`,
    context:`${outcome.grade}. sınıf Beden Eğitimi ve Spor dersinde “${outcome.unitName}” teması için öğretmen tarafından risk değerlendirmesi yapılmış güvenli alan, yaşa uygun ekipman ve kapsayıcı katılım düzeni kullanılır.`,
    stem:`${outcome.officialOutcomeText} öğrenme çıktısını güvenli uygulama, gözlem ve gerekçeli öz değerlendirme kanıtıyla göster.`,
    criteria,
    itemFormat:'interactive-simulation',
    responseModel:{taskKind,humanObservationRubricRequired:true,physicalEducationTeacherModerationRequired:true,safetyBriefingRequired:true,medicalDiagnosisOrTreatmentProhibited:true,studentBodyComparisonProhibited:true},
    media:{type:safety?'teacher-prepared-safety-scenario':sourceEvaluation?'verified-health-media-source-pack':culture?'verified-sports-culture-source-pack':'safe-physical-space-and-age-appropriate-equipment',status:mediaStatus},
    hints:hints('Önce görevin hareket, güvenlik, zindelik, taktik, kültür ya da kaynak değerlendirme boyutlarından hangisini ölçtüğünü belirle.','Uygulamadan önce alanı, ekipmanı, kişisel sınırları ve öğretmen güvenlik yönergesini ayrı ayrı kontrol et.','Son kontrolde rubriğin üç ölçütü için gözlenebilir kanıt ver; performansını başkalarının bedeni veya başarısıyla kıyaslama.'),
    misconceptionIds:['hız-veya-kuvveti-tek-başına-doğru-performans-sanma','güvenlik-ve-kişisel-sınırları-ikincil-görme','geri-bildirim-yerine-sonuca-veya-kazanmaya-odaklanma'],
    solverId:`physical-education-g${outcome.grade}-${taskKind}-rubric-solver-v1`,
    verifierId:`physical-education-g${outcome.grade}-independent-safety-performance-verifier-v1`,
    styleProfile:{genre:`grade${outcome.grade}-physical-education-${taskKind}`,voice:'safe-inclusive-action-oriented',rhetoricalMoves:['hazırlan','güvenle-uygula','kanıtla','değerlendir']},
    batch:`PHASE5A_G${outcome.grade}_PHYSICAL_EDUCATION`
  };
}

const DEFINITIONS=freeze([[5,GRADE5_PHYSICAL_EDUCATION_OUTCOMES_TYMM_2024],[6,GRADE6_PHYSICAL_EDUCATION_OUTCOMES_TYMM_2024],[7,GRADE7_PHYSICAL_EDUCATION_OUTCOMES_TYMM_2024]]);
function buildTasks(grade,outcomes){return freeze(outcomes.map((outcome,index)=>defineCurriculumPerformanceTask({id:`beden-egitimi-ve-spor-g${grade}-${slug(outcome.officialOutcomeCode)}`,outcome,...taskSpec(outcome,index)})));}
function makeEngine(grade,items){return defineSubjectEngine({id:`grade${grade}-beden-egitimi-ve-spor-tymm-engine-v1`,domain:`grade${grade}-physical-education-tymm-domain`,supportedCourseIds:['beden-egitimi-ve-spor'],supportedItemFormats:['interactive-simulation'],misconceptionCatalogId:`g${grade}-physical-education-misconceptions-v1`,styleCatalogId:`g${grade}-physical-education-styles-v1`,plan:request=>({questionId:request.questionId}),generate:plan=>structuredClone(items.find(item=>item.id===plan.questionId)||(()=>{throw new Error(`unknown physical education task ${plan.questionId}`)})()),solve:solveCurriculumPerformanceTask,verifyIndependent:verifyCurriculumPerformanceTask,explain:item=>item.solutionGraph,qualityAudit:auditCurriculumPerformanceTask});}
function audit(items,engine,expected){const errors=items.flatMap(item=>auditCurriculumPerformanceTask(item).errors.map(error=>`${item.id}:${error}`));if(items.length!==expected)errors.push(`item-count:${items.length}`);if(new Set(items.flatMap(item=>item.curriculum.outcomeIds)).size!==expected)errors.push('outcome-count');if(new Set(items.map(item=>item.id)).size!==items.length)errors.push('duplicate-item-id');if(items.some(item=>!['SAFE_SPACE_EQUIPMENT_AND_TEACHER_SUPERVISION_REQUIRED','VERIFIED_SOURCE_OR_LICENSED_VISUAL_REQUIRED'].includes(item.content?.media?.status)))errors.push('safety-media-status');if(items.some(item=>item.responseModel?.physicalEducationTeacherModerationRequired!==true||item.responseModel?.safetyBriefingRequired!==true||item.responseModel?.medicalDiagnosisOrTreatmentProhibited!==true||item.responseModel?.studentBodyComparisonProhibited!==true))errors.push('safety-contract');if(items.some(item=>/kilo ver|vücut kitle indeksini karşılaştır|doktor olmadan|yaralanmayı tedavi et/i.test(item.content?.stem||'')))errors.push('unsafe-health-language');for(const item of items)if(!engine.verifyIndependent(item,engine.solve(item)))errors.push(`${item.id}:verify`);return freeze({ok:errors.length===0,errors:freeze(errors),metrics:freeze({officialOutcomeCount:expected,implementedOutcomeCount:expected,itemCount:items.length,humanReviewStatus:'NOT_MEASURED',safeSpaceAndEquipmentStatus:'REQUIRED_NOT_ATTACHED',physicalEducationTeacherCalibration:'NOT_COMPLETED',gameAdaptationAllowed:false})});}
const BUILT=DEFINITIONS.map(([grade,outcomes])=>{const items=buildTasks(grade,outcomes);const engine=makeEngine(grade,items);return {grade,courseId:'beden-egitimi-ve-spor',outcomes,items,engine,audit:audit(items,engine,outcomes.length)};});
export function buildMiddleSchoolTymmPhysicalEducationTasks(){return freeze(BUILT.flatMap(record=>record.items));}
export const MIDDLE_SCHOOL_TYMM_PHYSICAL_EDUCATION_ENGINE_RECORDS=freeze(BUILT.map(record=>freeze({grade:record.grade,courseId:record.courseId,officialOutcomeCount:record.outcomes.length,items:record.items,engine:record.engine,audit:record.audit})));
export const MIDDLE_SCHOOL_TYMM_PHYSICAL_EDUCATION_AUDIT=freeze({ok:BUILT.every(record=>record.audit.ok),metrics:freeze({engineCount:3,officialOutcomeCount:48,itemCount:48,humanReviewStatus:'NOT_MEASURED',safeSpaceAndEquipmentStatus:'REQUIRED_NOT_ATTACHED',physicalEducationTeacherCalibration:'NOT_COMPLETED',gameAdaptationAllowed:false})});
