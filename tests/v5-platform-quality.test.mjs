import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createV4OlympiadSession, createV4LogicSession, v4FamilyStats } from '../js/engines/learning-engine-v4.js';
import { V5_QUALITY_REGISTRY, isQuarantinedFamily } from '../js/content-quality-v5.js';
import { loadProjectConfig, validateProjectConfig } from '../scripts/project-config.mjs';

const small={id:'v5-small',name:'Küçük',age:9,grade:4,skills:{}};
const big={id:'v5-big',name:'Büyük',age:13,grade:8,skills:{}};
const quarantined=['path-through-checkpoint','book-owner-matching','subset-target','digit-reversal-difference'];

test('kalite kayıtlarındaki kritik aileler challenge havuzunda karantinadadır',()=>{
  quarantined.forEach(id=>assert.equal(isQuarantinedFamily(id),true,id));
  for(const profile of [small,big]){
    for(let seed=1;seed<=120;seed+=1){
      const rounds=[...createV4OlympiadSession(profile,seed*2017,10,{}),...createV4LogicSession(profile,seed*3011,8,{})];
      for(const round of rounds) assert.equal(quarantined.includes(round.familyId),false,round.familyId);
    }
  }
});

test('olimpiyat ve zekâ challenge soruları en az iki kademeli, soruya bağlı ipucu taşır',()=>{
  for(const profile of [small,big]){
    for(let seed=1;seed<=80;seed+=1){
      const rounds=[...createV4OlympiadSession(profile,seed*3907,10,{}),...createV4LogicSession(profile,seed*4513,8,{})];
      for(const round of rounds){
        assert.ok(round.cognitiveDepth>=V5_QUALITY_REGISTRY.minChallengeDepth,round.familyId);
        assert.ok(round.hints?.length>=2,`${round.familyId}: iki ipucu`);
        const joined=round.hints.join(' ').toLocaleLowerCase('tr-TR');
        for(const fragment of V5_QUALITY_REGISTRY.forbiddenHintFragments) assert.equal(joined.includes(fragment),false,`${round.familyId}: ${fragment}`);
      }
    }
  }
});

test('dikdörtgen sayma sorusu formülün nedenini adım adım öğretir',()=>{
  let found=null;
  for(let seed=1;seed<=500&&!found;seed+=1) found=createV4OlympiadSession(big,seed*7919,10,{}).find(r=>r.familyId==='rectangle-grid-count');
  assert.ok(found,'dikdörtgen ailesi üretilemedi');
  assert.ok(found.teachingSolution);
  assert.ok(found.teachingSolution.steps.length>=5);
  assert.match(found.teachingSolution.why,/Çarpıyoruz|çarp/i);
  assert.match(found.explanation,/yatay çizgiden 2|yatay.*seç/i);
  assert.ok(found.hints.every(h=>/çizgi|dikdörtgen|sınır/i.test(h)));
});

test('aktif yüksek değerli aile sayısı 10 ve 8 soruluk farklı oturumları destekler',()=>{
  const stats=v4FamilyStats();
  assert.ok(stats.activeOlympiadFamilies>=14,stats.activeOlympiadFamilies);
  assert.ok(stats.activeLogicFamilies>=12,stats.activeLogicFamilies);
});

test('yerel mod hesap zorunluluğu olmadan çalışır, canlı mod Firebase ve giriş ister',async()=>{
  const configured=await loadProjectConfig();
  assert.ok(['local','vercel'].includes(configured.mode));
  assert.equal(configured.dataProvider,configured.mode==='vercel'?'firebase':'local');
  assert.deepEqual(validateProjectConfig(configured),[]);
  const unsafe={...configured,mode:'vercel',dataProvider:'local',firebase:{...configured.firebase,enabled:false},features:{...configured.features,requireAuthInLive:false,allowAnonymousPlay:true}};
  const errors=validateProjectConfig(unsafe);
  assert.ok(errors.some(x=>x.includes('Firebase veri sağlayıcısı')));
  assert.ok(errors.some(x=>x.includes('Firebase etkin')));
  assert.ok(errors.some(x=>x.includes('REQUIRE_AUTH_IN_LIVE=true')));
  assert.ok(errors.some(x=>x.includes('ALLOW_ANONYMOUS_PLAY=false')));
});

test('canlı platform veli, öğretmen ve öğrenci akışlarını içerir',async()=>{
  const platform=await readFile(new URL('../js/platform/firebase-platform.js',import.meta.url),'utf8');
  for(const required of ['parent','teacher','student','Öğrenci kodu','Toplu öğrenci kaydı','learnerMetrics','classrooms','questionReports']) assert.ok(platform.includes(required),required);
  const bootstrap=await readFile(new URL('../js/bootstrap.js',import.meta.url),'utf8');
  assert.ok(bootstrap.includes("RUNTIME_CONFIG.mode === 'vercel'"));
  assert.ok(bootstrap.includes('Firebase ayarları tamamlanmadan'));
});


test('öğrenci kodu üretimi yetkisiz genel Firestore sorgusu yapmaz ve canlı panel oyun bazında analiz sunar',async()=>{
  const platform=await readFile(new URL('../js/platform/firebase-platform.js',import.meta.url),'utf8');
  assert.equal(platform.includes("where('studentCode','==',code)"),false);
  assert.ok(platform.includes("auth/email-already-in-use"));
  assert.ok(platform.includes('Oyun bazında analiz'));
  assert.ok(platform.includes('analysis-learner'));
  assert.ok(platform.includes('complete-existing-account'));
  assert.ok(platform.includes('Hesap kaydını tamamla'));
});

test('Firestore kuralları rol ve öğrenci sahipliğine göre merkezi veriyi korur',async()=>{
  const rules=await readFile(new URL('../firebase/firestore.rules',import.meta.url),'utf8');
  for(const required of ['canAccessLearner','isOwnStudent','isParentOf','isTeacherOf','learnerStates','learnerMetrics','attempts','classrooms']) assert.ok(rules.includes(required),required);
  assert.match(rules,/match \/\{document=\*\*\}[\s\S]*allow read, write: if false/);
});


test('Firestore kuralları istemci tarafından rol yükseltmeyi ve sahiplik alanı değiştirmeyi engeller',async()=>{
  const rules=await readFile(new URL('../firebase/firestore.rules',import.meta.url),'utf8');
  assert.match(rules,/affectedKeys\(\)\.hasOnly\(\['displayName', 'updatedAt'\]\)/);
  assert.match(rules,/request\.resource\.data\.role == resource\.data\.role/);
  assert.match(rules,/request\.resource\.data\.parentIds == resource\.data\.parentIds/);
  assert.match(rules,/request\.resource\.data\.teacherIds == resource\.data\.teacherIds/);
  assert.match(rules,/request\.resource\.data\.classroomIds == resource\.data\.classroomIds/);
  assert.match(rules,/request\.resource\.data\.teacherIds == resource\.data\.teacherIds/);
});

test('soru kalite kayıtlarının tamamı V5 paketinde bulunur',async()=>{
  const records=await readFile(new URL('../SORU_KALITE_KAYITLARI.md',import.meta.url),'utf8');
  for(let no=1;no<=11;no+=1) assert.ok(records.includes(`Kayıt ${String(no).padStart(3,'0')}`),`Kayıt ${no}`);
});
