import { generatePremiumExpansionRoundsB } from '../content/premium-expansion-bank-b.js';

/**
 * 6–7. sınıf Matematik güvenli çekirdeği.
 *
 * Banka; oran, olasılık, yüzde, cebirsel model, geometri, ortalama ve hız
 * problemlerinden oluşan 10 insan-yazımı Premium Expansion B maddesini sabit
 * seed ile materialize eder. Soru anahtarları 6 ve 7. sınıf hücrelerinde
 * açık whitelist ile paylaşılır; eski aile/jeneratör yolu hiçbir zaman
 * tamamlayıcı içerik olarak kullanılmaz.
 */

const generated = generatePremiumExpansionRoundsB('problem-hunter', {
  grade: 6,
  count: 100,
  seed: 6706
});

if (generated.rounds.length !== 10) {
  throw new Error(`trusted-grade67-core:problem-hunter:expected-10-got-${generated.rounds.length}`);
}

export const TRUSTED_GRADE67_MATH_ROUNDS = Object.freeze(
  generated.rounds.map((round) => Object.freeze({
    ...round,
    trustedAuthoredGrade67Core: true,
    sourceLabel: `${round.sourceLabel} · 6–7. Sınıf Matematik Güvenli Çekirdek`
  }))
);

export const TRUSTED_GRADE67_MATH_KEYS = Object.freeze(
  TRUSTED_GRADE67_MATH_ROUNDS.map((round) => round.questionKey)
);
