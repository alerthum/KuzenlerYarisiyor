// Aşama 10 — Çocuk aklı / insan gözü denetimi.
// 1–12. sınıf yaş bantlarında anlaşılabilirlik, yapaylık, sıkıcılık, öğreticilik.

export const STAGE10_SCORE_MIN = 90;

const AGE_BANDS = [
  { minGrade: 1, maxGrade: 2, label: '1-2', maxStemWords: 40 },
  { minGrade: 3, maxGrade: 5, label: '3-5', maxStemWords: 70 },
  { minGrade: 6, maxGrade: 8, label: '6-8', maxStemWords: 100 },
  { minGrade: 9, maxGrade: 12, label: '9-12', maxStemWords: 140 }
];

function wordCount(text = '') {
  return String(text).trim().split(/\s+/).filter(Boolean).length;
}

function looksArtificial(text = '') {
  return /kulüp raporu|renkli başlıklı dosya|xyz123|lorem ipsum/i.test(text);
}

function looksBoring(round = {}) {
  const prompt = String(round.prompt || '');
  return /sonucu kaçtır\??$/i.test(prompt) && prompt.length < 28 && !(round.cognitiveTraits || []).length;
}

export function reviewChildMind(round = {}, { grade = 6 } = {}) {
  const band = AGE_BANDS.find((b) => grade >= b.minGrade && grade <= b.maxGrade) || AGE_BANDS[2];
  const stemWords = wordCount(`${round.prompt || ''} ${round.context || ''}`);
  const violations = [];
  if (stemWords > band.maxStemWords * 1.6) violations.push('age_unreadable_length');
  if (looksArtificial(`${round.prompt || ''} ${round.context || ''}`)) violations.push('artificial_language');
  if (looksBoring(round)) violations.push('boring_routine');
  if (!round.explanation || String(round.explanation).length < 8) violations.push('not_teachable');
  if ((round.options || []).some((o) => looksArtificial(String(o)))) violations.push('artificial_option');

  const critical = violations.includes('artificial_language') || violations.includes('not_teachable');
  const score = Math.max(0, 100 - violations.length * 15);
  return {
    ok: !critical && score >= STAGE10_SCORE_MIN,
    score,
    band: band.label,
    violations,
    criticalReject: critical
  };
}

export function attachChildMindReview(round = {}, context = {}) {
  const review = reviewChildMind(round, context);
  return { ...round, childMindReview: review };
}

export function filterRoundsByChildMind(rounds = [], { grade = 6 } = {}) {
  const kept = [];
  const rejected = [];
  for (const round of rounds) {
    const enriched = attachChildMindReview(round, { grade });
    if (enriched.childMindReview.criticalReject) rejected.push(enriched);
    else kept.push(enriched);
  }
  return { kept, rejected };
}

export function scoreChildMindAudit(samples = []) {
  if (!samples.length) return { scorePercent: 0, criticalRejects: 1, meetsStageGate: false };
  let sum = 0;
  let criticalRejects = 0;
  for (const sample of samples) {
    const review = reviewChildMind(sample.round || sample, { grade: sample.grade || 6 });
    sum += review.score;
    if (review.criticalReject) criticalRejects += 1;
  }
  const scorePercent = Math.round((sum / samples.length) * 10) / 10;
  return {
    scorePercent,
    criticalRejects,
    total: samples.length,
    meetsStageGate: scorePercent >= STAGE10_SCORE_MIN && criticalRejects === 0
  };
}
