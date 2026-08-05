import test from 'node:test';
import assert from 'node:assert/strict';
import { LAUNCH_PILOT_PREMIUM_SLOTS, resolveLaunchPilotPremiumRound } from '../../js/assessment-v2/launch-pilot-premium-bank.js';
import { createGameSession, getGame, isGameAvailableForProfile } from '../../js/games/registry.js';

function permutations(values) {
  if (values.length <= 1) return [values];
  return values.flatMap((value, index) => permutations(values.filter((_, i) => i !== index)).map((rest) => [value, ...rest]));
}

test('Phase 5I kontrollü beta 30 pilot slotunun tamamını gerçek oyun oturumuna taşır', () => {
  const failures = [];
  for (const [index, slot] of LAUNCH_PILOT_PREMIUM_SLOTS.entries()) {
    const profile = { id: `phase5i-${slot.grade}-${index}`, grade: slot.grade, age: slot.grade + 5, skills: {} };
    const game = getGame(slot.gameId);
    assert.equal(isGameAvailableForProfile(game, profile), true, `${slot.slotId}:catalog-availability`);
    const session = createGameSession(slot.gameId, profile, 910_000 + index, {
      controlledLaunchPilot: true,
      seenQuestionKeys: new Set(),
      blockedQuestionFamilies: new Set(),
      completedSessionCount: 1,
      attempts: []
    });
    const delivered = session.rounds.find((round) => round.controlledLaunchPilot === true);
    if (!delivered) failures.push(slot.slotId);
    else {
      assert.equal(delivered.controlledLaunchVersion, 'PHASE5I_PILOT_1');
      assert.equal(delivered.formalCurriculumCertification, false);
      assert.equal(delivered.studentTelemetryRequired, true);
      assert.equal(delivered.questionKey, slot.sourceKey);
    }
    assert.ok(session.rounds.every((round) => !String(round.sourceLabel || '').includes('UNVERIFIED_LEGACY')), `${slot.slotId}:legacy-source`);
  }
  assert.deepEqual(failures, []);
});

test('Forbidden Story yönergesi kuralın yalnız cevap alanına ait olduğunu açıklar', () => {
  const slot = LAUNCH_PILOT_PREMIUM_SLOTS.find((row) => row.slotId === 'turkish:7:forbidden-story');
  const round = resolveLaunchPilotPremiumRound(slot);
  assert.match(round.context, /yalnızca cevap alanına/i);
  assert.match(round.context, /“U” veya “u”/);
  assert.equal(round.minSentences, 3);
  assert.equal(round.minUniqueWords, 18);
  assert.equal(round.forbiddenLetter, 'u');
});

test('8. sınıf mantık sorusunda Drama yalnız salı veya cuma olabilir ve üç çeldirici zorunlu değildir', () => {
  const slot = LAUNCH_PILOT_PREMIUM_SLOTS.find((row) => row.slotId === 'math:8:logic-station');
  const round = resolveLaunchPilotPremiumRound(slot);
  const workshops = ['Resim', 'Kodlama', 'Müzik', 'Drama', 'Fen'];
  const valid = permutations(workshops).filter((schedule) => {
    const day = Object.fromEntries(schedule.map((name, index) => [name, index]));
    return day.Kodlama === day.Resim + 1
      && day.Müzik < day.Drama
      && ![0, 4].includes(day.Fen)
      && day.Drama !== 2;
  });
  assert.ok(valid.length >= 2, 'tek örneğe bağlı olmayan geçerli programlar bulunmalı');
  const dayMaps = valid.map((schedule) => Object.fromEntries(schedule.map((name, index) => [name, index])));
  assert.ok(dayMaps.every((day) => [1, 4].includes(day.Drama)), 'Drama bütün geçerli programlarda salı veya cuma olmalı');
  assert.ok(dayMaps.some((day) => day.Kodlama !== 1), 'Kodlama salı olmak zorunda olmamalı');
  assert.ok(dayMaps.some((day) => !(day.Resim < day.Fen)), 'Resim Fen’den önce olmak zorunda olmamalı');
  assert.ok(dayMaps.some((day) => day.Müzik !== 0), 'Müzik pazartesi olmak zorunda olmamalı');
  assert.equal(round.options[round.answerIndex], 'Drama salı veya cuma günü yapılır.');
  assert.ok(Number(round.reasoningStepCount) >= 5);
});
