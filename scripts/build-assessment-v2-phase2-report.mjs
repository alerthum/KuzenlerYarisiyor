import fs from 'node:fs';
import path from 'node:path';
import { pigeonholeModel } from '../js/assessment-v2/pilots.js';
import { PHASE2_MATH_MODELS } from '../js/assessment-v2/math-models.js';
import { materializeItemModel } from '../js/assessment-v2/materialize.js';
import { evaluateV2Publication } from '../js/assessment-v2/publication-gate.js';

const models=[pigeonholeModel,...PHASE2_MATH_MODELS];
const items=models.map(model=>{
 const item=materializeItemModel(model,{});
 const gate=evaluateV2Publication(item,{gameId:model.compatibleGameIds[0]});
 return {id:model.id,constructId:model.construct.id,knowledgeComponents:model.construct.knowledgeComponents,deepFeatures:model.deepFeatures,answer:item.answerText,misconceptions:item.distractors.map(d=>({id:d.misconceptionId,value:d.text,feedback:d.feedback})),hintCount:item.hints.length,solutionStepCount:item.solution.length,gate};
});
const report={schemaVersion:'2.0',generatedAt:new Date().toISOString(),phase:'PHASE_2_IN_PROGRESS',productReady:false,targetModelCount:12,currentModelCount:items.length,remainingModelCount:Math.max(0,12-items.length),allCurrentModelsPass:items.every(x=>x.gate.ok),coveredIdeas:['worst-case/pigeonhole','two-stage lattice path counting','modular digit enumeration','ordered compositions/recurrence','two-set inclusion-exclusion'],items,nextAction:'Add seven distinct models: invariant, parity/coloring, extremal, divisor structure, geometry transformation, game strategy, inequality.'};
const out=path.join(process.cwd(),'quality-reports','assessment-engine-v2-phase-2-progress.json');
fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
console.log(`assessment-v2 phase2: ${items.length}/12 models; pass=${report.allCurrentModelsPass}; file=${out}`);
