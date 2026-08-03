import { seededRandom } from '../utils.js';
import { isPremiumGradeEligible, normalizeStudentGrade } from './premium-grade-band.js';

const PILOT_VERSION = '1.0.0';

function normalize(value = '') {
  return String(value).toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();
}

function stableHash(value = '') {
  let hash = 2166136261;
  for (const ch of String(value)) {
    hash ^= ch.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function shuffleEntries(entries, random) {
  const result = entries.map((entry) => ({ ...entry }));
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function makeChoice({
  id,
  gameId,
  familyId,
  skeletonId,
  subjectId,
  topicId,
  learningOutcomeId,
  gradeBand = '6-8',
  prompt,
  context,
  answer,
  distractors,
  explanation,
  hints = [],
  cognitiveTraits,
  reasoningStepCount = 2,
  evidence = [],
  difficulty = 4
}) {
  if (!Array.isArray(distractors) || distractors.length !== 3) {
    throw new Error(`${id}: exactly three distractors are required`);
  }
  return {
    id,
    gameId,
    familyId,
    skeletonId,
    reasoningPathId: 'evidence-first',
    subjectId,
    topicId,
    learningOutcomeId,
    gradeBand,
    prompt,
    context,
    answer,
    distractors,
    explanation,
    hints,
    cognitiveTraits,
    reasoningStepCount,
    evidence,
    difficulty
  };
}

const MATH_ITEMS = [
  makeChoice({
    id: 'math-discount-first-error-01', gameId: 'error-detective', familyId: 'pilot-math-percentage-error', skeletonId: 'pilot-math-percentage-error:first-error', subjectId: 'mathematics', topicId: 'percentages', learningOutcomeId: 'detect-first-error-in-percent-chain',
    context: 'Bir öğrenci 240 TL etiket fiyatlı bir ürüne %25 indirim uyguluyor. Çözümü şöyledir: 1) 240 × 25 = 6000  2) 6000 ÷ 100 = 60  3) 240 − 25 = 215 TL.',
    prompt: 'Çözümdeki ilk hatalı adım ve hatanın nedeni hangi seçenekte birlikte verilmiştir?',
    answer: '3. adım; etiket fiyatından indirim oranı değil, 60 TL indirim tutarı çıkarılmalıdır.',
    distractors: [
      { text: '1. adım; yüzde hesabında fiyat ile oran çarpılmamalıdır.', misconceptionId: 'percent:reject-required-multiplication', why: 'Öğrenci yüzde tutarını bulmak için yapılan ilk çarpmanın gereksiz olduğunu sanır.', constructionRule: 'required-step-marked-as-error' },
      { text: '2. adım; yüzde hesabında 100’e bölmek yerine 25’e bölmek gerekir.', misconceptionId: 'percent:divide-by-rate', why: 'Öğrenci yüzdeyi yüz üzerinden oranlamak yerine oran sayısına bölmeyi seçer.', constructionRule: 'divide-by-percent-number' },
      { text: 'Hiçbir adım hatalı değildir; sonuç 215 TL’dir.', misconceptionId: 'percent:rate-as-amount', why: 'Öğrenci %25 ifadesini 25 TL gibi yorumlayıp sonucun mantığını kontrol etmez.', constructionRule: 'accept-rate-as-currency' }
    ],
    explanation: 'İlk iki adım %25 indirim tutarını 60 TL olarak doğru bulur. İlk hata 3. adımdadır; 240 − 60 = 180 TL olmalıdır.',
    hints: ['Oran ile para tutarını birbirinden ayır.', 'Her adımın birimini kontrol et.'], cognitiveTraits: ['errorAnalysis', 'informationLinking', 'usingIntermediateResultInNewDecision'], reasoningStepCount: 3,
    evidence: ['240 × 25 ÷ 100 = 60', 'İndirimli fiyat = etiket fiyatı − indirim tutarı']
  }),
  makeChoice({
    id: 'math-discount-first-error-02', gameId: 'error-detective', familyId: 'pilot-math-percentage-error', skeletonId: 'pilot-math-percentage-error:reverse-rate', subjectId: 'mathematics', topicId: 'percentages', learningOutcomeId: 'distinguish-percent-base',
    context: 'Bir ürün %20 indirimden sonra 320 TL olmuştur. Öğrenci: 1) 320’nin %20’si 64’tür. 2) İlk fiyat 320 + 64 = 384 TL’dir.',
    prompt: 'Öğrencinin düşünme yolundaki temel hata hangisidir?',
    answer: 'İndirim oranını indirimli fiyat üzerinden hesaplamıştır; %20’nin tabanı ilk fiyattır.',
    distractors: [
      { text: '320 ile 20’yi çarpmak yerine toplamalıydı.', misconceptionId: 'percent:add-rate-to-value', why: 'Öğrenci yüzde işlemini toplamsal bir değişim gibi görür.', constructionRule: 'replace-percent-operation-with-addition' },
      { text: '64’ü 320’den çıkarmalıydı; ilk fiyat 256 TL olurdu.', misconceptionId: 'percent:reverse-direction', why: 'Öğrenci indirimin yönünü ters yorumlayarak daha düşük bir başlangıç fiyatı bulur.', constructionRule: 'subtract-discount-from-sale-price' },
      { text: 'Hata yoktur; indirimli fiyata indirim tutarı eklemek her zaman ilk fiyatı verir.', misconceptionId: 'percent:same-base-assumption', why: 'Öğrenci ilk ve son fiyat yüzdelerinin farklı tabanlara ait olduğunu gözden kaçırır.', constructionRule: 'assume-symmetric-percent-change' }
    ],
    explanation: '320 TL, ilk fiyatın %80’idir. İlk fiyat 320 ÷ 0,80 = 400 TL’dir. %20’yi 320 üzerinden almak yanlış taban seçimidir.', cognitiveTraits: ['errorAnalysis', 'reverseThinking', 'conditionEvaluation'], reasoningStepCount: 3,
    evidence: ['İndirimli fiyat = ilk fiyatın %80’i', '320 ÷ 0,80 = 400']
  }),
  makeChoice({
    id: 'math-fraction-error-01', gameId: 'error-detective', familyId: 'pilot-math-fraction-error', skeletonId: 'pilot-math-fraction-error:common-denominator', subjectId: 'mathematics', topicId: 'fractions', learningOutcomeId: 'detect-denominator-addition-error',
    context: 'Bir öğrenci 2/3 + 1/4 işlemini şu şekilde yapıyor: 1) Payları toplar: 2 + 1 = 3. 2) Paydaları toplar: 3 + 4 = 7. 3) Sonucu 3/7 bulur.',
    prompt: 'Bu çözümü düzeltmek için ilk yapılması gereken işlem hangisidir?',
    answer: 'Kesirleri 12 ortak paydasında 8/12 ve 3/12 biçimine dönüştürmek.',
    distractors: [
      { text: 'Yalnız payları toplamak ve paydayı 4 bırakmak.', misconceptionId: 'fraction:keep-larger-denominator', why: 'Öğrenci büyük paydayı ortak payda kabul eder ancak payları eşdeğerleştirmez.', constructionRule: 'keep-max-denominator' },
      { text: 'Pay ve paydaları ayrı ayrı çarparak 2/12 bulmak.', misconceptionId: 'fraction:use-multiplication-rule', why: 'Öğrenci kesir toplamasına çarpma kuralını uygular.', constructionRule: 'multiply-numerators-and-denominators' },
      { text: '3/7 sonucunu sadeleştirmek; başka işlem gerekmez.', misconceptionId: 'fraction:accept-componentwise-addition', why: 'Öğrenci pay ve paydayı bağımsız sayılar gibi toplamanın geçerli olduğunu sanır.', constructionRule: 'accept-sum-over-sum' }
    ],
    explanation: 'Farklı paydalı kesirler toplanmadan önce eş parçalar hâline getirilmelidir. 2/3 = 8/12 ve 1/4 = 3/12 olduğundan sonuç 11/12’dir.', cognitiveTraits: ['errorAnalysis', 'representationTransform', 'informationLinking'], reasoningStepCount: 3,
    evidence: ['2/3 = 8/12', '1/4 = 3/12', '8/12 + 3/12 = 11/12']
  }),
  makeChoice({
    id: 'math-fraction-error-02', gameId: 'error-detective', familyId: 'pilot-math-fraction-error', skeletonId: 'pilot-math-fraction-error:division-reciprocal', subjectId: 'mathematics', topicId: 'fractions', learningOutcomeId: 'detect-reciprocal-target-error',
    context: 'Öğrenci 3/5 ÷ 2/7 işlemini 3/5 × 2/7 = 6/35 olarak çözüyor.',
    prompt: 'Hangi düzeltme işlemin anlamını korur?',
    answer: 'Bölen kesir 2/7 ters çevrilip 7/2 yapılmalı; 3/5 × 7/2 hesaplanmalıdır.',
    distractors: [
      { text: 'Bölünen kesir 3/5 ters çevrilip 5/3 yapılmalıdır.', misconceptionId: 'fraction:invert-dividend', why: 'Öğrenci hangi kesrin ters çevrileceğini karıştırır.', constructionRule: 'invert-first-fraction' },
      { text: 'Her iki kesir de ters çevrilip 5/3 × 7/2 yapılmalıdır.', misconceptionId: 'fraction:invert-both', why: 'Öğrenci bölmeyi çarpmaya çevirirken iki kesri de ters çevirir.', constructionRule: 'invert-both-fractions' },
      { text: 'Paylar bölünüp paydalar çarpılmalı; 3/10 bulunmalıdır.', misconceptionId: 'fraction:mixed-operation', why: 'Öğrenci pay ve paydalara farklı işlemler uygular.', constructionRule: 'divide-numerator-multiply-denominator' }
    ],
    explanation: 'Kesirle bölme, bölen kesrin çarpmaya göre tersiyle çarpmaktır. 3/5 × 7/2 = 21/10 olur.', cognitiveTraits: ['errorAnalysis', 'conditionEvaluation', 'representationTransform'], reasoningStepCount: 2,
    evidence: ['a/b ÷ c/d = a/b × d/c', '3/5 × 7/2 = 21/10']
  }),
  makeChoice({
    id: 'math-order-error-01', gameId: 'error-detective', familyId: 'pilot-math-order-error', skeletonId: 'pilot-math-order-error:first-error', subjectId: 'mathematics', topicId: 'operation-order', learningOutcomeId: 'detect-operation-priority-error',
    context: 'Bir öğrenci 18 − 3 × 4 + 2 işlemini şöyle çözüyor: 1) 18 − 3 = 15  2) 15 × 4 = 60  3) 60 + 2 = 62.',
    prompt: 'İlk hata hangi gerekçeyle oluşmuştur?',
    answer: '1. adımda çarpma yapılmadan çıkarma işlemi uygulanmıştır.',
    distractors: [
      { text: '2. adımda 15 × 4 işlemi yanlış hesaplanmıştır.', misconceptionId: 'order:arithmetic-not-priority', why: 'Öğrenci hesap sonucu doğru olduğu hâlde hatayı aritmetik işlemde arar.', constructionRule: 'blame-correct-arithmetic' },
      { text: '3. adımda 2 eklemek yerine 2 çıkarılmalıydı.', misconceptionId: 'order:change-visible-operator', why: 'Öğrenci öncelik hatasını düzeltmek yerine son işlemin işaretini değiştirir.', constructionRule: 'flip-final-operator' },
      { text: 'Hata yoktur; işlemler her zaman soldan sağa yapılır.', misconceptionId: 'order:left-to-right-always', why: 'Öğrenci çarpma önceliğini göz ardı edip salt soldan sağa kuralı uygular.', constructionRule: 'apply-left-to-right-without-priority' }
    ],
    explanation: 'Çarpma, toplama ve çıkarmadan önce yapılmalıdır. Doğru işlem 18 − 12 + 2 = 8’dir.', cognitiveTraits: ['errorAnalysis', 'conditionEvaluation', 'usingIntermediateResultInNewDecision'], reasoningStepCount: 3,
    evidence: ['3 × 4 = 12 önce yapılır', '18 − 12 + 2 = 8']
  }),
  makeChoice({
    id: 'math-order-error-02', gameId: 'error-detective', familyId: 'pilot-math-order-error', skeletonId: 'pilot-math-order-error:parentheses', subjectId: 'mathematics', topicId: 'operation-order', learningOutcomeId: 'detect-parenthesis-error',
    context: 'Öğrenci 6 × (14 − 9) + 8 işlemini 6 × 14 − 9 + 8 biçiminde yeniden yazıyor.',
    prompt: 'Bu dönüşüm neden geçersizdir?',
    answer: '6 çarpanı parantezdeki iki terime de uygulanmadığı için dağılım özelliği eksik kullanılmıştır.',
    distractors: [
      { text: 'Parantez içindeki çıkarma, çarpmadan sonra yapılmalıdır.', misconceptionId: 'order:ignore-parentheses', why: 'Öğrenci parantezin işlem önceliğini belirlediğini gözden kaçırır.', constructionRule: 'move-parenthesis-operation-later' },
      { text: '6 ile 14 çarpılmamalı; yalnız 9 ile çarpılmalıdır.', misconceptionId: 'distribution:apply-to-second-only', why: 'Öğrenci dağılımı yalnız ikinci terime uygular.', constructionRule: 'distribute-to-second-term-only' },
      { text: 'Dönüşüm doğrudur; eksi işareti çarpanın ikinci terime uygulanmasını sağlar.', misconceptionId: 'distribution:sign-as-multiplier', why: 'Öğrenci eksi işaretinin eksik 6 çarpanını telafi ettiğini sanır.', constructionRule: 'treat-minus-as-distribution' }
    ],
    explanation: '6 × (14 − 9) = 6 × 14 − 6 × 9 olmalıdır. Öğrencinin yazımında ikinci terimde 6 çarpanı kaybolmuştur.', cognitiveTraits: ['errorAnalysis', 'representationTransform', 'informationLinking'], reasoningStepCount: 2,
    evidence: ['a(b − c) = ab − ac', '6 × (14 − 9) = 84 − 54']
  }),
  makeChoice({
    id: 'math-geometry-error-01', gameId: 'error-detective', familyId: 'pilot-math-geometry-error', skeletonId: 'pilot-math-geometry-error:perimeter-area', subjectId: 'mathematics', topicId: 'rectangle', learningOutcomeId: 'distinguish-area-and-perimeter',
    context: 'Uzun kenarı 12 cm, kısa kenarı 7 cm olan dikdörtgen bir çerçevenin çevresi soruluyor. Öğrenci 12 × 7 = 84 cm² yazıyor.',
    prompt: 'Öğrencinin hatasını en doğru açıklayan seçenek hangisidir?',
    answer: 'Alan formülü kullanılmış; çevre için 2 × (12 + 7) hesaplanmalıydı.',
    distractors: [
      { text: 'Kenarları çarpmak doğrudur; yalnız cm² yerine cm yazmalıydı.', misconceptionId: 'geometry:unit-only-error', why: 'Öğrenci formül hatasını görmeyip sorunu yalnız birim yazımına indirger.', constructionRule: 'keep-area-formula-change-unit' },
      { text: 'Çevreyi bulmak için 12 + 7 = 19 cm yeterlidir.', misconceptionId: 'geometry:half-perimeter', why: 'Öğrenci yalnız farklı iki kenarı toplar, karşı kenarları hesaba katmaz.', constructionRule: 'sum-two-distinct-sides' },
      { text: 'Çevre ve alan aynı sayıyı verdiği için işlem doğrudur.', misconceptionId: 'geometry:area-perimeter-equivalence', why: 'Öğrenci iki farklı büyüklüğü sayısal benzerlikle eş tutar.', constructionRule: 'equate-area-and-perimeter' }
    ],
    explanation: 'Çevre tüm kenarların toplamıdır: 2 × (12 + 7) = 38 cm. Alan ise 12 × 7 = 84 cm² olur.', cognitiveTraits: ['errorAnalysis', 'representationTransform', 'conditionEvaluation'], reasoningStepCount: 3,
    evidence: ['Çevre = 2(a+b)', 'Alan = a×b', 'Çevre birimi cm’dir']
  }),
  makeChoice({
    id: 'math-geometry-error-02', gameId: 'error-detective', familyId: 'pilot-math-geometry-error', skeletonId: 'pilot-math-geometry-error:scale-factor', subjectId: 'mathematics', topicId: 'scale', learningOutcomeId: 'distinguish-linear-and-area-scale',
    context: 'Bir karenin kenar uzunluğu 3 katına çıkarılıyor. Öğrenci alanın da 3 katına çıkacağını söylüyor.',
    prompt: 'Hangi açıklama öğrencinin yanılgısını düzeltir?',
    answer: 'Kenar 3 katına çıkınca alan 3 × 3 = 9 katına çıkar.',
    distractors: [
      { text: 'Alan yalnız bir kenara bağlıdır; bu nedenle 3 kat artar.', misconceptionId: 'scale:single-dimension-area', why: 'Öğrenci alanı tek boyutlu bir büyüklük gibi ele alır.', constructionRule: 'apply-linear-scale-to-area' },
      { text: 'Çevre 9 katına, alan ise yalnız 3 katına çıkar.', misconceptionId: 'scale:swap-linear-square', why: 'Öğrenci doğrusal ve karesel ölçek etkilerini yer değiştirir.', constructionRule: 'swap-perimeter-and-area-scale' },
      { text: 'Karenin şekli değişmediği için alan değişmez.', misconceptionId: 'scale:shape-sameness', why: 'Öğrenci benzer şekillerde büyüklüğün değişmediğini sanır.', constructionRule: 'confuse-similarity-with-equality' }
    ],
    explanation: 'Yeni alan (3a)² = 9a² olur. Kenar ölçeği 3, alan ölçeği 9’dur.', cognitiveTraits: ['errorAnalysis', 'representationTransform', 'usingIntermediateResultInNewDecision'], reasoningStepCount: 2,
    evidence: ['Eski alan a²', 'Yeni alan (3a)² = 9a²']
  }),
  makeChoice({
    id: 'math-ratio-error-01', gameId: 'error-detective', familyId: 'pilot-math-ratio-error', skeletonId: 'pilot-math-ratio-error:equivalent-ratio', subjectId: 'mathematics', topicId: 'ratio', learningOutcomeId: 'detect-non-equivalent-ratio',
    context: 'Bir karışımda su : meyve suyu oranı 3 : 2’dir. Öğrenci 12 bardak su için 6 bardak meyve suyu gerektiğini söylüyor.',
    prompt: 'Hata hangi düşünme adımındadır?',
    answer: '3 sayısı 4 ile çarpılarak 12 yapılırken 2 sayısı da 4 ile çarpılmalı ve 8 bulunmalıydı.',
    distractors: [
      { text: 'Oranın iki terimi toplanmalı; 12 + 5 = 17 bardak kullanılmalıydı.', misconceptionId: 'ratio:sum-terms', why: 'Öğrenci oranı eş parça ilişkisi yerine toplam işlemi olarak yorumlar.', constructionRule: 'add-ratio-terms' },
      { text: '12 bardak su için meyve suyu miktarı değişmez ve 2 bardak kalır.', misconceptionId: 'ratio:keep-second-term-fixed', why: 'Öğrenci bir terim ölçeklenirken diğerini sabit bırakır.', constructionRule: 'scale-one-term-only' },
      { text: '6 doğrudur; çünkü 12’nin yarısıdır.', misconceptionId: 'ratio:replace-with-half', why: 'Öğrenci 3:2 oranını 2:1 gibi algılayıp yarıya indirger.', constructionRule: 'use-half-instead-of-two-thirds' }
    ],
    explanation: '3:2 oranının eşdeğeri 12:8’dir. İki terim aynı katsayıyla çarpılmalıdır.', cognitiveTraits: ['errorAnalysis', 'informationLinking', 'conditionEvaluation'], reasoningStepCount: 2,
    evidence: ['12 ÷ 3 = 4', '2 × 4 = 8']
  }),
  makeChoice({
    id: 'math-ratio-error-02', gameId: 'error-detective', familyId: 'pilot-math-ratio-error', skeletonId: 'pilot-math-ratio-error:part-whole', subjectId: 'mathematics', topicId: 'ratio', learningOutcomeId: 'distinguish-part-part-and-part-whole',
    context: 'Bir sınıfta kızların erkeklere oranı 5:3 ve toplam öğrenci sayısı 32’dir. Öğrenci kız sayısını 32 × 5/3 olarak hesaplıyor.',
    prompt: 'Doğru çözümün ilk adımı hangisi olmalıdır?',
    answer: 'Önce 5 + 3 = 8 parça bulunmalı; 32 öğrenci 8 eş parçaya ayrılmalıdır.',
    distractors: [
      { text: '5:3 oranında kızları bulmak için 32 doğrudan 5’e bölünmelidir.', misconceptionId: 'ratio:divide-by-one-part-count', why: 'Öğrenci toplam parçayı değil yalnız kızlara ait parça sayısını bölen alır.', constructionRule: 'divide-total-by-first-ratio-term' },
      { text: '5:3 oranının farkı 2 olduğundan toplam 32, bu farka bölünmelidir.', misconceptionId: 'ratio:use-difference', why: 'Öğrenci oran terimlerinin farkını toplam parça sanır.', constructionRule: 'use-ratio-difference-as-parts' },
      { text: '5:3 oranı kızların payı olduğundan 32 sayısı 5/3 ile çarpılmalıdır.', misconceptionId: 'ratio:part-part-as-fraction-of-whole', why: 'Öğrenci parça-parça oranını bütünün kesri gibi kullanır.', constructionRule: 'treat-part-part-as-part-whole' }
    ],
    explanation: '5 + 3 = 8 parça vardır. Bir parça 32 ÷ 8 = 4, kız sayısı 5 × 4 = 20’dir.', cognitiveTraits: ['errorAnalysis', 'representationTransform', 'usingIntermediateResultInNewDecision'], reasoningStepCount: 3,
    evidence: ['Toplam parça 8', 'Bir parça 4', 'Kız sayısı 20']
  }),
  makeChoice({
    id: 'math-average-error-01', gameId: 'error-detective', familyId: 'pilot-math-average-error', skeletonId: 'pilot-math-average-error:missing-value', subjectId: 'mathematics', topicId: 'average', learningOutcomeId: 'detect-average-denominator-error',
    context: 'Dört sınav notu 70, 80, 90 ve 100’dür. Öğrenci ortalamayı (70+80+90+100) ÷ 3 = 113,3 olarak buluyor.',
    prompt: 'İlk hata hangisidir?',
    answer: 'Toplam, üçe değil dört not bulunduğu için dörde bölünmelidir.',
    distractors: [
      { text: 'Notlar toplanmamalı; yalnız en büyük ve en küçük not kullanılmalıdır.', misconceptionId: 'average:use-extremes-only', why: 'Öğrenci ortalamayı açıklık hesabıyla karıştırır.', constructionRule: 'replace-mean-with-range-endpoints' },
      { text: 'Toplam 340 yerine 330 olmalıdır.', misconceptionId: 'average:sum-slip', why: 'Öğrenci asıl bölen hatasını görmeyip doğru toplamı yanlış kabul eder.', constructionRule: 'invent-sum-error' },
      { text: 'İşlem doğrudur; ortalama notlardan büyük olabilir.', misconceptionId: 'average:ignore-bounds', why: 'Öğrenci aritmetik ortalamanın en küçük ve en büyük değer arasında kalması gerektiğini kontrol etmez.', constructionRule: 'accept-mean-outside-range' }
    ],
    explanation: 'Dört veri vardır. Toplam 340, ortalama 340 ÷ 4 = 85’tir; ayrıca 113,3’ün tüm notlardan büyük olması da hatayı gösterir.', cognitiveTraits: ['errorAnalysis', 'conditionEvaluation', 'informationLinking'], reasoningStepCount: 3,
    evidence: ['Veri sayısı 4', '340 ÷ 4 = 85', 'Ortalama veri aralığında olmalıdır']
  }),
  makeChoice({
    id: 'math-average-error-02', gameId: 'error-detective', familyId: 'pilot-math-average-error', skeletonId: 'pilot-math-average-error:weighted-average', subjectId: 'mathematics', topicId: 'average', learningOutcomeId: 'detect-unweighted-group-average',
    context: 'A grubunda 10 öğrencinin not ortalaması 80, B grubunda 30 öğrencinin not ortalaması 60’tır. Öğrenci iki ortalamanın ortalamasını alıp sınıf ortalamasını 70 buluyor.',
    prompt: 'Bu sonucun neden hatalı olduğunu en iyi açıklayan seçenek hangisidir?',
    answer: 'Grupların öğrenci sayıları farklıdır; ortalamalar öğrenci sayılarına göre ağırlıklandırılmalıdır.',
    distractors: [
      { text: 'İki ortalama hiçbir durumda birleştirilemez.', misconceptionId: 'average:cannot-combine-means', why: 'Öğrenci grup büyüklükleri bilinse bile birleşik ortalama hesaplanamayacağını sanır.', constructionRule: 'reject-valid-weighted-mean' },
      { text: 'Büyük grubun ortalaması doğrudan sınıf ortalaması kabul edilmelidir.', misconceptionId: 'average:use-largest-group-only', why: 'Öğrenci küçük grubu tamamen yok sayar.', constructionRule: 'discard-smaller-group' },
      { text: '70 doğrudur; her grup sonuçta tek bir ortalama değeri verir.', misconceptionId: 'average:equal-weight-groups', why: 'Öğrenci grup ortalamalarını, grup büyüklüğünden bağımsız eşit ağırlıklı sayar.', constructionRule: 'average-group-means-unweighted' }
    ],
    explanation: 'Toplam puan 10×80 + 30×60 = 2600’dür. 40 öğrenciye bölünür: 2600 ÷ 40 = 65.', cognitiveTraits: ['errorAnalysis', 'informationLinking', 'usingIntermediateResultInNewDecision'], reasoningStepCount: 3,
    evidence: ['A toplamı 800', 'B toplamı 1800', '2600 ÷ 40 = 65']
  }),
  makeChoice({
    id: 'math-equation-error-01', gameId: 'error-detective', familyId: 'pilot-math-equation-error', skeletonId: 'pilot-math-equation-error:balance', subjectId: 'mathematics', topicId: 'equations', learningOutcomeId: 'detect-unbalanced-equation-step',
    context: 'Öğrenci 3x + 7 = 25 denkleminde 7’yi sağ tarafa geçirip 3x = 25 + 7 yazıyor.',
    prompt: 'Denklem dengesini koruyan düzeltme hangisidir?',
    answer: 'Her iki taraftan 7 çıkarılmalı ve 3x = 18 yazılmalıdır.',
    distractors: [
      { text: 'Her iki tarafa 7 eklenmeli ve 3x = 32 yazılmalıdır.', misconceptionId: 'equation:add-instead-of-subtract', why: 'Öğrenci +7 terimini yok etmek için ters işlem yerine aynı işlemi uygular.', constructionRule: 'apply-same-sign-instead-of-inverse' },
      { text: 'Yalnız sol taraftan 7 çıkarılmalı; sağ taraf 25 kalmalıdır.', misconceptionId: 'equation:change-one-side-only', why: 'Öğrenci eşitliğin iki tarafına aynı işlemi uygulama kuralını ihlal eder.', constructionRule: 'modify-left-side-only' },
      { text: '25 ile 7 çarpılmalı; 3x = 175 bulunmalıdır.', misconceptionId: 'equation:operation-symbol-transfer', why: 'Öğrenci terimi karşı tarafa geçirirken işlemi anlamsız biçimde çarpmaya çevirir.', constructionRule: 'convert-addition-to-multiplication' }
    ],
    explanation: 'Eşitliğin iki tarafından 7 çıkarılır: 3x + 7 − 7 = 25 − 7, yani 3x = 18 ve x = 6.', cognitiveTraits: ['errorAnalysis', 'conditionEvaluation', 'usingIntermediateResultInNewDecision'], reasoningStepCount: 3,
    evidence: ['İki tarafa aynı işlem uygulanır', '25 − 7 = 18', '18 ÷ 3 = 6']
  }),
  makeChoice({
    id: 'math-equation-error-02', gameId: 'error-detective', familyId: 'pilot-math-equation-error', skeletonId: 'pilot-math-equation-error:distribution', subjectId: 'mathematics', topicId: 'equations', learningOutcomeId: 'detect-distribution-in-equation',
    context: 'Öğrenci 2(x − 3) = 14 denklemini 2x − 3 = 14 biçiminde açıyor.',
    prompt: 'Hangi adım çözümü doğru yola döndürür?',
    answer: '2(x − 3), 2x − 6 olur; sonra iki tarafa 6 eklenir.',
    distractors: [
      { text: 'Parantez 2x − 3 olarak kalmalı; yalnız 14 ikiye bölünmelidir.', misconceptionId: 'equation:partial-distribution', why: 'Öğrenci 2 çarpanını yalnız x terimine uygular.', constructionRule: 'distribute-to-variable-only' },
      { text: 'Parantez x − 6 biçiminde açılmalı; 2 yalnız 3 ile çarpılmalıdır.', misconceptionId: 'equation:distribute-to-constant-only', why: 'Öğrenci çarpanı yalnız sabit terime uygular.', constructionRule: 'distribute-to-constant-only' },
      { text: 'Eksi işareti parantezi yok eder; 2x + 3 = 14 yazılmalıdır.', misconceptionId: 'equation:flip-sign-without-rule', why: 'Öğrenci parantez kaldırmayı işaret değiştirme kuralıyla karıştırır.', constructionRule: 'flip-subtraction-to-addition' }
    ],
    explanation: '2, parantezdeki her terimle çarpılır: 2x − 6 = 14. Buradan 2x = 20 ve x = 10 bulunur.', cognitiveTraits: ['errorAnalysis', 'representationTransform', 'conditionEvaluation'], reasoningStepCount: 3,
    evidence: ['2(x−3)=2x−6', '2x=20', 'x=10']
  })
];

const TURKISH_ITEMS = [
  makeChoice({
    id: 'tr-main-idea-01', gameId: 'paragraph-detective', familyId: 'pilot-tr-main-idea-synthesis', skeletonId: 'pilot-tr-main-idea:evidence-synthesis', subjectId: 'turkish', topicId: 'main-idea', learningOutcomeId: 'derive-main-idea-from-multiple-details',
    context: 'Bir kentte belediye, yalnızca yeni bisiklet yolları açmakla kalmadı; iş yerlerine bisiklet park alanı kurma desteği verdi ve toplu taşımada bisiklet taşıma saatlerini artırdı. Altı ay sonra araç trafiği az miktarda düşerken kısa mesafeli yolculuklarda bisiklet kullanımı belirgin biçimde arttı.',
    prompt: 'Parçanın ana düşüncesi aşağıdakilerden hangisidir?',
    answer: 'Ulaşım alışkanlığı, birbirini tamamlayan düzenlemeler birlikte uygulanınca değişebilir.',
    distractors: [
      { text: 'Bisiklet yolu açılması, araç trafiğini kısa sürede büyük ölçüde azaltır.', misconceptionId: 'main-idea:overgeneralization', why: 'Metindeki sınırlı azalmayı “tamamen ortadan kalkma” biçiminde aşırı geneller.', constructionRule: 'amplify-limited-effect' },
      { text: 'Toplu taşımada bisiklet taşımak, yol yapımından daha etkili sonuç verir.', misconceptionId: 'main-idea:unsupported-ranking', why: 'Metin uygulamaları sıralamaz; birlikte etkili olduklarını gösterir.', constructionRule: 'invent-priority-ranking' },
      { text: 'Altı ay sonunda bisiklet, kentteki başlıca ulaşım seçeneklerinden biri olmuştur.', misconceptionId: 'main-idea:absolute-claim', why: 'Kısa mesafeli yolculuklardaki artışı bütün yolculuklara taşır.', constructionRule: 'extend-subset-to-whole' }
    ],
    explanation: 'Metin üç farklı düzenlemeyi ve bunların birlikte ortaya çıkardığı davranış değişikliğini anlatır. Ana düşünce tek bir uygulamayı değil, bütüncül yaklaşımı kapsar.', cognitiveTraits: ['informationLinking', 'multiStepInference', 'strategySelection'], reasoningStepCount: 3,
    evidence: ['Bisiklet yolu', 'Park desteği', 'Toplu taşımada taşıma imkânı', 'Kullanım artışı']
  }),
  makeChoice({
    id: 'tr-main-idea-02', gameId: 'paragraph-detective', familyId: 'pilot-tr-main-idea-contrast', skeletonId: 'pilot-tr-main-idea:contrast', subjectId: 'turkish', topicId: 'main-idea', learningOutcomeId: 'derive-main-idea-from-contrast',
    context: 'Bazı öğrenciler uzun süre masa başında kalmayı verimli çalışmanın kanıtı sayar. Oysa araştırmalar, aralıklı tekrar yapan ve yanlışlarını inceleyen öğrencilerin daha kısa sürede daha kalıcı öğrenebildiğini gösteriyor. Bu nedenle çalışma süresinden önce çalışmanın niteliğine bakmak gerekir.',
    prompt: 'Bu parçanın vermek istediği temel mesaj hangisidir?',
    answer: 'Verimli öğrenme, çalışma süresi kadar yönteme ve yanlışlardan yararlanmaya bağlıdır.',
    distractors: [
      { text: 'Kısa çalışan öğrenciler, uzun çalışanlardan genellikle daha başarılı olur.', misconceptionId: 'main-idea:reverse-absolute', why: 'Metindeki yöntem vurgusunu süre hakkında mutlak bir karşılaştırmaya dönüştürür.', constructionRule: 'turn-nuance-into-absolute-comparison' },
      { text: 'Yanlış yapmak, öğrenme sürecini çoğu durumda yavaşlatır.', misconceptionId: 'main-idea:ignore-error-analysis', why: 'Metin yanlışları incelemenin öğrenmeyi güçlendirdiğini söylerken tersini savunur.', constructionRule: 'invert-key-claim' },
      { text: 'Araştırmalar, öğrencilerin ara vermeden uzun süre çalışmasını önermektedir.', misconceptionId: 'main-idea:contradict-evidence', why: 'Aralıklı tekrar kanıtını görmezden gelerek metinle çelişir.', constructionRule: 'contradict-explicit-evidence' }
    ],
    explanation: 'Parça, süreyi tek ölçüt kabul eden görüşü eleştirir; aralıklı tekrar ve yanlış analiziyle çalışma niteliğinin önemini vurgular.', cognitiveTraits: ['informationLinking', 'multiStepInference', 'conditionEvaluation'], reasoningStepCount: 3,
    evidence: ['Aralıklı tekrar', 'Yanlışları inceleme', 'Kalıcı öğrenme']
  }),
  makeChoice({
    id: 'tr-inference-01', gameId: 'paragraph-detective', familyId: 'pilot-tr-inference-bounded', skeletonId: 'pilot-tr-inference:bounded-inference', subjectId: 'turkish', topicId: 'inference', learningOutcomeId: 'make-bounded-inference',
    context: 'Mahalle kütüphanesi hafta içi akşamları boş kalıyordu. Yönetim, yalnız açılış saatini uzatmak yerine kısa atölyeler düzenledi. Bir ay sonra toplam ziyaretçi sayısı çok az değişti; ancak içeride geçirilen süre ve ödünç alınan kitap sayısı arttı.',
    prompt: 'Bu bilgilerden hangisine güvenle ulaşılabilir?',
    answer: 'Kütüphanenin kullanım niteliği, yalnız ziyaretçi sayısıyla ölçülemeyecek biçimde gelişmiştir.',
    distractors: [
      { text: 'Atölyelere katılan herkes daha önce kütüphaneye hiç gelmemiştir.', misconceptionId: 'inference:invent-participant-history', why: 'Metinde katılımcıların önceki kullanım geçmişi hakkında bilgi yoktur.', constructionRule: 'add-unsupported-background' },
      { text: 'Ziyaretçi sayısı belirgin artmadığı için uygulama başarısız olmuştur.', misconceptionId: 'inference:single-metric-fixation', why: 'İçeride kalma süresi ve ödünç kitap artışını yok sayıp tek göstergeye odaklanır.', constructionRule: 'ignore-two-supporting-metrics' },
      { text: 'Yönetim akşam saatlerini yeniden kısaltmaya karar vermiştir.', misconceptionId: 'inference:invent-future-action', why: 'Metin gelecekteki yönetim kararını bildirmez.', constructionRule: 'invent-future-decision' }
    ],
    explanation: 'Ziyaretçi sayısı çok değişmemiş olsa da içeride kalma ve ödünç alma artmıştır. Bu iki kanıt kullanımın niteliğinin geliştiğini destekler.', cognitiveTraits: ['multiStepInference', 'informationLinking', 'conditionEvaluation'], reasoningStepCount: 3,
    evidence: ['Ziyaretçi sayısı az değişti', 'İçeride kalma süresi arttı', 'Ödünç kitap arttı']
  }),
  makeChoice({
    id: 'tr-inference-02', gameId: 'paragraph-detective', familyId: 'pilot-tr-inference-causal-limit', skeletonId: 'pilot-tr-inference:causal-limit', subjectId: 'turkish', topicId: 'inference', learningOutcomeId: 'avoid-overclaiming-cause',
    context: 'Bir okul, teneffüslerde koridorlara su sebilleri yerleştirdi. Sonraki haftalarda öğrencilerin plastik şişe satın alma sayısı azaldı. Aynı dönemde okul, tek kullanımlık plastiklerin çevresel etkisi hakkında bir farkındalık çalışması da yürüttü.',
    prompt: 'Parçaya göre en dikkatli çıkarım hangisidir?',
    answer: 'Azalma, sebiller ile farkındalık çalışmasının ortak etkisiyle ilişkili olabilir.',
    distractors: [
      { text: 'Azalmanın temel nedeni su sebilleridir; diğer etkenler önemsizdir.', misconceptionId: 'inference:single-cause-certainty', why: 'Aynı dönemdeki farkındalık çalışmasını dışlayıp tek nedeni kesinleştirir.', constructionRule: 'force-one-cause' },
      { text: 'Farkındalık çalışması, öğrencilerin şişe kullanımını artırmış olabilir.', misconceptionId: 'inference:reverse-effect', why: 'Gözlenen azalışı, kanıt sunulmadan ters yönde yorumlar.', constructionRule: 'reverse-observed-direction' },
      { text: 'Okuldaki öğrencilerin büyük bölümü plastik kullanımını bırakmıştır.', misconceptionId: 'inference:total-population-absolute', why: 'Satın alma sayısındaki azalmayı bütün öğrencilerin tamamen bırakmasına geneller.', constructionRule: 'convert-decrease-to-zero' }
    ],
    explanation: 'İki uygulama aynı dönemde yürütülmüştür. Veriler ilişkiyi gösterir; yalnız bir uygulamayı kesin neden ilan etmek için yeterli değildir.', cognitiveTraits: ['multiStepInference', 'hypothesisEvaluation', 'conditionEvaluation'], reasoningStepCount: 3,
    evidence: ['Sebiller yerleştirildi', 'Farkındalık çalışması yapıldı', 'Şişe satın alma azaldı']
  }),
  makeChoice({
    id: 'tr-evidence-01', gameId: 'paragraph-detective', familyId: 'pilot-tr-evidence-claim-support', skeletonId: 'pilot-tr-evidence:claim-support', subjectId: 'turkish', topicId: 'evidence', learningOutcomeId: 'select-best-evidence-for-claim',
    context: 'Bir yazıda “Şehir içindeki küçük yeşil alanlar bile yaz sıcaklığını azaltmaya katkı sağlar.” görüşü savunuluyor.',
    prompt: 'Aşağıdaki bilgilerden hangisi bu görüşü en doğrudan destekler?',
    answer: 'Ağaçlıklı parkın çevresi, aynı anda ölçülen asfalt alandan ortalama 3 °C serindir.',
    distractors: [
      { text: 'Park girişindeki bilgilendirme tabelasının geçen yıl yenilenmesi.', misconceptionId: 'evidence:irrelevant-detail', why: 'Parkın sıcaklık etkisiyle bağlantısı olmayan bir bakım ayrıntısıdır.', constructionRule: 'select-unrelated-fact' },
      { text: 'Şehir sakinlerinin yeşil alanları sevdiğini belirten bir anket yapılması.', misconceptionId: 'evidence:opinion-instead-of-measurement', why: 'Renk tercihi, yeşil alanın sıcaklığa etkisini ölçmez.', constructionRule: 'replace-physical-evidence-with-preference' },
      { text: 'Büyük ormanların farklı canlı türlerine yaşam alanı sağlaması.', misconceptionId: 'evidence:related-topic-not-claim', why: 'Yeşil alanların başka bir yararını anlatır ancak küçük parkların sıcaklık etkisini kanıtlamaz.', constructionRule: 'use-broad-related-fact' }
    ],
    explanation: 'Görüş sıcaklık etkisiyle ilgilidir. Aynı gün ve yakın bölgelerde yapılan doğrudan sıcaklık karşılaştırması iddiaya en uygun kanıttır.', cognitiveTraits: ['strategySelection', 'informationLinking', 'conditionEvaluation'], reasoningStepCount: 2,
    evidence: ['İddia: küçük yeşil alan sıcaklığı azaltır', 'Doğrudan sıcaklık karşılaştırması']
  }),
  makeChoice({
    id: 'tr-evidence-02', gameId: 'paragraph-detective', familyId: 'pilot-tr-evidence-weakness', skeletonId: 'pilot-tr-evidence:weak-evidence', subjectId: 'turkish', topicId: 'evidence', learningOutcomeId: 'identify-weak-evidence',
    context: 'Bir öğrenci “Dijital not almak, herkes için kâğıda yazmaktan daha etkilidir.” sonucuna ulaşıyor. Dayanağı, kendisinin bir hafta boyunca tablette çalışıp sınavdan yüksek not almasıdır.',
    prompt: 'Bu sonucun en önemli zayıflığı hangisidir?',
    answer: 'Tek kişinin kısa deneyimi, tüm öğrenciler için genel bir üstünlük sonucunu desteklemez.',
    distractors: [
      { text: 'Sınav notları, bu tür bir araştırmada uygun kanıt sayılmaz.', misconceptionId: 'evidence:reject-all-performance-data', why: 'Notların bağlama uygun biçimde kullanılabileceğini gözden kaçırıp bütünüyle reddeder.', constructionRule: 'overreject-valid-evidence-type' },
      { text: 'Tablet kullanımı bazı öğrenciler için kâğıttan daha pahalı olabilir.', misconceptionId: 'evidence:switch-to-cost', why: 'İddianın öğrenme etkililiği boyutunu maliyet tartışmasına çevirir.', constructionRule: 'change-evaluation-criterion' },
      { text: 'Bir haftalık deneyim, dijital not alma becerisini değerlendirmeye yeterlidir.', misconceptionId: 'evidence:assert-opposite-without-support', why: 'Sürenin yeterliliğini kanıt sunmadan kesinleştirir ve temel örneklem sorununu çözmez.', constructionRule: 'assert-duration-sufficiency' }
    ],
    explanation: 'Örneklem tek kişidir ve süre kısadır. Bu veri öğrencinin kendi deneyimini gösterebilir; “herkes için daha iyi” genellemesini kanıtlamaz.', cognitiveTraits: ['errorAnalysis', 'hypothesisEvaluation', 'conditionEvaluation'], reasoningStepCount: 3,
    evidence: ['Tek kişi', 'Bir hafta', 'Herkes için iddiası']
  }),
  makeChoice({
    id: 'tr-purpose-01', gameId: 'paragraph-detective', familyId: 'pilot-tr-author-purpose', skeletonId: 'pilot-tr-purpose-tone:purpose', subjectId: 'turkish', topicId: 'author-purpose', learningOutcomeId: 'infer-author-purpose-from-language',
    context: '“Musluğu dişlerinizi fırçalarken açık bırakmayın. İki dakikada boşa akan su, bir ailenin günlük içme suyu ihtiyacına yaklaşabilir. Küçük bir alışkanlık değişikliği büyük bir tasarruf sağlar.”',
    prompt: 'Yazarın temel amacı hangisidir?',
    answer: 'Okuru, sonuçlarını göstererek su tasarrufu davranışına yönlendirmek.',
    distractors: [
      { text: 'Suyun kimyasal yapısını bilimsel olarak açıklamak.', misconceptionId: 'purpose:topic-not-purpose', why: 'Metnin konusu su olsa da kimyasal yapı hakkında bilgi verilmez.', constructionRule: 'confuse-topic-with-purpose' },
      { text: 'Bir ailenin günlük yaşamını öyküleştirmek.', misconceptionId: 'purpose:genre-confusion', why: 'Aile yalnız karşılaştırma için anılır; olay örgüsü yoktur.', constructionRule: 'misclassify-as-narrative' },
      { text: 'Musluk çeşitlerini fiyatlarına göre karşılaştırmak.', misconceptionId: 'purpose:invent-comparison', why: 'Metinde ürün veya fiyat karşılaştırması bulunmaz.', constructionRule: 'invent-commercial-comparison' }
    ],
    explanation: 'Emir cümlesi, sayısal sonuç ve “alışkanlık değişikliği” vurgusu okuru davranışa yönlendirme amacını gösterir.', cognitiveTraits: ['informationLinking', 'strategySelection', 'multiStepInference'], reasoningStepCount: 2,
    evidence: ['“Açık bırakmayın”', 'Boşa akan su miktarı', 'Alışkanlık değişikliği çağrısı']
  }),
  makeChoice({
    id: 'tr-purpose-02', gameId: 'paragraph-detective', familyId: 'pilot-tr-tone', skeletonId: 'pilot-tr-purpose-tone:tone', subjectId: 'turkish', topicId: 'tone', learningOutcomeId: 'infer-tone-from-word-choice',
    context: '“Yıllardır boş duran istasyon binası sonunda onarıldı. Fakat restorasyonda özgün taşların bir kısmının plastik kaplamalarla örtülmesi, yapının geçmişle kurduğu bağı zayıflattı.”',
    prompt: 'Yazarın tutumu aşağıdakilerden hangisidir?',
    answer: 'Onarımı olumlu bulurken uygulamadaki özgünlük kaybını eleştiren ölçülü bir tutum.',
    distractors: [
      { text: 'Restorasyonun her yönünü koşulsuz öven bir tutum.', misconceptionId: 'tone:ignore-criticism', why: '“Fakat” sonrasındaki özgünlük eleştirisini görmezden gelir.', constructionRule: 'read-only-positive-clause' },
      { text: 'İstasyonun yıkılmasını isteyen öfkeli bir tutum.', misconceptionId: 'tone:exaggerate-criticism', why: 'Ölçülü eleştiriyi yıkım talebi ve öfkeye dönüştürür.', constructionRule: 'amplify-moderate-critique' },
      { text: 'Yapının tarihini tarafsız biçimde sıralayan nötr bir tutum.', misconceptionId: 'tone:mistake-evaluation-for-neutrality', why: '“Bağı zayıflattı” ifadesindeki açık değerlendirmeyi yok sayar.', constructionRule: 'strip-evaluative-language' }
    ],
    explanation: 'İlk cümle onarımı olumlu karşılar; “fakat” ile başlayan bölüm özgünlük kaybını eleştirir. Tutum iki yönlü ve ölçülüdür.', cognitiveTraits: ['informationLinking', 'conditionEvaluation', 'multiStepInference'], reasoningStepCount: 2,
    evidence: ['“sonunda onarıldı” olumlu', '“fakat” karşıtlık', '“bağı zayıflattı” eleştiri']
  }),
  makeChoice({
    id: 'tr-relation-01', gameId: 'paragraph-detective', familyId: 'pilot-tr-sentence-relation', skeletonId: 'pilot-tr-structure:sentence-relation', subjectId: 'turkish', topicId: 'text-structure', learningOutcomeId: 'identify-sentence-relation',
    context: '“Kentte yağmur suyu toplama depoları kuruldu. Böylece parkların sulanmasında şebeke suyu kullanımı azaldı.”',
    prompt: 'İkinci cümle, birinci cümleyle hangi anlam ilişkisini kurmaktadır?',
    answer: 'Birinci cümledeki uygulamanın sonucunu açıklamaktadır.',
    distractors: [
      { text: 'Birinci cümledeki düşünceyi örneklendirmektedir.', misconceptionId: 'structure:result-as-example', why: 'Sonuç bildiren “böylece” bağlacını örnekleme işareti gibi yorumlar.', constructionRule: 'misread-result-marker-as-example' },
      { text: 'Birinci cümledeki uygulamanın nedenini açıklamaktadır.', misconceptionId: 'structure:reverse-cause-effect', why: 'Depoların sonucu olan azalmayı neden olarak ters çevirir.', constructionRule: 'reverse-causal-direction' },
      { text: 'Birinci cümledeki bilgiyi çürütmektedir.', misconceptionId: 'structure:result-as-contradiction', why: 'İki cümle uyumlu olduğu hâlde karşıtlık varmış gibi okur.', constructionRule: 'invent-contradiction' }
    ],
    explanation: '“Böylece” sözcüğü, depoların kurulmasının ardından ortaya çıkan su kullanımındaki azalmayı sonuç olarak bağlar.', cognitiveTraits: ['informationLinking', 'conditionEvaluation', 'strategySelection'], reasoningStepCount: 2,
    evidence: ['Uygulama: depolar kuruldu', 'Sonuç: şebeke suyu azaldı', 'Bağlaç: böylece']
  }),
  makeChoice({
    id: 'tr-relation-02', gameId: 'paragraph-detective', familyId: 'pilot-tr-paragraph-completion', skeletonId: 'pilot-tr-structure:paragraph-completion', subjectId: 'turkish', topicId: 'paragraph-completion', learningOutcomeId: 'complete-paragraph-by-logic',
    context: '“Bir müzedeki dijital ekranlar, ziyaretçilerin eserlerin ayrıntılarını büyüterek incelemesine yardımcı olabilir. ________ Bu nedenle teknoloji, eserin kendisinin yerini alan değil, onu daha iyi anlamayı sağlayan bir araç olarak kullanılmalıdır.”',
    prompt: 'Boş bırakılan yere düşüncenin akışına en uygun cümle hangisidir?',
    answer: 'Ancak ekranlar öne çıktığında ziyaretçinin gerçek eserle kurduğu bağ zayıflayabilir.',
    distractors: [
      { text: 'Bu nedenle bazı müzeler belirli günlerde ücretsiz ziyaret edilebilmektedir.', misconceptionId: 'completion:topic-adjacent-irrelevant', why: 'Müze konusuyla ilişkili olsa da teknoloji-eser dengesi akışına katkı sağlamaz.', constructionRule: 'insert-related-but-unconnected-fact' },
      { text: 'Öte yandan dijital ekranların görüntü kalitesi zamanla artmaktadır.', misconceptionId: 'completion:technical-detail-without-contrast', why: 'Son cümledeki “yerini almama” sonucunu hazırlayan bir karşıtlık kurmaz.', constructionRule: 'insert-detail-that-does-not-support-conclusion' },
      { text: 'Bunun yanında ziyaretçiler müzeye farklı ulaşım araçlarıyla gelebilir.', misconceptionId: 'completion:scene-detail', why: 'Paragrafın düşünce ekseniyle ilgisiz bir sahne ayrıntısıdır.', constructionRule: 'insert-scene-decoration' }
    ],
    explanation: 'Son cümle teknolojinin eserin yerini almaması gerektiği sonucuna varır. Bu sonucu hazırlamak için teknolojinin aşırı kullanımına ilişkin bir risk cümlesi gerekir.', cognitiveTraits: ['informationLinking', 'multiStepInference', 'strategySelection'], reasoningStepCount: 3,
    evidence: ['İlk cümle yarar', 'Eksik cümle risk/karşıtlık', 'Son cümle denge sonucu']
  })
];

const SCIENCE_ITEMS = [
  makeChoice({
    id: 'sci-fair-test-01', gameId: 'science-reasoning', familyId: 'pilot-sci-fair-test', skeletonId: 'pilot-sci-fair-test:control-variables', subjectId: 'science', topicId: 'scientific-method', learningOutcomeId: 'identify-control-variables',
    context: 'Bir öğrenci su sıcaklığının şekerin çözünme süresine etkisini araştırıyor. Eşit hacimde su bulunan iki özdeş bardağın sıcaklıklarını 20 °C ve 40 °C yapıyor.',
    prompt: 'Yalnız sıcaklığın etkisini karşılaştırabilmek için hangi koşullar birlikte aynı tutulmalıdır?',
    answer: 'Şekerlerin kütlesi, biçimi ve karıştırma yöntemi.',
    distractors: [
      { text: 'Suların sıcaklığı ve çözünme süresi.', misconceptionId: 'experiment:hold-independent-and-dependent', why: 'Bağımsız ve bağımlı değişkeni sabit tutarak karşılaştırmayı anlamsızlaştırır.', constructionRule: 'freeze-tested-and-measured-variable' },
      { text: 'Çözünme süresi ve ölçüm sonucu.', misconceptionId: 'experiment:control-outcome', why: 'Ölçülmesi gereken sonucu önceden aynı kabul eder.', constructionRule: 'fix-dependent-variable' },
      { text: 'Bardakların bulunduğu masa ve öğrencinin göz rengi.', misconceptionId: 'experiment:mix-relevant-irrelevant-controls', why: 'Bir ilgili koşulu, sonucu etkilemeyen kişisel bir özellik ile eşleştirir.', constructionRule: 'pair-one-control-with-irrelevant-factor' }
    ],
    explanation: 'Bağımsız değişken sıcaklık, bağımlı değişken çözünme süresidir. Şeker miktarı, biçimi ve karıştırma yöntemi sabit tutulmalıdır.', cognitiveTraits: ['strategySelection', 'conditionEvaluation', 'informationLinking'], reasoningStepCount: 3,
    evidence: ['Değiştirilen: sıcaklık', 'Ölçülen: çözünme süresi', 'Diğer etkiler sabit']
  }),
  makeChoice({
    id: 'sci-fair-test-02', gameId: 'science-reasoning', familyId: 'pilot-sci-fair-test', skeletonId: 'pilot-sci-fair-test:confounder', subjectId: 'science', topicId: 'scientific-method', learningOutcomeId: 'detect-confounding-variable',
    context: 'İki bitkinin büyümesine gübrenin etkisi araştırılıyor. Birinci bitkiye gübre verilip güneşli pencereye, ikinci bitkiye gübre verilmeyip loş köşeye konuyor. İki hafta sonra birinci bitki daha uzun oluyor.',
    prompt: 'Bu deneyden yalnız gübrenin etkisi hakkında kesin sonuç çıkarılamamasının nedeni nedir?',
    answer: 'Gübre miktarıyla birlikte ışık koşulu da değiştirilmiştir.',
    distractors: [
      { text: 'Bitkilerin boyu ölçülmüştür; ölçüm yapmak deney sonucunu bozar.', misconceptionId: 'experiment:measurement-as-confounder', why: 'Bağımlı değişkeni ölçmeyi hata sanır.', constructionRule: 'treat-observation-as-interference' },
      { text: 'İki hafta çok uzun bir süredir; deneyler yalnız bir gün sürmelidir.', misconceptionId: 'experiment:arbitrary-duration-rule', why: 'Deney süresine kanıtsız ve evrensel bir sınır koyar.', constructionRule: 'invent-one-day-limit' },
      { text: 'Birinci bitkinin daha uzun olması, gübrenin tek neden olduğunu zaten kanıtlar.', misconceptionId: 'experiment:ignore-confounder', why: 'Işık farkını yok sayarak gözlenen sonucu tek nedene bağlar.', constructionRule: 'attribute-outcome-to-one-changed-factor' }
    ],
    explanation: 'İki grupta hem gübre hem ışık farklıdır. Hangi değişkenin büyümeyi etkilediği ayrılamaz; ışık koşulu aynı tutulmalıdır.', cognitiveTraits: ['errorAnalysis', 'hypothesisEvaluation', 'conditionEvaluation'], reasoningStepCount: 3,
    evidence: ['Gübre farklı', 'Işık farklı', 'Boy farklı']
  }),
  makeChoice({
    id: 'sci-data-01', gameId: 'science-reasoning', familyId: 'pilot-sci-data-inference', skeletonId: 'pilot-sci-data-inference:table-trend', subjectId: 'science', topicId: 'data-interpretation', learningOutcomeId: 'infer-pattern-from-table',
    context: 'Bir enzimin çalışma hızı farklı sıcaklıklarda ölçülüyor: 10 °C → 2 birim, 20 °C → 5 birim, 30 °C → 9 birim, 40 °C → 4 birim.',
    prompt: 'Verilerle doğrudan desteklenen sonuç hangisidir?',
    answer: 'Hız 30 °C’de en yüksek, 40 °C’de ise daha düşüktür.',
    distractors: [
      { text: 'Sıcaklık yükseldikçe enzim hızı düzenli biçimde artmayı sürdürür.', misconceptionId: 'data:assume-monotonic-increase', why: '40 °C’deki düşüşü yok sayarak ilk üç ölçümden aşırı genelleme yapar.', constructionRule: 'ignore-final-counterexample' },
      { text: 'Enzim 30 °C dışındaki sıcaklıklarda çalışmamaktadır.', misconceptionId: 'data:maximum-as-only-functioning-point', why: 'Diğer sıcaklıklardaki sıfırdan büyük hızları görmezden gelir.', constructionRule: 'turn-maximum-into-exclusive-condition' },
      { text: '40 °C ölçümünde enzimin etkinliği sona ermiştir.', misconceptionId: 'data:decrease-as-zero', why: '4 birimlik ölçümü “tamamen etkisiz” biçiminde yanlış yorumlar.', constructionRule: 'convert-lower-value-to-zero' }
    ],
    explanation: 'Tablodaki en büyük değer 30 °C’de 9’dur. 40 °C’de değer 4’e düşmüştür; diğer mutlak ifadeler verilerle uyuşmaz.', cognitiveTraits: ['informationLinking', 'multiStepInference', 'conditionEvaluation'], reasoningStepCount: 2,
    evidence: ['10:2', '20:5', '30:9', '40:4']
  }),
  makeChoice({
    id: 'sci-data-02', gameId: 'science-reasoning', familyId: 'pilot-sci-data-inference', skeletonId: 'pilot-sci-data-inference:compare-groups', subjectId: 'science', topicId: 'data-interpretation', learningOutcomeId: 'compare-group-data-with-uncertainty',
    context: 'Aynı tohum türüyle yapılan deneyde A grubundaki beş bitkinin ortalama boyu 18 cm, B grubundaki beş bitkinin ortalama boyu 21 cm ölçülmüştür. Her grupta ölçümler birbirinden farklıdır.',
    prompt: 'Yalnız bu bilgilere dayanarak en dikkatli yorum hangisidir?',
    answer: 'B grubunun ortalaması yüksektir; farkın nedeni için deney koşulları incelenmelidir.',
    distractors: [
      { text: 'B grubundaki bitkilerin tamamı A grubundakilerden daha uzundur.', misconceptionId: 'data:mean-as-every-individual', why: 'Ortalama farkını bütün bireylerin sıralaması gibi yorumlar.', constructionRule: 'extend-mean-to-all-members' },
      { text: 'B grubunun daha uzun olmasının temel nedeni verilen su miktarıdır.', misconceptionId: 'data:invent-cause', why: 'Sulama hakkında veri olmadığı hâlde neden atar.', constructionRule: 'invent-unreported-variable' },
      { text: 'Ortalamalar farklı olduğuna göre gruplardan birinin ölçümü hatalıdır.', misconceptionId: 'data:difference-as-measurement-error', why: 'Gruplar arası farkı otomatik olarak hata kabul eder.', constructionRule: 'treat-group-difference-as-invalid-data' }
    ],
    explanation: 'Ortalama değerler B grubunda daha yüksektir. Bireysel dağılım ve deney koşulları bilinmeden her bitki veya neden hakkında kesin yargı kurulamaz.', cognitiveTraits: ['informationLinking', 'hypothesisEvaluation', 'conditionEvaluation'], reasoningStepCount: 3,
    evidence: ['A ortalama 18', 'B ortalama 21', 'Bireysel ölçümler farklı']
  }),
  makeChoice({
    id: 'sci-evidence-01', gameId: 'science-reasoning', familyId: 'pilot-sci-evidence-strength', skeletonId: 'pilot-sci-evidence-strength:replication', subjectId: 'science', topicId: 'evidence', learningOutcomeId: 'compare-evidence-strength',
    context: 'Bir öğrenci “Yeni yalıtım malzemesi ısı kaybını azaltır.” iddiasını test etmek istiyor.',
    prompt: 'Hangi çalışma bu iddia için en güçlü kanıtı sağlar?',
    answer: 'Özdeş kutularda iki malzemeyi, eşit başlangıçla ve tekrarlı ölçümlerle karşılaştırmak.',
    distractors: [
      { text: 'Yeni malzemeye dokunup daha sıcak hissettirdiğini kaydetmek.', misconceptionId: 'evidence:subjective-single-observation', why: 'Öznel tek gözlemi kontrollü ölçüm yerine kullanır.', constructionRule: 'replace-measurement-with-feeling' },
      { text: 'Yeni malzemeli kutunun sıcaklığını bir kez ölçüp sonucu yazmak.', misconceptionId: 'evidence:no-comparison-group', why: 'Karşılaştırma grubu ve tekrar olmadığı için farkı malzemeye bağlayamaz.', constructionRule: 'single-group-single-trial' },
      { text: 'Üreticinin malzemeyi etkili bulduğunu belirten açıklamasını kanıt saymak.', misconceptionId: 'evidence:authority-claim-only', why: 'Bağımsız ölçüm yerine çıkarı olan kaynağın iddiasına dayanır.', constructionRule: 'use-promotional-claim-as-proof' }
    ],
    explanation: 'Güçlü kanıt; kontrol edilen koşullar, karşılaştırma grubu, nicel ölçüm ve tekrar içerir.', cognitiveTraits: ['strategySelection', 'hypothesisEvaluation', 'conditionEvaluation'], reasoningStepCount: 4,
    evidence: ['Özdeş kutular', 'Eşit başlangıç', 'Karşılaştırma', 'Tekrar']
  }),
  makeChoice({
    id: 'sci-evidence-02', gameId: 'science-reasoning', familyId: 'pilot-sci-evidence-strength', skeletonId: 'pilot-sci-evidence-strength:sample-size', subjectId: 'science', topicId: 'evidence', learningOutcomeId: 'evaluate-sample-size-and-repeatability',
    context: 'Bir ilaç dışı uyku yöntemini deneyen tek kişi, bir gece daha hızlı uyuduğunu bildiriyor ve yöntemin herkes için etkili olduğunu söylüyor.',
    prompt: 'Bu iddiayı sınamak için en gerekli geliştirme hangisidir?',
    answer: 'Daha çok katılımcıyla, birkaç gece süren ve karşılaştırma içeren tekrarlı çalışma yapmak.',
    distractors: [
      { text: 'Aynı kişinin deneyimini daha ayrıntılı biçimde kayda geçirmek.', misconceptionId: 'evidence:more-detail-same-sample', why: 'Tek kişilik örneklem sorununu çözmeden anlatım ayrıntısını artırır.', constructionRule: 'expand-description-not-evidence' },
      { text: 'Yönteme daha güven verici ve etkileyici bir ad vermek.', misconceptionId: 'evidence:branding-as-proof', why: 'Sunum biçimini bilimsel kanıtla karıştırır.', constructionRule: 'replace-evidence-with-branding' },
      { text: 'Sonucu doğru kabul edip bu etkinin nedenini araştırmaya başlamak.', misconceptionId: 'evidence:assume-conclusion-first', why: 'Etkililik kanıtlanmadan sonucu doğru varsayar.', constructionRule: 'presuppose-unverified-claim' }
    ],
    explanation: 'Tek kişi ve tek gece genelleme için yetersizdir. Örneklem, tekrar ve karşılaştırma koşulu artırılmalıdır.', cognitiveTraits: ['errorAnalysis', 'hypothesisEvaluation', 'strategySelection'], reasoningStepCount: 3,
    evidence: ['Tek kişi', 'Tek gece', 'Herkes için iddiası']
  }),
  makeChoice({
    id: 'sci-hypothesis-01', gameId: 'science-reasoning', familyId: 'pilot-sci-hypothesis-model', skeletonId: 'pilot-sci-hypothesis-model:testability', subjectId: 'science', topicId: 'hypothesis', learningOutcomeId: 'identify-testable-hypothesis',
    context: 'Bir öğrenci sınıftaki bitkilerin büyümesiyle ilgili araştırma planlıyor.',
    prompt: 'Aşağıdaki ifadelerden hangisi ölçülebilir ve test edilebilir bir hipotezdir?',
    answer: 'Sekiz saat ışık alan bitkiler, dört saat alanlardan dört haftada daha çok uzar.',
    distractors: [
      { text: 'Kendini iyi hisseden bitkiler, diğer bitkilerden daha hızlı büyür.', misconceptionId: 'hypothesis:undefined-subjective-variable', why: '“Mutlu hissetme” operasyonel olarak tanımlanmamış ve ölçülebilir değildir.', constructionRule: 'use-unmeasurable-state' },
      { text: 'Işık alan bitkiler, ışık almayan bitkilere göre daha iyi gelişir.', misconceptionId: 'hypothesis:vague-no-comparison', why: 'Değişken, ölçüm ve karşılaştırma belirtmeyen genel bir ifadedir.', constructionRule: 'state-general-fact-not-testable-prediction' },
      { text: 'Görünüşü güzel olan bitkiler, diğerlerinden daha sağlıklıdır.', misconceptionId: 'hypothesis:value-judgment', why: 'Ölçütleri tanımlanmamış öznel bir değer yargısıdır.', constructionRule: 'use-undefined-aesthetic-criterion' }
    ],
    explanation: 'Doğru hipotez ışık süresini değişken olarak tanımlar, aynı tür koşulunu belirtir ve dört haftalık boy uzamasıyla ölçülebilir sonuç öngörür.', cognitiveTraits: ['hypothesisEvaluation', 'conditionEvaluation', 'strategySelection'], reasoningStepCount: 3,
    evidence: ['Bağımsız değişken: ışık süresi', 'Ölçüm: boy uzaması', 'Süre: dört hafta']
  }),
  makeChoice({
    id: 'sci-hypothesis-02', gameId: 'science-reasoning', familyId: 'pilot-sci-hypothesis-model', skeletonId: 'pilot-sci-hypothesis-model:model-limit', subjectId: 'science', topicId: 'models', learningOutcomeId: 'evaluate-model-limitations',
    context: 'Bir öğrenci Güneş Sistemi’ni göstermek için gezegenleri aynı büyüklükte toplarla, aralarındaki uzaklıkları da eşit bırakarak bir model kuruyor.',
    prompt: 'Bu model hangi amaç için kullanılabilir, hangi amaç için kullanılamaz?',
    answer: 'Gezegenlerin sırasını gösterebilir; gerçek büyüklük ve uzaklık oranlarını gösteremez.',
    distractors: [
      { text: 'Gerçek uzaklıkları gösterir; çünkü gezegenler doğru sıradadır.', misconceptionId: 'model:one-accurate-feature-implies-all', why: 'Sıra doğruluğunu ölçek doğruluğuna geneller.', constructionRule: 'transfer-validity-across-features' },
      { text: 'Hiçbir bilgi veremez; ölçekli olmayan bütün modeller değersizdir.', misconceptionId: 'model:reject-partial-model', why: 'Modelin sıra bilgisini temsil edebildiğini yok sayar.', constructionRule: 'treat-limitation-as-total-invalidity' },
      { text: 'Gezegenlerin kütlelerini gösterir; topların aynı olması karşılaştırmayı kolaylaştırır.', misconceptionId: 'model:equal-size-as-mass-data', why: 'Aynı boyutlu toplardan gerçek kütle bilgisi çıkarır.', constructionRule: 'infer-unrepresented-property' }
    ],
    explanation: 'Modeller belirli özellikleri temsil eder. Bu model sıra için uygundur; eşit büyüklük ve uzaklıklar gerçek ölçek ilişkilerini bozar.', cognitiveTraits: ['representationTransform', 'conditionEvaluation', 'multiStepInference'], reasoningStepCount: 3,
    evidence: ['Doğru özellik: sıra', 'Bozulmuş özellik: büyüklük', 'Bozulmuş özellik: uzaklık']
  }),
  makeChoice({
    id: 'sci-causation-01', gameId: 'science-reasoning', familyId: 'pilot-sci-causation', skeletonId: 'pilot-sci-causation:correlation', subjectId: 'science', topicId: 'causation', learningOutcomeId: 'distinguish-correlation-and-causation',
    context: 'Bir şehirde yaz aylarında hem dondurma satışı hem güneş yanığı vakaları artıyor.',
    prompt: 'Bu iki artıştan çıkarılabilecek en bilimsel yorum hangisidir?',
    answer: 'Sıcak hava, hem dondurma satışını hem güneş yanığını artıran ortak etken olabilir.',
    distractors: [
      { text: 'Dondurma tüketimi, güneş yanığının doğrudan nedeni olabilir.', misconceptionId: 'causation:correlation-as-direct-cause', why: 'Birlikte değişimi doğrudan nedensellik olarak yorumlar.', constructionRule: 'convert-correlation-to-cause' },
      { text: 'Güneş yanığı, insanların daha fazla dondurma almasına yol açabilir.', misconceptionId: 'causation:reverse-cause', why: 'Nedensel yönü ters kurar ve kesinlik ekler.', constructionRule: 'invent-reverse-causality' },
      { text: 'İki artış aynı dönemde görülse de aralarında anlamlı ilişki bulunmaz.', misconceptionId: 'causation:deny-shared-factor', why: 'Ortak mevsimsel etken olasılığını yok sayar.', constructionRule: 'dismiss-observed-association' }
    ],
    explanation: 'Birlikte artış nedenselliği kanıtlamaz. Sıcak hava hem dondurma talebini hem güneşe maruz kalmayı artırabilir.', cognitiveTraits: ['hypothesisEvaluation', 'multiStepInference', 'conditionEvaluation'], reasoningStepCount: 3,
    evidence: ['İki değişken yazın artıyor', 'Ortak etken: sıcak hava']
  }),
  makeChoice({
    id: 'sci-causation-02', gameId: 'science-reasoning', familyId: 'pilot-sci-causation', skeletonId: 'pilot-sci-causation:alternative-explanation', subjectId: 'science', topicId: 'causation', learningOutcomeId: 'consider-alternative-explanations',
    context: 'Bir okulda sabah egzersizi programı başladıktan sonra öğrencilerin matematik notları yükseldi. Aynı dönemde okul etüt saatlerini de artırdı.',
    prompt: 'Egzersizin notları yükselttiğini daha güvenilir biçimde değerlendirmek için ne gerekir?',
    answer: 'Etüt süresi gibi diğer değişkenleri kontrol eden, benzer grupları karşılaştıran bir çalışma.',
    distractors: [
      { text: 'Not artışını yalnız egzersize bağlamak; program önce başlamıştır.', misconceptionId: 'causation:post-hoc', why: 'Zaman sırasını tek başına nedensellik kanıtı sayar.', constructionRule: 'cause-because-before' },
      { text: 'Egzersiz yapan bir öğrencinin görüşünü bütün okulun sonucu kabul etmek.', misconceptionId: 'causation:anecdote-generalization', why: 'Tek bir kişinin görüşünü grup düzeyinde kanıt sayar.', constructionRule: 'generalize-anecdote' },
      { text: 'Etüt saatlerini yok saymak; notlar zaten yükselmiştir.', misconceptionId: 'causation:ignore-concurrent-change', why: 'Aynı dönemde değişen alternatif açıklamayı dikkate almaz.', constructionRule: 'discard-confounding-variable' }
    ],
    explanation: 'Egzersiz ve etüt aynı dönemde değişmiştir. Benzer gruplar ve kontrol edilen etüt süresi olmadan katkıları ayrılamaz.', cognitiveTraits: ['hypothesisEvaluation', 'strategySelection', 'conditionEvaluation'], reasoningStepCount: 3,
    evidence: ['Egzersiz başladı', 'Etüt arttı', 'Notlar yükseldi']
  })
];

const BANK = Object.freeze({
  'error-detective': MATH_ITEMS,
  'paragraph-detective': TURKISH_ITEMS,
  'science-reasoning': SCIENCE_ITEMS
});

export const PREMIUM_PILOT_GAME_IDS = Object.freeze(Object.keys(BANK));

function materialize(item, random) {
  const entries = shuffleEntries([
    { text: item.answer, correct: true, misconceptionId: null, why: item.explanation, constructionRule: 'verified-correct-answer' },
    ...item.distractors.map((d) => ({ ...d, correct: false }))
  ], random);
  const options = entries.map((entry) => entry.text);
  const answerIndex = entries.findIndex((entry) => entry.correct);
  const optionDiagnostics = entries.map((entry, optionIndex) => ({
    optionIndex,
    optionText: entry.text,
    isCorrect: Boolean(entry.correct),
    misconceptionId: entry.correct ? null : entry.misconceptionId,
    misconceptionName: entry.correct ? null : entry.misconceptionId,
    misconception: entry.correct ? null : entry.why,
    rationale: entry.correct ? 'Doğru seçenek çözüm grafiğiyle doğrulanmıştır.' : entry.why,
    whyStudentChoosesThis: entry.correct ? 'Kanıtlar ve çözüm adımları eksiksiz uygulanır.' : entry.why,
    constructionRule: entry.constructionRule,
    plausibilityScore: entry.correct ? 1 : 0.82,
    grammarShape: 'sentence',
    semanticCategory: entry.correct ? 'correct-answer' : entry.misconceptionId
  }));
  const familyId = item.familyId;
  const skeletonId = item.skeletonId;
  const keySource = `${item.id}|${normalize(item.prompt)}|${normalize(item.context)}`;
  return {
    kind: 'choice',
    prompt: item.prompt,
    context: item.context,
    options,
    answerIndex,
    explanation: item.explanation,
    hints: item.hints.length ? item.hints : ['Metindeki/verideki kanıtları sırayla ayır.', 'Her seçeneği aynı ölçüte göre kontrol et.'],
    skill: item.subjectId,
    difficulty: item.difficulty,
    cognitiveDepth: item.difficulty,
    reasoningStepCount: item.reasoningStepCount,
    cognitiveTraits: item.cognitiveTraits,
    questionKey: `premium-pilot:${item.gameId}:${item.id}:${stableHash(keySource)}`,
    familyId,
    skeletonId,
    reasoningPathId: item.reasoningPathId,
    subjectId: item.subjectId,
    topicId: item.topicId,
    learningOutcomeId: item.learningOutcomeId,
    gradeBand: item.gradeBand,
    sourceLabel: 'Zihin Arenası Kalite Pilotu',
    premiumTier: 'PILOT_GOLD',
    premiumPilot: true,
    requireExplicitDistractorEvidence: true,
    optionDiagnostics,
    detailedOptions: optionDiagnostics.map((entry) => entry.isCorrect
      ? `Doğru: ${item.explanation}`
      : `Yanlış: ${entry.rationale}`),
    distractorPlanId: `${skeletonId}:mis:${stableHash(item.distractors.map((entry) => entry.misconceptionId).join('|'))}`,
    distractorValidation: {
      verified: true,
      diagnosticCount: 3,
      distinctMisconceptions: 3,
      violations: []
    },
    evidenceMap: {
      evidence: item.evidence.map((text, index) => ({ id: `${item.id}:e${index + 1}`, text })),
      correctAnswerEvidenceIds: item.evidence.map((_, index) => `${item.id}:e${index + 1}`)
    },
    cognitiveDepthEvidence: {
      reasoningStepCount: item.reasoningStepCount,
      highCognitiveTraits: item.cognitiveTraits,
      source: 'premium-pilot-human-authored'
    },
    solutionGraph: item.evidence.map((text, index) => ({ step: index + 1, evidence: text }))
  };
}

export function generatePremiumPilotRounds(gameId, {
  seed = 1,
  count = 20,
  seenQuestionKeys = new Set(),
  grade = null
} = {}) {
  const items = BANK[gameId] || [];
  if (!items.length) return { rounds: [], audit: { supported: false, gameId, available: 0, produced: 0 } };
  const normalizedGrade = normalizeStudentGrade(grade);
  const eligibleItems = items.filter((item) => isPremiumGradeEligible(item.gradeBand, normalizedGrade));
  const random = seededRandom(`${gameId}:${seed}:${PILOT_VERSION}:${normalizedGrade ?? 'all'}`);
  const candidates = eligibleItems
    .map((item) => materialize(item, random))
    .filter((round) => !seenQuestionKeys.has(round.questionKey));
  const shuffled = shuffleEntries(candidates, random);
  const rounds = shuffled.slice(0, Math.max(0, Number(count) || 0));
  return {
    rounds,
    audit: {
      supported: true,
      gameId,
      version: PILOT_VERSION,
      available: items.length,
      gradeRequested: normalizedGrade,
      gradeFilterApplied: normalizedGrade !== null,
      gradeEligibleAvailable: eligibleItems.length,
      gradeBandsAvailable: [...new Set(items.map((item) => item.gradeBand))],
      unseenAvailable: candidates.length,
      requested: count,
      produced: rounds.length,
      fallbackToLegacy: false
    }
  };
}

export function premiumPilotInventory() {
  return Object.fromEntries(Object.entries(BANK).map(([gameId, items]) => [gameId, {
    questionCount: items.length,
    familyCount: new Set(items.map((item) => item.familyId)).size,
    topicCount: new Set(items.map((item) => item.topicId)).size,
    gradeBands: [...new Set(items.map((item) => item.gradeBand))],
    allHaveThreeMisconceptions: items.every((item) => item.distractors.length === 3 && new Set(item.distractors.map((d) => d.misconceptionId)).size === 3)
  }]));
}
