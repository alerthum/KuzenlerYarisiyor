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
import { runAllGamesSessionBatteryIsolated } from '../js/quality/session-composer-audit-isolated.js';

test('Aşama 09 sabitleri: 500 oturum, 6 profil, 3 seed, 23 oyun', () => {
  assert.equal(STAGE09_SESSIONS_PER_GAME, 500);
  assert.equal(STAGE09_PROFILES.length, 6);
  assert.equal(STAGE09_SEEDS.length, 3);
  assert.equal(STAGE09_ACTIVE_GAMES.length, 23);
});

test('smoke: her oyunda 20 oturum underfill=0 ve semantik tekrar=0', { timeout: 900_000 }, () => {
  const audit = runAllGamesSessionBatteryIsolated({ sessionsPerGame: 20 });
  assert.equal(audit.failedGames.length, 0, JSON.stringify(audit.results.filter(row => !row.ok).slice(0, 5)));
  assert.equal(audit.underfill, 0);
  assert.equal(audit.semanticRepeats, 0);
});

test('CANLI: 23 oyun × 500 oturum — underfill=0, semantik tekrar=0', { timeout: 3_600_000 }, () => {
  const audit = runAllGamesSessionBatteryIsolated({
    sessionsPerGame: STAGE09_SESSIONS_PER_GAME,
    timeoutMsPerGame: 900_000
  });
  for (const result of audit.results) console.log(`stage09 ${result.gameId}: ${result.ok ? 'OK' : 'FAIL'} under=${result.underfill} ms=${result.durationMs || 0}`);
  assert.equal(audit.failedGames.length, 0, JSON.stringify(audit.results.filter(row => !row.ok).slice(0, 3)));
  assert.equal(audit.underfill, 0);
  assert.equal(audit.semanticRepeats, 0);
  assert.equal(audit.allGamesOnSharedComposer, true);
});
