import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GRADE8_HISTORY_OUTCOMES_2018 } from '../../js/curriculum/outcomes/tr-g8-inkilap-2018.js';
import { GRADE8_DKAB_OUTCOMES_2018 } from '../../js/curriculum/outcomes/tr-g8-dkab-2018.js';
import { GRADE8_ENGLISH_OUTCOMES_2018 } from '../../js/curriculum/outcomes/tr-g8-ingilizce-2018.js';
import { buildGrade8HistoryFullScopeTasks, GRADE8_HISTORY_FULL_SCOPE_AUDIT, grade8HistoryFullScopeEngine } from '../../js/assessment-v2/history-g8-full-scope-engine.js';
import { buildGrade8DkabFullScopeTasks, GRADE8_DKAB_FULL_SCOPE_AUDIT, grade8DkabFullScopeEngine } from '../../js/assessment-v2/dkab-g8-full-scope-engine.js';
import { buildGrade8EnglishFullScopeTasks, GRADE8_ENGLISH_FULL_SCOPE_AUDIT, grade8EnglishFullScopeEngine } from '../../js/assessment-v2/english-g8-full-scope-engine.js';
import { GRADE5_TURKISH_COMPLETION_AUDIT } from '../../js/assessment-v2/turkish-g5-completion-wave.js';
import { GRADE8_TURKISH_COMPLETION_AUDIT } from '../../js/assessment-v2/turkish-g8-completion-wave.js';

test('üç eksik LGS dersinin resmî kazanımları yerel yetkili belgelerle tam kaydedilir',()=>{
  assert.equal(GRADE8_HISTORY_OUTCOMES_2018.length,33);assert.equal(GRADE8_DKAB_OUTCOMES_2018.length,28);assert.equal(GRADE8_ENGLISH_OUTCOMES_2018.length,70);
  for(const file of ['docs/sources/INKILAP_TARIHI_8_2018.pdf','docs/sources/DKAB_4_8_2018.pdf','docs/sources/INGILIZCE_2_8_2018.pdf'])assert.equal(fs.existsSync(file),true,file);
});

test('İnkılap, DKAB ve İngilizce motorları her resmî kazanım için kanonik görev üretir',()=>{
  assert.equal(GRADE8_HISTORY_FULL_SCOPE_AUDIT.ok,true,GRADE8_HISTORY_FULL_SCOPE_AUDIT.errors.join('\n'));
  assert.equal(GRADE8_DKAB_FULL_SCOPE_AUDIT.ok,true,GRADE8_DKAB_FULL_SCOPE_AUDIT.errors.join('\n'));
  assert.equal(GRADE8_ENGLISH_FULL_SCOPE_AUDIT.ok,true,GRADE8_ENGLISH_FULL_SCOPE_AUDIT.errors.join('\n'));
  assert.deepEqual([buildGrade8HistoryFullScopeTasks().length,buildGrade8DkabFullScopeTasks().length,buildGrade8EnglishFullScopeTasks().length],[33,28,70]);
});

test('yeni ders motorlarında ayrı doğrulayıcı, üç ipucu, rubrik ve oyun kilidi zorunludur',()=>{
  const pairs=[[grade8HistoryFullScopeEngine,buildGrade8HistoryFullScopeTasks()],[grade8DkabFullScopeEngine,buildGrade8DkabFullScopeTasks()],[grade8EnglishFullScopeEngine,buildGrade8EnglishFullScopeTasks()]];
  for(const [engine,items] of pairs)for(const item of items){
    assert.equal(item.hints.length,3,item.id);assert.equal(item.responseModel.rubricCriteria.length>=3,true,item.id);assert.equal(item.gameBindings.length,0,item.id);assert.equal(item.content.humanReview.gameAdaptationAllowed,false,item.id);
    const solved=engine.solve(item);assert.equal(engine.verifyIndependent(item,solved),true,item.id);assert.notEqual(item.verifier.solverId,item.verifier.independentVerifierId,item.id);
  }
});

test('5. ve 8. sınıf Türkçe tamamlayıcı motorları resmî kapsam boşluğunu sıfırlar',()=>{
  assert.equal(GRADE5_TURKISH_COMPLETION_AUDIT.ok,true,GRADE5_TURKISH_COMPLETION_AUDIT.errors.join('\n'));
  assert.equal(GRADE8_TURKISH_COMPLETION_AUDIT.ok,true,GRADE8_TURKISH_COMPLETION_AUDIT.errors.join('\n'));
  assert.equal(GRADE5_TURKISH_COMPLETION_AUDIT.metrics.engineeringScopeComplete,true);
  assert.equal(GRADE8_TURKISH_COMPLETION_AUDIT.metrics.engineeringScopeComplete,true);
});

test('rubrik kriteri mutasyonu bağımsız doğrulamada RED üretir',()=>{
  const item=buildGrade8HistoryFullScopeTasks()[0];const solved=structuredClone(grade8HistoryFullScopeEngine.solve(item));solved.criteria[0]='kanıtsız değiştirilmiş ölçüt';
  assert.equal(grade8HistoryFullScopeEngine.verifyIndependent(item,solved),false);
});
