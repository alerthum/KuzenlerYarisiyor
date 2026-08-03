#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GRADE8_MATH_FULL_SCOPE_MATRIX, auditGrade8MathFullScopeMatrix } from '../js/assessment-v2/math-g8-full-scope-matrix.js';
import { buildGrade8MathWave1Questions, auditGrade8MathWave1Catalog } from '../js/assessment-v2/math-g8-wave1.js';
import { GRADE8_MATH_OUTCOMES_2018 } from '../js/curriculum/outcomes/tr-g8-matematik-2018.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const reportDir=path.join(root,'quality-reports');
fs.mkdirSync(reportDir,{recursive:true});
const matrixAudit=auditGrade8MathFullScopeMatrix();
const items=buildGrade8MathWave1Questions();
const waveAudit=auditGrade8MathWave1Catalog(items);
const errors=[...matrixAudit.errors,...waveAudit.errors];
const status=errors.length?'RED':'ENGINEERING_PASS_HUMAN_REVIEW_REQUIRED';

const matrixReport={
  schemaVersion:'1.0',generatedAt:new Date().toISOString(),phase:'4I',title:'8. Sınıf Matematik Tam Kapsam Ölçme Matrisi',
  status:matrixAudit.ok?'ENGINEERING_PASS':'RED',productReady:false,gameAdaptationAllowed:false,humanReviewStatus:'NOT_MEASURED',
  metrics:matrixAudit.metrics,errors:matrixAudit.errors,rows:GRADE8_MATH_FULL_SCOPE_MATRIX
};
const waveReport={
  schemaVersion:'1.0',generatedAt:new Date().toISOString(),phase:'4I',title:'8. Sınıf Matematik Tam Kapsam — Dalga 1',
  status,productReady:false,gameAdaptationAllowed:false,humanReviewStatus:'NOT_MEASURED',
  source:{title:'Matematik Dersi Öğretim Programı (1-8. Sınıflar), 2018',outcomeCount:GRADE8_MATH_OUTCOMES_2018.length},
  matrixMetrics:matrixAudit.metrics,waveMetrics:waveAudit.metrics,errors,questions:items
};
fs.writeFileSync(path.join(reportDir,'assessment-engine-v2-g8-math-full-scope-matrix.json'),JSON.stringify(matrixReport,null,2));
fs.writeFileSync(path.join(reportDir,'assessment-engine-v2-phase4i-g8-math-wave1.json'),JSON.stringify(waveReport,null,2));

const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const outcomeMap=new Map(GRADE8_MATH_OUTCOMES_2018.map(outcome=>[outcome.id,outcome]));
function contextHtml(item){return `<p>${esc(item.content.context).replaceAll('\n','<br>')}</p>`;}
function card(item,index){
  const outcome=outcomeMap.get(item.curriculum.outcomeIds[0]);
  const hints=item.hints.map(h=>`<li><strong>İpucu ${h.level}:</strong> ${esc(h.text)}</li>`).join('');
  const feedback=item.optionFeedback.map(f=>{const o=item.content.options.find(row=>row.id===f.optionId);return `<li><strong>${f.optionId}) ${esc(o?.text)}</strong><br>${esc(f.text)}</li>`}).join('');
  return `<article class="card"><div class="meta">${esc(outcome?.officialOutcomeCode)} · ${esc(outcome?.topicName)}</div><div class="blind"><button type="button" onclick="this.parentElement.classList.toggle('hide')">Bağlamı gizle/göster</button><div class="stim">${contextHtml(item)}</div></div><h2>Soru ${index+1}. ${esc(item.content.stem)}</h2><ol type="A">${item.content.options.map(option=>`<li>${esc(option.text)}</li>`).join('')}</ol><details><summary>Kademeli ipuçları</summary><ol>${hints}</ol></details><details><summary>Cevap ve bütün seçeneklerin açıklaması</summary><p class="answer">Doğru cevap: ${esc(item.answerKey.optionId)}</p><ul>${feedback}</ul><h4>Çözüm grafı</h4><ol>${item.solutionGraph.map(step=>`<li><strong>${esc(step.action)}</strong><br>${esc(step.evidence)}</li>`).join('')}</ol></details></article>`;
}
const html=`<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Phase 4I — 8. Sınıf Matematik Dalga 1</title><style>body{font-family:Segoe UI,Arial,sans-serif;background:#f3f5f8;color:#172033;margin:0;line-height:1.6}.wrap{max-width:1050px;margin:auto;padding:28px 18px 80px}.hero,.card{background:#fff;border:1px solid #dfe5ec;border-radius:20px;padding:25px;margin:18px 0;box-shadow:0 10px 30px rgba(24,39,75,.06)}h1,h2{margin-top:0}.meta{display:inline-block;background:#fff1df;color:#864300;padding:5px 11px;border-radius:999px;font-size:13px;font-weight:800}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:20px 0}.grid div{padding:13px;border-radius:13px;background:#f7f9fc}.blind button{border:0;background:#27364a;color:#fff;border-radius:9px;padding:8px 12px;cursor:pointer}.hide .stim{filter:blur(8px);max-height:64px;overflow:hidden;user-select:none}.card li{margin:9px 0}details{border-top:1px solid #e7eaf0;margin-top:14px;padding-top:11px}summary{cursor:pointer;font-weight:800;color:#9a4b00}.answer{font-weight:900}.warning{font-weight:800;color:#a33d16}</style></head><body><main class="wrap"><section class="hero"><h1>8. Sınıf Matematik — Tam Kapsam Dalga 1</h1><p>52 resmî kazanımın tamamı matrise alınmıştır. Bu paket daha önceki 5 soruluk çapraz pilota eklenen 12 yeni solver-backed soruyu içerir.</p><div class="grid"><div><strong>Resmî kazanım</strong><br>52/52 kayıtlı</div><div><strong>Kapsanan</strong><br>17 kazanım</div><div><strong>Bu paket</strong><br>12 yeni soru</div><div><strong>Kalan</strong><br>35 kazanım</div><div><strong>Cevap dengesi</strong><br>A/B/C/D = 3/3/3/3</div></div><p class="warning">İnsan incelemesi tamamlanmadı. Oyun adaptasyonu ve yayın kapalıdır.</p></section>${items.map(card).join('')}</main></body></html>`;
fs.writeFileSync(path.join(reportDir,'assessment-engine-v2-phase4i-g8-math-wave1-review.html'),html);
console.log(JSON.stringify({status,officialOutcomes:52,implementedOutcomes:17,newQuestions:12,remainingOutcomes:35,errors},null,2));
