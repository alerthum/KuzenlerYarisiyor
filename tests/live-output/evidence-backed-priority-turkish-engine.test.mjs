import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameSession } from '../../js/games/registry.js';
import { auditLiveOutputRound, normalizeTrustedLiveRound } from '../../js/quality/live-output-gate.js';
import { GRADE4_EVIDENCE_BACKED_TURKISH_FAMILIES } from '../../js/assessment-v2/evidence-backed-g4-turkish-families.js';
import { GRADE8_EVIDENCE_BACKED_TURKISH_FAMILIES } from '../../js/assessment-v2/evidence-backed-g8-turkish-families.js';
import { EVIDENCE_BACKED_PRIORITY_TURKISH_AUDIT, EVIDENCE_BACKED_PRIORITY_TURKISH_KEYS, EVIDENCE_BACKED_PRIORITY_TURKISH_ROUNDS } from '../../js/assessment-v2/evidence-backed-priority-turkish-bank.js';
import { trustedLiveCell } from '../../js/assessment-v2/trusted-live-policy.js';

const CELLS=[
 ['paragraph-detective',4,EVIDENCE_BACKED_PRIORITY_TURKISH_KEYS.grade4.paragraphDetective],
 ['meaning-hunt',4,EVIDENCE_BACKED_PRIORITY_TURKISH_KEYS.grade4.meaningHunt],
 ['paragraph-detective',8,EVIDENCE_BACKED_PRIORITY_TURKISH_KEYS.grade8.paragraphDetective],
 ['meaning-hunt',8,EVIDENCE_BACKED_PRIORITY_TURKISH_KEYS.grade8.meaningHunt]
];
function profile(grade,gameId){return{id:`turkish-engine:${grade}:${gameId}`,name:`${grade}. sınıf Türkçe motor testi`,age:grade+6,grade,level:10,skills:{}};}
function session(gameId,grade,seed,seenQuestionKeys=new Set()){return createGameSession(gameId,profile(grade,gameId),seed,{controlledLaunchPilot:true,completedSessionCount:1,seenQuestionKeys,attempts:[]});}

test('4. ve 8. sınıf Türkçe motoru 24 insan yazımı aile ve 72 kanıt-doğrulamalı çıktı üretir',()=>{
 assert.equal(GRADE4_EVIDENCE_BACKED_TURKISH_FAMILIES.length,12);
 assert.equal(GRADE8_EVIDENCE_BACKED_TURKISH_FAMILIES.length,12);
 assert.equal(EVIDENCE_BACKED_PRIORITY_TURKISH_AUDIT.ok,true,EVIDENCE_BACKED_PRIORITY_TURKISH_AUDIT.errors.join(', '));
 assert.deepEqual(EVIDENCE_BACKED_PRIORITY_TURKISH_AUDIT.metrics,{grade4FamilyCount:12,grade8FamilyCount:12,familyCount:24,grade4RoundCount:36,grade8RoundCount:36,roundCount:72,distinctSkeletonCount:72,evidenceVerifiedCount:72,randomSentenceCompositionCount:0,safeCellCount:4,supportedGameCount:2});
});

test('Türkçe motoru rastgele cümle birleştirmez ve bütün son-ekranlar kalite kapısından geçer',()=>{
 for(const round of EVIDENCE_BACKED_PRIORITY_TURKISH_ROUNDS){
  assert.equal(round.engineReview?.randomSentenceComposition,false,round.questionKey);
  assert.equal(round.evidenceProof?.verified,true,round.questionKey);
  assert.equal(round.distractorValidation?.diagnosticCount,3,round.questionKey);
  assert.ok(round.authoredReasoningStepCount>=4,round.questionKey);
  const grade=Number(round.targetGrade);
  const normalized=normalizeTrustedLiveRound(round,{gameId:round.gameId,grade});
  const audit=auditLiveOutputRound(normalized,{gameId:round.gameId,grade});
  assert.equal(audit.ok,true,`${round.questionKey}: ${audit.errors.join(', ')}`);
 }
});

test('Türkçe oturumlarında aynı kaynak vaka ve görev türü art arda gelmez',()=>{
 const map=new Map(EVIDENCE_BACKED_PRIORITY_TURKISH_ROUNDS.map((round)=>[round.questionKey,round]));
 for(const [gameId,grade,keys] of CELLS){
  const rounds=keys.map((key)=>map.get(key));
  for(let index=1;index<rounds.length;index+=1){
   assert.notEqual(rounds[index-1].familyId,rounds[index].familyId,`${gameId}:g${grade}: kaynak vaka tekrarı`);
   assert.notEqual(rounds[index-1].trustedExperienceType,rounds[index].trustedExperienceType,`${gameId}:g${grade}: görev türü tekrarı`);
  }
 }
});

test('Türkçe canlı politikası motor anahtarlarıyla birebir aynıdır',()=>{
 for(const [gameId,grade,keys] of CELLS){const policy=trustedLiveCell(gameId,grade);assert.ok(policy);assert.deepEqual([...policy.keys],[...keys]);assert.match(policy.status,/^SAFE_ENGINE_/);}
});

test('Türkçe motor çıktıları tam teslim edilir ve sonra fail-closed kapanır',()=>{
 for(const [gameId,grade,keys] of CELLS){
  const seen=new Set();
  for(let pass=0;pass<12&&seen.size<keys.length;pass+=1){const next=session(gameId,grade,2026081400+pass,seen);assert.equal(next.globalQualityAudit?.premiumBank?.fallbackToLegacy,false);for(const round of next.rounds){assert.equal(keys.includes(round.questionKey),true);assert.equal(seen.has(round.questionKey),false);seen.add(round.questionKey);}}
  assert.deepEqual(seen,new Set(keys),`${gameId}:g${grade}: banka eksik`);
  const exhausted=session(gameId,grade,2026081499,seen);assert.equal(exhausted.rounds.length,0);assert.equal(exhausted.globalQualityAudit?.premiumBank?.fallbackToLegacy,false);
 }
});
