import fs from 'node:fs';
import path from 'node:path';
import { ASSESSMENT_V2_MODELS, assessmentV2Inventory } from '../js/assessment-v2/registry.js';
import { materializeItemModel } from '../js/assessment-v2/materialize.js';
import { evaluateV2Publication } from '../js/assessment-v2/publication-gate.js';

const root = process.cwd();
const samples = ASSESSMENT_V2_MODELS.map((model) => {
  const item = materializeItemModel(model, {});
  const gameId = model.compatibleGameIds[0];
  const gate = evaluateV2Publication(item, { gameId });
  return {
    itemModelId: model.id,
    domain: model.domain,
    constructId: model.construct.id,
    knowledgeComponents: model.construct.knowledgeComponents,
    compatibleGameIds: model.compatibleGameIds,
    structuralId: item.structuralId,
    cognitiveExperienceId: item.cognitiveExperienceId,
    correctAnswer: item.answerText,
    misconceptionIds: item.distractors.map(d => d.misconceptionId),
    hintCount: item.hints.length,
    solutionStepCount: item.solution.length,
    publicationGate: gate
  };
});
const report = {
  schemaVersion: '2.0',
  generatedAt: new Date().toISOString(),
  status: samples.every(s => s.publicationGate.ok) ? 'PHASE_1_PASS' : 'FAIL',
  productReady: false,
  scope: 'Assessment Engine V2 contracts and three cross-domain proof models',
  inventory: assessmentV2Inventory(),
  samples,
  nextPhase: 'Mathematics/Olympiad domain engine with 12 distinct problem ideas'
};
const out = path.join(root, 'quality-reports', 'assessment-engine-v2-phase-1.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`assessment-v2 report: ${report.status}; models=${samples.length}; file=${out}`);
