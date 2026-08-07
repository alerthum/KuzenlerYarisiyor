import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameSession } from '../../js/games/registry.js';
import { auditLiveOutputRound } from '../../js/quality/live-output-gate.js';
import { trustedLiveCell } from '../../js/assessment-v2/trusted-live-policy.js';
import {
  EVIDENCE_BACKED_PRIORITY_SCIENCE_AUDIT,
  EVIDENCE_BACKED_PRIORITY_SCIENCE_KEYS,
  EVIDENCE_BACKED_PRIORITY_SCIENCE_ROUNDS
} from '../../js/assessment-v2/evidence-backed-priority-science-bank.js';

const CELLS=[
  ['science-reasoning',4,EVIDENCE_BACKED_PRIORITY_SCIENCE_KEYS.grade4.scienceReasoning],
  ['science-lab',4,EVIDENCE_BACKED_PRIORITY_SCIENCE_KEYS.grade4.scienceLab],
  ['science-reasoning',8,EVIDENCE_BACKED_PRIORITY_SCIENCE_KEYS.grade8.scienceReasoning],
  ['science-lab',8,EVIDENCE_BACKED_PRIORITY_SCIENCE_KEYS.grade8.scienceLab]
];
function profile(grade,gameId){return{id:`science-engine:${grade}:${gameId}`,name:`${grade}. sınıf Fen motor testi`,age:grade+6,grade,level:10,skills:{}};}
function session(gameId,grade,seed,seenQuestionKeys=new Set()){
  return createGameSession(gameId,profile(grade,gameId),seed,{controlledLaunchPilot:true,completedSessionCount:1,seenQuestionKeys,attempts:[]});
}

test('4. ve 8. sınıf Fen motoru 25 insan yazımı aile ve 75 kanıt-doğrulamalı çıktı üretir',()=>{
  assert.equal(EVIDENCE_BACKED_PRIORITY_SCIENCE_AUDIT.ok,true,EVIDENCE_BACKED_PRIORITY_SCIENCE_AUDIT.errors.join(','));
  assert.equal(EVIDENCE_BACKED_PRIORITY_SCIENCE_AUDIT.metrics.grade4FamilyCount,12);
  assert.equal(EVIDENCE_BACKED_PRIORITY_SCIENCE_AUDIT.metrics.grade8FamilyCount,13);
  assert.equal(EVIDENCE_BACKED_PRIORITY_SCIENCE_AUDIT.metrics.familyCount,25);
  assert.equal(EVIDENCE_BACKED_PRIORITY_SCIENCE_AUDIT.metrics.roundCount,75);
  assert.equal(EVIDENCE_BACKED_PRIORITY_SCIENCE_AUDIT.metrics.distinctSkeletonCount,75);
  assert.equal(EVIDENCE_BACKED_PRIORITY_SCIENCE_AUDIT.metrics.evidenceVerifiedCount,75);
  assert.equal(EVIDENCE_BACKED_PRIORITY_SCIENCE_AUDIT.metrics.experimentDesignCount,25);
  assert.equal(EVIDENCE_BACKED_PRIORITY_SCIENCE_AUDIT.metrics.reasoningCount,50);
});

test('Fen motoru rastgele cümle birleştirmez ve bütün son-ekranlar kalite kapısından geçer',()=>{
  assert.equal(EVIDENCE_BACKED_PRIORITY_SCIENCE_AUDIT.metrics.randomSentenceCompositionCount,0);
  for(const round of EVIDENCE_BACKED_PRIORITY_SCIENCE_ROUNDS){
    assert.equal(round.engineReview?.humanAuthoredExperimentCase,true,round.questionKey);
    assert.equal(round.evidenceProof?.verified,true,round.questionKey);
    assert.equal(round.solverProof?.verified,true,round.questionKey);
    assert.ok(round.authoredReasoningStepCount>=4,round.questionKey);
    assert.equal(round.optionDiagnostics.filter((row)=>!row.isCorrect&&row.misconceptionId).length,3,round.questionKey);
    const audit=auditLiveOutputRound(round,{gameId:round.gameId,grade:round.targetGrade});
    assert.equal(audit.ok,true,`${round.questionKey}: ${audit.errors.join(',')}`);
  }
});

test('Fen oturumlarında aynı aile art arda gelmez; çok görevli hücrelerde görev türü de tekrarlanmaz',()=>{
  for(const [gameId,grade,keys] of CELLS){
    const map=new Map(EVIDENCE_BACKED_PRIORITY_SCIENCE_ROUNDS.map((round)=>[round.questionKey,round]));
    const rounds=keys.map((key)=>map.get(key));
    const distinctExperiences=new Set(rounds.map((round)=>round.trustedExperienceType)).size;
    for(let index=1;index<rounds.length;index+=1){
      assert.notEqual(rounds[index-1].familyId,rounds[index].familyId,`${gameId}:${grade}:family:${index}`);
      if(distinctExperiences>1)assert.notEqual(rounds[index-1].trustedExperienceType,rounds[index].trustedExperienceType,`${gameId}:${grade}:task:${index}`);
    }
  }
});

test('Fen canlı politikası motor anahtarlarıyla birebir aynıdır',()=>{
  for(const [gameId,grade,keys] of CELLS){
    const policy=trustedLiveCell(gameId,grade);
    assert.ok(policy,`${gameId}:${grade}: politika yok`);
    assert.deepEqual([...policy.keys],[...keys]);
  }
});

test('Fen motor çıktıları tam teslim edilir ve sonra fail-closed kapanır',()=>{
  for(const [gameId,grade,keys] of CELLS){
    const seen=new Set();
    for(let pass=0;pass<20&&seen.size<keys.length;pass+=1){
      const next=session(gameId,grade,2026082000+pass,seen);
      assert.equal(next.globalQualityAudit?.premiumBank?.fallbackToLegacy,false);
      for(const round of next.rounds){
        assert.equal(round.liveOutputAudit?.ok,true,round.questionKey);
        assert.equal(seen.has(round.questionKey),false,round.questionKey);
        seen.add(round.questionKey);
      }
    }
    assert.deepEqual(seen,new Set(keys),`${gameId}:${grade}: motor bankası tam teslim edilmedi`);
    const exhausted=session(gameId,grade,2026082099,seen);
    assert.equal(exhausted.rounds.length,0,`${gameId}:${grade}: eski fallback açıldı`);
    assert.equal(exhausted.globalQualityAudit?.premiumBank?.fallbackToLegacy,false);
  }
});
