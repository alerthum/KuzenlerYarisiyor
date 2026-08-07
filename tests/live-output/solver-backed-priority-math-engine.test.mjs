import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameSession } from '../../js/games/registry.js';
import { auditLiveOutputRound, normalizeTrustedLiveRound } from '../../js/quality/live-output-gate.js';
import { GRADE4_SOLVER_BACKED_MATH_FAMILIES } from '../../js/assessment-v2/solver-backed-g4-math-families.js';
import { GRADE8_SOLVER_BACKED_MATH_FAMILIES } from '../../js/assessment-v2/solver-backed-g8-math-families.js';
import {
  SOLVER_BACKED_PRIORITY_MATH_AUDIT,
  SOLVER_BACKED_PRIORITY_MATH_KEYS,
  SOLVER_BACKED_PRIORITY_MATH_ROUNDS
} from '../../js/assessment-v2/solver-backed-priority-math-bank.js';
import { trustedLiveCell } from '../../js/assessment-v2/trusted-live-policy.js';

const CELLS = [
  ['problem-hunter', 4, SOLVER_BACKED_PRIORITY_MATH_KEYS.grade4.problemHunter],
  ['error-detective', 4, SOLVER_BACKED_PRIORITY_MATH_KEYS.grade4.errorDetective],
  ['geometry-lab', 4, SOLVER_BACKED_PRIORITY_MATH_KEYS.grade4.geometryLab],
  ['problem-hunter', 8, SOLVER_BACKED_PRIORITY_MATH_KEYS.grade8.problemHunter],
  ['error-detective', 8, SOLVER_BACKED_PRIORITY_MATH_KEYS.grade8.errorDetective],
  ['geometry-lab', 8, SOLVER_BACKED_PRIORITY_MATH_KEYS.grade8.geometryLab]
];

function profile(grade, gameId) {
  return { id: `solver-math:${grade}:${gameId}`, name: `${grade}. sınıf motor testi`, age: grade + 6, grade, level: 10, skills: {} };
}

function session(gameId, grade, seed, seenQuestionKeys = new Set()) {
  return createGameSession(gameId, profile(grade, gameId), seed, {
    controlledLaunchPilot: true,
    completedSessionCount: 1,
    seenQuestionKeys,
    attempts: []
  });
}

test('4. ve 8. sınıf Matematik motoru 30 aile, 90 iskelet ve 204 solver-doğrulamalı çıktı üretir', () => {
  assert.equal(GRADE4_SOLVER_BACKED_MATH_FAMILIES.length, 15);
  assert.equal(GRADE8_SOLVER_BACKED_MATH_FAMILIES.length, 15);
  assert.equal(SOLVER_BACKED_PRIORITY_MATH_AUDIT.ok, true, SOLVER_BACKED_PRIORITY_MATH_AUDIT.errors.join(', '));
  assert.deepEqual(SOLVER_BACKED_PRIORITY_MATH_AUDIT.metrics, {
    grade4FamilyCount: 15,
    grade8FamilyCount: 15,
    familyCount: 30,
    grade4RoundCount: 99,
    grade8RoundCount: 105,
    roundCount: 204,
    distinctSkeletonCount: 90,
    solverVerifiedCount: 204,
    safeCellCount: 6,
    supportedGameCount: 3
  });
  assert.equal(new Set(SOLVER_BACKED_PRIORITY_MATH_ROUNDS.map((round) => round.questionKey)).size, 204);
});

test('her matematik ailesinde üç iskelet, bağımsız solver/verifier ve üç tanısal yanılgı vardır', () => {
  for (const family of [...GRADE4_SOLVER_BACKED_MATH_FAMILIES, ...GRADE8_SOLVER_BACKED_MATH_FAMILIES]) {
    assert.equal(family.skeletons.length, 3, family.id);
    assert.equal(new Set(family.skeletons.map((row) => row.id)).size, 3, family.id);
    assert.equal(family.misconceptions.length, 3, family.id);
    assert.equal(new Set(family.misconceptions.map((row) => row.id)).size, 3, family.id);
    assert.equal(typeof family.solve, 'function', family.id);
    assert.equal(typeof family.verify, 'function', family.id);
    assert.equal(typeof family.generateParameters, 'function', family.id);
  }
});

test('204 matematik çıktısının öğrencinin gördüğü son yüzeyi kalite kapısından geçer', () => {
  for (const round of SOLVER_BACKED_PRIORITY_MATH_ROUNDS) {
    const grade = Number(round.targetGrade);
    const normalized = normalizeTrustedLiveRound(round, { gameId: round.gameId, grade });
    const audit = auditLiveOutputRound(normalized, { gameId: round.gameId, grade });
    assert.equal(audit.ok, true, `${round.questionKey}: ${audit.errors.join(', ')}`);
    assert.equal(round.solverProof?.verified, true, round.questionKey);
    assert.equal(round.distractorValidation?.diagnosticCount, 3, round.questionKey);
    assert.ok(round.authoredReasoningStepCount >= 4, round.questionKey);
    assert.ok(round.durationSeconds >= (grade === 8 ? 240 : 180), round.questionKey);
  }
});

test('her matematik hücresinde ardışık aile ve düşünme deneyimi tekrarı yoktur', () => {
  for (const [gameId, grade, keys] of CELLS) {
    const byKey = new Map(SOLVER_BACKED_PRIORITY_MATH_ROUNDS.map((round) => [round.questionKey, round]));
    const rounds = keys.map((key) => byKey.get(key));
    for (let index = 1; index < rounds.length; index += 1) {
      assert.notEqual(rounds[index - 1].familyId, rounds[index].familyId, `${gameId}:g${grade}: aile tekrarı ${index}`);
      assert.notEqual(rounds[index - 1].trustedExperienceType, rounds[index].trustedExperienceType, `${gameId}:g${grade}: deneyim tekrarı ${index}`);
    }
  }
});

test('canlı yayın politikası motor anahtarlarıyla birebir aynıdır', () => {
  for (const [gameId, grade, keys] of CELLS) {
    const policy = trustedLiveCell(gameId, grade);
    assert.ok(policy, `${gameId}:g${grade}: politika yok`);
    assert.deepEqual([...policy.keys], [...keys]);
    assert.match(policy.status, /^SAFE_ENGINE_/);
  }
});

test('canlı Matematik oturumları bütün motor çıktısını teslim eder ve sonra fail-closed kapanır', () => {
  for (const [gameId, grade, keys] of CELLS) {
    const seen = new Set();
    for (let pass = 0; pass < 20 && seen.size < keys.length; pass += 1) {
      const next = session(gameId, grade, 2026080800 + pass, seen);
      assert.equal(next.globalQualityAudit?.premiumBank?.fallbackToLegacy, false);
      for (const round of next.rounds) {
        assert.equal(keys.includes(round.questionKey), true, `${gameId}:g${grade}: politika dışı soru`);
        assert.equal(round.liveOutputAudit?.ok, true, round.questionKey);
        assert.equal(seen.has(round.questionKey), false, round.questionKey);
        seen.add(round.questionKey);
      }
    }
    assert.deepEqual(seen, new Set(keys), `${gameId}:g${grade}: motor bankası tam teslim edilmedi`);
    const exhausted = session(gameId, grade, 2026080899, seen);
    assert.equal(exhausted.rounds.length, 0, `${gameId}:g${grade}: eski fallback açıldı`);
    assert.equal(exhausted.globalQualityAudit?.premiumBank?.fallbackToLegacy, false);
  }
});
