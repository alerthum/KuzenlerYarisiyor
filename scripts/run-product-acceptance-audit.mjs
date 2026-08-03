#!/usr/bin/env node
/**
 * PRODUCT_ACCEPTANCE_AUDIT core runner (strict:core).
 * Canlı telemetri: progress atomik yazılır; live runner public/strict-audit-live.json günceller.
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import {
  runAnnualStudentSimulation,
  runClass30Simulation,
  runPerceivedDiversityAudit,
  runContentReviewSamples,
  evaluateProductAcceptanceDecision,
  setStrictAuditProgressSink,
  PRODUCT_ACCEPTANCE_ACTIVE_GAMES,
  ORCHESTRATION_INVENTORY
} from '../js/quality/product-acceptance-audit.js';
import {
  PROGRESS_PATH,
  LIVE_PATH,
  CHECKPOINT_PATH,
  GAME_BAND_HANG_MS,
  atomicWriteJson,
  loadCheckpoint,
  readJsonSafe,
  gradeBandFromGrade,
  expectedFullWorkUnits
} from './lib/strict-audit-live-state.mjs';

const outDir = 'quality-reports/product-acceptance';
mkdirSync(outDir, { recursive: true });
mkdirSync('quality-reports', { recursive: true });
mkdirSync('public', { recursive: true });

function parseArgs(argv) {
  const args = {
    mode: 'full',
    games: null,
    band: null,
    sessions: null,
    weeks: null,
    resume: false,
    liveParent: null
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--mode') args.mode = argv[++i] || 'full';
    else if (a === '--games') args.games = (argv[++i] || '').split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--band') args.band = argv[++i] || null;
    else if (a === '--sessions') args.sessions = Number(argv[++i]);
    else if (a === '--weeks') args.weeks = Number(argv[++i]);
    else if (a === '--resume') args.resume = true;
    else if (a === '--live-parent') args.liveParent = argv[++i] || null;
  }
  if (process.env.STRICT_AUDIT_RESUME === '1') args.resume = true;
  return args;
}

const cli = parseArgs(process.argv.slice(2));
const started = Date.now();
const priorCp = cli.resume ? (loadCheckpoint()?.checkpoint || null) : null;

const progress = {
  startedAt: new Date().toISOString(),
  mode: cli.mode,
  resume: Boolean(cli.resume && priorCp),
  runId: cli.liveParent || process.env.STRICT_AUDIT_RUN_ID || null,
  hangSuspect: 'selectCompatibleSet DFS (fixed → greedy maxAttempts)',
  events: [],
  games: {},
  last: null,
  checkpoint: {
    lastCompletedGameId: priorCp?.lastCompletedGameId || null,
    lastCompletedGradeBand: priorCp?.lastCompletedGradeBand || null,
    nextGameId: priorCp?.nextGameId || null,
    nextGradeBand: priorCp?.nextGradeBand || null,
    completedPhases: [...(priorCp?.completedPhases || [])],
    completedGames: [...(priorCp?.completedGames || [])],
    completedGameBands: [...(priorCp?.completedGameBands || [])]
  },
  hangFail: null,
  totalWorkUnits: expectedFullWorkUnits(),
  completedWorkUnits: Number(loadCheckpoint()?.completedWorkUnits || 0)
};

function writeProgress() {
  progress.updatedAt = new Date().toISOString();
  progress.elapsedMs = Date.now() - started;
  atomicWriteJson(PROGRESS_PATH, progress);
  atomicWriteJson(CHECKPOINT_PATH, {
    runId: progress.runId,
    updatedAt: progress.updatedAt,
    status: 'RUNNING',
    checkpoint: progress.checkpoint,
    completedWorkUnits: progress.completedWorkUnits,
    phase: progress.last?.phase || null
  });
}

function markPhaseComplete(phase, nextPhase = null) {
  const set = new Set(progress.checkpoint.completedPhases || []);
  set.add(phase);
  progress.checkpoint.completedPhases = [...set];
  progress.checkpoint.nextGradeBand = nextPhase;
  progress.last = {
    at: new Date().toISOString(),
    phase,
    status: 'phase_pass',
    note: `phase complete → ${nextPhase || 'done'}`
  };
  writeProgress();
}

function markGameComplete(gameId, { gradeBand = null, nextGameId = null, nextGradeBand = null } = {}) {
  const set = new Set(progress.checkpoint.completedGames || []);
  set.add(gameId);
  progress.checkpoint.completedGames = [...set];
  progress.checkpoint.lastCompletedGameId = gameId;
  progress.checkpoint.lastCompletedGradeBand = gradeBand;
  progress.checkpoint.nextGameId = nextGameId;
  progress.checkpoint.nextGradeBand = nextGradeBand;
  if (gradeBand) {
    const bands = new Set(progress.checkpoint.completedGameBands || []);
    bands.add(`${gameId}:${gradeBand}`);
    progress.checkpoint.completedGameBands = [...bands];
  }
  progress.last = {
    at: new Date().toISOString(),
    phase: progress.last?.phase || 'audit',
    status: 'game_complete',
    gameId,
    gradeBand,
    nextGameId,
    nextGradeBand
  };
  writeProgress();
}

let progressWriteSeq = 0;
setStrictAuditProgressSink((event) => {
  const slim = {
    at: event.at,
    phase: event.phase,
    status: event.status,
    gameId: event.gameId,
    grade: event.grade,
    age: event.age,
    sessionIndex: event.sessionIndex,
    totalSessions: event.totalSessions,
    requestedCount: event.requestedCount,
    producedCount: event.producedCount,
    rejectedCandidateCount: event.rejectedCandidateCount,
    attemptsSoFar: event.attemptsSoFar,
    note: event.note,
    rejectionReasons: event.rejectionReasons,
    blockedFamilyIds: Array.isArray(event.blockedFamilyIds) ? event.blockedFamilyIds.slice(-8) : undefined,
    blockedSkeletonIds: Array.isArray(event.blockedSkeletonIds) ? event.blockedSkeletonIds.slice(-8) : undefined,
    blockedCognitiveExperienceIds: Array.isArray(event.blockedCognitiveExperienceIds)
      ? event.blockedCognitiveExperienceIds.slice(-8)
      : undefined
  };
  progress.last = slim;
  if (slim.status === 'ok' || slim.status === 'underfill') progress.completedWorkUnits += 1;
  if (slim.status === 'capacity_fail' || slim.status === 'underfill' || String(slim.status || '').startsWith('phase_')) {
    progress.events.push(slim);
  }
  if (progress.events.length > 300) progress.events = progress.events.slice(-200);
  const gid = event.gameId;
  if (gid && gid !== 'annual-student') {
    if (!progress.games[gid]) {
      progress.games[gid] = {
        gameId: gid, sessions: 0, underfill: 0, capacityFails: 0, lastStatus: null, lastSessionIndex: null
      };
    }
    const g = progress.games[gid];
    g.lastStatus = event.status;
    if (event.sessionIndex != null) g.lastSessionIndex = event.sessionIndex;
    if (event.status === 'ok' || event.status === 'underfill') g.sessions += 1;
    if (event.status === 'underfill') g.underfill += 1;
    if (event.status === 'capacity_fail') g.capacityFails += 1;
  }
  progressWriteSeq += 1;
  const critical = event.status === 'capacity_fail'
    || event.status === 'error'
    || event.status === 'hang_fail'
    || String(event.status || '').startsWith('phase_')
    || event.status === 'done'
    || event.status === 'game_complete';
  if (critical || progressWriteSeq % 10 === 0) writeProgress();
});

console.log('PRODUCT_ACCEPTANCE_AUDIT başlıyor…', {
  mode: cli.mode,
  games: cli.games || 'all',
  resume: progress.resume,
  livePath: LIVE_PATH
});
console.log('Orkestrasyon envanteri:', JSON.stringify(ORCHESTRATION_INVENTORY, null, 2));
writeProgress();

function bandProfile(bandId) {
  const map = {
    '1-2': { age: 8, grade: 2 },
    '3-5': { age: 10, grade: 4 },
    '6-8': { age: 13, grade: 7 },
    '9-12': { age: 16, grade: 10 }
  };
  return map[bandId] || map['3-5'];
}

function phaseDone(phase) {
  return progress.resume && (progress.checkpoint.completedPhases || []).includes(phase);
}

function gameDone(gameId) {
  return progress.resume && (progress.checkpoint.completedGames || []).includes(gameId);
}

/** Tek oyun veya sınıf bandı için 120sn HANG_FAIL (uzun yıllık/sınıf fazlarına uygulanmaz). */
function withGameBandHangWatch(label, fn, meta = {}) {
  const t0 = Date.now();
  const result = fn();
  const elapsed = Date.now() - t0;
  if (elapsed > GAME_BAND_HANG_MS) {
    progress.hangFail = {
      type: 'HANG_FAIL',
      gameId: meta.gameId || null,
      gradeBand: meta.gradeBand || gradeBandFromGrade(meta.grade) || null,
      sessionIndex: meta.sessionIndex ?? progress.last?.sessionIndex ?? null,
      requested: meta.requested ?? null,
      produced: meta.produced ?? null,
      attemptedCandidates: meta.attemptedCandidates ?? null,
      rejectionReasons: ['game_or_band_exceeded_120s'],
      blockedFamilyIds: meta.blockedFamilyIds || [],
      blockedSkeletonIds: meta.blockedSkeletonIds || [],
      blockedCognitiveExperienceIds: meta.blockedCognitiveExperienceIds || [],
      elapsedMs: elapsed,
      label
    };
    progress.last = {
      at: new Date().toISOString(),
      phase: meta.phase || 'audit',
      status: 'hang_fail',
      gameId: progress.hangFail.gameId,
      gradeBand: progress.hangFail.gradeBand,
      ...progress.hangFail
    };
    writeProgress();
    const err = new Error(`HANG_FAIL: ${label} took ${elapsed}ms`);
    err.hangFail = progress.hangFail;
    throw err;
  }
  return result;
}

let results;

if (cli.mode === 'mini') {
  const games = cli.games?.length ? cli.games : ['pattern-lab'];
  const sessions = Number.isFinite(cli.sessions) ? cli.sessions : 20;
  const weeks = Number.isFinite(cli.weeks) ? cli.weeks : 1;
  const band = bandProfile(cli.band || '3-5');
  console.log('MINI repro:', { games, weeks, sessionsPerWeek: sessions, band });
  const annual = runAnnualStudentSimulation({
    weeks,
    sessionsPerWeek: sessions,
    minAttempts: Math.min(sessions * weeks * 8, 200),
    games,
    baseProfile: {
      id: `mini-${games[0]}-${cli.band || '3-5'}`,
      ...band,
      skills: {
        attention: 30, problemSolving: 30, vocabulary: 30, reading: 30, arithmetic: 30,
        patterns: 30, geometry: 30, olympiad: 30, verbalLogic: 30, englishVocabulary: 30,
        englishGrammar: 30, socialHistory: 30, socialGeography: 30, citizenship: 30,
        religion: 30, science: 30, scientificReasoning: 30, lgsFamiliarity: 30
      }
    }
  });
  writeFileSync(`${outDir}/annual-student-mini.json`, `${JSON.stringify(annual, null, 2)}\n`, 'utf8');
  progress.miniResult = { pass: annual.pass, gates: annual.gates };
  writeProgress();
  console.log(JSON.stringify({
    mode: 'mini', decision: 'MINI_ONLY', productReady: false, annualPass: annual.pass,
    elapsedMs: Date.now() - started, progressPath: PROGRESS_PATH
  }, null, 2));
  process.exit(0);
}

if (cli.mode === 'games-one-by-one') {
  const games = cli.games?.length ? cli.games : [...PRODUCT_ACCEPTANCE_ACTIVE_GAMES];
  const gameResults = {};
  for (let gi = 0; gi < games.length; gi += 1) {
    const gameId = games[gi];
    if (gameDone(gameId)) {
      console.log(`SKIP completed game ${gameId}`);
      continue;
    }
    const t0 = Date.now();
    console.log(`\n=== GAME ${gameId} ===`);
    try {
      withGameBandHangWatch(`game:${gameId}`, () => {
        const annual = runAnnualStudentSimulation({
          weeks: 4, sessionsPerWeek: 5, minAttempts: 80, games: [gameId]
        });
        const perceived = runPerceivedDiversityAudit({ games: [gameId], samplesPerGame: 8 });
        const contentReview = runContentReviewSamples({ games: [gameId], samplesPerBand: 4 });
        gameResults[gameId] = {
          status: 'done',
          elapsedMs: Date.now() - t0,
          annualPass: annual.pass,
          perceivedPass: perceived.pass,
          contentPass: contentReview.pass,
          annualGates: annual.gates
        };
      }, { gameId, phase: 'audit' });
    } catch (err) {
      gameResults[gameId] = {
        status: err.hangFail ? 'hang_fail' : 'error',
        elapsedMs: Date.now() - t0,
        error: String(err?.stack || err),
        hangFail: err.hangFail || progress.hangFail
      };
      progress.games[gameId] = { ...(progress.games[gameId] || { gameId }), lastStatus: 'error', result: gameResults[gameId] };
      writeProgress();
      writeFileSync(`${outDir}/games-one-by-one.json`, `${JSON.stringify(gameResults, null, 2)}\n`, 'utf8');
      console.error(`FAIL/HANG at ${gameId}:`, err.message);
      process.exit(3);
    }
    progress.games[gameId] = { ...(progress.games[gameId] || { gameId }), result: gameResults[gameId] };
    markGameComplete(gameId, { nextGameId: games[gi + 1] || null });
    writeFileSync(`${outDir}/games-one-by-one.json`, `${JSON.stringify(gameResults, null, 2)}\n`, 'utf8');
  }
  console.log(JSON.stringify({ mode: 'games-one-by-one', gameResults, elapsedMs: Date.now() - started }, null, 2));
  process.exit(0);
}

// FULL strict — faz checkpoint (tamamlanan fazlar yeniden koşulmaz)
results = { annual: null, class30: null, perceived: null, contentReview: null };

if (phaseDone('annual') && existsSync(`${outDir}/annual-student.json`)) {
  console.log('SKIP phase annual (checkpoint)');
  results.annual = readJsonSafe(`${outDir}/annual-student.json`);
} else {
  console.log('PHASE annual…');
  results.annual = runAnnualStudentSimulation({ weeks: 36, sessionsPerWeek: 20, minAttempts: 3600 });
  writeFileSync(`${outDir}/annual-student.json`, `${JSON.stringify(results.annual, null, 2)}\n`, 'utf8');
  markPhaseComplete('annual', 'class30');
}

if (phaseDone('class30') && existsSync(`${outDir}/class-30.json`)) {
  console.log('SKIP phase class30 (checkpoint)');
  results.class30 = readJsonSafe(`${outDir}/class-30.json`);
} else {
  console.log('PHASE class30…');
  results.class30 = runClass30Simulation({ studentCount: 30, weeks: 36 });
  writeFileSync(`${outDir}/class-30.json`, `${JSON.stringify(results.class30, null, 2)}\n`, 'utf8');
  markPhaseComplete('class30', 'perceived');
}

if (phaseDone('perceived') && existsSync(`${outDir}/perceived-diversity.json`)) {
  console.log('SKIP phase perceived (checkpoint)');
  results.perceived = readJsonSafe(`${outDir}/perceived-diversity.json`);
} else {
  console.log('PHASE perceived…');
  results.perceived = runPerceivedDiversityAudit({ samplesPerGame: 20 });
  writeFileSync(`${outDir}/perceived-diversity.json`, `${JSON.stringify(results.perceived, null, 2)}\n`, 'utf8');
  for (const gameId of PRODUCT_ACCEPTANCE_ACTIVE_GAMES) {
    markGameComplete(`perceived:${gameId}`, {});
  }
  markPhaseComplete('perceived', 'contentReview');
}

if (phaseDone('contentReview') && existsSync(`${outDir}/content-review-samples.json`)) {
  console.log('SKIP phase contentReview (checkpoint)');
  results.contentReview = readJsonSafe(`${outDir}/content-review-samples.json`);
} else {
  console.log('PHASE contentReview…');
  results.contentReview = runContentReviewSamples({ samplesPerBand: 20 });
  writeFileSync(`${outDir}/content-review-samples.json`, `${JSON.stringify(results.contentReview, null, 2)}\n`, 'utf8');
  for (const gameId of PRODUCT_ACCEPTANCE_ACTIVE_GAMES) {
    markGameComplete(`content:${gameId}`, { gradeBand: 'all' });
  }
  markPhaseComplete('contentReview', 'decision');
}

let technicalEvidenceAdequacy = 'FAIL';
if (existsSync('FINAL_EVIDENCE_INDEX.json')) {
  const index = JSON.parse(readFileSync('FINAL_EVIDENCE_INDEX.json', 'utf8'));
  technicalEvidenceAdequacy = index.finalEvidenceAdequacy || 'FAIL';
}

const decision = evaluateProductAcceptanceDecision({
  technicalEvidenceAdequacy,
  annual: results.annual,
  class30: results.class30,
  perceived: results.perceived,
  contentReview: results.contentReview
});
decision.updatedAt = new Date().toISOString();
decision.reports = {
  annualStudent: `${outDir}/annual-student.json`,
  class30: `${outDir}/class-30.json`,
  perceivedDiversity: `${outDir}/perceived-diversity.json`,
  contentReviewSamples: `${outDir}/content-review-samples.json`,
  strictProgress: PROGRESS_PATH,
  strictLive: LIVE_PATH
};
decision.elapsedMs = Date.now() - started;
decision.nextExactCommand = decision.decision === 'PASS'
  ? null
  : 'npm run quality:product-acceptance:strict';

atomicWriteJson('PRODUCT_ACCEPTANCE_DECISION.json', decision);

if (existsSync('public/question-engine-analysis.json')) {
  const analysis = JSON.parse(readFileSync('public/question-engine-analysis.json', 'utf8'));
  analysis.productAcceptance = {
    decision: decision.decision,
    productReady: decision.productReady,
    dimensions: decision.dimensions,
    technicalQualityScoreLabel: 'Teknik Kalite Puanı',
    note: decision.note,
    failureHighlights: decision.failureHighlights,
    reports: decision.reports,
    updatedAt: decision.updatedAt
  };
  analysis.productReady = decision.productReady === true;
  analysis.technicalQualityScorePercent = analysis.overallQualityScorePercent;
  analysis.strictAuditLive = {
    path: LIVE_PATH,
    note: 'Canlı durum public/strict-audit-live.json — eski PASS canlı sonuç değildir.',
    updatedAt: decision.updatedAt
  };
  atomicWriteJson('public/question-engine-analysis.json', analysis);
}

const snap = `# CONTEXT_SNAPSHOT

**Guncelleme:** ${decision.updatedAt} · **Mevcut asama:** 15 — Final kabul (teknik) · **PRODUCT_ACCEPTANCE:** ${decision.decision}

## Canli takip
- Son tamamlanan islem: decision yazildi
- Su an calisan islem: yok (kosu bitti)
- Son checkpoint: ${JSON.stringify(progress.checkpoint)}
- Siradaki kesin islem: ${decision.nextExactCommand || 'Yok (PASS)'}
- Ilgili dosyalar: ${LIVE_PATH}, ${PROGRESS_PATH}, ${CHECKPOINT_PATH}
- Son gercek test sonucu: decision=${decision.decision} productReady=${decision.productReady}

## Final kanit yeterliligi (teknik): ${technicalEvidenceAdequacy}
Stage 14 teknik PASS, yillik urun kabulu degildir.

## Urun kabul boyutlari
| Boyut | Sonuc |
|-------|-------|
| Teknik kalite | ${decision.dimensions.technicalQuality} |
| Yillik ogrenci kapasitesi | ${decision.dimensions.annualStudentCapacity} |
| 30 kisilik sinif kapasitesi | ${decision.dimensions.class30Capacity} |
| Algilanan cesitlilik | ${decision.dimensions.perceivedDiversity} |
| Gercek icerik inceleme | ${decision.dimensions.contentReview} |

## Urun Hazir: ${decision.productReady ? 'EVET' : 'HAYIR'}

## Raporlar
- annual: ${outDir}/annual-student.json
- class30: ${outDir}/class-30.json
- perceived: ${outDir}/perceived-diversity.json
- content: ${outDir}/content-review-samples.json
- progress: ${PROGRESS_PATH}
- live: ${LIVE_PATH}
- decision: PRODUCT_ACCEPTANCE_DECISION.json

## Basarisiz kapilar
\`\`\`json
${JSON.stringify(decision.failureHighlights, null, 2)}
\`\`\`

## Sonraki kesin komut
${decision.nextExactCommand
  ? `\`${decision.nextExactCommand}\` — FAIL sonrasi yalniz basarisiz orkestrasyon katmanini duzelt; mimariyi yeniden yazma.`
  : 'Yok (PRODUCT_ACCEPTANCE PASS).'}
`;
writeFileSync('CONTEXT_SNAPSHOT.md', snap, 'utf8');

progress.decision = decision.decision;
progress.productReady = decision.productReady;
progress.failureHighlights = decision.failureHighlights;
progress.last = { at: decision.updatedAt, phase: 'done', status: decision.decision === 'PASS' ? 'phase_pass' : 'phase_fail' };
writeProgress();

console.log(JSON.stringify({
  decision: decision.decision,
  productReady: decision.productReady,
  dimensions: decision.dimensions,
  failureHighlights: decision.failureHighlights,
  elapsedMs: decision.elapsedMs,
  progressPath: PROGRESS_PATH,
  livePath: LIVE_PATH
}, null, 2));

process.exit(decision.decision === 'PASS' ? 0 : 2);
