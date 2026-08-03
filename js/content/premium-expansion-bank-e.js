import { createPremiumChoicePack, definePremiumChoice } from './premium-question-core.js';

const HARD = ['multiStepInference', 'conditionEvaluation', 'informationLinking'];

const GEOMETRY_ITEMS = [
  definePremiumChoice({
    id:'geometry-shadow-similarity-01',gameId:'geometry-lab',familyId:'premium-geometry-similarity',skeletonId:'premium-geometry-similarity:shadow-ratio',subjectId:'mathematics',topicId:'similar-triangles',learningOutcomeId:'use-shadow-ratio-to-find-height',
    context:'Aynı anda ölçüm yapıldığında 1,5 m boyundaki bir çubuğun gölgesi 2 m, bir ağacın gölgesi 12 m’dir. Güneş ışınlarının geliş açısı iki ölçümde aynıdır.',prompt:'Ağacın yüksekliği kaç metredir?',answer:'9 m',
    distractors:[
      {text:'8 m',misconceptionId:'geometry:subtract-shadow-difference',why:'Gölge uzunlukları arasındaki 10 m farkı doğrudan yüksekliğe aktarmaya çalışır.',constructionRule:'use-additive-difference-instead-of-ratio'},
      {text:'13,5 m',misconceptionId:'geometry:add-stick-height-to-tree-shadow',why:'Orantı kurmak yerine ağacın gölgesine çubuğun boyunu ekler.',constructionRule:'add-unlike-measures'},
      {text:'18 m',misconceptionId:'geometry:invert-similarity-ratio',why:'1,5/2 oranını ters çevirip 12 ile çarpar.',constructionRule:'invert-height-shadow-ratio'}
    ],explanation:'Benzer üçgenlerde yükseklik/gölge oranı aynıdır. 1,5/2=h/12 olduğundan h=12×1,5÷2=9 m.',cognitiveTraits:[...HARD,'representationTransform'],reasoningStepCount:3,evidence:['Aynı ışın açısı benzer üçgen oluşturur.','Yükseklik/gölge oranı 1,5/2’dir.','12 m gölge için yükseklik 9 m olur.']
  }),
  definePremiumChoice({
    id:'geometry-parallel-angles-01',gameId:'geometry-lab',familyId:'premium-geometry-angles',skeletonId:'premium-geometry-angles:parallel-transversal',subjectId:'mathematics',topicId:'angles',learningOutcomeId:'combine-corresponding-and-linear-pair-angles',
    context:'Bir kesen iki paralel doğruyu kesiyor. Üst kesişimdeki dar açılardan biri 68° olarak ölçülüyor.',prompt:'Alt kesişimde bu açıya komşu geniş açının ölçüsü kaç derecedir?',answer:'112°',
    distractors:[
      {text:'68°',misconceptionId:'geometry:choose-corresponding-not-adjacent',why:'Paralellikten gelen eş açıyı bulur fakat sorulan komşu geniş açıya geçmez.',constructionRule:'stop-at-corresponding-angle'},
      {text:'22°',misconceptionId:'geometry:subtract-from-right-angle',why:'Komşu açıların toplamını 180° yerine 90° kabul eder.',constructionRule:'use-complementary-instead-of-supplementary'},
      {text:'136°',misconceptionId:'geometry:double-acute-angle',why:'Doğrusal açı ilişkisi yerine 68°’yi ikiyle çarpar.',constructionRule:'double-angle-without-relation'}
    ],explanation:'Alt kesişimde karşılık gelen dar açı 68°’dir. Komşu doğrusal açıyla toplam 180° olduğundan 180−68=112° bulunur.',cognitiveTraits:[...HARD,'spatialInference'],reasoningStepCount:3,evidence:['Paralel doğrularda karşılık gelen açılar eşittir.','Alt dar açı 68° olur.','Komşu geniş açı 180−68=112°’dir.']
  }),
  definePremiumChoice({
    id:'geometry-composite-area-01',gameId:'geometry-lab',familyId:'premium-geometry-area',skeletonId:'premium-geometry-area:rectangle-cutout',subjectId:'mathematics',topicId:'area',learningOutcomeId:'subtract-rectangular-cutout-from-composite-shape',
    context:'12 cm × 9 cm boyutlarındaki dikdörtgen kartonun bir köşesinden 4 cm × 3 cm boyutlarında dikdörtgen parça kesiliyor.',prompt:'Kalan kartonun alanı kaç santimetrekaredir?',answer:'96 cm²',
    distractors:[
      {text:'84 cm²',misconceptionId:'geometry:subtract-side-lengths-before-area',why:'Alanları çıkarmak yerine büyük dikdörtgenin kenarlarından 4 ve 3 çıkarıp 8×6 hesaplar.',constructionRule:'subtract-dimensions-then-multiply'},
      {text:'120 cm²',misconceptionId:'geometry:add-cutout-area',why:'Kesilen 12 cm² alanı toplam alandan çıkarmak yerine ekler.',constructionRule:'add-removed-area'},
      {text:'104 cm²',misconceptionId:'geometry:subtract-perimeter-like-difference',why:'Kesilen parçanın alanı 12 yerine kenar farklarıyla 4 kabul edilir.',constructionRule:'confuse-area-with-linear-difference'}
    ],explanation:'Büyük dikdörtgenin alanı 12×9=108 cm², kesilen parçanın alanı 4×3=12 cm²’dir. Kalan 108−12=96 cm² olur.',cognitiveTraits:[...HARD,'decomposition'],reasoningStepCount:3,evidence:['Toplam alan 108 cm²’dir.','Kesilen alan 12 cm²’dir.','Alan farkı 96 cm²’dir.']
  }),
  definePremiumChoice({
    id:'geometry-volume-rise-01',gameId:'geometry-lab',familyId:'premium-geometry-volume',skeletonId:'premium-geometry-volume:displacement-prism',subjectId:'mathematics',topicId:'volume',learningOutcomeId:'relate-water-level-rise-to-displaced-volume',
    context:'Tabanı 20 cm × 15 cm olan dikdörtgen prizma biçimindeki kapta su seviyesi, tamamen batan katı bir cisim bırakılınca 4 cm yükseliyor.',prompt:'Cismin hacmi kaç santimetreküptür?',answer:'1200 cm³',
    distractors:[
      {text:'300 cm³',misconceptionId:'geometry:use-base-area-only',why:'20×15 taban alanını bulur fakat 4 cm yükselmeyle çarpmaz.',constructionRule:'omit-height-change'},
      {text:'2400 cm³',misconceptionId:'geometry:double-displacement-height',why:'Su seviyesinin yükselmesini kabın iki yönünde gerçekleşmiş gibi iki kez uygular.',constructionRule:'double-level-rise'},
      {text:'80 cm³',misconceptionId:'geometry:multiply-one-side-by-rise',why:'Tabanın iki boyutundan yalnız 20 cm’yi kullanarak 20×4 hesaplar.',constructionRule:'drop-one-base-dimension'}
    ],explanation:'Yer değiştiren su hacmi taban alanı×seviye artışıdır: 20×15×4=1200 cm³. Tam batan cismin hacmi bu değere eşittir.',cognitiveTraits:[...HARD,'modelReasoning'],reasoningStepCount:3,evidence:['Kabın taban alanı 300 cm²’dir.','Su seviyesi 4 cm yükselir.','Yer değiştiren hacim 300×4=1200 cm³’tür.']
  }),
  definePremiumChoice({
    id:'geometry-coordinate-midpoint-01',gameId:'geometry-lab',familyId:'premium-geometry-coordinate',skeletonId:'premium-geometry-coordinate:midpoint-condition',subjectId:'mathematics',topicId:'coordinate-geometry',learningOutcomeId:'find-missing-endpoint-from-midpoint',
    context:'A(−2, 5) ve B(x, −1) noktalarının orta noktası M(3, 2)’dir.',prompt:'B noktasının x koordinatı kaçtır?',answer:'8',
    distractors:[
      {text:'5',misconceptionId:'geometry:add-midpoint-to-known-coordinate',why:'Orta nokta bağıntısında 2×3−(−2) yerine 3−(−2) hesaplar.',constructionRule:'omit-doubling-midpoint'},
      {text:'4',misconceptionId:'geometry:average-by-difference',why:'Koordinatlar toplamının yarısını almak yerine x ile −2 arasındaki farkı 6 kabul edip yanlış yarımlar.',constructionRule:'use-distance-not-average'},
      {text:'−8',misconceptionId:'geometry:sign-error-negative-endpoint',why:'−2’yi eşitliğin diğer yanına geçirirken işaretini yanlış korur.',constructionRule:'endpoint-sign-error'}
    ],explanation:'Orta noktanın x koordinatı (−2+x)/2=3’tür. −2+x=6 ve x=8 bulunur.',cognitiveTraits:[...HARD,'algebraicModeling'],reasoningStepCount:3,evidence:['Orta nokta x koordinatı uçların ortalamasıdır.','(−2+x)/2=3 eşitliği kurulur.','Eşitlikten x=8 çıkar.']
  }),
  definePremiumChoice({
    id:'geometry-pythagorean-route-01',gameId:'geometry-lab',familyId:'premium-geometry-pythagorean',skeletonId:'premium-geometry-pythagorean:diagonal-shortcut',subjectId:'mathematics',topicId:'pythagorean-theorem',learningOutcomeId:'compare-rectilinear-route-with-diagonal',
    context:'Dikdörtgen bir parkın kenarları 9 m ve 12 m’dir. Bir kişi iki kenar boyunca yürümek yerine bir köşeden karşı köşeye düz bir yol kullanıyor.',prompt:'Düz yol, iki kenar boyunca yürümekten kaç metre daha kısadır?',answer:'6 m',
    distractors:[
      {text:'15 m',misconceptionId:'geometry:report-diagonal-not-saving',why:'9-12-15 üçgeninden köşegen uzunluğunu bulur ancak sorulan farkı hesaplamaz.',constructionRule:'stop-at-intermediate-diagonal'},
      {text:'3 m',misconceptionId:'geometry:subtract-side-difference',why:'Köşegen ile kenar toplamını karşılaştırmak yerine 12−9 farkını alır.',constructionRule:'use-side-difference'},
      {text:'21 m',misconceptionId:'geometry:report-edge-route',why:'İki kenar boyunca yürüyüşün 9+12 toplamını cevap olarak verir.',constructionRule:'report-original-route'}
    ],explanation:'Köşegen √(9²+12²)=15 m’dir. Kenarlar boyunca yol 9+12=21 m olduğundan kazanç 21−15=6 m’dir.',cognitiveTraits:[...HARD,'usingIntermediateResultInNewDecision'],reasoningStepCount:3,evidence:['Köşegen 15 m bulunur.','Kenar yolu 21 m’dir.','Uzunluk farkı 6 m’dir.']
  }),
  definePremiumChoice({
    id:'geometry-scale-drawing-01',gameId:'geometry-lab',familyId:'premium-geometry-scale',skeletonId:'premium-geometry-scale:area-factor',subjectId:'mathematics',topicId:'scale',learningOutcomeId:'distinguish-length-scale-from-area-scale',
    context:'Bir dikdörtgenin bütün kenar uzunlukları çizimde gerçeğin 1/4’ü olacak biçimde küçültülüyor. Gerçek dikdörtgenin alanı 320 cm²’dir.',prompt:'Çizimdeki dikdörtgenin alanı kaç santimetrekaredir?',answer:'20 cm²',
    distractors:[
      {text:'80 cm²',misconceptionId:'geometry:apply-linear-scale-to-area',why:'Alanı da uzunluk gibi yalnız 4’e böler.',constructionRule:'use-length-factor-on-area'},
      {text:'40 cm²',misconceptionId:'geometry:halve-area-factor',why:'İki boyutun da küçüldüğünü fark eder fakat 4² yerine 8’e böler.',constructionRule:'partial-square-scale'},
      {text:'5 cm²',misconceptionId:'geometry:square-scale-twice',why:'Alan için 16’ya böldükten sonra yeniden 4’e böler.',constructionRule:'apply-area-scale-and-linear-scale'}
    ],explanation:'Kenarlar 1/4 ölçekliyse alan (1/4)²=1/16 ölçeklidir. 320÷16=20 cm² olur.',cognitiveTraits:[...HARD,'representationTransform'],reasoningStepCount:3,evidence:['Uzunluk ölçeği 1/4’tür.','Alan ölçeği iki boyut nedeniyle 1/16’dır.','320÷16=20 cm².']
  }),
  definePremiumChoice({
    id:'geometry-symmetry-transform-01',gameId:'geometry-lab',familyId:'premium-geometry-transformations',skeletonId:'premium-geometry-transformations:reflection-coordinate',subjectId:'mathematics',topicId:'transformations',learningOutcomeId:'reflect-point-across-y-axis-then-translate',
    context:'P(4, −3) noktası önce y eksenine göre yansıtılıyor, ardından 2 birim yukarı öteleniyor.',prompt:'Son noktanın koordinatları hangisidir?',answer:'(−4, −1)',
    distractors:[
      {text:'(4, −1)',misconceptionId:'geometry:omit-reflection',why:'Yukarı ötelemeyi yapar fakat y eksenine göre yansımada x işaretini değiştirmez.',constructionRule:'apply-translation-only'},
      {text:'(−4, −5)',misconceptionId:'geometry:translate-down-instead-of-up',why:'Yansımayı doğru yapar ancak 2 birim yukarı yerine aşağı gider.',constructionRule:'reverse-translation-direction'},
      {text:'(−2, −3)',misconceptionId:'geometry:translate-x-coordinate',why:'Yansıma sonrası yukarı ötelemeyi y yerine x koordinatına uygular.',constructionRule:'translate-wrong-axis'}
    ],explanation:'Y eksenine göre yansımada (4,−3)→(−4,−3) olur. 2 birim yukarı ötelenince y koordinatı −1 olur: (−4,−1).',cognitiveTraits:[...HARD,'spatialTracking'],reasoningStepCount:3,evidence:['Yansıma x işaretini değiştirir.','Ara nokta (−4,−3)’tür.','Yukarı öteleme y’yi 2 artırır.']
  }),
  definePremiumChoice({
    id:'geometry-triangle-inequality-01',gameId:'geometry-lab',familyId:'premium-geometry-triangle',skeletonId:'premium-geometry-triangle:integer-third-side',subjectId:'mathematics',topicId:'triangle-inequality',learningOutcomeId:'count-integer-third-side-values',
    context:'İki kenarı 7 cm ve 11 cm olan bir üçgenin üçüncü kenarı x tam sayı santimetredir.',prompt:'x kaç farklı değer alabilir?',answer:'13',
    distractors:[
      {text:'14',misconceptionId:'geometry:include-upper-bound',why:'x<18 olması gerekirken 18’i de geçerli sayar.',constructionRule:'include-strict-upper-bound'},
      {text:'12',misconceptionId:'geometry:exclude-one-valid-end',why:'4<x koşulunu doğru uygular fakat 5 veya 17 değerlerinden birini gereksiz yere çıkarır.',constructionRule:'drop-valid-bound-adjacent-value'},
      {text:'7',misconceptionId:'geometry:use-difference-to-smaller-side-range',why:'Yalnız kenar farkından küçük kenara kadar olan değerleri sayar.',constructionRule:'truncate-valid-interval'}
    ],explanation:'Üçgen eşitsizliği |11−7|<x<11+7, yani 4<x<18’dir. Tam sayılar 5’ten 17’ye kadar 13 tanedir.',cognitiveTraits:[...HARD,'constraintCounting'],reasoningStepCount:3,evidence:['Alt sınır 4’tür ve dâhil değildir.','Üst sınır 18’dir ve dâhil değildir.','5–17 arasında 13 tam sayı vardır.']
  }),
  definePremiumChoice({
    id:'geometry-circle-path-01',gameId:'geometry-lab',familyId:'premium-geometry-circle',skeletonId:'premium-geometry-circle:semicircle-plus-diameter',subjectId:'mathematics',topicId:'circle',learningOutcomeId:'combine-arc-length-and-diameter',
    context:'Yarıçapı 7 m olan yarım daire biçimindeki bir bahçenin yalnız dış sınırına çit çekilecektir. Düz çap kenarı da çite dâhildir. π=22/7 alınacaktır.',prompt:'Gerekli çit uzunluğu kaç metredir?',answer:'36 m',
    distractors:[
      {text:'22 m',misconceptionId:'geometry:semicircle-arc-only',why:'Yarım çember yayını bulur ancak düz çap kenarını eklemez.',constructionRule:'omit-diameter-edge'},
      {text:'44 m',misconceptionId:'geometry:use-full-circumference',why:'Şekil yarım daire olduğu hâlde tam çember çevresini kullanır.',constructionRule:'use-full-circle-only'},
      {text:'29 m',misconceptionId:'geometry:add-radius-not-diameter',why:'Yarım yay uzunluğuna 14 m çap yerine 7 m yarıçap ekler.',constructionRule:'add-radius-instead-of-diameter'}
    ],explanation:'Yarım çember yayı πr=(22/7)×7=22 m’dir. Çap 14 m olduğundan toplam sınır 22+14=36 m olur.',cognitiveTraits:[...HARD,'decomposition'],reasoningStepCount:3,evidence:['Yarım yay uzunluğu 22 m’dir.','Düz kenar çap olduğundan 14 m’dir.','Toplam 36 m’dir.']
  })
];

const HISTORY_ITEMS = [
  definePremiumChoice({
    id:'history-primary-source-01',gameId:'social-time-travel',familyId:'premium-history-source',skeletonId:'premium-history-source:primary-secondary',subjectId:'history',topicId:'historical-sources',learningOutcomeId:'distinguish-primary-from-secondary-source',
    context:'Bir araştırmacı 1920 tarihli bir mektubu, 1980’de yazılmış bir tarih kitabını ve günümüzde hazırlanmış bir belgeseli inceliyor. Mektup, olaya katılan bir kişinin kendi dönemindeki anlatımıdır.',prompt:'Araştırılan olay için birincil kaynak hangisidir?',answer:'1920 tarihli mektup',
    distractors:[
      {text:'1980’de yazılmış tarih kitabı',misconceptionId:'history:old-secondary-as-primary',why:'Eski tarihli olmayı olayın gerçekleştiği dönemde üretilmiş olmakla karıştırır.',constructionRule:'equate-age-with-primary-status'},
      {text:'Günümüzde hazırlanmış belgesel',misconceptionId:'history:visual-medium-as-primary',why:'Görsel anlatımı doğrudan tanıklık sanır; belgesel sonraki yorum ve seçkilere dayanır.',constructionRule:'treat-visual-format-as-primary'},
      {text:'Araştırmacının üç kaynaktan çıkardığı özet',misconceptionId:'history:researcher-synthesis-as-primary',why:'Sonradan oluşturulan sentezi olay döneminden kalan belge yerine koyar.',constructionRule:'confuse-analysis-with-original-evidence'}
    ],explanation:'Birincil kaynak olayın yaşandığı dönemde, olaya doğrudan katılan ya da tanık olan kişi tarafından üretilir. Bu ölçütü mektup karşılar.',cognitiveTraits:[...HARD,'sourceEvaluation'],reasoningStepCount:3,evidence:['Mektup 1920’de yazılmıştır.','Yazar olaya katılmıştır.','Diğer kaynaklar daha sonraki yorumlardır.']
  }),
  definePremiumChoice({
    id:'history-chronology-01',gameId:'social-time-travel',familyId:'premium-history-chronology',skeletonId:'premium-history-chronology:relative-dates',subjectId:'history',topicId:'chronology',learningOutcomeId:'order-events-from-relative-time-clues',
    context:'K olayı L’den önce, M olayı K’den sonra fakat N’den önce gerçekleşmiştir. L olayı M’den sonra olmuştur.',prompt:'Olayların eskiden yeniye doğru sırası hangisidir?',answer:'K – M – L – N',
    distractors:[
      {text:'M – K – L – N',misconceptionId:'history:reverse-k-before-m',why:'M’nin K’den sonra gerçekleştiği koşulunu ters çevirir.',constructionRule:'reverse-explicit-before-after'},
      {text:'K – L – M – N',misconceptionId:'history:ignore-l-after-m',why:'L’nin M’den sonra olduğu bilgisini yok sayar.',constructionRule:'omit-one-relative-clue'},
      {text:'N – K – M – L',misconceptionId:'history:place-n-before-m',why:'M’nin N’den önce olduğu koşulunu ters yorumlar.',constructionRule:'reverse-terminal-relation'}
    ],explanation:'M, K’den sonra ve N’den öncedir. L de M’den sonra olduğuna göre koşulları birlikte sağlayan sıra K–M–L–N’dir.',cognitiveTraits:[...HARD,'ordering'],reasoningStepCount:3,evidence:['K, M’den öncedir.','M, L’den öncedir.','M, N’den öncedir ve verilen seçenekler içinde K–M–L–N tüm koşulları sağlar.']
  }),
  definePremiumChoice({
    id:'history-cause-consequence-01',gameId:'social-time-travel',familyId:'premium-history-causality',skeletonId:'premium-history-causality:multi-cause-trade',subjectId:'history',topicId:'cause-effect',learningOutcomeId:'distinguish-cause-from-consequence',
    context:'Yeni deniz yollarının bulunmasıyla bazı eski kara ticaret yolları önem kaybetmiş, liman kentleri zenginleşmiş ve uzak bölgeler arasındaki ürün dolaşımı artmıştır.',prompt:'Bu parçadaki temel neden hangisidir?',answer:'Yeni deniz yollarının bulunması',
    distractors:[
      {text:'Liman kentlerinin zenginleşmesi',misconceptionId:'history:consequence-as-cause-port',why:'Metinde deniz yollarının ardından ortaya çıkan ekonomik sonucu başlangıç nedeni sayar.',constructionRule:'swap-effect-with-cause'},
      {text:'Kara yollarının önem kaybetmesi',misconceptionId:'history:consequence-as-cause-route',why:'Ticaret yönünün değişmesinin sonucu olan gerilemeyi nedene dönüştürür.',constructionRule:'select-intermediate-effect'},
      {text:'Ürün dolaşımının artması',misconceptionId:'history:final-effect-as-cause',why:'Olay zincirinin sonundaki sonucu ilk tetikleyici sanır.',constructionRule:'reverse-causal-chain'}
    ],explanation:'Parçada diğer üç gelişme yeni deniz yollarının bulunmasından sonra ortaya çıkan sonuçlardır.',cognitiveTraits:[...HARD,'causalChain'],reasoningStepCount:3,evidence:['Deniz yolları ilk gelişme olarak verilir.','Kara yollarının gerilemesi ve limanların zenginleşmesi bunu izler.','Ürün dolaşımı artışı da sonuçtur.']
  }),
  definePremiumChoice({
    id:'history-continuity-change-01',gameId:'social-time-travel',familyId:'premium-history-continuity',skeletonId:'premium-history-continuity:institution-change',subjectId:'history',topicId:'continuity-and-change',learningOutcomeId:'identify-simultaneous-continuity-and-change',
    context:'Bir şehirde pazar yeri yüzyıllar boyunca aynı meydanda kurulmuştur. Zamanla alışverişte madeni para yerine kâğıt para, ardından elektronik ödeme kullanılmaya başlanmıştır.',prompt:'Bu örnekte süreklilik ve değişim hangi seçenekte doğru eşleştirilmiştir?',answer:'Süreklilik: pazarın aynı meydanda kurulması; değişim: ödeme araçları',
    distractors:[
      {text:'Süreklilik: ödeme araçları; değişim: pazarın yeri',misconceptionId:'history:swap-continuity-change',why:'Değişen ödeme biçimini süreklilik, aynı kalan meydanı değişim olarak ters sınıflandırır.',constructionRule:'reverse-classification'},
      {text:'Süreklilik: her şey; değişim: hiçbir şey',misconceptionId:'history:ignore-evidence-of-change',why:'Ödeme araçlarının açıkça değiştiği bilgisini yok sayar.',constructionRule:'deny-documented-change'},
      {text:'Süreklilik: yalnız elektronik ödeme; değişim: şehir meydanı',misconceptionId:'history:recent-state-as-continuity',why:'En yeni uygulamayı uzun dönemli süreklilik sanır ve sabit yeri değişmiş kabul eder.',constructionRule:'confuse-current-state-with-continuity'}
    ],explanation:'Mekân aynı kaldığı için süreklilik, ödeme biçimleri zaman içinde farklılaştığı için değişim vardır.',cognitiveTraits:[...HARD,'evidenceClassification'],reasoningStepCount:3,evidence:['Pazar yeri aynı meydandadır.','Ödeme araçları üç farklı biçime dönüşmüştür.','Aynı kalan ve değişen unsurlar ayrılır.']
  }),
  definePremiumChoice({
    id:'history-conflicting-sources-01',gameId:'social-time-travel',familyId:'premium-history-source-criticism',skeletonId:'premium-history-source-criticism:conflict',subjectId:'history',topicId:'source-criticism',learningOutcomeId:'respond-to-conflicting-historical-accounts',
    context:'Aynı olay hakkında iki günlük farklı sayıda katılımcı bildiriyor. Günlüklerden biri olayın düzenleyicisine, diğeri olayı eleştiren bir gözlemciye aittir.',prompt:'Tarihçinin en uygun yaklaşımı hangisidir?',answer:'Yazarların konumlarını değerlendirip başka kanıtlarla karşılaştırmak',
    distractors:[
      {text:'Daha yüksek sayıyı veren günlüğü doğrudan doğru kabul etmek',misconceptionId:'history:choose-larger-number',why:'Sayının büyüklüğünü güvenilirlik ölçütü sanır.',constructionRule:'select-by-magnitude'},
      {text:'İki kaynak çeliştiği için ikisini de tamamen değersiz saymak',misconceptionId:'history:discard-conflict',why:'Kaynakların bakış açısını incelemek yerine çelişkiyi araştırmayı bırakma nedeni yapar.',constructionRule:'reject-all-conflicting-evidence'},
      {text:'Düzenleyiciye ait kaynağı tarafsız kabul edip yalnız onu kullanmak',misconceptionId:'history:authority-equals-neutrality',why:'Olayın düzenleyicisinin de çıkar ve bakış açısına sahip olabileceğini gözden kaçırır.',constructionRule:'assume-insider-neutrality'}
    ],explanation:'Çelişkili kaynaklarda yazarın konumu, amacı ve diğer kanıtlarla uyum incelenir; tek kaynak otomatik doğru ya da değersiz sayılmaz.',cognitiveTraits:[...HARD,'sourceEvaluation'],reasoningStepCount:3,evidence:['Kaynak yazarlarının olayla ilişkileri farklıdır.','Sayılar birbiriyle çelişmektedir.','Bağımsız kanıtlarla çapraz kontrol gerekir.']
  }),
  definePremiumChoice({
    id:'history-anachronism-01',gameId:'social-time-travel',familyId:'premium-history-empathy',skeletonId:'premium-history-empathy:avoid-anachronism',subjectId:'history',topicId:'historical-empathy',learningOutcomeId:'identify-anachronistic-judgment',
    context:'Bir öğrenci, yüzyıllar önce yaşayan insanların günümüz teknolojisini kullanmadıkları için “akılsız” olduklarını söylüyor.',prompt:'Bu değerlendirmedeki temel tarihsel hata nedir?',answer:'Geçmişi bugünün koşulları ve ölçütleriyle değerlendirmek',
    distractors:[
      {text:'Dönemin teknolojik imkânlarını olduğundan az göstermek',misconceptionId:'history:absence-of-modern-equals-no-technology',why:'Sorun teknolojinin hiç bulunmaması değil, farklı dönemlerin olanaklarını tek ölçütle değerlendirmektir.',constructionRule:'replace-anachronism-with-absence-claim'},
      {text:'Olayların zaman sırasını yanlış biçimde kurmak',misconceptionId:'history:confuse-chronology-with-empathy',why:'Cümlede sıralama hatası değil, dönem koşullarını göz ardı eden değer yargısı vardır.',constructionRule:'select-unrelated-historical-skill'},
      {text:'Kaynakların bakış açılarını karşılaştırmadan kullanmak',misconceptionId:'history:confuse-source-use-with-bias',why:'Kaynak kullanımı yanlışın nedeni değildir; modern ölçütlerin geçmişe taşınmasıdır.',constructionRule:'misidentify-method-as-error'}
    ],explanation:'Tarihsel empati, insanları kendi dönemlerinin bilgi, teknoloji ve değer koşulları içinde anlamayı gerektirir.',cognitiveTraits:[...HARD,'perspectiveTaking'],reasoningStepCount:3,evidence:['İnsanlar farklı bir dönemde yaşamıştır.','Öğrenci günümüz teknolojisini tek ölçüt yapmıştır.','Bu yaklaşım anakronik yargıdır.']
  }),
  definePremiumChoice({
    id:'history-reform-impact-01',gameId:'social-time-travel',familyId:'premium-history-reform',skeletonId:'premium-history-reform:education-access',subjectId:'history',topicId:'reform-and-modernization',learningOutcomeId:'infer-reform-impact-from-before-after-evidence',
    context:'Bir bölgede yeni okullar açılmadan önce her 100 çocuktan 28’i düzenli eğitim alırken, on yıl sonra bu sayı 61’e çıkmıştır. Aynı dönemde öğretmen yetiştirme programı başlatılmıştır.',prompt:'Veriler en güçlü olarak hangi sonucu destekler?',answer:'Okul ve öğretmen yatırımları eğitime erişimin artmasına katkı sağlamıştır.',
    distractors:[
      {text:'Erişim artışının tek nedeni çocuk sayısının azalmasıdır.',misconceptionId:'history:invent-unsupported-sole-cause',why:'Çocuk sayısının azaldığı bilgisi verilmez ve yatırımların etkisi yok sayılır.',constructionRule:'invent-exclusive-cause'},
      {text:'Yeni okullar eğitim alan çocuk sayısını azaltmıştır.',misconceptionId:'history:reverse-before-after-trend',why:'28’den 61’e yükselişi azalma olarak ters yorumlar.',constructionRule:'reverse-observed-change'},
      {text:'Öğretmen programının erişimle hiçbir ilişkisi kurulamaz.',misconceptionId:'history:deny-plausible-contribution',why:'Eş zamanlı öğretmen ve okul yatırımının katkı ihtimalini tamamen dışlar.',constructionRule:'reject-supported-contribution'}
    ],explanation:'Önce-sonra verisi tek başına mutlak neden kanıtlamaz; ancak okul ve öğretmen yatırımlarının erişim artışına katkısını güçlü biçimde destekler.',cognitiveTraits:[...HARD,'evidenceEvaluation'],reasoningStepCount:3,evidence:['Eğitime erişim 28’den 61’e yükselmiştir.','Yeni okullar açılmıştır.','Öğretmen yetiştirme programı aynı dönemde başlamıştır.']
  }),
  definePremiumChoice({
    id:'history-trade-cultural-exchange-01',gameId:'social-time-travel',familyId:'premium-history-interaction',skeletonId:'premium-history-interaction:trade-exchange',subjectId:'history',topicId:'cultural-interaction',learningOutcomeId:'infer-cultural-exchange-from-trade-network',
    context:'Bir ticaret yolu üzerindeki kentte farklı bölgelere ait seramikler, yazı örnekleri ve ölçü birimleri birlikte bulunmuştur.',prompt:'Bu bulgular en çok hangi yorumu destekler?',answer:'Ticaret ağları ürünlerle birlikte bilgi ve kültür taşıyabilir.',
    distractors:[
      {text:'Seramik çeşitliliği kentin dış ilişkilerinin sınırlı kaldığını gösterir.',misconceptionId:'history:ignore-mixed-origin-evidence',why:'Farklı bölgelere ait buluntular dış bağlantının tersini gösterir.',constructionRule:'deny-contact-evidence'},
      {text:'Farklı kökenli buluntular kentin tek üretim merkezi olduğunu gösterir.',misconceptionId:'history:homogenize-diverse-evidence',why:'Köken çeşitliliğini tek üretici ve tek zaman varsayımıyla siler.',constructionRule:'collapse-diversity'},
      {text:'Ortak ölçüler kentte askerî yönetimin güçlendiğini gösterir.',misconceptionId:'history:reduce-route-to-military',why:'Seramik, yazı ve ölçü birimi bulguları ekonomik-kültürel etkileşime işaret eder.',constructionRule:'replace-trade-with-single-function'}
    ],explanation:'Farklı kökenli maddi ve yazılı unsurlar, ticaret ağlarının insanlar arasında kültür ve bilgi dolaşımını da sağladığını gösterir.',cognitiveTraits:[...HARD,'evidenceSynthesis'],reasoningStepCount:3,evidence:['Seramikler farklı bölgelerdendir.','Yazı ve ölçü örnekleri de çeşitlidir.','Çeşitli unsurlar etkileşim ağına işaret eder.']
  }),
  definePremiumChoice({
    id:'history-archaeology-settlement-01',gameId:'social-time-travel',familyId:'premium-history-archaeology',skeletonId:'premium-history-archaeology:artifact-function',subjectId:'history',topicId:'archaeological-inference',learningOutcomeId:'infer-settlement-activity-from-artifact-cluster',
    context:'Bir kazı alanında çok sayıda öğütme taşı, tahıl kalıntısı, depolama çukuru ve sabit ocak bulunmuştur.',prompt:'Bu bulgular hangi yaşam biçimini daha güçlü destekler?',answer:'Tarım yapan ve ürün depolayan yerleşik bir topluluk',
    distractors:[
      {text:'Sürekli hareket eden ve hiç üretim yapmayan avcı grubu',misconceptionId:'history:ignore-fixed-storage-evidence',why:'Sabit ocak ve depolama çukurlarının yerleşiklik göstergesini yok sayar.',constructionRule:'select-mobile-life-despite-fixed-features'},
      {text:'Yalnız deniz ticaretiyle geçinen liman topluluğu',misconceptionId:'history:invent-maritime-economy',why:'Deniz, gemi veya liman kanıtı bulunmadığı hâlde farklı ekonomik faaliyet ekler.',constructionRule:'add-unsupported-livelihood'},
      {text:'Yazılı belge üreten fakat besin hazırlamayan yönetim merkezi',misconceptionId:'history:ignore-food-production-tools',why:'Öğütme taşı ve tahıl kalıntılarının doğrudan besin üretimi kanıtını reddeder.',constructionRule:'disconnect-artifacts-from-function'}
    ],explanation:'Tahıl, öğütme araçları, depolama ve sabit ocak birlikte tarım, besin hazırlama ve yerleşik yaşamı destekler.',cognitiveTraits:[...HARD,'evidenceSynthesis'],reasoningStepCount:3,evidence:['Tahıl ve öğütme taşı tarımsal besin kullanımını gösterir.','Depolama çukuru ürün biriktirmeyi gösterir.','Sabit ocak yerleşiklik kanıtıdır.']
  }),
  definePremiumChoice({
    id:'history-oral-history-01',gameId:'social-time-travel',familyId:'premium-history-oral',skeletonId:'premium-history-oral:memory-limit',subjectId:'history',topicId:'oral-history',learningOutcomeId:'evaluate-strengths-and-limits-of-oral-history',
    context:'Bir kişi çocukluğundaki mahalleyi ayrıntılı biçimde anlatıyor; ancak bazı tarihleri karıştırdığını ve olayları ailesinden duyduklarıyla birleştirdiğini söylüyor.',prompt:'Bu sözlü tarih kaydı nasıl kullanılmalıdır?',answer:'Deneyim ve gündelik yaşam için değerli görülmeli, tarihler başka kaynaklarla kontrol edilmelidir.',
    distractors:[
      {text:'Tarih karışıklığı olduğu için kaydın tamamı değersiz sayılmalıdır.',misconceptionId:'history:discard-imperfect-memory',why:'Bellek sınırlılığı, anlatının gündelik yaşam ve deneyim değerini ortadan kaldırmaz.',constructionRule:'reject-entire-source-for-one-limit'},
      {text:'Kişisel tanıklık olduğu için anlatılan her ayrıntı kesin doğru kabul edilmelidir.',misconceptionId:'history:treat-testimony-as-infallible',why:'Tanığın tarihleri karıştırdığını kendisi belirtmektedir; çapraz kontrol gerekir.',constructionRule:'accept-memory-without-corroboration'},
      {text:'Yalnız ailesinden duyduğu bölümler kullanılmalı, kendi deneyimleri atılmalıdır.',misconceptionId:'history:privilege-hearsay-over-experience',why:'Doğrudan deneyim bölümleri sözlü tarihin temel değeridir; duyumlar ayrıca işaretlenmelidir.',constructionRule:'reverse-evidence-proximity'}
    ],explanation:'Sözlü tarih kişisel deneyimi görünür kılar; fakat bellek ve duyum kaynaklı ayrıntılar başka belgelerle karşılaştırılmalıdır.',cognitiveTraits:[...HARD,'sourceEvaluation'],reasoningStepCount:3,evidence:['Anlatıcı doğrudan deneyim aktarmaktadır.','Bazı tarihleri karıştırdığını belirtmektedir.','Aileden duyulan bilgiler doğrudan tanıklık değildir.']
  })
];

const RELIGION_ITEMS = [
  definePremiumChoice({
    id:'religion-intention-action-01',gameId:'religion-practice',familyId:'premium-religion-intention',skeletonId:'premium-religion-intention:claim-behavior',subjectId:'religion',topicId:'intention-and-action',learningOutcomeId:'evaluate-consistency-between-intention-and-behavior',
    context:'Bir öğrenci arkadaşına yardım etmek istediğini söylüyor; fakat ihtiyaç anında sorumluluğu sürekli başkasına bırakıyor.',prompt:'Bu durumdan çıkarılabilecek en dengeli sonuç hangisidir?',answer:'İyi niyet, sorumlulukla davranışa dönüştüğünde anlamını güçlendirir.',
    distractors:[
      {text:'Yardım niyetini açıklamak, sorumluluk almanın yerine geçebilir.',misconceptionId:'religion:intention-without-action-sufficient',why:'Söylem ile ihtiyaç anındaki davranış arasındaki çelişkiyi yok sayar.',constructionRule:'replace-action-with-stated-intention'},
      {text:'Sorumluluktan kaçınmak, sonraki iyi davranışların değerini de azaltır.',misconceptionId:'religion:permanent-label-from-one-pattern',why:'Eleştiriyi değişmez kişilik yargısına dönüştürür ve gelişim imkânını dışlar.',constructionRule:'overgeneralize-behavior-to-identity'},
      {text:'Yardımın değeri, başkalarının davranışı görmesine bağlıdır.',misconceptionId:'religion:external-approval-as-value',why:'İyiliğin değerini sorumluluk ve samimiyet yerine görünürlüğe bağlar.',constructionRule:'substitute-social-display-for-sincerity'}
    ],explanation:'Niyet önemlidir; ancak ihtiyaç anında sorumluluk almak ve niyeti davranışa dönüştürmek gerekir.',cognitiveTraits:[...HARD,'ethicalEvaluation'],reasoningStepCount:3,evidence:['Öğrenci yardım niyetini ifade eder.','İhtiyaç anında sorumluluk almaz.','Niyet-davranış uyumu eksiktir.']
  }),
  definePremiumChoice({
    id:'religion-trust-effort-01',gameId:'religion-practice',familyId:'premium-religion-trust',skeletonId:'premium-religion-trust:effort-then-trust',subjectId:'religion',topicId:'tevekkul',learningOutcomeId:'distinguish-trust-from-passivity',
    context:'İki öğrenci sınava hazırlanıyor. Biri plan yapıp çalıştıktan sonra sonucu sakinlikle karşılıyor; diğeri hiç çalışmadan “Nasıl olsa iyi olur.” diyor.',prompt:'Tevekkül anlayışına daha uygun davranış hangisidir?',answer:'Gerekli çabayı gösterip sonucu güven ve sükûnetle karşılamak',
    distractors:[
      {text:'Hiç hazırlık yapmadan olumlu sonuç beklemek',misconceptionId:'religion:trust-as-passivity',why:'Tevekkülü sorumluluğu terk etmek ve çaba göstermemekle karıştırır.',constructionRule:'remove-effort-from-trust'},
      {text:'Sonucu yalnız kendi gücüne bağlayıp hiçbir belirsizlik kabul etmemek',misconceptionId:'religion:effort-as-total-control',why:'İnsan çabasının yanında kontrol dışı koşulların da bulunduğunu yok sayar.',constructionRule:'turn-effort-into-absolute-control'},
      {text:'Başarısızlık ihtimali yüzünden çalışmaya başlamamak',misconceptionId:'religion:fear-as-reason-to-avoid-duty',why:'Belirsizliği sorumluluktan kaçınma gerekçesine dönüştürür.',constructionRule:'avoid-effort-due-to-uncertainty'}
    ],explanation:'Tevekkül, tedbir ve çalışmayı bırakarak beklemek değil; sorumluluğu yerine getirdikten sonra sonucu güvenle karşılamaktır.',cognitiveTraits:[...HARD,'conceptDistinction'],reasoningStepCount:3,evidence:['Birinci öğrenci plan ve emek gösterir.','Sonucu sakinlikle karşılar.','İkinci öğrenci çabayı terk eder.']
  }),
  definePremiumChoice({
    id:'religion-fairness-need-01',gameId:'religion-practice',familyId:'premium-religion-justice',skeletonId:'premium-religion-justice:equal-vs-equitable',subjectId:'religion',topicId:'justice',learningOutcomeId:'distinguish-equality-from-need-based-fairness',
    context:'Bir yardım kampanyasında herkese aynı miktarda destek vermek öneriliyor. Ancak bazı ailelerin barınma ve sağlık ihtiyacı diğerlerinden çok daha fazladır.',prompt:'Adalet ilkesine daha uygun yaklaşım hangisidir?',answer:'Temel hakkı koruyup desteği ihtiyaçların ağırlığına göre düzenlemek',
    distractors:[
      {text:'İhtiyaç farklarını incelemeden herkese aynı miktarı vermek',misconceptionId:'religion:equality-always-equals-justice',why:'Biçimsel eşitliği, farklı ihtiyaçları gözeten adaletle aynı kabul eder.',constructionRule:'ignore-relevant-need-differences'},
      {text:'En güçlü ailelere daha çok destek verip süreci hızlandırmak',misconceptionId:'religion:power-based-distribution',why:'Desteği ihtiyaç yerine güç ve kolaylık ölçütüne bağlar.',constructionRule:'allocate-by-power-not-need'},
      {text:'Karar vermek zor olduğu için yardımı tamamen durdurmak',misconceptionId:'religion:avoidance-instead-of-justice',why:'Ölçüt geliştirmek yerine sorumluluğu ve yardımı terk eder.',constructionRule:'replace-fair-decision-with-inaction'}
    ],explanation:'Adalet, herkese kör biçimde aynı şeyi vermek değil; hakları koruyarak ilgili ihtiyaç farklarını dikkate almaktır.',cognitiveTraits:[...HARD,'ethicalEvaluation'],reasoningStepCount:3,evidence:['Ailelerin ihtiyaç düzeyleri farklıdır.','Amaç temel hakları desteklemektir.','İlgili farkı gözeten dağıtım daha adildir.']
  }),
  definePremiumChoice({
    id:'religion-consultation-01',gameId:'religion-practice',familyId:'premium-religion-consultation',skeletonId:'premium-religion-consultation:evidence-based-group-decision',subjectId:'religion',topicId:'consultation',learningOutcomeId:'apply-consultation-to-shared-decision',
    context:'Bir öğrenci kulübü gezi yeri seçecektir. Başkan yalnız kendi isteğini açıklayıp oylamayı kapatmak yerine güvenlik, maliyet ve erişim verilerini paylaşır; üyelerin görüşlerini dinler.',prompt:'Bu yaklaşımın temel değeri hangisidir?',answer:'İstişare ederek ortak kararı bilgi ve farklı görüşlerle güçlendirmek',
    distractors:[
      {text:'Kararı geciktirmek için herkesin aynı şeyi söylemesini beklemek',misconceptionId:'religion:consultation-as-unanimity-delay',why:'İstişareyi görüş alma yerine sonsuz erteleme ve tam oybirliği şartı sanır.',constructionRule:'require-unanimity-and-delay'},
      {text:'Başkanın sorumluluğunu üyelerin üzerine tamamen bırakmak',misconceptionId:'religion:consultation-as-abdication',why:'Görüş almakla karar sorumluluğunu terk etmeyi birbirine karıştırır.',constructionRule:'replace-consultation-with-abdication'},
      {text:'Yalnız çoğunluğun isteğini dinleyip güvenlik verilerini yok saymak',misconceptionId:'religion:majority-without-evidence',why:'İstişarenin bilgi ve gerekçe boyutunu yalnız sayı üstünlüğüne indirger.',constructionRule:'use-vote-without-relevant-evidence'}
    ],explanation:'İstişare, ilgili bilgileri ve farklı görüşleri dinleyerek daha sorumlu ortak karar vermeyi sağlar.',cognitiveTraits:[...HARD,'decisionEvaluation'],reasoningStepCount:3,evidence:['Başkan ölçütleri paylaşır.','Üyelerin görüşleri dinlenir.','Karar tek kişinin isteğine indirgenmez.']
  }),
  definePremiumChoice({
    id:'religion-waste-01',gameId:'religion-practice',familyId:'premium-religion-waste',skeletonId:'premium-religion-waste:resource-use',subjectId:'religion',topicId:'israf',learningOutcomeId:'identify-waste-beyond-money',
    context:'Bir okulda musluklar gereksiz yere açık bırakılıyor, yenilebilir yemekler çöpe atılıyor ve kullanılabilir kâğıtlar tek yüzü boşken atılıyor.',prompt:'Bu örneklerin ortak yönü hangisidir?',answer:'İhtiyaç ve ölçü gözetmeden kaynakları tüketmek',
    distractors:[
      {text:'Yalnız parasal değeri yüksek eşyaları korumamak',misconceptionId:'religion:waste-only-expensive-items',why:'Su, gıda ve kâğıt gibi farklı kaynakların israf edilebileceğini daraltır.',constructionRule:'restrict-waste-to-expensive-goods'},
      {text:'Kaynakları paylaşmak için geçici olarak biriktirmek',misconceptionId:'religion:confuse-conservation-with-waste',why:'Örneklerde paylaşım amacıyla koruma değil, kullanılabilir kaynakları yok etme vardır.',constructionRule:'reverse-waste-as-saving'},
      {text:'Temizlik ve düzen sağlamak için zorunlu tüketim yapmak',misconceptionId:'religion:invent-necessity',why:'Gereksiz bırakma ve atma davranışlarına metinde zorunluluk ekler.',constructionRule:'justify-unnecessary-use-as-required'}
    ],explanation:'İsraf yalnız para harcamak değildir; su, gıda, zaman ve malzemeyi ihtiyaç ve ölçü gözetmeden tüketmektir.',cognitiveTraits:[...HARD,'conceptGeneralization'],reasoningStepCount:3,evidence:['Kaynaklar hâlâ kullanılabilir durumdadır.','Tüketim ihtiyaçtan kaynaklanmaz.','Üç örnek de ölçüsüz kayba yol açar.']
  }),
  definePremiumChoice({
    id:'religion-trust-property-01',gameId:'religion-practice',familyId:'premium-religion-trustworthiness',skeletonId:'premium-religion-trustworthiness:borrowed-item',subjectId:'religion',topicId:'emanet',learningOutcomeId:'apply-trustworthiness-to-borrowed-property',
    context:'Bir öğrenci ödünç aldığı tableti izinsiz başkasına veriyor ve oluşan hasarı sahibinden saklıyor.',prompt:'Emanet bilincine uygun düzeltme hangisidir?',answer:'Hasarı dürüstçe bildirmek, sorumluluk almak ve zararı gidermeye çalışmak',
    distractors:[
      {text:'Hasar küçükse kimse fark etmeden tableti geri bırakmak',misconceptionId:'religion:hide-small-harm',why:'Emaneti koruma ve dürüstlük sorumluluğunu hasarın büyüklüğüne bağlar.',constructionRule:'conceal-damage-if-small'},
      {text:'Tableti alan son kişiyi tek başına suçlayıp kendi izinsiz davranışını gizlemek',misconceptionId:'religion:shift-all-responsibility',why:'Kendi kararının sorumluluğunu başkasına aktarır.',constructionRule:'externalize-own-role'},
      {text:'Sahibine danışmadan yeni bir tablet seçip konuyu kapatmak',misconceptionId:'religion:repair-without-accountability',why:'Zararı telafi etmeye çalışsa bile dürüst bildirim ve izin boyutunu atlar.',constructionRule:'compensate-without-disclosure'}
    ],explanation:'Emanet bilinci koruma, izin, dürüstlük ve oluşan zararda sorumluluk alma boyutlarını birlikte gerektirir.',cognitiveTraits:[...HARD,'ethicalEvaluation'],reasoningStepCount:3,evidence:['Tablet başkasına izinsiz verilmiştir.','Hasar saklanmıştır.','Düzeltme dürüst bildirim ve telafi gerektirir.']
  }),
  definePremiumChoice({
    id:'religion-forgiveness-01',gameId:'religion-practice',familyId:'premium-religion-forgiveness',skeletonId:'premium-religion-forgiveness:repair-boundaries',subjectId:'religion',topicId:'forgiveness',learningOutcomeId:'distinguish-forgiveness-from-ignoring-harm',
    context:'Bir arkadaş verdiği sözü tutmayıp zarar oluşturuyor, sonra özür dileyerek zararı gidermek için somut adım öneriyor.',prompt:'Bağışlama ve sorumluluk açısından en dengeli yaklaşım hangisidir?',answer:'Özrü değerlendirmek, zararın giderilmesini istemek ve güveni davranışlara göre yeniden kurmak',
    distractors:[
      {text:'Bağışlamak için zararı ve tekrarlanma ihtimalini hiç konuşmamak',misconceptionId:'religion:forgiveness-as-denial',why:'Bağışlamayı zararı yok saymak ve sınır koymamakla karıştırır.',constructionRule:'erase-harm-and-boundaries'},
      {text:'Bir hata yapan kişinin değişme ihtimalini tamamen reddetmek',misconceptionId:'religion:permanent-condemnation',why:'Sorumluluk istemeyi değişim ve telafi olasılığını kapatmaya dönüştürür.',constructionRule:'deny-repair-possibility'},
      {text:'Özür söylenir söylenmez güveni önceki düzeye çıkarmak',misconceptionId:'religion:words-instantly-restore-trust',why:'Güvenin telafi ve tutarlı davranışlarla zaman içinde kurulacağını gözden kaçırır.',constructionRule:'equate-apology-with-complete-repair'}
    ],explanation:'Bağışlama, zararı inkâr etmek değildir; özür ve telafiyi değerlendirirken güveni yeni davranışlara göre aşamalı kurmaktır.',cognitiveTraits:[...HARD,'ethicalEvaluation'],reasoningStepCount:3,evidence:['Zarar gerçekleşmiştir.','Özür ve telafi önerisi vardır.','Güven için davranış kanıtı gerekir.']
  }),
  definePremiumChoice({
    id:'religion-freedom-responsibility-01',gameId:'religion-practice',familyId:'premium-religion-responsibility',skeletonId:'premium-religion-responsibility:choice-consequence',subjectId:'religion',topicId:'freedom-and-responsibility',learningOutcomeId:'connect-free-choice-with-consequence',
    context:'Bir öğrenci grup çalışmasında görevini yapmama hakkı olduğunu, sonucunun diğerlerini etkilemesinin önemli olmadığını savunuyor.',prompt:'Özgürlük ve sorumluluk ilişkisini en iyi açıklayan seçenek hangisidir?',answer:'Kişi seçim yapabilir; fakat seçimin başkaları üzerindeki öngörülebilir sonucundan sorumludur.',
    distractors:[
      {text:'Özgür olmak, seçimin bütün sonuçlarından bağımsız olmak demektir.',misconceptionId:'religion:freedom-without-consequence',why:'Seçim hakkını sorumluluk ve ortak haklardan koparır.',constructionRule:'separate-choice-from-consequence'},
      {text:'Grup kararı varsa bireyin düşünme ve tercih hakkı kalmaz.',misconceptionId:'religion:responsibility-eliminates-agency',why:'Ortak sorumluluğu bireysel iradenin tamamen yok olması gibi yorumlar.',constructionRule:'replace-coordination-with-no-choice'},
      {text:'Sonuç kötü olursa yalnız grup lideri sorumlu olur.',misconceptionId:'religion:assign-all-duty-to-leader',why:'Görevi kabul eden üyelerin kendi katkı sorumluluğunu liderliğe aktarır.',constructionRule:'externalize-shared-responsibility'}
    ],explanation:'Özgür irade seçim yapmayı sağlar; sorumluluk ise seçimin öngörülebilir etkilerini ve kabul edilen görevi üstlenmeyi gerektirir.',cognitiveTraits:[...HARD,'ethicalReasoning'],reasoningStepCount:3,evidence:['Öğrenci görev konusunda seçim yapmaktadır.','Görevin yapılmaması diğer üyeleri etkiler.','Seçim ile sonuç sorumluluğu birlikte değerlendirilir.']
  }),
  definePremiumChoice({
    id:'religion-help-dignity-01',gameId:'religion-practice',familyId:'premium-religion-solidarity',skeletonId:'premium-religion-solidarity:dignified-help',subjectId:'religion',topicId:'helping-and-solidarity',learningOutcomeId:'evaluate-help-that-protects-dignity',
    context:'Bir yardım etkinliğinde ihtiyaç sahiplerinin isimleri ve fotoğrafları izinsiz paylaşılmak isteniyor. Amaç daha çok bağış toplamak olarak açıklanıyor.',prompt:'Yardımlaşma ve insan onurunu birlikte koruyan yaklaşım hangisidir?',answer:'İzin ve mahremiyeti koruyarak ihtiyacı anonim ve doğrulanabilir biçimde anlatmak',
    distractors:[
      {text:'Bağış artacaksa kişisel bilgileri izinsiz yayımlamak',misconceptionId:'religion:good-end-justifies-harmful-means',why:'Yardım amacını mahremiyet ihlalini haklı çıkaran tek ölçüt yapar.',constructionRule:'justify-privacy-harm-by-donation-goal'},
      {text:'Mahremiyet riski bulunduğu için bütün yardımları durdurmak',misconceptionId:'religion:avoid-help-instead-of-safe-method',why:'Güvenli yöntem geliştirmek yerine dayanışmayı tamamen terk eder.',constructionRule:'replace-safeguard-with-inaction'},
      {text:'Yalnız yüksek bağış yapanlara ihtiyaç sahiplerinin bilgilerini vermek',misconceptionId:'religion:privacy-based-on-donor-status',why:'Mahremiyet hakkını bağış miktarına bağlı ayrıcalığa dönüştürür.',constructionRule:'sell-access-to-private-information'}
    ],explanation:'Yardım, ihtiyaç sahibinin onurunu ve mahremiyetini zedelemeden; izin, doğrulama ve anonim anlatım yöntemleriyle yürütülmelidir.',cognitiveTraits:[...HARD,'ethicalEvaluation'],reasoningStepCount:3,evidence:['Yardım amacı olumludur.','İzinsiz paylaşım mahremiyeti ihlal eder.','Anonim ve doğrulanmış anlatım iki değeri birlikte korur.']
  }),
  definePremiumChoice({
    id:'religion-prejudice-01',gameId:'religion-practice',familyId:'premium-religion-prejudice',skeletonId:'premium-religion-prejudice:evidence-before-judgment',subjectId:'religion',topicId:'prejudice-and-respect',learningOutcomeId:'distinguish-evidence-based-evaluation-from-prejudice',
    context:'Sınıfa yeni gelen öğrenci sessiz olduğu için bazı kişiler onun iş birliği yapmayacağını söylüyor. Grup çalışmasında ise görevlerini zamanında tamamlıyor ve arkadaşlarına destek oluyor.',prompt:'Bu olayın öğrettiği temel ilke hangisidir?',answer:'İnsanlar hakkında sınırlı ilk izlenimle değil, davranış ve kanıtla değerlendirme yapmak',
    distractors:[
      {text:'Sessiz kişilerin grup çalışmasına uygun olmadığını kabul etmek',misconceptionId:'religion:trait-stereotype',why:'Tek bir görünür özelliği bütün iş birliği davranışına geneller.',constructionRule:'generalize-personality-cue'},
      {text:'İlk yargı yanlış çıktığında yeni öğrenciyi her konuda kusursuz saymak',misconceptionId:'religion:replace-negative-with-positive-extreme',why:'Bir önyargıyı düzeltirken kanıtsız karşıt genellemeye geçer.',constructionRule:'swing-to-opposite-stereotype'},
      {text:'Grup başarısı için insanların farklılıklarını konuşmaktan kaçınmak',misconceptionId:'religion:avoid-dialogue-instead-of-respect',why:'Saygılı tanıma ve iletişim yerine farklılıkları görünmez kılmayı önerir.',constructionRule:'replace-respectful-inquiry-with-silence'}
    ],explanation:'Önyargı sınırlı bilgiyle peşin hüküm kurar. Sonraki davranışlar, öğrencinin iş birliği yaptığına dair gerçek kanıt sağlar.',cognitiveTraits:[...HARD,'evidenceEvaluation'],reasoningStepCount:3,evidence:['İlk yargı yalnız sessizliğe dayanır.','Öğrenci görevlerini tamamlar.','Arkadaşlarına destek olması ilk yargıyı çürütür.']
  })
];

export const PREMIUM_EXPANSION_PACK_E = createPremiumChoicePack({
  version:'2.4.0',sourceLabel:'Zihin Arenası Premium Soru Bankası',items:[...GEOMETRY_ITEMS,...HISTORY_ITEMS,...RELIGION_ITEMS]
});
export const PREMIUM_EXPANSION_GAME_IDS_E = PREMIUM_EXPANSION_PACK_E.gameIds;
export const generatePremiumExpansionRoundsE = PREMIUM_EXPANSION_PACK_E.generate;
export const premiumExpansionInventoryE = PREMIUM_EXPANSION_PACK_E.inventory;
