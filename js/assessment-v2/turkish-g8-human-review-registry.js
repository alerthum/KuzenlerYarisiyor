import { GRADE8_TURKISH_PILOT02_CALIBRATION_IDS } from './turkish-g8-pilot02-calibration.js';

const REVIEWED_AT = '2026-08-03T13:46:45+03:00';

export const GRADE8_TURKISH_HUMAN_REVIEW_DECISIONS = Object.freeze(
  GRADE8_TURKISH_PILOT02_CALIBRATION_IDS.map(questionId => Object.freeze({
    questionId,
    batchId: 'GRADE8_TURKISH_PILOT_02_CALIBRATION_5',
    decision: 'APPROVED_FOR_NEXT_WAVE',
    reviewedAt: REVIEWED_AT,
    reviewerType: 'USER_HUMAN_REVIEW',
    gameAdaptationAllowed: false,
    note: 'Soru grubu genel kalite yönü açısından kabul edildi; tam Türkçe kapsamı tamamlanmadan oyun adaptasyonu açılmayacak.'
  }))
);

export function auditGrade8TurkishHumanReviewRegistry(rows = GRADE8_TURKISH_HUMAN_REVIEW_DECISIONS) {
  const errors = [];
  const ids = rows.map(row => row.questionId);
  if (rows.length !== 5) errors.push(`review-count:${rows.length}`);
  if (new Set(ids).size !== rows.length) errors.push('duplicate-review-question');
  for (const id of GRADE8_TURKISH_PILOT02_CALIBRATION_IDS) if (!ids.includes(id)) errors.push(`missing-review:${id}`);
  for (const row of rows) {
    if (row.decision !== 'APPROVED_FOR_NEXT_WAVE') errors.push(`invalid-decision:${row.questionId}`);
    if (row.gameAdaptationAllowed !== false) errors.push(`game-adaptation-open:${row.questionId}`);
  }
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors), metrics: Object.freeze({ approvedQuestionCount: rows.length, gameAdaptationAllowed: false }) });
}
