import test from 'node:test';
import assert from 'node:assert/strict';
import { PATTERN_LAB_FAMILIES } from '../js/content/families/pattern-lab-families.js';
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

test('pattern-lab ailelerinin her biri yapısal olarak geçerlidir (familyId, skeletonId, generate, reasoningPathIds, cognitiveTraits)', () => {
  for (const family of PATTERN_LAB_FAMILIES) {
    const result = validateFamilyDefinition(family);
    assert.ok(result.ok, `${family.familyId}: ${result.errors.join(', ')}`);
  }
});

test('pattern-lab, Aşama 04 hedeflerinin tamamına ulaşır: >=12 aile, aile başına >=4 iskelet, iskelet başına >=3 düşünme yolu', () => {
  const report = capacityReport(PATTERN_LAB_FAMILIES);
  assert.equal(report.familyCount, PATTERN_LAB_FAMILIES.length);
  assert.ok(report.familyCount >= FAMILY_TARGET, `Aile sayısı ${report.familyCount}, hedef >=${FAMILY_TARGET}`);
  assert.ok(report.meetsSkeletonTarget, `Bir ailede iskelet sayısı hedefin (>=${SKELETON_TARGET_PER_FAMILY}) altında`);
  assert.ok(report.meetsPathTarget, `Bir iskelette düşünme yolu sayısı hedefin (>=${PATH_TARGET_PER_SKELETON}) altında`);
  assert.equal(report.meetsAllTargets, true);
});

test('bütün familyId ve skeletonId değerleri global olarak benzersizdir (aynı isim iki ailede tekrar etmiyor)', () => {
  const familyIds = PATTERN_LAB_FAMILIES.map((f) => f.familyId);
  assert.equal(new Set(familyIds).size, familyIds.length);
  const skeletonIds = PATTERN_LAB_FAMILIES.flatMap((f) => f.skeletons.map((s) => s.skeletonId));
  assert.equal(new Set(skeletonIds).size, skeletonIds.length);
});

test('her aile-iskelet-yol kombinasyonu geçerli bir soru üretir: 4 benzersiz negatif olmayan seçenek, geçerli answerIndex, dolu questionKey', () => {
  let combos = 0;
  for (const family of PATTERN_LAB_FAMILIES) {
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
        }
      }
    }
  }
  assert.equal(combos, PATTERN_LAB_FAMILIES.length * SKELETON_TARGET_PER_FAMILY * PATH_TARGET_PER_SKELETON * 3);
});

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

test('bağımsız yeniden hesaplama: next-term (induction-raw) cevabı, dizinin kendi kuralından doğru şekilde türetilir (üreticiden bağımsız doğrulama)', () => {
  // arithmetic-add ailesi: kural "her terimde X ekleniyor" olarak açıkça yazılıyor;
  // burada üreticiden BAĞIMSIZ olarak yalnız gösterilen 5 terimden farkı çıkarıp
  // 6. terimi kendimiz hesaplıyoruz ve üreticinin cevabıyla karşılaştırıyoruz.
  const family = PATTERN_LAB_FAMILIES.find((f) => f.familyId === 'pattern-lab-arithmetic-add');
  const skeleton = family.skeletons.find((s) => s.skeletonId.endsWith(':next-term'));
  for (let trial = 0; trial < 10; trial += 1) {
    const round = skeleton.generate(seededRandomLike(trial * 13 + 5), 'induction-raw');
    const shown = round.prompt.split('  •  ').slice(0, -1).map(Number);
    const diff = shown[1] - shown[0];
    const independentAnswer = shown.at(-1) + diff;
    assert.equal(Number(round.options[round.answerIndex]), independentAnswer, 'Üreticinin cevabı bağımsız hesaplamayla uyuşmuyor');
  }
});

test('bağımsız yeniden hesaplama: error-detection doğru cevabı, bozuk olmayan komşu terimlerden çıkarılan kuralla tutarlıdır (fibonacci ailesi)', () => {
  const family = PATTERN_LAB_FAMILIES.find((f) => f.familyId === 'pattern-lab-fibonacci-recurrence');
  const skeleton = family.skeletons.find((s) => s.skeletonId.endsWith(':error-detection'));
  for (let trial = 0; trial < 10; trial += 1) {
    const round = skeleton.generate(seededRandomLike(trial * 31 + 7), 'induction-raw');
    const shownRaw = round.prompt.split('  —')[0].split('  •  ').map(Number);
    // fibonacci: shown[0], shown[1] bozulmamış (corruptIndex=3), doğru değer shown[1]+shown[2] olmalı (shown[2] de bozulmamış).
    const independentAnswer = shownRaw[1] + shownRaw[2];
    assert.equal(Number(round.options[round.answerIndex]), independentAnswer, 'Bağımsız fibonacci hesaplaması üreticiyle uyuşmuyor');
  }
});

test('generateFromFamilies: pattern-lab havuzundan tam bir oturum (8 tur) üretildiğinde aynı familyId/skeletonId oturum içinde tekrar etmez', () => {
  const { rounds, audit } = generateFromFamilies(PATTERN_LAB_FAMILIES, { seed: 424242, count: 8 });
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
  const first = generateFromFamilies(PATTERN_LAB_FAMILIES, { seed: 111, count: 8 });
  const recentFamilyIds = first.rounds.map((r) => r.familyId);
  const recentSkeletonIds = first.rounds.map((r) => r.skeletonId);
  const second = generateFromFamilies(PATTERN_LAB_FAMILIES, { seed: 222, count: 8, recentFamilyIds, recentSkeletonIds });
  const overlap = second.rounds.filter((r) => recentSkeletonIds.includes(r.skeletonId));
  assert.ok(overlap.length < second.rounds.length, 'soğuma uygulanmadı: ikinci oturum tamamen aynı iskeletlerden oluştu');
});

test('CANLI ENTEGRASYON: createGameSession("pattern-lab", ...) yeni aile motorunu kullanır, questionContract EXPLICIT_MULTI_PATH işaretler', () => {
  const profile = { id: 'stage04-live-1', age: 11, grade: 5, skills: {} };
  const session = createGameSession('pattern-lab', profile, 909090);
  assert.equal(session.rounds.length, 5);
  const familyIds = session.rounds.map((r) => r.familyId);
  const skeletonIds = session.rounds.map((r) => r.skeletonId);
  assert.equal(new Set(familyIds).size, 5, 'canlı oturumda aynı aile iki kez seçilmemeli');
  assert.equal(new Set(skeletonIds).size, 5, 'canlı oturumda aynı iskelet iki kez seçilmemeli');
  for (const round of session.rounds) {
    assert.ok(round.familyId?.startsWith('pattern-lab-'), 'familyId yeni aile motorundan gelmeli');
    const result = validateQuestionContract(round);
    assert.ok(result.ok, `questionContract eksik/hatalı: ${result.errors.join(',')}`);
    assert.equal(round.questionContract.reasoningPath.derivationMethod, 'EXPLICIT_MULTI_PATH');
    assert.ok(round.questionContract.reasoningPath.cognitiveTraits.length >= 2);
  }
});

test('CANLI ENTEGRASYON: 20 ardışık pattern-lab oturumu (farklı seed, aynı öğrenci) hiçbir turda familyId+skeletonId+questionKey üçlüsünü tekrar etmez', () => {
  const profile = { id: 'stage04-live-2', age: 9, grade: 4, skills: {} };
  const seenQuestionKeys = new Set();
  const attempts = [];
  let immediateSkeletonRepeats = 0;
  for (let session = 0; session < 20; session += 1) {
    const result = createGameSession('pattern-lab', profile, 1000 + session * 37, { seenQuestionKeys, attempts });
    assert.equal(result.rounds.length, 5, `oturum ${session}: 5 tur üretilmeli (underfill yok)`);
    const skeletonsThisSession = new Set();
    for (const round of result.rounds) {
      assert.ok(!seenQuestionKeys.has(round.questionKey), `questionKey ardışık oturumlar arasında tekrar etti: ${round.questionKey}`);
      seenQuestionKeys.add(round.questionKey);
      if (skeletonsThisSession.has(round.skeletonId)) immediateSkeletonRepeats += 1;
      skeletonsThisSession.add(round.skeletonId);
      attempts.push({ gameId: 'pattern-lab', familyId: round.familyId, skeletonId: round.skeletonId });
    }
  }
  assert.equal(immediateSkeletonRepeats, 0, 'aynı oturum içinde iskelet tekrarı olmamalı (havuz 48, oturum 5)');
});
