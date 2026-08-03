import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {decideV11Publication,routeV11PublicationDecision,V11_PUBLICATION_DECISIONS} from '../js/engines/v11-publication-gate.js';
const catalog=JSON.parse(fs.readFileSync(new URL('../content/v11/ai-generation-contracts.v11.json',import.meta.url),'utf8'));
const c=catalog.contracts.find(x=>x.skeletonId==='INFO_SECME_01');
function validOutput(){return {
 contractId:c.contractId,skeletonId:c.skeletonId,difficulty:2,variationAxis:c.generationInstruction.variationAxes[0],
 source:'Arılar, yiyecek kaynağının yönünü ve uzaklığını kovandaki diğer arılara özel dans hareketleriyle aktarır.',
 prompt:'Metne göre arılar yiyecek kaynağına ilişkin yön bilgisini nasıl paylaşır?',
 options:['Özel dans hareketleriyle paylaşır.','Kovana farklı bir koku bırakarak paylaşır.','Vücut rengini değiştirerek paylaşır.','Kanat sesini tamamen keserek paylaşır.'],correctIndex:0,
 explanation:'Metindeki E1 kanıtı, yön ve uzaklık bilgisinin özel dans hareketleriyle aktarıldığını açıkça belirtir.',
 evidenceMap:{evidenceUnits:[{evidenceId:'E1',text:'yönünü ve uzaklığını özel dans hareketleriyle aktarır'}],correctAnswerEvidenceIds:['E1']},
 optionDiagnostics:[
 {optionIndex:0,isCorrect:true,misconceptionId:null,evidenceIds:['E1']},
 {optionIndex:1,isCorrect:false,misconceptionId:'INFO_SECME_01_M1',evidenceIds:[]},
 {optionIndex:2,isCorrect:false,misconceptionId:'INFO_SECME_01_M2',evidenceIds:[]},
 {optionIndex:3,isCorrect:false,misconceptionId:'INFO_SECME_01_M3',evidenceIds:[]}],
 qualitySelfCheck:{oneBestAnswer:true,noAnswerLeak:true,skeletonLogicPreserved:true,distinctMisconceptions:true,realVariationUsed:true}
};}

test('tam geçerli üretim yalnız PUBLISH kararıyla öğrenciye açılır',()=>{
 const result=decideV11Publication({output:validOutput(),catalog});
 assert.equal(result.decision,V11_PUBLICATION_DECISIONS.PUBLISH); assert.equal(result.publishable,true); assert.equal(result.auditTrail.studentVisible,true); assert.match(result.fingerprint,/^v11q_/);
});

test('geçerli fakat zayıf metin editör REVIEW kuyruğuna gider',()=>{
 const output=validOutput(); output.source='Arılar dans eder.';
 const result=decideV11Publication({output,catalog});
 assert.equal(result.decision,'REVIEW'); assert.equal(result.publishable,false); assert.ok(result.warnings.includes('SOURCE_TOO_SHORT'));
});

test('bozuk JSON ve düzeltilebilir sözleşme hataları QUARANTINE olur',()=>{
 assert.equal(decideV11Publication({rawOutput:'{bozuk}',catalog}).decision,'QUARANTINE');
 const output=validOutput(); output.options.pop();
 const result=decideV11Publication({output,catalog}); assert.equal(result.decision,'QUARANTINE'); assert.ok(result.errors.includes('OPTIONS_INVALID'));
});

test('bilinmeyen veya kimliği değiştirilmiş sözleşme REJECT edilir ve kuyruklar ayrılır',()=>{
 const unknown=validOutput(); unknown.contractId='AI_UNKNOWN'; unknown.skeletonId='UNKNOWN';
 const rejected=decideV11Publication({output:unknown,catalog}); assert.equal(rejected.decision,'REJECT');
 const queues={}; routeV11PublicationDecision(rejected,queues); routeV11PublicationDecision(decideV11Publication({output:validOutput(),catalog}),queues);
 assert.equal(queues.reject.length,1); assert.equal(queues.publish.length,1);
});
