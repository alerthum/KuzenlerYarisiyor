import { buildGrade8TurkishReadingLanguageWave1Questions } from './turkish-g8-reading-language-wave1.js';
import { canonicalChoiceItemToTrustedRound } from './trusted-canonical-item-adapter.js';

/**
 * 8. sınıf ana dersleri için ikinci güvenli canlı dalga.
 *
 * Maddeler mevcut Assessment Engineering V2 kanonik kaynaklarından tek tek
 * seçilmiş, bağımsız doğrulayıcıları kontrol edilmiş ve son-ekran insan
 * incelemesine alınmıştır. Bu dosya serbest soru üretmez.
 */

const TURKISH_PARAGRAPH_IDS = Object.freeze([
  'tr-g8-wave1-07-problem-solution-library',
  'tr-g8-wave1-09-emphasis-design',
  'tr-g8-wave1-10-thought-development',
  'tr-g8-wave1-12-source-selection-heat-island'
]);

const TURKISH_MEANING_IDS = Object.freeze([
  'tr-g8-wave1-02-expression-disorder-revision',
  'tr-g8-wave1-03-verbal-function',
  'tr-g8-wave1-04-transition-functions'
]);

const SCIENCE_IDS = Object.freeze([]);

const MATH_IDS = Object.freeze([]);

function select(items, ids, label) {
  const byId = new Map(items.map((item) => [item.id, item]));
  return ids.map((id) => {
    const item = byId.get(id);
    if (!item) throw new Error(`${label}:missing-canonical-item:${id}`);
    return item;
  });
}

const turkishItems = buildGrade8TurkishReadingLanguageWave1Questions();
const scienceItems = [];
const mathItems = [];

export const TRUSTED_G8_PARAGRAPH_WAVE2_ROUNDS = Object.freeze(
  select(turkishItems, TURKISH_PARAGRAPH_IDS, 'trusted-g8-turkish-paragraph-wave2')
    .map((item) => canonicalChoiceItemToTrustedRound(item, {
      gameId: 'paragraph-detective',
      subjectId: 'turkish',
      sourceLabel: 'Assessment Engineering V2 · 8. Sınıf Türkçe Paragraf Güvenli Dalga 2'
    }))
);

export const TRUSTED_G8_MEANING_WAVE2_ROUNDS = Object.freeze(
  select(turkishItems, TURKISH_MEANING_IDS, 'trusted-g8-turkish-meaning-wave2')
    .map((item) => canonicalChoiceItemToTrustedRound(item, {
      gameId: 'meaning-hunt',
      subjectId: 'turkish',
      sourceLabel: 'Assessment Engineering V2 · 8. Sınıf Türkçe Dil ve Anlam Güvenli Dalga 2'
    }))
);

export const TRUSTED_G8_SCIENCE_WAVE2_ROUNDS = Object.freeze(
  select(scienceItems, SCIENCE_IDS, 'trusted-g8-science-wave2')
    .map((item) => canonicalChoiceItemToTrustedRound(item, {
      gameId: 'science-reasoning',
      subjectId: 'science',
      sourceLabel: 'Assessment Engineering V2 · 8. Sınıf Fen Güvenli Dalga 2'
    }))
);

export const TRUSTED_G8_MATH_WAVE2_ROUNDS = Object.freeze(
  select(mathItems, MATH_IDS, 'trusted-g8-math-wave2')
    .map((item) => canonicalChoiceItemToTrustedRound(item, {
      gameId: 'problem-hunter',
      subjectId: 'mathematics',
      sourceLabel: 'Assessment Engineering V2 · 8. Sınıf Matematik Güvenli Dalga 2'
    }))
);

export const TRUSTED_G8_CORE_WAVE2_ROUNDS = Object.freeze([
  ...TRUSTED_G8_PARAGRAPH_WAVE2_ROUNDS,
  ...TRUSTED_G8_MEANING_WAVE2_ROUNDS,
  ...TRUSTED_G8_SCIENCE_WAVE2_ROUNDS,
  ...TRUSTED_G8_MATH_WAVE2_ROUNDS
]);

export const TRUSTED_G8_CORE_WAVE2_KEYS = Object.freeze({
  paragraph: Object.freeze(TRUSTED_G8_PARAGRAPH_WAVE2_ROUNDS.map((round) => round.questionKey)),
  meaning: Object.freeze(TRUSTED_G8_MEANING_WAVE2_ROUNDS.map((round) => round.questionKey)),
  science: Object.freeze(TRUSTED_G8_SCIENCE_WAVE2_ROUNDS.map((round) => round.questionKey)),
  math: Object.freeze(TRUSTED_G8_MATH_WAVE2_ROUNDS.map((round) => round.questionKey))
});

export const TRUSTED_G8_CORE_WAVE2_CANONICAL_IDS = Object.freeze({
  paragraph: TURKISH_PARAGRAPH_IDS,
  meaning: TURKISH_MEANING_IDS,
  science: SCIENCE_IDS,
  math: MATH_IDS
});
