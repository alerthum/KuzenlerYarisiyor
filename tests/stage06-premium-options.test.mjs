import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STAGE06_SCORE_MIN,
  evaluateOptionQuality,
  blindOptionClassifier,
  attachOptionQuality,
  scoreOptionQualityAudit
} from '../js/quality/premium-options-engine.js';
import { createGameSession, GAME_CATALOG, isGameAvailableForProfile } from '../js/games/registry.js';

const GAMES = [
  'pattern-lab', 'speed-math', 'target-number', 'geometry-lab', 'problem-hunter', 'error-detective',
  'logic-station', 'olympiad-ladder', 'word-mine', 'word-ladder', 'forbidden-story', 'meaning-hunt',
  'paragraph-detective', 'english-vocabulary', 'english-cloze', 'english-sentence-builder',
  'social-time-travel', 'social-map-skills', 'social-citizenship', 'religion-practice',
  'lgs-foundation', 'science-lab', 'science-reasoning'
];

test('alakasız/saçma/tek olumsuz/biçimsel ipucu yakalanır', () => {
  const bad = evaluateOptionQuality({
    kind: 'choice',
    prompt: 'Oran nedir?',
    options: ['2', 'pizza', '3', '4'],
    answerIndex: 0
  });
  assert.ok(bad.violations.includes('irrelevant_option'));

  const absurd = evaluateOptionQuality({
    kind: 'choice', prompt: 'x', options: ['a', 'asdf', 'b', 'c'], answerIndex: 0
  });
  assert.ok(absurd.violations.includes('absurd_option'));

  const uniqNeg = evaluateOptionQuality({
    kind: 'choice', prompt: 'x', options: ['evet', 'hayır', 'belki', 'hiçbiri'], answerIndex: 3
  });
  assert.ok(uniqNeg.violations.includes('unique_negative_option'));

  const form = evaluateOptionQuality({
    kind: 'choice',
    prompt: 'x',
    options: ['a', 'b', 'c', 'çok uzun açıklamalı doğru seçenek metni burada'],
    answerIndex: 3
  });
  assert.ok(form.violations.includes('form_cue_giveaway'));
});

test('kör denetçi stem olmadan tahmin edilebilir seçeneği yakalar', () => {
  const blind = blindOptionClassifier(
    ['kısa', 'kısa2', 'kısa3', 'çok daha uzun doğru cevap seçeneği'],
    3
  );
  assert.equal(blind.predictableWithoutStem, true);
});

test('misconception kaydı zorunlu; attach doldurur', () => {
  const attached = attachOptionQuality({
    kind: 'choice',
    prompt: 'Kuralı bul',
    options: ['A', 'B', 'C', 'D'],
    answerIndex: 1,
    familyId: 'demo',
    skeletonId: 'demo:select-valid',
    explanation: 'B doğrudur çünkü kural uygulanır.'
  });
  assert.equal(attached.optionQuality.ok, true);
  assert.equal(attached.optionDiagnostics.filter((d) => !d.isCorrect && d.misconceptionId).length, 3);
});

test('CANLI: yayınlanan choice turlarında seçenek kalitesi ≥95 ve kritik sayaçlar 0', () => {
  const samples = [];
  let seed = 60606;
  for (const gameId of GAMES) {
    const game = GAME_CATALOG.find((g) => g.id === gameId);
    const grade = gameId === 'lgs-foundation' || gameId === 'religion-practice' ? 8 : 6;
    const profile = { id: `s06-${gameId}`, age: Math.max(game.minAge || 8, 12), grade, skills: {} };
    if (!isGameAvailableForProfile(game, profile)) continue;
    const session = createGameSession(gameId, profile, seed, { completedSessionCount: 1 });
    seed += 13;
    for (const round of session.rounds) {
      if (round.kind && round.kind !== 'choice') continue;
      samples.push({ round });
    }
  }
  assert.ok(samples.length >= 80, `örneklem yetersiz: ${samples.length}`);
  for (const sample of samples) {
    assert.ok(sample.round.optionQuality?.ok, sample.round.optionQuality?.violations?.join(','));
    const wrong = (sample.round.optionDiagnostics || []).filter((d) => !d.isCorrect);
    assert.ok(wrong.every((d) => d.misconceptionId), 'misconceptionId eksik');
  }
  const audit = scoreOptionQualityAudit(samples);
  assert.equal(audit.irrelevantOptionCount, 0);
  assert.equal(audit.absurdOptionCount, 0);
  assert.equal(audit.uniqueNegativeOptionCount, 0);
  assert.equal(audit.formCueGiveawayCount, 0);
  assert.equal(audit.answerableWithoutReadingAllOptionsCount, 0);
  assert.equal(audit.missingMisconceptionCount, 0);
  assert.ok(audit.scorePercent >= STAGE06_SCORE_MIN, `skor ${audit.scorePercent}`);
  assert.equal(audit.meetsStageGate, true);
});
