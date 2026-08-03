import { pick, seededRandom, shuffle } from '../utils.js';

function gcd(a, b) {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) [x, y] = [y, x % y];
  return x || 1n;
}

export class Fraction {
  constructor(numerator, denominator = 1n) {
    let n = BigInt(numerator);
    let d = BigInt(denominator);
    if (d === 0n) throw new Error('Sıfıra bölme yapılamaz.');
    if (d < 0n) {
      n = -n;
      d = -d;
    }
    const divisor = gcd(n, d);
    this.n = n / divisor;
    this.d = d / divisor;
  }

  add(other) { return new Fraction(this.n * other.d + other.n * this.d, this.d * other.d); }
  subtract(other) { return new Fraction(this.n * other.d - other.n * this.d, this.d * other.d); }
  multiply(other) { return new Fraction(this.n * other.n, this.d * other.d); }
  divide(other) {
    if (other.n === 0n) throw new Error('Sıfıra bölme yapılamaz.');
    return new Fraction(this.n * other.d, this.d * other.n);
  }
  equals(other) { return this.n === other.n && this.d === other.d; }
  toNumber() { return Number(this.n) / Number(this.d); }
  toString() { return this.d === 1n ? String(this.n) : `${this.n}/${this.d}`; }
}

const PRECEDENCE = { '+': 1, '-': 1, '*': 2, '/': 2 };

export function tokenizeExpression(expression) {
  const cleaned = String(expression)
    .replaceAll('×', '*')
    .replaceAll('x', '*')
    .replaceAll('X', '*')
    .replaceAll('·', '*')
    .replaceAll('÷', '/')
    .replaceAll(':', '/')
    .replaceAll(',', '.')
    .replace(/\s+/g, '');

  if (!cleaned) throw new Error('Bir işlem yazmalısın.');
  if (/[^0-9+\-*/().]/.test(cleaned)) throw new Error('Yalnızca sayılar, parantez ve dört işlem işaretlerini kullanabilirsin.');

  const tokens = [];
  let index = 0;
  while (index < cleaned.length) {
    const char = cleaned[index];
    if (/\d/.test(char)) {
      let number = char;
      index += 1;
      while (index < cleaned.length && /[\d.]/.test(cleaned[index])) {
        number += cleaned[index];
        index += 1;
      }
      if ((number.match(/\./g) || []).length > 1) throw new Error('Geçersiz sayı yazımı.');
      tokens.push({ type: 'number', value: number });
      continue;
    }
    if ('+-*/()'.includes(char)) {
      const previous = tokens.at(-1);
      const unaryMinus = char === '-' && (!previous || previous.type === 'operator' || previous?.value === '(');
      if (unaryMinus && /\d/.test(cleaned[index + 1] || '')) {
        let number = '-';
        index += 1;
        while (index < cleaned.length && /[\d.]/.test(cleaned[index])) {
          number += cleaned[index];
          index += 1;
        }
        tokens.push({ type: 'number', value: number });
        continue;
      }
      tokens.push({ type: char === '(' || char === ')' ? 'paren' : 'operator', value: char });
      index += 1;
      continue;
    }
  }
  return tokens;
}

function decimalToFraction(value) {
  if (!value.includes('.')) return new Fraction(BigInt(value));
  const negative = value.startsWith('-');
  const clean = negative ? value.slice(1) : value;
  const [whole, decimals] = clean.split('.');
  const denominator = 10n ** BigInt(decimals.length);
  const numerator = BigInt(whole || '0') * denominator + BigInt(decimals || '0');
  return new Fraction(negative ? -numerator : numerator, denominator);
}

export function evaluateExpression(expression) {
  const tokens = tokenizeExpression(expression);
  const output = [];
  const operators = [];

  for (const token of tokens) {
    if (token.type === 'number') output.push(token);
    if (token.type === 'operator') {
      while (
        operators.length &&
        operators.at(-1).type === 'operator' &&
        PRECEDENCE[operators.at(-1).value] >= PRECEDENCE[token.value]
      ) {
        output.push(operators.pop());
      }
      operators.push(token);
    }
    if (token.value === '(') operators.push(token);
    if (token.value === ')') {
      while (operators.length && operators.at(-1).value !== '(') output.push(operators.pop());
      if (!operators.length) throw new Error('Parantezler eşleşmiyor.');
      operators.pop();
    }
  }

  while (operators.length) {
    const token = operators.pop();
    if (token.value === '(' || token.value === ')') throw new Error('Parantezler eşleşmiyor.');
    output.push(token);
  }

  const stack = [];
  for (const token of output) {
    if (token.type === 'number') stack.push(decimalToFraction(token.value));
    else {
      const right = stack.pop();
      const left = stack.pop();
      if (!left || !right) throw new Error('İşlem dizilimi geçersiz.');
      if (token.value === '+') stack.push(left.add(right));
      if (token.value === '-') stack.push(left.subtract(right));
      if (token.value === '*') stack.push(left.multiply(right));
      if (token.value === '/') stack.push(left.divide(right));
    }
  }

  if (stack.length !== 1) throw new Error('İşlem tamamlanamadı.');
  return stack[0];
}

export function numbersUsed(expression) {
  return tokenizeExpression(expression)
    .filter((token) => token.type === 'number')
    .map((token) => Number(token.value));
}

export function validateTargetExpression(expression, availableNumbers, target) {
  try {
    const used = numbersUsed(expression).sort((a, b) => a - b);
    const available = [...availableNumbers].sort((a, b) => a - b);
    if (used.length !== available.length || used.some((value, index) => value !== available[index])) {
      return { valid: false, reason: 'Verilen sayıların her birini yalnızca bir kez kullanmalısın.' };
    }
    const result = evaluateExpression(expression);
    const expected = new Fraction(BigInt(target));
    if (!result.equals(expected)) return { valid: false, reason: `İşlemin sonucu ${result.toString()}, hedef ise ${target}.` };
    return { valid: true, result: result.toString() };
  } catch (error) {
    return { valid: false, reason: error instanceof Error ? error.message : 'İşlem kontrol edilemedi.' };
  }
}

function randomInt(random, min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

const TARGET_NUMBER_FAMILY = 'target-number-expression';

export function createTargetRound(age, seed) {
  const random = seededRandom(seed);
  const modes = age <= 10 ? ['group', 'mixed', 'difference', 'double'] : ['products', 'bracket', 'priority', 'difference'];
  const mode = pick(modes, random);
  const identity = { familyId: TARGET_NUMBER_FAMILY, skeletonId: `${TARGET_NUMBER_FAMILY}:${mode}` };

  if (mode === 'group') {
    const a = randomInt(random, 2, 8), b = randomInt(random, 2, 8), c = randomInt(random, 2, 5), d = randomInt(random, 1, 5);
    return { ...identity, numbers: [a, b, c, d], target: (a + b) * c - d, solution: `(${a} + ${b}) × ${c} - ${d}` };
  }
  if (mode === 'mixed') {
    const a = randomInt(random, 2, 9), b = randomInt(random, 2, 7), c = randomInt(random, 1, 9), d = randomInt(random, 1, 6);
    return { ...identity, numbers: [a, b, c, d], target: a * b + c - d, solution: `${a} × ${b} + ${c} - ${d}` };
  }
  if (mode === 'double') {
    const a = randomInt(random, 3, 9), b = randomInt(random, 2, 6), c = randomInt(random, 2, 5), d = randomInt(random, 1, 4);
    return { ...identity, numbers: [a, b, c, d], target: a * b - c * d, solution: `${a} × ${b} - ${c} × ${d}` };
  }
  if (mode === 'products') {
    const a = randomInt(random, 3, 12), b = randomInt(random, 2, 9), c = randomInt(random, 2, 8), d = randomInt(random, 2, 9);
    return { ...identity, numbers: [a, b, c, d], target: a * b + c * d, solution: `${a} × ${b} + ${c} × ${d}` };
  }
  if (mode === 'bracket') {
    const a = randomInt(random, 3, 10), b = randomInt(random, 2, 8), d = randomInt(random, 2, 5), c = randomInt(random, d + 1, d + 7);
    return { ...identity, numbers: [a, b, c, d], target: (a + b) * (c - d), solution: `(${a} + ${b}) × (${c} - ${d})` };
  }
  if (mode === 'priority') {
    const a = randomInt(random, 3, 12), b = randomInt(random, 2, 8), c = randomInt(random, 2, 9), d = randomInt(random, 1, 8);
    return { ...identity, numbers: [a, b, c, d], target: a + b * c - d, solution: `${a} + ${b} × ${c} - ${d}` };
  }

  const b = randomInt(random, 2, 7), a = randomInt(random, b + 1, b + 8), c = randomInt(random, 2, 6), d = randomInt(random, 1, 7);
  return { ...identity, numbers: [a, b, c, d], target: (a - b) * c + d, solution: `(${a} - ${b}) × ${c} + ${d}` };
}

function makeNumericOptions(answer, random, offsets = [-12, -7, -4, -2, -1, 1, 2, 4, 7, 12]) {
  const values = new Set([answer]);
  while (values.size < 4) {
    const candidate = answer + pick(offsets, random);
    if (candidate >= 0) values.add(candidate);
  }
  return shuffle([...values], random).map(String);
}

const SPEED_MATH_FAMILY = 'speed-math-arithmetic';
const SPEED_MATH_SKELETON_NAMES = { '+': 'addition', '-': 'subtraction', '×': 'multiplication', '÷': 'division', priority: 'operator-priority' };

export function createArithmeticRound(age, seed) {
  const random = seededRandom(seed);
  const max = age <= 10 ? 30 : 90;
  const a = randomInt(random, 3, max);
  const b = randomInt(random, 2, max);
  const mode = pick(age <= 10 ? ['+', '-', '×'] : ['+', '-', '×', '÷', 'priority'], random);
  let prompt;
  let answer;
  if (mode === '+') { prompt = `${a} + ${b}`; answer = a + b; }
  if (mode === '-') { const high = Math.max(a, b); const low = Math.min(a, b); prompt = `${high} - ${low}`; answer = high - low; }
  if (mode === '×') { const x = randomInt(random, 2, age <= 10 ? 9 : 15); const y = randomInt(random, 2, age <= 10 ? 12 : 20); prompt = `${x} × ${y}`; answer = x * y; }
  if (mode === '÷') { const divisor = randomInt(random, 2, 12); const result = randomInt(random, 2, 15); prompt = `${divisor * result} ÷ ${divisor}`; answer = result; }
  if (mode === 'priority') { const x = randomInt(random, 2, 12), y = randomInt(random, 2, 9), z = randomInt(random, 2, 8); prompt = `${x} + ${y} × ${z}`; answer = x + y * z; }
  return {
    prompt, answer, options: makeNumericOptions(answer, random),
    familyId: SPEED_MATH_FAMILY, skeletonId: `${SPEED_MATH_FAMILY}:${SPEED_MATH_SKELETON_NAMES[mode]}`
  };
}

const PATTERN_LAB_FAMILY = 'pattern-lab-sequences';

export function createPatternRound(age, seed) {
  const random = seededRandom(seed);
  const modes = age <= 10 ? ['linear', 'alternating', 'growing'] : ['linear', 'alternating', 'quadratic', 'fibonacci', 'differences'];
  const mode = pick(modes, random);
  const identity = { familyId: PATTERN_LAB_FAMILY, skeletonId: `${PATTERN_LAB_FAMILY}:${mode}` };
  let sequence;
  let answer;
  let rule;

  if (mode === 'linear') {
    const start = randomInt(random, 2, 15);
    const step = randomInt(random, 2, age <= 10 ? 8 : 13);
    sequence = Array.from({ length: 5 }, (_, index) => start + index * step);
    answer = start + 5 * step;
    rule = `Her adımda ${step} ekleniyor.`;
  }
  if (mode === 'alternating') {
    const start = randomInt(random, 4, 15);
    const add = randomInt(random, 2, 7);
    const multiply = 2;
    sequence = [start];
    for (let index = 0; index < 4; index += 1) sequence.push(index % 2 === 0 ? sequence.at(-1) + add : sequence.at(-1) * multiply);
    answer = sequence.at(-1) + add;
    rule = `Sırayla +${add} ve ×${multiply} uygulanıyor.`;
  }
  if (mode === 'growing') {
    const start = randomInt(random, 1, 8);
    sequence = [start];
    for (let step = 1; step <= 4; step += 1) sequence.push(sequence.at(-1) + step);
    answer = sequence.at(-1) + 5;
    rule = 'Artış miktarı her adımda 1 büyüyor: +1, +2, +3, +4, +5.';
  }
  if (mode === 'quadratic') {
    const offset = randomInt(random, 0, 4);
    sequence = Array.from({ length: 5 }, (_, index) => (index + 1) ** 2 + offset);
    answer = 36 + offset;
    rule = `Sayılar ardışık sayıların karelerine ${offset} eklenerek oluşuyor.`;
  }
  if (mode === 'fibonacci') {
    const x = randomInt(random, 1, 5), y = randomInt(random, 2, 7);
    sequence = [x, y];
    while (sequence.length < 5) sequence.push(sequence.at(-1) + sequence.at(-2));
    answer = sequence.at(-1) + sequence.at(-2);
    rule = 'Her sayı kendinden önceki iki sayının toplamı.';
  }
  if (mode === 'differences') {
    const start = randomInt(random, 2, 10), firstDiff = randomInt(random, 2, 5), diffGrowth = randomInt(random, 1, 3);
    sequence = [start];
    let difference = firstDiff;
    while (sequence.length < 5) { sequence.push(sequence.at(-1) + difference); difference += diffGrowth; }
    answer = sequence.at(-1) + difference;
    rule = `Ardışık farklar her adımda ${diffGrowth} artıyor.`;
  }

  return { ...identity, sequence, answer, rule, options: makeNumericOptions(answer, random, [-10,-6,-3,-2,2,3,6,10]) };
}

const GEOMETRY_LAB_FAMILY = 'geometry-lab-measurement';

export function createGeometryRound(age, seed) {
  const random = seededRandom(seed);
  const modes = age <= 10
    ? ['rectanglePerimeter','rectangleArea','square','triangleArea','missingSide','cubeVolume']
    : ['rectanglePerimeter','rectangleArea','square','triangleArea','missingSide','cubeVolume','prismVolume','trapezoid','composite','angle'];
  const mode = pick(modes, random);
  const identity = { familyId: GEOMETRY_LAB_FAMILY, skeletonId: `${GEOMETRY_LAB_FAMILY}:${mode}` };
  let prompt, context, answer, explanation, visual;

  if (mode === 'rectanglePerimeter') {
    const width = randomInt(random, 3, 14), height = randomInt(random, 2, 10);
    answer = 2 * (width + height);
    prompt = 'Dikdörtgenin çevresi kaç birimdir?'; context = `Uzunluk ${width} birim, genişlik ${height} birimdir.`;
    explanation = `Çevre = 2 × (${width} + ${height}) = ${answer}.`;
    visual = { type: 'rectangle', width, height, task: 'perimeter' };
  }
  if (mode === 'rectangleArea') {
    const width = randomInt(random, 3, 14), height = randomInt(random, 2, 10);
    answer = width * height;
    prompt = 'Dikdörtgenin alanı kaç birimkaredir?'; context = `Kenarları ${width} ve ${height} birimdir.`;
    explanation = `Alan = ${width} × ${height} = ${answer}.`;
    visual = { type: 'rectangle', width, height, task: 'area' };
  }
  if (mode === 'square') {
    const side = randomInt(random, 3, 12), task = pick(['area','perimeter'], random);
    answer = task === 'area' ? side * side : 4 * side;
    prompt = `Karenin ${task === 'area' ? 'alanı' : 'çevresi'} kaç ${task === 'area' ? 'birimkaredir' : 'birimdir'}?`;
    context = `Bir kenarı ${side} birimdir.`;
    explanation = task === 'area' ? `Alan = ${side} × ${side} = ${answer}.` : `Çevre = 4 × ${side} = ${answer}.`;
    visual = { type: 'square', side, task };
  }
  if (mode === 'triangleArea') {
    const base = randomInt(random, 4, 16), height = randomInt(random, 2, 12);
    const adjustedBase = base % 2 === 0 ? base : base + 1;
    answer = adjustedBase * height / 2;
    prompt = 'Üçgenin alanı kaç birimkaredir?'; context = `Taban ${adjustedBase}, bu tabana ait yükseklik ${height} birimdir.`;
    explanation = `Alan = ${adjustedBase} × ${height} ÷ 2 = ${answer}.`;
    visual = { type: 'triangle', base: adjustedBase, height };
  }
  if (mode === 'missingSide') {
    const width = randomInt(random, 4, 13), height = randomInt(random, 3, 10), perimeter = 2 * (width + height);
    answer = height;
    prompt = 'Dikdörtgenin bilinmeyen kısa kenarı kaç birimdir?'; context = `Çevre ${perimeter} birim, uzun kenar ${width} birimdir.`;
    explanation = `${perimeter} ÷ 2 = ${width + height}; ${width + height} - ${width} = ${height}.`;
    visual = { type: 'missingRectangle', width, height, perimeter };
  }
  if (mode === 'cubeVolume') {
    const side = randomInt(random, 2, age <= 10 ? 6 : 9);
    answer = side ** 3;
    prompt = 'Küpün hacmi kaç birimküptür?'; context = `Bir ayrıtı ${side} birimdir.`;
    explanation = `Hacim = ${side} × ${side} × ${side} = ${answer}.`;
    visual = { type: 'cube', side };
  }
  if (mode === 'prismVolume') {
    const width = randomInt(random, 3, 9), depth = randomInt(random, 2, 7), height = randomInt(random, 2, 8);
    answer = width * depth * height;
    prompt = 'Dikdörtgenler prizmasının hacmi kaç birimküptür?'; context = `Boyutları ${width} × ${depth} × ${height} birimdir.`;
    explanation = `Hacim = ${width} × ${depth} × ${height} = ${answer}.`;
    visual = { type: 'prism', width, depth, height };
  }
  if (mode === 'trapezoid') {
    const a = randomInt(random, 5, 11), b = randomInt(random, 12, 20), height = randomInt(random, 3, 9);
    const sum = (a + b) % 2 === 0 ? a + b : a + b + 1;
    const adjustedB = sum - a;
    answer = sum * height / 2;
    prompt = 'Yamuğun alanı kaç birimkaredir?'; context = `Paralel kenarlar ${a} ve ${adjustedB}, yükseklik ${height} birimdir.`;
    explanation = `Alan = (${a} + ${adjustedB}) × ${height} ÷ 2 = ${answer}.`;
    visual = { type: 'trapezoid', a, b: adjustedB, height };
  }
  if (mode === 'composite') {
    const width = randomInt(random, 8, 14), height = randomInt(random, 6, 11), cutW = randomInt(random, 2, width - 3), cutH = randomInt(random, 2, height - 2);
    answer = width * height - cutW * cutH;
    prompt = 'L biçimli boyalı bölgenin alanı kaç birimkaredir?'; context = `${width}×${height} dikdörtgenden ${cutW}×${cutH} dikdörtgen çıkarılmıştır.`;
    explanation = `${width * height} - ${cutW * cutH} = ${answer}.`;
    visual = { type: 'composite', width, height, cutW, cutH };
  }
  if (mode === 'angle') {
    const first = randomInt(random, 35, 80), second = randomInt(random, 40, 85);
    answer = 180 - first - second;
    prompt = 'Üçgenin bilinmeyen açısı kaç derecedir?'; context = `Diğer açılar ${first}° ve ${second}°’dir.`;
    explanation = `Üçgenin açıları toplamı 180°: 180 - ${first} - ${second} = ${answer}°.`;
    visual = { type: 'angles', first, second, answer };
  }

  return { ...identity, prompt, context, answer, explanation, visual, options: makeNumericOptions(answer, random, [-15,-10,-5,-3,3,5,10,15]) };
}

const PROBLEM_HUNTER_FAMILY = 'problem-hunter-word-problem';

export function createProblemRound(age, seed) {
  const random = seededRandom(seed);
  if (age <= 10) {
    const mode = pick(['packs','sharing','time','money','fraction'], random);
    const identity = { familyId: PROBLEM_HUNTER_FAMILY, skeletonId: `${PROBLEM_HUNTER_FAMILY}:${mode}` };
    if (mode === 'packs') {
      const packs = randomInt(random, 3, 9), each = randomInt(random, 4, 12), used = randomInt(random, 3, packs * each - 2), answer = packs * each - used;
      return { ...identity, prompt: `${packs} kutunun her birinde ${each} kalem vardır. ${used} kalem kullanılırsa kaç kalem kalır?`, options: makeNumericOptions(answer, random), answer, explanation: `Önce ${packs} × ${each} = ${packs * each}; sonra ${packs * each} - ${used} = ${answer}.` };
    }
    if (mode === 'sharing') {
      const people = randomInt(random, 3, 8), each = randomInt(random, 3, 10), total = people * each;
      return { ...identity, prompt: `${total} ceviz ${people} çocuğa eşit paylaştırılırsa her çocuk kaç ceviz alır?`, options: makeNumericOptions(each, random), answer: each, explanation: `${total} ÷ ${people} = ${each}.` };
    }
    if (mode === 'time') {
      const start = randomInt(random, 8, 14), duration = randomInt(random, 2, 5), answer = start + duration;
      return { ...identity, prompt: `Saat ${start}.00’te başlayan bir etkinlik ${duration} saat sürüyor. Etkinlik saat kaçta biter?`, options: makeNumericOptions(answer, random), answer, explanation: `${start} + ${duration} = ${answer}.00.` };
    }
    if (mode === 'money') {
      const count = randomInt(random, 2, 6), price = randomInt(random, 5, 20), paid = Math.ceil(count * price / 10) * 10 + 20, answer = paid - count * price;
      return { ...identity, prompt: `Tanesi ${price} TL olan defterlerden ${count} tane alan bir öğrenci ${paid} TL veriyor. Kaç TL para üstü alır?`, options: makeNumericOptions(answer, random), answer, explanation: `Toplam ${count} × ${price} = ${count * price} TL; para üstü ${paid} - ${count * price} = ${answer} TL.` };
    }
    const denominator = pick([2,4,5], random), whole = randomInt(random, 3, 10), total = denominator * whole, numerator = randomInt(random, 1, denominator - 1), answer = total * numerator / denominator;
    return { ...identity, prompt: `${total} bilyenin ${numerator}/${denominator}’ü mavidir. Kaç mavi bilye vardır?`, options: makeNumericOptions(answer, random), answer, explanation: `${total} ÷ ${denominator} × ${numerator} = ${answer}.` };
  }

  const mode = pick(['percent','ratio','speed','average','algebra','discount'], random);
  const identity = { familyId: PROBLEM_HUNTER_FAMILY, skeletonId: `${PROBLEM_HUNTER_FAMILY}:${mode}` };
  if (mode === 'percent') {
    const percent = pick([10,20,25,30,40], random), base = randomInt(random, 4, 20) * 20, answer = base * percent / 100;
    return { ...identity, prompt: `${base} öğrencinin %${percent}’i bir kulübe katılmıştır. Kaç öğrenci katılmıştır?`, options: makeNumericOptions(answer, random), answer, explanation: `${base} × ${percent}/100 = ${answer}.` };
  }
  if (mode === 'ratio') {
    const a = randomInt(random, 2, 5), b = randomInt(random, 3, 7), factor = randomInt(random, 4, 12), total = (a + b) * factor, answer = b * factor;
    return { ...identity, prompt: `Kırmızı ve mavi boncukların oranı ${a}:${b}, toplam boncuk sayısı ${total}’dir. Mavi boncuk sayısı kaçtır?`, options: makeNumericOptions(answer, random), answer, explanation: `Toplam oran ${a + b}; bir pay ${total} ÷ ${a + b} = ${factor}; mavi ${b} × ${factor} = ${answer}.` };
  }
  if (mode === 'speed') {
    const speed = randomInt(random, 40, 90), time = randomInt(random, 2, 5), answer = speed * time;
    return { ...identity, prompt: `Saatte ${speed} km hızla giden araç ${time} saatte kaç kilometre yol alır?`, options: makeNumericOptions(answer, random, [-50,-30,-20,-10,10,20,30,50]), answer, explanation: `Yol = hız × zaman = ${speed} × ${time} = ${answer} km.` };
  }
  if (mode === 'average') {
    const a = randomInt(random, 50, 90), b = randomInt(random, 50, 90), c = randomInt(random, 50, 90), sum = a + b + c, adjustedC = c + ((3 - sum % 3) % 3), answer = (a + b + adjustedC) / 3;
    return { ...identity, prompt: `Üç sınav notu ${a}, ${b} ve ${adjustedC} olan öğrencinin ortalaması kaçtır?`, options: makeNumericOptions(answer, random), answer, explanation: `(${a} + ${b} + ${adjustedC}) ÷ 3 = ${answer}.` };
  }
  if (mode === 'algebra') {
    const x = randomInt(random, 4, 18), multiplier = randomInt(random, 2, 5), add = randomInt(random, 3, 15), result = multiplier * x + add;
    return { ...identity, prompt: `${multiplier}x + ${add} = ${result} olduğuna göre x kaçtır?`, options: makeNumericOptions(x, random), answer: x, explanation: `${result} - ${add} = ${result - add}; ${result - add} ÷ ${multiplier} = ${x}.` };
  }
  const price = randomInt(random, 5, 20) * 50, discount = pick([10,20,25,30], random), answer = price * (100 - discount) / 100;
  return { ...identity, prompt: `${price} TL’lik bir ürüne %${discount} indirim uygulanıyor. İndirimli fiyat kaç TL olur?`, options: makeNumericOptions(answer, random, [-100,-50,-25,25,50,100]), answer, explanation: `İndirim ${price * discount / 100} TL; yeni fiyat ${price} - ${price * discount / 100} = ${answer} TL.` };
}

export function createOlympiadRound(age, seed) {
  const random = seededRandom(seed);
  const youngerModes = ['parity','remainder','counting','digits','squareCount','shapeMove','memoryChunk','balance','magicSum'];
  const olderModes = [...youngerModes, 'pigeonhole','divisibility','invariant','combinations','gridPaths'];
  const mode = pick(age <= 10 ? youngerModes : olderModes, random);

  if (mode === 'parity') {
    const oddCount = randomInt(random, 1, 4) * 2 + 1;
    const evenCount = randomInt(random, 1, 5) * 2;
    return {
      prompt: `${oddCount} tane tek sayı ile ${evenCount} tane çift sayının toplamı tek mi, çift mi olur?`,
      options: ['Tek','Çift','Sıfır','Belirlenemez'], answerValue: 'Tek',
      explanation: 'Tek sayıda tek sayının toplamı tektir; çift sayıların eklenmesi tek-çift durumunu değiştirmez.', timeLimit: 90
    };
  }

  if (mode === 'remainder') {
    const divisor = randomInt(random, 3, 9), quotient = randomInt(random, 4, 18), remainder = randomInt(random, 1, divisor - 1), number = divisor * quotient + remainder;
    return {
      prompt: `${number} sayısı ${divisor} ile bölündüğünde kalan kaçtır?`,
      options: makeNumericOptions(remainder, random, [-3,-2,-1,1,2,3]), answerValue: String(remainder),
      explanation: `${number} = ${divisor} × ${quotient} + ${remainder}; kalan ${remainder}.`, timeLimit: 100
    };
  }

  if (mode === 'counting') {
    const rows = randomInt(random, 3, age <= 10 ? 6 : 9), cols = randomInt(random, 3, age <= 10 ? 6 : 9), missing = randomInt(random, 1, Math.min(4, rows));
    const answer = rows * cols - missing;
    return {
      prompt: `${rows} satır ve ${cols} sütundan oluşan nokta düzeninden ${missing} nokta siliniyor. Kaç nokta kalır?`,
      options: makeNumericOptions(answer, random), answerValue: String(answer),
      explanation: `Başta ${rows} × ${cols} = ${rows * cols} nokta vardır. ${missing} nokta silinince ${answer} kalır.`, timeLimit: 100
    };
  }

  if (mode === 'digits') {
    const a = randomInt(random, 2, 8), b = randomInt(random, 1, 9), number = a * 100 + b * 10 + a;
    const reversed = a * 100 + b * 10 + a;
    const answer = a + b + a;
    return {
      prompt: `${number} sayısının rakamları toplamı ile ters yazılışının rakamları toplamı arasındaki fark kaçtır?`,
      options: ['0', String(answer), String(a + b), String(number)], answerValue: '0',
      explanation: 'Bir sayının rakamları ters çevrilse de kullanılan rakamlar değişmez; rakamlar toplamlarının farkı 0’dır.', timeLimit: 100
    };
  }

  if (mode === 'squareCount') {
    const size = randomInt(random, 2, age <= 10 ? 4 : 5);
    const answer = size * (size + 1) * (2 * size + 1) / 6;
    return {
      prompt: `${size} × ${size} küçük kareden oluşan tabloda, farklı büyüklüklerde toplam kaç kare vardır?`,
      options: makeNumericOptions(answer, random, [-10,-5,-3,-2,2,3,5,10]), answerValue: String(answer),
      explanation: `1×1 kareler ${size * size}; daha büyük kareler de sayılır. Toplam 1²+2²+…+${size}² = ${answer}.`,
      visual: { type: 'squareGrid', size }, timeLimit: age <= 10 ? 150 : 120
    };
  }

  if (mode === 'shapeMove') {
    const shapes = shuffle(['▲','●','■','◆'], random);
    const start = shapes.slice(0, 4);
    const afterFirst = [start[2], start[1], start[0], start[3]];
    const afterSecond = [afterFirst[3], afterFirst[0], afterFirst[1], afterFirst[2]];
    const correct = afterSecond.join(' ');
    const candidateRows = [
      correct,
      start.join(' '),
      [...afterSecond].reverse().join(' '),
      [afterSecond[1], afterSecond[2], afterSecond[3], afterSecond[0]].join(' '),
      [afterSecond[2], afterSecond[3], afterSecond[0], afterSecond[1]].join(' ')
    ];
    const options = shuffle([...new Set(candidateRows)].slice(0, 4), random);
    return {
      context: `Başlangıç: ${start.join(' ')}. Önce 1. ve 3. şekil yer değiştiriyor. Sonra en sağdaki şekil en sola geçiyor.`,
      prompt: 'Son sıralama hangisidir?', options, answerValue: correct,
      explanation: `İlk işlemden sonra ${afterFirst.join(' ')}, ikinci işlemden sonra ${correct} olur.`,
      visual: { type: 'shapeRow', values: start }, timeLimit: 140
    };
  }

  if (mode === 'memoryChunk') {
    const symbols = shuffle(['★','○','▲','■','◆','☀','☂','♫'], random).slice(0, age <= 10 ? 6 : 8);
    const askIndex = randomInt(random, 1, symbols.length - 2);
    const answer = symbols[askIndex];
    const options = shuffle([answer, ...symbols.filter((s) => s !== answer).slice(0, 3)], random);
    return {
      kind: 'memory', memoryItems: symbols, revealSeconds: age <= 10 ? 7 : 5,
      prompt: `${askIndex + 1}. sıradaki sembol hangisiydi?`, options, answerValue: answer,
      explanation: `Diziyi ikili veya üçlü gruplara ayırmak (parçalama/chunking) çalışma belleğini rahatlatır. ${askIndex + 1}. sembol ${answer} idi.`,
      timeLimit: 80
    };
  }

  if (mode === 'balance') {
    const square = randomInt(random, 2, 8), circle = randomInt(random, 2, 8);
    const left = 2 * square + circle;
    const answer = square + 2 * circle;
    return {
      context: `■ = ${square} ve ● = ${circle}. Bir terazinin sol kefesinde ■ + ■ + ● vardır.`,
      prompt: 'Sağ kefeye ■ + ● + ● konulursa sağ kefenin değeri kaç olur?',
      options: makeNumericOptions(answer, random), answerValue: String(answer),
      explanation: `■ + ● + ● = ${square} + ${circle} + ${circle} = ${answer}. Sol kefenin değeri ${left}; iki kefenin eşit olması şartı verilmemiştir.`, timeLimit: 110
    };
  }

  if (mode === 'magicSum') {
    const base = randomInt(random, 1, 7);
    const row = [base, base + 4, base + 2];
    const target = row.reduce((a,b)=>a+b,0);
    const knownA = base + 1, knownB = base + 5, answer = target - knownA - knownB;
    return {
      context: `Bir sayı karesinde her satırın toplamı ${target}. Alt satırda ${knownA}, ${knownB} ve ? bulunuyor.`,
      prompt: '? yerine kaç gelmelidir?', options: makeNumericOptions(answer, random), answerValue: String(answer),
      explanation: `${knownA} + ${knownB} + ? = ${target}; ? = ${target - knownA - knownB}.`, timeLimit: 120
    };
  }

  if (mode === 'pigeonhole') {
    const colors = randomInt(random, 3, 7), copies = randomInt(random, 2, 4);
    const answer = colors * (copies - 1) + 1;
    return {
      prompt: `${colors} farklı renkte çok sayıda bilye vardır. Aynı renkten ${copies} bilyeyi kesinleştirmek için en az kaç bilye çekilmelidir?`,
      options: makeNumericOptions(answer, random), answerValue: String(answer),
      explanation: `Her renkten en fazla ${copies - 1} tane çekip hâlâ ${copies} eş renk elde etmeyebiliriz: ${colors}×${copies - 1}=${colors * (copies - 1)}. Bir sonraki çekiliş kesinleştirir.`, timeLimit: 160
    };
  }

  if (mode === 'divisibility') {
    const factorA = pick([3,4,6,9], random), multiple = randomInt(random, 4, 20), number = factorA * multiple;
    return {
      prompt: `${number} sayısı aşağıdakilerden hangisine kesinlikle tam bölünür?`,
      options: shuffle([factorA, factorA + 1, factorA + 2, factorA + 4], random).map(String), answerValue: String(factorA),
      explanation: `${number} = ${factorA} × ${multiple} olduğu için ${factorA} sayısına tam bölünür.`, timeLimit: 110
    };
  }

  if (mode === 'invariant') {
    const moves = randomInt(random, 3, 8);
    return {
      context: `Bir tahtada başlangıçta 10 siyah taş vardır. Her hamlede iki taşın rengi birlikte değiştiriliyor. Bu işlem ${moves} kez yapılıyor.`,
      prompt: 'Siyah taş sayısının tek-çift durumu için hangisi kesinlikle doğrudur?',
      options: ['Her zaman çift kalır','Her zaman tek kalır','Her hamlede değişir','Belirlenemez'], answerValue: 'Her zaman çift kalır',
      explanation: 'Bir hamlede siyah taş sayısı −2, 0 veya +2 değişir. Değişim daima çift olduğundan başlangıçtaki çiftlik korunur.', timeLimit: 180
    };
  }

  if (mode === 'combinations') {
    const shirts = randomInt(random, 3, 6), trousers = randomInt(random, 2, 5), forbidden = randomInt(random, 1, Math.min(3, shirts));
    const answer = shirts * trousers - forbidden;
    return {
      context: `${shirts} gömlek ve ${trousers} pantolondan birer tane seçiliyor. Belirli ${forbidden} gömlek-pantolon çifti uygun değildir.`,
      prompt: 'Kaç uygun kombinasyon vardır?', options: makeNumericOptions(answer, random), answerValue: String(answer),
      explanation: `Toplam ${shirts}×${trousers}=${shirts * trousers} çift vardır. ${forbidden} uygun olmayan çıkarılır: ${answer}.`, timeLimit: 150
    };
  }

  const rows = randomInt(random, 2, 4), cols = randomInt(random, 2, 4);
  const choose = (n, k) => {
    let result = 1;
    for (let i = 1; i <= k; i += 1) result = result * (n - k + i) / i;
    return Math.round(result);
  };
  const answer = choose(rows + cols, rows);
  return {
    context: `Bir robot yalnız sağa veya yukarı hareket ederek ${cols} birim sağa ve ${rows} birim yukarı gidecektir.`,
    prompt: 'Kaç farklı en kısa yol vardır?', options: makeNumericOptions(answer, random), answerValue: String(answer),
    explanation: `Toplam ${rows + cols} hamlenin ${rows} tanesinin yukarı olacağı yerler seçilir: C(${rows + cols},${rows})=${answer}.`,
    visual: { type: 'pathGrid', rows, cols }, timeLimit: 200
  };
}

const ERROR_DETECTIVE_LEGACY_FAMILY = 'error-detective-legacy-chain';

export function createErrorRound(age, seed) {
  const random = seededRandom(seed);
  const youngerModes = ['addition', 'subtraction', 'priority', 'perimeter', 'multiplication'];
  const olderModes = ['distribution', 'fraction', 'sign', 'percent', 'equation', 'ratio'];
  const mode = pick(age <= 10 ? youngerModes : olderModes, random);
  const identity = { familyId: ERROR_DETECTIVE_LEGACY_FAMILY, skeletonId: `${ERROR_DETECTIVE_LEGACY_FAMILY}:${mode}` };

  if (mode === 'addition') {
    const tensA = randomInt(random, 2, 8);
    const tensB = randomInt(random, 1, 8);
    const onesA = randomInt(random, 5, 9);
    const onesB = randomInt(random, Math.max(2, 10 - onesA), 9);
    const a = tensA * 10 + onesA;
    const b = tensB * 10 + onesB;
    const onesResult = (onesA + onesB) % 10;
    const correctTens = tensA + tensB + 1;
    const wrongTens = correctTens - 1;
    return {
      ...identity,
      prompt: 'İlk hatalı satırı bul.',
      steps: [
        `${a} + ${b} işlemi yapılacak.`,
        `Birler: ${onesA} + ${onesB} = ${onesA + onesB}; ${onesResult} yazılıp 1 elde edilir.`,
        `Onlar: ${tensA} + ${tensB} = ${wrongTens} yazılır.`,
        `Sonuç ${wrongTens * 10 + onesResult} bulunur.`
      ],
      answer: 2,
      explanation: `Elde unutulmuştur. Onlar basamağı ${tensA} + ${tensB} + 1 = ${correctTens} olmalı; doğru sonuç ${a + b}’dir.`
    };
  }

  if (mode === 'subtraction') {
    const tensA = randomInt(random, 4, 9);
    const onesA = randomInt(random, 0, 4);
    const tensB = randomInt(random, 1, tensA - 1);
    const onesB = randomInt(random, onesA + 1, 9);
    const a = tensA * 10 + onesA;
    const b = tensB * 10 + onesB;
    const wrongOnes = onesB - onesA;
    const wrongResult = (tensA - tensB) * 10 + wrongOnes;
    return {
      ...identity,
      prompt: 'İlk hatalı satırı bul.',
      steps: [
        `${a} - ${b} işlemi yapılacak.`,
        `Birler basamağında ${onesB} - ${onesA} = ${wrongOnes} yazılır.`,
        `Onlar basamağında ${tensA} - ${tensB} = ${tensA - tensB} yazılır.`,
        `Sonuç ${wrongResult} bulunur.`
      ],
      answer: 1,
      explanation: `${onesA}, ${onesB}’den küçük olduğu için onluk bozmak gerekir. Doğru sonuç ${a - b}’dir.`
    };
  }

  if (mode === 'priority') {
    const a = randomInt(random, 4, 15);
    const b = randomInt(random, 2, 8);
    const c = randomInt(random, 2, 8);
    const wrongFirst = a + b;
    return {
      ...identity,
      prompt: 'İlk hatalı satırı bul.',
      steps: [
        `${a} + ${b} × ${c} işlemi verildi.`,
        `Önce ${a} + ${b} = ${wrongFirst} yapılır.`,
        `Sonra ${wrongFirst} × ${c} = ${wrongFirst * c} bulunur.`,
        `Sonuç ${wrongFirst * c} yazılır.`
      ],
      answer: 1,
      explanation: `Çarpma önce yapılmalıdır: ${b} × ${c} = ${b * c}; ardından ${a} + ${b * c} = ${a + b * c}.`
    };
  }

  if (mode === 'perimeter') {
    const width = randomInt(random, 3, 12);
    const height = randomInt(random, 2, 10);
    return {
      ...identity,
      prompt: 'İlk hatalı satırı bul.',
      steps: [
        `Kenarları ${width} ve ${height} birim olan dikdörtgenin çevresi aranıyor.`,
        `${width} × ${height} = ${width * height} hesaplanır.`,
        `Çevre ${width * height} birim yazılır.`,
        'İşlem tamamlanır.'
      ],
      answer: 1,
      explanation: `Çarpım alanı verir. Çevre 2 × (${width} + ${height}) = ${2 * (width + height)} birim olmalıdır.`
    };
  }

  if (mode === 'multiplication') {
    const tens = randomInt(random, 2, 8);
    const ones = randomInt(random, 1, 9);
    const multiplier = randomInt(random, 3, 8);
    const number = tens * 10 + ones;
    const onesPart = ones * multiplier;
    const wrongTensPart = tens * multiplier;
    return {
      ...identity,
      prompt: 'İlk hatalı satırı bul.',
      steps: [
        `${number} × ${multiplier} işlemi parçalayarak yapılacak.`,
        `${ones} × ${multiplier} = ${onesPart} hesaplanır.`,
        `${tens} × ${multiplier} = ${wrongTensPart} hesaplanır ve onluk değeri dikkate alınmaz.`,
        `${onesPart} + ${wrongTensPart} = ${onesPart + wrongTensPart} sonucu yazılır.`
      ],
      answer: 2,
      explanation: `${tens}, aslında ${tens * 10} değerini temsil eder. İkinci parça ${tens * 10} × ${multiplier} = ${tens * 10 * multiplier} olmalı; doğru sonuç ${number * multiplier}’dır.`
    };
  }

  if (mode === 'distribution') {
    const coefficient = randomInt(random, 2, 7);
    const add = randomInt(random, 2, 9);
    const x = randomInt(random, 2, 10);
    const result = coefficient * (x + add);
    return {
      ...identity,
      prompt: 'İlk hatalı satırı bul.',
      steps: [
        `${coefficient}(x + ${add}) = ${result}`,
        `${coefficient}x + ${add} = ${result}`,
        `${coefficient}x = ${result - add}`,
        `x = ${(result - add)}/${coefficient}`
      ],
      answer: 1,
      explanation: `${coefficient}, parantez içindeki iki terime de dağılmalıdır: ${coefficient}x + ${coefficient * add} = ${result}; buradan x = ${x}.`
    };
  }

  if (mode === 'fraction') {
    const denominatorA = pick([2, 3, 4, 5, 6], random);
    const factor = randomInt(random, 2, 4);
    const denominatorB = denominatorA * factor;
    const numeratorA = randomInt(random, 1, denominatorA - 1);
    const numeratorB = randomInt(random, 1, denominatorB - 1);
    return {
      ...identity,
      prompt: 'İlk hatalı satırı bul.',
      steps: [
        `${numeratorA}/${denominatorA} + ${numeratorB}/${denominatorB} işlemi yapılacak.`,
        `Paydalar ${denominatorA} + ${denominatorB} = ${denominatorA + denominatorB} olarak toplanır.`,
        `Paylar ${numeratorA} + ${numeratorB} = ${numeratorA + numeratorB} olarak toplanır.`,
        `Sonuç ${numeratorA + numeratorB}/${denominatorA + denominatorB} yazılır.`
      ],
      answer: 1,
      explanation: `Kesir toplarken paydalar doğrudan toplanmaz; ortak payda ${denominatorB} seçilip eşdeğer kesirler oluşturulmalıdır.`
    };
  }

  if (mode === 'sign') {
    const coefficient = randomInt(random, 2, 8);
    const value = randomInt(random, 2, 10);
    return {
      ...identity,
      prompt: 'İlk hatalı satırı bul.',
      steps: [
        `-${coefficient}(x - ${value}) ifadesi açılacak.`,
        `-${coefficient}x - ${coefficient * value} yazılır.`,
        'Benzer terim olmadığı için ifade bu biçimde bırakılır.',
        `Sonuç -${coefficient}x - ${coefficient * value} olur.`
      ],
      answer: 1,
      explanation: `Negatif sayı ile negatif terimin çarpımı pozitiftir: -${coefficient} × (-${value}) = +${coefficient * value}. Doğru açılım -${coefficient}x + ${coefficient * value}’dir.`
    };
  }

  if (mode === 'percent') {
    const price = randomInt(random, 4, 20) * 50;
    const percent = pick([10, 20, 25, 30, 40], random);
    const wrongDiscount = price / percent;
    const correctDiscount = price * percent / 100;
    return {
      ...identity,
      prompt: 'İlk hatalı satırı bul.',
      steps: [
        `${price} TL’ye %${percent} indirim uygulanacak.`,
        `İndirim ${price} ÷ ${percent} = ${wrongDiscount} TL hesaplanır.`,
        `Yeni fiyat ${price} - ${wrongDiscount} = ${price - wrongDiscount} TL bulunur.`,
        `Sonuç ${price - wrongDiscount} TL yazılır.`
      ],
      answer: 1,
      explanation: `%${percent} indirim ${price} × ${percent}/100 = ${correctDiscount} TL’dir; yeni fiyat ${price - correctDiscount} TL olur.`
    };
  }

  if (mode === 'equation') {
    const coefficient = randomInt(random, 2, 7);
    const x = randomInt(random, 3, 15);
    const add = randomInt(random, 2, 15);
    const result = coefficient * x + add;
    const wrongRemainder = result + add;
    return {
      ...identity,
      prompt: 'İlk hatalı satırı bul.',
      steps: [
        `${coefficient}x + ${add} = ${result}`,
        `${coefficient}x = ${result} + ${add} = ${wrongRemainder}`,
        `x = ${wrongRemainder}/${coefficient}`,
        `Çözüm x = ${wrongRemainder / coefficient} yazılır.`
      ],
      answer: 1,
      explanation: `Eşitliğin iki tarafından ${add} çıkarılmalıydı: ${coefficient}x = ${result - add}; buradan x = ${x}.`
    };
  }

  const firstRatio = randomInt(random, 2, 5);
  const secondRatio = randomInt(random, firstRatio + 1, 8);
  const factor = randomInt(random, 4, 12);
  const total = (firstRatio + secondRatio) * factor;
  const wrongUnit = total / secondRatio;
  return {
    ...identity,
    prompt: 'İlk hatalı satırı bul.',
    steps: [
      `Kırmızı ve mavi boncukların oranı ${firstRatio}:${secondRatio}, toplamları ${total}’dir.`,
      `Bir oran payı ${total} ÷ ${secondRatio} = ${wrongUnit} olarak bulunur.`,
      `Kırmızı sayısı ${firstRatio} × ${wrongUnit} olarak hesaplanır.`,
      'Sonuç bu değere göre yazılır.'
    ],
    answer: 1,
    explanation: `Toplam oran ${firstRatio + secondRatio}’dir. Bir pay ${total} ÷ ${firstRatio + secondRatio} = ${factor} olmalıdır.`
  };
}

