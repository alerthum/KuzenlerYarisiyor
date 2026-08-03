import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MEANING_HUNT_FAMILIES,
  MISREAD_TYPES
} from '../js/content/families/meaning-hunt-families.js';
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

test('meaning-hunt aileleri yapısal olarak geçerlidir', () => {
  for (const family of MEANING_HUNT_FAMILIES) {
    const result = validateFamilyDefinition(family);
    assert.ok(result.ok, `${family.familyId}: ${result.errors.join(', ')}`);
  }
});

test('meaning-hunt Aşama 04 hedeflerine ulaşır: 12/4/3', () => {
  const report = capacityReport(MEANING_HUNT_FAMILIES);
  assert.equal(report.familyCount, 12);
  assert.ok(report.meetsSkeletonTarget);
  assert.ok(report.meetsPathTarget);
  assert.equal(report.meetsAllTargets, true);
  assert.equal(FAMILY_TARGET, 12);
  assert.equal(SKELETON_TARGET_PER_FAMILY, 4);
  assert.equal(PATH_TARGET_PER_SKELETON, 3);
});

test('familyId/skeletonId benzersizdir ve mh-* önekine sahiptir', () => {
  const familyIds = MEANING_HUNT_FAMILIES.map((f) => f.familyId);
  assert.equal(new Set(familyIds).size, familyIds.length);
  assert.equal(familyIds.length, 12);
  for (const id of familyIds) assert.match(id, /^mh-/);
  const skeletonIds = MEANING_HUNT_FAMILIES.flatMap((f) => f.skeletons.map((s) => s.skeletonId));
  assert.equal(new Set(skeletonIds).size, skeletonIds.length);
  assert.equal(skeletonIds.length, 48);
});

test('her kombinasyon geçerli choice turu üretir', () => {
  let combos = 0;
  for (const family of MEANING_HUNT_FAMILIES) {
    for (const skeleton of family.skeletons) {
      for (const pathId of skeleton.reasoningPathIds) {
        for (let trial = 0; trial < 3; trial += 1) {
          const round = skeleton.generate(seededRandomLike(trial * 47 + skeleton.skeletonId.length), pathId);
          combos += 1;
          assert.equal(round.kind, 'choice');
          assert.ok(round.questionKey?.startsWith('meaning-hunt:'), `${skeleton.skeletonId}/${pathId}: questionKey`);
          assert.ok(round.prompt && round.explanation, `${skeleton.skeletonId}/${pathId}: prompt/explanation`);
          assert.ok(round.context, `${skeleton.skeletonId}/${pathId}: context`);
          assert.equal(round.options.length, 4, `${skeleton.skeletonId}/${pathId}: options`);
          assert.equal(new Set(round.options).size, 4, `${skeleton.skeletonId}/${pathId}: unique options :: ${round.options}`);
          assert.ok(round.answerIndex >= 0 && round.answerIndex < 4);
        }
      }
    }
  }
  assert.equal(combos, FAMILY_TARGET * SKELETON_TARGET_PER_FAMILY * PATH_TARGET_PER_SKELETON * 3);
});

test('literal-vs-figurative forced mecaz zorunluluğu', () => {
  const family = MEANING_HUNT_FAMILIES.find((f) => f.familyId === 'mh-literal-vs-figurative');
  const forced = family.skeletons.find((s) => s.skeletonId.endsWith(':forced-fact'));
  for (let trial = 0; trial < 12; trial += 1) {
    const round = forced.generate(seededRandomLike(trial * 19 + 3), 'raw-letters');
    assert.equal(round.options[round.answerIndex], 'mecaz');
  }
});

test('misread-taxonomy dört yanlış-okuma türünü kapsar', () => {
  const fam = MEANING_HUNT_FAMILIES.find((f) => f.familyId === 'mh-misread-taxonomy');
  const forced = fam.skeletons.find((s) => s.skeletonId.endsWith(':forced-fact'));
  const seen = new Set();
  for (let i = 0; i < 48; i += 1) {
    const round = forced.generate(seededRandomLike(i * 13 + 5), 'raw-letters');
    seen.add(round.options[round.answerIndex]);
  }
  for (const v of Object.values(MISREAD_TYPES)) {
    assert.ok(seen.has(v), `eksik yanlış-okuma türü: ${v}`);
  }
});

test('idiom spot sözel çeviri ihlalini yakalar', () => {
  const family = MEANING_HUNT_FAMILIES.find((f) => f.familyId === 'mh-idiom');
  const spot = family.skeletons.find((s) => s.skeletonId.endsWith(':spot-violation'));
  for (let trial = 0; trial < 10; trial += 1) {
    const round = spot.generate(seededRandomLike(trial * 23 + 7), 'raw-letters');
    const ans = round.options[round.answerIndex];
    assert.ok(ans && ans.length > 2, ans);
    assert.notEqual(ans, 'deyimsel bütün anlam');
  }
});

test('generateFromFamilies oturum içi tekrarsızlık', () => {
  const { rounds } = generateFromFamilies(MEANING_HUNT_FAMILIES, { seed: 424242, count: 5 });
  assert.equal(rounds.length, 5);
  assert.equal(new Set(rounds.map((r) => r.skeletonId)).size, 5);
  for (const r of rounds) {
    assert.ok(r.familyId?.startsWith('mh-'));
    assert.equal(r.kind, 'choice');
  }
});

test('CANLI: createGameSession meaning-hunt yeni motor', () => {
  const profile = { id: 'mh-live-1', age: 11, grade: 5, skills: {} };
  const session = createGameSession('meaning-hunt', profile, 909090, { completedSessionCount: 1 });
  assert.equal(session.rounds.length, 5);
  for (const round of session.rounds) {
    assert.ok(round.familyId?.startsWith('mh-'), `familyId mh-* bekleniyor: ${round.familyId}`);
    assert.ok(round.skeletonId);
    assert.ok(round.reasoningPathId);
    assert.equal(round.kind, 'choice');
    assert.equal(round.options.length, 4);
    const result = validateQuestionContract(round);
    assert.ok(result.ok, result.errors.join(','));
    assert.equal(round.questionContract.reasoningPath.derivationMethod, 'EXPLICIT_MULTI_PATH');
  }
});

test('öğrenci geçmişi aynı iskeleti erken tekrar seçmez', () => {
  const profile = { id: 'mh-cool-1', age: 11, grade: 5, skills: {} };
  const first = createGameSession('meaning-hunt', profile, 111, { completedSessionCount: 1 });
  const attempts = first.rounds.map((r) => ({ gameId: 'meaning-hunt', skeletonId: r.skeletonId, familyId: r.familyId }));
  const second = createGameSession('meaning-hunt', profile, 222, {
    completedSessionCount: 2,
    attempts,
    recentFamilyIds: first.rounds.map((r) => r.familyId)
  });
  const firstSkel = new Set(first.rounds.map((r) => r.skeletonId));
  const overlap = second.rounds.filter((r) => firstSkel.has(r.skeletonId));
  assert.ok(overlap.length < second.rounds.length, 'cooling sonrası tüm iskeletler aynı kalmamalı');
  assert.ok(second.rounds.every((r) => r.familyId?.startsWith('mh-')));
});
