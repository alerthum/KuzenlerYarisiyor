import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { buildRetirementRegistry } from '../js/quality/legacy-retirement-policy-v10.js';

for(const script of ['content-quality-inventory.mjs','premium-similarity-audit.mjs','quality-release-gate.mjs']) execFileSync(process.execPath,[`scripts/${script}`],{stdio:'inherit'});
const inventory=JSON.parse(fs.readFileSync(path.resolve('quality-reports/content-quality-inventory-v10.json'),'utf8'));
const gate=JSON.parse(fs.readFileSync(path.resolve('quality-reports/QUALITY_RELEASE_GATE_V10.json'),'utf8'));
const similarity=JSON.parse(fs.readFileSync(path.resolve('quality-reports/PREMIUM_SIMILARITY_AUDIT_V10.json'),'utf8'));
const retirement=buildRetirementRegistry(inventory.rows||[]);
const retired=Object.values(retirement).filter((x)=>x.status==='RETIRED');
const watch=Object.values(retirement).filter((x)=>x.status==='WATCH');
const report={generatedAt:new Date().toISOString(),release:'10.0.0',scope:'V10 çekirdek',qualityGate:gate,similarity,retirementSummary:{active:Object.values(retirement).filter(x=>x.status==='ACTIVE').length,watch:watch.length,retired:retired.length},pass:Boolean(gate.pass&&similarity.pass)};
fs.writeFileSync(path.resolve('quality-reports/FINAL_RELEASE_AUDIT_V10.json'),JSON.stringify({report,retirement},null,2));
const md=['# Zihin Arenası V10 Final Kabul Raporu','',`- Sürüm: **${report.release}**`,`- Kapsam: **${report.scope}**`,`- Kalite kapısı: **${gate.pass?'GEÇTİ':'KALDI'}**`,`- Premium benzersiz çıktı: **${similarity.uniqueOutputs}/${similarity.sampleCount}**`, `- Soru anahtarı çakışması: **${similarity.questionKeyConflicts}**`,`- İzleme listesi: **${watch.length}**`,`- Emekli aile/oyun: **${retired.length}**`,`- Sonuç: **${report.pass?'KABUL':'RED'}**`,'','## Kapsam Notu','','Bu yüzde, V10 çekirdek yol haritasının tamamlandığını ifade eder. Premium içerik hacmi ve yeni ders aileleri ürün yaşam döngüsü boyunca büyümeye devam edecektir.'];
fs.writeFileSync(path.resolve('FINAL_RELEASE_ACCEPTANCE_V10.md'),md.join('\n'));
console.log(`Final kabul: ${report.pass?'PASS':'FAIL'} • izleme ${watch.length} • emekli ${retired.length}`);
if(!report.pass) process.exitCode=1;
