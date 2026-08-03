#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ASSESSMENT_V2_PRODUCTION_PORTFOLIO,
  auditAssessmentV2ProductionPortfolio
} from '../js/assessment-v2/production-portfolio.js';
import { renderAssessmentV2ProductionPanelHtml } from '../js/quality/assessment-v2-production-panel.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
const reportDir = path.join(root, 'quality-reports');
fs.mkdirSync(publicDir, { recursive: true });
fs.mkdirSync(reportDir, { recursive: true });

const portfolio = ASSESSMENT_V2_PRODUCTION_PORTFOLIO;
const audit = auditAssessmentV2ProductionPortfolio(portfolio);
if (!audit.ok) {
  console.error(JSON.stringify(audit, null, 2));
  process.exitCode = 1;
}

const publicJson = path.join(publicDir, 'assessment-v2-production-dashboard.json');
const reportJson = path.join(reportDir, 'assessment-engine-v2-phase4h-production-dashboard.json');
fs.writeFileSync(publicJson, JSON.stringify(portfolio, null, 2));
fs.writeFileSync(reportJson, JSON.stringify({
  schemaVersion: '1.0',
  generatedAt: new Date().toISOString(),
  phase: '4H',
  title: 'Assessment V2 Ürün Şekillendirme ve Ders Motorları Panosu',
  status: audit.ok ? 'ENGINEERING_PASS_HUMAN_REVIEW_IN_PROGRESS' : 'RED',
  productReady: false,
  gameAdaptationAllowed: false,
  audit,
  portfolio
}, null, 2));

const panel = renderAssessmentV2ProductionPanelHtml(portfolio);
const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Zihin Arenası — Ders Motorları Panosu</title><style>
:root{--bg:#07111f;--panel:#0f2036;--panel2:#122a46;--muted:#98a9bd;--orange:#fb923c;--cyan:#22d3ee;--green:#34d399;color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 80% 10%,rgba(34,211,238,.08),transparent 32%),var(--bg);font:15px/1.55 Segoe UI,Arial,sans-serif;color:#eef6ff}.wrap{max-width:1320px;margin:auto;padding:28px 18px 80px}.analytics-section{padding:24px;border:1px solid rgba(148,163,184,.16);border-radius:26px;background:linear-gradient(145deg,rgba(17,31,51,.98),rgba(10,23,40,.98));box-shadow:0 24px 70px rgba(0,0,0,.25)}.section-header{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}.section-header h3{font-size:clamp(1.45rem,3vw,2.25rem);margin:10px 0 6px}.section-header p,.muted{color:var(--muted)}.badge{display:inline-flex;padding:5px 9px;border-radius:999px;background:rgba(148,163,184,.12);font-size:12px;font-weight:800}.badge.cyan{background:rgba(34,211,238,.12);color:#67e8f9}.badge.green{background:rgba(52,211,153,.12);color:#6ee7b7}.badge.orange{background:rgba(251,146,60,.13);color:#fdba74}.platform-metric-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:22px 0}.metric-card{padding:16px;border-radius:18px;background:rgba(255,255,255,.035);border:1px solid rgba(148,163,184,.13)}.metric-label{color:var(--muted);font-size:12px}.metric-value{font-size:1.45rem;font-weight:900;margin:5px 0}.metric-note{font-size:12px;color:var(--muted)}.assessment-pipeline{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px;margin:22px 0}.assessment-pipeline-step{min-height:126px;padding:13px;border:1px solid rgba(148,163,184,.14);border-radius:16px;background:rgba(255,255,255,.025)}.assessment-pipeline-step>span{display:grid;place-items:center;width:28px;height:28px;border-radius:9px;background:rgba(251,146,60,.16);font-weight:900}.assessment-pipeline-step strong,.assessment-pipeline-step small{display:block}.assessment-pipeline-step strong{margin:9px 0 5px}.assessment-pipeline-step small{color:var(--muted);min-height:55px}.assessment-rollout>div{display:grid;grid-template-columns:repeat(12,1fr);gap:7px}.assessment-rollout span{padding:10px 5px;text-align:center;border-radius:13px;background:rgba(34,211,238,.07);border:1px solid rgba(34,211,238,.13);font-weight:900}.assessment-rollout small{display:block;color:var(--muted);font-weight:600}.assessment-engine-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:24px 0}.assessment-engine-card{padding:19px;border-radius:21px;background:linear-gradient(145deg,rgba(20,46,75,.82),rgba(11,28,49,.92));border:1px solid rgba(148,163,184,.15)}.assessment-engine-card-head{display:flex;justify-content:space-between;gap:12px}.assessment-engine-grade{font-size:12px;color:#67e8f9;font-weight:800}.assessment-engine-card h4{font-size:1.3rem;margin:3px 0}.assessment-engine-card p{color:var(--muted)}.assessment-engine-stats{display:flex;flex-wrap:wrap;gap:7px;margin:13px 0}.assessment-engine-stats span{padding:7px 9px;border-radius:999px;background:rgba(255,255,255,.045);font-size:12px}.assessment-engine-tech{display:grid;gap:4px;color:#b8c8d9}.assessment-engine-next{margin-top:13px;padding:11px;border-radius:13px;background:rgba(251,146,60,.08)}.assessment-engine-card ul{color:var(--muted);padding-left:20px}.assessment-next-work ol{padding:0;display:grid;gap:8px}.assessment-next-work li{list-style:none;display:flex;gap:12px;padding:12px;border-radius:15px;background:rgba(255,255,255,.03)}.assessment-next-work li>span{display:grid;place-items:center;flex:0 0 34px;height:34px;border-radius:11px;background:rgba(34,211,238,.1);font-weight:900}.assessment-next-work strong,.assessment-next-work small{display:block}.assessment-next-work small{color:var(--muted)}@media(max-width:980px){.assessment-pipeline{grid-template-columns:repeat(2,1fr)}.platform-metric-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:680px){.section-header{display:block}.assessment-engine-grid{grid-template-columns:1fr}.assessment-rollout>div{grid-template-columns:repeat(4,1fr)}.assessment-pipeline{grid-template-columns:1fr}.platform-metric-grid{grid-template-columns:1fr 1fr}}
</style></head><body><main class="wrap">${panel}</main></body></html>`;
fs.writeFileSync(path.join(reportDir, 'assessment-v2-production-dashboard-preview.html'), html);

console.log(JSON.stringify({ status: audit.ok ? 'PASS' : 'RED', summary: portfolio.summary, files: [publicJson, reportJson] }, null, 2));
