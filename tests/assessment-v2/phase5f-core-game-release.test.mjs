import test from 'node:test';
import assert from 'node:assert/strict';
import { CORE_GAME_RELEASE_PROFILE, CORE_GAME_RELEASE_PROFILE_AUDIT } from '../../js/assessment-v2/core-game-release-profile.js';
import { CORE_GAME_REVIEW_SPRINTS, CORE_GAME_REVIEW_SPRINTS_AUDIT } from '../../js/assessment-v2/core-game-review-sprints.js';
import { CORE_GAME_RELEASE_READINESS, CORE_GAME_RELEASE_READINESS_AUDIT, evaluateCoreGameReleaseReadiness } from '../../js/assessment-v2/core-game-release-gate.js';

test('çekirdek yayın profili 5–8 ana derslerde 24/24 hücreyi ve 23 oyunu kapsar',()=>{
  assert.equal(CORE_GAME_RELEASE_PROFILE_AUDIT.ok,true,CORE_GAME_RELEASE_PROFILE_AUDIT.errors.join('\n'));
  assert.equal(CORE_GAME_RELEASE_PROFILE.metrics.requiredCellCount,24);
  assert.equal(CORE_GAME_RELEASE_PROFILE.metrics.activeCellCount,24);
  assert.equal(CORE_GAME_RELEASE_PROFILE.metrics.routedGameCount,23);
  assert.equal(CORE_GAME_RELEASE_PROFILE.metrics.coveredOutcomeCount,CORE_GAME_RELEASE_PROFILE.metrics.officialOutcomeCount);
});

test('insan incelemesi 60 görevlik sprintlere bölünür ve otomatik onay üretmez',()=>{
  assert.equal(CORE_GAME_REVIEW_SPRINTS_AUDIT.ok,true,CORE_GAME_REVIEW_SPRINTS_AUDIT.errors.join('\n'));
  assert.ok(CORE_GAME_REVIEW_SPRINTS.totalItems>1000);
  assert.ok(CORE_GAME_REVIEW_SPRINTS.totalSprints>10);
  assert.equal(CORE_GAME_REVIEW_SPRINTS.publicationAllowed,false);
  assert.ok(CORE_GAME_REVIEW_SPRINTS.sprints.every(s=>s.items.length<=60));
});

test('geniş okul kapsamı eksik olsa bile çekirdek kapı yalnız ana ders ve oyun kanıtlarını değerlendirir',()=>{
  assert.equal(CORE_GAME_RELEASE_READINESS_AUDIT.ok,true,CORE_GAME_RELEASE_READINESS_AUDIT.errors.join('\n'));
  assert.equal(CORE_GAME_RELEASE_READINESS.fullProductReady,false);
  assert.equal(CORE_GAME_RELEASE_READINESS.releaseReady,false);
  assert.equal(CORE_GAME_RELEASE_READINESS.checks.some(c=>c.id==='course-cell-coverage'),false);
});

test('test/build kanıtı tek başına insan incelemesi ve gerçek pilot kapısını açamaz',()=>{
  const result=evaluateCoreGameReleaseReadiness({
    buildEvidence:{status:'PASS'},accessibilityEvidence:{status:'PASS'},securityEvidence:{status:'PASS'},
    liveBattery:{meetsStageGate:true,allGamesOnSharedComposer:true,gameCount:23,sessionsPerGame:500,totalSessions:11500,underfill:0,semanticRepeats:0,failedGames:[]},
    studentPilot:{publicationAllowed:false,evidenceSource:'SIMULATED_FIXTURE',status:'PILOT_PASS'}
  });
  assert.equal(result.publicationAllowed,false);
  assert.equal(result.checks.find(c=>c.id==='real-student-pilot').passed,false);
  assert.equal(result.checks.find(c=>c.id==='human-review').passed,false);
});


test('eksik veya yüzeysel ağır batarya kanıtı çekirdek yayın kapısını açamaz',()=>{
  const shallow=evaluateCoreGameReleaseReadiness({
    liveBattery:{gameCount:23,sessionsPerGame:500,underfill:0,semanticRepeats:0,failedGames:[]},
    buildEvidence:{status:'PASS'},accessibilityEvidence:{status:'PASS'},securityEvidence:{status:'PASS'}
  });
  assert.equal(shallow.checks.find(c=>c.id==='live-game-battery').passed,false);
  const complete=evaluateCoreGameReleaseReadiness({
    liveBattery:{meetsStageGate:true,allGamesOnSharedComposer:true,gameCount:23,sessionsPerGame:500,totalSessions:11500,underfill:0,semanticRepeats:0,failedGames:[]},
    buildEvidence:{status:'PASS'},accessibilityEvidence:{status:'PASS'},securityEvidence:{status:'PASS'}
  });
  assert.equal(complete.checks.find(c=>c.id==='live-game-battery').passed,true);
});
