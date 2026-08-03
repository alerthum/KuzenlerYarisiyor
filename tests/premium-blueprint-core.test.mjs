import test from 'node:test';
import assert from 'node:assert/strict';

import { definePremiumBlueprint, createPremiumBlueprintPack } from '../js/content/premium-blueprint-core.js';
import { evaluatePremiumQuestionFactory } from '../js/quality/question-factory-v13.js';
import { evaluateOptionQuality } from '../js/quality/premium-options-engine.js';
import { auditChoiceIntegrity } from '../js/quality/choice-integrity-engine-v11.js';
import { attachCognitiveDepth } from '../js/quality/cognitive-depth-engine.js';

function linearBlueprint(overrides = {}) {
  return definePremiumBlueprint({
    id: 'test-linear-equation',
    gameId: 'error-detective',
    familyId: 'test-linear-equation-family',
    skeletonId: 'test-linear-equation:isolate-variable',
    subjectId: 'mathematics',
    topicId: 'linear-equations',
    learningOutcomeId: 'solve-two-step-linear-equation',
    gradeBand: '9-10',
    cognitiveTraits: ['multiStepInference', 'conditionEvaluation', 'informationLinking', 'errorDiagnosis', 'symbolicReasoning'],
    reasoningStepCount: 3,
    solutionClass: 'two-step-linear-equation',
    variants: [
      { id: 'v1', a: 3, b: 5, c: 20 },
      { id: 'v2', a: 4, b: -2, c: 18 }
    ],
    render: ({ a, b, c }) => ({
      context: `Denklem: ${a}x ${b >= 0 ? '+' : '−'} ${Math.abs(b)} = ${c}`,
      prompt: 'Denklemi sağlayan x değeri hangisidir?',
      hints: ['Önce sabit terimi karşı tarafa geçir.', 'Sonra x katsayısına böl.']
    }),
    solve: ({ a, b, c }) => (c - b) / a,
    verify: ({ a, b, c }, value) => Number.isFinite(Number(value)) && Math.abs(a * Number(value) + b - c) < 1e-9,
    formatAnswer: (value) => `x = ${value}`,
    buildDistractors: ({ a, b, c }, correct) => [
      { value: (c + b) / a, text: `x = ${(c + b) / a}`, misconceptionId: 'test:add-instead-of-subtract', why: 'Sabit terimi karşı tarafa geçirirken işaretini değiştirmez.', constructionRule: 'solve-with-unchanged-constant-sign' },
      { value: c - b, text: `x = ${c - b}`, misconceptionId: 'test:skip-division', why: 'Sabit terimi ayırdıktan sonra katsayıya bölme adımını atlar.', constructionRule: 'omit-coefficient-division' },
      { value: -correct, text: `x = ${-correct}`, misconceptionId: 'test:flip-final-sign', why: 'Son adımda elde edilen değerin işaretini gerekçesiz değiştirir.', constructionRule: 'flip-final-sign' }
    ],
    buildExplanation: ({ a, b, c }, value) => `${a}x = ${c - b} olur; ${a} katsayısına bölündüğünde x = ${value} bulunur.`,
    buildEvidence: ({ a, b, c }, value) => [
      `${b} sabit terimi işaret değiştirerek karşı tarafa alınır ve ${a}x = ${c - b} elde edilir.`,
      `${c - b} sayısı ${a} katsayısına bölünür ve x = ${value} bulunur.`,
      `Doğrulama: ${a} × ${value} + (${b}) = ${c}.`
    ],
    ...overrides
  });
}

test('blueprint motoru her varyantın doğru cevabını çözer ve üç yanlış değeri doğrulayıcıyla reddeder', () => {
  const pack = createPremiumBlueprintPack({
    version: 'test-1',
    sourceLabel: 'Test Premium Blueprint',
    blueprints: [linearBlueprint()]
  });
  assert.equal(pack.blueprintCount, 1);
  assert.equal(pack.variantCount, 2);
  assert.equal(pack.validationReport.verifiedInstances, 2);
  const rounds = pack.generate('error-detective', { seed: 7, count: 10, grade: 9 }).rounds;
  assert.equal(rounds.length, 2);
  assert.equal(new Set(rounds.map((round) => round.questionKey)).size, 2);
  assert.equal(new Set(rounds.map((round) => round.structuralId)).size, 1);
  assert.equal(new Set(rounds.map((round) => round.cognitiveExperienceId)).size, 1);
  assert.equal(new Set(rounds.map((round) => round.surfaceFingerprint)).size, 2);
  for (const round of rounds) {
    assert.equal(round.solverProof?.verifiedCorrect, true);
    assert.equal(round.solverProof?.verifiedDistractorCount, 3);
    assert.equal(round.premiumBlueprint?.blueprintId, 'test-linear-equation');
    assert.equal(evaluatePremiumQuestionFactory(round, { grade: 9 }).ok, true);
    assert.equal(evaluateOptionQuality(round).ok, true);
    assert.equal(auditChoiceIntegrity(round).passed, true);
    assert.equal(attachCognitiveDepth(round, { grade: 9 }).cognitiveDepthGate.publicationAllowed, true);
  }
});

test('blueprint motoru doğrulayıcıdan geçen sahte çeldiriciyi paket oluşurken reddeder', () => {
  const bad = linearBlueprint({
    id: 'bad-linear-equation',
    buildDistractors: (_variant, correct) => [
      { value: correct, text: `x = ${correct}`, misconceptionId: 'bad:same-correct', why: 'Doğru değeri yanlış seçenek olarak tekrarlar.', constructionRule: 'duplicate-correct-value' },
      { value: 100, text: 'x = 100', misconceptionId: 'bad:large', why: 'İşlem sonucunu gereksiz büyütür.', constructionRule: 'inflate-result' },
      { value: -100, text: 'x = -100', misconceptionId: 'bad:sign', why: 'Sonucun işaretini gerekçesiz değiştirir.', constructionRule: 'flip-sign' }
    ]
  });
  assert.throws(() => createPremiumBlueprintPack({ version: 'bad', sourceLabel: 'Bad', blueprints: [bad] }), /also satisfies the verifier/);
});

test('blueprint motoru aynı varyant kimliğini ve doğrulanmayan solver sonucunu kabul etmez', () => {
  assert.throws(() => linearBlueprint({
    id: 'duplicate-variant-blueprint',
    variants: [{ id: 'same', a: 2, b: 1, c: 5 }, { id: 'same', a: 3, b: 2, c: 8 }]
  }), /variant ids must be distinct/);

  const invalidSolver = linearBlueprint({
    id: 'invalid-solver-blueprint',
    solve: () => 999
  });
  assert.throws(() => createPremiumBlueprintPack({ version: 'invalid', sourceLabel: 'Invalid', blueprints: [invalidSolver] }), /failed independent verification/);
});
