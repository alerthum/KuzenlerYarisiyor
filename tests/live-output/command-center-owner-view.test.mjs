import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../../js/platform/firebase-platform.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../../css/styles.css', import.meta.url), 'utf8');

test('Komuta Merkezi ana görünümü gerçek güvenli kapsamı sade metriklerle gösterir', () => {
  for (const label of [
    'ÜRÜN DURUMU',
    'Güvenli oyun',
    'Güvenli sınıf-oyun hücresi',
    'Benzersiz onaylı soru',
    'Onaylı soru ataması',
    'Son ekran incelemesi',
    'Kapalı kapsam grubu',
    'Şu anda yapılan iş',
    'Sıradaki kesin adım'
  ]) assert.match(source, new RegExp(label, 'i'), label);
  assert.match(source, /KISMİ GÜVENLİ PİLOT/);
  assert.match(source, /eski fallback kapalı/i);
});

test('Komuta Merkezi teknik ayrıntıları kapalı bölümde tutar ve metrik kartları responsive akar', () => {
  assert.match(source, /<details class="admin-details command-center-details">/);
  assert.match(source, /İnsan inceleme ilerlemesi ve geçmiş göstergeler/);
  assert.match(css, /\.owner-command-metrics\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css, /@media\(max-width:1100px\).*owner-command-metrics\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/s);
  assert.match(css, /@media\(max-width:460px\).*owner-command-metrics.*grid-template-columns:1fr/s);
});


test('Canlı durum özeti kompakt share belgesinden null olmayan güncel yayın gerçeği üretir', async () => {
  const { buildLiveSummaryFromExport } = await import('../../js/quality/command-center-export-client.js');
  const summary = buildLiveSummaryFromExport({
    exportMeta: { projectName: 'Zihin Arenası', appVersion: 'test', dataFreshness: 'LIVE' },
    currentTruth: {
      status: 'PARTIAL_SAFE_PILOT', wholeProductReady: false, productReady: false,
      partialSafePilotAllowed: true, publicationMode: 'EXPLICIT_TRUSTED_CELL_WHITELIST',
      fallbackToLegacyAllowed: false, safeGameCount: 7, totalGameCount: 23,
      safeCellCount: 14, approvedQuestionAssignments: 161, uniqueApprovedQuestionCount: 121,
      finalSurfaceReview: { status: 'PASS', reviewed: 161, failed: 0, legacyFallbackDetected: false }
    },
    currentWork: { currentTask: '6. sınıf çekirdeği', nextAction: 'Türkçe bankasını yaz' },
    liveProgress: { status: 'PASS', phaseLabel: '7–8. SINIF', progressPercent: 100, recentEvents: [] },
    currentBlockers: [{ id: 'G6', severity: 'BLOCKING_SCOPE', title: '6. sınıf', reason: 'İnceleme bekliyor' }]
  });
  assert.equal(summary.kind, 'trusted-live-status-summary');
  assert.equal(summary.status, 'PARTIAL_SAFE_PILOT');
  assert.equal(summary.safeGameCount, 7);
  assert.equal(summary.safeCellCount, 14);
  assert.equal(summary.approvedQuestionAssignments, 161);
  assert.equal(summary.uniqueApprovedQuestionCount, 121);
  assert.equal(summary.currentTask, '6. sınıf çekirdeği');
  assert.equal(summary.nextAction, 'Türkçe bankasını yaz');
  assert.equal(summary.finalSurfaceReview.status, 'PASS');
  assert.equal(summary.blockers.length, 1);
});

test('Admin açılışında eski Firestore sağlık taraması otomatik çalışmaz', () => {
  assert.doesNotMatch(source, /if \(isRealAdmin\) applyAdminQuestionHealthSweep\(\)/);
  assert.match(source, /Eski Phase5I Firestore sağlık taraması otomatik çalıştırılmaz/);
});


test('Tamamlanmış canlı işlem gereksiz 5 saniyelik polling başlatmaz', () => {
  assert.match(source, /shouldPollStrictAuditLive/);
  assert.match(source, /\['STARTING', 'RUNNING', 'STALLED'\]/);
  assert.match(source, /!shouldPollStrictAuditLive\(strictAuditLiveCache\?\.status\)/);
});

test('Yerel CSP Firebase source-map bağlantısını engellemez', () => {
  const server = readFileSync(new URL('../../server.mjs', import.meta.url), 'utf8');
  assert.match(server, /connect-src[^\r\n]+https:\/\/www\.gstatic\.com/);
});


test('Modern PWA meta etiketi deprecated uyarısını kaldırır', () => {
  const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
  assert.match(html, /<meta name="mobile-web-app-capable" content="yes">/);
  assert.match(html, /<meta name="apple-mobile-web-app-capable" content="yes">/);
});
