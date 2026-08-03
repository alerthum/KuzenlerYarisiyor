import test from 'node:test';
import assert from 'node:assert/strict';
import { SPEED_MATH_FAMILIES } from '../js/content/families/speed-math-families.js';
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

test('speed-math ailelerinin her biri yapısal olarak geçerlidir (familyId, skeletonId, generate, reasoningPathIds, cognitiveTraits)', () => {
  for (const family of SPEED_MATH_FAMILIES) {
    const result = validateFamilyDefinition(family);
    assert.ok(result.ok, `${family.familyId}: ${result.errors.join(', ')}`);
  }
});

test('speed-math, Aşama 04 hedeflerinin tamamına ulaşır: >=12 aile, aile başına >=4 iskelet, iskelet başına >=3 düşünme yolu', () => {
  const report = capacityReport(SPEED_MATH_FAMILIES);
  assert.equal(report.familyCount, SPEED_MATH_FAMILIES.length);
  assert.ok(report.familyCount >= FAMILY_TARGET, `Aile sayısı ${report.familyCount}, hedef >=${FAMILY_TARGET}`);
  assert.ok(report.meetsSkeletonTarget, `Bir ailede iskelet sayısı hedefin (>=${SKELETON_TARGET_PER_FAMILY}) altında`);
  assert.ok(report.meetsPathTarget, `Bir iskelette düşünme yolu sayısı hedefin (>=${PATH_TARGET_PER_SKELETON}) altında`);
  assert.equal(report.meetsAllTargets, true);
});

test('bütün familyId ve skeletonId değerleri global olarak benzersizdir (aynı isim iki ailede tekrar etmiyor)', () => {
  const familyIds = SPEED_MATH_FAMILIES.map((f) => f.familyId);
  assert.equal(new Set(familyIds).size, familyIds.length);
  const skeletonIds = SPEED_MATH_FAMILIES.flatMap((f) => f.skeletons.map((s) => s.skeletonId));
  assert.equal(new Set(skeletonIds).size, skeletonIds.length);
});

test('her aile-iskelet-yol kombinasyonu geçerli bir soru üretir: 4 benzersiz negatif olmayan seçenek, geçerli answerIndex, dolu questionKey', () => {
  let combos = 0;
  for (const family of SPEED_MATH_FAMILIES) {
    for (const skeleton of family.skeletons) {
      for (const pathId of skeleton.reasoningPathIds) {
        for (let trial = 0; trial < 3; trial += 1) {
          const seed = trial * 97 + skeleton.skeletonId.length;
          const round = skeleton.generate(seededRandomLike(seed), pathId);
          combos += 1;
          assert.ok(round.questionKey, `${skeleton.skeletonId}/${pathId}: questionKey eksik`);
          assert.ok(Array.isArray(round.options) && round.options.length === 4, `${skeleton.skeletonId}/${pathId}: 4 seçenek olmalı`);
          assert.equal(new Set(round.options).size, 4, `${skeleton.skeletonId}/${pathId}: seçenekler benzersiz olmalı`);
          for (const option of round.options) {
            assert.ok(Number(option) >= 0, `${skeleton.skeletonId}/${pathId}: negatif seçenek üretilemez (${option})`);
          }
          assert.ok(round.answerIndex >= 0 && round.answerIndex < 4, `${skeleton.skeletonId}/${pathId}: answerIndex geçersiz`);
          assert.ok(round.prompt && round.prompt.length > 0, `${skeleton.skeletonId}/${pathId}: prompt boş olamaz`);
          assert.ok(round.explanation && round.explanation.length > 0, `${skeleton.skeletonId}/${pathId}: explanation boş olamaz`);
          assert.ok(!/(?:^|\s)[1-4]?x\s*[+\-]\s*\d+\s*=\s*\d+/i.test(round.prompt), `${skeleton.skeletonId}/${pathId}: prompt registry.js'nin trivialLinear filtresine takılacak "x ... =" deseni içeriyor`);
        }
      }
    }
  }
  assert.equal(combos, SPEED_MATH_FAMILIES.length * SKELETON_TARGET_PER_FAMILY * PATH_TARGET_PER_SKELETON * 3);
});

test('bağımsız yeniden hesaplama: two-term-addition/direct-compute (raw-expression) cevabı, promptaki iki sayının toplamıyla üreticiden bağımsız doğrulanır', () => {
  const family = SPEED_MATH_FAMILIES.find((f) => f.familyId === 'speed-math-two-term-addition');
  const skeleton = family.skeletons.find((s) => s.skeletonId.endsWith(':direct-compute'));
  for (let trial = 0; trial < 10; trial += 1) {
    const round = skeleton.generate(seededRandomLike(trial * 13 + 5), 'raw-expression');
    const match = round.prompt.match(/^(\d+) \+ (\d+) işleminin sonucu kaçtır\?$/);
    assert.ok(match, `prompt beklenen kalıba uymuyor: ${round.prompt}`);
    const independentAnswer = Number(match[1]) + Number(match[2]);
    assert.equal(Number(round.options[round.answerIndex]), independentAnswer, 'Üreticinin cevabı bağımsız toplama ile uyuşmuyor');
  }
});

test('bağımsız yeniden hesaplama: exact-division/missing-operand (raw-expression) — gizli bölen, bölünen÷bölüm ile üreticiden bağımsız doğrulanır', () => {
  const family = SPEED_MATH_FAMILIES.find((f) => f.familyId === 'speed-math-exact-division');
  const skeleton = family.skeletons.find((s) => s.skeletonId.endsWith(':missing-operand'));
  for (let trial = 0; trial < 10; trial += 1) {
    const round = skeleton.generate(seededRandomLike(trial * 31 + 7), 'raw-expression');
    const match = round.prompt.match(/^(\d+) ÷ \? = (\d+)$/);
    assert.ok(match, `prompt beklenen kalıba uymuyor: ${round.prompt}`);
    const dividend = Number(match[1]);
    const quotient = Number(match[2]);
    assert.equal(dividend % quotient, 0, 'bölünen, bölüme tam bölünmeli (tam sayı bölen garantisi)');
    const independentDivisor = dividend / quotient;
    assert.equal(Number(round.options[round.answerIndex]), independentDivisor, 'Üreticinin cevabı bağımsız bölme ile uyuşmuyor');
  }
});

test('bağımsız yeniden hesaplama: compare-two-instances (raw-expression) farkı, A ve B ifadelerinin ayrı ayrı hesaplanmasıyla doğrulanır', () => {
  const family = SPEED_MATH_FAMILIES.find((f) => f.familyId === 'speed-math-two-term-multiplication');
  const skeleton = family.skeletons.find((s) => s.skeletonId.endsWith(':compare-two-instances'));
  for (let trial = 0; trial < 10; trial += 1) {
    const round = skeleton.generate(seededRandomLike(trial * 17 + 3), 'raw-expression');
    const match = round.prompt.match(/A\) (\d+) × (\d+)\s+B\) (\d+) × (\d+)/);
    assert.ok(match, `prompt beklenen kalıba uymuyor: ${round.prompt}`);
    const valueA = Number(match[1]) * Number(match[2]);
    const valueB = Number(match[3]) * Number(match[4]);
    const independentDiff = Math.abs(valueA - valueB);
    assert.equal(Number(round.options[round.answerIndex]), independentDiff, 'Üreticinin cevabı bağımsız fark hesaplamasıyla uyuşmuyor');
  }
});

test('generateFromFamilies: speed-math havuzundan tam bir oturum (8 tur) üretildiğinde aynı familyId/skeletonId oturum içinde tekrar etmez', () => {
  const { rounds, audit } = generateFromFamilies(SPEED_MATH_FAMILIES, { seed: 424242, count: 8 });
  assert.equal(rounds.length, 8);
  assert.equal(new Set(rounds.map((r) => r.familyId)).size, 8, 'aynı aile oturum içinde iki kez seçilmemeli (havuz yeterli)');
  assert.equal(new Set(rounds.map((r) => r.skeletonId)).size, 8, 'aynı iskelet oturum içinde iki kez seçilmemeli (havuz yeterli)');
  assert.ok(audit.distinctFamiliesUsed >= 8);
  for (const round of rounds) {
    assert.ok(round.reasoningPathId, 'her tur bir reasoningPathId taşımalı');
    assert.ok(Array.isArray(round.cognitiveTraits) && round.cognitiveTraits.length >= 2, 'her tur >=2 bilişsel özellik taşımalı');
  }
});

test('generateFromFamilies: önceki oturumun familyId/skeletonId geçmişi, havuz yeterliyken sonraki oturumda öncelik dışı bırakılır', () => {
  const first = generateFromFamilies(SPEED_MATH_FAMILIES, { seed: 111, count: 8 });
  const recentFamilyIds = first.rounds.map((r) => r.familyId);
  const recentSkeletonIds = first.rounds.map((r) => r.skeletonId);
  const second = generateFromFamilies(SPEED_MATH_FAMILIES, { seed: 222, count: 8, recentFamilyIds, recentSkeletonIds });
  const overlap = second.rounds.filter((r) => recentSkeletonIds.includes(r.skeletonId));
  assert.ok(overlap.length < second.rounds.length, 'soğuma uygulanmadı: ikinci oturum tamamen aynı iskeletlerden oluştu');
});

test('CANLI ENTEGRASYON: createGameSession("speed-math", ...) yeni aile motorunu kullanır, questionContract EXPLICIT_MULTI_PATH işaretler', () => {
  const profile = { id: 'stage04-speedmath-live-1', age: 11, grade: 5, skills: {} };
  const session = createGameSession('speed-math', profile, 909090);
  assert.equal(session.rounds.length, 8);
  const familyIds = session.rounds.map((r) => r.familyId);
  const skeletonIds = session.rounds.map((r) => r.skeletonId);
  assert.equal(new Set(familyIds).size, 8, 'canlı oturumda aynı aile iki kez seçilmemeli');
  assert.equal(new Set(skeletonIds).size, 8, 'canlı oturumda aynı iskelet iki kez seçilmemeli');
  for (const round of session.rounds) {
    assert.ok(round.familyId?.startsWith('speed-math-'), 'familyId yeni aile motorundan gelmeli');
    const result = validateQuestionContract(round);
    assert.ok(result.ok, `questionContract eksik/hatalı: ${result.errors.join(',')}`);
    assert.equal(round.questionContract.reasoningPath.derivationMethod, 'EXPLICIT_MULTI_PATH');
    assert.ok(round.questionContract.reasoningPath.cognitiveTraits.length >= 2);
  }
});

test('CANLI ENTEGRASYON: 20 ardışık speed-math oturumu (farklı seed, aynı öğrenci) hiçbir turda questionKey tekrar etmez ve underfill olmaz', () => {
  const profile = { id: 'stage04-speedmath-live-2', age: 9, grade: 4, skills: {} };
  const seenQuestionKeys = new Set();
  const attempts = [];
  let immediateSkeletonRepeats = 0;
  for (let session = 0; session < 20; session += 1) {
    const result = createGameSession('speed-math', profile, 1000 + session * 37, { seenQuestionKeys, attempts });
    assert.equal(result.rounds.length, 8, `oturum ${session}: 8 tur üretilmeli (underfill yok)`);
    const skeletonsThisSession = new Set();
    for (const round of result.rounds) {
      assert.ok(!seenQuestionKeys.has(round.questionKey), `questionKey ardışık oturumlar arasında tekrar etti: ${round.questionKey}`);
      seenQuestionKeys.add(round.questionKey);
      if (skeletonsThisSession.has(round.skeletonId)) immediateSkeletonRepeats += 1;
      skeletonsThisSession.add(round.skeletonId);
      attempts.push({ gameId: 'speed-math', familyId: round.familyId, skeletonId: round.skeletonId });
    }
  }
  assert.equal(immediateSkeletonRepeats, 0, 'aynı oturum içinde iskelet tekrarı olmamalı (havuz 48, oturum 8)');
});
