import test from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { GAME_CATALOG, createGameSession, isGameAvailableForProfile } from '../../js/games/registry.js';
import { validateQuestionContract } from '../../js/quality/question-contract-v11.js';

const profiles = [
  { id: 'pbt-9', age: 9, grade: 4, skills: {} },
  { id: 'pbt-13', age: 13, grade: 8, skills: {} },
  { id: 'pbt-17', age: 17, grade: 12, skills: {} }
];

test('property: her üretilebilir tur sözleşmeye uyar, tek cevap taşır ve NaN üretmez', async () => {
  await fc.assert(fc.asyncProperty(fc.integer({ min: 1, max: 2_000_000_000 }), async (seed) => {
    for (const profile of profiles) {
      for (const game of GAME_CATALOG) {
        if (!isGameAvailableForProfile(game, profile)) continue;
        let session;
        try { session = createGameSession(game.id, profile, seed); } catch { continue; }
        assert.ok(session.rounds.length > 0, `${game.id}/${profile.grade}: boş oturum`);
        for (const round of session.rounds) {
          const contract = validateQuestionContract(round);
          assert.ok(contract.ok, `${game.id}: ${contract.errors.join(',')}`);
          assert.equal(JSON.stringify(round).includes('NaN'), false, `${game.id}: NaN üretildi`);
          if (round.kind === 'choice') {
            assert.ok(Array.isArray(round.options), `${game.id}: options dizi değil`);
            assert.equal(round.options.length, 4, `${game.id}: seçenek sayısı 4 değil`);
            assert.equal(new Set(round.options.map(String)).size, 4, `${game.id}: yinelenen seçenek`);
            assert.ok(Number.isInteger(round.answerIndex) && round.answerIndex >= 0 && round.answerIndex < 4, `${game.id}: cevap indeksi geçersiz`);
          }
        }
      }
    }
  }), { numRuns: 25, endOnFailure: true });
});

test('property: aynı seed deterministik questionKey dizisi üretir', () => {
  fc.assert(fc.property(fc.integer({ min: 1, max: 1_000_000_000 }), (seed) => {
    const profile = profiles[1];
    for (const game of GAME_CATALOG.filter((g) => isGameAvailableForProfile(g, profile))) {
      let a; let b;
      try {
        a = createGameSession(game.id, profile, seed);
        b = createGameSession(game.id, profile, seed);
      } catch { continue; }
      assert.deepEqual(a.rounds.map((r) => r.questionKey), b.rounds.map((r) => r.questionKey), game.id);
    }
  }), { numRuns: 20 });
});
