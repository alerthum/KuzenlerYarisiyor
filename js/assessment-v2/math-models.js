import { defineItemModel } from './contracts.js';

function choose(n, k) {
  if (!Number.isInteger(n) || !Number.isInteger(k) || k < 0 || k > n) return 0;
  let result = 1;
  for (let i = 1; i <= Math.min(k, n - k); i += 1) result = (result * (n - i + 1)) / i;
  return Math.round(result);
}

function compositionCount(total, parts = [2, 3]) {
  const dp = Array(total + 1).fill(0);
  dp[0] = 1;
  for (let i = 1; i <= total; i += 1) for (const p of parts) if (i >= p) dp[i] += dp[i - p];
  return dp[total];
}

export const latticePathViaCheckpointModel = defineItemModel({
  id: 'math-lattice-path-checkpoint-v2', domain: 'mathematics',
  construct: { id: 'construct-lattice-path-product', gradeRange: [7, 12], subjectId: 'mathematics', curriculumOutcomeIds: ['count-shortest-grid-paths'], knowledgeComponents: ['combinations', 'multiplication-principle', 'decompose-at-checkpoint'], claim: 'Öğrenci zorunlu bir ara noktadan geçen en kısa yolları iki bağımsız aşama olarak sayar.' },
  deepFeatures: ['two-stage-counting', 'checkpoint-decomposition'], surfaceFeatures: ['right-up-counts'], compatibleGameIds: ['olympiad-ladder', 'problem-hunter'],
  solutionGraph: { steps: [
    { id: 's1', action: 'ilk aşamadaki hareket sıralamalarını say', dependsOn: [], evidence: 'Sağ ve yukarı hareketlerinin yerleri kombinasyonla seçilir.', hint: 'A’dan B’ye toplam kaç hareket var ve bunların kaçı aynı tür?' },
    { id: 's2', action: 'ikinci aşamadaki hareket sıralamalarını say', dependsOn: [], evidence: 'B’den C’ye yollar aynı yöntemle bağımsız sayılır.', hint: 'B’den C’ye olan bölümü ayrı bir yol problemi olarak ele al.' },
    { id: 's3', action: 'iki bağımsız seçimi çarp', dependsOn: ['s1', 's2'], evidence: 'Her ilk yol, her ikinci yolla eşleşebilir.', hint: 'Her A→B yolu kaç farklı B→C yoluyla tamamlanabilir?' }
  ]},
  misconceptions: [
    { id: 'add-stage-counts', description: 'Ardışık iki seçim için çarpma yerine toplama yapar.', buggyRule: 'stage1+stage2', feedback: 'Aşamalar alternatif değil ardışıktır; her ilk yol her ikinci yolla eşleşir.', apply: t => choose(t.r1+t.u1,t.r1)+choose(t.r2+t.u2,t.r2) },
    { id: 'count-as-single-unrestricted-route', description: 'Ara noktadan geçme zorunluluğunu yok sayıp bütün yolu tek aşama sayar.', buggyRule: 'choose-total-moves', feedback: 'Tek aşamalı sayım, yolun B’den geçmesini garanti etmez.', apply: t => choose(t.r1+t.u1+t.r2+t.u2,t.r1+t.r2) },
    { id: 'permute-only-right-moves', description: 'Toplam hareket sayısını kullanmadan yalnız sağ hareketleri kendi arasında dizer.', buggyRule: 'factorial-right-only', feedback: 'Aynı tür hareketler ayırt edilmez; sağ ve yukarı hareketlerinin toplam sıralaması sayılmalıdır.', apply: t => t.r1 * t.r2 }
  ],
  generateTask: ({ r1=3,u1=3,r2=4,u2=3 }={}) => ({r1,u1,r2,u2}),
  solve: t => choose(t.r1+t.u1,t.r1)*choose(t.r2+t.u2,t.r2),
  verify: (t,v) => Number(v)===choose(t.r1+t.u1,t.r1)*choose(t.r2+t.u2,t.r2),
  render: t => ({ context: `Bir ızgarada A'dan B'ye ${t.r1} sağ ve ${t.u1} yukarı; B'den C'ye ${t.r2} sağ ve ${t.u2} yukarı hareket edilmelidir. Yalnız sağ ve yukarı gidilebilir.`, prompt: "B'den geçen en kısa A→C yollarının sayısı kaçtır?", formatOption:String })
});

export const modularDigitModel = defineItemModel({
  id: 'math-modular-digit-v2', domain: 'mathematics',
  construct: { id: 'construct-modular-digit', gradeRange: [7, 12], subjectId: 'mathematics', curriculumOutcomeIds: ['reason-with-remainders'], knowledgeComponents: ['place-value', 'modular-arithmetic', 'systematic-enumeration'], claim: 'Öğrenci basamak değişkenlerini kalan koşuluna göre sistematik tarar.' },
  deepFeatures: ['modular-filter', 'digit-enumeration'], surfaceFeatures: ['fixed-digits','modulus','remainder'], compatibleGameIds: ['olympiad-ladder'],
  solutionGraph: { steps: [
    { id:'s1', action:'sayıyı basamak değerleriyle ifade et', dependsOn:[], evidence:'4A3B sayısı 4000+100A+30+B biçimindedir.', hint:'Bilinmeyen rakamları basamak değerleriyle yaz.' },
    { id:'s2', action:'kalan koşulunu her rakam çifti için denetle', dependsOn:['s1'], evidence:'A ve B yalnız 0–9 aralığında sistematik denenir.', hint:'A ve B rakam olduğu için olası değer aralığı sınırlıdır.' },
    { id:'s3', action:'geçerli A değerlerini tekilleştirip topla', dependsOn:['s2'], evidence:'Aynı A için birden çok B olsa bile A bir kez sayılır.', hint:'Soru rakam çiftlerini değil A’nın alabileceği değerlerin toplamını soruyor.' }
  ]},
  misconceptions: [
    { id:'sum-valid-pairs', description:'A değerleri yerine geçerli (A,B) çiftlerinin sayısını toplar.', buggyRule:'count-pairs', feedback:'Soru çift sayısını değil farklı A değerlerinin toplamını ister.', apply:t=>{let c=0;for(let A=0;A<10;A++)for(let B=0;B<10;B++)if((4000+100*A+30+B)%t.mod===t.rem)c++;return c;} },
    { id:'sum-valid-b-digits', description:'Soru A rakamını sorarken geçerli B rakamlarını toplar.', buggyRule:'sum-B-instead-of-A', feedback:'Koşulu sağlayan çiftler bulunsa da istenen B değil A rakamlarının toplamıdır.', apply:t=>{const set=new Set();for(let A=0;A<10;A++)for(let B=0;B<10;B++)if((4000+100*A+30+B)%t.mod===t.rem)set.add(B);return [...set].reduce((a,b)=>a+b,0);} },
    { id:'treat-tens-as-hundreds', description:'Sabit 3 rakamını onlar basamağı yerine yüzler basamağı gibi kullanır.', buggyRule:'use-300-not-30', feedback:'3 rakamı onlar basamağındadır ve sayıya katkısı 30’dur, 300 değil.', apply:t=>{const set=new Set();for(let A=0;A<10;A++)for(let B=0;B<10;B++)if((4000+100*A+300+B)%t.mod===t.rem)set.add(A);return [...set].reduce((a,b)=>a+b,0);} }
  ],
  generateTask:({mod=36,rem=19}={})=>({mod,rem}),
  solve:t=>{const set=new Set();for(let A=0;A<10;A++)for(let B=0;B<10;B++)if((4000+100*A+30+B)%t.mod===t.rem)set.add(A);return [...set].reduce((a,b)=>a+b,0);},
  verify:(t,v)=>{const set=new Set();for(let A=0;A<10;A++)for(let B=0;B<10;B++)if((4000+100*A+30+B)%t.mod===t.rem)set.add(A);return Number(v)===[...set].reduce((a,b)=>a+b,0);},
  render:t=>({context:`Dört basamaklı 4A3B sayısının ${t.mod} ile bölümünden kalan ${t.rem}'dur. A ve B birer rakamdır.`,prompt:"A'nın alabileceği farklı değerlerin toplamı kaçtır?",formatOption:String})
});

export const twoThreeCompositionModel = defineItemModel({
  id:'math-compositions-two-three-v2',domain:'mathematics',
  construct:{id:'construct-compositions',gradeRange:[7,12],subjectId:'mathematics',curriculumOutcomeIds:['count-recursive-compositions'],knowledgeComponents:['recurrence','case-splitting','ordered-compositions'],claim:'Öğrenci toplamı 2 ve 3 adımlarıyla oluşturan sıralı dizileri özyinelemeli sayar.'},
  deepFeatures:['ordered-composition','recurrence'],surfaceFeatures:['total-object-count'],compatibleGameIds:['olympiad-ladder','pattern-lab'],
  solutionGraph:{steps:[
    {id:'s1',action:'son adımı iki duruma ayır',dependsOn:[],evidence:'Son gün 2 veya 3 tüketilmiş olabilir.',hint:'Olasılıkları son gün tüketilen miktara göre ayır.'},
    {id:'s2',action:'daha küçük toplamların çözüm sayılarını kullan',dependsOn:['s1'],evidence:'f(n)=f(n−2)+f(n−3) bağıntısı elde edilir.',hint:'Son gün 2 ise önceki günlere kaç; 3 ise kaç kalır?'},
    {id:'s3',action:'başlangıç değerlerinden hedefe ilerle',dependsOn:['s2'],evidence:'f(0)=1 ve negatif toplamlar 0 kabul edilerek tablo doldurulur.',hint:'Küçük toplamlar için kaç sıra olduğunu yazıp bağıntıyı ilerlet.'}
  ]},
  misconceptions:[
    {id:'unordered-count',description:'2 ve 3’lerin sırasını önemsemez.',buggyRule:'count-solutions-2a+3b=n',feedback:'Günlerin sırası değiştiğinde farklı tüketim planı oluşur.',apply:t=>{let c=0;for(let a=0;2*a<=t.total;a++)if((t.total-2*a)%3===0)c++;return c;}},
    {id:'fibonacci-two-one',description:'Adımlar 2 ve 3 iken 1 ve 2 adımlı Fibonacci bağıntısı kullanır.',buggyRule:'fib(n)',feedback:'Bu problemde bir günde 1 tüketme seçeneği yoktur.',apply:t=>{let a=0,b=1;for(let i=0;i<t.total;i++)[a,b]=[b,a+b];return a;}},
    {id:'multiply-case-counts',description:'Sonu 2 ve sonu 3 olan durumları toplamak yerine çarpar.',buggyRule:'f(n-2)*f(n-3)',feedback:'Bu iki durum birbirini dışlayan alternatiflerdir; sayıları toplanır.',apply:t=>compositionCount(t.total-2)*compositionCount(t.total-3)}
  ],
  generateTask:({total=20}={})=>({total}),solve:t=>compositionCount(t.total),verify:(t,v)=>Number(v)===compositionCount(t.total),
  render:t=>({context:`Bir kavanozda ${t.total} özdeş şeker vardır. Aslı her gün tam 2 veya tam 3 şeker yiyerek kavanozu bitiriyor.`,prompt:'Günlük tüketim sıraları kaç farklı biçimde olabilir?',formatOption:String})
});

export const twoSetUnionModel = defineItemModel({
  id:'math-two-set-union-v2',domain:'mathematics',
  construct:{id:'construct-two-set-union',gradeRange:[5,10],subjectId:'mathematics',curriculumOutcomeIds:['use-inclusion-exclusion-two-sets'],knowledgeComponents:['set-intersection','avoid-double-counting'],claim:'Öğrenci iki kümenin birleşiminde ortak üyelerin iki kez sayıldığını fark eder.'},
  deepFeatures:['derive-intersection','inclusion-exclusion'],surfaceFeatures:['club-labels','counts'],compatibleGameIds:['problem-hunter','olympiad-ladder'],
  solutionGraph:{steps:[
    {id:'s1',action:'ortak üye sayısını verilenlerden çıkar',dependsOn:[],evidence:'A toplamından yalnız A çıkarılınca ortak kısım bulunur.',hint:'A kulübündeki toplamdan yalnız A’da olanları çıkar.'},
    {id:'s2',action:'yalnız bölgeleri ve ortak bölgeyi birer kez topla',dependsOn:['s1'],evidence:'Birleşim yalnız A + yalnız B + ortak biçimindedir.',hint:'Venn şemasındaki üç ayrı bölgeyi düşün.'},
    {id:'s3',action:'çifte sayımı kontrol et',dependsOn:['s2'],evidence:'A+B toplamında ortak üyeler iki kez yer aldığı için bir kez çıkarılır.',hint:'Toplamları doğrudan eklersen hangi öğrenciler iki kez sayılır?' }
  ]},
  misconceptions:[
    {id:'add-totals',description:'İki kümenin toplamlarını ortakları çıkarmadan ekler.',buggyRule:'A+B',feedback:'Ortak üyeler iki kez sayılmış olur.',apply:t=>t.aTotal+t.bTotal},
    {id:'sum-only-regions',description:'Yalnız A ve yalnız B’yi toplar, ortak üyeleri dışarıda bırakır.',buggyRule:'onlyA+onlyB',feedback:'En az bir kulüpte olanlara ortak üyeler de dahildir.',apply:t=>t.onlyA+t.onlyB},
    {id:'add-intersection-again',description:'Ortak üyeleri toplamların üzerine bir kez daha ekler.',buggyRule:'A+B+I',feedback:'Ortak üyeler A ve B toplamlarında zaten iki kez yer almaktadır; ayrıca eklenmez.',apply:t=>t.aTotal+t.bTotal+(t.aTotal-t.onlyA)}
  ],
  generateTask:({aTotal=16,bTotal=9,onlyA=12,onlyB=5}={})=>({aTotal,bTotal,onlyA,onlyB}),
  solve:t=>t.onlyA+t.onlyB+(t.aTotal-t.onlyA),
  verify:(t,v)=>Number(v)===t.onlyA+t.onlyB+(t.aTotal-t.onlyA),
  render:t=>({context:`A kulübünde ${t.aTotal}, B kulübünde ${t.bTotal} öğrenci vardır. Yalnız A'da ${t.onlyA}, yalnız B'de ${t.onlyB} öğrenci bulunmaktadır.`,prompt:'En az bir kulübe üye kaç öğrenci vardır?',formatOption:String})
});

export const PHASE2_MATH_MODELS=Object.freeze([latticePathViaCheckpointModel,modularDigitModel,twoThreeCompositionModel,twoSetUnionModel]);
