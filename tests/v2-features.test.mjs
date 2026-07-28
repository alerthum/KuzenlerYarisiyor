import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ENGLISH_WORDS,
  EXTRA_FORBIDDEN_STORY_PROMPTS,
  EXTRA_MEANING_QUESTIONS,
  EXTRA_PARAGRAPH_QUESTIONS,
  EXTRA_WORD_LADDERS,
  EXTRA_WORD_MINE_SETS,
  LOGIC_QUESTIONS_V2,
  SCIENCE_QUESTIONS,
  SCIENCE_REASONING_QUESTIONS
} from '../js/content-v2.js';
import { createDailyEnglishWordIds, createDailyMissionIds, DAILY_CORE_CATEGORIES } from '../js/engines/adaptive-engine.js';
import { createLogicRound } from '../js/engines/logic-engine.js';
import {
  createErrorRound,
  createGeometryRound,
  createOlympiadRound,
  createProblemRound,
  evaluateExpression,
  validateTargetExpression
} from '../js/engines/math-engine.js';
import { canBuildWord, isOneLetterChange, validateWordMine } from '../js/engines/word-engine.js';
import { GAME_CATALOG, createGameSession, isGameAvailableForProfile } from '../js/games/registry.js';
import { createInitialState, ensureDailyPlan, recordAttempt, seenQuestionKeysForProfile } from '../js/state.js';

const profiles = [
  { id: 'test-nine', age: 9, grade: 4, skills: {} },
  { id: 'test-thirteen', age: 13, grade: 8, skills: {} }
];

const choiceSets = [
  EXTRA_MEANING_QUESTIONS,
  EXTRA_PARAGRAPH_QUESTIONS,
  LOGIC_QUESTIONS_V2,
  SCIENCE_QUESTIONS,
  SCIENCE_REASONING_QUESTIONS
];

test('V2 çoktan seçmeli içeriklerinin seçenekleri ve cevapları geçerlidir', () => {
  for (const set of choiceSets) {
    for (const question of set) {
      assert.ok(Array.isArray(question.options), question.prompt);
      assert.equal(question.options.length, 4, question.prompt);
      assert.equal(new Set(question.options).size, question.options.length, question.prompt);
      assert.ok(Number.isInteger(question.answer), question.prompt);
      assert.ok(question.answer >= 0 && question.answer < question.options.length, question.prompt);
      assert.ok(question.explanation?.length > 8, question.prompt);
    }
  }
});

test('V2 kelime madeni örnekleri gerçekten ana kelimeden kurulabilir', () => {
  for (const set of EXTRA_WORD_MINE_SETS) {
    for (const word of set.allowed) {
      assert.equal(canBuildWord(set.source, word), true, `${set.source} -> ${word}`);
    }
  }
});

test('V2 kelime merdivenlerinin her adımında tek harf değişir', () => {
  for (const ladder of EXTRA_WORD_LADDERS) {
    const chain = [ladder.start, ...ladder.steps, ladder.end];
    for (let index = 0; index < chain.length - 1; index += 1) {
      assert.equal(isOneLetterChange(chain[index], chain[index + 1]), true, chain.join(' -> '));
    }
  }
});

test('karşılaştırmalar kelimesinden araştırma ve araştırmalar kabul edilir', () => {
  const dictionary = ['araştırma', 'araştırmalar'];
  assert.equal(validateWordMine('karşılaştırmalar', 'araştırma', dictionary, []).valid, true);
  assert.equal(validateWordMine('karşılaştırmalar', 'araştırmalar', dictionary, []).valid, true);
});


test('günlük plan ilk oluşturulduğu hâliyle sabit kalır', () => {
  const memory = new Map();
  globalThis.localStorage = {
    getItem: (key) => memory.get(key) || null,
    setItem: (key, value) => memory.set(key, value),
    removeItem: (key) => memory.delete(key)
  };
  const state = createInitialState(null);
  const first = ensureDailyPlan(state, 'kucuk-kuzen', '2026-07-28', ['a', 'b', 'c', 'd'], ['w1', 'w2']);
  const second = ensureDailyPlan(state, 'kucuk-kuzen', '2026-07-28', ['x', 'y', 'z', 'q'], ['w9']);
  assert.deepEqual(second.missionIds, first.missionIds);
  assert.deepEqual(second.englishWordIds, first.englishWordIds);
});

test('cevaplanan soru profilin kalıcı görülmüş soru listesine eklenir', () => {
  const memory = new Map();
  globalThis.localStorage = {
    getItem: (key) => memory.get(key) || null,
    setItem: (key, value) => memory.set(key, value),
    removeItem: (key) => memory.delete(key)
  };
  const state = createInitialState(null);
  recordAttempt(state, {
    profileId: 'kucuk-kuzen', gameId: 'geometry-lab', questionKey: 'geometry-lab:test-key',
    skill: 'geometry', correct: true, difficulty: 2, hintsUsed: 0, elapsedSeconds: 20, score: 100
  });
  assert.equal(seenQuestionKeysForProfile(state, 'kucuk-kuzen').has('geometry-lab:test-key'), true);
});

test('günlük görev tam olarak Türkçe, matematik, olimpiyat ve zekâ kategorilerinden oluşur', () => {
  for (const profile of profiles) {
    const ids = createDailyMissionIds(profile, GAME_CATALOG, '2026-07-28');
    assert.equal(ids.length, 4);
    const categories = ids.map((id) => GAME_CATALOG.find((game) => game.id === id)?.category);
    assert.deepEqual(categories, DAILY_CORE_CATEGORIES);
    assert.equal(new Set(ids).size, 4);
  }
});


test('İngilizce havuzu en az yirmi günlük yeni kelime içerir', () => {
  const youngerWords = ENGLISH_WORDS.filter((word) => word.minAge <= 9);
  assert.ok(youngerWords.length >= 400);
  assert.equal(new Set(ENGLISH_WORDS.map((word) => word.word)).size, ENGLISH_WORDS.length);
  assert.equal(new Set(ENGLISH_WORDS.map((word) => word.id)).size, ENGLISH_WORDS.length);
});

test('günlük İngilizce 20 farklı ve daha önce görülmemiş kelime üretir', () => {
  for (const profile of profiles) {
    const first = createDailyEnglishWordIds(profile, ENGLISH_WORDS, new Set(), '2026-07-28', 20);
    assert.equal(first.length, 20);
    assert.equal(new Set(first).size, 20);
    const seen = new Set(first.map((id) => `english-vocabulary:${id}`));
    const second = createDailyEnglishWordIds(profile, ENGLISH_WORDS, seen, '2026-07-29', 20);
    assert.equal(second.length, 20);
    assert.equal(second.some((id) => first.includes(id)), false);
  }
});

test('aynı profile tamamlanan sorular tekrar verilmez', () => {
  for (const profile of profiles) {
    for (const game of GAME_CATALOG) {
      if (!isGameAvailableForProfile(game, profile)) continue;
      const first = createGameSession(game.id, profile, 10101);
      const firstKeys = new Set(first.rounds.map((round) => round.questionKey));
      assert.equal(firstKeys.size, first.rounds.length, `${profile.age} / ${game.id} ilk oturum içi tekrar`);
      const second = createGameSession(game.id, profile, 20202, { seenQuestionKeys: firstKeys });
      const overlap = second.rounds.filter((round) => firstKeys.has(round.questionKey));
      assert.equal(overlap.length, 0, `${profile.age} / ${game.id} tekrar eden soru`);
      assert.equal(new Set(second.rounds.map((round) => round.questionKey)).size, second.rounds.length, `${profile.age} / ${game.id} ikinci oturum içi tekrar`);
    }
  }
});

test('üretilen bütün oyun turlarının cevap indeksi geçerlidir', () => {
  for (const profile of profiles) {
    for (const game of GAME_CATALOG) {
      if (!isGameAvailableForProfile(game, profile)) continue;
      for (let seed = 1; seed <= 15; seed += 1) {
        const session = createGameSession(game.id, profile, seed * 997);
        for (const round of session.rounds) {
          assert.ok(round.questionKey, `${game.id} questionKey`);
          if (round.kind === 'choice') {
            assert.ok(round.answerIndex >= 0 && round.answerIndex < round.options.length, `${game.id}: ${round.prompt}`);
            assert.equal(new Set(round.options).size, round.options.length, `${game.id}: ${round.prompt}`);
          }
        }
      }
    }
  }
});


test('dinamik zekâ motoru geçerli ve yüzlerce farklı soru üretir', () => {
  for (const age of [9, 13]) {
    const keys = new Set();
    for (let seed = 1; seed <= 1000; seed += 1) {
      const round = createLogicRound(age, seed);
      assert.equal(round.options.length, 4);
      assert.equal(new Set(round.options).size, 4);
      assert.ok(round.options.includes(round.answerValue), `${age} / ${seed}`);
      keys.add(`${round.context}|${round.prompt}|${round.answerValue}`);
    }
    assert.ok(keys.size >= 300, `${age} yaş zekâ çeşitliliği ${keys.size}`);
  }
});

test('geometri motoru yüzlerce geçerli ve çeşitli soru üretir', () => {
  for (const age of [9, 13]) {
    const keys = new Set();
    for (let seed = 1; seed <= 250; seed += 1) {
      const round = createGeometryRound(age, seed);
      assert.ok(round.options.includes(String(round.answer)), `${age} / ${seed}: ${round.prompt}`);
      assert.equal(new Set(round.options).size, 4, `${age} / ${seed}: seçenek tekrar`);
      keys.add(`${round.prompt}|${round.context}`);
    }
    assert.ok(keys.size >= 100, `${age} yaş geometri çeşitliliği ${keys.size}`);
  }
});

test('problem, olimpiyat ve hata avı üreticileri geçerli cevaplar üretir', () => {
  for (const age of [9, 13]) {
    const errorKeys = new Set();
    for (let seed = 1; seed <= 250; seed += 1) {
      const problem = createProblemRound(age, seed);
      assert.ok(problem.options.includes(String(problem.answer)), `${age} problem ${seed}`);

      const olympiad = createOlympiadRound(age, seed);
      assert.ok(olympiad.options.includes(String(olympiad.answerValue)), `${age} olimpiyat ${seed}`);

      const error = createErrorRound(age, seed);
      assert.ok(error.answer >= 0 && error.answer < error.steps.length, `${age} hata ${seed}`);
      errorKeys.add(error.steps.join('|'));
    }
    assert.ok(errorKeys.size >= 80, `${age} yaş hata avı çeşitliliği ${errorKeys.size}`);
  }
});

test('hedef sayı dört işlem işaretlerinin tamamını zorunlu tutmaz', () => {
  assert.equal(validateTargetExpression('8 x 4 + 3 - 2', [8, 4, 3, 2], 33).valid, true);
  assert.equal(validateTargetExpression('(8 + 4) : 3 + 2', [8, 4, 3, 2], 6).valid, true);
  assert.equal(evaluateExpression('(8 + 4) : 3 + 2').toString(), '6');
});

test('yasak harf V2 görevlerinin kuralları eksiksizdir', () => {
  for (const prompt of EXTRA_FORBIDDEN_STORY_PROMPTS) {
    assert.equal(prompt.letter.length, 1);
    assert.ok(prompt.topic.length > 10);
    assert.ok(prompt.minSentences >= 2);
    assert.ok(prompt.minUniqueWords >= 8);
  }
});
