import fs from 'node:fs';
const catalog=JSON.parse(fs.readFileSync(new URL('../content/v11/ai-generation-contracts.v11.json',import.meta.url),'utf8'));
const errors=[];
if(catalog.contractCount!==40) errors.push(`Sözleşme sayısı 40 değil: ${catalog.contractCount}`);
if(catalog.familyCount!==8) errors.push(`Aile sayısı 8 değil: ${catalog.familyCount}`);
const ids=new Set();
for(const c of catalog.contracts){
  if(ids.has(c.contractId)) errors.push(`Tekrarlı sözleşme: ${c.contractId}`); ids.add(c.contractId);
  if(!c.systemInstruction?.includes('yalnız geçerli JSON')&&!c.systemInstruction?.includes('Yalnız geçerli JSON')) errors.push(`${c.skeletonId}: katı JSON talimatı yok`);
  if(c.distractorInstruction?.length!==3) errors.push(`${c.skeletonId}: 3 çeldirici talimatı yok`);
  if(c.generationInstruction?.difficultyLevels?.length!==3) errors.push(`${c.skeletonId}: 3 zorluk seviyesi yok`);
  if(!c.outputContract?.required?.includes('evidenceMap')) errors.push(`${c.skeletonId}: evidenceMap zorunlu değil`);
  if(!c.hardRules?.distinctMisconceptionsRequired) errors.push(`${c.skeletonId}: ayrı yanılgı kuralı yok`);
}
console.log(`V11 AI Contract Audit: ${catalog.contractCount} sözleşme • ${catalog.familyCount} aile • ${errors.length} hata`);
if(errors.length){errors.forEach(x=>console.error(`- ${x}`));process.exit(1);}
