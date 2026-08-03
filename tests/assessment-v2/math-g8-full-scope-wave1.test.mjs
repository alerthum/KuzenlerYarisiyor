import test from 'node:test';
import assert from 'node:assert/strict';
import { GRADE8_MATH_OUTCOMES_2018, GRADE8_MATH_INGESTION_STATUS } from '../../js/curriculum/outcomes/tr-g8-matematik-2018.js';
import { GRADE8_MATH_FULL_SCOPE_MATRIX, GRADE8_MATH_FULL_SCOPE_AUDIT, auditGrade8MathFullScopeMatrix } from '../../js/assessment-v2/math-g8-full-scope-matrix.js';
import { buildGrade8MathWave1Questions, auditGrade8MathWave1Catalog, auditGrade8MathWave1Question } from '../../js/assessment-v2/math-g8-wave1.js';

const items=buildGrade8MathWave1Questions();

test('8. sınıf Matematik 52 resmî kazanımın tamamını tam kapsam matrisine bağlar',()=>{
  assert.equal(GRADE8_MATH_INGESTION_STATUS.status,'COMPLETE');
  assert.equal(GRADE8_MATH_OUTCOMES_2018.length,52);
  assert.equal(GRADE8_MATH_FULL_SCOPE_MATRIX.length,52);
  assert.equal(GRADE8_MATH_FULL_SCOPE_AUDIT.ok,true,GRADE8_MATH_FULL_SCOPE_AUDIT.errors.join('\n'));
  assert.deepEqual(GRADE8_MATH_FULL_SCOPE_AUDIT.metrics.unitCounts,{
    'Sayılar ve İşlemler':16,
    Cebir:13,
    'Geometri ve Ölçme':16,
    'Veri İşleme':2,
    Olasılık:5
  });
});

test('her Matematik kazanımı çözücü, bağımsız doğrulayıcı, soru ailesi ve yanılgı ailesi taşır',()=>{
  for(const row of GRADE8_MATH_FULL_SCOPE_MATRIX){
    assert.equal(row.recommendedItemFormats.length>0,true,row.outcomeCode);
    assert.equal(row.questionFamilies.length>=3,true,row.outcomeCode);
    assert.equal(row.misconceptionFamilies.length>=3,true,row.outcomeCode);
    assert.equal(Boolean(row.solverFamily),true,row.outcomeCode);
    assert.equal(Boolean(row.independentVerifier),true,row.outcomeCode);
    assert.equal(row.gameAdaptationAllowed,false,row.outcomeCode);
  }
});

test('inşa ve çizim kazanımları zorla yalnız çoktan seçmeliye indirgenmez',()=>{
  const construction=GRADE8_MATH_FULL_SCOPE_MATRIX.filter(row=>row.assessmentMode==='INTERACTIVE_CONSTRUCTION');
  assert.equal(construction.length,10);
  assert.equal(construction.every(row=>row.recommendedItemFormats.some(format=>['interactive-simulation','drag-drop','open-response'].includes(format))),true);
  assert.equal(GRADE8_MATH_FULL_SCOPE_AUDIT.metrics.humanRubricOutcomeCount,6);
});

test('ilk tam kapsam dalgası 12 yeni kazanımda dengeli ve solver-backed çalışır',()=>{
  const audit=auditGrade8MathWave1Catalog(items);
  assert.equal(audit.ok,true,audit.errors.join('\n'));
  assert.equal(items.length,12);
  assert.equal(new Set(items.flatMap(item=>item.curriculum.outcomeIds)).size,12);
  assert.deepEqual(audit.metrics.answerCounts,{A:3,B:3,C:3,D:3});
  for(const item of items){
    assert.equal(item.content.humanReview.status,'NOT_MEASURED');
    assert.equal(item.content.humanReview.gameAdaptationAllowed,false);
    assert.equal(item.gameBindings.length,0);
    assert.deepEqual(item.hints.map(hint=>hint.level),[1,2,3]);
    assert.equal(item.optionFeedback.length,4);
  }
});

test('pilot, ilk dalga ve tamamlama dalgaları 52 kazanımın tamamını mühendislik nesnesiyle kapsar',()=>{
  assert.equal(GRADE8_MATH_FULL_SCOPE_AUDIT.metrics.implementedOutcomeCount,52);
  assert.equal(GRADE8_MATH_FULL_SCOPE_AUDIT.metrics.implementedItemCount,52);
  assert.equal(GRADE8_MATH_FULL_SCOPE_AUDIT.metrics.uncoveredOutcomeCount,0);
  assert.equal(GRADE8_MATH_FULL_SCOPE_AUDIT.metrics.productReady,false);
});

test('doğru cevap mutasyonu bağımsız doğrulamada RED verir',()=>{
  const mutated=structuredClone(items[0]);
  mutated.answerKey.optionId='B';
  const audit=auditGrade8MathWave1Question(mutated);
  assert.equal(audit.ok,false);
  assert.equal(audit.errors.includes('independent-verification'),true);
});

test('model mutasyonu seçeneklerle uyuşmazsa solver kapısı RED verir',()=>{
  const mutated=structuredClone(items[8]);
  mutated.content.model.a=8;
  const audit=auditGrade8MathWave1Question(mutated);
  assert.equal(audit.ok,false);
  assert.equal(audit.errors.some(error=>error.startsWith('solver:')||error==='independent-verification'),true);
});

test('tam kapsam satırı silinirse matris denetimi RED verir',()=>{
  const audit=auditGrade8MathFullScopeMatrix(GRADE8_MATH_FULL_SCOPE_MATRIX.slice(1));
  assert.equal(audit.ok,false);
  assert.equal(audit.errors.some(error=>error.startsWith('outcome-count')),true);
});
