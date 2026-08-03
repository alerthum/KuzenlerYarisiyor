import { pigeonholeModel, readingEvidenceModel, logicConstraintModel } from './pilots.js';
import { PHASE2_MATH_MODELS } from './math-models.js';

export const ASSESSMENT_V2_MODELS = Object.freeze([
  pigeonholeModel,
  readingEvidenceModel,
  logicConstraintModel,
  ...PHASE2_MATH_MODELS
]);

export function assessmentV2Inventory() {
  const byDomain = {};
  for (const model of ASSESSMENT_V2_MODELS) byDomain[model.domain] = (byDomain[model.domain] || 0) + 1;
  return Object.freeze({
    schemaVersion: '2.0',
    modelCount: ASSESSMENT_V2_MODELS.length,
    domains: Object.freeze(byDomain),
    verifiedPremiumPolicy: 'ONLY_ASSESSMENT_V2_MODELS',
    legacyContentPolicy: 'UNVERIFIED_LEGACY'
  });
}
