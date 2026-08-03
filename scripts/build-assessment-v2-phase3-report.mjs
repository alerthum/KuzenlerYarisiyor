import fs from 'node:fs';
import path from 'node:path';
import { ALL_PHASE3_READING_MODELS, PHASE3_READING_IDEAS } from '../js/assessment-v2/reading-model-catalog.js';
import { materializeItemModel } from '../js/assessment-v2/materialize.js';
import { evaluateV2Publication } from '../js/assessment-v2/publication-gate.js';
import { auditReadingSurfaceModels } from '../js/assessment-v2/reading-surface-quality.js';

const TARGET_MODEL_COUNT = 12;
const items = ALL_PHASE3_READING_MODELS.map(model => {
  const item = materializeItemModel(model, {});
  const gate = evaluateV2Publication(item, { gameId: model.compatibleGameIds[0] });
  return {
    id: model.id,
    constructId: model.construct.id,
    knowledgeComponents: model.construct.knowledgeComponents,
    deepFeatures: model.deepFeatures,
    answer: item.answerText,
    misconceptions: item.distractors.map(distractor => ({
      id: distractor.misconceptionId,
      text: distractor.text,
      feedback: distractor.feedback
    })),
    hintCount: item.hints.length,
    solutionStepCount: item.solution.length,
    structuralId: item.structuralId,
    cognitiveExperienceId: item.cognitiveExperienceId,
    gate
  };
});

const surfaceAudit = auditReadingSurfaceModels(ALL_PHASE3_READING_MODELS);
const remainingModelCount = Math.max(0, TARGET_MODEL_COUNT - items.length);
const allCurrentModelsPass = items.every(item => item.gate.ok) && surfaceAudit.ok;
const report = {
  schemaVersion: '2.0',
  generatedAt: new Date().toISOString(),
  phase: remainingModelCount === 0 && allCurrentModelsPass ? 'PHASE_3R_NATURAL_SURFACE_ENGINEERING_PASS' : 'PHASE_3R_REMEDIATION_IN_PROGRESS',
  productReady: false,
  targetModelCount: TARGET_MODEL_COUNT,
  currentModelCount: items.length,
  remainingModelCount,
  allCurrentModelsPass,
  automatedAcceptance: remainingModelCount === 0 && allCurrentModelsPass ? 'PASS' : 'IN_PROGRESS',
  independentEvidenceVerifier: 'PASS_FOR_MATERIALIZED_MODELS',
  previousHumanReviewDisposition: 'REJECTED_AI_TEMPLATE_FAILURE',
  surfaceQualityGate: surfaceAudit.ok ? 'PASS' : 'FAIL',
  surfaceQualityMetrics: surfaceAudit.metrics,
  surfaceQualityErrors: surfaceAudit.errors,
  optionFormat: 'FIVE_CHOICES_FOUR_DISTINCT_DISTRACTOR_PATHS',
  humanSampleStatus: 'NOT_MEASURED',
  firstHumanReviewStatus: remainingModelCount === 0 && allCurrentModelsPass ? 'READY' : 'NOT_READY',
  reviewPack: remainingModelCount === 0 && allCurrentModelsPass ? 'quality-reports/assessment-engine-v2-phase3-first-review.html' : null,
  legacyContentPolicy: 'UNVERIFIED_LEGACY',
  coveredIdeas: PHASE3_READING_IDEAS,
  items,
  nextAction: remainingModelCount === 0
    ? 'Run the replacement human visual review on the natural-surface pack; keep productReady=false until measured.'
    : `Add ${remainingModelCount} remaining solver-backed reading model(s).`
};
const out = path.join(process.cwd(), 'quality-reports', 'assessment-engine-v2-phase-3-progress.json');
fs.writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
console.log(`assessment-v2 phase3: ${items.length}/${TARGET_MODEL_COUNT} models; pass=${allCurrentModelsPass}; file=${out}`);
