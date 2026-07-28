import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ERROR_QUESTIONS,
  GEOMETRY_QUESTIONS,
  LOGIC_QUESTIONS,
  MEANING_QUESTIONS,
  OLYMPIAD_QUESTIONS,
  PARAGRAPH_QUESTIONS,
  PROBLEM_QUESTIONS,
  WORD_LADDERS,
  WORD_MINE_SETS
} from '../js/content.js';
import { canBuildWord, isOneLetterChange } from '../js/engines/word-engine.js';
import { GAME_CATALOG, createGameSession, isGameAvailableForProfile } from '../js/games/registry.js';

const questionSets = [MEANING_QUESTIONS, PARAGRAPH_QUESTIONS, PROBLEM_QUESTIONS, ERROR_QUESTIONS, OLYMPIAD_QUESTIONS, LOGIC_QUESTIONS, GEOMETRY_QUESTIONS];

test('tüm çoktan seçmeli soruların geçerli tek cevabı vardır', () => {
  for (const set of questionSets) {
    for (const question of set) {
      assert.ok(Array.isArray(question.options) || Array.isArray(question.steps));
      const choices = question.options || question.steps;
      assert.ok(question.answer >= 0 && question.answer < choices.length, question.prompt);
      assert.ok(question.explanation?.length > 5, question.prompt);
    }
  }
});

test('kelime madeni örnekleri ana kelimenin harfleriyle kurulabilir', () => {
  for (const set of WORD_MINE_SETS) {
    for (const word of set.allowed) {
      assert.equal(canBuildWord(set.source, word), true, `${set.source} -> ${word}`);
    }
  }
});

test('kelime merdiveni yolları her adımda tek harf değiştirir', () => {
  for (const ladder of WORD_LADDERS) {
    const chain = [ladder.start, ...ladder.steps, ladder.end];
    for (let index = 0; index < chain.length - 1; index += 1) {
      assert.equal(isOneLetterChange(chain[index], chain[index + 1]), true, chain.join(' -> '));
    }
  }
});

test('her oyun iki profil için en az bir tur üretir', () => {
  const profiles = [
    { id: 'test-9', age: 9, grade: 4, skills: {} },
    { id: 'test-13', age: 13, grade: 8, skills: {} }
  ];
  for (const profile of profiles) {
    for (const game of GAME_CATALOG) {
      if (!isGameAvailableForProfile(game, profile)) continue;
      const session = createGameSession(game.id, profile, 12345);
      assert.ok(session.rounds.length > 0, `${profile.age} yaş / ${game.id}`);
    }
  }
});
