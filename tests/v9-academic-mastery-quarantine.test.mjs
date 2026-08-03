import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAcademicAttempt } from '../js/curriculum/academic-metadata-v9.js';
import { buildTopicMastery, silentRemediationPlan, difficultyEscalationForCard } from '../js/engines/mastery-engine-v9.js';
import { buildQuarantineRecords, shouldImmediatelyQuarantine, isRoundQuarantined } from '../js/quality/quarantine-v9.js';
import { createInitialState, recordAttempt, reportQuestion } from '../js/state.js';
import { createGameSession } from '../js/games/registry.js';

test('her cevap akademik kimlik ile normalize edilir', () => {
  const row = normalizeAcademicAttempt({ gameId:'problem-hunter', questionKey:'problem-hunter:q1', correct:true, difficulty:4, elapsedSeconds:45, hintsUsed:1 });
  for (const key of ['subjectId','visibleCardId','topicId','subtopicId','skillId','learningOutcomeId','questionFamilyId','questionKey','difficulty','cognitiveLevel','durationSeconds','hintCount','answeredAt']) assert.ok(row[key] !== undefined, key);
  assert.equal(row.subjectId,'math');
  assert.equal(row.visibleCardId,'yeni-nesil-problem-avcisi');
});

test('recordAttempt akademik alanları kalıcı kayda ekler', () => {
  const state=createInitialState(null);
  const result=recordAttempt(state,{profileId:state.profiles[0].id,gameId:'geometry-lab',questionKey:'geo:1',skill:'geometry',correct:true,difficulty:4,hintsUsed:0,elapsedSeconds:30});
  assert.equal(result.attempt.subjectId,'math');
  assert.equal(result.attempt.visibleCardId,'geometri-insa-alani');
  assert.ok(result.attempt.questionFamilyId);
});

test('ustalık motoru farklı gün, ipucu ve soru ailesini değerlendirir', () => {
  const attempts=[];
  for(let day=1;day<=5;day+=1){
    for(let i=0;i<4;i+=1) attempts.push({topicId:'functions',visibleCardId:'yeni-nesil-problem-avcisi',questionFamilyId:`f${i}`,correct:true,difficulty:4,cognitiveLevel:4,hintCount:0,durationSeconds:40,answeredAt:`2026-07-0${day}T10:00:00Z`});
  }
  const mastery=buildTopicMastery(attempts)[0];
  assert.equal(mastery.status,'Kalıcılaştı');
  const escalation=difficultyEscalationForCard(attempts,'yeni-nesil-problem-avcisi');
  assert.equal(escalation.escalate,true);
  assert.equal(escalation.targetDifficulty,5);
});

test('sessiz telafi zayıf konuyu sınırlı oranla önerir', () => {
  const attempts=[
    {topicId:'functions',correct:false,difficulty:4,hintCount:2,durationSeconds:100,answeredAt:'2026-07-01'},
    {topicId:'functions',correct:true,difficulty:3,hintCount:2,durationSeconds:120,answeredAt:'2026-07-02'}
  ];
  const plan=silentRemediationPlan(attempts);
  assert.equal(plan[0].topicId,'functions');
  assert.ok(plan[0].recommendedShare>=0.15 && plan[0].recommendedShare<=0.25);
});

test('öğrenci bildirimi soru ve aileyi anında karantinaya alır', () => {
  for (const reason of ['question_invalid','answer_invalid','duplicate','wording']) assert.equal(shouldImmediatelyQuarantine(reason),true);
  const records=buildQuarantineRecords({id:'r1',reason:'wording',questionKey:'q1',questionFamilyId:'family-1'},'student-1');
  assert.equal(records.question.status,'temporary-blocked');
  assert.equal(records.family.questionFamilyId,'family-1');
});

test('state raporu global soru ve aile blok listesine işler', () => {
  const state=createInitialState(null);
  const profileId=state.profiles[0].id;
  reportQuestion(state,{profileId,reason:'duplicate',questionKey:'q-global',questionFamilyId:'fam-global',gameId:'problem-hunter'});
  assert.ok(state.blockedQuestionKeys.__global['q-global']);
  assert.ok(state.blockedQuestionFamilies.__global['fam-global']);
});

test('karantinadaki aile yeni oturumdan elenir', () => {
  const profile={id:'p',name:'P',age:13,grade:8,skills:{problemSolving:50,patterns:50,arithmetic:50,geometry:50}};
  const base=createGameSession('problem-hunter',profile,123,{seenQuestionKeys:new Set()});
  assert.ok(base.rounds.length>0);
  const family=base.rounds[0].questionFamilyId;
  assert.equal(isRoundQuarantined(base.rounds[0],new Set(),new Set([family])),true);
  const blocked=createGameSession('problem-hunter',profile,123,{seenQuestionKeys:new Set(),blockedQuestionFamilies:new Set([family])});
  assert.ok(blocked.rounds.every(round=>round.questionFamilyId!==family));
});
