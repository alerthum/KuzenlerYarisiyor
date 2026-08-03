function safeIndex(value) {
  const index = Number(value);
  return Number.isInteger(index) && index >= 0 ? index : null;
}

export function diagnoseV11ChoiceResponse(round = {}, selectedIndex = null, timedOut = false) {
  const index = safeIndex(selectedIndex);
  const option = index === null ? null : round.optionDiagnostics?.[index] || null;
  const base = {
    schemaVersion: '11.0',
    skeletonId: round.skeletonId || round.v11Identity?.skeletonId || null,
    skeletonFamilyId: round.skeletonFamilyId || round.v11Identity?.skeletonFamilyId || null,
    selectedOptionIndex: index,
    selectedOptionText: index === null ? null : String(round.options?.[index] ?? option?.optionText ?? ''),
    responseStatus: timedOut ? 'TIMED_OUT' : index === null ? 'NO_SELECTION' : option?.isCorrect ? 'CORRECT' : 'INCORRECT'
  };

  if (timedOut || index === null || !option || option.isCorrect) {
    return {
      ...base,
      misconceptionId: null,
      misconception: null,
      diagnosticStatus: timedOut ? 'NO_RESPONSE_DIAGNOSIS' : option?.isCorrect ? 'CORRECT_RESPONSE' : 'DIAGNOSIS_UNAVAILABLE'
    };
  }

  return {
    ...base,
    misconceptionId: option.misconceptionId || null,
    misconception: option.misconception || null,
    diagnosticStatus: option.misconceptionId ? 'MISCONCEPTION_CAPTURED' : 'DIAGNOSIS_UNAVAILABLE'
  };
}

function emptyProfile(profileId) {
  return {
    schemaVersion: '11.0',
    profileId,
    totalDiagnosedErrors: 0,
    byMisconception: {},
    bySkeleton: {},
    lastUpdatedAt: null
  };
}

export function updateV11MisconceptionProfile(state, attempt) {
  if (!state || !attempt?.profileId || !attempt?.misconceptionId || attempt.correct) return null;
  state.misconceptionProfiles ||= {};
  const profile = state.misconceptionProfiles[attempt.profileId] || emptyProfile(attempt.profileId);
  const at = attempt.answeredAt || attempt.createdAt || new Date().toISOString();
  const misconceptionId = attempt.misconceptionId;
  const skeletonId = attempt.skeletonId || 'UNKNOWN';

  const misconception = profile.byMisconception[misconceptionId] || {
    misconceptionId,
    misconception: attempt.misconception || '',
    skeletonId,
    count: 0,
    firstSeenAt: at,
    lastSeenAt: at,
    questionFamilyIds: []
  };
  misconception.count += 1;
  misconception.lastSeenAt = at;
  misconception.misconception ||= attempt.misconception || '';
  misconception.skeletonId ||= skeletonId;
  if (attempt.questionFamilyId && !misconception.questionFamilyIds.includes(attempt.questionFamilyId)) {
    misconception.questionFamilyIds.push(attempt.questionFamilyId);
  }
  profile.byMisconception[misconceptionId] = misconception;

  const skeleton = profile.bySkeleton[skeletonId] || { skeletonId, errorCount: 0, misconceptionIds: [], lastSeenAt: at };
  skeleton.errorCount += 1;
  skeleton.lastSeenAt = at;
  if (!skeleton.misconceptionIds.includes(misconceptionId)) skeleton.misconceptionIds.push(misconceptionId);
  profile.bySkeleton[skeletonId] = skeleton;

  profile.totalDiagnosedErrors += 1;
  profile.lastUpdatedAt = at;
  state.misconceptionProfiles[attempt.profileId] = profile;
  return profile;
}

export function getV11MisconceptionProfile(state, profileId) {
  return state?.misconceptionProfiles?.[profileId] || emptyProfile(profileId);
}
