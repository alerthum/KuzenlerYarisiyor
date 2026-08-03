import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FORBIDDEN_STORY_FAMILIES,
  VIOLATION_TYPES,
  isSafe
} from '../js/content/families/forbidden-story-families.js';
import {
  FAMILY_TARGET,
  SKELETON_TARGET_PER_FAMILY,
  PATH_TARGET_PER_SKELETON,
  capacityReport,
  validateFamilyDefinition,
  generateFromFamilies
} from '../js/quality/family-skeleton-engine.js';
import { containsForbiddenLetter } from '../js/engines/word-engine.js';
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

function extractLetter(prompt) {
  const m = String(prompt).match(/[“"]([A-ZÇĞİÖŞÜa-zçğıöşü])[”"]/);
  return m ? m[1].toLocaleLowerCase('tr-TR') : null;
}

test('forbidden-story aileleri yapısal olarak geçerlidir', () => {
  for (const family of FORBIDDEN_STORY_FAMILIES) {
    const result = validateFamilyDefinition(family);
    assert.ok(result.ok, `${family.familyId}: ${result.errors.join(', ')}`);
  }
});

test('forbidden-story Aşama 04 hedeflerine ulaşır: 12/4/3', () => {
  const report = capacityReport(FORBIDDEN_STORY_FAMILIES);
  assert.equal(report.familyCount, 12);
  assert.ok(report.meetsSkeletonTarget);
  assert.ok(report.meetsPathTarget);
  assert.equal(report.meetsAllTargets, true);
  assert.equal(FAMILY_TARGET, 12);
  assert.equal(SKELETON_TARGET_PER_FAMILY, 4);
  assert.equal(PATH_TARGET_PER_SKELETON, 3);
});

test('familyId/skeletonId benzersizdir ve fs-* önekine sahiptir', () => {
  const familyIds = FORBIDDEN_STORY_FAMILIES.map((f) => f.familyId);
  assert.equal(new Set(familyIds).size, familyIds.length);
  assert.equal(familyIds.length, 12);
  for (const id of familyIds) assert.match(id, /^fs-/);
  const skeletonIds = FORBIDDEN_STORY_FAMILIES.flatMap((f) => f.skeletons.map((s) => s.skeletonId));
  assert.equal(new Set(skeletonIds).size, skeletonIds.length);
  assert.equal(skeletonIds.length, 48);
});

test('her kombinasyon geçerli tur üretir (story veya choice)', () => {
  let combos = 0;
  for (const family of FORBIDDEN_STORY_FAMILIES) {
    for (const skeleton of family.skeletons) {
      for (const pathId of skeleton.reasoningPathIds) {
        for (let trial = 0; trial < 3; trial += 1) {
          const round = skeleton.generate(seededRandomLike(trial * 53 + skeleton.skeletonId.length), pathId);
          combos += 1;
          assert.ok(round.questionKey?.startsWith('forbidden-story:'), `${skeleton.skeletonId}/${pathId}: questionKey`);
          assert.ok(round.prompt && round.explanation, `${skeleton.skeletonId}/${pathId}: prompt/explanation`);
          if (round.kind === 'story') {
            assert.ok(round.forbiddenLetter);
            assert.ok(round.minSentences >= 2);
            assert.ok(round.minUniqueWords >= 9);
          } else {
            assert.equal(round.kind, 'choice');
            assert.equal(round.options.length, 4);
            assert.equal(new Set(round.options).size, 4);
            assert.ok(round.answerIndex >= 0 && round.answerIndex < 4);
            assert.ok(round.context);
          }
        }
      }
    }
  }
  assert.equal(combos, FAMILY_TARGET * SKELETON_TARGET_PER_FAMILY * PATH_TARGET_PER_SKELETON * 3);
});

test('vowel/consonant/soft ailelerinde forced güvenli, spot güvensiz', () => {
  for (const familyId of ['fs-vowel-ban', 'fs-consonant-ban', 'fs-soft-letter']) {
    const family = FORBIDDEN_STORY_FAMILIES.find((f) => f.familyId === familyId);
    const forced = family.skeletons.find((s) => s.skeletonId.endsWith(':forced-fact'));
    const spot = family.skeletons.find((s) => s.skeletonId.endsWith(':spot-violation'));
    for (let trial = 0; trial < 12; trial += 1) {
      const forcedRound = forced.generate(seededRandomLike(trial * 19 + 1), 'raw-letters');
      const spotRound = spot.generate(seededRandomLike(trial * 19 + 2), 'raw-letters');
      const forcedLetter = extractLetter(forcedRound.prompt);
      const spotLetter = extractLetter(spotRound.prompt);
      assert.ok(forcedLetter, `${familyId}: forced harf çıkarılamadı :: ${forcedRound.prompt}`);
      assert.ok(spotLetter, `${familyId}: spot harf çıkarılamadı :: ${spotRound.prompt}`);
      const forcedAns = forcedRound.options[forcedRound.answerIndex];
      const spotAns = spotRound.options[spotRound.answerIndex];
      assert.ok(isSafe(forcedAns, forcedLetter), `${familyId}: forced "${forcedAns}" letter=${forcedLetter}`);
      assert.ok(!isSafe(spotAns, spotLetter), `${familyId}: spot "${spotAns}" letter=${spotLetter}`);
      assert.equal(containsForbiddenLetter(forcedAns, forcedLetter), false);
      assert.equal(containsForbiddenLetter(spotAns, spotLetter), true);
    }
  }
});

test('violation-taxonomy dört ihlal türünü kapsar', () => {
  const fam = FORBIDDEN_STORY_FAMILIES.find((f) => f.familyId === 'fs-violation-taxonomy');
  const forced = fam.skeletons.find((s) => s.skeletonId.endsWith(':forced-fact'));
  const seen = new Set();
  for (let i = 0; i < 40; i += 1) {
    const round = forced.generate(seededRandomLike(i * 13 + 5), 'raw-letters');
    seen.add(round.options[round.answerIndex]);
  }
  for (const v of Object.values(VIOLATION_TYPES)) {
    assert.ok(seen.has(v), `eksik ihlal türü: ${v}`);
  }
});

test('generateFromFamilies count:1 çalışır', () => {
  const { rounds, audit } = generateFromFamilies(FORBIDDEN_STORY_FAMILIES, { seed: 515151, count: 1 });
  assert.equal(rounds.length, 1);
  assert.ok(audit.produced >= 1);
  assert.ok(rounds[0].familyId?.startsWith('fs-'));
  assert.ok(rounds[0].kind === 'story' || rounds[0].kind === 'choice');
});

test('CANLI: createGameSession forbidden-story yeni motor', () => {
  const profile = { id: 'fs-live-1', age: 11, grade: 5, skills: {} };
  const session = createGameSession('forbidden-story', profile, 909090, { completedSessionCount: 1 });
  assert.equal(session.rounds.length, 1);
  const round = session.rounds[0];
  assert.ok(round.familyId?.startsWith('fs-'), `familyId fs-* bekleniyor: ${round.familyId}`);
  assert.ok(round.skeletonId);
  assert.ok(round.reasoningPathId);
  assert.ok(round.kind === 'story' || round.kind === 'choice');
  const result = validateQuestionContract(round);
  assert.ok(result.ok, result.errors.join(','));
  assert.equal(round.questionContract.reasoningPath.derivationMethod, 'EXPLICIT_MULTI_PATH');
});

test('öğrenci geçmişi aynı iskeleti erken tekrar seçmez', () => {
  const profile = { id: 'fs-cool-1', age: 11, grade: 5, skills: {} };
  const first = createGameSession('forbidden-story', profile, 111, { completedSessionCount: 1 });
  const attempts = first.rounds.map((r) => ({ gameId: 'forbidden-story', skeletonId: r.skeletonId, familyId: r.familyId }));
  const second = createGameSession('forbidden-story', profile, 222, {
    completedSessionCount: 2,
    attempts,
    recentFamilyIds: first.rounds.map((r) => r.familyId)
  });
  assert.notEqual(second.rounds[0].skeletonId, first.rounds[0].skeletonId);
});
