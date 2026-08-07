import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TRUSTED_G8_SCIENCE_DEEP_KEYS,
  TRUSTED_G8_SCIENCE_DEEP_ROUNDS
} from '../../js/assessment-v2/trusted-authored-g8-science-deep-bank.js';
import { createGameSession } from '../../js/games/registry.js';
import { EVIDENCE_BACKED_PRIORITY_SCIENCE_KEYS } from '../../js/assessment-v2/evidence-backed-priority-science-bank.js';
import { auditLiveOutputRound, normalizeTrustedLiveRound } from '../../js/quality/live-output-gate.js';

const profile = { id: 'trusted-g8-science-deep', name: '8. Sınıf Fen Testi', age: 14, grade: 8, level: 10, skills: {} };

test('8. sınıf güvenli fen bankası 12 insan-onaylı çoklu kanıt sorusu içerir', () => {
  assert.equal(TRUSTED_G8_SCIENCE_DEEP_ROUNDS.length, 12);
  assert.equal(TRUSTED_G8_SCIENCE_DEEP_KEYS.length, 12);
  assert.equal(new Set(TRUSTED_G8_SCIENCE_DEEP_KEYS).size, 12);

  for (const round of TRUSTED_G8_SCIENCE_DEEP_ROUNDS) {
    assert.equal(round.trustedHumanReview?.status, 'APPROVED', round.questionKey);
    assert.equal(round.trustedHumanReview?.difficultyVerdict, 'HARD', round.questionKey);
    assert.equal(round.intendedDifficultyBand, 'LGS_HIGH', round.questionKey);
    assert.equal(round.solverProof?.verified, true, round.questionKey);
    assert.equal(round.difficulty, 5, round.questionKey);
    assert.ok(round.authoredReasoningStepCount >= 4, round.questionKey);
    assert.ok(round.reasoningStepCount >= 5, round.questionKey);
    assert.equal(round.options.length, 4, round.questionKey);
    assert.equal(new Set(round.options).size, 4, round.questionKey);
    assert.equal(round.optionDiagnostics.filter((row) => !row.isCorrect && row.misconceptionId).length, 3, round.questionKey);

    const normalized = normalizeTrustedLiveRound(round, { gameId: 'science-reasoning', grade: 8 });
    const audit = auditLiveOutputRound(normalized, { gameId: 'science-reasoning', grade: 8 });
    assert.equal(audit.ok, true, `${round.questionKey}: ${audit.errors.join(',')}`);
  }
});

test('sabit 12 soruluk Fen bankası golden sample olarak kalır; canlı Fen Akıl Yürütme 26 motor çıktısını teslim eder', () => {
  const expected=EVIDENCE_BACKED_PRIORITY_SCIENCE_KEYS.grade8.scienceReasoning;
  const seen=new Set();
  for(let index=0;index<20&&seen.size<expected.length;index+=1){
    const session=createGameSession('science-reasoning',profile,2026081201+index,{controlledLaunchPilot:true,completedSessionCount:index+1,seenQuestionKeys:seen,attempts:[]});
    session.rounds.forEach((round)=>seen.add(round.questionKey));
    assert.equal(session.globalQualityAudit?.premiumBank?.fallbackToLegacy,false);
  }
  assert.deepEqual(seen,new Set(expected));
  const exhausted=createGameSession('science-reasoning',profile,2026081299,{controlledLaunchPilot:true,completedSessionCount:21,seenQuestionKeys:seen,attempts:[]});
  assert.equal(exhausted.rounds.length,0);
  assert.equal(exhausted.globalQualityAudit?.premiumBank?.fallbackToLegacy,false);
});
