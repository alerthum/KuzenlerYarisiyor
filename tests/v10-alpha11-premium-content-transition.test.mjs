import test from 'node:test';
import assert from 'node:assert/strict';
import { transitionLegacyContent } from '../js/engines/premium-content-transition-v10.js';
import { generatePremiumGoldQuestion } from '../js/content-studio/premium-gold-content-v10.js';
import { createGameSession, getGame } from '../js/games/registry.js';

const profile = { id:'alpha11-student', age:13, grade:8, skills:{ reading:55, attention:55 } };

function toRound(question, game) {
  return {
    kind:'choice', prompt:question.prompt, context:question.context, options:question.options,
    answerIndex:question.options.indexOf(question.answerValue), explanation:question.explanation,
    hints:question.hints, skill:game.skill, difficulty:question.difficulty, questionKey:question.questionKey
  };
}

test('premium geçiş motoru eksik oturumu GOLD varyasyonlarla tamamlar', () => {
  const game = getGame('paragraph-detective');
  const result = transitionLegacyContent({
    gameId:'paragraph-detective', game, profile, sessionSeed:42, rounds:[], targetCount:3,
    generatePremiumQuestion:generatePremiumGoldQuestion, toRound
  });
  assert.equal(result.rounds.length, 3);
  assert.equal(result.audit.inserted, 3);
  assert.equal(result.audit.complete, true);
  assert.ok(result.rounds.every((round) => round.premiumTier === 'GOLD' && round.premiumMigration));
  assert.equal(new Set(result.rounds.map((round)=>round.questionKey)).size, 3);
});

test('karantinadaki premium aile geçiş havuzuna alınmaz', () => {
  const game = getGame('paragraph-detective');
  const result = transitionLegacyContent({
    gameId:'paragraph-detective', game, profile, sessionSeed:42, rounds:[], targetCount:3,
    blockedQuestionFamilies:new Set(['tr-inference-evidence']),
    generatePremiumQuestion:generatePremiumGoldQuestion, toRound
  });
  assert.ok(result.rounds.length > 0);
  assert.ok(result.audit.usedFamilyIds.every((id)=>id !== 'tr-inference-evidence'));
  assert.equal(result.audit.complete, true);
});

test('gerçek oturum kalite geçiş raporu taşır', () => {
  const session = createGameSession('paragraph-detective', profile, 1701, { completedSessionCount:2 });
  assert.ok(session.globalQualityAudit.premiumTransition);
  assert.equal(session.globalQualityAudit.premiumTransition.gameId, 'paragraph-detective');
  assert.ok(session.rounds.length > 0);
});
