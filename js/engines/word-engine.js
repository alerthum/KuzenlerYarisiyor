const TURKISH_LETTERS = /[^a-zçğıöşüâîû]/giu;

export function normalizeTurkish(value = '') {
  return String(value)
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replace(TURKISH_LETTERS, '');
}

export function letterInventory(value = '') {
  const inventory = new Map();
  for (const letter of normalizeTurkish(value)) {
    inventory.set(letter, (inventory.get(letter) || 0) + 1);
  }
  return inventory;
}

export function canBuildWord(source, candidate) {
  const normalizedCandidate = normalizeTurkish(candidate);
  if (normalizedCandidate.length < 2) return false;
  const sourceInventory = letterInventory(source);
  const candidateInventory = letterInventory(normalizedCandidate);
  for (const [letter, count] of candidateInventory) {
    if ((sourceInventory.get(letter) || 0) < count) return false;
  }
  return true;
}

export function isOneLetterChange(first, second) {
  const a = normalizeTurkish(first);
  const b = normalizeTurkish(second);
  if (a.length !== b.length || a === b) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) difference += 1;
    if (difference > 1) return false;
  }
  return difference === 1;
}

export function validateWordMine(source, candidate, allowedWords, usedWords = []) {
  const word = normalizeTurkish(candidate);
  if (word.length < 3) return { valid: false, reason: 'En az 3 harfli bir kelime yazmalısın.' };
  if (!canBuildWord(source, word)) return { valid: false, reason: 'Bu kelimede ana kelimede olmayan veya fazla kullanılan harf var.' };
  if (usedWords.map(normalizeTurkish).includes(word)) return { valid: false, reason: 'Bu kelimeyi daha önce buldun.' };
  if (!allowedWords.map(normalizeTurkish).includes(word)) return { valid: false, reason: 'Bu kelime henüz doğrulanmış kelime listemizde yok. Harfleri uygunsa ‘Soru yanlış veya hatalı’ düğmesiyle bize bildirebilirsin.' };
  return { valid: true, word, score: scoreWord(word) };
}

export function scoreWord(word) {
  const length = normalizeTurkish(word).length;
  if (length <= 3) return 10;
  if (length === 4) return 20;
  if (length === 5) return 35;
  if (length === 6) return 55;
  return 80 + (length - 7) * 15;
}

export function validateLadder(start, steps, end, dictionary) {
  const normalized = [start, ...steps, end].map(normalizeTurkish);
  const known = new Set(dictionary.map(normalizeTurkish));
  for (const word of normalized) {
    if (!known.has(word)) return { valid: false, reason: `“${word.toLocaleUpperCase('tr-TR')}” doğrulanmış kelime listesinde yok.` };
  }
  for (let index = 0; index < normalized.length - 1; index += 1) {
    if (!isOneLetterChange(normalized[index], normalized[index + 1])) {
      return { valid: false, reason: 'Her adımda yalnızca bir harf değişmeli.' };
    }
  }
  return { valid: true };
}

export function containsForbiddenLetter(text, letter) {
  return String(text).toLocaleLowerCase('tr-TR').includes(String(letter).toLocaleLowerCase('tr-TR'));
}
