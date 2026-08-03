import fs from 'node:fs';
const catalog = JSON.parse(fs.readFileSync(new URL('../content/v11/question-blueprints.v11.json', import.meta.url), 'utf8'));
const errors=[];
if(catalog.blueprintCount!==40) errors.push(`Blueprint sayısı 40 değil: ${catalog.blueprintCount}`);
if(catalog.familyCount!==8) errors.push(`Aile sayısı 8 değil: ${catalog.familyCount}`);
const ids=new Set();
for(const b of catalog.blueprints){
  if(ids.has(b.skeletonId)) errors.push(`Tekrarlı iskelet: ${b.skeletonId}`); ids.add(b.skeletonId);
  if(b.optionContract?.distractors?.length!==3) errors.push(`${b.skeletonId}: 3 çeldirici yok`);
  if(b.difficultyContract?.levels?.length!==3) errors.push(`${b.skeletonId}: 3 zorluk yok`);
  if(!b.variationContract?.realVariationAxes?.length) errors.push(`${b.skeletonId}: varyasyon ekseni yok`);
  if(!b.qualityGate?.rejectReasons?.length) errors.push(`${b.skeletonId}: ret nedeni yok`);
  if(!b.evidenceContract?.evidenceCount?.min) errors.push(`${b.skeletonId}: kanıt alt sınırı yok`);
}
console.log(`V11 Question Blueprint Audit: ${catalog.blueprintCount} blueprint • ${catalog.familyCount} aile • ${errors.length} hata`);
if(errors.length){errors.forEach(x=>console.error(`- ${x}`));process.exit(1);}
