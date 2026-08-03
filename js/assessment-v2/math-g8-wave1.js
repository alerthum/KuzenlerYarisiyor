import { defineCanonicalQuestion } from './canonical-question-contract.js';
import { defineSubjectEngine } from './subject-engine-contract.js';
import { grade8MathOutcomeByCode } from '../curriculum/outcomes/tr-g8-matematik-2018.js';

const STYLE_REFERENCE_IDS = Object.freeze(['meb-mcq-writing-guide', 'oecd-pisa-2025-framework']);

const SPECS = Object.freeze([
  {
    id: 'math-g8-wave1-01-prime-factorization', outcomeCode: 'M.8.1.1.1', answer: '2^2*3^3*7',
    construct: ['prime-factorization', ['multiplicative-structure'], 'decompose-and-verify', ['prime-factor', 'exponent'], 'LGS_MEDIUM'],
    content: { context: 'Bir veri merkezinde 756 eş kayıt, dosya gruplarının büyüklükleri asal sayı olacak biçimde art arda bölünerek arşivlenecektir.', stem: '756 sayısının asal çarpanlarının üslü ifadelerle doğru gösterimi hangisidir?', model: { type: 'prime-factorization', n: 756 } },
    options: [['A', '2² · 3³ · 7', '2^2*3^3*7', null, '756; 2, 3 ve 7 asal çarpanlarına ayrıldığında üsler sırasıyla 2, 3 ve 1 olur.'], ['B', '2³ · 3² · 7', '2^3*3^2*7', 'swap-prime-exponents', '2 ve 3 asal çarpanlarının tekrar sayıları yer değiştirilmiştir; bu ifade 504 eder.'], ['C', '2² · 3 · 7²', '2^2*3*7^2', 'repeat-last-factor', '7’nin iki kez bulunduğu varsayılmıştır; oysa 756 yalnız bir kez 7’ye bölünür.'], ['D', '2 · 3³ · 14', '2*3^3*14', 'composite-factor-left', 'Çarpım 756 olsa da 14 asal değildir; gösterim tümüyle asal çarpanlardan oluşmalıdır.']],
    steps: [['756’yı en küçük asal sayıya böl', '756 ÷ 2 ÷ 2 = 189.', '2 ile kaç kez tam bölünebildiğini izle.'], ['kalanı 3 ve 7 ile ayır', '189 = 3³ · 7.', '189’u asal çarpanlarına ayır.'], ['üsleri tekrar sayıları olarak yaz', '756 = 2² · 3³ · 7.', 'Her asal çarpanın kaç kez kullanıldığını üs yap.']]
  },
  {
    id: 'math-g8-wave1-02-coprime-locks', outcomeCode: 'M.8.1.1.3', answer: '35&48',
    construct: ['coprime-detection', ['gcd-reasoning'], 'compare-common-factors', ['common-divisor', 'coprime'], 'LGS_MEDIUM_HIGH'],
    content: { context: 'Bir şifreleme sisteminde iki çarkın diş sayıları aralarında asal seçildiğinde çarklar ortak bir küçük döngüye kilitlenmeden çalışmaktadır.', stem: 'Aşağıdaki diş sayısı çiftlerinden hangisi aralarında asaldır?', model: { type: 'coprime-choice', pairs: { A:[35,48], B:[42,63], C:[45,75], D:[56,70] } } },
    options: [['A', '35 ve 48', '35&48', null, '35 = 5·7 ve 48 = 2⁴·3 olduğundan 1 dışında ortak bölenleri yoktur.'], ['B', '42 ve 63', '42&63', 'miss-common-21', '42 ve 63 sayılarının ortak bölenleri arasında 3, 7 ve 21 vardır.'], ['C', '45 ve 75', '45&75', 'miss-common-15', 'Her iki sayı da 15’e bölünür; bu nedenle aralarında asal değildir.'], ['D', '56 ve 70', '56&70', 'miss-common-14', 'Her iki sayı 14’e bölündüğü için ortak bölenleri 1’den fazladır.']],
    steps: [['her sayıyı asal çarpanlarına ayır', '35=5·7, 48=2⁴·3 biçimindedir.', 'İlk çiftte ortak asal çarpan ara.'], ['diğer çiftlerde ortak çarpanı kontrol et', '42-63 için 21, 45-75 için 15, 56-70 için 14 ortaktır.', 'Bir tek ortak bölen bile çifti eler.'], ['yalnız ortak böleni 1 olan çifti seç', '35 ve 48 aralarında asaldır.', 'Aralarında asal olmak iki sayının da asal olması demek değildir.']]
  },
  {
    id: 'math-g8-wave1-03-exponent-rules', outcomeCode: 'M.8.1.2.2', answer: '2^5',
    construct: ['exponent-rule-composition', ['equivalent-expression'], 'simplify-and-cross-check', ['same-base-rules', 'power-of-power'], 'LGS_HIGH'],
    content: { context: 'Bir sıkıştırma algoritmasının işlem yükü (2⁵ · 4³) / 8² ifadesiyle modellenmektedir.', stem: 'Bu ifade 2’nin kuvveti biçiminde sadeleştirildiğinde hangisi elde edilir?', model: { type: 'power-expression', terms: [[2,5,1],[4,3,1],[8,2,-1]], targetBase: 2 } },
    options: [['A', '2³', '2^3', 'subtract-all-exponents', '4 ve 8’in tabanları 2’ye çevrilmeden yalnız görünen üslerle işlem yapılmıştır.'], ['B', '2¹¹', '2^11', 'denominator-added', 'Paydadaki 2⁶ çıkarılmak yerine üslere eklenmiştir.'], ['C', '2⁷', '2^7', 'power-base-multiplied', '4³ ve 8² dönüşümlerinde taban ile üs çarpımı karıştırılmıştır.'], ['D', '2⁵', '2^5', null, '4³=2⁶ ve 8²=2⁶ olduğundan 2⁵·2⁶/2⁶=2⁵ kalır.']],
    steps: [['bütün tabanları 2’nin kuvvetine dönüştür', '4³=(2²)³=2⁶ ve 8²=(2³)²=2⁶.', 'Önce 4 ve 8’i 2 tabanında yaz.'], ['aynı tabanlı çarpma ve bölme kurallarını uygula', 'Üs 5+6−6 olur.', 'Çarpımda üsleri topla, bölümde çıkar.'], ['üssü hesapla', '5+6−6=5.', 'Son üsteki aritmetiği tamamla.']]
  },
  {
    id: 'math-g8-wave1-04-root-interval', outcomeCode: 'M.8.1.3.2', answer: '8-9-near8',
    construct: ['irrational-root-bounding', ['number-line-estimation'], 'bound-and-compare-distance', ['perfect-squares', 'square-root'], 'LGS_MEDIUM_HIGH'],
    content: { context: 'Kenar uzunluğu √70 metre olan kare biçimindeki bir sergi alanı planlanmaktadır.', stem: 'Bu kenar uzunluğunun bulunduğu aralık ve yakın olduğu doğal sayı hangi seçenekte doğru verilmiştir?', model: { type: 'root-bound', n: 70 } },
    options: [['A', '7 ile 8 arasında, 8’e daha yakın', '7-8-near8', 'use-neighbouring-integers', '70 sayısı 7² ile 8² arasında değil; 8²=64’ten büyüktür.'], ['B', '8 ile 9 arasında, 9’a daha yakın', '8-9-near9', 'compare-linear-not-square-distance', '70, 64’e 6; 81’e 11 uzaktadır. Bu nedenle √70, 8’e daha yakındır.'], ['C', '8 ile 9 arasında, 8’e daha yakın', '8-9-near8', null, '64<70<81 olduğundan 8<√70<9 ve 70 sayısı 64’e daha yakındır.'], ['D', '9 ile 10 arasında, 9’a daha yakın', '9-10-near9', 'ceil-from-seventy', '9²=81, 70’ten büyüktür; √70 henüz 9’a ulaşmaz.']],
    steps: [['70’i çevreleyen tam kareleri bul', '64=8² ve 81=9².', '70’ten küçük ve büyük en yakın tam kareler hangileri?'], ['karekök aralığını yaz', '8<√70<9.', 'Tam karelerin kareköklerini sınır olarak kullan.'], ['hangi sınıra yakın olduğunu karşılaştır', '70−64=6 ve 81−70=11.', '70 hangi tam kareye daha yakın?']]
  },
  {
    id: 'math-g8-wave1-05-radical-combination', outcomeCode: 'M.8.1.3.5', answer: '7sqrt3',
    construct: ['radical-like-term-combination', ['simplification'], 'simplify-group-and-check', ['radical-form', 'like-radicals'], 'LGS_HIGH'],
    content: { context: 'Bir mimari çizimde üç uzunluğun cebirsel toplamı 3√12 + 2√27 − √75 santimetre olarak verilmiştir.', stem: 'Bu toplamın en sade biçimi hangisidir?', model: { type: 'radical-linear-combination', terms: [[3,12],[2,27],[-1,75]] } },
    options: [['A', '4√3', '4sqrt3', 'combine-outside-only', 'Kök içleri sadeleştirilmeden dış katsayılar 3+2−1 biçiminde toplanmıştır.'], ['B', '4√114', '4sqrt114', 'add-radicands', 'Toplama ve çıkarma sırasında kök içleri doğrudan birleştirilemez; önce benzer köklü terimler oluşturulmalıdır.'], ['C', '12√3', '12sqrt3', 'ignore-subtraction-term', 'İlk iki terim doğru toplanmış ancak −√75 terimi hesaba katılmamıştır.'], ['D', '7√3', '7sqrt3', null, '√12=2√3, √27=3√3 ve √75=5√3 olduğundan 6√3+6√3−5√3=7√3 olur.']],
    steps: [['her kökü tam kare çarpanı kullanarak sadeleştir', '√12=2√3, √27=3√3, √75=5√3.', 'Kök içlerinden 4, 9 ve 25’i dışarı çıkar.'], ['dış katsayıları verilen katsayılarla çarp', '3·2√3 + 2·3√3 − 5√3.', 'Sadeleşen köklerin önündeki sayıları unutma.'], ['benzer köklü terimleri birleştir', '(6+6−5)√3=7√3.', 'Kök içi aynı olan terimlerin katsayılarını işle.']]
  },
  {
    id: 'math-g8-wave1-06-square-frame-identity', outcomeCode: 'M.8.2.1.3', answer: '6x+9',
    construct: ['identity-area-model', ['geometric-algebra'], 'model-expand-and-verify', ['square-identity', 'area-difference'], 'LGS_HIGH'],
    content: { context: 'Kenar uzunluğu x metre olan kare bir avlunun çevresine ekleme yapılarak dıştaki karenin kenarı x+3 metreye çıkarılıyor.', stem: 'Eklenen bölgenin alanını veren cebirsel ifade hangisidir?', model: { type: 'square-frame', inner: 'x', add: 3 } },
    options: [['A', '6x + 9', '6x+9', null, '(x+3)²−x²=x²+6x+9−x²=6x+9 olur.'], ['B', '3x + 9', '3x+9', 'one-side-strip-only', 'Karenin yalnız bir kenarındaki şerit hesaba katılmış, diğer bölgeler eksik bırakılmıştır.'], ['C', 'x² + 9', 'x^2+9', 'omit-middle-term', '(x+3)² açılımındaki 6x orta terimi atlanmıştır.'], ['D', '6x + 18', '6x+18', 'double-corner-area', 'Köşe karelerinin toplam alanı iki kez sayılmıştır; sabit alan 9’dur.']],
    steps: [['dış ve iç alanları yaz', 'Dış alan (x+3)², iç alan x²’dir.', 'Eklenen bölge dış kareden iç karenin çıkarılmasıdır.'], ['özdeşliği kullanarak dış alanı aç', '(x+3)²=x²+6x+9.', '2·x·3 orta terimini ekle.'], ['iç alanı çıkar', 'x²+6x+9−x²=6x+9.', 'Aynı x² terimleri birbirini götürür.']]
  },
  {
    id: 'math-g8-wave1-07-linear-equation', outcomeCode: 'M.8.2.2.1', answer: 15,
    construct: ['linear-equation-solving', ['equivalence-preservation'], 'form-solve-substitute', ['distribution', 'unknown-isolation'], 'LGS_MEDIUM_HIGH'],
    content: { context: 'Bir atölyede dört eş rafın her birine, kenarlarda üçer santimetre boşluk kalacak biçimde x−3 santimetrelik parça yerleştiriliyor. Bu toplam uzunluk, 2x+18 santimetrelik başka bir düzene eşittir.', stem: '4(x−3)=2x+18 eşitliğini sağlayan x değeri kaçtır?', model: { type: 'linear-equation', a: 4, b: -12, c: 2, d: 18 } },
    options: [['A', '9', 9, 'move-constant-wrong-direction', '−12 sabiti karşı tarafa geçirilirken işareti değiştirilmemiştir.'], ['B', '12', 12, 'divide-before-collecting', 'Benzer x terimleri ve sabitler tamamen toplanmadan ikiye bölünmüştür.'], ['C', '15', 15, null, '4x−12=2x+18, buradan 2x=30 ve x=15 bulunur.'], ['D', '21', 21, 'add-x-coefficients', '2x terimi karşı tarafa çıkarılmak yerine 4x ile toplanmıştır.']],
    steps: [['parantezi dağıt', '4x−12=2x+18.', '4 sayısını parantezin iki terimiyle de çarp.'], ['bilinmeyenli ve sabit terimleri karşılıklı topla', '2x=30.', '2x’i sola, −12’yi sağa aktar.'], ['katsayıya böl ve kontrol et', 'x=15; iki taraf da 48 olur.', 'Bulduğun değeri başlangıç denklemine koy.']]
  },
  {
    id: 'math-g8-wave1-08-inequality-direction', outcomeCode: 'M.8.2.3.3', answer: 'x>=-5',
    construct: ['linear-inequality-solving', ['order-reversal'], 'solve-and-test-boundary', ['negative-division', 'solution-set'], 'LGS_HIGH'],
    content: { context: 'Bir sıcaklık denetim modelinde güvenli çalışma koşulu −3x+12≤27 eşitsizliğiyle ifade edilmektedir.', stem: 'Bu eşitsizliğin çözüm kümesi hangisidir?', model: { type: 'linear-inequality', a: -3, b: 12, op: '<=', c: 27 } },
    options: [['A', 'x ≤ −5', 'x<=-5', 'forget-reverse-sign', 'Her iki taraf −3’e bölünürken eşitsizliğin yönü değiştirilmemiştir.'], ['B', 'x ≥ −5', 'x>=-5', null, '−3x≤15 ve negatif sayıya bölündüğünde yön değişerek x≥−5 olur.'], ['C', 'x ≥ 5', 'x>=5', 'lose-negative-bound', '15 sayısı −3’e bölünürken sonucun −5 olduğu gözden kaçırılmıştır.'], ['D', 'x ≤ 5', 'x<=5', 'two-sign-errors', 'Hem sınırın işareti hem de eşitsizliğin yönü yanlış belirlenmiştir.']],
    steps: [['sabit terimi diğer tarafa geçir', '−3x≤15.', 'Her iki taraftan 12 çıkar.'], ['iki tarafı −3’e böl', 'Negatif sayıya bölündüğü için ≤ işareti ≥ olur.', 'Negatifle bölmede yön değişimini unutma.'], ['sınır değerini ve bir örneği kontrol et', 'x=−5 eşitliği sağlar; x=0 da çözüm içindedir.', 'Çözüm yönünü bir sayı deneyerek doğrula.']]
  },
  {
    id: 'math-g8-wave1-09-triangle-inequality', outcomeCode: 'M.8.3.1.2', answer: 13,
    construct: ['triangle-inequality-enumeration', ['integer-range'], 'derive-bound-enumerate', ['triangle-inequality', 'strict-bound'], 'LGS_HIGH'],
    content: { context: 'Bir üçgen çerçevenin iki kenarı 7 cm ve 12 cm’dir. Üçüncü kenarın uzunluğu tam sayı santimetre olacaktır.', stem: 'Bu koşullarla üçgen oluşturabilecek kaç farklı üçüncü kenar uzunluğu vardır?', model: { type: 'triangle-third-side-count', a: 7, b: 12, integer: true } },
    options: [['A', '12', 12, 'exclude-one-valid-end-neighbour', '6 ile 18 arasındaki tam sayılardan biri gereksiz yere dışarıda bırakılmıştır.'], ['B', '13', 13, null, '|12−7|<x<12+7 olduğundan 5<x<19; x=6,…,18 olmak üzere 13 değer vardır.'], ['C', '14', 14, 'include-lower-equality', 'x=5 değeri de sayılmıştır; 5+7=12 olduğundan bu değer üçgen oluşturmaz.'], ['D', '15', 15, 'include-both-equalities', 'Hem x=5 hem x=19 dâhil edilmiştir; üçgen eşitsizliği sıkıdır.']],
    steps: [['üçüncü kenar için alt ve üst sınırı kur', '|12−7|<x<12+7.', 'Farktan büyük, toplamdan küçük olmalı.'], ['sayısal aralığı yaz', '5<x<19.', 'Eşitlik işaretleri yoktur.'], ['tam sayıları say', '6’dan 18’e kadar 13 tam sayı vardır.', 'Son−ilk+1 yöntemini kullan.']]
  },
  {
    id: 'math-g8-wave1-10-reflection-line', outcomeCode: 'M.8.3.2.2', answer: '(-2,-2)',
    construct: ['coordinate-reflection', ['distance-to-axis'], 'transform-and-check-invariant', ['reflection-line', 'coordinate-image'], 'LGS_MEDIUM_HIGH'],
    content: { context: 'Koordinat düzlemindeki P(4,−2) noktası x=1 doğrusu boyunca yerleştirilen aynaya göre yansıtılıyor.', stem: 'P noktasının görüntüsünün koordinatları hangisidir?', model: { type: 'reflection-vertical-line', point: [4,-2], lineX: 1 } },
    options: [['A', '(−4, −2)', '(-4,-2)', 'reflect-over-y-axis', 'Yansıma x=1 doğrusu yerine y eksenine göre yapılmıştır.'], ['B', '(−2, −2)', '(-2,-2)', null, 'P noktası x=1 doğrusunun 3 birim sağındadır; görüntüsü 3 birim solunda, x=−2’dedir ve y değişmez.'], ['C', '(4, 2)', '(4,2)', 'reflect-over-x-axis', 'Y koordinatının işareti değiştirilerek x eksenine göre yansıma yapılmıştır.'], ['D', '(2, −2)', '(2,-2)', 'move-to-line-not-across', 'Nokta aynanın öbür tarafına eş uzaklıkta geçirilmek yerine yalnız aynaya yaklaştırılmıştır.']],
    steps: [['noktanın aynaya yatay uzaklığını bul', '4−1=3 birim.', 'Dikey x=1 doğrusunda yalnız x koordinatı değişir.'], ['aynı uzaklığı doğrunun öbür tarafına taşı', '1−3=−2.', 'Aynadan sola 3 birim git.'], ['değişmeyen koordinatı koru', 'y=−2 kalır; görüntü (−2,−2).', 'Dikey yansımada y koordinatı aynıdır.']]
  },
  {
    id: 'math-g8-wave1-11-graph-interpretation', outcomeCode: 'M.8.4.1.1', answer: 'C',
    construct: ['multi-series-graph-interpretation', ['trend-and-total'], 'calculate-compare-justify', ['line-graph', 'multi-group-data'], 'LGS_HIGH'],
    content: { context: 'Bir okulun üç kulübüne dört ayda katılan yeni öğrenci sayıları şöyledir:\n\nAy | Bilim | Spor | Sanat\n1 | 18 | 24 | 12\n2 | 22 | 20 | 18\n3 | 26 | 16 | 24\n4 | 30 | 12 | 30', stem: 'Bu verilerin çizgi grafiği yorumlandığında aşağıdaki ifadelerden hangisi doğrudur?', model: { type: 'series-statements', series: { bilim:[18,22,26,30], spor:[24,20,16,12], sanat:[12,18,24,30] }, statements: { A:'sport-total-greater-science', B:'art-constant-increase-4', C:'science-and-art-equal-month4', D:'science-growth-greater-art' } } },
    options: [['A', 'Dört ayın toplamında spor kulübü, bilim kulübünden daha fazla yeni üye kazanmıştır.', 'A', 'compare-last-not-total', 'Spor ilk ay daha yüksek olsa da toplamı 72, bilim kulübünün toplamı 96’dır.'], ['B', 'Sanat kulübüne katılım her ay 4 öğrenci artmıştır.', 'B', 'assume-common-increment', 'Sanat kulübündeki artışlar 6, 6 ve 6’dır; 4 değildir.'], ['C', 'Dördüncü ay bilim ve sanat kulüplerine katılan yeni öğrenci sayıları eşittir.', 'C', null, 'Dördüncü ay her iki kulübün değeri de 30’dur.'], ['D', 'Bilim kulübünün ilk aydan son aya artışı, sanat kulübünün artışından fazladır.', 'D', 'compare-final-values-only', 'Bilim 12, sanat 18 artmıştır; son değerler eşit olsa da değişimler eşit değildir.']],
    steps: [['her ifadenin gerektirdiği karşılaştırmayı belirle', 'Toplam, artış miktarı ve tek ay değeri farklı işlemlerdir.', 'Şıkların aynı şeyi sormadığını fark et.'], ['tablodan gerekli fark ve toplamları hesapla', 'Bilim toplam 96, spor 72; sanat artışı her ay 6; son ay bilim=sanat=30.', 'Her şık için yalnız gerekli veriyi kullan.'], ['tek doğru ifadeyi seç', 'Yalnız C ifadesi verilerle tam uyuşur.', 'Bir şıkkı doğru bulunca diğerlerini de kontrol et.']]
  },
  {
    id: 'math-g8-wave1-12-probability-complement', outcomeCode: 'M.8.5.1.4', answer: '5/8',
    construct: ['probability-complement', ['probability-range'], 'complement-and-bound-check', ['complement-event', 'unit-interval'], 'LGS_MEDIUM_HIGH'],
    content: { context: 'Bir kalite sensörünün rastgele seçilen bir ürünü “yeniden inceleme gerekli” olarak işaretleme olasılığı 3/8’dir.', stem: 'Sensörün ürünü “yeniden inceleme gerekli değil” olarak işaretleme olasılığı kaçtır?', model: { type: 'probability-complement', pNum: 3, pDen: 8 } },
    options: [['A', '3/8', '3/8', 'repeat-event-probability', 'Verilen olayın olasılığı aynen tekrar edilmiştir; sorulan olay bunun tamamlayıcısıdır.'], ['B', '1/8', '1/8', 'subtract-numerators-only', 'Paydada 8 olası pay bulunurken kalan pay sayısı 8−3=5 olmalıdır.'], ['C', '8/3', '8/3', 'invert-probability', 'Kesir ters çevrilmiştir; 1’den büyük bir değer olasılık olamaz.'], ['D', '5/8', '5/8', null, 'Bir olay ile olmama olasılığının toplamı 1 olduğundan 1−3/8=5/8’dir.']],
    steps: [['olay ve tamamlayıcısının toplamını hatırla', 'P(A)+P(Ā)=1.', 'Sorulan, verilen olayın gerçekleşmemesidir.'], ['1’i aynı paydada yaz', '1=8/8.', 'Çıkarma için paydaları eşitle.'], ['tamamlayıcı olasılığı çıkar', '8/8−3/8=5/8.', 'Sonucun 0 ile 1 arasında olduğunu kontrol et.']]
  }
]);

function gcd(a,b){while(b){[a,b]=[b,a%b];}return Math.abs(a);}
function primeFactorString(n){const parts=[];let d=2;while(n>1){let count=0;while(n%d===0){n/=d;count++;}if(count)parts.push(`${d}^${count}`);d++;}return parts.join('*').replaceAll('^1','');}
function simplifyRadical(n){let outside=1,inside=n;for(let k=Math.floor(Math.sqrt(n));k>=2;k--){if(n%(k*k)===0){outside=k;inside=n/(k*k);break;}}return [outside,inside];}
function normalizeLinear(a,b,c,d){return (d-b)/(a-c);}
function solveModel(model){
  switch(model.type){
    case 'prime-factorization': return primeFactorString(model.n);
    case 'coprime-choice': return Object.entries(model.pairs).find(([,pair])=>gcd(pair[0],pair[1])===1)?.[1].join('&');
    case 'power-expression': {let exponent=0;for(const [base,power,sign] of model.terms){exponent+=Math.round(Math.log2(base))*power*sign;}return `2^${exponent}`;}
    case 'root-bound': {const low=Math.floor(Math.sqrt(model.n));const high=low+1;const near=model.n-low*low <= high*high-model.n?low:high;return `${low}-${high}-near${near}`;}
    case 'radical-linear-combination': {let total=0,inside=null;for(const [coefficient,n] of model.terms){const [outside,rad]=simplifyRadical(n);if(inside===null)inside=rad;if(rad!==inside)throw new Error('unlike radicals');total+=coefficient*outside;}return `${total}sqrt${inside}`;}
    case 'square-frame': return `${2*model.add}x+${model.add**2}`;
    case 'linear-equation': return normalizeLinear(model.a,model.b,model.c,model.d);
    case 'linear-inequality': {const bound=(model.c-model.b)/model.a;const reverse=model.a<0;const op=reverse?(model.op==='<='?'>=':'<='):model.op;return `x${op}${bound}`;}
    case 'triangle-third-side-count': {let count=0;for(let x=1;x<model.a+model.b;x++)if(Math.abs(model.a-model.b)<x&&x<model.a+model.b)count++;return count;}
    case 'reflection-vertical-line': return `(${2*model.lineX-model.point[0]},${model.point[1]})`;
    case 'series-statements': {const s=model.series;const valid={A:s.spor.reduce((a,b)=>a+b,0)>s.bilim.reduce((a,b)=>a+b,0),B:s.sanat.slice(1).every((v,i)=>v-s.sanat[i]===4),C:s.bilim[3]===s.sanat[3],D:s.bilim[3]-s.bilim[0]>s.sanat[3]-s.sanat[0]};return Object.keys(valid).find(k=>valid[k]);}
    case 'probability-complement': return `${model.pDen-model.pNum}/${model.pDen}`;
    default: throw new Error(`unknown math wave1 model ${model.type}`);
  }
}

function independentExpected(model){
  switch(model.type){
    case 'prime-factorization': {let value=model.n;const factors=[];for(let p=2;p<=model.n;p++){while(value%p===0){factors.push(p);value/=p;}}const counts=new Map();for(const f of factors)counts.set(f,(counts.get(f)||0)+1);return [...counts].map(([p,c])=>c===1?`${p}`:`${p}^${c}`).join('*');}
    case 'coprime-choice': return Object.values(model.pairs).find(([a,b])=>{for(let d=2;d<=Math.min(a,b);d++)if(a%d===0&&b%d===0)return false;return true;}).join('&');
    case 'power-expression': {const value=model.terms.reduce((acc,[base,power,sign])=>sign===1?acc*base**power:acc/base**power,1);return `2^${Math.round(Math.log2(value))}`;}
    case 'root-bound': {for(let k=0;k*k<=model.n;k++){if((k+1)*(k+1)>model.n){const near=Math.abs(Math.sqrt(model.n)-k)<=Math.abs(k+1-Math.sqrt(model.n))?k:k+1;return `${k}-${k+1}-near${near}`;}}break;}
    case 'radical-linear-combination': {const numeric=model.terms.reduce((sum,[c,n])=>sum+c*Math.sqrt(n),0);for(let c=-50;c<=50;c++)for(let r=1;r<=100;r++)if(Math.abs(c*Math.sqrt(r)-numeric)<1e-9&&Math.floor(Math.sqrt(r))**2!==r)return `${c}sqrt${r}`;break;}
    case 'square-frame': {const x=11;const area=(x+model.add)**2-x**2;return `${2*model.add}x+${area-2*model.add*x}`;}
    case 'linear-equation': {for(let x=-100;x<=100;x+=0.5)if(Math.abs(model.a*x+model.b-(model.c*x+model.d))<1e-9)return x;break;}
    case 'linear-inequality': {const boundary=(model.c-model.b)/model.a;const op=model.a<0?(model.op==='<='?'>=':'<='):model.op;return `x${op}${boundary}`;}
    case 'triangle-third-side-count': return Array.from({length:model.a+model.b+1},(_,x)=>x).filter(x=>Math.abs(model.a-model.b)<x&&x<model.a+model.b).length;
    case 'reflection-vertical-line': {const distance=model.point[0]-model.lineX;return `(${model.lineX-distance},${model.point[1]})`;}
    case 'series-statements': {const {bilim,spor,sanat}=model.series;const checks=[spor.reduce((a,b)=>a+b,0)>bilim.reduce((a,b)=>a+b,0),sanat.every((v,i)=>i===0||v-sanat[i-1]===4),bilim.at(-1)===sanat.at(-1),bilim.at(-1)-bilim[0]>sanat.at(-1)-sanat[0]];return ['A','B','C','D'][checks.findIndex(Boolean)];}
    case 'probability-complement': {const outcomes=Array(model.pDen).fill(false).map((_,i)=>i>=model.pNum);return `${outcomes.filter(Boolean).length}/${outcomes.length}`;}
    default: throw new Error(`unknown independent model ${model.type}`);
  }
}

function canonical(spec){
  const outcome=grade8MathOutcomeByCode(spec.outcomeCode);if(!outcome)throw new Error(`missing outcome ${spec.outcomeCode}`);
  const [primarySkill,secondarySkills,cognitiveProcess,knowledgeComponents,intendedDifficultyBand]=spec.construct;
  const options=spec.options.map(([id,text,value,misconceptionId,feedback])=>({id,text,value,misconceptionId,feedback,correct:String(value)===String(spec.answer)}));
  const answer=options.find(option=>option.correct);if(!answer)throw new Error(`${spec.id}: answer option missing`);
  return defineCanonicalQuestion({
    id:spec.id,
    curriculum:{country:'TR',schoolYear:outcome.schoolYear,programFamily:outcome.programFamily,grade:8,courseId:outcome.courseId,unitId:outcome.unitId,topicId:outcome.topicId,outcomeIds:[outcome.id],sourceIds:[outcome.sourceId]},
    construct:{primarySkill,secondarySkills,cognitiveProcess,knowledgeComponents,intendedDifficultyBand},
    content:{...spec.content,options:options.map(({id,text})=>({id,text})),optionValues:Object.fromEntries(options.map(option=>[option.id,option.value])),humanReview:{status:'NOT_MEASURED',batch:'G8_MATH_FULL_SCOPE_WAVE1_12',gameAdaptationAllowed:false}},
    itemFormat:'single-choice',responseModel:{optionIds:options.map(option=>option.id),optionCount:4},answerKey:{optionId:answer.id,value:answer.value},
    solutionGraph:spec.steps.map((step,index)=>({id:`s${index+1}`,action:step[0],dependsOn:index?[`s${index}`]:[],evidenceIds:[`calc-${index+1}`],evidence:step[1]})),
    hints:spec.steps.map((step,index)=>({level:index+1,text:step[2],revealsAnswer:false})),
    optionFeedback:options.map(option=>({optionId:option.id,correct:option.correct,misconceptionId:option.misconceptionId,text:option.feedback,supportingEvidenceIds:option.correct?['calculation-proof']:[],contradictionEvidenceIds:option.correct?[]:['calculation-proof']})),
    misconceptionIds:options.filter(option=>!option.correct).map(option=>option.misconceptionId),
    verifier:{solverId:'g8-math-full-scope-solver-v1',independentVerifierId:'g8-math-alternate-enumerative-verifier-v1',verified:true},
    styleProfile:{genre:'mathematical-model-and-reasoning',voice:'objective',sourceMode:'original-curriculum-aligned',rhetoricalMoves:['represent','calculate','verify','interpret']},
    provenance:{generatedFromSourceIds:[outcome.sourceId],styleReferenceIds:STYLE_REFERENCE_IDS},contentStatus:'HUMAN_REVIEW_REQUIRED'
  });
}

const ITEMS=Object.freeze(SPECS.map(canonical));
export const GRADE8_MATH_WAVE1_IDS=Object.freeze(ITEMS.map(item=>item.id));
export const GRADE8_MATH_WAVE1_OUTCOME_CODES=Object.freeze(SPECS.map(spec=>spec.outcomeCode));
export function buildGrade8MathWave1Questions(){return ITEMS;}

export const grade8MathWave1Engine=defineSubjectEngine({
  id:'grade8-math-full-scope-wave1-engine-v1',domain:'mathematics',supportedCourseIds:['matematik'],supportedItemFormats:['single-choice'],misconceptionCatalogId:'g8-math-full-scope-misconceptions-v1',styleCatalogId:'g8-math-model-reasoning-v1',
  plan:req=>({questionId:req.questionId,grade:req.grade,courseId:req.courseId}),
  generate:plan=>structuredClone(ITEMS.find(item=>item.id===plan.questionId)||(()=>{throw new Error(`unknown question ${plan.questionId}`)})()),
  solve:item=>{const value=solveModel(item.content.model);const option=Object.entries(item.content.optionValues).find(([,v])=>String(v)===String(value));if(!option)throw new Error(`${item.id}: no option for ${value}`);return {optionId:option[0],value};},
  verifyIndependent:(item,solved)=>String(independentExpected(item.content.model))===String(solved.value)&&solved.optionId===item.answerKey.optionId,
  explain:item=>item.solutionGraph,
  qualityAudit:item=>auditGrade8MathWave1Question(item)
});

export function auditGrade8MathWave1Question(item){
  const errors=[];
  if(item.content.options.length!==4)errors.push('option-count');
  if(item.hints.length!==3)errors.push('hint-count');
  if(item.optionFeedback.length!==4)errors.push('feedback-count');
  if(new Set(item.misconceptionIds).size!==3)errors.push('misconception-diversity');
  if(item.gameBindings.length)errors.push('game-binding-forbidden');
  if(item.content.humanReview.gameAdaptationAllowed!==false)errors.push('game-adaptation-open');
  if(item.content.humanReview.status!=='NOT_MEASURED')errors.push('human-review-status');
  try{const solved=grade8MathWave1Engine.solve(item);if(!grade8MathWave1Engine.verifyIndependent(item,solved))errors.push('independent-verification');}catch(error){errors.push(`solver:${error.message}`);}
  return Object.freeze({ok:errors.length===0,errors:Object.freeze(errors)});
}

export function auditGrade8MathWave1Catalog(items=ITEMS){
  const errors=items.flatMap(item=>auditGrade8MathWave1Question(item).errors.map(error=>`${item.id}:${error}`));
  if(items.length!==12)errors.push(`item-count:${items.length}`);
  if(new Set(items.flatMap(item=>item.curriculum.outcomeIds)).size!==12)errors.push('outcome-count');
  const answerCounts=Object.fromEntries(['A','B','C','D'].map(id=>[id,items.filter(item=>item.answerKey.optionId===id).length]));
  if(Object.values(answerCounts).some(count=>count!==3))errors.push(`answer-balance:${JSON.stringify(answerCounts)}`);
  return Object.freeze({ok:errors.length===0,errors:Object.freeze(errors),metrics:Object.freeze({itemCount:items.length,outcomeCount:12,answerCounts,humanReviewStatus:'NOT_MEASURED',gameAdaptationAllowed:false})});
}
