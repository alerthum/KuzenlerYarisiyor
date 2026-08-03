import { defineItemModel } from './contracts.js';

function gcd(a, b) {
  let x = Math.abs(Number(a));
  let y = Math.abs(Number(b));
  while (y !== 0) [x, y] = [y, x % y];
  return x;
}

function pairLabel([x, y]) {
  return `(${x}, ${y})`;
}

function reachableFromOneOne([xInput, yInput]) {
  let x = Number(xInput);
  let y = Number(yInput);
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 1 || y < 1) return false;
  while (x !== y) {
    if (x > y) x -= y;
    else y -= x;
  }
  return x === 1 && y === 1;
}

function fibonacciNumbersUpTo(limit) {
  const values = new Set([1]);
  let a = 1;
  let b = 1;
  while (b <= limit) {
    values.add(b);
    [a, b] = [b, a + b];
  }
  return values;
}

export const invariantEuclidModel = defineItemModel({
  id: 'math-invariant-euclid-v2',
  domain: 'mathematics',
  construct: {
    id: 'construct-invariant-gcd',
    gradeRange: [7, 12],
    subjectId: 'mathematics',
    curriculumOutcomeIds: ['identify-operation-invariant'],
    knowledgeComponents: ['greatest-common-divisor', 'invariant', 'reverse-operation'],
    claim: 'Öğrenci iki sayıya uygulanan toplama hamlelerinde EBOB değişmezini kullanarak ulaşılamayan durumu belirler.'
  },
  deepFeatures: ['gcd-invariant', 'reverse-euclidean-reachability'],
  surfaceFeatures: ['ordered-pair', 'add-one-coordinate-to-other'],
  compatibleGameIds: ['olympiad-ladder', 'problem-hunter'],
  solutionGraph: { steps: [
    {
      id: 's1',
      action: 'hamlenin ortak bölenleri değiştirmediğini göster',
      dependsOn: [],
      evidence: 'Bir sayıya diğerini eklemek EBOB’u değiştirmez; EBOB(x+y,y)=EBOB(x,y) ve EBOB(x,x+y)=EBOB(x,y).',
      hint: 'Bir sayıya diğerinin katı eklendiğinde ortak bölenlere ne olur?'
    },
    {
      id: 's2',
      action: 'başlangıç çiftinin değişmezini hesapla',
      dependsOn: ['s1'],
      evidence: '(1,1) çiftinin EBOB’u 1 olduğundan ulaşılabilen her çift aralarında asal olmalıdır.',
      hint: 'Başlangıçtaki iki sayının EBOB’unu bul.'
    },
    {
      id: 's3',
      action: 'adayları değişmez ve ters hamleyle denetle',
      dependsOn: ['s2'],
      evidence: 'Aralarında asal adaylar büyük sayıdan küçüğü çıkaran Öklid adımlarıyla (1,1)’e iner; (8,12) ise EBOB 4 olduğu için inemez.',
      hint: 'Adaylarda büyük sayıdan küçüğü tekrar tekrar çıkar; hangisi (1,1)’e ulaşmıyor?'
    }
  ]},
  misconceptions: [
    {
      id: 'fibonacci-only-path',
      description: 'Yalnız ardışık Fibonacci çiftlerinin üretilebileceğini sanır.',
      buggyRule: 'reject-first-non-fibonacci-pair',
      feedback: 'Hamleler yalnız Fibonacci çiftleri üretmez; gerekli koşul sayıların aralarında asal olmasıdır.',
      apply: (task) => {
        const max = Math.max(...task.candidates.flat());
        const fib = fibonacciNumbersUpTo(max);
        const candidate = task.candidates.find(([x, y]) => !(fib.has(x) && fib.has(y)) && gcd(x, y) === 1);
        return pairLabel(candidate);
      }
    },
    {
      id: 'sum-parity-as-invariant',
      description: 'Toplamın çiftliğinin her hamlede korunduğunu varsayar.',
      buggyRule: 'reject-odd-coordinate-sum',
      feedback: 'Hamlede toplam x+y’den 2x+y veya x+2y’ye dönüşür; toplamın paritesi değişmez değildir.',
      apply: (task) => pairLabel(task.candidates.find(([x, y]) => (x + y) % 2 === 1))
    },
    {
      id: 'difference-growth-ban',
      description: 'Başlangıç farkı 0 olduğu için büyük farkların oluşamayacağını düşünür.',
      buggyRule: 'reject-largest-coordinate-gap',
      feedback: 'Koordinatlar arasındaki fark korunmaz; bir sayıya diğerini eklemek farkı büyütebilir.',
      apply: (task) => pairLabel(task.candidates.reduce((best, pair) => (
        Math.abs(pair[0] - pair[1]) > Math.abs(best[0] - best[1]) ? pair : best
      )))
    }
  ],
  generateTask: ({ candidates } = {}) => ({
    candidates: Array.isArray(candidates) && candidates.length === 4
      ? candidates.map(pair => [Number(pair[0]), Number(pair[1])])
      : [[8, 13], [7, 11], [5, 12], [8, 12]]
  }),
  solve: (task) => {
    const impossible = task.candidates.filter(([x, y]) => gcd(x, y) !== 1);
    if (impossible.length !== 1) throw new Error('math-invariant-euclid-v2: expected exactly one gcd-obstructed candidate');
    return pairLabel(impossible[0]);
  },
  verify: (task, value) => {
    const unreachable = task.candidates.filter(pair => !reachableFromOneOne(pair));
    return unreachable.length === 1 && String(value) === pairLabel(unreachable[0]);
  },
  render: (task) => ({
    context: `Başlangıçta tahta üzerinde (1, 1) yazıyor. Her hamlede (x, y) çifti ya (x+y, y) ya da (x, x+y) ile değiştiriliyor. Aday çiftler: ${task.candidates.map(pairLabel).join(', ')}.`,
    prompt: 'Bu işlemlerle elde edilemeyecek çift hangisidir?',
    formatOption: String
  })
});

function boardColorCounts(size, removed) {
  const counts = [0, 0];
  const removedSet = new Set(removed.map(([r, c]) => `${r}:${c}`));
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (!removedSet.has(`${row}:${col}`)) counts[(row + col) % 2] += 1;
    }
  }
  return counts;
}

function canTileWithDominoes(size, removed) {
  const removedSet = new Set(removed.map(([r, c]) => `${r}:${c}`));
  const cells = [];
  const indexByCell = new Map();
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const key = `${row}:${col}`;
      if (removedSet.has(key)) continue;
      indexByCell.set(key, cells.length);
      cells.push([row, col]);
    }
  }
  if (cells.length % 2 === 1) return false;
  const fullMask = (1 << cells.length) - 1;
  const memo = new Map();
  const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  function dfs(mask) {
    if (mask === fullMask) return true;
    if (memo.has(mask)) return memo.get(mask);
    let first = 0;
    while ((mask & (1 << first)) !== 0) first += 1;
    const [row, col] = cells[first];
    for (const [dr, dc] of directions) {
      const neighbor = indexByCell.get(`${row + dr}:${col + dc}`);
      if (neighbor === undefined || (mask & (1 << neighbor)) !== 0) continue;
      if (dfs(mask | (1 << first) | (1 << neighbor))) {
        memo.set(mask, true);
        return true;
      }
    }
    memo.set(mask, false);
    return false;
  }

  return dfs(0);
}

const TILING_TEXT = Object.freeze({
  'cannot-tile-color-imbalance': 'Döşenemez; kalan siyah ve beyaz kare sayıları eşit değildir.',
  'tile-with-seven': 'Döşenebilir; boş kalan 14 kare için 7 domino yeterlidir.',
  'tile-with-eight': 'Döşenebilir; 4×4 tahta için 8 domino kullanılır.',
  'tile-with-six': 'Döşenebilir; çıkarılan iki köşe bir domino eksiltir ve 6 domino yeterlidir.'
});

export const parityColoringDominoModel = defineItemModel({
  id: 'math-parity-coloring-domino-v2',
  domain: 'mathematics',
  construct: {
    id: 'construct-parity-coloring',
    gradeRange: [6, 12],
    subjectId: 'mathematics',
    curriculumOutcomeIds: ['use-coloring-invariant-for-tiling'],
    knowledgeComponents: ['checkerboard-coloring', 'parity', 'domino-tiling'],
    claim: 'Öğrenci domino kaplamasında her parçanın iki farklı renkten birer kare örtmesini kullanır.'
  },
  deepFeatures: ['bipartite-color-balance', 'exact-cover-impossibility'],
  surfaceFeatures: ['square-board', 'removed-corners', 'dominoes'],
  compatibleGameIds: ['olympiad-ladder', 'logic-station'],
  solutionGraph: { steps: [
    {
      id: 's1',
      action: 'tahtayı satranç düzeninde iki renge boya',
      dependsOn: [],
      evidence: 'Yatay veya dikey her domino komşu iki kareyi örttüğü için bir siyah ve bir beyaz kare kaplar.',
      hint: 'Komşu kareleri iki renkle dönüşümlü boya; bir domino hangi renklerden kaç kare örter?'
    },
    {
      id: 's2',
      action: 'çıkarılan karelerin renklerini karşılaştır',
      dependsOn: ['s1'],
      evidence: 'Karşılıklı iki köşe aynı renktedir; bu nedenle kalan tahtada renk sayıları 6 ve 8 olur.',
      hint: 'Karşılıklı köşeler aynı renkte mi, farklı renkte mi?'
    },
    {
      id: 's3',
      action: 'renk dengesizliğinden kaplamanın olanaksızlığını çıkar',
      dependsOn: ['s2'],
      evidence: 'Yedi domino her renkten tam 7 kare örtmek zorundadır; 6–8 dağılımı buna izin vermez.',
      hint: 'Tüm dominolar yerleşse her renkten toplam kaç kare örtülmüş olurdu?'
    }
  ]},
  misconceptions: [
    {
      id: 'area-even-is-sufficient',
      description: 'Kalan alanın çift olmasını döşeme için yeterli sanır.',
      buggyRule: 'remaining-area-divided-by-two',
      feedback: 'Alanın çift olması gereklidir ama yeterli değildir; renk dengesi de sağlanmalıdır.',
      apply: () => 'tile-with-seven'
    },
    {
      id: 'ignore-removed-corners',
      description: 'Eksik köşeleri hesaba katmadan tam tahtanın domino sayısını kullanır.',
      buggyRule: 'full-board-domino-count',
      feedback: 'İki kare çıkarıldığı için tam tahtanın 8 dominoluk hesabı geçerli değildir.',
      apply: () => 'tile-with-eight'
    },
    {
      id: 'treat-holes-as-one-domino',
      description: 'Uzak iki köşeyi sanki tek bir domino kaplıyormuş gibi iki domino birden azaltır.',
      buggyRule: 'subtract-two-dominoes-for-two-holes',
      feedback: 'İki eksik kare alan hesabında yalnız bir domino kadar yer azaltır; ayrıca köşeler komşu değildir.',
      apply: () => 'tile-with-six'
    }
  ],
  generateTask: ({ size = 4, removed = [[0, 0], [3, 3]] } = {}) => ({
    size: Number(size),
    removed: removed.map(([row, col]) => [Number(row), Number(col)])
  }),
  solve: (task) => {
    const [colorA, colorB] = boardColorCounts(task.size, task.removed);
    return colorA === colorB ? 'tile-with-seven' : 'cannot-tile-color-imbalance';
  },
  verify: (task, value) => {
    const tileable = canTileWithDominoes(task.size, task.removed);
    const expected = tileable ? 'tile-with-seven' : 'cannot-tile-color-imbalance';
    return String(value) === expected;
  },
  render: (task) => ({
    context: `${task.size}×${task.size} kareli bir tahtanın sol üst ve sağ alt köşeleri çıkarılıyor. Kalan kareler, her biri komşu iki kareyi örten 1×2 dominolarla kaplanmak isteniyor.`,
    prompt: 'Aşağıdaki sonuçlardan hangisi doğrudur?',
    formatOption: value => TILING_TEXT[value] || String(value)
  })
});

function popcount(value) {
  let x = value;
  let count = 0;
  while (x !== 0) {
    x &= x - 1;
    count += 1;
  }
  return count;
}

function exactMinimumMaximumDegree(vertexCount, edgeCount) {
  const edges = [];
  for (let a = 0; a < vertexCount; a += 1) {
    for (let b = a + 1; b < vertexCount; b += 1) edges.push([a, b]);
  }
  if (edges.length > 30) throw new Error('exact graph verifier supports at most 30 possible edges');
  let best = vertexCount;
  const totalMasks = 2 ** edges.length;
  for (let mask = 0; mask < totalMasks; mask += 1) {
    if (popcount(mask) !== edgeCount) continue;
    const degrees = Array(vertexCount).fill(0);
    for (let bit = 0; bit < edges.length; bit += 1) {
      if ((mask & (2 ** bit)) === 0) continue;
      const [a, b] = edges[bit];
      degrees[a] += 1;
      degrees[b] += 1;
    }
    best = Math.min(best, Math.max(...degrees));
  }
  return best;
}

export const extremalGraphDegreeModel = defineItemModel({
  id: 'math-extremal-graph-degree-v2',
  domain: 'mathematics',
  construct: {
    id: 'construct-extremal-maximum-degree',
    gradeRange: [8, 12],
    subjectId: 'mathematics',
    curriculumOutcomeIds: ['apply-extremal-average-degree-bound'],
    knowledgeComponents: ['handshaking-lemma', 'average-degree', 'extremal-construction'],
    claim: 'Öğrenci kenar sayısından zorunlu derece alt sınırı çıkarır ve sınırın erişilebilir olduğunu bir örnekle denetler.'
  },
  deepFeatures: ['extremal-lower-bound', 'tight-construction'],
  surfaceFeatures: ['simple-graph', 'vertex-count', 'edge-count'],
  compatibleGameIds: ['olympiad-ladder', 'problem-hunter'],
  solutionGraph: { steps: [
    {
      id: 's1',
      action: 'derece toplamını kenar sayısından hesapla',
      dependsOn: [],
      evidence: 'Her kenar iki uca değdiği için derece toplamı 2·7=14’tür.',
      hint: 'Bir kenar toplam dereceye kaç katkı yapar?'
    },
    {
      id: 's2',
      action: 'en büyük derece için zorunlu alt sınır kur',
      dependsOn: ['s1'],
      evidence: 'Altı derecenin ortalaması 14/6 olduğundan en az bir köşenin derecesi en az ⌈14/6⌉=3 olmalıdır.',
      hint: 'Bütün dereceler 2 veya daha küçük olsaydı toplam derece en fazla kaç olurdu?'
    },
    {
      id: 's3',
      action: 'alt sınırı sağlayan bir grafik kur',
      dependsOn: ['s2'],
      evidence: 'Altı köşeli bir çevrime karşılıklı iki köşeyi bir kenarla bağlamak 7 kenarlı ve en büyük derecesi 3 olan bir grafik verir.',
      hint: 'Önce 6 köşeli bir çevrim çiz; yedinci kenarı hangi iki köşe arasına ekleyebilirsin?'
    }
  ]},
  misconceptions: [
    {
      id: 'round-average-down',
      description: 'Ortalama dereceyi aşağı yuvarlayıp en büyük dereceyi 2 kabul eder.',
      buggyRule: 'floor-two-m-over-n',
      feedback: 'Ortalama 2’den büyükse bütün dereceler en fazla 2 olamaz; en az bir derece 3’e çıkmalıdır.',
      apply: task => Math.floor((2 * task.edgeCount) / task.vertexCount)
    },
    {
      id: 'count-each-edge-once',
      description: 'Her kenarın iki uçtaki dereceye katkısını unutup m/n kullanır.',
      buggyRule: 'floor-m-over-n',
      feedback: 'Derece toplamında her kenar iki kez sayılır; toplam 7 değil 14’tür.',
      apply: task => Math.floor(task.edgeCount / task.vertexCount)
    },
    {
      id: 'add-unneeded-safety-margin',
      description: 'Alt sınırın erişilebilirliğini kontrol etmeden bir fazlasını zorunlu sanır.',
      buggyRule: 'ceil-average-plus-one',
      feedback: 'En büyük derecesi 3 olan somut bir 7 kenarlı grafik kurulabildiği için 4 zorunlu değildir.',
      apply: task => Math.ceil((2 * task.edgeCount) / task.vertexCount) + 1
    }
  ],
  generateTask: () => ({ vertexCount: 6, edgeCount: 7 }),
  solve: task => Math.ceil((2 * task.edgeCount) / task.vertexCount),
  verify: (task, value) => Number(value) === exactMinimumMaximumDegree(task.vertexCount, task.edgeCount),
  render: task => ({
    context: `${task.vertexCount} köşeli basit bir grafikte tam ${task.edgeCount} kenar vardır.`,
    prompt: 'Grafiğin en büyük köşe derecesi mümkün olan en küçük kaç olabilir?',
    formatOption: String
  })
});

export const PHASE2B_MATH_MODELS = Object.freeze([
  invariantEuclidModel,
  parityColoringDominoModel,
  extremalGraphDegreeModel
]);
