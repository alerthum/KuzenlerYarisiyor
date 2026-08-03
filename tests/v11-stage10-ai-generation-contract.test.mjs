import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {getV11AiContract,buildV11AiGenerationPrompt,parseV11AiJson,validateV11AiOutput} from '../js/engines/v11-ai-generation-contract.js';
const catalog=JSON.parse(fs.readFileSync(new URL('../content/v11/ai-generation-contracts.v11.json',import.meta.url),'utf8'));

test('40 iskeletin tamamı benzersiz AI üretim sözleşmesi taşır',()=>{
  assert.equal(catalog.contracts.length,40);
  assert.equal(new Set(catalog.contracts.map(x=>x.contractId)).size,40);
  assert.ok(catalog.contracts.every(x=>x.outputContract.format==='STRICT_JSON'));
});

test('AI promptu iskelet, zorluk, varyasyon ve üç yanılgıyı açıkça taşır',()=>{
  const c=getV11AiContract(catalog,'INFO_SECME_01');
  const prompt=buildV11AiGenerationPrompt(c,{difficulty:3,topic:'arıların iletişimi'});
  assert.match(prompt,/INFO_SECME_01/);
  assert.match(prompt,/3-HARD/);
  assert.match(prompt,/INFO_SECME_01_M1/);
  assert.match(prompt,/Yalnız JSON/);
  assert.throws(()=>buildV11AiGenerationPrompt(c,{variationAxis:'Sadece konu değiştir'}));
});

test('markdown veya geçersiz JSON çıktısı kabul edilmez',()=>{
  assert.throws(()=>parseV11AiJson('```json\n{}\n```'),/MARKDOWN_WRAPPER_FORBIDDEN/);
  assert.throws(()=>parseV11AiJson('{bozuk}'),/INVALID_JSON_OUTPUT/);
  assert.deepEqual(parseV11AiJson('{"ok":true}'),{ok:true});
});

test('katı çıktı doğrulaması izlenebilir doğru cevap ve üç özgün yanılgı ister',()=>{
  const c=getV11AiContract(catalog,'INFO_SECME_01');
  const output={
    contractId:c.contractId,skeletonId:c.skeletonId,difficulty:2,variationAxis:c.generationInstruction.variationAxes[0],
    source:'Arılar yönlerini dans hareketleriyle diğer arılara aktarır.',prompt:'Metne göre arılar yön bilgisini nasıl paylaşır?',
    options:['Dans hareketleriyle','Koku bırakarak','Renk değiştirerek','Kanat sesini keserek'],correctIndex:0,
    explanation:'E1 kanıtı arıların dansla yön bildirdiğini açıklar.',
    evidenceMap:{evidenceUnits:[{evidenceId:'E1',text:'yönlerini dans hareketleriyle aktarır'}],correctAnswerEvidenceIds:['E1']},
    optionDiagnostics:[
      {optionIndex:0,isCorrect:true,misconceptionId:null,evidenceIds:['E1']},
      {optionIndex:1,isCorrect:false,misconceptionId:'INFO_SECME_01_M1',evidenceIds:[]},
      {optionIndex:2,isCorrect:false,misconceptionId:'INFO_SECME_01_M2',evidenceIds:[]},
      {optionIndex:3,isCorrect:false,misconceptionId:'INFO_SECME_01_M3',evidenceIds:[]}
    ],
    qualitySelfCheck:{oneBestAnswer:true,noAnswerLeak:true,skeletonLogicPreserved:true,distinctMisconceptions:true,realVariationUsed:true}
  };
  assert.equal(validateV11AiOutput(output,c).accepted,true);
  output.optionDiagnostics[3].misconceptionId='INFO_SECME_01_M2';
  const invalid=validateV11AiOutput(output,c);
  assert.equal(invalid.accepted,false);
  assert.ok(invalid.errors.includes('MISCONCEPTION_SET_INVALID'));
});
