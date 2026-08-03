import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameSession } from '../js/games/registry.js';

const profile={id:'gold-student',grade:8,age:13,skills:{}};
const supportedGames=[
  'error-detective','paragraph-detective','science-lab','science-reasoning',
  'social-time-travel','religion-practice','english-cloze','logic-station','olympiad-ladder'
];

test('ilk oyun deneyiminde desteklenen kartlara GOLD vitrin sorusu eklenir',()=>{
  for(const [index,gameId] of supportedGames.entries()){
    const session=createGameSession(gameId,profile,`showcase-${index}`,{completedSessionCount:0});
    assert.equal(session.goldShowcase.eligible,true,gameId);
    assert.equal(session.goldShowcase.injected,true,gameId);
    assert.equal(session.rounds[0].premiumTier,'GOLD',gameId);
    assert.equal(session.rounds[0].premiumShowcase,true,gameId);
    assert.ok(session.rounds[0].explanation.length>=70,gameId);
    assert.ok(session.rounds[0].hints.length>=2,gameId);
  }
});

test('daha önce oynanan kartta GOLD vitrin zorla tekrar eklenmez',()=>{
  const session=createGameSession('paragraph-detective',profile,'returning',{completedSessionCount:1});
  assert.equal(session.goldShowcase.firstExperience,false);
  assert.equal(session.goldShowcase.injected,false);
  assert.equal(session.rounds.some(round=>round.premiumShowcase),false);
});

test('karantinadaki premium aile vitrine giremez',()=>{
  const session=createGameSession('logic-station',profile,'blocked',{
    completedSessionCount:0,
    blockedQuestionFamilies:new Set(['logic-constraint-grid'])
  });
  assert.equal(session.goldShowcase.injected,false);
  assert.equal(session.rounds.some(round=>round.familyId==='logic-constraint-grid'),false);
});
