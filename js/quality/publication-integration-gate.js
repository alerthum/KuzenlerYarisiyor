// Aşama 12 — Tüm oyunlar ortak yayın kapılarından geçer; legacy random yayın yolu yok.

export const STAGE12_ACTIVE_GAMES = Object.freeze([
  'pattern-lab', 'speed-math', 'target-number', 'geometry-lab', 'problem-hunter', 'error-detective',
  'logic-station', 'olympiad-ladder', 'word-mine', 'word-ladder', 'forbidden-story', 'meaning-hunt',
  'paragraph-detective', 'english-vocabulary', 'english-cloze', 'english-sentence-builder',
  'social-time-travel', 'social-map-skills', 'social-citizenship', 'religion-practice',
  'lgs-foundation', 'science-lab', 'science-reasoning'
]);

export function auditPublicationIntegration(session, gameId) {
  const rounds = session?.rounds || [];
  const errors = [];
  if (!STAGE12_ACTIVE_GAMES.includes(gameId)) errors.push('game_not_in_stage12_set');
  for (const round of rounds) {
    if (!round.familyId) errors.push(`missing_family:${round.questionKey || '?'}`);
    if (!round.skeletonId) errors.push(`missing_skeleton:${round.questionKey || '?'}`);
    if (!round.reasoningPathId) errors.push(`missing_reasoning:${round.questionKey || '?'}`);
    if (!round.questionContract) errors.push(`missing_contract:${round.questionKey || '?'}`);
    if (!round.cognitiveDepthEvidence) errors.push(`missing_depth:${round.questionKey || '?'}`);
    if (round.kind === 'choice' && !round.optionQuality?.ok && round.optionQuality?.skipped !== true) {
      errors.push(`option_gate_fail:${round.questionKey || '?'}`);
    }
    if (round.independentSolver && round.independentSolver.ok === false) {
      errors.push(`solver_fail:${round.questionKey || '?'}`);
    }
    // Legacy doğrudan random yayın yolu işareti
    if (round.source === 'legacy-random' || round.legacyDirectPublish === true) {
      errors.push(`legacy_direct_publish:${round.questionKey || '?'}`);
    }
  }
  return {
    ok: errors.length === 0 && rounds.length > 0,
    errors,
    roundCount: rounds.length,
    sharedComposer: Boolean(session?.globalQualityAudit?.premiumComposition)
  };
}

export function scorePublicationIntegration(results = []) {
  const failed = results.filter((r) => !r.ok);
  return {
    totalGames: results.length,
    failedGames: failed.map((r) => r.gameId),
    meetsStageGate: failed.length === 0 && results.length >= 23
  };
}
