import { grade8TurkishOutcomeByCode } from '../curriculum/outcomes/tr-g8-turkce-2019.js';
import {
  GRADE8_TURKISH_FULL_SCOPE_MATRIX,
  GRADE8_TURKISH_PILOT02_CALIBRATION_CODES,
  auditGrade8TurkishFullScopeMatrix
} from './turkish-g8-full-scope-matrix.js';

const ALL_OUTCOME_CODES = Object.freeze(GRADE8_TURKISH_FULL_SCOPE_MATRIX.map(row => row.outcomeCode));

export const GRADE8_TURKISH_NEXT_WAVE_CONTRACT = Object.freeze({
  id: 'GRADE8_TURKISH_FULL_SCOPE_ROLLOUT',
  purpose: '8. sınıf Türkçenin 76 resmî kazanımını kendi doğasına uygun ölçme biçimleriyle eksiksiz kapsamak; güncel kalibrasyon grubu bu bütünün yalnız ilk uygulama dilimidir',
  requiredOutcomeCodes: ALL_OUTCOME_CODES,
  currentCalibrationOutcomeCodes: GRADE8_TURKISH_PILOT02_CALIBRATION_CODES,
  fullScopeOutcomeCount: 76,
  assessmentModePolicy: Object.freeze({
    forceAllOutcomesIntoMultipleChoice: false,
    performanceOutcomesRequireRubric: true,
    listeningOutcomesRequireAudioOrVideo: true,
    speakingOutcomesRequirePerformanceEvidence: true,
    writingOutcomesRequireConstructedProduct: true
  }),
  requiredStimulusFamilies: Object.freeze([
    'benzetme-ve-karsilastirma',
    'kisilestirme-ve-konusturma',
    'deyim-atasozu-ozdeyis',
    'anlatim-bicimleri',
    'yazar-gorusu-ve-edebi-elestiri',
    'kisa-oyku-ve-anlatici',
    'deneme-ve-kose-yazisi',
    'siirsel-soyleyis',
    'dinleme-ve-izleme',
    'konusma-performansi',
    'yazma-ve-duzenleme',
    'gorsel-medya-ve-veri'
  ]),
  quotationPolicy: Object.freeze({
    fabricatedAttributionForbidden: true,
    allowedSources: Object.freeze(['PUBLIC_DOMAIN', 'LICENSED', 'USER_PROVIDED', 'OFFICIAL_EXCERPT_WITH_CITATION']),
    maximumQuotedWordsPerSource: 25,
    requireAuthorAndWorkMetadata: true,
    fallbackWhenRightsUnknown: 'ORIGINAL_UNATTRIBUTED_AUTHOR_VIEW'
  }),
  currentCalibrationMinimums: Object.freeze({
    itemCount: 5,
    outcomeCount: 5,
    literaryOrPersonalStimulusCount: 4,
    figurativeLanguageItemCount: 2,
    authorViewOrQuotationItemCount: 1,
    narrativeItemCount: 2,
    informationalDataItemMaximum: 1
  }),
  releaseRules: Object.freeze({
    humanReviewRequired: true,
    gameAdaptationAllowedBeforeHumanReview: false,
    blindOptionAuditRequired: true,
    allOptionFeedbackRequired: true,
    fullScopeGapMustBeZeroBeforeCourseCompletion: true
  })
});

export function auditGrade8TurkishNextWaveContract(contract = GRADE8_TURKISH_NEXT_WAVE_CONTRACT) {
  const errors = [];
  const matrixAudit = auditGrade8TurkishFullScopeMatrix();
  if (!matrixAudit.ok) errors.push(...matrixAudit.errors.map(error => `matrix:${error}`));
  if (contract.requiredOutcomeCodes.length !== 76) errors.push(`full-scope-outcome-count:${contract.requiredOutcomeCodes.length}`);
  if (new Set(contract.requiredOutcomeCodes).size !== 76) errors.push('full-scope-outcome-duplicates');
  contract.requiredOutcomeCodes.forEach(code => {
    if (!grade8TurkishOutcomeByCode(code)) errors.push(`missing-outcome:${code}`);
  });
  if (contract.currentCalibrationOutcomeCodes.length !== 5) errors.push(`calibration-outcome-count:${contract.currentCalibrationOutcomeCodes.length}`);
  contract.currentCalibrationOutcomeCodes.forEach(code => {
    if (!contract.requiredOutcomeCodes.includes(code)) errors.push(`calibration-outside-full-scope:${code}`);
  });
  if (contract.assessmentModePolicy.forceAllOutcomesIntoMultipleChoice !== false) errors.push('all-outcomes-forced-into-multiple-choice');
  if (contract.assessmentModePolicy.performanceOutcomesRequireRubric !== true) errors.push('performance-rubric-not-required');
  if (!contract.requiredStimulusFamilies.includes('benzetme-ve-karsilastirma')) errors.push('missing-simile-family');
  if (!contract.requiredStimulusFamilies.includes('dinleme-ve-izleme')) errors.push('missing-listening-family');
  if (!contract.requiredStimulusFamilies.includes('konusma-performansi')) errors.push('missing-speaking-family');
  if (!contract.requiredStimulusFamilies.includes('yazma-ve-duzenleme')) errors.push('missing-writing-family');
  if (contract.quotationPolicy.fabricatedAttributionForbidden !== true) errors.push('fabricated-attribution-not-blocked');
  if (contract.releaseRules.gameAdaptationAllowedBeforeHumanReview !== false) errors.push('game-adaptation-not-locked');
  if (contract.releaseRules.fullScopeGapMustBeZeroBeforeCourseCompletion !== true) errors.push('course-completion-gap-gate-missing');
  return Object.freeze({
    ok: errors.length === 0,
    errors: Object.freeze(errors),
    metrics: Object.freeze({
      fullScopeOutcomeCount: contract.requiredOutcomeCodes.length,
      currentCalibrationOutcomeCount: contract.currentCalibrationOutcomeCodes.length,
      currentImplementedOutcomeCount: matrixAudit.metrics.implementedOutcomeCount,
      currentUncoveredOutcomeCount: matrixAudit.metrics.uncoveredOutcomeCount,
      productReady: false
    })
  });
}
