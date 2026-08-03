import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { evaluateReleaseGate } from '../js/quality/release-scoring-gate.js';
import { STAGE09_ACTIVE_GAMES } from '../js/quality/session-composer-audit.js';

test('FINAL_RELEASE_DECISION yalnız gerçek FINAL_EVIDENCE_INDEX sayaçlarıyla PASS olabilir', () => {
  assert.equal(STAGE09_ACTIVE_GAMES.length, 23);
  const decisionPath = join(process.cwd(), 'FINAL_RELEASE_DECISION.json');
  const indexPath = join(process.cwd(), 'FINAL_EVIDENCE_INDEX.json');
  assert.ok(existsSync(indexPath), 'FINAL_EVIDENCE_INDEX.json yok');
  const index = JSON.parse(readFileSync(indexPath, 'utf8'));
  const metrics = {
    cognitiveDepthScore: index.partialScores?.cognitiveDepthScore ?? null,
    optionQualityScore: index.partialScores?.optionQualityScore ?? null,
    accuracyPercent: index.partialScores?.accuracyPercent ?? null,
    childMindScore: index.partialScores?.childMindScore ?? null,
    semanticRepeatCount: index.actual?.sessionSemanticRepeatCount ?? 0,
    underfillCount: index.actual?.underfillCount ?? 0,
    grade3PlusEasyMediumPublishedCount: index.partialScores?.grade3PlusEasyMediumPublishedCount ?? 0,
    irrelevantOptionCount: index.partialScores?.irrelevantOptionCount ?? 0,
    formCueGiveawayCount: index.partialScores?.formCueGiveawayCount ?? 0,
    sessionSemanticRepeatCount: index.actual?.sessionSemanticRepeatCount ?? 0
  };
  const gate = evaluateReleaseGate(metrics, { openCriticalCount: 0, openHighCount: index.finalEvidenceAdequacy === 'PASS' ? 0 : 1 }, index);
  const payload = {
    schemaVersion: '1.0',
    decidedAt: new Date().toISOString(),
    decision: gate.decision,
    autoReturnToStage14: gate.autoReturnToStage14,
    overallScorePercent: gate.overallScorePercent,
    overallScoreDisplay: gate.overallScoreDisplay,
    finalEvidenceAdequacy: gate.finalEvidenceAdequacy,
    criticalFailures: gate.criticalFailures,
    evidenceGaps: gate.evidenceGaps,
    evidence: {
      index: 'FINAL_EVIDENCE_INDEX.json',
      actual: gate.evidenceActual
    },
    note: gate.decision === 'PASS'
      ? 'Gerçek final kanıt eşikleri karşılandı.'
      : 'FAIL — Aşama 14 final kanıt düzeltmesine dön.'
  };
  writeFileSync(decisionPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  const read = JSON.parse(readFileSync(decisionPath, 'utf8'));
  // Eşikler tamam değilse PASS yazılmış olamaz.
  if (index.finalEvidenceAdequacy !== 'PASS') {
    assert.equal(read.decision, 'FAIL');
    assert.equal(read.autoReturnToStage14, true);
  } else {
    assert.equal(read.decision, 'PASS');
  }
});
