import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSemanticIdentity,
  findSessionSemanticRepeats,
  scoreSemanticRepeatAudit
} from '../js/quality/semantic-repeat-engine.js';
import { createGameSession, GAME_CATALOG, isGameAvailableForProfile } from '../js/games/registry.js';

test('sayı/isim değişimi aynı solutionShape ailesinde yakalanır', () => {
  const a = buildSemanticIdentity({
    familyId: 'lgs-ratio-proportion',
    skeletonId: 'lgs-ratio-proportion:select-valid',
    reasoningPathId: 'lgs-ratio-proportion:select-valid#raw-letters',
    kind: 'choice',
    explanation: 'Birim=4; ikinci=12.',
    prompt: 'Ali oranı 2:3, birinci 8. İkinci kaç?',
    questionKey: 'k1'
  });
  const b = buildSemanticIdentity({
    familyId: 'lgs-ratio-proportion',
    skeletonId: 'lgs-ratio-proportion:select-valid',
    reasoningPathId: 'lgs-ratio-proportion:select-valid#raw-letters',
    kind: 'choice',
    explanation: 'Birim=4; ikinci=12.',
    prompt: 'Ayşe oranı 2:3, birinci 8. İkinci kaç?',
    questionKey: 'k2'
  });
  assert.equal(a.solutionShape, b.solutionShape);
  assert.equal(a.semanticFingerprint, b.semanticFingerprint);
  assert.notEqual(a.surfaceFingerprint, b.surfaceFingerprint);
});

test('oturum içi tekrar denetçisi aynı fingerprint çiftini bulur', () => {
  const rounds = [
    {
      familyId: 'f1', skeletonId: 'f1:s', reasoningPathId: 'f1:s#p',
      explanation: 'A→B', prompt: '1', questionKey: 'a', kind: 'choice'
    },
    {
      familyId: 'f1', skeletonId: 'f1:s', reasoningPathId: 'f1:s#p',
      explanation: 'A→B', prompt: '999', questionKey: 'b', kind: 'choice'
    }
  ];
  const repeats = findSessionSemanticRepeats(rounds);
  assert.ok(repeats.length >= 1);
});

test('CANLI: 60 oturumda semantik tekrar 0 ve kimlik alanları dolu', () => {
  const games = [
    'pattern-lab', 'speed-math', 'logic-station', 'meaning-hunt',
    'social-citizenship', 'science-lab', 'lgs-foundation', 'english-vocabulary'
  ];
  const sessions = [];
  let seed = 80808;
  for (let i = 0; i < 60; i += 1) {
    const gameId = games[i % games.length];
    const game = GAME_CATALOG.find((g) => g.id === gameId);
    const grade = gameId === 'lgs-foundation' ? 8 : 6;
    const profile = { id: `s08-${i}`, age: Math.max(game.minAge || 8, 12), grade, skills: {} };
    if (!isGameAvailableForProfile(game, profile)) continue;
    const session = createGameSession(gameId, profile, seed, { completedSessionCount: 1 + (i % 5) });
    seed += 19;
    sessions.push(session);
  }
  assert.ok(sessions.length >= 50);
  const audit = scoreSemanticRepeatAudit(sessions);
  assert.equal(audit.sessionSemanticRepeatCount, 0, `tekrar=${audit.sessionSemanticRepeatCount}`);
  assert.equal(audit.missingIdentity, 0, `eksik kimlik=${audit.missingIdentity}`);
  assert.equal(audit.meetsStageGate, true);
});
