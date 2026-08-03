function normalizeBand(value = '') {
  return String(value || '')
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, '');
}

export function normalizeStudentGrade(value) {
  if (value === null || value === undefined || value === '') return null;
  const grade = Number(value);
  if (!Number.isInteger(grade) || grade < 1 || grade > 12) {
    throw new Error(`invalid student grade: ${value}`);
  }
  return grade;
}

export function parsePremiumGradeBand(value) {
  const normalized = normalizeBand(value);
  if (!normalized || ['all', 'tümü', 'tum', 'tüm'].includes(normalized)) {
    return { label: normalized || 'all', min: 1, max: 12 };
  }

  const exact = normalized.match(/^(\d{1,2})$/);
  if (exact) {
    const grade = Number(exact[1]);
    if (grade >= 1 && grade <= 12) return { label: normalized, min: grade, max: grade };
  }

  const range = normalized.match(/^(\d{1,2})-(\d{1,2})$/);
  if (range) {
    const min = Number(range[1]);
    const max = Number(range[2]);
    if (min >= 1 && max <= 12 && min <= max) return { label: normalized, min, max };
  }

  throw new Error(`invalid premium gradeBand: ${value}`);
}

export function isPremiumGradeEligible(gradeBand, grade) {
  const normalizedGrade = normalizeStudentGrade(grade);
  if (normalizedGrade === null) return true;
  const band = parsePremiumGradeBand(gradeBand);
  return normalizedGrade >= band.min && normalizedGrade <= band.max;
}

export function premiumGradeCoverage(gradeBands = []) {
  const coverage = {};
  for (let grade = 1; grade <= 12; grade += 1) {
    coverage[grade] = gradeBands.some((band) => isPremiumGradeEligible(band, grade));
  }
  return coverage;
}
