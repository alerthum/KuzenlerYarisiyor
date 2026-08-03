import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ENGLISH_SENTENCE_BUILDER_FAMILIES,
  ESB_MISORDER
} from '../js/content/families/english-sentence-builder-families.js';
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

test('english-sentence-builder aileleri yapısal olarak geçerlidir', () => {
  for (const family of ENGLISH_SENTENCE_BUILDER_FAMILIES) {
    const result = validateFamilyDefinition(family);
    assert.ok(result.ok, `${family.familyId}: ${result.errors.join(', ')}`);
  }
});

test('english-sentence-builder Aşama 04 hedeflerine ulaşır: 12/4/3', () => {
  const report = capacityReport(ENGLISH_SENTENCE_BUILDER_FAMILIES);
  assert.equal(report.familyCount, 12);
  assert.ok(report.meetsSkeletonTarget);
  assert.ok(report.meetsPathTarget);
  assert.equal(report.meetsAllTargets, true);
  assert.equal(FAMILY_TARGET, 12);
  assert.equal(SKELETON_TARGET_PER_FAMILY, 4);
  assert.equal(PATH_TARGET_PER_SKELETON, 3);
});

test('familyId/skeletonId benzersizdir ve esb-* önekine sahiptir', () => {
  const familyIds = ENGLISH_SENTENCE_BUILDER_FAMILIES.map((f) => f.familyId);
  assert.equal(new Set(familyIds).size, familyIds.length);
  assert.equal(familyIds.length, 12);
  for (const id of familyIds) assert.match(id, /^esb-/);
  const skeletonIds = ENGLISH_SENTENCE_BUILDER_FAMILIES.flatMap((f) => f.skeletons.map((s) => s.skeletonId));
  assert.equal(new Set(skeletonIds).size, skeletonIds.length);
  assert.equal(skeletonIds.length, 48);
});

test('her kombinasyon geçerli tur üretir (wordOrder veya choice)', () => {
  let combos = 0;
  for (const family of ENGLISH_SENTENCE_BUILDER_FAMILIES) {
    for (const skeleton of family.skeletons) {
      for (const pathId of skeleton.reasoningPathIds) {
        for (let trial = 0; trial < 3; trial += 1) {
          const round = skeleton.generate(seededRandomLike(trial * 47 + skeleton.skeletonId.length), pathId);
          combos += 1;
          assert.ok(round.questionKey?.startsWith('english-sentence-builder:'));
          assert.ok(round.prompt && round.explanation);
          if (round.kind === 'wordOrder') {
            assert.ok(Array.isArray(round.tokens) && round.tokens.length >= 3);
            assert.ok(Array.isArray(round.answerTokens) && round.answerTokens.length >= 3);
            assert.equal(round.tokens.length, round.answerTokens.length);
            const values = round.tokens.map((t) => t.value).sort().join('|');
            const answers = [...round.answerTokens].sort().join('|');
            assert.equal(values, answers, `${skeleton.skeletonId}: token kümesi answerTokens ile eşleşmeli`);
          } else {
            assert.equal(round.kind, 'choice');
            assert.equal(round.options.length, 4);
            assert.equal(new Set(round.options).size, 4, `${skeleton.skeletonId}: ${round.options}`);
            assert.ok(round.answerIndex >= 0 && round.answerIndex < 4);
            assert.ok(round.context);
          }
        }
      }
    }
  }
  assert.equal(combos, FAMILY_TARGET * SKELETON_TARGET_PER_FAMILY * PATH_TARGET_PER_SKELETON * 3);
});

test('select-valid iskeletleri wordOrder üretir', () => {
  for (const family of ENGLISH_SENTENCE_BUILDER_FAMILIES) {
    const select = family.skeletons.find((s) => s.skeletonId.endsWith(':select-valid'));
    const round = select.generate(seededRandomLike(99), 'raw-letters');
    assert.equal(round.kind, 'wordOrder', family.familyId);
  }
});

test('misorder-taxonomy dört yanlış-sıra türünü kapsar', () => {
  const fam = ENGLISH_SENTENCE_BUILDER_FAMILIES.find((f) => f.familyId === 'esb-misorder-taxonomy');
  const forced = fam.skeletons.find((s) => s.skeletonId.endsWith(':forced-fact'));
  const seen = new Set();
  for (let i = 0; i < 48; i += 1) {
    const round = forced.generate(seededRandomLike(i * 13 + 5), 'raw-letters');
    seen.add(round.options[round.answerIndex]);
  }
  for (const v of Object.values(ESB_MISORDER)) {
    assert.ok(seen.has(v), `eksik: ${v}`);
  }
});

test('generateFromFamilies sessionLength:10 üretir', () => {
  const { rounds, audit } = generateFromFamilies(ENGLISH_SENTENCE_BUILDER_FAMILIES, { seed: 424242, count: 10 });
  assert.equal(rounds.length, 10);
  assert.ok(audit.produced >= 10);
  for (const round of rounds) {
    assert.ok(round.familyId?.startsWith('esb-'));
    assert.ok(round.kind === 'wordOrder' || round.kind === 'choice');
  }
});

test('CANLI: createGameSession english-sentence-builder yeni motor', () => {
  const profile = { id: 'esb-live-1', age: 11, grade: 5, skills: {} };
  const session = createGameSession('english-sentence-builder', profile, 808080, { completedSessionCount: 1 });
  assert.equal(session.rounds.length, 10);
  for (const round of session.rounds) {
    assert.ok(round.familyId?.startsWith('esb-'), `familyId esb-* bekleniyor: ${round.familyId}`);
    assert.ok(round.skeletonId);
    assert.ok(round.reasoningPathId);
    assert.ok(round.kind === 'wordOrder' || round.kind === 'choice');
    if (round.kind === 'wordOrder') {
      assert.ok(round.tokens?.length);
      assert.ok(round.answerTokens?.length);
    }
    const result = validateQuestionContract(round);
    assert.ok(result.ok, result.errors.join(','));
  }
  assert.equal(session.rounds[0].questionContract.reasoningPath.derivationMethod, 'EXPLICIT_MULTI_PATH');
});

test('öğrenci geçmişi aynı iskeleti erken tekrar seçmez', () => {
  const profile = { id: 'esb-cool-1', age: 11, grade: 5, skills: {} };
  const first = createGameSession('english-sentence-builder', profile, 111, { completedSessionCount: 1 });
  const used = new Set(first.rounds.map((r) => r.skeletonId).filter(Boolean));
  const attempts = first.rounds.map((r) => ({ gameId: 'english-sentence-builder', skeletonId: r.skeletonId, familyId: r.familyId }));
  const second = createGameSession('english-sentence-builder', profile, 222, {
    completedSessionCount: 2,
    attempts,
    recentFamilyIds: first.rounds.map((r) => r.familyId)
  });
  const overlap = second.rounds.filter((r) => used.has(r.skeletonId)).length;
  assert.ok(overlap < second.rounds.length, `soğuma zayıf: ${overlap}/${second.rounds.length}`);
});

test('svo forced özne ile başlar', () => {
  const fam = ENGLISH_SENTENCE_BUILDER_FAMILIES.find((f) => f.familyId === 'esb-svo-basic');
  const forced = fam.skeletons.find((s) => s.skeletonId.endsWith(':forced-fact'));
  for (let i = 0; i < 12; i += 1) {
    const round = forced.generate(seededRandomLike(i * 17 + 3), 'raw-letters');
    const ans = round.options[round.answerIndex];
    assert.ok(['She', 'They', 'Tom'].includes(ans), `özne bekleniyor: ${ans}`);
  }
});
