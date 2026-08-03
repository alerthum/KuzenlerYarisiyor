import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HIGH_COGNITIVE_TRAITS,
  STAGE05_SCORE_MIN,
  buildCognitiveDepthEvidence,
  evaluateCognitiveDepth,
  attachCognitiveDepth,
  scoreCognitiveDepthAudit
} from '../js/quality/cognitive-depth-engine.js';
import { createGameSession, GAME_CATALOG, isGameAvailableForProfile } from '../js/games/registry.js';

const STAGE04_GAMES = [
  'pattern-lab', 'speed-math', 'target-number', 'geometry-lab', 'problem-hunter', 'error-detective',
  'logic-station', 'olympiad-ladder',
  'word-mine', 'word-ladder', 'forbidden-story', 'meaning-hunt', 'paragraph-detective',
  'english-vocabulary', 'english-cloze', 'english-sentence-builder',
  'social-time-travel', 'social-map-skills', 'social-citizenship',
  'religion-practice', 'lgs-foundation', 'science-lab', 'science-reasoning'
];

function profileForGame(gameId, grade) {
  const game = GAME_CATALOG.find((g) => g.id === gameId);
  const minAge = Number(game?.minAge || 8);
  const age = Math.max(minAge, 7 + grade);
  return { id: `s05-${gameId}-g${grade}`, age, grade, skills: {} };
}

test('hard etiketi tek başına evidenceSupportedHard vermez', () => {
  const round = {
    prompt: 'Sonucu kaçtır?',
    difficultyLabel: 'hard',
    cognitiveDepth: 5,
    cognitiveTraits: [],
    skeletonId: 'x',
    explanation: 'Direkt.'
  };
  const evidence = buildCognitiveDepthEvidence(round);
  assert.equal(evidence.evidenceSupportedHard, false);
  assert.ok(evidence.violations.includes('hard_label_without_evidence'));
});

test('iki yüksek özellik + iki adım hard yayın bandı verir', () => {
  const round = {
    prompt: 'Önce kuralı bul, sonra eksik terimi hesapla ve doğrula.',
    explanation: 'Birinci adım kuralı çıkarır. İkinci adım terimi uygular.',
    cognitiveTraits: ['multiStepInference', 'strategySelection'],
    skeletonId: 'pattern-lab:arith:select-valid',
    hints: ['Kuralı bul', 'Uygula']
  };
  const evidence = buildCognitiveDepthEvidence(round);
  assert.ok(evidence.reasoningStepCount >= 2);
  assert.ok(evidence.highCognitiveTraits.length >= 2);
  assert.equal(evidence.publicationBand, 'hard');
  assert.equal(evidence.evidenceSupportedHard, true);
});

test('grade≥3 easy/medium yayını engellenir', () => {
  const shallow = attachCognitiveDepth({
    prompt: '2+2 sonucu kaçtır?',
    cognitiveTraits: ['memory'],
    explanation: 'Topla.'
  }, { grade: 5 });
  const evaluation = evaluateCognitiveDepth(shallow, { grade: 5 });
  assert.equal(evaluation.publicationAllowed, false);
});

test('grade<3 muaf tutulur', () => {
  const shallow = attachCognitiveDepth({
    prompt: '2+2 sonucu kaçtır?',
    cognitiveTraits: [],
    explanation: 'Topla.'
  }, { grade: 2 });
  const evaluation = evaluateCognitiveDepth(shallow, { grade: 2 });
  assert.equal(evaluation.publicationAllowed, true);
  assert.equal(evaluation.gradeExempt, true);
});

test('yalnız büyük sayı / uzun metin zor sayılmaz', () => {
  const big = buildCognitiveDepthEvidence({
    prompt: '12345 + 67890 sonucu kaçtır?',
    cognitiveTraits: [],
    explanation: 'Topla.'
  });
  assert.ok(big.shallowHardness || big.publicationBand !== 'hard');
  const long = buildCognitiveDepthEvidence({
    prompt: `${'çok uzun metin '.repeat(40)} sonucu kaçtır?`,
    cognitiveTraits: ['memory'],
    explanation: 'Oku.'
  });
  assert.ok(long.shallowHardness || long.publicationBand !== 'hard');
});

test('HIGH_COGNITIVE_TRAITS en az 8 özellik içerir', () => {
  assert.ok(HIGH_COGNITIVE_TRAITS.length >= 8);
});

test('CANLI: 23 oyun × grade≥3 oturumlarında easy/medium yayın = 0 ve skor ≥95', () => {
  const samples = [];
  const grades = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  let seed = 50505;
  for (const gameId of STAGE04_GAMES) {
    for (const grade of grades) {
      const game = GAME_CATALOG.find((g) => g.id === gameId);
      if (!game) continue;
      const profile = profileForGame(gameId, grade);
      if (!isGameAvailableForProfile(game, profile)) continue;
      const session = createGameSession(gameId, profile, seed, { completedSessionCount: 1 });
      seed += 17;
      for (const round of session.rounds) {
        samples.push({
          grade,
          gameId,
          published: true,
          round
        });
      }
    }
  }
  assert.ok(samples.length >= 200, `örneklem yetersiz: ${samples.length}`);
  for (const sample of samples) {
    assert.ok(sample.round.cognitiveDepthEvidence, 'cognitiveDepthEvidence zorunlu');
    assert.ok(sample.round.questionContract?.quality?.cognitiveDepthEvidence, 'sözleşmede evidence yok');
    if (sample.grade >= 3) {
      assert.equal(sample.round.cognitiveDepthEvidence.publicationBand, 'hard', `${sample.gameId} g${sample.grade}`);
      assert.ok(sample.round.cognitiveDepthEvidence.reasoningStepCount >= 2);
      assert.ok(sample.round.cognitiveDepthEvidence.highCognitiveTraits.length >= 2);
    }
  }
  const audit = scoreCognitiveDepthAudit(samples);
  assert.equal(audit.easyMediumPublishedCount, 0, `easy/medium yayın: ${audit.easyMediumPublishedCount}`);
  assert.equal(audit.criticalViolations, 0);
  assert.ok(audit.scorePercent >= STAGE05_SCORE_MIN, `skor ${audit.scorePercent} < ${STAGE05_SCORE_MIN}`);
  assert.equal(audit.meetsStageGate, true);
});

test('CANLI: grade≥3 oturumunda sığ tur filtrelenir (underfill yerine yayınlama yok)', () => {
  const session = createGameSession('speed-math', { id: 's05-filter', age: 12, grade: 6, skills: {} }, 909090, {
    completedSessionCount: 2
  });
  assert.ok(session.rounds.length > 0);
  for (const round of session.rounds) {
    assert.equal(round.cognitiveDepthGate?.publicationAllowed, true);
    assert.equal(round.cognitiveDepthEvidence.publicationBand, 'hard');
  }
});
