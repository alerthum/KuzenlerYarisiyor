import { createPremiumBlueprintPack, definePremiumBlueprint } from './premium-blueprint-core.js';
import {
  PREMIUM_DEEP_TRAITS,
  defineCriteriaPremiumBlueprint,
  defineNumericPremiumBlueprint,
  formatPremiumNumber
} from './premium-blueprint-templates.js';

const DEEP = PREMIUM_DEEP_TRAITS;
const formatNumber = formatPremiumNumber;
const numericBlueprint = defineNumericPremiumBlueprint;
const criteriaBlueprint = defineCriteriaPremiumBlueprint;

const MATH_BLUEPRINTS = [
  numericBlueprint({
    id: 'hs-math-linear-equation',
    familyId: 'hs-math-linear-equation-family',
    skeletonId: 'hs-math-linear-equation:isolate-and-substitute',
    topicId: 'linear-equations',
    learningOutcomeId: 'solve-and-verify-two-step-linear-equation',
    solutionClass: 'linear-isolation',
    variants: [
      { id:'v1', a:3, b:6, c:24 },
      { id:'v2', a:4, b:-4, c:20 }
    ],
    formatAnswer: (x) => `x = ${formatNumber(x)}`,
    render: ({a,b,c}) => ({ context:`Bir öğrenci ${a}x ${b >= 0 ? '+' : '−'} ${Math.abs(b)} = ${c} denklemini çözüyor.`, prompt:'Denklemi sağlayan x değeri hangisidir?', hints:['Sabit terimi işaret değiştirerek ayır.','Bulduğun değeri başlangıç denkleminde yerine koy.'] }),
    solve: ({a,b,c}) => (c-b)/a,
    verify: ({a,b,c},x) => Number.isFinite(Number(x)) && Math.abs(a*Number(x)+b-c)<1e-9,
    wrongValues: ({a,b,c},correct) => [
      { id:'unchanged-sign', value:(c+b)/a, why:'Sabit terimi karşı tarafa geçirirken işaretini değiştirmez.', rule:'move-constant-without-sign-change' },
      { id:'skip-division', value:c-b, why:'Sabit terimi ayırdıktan sonra x katsayısına bölme adımını atlar.', rule:'omit-coefficient-division' },
      { id:'flip-answer-sign', value:-correct, why:'Doğru büyüklüğü bulduktan sonra sonucun işaretini gerekçesiz değiştirir.', rule:'flip-final-sign' }
    ],
    explanation: ({a,b,c},x) => `${b >= 0 ? b : `(${b})`} sabit terimi karşı tarafa alınır, ${a}x = ${c-b} elde edilir ve ${a}'e bölünerek x = ${formatNumber(x)} bulunur.`,
    evidence: ({a,b,c},x) => [`Sabit terim ayrıldığında ${a}x = ${c-b} olur.`, `${c-b} sayısı ${a}'e bölünür.`, `Doğrulama: ${a} × ${formatNumber(x)} + (${b}) = ${c}.`]
  }),
  numericBlueprint({
    id: 'hs-math-exponent-product',
    familyId: 'hs-math-exponent-product-family',
    skeletonId: 'hs-math-exponent-product:add-exponents',
    topicId: 'exponents',
    learningOutcomeId: 'apply-product-rule-for-same-base-powers',
    solutionClass: 'same-base-exponent-addition',
    variants: [
      { id:'v1', base:2, m:3, n:4 },
      { id:'v2', base:2, m:3, n:5 }
    ],
    formatAnswer: (x, variant) => `${variant.base}^${x}`,
    render: ({base,m,n}) => ({ context:`${base}^${m} · ${base}^${n} işlemi tek bir üslü ifade olarak yazılacaktır.`, prompt:'Doğru ifade hangisidir?', hints:['Tabanlar aynı olduğunda hangi işlem yapılır?','Sayısal değeri değil, üs kuralını uygula.'] }),
    solve: ({m,n}) => m+n,
    verify: ({base,m,n},e) => Number.isFinite(Number(e)) && Math.pow(base,Number(e)) === Math.pow(base,m)*Math.pow(base,n),
    wrongValues: ({base,m,n}) => [
      { id:'multiply-exponents', value:m*n, why:'Aynı tabanlı kuvvetleri çarparken üsleri toplamak yerine birbiriyle çarpar.', rule:'multiply-exponents' },
      { id:'subtract-exponents', value:m-n, why:'Çarpma işlemini bölme kuralıyla karıştırıp üsleri çıkarır.', rule:'subtract-exponents-as-division' },
      { id:'add-base-to-exponent', value:base+m+n, why:'Tabanı da üs toplamına ekleyerek taban ile üs görevlerini karıştırır.', rule:'include-base-in-exponent-sum' }
    ],
    explanation: ({base,m,n}) => `Tabanlar aynı olduğundan üsler toplanır: ${base}^${m} · ${base}^${n} = ${base}^${m+n}.`,
    evidence: ({base,m,n}) => ['İki kuvvetin tabanı aynıdır.', `Çarpma kuralı üslerin ${m} + ${n} biçiminde toplanmasını gerektirir.`, `Sonuç ${base}^${m+n} olur.`]
  }),
  numericBlueprint({
    id: 'hs-math-function-value',
    familyId: 'hs-math-function-value-family',
    skeletonId: 'hs-math-function-value:substitute-and-evaluate',
    topicId: 'functions',
    learningOutcomeId: 'evaluate-linear-function-at-given-input',
    solutionClass: 'function-substitution',
    variants: [
      { id:'v1', a:2, b:3, t:4 },
      { id:'v2', a:-3, b:10, t:2 }
    ],
    formatAnswer: (x, variant) => `f(${variant.t}) = ${formatNumber(x)}`,
    render: ({a,b,t}) => ({ context:`f(x) = ${a}x ${b >= 0 ? '+' : '−'} ${Math.abs(b)} fonksiyonu veriliyor.`, prompt:`f(${t}) değeri kaçtır?`, hints:['x gördüğün yere verilen girdiyi yaz.','Çarpma işlemini sabit terimden önce yap.'] }),
    solve: ({a,b,t}) => a*t+b,
    verify: ({a,b,t},v) => Number(v) === a*t+b,
    wrongValues: ({a,b,t},correct) => [
      { id:'add-all-symbols', value:a+b+t, why:'Katsayı ile girdiyi çarpmak yerine bütün sayıları toplar.', rule:'add-coefficient-input-constant' },
      { id:'distribute-constant-inside', value:a*(t+b), why:'Sabit terimi yanlışlıkla çarpan parantezinin içine alır.', rule:'multiply-input-plus-constant' },
      { id:'subtract-constant', value:a*t-b, why:'Fonksiyondaki sabit terimin işaretini ters uygular.', rule:'reverse-constant-sign' }
    ],
    explanation: ({a,b,t},v) => `x yerine ${t} yazılır: f(${t}) = ${a} · ${t} + (${b}) = ${formatNumber(v)}.`,
    evidence: ({a,b,t},v) => [`Fonksiyonun girdisi x yerine ${t} konur.`, `${a} · ${t} çarpımı hesaplanır.`, `Sabit terim ${b} eklenerek ${formatNumber(v)} bulunur.`]
  }),
  numericBlueprint({
    id: 'hs-math-sequential-percent',
    familyId: 'hs-math-sequential-percent-family',
    skeletonId: 'hs-math-sequential-percent:multiply-change-factors',
    topicId: 'percent-change',
    learningOutcomeId: 'calculate-successive-percentage-changes',
    solutionClass: 'successive-multiplicative-change',
    variants: [
      { id:'v1', initial:200, inc:20, dec:10 },
      { id:'v2', initial:400, inc:25, dec:20 }
    ],
    formatAnswer: (x) => `${formatNumber(x)} TL`,
    render: ({initial,inc,dec}) => ({ context:`${initial} TL olan bir ürünün fiyatı önce %${inc} artırılıyor, ardından yeni fiyat üzerinden %${dec} indiriliyor.`, prompt:'Son fiyat kaç TL olur?', hints:['İlk değişimden sonraki yeni tabanı bul.','İkinci yüzdesi başlangıç fiyatına değil yeni fiyata uygula.'] }),
    solve: ({initial,inc,dec}) => initial*(1+inc/100)*(1-dec/100),
    verify: ({initial,inc,dec},v) => Math.abs(Number(v)-initial*(1+inc/100)*(1-dec/100))<1e-9,
    wrongValues: ({initial,inc,dec},correct) => [
      { id:'net-percent-addition', value:initial*(1+(inc-dec)/100), why:'Ardışık yüzdeleri aynı taban üzerindeymiş gibi çıkararak birleştirir.', rule:'combine-percentages-additively' },
      { id:'only-discount', value:initial*(1-dec/100), why:'İlk fiyat artışını yok sayıp yalnız indirimi başlangıç fiyatına uygular.', rule:'ignore-first-change' },
      { id:'turn-discount-into-increase', value:initial*(1+inc/100)*(1+dec/100), why:'İndirim oranını ikinci bir artış gibi uygular.', rule:'apply-discount-as-increase' }
    ],
    explanation: ({initial,inc,dec},v) => `Önce ${initial} · ${1+inc/100} hesaplanır; oluşan yeni fiyat ${1-dec/100} ile çarpılır ve ${formatNumber(v)} TL bulunur.`,
    evidence: ({initial,inc,dec},v) => [`Artış sonrası fiyat ${initial*(1+inc/100)} TL'dir.`, `İndirim bu yeni fiyatın %${dec}'i üzerinden hesaplanır.`, `Sonuç ${formatNumber(v)} TL'dir.`]
  }),
  numericBlueprint({
    id: 'hs-math-quadratic-other-root',
    familyId: 'hs-math-quadratic-roots-family',
    skeletonId: 'hs-math-quadratic-roots:use-root-sum-and-check-product',
    topicId: 'quadratic-equations',
    learningOutcomeId: 'find-other-root-using-vieta-relations',
    solutionClass: 'vieta-root-completion',
    variants: [
      { id:'v1', sum:7, product:12, known:3 },
      { id:'v2', sum:9, product:20, known:4 }
    ],
    formatAnswer: (x) => `Diğer kök: ${formatNumber(x)}`,
    render: ({sum,product,known}) => ({ context:`x² − ${sum}x + ${product} = 0 denkleminin köklerinden biri ${known}'tür.`, prompt:'Diğer kök kaçtır?', hints:['Kökler toplamını kullan.','Bulduğun iki kökün çarpımını sabit terimle kontrol et.'] }),
    solve: ({sum,known}) => sum-known,
    verify: ({sum,product,known},other) => Number(known)+Number(other)===sum && Number(known)*Number(other)===product,
    wrongValues: ({sum,product,known},correct) => [
      { id:'add-known-to-sum', value:sum+known, why:'Diğer kökü bulmak için bilinen kökü toplamdan çıkarmak yerine toplar.', rule:'add-known-root-to-sum' },
      { id:'subtract-known-from-product', value:product-known, why:'Kökler toplamı ile çarpımı ilişkilerini karıştırıp sabit terimden çıkarma yapar.', rule:'subtract-root-from-product' },
      { id:'flip-root-sign', value:-correct, why:'Denklemin orta terim işaretini kökün işaretine doğrudan aktarır.', rule:'flip-other-root-sign' }
    ],
    explanation: ({sum,product,known},other) => `Kökler toplamı ${sum} olduğundan diğer kök ${sum} − ${known} = ${other}'tür; ${known} · ${other} = ${product} kontrolü de sağlanır.`,
    evidence: ({sum,product,known},other) => [`Monik ikinci derece denklemde kökler toplamı ${sum}'dur.`, `Diğer kök ${sum} − ${known} = ${other} olarak bulunur.`, `Kökler çarpımı ${known} · ${other} = ${product} ile doğrulanır.`]
  })
];

const PARAGRAPH_BLUEPRINTS = [
  criteriaBlueprint({
    id:'hs-tr-main-idea', gameId:'paragraph-detective', familyId:'hs-tr-main-idea-family', skeletonId:'hs-tr-main-idea:scope-balance', subjectId:'turkish-language-literature', topicId:'main-idea', learningOutcomeId:'identify-main-idea-with-balanced-scope', solutionClass:'balanced-main-idea', criteria:['coversCore','balancedScope'], extraTraits:['semanticSynthesis'],
    variants:[
      { id:'v1', context:'Kentlerde dikilen ağaçlar yalnız gölge sağlamaz; havadaki bazı kirleticileri tutar, yağmur suyunun toprağa geçişini kolaylaştırır ve yazın çevre sıcaklığını düşürür. Ancak tür seçimi ve bakım planı iyi yapılmazsa beklenen yarar azalır.', prompt:'Parçanın ana düşüncesi hangisidir?', explanation:'Doğru seçenek, ağaçların çok yönlü yararını ve bu yararın planlı uygulamaya bağlı olduğunu birlikte kapsar.', evidence:['Parçada üç farklı çevresel yarar sayılır.','Son cümle yararın doğru tür ve bakım planına bağlı olduğunu sınırlar.','Ana düşünce hem yararları hem koşulu dengeli biçimde kapsamalıdır.'], options:[
        {key:'a',text:'Kent ağaçları çevresel yarar sağlar; yararın sürmesi doğru tür ve bakıma bağlıdır.',checks:{coversCore:true,balancedScope:true}},
        {key:'b',text:'Kent ağaçlarının temel yararı yaz günlerinde gölge oluşturmaktır.',checks:{coversCore:false,balancedScope:false},misconceptionId:'narrow-detail',why:'Parçadaki tek bir yararı ana düşünce yerine seçer.',rule:'promote-one-detail-to-main-idea'},
        {key:'c',text:'Kent ağaçları hava kirliliği ve su sorunlarını bakım planından bağımsız çözer.',checks:{coversCore:false,balancedScope:false},misconceptionId:'overgeneralize-benefit',why:'Metindeki sınırlı yararları kesin ve tam çözüm olarak geneller.',rule:'turn-benefit-into-total-solution'},
        {key:'d',text:'Kent ağaçlarının bakım maliyeti çevresel yararlarından daha belirleyicidir.',checks:{coversCore:false,balancedScope:false},misconceptionId:'unsupported-cost',why:'Parçada bulunmayan bir maliyet karşılaştırmasını ana düşünce yapar.',rule:'introduce-unsupported-comparison'} ]},
      { id:'v2', context:'Dijital not alma araçları bilgiyi düzenlemeyi hızlandırabilir. Buna karşılık yalnızca kopyalama yapan öğrenci, bilgiyi kendi cümleleriyle işlemeyebilir. Bu yüzden aracın kendisinden çok, öğrencinin özetleme ve ilişki kurma biçimi öğrenmenin niteliğini belirler.', prompt:'Parçanın ana düşüncesi hangisidir?', explanation:'Metin dijital aracın olası yararını kabul eder; belirleyici unsurun bilgiyi işleme biçimi olduğunu vurgular.', evidence:['İlk cümle dijital aracın hız yararını belirtir.','İkinci cümle kopyalamanın öğrenme riskini gösterir.','Sonuç, öğrenme niteliğini kullanım biçimine bağlar.'], options:[
        {key:'a',text:'Dijital not araçlarının öğrenmeye katkısı, öğrencinin bilgiyi özetleyip ilişkilendirme biçimine bağlıdır.',checks:{coversCore:true,balancedScope:true}},
        {key:'b',text:'Dijital araç kullanan öğrenciler bilgiyi kâğıt kullananlardan daha hızlı ve kalıcı öğrenir.',checks:{coversCore:false,balancedScope:false},misconceptionId:'unsupported-superiority',why:'Metinde yapılmayan araçlar arası kesin üstünlük karşılaştırması kurar.',rule:'invent-medium-superiority'},
        {key:'c',text:'Öğrenme için en doğru yöntem bütün bilgileri değiştirmeden dijital ortama kopyalamaktır.',checks:{coversCore:false,balancedScope:false},misconceptionId:'reverse-warning',why:'Metnin eleştirdiği kopyalama davranışını öneri olarak sunar.',rule:'reverse-explicit-warning'},
        {key:'d',text:'Not alma hızlandığında özetleme ve ilişki kurma becerilerine artık gerek kalmaz.',checks:{coversCore:false,balancedScope:false},misconceptionId:'tool-replaces-thinking',why:'Aracın düşünme süreçlerinin yerini aldığı sonucunu çıkarır.',rule:'replace-cognitive-process-with-tool'} ]}
    ]
  }),
  criteriaBlueprint({
    id:'hs-tr-supported-inference', gameId:'paragraph-detective', familyId:'hs-tr-supported-inference-family', skeletonId:'hs-tr-inference:evidence-bounded', subjectId:'turkish-language-literature', topicId:'inference', learningOutcomeId:'make-bounded-inference-from-explicit-evidence', solutionClass:'bounded-inference', criteria:['supported','noExtra'], extraTraits:['evidenceReasoning'],
    variants:[
      {id:'v1',context:'Bir okulda öğle arası kütüphane kullanım süresi uzatıldı. Sonraki ay ödünç alınan kitap sayısı arttı; ancak öğrencilerin sınav puanlarında belirgin bir değişim görülmedi.',prompt:'Bu bilgilerden çıkarılabilecek en güvenli sonuç hangisidir?',explanation:'Veri kütüphane kullanımındaki düzenleme ile ödünç alma artışını birlikte gösterir; sınav başarısı için ilişki kanıtlamaz.',evidence:['Kütüphane süresi uzatılmıştır.','Ödünç kitap sayısı artmıştır.','Sınav puanları belirgin değişmemiştir.'],options:[
        {key:'a',text:'Uzatılan kütüphane süresi, öğrencilerin kitap ödünç alma olanağını artırmış olabilir.',checks:{supported:true,noExtra:true}},
        {key:'b',text:'Kütüphane süresinin uzaması bütün öğrencilerin sınav başarısını kesin olarak yükseltmiştir.',checks:{supported:false,noExtra:false},misconceptionId:'causal-overclaim',why:'Değişmeyen sınav puanlarına rağmen kesin başarı artışı çıkarır.',rule:'infer-unsupported-causal-success'},
        {key:'c',text:'Ödünç alınan her kitabın öğrenciler tarafından sonuna kadar okunduğu anlaşılmaktadır.',checks:{supported:false,noExtra:false},misconceptionId:'equate-borrowing-reading',why:'Ödünç alma verisini tamamlanmış okuma davranışı sayar.',rule:'convert-borrow-count-to-reading-completion'},
        {key:'d',text:'Öğrenciler ders çalışmayı bırakıp zamanlarının tamamını kütüphanede geçirmeye başlamıştır.',checks:{supported:false,noExtra:false},misconceptionId:'extreme-behavior',why:'Metinde olmayan aşırı bir davranış değişikliği ekler.',rule:'invent-extreme-behavior'} ]},
      {id:'v2',context:'Bir mahallede bisiklet yolu açıldıktan sonra hafta içi bisiklet sayımları yükseldi. Aynı dönemde toplu taşıma kullanımı küçük bir düşüş gösterdi; otomobil trafiği ise hemen hemen aynı kaldı.',prompt:'Bu bilgilerden çıkarılabilecek en güvenli sonuç hangisidir?',explanation:'Veriler bisiklet kullanımının arttığını ve diğer ulaşım türlerindeki değişimin sınırlı olduğunu gösterir.',evidence:['Bisiklet sayımları yükselmiştir.','Toplu taşımada küçük düşüş vardır.','Otomobil trafiği yaklaşık aynı kalmıştır.'],options:[
        {key:'a',text:'Bisiklet kullanımı artmış, otomobil trafiğinde belirgin düşüş görülmemiştir.',checks:{supported:true,noExtra:true}},
        {key:'b',text:'Bisiklet yolu otomobil kullanımını kısa sürede ortadan kaldırmıştır.',checks:{supported:false,noExtra:false},misconceptionId:'ignore-stable-traffic',why:'Yaklaşık aynı kalan otomobil trafiğini yok olmuş gibi yorumlar.',rule:'reverse-stable-measurement'},
        {key:'c',text:'Toplu taşımadaki düşüşün tek nedeni bisiklet yoludur.',checks:{supported:false,noExtra:false},misconceptionId:'single-cause-claim',why:'Eş zamanlı değişimden tek ve kesin neden çıkarır.',rule:'infer-exclusive-cause-from-correlation'},
        {key:'d',text:'Mahallede yaşayan herkes işe bisikletle gitmeye başlamıştır.',checks:{supported:false,noExtra:false},misconceptionId:'population-generalization',why:'Sayım artışını bütün bireylere geneller.',rule:'generalize-count-trend-to-every-person'} ]}
    ]
  }),
  criteriaBlueprint({
    id:'hs-tr-author-purpose', gameId:'paragraph-detective', familyId:'hs-tr-author-purpose-family', skeletonId:'hs-tr-purpose:language-and-structure', subjectId:'turkish-language-literature', topicId:'author-purpose', learningOutcomeId:'infer-author-purpose-from-language-and-structure', solutionClass:'author-purpose', criteria:['matchesPurpose','matchesStructure'], extraTraits:['rhetoricalAnalysis'],
    variants:[
      {id:'v1',context:'Bir ürün satın alırken yalnız fiyat etiketine bakmak yeterli değildir. Enerji tüketimi, onarım süresi ve kullanım ömrü de toplam maliyeti belirler. Bu nedenle tüketici, ilk fiyatla uzun dönem giderlerini birlikte değerlendirmelidir.',prompt:'Yazarın temel amacı hangisidir?',explanation:'Parça ölçütler sunarak okuru daha kapsamlı bir satın alma değerlendirmesine yönlendirir.',evidence:['İlk cümle tek ölçütlü seçimi yetersiz bulur.','Sonraki cümleler ek ölçütleri açıklar.','Son cümle davranış önerisi getirir.'],options:[
        {key:'a',text:'Okuru ürün fiyatıyla birlikte uzun dönem giderlerini değerlendirmeye yönlendirmek.',checks:{matchesPurpose:true,matchesStructure:true}},
        {key:'b',text:'Okura bir ürünün teknik özelliklerini tarafsız biçimde tanıtmak.',checks:{matchesPurpose:false,matchesStructure:false},misconceptionId:'mistake-advice-for-description',why:'Genel karar ilkelerini tek ürün betimlemesi sanır.',rule:'reduce-guidance-to-description'},
        {key:'c',text:'Pahalı ürünlerin kullanım ömrünün daha uzun olduğunu savunmak.',checks:{matchesPurpose:false,matchesStructure:false},misconceptionId:'invent-price-rule',why:'Metinde olmayan kesin fiyat-kalite kuralı çıkarır.',rule:'invent-universal-price-quality-rule'},
        {key:'d',text:'Ürün onarım hizmetlerinin tarihsel gelişimini kronolojik biçimde anlatmak.',checks:{matchesPurpose:false,matchesStructure:false},misconceptionId:'wrong-text-function',why:'Öneri metnini tarihsel anlatım olarak sınıflandırır.',rule:'replace-advice-with-chronology'} ]},
      {id:'v2',context:'Bilimsel bir sonuç tek bir ölçümle değil, benzer koşullarda yinelenen ölçümlerle güçlenir. Tekrarlar arasındaki farklar da saklanmamalı; bu farklar yöntemin güvenilirliği hakkında bilgi verir. Bu yüzden araştırma raporlarında yalnız ortalama değil, dağılım da paylaşılmalıdır.',prompt:'Yazarın temel amacı hangisidir?',explanation:'Parça bilimsel raporlamada tekrar ve dağılım bilgisinin neden gerekli olduğunu açıklayıp bir ilke savunur.',evidence:['Tek ölçümün yetersizliği belirtilir.','Tekrar farklarının bilgi taşıdığı açıklanır.','Raporlarda dağılım paylaşılması önerilir.'],options:[
        {key:'a',text:'Bilimsel raporlarda tekrarlı ölçümlerin ve sonuç dağılımının paylaşılması gerektiğini gerekçelendirmek.',checks:{matchesPurpose:true,matchesStructure:true}},
        {key:'b',text:'Bütün deneylerde aynı sayısal sonucun elde edilmesi gerektiğini ileri sürmek.',checks:{matchesPurpose:false,matchesStructure:false},misconceptionId:'misread-variation-as-error',why:'Farkların bilgi taşıdığı vurgusunu aynı sonuç zorunluluğuna dönüştürür.',rule:'erase-informative-variation'},
        {key:'c',text:'Ortalama hesaplama işleminin tarih boyunca nasıl değiştiğini anlatmak.',checks:{matchesPurpose:false,matchesStructure:false},misconceptionId:'invent-history',why:'Yöntem önerisini tarihsel gelişim anlatısı sanır.',rule:'replace-method-argument-with-history'},
        {key:'d',text:'Tek bir araştırmanın kesin sonucunu kamuoyuna duyurmak.',checks:{matchesPurpose:false,matchesStructure:false},misconceptionId:'mistake-principle-for-result',why:'Genel raporlama ilkesini belirli bir araştırma sonucu sayar.',rule:'replace-general-principle-with-single-result'} ]}
    ]
  }),
  criteriaBlueprint({
    id:'hs-tr-sentence-relation', gameId:'paragraph-detective', familyId:'hs-tr-sentence-relation-family', skeletonId:'hs-tr-relation:proposition-link', subjectId:'turkish-language-literature', topicId:'sentence-relations', learningOutcomeId:'identify-logical-relation-between-sentences', solutionClass:'sentence-relation', criteria:['relationCorrect','directionCorrect'], extraTraits:['discourseReasoning'],
    variants:[
      {id:'v1',context:'(I) Mahallede yağmur suyu depoları kuruldu. (II) Böylece parkların sulanmasında şebeke suyu kullanımı azaldı.',prompt:'İkinci cümlenin birinci cümleyle kurduğu ilişki hangisidir?',explanation:'İkinci cümle, ilk cümledeki uygulamanın ortaya çıkardığı sonucu bildirir.',evidence:['Birinci cümlede uygulama anlatılır.','“Böylece” sözcüğü sonuç bağlantısı kurar.','İkinci cümlede su kullanımındaki azalma verilir.'],options:[
        {key:'a',text:'Birinci cümledeki uygulamanın sonucunu açıklamaktadır.',checks:{relationCorrect:true,directionCorrect:true}},
        {key:'b',text:'Birinci cümledeki düşünceye karşıt bir görüş ileri sürmektedir.',checks:{relationCorrect:false,directionCorrect:false},misconceptionId:'confuse-result-contrast',why:'Sonuç bağlayıcısını karşıtlık ilişkisi sanır.',rule:'replace-result-with-contrast'},
        {key:'c',text:'Birinci cümledeki genel yargıya örnek vermektedir.',checks:{relationCorrect:false,directionCorrect:false},misconceptionId:'confuse-result-example',why:'Uygulamanın etkisini örneklendirme olarak yorumlar.',rule:'replace-result-with-example'},
        {key:'d',text:'Birinci cümledeki bilgiyi koşula bağlayarak sınırlandırmaktadır.',checks:{relationCorrect:false,directionCorrect:false},misconceptionId:'confuse-result-condition',why:'Açık sonuç ilişkisine koşul anlamı yükler.',rule:'replace-result-with-condition'} ]},
      {id:'v2',context:'(I) Güneş panellerinin kurulum maliyeti yüksektir. (II) Buna karşın uzun kullanım süresinde enerji giderini azaltabilir.',prompt:'İkinci cümlenin birinci cümleyle kurduğu ilişki hangisidir?',explanation:'“Buna karşın” ifadesi, ilk cümledeki olumsuz yönün karşısına uzun dönem yararını getirir.',evidence:['İlk cümle yüksek başlangıç maliyetini belirtir.','Bağlayıcı karşıtlık bildirir.','İkinci cümle uzun dönem yararını açıklar.'],options:[
        {key:'a',text:'Birinci cümledeki olumsuz yönün karşısına farklı bir olumlu yön koymaktadır.',checks:{relationCorrect:true,directionCorrect:true}},
        {key:'b',text:'Birinci cümlede verilen maliyetin nedenini ayrıntılandırmaktadır.',checks:{relationCorrect:false,directionCorrect:false},misconceptionId:'confuse-contrast-cause',why:'Karşıtlık bağlayıcısını neden açıklaması sayar.',rule:'replace-contrast-with-cause'},
        {key:'c',text:'Birinci cümledeki yargıyı aynı anlamla tekrar etmektedir.',checks:{relationCorrect:false,directionCorrect:false},misconceptionId:'confuse-contrast-restatement',why:'Farklı yönleri aynı yargının tekrarı kabul eder.',rule:'replace-contrast-with-restatement'},
        {key:'d',text:'Birinci cümledeki görüşün geçersiz olduğunu kanıtlamaktadır.',checks:{relationCorrect:false,directionCorrect:false},misconceptionId:'overstate-contrast-refutation',why:'Dengeleyici karşıtlığı tam çürütme olarak yorumlar.',rule:'turn-contrast-into-refutation'} ]}
    ]
  }),
  criteriaBlueprint({
    id:'hs-tr-evidence-strength', gameId:'paragraph-detective', familyId:'hs-tr-evidence-strength-family', skeletonId:'hs-tr-evidence:direct-relevant-reliable', subjectId:'turkish-language-literature', topicId:'argument-evidence', learningOutcomeId:'select-strongest-evidence-for-claim', solutionClass:'evidence-selection', criteria:['directSupport','reliable'], extraTraits:['argumentEvaluation'],
    variants:[
      {id:'v1',context:'İddia: “Okul bahçesindeki gölgelik alanların artırılması, sıcak günlerde öğrencilerin açık alan kullanımını yükseltir.”',prompt:'Bu iddiayı en güçlü biçimde destekleyecek kanıt hangisidir?',explanation:'Aynı okulda gölgelik öncesi-sonrası kullanım ölçümü, iddiadaki değişkenleri doğrudan ve karşılaştırmalı biçimde sınar.',evidence:['İddia gölgelik miktarı ile açık alan kullanımı arasındaki ilişkiyi kurar.','Güçlü kanıt iki değişkeni aynı ortamda ölçmelidir.','Öncesi-sonrası sayım doğrudan karşılaştırma sağlar.'],options:[
        {key:'a',text:'Gölgelik öncesi ve sonrası sıcak günlerde yapılan öğrenci kullanım sayımları.',checks:{directSupport:true,reliable:true}},
        {key:'b',text:'Gölgelik sonrası bir öğrencinin bahçeyi daha çok kullandığını söylemesi.',checks:{directSupport:false,reliable:false},misconceptionId:'anecdote-as-proof',why:'Tek kişinin tercihini bütün okul kullanımına kanıt sayar.',rule:'replace-systematic-measurement-with-anecdote'},
        {key:'c',text:'Başka bir okulun gölgelik sonrası bahçe kullanımını gösteren fotoğrafları.',checks:{directSupport:false,reliable:false},misconceptionId:'remote-visual-evidence',why:'Farklı ortamın fotoğrafını okul kullanım ölçümü yerine koyar.',rule:'use-unmatched-context-image'},
        {key:'d',text:'Gölgelik malzemelerinin dayanıklılığını karşılaştıran ayrıntılı ürün raporu.',checks:{directSupport:false,reliable:true},misconceptionId:'reliable-but-irrelevant',why:'Güvenilir olabilecek fakat kullanım artışını ölçmeyen bilgiyi seçer.',rule:'choose-reliable-irrelevant-source'} ]},
      {id:'v2',context:'İddia: “Ders sırasında kısa ve planlı hareket araları, öğrencilerin sonraki görevde dikkatini artırır.”',prompt:'Bu iddiayı en güçlü biçimde destekleyecek kanıt hangisidir?',explanation:'Benzer öğrenci gruplarında hareket arası olan ve olmayan derslerin aynı dikkat göreviyle karşılaştırılması iddiayı doğrudan sınar.',evidence:['İddia hareket arası ile sonraki dikkat arasında ilişki kurar.','Karşılaştırmada diğer koşullar benzer tutulmalıdır.','Aynı dikkat görevi ölçülebilir sonuç sağlar.'],options:[
        {key:'a',text:'Hareket arası verilen ve verilmeyen benzer grupların aynı dikkat göreviyle karşılaştırılması.',checks:{directSupport:true,reliable:true}},
        {key:'b',text:'Bir öğretmenin hareket arasının dikkati artıracağını düşündüğünü belirtmesi.',checks:{directSupport:false,reliable:false},misconceptionId:'authority-opinion',why:'Ölçüm yerine tek kişinin genel görüşünü kanıt sayar.',rule:'replace-comparison-with-opinion'},
        {key:'c',text:'Hareket arası yapan öğrencilerin hafta sonu spor etkinliklerinin incelenmesi.',checks:{directSupport:false,reliable:true},misconceptionId:'adjacent-topic-data',why:'Hareket temasına yakın ama ders içi dikkat iddiasını sınamayan veri kullanır.',rule:'choose-related-but-nondiagnostic-data'},
        {key:'d',text:'Hareket arası uygulanan öğrencilerin etkinliği eğlenceli bulup bulmadığının sorulması.',checks:{directSupport:false,reliable:true},misconceptionId:'preference-vs-effect',why:'Beğeni verisini dikkat performansı ölçümüyle karıştırır.',rule:'replace-outcome-measure-with-preference'} ]}
    ]
  }),
  criteriaBlueprint({
    id:'hs-tr-tone', gameId:'paragraph-detective', familyId:'hs-tr-tone-family', skeletonId:'hs-tr-tone:modality-and-word-choice', subjectId:'turkish-language-literature', topicId:'tone', learningOutcomeId:'infer-tone-from-modality-and-word-choice', solutionClass:'tone-inference', criteria:['modalityMatch','emotionMatch'], extraTraits:['pragmaticInference'],
    variants:[
      {id:'v1',context:'Yeni yöntemin ilk sonuçları umut verici görünüyor; ancak örneklem küçük olduğu için daha geniş çalışmalar yapılmadan kesin bir yargıya varmak doğru olmaz.',prompt:'Yazarın tutumu en iyi nasıl tanımlanır?',explanation:'Yazar olumlu işareti kabul ederken veri sınırını vurgular; bu nedenle tutum temkinli iyimserdir.',evidence:['“Umut verici” olumlu beklenti taşır.','“Ancak” ile örneklem sınırı belirtilir.','Kesin yargı ertelenir.'],options:[
        {key:'a',text:'Temkinli ve ölçülü biçimde iyimser.',checks:{modalityMatch:true,emotionMatch:true}},
        {key:'b',text:'Sonucun güvenilirliğinden yüksek ölçüde emin.',checks:{modalityMatch:false,emotionMatch:false},misconceptionId:'ignore-caution',why:'Kesin yargının ertelenmesini yok sayar.',rule:'erase-uncertainty-markers'},
        {key:'c',text:'Yönteme karşı öfkeli ve küçümseyici.',checks:{modalityMatch:false,emotionMatch:false},misconceptionId:'invent-hostility',why:'Metinde bulunmayan sert duyguyu ekler.',rule:'invent-negative-emotion'},
        {key:'d',text:'Konuya karşı ilgisiz ve kayıtsız.',checks:{modalityMatch:false,emotionMatch:false},misconceptionId:'confuse-caution-indifference',why:'Dikkatli değerlendirmeyi ilgisizlik sanır.',rule:'replace-caution-with-indifference'} ]},
      {id:'v2',context:'Proje gecikmiş olabilir, fakat ekip hataları açıkça kaydetmiş ve yeni takvimi gerçekçi verilerle hazırlamıştır. Bu yaklaşım sürerse sonraki aşamada daha güvenilir sonuçlar alınabilir.',prompt:'Yazarın tutumu en iyi nasıl tanımlanır?',explanation:'Gecikme eleştirilmeden kabul edilir; düzeltici adımlar nedeniyle koşullu bir güven ifade edilir.',evidence:['Gecikme olasılığı kabul edilir.','Hataların kaydı ve gerçekçi takvim olumlu görülür.','Olumlu sonuç “bu yaklaşım sürerse” koşuluna bağlanır.'],options:[
        {key:'a',text:'Sorunu kabul eden fakat düzeltici adımlara koşullu güven duyan.',checks:{modalityMatch:true,emotionMatch:true}},
        {key:'b',text:'Gecikmeyi önemsiz sayan ve başarıyı kesin gören.',checks:{modalityMatch:false,emotionMatch:false},misconceptionId:'remove-condition',why:'Koşullu olasılığı kesin başarıya dönüştürür.',rule:'turn-conditional-confidence-into-certainty'},
        {key:'c',text:'Ekibin bütün çalışmalarını değersiz bulan sert bir tutum.',checks:{modalityMatch:false,emotionMatch:false},misconceptionId:'invent-total-condemnation',why:'Düzeltici adımlara verilen değeri yok sayar.',rule:'replace-balanced-view-with-condemnation'},
        {key:'d',text:'Yalnız gecikmenin tarihini bildiren duygusuz bir anlatım.',checks:{modalityMatch:false,emotionMatch:false},misconceptionId:'ignore-evaluation',why:'Metindeki değerlendirme ve beklenti ifadelerini görmez.',rule:'reduce-evaluation-to-date-report'} ]}
    ]
  }),
  criteriaBlueprint({
    id:'hs-tr-paragraph-completion', gameId:'paragraph-detective', familyId:'hs-tr-completion-family', skeletonId:'hs-tr-completion:reference-and-logic', subjectId:'turkish-language-literature', topicId:'paragraph-completion', learningOutcomeId:'complete-paragraph-with-coherent-sentence', solutionClass:'coherent-completion', criteria:['logicalFit','referenceFit'], extraTraits:['coherenceReasoning'],
    variants:[
      {id:'v1',context:'Bir araştırmada yalnız ortalama değeri vermek bazen yanıltıcı olabilir. Çünkü aynı ortalamaya sahip iki veri grubunun dağılımları çok farklı olabilir. _____. Bu nedenle sonuçları yorumlarken dağılım ölçülerine de bakılmalıdır.',prompt:'Boşluğa hangi cümle getirilmelidir?',explanation:'Eksik cümle, aynı ortalamanın farklı dağılımları gizleyebileceğini somutlaştırmalı ve sonuca geçiş hazırlamalıdır.',evidence:['Önce ortalamanın yetersiz kalabileceği söylenir.','Son cümle dağılım ölçülerine bakmayı önerir.','Aradaki cümle dağılım farkının önemini açıklamalıdır.'],options:[
        {key:'a',text:'Biri değerleri ortalamaya yakın toplarken diğeri çok geniş bir aralığa yayabilir.',checks:{logicalFit:true,referenceFit:true}},
        {key:'b',text:'Aynı ortalamaya ulaşmak için veriler eşit aralıklarla sıralanmalıdır.',checks:{logicalFit:false,referenceFit:false},misconceptionId:'invent-procedure',why:'İstatistiksel gerekçeye ilgisiz ve yanlış bir işlem ekler.',rule:'insert-unrelated-false-procedure'},
        {key:'c',text:'Ortalaması aynı veri gruplarında kullanılan ölçüm araçları da aynı olmalıdır.',checks:{logicalFit:false,referenceFit:false},misconceptionId:'topic-drift',why:'Veri dağılımından araç markasına geçerek konu bütünlüğünü bozar.',rule:'shift-to-irrelevant-detail'},
        {key:'d',text:'Bu nedenle ortalama değeri dağılım bilgisi olmadan da yeterli olur.',checks:{logicalFit:false,referenceFit:false},misconceptionId:'overreject-average',why:'Metindeki sınırlı uyarıyı ortalamayı tümden reddetmeye dönüştürür.',rule:'turn-limitation-into-total-rejection'} ]},
      {id:'v2',context:'Bir metindeki kaynağın güvenilir olması, o kaynağın her iddiayı desteklediği anlamına gelmez. Kaynak doğru bilgi içerse bile tartışılan konuyla doğrudan ilişkili olmayabilir. _____. Bu yüzden kanıt seçerken hem güvenilirlik hem de ilgililik birlikte aranmalıdır.',prompt:'Boşluğa hangi cümle getirilmelidir?',explanation:'Eksik cümle, güvenilir fakat ilgisiz kaynağın neden yeterli olmadığını örneklemeli ve iki ölçütlü sonuca bağlanmalıdır.',evidence:['İlk cümle güvenilirlik ile destek gücünü ayırır.','İkinci cümle ilgililik sorununu açıklar.','Son cümle iki ölçütü birlikte ister.'],options:[
        {key:'a',text:'Örneğin güvenilir bir hava raporu, bir eğitim yönteminin başarısını kanıtlamaz.',checks:{logicalFit:true,referenceFit:true}},
        {key:'b',text:'Güvenilir bir kaynak, konu farklı olsa da iddiayı desteklemek için yeterlidir.',checks:{logicalFit:false,referenceFit:false},misconceptionId:'reliability-is-sufficient',why:'Parçanın temel ayrımını tersine çevirir.',rule:'treat-reliability-as-universal-relevance'},
        {key:'c',text:'Kaynağın güvenilirliği, kanıtın tartışılan iddiayla ilişkisini de garanti eder.',checks:{logicalFit:false,referenceFit:false},misconceptionId:'surface-credibility',why:'İçerik ölçütlerini biçimsel görünüşle değiştirir.',rule:'replace-evidence-criteria-with-format'},
        {key:'d',text:'İddia ayrıntılı yazılmışsa ona uzak bir kaynak da güçlü kanıt sayılır.',checks:{logicalFit:false,referenceFit:false},misconceptionId:'length-as-support',why:'Kanıt ilişkisini iddianın uzunluğuna bağlar.',rule:'replace-relevance-with-length'} ]}
    ]
  }),
  criteriaBlueprint({
    id:'hs-tr-assumption', gameId:'paragraph-detective', familyId:'hs-tr-assumption-family', skeletonId:'hs-tr-assumption:necessary-unstated-link', subjectId:'turkish-language-literature', topicId:'argument-assumption', learningOutcomeId:'identify-necessary-unstated-assumption', solutionClass:'necessary-assumption', criteria:['necessary','unstated'], extraTraits:['argumentReconstruction'],
    variants:[
      {id:'v1',context:'“Okul servislerinin güzergâhı yeniden düzenlenmelidir; çünkü bazı öğrenciler ilk derse sürekli geç kalıyor.”',prompt:'Bu gerekçenin sonucu desteklemesi için hangi varsayım gereklidir?',explanation:'Geç kalmanın güzergâh düzeninden kaynaklandığı varsayılmadan güzergâh değişikliği sonucu gerekçeden çıkmaz.',evidence:['Gerekçe öğrencilerin geç kalmasıdır.','Sonuç servis güzergâhını değiştirmektir.','İki önerme arasında güzergâhın gecikmeye etkisi varsayılmalıdır.'],options:[
        {key:'a',text:'Mevcut servis güzergâhı öğrencilerin geç kalmasına katkıda bulunmaktadır.',checks:{necessary:true,unstated:true}},
        {key:'b',text:'Servis kullanan öğrencilerin çoğu ilk derse zamanında gelmektedir.',checks:{necessary:false,unstated:true},misconceptionId:'overbroad-population',why:'Sonuç için bütün öğrencilerin servis kullanması gerekmez.',rule:'add-unnecessary-universal-premise'},
        {key:'c',text:'İlk dersin başlama saati servis kullanan öğrencilerce bilinmektedir.',checks:{necessary:false,unstated:true},misconceptionId:'irrelevant-preference',why:'Dersin sevilmesi güzergâh önerisini desteklemez.',rule:'insert-irrelevant-preference'},
        {key:'d',text:'Servis araçlarının bakım takvimi düzenli biçimde uygulanmaktadır.',checks:{necessary:false,unstated:true},misconceptionId:'irrelevant-feature',why:'Araç rengi gecikme ile güzergâh arasındaki bağı kurmaz.',rule:'insert-irrelevant-object-feature'} ]},
      {id:'v2',context:'“Şirket uzaktan toplantıları azaltmalıdır; çünkü ekip üyeleri yüz yüze görüşmelerde sorunları daha hızlı çözüyor.”',prompt:'Bu gerekçenin sonucu desteklemesi için hangi varsayım gereklidir?',explanation:'Yüz yüze çözüm hızının uzaktan toplantılara göre üstün ve iş açısından önemli olduğu varsayılmalıdır.',evidence:['Gerekçe yüz yüze görüşmelerde daha hızlı çözüm gözlemidir.','Sonuç uzaktan toplantıları azaltmaktır.','Hız farkının toplantı türünden kaynaklandığı ve önemli olduğu varsayılır.'],options:[
        {key:'a',text:'Toplantı biçimi sorun çözme hızını etkiler ve bu fark iş akışı için önemlidir.',checks:{necessary:true,unstated:true}},
        {key:'b',text:'Ekip üyeleri yüz yüze görüşme için aynı binada bulunmaktadır.',checks:{necessary:false,unstated:true},misconceptionId:'unneeded-location',why:'Yüz yüze görüşmenin yararı için aynı binada yaşama zorunlu değildir.',rule:'add-unnecessary-location-premise'},
        {key:'c',text:'Uzaktan toplantılarda kullanılan kameralar benzer teknik özellikler taşımaktadır.',checks:{necessary:false,unstated:true},misconceptionId:'irrelevant-technology-detail',why:'Kamera markası gerekçe ile sonuç arasındaki bağı kurmaz.',rule:'insert-irrelevant-technology-detail'},
        {key:'d',text:'Ekip üyeleri yüz yüze toplantıları uzaktan toplantılardan daha çok sevmektedir.',checks:{necessary:false,unstated:true},misconceptionId:'preference-for-performance',why:'Beğeni, sorun çözme hızı ve öneri için gerekli değildir.',rule:'replace-performance-link-with-preference'} ]}
    ]
  })
];

const SCIENCE_BLUEPRINTS = [
  criteriaBlueprint({
    id:'hs-science-independent-variable', gameId:'science-reasoning', familyId:'hs-science-independent-variable-family', skeletonId:'hs-science-variable:changed-factor', subjectId:'science', topicId:'experimental-variables', learningOutcomeId:'identify-independent-variable-in-controlled-experiment', solutionClass:'independent-variable-identification', criteria:['deliberatelyChanged','singleManipulation'], extraTraits:['experimentalDesign'],
    variants:[
      {id:'v1',context:'Özdeş üç bitki aynı toprak, su miktarı ve sıcaklıkta tutuluyor. Gruplar günde 4, 8 ve 12 saat ışık alıyor; iki hafta sonra boy artışı ölçülüyor.',prompt:'Bu deneyde bağımsız değişken hangisidir?',explanation:'Araştırmacının bilinçli olarak değiştirdiği tek etken günlük ışık süresidir.',evidence:['Toprak, su ve sıcaklık sabit tutulur.','Işık süresi üç düzeyde değiştirilir.','Boy artışı sonuç olarak ölçülür.'],options:[
        {key:'a',text:'Bitkilerin günlük ışık alma süresi.',checks:{deliberatelyChanged:true,singleManipulation:true}},
        {key:'b',text:'İki hafta sonunda ölçülen boy artışı.',checks:{deliberatelyChanged:false,singleManipulation:false},misconceptionId:'dependent-as-independent',why:'Ölçülen sonucu değiştirilen etken sanır.',rule:'swap-dependent-and-independent-variable'},
        {key:'c',text:'Her gruba verilen su miktarı.',checks:{deliberatelyChanged:false,singleManipulation:false},misconceptionId:'control-as-independent',why:'Sabit tutulan kontrol değişkenini bağımsız değişken seçer.',rule:'select-controlled-factor'},
        {key:'d',text:'Deneyin iki hafta sürmesi.',checks:{deliberatelyChanged:false,singleManipulation:false},misconceptionId:'duration-as-variable',why:'Bütün gruplarda aynı olan süreyi değiştirilen etken sayar.',rule:'select-common-duration'} ]},
      {id:'v2',context:'Aynı uzunluk ve kalınlıktaki dört tel farklı maddelerden yapılmıştır. Her tele aynı gerilim uygulanıp geçen akım ölçülüyor.',prompt:'Bu deneyde bağımsız değişken hangisidir?',explanation:'Uzunluk, kalınlık ve gerilim sabitken bilinçli olarak değiştirilen özellik telin yapıldığı maddedir.',evidence:['Tel uzunluğu ve kalınlığı aynıdır.','Gerilim bütün tellere eşit uygulanır.','Tel maddesi gruplar arasında değiştirilir.'],options:[
        {key:'a',text:'Telin yapıldığı madde türü.',checks:{deliberatelyChanged:true,singleManipulation:true}},
        {key:'b',text:'Telden geçen elektrik akımı.',checks:{deliberatelyChanged:false,singleManipulation:false},misconceptionId:'outcome-as-cause',why:'Ölçülen bağımlı sonucu değiştirilen etken sayar.',rule:'select-measured-outcome'},
        {key:'c',text:'Tellere uygulanan gerilim.',checks:{deliberatelyChanged:false,singleManipulation:false},misconceptionId:'constant-as-variable',why:'Bütün gruplarda aynı tutulan gerilimi bağımsız değişken seçer.',rule:'select-fixed-input'},
        {key:'d',text:'Tellerin ortak uzunluğu.',checks:{deliberatelyChanged:false,singleManipulation:false},misconceptionId:'geometry-control',why:'Sabit geometrik özelliği değişen etken olarak yorumlar.',rule:'select-fixed-geometry'} ]}
    ]
  }),
  definePremiumBlueprint({
    id:'hs-science-rate-from-data', gameId:'science-reasoning', familyId:'hs-science-rate-family', skeletonId:'hs-science-rate:delta-over-time', reasoningPathId:'read-endpoints-compute-change-divide-time', subjectId:'science', topicId:'data-analysis', learningOutcomeId:'calculate-average-rate-from-measurement-table', gradeBand:'9-10', difficulty:4, cognitiveTraits:[...DEEP,'quantitativeReasoning'], reasoningStepCount:3, solutionClass:'average-rate',
    variants:[
      {id:'v1',startTime:1,endTime:5,startValue:10,endValue:30,unit:'cm',timeUnit:'s'},
      {id:'v2',startTime:2,endTime:8,startValue:14,endValue:44,unit:'°C',timeUnit:'dk'}
    ],
    render: ({startTime,endTime,startValue,endValue,unit,timeUnit}) => ({context:`Bir ölçümde ${startTime} ${timeUnit} anında değer ${startValue} ${unit}, ${endTime} ${timeUnit} anında ${endValue} ${unit} olarak kaydediliyor.`,prompt:'Bu aralıktaki ortalama değişim hızı kaçtır?',hints:['Önce değer değişimini bul.','Değişimi geçen süreye böl.']}),
    solve: ({startTime,endTime,startValue,endValue}) => (endValue-startValue)/(endTime-startTime),
    verify: ({startTime,endTime,startValue,endValue},v) => Math.abs(Number(v)-(endValue-startValue)/(endTime-startTime))<1e-9,
    formatAnswer: (v,variant)=>`${formatNumber(v)} ${variant.unit}/${variant.timeUnit}`,
    buildDistractors: (variant,correct)=>[
      {value:(variant.endValue-variant.startValue)/variant.endTime,text:`${formatNumber((variant.endValue-variant.startValue)/variant.endTime)} ${variant.unit}/${variant.timeUnit}`,misconceptionId:'hs-science-rate:divide-by-end-time',why:'Geçen süre yerine yalnız son zaman değerine böler.',constructionRule:'divide-change-by-endpoint-time'},
      {value:(variant.endTime-variant.startTime)/(variant.endValue-variant.startValue),text:`${formatNumber((variant.endTime-variant.startTime)/(variant.endValue-variant.startValue))} ${variant.unit}/${variant.timeUnit}`,misconceptionId:'hs-science-rate:invert-ratio',why:'Değer değişimi ile zaman değişiminin oranını ters kurar.',constructionRule:'invert-rate-ratio'},
      {value:correct+variant.startValue,text:`${formatNumber(correct+variant.startValue)} ${variant.unit}/${variant.timeUnit}`,misconceptionId:'hs-science-rate:add-initial',why:'Hız hesabına başlangıç değerini yeniden ekler.',constructionRule:'add-initial-value-to-rate'}
    ],
    buildExplanation: (variant,v)=>`Değer değişimi ${variant.endValue-variant.startValue} ${variant.unit}, süre ${variant.endTime-variant.startTime} ${variant.timeUnit} olduğundan ortalama hız ${formatNumber(v)} ${variant.unit}/${variant.timeUnit} olur.`,
    buildEvidence: (variant,v)=>[`Son değerden başlangıç değeri çıkarılır: ${variant.endValue}-${variant.startValue}=${variant.endValue-variant.startValue}.`,`Geçen süre ${variant.endTime}-${variant.startTime}=${variant.endTime-variant.startTime} ${variant.timeUnit} olur.`,`Değişim süreye bölünerek ${formatNumber(v)} ${variant.unit}/${variant.timeUnit} bulunur.`]
  }),
  criteriaBlueprint({
    id:'hs-science-claim-evidence', gameId:'science-reasoning', familyId:'hs-science-claim-family', skeletonId:'hs-science-claim:data-bounded', subjectId:'science', topicId:'claim-evidence', learningOutcomeId:'select-claim-supported-by-data', solutionClass:'data-supported-claim', criteria:['consistentWithAllData','noCausalOverreach'], extraTraits:['scientificArgumentation'],
    variants:[
      {id:'v1',context:'Üç sıcaklıkta enzim etkinliği ölçülüyor: 20 °C’de 12 birim, 35 °C’de 28 birim, 60 °C’de 4 birim.',prompt:'Verilerle en iyi desteklenen ifade hangisidir?',explanation:'Ölçülen aralıkta etkinlik 35 °C’ye kadar artmış, 60 °C’de belirgin biçimde azalmıştır; bunun dışındaki nedenler ölçülmemiştir.',evidence:['20 °C’den 35 °C’ye etkinlik artar.','35 °C’den 60 °C’ye etkinlik azalır.','Veri yalnız üç sıcaklık noktasını kapsar.'],options:[
        {key:'a',text:'Ölçülen sıcaklıklar içinde en yüksek enzim etkinliği 35 °C’de görülmüştür.',checks:{consistentWithAllData:true,noCausalOverreach:true}},
        {key:'b',text:'Enzim etkinliği sıcaklık arttıkça her koşulda sürekli yükselir.',checks:{consistentWithAllData:false,noCausalOverreach:false},misconceptionId:'ignore-high-temperature-drop',why:'60 °C’deki düşüşü yok sayar ve ölçüm aralığını geneller.',rule:'extrapolate-monotonic-trend'},
        {key:'c',text:'60 °C enzimin yapısını kesin olarak bütünüyle bozmuştur.',checks:{consistentWithAllData:false,noCausalOverreach:false},misconceptionId:'mechanism-without-measurement',why:'Etkinlik düşüşünden ölçülmeyen kesin bir yapısal mekanizma çıkarır.',rule:'infer-unmeasured-mechanism'},
        {key:'d',text:'20 °C ile 60 °C arasında enzim etkinliği değişmemiştir.',checks:{consistentWithAllData:false,noCausalOverreach:true},misconceptionId:'ignore-data-difference',why:'12 ve 4 birim arasındaki farkı yok sayar.',rule:'treat-different-values-as-equal'} ]},
      {id:'v2',context:'Bir çözeltinin pH değeri saatlere göre 7,0; 6,6; 6,2; 5,9 olarak ölçülüyor. Ölçümler aynı cihazla ve eşit aralıklarla yapılıyor.',prompt:'Verilerle en iyi desteklenen ifade hangisidir?',explanation:'pH değerleri her ölçümde azalmıştır; veri asitleşme eğilimini gösterir fakat nedenini tek başına belirlemez.',evidence:['Dört değer sırayla düşmektedir.','Ölçüm koşulları aynıdır.','Nedene ilişkin ayrı bir değişken ölçülmemiştir.'],options:[
        {key:'a',text:'Çözeltinin pH değeri ölçüm süresince düzenli biçimde azalmıştır.',checks:{consistentWithAllData:true,noCausalOverreach:true}},
        {key:'b',text:'pH düşüşünün ortam sıcaklığındaki artıştan kaynaklandığı anlaşılmaktadır.',checks:{consistentWithAllData:false,noCausalOverreach:false},misconceptionId:'invent-unmeasured-cause',why:'Sıcaklık ölçülmediği hâlde tek neden ilan eder.',rule:'assign-unmeasured-exclusive-cause'},
        {key:'c',text:'Çözeltinin pH değeri ölçüm boyunca yaklaşık aynı düzeyde kalmıştır.',checks:{consistentWithAllData:false,noCausalOverreach:true},misconceptionId:'ignore-sequential-decrease',why:'Açık sayısal düşüşü görmez.',rule:'flatten-changing-series'},
        {key:'d',text:'Azalma eğilimine göre sonraki pH değerinin 5,5 olması beklenmektedir.',checks:{consistentWithAllData:false,noCausalOverreach:false},misconceptionId:'exact-extrapolation',why:'Kısa eğilimden kesin tek bir gelecek değer çıkarır.',rule:'extrapolate-exact-future-value'} ]}
    ]
  }),
  criteriaBlueprint({
    id:'hs-science-confound', gameId:'science-reasoning', familyId:'hs-science-confound-family', skeletonId:'hs-science-confound:alternative-cause', subjectId:'science', topicId:'experimental-design', learningOutcomeId:'identify-confounding-variable-that-blocks-causal-inference', solutionClass:'confound-identification', criteria:['variesWithTreatment','canAffectOutcome'], extraTraits:['causalReasoning'],
    variants:[
      {id:'v1',context:'Yeni gübrenin etkisini inceleyen araştırmacı, gübre verilen bitkileri pencere önüne; gübre verilmeyenleri odanın arka kısmına koyuyor. Dört hafta sonra ilk grup daha uzun çıkıyor.',prompt:'Hangi durum gübrenin etkisi hakkında kesin sonuca varmayı engeller?',explanation:'Işık miktarı gübre uygulamasıyla birlikte değişmiş ve bitki büyümesini etkileyebileceği için alternatif neden oluşturmuştur.',evidence:['Gruplar farklı ışık konumlarındadır.','Işık bitki büyümesini etkileyebilir.','Gübre ve ışık etkileri birbirinden ayrılamaz.'],options:[
        {key:'a',text:'Gübre verilen bitkilerin daha fazla ışık alması.',checks:{variesWithTreatment:true,canAffectOutcome:true}},
        {key:'b',text:'Gübre verilen ve verilmeyen bitkilerin boylarının aynı cetvelle ölçülmesi.',checks:{variesWithTreatment:false,canAffectOutcome:false},misconceptionId:'measurement-as-confound',why:'Ortak ölçüm yöntemini grupları ayıran neden sanır.',rule:'treat-common-measurement-as-confound'},
        {key:'c',text:'Gübre verilen ve verilmeyen bitkilerin dört hafta boyunca izlenmesi.',checks:{variesWithTreatment:false,canAffectOutcome:false},misconceptionId:'common-duration',why:'Bütün gruplara uygulanan ortak süreyi karıştırıcı değişken seçer.',rule:'select-shared-duration'},
        {key:'d',text:'Gübre verilen ve verilmeyen bitkilerin sonuçlarının aynı tabloya kaydedilmesi.',checks:{variesWithTreatment:false,canAffectOutcome:false},misconceptionId:'recording-method',why:'Veri kaydını büyümeyi etkileyen koşul gibi yorumlar.',rule:'select-recording-procedure'} ]},
      {id:'v2',context:'Bir öğretim uygulamasını karşılaştıran çalışmada yeni yöntemi kullanan sınıfa deneyimli bir öğretmen, eski yöntemi kullanan sınıfa göreve yeni başlayan bir öğretmen ders veriyor. Dönem sonunda ilk sınıfın puanı daha yüksek çıkıyor.',prompt:'Hangi durum yöntem etkisi hakkında kesin sonuca varmayı engeller?',explanation:'Öğretmen deneyimi yöntemle birlikte değiştiği ve başarıyı etkileyebildiği için iki etkinin ayrılması mümkün değildir.',evidence:['Sınıflar farklı yöntem kullanır.','Öğretmen deneyimleri de farklıdır.','Puan farkı yöntemden veya deneyimden kaynaklanabilir.'],options:[
        {key:'a',text:'Sınıflardaki öğretmen deneyiminin farklı olması.',checks:{variesWithTreatment:true,canAffectOutcome:true}},
        {key:'b',text:'İki sınıfa dönem sonunda aynı sınavın uygulanması.',checks:{variesWithTreatment:false,canAffectOutcome:false},misconceptionId:'shared-test',why:'İki gruba da uygulanan ortak ölçümü karıştırıcı etken sanır.',rule:'select-common-outcome-measure'},
        {key:'c',text:'İki sınıfın puanlarının aynı ölçekte kaydedilmesi.',checks:{variesWithTreatment:false,canAffectOutcome:false},misconceptionId:'numeric-recording',why:'Kayıt biçimini başarı farkının nedeni olarak seçer.',rule:'select-data-format'},
        {key:'d',text:'İki sınıftaki çalışmanın aynı dönem boyunca sürmesi.',checks:{variesWithTreatment:false,canAffectOutcome:false},misconceptionId:'common-study-length',why:'Gruplar için aynı olan süreyi karıştırıcı değişken sayar.',rule:'select-shared-study-duration'} ]}
    ]
  }),
  criteriaBlueprint({
    id:'hs-science-model-limit', gameId:'science-reasoning', familyId:'hs-science-model-limit-family', skeletonId:'hs-science-model-limit:scope-and-assumptions', subjectId:'science', topicId:'scientific-models', learningOutcomeId:'identify-conclusion-limited-by-model-assumptions', solutionClass:'model-limitation', criteria:['withinScope','respectsAssumptions'], extraTraits:['modelEvaluation'],
    variants:[
      {id:'v1',context:'Bir hücre zarını anlatmak için yalnız fosfolipitlerden oluşan iki boyutlu bir model kullanılıyor. Modelde proteinler, karbonhidratlar ve zar hareketleri gösterilmiyor.',prompt:'Bu modelle ilgili en doğru değerlendirme hangisidir?',explanation:'Model fosfolipitlerin çift tabaka düzenini gösterebilir; eksik bileşenler nedeniyle gerçek zarın bütün işlevlerini açıklayamaz.',evidence:['Model yalnız fosfolipit içerir.','Gerçek zarda başka bileşenler ve hareket vardır.','Sonuç modelin temsil ettiği yapıyla sınırlı olmalıdır.'],options:[
        {key:'a',text:'Model çift tabakayı gösterir; zarın tüm bileşen ve işlevlerini göstermez.',checks:{withinScope:true,respectsAssumptions:true}},
        {key:'b',text:'Modelde görünmeyen proteinler gerçek hücre zarında da yer almaz.',checks:{withinScope:false,respectsAssumptions:false},misconceptionId:'model-equals-reality',why:'Modeldeki eksikliği gerçek sistemin yokluğu sayar.',rule:'equate-model-omission-with-real-absence'},
        {key:'c',text:'İki boyutlu model gerçek zarın hareketlerini eksiksiz biçimde açıklar.',checks:{withinScope:false,respectsAssumptions:false},misconceptionId:'ignore-dimensional-limit',why:'Boyut ve bileşen sınırlamalarını yok sayar.',rule:'claim-complete-dynamic-representation'},
        {key:'d',text:'Eksik bileşenler nedeniyle model hücre zarı hakkında bilgi veremez.',checks:{withinScope:false,respectsAssumptions:false},misconceptionId:'reject-limited-model',why:'Sınırlı temsil ile değersiz temsil arasındaki farkı göremez.',rule:'turn-limitation-into-total-uselessness'} ]},
      {id:'v2',context:'Bir iklim modeli yalnız sıcaklık ve yağış verilerini kullanıyor; rüzgâr, arazi örtüsü ve okyanus akıntıları modele eklenmiyor.',prompt:'Bu modelle ilgili en doğru değerlendirme hangisidir?',explanation:'Model iki değişkenin eğilimlerini inceleyebilir; dışarıda bırakılan etkenler nedeniyle bölgesel iklimi bütünüyle açıklayamaz.',evidence:['Model iki veri türünü içerir.','Üç önemli etken dışarıda bırakılmıştır.','Çıkarım yalnız model kapsamındaki ilişkilerle sınırlandırılmalıdır.'],options:[
        {key:'a',text:'Model sıcaklık ve yağış eğilimlerini inceleyebilir, ancak bölgesel iklimin bütün nedenlerini kapsamaz.',checks:{withinScope:true,respectsAssumptions:true}},
        {key:'b',text:'Modelde rüzgâr olmadığı için gerçek bölgede de rüzgâr etkisi yoktur.',checks:{withinScope:false,respectsAssumptions:false},misconceptionId:'omission-as-absence',why:'Modele alınmayan etkeni gerçek dünyada yok kabul eder.',rule:'treat-unmodeled-factor-as-nonexistent'},
        {key:'c',text:'İki değişken kullanılması gelecekteki bütün iklim değerlerini kesinleştirir.',checks:{withinScope:false,respectsAssumptions:false},misconceptionId:'certainty-from-simple-model',why:'Sınırlı modelden eksiksiz ve kesin tahmin çıkarır.',rule:'claim-total-certainty-from-partial-model'},
        {key:'d',text:'Eksik değişkenler bulunduğu için sıcaklık ve yağış verileri de anlamsızdır.',checks:{withinScope:false,respectsAssumptions:false},misconceptionId:'discard-valid-components',why:'Model sınırlılığını içerdiği verilerin tümünü değersiz saymaya dönüştürür.',rule:'reject-all-information-due-to-omissions'} ]}
    ]
  })
];

export const PREMIUM_HIGHSCHOOL_BLUEPRINT_PACK_N = createPremiumBlueprintPack({
  version: '3.3.0',
  sourceLabel: 'Zihin Arenası Premium 9–10. Sınıf Doğrulanmış Blueprint Bankası',
  blueprints: [...MATH_BLUEPRINTS, ...PARAGRAPH_BLUEPRINTS, ...SCIENCE_BLUEPRINTS]
});

export const PREMIUM_HIGHSCHOOL_GAME_IDS_N = PREMIUM_HIGHSCHOOL_BLUEPRINT_PACK_N.gameIds;
export const generatePremiumHighschoolRoundsN = PREMIUM_HIGHSCHOOL_BLUEPRINT_PACK_N.generate;
export const premiumHighschoolInventoryN = PREMIUM_HIGHSCHOOL_BLUEPRINT_PACK_N.inventory;
export const premiumHighschoolBlueprintReportN = PREMIUM_HIGHSCHOOL_BLUEPRINT_PACK_N.validationReport;
