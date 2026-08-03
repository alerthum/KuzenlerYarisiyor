import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'content/v11/cognitive-skeletons.v11.json'),'utf8'));
const mapping=JSON.parse(fs.readFileSync(path.join(root,'content/v11/paragraph-family-mapping.v11.json'),'utf8'));
const valid=new Set(catalog.skeletons.map(x=>x.skeletonId));
const errors=[];
if(mapping.mappingCount!==16) errors.push(`16 eşleştirme bekleniyordu, ${mapping.mappingCount} bulundu.`);
for(const item of mapping.mappings){
 if(!valid.has(item.skeletonId)) errors.push(`${item.familyId}: geçersiz iskelet ${item.skeletonId}`);
 if(item.mappingStatus!=='CONFIRMED') errors.push(`${item.familyId}: eşleştirme kesin değil.`);
 if(item.distractorMisconceptions.length!==3) errors.push(`${item.familyId}: üç yanılgı taşımıyor.`);
}
const ids=mapping.mappings.map(x=>x.familyId);
if(new Set(ids).size!==ids.length) errors.push('Tekrarlanan paragraf aile kimliği var.');
console.log(`V11 Paragraph Identity Audit: ${mapping.mappingCount} aile • ${new Set(mapping.mappings.map(x=>x.skeletonId)).size} iskelet • ${errors.length} hata`);
if(errors.length){for(const e of errors) console.error('- '+e);process.exit(1);}
