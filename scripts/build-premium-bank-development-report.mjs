import fs from 'node:fs';
import path from 'node:path';

import {
  generatePremiumRounds,
  PREMIUM_GAME_IDS,
  premiumQuestionInventory,
  premiumQuestionSummary
} from '../js/content/premium-question-bank.js';
import { createGameSession, GAME_CATALOG } from '../js/games/registry.js';
import { evaluateOptionQuality } from '../js/quality/premium-options-engine.js';
import { auditChoiceIntegrity } from '../js/quality/choice-integrity-engine-v11.js';
import { evaluatePremiumQuestionFactory } from '../js/quality/question-factory-v13.js';
import { attachCognitiveDepth } from '../js/quality/cognitive-depth-engine.js';
import { solveRoundIndependently } from '../js/quality/independent-solver.js';
import { validatePremiumTaskRound } from '../js/content/premium-task-core.js';
import { parsePremiumGradeBand } from '../js/content/premium-grade-band.js';
import {
  PREMIUM_HIGHSCHOOL_GAME_IDS_N,
  premiumHighschoolBlueprintReportN
} from '../js/content/premium-highschool-blueprint-bank-n.js';
import {
  PREMIUM_HIGHSCHOOL_GAME_IDS_O,
  premiumHighschoolBlueprintReportO
} from '../js/content/premium-highschool-blueprint-bank-o.js';
import {
  PREMIUM_HIGHSCHOOL_GAME_IDS_P,
  premiumHighschoolBlueprintReportP
} from '../js/content/premium-highschool-blueprint-bank-p.js';

const root = process.cwd();
const output = path.join(root, 'quality-reports', 'premium-bank-development.json');
const summary = premiumQuestionSummary();
const inventory = premiumQuestionInventory();
const grades = Array.from({ length: 12 }, (_, index) => index + 1);

function profileForGame(gameId) {
  if (gameId === 'lgs-focus') return { id: `report-${gameId}`, grade: 8, age: 13, skills: {} };
  if (['tyt-focus', 'ayt-focus'].includes(gameId)) return { id: `report-${gameId}`, grade: 12, age: 18, skills: {} };
  if (gameId === 'kpss-focus') return { id: `report-${gameId}`, grade: 12, age: 20, skills: {} };
  return { id: `report-${gameId}`, grade: 8, age: 13, skills: {} };
}

function representativeGrade(round) {
  return parsePremiumGradeBand(round.gradeBand).max;
}

function applicableGradeRange(game) {
  if (game.id === 'lgs-focus') return { min: 7, max: 8 };
  if (['tyt-focus', 'ayt-focus'].includes(game.id)) return { min: 11, max: 12 };
  if (game.id === 'kpss-focus') return { min: 12, max: 12 };
  return {
    min: Math.max(1, Number(game.minAge || 6) - 5),
    max: Math.min(12, Number(game.maxAge || 17) - 5)
  };
}

function isGameApplicableToGrade(game, grade) {
  const range = applicableGradeRange(game);
  return grade >= range.min && grade <= range.max;
}

const gateFailures = [];
const subjectIds = new Set();
const topicIds = new Set();
let gateChecked = 0;

for (const gameId of PREMIUM_GAME_IDS) {
  const rounds = generatePremiumRounds(gameId, { seed: 20260803, count: 999 }).rounds;
  for (const round of rounds) {
    gateChecked += 1;
    subjectIds.add(round.subjectId || round.skill || 'unknown');
    topicIds.add(round.topicId || 'unknown');
    const grade = representativeGrade(round);
    const factory = evaluatePremiumQuestionFactory(round, { grade });
    const options = evaluateOptionQuality(round);
    const integrity = auditChoiceIntegrity(round);
    const depth = attachCognitiveDepth(round, { grade }).cognitiveDepthGate;
    const solver = solveRoundIndependently(round);
    const task = round.premiumTask ? validatePremiumTaskRound(round) : { ok: true, errors: [] };
    if (!(factory.ok && options.ok && integrity.passed && depth.publicationAllowed && solver.ok && task.ok)) {
      gateFailures.push({
        gameId,
        questionKey: round.questionKey,
        gradeBand: round.gradeBand,
        violations: {
          factory: factory.violations,
          options: options.violations,
          integrity: integrity.errors,
          depth: depth.violations,
          solver: solver.errors,
          task: task.errors
        }
      });
    }
  }
}

const gameReports = PREMIUM_GAME_IDS.map((gameId) => {
  const game = GAME_CATALOG.find((entry) => entry.id === gameId);
  const profile = profileForGame(gameId);
  const live = createGameSession(gameId, profile, 20260803, {
    completedSessionCount: 1,
    currentSessionIndex: 1,
    academicYear: '2026-2027',
    simulatedDate: '2026-10-01',
    attempts: []
  });
  const gradeCoverage = grades.map((grade) => {
    const generated = generatePremiumRounds(gameId, { seed: 20260803 + grade, count: 999, grade });
    const eligibleContent = generated.rounds.length;
    const sessionLength = Number(game?.sessionLength || 0);
    const applicable = isGameApplicableToGrade(game, grade);
    return {
      grade,
      applicable,
      eligibleContent,
      sessionLength,
      fullSessionPossible: !applicable || eligibleContent >= sessionLength,
      status: !applicable ? 'NOT_APPLICABLE' : eligibleContent === 0 ? 'SOURCE_GAP' : eligibleContent < sessionLength ? 'UNDERFILL_RISK' : 'PASS'
    };
  });
  return {
    gameId,
    title: game?.title || gameId,
    inventory: inventory[gameId],
    representativeLiveSession: {
      grade: profile.grade,
      requested: game?.sessionLength || 0,
      produced: live.rounds.length,
      premiumOnly: live.rounds.every((round) => round.premiumQuestion === true),
      pass: live.rounds.length === game?.sessionLength
        && live.rounds.every((round) => round.premiumQuestion === true && round.productQualityGate === 'PASS')
    },
    gradeCoverage
  };
});

const gradeSummary = grades.map((grade) => {
  const applicableGames = gameReports.filter((game) => game.gradeCoverage.find((entry) => entry.grade === grade)?.applicable);
  const rows = applicableGames.map((game) => game.gradeCoverage.find((entry) => entry.grade === grade));
  const gamesWithFullSession = rows.filter((row) => row.fullSessionPossible).length;
  return {
    grade,
    productGradeSupported: applicableGames.length > 0,
    applicableGameCount: applicableGames.length,
    gamesWithAnyEligibleContent: rows.filter((row) => row.eligibleContent > 0).length,
    gamesWithFullSession,
    coverageRate: applicableGames.length ? Number((gamesWithFullSession / applicableGames.length).toFixed(3)) : 0,
    sourceGapGames: applicableGames.filter((game) => game.gradeCoverage.find((row) => row.grade === grade)?.status === 'SOURCE_GAP').map((game) => game.gameId),
    underfillRiskGames: applicableGames.filter((game) => game.gradeCoverage.find((row) => row.grade === grade)?.status === 'UNDERFILL_RISK').map((game) => game.gameId)
  };
});

const liveFailures = gameReports.filter((game) => !game.representativeLiveSession.pass);
const uncoveredGrades = gradeSummary.filter((row) => !row.productGradeSupported || row.coverageRate < 1).map((row) => row.grade);
const incompleteSupportedGrades = gradeSummary.filter((row) => row.productGradeSupported && row.coverageRate < 1);
const gradeCoverageSummary = incompleteSupportedGrades.length
  ? incompleteSupportedGrades.map((row) => `${row.grade}. sınıf ${row.gamesWithFullSession}/${row.applicableGameCount}`).join('; ')
  : 'Desteklenen bütün sınıflar tam kapsam';
const highschoolBlueprintReports = [
  premiumHighschoolBlueprintReportN,
  premiumHighschoolBlueprintReportO,
  premiumHighschoolBlueprintReportP
];
const highschoolBlueprintPilot = {
  status: highschoolBlueprintReports.every((entry) => entry.verifiedInstances === entry.variantCount)
    ? 'PILOT_PASS'
    : 'FAIL',
  gradeBand: '9-10',
  coveredGames: new Set([
    ...PREMIUM_HIGHSCHOOL_GAME_IDS_N,
    ...PREMIUM_HIGHSCHOOL_GAME_IDS_O,
    ...PREMIUM_HIGHSCHOOL_GAME_IDS_P
  ]).size,
  blueprintCount: highschoolBlueprintReports.reduce((sum, entry) => sum + entry.blueprintCount, 0),
  variantCount: highschoolBlueprintReports.reduce((sum, entry) => sum + entry.variantCount, 0),
  verifiedVariantCount: highschoolBlueprintReports.reduce((sum, entry) => sum + entry.verifiedInstances, 0)
};

const report = {
  schemaVersion: '1.0',
  generatedAt: new Date().toISOString(),
  status: 'DEVELOPMENT_NOT_RELEASE',
  releaseReady: false,
  productReady: false,
  bank: {
    ...summary,
    subjectCount: subjectIds.size,
    distinctTopicCount: topicIds.size,
    migratedGames: PREMIUM_GAME_IDS.length,
    remainingLegacyGames: []
  },
  qualityGates: {
    checked: gateChecked,
    passed: gateChecked - gateFailures.length,
    failed: gateFailures.length,
    failures: gateFailures
  },
  representativeLiveSessions: {
    checkedGames: gameReports.length,
    passedGames: gameReports.length - liveFailures.length,
    failedGames: liveFailures.map((entry) => entry.gameId)
  },
  gradeSafety: {
    enabled: true,
    wrongGradeFallbackAllowed: false,
    legacyFallbackAllowed: false,
    uncoveredGrades,
    matrix: gradeSummary
  },
  annualCapacity: {
    status: 'NOT_MEASURED',
    staticHumanAuthoredContent: summary.questionCount,
    blueprintPilot: highschoolBlueprintPilot,
    note: `${highschoolBlueprintPilot.blueprintCount} blueprint ve ${highschoolBlueprintPilot.verifiedVariantCount}/${highschoolBlueprintPilot.variantCount} doğrulanmış varyantla çekirdek motor pilotu geçti; bu sonuç yıllık benzersiz deneyim kapasitesini kanıtlamaz. Müfredat genişliği ve öğrenci-yıl stres testi tamamlanmadan PASS verilemez.`
  },
  blockers: [
    {
      id: 'PREMIUM-GRADE-COVERAGE',
      severity: 'CRITICAL',
      status: uncoveredGrades.length ? 'OPEN' : 'CLOSED',
      summary: uncoveredGrades.length
        ? `Tam kapsam olmayan desteklenen sınıflar: ${gradeCoverageSummary}. Yanlış sınıf sorusu vermek yerine SOURCE_GAP üretiliyor.`
        : 'Desteklenen bütün sınıflar tam premium oturum üretebiliyor.'
    },
    {
      id: 'PREMIUM-ANNUAL-CAPACITY',
      severity: 'CRITICAL',
      status: 'OPEN',
      summary: `Kalite korumalı blueprint çekirdeği ${highschoolBlueprintPilot.blueprintCount}/${highschoolBlueprintPilot.blueprintCount} blueprint ve ${highschoolBlueprintPilot.verifiedVariantCount}/${highschoolBlueprintPilot.variantCount} varyant pilotunda geçti; yıllık hacim, konu genişliği ve öğrenci-yıl tekrarsızlık kapasitesi henüz kanıtlanmadı.`
    },
    {
      id: 'PREMIUM-CURRICULUM-COVERAGE',
      severity: 'HIGH',
      status: 'OPEN',
      summary: '27 oyun premium rotada olsa da 1–12 tüm ders, ünite ve kazanım kapsamı henüz tamamlanmadı.'
    }
  ],
  games: gameReports
};

fs.mkdirSync(path.dirname(output), { recursive: true });
const temp = `${output}.tmp`;
fs.writeFileSync(temp, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
fs.renameSync(temp, output);

console.log(JSON.stringify({
  output: path.relative(root, output),
  status: report.status,
  releaseReady: report.releaseReady,
  content: report.bank.questionCount,
  games: report.bank.gameCount,
  gateResult: `${report.qualityGates.passed}/${report.qualityGates.checked}`,
  liveGames: `${report.representativeLiveSessions.passedGames}/${report.representativeLiveSessions.checkedGames}`,
  uncoveredGrades
}, null, 2));

if (gateFailures.length || liveFailures.length) process.exitCode = 1;
