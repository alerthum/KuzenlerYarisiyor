import { seededRandom } from '../utils.js';
import { parsePremiumGradeBand } from './premium-grade-band.js';
import {
  generatePremiumPilotRounds,
  PREMIUM_PILOT_GAME_IDS as LEGACY_PREMIUM_GAME_IDS,
  premiumPilotInventory
} from './premium-pilot-bank.js';
import {
  generatePremiumExpansionRounds,
  PREMIUM_EXPANSION_GAME_IDS,
  premiumExpansionInventory
} from './premium-expansion-bank.js';
import {
  generatePremiumExpansionRoundsB,
  PREMIUM_EXPANSION_GAME_IDS_B,
  premiumExpansionInventoryB
} from './premium-expansion-bank-b.js';
import {
  generatePremiumExpansionRoundsC,
  PREMIUM_EXPANSION_GAME_IDS_C,
  premiumExpansionInventoryC
} from './premium-expansion-bank-c.js';
import {
  generatePremiumTaskRoundsD,
  PREMIUM_TASK_GAME_IDS_D,
  premiumTaskInventoryD
} from './premium-expansion-task-bank-d.js';
import {
  generatePremiumExpansionRoundsE,
  PREMIUM_EXPANSION_GAME_IDS_E,
  premiumExpansionInventoryE
} from './premium-expansion-bank-e.js';
import {
  generatePremiumTaskRoundsG,
  PREMIUM_TASK_GAME_IDS_G,
  premiumTaskInventoryG
} from './premium-expansion-task-bank-g.js';
import {
  generatePremiumExpansionRoundsF,
  PREMIUM_EXPANSION_GAME_IDS_F,
  premiumExpansionInventoryF
} from './premium-expansion-bank-f.js';
import {
  generatePremiumExpansionRoundsH,
  PREMIUM_EXPANSION_GAME_IDS_H,
  premiumExpansionInventoryH
} from './premium-expansion-bank-h.js';
import {
  generatePremiumExpansionRoundsI,
  PREMIUM_EXPANSION_GAME_IDS_I,
  premiumExpansionInventoryI
} from './premium-expansion-bank-i.js';
import {
  generatePremiumExpansionRoundsJ,
  PREMIUM_EXPANSION_GAME_IDS_J,
  premiumExpansionInventoryJ
} from './premium-expansion-bank-j.js';
import {
  generatePremiumExpansionRoundsK,
  PREMIUM_EXPANSION_GAME_IDS_K,
  premiumExpansionInventoryK
} from './premium-expansion-bank-k.js';
import {
  generatePremiumExpansionRoundsL,
  PREMIUM_EXPANSION_GAME_IDS_L,
  premiumExpansionInventoryL
} from './premium-expansion-bank-l.js';
import {
  generatePremiumTaskRoundsM,
  PREMIUM_TASK_GAME_IDS_M,
  premiumTaskInventoryM
} from './premium-expansion-task-bank-m.js';
import {
  generatePremiumHighschoolRoundsN,
  PREMIUM_HIGHSCHOOL_GAME_IDS_N,
  premiumHighschoolInventoryN
} from './premium-highschool-blueprint-bank-n.js';
import {
  generatePremiumHighschoolRoundsO,
  PREMIUM_HIGHSCHOOL_GAME_IDS_O,
  premiumHighschoolInventoryO
} from './premium-highschool-blueprint-bank-o.js';
import {
  generatePremiumHighschoolRoundsP,
  PREMIUM_HIGHSCHOOL_GAME_IDS_P,
  premiumHighschoolInventoryP
} from './premium-highschool-blueprint-bank-p.js';

export const PREMIUM_BANK_VERSION = '3.5.0-development';

const SOURCE_PACKS = Object.freeze([
  {
    id: 'foundation-34',
    gameIds: LEGACY_PREMIUM_GAME_IDS,
    generate: generatePremiumPilotRounds,
    inventory: premiumPilotInventory,
    upgradeRound: (round) => ({
      ...round,
      premiumQuestion: true,
      premiumBankVersion: PREMIUM_BANK_VERSION,
      premiumTier: 'GOLD',
      sourceLabel: 'Zihin Arenası Premium Soru Bankası'
    })
  },
  { id: 'expansion-a-30', gameIds: PREMIUM_EXPANSION_GAME_IDS, generate: generatePremiumExpansionRounds, inventory: premiumExpansionInventory },
  { id: 'expansion-b-30', gameIds: PREMIUM_EXPANSION_GAME_IDS_B, generate: generatePremiumExpansionRoundsB, inventory: premiumExpansionInventoryB },
  { id: 'expansion-c-40', gameIds: PREMIUM_EXPANSION_GAME_IDS_C, generate: generatePremiumExpansionRoundsC, inventory: premiumExpansionInventoryC },
  { id: 'task-expansion-d-30', gameIds: PREMIUM_TASK_GAME_IDS_D, generate: generatePremiumTaskRoundsD, inventory: premiumTaskInventoryD },
  { id: 'expansion-e-30', gameIds: PREMIUM_EXPANSION_GAME_IDS_E, generate: generatePremiumExpansionRoundsE, inventory: premiumExpansionInventoryE },
  { id: 'task-expansion-g-20', gameIds: PREMIUM_TASK_GAME_IDS_G, generate: generatePremiumTaskRoundsG, inventory: premiumTaskInventoryG },
  { id: 'expansion-f-30', gameIds: PREMIUM_EXPANSION_GAME_IDS_F, generate: generatePremiumExpansionRoundsF, inventory: premiumExpansionInventoryF },
  { id: 'exam-expansion-h-40', gameIds: PREMIUM_EXPANSION_GAME_IDS_H, generate: generatePremiumExpansionRoundsH, inventory: premiumExpansionInventoryH },
  { id: 'grade-3-5-foundation-i-30', gameIds: PREMIUM_EXPANSION_GAME_IDS_I, generate: generatePremiumExpansionRoundsI, inventory: premiumExpansionInventoryI },
  { id: 'grade-3-5-logic-social-english-j-30', gameIds: PREMIUM_EXPANSION_GAME_IDS_J, generate: generatePremiumExpansionRoundsJ, inventory: premiumExpansionInventoryJ },
  { id: 'grade-3-5-math-science-k-50', gameIds: PREMIUM_EXPANSION_GAME_IDS_K, generate: generatePremiumExpansionRoundsK, inventory: premiumExpansionInventoryK },
  { id: 'grade-3-5-verbal-social-english-olympiad-l-62', gameIds: PREMIUM_EXPANSION_GAME_IDS_L, generate: generatePremiumExpansionRoundsL, inventory: premiumExpansionInventoryL },
  { id: 'grade-3-5-task-games-m-30', gameIds: PREMIUM_TASK_GAME_IDS_M, generate: generatePremiumTaskRoundsM, inventory: premiumTaskInventoryM },
  { id: 'grade-9-10-verified-blueprints-n-36', gameIds: PREMIUM_HIGHSCHOOL_GAME_IDS_N, generate: generatePremiumHighschoolRoundsN, inventory: premiumHighschoolInventoryN },
  { id: 'grade-9-10-logic-problem-lab-o-38', gameIds: PREMIUM_HIGHSCHOOL_GAME_IDS_O, generate: generatePremiumHighschoolRoundsO, inventory: premiumHighschoolInventoryO },
  { id: 'grade-9-10-geometry-meaning-citizenship-p-44', gameIds: PREMIUM_HIGHSCHOOL_GAME_IDS_P, generate: generatePremiumHighschoolRoundsP, inventory: premiumHighschoolInventoryP }
]);

export const PREMIUM_GAME_IDS = Object.freeze([
  ...new Set(SOURCE_PACKS.flatMap((pack) => pack.gameIds))
]);

function shuffleRounds(rounds, seed) {
  const random = seededRandom(seed);
  const result = [...rounds];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function gradeBandSpecificity(round) {
  try {
    const band = parsePremiumGradeBand(round?.gradeBand);
    return band.max - band.min;
  } catch {
    return Number.MAX_SAFE_INTEGER;
  }
}

function prioritizeGradeSpecificRounds(candidates, options, seed) {
  if (options.grade === null || options.grade === undefined || options.grade === '') {
    return shuffleRounds(candidates, seed);
  }

  const tiers = new Map();
  for (const round of candidates) {
    const specificity = gradeBandSpecificity(round);
    if (!tiers.has(specificity)) tiers.set(specificity, []);
    tiers.get(specificity).push(round);
  }

  return [...tiers.entries()]
    .sort(([left], [right]) => left - right)
    .flatMap(([specificity, rounds]) => shuffleRounds(rounds, `${seed}:band-span-${specificity}`));
}

export function generatePremiumRounds(gameId, options = {}) {
  const matchingPacks = SOURCE_PACKS.filter((pack) => pack.gameIds.includes(gameId));
  if (!matchingPacks.length) {
    return {
      rounds: [],
      audit: {
        supported: false,
        gameId,
        version: PREMIUM_BANK_VERSION,
        available: 0,
        produced: 0,
        fallbackToLegacy: false,
        sourcePacks: []
      }
    };
  }

  const requested = Math.max(0, Number(options.count ?? 20) || 0);
  const packResults = matchingPacks.map((pack) => {
    const result = pack.generate(gameId, { ...options, count: 1_000_000 });
    return {
      pack,
      audit: result.audit,
      rounds: result.rounds.map((round) => pack.upgradeRound ? pack.upgradeRound(round) : {
        ...round,
        premiumBankVersion: PREMIUM_BANK_VERSION
      })
    };
  });

  const candidates = packResults.flatMap((entry) => entry.rounds);
  const selectionSeed = `${gameId}:${options.seed ?? 1}:${options.grade ?? 'all'}:${PREMIUM_BANK_VERSION}`;
  const prioritizedCandidates = prioritizeGradeSpecificRounds(candidates, options, selectionSeed);
  const rounds = prioritizedCandidates.slice(0, requested);

  return {
    rounds,
    audit: {
      supported: true,
      gameId,
      version: PREMIUM_BANK_VERSION,
      available: packResults.reduce((sum, entry) => sum + Number(entry.audit.available || 0), 0),
      gradeRequested: options.grade == null ? null : Number(options.grade),
      gradeFilterApplied: options.grade != null,
      gradeEligibleAvailable: packResults.reduce((sum, entry) => sum + Number(entry.audit.gradeEligibleAvailable ?? entry.audit.available ?? 0), 0),
      gradeBandsAvailable: [...new Set(packResults.flatMap((entry) => entry.audit.gradeBandsAvailable || []))],
      gradeBandsSelected: [...new Set(rounds.map((round) => round.gradeBand).filter(Boolean))],
      gradeSpecificityPriorityApplied: options.grade !== null && options.grade !== undefined && options.grade !== '',
      unseenAvailable: candidates.length,
      requested,
      produced: rounds.length,
      fallbackToLegacy: false,
      sourcePacks: matchingPacks.map((pack) => pack.id),
      packAudits: packResults.map((entry) => ({ sourcePack: entry.pack.id, ...entry.audit }))
    }
  };
}

function mergeInventoryRow(current, incoming) {
  if (!current) return {
    ...incoming,
    gradeBands: [...new Set(incoming.gradeBands || [])],
    taskKinds: [...new Set(incoming.taskKinds || [])]
  };
  return {
    questionCount: Number(current.questionCount || 0) + Number(incoming.questionCount || 0),
    familyCount: Number(current.familyCount || 0) + Number(incoming.familyCount || 0),
    topicCount: Number(current.topicCount || 0) + Number(incoming.topicCount || 0),
    subjectCount: Number(current.subjectCount || 0) + Number(incoming.subjectCount || 0),
    gradeBands: [...new Set([...(current.gradeBands || []), ...(incoming.gradeBands || [])])],
    taskKinds: [...new Set([...(current.taskKinds || []), ...(incoming.taskKinds || [])])],
    allHaveThreeMisconceptions: current.allHaveThreeMisconceptions !== false && incoming.allHaveThreeMisconceptions !== false,
    allHaveDiagnosticRules: current.allHaveDiagnosticRules !== false && incoming.allHaveDiagnosticRules !== false
  };
}

export function premiumQuestionInventory() {
  const merged = {};
  for (const pack of SOURCE_PACKS) {
    for (const [gameId, row] of Object.entries(pack.inventory())) {
      merged[gameId] = mergeInventoryRow(merged[gameId], row);
    }
  }
  return merged;
}

export function premiumQuestionSummary() {
  const inventory = premiumQuestionInventory();
  const rows = Object.values(inventory);
  const taskRows = rows.filter((row) => Array.isArray(row.taskKinds) && row.taskKinds.length);
  const choiceRows = rows.filter((row) => !Array.isArray(row.taskKinds) || !row.taskKinds.length);
  return {
    version: PREMIUM_BANK_VERSION,
    sourcePackCount: SOURCE_PACKS.length,
    gameCount: PREMIUM_GAME_IDS.length,
    questionCount: rows.reduce((sum, row) => sum + Number(row.questionCount || 0), 0),
    choiceQuestionCount: choiceRows.reduce((sum, row) => sum + Number(row.questionCount || 0), 0),
    premiumTaskCount: taskRows.reduce((sum, row) => sum + Number(row.questionCount || 0), 0),
    familyCount: rows.reduce((sum, row) => sum + Number(row.familyCount || 0), 0),
    topicCount: rows.reduce((sum, row) => sum + Number(row.topicCount || 0), 0),
    allHaveThreeMisconceptions: choiceRows.every((row) => row.allHaveThreeMisconceptions === true),
    allTasksHaveDiagnosticRules: taskRows.every((row) => row.allHaveDiagnosticRules === true)
  };
}
