import { GRADE2_ENGLISH_OUTCOMES_TYMM_2025 } from '../curriculum/outcomes/tr-g2-ingilizce-tymm-2025.js';
import { GRADE3_ENGLISH_OUTCOMES_TYMM_2025 } from '../curriculum/outcomes/tr-g3-ingilizce-tymm-2025.js';
import { GRADE3_SCIENCE_OUTCOMES_TYMM_2024 } from '../curriculum/outcomes/tr-g3-fen-tymm-2024.js';
import { GRADE4_SCIENCE_OUTCOMES_2018 } from '../curriculum/outcomes/tr-g4-fen-2018.js';
import { GRADE4_DKAB_OUTCOMES_2018 } from '../curriculum/outcomes/tr-g4-dkab-2018.js';
import { GRADE4_ENGLISH_OUTCOMES_2018 } from '../curriculum/outcomes/tr-g4-ingilizce-2018.js';
import { defineSubjectEngine } from './subject-engine-contract.js';
import { defineCurriculumPerformanceTask, auditCurriculumPerformanceTask, solveCurriculumPerformanceTask, verifyCurriculumPerformanceTask } from './curriculum-outcome-task-factory.js';

const freeze=value=>Object.freeze(value);
const slug=value=>String(value).toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const three=(a,b,c)=>[a,b,c];

function englishSpec(outcome,index){
  const token=outcome.officialOutcomeCode.split('.').at(-1);const skill=token[0];
  const listening=skill==='L',speaking=['P','S'].includes(skill),receptive=['L','R','V'].includes(skill);
  const level=outcome.grade===2?'PRE_A1':outcome.grade===3?'PRE_A1_PLUS':'A1';
  return {
    primarySkill:`${level.toLowerCase()}-${skill.toLowerCase()}-communication`,secondarySkills:['meaning-focused-language-use','theme-vocabulary','interaction-or-response'],cognitiveProcess:receptive?'notice-connect-respond':'plan-say-or-write-review',difficultyBand:`G${outcome.grade}_${index%5===0?'CHALLENGING':'CORE'}`,
    context:`Grade ${outcome.grade} English task in the “${outcome.unitName}” theme. The learner uses short, concrete and age-appropriate language with visual, audio or interaction support.`,
    stem:`Complete a short communicative task that demonstrates: ${outcome.officialOutcomeText}`,
    criteria:receptive?three('Finds the required word, phrase, sound or meaning clue in the input.','Connects the clue to the communication goal instead of matching one isolated word.','Gives a short clear response without adding unsupported information.'):three('Includes every content point required by the communication goal.','Uses understandable age-appropriate words, chunks and interaction conventions.','Checks or repairs the message so another learner can follow it.'),
    itemFormat:listening||speaking?'interactive-simulation':skill==='V'?'matching':skill==='G'?'short-answer':'open-response',
    responseModel:{cefrLevel:level,skillCode:skill,theme:outcome.unitId,teacherOrHumanReviewRequired:speaking},
    media:listening?{type:'licensed-or-human-recorded-audio',status:'HUMAN_RECORDING_REQUIRED'}:speaking?{type:'child-safe-audio-response',status:'HUMAN_AUDIO_REVIEW_REQUIRED'}:{type:'accessible-visual-support',status:'REAL_ASSET_REQUIRED'},
    hints:three({level:1,text:'Look at or listen to the whole message before choosing one familiar word.',revealsAnswer:false},{level:2,text:'Match the clue with the speaker’s purpose or the picture situation.',revealsAnswer:false},{level:3,text:'Check that your answer completes the communication goal clearly.',revealsAnswer:false}),
    misconceptionIds:['single-word-match-without-meaning','communication-goal-missed','message-incomplete-or-unclear'],solverId:`english-g${outcome.grade}-${skill.toLowerCase()}-rubric-solver-v1`,verifierId:`english-g${outcome.grade}-${skill.toLowerCase()}-independent-verifier-v1`,styleProfile:{genre:`grade${outcome.grade}-communicative-english`,voice:'very-short-concrete-child-friendly',rhetoricalMoves:['notice','connect','respond']},batch:`PHASE4T_G${outcome.grade}_ENGLISH_BRIDGE`
  };
}

function scienceSpec(outcome,index){
  const text=outcome.officialOutcomeText.toLocaleLowerCase('tr-TR');const experiment=/deney|gözlem|model|tasarla|oluştur/.test(text);
  return {primarySkill:'erken-bilimsel-muhakeme',secondarySkills:['gözlem','kanıt-kullanma','modelleme'],cognitiveProcess:'gözle-sınıflandır-açıkla-kontrol-et',difficultyBand:`G${outcome.grade}_${index%4===0?'CHALLENGING':'CORE'}`,
    context:`${outcome.grade}. sınıf Fen Bilimleri çalışmasında “${outcome.unitName}” için güvenli bir gözlem, basit deney, model, görsel veya veri kartı kullanılır.`,stem:`${outcome.officialOutcomeText} öğrenme çıktısını gösterecek gözlem, model veya açıklamayı oluştur.`,
    criteria:three('Gözlenebilir özellikleri ve görevin koşullarını doğru belirler.','Kanıtı uygun sınıflandırma, model veya neden-sonuç ilişkisiyle açıklar.','Sonucunu ikinci gözlem, karşılaştırma veya basit kontrol yoluyla gözden geçirir.'),itemFormat:experiment?'interactive-simulation':'open-response',responseModel:{taskKind:experiment?'guided-observation-or-model':'evidence-explanation',adultSafetySupervisionRequired:/deney/.test(text)},media:experiment?{type:'primary-science-safe-workspace',status:'HUMAN_SAFETY_AND_ASSET_REVIEW_REQUIRED'}:null,
    hints:three({level:1,text:'Önce yalnız görebildiğin, ölçebildiğin veya verilen kartta bulunan kanıtları ayır.',revealsAnswer:false},{level:2,text:'Benzerlik, farklılık ya da neden-sonuç ilişkisinden hangisinin istendiğini belirle.',revealsAnswer:false},{level:3,text:'Sonucunu başka bir gözlem veya karşılaştırmayla kontrol et.',revealsAnswer:false}),misconceptionIds:['gözlem-yerine-tahmin-yazma','tek-özellikten-genelleme','modeli-gerçeğin-tam-kopyası-sanma'],solverId:`science-g${outcome.grade}-primary-evidence-solver-v1`,verifierId:`science-g${outcome.grade}-independent-observation-verifier-v1`,styleProfile:{genre:`grade${outcome.grade}-primary-science-inquiry`,voice:'concrete-curious-child-friendly',rhetoricalMoves:['gözle','karşılaştır','açıkla']},batch:`PHASE4T_G${outcome.grade}_SCIENCE_BRIDGE`};
}

function dkabSpec(outcome,index){
  const text=outcome.officialOutcomeText.toLocaleLowerCase('tr-TR');const visual=/cami|mimari|görsel|gözlem/.test(text);
  return {primarySkill:'temel-dinî-ve-ahlaki-muhakeme',secondarySkills:['kavram-iliskisi','metin-kanıtı','saygılı-iletişim'],cognitiveProcess:'anla-örneklendir-gerekçelendir',difficultyBand:`G4_${index%4===0?'CHALLENGING':'CORE'}`,
    context:`4. sınıf Din Kültürü ve Ahlak Bilgisi çalışmasında “${outcome.unitName}” için kısa, tarafsız ve programla sınırlı metin, kavram kartı, görsel veya günlük yaşam durumu verilir.`,stem:`${outcome.officialOutcomeText} kazanımını gösterecek biçimde yanıtını oluştur ve gerekçeni materyaldeki kanıta bağla.`,criteria:three('Metin, kavram veya görseldeki ana bilgiyi doğru belirler.','Bilgiyi programdaki kavram ve günlük yaşam örneğiyle ilişkilendirir.','Gerekçesini saygılı, tarafsız ve materyalin sınırları içinde açıklar.'),itemFormat:/sınıflandır|eşleştir|tanır/.test(text)?'matching':'open-response',responseModel:{taskKind:'primary-curriculum-bound-reasoning',neutralAndCurriculumBound:true},media:visual?{type:'licensed-cultural-visual',status:'PROVENANCE_REVIEW_REQUIRED'}:null,
    hints:three({level:1,text:'Metindeki ya da görseldeki ana kavramı bul.',revealsAnswer:false},{level:2,text:'Bu kavramın günlük yaşamda hangi davranış veya örnekle ilişkili olduğunu düşün.',revealsAnswer:false},{level:3,text:'Cevabında yalnız verilen materyalin desteklediği gerekçeyi kullan.',revealsAnswer:false}),misconceptionIds:['kavramları-karıştırma','metni-bağlamından-koparma','gerekçesiz-değer-yargısı'],solverId:'dkab-g4-primary-curriculum-solver-v1',verifierId:'dkab-g4-independent-evidence-verifier-v1',styleProfile:{genre:'grade4-religious-cultural-reasoning',voice:'neutral-respectful-child-friendly',rhetoricalMoves:['anla','ilişkilendir','gerekçelendir']},batch:'PHASE4T_G4_DKAB_BRIDGE'};
}

const DEFINITIONS=[
  [2,'yabanci-dil',GRADE2_ENGLISH_OUTCOMES_TYMM_2025,englishSpec],
  [3,'yabanci-dil',GRADE3_ENGLISH_OUTCOMES_TYMM_2025,englishSpec],
  [3,'fen-bilimleri',GRADE3_SCIENCE_OUTCOMES_TYMM_2024,scienceSpec],
  [4,'fen-bilimleri',GRADE4_SCIENCE_OUTCOMES_2018,scienceSpec],
  [4,'din-kulturu-ve-ahlak-bilgisi',GRADE4_DKAB_OUTCOMES_2018,dkabSpec],
  [4,'yabanci-dil',GRADE4_ENGLISH_OUTCOMES_2018,englishSpec]
];
function buildTasks(grade,courseId,outcomes,spec){return freeze(outcomes.map((outcome,index)=>defineCurriculumPerformanceTask({id:`${slug(courseId)}-g${grade}-${slug(outcome.officialOutcomeCode)}`,outcome,...spec(outcome,index)})));}
function makeEngine(grade,courseId,items){return defineSubjectEngine({id:`grade${grade}-${slug(courseId)}-primary-bridge-engine-v1`,domain:`grade${grade}-${slug(courseId)}-primary-domain`,supportedCourseIds:[courseId],supportedItemFormats:[...new Set(items.map(x=>x.itemFormat))],misconceptionCatalogId:`g${grade}-${slug(courseId)}-primary-misconceptions-v1`,styleCatalogId:`g${grade}-${slug(courseId)}-primary-styles-v1`,plan:r=>({questionId:r.questionId}),generate:p=>structuredClone(items.find(i=>i.id===p.questionId)||(()=>{throw new Error(`unknown ${p.questionId}`)})()),solve:solveCurriculumPerformanceTask,verifyIndependent:verifyCurriculumPerformanceTask,explain:i=>i.solutionGraph,qualityAudit:auditCurriculumPerformanceTask});}
function audit(items,engine,expected){const errors=items.flatMap(i=>auditCurriculumPerformanceTask(i).errors.map(e=>`${i.id}:${e}`));if(items.length!==expected)errors.push(`item-count:${items.length}`);if(new Set(items.flatMap(i=>i.curriculum.outcomeIds)).size!==expected)errors.push('outcome-count');for(const item of items)if(!engine.verifyIndependent(item,engine.solve(item)))errors.push(`${item.id}:verify`);return freeze({ok:errors.length===0,errors:freeze(errors),metrics:freeze({officialOutcomeCount:expected,implementedOutcomeCount:expected,itemCount:items.length,humanReviewStatus:'NOT_MEASURED',gameAdaptationAllowed:false})});}
const BUILT=new Map(DEFINITIONS.map(([grade,courseId,outcomes,spec])=>{const items=buildTasks(grade,courseId,outcomes,spec),engine=makeEngine(grade,courseId,items);return [`${grade}:${courseId}`,{grade,courseId,outcomes,items,engine,audit:audit(items,engine,outcomes.length)}];}));

export function buildGrade2EnglishPrimaryBridgeTasks(){return BUILT.get('2:yabanci-dil').items;}
export function buildGrade3EnglishPrimaryBridgeTasks(){return BUILT.get('3:yabanci-dil').items;}
export function buildGrade3SciencePrimaryBridgeTasks(){return BUILT.get('3:fen-bilimleri').items;}
export function buildGrade4SciencePrimaryBridgeTasks(){return BUILT.get('4:fen-bilimleri').items;}
export function buildGrade4DkabPrimaryBridgeTasks(){return BUILT.get('4:din-kulturu-ve-ahlak-bilgisi').items;}
export function buildGrade4EnglishPrimaryBridgeTasks(){return BUILT.get('4:yabanci-dil').items;}
export function buildPrimaryBridgeCoreTasks(){return freeze([...BUILT.values()].flatMap(x=>x.items));}
export const PRIMARY_BRIDGE_ENGINE_RECORDS=freeze([...BUILT.values()].map(x=>({grade:x.grade,courseId:x.courseId,officialOutcomeCount:x.outcomes.length,items:x.items,audit:x.audit,engine:x.engine})));
export const PRIMARY_BRIDGE_CORE_AUDIT=freeze({ok:[...BUILT.values()].every(x=>x.audit.ok),metrics:freeze({engineCount:6,officialOutcomeCount:405,itemCount:405,humanReviewStatus:'NOT_MEASURED',gameAdaptationAllowed:false})});
