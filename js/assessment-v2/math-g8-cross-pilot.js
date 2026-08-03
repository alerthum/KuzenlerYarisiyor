import { defineCanonicalQuestion } from './canonical-question-contract.js';
import { defineSubjectEngine } from './subject-engine-contract.js';
import { grade8MathPilotOutcomeByCode } from '../curriculum/outcomes/tr-g8-matematik-2018-pilot.js';

const STYLE_REFERENCE_IDS = Object.freeze(['meb-mcq-writing-guide', 'oecd-pisa-2025-framework']);

const SPECS = Object.freeze([
  {
    id: 'math-g8-cross-01-lcm-maintenance', outcomeCode: 'M.8.1.1.2', answer: 72,
    construct: ['ebob-ekok-problem-solving', ['periodic-events'], 'model-and-calculate', ['least-common-multiple', 'periodicity'], 'LGS_MEDIUM'],
    content: { context: 'Bir gözlemevindeki iki ölçüm cihazından biri 18 günde, diğeri 24 günde bir aynı kapsamlı bakıma alınmaktadır. İki cihazın bakımı bugün birlikte yapılmıştır.', stem: 'Bakım düzeni değişmezse iki cihaz kaç gün sonra yeniden aynı gün bakıma alınır?', model: { type: 'lcm', a: 18, b: 24 } },
    options: [['A', '42 gün', 42, 'periods-added', 'İki bakım aralığını toplamak, iki döngünün aynı güne geldiği ilk zamanı vermez.'], ['B', '72 gün', 72, null, '18 ve 24’ün ilk ortak katı 72’dir; iki bakım döngüsü ilk kez bu gün yeniden birleşir.'], ['C', '6 gün', 6, 'gcd-instead-of-lcm', '6 sayısı iki sürenin EBOB’udur; ortak döngünün tekrarını değil ortak böleni gösterir.'], ['D', '432 gün', 432, 'multiply-without-reducing', 'Aralıkları doğrudan çarpmak ortak kat verir fakat ilk ortak katı gereksiz yere büyütür.']],
    steps: [['bakım günlerini iki ayrı periyodik dizi olarak düşün', '18, 36, 54… ve 24, 48, 72… dizileri kurulur.', 'Her cihaz için ilk birkaç bakım gününü yaz.'], ['ilk ortak günü belirle', 'İki dizide ilk ortak değer 72’dir.', 'İki listenin ilk kez nerede kesiştiğine bak.'], ['sonucu bakım bağlamında yorumla', '72 gün sonra iki cihaz yeniden aynı gün bakıma girer.', 'Bulduğun ortak katların en küçüğünü seç.']]
  },
  {
    id: 'math-g8-cross-02-scientific-notation', outcomeCode: 'M.8.1.2.5', answer: 'M>K>L',
    construct: ['scientific-notation-comparison', ['magnitude-ordering'], 'compare-and-justify', ['coefficient', 'power-of-ten'], 'LGS_MEDIUM_HIGH'],
    content: { context: 'Bir laboratuvarda üç parçacığın çapı bilimsel gösterimle ölçülmüştür: K = 4,8 × 10⁻⁷ m, L = 7,2 × 10⁻⁸ m, M = 5,1 × 10⁻⁷ m.', stem: 'Parçacıkların çaplarının büyükten küçüğe doğru sıralanışı hangisidir?', model: { type: 'scientific-order', values: { K: [4.8, -7], L: [7.2, -8], M: [5.1, -7] } } },
    options: [['A', 'L > M > K', 'L>M>K', 'negative-exponent-direction', 'Negatif üs küçüldükçe sayının büyüdüğünü varsayar; oysa 10⁻⁸, 10⁻⁷’den daha küçük bir ölçek verir.'], ['B', 'M > L > K', 'M>L>K', 'coefficient-only-comparison', 'L’nin katsayısı büyük olsa da üs değeri farklıdır; önce ondalık basamak ölçeği karşılaştırılmalıdır.'], ['C', 'M > K > L', 'M>K>L', null, 'M ve K aynı 10⁻⁷ ölçeğindedir ve 5,1 > 4,8’dir; L ise 10⁻⁸ ölçeğinde olduğu için ikisinden küçüktür.'], ['D', 'K > M > L', 'K>M>L', 'same-exponent-coefficient-reversed', 'K ile M’nin üsleri aynıdır; katsayı karşılaştırması 5,1’in 4,8’den büyük olduğunu gösterir.']],
    steps: [['üsleri karşılaştır', '10⁻⁷ ölçeğindeki K ve M, 10⁻⁸ ölçeğindeki L’den büyüktür.', 'Önce katsayıları değil 10’un kuvvetlerini karşılaştır.'], ['aynı üslü sayıları katsayıyla sırala', '5,1 × 10⁻⁷, 4,8 × 10⁻⁷’den büyüktür.', 'Üsler eşitse hangi katsayı daha büyük?'], ['sıralamayı birleştir', 'M > K > L elde edilir.', 'İki aşamadaki karşılaştırmayı tek sıraya dönüştür.']]
  },
  {
    id: 'math-g8-cross-03-linear-tank', outcomeCode: 'M.8.2.2.5', answer: '180−15t;9',
    construct: ['linear-model-interpretation', ['rate-and-intercept'], 'model-solve-and-check', ['linear-equation', 'table-interpretation'], 'LGS_HIGH'],
    content: { context: 'Bir depoda başlangıçta 180 litre su vardır. Pompa çalıştıktan 2 dakika sonra 150 litre, 6 dakika sonra 90 litre su kalmıştır. Pompanın her dakika aynı miktarda su boşalttığı bilinmektedir.', stem: 't dakika sonra depoda kalan su miktarını V ile gösteren denklem ve 45 litre su kaldığı an birlikte hangi seçenekte doğru verilmiştir?', model: { type: 'linear-from-points', points: [[2,150],[6,90]], targetY: 45 } },
    options: [['A', 'V = 180 − 15t; 8. dakika', '180−15t;8', 'target-time-arithmetic', 'Denklem doğrudur; ancak 45 = 180 − 15t eşitliği t = 9 verir, 8 değil.'], ['B', 'V = 180 − 10t; 13,5. dakika', '180−10t;13.5', 'rate-from-single-point', 'Başlangıç ile 6. dakika arasındaki değişim yanlış orana bağlanmıştır; iki veri arasındaki azalma dakikada 15 litredir.'], ['C', 'V = 210 − 15t; 11. dakika', '210−15t;11', 'intercept-shift', 'Azalma hızı doğru olsa da başlangıç miktarı 180 litredir; 210 litrelik başlangıç verilerle uyuşmaz.'], ['D', 'V = 180 − 15t; 9. dakika', '180−15t;9', null, 'İki ölçüm arasında 4 dakikada 60 litre azalma vardır; hız 15 L/dk, başlangıç 180 L ve 45 litreye ulaşma süresi 9 dakikadır.']],
    steps: [['iki ölçümden değişim hızını bul', '(90−150)/(6−2) = −15 L/dk.', 'Dört dakikada kaç litre azalmış?'], ['başlangıç değerini kullanarak denklemi kur', 'V = 180 − 15t.', 't = 0 iken V kaç olmalı?'], ['hedef miktar için zamanı çöz', '45 = 180 − 15t denkleminden t = 9.', 'Kalan suyu 45’e eşitle ve t’yi bul.']]
  },
  {
    id: 'math-g8-cross-04-pythagorean-map', outcomeCode: 'M.8.3.1.5', answer: 10,
    construct: ['pythagorean-distance', ['coordinate-difference'], 'represent-and-calculate', ['right-triangle', 'distance'], 'LGS_MEDIUM_HIGH'],
    content: { context: 'Kareli bir kent planında bir acil çıkış noktası A(−2, 1), toplanma alanı B(4, 9) olarak işaretlenmiştir. Bir kare kenarı 1 metreyi temsil etmektedir.', stem: 'A ile B arasına doğrusal bir güvenlik şeridi çekilirse şeridin uzunluğu kaç metre olur?', model: { type: 'coordinate-distance', a: [-2,1], b: [4,9] } },
    options: [['A', '10 metre', 10, null, 'Yatay fark 6, düşey fark 8 metredir; √(6²+8²)=10 bulunur.'], ['B', '8 metre', 8, 'use-only-larger-leg', 'Yalnız düşey uzaklığı kullanır; yatay uzaklık da doğrusal mesafeye katkı sağlar.'], ['C', '12 metre', 12, 'add-coordinate-differences', 'Koordinat farklarını doğrudan toplamak yol uzunluğunu verir; iki nokta arasındaki doğrusal uzaklığı vermez.'], ['D', '14 metre', 14, 'add-absolute-coordinates', 'Noktaların koordinatlarını toplamaya dayanır; mesafe için önce karşılıklı koordinatların farkları alınmalıdır.']],
    steps: [['yatay ve düşey farkları belirle', 'Δx = 6 ve Δy = 8.', 'Aynı tür koordinatları birbirinden çıkar.'], ['farkları dik üçgenin kenarları olarak gör', '6 ve 8 dik kenarlardır.', 'Kareli planda yatay ve düşey hareketler birbirine diktir.'], ['Pisagor bağıntısını uygula', '√(36+64)=√100=10.', 'İki farkın karelerini toplayıp karekökünü al.']]
  },
  {
    id: 'math-g8-cross-05-probability-cards', outcomeCode: 'M.8.5.1.5', answer: '8/15',
    construct: ['simple-event-probability', ['set-enumeration'], 'enumerate-and-ratio', ['favourable-outcomes', 'sample-space'], 'LGS_HIGH'],
    content: { context: 'Üzerlerinde 1’den 15’e kadar doğal sayıların yazılı olduğu eş kartlardan biri rastgele seçiliyor.', stem: 'Seçilen karttaki sayının asal veya 5’in katı olma olasılığı kaçtır?', model: { type: 'set-probability', min: 1, max: 15, predicates: ['prime', 'multiple-of-5'], union: true } },
    options: [['A', '7/15', '7/15', 'omit-overlap-member', 'Asal sayılar ile 5’in katlarını birleştirirken iki kümeye de giren 5 sayısını yanlış biçimde dışarıda bırakır.'], ['B', '8/14', '8/14', 'exclude-one-from-sample-space', 'Uygun sonuçları doğru sayar; fakat 1 sayısını olası durumlar kümesinden çıkardığı için paydayı 14 alır.'], ['C', '8/15', '8/15', null, 'Uygun sayılar 2, 3, 5, 7, 10, 11, 13 ve 15 olmak üzere 8 tanedir; toplam 15 eş olasılıklı kart vardır.'], ['D', '9/15', '9/15', 'double-count-overlap', '5 sayısını hem asal hem 5’in katı olduğu için iki kez sayar; tek kart tek sonuç olarak sayılmalıdır.']],
    steps: [['asal sayıları listele', '2, 3, 5, 7, 11, 13.', '1 ile 15 arasındaki asal sayıları yaz.'], ['5’in katlarını ekleyip tekrarı kaldır', '5, 10, 15 eklenir; 5 yalnız bir kez sayılır.', 'İki özelliği de taşıyan sayı varsa iki kez sayma.'], ['uygun sonuçları tüm sonuçlara oranla', '8 uygun sonuç / 15 olası sonuç.', 'Payda bütün kartların sayısıdır.']]
  }
]);

function gcd(a,b){ while(b){ [a,b]=[b,a%b]; } return Math.abs(a); }
function lcm(a,b){ return Math.abs(a*b)/gcd(a,b); }
function isPrime(n){ if(n<2)return false; for(let i=2;i*i<=n;i++) if(n%i===0)return false; return true; }

function solveModel(model) {
  switch (model.type) {
    case 'lcm': return lcm(model.a, model.b);
    case 'scientific-order': return Object.entries(model.values).sort(([,a],[,b]) => (b[0]*10**b[1])-(a[0]*10**a[1])).map(([key])=>key).join('>');
    case 'linear-from-points': {
      const [[x1,y1],[x2,y2]] = model.points; const slope=(y2-y1)/(x2-x1); const intercept=y1-slope*x1; const t=(model.targetY-intercept)/slope;
      return `${intercept}${slope<0?'−':'+'}${Math.abs(slope)}t;${t}`;
    }
    case 'coordinate-distance': return Math.sqrt((model.b[0]-model.a[0])**2+(model.b[1]-model.a[1])**2);
    case 'set-probability': {
      const values=[]; for(let n=model.min;n<=model.max;n++){ if(isPrime(n)||n%5===0) values.push(n); }
      return `${values.length}/${model.max-model.min+1}`;
    }
    default: throw new Error(`unknown math model ${model.type}`);
  }
}

function independentExpected(model) {
  switch (model.type) {
    case 'lcm': { for(let n=Math.max(model.a,model.b); n<=model.a*model.b; n++) if(n%model.a===0&&n%model.b===0)return n; break; }
    case 'scientific-order': return Object.entries(model.values).sort(([,a],[,b]) => b[1]-a[1] || b[0]-a[0]).map(([key])=>key).join('>');
    case 'linear-from-points': { const candidates=[]; for(let t=0;t<=20;t+=0.5){ const [[x1,y1],[x2,y2]]=model.points; const m=(y2-y1)/(x2-x1), b=y1-m*x1; if(Math.abs((b+m*t)-model.targetY)<1e-9)candidates.push([b,m,t]); } const [b,m,t]=candidates[0]; return `${b}${m<0?'−':'+'}${Math.abs(m)}t;${t}`; }
    case 'coordinate-distance': { const dx=Math.abs(model.b[0]-model.a[0]),dy=Math.abs(model.b[1]-model.a[1]); for(let c=0;c<=dx+dy;c++) if(c*c===dx*dx+dy*dy)return c; break; }
    case 'set-probability': { let count=0,total=0; for(let n=model.min;n<=model.max;n++){ total++; const divisors=Array.from({length:n},(_,i)=>i+1).filter(d=>n%d===0); const prime=divisors.length===2; if(prime||n%5===0)count++; } return `${count}/${total}`; }
  }
  throw new Error(`independent solver failed ${model.type}`);
}

function canonical(spec){
  const outcome=grade8MathPilotOutcomeByCode(spec.outcomeCode); if(!outcome)throw new Error(`${spec.id}: outcome missing`);
  const [primarySkill,secondarySkills,cognitiveProcess,knowledgeComponents,intendedDifficultyBand]=spec.construct;
  const options=spec.options.map(([id,text,value,misconceptionId,feedback])=>({id,text,value,misconceptionId,feedback,correct:value===spec.answer}));
  const answer=options.find(o=>o.correct);
  return defineCanonicalQuestion({
    id: spec.id,
    curriculum:{country:'TR',schoolYear:outcome.schoolYear,programFamily:outcome.programFamily,grade:8,courseId:outcome.courseId,unitId:outcome.unitId,topicId:outcome.topicId,outcomeIds:[outcome.id],sourceIds:[outcome.sourceId]},
    construct:{primarySkill,secondarySkills,cognitiveProcess,knowledgeComponents,intendedDifficultyBand},
    content:{...spec.content,options:options.map(({id,text})=>({id,text})),optionValues:Object.fromEntries(options.map(o=>[o.id,o.value])),humanReview:{status:'NOT_MEASURED',batch:'CROSS_TRANSFER_G8_MATH_5',gameAdaptationAllowed:false}},
    itemFormat:'single-choice',responseModel:{optionIds:options.map(o=>o.id),optionCount:4},answerKey:{optionId:answer.id,value:answer.value},
    solutionGraph:spec.steps.map((s,i)=>({id:`s${i+1}`,action:s[0],dependsOn:i?[`s${i}`]:[],evidenceIds:[`calc-${i+1}`],evidence:s[1]})),
    hints:spec.steps.map((s,i)=>({level:i+1,text:s[2],revealsAnswer:false})),
    optionFeedback:options.map(o=>({optionId:o.id,correct:o.correct,misconceptionId:o.misconceptionId,text:o.feedback,supportingEvidenceIds:o.correct?['calculation-proof']:[],contradictionEvidenceIds:o.correct?[]:['calculation-proof']})),
    misconceptionIds:options.filter(o=>!o.correct).map(o=>o.misconceptionId),
    verifier:{solverId:'g8-math-domain-solver-v1',independentVerifierId:'g8-math-enumerative-verifier-v1',verified:true},
    styleProfile:{genre:'mathematical-real-life-model',voice:'objective',sourceMode:'original-curriculum-aligned',rhetoricalMoves:['model','calculate','interpret']},
    provenance:{generatedFromSourceIds:[outcome.sourceId],styleReferenceIds:STYLE_REFERENCE_IDS},contentStatus:'HUMAN_REVIEW_REQUIRED'
  });
}

const ITEMS=Object.freeze(SPECS.map(canonical));
export const GRADE8_MATH_CROSS_PILOT_IDS=Object.freeze(ITEMS.map(i=>i.id));
export function buildGrade8MathCrossPilotQuestions(){return ITEMS;}

export const grade8MathCrossPilotEngine=defineSubjectEngine({
  id:'grade8-math-cross-transfer-engine-v1',domain:'mathematics',supportedCourseIds:['matematik'],supportedItemFormats:['single-choice'],misconceptionCatalogId:'g8-math-cross-pilot-misconceptions-v1',styleCatalogId:'g8-math-real-life-models-v1',
  plan:req=>({questionId:req.questionId,grade:req.grade,courseId:req.courseId}),
  generate:plan=>structuredClone(ITEMS.find(i=>i.id===plan.questionId)||(()=>{throw new Error(`unknown question ${plan.questionId}`)})()),
  solve:item=>{const value=solveModel(item.content.model);const option=Object.entries(item.content.optionValues).find(([,v])=>String(v)===String(value));if(!option)throw new Error(`${item.id}: no option for ${value}`);return {optionId:option[0],value};},
  verifyIndependent:(item,solved)=>String(independentExpected(item.content.model))===String(solved.value)&&solved.optionId===item.answerKey.optionId,
  explain:item=>item.solutionGraph,
  qualityAudit:item=>auditGrade8MathCrossPilotQuestion(item)
});

export function auditGrade8MathCrossPilotQuestion(item){
  const errors=[]; if(item.content.options.length!==4)errors.push('option-count'); if(item.hints.length!==3)errors.push('hint-count'); if(item.optionFeedback.length!==4)errors.push('feedback-count');
  if(new Set(item.misconceptionIds).size!==3)errors.push('misconception-diversity'); if(item.gameBindings.length)errors.push('game-binding-forbidden'); if(item.content.humanReview.gameAdaptationAllowed!==false)errors.push('game-adaptation-open');
  try{const solved=grade8MathCrossPilotEngine.solve(item);if(!grade8MathCrossPilotEngine.verifyIndependent(item,solved))errors.push('independent-verification');}catch(e){errors.push(`solver:${e.message}`);}
  return {ok:errors.length===0,errors};
}

export function auditGrade8MathCrossPilotCatalog(items=ITEMS){
  const errors=items.flatMap(i=>auditGrade8MathCrossPilotQuestion(i).errors.map(e=>`${i.id}:${e}`));
  if(items.length!==5)errors.push(`item-count:${items.length}`); if(new Set(items.flatMap(i=>i.curriculum.outcomeIds)).size!==5)errors.push('outcome-count');
  return Object.freeze({ok:errors.length===0,errors:Object.freeze(errors),metrics:Object.freeze({itemCount:items.length,outcomeCount:new Set(items.flatMap(i=>i.curriculum.outcomeIds)).size,humanReviewStatus:'NOT_MEASURED',gameAdaptationAllowed:false})});
}
