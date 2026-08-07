import { generatePremiumExpansionRoundsI } from '../content/premium-expansion-bank-i.js';

/**
 * 5. sınıf ana ders çekirdeği.
 *
 * Paket; insan yazımı, 4/5 zorlukta, üç ayrı kavram yanılgısı taşıyan
 * Premium Expansion I maddelerinden sabit seed ile materialize edilir.
 * Her soru yine trusted-live-policy questionKey whitelist'ine açıkça girer.
 */

const GAME_IDS = Object.freeze([
  'paragraph-detective',
  'science-reasoning',
  'error-detective'
]);

function roundsFor(gameId) {
  const generated = generatePremiumExpansionRoundsI(gameId, {
    grade: 5,
    count: 100,
    seed: 505
  });
  if (generated.rounds.length !== 10) {
    throw new Error(`trusted-grade5-core:${gameId}:expected-10-got-${generated.rounds.length}`);
  }
  return generated.rounds.map((round) => Object.freeze({
    ...round,
    targetGrade: 5,
    trustedAuthoredGrade5Core: true,
    sourceLabel: `${round.sourceLabel} · 5. Sınıf Güvenli Çekirdek`
  }));
}

export const TRUSTED_GRADE5_CORE_ROUNDS_BY_GAME = Object.freeze(
  Object.fromEntries(GAME_IDS.map((gameId) => [gameId, Object.freeze(roundsFor(gameId))]))
);

export const TRUSTED_GRADE5_CORE_ROUNDS = Object.freeze(
  GAME_IDS.flatMap((gameId) => TRUSTED_GRADE5_CORE_ROUNDS_BY_GAME[gameId])
);

export const TRUSTED_GRADE5_CORE_KEYS_BY_GAME = Object.freeze(
  Object.fromEntries(GAME_IDS.map((gameId) => [
    gameId,
    Object.freeze(TRUSTED_GRADE5_CORE_ROUNDS_BY_GAME[gameId].map((round) => round.questionKey))
  ]))
);

export const TRUSTED_GRADE5_CORE_GAME_IDS = GAME_IDS;
