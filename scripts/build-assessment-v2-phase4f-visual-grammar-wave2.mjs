#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GRADE8_TURKISH_FULL_SCOPE_MATRIX, auditGrade8TurkishFullScopeMatrix } from '../js/assessment-v2/turkish-g8-full-scope-matrix.js';
import { buildGrade8TurkishVisualGrammarWave2Questions, auditGrade8TurkishVisualGrammarWave2Catalog } from '../js/assessment-v2/turkish-g8-visual-grammar-wave2.js';
import { grade8TurkishReadingLanguageWave1QuestionById } from '../js/assessment-v2/turkish-g8-reading-language-wave1.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const reportDir = path.join(root, 'quality-reports');
fs.mkdirSync(reportDir, { recursive: true });

const items = buildGrade8TurkishVisualGrammarWave2Questions();
const catalogAudit = auditGrade8TurkishVisualGrammarWave2Catalog(items);
const matrixAudit = auditGrade8TurkishFullScopeMatrix();
const correctedQuestion = grade8TurkishReadingLanguageWave1QuestionById('tr-g8-wave1-09-emphasis-design');
const errors = [...catalogAudit.errors, ...matrixAudit.errors];

const report = {
  schemaVersion: '1.0',
  generatedAt: new Date().toISOString(),
  title: 'Phase 4F — 8. Sınıf Türkçe Görsel Okuma ve Dil Bilgisi Dalgası 2',
  status: errors.length === 0 ? 'ENGINEERING_PASS_HUMAN_REVIEW_REQUIRED' : 'RED',
  productReady: false,
  gameAdaptationAllowed: false,
  humanReviewStatus: 'NOT_MEASURED_FOR_WAVE2',
  correctedHumanReviewItem: correctedQuestion,
  fullScopeMetrics: matrixAudit.metrics,
  waveMetrics: catalogAudit.metrics,
  errors,
  questions: items
};

fs.writeFileSync(path.join(reportDir, 'assessment-engine-v2-phase4f-visual-grammar-wave2.json'), JSON.stringify(report, null, 2));
fs.writeFileSync(path.join(reportDir, 'assessment-engine-v2-g8-turkish-full-scope-matrix.json'), JSON.stringify({ schemaVersion: '1.2', generatedAt: new Date().toISOString(), status: matrixAudit.ok ? 'ENGINEERING_PASS' : 'RED', productReady: false, metrics: matrixAudit.metrics, errors: matrixAudit.errors, rows: GRADE8_TURKISH_FULL_SCOPE_MATRIX }, null, 2));

function escapeHtml(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function stimulusHtml(item) {
  if (item.content.stimulusBlocks?.length) return item.content.stimulusBlocks.map(block => `<p>${escapeHtml(block).replaceAll('\n', '<br>')}</p>`).join('');
  return `<p>${escapeHtml(item.content.stimulus)}</p>`;
}

function card(item, index) {
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
}

const corrected = `<section class="fix-card"><h2>Önceki Soru 9 — insan geri bildirimiyle düzeltilen bağ</h2>${stimulusHtml(correctedQuestion)}<p><strong>${escapeHtml(correctedQuestion.content.stem)}</strong></p><ol type="A">${correctedQuestion.content.options.map(option => `<li>${escapeHtml(option.text)}</li>`).join('')}</ol></section>`;
const cards = items.map(card).join('\n');

const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>8. Sınıf Türkçe Phase 4F — 10 Yeni Soru</title>
<style>body{font-family:Inter,Segoe UI,Arial,sans-serif;background:#f4f5f7;color:#202124;margin:0;line-height:1.62}.wrap{max-width:1040px;margin:auto;padding:30px 18px 80px}.hero,.question-card,.fix-card{background:#fff;border:1px solid #dde1e6;border-radius:18px;padding:26px;margin-bottom:22px;box-shadow:0 8px 24px rgba(30,40,60,.06)}h1{margin:0 0 10px}.meta{font-size:13px;font-weight:700;color:#7a3e00;background:#fff3e0;border-radius:999px;display:inline-block;padding:5px 11px;margin-bottom:16px}.stimulus{font-size:17px}.hide-stimulus .stimulus{filter:blur(8px);user-select:none;max-height:78px;overflow:hidden}.blind button{border:0;border-radius:10px;background:#28303d;color:white;padding:9px 13px;cursor:pointer;margin-bottom:8px}.options li,.fix-card li{margin:11px 0;padding-left:7px}details{margin-top:14px;border-top:1px solid #eceff1;padding-top:12px}summary{cursor:pointer;font-weight:750;color:#9a4700}.answer{font-weight:800}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(175px,1fr));gap:10px;margin-top:16px}.grid div{background:#faf7f2;border-radius:12px;padding:12px}.warning{font-weight:700;color:#9a3412}.fix-card{border-color:#ffd6a3;background:#fffaf3}strong{font-weight:800}</style></head><body><main class="wrap"><section class="hero"><h1>8. Sınıf Türkçe — Görsel Okuma ve Dil Bilgisi Dalgası 2</h1><p>10 yeni soru: görselden konu tahmini, karikatür ve görsel haber yorumu, edebî eser–medya karşılaştırması, cümlenin ögeleri, cümle türleri ve fiilde çatı.</p><div class="grid"><div><strong>Yeni soru</strong><br>10</div><div><strong>Yeni kazanım</strong><br>6</div><div><strong>Toplam kapsam</strong><br>31 / 76</div><div><strong>Toplam soru</strong><br>51</div></div><p class="warning">Görseller bu aşamada erişilebilir metinsel betimleme olarak verildi. Gerçek grafik/çizim üretimi, soru anlamı insan onayından geçtikten sonra ayrı medya katmanında yapılacak.</p></section>${corrected}${cards}</main></body></html>`;
fs.writeFileSync(path.join(reportDir, 'assessment-engine-v2-phase4f-visual-grammar-wave2-review.html'), html);
console.log(JSON.stringify({ status: report.status, questions: items.length, implementedOutcomes: matrixAudit.metrics.implementedOutcomeCount, implementedItems: matrixAudit.metrics.implementedItemCount }, null, 2));
