import { generatePremiumExpansionRoundsJ } from '../content/premium-expansion-bank-j.js';

/**
 * 5. sınıf Zekâ İstasyonu güvenli çekirdeği.
 *
 * Kod seçenekleri veya serbest metin jenerasyonu kullanılmaz. Her tur; açık
 * öncüller, dört anlamlı seçenek, tek doğrulanmış yanıt ve üç ayrı kavram
 * yanılgısı ile insan tarafından yazılmış Premium Expansion J maddesidir.
 */

const generated = generatePremiumExpansionRoundsJ('logic-station', {
  grade: 5,
  count: 100,
  seed: 5505
});

if (generated.rounds.length !== 10) {
  throw new Error(`trusted-grade5-logic:expected-10-got-${generated.rounds.length}`);
}

export const TRUSTED_GRADE5_LOGIC_ROUNDS = Object.freeze(
  generated.rounds.map((round) => Object.freeze({
    ...round,
    targetGrade: 5,
    trustedAuthoredGrade5Logic: true,
    sourceLabel: `${round.sourceLabel} · 5. Sınıf Zekâ Güvenli Çekirdek`
  }))
);

export const TRUSTED_GRADE5_LOGIC_KEYS = Object.freeze(
  TRUSTED_GRADE5_LOGIC_ROUNDS.map((round) => round.questionKey)
);
