import { defineSolverBackedMathFamily } from './solver-backed-math-family-engine.js';

const SKELETONS = Object.freeze([
  Object.freeze({ id: 'story-model', reasoningPathId: 'story-to-operation', experienceType: 'story-modeling', surfaceDomain: 'daily-life' }),
  Object.freeze({ id: 'reverse-model', reasoningPathId: 'result-to-missing-part', experienceType: 'reverse-reasoning', surfaceDomain: 'missing-information' }),
  Object.freeze({ id: 'strategy-check', reasoningPathId: 'compare-and-check', experienceType: 'strategy-comparison', surfaceDomain: 'solution-review' })
]);

function pick(list, seed) { return list[Math.abs(Number(seed)) % list.length]; }
function gcd(a, b) { let x=Math.abs(a), y=Math.abs(b); while (y) [x,y]=[y,x%y]; return x; }
function reduceFraction(numerator, denominator) { const d=gcd(numerator, denominator); return { numerator:numerator/d, denominator:denominator/d }; }
function formatFraction(value) { return `${value.numerator}/${value.denominator}`; }
function sameFraction(left, right) { return Number(left?.numerator)*Number(right?.denominator)===Number(right?.numerator)*Number(left?.denominator); }
function formatClock(minutes) { const value=Number(minutes); return `${String(Math.floor(value/60)%24).padStart(2,'0')}.${String(value%60).padStart(2,'0')}`; }
function skeletonNote(skeleton) {
  return skeleton.id === 'story-model' ? 'Öyküdeki nicelikleri işlem modeline dönüştür.'
    : skeleton.id === 'reverse-model' ? 'Sonuçtan geriye giderek eksik niceliği kur.'
      : 'İki çözüm yolunu karşılaştırıp sonucu başlangıç verileriyle denetle.';
}
function steps(rows) { return rows.map(([action,evidence])=>({action,evidence})); }

const barChartFamily = defineSolverBackedMathFamily({
  id:'g4-math-bar-chart-reasoning', grade:4, topicId:'data-and-graphs', outcomeId:'M.4.4.1.2', constructId:'compare-grouped-data-totals',
  claim:'Sütun grafiği verilerini iki grupta toplayıp farkı yorumlar.', knowledgeComponents:['data-reading','grouped-addition','difference'], deepFeatures:['multi-category-comparison','result-interpretation'],
  gameIds:['problem-hunter','error-detective'], skeletons:SKELETONS,
  generateParameters:({seed})=>pick([{a:18,b:25,c:21,d:30},{a:16,b:27,c:24,d:33},{a:22,b:31,c:19,d:28},{a:14,b:26,c:23,d:35}],seed),
  solve:t=>(t.b+t.d)-(t.a+t.c), verify:(t,v)=>Number(v)+(t.a+t.c)===t.b+t.d,
  misconceptions:[
    {id:'larger-total-only',description:'Fark yerine büyük grubun toplamını cevaplamıştır.',feedback:'“Kaç fazla” sorusunda iki toplamın farkı gerekir.',apply:t=>t.b+t.d},
    {id:'smaller-total-only',description:'Karşılaştırmayı tamamlamadan küçük grubun toplamını vermiştir.',feedback:'İki grup ayrı toplanıp büyükten küçük çıkarılmalıdır.',apply:t=>t.a+t.c},
    {id:'single-pair-difference',description:'Dört veriyi kullanmak yerine yalnız son iki değeri karşılaştırmıştır.',feedback:'Soruda iki günlük grup toplamı karşılaştırılmaktadır.',apply:t=>Math.abs(t.d-t.c)}
  ],
  render:(t,{answer,skeleton})=>({
    context:`Bir geri dönüşüm grafiğinde pazartesi ${t.a}, salı ${t.b}, çarşamba ${t.c}, perşembe ${t.d} kilogram kâğıt gösteriliyor. ${skeletonNote(skeleton)}`,
    prompt:'Salı ve perşembe toplamı, pazartesi ve çarşamba toplamından kaç kilogram fazladır?',
    correctRationale:`${t.b}+${t.d}=${t.b+t.d}, ${t.a}+${t.c}=${t.a+t.c}; fark ${answer}.`,
    steps:steps([['salı-perşembe grubunu topla',`${t.b}+${t.d}=${t.b+t.d}.`],['pazartesi-çarşamba grubunu topla',`${t.a}+${t.c}=${t.a+t.c}.`],['fazlalık işlemini seç','Büyük toplamdan küçük toplam çıkarılır.'],['farkı hesapla',`${t.b+t.d}−${t.a+t.c}=${answer}.`]]),
    hints:['Önce salı ile perşembe değerlerini, sonra pazartesi ile çarşamba değerlerini ayrı ayrı topla.','“Kaç fazla” ifadesi yalnız büyük toplamı değil, iki grup arasındaki farkı istediğini gösterir.']
  })
});

const divisionContainersFamily = defineSolverBackedMathFamily({
  id:'g4-math-division-remainder-containers', grade:4, topicId:'division', outcomeId:'M.4.1.5.3', constructId:'interpret-quotient-and-remainder-in-containers',
  claim:'Bölüm ve kalanı gerçek yaşam bağlamında kutu sayısına dönüştürür.', knowledgeComponents:['division','remainder','ceiling-interpretation'], deepFeatures:['remainder-meaning','real-world-rounding'],
  gameIds:['problem-hunter','error-detective'], skeletons:SKELETONS,
  generateParameters:({seed})=>pick([{total:157,capacity:12},{total:185,capacity:16},{total:214,capacity:15},{total:263,capacity:20}],seed),
  solve:t=>Math.ceil(t.total/t.capacity), verify:(t,v)=>Number.isInteger(Number(v))&&Number(v)*t.capacity>=t.total&&(Number(v)-1)*t.capacity<t.total,
  misconceptions:[
    {id:'quotient-only',description:'Kalan nesneler için yeni kutu gerektiğini göz ardı etmiştir.',feedback:'Kalan sıfır değilse bir kutu daha gerekir.',apply:t=>Math.floor(t.total/t.capacity)},
    {id:'remainder-as-box',description:'Bölme işlemindeki kalanı doğrudan kutu sayısı sanmıştır.',feedback:'Kalan, yerleşmemiş kitap sayısıdır; kutu sayısı değildir.',apply:t=>t.total%t.capacity},
    {id:'unnecessary-extra-box',description:'Kalan için gerekli kutuyu ekledikten sonra bir kutu daha eklemiştir.',feedback:'En az kutu sayısı, bütün kitapları alan ilk tam kutu sayısıdır.',apply:t=>Math.ceil(t.total/t.capacity)+1}
  ],
  render:(t,{answer,skeleton})=>({
    context:`Bir depoda ${t.total} kitap, her biri en fazla ${t.capacity} kitap alan kutulara yerleştirilecektir. ${skeletonNote(skeleton)}`,
    prompt:'Bütün kitaplar için en az kaç kutu gerekir?',
    correctRationale:`${t.total}÷${t.capacity}=${Math.floor(t.total/t.capacity)} kalan ${t.total%t.capacity}; kalan için bir kutu daha gerekir, toplam ${answer}.`,
    steps:steps([['toplamı kapasiteye böl',`${t.total}÷${t.capacity} işlemi kurulur.`],['bölüm ve kalanı belirle',`${Math.floor(t.total/t.capacity)} tam kutu, ${t.total%t.capacity} kitap artar.`],['kalanı gerçek yaşamda yorumla','Artan kitaplar için yeni kutu gerekir.'],['en az kutu sayısını doğrula',`${answer-1} kutu yetmez, ${answer} kutu yeter.`]]),
    hints:['Bölme işlemindeki bölüm tam dolu kutuları, kalan ise henüz kutuya yerleşmemiş kitapları gösterir.','Kalan sıfır değilse bölüm sayısına bir kutu ekle ve bir eksik kutunun kapasitesini kontrol et.']
  })
});

const equalFractionsFamily = defineSolverBackedMathFamily({
  id:'g4-math-equal-denominator-fractions', grade:4, topicId:'fractions', outcomeId:'M.4.1.6.5', constructId:'combine-and-compare-like-denominator-fractions',
  claim:'Paydaları eşit kesirlerde işlemi paylar üzerinden yapıp sonucu sadeleştirir.', knowledgeComponents:['like-denominators','fraction-addition','simplification'], deepFeatures:['part-whole-model','equivalence-check'],
  gameIds:['problem-hunter','error-detective'], skeletons:SKELETONS,
  generateParameters:({seed})=>pick([{a:3,b:2,c:1,d:8},{a:4,b:3,c:2,d:10},{a:5,b:2,c:1,d:12},{a:6,b:3,c:2,d:14}],seed),
  solve:t=>reduceFraction(t.a+t.b-t.c,t.d), verify:(t,v)=>sameFraction(v,{numerator:t.a+t.b-t.c,denominator:t.d}), formatOption:formatFraction,
  misconceptions:[
    {id:'add-denominators',description:'Paylarla birlikte paydaları da toplama işlemine katmıştır.',feedback:'Eş paydalı kesirlerde payda değişmez.',apply:t=>reduceFraction(t.a+t.b-t.c,t.d+t.d)},
    {id:'ignore-subtraction',description:'Çıkarılan kesri de toplamıştır.',feedback:'Üçüncü kesrin payı çıkarılmalıdır.',apply:t=>reduceFraction(t.a+t.b+t.c,t.d)},
    {id:'use-only-first-two',description:'Son kesri işleme katmadan ilk iki kesri toplamıştır.',feedback:'İşlemdeki bütün terimler kullanılmalıdır.',apply:t=>reduceFraction(t.a+t.b,t.d)}
  ],
  render:(t,{answer,skeleton})=>({
    context:`Bir şeridin önce ${t.a}/${t.d}'i, sonra ${t.b}/${t.d}'i boyanıyor; daha sonra ${t.c}/${t.d}'lik bölüm siliniyor. ${skeletonNote(skeleton)}`,
    prompt:'Son durumda şeridin boyalı kısmı hangi kesirdir?',
    correctRationale:`Paydalar eşit olduğundan (${t.a}+${t.b}−${t.c})/${t.d}=${formatFraction(answer)}.`,
    steps:steps([['bütünün eş parçalarını belirle',`Bütün ${t.d} eş parçaya ayrılmıştır.`],['boyanan payları topla',`${t.a}+${t.b}=${t.a+t.b}.`],['silinen payı çıkar',`${t.a+t.b}−${t.c}=${t.a+t.b-t.c}.`],['kesri sadeleştir',`Sonuç ${formatFraction(answer)}.`]]),
    hints:['Paydalar eşit olduğu için bütünün parça büyüklüğü değişmez; yalnız paylar üzerinde işlem yap.','Boyanan iki kısmı topladıktan sonra silinen kısmı çıkar ve kesrin sadeleşip sadeleşmediğini kontrol et.']
  })
});

const fractionQuantityFamily = defineSolverBackedMathFamily({
  id:'g4-math-fraction-of-quantity', grade:4, topicId:'fractions', outcomeId:'M.4.1.6.6', constructId:'apply-sequential-fractions-to-quantity',
  claim:'Bir miktarın kesrini ve ardından yeni bütünün kesrini çok adımlı olarak bulur.', knowledgeComponents:['fraction-of-quantity','changing-whole','division-multiplication'], deepFeatures:['nested-part-whole','whole-redefinition'],
  gameIds:['problem-hunter','error-detective'], skeletons:SKELETONS,
  generateParameters:({seed})=>pick([{total:32,n:3,d:8,second:3},{total:48,n:3,d:6,second:4},{total:40,n:3,d:5,second:3},{total:56,n:4,d:7,second:4}],seed),
  solve:t=>(t.total/t.d*t.n)/t.second, verify:(t,v)=>Number(v)*t.second===t.total/t.d*t.n,
  misconceptions:[
    {id:'stop-first-fraction',description:'İlk kesir sonucunda durup ikinci oranı uygulamamıştır.',feedback:'İkinci oran, ilk adımda bulunan yeni miktara uygulanır.',apply:t=>t.total/t.d*t.n},
    {id:'second-on-original',description:'İkinci kesri başlangıçtaki bütüne uygulamıştır.',feedback:'İkinci bütün artık ilk gruba katılanlardır.',apply:t=>t.total/t.second},
    {id:'multiply-denominators-only',description:'Kesirlerin paydalarını doğrudan kullanarak miktar modelini atlamıştır.',feedback:'Her adımda ilgili bütün bölünüp pay kadar alınmalıdır.',apply:t=>Math.round(t.total/(t.d*t.second))}
  ],
  render:(t,{answer,skeleton})=>({
    context:`${t.total} öğrencinin ${t.n}/${t.d}'i bilim kulübüne katılıyor. Katılanların 1/${t.second}'i sunum yapacaktır. ${skeletonNote(skeleton)}`,
    prompt:'Sunum yapacak öğrenci sayısı kaçtır?',
    correctRationale:`${t.total}÷${t.d}×${t.n}=${t.total/t.d*t.n}; sonra ${t.total/t.d*t.n}÷${t.second}=${answer}.`,
    steps:steps([['ilk bütünü belirle',`Başlangıçta ${t.total} öğrenci vardır.`],['kulübe katılanları bul',`${t.total}÷${t.d}×${t.n}=${t.total/t.d*t.n}.`],['yeni bütünü tanı','İkinci kesir kulüp öğrencilerine uygulanır.'],['sunum grubunu hesapla',`${t.total/t.d*t.n}÷${t.second}=${answer}.`]]),
    hints:['Önce bütün sınıfın verilen kesrini bul; ikinci kesri doğrudan bütün sınıfa uygulama.','İlk adımda bulduğun kulüp öğrencileri ikinci işlemin yeni bütünü olur.']
  })
});

const liquidFamily = defineSolverBackedMathFamily({
  id:'g4-math-liquid-measure-engine', grade:4, topicId:'liquid-measurement', outcomeId:'M.4.3.6.4', constructId:'combine-liter-milliliter-measures',
  claim:'Litre ve mililitreyi ortak birime çevirip kalan sıvı miktarını bulur.', knowledgeComponents:['liter-milliliter','unit-conversion','multi-step-subtraction'], deepFeatures:['common-unit','measurement-verification'],
  gameIds:['problem-hunter','error-detective'], skeletons:SKELETONS,
  generateParameters:({seed})=>pick([{totalL:8,usedL:2,usedMl:750},{totalL:10,usedL:3,usedMl:500},{totalL:12,usedL:4,usedMl:250},{totalL:15,usedL:6,usedMl:800}],seed),
  solve:t=>t.totalL*1000-(t.usedL*1000+t.usedMl), verify:(t,v)=>Number(v)+t.usedL*1000+t.usedMl===t.totalL*1000,
  misconceptions:[
    {id:'mix-units',description:'Litre ile mililitreyi aynı sayı birimiymiş gibi doğrudan çıkarmıştır.',feedback:'Çıkarma öncesinde bütün miktarlar aynı birime çevrilmelidir.',apply:t=>Math.abs(t.totalL-(t.usedL+t.usedMl))},
    {id:'ignore-liters-used',description:'Kullanılan litreleri yok sayıp yalnız mililitreyi çıkarmıştır.',feedback:'Kullanılan toplam miktar litre ve mililitrenin birlikte toplamıdır.',apply:t=>t.totalL*1000-t.usedMl},
    {id:'ignore-milliliters-used',description:'Kullanılan mililitre bölümünü hesaba katmamıştır.',feedback:'Ek mililitre miktarı da toplam kullanımdan düşülmelidir.',apply:t=>(t.totalL-t.usedL)*1000}
  ],
  render:(t,{answer,skeleton})=>({
    context:`Bir depoda ${t.totalL} litre meyve suyu vardır. ${t.usedL} litre ${t.usedMl} mililitresi kullanılmıştır. ${skeletonNote(skeleton)}`,
    prompt:'Geriye kaç mililitre meyve suyu kalmıştır?',
    correctRationale:`${t.totalL} L=${t.totalL*1000} mL, kullanılan ${t.usedL*1000+t.usedMl} mL; kalan ${answer} mL.`,
    steps:steps([['başlangıcı mililitreye çevir',`${t.totalL}×1000=${t.totalL*1000} mL.`],['kullanılan miktarı ortak birimde yaz',`${t.usedL}×1000+${t.usedMl}=${t.usedL*1000+t.usedMl} mL.`],['çıkarma işlemini yap',`${t.totalL*1000}−${t.usedL*1000+t.usedMl}=${answer}.`],['toplama ile geri kontrol et',`${answer}+${t.usedL*1000+t.usedMl}=${t.totalL*1000}.`]]),
    hints:['Litre ve mililitrenin çıkarılabilmesi için önce bütün miktarları mililitreye dönüştür.','Kalanla kullanılan miktarı topladığında başlangıçtaki toplam mililitreyi yeniden elde etmelisin.']
  })
});

const inventoryFamily = defineSolverBackedMathFamily({
  id:'g4-math-multi-step-inventory', grade:4, topicId:'natural-number-problems', outcomeId:'M.4.1.4.6', constructId:'solve-multi-step-inventory-change',
  claim:'Çarpma ile toplamı bulup iki ardışık stok değişimini doğru sırayla uygular.', knowledgeComponents:['multiplication','subtraction','addition'], deepFeatures:['operation-sequencing','inventory-check'],
  gameIds:['problem-hunter','error-detective'], skeletons:SKELETONS,
  generateParameters:({seed})=>pick([{boxes:6,each:28,out:45,added:17},{boxes:8,each:24,out:56,added:20},{boxes:7,each:32,out:68,added:15},{boxes:9,each:25,out:74,added:19}],seed),
  solve:t=>t.boxes*t.each-t.out+t.added, verify:(t,v)=>Number(v)-t.added+t.out===t.boxes*t.each,
  misconceptions:[
    {id:'skip-final-addition',description:'Sonradan gelen ürünleri stoka eklememiştir.',feedback:'Bütün stok hareketleri işlem sırasına katılmalıdır.',apply:t=>t.boxes*t.each-t.out},
    {id:'add-outgoing',description:'Dağıtılan ürünleri çıkarmak yerine eklemiştir.',feedback:'Depodan çıkan miktar toplamı azaltır.',apply:t=>t.boxes*t.each+t.out+t.added},
    {id:'add-box-and-each',description:'Kutu sayısı ile kutudaki sayıyı çarpmak yerine toplamıştır.',feedback:'Eş grupların toplamı çarpma ile bulunur.',apply:t=>t.boxes+t.each-t.out+t.added}
  ],
  render:(t,{answer,skeleton})=>({
    context:`Bir depoya ${t.boxes} kutu, her kutuda ${t.each} kalem geliyor. ${t.out} kalem dağıtılıyor, sonra depoya ${t.added} kalem daha ekleniyor. ${skeletonNote(skeleton)}`,
    prompt:'Son durumda depoda kaç kalem vardır?',
    correctRationale:`${t.boxes}×${t.each}=${t.boxes*t.each}; ${t.boxes*t.each}−${t.out}+${t.added}=${answer}.`,
    steps:steps([['ilk toplamı çarpma ile bul',`${t.boxes}×${t.each}=${t.boxes*t.each}.`],['çıkan miktarı azalt',`${t.boxes*t.each}−${t.out}=${t.boxes*t.each-t.out}.`],['eklenen miktarı artır',`${t.boxes*t.each-t.out}+${t.added}=${answer}.`],['ters hareketlerle doğrula',`${answer}−${t.added}+${t.out}=${t.boxes*t.each}.`]]),
    hints:['Önce eş kutulardaki başlangıç toplamını çarpma işlemiyle bul.','Stoktan dağıtılanı çıkar, sonradan geleni ekle; işlem sırasını bir sayı doğrusu gibi izle.']
  })
});

const perimeterFamily = defineSolverBackedMathFamily({
  id:'g4-math-perimeter-missing-side', grade:4, topicId:'perimeter', outcomeId:'M.4.3.2.4', constructId:'reconstruct-rectangle-side-from-perimeter',
  claim:'Dikdörtgen çevresinden bilinen iki eş kenarı çıkarıp eksik kenarı bulur.', knowledgeComponents:['rectangle','perimeter','missing-side'], deepFeatures:['geometric-equation','two-copy-reasoning'],
  gameIds:['problem-hunter','error-detective','geometry-lab'], skeletons:SKELETONS,
  generateParameters:({seed})=>pick([{long:17,short:10},{long:14,short:9},{long:21,short:13},{long:19,short:12}],seed),
  solve:t=>t.short, verify:(t,v)=>2*(t.long+Number(v))===2*(t.long+t.short),
  misconceptions:[
    {id:'remaining-is-one-side',description:'İki kısa kenarın toplamını tek kısa kenar sanmıştır.',feedback:'Kalan uzunluk iki eş kısa kenara aittir.',apply:t=>2*t.short},
    {id:'half-perimeter-only',description:'Yarı çevreyi doğrudan kısa kenar olarak almıştır.',feedback:'Yarı çevreden uzun kenar çıkarılmalıdır.',apply:t=>t.long+t.short},
    {id:'subtract-long-once',description:'Çevreden yalnız bir uzun kenarı çıkarmıştır.',feedback:'Dikdörtgende iki uzun kenar bulunur.',apply:t=>2*(t.long+t.short)-t.long}
  ],
  render:(t,{answer,skeleton})=>({
    context:`Dikdörtgen biçimindeki bahçenin çevresi ${2*(t.long+t.short)} metre, uzun kenarı ${t.long} metredir. ${skeletonNote(skeleton)}`,
    prompt:'Bahçenin kısa kenarı kaç metredir?', geometryPrompt:'Çevre ve uzun kenar bilgisine göre eksik kısa kenar hangisidir?',
    correctRationale:`2·${t.long}+2·k=${2*(t.long+t.short)}; 2k=${2*t.short}, k=${answer}.`,
    steps:steps([['çevre yapısını kur','İki uzun ve iki kısa kenar vardır.'],['uzun kenarların toplamını bul',`2×${t.long}=${2*t.long}.`],['kısa kenarlara kalan toplamı bul',`${2*(t.long+t.short)}−${2*t.long}=${2*t.short}.`],['bir kısa kenarı bul',`${2*t.short}÷2=${answer}.`]]),
    hints:['Çevre içinde uzun kenar iki, kısa kenar da iki kez yer alır.','İki uzun kenarı çevreden çıkardıktan sonra kalan toplamı iki eş kısa kenara böl.']
  })
});

const placeValueFamily = defineSolverBackedMathFamily({
  id:'g4-math-place-value-reconstruction', grade:4, topicId:'natural-numbers', outcomeId:'M.4.1.1.4', constructId:'reconstruct-number-from-place-clues',
  claim:'Basamak değerleri ve rakam ilişkilerinden doğal sayıyı yeniden kurar.', knowledgeComponents:['place-value','digit-constraints','number-construction'], deepFeatures:['constraint-integration','reverse-check'],
  gameIds:['problem-hunter','error-detective'], skeletons:SKELETONS,
  generateParameters:({seed})=>pick([{th:4,h:7,t:2,o:5},{th:6,h:3,t:8,o:1},{th:5,h:9,t:4,o:2},{th:7,h:2,t:6,o:3}],seed),
  solve:t=>t.th*1000+t.h*100+t.t*10+t.o, verify:(t,v)=>Number(v)===t.th*1000+t.h*100+t.t*10+t.o,
  misconceptions:[
    {id:'reverse-digits',description:'Basamak sırasını ters çevirmiştir.',feedback:'Binler, yüzler, onlar ve birler sırası korunmalıdır.',apply:t=>t.o*1000+t.t*100+t.h*10+t.th},
    {id:'omit-zero-place-weight',description:'Rakamları basamak değeriyle çarpmadan toplamıştır.',feedback:'Her rakam bulunduğu basamak kadar değer taşır.',apply:t=>t.th+t.h+t.t+t.o},
    {id:'swap-tens-ones',description:'Onlar ve birler rakamlarını yer değiştirmiştir.',feedback:'Onlar basamağı 10 ile, birler basamağı 1 ile çarpılır.',apply:t=>t.th*1000+t.h*100+t.o*10+t.t}
  ],
  render:(t,{answer,skeleton})=>({
    context:`Dört basamaklı bir sayının binler basamağı ${t.th}, yüzler basamağı ${t.h}, onlar basamağı ${t.t}, birler basamağı ${t.o}'dır. ${skeletonNote(skeleton)}`,
    prompt:'Bu doğal sayı hangisidir?',
    correctRationale:`${t.th}×1000+${t.h}×100+${t.t}×10+${t.o}=${answer}.`,
    steps:steps([['binler değerini yaz',`${t.th}×1000=${t.th*1000}.`],['yüzler değerini yaz',`${t.h}×100=${t.h*100}.`],['onlar ve birleri ekle',`${t.t}×10+${t.o}=${t.t*10+t.o}.`],['basamak değerlerini birleştir',`Toplam ${answer}.`]]),
    hints:['Rakamları yalnız yan yana düşünme; her birini bulunduğu basamağın değeriyle çarp.','Binler, yüzler, onlar ve birler değerlerini topladıktan sonra rakamları geri okuyarak kontrol et.']
  })
});

const timeFamily = defineSolverBackedMathFamily({
  id:'g4-math-time-schedule', grade:4, topicId:'time-measurement', outcomeId:'M.4.3.4.3', constructId:'calculate-multi-stage-finish-time',
  claim:'Saat ve dakika sürelerini sırayla ekleyip bitiş zamanını bulur.', knowledgeComponents:['clock-time','elapsed-time','minute-regrouping'], deepFeatures:['timeline-model','carry-hour'],
  gameIds:['problem-hunter','error-detective'], skeletons:SKELETONS,
  generateParameters:({seed})=>pick([{start:9*60+35,d1:48,break:17,d2:55},{start:10*60+20,d1:65,break:15,d2:40},{start:13*60+45,d1:37,break:23,d2:50},{start:8*60+50,d1:52,break:18,d2:45}],seed),
  solve:t=>t.start+t.d1+t.break+t.d2, verify:(t,v)=>Number(v)-t.d2-t.break-t.d1===t.start, formatOption:formatClock,
  misconceptions:[
    {id:'omit-break',description:'Ara süresini toplam zamana eklememiştir.',feedback:'Bitiş saati hesabında ara da geçen süredir.',apply:t=>t.start+t.d1+t.d2},
    {id:'subtract-break',description:'Ara süresini zaman çizgisinden çıkarmıştır.',feedback:'Ara etkinliği durdursa bile saat ilerlemeye devam eder.',apply:t=>t.start+t.d1-t.break+t.d2},
    {id:'minutes-no-regroup',description:'60 dakikayı bir saate dönüştürmeden saat-dakika yazmıştır.',feedback:'Dakika toplamı 60’ı geçtiğinde saat grubuna aktarılmalıdır.',apply:t=>t.start+(t.d1+t.break+t.d2)%60}
  ],
  render:(t,{answer,skeleton})=>({
    context:`Bir etkinlik ${formatClock(t.start)}'te başlıyor. İlk bölüm ${t.d1} dakika, ara ${t.break} dakika, ikinci bölüm ${t.d2} dakika sürüyor. ${skeletonNote(skeleton)}`,
    prompt:'Etkinlik saat kaçta biter?',
    correctRationale:`Toplam süre ${t.d1}+${t.break}+${t.d2}=${t.d1+t.break+t.d2} dakika; ${formatClock(t.start)}+bu süre=${formatClock(answer)}.`,
    steps:steps([['geçen süreleri topla',`${t.d1}+${t.break}+${t.d2}=${t.d1+t.break+t.d2} dakika.`],['dakikayı saat-dakikaya ayır',`${Math.floor((t.d1+t.break+t.d2)/60)} saat ${(t.d1+t.break+t.d2)%60} dakika.`],['başlangıca ekle',`${formatClock(t.start)} üzerine toplam süre eklenir.`],['geri çıkararak doğrula',`${formatClock(answer)}'dan süreler çıkarılınca ${formatClock(t.start)} bulunur.`]]),
    hints:['İlk bölüm, ara ve ikinci bölümün tamamı saat üzerinde geçen süreye eklenir.','Toplam dakika 60’ı geçerse her 60 dakikayı bir saat olarak grupla ve başlangıç saatine ekle.']
  })
});

const inverseOperationsFamily = defineSolverBackedMathFamily({
  id:'g4-math-multiplication-division-inverse', grade:4, topicId:'multiplication-division-relationship', outcomeId:'M.4.1.5.5', constructId:'use-inverse-operations-for-missing-factor',
  claim:'Çarpma ve bölmenin ters ilişkisinden yararlanarak eksik çarpanı bulur ve doğrular.', knowledgeComponents:['multiplication','division','inverse-operation'], deepFeatures:['reverse-operation','two-way-check'],
  gameIds:['problem-hunter','error-detective'], skeletons:SKELETONS,
  generateParameters:({seed})=>pick([{groups:18,each:24},{groups:16,each:35},{groups:25,each:28},{groups:32,each:15}],seed),
  solve:t=>t.each, verify:(t,v)=>t.groups*Number(v)===t.groups*t.each,
  misconceptions:[
    {id:'divide-by-two',description:'Toplamı grup sayısına değil 2’ye bölmüştür.',feedback:'Her gruptaki miktar toplamın grup sayısına bölünmesiyle bulunur.',apply:t=>t.groups*t.each/2},
    {id:'subtract-groups',description:'Eş gruplama yerine toplamdan grup sayısını çıkarmıştır.',feedback:'Eksik çarpan bölme ile bulunur.',apply:t=>t.groups*t.each-t.groups},
    {id:'add-factors',description:'Çarpanları toplama ilişkisi kurmuştur.',feedback:'Toplam nesne sayısı iki çarpanın çarpımıdır.',apply:t=>t.groups+t.each}
  ],
  render:(t,{answer,skeleton})=>({context:`${t.groups} kutuya eşit sayıda kalem yerleştirilmiş ve toplam ${t.groups*t.each} kalem kullanılmıştır. ${skeletonNote(skeleton)}`,prompt:'Her kutuda kaç kalem vardır?',correctRationale:`${t.groups*t.each}÷${t.groups}=${answer}; ${t.groups}×${answer}=${t.groups*t.each}.`,steps:steps([['eş grup yapısını kur','Toplam=grup sayısı×gruptaki miktar.'],['bölme işlemini kur',`${t.groups*t.each}÷${t.groups}.`],['eksik çarpanı bul',`Sonuç ${answer}.`],['ters işlemle denetle',`${t.groups}×${answer}=${t.groups*t.each}.`]]),hints:['Toplam kalem sayısını eş kutu sayısına bölerek bir kutudaki miktarı bul.','Bulduğun değeri kutu sayısıyla çarp; başlangıçtaki toplamı yeniden vermelidir.']})
});

const areaFamily = defineSolverBackedMathFamily({
  id:'g4-math-area-missing-side', grade:4, topicId:'rectangle-area', outcomeId:'M.4.3.3.2', constructId:'reconstruct-side-from-area',
  claim:'Dikdörtgen alanını satır-sütun modeliyle ilişkilendirip eksik kenarı ters işlemle bulur.', knowledgeComponents:['unit-square','rectangle-area','missing-factor'], deepFeatures:['array-model','reverse-measurement'],
  gameIds:['problem-hunter','error-detective','geometry-lab'], skeletons:SKELETONS,
  generateParameters:({seed})=>pick([{width:8,height:6},{width:9,height:7},{width:12,height:5},{width:14,height:4}],seed), solve:t=>t.height, verify:(t,v)=>t.width*Number(v)===t.width*t.height,
  misconceptions:[
    {id:'perimeter-formula',description:'Alan yerine çevre bağıntısını kullanmıştır.',feedback:'Alan iç bölgedeki birim kare sayısıdır.',apply:t=>2*(t.width+t.height)},
    {id:'subtract-known-side',description:'Eksik çarpanı bölmeyle bulmak yerine alandan kenarı çıkarmıştır.',feedback:'Eksik kenar alanın bilinen kenara bölümüdür.',apply:t=>t.width*t.height-t.width},
    {id:'add-sides',description:'Birim kare dizisini çarpım yerine toplamla modellemiştir.',feedback:'Satır ve sütun sayıları çarpılır.',apply:t=>t.width+t.height}
  ],
  render:(t,{answer,skeleton})=>({context:`Dikdörtgen panonun alanı ${t.width*t.height} birimkare, bir kenarı ${t.width} birimdir. ${skeletonNote(skeleton)}`,prompt:'Diğer kenar kaç birimdir?',geometryPrompt:'Alan ve bir kenar bilgisine göre eksik kenar hangisidir?',correctRationale:`${t.width}×h=${t.width*t.height}; h=${t.width*t.height}÷${t.width}=${answer}.`,steps:steps([['alanı birim kare sayısı olarak yorumla',`${t.width*t.height} birim kare vardır.`],['çarpım modelini kur',`${t.width}×h=${t.width*t.height}.`],['eksik kenarı bölmeyle bul',`${t.width*t.height}÷${t.width}=${answer}.`],['alanı geri hesapla',`${t.width}×${answer}=${t.width*t.height}.`]]),hints:['Dikdörtgen alanı, bir satırdaki kare sayısı ile satır sayısının çarpımıdır.','Toplam birim kare sayısını bilinen kenara böl ve iki kenarı yeniden çarparak kontrol et.']})
});

const massFamily = defineSolverBackedMathFamily({
  id:'g4-math-mass-conversion-logistics', grade:4, topicId:'mass-measurement', outcomeId:'M.4.3.5.5', constructId:'combine-kilogram-and-gram-measures',
  claim:'Kilogram ve gramı ortak birime çevirip kalan kütleyi bulur.', knowledgeComponents:['kilogram-gram','unit-conversion','subtraction'], deepFeatures:['common-unit','measurement-check'],
  gameIds:['problem-hunter','error-detective'], skeletons:SKELETONS,
  generateParameters:({seed})=>pick([{totalKg:8,usedKg:2,usedGram:750},{totalKg:10,usedKg:3,usedGram:500},{totalKg:12,usedKg:4,usedGram:250},{totalKg:15,usedKg:6,usedGram:800}],seed), solve:t=>t.totalKg*1000-(t.usedKg*1000+t.usedGram), verify:(t,v)=>Number(v)+t.usedKg*1000+t.usedGram===t.totalKg*1000,
  misconceptions:[
    {id:'mix-units',description:'Kilogramla gramı aynı birimmiş gibi kullanmıştır.',feedback:'Çıkarma öncesi tüm miktarlar grama çevrilmelidir.',apply:t=>Math.abs(t.totalKg-(t.usedKg+t.usedGram))},
    {id:'gram-only',description:'Kullanılan kilogramları yok saymıştır.',feedback:'Kilogram bölümü de kullanılan toplam kütleye katılır.',apply:t=>t.totalKg*1000-t.usedGram},
    {id:'kg-only',description:'Kullanılan gramları yok saymıştır.',feedback:'Gram bölümü de başlangıçtan çıkarılmalıdır.',apply:t=>(t.totalKg-t.usedKg)*1000}
  ],
  render:(t,{answer,skeleton})=>({context:`Başlangıçta ${t.totalKg} kg un vardır. ${t.usedKg} kg ${t.usedGram} g kullanılmıştır. ${skeletonNote(skeleton)}`,prompt:'Geriye kaç gram un kalır?',correctRationale:`${t.totalKg*1000}−${t.usedKg*1000+t.usedGram}=${answer} g.`,steps:steps([['başlangıcı grama çevir',`${t.totalKg}×1000=${t.totalKg*1000}.`],['kullanılanı grama çevir',`${t.usedKg}×1000+${t.usedGram}=${t.usedKg*1000+t.usedGram}.`],['çıkarma yap',`${t.totalKg*1000}−${t.usedKg*1000+t.usedGram}=${answer}.`],['toplamayla doğrula',`${answer}+${t.usedKg*1000+t.usedGram}=${t.totalKg*1000}.`]]),hints:['Kilogram ve gramı doğrudan çıkarma; önce bütün miktarları grama çevir.','Kalanla kullanılanı topladığında başlangıç gram değerini yeniden bulmalısın.']})
});

const patternFamily = defineSolverBackedMathFamily({
  id:'g4-math-number-pattern-engine', grade:4, topicId:'number-patterns', outcomeId:'M.4.1.1.6', constructId:'infer-two-step-number-pattern',
  claim:'Dönüşümlü iki kurallı sayı örüntüsünde eksik terimi belirler.', knowledgeComponents:['pattern','alternating-rule','sequence'], deepFeatures:['rule-inference','two-step-cycle'],
  gameIds:['problem-hunter','error-detective'], skeletons:SKELETONS,
  generateParameters:({seed})=>pick([{start:12,add:7,mul:2},{start:8,add:5,mul:3},{start:15,add:4,mul:2},{start:6,add:9,mul:2}],seed),
  solve:t=>((t.start+t.add)*t.mul+t.add)*t.mul, verify:(t,v)=>Number(v)===((t.start+t.add)*t.mul+t.add)*t.mul,
  misconceptions:[
    {id:'addition-only',description:'Dönüşümlü kural yerine her adımda yalnız toplama yapmıştır.',feedback:'Örüntüde toplama ve çarpma sırayla tekrar eder.',apply:t=>t.start+4*t.add},
    {id:'multiplication-only',description:'Her adımda yalnız çarpma uygulamıştır.',feedback:'Çarpma adımları arasında toplama vardır.',apply:t=>t.start*t.mul**4},
    {id:'swap-rule-order',description:'İlk adımda çarpma yaparak kural sırasını ters çevirmiştir.',feedback:'Kural verilen başlangıçtan + sonra × biçiminde ilerler.',apply:t=>((t.start*t.mul)+t.add)*t.mul+t.add}
  ],
  render:(t,{answer,skeleton})=>({context:`Bir örüntü ${t.start} sayısıyla başlıyor; sırayla +${t.add}, ×${t.mul}, +${t.add}, ×${t.mul} işlemleri uygulanıyor. ${skeletonNote(skeleton)}`,prompt:'Dördüncü işlemden sonraki sayı kaçtır?',correctRationale:`${t.start}→${t.start+t.add}→${(t.start+t.add)*t.mul}→${(t.start+t.add)*t.mul+t.add}→${answer}.`,steps:steps([['ilk toplama kuralını uygula',`${t.start}+${t.add}=${t.start+t.add}.`],['çarpma kuralını uygula',`${t.start+t.add}×${t.mul}=${(t.start+t.add)*t.mul}.`],['döngüyü tekrar başlat',`${(t.start+t.add)*t.mul}+${t.add}=${(t.start+t.add)*t.mul+t.add}.`],['son çarpmayı yap',`${(t.start+t.add)*t.mul+t.add}×${t.mul}=${answer}.`]]),hints:['Örüntü tek bir artış kuralı kullanmıyor; + ve × işlemleri sırayla dönüşüyor.','Her adımın sonucunu yazıp bir sonraki işlemi ona uygula; işlem sırasını değiştirme.']})
});

const angleFamily = defineSolverBackedMathFamily({
  id:'g4-math-angle-measure-classification', grade:4, topicId:'angles', outcomeId:'M.4.3.1.3', constructId:'derive-and-classify-missing-angle',
  claim:'Doğru açı üzerindeki komşu açılardan eksik ölçüyü bulup sınıflandırır.', knowledgeComponents:['straight-angle','subtraction','angle-types'], deepFeatures:['geometric-relation','classification'],
  gameIds:['problem-hunter','error-detective','geometry-lab'], skeletons:SKELETONS,
  generateParameters:({seed})=>pick([{known:65},{known:112},{known:38},{known:145}],seed), solve:t=>180-t.known, verify:(t,v)=>Number(v)+t.known===180,
  misconceptions:[
    {id:'right-angle-base',description:'Doğru açıyı 180° yerine 90° kabul etmiştir.',feedback:'Bir doğru üzerindeki komşu açılar toplamı 180°dir.',apply:t=>Math.abs(90-t.known)},
    {id:'add-to-straight',description:'Eksik açıyı bulmak için ölçüleri çıkarmak yerine toplamıştır.',feedback:'Bütün açıdan bilinen parça çıkarılmalıdır.',apply:t=>180+t.known},
    {id:'copy-known',description:'Eksik açının bilinen açıya eşit olduğunu varsaymıştır.',feedback:'Eşitlik bilgisi verilmemiştir; toplam ilişkisi kullanılmalıdır.',apply:t=>t.known}
  ],
  render:(t,{answer,skeleton})=>({context:`Bir doğru üzerinde yan yana iki açının biri ${t.known}° ölçülmüştür. ${skeletonNote(skeleton)}`,prompt:'Diğer açının ölçüsü kaç derecedir?',geometryPrompt:'Doğru açı ilişkisine göre eksik açı kaç derecedir?',correctRationale:`Komşu açılar toplamı 180° olduğundan 180−${t.known}=${answer}°.`,steps:steps([['bütün açıyı belirle','Doğru açı 180°dir.'],['bilinen parçayı yaz',`Bir açı ${t.known}°dir.`],['eksik parçayı çıkar',`180−${t.known}=${answer}°.`],['toplamla doğrula',`${t.known}+${answer}=180°.`]]),hints:['Bir doğru üzerinde yan yana duran iki açının toplamı 180 derecedir.','Bilinen açıyı 180’den çıkar ve iki açıyı yeniden toplayarak doğrula.']})
});

const lengthFamily = defineSolverBackedMathFamily({
  id:'g4-math-length-unit-conversion', grade:4, topicId:'length-measurement', outcomeId:'M.4.3.4.6', constructId:'combine-meter-centimeter-lengths',
  claim:'Metre ve santimetre ölçülerini ortak birime çevirip çok adımlı uzunluk hesabı yapar.', knowledgeComponents:['meter-centimeter','unit-conversion','addition-subtraction'], deepFeatures:['common-unit','measurement-model'],
  gameIds:['problem-hunter','error-detective'], skeletons:SKELETONS,
  generateParameters:({seed})=>pick([{totalM:12,cutM:3,cutCm:45},{totalM:15,cutM:4,cutCm:80},{totalM:9,cutM:2,cutCm:65},{totalM:20,cutM:7,cutCm:25}],seed), solve:t=>t.totalM*100-(t.cutM*100+t.cutCm), verify:(t,v)=>Number(v)+t.cutM*100+t.cutCm===t.totalM*100,
  misconceptions:[
    {id:'mix-meter-centimeter',description:'Metre ve santimetre sayılarını ortak birime çevirmeden çıkarmıştır.',feedback:'Önce bütün uzunlukları santimetreye çevir.',apply:t=>Math.abs(t.totalM-(t.cutM+t.cutCm))},
    {id:'ignore-meters-cut',description:'Kesilen metre bölümünü hesaba katmamıştır.',feedback:'Kesilen toplam uzunluk metre ve santimetrenin birlikte toplamıdır.',apply:t=>t.totalM*100-t.cutCm},
    {id:'ignore-centimeters-cut',description:'Kesilen santimetre bölümünü yok saymıştır.',feedback:'Ek santimetre de toplam kesilen uzunluğa katılır.',apply:t=>(t.totalM-t.cutM)*100}
  ],
  render:(t,{answer,skeleton})=>({context:`${t.totalM} metrelik ipin ${t.cutM} metre ${t.cutCm} santimetresi kesiliyor. ${skeletonNote(skeleton)}`,prompt:'Geriye kaç santimetre ip kalır?',correctRationale:`${t.totalM*100}−${t.cutM*100+t.cutCm}=${answer} cm.`,steps:steps([['toplamı santimetreye çevir',`${t.totalM}×100=${t.totalM*100} cm.`],['kesileni santimetreye çevir',`${t.cutM}×100+${t.cutCm}=${t.cutM*100+t.cutCm} cm.`],['kalanı çıkar',`${t.totalM*100}−${t.cutM*100+t.cutCm}=${answer}.`],['geri toplamayla kontrol et',`${answer}+${t.cutM*100+t.cutCm}=${t.totalM*100}.`]]),hints:['Metre ve santimetreyi aynı işlemde kullanmadan önce hepsini santimetreye çevir.','Kalan uzunlukla kesilen uzunluğu topladığında ipin başlangıç uzunluğunu bulmalısın.']})
});

export const GRADE4_SOLVER_BACKED_MATH_FAMILIES = Object.freeze([
  barChartFamily,divisionContainersFamily,equalFractionsFamily,fractionQuantityFamily,liquidFamily,
  inventoryFamily,perimeterFamily,placeValueFamily,timeFamily,inverseOperationsFamily,
  areaFamily,massFamily,patternFamily,angleFamily,lengthFamily
]);
