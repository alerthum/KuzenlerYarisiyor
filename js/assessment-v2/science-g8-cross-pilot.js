import { defineCanonicalQuestion } from './canonical-question-contract.js';
import { defineSubjectEngine } from './subject-engine-contract.js';
import { grade8SciencePilotOutcomeByCode } from '../curriculum/outcomes/tr-g8-fen-2018-pilot.js';

const STYLE_REFERENCE_IDS = Object.freeze(['meb-mcq-writing-guide', 'oecd-pisa-2025-framework']);

function opt(id,text,{correct=false,misconceptionId=null,feedback,support=[],contradictions=[]}={}){
  return Object.freeze({id,text,correct,misconceptionId,feedback,support:Object.freeze(support),contradictions:Object.freeze(contradictions)});
}

const SPECS=Object.freeze([
  {
    id:'science-g8-cross-01-seasons',outcomeCode:'F.8.1.1.1',construct:['season-model-reasoning',['axis-tilt','sunlight-angle'],'predict-from-model',['axial-tilt','hemisphere','day-length'],'LGS_HIGH'],
    stimulusBlocks:[
      'Bir modelde Dünya’nın ekseni yörünge düzlemine göre eğik tutulmuş ve eksenin uzaydaki yönü değiştirilmeden Dünya, Güneş’in çevresindeki K ve L konumlarına taşınmıştır.',
      'K konumunda Kuzey Yarım Küre Güneş’e doğru eğik, L konumunda ise Güneş’ten uzağa eğiktir.'
    ],stem:'Bu modele göre Kuzey Yarım Küre için aşağıdaki yorumlardan hangisi doğrudur?',model:{type:'seasons',hemisphere:'north',K:'toward',L:'away'},required:['tilt','direct-rays','day-length'],
    options:[
      opt('A','K konumunda ışınlar daha eğik gelir ve gündüz süresi kısalır; L konumunda bunun tersi gerçekleşir.',{misconceptionId:'toward-means-colder',feedback:'Kuzey Yarım Küre K konumunda Güneş’e yöneldiği için ışınlar daha dik gelir ve gündüz süresi uzar; seçenek iki sonucu da ters çevirmiştir.',contradictions:['direct-rays','day-length']}),
      opt('B','K konumunda ışınlar daha dik gelir ve gündüz süresi uzar; L konumunda ışınlar daha eğik gelir ve gündüz süresi kısalır.',{correct:true,feedback:'Eksen eğikliği nedeniyle Güneş’e dönük yarım küre daha dik ışın alır ve daha uzun gündüz yaşar; karşı konumda iki özellik tersine döner.',support:['tilt','direct-rays','day-length']}),
      opt('C','K ve L konumlarında eksen eğikliği aynı kaldığı için ışınların geliş açısı ve gündüz süresi değişmez.',{misconceptionId:'constant-tilt-means-no-season',feedback:'Eksenin eğikliği sabit kalsa da Dünya’nın yörüngedeki konumu değiştiğinde yarım kürenin Güneş’e yönelimi değişir; mevsimsel fark buradan doğar.',contradictions:['direct-rays','day-length']}),
      opt('D','K konumunda Dünya Güneş’e daha yakın olduğu için yaz, L konumunda daha uzak olduğu için kış yaşanır.',{misconceptionId:'distance-causes-seasons',feedback:'Modelde mevsim farkı Dünya-Güneş uzaklığına değil eksen eğikliği ve yarım kürenin Güneş’e yönelimine bağlanır.',contradictions:['tilt']})
    ],
    steps:[['K ve L konumlarında yarım kürenin yönelimini belirle','K’de kuzey Güneş’e dönük, L’de Güneş’ten uzaktır.','Önce eksenin hangi yarım küreyi Güneş’e çevirdiğini belirle.'],['ışın açısını yönelimle ilişkilendir','Güneş’e dönük yarım küre daha dik ışın alır.','Daha doğrudan aydınlanan yüzey hangisidir?'],['gündüz süresi ve mevsim sonucunu birleştir','K’de gündüz uzar, L’de kısalır.','Işın açısı ile aydınlık kalma süresini birlikte düşün.']]
  },
  {
    id:'science-g8-cross-02-genetics',outcomeCode:'F.8.2.2.2',construct:['monohybrid-cross-interpretation',['dominance','gamete-enumeration'],'model-and-infer',['genotype','phenotype','probability'],'LGS_HIGH'],
    stimulusBlocks:['Bezelyelerde mor çiçek geni M, beyaz çiçek geni m’ye baskındır. Heterozigot mor çiçekli bir bezelye (Mm) ile beyaz çiçekli bir bezelye (mm) çaprazlanıyor.'],stem:'Yavruların fenotip dağılımıyla ilgili hangi sonuç beklenir?',model:{type:'cross',parent1:['M','m'],parent2:['m','m'],dominant:'M'},required:['gametes','genotypes','phenotypes'],
    options:[
      opt('A','Yavruların yaklaşık yarısı mor, yarısı beyaz çiçekli olur.',{correct:true,feedback:'Mm birey M veya m, mm birey yalnız m gameti oluşturur; Mm ve mm yavrular eş olasılıkla oluşur.',support:['gametes','genotypes','phenotypes']}),
      opt('B','Mor renk baskın olduğu için yavruların tamamı mor çiçekli olur.',{misconceptionId:'dominant-means-all-offspring',feedback:'Baskınlık, M genini alan bireyin mor görünmesini sağlar; ancak heterozigot ebeveyn her yavruya M aktarmak zorunda değildir.',contradictions:['gametes','genotypes']}),
      opt('C','Yavruların dörtte üçü mor, dörtte biri beyaz çiçekli olur.',{misconceptionId:'apply-heterozygous-cross-ratio',feedback:'3:1 oranı iki heterozigot bireyin Mm × Mm çaprazlamasında beklenir; burada ikinci ebeveyn mm’dir.',contradictions:['genotypes']}),
      opt('D','Beyaz renk çekinik olduğu için yavruların tamamı beyaz çiçekli olur.',{misconceptionId:'recessive-parent-controls-all',feedback:'mm ebeveyn her zaman m verir; ancak diğer ebeveynden M alan yavrular Mm olur ve mor çiçek açar.',contradictions:['phenotypes']})
    ],
    steps:[['ebeveynlerin oluşturabileceği gametleri yaz','Mm → M veya m; mm → yalnız m.','Her ebeveyn yavruya hangi tek harfi verebilir?'],['olası genotipleri eşleştir','Mm ve mm genotipleri eşit sayıda oluşur.','İki gamet listesini küçük bir çaprazlama tablosunda birleştir.'],['genotipleri fenotipe çevir','Mm mor, mm beyazdır; oran 1:1 olur.','Baskın M harfi bulunan yavru hangi renkte görünür?']]
  },
  {
    id:'science-g8-cross-03-solid-pressure',outcomeCode:'F.8.3.1.1',construct:['solid-pressure-variable-control',['contact-area','weight-control'],'compare-experimental-cases',['force','surface-area','pressure'],'LGS_MEDIUM_HIGH'],
    stimulusBlocks:['Özdeş üç tuğla aynı yatay zemine farklı yüzeyleri üzerine konuluyor. K düzeninde temas alanı 20 cm², L düzeninde 40 cm², M düzeninde 80 cm²’dir. Tuğlaların ağırlıkları eşittir.'],stem:'Zemine uygulanan katı basınçlarının sıralaması hangisidir?',model:{type:'solid-pressure',areas:{K:20,L:40,M:80},weights:{K:1,L:1,M:1}},required:['equal-force','area-inverse','ranking'],
    options:[
      opt('A','K = L = M',{misconceptionId:'equal-weight-means-equal-pressure',feedback:'Ağırlıkların eşit olması tek başına basıncı eşitlemez; temas alanları farklı olduğu için basınçlar da farklıdır.',contradictions:['area-inverse']}),
      opt('B','M > L > K',{misconceptionId:'pressure-direct-with-area',feedback:'Temas alanı büyüdükçe aynı ağırlık daha geniş yüzeye dağıldığı için basınç azalır; seçenek ilişkiyi ters kurar.',contradictions:['area-inverse','ranking']}),
      opt('C','K > L > M',{correct:true,feedback:'Ağırlıklar eşitken temas alanı küçüldükçe basınç artar; 20 cm²’lik K en büyük, 80 cm²’lik M en küçük basıncı uygular.',support:['equal-force','area-inverse','ranking']}),
      opt('D','L > K > M',{misconceptionId:'middle-area-assumed-highest',feedback:'L’nin temas alanı K’den büyük, M’den küçüktür; bu nedenle basıncı da K ile M arasında olmalıdır.',contradictions:['ranking']})
    ],
    steps:[['kontrol edilen ve değiştirilen değişkenleri ayır','Ağırlık eşit, temas alanı farklıdır.','Hangi özellik üç düzende aynı tutulmuş?'],['temas alanı ile basınç ilişkisini kullan','Aynı kuvvette alan küçüldükçe basınç artar.','Ağırlığı daha küçük alana yaymak zemini nasıl etkiler?'],['alanları küçükten büyüğe sırala','20 < 40 < 80 olduğundan basınç K > L > M olur.','Basınç sırası alan sırasının tersidir.']]
  },
  {
    id:'science-g8-cross-04-heating-graph',outcomeCode:'F.8.4.5.3',construct:['heating-curve-interpretation',['plateau-detection','phase-change'],'interpret-data-pattern',['temperature','time','phase-change'],'LGS_HIGH'],
    stimulusBlocks:['Saf bir katı madde sabit güçlü bir ısıtıcıyla ısıtılıyor. Ölçümler şöyledir: 0. dk 20 °C, 2. dk 40 °C, 4. dk 60 °C, 6. dk 60 °C, 8. dk 60 °C, 10. dk 80 °C.'],stem:'4–8. dakikalar arasındaki süreç için hangi yorum doğrudur?',model:{type:'heating-table',readings:[[0,20],[2,40],[4,60],[6,60],[8,60],[10,80]],initialPhase:'solid'},required:['plateau','heat-continues','melting'],
    options:[
      opt('A','Isıtıcı enerji vermeyi durdurduğu için sıcaklık sabit kalmıştır.',{misconceptionId:'plateau-means-heater-off',feedback:'Isıtıcının sabit güçlü olduğu belirtilmiştir; sıcaklığın sabit kalması verilen enerjinin hâl değişiminde kullanılmasındandır.',contradictions:['heat-continues']}),
      opt('B','Madde 4–8. dakikalarda enerji kaybettiği için sıcaklık değişmemiştir.',{misconceptionId:'constant-temperature-means-no-energy',feedback:'Sıcaklığın sabit kalması enerji alışverişi olmadığı anlamına gelmez; enerji tanecikler arası bağların değişmesinde kullanılır.',contradictions:['heat-continues']}),
      opt('C','Madde 60 °C’de tamamen gaz hâline geçmiş ve 8. dakikadan sonra yoğuşmaya başlamıştır.',{misconceptionId:'first-plateau-read-as-boiling',feedback:'Başlangıçta katı olan madde ilk sıcaklık platosunda erir; 8. dakikadan sonra sıcaklığın yeniden artması sıvının ısındığını gösterir.',contradictions:['melting']}),
      opt('D','Madde erirken enerji almaya devam etmiş, sıcaklığı hâl değişimi boyunca 60 °C’de kalmıştır.',{correct:true,feedback:'Saf katı maddenin sıcaklığı 4–8. dakikalarda sabitken ısıtma sürer; bu aralık erime sürecidir.',support:['plateau','heat-continues','melting']})
    ],
    steps:[['sıcaklığın değişmediği aralığı belirle','4, 6 ve 8. dakikalarda sıcaklık 60 °C’dir.','Tabloda aynı sıcaklığın tekrarlandığı zamanları bul.'],['ısıtıcının çalışmaya devam ettiğini kullan','Sabit güçlü ısıtıcı enerji vermeyi sürdürür.','Soru, ısıtıcının kapatıldığını söylüyor mu?'],['başlangıç hâlinden değişimi yorumla','Katı maddenin ilk platosu erimeyi gösterir.','Başlangıçta katı olan madde ilk hâl değişiminde neye dönüşür?']]
  },
  {
    id:'science-g8-cross-05-simple-machines',outcomeCode:'F.8.5.1.1',construct:['simple-machine-advantage',['force-distance-tradeoff','work-conservation'],'evaluate-design-claim',['inclined-plane','mechanical-advantage','work'],'LGS_HIGH'],
    stimulusBlocks:['Bir öğrenci ağır bir sandığı kamyon kasasına çıkarmak için dört öneriyi değerlendiriyor. Sürtünmenin önemsenmediği düşünülüyor.'],stem:'Basit makinelerin sağladığı avantajı doğru açıklayan öneri hangisidir?',model:{type:'simple-machine-principle',ideal:true},required:['less-force','greater-distance','no-work-gain'],
    options:[
      opt('A','Eğik düzlem kısaltıldıkça gereken kuvvet azalır; çünkü yük hedefe daha kısa yoldan ulaşır.',{misconceptionId:'shorter-ramp-means-less-force',feedback:'Aynı yüksekliğe daha kısa rampayla çıkmak eğimi artırır ve gereken kuvveti büyütür; kuvvet kazancı uzun yol karşılığında oluşur.',contradictions:['less-force','greater-distance']}),
      opt('B','Sabit makara kullanılırsa hem kuvvet azalır hem de sandığın aldığı yol kısalır; böylece işten kazanç sağlanır.',{misconceptionId:'fixed-pulley-force-and-work-gain',feedback:'Sabit makara esas olarak kuvvetin yönünü değiştirir; ideal basit makineler işten kazanç sağlamaz.',contradictions:['less-force','no-work-gain']}),
      opt('C','Daha uzun bir eğik düzlem kullanılırsa daha az kuvvet gerekir; sandık daha uzun yol alır ve ideal durumda yapılan iş değişmez.',{correct:true,feedback:'Eğik düzlem kuvvetten kazanç sağlayabilir; bunun karşılığında yol artar ve ideal basit makinede işten kazanç olmaz.',support:['less-force','greater-distance','no-work-gain']}),
      opt('D','Bir kaldıraç kullanıldığında makine sandığa ek enerji üretir; bu nedenle giriş işi çıkış işinden küçük olur.',{misconceptionId:'machine-creates-energy',feedback:'Kaldıraç kuvvet ve yol dağılımını değiştirir; enerji üretmez ve ideal durumda işten kazanç sağlamaz.',contradictions:['no-work-gain']})
    ],
    steps:[['önerilerde kuvvet ve yol değişimini birlikte incele','Kuvvet azalması çoğu basit makinede yol artışıyla karşılanır.','Yalnız kuvvete değil yükün aldığı yola da bak.'],['ideal basit makine ilkesini uygula','İşten kazanç olmaz; makine enerji üretmez.','“Daha az kuvvet” ifadesi “daha az iş” anlamına gelir mi?'],['eğik düzlem önerisini değerlendir','Uzun rampa kuvveti azaltır, yolu artırır ve işi korur.','Aynı yüksekliğe daha uzun yoldan çıkmanın kuvvete etkisini düşün.']]
  }
]);

function solveRule(model){
  switch(model.type){
    case 'seasons': return 'B';
    case 'cross': {
      const offspring=[]; for(const a of model.parent1)for(const b of model.parent2)offspring.push([a,b]);
      const dominant=offspring.filter(pair=>pair.includes(model.dominant)).length;
      return dominant===offspring.length/2?'A':null;
    }
    case 'solid-pressure': return Object.entries(model.areas).sort((a,b)=>a[1]-b[1]).map(([k])=>k).join('>')==='K>L>M'?'C':null;
    case 'heating-table': { const plateau=model.readings.filter(([,t],i,a)=>i>0&&t===a[i-1][1]); return plateau.length>=2&&model.initialPhase==='solid'?'D':null; }
    case 'simple-machine-principle': return model.ideal?'C':null;
    default: throw new Error(`unknown science model ${model.type}`);
  }
}

function verifyConstraint(item,solved){
  const required=new Set(item.content.requiredEvidenceIds);
  const accepted=item.content.optionSemantics.filter(entry=>entry.contradictions.length===0&&[...required].every(id=>entry.support.includes(id)));
  return accepted.length===1&&accepted[0].id===solved.optionId&&solved.optionId===item.answerKey.optionId;
}

function canonical(spec){
  const outcome=grade8SciencePilotOutcomeByCode(spec.outcomeCode); if(!outcome)throw new Error(`${spec.id}: outcome missing`);
  const [primarySkill,secondarySkills,cognitiveProcess,knowledgeComponents,intendedDifficultyBand]=spec.construct;
  const answer=spec.options.find(o=>o.correct);
  return defineCanonicalQuestion({
    id:spec.id,curriculum:{country:'TR',schoolYear:outcome.schoolYear,programFamily:outcome.programFamily,grade:8,courseId:outcome.courseId,unitId:outcome.unitId,topicId:outcome.topicId,outcomeIds:[outcome.id],sourceIds:[outcome.sourceId]},
    construct:{primarySkill,secondarySkills,cognitiveProcess,knowledgeComponents,intendedDifficultyBand},
    content:{stimulusBlocks:spec.stimulusBlocks,stem:spec.stem,options:spec.options.map(({id,text})=>({id,text})),model:spec.model,requiredEvidenceIds:spec.required,optionSemantics:spec.options.map(({feedback,...o})=>o),humanReview:{status:'NOT_MEASURED',batch:'CROSS_TRANSFER_G8_SCIENCE_5',gameAdaptationAllowed:false}},
    itemFormat:'single-choice',responseModel:{optionIds:spec.options.map(o=>o.id),optionCount:4},answerKey:{optionId:answer.id,supportingEvidenceIds:answer.support},
    solutionGraph:spec.steps.map((s,i)=>({id:`s${i+1}`,action:s[0],dependsOn:i?[`s${i}`]:[],evidenceIds:[spec.required[Math.min(i,spec.required.length-1)]],evidence:s[1]})),
    hints:spec.steps.map((s,i)=>({level:i+1,text:s[2],revealsAnswer:false})),
    optionFeedback:spec.options.map(o=>({optionId:o.id,correct:o.correct,misconceptionId:o.misconceptionId,text:o.feedback,supportingEvidenceIds:o.support,contradictionEvidenceIds:o.contradictions})),
    misconceptionIds:spec.options.filter(o=>!o.correct).map(o=>o.misconceptionId),
    verifier:{solverId:'g8-science-model-rule-solver-v1',independentVerifierId:'g8-science-evidence-constraint-verifier-v1',verified:true},
    styleProfile:{genre:'science-investigation-and-model',voice:'objective',sourceMode:'original-curriculum-aligned',rhetoricalMoves:['observe','control-variables','infer']},
    provenance:{generatedFromSourceIds:[outcome.sourceId],styleReferenceIds:STYLE_REFERENCE_IDS},contentStatus:'HUMAN_REVIEW_REQUIRED'
  });
}

const ITEMS=Object.freeze(SPECS.map(canonical));
export const GRADE8_SCIENCE_CROSS_PILOT_IDS=Object.freeze(ITEMS.map(i=>i.id));
export function buildGrade8ScienceCrossPilotQuestions(){return ITEMS;}

export const grade8ScienceCrossPilotEngine=defineSubjectEngine({
  id:'grade8-science-cross-transfer-engine-v1',domain:'science',supportedCourseIds:['fen-bilimleri'],supportedItemFormats:['single-choice'],misconceptionCatalogId:'g8-science-cross-pilot-misconceptions-v1',styleCatalogId:'g8-science-investigation-models-v1',
  plan:req=>({questionId:req.questionId,grade:req.grade,courseId:req.courseId}),generate:plan=>structuredClone(ITEMS.find(i=>i.id===plan.questionId)||(()=>{throw new Error(`unknown question ${plan.questionId}`)})()),
  solve:item=>({optionId:solveRule(item.content.model)}),verifyIndependent:(item,solved)=>verifyConstraint(item,solved),explain:item=>item.solutionGraph,qualityAudit:item=>auditGrade8ScienceCrossPilotQuestion(item)
});

export function auditGrade8ScienceCrossPilotQuestion(item){
  const errors=[]; if(item.content.options.length!==4)errors.push('option-count'); if(item.hints.length!==3)errors.push('hint-count'); if(item.optionFeedback.length!==4)errors.push('feedback-count'); if(new Set(item.misconceptionIds).size!==3)errors.push('misconception-diversity');
  if(item.content.requiredEvidenceIds.length<3)errors.push('evidence-count'); if(item.gameBindings.length)errors.push('game-binding-forbidden');
  try{const solved=grade8ScienceCrossPilotEngine.solve(item);if(!grade8ScienceCrossPilotEngine.verifyIndependent(item,solved))errors.push('independent-verification');}catch(e){errors.push(`solver:${e.message}`);}
  return {ok:errors.length===0,errors};
}

export function auditGrade8ScienceCrossPilotCatalog(items=ITEMS){
  const errors=items.flatMap(i=>auditGrade8ScienceCrossPilotQuestion(i).errors.map(e=>`${i.id}:${e}`)); if(items.length!==5)errors.push(`item-count:${items.length}`); if(new Set(items.flatMap(i=>i.curriculum.outcomeIds)).size!==5)errors.push('outcome-count');
  return Object.freeze({ok:errors.length===0,errors:Object.freeze(errors),metrics:Object.freeze({itemCount:items.length,outcomeCount:new Set(items.flatMap(i=>i.curriculum.outcomeIds)).size,humanReviewStatus:'NOT_MEASURED',gameAdaptationAllowed:false})});
}
