import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WORD_LADDER_FAMILIES,
  ERROR_TYPES,
  analyzeLadderPath,
  edgesOk
} from '../js/content/families/word-ladder-families.js';
import {
  FAMILY_TARGET,
  SKELETON_TARGET_PER_FAMILY,
  PATH_TARGET_PER_SKELETON,
  capacityReport,
  validateFamilyDefinition,
  generateFromFamilies
} from '../js/quality/family-skeleton-engine.js';
import { validateLadder, normalizeTurkish } from '../js/engines/word-engine.js';
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

test('word-ladder aileleri yapısal olarak geçerlidir', () => {
  for (const family of WORD_LADDER_FAMILIES) {
    const result = validateFamilyDefinition(family);
    assert.ok(result.ok, `${family.familyId}: ${result.errors.join(', ')}`);
  }
});

test('word-ladder Aşama 04 hedeflerine ulaşır: 12/4/3', () => {
  const report = capacityReport(WORD_LADDER_FAMILIES);
  assert.equal(report.familyCount, 12);
  assert.ok(report.meetsSkeletonTarget);
  assert.ok(report.meetsPathTarget);
  assert.equal(report.meetsAllTargets, true);
  assert.equal(FAMILY_TARGET, 12);
  assert.equal(SKELETON_TARGET_PER_FAMILY, 4);
  assert.equal(PATH_TARGET_PER_SKELETON, 3);
});

test('familyId/skeletonId benzersizdir ve wl-* önekine sahiptir', () => {
  const familyIds = WORD_LADDER_FAMILIES.map((f) => f.familyId);
  assert.equal(new Set(familyIds).size, familyIds.length);
  assert.equal(familyIds.length, 12);
  for (const id of familyIds) assert.match(id, /^wl-/);
  const skeletonIds = WORD_LADDER_FAMILIES.flatMap((f) => f.skeletons.map((s) => s.skeletonId));
  assert.equal(new Set(skeletonIds).size, skeletonIds.length);
  assert.equal(skeletonIds.length, 48);
});

test('her kombinasyon geçerli tur üretir (wordLadder veya choice)', () => {
  let combos = 0;
  for (const family of WORD_LADDER_FAMILIES) {
    for (const skeleton of family.skeletons) {
      for (const pathId of skeleton.reasoningPathIds) {
        for (let trial = 0; trial < 3; trial += 1) {
          const round = skeleton.generate(seededRandomLike(trial * 53 + skeleton.skeletonId.length), pathId);
          combos += 1;
          assert.ok(round.questionKey?.startsWith('word-ladder:'), `${skeleton.skeletonId}/${pathId}: questionKey`);
          assert.ok(round.prompt && round.explanation, `${skeleton.skeletonId}/${pathId}: prompt/explanation`);
          if (round.kind === 'wordLadder') {
            assert.ok(round.start && round.end);
            assert.ok(Array.isArray(round.steps));
            assert.ok(Array.isArray(round.dictionary) && round.dictionary.length >= 3);
            const result = validateLadder(round.start, round.steps, round.end, round.dictionary);
            assert.ok(result.valid, `${family.familyId} select: ${result.reason} :: ${round.explanation}`);
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

test('analyzeLadderPath hata türlerini ayırır', () => {
  const dict = ['bal', 'dal', 'dil', 'dar'].map(normalizeTurkish);
  assert.equal(analyzeLadderPath('bal', ['xyz'], 'dil', dict).error, ERROR_TYPES.BAD_MID);
  assert.equal(analyzeLadderPath('xyz', [], 'dil', dict).error, ERROR_TYPES.OOV);
  assert.equal(analyzeLadderPath('bal', [], 'dil', dict).error, ERROR_TYPES.MULTI);
  assert.equal(analyzeLadderPath('bal', ['dal', 'bal'], 'dil', dict).error, ERROR_TYPES.CYCLE);
  assert.equal(analyzeLadderPath('bal', ['dal'], 'dar', dict, 'dil').error, ERROR_TYPES.MISS);
  assert.equal(analyzeLadderPath('bal', ['qal'], 'dil', dict).error, ERROR_TYPES.BAD_MID);
  assert.ok(analyzeLadderPath('bal', ['dal'], 'dil', dict).valid);
  assert.ok(edgesOk('bal', 'dal'));
  assert.ok(!edgesOk('bal', 'dil'));
});

test('alternatif geçerli yollar tek sabit yola indirgenmez', () => {
  const dict = ['kasa', 'kara', 'para', 'pare', 'kare'].map(normalizeTurkish);
  const a = analyzeLadderPath('kasa', ['kara', 'para'], 'pare', dict);
  const b = analyzeLadderPath('kasa', ['kara', 'kare'], 'pare', dict);
  assert.ok(a.valid, 'path A');
  assert.ok(b.valid, 'path B');
  assert.notEqual(a.valid && b.valid, false);
  const alt = WORD_LADDER_FAMILIES.find((f) => f.familyId === 'wl-alt-path');
  const forced = alt.skeletons.find((s) => s.skeletonId.endsWith(':forced-fact'));
  const round = forced.generate(seededRandomLike(7), 'raw-letters');
  const answer = round.options[round.answerIndex];
  assert.match(answer, /İKİSİ DE/i);
});

test('generateFromFamilies sessionLength:10 üretir', () => {
  const { rounds, audit } = generateFromFamilies(WORD_LADDER_FAMILIES, { seed: 424242, count: 10 });
  assert.equal(rounds.length, 10);
  assert.ok(audit.produced >= 10);
  for (const round of rounds) {
    assert.ok(round.familyId?.startsWith('wl-'));
    assert.ok(round.skeletonId);
    assert.ok(round.reasoningPathId);
    assert.ok(round.kind === 'wordLadder' || round.kind === 'choice');
  }
});

test('CANLI: createGameSession word-ladder yeni motor', () => {
  const profile = { id: 'wl-live-1', age: 11, grade: 5, skills: {} };
  const session = createGameSession('word-ladder', profile, 808080, { completedSessionCount: 1 });
  assert.equal(session.rounds.length, 10);
  for (const round of session.rounds) {
    assert.ok(round.familyId?.startsWith('wl-'), `familyId wl-* bekleniyor: ${round.familyId}`);
    assert.ok(round.skeletonId);
    assert.ok(round.reasoningPathId);
    assert.ok(round.kind === 'wordLadder' || round.kind === 'choice');
    const result = validateQuestionContract(round);
    assert.ok(result.ok, result.errors.join(','));
  }
  assert.equal(session.rounds[0].questionContract.reasoningPath.derivationMethod, 'EXPLICIT_MULTI_PATH');
});

test('öğrenci geçmişi aynı iskeleti erken tekrar seçmez (soğuma)', () => {
  const profile = { id: 'wl-cool-1', age: 11, grade: 5, skills: {} };
  const first = createGameSession('word-ladder', profile, 111, { completedSessionCount: 1 });
  const usedSkeletons = first.rounds.map((r) => r.skeletonId).filter(Boolean);
  const attempts = first.rounds.map((r) => ({ gameId: 'word-ladder', skeletonId: r.skeletonId, familyId: r.familyId }));
  const second = createGameSession('word-ladder', profile, 222, {
    completedSessionCount: 2,
    attempts,
    recentFamilyIds: first.rounds.map((r) => r.familyId)
  });
  const overlap = second.rounds.filter((r) => usedSkeletons.includes(r.skeletonId)).length;
  assert.ok(overlap < second.rounds.length, `soğuma zayıf: overlap=${overlap}/${second.rounds.length}`);
});

test('error-taxonomy ailesi beş hata türünü kapsar', () => {
  const fam = WORD_LADDER_FAMILIES.find((f) => f.familyId === 'wl-error-taxonomy');
  const forced = fam.skeletons.find((s) => s.skeletonId.endsWith(':forced-fact'));
  const seen = new Set();
  for (let i = 0; i < 40; i += 1) {
    const round = forced.generate(seededRandomLike(i * 17 + 3), 'raw-letters');
    seen.add(round.options[round.answerIndex]);
  }
  for (const err of Object.values(ERROR_TYPES)) {
    assert.ok(seen.has(err), `eksik hata türü: ${err}`);
  }
});
