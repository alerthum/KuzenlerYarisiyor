import fs from 'node:fs';
import path from 'node:path';
import { CORE_GAME_REVIEW_SPRINTS, CORE_GAME_REVIEW_SPRINTS_AUDIT } from '../js/assessment-v2/core-game-review-sprints.js';
import { ASSESSMENT_V2_CANONICAL_CATALOG } from '../js/assessment-v2/canonical-catalog.js';
import { HUMAN_REVIEW_DIMENSIONS } from '../js/assessment-v2/human-review-decision-contract.js';

const out = path.resolve('quality-reports/assessment-v2-phase5g-core-review');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const byId = new Map(ASSESSMENT_V2_CANONICAL_CATALOG.map((item) => [item.id, item]));
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeJson = (value) => JSON.stringify(value).replace(/</g, '\\u003c');

function itemView(row) {
  const item = byId.get(row.questionId);
  if (!item) throw new Error(`canonical-item-missing:${row.questionId}`);
  return {
    ...row,
    primarySkill: item.construct?.primarySkill || null,
    difficultyBand: item.construct?.intendedDifficultyBand || null,
    stimulusBlocks: item.content?.stimulusBlocks?.length ? item.content.stimulusBlocks : [item.content?.stimulus || item.content?.context || ''].filter(Boolean),
    stem: item.content?.stem || item.content?.prompt || row.stem || '',
    options: (item.content?.options || []).map((option) => ({ id: option.id, text: option.text })),
    rubricCriteria: [...(item.responseModel?.rubricCriteria || [])],
    hints: (item.hints || []).map((hint) => ({ level: hint.level, text: hint.text })),
    feedback: (item.optionFeedback || []).map((feedback) => ({ optionId: feedback.optionId, correct: feedback.correct, text: feedback.text, misconceptionId: feedback.misconceptionId || null })),
    answerKey: item.answerKey || null,
    misconceptionIds: [...(item.misconceptionIds || [])],
    verifier: item.verifier || null,
    provenance: item.provenance || null,
    requiredReviewerCount: row.risk === 'HIGH' ? 2 : 1
  };
}

function renderCard(task, index) {
  const stimulus = task.stimulusBlocks.map((block) => `<p>${esc(typeof block === 'string' ? block : JSON.stringify(block))}</p>`).join('');
  const options = task.options.length ? `<ol type="A">${task.options.map((option) => `<li><strong>${esc(option.id)}.</strong> ${esc(option.text)}</li>`).join('')}</ol>` : '';
  const rubric = task.rubricCriteria.length ? `<details><summary>Rubrik ölçütleri</summary><ol>${task.rubricCriteria.map((criterion) => `<li>${esc(criterion)}</li>`).join('')}</ol></details>` : '';
  const hints = task.hints.length ? `<ol>${task.hints.map((hint) => `<li>${esc(hint.text)}</li>`).join('')}</ol>` : '<p>İpucu yok.</p>';
  const feedback = task.feedback.length ? task.feedback.map((row) => `<p><strong>${esc(row.optionId)}:</strong> ${esc(row.text)}${row.misconceptionId ? ` <small>(${esc(row.misconceptionId)})</small>` : ''}</p>`).join('') : '<p>Seçenek geri bildirimi yok.</p>';
  const scores = HUMAN_REVIEW_DIMENSIONS.map((dimension) => `<label>${esc(dimension)}<select data-score="${esc(dimension)}"><option value="">Seç</option>${[1, 2, 3, 4, 5].map((n) => `<option value="${n}">${n}</option>`).join('')}</select></label>`).join('');
  return `<article class="card" data-question-id="${esc(task.questionId)}" data-risk="${esc(task.risk)}" data-status="${task.gameAdaptationAllowed ? 'approved' : 'pending'}">
<header><span>#${index + 1}</span><strong>${esc(task.grade)}. sınıf · ${esc(task.courseId)}</strong><span class="risk ${task.risk.toLowerCase()}">${esc(task.risk)} · ${task.requiredReviewerCount} uzman</span></header>
<div class="meta">${esc(task.questionId)} · ${esc(task.itemFormat)} · ${esc(task.primarySkill)} · ${esc(task.difficultyBand)} · ${esc(task.outcomeIds.join(', '))}</div>
<div class="stimulus">${stimulus}</div><h2>${esc(task.stem)}</h2>${options}${rubric}
<details><summary>Çözüm kanıtı ve pedagojik destek</summary><h4>İpuçları</h4>${hints}<h4>Seçenek geri bildirimi</h4>${feedback}<p><strong>Yanılgılar:</strong> ${esc(task.misconceptionIds.join(', '))}</p><p><strong>Çözücü:</strong> ${esc(task.verifier?.solverId || '')}<br><strong>Bağımsız doğrulayıcı:</strong> ${esc(task.verifier?.independentVerifierId || '')}<br><strong>Doğrulandı:</strong> ${esc(task.verifier?.verified)}</p></details>
<section class="review"><div class="scores">${scores}</div><label>Karar<select data-decision><option value="">Seç</option><option>APPROVE</option><option>REVISE</option><option>REJECT</option></select></label><label class="check"><input type="checkbox" data-blocker> Kritik engel var</label><label>Kanıt notu<textarea data-notes placeholder="Somut sorun, kanıt ve düzeltme önerisi"></textarea></label><button type="button" data-save>Kararı kaydet</button><output data-output>Bekliyor</output></section></article>`;
}

function renderSprint(sprint, tasks) {
  const storageKey = `assessment-v2-core-review-sprint-${String(sprint.sprintNo).padStart(2, '0')}-v1`;
  const taskJson = safeJson(tasks.map((task) => ({ questionId: task.questionId, requiredReviewerCount: task.requiredReviewerCount })));
  const dimensionsJson = safeJson(HUMAN_REVIEW_DIMENSIONS);
  const cards = tasks.map(renderCard).join('\n');
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Çekirdek İnceleme Sprinti ${sprint.sprintNo}</title><style>
:root{font-family:Inter,Segoe UI,sans-serif;background:#f3f6fb;color:#172033}*{box-sizing:border-box}body{margin:0}.top{position:sticky;top:0;z-index:9;background:#0f172a;color:white;padding:14px 20px;box-shadow:0 4px 18px #0004}.top h1{font-size:21px;margin:0 0 8px}.toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.toolbar input,.toolbar button,.filters button{padding:8px 11px;border-radius:9px;border:1px solid #94a3b8}.toolbar button{cursor:pointer;font-weight:700}.warning{padding:12px 20px;background:#fff7ed;color:#9a3412;border-bottom:1px solid #fed7aa}.metrics,.filters{display:flex;gap:10px;flex-wrap:wrap;padding:12px 20px}.metric{background:white;border-radius:12px;padding:10px 14px;box-shadow:0 2px 12px #0f172a12}.metric b{display:block;font-size:22px}.filters button{background:white;cursor:pointer}main{max-width:1150px;margin:auto;padding:0 16px 70px}.card{background:white;margin:14px 0;padding:20px;border:2px solid transparent;border-radius:17px;box-shadow:0 5px 22px #0f172a12}.card.saved{border-color:#16a34a}.card header{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}.risk{border-radius:999px;padding:4px 9px;font-size:12px}.risk.high{background:#fee2e2;color:#991b1b}.risk.medium{background:#fef3c7;color:#92400e}.risk.low{background:#dcfce7;color:#166534}.meta{font-size:12px;color:#64748b;margin:8px 0}.stimulus{border-left:4px solid #f97316;padding-left:14px;line-height:1.65}.card li{margin:8px 0}.review{display:grid;gap:10px;border-top:1px solid #e2e8f0;margin-top:14px;padding-top:14px}.scores{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px}.review label{display:grid;gap:4px;font-size:13px;font-weight:650}.review select,.review textarea{padding:8px;border:1px solid #cbd5e1;border-radius:8px}.review textarea{min-height:72px}.review button{justify-self:start;background:#0f766e;color:white;border:0;border-radius:9px;padding:9px 14px;font-weight:700;cursor:pointer}.check{display:flex!important;align-items:center;gap:8px!important}.hidden{display:none!important}details{background:#f8fafc;padding:10px;border-radius:9px;margin:10px 0}summary{cursor:pointer;font-weight:700}@media(max-width:650px){.top{position:static}.card{padding:14px}}
</style></head><body><section class="top"><h1>Çekirdek İnsan İncelemesi · Sprint ${sprint.sprintNo}/${CORE_GAME_REVIEW_SPRINTS.totalSprints}</h1><div class="toolbar"><label>Uzman kimliği <input id="reviewer" value="reviewer_uzman01"></label><button id="export">Kararları JSON indir</button><button id="import">JSON içe aktar</button><input id="file" type="file" accept="application/json" hidden><button id="clear">Bu uzmanın kararlarını temizle</button></div></section><div class="warning"><strong>Otomatik onay yoktur.</strong> APPROVE için altı boyutun tamamı en az 4 olmalı ve kritik engel bulunmamalıdır. HIGH risk iki bağımsız uzman ister. İnsan onayı tek başına yayın açmaz.</div><section class="metrics"><div class="metric"><b>${tasks.length}</b>görev</div><div class="metric"><b>${sprint.metrics.highRisk}</b>yüksek risk</div><div class="metric"><b id="saved">0</b>kayıtlı karar</div><div class="metric"><b id="approved">0</b>APPROVE</div><div class="metric"><b id="remaining">${tasks.length}</b>bekleyen</div></section><nav class="filters"><button data-filter="all">Tümü</button><button data-filter="pending">Kararsız</button><button data-filter="HIGH">HIGH</button><button data-filter="MEDIUM">MEDIUM</button><button data-filter="LOW">LOW</button></nav><main>${cards}</main><script>
const tasks=${taskJson};const dimensions=${dimensionsJson};const storageKey=${JSON.stringify(storageKey)};const state={decisions:JSON.parse(localStorage.getItem(storageKey)||'[]')};const cards=[...document.querySelectorAll('.card')];
const reviewer=()=>document.querySelector('#reviewer').value.trim();const key=(q,r)=>q+'::'+r;function persist(){localStorage.setItem(storageKey,JSON.stringify(state.decisions));render();}
function render(){const mine=state.decisions.filter(d=>d.reviewerAnonId===reviewer());const map=new Map(mine.map(d=>[d.questionId,d]));for(const card of cards){const d=map.get(card.dataset.questionId);card.classList.toggle('saved',!!d);card.querySelector('[data-output]').textContent=d?'Kaydedildi: '+d.decision:'Bekliyor';if(d){for(const dim of dimensions)card.querySelector('[data-score="'+dim+'"]').value=d.scores[dim];card.querySelector('[data-decision]').value=d.decision;card.querySelector('[data-blocker]').checked=d.criticalBlockers.length>0;card.querySelector('[data-notes]').value=d.notes||'';}}document.querySelector('#saved').textContent=mine.length;document.querySelector('#approved').textContent=mine.filter(d=>d.decision==='APPROVE').length;document.querySelector('#remaining').textContent=tasks.length-new Set(mine.map(d=>d.questionId)).size;}
for(const card of cards)card.querySelector('[data-save]').onclick=()=>{const reviewerAnonId=reviewer();if(!/^reviewer_[A-Za-z0-9_-]{6,80}$/.test(reviewerAnonId)){alert('Uzman kimliği reviewer_ ile başlamalıdır.');return;}const scores=Object.fromEntries(dimensions.map(dim=>[dim,Number(card.querySelector('[data-score="'+dim+'"]').value)]));if(Object.values(scores).some(v=>!v)){alert('Altı puanın tamamını seç.');return;}const decision=card.querySelector('[data-decision]').value;if(!decision){alert('Karar seç.');return;}const blocker=card.querySelector('[data-blocker]').checked;if(decision==='APPROVE'&&(blocker||Object.values(scores).some(v=>v<4))){alert('APPROVE için tüm puanlar en az 4 olmalı ve kritik engel bulunmamalıdır.');return;}const questionId=card.dataset.questionId;const d={schemaVersion:'1.0',reviewId:'review_'+Date.now()+'_'+questionId,batchId:'CORE_GAME_SPRINT_${String(sprint.sprintNo).padStart(2,'0')}',questionId,reviewerAnonId,reviewerRole:'CONTENT_REVIEWER',decision,scores,criticalBlockers:blocker?['human-marked-critical-blocker']:[],notes:card.querySelector('[data-notes]').value.trim(),reviewedAt:new Date().toISOString()};state.decisions=state.decisions.filter(x=>key(x.questionId,x.reviewerAnonId)!==key(questionId,reviewerAnonId));state.decisions.push(d);persist();};
document.querySelector('#reviewer').onchange=render;document.querySelector('#export').onclick=()=>{const payload={schemaVersion:'1.0',sprintNo:${sprint.sprintNo},exportedAt:new Date().toISOString(),reviewerAnonId:reviewer(),decisions:state.decisions.filter(d=>d.reviewerAnonId===reviewer())};const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));a.download='core-review-sprint-${String(sprint.sprintNo).padStart(2,'0')}-'+reviewer()+'.json';a.click();URL.revokeObjectURL(a.href);};
document.querySelector('#import').onclick=()=>document.querySelector('#file').click();document.querySelector('#file').onchange=async e=>{const payload=JSON.parse(await e.target.files[0].text());for(const d of payload.decisions||[])state.decisions=state.decisions.filter(x=>key(x.questionId,x.reviewerAnonId)!==key(d.questionId,d.reviewerAnonId)).concat(d);persist();};document.querySelector('#clear').onclick=()=>{if(confirm('Bu uzmanın sprint kararları silinsin mi?')){state.decisions=state.decisions.filter(d=>d.reviewerAnonId!==reviewer());persist();}};
for(const button of document.querySelectorAll('[data-filter]'))button.onclick=()=>{const filter=button.dataset.filter;const mine=new Set(state.decisions.filter(d=>d.reviewerAnonId===reviewer()).map(d=>d.questionId));for(const card of cards){const show=filter==='all'||(filter==='pending'&&!mine.has(card.dataset.questionId))||card.dataset.risk===filter;card.classList.toggle('hidden',!show);}};render();
</script></body></html>`;
}

const sprintFiles = [];
for (const sprint of CORE_GAME_REVIEW_SPRINTS.sprints) {
  const tasks = sprint.items.map(itemView);
  const name = `sprint-${String(sprint.sprintNo).padStart(2, '0')}.html`;
  fs.writeFileSync(path.join(out, name), renderSprint(sprint, tasks));
  sprintFiles.push({ sprintNo: sprint.sprintNo, file: name, metrics: sprint.metrics });
}
const links = sprintFiles.map((row) => `<a href="${row.file}"><strong>Sprint ${String(row.sprintNo).padStart(2, '0')}</strong><span>${row.metrics.itemCount} görev · ${row.metrics.highRisk} HIGH · ${row.metrics.pending} bekleyen</span></a>`).join('');
fs.writeFileSync(path.join(out, 'index.html'), `<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Çekirdek İnceleme Sprintleri</title><style>body{font:15px/1.5 Segoe UI;background:#07111f;color:#eef6ff;max-width:1100px;margin:auto;padding:28px}header{background:#10243d;border:1px solid #29445f;border-radius:18px;padding:20px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;margin-top:16px}a{display:grid;gap:5px;background:#10243d;color:#eef6ff;text-decoration:none;border:1px solid #29445f;border-radius:14px;padding:16px}a:hover{border-color:#fb923c}span{color:#b8c7dc}</style><header><h1>5–8 Ana Dersler · İnsan İnceleme Merkezi</h1><p>${CORE_GAME_REVIEW_SPRINTS.totalItems} görev · ${CORE_GAME_REVIEW_SPRINTS.totalSprints} sprint · otomatik onay yok</p></header><main>${links}</main></html>`);
const report = { schemaVersion: '1.0', phase: '5G', status: CORE_GAME_REVIEW_SPRINTS_AUDIT.ok ? 'PASS' : 'FAIL', generatedAt: new Date().toISOString(), totalItems: CORE_GAME_REVIEW_SPRINTS.totalItems, totalSprints: CORE_GAME_REVIEW_SPRINTS.totalSprints, outputDirectory: out, indexFile: path.join(out, 'index.html'), sprintFiles, publicationAllowed: false, automaticApproval: false };
fs.writeFileSync(path.resolve('quality-reports/assessment-v2-phase5g-core-review-workbench.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ status: report.status, totalItems: report.totalItems, totalSprints: report.totalSprints, indexFile: report.indexFile }, null, 2));
if (!CORE_GAME_REVIEW_SPRINTS_AUDIT.ok) process.exitCode = 1;
