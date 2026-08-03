import { grade8TurkishOutcomeByCode } from '../curriculum/outcomes/tr-g8-turkce-2019.js';

export const GRADE8_TURKISH_NEXT_WAVE_CONTRACT = Object.freeze({
  id: 'GRADE8_TURKISH_PILOT_02_LITERARY_LANGUAGE',
  purpose: '8. sınıf Türkçe havuzunu bilgi ve veri metinlerine sıkışmadan söz varlığı, edebî dil ve anlatım çeşitliliğiyle genişletmek',
  requiredOutcomeCodes: Object.freeze(['T.8.3.6', 'T.8.3.7', 'T.8.3.11', 'T.8.3.21', 'T.8.3.26']),
  requiredStimulusFamilies: Object.freeze([
    'benzetme-ve-karsilastirma',
    'kisilestirme-ve-konusturma',
    'deyim-atasozu-ozdeyis',
    'anlatim-bicimleri',
    'yazar-gorusu-ve-edebi-elestiri',
    'kisa-oyku-ve-anlatici',
    'deneme-ve-kose-yazisi',
    'siirsel-soyleyis'
  ]),
  quotationPolicy: Object.freeze({
    fabricatedAttributionForbidden: true,
    allowedSources: Object.freeze(['PUBLIC_DOMAIN', 'LICENSED', 'USER_PROVIDED', 'OFFICIAL_EXCERPT_WITH_CITATION']),
    maximumQuotedWordsPerSource: 25,
    requireAuthorAndWorkMetadata: true,
    fallbackWhenRightsUnknown: 'ORIGINAL_UNATTRIBUTED_AUTHOR_VIEW'
  }),
  diversityMinimums: Object.freeze({
    itemCount: 20,
    literaryOrPersonalStimulusCount: 10,
    figurativeLanguageItemCount: 4,
    authorViewOrQuotationItemCount: 4,
    narrativeItemCount: 3,
    informationalDataItemMaximum: 4
  }),
  releaseRules: Object.freeze({
    humanReviewRequired: true,
    gameAdaptationAllowedBeforeHumanReview: false,
    blindOptionAuditRequired: true,
    allOptionFeedbackRequired: true
  })
});

export function auditGrade8TurkishNextWaveContract(contract = GRADE8_TURKISH_NEXT_WAVE_CONTRACT) {
  const errors = [];
  const outcomes = contract.requiredOutcomeCodes.map(code => grade8TurkishOutcomeByCode(code));
  outcomes.forEach((outcome, index) => {
    if (!outcome) errors.push(`missing-outcome:${contract.requiredOutcomeCodes[index]}`);
  });
  if (!contract.requiredStimulusFamilies.includes('benzetme-ve-karsilastirma')) errors.push('missing-simile-family');
  if (!contract.requiredStimulusFamilies.includes('kisilestirme-ve-konusturma')) errors.push('missing-personification-family');
  if (!contract.requiredStimulusFamilies.includes('yazar-gorusu-ve-edebi-elestiri')) errors.push('missing-author-view-family');
  if (contract.quotationPolicy.fabricatedAttributionForbidden !== true) errors.push('fabricated-attribution-not-blocked');
  if (contract.releaseRules.gameAdaptationAllowedBeforeHumanReview !== false) errors.push('game-adaptation-not-locked');
  return Object.freeze({
    ok: errors.length === 0,
    errors: Object.freeze(errors),
    outcomes: Object.freeze(outcomes.map(outcome => outcome && Object.freeze({ code: outcome.code, text: outcome.text })))
  });
}
