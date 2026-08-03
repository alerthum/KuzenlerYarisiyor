import test from 'node:test';
import assert from 'node:assert/strict';
import { materializeItemModel } from '../../js/assessment-v2/materialize.js';
import { evaluateV2Publication } from '../../js/assessment-v2/publication-gate.js';
import { PHASE2_MATH_MODELS, latticePathViaCheckpointModel, modularDigitModel, twoThreeCompositionModel, twoSetUnionModel } from '../../js/assessment-v2/math-models.js';

test('dört matematik item modeli alan çözücüsü ve üç farklı buggy rule ile doğrulanır',()=>{
  for(const model of PHASE2_MATH_MODELS){
    const item=materializeItemModel(model,{});
    assert.equal(item.solverProof.verified,true,model.id);
    assert.equal(item.distractors.length,3,model.id);
    assert.equal(new Set(item.distractors.map(d=>d.misconceptionId)).size,3,model.id);
    assert.equal(evaluateV2Publication(item,{gameId:model.compatibleGameIds[0]}).ok,true,model.id);
  }
});

test('ızgara yol modeli C(6,3) gösterimini açıklamasız bırakmaz ve sonucu 700 bulur',()=>{
  const item=materializeItemModel(latticePathViaCheckpointModel,{r1:3,u1:3,r2:4,u2:3});
  assert.equal(item.answer,700);
  assert.equal(item.solution.length,3);
  assert.match(item.solution[0].explanation,/kombinasyon/);
  assert.equal(item.hints[0].includes('C('),false);
});

test('modüler basamak modeli 4A3B örneğini sistematik taramayla çözer',()=>{
  const item=materializeItemModel(modularDigitModel,{mod:36,rem:19});
  assert.equal(Number.isInteger(item.answer),true);
  assert.ok(item.answer>0);
});

test('2 ve 3 tüketim modeli sıralı planları sırasız çözümlerden ayırır',()=>{
  const item=materializeItemModel(twoThreeCompositionModel,{total:20});
  const unordered=item.distractors.find(d=>d.misconceptionId==='unordered-count');
  assert.ok(item.answer>unordered.value);
});

test('iki küme modeli 16+9−4 işleminin nedenini çözüm grafında açıklar',()=>{
  const item=materializeItemModel(twoSetUnionModel,{aTotal:16,bTotal:9,onlyA:12,onlyB:5});
  assert.equal(item.answer,21);
  assert.match(item.solution[2].explanation,/iki kez/);
});
