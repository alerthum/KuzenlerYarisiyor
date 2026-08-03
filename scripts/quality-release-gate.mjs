import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const reportPath=path.resolve('quality-reports/content-quality-inventory-v10.json');
if(!fs.existsSync(reportPath)) execFileSync(process.execPath,['scripts/content-quality-inventory.mjs'],{stdio:'inherit'});
const report=JSON.parse(fs.readFileSync(reportPath,'utf8'));
const rows=Array.isArray(report.rows)?report.rows:[];
const errors=rows.filter(r=>r.error&&!r.skipped);
const incomplete=rows.filter(r=>!r.error&&!r.complete);
const heavilyBlocked=rows.filter(r=>!r.error&&Number(r.generated||0)>0&&(Number(r.blocked||0)/Number(r.generated||1))>=0.25);
const result={generatedAt:new Date().toISOString(),total:rows.length,errors:errors.length,incomplete:incomplete.length,heavilyBlocked:heavilyBlocked.length,pass:errors.length===0};
fs.writeFileSync(path.resolve('quality-reports/QUALITY_RELEASE_GATE_V10.json'),JSON.stringify(result,null,2));
console.log(`Quality Gate: ${result.total} örnek • ${result.errors} hata • ${result.incomplete} eksik havuz • ${result.heavilyBlocked} yüksek blokaj.`);
if(errors.length) process.exitCode=1;
