import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGrade8MathCompletionQuestions,
  GRADE8_MATH_COMPLETION_OUTCOME_CODES,
  auditGrade8MathCompletionCatalog,
  auditGrade8MathCompletionQuestion
} from '../../js/assessment-v2/math-g8-completion-waves.js';

const items=buildGrade8MathCompletionQuestions();

test('Matematik tamamlama dalgaları kalan 35 kazanımı birer mühendislik nesnesiyle kapsar',()=>{
  const audit=auditGrade8MathCompletionCatalog(items);
  assert.equal(audit.ok,true,audit.errors.join('\n'));
  assert.equal(items.length,35);
  assert.equal(GRADE8_MATH_COMPLETION_OUTCOME_CODES.length,35);
  assert.equal(new Set(GRADE8_MATH_COMPLETION_OUTCOME_CODES).size,35);
  assert.deepEqual(audit.metrics.formatCounts,{'single-choice':26,'interactive-simulation':9});
});

test('tamamlama görevleri ayrı doğrulayıcı, üç ipucu ve kapalı oyun sözleşmesi taşır',()=>{
  for(const item of items){
    const audit=auditGrade8MathCompletionQuestion(item);
    assert.equal(audit.ok,true,`${item.id}: ${audit.errors.join(', ')}`);
    assert.deepEqual(item.hints.map(h=>h.level),[1,2,3],item.id);
    assert.equal(item.gameBindings.length,0,item.id);
    assert.equal(item.content.humanReview.gameAdaptationAllowed,false,item.id);
  }
});

test('çoktan seçmeli görevlerde üç farklı öğrenci yanılgısı ve dört öğretici geri bildirim vardır',()=>{
  for(const item of items.filter(x=>x.itemFormat==='single-choice')){
    assert.equal(item.content.options.length,4,item.id);
    assert.equal(item.optionFeedback.length,4,item.id);
    assert.equal(new Set(item.misconceptionIds).size,3,item.id);
  }
});

test('doğru cevap mutasyonu bağımsız doğrulamada RED üretir',()=>{
  const item=structuredClone(items.find(x=>x.itemFormat==='single-choice'));
  const alternatives=item.content.options.map(x=>x.id).filter(id=>id!==item.answerKey.optionId);
  item.answerKey.optionId=alternatives[0];
  const audit=auditGrade8MathCompletionQuestion(item);
  assert.equal(audit.ok,false);
  assert.equal(audit.errors.includes('independent-verification'),true);
});
