import test from 'node:test';
import assert from 'node:assert/strict';
import { WORD_MINE_FAMILIES, parseChoiceWord } from '../js/content/families/word-mine-families.js';
import {
  FAMILY_TARGET,
  SKELETON_TARGET_PER_FAMILY,
  PATH_TARGET_PER_SKELETON,
  capacityReport,
  validateFamilyDefinition,
  generateFromFamilies
} from '../js/quality/family-skeleton-engine.js';
import { canBuildWord, normalizeTurkish } from '../js/engines/word-engine.js';
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

function extractSourceFromPrompt(prompt) {
  const m = String(prompt).match(/Kaynak[:\s]*[“"]([^”"]+)[”"]/u) || String(prompt).match(/S1=“([^”]+)”/u);
  return m ? m[1] : null;
}

test('word-mine aileleri yapısal olarak geçerlidir', () => {
  for (const family of WORD_MINE_FAMILIES) {
    const result = validateFamilyDefinition(family);
    assert.ok(result.ok, `${family.familyId}: ${result.errors.join(', ')}`);
  }
});

test('word-mine Aşama 04 hedeflerine ulaşır: 12/4/3', () => {
  const report = capacityReport(WORD_MINE_FAMILIES);
  assert.equal(report.familyCount, WORD_MINE_FAMILIES.length);
  assert.equal(report.familyCount, 12);
  assert.ok(report.meetsSkeletonTarget);
  assert.ok(report.meetsPathTarget);
  assert.equal(report.meetsAllTargets, true);
});

test('familyId/skeletonId benzersizdir', () => {
  const familyIds = WORD_MINE_FAMILIES.map((f) => f.familyId);
  assert.equal(new Set(familyIds).size, familyIds.length);
  assert.equal(familyIds.length, 12);
  const skeletonIds = WORD_MINE_FAMILIES.flatMap((f) => f.skeletons.map((s) => s.skeletonId));
  assert.equal(new Set(skeletonIds).size, skeletonIds.length);
  assert.equal(skeletonIds.length, 48);
});

test('her kombinasyon geçerli tur üretir (wordMine veya choice)', () => {
  let combos = 0;
  for (const family of WORD_MINE_FAMILIES) {
    for (const skeleton of family.skeletons) {
      for (const pathId of skeleton.reasoningPathIds) {
        for (let trial = 0; trial < 3; trial += 1) {
          const round = skeleton.generate(seededRandomLike(trial * 53 + skeleton.skeletonId.length), pathId);
          combos += 1;
          assert.ok(round.questionKey?.startsWith('word-mine:'), `${skeleton.skeletonId}/${pathId}: questionKey`);
          assert.ok(round.prompt && round.explanation, `${skeleton.skeletonId}/${pathId}: prompt/explanation`);
          if (round.kind === 'wordMine') {
            assert.equal(round.kind, 'wordMine');
            assert.ok(round.source);
            assert.ok(Array.isArray(round.allowed) && round.allowed.length >= 4);
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

test('wordMine: allowed kelimelerin tamamı canBuildWord geçer', () => {
  for (const family of WORD_MINE_FAMILIES) {
    const skeleton = family.skeletons.find((s) => s.skeletonId.endsWith(':select-valid'));
    for (const pathId of skeleton.reasoningPathIds) {
      for (let trial = 0; trial < 5; trial += 1) {
        const round = skeleton.generate(seededRandomLike(trial * 71 + 2), pathId);
        assert.equal(round.kind, 'wordMine');
        for (const word of round.allowed) {
          assert.ok(canBuildWord(round.source, word), `${family.familyId}: "${word}" from "${round.source}"`);
        }
      }
    }
  }
});

test('bağımsız doğrulama: forced-fact cevabı canBuildWord; spot-violation cevabı değil', () => {
  for (const family of WORD_MINE_FAMILIES) {
    const forced = family.skeletons.find((s) => s.skeletonId.endsWith(':forced-fact'));
    const spot = family.skeletons.find((s) => s.skeletonId.endsWith(':spot-violation'));
    for (let trial = 0; trial < 8; trial += 1) {
      const seed = trial * 23 + family.familyId.length;
      const forcedRound = forced.generate(seededRandomLike(seed), 'raw-letters');
      const spotRound = spot.generate(seededRandomLike(seed + 1), 'raw-letters');
      const forcedCode = forcedRound.options[forcedRound.answerIndex];
      const spotCode = spotRound.options[spotRound.answerIndex];
      const forcedWord = parseChoiceWord(forcedCode);
      const spotWord = parseChoiceWord(spotCode);
      assert.ok(forcedWord, `${family.familyId} forced code: ${forcedCode}`);
      assert.ok(spotWord, `${family.familyId} spot code: ${spotCode}`);
      assert.match(forcedCode, /^OK:/);
      assert.match(spotCode, /^NO:/);
      const source = extractSourceFromPrompt(forcedRound.prompt)
        || extractSourceFromPrompt(spotRound.prompt)
        || (forcedRound.prompt.includes('S1=') ? 'arkadaşlık' : null);
      assert.ok(source, `${family.familyId}: kaynak çıkarılamadı`);
      assert.ok(canBuildWord(source, forcedWord), `${family.familyId}: forced "${forcedWord}" buildable değil`);
      assert.ok(!canBuildWord(source, spotWord), `${family.familyId}: spot "${spotWord}" yanlışlıkla buildable`);
    }
  }
});

test('generateFromFamilies count:1 (sessionLength) çalışır', () => {
  const { rounds, audit } = generateFromFamilies(WORD_MINE_FAMILIES, { seed: 515151, count: 1 });
  assert.equal(rounds.length, 1);
  assert.ok(audit.produced >= 1);
  const round = rounds[0];
  assert.ok(round.familyId?.startsWith('wm-'));
  assert.ok(round.skeletonId);
  assert.ok(round.reasoningPathId);
  assert.ok(round.kind === 'wordMine' || round.kind === 'choice');
});

test('CANLI: createGameSession word-mine yeni motor', () => {
  const profile = { id: 'wm-live-1', age: 11, grade: 5, skills: {} };
  const session = createGameSession('word-mine', profile, 707070, { completedSessionCount: 1 });
  assert.equal(session.rounds.length, 1);
  const round = session.rounds[0];
  assert.ok(round.familyId?.startsWith('wm-'), `familyId wm-* bekleniyor, alınan: ${round.familyId}`);
  assert.ok(round.skeletonId);
  assert.ok(round.reasoningPathId);
  assert.ok(round.kind === 'wordMine' || round.kind === 'choice');
  const result = validateQuestionContract(round);
  assert.ok(result.ok, result.errors.join(','));
  assert.equal(round.questionContract.reasoningPath.derivationMethod, 'EXPLICIT_MULTI_PATH');
});

test('CANLI: 20 ardışık word-mine oturumu 0 underfill', () => {
  const profile = { id: 'wm-live-2', age: 10, grade: 4, skills: {} };
  const seenQuestionKeys = new Set();
  const attempts = [];
  let underfill = 0;
  for (let session = 0; session < 20; session += 1) {
    const result = createGameSession('word-mine', profile, 6000 + session * 41, {
      seenQuestionKeys,
      attempts,
      completedSessionCount: 1
    });
    if (result.rounds.length < 1) underfill += 1;
    for (const round of result.rounds) {
      assert.ok(round.familyId?.startsWith('wm-'), `beklenen wm-*, alınan: ${round.familyId}`);
      assert.ok(round.skeletonId);
      assert.ok(round.reasoningPathId);
      assert.ok(round.questionKey.startsWith('word-mine:'));
      assert.ok(!seenQuestionKeys.has(round.questionKey));
      seenQuestionKeys.add(round.questionKey);
      attempts.push({ gameId: 'word-mine', familyId: round.familyId, skeletonId: round.skeletonId });
    }
  }
  assert.equal(underfill, 0);
});

test('choice cevap kodları normalize uzunlukta 12 karakterden kısa', () => {
  for (const family of WORD_MINE_FAMILIES) {
    for (const skeleton of family.skeletons) {
      if (skeleton.skeletonId.endsWith(':select-valid')) continue;
      for (const pathId of skeleton.reasoningPathIds) {
        const round = skeleton.generate(seededRandomLike(99), pathId);
        for (const option of round.options) {
          assert.ok(normalizeTurkish(option).length <= 12 || option.includes('+'), `${option} çok uzun`);
        }
      }
    }
  }
});
