import { defineSolverBackedMathFamily } from './solver-backed-math-family-engine.js';

const SKELETONS = Object.freeze([
  Object.freeze({ id: 'direct-model', reasoningPathId: 'direct-modeling', experienceType: 'direct-modeling', surfaceDomain: 'quantitative-scenario' }),
  Object.freeze({ id: 'reverse-constraint', reasoningPathId: 'reverse-reasoning', experienceType: 'reverse-reasoning', surfaceDomain: 'missing-condition' }),
  Object.freeze({ id: 'compare-strategies', reasoningPathId: 'strategy-comparison', experienceType: 'strategy-comparison', surfaceDomain: 'solution-review' })
]);

function pick(list, seed) { return list[Math.abs(Number(seed)) % list.length]; }
function gcd(a, b) { let x=Math.abs(a), y=Math.abs(b); while(y)[x,y]=[y,x%y]; return x; }
function reduced(n,d){ const g=gcd(n,d); return {n:n/g,d:d/g}; }
function skeletonNote(skeleton){
  return skeleton.id === 'direct-model' ? 'Verileri doğrudan matematiksel modele dönüştür.'
    : skeleton.id === 'reverse-constraint' ? 'Sonuçtan geriye giderek eksik koşulu kur.'
      : 'İki çözüm stratejisini karşılaştırıp yalnız tüm koşulları sağlayanı seç.';
}
function commonSteps(rows){ return rows.map(([action,evidence])=>({action,evidence})); }

const exponentFamily = defineSolverBackedMathFamily({
  id:'g8-math-exponent-balance', grade:8, topicId:'exponents', outcomeId:'M.8.1.2.3', constructId:'combine-exponent-rules',
  claim:'Aynı tabana dönüştürülen üslü ifadelerde çarpma ve bölme kurallarını birlikte uygular.',
  knowledgeComponents:['same-base','product-rule','quotient-rule'], deepFeatures:['symbolic-rewrite','inverse-check'],
  gameIds:['problem-hunter','error-detective'], skeletons:SKELETONS,
  generateParameters:({seed})=>pick([{a:3,b:4,c:2},{a:5,b:3,c:2},{a:2,b:5,c:3},{a:6,b:2,c:1}],seed),
  solve:t=>t.a+2*t.b-3*t.c,
  verify:(t,v)=>Number(v)===t.a+2*t.b-3*t.c,
  misconceptions:[
    {id:'ignore-base-conversion',description:'4 ve 8 tabanlarını 2 tabanına dönüştürmeden üsleri işlemiştir.',feedback:'4=2² ve 8=2³ dönüşümleri yapılmalıdır.',apply:t=>t.a+t.b+t.c},
    {id:'add-denominator-exponent',description:'Paydadaki üssü çıkarmak yerine toplamıştır.',feedback:'Bölmede paydanın üssü çıkarılır.',apply:t=>t.a+2*t.b+3*t.c},
    {id:'multiply-exponents',description:'Toplaması gereken üsleri birbiriyle çarpmıştır.',feedback:'Aynı tabanlı çarpımda üsler toplanır.',apply:t=>t.a*(2*t.b)-3*t.c}
  ],
  render:(t,{answer,skeleton})=>({
    context:`2^${t.a} · 4^${t.b} ÷ 8^${t.c} ifadesi tek bir 2 kuvveti biçiminde yazılacaktır. ${skeletonNote(skeleton)}`,
    prompt:'İfade 2^x biçimindeyse x kaçtır?', correctRationale:`4=2² ve 8=2³ olduğundan x=${t.a}+2·${t.b}−3·${t.c}=${answer}.`,
    steps:commonSteps([['tabanları eşitle',`4^${t.b}=2^${2*t.b}, 8^${t.c}=2^${3*t.c}.`],['çarpım üslerini topla',`${t.a}+${2*t.b}=${t.a+2*t.b}.`],['bölme üssünü çıkar',`${t.a+2*t.b}−${3*t.c}=${answer}.`],['sayısal kontrol yap',`Başlangıç ifadesi 2^${answer} değerine eşittir.`]]),
    hints:['Önce 4 ve 8 sayılarını 2’nin kuvvetleri olarak yaz; farklı tabanlarla üs işlemi yapma.','Paydaki üsleri topladıktan sonra paydanın üssünü çıkar ve sonucu başlangıç ifadesinde kontrol et.']
  })
});

const gcdLcmFamily = defineSolverBackedMathFamily({
  id:'g8-math-gcd-lcm-reconstruction', grade:8, topicId:'gcd-lcm', outcomeId:'M.8.1.1.3', constructId:'reconstruct-number-from-gcd-lcm',
  claim:'İki doğal sayının EBOB, EKOK ve çarpım ilişkisini kullanarak bilinmeyen sayıyı bulur.',
  knowledgeComponents:['gcd','lcm','product-identity'], deepFeatures:['reverse-reconstruction','divisibility-check'],
  gameIds:['problem-hunter','error-detective'], skeletons:SKELETONS,
  generateParameters:({seed})=>pick([{g:6,l:180,a:30},{g:8,l:240,a:48},{g:9,l:270,a:45},{g:12,l:360,a:72}],seed),
  solve:t=>t.g*t.l/t.a,
  verify:(t,v)=>Number.isInteger(v)&&gcd(t.a,Number(v))===t.g&&(t.a*Number(v))/gcd(t.a,Number(v))===t.l,
  misconceptions:[
    {id:'lcm-divide-gcd',description:'Bilinen sayıyı kullanmadan EKOK’u EBOB’a bölmüştür.',feedback:'a·b=EBOB·EKOK ilişkisi kullanılmalıdır.',apply:t=>t.l/t.g},
    {id:'gcd-times-known',description:'EBOB ile bilinen sayıyı çarpmıştır.',feedback:'Bilinmeyen, EBOB·EKOK çarpımının bilinen sayıya bölümüdür.',apply:t=>t.g*t.a},
    {id:'lcm-divide-known',description:'EBOB çarpanını unutmuştur.',feedback:'Yalnız EKOK/bilinen sayı işlemi eksik kalır.',apply:t=>t.l/t.a}
  ],
  render:(t,{answer,skeleton})=>({
    context:`İki doğal sayının EBOB'u ${t.g}, EKOK'u ${t.l}'dir. Sayılardan biri ${t.a}'dır. ${skeletonNote(skeleton)}`,
    prompt:'Diğer doğal sayı kaçtır?', correctRationale:`a·b=EBOB·EKOK olduğundan b=${t.g}·${t.l}÷${t.a}=${answer}.`,
    steps:commonSteps([['temel bağıntıyı yaz',`a·b=${t.g}·${t.l}.`],['bilinen sayıyı yerleştir',`${t.a}·b=${t.g*t.l}.`],['bilinmeyeni yalnız bırak',`b=${t.g*t.l}÷${t.a}=${answer}.`],['EBOB ve EKOK ile doğrula',`EBOB(${t.a},${answer})=${t.g}, EKOK=${t.l}.`]]),
    hints:['İki sayının çarpımının EBOB ile EKOK çarpımına eşit olduğunu kullan.','Bulduğun sayıyla verilen sayının EBOB ve EKOK’unu yeniden hesaplayarak iki koşulu da kontrol et.']
  })
});

const linearEquationFamily = defineSolverBackedMathFamily({
  id:'g8-math-linear-equation-engine', grade:8, topicId:'linear-equations', outcomeId:'M.8.2.2.2', constructId:'solve-two-sided-linear-equation',
  claim:'Bilinmeyen iki tarafta bulunan doğrusal denklemi eşitlik ilkesini koruyarak çözer.',
  knowledgeComponents:['equation-balance','like-terms','substitution-check'], deepFeatures:['symbolic-isolation','reverse-verification'],
  gameIds:['problem-hunter','error-detective'], skeletons:SKELETONS,
  generateParameters:({seed})=>pick([{a:5,b:7,c:2,x:6},{a:7,b:-4,c:3,x:5},{a:6,b:9,c:2,x:8},{a:9,b:-6,c:4,x:4}],seed),
  solve:t=>t.x,
  verify:(t,v)=>t.a*Number(v)+t.b===t.c*Number(v)+(t.a*t.x+t.b-t.c*t.x),
  misconceptions:[
    {id:'move-without-sign',description:'Terimi diğer tarafa geçirirken işaretini değiştirmemiştir.',feedback:'Her iki tarafa aynı işlem uygulanmalıdır.',apply:t=>t.x+2},
    {id:'divide-before-combine',description:'x terimlerini birleştirmeden sabit sayıya bölmüştür.',feedback:'Önce bilinmeyenli ve sabit terimler ayrı taraflarda toplanmalıdır.',apply:t=>t.x-1},
    {id:'arithmetic-slip',description:'Son bölme işleminde hesap hatası yapmıştır.',feedback:'Bulunan değer başlangıç denklemine yerleştirilmelidir.',apply:t=>t.x+1}
  ],
  render:(t,{answer,skeleton})=>{const d=t.a*t.x+t.b-t.c*t.x; return {
    context:`${t.a}x ${t.b>=0?'+':'−'} ${Math.abs(t.b)} = ${t.c}x ${d>=0?'+':'−'} ${Math.abs(d)} denklemi veriliyor. ${skeletonNote(skeleton)}`,
    prompt:'Denklemin çözümü olan x değeri kaçtır?', correctRationale:`x terimleri ve sabitler ayrıldığında (${t.a-t.c})x=${d-t.b}; x=${answer}.`,
    steps:commonSteps([['x terimlerini bir tarafta topla',`${t.a}x−${t.c}x=${t.a-t.c}x.`],['sabitleri diğer tarafta topla',`${d}−(${t.b})=${d-t.b}.`],['katsayıya böl',`${t.a-t.c}x=${d-t.b} olduğundan x=${answer}.`],['yerine koyarak doğrula',`İki taraf da ${t.a*answer+t.b} değerini verir.`]]),
    hints:['Bilinmeyenli terimleri bir tarafta, sabit terimleri diğer tarafta toplarken eşitliğin iki tarafına aynı işlemi uygula.','Bulduğun x değerini denklemin iki tarafına da yerleştir; sonuçların eşit olması gerekir.']
  }}
});

const linearRelationFamily = defineSolverBackedMathFamily({
  id:'g8-math-linear-relation-engine', grade:8, topicId:'linear-relations', outcomeId:'M.8.2.2.4', constructId:'derive-linear-model-from-two-points',
  claim:'İki ölçümden sabit değişim hızını ve başlangıç değerini çıkararak doğrusal modeli kullanır.',
  knowledgeComponents:['slope','initial-value','linear-model'], deepFeatures:['rate-derivation','model-substitution'],
  gameIds:['problem-hunter','error-detective'], skeletons:SKELETONS,
  generateParameters:({seed})=>pick([{v0:180,rate:15,target:45},{v0:240,rate:20,target:80},{v0:300,rate:25,target:100},{v0:210,rate:14,target:70}],seed),
  solve:t=>(t.v0-t.target)/t.rate,
  verify:(t,v)=>t.v0-t.rate*Number(v)===t.target,
  misconceptions:[
    {id:'ignore-initial',description:'Hedefi doğrudan değişim hızına bölmüştür.',feedback:'Önce başlangıç ile hedef arasındaki fark bulunmalıdır.',apply:t=>t.target/t.rate},
    {id:'add-instead-subtract',description:'Azalma modelinde hedefi başlangıca eklemiştir.',feedback:'Depodaki miktar zamanla azalmaktadır.',apply:t=>(t.v0+t.target)/t.rate},
    {id:'off-by-one-rate',description:'Değişim aralığını yanlış saymıştır.',feedback:'Dakikalık hız toplam değişimin süre farkına bölümüdür.',apply:t=>(t.v0-t.target)/t.rate+1}
  ],
  render:(t,{answer,skeleton})=>({
    context:`Bir depoda başlangıçta ${t.v0} litre su vardır ve su miktarı her dakika ${t.rate} litre düzenli azalır. ${skeletonNote(skeleton)}`,
    prompt:`Su miktarı ${t.target} litre olduğunda kaç dakika geçmiştir?`, correctRationale:`V(t)=${t.v0}−${t.rate}t; ${t.target}=${t.v0}−${t.rate}t denklemi t=${answer} verir.`,
    steps:commonSteps([['doğrusal modeli kur',`V(t)=${t.v0}−${t.rate}t.`],['hedef değeri yerleştir',`${t.target}=${t.v0}−${t.rate}t.`],['farkı hıza böl',`${t.v0-t.target}÷${t.rate}=${answer}.`],['modelde doğrula',`${t.v0}−${t.rate}·${answer}=${t.target}.`]]),
    hints:['Başlangıç miktarıyla hedef miktar arasındaki toplam azalmayı bul.','Toplam azalmayı dakikalık azalma hızına böl ve sonucu doğrusal modelde kontrol et.']
  })
});

const probabilityFamily = defineSolverBackedMathFamily({
  id:'g8-math-probability-complement-engine', grade:8, topicId:'probability', outcomeId:'M.8.5.1.5', constructId:'use-complement-and-overlap-counting',
  claim:'Birleşim ve tümleyen ilişkisini kullanarak eş olasılıklı durumlarda istenen olasılığı hesaplar.',
  knowledgeComponents:['union','intersection','complement'], deepFeatures:['set-counting','probability-check'],
  gameIds:['problem-hunter','error-detective'], skeletons:SKELETONS,
  generateParameters:({seed})=>pick([{total:30,a:12,b:10,both:4},{total:40,a:15,b:14,both:5},{total:36,a:14,b:12,both:3},{total:50,a:18,b:16,both:6}],seed),
  solve:t=>{const fav=t.total-(t.a+t.b-t.both); return reduced(fav,t.total);},
  verify:(t,v)=>{const r=reduced(t.total-(t.a+t.b-t.both),t.total); return Number(v?.n)===r.n&&Number(v?.d)===r.d;},
  formatOption:v=>`${v.n}/${v.d}`,
  misconceptions:[
    {id:'double-count-overlap',description:'Kesişimdeki durumları iki kez çıkarmıştır.',feedback:'Birleşim sayısında kesişim bir kez geri eklenir.',apply:t=>reduced(t.total-(t.a+t.b),t.total)},
    {id:'union-not-complement',description:'İstenen tümleyen yerine birleşim olasılığını bulmuştur.',feedback:'Soru iki özelliğin de olmadığı durumları istemektedir.',apply:t=>reduced(t.a+t.b-t.both,t.total)},
    {id:'intersection-only',description:'Yalnız iki özelliği birden taşıyanları kullanmıştır.',feedback:'Kesişim, birleşim veya tümleyenle aynı değildir.',apply:t=>reduced(t.both,t.total)}
  ],
  render:(t,{answer,skeleton})=>({
    context:`${t.total} eş olasılıklı kartın ${t.a}'ü A özelliğini, ${t.b}'si B özelliğini taşır; ${t.both} kart iki özelliği de taşır. ${skeletonNote(skeleton)}`,
    prompt:'Rastgele seçilen kartın iki özelliği de taşımama olasılığı kaçtır?', correctRationale:`Birleşim ${t.a}+${t.b}−${t.both}=${t.a+t.b-t.both}; tümleyen ${t.total-(t.a+t.b-t.both)} karttır ve olasılık ${answer.n}/${answer.d}.`,
    steps:commonSteps([['A ve B birleşimini say',`${t.a}+${t.b}−${t.both}=${t.a+t.b-t.both}.`],['tümleyen sayısını bul',`${t.total}−${t.a+t.b-t.both}=${t.total-(t.a+t.b-t.both)}.`],['olasılığı kur',`${t.total-(t.a+t.b-t.both)}/${t.total}.`],['kesri sadeleştir',`Sonuç ${answer.n}/${answer.d}.`]]),
    hints:['A ve B sayıları toplanırken iki grupta ortak olan kartların iki kez sayıldığını unutma.','İki özelliği de taşımayanları bulmak için birleşim sayısını toplam kart sayısından çıkar.']
  })
});

const pythagorasFamily = defineSolverBackedMathFamily({
  id:'g8-math-pythagoras-engine', grade:8, topicId:'triangles', outcomeId:'M.8.3.1.5', constructId:'apply-pythagorean-relation',
  claim:'Dik üçgende iki kenar arasındaki Pisagor ilişkisini kurar ve geometrik sonucu doğrular.',
  knowledgeComponents:['right-triangle','squares','hypotenuse'], deepFeatures:['geometric-modeling','reverse-square-check'],
  gameIds:['problem-hunter','error-detective','geometry-lab'], skeletons:SKELETONS,
  generateParameters:({seed})=>pick([{a:9,b:12,c:15},{a:8,b:15,c:17},{a:12,b:16,c:20},{a:7,b:24,c:25}],seed),
  solve:t=>t.c,
  verify:(t,v)=>t.a*t.a+t.b*t.b===Number(v)*Number(v),
  misconceptions:[
    {id:'add-legs',description:'Dik kenarları doğrudan toplamıştır.',feedback:'Hipotenüs uzunluğu kenarların toplamı değil kareler toplamının kareköküdür.',apply:t=>t.a+t.b},
    {id:'square-sum-no-root',description:'Kareler toplamından karekök almamıştır.',feedback:'c² bulunduktan sonra c için karekök alınmalıdır.',apply:t=>t.a*t.a+t.b*t.b},
    {id:'difference-squares',description:'Kareleri toplamak yerine çıkarmıştır.',feedback:'İki dik kenar verildiğinde c²=a²+b² kullanılır.',apply:t=>Math.sqrt(Math.abs(t.b*t.b-t.a*t.a))}
  ],
  render:(t,{answer,skeleton})=>({
    context:`Dik üçgen biçimindeki bir destek parçasının dik kenarları ${t.a} cm ve ${t.b} cm'dir. ${skeletonNote(skeleton)}`,
    prompt:'Üçgenin hipotenüsü kaç santimetredir?', geometryPrompt:'Dik kenarların kareleri ilişkisine göre hipotenüs hangisidir?', correctRationale:`c²=${t.a}²+${t.b}²=${answer*answer}; c=${answer}.`,
    steps:commonSteps([['hipotenüsü belirle','Dik açının karşısındaki kenar c’dir.'],['Pisagor bağıntısını kur',`c²=${t.a}²+${t.b}².`],['kareleri topla',`c²=${answer*answer}.`],['pozitif karekökü al',`Uzunluk c=${answer} cm.`]]),
    hints:['Dik açının karşısındaki kenarın hipotenüs olduğunu belirle ve c²=a²+b² bağıntısını kur.','Kareler toplamını bulduktan sonra uzunluk için pozitif karekökü al; sonucu yeniden karesini alarak kontrol et.']
  })
});

const radicalFamily = defineSolverBackedMathFamily({
  id:'g8-math-radical-combination-engine', grade:8, topicId:'radicals', outcomeId:'M.8.1.3.4', constructId:'simplify-and-combine-radicals',
  claim:'Kök içindeki tam kare çarpanları ayırıp benzer köklü terimleri birleştirir.',
  knowledgeComponents:['perfect-square-factor','simplification','like-radicals'], deepFeatures:['structural-rewrite','coefficient-check'],
  gameIds:['problem-hunter','error-detective'], skeletons:SKELETONS,
  generateParameters:({seed})=>pick([{a:12,b:27,c:75},{a:8,b:18,c:50},{a:20,b:45,c:80},{a:28,b:63,c:112}],seed),
  solve:t=>{const base=gcd(gcd(t.a,t.b),t.c); const sf=n=>{let k=1;for(let i=1;i*i<=n;i++)if(n%(i*i)===0)k=i;return k;}; return sf(t.a)+sf(t.b)-sf(t.c);},
  verify:(t,v)=>Number.isFinite(Number(v))&&Number(v)===(()=>{const sf=n=>{let k=1;for(let i=1;i*i<=n;i++)if(n%(i*i)===0)k=i;return k;};return sf(t.a)+sf(t.b)-sf(t.c);})(),
  misconceptions:[
    {id:'combine-radicands',description:'Kök içlerini doğrudan toplayıp çıkarmıştır.',feedback:'Önce her kök sadeleştirilmeli ve yalnız aynı köklü terimlerin katsayıları işlenmelidir.',apply:t=>Math.round(Math.sqrt(Math.abs(t.a+t.b-t.c)))},
    {id:'ignore-minus',description:'Son terimin eksi işaretini toplamaya çevirmiştir.',feedback:'Sadeleştirmeden sonra da çıkarma işareti korunmalıdır.',apply:(t,a)=>Math.abs(a)+2},
    {id:'partial-simplification',description:'Tam kare çarpanlardan birini kök dışına çıkarmamıştır.',feedback:'Her kök içindeki en büyük tam kare çarpan kontrol edilmelidir.',apply:(t,a)=>a+1}
  ],
  render:(t,{answer,skeleton})=>({
    context:`√${t.a} + √${t.b} − √${t.c} ifadesi sadeleştirilecektir. ${skeletonNote(skeleton)}`,
    prompt:'İfade k√m biçiminde yazıldığında k katsayısı kaçtır?', correctRationale:`Her kök tam kare çarpanla sadeleştirilip ortak köklü terimlerin katsayıları işlenir; k=${answer}.`,
    steps:commonSteps([['her kökü tam kare çarpanla ayır',`√${t.a}, √${t.b}, √${t.c} ayrı ayrı sadeleştirilir.`],['ortak kök yapısını belirle','Sadeleşen terimler aynı kök türüne dönüşür.'],['katsayıları işaretleriyle birleştir',`İlk iki katsayı toplanır, üçüncü çıkarılır.`],['sayısal eşdeğerlikle doğrula',`Son katsayı ${answer} bulunur.`]]),
    hints:['Her kök içindeki en büyük tam kare çarpanı ayır; kök içleri eşit olmadan terimleri toplama.','Sadeleştirilmiş katsayıları işlerken üçüncü terimin eksi işaretini son adıma kadar koru.']
  })
});

const scientificFamily = defineSolverBackedMathFamily({
  id:'g8-math-scientific-notation-ratio', grade:8, topicId:'scientific-notation', outcomeId:'M.8.1.2.6', constructId:'compare-scientific-notation-values',
  claim:'Bilimsel gösterimde katsayı ve on kuvvetlerini ayrı işleyerek oran kurar.',
  knowledgeComponents:['scientific-notation','power-of-ten','ratio'], deepFeatures:['scale-reasoning','magnitude-check'],
  gameIds:['problem-hunter','error-detective'], skeletons:SKELETONS,
  generateParameters:({seed})=>pick([{a:6,b:3,p:7,q:5},{a:4,b:2,p:8,q:6},{a:9,b:3,p:6,q:4},{a:8,b:4,p:9,q:7}],seed),
  solve:t=>(t.a/t.b)*10**(t.p-t.q),
  verify:(t,v)=>Number(v)===(t.a*10**t.p)/(t.b*10**t.q),
  misconceptions:[
    {id:'subtract-coefficients',description:'Katsayıları bölmek yerine çıkarmıştır.',feedback:'Oranda katsayılar bölünür.',apply:t=>(t.a-t.b)*10**(t.p-t.q-1)},
    {id:'add-exponents',description:'Bölmede üsleri çıkarmak yerine toplamıştır.',feedback:'10^p / 10^q = 10^(p−q).',apply:t=>(t.a/t.b)*10**(t.p+t.q)},
    {id:'ignore-coefficients',description:'Yalnız on kuvvetlerini karşılaştırmıştır.',feedback:'Katsayı oranı da sonuca çarpan olarak katılır.',apply:t=>10**(t.p-t.q)}
  ],
  render:(t,{answer,skeleton})=>({
    context:`A=(${t.a}×10^${t.p}) ve B=(${t.b}×10^${t.q}) olarak veriliyor. ${skeletonNote(skeleton)}`,
    prompt:'A sayısı B sayısının kaç katıdır?', correctRationale:`A/B=(${t.a}/${t.b})×10^(${t.p}−${t.q})=${answer}.`,
    steps:commonSteps([['oranı kesir olarak yaz',`A/B=(${t.a}×10^${t.p})/(${t.b}×10^${t.q}).`],['katsayıları böl',`${t.a}/${t.b}=${t.a/t.b}.`],['on kuvvetlerinde üsleri çıkar',`10^${t.p-t.q}.`],['çarpanları birleştir',`Sonuç ${answer} kattır.`]]),
    hints:['Katsayıların oranını ve on kuvvetlerinin oranını iki ayrı parça olarak hesapla.','Bölme işleminde aynı tabanlı kuvvetlerin üslerini çıkar ve büyüklük tahminiyle sonucu kontrol et.']
  })
});

const dataFamily = defineSolverBackedMathFamily({
  id:'g8-math-weighted-data-engine', grade:8, topicId:'data-analysis', outcomeId:'M.8.4.1.2', constructId:'compute-weighted-mean',
  claim:'Frekanslı verilerde ağırlıklı toplamı toplam frekansa bölerek ortalamayı hesaplar.',
  knowledgeComponents:['frequency','weighted-sum','mean'], deepFeatures:['table-modeling','range-check'],
  gameIds:['problem-hunter','error-detective'], skeletons:SKELETONS,
  generateParameters:({seed})=>pick([{values:[60,70,80],freq:[2,3,5]},{values:[50,75,100],freq:[2,5,3]},{values:[40,60,90],freq:[2,5,3]},{values:[65,75,85],freq:[5,2,3]}],seed),
  solve:t=>t.values.reduce((s,v,i)=>s+v*t.freq[i],0)/t.freq.reduce((a,b)=>a+b,0),
  verify:(t,v)=>Number(v)*t.freq.reduce((a,b)=>a+b,0)===t.values.reduce((s,x,i)=>s+x*t.freq[i],0),
  misconceptions:[
    {id:'ignore-frequency',description:'Değerlerin sıradan aritmetik ortalamasını almıştır.',feedback:'Her değer frekansı kadar ağırlık taşır.',apply:t=>t.values.reduce((a,b)=>a+b,0)/t.values.length},
    {id:'divide-by-category',description:'Ağırlıklı toplamı toplam gözlem yerine kategori sayısına bölmüştür.',feedback:'Payda frekansların toplamıdır.',apply:t=>t.values.reduce((s,v,i)=>s+v*t.freq[i],0)/t.values.length},
    {id:'average-frequencies',description:'Değerler yerine frekansların ortalamasını hesaplamıştır.',feedback:'Frekanslar ağırlıktır, ölçülen değer değildir.',apply:t=>t.freq.reduce((a,b)=>a+b,0)/t.freq.length}
  ],
  render:(t,{answer,skeleton})=>({
    context:`Bir ölçüm tablosunda değerler ${t.values.join(', ')}, bu değerlerin frekansları sırasıyla ${t.freq.join(', ')} olarak verilmiştir. ${skeletonNote(skeleton)}`,
    prompt:'Veri grubunun aritmetik ortalaması kaçtır?', correctRationale:`Ağırlıklı toplam ${t.values.reduce((s,v,i)=>s+v*t.freq[i],0)}, toplam frekans ${t.freq.reduce((a,b)=>a+b,0)}; ortalama ${answer}.`,
    steps:commonSteps([['her değeri frekansıyla çarp',t.values.map((v,i)=>`${v}·${t.freq[i]}`).join(' + ')],['ağırlıklı toplamı bul',`${t.values.reduce((s,v,i)=>s+v*t.freq[i],0)}.`],['toplam gözlem sayısını bul',`${t.freq.reduce((a,b)=>a+b,0)}.`],['toplamı gözlem sayısına böl',`Ortalama ${answer}.`]]),
    hints:['Her değerin kaç kez tekrarlandığını hesaba kat; yalnız üç farklı değerin ortalamasını alma.','Ağırlıklı toplamı frekansların toplamına böl ve sonucun en küçük ile en büyük değer arasında olduğunu kontrol et.']
  })
});

const inequalityFamily = defineSolverBackedMathFamily({
  id:'g8-math-inequality-capacity-engine', grade:8, topicId:'linear-inequalities', outcomeId:'M.8.2.3.3', constructId:'solve-integer-capacity-inequality',
  claim:'Günlük hayat kısıtını eşitsizliğe çevirip en büyük doğal sayı çözümünü belirler.', knowledgeComponents:['linear-inequality','integer-bound','capacity-interpretation'], deepFeatures:['constraint-modeling','boundary-verification'], gameIds:['problem-hunter','error-detective'], skeletons:SKELETONS,
  generateParameters:({seed})=>pick([{fixed:35,unit:7,budget:210},{fixed:48,unit:9,budget:300},{fixed:60,unit:12,budget:420},{fixed:27,unit:8,budget:235}],seed),
  solve:t=>Math.floor((t.budget-t.fixed)/t.unit), verify:(t,v)=>Number.isInteger(Number(v))&&t.fixed+t.unit*Number(v)<=t.budget&&t.fixed+t.unit*(Number(v)+1)>t.budget,
  misconceptions:[
    {id:'ignore-fixed-cost',description:'Sabit başlangıç maliyetini bütçeden düşmeden bölme yapmıştır.',feedback:'Değişken harcamaya ayrılabilecek miktar önce sabit maliyet çıkarılarak bulunmalıdır.',apply:t=>Math.floor(t.budget/t.unit)},
    {id:'round-up-capacity',description:'Ondalıklı sonucu yukarı yuvarlayarak bütçeyi aşan bir sayı seçmiştir.',feedback:'“En fazla” koşulunda bütçeyi aşmayan en büyük tam sayı gerekir.',apply:t=>Math.floor((t.budget-t.fixed)/t.unit)+1},
    {id:'add-fixed-cost',description:'Sabit maliyeti bütçeden çıkarmak yerine bütçeye eklemiştir.',feedback:'Sabit maliyet kullanılabilir bütçeyi artırmaz, azaltır.',apply:t=>Math.floor((t.budget+t.fixed)/t.unit)}
  ],
  render:(t,{answer,skeleton})=>({context:`Bir etkinlik için ${t.fixed} TL sabit hazırlık gideri ve katılan her öğrenci için ${t.unit} TL gider vardır. Toplam bütçe ${t.budget} TL'yi aşamaz. ${skeletonNote(skeleton)}`,prompt:'Etkinliğe en fazla kaç öğrenci katılabilir?',correctRationale:`${t.fixed}+${t.unit}x≤${t.budget} eşitsizliğinden en büyük doğal sayı ${answer}'dir.`,steps:commonSteps([['kısıtı eşitsizliğe çevir',`${t.fixed}+${t.unit}x≤${t.budget}.`],['sabit gideri çıkar',`${t.unit}x≤${t.budget-t.fixed}.`],['tam sayı sınırını yorumla',`x≤${(t.budget-t.fixed)/t.unit}; en büyük doğal sayı ${answer}.`],['bir fazlasını kontrol et',`${answer+1} öğrenci bütçeyi aşar.`]]),hints:['Önce sabit gideri bütçeden çıkar; kalan para öğrenci başına gider için kullanılabilir.','“En fazla” ifadesi nedeniyle bölme sonucunu aşağıdaki tam sayıya indir ve bir fazlasını ayrıca kontrol et.']})
});

const transformationFamily = defineSolverBackedMathFamily({
  id:'g8-math-compound-transformation-engine', grade:8, topicId:'transformations', outcomeId:'M.8.3.2.3', constructId:'compose-reflection-and-translation', claim:'Koordinat düzleminde yansıma ve ötelemeyi doğru sırayla bileştirir.', knowledgeComponents:['reflection-y-axis','translation','coordinate-pair'], deepFeatures:['ordered-transformation','coordinate-verification'], gameIds:['problem-hunter','error-detective','geometry-lab'], skeletons:SKELETONS,
  generateParameters:({seed})=>pick([{x:2,y:3,dx:4,dy:-1},{x:-3,y:2,dx:5,dy:3},{x:4,y:-2,dx:-3,dy:4},{x:-2,y:-4,dx:6,dy:2}],seed), solve:t=>({x:-t.x+t.dx,y:t.y+t.dy}), verify:(t,v)=>Number(v?.x)===-t.x+t.dx&&Number(v?.y)===t.y+t.dy, formatOption:v=>`(${v.x}, ${v.y})`,
  misconceptions:[
    {id:'translate-before-reflect',description:'Önce öteleyip sonra yansıtmıştır.',feedback:'Dönüşümlerin sırası sonucu değiştirir.',apply:t=>({x:-(t.x+t.dx),y:t.y+t.dy})},
    {id:'reflect-x-axis',description:'y ekseni yerine x eksenine göre yansıtmıştır.',feedback:'y eksenine yansımada x işaret değiştirir.',apply:t=>({x:t.x+t.dx,y:-t.y+t.dy})},
    {id:'translation-only',description:'Yansımayı atlayıp yalnız öteleme yapmıştır.',feedback:'İlk adımda x koordinatının işareti değişmelidir.',apply:t=>({x:t.x+t.dx,y:t.y+t.dy})}
  ],
  render:(t,{answer,skeleton})=>({context:`A(${t.x}, ${t.y}) noktası önce y eksenine göre yansıtılıyor, sonra (${t.dx}, ${t.dy}) vektörüyle öteleniyor. ${skeletonNote(skeleton)}`,prompt:'Son görüntü noktasının koordinatları hangisidir?',geometryPrompt:'Dönüşüm sırası doğru uygulandığında son nokta hangisidir?',correctRationale:`Yansıma sonrası (${-t.x}, ${t.y}), öteleme sonrası (${answer.x}, ${answer.y}).`,steps:commonSteps([['yansıma kuralını uygula',`(${t.x},${t.y})→(${-t.x},${t.y}).`],['x ötelemesini uygula',`${-t.x}+(${t.dx})=${answer.x}.`],['y ötelemesini uygula',`${t.y}+(${t.dy})=${answer.y}.`],['işlemleri geri alarak doğrula',`Son noktadan öteleme geri alınınca yansıma noktası elde edilir.`]]),hints:['İlk işlem y eksenine yansıma olduğundan yalnız x koordinatının işaretini değiştir.','Ara noktaya öteleme vektörünün x ve y bileşenlerini işaretleriyle ekle.']})
});

const cylinderVolumeFamily = defineSolverBackedMathFamily({
  id:'g8-math-cylinder-volume-engine', grade:8, topicId:'geometric-solids', outcomeId:'M.8.3.4.4', constructId:'derive-and-use-cylinder-volume', claim:'Silindir hacmini taban alanı ile yükseklik çarpımı olarak modeller.', knowledgeComponents:['circle-area','cylinder-volume','unit-cube'], deepFeatures:['solid-modeling','formula-verification'], gameIds:['problem-hunter','error-detective','geometry-lab'], skeletons:SKELETONS,
  generateParameters:({seed})=>pick([{radius:3,height:10,pi:3},{radius:4,height:6,pi:3},{radius:5,height:8,pi:3},{radius:6,height:5,pi:3}],seed), solve:t=>t.pi*t.radius**2*t.height, verify:(t,v)=>Number(v)===t.pi*t.radius*t.radius*t.height,
  misconceptions:[
    {id:'radius-not-squared',description:'Daire alanında yarıçapın karesini almayı unutmuştur.',feedback:'Taban alanı πr² olmalıdır.',apply:t=>t.pi*t.radius*t.height},
    {id:'lateral-area',description:'Hacim yerine yanal alan bağıntısını kullanmıştır.',feedback:'2πrh yüzey ölçüsüdür.',apply:t=>2*t.pi*t.radius*t.height},
    {id:'base-area-only',description:'Taban alanını bulup yüksekliği çarpmamıştır.',feedback:'Hacim taban alanı ile yüksekliğin çarpımıdır.',apply:t=>t.pi*t.radius**2}
  ],
  render:(t,{answer,skeleton})=>({context:`Yarıçapı ${t.radius} cm, yüksekliği ${t.height} cm olan silindir için π=${t.pi} alınacaktır. ${skeletonNote(skeleton)}`,prompt:'Silindirin hacmi kaç santimetreküptür?',geometryPrompt:'Taban alanı ve yükseklik birlikte kullanıldığında hacim kaç cm³ olur?',correctRationale:`πr²h=${t.pi}·${t.radius}²·${t.height}=${answer}.`,steps:commonSteps([['tabanı daire olarak modelle','Taban alanı πr².'],['taban alanını hesapla',`${t.pi}·${t.radius}²=${t.pi*t.radius*t.radius}.`],['yükseklikle çarp',`${t.pi*t.radius*t.radius}·${t.height}=${answer}.`],['birimi doğrula','cm²·cm=cm³.']]),hints:['Önce dairesel tabanın alanını πr² ile bul; yarıçapı yalnız bir kez kullanma.','Hacim için taban alanını yükseklikle çarp ve sonuç biriminin küp birim olduğunu kontrol et.']})
});

const inequalitySetFamily = defineSolverBackedMathFamily({
  id:'g8-math-inequality-solution-set', grade:8, topicId:'linear-inequalities', outcomeId:'M.8.2.3.4', constructId:'count-integer-solutions-in-interval', claim:'İki eşitsizliği birlikte çözerek tam sayı çözüm kümesini ve eleman sayısını belirler.', knowledgeComponents:['compound-inequality','integer-set','open-bound'], deepFeatures:['intersection','boundary-check'], gameIds:['problem-hunter','error-detective'], skeletons:SKELETONS,
  generateParameters:({seed})=>pick([{low:3,high:11},{low:-2,high:7},{low:5,high:14},{low:-5,high:4}],seed), solve:t=>t.high-t.low-1, verify:(t,v)=>Number(v)===[...Array(t.high-t.low-1)].length,
  misconceptions:[
    {id:'include-bounds',description:'Açık sınırları çözüm kümesine dahil etmiştir.',feedback:'< işareti sınır değerleri dışarıda bırakır.',apply:t=>t.high-t.low+1},
    {id:'include-one-bound',description:'Sınırların yalnız birini dışarıda bırakmıştır.',feedback:'Her iki eşitsizlik de sıkıdır.',apply:t=>t.high-t.low},
    {id:'exclude-interior-ends',description:'İlk ve son geçerli tam sayıyı da yanlışlıkla dışarıda bırakmıştır.',feedback:'Yalnız verilen sınırlar dışarıdadır; aradaki ilk ve son tam sayılar çözüme dahildir.',apply:t=>Math.max(0,t.high-t.low-2)}
  ],
  render:(t,{answer,skeleton})=>({context:`x bir tam sayı ve ${t.low}<x<${t.high} koşulunu sağlıyor. ${skeletonNote(skeleton)}`,prompt:'Çözüm kümesinde kaç tam sayı vardır?',correctRationale:`Sınırlar alınmadan ${t.low+1} ile ${t.high-1} arasındaki tam sayılar sayılır; toplam ${answer}.`,steps:commonSteps([['alt sınırı yorumla',`İlk tam sayı ${t.low+1}.`],['üst sınırı yorumla',`Son tam sayı ${t.high-1}.`],['tam sayıları say',`${t.high-1}−${t.low+1}+1=${answer}.`],['sınırları doğrula',`${t.low} ve ${t.high} çözüm değildir.`]]),hints:['“<” işareti nedeniyle iki sınır değerini de çözüm listesine alma.','İlk ve son tam sayıyı yazdıktan sonra son−ilk+1 yöntemiyle say ve gerçek listeyle kontrol et.']})
});

const triangleInequalityFamily = defineSolverBackedMathFamily({
  id:'g8-math-triangle-inequality-engine', grade:8, topicId:'triangles', outcomeId:'M.8.3.1.2', constructId:'count-third-side-integers', claim:'Üçgen eşitsizliğini kullanarak üçüncü kenarın alabileceği tam sayı değerlerini belirler.', knowledgeComponents:['triangle-inequality','absolute-difference','integer-count'], deepFeatures:['double-bound','degenerate-case-check'], gameIds:['problem-hunter','error-detective','geometry-lab'], skeletons:SKELETONS,
  generateParameters:({seed})=>pick([{a:7,b:12},{a:8,b:15},{a:9,b:14},{a:11,b:16}],seed), solve:t=>t.a+t.b-Math.abs(t.a-t.b)-1, verify:(t,v)=>Number(v)===[...Array(t.a+t.b-Math.abs(t.a-t.b)-1)].length,
  misconceptions:[
    {id:'include-degenerate-bounds',description:'Eşitlik durumlarını geçerli üçgen saymıştır.',feedback:'Üçüncü kenar farktan büyük, toplamdan küçük olmalıdır.',apply:t=>t.a+t.b-Math.abs(t.a-t.b)+1},
    {id:'upper-bound-only',description:'Yalnız toplamdan küçük olma koşulunu kullanmıştır.',feedback:'Alt sınır olan kenar farkı da gereklidir.',apply:t=>t.a+t.b-1},
    {id:'difference-only',description:'Yalnız kenar farkını sonuç sanmıştır.',feedback:'İki sınır arasındaki bütün tam sayılar sayılmalıdır.',apply:t=>Math.abs(t.a-t.b)}
  ],
  render:(t,{answer,skeleton})=>({context:`İki kenarı ${t.a} cm ve ${t.b} cm olan bir üçgenin üçüncü kenarı x cm ve tam sayıdır. ${skeletonNote(skeleton)}`,prompt:'x kaç farklı tam sayı değeri alabilir?',geometryPrompt:'Üçgen eşitsizliğine göre üçüncü kenarın kaç tam sayı seçeneği vardır?',correctRationale:`|${t.b}−${t.a}|<x<${t.a+t.b}; sınırlar alınmadan ${answer} tam sayı vardır.`,steps:commonSteps([['alt sınırı kur',`x>${Math.abs(t.a-t.b)}.`],['üst sınırı kur',`x<${t.a+t.b}.`],['ilk ve son tam sayıyı belirle',`${Math.abs(t.a-t.b)+1} ile ${t.a+t.b-1}.`],['değerleri say',`Toplam ${answer} tam sayı.`]]),hints:['Üçüncü kenar, diğer iki kenarın farkından büyük ve toplamından küçük olmalıdır.','Sınır değerler üçgeni doğrusal yaptığı için alınmaz; açık aralıktaki tam sayıları say.']})
});

const cylinderSurfaceFamily = defineSolverBackedMathFamily({
  id:'g8-math-cylinder-surface-area-engine', grade:8, topicId:'geometric-solids', outcomeId:'M.8.3.4.5', constructId:'compute-total-cylinder-surface', claim:'Silindirin iki tabanı ile yanal yüzünü ayırarak toplam yüzey alanını hesaplar.', knowledgeComponents:['circle-area','lateral-area','total-surface'], deepFeatures:['net-decomposition','unit-square-check'], gameIds:['problem-hunter','error-detective','geometry-lab'], skeletons:SKELETONS,
  generateParameters:({seed})=>pick([{r:3,h:8,pi:3},{r:4,h:7,pi:3},{r:5,h:6,pi:3},{r:6,h:5,pi:3}],seed), solve:t=>2*t.pi*t.r*t.r+2*t.pi*t.r*t.h, verify:(t,v)=>Number(v)===2*t.pi*t.r*(t.r+t.h),
  misconceptions:[
    {id:'one-base',description:'Silindirin yalnız bir dairesel tabanını hesaba katmıştır.',feedback:'Kapalı silindirde iki eş taban vardır.',apply:t=>t.pi*t.r*t.r+2*t.pi*t.r*t.h},
    {id:'lateral-only',description:'Yalnız yanal dikdörtgen alanını hesaplamıştır.',feedback:'Toplam yüzeye iki taban da eklenmelidir.',apply:t=>2*t.pi*t.r*t.h},
    {id:'volume-formula',description:'Yüzey alanı yerine hacim bağıntısını kullanmıştır.',feedback:'πr²h hacimdir, birimi küptür.',apply:t=>t.pi*t.r*t.r*t.h}
  ],
  render:(t,{answer,skeleton})=>({context:`Yarıçapı ${t.r} cm, yüksekliği ${t.h} cm olan kapalı silindirin bütün dış yüzeyi kaplanacaktır. π=${t.pi}. ${skeletonNote(skeleton)}`,prompt:'Toplam yüzey alanı kaç santimetrekaredir?',geometryPrompt:'Silindirin açınımındaki iki daire ve dikdörtgenin toplam alanı kaç cm² olur?',correctRationale:`2πr²+2πrh=2·${t.pi}·${t.r}²+2·${t.pi}·${t.r}·${t.h}=${answer}.`,steps:commonSteps([['iki tabanın alanını bul',`2πr²=${2*t.pi*t.r*t.r}.`],['yanal alanı bul',`2πrh=${2*t.pi*t.r*t.h}.`],['alanları topla',`${2*t.pi*t.r*t.r}+${2*t.pi*t.r*t.h}=${answer}.`],['birimi kontrol et','Yüzey ölçüsü cm² olmalıdır.']]),hints:['Kapalı silindirin iki dairesel tabanı olduğunu unutma; taban alanını iki kez al.','Yanal yüz açıldığında çevresi 2πr, yüksekliği h olan bir dikdörtgendir.']})
});

export const GRADE8_SOLVER_BACKED_MATH_FAMILIES = Object.freeze([
  exponentFamily,gcdLcmFamily,linearEquationFamily,linearRelationFamily,probabilityFamily,
  pythagorasFamily,radicalFamily,scientificFamily,dataFamily,inequalityFamily,
  transformationFamily,cylinderVolumeFamily,inequalitySetFamily,triangleInequalityFamily,cylinderSurfaceFamily
]);
