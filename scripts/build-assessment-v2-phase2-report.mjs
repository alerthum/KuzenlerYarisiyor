import fs from 'node:fs';
import path from 'node:path';
import { pigeonholeModel } from '../js/assessment-v2/pilots.js';
import { ALL_PHASE2_MATH_MODELS, PHASE2_MATH_IDEAS } from '../js/assessment-v2/math-model-catalog.js';
import { materializeItemModel } from '../js/assessment-v2/materialize.js';
import { evaluateV2Publication } from '../js/assessment-v2/publication-gate.js';

const TARGET_MODEL_COUNT = 12;
const models = [pigeonholeModel, ...ALL_PHASE2_MATH_MODELS];
const items = models.map(model => {
  const item = materializeItemModel(model, {});
  const gate = evaluateV2Publication(item, { gameId: model.compatibleGameIds[0] });
  return {
    id: model.id,
    constructId: model.construct.id,
    knowledgeComponents: model.construct.knowledgeComponents,
    deepFeatures: model.deepFeatures,
    answer: item.answerText,
    misconceptions: item.distractors.map(d => ({
      id: d.misconceptionId,
      value: d.text,
      feedback: d.feedback
    })),
    hintCount: item.hints.length,
    solutionStepCount: item.solution.length,
    gate
  };
});

const remainingModelCount = Math.max(0, TARGET_MODEL_COUNT - items.length);
const allCurrentModelsPass = items.every(item => item.gate.ok);
const report = {
  schemaVersion: '2.0',
  generatedAt: new Date().toISOString(),
  phase: remainingModelCount === 0 && allCurrentModelsPass ? 'PHASE_2_PASS' : 'PHASE_2_IN_PROGRESS',
  productReady: false,
  targetModelCount: TARGET_MODEL_COUNT,
  currentModelCount: items.length,
  remainingModelCount,
  allCurrentModelsPass,
  legacyContentPolicy: 'UNVERIFIED_LEGACY',
  coveredIdeas: ['worst-case/pigeonhole', ...PHASE2_MATH_IDEAS],
  items,
  nextAction: remainingModelCount === 0
    ? 'Lock Phase 2 and continue to Phase 3 without changing productReady=false.'
    : `Add ${remainingModelCount} remaining solver-backed mathematics/olympiad model(s).`
};
const out = path.join(process.cwd(), 'quality-reports', 'assessment-engine-v2-phase-2-progress.json');
fs.writeFileSync(out, `${JSON.stringify(report, null, 2)}
`);
console.log(`assessment-v2 phase2: ${items.length}/${TARGET_MODEL_COUNT} models; pass=${report.allCurrentModelsPass}; file=${out}`);
