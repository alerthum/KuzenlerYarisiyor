import test from 'node:test';
import assert from 'node:assert/strict';
import { buildGrade8ScienceCompletionQuestions, GRADE8_SCIENCE_COMPLETION_OUTCOME_CODES, auditGrade8ScienceCompletionCatalog, auditGrade8ScienceCompletionQuestion } from '../../js/assessment-v2/science-g8-completion-wave.js';
import { GRADE8_SCIENCE_FULL_SCOPE_AUDIT } from '../../js/assessment-v2/science-g8-full-scope-matrix.js';

const items=buildGrade8ScienceCompletionQuestions();

test('Fen tamamlama dalgası kalan 28 kazanımı deney, model, araştırma ve tasarım görevleriyle kapatır',()=>{
  const audit=auditGrade8ScienceCompletionCatalog(items);
  assert.equal(audit.ok,true,audit.errors.join('\n'));
  assert.equal(items.length,28);
  assert.equal(new Set(GRADE8_SCIENCE_COMPLETION_OUTCOME_CODES).size,28);
  assert.deepEqual(audit.metrics,{itemCount:28,outcomeCount:28,choiceCount:18,openResponseCount:10,humanReviewStatus:'NOT_MEASURED',gameAdaptationAllowed:false});
});

test('8. sınıf Fen mühendislik kapsamı 61/61 olur ancak ürün ve oyun kilidi açılmaz',()=>{
  assert.equal(GRADE8_SCIENCE_FULL_SCOPE_AUDIT.metrics.implementedOutcomeCount,61);
  assert.equal(GRADE8_SCIENCE_FULL_SCOPE_AUDIT.metrics.implementedItemCount,61);
  assert.equal(GRADE8_SCIENCE_FULL_SCOPE_AUDIT.metrics.uncoveredOutcomeCount,0);
  assert.equal(GRADE8_SCIENCE_FULL_SCOPE_AUDIT.metrics.productReady,false);
  assert.equal(GRADE8_SCIENCE_FULL_SCOPE_AUDIT.metrics.gameAdaptationAllowed,false);
});

test('Fen tamamlama görevlerinin tamamı üç ipucu, alan doğrulaması ve kapalı oyun sözleşmesi taşır',()=>{
  for(const item of items){
    const audit=auditGrade8ScienceCompletionQuestion(item);
    assert.equal(audit.ok,true,`${item.id}: ${audit.errors.join(', ')}`);
    assert.deepEqual(item.hints.map(h=>h.level),[1,2,3],item.id);
    assert.equal(item.gameBindings.length,0,item.id);
    assert.equal(item.content.humanReview.gameAdaptationAllowed,false,item.id);
  }
});

test('kimya ve ekoloji doğru cevap mutasyonları bağımsız doğrulamada RED üretir',()=>{
  for(const source of items.filter(x=>x.itemFormat==='single-choice').slice(0,2)){
    const item=structuredClone(source);
    item.answerKey.optionId=item.content.options.find(x=>x.id!==source.answerKey.optionId).id;
    const audit=auditGrade8ScienceCompletionQuestion(item);
    assert.equal(audit.ok,false,item.id);
    assert.equal(audit.errors.includes('independent-verification'),true,item.id);
  }
});

test('araştırma ve tasarım kazanımları zorla çoktan seçmeliye çevrilmez',()=>{
  const open=items.filter(x=>x.itemFormat==='open-response');
  assert.equal(open.length,10);
  assert.equal(open.every(x=>x.responseModel.rubricCriteria.length===4),true);
});
