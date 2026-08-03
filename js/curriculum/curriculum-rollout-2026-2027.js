import { assertAuthoritativeSource } from './curriculum-source-registry.js';

export const ACTIVE_SCHOOL_YEAR = '2026-2027';
export const ACTIVE_ROLLOUT_SOURCE_ID = 'meb-2026-2027-rollout';

assertAuthoritativeSource(ACTIVE_ROLLOUT_SOURCE_ID);

const TYMM_GRADES = new Set([1, 2, 3, 5, 6, 7, 9, 10, 11]);
const LEGACY_GRADES = new Set([4, 8, 12]);

export const CURRICULUM_ROLLOUT_2026_2027 = Object.freeze(
  Array.from({ length: 12 }, (_, index) => {
    const grade = index + 1;
    const programFamily = TYMM_GRADES.has(grade) ? 'TYMM' : 'PRE_TYMM';
    const sourceId = programFamily === 'TYMM' ? 'meb-tymm-programs' : 'meb-legacy-programs';
    return Object.freeze({
      schoolYear: ACTIVE_SCHOOL_YEAR,
      grade,
      programFamily,
      programVersionStatus: 'ACTIVE',
      sourceId,
      rolloutEvidenceSourceId: ACTIVE_ROLLOUT_SOURCE_ID
    });
  })
);

export function curriculumRouteForGrade(grade) {
  const value = Number(grade);
  const route = CURRICULUM_ROLLOUT_2026_2027.find(entry => entry.grade === value);
  if (!route) throw new Error(`unsupported grade: ${grade}`);
  return route;
}

export function validateRolloutCoverage() {
  const grades = CURRICULUM_ROLLOUT_2026_2027.map(entry => entry.grade);
  return Object.freeze({
    ok: grades.length === 12 && new Set(grades).size === 12
      && CURRICULUM_ROLLOUT_2026_2027.every(entry => TYMM_GRADES.has(entry.grade) || LEGACY_GRADES.has(entry.grade)),
    schoolYear: ACTIVE_SCHOOL_YEAR,
    tymmGrades: Object.freeze([...TYMM_GRADES]),
    legacyGrades: Object.freeze([...LEGACY_GRADES])
  });
}
