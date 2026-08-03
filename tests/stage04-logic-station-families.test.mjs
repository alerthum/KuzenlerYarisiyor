import test from 'node:test';
import assert from 'node:assert/strict';
import { LOGIC_STATION_FAMILIES } from '../js/content/families/logic-station-families.js';
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

test('logic-station aileleri yapısal olarak geçerlidir', () => {
  for (const family of LOGIC_STATION_FAMILIES) {
    const result = validateFamilyDefinition(family);
    assert.ok(result.ok, `${family.familyId}: ${result.errors.join(', ')}`);
  }
});

test('logic-station Aşama 04 hedeflerine ulaşır: 12/4/3', () => {
  const report = capacityReport(LOGIC_STATION_FAMILIES);
  assert.ok(report.familyCount >= FAMILY_TARGET);
  assert.ok(report.meetsSkeletonTarget);
  assert.ok(report.meetsPathTarget);
  assert.equal(report.meetsAllTargets, true);
});

test('familyId/skeletonId benzersizdir', () => {
  const familyIds = LOGIC_STATION_FAMILIES.map((f) => f.familyId);
  assert.equal(new Set(familyIds).size, familyIds.length);
  assert.equal(familyIds.length, 12);
  const skeletonIds = LOGIC_STATION_FAMILIES.flatMap((f) => f.skeletons.map((s) => s.skeletonId));
  assert.equal(new Set(skeletonIds).size, skeletonIds.length);
});

test('her kombinasyon geçerli choice turu üretir', () => {
  let combos = 0;
  for (const family of LOGIC_STATION_FAMILIES) {
    for (const skeleton of family.skeletons) {
      for (const pathId of skeleton.reasoningPathIds) {
        for (let trial = 0; trial < 3; trial += 1) {
          const round = skeleton.generate(seededRandomLike(trial * 41 + skeleton.skeletonId.length), pathId);
          combos += 1;
          assert.ok(round.questionKey.startsWith('logic-station:'));
          assert.equal(round.options.length, 4);
          assert.equal(new Set(round.options).size, 4);
          assert.ok(round.answerIndex >= 0 && round.answerIndex < 4);
          assert.ok(round.prompt && round.explanation);
        }
      }
    }
  }
  assert.equal(combos, FAMILY_TARGET * SKELETON_TARGET_PER_FAMILY * PATH_TARGET_PER_SKELETON * 3);
});

test('bağımsız doğrulama: direction-route net yer değiştirme', () => {
  const family = LOGIC_STATION_FAMILIES.find((f) => f.familyId === 'ls-direction-route');
  const skeleton = family.skeletons.find((s) => s.skeletonId.endsWith(':select-valid'));
  for (let trial = 0; trial < 12; trial += 1) {
    const round = skeleton.generate(seededRandomLike(trial * 17 + 3), 'raw-clues');
    const match = round.prompt.match(/(\d+) kuzey, (\d+) doğu, (\d+) güney/);
    assert.ok(match, round.prompt);
    const [, n, e, s] = match.map(Number);
    const netN = n - s;
    const expected = `D${e}K${netN}`;
    assert.equal(round.options[round.answerIndex], expected);
  }
});

test('bağımsız doğrulama: two-step-code dönüşüm', () => {
  const family = LOGIC_STATION_FAMILIES.find((f) => f.familyId === 'ls-two-step-code');
  const skeleton = family.skeletons.find((s) => s.skeletonId.endsWith(':select-valid'));
  for (let trial = 0; trial < 12; trial += 1) {
    const round = skeleton.generate(seededRandomLike(trial * 19 + 5), 'raw-clues');
    const startMatch = round.prompt.match(/Başlangıç: (\d+)/);
    const addMatch = round.prompt.match(/Adım 1: (\d+) ekle/);
    const mulMatch = round.prompt.match(/sonucu (\d+) ile çarp/);
    assert.ok(startMatch && addMatch && mulMatch, round.prompt);
    const start = Number(startMatch[1]);
    const add = Number(addMatch[1]);
    const mul = Number(mulMatch[1]);
    const independent = String((start + add) * mul);
    assert.equal(round.options[round.answerIndex], independent);
  }
});

test('binary-switches A,B,A sırası 2 ve 3 açık', () => {
  const family = LOGIC_STATION_FAMILIES.find((f) => f.familyId === 'ls-binary-switches');
  const skeleton = family.skeletons.find((s) => s.skeletonId.endsWith(':forced-fact'));
  for (let trial = 0; trial < 6; trial += 1) {
    const round = skeleton.generate(seededRandomLike(trial * 11 + 1), 'raw-clues');
    assert.equal(round.options[round.answerIndex], '2 ve 3');
  }
});

test('generateFromFamilies oturum içi tekrarsızlık', () => {
  const { rounds } = generateFromFamilies(LOGIC_STATION_FAMILIES, { seed: 222, count: 5 });
  assert.equal(rounds.length, 5);
  assert.equal(new Set(rounds.map((r) => r.skeletonId)).size, 5);
});

test('CANLI: createGameSession logic-station yeni motor', () => {
  const profile = { id: 'ls-live-1', age: 11, grade: 5, skills: {} };
  // completedSessionCount>0: GOLD showcase enjeksiyonunu atla; Stage 04 aile motorunu ölç.
  const session = createGameSession('logic-station', profile, 808080, { completedSessionCount: 1 });
  assert.equal(session.rounds.length, 8);
  for (const round of session.rounds) {
    assert.ok(round.familyId?.startsWith('ls-'), `familyId bekleniyor ls-*, alınan: ${round.familyId}`);
    assert.ok(round.skeletonId, 'skeletonId eksik');
    assert.ok(round.reasoningPathId, 'reasoningPathId eksik');
    const result = validateQuestionContract(round);
    assert.ok(result.ok, result.errors.join(','));
    assert.equal(round.questionContract.reasoningPath.derivationMethod, 'EXPLICIT_MULTI_PATH');
  }
});

test('CANLI: 20 ardışık oturum 0 underfill', () => {
  const profile = { id: 'ls-live-2', age: 13, grade: 8, skills: {} };
  const seenQuestionKeys = new Set();
  const attempts = [];
  let underfill = 0;
  for (let session = 0; session < 20; session += 1) {
    const result = createGameSession('logic-station', profile, 4000 + session * 31, {
      seenQuestionKeys,
      attempts,
      completedSessionCount: 1
    });
    if (result.rounds.length < 8) underfill += 1;
    for (const round of result.rounds) {
      assert.ok(round.familyId?.startsWith('ls-'), `beklenen ls-*, alınan: ${round.familyId}`);
      assert.ok(round.skeletonId);
      assert.ok(round.reasoningPathId);
      assert.ok(!seenQuestionKeys.has(round.questionKey));
      seenQuestionKeys.add(round.questionKey);
      attempts.push({ gameId: 'logic-station', familyId: round.familyId, skeletonId: round.skeletonId });
    }
  }
  assert.equal(underfill, 0);
});
