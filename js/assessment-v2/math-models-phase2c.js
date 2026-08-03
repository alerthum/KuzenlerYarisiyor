import { defineItemModel } from './contracts.js';

const SMALL_PRIMES = Object.freeze([2, 3, 5, 7, 11, 13, 17, 19]);

function smallestNumberWithDivisorCount(target) {
  if (!Number.isInteger(target) || target < 2) throw new Error('divisor target must be an integer >= 2');
  let best = Number.POSITIVE_INFINITY;

  function search(primeIndex, maxExponent, remainingFactor, current) {
    if (remainingFactor === 1) {
      best = Math.min(best, current);
      return;
    }
    if (primeIndex >= SMALL_PRIMES.length) return;
    const prime = SMALL_PRIMES[primeIndex];
    let primePower = 1;
    for (let exponent = 1; exponent <= maxExponent; exponent += 1) {
      primePower *= prime;
      if (current * primePower >= best) break;
      const divisorContribution = exponent + 1;
      if (remainingFactor % divisorContribution !== 0) continue;
      search(
        primeIndex + 1,
        exponent,
        remainingFactor / divisorContribution,
        current * primePower
      );
    }
  }

  search(0, target - 1, target, 1);
  if (!Number.isFinite(best)) throw new Error(`no divisor structure found for ${target}`);
  return best;
}

function countDivisorsByPairs(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) return 0;
  let count = 0;
  for (let divisor = 1; divisor * divisor <= n; divisor += 1) {
    if (n % divisor !== 0) continue;
    count += divisor * divisor === n ? 1 : 2;
  }
  return count;
}

function bruteSmallestWithDivisorCount(target, upperBound) {
  for (let value = 1; value <= upperBound; value += 1) {
    if (countDivisorsByPairs(value) === target) return value;
  }
  return null;
}

export const divisorStructureMinimumModel = defineItemModel({
  id: 'math-divisor-structure-minimum-v2',
  domain: 'mathematics',
  construct: {
    id: 'construct-divisor-exponent-structure',
    gradeRange: [7, 12],
    subjectId: 'mathematics',
    curriculumOutcomeIds: ['optimize-number-from-divisor-count'],
    knowledgeComponents: ['prime-factorization', 'divisor-count-formula', 'exponent-partitions'],
    claim: 'Öğrenci bölen sayısını üslerin bir fazlalarının çarpımı olarak yapılandırıp en küçük sayıyı belirler.'
  },
  deepFeatures: ['multiplicative-partitions', 'prime-exponent-minimization'],
  surfaceFeatures: ['positive-integer', 'exact-divisor-count'],
  compatibleGameIds: ['olympiad-ladder', 'problem-hunter'],
  solutionGraph: { steps: [
    {
      id: 's1',
      action: 'bölen sayısını üs kalıplarına ayır',
      dependsOn: [],
      evidence: 'n=p₁^a₁p₂^a₂… ise bölen sayısı (a₁+1)(a₂+1)… olur; 18 için 18, 9·2, 6·3 ve 3·3·2 kalıpları incelenir.',
      hint: '18’i, asal çarpan üslerinin bir fazlalarını temsil edecek biçimde çarpanlarına ayır.'
    },
    {
      id: 's2',
      action: 'büyük üsleri küçük asal sayılara yerleştir',
      dependsOn: ['s1'],
      evidence: 'Aynı üs kalıbında sayıyı küçültmek için en büyük üs 2’ye, sonraki üs 3’e verilmelidir.',
      hint: 'Sayıyı küçültmek için büyük üs 2’ye mi, daha büyük bir asal sayıya mı verilmelidir?'
    },
    {
      id: 's3',
      action: 'tüm üs kalıplarının en küçük temsilcilerini karşılaştır',
      dependsOn: ['s2'],
      evidence: '2^17, 2^8·3=768, 2^5·3^2=288 ve 2^2·3^2·5=180 karşılaştırılır; en küçüğü 180’dir.',
      hint: 'Her çarpan kalıbı için en küçük sayıyı yaz ve yalnız ilk bulduğunla yetinme.'
    }
  ]},
  misconceptions: [
    {
      id: 'use-first-composite-factorization',
      description: '18=9·2 kalıbını bulunca diğer üs kalıplarını karşılaştırmadan durur.',
      buggyRule: 'use-2^8-times-3',
      feedback: '9·2 kalıbı geçerlidir fakat en küçük sonucu vermeyebilir; 3·3·2 kalıbı da incelenmelidir.',
      apply: () => (2 ** 8) * 3
    },
    {
      id: 'omit-three-prime-pattern',
      description: 'Yalnız iki asal çarpanlı yapıları inceler ve 6·3 kalıbında kalır.',
      buggyRule: 'use-2^5-times-3^2',
      feedback: 'Üç asal çarpanlı 3·3·2 kalıbı 180’i verir ve iki asal çarpanlı 288’den daha küçüktür.',
      apply: () => (2 ** 5) * (3 ** 2)
    },
    {
      id: 'forget-plus-one-in-divisor-formula',
      description: '3·3·2 çarpanlarını üslerin bir fazlası yerine doğrudan üs olarak kullanır.',
      buggyRule: 'use-exponents-3-3-2',
      feedback: 'Bölen sayısında kullanılan çarpanlar üslerin kendisi değil, üslerin bir fazlasıdır.',
      apply: () => (2 ** 3) * (3 ** 3) * (5 ** 2)
    }
  ],
  generateTask: ({ divisorCount = 18 } = {}) => ({ divisorCount: Number(divisorCount) }),
  solve: task => smallestNumberWithDivisorCount(task.divisorCount),
  verify: (task, value) => {
    const candidate = Number(value);
    if (!Number.isInteger(candidate) || candidate < 1) return false;
    return countDivisorsByPairs(candidate) === task.divisorCount
      && bruteSmallestWithDivisorCount(task.divisorCount, candidate) === candidate;
  },
  render: task => ({
    context: `Pozitif bölenlerinin sayısı tam ${task.divisorCount} olan pozitif tam sayılar inceleniyor.`,
    prompt: 'Bu sayıların en küçüğü kaçtır?',
    formatOption: String
  })
});

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function reflectedMinimumPath(task) {
  const reflectedB = { x: task.b.x, y: -task.b.y };
  return distance(task.a, reflectedB);
}

function numericalMinimumPath(task) {
  let left = Math.min(task.a.x, task.b.x) - 100;
  let right = Math.max(task.a.x, task.b.x) + 100;
  const objective = x => (
    Math.hypot(x - task.a.x, task.a.y)
    + Math.hypot(x - task.b.x, task.b.y)
  );
  for (let iteration = 0; iteration < 250; iteration += 1) {
    const oneThird = (right - left) / 3;
    const x1 = left + oneThird;
    const x2 = right - oneThird;
    if (objective(x1) <= objective(x2)) right = x2;
    else left = x1;
  }
  return objective((left + right) / 2);
}

function formatLength(value) {
  const number = Number(value);
  if (Number.isInteger(number)) return String(number);
  return number.toFixed(2).replace('.', ',');
}

export const geometricReflectionPathModel = defineItemModel({
  id: 'math-geometric-reflection-path-v2',
  domain: 'mathematics',
  construct: {
    id: 'construct-geometric-reflection-shortest-path',
    gradeRange: [7, 12],
    subjectId: 'mathematics',
    curriculumOutcomeIds: ['use-reflection-to-minimize-broken-path'],
    knowledgeComponents: ['reflection', 'triangle-inequality', 'distance-formula'],
    claim: 'Öğrenci bir doğru üzerindeki kırık yolun en küçüğünü yansıma ile düz çizgi uzunluğuna dönüştürür.'
  },
  deepFeatures: ['reflection-transformation', 'shortest-broken-path'],
  surfaceFeatures: ['coordinate-plane', 'boundary-point', 'two-fixed-points'],
  compatibleGameIds: ['olympiad-ladder', 'problem-hunter'],
  solutionGraph: { steps: [
    {
      id: 's1',
      action: 'noktalardan birini sınır doğrusuna göre yansıt',
      dependsOn: [],
      evidence: 'B=(7,5) noktası x eksenine göre B′=(7,−5) olur ve eksen üzerindeki her P için PB=PB′ eşitliği sağlanır.',
      hint: 'P eksen üzerinde olduğuna göre B’yi eksenin öbür tarafına yansıtınca PB uzunluğu değişir mi?'
    },
    {
      id: 's2',
      action: 'kırık yolu yansıtılmış düz yola dönüştür',
      dependsOn: ['s1'],
      evidence: 'AP+PB toplamı AP+PB′ olur; üçgen eşitsizliğine göre bu toplam en az AB′ uzunluğudur.',
      hint: 'AP+PB′ toplamının en küçük olması için A, P ve B′ nasıl konumlanmalıdır?'
    },
    {
      id: 's3',
      action: 'yansıtılmış noktalar arasındaki uzaklığı hesapla',
      dependsOn: ['s2'],
      evidence: 'A=(1,3) ve B′=(7,−5) için yatay fark 6, düşey fark 8’dir; AB′=√(6²+8²)=10.',
      hint: 'Yansıtmadan sonra yatay ve düşey farklarla Pisagor bağıntısını kullan.'
    }
  ]},
  misconceptions: [
    {
      id: 'ignore-boundary-point',
      description: 'P noktasının x ekseni üzerinde olma koşulunu yok sayıp doğrudan AB uzaklığını alır.',
      buggyRule: 'direct-distance-between-original-points',
      feedback: 'Doğrudan AB parçası x eksenine uğramaz; yolun P noktasından geçmesi zorunludur.',
      apply: task => distance(task.a, task.b)
    },
    {
      id: 'use-only-vertical-distances',
      description: 'Yatay hareketi yok sayıp iki noktanın eksene uzaklıklarını toplar.',
      buggyRule: 'sum-heights-only',
      feedback: 'Noktaların x koordinatları farklı olduğu için yatay uzaklık da toplam yolu etkiler.',
      apply: task => task.a.y + task.b.y
    },
    {
      id: 'use-manhattan-after-reflection',
      description: 'Yansıtılmış iki nokta arasında Öklid uzaklığı yerine yatay ve düşey farkları toplar.',
      buggyRule: 'manhattan-distance-after-reflection',
      feedback: 'En kısa düz yolun uzunluğu farkların toplamı değil, Pisagor bağıntısıyla bulunan Öklid uzaklığıdır.',
      apply: task => Math.abs(task.a.x - task.b.x) + task.a.y + task.b.y
    }
  ],
  generateTask: () => ({ a: { x: 1, y: 3 }, b: { x: 7, y: 5 } }),
  solve: task => reflectedMinimumPath(task),
  verify: (task, value) => Math.abs(Number(value) - numericalMinimumPath(task)) < 1e-8,
  render: task => ({
    context: `Koordinat düzleminde A=(${task.a.x}, ${task.a.y}) ve B=(${task.b.x}, ${task.b.y}) noktaları x ekseninin üstündedir. P noktası x ekseni üzerinde seçiliyor.`,
    prompt: 'AP+PB toplamının alabileceği en küçük değer kaçtır?',
    formatOption: formatLength
  })
});

export const PHASE2C_MATH_MODELS = Object.freeze([
  divisorStructureMinimumModel,
  geometricReflectionPathModel
]);
