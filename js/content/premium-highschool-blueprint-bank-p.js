import { createPremiumBlueprintPack } from './premium-blueprint-core.js';
import {
  PREMIUM_DEEP_TRAITS,
  defineCriteriaPremiumBlueprint,
  defineNumericPremiumBlueprint,
  formatPremiumNumber
} from './premium-blueprint-templates.js';

const DEEP = PREMIUM_DEEP_TRAITS;

const GEOMETRY_BLUEPRINTS = [
  defineNumericPremiumBlueprint({
    id:'hs-geometry-similar-area',gameId:'geometry-lab',familyId:'hs-geometry-similar-area-family',skeletonId:'hs-geometry-similar-area:linear-scale-to-area-scale',reasoningPathId:'find-base-area-square-scale-multiply',subjectId:'mathematics',topicId:'similarity',learningOutcomeId:'apply-square-of-similarity-ratio-to-area',solutionClass:'similar-area',cognitiveTraits:[...DEEP,'spatialReasoning'],
    variants:[
      {id:'v1',shape:'üçgen',baseArea:24,scale:1.5,detail:'Tabanı 6 cm, yüksekliği 8 cm olan üçgen'},
      {id:'v2',shape:'dikdörtgen',baseArea:60,scale:1.2,detail:'Kenarları 5 cm ve 12 cm olan dikdörtgen'}
    ],
    render:(v)=>({context:`${v.detail}, bütün uzunlukları ${String(v.scale).replace('.',',')} katına çıkarılarak benzer bir şekle dönüştürülüyor.`,prompt:'Yeni şeklin alanı kaç santimetrekaredir?',hints:['Önce başlangıç alanını doğrula.','Alan oranı, uzunluk oranının karesidir.']}),
    solve:(v)=>v.baseArea*v.scale**2,
    verify:(v,x)=>Math.abs(Number(x)-v.baseArea*v.scale**2)<1e-9,
    formatAnswer:(x)=>`${formatPremiumNumber(x)} cm²`,
    wrongValues:(v)=>[
      {id:'linear-scale-area',value:v.baseArea*v.scale,why:'Alanı uzunluk gibi yalnız benzerlik oranıyla çarpar.',rule:'apply-linear-scale-to-area'},
      {id:'add-square-scale',value:v.baseArea+v.scale**2,why:'Alan oranını çarpmak yerine başlangıç alanına ekler.',rule:'add-area-scale-factor'},
      {id:'divide-by-scale',value:v.baseArea/v.scale,why:'Büyütme yapılmasına rağmen alanı benzerlik oranına böler.',rule:'invert-linear-scale'}
    ],
    explanation:(v,x)=>`Benzer şekillerde alan oranı ${v.scale}² olur. ${v.baseArea}·${formatPremiumNumber(v.scale**2)}=${formatPremiumNumber(x)} cm² bulunur.`,
    evidence:(v,x)=>[`Başlangıç alanı ${v.baseArea} cm²'dir.`,`Uzunluk oranının karesi ${formatPremiumNumber(v.scale**2)}'dir.`,`Yeni alan ${formatPremiumNumber(x)} cm² olur.`]
  }),
  defineNumericPremiumBlueprint({
    id:'hs-geometry-midpoint-distance',gameId:'geometry-lab',familyId:'hs-geometry-midpoint-distance-family',skeletonId:'hs-geometry-midpoint-distance:midpoint-then-axis-distance',reasoningPathId:'average-coordinates-locate-midpoint-measure-distance',subjectId:'mathematics',topicId:'analytic-geometry',learningOutcomeId:'find-midpoint-and-distance-to-given-point',solutionClass:'midpoint-distance',cognitiveTraits:[...DEEP,'coordinateReasoning'],
    variants:[
      {id:'v1',a:[2,4],b:[8,10],c:[5,1]},
      {id:'v2',a:[-4,2],b:[6,8],c:[1,-3]}
    ],
    render:(v)=>({context:`A(${v.a.join(', ')}) ve B(${v.b.join(', ')}) noktalarının orta noktası M'dir. C noktası C(${v.c.join(', ')}) olarak veriliyor.`,prompt:'M ile C arasındaki uzaklık kaç birimdir?',hints:['M noktasının iki koordinatını ayrı ayrı ortala.','Sonra iki nokta arasındaki uzaklığı hesapla.']}),
    solve:(v)=>{const mx=(v.a[0]+v.b[0])/2,my=(v.a[1]+v.b[1])/2;return Math.hypot(mx-v.c[0],my-v.c[1]);},
    verify:(v,x)=>{const mx=(v.a[0]+v.b[0])/2,my=(v.a[1]+v.b[1])/2;return Math.abs(Number(x)-Math.hypot(mx-v.c[0],my-v.c[1]))<1e-9;},
    formatAnswer:(x)=>`${formatPremiumNumber(x)} birim`,
    wrongValues:(v)=>{const mx=(v.a[0]+v.b[0])/2,my=(v.a[1]+v.b[1])/2;return[
      {id:'report-midpoint-x',value:Math.abs(mx),why:'Orta noktanın yalnız x koordinatını uzaklık sanır.',rule:'report-midpoint-x-as-distance'},
      {id:'report-midpoint-y',value:Math.abs(my),why:'Orta noktanın yalnız y koordinatını uzaklık sanır.',rule:'report-midpoint-y-as-distance'},
      {id:'omit-square-root',value:(mx-v.c[0])**2+(my-v.c[1])**2,why:'Koordinat farklarının karelerini toplar fakat karekök almayı unutur.',rule:'omit-square-root-in-distance'}
    ];},
    explanation:(v,x)=>{const mx=(v.a[0]+v.b[0])/2,my=(v.a[1]+v.b[1])/2;return `Orta nokta M(${mx}, ${my}) olur. Uzaklık formülü uygulanınca MC=${formatPremiumNumber(x)} birim bulunur.`;},
    evidence:(v,x)=>{const mx=(v.a[0]+v.b[0])/2,my=(v.a[1]+v.b[1])/2;return[`Orta nokta M(${mx}, ${my}) olarak hesaplanır.`,`C ile M arasındaki koordinat farkları ayrı bulunur.`,`Kareler toplamının karekökü ${formatPremiumNumber(x)}'dir.`];}
  }),
  defineNumericPremiumBlueprint({
    id:'hs-geometry-sector-area',gameId:'geometry-lab',familyId:'hs-geometry-sector-area-family',skeletonId:'hs-geometry-sector-area:central-angle-fraction-of-circle',reasoningPathId:'find-angle-fraction-compute-circle-area-multiply',subjectId:'mathematics',topicId:'circle-sector',learningOutcomeId:'calculate-sector-area-from-central-angle',solutionClass:'sector-area',cognitiveTraits:[...DEEP,'proportionalGeometry'],
    variants:[{id:'v1',radius:6,angle:120,pi:3},{id:'v2',radius:10,angle:72,pi:3}],
    render:(v)=>({context:`Yarıçapı ${v.radius} cm olan bir dairede merkez açısı ${v.angle}° olan daire dilimi çiziliyor. Hesaplamalarda π=${v.pi} alınacaktır.`,prompt:'Daire diliminin alanı kaç santimetrekaredir?',hints:['Merkez açının tam açıya oranını bul.','Bu oranı dairenin alanıyla çarp.']}),
    solve:(v)=>v.angle/360*v.pi*v.radius**2,
    verify:(v,x)=>Math.abs(Number(x)-v.angle/360*v.pi*v.radius**2)<1e-9,
    formatAnswer:(x)=>`${formatPremiumNumber(x)} cm²`,
    wrongValues:(v)=>[
      {id:'use-radius-not-square',value:v.angle/360*v.pi*v.radius,why:'Daire alanında yarıçapın karesini almak yerine yarıçapı kullanır.',rule:'omit-radius-square'},
      {id:'omit-angle-fraction',value:v.pi*v.radius**2,why:'Merkez açı oranını kullanmadan bütün dairenin alanını verir.',rule:'report-full-circle-area'},
      {id:'omit-pi',value:v.angle/360*v.radius**2,why:'Daire alanı hesabında π çarpanını atlar.',rule:'omit-pi-factor'}
    ],
    explanation:(v,x)=>`Dilim oranı ${v.angle}/360'tır. (${v.angle}/360)·${v.pi}·${v.radius}²=${formatPremiumNumber(x)} cm² olur.`,
    evidence:(v,x)=>[`Tam açı 360° olduğundan dilim oranı ${formatPremiumNumber(v.angle/360)}'dir.`,`Dairenin alanı ${v.pi*v.radius**2} cm²'dir.`,`Oranla çarpıldığında ${formatPremiumNumber(x)} cm² bulunur.`]
  }),
  defineNumericPremiumBlueprint({
    id:'hs-geometry-isosceles-exterior',gameId:'geometry-lab',familyId:'hs-geometry-isosceles-exterior-family',skeletonId:'hs-geometry-isosceles-exterior:exterior-to-base-to-vertex',reasoningPathId:'convert-exterior-find-equal-base-angles-use-triangle-sum',subjectId:'mathematics',topicId:'triangle-angles',learningOutcomeId:'derive-vertex-angle-from-base-exterior-angle',solutionClass:'isosceles-angle',cognitiveTraits:[...DEEP,'deductiveGeometry'],
    variants:[{id:'v1',exterior:110},{id:'v2',exterior:125}],
    render:(v)=>({context:`İkizkenar bir üçgenin eş taban açılarından birine komşu dış açı ${v.exterior}°'dir.`,prompt:'Üçgenin tepe açısı kaç derecedir?',hints:['Dış açı ile komşu iç açı bütünlerdir.','İki taban açısı eşittir.']}),
    solve:(v)=>180-2*(180-v.exterior),
    verify:(v,x)=>Math.abs(Number(x)-(180-2*(180-v.exterior)))<1e-9,
    formatAnswer:(x)=>`${formatPremiumNumber(x)}°`,
    wrongValues:(v)=>[
      {id:'report-base-angle',value:180-v.exterior,why:'Tepe açısı yerine dış açıya komşu taban açısını verir.',rule:'report-base-angle'},
      {id:'report-exterior',value:v.exterior,why:'Dış açıyı doğrudan üçgenin tepe açısı sayar.',rule:'copy-exterior-angle'},
      {id:'double-base-angle',value:2*(180-v.exterior),why:'İki taban açısının toplamını tepe açısı olarak bildirir.',rule:'report-sum-of-base-angles'}
    ],
    explanation:(v,x)=>`Taban açısı 180-${v.exterior}=${180-v.exterior}° olur. Tepe açısı 180-2·${180-v.exterior}=${x}°'dir.`,
    evidence:(v,x)=>[`Komşu iç açı ${180-v.exterior}°'dir.`,`İkizkenarda iki taban açısı eşittir.`,`Üçgenin iç açı toplamından tepe açısı ${x}° bulunur.`]
  }),
  defineNumericPremiumBlueprint({
    id:'hs-geometry-prism-cut-volume',gameId:'geometry-lab',familyId:'hs-geometry-prism-cut-volume-family',skeletonId:'hs-geometry-prism-cut-volume:whole-prism-minus-removed-prism',reasoningPathId:'compute-whole-volume-compute-cut-volume-subtract',subjectId:'mathematics',topicId:'solid-geometry',learningOutcomeId:'calculate-remaining-volume-after-rectangular-cut',solutionClass:'composite-volume',cognitiveTraits:[...DEEP,'spatialDecomposition'],
    variants:[
      {id:'v1',outer:[8,5,4],cut:[2,2,2]},
      {id:'v2',outer:[10,6,3],cut:[2,3,2]}
    ],
    render:(v)=>({context:`Boyutları ${v.outer.join(' cm × ')} cm olan dikdörtgenler prizmasından, boyutları ${v.cut.join(' cm × ')} cm olan dikdörtgenler prizması biçiminde bir parça çıkarılıyor.`,prompt:'Kalan cismin hacmi kaç santimetreküptür?',hints:['Büyük prizmanın hacmini bul.','Çıkarılan parçanın hacmini toplamdan çıkar.']}),
    solve:(v)=>v.outer.reduce((a,b)=>a*b,1)-v.cut.reduce((a,b)=>a*b,1),
    verify:(v,x)=>Math.abs(Number(x)-(v.outer.reduce((a,b)=>a*b,1)-v.cut.reduce((a,b)=>a*b,1)))<1e-9,
    formatAnswer:(x)=>`${formatPremiumNumber(x)} cm³`,
    wrongValues:(v)=>{const whole=v.outer.reduce((a,b)=>a*b,1),cut=v.cut.reduce((a,b)=>a*b,1);return[
      {id:'report-whole-volume',value:whole,why:'Çıkarılan parçanın hacmini toplam hacimden düşmez.',rule:'ignore-removed-volume'},
      {id:'report-cut-volume',value:cut,why:'Kalan hacim yerine yalnız çıkarılan parçanın hacmini verir.',rule:'report-removed-volume'},
      {id:'subtract-one-dimension',value:v.outer[0]*v.outer[1]*(v.outer[2]-v.cut[2]),why:'Kesilen parçayı üç boyutlu hesaplamak yerine yalnız bir yüksekliği bütün tabandan çıkarır.',rule:'subtract-cut-height-from-whole-base'}
    ];},
    explanation:(v,x)=>{const whole=v.outer.reduce((a,b)=>a*b,1),cut=v.cut.reduce((a,b)=>a*b,1);return `Büyük hacim ${whole} cm³, çıkarılan hacim ${cut} cm³'tür. Kalan hacim ${whole}-${cut}=${x} cm³ olur.`;},
    evidence:(v,x)=>[`Büyük prizmanın hacmi ${v.outer.reduce((a,b)=>a*b,1)} cm³'tür.`,`Çıkarılan parçanın hacmi ${v.cut.reduce((a,b)=>a*b,1)} cm³'tür.`,`Fark alınarak ${x} cm³ bulunur.`]
  }),
  defineNumericPremiumBlueprint({
    id:'hs-geometry-perpendicular-line',gameId:'geometry-lab',familyId:'hs-geometry-perpendicular-line-family',skeletonId:'hs-geometry-perpendicular-line:slope-negative-reciprocal-point-form',reasoningPathId:'derive-reference-slope-find-perpendicular-slope-use-point-form',subjectId:'mathematics',topicId:'analytic-lines',learningOutcomeId:'find-value-on-line-perpendicular-through-given-point',solutionClass:'perpendicular-line',cognitiveTraits:[...DEEP,'analyticReasoning'],
    variants:[
      {id:'v1',p:[0,1],q:[2,5],a:[2,4],targetX:6},
      {id:'v2',p:[0,5],q:[3,4],a:[-1,2],targetX:2}
    ],
    render:(v)=>({context:`P(${v.p.join(', ')}) ve Q(${v.q.join(', ')}) noktalarından geçen doğruya dik olan başka bir doğru A(${v.a.join(', ')}) noktasından geçiyor.`,prompt:`Dik doğru üzerindeki x=${v.targetX} noktasının y değeri kaçtır?`,hints:['Önce PQ doğrusunun eğimini bul.','Dik doğrunun eğimi negatif tersidir; A noktasını kullan.']}),
    solve:(v)=>{const m=(v.q[1]-v.p[1])/(v.q[0]-v.p[0]);const pm=-1/m;return v.a[1]+pm*(v.targetX-v.a[0]);},
    verify:(v,x)=>{const m=(v.q[1]-v.p[1])/(v.q[0]-v.p[0]);return Math.abs(Number(x)-(v.a[1]-1/m*(v.targetX-v.a[0])))<1e-9;},
    wrongValues:(v)=>{const m=(v.q[1]-v.p[1])/(v.q[0]-v.p[0]);const correct=v.a[1]-1/m*(v.targetX-v.a[0]);return[
      {id:'reuse-reference-slope',value:v.a[1]+m*(v.targetX-v.a[0]),why:'Dik eğim yerine PQ doğrusunun eğimini yeniden kullanır.',rule:'reuse-reference-slope'},
      {id:'reciprocal-without-sign',value:v.a[1]+1/m*(v.targetX-v.a[0]),why:'Eğimin tersini alır fakat negatif işaretini uygulamaz.',rule:'omit-negative-in-perpendicular-slope'},
      {id:'ignore-anchor-point',value:correct-v.a[1],why:'A noktasının y değerini denklemde başlangıç değeri olarak kullanmaz.',rule:'drop-point-form-intercept'}
    ];},
    explanation:(v,x)=>{const m=(v.q[1]-v.p[1])/(v.q[0]-v.p[0]);return `PQ eğimi ${formatPremiumNumber(m)}, dik eğim ${formatPremiumNumber(-1/m)}'dir. A noktasıyla nokta-eğim formu uygulanınca y=${formatPremiumNumber(x)} bulunur.`;},
    evidence:(v,x)=>[`PQ doğrusunun eğimi koordinat farklarından bulunur.`,`Dik doğrunun eğimi negatif ters olarak hesaplanır.`,`A noktası ve x=${v.targetX} kullanılarak y=${formatPremiumNumber(x)} elde edilir.`]
  })
];

const MEANING_BLUEPRINTS = [
  defineCriteriaPremiumBlueprint({
    id:'hs-meaning-context-polysemy',gameId:'meaning-hunt',familyId:'hs-meaning-context-polysemy-family',skeletonId:'hs-meaning-context-polysemy:replace-by-contextual-sense',subjectId:'turkish',topicId:'word-meaning-in-context',learningOutcomeId:'identify-context-specific-sense-of-polysemous-word',solutionClass:'contextual-word-sense',criteria:['fitsContext','preservesMeaning'],extraTraits:['semanticDisambiguation'],
    variants:[
      {id:'v1',context:'Editör, rapordaki ince ayrıntıları gözden kaçırmamak için metni iki kez okudu.',prompt:'“İnce” sözcüğünün bu cümledeki anlamını en iyi karşılayan seçenek hangisidir?',explanation:'Burada “ince”, fiziksel kalınlığı değil dikkat gerektiren küçük ve ayrıntılı unsurları belirtir.',evidence:['Sözcük “ayrıntılar”ı niteler.','Okuma amacı ayrıntıları kaçırmamaktır.','Fiziksel kalınlıktan söz edilmez.'],options:[
        {key:'a',text:'Dikkat gerektiren ayrıntılı noktalar',checks:{fitsContext:true,preservesMeaning:true}},
        {key:'b',text:'Kalınlığı az olan fiziksel parçalar',checks:{fitsContext:false,preservesMeaning:false},misconceptionId:'literal-thickness',why:'Sözcüğün fiziksel kalınlık anlamını bağlama taşır.',rule:'select-literal-physical-sense'},
        {key:'c',text:'Önemsiz görülen gereksiz bölümler',checks:{fitsContext:false,preservesMeaning:false},misconceptionId:'equate-fine-with-unimportant',why:'Ayrıntılı olmayı önemsiz olmakla karıştırır.',rule:'replace-detail-with-irrelevance'},
        {key:'d',text:'Kolayca okunabilen açık ifadeler',checks:{fitsContext:false,preservesMeaning:false},misconceptionId:'reverse-attention-demand',why:'Dikkat gerektiren ayrıntıyı kolay okunurluk olarak yorumlar.',rule:'reverse-contextual-demand'}
      ]},
      {id:'v2',context:'Mühendis, cihazdaki hassas ayarı bozmamak için çok ince bir hesap yaptı.',prompt:'“İnce” sözcüğünün bu cümledeki anlamını en iyi karşılayan seçenek hangisidir?',explanation:'Sözcük burada ölçülü, dikkatli ve ayrıntılı hesaplama anlamındadır.',evidence:['Hesap, hassas ayarı korumak içindir.','Dikkat ve ölçülülük gerektirir.','Fiziksel incelik anlatılmaz.'],options:[
        {key:'a',text:'Ölçülü ve ayrıntılı hesaplama',checks:{fitsContext:true,preservesMeaning:true}},
        {key:'b',text:'Kısa sürede biten yüzeysel işlem',checks:{fitsContext:false,preservesMeaning:false},misconceptionId:'thin-as-superficial',why:'Ayrıntılı hesabı yüzeysellikle eşleştirir.',rule:'replace-precision-with-superficiality'},
        {key:'c',text:'Kâğıt kalınlığı düşük çizim',checks:{fitsContext:false,preservesMeaning:false},misconceptionId:'physical-thinness',why:'Fiziksel kalınlık anlamını hesap bağlamına taşır.',rule:'select-material-thickness'},
        {key:'d',text:'Sonucu önemsenmeyen tahmin',checks:{fitsContext:false,preservesMeaning:false},misconceptionId:'precision-as-guess',why:'Hassas hesabı kanıtsız tahmine dönüştürür.',rule:'replace-calculation-with-guess'}
      ]}
    ]
  }),
  defineCriteriaPremiumBlueprint({
    id:'hs-meaning-figurative-effect',gameId:'meaning-hunt',familyId:'hs-meaning-figurative-effect-family',skeletonId:'hs-meaning-figurative-effect:infer-emotional-effect',subjectId:'turkish',topicId:'figurative-meaning',learningOutcomeId:'infer-emotional-effect-of-figurative-expression',solutionClass:'figurative-effect',criteria:['fitsContext','preservesMeaning'],extraTraits:['figurativeInference'],
    variants:[
      {id:'v1',context:'Uzun süren belirsizliğin ardından öğretmenin “Yanındayız.” demesi içimi ısıttı.',prompt:'“İçimi ısıttı” sözü bu cümlede hangi anlamda kullanılmıştır?',explanation:'İfade fiziksel sıcaklığı değil, destek sözüyle oluşan rahatlama ve güven duygusunu anlatır.',evidence:['Söz, belirsizlik sonrasında söylenir.','Destek bildiren bir ileti vardır.','Duygusal etki anlatılır.'],options:[
        {key:'a',text:'Rahatlatıp güven duygusu verdi',checks:{fitsContext:true,preservesMeaning:true}},
        {key:'b',text:'Bulunduğu ortamın sıcaklığını artırdı',checks:{fitsContext:false,preservesMeaning:false},misconceptionId:'literal-temperature',why:'Deyimsel ifadeyi fiziksel sıcaklık olarak okur.',rule:'literalize-figurative-expression'},
        {key:'c',text:'Konuşmanın daha uzun sürmesini sağladı',checks:{fitsContext:false,preservesMeaning:false},misconceptionId:'effect-as-duration',why:'Duygusal etkiyi konuşma süresiyle karıştırır.',rule:'replace-emotion-with-duration'},
        {key:'d',text:'Belirsizliği daha da artırdı',checks:{fitsContext:false,preservesMeaning:false},misconceptionId:'reverse-emotional-effect',why:'Destek sözünün etkisini tersine çevirir.',rule:'reverse-positive-effect'}
      ]},
      {id:'v2',context:'Yıllar sonra çocukluk arkadaşının sesini duymak ona ilaç gibi geldi.',prompt:'“İlaç gibi geldi” sözü bu cümlede hangi anlamda kullanılmıştır?',explanation:'İfade gerçek bir tedaviyi değil, görüşmenin moral verici ve iyi hissettiren etkisini belirtir.',evidence:['Bir arkadaşın sesi söz konusudur.','Duygusal rahatlama anlatılır.','Tıbbi tedavi yapılmaz.'],options:[
        {key:'a',text:'Moral verip iyi hissettirdi',checks:{fitsContext:true,preservesMeaning:true}},
        {key:'b',text:'Bir hastalığı tıbben tedavi etti',checks:{fitsContext:false,preservesMeaning:false},misconceptionId:'literal-medical-treatment',why:'Mecazı gerçek ilaç etkisi olarak yorumlar.',rule:'literalize-medical-metaphor'},
        {key:'c',text:'Arkadaşının sesini değiştirdi',checks:{fitsContext:false,preservesMeaning:false},misconceptionId:'object-effect-confusion',why:'Duygusal etkiyi sesin niteliğinde değişim sanır.',rule:'shift-effect-to-object'},
        {key:'d',text:'Geçmişe ilişkin anıları sildirdi',checks:{fitsContext:false,preservesMeaning:false},misconceptionId:'reverse-memory-effect',why:'Arkadaş sesiyle canlanan bağı anıları silme olarak okur.',rule:'reverse-memory-association'}
      ]}
    ]
  }),
  defineCriteriaPremiumBlueprint({
    id:'hs-meaning-abstract-weight',gameId:'meaning-hunt',familyId:'hs-meaning-abstract-weight-family',skeletonId:'hs-meaning-abstract-weight:physical-word-to-abstract-burden',subjectId:'turkish',topicId:'abstract-meaning',learningOutcomeId:'distinguish-abstract-burden-sense-from-physical-weight',solutionClass:'abstract-word-sense',criteria:['fitsContext','preservesMeaning'],extraTraits:['abstractMeaning'],
    variants:[
      {id:'v1',context:'Ekip lideri, verilerin güvenliğinden sorumlu olmanın ağır bir yük olduğunu söyledi.',prompt:'“Ağır” sözcüğü bu cümlede hangi anlamı taşır?',explanation:'Sözcük fiziksel kütleyi değil, sorumluluğun ciddi ve zorlayıcı oluşunu belirtir.',evidence:['Yük, sorumlulukla ilgilidir.','Veri güvenliği ciddi sonuçlar doğurabilir.','Fiziksel nesne tartılmaz.'],options:[
        {key:'a',text:'Ciddi ve zorlayıcı nitelikte',checks:{fitsContext:true,preservesMeaning:true}},
        {key:'b',text:'Kütlesi ölçülebilen yüksek ağırlıkta',checks:{fitsContext:false,preservesMeaning:false},misconceptionId:'physical-weight',why:'Soyut sorumluluğu fiziksel kütle olarak yorumlar.',rule:'select-physical-weight-sense'},
        {key:'c',text:'Yavaş ilerleyen düşük tempoda',checks:{fitsContext:false,preservesMeaning:false},misconceptionId:'heavy-as-slow',why:'“Ağır”ın tempo anlamını yanlış bağlama taşır.',rule:'select-slow-tempo-sense'},
        {key:'d',text:'Değeri az ve kolay vazgeçilir',checks:{fitsContext:false,preservesMeaning:false},misconceptionId:'reverse-seriousness',why:'Ciddi sorumluluğun önem derecesini tersine çevirir.',rule:'reverse-importance'}
      ]},
      {id:'v2',context:'Komisyon, kararın toplum üzerindeki ağır sonuçlarını ayrıntılı biçimde değerlendirdi.',prompt:'“Ağır” sözcüğü bu cümlede hangi anlamı taşır?',explanation:'Burada ağır, sonuçların önemli, ciddi ve etkisi yüksek olmasını anlatır.',evidence:['Toplumsal sonuçlar değerlendirilir.','Kararın etkisi önemlidir.','Fiziksel ağırlık söz konusu değildir.'],options:[
        {key:'a',text:'Etkisi ciddi ve önemli olan',checks:{fitsContext:true,preservesMeaning:true}},
        {key:'b',text:'Hareketi yavaş ve güç olan',checks:{fitsContext:false,preservesMeaning:false},misconceptionId:'movement-sense',why:'Sonuçları fiziksel hareket yavaşlığıyla açıklar.',rule:'select-movement-sense'},
        {key:'c',text:'Ölçülebilir kütlesi fazla olan',checks:{fitsContext:false,preservesMeaning:false},misconceptionId:'mass-sense',why:'Soyut etkiyi ölçülebilir kütleye dönüştürür.',rule:'select-mass-sense'},
        {key:'d',text:'Kısa sürede unutulan önemsiz',checks:{fitsContext:false,preservesMeaning:false},misconceptionId:'minimize-consequence',why:'Ciddi sonucu önemsiz ve geçici sayar.',rule:'reverse-consequence-severity'}
      ]}
    ]
  }),
  defineCriteriaPremiumBlueprint({
    id:'hs-meaning-idiom-control',gameId:'meaning-hunt',familyId:'hs-meaning-idiom-control-family',skeletonId:'hs-meaning-idiom-control:infer-action-from-idiom',subjectId:'turkish',topicId:'idioms',learningOutcomeId:'infer-intended-action-of-idiom-in-context',solutionClass:'idiom-meaning',criteria:['fitsContext','preservesMeaning'],extraTraits:['idiomaticReasoning'],
    variants:[
      {id:'v1',context:'Proje gecikince ekip yeni bir plan hazırladı ve işlerin iplerini eline aldı.',prompt:'“İşlerin iplerini eline aldı” sözüyle anlatılmak istenen nedir?',explanation:'Ekip, süreci başkalarının akışına bırakmayıp yönetimi ve sorumluluğu üstlenmiştir.',evidence:['Gecikmeye karşı yeni plan yapılır.','Ekip etkin biçimde harekete geçer.','Yönetim sorumluluğu üstlenilir.'],options:[
        {key:'a',text:'Sürecin yönetimini üstlendi',checks:{fitsContext:true,preservesMeaning:true}},
        {key:'b',text:'Projede kullanılan araçları topladı',checks:{fitsContext:false,preservesMeaning:false},misconceptionId:'literal-rope',why:'Deyimdeki “ip” sözcüğünü gerçek araç olarak yorumlar.',rule:'literalize-idiom-object'},
        {key:'c',text:'Bütün sorumluluklardan uzaklaştı',checks:{fitsContext:false,preservesMeaning:false},misconceptionId:'reverse-responsibility',why:'Yönetimi üstlenmenin tersine sorumluluktan kaçmayı seçer.',rule:'reverse-idiom-action'},
        {key:'d',text:'Planı değerlendirmeden erteledi',checks:{fitsContext:false,preservesMeaning:false},misconceptionId:'delay-instead-of-control',why:'Etkin müdahaleyi pasif erteleme olarak okur.',rule:'replace-control-with-delay'}
      ]},
      {id:'v2',context:'Dağınık yürüyen araştırmada koordinatör devreye girerek dizginleri eline aldı.',prompt:'“Dizginleri eline aldı” sözüyle anlatılmak istenen nedir?',explanation:'Koordinatör, dağınık süreci düzenlemek üzere kontrolü ve yönlendirmeyi üstlenmiştir.',evidence:['Araştırma dağınık yürür.','Koordinatör sürece müdahale eder.','Kontrol ve yönlendirme sağlanır.'],options:[
        {key:'a',text:'Çalışmanın kontrolünü üstlendi',checks:{fitsContext:true,preservesMeaning:true}},
        {key:'b',text:'Araştırma araçlarını depoya kaldırdı',checks:{fitsContext:false,preservesMeaning:false},misconceptionId:'literal-reins',why:'Deyimsel kontrol anlamını fiziksel eşya eylemine çevirir.',rule:'literalize-control-idiom'},
        {key:'c',text:'Karar vermeyi tamamen başkalarına bıraktı',checks:{fitsContext:false,preservesMeaning:false},misconceptionId:'delegate-all-control',why:'Kontrolü üstlenmenin tersini ifade eder.',rule:'reverse-control-transfer'},
        {key:'d',text:'Sorunları görmezden gelerek bekledi',checks:{fitsContext:false,preservesMeaning:false},misconceptionId:'passive-waiting',why:'Etkin yönlendirmeyi pasif beklemeyle karıştırır.',rule:'replace-direction-with-inaction'}
      ]}
    ]
  }),
  defineCriteriaPremiumBlueprint({
    id:'hs-meaning-precision-replacement',gameId:'meaning-hunt',familyId:'hs-meaning-precision-replacement-family',skeletonId:'hs-meaning-precision-replacement:replace-without-nuance-loss',subjectId:'turkish',topicId:'semantic-precision',learningOutcomeId:'choose-replacement-that-preserves-contextual-nuance',solutionClass:'meaning-preserving-replacement',criteria:['fitsContext','preservesMeaning'],extraTraits:['lexicalPrecision'],
    variants:[
      {id:'v1',context:'Uzun toplantılar, ekibin üretime ayıracağı zamanı tüketti.',prompt:'“Tüketti” sözcüğünün yerine anlamı en iyi koruyan seçenek hangisidir?',explanation:'Cümlede zamanın kullanılıp azalması anlatıldığı için “harcadı” anlamı korunur.',evidence:['Azalan şey zamandır.','Toplantılar zaman kullanımına yol açar.','Fiziksel yeme eylemi yoktur.'],options:[
        {key:'a',text:'harcadı',checks:{fitsContext:true,preservesMeaning:true}},
        {key:'b',text:'sakladı',checks:{fitsContext:false,preservesMeaning:false},misconceptionId:'reverse-use',why:'Zamanın azalması yerine korunmasını anlatır.',rule:'reverse-resource-use'},
        {key:'c',text:'çoğalttı',checks:{fitsContext:false,preservesMeaning:false},misconceptionId:'reverse-quantity',why:'Kullanılan zamanı artırılmış gibi gösterir.',rule:'reverse-quantity-change'},
        {key:'d',text:'ölçtü',checks:{fitsContext:false,preservesMeaning:false},misconceptionId:'measurement-not-consumption',why:'Zamanı kullanmak yerine yalnız ölçme eylemi verir.',rule:'replace-consumption-with-measurement'}
      ]},
      {id:'v2',context:'Yeni kanıt, araştırmacının ilk varsayımını sarstı.',prompt:'“Sarstı” sözcüğünün yerine anlamı en iyi koruyan seçenek hangisidir?',explanation:'Kanıt, varsayımın güvenilirliğini zayıflatmış; fiziksel bir sarsma gerçekleşmemiştir.',evidence:['Yeni kanıt varsayımla ilişkilidir.','Varsayımın gücü azalır.','Fiziksel hareket anlatılmaz.'],options:[
        {key:'a',text:'zayıflattı',checks:{fitsContext:true,preservesMeaning:true}},
        {key:'b',text:'doğruladı',checks:{fitsContext:false,preservesMeaning:false},misconceptionId:'reverse-evidence-effect',why:'Kanıtın varsayımı güçlendirdiğini söyleyerek anlamı tersine çevirir.',rule:'reverse-evidence-impact'},
        {key:'c',text:'gizledi',checks:{fitsContext:false,preservesMeaning:false},misconceptionId:'concealment',why:'Güven kaybını bilgiyi saklama eylemiyle karıştırır.',rule:'replace-weakening-with-hiding'},
        {key:'d',text:'ölçtü',checks:{fitsContext:false,preservesMeaning:false},misconceptionId:'measurement',why:'Varsayım üzerindeki etki yerine ölçme eylemi bildirir.',rule:'replace-impact-with-measurement'}
      ]}
    ]
  })
];

function civicBlueprint({id,familyId,skeletonId,topicId,learningOutcomeId,criteria,variants,extraTraits=[]}) {
  return defineCriteriaPremiumBlueprint({
    id,gameId:'social-citizenship',familyId,skeletonId,subjectId:'social-science',topicId,learningOutcomeId,solutionClass:`civic-${topicId}`,criteria,variants,extraTraits:[...extraTraits,'civicReasoning']
  });
}

const CIVIC_BLUEPRINTS = [
  civicBlueprint({id:'hs-civic-right-responsibility',familyId:'hs-civic-right-responsibility-family',skeletonId:'hs-civic-right-responsibility:protect-right-with-proportionate-action',topicId:'rights-and-responsibilities',learningOutcomeId:'balance-individual-right-and-shared-responsibility',criteria:['protectsRight','proportionate','lawful'],variants:[
    {id:'v1',context:'Bir okul kulübü toplantısında bazı öğrencilerin söz alma hakkı sürekli kesiliyor.',prompt:'Hakkı koruyan ve ortak sorumluluğa uygun ilk adım hangisidir?',explanation:'Söz sırası kuralını birlikte belirlemek, herkesin katılım hakkını orantılı ve yasal biçimde korur.',evidence:['Sorun söz alma hakkıyla ilgilidir.','İlk adım şiddetsiz ve uygulanabilir olmalıdır.','Kural herkes için aynı işlemelidir.'],options:[
      {key:'a',text:'Eşit söz süresi belirleyip sırayı görünür biçimde uygulamak',checks:{protectsRight:true,proportionate:true,lawful:true}},
      {key:'b',text:'Söz kesen öğrencilerin toplantıya girişini kalıcı olarak yasaklamak',checks:{protectsRight:false,proportionate:false,lawful:false},misconceptionId:'excessive-sanction',why:'İlk soruna göre ölçüsüz ve dışlayıcı bir yaptırım önerir.',rule:'use-disproportionate-exclusion'},
      {key:'c',text:'Tartışma çıkmasın diye söz hakkı talebinden vazgeçmek',checks:{protectsRight:false,proportionate:true,lawful:true},misconceptionId:'abandon-right',why:'Sorunu çözmek yerine katılım hakkından vazgeçer.',rule:'surrender-protected-right'},
      {key:'d',text:'Yalnız kulüp başkanının konuşmasına izin vermek',checks:{protectsRight:false,proportionate:false,lawful:false},misconceptionId:'centralize-voice',why:'Eşit katılım sorununu tek kişiye yetki vererek büyütür.',rule:'replace-equal-participation-with-monopoly'}
    ]},
    {id:'v2',context:'Bir apartmanda ortak dinlenme alanı, birkaç kişi tarafından sürekli kişisel eşya depolamak için kullanılıyor.',prompt:'Ortak kullanım hakkını ve sorumluluğu birlikte gözeten çözüm hangisidir?',explanation:'Ortak alan için şeffaf ve herkese eşit uygulanacak kullanım kuralı belirlemek hak ile sorumluluğu dengeler.',evidence:['Alan bütün sakinlere aittir.','Kişisel kullanım ortak erişimi engeller.','Çözüm herkese aynı uygulanmalıdır.'],options:[
      {key:'a',text:'Ortak alan için eşit erişim ve süre kuralı belirlemek',checks:{protectsRight:true,proportionate:true,lawful:true}},
      {key:'b',text:'Eşyaları haber vermeden dışarı atıp sahiplerini cezalandırmak',checks:{protectsRight:false,proportionate:false,lawful:false},misconceptionId:'self-help-punishment',why:'Ortak hakkı korurken mülkiyet ve usul haklarını ihlal eder.',rule:'use-unannounced-self-help'},
      {key:'c',text:'Sorun büyümesin diye ortak alanı tamamen kapatmak',checks:{protectsRight:false,proportionate:false,lawful:true},misconceptionId:'remove-shared-right',why:'İhlali çözmek yerine herkesin ortak kullanım hakkını kaldırır.',rule:'eliminate-common-access'},
      {key:'d',text:'Alanı ilk kullanan kişiye sürekli tahsis etmek',checks:{protectsRight:false,proportionate:false,lawful:false},misconceptionId:'first-user-privilege',why:'Ortak alanı kalıcı kişisel ayrıcalığa dönüştürür.',rule:'convert-common-right-to-private-privilege'}
    ]}
  ]}),
  civicBlueprint({id:'hs-civic-media-verification',familyId:'hs-civic-media-verification-family',skeletonId:'hs-civic-media-verification:trace-source-cross-check-context',topicId:'media-literacy',learningOutcomeId:'verify-public-claim-before-sharing',criteria:['checksSource','crossChecks','preservesContext'],variants:[
    {id:'v1',context:'Sosyal medyada “yarın bütün okullar kapalı” başlıklı, kaynağı görünmeyen bir görsel hızla yayılıyor.',prompt:'Paylaşmadan önce en güvenilir doğrulama yolu hangisidir?',explanation:'Resmî duyuru kaynağını bulmak, tarihi kontrol etmek ve ikinci güvenilir kaynakla karşılaştırmak bağlamı korur.',evidence:['Görselde kaynak görünmez.','Duyuru güncel tarih gerektirir.','Resmî ve bağımsız doğrulama mümkündür.'],options:[
      {key:'a',text:'Resmî duyuruyu bulup tarihini ve ikinci güvenilir kaynağı karşılaştırmak',checks:{checksSource:true,crossChecks:true,preservesContext:true}},
      {key:'b',text:'Görsel çok paylaşıldığı için doğru kabul edip hemen iletmek',checks:{checksSource:false,crossChecks:false,preservesContext:false},misconceptionId:'popularity-as-truth',why:'Yaygın paylaşımı doğruluk kanıtı sayar.',rule:'equate-virality-with-veracity'},
      {key:'c',text:'Yalnız görseldeki büyük yazıya bakıp karar vermek',checks:{checksSource:false,crossChecks:false,preservesContext:false},misconceptionId:'headline-only',why:'Kaynak, tarih ve ayrıntı yerine başlığa dayanır.',rule:'verify-by-headline-only'},
      {key:'d',text:'Gönderene güvenip duyurunun tarihini kontrol etmemek',checks:{checksSource:false,crossChecks:false,preservesContext:false},misconceptionId:'trust-sender',why:'İçeriğin kanıtı yerine paylaşan kişiye güveni kullanır.',rule:'substitute-sender-trust-for-source'}
    ]},
    {id:'v2',context:'Bir video, bir belediye projesinin maliyetini gösterdiğini iddia ediyor; videonun yalnız on saniyelik bölümü paylaşılmış.',prompt:'İddiayı bağlamından koparmadan değerlendiren yöntem hangisidir?',explanation:'Tam kaydı, özgün açıklamayı ve doğrulanabilir bütçe belgesini karşılaştırmak kesilmiş görüntünün bağlamını sınar.',evidence:['Video kısa bir kesittir.','Maliyet iddiası belgeyle doğrulanabilir.','Özgün bağlam erişilebilir olmalıdır.'],options:[
      {key:'a',text:'Tam videoyu, özgün açıklamayı ve bütçe belgesini karşılaştırmak',checks:{checksSource:true,crossChecks:true,preservesContext:true}},
      {key:'b',text:'Kısa kesitteki tepkiye bakıp bütün projeyi değerlendirmek',checks:{checksSource:false,crossChecks:false,preservesContext:false},misconceptionId:'clip-as-whole',why:'Kısa bir kesiti bütün olayın bağlamı sayar.',rule:'generalize-from-edited-clip'},
      {key:'c',text:'Yorum sayısı yüksek olduğu için maliyet iddiasını doğrulamak',checks:{checksSource:false,crossChecks:false,preservesContext:false},misconceptionId:'engagement-as-evidence',why:'Etkileşim miktarını mali belge yerine kanıt kabul eder.',rule:'use-engagement-as-documentation'},
      {key:'d',text:'Videoyu farklı başlıkla yeniden paylaşarak tepki ölçmek',checks:{checksSource:false,crossChecks:false,preservesContext:false},misconceptionId:'reaction-test',why:'Doğrulama yerine yeni ve yanıltıcı bir bağlam üretir.',rule:'replace-verification-with-reaction'}
    ]}
  ]}),
  civicBlueprint({id:'hs-civic-public-budget',familyId:'hs-civic-public-budget-family',skeletonId:'hs-civic-public-budget:compare-benefit-cost-opportunity',topicId:'public-budget',learningOutcomeId:'evaluate-public-spending-with-opportunity-cost',criteria:['usesEvidence','considersOpportunityCost','publicBenefit'],variants:[
    {id:'v1',context:'Bir ilçe, sınırlı bütçeyle ya tek bir gösteri alanı kuracak ya da üç mahallede yağmur suyu drenajını yenileyecektir. Taşkın kayıtları üç mahallenin her yıl zarar gördüğünü gösteriyor.',prompt:'Kamu yararı ve fırsat maliyetini birlikte gözeten karar hangisidir?',explanation:'Drenaj yatırımı belgelenmiş ve tekrar eden zararı azaltır; gösteri alanından vazgeçmenin fırsat maliyeti de açıkça kabul edilir.',evidence:['Bütçe iki projeden yalnız birine yeter.','Taşkın zararı kayıtlarla doğrulanmıştır.','Karar vazgeçilen seçeneği de değerlendirmelidir.'],options:[
      {key:'a',text:'Drenajı seçip gösteri alanından vazgeçmenin maliyetini açıkça gerekçelendirmek',checks:{usesEvidence:true,considersOpportunityCost:true,publicBenefit:true}},
      {key:'b',text:'En dikkat çekici proje olduğu için gösteri alanını seçmek',checks:{usesEvidence:false,considersOpportunityCost:false,publicBenefit:false},misconceptionId:'visibility-over-evidence',why:'Kayıtlı zararı değil projenin görünürlüğünü ölçüt alır.',rule:'choose-by-publicity'},
      {key:'c',text:'İki projeyi de başlatıp bütçe yetmezse yarım bırakmak',checks:{usesEvidence:false,considersOpportunityCost:false,publicBenefit:false},misconceptionId:'ignore-budget-constraint',why:'Sınırlı bütçe koşulunu yok sayar ve iki yarım yatırım riski yaratır.',rule:'ignore-resource-constraint'},
      {key:'d',text:'Kamu yararını takipçi sayısına göre belirlemek',checks:{usesEvidence:false,considersOpportunityCost:false,publicBenefit:false},misconceptionId:'influence-as-budget-analysis',why:'Kamusal veri yerine kişisel popülerliği karar ölçütü yapar.',rule:'delegate-budget-to-influencer'}
    ]},
    {id:'v2',context:'Bir okulun bütçesi ya laboratuvar havalandırmasını yenilemeye ya da giriş alanına dekoratif ekran kurmaya yetmektedir. Güvenlik raporu havalandırma eksikliğini risk olarak belirtiyor.',prompt:'Kanıta ve fırsat maliyetine dayalı karar hangisidir?',explanation:'Güvenlik riski belgeli olduğu için havalandırma öncelenir; dekoratif ekrandan vazgeçmenin sonucu da karar notuna yazılır.',evidence:['Bütçe tek seçeneğe yeter.','Güvenlik raporu somut risk gösterir.','Dekoratif yatırımın ertelenmesi fırsat maliyetidir.'],options:[
      {key:'a',text:'Havalandırmayı seçip ertelenen ekranı gerekçeli karara yazmak',checks:{usesEvidence:true,considersOpportunityCost:true,publicBenefit:true}},
      {key:'b',text:'Daha görünür olduğu için dekoratif ekranı öncelemek',checks:{usesEvidence:false,considersOpportunityCost:false,publicBenefit:false},misconceptionId:'appearance-over-safety',why:'Belgelenmiş güvenlik riskini görünürlük uğruna erteler.',rule:'prioritize-appearance-over-risk'},
      {key:'c',text:'Raporu okumadan iki projenin maliyetini eşit saymak',checks:{usesEvidence:false,considersOpportunityCost:false,publicBenefit:false},misconceptionId:'ignore-risk-report',why:'Kararın dayandığı güvenlik kanıtını değerlendirme dışı bırakır.',rule:'discard-relevant-evidence'},
      {key:'d',text:'Bütçe yetmediği için hiçbir yatırım yapmamak',checks:{usesEvidence:false,considersOpportunityCost:false,publicBenefit:false},misconceptionId:'false-all-or-none',why:'Tek projeye yeten bütçeyi hiç kullanmama sonucuna varır.',rule:'convert-choice-to-inaction'}
    ]}
  ]}),
  civicBlueprint({id:'hs-civic-participation-channel',familyId:'hs-civic-participation-channel-family',skeletonId:'hs-civic-participation-channel:match-issue-authority-documented-request',topicId:'democratic-participation',learningOutcomeId:'choose-effective-and-accountable-participation-channel',criteria:['reachesAuthority','documented','constructive'],variants:[
    {id:'v1',context:'Mahalledeki yaya geçidinin çizgileri silinmiş ve sürücüler geçidi fark etmekte zorlanıyor.',prompt:'Sorunu yetkili birime ulaştıran ve izlenebilir kılan katılım yolu hangisidir?',explanation:'Konumu ve kanıtı içeren kayıtlı başvuru, sorumlu yerel birime ulaşır ve başvurunun takibini mümkün kılar.',evidence:['Sorun belirli bir kamusal konumdadır.','Yerel yönetim birimi yetkilidir.','Kayıt numarası izlenebilirlik sağlar.'],options:[
      {key:'a',text:'Konum ve fotoğrafla belediyeye kayıtlı başvuru yapmak',checks:{reachesAuthority:true,documented:true,constructive:true}},
      {key:'b',text:'Sorunu yalnız arkadaş grubunda konuşup beklemek',checks:{reachesAuthority:false,documented:false,constructive:false},misconceptionId:'private-complaint-only',why:'Yetkili kuruma ulaşmayan konuşmayı katılım sanır.',rule:'keep-issue-in-private-group'},
      {key:'c',text:'Geçidi izinsiz biçimde kendisi boyamaya başlamak',checks:{reachesAuthority:false,documented:false,constructive:false},misconceptionId:'unauthorized-self-action',why:'Güvenlik standardı ve yetki sürecini atlar.',rule:'replace-application-with-unauthorized-action'},
      {key:'d',text:'Konuyla ilgisiz bir kuruma isimsiz mesaj göndermek',checks:{reachesAuthority:false,documented:false,constructive:false},misconceptionId:'wrong-authority',why:'Sorunu çözme yetkisi olmayan birime yönelir.',rule:'contact-unrelated-authority'}
    ]},
    {id:'v2',context:'Okul çevresindeki yoğun araç trafiği öğrencilerin giriş saatinde risk oluşturuyor.',prompt:'Sorunu kanıta dayalı ve yapıcı biçimde gündeme getiren yol hangisidir?',explanation:'Saat ve gözlem verisiyle okul yönetimi ve trafik birimine ortak başvuru yapmak doğru yetkiyi, kayıtlı süreci ve çözüm önerisini birleştirir.',evidence:['Risk belirli saatlerde oluşur.','Birden fazla yetkili birim vardır.','Gözlem verisi öneriyi güçlendirir.'],options:[
      {key:'a',text:'Saat verileriyle okul ve trafik birimine ortak başvuru yapmak',checks:{reachesAuthority:true,documented:true,constructive:true}},
      {key:'b',text:'Araç sahiplerini sosyal medyada isim vererek suçlamak',checks:{reachesAuthority:false,documented:false,constructive:false},misconceptionId:'public-shaming',why:'Yetkili süreç yerine kişileri hedef gösterir.',rule:'replace-civic-request-with-shaming'},
      {key:'c',text:'Riskli saatleri kaydetmeden genel bir söylenti yaymak',checks:{reachesAuthority:false,documented:false,constructive:false},misconceptionId:'claim-without-record',why:'Somut gözlem yerine doğrulanamayan genelleme kullanır.',rule:'remove-documentation'},
      {key:'d',text:'Sorunu yalnız sınıf içinde tartışıp işlem yapmamak',checks:{reachesAuthority:false,documented:false,constructive:false},misconceptionId:'discussion-without-action',why:'Tartışmayı yetkili başvuru ve takip yerine koyar.',rule:'stop-at-informal-discussion'}
    ]}
  ]}),
  civicBlueprint({id:'hs-civic-data-privacy',familyId:'hs-civic-data-privacy-family',skeletonId:'hs-civic-data-privacy:purpose-minimization-informed-consent',topicId:'digital-rights',learningOutcomeId:'evaluate-personal-data-request-by-purpose-and-minimization',criteria:['clearPurpose','minimumData','informedChoice'],variants:[
    {id:'v1',context:'Bir yarışma uygulaması, sonuçları göstermek için ad ve sınıf bilgisinin yanında rehberdeki bütün kişilere erişim istiyor.',prompt:'Kişisel veri hakkını en iyi koruyan karar hangisidir?',explanation:'Sonuç göstermek için rehber erişimi gerekli değildir; amaçla sınırlı veriye izin verip gereksiz izni reddetmek veri minimizasyonudur.',evidence:['Uygulamanın amacı sonuç göstermektir.','Rehber bilgisi bu amaç için gerekli değildir.','Kullanıcı izin kapsamını seçebilmelidir.'],options:[
      {key:'a',text:'Gerekli ad-sınıf verisine izin verip rehber erişimini reddetmek',checks:{clearPurpose:true,minimumData:true,informedChoice:true}},
      {key:'b',text:'Uygulama ücretsiz olduğu için bütün izinleri kabul etmek',checks:{clearPurpose:false,minimumData:false,informedChoice:false},misconceptionId:'free-means-safe',why:'Ücretsiz olmayı veri ihtiyacının kanıtı sayar.',rule:'equate-price-with-privacy-safety'},
      {key:'c',text:'İzin metnini okumadan varsayılan seçeneği onaylamak',checks:{clearPurpose:false,minimumData:false,informedChoice:false},misconceptionId:'uninformed-default',why:'Amaç ve kapsamı değerlendirmeden karar verir.',rule:'accept-default-without-reading'},
      {key:'d',text:'Sonuçları görmek için şifreyi arkadaşla paylaşmak',checks:{clearPurpose:false,minimumData:false,informedChoice:false},misconceptionId:'credential-sharing',why:'Gereksiz veri talebini çözmek yerine hesap güvenliğini bozar.',rule:'share-credentials'}
    ]},
    {id:'v2',context:'Bir etkinlik formu, katılım için e-posta adresi isterken ayrıca aile gelirini zorunlu alan yapıyor; gelir bilgisi etkinlik planında kullanılmayacak.',prompt:'Amaçla sınırlı veri kullanımına uygun yaklaşım hangisidir?',explanation:'Etkinlik iletişimi için e-posta gerekli olabilir; kullanılmayan gelir bilgisinin zorunlu tutulması amaç ve veri minimizasyonuna aykırıdır.',evidence:['E-posta iletişim amacıyla ilişkilidir.','Gelir bilgisi planlamada kullanılmayacaktır.','Gereksiz veri zorunlu olmamalıdır.'],options:[
      {key:'a',text:'E-postayı verip gelir alanının kaldırılmasını talep etmek',checks:{clearPurpose:true,minimumData:true,informedChoice:true}},
      {key:'b',text:'Form hazırlandığı için bütün alanları gerekli kabul etmek',checks:{clearPurpose:false,minimumData:false,informedChoice:false},misconceptionId:'form-authority',why:'Bir alanın formda bulunmasını gereklilik kanıtı sayar.',rule:'assume-all-form-fields-necessary'},
      {key:'c',text:'Gerçek olmayan gelir bilgisi yazıp formu tamamlamak',checks:{clearPurpose:false,minimumData:false,informedChoice:false},misconceptionId:'false-data-workaround',why:'Gereksiz veri talebini düzeltmek yerine yanlış veri üretir.',rule:'bypass-with-false-data'},
      {key:'d',text:'Gelir bilgisini herkese açık bir yorumda paylaşmak',checks:{clearPurpose:false,minimumData:false,informedChoice:false},misconceptionId:'public-oversharing',why:'Mahrem verinin kapsamını daha da genişletir.',rule:'publish-sensitive-data'}
    ]}
  ]}),
  civicBlueprint({id:'hs-civic-consumer-rights',familyId:'hs-civic-consumer-rights-family',skeletonId:'hs-civic-consumer-rights:document-defect-request-remedy',topicId:'consumer-rights',learningOutcomeId:'use-documented-and-proportionate-consumer-remedy',criteria:['documentsIssue','usesProperChannel','proportionateRemedy'],variants:[
    {id:'v1',context:'Yeni alınan kulaklık ilk gün çalışmıyor; kutu ve fatura duruyor.',prompt:'Tüketici hakkını kanıtlı ve uygun kanaldan kullanan ilk adım hangisidir?',explanation:'Arızayı belgeleyip satıcıya fatura ile başvurmak sorunu izlenebilir kılar ve onarım, değişim veya iade talebini usule bağlar.',evidence:['Ürün ilk günden arızalıdır.','Fatura ve kutu mevcuttur.','Satıcı ilk başvuru kanalıdır.'],options:[
      {key:'a',text:'Arızayı belgeleyip faturayla satıcıdan uygun çözüm istemek',checks:{documentsIssue:true,usesProperChannel:true,proportionateRemedy:true}},
      {key:'b',text:'Tüketici hakkı için ürüne yeni zarar vermek',checks:{documentsIssue:false,usesProperChannel:false,proportionateRemedy:false},misconceptionId:'manufacture-evidence',why:'Mevcut ayıbı belgelemek yerine yeni zarar üretir.',rule:'create-false-damage-evidence'},
      {key:'c',text:'Tüketici başvurusunda faturayı atıp yorum yazmak',checks:{documentsIssue:false,usesProperChannel:false,proportionateRemedy:false},misconceptionId:'discard-proof',why:'Satın alma kanıtını kaybedip çözüm kanalını kullanmaz.',rule:'replace-remedy-with-review'},
      {key:'d',text:'Tüketici çözümü yerine mağazanın kapanmasını istemek',checks:{documentsIssue:false,usesProperChannel:false,proportionateRemedy:false},misconceptionId:'disproportionate-demand',why:'Tek ürün sorunu için ölçüsüz bir yaptırım talep eder.',rule:'escalate-beyond-remedy'}
    ]},
    {id:'v2',context:'İnternetten alınan ayakkabı, ilandaki numara ile aynı etiketi taşısa da belirtilen iç ölçüden üç santimetre kısa çıkıyor.',prompt:'Uyuşmazlığı doğru biçimde ele alan tüketici adımı hangisidir?',explanation:'İlan ölçüsü ile ürün ölçüsünü belgeleyip sipariş kaydı üzerinden satıcıya başvurmak somut uyuşmazlığı ve uygun çözümü gösterir.',evidence:['İlanda ölçü bilgisi vardır.','Ürün ölçümü farklıdır.','Sipariş kaydı karşılaştırma sağlar.'],options:[
      {key:'a',text:'İlanı ve ölçümü belgeleyip sipariş kaydıyla değişim istemek',checks:{documentsIssue:true,usesProperChannel:true,proportionateRemedy:true}},
      {key:'b',text:'Ölçüm yapmadan ürünün sahte olduğunu duyurmak',checks:{documentsIssue:false,usesProperChannel:false,proportionateRemedy:false},misconceptionId:'unsupported-accusation',why:'Somut ölçü uyuşmazlığını belgelemeden daha geniş bir iddia kurar.',rule:'accuse-without-measurement'},
      {key:'c',text:'Sipariş kaydını silip yalnız kutuyu göndermek',checks:{documentsIssue:false,usesProperChannel:false,proportionateRemedy:false},misconceptionId:'remove-transaction-proof',why:'İlan ve satın alma bağlantısını kanıtlayan kaydı yok eder.',rule:'discard-order-record'},
      {key:'d',text:'Ürünü kullanmaya devam edip aylar sonra sözlü şikâyet etmek',checks:{documentsIssue:false,usesProperChannel:false,proportionateRemedy:false},misconceptionId:'delay-undocumented-claim',why:'Uyuşmazlığı zamanında ve kayıtlı biçimde bildirmez.',rule:'delay-and-remove-documentation'}
    ]}
  ]}),
  civicBlueprint({id:'hs-civic-environmental-commons',familyId:'hs-civic-environmental-commons-family',skeletonId:'hs-civic-environmental-commons:shared-resource-evidence-fair-rule',topicId:'environmental-citizenship',learningOutcomeId:'design-fair-rule-for-shared-environmental-resource',criteria:['protectsCommonResource','evidenceBased','fairBurden'],variants:[
    {id:'v1',context:'Kuraklık döneminde mahallede su tüketimi artmış; sayaç verileri bahçe sulamasının en yüksek payı oluşturduğunu gösteriyor.',prompt:'Ortak su kaynağını koruyan ve yükü adil dağıtan önlem hangisidir?',explanation:'Sayaç verisine göre yüksek tüketim alanına zaman ve verimlilik kuralı getirmek, ihtiyacı tümden yasaklamadan ortak kaynağı korur.',evidence:['Bahçe sulaması en büyük tüketim kalemidir.','Kuraklık ortak kaynağı sınırlar.','Kural benzer kullanıcıya aynı uygulanmalıdır.'],options:[
      {key:'a',text:'Sulamayı serin saatlerle sınırlayıp verimli yöntemleri desteklemek',checks:{protectsCommonResource:true,evidenceBased:true,fairBurden:true}},
      {key:'b',text:'Sayaç verisine bakmadan yalnız bir sokağın suyunu kesmek',checks:{protectsCommonResource:false,evidenceBased:false,fairBurden:false},misconceptionId:'arbitrary-local-punishment',why:'Veriye dayanmayan ve yükü tek gruba yıkan önlem önerir.',rule:'impose-arbitrary-burden'},
      {key:'c',text:'Kuraklık bitene kadar bütün temel su kullanımını yasaklamak',checks:{protectsCommonResource:true,evidenceBased:false,fairBurden:false},misconceptionId:'total-ban',why:'Temel ihtiyaç ile yüksek tüketimi ayırmadan ölçüsüz yasak kurar.',rule:'apply-undifferentiated-total-ban'},
      {key:'d',text:'Tüketim artışını görmezden gelip yeni veri toplamamak',checks:{protectsCommonResource:false,evidenceBased:false,fairBurden:false},misconceptionId:'ignore-common-resource',why:'Sorunu ve ölçüm verisini işlem dışı bırakır.',rule:'take-no-resource-action'}
    ]},
    {id:'v2',context:'Bir kıyıda ziyaretçi yoğunluğu artınca atık miktarı iki katına çıkmış; ölçümler en büyük artışın tek kullanımlık ambalajlarda olduğunu gösteriyor.',prompt:'Kıyıyı koruyan ve sorumluluğu adil paylaşan uygulama hangisidir?',explanation:'Atık verisinin gösterdiği kaynağa yeniden kullanım ve ayrı toplama önlemi uygulamak, ziyaretçi ile işletmelerin sorumluluğunu birlikte düzenler.',evidence:['Atık artışı ölçülmüştür.','Ana artış tek kullanımlık ambalajdadır.','Ziyaretçi ve işletmeler sürece dahildir.'],options:[
      {key:'a',text:'Yeniden kullanılabilir ambalajı teşvik edip ayrı toplama kurmak',checks:{protectsCommonResource:true,evidenceBased:true,fairBurden:true}},
      {key:'b',text:'Atık kaynağını incelemeden kıyıyı herkese kapatmak',checks:{protectsCommonResource:true,evidenceBased:false,fairBurden:false},misconceptionId:'close-without-analysis',why:'Verideki belirli kaynağa yönelmek yerine erişimi tamamen kaldırır.',rule:'replace-targeted-policy-with-closure'},
      {key:'c',text:'Yalnız ziyaretçileri suçlayıp işletmelere kural koymamak',checks:{protectsCommonResource:false,evidenceBased:false,fairBurden:false},misconceptionId:'one-sided-burden',why:'Ambalaj sunan işletmelerin sorumluluğunu dışarıda bırakır.',rule:'assign-burden-to-one-group'},
      {key:'d',text:'Atıkları görünmemesi için kıyının başka bölümüne taşımak',checks:{protectsCommonResource:false,evidenceBased:false,fairBurden:false},misconceptionId:'relocate-pollution',why:'Atığı azaltmak yerine aynı çevre içinde yer değiştirir.',rule:'move-problem-without-reduction'}
    ]}
  ]}),
  civicBlueprint({id:'hs-civic-rule-of-law',familyId:'hs-civic-rule-of-law-family',skeletonId:'hs-civic-rule-of-law:general-rule-reasoned-review-equal-application',topicId:'rule-of-law',learningOutcomeId:'recognize-equal-and-reviewable-application-of-rules',criteria:['generalRule','reasonedDecision','reviewable'],variants:[
    {id:'v1',context:'Bir okul kuralı geç kalmayı düzenliyor; aynı koşuldaki iki öğrenciden yalnız biri, yöneticiyle tartıştığı için daha ağır cezalandırılıyor.',prompt:'Hukukun üstünlüğü ilkesine en uygun düzeltme hangisidir?',explanation:'Aynı genel kural, benzer durumlara eşit uygulanmalı; karar gerekçeli ve itiraza açık olmalıdır.',evidence:['İki öğrenci aynı koşuldadır.','Farklı ceza kişisel tartışmaya dayanır.','Kararın gözden geçirilmesi mümkündür.'],options:[
      {key:'a',text:'Kuralı eşit uygulayıp gerekçeli itiraz yolu sağlamak',checks:{generalRule:true,reasonedDecision:true,reviewable:true}},
      {key:'b',text:'Kuralı yöneticinin kişisel kararına göre uygulamak',checks:{generalRule:false,reasonedDecision:false,reviewable:false},misconceptionId:'unchecked-discretion',why:'Genel kural ve gözden geçirme yerine sınırsız kişisel takdir kurar.',rule:'replace-rule-with-unreviewable-discretion'},
      {key:'c',text:'Kuralı sevilen öğrencilere farklı uygulamak',checks:{generalRule:false,reasonedDecision:false,reviewable:false},misconceptionId:'favoritism',why:'Kuralın kişiye göre değişmesini normalleştirir.',rule:'apply-rule-by-personal-preference'},
      {key:'d',text:'Kural kararını gerekçesiz ve itirazsız gizlemek',checks:{generalRule:false,reasonedDecision:false,reviewable:false},misconceptionId:'opaque-decision',why:'Kararı denetlenemez ve gerekçesiz hâle getirir.',rule:'hide-reasoning-and-record'}
    ]},
    {id:'v2',context:'Bir belediye, aynı ruhsat koşullarını sağlayan iki işletmeden birine izin verirken diğerini neden göstermeden reddediyor.',prompt:'Eşit ve denetlenebilir yönetim için gereken yaklaşım hangisidir?',explanation:'Önceden ilan edilmiş ölçütleri iki başvuruya aynı uygulamak, gerekçeyi yazmak ve itiraz imkânı tanımak kararın denetlenmesini sağlar.',evidence:['Başvurular aynı koşulları sağlar.','Ret gerekçesi açıklanmamıştır.','İdari karar gözden geçirilebilir olmalıdır.'],options:[
      {key:'a',text:'Ölçütleri eşit uygulayıp gerekçeli itiraz yolu sunmak',checks:{generalRule:true,reasonedDecision:true,reviewable:true}},
      {key:'b',text:'Yönetim kararını kişisel tercihle gerekçelendirmek',checks:{generalRule:false,reasonedDecision:false,reviewable:false},misconceptionId:'personal-preference',why:'Nesnel ölçüt yerine kişisel tercihi belirleyici yapar.',rule:'substitute-preference-for-rule'},
      {key:'c',text:'Eşit başvurulara farklı ölçüt uygulamak',checks:{generalRule:false,reasonedDecision:false,reviewable:false},misconceptionId:'moving-criteria',why:'Öngörülebilir genel kuralı ortadan kaldırır.',rule:'change-criteria-per-applicant'},
      {key:'d',text:'Yönetim kararını kayıtsız ve itirazsız bildirmek',checks:{generalRule:false,reasonedDecision:false,reviewable:false},misconceptionId:'no-record',why:'Gerekçe ve itiraz incelemesi için gerekli kaydı yok eder.',rule:'remove-reviewable-record'}
    ]}
  ]}),
  civicBlueprint({id:'hs-civic-equality',familyId:'hs-civic-equality-family',skeletonId:'hs-civic-equality:identify-barrier-provide-equitable-access',topicId:'equality-and-nondiscrimination',learningOutcomeId:'distinguish-equal-treatment-from-equitable-access',criteria:['removesBarrier','equalDignity','relevantAdjustment'],variants:[
    {id:'v1',context:'Bir konferans salonuna yalnız merdivenle girilebiliyor; tekerlekli sandalye kullanan katılımcı programa erişemiyor.',prompt:'Eşit katılımı sağlayan çözüm hangisidir?',explanation:'Erişilebilir giriş düzenlemek, kişiyi ayrı tutmadan fiziksel engeli kaldırır ve programın aynı koşullarda kullanılmasını sağlar.',evidence:['Sorun kişinin isteğinden değil fiziksel engelden doğar.','Amaç programa eşit erişimdir.','Düzenleme doğrudan engelle ilişkilidir.'],options:[
      {key:'a',text:'Erişilebilir girişle aynı programa katılım sağlamak',checks:{removesBarrier:true,equalDignity:true,relevantAdjustment:true}},
      {key:'b',text:'Eşit katılım yerine katılımcıya ayrı özet göndermek',checks:{removesBarrier:false,equalDignity:false,relevantAdjustment:false},misconceptionId:'separate-substitute',why:'Ortak programa erişimi sağlamak yerine kişiyi ayrı bir hizmete yöneltir.',rule:'replace-equal-access-with-separate-option'},
      {key:'c',text:'Eşit katılımı merdiven kullanma koşuluna bağlamak',checks:{removesBarrier:false,equalDignity:false,relevantAdjustment:false},misconceptionId:'exclude-by-barrier',why:'Kurumun fiziksel engelini kişinin yetersizliği gibi kullanır.',rule:'exclude-person-because-of-barrier'},
      {key:'d',text:'Katılım sorununu konferansı iptal ederek çözmek',checks:{removesBarrier:false,equalDignity:false,relevantAdjustment:false},misconceptionId:'cancel-for-everyone',why:'Engeli hedefli biçimde kaldırmak yerine herkesin erişimini sonlandırır.',rule:'replace-adjustment-with-cancellation'}
    ]},
    {id:'v2',context:'İşitme güçlüğü yaşayan bir öğrenci, yalnız sözlü anlatılan sınav yönergelerinin bazı bölümlerini kaçırıyor.',prompt:'Eşit değerlendirmeyi sağlayan düzenleme hangisidir?',explanation:'Aynı yönergeyi yazılı ve erişilebilir biçimde sunmak sınavın ölçtüğü beceriyi değiştirmeden iletişim engelini kaldırır.',evidence:['Sorun yönergenin yalnız sözlü verilmesidir.','Ölçülen akademik beceri değişmemelidir.','Yazılı yönerge doğrudan iletişim engelini giderir.'],options:[
      {key:'a',text:'Aynı yönergeyi yazılı ve erişilebilir biçimde de sunmak',checks:{removesBarrier:true,equalDignity:true,relevantAdjustment:true}},
      {key:'b',text:'Öğrenciyi sınava almadan doğrudan başarılı saymak',checks:{removesBarrier:false,equalDignity:false,relevantAdjustment:false},misconceptionId:'remove-assessment',why:'İletişim engelini kaldırmak yerine değerlendirmeyi ortadan kaldırır.',rule:'replace-access-with-exemption'},
      {key:'c',text:'Yönergeyi daha hızlı ve daha yüksek sesle okumak',checks:{removesBarrier:false,equalDignity:false,relevantAdjustment:false},misconceptionId:'volume-only',why:'İşitme erişimini yazılı destekle çözmek yerine aynı kanalı zorlaştırır.',rule:'intensify-inaccessible-channel'},
      {key:'d',text:'Kaçırdığı bölümleri öğrencinin sorumluluğu saymak',checks:{removesBarrier:false,equalDignity:false,relevantAdjustment:false},misconceptionId:'blame-person',why:'Erişilemeyen yönergeyi kurumsal engel olarak değerlendirmez.',rule:'attribute-barrier-to-individual'}
    ]}
  ]}),
  civicBlueprint({id:'hs-civic-disaster-solidarity',familyId:'hs-civic-disaster-solidarity-family',skeletonId:'hs-civic-disaster-solidarity:verified-need-priority-transparent-distribution',topicId:'disaster-solidarity',learningOutcomeId:'allocate-limited-aid-by-verified-need-and-transparency',criteria:['verifiedNeed','priorityBased','transparent'],variants:[
    {id:'v1',context:'Sel sonrası sınırlı sayıdaki hijyen paketi dağıtılacaktır. Kayıtlar bazı ailelerin evine erişemediğini, bazılarının ise başka merkezden paket aldığını gösteriyor.',prompt:'Dayanışmayı adil ve izlenebilir kılan dağıtım yöntemi hangisidir?',explanation:'Doğrulanmış ihtiyacı ve daha önce alınan yardımı kayda geçirerek öncelik sırası oluşturmak sınırlı kaynağı şeffaf dağıtır.',evidence:['Paket sayısı sınırlıdır.','İhtiyaç ve önceki yardım bilgisi kayıtlarda vardır.','Dağıtımın gerekçesi izlenebilir olmalıdır.'],options:[
      {key:'a',text:'Doğrulanmış ihtiyaca göre sıra oluşturup dağıtımı kaydetmek',checks:{verifiedNeed:true,priorityBased:true,transparent:true}},
      {key:'b',text:'Paketleri yalnız sıraya ilk gelenlere vermek',checks:{verifiedNeed:false,priorityBased:false,transparent:false},misconceptionId:'first-come-only',why:'Erişim güçlüğü yaşayan daha acil ihtiyaçları dışarıda bırakır.',rule:'allocate-by-arrival-only'},
      {key:'c',text:'Dağıtımı kayıt tutmadan tanıdıklara bırakmak',checks:{verifiedNeed:false,priorityBased:false,transparent:false},misconceptionId:'informal-favoritism',why:'İhtiyaç ölçütü ve izlenebilir kayıt yerine kişisel ilişki kullanır.',rule:'distribute-by-personal-network'},
      {key:'d',text:'Önceden yardım alanları kontrol etmeden tekrar listelemek',checks:{verifiedNeed:false,priorityBased:false,transparent:false},misconceptionId:'ignore-duplicate-aid',why:'Sınırlı kaynağın aynı kişilere tekrarlı gitme riskini artırır.',rule:'ignore-prior-assistance'}
    ]},
    {id:'v2',context:'Deprem sonrası geçici barınma alanında sınırlı sayıda ısıtıcı vardır. Sağlık kayıtları bebekli aileler ile kronik hastaların soğuktan daha çok etkilendiğini gösteriyor.',prompt:'Kaynağı adil ve gerekçeli dağıtan yaklaşım hangisidir?',explanation:'Sağlık riskini doğrulayıp öncelik ölçütünü ilan etmek ve teslimleri kaydetmek eşitlikten farklı olarak ihtiyaca dayalı adaleti sağlar.',evidence:['Isıtıcı sayısı sınırlıdır.','Risk grupları sağlık verisiyle belirlenmiştir.','Teslim süreci kaydedilebilir.'],options:[
      {key:'a',text:'Kaynağı sağlık riskine göre önceliklendirip teslimleri kaydetmek',checks:{verifiedNeed:true,priorityBased:true,transparent:true}},
      {key:'b',text:'Kaynağı ihtiyaç bilgisi olmadan kurayla dağıtmak',checks:{verifiedNeed:false,priorityBased:false,transparent:true},misconceptionId:'random-equality',why:'Farklı sağlık risklerini yok sayıp rastgele eşitliği adalet sanır.',rule:'ignore-need-through-lottery'},
      {key:'c',text:'Kaynağı kayıtsız biçimde görevlinin seçimine bırakmak',checks:{verifiedNeed:false,priorityBased:false,transparent:false},misconceptionId:'unchecked-discretion',why:'Ölçüt ve kayıt olmadan kişisel seçime dayanır.',rule:'delegate-to-unchecked-choice'},
      {key:'d',text:'Kaynağı söylentiyle belirlenen risk gruplarına dağıtmak',checks:{verifiedNeed:false,priorityBased:false,transparent:false},misconceptionId:'rumor-based-priority',why:'Önceliği doğrulanmış sağlık bilgisi yerine söylentiyle belirler.',rule:'prioritize-by-rumor'}
    ]}
  ]}),
  civicBlueprint({id:'hs-civic-conflict-resolution',familyId:'hs-civic-conflict-resolution-family',skeletonId:'hs-civic-conflict-resolution:separate-claim-evidence-common-rule',topicId:'social-conflict',learningOutcomeId:'resolve-community-conflict-with-evidence-and-common-rule',criteria:['hearsParties','usesEvidence','sharedRule'],variants:[
    {id:'v1',context:'İki öğrenci grubu aynı çalışma odasını aynı saatte kullanmak istiyor; iki grubun da önceden yaptığı sözlü anlaşmaya ilişkin farklı anlatımı var.',prompt:'Çatışmayı adil biçimde çözen yöntem hangisidir?',explanation:'Tarafları dinleyip mevcut rezervasyon kanıtını incelemek ve bundan sonrası için ortak kayıt kuralı kurmak hem olayı hem tekrarını ele alır.',evidence:['Tarafların anlatımları farklıdır.','Kayıt veya rezervasyon kanıtı aranabilir.','Gelecek için ortak usul gerekir.'],options:[
      {key:'a',text:'Tarafları dinleyip kayıtları inceleyerek ortak rezervasyon kuralı koymak',checks:{hearsParties:true,usesEvidence:true,sharedRule:true}},
      {key:'b',text:'Daha kalabalık grubu otomatik olarak haklı saymak',checks:{hearsParties:false,usesEvidence:false,sharedRule:false},misconceptionId:'majority-as-right',why:'Kanıt ve hak yerine kişi sayısını karar ölçütü yapar.',rule:'equate-majority-with-entitlement'},
      {key:'c',text:'Odayı süresiz kapatıp iki grubu da dışarıda bırakmak',checks:{hearsParties:false,usesEvidence:false,sharedRule:false},misconceptionId:'avoid-by-closure',why:'Çatışmayı çözmek yerine ortak kaynağı ortadan kaldırır.',rule:'replace-resolution-with-closure'},
      {key:'d',text:'İlk şikâyet eden grubun anlatımını kanıt saymak',checks:{hearsParties:false,usesEvidence:false,sharedRule:false},misconceptionId:'first-claim-wins',why:'Diğer tarafı dinlemeden başvuru sırasını doğruluk ölçütü yapar.',rule:'treat-first-claim-as-proof'}
    ]},
    {id:'v2',context:'Mahalle sakinleri pazar yerindeki müzik sesi konusunda anlaşamıyor; esnaf müşteri çektiğini, çevrede yaşayanlar dinlenemediklerini söylüyor.',prompt:'İki tarafın hakkını gözeten çözüm süreci hangisidir?',explanation:'Tarafları dinlemek, saat ve ses ölçümü yapmak, sonra herkese uygulanacak sınır belirlemek iddiaları ortak kanıt ve kurala bağlar.',evidence:['İki tarafın farklı ihtiyacı vardır.','Ses düzeyi ve saat ölçülebilir.','Ortak sınır herkes için öngörülebilir olmalıdır.'],options:[
      {key:'a',text:'Tarafları dinleyip ölçümle ortak saat ve ses sınırı belirlemek',checks:{hearsParties:true,usesEvidence:true,sharedRule:true}},
      {key:'b',text:'Yalnız en yüksek sesle konuşan tarafın isteğini kabul etmek',checks:{hearsParties:false,usesEvidence:false,sharedRule:false},misconceptionId:'loudest-voice-wins',why:'Haklılığı kanıt yerine baskın konuşmayla belirler.',rule:'reward-dominant-voice'},
      {key:'c',text:'Ölçüm yapmadan bütün müzik etkinliklerini yasaklamak',checks:{hearsParties:false,usesEvidence:false,sharedRule:false},misconceptionId:'blanket-ban',why:'Saat ve düzey seçeneklerini değerlendirmeden ölçüsüz yasak kurar.',rule:'ban-without-evidence'},
      {key:'d',text:'Şikâyetleri kaydetmeden tarafların kendiliğinden anlaşmasını beklemek',checks:{hearsParties:false,usesEvidence:false,sharedRule:false},misconceptionId:'passive-delay',why:'Çatışmayı ortak süreç ve kural olmadan erteler.',rule:'replace-mediation-with-waiting'}
    ]}
  ]})
];

export const PREMIUM_HIGHSCHOOL_BLUEPRINT_PACK_P = createPremiumBlueprintPack({
  version:'3.5.0',
  sourceLabel:'Zihin Arenası Premium 9–10. Sınıf Geometri–Anlam–Yurttaşlık Blueprint Bankası',
  blueprints:[...GEOMETRY_BLUEPRINTS,...MEANING_BLUEPRINTS,...CIVIC_BLUEPRINTS]
});

export const PREMIUM_HIGHSCHOOL_GAME_IDS_P = PREMIUM_HIGHSCHOOL_BLUEPRINT_PACK_P.gameIds;
export const generatePremiumHighschoolRoundsP = PREMIUM_HIGHSCHOOL_BLUEPRINT_PACK_P.generate;
export const premiumHighschoolInventoryP = PREMIUM_HIGHSCHOOL_BLUEPRINT_PACK_P.inventory;
export const premiumHighschoolBlueprintReportP = PREMIUM_HIGHSCHOOL_BLUEPRINT_PACK_P.validationReport;
