import { generatePremiumRounds } from '../content/premium-question-bank.js';
import { filterTrustedLiveRounds } from '../quality/live-output-gate.js';
import { ASSESSMENT_V2_LAUNCH_PILOT_PREMIUM_BANK } from './launch-pilot-premium-bank.js';
import { TRUSTED_AUTHORED_LIVE_ROUNDS } from './trusted-authored-live-bank.js';
import { TRUSTED_G8_CORE_WAVE2_ROUNDS } from './trusted-authored-g8-core-wave2-bank.js';
import { TRUSTED_G8_MATH_DEEP_ROUNDS } from './trusted-authored-g8-math-deep-bank.js';
import { TRUSTED_G8_SCIENCE_DEEP_ROUNDS } from './trusted-authored-g8-science-deep-bank.js';
import { TRUSTED_G8_TURKISH_DEEP_ROUNDS } from './trusted-authored-g8-turkish-deep-bank.js';
import { TRUSTED_G8_LOGIC_DEEP_ROUNDS } from './trusted-authored-g8-logic-deep-bank.js';
import { TRUSTED_G7_CORE_DEEP_ROUNDS } from './trusted-authored-g7-core-deep-bank.js';
import { TRUSTED_PRIORITY_4_8_ROUNDS } from './trusted-authored-priority-4-8-bank.js';
import { SOLVER_BACKED_PRIORITY_MATH_ROUNDS } from './solver-backed-priority-math-bank.js';
import { EVIDENCE_BACKED_PRIORITY_TURKISH_ROUNDS } from './evidence-backed-priority-turkish-bank.js';
import { EVIDENCE_BACKED_PRIORITY_SCIENCE_ROUNDS } from './evidence-backed-priority-science-bank.js';
import {
  TRUSTED_LIVE_POLICY_VERSION,
  trustedLiveCell,
  trustedLivePolicySummary
} from './trusted-live-policy.js';

// Mevcut Vercel/env sözleşmesini kırmamak için sürüm anahtarı korunur.
// Dar whitelist ve son-ekran kapısının kendi bağımsız sürümleri audit içinde taşınır.
export const CONTROLLED_LIVE_BETA_VERSION = 'PHASE5I_PILOT_1';

const premiumCache = new Map();

function premiumPool(gameId, grade) {
  const cacheKey = `${gameId}:${grade}`;
  if (!premiumCache.has(cacheKey)) {
    premiumCache.set(cacheKey, generatePremiumRounds(gameId, {
      grade,
      count: 1000,
      seed: 42
    }).rounds);
  }
  return premiumCache.get(cacheKey);
}

function stableHash(value) {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function deterministicOrder(rows, seed) {
  const hasExplicitSessionPlan = rows.length > 0
    && rows.every((row) => Number.isInteger(Number(row.trustedSessionOrder)));

  if (hasExplicitSessionPlan) {
    return [...rows].sort((left, right) => (
      Number(left.trustedSessionOrder) - Number(right.trustedSessionOrder)
      || String(left.questionKey).localeCompare(String(right.questionKey))
    ));
  }

  return [...rows].sort((left, right) => {
    const a = stableHash(`${seed}:${left.questionKey}`);
    const b = stableHash(`${seed}:${right.questionKey}`);
    return a - b || String(left.questionKey).localeCompare(String(right.questionKey));
  });
}

function resolvedApprovedRounds(gameId, grade, policy) {
  const candidates = new Map();

  for (const round of [...TRUSTED_AUTHORED_LIVE_ROUNDS, ...TRUSTED_G8_CORE_WAVE2_ROUNDS, ...TRUSTED_G8_MATH_DEEP_ROUNDS, ...TRUSTED_G8_SCIENCE_DEEP_ROUNDS, ...TRUSTED_G8_TURKISH_DEEP_ROUNDS, ...TRUSTED_G8_LOGIC_DEEP_ROUNDS, ...TRUSTED_G7_CORE_DEEP_ROUNDS, ...TRUSTED_PRIORITY_4_8_ROUNDS, ...SOLVER_BACKED_PRIORITY_MATH_ROUNDS, ...EVIDENCE_BACKED_PRIORITY_TURKISH_ROUNDS, ...EVIDENCE_BACKED_PRIORITY_SCIENCE_ROUNDS]) {
    candidates.set(round.questionKey, round);
  }

  for (const row of ASSESSMENT_V2_LAUNCH_PILOT_PREMIUM_BANK.rows) {
    if (row.gameId !== gameId || Number(row.grade) !== grade) continue;
    candidates.set(row.sourceKey, row.round);
    candidates.set(row.round.questionKey, row.round);
  }

  for (const round of premiumPool(gameId, grade)) {
    candidates.set(round.questionKey, round);
  }

  const rounds = [];
  const missingKeys = [];
  for (const questionKey of policy.keys) {
    const round = candidates.get(questionKey);
    if (round) rounds.push(round);
    else missingKeys.push(questionKey);
  }
  return { rounds, missingKeys };
}

export function controlledLiveBetaRounds(gameId, profile = {}, {
  seenQuestionKeys = new Set(),
  seed = 0
} = {}) {
  const grade = Number(profile.grade ?? profile.gradeBand ?? 0);
  const seen = seenQuestionKeys instanceof Set ? seenQuestionKeys : new Set(seenQuestionKeys || []);
  const policy = trustedLiveCell(gameId, grade);

  if (!policy) {
    return {
      rounds: [],
      audit: {
        version: CONTROLLED_LIVE_BETA_VERSION,
        trustedPolicyVersion: TRUSTED_LIVE_POLICY_VERSION,
        gameId,
        grade,
        cellId: `${gameId}:${grade}`,
        policyStatus: 'BLOCKED_NOT_REVIEWED',
        approvedCount: 0,
        eligibleCount: 0,
        deliveredCandidateCount: 0,
        formalCurriculumCertification: false,
        sourcePolicy: 'FAIL_CLOSED_NO_EXPLICIT_LIVE_WHITELIST'
      }
    };
  }

  const resolved = resolvedApprovedRounds(gameId, grade, policy);
  const unseen = resolved.rounds.filter((round) => !seen.has(round.questionKey));
  const gated = filterTrustedLiveRounds(unseen, { gameId, grade });
  const ordered = deterministicOrder(gated.rounds, seed);

  const rounds = ordered.map((round) => ({
    ...round,
    targetGrade: grade,
    controlledLaunchPilot: true,
    controlledLaunchVersion: CONTROLLED_LIVE_BETA_VERSION,
    controlledLaunchSlotId: `${gameId}:${grade}:${round.questionKey}`,
    controlledLaunchCurriculumReferenceId: round.learningOutcomeId || round.curriculumReferenceId || null,
    controlledLaunchPriority: 100,
    trustedLivePolicyVersion: TRUSTED_LIVE_POLICY_VERSION,
    trustedLiveCellId: `${gameId}:${grade}`,
    sourceLabel: `${round.sourceLabel || 'Zihin Arenası Premium Bankası'} · Güvenli Canlı Whitelist`,
    premiumQuestion: true,
    premiumTier: round.premiumTier || 'GOLD',
    publicationStatus: 'CONTROLLED_BETA_SURFACE_APPROVED',
    formalCurriculumCertification: false,
    studentTelemetryRequired: true
  }));

  return {
    rounds,
    audit: {
      version: CONTROLLED_LIVE_BETA_VERSION,
      trustedPolicyVersion: TRUSTED_LIVE_POLICY_VERSION,
      gameId,
      grade,
      cellId: `${gameId}:${grade}`,
      cellLabel: policy.label,
      policyStatus: policy.status,
      approvedCount: policy.keys.length,
      resolvedCount: resolved.rounds.length,
      missingKeys: resolved.missingKeys,
      seenCount: resolved.rounds.length - unseen.length,
      eligibleCount: unseen.length,
      deliveredCandidateCount: rounds.length,
      liveOutputGate: gated.audit,
      formalCurriculumCertification: false,
      sourcePolicy: 'EXPLICIT_QUESTION_KEY_WHITELIST_PLUS_FINAL_SURFACE_GATE'
    }
  };
}

export function controlledLiveBetaPolicySummary() {
  return {
    version: CONTROLLED_LIVE_BETA_VERSION,
    trustedPolicyVersion: TRUSTED_LIVE_POLICY_VERSION,
    cells: trustedLivePolicySummary()
  };
}
