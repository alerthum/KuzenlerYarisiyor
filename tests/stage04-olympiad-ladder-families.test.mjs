import test from 'node:test';
import assert from 'node:assert/strict';
import { OLYMPIAD_LADDER_FAMILIES } from '../js/content/families/olympiad-ladder-families.js';
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

test('olympiad-ladder aileleri yapısal olarak geçerlidir', () => {
  for (const family of OLYMPIAD_LADDER_FAMILIES) {
    const result = validateFamilyDefinition(family);
    assert.ok(result.ok, `${family.familyId}: ${result.errors.join(', ')}`);
  }
});

test('olympiad-ladder Aşama 04 hedeflerine ulaşır: 12/4/3', () => {
  const report = capacityReport(OLYMPIAD_LADDER_FAMILIES);
  assert.ok(report.familyCount >= FAMILY_TARGET);
  assert.ok(report.meetsSkeletonTarget);
  assert.ok(report.meetsPathTarget);
  assert.equal(report.meetsAllTargets, true);
});

test('familyId/skeletonId benzersizdir', () => {
  const familyIds = OLYMPIAD_LADDER_FAMILIES.map((f) => f.familyId);
  assert.equal(new Set(familyIds).size, familyIds.length);
  assert.equal(familyIds.length, 12);
  const skeletonIds = OLYMPIAD_LADDER_FAMILIES.flatMap((f) => f.skeletons.map((s) => s.skeletonId));
  assert.equal(new Set(skeletonIds).size, skeletonIds.length);
});

test('her kombinasyon geçerli choice turu üretir', () => {
  let combos = 0;
  for (const family of OLYMPIAD_LADDER_FAMILIES) {
    for (const skeleton of family.skeletons) {
      for (const pathId of skeleton.reasoningPathIds) {
        for (let trial = 0; trial < 3; trial += 1) {
          const round = skeleton.generate(seededRandomLike(trial * 41 + skeleton.skeletonId.length), pathId);
          combos += 1;
          assert.ok(round.questionKey.startsWith('olympiad-ladder:'));
          assert.equal(round.options.length, 4);
          assert.equal(new Set(round.options).size, 4);
          assert.ok(round.answerIndex >= 0 && round.answerIndex < 4, `${family.familyId}/${skeleton.skeletonId}/${pathId}`);
          assert.ok(round.prompt && round.explanation);
        }
      }
    }
  }
  assert.equal(combos, FAMILY_TARGET * SKELETON_TARGET_PER_FAMILY * PATH_TARGET_PER_SKELETON * 3);
});

test('bağımsız doğrulama: digit-reversal AB−BA = 9|A−B|', () => {
  const family = OLYMPIAD_LADDER_FAMILIES.find((f) => f.familyId === 'ol-digit-reversal');
  const skeleton = family.skeletons.find((s) => s.skeletonId.endsWith(':select-valid'));
  for (let trial = 0; trial < 12; trial += 1) {
    const round = skeleton.generate(seededRandomLike(trial * 17 + 3), 'raw-numeric');
    const abMatch = round.prompt.match(/(\d{2}) sayısının basamakları ters|İki basamaklı (\d+)/);
    const diffMatch = round.prompt.match(/(\d+)−(\d+)/);
    let AB;
    if (diffMatch) {
      AB = Number(diffMatch[1]);
    } else {
      const m = round.prompt.match(/(\d{2})/);
      assert.ok(m, round.prompt);
      AB = Number(m[1]);
    }
    const A = Math.floor(AB / 10);
    const B = AB % 10;
    const expected = String(9 * Math.abs(A - B));
    assert.equal(round.options[round.answerIndex], expected, round.prompt);
  }
});

test('bağımsız doğrulama: pigeonhole C×(W−1)+1', () => {
  const family = OLYMPIAD_LADDER_FAMILIES.find((f) => f.familyId === 'ol-pigeonhole');
  const skeleton = family.skeletons.find((s) => s.skeletonId.endsWith(':select-valid'));
  for (let trial = 0; trial < 12; trial += 1) {
    const round = skeleton.generate(seededRandomLike(trial * 23 + 7), 'raw-numeric');
    const perMatch = round.prompt.match(/en çok (\d+) bilye/);
    const wantMatch = round.prompt.match(/(\d+) tanesi aynı renkte/);
    assert.ok(perMatch && wantMatch, round.prompt);
    const C = Number(perMatch[1]);
    const W = Number(wantMatch[1]);
    const expected = String(C * (W - 1) + 1);
    assert.equal(round.options[round.answerIndex], expected);
  }
});

test('bağımsız doğrulama: set-inclusion A+B−both', () => {
  const family = OLYMPIAD_LADDER_FAMILIES.find((f) => f.familyId === 'ol-set-inclusion');
  const skeleton = family.skeletons.find((s) => s.skeletonId.endsWith(':select-valid'));
  for (let trial = 0; trial < 12; trial += 1) {
    const round = skeleton.generate(seededRandomLike(trial * 29 + 11), 'raw-numeric');
    const aMatch = round.prompt.match(/A kulübünde (\d+)/);
    const bMatch = round.prompt.match(/B kulübünde (\d+)/);
    const onlyAMatch = round.prompt.match(/Yalnız A'da (\d+)/);
    const onlyBMatch = round.prompt.match(/yalnız B'de (\d+)/);
    assert.ok(aMatch && bMatch && onlyAMatch && onlyBMatch, round.prompt);
    const aTotal = Number(aMatch[1]);
    const bTotal = Number(bMatch[1]);
    const onlyA = Number(onlyAMatch[1]);
    const onlyB = Number(onlyBMatch[1]);
    const both = aTotal - onlyA;
    assert.equal(bTotal - onlyB, both);
    const expected = String(aTotal + bTotal - both);
    assert.equal(round.options[round.answerIndex], expected);
  }
});

test('bağımsız doğrulama: reverse-machine ters işlem', () => {
  const family = OLYMPIAD_LADDER_FAMILIES.find((f) => f.familyId === 'ol-reverse-machine');
  const skeleton = family.skeletons.find((s) => s.skeletonId.endsWith(':select-valid'));
  for (let trial = 0; trial < 12; trial += 1) {
    const round = skeleton.generate(seededRandomLike(trial * 31 + 13), 'raw-numeric');
    const mulMatch = round.prompt.match(/×(\d+)/);
    const addMatch = round.prompt.match(/\+(\d+)/);
    const outMatch = round.prompt.match(/→ (\d+)/);
    assert.ok(mulMatch && addMatch && outMatch, round.prompt);
    const mul = Number(mulMatch[1]);
    const add = Number(addMatch[1]);
    const out = Number(outMatch[1]);
    const expected = String((out - add) / mul);
    assert.equal(round.options[round.answerIndex], expected);
  }
});

test('generateFromFamilies oturum içi tekrarsızlık', () => {
  const { rounds } = generateFromFamilies(OLYMPIAD_LADDER_FAMILIES, { seed: 333, count: 5 });
  assert.equal(rounds.length, 5);
  assert.equal(new Set(rounds.map((r) => r.skeletonId)).size, 5);
});

test('CANLI: createGameSession olympiad-ladder yeni motor', () => {
  const profile = { id: 'ol-live-1', age: 12, grade: 6, skills: {} };
  const session = createGameSession('olympiad-ladder', profile, 909090, { completedSessionCount: 1 });
  assert.equal(session.rounds.length, 10);
  for (const round of session.rounds) {
    assert.ok(round.familyId?.startsWith('ol-'), `familyId bekleniyor ol-*, alınan: ${round.familyId}`);
    assert.ok(round.skeletonId, 'skeletonId eksik');
    assert.ok(round.reasoningPathId, 'reasoningPathId eksik');
    const result = validateQuestionContract(round);
    assert.ok(result.ok, result.errors.join(','));
    assert.equal(round.questionContract.reasoningPath.derivationMethod, 'EXPLICIT_MULTI_PATH');
  }
});

test('CANLI: 20 ardışık oturum 0 underfill', () => {
  const profile = { id: 'ol-live-2', age: 13, grade: 8, skills: {} };
  const seenQuestionKeys = new Set();
  const attempts = [];
  let underfill = 0;
  for (let session = 0; session < 20; session += 1) {
    const result = createGameSession('olympiad-ladder', profile, 5000 + session * 37, {
      seenQuestionKeys,
      attempts,
      completedSessionCount: 1
    });
    if (result.rounds.length < 10) underfill += 1;
    for (const round of result.rounds) {
      assert.ok(round.familyId?.startsWith('ol-'), `beklenen ol-*, alınan: ${round.familyId}`);
      assert.ok(round.skeletonId);
      assert.ok(round.reasoningPathId);
      assert.ok(!seenQuestionKeys.has(round.questionKey));
      seenQuestionKeys.add(round.questionKey);
      attempts.push({ gameId: 'olympiad-ladder', familyId: round.familyId, skeletonId: round.skeletonId });
    }
  }
  assert.equal(underfill, 0);
});
