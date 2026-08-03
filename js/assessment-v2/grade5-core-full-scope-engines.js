import { GRADE5_MATH_OUTCOMES_TYMM_2024 } from '../curriculum/outcomes/tr-g5-matematik-tymm-2024.js';
import { GRADE5_SCIENCE_OUTCOMES_TYMM_2024 } from '../curriculum/outcomes/tr-g5-fen-tymm-2024.js';
import { GRADE5_SOCIAL_OUTCOMES_TYMM_2024 } from '../curriculum/outcomes/tr-g5-sosyal-tymm-2024.js';
import { GRADE5_DKAB_OUTCOMES_TYMM_2024 } from '../curriculum/outcomes/tr-g5-dkab-tymm-2024.js';
import { GRADE5_ENGLISH_OUTCOMES_TYMM_2025 } from '../curriculum/outcomes/tr-g5-ingilizce-tymm-2025.js';
import { defineSubjectEngine } from './subject-engine-contract.js';
import { defineCurriculumPerformanceTask, auditCurriculumPerformanceTask, solveCurriculumPerformanceTask, verifyCurriculumPerformanceTask } from './curriculum-outcome-task-factory.js';

const freeze=value=>Object.freeze(value);
const slug=value=>String(value).toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

function mathSpec(outcome,index){
  const text=outcome.officialOutcomeText.toLocaleLowerCase('tr-TR');
  const construction=/çizim|araç|teknoloji|model/.test(text);
  const data=/istatistik|veri|olasılık/.test(text);
  const geometry=/geometr|açı|çokgen|çember|dikdörtgen|alan|çevre/.test(text);
  const kind=construction?'interactive-construction':data?'data-and-probability':'worked-reasoning';
  const criteria=construction
    ? ['Matematiksel aracı amaca uygun ve ölçülü biçimde kullanır.','Oluşturduğu şekil ya da modeli kazanımdaki koşullara göre doğrular.','İşlem veya çizim basamaklarını gerekçelendirip sonucu kontrol eder.']
    : data
      ? ['Verilen veri veya olasılık durumundaki nicelikleri ve koşulları doğru belirler.','Uygun temsil, karşılaştırma veya hesaplama yolunu seçip uygular.','Sonucu bağlama göre yorumlar ve farklı bir kontrol yoluyla doğrular.']
      : ['Problemin verilenlerini, istenenini ve aralarındaki matematiksel ilişkiyi belirler.','Uygun işlem, temsil veya muhakeme zincirini hatasız uygular.','Bulduğu sonucu tahmin, ters işlem veya alternatif temsil ile doğrular.'];
  return {
    primarySkill:geometry?'geometrik-muhakeme':'matematiksel-muhakeme',secondarySkills:['problem-çözme','temsil-etme','sonucu-doğrulama'],cognitiveProcess:'anla-modelle-çöz-doğrula',difficultyBand:index%4===0?'G5_CHALLENGING':'G5_CORE',
    context:`5. sınıf matematik atölyesinde “${outcome.unitName}” teması için gerçek yaşam, sayı, şekil veya veri temelli bir durum incelenmektedir.`,
    stem:`${outcome.officialOutcomeText} öğrenme çıktısını gösterecek biçimde problemi çöz, kullandığın yöntemi açıkla ve sonucunu bağımsız bir kontrolle doğrula.`,criteria,itemFormat:construction?'interactive-simulation':data?'open-response':'short-answer',responseModel:{taskKind:kind,mathematicalToolsRequired:construction,independentCheckRequired:true},
    hints:[{level:1,text:'Önce verilenleri, isteneni ve değişmeyen koşulları ayrı ayrı yaz.',revealsAnswer:false},{level:2,text:'İşleme başlamadan önce uygun tablo, şekil, sayı doğrusu veya eşitlik temsilini seç.',revealsAnswer:false},{level:3,text:'Sonucu ters işlem, tahmin veya ikinci bir temsil kullanarak kontrol et.',revealsAnswer:false}],
    misconceptionIds:['işlem-seçimini-gerekçelendirmeme','temsil-ile-koşulu-karıştırma','sonucu-kontrol-etmeden-kabul-etme'],solverId:`math-g5-${kind}-solver-v1`,verifierId:`math-g5-${kind}-independent-verifier-v1`,styleProfile:{genre:'grade5-mathematical-investigation',voice:'clear-age-appropriate',rhetoricalMoves:['modelle','çöz','doğrula']},batch:'PHASE4R_G5_MATH_FULL_SCOPE'
  };
}

function scienceSpec(outcome,index){
  const text=outcome.officialOutcomeText.toLocaleLowerCase('tr-TR');
  const kind=/deney/.test(text)?'experiment':/model/.test(text)?'model':/gözlem|tahmin/.test(text)?'observation':'evidence-explanation';
  const itemFormat=['experiment','model'].includes(kind)?'interactive-simulation':'open-response';
  const criteria=kind==='experiment'
    ? ['Araştırma sorusunu ve değişkenleri açık biçimde belirler.','Güvenli ve tekrarlanabilir deney basamakları ile veri kayıt planı oluşturur.','Veriyi iddiayla ilişkilendirir, hata kaynaklarını ve sonucun sınırlarını belirtir.']
    : kind==='model'
      ? ['Modelin göstereceği yapı, ilişki veya süreci doğru seçer.','Model parçaları arasındaki ilişkiyi resmî öğrenme çıktısına uygun kurar.','Modelin güçlü yanlarını ve gerçeği temsil etmediği sınırlarını açıklar.']
      : ['Gözlem veya veri içindeki ilgili kanıtları ayırt eder.','Kanıtlardan bilimsel ilke veya nedensel ilişkiye ulaşır.','Sonucu desteklemeyen genellemelerden kaçınır ve alternatif açıklamayı kontrol eder.'];
  return {primarySkill:'bilimsel-muhakeme',secondarySkills:['kanıt-kullanma','değişken-kontrolü','modelleme'],cognitiveProcess:'sorgula-kanıtla-açıkla',difficultyBand:index%4===0?'G5_CHALLENGING':'G5_CORE',context:`Bir bilim atölyesinde “${outcome.unitName}” ünitesi için gözlem, deney, model veya veri paketi üzerinde çalışılmaktadır.`,stem:`${outcome.officialOutcomeText} öğrenme çıktısını gösterecek bilimsel ürünü oluştur ve iddianı kanıtlarla gerekçelendir.`,criteria,itemFormat,responseModel:{taskKind:kind,safetyCheckRequired:kind==='experiment',evidenceRequired:true},media:['experiment','model'].includes(kind)?{type:`${kind}-workspace`,status:'INTERACTIVE_COMPONENT_REQUIRED'}:null,hints:[{level:1,text:'Önce araştırılan olay, değişkenler ve gözlenebilir kanıtları ayır.',revealsAnswer:false},{level:2,text:'İddianı yalnız gözlem, veri veya modelde gerçekten gösterilen ilişkilere bağla.',revealsAnswer:false},{level:3,text:'Sonucun hangi koşullarda geçerli olduğunu ve olası hata kaynağını kontrol et.',revealsAnswer:false}],misconceptionIds:['gözlem-ile-yorumu-karıştırma','değişkenleri-kontrol-etmeme','tek-veriden-genelleme'],solverId:`science-g5-${kind}-rubric-solver-v1`,verifierId:`science-g5-${kind}-independent-evidence-verifier-v1`,styleProfile:{genre:'grade5-scientific-inquiry',voice:'curious-precise-age-appropriate',rhetoricalMoves:['sor','kanıt-topla','açıkla']},batch:'PHASE4R_G5_SCIENCE_FULL_SCOPE'};
}

function socialSpec(outcome,index){
  const text=outcome.officialOutcomeText.toLocaleLowerCase('tr-TR');
  const kind=/harita|konum/.test(text)?'map-reading':/kanıt|araştır|kaynak/.test(text)?'source-inquiry':/ürün|katkı|fikir/.test(text)?'civic-project':'social-reasoning';
  const criteria=kind==='map-reading'
    ? ['Haritadaki yön, sembol, ölçek veya göreceli konum bilgisini doğru okur.','Harita kanıtını yaşadığı çevre veya verilen durumla ilişkilendirir.','Haritada gösterilmeyen bir ayrıntıyı kesin bilgi gibi eklemeden sonuç çıkarır.']
    : kind==='source-inquiry'
      ? ['Kaynağın kim tarafından, ne zaman ve hangi amaçla üretildiğini belirler.','En az iki kanıtı karşılaştırarak ortak ve farklı noktaları gösterir.','Kaynağın sınırlarını belirterek ölçülü ve gerekçeli sonuç oluşturur.']
      : kind==='civic-project'
        ? ['Sorun veya ihtiyacı ilgili kişi ve grupların bakış açılarıyla tanımlar.','Hak, sorumluluk ve uygulanabilir kaynakları gözeten çözüm önerir.','Önerinin etkisini değerlendirecek ölçüt ve geri bildirim planı oluşturur.']
        : ['Toplumsal durumdaki kişi, kurum, rol ve ilişkileri ayırt eder.','Neden, sonuç, değişim veya süreklilik ilişkisini kanıtla açıklar.','Farklı bakış açılarını dikkate alarak saygılı ve uygulanabilir sonuç oluşturur.'];
  return {primarySkill:'sosyal-bilimsel-muhakeme',secondarySkills:['kanıta-dayalı-sorgulama','harita-ve-kaynak-okuma','sosyal-katılım'],cognitiveProcess:'incele-ilişkilendir-değerlendir',difficultyBand:index%4===0?'G5_CHALLENGING':'G5_CORE',context:`Bir sosyal bilgiler laboratuvarında “${outcome.unitName}” öğrenme alanıyla ilgili harita, kısa kaynak, tablo, görsel veya günlük yaşam durumu incelenmektedir.`,stem:`${outcome.officialOutcomeText} öğrenme çıktısını gösterecek biçimde materyalleri incele ve kanıta dayalı ürününü oluştur.`,criteria,itemFormat:kind==='map-reading'?'interactive-simulation':'open-response',responseModel:{taskKind:kind,sourceBundleRequired:kind==='source-inquiry'},media:kind==='map-reading'?{type:'accessible-map-workspace',status:'REAL_MAP_ASSET_REQUIRED'}:null,hints:[{level:1,text:'Önce materyalin doğrudan gösterdiği kişi, yer, zaman ve kanıtları not et.',revealsAnswer:false},{level:2,text:'Neden-sonuç, değişim-süreklilik veya hak-sorumluluk ilişkilerinden hangisinin istendiğini belirle.',revealsAnswer:false},{level:3,text:'Sonucunu en az iki kanıtla destekle ve materyalin göstermediği bilgiyi ekleme.',revealsAnswer:false}],misconceptionIds:['tek-kaynaktan-genelleme','harita-sembolünü-yanlış-okuma','hak-sorumluluk-dengesini-atlama'],solverId:`social-g5-${kind}-rubric-solver-v1`,verifierId:`social-g5-${kind}-independent-source-verifier-v1`,styleProfile:{genre:'grade5-social-inquiry',voice:'balanced-student-facing',rhetoricalMoves:['kanıtı-tanı','ilişki-kur','değerlendir']},batch:'PHASE4R_G5_SOCIAL_FULL_SCOPE'};
}

function dkabSpec(outcome,index){
  const text=outcome.officialOutcomeText.toLocaleLowerCase('tr-TR');
  const kind=/sure|dua|kur’an/.test(text)?'text-meaning':/gözlem|mimari|cami/.test(text)?'culture-observation':/sınıflandır|tanı/.test(text)?'concept-map':'ethical-reasoning';
  const criteria=kind==='text-meaning'
    ? ['Verilen meal veya açıklamadaki ana mesajı bağlamından koparmadan belirler.','Mesajı öğrenme çıktısındaki kavramlarla doğru biçimde ilişkilendirir.','Metinde bulunmayan hüküm eklemeden günlük yaşam bağlantısı kurar.']
    : kind==='culture-observation'
      ? ['Görsel veya gözlemdeki dinî-kültürel unsurları doğru adlandırır.','Unsurların işlevi, anlamı ve kültürle ilişkisini kanıtla açıklar.','Farklı örnekleri saygılı ve ölçütlü biçimde karşılaştırır.']
      : kind==='concept-map'
        ? ['Temel kavramları doğru ve tarafsız biçimde açıklar.','Kavramlar arasında parça-bütün, sınıf-örnek veya neden-sonuç ilişkisi kurar.','Yaygın bir kavram yanılgısını gerekçesiyle düzeltir.']
        : ['Durumdaki değer, hak ve sorumlulukları belirler.','Görüşünü ilgili dinî veya ahlaki ilke ve somut kanıtla gerekçelendirir.','Farklı bakış açısını saygıyla ele alıp uygulanabilir sonuç önerir.'];
  return {primarySkill:'dinî-ve-ahlaki-muhakeme',secondarySkills:['metin-kanıtı','kavram-iliskisi','kültür-okuryazarlığı'],cognitiveProcess:'anla-ilişkilendir-gerekçelendir',difficultyBand:index%4===0?'G5_CHALLENGING':'G5_CORE',context:`“${outcome.unitName}” ünitesi için yaş düzeyine uygun kısa metin, görsel, kavram haritası veya günlük yaşam durumu verilmektedir.`,stem:`${outcome.officialOutcomeText} öğrenme çıktısını gösterecek biçimde materyali incele ve gerekçeli yanıtını oluştur.`,criteria,itemFormat:kind==='concept-map'?'matching':'open-response',responseModel:{taskKind:kind,neutralAndCurriculumBound:true},media:kind==='culture-observation'?{type:'licensed-cultural-visual-bundle',status:'PROVENANCE_REVIEW_REQUIRED'}:null,hints:[{level:1,text:'Önce metin veya görselde açıkça verilen bilgi ve kavramları ayır.',revealsAnswer:false},{level:2,text:'Kavramlar arasındaki ilişkiyi öğrenme çıktısının sınırları içinde kur.',revealsAnswer:false},{level:3,text:'Gerekçenin verilen metin, görsel veya ilkeyle desteklendiğini kontrol et.',revealsAnswer:false}],misconceptionIds:['metni-baglamindan-koparma','kavramlari-karistirma','gerekcesiz-deger-yargisi'],solverId:`dkab-g5-${kind}-rubric-solver-v1`,verifierId:`dkab-g5-${kind}-independent-evidence-verifier-v1`,styleProfile:{genre:'grade5-religious-cultural-reasoning',voice:'neutral-respectful-age-appropriate',rhetoricalMoves:['anla','ilişkilendir','gerekçelendir']},batch:'PHASE4R_G5_DKAB_FULL_SCOPE'};
}

const ENGLISH_THEME_CONTEXT=Object.freeze({1:'school life, people, places, rules, clubs, countries and celebrations',2:'classroom rules, subjects, timetables, objects, days and time',3:'body parts, physical features, clothes and daily routines',4:'family routines, hobbies and activities',5:'places, attractions and houses in the neighbourhood and city',6:'food, restaurant language and food events',7:'animals, habitats and life in nature',8:'planet Earth, holidays, activities and future plans'});
function englishSpec(outcome,index){
  const code=outcome.officialOutcomeCode; const token=code.split('.').at(-1); const skill=token[0]; const theme=Number(code.split('.')[2]);
  const config={
    L:{format:'interactive-simulation',primary:'a2-listening-comprehension',media:{type:'audio-recording',status:'HUMAN_RECORDING_REQUIRED'}},
    P:{format:'interactive-simulation',primary:'a2-pronunciation-and-phonology',media:{type:'audio-recording-and-response',status:'HUMAN_RECORDING_REQUIRED'}},
    R:{format:'open-response',primary:'a2-reading-comprehension'},V:{format:'matching',primary:'a2-vocabulary-in-context'},G:{format:'short-answer',primary:'a2-grammar-in-communication'},W:{format:'open-response',primary:'a2-writing'},S:{format:'interactive-simulation',primary:'a2-speaking',media:{type:'audio-response',status:'HUMAN_AUDIO_REVIEW_REQUIRED'}}
  }[skill];
  const receptive=['L','R'].includes(skill);
  const criteria=receptive
    ? ['Identifies the topic, communication goal and required details in the A2-level input.','Connects two relevant clues when classification, comparison or inference is required.','Responds clearly without adding information that the input does not support.']
    : skill==='V'||skill==='G'
      ? ['Selects the target language element according to meaning and context.','Uses the element in an accurate and understandable A2-level example.','Checks that form, meaning and communicative purpose agree.']
      : ['Plans all content points required by the communication goal.','Uses understandable A2.1 vocabulary, structures and interaction conventions.','Reviews or repairs the message so that the listener or reader can follow it.'];
  return {primarySkill:config.primary,secondarySkills:['a2-communicative-function','theme-vocabulary','meaning-focused-accuracy'],cognitiveProcess:receptive?'prepare-connect-respond':'plan-communicate-review',difficultyBand:index%5===0?'A2_1_CHALLENGING':'A2_1_CORE',context:`Year 5 A2.1 communication task about ${ENGLISH_THEME_CONTEXT[theme]}.`,stem:`Complete a short age-appropriate A2.1 task that demonstrates this learning outcome: ${outcome.officialOutcomeText}`,criteria,itemFormat:config.format,responseModel:{cefrLevel:'A2.1',skillCode:skill,theme,themeName:outcome.unitName},media:config.media||null,hints:[{level:1,text:'Focus on the communication goal and identify the key words or details.',revealsAnswer:false},{level:2,text:'Use short, clear A2.1 language and the useful expressions from this theme.',revealsAnswer:false},{level:3,text:'Check that every required detail is present and that the message is understandable.',revealsAnswer:false}],misconceptionIds:['task-goal-missed','word-match-without-meaning','message-incomplete-or-unclear'],solverId:`english-g5-${skill.toLowerCase()}-rubric-solver-v1`,verifierId:`english-g5-${skill.toLowerCase()}-independent-a2-1-verifier-v1`,styleProfile:{genre:'a2-1-communicative-task',voice:'simple-english-age-appropriate',rhetoricalMoves:['understand-goal','communicate','check-message']},batch:'PHASE4R_G5_ENGLISH_FULL_SCOPE'};
}

function buildTasks(prefix,outcomes,spec){return freeze(outcomes.map((outcome,index)=>defineCurriculumPerformanceTask({id:`${prefix}-${slug(outcome.officialOutcomeCode)}`,outcome,...spec(outcome,index)})));}
function makeEngine({id,domain,courseId,formats,misconceptions,styles,items}){return defineSubjectEngine({id,domain,supportedCourseIds:[courseId],supportedItemFormats:formats,misconceptionCatalogId:misconceptions,styleCatalogId:styles,plan:request=>({questionId:request.questionId}),generate:plan=>structuredClone(items.find(item=>item.id===plan.questionId)||(()=>{throw new Error(`unknown ${plan.questionId}`)})()),solve:solveCurriculumPerformanceTask,verifyIndependent:verifyCurriculumPerformanceTask,explain:item=>item.solutionGraph,qualityAudit:auditCurriculumPerformanceTask});}
function audit(rows,engine,expected){const errors=rows.flatMap(item=>auditCurriculumPerformanceTask(item).errors.map(error=>`${item.id}:${error}`));const outcomes=new Set(rows.flatMap(item=>item.curriculum.outcomeIds));if(rows.length!==expected)errors.push(`item-count:${rows.length}`);if(outcomes.size!==expected)errors.push(`outcome-count:${outcomes.size}`);for(const item of rows){const solved=engine.solve(item);if(!engine.verifyIndependent(item,solved))errors.push(`${item.id}:verify`);}return freeze({ok:errors.length===0,errors:freeze(errors),metrics:freeze({officialOutcomeCount:expected,implementedOutcomeCount:outcomes.size,itemCount:rows.length,engineeringScopeComplete:outcomes.size===expected,humanReviewStatus:'NOT_MEASURED',gameAdaptationAllowed:false})});}

const mathItems=buildTasks('math-g5',GRADE5_MATH_OUTCOMES_TYMM_2024,mathSpec);
const scienceItems=buildTasks('science-g5',GRADE5_SCIENCE_OUTCOMES_TYMM_2024,scienceSpec);
const socialItems=buildTasks('social-g5',GRADE5_SOCIAL_OUTCOMES_TYMM_2024,socialSpec);
const dkabItems=buildTasks('dkab-g5',GRADE5_DKAB_OUTCOMES_TYMM_2024,dkabSpec);
const englishItems=buildTasks('english-g5',GRADE5_ENGLISH_OUTCOMES_TYMM_2025,englishSpec);

export function buildGrade5MathFullScopeTasks(){return mathItems;} export function buildGrade5ScienceFullScopeTasks(){return scienceItems;} export function buildGrade5SocialFullScopeTasks(){return socialItems;} export function buildGrade5DkabFullScopeTasks(){return dkabItems;} export function buildGrade5EnglishFullScopeTasks(){return englishItems;}
export const grade5MathFullScopeEngine=makeEngine({id:'grade5-math-full-scope-engine-v1',domain:'grade5-mathematical-reasoning',courseId:'matematik',formats:['short-answer','open-response','interactive-simulation'],misconceptions:'g5-math-misconceptions-v1',styles:'g5-math-task-styles-v1',items:mathItems});
export const grade5ScienceFullScopeEngine=makeEngine({id:'grade5-science-full-scope-engine-v1',domain:'grade5-scientific-inquiry',courseId:'fen-bilimleri',formats:['open-response','interactive-simulation'],misconceptions:'g5-science-inquiry-misconceptions-v1',styles:'g5-science-task-styles-v1',items:scienceItems});
export const grade5SocialFullScopeEngine=makeEngine({id:'grade5-social-full-scope-engine-v1',domain:'grade5-social-inquiry',courseId:'sosyal-bilgiler',formats:['open-response','interactive-simulation'],misconceptions:'g5-social-evidence-misconceptions-v1',styles:'g5-social-inquiry-styles-v1',items:socialItems});
export const grade5DkabFullScopeEngine=makeEngine({id:'grade5-dkab-full-scope-engine-v1',domain:'grade5-religious-cultural-reasoning',courseId:'din-kulturu-ve-ahlak-bilgisi',formats:['open-response','matching'],misconceptions:'g5-dkab-curriculum-misconceptions-v1',styles:'g5-dkab-neutral-styles-v1',items:dkabItems});
export const grade5EnglishFullScopeEngine=makeEngine({id:'grade5-english-full-scope-engine-v1',domain:'cefr-a2-1-communicative-language',courseId:'yabanci-dil',formats:['open-response','interactive-simulation','matching','short-answer'],misconceptions:'g5-english-a2-1-misconceptions-v1',styles:'g5-english-a2-1-styles-v1',items:englishItems});

export const GRADE5_MATH_FULL_SCOPE_AUDIT=audit(mathItems,grade5MathFullScopeEngine,23);
export const GRADE5_SCIENCE_FULL_SCOPE_AUDIT=audit(scienceItems,grade5ScienceFullScopeEngine,28);
export const GRADE5_SOCIAL_FULL_SCOPE_AUDIT=audit(socialItems,grade5SocialFullScopeEngine,19);
export const GRADE5_DKAB_FULL_SCOPE_AUDIT=audit(dkabItems,grade5DkabFullScopeEngine,18);
export const GRADE5_ENGLISH_FULL_SCOPE_AUDIT=audit(englishItems,grade5EnglishFullScopeEngine,184);
export const GRADE5_CORE_FULL_SCOPE_AUDIT=freeze({ok:[GRADE5_MATH_FULL_SCOPE_AUDIT,GRADE5_SCIENCE_FULL_SCOPE_AUDIT,GRADE5_SOCIAL_FULL_SCOPE_AUDIT,GRADE5_DKAB_FULL_SCOPE_AUDIT,GRADE5_ENGLISH_FULL_SCOPE_AUDIT].every(x=>x.ok),metrics:freeze({engineCount:5,officialOutcomeCount:272,itemCount:mathItems.length+scienceItems.length+socialItems.length+dkabItems.length+englishItems.length,gameAdaptationAllowed:false,humanReviewStatus:'NOT_MEASURED'})});
