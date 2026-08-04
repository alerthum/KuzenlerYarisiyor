import { GRADE1_TURKISH_OUTCOMES_TYMM_2024 } from '../curriculum/outcomes/tr-g1-turkce-tymm-2024.js';
import { GRADE2_TURKISH_OUTCOMES_TYMM_2024 } from '../curriculum/outcomes/tr-g2-turkce-tymm-2024.js';
import { GRADE3_TURKISH_OUTCOMES_TYMM_2024 } from '../curriculum/outcomes/tr-g3-turkce-tymm-2024.js';
import { GRADE1_MATH_OUTCOMES_TYMM_2024 } from '../curriculum/outcomes/tr-g1-matematik-tymm-2024.js';
import { GRADE2_MATH_OUTCOMES_TYMM_2024 } from '../curriculum/outcomes/tr-g2-matematik-tymm-2024.js';
import { GRADE3_MATH_OUTCOMES_TYMM_2024 } from '../curriculum/outcomes/tr-g3-matematik-tymm-2024.js';
import { GRADE1_LIFE_SCIENCE_OUTCOMES_TYMM_2024 } from '../curriculum/outcomes/tr-g1-hayat-bilgisi-tymm-2024.js';
import { GRADE2_LIFE_SCIENCE_OUTCOMES_TYMM_2024 } from '../curriculum/outcomes/tr-g2-hayat-bilgisi-tymm-2024.js';
import { GRADE3_LIFE_SCIENCE_OUTCOMES_TYMM_2024 } from '../curriculum/outcomes/tr-g3-hayat-bilgisi-tymm-2024.js';
import { GRADE1_MOVEMENT_OUTCOMES_TYMM_2024 } from '../curriculum/outcomes/tr-g1-beden-egitimi-ve-oyun-tymm-2024.js';
import { GRADE2_MOVEMENT_OUTCOMES_TYMM_2024 } from '../curriculum/outcomes/tr-g2-beden-egitimi-ve-oyun-tymm-2024.js';
import { GRADE3_MOVEMENT_OUTCOMES_TYMM_2024 } from '../curriculum/outcomes/tr-g3-beden-egitimi-ve-oyun-tymm-2024.js';
import { defineSubjectEngine } from './subject-engine-contract.js';
import {
  defineCurriculumPerformanceTask,
  auditCurriculumPerformanceTask,
  solveCurriculumPerformanceTask,
  verifyCurriculumPerformanceTask
} from './curriculum-outcome-task-factory.js';

const freeze=value=>Object.freeze(value);
const slug=value=>String(value).toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const hints=(a,b,c)=>freeze([{level:1,text:a,revealsAnswer:false},{level:2,text:b,revealsAnswer:false},{level:3,text:c,revealsAnswer:false}]);

function turkishSpec(outcome,index){
  const strand=outcome.officialOutcomeCode.split('.')[1];
  const listening=strand==='D', speaking=strand==='K', reading=strand==='O', writing=strand==='Y';
  return {
    primarySkill:`primary-turkish-${({D:'listening',K:'speaking',O:'reading',Y:'writing'})[strand]}`,
    secondarySkills:['anlam-kurma','açık-iletişim','öz-değerlendirme'],
    cognitiveProcess:listening||reading?'dikkat-et-bağ-kur-kanıtla':'planla-ifade-et-gözden-geçir',
    difficultyBand:`G${outcome.grade}_${index%5===0?'CHALLENGING':'CORE'}`,
    context:`${outcome.grade}. sınıf Türkçe çalışmasında “${outcome.unitName}” becerisi için kısa, somut, yaşa uygun ve özgün bir metin, görsel, konuşma veya yazma durumu kullanılır.`,
    stem:`${outcome.officialOutcomeText} öğrenme çıktısını gösterecek yanıtı oluştur.`,
    criteria:listening||reading
      ? ['Verilen metin, ses veya görseldeki gerekli bilgiyi doğru belirler.','Bilgiyi görevin istediği anlam ilişkisiyle açıklar; tek sözcük eşleştirmesiyle yetinmez.','Yanıtını materyaldeki kanıta bağlar ve desteklenmeyen ayrıntı eklemez.']
      : ['İletişim amacına uygun içerik ve sıralama oluşturur.','Yaş düzeyine uygun açık, anlaşılır ve kurallı bir anlatım kullanır.','Ürününü verilen ölçütlere göre gözden geçirir ve gerekli düzeltmeyi yapar.'],
    itemFormat:listening||speaking?'interactive-simulation':reading?'short-answer':'open-response',
    responseModel:{taskKind:listening?'listening-with-real-audio':speaking?'guided-speaking':reading?'reading-response':'guided-writing',humanReviewRequired:speaking||writing},
    media:listening?{type:'licensed-or-human-recorded-turkish-audio',status:'HUMAN_RECORDING_REQUIRED'}:speaking?{type:'child-safe-audio-response',status:'HUMAN_AUDIO_REVIEW_REQUIRED'}:reading?{type:'accessible-original-text-or-visual',status:'REAL_ASSET_REQUIRED'}:null,
    hints:hints('Önce görevin senden dinleme, konuşma, okuma veya yazmanın hangisini istediğini belirle.','Metindeki ya da iletişim durumundaki ana ipucunu bul ve yanıtını bu ipucuna bağla.','Son kontrolde yanıtının açık, yaşa uygun ve verilen kanıtla destekli olduğunu denetle.'),
    misconceptionIds:['tek-sözcüğe-takılma','iletişim-amacını-kaçırma','kanıtsız-ayrıntı-ekleme'],
    solverId:`turkish-g${outcome.grade}-${strand.toLowerCase()}-rubric-solver-v1`,
    verifierId:`turkish-g${outcome.grade}-${strand.toLowerCase()}-independent-verifier-v1`,
    styleProfile:{genre:`grade${outcome.grade}-primary-turkish-${strand.toLowerCase()}`,voice:'short-concrete-child-friendly',rhetoricalMoves:['dikkat-et','bağ-kur','yanıtla']},
    batch:`PHASE4U_G${outcome.grade}_PRIMARY_TURKISH`
  };
}

function mathSpec(outcome,index){
  const text=outcome.officialOutcomeText.toLocaleLowerCase('tr-TR');
  const construction=/oluştur|inşa|model|çiz|ölç|veri|grafik|örüntü|tahmin/.test(text);
  return {
    primarySkill:'primary-mathematical-reasoning',
    secondarySkills:['temsil-etme','strateji-seçme','sonucu-kontrol-etme'],
    cognitiveProcess:'anla-modelle-çöz-kontrol-et',
    difficultyBand:`G${outcome.grade}_${index%5===0?'CHALLENGING':'CORE'}`,
    context:`${outcome.grade}. sınıf Matematik çalışmasında “${outcome.unitName}” için nesne, sayı kartı, ölçme aracı, şekil, tablo veya kısa gerçek yaşam durumu kullanılır.`,
    stem:`${outcome.officialOutcomeText} öğrenme çıktısını gösterecek matematiksel çözümü veya modeli oluştur.`,
    criteria:['Verilen nicelikleri, şekilleri veya ilişkileri doğru matematiksel temsile dönüştürür.','Yaş düzeyine uygun bir stratejiyle işlemi, modeli, sınıflandırmayı ya da ölçümü gerçekleştirir.','Sonucunu farklı temsil, ters işlem, tahmin veya somut kontrol yoluyla doğrular.'],
    itemFormat:construction?'interactive-simulation':'short-answer',
    responseModel:{taskKind:construction?'guided-math-manipulative-or-model':'short-mathematical-response',concreteRepresentationRequired:outcome.grade<=2},
    media:construction?{type:'accessible-primary-math-manipulative',status:'REAL_INTERACTIVE_ASSET_REQUIRED'}:null,
    hints:hints('Önce verilenleri nesne, sayı, şekil veya ölçü olarak ayır.','Hangi işlem, karşılaştırma, örüntü veya modelin ilişkiyi gösterdiğini belirle.','Sonucunu başka bir temsil, ters işlem ya da tahminle kontrol et.'),
    misconceptionIds:['temsili-yanlış-okuma','işlem-veya-ilişkiyi-karıştırma','sonucu-kontrol-etmeme'],
    solverId:`math-g${outcome.grade}-primary-model-rubric-solver-v1`,
    verifierId:`math-g${outcome.grade}-alternate-representation-verifier-v1`,
    styleProfile:{genre:`grade${outcome.grade}-primary-mathematical-investigation`,voice:'concrete-visual-age-appropriate',rhetoricalMoves:['temsil-et','çöz','kontrol-et']},
    batch:`PHASE4U_G${outcome.grade}_PRIMARY_MATH`
  };
}

function lifeSpec(outcome,index){
  const text=outcome.officialOutcomeText.toLocaleLowerCase('tr-TR');
  const performance=/davran|uygula|katıl|oluştur|tasarla|sun|koru|yardım/.test(text);
  return {
    primarySkill:'primary-life-and-civic-reasoning',
    secondarySkills:['öz-farkındalık','güvenli-karar','toplumsal-ve-çevresel-sorumluluk'],
    cognitiveProcess:'fark-et-seç-gerekçelendir-uygula',
    difficultyBand:`G${outcome.grade}_${index%5===0?'CHALLENGING':'CORE'}`,
    context:`${outcome.grade}. sınıf Hayat Bilgisi çalışmasında “${outcome.unitName}” için okul, aile, güvenlik, yaşadığı yer, doğa veya bilim-teknoloji bağlamından somut bir durum kullanılır.`,
    stem:`${outcome.officialOutcomeText} öğrenme çıktısını gösterecek güvenli ve gerekçeli yanıtı oluştur.`,
    criteria:['Durumdaki kişi, yer, kural, ihtiyaç veya riski doğru belirler.','Yaşına uygun güvenli, saygılı ve uygulanabilir bir davranış ya da çözüm seçer.','Seçimini verilen durumdaki kanıta ve sorumluluk ilişkisine dayandırır.'],
    itemFormat:performance?'interactive-simulation':'matching',
    responseModel:{taskKind:performance?'guided-life-situation-performance':'life-situation-classification',adultSupervisionRequired:/acil|trafik|güven|risk/.test(text)},
    media:{type:'accessible-primary-life-situation-cards',status:'REAL_ASSET_REQUIRED'},
    hints:hints('Durumda kimlerin, hangi yerin veya hangi güvenlik kuralının önemli olduğunu bul.','Seçeceğin davranışın güvenli, saygılı ve uygulanabilir olup olmadığını düşün.','Cevabını durumdaki ayrıntıyla gerekçelendir ve başka bir kişiye zarar vermediğini kontrol et.'),
    misconceptionIds:['durumdaki-riski-fark-etmeme','kuralı-bağlamdan-koparma','gerekçesiz-davranış-seçme'],
    solverId:`life-g${outcome.grade}-situation-rubric-solver-v1`,
    verifierId:`life-g${outcome.grade}-independent-safety-civic-verifier-v1`,
    styleProfile:{genre:`grade${outcome.grade}-primary-life-situation`,voice:'safe-respectful-concrete',rhetoricalMoves:['fark-et','seç','gerekçelendir']},
    batch:`PHASE4U_G${outcome.grade}_LIFE_SCIENCE`
  };
}

function movementSpec(outcome,index){
  return {
    primarySkill:'primary-physical-literacy',
    secondarySkills:['güvenli-hareket','iş-birliği','öz-değerlendirme'],
    cognitiveProcess:'izle-planla-sergile-değerlendir',
    difficultyBand:`G${outcome.grade}_${index%4===0?'CHALLENGING':'CORE'}`,
    context:`${outcome.grade}. sınıf Beden Eğitimi ve Oyun çalışmasında “${outcome.unitName}” için güvenli alan, yaşa uygun ekipman, hareket istasyonu veya kurallı oyun kullanılır.`,
    stem:`${outcome.officialOutcomeText} öğrenme çıktısını güvenli bir performansla göster.`,
    criteria:['Hareketin, oyunun veya fiziksel etkinliğin amacını ve güvenlik koşullarını doğru açıklar.','Hareketi, kuralı, ritmi veya iş birliği davranışını yaş düzeyine uygun biçimde sergiler.','Kendi performansını güvenlik, adil oyun ve hareket ölçütlerine göre değerlendirir.'],
    itemFormat:'interactive-simulation',
    responseModel:{taskKind:'supervised-physical-performance',humanObservationRubricRequired:true,adultSafetySupervisionRequired:true},
    media:{type:'teacher-supervised-physical-activity-space',status:'HUMAN_SAFETY_AND_PERFORMANCE_REVIEW_REQUIRED'},
    hints:hints('Önce hareket alanını, ekipmanı ve güvenlik kuralını kontrol et.','Hareketin basamaklarını yavaşça planla; sıra, ritim veya oyun kuralını unutma.','Uygulama sonunda güvenliğini, adil davranışını ve hareketin basamaklarını ayrı ayrı değerlendir.'),
    misconceptionIds:['güvenlik-kuralını-atlama','hareket-basamaklarını-karıştırma','adil-oyun-ve-is-birligini-ihmal-etme'],
    solverId:`movement-g${outcome.grade}-performance-rubric-solver-v1`,
    verifierId:`movement-g${outcome.grade}-independent-observation-verifier-v1`,
    styleProfile:{genre:`grade${outcome.grade}-physical-literacy-performance`,voice:'brief-safe-action-oriented',rhetoricalMoves:['hazırlan','uygula','değerlendir']},
    batch:`PHASE4U_G${outcome.grade}_MOVEMENT`
  };
}

const DEFINITIONS=freeze([
  [1,'turkce',GRADE1_TURKISH_OUTCOMES_TYMM_2024,turkishSpec],[2,'turkce',GRADE2_TURKISH_OUTCOMES_TYMM_2024,turkishSpec],[3,'turkce',GRADE3_TURKISH_OUTCOMES_TYMM_2024,turkishSpec],
  [1,'matematik',GRADE1_MATH_OUTCOMES_TYMM_2024,mathSpec],[2,'matematik',GRADE2_MATH_OUTCOMES_TYMM_2024,mathSpec],[3,'matematik',GRADE3_MATH_OUTCOMES_TYMM_2024,mathSpec],
  [1,'hayat-bilgisi',GRADE1_LIFE_SCIENCE_OUTCOMES_TYMM_2024,lifeSpec],[2,'hayat-bilgisi',GRADE2_LIFE_SCIENCE_OUTCOMES_TYMM_2024,lifeSpec],[3,'hayat-bilgisi',GRADE3_LIFE_SCIENCE_OUTCOMES_TYMM_2024,lifeSpec],
  [1,'beden-egitimi-ve-oyun',GRADE1_MOVEMENT_OUTCOMES_TYMM_2024,movementSpec],[2,'beden-egitimi-ve-oyun',GRADE2_MOVEMENT_OUTCOMES_TYMM_2024,movementSpec],[3,'beden-egitimi-ve-oyun',GRADE3_MOVEMENT_OUTCOMES_TYMM_2024,movementSpec]
]);

function buildTasks(grade,courseId,outcomes,spec){
  return freeze(outcomes.map((outcome,index)=>defineCurriculumPerformanceTask({id:`${slug(courseId)}-g${grade}-${slug(outcome.officialOutcomeCode)}`,outcome,...spec(outcome,index)})));
}
function makeEngine(grade,courseId,items){
  return defineSubjectEngine({id:`grade${grade}-${slug(courseId)}-tymm-engine-v1`,domain:`grade${grade}-${slug(courseId)}-tymm-domain`,supportedCourseIds:[courseId],supportedItemFormats:[...new Set(items.map(x=>x.itemFormat))],misconceptionCatalogId:`g${grade}-${slug(courseId)}-tymm-misconceptions-v1`,styleCatalogId:`g${grade}-${slug(courseId)}-tymm-styles-v1`,plan:r=>({questionId:r.questionId}),generate:p=>structuredClone(items.find(i=>i.id===p.questionId)||(()=>{throw new Error(`unknown ${p.questionId}`)})()),solve:solveCurriculumPerformanceTask,verifyIndependent:verifyCurriculumPerformanceTask,explain:i=>i.solutionGraph,qualityAudit:auditCurriculumPerformanceTask});
}
function audit(items,engine,expected){
  const errors=items.flatMap(item=>auditCurriculumPerformanceTask(item).errors.map(error=>`${item.id}:${error}`));
  if(items.length!==expected)errors.push(`item-count:${items.length}`);
  if(new Set(items.flatMap(item=>item.curriculum.outcomeIds)).size!==expected)errors.push('outcome-count');
  if(new Set(items.map(item=>item.id)).size!==items.length)errors.push('duplicate-item-id');
  for(const item of items)if(!engine.verifyIndependent(item,engine.solve(item)))errors.push(`${item.id}:verify`);
  return freeze({ok:errors.length===0,errors:freeze(errors),metrics:freeze({officialOutcomeCount:expected,implementedOutcomeCount:expected,itemCount:items.length,humanReviewStatus:'NOT_MEASURED',gameAdaptationAllowed:false})});
}

const BUILT=new Map(DEFINITIONS.map(([grade,courseId,outcomes,spec])=>{
  const items=buildTasks(grade,courseId,outcomes,spec),engine=makeEngine(grade,courseId,items);
  return [`${grade}:${courseId}`,{grade,courseId,outcomes,items,engine,audit:audit(items,engine,outcomes.length)}];
}));

export function buildPrimaryTymmAcademicCoreTasks(){return freeze([...BUILT.values()].flatMap(record=>record.items));}
export const PRIMARY_TYMM_ACADEMIC_ENGINE_RECORDS=freeze([...BUILT.values()].map(record=>({grade:record.grade,courseId:record.courseId,officialOutcomeCount:record.outcomes.length,items:record.items,audit:record.audit,engine:record.engine})));
export const PRIMARY_TYMM_ACADEMIC_CORE_AUDIT=freeze({ok:[...BUILT.values()].every(record=>record.audit.ok),metrics:freeze({engineCount:12,officialOutcomeCount:238,itemCount:238,humanReviewStatus:'NOT_MEASURED',gameAdaptationAllowed:false})});
