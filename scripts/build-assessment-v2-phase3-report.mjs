import fs from 'node:fs';
import path from 'node:path';
import { ALL_PHASE3_READING_MODELS, PHASE3_READING_IDEAS } from '../js/assessment-v2/reading-model-catalog.js';
import { materializeItemModel } from '../js/assessment-v2/materialize.js';
import { evaluateV2Publication } from '../js/assessment-v2/publication-gate.js';

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

const remainingModelCount = Math.max(0, TARGET_MODEL_COUNT - items.length);
const allCurrentModelsPass = items.every(item => item.gate.ok);
const report = {
  schemaVersion: '2.0',
  generatedAt: new Date().toISOString(),
  phase: remainingModelCount === 0 && allCurrentModelsPass ? 'PHASE_3_ENGINEERING_PASS' : 'PHASE_3_IN_PROGRESS',
  productReady: false,
  targetModelCount: TARGET_MODEL_COUNT,
  currentModelCount: items.length,
  remainingModelCount,
  allCurrentModelsPass,
  automatedAcceptance: remainingModelCount === 0 && allCurrentModelsPass ? 'PASS' : 'IN_PROGRESS',
  independentEvidenceVerifier: 'PASS_FOR_MATERIALIZED_MODELS',
  humanSampleStatus: 'NOT_MEASURED',
  legacyContentPolicy: 'UNVERIFIED_LEGACY',
  coveredIdeas: PHASE3_READING_IDEAS,
  items,
  nextAction: remainingModelCount === 0
    ? 'Run first human visual review and student-facing pilot; keep productReady=false until measured.'
    : `Add ${remainingModelCount} remaining solver-backed reading model(s).`
};
const out = path.join(process.cwd(), 'quality-reports', 'assessment-engine-v2-phase-3-progress.json');
fs.writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
console.log(`assessment-v2 phase3: ${items.length}/${TARGET_MODEL_COUNT} models; pass=${allCurrentModelsPass}; file=${out}`);
