import test from 'node:test';
import assert from 'node:assert/strict';
import { auditChoiceIntegrity, attachChoiceIntegrity } from '../js/quality/choice-integrity-engine-v11.js';
import {
  evaluateFinalEvidence,
  assertEvidenceAllowsPass,
  FINAL_EVIDENCE_TARGETS
} from '../js/quality/final-evidence-gate.js';

test('choice integrity: non-choice not applicable', () => {
  const report = auditChoiceIntegrity({ kind: 'wordLadder', prompt: 'x' });
  assert.equal(report.applicable, false);
  assert.equal(report.passed, true);
  assert.equal(report.score, 100);
});

test('choice integrity: option count and answer index', () => {
  assert.equal(auditChoiceIntegrity({
    kind: 'choice', options: ['a', 'b', 'c'], answerIndex: 0
  }).passed, false);
  assert.equal(auditChoiceIntegrity({
    kind: 'choice', options: ['a', 'b', 'c', 'd'], answerIndex: 9
  }).passed, false);
  assert.equal(auditChoiceIntegrity({
    kind: 'choice', options: ['a', 'a', 'b', 'c'], answerIndex: 2
  }).passed, false);
});

test('choice integrity: quantitative and compact label paths pass', () => {
  const numeric = auditChoiceIntegrity({
    kind: 'choice', prompt: 'Sonuç?', options: ['12', '13', '14', '15'], answerIndex: 0
  });
  assert.equal(numeric.passed, true);
  assert.equal(numeric.metrics.quantitative, true);
  const labels = auditChoiceIntegrity({
    kind: 'choice', prompt: 'Etiket?', options: ['kırmızı', 'mavi', 'yeşil', 'sarı'], answerIndex: 1
  });
  assert.equal(labels.passed, true);
  assert.equal(labels.metrics.compactLabels, true);
});

test('choice integrity: length beacon and absolute pattern', () => {
  const beacon = auditChoiceIntegrity({
    kind: 'choice',
    prompt: 'Kitap paylaşımı okumayı destekler mi diye soruluyor hangisi doğru uzun yanıttır?',
    options: [
      'Bu seçenek diğerlerinden belirgin biçimde daha uzun ve ayrıntılı bir açıklama içerir çünkü kitap paylaşımı okumayı destekler',
      'hayır', 'belki', 'olmaz'
    ],
    answerIndex: 0
  });
  assert.equal(beacon.passed, false);
  assert.ok(beacon.errors.includes('correct_answer_length_beacon'));

  const absolute = auditChoiceIntegrity({
    kind: 'choice',
    prompt: 'Kitap paylaşımı hakkında hangisi doğrudur?',
    options: [
      'Kitap paylaşımı okumayı destekler',
      'Her zaman zararlıdır',
      'Asla işe yaramaz',
      'Bazen yararlıdır'
    ],
    answerIndex: 0
  });
  assert.equal(absolute.passed, false);
  assert.ok(absolute.errors.includes('absolute_word_elimination_pattern'));
});

test('choice integrity: irrelevant distractors and title exception', () => {
  const irrelevant = auditChoiceIntegrity({
    kind: 'choice',
    prompt: 'Kitap paylaşımı okumayı destekler çünkü komşular kitap değiş tokuşu yapar. Ana düşünce?',
    options: [
      'Kitap paylaşımı okumayı ve tasarrufu destekler',
      'Pizza çok lezzetlidir',
      'Uzaylılar geldi',
      'Futbolcu gol attı'
    ],
    answerIndex: 0
  });
  assert.equal(irrelevant.passed, false);
  assert.ok(irrelevant.errors.includes('multiple_semantically_irrelevant_distractors'));

  const title = auditChoiceIntegrity({
    kind: 'choice',
    prompt: 'Bu paragraf için en uygun başlık hangisidir?',
    options: [
      'Kitap paylaşımı okumayı destekler',
      'Pizza gecesi',
      'Uzay yolculuğu',
      'Futbol maçı'
    ],
    answerIndex: 0
  });
  assert.equal(title.errors.includes('multiple_semantically_irrelevant_distractors'), false);
});

test('choice integrity: warnings and attach statuses', () => {
  const pass = attachChoiceIntegrity({
    kind: 'choice',
    prompt: 'Kitap paylaşımı okumayı destekler mi?',
    options: [
      'Kitap paylaşımı okumayı destekler',
      'Kitap paylaşımı okumayı engeller',
      'Kitap paylaşımı etkisizdir',
      'Kitap paylaşımı sadece eğlencedir'
    ],
    answerIndex: 0
  });
  assert.equal(pass.choiceIntegrityStatus, 'PASS');
  assert.ok(pass.choiceIntegrity.score >= 70);

  const block = attachChoiceIntegrity({
    kind: 'choice',
    prompt: 'Kitap paylaşımı okumayı destekler çünkü komşular kitap değiş tokuşu yapar.',
    options: [
      'Kitap paylaşımı okumayı ve tasarrufu destekler',
      'Pizza çok lezzetlidir',
      'Uzaylılar geldi',
      'Futbolcu gol attı'
    ],
    answerIndex: 0
  });
  assert.equal(block.choiceIntegrityStatus, 'BLOCK');
});

test('choice integrity: answerValue resolution and metrics finiteness', () => {
  const report = auditChoiceIntegrity({
    kind: 'choice',
    prompt: 'Kitap paylaşımı okumayı destekler çünkü komşular kitap değiş tokuşu yapar.',
    options: [
      'Kitap paylaşımı okumayı destekler',
      'Kitap paylaşımı okumayı engeller',
      'Kitap paylaşımı etkisizdir',
      'Kitap paylaşımı sadece eğlencedir'
    ],
    answerValue: 'Kitap paylaşımı okumayı destekler'
  });
  assert.equal(report.applicable, true);
  assert.equal(report.passed, true);
  assert.ok(Number.isFinite(report.metrics.answerWords));
  assert.ok(Number.isFinite(report.metrics.lengthRatio));
  assert.ok(Number.isFinite(report.metrics.answerRelevance));
});

test('final evidence targets are strict floors', () => {
  assert.equal(FINAL_EVIDENCE_TARGETS.sessionsPerGame, 500);
  assert.equal(FINAL_EVIDENCE_TARGETS.activeGames, 23);
  assert.equal(FINAL_EVIDENCE_TARGETS.solverSamples, 50_000);
  assert.equal(FINAL_EVIDENCE_TARGETS.optionSamples, 10_000);
  assert.equal(FINAL_EVIDENCE_TARGETS.mutationScorePercent, 90);
  assert.equal(FINAL_EVIDENCE_TARGETS.fullE2ERequired, true);
  assert.equal(FINAL_EVIDENCE_TARGETS.childMindStructuredBandsRequired, true);
});

test('final evidence rejects each missing counter independently', () => {
  const base = {
    minSessionsPerGame: 500,
    gamesMeetingSessionTarget: 23,
    solverSamples: 50_000,
    optionSamples: 10_000,
    mutationScorePercent: 91,
    fullE2E: true,
    childMindStructuredBands: true,
    underfillCount: 0,
    sessionSemanticRepeatCount: 0
  };
  assert.equal(evaluateFinalEvidence({ actual: base }).adequate, true);
  assert.ok(evaluateFinalEvidence({ actual: { ...base, minSessionsPerGame: 499 } }).gaps.some((g) => g.startsWith('sessions:')));
  assert.ok(evaluateFinalEvidence({ actual: { ...base, gamesMeetingSessionTarget: 22 } }).gaps.some((g) => g.startsWith('games_with_500:')));
  assert.ok(evaluateFinalEvidence({ actual: { ...base, solverSamples: 49_999 } }).gaps.some((g) => g.startsWith('solver:')));
  assert.ok(evaluateFinalEvidence({ actual: { ...base, optionSamples: 9_999 } }).gaps.some((g) => g.startsWith('options:')));
  assert.ok(evaluateFinalEvidence({ actual: { ...base, mutationScorePercent: 89.9 } }).gaps.some((g) => g.startsWith('mutation:')));
  assert.ok(evaluateFinalEvidence({ actual: { ...base, fullE2E: false } }).gaps.includes('full_e2e_missing'));
  assert.ok(evaluateFinalEvidence({ actual: { ...base, childMindStructuredBands: false } }).gaps.includes('child_mind_structured_bands_missing'));
  assert.ok(evaluateFinalEvidence({ actual: { ...base, underfillCount: 1 } }).gaps.some((g) => g.startsWith('underfill:')));
  assert.ok(evaluateFinalEvidence({ actual: { ...base, sessionSemanticRepeatCount: 2 } }).gaps.some((g) => g.startsWith('semantic_repeat:')));
});

test('assertEvidenceAllowsPass mirrors adequacy', () => {
  const fail = assertEvidenceAllowsPass({ actual: { minSessionsPerGame: 5 } });
  assert.equal(fail.ok, false);
  assert.equal(fail.decision, 'FAIL');
  assert.equal(fail.autoReturnToStage14, true);
  assert.equal(fail.reason, 'final_evidence_inadequate');
  assert.equal(fail.verdict.finalEvidenceAdequacy, 'FAIL');
  const pass = assertEvidenceAllowsPass({
    actual: {
      minSessionsPerGame: 500,
      gamesMeetingSessionTarget: 23,
      solverSamples: 50_000,
      optionSamples: 10_000,
      mutationScorePercent: 90,
      fullE2E: true,
      childMindStructuredBands: true,
      underfillCount: 0,
      sessionSemanticRepeatCount: 0,
      e2eSmokeOnly: 0
    }
  });
  assert.equal(pass.ok, true);
  assert.equal(pass.decision, 'PASS');
  assert.equal(pass.autoReturnToStage14, false);
  assert.equal(pass.verdict.finalEvidenceAdequacy, 'PASS');
  assert.deepEqual(pass.gaps, []);
  assert.equal(pass.verdict.actual.fullE2E, true);
  assert.equal(pass.verdict.actual.childMindStructuredBands, true);
  assert.equal(pass.verdict.actual.underfillCount, 0);
  assert.equal(pass.verdict.actual.sessionSemanticRepeatCount, 0);
  assert.equal(pass.verdict.actual.e2eSmokeOnly, 0);
  assert.equal(pass.verdict.actual.minSessionsPerGame, 500);
  assert.equal(pass.verdict.actual.solverSamples, 50_000);
  assert.equal(pass.verdict.actual.optionSamples, 10_000);
  assert.equal(pass.verdict.actual.mutationScorePercent, 90);
});

test('evaluateFinalEvidence actual mirror rejects false flags', () => {
  const v = evaluateFinalEvidence({
    actual: {
      minSessionsPerGame: 500,
      gamesMeetingSessionTarget: 23,
      solverSamples: 50_000,
      optionSamples: 10_000,
      mutationScorePercent: 90,
      fullE2E: 1,
      childMindStructuredBands: 'true',
      underfillCount: 0,
      sessionSemanticRepeatCount: 0
    }
  });
  // Strict === true required
  assert.equal(v.actual.fullE2E, false);
  assert.equal(v.actual.childMindStructuredBands, false);
  assert.equal(v.adequate, false);
  assert.ok(v.gaps.includes('full_e2e_missing'));
  assert.ok(v.gaps.includes('child_mind_structured_bands_missing'));
});

test('custom targets override defaults when provided', () => {
  const v = evaluateFinalEvidence({
    targets: { sessionsPerGame: 10, activeGames: 1, solverSamples: 10, optionSamples: 10, mutationScorePercent: 50 },
    actual: {
      minSessionsPerGame: 10,
      gamesMeetingSessionTarget: 1,
      solverSamples: 10,
      optionSamples: 10,
      mutationScorePercent: 50,
      fullE2E: true,
      childMindStructuredBands: true
    }
  });
  assert.equal(v.targets.sessionsPerGame, 10);
  assert.equal(v.adequate, true);
});
