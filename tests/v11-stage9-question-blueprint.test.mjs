import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { getV11Blueprint, createV11ProductionContract, auditV11QuestionCandidate } from '../js/engines/v11-question-blueprint.js';

const catalog=JSON.parse(fs.readFileSync(new URL('../content/v11/question-blueprints.v11.json',import.meta.url),'utf8'));

test('40 iskeletin tamamı çalıştırılabilir blueprint taşır',()=>{
  assert.equal(catalog.blueprints.length,40);
  assert.equal(new Set(catalog.blueprints.map(x=>x.skeletonId)).size,40);
  assert.ok(catalog.blueprints.every(x=>x.sourceContract&&x.evidenceContract&&x.questionContract&&x.optionContract&&x.qualityGate));
});

test('her blueprint üç ayrı yanılgı ve üç zorluk seviyesi taşır',()=>{
  for(const b of catalog.blueprints){
    assert.equal(b.optionContract.distractors.length,3,b.skeletonId);
    assert.equal(new Set(b.optionContract.distractors.map(x=>x.misconceptionId)).size,3,b.skeletonId);
    assert.equal(b.difficultyContract.levels.length,3,b.skeletonId);
  }
});

test('üretim sözleşmesi katalog dışı varyasyon eksenini reddeder',()=>{
  const b=getV11Blueprint(catalog,'INFO_SECME_01');
  const c=createV11ProductionContract(b,{difficulty:2});
  assert.equal(c.skeletonId,'INFO_SECME_01');
  assert.equal(c.difficulty.level,2);
  assert.throws(()=>createV11ProductionContract(b,{variationAxis:'Sadece konu adını değiştir'}));
});

test('aday soru kalite denetimi kanıt, seçenek ve yanılgı sözleşmesini uygular',()=>{
  const b=getV11Blueprint(catalog,'INFO_SECME_01');
  const candidate={
    skeletonId:b.skeletonId,prompt:'Metindeki bilgiye göre hangisi doğrudur?',
    options:['A','B','C','D'],correctIndex:0,variationAxis:b.variationContract.realVariationAxes[0],
    explanation:'Metindeki E1 kanıtı doğru seçeneği destekler.',
    evidenceMap:{evidenceUnits:[{evidenceId:'E1',text:'Kanıt'}],correctAnswerEvidenceIds:['E1']},
    optionDiagnostics:[
      {optionIndex:0,isCorrect:true},
      {optionIndex:1,isCorrect:false,misconceptionId:`${b.skeletonId}_M1`},
      {optionIndex:2,isCorrect:false,misconceptionId:`${b.skeletonId}_M2`},
      {optionIndex:3,isCorrect:false,misconceptionId:`${b.skeletonId}_M3`}
    ]
  };
  assert.equal(auditV11QuestionCandidate(candidate,b).accepted,true);
  candidate.evidenceMap.correctAnswerEvidenceIds=[];
  assert.equal(auditV11QuestionCandidate(candidate,b).accepted,false);
});
