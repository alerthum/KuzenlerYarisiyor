import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  STAGE09_SESSIONS_PER_GAME,
  STAGE09_PROFILES,
  STAGE09_SEEDS,
  STAGE09_ACTIVE_GAMES,
  runGameSessionBattery,
  runAllGamesSessionBattery
} from '../js/quality/session-composer-audit.js';
import { runAllGamesSessionBatteryIsolated } from '../js/quality/session-composer-audit-isolated.js';
import { buildStage09SourceFingerprint } from '../scripts/lib/stage09-source-fingerprint.mjs';

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

test('KANIT: güncel kaynakla 23 oyun × 500 oturum — underfill=0, semantik tekrar=0', () => {
  const reportFile = path.resolve('quality-reports/stage09-live-platform-sharded-500.json');
  assert.equal(fs.existsSync(reportFile), true, 'Önce npm run assessment:v2:stage09:500 çalıştırılmalı');
  const audit = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
  const source = buildStage09SourceFingerprint(process.cwd());
  assert.equal(audit.sourceFingerprint, source.fingerprint, 'Ağır batarya kanıtı güncel kaynak kodla eşleşmiyor');
  assert.equal(audit.sourceFileCount, source.fileCount);
  assert.equal(audit.sessionsPerGame, STAGE09_SESSIONS_PER_GAME);
  assert.equal(audit.gameCount, STAGE09_ACTIVE_GAMES.length);
  assert.equal(audit.totalSessions, STAGE09_ACTIVE_GAMES.length * STAGE09_SESSIONS_PER_GAME);
  assert.deepEqual(audit.failedGames, []);
  assert.equal(audit.underfill, 0);
  assert.equal(audit.semanticRepeats, 0);
  assert.equal(audit.allGamesOnSharedComposer, true);
  assert.equal(audit.meetsStageGate, true);
});
