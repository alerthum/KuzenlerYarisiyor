import fs from 'node:fs';
import path from 'node:path';
import { ALL_PHASE3_READING_MODELS } from '../js/assessment-v2/reading-model-catalog.js';
import { materializeItemModel } from '../js/assessment-v2/materialize.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function rotate(values, offset) {
  const normalized = offset % values.length;
  return [...values.slice(normalized), ...values.slice(0, normalized)];
}

const samples = ALL_PHASE3_READING_MODELS.map((model, index) => {
  const task = model.generateTask({});
  const item = materializeItemModel(model, {});
  const rawOptions = [
    { text: item.answerText, correct: true, misconceptionId: null, feedback: null },
    ...item.distractors.map(distractor => ({
      text: distractor.text,
      correct: false,
      misconceptionId: distractor.misconceptionId,
      feedback: distractor.feedback
    }))
  ];
  const options = rotate(rawOptions, (index * 3 + 1) % rawOptions.length);
  return {
    order: index + 1,
    itemModelId: model.id,
    constructId: model.construct.id,
    queryType: task.query.type,
    surfaceProfile: task.surfaceProfile,
    context: item.context,
    prompt: item.prompt,
    options,
    answerIndex: options.findIndex(option => option.correct),
    answerText: item.answerText,
    hints: item.hints,
    solution: item.solution,
    structuralId: item.structuralId,
    cognitiveExperienceId: item.cognitiveExperienceId,
    humanVerdict: 'NOT_REVIEWED'
  };
});

const review = {
  schemaVersion: '2.0',
  generatedAt: new Date().toISOString(),
  phase: 'PHASE_3R_NATURAL_PARAGRAPH_HUMAN_REVIEW_READY',
  productReady: false,
  legacyContentPolicy: 'UNVERIFIED_LEGACY',
  humanSampleStatus: 'NOT_MEASURED',
  instructions: 'Her soruda metin türünü, doğal Türkçe akışını, soru kökünü, beş seçeneğin yakınlığını, doğru cevabı, hata yollarını ve ipuçlarını gözle inceleyin. Yapay kalıp veya ders kitabı dışı ifade görülürse model kimliğiyle kaydedin.',
  sampleCount: samples.length,
  samples
};

const jsonPath = path.join(process.cwd(), 'quality-reports', 'assessment-engine-v2-phase3-first-review.json');
fs.writeFileSync(jsonPath, `${JSON.stringify(review, null, 2)}\n`);

const cards = samples.map(sample => {
  const choices = sample.options.map((choice, choiceIndex) => `
    <li><span class="letter">${String.fromCharCode(65 + choiceIndex)}</span>${escapeHtml(choice.text)}</li>`).join('');
  const wrongPaths = sample.options.filter(option => !option.correct).map(option => `
    <li><strong>${escapeHtml(option.misconceptionId)}</strong>: ${escapeHtml(option.feedback)}</li>`).join('');
  const hints = sample.hints.map((hint, hintIndex) => `<li>${hintIndex + 1}. ${escapeHtml(hint)}</li>`).join('');
  return `<article class="card">
    <div class="meta"><span>#${sample.order}</span><code>${escapeHtml(sample.itemModelId)}</code><span>${escapeHtml(sample.queryType)}</span></div>
    <p class="context">${escapeHtml(sample.context).replaceAll('\n', '<br>')}</p>
    <h2>${escapeHtml(sample.prompt)}</h2>
    <ol class="choices">${choices}</ol>
    <details>
      <summary>Cevap ve mühendislik kanıtını göster</summary>
      <p class="answer"><strong>Doğru cevap: ${String.fromCharCode(65 + sample.answerIndex)}</strong> — ${escapeHtml(sample.answerText)}</p>
      <h3>Çeldirici hata yolları</h3><ul>${wrongPaths}</ul>
      <h3>İpucu grafı</h3><ol>${hints}</ol>
      <p class="ids"><code>${escapeHtml(sample.cognitiveExperienceId)}</code></p>
    </details>
  </article>`;
}).join('\n');

const html = `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Zihin Arenası V2 — Faz 3R Doğal Paragraf Gözle Testi</title>
<style>
:root{font-family:Inter,Segoe UI,Arial,sans-serif;color:#172033;background:#f3f5f8}*{box-sizing:border-box}body{margin:0}.wrap{max-width:980px;margin:auto;padding:32px 18px 72px}header{background:#111827;color:white;padding:28px;border-radius:20px;margin-bottom:22px}header h1{margin:0 0 8px;font-size:28px}header p{margin:6px 0;color:#d1d5db}.warning{background:#fff4dc;color:#7c4a00;padding:12px 14px;border-radius:12px;margin-top:16px}.card{background:white;border:1px solid #dde2ea;border-radius:18px;padding:24px;margin:18px 0;box-shadow:0 8px 24px rgba(20,30,50,.06)}.meta{display:flex;gap:10px;flex-wrap:wrap;align-items:center;color:#596579;font-size:13px}.meta span,.meta code{background:#eef1f5;padding:5px 8px;border-radius:8px}.context{line-height:1.72;background:#f8fafc;border-left:4px solid #f97316;padding:16px;border-radius:8px}.card h2{font-size:20px}.choices{padding:0;list-style:none}.choices li{display:flex;gap:12px;align-items:flex-start;border:1px solid #e2e8f0;padding:12px 14px;border-radius:11px;margin:9px 0;line-height:1.5}.letter{display:inline-grid;place-items:center;min-width:28px;height:28px;border-radius:50%;background:#111827;color:white;font-weight:700}details{margin-top:16px;border-top:1px dashed #cbd5e1;padding-top:14px}summary{cursor:pointer;font-weight:700;color:#9a3412}.answer{background:#ecfdf5;padding:12px;border-radius:10px;color:#065f46}.ids{color:#64748b;overflow-wrap:anywhere}h3{font-size:15px;margin-top:18px}details li{margin:7px 0;line-height:1.45}@media(max-width:600px){.wrap{padding:14px 10px 50px}.card{padding:17px}header{padding:20px}.card h2{font-size:18px}}
</style></head><body><main class="wrap"><header><h1>Faz 3R — Doğal Paragraf Gözle Testi</h1><p>12 özgün metin türü • 5 seçenek • ayrı kanıt doğrulayıcısı • yapay kalıp reddetme kapısı</p><div class="warning">Önceki Faz 3D örnekleri yapay kalıp nedeniyle reddedildi. Bu revizyon insan örneklemi için hazırdır; henüz ölçülmüş insan onayı değildir. productReady=false korunur.</div></header>${cards}</main></body></html>`;
const htmlPath = path.join(process.cwd(), 'quality-reports', 'assessment-engine-v2-phase3-first-review.html');
fs.writeFileSync(htmlPath, html);
console.log(`phase3 review pack: ${samples.length} samples; json=${jsonPath}; html=${htmlPath}`);
