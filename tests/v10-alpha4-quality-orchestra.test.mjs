import test from 'node:test';
import assert from 'node:assert/strict';
import { saveStoredState, loadStoredState, clearStoredState } from '../js/storage.js';
import { runQualityOrchestra } from '../js/quality/quality-orchestra-v10.js';
import { evaluatePublicationReadiness, enforceSessionQuality } from '../js/quality/global-quality-engine-v10.js';

test('Node ortamında localStorage yokken kayıt fonksiyonları sessiz ve güvenlidir',()=>{
  assert.equal(loadStoredState(),null);
  assert.equal(saveStoredState({attempts:[],profiles:[],questionReports:[]}),false);
  assert.equal(clearStoredState(),false);
});

test('Quality Orchestra tüm derslerde ortak, ders özel eşiklerle çalışır',()=>{
  const report={overall:90,errors:[],warnings:[],dimensions:{curriculum:90,difficulty:90,cognitive:90,distractor:90,pedagogy:90,language:90}};
  assert.equal(runQualityOrchestra(report,{}, {subjectId:'mathematics'}).verdict,'GOLD');
  assert.equal(runQualityOrchestra(report,{}, {subjectId:'turkish'}).subjectLabel,'Türkçe');
  assert.equal(runQualityOrchestra(report,{}, {subjectId:'olympiad'}).subjectLabel,'Olimpiyat');
});

test('kritik bilişsel kalite düşüklüğü zor soruyu yayından reddeder',()=>{
  const q={kind:'choice',prompt:'Hangisi doğrudur?',context:'Kısa bilgi.',options:['A','B','C','D'],answerValue:'A',difficulty:5,cognitiveDepth:5,explanation:'Kısa.'};
  const r=evaluatePublicationReadiness(q,{grade:8,subjectId:'logic'});
  assert.equal(r.status,'REJECT');
  assert.equal(r.qualityOrchestra.chiefJudge,'YAYINLANAMAZ');
});

test('ilk deneyimde REVIEW soruları vitrin oturumuna alınmaz',()=>{
  const good={kind:'choice',prompt:'Verilen çok adımlı koşullara göre hangi sonuç zorunludur?',context:'Ayşe, Burak ve Ceren farklı günlerde sunum yapacaktır. Ayşe Burak’tan önce, Ceren ise Ayşe’den hemen sonra sunum yapacaktır.',options:['Ayşe ilk sıradadır.','Burak ilk sıradadır.','Ceren son sıradadır.','Burak Ceren’den öncedir.'],answerValue:'Ayşe ilk sıradadır.',difficulty:4,cognitiveDepth:4,explanation:'Koşullar birlikte değerlendirildiğinde Ayşe, Ceren’den hemen önce ve Burak’tan önce olmalıdır.',familyId:'ordering-premium',thinkingPatternId:'ORDERING_TABLE'};
  const weak={...good,prompt:'Hangisi doğrudur?',context:'Kısa bilgi.',familyId:'weak',thinkingPatternId:'GENERAL_REASONING'};
  const out=enforceSessionQuality([weak,good],{grade:8,subjectId:'logic'},{targetCount:2,firstExperience:true});
  assert.ok(out.rounds.every(x=>x.globalQualityStatus!=='REVIEW'));
  assert.equal(out.firstExperience,true);
});
