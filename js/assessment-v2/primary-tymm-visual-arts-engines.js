import { GRADE1_VISUAL_ARTS_OUTCOMES_TYMM_2024 } from '../curriculum/outcomes/tr-g1-gorsel-sanatlar-tymm-2024.js';
import { GRADE2_VISUAL_ARTS_OUTCOMES_TYMM_2024 } from '../curriculum/outcomes/tr-g2-gorsel-sanatlar-tymm-2024.js';
import { GRADE3_VISUAL_ARTS_OUTCOMES_TYMM_2024 } from '../curriculum/outcomes/tr-g3-gorsel-sanatlar-tymm-2024.js';
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

function visualArtsSpec(outcome,index){
  const text=outcome.officialOutcomeText.toLocaleLowerCase('tr-TR');
  const analysis=/algıla|incele|okuy|sınıflandır|karşılaştır|çözümle/.test(text);
  const museum=/müze|koleksiyon/.test(text);
  const national=/23 nisan|cumhuriyet|millî|milli/.test(text);
  const creation=!analysis||/yapabilme|çizim|resim|kolaj|levha|tasarla|yansıtan/.test(text);
  return {
    primarySkill:analysis?'primary-visual-analysis':'primary-visual-expression',
    secondarySkills:['görsel-dil','estetik-farkındalık','ürününü-gözden-geçirme'],
    cognitiveProcess:analysis?'gözlemle-ayırt-et-kanıtla':'planla-dene-üret-değerlendir',
    difficultyBand:`G${outcome.grade}_${index%4===0?'CHALLENGING':'CORE'}`,
    context:`${outcome.grade}. sınıf Görsel Sanatlar çalışmasında “${outcome.unitName}” teması için yaşa uygun gerçek nesne, sanat eseri görseli, doğal/yapay malzeme, okul çevresi veya müze koleksiyonu kullanılır.`,
    stem:`${outcome.officialOutcomeText} öğrenme çıktısını özgün bir görsel inceleme ya da sanat ürünüyle göster.`,
    criteria:analysis
      ? ['Görseldeki renk, çizgi, şekil, sembol, konu veya düzenleme özelliklerini doğru gözlemler ve adlandırır.','Yorumunu görselde doğrudan görülebilen ayrıntılara dayandırır; eserde bulunmayan anlamlar eklemez.','Benzerlik, farklılık, ileti veya sınıflandırma kararını yaş düzeyine uygun açık bir gerekçeyle ifade eder.']
      : ['Sanat çalışmasının amacına uygun renk, çizgi, şekil, malzeme ve düzenleme kararları verir.','Seçtiği görsel ögeleri güvenli, özgün ve anlaşılır bir bütün oluşturacak biçimde uygular.','Çalışmasını verilen ölçütlere göre inceler; anlatmak istediği düşünce ile görsel seçimleri arasındaki ilişkiyi açıklar.'],
    itemFormat:creation?'interactive-simulation':'open-response',
    responseModel:{taskKind:creation?'supervised-visual-art-portfolio-task':'guided-visual-art-analysis',humanObservationRubricRequired:true,portfolioEvidenceRequired:creation},
    media:{type:museum?'licensed-museum-or-student-curated-visual-set':national?'age-appropriate-civic-cultural-visual-reference':'licensed-artwork-or-student-material',status:'REAL_ARTWORK_OR_STUDENT_MATERIAL_REQUIRED'},
    hints:hints('Önce görselde ya da yapacağın çalışmada öne çıkan renk, çizgi, şekil, sembol ve malzemeleri belirle.','Bu görsel ögelerin konuya, iletiye veya oluşturmak istediğin duyguya nasıl hizmet ettiğini düşün.','Son kontrolde çalışmanın güvenli, özgün, anlaşılır ve verilen ölçütlerle uyumlu olduğunu ayrı ayrı denetle.'),
    misconceptionIds:['görsel-ayrıntıyı-atlama','malzeme-ve-amacı-uyumsuz-seçme','kanıtsız-yorum-veya-kopya-üretim'],
    solverId:`visual-arts-g${outcome.grade}-${analysis?'analysis':'portfolio'}-rubric-solver-v1`,
    verifierId:`visual-arts-g${outcome.grade}-independent-evidence-and-portfolio-verifier-v1`,
    styleProfile:{genre:`grade${outcome.grade}-primary-visual-arts-${analysis?'analysis':'creation'}`,voice:'brief-observational-creative-child-friendly',rhetoricalMoves:analysis?['gözlemle','ayırt-et','kanıtla']:['planla','üret','değerlendir']},
    batch:`PHASE4V_G${outcome.grade}_PRIMARY_VISUAL_ARTS`
  };
}

const DEFINITIONS=freeze([
  [1,GRADE1_VISUAL_ARTS_OUTCOMES_TYMM_2024],
  [2,GRADE2_VISUAL_ARTS_OUTCOMES_TYMM_2024],
  [3,GRADE3_VISUAL_ARTS_OUTCOMES_TYMM_2024]
]);

function buildTasks(grade,outcomes){
  return freeze(outcomes.map((outcome,index)=>defineCurriculumPerformanceTask({id:`gorsel-sanatlar-g${grade}-${slug(outcome.officialOutcomeCode)}`,outcome,...visualArtsSpec(outcome,index)})));
}
function makeEngine(grade,items){
  return defineSubjectEngine({
    id:`grade${grade}-gorsel-sanatlar-tymm-engine-v1`,domain:`grade${grade}-visual-arts-tymm-domain`,supportedCourseIds:['gorsel-sanatlar'],supportedItemFormats:[...new Set(items.map(item=>item.itemFormat))],misconceptionCatalogId:`g${grade}-visual-arts-misconceptions-v1`,styleCatalogId:`g${grade}-visual-arts-styles-v1`,
    plan:request=>({questionId:request.questionId}),
    generate:plan=>structuredClone(items.find(item=>item.id===plan.questionId)||(()=>{throw new Error(`unknown visual arts task ${plan.questionId}`)})()),
    solve:solveCurriculumPerformanceTask,verifyIndependent:verifyCurriculumPerformanceTask,explain:item=>item.solutionGraph,qualityAudit:auditCurriculumPerformanceTask
  });
}
function audit(items,engine,expected){
  const errors=items.flatMap(item=>auditCurriculumPerformanceTask(item).errors.map(error=>`${item.id}:${error}`));
  if(items.length!==expected)errors.push(`item-count:${items.length}`);
  if(new Set(items.flatMap(item=>item.curriculum.outcomeIds)).size!==expected)errors.push('outcome-count');
  if(new Set(items.map(item=>item.id)).size!==items.length)errors.push('duplicate-item-id');
  if(items.some(item=>item.content?.media?.status!=='REAL_ARTWORK_OR_STUDENT_MATERIAL_REQUIRED'))errors.push('real-asset-status');
  for(const item of items)if(!engine.verifyIndependent(item,engine.solve(item)))errors.push(`${item.id}:verify`);
  return freeze({ok:errors.length===0,errors:freeze(errors),metrics:freeze({officialOutcomeCount:expected,implementedOutcomeCount:expected,itemCount:items.length,humanReviewStatus:'NOT_MEASURED',realArtworkStatus:'REQUIRED_NOT_ATTACHED',gameAdaptationAllowed:false})});
}

const BUILT=DEFINITIONS.map(([grade,outcomes])=>{
  const items=buildTasks(grade,outcomes);const engine=makeEngine(grade,items);return {grade,courseId:'gorsel-sanatlar',outcomes,items,engine,audit:audit(items,engine,outcomes.length)};
});

export function buildPrimaryTymmVisualArtsTasks(){return freeze(BUILT.flatMap(record=>record.items));}
export const PRIMARY_TYMM_VISUAL_ARTS_ENGINE_RECORDS=freeze(BUILT.map(record=>freeze({grade:record.grade,courseId:record.courseId,officialOutcomeCount:record.outcomes.length,items:record.items,engine:record.engine,audit:record.audit})));
export const PRIMARY_TYMM_VISUAL_ARTS_AUDIT=freeze({ok:BUILT.every(record=>record.audit.ok),metrics:freeze({engineCount:3,officialOutcomeCount:33,itemCount:33,humanReviewStatus:'NOT_MEASURED',realArtworkStatus:'REQUIRED_NOT_ATTACHED',gameAdaptationAllowed:false})});
