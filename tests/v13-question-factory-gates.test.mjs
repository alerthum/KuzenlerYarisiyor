import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PREMIUM_GOLD_BENCHMARKS_8TH,
  PREMIUM_REJECT_BENCHMARKS,
  evaluatePremiumQuestionFactory,
  normalizeRoundWithQuestionFactory,
  buildCognitiveExperience
} from '../js/quality/question-factory-v13.js';
import { createGameSession } from '../js/games/registry.js';

test('V13.5 GOLD benchmark soruları yayınlanabilir kabul edilir', () => {
  for (const sample of PREMIUM_GOLD_BENCHMARKS_8TH) {
    const round = normalizeRoundWithQuestionFactory({ kind: 'choice', ...sample }, { grade: 8 });
    assert.equal(round.questionFactoryGate.ok, true, `${sample.gameId}: ${round.questionFactoryGate.violations.join(',')}`);
    assert.ok(round.distractorPlanId, 'distractorPlanId üretildi');
    assert.ok(round.cognitiveExperienceId, 'cognitiveExperienceId üretildi');
    const wrong = round.optionDiagnostics.filter((d) => !d.isCorrect);
    assert.ok(wrong.every((d) => d.misconceptionId && d.rationale && !/kayıtlı değil/i.test(d.rationale)));
  }
});

test('V13.5 REJECT benchmark sahte premium soruları reddeder', () => {
  for (const sample of PREMIUM_REJECT_BENCHMARKS) {
    const result = evaluatePremiumQuestionFactory({ kind: 'choice', ...sample }, { grade: sample.grade });
    assert.equal(result.ok, false, `${sample.name} hatalı biçimde PASS oldu`);
    assert.ok(result.violations.length > 0);
  }
});

test('10. sınıf doğrudan iki sayı toplama hard kabul edilemez', () => {
  const result = evaluatePremiumQuestionFactory({
    kind: 'choice',
    prompt: '73 + 88 işleminin sonucu kaçtır?',
    context: 'İşlem önceliğine ve işaretlere dikkat ederek hesapla.',
    options: ['180', '199', '161', '142'],
    answerIndex: 2,
    explanation: '73 + 88 = 161.',
    familyId: 'speed-math-two-term-addition',
    skeletonId: 'speed-math-two-term-addition:direct-compute',
    cognitiveTraits: ['multiStepInference', 'strategySelection']
  }, { grade: 10 });
  assert.ok(result.violations.includes('grade3plus_direct_single_step_arithmetic'));
});

test('cognitiveExperienceId sayı/dekor değişiminden bağımsız aynı yapıyı yakalar', () => {
  const a = buildCognitiveExperience({
    kind: 'choice', familyId: 'pattern-lab-arithmetic-add', skeletonId: 'pattern-lab-arithmetic-add:next-term',
    prompt: 'Kural: Her terimde 7 ekleniyor. İlk iki terim 19 ve 26. Bu kurala göre 6. terim kaçtır?',
    context: 'Kuralı ilk terimden başlayarak sırayla uygula; çıkarım yapmana gerek yok, yalnız uygula.',
    explanation: '19 → 26 → 33 → 40 → 47 → 54.', options: ['61','47','54','68']
  });
  const b = buildCognitiveExperience({
    kind: 'choice', familyId: 'pattern-lab-arithmetic-add', skeletonId: 'pattern-lab-arithmetic-add:next-term',
    prompt: 'Kural: Her terimde 4 ekleniyor. İlk iki terim 15 ve 19. Bu kurala göre 6. terim kaçtır?',
    context: 'Kuralı ilk terimden başlayarak sırayla uygula; çıkarım yapmana gerek yok, yalnız uygula.',
    explanation: '15 → 19 → 23 → 27 → 31 → 35.', options: ['39','35','43','31']
  });
  assert.equal(a.cognitiveExperienceId, b.cognitiveExperienceId);
});

test('canlı 8. sınıf matematik oturumu sahte hard/direct toplama yayınlamaz', () => {
  const profile = { id: 'v13-factory-grade8', age: 14, grade: 8, skills: {} };
  for (const gameId of ['pattern-lab', 'speed-math', 'problem-hunter']) {
    const session = createGameSession(gameId, profile, 130001, { completedSessionCount: 8 });
    assert.ok(session.rounds.length > 0, `${gameId} boş oturum üretti`);
    for (const round of session.rounds) {
      assert.equal(round.questionFactoryGate?.ok, true, `${gameId}: ${round.prompt} -> ${round.questionFactoryGate?.violations?.join(',')}`);
      assert.doesNotMatch(String(round.prompt), /^\s*\d+\s*[+\-×x*/÷]\s*\d+\s*işleminin sonucu kaçtır\??\s*$/i);
      assert.doesNotMatch(String(round.context), /çıkarım yapmana gerek yok/i);
    }
  }
});
