import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SCIENCE_LAB_FAMILIES,
  SL_MISREAD
} from '../js/content/families/science-lab-families.js';
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

test('science-lab aileleri yapısal olarak geçerlidir', () => {
  for (const family of SCIENCE_LAB_FAMILIES) {
    const result = validateFamilyDefinition(family);
    assert.ok(result.ok, `${family.familyId}: ${result.errors.join(', ')}`);
  }
});

test('science-lab Aşama 04 hedeflerine ulaşır: 12/4/3', () => {
  const report = capacityReport(SCIENCE_LAB_FAMILIES);
  assert.equal(report.familyCount, 12);
  assert.ok(report.meetsSkeletonTarget);
  assert.ok(report.meetsPathTarget);
  assert.equal(report.meetsAllTargets, true);
  assert.equal(FAMILY_TARGET, 12);
  assert.equal(SKELETON_TARGET_PER_FAMILY, 4);
  assert.equal(PATH_TARGET_PER_SKELETON, 3);
});

test('familyId/skeletonId benzersizdir ve sl-* önekine sahiptir', () => {
  const familyIds = SCIENCE_LAB_FAMILIES.map((f) => f.familyId);
  assert.equal(new Set(familyIds).size, familyIds.length);
  assert.equal(familyIds.length, 12);
  for (const id of familyIds) assert.match(id, /^sl-/);
  const skeletonIds = SCIENCE_LAB_FAMILIES.flatMap((f) => f.skeletons.map((s) => s.skeletonId));
  assert.equal(new Set(skeletonIds).size, skeletonIds.length);
  assert.equal(skeletonIds.length, 48);
});

test('her kombinasyon geçerli choice turu üretir', () => {
  let combos = 0;
  for (const family of SCIENCE_LAB_FAMILIES) {
    for (const skeleton of family.skeletons) {
      for (const pathId of skeleton.reasoningPathIds) {
        for (let trial = 0; trial < 3; trial += 1) {
          const round = skeleton.generate(seededRandomLike(trial * 47 + skeleton.skeletonId.length), pathId);
          combos += 1;
          assert.equal(round.kind, 'choice');
          assert.ok(round.questionKey?.startsWith('science-lab:'));
          assert.ok(round.prompt && round.explanation);
          assert.ok(round.context);
          assert.equal(round.options.length, 4);
          assert.equal(new Set(round.options).size, 4, `${skeleton.skeletonId}: ${round.options}`);
          assert.ok(round.answerIndex >= 0 && round.answerIndex < 4);
        }
      }
    }
  }
  assert.equal(combos, FAMILY_TARGET * SKELETON_TARGET_PER_FAMILY * PATH_TARGET_PER_SKELETON * 3);
});

test('phase-change forced HAL-DEGISTIR zorunluluğu', () => {
  const family = SCIENCE_LAB_FAMILIES.find((f) => f.familyId === 'sl-phase-change');
  const forced = family.skeletons.find((s) => s.skeletonId.endsWith(':forced-fact'));
  for (let trial = 0; trial < 10; trial += 1) {
    const round = forced.generate(seededRandomLike(trial * 19 + 3), 'raw-letters');
    assert.equal(round.options[round.answerIndex], 'HAL-DEGISTIR');
  }
});

test('misread-taxonomy dört yanlış-okuma türünü kapsar', () => {
  const fam = SCIENCE_LAB_FAMILIES.find((f) => f.familyId === 'sl-misread-taxonomy');
  const forced = fam.skeletons.find((s) => s.skeletonId.endsWith(':forced-fact'));
  const seen = new Set();
  for (let i = 0; i < 48; i += 1) {
    const round = forced.generate(seededRandomLike(i * 13 + 5), 'raw-letters');
    seen.add(round.options[round.answerIndex]);
  }
  for (const v of Object.values(SL_MISREAD)) {
    assert.ok(seen.has(v), `eksik: ${v}`);
  }
});

test('generateFromFamilies sessionLength:6 üretir', () => {
  const { rounds, audit } = generateFromFamilies(SCIENCE_LAB_FAMILIES, { seed: 424242, count: 6 });
  assert.equal(rounds.length, 6);
  assert.ok(audit.produced >= 6);
  for (const round of rounds) {
    assert.ok(round.familyId?.startsWith('sl-'));
    assert.equal(round.kind, 'choice');
  }
});

test('CANLI: createGameSession science-lab yeni motor', () => {
  const profile = { id: 'sl-live-1', age: 12, grade: 6, skills: {} };
  const session = createGameSession('science-lab', profile, 808080, { completedSessionCount: 1 });
  assert.equal(session.rounds.length, 6);
  for (const round of session.rounds) {
    assert.ok(round.familyId?.startsWith('sl-'), `familyId sl-* bekleniyor: ${round.familyId}`);
    assert.ok(round.skeletonId);
    assert.ok(round.reasoningPathId);
    assert.equal(round.kind, 'choice');
    const result = validateQuestionContract(round);
    assert.ok(result.ok, result.errors.join(','));
  }
  assert.equal(session.rounds[0].questionContract.reasoningPath.derivationMethod, 'EXPLICIT_MULTI_PATH');
});

test('öğrenci geçmişi aynı iskeleti erken tekrar seçmez', () => {
  const profile = { id: 'sl-cool-1', age: 12, grade: 6, skills: {} };
  const first = createGameSession('science-lab', profile, 111, { completedSessionCount: 1 });
  const used = new Set(first.rounds.map((r) => r.skeletonId).filter(Boolean));
  const attempts = first.rounds.map((r) => ({ gameId: 'science-lab', skeletonId: r.skeletonId, familyId: r.familyId }));
  const second = createGameSession('science-lab', profile, 222, {
    completedSessionCount: 2,
    attempts,
    recentFamilyIds: first.rounds.map((r) => r.familyId)
  });
  const overlap = second.rounds.filter((r) => used.has(r.skeletonId)).length;
  assert.ok(overlap < second.rounds.length, `soğuma zayıf: ${overlap}/${second.rounds.length}`);
});

test('light-source-reflector spot yanlış etiketi yakalar', () => {
  const fam = SCIENCE_LAB_FAMILIES.find((f) => f.familyId === 'sl-light-source-reflector');
  const spot = fam.skeletons.find((s) => s.skeletonId.endsWith(':spot-violation'));
  for (let i = 0; i < 8; i += 1) {
    const round = spot.generate(seededRandomLike(i * 7 + 2), 'raw-letters');
    const ans = round.options[round.answerIndex];
    assert.ok(ans === 'kaynak' || ans === 'yansitici', `beklenmeyen: ${ans}`);
  }
});
