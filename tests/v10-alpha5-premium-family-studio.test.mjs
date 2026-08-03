import test from 'node:test';
import assert from 'node:assert/strict';
import { PREMIUM_FAMILY_CATALOG, auditFamilyBlueprint, auditPremiumCatalog, buildVariantContract, createFamilyBlueprint, getPremiumFamilies } from '../js/content-studio/premium-family-studio-v10.js';

test('Premium Family Studio sekiz temel alan için en az bir aile içerir',()=>{
  for(const subject of ['mathematics','turkish','science','social','religion','english','logic','olympiad']){
    assert.ok(getPremiumFamilies(subject).length>=1, `${subject} premium ailesi eksik`);
  }
});

test('başlangıç premium aile kataloğunun tamamı yayın tasarım kapısını geçer',()=>{
  const report=auditPremiumCatalog();
  assert.ok(report.total>=8);
  assert.equal(report.blocked,0,JSON.stringify(report.results,null,2));
  assert.equal(report.ok,true);
});

test('dekoratif bağlamı çözümden bağımsız aile engellenir',()=>{
  const family=createFamilyBlueprint({familyId:'bad',subjectId:'turkish',visibleCardId:'paragraph',title:'Bad',purpose:'Test',thinkingModel:'Inference',learningOutcomeId:'x',thinkingPatternIds:['TEXT_INFERENCE'],distractorStrategies:['unrelated'],variantAxes:['name','color','number'],naturalContextRule:'Natural',contextPolicy:{required:true,mustAffectSolution:false}});
  const report=auditFamilyBlueprint(family);
  assert.equal(report.status,'BLOCKED');
  assert.ok(report.errors.includes('decorative_context_forbidden'));
});

test('geçerli aile deterministik varyasyon üretim sözleşmesi oluşturur',()=>{
  const family=PREMIUM_FAMILY_CATALOG.find(x=>x.familyId==='logic-constraint-grid');
  const result=buildVariantContract(family,{entityCount:5,questionType:'must'});
  assert.equal(result.ok,true);
  assert.equal(result.contract.selectedAxes.entityCount,5);
  assert.equal(result.contract.selectedAxes.questionType,'must');
  assert.equal(result.contract.generationRules.contextMustAffectSolution,true);
});
