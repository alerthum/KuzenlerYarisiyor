#!/usr/bin/env node
/**
 * Aşama 14 final kanıt üreticisi.
 * Fazlar: sessions | solver | options | childmind | sync
 * Mutation ve E2E ayrı komutlarla koşulur; bu script sayaçları yazar.
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { STAGE09_ACTIVE_GAMES, STAGE09_PROFILES, STAGE09_SEEDS, runGameSessionBattery } from '../js/quality/session-composer-audit.js';
import { createGameSession, GAME_CATALOG, isGameAvailableForProfile } from '../js/games/registry.js';
import { scoreIndependentSolverAudit } from '../js/quality/independent-solver.js';
import { scoreOptionQualityAudit } from '../js/quality/premium-options-engine.js';
import { scoreChildMindAudit } from '../js/quality/child-mind-review.js';
import { spawnSync } from 'node:child_process';

const phase = (process.argv.find((a) => a.startsWith('--phase=')) || '--phase=sessions').split('=')[1];
const outDir = 'quality-reports/final-evidence';
mkdirSync(outDir, { recursive: true });

function loadIndex() {
  return JSON.parse(readFileSync('FINAL_EVIDENCE_INDEX.json', 'utf8'));
}

function saveIndex(index) {
  writeFileSync('FINAL_EVIDENCE_INDEX.json', `${JSON.stringify(index, null, 2)}\n`);
}

function sync() {
  const r = spawnSync(process.execPath, ['scripts/sync-final-evidence-state.mjs'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: 'inherit'
  });
  if (r.status !== 0) process.exit(r.status || 1);
}

function profileFor(gameId, base) {
  const game = GAME_CATALOG.find((g) => g.id === gameId);
  let grade = base.grade;
  let age = base.age;
  if (gameId === 'lgs-foundation') { grade = 8; age = Math.max(age, 12); }
  if (gameId === 'religion-practice') { grade = Math.max(grade, 8); age = Math.max(age, 12); }
  if (gameId === 'word-ladder' && grade >= 9) { grade = 8; age = Math.min(age, 14); }
  if (game?.maxGrade && grade > game.maxGrade) grade = game.maxGrade;
  if (game?.minGrade && grade < game.minGrade) grade = game.minGrade;
  age = Math.max(age, game?.minAge || 8);
  return { ...base, id: `${base.id}-${gameId}`, age, grade, skills: {} };
}

function runSessions() {
  const results = [];
  let underfill = 0;
  let semantic = 0;
  for (const gameId of STAGE09_ACTIVE_GAMES) {
    const started = Date.now();
    const result = runGameSessionBattery(gameId, { sessionsPerGame: 500 });
    underfill += result.underfill || 0;
    semantic += result.semanticRepeats || 0;
    results.push(result);
    console.log(`sessions ${gameId}: produced=${result.produced} under=${result.underfill} sem=${result.semanticRepeats} ms=${Date.now() - started}`);
  }
  const minSessions = Math.min(...results.map((r) => r.produced || 0));
  const gamesMeeting = results.filter((r) => (r.produced || 0) >= 500 && r.underfill === 0 && r.semanticRepeats === 0).length;
  const report = {
    generatedAt: new Date().toISOString(),
    sessionsPerGameTarget: 500,
    games: 23,
    minSessionsPerGame: minSessions,
    gamesMeetingSessionTarget: gamesMeeting,
    underfillCount: underfill,
    sessionSemanticRepeatCount: semantic,
    results
  };
  writeFileSync(`${outDir}/stage09-500.json`, `${JSON.stringify(report, null, 2)}\n`);
  const index = loadIndex();
  index.actual.minSessionsPerGame = minSessions;
  index.actual.gamesMeetingSessionTarget = gamesMeeting;
  index.actual.underfillCount = underfill;
  index.actual.sessionSemanticRepeatCount = semantic;
  index.reports.stage09 = `${outDir}/stage09-500.json`;
  index.lastAction = 'Stage09 23x500 batarya tamamlandi';
  index.lastTestResult = `minSessions=${minSessions} games500=${gamesMeeting} under=${underfill} sem=${semantic}`;
  index.nextExactCommand = 'node scripts/run-final-evidence.mjs --phase=solver';
  saveIndex(index);
  sync();
}

function collectRounds(targetCount, { choiceOnly = false } = {}) {
  const samples = [];
  let seed = 900_001;
  let guard = 0;
  while (samples.length < targetCount && guard < targetCount * 3) {
    guard += 1;
    const gameId = STAGE09_ACTIVE_GAMES[guard % STAGE09_ACTIVE_GAMES.length];
    const game = GAME_CATALOG.find((g) => g.id === gameId);
    const base = STAGE09_PROFILES[guard % STAGE09_PROFILES.length];
    const profile = profileFor(gameId, base);
    if (!isGameAvailableForProfile(game, profile)) continue;
    seed += 17;
    let session;
    try {
      session = createGameSession(gameId, profile, seed, { completedSessionCount: (guard % 40) + 1 });
    } catch {
      continue;
    }
    for (const round of session.rounds || []) {
      if (choiceOnly && round.kind && round.kind !== 'choice') continue;
      samples.push({ round, grade: profile.grade, gameId });
      if (samples.length >= targetCount) break;
    }
  }
  return samples;
}

function runSolver() {
  const samples = collectRounds(50_000, { choiceOnly: false });
  const audit = scoreIndependentSolverAudit(samples.map((s) => s.round));
  const report = {
    generatedAt: new Date().toISOString(),
    target: 50_000,
    collected: samples.length,
    audit
  };
  writeFileSync(`${outDir}/solver-50k.json`, `${JSON.stringify(report, null, 2)}\n`);
  const index = loadIndex();
  index.actual.solverSamples = samples.length;
  index.partialScores = {
    ...(index.partialScores || {}),
    accuracyPercent: audit.accuracyPercent
  };
  index.reports.solver = `${outDir}/solver-50k.json`;
  index.lastAction = 'Solver 50000 ornek toplandi';
  index.lastTestResult = `solver=${samples.length} accuracy=${audit.accuracyPercent}`;
  index.nextExactCommand = 'node scripts/run-final-evidence.mjs --phase=options';
  saveIndex(index);
  sync();
}

function runOptions() {
  const samples = collectRounds(10_000, { choiceOnly: true });
  const audit = scoreOptionQualityAudit(samples.map((s) => s.round));
  const report = {
    generatedAt: new Date().toISOString(),
    target: 10_000,
    collected: samples.length,
    audit
  };
  writeFileSync(`${outDir}/options-10k.json`, `${JSON.stringify(report, null, 2)}\n`);
  const index = loadIndex();
  index.actual.optionSamples = samples.length;
  index.partialScores = {
    ...(index.partialScores || {}),
    optionQualityScore: audit.scorePercent,
    irrelevantOptionCount: audit.irrelevantOptionCount,
    formCueGiveawayCount: audit.formCueGiveawayCount
  };
  index.reports.options = `${outDir}/options-10k.json`;
  index.lastAction = 'Secenek kalitesi 10000 ornek toplandi';
  index.lastTestResult = `options=${samples.length} score=${audit.scorePercent}`;
  index.nextExactCommand = 'node scripts/run-final-evidence.mjs --phase=childmind';
  saveIndex(index);
  sync();
}

function runChildMind() {
  const bands = [
    { label: '1-2', grades: [1, 2] },
    { label: '3-5', grades: [3, 4, 5] },
    { label: '6-8', grades: [6, 7, 8] },
    { label: '9-12', grades: [9, 10, 11, 12] }
  ];
  const bandReports = [];
  const allSamples = [];
  for (const band of bands) {
    const samples = [];
    let seed = 1_200_000 + band.grades[0] * 1000;
    for (let i = 0; i < 400 && samples.length < 200; i += 1) {
      const gameId = STAGE09_ACTIVE_GAMES[i % STAGE09_ACTIVE_GAMES.length];
      const game = GAME_CATALOG.find((g) => g.id === gameId);
      const grade = band.grades[i % band.grades.length];
      if (gameId === 'word-ladder' && grade >= 9) continue;
      if (game?.minGrade && grade < game.minGrade) continue;
      if (game?.maxGrade && grade > game.maxGrade) continue;
      const age = Math.max(game?.minAge || 8, grade + 6);
      const profile = { id: `cm-${band.label}-${i}`, age, grade, skills: {} };
      if (!isGameAvailableForProfile(game, profile)) continue;
      seed += 13;
      try {
        const session = createGameSession(gameId, profile, seed, { completedSessionCount: 2 });
        for (const round of session.rounds) {
          samples.push({ round, grade, gameId, band: band.label });
          allSamples.push({ round, grade, gameId, band: band.label });
        }
      } catch {
        // band/game uyumsuz
      }
    }
    const audit = scoreChildMindAudit(samples);
    bandReports.push({ band: band.label, grades: band.grades, sampleCount: samples.length, audit });
  }
  const overall = scoreChildMindAudit(allSamples);
  const structured = bandReports.every((b) => b.sampleCount >= 50 && b.audit.criticalRejects === 0 && b.audit.scorePercent >= 90);
  const report = {
    generatedAt: new Date().toISOString(),
    structuredAgeBands: true,
    bands: bandReports,
    overall,
    meetsStructuredEvidence: structured && overall.meetsStageGate
  };
  writeFileSync(`${outDir}/child-mind-bands.json`, `${JSON.stringify(report, null, 2)}\n`);
  const index = loadIndex();
  index.actual.childMindStructuredBands = report.meetsStructuredEvidence === true;
  index.partialScores = {
    ...(index.partialScores || {}),
    childMindScore: overall.scorePercent
  };
  index.reports.childMind = `${outDir}/child-mind-bands.json`;
  index.lastAction = 'Child-mind yapilandirilmis yas bantlari raporu';
  index.lastTestResult = `bands=${bandReports.length} structured=${index.actual.childMindStructuredBands} score=${overall.scorePercent}`;
  index.nextExactCommand = 'npm run test:mutation';
  saveIndex(index);
  sync();
}

if (phase === 'sessions') runSessions();
else if (phase === 'solver') runSolver();
else if (phase === 'options') runOptions();
else if (phase === 'childmind') runChildMind();
else if (phase === 'sync') sync();
else {
  console.error(`Unknown phase: ${phase}`);
  process.exit(2);
}
