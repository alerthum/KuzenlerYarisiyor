import test from 'node:test';
import assert from 'node:assert/strict';
import { GRADE8_SCIENCE_OUTCOMES_2018, GRADE8_SCIENCE_INGESTION_STATUS } from '../../js/curriculum/outcomes/tr-g8-fen-2018.js';
import { GRADE8_SCIENCE_FULL_SCOPE_MATRIX, GRADE8_SCIENCE_FULL_SCOPE_AUDIT, auditGrade8ScienceFullScopeMatrix } from '../../js/assessment-v2/science-g8-full-scope-matrix.js';
import { buildGrade8ScienceBroadWaveQuestions, auditGrade8ScienceBroadWaveCatalog, auditGrade8ScienceBroadWaveQuestion } from '../../js/assessment-v2/science-g8-wave1-broad.js';

const items=buildGrade8ScienceBroadWaveQuestions();

test('8. sınıf Fen 61 resmî kazanımın tamamını tam kapsam matrisine bağlar',()=>{
  assert.equal(GRADE8_SCIENCE_INGESTION_STATUS.status,'COMPLETE');
  assert.equal(GRADE8_SCIENCE_OUTCOMES_2018.length,61);
  assert.equal(GRADE8_SCIENCE_FULL_SCOPE_MATRIX.length,61);
  assert.equal(GRADE8_SCIENCE_FULL_SCOPE_AUDIT.ok,true,GRADE8_SCIENCE_FULL_SCOPE_AUDIT.errors.join('\n'));
  assert.equal(GRADE8_SCIENCE_FULL_SCOPE_AUDIT.metrics.officialOutcomeCount,61);
});

test('Fen geniş dalgası 28 yeni kazanımı model, deney ve rubrik görevleriyle kapsar',()=>{
  const audit=auditGrade8ScienceBroadWaveCatalog(items);
  assert.equal(audit.ok,true,audit.errors.join('\n'));
  assert.equal(audit.metrics.itemCount,28);
  assert.equal(audit.metrics.outcomeCount,28);
  assert.equal(audit.metrics.choiceCount,24);
  assert.equal(audit.metrics.openResponseCount,4);
  assert.equal(GRADE8_SCIENCE_FULL_SCOPE_AUDIT.metrics.implementedOutcomeCount,33);
  assert.equal(GRADE8_SCIENCE_FULL_SCOPE_AUDIT.metrics.uncoveredOutcomeCount,28);
});

test('Fen görevleri alan doğrulayıcısı ve kapalı oyun sözleşmesi taşır',()=>{
  for(const item of items){
    const audit=auditGrade8ScienceBroadWaveQuestion(item);
    assert.equal(audit.ok,true,`${item.id}: ${audit.errors.join(', ')}`);
    assert.equal(item.gameBindings.length,0,item.id);
    assert.equal(item.content.humanReview.gameAdaptationAllowed,false,item.id);
  }
});

test('Fen doğru cevap mutasyonu RED üretir',()=>{
  const item=structuredClone(items.find(x=>x.itemFormat==='single-choice'));
  item.answerKey.optionId=item.content.options.find(x=>x.id!==item.answerKey.optionId).id;
  const audit=auditGrade8ScienceBroadWaveQuestion(item);
  assert.equal(audit.ok,false);
  assert.equal(audit.errors.includes('independent-verification'),true);
});

test('Fen matrisinden satır silmek tam kapsam kapısını düşürür',()=>{
  const audit=auditGrade8ScienceFullScopeMatrix(GRADE8_SCIENCE_FULL_SCOPE_MATRIX.slice(1));
  assert.equal(audit.ok,false);
  assert.equal(audit.errors.some(e=>e.startsWith('outcome-count')),true);
});
