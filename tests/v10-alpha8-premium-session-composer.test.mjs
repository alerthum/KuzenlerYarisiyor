import test from 'node:test';
import assert from 'node:assert/strict';
import { composePremiumSession } from '../js/engines/premium-session-composer-v10.js';
import { createGameSession } from '../js/games/registry.js';

const round = (key, pattern, difficulty, extra = {}) => ({
  questionKey: key,
  prompt: key,
  thinkingPatternId: pattern,
  difficulty,
  ...extra
});

test('premium besteci GOLD açılış ve güçlü kapanış oluşturur', () => {
  const result = composePremiumSession([
    round('normal-1', 'pattern-a', 3),
    round('gold-1', 'pattern-b', 4, { premiumTier: 'GOLD' }),
    round('hard-1', 'pattern-c', 5),
    round('normal-2', 'pattern-a', 3)
  ], { targetCount: 4, firstExperience: true });

  assert.equal(result.rounds[0].questionKey, 'gold-1');
  assert.equal(result.rounds.at(-1).questionKey, 'hard-1');
  assert.equal(result.audit.openingIsGold, true);
  assert.equal(result.audit.balanced, true);
});

test('premium besteci sessiz telafiyi oturumun dörtte biriyle sınırlar', () => {
  const result = composePremiumSession([
    round('a', 'a', 3),
    round('r1', 'r', 3, { adaptivePlacement: true }),
    round('r2', 'r', 3, { adaptivePlacement: true }),
    round('b', 'b', 4),
    round('c', 'c', 5)
  ], { targetCount: 4, remediationShare: 0.25 });

  assert.ok(result.audit.remediationCount <= 1);
});

test('gerçek oturum premium besteci denetimi taşır', () => {
  const profile = { id: 'alpha8-student', age: 13, grade: 8, skillRating: 4 };
  const session = createGameSession('paragraph-detective', profile, 8080, { completedSessionCount: 0 });
  assert.ok(session.globalQualityAudit.premiumComposition);
  assert.equal(session.globalQualityAudit.premiumComposition.openingIsGold, true);
});
