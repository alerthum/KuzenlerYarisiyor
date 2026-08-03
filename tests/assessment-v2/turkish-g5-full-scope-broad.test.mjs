import test from 'node:test';
import assert from 'node:assert/strict';
import { GRADE5_TURKISH_OUTCOMES_TYMM_2024, GRADE5_TURKISH_INGESTION_STATUS } from '../../js/curriculum/outcomes/tr-g5-turkce-tymm-2024.js';
import { GRADE5_TURKISH_FULL_SCOPE_MATRIX, GRADE5_TURKISH_FULL_SCOPE_AUDIT, auditGrade5TurkishFullScopeMatrix } from '../../js/assessment-v2/turkish-g5-full-scope-matrix.js';
import { buildGrade5TurkishBroadWaveQuestions, auditGrade5TurkishBroadWaveCatalog, auditGrade5TurkishBroadWaveQuestion } from '../../js/assessment-v2/turkish-g5-broad-wave.js';

const items=buildGrade5TurkishBroadWaveQuestions();

test('5. sınıf TYMM Türkçe 100 öğrenme çıktısının tamamını dört beceri alanıyla kaydeder',()=>{
  assert.equal(GRADE5_TURKISH_INGESTION_STATUS.status,'COMPLETE');
  assert.equal(GRADE5_TURKISH_OUTCOMES_TYMM_2024.length,100);
  assert.equal(GRADE5_TURKISH_FULL_SCOPE_MATRIX.length,100);
  assert.equal(GRADE5_TURKISH_FULL_SCOPE_AUDIT.ok,true,GRADE5_TURKISH_FULL_SCOPE_AUDIT.errors.join('\n'));
  assert.deepEqual({
    listening:GRADE5_TURKISH_FULL_SCOPE_AUDIT.metrics.listeningCount,
    reading:GRADE5_TURKISH_FULL_SCOPE_AUDIT.metrics.readingCount,
    speaking:GRADE5_TURKISH_FULL_SCOPE_AUDIT.metrics.speakingCount,
    writing:GRADE5_TURKISH_FULL_SCOPE_AUDIT.metrics.writingCount
  },{listening:25,reading:27,speaking:26,writing:22});
});

test('5. sınıf Türkçe geniş dalgası korunurken tamamlama motoru 100 çıktıyı kapatır',()=>{
  const audit=auditGrade5TurkishBroadWaveCatalog(items);
  assert.equal(audit.ok,true,audit.errors.join('\n'));
  assert.deepEqual(audit.metrics,{itemCount:20,outcomeCount:20,choiceCount:10,performanceCount:10,humanReviewStatus:'NOT_MEASURED',gameAdaptationAllowed:false});
  assert.equal(GRADE5_TURKISH_FULL_SCOPE_AUDIT.metrics.implementedOutcomeCount,100);
  assert.equal(GRADE5_TURKISH_FULL_SCOPE_AUDIT.metrics.uncoveredOutcomeCount,0);
});

test('üretici konuşma ve yazma çıktıları zorla çoktan seçmeliye çevrilmez',()=>{
  const performance=items.filter(x=>x.itemFormat==='open-response');
  assert.equal(performance.length,10);
  assert.equal(performance.every(x=>x.responseModel?.rubricCriteria?.length>0),true);
});

test('5. sınıf görevleri üç ipucu, bağımsız doğrulama ve kapalı oyun sözleşmesi taşır',()=>{
  for(const item of items){
    const audit=auditGrade5TurkishBroadWaveQuestion(item);
    assert.equal(audit.ok,true,`${item.id}: ${audit.errors.join(', ')}`);
    assert.deepEqual(item.hints.map(h=>h.level),[1,2,3],item.id);
    assert.equal(item.gameBindings.length,0,item.id);
    assert.equal(item.content.humanReview.gameAdaptationAllowed,false,item.id);
  }
});

test('5. sınıf matris satırı silinirse tam kapsam denetimi RED üretir',()=>{
  const audit=auditGrade5TurkishFullScopeMatrix(GRADE5_TURKISH_FULL_SCOPE_MATRIX.slice(1));
  assert.equal(audit.ok,false);
  assert.equal(audit.errors.some(e=>e.startsWith('outcome-count')),true);
});
