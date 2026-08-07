import fs from 'node:fs';
import path from 'node:path';
import {
  ASSESSMENT_V2_LAUNCH_PILOT_CANDIDATE_POOL,
  ASSESSMENT_V2_LAUNCH_PILOT_CANDIDATE_POOL_AUDIT
} from '../js/assessment-v2/launch-pilot-candidate-pool.js';
import {
  ASSESSMENT_V2_LAUNCH_PILOT_ASSIGNMENT_PLAN,
  ASSESSMENT_V2_LAUNCH_PILOT_ASSIGNMENT_PLAN_AUDIT
} from '../js/assessment-v2/launch-pilot-assignment-plan.js';
import {
  ASSESSMENT_V2_LAUNCH_PILOT_EMPTY_CONSENSUS,
  LAUNCH_PILOT_REVIEW_DIMENSIONS,
  requiredLaunchPilotReviewerCount
} from '../js/assessment-v2/launch-pilot-human-review.js';
import { ASSESSMENT_V2_LAUNCH_PILOT_BLOCKED_ADAPTATIONS } from '../js/assessment-v2/launch-pilot-adaptation.js';
import { ASSESSMENT_V2_LAUNCH_PILOT_CONTENT_QUALITY_AUDIT } from '../js/assessment-v2/launch-pilot-content-quality.js';
import { ASSESSMENT_V2_LAUNCH_PILOT_MANIFEST } from '../js/assessment-v2/launch-pilot-manifest.js';
import { evaluateControlledLaunchPilotGate, auditControlledLaunchPilotGate } from '../js/assessment-v2/controlled-launch-pilot-gate.js';

const root = process.cwd();
const reports = path.resolve(root, 'quality-reports');
const publicDir = path.resolve(root, 'public');
const reviewDir = path.resolve(reports, 'assessment-v2-phase5h-launch-pilot-review');
fs.mkdirSync(reports, { recursive: true });
fs.mkdirSync(publicDir, { recursive: true });
fs.rmSync(reviewDir, { recursive: true, force: true });
fs.mkdirSync(reviewDir, { recursive: true });

function readJson(file, fallback = null) {
  try { return JSON.parse(fs.readFileSync(path.resolve(root, file), 'utf8')); }
  catch { return fallback; }
}
function writeJson(file, value) {
  fs.writeFileSync(path.resolve(root, file), `${JSON.stringify(value, null, 2)}\n`);
}
function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
function pretty(value) {
  return esc(typeof value === 'string' ? value : JSON.stringify(value ?? null, null, 2));
}
function csvCell(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

const phase5g = readJson('quality-reports/assessment-v2-phase5g-technical-release.json', {});
const technicalEvidence = {
  status: phase5g.technicalStatus === 'PASS' ? 'PASS' : 'FAIL',
  technicalStatus: phase5g.technicalStatus || 'NOT_MEASURED',
  sourcePhase: phase5g.phase || '5G',
  sourceCommit: phase5g.commit || null,
  metrics: phase5g.metrics || null
};
const privacyChecklist = {
  schemaVersion: '1.0',
  phase: '5H',
  status: 'PENDING',
  piiCollectionAllowed: false,
  consentEvidenceRecorded: false,
  guardianConsentTemplatePrepared: true,
  schoolAuthorizationRecorded: false,
  pilotSaltStoredOutsideClient: false,
  retentionPolicyAccepted: false,
  rawDataRetentionDays: 90,
  note: 'Gerçek öğrenci başlamadan okul yetkisi, veli/onam, anonimleştirme anahtarı ve saklama politikası insan tarafından doğrulanmalıdır.'
};
const controlledGate = evaluateControlledLaunchPilotGate({
  contentQualityAudit: ASSESSMENT_V2_LAUNCH_PILOT_CONTENT_QUALITY_AUDIT,
  humanReviewConsensus: ASSESSMENT_V2_LAUNCH_PILOT_EMPTY_CONSENSUS,
  adaptationEvidence: ASSESSMENT_V2_LAUNCH_PILOT_BLOCKED_ADAPTATIONS,
  technicalReleaseEvidence: technicalEvidence,
  privacyChecklist
});
const controlledGateAudit = auditControlledLaunchPilotGate(controlledGate);

const jsonOutputs = {
  'quality-reports/assessment-v2-phase5h-launch-pilot-candidate-pool.json': ASSESSMENT_V2_LAUNCH_PILOT_CANDIDATE_POOL,
  'quality-reports/assessment-v2-phase5h-launch-pilot-content-quality-audit.json': ASSESSMENT_V2_LAUNCH_PILOT_CONTENT_QUALITY_AUDIT,
  'quality-reports/assessment-v2-phase5h-launch-pilot-assignment-plan.json': ASSESSMENT_V2_LAUNCH_PILOT_ASSIGNMENT_PLAN,
  'quality-reports/assessment-v2-phase5h-launch-pilot-empty-consensus.json': ASSESSMENT_V2_LAUNCH_PILOT_EMPTY_CONSENSUS,
  'quality-reports/assessment-v2-phase5h-launch-pilot-blocked-adaptations.json': ASSESSMENT_V2_LAUNCH_PILOT_BLOCKED_ADAPTATIONS,
  'quality-reports/assessment-v2-phase5h-controlled-launch-gate.json': controlledGate,
  'public/assessment-v2-phase5h-launch-pilot-manifest.json': ASSESSMENT_V2_LAUNCH_PILOT_MANIFEST,
  'public/assessment-v2-phase5h-launch-pilot-assignment-plan.json': ASSESSMENT_V2_LAUNCH_PILOT_ASSIGNMENT_PLAN,
  'public/assessment-v2-phase5h-privacy-checklist-template.json': privacyChecklist,
  'public/assessment-v2-phase5h-review-decision-template.json': {
    schemaVersion: '1.0',
    phase: '5H',
    reviewerAnonId: 'reviewer_uzman01',
    reviewerRole: 'CONTENT_AND_GAME_REVIEWER',
    decisions: [],
    dimensions: LAUNCH_PILOT_REVIEW_DIMENSIONS,
    warning: 'Otomatik onay yoktur. APPROVE için dokuz boyutun tamamı en az 4 olmalı ve kritik engel bulunmamalıdır. Exact olmayan kazanım eşleşmelerinde en az bir CURRICULUM_REVIEWER kararı zorunludur.'
  }
};
for (const [file, value] of Object.entries(jsonOutputs)) writeJson(file, value);

const assignmentCsv = ['participantSlotId,cycle,sessionNo,candidateId,questionId,gameId'];
for (const slot of ASSESSMENT_V2_LAUNCH_PILOT_ASSIGNMENT_PLAN.participantSlots) {
  for (const session of slot.sessions) {
    for (let index = 0; index < session.candidateIds.length; index += 1) {
      assignmentCsv.push([
        slot.participantSlotId,
        slot.cycle,
        session.sessionNo,
        session.candidateIds[index],
        session.questionIds[index],
        session.gameIds[index]
      ].map(csvCell).join(','));
    }
  }
}
fs.writeFileSync(path.resolve(publicDir, 'assessment-v2-phase5h-pilot-assignment.csv'), `${assignmentCsv.join('\n')}\n`);
fs.writeFileSync(
  path.resolve(publicDir, 'assessment-v2-phase5h-pilot-response-template.csv'),
  'responseId,pilotId,datasetSource,participantAnonId,itemId,gameId,grade,responseMode,selectedOptionId,omitted,score,maxScore,responseTimeMs,hintsUsed,attemptNumber,startedAt,submittedAt\n'
);

const cards = ASSESSMENT_V2_LAUNCH_PILOT_CANDIDATE_POOL.candidates.map((candidate, index) => {
  const material = candidate.reviewMaterial;
  const options = (material.options || []).map((option) => `<li><b>${esc(option.id)}</b> ${esc(option.text)}</li>`).join('');
  const requiredReviewers = requiredLaunchPilotReviewerCount(candidate);
  const dimensionInputs = LAUNCH_PILOT_REVIEW_DIMENSIONS.map((dimension) => `<label>${esc(dimension)}<select data-score="${esc(dimension)}"><option value="">Puan</option><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option></select></label>`).join('');
  const gameOptions = candidate.allowedGameIds.map((gameId) => `<option value="${esc(gameId)}" ${gameId === candidate.suggestedGameId ? 'selected' : ''}>${esc(gameId)}</option>`).join('');
  const curriculumRequired = candidate.curriculumAlignmentStatus !== 'EXACT_OUTCOME_REFERENCE';
  return `<article class="card" data-candidate-id="${esc(candidate.candidateId)}" data-grade="${candidate.grade}" data-confidence="${esc(candidate.routeConfidence)}">
<header><div><span class="index">${index + 1}/30</span><h2>${esc(candidate.questionId)}</h2></div><div class="badges"><span>${candidate.grade}. sınıf</span><span>${esc(candidate.courseGroup)}</span><span>${esc(candidate.itemFormat)}</span><span class="confidence ${candidate.routeConfidence.toLowerCase()}">rota ${esc(candidate.routeConfidence)}</span><span>${esc(candidate.curriculumAlignmentMode)}</span></div></header>
<p class="route"><b>Önerilen oyun:</b> ${esc(candidate.suggestedGameId)} · <b>Rota puanı:</b> ${candidate.routeScore} · <b>Gerekli bağımsız uzman:</b> ${requiredReviewers}</p>
<p class="route"><b>Kazanım referansı:</b> ${esc(candidate.curriculumReferenceQuestionId)} · <b>Durum:</b> ${esc(candidate.curriculumAlignmentStatus)} · <b>Outcome:</b> ${candidate.outcomeIds.map(esc).join(', ')}</p>
${curriculumRequired ? '<p class="curriculum-warning"><b>Müfredat uzmanı zorunlu:</b> Bu görev en az bir CURRICULUM_REVIEWER kararı olmadan onaylanamaz.</p>' : ''}
<p class="route"><b>Rota kanıtı:</b> ${candidate.routeReasons.length ? candidate.routeReasons.map(esc).join(', ') : 'Oyun uyumu ayrıca incelenmeli.'}</p>
${material.stimulus ? `<section class="stimulus"><b>Bağlam / metin</b><p>${esc(material.stimulus)}</p></section>` : ''}
${material.stimulusBlocks ? `<details><summary>Uyaran blokları</summary><pre>${pretty(material.stimulusBlocks)}</pre></details>` : ''}
<section class="question"><b>Görev</b><p>${esc(material.stem)}</p>${options ? `<ol class="options">${options}</ol>` : '<p class="open">Açık/etkileşimli yanıt görevi</p>'}</section>
<details><summary>Cevap, çözüm, ipucu ve geri bildirim kanıtları</summary><h3>Cevap anahtarı</h3><pre>${pretty(material.answerKey)}</pre><h3>Açıklama</h3><pre>${pretty(material.explanation)}</pre><h3>Çözüm grafiği</h3><pre>${pretty(material.solutionGraph)}</pre><h3>İpuçları</h3><pre>${pretty(material.hints)}</pre><h3>Şık/rubrik geri bildirimi</h3><pre>${pretty(material.optionFeedback)}</pre><h3>Bağımsız doğrulayıcı</h3><pre>${pretty(material.verifier)}</pre></details>
<details><summary>Oyuna aktarılacak tam gamePayload</summary><pre>${pretty(material.gamePayload)}</pre></details>
<section class="review"><div class="scores">${dimensionInputs}</div><label>Onaylanan oyun rotası<select data-confirmed-game>${gameOptions}</select></label><label>Karar<select data-decision><option value="">Karar seç</option><option value="APPROVE">APPROVE</option><option value="REVISE">REVISE</option><option value="REJECT">REJECT</option></select></label><label class="check"><input type="checkbox" data-blocker> Kritik engel var</label><label>İnceleme notu<textarea data-notes placeholder="Doğruluk, kazanım, yaş dili, oyun uyumu ve gerekli düzeltmeyi açıkça yaz."></textarea></label><button data-save>Bu uzman kararını kaydet</button><output data-output>Bekliyor</output></section>
</article>`;
}).join('');

const embeddedCandidates = JSON.stringify(ASSESSMENT_V2_LAUNCH_PILOT_CANDIDATE_POOL.candidates.map((candidate) => ({
  candidateId: candidate.candidateId,
  questionId: candidate.questionId,
  suggestedGameId: candidate.suggestedGameId,
  allowedGameIds: candidate.allowedGameIds,
  curriculumAlignmentStatus: candidate.curriculumAlignmentStatus
}))).replaceAll('<', '\\u003c');
const embeddedDimensions = JSON.stringify(LAUNCH_PILOT_REVIEW_DIMENSIONS);

const reviewHtml = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Phase 5H · 30 Görev Canlı Pilot İncelemesi</title><style>
:root{font-family:Segoe UI,Arial,sans-serif;color:#122033;background:#eef3f8}*{box-sizing:border-box}body{margin:0}.top{position:sticky;top:0;z-index:5;background:#081827;color:white;padding:16px 22px;box-shadow:0 3px 18px #0004}.top h1{margin:0 0 9px;font-size:21px}.toolbar,.metrics,.filters{display:flex;gap:9px;flex-wrap:wrap;align-items:center}.toolbar input,.toolbar select,.toolbar button,.filters button{padding:8px 10px;border-radius:9px;border:1px solid #789;background:white}.toolbar button,.filters button{cursor:pointer;font-weight:650}.warning{background:#fff4d6;border-bottom:1px solid #f4c86b;padding:12px 22px;color:#6c4300}.metrics{padding:12px 20px}.metric{background:white;border-radius:11px;padding:9px 13px;box-shadow:0 2px 12px #0f172a12}.metric b{font-size:21px;display:block}.filters{padding:0 20px 10px}main{max-width:1200px;margin:auto;padding:0 16px 70px}.card{background:white;margin:14px 0;padding:19px;border:2px solid transparent;border-radius:17px;box-shadow:0 5px 22px #0f172a12}.card.saved{border-color:#16a34a}.card header{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}.card h2{font-size:16px;margin:5px 0}.index{font-size:12px;color:#64748b}.badges{display:flex;gap:6px;flex-wrap:wrap}.badges span{background:#e8eef6;border-radius:999px;padding:4px 8px;font-size:12px}.confidence.high{background:#dcfce7}.confidence.medium{background:#fef3c7}.confidence.low{background:#fee2e2}.route{font-size:13px;color:#475569}.curriculum-warning{background:#fff1f2;border-left:4px solid #e11d48;padding:9px 12px;color:#881337}.stimulus{border-left:4px solid #f97316;background:#fff8ef;padding:10px 14px;line-height:1.6}.question{padding:12px 0}.options li{margin:7px 0}.open{background:#eef6ff;padding:10px;border-radius:8px}details{background:#f7f9fc;padding:10px;border-radius:9px;margin:9px 0}summary{cursor:pointer;font-weight:700}pre{white-space:pre-wrap;overflow:auto;background:#0f172a;color:#e2e8f0;padding:10px;border-radius:8px;font-size:12px}.review{display:grid;gap:10px;border-top:1px solid #dce5ef;margin-top:14px;padding-top:14px}.scores{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:8px}.review label{display:grid;gap:4px;font-size:13px;font-weight:650}.review select,.review textarea{padding:8px;border:1px solid #b9c6d6;border-radius:8px}.review textarea{min-height:70px}.review button{justify-self:start;background:#0f766e;color:white;border:0;border-radius:9px;padding:9px 14px;font-weight:700;cursor:pointer}.check{display:flex!important;align-items:center;gap:8px!important}.hidden{display:none!important}@media(max-width:700px){.top{position:static}.card{padding:14px}}
</style></head><body><section class="top"><h1>Phase 5H · Kontrollü Canlı Pilot · 30 Görev</h1><div class="toolbar"><label>Uzman kimliği <input id="reviewer" value="reviewer_uzman01"></label><label>Uzman rolü <select id="reviewer-role"><option value="CONTENT_AND_GAME_REVIEWER">İçerik ve oyun uzmanı</option><option value="CURRICULUM_REVIEWER">Müfredat uzmanı</option></select></label><button id="export">Bu uzmanın kararlarını indir</button><button id="import">Karar JSON içe aktar</button><input id="file" type="file" accept="application/json" multiple hidden><button id="clear">Bu uzmanın kararlarını temizle</button></div></section><div class="warning"><b>Otomatik onay yok.</b> APPROVE için dokuz boyutun tamamı en az 4 olmalı, kritik engel bulunmamalı ve oyun rotası insan tarafından doğrulanmalıdır. Exact olmayan kazanım eşleşmeleri ile açık/etkileşimli görevler iki bağımsız uzman ister; exact olmayanlarda kararlardan en az biri müfredat uzmanına ait olmalıdır.</div><section class="metrics"><div class="metric"><b>30</b>pilot adayı</div><div class="metric"><b>24/24</b>ders hücresi</div><div class="metric"><b>23/23</b>oyun</div><div class="metric"><b id="saved">0</b>bu uzman kararı</div><div class="metric"><b id="approved">0</b>APPROVE</div><div class="metric"><b id="remaining">30</b>bekleyen</div></section><nav class="filters"><button data-filter="all">Tümü</button><button data-filter="pending">Kararsız</button><button data-filter="5">5. sınıf</button><button data-filter="6">6. sınıf</button><button data-filter="7">7. sınıf</button><button data-filter="8">8. sınıf</button></nav><main>${cards}</main><script>
const candidates=${embeddedCandidates};const dimensions=${embeddedDimensions};const storageKey='assessment-v2-phase5h-launch-pilot-review-v2';const state={decisions:JSON.parse(localStorage.getItem(storageKey)||'[]')};const cards=[...document.querySelectorAll('.card')];const reviewer=()=>document.querySelector('#reviewer').value.trim();const role=()=>document.querySelector('#reviewer-role').value;const pair=(candidateId,reviewerId)=>candidateId+'::'+reviewerId;function persist(){localStorage.setItem(storageKey,JSON.stringify(state.decisions));render();}
function render(){const mine=state.decisions.filter(d=>d.reviewerAnonId===reviewer());const map=new Map(mine.map(d=>[d.candidateId,d]));for(const card of cards){const d=map.get(card.dataset.candidateId);card.classList.toggle('saved',!!d);card.querySelector('[data-output]').textContent=d?'Kaydedildi: '+d.decision+' / '+d.reviewerRole:'Bekliyor';if(d){for(const dim of dimensions)card.querySelector('[data-score="'+dim+'"]').value=d.scores[dim];card.querySelector('[data-confirmed-game]').value=d.confirmedGameId;card.querySelector('[data-decision]').value=d.decision;card.querySelector('[data-blocker]').checked=d.criticalBlockers.length>0;card.querySelector('[data-notes]').value=d.notes||'';}}document.querySelector('#saved').textContent=mine.length;document.querySelector('#approved').textContent=mine.filter(d=>d.decision==='APPROVE').length;document.querySelector('#remaining').textContent=30-new Set(mine.map(d=>d.candidateId)).size;}
for(const card of cards)card.querySelector('[data-save]').onclick=()=>{const reviewerAnonId=reviewer();if(!/^reviewer_[A-Za-z0-9_-]{6,80}$/.test(reviewerAnonId)){alert('Uzman kimliği reviewer_ ile başlamalı ve anonim olmalıdır.');return;}const candidate=candidates.find(x=>x.candidateId===card.dataset.candidateId);const scores=Object.fromEntries(dimensions.map(dim=>[dim,Number(card.querySelector('[data-score="'+dim+'"]').value)]));if(Object.values(scores).some(v=>!v)){alert('Dokuz puanın tamamını seç.');return;}const decision=card.querySelector('[data-decision]').value;if(!decision){alert('Karar seç.');return;}const confirmedGameId=card.querySelector('[data-confirmed-game]').value;if(!candidate.allowedGameIds.includes(confirmedGameId)){alert('Bu ders grubu için izin verilmeyen oyun rotası.');return;}const blocker=card.querySelector('[data-blocker]').checked;if(decision==='APPROVE'&&(blocker||Object.values(scores).some(v=>v<4))){alert('APPROVE için tüm puanlar en az 4 olmalı ve kritik engel bulunmamalıdır.');return;}const d={schemaVersion:'1.0',reviewId:'phase5h_'+Date.now()+'_'+candidate.questionId,batchId:'PHASE5H_LAUNCH_PILOT_30',candidateId:candidate.candidateId,questionId:candidate.questionId,reviewerAnonId,reviewerRole:role(),suggestedGameId:candidate.suggestedGameId,confirmedGameId,decision,scores,criticalBlockers:blocker?['human-marked-critical-blocker']:[],notes:card.querySelector('[data-notes]').value.trim(),reviewedAt:new Date().toISOString()};state.decisions=state.decisions.filter(x=>pair(x.candidateId,x.reviewerAnonId)!==pair(d.candidateId,d.reviewerAnonId));state.decisions.push(d);persist();};
document.querySelector('#reviewer').onchange=render;document.querySelector('#export').onclick=()=>{const payload={schemaVersion:'1.0',phase:'5H',exportedAt:new Date().toISOString(),reviewerAnonId:reviewer(),reviewerRole:role(),decisions:state.decisions.filter(d=>d.reviewerAnonId===reviewer())};const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));a.download='phase5h-launch-pilot-'+reviewer()+'.json';a.click();URL.revokeObjectURL(a.href);};document.querySelector('#import').onclick=()=>document.querySelector('#file').click();document.querySelector('#file').onchange=async e=>{for(const file of e.target.files){const payload=JSON.parse(await file.text());for(const d of payload.decisions||[])state.decisions=state.decisions.filter(x=>pair(x.candidateId,x.reviewerAnonId)!==pair(d.candidateId,d.reviewerAnonId)).concat(d);}persist();};document.querySelector('#clear').onclick=()=>{if(confirm('Bu uzmanın 30 görevdeki kararları silinsin mi?')){state.decisions=state.decisions.filter(d=>d.reviewerAnonId!==reviewer());persist();}};for(const button of document.querySelectorAll('[data-filter]'))button.onclick=()=>{const filter=button.dataset.filter;const mine=new Set(state.decisions.filter(d=>d.reviewerAnonId===reviewer()).map(d=>d.candidateId));for(const card of cards){const show=filter==='all'||(filter==='pending'&&!mine.has(card.dataset.candidateId))||card.dataset.grade===filter;card.classList.toggle('hidden',!show);}};render();
</script></body></html>`;
fs.writeFileSync(path.join(reviewDir, 'index.html'), reviewHtml);

const dashboard = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Phase 5H Kontrollü Canlı Pilot</title><style>body{font:15px/1.55 Segoe UI;background:#07111f;color:#ecf4ff;margin:0;padding:25px}.wrap{max-width:1100px;margin:auto}.hero,.card{background:#10243d;border:1px solid #29445f;border-radius:17px;padding:19px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;margin:15px 0}.n{font-size:29px;font-weight:800}.pass{color:#86efac}.wait{color:#fbbf24}.block{color:#fca5a5}a{color:#93c5fd}.checks li{margin:7px 0}</style></head><body><div class="wrap"><section class="hero"><h1>Phase 5H · Kontrollü Canlı Pilot Paketi</h1><p>Kamu yayını açılmadı. 30 gerçek görev; mühendislik kalite denetimi, insan incelemesi ve gerçek öğrenci pilotu için hazırlandı.</p></section><section class="grid"><div class="card"><div class="n pass">30/30</div>içerik kalite PASS</div><div class="card"><div class="n pass">24/24</div>5–8 ana ders hücresi</div><div class="card"><div class="n pass">23/23</div>oyun rotası</div><div class="card"><div class="n pass">100</div>anonim öğrenci slotu</div><div class="card"><div class="n pass">80</div>görev başına yanıt</div><div class="card"><div class="n wait">${controlledGate.metrics.passed}/${controlledGate.metrics.checkCount}</div>pilot yayın kapısı</div></section><section class="card"><h2>Kapılar</h2><ul class="checks">${controlledGate.checks.map((check) => `<li class="${check.passed ? 'pass' : 'block'}"><b>${check.passed ? 'PASS' : 'BLOCKED'}</b> · ${esc(check.label)}${check.blocker ? ` — ${esc(check.blocker)}` : ''}</li>`).join('')}</ul></section><section class="card"><h2>İnsan incelemesi</h2><p><a href="assessment-v2-phase5h-launch-pilot-review/index.html">30 görevlik inceleme çalışma masasını aç</a></p><p>Exact olmayan kazanım eşleşmeleri ve etkileşimli görevler iki bağımsız karar ister. Exact olmayan görevlerde en az bir müfredat uzmanı bulunmalıdır. Sistem otomatik onay üretmez.</p></section><section class="card"><h2>Öğrenci planı</h2><p>100 anonim öğrenci slotu × 24 görev = 2400 gerçek yanıt. Her görev 80 öğrenciye atanır; her öğrenci dört oturumda altışar görev görür.</p></section></div></body></html>`;
fs.writeFileSync(path.resolve(reports, 'assessment-v2-phase5h-controlled-launch-dashboard.html'), dashboard);

const engineeringReady = ASSESSMENT_V2_LAUNCH_PILOT_CANDIDATE_POOL_AUDIT.ok
  && ASSESSMENT_V2_LAUNCH_PILOT_CONTENT_QUALITY_AUDIT.ok
  && ASSESSMENT_V2_LAUNCH_PILOT_ASSIGNMENT_PLAN_AUDIT.ok
  && controlledGateAudit.ok;
const report = {
  schemaVersion: '1.0',
  phase: '5H',
  generatedAt: new Date().toISOString(),
  status: engineeringReady ? 'PILOT_PACKAGE_READY_HUMAN_REVIEW_REQUIRED' : 'RED',
  technicalReleaseStatus: technicalEvidence.status,
  productReady: false,
  publicProductionReleaseAllowed: false,
  controlledPilotReady: controlledGate.controlledPilotReady,
  candidatePool: ASSESSMENT_V2_LAUNCH_PILOT_CANDIDATE_POOL.metrics,
  contentQuality: ASSESSMENT_V2_LAUNCH_PILOT_CONTENT_QUALITY_AUDIT.metrics,
  manualSurfaceCorrections: [
    'LGS olasılık sorusunda doğru cevaba eşdeğer 6/20 çeldiricisi kaldırıldı ve örnek uzay paydalarını toplama yanılgısıyla değiştirildi.',
    '5. sınıf iletkenlik sorusundaki yüzeysel çeldiriciler gerçek öğrenci yanılgılarıyla yeniden yazıldı.'
  ],
  assignmentPlan: ASSESSMENT_V2_LAUNCH_PILOT_ASSIGNMENT_PLAN_AUDIT.metrics,
  humanReview: ASSESSMENT_V2_LAUNCH_PILOT_EMPTY_CONSENSUS.metrics,
  controlledGate,
  audits: {
    candidatePool: ASSESSMENT_V2_LAUNCH_PILOT_CANDIDATE_POOL_AUDIT,
    contentQuality: ASSESSMENT_V2_LAUNCH_PILOT_CONTENT_QUALITY_AUDIT,
    assignmentPlan: ASSESSMENT_V2_LAUNCH_PILOT_ASSIGNMENT_PLAN_AUDIT,
    controlledGate: controlledGateAudit
  },
  files: {
    reviewWorkbench: path.relative(root, path.join(reviewDir, 'index.html')),
    candidatePool: 'quality-reports/assessment-v2-phase5h-launch-pilot-candidate-pool.json',
    contentQualityAudit: 'quality-reports/assessment-v2-phase5h-launch-pilot-content-quality-audit.json',
    manifest: 'public/assessment-v2-phase5h-launch-pilot-manifest.json',
    assignmentPlan: 'public/assessment-v2-phase5h-launch-pilot-assignment-plan.json',
    assignmentCsv: 'public/assessment-v2-phase5h-pilot-assignment.csv',
    responseTemplate: 'public/assessment-v2-phase5h-pilot-response-template.csv',
    privacyChecklist: 'public/assessment-v2-phase5h-privacy-checklist-template.json',
    dashboard: 'quality-reports/assessment-v2-phase5h-controlled-launch-dashboard.html'
  }
};
writeJson('quality-reports/assessment-v2-phase5h-controlled-launch-pilot.json', report);

const md = `# Assessment Engineering Engine V2 — Phase 5H Kontrollü Canlı Pilot

## Sonuç

- Durum: **${report.status}**
- Teknik yayın kanıtı: **${technicalEvidence.status}**
- Mühendislik içerik denetimi: **${ASSESSMENT_V2_LAUNCH_PILOT_CONTENT_QUALITY_AUDIT.metrics.passed}/30 PASS**
- Kontrollü pilot yayını: **${controlledGate.controlledPilotReady ? 'READY' : 'BLOCKED'}**
- Kamu production yayını: **KAPALI**
- productReady: **false**

## İlk canlı pilot havuzu

- 30 benzersiz gerçek görev
- 24/24 sınıf-ders hücresi
- 23/23 oyun rotası
- 25 çoktan seçmeli + 5 oyun-native etkileşimli görev
- GOLD mühendislik seviyesi: 30/30
- Bağımsız doğrulama: 30/30
- Kazanım eşleşmesi: ${ASSESSMENT_V2_LAUNCH_PILOT_CONTENT_QUALITY_AUDIT.metrics.exactOutcomeReferenceCount} exact, ${ASSESSMENT_V2_LAUNCH_PILOT_CONTENT_QUALITY_AUDIT.metrics.explicitCurriculumReferenceCount} açık referans, ${ASSESSMENT_V2_LAUNCH_PILOT_CONTENT_QUALITY_AUDIT.metrics.skillTransferReferenceCount} beceri transferi
- Yanıt anahtarı dağılımı: A=7, B=6, C=6, D=6
- HIGH risk görev: 0

## İnsan inceleme kuralı

APPROVE için **dokuz boyutun** tamamı en az 4 olmalıdır: doğruluk, kazanım uyumu, şık/rubrik kalitesi, yaş dili, ipucu sızdırmazlığı, öğretici geri bildirim, doğallık, oyun uyumu ve pilot uygunluğu. Exact olmayan kazanım eşleşmeleri ile etkileşimli görevler iki bağımsız uzman ister; exact olmayanlarda en az bir müfredat uzmanı kararı zorunludur. Sistem otomatik onay üretmez.

## Gerçek öğrenci planı

- 100 anonim öğrenci slotu
- Öğrenci başına 24 görev
- 4 oturum × 6 görev
- Görev başına tam 80 gerçek yanıt
- Toplam 2400 yanıt
- PII toplama yasak
- Veli/onam ve okul yetkisi gerçek pilot öncesinde zorunlu

## Kapılar

${controlledGate.checks.map((check) => `- ${check.passed ? 'PASS' : 'BLOCKED'} — ${check.label}${check.blocker ? `: ${check.blocker}` : ''}`).join('\n')}

## Dosyalar

${Object.values(report.files).map((file) => `- \`${file}\``).join('\n')}
`;
fs.writeFileSync(path.resolve(root, 'md/arsiv/ASSESSMENT_ENGINEERING_V2_PHASE5H_CONTROLLED_LAUNCH_PILOT.md'), md);

const operations = `# Phase 5H Gerçek Öğrenci Pilotu Operasyon Rehberi

1. İnceleme çalışma masası anonim uzman kimliği ve uzman rolüyle açılır.
2. Exact outcome referanslı, çoktan seçmeli görevlerde bir uzman yeterli olabilir. Exact olmayan kazanım eşleşmeleri ve etkileşimli görevlerde iki bağımsız uzman gerekir; exact olmayanlarda en az bir CURRICULUM_REVIEWER kararı zorunludur.
3. Karar JSON dosyaları \`npm run assessment:v2:phase5h:reviews -- <dosya1> <dosya2> ...\` komutuyla birleştirilir.
4. 30/30 insan onayı ve 30/30 semantik round-trip oluşmadan öğrenci pilotu açılmaz.
5. Okul yetkisi, veli/onam, anonim katılımcı üretimi, pilot salt güvenliği ve 90 günlük ham veri saklama kararı gizlilik kontrol listesine kaydedilir.
6. \`public/assessment-v2-phase5h-pilot-assignment.csv\` yalnız anonim slotları içerir. Gerçek öğrenci kimliği bu dosyaya yazılmaz.
7. Yanıtlar \`public/assessment-v2-phase5h-pilot-response-template.csv\` sözleşmesinde toplanır.
8. Her görevde en az 80 yanıt ve toplam en az 100 anonim öğrenci olmadan madde analizi yayın kanıtı sayılamaz.
9. Kontrollü pilot PASS olsa bile kamu production yayını ayrıca açılır; bu paket tam ürün onayı vermez.
`;
fs.writeFileSync(path.resolve(root, 'md/arsiv/PHASE5H_STUDENT_PILOT_OPERATIONS.md'), operations);

console.log(JSON.stringify({
  status: report.status,
  candidatePoolAudit: ASSESSMENT_V2_LAUNCH_PILOT_CANDIDATE_POOL_AUDIT.ok,
  contentQualityAudit: ASSESSMENT_V2_LAUNCH_PILOT_CONTENT_QUALITY_AUDIT.ok,
  contentQualityPassed: ASSESSMENT_V2_LAUNCH_PILOT_CONTENT_QUALITY_AUDIT.metrics.passed,
  assignmentPlanAudit: ASSESSMENT_V2_LAUNCH_PILOT_ASSIGNMENT_PLAN_AUDIT.ok,
  controlledGateAudit: controlledGateAudit.ok,
  controlledGate: controlledGate.metrics,
  reviewWorkbench: report.files.reviewWorkbench,
  expectedTotalResponses: ASSESSMENT_V2_LAUNCH_PILOT_ASSIGNMENT_PLAN.sampling.expectedTotalResponses
}, null, 2));
if (report.status === 'RED') process.exitCode = 1;
