import fs from 'node:fs';
import {decideV11Publication} from '../js/engines/v11-publication-gate.js';
const catalog=JSON.parse(fs.readFileSync(new URL('../content/v11/ai-generation-contracts.v11.json',import.meta.url),'utf8'));
const policy=JSON.parse(fs.readFileSync(new URL('../content/v11/publication-gate-policy.v11.json',import.meta.url),'utf8'));
const errors=[];
if(catalog.contracts.length!==40) errors.push('AI sözleşme sayısı 40 değil.');
for(const key of ['PUBLISH','REVIEW','QUARANTINE','REJECT']) if(!policy.decisions[key]) errors.push(`Politika kararı eksik: ${key}`);
const quarantine=decideV11Publication({rawOutput:'{invalid}',catalog});
const reject=decideV11Publication({output:{contractId:'UNKNOWN',skeletonId:'UNKNOWN'},catalog});
if(quarantine.decision!=='QUARANTINE') errors.push('Bozuk JSON karantinaya alınmadı.');
if(reject.decision!=='REJECT') errors.push('Bilinmeyen sözleşme reddedilmedi.');
console.log(`V11 Aşama 11 yayın kapısı denetimi: ${catalog.contracts.length} sözleşme, 4 karar, ${errors.length} hata.`);
if(errors.length){for(const e of errors) console.error('-',e); process.exit(1);}
