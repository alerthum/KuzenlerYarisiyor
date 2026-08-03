import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateLegacyFamilyRetirement, buildRetirementRegistry } from '../js/quality/legacy-retirement-policy-v10.js';

test('yüksek blokaj ve eksik havuz yeterli kanıtla emekli edilir',()=>{
  const result=evaluateLegacyFamilyRetirement({familyId:'legacy-x',samples:[1,2,3].map(()=>({generated:10,blocked:4,average:60,complete:false}))});
  assert.equal(result.status,'RETIRED');
  assert.equal(result.enoughEvidence,true);
});

test('tek kötü örnek aileyi erken emekli etmez',()=>{
  const result=evaluateLegacyFamilyRetirement({familyId:'legacy-y',samples:[{generated:10,blocked:5,average:50,complete:false}]});
  assert.equal(result.status,'WATCH');
});

test('sağlıklı aile aktif kalır',()=>{
  const registry=buildRetirementRegistry([1,2,3].map((grade)=>({gameId:'healthy',grade,generated:10,blocked:0,average:91,complete:true})));
  assert.equal(registry.healthy.status,'ACTIVE');
});
