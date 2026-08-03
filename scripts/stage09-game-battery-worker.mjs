import { runGameSessionBattery } from '../js/quality/session-composer-audit.js';

const [gameId, sessionsRaw = '20'] = process.argv.slice(2);
const sessionsPerGame = Number(sessionsRaw);
if (!gameId || !Number.isInteger(sessionsPerGame) || sessionsPerGame < 1) {
  console.error('usage: node scripts/stage09-game-battery-worker.mjs <gameId> <sessionsPerGame>');
  process.exit(2);
}
const startedAt = Date.now();
const result = runGameSessionBattery(gameId, { sessionsPerGame });
process.stdout.write(JSON.stringify({ ...result, durationMs: Date.now() - startedAt }));
process.exit(result.ok ? 0 : 1);
