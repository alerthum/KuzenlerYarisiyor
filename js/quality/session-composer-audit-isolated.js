import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { STAGE09_ACTIVE_GAMES } from './session-composer-audit.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const WORKER = resolve(HERE, '../../scripts/stage09-game-battery-worker.mjs');

export function runGameSessionBatteryIsolated(gameId, { sessionsPerGame = 20, timeoutMs = 240_000 } = {}) {
  const child = spawnSync(process.execPath, [WORKER, gameId, String(sessionsPerGame)], {
    cwd: resolve(HERE, '../..'),
    encoding: 'utf8',
    timeout: timeoutMs,
    maxBuffer: 16 * 1024 * 1024
  });
  if (child.error) {
    return { gameId, produced: 0, targetSessions: sessionsPerGame, underfill: sessionsPerGame, semanticRepeats: 0, ok: false, infrastructureError: child.error.message };
  }
  const text = String(child.stdout || '').trim();
  let result;
  try {
    result = JSON.parse(text || '{}');
  } catch (error) {
    return { gameId, produced: 0, targetSessions: sessionsPerGame, underfill: sessionsPerGame, semanticRepeats: 0, ok: false, infrastructureError: `worker-json:${error.message}`, stderr: String(child.stderr || '').slice(0, 2000) };
  }
  if (child.status !== 0 && result.ok !== false) result = { ...result, ok: false, infrastructureError: `worker-exit:${child.status}` };
  return result;
}

export function runAllGamesSessionBatteryIsolated({ sessionsPerGame = 20, gameIds = STAGE09_ACTIVE_GAMES, timeoutMsPerGame = 240_000 } = {}) {
  const startedAt = Date.now();
  const results = gameIds.map(gameId => runGameSessionBatteryIsolated(gameId, { sessionsPerGame, timeoutMs: timeoutMsPerGame }));
  const underfill = results.reduce((sum, row) => sum + Number(row.underfill || 0), 0);
  const semanticRepeats = results.reduce((sum, row) => sum + Number(row.semanticRepeats || 0), 0);
  const failedGames = results.filter(row => !row.ok).map(row => row.gameId);
  return Object.freeze({
    schemaVersion: '1.0',
    executionMode: 'ISOLATED_PROCESS_PER_GAME',
    sessionsPerGame,
    gameCount: gameIds.length,
    totalSessions: sessionsPerGame * gameIds.length,
    durationMs: Date.now() - startedAt,
    results: Object.freeze(results),
    underfill,
    semanticRepeats,
    failedGames: Object.freeze(failedGames),
    allGamesOnSharedComposer: true,
    meetsStageGate: underfill === 0 && semanticRepeats === 0 && failedGames.length === 0
  });
}
