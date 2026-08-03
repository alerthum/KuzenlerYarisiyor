import test from 'node:test';
import assert from 'node:assert/strict';
import { auditGoldShowcase, generateGoldShowcase, generatePremiumGoldQuestion } from '../js/content-studio/premium-gold-content-v10.js';

test('sekiz premium aile çalışır GOLD örnek soru üretir',()=>{
  const report=auditGoldShowcase('release');
  assert.ok(report.total>=8);
  assert.equal(report.rejected,0,JSON.stringify(report.results.map(x=>({family:x.family?.familyId,status:x.quality?.status,errors:x.quality?.errors,warnings:x.quality?.warnings})),null,2));
  assert.equal(report.ok,true);
});

test('üretilen premium sorular tek ve geçerli cevap taşır',()=>{
  for(const result of generateGoldShowcase('validity')){
    assert.equal(result.ok,true);
    const q=result.question;
    assert.equal(q.options.filter(x=>x===q.answerValue).length,1,q.familyId);
    assert.equal(q.answerIndex,q.options.indexOf(q.answerValue),q.familyId);
    assert.ok(q.explanation.length>=70,q.familyId);
    assert.ok(q.hints.length>=2,q.familyId);
    assert.ok(q.questionKey,q.familyId);
  }
});

test('aynı seed aynı varyasyonu üretir',()=>{
  const a=generatePremiumGoldQuestion('math-error-chain','abc');
  const b=generatePremiumGoldQuestion('math-error-chain','abc');
  assert.deepEqual(a.question,b.question);
});
