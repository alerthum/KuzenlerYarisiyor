const SEVERE_REPORT_REASONS = new Set([
  'answer-wrong',
  'ambiguous',
  'expression-error',
  'bad-solution',
  'visual-conflict'
]);

const REPEAT_REPORT_REASONS = new Set(['same-question']);

export const QUESTION_HEALTH_POLICY = Object.freeze({
  severeIndependentReporterThreshold: 3,
  duplicateIndependentReporterThreshold: 3,
  tooEasyMinimumAttempts: 40,
  tooEasyAccuracyThreshold: 0.85,
  shortResponseSeconds: Object.freeze({
    choice: 18,
    memory: 18,
    story: 45,
    open: 45,
    interactive: 25,
    default: 22
  })
});

function finiteSeconds(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function distinctReporterCount(reports) {
  return new Set(reports.map((row) => String(row.profileId || row.learnerId || row.reporterId || '')).filter(Boolean)).size;
}

export function analyzeQuestionHealth({ questionKey, reports = [], attempts = [], responseKind = 'default', policy = QUESTION_HEALTH_POLICY } = {}) {
  const matchingReports = reports.filter((row) => row?.questionKey === questionKey && row.status !== 'dismissed');
  const matchingAttempts = attempts.filter((row) => row?.questionKey === questionKey && typeof row.correct === 'boolean');
  const severeReports = matchingReports.filter((row) => SEVERE_REPORT_REASONS.has(String(row.reason || '')));
  const duplicateReports = matchingReports.filter((row) => REPEAT_REPORT_REASONS.has(String(row.reason || '')));
  const severeIndependentReporterCount = distinctReporterCount(severeReports);
  const duplicateIndependentReporterCount = distinctReporterCount(duplicateReports);
  const elapsed = matchingAttempts.map((row) => finiteSeconds(row.elapsedSeconds)).filter((value) => value !== null);
  const correctCount = matchingAttempts.filter((row) => row.correct).length;
  const accuracy = matchingAttempts.length ? correctCount / matchingAttempts.length : null;
  const medianResponseSeconds = median(elapsed);
  const shortThresholdSeconds = Number(policy.shortResponseSeconds?.[responseKind] ?? policy.shortResponseSeconds?.default ?? 22);

  const severeThresholdReached = severeIndependentReporterCount >= policy.severeIndependentReporterThreshold;
  const duplicateThresholdReached = duplicateIndependentReporterCount >= policy.duplicateIndependentReporterThreshold;
  const tooEasyThresholdReached = matchingAttempts.length >= policy.tooEasyMinimumAttempts
    && accuracy >= policy.tooEasyAccuracyThreshold
    && medianResponseSeconds !== null
    && medianResponseSeconds <= shortThresholdSeconds;

  let status = 'HEALTHY';
  let quarantineReason = null;
  if (severeThresholdReached) {
    status = 'AUTO_QUARANTINED_REPORT_THRESHOLD';
    quarantineReason = 'independent-severe-report-threshold';
  } else if (duplicateThresholdReached) {
    status = 'AUTO_QUARANTINED_DUPLICATE_THRESHOLD';
    quarantineReason = 'independent-duplicate-report-threshold';
  } else if (tooEasyThresholdReached) {
    status = 'AUTO_QUARANTINED_TOO_EASY';
    quarantineReason = 'too-easy-behaviour-threshold';
  } else if (severeIndependentReporterCount || duplicateIndependentReporterCount) {
    status = 'WATCH';
  }

  return Object.freeze({
    questionKey,
    status,
    quarantine: Boolean(quarantineReason),
    quarantineReason,
    severeIndependentReporterCount,
    duplicateIndependentReporterCount,
    attemptCount: matchingAttempts.length,
    correctCount,
    accuracy,
    medianResponseSeconds,
    shortThresholdSeconds,
    policyVersion: 'phase5i-v1'
  });
}

export function refreshQuestionHealth(state, questionKey, responseKind = 'default') {
  if (!questionKey) return null;
  state.questionHealth ||= {};
  const previous = state.questionHealth[questionKey] || {};
  const inferredKind = responseKind || previous.responseKind || 'default';
  const result = analyzeQuestionHealth({
    questionKey,
    reports: state.questionReports || [],
    attempts: state.attempts || [],
    responseKind: inferredKind
  });
  const updatedAt = new Date().toISOString();
  state.questionHealth[questionKey] = { ...result, responseKind: inferredKind, updatedAt };
  if (result.quarantine) {
    state.blockedQuestionKeys ||= {};
    state.blockedQuestionKeys.__global ||= {};
    state.blockedQuestionKeys.__global[questionKey] = updatedAt;
  }
  return state.questionHealth[questionKey];
}
