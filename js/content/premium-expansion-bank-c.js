import { createPremiumChoicePack, definePremiumChoice } from './premium-question-core.js';

const HARD = ['multiStepInference', 'conditionEvaluation', 'informationLinking'];

const PATTERN_ITEMS = [
  definePremiumChoice({
    id:'pattern-alternating-ops-01',gameId:'pattern-lab',familyId:'premium-pattern-alternating',skeletonId:'premium-pattern-alternating:add-multiply',subjectId:'mathematics',topicId:'number-patterns',learningOutcomeId:'infer-alternating-operation-rule',
    context:'Bir sayı dizisi 3, 6, 8, 16, 18, 36 biçiminde ilerliyor.',prompt:'Aynı kurala göre sıradaki sayı kaçtır?',answer:'38',
    distractors:[
      {text:'72',misconceptionId:'pattern:repeat-last-operation',why:'Son adımda yapılan ikiyle çarpma işlemini sıradaki adımda da yineler.',constructionRule:'repeat-most-recent-operation'},
      {text:'40',misconceptionId:'pattern:add-growing-even',why:'Diziyi dönüşümlü işlem yerine artan çift sayılar eklenen bir örüntü gibi yorumlar.',constructionRule:'replace-alternation-with-growing-difference'},
      {text:'37',misconceptionId:'pattern:add-one-after-double',why:'Çarpma adımlarından sonra 2 eklenmesi gerektiğini fark etmez ve 1 ekler.',constructionRule:'misread-additive-step'}
    ],explanation:'İşlemler sırayla ×2, +2 biçiminde tekrarlanır. 18×2=36’dan sonra 36+2=38 gelir.',cognitiveTraits:[...HARD,'ruleInduction'],reasoningStepCount:3,evidence:['3→6 ve 8→16 adımları ×2’dir.','6→8 ve 16→18 adımları +2’dir.','36’dan sonra +2 uygulanır.']
  }),
  definePremiumChoice({
    id:'pattern-second-difference-01',gameId:'pattern-lab',familyId:'premium-pattern-differences',skeletonId:'premium-pattern-differences:growing-odd',subjectId:'mathematics',topicId:'number-patterns',learningOutcomeId:'infer-pattern-from-successive-differences',
    context:'Bir dizinin ilk terimleri 4, 7, 12, 19, 28 şeklindedir.',prompt:'Dizinin bir sonraki terimi hangisidir?',answer:'39',
    distractors:[
      {text:'37',misconceptionId:'pattern:continue-last-difference',why:'Son fark olan 9’u tekrar ekler; farkların 2’şer arttığını görmez.',constructionRule:'freeze-last-difference'},
      {text:'40',misconceptionId:'pattern:increase-difference-by-three',why:'3, 5, 7, 9 farklarını 12 ile sürdürür.',constructionRule:'wrong-second-difference'},
      {text:'36',misconceptionId:'pattern:treat-as-square-offset',why:'Terimleri yaklaşık kare sayılarla eşleştirip düzenli fark zincirini terk eder.',constructionRule:'fit-nearby-square-pattern'}
    ],explanation:'Ardışık farklar 3, 5, 7, 9’dur. Sonraki fark 11 olacağından 28+11=39’dur.',cognitiveTraits:[...HARD,'differenceAnalysis'],reasoningStepCount:3,evidence:['Ardışık farklar hesaplanır.','Farkların 2 arttığı görülür.','Sonraki fark 11 ve terim 39 olur.']
  }),
  definePremiumChoice({
    id:'pattern-interleaved-01',gameId:'pattern-lab',familyId:'premium-pattern-interleaved',skeletonId:'premium-pattern-interleaved:two-subsequences',subjectId:'mathematics',topicId:'number-patterns',learningOutcomeId:'separate-interleaved-subsequences',
    context:'Bir dizide 2, 15, 4, 12, 8, 9, 16, ... sayıları yer alıyor.',prompt:'Boş bırakılan yere hangi sayı gelmelidir?',answer:'6',
    distractors:[
      {text:'24',misconceptionId:'pattern:continue-even-position-rule-on-wrong-slot',why:'Sıradaki konumu tek ve çift sıralarına ayırmadan 16’ya 8 ekler.',constructionRule:'extend-local-difference-only'},
      {text:'18',misconceptionId:'pattern:continue-doubling-only',why:'2, 4, 8, 16 alt dizisini fark eder fakat sorulan yerin diğer alt diziye ait olduğunu kaçırır.',constructionRule:'use-wrong-interleaved-subsequence'},
      {text:'7',misconceptionId:'pattern:decrease-by-two',why:'15, 12, 9 alt dizisindeki azalmayı 3 yerine 2 kabul eder.',constructionRule:'misread-second-subsequence-step'}
    ],explanation:'Tek sıralardaki terimler 2, 4, 8, 16 diye iki katına çıkar. Çift sıralardaki terimler 15, 12, 9, 6 diye 3 azalır.',cognitiveTraits:[...HARD,'representationTransform'],reasoningStepCount:3,evidence:['Terimler tek ve çift konumlara ayrılır.','Çift konum dizisi 15,12,9 biçimindedir.','Bir sonraki çift konum terimi 6’dır.']
  }),
  definePremiumChoice({
    id:'pattern-recursive-sum-01',gameId:'pattern-lab',familyId:'premium-pattern-recursive',skeletonId:'premium-pattern-recursive:sum-previous-two',subjectId:'mathematics',topicId:'recursive-patterns',learningOutcomeId:'apply-two-term-recursive-rule',
    context:'Bir sayı dizisi 2, 3, 5, 8, 13, 21 biçiminde ilerliyor.',prompt:'Aynı kuralla sonraki terim hangisidir?',answer:'34',
    distractors:[
      {text:'29',misconceptionId:'pattern:add-last-difference',why:'Son iki terimin toplamı yerine son fark olan 8’i ekler.',constructionRule:'continue-last-difference'},
      {text:'42',misconceptionId:'pattern:double-last-term',why:'Artışların büyüdüğünü görüp son terimi ikiyle çarpar.',constructionRule:'replace-recursion-with-doubling'},
      {text:'33',misconceptionId:'pattern:add-preceding-minus-one',why:'21+13 toplamını yaparken bir eksiltir ve kuralı yaklaşık uygular.',constructionRule:'off-by-one-recursive-sum'}
    ],explanation:'Her terim kendinden önceki iki terimin toplamıdır. 13+21=34 olur.',cognitiveTraits:[...HARD,'recursiveReasoning'],reasoningStepCount:2,evidence:['5=2+3, 8=3+5 ve 13=5+8 ilişkileri doğrulanır.','Son iki terim 13 ve 21 toplanır.']
  }),
  definePremiumChoice({
    id:'pattern-table-rule-01',gameId:'pattern-lab',familyId:'premium-pattern-function',skeletonId:'premium-pattern-function:input-output',subjectId:'mathematics',topicId:'functional-patterns',learningOutcomeId:'infer-input-output-rule',
    context:'Bir makine 1 sayısını 5’e, 2 sayısını 8’e, 4 sayısını 14’e ve 6 sayısını 20’ye dönüştürüyor.',prompt:'Aynı makine 9 sayısını hangi sayıya dönüştürür?',answer:'29',
    distractors:[
      {text:'27',misconceptionId:'pattern:multiply-by-three-only',why:'Çıktının 3x+2 olduğunu değil yalnız 3x olduğunu varsayar.',constructionRule:'omit-constant-term'},
      {text:'32',misconceptionId:'pattern:add-five-after-triple',why:'İlk 1→5 örneğini x+4 gibi yorumlayıp sabit farkı yanlış geneller.',constructionRule:'infer-wrong-affine-constant'},
      {text:'23',misconceptionId:'pattern:add-growing-even',why:'Girdiler arasındaki sıçramaları çıktı farklarına doğrudan taşır.',constructionRule:'transfer-input-gap-as-output-rule'}
    ],explanation:'Her eşleşmede çıktı 3×girdi+2’dir. 9 için 3×9+2=29 bulunur.',cognitiveTraits:[...HARD,'algebraicGeneralization'],reasoningStepCount:3,evidence:['1→5 ve 2→8 eşleşmeleri 3x+2 ile sağlanır.','4→14 ve 6→20 aynı kuralı doğrular.','x=9 için sonuç 29’dur.']
  }),
  definePremiumChoice({
    id:'pattern-matchsticks-01',gameId:'pattern-lab',familyId:'premium-pattern-visual-growth',skeletonId:'premium-pattern-visual-growth:shared-edge-squares',subjectId:'mathematics',topicId:'geometric-patterns',learningOutcomeId:'model-shared-edge-growth',
    context:'Yan yana dizilen karelerden oluşan bir modelde 1 kare için 4, 2 kare için 7, 3 kare için 10 çubuk kullanılıyor. Komşu kareler bir kenarı ortak kullanıyor.',prompt:'8 karelik model için kaç çubuk gerekir?',answer:'25',
    distractors:[
      {text:'32',misconceptionId:'pattern:ignore-shared-edges',why:'Her kareyi bağımsız sayıp 8×4 yapar.',constructionRule:'count-all-sides-separately'},
      {text:'22',misconceptionId:'pattern:start-growth-from-one',why:'İlk kareyi 1 çubuk kabul edip her yeni kareye 3 ekler.',constructionRule:'wrong-initial-value'},
      {text:'28',misconceptionId:'pattern:add-four-per-square',why:'Ortak kenarı yalnız bazı adımlarda hesaba katar ve her yeni kareyi 4 çubukla büyütür.',constructionRule:'partial-shared-edge-accounting'}
    ],explanation:'İlk kare 4 çubuktur; her yeni kare ortak kenar nedeniyle 3 çubuk ekler. 4+7×3=25 olur.',cognitiveTraits:[...HARD,'modelReasoning'],reasoningStepCount:3,evidence:['Artışlar 4→7→10 arasında 3’tür.','8 kare için ilk kareden sonra 7 yeni kare vardır.','4+21=25.']
  }),
  definePremiumChoice({
    id:'pattern-digit-cycle-01',gameId:'pattern-lab',familyId:'premium-pattern-cycles',skeletonId:'premium-pattern-cycles:units-digit',subjectId:'mathematics',topicId:'cyclic-patterns',learningOutcomeId:'use-cycle-length-to-find-distant-term',
    context:'7’nin pozitif tam sayı kuvvetlerinin birler basamağı 7, 9, 3, 1 biçiminde tekrar eden bir döngü oluşturur.',prompt:'7 üzeri 2026 sayısının birler basamağı kaçtır?',answer:'9',
    distractors:[
      {text:'7',misconceptionId:'pattern:use-remainder-zero-as-first',why:'2026’yı 4’e bölerken kalan 2’yi dikkate almaz ve döngünün ilk elemanını seçer.',constructionRule:'ignore-cycle-remainder'},
      {text:'3',misconceptionId:'pattern:off-by-one-cycle-index',why:'Kalan 2 olduğu hâlde döngünün üçüncü elemanını seçer.',constructionRule:'shift-cycle-index-forward'},
      {text:'1',misconceptionId:'pattern:choose-cycle-end-for-large-exponent',why:'Büyük üslerin döngünün son elemanına götüreceğini varsayar.',constructionRule:'default-to-cycle-terminal'}
    ],explanation:'Döngü uzunluğu 4’tür. 2026’nın 4 ile bölümünden kalan 2 olduğundan döngünün ikinci elemanı 9 seçilir.',cognitiveTraits:[...HARD,'modularReasoning'],reasoningStepCount:3,evidence:['Birler basamağı döngüsü dört terimlidir.','2026=4×506+2.','Kalan 2, döngünün ikinci elemanı 9’u gösterir.']
  }),
  definePremiumChoice({
    id:'pattern-error-term-01',gameId:'pattern-lab',familyId:'premium-pattern-error-detection',skeletonId:'premium-pattern-error-detection:one-wrong-term',subjectId:'mathematics',topicId:'number-patterns',learningOutcomeId:'identify-term-breaking-rule',
    context:'Bir öğrenci “her terim öncekinin iki katının 1 fazlasıdır” kuralına göre 2, 5, 11, 23, 45, 95 dizisini yazıyor.',prompt:'Kurala uymayan ilk terim hangisidir?',answer:'45',
    distractors:[
      {text:'23',misconceptionId:'pattern:check-by-differences-only',why:'Artan farklara bakıp 11’den sonraki değişimi yanlış değerlendirir.',constructionRule:'use-difference-pattern-instead-of-rule'},
      {text:'95',misconceptionId:'pattern:flag-downstream-term-only',why:'45 hatasından sonra hesaplanan 95’i ilk hata sanır.',constructionRule:'identify-consequence-not-source'},
      {text:'11',misconceptionId:'pattern:apply-plus-two',why:'5×2+1=11 ilişkisini yanlış hesaplayıp doğru terimi eler.',constructionRule:'arithmetic-check-error'}
    ],explanation:'23’ten sonra 23×2+1=47 gelmeliydi; 45 kurala uymayan ilk terimdir. 95 de 47’den sonra doğru olurdu.',cognitiveTraits:[...HARD,'errorLocalization'],reasoningStepCount:3,evidence:['2→5, 5→11 ve 11→23 kuralı sağlar.','23×2+1=47’dir.','Bu nedenle ilk kopuş 45’tedir.']
  }),
  definePremiumChoice({
    id:'pattern-triangular-01',gameId:'pattern-lab',familyId:'premium-pattern-figurate',skeletonId:'premium-pattern-figurate:triangular-growth',subjectId:'mathematics',topicId:'geometric-patterns',learningOutcomeId:'sum-increasing-row-counts',
    context:'Noktalar üçgensel biçimde diziliyor: 1. şekil 1, 2. şekil 3, 3. şekil 6, 4. şekil 10 nokta içeriyor. Her yeni şekilde bir önceki satırdan bir fazla noktalı yeni satır ekleniyor.',prompt:'7. şekil kaç nokta içerir?',answer:'28',
    distractors:[
      {text:'21',misconceptionId:'pattern:stop-one-stage-early',why:'1’den 6’ya kadar olan toplamı alıp 7. satırı eklemez.',constructionRule:'omit-final-growth-step'},
      {text:'35',misconceptionId:'pattern:multiply-stage-by-next',why:'7×5 gibi bir çarpım kullanıp birikimli toplamı yanlış modeller.',constructionRule:'replace-sum-with-product'},
      {text:'16',misconceptionId:'pattern:add-constant-six',why:'10’dan sonra her adımda 3 ekleniyormuş gibi doğrusal artış varsayar.',constructionRule:'linearize-growing-increments'}
    ],explanation:'Nokta sayıları 1+2+...+n toplamıdır. 7. şekil 1+2+3+4+5+6+7=28 nokta içerir.',cognitiveTraits:[...HARD,'representationTransform'],reasoningStepCount:3,evidence:['Artışlar sırasıyla 2,3,4’tür.','5., 6. ve 7. satırlar 5,6,7 nokta ekler.','10+5+6+7=28.']
  }),
  definePremiumChoice({
    id:'pattern-ratio-growth-01',gameId:'pattern-lab',familyId:'premium-pattern-multiplicative',skeletonId:'premium-pattern-multiplicative:divide-then-multiply',subjectId:'mathematics',topicId:'number-patterns',learningOutcomeId:'infer-repeating-multiplicative-rule',
    context:'Bir dizi 81, 27, 54, 18, 36, 12 biçiminde ilerliyor.',prompt:'Dizinin sıradaki terimi hangisidir?',answer:'24',
    distractors:[
      {text:'4',misconceptionId:'pattern:repeat-division',why:'12’ye bir kez daha 3’e bölme uygular; dönüşümlü ×2 adımını atlar.',constructionRule:'repeat-last-operation'},
      {text:'6',misconceptionId:'pattern:halve-after-division',why:'İşlemleri ÷3 ve ÷2 olarak yorumlar.',constructionRule:'misread-multiplicative-alternation'},
      {text:'15',misconceptionId:'pattern:add-three',why:'Son iki küçük sayı arasındaki farkı kullanıp çarpımsal yapıyı terk eder.',constructionRule:'replace-multiplication-with-local-difference'}
    ],explanation:'İşlemler sırayla ÷3, ×2 biçiminde tekrarlanır. 36÷3=12’den sonra 12×2=24 gelir.',cognitiveTraits:[...HARD,'ruleInduction'],reasoningStepCount:3,evidence:['81→27 ve 54→18 adımları ÷3’tür.','27→54 ve 18→36 adımları ×2’dir.','12’den sonra ×2 uygulanır.']
  })
];

const MAP_ITEMS = [
  definePremiumChoice({
    id:'map-scale-distance-01',gameId:'social-map-skills',familyId:'premium-map-scale',skeletonId:'premium-map-scale:linear-distance',subjectId:'geography',topicId:'map-scale',learningOutcomeId:'convert-map-distance-to-real-distance',
    context:'Ölçeği 1:500.000 olan bir haritada iki kent arasındaki uzaklık 7,2 cm ölçülüyor.',prompt:'Kentler arasındaki gerçek uzaklık kaç kilometredir?',answer:'36 km',
    distractors:[
      {text:'3,6 km',misconceptionId:'map:centimeter-kilometer-conversion-one-zero-short',why:'Santimetreden kilometreye dönüşümde bir basamağı eksik çevirir.',constructionRule:'unit-conversion-off-by-ten'},
      {text:'72 km',misconceptionId:'map:double-scale-distance',why:'7,2 cm ile ölçek değerini doğru çarptıktan sonra sonucu ikiyle çarpar.',constructionRule:'apply-scale-twice'},
      {text:'350 km',misconceptionId:'map:multiply-centimeters-by-scale-denominator-as-km',why:'Ölçek paydasını kilometre gibi kullanıp birim dönüşümünü atlar.',constructionRule:'ignore-scale-units'}
    ],explanation:'Haritada 1 cm gerçekte 500.000 cm=5 km’dir. 7,2×5=36 km olur.',cognitiveTraits:[...HARD,'unitConversion'],reasoningStepCount:3,evidence:['1 cm, 500.000 cm’ye karşılık gelir.','500.000 cm=5 km’dir.','7,2×5=36 km.']
  }),
  definePremiumChoice({
    id:'map-direction-route-01',gameId:'social-map-skills',familyId:'premium-map-direction',skeletonId:'premium-map-direction:successive-turns',subjectId:'geography',topicId:'directions',learningOutcomeId:'track-direction-after-multiple-turns',
    context:'Bir yürüyüşçü kuzeye bakarak ilerliyor. Önce sağa, sonra yeniden sağa, ardından sola dönüyor.',prompt:'Son durumda hangi yöne bakmaktadır?',answer:'Doğu',
    distractors:[
      {text:'Batı',misconceptionId:'map:reverse-left-right',why:'Sağ ve sol dönüşlerin yönünü ters uygular.',constructionRule:'swap-turn-directions'},
      {text:'Güney',misconceptionId:'map:stop-before-final-turn',why:'İkinci sağ dönüşten sonraki güney yönünde kalır ve son solu uygulamaz.',constructionRule:'omit-final-turn'},
      {text:'Kuzey',misconceptionId:'map:cancel-all-turns',why:'İki sağ ve bir sol dönüşün birbirini tamamen götürdüğünü varsayar.',constructionRule:'net-turn-miscalculation'}
    ],explanation:'Kuzeyden sağa dönünce doğu, yeniden sağa dönünce güney, sonra sola dönünce doğu olur.',cognitiveTraits:[...HARD,'spatialTracking'],reasoningStepCount:3,evidence:['İlk sağ dönüş doğuya götürür.','İkinci sağ dönüş güneye götürür.','Güneyden sola dönüş doğudur.']
  }),
  definePremiumChoice({
    id:'map-climate-graph-01',gameId:'social-map-skills',familyId:'premium-map-climate',skeletonId:'premium-map-climate:seasonality-inference',subjectId:'geography',topicId:'climate-graphs',learningOutcomeId:'infer-climate-from-temperature-precipitation-pattern',
    context:'Bir merkezin yazları sıcak ve çok kurak, kışları ılık ve yağışlıdır. Yıllık yağışın büyük bölümü kasım-mart arasında düşmektedir.',prompt:'Bu merkez için en uygun çıkarım hangisidir?',answer:'Yaz kuraklığı belirgin olan Akdeniz iklimi özellikleri gösterir.',
    distractors:[
      {text:'Her mevsim düzenli yağış alan okyanusal iklim özellikleri gösterir.',misconceptionId:'map:ignore-seasonal-rainfall',why:'Yağışın kış aylarında toplandığı bilgisini yok sayar.',constructionRule:'flatten-seasonal-distribution'},
      {text:'Kışları sert ve kar yağışlı karasal iklim özellikleri gösterir.',misconceptionId:'map:equate-dry-summer-with-continental',why:'Ilık kış koşulunu dikkate almadan karasal iklime yönelir.',constructionRule:'use-single-feature-only'},
      {text:'Yıl boyunca sıcak ve yağışlı ekvatoral iklim özellikleri gösterir.',misconceptionId:'map:confuse-high-temperature-with-equatorial',why:'Yaz sıcaklığını yıl boyu sıcaklık ve sürekli yağışla karıştırır.',constructionRule:'overgeneralize-summer-temperature'}
    ],explanation:'Sıcak-kurak yaz ile ılık-yağışlı kış birlikteliği Akdeniz ikliminin temel mevsimsel özelliğidir.',cognitiveTraits:[...HARD,'evidenceClassification'],reasoningStepCount:3,evidence:['Yazlar sıcak ve kuraktır.','Kışlar ılık ve yağışlıdır.','Yağış kış döneminde yoğunlaşır.']
  }),
  definePremiumChoice({
    id:'map-population-distribution-01',gameId:'social-map-skills',familyId:'premium-map-population',skeletonId:'premium-map-population:multi-factor-settlement',subjectId:'geography',topicId:'population-distribution',learningOutcomeId:'infer-settlement-density-from-physical-human-factors',
    context:'A bölgesi düz, su kaynaklarına yakın ve ulaşım yollarının kavşağındadır. B bölgesi yüksek, engebeli ve uzun süre karla kaplıdır.',prompt:'Diğer koşullar benzerse hangi sonuç daha olasıdır?',answer:'A bölgesinin nüfus yoğunluğu B bölgesinden daha yüksek olur.',
    distractors:[
      {text:'B bölgesinin nüfusu daha yoğundur; yükselti yerleşmeyi artırır.',misconceptionId:'map:higher-elevation-means-density',why:'Yükselti ve engebenin ulaşım ile yerleşmeyi zorlaştırmasını ters yorumlar.',constructionRule:'reverse-relief-effect'},
      {text:'İki bölgenin nüfusu eşittir; yalnız yüzölçümü nüfusu belirler.',misconceptionId:'map:ignore-settlement-factors',why:'Su, ulaşım ve yer şekilleri gibi verilen etkenleri yok sayar.',constructionRule:'reduce-density-to-area-only'},
      {text:'A bölgesi daha seyrektir; kavşaklar sürekli göçe yol açar.',misconceptionId:'map:transport-reduces-settlement',why:'Ulaşım erişilebilirliğinin ekonomik ve yerleşim çekiciliğini artırmasını ters kurar.',constructionRule:'reverse-transport-attraction'}
    ],explanation:'Düz arazi, su ve ulaşım erişimi yerleşmeyi kolaylaştırır; yüksek ve uzun süre karla kaplı engebeli alanlar yerleşmeyi sınırlar.',cognitiveTraits:[...HARD,'causalIntegration'],reasoningStepCount:3,evidence:['A’da su ve ulaşım erişimi yüksektir.','A’nın arazisi düzdür.','B’de yükselti, engebe ve kar süresi fazladır.']
  }),
  definePremiumChoice({
    id:'map-latitude-temperature-01',gameId:'social-map-skills',familyId:'premium-map-latitude',skeletonId:'premium-map-latitude:sun-angle',subjectId:'geography',topicId:'latitude',learningOutcomeId:'relate-latitude-to-solar-angle-and-temperature',
    context:'K ve L merkezleri deniz seviyesinde ve benzer nem koşullarındadır. K, Ekvator’a L’den daha yakındır.',prompt:'Yıllık ortalama sıcaklık bakımından hangi yorum daha güçlüdür?',answer:'Güneş ışınlarını daha dik aldığı için K’nin ortalaması genellikle daha yüksektir.',
    distractors:[
      {text:'Kutuplara yakın olduğu için K’nin ortalaması daha düşüktür.',misconceptionId:'map:reverse-latitude-order',why:'K’nin Ekvator’a daha yakın olduğu bilgisini ters çevirir.',constructionRule:'reverse-distance-to-equator'},
      {text:'Enlem sıcaklığı etkilemez; iki merkezin ortalaması mutlaka aynıdır.',misconceptionId:'map:deny-solar-angle-effect',why:'Güneş ışınlarının geliş açısındaki düzenli farkı yok sayar.',constructionRule:'remove-latitude-factor'},
      {text:'L daha uzakta olduğu için Güneş’e fiziksel olarak daha yakındır ve daha sıcaktır.',misconceptionId:'map:confuse-latitude-with-earth-sun-distance',why:'Enlem farkını Dünya-Güneş uzaklığı farkı gibi yorumlar.',constructionRule:'replace-angle-with-distance'}
    ],explanation:'Ekvator’a yaklaştıkça Güneş ışınları daha dik gelir ve birim alana daha fazla enerji düşer; benzer koşullarda K daha sıcaktır.',cognitiveTraits:[...HARD,'modelReasoning'],reasoningStepCount:3,evidence:['K Ekvator’a daha yakındır.','Yakın enlemlerde ışınlar daha dik gelir.','Dik ışın birim alana daha fazla enerji taşır.']
  }),
  definePremiumChoice({
    id:'map-contour-slope-01',gameId:'social-map-skills',familyId:'premium-map-topography',skeletonId:'premium-map-topography:contour-spacing',subjectId:'geography',topicId:'contour-maps',learningOutcomeId:'infer-slope-from-contour-spacing',
    context:'Bir topoğrafya haritasında X yamacında eş yükselti eğrileri birbirine çok yakın, Y yamacında ise daha seyrektir. Yükselti aralıkları aynıdır.',prompt:'Yamaçlarla ilgili doğru yorum hangisidir?',answer:'X yamacı Y yamacından daha diktir.',
    distractors:[
      {text:'Y yamacı daha diktir; eğriler arasında daha fazla boşluk vardır.',misconceptionId:'map:wide-spacing-means-steep',why:'Yatay uzaklık arttıkça eğimin azaldığı ilişkiyi ters yorumlar.',constructionRule:'reverse-contour-spacing-rule'},
      {text:'İki yamacın eğimi aynıdır; yükselti aralıkları eşittir.',misconceptionId:'map:use-vertical-interval-only',why:'Eğim için yatay uzaklığın da gerekli olduğunu gözden kaçırır.',constructionRule:'ignore-horizontal-distance'},
      {text:'Eğrilerin sıklığı yalnız bitki örtüsünü gösterir; eğimle ilişkili değildir.',misconceptionId:'map:misread-contours-as-landcover',why:'Eş yükselti eğrilerinin topoğrafik anlamını farklı bir harita katmanıyla karıştırır.',constructionRule:'confuse-map-symbol-system'}
    ],explanation:'Aynı yükselti farkı daha kısa yatay mesafede gerçekleşiyorsa eğim daha büyüktür. Yakın eğriler X’in daha dik olduğunu gösterir.',cognitiveTraits:[...HARD,'spatialInference'],reasoningStepCount:3,evidence:['Yükselti aralıkları aynıdır.','X’te yatay mesafe daha kısadır.','Aynı yükselti farkı kısa mesafede daha büyük eğimdir.']
  }),
  definePremiumChoice({
    id:'map-migration-factors-01',gameId:'social-map-skills',familyId:'premium-map-migration',skeletonId:'premium-map-migration:push-pull',subjectId:'geography',topicId:'migration',learningOutcomeId:'classify-push-and-pull-factors',
    context:'Bir aile kuraklık nedeniyle tarımsal gelirini kaybediyor ve iş olanaklarının fazla olduğu büyük bir kente taşınıyor.',prompt:'Bu göçü açıklayan itici ve çekici etkenler hangi seçenekte doğru verilmiştir?',answer:'İtici: kuraklık ve gelir kaybı; çekici: kentteki iş olanakları.',
    distractors:[
      {text:'İtici: kentteki iş olanakları; çekici: kuraklık ve gelir kaybı.',misconceptionId:'map:swap-push-pull',why:'Kaynak yerde uzaklaştıran ve hedef yerde çeken nedenleri yer değiştirir.',constructionRule:'reverse-factor-roles'},
      {text:'İtici: aile bağları; çekici: tarımsal gelirin azalması.',misconceptionId:'map:invent-unmentioned-factors',why:'Metinde bulunmayan aile bağını ekler ve gelir kaybını hedef çekiciliği sayar.',constructionRule:'replace-given-causes'},
      {text:'İtici: iş olanakları; çekici: tarıma devam etme isteği.',misconceptionId:'map:misclassify-economic-signals',why:'İş fırsatını uzaklaştırıcı, sürdürülemeyen tarımı çekici kabul eder.',constructionRule:'invert-economic-incentives'}
    ],explanation:'İtici etken kaynak yerde yaşamı zorlaştırır; kuraklık ve gelir kaybı buna örnektir. İş olanağı hedef kenti çekici kılar.',cognitiveTraits:[...HARD,'evidenceClassification'],reasoningStepCount:3,evidence:['Kuraklık kaynak bölgede yaşanır.','Gelir kaybı aileyi bölgeden iter.','İş olanakları hedef kente çeker.']
  }),
  definePremiumChoice({
    id:'map-disaster-risk-01',gameId:'social-map-skills',familyId:'premium-map-risk',skeletonId:'premium-map-risk:hazard-exposure',subjectId:'geography',topicId:'disaster-risk',learningOutcomeId:'distinguish-hazard-from-risk',
    context:'Aynı büyüklükte deprem üretebilen bir fayın yakınında iki bölge vardır. A’da az nüfuslu, dayanıklı yapılar; B’de yoğun nüfuslu, denetimsiz yapılar bulunur.',prompt:'Deprem riskiyle ilgili en uygun yorum hangisidir?',answer:'Tehlike benzer olsa da B’de maruz kalma ve kırılganlık daha yüksek olduğu için risk daha fazladır.',
    distractors:[
      {text:'Fay aynı olduğundan iki bölgenin riski de kesin olarak aynıdır.',misconceptionId:'map:risk-equals-hazard-only',why:'Nüfus ve yapı dayanıklılığını risk hesabından çıkarır.',constructionRule:'reduce-risk-to-hazard'},
      {text:'A’nın nüfusu az olduğu için deprem tehlikesi B’den daha büyüktür.',misconceptionId:'map:confuse-exposure-with-hazard',why:'Nüfus yoğunluğunu fayın deprem üretme gücüyle karıştırır.',constructionRule:'swap-hazard-and-exposure'},
      {text:'B’de yapı sayısı fazla olduğundan fayın üreteceği deprem daha küçük olur.',misconceptionId:'map:buildings-change-earthquake-magnitude',why:'Yapı koşullarının sarsıntının kaynağını değiştirdiğini varsayar.',constructionRule:'make-vulnerability-alter-hazard'}
    ],explanation:'Risk yalnız tehlikeye değil, maruz kalan nüfusa ve yapıların kırılganlığına da bağlıdır. Bu nedenle B daha risklidir.',cognitiveTraits:[...HARD,'riskReasoning'],reasoningStepCount:3,evidence:['Fayın tehlike düzeyi iki bölge için benzerdir.','B’de nüfus yoğunluğu daha yüksektir.','B’de yapılar daha kırılgandır.']
  }),
  definePremiumChoice({
    id:'map-time-zone-01',gameId:'social-map-skills',familyId:'premium-map-time',skeletonId:'premium-map-time:longitude-difference',subjectId:'geography',topicId:'local-time',learningOutcomeId:'calculate-local-time-from-longitude',
    context:'A kenti 30° doğu, B kenti 75° doğu boylamındadır. A’da yerel saat 10.00 iken her 15° boylam farkının 1 saat olduğu kabul ediliyor.',prompt:'B kentinde yerel saat kaçtır?',answer:'13.00',
    distractors:[
      {text:'07.00',misconceptionId:'map:east-time-earlier',why:'Doğuya gidildikçe yerel saatin ileri değil geri olduğunu varsayar.',constructionRule:'reverse-east-west-time'},
      {text:'12.00',misconceptionId:'map:divide-longitude-gap-by-twenty',why:'45° farkı 15° yerine yanlış zaman aralığına böler.',constructionRule:'wrong-degrees-per-hour'},
      {text:'15.00',misconceptionId:'map:add-longitudes-instead-of-difference',why:'Boylam farkını 75−30 yerine büyütüp fazla saat ekler.',constructionRule:'use-sum-like-gap'}
    ],explanation:'Boylam farkı 75−30=45°’dir. 45÷15=3 saat olur. B daha doğuda olduğundan saat 10.00+3=13.00’tür.',cognitiveTraits:[...HARD,'unitConversion'],reasoningStepCount:3,evidence:['Boylam farkı 45°’dir.','Her 15° bir saat olduğundan fark 3 saattir.','Doğudaki B’nin saati ileridir.']
  }),
  definePremiumChoice({
    id:'map-land-use-transport-01',gameId:'social-map-skills',familyId:'premium-map-human-environment',skeletonId:'premium-map-human-environment:route-choice',subjectId:'geography',topicId:'transportation',learningOutcomeId:'evaluate-route-with-multiple-geographic-constraints',
    context:'Bir demir yolu için iki güzergâh inceleniyor. K güzergâhı 20 km kısa fakat dik yamaçlar ve heyelan alanlarından geçiyor. L güzergâhı daha uzun fakat geniş bir vadi tabanını izliyor.',prompt:'Yalnız yapım güvenliği ve bakım maliyeti düşünülürse hangi seçim daha gerekçelidir?',answer:'L güzergâhı; daha uzun olsa da eğim ve heyelan riski daha düşüktür.',
    distractors:[
      {text:'K güzergâhı; en kısa yol her zaman en düşük maliyetli yoldur.',misconceptionId:'map:distance-only-route-choice',why:'Eğim, tünel ve heyelan gibi yapım-bakım etkenlerini yok sayar.',constructionRule:'optimize-single-variable'},
      {text:'K güzergâhı; dik yamaçlar trenlerin daha hızlı gitmesini sağlar.',misconceptionId:'map:steepness-improves-rail',why:'Demir yolunda yüksek eğimin işletmeyi ve güvenliği zorlaştırmasını ters yorumlar.',constructionRule:'reverse-slope-cost-effect'},
      {text:'İki güzergâh eşdeğerdir; yer şekilleri ulaşım maliyetini etkilemez.',misconceptionId:'map:deny-relief-transport-link',why:'Verilen topoğrafik farkların mühendislik sonucunu yok sayar.',constructionRule:'remove-geographic-constraint'}
    ],explanation:'Demir yollarında düşük eğim ve zemin güvenliği önemlidir. L daha uzun olsa da vadi tabanı yapım ve bakım açısından daha güvenlidir.',cognitiveTraits:[...HARD,'tradeoffEvaluation'],reasoningStepCount:3,evidence:['K daha kısadır ancak dik ve heyelanlıdır.','L daha uzun ancak eğimi düşüktür.','Güvenlik ve bakım ölçütleri L’yi destekler.']
  })
];

const ENGLISH_DATA = [
  ['reluctant','Mina was reluctant to speak first, but she joined the discussion after her teacher encouraged her.','“Reluctant” kelimesi bu cümlede hangi anlama gelir?','isteksiz ve kararsız','çok istekli ve sabırsız','konuşamayacak kadar bilgisiz','tartışmayı yöneten kişi','opposite-eager','confuse-with-unable','confuse-with-leader','Mina başlangıçta gönüllü değildir; cesaret verilince katılır.'],
  ['maintain','The museum must maintain a stable temperature to protect the old paintings.','“Maintain” fiilinin cümledeki en uygun anlamı hangisidir?','belirli bir düzeyde korumak','sıcaklığı aniden yükseltmek','tabloları başka yere taşımak','bir şeyi ilk kez ölçmek','opposite-change','confuse-protect-with-move','confuse-maintain-with-measure','Amaç sıcaklığı değiştirmek değil, sabit düzeyde tutmaktır.'],
  ['scarce','Clean water became scarce after months without rain, so the town limited daily use.','“Scarce” kelimesi hangi durumu anlatır?','ihtiyaca göre az ve zor bulunan','ihtiyacı karşılayacak kadar bol bulunan','belediye kararıyla kullanımı durdurulan','temizlenmesi gerektiği için kullanılamayan','opposite-abundant','confuse-shortage-with-ban','add-unsupported-dirtiness','Yağışsızlık suyu azaltmış ve kullanımın sınırlandırılmasına yol açmıştır.'],
  ['accurate','The first map had several wrong street names, but the revised version was accurate.','“Accurate” sözcüğünün anlamı hangisidir?','hatasız ve gerçeğe uygun','renkli ve dikkat çekici','eski ve değerli','ayrıntıları azaltılmış','confuse-correct-with-attractive','confuse-accuracy-with-age','confuse-accuracy-with-simplicity','Yanlışların düzeltildiği yeni haritanın gerçeğe uygun olduğu belirtilmektedir.'],
  ['prevent','Wearing a helmet cannot prevent every accident, but it can prevent many head injuries.','İkinci “prevent” fiili hangi anlamda kullanılmıştır?','bir sonucun oluşmasını engellemek','bir olayı önceden haber vermek','yaralanmayı daha hızlı iyileştirmek','kazanın nedenini açıklamak','confuse-prevent-with-predict','confuse-prevent-with-heal','confuse-prevent-with-explain','Kask bazı baş yaralanmalarının meydana gelmesini engelleyebilir.'],
  ['contribute','Many small donations contributed to the success of the library project.','“Contributed to” ifadesi ne anlatır?','sonucun oluşmasına katkı sağladı','projenin başarısını tek başına garanti etti','bağışların geri alınmasına yol açtı','başarıyı geciktiren sorun oluşturdu','overstate-as-sole-cause','reverse-as-withdrawal','opposite-negative-effect','Küçük bağışlar tek başına değil, birlikte projenin başarısına destek olmuştur.'],
  ['evidence','The broken branch and fresh footprints were evidence that an animal had passed through the garden.','“Evidence” kelimesinin en uygun karşılığı hangisidir?','bir iddiayı destekleyen belirti veya kanıt','olayın kesin nedenini bilen kişi','bahçeyi korumak için yapılan plan','hayvanın bıraktığı tüm zararların toplamı','confuse-evidence-with-witness','confuse-evidence-with-plan','confuse-clue-with-damage','Dal ve izler, hayvanın geçtiği sonucunu destekleyen işaretlerdir.'],
  ['approach','The team tried a new approach: instead of memorizing facts, they compared examples and found patterns.','“Approach” sözcüğü burada hangi anlamdadır?','bir işi ele alma yöntemi','bir yere fiziksel olarak yaklaşma','sorundan uzak durma kararı','çalışmanın sonunda ulaşılan sonuç','literal-motion-reading','opposite-avoidance','confuse-method-with-outcome','İki çalışma biçimi karşılaştırıldığı için sözcük yöntem anlamındadır.'],
  ['outcome','The experiment lasted two weeks, but its outcome was unclear because the groups received different amounts of water.','“Outcome” kelimesi neyi ifade eder?','sürecin sonunda ortaya çıkan sonuç','deney başlamadan kurulan tahmin','gruplara verilen su miktarı','deneyi yapan kişilerin listesi','confuse-outcome-with-hypothesis','confuse-result-with-variable','confuse-result-with-participants','Outcome, deney sürecinin sonunda elde edilen sonucu belirtir.'],
  ['significant','The second group improved by only one point, but the first group showed a significant increase of twenty points.','“Significant” sözcüğü cümlede hangi anlamı taşır?','dikkate değer ölçüde büyük ve önemli','tesadüfen oluşmuş ve açıklanamaz','ölçülemeyecek kadar küçük','her iki grupta tamamen aynı','confuse-important-with-random','opposite-small','ignore-contrast','Bir puanlık değişimle yirmi puanlık artış karşılaştırılarak büyüklük vurgulanır.'],
  ['aware','Before the campaign, few students were aware of how much food the cafeteria wasted.','“Aware of” ifadesinin anlamı hangisidir?','bir durumun farkında olmak','bir sorundan sorumlu olmak','bir durumu değiştirmeye gücü yetmek','bir bilgiyi başkalarından saklamak','confuse-awareness-with-responsibility','confuse-awareness-with-capability','confuse-awareness-with-concealment','Öğrencilerin israf hakkında bilgi sahibi olup olmadığı anlatılmaktadır.'],
  ['efficient','The new bus route carries more passengers while using less fuel, so it is more efficient.','“Efficient” kelimesi hangi özelliği anlatır?','daha az kaynakla daha iyi sonuç üretme','daha yüksek maliyetle daha yavaş çalışma','yalnızca daha fazla yolcu taşıma','yakıt kullanımını ölçmeden çalışma','opposite-wasteful','focus-output-only','ignore-resource-measure','Hem daha çok yolcu hem daha az yakıt birlikte verimliliği gösterir.'],
  ['despite','Despite the heavy rain, the outdoor concert continued as planned.','“Despite” bağlacının cümlede kurduğu ilişki hangisidir?','beklenen sonucu engellemeyen karşıt koşul','konserin yağmur nedeniyle iptal edilme nedeni','yağmurdan sonra gerçekleşen zaman sırası','konserin yalnız yağmur sayesinde sürmesi','confuse-concession-with-cause','confuse-concession-with-sequence','reverse-as-enabling-cause','Şiddetli yağmura karşın konserin sürmesi karşıtlık ve ödünleme ilişkisi kurar.'],
  ['require','This task requires careful measurement; guessing will not produce a reliable answer.','“Requires” fiilinin anlamı hangisidir?','başarmak için gerekli kılmak','dikkatli ölçümü yasaklamak','sonucu önceden tahmin etmek','görevi daha kolay göstermek','opposite-prohibit','confuse-require-with-predict','confuse-necessity-with-appearance','Güvenilir sonuç için dikkatli ölçümün zorunlu olduğu belirtilmektedir.'],
  ['likely','The sky is dark and the air pressure is falling, so rain is likely this afternoon.','“Likely” kelimesi hangi anlamdadır?','gerçekleşme olasılığı yüksek','gerçekleşmesi kesin ve kaçınılmaz','gerçekleşmesi mümkün olmayan','geçmişte zaten gerçekleşmiş','overstate-probability-as-certainty','opposite-impossible','confuse-future-probability-with-past','Belirtiler yağmuru destekler, fakat kesinlik değil yüksek olasılık bildirir.'],
  ['avoid','To avoid spreading the error, Deniz checked the original data before copying the table.','“Avoid” fiili hangi amacı ifade eder?','istenmeyen bir sonucu önlemek','hatayı herkese açıklamak','verileri daha hızlı kopyalamak','tabloyu tamamen silmek','confuse-avoid-with-announce','confuse-prevention-with-speed','overreact-as-deletion','Deniz’in kontrolü, hatanın yayılmasını önlemeye yöneliktir.'],
  ['establish','The researchers repeated the test many times to establish whether the pattern was real.','“Establish” fiili burada hangi anlamda kullanılmıştır?','kanıtlarla doğrulayıp ortaya koymak','yeni bir bina veya kurum kurmak','sonucu incelemeden kabul etmek','deneyi ilk denemeden sonra durdurmak','literal-institution-reading','confuse-establish-with-assume','opposite-stop-verification','Tekrarlanan testler, örüntünün gerçek olup olmadığını kanıtlamayı amaçlar.'],
  ['benefit','The shade trees benefit the neighborhood by lowering summer temperatures and providing cleaner air.','“Benefit” fiilinin anlamı hangisidir?','yarar sağlamak ve olumlu etkilemek','mahalleyi başka bir yere taşımak','sıcaklığı ölçmekle yetinmek','hava kalitesindeki değişimi gizlemek','confuse-benefit-with-relocate','confuse-effect-with-measure','opposite-conceal','Ağaçların sıcaklık ve hava kalitesi üzerinde olumlu etkileri sıralanmıştır.'],
  ['impact','The road closure had a major impact on local shops because fewer customers could reach them.','“Impact” kelimesi bu cümlede neyi anlatır?','belirgin etki veya sonuç','yolun fiziksel uzunluğu','mağazaların günlük çalışma saati','müşterilerin satın aldığı ürün türü','confuse-impact-with-distance','confuse-effect-with-schedule','confuse-effect-with-product','Yol kapanması müşteri erişimini ve dolayısıyla dükkânları belirgin biçimde etkilemiştir.'],
  ['available','Only three computers are available now; the others are being repaired.','“Available” kelimesinin anlamı hangisidir?','şu anda kullanılabilir durumda','en yeni ve en pahalı olan','onarılması kesinlikle gerekmeyen','başka bir binada saklanan','confuse-availability-with-quality','overstate-as-no-repair-needed','invent-location','Diğerleri onarımda olduğuna göre üç bilgisayar kullanıma hazırdır.']
];

const ENGLISH_MISCONCEPTION_WHY = Object.freeze({
  'opposite-eager':'Mina öğretmeni cesaretlendirene kadar konuşmaya yanaşmadığı için “çok istekli” yorumu bağlamın tersidir.',
  'confuse-with-unable':'Mina sonradan tartışmaya katıldığına göre konuşma yeteneği yok değildir; başlangıçtaki sorun isteksizliktir.',
  'confuse-with-leader':'Cümle Mina’nın tartışmayı yönettiğini değil, tartışmaya sonradan katıldığını söyler.',
  'opposite-change':'Müzenin amacı sıcaklığı değiştirmek değil, eski tabloları korumak için sabit tutmaktır.',
  'confuse-protect-with-move':'Tabloları taşımaktan söz edilmez; koruma, sıcaklığın belirli düzeyde sürdürülmesiyle sağlanır.',
  'confuse-maintain-with-measure':'Sıcaklığı ölçmek yalnız değerini belirler; “maintain” bu değeri sabit tutmayı anlatır.',
  'opposite-abundant':'Kullanımın sınırlandırılması suyun bol değil, ihtiyaca göre yetersiz olduğunu gösterir.',
  'confuse-shortage-with-ban':'Suya erişim yönetim kararıyla kesilmemiş, azaldığı için günlük kullanım miktarı sınırlandırılmıştır.',
  'add-unsupported-dirtiness':'Cümle suyun kirli olduğunu söylemez; yağışsızlık nedeniyle temiz su miktarının azaldığını söyler.',
  'confuse-correct-with-attractive':'Haritanın renkli veya dikkat çekici olması doğruluğunu göstermez; vurgu yanlış sokak adlarının düzeltilmesidir.',
  'confuse-accuracy-with-age':'Yeni sürümün doğru olması eski ya da değerli olmasından değil, hataların giderilmesinden kaynaklanır.',
  'confuse-accuracy-with-simplicity':'Ayrıntı azaltıldığı bilgisi yoktur; “accurate” bilgilerin gerçeğe uygunluğunu belirtir.',
  'confuse-prevent-with-predict':'Kask yaralanmayı önceden haber vermez; bazı baş yaralanmalarının oluşmasını engelleyebilir.',
  'confuse-prevent-with-heal':'Cümle oluşmuş bir yaralanmayı iyileştirmekten değil, yaralanmanın meydana gelmesini önlemekten söz eder.',
  'confuse-prevent-with-explain':'Kazanın nedenini açıklamak sonuç üzerinde koruyucu etki oluşturmaz; kaskın işlevi yaralanmayı azaltmaktır.',
  'overstate-as-sole-cause':'Başarıya birçok küçük bağış birlikte katkı sağlamıştır; tek bir bağışın başarıyı garanti ettiği söylenmez.',
  'reverse-as-withdrawal':'Bağışların geri alınması projeyi desteklemez; cümlede bağışların başarıya olumlu etkisi vardır.',
  'opposite-negative-effect':'“Success” sözcüğü olumlu sonucu açıkça gösterdiği için bağışların başarıyı geciktirdiği yorumu ters düşer.',
  'confuse-evidence-with-witness':'Kırık dal ve ayak izleri kişi değildir; bir sonuca ulaşmayı sağlayan fiziksel belirtilerdir.',
  'confuse-evidence-with-plan':'Bahçeyi koruma planından söz edilmez; izler geçmişte bir hayvanın geçtiğini destekler.',
  'confuse-clue-with-damage':'Dal ve izlerin değeri zarar miktarı olmaları değil, hayvanın geçişine işaret etmeleridir.',
  'literal-motion-reading':'Burada bir yere fiziksel yaklaşma yoktur; ezber yerine örnek karşılaştırma biçiminde yeni bir yöntem denenmektedir.',
  'opposite-avoidance':'Takım sorundan uzak durmamış, soruyu çözmek için farklı bir çalışma biçimi kullanmıştır.',
  'confuse-method-with-outcome':'“Approach” ulaşılan sonuç değil, sonuca ulaşmak için kullanılan yöntemdir.',
  'confuse-outcome-with-hypothesis':'Deney başlamadan kurulan tahmin “hypothesis” olur; outcome iki haftalık sürecin sonunda elde edilen sonuçtur.',
  'confuse-result-with-variable':'Gruplara verilen su miktarı deney değişkenidir; deneyin sonunda ortaya çıkan bulgu değildir.',
  'confuse-result-with-participants':'Deneyi yapan kişilerin listesi sürece ait bilgidir; “outcome” sürecin sonucunu anlatır.',
  'confuse-important-with-random':'Yirmi puanlık artışın büyüklüğü vurgulanır; değişimin tesadüfi olduğuna dair kanıt verilmez.',
  'opposite-small':'Bir puanlık değişimle karşılaştırılan yirmi puanlık artış ölçülemeyecek kadar küçük değildir.',
  'ignore-contrast':'İki grubun değişimleri aynı değildir; biri bir, diğeri yirmi puan artmıştır.',
  'confuse-awareness-with-responsibility':'Öğrencilerin israftan sorumlu olup olmadığı değil, israf miktarını bilip bilmediği anlatılır.',
  'confuse-awareness-with-capability':'Bir durumu değiştirebilmek ile o durumun varlığını bilmek farklıdır; cümle bilgi düzeyini ölçer.',
  'confuse-awareness-with-concealment':'Kampanya öncesi öğrencilerin bilgiyi sakladığı değil, israfın boyutunu bilmediği belirtilir.',
  'opposite-wasteful':'Daha az yakıtla daha çok yolcu taşımak kaynak israfı değil, yüksek verimlilik göstergesidir.',
  'focus-output-only':'Yalnız daha çok yolcu taşımak yeterli değildir; verimlilik aynı zamanda daha az yakıt kullanılmasıyla açıklanır.',
  'ignore-resource-measure':'Yakıt kullanımı açıkça karşılaştırıldığı için kaynak tüketimini göz ardı eden yorum cümleyle çelişir.',
  'confuse-concession-with-cause':'Yağmur konserin sürme nedeni değildir; normalde engel olması beklenen koşula rağmen konser sürmüştür.',
  'confuse-concession-with-sequence':'“Despite” yalnız önce-sonra sırası kurmaz; yağmur ile konserin devamı arasındaki beklenmedik karşıtlığı gösterir.',
  'reverse-as-enabling-cause':'Konser yağmur sayesinde değil, yağmura karşın devam etmiştir.',
  'opposite-prohibit':'Dikkatli ölçüm yasaklanmıyor; güvenilir cevap için gerekli olduğu açıkça söyleniyor.',
  'confuse-require-with-predict':'“Require” sonucu tahmin etmek değil, görevin başarılı olması için gerekli koşulu belirtmektir.',
  'confuse-necessity-with-appearance':'Görevi kolay göstermekten söz edilmez; tahmin yerine dikkatli ölçüm zorunlu tutulur.',
  'overstate-probability-as-certainty':'Karanlık gökyüzü ve düşen basınç yağmur olasılığını yükseltir, fakat yağmuru kesinleştirmez.',
  'opposite-impossible':'Verilen hava belirtileri yağmuru imkânsız değil, daha olası kılar.',
  'confuse-future-probability-with-past':'“This afternoon” gelecek zamanı gösterir; yağmurun daha önce gerçekleştiği söylenmez.',
  'confuse-avoid-with-announce':'Deniz hatayı duyurmak için değil, başkalarına yayılmasını engellemek için veriyi kontrol eder.',
  'confuse-prevention-with-speed':'Kontrol işlemi kopyalamayı hızlandırmayı değil, yanlış verinin çoğalmasını önlemeyi amaçlar.',
  'overreact-as-deletion':'Tabloyu silmekten söz edilmez; doğru veriyle kopyalama yapabilmek için kaynak kontrol edilir.',
  'literal-institution-reading':'Araştırmacılar bina veya kurum kurmuyor; örüntünün gerçekliğini tekrarlarla kanıtlamaya çalışıyor.',
  'confuse-establish-with-assume':'Sonucu incelemeden kabul etmek “establish” değildir; çoklu tekrarlar kanıt toplamayı gösterir.',
  'opposite-stop-verification':'Deneyi ilk denemede bırakmak yerine güvenilir sonuca ulaşmak için birçok kez tekrar etmişlerdir.',
  'confuse-benefit-with-relocate':'Ağaçların mahalleyi taşıdığı değil, sıcaklığı ve hava kalitesini olumlu etkilediği belirtilir.',
  'confuse-effect-with-measure':'Ağaçlar yalnız sıcaklığı ölçmez; gölge ve temiz hava yoluyla mahalleye doğrudan yarar sağlar.',
  'opposite-conceal':'Hava kalitesini gizlemek yarar değildir; cümle ağaçların temiz hava sağladığını söyler.',
  'confuse-impact-with-distance':'Yolun uzunluğu değil, kapanmasının müşteri erişimi ve dükkânlar üzerindeki sonucu anlatılır.',
  'confuse-effect-with-schedule':'Mağazaların çalışma saatleri verilmez; azalan müşteri sayısı üzerinden ekonomik etki açıklanır.',
  'confuse-effect-with-product':'Müşterilerin hangi ürünü aldığı değil, dükkânlara ulaşamamasının oluşturduğu sonuç önemlidir.',
  'confuse-availability-with-quality':'Bilgisayarların yeni veya pahalı olması değil, şu anda kullanılabilir olup olmaması karşılaştırılır.',
  'overstate-as-no-repair-needed':'Kullanılabilir üç bilgisayarın hiç onarım gerektirmeyeceği söylenmez; yalnız şu an kullanıma hazırdırlar.',
  'invent-location':'Diğer bilgisayarların başka binada olduğu değil, onarımda olduğu açıkça belirtilmiştir.'
});

const ENGLISH_ITEMS = ENGLISH_DATA.map(([word,context,prompt,answer,d1,d2,d3,m1,m2,m3,explanation],index) => definePremiumChoice({
  id:`english-vocab-context-${String(index+1).padStart(2,'0')}`,
  gameId:'english-vocabulary',familyId:`premium-english-vocabulary-${word}`,skeletonId:'premium-english-vocabulary:context-inference',subjectId:'english',topicId:'contextual-vocabulary',learningOutcomeId:`infer-${word}-from-context`,
  context,prompt,answer,
  distractors:[
    {text:d1,misconceptionId:`english:${word}:${m1}`,why:ENGLISH_MISCONCEPTION_WHY[m1],constructionRule:m1},
    {text:d2,misconceptionId:`english:${word}:${m2}`,why:ENGLISH_MISCONCEPTION_WHY[m2],constructionRule:m2},
    {text:d3,misconceptionId:`english:${word}:${m3}`,why:ENGLISH_MISCONCEPTION_WHY[m3],constructionRule:m3}
  ],
  explanation,cognitiveTraits:[...HARD,'contextInference'],reasoningStepCount:2,evidence:['Sözcüğün geçtiği cümledeki neden, karşıtlık veya sonuç ipucu belirlenir.',explanation]
}));

export const PREMIUM_EXPANSION_PACK_C = createPremiumChoicePack({
  version:'2.2.0',sourceLabel:'Zihin Arenası Premium Soru Bankası',items:[...PATTERN_ITEMS,...MAP_ITEMS,...ENGLISH_ITEMS]
});
export const PREMIUM_EXPANSION_GAME_IDS_C = PREMIUM_EXPANSION_PACK_C.gameIds;
export const generatePremiumExpansionRoundsC = PREMIUM_EXPANSION_PACK_C.generate;
export const premiumExpansionInventoryC = PREMIUM_EXPANSION_PACK_C.inventory;
