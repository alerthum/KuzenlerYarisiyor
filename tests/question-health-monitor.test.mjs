import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeQuestionHealth } from '../js/quality/question-health-monitor.js';
import { createInitialState, recordAttempt, reportQuestion } from '../js/state.js';

test('iki bağımsız ağır bildirim yalnız izlemeye alır, üçüncü bildirim global karantina açar', () => {
  const state = createInitialState(null);
  for (const profileId of ['student-a', 'student-b']) {
    const report = reportQuestion(state, { profileId, questionKey: 'q-severe', reason: 'answer-wrong', responseKind: 'choice', gameId: 'logic-station' });
    assert.equal(report.healthEvaluation.quarantine, false);
  }
  assert.equal(state.blockedQuestionKeys.__global?.['q-severe'], undefined);
  const third = reportQuestion(state, { profileId: 'student-c', questionKey: 'q-severe', reason: 'ambiguous', responseKind: 'choice', gameId: 'logic-station' });
  assert.equal(third.healthEvaluation.status, 'AUTO_QUARANTINED_REPORT_THRESHOLD');
  assert.ok(state.blockedQuestionKeys.__global['q-severe']);
  assert.equal(state.blockedQuestionFamilies.__global?.['logic-station'], undefined, 'öğrenci eşiği bütün aileyi cezalandırmamalı');
});

test('aynı öğrencinin tekrarlı bildirimi bağımsız öğrenci eşiğini doldurmaz', () => {
  const reports = Array.from({ length: 5 }, (_, index) => ({ id: `r-${index}`, profileId: 'same-student', questionKey: 'q-one', reason: 'answer-wrong' }));
  const result = analyzeQuestionHealth({ questionKey: 'q-one', reports, attempts: [], responseKind: 'choice' });
  assert.equal(result.severeIndependentReporterCount, 1);
  assert.equal(result.quarantine, false);
});

test('40 gerçek yanıtta yüzde 85 üzeri başarı ve çok kısa medyan süre soruyu çok kolay kuyruğuna alır', () => {
  const state = createInitialState(null);
  const profileId = state.profiles[0].id;
  for (let index = 0; index < 40; index += 1) {
    recordAttempt(state, {
      profileId,
      gameId: 'logic-station',
      questionKey: 'q-too-easy',
      responseKind: 'choice',
      skill: 'verbalLogic',
      correct: index < 35,
      difficulty: 4,
      hintsUsed: 0,
      elapsedSeconds: 10
    });
  }
  assert.equal(state.questionHealth['q-too-easy'].status, 'AUTO_QUARANTINED_TOO_EASY');
  assert.equal(state.questionHealth['q-too-easy'].attemptCount, 40);
  assert.ok(state.questionHealth['q-too-easy'].accuracy >= 0.85);
  assert.ok(state.blockedQuestionKeys.__global['q-too-easy']);
});

test('39 hızlı yanıt karar vermek için yeterli değildir', () => {
  const attempts = Array.from({ length: 39 }, (_, index) => ({ questionKey: 'q-39', correct: index < 38, elapsedSeconds: 8 }));
  const result = analyzeQuestionHealth({ questionKey: 'q-39', reports: [], attempts, responseKind: 'choice' });
  assert.equal(result.quarantine, false);
  assert.equal(result.status, 'HEALTHY');
});

test('üç bağımsız aynı-soru bildirimi tekrar kusurunu global karantinaya alır', () => {
  const reports = ['a', 'b', 'c'].map((profileId) => ({ profileId, questionKey: 'q-duplicate', reason: 'same-question' }));
  const result = analyzeQuestionHealth({ questionKey: 'q-duplicate', reports, attempts: [], responseKind: 'choice' });
  assert.equal(result.status, 'AUTO_QUARANTINED_DUPLICATE_THRESHOLD');
  assert.equal(result.quarantine, true);
});
