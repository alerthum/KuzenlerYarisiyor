export const IMMEDIATE_QUARANTINE_REASONS = new Set(['question_invalid','answer_invalid','duplicate','wording']);

export function shouldImmediatelyQuarantine(reason) {
  return IMMEDIATE_QUARANTINE_REASONS.has(String(reason || ''));
}

export function questionFamilyFromPayload(payload = {}) {
  return payload.questionFamilyId || payload.familyId || (payload.gameId && payload.topicId ? `${payload.gameId}:${payload.topicId}:${payload.kind || 'choice'}` : payload.gameId || 'unknown-family');
}

export function buildQuarantineRecords(payload = {}, actorId = 'student') {
  if (!shouldImmediatelyQuarantine(payload.reason)) return { question:null, family:null };
  const now = new Date().toISOString();
  const familyId = questionFamilyFromPayload(payload);
  return {
    question: payload.questionKey ? {
      id: payload.questionKey,
      questionKey: payload.questionKey,
      questionFamilyId: familyId,
      status: 'temporary-blocked',
      reason: payload.reason,
      sourceReportId: payload.id || null,
      blockedBy: actorId,
      blockedAt: now
    } : null,
    family: familyId ? {
      id: familyId,
      questionFamilyId: familyId,
      status: 'temporary-blocked',
      reason: payload.reason,
      sourceReportId: payload.id || null,
      blockedBy: actorId,
      blockedAt: now
    } : null
  };
}

export function isRoundQuarantined(round = {}, blockedKeys = new Set(), blockedFamilies = new Set()) {
  return blockedKeys.has(round.questionKey) || blockedFamilies.has(round.questionFamilyId || round.familyId);
}
