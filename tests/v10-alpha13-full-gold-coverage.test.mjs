import test from 'node:test';
import assert from 'node:assert/strict';
import { PREMIUM_FAMILY_CATALOG, auditFamilyBlueprint } from '../js/content-studio/premium-family-studio-v10.js';
import { generatePremiumGoldQuestion } from '../js/content-studio/premium-gold-content-v10.js';
import { auditPremiumFamilyCoverage, getPremiumFamilyPool } from '../js/engines/premium-family-pool-v10.js';

const expected={
  'social-time-travel':['social-source-compare','social-cause-chain'],
  'religion-practice':['religion-concept-situation','religion-ethical-dilemma'],
  'english-cloze':['english-context-choice','english-dialogue-completion'],
  'olympiad-ladder':['olympiad-invariant','olympiad-proof-strategy']
};

test('Alpha 13 temel ders kartlarında en az iki GOLD aile bulunur',()=>{
  for(const [gameId,ids] of Object.entries(expected)){
    const pool=getPremiumFamilyPool(gameId);
    assert.ok(pool.length>=2,gameId);
    for(const id of ids) assert.ok(pool.includes(id),`${gameId}:${id}`);
  }
  const audit=auditPremiumFamilyCoverage();
  assert.equal(audit.multiFamilyGames,audit.games);
});

test('Alpha 13 yeni aile planları yayınlanabilir kalitededir',()=>{
  const ids=Object.values(expected).flat().filter(id=>!['social-source-compare','religion-concept-situation','english-context-choice','olympiad-invariant'].includes(id));
  for(const id of ids){
    const family=PREMIUM_FAMILY_CATALOG.find(x=>x.familyId===id);
    assert.ok(family,id);
    const audit=auditFamilyBlueprint(family);
    assert.equal(audit.ok,true,`${id}: ${audit.errors.join(',')}`);
    assert.equal(audit.status,'GOLD',`${id}: ${audit.score}`);
  }
});

test('Alpha 13 yeni GOLD üreticileri deterministik ve yayınlanabilir sonuç üretir',()=>{
  for(const id of ['social-cause-chain','religion-ethical-dilemma','english-dialogue-completion','olympiad-proof-strategy']){
    const a=generatePremiumGoldQuestion(id,'alpha13-seed');
    const b=generatePremiumGoldQuestion(id,'alpha13-seed');
    assert.equal(a.ok,true,`${id}: ${a.quality?.status} ${a.quality?.criticalFailures?.join(',')}`);
    assert.equal(a.question.questionKey,b.question.questionKey,id);
    assert.deepEqual(a.question.options,b.question.options,id);
  }
});
