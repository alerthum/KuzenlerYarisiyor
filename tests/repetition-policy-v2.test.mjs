import test from 'node:test';
import assert from 'node:assert/strict';
import {
  REPETITION_POLICY_V2,
  buildBlockedSetsV1,
  buildBlockedSetsV2
} from '../js/quality/repetition-policy-v2.js';

function attempt(partial) {
  return {
    gameId: 'lgs-foundation',
    gradeBand: '8',
    academicYear: '2025-2026',
    sessionIndex: 0,
    ...partial
  };
}

test('policy v2 config is single source and forbids lifetime CX', () => {
  assert.equal(REPETITION_POLICY_V2.cognitiveExperienceId.lifetimeBan, false);
  assert.equal(REPETITION_POLICY_V2.cognitiveExperienceId.forbiddenLookbackSessions, 2);
  assert.equal(REPETITION_POLICY_V2.familyId.lifetimeBan, false);
  assert.deepEqual(REPETITION_POLICY_V2.scopes.exactQuestion, ['studentId', 'academicYear']);
});

test('V1 blocks lifetime CX; V2 only previous 2 sessions', () => {
  const attempts = [];
  for (let s = 0; s < 10; s += 1) {
    attempts.push(attempt({
      sessionIndex: s,
      cognitiveExperienceId: `cx-${s}`,
      familyId: `fam-${s % 3}`,
      skeletonId: `sk-${s}`,
      structuralId: `st-${s}`
    }));
  }
  const v1 = buildBlockedSetsV1(attempts, { gameId: 'lgs-foundation' });
  assert.equal(v1.recentCognitiveExperienceIds.size, 10);
  assert.equal(v1.lifetimeCx, true);

  const v2 = buildBlockedSetsV2(attempts, {
    gameId: 'lgs-foundation',
    gradeBand: '8',
    academicYear: '2025-2026',
    currentSessionIndex: 10
  });
  assert.equal(v2.lifetimeCx, false);
  // sessions 8 and 9 only (lookback 2)
  assert.ok(v2.recentCognitiveExperienceIds.has('cx-8'));
  assert.ok(v2.recentCognitiveExperienceIds.has('cx-9'));
  assert.equal(v2.recentCognitiveExperienceIds.has('cx-0'), false);
  assert.equal(v2.recentCognitiveExperienceIds.has('cx-7'), false);
});

test('V2 skeleton lookback is 3 sessions; structural 12', () => {
  const attempts = [];
  for (let s = 0; s < 15; s += 1) {
    attempts.push(attempt({
      sessionIndex: s,
      skeletonId: `sk-${s}`,
      structuralId: `st-${s}`,
      cognitiveExperienceId: `cx-${s}`
    }));
  }
  const v2 = buildBlockedSetsV2(attempts, {
    gameId: 'lgs-foundation',
    gradeBand: '8',
    currentSessionIndex: 15
  });
  assert.ok(v2.recentSkeletonIds.includes('sk-14'));
  assert.ok(v2.recentSkeletonIds.includes('sk-12'));
  assert.equal(v2.recentSkeletonIds.includes('sk-11'), false);
  assert.ok(v2.recentStructuralIds.has('st-3'));
  assert.equal(v2.recentStructuralIds.has('st-2'), false);
});
