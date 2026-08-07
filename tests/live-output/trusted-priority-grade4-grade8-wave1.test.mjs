import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameSession } from '../../js/games/registry.js';
import {
  TRUSTED_PRIORITY_4_8_KEYS,
  TRUSTED_PRIORITY_4_8_ROUNDS
} from '../../js/assessment-v2/trusted-authored-priority-4-8-bank.js';
import { trustedLiveCell } from '../../js/assessment-v2/trusted-live-policy.js';
import { SOLVER_BACKED_PRIORITY_MATH_KEYS } from '../../js/assessment-v2/solver-backed-priority-math-bank.js';
import { EVIDENCE_BACKED_PRIORITY_TURKISH_KEYS } from '../../js/assessment-v2/evidence-backed-priority-turkish-bank.js';
import { EVIDENCE_BACKED_PRIORITY_SCIENCE_KEYS } from '../../js/assessment-v2/evidence-backed-priority-science-bank.js';
import { auditLiveOutputRound } from '../../js/quality/live-output-gate.js';

const CELLS = [
  ['social-time-travel', 8, TRUSTED_PRIORITY_4_8_KEYS.grade8History],
  ['religion-practice', 8, TRUSTED_PRIORITY_4_8_KEYS.grade8Religion],
  ['paragraph-detective', 4, EVIDENCE_BACKED_PRIORITY_TURKISH_KEYS.grade4.paragraphDetective],
  ['meaning-hunt', 4, EVIDENCE_BACKED_PRIORITY_TURKISH_KEYS.grade4.meaningHunt],
  ['problem-hunter', 4, SOLVER_BACKED_PRIORITY_MATH_KEYS.grade4.problemHunter],
  ['science-reasoning', 4, EVIDENCE_BACKED_PRIORITY_SCIENCE_KEYS.grade4.scienceReasoning],
  ['science-lab', 4, EVIDENCE_BACKED_PRIORITY_SCIENCE_KEYS.grade4.scienceLab],
  ['social-time-travel', 4, TRUSTED_PRIORITY_4_8_KEYS.grade4Social],
  ['english-vocabulary', 4, TRUSTED_PRIORITY_4_8_KEYS.grade4English],
  ['religion-practice', 4, TRUSTED_PRIORITY_4_8_KEYS.grade4Religion]
];

function profile(grade, gameId) {
  return { id:`priority:${grade}:${gameId}`, name:`${grade}. sınıf öncelikli pilot`, age:grade + 6, grade, level:10, skills:{} };
}

function session(gameId, grade, seed, seenQuestionKeys = new Set()) {
  return createGameSession(gameId, profile(grade, gameId), seed, {
    controlledLaunchPilot:true,
    completedSessionCount:1,
    seenQuestionKeys,
    attempts:[]
  });
}

test('4. ve 8. sınıf öncelik dalgası 36 yeni son-ekran sorusu içerir', () => {
  assert.equal(TRUSTED_PRIORITY_4_8_ROUNDS.length, 36);
  assert.equal(TRUSTED_PRIORITY_4_8_KEYS.grade8History.length, 6);
  assert.equal(TRUSTED_PRIORITY_4_8_KEYS.grade8Religion.length, 6);
  const authoredGrade4Groups = [
    ['paragraph-detective', TRUSTED_PRIORITY_4_8_KEYS.grade4Paragraph],
    ['meaning-hunt', TRUSTED_PRIORITY_4_8_KEYS.grade4Meaning],
    ['problem-hunter', TRUSTED_PRIORITY_4_8_KEYS.grade4Math],
    ['science-reasoning', TRUSTED_PRIORITY_4_8_KEYS.grade4Science],
    ['social-time-travel', TRUSTED_PRIORITY_4_8_KEYS.grade4Social],
    ['english-vocabulary', TRUSTED_PRIORITY_4_8_KEYS.grade4English],
    ['religion-practice', TRUSTED_PRIORITY_4_8_KEYS.grade4Religion]
  ];
  for (const [gameId, keys] of authoredGrade4Groups) {
    assert.equal(keys.length, gameId === 'paragraph-detective' || gameId === 'meaning-hunt' ? 2 : 4, `${gameId}:4`);
  }
  assert.equal(new Set(TRUSTED_PRIORITY_4_8_ROUNDS.map((round) => round.questionKey)).size, 36);
});

test('öncelikli yeni bankadaki her soru son-ekran kapısından geçer', () => {
  for (const round of TRUSTED_PRIORITY_4_8_ROUNDS) {
    const audit = auditLiveOutputRound(round, { gameId:round.gameId, grade:round.targetGrade });
    assert.equal(audit.ok, true, `${round.questionKey}: ${audit.errors.join(', ')}`);
    assert.equal(round.trustedHumanReview?.status, 'APPROVED');
    assert.equal(round.solverProof?.verified, true);
    assert.ok(round.reasoningStepCount >= 5, round.questionKey);
    assert.equal(round.distractorValidation?.diagnosticCount, 3);
    assert.ok(round.durationSeconds >= 150, round.questionKey);
  }
});

test('öncelikli hücrelerin yayın politikası banka anahtarlarıyla birebir aynıdır', () => {
  for (const [gameId, grade, keys] of CELLS) {
    const policy = trustedLiveCell(gameId, grade);
    assert.ok(policy, `${gameId}:${grade}: politika yok`);
    assert.deepEqual([...policy.keys], [...keys]);
  }
});

test('öncelikli hücreler yalnız güvenli soruları verir ve tükenince kapanır', () => {
  for (const [gameId, grade, keys] of CELLS) {
    const seen = new Set();
    for (let pass = 0; pass < 10 && seen.size < keys.length; pass += 1) {
      const next = session(gameId, grade, 2026080600 + pass, seen);
      assert.equal(next.globalQualityAudit?.premiumBank?.fallbackToLegacy, false);
      for (const round of next.rounds) {
        assert.equal(round.controlledLaunchPilot, true);
        assert.equal(round.liveOutputAudit?.ok, true, round.questionKey);
        assert.equal(seen.has(round.questionKey), false);
        seen.add(round.questionKey);
      }
    }
    assert.deepEqual(seen, new Set(keys), `${gameId}:${grade}: banka tam teslim edilmedi`);
    const exhausted = session(gameId, grade, 2026080699, seen);
    assert.equal(exhausted.rounds.length, 0, `${gameId}:${grade}: eski fallback açıldı`);
    assert.equal(exhausted.globalQualityAudit?.premiumBank?.fallbackToLegacy, false);
  }
});
