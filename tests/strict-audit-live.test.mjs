import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, existsSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  atomicWriteJson,
  createEmptyLiveState,
  detectStall,
  finalizeStatusFromExit,
  applyProgressEventToLive,
  computeProgressPercent,
  STALL_SECONDS
} from '../scripts/lib/strict-audit-live-state.mjs';
import {
  renderStrictAuditLivePanelHtml,
  shouldDeferLegacyEvidence
} from '../js/quality/strict-audit-live-panel.js';

describe('strict-audit-live atomic write', () => {
  it('writes complete JSON via tmp rename', () => {
    const dir = mkdtempSync(join(tmpdir(), 'strict-live-'));
    const target = join(dir, 'live.json');
    atomicWriteJson(target, { ok: true, n: 1 });
    const raw = readFileSync(target, 'utf8');
    assert.equal(JSON.parse(raw).ok, true);
    assert.ok(!existsSync(`${target}.tmp`));
    rmSync(dir, { recursive: true, force: true });
  });
});

describe('heartbeat / stall / abort', () => {
  it('detects STALLED after silence', () => {
    const live = createEmptyLiveState({
      status: 'RUNNING',
      lastHeartbeatAt: new Date(Date.now() - (STALL_SECONDS + 5) * 1000).toISOString()
    });
    const { stalled, silenceSeconds } = detectStall(live, { processAlive: true });
    assert.equal(stalled, true);
    assert.ok(silenceSeconds >= STALL_SECONDS);
  });

  it('does not stall when heartbeat fresh', () => {
    const live = createEmptyLiveState({
      status: 'RUNNING',
      lastHeartbeatAt: new Date().toISOString()
    });
    const { stalled } = detectStall(live, { processAlive: true });
    assert.equal(stalled, false);
  });

  it('finalize ABORTED when exit code missing', () => {
    const r = finalizeStatusFromExit({ exitCode: null });
    assert.equal(r.status, 'ABORTED');
  });

  it('never PASS without exit 0 + gate decision', () => {
    const dir = mkdtempSync(join(tmpdir(), 'strict-dec-'));
    const decisionPath = join(dir, 'decision.json');
    writeFileSync(decisionPath, JSON.stringify({ decision: 'FAIL', productReady: false }), 'utf8');
    const r = finalizeStatusFromExit({
      exitCode: 0,
      decisionPath,
      requiredReports: []
    });
    assert.equal(r.status, 'FAIL');
    rmSync(dir, { recursive: true, force: true });
  });

  it('FAIL on non-zero exit', () => {
    const r = finalizeStatusFromExit({ exitCode: 2, requiredReports: [] });
    assert.equal(r.status, 'FAIL');
  });
});

describe('checkpoint resume helpers', () => {
  it('progressPercent null when total unknown', () => {
    assert.equal(computeProgressPercent(10, null), null);
    assert.equal(computeProgressPercent(5, 0), null);
  });

  it('applies game_complete into checkpoint without re-running logic', () => {
    let live = createEmptyLiveState({ status: 'RUNNING', totalWorkUnits: 100 });
    live = applyProgressEventToLive(live, {
      status: 'game_complete',
      gameId: 'pattern-lab',
      gradeBand: '3-5',
      nextGameId: 'speed-math'
    });
    assert.equal(live.checkpoint.lastCompletedGameId, 'pattern-lab');
    assert.equal(live.checkpoint.nextGameId, 'speed-math');
    assert.ok(live.checkpoint.completedGames.includes('pattern-lab'));
    assert.equal(live.completedGames, 1);
  });
});

describe('dashboard live panel', () => {
  it('renders Canlı Motor Çalışması at top content', () => {
    const html = renderStrictAuditLivePanelHtml({
      status: 'RUNNING',
      phaseLabel: 'Yıllık öğrenci simülasyonu',
      lastActivityMessage: 'oturum 10',
      currentGameId: 'pattern-lab',
      currentGameName: 'Desen Lab',
      currentGradeBand: '3-5',
      currentSessionIndex: 9,
      currentSessionTarget: 720,
      completedGames: 2,
      totalGames: 23,
      totalWorkUnits: 100,
      completedWorkUnits: 25,
      progressPercent: 25,
      attemptedCandidates: 10,
      acceptedCandidates: 8,
      rejectedCandidates: 2,
      underfillCount: 1,
      semanticRepeatCount: 0,
      startedAt: new Date().toISOString(),
      lastHeartbeatAt: new Date().toISOString(),
      elapsedSeconds: 90,
      checkpoint: { nextGameId: 'speed-math' },
      recentEvents: [{ time: new Date().toISOString(), level: 'INFO', message: 'test' }]
    });
    assert.match(html, /Canlı Motor Çalışması/);
    assert.match(html, /data-testid="live-audit-panel"/);
    assert.match(html, /Desen Lab|pattern-lab/);
    assert.match(html, /Çalışıyor/);
  });

  it('malformed/missing live does not throw; shows recovery message', () => {
    const html = renderStrictAuditLivePanelHtml(null, { fetchError: 'Unexpected token' });
    assert.match(html, /Canlı veri geçici olarak okunamadı/);
    assert.doesNotThrow(() => renderStrictAuditLivePanelHtml(undefined, { fetchError: 'x' }));
  });

  it('defers legacy evidence while live running', () => {
    assert.equal(shouldDeferLegacyEvidence({ status: 'RUNNING' }), true);
    assert.equal(shouldDeferLegacyEvidence({ status: 'PASS' }), false);
    assert.equal(shouldDeferLegacyEvidence({ status: 'IDLE' }), false);
  });

  it('STALLED shows minutes warning', () => {
    const html = renderStrictAuditLivePanelHtml({
      status: 'STALLED',
      lastHeartbeatAt: new Date(Date.now() - 200000).toISOString(),
      recentEvents: []
    });
    assert.match(html, /dakikadır ilerlemiyor/);
  });

  it('ABORTED shows stopped message', () => {
    const html = renderStrictAuditLivePanelHtml({ status: 'ABORTED', recentEvents: [] });
    assert.match(html, /tamamlanmadan durmuş/);
  });
});
