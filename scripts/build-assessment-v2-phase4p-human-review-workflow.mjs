import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ASSESSMENT_V2_PHASE4P_HUMAN_REVIEW_BATCH, ASSESSMENT_V2_PHASE4P_HUMAN_REVIEW_BATCH_AUDIT } from '../js/assessment-v2/human-review-batch.js';
import { HUMAN_REVIEW_DIMENSIONS } from '../js/assessment-v2/human-review-decision-contract.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const q=p=>path.join(root,p);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tasks=ASSESSMENT_V2_PHASE4P_HUMAN_REVIEW_BATCH.tasks;

const template={
  schemaVersion:'1.0',
  batchId:'PHASE4P_70',
  exportedAt:null,
  reviewerAnonId:'reviewer_degistir',
  decisions:[]
};

const cards=tasks.map((t,index)=>{
  const stimulus=t.stimulusBlocks.map(b=>`<p>${esc(b)}</p>`).join('');
  const options=t.options.length?`<ol class="options" type="A">${t.options.map(o=>`<li><strong>${esc(o.id)}.</strong> ${esc(o.text)}</li>`).join('')}</ol>`:'';
  const rubric=t.rubricCriteria.length?`<div class="rubric"><strong>Rubrik ölçütleri</strong><ol>${t.rubricCriteria.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></div>`:'';
  const feedback=t.feedback.length?`<details><summary>Cevap ve seçenek geri bildirimi</summary><p><strong>Cevap anahtarı:</strong> ${esc(t.answerKey?.optionId||'Rubrikli görev')}</p>${t.feedback.map(f=>`<p><strong>${esc(f.optionId)}:</strong> ${esc(f.text)}</p>`).join('')}</details>`:'';
  const dims=HUMAN_REVIEW_DIMENSIONS.map(dim=>`<label>${esc(dim)}<select data-score="${esc(dim)}"><option value="">Seç</option>${[1,2,3,4,5].map(n=>`<option value="${n}">${n}</option>`).join('')}</select></label>`).join('');
  return `<article class="card" id="task-${esc(t.questionId)}" data-question-id="${esc(t.questionId)}" data-required="${t.requiredReviewerCount}">
  <header><span>#${index+1}</span><strong>${esc(t.grade)}. sınıf · ${esc(t.courseId)}</strong><span class="risk">Risk ${t.riskScore} · ${t.requiredReviewerCount} uzman</span></header>
  <div class="meta">${esc(t.questionId)} · ${esc(t.itemFormat)} · ${esc(t.primarySkill)} · ${esc(t.difficultyBand)}</div>
  <div class="stimulus">${stimulus}</div><h3>${esc(t.stem)}</h3>${options}${rubric}
  <details><summary>İpucu, yanılgı ve doğrulama kanıtı</summary><ol>${t.hints.map(h=>`<li>${esc(h.text)}</li>`).join('')}</ol><p><strong>Yanılgılar:</strong> ${esc(t.misconceptionIds.join(', '))}</p><p><strong>Çözücü:</strong> ${esc(t.verifier?.solverId)}<br><strong>Bağımsız doğrulayıcı:</strong> ${esc(t.verifier?.independentVerifierId)}</p></details>${feedback}
  <section class="review"><div class="scores">${dims}</div><label>Karar<select data-decision><option value="">Seç</option><option>APPROVE</option><option>REVISE</option><option>REJECT</option></select></label><label class="block"><input type="checkbox" data-blocker> Kritik engel var</label><label>Not<textarea data-notes placeholder="Somut kanıt ve düzeltme önerisi"></textarea></label><button type="button" data-save>Kararı kaydet</button><output data-status>Bekliyor</output></section>
  </article>`;
}).join('\n');

const batchJson=JSON.stringify(ASSESSMENT_V2_PHASE4P_HUMAN_REVIEW_BATCH).replace(/</g,'\\u003c');
const dimensionsJson=JSON.stringify(HUMAN_REVIEW_DIMENSIONS);
const html=`<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Phase 4P İnsan İnceleme İş Masası</title><style>
:root{font-family:Inter,Segoe UI,sans-serif;color:#1d2433;background:#f4f6fb}body{margin:0}.top{position:sticky;top:0;z-index:5;background:#111827;color:white;padding:16px 24px;box-shadow:0 2px 12px #0004}.top h1{margin:0 0 8px;font-size:22px}.toolbar{display:flex;gap:12px;flex-wrap:wrap;align-items:center}.toolbar input{padding:8px;border-radius:8px;border:1px solid #64748b}.toolbar button{padding:9px 14px;border:0;border-radius:8px;font-weight:700;cursor:pointer}.warn{background:#fff7ed;color:#9a3412;padding:12px 24px;border-bottom:1px solid #fed7aa}.metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;padding:16px 24px}.metric{background:white;border-radius:12px;padding:12px;box-shadow:0 2px 10px #18223012}.metric b{font-size:24px;display:block}.filters{padding:0 24px 10px;display:flex;gap:8px;flex-wrap:wrap}.filters button{border:1px solid #cbd5e1;background:white;padding:7px 10px;border-radius:999px;cursor:pointer}main{max-width:1120px;margin:auto;padding:0 18px 60px}.card{background:white;border-radius:16px;padding:20px;margin:14px 0;box-shadow:0 4px 18px #18223014;border:2px solid transparent}.card.saved{border-color:#16a34a}.card header{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}.risk{background:#ede9fe;color:#5b21b6;padding:4px 8px;border-radius:999px}.meta{font-size:12px;color:#64748b;margin:8px 0}.stimulus{border-left:4px solid #f97316;padding-left:14px;line-height:1.65}.options li{margin:8px 0;line-height:1.5}.rubric{background:#eff6ff;padding:12px;border-radius:10px}.review{margin-top:16px;border-top:1px solid #e2e8f0;padding-top:14px;display:grid;gap:10px}.scores{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px}.review label{display:grid;gap:4px;font-size:13px;font-weight:600}.review select,.review textarea{padding:8px;border:1px solid #cbd5e1;border-radius:8px}.review textarea{min-height:70px}.review button{justify-self:start;background:#0f766e;color:white;border:0;border-radius:8px;padding:9px 14px;font-weight:700;cursor:pointer}.block{display:flex!important;grid-template-columns:auto 1fr!important;align-items:center}.review output{font-weight:700;color:#475569}details{margin:10px 0;background:#f8fafc;padding:10px;border-radius:8px}summary{cursor:pointer;font-weight:700}.hidden{display:none!important}@media(max-width:600px){.top{position:static}.card{padding:14px}}
</style></head><body><section class="top"><h1>Phase 4P · 70 Görevlik İnsan İnceleme İş Masası</h1><div class="toolbar"><label>Anonim uzman kimliği <input id="reviewer" value="reviewer_uzman01" pattern="reviewer_[A-Za-z0-9_-]{6,80}"></label><button id="export">Kararları JSON indir</button><button id="importBtn">JSON içe aktar</button><input id="importFile" type="file" accept="application/json" hidden><button id="clear">Yerel kararları temizle</button></div></section><div class="warn"><strong>Yayın kapalıdır.</strong> Onay yalnız oyun adaptasyonu laboratuvarına adaylık verir. Karmaşıklığı yüksek görevler iki bağımsız uzman ister; gerçek öğrenci pilotu olmadan yayın açılamaz.</div><section class="metrics"><div class="metric"><b>70</b>görev</div><div class="metric"><b>7</b>ders motoru</div><div class="metric"><b id="savedCount">0</b>yerel karar</div><div class="metric"><b id="approveCount">0</b>APPROVE</div><div class="metric"><b id="reviseCount">0</b>REVISE/REJECT</div></section><nav class="filters"><button data-filter="all">Tümü</button>${[...new Set(tasks.map(t=>`${t.grade}:${t.courseId}`))].map(k=>`<button data-filter="${esc(k)}">${esc(k)}</button>`).join('')}<button data-filter="pending">Yalnız bekleyen</button></nav><main>${cards}</main><script>
const batch=${batchJson}; const dimensions=${dimensionsJson}; const storageKey='assessment-v2-phase4p-human-reviews-v1';
const state={decisions:JSON.parse(localStorage.getItem(storageKey)||'[]')};
const cards=[...document.querySelectorAll('.card')];
function reviewer(){return document.querySelector('#reviewer').value.trim();}
function key(questionId,reviewerAnonId){return questionId+'::'+reviewerAnonId;}
function render(){const map=new Map(state.decisions.map(d=>[key(d.questionId,d.reviewerAnonId),d]));for(const card of cards){const d=map.get(key(card.dataset.questionId,reviewer()));card.classList.toggle('saved',!!d);card.querySelector('[data-status]').textContent=d?'Kaydedildi: '+d.decision:'Bekliyor';if(d){for(const dim of dimensions)card.querySelector('[data-score="'+dim+'"]').value=d.scores[dim];card.querySelector('[data-decision]').value=d.decision;card.querySelector('[data-blocker]').checked=d.criticalBlockers.length>0;card.querySelector('[data-notes]').value=d.notes;}}const mine=state.decisions.filter(d=>d.reviewerAnonId===reviewer());document.querySelector('#savedCount').textContent=mine.length;document.querySelector('#approveCount').textContent=mine.filter(d=>d.decision==='APPROVE').length;document.querySelector('#reviseCount').textContent=mine.filter(d=>d.decision!=='APPROVE').length;}
function persist(){localStorage.setItem(storageKey,JSON.stringify(state.decisions));render();}
for(const card of cards)card.querySelector('[data-save]').onclick=()=>{const reviewerAnonId=reviewer();if(!/^reviewer_[A-Za-z0-9_-]{6,80}$/.test(reviewerAnonId)){alert('Anonim uzman kimliği reviewer_ ile başlamalı ve yeterince uzun olmalıdır.');return;}const scores=Object.fromEntries(dimensions.map(dim=>[dim,Number(card.querySelector('[data-score="'+dim+'"]').value)]));if(Object.values(scores).some(v=>!v)){alert('Altı puanın tamamını seç.');return;}const decision=card.querySelector('[data-decision]').value;if(!decision){alert('Karar seç.');return;}const blocker=card.querySelector('[data-blocker]').checked;if(decision==='APPROVE'&&(blocker||Object.values(scores).some(v=>v<4))){alert('APPROVE için tüm puanlar en az 4 olmalı ve kritik engel bulunmamalıdır.');return;}const d={schemaVersion:'1.0',reviewId:'review_'+Date.now()+'_'+card.dataset.questionId, batchId:'PHASE4P_70',questionId:card.dataset.questionId,reviewerAnonId,reviewerRole:'CONTENT_REVIEWER',decision,scores,criticalBlockers:blocker?['human-marked-critical-blocker']:[],notes:card.querySelector('[data-notes]').value.trim(),reviewedAt:new Date().toISOString()};state.decisions=state.decisions.filter(x=>key(x.questionId,x.reviewerAnonId)!==key(d.questionId,d.reviewerAnonId));state.decisions.push(d);persist();};
document.querySelector('#reviewer').onchange=render;
document.querySelector('#export').onclick=()=>{const payload={schemaVersion:'1.0',batchId:'PHASE4P_70',exportedAt:new Date().toISOString(),decisions:state.decisions};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='assessment-v2-phase4p-human-review-decisions.json';a.click();URL.revokeObjectURL(a.href);};
document.querySelector('#importBtn').onclick=()=>document.querySelector('#importFile').click();document.querySelector('#importFile').onchange=async e=>{const raw=JSON.parse(await e.target.files[0].text());for(const d of(raw.decisions||raw)){state.decisions=state.decisions.filter(x=>key(x.questionId,x.reviewerAnonId)!==key(d.questionId,d.reviewerAnonId));state.decisions.push(d);}persist();};
document.querySelector('#clear').onclick=()=>{if(confirm('Yerel kararların tamamı silinsin mi?')){state.decisions=[];persist();}};
for(const button of document.querySelectorAll('[data-filter]'))button.onclick=()=>{const f=button.dataset.filter;for(const card of cards){const task=batch.tasks.find(t=>t.questionId===card.dataset.questionId);const show=f==='all'||f===task.grade+':'+task.courseId||(f==='pending'&&!state.decisions.some(d=>d.questionId===task.questionId&&d.reviewerAnonId===reviewer()));card.classList.toggle('hidden',!show);}};render();
</script></body></html>`;

const report={
  schemaVersion:'1.0',generatedAt:new Date().toISOString(),phase:'4P',title:'İnsan İnceleme İş Akışı',
  status:ASSESSMENT_V2_PHASE4P_HUMAN_REVIEW_BATCH_AUDIT.ok?'HUMAN_REVIEW_WORKBENCH_PASS_DECISIONS_REQUIRED':'HUMAN_REVIEW_WORKBENCH_FAIL',
  productReady:false,publicationAllowed:false,gameAdaptationAllowed:false,
  audit:ASSESSMENT_V2_PHASE4P_HUMAN_REVIEW_BATCH_AUDIT,
  metrics:ASSESSMENT_V2_PHASE4P_HUMAN_REVIEW_BATCH.metrics,
  blockers:['70 görev için uzman kararları henüz girilmedi.','Yüksek riskli görevlerde ikinci bağımsız uzman zorunlu.','Gerçek öğrenci pilotu ve madde analizi henüz yok.']
};
const md=`# Assessment Engineering V2 — Phase 4P İnsan İnceleme İş Akışı\n\n- Durum: **${report.status}**\n- Risk tabakalı örneklem: **70 görev / 7 motor**\n- Tek uzman isteyen: **${report.metrics.singleReviewTaskCount}**\n- İki bağımsız uzman isteyen: **${report.metrics.doubleReviewTaskCount}**\n- Girilmiş karar: **0**\n- productReady: **false**\n- publicationAllowed: **false**\n\nİş masası puan, karar, kritik engel ve kanıt notlarını tarayıcıda yerel olarak saklar; JSON dışa/içe aktarımı destekler. APPROVE kararı bütün boyutlarda en az 4 puan ve kritik engel bulunmamasını gerektirir. Yüksek riskli görev tek uzmanla açılamaz. İnsan onayı yayın yetkisi vermez; yalnız oyun adaptasyonu laboratuvarına adaylık sağlar.\n`;
const outputs={
  html:'quality-reports/assessment-v2-phase4p-human-review-workbench.html',
  publicJson:'public/assessment-v2-human-review-workbench.json',
  template:'public/assessment-v2-human-review-decision-template.json',
  report:'quality-reports/assessment-engine-v2-phase4p-human-review-workflow.json',
  md:'ASSESSMENT_ENGINEERING_V2_PHASE4P_HUMAN_REVIEW_WORKFLOW.md'
};
for(const file of Object.values(outputs))fs.mkdirSync(path.dirname(q(file)),{recursive:true});
fs.writeFileSync(q(outputs.html),html);fs.writeFileSync(q(outputs.publicJson),JSON.stringify(ASSESSMENT_V2_PHASE4P_HUMAN_REVIEW_BATCH,null,2)+'\n');fs.writeFileSync(q(outputs.template),JSON.stringify(template,null,2)+'\n');fs.writeFileSync(q(outputs.report),JSON.stringify(report,null,2)+'\n');fs.writeFileSync(q(outputs.md),md);
console.log(JSON.stringify({status:report.status,files:Object.values(outputs).map(q),metrics:report.metrics},null,2));
if(!ASSESSMENT_V2_PHASE4P_HUMAN_REVIEW_BATCH_AUDIT.ok)process.exitCode=1;
