import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateAssessmentV2ProductReadiness,auditAssessmentV2ProductReadiness,ASSESSMENT_V2_PRODUCT_READINESS} from '../../js/assessment-v2/product-readiness-gate.js';
import {ASSESSMENT_V2_PRODUCTION_PORTFOLIO} from '../../js/assessment-v2/production-portfolio.js';

test('mevcut ürün kanıtları eksikken ürün hazır gösterilemez',()=>{assert.equal(ASSESSMENT_V2_PRODUCT_READINESS.productReady,false);assert.equal(ASSESSMENT_V2_PRODUCT_READINESS.publicationAllowed,false);assert.ok(ASSESSMENT_V2_PRODUCT_READINESS.blockers.length>=7);assert.equal(auditAssessmentV2ProductReadiness(ASSESSMENT_V2_PRODUCT_READINESS).ok,true);});

test('yalnız build ve legacy PASS olması yayın açmaz',()=>{const result=evaluateAssessmentV2ProductReadiness({buildEvidence:{status:'PASS'},legacyEvidence:{count:604,status:'UNVERIFIED_LEGACY',quarantined:true}});assert.equal(result.productReady,false);assert.ok(result.checks.find(c=>c.id==='production-build').passed);assert.ok(!result.checks.find(c=>c.id==='real-student-pilot').passed);});

test('simüle öğrenci verisi gerçek pilot yerine geçemez',()=>{const result=evaluateAssessmentV2ProductReadiness({studentPilot:{status:'SIMULATION_ENGINE_PASS',evidenceSource:'SIMULATED_FIXTURE',publicationAllowed:true}});assert.equal(result.checks.find(c=>c.id==='real-student-pilot').passed,false);assert.equal(result.productReady,false);});

test('20 oturumluk canlı batarya 500 oturum kapısını açamaz',()=>{const result=evaluateAssessmentV2ProductReadiness({liveBattery:{gameCount:23,sessionsPerGame:20,underfill:0,semanticRepeats:0,failedGames:[]}});assert.equal(result.checks.find(c=>c.id==='live-session-battery').passed,false);});

test('aktif kırk iki motorun kendi kapsamı tam olsa da 112 hücre hedefi açıktır',()=>{const result=evaluateAssessmentV2ProductReadiness({portfolio:ASSESSMENT_V2_PRODUCTION_PORTFOLIO});assert.equal(result.checks.find(c=>c.id==='active-engine-curriculum').passed,true);assert.equal(result.checks.find(c=>c.id==='course-cell-coverage').passed,false);assert.equal(result.productReady,false);});

test('bütün bağımsız kanıtlar sağlanmadan tek alan mutasyonu productReady üretemez',()=>{const base={
 portfolio:{...ASSESSMENT_V2_PRODUCTION_PORTFOLIO,summary:{...ASSESSMENT_V2_PRODUCTION_PORTFOLIO.summary,activeEngineCellCount:112,activeGradeCount:12}},
 humanReview:{metrics:{total:70,approved:70,pending:0,revisionRequired:0,rejected:0}},
 studentPilot:{status:'PILOT_PASS',evidenceSource:'REAL_STUDENT_PILOT',publicationAllowed:true},
 liveBattery:{gameCount:23,sessionsPerGame:500,underfill:0,semanticRepeats:0,failedGames:[]},
 buildEvidence:{status:'PASS'},accessibilityEvidence:{status:'PASS'},securityEvidence:{status:'PASS'},mediaRubricEvidence:{status:'INCOMPLETE'},legacyEvidence:{count:604,status:'UNVERIFIED_LEGACY',quarantined:true}
};const blocked=evaluateAssessmentV2ProductReadiness(base);assert.equal(blocked.productReady,false);assert.equal(blocked.checks.find(c=>c.id==='media-rubric-assets').passed,false);const ready=evaluateAssessmentV2ProductReadiness({...base,mediaRubricEvidence:{status:'PASS'}});assert.equal(ready.productReady,true);assert.equal(ready.blockers.length,0);});
