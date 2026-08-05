import { ASSESSMENT_V2_LAUNCH_PILOT_PREMIUM_BANK } from './launch-pilot-premium-bank.js';

export const CONTROLLED_LIVE_BETA_VERSION = 'PHASE5I_PILOT_1';

export function controlledLiveBetaRounds(gameId, profile = {}, { seenQuestionKeys = new Set() } = {}) {
  const grade = Number(profile.grade ?? profile.gradeBand ?? 0);
  const seen = seenQuestionKeys instanceof Set ? seenQuestionKeys : new Set(seenQuestionKeys || []);
  const rows = ASSESSMENT_V2_LAUNCH_PILOT_PREMIUM_BANK.rows
    .filter((row) => row.gameId === gameId && Number(row.grade) === grade)
    .filter((row) => !seen.has(row.round.questionKey));

  return {
    rounds: rows.map((row) => ({
      ...row.round,
      targetGrade: grade,
      controlledLaunchPilot: true,
      controlledLaunchVersion: CONTROLLED_LIVE_BETA_VERSION,
      controlledLaunchSlotId: row.slotId,
      controlledLaunchCurriculumReferenceId: row.curriculumReferenceId,
      controlledLaunchPriority: 100,
      sourceLabel: `${row.round.sourceLabel || 'Zihin Arenası Premium Bankası'} · Kontrollü Canlı Beta`,
      premiumQuestion: true,
      premiumTier: row.round.premiumTier || 'GOLD',
      publicationStatus: 'CONTROLLED_BETA_ENGINEERING_APPROVED',
      formalCurriculumCertification: false,
      studentTelemetryRequired: true
    })),
    audit: {
      version: CONTROLLED_LIVE_BETA_VERSION,
      gameId,
      grade,
      eligibleCount: rows.length,
      formalCurriculumCertification: false,
      sourcePolicy: 'PHASE5H_30_ENGINEERING_VERIFIED_WITH_PRODUCT_OWNER_VISUAL_REVIEW'
    }
  };
}
