#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildGrade8MathCrossPilotQuestions, auditGrade8MathCrossPilotCatalog } from '../js/assessment-v2/math-g8-cross-pilot.js';
import { buildGrade8ScienceCrossPilotQuestions, auditGrade8ScienceCrossPilotCatalog } from '../js/assessment-v2/science-g8-cross-pilot.js';
import { buildGrade5TurkishCrossPilotQuestions, auditGrade5TurkishCrossPilotCatalog } from '../js/assessment-v2/turkish-g5-cross-pilot.js';
import { GRADE8_MATH_PILOT_OUTCOMES } from '../js/curriculum/outcomes/tr-g8-matematik-2018-pilot.js';
import { GRADE8_SCIENCE_PILOT_OUTCOMES } from '../js/curriculum/outcomes/tr-g8-fen-2018-pilot.js';
import { GRADE5_TURKISH_PILOT_OUTCOMES } from '../js/curriculum/outcomes/tr-g5-turkce-tymm-2024-pilot.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const reportDir=path.join(root,'quality-reports');fs.mkdirSync(reportDir,{recursive:true});
const groups=[
  {key:'g8-math',title:'8. Sınıf Matematik',items:buildGrade8MathCrossPilotQuestions(),audit:auditGrade8MathCrossPilotCatalog,outcomes:GRADE8_MATH_PILOT_OUTCOMES},
  {key:'g8-science',title:'8. Sınıf Fen Bilimleri',items:buildGrade8ScienceCrossPilotQuestions(),audit:auditGrade8ScienceCrossPilotCatalog,outcomes:GRADE8_SCIENCE_PILOT_OUTCOMES},
  {key:'g5-turkish',title:'5. Sınıf Türkçe',items:buildGrade5TurkishCrossPilotQuestions(),audit:auditGrade5TurkishCrossPilotCatalog,outcomes:GRADE5_TURKISH_PILOT_OUTCOMES}
];
const audits=groups.map(g=>g.audit(g.items));
const errors=audits.flatMap((a,i)=>a.errors.map(e=>`${groups[i].key}:${e}`));
const report={schemaVersion:'1.0',generatedAt:new Date().toISOString(),title:'Phase 4G — Ders ve Sınıf Çapraz Aktarılabilirlik Pilotu',status:errors.length?'RED':'ENGINEERING_PASS_HUMAN_REVIEW_REQUIRED',productReady:false,gameAdaptationAllowed:false,humanReviewStatus:'NOT_MEASURED',target:'1–12. sınıf, tüm dersler ve ilgili merkezî sınavlar için müfredata bağlı ayrı ders motorları; oyun uyarlaması en son.',metrics:{questionCount:15,courseEngineCount:3,gradeCount:2,outcomeCount:15,programFamilies:['PRE_TYMM','TYMM'],groups:Object.fromEntries(groups.map((g,i)=>[g.key,audits[i].metrics]))},errors,groups:groups.map(g=>({key:g.key,title:g.title,outcomes:g.outcomes,questions:g.items}))};
fs.writeFileSync(path.join(reportDir,'assessment-engine-v2-phase4g-cross-transfer-pilot.json'),JSON.stringify(report,null,2));

const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const outcomeMap=new Map(groups.flatMap(g=>g.outcomes.map(o=>[o.id,o])));
function stimulus(item){const blocks=item.content.stimulusBlocks?.filter(Boolean)||[];if(blocks.length)return blocks.map(b=>`<p>${esc(b)}</p>`).join('');return `<p>${esc(item.content.context||item.content.stimulus)}</p>`;}
function card(item,index){const out=outcomeMap.get(item.curriculum.outcomeIds[0]);const hints=item.hints.map(h=>`<li><strong>İpucu ${h.level}:</strong> ${esc(h.text)}</li>`).join('');const feedback=item.optionFeedback.map(f=>{const o=item.content.options.find(x=>x.id===f.optionId);return `<li><strong>${f.optionId}) ${esc(o?.text)}</strong><br>${esc(f.text)}</li>`}).join('');return `<article class="card"><div class="meta">${esc(out?.officialOutcomeCode)} · ${esc(out?.officialOutcomeText)}</div><div class="blind"><button onclick="this.parentElement.classList.toggle('hide')">Kör şık modunu aç/kapat</button><div class="stim">${stimulus(item)}</div></div><h3>Soru ${index+1}. ${esc(item.content.stem)}</h3><ol type="A">${item.content.options.map(o=>`<li>${esc(o.text)}</li>`).join('')}</ol><details><summary>İpuçları</summary><ol>${hints}</ol></details><details><summary>Cevap ve tüm şık açıklamaları</summary><p><strong>Doğru cevap: ${esc(item.answerKey.optionId)}</strong></p><ul>${feedback}</ul></details></article>`;}
let counter=0;const sections=groups.map(g=>`<section><h2>${esc(g.title)} — 5 soru</h2>${g.items.map(item=>card(item,counter++)).join('')}</section>`).join('');
const html=`<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Phase 4G Çapraz Pilot</title><style>body{font-family:Segoe UI,Arial,sans-serif;background:#f3f5f7;color:#202124;margin:0;line-height:1.6}.wrap{max-width:1050px;margin:auto;padding:28px 18px 80px}.hero,.card{background:white;border:1px solid #dde2e8;border-radius:18px;padding:24px;margin:18px 0;box-shadow:0 7px 22px #1f29370d}h1,h2{margin-top:0}.meta{display:inline-block;background:#fff2dc;color:#7b3f00;padding:5px 10px;border-radius:999px;font-size:13px;font-weight:700}.blind button{background:#28303d;color:#fff;border:0;border-radius:9px;padding:8px 12px;cursor:pointer}.hide .stim{filter:blur(8px);max-height:68px;overflow:hidden;user-select:none}.card li{margin:9px 0}details{border-top:1px solid #eee;margin-top:14px;padding-top:10px}summary{cursor:pointer;font-weight:700;color:#9a4700}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px}.grid div{background:#f8fafc;padding:12px;border-radius:12px}.warn{color:#9a3412;font-weight:700}</style></head><body><main class="wrap"><section class="hero"><h1>Phase 4G — Çapraz Aktarılabilirlik Pilotu</h1><p>Bu paket aynı kanonik kalite hattını üç ayrı motorda sınar: 8. sınıf Matematik, 8. sınıf Fen Bilimleri ve 5. sınıf Türkçe.</p><div class="grid"><div><strong>Soru</strong><br>15</div><div><strong>Ayrı motor</strong><br>3</div><div><strong>Kazanım</strong><br>15</div><div><strong>Program</strong><br>TYMM + PRE_TYMM</div></div><p class="warn">Sorular henüz insan incelemesi bekliyor; oyunlara bağlanamaz ve ürün yayınına açılamaz.</p></section>${sections}</main></body></html>`;
fs.writeFileSync(path.join(reportDir,'assessment-engine-v2-phase4g-cross-transfer-pilot-review.html'),html);
console.log(JSON.stringify({status:report.status,questions:15,engines:3,outcomes:15,errors},null,2));
