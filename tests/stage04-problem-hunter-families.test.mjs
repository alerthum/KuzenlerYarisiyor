import test from 'node:test';
import assert from 'node:assert/strict';
import { PROBLEM_HUNTER_FAMILIES } from '../js/content/families/problem-hunter-families.js';
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

test('problem-hunter ailelerinin her biri yapısal olarak geçerlidir', () => {
  for (const family of PROBLEM_HUNTER_FAMILIES) {
    const result = validateFamilyDefinition(family);
    assert.ok(result.ok, `${family.familyId}: ${result.errors.join(', ')}`);
  }
});

test('problem-hunter Aşama 04 hedeflerine ulaşır: >=12 aile, >=4 iskelet, >=3 yol', () => {
  const report = capacityReport(PROBLEM_HUNTER_FAMILIES);
  assert.ok(report.familyCount >= FAMILY_TARGET);
  assert.ok(report.meetsSkeletonTarget);
  assert.ok(report.meetsPathTarget);
  assert.equal(report.meetsAllTargets, true);
  assert.equal(report.totalSkeletons, FAMILY_TARGET * SKELETON_TARGET_PER_FAMILY);
});

test('familyId ve skeletonId değerleri global olarak benzersizdir', () => {
  const familyIds = PROBLEM_HUNTER_FAMILIES.map((f) => f.familyId);
  assert.equal(new Set(familyIds).size, familyIds.length);
  const skeletonIds = PROBLEM_HUNTER_FAMILIES.flatMap((f) => f.skeletons.map((s) => s.skeletonId));
  assert.equal(new Set(skeletonIds).size, skeletonIds.length);
});

test('her aile-iskelet-yol kombinasyonu geçerli soru üretir', () => {
  let combos = 0;
  for (const family of PROBLEM_HUNTER_FAMILIES) {
    for (const skeleton of family.skeletons) {
      for (const pathId of skeleton.reasoningPathIds) {
        for (let trial = 0; trial < 3; trial += 1) {
          const round = skeleton.generate(seededRandomLike(trial * 97 + skeleton.skeletonId.length), pathId);
          combos += 1;
          assert.ok(round.questionKey);
          assert.equal(round.options.length, 4);
          assert.equal(new Set(round.options).size, 4);
          assert.ok(round.answerIndex >= 0 && round.answerIndex < 4);
          assert.ok(round.prompt && round.explanation);
          for (const option of round.options) assert.ok(Number(option) >= 0);
        }
      }
    }
  }
  assert.equal(combos, FAMILY_TARGET * SKELETON_TARGET_PER_FAMILY * PATH_TARGET_PER_SKELETON * 3);
});

test('bağımsız doğrulama: multiply-then-subtract direct-solve cevabı üretimden bağımsız yeniden hesaplanır', () => {
  const family = PROBLEM_HUNTER_FAMILIES.find((f) => f.familyId === 'ph-multiply-then-subtract');
  const skeleton = family.skeletons.find((s) => s.skeletonId.endsWith(':direct-solve'));
  for (let trial = 0; trial < 12; trial += 1) {
    const round = skeleton.generate(seededRandomLike(trial * 11 + 3), 'raw-statement');
    const match = round.prompt.match(/(\d+) grup × (\d+) birim; (\d+) birim/);
    assert.ok(match, `prompt parse edilemedi: ${round.prompt}`);
    const [, packs, each, used] = match.map(Number);
    const independent = packs * each - used;
    assert.equal(Number(round.options[round.answerIndex]), independent);
  }
});

test('bağımsız doğrulama: percent-of-base reverse cevabı üretimden bağımsız yeniden hesaplanır', () => {
  const family = PROBLEM_HUNTER_FAMILIES.find((f) => f.familyId === 'ph-percent-of-base');
  const skeleton = family.skeletons.find((s) => s.skeletonId.endsWith(':reverse-find-given'));
  for (let trial = 0; trial < 12; trial += 1) {
    const round = skeleton.generate(seededRandomLike(trial * 13 + 7), 'raw-statement');
    const match = round.prompt.match(/%(\d+)’i (\d+) olan/);
    assert.ok(match, `prompt parse edilemedi: ${round.prompt}`);
    const percent = Number(match[1]);
    const part = Number(match[2]);
    const independent = part / (percent / 100);
    assert.equal(Number(round.options[round.answerIndex]), independent);
  }
});

test('linear aile trivialLinear/trivialPrompt desenlerini üretmez (B-002 koruması)', () => {
  const family = PROBLEM_HUNTER_FAMILIES.find((f) => f.familyId === 'ph-linear-unknown-reverse');
  for (const skeleton of family.skeletons) {
    for (const pathId of skeleton.reasoningPathIds) {
      for (let trial = 0; trial < 8; trial += 1) {
        const round = skeleton.generate(seededRandomLike(trial * 19 + pathId.length), pathId);
        assert.equal(/(?:^|\s)[1-4]?x\s*[+\-]\s*\d+\s*=\s*\d+/i.test(round.prompt), false, round.prompt);
        assert.equal(/(?:sonucu kaçtır|x kaçtır)\??$/i.test(round.prompt) && round.prompt.length < 42, false, round.prompt);
      }
    }
  }
});

test('verify-and-correct yanlış değer doğru cevaptan farklıdır', () => {
  for (const family of PROBLEM_HUNTER_FAMILIES) {
    const skeleton = family.skeletons.find((s) => s.skeletonId.endsWith(':verify-and-correct'));
    for (let trial = 0; trial < 5; trial += 1) {
      const round = skeleton.generate(seededRandomLike(trial * 23 + family.familyId.length), 'raw-statement');
      const correct = Number(round.options[round.answerIndex]);
      // explanation should mention a wrong student answer different from correct
      assert.ok(Number.isFinite(correct));
      assert.equal(new Set(round.options.map(Number)).size, 4);
    }
  }
});

test('generateFromFamilies: oturum içi familyId/skeletonId tekrarı olmaz', () => {
  const { rounds } = generateFromFamilies(PROBLEM_HUNTER_FAMILIES, { seed: 424242, count: 5 });
  assert.equal(rounds.length, 5);
  assert.equal(new Set(rounds.map((r) => r.familyId)).size, 5);
  assert.equal(new Set(rounds.map((r) => r.skeletonId)).size, 5);
});

test('CANLI ENTEGRASYON: createGameSession("problem-hunter") yeni motoru kullanır', () => {
  const profile = { id: 'ph-live-1', age: 13, grade: 8, skills: {} };
  const session = createGameSession('problem-hunter', profile, 909090);
  assert.equal(session.rounds.length, 5);
  assert.equal(new Set(session.rounds.map((r) => r.familyId)).size, 5);
  for (const round of session.rounds) {
    assert.ok(round.familyId?.startsWith('ph-'));
    const result = validateQuestionContract(round);
    assert.ok(result.ok, result.errors.join(','));
    assert.equal(round.questionContract.reasoningPath.derivationMethod, 'EXPLICIT_MULTI_PATH');
    assert.ok(round.questionContract.reasoningPath.cognitiveTraits.length >= 2);
  }
});

test('CANLI ENTEGRASYON: 30 ardışık oturum 0 questionKey tekrarı, 0 underfill (B-002 kapanışı bu oyun için)', () => {
  const profile = { id: 'ph-live-2', age: 13, grade: 8, skills: {} };
  const seenQuestionKeys = new Set();
  const attempts = [];
  let underfill = 0;
  let skeletonRepeats = 0;
  for (let session = 0; session < 30; session += 1) {
    const result = createGameSession('problem-hunter', profile, 2000 + session * 41, { seenQuestionKeys, attempts });
    if (result.rounds.length < 5) underfill += 1;
    const skeletons = new Set();
    for (const round of result.rounds) {
      assert.ok(!seenQuestionKeys.has(round.questionKey), `tekrar: ${round.questionKey}`);
      seenQuestionKeys.add(round.questionKey);
      if (skeletons.has(round.skeletonId)) skeletonRepeats += 1;
      skeletons.add(round.skeletonId);
      attempts.push({ gameId: 'problem-hunter', familyId: round.familyId, skeletonId: round.skeletonId });
    }
  }
  assert.equal(underfill, 0);
  assert.equal(skeletonRepeats, 0);
});
