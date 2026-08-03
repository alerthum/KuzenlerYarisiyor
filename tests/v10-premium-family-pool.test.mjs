import test from 'node:test';
import assert from 'node:assert/strict';
import { auditPremiumFamilyCoverage, getPremiumFamilyPool, selectPremiumFamily } from '../js/engines/premium-family-pool-v10.js';
import { generatePremiumGoldQuestion } from '../js/content-studio/premium-gold-content-v10.js';
import { transitionLegacyContent } from '../js/engines/premium-content-transition-v10.js';

test('kritik kartlar birden fazla GOLD aile taşır',()=>{
  const audit=auditPremiumFamilyCoverage();
  assert.ok(audit.multiFamilyGames>=4);
  for(const gameId of ['error-detective','paragraph-detective','science-lab','logic-station']) assert.ok(getPremiumFamilyPool(gameId).length>=2);
});

test('yeni premium ailelerin GOLD örnekleri yayın kapısından geçer',()=>{
  for(const id of ['math-reverse-check','tr-author-purpose','science-data-claim','logic-order-chain']){
    const result=generatePremiumGoldQuestion(id,`test-${id}`);
    assert.equal(result.ok,true,`${id}: ${result.error||result.quality?.reasons}`);
    assert.ok(result.question.answerIndex>=0);
  }
});

test('geçiş motoru aynı kartta aile çeşitliliği üretir',()=>{
  const out=transitionLegacyContent({gameId:'logic-station',game:{sessionLength:4},profile:{id:'p1'},sessionSeed:'s1',rounds:[],targetCount:2,generatePremiumQuestion:generatePremiumGoldQuestion,toRound:q=>({...q})});
  assert.equal(out.rounds.length,2);
  assert.ok(out.audit.usedFamilyIds.length>=2);
  assert.deepEqual(new Set(out.rounds.map(x=>x.familyId)),new Set(out.audit.usedFamilyIds));
});

test('karantinadaki aile havuzdan atlanır',()=>{
  const selected=selectPremiumFamily({gameId:'logic-station',attempt:0,blockedQuestionFamilies:new Set(['logic-constraint-grid'])});
  assert.equal(selected,'logic-order-chain');
});
