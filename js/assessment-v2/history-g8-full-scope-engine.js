import { GRADE8_HISTORY_OUTCOMES_2018 } from '../curriculum/outcomes/tr-g8-inkilap-2018.js';
import { defineSubjectEngine } from './subject-engine-contract.js';
import { defineCurriculumPerformanceTask, auditCurriculumPerformanceTask, solveCurriculumPerformanceTask, verifyCurriculumPerformanceTask } from './curriculum-outcome-task-factory.js';

const TASK_KINDS = Object.freeze(['source-comparison','timeline-causality','continuity-change','historical-argument']);
const contextByKind = Object.freeze({
  'source-comparison': outcome => `Bir tarih atölyesinde “${outcome.unitName}” ünitesi için farklı dönem ve bakış açılarına ait iki kısa kaynak, bir görsel belge ve kronoloji notu incelenmektedir.`,
  'timeline-causality': outcome => `Bir müze eğitim ekibi “${outcome.unitName}” konulu sergide olayları yalnız sıralamak yerine nedenleri, dönüm noktaları ve sonuçlarıyla açıklayan bir zaman şeridi hazırlamaktadır.`,
  'continuity-change': outcome => `Bir öğrenci grubu “${outcome.unitName}” başlığında değişen koşulları, devam eden unsurları ve bunların toplum üzerindeki etkilerini karşılaştıran bir dosya hazırlamaktadır.`,
  'historical-argument': outcome => `Bir okul panelinde “${outcome.unitName}” hakkında kanıta dayalı kısa bir tarihsel değerlendirme yapılacaktır. Değerlendirme tek bir belgeye değil, birbiriyle ilişkilendirilen kaynaklara dayanmalıdır.`
});
function kindFor(outcome,index){
  const t=outcome.officialOutcomeText.toLocaleLowerCase('tr-TR');
  if(t.includes('analiz')||t.includes('değerlendir')) return index%2?'source-comparison':'historical-argument';
  if(t.includes('ilişkilendir')||t.includes('etki')) return 'continuity-change';
  return TASK_KINDS[index%TASK_KINDS.length];
}
function spec(outcome,index){
  const kind=kindFor(outcome,index);
  const criteria=kind==='source-comparison'
    ? ['Kaynakların kim tarafından, hangi amaçla ve hangi dönemde üretildiğini ayırt eder.','En az iki kaynaktaki ortak ve farklı kanıtları resmî kazanımla ilişkilendirir.','Kaynakların sınırlarını belirterek kanıta dayalı ve ölçülü bir sonuç yazar.']
    : kind==='timeline-causality'
      ? ['Olay ve gelişmeleri kronolojik olarak doğru bir sıraya yerleştirir.','En az iki neden, bir dönüm noktası ve iki sonucu kanıtlarıyla ilişkilendirir.','Aynı dönemdeki gelişmelerin birbirini nasıl etkilediğini açıklayan kısa bir sentez oluşturur.']
      : kind==='continuity-change'
        ? ['Karşılaştırılacak dönem veya durumlar için açık ölçütler belirler.','Değişen ve süreklilik gösteren unsurları ayrı kanıtlarla gösterir.','Değişimlerin siyasi, sosyal, ekonomik veya kültürel sonuçlarını tek nedene indirgemeden değerlendirir.']
        : ['Resmî kazanımla doğrudan ilişkili açık bir tarihsel iddia kurar.','İddiayı en az iki bağımsız kaynak veya veri parçasıyla destekler.','Karşı kanıtı ya da alternatif açıklamayı ele alıp sonucun sınırlarını belirtir.'];
  return {
    primarySkill:'tarihsel-kanitla-akil-yurutme',
    secondarySkills:['kronoloji','neden-sonuc','kaynak-elestirisi'],
    cognitiveProcess:'kanıtla-ilişkilendir-değerlendir',
    difficultyBand:index%3===0?'LGS_ZOR':'LGS_ORTA_ZOR',
    context:contextByKind[kind](outcome),
    stem:`${outcome.officialOutcomeText} kazanımını gösterecek biçimde verilen kaynak paketini incele ve ${kind==='timeline-causality'?'kronoloji ile neden-sonuç ilişkisini':'kanıta dayalı tarihsel değerlendirmeyi'} oluştur.`,
    criteria,
    itemFormat:kind==='timeline-causality'?'ordering':'open-response',
    responseModel:{taskKind:kind,sourceBundleRequired:true},
    hints:[
      {level:1,text:'Önce kaynakların tarihini, üreticisini ve doğrudan söylediği bilgiyi ayrı ayrı not et.',revealsAnswer:false},
      {level:2,text:'Kronoloji ile neden-sonuç ilişkisini karıştırma; önce “ne zaman?”, sonra “neden ve hangi sonuç?” sorularını yanıtla.',revealsAnswer:false},
      {level:3,text:'Sonucunu en az iki kanıta bağla ve kaynakların göstermediği bir ayrıntıyı kesin bilgi gibi yazma.',revealsAnswer:false}
    ],
    misconceptionIds:['tek-kaynakla-genelleme','kronoloji-nedensellik-karisikligi','bugunun-degerleriyle-anakronik-yargi'],
    solverId:`history-g8-${kind}-rubric-solver-v1`,
    verifierId:`history-g8-${kind}-independent-source-constraint-verifier-v1`,
    styleProfile:{genre:'historical-inquiry-task',voice:'evidence-focused-student-facing',rhetoricalMoves:['kaynağı-tanımla','kanıtı-ilişkilendir','sınırla']},
    batch:'PHASE4L_G8_HISTORY_FULL_SCOPE'
  };
}
const items=Object.freeze(GRADE8_HISTORY_OUTCOMES_2018.map((outcome,index)=>defineCurriculumPerformanceTask({id:`history-g8-${outcome.officialOutcomeCode.replaceAll('.','-')}`,outcome,...spec(outcome,index)})));
export function buildGrade8HistoryFullScopeTasks(){return items;}
export const grade8HistoryFullScopeEngine=defineSubjectEngine({
  id:'grade8-history-full-scope-engine-v1',domain:'historical-and-social-reasoning',supportedCourseIds:['t-c-inkilap-tarihi-ve-ataturkculuk'],supportedItemFormats:['open-response','ordering'],misconceptionCatalogId:'g8-history-source-reasoning-misconceptions-v1',styleCatalogId:'g8-history-inquiry-styles-v1',
  plan:request=>({questionId:request.questionId}),generate:plan=>structuredClone(items.find(item=>item.id===plan.questionId)||(()=>{throw new Error(`unknown ${plan.questionId}`)})()),solve:solveCurriculumPerformanceTask,verifyIndependent:verifyCurriculumPerformanceTask,explain:item=>item.solutionGraph,qualityAudit:auditCurriculumPerformanceTask
});
export function auditGrade8HistoryFullScopeTasks(rows=items){
  const errors=rows.flatMap(item=>auditCurriculumPerformanceTask(item).errors.map(error=>`${item.id}:${error}`));
  const outcomes=new Set(rows.flatMap(item=>item.curriculum.outcomeIds));
  if(rows.length!==33)errors.push(`item-count:${rows.length}`);if(outcomes.size!==33)errors.push(`outcome-count:${outcomes.size}`);
  for(const item of rows){const solved=grade8HistoryFullScopeEngine.solve(item);if(!grade8HistoryFullScopeEngine.verifyIndependent(item,solved))errors.push(`${item.id}:verify`);}
  return Object.freeze({ok:errors.length===0,errors:Object.freeze(errors),metrics:Object.freeze({officialOutcomeCount:33,implementedOutcomeCount:outcomes.size,itemCount:rows.length,engineeringScopeComplete:outcomes.size===33,humanReviewStatus:'NOT_MEASURED',gameAdaptationAllowed:false})});
}
export const GRADE8_HISTORY_FULL_SCOPE_AUDIT=auditGrade8HistoryFullScopeTasks();
