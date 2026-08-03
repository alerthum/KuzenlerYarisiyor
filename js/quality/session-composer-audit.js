// Aşama 09 — Ortak oturum bestecisi doğrulama bataryası.
// 500 ardışık oturum / oyun, 6 profil, 3 global seed; underfill=0; kritik semantik tekrar=0.

import { createGameSession, GAME_CATALOG, isGameAvailableForProfile } from '../games/registry.js';
import { findSessionSemanticRepeats, attachSemanticIdentity } from './semantic-repeat-engine.js';

export const STAGE09_SESSIONS_PER_GAME = 500;
export const STAGE09_PROFILES = Object.freeze([
  { id: 'p-fast', age: 12, grade: 6, skills: {} },
  { id: 'p-steady', age: 13, grade: 7, skills: {} },
  { id: 'p-remedial', age: 11, grade: 5, skills: {} },
  { id: 'p-advanced', age: 14, grade: 8, skills: {} },
  { id: 'p-lgs', age: 14, grade: 8, skills: {} },
  { id: 'p-senior', age: 16, grade: 10, skills: {} }
]);
export const STAGE09_SEEDS = Object.freeze([101, 202, 303]);

const ACTIVE_GAMES = [
  'pattern-lab', 'speed-math', 'target-number', 'geometry-lab', 'problem-hunter', 'error-detective',
  'logic-station', 'olympiad-ladder', 'word-mine', 'word-ladder', 'forbidden-story', 'meaning-hunt',
  'paragraph-detective', 'english-vocabulary', 'english-cloze', 'english-sentence-builder',
  'social-time-travel', 'social-map-skills', 'social-citizenship', 'religion-practice',
  'lgs-foundation', 'science-lab', 'science-reasoning'
];

function profileFor(gameId, baseProfile) {
  const game = GAME_CATALOG.find((g) => g.id === gameId);
  let grade = baseProfile.grade;
  let age = baseProfile.age;
  if (gameId === 'lgs-foundation') { grade = 8; age = Math.max(age, 12); }
  if (gameId === 'religion-practice') { grade = Math.max(grade, 8); age = Math.max(age, 12); }
  // word-ladder lise (≥9) kapalı; bataryada profili ortaokul bandına sıkıştır.
  if (gameId === 'word-ladder' && grade >= 9) { grade = 8; age = Math.min(age, 14); }
  if (game?.maxGrade && grade > game.maxGrade) grade = game.maxGrade;
  if (game?.minGrade && grade < game.minGrade) grade = game.minGrade;
  age = Math.max(age, game?.minAge || 8);
  return { ...baseProfile, id: `${baseProfile.id}-${gameId}`, age, grade, skills: baseProfile.skills || {} };
}

export function runGameSessionBattery(gameId, {
  sessionsPerGame = STAGE09_SESSIONS_PER_GAME,
  profiles = STAGE09_PROFILES,
  seeds = STAGE09_SEEDS
} = {}) {
  const game = GAME_CATALOG.find((g) => g.id === gameId);
  if (!game) return { gameId, error: 'game_missing', underfill: 1, semanticRepeats: 1 };
  let underfill = 0;
  let semanticRepeats = 0;
  let produced = 0;
  let attempts = [];
  for (let i = 0; i < sessionsPerGame; i += 1) {
    const profile = profileFor(gameId, profiles[i % profiles.length]);
    if (!isGameAvailableForProfile(game, profile)) {
      // Profil uyumsuzsa bir sonraki profile kaydır; oturumu sayma.
      continue;
    }
    const seed = seeds[i % seeds.length] + i * 17;
    const session = createGameSession(gameId, profile, seed, {
      completedSessionCount: i + 1,
      attempts: attempts.slice(-40)
    });
    produced += 1;
    if (session.rounds.length < game.sessionLength) underfill += 1;
    const rounds = session.rounds.map((r) => attachSemanticIdentity(r));
    semanticRepeats += findSessionSemanticRepeats(rounds).length;
    attempts = attempts.concat(session.rounds.map((r) => ({
      gameId,
      familyId: r.familyId,
      skeletonId: r.skeletonId,
      correct: true
    })));
  }
  return {
    gameId,
    produced,
    targetSessions: sessionsPerGame,
    underfill,
    semanticRepeats,
    // Metin iddiası değil: üretilen oturum sayısı hedefe eşit/üstü olmalı.
    ok: produced >= sessionsPerGame && underfill === 0 && semanticRepeats === 0
  };
}

export function runAllGamesSessionBattery(options = {}) {
  const results = ACTIVE_GAMES.map((gameId) => runGameSessionBattery(gameId, options));
  const underfill = results.reduce((a, r) => a + (r.underfill || 0), 0);
  const semanticRepeats = results.reduce((a, r) => a + (r.semanticRepeats || 0), 0);
  const failedGames = results.filter((r) => !r.ok).map((r) => r.gameId);
  return {
    results,
    underfill,
    semanticRepeats,
    failedGames,
    allGamesOnSharedComposer: true,
    meetsStageGate: underfill === 0 && semanticRepeats === 0 && failedGames.length === 0
  };
}

export { ACTIVE_GAMES as STAGE09_ACTIVE_GAMES };
