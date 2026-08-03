import test from 'node:test';
import assert from 'node:assert/strict';
import { ERROR_DETECTIVE_FAMILIES } from '../js/content/families/error-detective-families.js';
import {
  FAMILY_TARGET,
  SKELETON_TARGET_PER_FAMILY,
  PATH_TARGET_PER_SKELETON,
  capacityReport,
  validateFamilyDefinition,
  generateFromFamilies
} from '../js/quality/family-skeleton-engine.js';
import { createGameSession } from '../js/games/registry.js';
import { validateQuestionContract } from '../js/quality/question-contract-v11.js';

function seededRandomLike(seedValue) {
  let seed = Number(seedValue) || 1;
  return () => {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let result = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    result = (result + Math.imul(result ^ (result >>> 7), 61 | result)) ^ result;
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

test('error-detective aileleri yapısal olarak geçerlidir', () => {
  for (const family of ERROR_DETECTIVE_FAMILIES) {
    const result = validateFamilyDefinition(family);
    assert.ok(result.ok, `${family.familyId}: ${result.errors.join(', ')}`);
  }
});

test('error-detective Aşama 04 hedeflerine ulaşır: 12/4/3', () => {
  const report = capacityReport(ERROR_DETECTIVE_FAMILIES);
  assert.ok(report.familyCount >= FAMILY_TARGET);
  assert.ok(report.meetsSkeletonTarget);
  assert.ok(report.meetsPathTarget);
  assert.equal(report.meetsAllTargets, true);
});

test('familyId/skeletonId benzersizdir', () => {
  const familyIds = ERROR_DETECTIVE_FAMILIES.map((f) => f.familyId);
  assert.equal(new Set(familyIds).size, familyIds.length);
  const skeletonIds = ERROR_DETECTIVE_FAMILIES.flatMap((f) => f.skeletons.map((s) => s.skeletonId));
  assert.equal(new Set(skeletonIds).size, skeletonIds.length);
});

test('her kombinasyon geçerli choice turu üretir', () => {
  let combos = 0;
  for (const family of ERROR_DETECTIVE_FAMILIES) {
    for (const skeleton of family.skeletons) {
      for (const pathId of skeleton.reasoningPathIds) {
        for (let trial = 0; trial < 3; trial += 1) {
          const round = skeleton.generate(seededRandomLike(trial * 41 + skeleton.skeletonId.length), pathId);
          combos += 1;
          assert.ok(round.questionKey);
          assert.equal(round.options.length, 4);
          assert.equal(new Set(round.options).size, 4);
          assert.ok(round.answerIndex >= 0 && round.answerIndex < 4);
          assert.ok(round.prompt && round.explanation);
        }
      }
    }
  }
  const expected = ERROR_DETECTIVE_FAMILIES.reduce((sum, family) => sum + family.skeletons.reduce((inner, skeleton) => inner + skeleton.reasoningPathIds.length * 3, 0), 0);
  assert.equal(combos, expected);
});

test('bağımsız doğrulama: operator-priority identify-wrong-result', () => {
  const family = ERROR_DETECTIVE_FAMILIES.find((f) => f.familyId === 'ed-operator-priority-ltr');
  const skeleton = family.skeletons.find((s) => s.skeletonId.endsWith(':identify-wrong-result'));
  for (let trial = 0; trial < 12; trial += 1) {
    const round = skeleton.generate(seededRandomLike(trial * 17 + 2), 'raw-steps');
    const match = round.prompt.match(/(\d+)\+(\d+)×(\d+)/);
    assert.ok(match, round.prompt);
    const [, a, b, c] = match.map(Number);
    const independent = a + b * c;
    assert.equal(Number(round.options[round.answerIndex]), independent);
  }
});

test('bağımsız doğrulama: perimeter-area identify-wrong-result', () => {
  const family = ERROR_DETECTIVE_FAMILIES.find((f) => f.familyId === 'ed-perimeter-area-swap');
  const skeleton = family.skeletons.find((s) => s.skeletonId.endsWith(':identify-wrong-result'));
  for (let trial = 0; trial < 12; trial += 1) {
    const round = skeleton.generate(seededRandomLike(trial * 19 + 5), 'raw-steps');
    const match = round.prompt.match(/(\d+)×(\d+) dikdörtgen/);
    assert.ok(match, round.prompt);
    const [, w, h] = match.map(Number);
    const independent = 2 * (w + h);
    assert.equal(Number(round.options[round.answerIndex]), independent);
  }
});

test('find-first-error-step cevap indeksi adım seçenekleriyle uyumludur', () => {
  const family = ERROR_DETECTIVE_FAMILIES.find((f) => f.familyId === 'ed-addition-carry-forgotten');
  const skeleton = family.skeletons.find((s) => s.skeletonId.endsWith(':find-first-error-step'));
  for (let trial = 0; trial < 8; trial += 1) {
    const round = skeleton.generate(seededRandomLike(trial * 7 + 1), 'raw-steps');
    assert.ok(Array.isArray(round.steps) && round.steps.length === 4);
    assert.match(round.options[round.answerIndex], /^\d+\. /);
  }
});

test('generateFromFamilies oturum içi tekrarsızlık', () => {
  const { rounds } = generateFromFamilies(ERROR_DETECTIVE_FAMILIES, { seed: 111, count: 5 });
  assert.equal(rounds.length, 5);
  assert.equal(new Set(rounds.map((r) => r.familyId)).size, 5);
});

test('CANLI: createGameSession error-detective yeni motor', () => {
  const profile = { id: 'ed-live-1', age: 11, grade: 5, skills: {} };
  const session = createGameSession('error-detective', profile, 707070);
  assert.equal(session.rounds.length, 5);
  for (const round of session.rounds) {
    assert.equal(round.premiumPilot, true);
    assert.ok(round.familyId?.startsWith('pilot-math-'));
    const result = validateQuestionContract(round);
    assert.ok(result.ok, result.errors.join(','));
    assert.equal(round.questionContract.reasoningPath.derivationMethod, 'EXPLICIT_MULTI_PATH');
  }
});

test('CANLI: ilk iki pilot oturumu 0 questionKey tekrar ve 0 underfill üretir', () => {
  const profile = { id: 'ed-live-2', age: 13, grade: 8, skills: {} };
  const seenQuestionKeys = new Set();
  const attempts = [];
  for (let session = 0; session < 2; session += 1) {
    const result = createGameSession('error-detective', profile, 3000 + session * 29, {
      seenQuestionKeys,
      attempts,
      completedSessionCount: session + 1,
      currentSessionIndex: session + 1
    });
    assert.equal(result.rounds.length, 5);
    for (const round of result.rounds) {
      assert.equal(round.premiumPilot, true);
      assert.ok(!seenQuestionKeys.has(round.questionKey));
      seenQuestionKeys.add(round.questionKey);
      attempts.push({ gameId: 'error-detective', questionKey: round.questionKey, familyId: round.familyId, skeletonId: round.skeletonId, sessionIndex: session + 1 });
    }
  }
});
