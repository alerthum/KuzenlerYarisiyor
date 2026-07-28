import test from 'node:test';
import assert from 'node:assert/strict';
import { ENGLISH_WORDS } from '../js/content-v2.js';
import { WORD_LADDER_PATHS_V3, englishExamplePair } from '../js/content-v3.js';
import { createOlympiadRound } from '../js/engines/math-engine.js';
import { isOneLetterChange, validateLadder } from '../js/engines/word-engine.js';
import { GAME_CATALOG, CONTENT_COUNTS, createGameSession } from '../js/games/registry.js';
import { createInitialState, recordAttempt, reportQuestion, seenQuestionKeysForProfile } from '../js/state.js';

function localStorageMock() {
  const memory = new Map();
  return {
    getItem: (key) => memory.get(key) || null,
    setItem: (key, value) => memory.set(key, value),
    removeItem: (key) => memory.delete(key)
  };
}

test('KASA → KARA → PARA → PARE alternatif merdiveni doğru kabul edilir', () => {
  const dictionary = ['kasa', 'kara', 'para', 'pare', 'kare'];
  const result = validateLadder('KASA', ['KARA', 'PARA'], 'PARE', dictionary);
  assert.equal(result.valid, true);
});

test('V3 kelime merdiveni havuzu 3, 4, 5 ve 6 harfli geçerli yollar içerir', () => {
  const valid = WORD_LADDER_PATHS_V3.filter((path) => path.length >= 3 && path.every((word) => word.length === path[0].length) && path.slice(0, -1).every((word, index) => isOneLetterChange(word, path[index + 1])));
  const lengths = new Set(valid.map((path) => path[0].length));
  assert.deepEqual([...lengths].sort(), [3, 4, 5, 6]);
  assert.ok(CONTENT_COUNTS.wordLadderPathsV3 >= 150);
});

test('her İngilizce kelimenin gösterilebilir İngilizce örneği ve Türkçe karşılığı vardır', () => {
  for (const word of ENGLISH_WORDS) {
    const pair = englishExamplePair(word);
    assert.ok(pair.english.length > 8, word.word);
    assert.ok(pair.turkish.length > 8, word.word);
    assert.ok(pair.turkish.toLocaleLowerCase('tr-TR').includes(word.meaning.toLocaleLowerCase('tr-TR')) || pair.original, word.word);
  }
});

test('İngilizce boşluk ve cümle kurma oyunları onar soru üretir', () => {
  const profile = { id: 'english-test', age: 13, skills: {} };
  for (const gameId of ['english-cloze', 'english-sentence-builder']) {
    const session = createGameSession(gameId, profile, 71827);
    assert.equal(session.rounds.length, 10);
    assert.equal(new Set(session.rounds.map((round) => round.questionKey)).size, 10);
    for (const round of session.rounds) assert.ok(round.explanation.includes('Türkçesi:'));
  }
});

test('Sosyal Bilgiler üç ayrı oyun olarak iki yaş seviyesinde çalışır', () => {
  const ids = ['social-time-travel', 'social-map-skills', 'social-citizenship'];
  for (const age of [9, 13]) {
    for (const id of ids) {
      const session = createGameSession(id, { id: `social-${age}`, age, skills: {} }, age * 811);
      assert.equal(session.rounds.length, 10, `${id}/${age}`);
    }
  }
});

test('Din ve LGS alanları büyük kuzen için on soru üretir ve ödül dışıdır', () => {
  const profile = { id: 'lgs-test', age: 13, skills: {} };
  for (const gameId of ['religion-practice', 'lgs-foundation']) {
    const session = createGameSession(gameId, profile, 9881);
    assert.equal(session.rounds.length, 10);
    assert.equal(session.rewardEligible, false);
    for (const round of session.rounds) {
      assert.equal(round.detailedOptions.length, round.options.length);
    }
  }
});

test('ödül dışı bir cevap XP ve yıldız kazandırmaz', () => {
  globalThis.localStorage = localStorageMock();
  const state = createInitialState(null);
  const profile = state.profiles.find((item) => item.id === 'buyuk-kuzen');
  const xp = profile.xp;
  const stars = profile.stars;
  const result = recordAttempt(state, {
    profileId: profile.id,
    gameId: 'lgs-foundation',
    questionKey: 'lgs-foundation:test',
    skill: 'lgsFamiliarity',
    correct: true,
    difficulty: 4,
    hintsUsed: 0,
    elapsedSeconds: 60,
    score: 100,
    rewardEligible: false
  });
  assert.equal(result.xp, 0);
  assert.equal(profile.xp, xp);
  assert.equal(profile.stars, stars);
});

test('soru bildirimi soruyu aynı profil için hemen engeller ve cevapları saklar', () => {
  globalThis.localStorage = localStorageMock();
  const state = createInitialState(null);
  const report = reportQuestion(state, {
    profileId: 'kucuk-kuzen',
    profileName: 'Küçük Kuzen',
    gameId: 'word-ladder',
    gameTitle: 'Kelime Merdiveni',
    questionKey: 'word-ladder:kasa:pare:2',
    prompt: 'KASA’dan PARE’ye ulaş.',
    userAnswer: 'KASA → KARA → PARA → PARE',
    canonicalAnswer: 'KASA → KARA → KARE → PARE',
    reason: 'ambiguous',
    note: 'Alternatif yol doğru.'
  });
  assert.equal(report.status, 'pending');
  assert.equal(report.userAnswer.includes('PARA'), true);
  assert.equal(seenQuestionKeysForProfile(state, 'kucuk-kuzen').has(report.questionKey), true);
});

test('olimpiyat motoru farklı soru stilleri ve soru tipine göre süre üretir', () => {
  for (const age of [9, 13]) {
    const types = new Set();
    const limits = new Set();
    for (let seed = 1; seed <= 500; seed += 1) {
      const round = createOlympiadRound(age, seed * 17);
      types.add(round.kind || round.visual?.type || round.prompt.split(' ')[0]);
      limits.add(round.timeLimit);
      assert.ok(round.timeLimit >= 80);
      assert.equal(new Set(round.options).size, 4);
      assert.ok(round.options.includes(String(round.answerValue)));
    }
    assert.ok(types.size >= 5, `${age} yaş tip sayısı`);
    assert.ok(limits.size >= 4, `${age} yaş süre çeşitliliği`);
  }
});

test('oyun kataloğu genişletilmiş dersleri içerir', () => {
  const categories = new Set(GAME_CATALOG.map((game) => game.category));
  for (const category of ['turkish','math','english','science','social','logic','olympiad','religion','lgs']) assert.ok(categories.has(category));
  assert.equal(GAME_CATALOG.find((game) => game.id === 'olympiad-ladder').sessionLength, 10);
});
