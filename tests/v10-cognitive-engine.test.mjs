import test from 'node:test';
import assert from 'node:assert/strict';
import { createV4LogicSession, auditCognitiveSession } from '../js/engines/learning-engine-v4.js';

const profile={id:'v10-test',grade:8,age:13};

test('8. sınıf mantık oturumu aynı aile ve düşünme kalıbını tekrarlamaz',()=>{
  const rounds=createV4LogicSession(profile,'v10-seed',8);
  assert.ok(rounds.length>=6);
  const audit=auditCognitiveSession(rounds);
  assert.equal(audit.ok,true,audit.errors.join('\n'));
  assert.equal(new Set(rounds.map(q=>q.familyId)).size,rounds.length);
  assert.equal(new Set(rounds.map(q=>q.thinkingPatternId)).size,rounds.length);
});

test('8. sınıfta zayıf mini egzersiz aileleri oturuma alınmaz',()=>{
  const blocked=new Set(['binary-switches','three-digit-code','set-logic-no-overlap','conditional-contrapositive','nested-containers','meeting-day-intersection']);
  for(let i=0;i<12;i++){
    const rounds=createV4LogicSession(profile,`seed-${i}`,8);
    assert.equal(rounds.some(q=>blocked.has(q.familyId)),false);
  }
});

test('cevabı metinde aynen veren soru kalite kapısından geçmez',()=>{
  const result=auditCognitiveSession([{familyId:'leak',thinkingPatternId:'SET_INFERENCE',prompt:'Hangisi doğrudur?',context:'Bütün araştırmacılar meraklıdır.',options:['Bütün araştırmacılar meraklıdır.','B','C','D'],answerValue:'Bütün araştırmacılar meraklıdır.',cognitiveDepth:5,explanation:'Bu açıklama kalite kontrolü için yeterince uzun tutulmuştur.',hints:['Öncülleri karşılaştır.','Cevabı doğrudan tekrar etme.']}]);
  assert.ok(result.errors.some(x=>x.includes('cevap soru metninde doğrudan sızıyor')));
});
