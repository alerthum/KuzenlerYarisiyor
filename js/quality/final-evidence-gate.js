// Aşama 14 — Final kanıt yeterlilik kapısı.
// Metin olarak "23x500" yazmak kanıt değildir; FINAL_EVIDENCE_INDEX.json sayaçları zorunludur.

export const FINAL_EVIDENCE_TARGETS = Object.freeze({
  sessionsPerGame: 500,
  activeGames: 23,
  solverSamples: 50_000,
  optionSamples: 10_000,
  mutationScorePercent: 90,
  fullE2ERequired: true,
  childMindStructuredBandsRequired: true
});

export function evaluateFinalEvidence(index = {}) {
  const actual = index.actual || {};
  const targets = { ...FINAL_EVIDENCE_TARGETS, ...(index.targets || {}) };
  const gaps = [];

  const minSessions = Number(actual.minSessionsPerGame ?? 0);
  if (minSessions < targets.sessionsPerGame) {
    gaps.push(`sessions:${minSessions}/${targets.sessionsPerGame}`);
  }
  const gamesOk = Number(actual.gamesMeetingSessionTarget ?? 0);
  if (gamesOk < targets.activeGames) {
    gaps.push(`games_with_500:${gamesOk}/${targets.activeGames}`);
  }
  const solver = Number(actual.solverSamples ?? 0);
  if (solver < targets.solverSamples) gaps.push(`solver:${solver}/${targets.solverSamples}`);
  const options = Number(actual.optionSamples ?? 0);
  if (options < targets.optionSamples) gaps.push(`options:${options}/${targets.optionSamples}`);
  const mutation = Number(actual.mutationScorePercent ?? 0);
  if (mutation < targets.mutationScorePercent) {
    gaps.push(`mutation:${mutation}/${targets.mutationScorePercent}`);
  }
  if (actual.fullE2E !== true) gaps.push('full_e2e_missing');
  if (actual.childMindStructuredBands !== true) gaps.push('child_mind_structured_bands_missing');
  if (Number(actual.underfillCount ?? 0) > 0) gaps.push(`underfill:${actual.underfillCount}`);
  if (Number(actual.sessionSemanticRepeatCount ?? 0) > 0) {
    gaps.push(`semantic_repeat:${actual.sessionSemanticRepeatCount}`);
  }

  const adequate = gaps.length === 0;
  return {
    adequate,
    finalEvidenceAdequacy: adequate ? 'PASS' : 'FAIL',
    gaps,
    targets,
    actual: {
      minSessionsPerGame: minSessions,
      gamesMeetingSessionTarget: gamesOk,
      solverSamples: solver,
      optionSamples: options,
      mutationScorePercent: mutation,
      fullE2E: actual.fullE2E === true,
      childMindStructuredBands: actual.childMindStructuredBands === true,
      underfillCount: Number(actual.underfillCount ?? 0),
      sessionSemanticRepeatCount: Number(actual.sessionSemanticRepeatCount ?? 0),
      e2eSmokeOnly: Number(actual.e2eSmokeOnly ?? 0)
    }
  };
}

export function assertEvidenceAllowsPass(index = {}) {
  const verdict = evaluateFinalEvidence(index);
  if (!verdict.adequate) {
    return {
      ok: false,
      decision: 'FAIL',
      autoReturnToStage14: true,
      reason: 'final_evidence_inadequate',
      gaps: verdict.gaps,
      verdict
    };
  }
  return { ok: true, decision: 'PASS', autoReturnToStage14: false, gaps: [], verdict };
}
