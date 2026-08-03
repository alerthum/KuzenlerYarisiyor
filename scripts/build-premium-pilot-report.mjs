import fs from 'node:fs';
import path from 'node:path';
import {
  generatePremiumPilotRounds,
  PREMIUM_PILOT_GAME_IDS,
  premiumPilotInventory
} from '../js/content/premium-pilot-bank.js';
import { createGameSession, GAME_CATALOG } from '../js/games/registry.js';
import { evaluateOptionQuality } from '../js/quality/premium-options-engine.js';
import { auditChoiceIntegrity } from '../js/quality/choice-integrity-engine-v11.js';
import { evaluatePremiumQuestionFactory } from '../js/quality/question-factory-v13.js';
import { attachCognitiveDepth } from '../js/quality/cognitive-depth-engine.js';
import { solveRoundIndependently } from '../js/quality/independent-solver.js';

const root = process.cwd();
const output = path.join(root, 'quality-reports', 'premium-pilot-release.json');
const inventory = premiumPilotInventory();
const gameReports = [];
let allPass = true;

for (const gameId of PREMIUM_PILOT_GAME_IDS) {
  const raw = generatePremiumPilotRounds(gameId, { seed: 20260802, count: 999 }).rounds;
  const rawResults = raw.map((round) => {
    const factory = evaluatePremiumQuestionFactory(round, { grade: 8 });
    const optionQuality = evaluateOptionQuality(round);
    const choiceIntegrity = auditChoiceIntegrity(round);
    const cognitiveDepth = attachCognitiveDepth(round, { grade: 8 }).cognitiveDepthGate;
    const solver = solveRoundIndependently(round);
    const pass = factory.ok && optionQuality.ok && choiceIntegrity.passed && cognitiveDepth.publicationAllowed && solver.ok;
    if (!pass) allPass = false;
    return {
      questionKey: round.questionKey,
      topicId: round.topicId,
      pass,
      gates: {
        factory: factory.ok,
        options: optionQuality.ok,
        choiceIntegrity: choiceIntegrity.passed,
        cognitiveDepth: cognitiveDepth.publicationAllowed,
        solver: solver.ok
      }
    };
  });
  const game = GAME_CATALOG.find((item) => item.id === gameId);
  const live = createGameSession(gameId, { id: `report-${gameId}`, grade: 8, age: 13, skills: {} }, 260802, {
    completedSessionCount: 2,
    currentSessionIndex: 2,
    academicYear: '2026-2027',
    simulatedDate: '2026-10-01',
    attempts: []
  });
  const livePass = live.rounds.length === game.sessionLength
    && live.rounds.every((round) => round.premiumPilot && round.productQualityGate === 'PASS' && ['GOLD', 'APPROVE'].includes(round.globalQualityStatus));
  if (!livePass) allPass = false;
  gameReports.push({
    gameId,
    subject: raw[0]?.subjectId || null,
    inventory: inventory[gameId],
    rawQuestionGate: {
      total: raw.length,
      passed: rawResults.filter((row) => row.pass).length,
      failed: rawResults.filter((row) => !row.pass)
    },
    liveSession: {
      requested: game.sessionLength,
      produced: live.rounds.length,
      premiumPilotCount: live.rounds.filter((round) => round.premiumPilot).length,
      pass: livePass
    },
    representativeSamples: live.rounds.slice(0, 3).map((round) => ({
      questionKey: round.questionKey,
      context: round.context,
      prompt: round.prompt,
      options: round.options,
      answerIndex: round.answerIndex,
      explanation: round.explanation,
      distractors: round.optionDiagnostics.filter((entry) => !entry.isCorrect).map((entry) => ({
        optionText: entry.optionText,
        misconceptionId: entry.misconceptionId,
        whyStudentChoosesThis: entry.whyStudentChoosesThis,
        constructionRule: entry.constructionRule
      }))
    }))
  });
}

const report = {
  schemaVersion: '1.0',
  generatedAt: new Date().toISOString(),
  releaseType: 'QUALITY_PILOT',
  productReady: false,
  gitReadyPilot: allPass,
  approvedGames: allPass ? PREMIUM_PILOT_GAME_IDS : [],
  scope: {
    games: PREMIUM_PILOT_GAME_IDS.length,
    subjects: ['mathematics', 'turkish', 'science'],
    humanAuthoredQuestions: Object.values(inventory).reduce((sum, row) => sum + row.questionCount, 0),
    note: 'Bu rapor yalnız üç oyunluk kalite pilotunu onaylar; 1-12 tüm müfredat tamamlanmış değildir.'
  },
  nonNegotiableRules: [
    'Düşük kaliteli legacy içeriğe sessiz fallback yok',
    'Her yanlış seçenekte ayrı misconception ve yapım kuralı zorunlu',
    'Rastgele/alakasız çeldirici yok',
    'Bağımsız solver ve seçenek bütünlüğü geçmeden yayın yok'
  ],
  games: gameReports
};

fs.mkdirSync(path.dirname(output), { recursive: true });
const tmp = `${output}.tmp`;
fs.writeFileSync(tmp, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
fs.renameSync(tmp, output);
console.log(JSON.stringify({ output: path.relative(root, output), gitReadyPilot: report.gitReadyPilot, questions: report.scope.humanAuthoredQuestions, games: report.approvedGames }, null, 2));
if (!allPass) process.exitCode = 1;
