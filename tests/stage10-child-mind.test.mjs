import test from 'node:test';
import assert from 'node:assert/strict';
import { STAGE10_SCORE_MIN, reviewChildMind, scoreChildMindAudit } from '../js/quality/child-mind-review.js';
import { createGameSession, GAME_CATALOG, isGameAvailableForProfile } from '../js/games/registry.js';

test('yapay dil ve öğretici olmayan soru kritik ret', () => {
  const bad = reviewChildMind({
    prompt: 'Kulüp raporu xyz123',
    explanation: '',
    options: ['a', 'b', 'c', 'd'],
    answerIndex: 0
  }, { grade: 4 });
  assert.equal(bad.criticalReject, true);
});

test('CANLI: 1–12 yaş bantlarında çocuk aklı ≥90 ve kritik ret 0', () => {
  const games = ['pattern-lab', 'meaning-hunt', 'science-lab', 'social-citizenship', 'english-vocabulary'];
  const samples = [];
  let seed = 101010;
  for (const grade of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
    for (const gameId of games) {
      const game = GAME_CATALOG.find((g) => g.id === gameId);
      const profile = { id: `s10-${gameId}-${grade}`, age: Math.max(game.minAge || 8, grade + 5), grade, skills: {} };
      if (!isGameAvailableForProfile(game, profile)) continue;
      const session = createGameSession(gameId, profile, seed, { completedSessionCount: 1 });
      seed += 3;
      for (const round of session.rounds) samples.push({ grade, round });
    }
  }
  assert.ok(samples.length >= 80);
  const audit = scoreChildMindAudit(samples);
  assert.equal(audit.criticalRejects, 0);
  assert.ok(audit.scorePercent >= STAGE10_SCORE_MIN, `score=${audit.scorePercent}`);
  assert.equal(audit.meetsStageGate, true);
});
