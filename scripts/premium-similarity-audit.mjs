import fs from 'node:fs';
import path from 'node:path';
import { PREMIUM_FAMILY_CATALOG } from '../js/content-studio/premium-family-studio-v10.js';
import { generatePremiumGoldQuestion } from '../js/content-studio/premium-gold-content-v10.js';

function normalize(value='') { return String(value).toLocaleLowerCase('tr-TR').replace(/[^a-z0-9çğıöşü\s]/gi,' ').replace(/\s+/g,' ').trim(); }
function tokens(value='') { return new Set(normalize(value).split(' ').filter((x) => x.length > 2)); }
function jaccard(a,b){ const A=tokens(a),B=tokens(b); if(!A.size&&!B.size)return 1; let i=0; for(const x of A)if(B.has(x))i++; return i/(A.size+B.size-i); }

const samples=[];
for(const family of PREMIUM_FAMILY_CATALOG){
  for(let i=0;i<24;i++){
    const result=generatePremiumGoldQuestion(family.familyId,`similarity-${family.familyId}-${i}`);
    if(result.ok) samples.push({familyId:family.familyId,questionKey:result.question.questionKey,text:`${result.question.context||''} ${result.question.prompt||''}`});
  }
}
const textOwners=new Map(); const keyOwners=new Map(); const repeatedOutputs=[]; const keyConflicts=[]; const near=[];
for(const sample of samples){
  const text=normalize(sample.text);
  const textKey=`${sample.familyId}|${text}`;
  if(textOwners.has(textKey)) repeatedOutputs.push({first:textOwners.get(textKey),repeat:sample}); else textOwners.set(textKey,sample);
  if(keyOwners.has(sample.questionKey) && normalize(keyOwners.get(sample.questionKey).text)!==text) keyConflicts.push({first:keyOwners.get(sample.questionKey),conflict:sample}); else keyOwners.set(sample.questionKey,sample);
}
const unique=[...textOwners.values()];
for(let i=0;i<unique.length;i++)for(let j=i+1;j<unique.length;j++){
  if(unique[i].familyId!==unique[j].familyId) continue;
  const score=jaccard(unique[i].text,unique[j].text);
  if(score>=0.93 && normalize(unique[i].text)!==normalize(unique[j].text)) near.push({a:unique[i].questionKey,b:unique[j].questionKey,familyId:unique[i].familyId,score:Number(score.toFixed(3))});
}
const familyCapacity=Object.fromEntries(PREMIUM_FAMILY_CATALOG.map((family)=>{
  const familySamples=samples.filter(x=>x.familyId===family.familyId);
  const uniqueCount=new Set(familySamples.map(x=>normalize(x.text))).size;
  return [family.familyId,{sampleCount:familySamples.length,uniqueCount,repetitionCount:familySamples.length-uniqueCount}];
}));
const result={generatedAt:new Date().toISOString(),sampleCount:samples.length,uniqueOutputs:unique.length,repeatedOutputs:repeatedOutputs.length,questionKeyConflicts:keyConflicts.length,nearDuplicatePairs:near.length,familyCapacity,pass:keyConflicts.length===0,notes:['Aynı deterministik varyasyonun farklı seedlerde yeniden üretilmesi kapasite uyarısıdır; oturum katmanı questionKey/seenQuestionKeys ile tekrar yayınını engeller.','Release kapısı, aynı questionKey altında farklı soru metni oluşmasını kritik hata kabul eder.'],nearDuplicateExamples:near.slice(0,20)};
fs.mkdirSync(path.resolve('quality-reports'),{recursive:true});
fs.writeFileSync(path.resolve('quality-reports/PREMIUM_SIMILARITY_AUDIT_V10.json'),JSON.stringify(result,null,2));
console.log(`Premium benzerlik denetimi: ${samples.length} örnek • ${unique.length} benzersiz çıktı • ${result.questionKeyConflicts} anahtar çakışması • ${repeatedOutputs.length} kapasite tekrarı.`);
if(!result.pass) process.exitCode=1;
