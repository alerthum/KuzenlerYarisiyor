import {
  generateSolverBackedMathRounds,
  mathFamilyEngineAudit
} from './solver-backed-math-family-engine.js';
import { GRADE4_SOLVER_BACKED_MATH_FAMILIES } from './solver-backed-g4-math-families.js';
import { GRADE8_SOLVER_BACKED_MATH_FAMILIES } from './solver-backed-g8-math-families.js';

function cellId(round) {
  return `${round.gameId}:${Number(round.targetGrade)}`;
}

function skeletonIndex(round) {
  const id = String(round.skeletonId || '');
  if (/direct-model|story-model/.test(id)) return 0;
  if (/reverse-constraint|reverse-model/.test(id)) return 1;
  return 2;
}

function deterministicCellOrder(rows) {
  const remaining = [...rows].map((round) => ({ round, skeletonIndex: skeletonIndex(round) }));
  const ordered = [];
  let previousFamilyId = null;
  let previousExperience = null;

  while (remaining.length) {
    const familyRemaining = new Map();
    const experienceRemaining = new Map();
    for (const item of remaining) {
      familyRemaining.set(item.round.familyId, (familyRemaining.get(item.round.familyId) || 0) + 1);
      experienceRemaining.set(item.round.trustedExperienceType, (experienceRemaining.get(item.round.trustedExperienceType) || 0) + 1);
    }

    const candidates = remaining
      .filter((item) => item.round.familyId !== previousFamilyId && item.round.trustedExperienceType !== previousExperience)
      .sort((left, right) => (
        (familyRemaining.get(right.round.familyId) - familyRemaining.get(left.round.familyId))
        || (experienceRemaining.get(right.round.trustedExperienceType) - experienceRemaining.get(left.round.trustedExperienceType))
        || (left.skeletonIndex - right.skeletonIndex)
        || String(left.round.familyId).localeCompare(String(right.round.familyId))
        || String(left.round.questionKey).localeCompare(String(right.round.questionKey))
      ));

    const chosen = candidates[0];
    if (!chosen) {
      throw new Error(`Oturum çeşitliliği sıralaması kilitlendi: ${cellId(remaining[0].round)}`);
    }

    const index = remaining.indexOf(chosen);
    remaining.splice(index, 1);
    ordered.push(chosen.round);
    previousFamilyId = chosen.round.familyId;
    previousExperience = chosen.round.trustedExperienceType;
  }

  return ordered;
}

function diversifyRounds(rounds) {
  const cells = new Map();
  for (const round of rounds) {
    const id = cellId(round);
    if (!cells.has(id)) cells.set(id, []);
    cells.get(id).push(round);
  }

  const result = [];
  for (const id of [...cells.keys()].sort()) {
    const ordered = deterministicCellOrder(cells.get(id));
    ordered.forEach((round, index) => {
      result.push(Object.freeze({
        ...round,
        trustedSessionOrder: index + 1,
        sessionDiversityPolicy: 'NO_ADJACENT_FAMILY_OR_EXPERIENCE_V1',
        enginePublicationMode: 'SOLVER_BACKED_FAIL_CLOSED'
      }));
    });
  }
  return Object.freeze(result);
}

const RAW_GRADE4_ROUNDS = generateSolverBackedMathRounds(GRADE4_SOLVER_BACKED_MATH_FAMILIES, {
  variantsPerSkeleton: 1,
  seedBase: 4000
});
const RAW_GRADE8_ROUNDS = generateSolverBackedMathRounds(GRADE8_SOLVER_BACKED_MATH_FAMILIES, {
  variantsPerSkeleton: 1,
  seedBase: 8000
});

export const SOLVER_BACKED_PRIORITY_MATH_ROUNDS = diversifyRounds([
  ...RAW_GRADE4_ROUNDS,
  ...RAW_GRADE8_ROUNDS
]);

function keysFor(gameId, grade) {
  return Object.freeze(SOLVER_BACKED_PRIORITY_MATH_ROUNDS
    .filter((round) => round.gameId === gameId && Number(round.targetGrade) === Number(grade))
    .sort((left, right) => Number(left.trustedSessionOrder) - Number(right.trustedSessionOrder))
    .map((round) => round.questionKey));
}

export const SOLVER_BACKED_PRIORITY_MATH_KEYS = Object.freeze({
  grade4: Object.freeze({
    problemHunter: keysFor('problem-hunter', 4),
    errorDetective: keysFor('error-detective', 4),
    geometryLab: keysFor('geometry-lab', 4)
  }),
  grade8: Object.freeze({
    problemHunter: keysFor('problem-hunter', 8),
    errorDetective: keysFor('error-detective', 8),
    geometryLab: keysFor('geometry-lab', 8)
  })
});

const grade4Rounds = SOLVER_BACKED_PRIORITY_MATH_ROUNDS.filter((round) => Number(round.targetGrade) === 4);
const grade8Rounds = SOLVER_BACKED_PRIORITY_MATH_ROUNDS.filter((round) => Number(round.targetGrade) === 8);
const grade4Audit = mathFamilyEngineAudit(GRADE4_SOLVER_BACKED_MATH_FAMILIES, grade4Rounds);
const grade8Audit = mathFamilyEngineAudit(GRADE8_SOLVER_BACKED_MATH_FAMILIES, grade8Rounds);

function adjacencyErrors(rounds) {
  const errors = [];
  const cells = new Map();
  for (const round of rounds) {
    const id = cellId(round);
    if (!cells.has(id)) cells.set(id, []);
    cells.get(id).push(round);
  }
  for (const [id, cellRounds] of cells) {
    const ordered = [...cellRounds].sort((a, b) => a.trustedSessionOrder - b.trustedSessionOrder);
    for (let index = 1; index < ordered.length; index += 1) {
      if (ordered[index - 1].familyId === ordered[index].familyId) errors.push(`${id}:adjacent-family:${index}`);
      if (ordered[index - 1].trustedExperienceType === ordered[index].trustedExperienceType) errors.push(`${id}:adjacent-experience:${index}`);
    }
  }
  return errors;
}

const combinedErrors = [
  ...grade4Audit.errors.map((error) => `g4:${error}`),
  ...grade8Audit.errors.map((error) => `g8:${error}`),
  ...adjacencyErrors(SOLVER_BACKED_PRIORITY_MATH_ROUNDS)
];

export const SOLVER_BACKED_PRIORITY_MATH_AUDIT = Object.freeze({
  ok: combinedErrors.length === 0,
  errors: Object.freeze(combinedErrors),
  policy: Object.freeze({
    variantsPerSkeleton: 1,
    fallbackToLegacyAllowed: false,
    sessionDiversityPolicy: 'NO_ADJACENT_FAMILY_OR_EXPERIENCE_V1'
  }),
  metrics: Object.freeze({
    grade4FamilyCount: GRADE4_SOLVER_BACKED_MATH_FAMILIES.length,
    grade8FamilyCount: GRADE8_SOLVER_BACKED_MATH_FAMILIES.length,
    familyCount: GRADE4_SOLVER_BACKED_MATH_FAMILIES.length + GRADE8_SOLVER_BACKED_MATH_FAMILIES.length,
    grade4RoundCount: grade4Rounds.length,
    grade8RoundCount: grade8Rounds.length,
    roundCount: SOLVER_BACKED_PRIORITY_MATH_ROUNDS.length,
    distinctSkeletonCount: new Set(SOLVER_BACKED_PRIORITY_MATH_ROUNDS.map((round) => round.skeletonId)).size,
    solverVerifiedCount: SOLVER_BACKED_PRIORITY_MATH_ROUNDS.filter((round) => round.solverProof?.verified === true).length,
    safeCellCount: 6,
    supportedGameCount: 3
  })
});

if (!SOLVER_BACKED_PRIORITY_MATH_AUDIT.ok) {
  throw new Error(`Solver destekli öncelikli matematik bankası geçersiz: ${SOLVER_BACKED_PRIORITY_MATH_AUDIT.errors.join(', ')}`);
}
