import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const raw=JSON.parse(fs.readFileSync(path.join(root,'docs/sources/GRADE4_PRE_TYMM_CORE_SOURCE_EVIDENCE.json'),'utf8'));
export const GRADE4_PRE_TYMM_SOURCE_EVIDENCE=Object.freeze(raw.sources.map(row=>Object.freeze({...row})));
const errors=[];
if(raw.sourceCount!==8||GRADE4_PRE_TYMM_SOURCE_EVIDENCE.length!==8)errors.push('source-count');
for(const row of GRADE4_PRE_TYMM_SOURCE_EVIDENCE){const file=path.join(root,row.localDocument);if(!fs.existsSync(file))errors.push(`${row.sourceId}:missing`);else if(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')!==row.sha256)errors.push(`${row.sourceId}:sha256`);if(row.grade!==4||row.status!=='LOCAL_AUTHORITATIVE_EVIDENCE_VERIFIED')errors.push(`${row.sourceId}:metadata`);}
export const GRADE4_PRE_TYMM_SOURCE_EVIDENCE_AUDIT=Object.freeze({ok:errors.length===0,errors:Object.freeze(errors),metrics:Object.freeze({sourceCount:8,grade:4,courseCount:8})});
