import test from 'node:test';
import assert from 'node:assert/strict';
import { ASSESSMENT_V2_RISK_REVIEW_SAMPLE, ASSESSMENT_V2_RISK_REVIEW_SAMPLE_AUDIT, auditRiskStratifiedReviewSample } from '../../js/assessment-v2/risk-stratified-review-sampler.js';
import { ASSESSMENT_V2_GAME_ADAPTATION_LAB, ASSESSMENT_V2_GAME_ADAPTATION_LAB_AUDIT, auditAssessmentV2GameAdaptationLab } from '../../js/assessment-v2/game-adaptation-lab.js';

test('risk tabakalı insan örneklemi yedi motorun her birinden on görev seçer',()=>{
  assert.equal(ASSESSMENT_V2_RISK_REVIEW_SAMPLE_AUDIT.ok,true,ASSESSMENT_V2_RISK_REVIEW_SAMPLE_AUDIT.errors.join('\n'));
  assert.equal(ASSESSMENT_V2_RISK_REVIEW_SAMPLE.rows.length,70);
  assert.equal(new Set(ASSESSMENT_V2_RISK_REVIEW_SAMPLE.rows.map(r=>r.sampleEngineKey)).size,7);
});

test('örneklemde onaysız görevlerin oyun kilidi açılmaz',()=>{
  assert.equal(ASSESSMENT_V2_RISK_REVIEW_SAMPLE.rows.every(r=>r.reviewStatus==='HUMAN_REVIEW_REQUIRED'&&r.gameAdaptationAllowed===false),true);
});

test('beş insan onaylı Türkçe sorusu anlamı koruyan oyun laboratuvarına uyarlanır',()=>{
  assert.equal(ASSESSMENT_V2_GAME_ADAPTATION_LAB_AUDIT.ok,true,ASSESSMENT_V2_GAME_ADAPTATION_LAB_AUDIT.errors.join('\n'));
  assert.equal(ASSESSMENT_V2_GAME_ADAPTATION_LAB.length,5);
  assert.equal(ASSESSMENT_V2_GAME_ADAPTATION_LAB.every(r=>r.adapted.semanticRoundTrip.ok&&r.approval.publicationAllowed===false),true);
});

test('adaptasyon cevabı değiştirirse laboratuvar denetimi RED verir',()=>{
  const mutated=structuredClone(ASSESSMENT_V2_GAME_ADAPTATION_LAB);mutated[0].adapted.semanticRoundTrip.ok=false;
  assert.equal(auditAssessmentV2GameAdaptationLab(mutated).ok,false);
});

test('örneklemden bir motor satırı eksilirse denetim RED verir',()=>{
  const mutated=structuredClone(ASSESSMENT_V2_RISK_REVIEW_SAMPLE);mutated.rows=mutated.rows.slice(1);mutated.metrics.total=69;
  assert.equal(auditRiskStratifiedReviewSample(mutated).ok,false);
});
