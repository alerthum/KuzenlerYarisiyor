import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateReleaseGate } from '../js/quality/release-scoring-gate.js';

const strongEvidence = {
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

test('kritik ihlalde puandan bağımsız FAIL', () => {
  const gate = evaluateReleaseGate({
    cognitiveDepthScore: 99,
    optionQualityScore: 99,
    accuracyPercent: 100,
    childMindScore: 99,
    grade3PlusEasyMediumPublishedCount: 2,
    sessionSemanticRepeatCount: 0,
    irrelevantOptionCount: 0,
    formCueGiveawayCount: 0
  }, { openCriticalCount: 0, openHighCount: 0 }, strongEvidence);
  assert.equal(gate.decision, 'FAIL');
  assert.ok(gate.criticalFailures.includes('easy_medium_published'));
});

test('HIGH blocker varken genel kapı FAIL', () => {
  const gate = evaluateReleaseGate({
    cognitiveDepthScore: 99,
    optionQualityScore: 99,
    accuracyPercent: 100,
    childMindScore: 99,
    grade3PlusEasyMediumPublishedCount: 0,
    sessionSemanticRepeatCount: 0,
    irrelevantOptionCount: 0,
    formCueGiveawayCount: 0
  }, { openCriticalCount: 0, openHighCount: 1 }, strongEvidence);
  assert.equal(gate.decision, 'FAIL');
});

test('eşikler ve kanıt sağlandığında PASS', () => {
  const gate = evaluateReleaseGate({
    cognitiveDepthScore: 96,
    optionQualityScore: 97,
    accuracyPercent: 100,
    childMindScore: 93,
    grade3PlusEasyMediumPublishedCount: 0,
    sessionSemanticRepeatCount: 0,
    irrelevantOptionCount: 0,
    formCueGiveawayCount: 0
  }, { openCriticalCount: 0, openHighCount: 0 }, strongEvidence);
  assert.equal(gate.decision, 'PASS');
  assert.ok(gate.overallScorePercent >= 90);
});
