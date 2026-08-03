import fs from 'node:fs';
import path from 'node:path';

const file=path.resolve('content/v11/cognitive-skeletons.v11.json');
const out=path.resolve('quality-reports/V11_SKELETON_AUDIT.json');
if(!fs.existsSync(file)) throw new Error(`V11 katalog bulunamadı: ${file}`);
const catalog=JSON.parse(fs.readFileSync(file,'utf8'));
const items=Array.isArray(catalog.skeletons)?catalog.skeletons:[];
const errors=[];
const warnings=[];
const ids=new Set();
for(const s of items){
  if(!s.skeletonId) errors.push('İskelet kimliği eksik.');
  if(ids.has(s.skeletonId)) errors.push(`Tekrarlı iskelet: ${s.skeletonId}`);
  ids.add(s.skeletonId);
  if(!Array.isArray(s.grades)||!s.grades.length) errors.push(`${s.skeletonId}: sınıf aralığı eksik.`);
  if(!Array.isArray(s.cognitiveSteps)||s.cognitiveSteps.length<2) errors.push(`${s.skeletonId}: bilişsel adımlar yetersiz.`);
  if(!Array.isArray(s.distractors)||s.distractors.length!==3) errors.push(`${s.skeletonId}: üç çeldirici yanılgısı zorunlu.`);
  if(!s.correctAnswerLogic) errors.push(`${s.skeletonId}: doğru cevap mantığı eksik.`);
  if(!s.difficultyRules?.easy||!s.difficultyRules?.medium||!s.difficultyRules?.hard) errors.push(`${s.skeletonId}: zorluk kuralları eksik.`);
  if(!Array.isArray(s.realVariationAxes)||!s.realVariationAxes.length) errors.push(`${s.skeletonId}: gerçek varyasyon ekseni eksik.`);
  if(!Array.isArray(s.qualityRejectionReasons)||!s.qualityRejectionReasons.length) errors.push(`${s.skeletonId}: kalite ret nedeni eksik.`);
  for(const target of s.notTogetherWith||[]){ if(!/^([A-Z_]+_\d{2})$/.test(target)) warnings.push(`${s.skeletonId}: ilişki hedefi biçimi kontrol edilmeli: ${target}`); }
}
if(items.length!==40) errors.push(`Beklenen 40 iskelet, bulunan ${items.length}.`);
const families=[...new Set(items.map(x=>x.familyId))];
if(families.length!==8) errors.push(`Beklenen 8 aile, bulunan ${families.length}.`);
const report={generatedAt:new Date().toISOString(),version:catalog.version,total:items.length,families:families.length,errors,warnings,pass:errors.length===0};
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(report,null,2));
console.log(`V11 Skeleton Audit: ${report.total} iskelet • ${report.families} aile • ${errors.length} hata • ${warnings.length} uyarı`);
if(errors.length) process.exitCode=1;
