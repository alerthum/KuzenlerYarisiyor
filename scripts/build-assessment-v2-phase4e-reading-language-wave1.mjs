#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GRADE8_TURKISH_FULL_SCOPE_MATRIX, auditGrade8TurkishFullScopeMatrix } from '../js/assessment-v2/turkish-g8-full-scope-matrix.js';
import { buildGrade8TurkishReadingLanguageWave1Questions, auditGrade8TurkishReadingLanguageWave1Catalog } from '../js/assessment-v2/turkish-g8-reading-language-wave1.js';
import { GRADE8_TURKISH_HUMAN_REVIEW_DECISIONS, auditGrade8TurkishHumanReviewRegistry } from '../js/assessment-v2/turkish-g8-human-review-registry.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const reportDir = path.join(root, 'quality-reports');
fs.mkdirSync(reportDir, { recursive: true });

const items = buildGrade8TurkishReadingLanguageWave1Questions();
const catalogAudit = auditGrade8TurkishReadingLanguageWave1Catalog(items);
const matrixAudit = auditGrade8TurkishFullScopeMatrix();
const reviewAudit = auditGrade8TurkishHumanReviewRegistry();
const errors = [...catalogAudit.errors, ...matrixAudit.errors, ...reviewAudit.errors];

const report = {
  schemaVersion: '1.0',
  generatedAt: new Date().toISOString(),
  title: 'Phase 4E — 8. Sınıf Türkçe Okuma ve Dil Dalgası 1',
  status: errors.length === 0 ? 'ENGINEERING_PASS_HUMAN_REVIEW_REQUIRED' : 'RED',
  productReady: false,
  gameAdaptationAllowed: false,
  humanReviewStatus: 'NOT_MEASURED_FOR_WAVE1',
  previousHumanReview: GRADE8_TURKISH_HUMAN_REVIEW_DECISIONS,
  fullScopeMetrics: matrixAudit.metrics,
  waveMetrics: catalogAudit.metrics,
  errors,
  questions: items
};

fs.writeFileSync(path.join(reportDir, 'assessment-engine-v2-phase4e-reading-language-wave1.json'), JSON.stringify(report, null, 2));
fs.writeFileSync(path.join(reportDir, 'assessment-engine-v2-g8-turkish-full-scope-matrix.json'), JSON.stringify({ schemaVersion: '1.1', generatedAt: new Date().toISOString(), status: matrixAudit.ok ? 'ENGINEERING_PASS' : 'RED', productReady: false, metrics: matrixAudit.metrics, errors: matrixAudit.errors, rows: GRADE8_TURKISH_FULL_SCOPE_MATRIX }, null, 2));

function escapeHtml(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function displayBlock(item, block, index) {
  let output = escapeHtml(block).replaceAll('\n', '<br>');
  if (item.id === 'tr-g8-wave1-09-emphasis-design' && index === 1) {
    output = output.replace('“Asıl kayıp, küçük izleri önemsiz saydığımızda başlar.”', '<strong>“Asıl kayıp, küçük izleri önemsiz saydığımızda başlar.”</strong>');
  }
  return `<p>${output}</p>`;
}

function stimulusHtml(item) {
  if (item.content.stimulusBlocks?.length) return item.content.stimulusBlocks.map((block, index) => displayBlock(item, block, index)).join('');
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
    <div class="blind"><button type="button" onclick="this.parentElement.classList.toggle('hide-stimulus')">Kör şık modunu aç/kapat</button><div class="stimulus">${stimulusHtml(item)}</div></div>
    <h2>${escapeHtml(item.content.stem)}</h2>
    <ol class="options" type="A">${item.content.options.map(option => `<li>${escapeHtml(option.text)}</li>`).join('')}</ol>
    <details><summary>İpuçlarını göster</summary><ol>${hints}</ol></details>
    <details><summary>Cevap ve bütün seçeneklerin açıklaması</summary><p class="answer">Doğru cevap: ${escapeHtml(item.answerKey.optionId)}</p><ul>${feedback}</ul></details>
  </article>`;
}).join('\n');

const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>8. Sınıf Türkçe Phase 4E — 12 Yeni Soru</title>
<style>body{font-family:Inter,Segoe UI,Arial,sans-serif;background:#f4f5f7;color:#202124;margin:0;line-height:1.62}.wrap{max-width:1020px;margin:auto;padding:30px 18px 80px}.hero,.question-card{background:#fff;border:1px solid #dde1e6;border-radius:18px;padding:26px;margin-bottom:22px;box-shadow:0 8px 24px rgba(30,40,60,.06)}h1{margin:0 0 10px}.meta{font-size:13px;font-weight:700;color:#7a3e00;background:#fff3e0;border-radius:999px;display:inline-block;padding:5px 11px;margin-bottom:16px}.stimulus{font-size:17px}.hide-stimulus .stimulus{filter:blur(8px);user-select:none;max-height:78px;overflow:hidden}.blind button{border:0;border-radius:10px;background:#28303d;color:white;padding:9px 13px;cursor:pointer;margin-bottom:8px}.options li{margin:11px 0;padding-left:7px}details{margin-top:14px;border-top:1px solid #eceff1;padding-top:12px}summary{cursor:pointer;font-weight:750;color:#9a4700}.answer{font-weight:800}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(175px,1fr));gap:10px;margin-top:16px}.grid div{background:#faf7f2;border-radius:12px;padding:12px}.warning{font-weight:700;color:#9a3412}strong{font-weight:800}</style></head><body><main class="wrap"><section class="hero"><h1>8. Sınıf Türkçe — Okuma ve Dil Dalgası 1</h1><p>Önceki gözle testlerde gösterilmeyen 12 yeni soru. Paragraf, dil bilgisi, kurgu, yönerge ve kaynak kullanımı birlikte ölçülür.</p><div class="grid"><div><strong>Yeni soru</strong><br>12</div><div><strong>Yeni kazanım</strong><br>12</div><div><strong>Toplam kapsam</strong><br>25 / 76</div><div><strong>Toplam soru</strong><br>41</div></div><p class="warning">Önce kör şık modunda seçenek sızıntısını, sonra metin ve açıklama kalitesini kontrol et.</p></section>${cards}</main></body></html>`;
fs.writeFileSync(path.join(reportDir, 'assessment-engine-v2-phase4e-reading-language-wave1-review.html'), html);
console.log(JSON.stringify({ status: report.status, questions: items.length, implementedOutcomes: matrixAudit.metrics.implementedOutcomeCount, implementedItems: matrixAudit.metrics.implementedItemCount }, null, 2));
