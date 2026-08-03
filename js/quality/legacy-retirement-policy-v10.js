const DEFAULT_POLICY = Object.freeze({
  minimumScore: 72,
  maximumBlockedRatio: 0.25,
  minimumSamples: 3,
  retirementAfterFailures: 2
});

export function evaluateLegacyFamilyRetirement({ familyId, samples = [], policy = DEFAULT_POLICY } = {}) {
  const valid = samples.filter((x) => x && !x.error && !x.skipped);
  const generated = valid.reduce((sum, x) => sum + Number(x.generated || 0), 0);
  const blocked = valid.reduce((sum, x) => sum + Number(x.blocked || 0), 0);
  const average = valid.length
    ? Math.round(valid.reduce((sum, x) => sum + Number(x.average || 0), 0) / valid.length)
    : 0;
  const incompleteCount = valid.filter((x) => x.complete === false).length;
  const blockedRatio = generated > 0 ? blocked / generated : 0;
  const failures = Number(average < policy.minimumScore) + Number(blockedRatio >= policy.maximumBlockedRatio) + Number(incompleteCount > 0);
  const enoughEvidence = valid.length >= policy.minimumSamples;
  const status = enoughEvidence && failures >= policy.retirementAfterFailures ? 'RETIRED' : failures > 0 ? 'WATCH' : 'ACTIVE';
  return Object.freeze({ familyId: familyId || 'unknown', status, enoughEvidence, sampleCount: valid.length, average, generated, blocked, blockedRatio, incompleteCount, failures, policy });
}

export function buildRetirementRegistry(rows = [], familyResolver = (row) => row.familyId || row.gameId) {
  const groups = new Map();
  for (const row of rows) {
    const familyId = familyResolver(row);
    if (!groups.has(familyId)) groups.set(familyId, []);
    groups.get(familyId).push(row);
  }
  return Object.fromEntries([...groups.entries()].map(([familyId, samples]) => [familyId, evaluateLegacyFamilyRetirement({ familyId, samples })]));
}

export { DEFAULT_POLICY as LEGACY_RETIREMENT_POLICY };
