import { defineItemModel } from './contracts.js';

function modularWinningMove(pileSize, maxTake) {
  const remainder = pileSize % (maxTake + 1);
  return remainder === 0 ? 0 : remainder;
}

function minimaxWinningMoves(pileSize, maxTake) {
  const winning = Array(pileSize + 1).fill(false);
  winning[0] = false;
  for (let stones = 1; stones <= pileSize; stones += 1) {
    winning[stones] = false;
    for (let take = 1; take <= maxTake && take <= stones; take += 1) {
      if (!winning[stones - take]) {
        winning[stones] = true;
        break;
      }
    }
  }
  const moves = [];
  for (let take = 1; take <= maxTake && take <= pileSize; take += 1) {
    if (!winning[pileSize - take]) moves.push(take);
  }
  return moves;
}

function formatTake(value) {
  const take = Number(value);
  return take === 0 ? 'Kazanmayı garanti eden ilk hamle yoktur.' : `${take} taş almak`;
}

export const takeAwayGameStrategyModel = defineItemModel({
  id: 'math-game-strategy-take-away-v2',
  domain: 'mathematics',
  construct: {
    id: 'construct-winning-strategy-complement',
    gradeRange: [6, 12],
    subjectId: 'mathematics',
    curriculumOutcomeIds: ['derive-winning-strategy-for-impartial-game'],
    knowledgeComponents: ['winning-losing-positions', 'modular-strategy', 'strategy-invariant'],
    claim: 'Öğrenci alma oyununda kaybeden konumları belirleyip rakibin hamlesini sabit toplama tamamlayan stratejiyi kurar.'
  },
  deepFeatures: ['backward-winning-state-analysis', 'complement-to-modulus-strategy'],
  surfaceFeatures: ['stone-pile', 'bounded-take', 'last-move-wins'],
  compatibleGameIds: ['olympiad-ladder', 'logic-station'],
  solutionGraph: { steps: [
    {
      id: 's1',
      action: 'küçük yığınlardan kaybeden konumları geri çalış',
      dependsOn: [],
      evidence: '1, 2 ve 3 taş kazanma konumudur; 4 taşta yapılan her hamle rakibe kazanma konumu bırakır, dolayısıyla 4 kaybedendir.',
      hint: '1, 2, 3 ve 4 taş kaldığında sıradaki oyuncunun durumunu tek tek incele.'
    },
    {
      id: 's2',
      action: 'kaybeden konumların modüler örüntüsünü belirle',
      dependsOn: ['s1'],
      evidence: 'Kaybeden konumlar 4’ün katlarıdır; rakip 1, 2 veya 3 aldığında sırasıyla 3, 2 veya 1 alınarak iki hamlenin toplamı 4 yapılabilir.',
      hint: 'Rakibin aldığı sayı ile senin alacağın sayının toplamını sabit tutabilir misin?'
    },
    {
      id: 's3',
      action: 'ilk hamlede rakibe kaybeden konum bırak',
      dependsOn: ['s2'],
      evidence: '21 taştan 1 taş alınırsa 20=5·4 kalır; bundan sonra her rakip hamlesi 4’e tamamlanarak son taş alınır.',
      hint: '21’den kaç taş çıkarırsan geriye 4’ün katı kalır?'
    }
  ]},
  misconceptions: [
    {
      id: 'always-take-maximum',
      description: 'Her tur en çok taşı almanın otomatik olarak en iyi strateji olduğunu sanır.',
      buggyRule: 'take-max-on-first-move',
      feedback: 'İlk hamlede 3 almak 18 bırakır; rakip 2 alarak 16 gibi kaybeden bir konumu sana bırakabilir.',
      apply: task => task.maxTake
    },
    {
      id: 'make-pile-odd-even',
      description: 'Kazanma durumunu 4’ün katları yerine yalnız tek-çift paritesiyle sınıflandırır.',
      buggyRule: 'take-two-to-leave-odd',
      feedback: 'Tek-çift bilgisi yeterli değildir; belirleyici yapı 4’e göre kalandır.',
      apply: () => 2
    },
    {
      id: 'misclassify-current-as-multiple',
      description: '21’i 4’ün katı gibi değerlendirip kazanma garantisi olmadığını düşünür.',
      buggyRule: 'declare-no-winning-first-move',
      feedback: '21 sayısının 4 ile bölümünden kalan 1’dir; 1 taş almak 20 bırakarak kazanma stratejisini başlatır.',
      apply: () => 0
    }
  ],
  generateTask: ({ pileSize = 21, maxTake = 3 } = {}) => ({
    pileSize: Number(pileSize),
    maxTake: Number(maxTake)
  }),
  solve: task => modularWinningMove(task.pileSize, task.maxTake),
  verify: (task, value) => {
    const winningMoves = minimaxWinningMoves(task.pileSize, task.maxTake);
    const expected = winningMoves.length === 0 ? 0 : winningMoves[0];
    return winningMoves.length <= 1 && Number(value) === expected;
  },
  render: task => ({
    context: `Bir yığında ${task.pileSize} taş vardır. İki oyuncu sırayla 1, 2 veya ${task.maxTake} taş alıyor. Son taşı alan oyuncu kazanıyor ve iki oyuncu da kusursuz oynuyor.`,
    prompt: 'Birinci oyuncu kazanmayı garanti etmek için ilk hamlede ne yapmalıdır?',
    formatOption: formatTake
  })
});

function weightedAmGmMaximum(total) {
  const equalTerm = total / 4;
  const a = 2 * equalTerm;
  const b = equalTerm;
  const c = equalTerm;
  return (a ** 2) * b * c;
}

function numericalMaximum(total) {
  const objectiveForA = a => {
    const remaining = total - a;
    if (remaining <= 0) return 0;
    let left = 0;
    let right = remaining;
    for (let iteration = 0; iteration < 140; iteration += 1) {
      const third = (right - left) / 3;
      const b1 = left + third;
      const b2 = right - third;
      const value1 = (a ** 2) * b1 * (remaining - b1);
      const value2 = (a ** 2) * b2 * (remaining - b2);
      if (value1 >= value2) right = b2;
      else left = b1;
    }
    const b = (left + right) / 2;
    return (a ** 2) * b * (remaining - b);
  };

  let left = 0;
  let right = total;
  for (let iteration = 0; iteration < 160; iteration += 1) {
    const third = (right - left) / 3;
    const a1 = left + third;
    const a2 = right - third;
    if (objectiveForA(a1) >= objectiveForA(a2)) right = a2;
    else left = a1;
  }
  return objectiveForA((left + right) / 2);
}

function formatProduct(value) {
  const number = Number(value);
  if (Number.isInteger(number)) return String(number);
  return number.toFixed(2).replace('.', ',');
}

export const inequalityBoundingWeightedProductModel = defineItemModel({
  id: 'math-inequality-weighted-product-v2',
  domain: 'mathematics',
  construct: {
    id: 'construct-weighted-am-gm-bound',
    gradeRange: [8, 12],
    subjectId: 'mathematics',
    curriculumOutcomeIds: ['optimize-weighted-product-under-sum'],
    knowledgeComponents: ['am-gm-inequality', 'equality-condition', 'weighted-allocation'],
    claim: 'Öğrenci sabit toplam altında üsleri dikkate alarak çarpımı üstten sınırlar ve eşitlik durumunu kurar.'
  },
  deepFeatures: ['weighted-am-gm', 'sharp-upper-bound'],
  surfaceFeatures: ['positive-real-variables', 'fixed-sum', 'weighted-product'],
  compatibleGameIds: ['olympiad-ladder', 'problem-hunter'],
  solutionGraph: { steps: [
    {
      id: 's1',
      action: 'üsleri eşitsizlikte ayrı çarpanlar olarak temsil et',
      dependsOn: [],
      evidence: 'a²bc=4·(a/2)·(a/2)·b·c biçiminde yazılır ve dört pozitif terimin toplamı a+b+c=20’dir.',
      hint: 'a² çarpanını, toplamı değiştirmeden iki eş terimle nasıl temsil edebilirsin?'
    },
    {
      id: 's2',
      action: 'aritmetik-geometrik ortalama ile keskin üst sınır kur',
      dependsOn: ['s1'],
      evidence: '(a/2)(a/2)bc≤((a/2+a/2+b+c)/4)^4=5^4=625 olduğundan a²bc≤4·625=2500’dür.',
      hint: 'Toplamı 20 olan dört pozitif terimin çarpımı en fazla ne zaman olur?'
    },
    {
      id: 's3',
      action: 'eşitlik koşulunun verilen toplamla sağlandığını göster',
      dependsOn: ['s2'],
      evidence: 'a/2=b=c=5 seçilirse a=10, b=5, c=5 olur; toplam 20 ve çarpım 10²·5·5=2500’dür.',
      hint: 'AM-GM’de eşitlik için dört terimi eşitle ve a, b, c değerlerini geri bul.'
    }
  ]},
  misconceptions: [
    {
      id: 'force-all-original-variables-equal',
      description: 'Üsleri dikkate almadan a=b=c kabul eder.',
      buggyRule: 'set-a-b-c-to-total-over-three',
      feedback: 'a değişkeni çarpımda iki kez yer aldığı için optimum payı b ve c’den daha büyük olmalıdır.',
      apply: task => (task.total / 3) ** 4
    },
    {
      id: 'drop-squared-factor',
      description: 'a²bc yerine abc çarpımını optimize edip o değeri cevap olarak verir.',
      buggyRule: 'maximize-abc-only',
      feedback: 'Amaç fonksiyonunda a iki kez çarpandır; a² etkisi kaldırıldığında farklı bir problem çözülmüş olur.',
      apply: task => (task.total / 3) ** 3
    },
    {
      id: 'allocate-three-shares-to-squared-variable',
      description: 'Kareli değişkene dört payın üçü verilmelidir diye yanlış oran kurar.',
      buggyRule: 'use-ratio-3-1-1',
      feedback: 'a² iki pay, b ve c birer pay taşır; doğru oran a:b:c=2:1:1’dir.',
      apply: task => {
        const unit = task.total / 5;
        const a = 3 * unit;
        const b = unit;
        const c = unit;
        return (a ** 2) * b * c;
      }
    }
  ],
  generateTask: ({ total = 20 } = {}) => ({ total: Number(total) }),
  solve: task => weightedAmGmMaximum(task.total),
  verify: (task, value) => Math.abs(Number(value) - numericalMaximum(task.total)) < 1e-6,
  render: task => ({
    context: `a, b ve c pozitif gerçek sayılar ve a+b+c=${task.total} koşulunu sağlıyor.`,
    prompt: 'a²bc ifadesinin alabileceği en büyük değer kaçtır?',
    formatOption: formatProduct
  })
});

export const PHASE2D_MATH_MODELS = Object.freeze([
  takeAwayGameStrategyModel,
  inequalityBoundingWeightedProductModel
]);
