import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createDynamicParagraphSession, paragraphFamilyStats } from '../js/engines/paragraph-engine-v4.js';
import { V11_PARAGRAPH_FAMILY_MAPPING, getV11QuestionIdentity } from '../js/engines/v11-question-identity.js';

const catalog=JSON.parse(fs.readFileSync(new URL('../content/v11/cognitive-skeletons.v11.json',import.meta.url),'utf8'));
const validSkeletons=new Set(catalog.skeletons.map(x=>x.skeletonId));

test('Paragraf Dedektifi 16 ailesinin tamamı kesin V11 kimliği taşır',()=>{
 assert.equal(paragraphFamilyStats().dynamicFamilies,16);
 assert.equal(Object.keys(V11_PARAGRAPH_FAMILY_MAPPING).length,16);
 for(const [familyId,mapping] of Object.entries(V11_PARAGRAPH_FAMILY_MAPPING)){
  assert.equal(mapping.mappingStatus,'CONFIRMED',familyId);
  assert.ok(validSkeletons.has(mapping.skeletonId),familyId);
  assert.equal(mapping.distractorMisconceptions.length,3,familyId);
 }
});

test('üretilen her paragraf sorusu Question Identity Card alanlarını taşır',()=>{
 for(const grade of [3,5,8,11]){
  const questions=createDynamicParagraphSession({id:`ogrenci-${grade}`,grade,age:grade+5},`stage3-${grade}`,8);
  assert.ok(questions.length>0);
  for(const q of questions){
   assert.ok(q.v11Identity);
   assert.equal(q.skeletonId,q.v11Identity.skeletonId);
   assert.equal(q.skeletonFamilyId,q.v11Identity.skeletonFamilyId);
   assert.ok(validSkeletons.has(q.skeletonId));
   assert.equal(q.v11Identity.distractorMisconceptions.length,3);
   assert.ok(q.v11Identity.mainSkill);
   assert.ok(q.v11Identity.subSkill);
  }
 }
});

test('bilinmeyen aileye sessizce kimlik uydurulmaz',()=>{
 assert.equal(getV11QuestionIdentity('olmayan-aile'),null);
});
