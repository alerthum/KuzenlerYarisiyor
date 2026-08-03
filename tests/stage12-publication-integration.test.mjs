import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STAGE12_ACTIVE_GAMES,
  auditPublicationIntegration,
  scorePublicationIntegration
} from '../js/quality/publication-integration-gate.js';
import { createGameSession, GAME_CATALOG, isGameAvailableForProfile } from '../js/games/registry.js';

test('23 oyun ortak yayın kapılarından geçer; legacy direct publish yok', () => {
  assert.equal(STAGE12_ACTIVE_GAMES.length, 23);
  const results = [];
  let seed = 121212;
  for (const gameId of STAGE12_ACTIVE_GAMES) {
    const game = GAME_CATALOG.find((g) => g.id === gameId);
    const grade = gameId === 'lgs-foundation' || gameId === 'religion-practice' ? 8 : 6;
    const profile = { id: `s12-${gameId}`, age: Math.max(game.minAge || 8, 12), grade, skills: {} };
    if (!isGameAvailableForProfile(game, profile)) {
      results.push({ gameId, ok: false, errors: ['profile_unavailable'] });
      continue;
    }
    const session = createGameSession(gameId, profile, seed, { completedSessionCount: 2 });
    seed += 5;
    const audit = auditPublicationIntegration(session, gameId);
    results.push({ gameId, ...audit });
  }
  const score = scorePublicationIntegration(results);
  assert.equal(score.meetsStageGate, true, JSON.stringify(score.failedGames));
});
