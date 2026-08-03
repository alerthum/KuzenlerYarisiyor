/**
 * Strict audit canlı telemetri — atomik yazma, şema, stall/abort kuralları.
 * Dışarıdan rastgele komut kabul etmez; yalnız bu modülün sabit yolları kullanılır.
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync
} from 'node:fs';
import { dirname, join } from 'node:path';

export const PROGRESS_PATH = 'quality-reports/strict-audit-progress.json';
export const LIVE_PATH = 'public/strict-audit-live.json';
export const CHECKPOINT_PATH = 'quality-reports/strict-audit-checkpoint.json';
export const DECISION_PATH = 'PRODUCT_ACCEPTANCE_DECISION.json';
export const FIXED_CORE_COMMAND = 'npm run quality:product-acceptance:strict:core';
export const TOTAL_GAMES = 23;
export const STALL_SECONDS = 120;
export const HEARTBEAT_MS = 5000;
export const GAME_BAND_HANG_MS = 120000;

export const PHASE_LABELS = Object.freeze({
  idle: 'Bekliyor',
  starting: 'Başlatılıyor',
  annual: 'Yıllık öğrenci simülasyonu',
  'annual-alt': 'Yıllık alternatif oturum',
  'annual-extra': 'Yıllık hacim tamamlama',
  class30: '30 kişilik sınıf simülasyonu',
  perceived: 'Algılanan çeşitlilik',
  contentReview: 'Gerçek içerik inceleme',
  session: 'Oturum üretimi',
  audit: 'Ürün kabul denetimi',
  done: 'Tamamlandı'
});

export function createEmptyLiveState(overrides = {}) {
  const now = new Date().toISOString();
  return {
    schemaVersion: '1.0',
    runId: null,
    command: FIXED_CORE_COMMAND,
    status: 'IDLE',
    pid: 0,
    startedAt: null,
    updatedAt: now,
    lastHeartbeatAt: null,
    finishedAt: null,
    elapsedSeconds: 0,
    phase: 'idle',
    phaseLabel: PHASE_LABELS.idle,
    currentGameId: null,
    currentGameName: null,
    currentGrade: null,
    currentGradeBand: null,
    currentSessionIndex: 0,
    currentSessionTarget: 0,
    completedGames: 0,
    totalGames: TOTAL_GAMES,
    completedWorkUnits: 0,
    totalWorkUnits: null,
    progressPercent: null,
    attemptedCandidates: 0,
    acceptedCandidates: 0,
    rejectedCandidates: 0,
    underfillCount: 0,
    semanticRepeatCount: 0,
    lastCompletedStep: null,
    lastActivityMessage: 'Canlı denetim henüz başlamadı.',
    exitCode: null,
    lastError: null,
    hangFail: null,
    checkpoint: {
      lastCompletedGameId: null,
      lastCompletedGradeBand: null,
      nextGameId: null,
      nextGradeBand: null,
      completedPhases: [],
      completedGames: [],
      completedGameBands: []
    },
    recentEvents: [],
    ...overrides
  };
}

/** Atomik JSON yazımı: .tmp → rename. Tarayıcı yarım JSON okumaz. */
export function atomicWriteJson(filePath, data) {
  const dir = dirname(filePath);
  mkdirSync(dir, { recursive: true });
  const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  const payload = `${JSON.stringify(data, null, 2)}\n`;
  writeFileSync(tmp, payload, 'utf8');
  try {
    renameSync(tmp, filePath);
  } catch {
    // Windows: hedef kilitliyse unlink+rename dene
    try { unlinkSync(filePath); } catch { /* ignore */ }
    renameSync(tmp, filePath);
  }
  return filePath;
}

export function readJsonSafe(filePath, fallback = null) {
  try {
    if (!existsSync(filePath)) return fallback;
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

export function gradeBandFromGrade(grade) {
  const g = Number(grade);
  if (!Number.isFinite(g)) return null;
  if (g <= 2) return '1-2';
  if (g <= 5) return '3-5';
  if (g <= 8) return '6-8';
  return '9-12';
}

export function pushRecentEvent(state, level, message) {
  const events = Array.isArray(state.recentEvents) ? [...state.recentEvents] : [];
  events.push({
    time: new Date().toISOString(),
    level: level || 'INFO',
    message: String(message || '')
  });
  state.recentEvents = events.slice(-20);
  return state;
}

export function computeElapsedSeconds(startedAt, nowMs = Date.now()) {
  if (!startedAt) return 0;
  const t = Date.parse(startedAt);
  if (!Number.isFinite(t)) return 0;
  return Math.max(0, Math.floor((nowMs - t) / 1000));
}

export function computeProgressPercent(completedWorkUnits, totalWorkUnits) {
  const total = Number(totalWorkUnits);
  const done = Number(completedWorkUnits);
  if (!Number.isFinite(total) || total <= 0) return null;
  if (!Number.isFinite(done) || done < 0) return 0;
  return Math.min(100, Math.round((done / total) * 1000) / 10);
}

/** Bilinen full strict iş birimleri (oturum sayıları). */
export function expectedFullWorkUnits() {
  const annual = 36 * 20;
  const class30 = 30 * 36;
  const perceived = TOTAL_GAMES * 20;
  const content = TOTAL_GAMES * 4 * 20;
  return annual + class30 + perceived + content;
}

export function detectStall(state, { nowMs = Date.now(), stallSeconds = STALL_SECONDS, processAlive = true } = {}) {
  if (!state || !['RUNNING', 'STARTING', 'STALLED'].includes(state.status)) {
    return { stalled: false, silenceSeconds: 0 };
  }
  const hb = Date.parse(state.lastHeartbeatAt || state.updatedAt || 0);
  const silenceSeconds = Number.isFinite(hb) ? Math.floor((nowMs - hb) / 1000) : stallSeconds + 1;
  if (processAlive && silenceSeconds >= stallSeconds) {
    return { stalled: true, silenceSeconds };
  }
  return { stalled: false, silenceSeconds: Math.max(0, silenceSeconds) };
}

export function finalizeStatusFromExit({
  exitCode,
  decisionPath = DECISION_PATH,
  requiredReports = [
    'quality-reports/product-acceptance/annual-student.json',
    'quality-reports/product-acceptance/class-30.json',
    'quality-reports/product-acceptance/perceived-diversity.json',
    'quality-reports/product-acceptance/content-review-samples.json'
  ]
} = {}) {
  if (exitCode == null) return { status: 'ABORTED', reason: 'exit_code_missing' };
  if (exitCode !== 0) return { status: 'FAIL', reason: `exit_${exitCode}` };
  const decision = readJsonSafe(decisionPath, null);
  const reportsOk = requiredReports.every((p) => existsSync(p));
  if (!decision || decision.decision !== 'PASS' || decision.productReady !== true || !reportsOk) {
    return {
      status: 'FAIL',
      reason: !reportsOk
        ? 'required_reports_missing'
        : (decision?.decision !== 'PASS' ? 'gate_not_pass' : 'productReady_false')
    };
  }
  return { status: 'PASS', reason: 'exit_0_and_gates_pass' };
}

export function applyProgressEventToLive(live, event, { gameNames = {} } = {}) {
  if (!live || !event) return live;
  const next = { ...live };
  next.updatedAt = new Date().toISOString();
  if (event.phase) {
    next.phase = event.phase;
    next.phaseLabel = PHASE_LABELS[event.phase] || event.phase;
  }
  if (event.gameId && event.gameId !== 'annual-student') {
    next.currentGameId = event.gameId;
    next.currentGameName = gameNames[event.gameId] || event.gameId;
  }
  if (event.grade != null) {
    next.currentGrade = event.grade;
    next.currentGradeBand = gradeBandFromGrade(event.grade);
  }
  if (event.sessionIndex != null) next.currentSessionIndex = event.sessionIndex;
  if (event.totalSessions != null) next.currentSessionTarget = event.totalSessions;

  if (event.status === 'ok' || event.status === 'underfill') {
    next.completedWorkUnits = Number(next.completedWorkUnits || 0) + 1;
    next.acceptedCandidates = Number(next.acceptedCandidates || 0) + Number(event.producedCount || 0);
    next.rejectedCandidates = Number(next.rejectedCandidates || 0) + Number(event.rejectedCandidateCount || 0);
    next.attemptedCandidates = Number(next.acceptedCandidates) + Number(next.rejectedCandidates);
    if (event.status === 'underfill') next.underfillCount = Number(next.underfillCount || 0) + 1;
    next.lastCompletedStep = `${event.gameId || '?'} oturum ${event.sessionIndex ?? '?'}`;
    next.lastActivityMessage = event.status === 'underfill'
      ? `Underfill: ${event.gameId} üretildi ${event.producedCount}/${event.requestedCount}`
      : `Oturum tamam: ${event.gameId} (${event.producedCount || 0} tur)`;
  }
  if (event.status === 'capacity_fail') {
    next.underfillCount = Number(next.underfillCount || 0) + 1;
    next.lastActivityMessage = event.note || `Kapasite FAIL: ${event.gameId}`;
    pushRecentEvent(next, 'WARN', next.lastActivityMessage);
  }
  if (event.status === 'hang_fail') {
    next.hangFail = event;
    next.lastError = 'HANG_FAIL';
    next.lastActivityMessage = `HANG_FAIL: ${event.gameId} / ${event.gradeBand || event.currentGradeBand || '?'}`;
    pushRecentEvent(next, 'ERROR', next.lastActivityMessage);
  }
  if (String(event.status || '').startsWith('phase_')) {
    next.lastCompletedStep = `${event.phase}:${event.status}`;
    next.lastActivityMessage = `${PHASE_LABELS[event.phase] || event.phase} → ${event.status}`;
    pushRecentEvent(next, event.status === 'phase_pass' ? 'SUCCESS' : 'WARN', next.lastActivityMessage);
  }
  if (event.status === 'game_complete') {
    const completed = new Set(next.checkpoint?.completedGames || []);
    if (event.gameId) completed.add(event.gameId);
    next.checkpoint = {
      ...(next.checkpoint || {}),
      lastCompletedGameId: event.gameId || next.checkpoint?.lastCompletedGameId,
      lastCompletedGradeBand: event.gradeBand || next.checkpoint?.lastCompletedGradeBand || null,
      nextGameId: event.nextGameId || null,
      nextGradeBand: event.nextGradeBand || null,
      completedGames: [...completed]
    };
    next.completedGames = completed.size;
    next.lastCompletedStep = `Oyun tamam: ${event.gameId}`;
    pushRecentEvent(next, 'SUCCESS', next.lastCompletedStep);
  }
  next.progressPercent = computeProgressPercent(next.completedWorkUnits, next.totalWorkUnits);
  next.elapsedSeconds = computeElapsedSeconds(next.startedAt);
  return next;
}

export function writeLiveAndProgress(live, progress = null) {
  atomicWriteJson(LIVE_PATH, live);
  if (progress) atomicWriteJson(PROGRESS_PATH, progress);
  if (live.checkpoint) atomicWriteJson(CHECKPOINT_PATH, {
    runId: live.runId,
    updatedAt: live.updatedAt,
    status: live.status,
    checkpoint: live.checkpoint,
    completedWorkUnits: live.completedWorkUnits,
    phase: live.phase
  });
}

export function loadCheckpoint() {
  return readJsonSafe(CHECKPOINT_PATH, null);
}

export function formatElapsed(seconds) {
  const s = Math.max(0, Number(seconds) || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h} sa ${m} dk ${r} sn`;
  if (m > 0) return `${m} dk ${r} sn`;
  return `${r} sn`;
}

export function statusLabelTr(status) {
  return ({
    IDLE: 'Bekliyor',
    STARTING: 'Başlatılıyor',
    RUNNING: 'Çalışıyor',
    PASS: 'Tamamlandı',
    FAIL: 'Başarısız',
    STALLED: 'Takılmış',
    ABORTED: 'Durdurulmuş'
  })[status] || status || 'Bekliyor';
}

/** Test/export yardımcıları için yol birleştirme */
export function resolveRepoPath(...parts) {
  return join(process.cwd(), ...parts);
}
