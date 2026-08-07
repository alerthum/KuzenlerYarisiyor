import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createGameSession } from '../js/games/registry.js';
import { controlledLiveBetaPolicySummary } from '../js/assessment-v2/controlled-live-beta-bank.js';
import { auditLiveOutputRound } from '../js/quality/live-output-gate.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const JSON_PATH = resolve(ROOT, 'quality-reports/trusted-live-review.json');
const HTML_PATH = resolve(ROOT, 'quality-reports/trusted-live-review.html');

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function profile(grade, cellId) {
  return {
    id: `trusted-review:${cellId}`,
    name: 'Güvenli Canlı İnceleme',
    age: Number(grade) + 6,
    grade: Number(grade),
    level: 10,
    skills: {}
  };
}

function collectCellRounds(cell) {
  const [gameId, gradeText] = cell.cellId.split(':');
  const grade = Number(gradeText);
  const seen = new Set();
  const rows = [];
  const sessionAudits = [];

  for (let pass = 0; pass < 12 && seen.size < cell.approvedQuestionCount; pass += 1) {
    const session = createGameSession(gameId, profile(grade, cell.cellId), 2026080600 + pass, {
      controlledLaunchPilot: true,
      completedSessionCount: pass + 1,
      seenQuestionKeys: seen,
      attempts: []
    });
    sessionAudits.push({
      pass,
      delivered: session.rounds.length,
      policyStatus: session.globalQualityAudit?.controlledLiveBeta?.policyStatus || null,
      fallbackToLegacy: session.globalQualityAudit?.premiumBank?.fallbackToLegacy ?? null
    });
    for (const round of session.rounds) {
      if (seen.has(round.questionKey)) continue;
      seen.add(round.questionKey);
      const audit = auditLiveOutputRound(round, { gameId, grade });
      rows.push({
        gameId,
        grade,
        cellId: cell.cellId,
        cellLabel: cell.label,
        questionKey: round.questionKey,
        familyId: round.familyId || null,
        topicId: round.topicId || null,
        difficulty: round.difficulty ?? null,
        cognitiveDepth: round.cognitiveDepth ?? null,
        reasoningStepCount: round.reasoningStepCount ?? round.solutionGraph?.length ?? null,
        prompt: round.prompt || '',
        context: round.context || '',
        options: Array.isArray(round.options) ? round.options : [],
        answerIndex: round.answerIndex,
        correctAnswer: Array.isArray(round.options) ? round.options[round.answerIndex] : null,
        hints: Array.isArray(round.hints) ? round.hints : [],
        explanation: round.explanation || '',
        solutionGraph: Array.isArray(round.solutionGraph) ? round.solutionGraph : [],
        publicationStatus: round.publicationStatus || null,
        audit
      });
    }
  }

  return {
    cellId: cell.cellId,
    label: cell.label,
    gameId,
    grade,
    expected: cell.approvedQuestionCount,
    collected: rows.length,
    complete: rows.length === cell.approvedQuestionCount,
    allAuditsPass: rows.every((row) => row.audit.ok),
    legacyFallbackDetected: sessionAudits.some((row) => row.fallbackToLegacy === true),
    sessionAudits,
    rounds: rows
  };
}

export async function buildTrustedLiveReview() {
  const policy = controlledLiveBetaPolicySummary();
  const cells = policy.cells.map(collectCellRounds);
  const rounds = cells.flatMap((cell) => cell.rounds);
  const failedRounds = rounds.filter((round) => !round.audit.ok);
  const document = {
    schemaVersion: '1.0',
    kind: 'trusted-live-final-surface-review',
    generatedAt: new Date().toISOString(),
    policyVersion: policy.trustedPolicyVersion,
    controlledLaunchVersion: policy.version,
    status: cells.every((cell) => cell.complete && cell.allAuditsPass && !cell.legacyFallbackDetected)
      ? 'PASS'
      : 'FAIL',
    summary: {
      cellCount: cells.length,
      completeCellCount: cells.filter((cell) => cell.complete).length,
      expectedRoundCount: cells.reduce((sum, cell) => sum + cell.expected, 0),
      reviewedRoundCount: rounds.length,
      failedRoundCount: failedRounds.length,
      legacyFallbackDetected: cells.some((cell) => cell.legacyFallbackDetected)
    },
    cells
  };

  await mkdir(dirname(JSON_PATH), { recursive: true });
  await writeFile(JSON_PATH, `${JSON.stringify(document, null, 2)}\n`, 'utf8');

  const cellNav = cells.map((cell) => `<a href="#${esc(cell.cellId)}"><b>${esc(cell.label)}</b><span>${cell.collected}/${cell.expected}</span></a>`).join('');
  const sections = cells.map((cell) => `
    <section id="${esc(cell.cellId)}">
      <header><div><small>${esc(cell.cellId)}</small><h2>${esc(cell.label)}</h2></div><strong class="${cell.complete && cell.allAuditsPass ? 'pass' : 'fail'}">${cell.complete && cell.allAuditsPass ? 'PASS' : 'FAIL'} · ${cell.collected}/${cell.expected}</strong></header>
      ${cell.rounds.map((round, index) => `
        <article>
          <div class="meta"><span>#${index + 1}</span><code>${esc(round.questionKey)}</code><span>Zorluk ${esc(round.difficulty)}</span><span>${esc(round.reasoningStepCount)} adım</span><b class="${round.audit.ok ? 'pass' : 'fail'}">${round.audit.ok ? 'ONAYLI' : 'RED'}</b></div>
          ${round.context ? `<p class="context">${esc(round.context)}</p>` : ''}
          <h3>${esc(round.prompt)}</h3>
          <ol>${round.options.map((option, optionIndex) => `<li class="${optionIndex === round.answerIndex ? 'correct' : ''}"><b>${String.fromCharCode(65 + optionIndex)}</b>${esc(option)}</li>`).join('')}</ol>
          <details><summary>İpucu, çözüm ve denetim</summary>
            <h4>İpuçları</h4><ul>${round.hints.map((hint) => `<li>${esc(hint)}</li>`).join('')}</ul>
            <h4>Çözüm</h4><p>${esc(round.explanation)}</p>
            <h4>Çözüm adımları</h4><ul>${round.solutionGraph.map((step) => `<li>${esc(step.evidence || step.text || step)}</li>`).join('') || '<li>Yapısal çözüm adımı kaydı yok.</li>'}</ul>
            ${round.audit.errors.length ? `<h4>Hatalar</h4><pre>${esc(round.audit.errors.join('\n'))}</pre>` : ''}
          </details>
        </article>`).join('')}
    </section>`).join('');

  const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Güvenli Canlı Soru İncelemesi</title><style>
  :root{color-scheme:dark;font-family:Inter,Segoe UI,sans-serif;background:#07111f;color:#e5edf7}*{box-sizing:border-box}body{margin:0;background:linear-gradient(145deg,#07111f,#0b1f36)}main{display:grid;grid-template-columns:280px minmax(0,1fr);gap:22px;max-width:1500px;margin:auto;padding:24px}nav{position:sticky;top:20px;align-self:start;max-height:calc(100vh - 40px);overflow:auto;padding:16px;border:1px solid #233b54;border-radius:20px;background:#0b1929}nav h1{font-size:1.1rem}nav p{color:#9fb0c3}nav a{display:flex;justify-content:space-between;gap:10px;margin:7px 0;padding:10px;border-radius:12px;color:#dce8f5;text-decoration:none;background:#10243a}nav a span{color:#67e8f9}section{scroll-margin-top:20px;margin-bottom:28px;padding:20px;border:1px solid #263f58;border-radius:24px;background:#0a192a}section>header{display:flex;justify-content:space-between;gap:20px;align-items:center}small,.meta{color:#9fb0c3}article{margin:16px 0;padding:18px;border:1px solid #213b55;border-radius:18px;background:#0d2034}.meta{display:flex;flex-wrap:wrap;gap:9px;align-items:center}.meta code{overflow-wrap:anywhere}.context{padding:13px;border-left:3px solid #22d3ee;background:#0a1828;line-height:1.55}h3{line-height:1.45}ol{display:grid;gap:8px;padding:0;list-style:none}ol li{display:flex;gap:10px;padding:11px;border:1px solid #24415e;border-radius:12px}ol li>b{display:grid;place-items:center;flex:0 0 28px;height:28px;border-radius:8px;background:#18334e}.correct{border-color:#22c55e;background:#123324}.pass{color:#86efac}.fail{color:#fca5a5}details{margin-top:12px;padding:12px;border-radius:12px;background:#081725}summary{cursor:pointer;font-weight:800}pre{white-space:pre-wrap}@media(max-width:850px){main{grid-template-columns:1fr;padding:12px}nav{position:static;max-height:none}section>header{align-items:flex-start;flex-direction:column}}
  </style></head><body><main><nav><h1>Güvenli Canlı Soru İncelemesi</h1><p>${document.summary.reviewedRoundCount} son-ekran sorusu · ${document.status}</p>${cellNav}</nav><div>${sections}</div></main></body></html>`;
  await writeFile(HTML_PATH, html, 'utf8');
  return document;
}

const direct = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (direct) {
  const report = await buildTrustedLiveReview();
  console.log(`Güvenli canlı son-ekran paketi: ${report.status} · ${report.summary.reviewedRoundCount}/${report.summary.expectedRoundCount}`);
}
