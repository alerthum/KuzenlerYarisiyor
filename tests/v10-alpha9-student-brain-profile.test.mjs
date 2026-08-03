import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStudentBrainProfile, brainProfileSessionPolicy } from '../js/engines/student-brain-profile-v10.js';
import { composePremiumSession } from '../js/engines/premium-session-composer-v10.js';
import { createGameSession } from '../js/games/registry.js';

const attempts = [
  ...Array.from({ length: 6 }, (_, i) => ({ correct: i < 2, thinkingPatternId: 'inference', difficulty: 3, hintsUsed: 1, elapsedSeconds: 90 })),
  ...Array.from({ length: 6 }, () => ({ correct: true, thinkingPatternId: 'comparison', difficulty: 4, hintsUsed: 0, elapsedSeconds: 35 }))
];

test('öğrenci beyin profili zayıf ve güçlü düşünme kalıplarını ayırır', () => {
  const profile = buildStudentBrainProfile(attempts);
  assert.equal(profile.evidenceLevel, 'medium');
  assert.ok(profile.weakPatterns.includes('inference'));
  assert.ok(profile.strongPatterns.includes('comparison'));
  assert.ok(profile.preferredDifficulty >= 3);
});

test('premium besteci beyin profili politikasını denetim kaydına işler', () => {
  const policy = brainProfileSessionPolicy(buildStudentBrainProfile(attempts));
  const rounds = [
    { questionKey: 'a', thinkingPatternId: 'comparison', difficulty: 3 },
    { questionKey: 'b', thinkingPatternId: 'inference', difficulty: 4 },
    { questionKey: 'c', thinkingPatternId: 'ordering', difficulty: 4 },
    { questionKey: 'd', thinkingPatternId: 'transfer', difficulty: 5 }
  ];
  const result = composePremiumSession(rounds, { targetCount: 4, brainPolicy: policy });
  assert.equal(result.audit.brainAdaptation.enabled, true);
  assert.ok(result.audit.brainAdaptation.weakPatterns.includes('inference'));
});

test('gerçek oyun oturumu öğrenci beyin profilini taşır', () => {
  const session = createGameSession('logic-station', { id: 'p1', age: 13, grade: 8, skills: {} }, 42, {
    completedSessionCount: 1,
    attempts
  });
  assert.ok(session.studentBrainProfile);
  assert.equal(session.globalQualityAudit.studentBrainProfile.sampleSize, attempts.length);
  assert.equal(session.globalQualityAudit.premiumComposition.brainAdaptation.enabled, true);
});
