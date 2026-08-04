import { GRADE5_MUSIC_OUTCOMES_TYMM_2024 } from '../curriculum/outcomes/tr-g5-muzik-tymm-2024.js';
import { GRADE6_MUSIC_OUTCOMES_TYMM_2024 } from '../curriculum/outcomes/tr-g6-muzik-tymm-2024.js';
import { GRADE7_MUSIC_OUTCOMES_TYMM_2024 } from '../curriculum/outcomes/tr-g7-muzik-tymm-2024.js';
import { defineSubjectEngine } from './subject-engine-contract.js';
import {
  defineCurriculumPerformanceTask,
  auditCurriculumPerformanceTask,
  solveCurriculumPerformanceTask,
  verifyCurriculumPerformanceTask
} from './curriculum-outcome-task-factory.js';

const freeze=value=>Object.freeze(value);
const hints=(a,b,c)=>freeze([{level:1,text:a,revealsAnswer:false},{level:2,text:b,revealsAnswer:false},{level:3,text:c,revealsAnswer:false}]);
const slug=value=>String(value).toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

function musicSpec(outcome,index){
  const text=outcome.officialOutcomeText.toLocaleLowerCase('tr-TR');
  const listening=/dinley|seslerin|çalgıların|ögelerini|sözcüklerini|kurallarını|karşılaştır|çözümle|yorumla/.test(text);
  const singing=/söyleyebilme|marşı.*söyleyebilme/.test(text);
  const movement=/bedensel hareketlerle eşlik/.test(text);
  const instrument=/çalgı/.test(text);
  const anthem=/istiklâl marşı/.test(text);
  const taskKind=movement?'guided-music-movement-performance':singing?'guided-singing-performance':listening?'guided-listening-and-comparison':'guided-music-performance';
  return {
    primarySkill:movement?'primary-music-movement':singing?'primary-vocal-performance':'primary-music-listening-analysis',
    secondarySkills:['müziksel-dinleme','ritim-ve-süre-farkındalığı','performansını-gözden-geçirme'],
    cognitiveProcess:movement?'dinle-eşleştir-hareketle-göster':singing?'dinle-hazırlan-söyle-değerlendir':'dinle-ayırt-et-karşılaştır-gerekçelendir',
    difficultyBand:`G${outcome.grade}_${index%4===0?'CHALLENGING':'CORE'}`,
    context:`${outcome.grade}. sınıf Müzik dersinde “${outcome.unitName}” teması için öğretmen tarafından seçilmiş, yaşa uygun ve lisans/provenansı doğrulanmış kısa ses örnekleri ile güvenli sınıf içi performans ortamı kullanılır.`,
    stem:`${outcome.officialOutcomeText} öğrenme çıktısını gerçek dinleme ya da performans kanıtıyla göster.`,
    criteria:listening&&!singing&&!movement
      ? ['Dinlediği ses, eser veya çalgı örneğinin istenen özelliğini dikkatle ayırt eder.','Karşılaştırma veya yorumunu yalnız duyduğu müziksel kanıta dayandırır.','Sesin incelik-kalınlık, süre, ritim, çalgı niteliği ya da marş ögesiyle ilgili kararını yaş düzeyine uygun açıklar.']
      : movement
        ? ['Müziğin belirgin vuruş, ritim veya bölüm değişimine uygun güvenli bedensel hareket seçer.','Hareketini müzikle zamanlı ve sınıf alanını gözeterek sürdürür.','Performans sonrasında müzikte hangi işarete göre hareket ettiğini açıklar.']
        : ['Yaş düzeyine uygun ses yüksekliği, nefes ve başlangıç-bitiş düzeniyle eseri söyler.','Söz, ritim ve toplu söyleme kurallarına dikkat eder; başkasının sesini bastırmaz.','Performansını öğretmen ölçütlerine göre gözden geçirir ve bir geliştirme noktası belirtir.'],
    itemFormat:'interactive-simulation',
    responseModel:{taskKind,humanObservationRubricRequired:true,audioEvidenceRequired:true,teacherModerationRequired:true},
    media:{type:instrument?'licensed-instrument-audio-and-image-set':anthem?'official-or-authorized-anthem-reference':'licensed-or-human-recorded-age-appropriate-music-audio',status:'LICENSED_OR_HUMAN_RECORDED_MUSIC_AUDIO_REQUIRED'},
    hints:hints('Önce dinleme ya da söyleme görevinin hangi özelliği ölçtüğünü belirle: ses, süre, ritim, söz, çalgı veya hareket.','Duyduğun müziksel işareti seç ve performansını o işaretle eşleştir.','Son kontrolde zamanlama, güvenli katılım, dinleme kuralı ve rubrik ölçütlerini ayrı ayrı gözden geçir.'),
    misconceptionIds:['müziksel-kanıt-yerine-tahmin','ritim-süre-ve-ses-özelliğini-karıştırma','yüksek-ses-veya-hızın-doğru-performans-olduğunu-sanma'],
    solverId:`music-g${outcome.grade}-${taskKind}-rubric-solver-v1`,
    verifierId:`music-g${outcome.grade}-independent-audio-performance-verifier-v1`,
    styleProfile:{genre:`grade${outcome.grade}-primary-music-${taskKind}`,voice:'brief-listening-performance-child-friendly',rhetoricalMoves:listening?['dinle','ayırt-et','kanıtla']:['hazırlan','uygula','değerlendir']},
    batch:`PHASE4Y_G${outcome.grade}_PRIMARY_MUSIC`
  };
}

const DEFINITIONS=freeze([
  [5,GRADE5_MUSIC_OUTCOMES_TYMM_2024],
  [6,GRADE6_MUSIC_OUTCOMES_TYMM_2024],
  [7,GRADE7_MUSIC_OUTCOMES_TYMM_2024]
]);
function buildTasks(grade,outcomes){return freeze(outcomes.map((outcome,index)=>defineCurriculumPerformanceTask({id:`muzik-g${grade}-${slug(outcome.officialOutcomeCode)}`,outcome,...musicSpec(outcome,index)})));}
function makeEngine(grade,items){return defineSubjectEngine({id:`grade${grade}-muzik-tymm-engine-v1`,domain:`grade${grade}-music-tymm-domain`,supportedCourseIds:['muzik'],supportedItemFormats:['interactive-simulation'],misconceptionCatalogId:`g${grade}-music-misconceptions-v1`,styleCatalogId:`g${grade}-music-styles-v1`,plan:request=>({questionId:request.questionId}),generate:plan=>structuredClone(items.find(item=>item.id===plan.questionId)||(()=>{throw new Error(`unknown music task ${plan.questionId}`)})()),solve:solveCurriculumPerformanceTask,verifyIndependent:verifyCurriculumPerformanceTask,explain:item=>item.solutionGraph,qualityAudit:auditCurriculumPerformanceTask});}
function audit(items,engine,expected){const errors=items.flatMap(item=>auditCurriculumPerformanceTask(item).errors.map(error=>`${item.id}:${error}`));if(items.length!==expected)errors.push(`item-count:${items.length}`);if(new Set(items.flatMap(item=>item.curriculum.outcomeIds)).size!==expected)errors.push('outcome-count');if(new Set(items.map(item=>item.id)).size!==items.length)errors.push('duplicate-item-id');if(items.some(item=>item.content?.media?.status!=='LICENSED_OR_HUMAN_RECORDED_MUSIC_AUDIO_REQUIRED'))errors.push('audio-status');if(items.some(item=>item.content?.stem?.match(/şarkı sözleri|lyrics/i)))errors.push('lyrics-leak');for(const item of items)if(!engine.verifyIndependent(item,engine.solve(item)))errors.push(`${item.id}:verify`);return freeze({ok:errors.length===0,errors:freeze(errors),metrics:freeze({officialOutcomeCount:expected,implementedOutcomeCount:expected,itemCount:items.length,humanReviewStatus:'NOT_MEASURED',licensedAudioStatus:'REQUIRED_NOT_ATTACHED',gameAdaptationAllowed:false})});}
const BUILT=DEFINITIONS.map(([grade,outcomes])=>{const items=buildTasks(grade,outcomes);const engine=makeEngine(grade,items);return {grade,courseId:'muzik',outcomes,items,engine,audit:audit(items,engine,outcomes.length)};});
export function buildMiddleSchoolTymmMusicTasks(){return freeze(BUILT.flatMap(record=>record.items));}
export const MIDDLE_SCHOOL_TYMM_MUSIC_ENGINE_RECORDS=freeze(BUILT.map(record=>freeze({grade:record.grade,courseId:record.courseId,officialOutcomeCount:record.outcomes.length,items:record.items,engine:record.engine,audit:record.audit})));
export const MIDDLE_SCHOOL_TYMM_MUSIC_AUDIT=freeze({ok:BUILT.every(record=>record.audit.ok),metrics:freeze({engineCount:3,officialOutcomeCount:44,itemCount:44,humanReviewStatus:'NOT_MEASURED',licensedAudioStatus:'REQUIRED_NOT_ATTACHED',gameAdaptationAllowed:false})});
