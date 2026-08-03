import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { evaluateFinalEvidence, assertEvidenceAllowsPass } from '../js/quality/final-evidence-gate.js';
import { evaluateReleaseGate } from '../js/quality/release-scoring-gate.js';

test('kanıt yetersizken PASS üretilmez; 23x500 metni sayılmaz', () => {
  const weak = {
    actual: {
      minSessionsPerGame: 5,
      gamesMeetingSessionTarget: 0,
      solverSamples: 805,
      optionSamples: 685,
      mutationScorePercent: 45.22,
      fullE2E: false,
      childMindStructuredBands: false
    }
  };
  const verdict = evaluateFinalEvidence(weak);
  assert.equal(verdict.adequate, false);
  assert.ok(verdict.gaps.some((g) => g.includes('sessions:5/500')));
  const gate = evaluateReleaseGate({
    cognitiveDepthScore: 100,
    optionQualityScore: 100,
    accuracyPercent: 100,
    childMindScore: 100,
    grade3PlusEasyMediumPublishedCount: 0,
    sessionSemanticRepeatCount: 0,
    irrelevantOptionCount: 0,
    formCueGiveawayCount: 0
  }, { openCriticalCount: 0, openHighCount: 0 }, weak);
  assert.equal(gate.decision, 'FAIL');
  assert.equal(gate.autoReturnToStage14, true);
  assert.equal(gate.overallScorePercent, null);
  assert.equal(gate.finalEvidenceAdequacy, 'FAIL');
});

test('FINAL_EVIDENCE_INDEX.json gerçek sayaç taşır ve adequacy ile uyumludur', () => {
  const index = JSON.parse(readFileSync('FINAL_EVIDENCE_INDEX.json', 'utf8'));
  assert.ok(index.actual);
  assert.ok(Number.isFinite(index.actual.minSessionsPerGame));
  assert.ok(Number.isFinite(index.actual.solverSamples));
  assert.ok(Number.isFinite(index.actual.optionSamples));
  const check = assertEvidenceAllowsPass(index);
  assert.equal(check.ok, index.finalEvidenceAdequacy === 'PASS');
  assert.equal(check.decision, index.finalEvidenceAdequacy === 'PASS' ? 'PASS' : 'FAIL');
});

test('yeterli kanıtta PASS yolu açık', () => {
  const strong = {
    actual: {
      minSessionsPerGame: 500,
      gamesMeetingSessionTarget: 23,
      solverSamples: 50_000,
      optionSamples: 10_000,
      mutationScorePercent: 91,
      fullE2E: true,
      childMindStructuredBands: true,
      underfillCount: 0,
      sessionSemanticRepeatCount: 0
    }
  };
  assert.equal(evaluateFinalEvidence(strong).adequate, true);
  const gate = evaluateReleaseGate({
    cognitiveDepthScore: 96,
    optionQualityScore: 97,
    accuracyPercent: 100,
    childMindScore: 93,
    grade3PlusEasyMediumPublishedCount: 0,
    sessionSemanticRepeatCount: 0,
    irrelevantOptionCount: 0,
    formCueGiveawayCount: 0
  }, { openCriticalCount: 0, openHighCount: 0 }, strong);
  assert.equal(gate.decision, 'PASS');
  assert.equal(gate.autoReturnToStage14, false);
  assert.ok(gate.overallScorePercent >= 90);
});
