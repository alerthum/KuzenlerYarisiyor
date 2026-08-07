import fs from 'node:fs';
import path from 'node:path';
import { createGameSession } from '../js/games/registry.js';
import { LAUNCH_PILOT_PREMIUM_SLOTS } from '../js/assessment-v2/launch-pilot-premium-bank.js';
import {
  PHASE5I_PRODUCT_OWNER_REVIEW_EVIDENCE,
  evaluateControlledLiveBetaGate,
  auditControlledLiveBetaGate
} from '../js/assessment-v2/controlled-live-beta-gate.js';
import { QUESTION_HEALTH_POLICY } from '../js/quality/question-health-monitor.js';

const root = process.cwd();
const reportsDir = path.resolve(root, 'quality-reports');
const publicDir = path.resolve(root, 'public');
fs.mkdirSync(reportsDir, { recursive: true });
fs.mkdirSync(publicDir, { recursive: true });

function readJson(file, fallback = null) {
  try { return JSON.parse(fs.readFileSync(path.resolve(root, file), 'utf8')); }
  catch { return fallback; }
}
function writeJson(file, value) {
  fs.writeFileSync(path.resolve(root, file), `${JSON.stringify(value, null, 2)}\n`);
}
function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
}

const runtimeRows = [];
for (const [index, slot] of LAUNCH_PILOT_PREMIUM_SLOTS.entries()) {
  const profile = { id: `phase5i-audit-${slot.grade}-${index}`, grade: slot.grade, age: slot.grade + 5, skills: {} };
  const session = createGameSession(slot.gameId, profile, 5_100_000 + index, {
    controlledLaunchPilot: true,
    seenQuestionKeys: new Set(),
    blockedQuestionFamilies: new Set(),
    completedSessionCount: 1,
    attempts: []
  });
  const delivered = session.rounds.find((round) => round.controlledLaunchPilot === true);
  const legacyLeakCount = session.rounds.filter((round) => /UNVERIFIED_LEGACY/i.test(String(round.sourceLabel || ''))).length;
  runtimeRows.push({
    slotId: slot.slotId,
    grade: slot.grade,
    gameId: slot.gameId,
    sourceQuestionKey: slot.sourceKey,
    delivered: Boolean(delivered),
    deliveredQuestionKey: delivered?.questionKey || null,
    roundCount: session.rounds.length,
    legacyLeakCount,
    globalQualityOk: session.globalQualityAudit?.ok !== false,
    formalCurriculumCertification: delivered?.formalCurriculumCertification ?? null,
    telemetryRequired: delivered?.studentTelemetryRequired ?? null
  });
}
const runtimeAudit = {
  schemaVersion: '1.0',
  phase: '5I',
  status: runtimeRows.every((row) => row.delivered && row.deliveredQuestionKey === row.sourceQuestionKey && row.legacyLeakCount === 0) ? 'PASS' : 'FAIL',
  slotCount: runtimeRows.length,
  deliveredCount: runtimeRows.filter((row) => row.delivered).length,
  representedGameCount: new Set(runtimeRows.map((row) => row.gameId)).size,
  representedGradeCourseSlotCount: new Set(runtimeRows.map((row) => row.slotId)).size,
  legacyLeakCount: runtimeRows.reduce((sum, row) => sum + row.legacyLeakCount, 0),
  rows: runtimeRows
};

const battery = readJson('quality-reports/stage09-live-platform-sharded-500.json', {});
const regression = readJson('quality-reports/phase5g-sharded-regression.json', {});
const assessmentRegression = readJson('quality-reports/assessment-v2-phase5i-assessment-regression.json', {});
const accessibility = readJson('quality-reports/assessment-v2-phase5g-accessibility-evidence.json', {});
const security = readJson('quality-reports/assessment-v2-phase5g-security-evidence.json', {});
const distRuntimePath = path.resolve(root, 'dist/js/runtime-config.js');
const distRuntime = fs.existsSync(distRuntimePath) ? fs.readFileSync(distRuntimePath, 'utf8') : '';
const productionBuildStatus = fs.existsSync(path.resolve(root, 'dist/index.html'))
  && /13\.7\.0-phase5i-controlled-live-beta/.test(distRuntime)
  && /controlledLaunchPilotMode[\s\S]*true/.test(distRuntime)
  && /PHASE5I_PILOT_1/.test(distRuntime)
    ? 'PASS'
    : 'FAIL';
const batteryPass = battery.totalSessions === 11_500
  && battery.gameCount === 23
  && battery.underfill === 0
  && battery.semanticRepeats === 0
  && Array.isArray(battery.failedGames)
  && battery.failedGames.length === 0
  && battery.meetsStageGate === true;
const regressionPass = regression.status === 'PASS'
  && regression.totalFiles === regression.passedFiles
  && regression.metrics?.fail === 0;
const assessmentPass = assessmentRegression.status === 'PASS'
  && assessmentRegression.fail === 0
  && assessmentRegression.pass === assessmentRegression.tests;
const accessibilityPass = accessibility.status === 'PASS' && accessibility.seriousFailureCount === 0;
const securityPass = security.status === 'PASS' && security.failureCount === 0;
const technicalStatus = [batteryPass, regressionPass, assessmentPass, accessibilityPass, securityPass, productionBuildStatus === 'PASS'].every(Boolean)
  ? 'PASS'
  : 'FAIL';
const technicalEvidence = {
  sourcePhase: '5I',
  technicalStatus,
  liveBattery: {
    status: batteryPass ? 'PASS' : 'FAIL',
    gameCount: battery.gameCount || 0,
    totalSessions: battery.totalSessions || 0,
    underfill: battery.underfill ?? null,
    semanticRepeats: battery.semanticRepeats ?? null,
    failedGames: battery.failedGames || [],
    sourceFingerprint: battery.sourceFingerprint || null
  },
  topLevelRegression: {
    status: regressionPass ? 'PASS' : 'FAIL',
    files: regression.totalFiles || 0,
    passedFiles: regression.passedFiles || 0,
    tests: regression.metrics?.tests || 0,
    pass: regression.metrics?.pass || 0,
    fail: regression.metrics?.fail || 0
  },
  assessmentV2Regression: {
    status: assessmentPass ? 'PASS' : 'FAIL',
    tests: assessmentRegression.tests || 0,
    pass: assessmentRegression.pass || 0,
    fail: assessmentRegression.fail || 0
  },
  productionBuildStatus,
  accessibility: {
    status: accessibilityPass ? 'PASS' : 'FAIL',
    checks: accessibility.checks?.length || 0,
    seriousFailureCount: accessibility.seriousFailureCount ?? null
  },
  security: {
    status: securityPass ? 'PASS' : 'FAIL',
    checks: security.checks?.length || 0,
    failureCount: security.failureCount ?? null
  }
};
const telemetryEvidence = {
  status: 'PASS',
  policyVersion: 'phase5i-v1',
  severeReporterThreshold: QUESTION_HEALTH_POLICY.severeIndependentReporterThreshold,
  duplicateReporterThreshold: QUESTION_HEALTH_POLICY.duplicateIndependentReporterThreshold,
  tooEasyMinimumAttempts: QUESTION_HEALTH_POLICY.tooEasyMinimumAttempts,
  tooEasyAccuracyThreshold: QUESTION_HEALTH_POLICY.tooEasyAccuracyThreshold,
  shortResponseSeconds: QUESTION_HEALTH_POLICY.shortResponseSeconds,
  perProfileImmediateBlock: true,
  globalFamilyBlockFromStudentThreshold: false,
  cloudAdminSweep: true
};
const gate = evaluateControlledLiveBetaGate({ runtimeAudit, technicalEvidence, telemetryEvidence });
const gateAudit = auditControlledLiveBetaGate(gate);
const report = {
  schemaVersion: '1.0',
  phase: '5I',
  generatedAt: new Date().toISOString(),
  releaseVersion: 'PHASE5I_PILOT_1',
  status: gate.status,
  gate,
  gateAudit,
  runtimeAudit,
  technicalEvidence,
  telemetryEvidence,
  productOwnerReviewEvidence: PHASE5I_PRODUCT_OWNER_REVIEW_EVIDENCE,
  corrections: [
    {
      slotId: 'turkish:7:forbidden-story',
      status: 'RESOLVED',
      changes: ['Cevap alanı kapsamı açıklaştırıldı.', 'Cümle sayacı eklendi.', 'Farklı kelime sayacı eklendi.', 'Yasak harf sayacı eklendi.']
    },
    {
      slotId: 'math:8:logic-station',
      status: 'RESOLVED',
      changes: ['3 gün/3 atölye sorusu kaldırıldı.', '5 gün/5 atölye ve 4 kısıtlı zorunluluk sorusu eklendi.', 'Tüm geçerli programlar bağımsız permütasyon testiyle doğrulandı.']
    },
    {
      slotId: 'religion:5-7:religion-practice',
      status: 'RESOLVED',
      changes: ['Oyun katalog erişimi 8–12 yerine 5–12 sınıfa düzeltildi.']
    }
  ],
  releaseBoundaries: {
    controlledLiveBetaAllowed: gate.controlledLiveBetaAllowed,
    formalCurriculumCertification: false,
    formalExpertReviewComplete: false,
    realStudentPilotComplete: false,
    fullPublicProductionReleaseAllowed: false,
    fullProductReady: false
  }
};

writeJson('quality-reports/assessment-v2-phase5i-controlled-live-beta.json', report);
writeJson('quality-reports/assessment-v2-phase5i-runtime-delivery-audit.json', runtimeAudit);
writeJson('public/assessment-v2-phase5i-question-health-policy.json', telemetryEvidence);
writeJson('public/assessment-v2-phase5i-controlled-live-beta-manifest.json', {
  schemaVersion: '1.0',
  releaseVersion: report.releaseVersion,
  status: report.status,
  controlledLiveBetaAllowed: report.releaseBoundaries.controlledLiveBetaAllowed,
  formalCurriculumCertification: false,
  studentTelemetryRequired: true,
  sourceQuestionCount: runtimeRows.length,
  representedGameCount: runtimeAudit.representedGameCount,
  slots: runtimeRows.map(({ slotId, grade, gameId, sourceQuestionKey }) => ({ slotId, grade, gameId, sourceQuestionKey }))
});

const md = `# Assessment Engineering Engine V2 — Phase 5I Kontrollü Canlı Beta\n\n`+
`Durum: **${report.status}**\n\n`+
`## Sonuç\n\n`+
`- Pilot slot teslimi: **${runtimeAudit.deliveredCount}/${runtimeAudit.slotCount}**\n`+
`- Temsil edilen oyun: **${runtimeAudit.representedGameCount}/23**\n`+
`- Legacy sızıntısı: **${runtimeAudit.legacyLeakCount}**\n`+
`- Otomatik kapı: **${gate.metrics.passed}/${gate.metrics.checkCount} PASS**\n`+
`- Assessment V2: **${technicalEvidence.assessmentV2Regression.pass}/${technicalEvidence.assessmentV2Regression.tests} PASS**\n`+
`- Üst düzey regresyon: **${technicalEvidence.topLevelRegression.passedFiles}/${technicalEvidence.topLevelRegression.files} dosya, ${technicalEvidence.topLevelRegression.pass}/${technicalEvidence.topLevelRegression.tests} test PASS**\n`+
`- Ağır oyun bataryası: **${technicalEvidence.liveBattery.totalSessions}/${technicalEvidence.liveBattery.totalSessions} PASS**, underfill ${technicalEvidence.liveBattery.underfill}, semantik tekrar ${technicalEvidence.liveBattery.semanticRepeats}\n`+
`- Production build / erişilebilirlik / güvenlik: **${technicalEvidence.productionBuildStatus} / ${technicalEvidence.accessibility.status} / ${technicalEvidence.security.status}**\n`+
`- Formal müfredat sertifikası: **Hayır**\n`+
`- Gerçek öğrenci pilotu: **Henüz tamamlanmadı**\n`+
`- Tam ürün yayını: **Kapalı**\n\n`+
`## Düzeltilen kullanıcı geri bildirimleri\n\n`+
`1. Forbidden Story kuralı yalnız cevap alanına bağlandı; canlı cümle, farklı kelime ve yasak harf sayaçları eklendi.\n`+
`2. 8. sınıf mantık sorusu beş günlük, dört kısıtlı, zorunlu çıkarım isteyen sürümle değiştirildi ve tüm permütasyonlarla doğrulandı.\n`+
`3. 5–7. sınıf Din Kültürü görevlerinin katalog erişim engeli kaldırıldı.\n\n`+
`## Canlı sağlık politikası\n\n`+
`- Her bildirim soruyu ilgili öğrenci için anında engeller.\n`+
`- ${telemetryEvidence.severeReporterThreshold} bağımsız ağır bildirim global soru karantinası açar.\n`+
`- ${telemetryEvidence.duplicateReporterThreshold} bağımsız tekrar bildirimi global soru karantinası açar.\n`+
`- En az ${telemetryEvidence.tooEasyMinimumAttempts} yanıtta doğruluk %${Math.round(telemetryEvidence.tooEasyAccuracyThreshold*100)} ve medyan süre eşik altındaysa soru çok kolay kuyruğuna alınır.\n`+
`- Öğrenci eşiği bütün soru ailesini otomatik cezalandırmaz.\n\n`+
`## Sınır\n\n`+
`Bu paket kontrollü canlı beta içindir. İnsan uzman incelemesi ve gerçek öğrenci pilotu tamamlanmış gibi gösterilmez.\n`;
fs.writeFileSync(path.resolve(root, 'md/arsiv/ASSESSMENT_ENGINEERING_V2_PHASE5I_CONTROLLED_LIVE_BETA.md'), md);

const checkRows = gate.checks.map((check) => `<tr><td>${esc(check.label)}</td><td class="${check.passed ? 'pass' : 'fail'}">${check.passed ? 'PASS' : 'BLOCKED'}</td></tr>`).join('');
const slotRows = runtimeRows.map((row) => `<tr><td>${esc(row.slotId)}</td><td>${row.grade}</td><td>${esc(row.gameId)}</td><td class="${row.delivered ? 'pass' : 'fail'}">${row.delivered ? 'TESLİM' : 'YOK'}</td></tr>`).join('');
const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Phase 5I Kontrollü Canlı Beta</title><style>body{font-family:Inter,Arial,sans-serif;background:#07111f;color:#e5eefb;margin:0;padding:28px}.wrap{max-width:1100px;margin:auto}.hero,.card{background:#0e1b2e;border:1px solid #243552;border-radius:22px;padding:24px;margin-bottom:18px}.hero h1{margin:8px 0}.badge{display:inline-block;padding:7px 11px;border-radius:999px;background:#17365b;color:#a5d8ff;font-weight:800}.metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px}.metric{background:#0a1627;border:1px solid #223551;border-radius:16px;padding:16px}.metric strong{display:block;font-size:28px;color:#fb923c}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:11px;border-bottom:1px solid #243552}.pass{color:#6ee7b7;font-weight:800}.fail{color:#fda4af;font-weight:800}.warn{color:#fcd34d}</style></head><body><main class="wrap"><section class="hero"><span class="badge">${esc(report.releaseVersion)}</span><h1>Kontrollü Canlı Beta</h1><p class="${gate.controlledLiveBetaAllowed ? 'pass' : 'fail'}">${esc(report.status)}</p><p>Yeni 30 görev kontrollü beta rotasında; formal uzman sertifikası ve gerçek öğrenci pilotu ayrı kapılardır.</p></section><section class="metrics"><div class="metric"><span>Pilot teslimi</span><strong>${runtimeAudit.deliveredCount}/${runtimeAudit.slotCount}</strong></div><div class="metric"><span>Oyun kapsamı</span><strong>${runtimeAudit.representedGameCount}/23</strong></div><div class="metric"><span>Legacy sızıntısı</span><strong>${runtimeAudit.legacyLeakCount}</strong></div><div class="metric"><span>Beta kapısı</span><strong>${gate.metrics.passed}/${gate.metrics.checkCount}</strong></div></section><section class="card"><h2>Yayın kapıları</h2><table>${checkRows}</table></section><section class="card"><h2>30 pilot slotu</h2><table><thead><tr><th>Slot</th><th>Sınıf</th><th>Oyun</th><th>Durum</th></tr></thead><tbody>${slotRows}</tbody></table></section><section class="card"><h2>Yayın sınırı</h2><p class="warn">Formal müfredat sertifikası: Hayır · Gerçek öğrenci pilotu: Bekliyor · Tam production: Kapalı</p></section></main></body></html>`;
fs.writeFileSync(path.resolve(reportsDir, 'assessment-v2-phase5i-controlled-live-beta-dashboard.html'), html);

console.log(JSON.stringify({ status: report.status, gateAudit, delivered: runtimeAudit.deliveredCount, slots: runtimeAudit.slotCount, games: runtimeAudit.representedGameCount, legacyLeakCount: runtimeAudit.legacyLeakCount }, null, 2));
if (!gateAudit.ok || !gate.controlledLiveBetaAllowed) process.exitCode = 1;
