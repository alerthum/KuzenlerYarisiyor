import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SOCIAL_MAP_SKILLS_FAMILIES,
  SM_MISREAD
} from '../js/content/families/social-map-skills-families.js';
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

test('social-map-skills aileleri yapısal olarak geçerlidir', () => {
  for (const family of SOCIAL_MAP_SKILLS_FAMILIES) {
    const result = validateFamilyDefinition(family);
    assert.ok(result.ok, `${family.familyId}: ${result.errors.join(', ')}`);
  }
});

test('social-map-skills Aşama 04 hedeflerine ulaşır: 12/4/3', () => {
  const report = capacityReport(SOCIAL_MAP_SKILLS_FAMILIES);
  assert.equal(report.familyCount, 12);
  assert.ok(report.meetsSkeletonTarget);
  assert.ok(report.meetsPathTarget);
  assert.equal(report.meetsAllTargets, true);
  assert.equal(FAMILY_TARGET, 12);
  assert.equal(SKELETON_TARGET_PER_FAMILY, 4);
  assert.equal(PATH_TARGET_PER_SKELETON, 3);
});

test('familyId/skeletonId benzersizdir ve sm-* önekine sahiptir', () => {
  const familyIds = SOCIAL_MAP_SKILLS_FAMILIES.map((f) => f.familyId);
  assert.equal(new Set(familyIds).size, familyIds.length);
  assert.equal(familyIds.length, 12);
  for (const id of familyIds) assert.match(id, /^sm-/);
  const skeletonIds = SOCIAL_MAP_SKILLS_FAMILIES.flatMap((f) => f.skeletons.map((s) => s.skeletonId));
  assert.equal(new Set(skeletonIds).size, skeletonIds.length);
  assert.equal(skeletonIds.length, 48);
});

test('her kombinasyon geçerli choice turu üretir', () => {
  let combos = 0;
  for (const family of SOCIAL_MAP_SKILLS_FAMILIES) {
    for (const skeleton of family.skeletons) {
      for (const pathId of skeleton.reasoningPathIds) {
        for (let trial = 0; trial < 3; trial += 1) {
          const round = skeleton.generate(seededRandomLike(trial * 47 + skeleton.skeletonId.length), pathId);
          combos += 1;
          assert.equal(round.kind, 'choice');
          assert.ok(round.questionKey?.startsWith('social-map-skills:'), `${skeleton.skeletonId}/${pathId}: questionKey`);
          assert.ok(round.prompt && round.explanation);
          assert.ok(round.context);
          assert.equal(round.options.length, 4, `${skeleton.skeletonId}: ${round.options}`);
          assert.equal(new Set(round.options).size, 4, `${skeleton.skeletonId}: ${round.options}`);
          assert.ok(round.answerIndex >= 0 && round.answerIndex < 4);
        }
      }
    }
  }
  assert.equal(combos, FAMILY_TARGET * SKELETON_TARGET_PER_FAMILY * PATH_TARGET_PER_SKELETON * 3);
});

test('cardinal-direction forced yon zorunluluğu', () => {
  const family = SOCIAL_MAP_SKILLS_FAMILIES.find((f) => f.familyId === 'sm-cardinal-direction');
  const forced = family.skeletons.find((s) => s.skeletonId.endsWith(':forced-fact'));
  for (let trial = 0; trial < 10; trial += 1) {
    const round = forced.generate(seededRandomLike(trial * 19 + 3), 'raw-letters');
    assert.equal(round.options[round.answerIndex], 'yon');
  }
});

test('misread-taxonomy dört yanlış-okuma türünü kapsar', () => {
  const fam = SOCIAL_MAP_SKILLS_FAMILIES.find((f) => f.familyId === 'sm-misread-taxonomy');
  const forced = fam.skeletons.find((s) => s.skeletonId.endsWith(':forced-fact'));
  const seen = new Set();
  for (let i = 0; i < 48; i += 1) {
    const round = forced.generate(seededRandomLike(i * 13 + 5), 'raw-letters');
    seen.add(round.options[round.answerIndex]);
  }
  for (const v of Object.values(SM_MISREAD)) {
    assert.ok(seen.has(v), `eksik: ${v}`);
  }
});

test('generateFromFamilies sessionLength:10 üretir', () => {
  const { rounds, audit } = generateFromFamilies(SOCIAL_MAP_SKILLS_FAMILIES, { seed: 424242, count: 10 });
  assert.equal(rounds.length, 10);
  assert.ok(audit.produced >= 10);
  for (const round of rounds) {
    assert.ok(round.familyId?.startsWith('sm-'));
    assert.equal(round.kind, 'choice');
  }
});

test('CANLI: createGameSession social-map-skills yeni motor (sessionLength 10)', () => {
  const profile = { id: 'sm-live-1', age: 11, grade: 5, skills: {} };
  const session = createGameSession('social-map-skills', profile, 808080, { completedSessionCount: 1 });
  assert.equal(session.rounds.length, 10);
  const familyRounds = session.rounds.filter((r) => r.familyId?.startsWith('sm-') && r.skeletonId);
  assert.ok(familyRounds.length >= 8, `sm-* çoğunluk bekleniyor, alınan: ${session.rounds.map((r) => r.familyId).join(',')}`);
  for (const round of familyRounds) {
    assert.ok(round.skeletonId);
    assert.ok(round.reasoningPathId);
    assert.equal(round.kind, 'choice');
    const result = validateQuestionContract(round);
    assert.ok(result.ok, result.errors.join(','));
  }
  assert.equal(familyRounds[0].questionContract.reasoningPath.derivationMethod, 'EXPLICIT_MULTI_PATH');
});

test('öğrenci geçmişi aynı iskeleti erken tekrar seçmez', () => {
  const profile = { id: 'sm-cool-1', age: 11, grade: 5, skills: {} };
  const first = createGameSession('social-map-skills', profile, 111, { completedSessionCount: 1 });
  const used = new Set(first.rounds.map((r) => r.skeletonId).filter(Boolean));
  const attempts = first.rounds.map((r) => ({ gameId: 'social-map-skills', skeletonId: r.skeletonId, familyId: r.familyId }));
  const second = createGameSession('social-map-skills', profile, 222, {
    completedSessionCount: 2,
    attempts,
    recentFamilyIds: first.rounds.map((r) => r.familyId)
  });
  const overlap = second.rounds.filter((r) => used.has(r.skeletonId)).length;
  assert.ok(overlap < second.rounds.length, `soğuma zayıf: ${overlap}/${second.rounds.length}`);
});

test('scale-distance spot ölçek ihlalini yakalar', () => {
  const fam = SOCIAL_MAP_SKILLS_FAMILIES.find((f) => f.familyId === 'sm-scale-distance');
  const spot = fam.skeletons.find((s) => s.skeletonId.endsWith(':spot-violation'));
  const traps = new Set(['3 km', '4 km', '6 km', '20 km']);
  for (let i = 0; i < 12; i += 1) {
    const round = spot.generate(seededRandomLike(i * 7 + 2), 'raw-letters');
    const ans = round.options[round.answerIndex];
    assert.ok(traps.has(ans), `spot cevabı ölçek ihlali olmalı: ${ans}`);
  }
});
