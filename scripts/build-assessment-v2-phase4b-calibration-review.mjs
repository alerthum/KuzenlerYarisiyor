import fs from 'node:fs';
import path from 'node:path';
import {
  auditGrade8TurkishCalibrationCatalog,
  buildGrade8TurkishCalibrationQuestions
} from '../js/assessment-v2/turkish-g8-reading-calibration.js';

const root = process.cwd();
const reportDir = path.join(root, 'quality-reports');
fs.mkdirSync(reportDir, { recursive: true });
const items = buildGrade8TurkishCalibrationQuestions();
const audit = auditGrade8TurkishCalibrationCatalog(items);
if (!audit.ok) throw new Error(`calibration audit failed: ${audit.errors.join(', ')}`);

const payload = {
  schemaVersion: '1.0',
  generatedAt: new Date().toISOString(),
  batchId: 'GRADE8_TURKISH_PILOT_01_CALIBRATION_5',
  decision: 'HUMAN_REVIEW_REQUIRED',
  productReady: false,
  gameAdaptationAllowed: false,
  audit,
  questions: items.map((item, index) => ({
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
  }))
};

const jsonPath = path.join(reportDir, 'assessment-engine-v2-phase4b-grade8-turkish-calibration.json');
fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2));

const esc = value => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

const questionHtml = payload.questions.map(question => {
  const stimulus = question.stimulusBlocks
    ? question.stimulusBlocks.map(block => `<p>${esc(block)}</p>`).join('')
    : `<p>${esc(question.stimulus)}</p>`;
  const options = question.options.map(option => `<li><strong>${option.id})</strong> ${esc(option.text)}</li>`).join('');
  const feedback = question.optionFeedback.map(entry => `<li><strong>${entry.optionId})</strong> ${esc(entry.text)}</li>`).join('');
  const hints = question.hints.map(entry => `<li><strong>İpucu ${entry.level}:</strong> ${esc(entry.text)}</li>`).join('');
  const solution = question.solutionGraph.map(step => `<li>${esc(step.evidence)}</li>`).join('');
  return `<article class="question">
    <header><span>Soru ${question.number}</span><span>${esc(question.outcomeId)}</span></header>
    <div class="stimulus">${stimulus}</div>
    <h2>${esc(question.stem)}</h2>
    <ol class="options" type="A">${options}</ol>
    <div class="review-row">
      <label>Doğallık <input type="number" min="1" max="5"></label>
      <label>Zorluk <input type="number" min="1" max="5"></label>
      <label>Şık kalitesi <input type="number" min="1" max="5"></label>
      <label>Cevabı ele verme <select><option>Yok</option><option>Var</option></select></label>
    </div>
    <textarea placeholder="Gözle inceleme notu"></textarea>
    <details><summary>İpuçları</summary><ol>${hints}</ol></details>
    <details><summary>Cevap ve seçenek açıklamaları</summary><p><strong>Doğru cevap: ${esc(question.answerKey.optionId)}</strong></p><ul>${feedback}</ul></details>
    <details><summary>Çözüm yolu</summary><ol>${solution}</ol></details>
  </article>`;
}).join('\n');

const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>8. Sınıf Türkçe Kalibrasyon-5</title><style>
body{font-family:Arial,sans-serif;background:#f4f5f7;color:#1f2937;margin:0}.wrap{max-width:980px;margin:auto;padding:28px}.intro,.question{background:white;border:1px solid #d9dee7;border-radius:14px;padding:24px;margin-bottom:22px;box-shadow:0 4px 16px rgba(0,0,0,.04)}h1{margin-top:0}.question header{display:flex;justify-content:space-between;font-weight:700;color:#475569;border-bottom:1px solid #e5e7eb;padding-bottom:12px}.stimulus{font-size:18px;line-height:1.7;margin-top:20px}.options{font-size:17px;line-height:1.55;padding-left:28px}.options li{padding:8px 4px}.review-row{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;background:#f8fafc;padding:14px;border-radius:10px}.review-row label{font-size:13px;font-weight:700}.review-row input,.review-row select{width:100%;margin-top:6px;padding:7px;box-sizing:border-box}textarea{width:100%;min-height:70px;margin:12px 0;padding:10px;box-sizing:border-box}details{border-top:1px solid #e5e7eb;padding:12px 0}summary{cursor:pointer;font-weight:700}@media(max-width:720px){.wrap{padding:12px}.question{padding:16px}.review-row{grid-template-columns:1fr 1fr}}
</style></head><body><main class="wrap"><section class="intro"><h1>8. Sınıf Türkçe — Kalibrasyon Seti 01</h1><p>Bu paket oyunlardan bağımsızdır. Beş soru gözle onaylanmadan 24 soruluk pilota ve oyun adaptasyonuna geçilmez.</p><p><strong>Otomatik kapılar:</strong> çoklu kanıt, tek cümleyle cevap verememe, aynı anlam alanında seçenekler, en az iki kısmen destekli çeldirici, bağımsız doğrulama ve seçenek başına öğretici geri bildirim.</p></section>${questionHtml}</main></body></html>`;
const htmlPath = path.join(reportDir, 'assessment-engine-v2-phase4b-grade8-turkish-calibration.html');
fs.writeFileSync(htmlPath, html);
console.log(JSON.stringify({ jsonPath, htmlPath, metrics: audit.metrics }, null, 2));
