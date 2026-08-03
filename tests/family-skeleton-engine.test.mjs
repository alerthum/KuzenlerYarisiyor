import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FAMILY_TARGET,
  SKELETON_TARGET_PER_FAMILY,
  PATH_TARGET_PER_SKELETON,
  validateFamilyDefinition,
  capacityReport,
  generateFromFamilies
} from '../js/quality/family-skeleton-engine.js';

function mockSkeleton(id, pathCount = 3, traits = ['multiStepInference', 'conditionEvaluation']) {
  return {
    skeletonId: id,
    reasoningPathIds: Array.from({ length: pathCount }, (_, i) => `path${i + 1}`),
    cognitiveTraits: traits,
    generate: (random, pathId) => ({
      prompt: `${id}/${pathId} sorusu — ${Math.floor(random() * 1000)}`,
      options: ['A', 'B', 'C', 'D'],
      answerIndex: 0,
      explanation: 'Test açıklaması',
      questionKey: `${id}:${pathId}:${Math.floor(random() * 1e9)}`
    })
  };
}

function mockFamily(id, skeletonCount = 4) {
  return {
    familyId: id,
    skeletons: Array.from({ length: skeletonCount }, (_, i) => mockSkeleton(`${id}-sk${i + 1}`))
  };
}

test('validateFamilyDefinition eksik skeletonId/generate/reasoningPaths/cognitiveTraits alanlarını hata olarak yakalar', () => {
  const broken = { familyId: 'x', skeletons: [{ skeletonId: 's1' }] };
  const result = validateFamilyDefinition(broken);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.startsWith('generate_not_function')));
  assert.ok(result.errors.some((e) => e.startsWith('reasoning_paths_missing')));
  assert.ok(result.errors.some((e) => e.startsWith('cognitive_traits_insufficient')));
});

test('validateFamilyDefinition hedefin altındaki iskelet/yol sayısını uyarı olarak (hata değil) işaretler', () => {
  const family = mockFamily('warn-family', 2);
  family.skeletons[0].reasoningPathIds = ['only-one-path'];
  const result = validateFamilyDefinition(family);
  assert.equal(result.ok, true);
  assert.ok(result.warnings.some((w) => w.startsWith('skeleton_count_below_target')));
  assert.ok(result.warnings.some((w) => w.startsWith('path_count_below_target')));
});

test('capacityReport hedeflere (12 aile / 4 iskelet / 3 yol) ulaşılıp ulaşılmadığını doğru hesaplar', () => {
  const fullFamilies = Array.from({ length: FAMILY_TARGET }, (_, i) => mockFamily(`f${i}`, SKELETON_TARGET_PER_FAMILY));
  const fullReport = capacityReport(fullFamilies);
  assert.equal(fullReport.familyCount, FAMILY_TARGET);
  assert.equal(fullReport.meetsFamilyTarget, true);
  assert.equal(fullReport.meetsSkeletonTarget, true);
  assert.equal(fullReport.meetsPathTarget, true);
  assert.equal(fullReport.meetsAllTargets, true);

  const partialFamilies = Array.from({ length: 3 }, (_, i) => mockFamily(`p${i}`, 2));
  const partialReport = capacityReport(partialFamilies);
  assert.equal(partialReport.familyCount, 3);
  assert.equal(partialReport.meetsFamilyTarget, false);
  assert.equal(partialReport.meetsSkeletonTarget, false);
  assert.equal(partialReport.meetsAllTargets, false);
});

test('generateFromFamilies havuz yeterliyken bir oturumda aynı familyId ve skeletonId tekrar etmez', () => {
  const families = Array.from({ length: 6 }, (_, i) => mockFamily(`gen-${i}`, SKELETON_TARGET_PER_FAMILY));
  const { rounds, audit } = generateFromFamilies(families, { seed: 12345, count: 6 });
  assert.equal(rounds.length, 6);
  assert.equal(new Set(rounds.map((r) => r.familyId)).size, 6, 'aynı ailenin iki turu olmamalı (havuz yeterli)');
  assert.equal(new Set(rounds.map((r) => r.skeletonId)).size, 6);
  assert.equal(audit.produced, 6);
});

test('generateFromFamilies önceki oturumdan gelen recentFamilyIds/recentSkeletonIds havuz yeterliyken öncelik dışı bırakılır', () => {
  const families = Array.from({ length: 8 }, (_, i) => mockFamily(`cool-${i}`, SKELETON_TARGET_PER_FAMILY));
  const first = generateFromFamilies(families, { seed: 777, count: 4 });
  const recentFamilyIds = first.rounds.map((r) => r.familyId);
  const recentSkeletonIds = first.rounds.map((r) => r.skeletonId);
  const second = generateFromFamilies(families, { seed: 778, count: 4, recentFamilyIds, recentSkeletonIds });
  const overlap = second.rounds.filter((r) => recentFamilyIds.includes(r.familyId));
  assert.ok(overlap.length < second.rounds.length, 'soğuma uygulanmadı, ikinci oturum tamamen aynı ailelerden oluştu');
});

test('generateFromFamilies her turu doğru familyId/skeletonId/reasoningPathId ile etiketler', () => {
  const families = [mockFamily('label-check', SKELETON_TARGET_PER_FAMILY)];
  const { rounds } = generateFromFamilies(families, { seed: 1, count: 1 });
  assert.equal(rounds.length, 1);
  assert.equal(rounds[0].familyId, 'label-check');
  assert.match(rounds[0].skeletonId, /^label-check-sk\d$/);
  assert.match(rounds[0].reasoningPathId, /^label-check-sk\d#path\d$/);
  assert.ok(Array.isArray(rounds[0].cognitiveTraits) && rounds[0].cognitiveTraits.length >= 2);
});

test('generateFromFamilies geçersiz aile tanımlarını sessizce yok saymaz, havuzdan çıkarır', () => {
  const broken = { familyId: 'broken', skeletons: [{ skeletonId: 'no-generate' }] };
  const valid = mockFamily('valid-only', SKELETON_TARGET_PER_FAMILY);
  const { rounds, audit } = generateFromFamilies([broken, valid], { seed: 9, count: 2 });
  assert.ok(rounds.every((r) => r.familyId === 'valid-only'));
  assert.equal(audit.poolSize, SKELETON_TARGET_PER_FAMILY);
});
