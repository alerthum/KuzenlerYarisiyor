import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STAGE09_SESSIONS_PER_GAME,
  STAGE09_PROFILES,
  STAGE09_SEEDS,
  STAGE09_ACTIVE_GAMES,
  runGameSessionBattery,
  runAllGamesSessionBattery
} from '../js/quality/session-composer-audit.js';

test('Aşama 09 sabitleri: 500 oturum, 6 profil, 3 seed, 23 oyun', () => {
  assert.equal(STAGE09_SESSIONS_PER_GAME, 500);
  assert.equal(STAGE09_PROFILES.length, 6);
  assert.equal(STAGE09_SEEDS.length, 3);
  assert.equal(STAGE09_ACTIVE_GAMES.length, 23);
});

test('smoke: her oyunda 20 oturum underfill=0 ve semantik tekrar=0', () => {
  const bad = [];
  for (const gameId of STAGE09_ACTIVE_GAMES) {
    const result = runGameSessionBattery(gameId, { sessionsPerGame: 20 });
    if (!result.ok) bad.push(result);
  }
  assert.equal(bad.length, 0, JSON.stringify(bad.slice(0, 5)));
});

test('CANLI: 23 oyun × 500 oturum — underfill=0, semantik tekrar=0', { timeout: 2_400_000 }, async () => {
  // Ağır batarya: oyunları sırayla, ilerleme loglu.
  const bad = [];
  let underfill = 0;
  let semanticRepeats = 0;
  for (const gameId of STAGE09_ACTIVE_GAMES) {
    const result = runGameSessionBattery(gameId, { sessionsPerGame: STAGE09_SESSIONS_PER_GAME });
    underfill += result.underfill || 0;
    semanticRepeats += result.semanticRepeats || 0;
    if (!result.ok) bad.push(result);
    console.log(`stage09 ${gameId}: ${result.ok ? 'OK' : 'FAIL'} under=${result.underfill}`);
  }
  assert.equal(bad.length, 0, JSON.stringify(bad.slice(0, 3)));
  assert.equal(underfill, 0);
  assert.equal(semanticRepeats, 0);
  const audit = runAllGamesSessionBattery({ sessionsPerGame: 1 });
  assert.equal(audit.allGamesOnSharedComposer, true);
});
