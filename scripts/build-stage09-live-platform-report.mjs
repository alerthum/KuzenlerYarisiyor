import fs from 'node:fs';
import path from 'node:path';
import { runAllGamesSessionBatteryIsolated } from '../js/quality/session-composer-audit-isolated.js';

const sessionsPerGame = Number(process.argv[2] || 20);
const report = runAllGamesSessionBatteryIsolated({ sessionsPerGame, timeoutMsPerGame: Math.max(240_000, sessionsPerGame * 8_000) });
const out = path.resolve('quality-reports/stage09-live-platform-isolated-battery.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify({ ...report, generatedAt: new Date().toISOString(), productReady: false }, null, 2));
console.log(JSON.stringify({ status: report.meetsStageGate ? 'PASS' : 'RED', sessionsPerGame, gameCount: report.gameCount, totalSessions: report.totalSessions, underfill: report.underfill, semanticRepeats: report.semanticRepeats, failedGames: report.failedGames, file: out }, null, 2));
if (!report.meetsStageGate) process.exit(1);
