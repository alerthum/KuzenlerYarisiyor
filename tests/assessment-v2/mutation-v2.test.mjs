import test from 'node:test';
import assert from 'node:assert/strict';
import { defineItemModel } from '../../js/assessment-v2/contracts.js';
import { materializeItemModel } from '../../js/assessment-v2/materialize.js';
import { pigeonholeModel, logicConstraintModel } from '../../js/assessment-v2/pilots.js';
import { enumerateValidOrders, classifyOrderingClaim } from '../../js/assessment-v2/logic-solver.js';

test('bilinen 6 renk/5 hedef hatası doğru cevabı 21 yapamaz', () => {
  const item = materializeItemModel(pigeonholeModel, { categories: 6, target: 5 });
  assert.equal(item.answer, 25);
  assert.notEqual(item.answer, 21);
  assert.equal(item.distractors.some(d => d.value === 21 && d.misconceptionId === 'use-target-as-category-count'), true);
});

test('kısıt çözücü mümkün ve zorunlu yargıyı ayırır', () => {
  const task = logicConstraintModel.generateTask({});
  const orders = enumerateValidOrders(task.people, task.constraints);
  assert.ok(orders.length > 1);
  assert.equal(classifyOrderingClaim(orders, ['A', '<', 'C']), 'necessary');
  assert.equal(classifyOrderingClaim(orders, ['B', '<', 'D']), 'possible');
  assert.equal(classifyOrderingClaim(orders, ['C', '<', 'B']), 'impossible');
});

test('üretici ve doğrulayıcı aynı yanlış cevaba zorlanırsa model oluşturma aşamasında yakalanır', () => {
  const bad = defineItemModel({
    id: 'mutated-arithmetic', domain: 'mathematics',
    construct: { id: 'mutated', gradeRange: [8, 8], subjectId: 'mathematics', curriculumOutcomeIds: ['signed-subtraction'], knowledgeComponents: ['integer-sign'], claim: 'İşaretli çıkarma yapar.' },
    deepFeatures: ['signed-subtraction'], compatibleGameIds: ['olympiad-ladder'],
    solutionGraph: { steps: [
      { id: 's1', action: 'çıkarma işlemini kur', dependsOn: [], evidence: '47−74 işlemi kurulur.', hint: 'Büyük mutlak değerin hangi sayıda olduğunu kontrol et.' },
      { id: 's2', action: 'sonucun işaretini belirle', dependsOn: ['s1'], evidence: '74 daha büyük olduğu için sonuç negatiftir.', hint: '47’den daha büyük bir sayı çıkarıldığında sonuç hangi işaretli olur?' }
    ]},
    misconceptions: [
      { id: 'drop-sign', description: 'Negatif işareti atar.', buggyRule: 'absolute-difference', feedback: 'Mutlak fark 27 olsa da işlem sonucu negatiftir.', apply: () => 27 },
      { id: 'add-values', description: 'Çıkarma yerine toplar.', buggyRule: 'addition', feedback: 'İşlem çıkarma işlemidir.', apply: () => 121 },
      { id: 'reverse-subtraction', description: 'İşlemin sırasını ters çevirir.', buggyRule: 'reverse-operands', feedback: '74−47 değil 47−74 hesaplanmalıdır.', apply: () => 27 }
    ],
    generateTask: () => ({ a: 47, b: 74 }),
    solve: () => 27,
    verify: (t, v) => Number(v) === t.a - t.b,
    render: () => ({ context: '', prompt: '47−74 kaçtır?', formatOption: String })
  });
  assert.throws(() => materializeItemModel(bad), /solver_verification_failed/);
});
