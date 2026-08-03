import test from 'node:test';
import assert from 'node:assert/strict';
import { createProactivePlan } from '../js/ai/orchestrator.js';
import { passesQualityGate } from '../js/engines/smart-learning-engine-v65.js';
import { createGameSession } from '../js/games/registry.js';

const profile = { id:'p1', name:'Ahmet', age:13, grade:8, skills:{ logic:20, math:20, language:20, attention:20 }, examPlans:['LGS'] };

test('ilk kullanım mesajları eksiklik değil meydan okuma dili kullanır', () => {
  const plan = createProactivePlan(profile, []);
  const text = JSON.stringify(plan).toLocaleLowerCase('tr-TR');
  assert.equal(text.includes('yeterli veri'), false);
  assert.equal(text.includes('veri bekliyor'), false);
  assert.match(text, /meydan okuma|orta-üstü|zor/);
});

test('kolay soru kalite kapısından geçmez', () => {
  const result = passesQualityGate({ prompt:'2x + 5 = 34, x kaçtır?', options:['12','13','14','15'], difficulty:2 }, { grade:12 }, new Set());
  assert.equal(result.ok, false);
});

test('oyun oturumları en az orta-üstü zorlukta başlar', () => {
  const session = createGameSession('logic-station', profile, 123456, { seenQuestionKeys: new Set() });
  assert.ok(session.difficulty >= 3);
  assert.ok(session.rounds.every((round) => Number(round.difficulty || 3) >= 3));
});
