import fs from 'node:fs';
import path from 'node:path';
import {
  GRADE8_TURKISH_PILOT01_FRESH_REVIEW_IDS,
  GRADE8_TURKISH_PILOT01_PREVIOUS_REVIEW_IDS,
  auditGrade8TurkishPilot01Catalog,
  buildGrade8TurkishPilot01Questions
} from '../js/assessment-v2/turkish-g8-reading-pilot01.js';

const root = process.cwd();
const reportDir = path.join(root, 'quality-reports');
fs.mkdirSync(reportDir, { recursive: true });
const allItems = buildGrade8TurkishPilot01Questions();
const audit = auditGrade8TurkishPilot01Catalog(allItems);
if (!audit.ok) throw new Error(`pilot audit failed: ${audit.errors.join(', ')}`);

const previousReviewIds = new Set(GRADE8_TURKISH_PILOT01_PREVIOUS_REVIEW_IDS);
const reviewIds = new Set(GRADE8_TURKISH_PILOT01_FRESH_REVIEW_IDS);
if ([...reviewIds].some(id => previousReviewIds.has(id))) throw new Error('fresh review overlaps previous human-review packs');
const reviewItems = allItems.filter(item => reviewIds.has(item.id));
if (reviewItems.length !== 12) throw new Error(`review item count ${reviewItems.length}`);
const answerCounts = Object.fromEntries(['A','B','C','D'].map(id => [id, reviewItems.filter(item => item.answerKey.optionId === id).length]));
if (Object.values(answerCounts).some(count => count !== 3)) throw new Error(`review answer imbalance ${JSON.stringify(answerCounts)}`);
if (new Set(reviewItems.flatMap(item => item.curriculum.outcomeIds)).size !== 8) throw new Error('review pack does not cover 8 outcomes');

const mapItem = (item, index) => ({
  number: index + 1,
  id: item.id,
  outcomeId: item.curriculum.outcomeIds[0],
  construct: item.construct,
  styleProfile: item.styleProfile,
  stimulus: item.content.stimulus,
  stimulusBlocks: item.content.stimulusBlocks,
  stem: item.content.stem,
  options: item.content.options,
  answerKey: item.answerKey,
  hints: item.hints,
  optionFeedback: item.optionFeedback,
  solutionGraph: item.solutionGraph,
  audit: audit.itemAudits.find(row => row.id === item.id)
});

const fullPayload = {
  schemaVersion: '1.0', generatedAt: new Date().toISOString(),
  batchId: 'GRADE8_TURKISH_PILOT_01_24', decision: 'HUMAN_REVIEW_REQUIRED',
  productReady: false, gameAdaptationAllowed: false, audit,
  questions: allItems.map(mapItem)
};
const reviewPayload = {
  schemaVersion: '1.0', generatedAt: fullPayload.generatedAt,
  batchId: 'GRADE8_TURKISH_PILOT_01_FRESH_REVIEW_12_R1', decision: 'HUMAN_REVIEW_REQUIRED',
  productReady: false, gameAdaptationAllowed: false,
  selection: { itemCount: 12, outcomeCount: 8, answerCounts, previousReviewOverlapCount: 0, excludedPreviouslyShownItemCount: previousReviewIds.size },
  questions: reviewItems.map(mapItem)
};

const fullJsonPath = path.join(reportDir, 'assessment-engine-v2-phase4c-grade8-turkish-pilot01-24.json');
const reviewJsonPath = path.join(reportDir, 'assessment-engine-v2-phase4c-r1-grade8-turkish-fresh-review12.json');
fs.writeFileSync(fullJsonPath, JSON.stringify(fullPayload, null, 2));
fs.writeFileSync(reviewJsonPath, JSON.stringify(reviewPayload, null, 2));

const esc = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const renderStimulus = question => {
  if (!question.stimulusBlocks) return `<p>${esc(question.stimulus)}</p>`;
  return question.stimulusBlocks.map(block => /\||\n/.test(block)
    ? `<pre>${esc(block)}</pre>`
    : `<p>${esc(block)}</p>`).join('');
};
const questionHtml = reviewPayload.questions.map(question => {
  const options = question.options.map(option => `<li><strong>${option.id})</strong> ${esc(option.text)}</li>`).join('');
  const feedback = question.optionFeedback.map(entry => `<li><strong>${entry.optionId})</strong> ${esc(entry.text)}</li>`).join('');
  const hints = question.hints.map(entry => `<li><strong>İpucu ${entry.level}:</strong> ${esc(entry.text)}</li>`).join('');
  return `<article class="question">
    <header><span>Soru ${question.number}</span><span>${esc(question.outcomeId)}</span></header>
    <section class="question-body">
      <div class="stimulus">${renderStimulus(question)}</div>
      <h2 class="stem">${esc(question.stem)}</h2>
      <ol class="options" type="A">${options}</ol>
    </section>
    <div class="review-row">
      <label>Doğallık <input type="number" min="1" max="5"></label>
      <label>Zorluk <input type="number" min="1" max="5"></label>
      <label>Şık kalitesi <input type="number" min="1" max="5"></label>
      <label>Şıktan tahmin <select><option>Hayır</option><option>Evet</option></select></label>
    </div>
    <textarea placeholder="Gözle inceleme notu"></textarea>
    <details><summary>İpuçları</summary><ol>${hints}</ol></details>
    <details><summary>Cevap ve seçenek açıklamaları</summary><p><strong>Doğru cevap: ${esc(question.answerKey.optionId)}</strong></p><ul>${feedback}</ul></details>
  </article>`;
}).join('\n');

const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>8. Sınıf Türkçe Pilot-01 Yeni Sorular İnceleme 12</title><style>
body{font-family:Arial,sans-serif;background:#f4f5f7;color:#1f2937;margin:0}.wrap{max-width:1040px;margin:auto;padding:28px}.intro,.question{background:#fff;border:1px solid #d9dee7;border-radius:14px;padding:24px;margin-bottom:22px;box-shadow:0 4px 16px rgba(0,0,0,.04)}h1{margin-top:0}.toolbar{position:sticky;top:0;z-index:5;background:#fff7ed;border:1px solid #fdba74;border-radius:12px;padding:12px;margin-bottom:18px}.toolbar button{padding:10px 16px;font-weight:700;cursor:pointer}.question header{display:flex;justify-content:space-between;font-weight:700;color:#475569;border-bottom:1px solid #e5e7eb;padding-bottom:12px}.stimulus{font-size:18px;line-height:1.7;margin-top:20px}.stimulus pre{white-space:pre-wrap;background:#f8fafc;border:1px solid #e2e8f0;padding:14px;border-radius:9px;font:16px/1.55 Arial,sans-serif}.stem{font-size:20px}.options{font-size:17px;line-height:1.55;padding-left:28px}.options li{padding:8px 4px}.review-row{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;background:#f8fafc;padding:14px;border-radius:10px}.review-row label{font-size:13px;font-weight:700}.review-row input,.review-row select{width:100%;margin-top:6px;padding:7px;box-sizing:border-box}textarea{width:100%;min-height:70px;margin:12px 0;padding:10px;box-sizing:border-box}details{border-top:1px solid #e5e7eb;padding:12px 0}summary{cursor:pointer;font-weight:700}.blind .stimulus,.blind .stem{display:none}.blind .question-body:before{content:'Kör şık modu: Metin ve soru kökü gizli';display:block;margin:18px 0;color:#9a3412;font-weight:700}@media(max-width:720px){.wrap{padding:12px}.question{padding:16px}.review-row{grid-template-columns:1fr 1fr}}
</style></head><body><main class="wrap"><section class="intro"><h1>8. Sınıf Türkçe — Daha Önce Gösterilmemiş 12 Soru</h1><p>Bu pakette önceki gözle testlerde bulunan 12 sorunun tamamı dışlanmıştır. 24 soruluk havuzdan sekiz kazanımı kapsayan daha önce gösterilmemiş 12 soru seçilmiştir. Cevap konumları A/B/C/D için 3'er kez kullanılmıştır.</p><p>Önce kör şık modunda yalnız seçenekleri inceleyin. Sonra metni açıp soruyu çözün.</p></section><div class="toolbar"><button id="blind">Kör şık modunu aç/kapat</button></div>${questionHtml}</main><script>document.getElementById('blind').addEventListener('click',()=>document.body.classList.toggle('blind'));</script></body></html>`;
const htmlPath = path.join(reportDir, 'assessment-engine-v2-phase4c-r1-grade8-turkish-fresh-review12.html');
fs.writeFileSync(htmlPath, html);
console.log(JSON.stringify({ fullJsonPath, reviewJsonPath, htmlPath, fullMetrics: audit.metrics, review: reviewPayload.selection }, null, 2));
