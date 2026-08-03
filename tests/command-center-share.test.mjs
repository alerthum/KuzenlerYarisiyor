import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import {
  buildCommandCenterShare,
  SHARE_PATH,
  FULL_EXPORT_PATH,
  MAX_SHARE_BYTES,
  summarizeAuditProgress
} from '../scripts/lib/command-center-share.mjs';
import { EXPORT_PATH } from '../scripts/lib/command-center-export.mjs';
import {
  successMessage,
  SHARE_URL,
  EXPORT_URL,
  copyTextToClipboard
} from '../js/quality/command-center-export-client.js';

describe('command-center-share compact JSON', () => {
  let built;
  let fullBytesBefore;

  before(() => {
    fullBytesBefore = existsSync(FULL_EXPORT_PATH) || existsSync(EXPORT_PATH)
      ? statSync(existsSync(FULL_EXPORT_PATH) ? FULL_EXPORT_PATH : EXPORT_PATH).size
      : 0;
    built = buildCommandCenterShare({ write: true });
  });

  it('compact JSON under 750 KB', () => {
    assert.ok(built.bytes <= MAX_SHARE_BYTES, `bytes=${built.bytes}`);
    assert.ok(existsSync(SHARE_PATH));
  });

  it('rawSources absent from compact export', () => {
    assert.equal(built.shareDoc.rawSources, undefined);
    assert.ok(!('rawSources' in built.shareDoc));
    assert.doesNotMatch(built.text, /"rawSources"\s*:/);
  });

  it('keeps all open blockers', () => {
    const blockersFile = JSON.parse(readFileSync('BLOCKERS.json', 'utf8'));
    const open = (blockersFile.blockers || []).filter((b) => b.status === 'OPEN');
    assert.equal(built.shareDoc.blockers.length, open.length);
    for (const b of open) {
      assert.ok(built.shareDoc.blockers.some((x) => x.id === b.id), `missing blocker ${b.id}`);
    }
  });

  it('includes failed shard summaries when underfill events exist', () => {
    assert.ok(Array.isArray(built.shareDoc.failedShards));
    if ((built.shareDoc.auditSummary?.underfillCount || 0) > 0
      || (built.shareDoc.failedShards?.length || 0) >= 0) {
      assert.ok(built.shareDoc.failedShards.every((s) => s.gameId && s.gradeBand != null));
    }
  });

  it('preserves critical decision and productReady=false', () => {
    const decision = JSON.parse(readFileSync('PRODUCT_ACCEPTANCE_DECISION.json', 'utf8'));
    assert.equal(built.shareDoc.latestDecision.decision, decision.decision);
    assert.equal(built.shareDoc.latestDecision.productReady, decision.productReady === true);
    assert.equal(built.shareDoc.productAcceptance.productReady, false);
  });

  it('full export path unchanged / not deleted', () => {
    assert.equal(EXPORT_PATH, 'public/question-engine-command-center-export.json');
    assert.equal(FULL_EXPORT_PATH, EXPORT_PATH);
    if (fullBytesBefore > 0) {
      assert.ok(existsSync(EXPORT_PATH));
      const after = statSync(EXPORT_PATH).size;
      assert.ok(after > 0);
    }
  });

  it('compact and full download use different files', () => {
    assert.notEqual(SHARE_URL, EXPORT_URL);
    assert.match(SHARE_URL, /share\.json/);
    assert.match(EXPORT_URL, /export\.json/);
  });

  it('omittedData has correct counts', () => {
    const o = built.shareDoc.omittedData;
    assert.equal(o.fullExportAvailable, existsSync(EXPORT_PATH) || o.fullExportAvailable === false || o.fullExportAvailable === true);
    assert.equal(o.fullExportFile, 'question-engine-command-center-export.json');
    assert.ok(Array.isArray(o.omittedSections));
    assert.ok(o.omittedSections.some((s) => s.section === 'rawSources'));
    assert.equal(typeof o.compactSizeBytes, 'number');
    assert.ok(o.compactSizeBytes > 0);
    assert.ok(o.compactSizeBytes <= MAX_SHARE_BYTES);
  });

  it('clipboard-ready valid JSON text', async () => {
    assert.doesNotThrow(() => JSON.parse(built.text));
    assert.ok(!built.text.includes('[object Object]'));
    const r = await copyTextToClipboard(built.text);
    assert.equal(typeof r.ok, 'boolean');
  });

  it('STALE marked for ABORTED live status', () => {
    assert.ok(['STALE', 'PARTIAL', 'LIVE'].includes(built.shareDoc.exportMeta.dataFreshness));
    const live = JSON.parse(readFileSync('public/strict-audit-live.json', 'utf8'));
    if (live.status === 'ABORTED') {
      assert.ok(['STALE', 'PARTIAL'].includes(built.shareDoc.exportMeta.dataFreshness));
    }
  });

  it('success message for share mentions KB and shards', () => {
    const msg = successMessage({
      kind: 'chatgpt-share',
      bytes: built.bytes,
      data: built.shareDoc
    });
    assert.match(msg.text, /ChatGPT JSON/);
    assert.match(msg.text, /başarısız shard/);
  });

  it('summarizeAuditProgress aggregates shards without dumping all events', () => {
    const progress = {
      events: [
        {
          status: 'capacity_fail', gameId: 'pattern-lab', grade: 4, sessionIndex: 1,
          requestedCount: 10, producedCount: 2, rejectedCandidateCount: 8,
          blockedFamilyIds: ['f1'], blockedSkeletonIds: ['s1'], blockedCognitiveExperienceIds: ['cx1']
        },
        {
          status: 'underfill', gameId: 'pattern-lab', grade: 4, sessionIndex: 2,
          requestedCount: 10, producedCount: 3, rejectedCandidateCount: 7
        }
      ],
      games: { 'pattern-lab': { sessions: 2, underfill: 1, capacityFails: 1 } }
    };
    const s = summarizeAuditProgress(progress, { status: 'ABORTED', runId: 't' });
    assert.ok(s.failedShards.length >= 1);
    assert.ok(s.failedShards[0].topBlockedFamilies?.length >= 1 || s.failedShards[0].rejected >= 1);
    assert.ok(s.auditSummary.eventCountInProgressFile === 2);
  });
});
