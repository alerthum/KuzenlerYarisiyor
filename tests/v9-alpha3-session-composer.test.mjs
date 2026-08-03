import test from 'node:test';
import assert from 'node:assert/strict';
import { composeAdaptiveSession, adaptiveTargetsForGame } from '../js/engines/session-composer-v9.js';
import { normalizeAcademicAttempt } from '../js/curriculum/academic-metadata-v9.js';

const attempts = [
  ...Array.from({length:5},(_,i)=>({topicId:'functions',correct:i===0,difficulty:4,cognitiveLevel:4,hintCount:1,durationSeconds:80,answeredAt:`2026-07-${20+i}T10:00:00Z`,visibleCardId:'yeni-nesil-problem-avcisi',questionFamilyId:`f${i}`})),
  ...Array.from({length:5},(_,i)=>({topicId:'percent',correct:true,difficulty:4,cognitiveLevel:4,hintCount:0,durationSeconds:35,answeredAt:`2026-07-${20+i}T11:00:00Z`,visibleCardId:'yeni-nesil-problem-avcisi',questionFamilyId:`p${i}`}))
];

test('adaptive targets only use topics supported by the card',()=>{
  const plan=adaptiveTargetsForGame(attempts,{topicIds:['functions','ratio']});
  assert.equal(plan.length,1);
  assert.equal(plan[0].topicId,'functions');
});

test('composer injects at most 25 percent remediation rounds',()=>{
  const base=Array.from({length:8},(_,i)=>({questionKey:`b${i}`,topicId:'percent',prompt:`B${i}`}));
  const candidates=[{questionKey:'c1',topicId:'functions',prompt:'C1'},{questionKey:'c2',topicId:'functions',prompt:'C2'},{questionKey:'c3',topicId:'functions',prompt:'C3'}];
  const result=composeAdaptiveSession({baseRounds:base,candidateRounds:candidates,attempts,academicDefinition:{topicIds:['functions','percent']},maxShare:.25});
  assert.ok(result.injectedCount>=1);
  assert.ok(result.injectedCount<=2);
  assert.equal(result.rounds.length,8);
  assert.ok(result.rounds.some(x=>x.adaptivePlacement && x.topicId==='functions'));
});

test('academic metadata infers function topic from actual question text',()=>{
  const row=normalizeAcademicAttempt({gameId:'problem-hunter',prompt:'f(x) fonksiyonunun grafiğine göre f(3) kaçtır?',questionKey:'fx'});
  assert.equal(row.topicId,'functions');
});
