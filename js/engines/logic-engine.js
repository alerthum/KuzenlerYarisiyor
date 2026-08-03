import { pick, seededRandom, shuffle } from '../utils.js';

function permutations(items) {
  if (items.length <= 1) return [items];
  return items.flatMap((item, index) => permutations([...items.slice(0, index), ...items.slice(index + 1)]).map((rest) => [item, ...rest]));
}

function encodeWord(word, shift) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return [...word].map((letter) => {
    const index = alphabet.indexOf(letter);
    return index < 0 ? letter : alphabet[(index + shift) % alphabet.length];
  }).join('');
}

function mutateCode(code, random) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const chars = [...code];
  const index = Math.floor(random() * chars.length);
  const letterIndex = alphabet.indexOf(chars[index]);
  chars[index] = alphabet[(letterIndex + 1 + Math.floor(random() * 4)) % alphabet.length];
  return chars.join('');
}

function orderingRound(age, random) {
  const youngerSets = [
    ['Matematik', 'Türkçe', 'Fen', 'Müzik'],
    ['Elma', 'Armut', 'Muz', 'Kiraz'],
    ['Ayşe', 'Bora', 'Cem', 'Duru'],
    ['Kırmızı', 'Mavi', 'Yeşil', 'Sarı'],
    ['Masal', 'Şiir', 'Bilmece', 'Fıkra']
  ];
  const olderSets = [
    ['Aslı', 'Burak', 'Ceren', 'Deniz', 'Efe'],
    ['Matematik', 'Türkçe', 'Fen', 'Tarih', 'İngilizce'],
    ['P', 'R', 'S', 'T', 'V'],
    ['Roman', 'Şiir', 'Deneme', 'Öykü', 'Biyografi'],
    ['Ankara', 'Bursa', 'Denizli', 'İzmir', 'Uşak']
  ];
  const items = [...pick(age <= 10 ? youngerSets : olderSets, random)];
  const target = shuffle(items, random);
  const all = permutations(items);
  const immediatelyBefore = (order, left, right) => order.indexOf(right) - order.indexOf(left) === 1;
  const valid = age <= 10
    ? (order) => order.indexOf(target[0]) < order.indexOf(target.at(-1)) && immediatelyBefore(order, target[1], target[2]) && order.at(-1) !== target[0]
    : (order) => order.indexOf(target[0]) < order.indexOf(target.at(-1)) && immediatelyBefore(order, target[1], target[2]) && order[0] !== target[3];
  const validOrders = all.filter(valid);
  const answerOrder = pick(validOrders, random);
  const invalidOrders = shuffle(all.filter((order) => !valid(order)), random).slice(0, 3);
  const options = shuffle([answerOrder, ...invalidOrders], random).map((order) => order.join(' – '));
  const context = age <= 10
    ? `${target[0]}, ${target.at(-1)}’den önce gelir. ${target[1]}, ${target[2]}’nin hemen önündedir. ${target[0]} en sonda değildir.`
    : `${target[0]}, ${target.at(-1)}’den önce yer alır. ${target[1]}, ${target[2]}’nin hemen önündedir. ${target[3]} ilk sırada değildir.`;
  return {
    context,
    prompt: 'Koşulların tümünü sağlayan sıralama hangisidir?',
    options,
    answerValue: answerOrder.join(' – '),
    explanation: `${answerOrder.join(' – ')} sıralaması verilen üç koşulu da aynı anda sağlar.`
  };
}

function truthRound(random) {
  const names = shuffle(['Ada', 'Berk', 'Cem', 'Duru', 'Ekin', 'Fırat'], random).slice(0, 2);
  const variant = Math.floor(random() * 3);
  if (variant === 0) {
    return {
      context: 'Doğrucular her zaman doğru, yalancılar her zaman yanlış söyler.',
      prompt: `${names[0]} “${names[1]} yalancıdır.”, ${names[1]} ise “İkimiz aynı türdeyiz.” diyor. Hangisi doğrudur?`,
      options: [`İkisi de doğrucu`, `${names[0]} doğrucu, ${names[1]} yalancı`, `${names[0]} yalancı, ${names[1]} doğrucu`, 'İkisi de yalancı'],
      answerValue: `${names[0]} doğrucu, ${names[1]} yalancı`,
      explanation: `${names[0]} doğru söylüyorsa ${names[1]} yalancıdır; “aynı türdeyiz” sözü de bu durumda yanlış olur.`
    };
  }
  if (variant === 1) {
    return {
      context: 'Doğrucular her zaman doğru, yalancılar her zaman yanlış söyler.',
      prompt: `${names[0]} “${names[1]} doğrucudur.”, ${names[1]} ise “İkimiz farklı türdeyiz.” diyor. Hangisi doğrudur?`,
      options: [`İkisi de doğrucu`, `${names[0]} doğrucu, ${names[1]} yalancı`, `${names[0]} yalancı, ${names[1]} doğrucu`, 'İkisi de yalancı'],
      answerValue: 'İkisi de yalancı',
      explanation: `İkisi de yalancı olduğunda ${names[0]}’ın “doğrucu” sözü ve ${names[1]}’in “farklıyız” sözü birlikte yanlış olur.`
    };
  }
  return {
    context: 'Doğrucular her zaman doğru, yalancılar her zaman yanlış söyler.',
    prompt: `${names[0]} “İkimizden yalnız biri doğrucudur.”, ${names[1]} ise “${names[0]} yalancıdır.” diyor. Hangisi olabilir?`,
    options: [`İkisi de doğrucu`, `${names[0]} doğrucu, ${names[1]} yalancı`, `${names[0]} yalancı, ${names[1]} doğrucu`, 'İkisi de yalancı'],
    answerValue: `${names[0]} doğrucu, ${names[1]} yalancı`,
    explanation: `${names[0]} doğrucu ve ${names[1]} yalancı olduğunda ilk söz doğru, ikinci söz yanlış olur.`
  };
}

function codeRound(age, random) {
  const words = age <= 10 ? ['KALEM', 'MASA', 'KAPI', 'OYUN', 'BULUT', 'RENK'] : ['MERAK', 'BILIM', 'DENIZ', 'KITAP', 'ROBOT', 'ZEKA'];
  const word = pick(words, random);
  const shift = age <= 10 ? 1 : 1 + Math.floor(random() * 3);
  const encoded = encodeWord(word, shift);
  const distractors = new Set();
  while (distractors.size < 3) {
    const candidate = mutateCode(encoded, random);
    if (candidate !== encoded) distractors.add(candidate);
  }
  const options = shuffle([encoded, ...distractors], random);
  return {
    context: `Şifrelemede her harf İngiliz alfabesinde kendisinden ${shift} sonraki harfle değiştirilir; alfabenin sonundan sonra A’ya dönülür.`,
    prompt: `${word} sözcüğünün şifreli biçimi hangisidir?`,
    options,
    answerValue: encoded,
    explanation: [...word].map((letter, index) => `${letter}→${encoded[index]}`).join(', ') + `; sonuç ${encoded}.`
  };
}

function numberLockRound(age, random) {
  const first = 1 + Math.floor(random() * (age <= 10 ? 5 : 7));
  const delta = 1 + Math.floor(random() * 2);
  const second = first + delta;
  const third = age <= 10 ? first + second : second + delta;
  const code = `${first}${second}${third}`;
  const options = new Set([code]);
  while (options.size < 4) {
    const candidate = `${Math.max(0, first + Math.floor(random() * 3) - 1)}${Math.max(0, second + Math.floor(random() * 3) - 1)}${Math.max(0, third + Math.floor(random() * 3) - 1)}`;
    options.add(candidate);
  }
  return {
    context: age <= 10
      ? `Üç basamaklı kilitte ikinci rakam birinciden ${delta} fazladır. Üçüncü rakam ilk iki rakamın toplamıdır.`
      : `Üç basamaklı kilitte her rakam kendinden öncekinden ${delta} fazladır. İlk rakam ${first}’dir.`,
    prompt: 'Kilidi açan kod hangisidir?',
    options: shuffle([...options], random),
    answerValue: code,
    explanation: age <= 10
      ? `İlk rakam ${first}, ikinci ${first}+${delta}=${second}, üçüncü ${first}+${second}=${third}; kod ${code}.`
      : `Rakamlar ${first}, ${first}+${delta}=${second} ve ${second}+${delta}=${third}; kod ${code}.`
  };
}

function selectionRound(age, random) {
  const people = shuffle(['Aylin', 'Baran', 'Cansu', 'Doruk', 'Ela', 'Fırat'], random).slice(0, age <= 10 ? 4 : 5);
  const must = people[0];
  const excluded = people[1];
  const linkedA = people[2];
  const linkedB = people[3];
  const size = age <= 10 ? 2 : 3;
  const allSelections = [];
  function choose(start, selected) {
    if (selected.length === size) { allSelections.push([...selected]); return; }
    for (let i = start; i < people.length; i += 1) choose(i + 1, [...selected, people[i]]);
  }
  choose(0, []);
  const valid = (group) => group.includes(must) && !group.includes(excluded) && (!group.includes(linkedA) || group.includes(linkedB));
  const validGroups = allSelections.filter(valid);
  const answer = pick(validGroups, random);
  const invalid = shuffle(allSelections.filter((group) => !valid(group)), random).slice(0, 3);
  const options = shuffle([answer, ...invalid], random).map((group) => group.join(' – '));
  return {
    context: `${size} kişilik ekip kurulacaktır. ${must} ekipte olmalıdır. ${excluded} ekipte olamaz. ${linkedA} seçilirse ${linkedB} de seçilmelidir.`,
    prompt: 'Kurallara uygun ekip hangisidir?',
    options,
    answerValue: answer.join(' – '),
    explanation: `${answer.join(' – ')} ekibi zorunlu kişiyi içerir, yasaklı kişiyi içermez ve bağlı seçim kuralını bozmaz.`
  };
}

export function createLogicRound(age, seed) {
  const random = seededRandom(seed);
  const mode = pick(age <= 10
    ? ['ordering', 'truth', 'code', 'lock', 'selection']
    : ['ordering', 'truth', 'code', 'lock', 'selection', 'ordering'], random);
  if (mode === 'ordering') return orderingRound(age, random);
  if (mode === 'truth') return truthRound(random);
  if (mode === 'code') return codeRound(age, random);
  if (mode === 'lock') return numberLockRound(age, random);
  return selectionRound(age, random);
}
