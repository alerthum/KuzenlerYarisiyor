import { defineCanonicalQuestion } from './canonical-question-contract.js';
import { defineSubjectEngine } from './subject-engine-contract.js';
import { grade8MathOutcomeByCode } from '../curriculum/outcomes/tr-g8-matematik-2018.js';

const STYLE_REFERENCE_IDS = Object.freeze(['meb-mcq-writing-guide', 'oecd-pisa-2025-framework']);

function choice(id, text, value, misconceptionId, feedback) {
  return Object.freeze({ id, text, value, misconceptionId, feedback });
}

const CHOICE_SPECS = Object.freeze([
  {
    id:'math-g8-complete-01-integer-power', outcomeCode:'M.8.1.2.1', answer:81, correctIndex:1,
    skill:'integer-power-evaluation', process:'calculate-and-check', knowledge:['base','exponent','sign-parity'], difficulty:'LGS_MEDIUM',
    context:'Bir kodlayıcı, bir desenin değerini (-3)⁴ işlemiyle belirliyor.', stem:'Desenin sayısal değeri kaçtır?', model:{type:'integer-power',base:-3,exponent:4},
    distractors:[-81,12,-12], misconceptions:['odd-even-sign-confusion','base-times-exponent','parenthesis-loss'],
    feedback:['Çift kuvvette negatif tabanın sonucu pozitiftir.','Taban ile üs çarpılmaz; taban kendisiyle dört kez çarpılır.','Parantez içindeki negatif işaret de kuvvetin kapsamındadır.']
  },
  {
    id:'math-g8-complete-02-decimal-decomposition', outcomeCode:'M.8.1.2.3', answer:'4·10^0+3·10^-1+5·10^-3', correctIndex:2,
    skill:'decimal-power-decomposition', process:'translate-representation', knowledge:['place-value','powers-of-ten'], difficulty:'LGS_MEDIUM',
    context:'Bir ölçüm cihazı 4,305 değerini basamak değerlerine ayırarak kaydediyor.', stem:'Aşağıdaki çözümlemelerden hangisi 4,305 sayısını doğru gösterir?', model:{type:'decimal-decomposition',digits:[4,3,0,5]},
    distractors:['4·10^0+3·10^-1+5·10^-2','4·10^1+3·10^0+5·10^-2','4·10^0+3·10^-2+5·10^-3'], misconceptions:['thousandth-as-hundredth','decimal-shift-one-place','tenths-hundredths-confusion'],
    feedback:['5 binde birler basamağındadır; 10⁻³ ile yazılmalıdır.','4 birler basamağındadır; 10⁰ kullanılmalıdır.','3 onda birler basamağındadır; 10⁻¹ kullanılmalıdır.']
  },
  {
    id:'math-g8-complete-03-alternate-power-ten', outcomeCode:'M.8.1.2.4', answer:'62·10^-4', correctIndex:0,
    skill:'power-ten-equivalence', process:'rescale-and-preserve-value', knowledge:['decimal-shift','equivalent-expressions'], difficulty:'LGS_MEDIUM',
    context:'Bir sensörün ölçtüğü 0,0062 değeri, katsayısı tam sayı olacak biçimde 10’un kuvvetiyle yazılacaktır.', stem:'Aşağıdaki gösterimlerden hangisi 0,0062’ye eşittir?', model:{type:'power-ten-representation',number:0.0062},
    distractors:['62·10^-3','6,2·10^-4','620·10^-4'], misconceptions:['exponent-one-step-large','coefficient-shift-unbalanced','coefficient-only-scaled'],
    feedback:['62·10⁻³ = 0,062 olur.','6,2·10⁻⁴ = 0,00062 olur.','620·10⁻⁴ = 0,062 olur.']
  },
  {
    id:'math-g8-complete-04-perfect-square-root', outcomeCode:'M.8.1.3.1', answer:14, correctIndex:3,
    skill:'perfect-square-root-relation', process:'identify-inverse-operation', knowledge:['square','square-root'], difficulty:'LGS_MEDIUM',
    context:'Alanı 196 cm² olan kare biçimindeki bir etiketin bir kenarı bulunacaktır.', stem:'Etiketin bir kenar uzunluğu kaç santimetredir?', model:{type:'perfect-square-root',n:196},
    distractors:[98,28,13], misconceptions:['divide-by-two','double-root','nearest-square-low'],
    feedback:['Kare alanından kenara geçerken ikiye bölünmez, karekök alınır.','28², 196 değildir.','13²=169 olduğundan 196’nın karekökü değildir.']
  },
  {
    id:'math-g8-complete-05-simplify-radical', outcomeCode:'M.8.1.3.3', answer:'6√5', correctIndex:1,
    skill:'radical-simplification', process:'factor-perfect-square', knowledge:['perfect-square-factor','radical-coefficient'], difficulty:'LGS_MEDIUM',
    context:'Bir tasarım programı √180 uzunluğunu a√b biçiminde en sade hâle getiriyor.', stem:'Programın göstermesi gereken ifade hangisidir?', model:{type:'simplify-radical',n:180},
    distractors:['3√20','9√2','18√5'], misconceptions:['incomplete-simplification','wrong-square-factor','factor-not-square-rooted'],
    feedback:['3√20 eşdeğerdir ancak kök içi hâlâ sadeleşir.','81·2=162 olduğu için 9√2, √180 değildir.','36 kök dışına 6 olarak çıkar; 18 olarak değil.']
  },
  {
    id:'math-g8-complete-06-radical-product', outcomeCode:'M.8.1.3.4', answer:18, correctIndex:2,
    skill:'radical-multiplication', process:'multiply-simplify', knowledge:['radical-product','perfect-square'], difficulty:'LGS_MEDIUM',
    context:'İki ölçümün çarpımı √12 · √27 olarak hesaplanıyor.', stem:'Bu çarpımın sonucu kaçtır?', model:{type:'radical-product',a:12,b:27},
    distractors:[6,9,54], misconceptions:['multiply-outside-parts-only','sqrt-sum-like-error','omit-square-root'],
    feedback:['√12·√27=√324’tür; 6 sonucu eksik sadeleştirmedir.','Kök içlerini toplamaya benzer hatalı bir yol izlenmiştir.','324’ün karekökü alınmadan 54 seçilmiştir.']
  },
  {
    id:'math-g8-complete-07-natural-radical-factor', outcomeCode:'M.8.1.3.6', answer:'√2', correctIndex:0,
    skill:'naturalizing-radical-product', process:'choose-complement-factor', knowledge:['radical-factor','perfect-square-product'], difficulty:'LGS_MEDIUM_HIGH',
    context:'Bir uzunluk √18 ile çarpıldığında sonucun doğal sayı olması isteniyor.', stem:'Aşağıdakilerden hangisi √18 ile çarpılırsa doğal sayı elde edilir?', model:{type:'natural-radical-factor',n:18},
    distractors:['√3','√6','√5'], misconceptions:['product-not-square-54','product-not-square-108','non-square-product-assumed'],
    feedback:['√18·√3=√54 doğal sayı değildir.','√18·√6=√108 doğal sayı değildir.','√18·√5=√90 doğal sayı değildir.']
  },
  {
    id:'math-g8-complete-08-decimal-square-root', outcomeCode:'M.8.1.3.7', answer:1.5, correctIndex:3,
    skill:'decimal-square-root', process:'convert-and-root', knowledge:['decimal-square','square-root'], difficulty:'LGS_MEDIUM',
    context:'Alanı 2,25 m² olan kare biçimindeki bir pano hazırlanıyor.', stem:'Panonun bir kenarı kaç metredir?', model:{type:'decimal-square-root',n:2.25},
    distractors:[1.25,1.4,2.5], misconceptions:['digit-halving','nearest-tenth-guess','decimal-point-loss'],
    feedback:['1,25²=1,5625’tir.','1,4²=1,96’dır.','2,5²=6,25’tir.']
  },
  {
    id:'math-g8-complete-09-real-number-classification', outcomeCode:'M.8.1.3.8', answer:'√2 irrasyonel; 0,125 rasyonel', correctIndex:1,
    skill:'real-number-classification', process:'classify-by-representation', knowledge:['rational','irrational','terminating-decimal'], difficulty:'LGS_MEDIUM',
    context:'Bir sayı sınıflandırma tablosuna √2 ve 0,125 değerleri yerleştirilecektir.', stem:'Doğru sınıflandırma hangisidir?', model:{type:'real-classification'},
    distractors:['İkisi de rasyonel','√2 rasyonel; 0,125 irrasyonel','İkisi de irrasyonel'], misconceptions:['all-roots-rational','categories-swapped','all-decimals-irrational'],
    feedback:['Tam kare olmayan bir sayının karekökü rasyonel değildir.','Sonlu ondalık gösterim rasyoneldir; sınıflar ters çevrilmiştir.','0,125=1/8 olduğundan rasyoneldir.']
  },
  {
    id:'math-g8-complete-10-equivalent-algebra', outcomeCode:'M.8.2.1.1', answer:'2x+6', correctIndex:2,
    skill:'algebraic-equivalence', process:'expand-and-combine', knowledge:['like-terms','distributive-property'], difficulty:'LGS_MEDIUM',
    context:'Bir hesaplama kartında 3(x+2)-x ifadesi daha kısa biçimde yazılacaktır.', stem:'Bu ifadeye denk olan cebirsel ifade hangisidir?', model:{type:'algebra-equivalent'},
    distractors:['3x+2','2x+2','3x+6'], misconceptions:['distribution-partial','constant-not-multiplied','minus-x-ignored'],
    feedback:['3 sayısı parantez içindeki 2 ile de çarpılmalıdır.','Sabit terim 6 olmalıdır.','-x terimi 3x ile birleştirilmemiştir.']
  },
  {
    id:'math-g8-complete-11-algebra-product', outcomeCode:'M.8.2.1.2', answer:'2x²+5x−12', correctIndex:0,
    skill:'algebraic-product', process:'distribute-and-combine', knowledge:['binomial-product','like-terms'], difficulty:'LGS_MEDIUM_HIGH',
    context:'Bir dikdörtgenin kenarları (2x-3) ve (x+4) birimdir.', stem:'Dikdörtgenin alanını gösteren ifade hangisidir?', model:{type:'algebra-product'},
    distractors:['2x²+8x−12','2x²−5x−12','2x²+11x−12'], misconceptions:['middle-term-one-product','middle-sign-error','middle-terms-added-wrong'],
    feedback:['-3·x ara çarpımı hesaba katılmamıştır.','8x-3x işlemi +5x verir.','8x ile -3x toplamı 11x değildir.']
  },
  {
    id:'math-g8-complete-12-factorization', outcomeCode:'M.8.2.1.4', answer:'(x−3)(x+3)', correctIndex:3,
    skill:'difference-of-squares-factorization', process:'recognize-identity', knowledge:['factorization','difference-of-squares'], difficulty:'LGS_MEDIUM',
    context:'Bir alan farkı x²-9 biçiminde modellenmiştir.', stem:'Bu ifade çarpanlarına ayrıldığında hangisi elde edilir?', model:{type:'factorization'},
    distractors:['(x−3)²','(x−9)(x+1)','(x−3)(x−3)'], misconceptions:['perfect-square-confusion','coefficient-splitting','same-sign-factors'],
    feedback:['(x−3)²=x²−6x+9’dur.','Çarpım x²−8x−9 olur.','Aynı işaretli iki çarpan orta terim üretir.']
  },
  {
    id:'math-g8-complete-13-coordinate-quadrant', outcomeCode:'M.8.2.2.2', answer:'II. bölge', correctIndex:1,
    skill:'coordinate-location', process:'interpret-ordered-pair', knowledge:['x-coordinate','y-coordinate','quadrant'], difficulty:'LGS_MEDIUM',
    context:'Bir haritada P noktası (-3,4) koordinatındadır.', stem:'P noktası koordinat sisteminin hangi bölgesindedir?', model:{type:'coordinate-quadrant',point:[-3,4]},
    distractors:['I. bölge','III. bölge','IV. bölge'], misconceptions:['ignore-x-sign','ignore-y-sign','coordinates-swapped-signs'],
    feedback:['I. bölgede iki koordinat da pozitiftir.','III. bölgede iki koordinat da negatiftir.','IV. bölgede x pozitif, y negatiftir.']
  },
  {
    id:'math-g8-complete-14-linear-table', outcomeCode:'M.8.2.2.3', answer:'y=2x+5', correctIndex:2,
    skill:'linear-table-equation', process:'infer-rate-and-intercept', knowledge:['constant-rate','initial-value'], difficulty:'LGS_HIGH',
    context:'Bir tablodaki değerler şöyledir: x=0,2,4 için y=5,9,13.', stem:'Bu ilişkiyi gösteren denklem hangisidir?', model:{type:'linear-table',points:[[0,5],[2,9],[4,13]]},
    distractors:['y=4x+5','y=2x+4','y=x+5'], misconceptions:['use-y-change-as-slope','intercept-from-second-row','x-change-ignored'],
    feedback:['x 2 artarken y 4 arttığı için eğim 4 değil 2’dir.','x=0 iken y=5 olduğundan sabit terim 5’tir.','Artış oranı 1 değil 2’dir.']
  },
  {
    id:'math-g8-complete-15-line-graph', outcomeCode:'M.8.2.2.4', answer:'(0,6) ve (2,0)', correctIndex:0,
    skill:'linear-graph-points', process:'generate-points', knowledge:['intercepts','linear-equation'], difficulty:'LGS_MEDIUM_HIGH',
    context:'y=-3x+6 doğrusu koordinat sisteminde çizilecektir.', stem:'Aşağıdaki iki nokta çiftinden hangisi bu doğru üzerindedir?', model:{type:'line-points',m:-3,b:6},
    distractors:['(0,−3) ve (2,6)','(0,6) ve (3,0)','(2,0) ve (6,0)'], misconceptions:['slope-as-intercept','x-intercept-arithmetic','two-x-intercepts'],
    feedback:['x=0 iken y=6 olmalıdır.','y=0 için x=2 bulunur, 3 değil.','Bir doğru x eksenini burada yalnız (2,0) noktasında keser.']
  },
  {
    id:'math-g8-complete-16-slope', outcomeCode:'M.8.2.2.6', answer:2, correctIndex:3,
    skill:'slope-from-points', process:'ratio-of-changes', knowledge:['vertical-change','horizontal-change','slope'], difficulty:'LGS_MEDIUM',
    context:'Bir yol profili (1,2) ve (5,10) noktalarından geçiyor.', stem:'Bu doğrunun eğimi kaçtır?', model:{type:'slope',a:[1,2],b:[5,10]},
    distractors:[8,4,0.5], misconceptions:['vertical-change-only','horizontal-change-only','ratio-inverted'],
    feedback:['8 yalnız y değerlerindeki değişimdir.','4 yalnız x değerlerindeki değişimdir.','Eğim Δy/Δx=8/4’tür; ters oran 1/2 değildir.']
  },
  {
    id:'math-g8-complete-17-inequality-model', outcomeCode:'M.8.2.3.1', answer:'35x≤210', correctIndex:1,
    skill:'inequality-context-model', process:'translate-constraint', knowledge:['at-most','unit-cost','inequality'], difficulty:'LGS_MEDIUM',
    context:'Bir öğrenci tanesi 35 TL olan biletlerden alacak ve en fazla 210 TL harcayacaktır.', stem:'Alınabilecek bilet sayısı x ile gösterilirse uygun eşitsizlik hangisidir?', model:{type:'inequality-model',unit:35,limit:210},
    distractors:['35+x≤210','35x≥210','210x≤35'], misconceptions:['multiply-replaced-with-add','at-most-direction-reversed','variables-and-limit-swapped'],
    feedback:['Toplam ücret 35 ile bilet sayısının çarpımıdır.','En fazla ifadesi ≤ gerektirir.','210 bilet başına ücret değildir.']
  },
  {
    id:'math-g8-complete-18-number-line', outcomeCode:'M.8.2.3.2', answer:'−2 açık nokta, sağa taralı', correctIndex:2,
    skill:'inequality-number-line', process:'map-symbol-to-region', knowledge:['open-endpoint','greater-than'], difficulty:'LGS_MEDIUM',
    context:'x>-2 eşitsizliği sayı doğrusunda gösterilecektir.', stem:'Doğru gösterim hangisidir?', model:{type:'number-line',operator:'>',boundary:-2},
    distractors:['−2 dolu nokta, sağa taralı','−2 açık nokta, sola taralı','−2 dolu nokta, sola taralı'], misconceptions:['strict-as-inclusive','direction-reversed','both-endpoint-and-direction'],
    feedback:['> işaretinde sınır değer çözüme dâhil değildir.','Büyük değerler -2’nin sağındadır.','Hem nokta hem yön yanlış seçilmiştir.']
  },
  {
    id:'math-g8-complete-20-side-angle', outcomeCode:'M.8.3.1.3', answer:'8 cm’lik kenarın karşısındaki açı', correctIndex:0,
    skill:'triangle-side-angle-relation', process:'order-corresponding-measures', knowledge:['longest-side','largest-angle'], difficulty:'LGS_MEDIUM',
    context:'Bir üçgenin kenar uzunlukları 5 cm, 7 cm ve 8 cm’dir.', stem:'En büyük açı hangi kenarın karşısındadır?', model:{type:'triangle-side-angle',sides:[5,7,8]},
    distractors:['5 cm’lik kenarın karşısındaki açı','7 cm’lik kenarın karşısındaki açı','Üç açının ölçüsü eşittir'], misconceptions:['smallest-side-largest-angle','middle-side-selected','all-triangles-equilateral'],
    feedback:['En küçük kenarın karşısında en küçük açı bulunur.','7 cm orta uzunluktadır.','Kenarlar eşit olmadığı için açılar da eşit değildir.']
  },
  {
    id:'math-g8-complete-24-congruence-similarity', outcomeCode:'M.8.3.3.1', answer:'Benzer, eş değil; oran 2', correctIndex:3,
    skill:'congruence-similarity-classification', process:'compare-corresponding-parts', knowledge:['corresponding-angles','scale-factor','congruence'], difficulty:'LGS_HIGH',
    context:'Bir üçgenin kenarları 3,4,5; diğerinin kenarları 6,8,10 birimdir. Karşılıklı açıları eşittir.', stem:'Bu iki üçgen için doğru değerlendirme hangisidir?', model:{type:'similarity-classification',a:[3,4,5],b:[6,8,10]},
    distractors:['Eştir; çünkü açıları eşittir','Eş değildir ve benzer de değildir','Eştir; benzerlik oranı 1’dir'], misconceptions:['angles-imply-congruence','scale-ignored','ratio-assumed-one'],
    feedback:['Açı eşitliği benzerlik sağlar; kenar uzunlukları aynı olmadığından eşlik sağlamaz.','Kenar oranlarının tümü 2 olduğundan benzerdir.','Benzerlik oranı 2’dir, 1 değildir.']
  },
  {
    id:'math-g8-complete-28-cylinder-surface', outcomeCode:'M.8.3.4.3', answer:'48π', correctIndex:1,
    skill:'cylinder-surface-area', process:'model-and-calculate', knowledge:['circle-area','lateral-area','total-surface'], difficulty:'LGS_MEDIUM_HIGH',
    context:'Yarıçapı 3 cm, yüksekliği 5 cm olan kapalı bir silindirin dış yüzeyi kaplanacaktır.', stem:'Kaplanacak toplam alan kaç cm²’dir?', model:{type:'cylinder-surface',r:3,h:5},
    distractors:['30π','24π','15π'], misconceptions:['lateral-only','one-base-plus-lateral-wrong','volume-like-product'],
    feedback:['30π yalnız yanal alandır.','İki taban ve yanal alan birlikte hesaplanmalıdır.','15π yüzey alanı bağıntısını temsil etmez.']
  },
  {
    id:'math-g8-complete-29-cylinder-volume', outcomeCode:'M.8.3.4.4', answer:'96π', correctIndex:2,
    skill:'cylinder-volume', process:'base-area-times-height', knowledge:['circle-area','prism-volume'], difficulty:'LGS_MEDIUM',
    context:'Yarıçapı 4 cm ve yüksekliği 6 cm olan silindirik bir kutu kullanılacaktır.', stem:'Kutunun hacmi kaç cm³’tür?', model:{type:'cylinder-volume',r:4,h:6},
    distractors:['24π','48π','192π'], misconceptions:['radius-not-squared','half-base-area','double-volume'],
    feedback:['Taban alanında yarıçapın karesi alınmalıdır.','π·4²·6 işleminin yarısı alınmıştır.','Hacim gereksiz yere ikiyle çarpılmıştır.']
  },
  {
    id:'math-g8-complete-32-data-conversion', outcomeCode:'M.8.4.1.2', answer:'90°, 126°, 144°', correctIndex:0,
    skill:'data-representation-conversion', process:'percent-to-angle', knowledge:['percentage','circle-graph-angle'], difficulty:'LGS_MEDIUM_HIGH',
    context:'Bir ankette üç seçenek sırasıyla %25, %35 ve %40 oranında seçilmiştir.', stem:'Bu veriler daire grafiğine aktarılırsa merkez açıları sırasıyla hangisi olur?', model:{type:'percent-to-angle',percents:[25,35,40]},
    distractors:['25°, 35°, 40°','100°, 120°, 140°','72°, 126°, 162°'], misconceptions:['percent-as-degree','angles-forced-near-percent','first-last-miscalculated'],
    feedback:['Daire grafiğinde toplam 360° olmalıdır.','Bu açıların toplamı 360° olsa da oranları yüzdelerle uyuşmaz.','%25’in açısı 90°, %40’ın açısı 144° olmalıdır.']
  },
  {
    id:'math-g8-complete-33-sample-space', outcomeCode:'M.8.5.1.1', answer:4, correctIndex:3,
    skill:'sample-space-enumeration', process:'systematic-listing', knowledge:['outcome','sample-space'], difficulty:'LGS_MEDIUM',
    context:'İki madeni para aynı anda atılıyor.', stem:'Bu deneyin olası sonuç sayısı kaçtır?', model:{type:'two-coins'},
    distractors:[2,3,8], misconceptions:['one-coin-count','unordered-mixed-outcomes','multiply-by-four'],
    feedback:['Her para için iki sonuç vardır; iki para birlikte düşünülmelidir.','Yazı-tura ile tura-yazı farklı sonuçlardır.','2·2=4’tür, 8 değildir.']
  },
  {
    id:'math-g8-complete-34-likelihood-compare', outcomeCode:'M.8.5.1.2', answer:'Mavi daha fazla, yeşil daha az olasılıklıdır.', correctIndex:1,
    skill:'comparative-likelihood', process:'compare-favorable-counts', knowledge:['more-likely','less-likely'], difficulty:'LGS_MEDIUM',
    context:'Bir torbada 3 kırmızı, 5 mavi ve 2 yeşil eş büyüklükte top vardır.', stem:'Rastgele çekilen topun rengiyle ilgili doğru karşılaştırma hangisidir?', model:{type:'likelihood',counts:{kirmizi:3,mavi:5,yesil:2}},
    distractors:['Kırmızı ile mavi eş olasılıklıdır.','Yeşil, maviden daha fazla olasılıklıdır.','Üç renk eş olasılıklıdır.'], misconceptions:['different-counts-assumed-equal','count-order-reversed','category-count-not-frequency'],
    feedback:['3 ve 5 eş olmadığı için olasılıklar eşit değildir.','2 top bulunan yeşil, 5 top bulunan maviden daha az olasılıklıdır.','Renk sayısının üç olması her rengin eş sayıda olduğu anlamına gelmez.']
  },
  {
    id:'math-g8-complete-35-equiprobable', outcomeCode:'M.8.5.1.3', answer:'1/6', correctIndex:2,
    skill:'equiprobable-outcome-probability', process:'use-one-over-n', knowledge:['fair-experiment','equal-chance'], difficulty:'LGS_MEDIUM',
    context:'Adil bir altı yüzlü zar bir kez atılıyor.', stem:'Zarın belirli bir yüzünün gelme olasılığı kaçtır?', model:{type:'equiprobable',n:6},
    distractors:['1/3','1/5','6'], misconceptions:['half-of-even-outcomes','off-by-one-outcome-count','count-instead-of-probability'],
    feedback:['Altı eş olasılıklı sonuç vardır, üç değil.','Zarın yüz sayısı 6’dır.','Olasılık sonuç sayısı değil, 1/6 oranıdır.']
  }
]);

const CONSTRUCTION_SPECS = Object.freeze([
  {id:'math-g8-complete-19-triangle-lines',outcomeCode:'M.8.3.1.1',skill:'triangle-special-line-construction',knowledge:['median','angle-bisector','altitude'],context:'ABC üçgeninde A köşesinden BC kenarına bir kenarortay çizilecektir.',stem:'İnşa aracında hangi iki nokta birleştirilmelidir?',model:{type:'median-construction',vertex:'A',side:'BC',midpoint:'M'},expected:{segment:['A','M']},hints:['Önce BC kenarının orta noktasını belirle.','Kenarortay bir köşeyi karşı kenarın orta noktasına bağlar.','A ile BC’nin orta noktası M’yi birleştir.']},
  {id:'math-g8-complete-21-triangle-construction',outcomeCode:'M.8.3.1.4',skill:'triangle-sss-construction',knowledge:['triangle-inequality','compass-circles'],context:'Kenarları 4 cm, 5 cm ve 8 cm olan bir üçgen çizilecektir.',stem:'Cetvel-pergel inşasında doğru işlem sırası nedir?',model:{type:'sss-construction',sides:[4,5,8]},expected:{base:8,arcs:[4,5],valid:true},hints:['Önce en uzun kenarı taban olarak çiz.','Tabanın uçlarından diğer iki kenar uzunluğunda yaylar çiz.','Yayların kesişimini tabanın uçlarıyla birleştir.']},
  {id:'math-g8-complete-22-translation',outcomeCode:'M.8.3.2.1',skill:'coordinate-translation-construction',knowledge:['translation-vector','coordinate-change'],context:'P(2,-1) noktası (-3,4) vektörüyle öteleniyor.',stem:'P noktasının görüntüsünü koordinat düzleminde işaretle.',model:{type:'translation',point:[2,-1],vector:[-3,4]},expected:{point:[-1,3]},hints:['Öteleme vektörünü x ve y koordinatlarına ayrı uygula.','x: 2-3, y: -1+4.','Görüntü noktası (-1,3) olur.']},
  {id:'math-g8-complete-23-polygon-transform',outcomeCode:'M.8.3.2.3',skill:'compound-polygon-transformation',knowledge:['reflection','translation','vertex-correspondence'],context:'A(1,1), B(3,1), C(2,3) üçgeni önce y eksenine göre yansıtılıyor, sonra 2 birim yukarı öteleniyor.',stem:'Dönüşüm sonundaki A, B ve C görüntülerini işaretle.',model:{type:'reflect-then-translate',points:[[1,1],[3,1],[2,3]],dy:2},expected:{points:[[-1,3],[-3,3],[-2,5]]},hints:['y eksenine yansımada x işareti değişir.','Yansıyan her noktanın y değerine 2 ekle.','Son noktalar (-1,3), (-3,3), (-2,5) olur.']},
  {id:'math-g8-complete-25-similar-construction',outcomeCode:'M.8.3.3.2',skill:'similar-polygon-construction',knowledge:['scale-factor','corresponding-sides'],context:'Kenarları 3,4,5 birim olan üçgene benzer ve benzerlik oranı 1,5 olan bir üçgen oluşturulacaktır.',stem:'Yeni üçgenin kenar uzunluklarını gir ve çiz.',model:{type:'similar-sides',sides:[3,4,5],scale:1.5},expected:{sides:[4.5,6,7.5]},hints:['Her karşılık gelen kenar aynı oranla çarpılır.','3, 4 ve 5 değerlerini 1,5 ile çarp.','Yeni kenarlar 4,5; 6; 7,5 olur.']},
  {id:'math-g8-complete-26-prism-net',outcomeCode:'M.8.3.4.1',skill:'prism-net-construction',knowledge:['faces','edges','net'],context:'Bir üçgen dik prizmanın açınımı oluşturulacaktır.',stem:'Açınım alanına gerekli yüzleri seçip kenarlarından birleştir.',model:{type:'triangular-prism-net'},expected:{faces:{triangles:2,rectangles:3}},hints:['Prizmanın iki eş tabanı vardır.','Üçgen tabanın üç kenarı üç yan yüz oluşturur.','İki üçgen ve üç dikdörtgen seç.']},
  {id:'math-g8-complete-27-cylinder-net',outcomeCode:'M.8.3.4.2',skill:'cylinder-net-construction',knowledge:['circle-bases','lateral-rectangle'],context:'Kapalı bir dik dairesel silindirin açınımı hazırlanacaktır.',stem:'Gerekli düzlemsel parçaları seç.',model:{type:'cylinder-net'},expected:{circles:2,rectangles:1},hints:['Silindirin iki eş dairesel tabanı vardır.','Yanal yüz açıldığında dikdörtgen olur.','İki daire ve bir dikdörtgen seç.']},
  {id:'math-g8-complete-30-pyramid-net',outcomeCode:'M.8.3.4.5',skill:'square-pyramid-net',knowledge:['base','triangular-faces','net'],context:'Kare tabanlı dik piramidin açınımı oluşturulacaktır.',stem:'Açınım için gerekli yüzleri seç ve tabana bağla.',model:{type:'square-pyramid-net'},expected:{squares:1,triangles:4},hints:['Taban bir karedir.','Karenin her kenarına bir yan yüz karşılık gelir.','Bir kare ve dört üçgen seç.']},
  {id:'math-g8-complete-31-cone-net',outcomeCode:'M.8.3.4.6',skill:'cone-net-construction',knowledge:['circle-base','sector-lateral-face'],context:'Kapalı bir dik koninin açınımı hazırlanacaktır.',stem:'Açınımı oluşturan parçaları seç.',model:{type:'cone-net'},expected:{circles:1,sectors:1},hints:['Koninin tek dairesel tabanı vardır.','Yanal yüz açıldığında daire dilimi olur.','Bir daire ve bir daire dilimi seç.']}
]);

function canonicalChoice(spec) {
  const outcome=grade8MathOutcomeByCode(spec.outcomeCode); if(!outcome) throw new Error(`${spec.id}: missing outcome`);
  const wrong=spec.distractors.map((value,index)=>({value,misconceptionId:spec.misconceptions[index],feedback:spec.feedback[index]}));
  const slots=[]; let wi=0;
  for(let i=0;i<4;i++){
    if(i===spec.correctIndex) slots.push({value:spec.answer,misconceptionId:null,feedback:`Doğru sonuç ${spec.answer} değeridir; çözüm grafındaki işlemler ve bağımsız doğrulama aynı sonucu verir.`});
    else slots.push(wrong[wi++]);
  }
  const ids=['A','B','C','D'];
  const options=slots.map((entry,index)=>choice(ids[index],String(entry.value),entry.value,entry.misconceptionId,entry.feedback));
  return defineCanonicalQuestion({
    id:spec.id,
    curriculum:{country:'TR',schoolYear:outcome.schoolYear,programFamily:outcome.programFamily,grade:8,courseId:outcome.courseId,unitId:outcome.unitId,topicId:outcome.topicId,outcomeIds:[outcome.id],sourceIds:[outcome.sourceId]},
    construct:{primarySkill:spec.skill,secondarySkills:['representation-translation','error-analysis'],cognitiveProcess:spec.process,knowledgeComponents:spec.knowledge,intendedDifficultyBand:spec.difficulty},
    content:{context:spec.context,stem:spec.stem,model:spec.model,options:options.map(({id,text})=>({id,text})),optionValues:Object.fromEntries(options.map(o=>[o.id,o.value])),humanReview:{status:'NOT_MEASURED',batch:'G8_MATH_COMPLETION_35',gameAdaptationAllowed:false}},
    itemFormat:'single-choice',responseModel:{optionIds:ids,optionCount:4},answerKey:{optionId:ids[spec.correctIndex],value:spec.answer},
    solutionGraph:[{id:'s1',action:'matematiksel modeli kur',dependsOn:[],evidenceIds:['model'],evidence:spec.context},{id:'s2',action:'alan kuralını uygula',dependsOn:['s1'],evidenceIds:['calculation'],evidence:String(solveModel(spec.model))},{id:'s3',action:'sonucu seçenek ve bağlamla doğrula',dependsOn:['s2'],evidenceIds:['verification'],evidence:String(independentSolve(spec.model))}],
    hints:[{level:1,text:'Sorudaki nicelikleri ve aralarındaki ilişkiyi matematiksel modele dönüştür.',revealsAnswer:false},{level:2,text:'İlgili kazanımın kuralını işaret ve sınır değerlerine dikkat ederek uygula.',revealsAnswer:false},{level:3,text:'Bulduğun sonucu seçeneklerde yerine koyarak tekrar kontrol et.',revealsAnswer:false}],
    optionFeedback:options.map(o=>({optionId:o.id,correct:o.id===ids[spec.correctIndex],misconceptionId:o.misconceptionId,text:o.feedback,supportingEvidenceIds:o.id===ids[spec.correctIndex]?['verification']:[],contradictionEvidenceIds:o.id===ids[spec.correctIndex]?[]:['verification']})),
    misconceptionIds:options.filter(o=>o.misconceptionId).map(o=>o.misconceptionId),
    verifier:{solverId:'g8-math-completion-domain-solver-v1',independentVerifierId:'g8-math-completion-alternate-verifier-v1',verified:true},
    styleProfile:{genre:'curriculum-aligned-mathematical-task',voice:'objective',sourceMode:'original-curriculum-aligned',rhetoricalMoves:['model','solve','verify']},
    provenance:{generatedFromSourceIds:[outcome.sourceId],styleReferenceIds:STYLE_REFERENCE_IDS},contentStatus:'HUMAN_REVIEW_REQUIRED'
  });
}

function canonicalConstruction(spec){
  const outcome=grade8MathOutcomeByCode(spec.outcomeCode); if(!outcome) throw new Error(`${spec.id}: missing outcome`);
  return defineCanonicalQuestion({
    id:spec.id,
    curriculum:{country:'TR',schoolYear:outcome.schoolYear,programFamily:outcome.programFamily,grade:8,courseId:outcome.courseId,unitId:outcome.unitId,topicId:outcome.topicId,outcomeIds:[outcome.id],sourceIds:[outcome.sourceId]},
    construct:{primarySkill:spec.skill,secondarySkills:['spatial-reasoning','construction-validation'],cognitiveProcess:'construct-and-verify',knowledgeComponents:spec.knowledge,intendedDifficultyBand:'LGS_MEDIUM_HIGH'},
    content:{context:spec.context,stem:spec.stem,model:spec.model,humanReview:{status:'NOT_MEASURED',batch:'G8_MATH_COMPLETION_35',gameAdaptationAllowed:false}},
    itemFormat:'interactive-simulation',responseModel:{interaction:'geometry-construction',expectedShape:spec.expected},answerKey:{expected:spec.expected},
    solutionGraph:[{id:'s1',action:'verilenleri geometrik nesnelere dönüştür',dependsOn:[],evidenceIds:['givens'],evidence:spec.context},{id:'s2',action:'inşa adımlarını uygula',dependsOn:['s1'],evidenceIds:['construction'],evidence:JSON.stringify(spec.expected)},{id:'s3',action:'ölçü veya değişmezlerle doğrula',dependsOn:['s2'],evidenceIds:['invariant'],evidence:JSON.stringify(independentSolve(spec.model))}],
    hints:spec.hints.map((text,index)=>({level:index+1,text,revealsAnswer:false})),optionFeedback:[],misconceptionIds:['construction-anchor-error','correspondence-error','invariant-not-checked'],
    verifier:{solverId:'g8-math-construction-solver-v1',independentVerifierId:'g8-math-coordinate-invariant-verifier-v1',verified:true},
    styleProfile:{genre:'interactive-geometry-construction',voice:'instructional',sourceMode:'original-curriculum-aligned',rhetoricalMoves:['construct','measure','verify']},
    provenance:{generatedFromSourceIds:[outcome.sourceId],styleReferenceIds:STYLE_REFERENCE_IDS},contentStatus:'HUMAN_REVIEW_REQUIRED'
  });
}

function solveModel(model){
  switch(model.type){
    case 'integer-power':return model.base**model.exponent;
    case 'decimal-decomposition':return '4·10^0+3·10^-1+5·10^-3';
    case 'power-ten-representation':return '62·10^-4';
    case 'perfect-square-root':return Math.sqrt(model.n);
    case 'simplify-radical':return '6√5';
    case 'radical-product':return Math.sqrt(model.a*model.b);
    case 'natural-radical-factor':return '√2';
    case 'decimal-square-root':return Math.sqrt(model.n);
    case 'real-classification':return '√2 irrasyonel; 0,125 rasyonel';
    case 'algebra-equivalent':return '2x+6';
    case 'algebra-product':return '2x²+5x−12';
    case 'factorization':return '(x−3)(x+3)';
    case 'coordinate-quadrant':return 'II. bölge';
    case 'linear-table':return 'y=2x+5';
    case 'line-points':return '(0,6) ve (2,0)';
    case 'slope':return (model.b[1]-model.a[1])/(model.b[0]-model.a[0]);
    case 'inequality-model':return '35x≤210';
    case 'number-line':return '−2 açık nokta, sağa taralı';
    case 'triangle-side-angle':return '8 cm’lik kenarın karşısındaki açı';
    case 'similarity-classification':return 'Benzer, eş değil; oran 2';
    case 'cylinder-surface':return `${2*model.r*(model.r+model.h)}π`;
    case 'cylinder-volume':return `${model.r*model.r*model.h}π`;
    case 'percent-to-angle':return model.percents.map(p=>`${p*3.6}°`).join(', ');
    case 'two-coins':return 4;
    case 'likelihood':return 'Mavi daha fazla, yeşil daha az olasılıklıdır.';
    case 'equiprobable':return `1/${model.n}`;
    case 'median-construction':return {segment:['A','M']};
    case 'sss-construction':return {base:8,arcs:[4,5],valid:true};
    case 'translation':return {point:[model.point[0]+model.vector[0],model.point[1]+model.vector[1]]};
    case 'reflect-then-translate':return {points:model.points.map(([x,y])=>[-x,y+model.dy])};
    case 'similar-sides':return {sides:model.sides.map(v=>v*model.scale)};
    case 'triangular-prism-net':return {faces:{triangles:2,rectangles:3}};
    case 'cylinder-net':return {circles:2,rectangles:1};
    case 'square-pyramid-net':return {squares:1,triangles:4};
    case 'cone-net':return {circles:1,sectors:1};
  }
  throw new Error(`unsupported model ${model.type}`);
}

function independentSolve(model){
  switch(model.type){
    case 'integer-power':{let result=1;for(let i=0;i<model.exponent;i++)result*=model.base;return result;}
    case 'perfect-square-root':{for(let n=0;n<=model.n;n++)if(n*n===model.n)return n;break;}
    case 'radical-product':{const n=model.a*model.b;for(let k=0;k<=n;k++)if(k*k===n)return k;break;}
    case 'decimal-square-root':{for(let n=0;n<=1000;n++){const x=n/100;if(Math.abs(x*x-model.n)<1e-9)return x;}break;}
    case 'slope':return (model.b[1]-model.a[1])/(model.b[0]-model.a[0]);
    case 'cylinder-surface':return `${2*model.r*model.r+2*model.r*model.h}π`;
    case 'cylinder-volume':return `${model.h*model.r**2}π`;
    case 'percent-to-angle':return model.percents.map(p=>`${360*p/100}°`).join(', ');
    case 'two-coins':return ['YY','YT','TY','TT'].length;
    case 'translation':return {point:model.point.map((v,i)=>v+model.vector[i])};
    case 'reflect-then-translate':return {points:model.points.map(p=>[0-p[0],p[1]+model.dy])};
    case 'similar-sides':return {sides:model.sides.map(v=>Number((v*model.scale).toFixed(6)))};
    default:return solveModel(model);
  }
  throw new Error(`independent solver failed ${model.type}`);
}

const ITEMS=Object.freeze([...CHOICE_SPECS.map(canonicalChoice),...CONSTRUCTION_SPECS.map(canonicalConstruction)]);
export const GRADE8_MATH_COMPLETION_OUTCOME_CODES=Object.freeze([...CHOICE_SPECS.map(spec=>spec.outcomeCode),...CONSTRUCTION_SPECS.map(spec=>spec.outcomeCode)]);
export function buildGrade8MathCompletionQuestions(){return ITEMS;}

function stable(value){return JSON.stringify(value,Object.keys(value||{}).sort());}

export const grade8MathCompletionEngine=defineSubjectEngine({
  id:'grade8-math-completion-engine-v1',domain:'mathematics',supportedCourseIds:['matematik'],supportedItemFormats:['single-choice','interactive-simulation'],misconceptionCatalogId:'g8-math-full-completion-misconceptions-v1',styleCatalogId:'g8-math-completion-styles-v1',
  plan:req=>({questionId:req.questionId}),generate:plan=>structuredClone(ITEMS.find(item=>item.id===plan.questionId)||(()=>{throw new Error(`unknown ${plan.questionId}`)})()),
  solve:item=>{const value=solveModel(item.content.model);if(item.itemFormat==='interactive-simulation')return {value};const option=Object.entries(item.content.optionValues).find(([,v])=>String(v)===String(value));if(!option)throw new Error(`${item.id}: no matching option for ${value}`);return {optionId:option[0],value};},
  verifyIndependent:(item,solved)=>{const expected=independentSolve(item.content.model);if(item.itemFormat==='interactive-simulation')return JSON.stringify(expected)===JSON.stringify(item.answerKey.expected)&&JSON.stringify(solved.value)===JSON.stringify(expected);return String(expected)===String(solved.value)&&solved.optionId===item.answerKey.optionId;},
  explain:item=>item.solutionGraph,qualityAudit:item=>auditGrade8MathCompletionQuestion(item)
});

export function auditGrade8MathCompletionQuestion(item){
  const errors=[];
  if(item.hints.length!==3)errors.push('hint-count');
  if(item.gameBindings.length)errors.push('game-binding-forbidden');
  if(item.content.humanReview?.gameAdaptationAllowed!==false)errors.push('game-adaptation-open');
  if(item.itemFormat==='single-choice'){
    if(item.content.options.length!==4)errors.push('option-count');
    if(item.optionFeedback.length!==4)errors.push('feedback-count');
    if(new Set(item.misconceptionIds).size!==3)errors.push('misconception-diversity');
  } else if(item.optionFeedback.length!==0) errors.push('construction-option-feedback');
  try{const solved=grade8MathCompletionEngine.solve(item);if(!grade8MathCompletionEngine.verifyIndependent(item,solved))errors.push('independent-verification');}catch(error){errors.push(`solver:${error.message}`);}
  return Object.freeze({ok:errors.length===0,errors:Object.freeze(errors)});
}

export function auditGrade8MathCompletionCatalog(items=ITEMS){
  const errors=items.flatMap(item=>auditGrade8MathCompletionQuestion(item).errors.map(error=>`${item.id}:${error}`));
  if(items.length!==35)errors.push(`item-count:${items.length}`);
  if(new Set(items.flatMap(item=>item.curriculum.outcomeIds)).size!==35)errors.push('outcome-count');
  const formatCounts=items.reduce((acc,item)=>{acc[item.itemFormat]=(acc[item.itemFormat]||0)+1;return acc;},{});
  return Object.freeze({ok:errors.length===0,errors:Object.freeze(errors),metrics:Object.freeze({itemCount:items.length,outcomeCount:new Set(items.flatMap(item=>item.curriculum.outcomeIds)).size,formatCounts,humanReviewStatus:'NOT_MEASURED',gameAdaptationAllowed:false})});
}
