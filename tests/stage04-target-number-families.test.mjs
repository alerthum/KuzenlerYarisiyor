import test from 'node:test';
import assert from 'node:assert/strict';
import { TARGET_NUMBER_FAMILIES } from '../js/content/families/target-number-families.js';
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
import { validateTargetExpression } from '../js/engines/math-engine.js';

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

// Üretim kodunun kullandığı `evaluateExpression`den TAMAMEN bağımsız, yerel
// bir ikinci hesaplama yolu (bkz. md/arsiv/DIFF_ANALYSIS.md §6).
function independentEval(expr) {
  const jsExpr = expr.replaceAll('×', '*').replaceAll('÷', '/');
  // eslint-disable-next-line no-new-func
  return Function(`"use strict"; return (${jsExpr});`)();
}

test('target-number ailelerinin her biri yapısal olarak geçerlidir (familyId, skeletonId, generate, reasoningPathIds, cognitiveTraits)', () => {
  for (const family of TARGET_NUMBER_FAMILIES) {
    const result = validateFamilyDefinition(family);
    assert.ok(result.ok, `${family.familyId}: ${result.errors.join(', ')}`);
  }
});

test('target-number, Aşama 04 hedeflerinin tamamına ulaşır: >=12 aile, aile başına >=4 iskelet, iskelet başına >=3 düşünme yolu', () => {
  const report = capacityReport(TARGET_NUMBER_FAMILIES);
  assert.equal(report.familyCount, TARGET_NUMBER_FAMILIES.length);
  assert.ok(report.familyCount >= FAMILY_TARGET, `Aile sayısı ${report.familyCount}, hedef >=${FAMILY_TARGET}`);
  assert.ok(report.meetsSkeletonTarget, `Bir ailede iskelet sayısı hedefin (>=${SKELETON_TARGET_PER_FAMILY}) altında`);
  assert.ok(report.meetsPathTarget, `Bir iskelette düşünme yolu sayısı hedefin (>=${PATH_TARGET_PER_SKELETON}) altında`);
  assert.equal(report.meetsAllTargets, true);
});

test('bütün familyId ve skeletonId değerleri global olarak benzersizdir', () => {
  const familyIds = TARGET_NUMBER_FAMILIES.map((f) => f.familyId);
  assert.equal(new Set(familyIds).size, familyIds.length);
  const skeletonIds = TARGET_NUMBER_FAMILIES.flatMap((f) => f.skeletons.map((s) => s.skeletonId));
  assert.equal(new Set(skeletonIds).size, skeletonIds.length);
});

test('kind:"expression" iskeletlerinde (direct-reach, verify-and-correct) üretilen `solution`, `numbers` ve `target` ile mevcut validateTargetExpression tarafından bağımsız doğrulanır', () => {
  let combos = 0;
  for (const family of TARGET_NUMBER_FAMILIES) {
    for (const skeleton of family.skeletons) {
      if (!skeleton.skeletonId.endsWith(':direct-reach') && !skeleton.skeletonId.endsWith(':verify-and-correct')) continue;
      for (const pathId of skeleton.reasoningPathIds) {
        for (let trial = 0; trial < 4; trial += 1) {
          const round = skeleton.generate(seededRandomLike(trial * 53 + skeleton.skeletonId.length), pathId);
          combos += 1;
          assert.equal(round.kind, 'expression');
          assert.ok(round.questionKey, `${skeleton.skeletonId}/${pathId}: questionKey eksik`);
          assert.ok(Array.isArray(round.numbers) && round.numbers.length === 4, `${skeleton.skeletonId}/${pathId}: 4 sayı olmalı`);
          assert.ok(Number.isInteger(round.target), `${skeleton.skeletonId}/${pathId}: target tam sayı olmalı`);
          const check = validateTargetExpression(round.solution, round.numbers, round.target);
          assert.ok(check.valid, `${skeleton.skeletonId}/${pathId}: solution "${round.solution}" bağımsız doğrulamadan geçemedi: ${check.reason}`);
          assert.ok(round.prompt && round.prompt.length > 0, `${skeleton.skeletonId}/${pathId}: prompt boş olamaz`);
          assert.ok(round.rule && round.rule.length > 0, `${skeleton.skeletonId}/${pathId}: rule boş olamaz`);
          assert.ok(round.explanation && round.explanation.length > 0, `${skeleton.skeletonId}/${pathId}: explanation boş olamaz`);
        }
      }
    }
  }
  assert.equal(combos, TARGET_NUMBER_FAMILIES.length * 2 * PATH_TARGET_PER_SKELETON * 4);
});

test('verify-and-correct: arkadaşın "yanlış" sonucu, bağımsız Function-tabanlı yeniden hesaplamayla da hedeften FARKLI çıkar', () => {
  for (const family of TARGET_NUMBER_FAMILIES) {
    const skeleton = family.skeletons.find((s) => s.skeletonId.endsWith(':verify-and-correct'));
    for (let trial = 0; trial < 5; trial += 1) {
      const round = skeleton.generate(seededRandomLike(trial * 71 + 3), 'raw-expression');
      const wrongMatch = round.rule.match(/denedi: (.+?) ve sonucu (-?\d+) buldu/);
      assert.ok(wrongMatch, `${family.familyId}: rule metninde arkadaşın işlemi bulunamadı: ${round.rule}`);
      const independentWrongResult = independentEval(wrongMatch[1]);
      assert.equal(independentWrongResult, Number(wrongMatch[2]), `${family.familyId}: arkadaşın sonucu üreticiden bağımsız yeniden hesaplamayla uyuşmuyor`);
      assert.notEqual(independentWrongResult, round.target, `${family.familyId}: arkadaşın "yanlış" sonucu aslında hedefe eşit çıktı`);
      const independentCorrect = independentEval(round.solution);
      assert.equal(independentCorrect, round.target, `${family.familyId}: solution bağımsız Function ile de hedefi vermeli`);
    }
  }
});

test('kind:"choice" iskeletlerinde (missing-number-reverse, compare-two-expressions) tam olarak 1 doğru seçenek var ve bu, bağımsız Function-tabanlı yeniden hesaplamayla teyit edilir', () => {
  let combos = 0;
  for (const family of TARGET_NUMBER_FAMILIES) {
    for (const skeleton of family.skeletons) {
      if (!skeleton.skeletonId.endsWith(':missing-number-reverse') && !skeleton.skeletonId.endsWith(':compare-two-expressions')) continue;
      for (const pathId of skeleton.reasoningPathIds) {
        for (let trial = 0; trial < 4; trial += 1) {
          const round = skeleton.generate(seededRandomLike(trial * 89 + skeleton.skeletonId.length), pathId);
          combos += 1;
          assert.equal(round.kind, 'choice');
          assert.ok(Array.isArray(round.options) && round.options.length === 4, `${skeleton.skeletonId}/${pathId}: 4 seçenek olmalı`);
          assert.equal(new Set(round.options).size, 4, `${skeleton.skeletonId}/${pathId}: seçenekler benzersiz olmalı`);
          assert.ok(round.answerIndex >= 0 && round.answerIndex < 4, `${skeleton.skeletonId}/${pathId}: answerIndex geçersiz`);

          if (skeleton.skeletonId.endsWith(':missing-number-reverse')) {
            // Şablon ("? " içeren ifade) ya çıplak promptta "ifade = hedef" biçiminde,
            // ya da context-embedded yolda tırnak içinde ("ifade") + ayrı bir "sonuç N" cümlesinde bulunur.
            const quoted = round.prompt.match(/"([^"]+)"/);
            let templateExpr, target;
            if (quoted) {
              templateExpr = quoted[1];
              const targetMatch = round.prompt.match(/sonuç (-?\d+)/);
              assert.ok(targetMatch, `prompt içinde "sonuç N" bulunamadı: ${round.prompt}`);
              target = Number(targetMatch[1]);
            } else {
              const plain = round.prompt.match(/^(.+) = (-?\d+)$/);
              assert.ok(plain, `prompt beklenen "ifade = hedef" kalıbına uymuyor: ${round.prompt}`);
              templateExpr = plain[1];
              target = Number(plain[2]);
            }
            assert.ok(templateExpr.includes('?'), `şablonda "?" bulunamadı: ${templateExpr}`);
            const correctCandidates = round.options.filter((option) => independentEval(templateExpr.replace('?', option)) === target);
            assert.equal(correctCandidates.length, 1, `${skeleton.skeletonId}/${pathId}: tam olarak 1 seçenek ? yerine konunca hedefi vermeli, bulunan: ${correctCandidates.length}`);
            assert.equal(correctCandidates[0], round.options[round.answerIndex], `${skeleton.skeletonId}/${pathId}: answerIndex, bağımsız hesaplamanın bulduğu doğru seçenekle uyuşmuyor`);
          } else {
            const results = round.options.map((expr) => independentEval(expr));
            assert.equal(new Set(results).size, 4, `${skeleton.skeletonId}/${pathId}: 4 ifadenin sonuçları birbirinden farklı olmalı (aksi hâlde çakışma)`);
            const targetMatch = round.prompt.match(/(-?\d+)/g) || round.context.match(/(-?\d+)/g);
            assert.ok(targetMatch, `${skeleton.skeletonId}/${pathId}: prompt/context içinde hedef sayı bulunamadı`);
          }
        }
      }
    }
  }
  assert.equal(combos, TARGET_NUMBER_FAMILIES.length * 2 * PATH_TARGET_PER_SKELETON * 4);
});

test('generateFromFamilies: target-number havuzundan tam bir oturum (4 tur) üretildiğinde aynı familyId/skeletonId oturum içinde tekrar etmez', () => {
  const { rounds, audit } = generateFromFamilies(TARGET_NUMBER_FAMILIES, { seed: 424242, count: 4 });
  assert.equal(rounds.length, 4);
  assert.equal(new Set(rounds.map((r) => r.familyId)).size, 4, 'aynı aile oturum içinde iki kez seçilmemeli (havuz yeterli)');
  assert.equal(new Set(rounds.map((r) => r.skeletonId)).size, 4, 'aynı iskelet oturum içinde iki kez seçilmemeli (havuz yeterli)');
  assert.ok(audit.distinctFamiliesUsed >= 4);
  for (const round of rounds) {
    assert.ok(round.reasoningPathId, 'her tur bir reasoningPathId taşımalı');
    assert.ok(Array.isArray(round.cognitiveTraits) && round.cognitiveTraits.length >= 2, 'her tur >=2 bilişsel özellik taşımalı');
  }
});

test('generateFromFamilies: önceki oturumun familyId/skeletonId geçmişi, havuz yeterliyken sonraki oturumda öncelik dışı bırakılır', () => {
  const first = generateFromFamilies(TARGET_NUMBER_FAMILIES, { seed: 111, count: 4 });
  const recentFamilyIds = first.rounds.map((r) => r.familyId);
  const recentSkeletonIds = first.rounds.map((r) => r.skeletonId);
  const second = generateFromFamilies(TARGET_NUMBER_FAMILIES, { seed: 222, count: 4, recentFamilyIds, recentSkeletonIds });
  const overlap = second.rounds.filter((r) => recentSkeletonIds.includes(r.skeletonId));
  assert.ok(overlap.length < second.rounds.length, 'soğuma uygulanmadı: ikinci oturum tamamen aynı iskeletlerden oluştu');
});

test('CANLI ENTEGRASYON: createGameSession("target-number", ...) yeni aile motorunu kullanır, questionContract EXPLICIT_MULTI_PATH işaretler', () => {
  const profile = { id: 'stage04-targetnumber-live-1', age: 11, grade: 5, skills: {} };
  const session = createGameSession('target-number', profile, 909090);
  assert.equal(session.rounds.length, 4);
  const familyIds = session.rounds.map((r) => r.familyId);
  const skeletonIds = session.rounds.map((r) => r.skeletonId);
  assert.equal(new Set(familyIds).size, 4, 'canlı oturumda aynı aile iki kez seçilmemeli');
  assert.equal(new Set(skeletonIds).size, 4, 'canlı oturumda aynı iskelet iki kez seçilmemeli');
  for (const round of session.rounds) {
    assert.ok(round.familyId?.startsWith('target-'), 'familyId yeni aile motorundan gelmeli');
    assert.ok(round.kind === 'expression' || round.kind === 'choice', 'target-number turu ya serbest ifade ya da çoktan seçmeli olmalı');
    const result = validateQuestionContract(round);
    assert.ok(result.ok, `questionContract eksik/hatalı: ${result.errors.join(',')}`);
    assert.equal(round.questionContract.reasoningPath.derivationMethod, 'EXPLICIT_MULTI_PATH');
    assert.ok(round.questionContract.reasoningPath.cognitiveTraits.length >= 2);
  }
});

test('CANLI ENTEGRASYON: 30 ardışık target-number oturumu (farklı seed, aynı öğrenci) hiçbir turda questionKey tekrar etmez, underfill olmaz ve zamanla her 4 görev türü de kullanılır', () => {
  const profile = { id: 'stage04-targetnumber-live-2', age: 9, grade: 4, skills: {} };
  const seenQuestionKeys = new Set();
  const attempts = [];
  let immediateSkeletonRepeats = 0;
  const skeletonTaskTypesSeen = new Set();
  for (let session = 0; session < 30; session += 1) {
    const result = createGameSession('target-number', profile, 1000 + session * 37, { seenQuestionKeys, attempts });
    assert.equal(result.rounds.length, 4, `oturum ${session}: 4 tur üretilmeli (underfill yok)`);
    const skeletonsThisSession = new Set();
    for (const round of result.rounds) {
      assert.ok(!seenQuestionKeys.has(round.questionKey), `questionKey ardışık oturumlar arasında tekrar etti: ${round.questionKey}`);
      seenQuestionKeys.add(round.questionKey);
      if (skeletonsThisSession.has(round.skeletonId)) immediateSkeletonRepeats += 1;
      skeletonsThisSession.add(round.skeletonId);
      const taskType = round.skeletonId.split(':').at(-1);
      skeletonTaskTypesSeen.add(taskType);
      attempts.push({ gameId: 'target-number', familyId: round.familyId, skeletonId: round.skeletonId });
    }
  }
  assert.equal(immediateSkeletonRepeats, 0, 'aynı oturum içinde iskelet tekrarı olmamalı (havuz 48, oturum 4)');
  assert.equal(skeletonTaskTypesSeen.size, 4, `30 oturum boyunca 4 görev türünün (direct-reach/verify-and-correct/missing-number-reverse/compare-two-expressions) tamamı en az bir kez kullanılmalı, kullanılan: ${[...skeletonTaskTypesSeen].join(',')}`);
});
