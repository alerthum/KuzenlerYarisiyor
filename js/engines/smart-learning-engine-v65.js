const TRIVIAL_PATTERNS = [
  /^\s*\d+\s*[+\-×x*]\s*\d+\s*=\s*\?\s*$/i,
  /^\s*\d+x\s*[+\-]\s*\d+\s*=\s*\d+.*x\s*(kaç|nedir)/i,
  /^\s*(hangisi|kaçtır)\s*$/i
];

export function normalizeQuestionSignature(question) {
  return [question.prompt, question.context, ...(question.options || [])]
    .filter(Boolean)
    .join('|')
    .toLocaleLowerCase('tr-TR')
    .replace(/\s+/g, ' ')
    .trim();
}

export function cognitiveDepthScore(question) {
  const text = `${question.context || ''} ${question.prompt || ''}`.trim();
  let score = 0;
  if (text.length >= 80) score += 1;
  if (/yorum|çıkarım|kanıt|neden|karşılaştır|tablo|grafik|koşul|strateji/i.test(text)) score += 2;
  if ((question.steps || []).length >= 2) score += 2;
  if ((question.options || []).length >= 4) score += 1;
  if (question.explanation && String(question.explanation).length >= 80) score += 1;
  return score;
}

export function passesQualityGate(question, profile, sessionSignatures = new Set()) {
  const grade = Number(profile?.grade || 1);
  const signature = normalizeQuestionSignature(question);
  if (!signature) return { ok: false, reason: 'boş soru' };
  if (sessionSignatures.has(signature)) return { ok: false, reason: 'aynı oturumda tekrar' };
  if (grade >= 4 && TRIVIAL_PATTERNS.some((pattern) => pattern.test(String(question.prompt || '')))) {
    return { ok: false, reason: 'sınıf düzeyine göre aşırı kolay' };
  }
  const depth = cognitiveDepthScore(question);
  const declaredDifficulty = Number(question.difficulty || question.cognitiveDepth || 3);
  if (declaredDifficulty < 3) return { ok: false, reason: 'kolay soru politikası nedeniyle elendi' };
  if (grade <= 3 && depth < 1) return { ok: false, reason: 'temel sınıf için bile düşünme adımı yetersiz' };
  if (grade >= 4 && grade < 7 && depth < 2) return { ok: false, reason: 'orta-üstü zorluk için bilişsel derinlik yetersiz' };
  if (grade >= 7 && grade < 11 && depth < 3) return { ok: false, reason: 'LGS düzeyi için bilişsel derinlik yetersiz' };
  if (grade >= 11 && depth < 4) return { ok: false, reason: 'YKS/KPSS düzeyi için çok yüzeysel' };
  return { ok: true, reason: 'uygun', signature, depth };
}

export function selectDiverseQuestions(candidates, profile, count, historicalKeys = new Set()) {
  const selected = [];
  const sessionSignatures = new Set();
  const familyCount = new Map();
  for (const question of candidates) {
    if (selected.length >= count) break;
    if (historicalKeys.has(question.questionKey)) continue;
    const family = question.family || question.skill || question.category || 'general';
    if ((familyCount.get(family) || 0) >= Math.ceil(count / 3)) continue;
    const result = passesQualityGate(question, profile, sessionSignatures);
    if (!result.ok) continue;
    selected.push(question);
    sessionSignatures.add(result.signature);
    familyCount.set(family, (familyCount.get(family) || 0) + 1);
  }
  return selected;
}
