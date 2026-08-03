#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GRADE8_TURKISH_FULL_SCOPE_MATRIX,
  auditGrade8TurkishFullScopeMatrix
} from '../js/assessment-v2/turkish-g8-full-scope-matrix.js';
import {
  auditGrade8TurkishPilot02CalibrationCatalog,
  buildGrade8TurkishPilot02CalibrationQuestions
} from '../js/assessment-v2/turkish-g8-pilot02-calibration.js';
import { auditGrade8TurkishNextWaveContract } from '../js/assessment-v2/turkish-g8-next-wave-contract.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const reportDir = path.join(root, 'quality-reports');
fs.mkdirSync(reportDir, { recursive: true });

const matrixAudit = auditGrade8TurkishFullScopeMatrix();
const items = buildGrade8TurkishPilot02CalibrationQuestions();
const pilotAudit = auditGrade8TurkishPilot02CalibrationCatalog(items);
const contractAudit = auditGrade8TurkishNextWaveContract();

const matrixReport = {
  schemaVersion: '1.0',
  generatedAt: new Date().toISOString(),
  title: '8. Sınıf Türkçe Tam Kapsam Ölçme Matrisi',
  status: matrixAudit.ok ? 'ENGINEERING_PASS' : 'RED',
  productReady: false,
  humanReviewStatus: 'NOT_MEASURED',
  metrics: matrixAudit.metrics,
  errors: matrixAudit.errors,
  rows: GRADE8_TURKISH_FULL_SCOPE_MATRIX
};

const pilotReport = {
  schemaVersion: '1.0',
  generatedAt: new Date().toISOString(),
  title: 'Phase 4D — 8. Sınıf Türkçe Pilot-02 İlk Kalibrasyon',
  status: matrixAudit.ok && pilotAudit.ok && contractAudit.ok ? 'ENGINEERING_PASS_HUMAN_REVIEW_REQUIRED' : 'RED',
  productReady: false,
  gameAdaptationAllowed: false,
  humanReviewStatus: 'NOT_MEASURED',
  fullScopeMetrics: matrixAudit.metrics,
  pilotMetrics: pilotAudit.metrics,
  contractMetrics: contractAudit.metrics,
  errors: [...matrixAudit.errors, ...pilotAudit.errors, ...contractAudit.errors],
  questions: items
};

fs.writeFileSync(path.join(reportDir, 'assessment-engine-v2-g8-turkish-full-scope-matrix.json'), JSON.stringify(matrixReport, null, 2));
fs.writeFileSync(path.join(reportDir, 'assessment-engine-v2-phase4d-pilot02-calibration.json'), JSON.stringify(pilotReport, null, 2));

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function stimulusHtml(item) {
  if (item.content.stimulusBlocks?.length) {
    return item.content.stimulusBlocks.map(block => `<p>${escapeHtml(block).replaceAll('\n', '<br>')}</p>`).join('');
  }
  return `<p>${escapeHtml(item.content.stimulus)}</p>`;
}

const cards = items.map((item, index) => {
  const outcome = GRADE8_TURKISH_FULL_SCOPE_MATRIX.find(row => row.outcomeId === item.curriculum.outcomeIds[0]);
  const feedback = item.optionFeedback.map(entry => {
    const option = item.content.options.find(row => row.id === entry.optionId);
    return `<li><strong>${entry.optionId}) ${escapeHtml(option?.text)}</strong><br>${escapeHtml(entry.text)}</li>`;
  }).join('');
  const hints = item.hints.map(hint => `<li><strong>İpucu ${hint.level}:</strong> ${escapeHtml(hint.text)}</li>`).join('');
  return `<article class="question-card">
    <div class="meta">Soru ${index + 1} · ${escapeHtml(outcome?.outcomeCode)} · ${escapeHtml(outcome?.outcomeText)}</div>
    <div class="stimulus">${stimulusHtml(item)}</div>
    <h2>${escapeHtml(item.content.stem)}</h2>
    <ol class="options" type="A">${item.content.options.map(option => `<li>${escapeHtml(option.text)}</li>`).join('')}</ol>
    <details><summary>İpuçlarını göster</summary><ol>${hints}</ol></details>
    <details><summary>Cevap ve bütün seçeneklerin açıklaması</summary>
      <p class="answer">Doğru cevap: ${escapeHtml(item.answerKey.optionId)}</p>
      <ul>${feedback}</ul>
    </details>
  </article>`;
}).join('\n');

const html = `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>8. Sınıf Türkçe Pilot-02 Kalibrasyon</title>
<style>
body{font-family:Inter,Segoe UI,Arial,sans-serif;background:#f4f5f7;color:#202124;margin:0;line-height:1.6}.wrap{max-width:980px;margin:auto;padding:32px 18px 80px}.hero,.question-card{background:white;border:1px solid #dde1e6;border-radius:18px;padding:26px;margin-bottom:22px;box-shadow:0 8px 24px rgba(30,40,60,.06)}h1{margin:0 0 10px;font-size:30px}.meta{font-size:13px;font-weight:700;color:#7a3e00;background:#fff3e0;border-radius:999px;display:inline-block;padding:5px 11px;margin-bottom:16px}.stimulus{font-size:17px}.options{padding-left:28px}.options li{margin:10px 0;padding-left:6px}details{margin-top:14px;border-top:1px solid #eceff1;padding-top:12px}summary{cursor:pointer;font-weight:700;color:#a44a00}.answer{font-weight:800}.status{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin-top:18px}.status div{background:#faf7f2;border-radius:12px;padding:12px}.warning{color:#9a3412;font-weight:700}
</style></head><body><main class="wrap">
<section class="hero"><h1>8. Sınıf Türkçe Pilot-02 — İlk Kalibrasyon</h1>
<p>Bu beş soru, 76 kazanımlık tam kapsam matrisinin ilk eksik grubudur. Oyun uyarlaması yapılmamıştır.</p>
<div class="status"><div><strong>Tam kapsam</strong><br>76 kazanım</div><div><strong>Mevcut eski pilot</strong><br>8 kazanım / 24 soru</div><div><strong>Bu paket</strong><br>5 yeni kazanım / 5 soru</div><div><strong>Ürün durumu</strong><br>productReady=false</div></div>
<p class="warning">Cevaplar kapalıdır. Önce seçenek sızıntısını, sonra metin ve şık kalitesini değerlendir.</p></section>
${cards}
</main></body></html>`;

fs.writeFileSync(path.join(reportDir, 'assessment-engine-v2-phase4d-pilot02-review.html'), html);
console.log(JSON.stringify({ matrix: matrixReport.status, pilot: pilotReport.status, questions: items.length }, null, 2));
