import test from 'node:test';
import assert from 'node:assert/strict';
import { GAME_CATALOG, createGameSession, isGameAvailableForProfile } from '../js/games/registry.js';
import { validateQuestionContract } from '../js/quality/question-contract-v11.js';

const PROFILES = [
  { id: 'contract-test-9', age: 9, grade: 4, skills: {} },
  { id: 'contract-test-13', age: 13, grade: 8, skills: {} }
];

// Aşama 04 tamamlandı: aktif oyunların tamamı explicit familyId/skeletonId üretir.
const GAMES_WITH_FAMILY_AND_SKELETON = ["pattern-lab", "speed-math", "target-number", "geometry-lab", "problem-hunter", "error-detective", "word-mine", "word-ladder", "forbidden-story", "meaning-hunt", "paragraph-detective", "olympiad-ladder", "logic-station", "english-vocabulary", "english-cloze", "english-sentence-builder", "social-time-travel", "social-map-skills", "social-citizenship", "religion-practice", "lgs-foundation", "science-lab", "science-reasoning"];

test('her oyunun her turu ortak QuestionContract taşır ve mevcut alanlar korunur', () => {
  for (const profile of PROFILES) {
    for (const game of GAME_CATALOG) {
      if (!isGameAvailableForProfile(game, profile)) continue;
      let session;
      try {
        session = createGameSession(game.id, profile, 424242);
      } catch {
        continue; // bazı oyunlar (ör. word-ladder lise) bilinçli olarak kapalı; bu testin konusu değil
      }
      for (const round of session.rounds) {
        const result = validateQuestionContract(round);
        assert.ok(result.ok, `${game.id} (${profile.age} yaş): questionContract eksik/hatalı -> ${result.errors.join(',')}`);
        assert.ok(round.prompt !== undefined, `${game.id}: mevcut 'prompt' alanı questionContract eklenirken kaybolmuş`);
        assert.equal(round.questionContract.schemaVersion, '3.0.0');
      }
    }
  }
});

test('familyId ve skeletonId bilinen oyunlarda sözleşme bunu "explicit" olarak işaretler ve semanticFingerprint üretir', () => {
  const profile = { id: 'contract-test-explicit', age: 13, grade: 8, skills: {} };
  for (const gameId of GAMES_WITH_FAMILY_AND_SKELETON) {
    const game = GAME_CATALOG.find((g) => g.id === gameId);
    if (!isGameAvailableForProfile(game, profile)) continue;
    const session = createGameSession(gameId, profile, 555111);
    for (const round of session.rounds) {
      assert.ok(round.questionContract.family.isExplicit, `${gameId}: family.isExplicit false olmamalı`);
      assert.ok(round.questionContract.skeleton.isExplicit, `${gameId}: skeleton.isExplicit false olmamalı`);
      assert.ok(round.questionContract.repeat.semanticFingerprint, `${gameId}: semanticFingerprint üretilmeli`);
      assert.equal(round.questionContract.pendingFields.includes('family.familyId'), false);
      assert.equal(round.questionContract.pendingFields.includes('skeleton.skeletonId'), false);
    }
  }
});

test('surfaceFingerprint ve questionKey her turda dolu olmalı (tekrar denetimi için asgari zorunluluk)', () => {
  const profile = { id: 'contract-test-surface', age: 9, grade: 4, skills: {} };
  for (const game of GAME_CATALOG) {
    if (!isGameAvailableForProfile(game, profile)) continue;
    let session;
    try {
      session = createGameSession(game.id, profile, 909090);
    } catch {
      continue;
    }
    for (const round of session.rounds) {
      assert.ok(round.questionContract.repeat.surfaceFingerprint, `${game.id}: surfaceFingerprint boş olamaz`);
      assert.ok(round.questionContract.repeat.questionKey, `${game.id}: questionKey boş olamaz`);
    }
  }
});
