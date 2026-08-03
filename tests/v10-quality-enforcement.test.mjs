import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluatePublicationReadiness, enforceSessionQuality } from '../js/quality/global-quality-engine-v10.js';
import { createGameSession } from '../js/games/registry.js';

const bad={kind:'choice',familyId:'bad-dynamic',context:'Elif turuncu başlıklı proje dosyasında şu bilgileri verdi.',prompt:'Bu iddiayı en iyi destekleyen bulgu hangisidir?',options:['Aynı yöntemle çalışan grup daha başarılı oldu.','Bazı öğrenciler spor yaptı.','Sınıf duvarı maviye boyandı.','Kalemlerin sayısı değişti.'],answerValue:'Aynı yöntemle çalışan grup daha başarılı oldu.',difficulty:5,cognitiveDepth:5,explanation:'İlk seçenek iddiayla ilişkilidir.'};

test('yapay bağlam ve ilgisiz çeldiriciler üst sınıfta yayını durdurur',()=>{
  const r=evaluatePublicationReadiness(bad,{grade:8,gameId:'paragraph-detective',subjectId:'turkish'});
  assert.equal(r.status,'REJECT');
  assert.ok(r.errors.includes('artificial_context_upper_grade'));
  assert.ok(r.errors.includes('multiple_irrelevant_distractors'));
});

test('kalite uygulama katmanı reddedilen soruyu oturuma almaz',()=>{
  const good={kind:'choice',familyId:'claim-evidence-premium',thinkingPatternId:'EVIDENCE_EVALUATION',context:'İki özdeş grup aynı toplam süre çalışmıştır. Bir grup çalışmayı dört güne bölmüş, diğer grup tek günde tamamlamıştır. Bir hafta sonra iki gruba daha önce görmedikleri fakat aynı kurala dayanan sorular verilmiştir.',prompt:'Aralıklı çalışmanın kalıcı öğrenmeyi artırdığı iddiasını en doğrudan sınayan bulgu hangisidir?',options:['Aralıklı çalışan grubun yeni sorulardaki doğruluk oranının daha yüksek olması.','Aralıklı çalışan grubun daha çok sayfa kullanması.','Tek günde çalışan grubun sınıfa daha erken gelmesi.','İki grubun farklı renk kalem seçmesi.'],answerValue:'Aralıklı çalışan grubun yeni sorulardaki doğruluk oranının daha yüksek olması.',difficulty:4,cognitiveDepth:4,explanation:'İddia kalıcı öğrenmeyle ilgilidir; bir hafta sonraki yeni sorularda başarı, kalıcılık ve aktarımı doğrudan ölçer.'};
  const e=enforceSessionQuality([bad,good],{grade:8,gameId:'paragraph-detective',subjectId:'turkish'},{targetCount:2,firstExperience:true});
  assert.equal(e.rounds.some(x=>x.familyId==='bad-dynamic'),false);
  assert.ok(e.rejected.some(x=>x.familyId==='bad-dynamic'));
});

test('gerçek oyun oturumları yayın engelleme raporu taşır',()=>{
  const session=createGameSession('paragraph-detective',{id:'quality-enforcement',grade:8,age:13,skills:{}},'alpha3',{completedSessionCount:0});
  assert.ok(session.globalQualityAudit.enforcement);
  assert.equal(session.globalQualityAudit.enforcement.accepted,session.rounds.length);
  assert.ok(Array.isArray(session.globalQualityAudit.enforcement.rejected));
});
