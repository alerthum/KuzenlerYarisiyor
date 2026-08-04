import { runGameSessionBattery } from '../js/quality/session-composer-audit.js';

const [gameId, sessionsRaw = '20', startRaw = '0'] = process.argv.slice(2);
const sessionsPerGame = Number(sessionsRaw);
const startSessionIndex = Number(startRaw);
if (!gameId || !Number.isInteger(sessionsPerGame) || sessionsPerGame < 1 || !Number.isInteger(startSessionIndex) || startSessionIndex < 0) {
  console.error('usage: node scripts/stage09-game-battery-worker.mjs <gameId> <sessionsPerGame> [startSessionIndex]');
  process.exit(2);
}
const startedAt = Date.now();
const result = runGameSessionBattery(gameId, { sessionsPerGame, startSessionIndex });
process.stdout.write(JSON.stringify({ ...result, startSessionIndex, durationMs: Date.now() - startedAt }));
process.exit(result.ok ? 0 : 1);
