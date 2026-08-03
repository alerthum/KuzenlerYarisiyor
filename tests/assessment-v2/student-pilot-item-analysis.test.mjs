import test from 'node:test';
import assert from 'node:assert/strict';
import { defineStudentPilotResponse, auditStudentPilotResponses } from '../../js/assessment-v2/student-pilot-contract.js';
import { analyzeStudentPilot } from '../../js/assessment-v2/item-analysis-engine.js';
import { buildSimulatedStudentPilotFixture } from '../../js/assessment-v2/student-pilot-fixture.js';
import { evaluateStudentPilotPublicationGate } from '../../js/assessment-v2/student-pilot-publication-gate.js';

test('öğrenci pilotu yanıt sözleşmesi PII alanlarını ve açık kimliği reddeder',()=>{
  assert.throws(()=>defineStudentPilotResponse({name:'Ali'}),/pii-forbidden/);
  assert.throws(()=>defineStudentPilotResponse({datasetSource:'SIMULATED_FIXTURE',participantAnonId:'Ali'}),/not-anonymous/);
});

test('120 anonim katılımcı x 5 görev simülasyonu 600 geçerli yanıt üretir',()=>{
  const fixture=buildSimulatedStudentPilotFixture();
  const audit=auditStudentPilotResponses(fixture.rows);
  assert.equal(audit.ok,true,audit.errors.join(','));
  assert.equal(audit.rows.length,600);
  assert.equal(new Set(audit.rows.map(row=>row.participantAnonId)).size,120);
  assert.ok(audit.rows.every(row=>row.datasetSource==='SIMULATED_FIXTURE'));
});

test('madde analizi güçlük, ayırt edicilik, süre, ipucu ve çeldirici işlevini hesaplar',()=>{
  const fixture=buildSimulatedStudentPilotFixture();
  const analysis=analyzeStudentPilot({pilotId:fixture.pilotId,responses:fixture.rows,itemDescriptors:fixture.descriptors});
  assert.equal(analysis.status,'SIMULATION_ENGINE_PASS',JSON.stringify(analysis.items));
  assert.equal(analysis.metrics.itemCount,5);
  assert.equal(analysis.metrics.participantCount,120);
  for(const item of analysis.items){
    assert.ok(item.difficultyIndex>=0.2&&item.difficultyIndex<=0.9,item.itemId);
    assert.ok(item.discriminationIndex>=0.2,item.itemId);
    assert.ok(item.medianResponseTimeMs>0,item.itemId);
    assert.equal(item.distractors.length,4,item.itemId);
    assert.ok(item.nonFunctionalDistractorCount<=1,item.itemId);
  }
});

test('simülasyon teknik olarak geçse bile yayın kanıtı sayılamaz',()=>{
  const fixture=buildSimulatedStudentPilotFixture();
  const analysis=analyzeStudentPilot({pilotId:fixture.pilotId,responses:fixture.rows,itemDescriptors:fixture.descriptors});
  const gate=evaluateStudentPilotPublicationGate({analysis,humanReviewApproved:true,semanticRoundTripPassed:true});
  assert.equal(gate.publicationAllowed,false);
  assert.ok(gate.blockers.includes('real-student-evidence-required'));
});

test('rastgele cevap mutasyonu düşük ayırt edicilik nedeniyle RED üretir',()=>{
  const fixture=buildSimulatedStudentPilotFixture();
  const rows=fixture.rows.map((row,index)=>({...row,selectedOptionId:fixture.descriptors[index%5].optionIds[index%4],omitted:false,score:0}));
  const analysis=analyzeStudentPilot({pilotId:'randomized',responses:rows,itemDescriptors:fixture.descriptors});
  assert.equal(analysis.status,'PILOT_REVIEW_REQUIRED');
  assert.ok(analysis.items.some(item=>item.flags.includes('low-discrimination')));
});

test('tek yanlış seçeneğin hiç kullanılmaması işlevsiz çeldirici olarak raporlanır',()=>{
  const fixture=buildSimulatedStudentPilotFixture();
  const target=fixture.descriptors[0];
  const forbiddenWrong=target.optionIds.find(id=>id!==target.correctOptionId);
  const allowedWrong=target.optionIds.filter(id=>id!==target.correctOptionId&&id!==forbiddenWrong);
  let cursor=0;
  const rows=fixture.rows.map(row=>{
    if(row.itemId!==target.itemId||row.omitted||row.selectedOptionId===target.correctOptionId)return row;
    return {...row,selectedOptionId:allowedWrong[cursor++%allowedWrong.length]};
  });
  const analysis=analyzeStudentPilot({pilotId:'distractor-mutation',responses:rows,itemDescriptors:fixture.descriptors});
  const item=analysis.items.find(row=>row.itemId===target.itemId);
  assert.ok(item.distractors.some(row=>row.optionId===forbiddenWrong&&!row.functional));
});

import { anonymizePilotParticipant, adaptAttemptToStudentPilotResponse } from '../../js/assessment-v2/student-pilot-attempt-adapter.js';
import { ASSESSMENT_V2_STUDENT_PILOT_MANIFEST } from '../../js/assessment-v2/student-pilot-manifest.js';

test('uygulama denemesi PII taşımadan anonim pilot yanıtına dönüştürülür',()=>{
  const descriptor=ASSESSMENT_V2_STUDENT_PILOT_MANIFEST.items[0];
  const anon=anonymizePilotParticipant('profile-local-17','pilot-secret');
  assert.match(anon,/^anon_[a-z0-9_-]{8,}$/);
  assert.equal(anon.includes('profile-local-17'),false);
  const row=adaptAttemptToStudentPilotResponse({
    pilotId:ASSESSMENT_V2_STUDENT_PILOT_MANIFEST.pilotId,
    pilotSalt:'pilot-secret',
    profileId:'profile-local-17',
    itemDescriptor:descriptor,
    attempt:{id:'attempt-1',sourceQuestionId:descriptor.itemId,gameId:descriptor.gameId,grade:8,selectedOptionId:descriptor.correctOptionId,elapsedSeconds:42,hintsUsed:1,answeredAt:'2026-08-04T10:00:42.000Z'}
  });
  assert.equal(row.datasetSource,'REAL_STUDENT_PILOT');
  assert.equal(row.participantAnonId,anon);
  assert.equal(row.score,1);
  assert.equal(row.responseTimeMs,42000);
});

test('kontrollü pilot manifesti PII toplamayı ve kanıtsız yayını yasaklar',()=>{
  assert.equal(ASSESSMENT_V2_STUDENT_PILOT_MANIFEST.privacy.piiCollectionAllowed,false);
  assert.equal(ASSESSMENT_V2_STUDENT_PILOT_MANIFEST.sampling.minimumUniqueParticipants,100);
  assert.equal(ASSESSMENT_V2_STUDENT_PILOT_MANIFEST.publicationAllowed,false);
  assert.equal(ASSESSMENT_V2_STUDENT_PILOT_MANIFEST.items.length,5);
});
