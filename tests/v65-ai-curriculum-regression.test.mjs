import test from 'node:test';
import assert from 'node:assert/strict';
import { AI_AGENT_CATALOG, buildLearnerModel, createProactivePlan, reviewQuestionReport } from '../js/ai/orchestrator.js';
import { automaticExamPlans, subjectsForGrade } from '../js/curriculum/meb-curriculum.js';
import { passesQualityGate, selectDiverseQuestions } from '../js/engines/smart-learning-engine-v65.js';

test('AI orkestrasında en az on uzman ajan tanımlıdır', () => {
  assert.ok(AI_AGENT_CATALOG.length >= 10);
  assert.equal(new Set(AI_AGENT_CATALOG.map((agent) => agent.id)).size, AI_AGENT_CATALOG.length);
});

test('sınav planları sınıfa göre otomatik atanır', () => {
  assert.deepEqual(automaticExamPlans(8), ['LGS']);
  assert.deepEqual(automaticExamPlans(11), ['YKS']);
  assert.deepEqual(automaticExamPlans(12), ['YKS', 'KPSS']);
});

test('12. sınıf ders omurgası TYT AYT ve KPSS içerir', () => {
  const subjects = subjectsForGrade(12);
  assert.ok(subjects.includes('TYT'));
  assert.ok(subjects.includes('AYT'));
  assert.ok(subjects.includes('KPSS'));
});

test('lise öğrencisine tek adımlı aşırı kolay cebir sorusu geçmez', () => {
  const result = passesQualityGate({ prompt: '2x + 5 = 34, x kaçtır?', options: ['7', '9', '12', '14'] }, { grade: 12 });
  assert.equal(result.ok, false);
});

test('aynı soru aynı oturumda tekrar seçilmez', () => {
  const question = { prompt: 'Bir tabloyu yorumlayarak iki koşulu birlikte sağlayan seçeneği bulun.', options: ['A', 'B', 'C', 'D'], explanation: 'Tablodaki iki sütun birlikte karşılaştırılır.', family: 'table' };
  const first = passesQualityGate(question, { grade: 8 }, new Set());
  assert.equal(first.ok, true);
  const second = passesQualityGate(question, { grade: 8 }, new Set([first.signature]));
  assert.equal(second.ok, false);
});

test('çeşit motoru tek aileyi oturuma doldurmaz', () => {
  const candidates = Array.from({ length: 10 }, (_, index) => ({
    questionKey: `q${index}`,
    prompt: `Tablo ve koşulları yorumlayarak ${index}. çıkarımı belirleyin. Verilen iki bilgiyi karşılaştırın.`,
    context: 'Bir deney tablosunda iki değişken birlikte verilmiştir.',
    options: ['A', 'B', 'C', 'D'],
    explanation: 'İki değişken birlikte değerlendirilir ve sonuç çıkarılır.',
    family: index < 7 ? 'same' : `family-${index}`
  }));
  const selected = selectDiverseQuestions(candidates, { grade: 8 }, 6);
  assert.ok(selected.filter((item) => item.family === 'same').length <= 2);
});

test('öğrenci modeli ve günlük rota veri yokken de çalışır', () => {
  const profile = { id: 'p1', name: 'Deniz', grade: 8, age: 13, examPlans: [] };
  const model = buildLearnerModel(profile, []);
  assert.deepEqual(model.examPlans, ['LGS']);
  const plan = createProactivePlan(profile, []);
  assert.ok(plan.plan.length >= 2);
});

test('soru denetçisi tekrar sinyalini karantina önerisine dönüştürür', () => {
  const report = { questionKey: 'x', reason: 'duplicate', studentAnswer: 'A', correctAnswer: 'B' };
  const result = reviewQuestionReport(report, [report, { questionKey: 'x' }]);
  assert.match(result.verdict, /tekrar/);
  assert.match(result.recommendation, /karantinaya/);
});
