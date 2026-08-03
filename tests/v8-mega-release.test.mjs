import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { categoryFiltersForProfile, categoryLabel } from '../js/catalog/labels.js';
import { GAME_CATALOG } from '../js/games/registry.js';
import { socialSnapshot, leagueForXp } from '../js/social/league-engine.js';
import { runAiOrchestra } from '../js/ai/orchestrator.js';

test('8, 11 ve 12. sınıf sınav kategorileri doğru ayrılır', () => {
  assert.ok(categoryFiltersForProfile({ grade: 8 }).some(([id]) => id === 'lgs'));
  assert.ok(!categoryFiltersForProfile({ grade: 12 }).some(([id]) => id === 'lgs'));
  assert.ok(categoryFiltersForProfile({ grade: 11 }).some(([id]) => id === 'tyt'));
  assert.ok(categoryFiltersForProfile({ grade: 12 }).some(([id]) => id === 'kpss'));
});

test('katalogdaki her kategori güvenli Türkçe etikete sahiptir', () => {
  for (const game of GAME_CATALOG) assert.notEqual(categoryLabel(game.category), 'Diğer', `${game.id} kategorisi eksik`);
});

test('lig motoru haftalık XP, lig ve rozet üretir', () => {
  const now = new Date();
  const attempts = Array.from({ length: 12 }, (_, i) => ({ createdAt: now.toISOString(), date: now.toISOString().slice(0,10), xp: 40, correct: i % 3 !== 0, hintsUsed: 0, gameId: `g${i%8}` }));
  const snapshot = socialSnapshot({ streak: 7 }, attempts);
  assert.equal(snapshot.weeklyXp, 480);
  assert.equal(leagueForXp(snapshot.weeklyXp).id, 'silver');
  assert.ok(snapshot.badges.length >= 2);
});

test('AI orkestrası yerel sağlayıcıyla öğrenciyi analiz eder', () => {
  const result = runAiOrchestra({ id:'p', name:'Ada', grade:8, age:13, examPlans:['LGS'] }, [], { aiProvider:'local' });
  assert.equal(result.provider.localDecisionEngine, true);
  assert.ok(result.agents.length >= 10);
  assert.ok(result.proactive.plan.length >= 2);
});

test('öğrenci arayüzünde lig ekranı ve teknik metin güvenliği vardır', () => {
  const app = fs.readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
  assert.match(app, /function renderSocial/);
  assert.match(app, /categoryLabel\(game\.category\)/);
  assert.doesNotMatch(app, /CATEGORY_LABELS\[game\.category\]/);
});

test('Firestore sosyal ve AI koleksiyonlarını rol bazlı korur', () => {
  const rules = fs.readFileSync(new URL('../firebase/firestore.rules', import.meta.url), 'utf8');
  assert.match(rules, /match \/clubs\/\{clubId\}/);
  assert.match(rules, /match \/seasons\/\{seasonId\}/);
  assert.match(rules, /match \/familyLeagues\/\{leagueId\}/);
  assert.match(rules, /match \/aiInsights\/\{insightId\}/);
});
