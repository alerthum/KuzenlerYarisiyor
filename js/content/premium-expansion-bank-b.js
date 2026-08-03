import { createPremiumChoicePack, definePremiumChoice } from './premium-question-core.js';

const HARD_TRAITS = ['multiStepInference', 'conditionEvaluation', 'informationLinking'];

const MATH_PROBLEM_ITEMS = [
  definePremiumChoice({
    id:'problem-ratio-books-01',gameId:'problem-hunter',familyId:'premium-problem-ratio',skeletonId:'premium-problem-ratio:part-whole',subjectId:'mathematics',topicId:'ratio',learningOutcomeId:'derive-parts-from-ratio-and-total',
    context:'Bir sınıf kitaplığındaki öykü ve bilim kitaplarının sayıları 3:5 oranındadır. Kitaplığa 12 öykü kitabı eklendiğinde iki türün sayısı eşit oluyor.',
    prompt:'Başlangıçta kitaplıkta toplam kaç kitap vardır?',answer:'48',
    distractors:[
      {text:'32',misconceptionId:'ratio:use-added-as-total-difference',why:'12 kitabı iki türün başlangıçtaki toplam farkı yerine oran parçalarının toplamıyla yanlış eşler.',constructionRule:'map-difference-to-eight-parts'},
      {text:'60',misconceptionId:'ratio:add-before-solving-scale',why:'Oran ölçeğini bulmadan 12’yi toplam kitap sayısına doğrudan ekler.',constructionRule:'premature-total-adjustment'},
      {text:'96',misconceptionId:'ratio:double-scale-factor',why:'5−3=2 parçanın 12’ye karşılık geldiğini bulduktan sonra ölçek katsayısını iki kez uygular.',constructionRule:'apply-scale-twice'}
    ],
    explanation:'Öykü 3k, bilim 5k olsun. 3k+12=5k olduğundan 2k=12 ve k=6’dır. Başlangıç toplamı 8k=48 kitaptır.',
    cognitiveTraits:[...HARD_TRAITS,'representationTransform'],reasoningStepCount:3,evidence:['Türler 3k ve 5k olarak gösterilir.','Eşitlik koşulu 3k+12=5k olur.','k=6 ve toplam 8k=48 bulunur.']
  }),
  definePremiumChoice({
    id:'problem-percent-two-step-01',gameId:'problem-hunter',familyId:'premium-problem-percent',skeletonId:'premium-problem-percent:successive-change',subjectId:'mathematics',topicId:'percentages',learningOutcomeId:'calculate-successive-percentage-changes',
    context:'Bir montun fiyatı önce %20 indirilmiş, ardından indirimli fiyat üzerinden %10 zamlanmıştır. Montun ilk fiyatı 1.000 TL’dir.',
    prompt:'Son fiyat kaç TL olur?',answer:'880 TL',
    distractors:[
      {text:'900 TL',misconceptionId:'percent:net-rates-subtracted',why:'Ardışık değişimleri aynı tabana uygulanıyormuş gibi %20−%10=%10 indirim kabul eder.',constructionRule:'subtract-percent-rates'},
      {text:'800 TL',misconceptionId:'percent:ignore-second-change',why:'İlk indirimi hesaplar ancak indirimli fiyat üzerindeki zammı uygulamaz.',constructionRule:'stop-after-first-change'},
      {text:'920 TL',misconceptionId:'percent:second-rate-on-original-base',why:'%10 zammı indirimli 800 TL yerine ilk 1.000 TL üzerinden hesaplar.',constructionRule:'reuse-original-base'}
    ],
    explanation:'Önce 1.000×0,80=800 TL olur. Zam indirimli fiyat üzerinden uygulanır: 800×1,10=880 TL.',
    cognitiveTraits:[...HARD_TRAITS,'usingIntermediateResultInNewDecision'],reasoningStepCount:2,evidence:['%20 indirim sonrası fiyat 800 TL’dir.','%10 zam 800 TL’nin 80 TL’sidir.','800+80=880 TL.']
  }),
  definePremiumChoice({
    id:'problem-average-change-01',gameId:'problem-hunter',familyId:'premium-problem-average',skeletonId:'premium-problem-average:add-score',subjectId:'mathematics',topicId:'averages',learningOutcomeId:'recover-total-and-update-average',
    context:'Bir öğrencinin ilk dört sınavının ortalaması 72’dir. Beşinci sınavdan sonra beş sınavın ortalaması 76 olmuştur.',
    prompt:'Öğrenci beşinci sınavdan kaç almıştır?',answer:'92',
    distractors:[
      {text:'80',misconceptionId:'average:add-average-difference-once',why:'Ortalama 4 arttığı için yeni notu 76+4 biçiminde hesaplar.',constructionRule:'treat-average-rise-as-score-rise'},
      {text:'88',misconceptionId:'average:multiply-difference-by-four-only',why:'Toplam artışı hesaplarken yeni sınavın ortalama üzerindeki etkisini eksik sayar.',constructionRule:'use-old-count-for-new-total-gap'},
      {text:'76',misconceptionId:'average:new-score-equals-new-average',why:'Yeni eklenen her değerin yeni ortalamaya eşit olması gerektiğini sanır.',constructionRule:'equate-added-value-to-resulting-mean'}
    ],
    explanation:'İlk dört sınav toplamı 4×72=288’dir. Beş sınav toplamı 5×76=380 olduğundan yeni not 380−288=92’dir.',
    cognitiveTraits:[...HARD_TRAITS,'usingIntermediateResultInNewDecision'],reasoningStepCount:3,evidence:['Eski toplam 288’dir.','Yeni toplam 380’dir.','Aradaki fark beşinci nottur: 92.']
  }),
  definePremiumChoice({
    id:'problem-fraction-tank-01',gameId:'problem-hunter',familyId:'premium-problem-fraction',skeletonId:'premium-problem-fraction:remaining-whole',subjectId:'mathematics',topicId:'fractions',learningOutcomeId:'apply-fraction-to-remaining-amount',
    context:'Bir su deposunun önce 2/5’i kullanılıyor. Kalan suyun 1/3’ü daha kullanıldığında depoda 24 litre su kalıyor.',
    prompt:'Depo başlangıçta kaç litre su alıyordu?',answer:'60 litre',
    distractors:[
      {text:'40 litre',misconceptionId:'fraction:add-used-fractions-different-bases',why:'2/5 ile 1/3’ü aynı bütünün parçalarıymış gibi doğrudan toplar.',constructionRule:'add-fractions-with-different-referents'},
      {text:'72 litre',misconceptionId:'fraction:remaining-as-one-third-original',why:'24 litrenin başlangıç miktarının 1/3’ü olduğunu varsayar.',constructionRule:'apply-second-fraction-to-original'},
      {text:'90 litre',misconceptionId:'fraction:invert-final-remaining-ratio',why:'Kalan oranı 2/5 yerine yanlış bir bileşik oranla ters çevirir.',constructionRule:'invert-wrong-composed-fraction'}
    ],
    explanation:'İlk kullanımdan sonra deponun 3/5’i kalır. Bunun 2/3’ü depoda kaldığına göre son miktar başlangıcın 3/5×2/3=2/5’idir. 2/5’i 24 litre olan depo 60 litredir.',
    cognitiveTraits:[...HARD_TRAITS,'representationTransform'],reasoningStepCount:3,evidence:['İlk aşama sonunda 3/5 kalır.','Kalanın 1/3’ü kullanılırsa 2/3’ü kalır.','Son oran 2/5 ve 24÷(2/5)=60.']
  }),
  definePremiumChoice({
    id:'problem-geometry-path-01',gameId:'problem-hunter',familyId:'premium-problem-geometry',skeletonId:'premium-problem-geometry:border-area',subjectId:'mathematics',topicId:'area',learningOutcomeId:'subtract-inner-area-from-outer-area',
    context:'Dikdörtgen biçimindeki bir bahçe 18 m uzunluğunda ve 12 m genişliğindedir. Bahçenin iç kenarları boyunca her yerde 1 m genişliğinde yürüyüş yolu yapılacaktır.',
    prompt:'Yürüyüş yolunun alanı kaç metrekaredir?',answer:'56 m²',
    distractors:[
      {text:'60 m²',misconceptionId:'geometry:perimeter-times-width-without-corner-overlap',why:'Çevreyi yol genişliğiyle çarpar ve köşelerde iki kez sayılan alanları düzeltmez.',constructionRule:'use-perimeter-strip-naively'},
      {text:'28 m²',misconceptionId:'geometry:subtract-one-side-only',why:'İç dikdörtgenin her boyutundan 2 m yerine yalnız 1 m çıkarır veya farkı yarımlar.',constructionRule:'remove-single-border-width'},
      {text:'160 m²',misconceptionId:'geometry:report-inner-area',why:'Yol alanı yerine 16×10 iç bölgenin alanını seçer.',constructionRule:'choose-complement-area'}
    ],
    explanation:'Toplam alan 18×12=216 m²’dir. Yol iki yandan 1’er metre aldığı için iç bölge 16×10=160 m² olur. Yol alanı 216−160=56 m²’dir.',
    cognitiveTraits:[...HARD_TRAITS,'representationTransform'],reasoningStepCount:3,evidence:['Dış alan 216 m².','İç boyutlar 16 m ve 10 m.','Alan farkı 56 m².']
  }),
  definePremiumChoice({
    id:'problem-speed-rest-01',gameId:'problem-hunter',familyId:'premium-problem-rate',skeletonId:'premium-problem-rate:travel-with-stop',subjectId:'mathematics',topicId:'speed-time',learningOutcomeId:'separate-travel-time-from-total-time',
    context:'Bir bisikletli 36 km’lik yolun ilk 18 km’sini saatte 12 km, kalanını saatte 9 km hızla gidiyor. Yol arasında 30 dakika dinleniyor.',
    prompt:'Yolculuk başlangıçtan bitişe toplam kaç saat sürer?',answer:'4 saat',
    distractors:[
      {text:'3,5 saat',misconceptionId:'rate:omit-rest-time',why:'İki sürüş süresini toplar ancak 30 dakikalık dinlenmeyi eklemez.',constructionRule:'exclude-nonmoving-time'},
      {text:'3 saat',misconceptionId:'rate:average-speeds-directly',why:'Hızları ortalayıp tüm yolu yaklaşık hızla bölerek parça sürelerini yok sayar.',constructionRule:'arithmetic-mean-of-speeds'},
      {text:'4,5 saat',misconceptionId:'rate:convert-half-hour-as-one-hour',why:'30 dakikayı 0,5 saat yerine 1 saat olarak ekler.',constructionRule:'misconvert-minutes-to-hours'}
    ],
    explanation:'İlk bölüm 18÷12=1,5 saat, ikinci bölüm 18÷9=2 saat sürer. Dinlenme 0,5 saattir; toplam 1,5+2+0,5=4 saattir.',
    cognitiveTraits:[...HARD_TRAITS,'usingIntermediateResultInNewDecision'],reasoningStepCount:3,evidence:['İlk sürüş 1,5 saat.','İkinci sürüş 2 saat.','Dinlenme 0,5 saat; toplam 4 saat.']
  }),
  definePremiumChoice({
    id:'problem-probability-without-replacement-01',gameId:'problem-hunter',familyId:'premium-problem-probability',skeletonId:'premium-problem-probability:without-replacement',subjectId:'mathematics',topicId:'probability',learningOutcomeId:'update-denominator-after-draw',
    context:'Bir torbada 3 kırmızı ve 2 mavi bilye vardır. Geri koymadan art arda iki bilye çekiliyor.',
    prompt:'İki bilyenin de kırmızı olma olasılığı nedir?',answer:'3/10',
    distractors:[
      {text:'9/25',misconceptionId:'probability:assume-replacement',why:'İlk çekilen bilye geri konmuş gibi ikinci olasılığı yine 3/5 alır.',constructionRule:'keep-denominator-constant'},
      {text:'6/25',misconceptionId:'probability:multiply-favorable-counts-over-original-square',why:'Payı 3×2 yaparken paydayı 5×5 tutup geri koymama koşulunu yarım uygular.',constructionRule:'update-numerator-not-denominator'},
      {text:'1/2',misconceptionId:'probability:count-colors-not-outcomes',why:'İki renk olduğu için her sonucun eş olasılıklı olduğunu varsayar.',constructionRule:'equate-category-count-with-probability'}
    ],
    explanation:'İlk kırmızı olasılığı 3/5’tir. Kırmızı çekilirse 4 bilyeden 2’si kırmızı kalır: 2/4. Çarpım 3/5×2/4=6/20=3/10’dur.',
    cognitiveTraits:[...HARD_TRAITS,'usingIntermediateResultInNewDecision'],reasoningStepCount:3,evidence:['İlk seçim 3/5.','Geri koymama sonrası ikinci seçim 2/4.','Çarpım 3/10.']
  }),
  definePremiumChoice({
    id:'problem-table-production-01',gameId:'problem-hunter',familyId:'premium-problem-data',skeletonId:'premium-problem-data:compare-unit-rate',subjectId:'mathematics',topicId:'data-interpretation',learningOutcomeId:'compare-rates-from-table-data',
    context:'A makinesi 4 saatte 180 parça, B makinesi 5 saatte 250 parça üretiyor. İkisi de aynı sabit hızla çalışmaya devam ediyor.',
    prompt:'Makineler birlikte 3 saatte toplam kaç parça üretir?',answer:'285 parça',
    distractors:[
      {text:'430 parça',misconceptionId:'data:add-given-totals-without-time-adjustment',why:'Tablodaki 4 ve 5 saatlik üretimleri doğrudan toplar.',constructionRule:'sum-noncomparable-totals'},
      {text:'258 parça',misconceptionId:'data:average-total-output',why:'Toplam 430 parçayı ortalama 5 saate veya yanlış ortak süreye bölüp ölçekler.',constructionRule:'average-raw-totals'},
      {text:'300 parça',misconceptionId:'data:round-unit-rates',why:'A’nın saatlik 45 üretimini 50’ye yuvarlayarak kesin veriyi bozar.',constructionRule:'premature-rate-rounding'}
    ],
    explanation:'A’nın saatlik üretimi 180÷4=45, B’nin 250÷5=50 parçadır. Birlikte saatte 95, üç saatte 95×3=285 parça üretirler.',
    cognitiveTraits:[...HARD_TRAITS,'usingIntermediateResultInNewDecision'],reasoningStepCount:3,evidence:['A hızı 45 parça/saat.','B hızı 50 parça/saat.','Birlikte 95×3=285 parça.']
  }),
  definePremiumChoice({
    id:'problem-integer-elevation-01',gameId:'problem-hunter',familyId:'premium-problem-integers',skeletonId:'premium-problem-integers:net-change',subjectId:'mathematics',topicId:'integers',learningOutcomeId:'track-signed-changes-from-reference',
    context:'Bir dalgıç deniz seviyesinin 18 metre altındadır. Önce 7 metre yükseliyor, sonra bulunduğu yerden 12 metre daha aşağı iniyor.',
    prompt:'Dalgıcın son konumu deniz seviyesine göre nedir?',answer:'23 metre aşağıda',
    distractors:[
      {text:'13 metre aşağıda',misconceptionId:'integer:subtract-both-magnitudes',why:'İkinci hareketin aşağı yönünü yükselme gibi ele alır.',constructionRule:'treat-negative-change-as-positive'},
      {text:'37 metre aşağıda',misconceptionId:'integer:add-all-distances',why:'Yükselme hareketini de derinliği artırıyormuş gibi toplar.',constructionRule:'ignore-direction-sign'},
      {text:'1 metre yukarıda',misconceptionId:'integer:use-unsigned-sequential-difference',why:'18−7−12 işlemini yön ve referans işaretleri olmadan yorumlar.',constructionRule:'drop-reference-sign'}
    ],
    explanation:'Başlangıç −18 metredir. 7 metre yükselince −11, 12 metre aşağı inince −23 olur; yani 23 metre aşağıdadır.',
    cognitiveTraits:[...HARD_TRAITS,'representationTransform'],reasoningStepCount:3,evidence:['Başlangıç konumu −18.','Yükselme sonrası −11.','Aşağı iniş sonrası −23.']
  }),
  definePremiumChoice({
    id:'problem-mixture-ratio-01',gameId:'problem-hunter',familyId:'premium-problem-mixture',skeletonId:'premium-problem-mixture:concentration',subjectId:'mathematics',topicId:'ratio',learningOutcomeId:'preserve-component-amount-when-diluting',
    context:'Şeker oranı %25 olan 400 gramlık bir karışıma yalnız su eklenerek şeker oranı %20’ye düşürülüyor.',
    prompt:'Kaç gram su eklenmiştir?',answer:'100 gram',
    distractors:[
      {text:'20 gram',misconceptionId:'mixture:subtract-percent-as-mass',why:'Yüzde farkı olan 5’i doğrudan veya 400’ün %5’i olarak eklenen su sanır.',constructionRule:'convert-percentage-point-to-added-mass'},
      {text:'80 gram',misconceptionId:'mixture:take-target-percent-of-original',why:'400 gramın %20’sini su miktarı olarak yorumlar.',constructionRule:'use-target-rate-as-addition'},
      {text:'125 gram',misconceptionId:'mixture:percent-increase-from-sugar-mass',why:'Şeker miktarı sabitken yeni toplamı yanlış oransal artışla kurar.',constructionRule:'apply-rate-change-to-component'}
    ],
    explanation:'Başlangıç şeker miktarı 400×0,25=100 gramdır ve değişmez. 100 gram yeni toplamın %20’si ise toplam 500 gramdır. Eklenen su 500−400=100 gramdır.',
    cognitiveTraits:[...HARD_TRAITS,'usingIntermediateResultInNewDecision'],reasoningStepCount:3,evidence:['Şeker miktarı 100 gramdır.','Yeni toplam 100÷0,20=500 gramdır.','Eklenen su 100 gramdır.']
  })
];

const MEANING_ITEMS = [
  definePremiumChoice({
    id:'meaning-ince-hesap-01',gameId:'meaning-hunt',familyId:'premium-meaning-context',skeletonId:'premium-meaning-context:figurative-adjective',subjectId:'turkish',topicId:'contextual-meaning',learningOutcomeId:'infer-figurative-adjective-from-context',
    context:'Planı hazırlayan ekip, maliyetleri ve olası gecikmeleri tek tek hesapladı; hiçbir ayrıntıyı gözden kaçırmadı. Müdür bu çalışmayı “ince bir hesap” olarak nitelendirdi.',
    prompt:'“İnce” sözcüğü bu cümlede hangi anlamda kullanılmıştır?',answer:'Ayrıntılı ve özenli',
    distractors:[
      {text:'Kalınlığı az',misconceptionId:'meaning:choose-literal-physical-sense',why:'Sözcüğün en yaygın fiziksel anlamını bağlamdaki planlama işine taşır.',constructionRule:'literalize-figurative-adjective'},
      {text:'Kırılgan ve dayanıksız',misconceptionId:'meaning:select-associated-physical-quality',why:'İncelikle ilişkilendirilen kırılganlık çağrışımını metinde kanıt olmadan seçer.',constructionRule:'choose-associated-not-contextual-sense'},
      {text:'Gizli ve anlaşılmaz',misconceptionId:'meaning:confuse-subtle-with-secret',why:'Ayrıntılı düşünmeyi gizlilik veya anlaşılmazlıkla karıştırır.',constructionRule:'replace-careful-with-obscure'}
    ],explanation:'Maliyet ve gecikmelerin tek tek incelenmesi, “ince” sözcüğünün ayrıntılı ve özenli çalışma anlamında kullanıldığını gösterir.',
    cognitiveTraits:[...HARD_TRAITS,'contextInference'],reasoningStepCount:2,evidence:['Ekip bütün ayrıntıları tek tek hesaplamıştır.','Hiçbir ayrıntı gözden kaçırılmamıştır.']
  }),
  definePremiumChoice({
    id:'meaning-agir-ilerlemek-01',gameId:'meaning-hunt',familyId:'premium-meaning-context',skeletonId:'premium-meaning-context:process-adjective',subjectId:'turkish',topicId:'contextual-meaning',learningOutcomeId:'infer-process-meaning-from-clues',
    context:'Taraflar her maddeyi uzun uzun tartışıyor, küçük bir karar için bile saatler harcıyordu. Bu yüzden görüşmeler ağır ilerliyordu.',
    prompt:'“Ağır ilerlemek” sözüyle anlatılmak istenen nedir?',answer:'Yavaş ve güçlükle sürmek',
    distractors:[
      {text:'Önemli konuları ele almak',misconceptionId:'meaning:confuse-serious-with-slow',why:'“Ağır” sözcüğünün ciddi anlamını seçer; metindeki zaman ve ilerleme ipuçlarını kullanmaz.',constructionRule:'choose-valid-sense-wrong-context'},
      {text:'Yük taşırken yürümek',misconceptionId:'meaning:literalize-weight',why:'Görüşme sürecini fiziksel ağırlık ve hareket olarak yorumlar.',constructionRule:'convert-abstract-process-to-physical-load'},
      {text:'Sert bir üslupla devam etmek',misconceptionId:'meaning:confuse-slow-with-harsh',why:'Tartışmanın süresini iletişim tonuyla karıştırır.',constructionRule:'replace-pace-with-tone'}
    ],explanation:'Her kararın uzun sürmesi ve saatler harcanması, görüşmelerin yavaş ve güçlükle ilerlediğini gösterir.',
    cognitiveTraits:[...HARD_TRAITS,'contextInference'],reasoningStepCount:2,evidence:['Küçük kararlar bile saatler sürmektedir.','İlerleme hızına ilişkin açık zaman ipuçları vardır.']
  }),
  definePremiumChoice({
    id:'meaning-keskin-ayrim-01',gameId:'meaning-hunt',familyId:'premium-meaning-nuance',skeletonId:'premium-meaning-nuance:abstract-boundary',subjectId:'turkish',topicId:'figurative-language',learningOutcomeId:'distinguish-abstract-boundary-meaning',
    context:'Araştırma, iki grubun davranışları arasında karışmaya yer bırakmayan belirgin farklar olduğunu gösterdi. Yazar bu durumu “keskin bir ayrım” diye açıkladı.',
    prompt:'“Keskin” sözcüğü bu bağlamda neyi vurgular?',answer:'Ayrımın belirgin ve net oluşunu',
    distractors:[
      {text:'Ayrımın insanları incitmesini',misconceptionId:'meaning:transfer-cutting-effect',why:'Keskinliğin fiziksel incitme çağrışımını soyut farka taşır.',constructionRule:'map-physical-effect-to-abstract-context'},
      {text:'Ayrımın kısa süreli oluşunu',misconceptionId:'meaning:invent-time-feature',why:'Metinde süreye ilişkin kanıt olmadığı hâlde geçicilik anlamı ekler.',constructionRule:'add-unsupported-temporal-sense'},
      {text:'Ayrımın sesli biçimde açıklanmasını',misconceptionId:'meaning:confuse-sharp-with-loud',why:'Keskin ses çağrışımını düşünce ayrımına uygular.',constructionRule:'select-cross-domain-sense'}
    ],explanation:'“Karışmaya yer bırakmayan belirgin farklar” ifadesi, keskin sözcüğünün net ve açık ayrım anlamını destekler.',
    cognitiveTraits:[...HARD_TRAITS,'evidenceSelection'],reasoningStepCount:2,evidence:['Gruplar arasında belirgin fark vardır.','Karışmaya yer bırakmadığı belirtilmiştir.']
  }),
  definePremiumChoice({
    id:'meaning-sig-degerlendirme-01',gameId:'meaning-hunt',familyId:'premium-meaning-evaluation',skeletonId:'premium-meaning-evaluation:depth-metaphor',subjectId:'turkish',topicId:'figurative-language',learningOutcomeId:'infer-depth-metaphor-in-evaluation',
    context:'Yazı yalnız olayın görünen yönlerini sıralıyor; nedenleri, sonuçları ve karşı görüşleri hiç incelemiyordu. Eleştirmen bu değerlendirmeyi “sığ” buldu.',
    prompt:'“Sığ” sözcüğü burada hangi anlamdadır?',answer:'Yüzeysel ve derinlikten yoksun',
    distractors:[
      {text:'Kolay okunur ve kısa',misconceptionId:'meaning:equate-shallow-with-short',why:'Metnin kısa veya kolay olduğuna dair kanıt olmadan yüzeyselliği uzunlukla karıştırır.',constructionRule:'replace-depth-with-length'},
      {text:'Yanlış bilgilerle dolu',misconceptionId:'meaning:equate-lack-depth-with-factual-error',why:'Neden ve karşı görüş eksikliğini bilgi yanlışlığı olarak yorumlar.',constructionRule:'replace-analysis-gap-with-fact-error'},
      {text:'Duygusal ve etkileyici',misconceptionId:'meaning:choose-unrelated-style-quality',why:'Değerlendirmenin kapsamı yerine duygusal etkisine ilişkin kanıtsız özellik seçer.',constructionRule:'switch-analysis-depth-to-emotion'}
    ],explanation:'Yalnız görünen yönleri sıralaması ve neden–sonuçları incelememesi, değerlendirmenin yüzeysel olduğunu gösterir.',
    cognitiveTraits:[...HARD_TRAITS,'contextInference'],reasoningStepCount:2,evidence:['Nedenler ve sonuçlar incelenmemiştir.','Karşı görüşlere yer verilmemiştir.']
  }),
  definePremiumChoice({
    id:'meaning-kok-salmak-01',gameId:'meaning-hunt',familyId:'premium-meaning-idiom',skeletonId:'premium-meaning-idiom:establish',subjectId:'turkish',topicId:'idioms',learningOutcomeId:'infer-idiom-from-development-context',
    context:'Başlangıçta yalnız birkaç kişinin katıldığı okuma kulübü, yıllar içinde farklı sınıflara yayıldı ve okulun vazgeçilmez etkinliklerinden biri oldu. Kulüp okulda kök saldı.',
    prompt:'“Kök salmak” sözü bu parçada hangi anlamı taşır?',answer:'Yerleşip kalıcı hâle gelmek',
    distractors:[
      {text:'Bahçecilik çalışmasına başlamak',misconceptionId:'meaning:literalize-idiom',why:'Kulüp bağlamını göz ardı ederek bitki kökü anlamını seçer.',constructionRule:'literal-reading-of-idiom'},
      {text:'Katılımcı sayısını azaltmak',misconceptionId:'meaning:reverse-growth-clue',why:'Farklı sınıflara yayılma ve vazgeçilmez olma ipuçlarının tersine sonuç çıkarır.',constructionRule:'reverse-context-development'},
      {text:'Eski yöntemleri değiştirmek',misconceptionId:'meaning:confuse-establishment-with-reform',why:'Kalıcılaşmayı yenilenme veya yöntem değişikliğiyle karıştırır.',constructionRule:'replace-stability-with-change'}
    ],explanation:'Kulübün yıllar içinde yayılması ve vazgeçilmez olması, okulda yerleşip kalıcı hâle geldiğini gösterir.',
    cognitiveTraits:[...HARD_TRAITS,'contextInference'],reasoningStepCount:2,evidence:['Kulüp yıllar içinde yayılmıştır.','Okulun vazgeçilmez etkinliği olmuştur.']
  }),
  definePremiumChoice({
    id:'meaning-isik-tutmak-01',gameId:'meaning-hunt',familyId:'premium-meaning-idiom',skeletonId:'premium-meaning-idiom:clarify',subjectId:'turkish',topicId:'idioms',learningOutcomeId:'infer-clarification-idiom',
    context:'Yeni bulunan mektuplar, yazarın romanı hangi koşullarda kaleme aldığını ve bazı karakterleri kimlerden esinlenerek oluşturduğunu açıkladı. Mektuplar eserin oluşumuna ışık tuttu.',
    prompt:'“Işık tutmak” sözüyle anlatılan nedir?',answer:'Bir konunun anlaşılmasını kolaylaştırmak',
    distractors:[
      {text:'Eseri daha ünlü hâle getirmek',misconceptionId:'meaning:confuse-clarity-with-publicity',why:'Açıklayıcı bilgi sağlamayı görünürlük ve ün artışıyla karıştırır.',constructionRule:'replace-understanding-with-promotion'},
      {text:'Mektupları fiziksel olarak aydınlatmak',misconceptionId:'meaning:literalize-light',why:'Soyut açıklama bağlamında ışığın gerçek anlamını seçer.',constructionRule:'literal-reading-of-metaphor'},
      {text:'Romanın eksik bölümlerini tamamlamak',misconceptionId:'meaning:confuse-explanation-with-completion',why:'Oluşum koşullarını açıklamayı metne yeni bölüm eklemek gibi yorumlar.',constructionRule:'replace-contextual-explanation-with-editing'}
    ],explanation:'Mektuplar bilinmeyen oluşum koşullarını açıkladığı için eserin anlaşılmasını kolaylaştırmıştır.',
    cognitiveTraits:[...HARD_TRAITS,'contextInference'],reasoningStepCount:2,evidence:['Mektuplar yazım koşullarını açıklamıştır.','Karakterlerin esin kaynaklarını göstermiştir.']
  }),
  definePremiumChoice({
    id:'meaning-golge-dusurmek-01',gameId:'meaning-hunt',familyId:'premium-meaning-idiom',skeletonId:'premium-meaning-idiom:damage-credibility',subjectId:'turkish',topicId:'idioms',learningOutcomeId:'infer-negative-effect-on-credibility',
    context:'Araştırmanın sonuçları ilgi çekiciydi; ancak bazı verilerin kaynağının açıklanmaması çalışmanın güvenilirliği konusunda kuşku oluşturdu. Bu eksiklik araştırmaya gölge düşürdü.',
    prompt:'“Gölge düşürmek” sözü bu bağlamda ne anlama gelir?',answer:'Değerine veya güvenilirliğine zarar vermek',
    distractors:[
      {text:'Çalışmayı tamamen görünmez kılmak',misconceptionId:'meaning:overextend-shadow-metaphor',why:'Güvenilirlikte kuşku oluşmasını çalışmanın yok olması gibi aşırı yorumlar.',constructionRule:'intensify-metaphor-to-disappearance'},
      {text:'Araştırmayı daha ilgi çekici yapmak',misconceptionId:'meaning:reverse-negative-effect',why:'Metindeki kuşku ve eksiklik ifadelerine rağmen olumlu etki seçer.',constructionRule:'reverse-evaluation-polarity'},
      {text:'Verileri daha kısa biçimde sunmak',misconceptionId:'meaning:confuse-credibility-with-format',why:'Kaynak eksikliğini sunum uzunluğu veya biçimiyle ilişkilendirir.',constructionRule:'switch-trust-problem-to-format'}
    ],explanation:'Kaynağı açıklanmayan veriler çalışmanın güvenilirliğini azaltmıştır; gölge düşürmek burada değerine zarar vermek anlamındadır.',
    cognitiveTraits:[...HARD_TRAITS,'evaluation'],reasoningStepCount:2,evidence:['Veri kaynakları açıklanmamıştır.','Bu durum güvenilirlik kuşkusu oluşturmuştur.']
  }),
  definePremiumChoice({
    id:'meaning-islemek-topic-01',gameId:'meaning-hunt',familyId:'premium-meaning-polysemy',skeletonId:'premium-meaning-polysemy:topic-treatment',subjectId:'turkish',topicId:'polysemy',learningOutcomeId:'select-contextual-sense-among-polysemous-uses',
    context:'Belgesel, göçün yalnız ekonomik yönünü değil; aile ilişkileri ve kültürel değişim üzerindeki etkilerini de işliyor.',
    prompt:'“İşlemek” sözcüğü bu cümlede hangi anlamda kullanılmıştır?',answer:'Bir konuyu ele alıp anlatmak',
    distractors:[
      {text:'Bir maddeyi biçimlendirmek',misconceptionId:'meaning:choose-craft-sense',why:'Belgesel ve konu bağlamını görmezden gelerek fiziksel maddeyi işleme anlamını seçer.',constructionRule:'select-material-processing-sense'},
      {text:'Bir suçu gerçekleştirmek',misconceptionId:'meaning:choose-crime-sense',why:'Sözcüğün başka bir yaygın kullanımını bağlam kanıtı olmadan taşır.',constructionRule:'select-unrelated-common-sense'},
      {text:'Bir makinenin çalışması',misconceptionId:'meaning:choose-functioning-sense',why:'Belgeselin bir konuyu anlatmasını mekanik çalışma anlamıyla karıştırır.',constructionRule:'select-operation-sense'}
    ],explanation:'Belgeselin göçün farklı yönlerini anlatması, “işlemek” sözcüğünün bir konuyu ele almak anlamında kullanıldığını gösterir.',
    cognitiveTraits:[...HARD_TRAITS,'contextInference'],reasoningStepCount:2,evidence:['Belgesel göçün farklı yönlerine yer vermektedir.','Sözcük bir anlatım içeriğiyle birlikte kullanılmıştır.']
  }),
  definePremiumChoice({
    id:'meaning-risk-tasimak-01',gameId:'meaning-hunt',familyId:'premium-meaning-polysemy',skeletonId:'premium-meaning-polysemy:contain-possibility',subjectId:'turkish',topicId:'polysemy',learningOutcomeId:'infer-abstract-carry-meaning',
    context:'Plan zaman kazandırabilir; fakat güvenlik kontrolleri azaltılırsa ciddi hata riski taşıyor.',
    prompt:'“Risk taşımak” sözüyle anlatılmak istenen nedir?',answer:'Olumsuz bir sonucun gerçekleşme olasılığını barındırmak',
    distractors:[
      {text:'Riski fiziksel bir yük gibi bir yere götürmek',misconceptionId:'meaning:literalize-carry',why:'Soyut olasılığı fiziksel bir yük gibi taşımak anlamında yorumlar.',constructionRule:'literal-reading-of-abstract-verb'},
      {text:'Hatanın gerçekleşmesinin artık kaçınılmaz olması',misconceptionId:'meaning:confuse-risk-with-certainty',why:'Olasılık anlamını kaçınılmaz sonuç olarak büyütür.',constructionRule:'convert-possibility-to-certainty'},
      {text:'Planın sağladığı yararın riski karşılamaması',misconceptionId:'meaning:ignore-balanced-context',why:'Metindeki zaman kazandırma olasılığını yok sayıp riski tüm planın değersizliği olarak yorumlar.',constructionRule:'replace-risk-with-total-failure'}
    ],explanation:'Risk, hatanın kesin olduğu değil gerçekleşme olasılığının bulunduğu anlamına gelir; plan bu olasılığı barındırmaktadır.',
    cognitiveTraits:[...HARD_TRAITS,'modalReasoning'],reasoningStepCount:2,evidence:['Planın yarar sağlayabileceği belirtilmiştir.','Kontroller azalırsa hata olasılığı doğmaktadır.']
  }),
  definePremiumChoice({
    id:'meaning-umut-beslemek-01',gameId:'meaning-hunt',familyId:'premium-meaning-polysemy',skeletonId:'premium-meaning-polysemy:maintain-feeling',subjectId:'turkish',topicId:'polysemy',learningOutcomeId:'infer-abstract-nurture-meaning',
    context:'Takım ilk iki maçı kaybetmesine rağmen oyuncular eksiklerini giderirse finale çıkabileceklerine dair umut besliyordu.',
    prompt:'“Umut beslemek” ifadesi bu cümlede hangi anlamdadır?',answer:'Olumlu bir beklentiyi sürdürmek',
    distractors:[
      {text:'Bir canlıyı yiyecekle büyütmek',misconceptionId:'meaning:literalize-nurture',why:'“Beslemek” fiilinin fiziksel anlamını soyut duyguya uygular.',constructionRule:'literal-reading-of-emotion-verb'},
      {text:'Sonucun gerçekleştiğinden emin olmak',misconceptionId:'meaning:confuse-hope-with-certainty',why:'Umut ve olasılık durumunu kesin bilgiye dönüştürür.',constructionRule:'convert-expectation-to-certainty'},
      {text:'Yenilgileri önemsememek',misconceptionId:'meaning:confuse-hope-with-denial',why:'Eksikleri giderme koşulunu yok sayıp umudu gerçekleri görmezden gelme olarak yorumlar.',constructionRule:'replace-conditional-hope-with-denial'}
    ],explanation:'Oyuncular sonucu kesin bilmiyor; eksiklerini giderme koşuluna bağlı olumlu beklentilerini sürdürüyorlar.',
    cognitiveTraits:[...HARD_TRAITS,'modalReasoning'],reasoningStepCount:2,evidence:['Takım iki maç kaybetmiştir.','Final olasılığı eksikleri giderme koşuluna bağlanmıştır.']
  })
];

const SCIENCE_LAB_ITEMS = [
  definePremiumChoice({
    id:'science-physical-chemical-01',gameId:'science-lab',familyId:'premium-science-matter-change',skeletonId:'premium-science-matter-change:evidence-new-substance',subjectId:'science',topicId:'physical-chemical-change',learningOutcomeId:'distinguish-change-by-new-substance-evidence',
    context:'Demir tel büküldüğünde yalnız şekli değişiyor. Aynı tel nemli ortamda günlerce bekletildiğinde yüzeyinde turuncu-kahverengi, demirden farklı özellikte bir tabaka oluşuyor.',
    prompt:'İki olay için en doğru sınıflandırma hangisidir?',answer:'Bükülme fiziksel, paslanma kimyasal değişimdir.',
    distractors:[
      {text:'İki olay da fiziksel değişimdir.',misconceptionId:'science:appearance-change-always-physical',why:'Pas oluşumunda yeni madde meydana gelmesini yalnız görünüş değişimi sayar.',constructionRule:'ignore-new-substance-evidence'},
      {text:'İki olay da kimyasal değişimdir.',misconceptionId:'science:any-change-chemical',why:'Şekil değişimini madde kimliğinin değişmesiyle karıştırır.',constructionRule:'classify-all-change-as-chemical'},
      {text:'Bükülme kimyasal, paslanma fiziksel değişimdir.',misconceptionId:'science:reverse-change-types',why:'Geri döndürülebilirlik ve yeni madde kanıtlarını ters eşler.',constructionRule:'swap-physical-and-chemical-labels'}
    ],explanation:'Bükülmede demir yine demirdir; yalnız biçim değişir. Paslanmada demirden farklı özellikte yeni bir madde oluşur.',
    cognitiveTraits:[...HARD_TRAITS,'evidenceClassification'],reasoningStepCount:2,evidence:['Bükülmede yalnız şekil değişir.','Paslanmada farklı özellikte tabaka oluşur.']
  }),
  definePremiumChoice({
    id:'science-heat-temperature-01',gameId:'science-lab',familyId:'premium-science-heat',skeletonId:'premium-science-heat:equal-temperature-different-energy',subjectId:'science',topicId:'heat-temperature',learningOutcomeId:'distinguish-temperature-from-thermal-energy',
    context:'Aynı sıcaklıkta 200 mL ve 1.000 mL su bulunan iki kap vardır. İki kaptaki su da 60 °C’dir.',
    prompt:'Bu durumla ilgili hangi çıkarım doğrudur?',answer:'Sıcaklıkları eşittir; büyük kapta toplam ısıl enerji daha fazla olabilir.',
    distractors:[
      {text:'Büyük kapta daha çok su bulunduğu için sıcaklık da daha yüksektir.',misconceptionId:'science:more-mass-means-higher-temperature',why:'Madde miktarını sıcaklık göstergesiyle karıştırır.',constructionRule:'infer-temperature-from-volume'},
      {text:'Sıcaklıkları eşit olduğundan iki kaptaki toplam ısıl enerji de eşittir.',misconceptionId:'science:temperature-equals-total-energy',why:'Sıcaklığı madde miktarından bağımsız toplam enerji olarak yorumlar.',constructionRule:'equate-temperature-with-total-thermal-energy'},
      {text:'Küçük kapta daha az su bulunduğu için toplam ısıl enerji daha fazladır.',misconceptionId:'science:less-volume-means-hotter',why:'Verilen aynı sıcaklık bilgisini miktar üzerinden değiştirir.',constructionRule:'override-measured-temperature'}
    ],explanation:'Sıcaklık taneciklerin ortalama hareketiyle ilgilidir ve iki kapta aynıdır. Aynı maddede daha çok su, toplamda daha fazla enerji taşıyabilir.',
    cognitiveTraits:[...HARD_TRAITS,'conceptDistinction'],reasoningStepCount:3,evidence:['Her iki termometre 60 °C gösterir.','Büyük kapta daha fazla su ve daha fazla tanecik vardır.','Toplam enerji madde miktarına da bağlıdır.']
  }),
  definePremiumChoice({
    id:'science-pressure-area-01',gameId:'science-lab',familyId:'premium-science-pressure',skeletonId:'premium-science-pressure:force-same-area-change',subjectId:'science',topicId:'solid-pressure',learningOutcomeId:'relate-contact-area-to-pressure',
    context:'Özdeş iki tuğladan biri geniş yüzeyi, diğeri dar yüzeyi üzerine aynı yumuşak zemine bırakılıyor. Tuğlaların ağırlıkları eşittir.',
    prompt:'Zemindeki izlerle ilgili en uygun tahmin hangisidir?',answer:'Dar yüzeyde duran tuğla daha derin iz bırakır; basınç daha büyüktür.',
    distractors:[
      {text:'Geniş yüzeyde duran tuğla daha derin iz bırakır; basınç daha büyüktür.',misconceptionId:'science:larger-area-more-pressure',why:'Basıncın alanla ters ilişkisini, toplam temas büyüklüğüyle karıştırır.',constructionRule:'assume-pressure-increases-with-area'},
      {text:'İki tuğla aynı derinlikte iz bırakır; yalnız ağırlık basıncı belirler.',misconceptionId:'science:ignore-contact-area',why:'Basıncı yalnız kuvvete bağlayıp temas alanını hesaba katmaz.',constructionRule:'use-force-only'},
      {text:'Dar yüzeyde duran tuğla daha sığ iz bırakır; temas alanı daha küçüktür.',misconceptionId:'science:less-contact-less-effect',why:'Küçük temas alanının kuvveti yoğunlaştırdığını gözden kaçırır.',constructionRule:'equate-contact-area-with-total-effect'}
    ],explanation:'Ağırlıklar eşit olduğundan kuvvet aynıdır. Basınç kuvvet/alan olduğundan dar yüzeyde basınç daha büyük, iz daha derin olur.',
    cognitiveTraits:[...HARD_TRAITS,'representationTransform'],reasoningStepCount:3,evidence:['Kuvvetler eşittir.','Dar yüzeyin temas alanı küçüktür.','Aynı kuvvet küçük alanda daha büyük basınç yapar.']
  }),
  definePremiumChoice({
    id:'science-series-circuit-01',gameId:'science-lab',familyId:'premium-science-electricity',skeletonId:'premium-science-electricity:series-open-circuit',subjectId:'science',topicId:'electric-circuits',learningOutcomeId:'reason-about-series-circuit-continuity',
    context:'İki ampul bir pil ve anahtarla tek bir kapalı yol oluşturacak biçimde seri bağlanmıştır. Ampullerden biri yuvasından çıkarılıyor.',
    prompt:'Devrede ne olur ve neden?',answer:'Diğer ampul de söner; tek iletim yolu kesilmiştir.',
    distractors:[
      {text:'Diğer ampul daha parlak yanar; akım ona yönelir.',misconceptionId:'science:current-redirects-in-series',why:'Seri devrede alternatif yol varmış gibi akımın diğer ampule yöneldiğini varsayar.',constructionRule:'treat-series-as-parallel'},
      {text:'Diğer ampul aynı parlaklıkta yanar; her ampul pilden ayrı enerji alır.',misconceptionId:'science:independent-branches-in-series',why:'Tek yol üzerindeki elemanları bağımsız kollardaymış gibi yorumlar.',constructionRule:'assume-independent-supply'},
      {text:'Yalnız çıkarılan ampul söner; devre pil üzerinden tamamlanır.',misconceptionId:'science:bypass-missing-component',why:'Ampulün çıkarıldığı yerde oluşan açıklığın kendiliğinden iletken olduğunu sanır.',constructionRule:'ignore-open-gap'}
    ],explanation:'Seri devrede akımın izlediği tek yol vardır. Bir ampul çıkarılınca yol açılır ve hiçbir ampulden akım geçmez.',
    cognitiveTraits:[...HARD_TRAITS,'causalReasoning'],reasoningStepCount:2,evidence:['Devre tek iletim yoludur.','Ampul çıkarılınca yol kesilir.']
  }),
  definePremiumChoice({
    id:'science-friction-design-01',gameId:'science-lab',familyId:'premium-science-force',skeletonId:'premium-science-force:friction-design',subjectId:'science',topicId:'friction',learningOutcomeId:'choose-design-change-for-needed-friction',
    context:'Bir robot, eğimli ve pürüzsüz bir zeminde yukarı çıkarken tekerlekleri kayıyor. Motor gücü yeterli, ancak tekerlekler zemini kavrayamıyor.',
    prompt:'Kaymayı azaltmak için en uygun değişiklik hangisidir?',answer:'Tekerlek yüzeyini daha pürüzlü ve kavrayıcı yapmak.',
    distractors:[
      {text:'Tekerlek yüzeyini daha da düzleştirmek.',misconceptionId:'science:smoothness-increases-grip',why:'Pürüzsüzlüğün kaymayı azaltacağını sanarak sürtünme ilişkisini ters kurar.',constructionRule:'reverse-friction-surface-relation'},
      {text:'Robotun üzerindeki yükü tamamen kaldırmak.',misconceptionId:'science:change-weight-not-contact-property',why:'Asıl belirtilen kavrama sorununu yüzey özelliği yerine yalnız yükle çözmeye çalışır.',constructionRule:'target-secondary-variable'},
      {text:'Tekerleklerin dönme hızını artırmak.',misconceptionId:'science:more-speed-solves-slip',why:'Kayma varken hızı artırmanın tutunmayı iyileştireceğini varsayar.',constructionRule:'increase-motion-despite-insufficient-friction'}
    ],explanation:'Sorun motor gücü değil tekerlek–zemin arasındaki yetersiz sürtünmedir. Daha pürüzlü ve kavrayıcı yüzey sürtünmeyi artırır.',
    cognitiveTraits:[...HARD_TRAITS,'strategySelection'],reasoningStepCount:3,evidence:['Motor gücü yeterlidir.','Tekerlekler zemini kavrayamamaktadır.','Pürüzlülük sürtünmeyi artırır.']
  }),
  definePremiumChoice({
    id:'science-ecosystem-chain-01',gameId:'science-lab',familyId:'premium-science-ecosystem',skeletonId:'premium-science-ecosystem:population-effect',subjectId:'science',topicId:'ecosystems',learningOutcomeId:'predict-food-chain-population-change',
    context:'Bir ekosistemde ot → çekirge → kurbağa → yılan besin zinciri vardır. Bölgede çekirge sayısı hastalık nedeniyle uzun süre ciddi biçimde azalıyor; diğer koşullar başlangıçta değişmiyor.',
    prompt:'İlk dönemde en olası değişim hangisidir?',answer:'Ot miktarı artabilir, kurbağa sayısı azalabilir.',
    distractors:[
      {text:'Ot miktarı azalır, kurbağa sayısı artar.',misconceptionId:'science:reverse-food-chain-effects',why:'Çekirgenin otu tüketmesi ve kurbağaya besin olması ilişkilerini ters yorumlar.',constructionRule:'reverse-prey-resource-effects'},
      {text:'Ot ve kurbağa sayısı değişmez; yalnız çekirgeler etkilenir.',misconceptionId:'science:isolate-one-population',why:'Besin zincirindeki türler arası bağımlılığı yok sayar.',constructionRule:'ignore-ecosystem-interdependence'},
      {text:'Yılan sayısı hemen artar; daha az çekirge vardır.',misconceptionId:'science:unlinked-predator-increase',why:'Dolaylı besin azalmasına rağmen üst tüketicinin artacağını varsayar.',constructionRule:'predict-opposite-top-predator-response'}
    ],explanation:'Daha az çekirge daha az ot tüketir; ot artabilir. Kurbağaların temel besini azaldığı için kurbağa sayısı düşebilir.',
    cognitiveTraits:[...HARD_TRAITS,'causalChain'],reasoningStepCount:3,evidence:['Çekirge otu tüketir.','Kurbağa çekirgeyle beslenir.','Çekirge azalması iki komşu basamağı farklı yönde etkiler.']
  }),
  definePremiumChoice({
    id:'science-photosynthesis-control-01',gameId:'science-lab',familyId:'premium-science-living',skeletonId:'premium-science-living:photosynthesis-variable',subjectId:'science',topicId:'photosynthesis',learningOutcomeId:'identify-missing-factor-in-plant-growth-claim',
    context:'İki özdeş bitkiden biri aydınlıkta, diğeri karanlıkta tutuluyor. İkisine eşit su veriliyor. Bir hafta sonra aydınlıktaki bitkinin daha fazla büyüdüğü görülüyor.',
    prompt:'Bu deney en doğrudan hangi sonucu destekler?',answer:'Işık, bu koşullarda büyümeyi etkileyen değişkenlerden biridir.',
    distractors:[
      {text:'Işık, bitkinin büyümesini belirleyen tek değişkendir.',misconceptionId:'science:single-factor-exclusive-cause',why:'Deney yalnız ışığın etkisini sınadığı hâlde büyümeyi tek nedene bağlar.',constructionRule:'promote-tested-factor-to-only-cause'},
      {text:'Aydınlık ortamda bitkiye verilen su miktarı kendiliğinden artmıştır.',misconceptionId:'science:overgeneralize-one-week-result',why:'Kontrol edilen su miktarını, ışık koşulunun değiştirdiği yeni bir değişken gibi yorumlar.',constructionRule:'invent-mediated-water-change'},
      {text:'Karanlıktaki bitkinin az büyümesi, su eksikliği yaşadığını kanıtlar.',misconceptionId:'science:contradict-controlled-variable',why:'Eşit verilen suyu göz ardı ederek büyüme farkını su eksikliğine bağlar.',constructionRule:'attribute-outcome-to-controlled-variable'}
    ],explanation:'Bitkiler özdeş ve su eşittir; değiştirilen temel koşul ışıktır. Bu nedenle gözlenen büyüme farkı ışığın etkisini destekler, tek neden olduğunu kanıtlamaz.',
    cognitiveTraits:[...HARD_TRAITS,'hypothesisEvaluation'],reasoningStepCount:3,evidence:['Bitkiler özdeştir.','Su miktarı eşittir.','Temel fark ışık koşuludur.']
  }),
  definePremiumChoice({
    id:'science-moon-phase-01',gameId:'science-lab',familyId:'premium-science-earth-space',skeletonId:'premium-science-earth-space:moon-light',subjectId:'science',topicId:'moon-phases',learningOutcomeId:'explain-phases-by-relative-position',
    context:'Ay’ın farklı gecelerde farklı biçimlerde görünmesi gözleniyor. Ay kendi ışığını üretmiyor; Güneş’ten aldığı ışığı yansıtıyor.',
    prompt:'Ay’ın evrelerinin temel nedeni hangisidir?',answer:'Ay dolandıkça aydınlık yüzünün Dünya’dan görülen bölümü değişir.',
    distractors:[
      {text:'Dünya’nın gölgesi her gece Ay’ın başka bir bölümünü örter.',misconceptionId:'science:phases-are-earth-shadow',why:'Normal evreleri yalnız Ay tutulmasında oluşan Dünya gölgesiyle karıştırır.',constructionRule:'equate-phases-with-eclipse'},
      {text:'Ay her gece farklı miktarda kendi ışığını üretir.',misconceptionId:'science:moon-produces-variable-light',why:'Ay’ın yansıtıcı olduğu verilen bilgisini ihlal eder.',constructionRule:'assign-own-light-to-moon'},
      {text:'Bulutlar Ay’ın görünen yüzünü düzenli sırayla kapatır.',misconceptionId:'science:weather-causes-regular-phases',why:'Düzenli astronomik döngüyü değişken hava olaylarıyla açıklar.',constructionRule:'replace-orbital-cycle-with-weather'}
    ],explanation:'Güneş Ay’ın yarısını sürekli aydınlatır. Ay Dünya çevresinde dolandıkça bu aydınlık yarının bize görünen oranı değişir ve evreler oluşur.',
    cognitiveTraits:[...HARD_TRAITS,'modelReasoning'],reasoningStepCount:3,evidence:['Ay ışığı yansıtır.','Ay Dünya çevresinde dolanır.','Görülen aydınlık bölüm konuma göre değişir.']
  }),
  definePremiumChoice({
    id:'science-density-float-01',gameId:'science-lab',familyId:'premium-science-density',skeletonId:'premium-science-density:same-volume-mass',subjectId:'science',topicId:'density',learningOutcomeId:'compare-density-from-equal-volume-masses',
    context:'Eşit hacimli K ve L cisimlerinin kütleleri sırasıyla 80 g ve 120 g’dır. Aynı sıvıya bırakıldıklarında K yüzüyor, L batıyor.',
    prompt:'Bu bilgilerle en uyumlu yorum hangisidir?',answer:'L, eşit hacimde daha çok kütle taşıdığı için K’den yoğundur.',
    distractors:[
      {text:'K, sıvının yüzeyinde kaldığı için L’den daha yoğundur.',misconceptionId:'science:floating-means-denser',why:'Yüzmeyi yüksek yoğunluk göstergesi olarak ters yorumlar.',constructionRule:'reverse-density-floating-relation'},
      {text:'Hacimleri eşit olduğu için K ve L’nin yoğunlukları da eşittir.',misconceptionId:'science:density-determined-by-volume-only',why:'Yoğunluk karşılaştırmasında kütle farkını göz ardı eder.',constructionRule:'use-volume-only'},
      {text:'L battığı için hacmi K’nin hacminden daha büyüktür.',misconceptionId:'science:contradict-equal-volume',why:'Cisimlerin eşit hacimli olduğu açık bilgisini değiştirir.',constructionRule:'invent-volume-difference'}
    ],explanation:'Yoğunluk kütle/hacimdir. Hacimler eşitken 120 g olan L’nin yoğunluğu 80 g olan K’den büyüktür; batma gözlemi de bununla uyumludur.',
    cognitiveTraits:[...HARD_TRAITS,'representationTransform'],reasoningStepCount:3,evidence:['Hacimler eşittir.','L’nin kütlesi daha büyüktür.','Eşit hacimde daha büyük kütle daha büyük yoğunluk demektir.']
  }),
  definePremiumChoice({
    id:'science-inheritance-environment-01',gameId:'science-lab',familyId:'premium-science-genetics',skeletonId:'premium-science-genetics:trait-environment',subjectId:'science',topicId:'heredity-environment',learningOutcomeId:'distinguish-inherited-trait-from-acquired-change',
    context:'Tek yumurta ikizi iki kardeşten biri düzenli ağırlık çalışması yapıyor, diğeri yapmıyor. Bir süre sonra kas gelişimleri farklılaşıyor; göz renkleri ise aynı kalıyor.',
    prompt:'Bu gözlem en iyi hangi sonucu destekler?',answer:'Bazı özellikler çevre ve yaşam biçiminden etkilenirken bazı kalıtsal özellikler değişmeden kalabilir.',
    distractors:[
      {text:'Egzersiz göz rengini de zamanla değiştirir.',misconceptionId:'science:environment-changes-all-traits',why:'Kas gelişimindeki çevresel etkiyi bütün özelliklere geneller.',constructionRule:'generalize-environment-to-all-traits'},
      {text:'İkizlerin bütün özellikleri her zaman aynı olmak zorundadır.',misconceptionId:'science:genes-determine-identical-outcomes',why:'Aynı genetik yapının çevresel etkileri ortadan kaldırdığını varsayar.',constructionRule:'ignore-environmental-variation'},
      {text:'Kas gelişimi yalnız kalıtımla belirlenir; egzersizin etkisi yoktur.',misconceptionId:'science:deny-observed-environment-effect',why:'Düzenli çalışma ile oluşan farkı göz ardı eder.',constructionRule:'attribute-acquired-change-only-to-genes'}
    ],explanation:'İkizlerin genetik yapıları çok benzerdir; yaşam biçimi farkı kas gelişimini etkileyebilir. Göz rengi gibi kalıtsal özellikler ise bu egzersizle değişmez.',
    cognitiveTraits:[...HARD_TRAITS,'evidenceClassification'],reasoningStepCount:3,evidence:['İkizlerin genetik yapıları benzerdir.','Egzersiz koşulları farklıdır.','Kas gelişimi farklılaşırken göz rengi aynı kalmıştır.']
  })
];

export const PREMIUM_EXPANSION_PACK_B=createPremiumChoicePack({
  version:'2.1.0',sourceLabel:'Zihin Arenası Premium Soru Bankası',items:[...MATH_PROBLEM_ITEMS,...MEANING_ITEMS,...SCIENCE_LAB_ITEMS]
});
export const PREMIUM_EXPANSION_GAME_IDS_B=PREMIUM_EXPANSION_PACK_B.gameIds;
export const generatePremiumExpansionRoundsB=PREMIUM_EXPANSION_PACK_B.generate;
export const premiumExpansionInventoryB=PREMIUM_EXPANSION_PACK_B.inventory;
