const SUBJECT_LABELS = Object.freeze({
  mathematics: 'Matematik', turkish: 'Türkçe', science: 'Fen Bilimleri', social: 'Sosyal Bilgiler',
  religion: 'Din Kültürü', english: 'İngilizce', logic: 'Zekâ', olympiad: 'Olimpiyat'
});

const SUBJECT_RULES = Object.freeze({
  mathematics: { curriculum: 78, difficulty: 76, cognitive: 76, distractor: 76, pedagogy: 72, language: 72 },
  turkish: { curriculum: 78, difficulty: 74, cognitive: 78, distractor: 80, pedagogy: 74, language: 84 },
  science: { curriculum: 82, difficulty: 74, cognitive: 76, distractor: 76, pedagogy: 78, language: 76 },
  social: { curriculum: 82, difficulty: 72, cognitive: 76, distractor: 76, pedagogy: 76, language: 80 },
  religion: { curriculum: 86, difficulty: 68, cognitive: 72, distractor: 74, pedagogy: 80, language: 82 },
  english: { curriculum: 78, difficulty: 72, cognitive: 72, distractor: 78, pedagogy: 74, language: 84 },
  logic: { curriculum: 72, difficulty: 80, cognitive: 84, distractor: 82, pedagogy: 76, language: 78 },
  olympiad: { curriculum: 74, difficulty: 86, cognitive: 88, distractor: 82, pedagogy: 84, language: 76 },
  default: { curriculum: 76, difficulty: 74, cognitive: 76, distractor: 76, pedagogy: 74, language: 76 }
});

function resolveSubject(subjectId = '') {
  const id = String(subjectId).toLocaleLowerCase('tr-TR');
  if (/math|matematik/.test(id)) return 'mathematics';
  if (/turk|türk/.test(id)) return 'turkish';
  if (/science|fen/.test(id)) return 'science';
  if (/social|sosyal|history|geography/.test(id)) return 'social';
  if (/religion|din/.test(id)) return 'religion';
  if (/english|ingiliz/.test(id)) return 'english';
  if (/olymp|olimpiyat/.test(id)) return 'olympiad';
  if (/logic|zeka|zekâ/.test(id)) return 'logic';
  return 'default';
}

export function runQualityOrchestra(report, question = {}, context = {}) {
  const subjectKey = resolveSubject(context.subjectId || question.subjectId || context.gameId || '');
  const thresholds = SUBJECT_RULES[subjectKey] || SUBJECT_RULES.default;
  const agents = Object.entries(thresholds).map(([dimension, threshold]) => {
    const score = Number(report.dimensions?.[dimension] || 0);
    return { agent: `${dimension}-agent`, dimension, score, threshold, verdict: score >= threshold ? 'PASS' : 'FAIL' };
  });

  const criticalAgents = new Set(subjectKey === 'olympiad' || subjectKey === 'logic'
    ? ['cognitive', 'difficulty', 'distractor']
    : subjectKey === 'turkish' || subjectKey === 'english'
      ? ['language', 'distractor', 'cognitive']
      : ['curriculum', 'cognitive']);
  const criticalFailures = agents.filter(a => a.verdict === 'FAIL' && criticalAgents.has(a.dimension));
  const failures = agents.filter(a => a.verdict === 'FAIL');
  const hardReject = (report.errors || []).length > 0;
  const verdict = hardReject ? 'REJECT' : failures.length ? 'REVIEW' : report.overall >= 88 ? 'GOLD' : 'APPROVE';

  return {
    subjectKey,
    subjectLabel: SUBJECT_LABELS[subjectKey] || 'Genel',
    verdict,
    agents,
    criticalFailures: criticalFailures.map(x => x.dimension),
    failedDimensions: failures.map(x => x.dimension),
    chiefJudge: hardReject ? 'YAYINLANAMAZ' : verdict === 'REVIEW' ? 'EDİTÖR İNCELEMESİ' : 'YAYINLANABİLİR'
  };
}

export function isShowcaseEligible(report, orchestra) {
  return report.status === 'GOLD' && orchestra.verdict === 'GOLD' && !(report.warnings || []).length;
}
