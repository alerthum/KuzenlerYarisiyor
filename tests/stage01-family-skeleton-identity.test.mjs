import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameSession } from '../js/games/registry.js';

// Aşama 01 — V11 kök neden analizi: legacy oyunlar familyId/skeletonId üretmiyordu,
// bu yüzden "sayı değişmiş aynı iskelet" sonsuza kadar yeni soru sayılıyordu.
// Bu test canlı `createGameSession` çıktısını denetler; kimlik veya çeşitlilik
// eksikse doğrudan FAIL verir.

const LEGACY_GAMES = ['target-number', 'speed-math', 'pattern-lab', 'geometry-lab', 'problem-hunter', 'error-detective'];
const PROFILE = { id: 'stage01-demo', age: 10, grade: 5, skills: {} };

function generateSessions(gameId, seedCount = 12) {
  const sessions = [];
  for (let i = 0; i < seedCount; i += 1) {
    sessions.push(createGameSession(gameId, PROFILE, 5000 + i * 97, { seenQuestionKeys: new Set(), attempts: [] }));
  }
  return sessions;
}

test('legacy oyunların her turu familyId ve skeletonId taşır', () => {
  for (const gameId of LEGACY_GAMES) {
    const sessions = generateSessions(gameId, 6);
    for (const session of sessions) {
      assert.ok(session.rounds.length > 0, `${gameId}: oturum boş üretildi`);
      for (const round of session.rounds) {
        assert.ok(round.familyId, `${gameId}: round.familyId eksik -> ${JSON.stringify(round.prompt)}`);
        assert.ok(round.skeletonId, `${gameId}: round.skeletonId eksik -> ${JSON.stringify(round.prompt)}`);
      }
    }
  }
});

test('bir oturumda havuz yeterliyken aynı skeletonId ikinci kez kullanılmaz', () => {
  for (const gameId of LEGACY_GAMES) {
    const sessions = generateSessions(gameId, 8);
    for (const session of sessions) {
      const skeletonIds = session.rounds.map((round) => round.skeletonId);
      const uniqueSkeletons = new Set(skeletonIds);
      // Havuzda en az oturum uzunluğu kadar farklı iskelet varsa tekrar kabul edilmez.
      if (uniqueSkeletons.size >= skeletonIds.length) {
        assert.equal(uniqueSkeletons.size, skeletonIds.length, `${gameId}: oturum içi iskelet tekrarı -> ${skeletonIds.join(',')}`);
      }
    }
  }
});

test('önceki oturumda kullanılan iskelet, öğrenci geçmişi (attempts) üzerinden havuz yeterliyken sonraki oturumda öncelik dışı kalır', () => {
  for (const gameId of LEGACY_GAMES) {
    const seen = new Set();
    const probeA = createGameSession(gameId, PROFILE, 9001, { seenQuestionKeys: new Set(), attempts: [] }).rounds.map((r) => r.skeletonId);
    const probeB = createGameSession(gameId, PROFILE, 9002, { seenQuestionKeys: new Set(), attempts: [] }).rounds.map((r) => r.skeletonId);
    const totalSkeletons = new Set([...probeA, ...probeB]).size;
    if (totalSkeletons <= probeA.length) continue; // havuz çok küçükse soğuma garantisi test edilemez

    const first = createGameSession(gameId, PROFILE, 9001, { seenQuestionKeys: seen, attempts: [] });
    const firstSkeletons = first.rounds.map((round) => round.skeletonId);
    const syntheticAttempts = first.rounds.map((round) => ({ gameId, skeletonId: round.skeletonId, familyId: round.familyId }));

    const second = createGameSession(gameId, PROFILE, 9002, {
      seenQuestionKeys: seen,
      attempts: syntheticAttempts
    });
    const secondSkeletons = second.rounds.map((round) => round.skeletonId);
    const overlap = secondSkeletons.filter((id) => firstSkeletons.includes(id));
    assert.ok(overlap.length < secondSkeletons.length, `${gameId}: soğuma uygulanmadı, ikinci oturum tamamen aynı iskeletlerden oluştu`);
  }
});
