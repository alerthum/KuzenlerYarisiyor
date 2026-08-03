import test from 'node:test';
import assert from 'node:assert/strict';
import {
  runAiJuryBudgetPlan,
  shouldEscalateToAiJury,
  resetAiJuryMemory,
  AI_JURY_TOKEN_BUDGET_PER_RUN
} from '../js/quality/ai-jury-budget.js';

test('aynı hata ikinci kez escalate edilmez', () => {
  resetAiJuryMemory();
  const sample = { gameId: 'x', questionKey: 'k1', score: 80, violations: ['form_cue'], prompt: 'test prompt' };
  assert.equal(shouldEscalateToAiJury(sample).escalate, true);
  assert.equal(shouldEscalateToAiJury(sample).escalate, false);
});

test('bütçe planı sınırda/düşük örneklere öncelik verir ve bütçeyi aşmaz', () => {
  const samples = [
    { gameId: 'a', questionKey: '1', score: 100, prompt: 'ok' },
    { gameId: 'a', questionKey: '2', score: 92, violations: ['border'], prompt: 'borderline '.repeat(20) },
    { gameId: 'a', questionKey: '3', score: 70, violations: ['low'], prompt: 'low '.repeat(30) },
    { gameId: 'a', questionKey: '3', score: 70, violations: ['low'], prompt: 'dup' }
  ];
  const plan = runAiJuryBudgetPlan(samples, { budget: AI_JURY_TOKEN_BUDGET_PER_RUN });
  assert.ok(plan.withinBudget);
  assert.ok(plan.plannedCount >= 1);
  assert.ok(plan.skippedCount >= 1);
  assert.match(plan.promptfooNodeNote, /promptfoo/);
});
