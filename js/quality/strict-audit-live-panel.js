/**
 * Soru Motoru Komuta Merkezi — Canlı Motor Çalışması paneli (saf HTML).
 * Firebase'e bağımlı değildir; test edilebilir.
 */

const STATUS_TR = {
  IDLE: 'Bekliyor',
  STARTING: 'Başlatılıyor',
  RUNNING: 'Çalışıyor',
  PASS: 'Tamamlandı',
  FAIL: 'Başarısız',
  STALLED: 'Takılmış',
  ABORTED: 'Durdurulmuş'
};

function esc(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));
}

export function formatElapsedTr(seconds) {
  const s = Math.max(0, Number(seconds) || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h} sa ${m} dk ${r} sn`;
  if (m > 0) return `${m} dk ${r} sn`;
  return `${r} sn`;
}

export function secondsSince(iso, nowMs = Date.now()) {
  const t = Date.parse(iso || '');
  if (!Number.isFinite(t)) return null;
  return Math.max(0, Math.floor((nowMs - t) / 1000));
}

export function statusBadgeClass(status) {
  if (status === 'PASS' || status === 'RUNNING') return 'green';
  if (status === 'STALLED') return 'orange';
  if (status === 'FAIL' || status === 'ABORTED') return 'orange';
  return 'cyan';
}

/**
 * @param {object|null} live
 * @param {{ fetchError?: string|null, nowMs?: number }} opts
 */
export function renderStrictAuditLivePanelHtml(live, opts = {}) {
  const nowMs = opts.nowMs || Date.now();
  const fetchError = opts.fetchError || null;

  if (!live && fetchError) {
    return `<section class="analytics-section live-audit-panel" data-testid="live-audit-panel">
      <h3>Canlı Motor Çalışması</h3>
      <div class="empty-state">Canlı veri geçici olarak okunamadı. ${esc(fetchError)}</div>
    </section>`;
  }

  const state = live || {
    status: 'IDLE',
    lastActivityMessage: 'Canlı denetim henüz başlamadı.',
    recentEvents: [],
    checkpoint: {}
  };

  const status = state.status || 'IDLE';
  const statusLabel = STATUS_TR[status] || status;
  const badge = statusBadgeClass(status);
  const elapsed = formatElapsedTr(state.elapsedSeconds ?? secondsSince(state.startedAt, nowMs) ?? 0);
  const sinceHb = secondsSince(state.lastHeartbeatAt || state.updatedAt, nowMs);
  const lastMove = sinceHb == null ? '—' : `${sinceHb} saniye önce güncellendi`;
  const whereGame = state.currentGameName || state.currentGameId || '—';
  const band = state.currentGradeBand || (state.currentGrade != null ? `sınıf ${state.currentGrade}` : '—');
  const sessionLine = (state.currentSessionTarget || state.currentSessionIndex)
    ? `oturum ${Number(state.currentSessionIndex || 0) + 1} / ${state.currentSessionTarget || '?'}`
    : 'oturum —';
  const gamesLine = `${Number(state.completedGames || 0)} / ${Number(state.totalGames || 23)}`;
  const pct = state.progressPercent;
  const progressBar = (pct == null || !Number.isFinite(Number(state.totalWorkUnits)))
    ? `<div class="live-audit-progress indeterminate"><span>İlerleme belirsiz (toplam iş birimi yok)</span></div>`
    : `<div class="live-audit-progress"><div class="live-audit-progress-bar" style="width:${Math.min(100, Math.max(0, Number(pct)))}%"></div><span>%${esc(String(pct))}</span></div>`;

  let alertHtml = '';
  if (status === 'STALLED') {
    const mins = Math.max(1, Math.floor((sinceHb || 120) / 60));
    alertHtml = `<div class="live-audit-alert stalled" role="alert">Bu işlem ${mins} dakikadır ilerlemiyor.</div>`;
  } else if (status === 'ABORTED') {
    alertHtml = `<div class="live-audit-alert aborted" role="alert">Çalışma tamamlanmadan durmuş.</div>`;
  } else if (fetchError) {
    alertHtml = `<div class="live-audit-alert warn" role="alert">Canlı veri geçici olarak okunamadı. Son geçerli durum gösteriliyor.</div>`;
  }

  const events = Array.isArray(state.recentEvents) ? state.recentEvents.slice(-10).reverse() : [];
  const eventsHtml = events.length
    ? `<ul class="live-audit-events">${events.map((e) => `<li><span class="badge ${e.level === 'ERROR' ? 'orange' : e.level === 'SUCCESS' ? 'green' : 'cyan'}">${esc(e.level || 'INFO')}</span> <small>${esc(e.time ? new Date(e.time).toLocaleTimeString('tr-TR') : '')}</small> ${esc(e.message || '')}</li>`).join('')}</ul>`
    : '<p class="muted">Henüz canlı olay yok.</p>';

  const nextStep = state.checkpoint?.nextGameId
    || state.checkpoint?.nextGradeBand
    || (status === 'RUNNING' || status === 'STARTING' ? (state.phaseLabel || state.phase || 'devam') : '—');

  const liveRunning = ['RUNNING', 'STARTING', 'STALLED'].includes(status);
  const workType = state.workType || (status === 'ABORTED' && state.currentTask ? 'DEVELOPMENT' : null);
  const workTypeLabel = workType || 'AUDIT';

  const devBlock = (workType || state.currentTask || state.rootCause) ? `
    <div class="platform-metric-grid mt-12" data-testid="live-dev-grid">
      <div class="metric-card"><div class="metric-label">Çalışma türü</div><div class="metric-value" style="font-size:1rem">${esc(workTypeLabel)}</div></div>
      <div class="metric-card"><div class="metric-label">Mevcut görev</div><div class="metric-value" style="font-size:0.95rem">${esc(state.currentTask || '—')}</div></div>
      <div class="metric-card"><div class="metric-label">Kök neden</div><div class="metric-value" style="font-size:0.9rem">${esc(state.rootCause || '—')}</div></div>
      <div class="metric-card"><div class="metric-label">Önceki → yeni fillRate</div><div class="metric-value" style="font-size:1rem">${esc(state.previousFillRate ?? '—')} → ${esc(state.newFillRate ?? '—')}</div></div>
      <div class="metric-card"><div class="metric-label">Önceki → yeni underfill</div><div class="metric-value" style="font-size:1rem">${esc(state.previousUnderfill ?? '—')} → ${esc(state.newUnderfill ?? '—')}</div></div>
      <div class="metric-card"><div class="metric-label">capacityDeficit</div><div class="metric-value">${esc(state.capacityDeficit ?? '—')}</div><div class="metric-note">+blueprint: ${esc(state.addedBlueprintCount ?? 0)}</div></div>
      <div class="metric-card"><div class="metric-label">Tamamlanan shard</div><div class="metric-value" style="font-size:0.95rem">${esc(state.completedShard || '—')}</div></div>
      <div class="metric-card"><div class="metric-label">Sıradaki shard</div><div class="metric-value" style="font-size:0.95rem">${esc(state.nextShard || nextStep)}</div></div>
      <div class="metric-card"><div class="metric-label">Son gerçek test</div><div class="metric-value" style="font-size:0.95rem">${esc(state.lastRealTestResult || '—')}</div></div>
    </div>
    ${Array.isArray(state.changedFiles) && state.changedFiles.length
      ? `<p class="mt-12 muted"><strong>Değişen dosyalar:</strong> ${state.changedFiles.map((f) => `<code>${esc(f)}</code>`).join(', ')}</p>`
      : ''}
  ` : '';

  return `<section class="analytics-section live-audit-panel ${liveRunning ? 'is-live' : ''}" data-testid="live-audit-panel" data-live-status="${esc(status)}" data-work-type="${esc(workTypeLabel)}">
    <div class="section-header"><div><h3>Canlı Motor Çalışması</h3><p>Kaynak: <code>public/strict-audit-live.json</code> · 5 sn yenileme</p></div>
      <span class="badge ${badge}">${esc(statusLabel)}</span></div>
    ${alertHtml}
    <div class="platform-metric-grid">
      <div class="metric-card"><div class="metric-label">Durum</div><div class="metric-value"><span class="badge ${badge}">${esc(statusLabel)}</span></div></div>
      <div class="metric-card"><div class="metric-label">Şu anda ne yapıyor</div><div class="metric-value" style="font-size:1rem">${esc(state.currentTask || state.phaseLabel || state.phase || '—')}</div><div class="metric-note">${esc(state.lastActivityMessage || '')}</div></div>
      <div class="metric-card"><div class="metric-label">Nerede</div><div class="metric-value" style="font-size:1rem">${esc(whereGame)}</div><div class="metric-note">${esc(band)} · ${esc(sessionLine)}</div></div>
      <div class="metric-card"><div class="metric-label">Toplam geçen süre</div><div class="metric-value" style="font-size:1.1rem">${esc(elapsed)}</div><div class="metric-note">Başlangıç: ${esc(state.startedAt ? new Date(state.startedAt).toLocaleString('tr-TR') : '—')}</div></div>
      <div class="metric-card"><div class="metric-label">Son hareket</div><div class="metric-value" style="font-size:1rem">${esc(lastMove)}</div></div>
      <div class="metric-card"><div class="metric-label">Tamamlanan oyun</div><div class="metric-value">${esc(gamesLine)}</div></div>
    </div>
    ${devBlock}
    ${progressBar}
    <div class="platform-metric-grid mt-12">
      <div class="metric-card"><div class="metric-label">Denenen aday</div><div class="metric-value">${esc(state.attemptedCandidates ?? 0)}</div></div>
      <div class="metric-card"><div class="metric-label">Kabul</div><div class="metric-value">${esc(state.acceptedCandidates ?? 0)}</div></div>
      <div class="metric-card"><div class="metric-label">Red</div><div class="metric-value">${esc(state.rejectedCandidates ?? 0)}</div></div>
      <div class="metric-card"><div class="metric-label">Underfill</div><div class="metric-value">${esc(state.underfillCount ?? 0)}</div></div>
      <div class="metric-card"><div class="metric-label">Semantik tekrar</div><div class="metric-value">${esc(state.semanticRepeatCount ?? 0)}</div></div>
    </div>
    <p class="mt-12"><strong>Son tamamlanan adım:</strong> ${esc(state.completedShard || state.lastCompletedStep || '—')}</p>
    <p><strong>Sıradaki kesin adım:</strong> ${esc(state.nextShard || nextStep)}</p>
    <h4 class="mt-18">Son 10 canlı olay</h4>
    ${eventsHtml}
  </section>`;
}

/** Eski final kanıtların canlı sonuç gibi üstte gösterilmemesi için bayrak */
export function shouldDeferLegacyEvidence(live) {
  const status = live?.status;
  return ['RUNNING', 'STARTING', 'STALLED'].includes(status);
}
