import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildV11MisconceptionDevelopmentReport,
  buildV11MisconceptionNarrative,
  buildV11ClassMisconceptionSummary
} from '../js/engines/v11-misconception-report.js';

function attempt(id, misconceptionId, skeletonId, correct = false) {
  return {
    id,
    correct,
    diagnosticStatus: correct ? 'CORRECT_RESPONSE' : 'MISCONCEPTION_CAPTURED',
    misconceptionId: correct ? null : misconceptionId,
    misconception: misconceptionId === 'M1' ? 'Tek kanıta odaklanma' : 'Neden-sonuç yönünü ters kurma',
    skeletonId,
    skeletonFamilyId: skeletonId.split('_').slice(0, -1).join('_'),
    answeredAt: new Date(2026, 0, Number(id.replace(/\D/g, '')) || 1).toISOString()
  };
}

test('V11 yanılgı raporu yalnız tanılanmış yanlışları sayar', () => {
  const report = buildV11MisconceptionDevelopmentReport([
    attempt('1', 'M1', 'KANIT_BIRLESTIRME_02'),
    attempt('2', 'M1', 'KANIT_BIRLESTIRME_02'),
    attempt('3', 'M2', 'NEDEN_SONUC_01'),
    attempt('4', 'M1', 'KANIT_BIRLESTIRME_02', true),
    { id: '5', correct: false, diagnosticStatus: 'NO_RESPONSE_DIAGNOSIS' }
  ], { windowSize: 4 });
  assert.equal(report.diagnosedErrorCount, 3);
  assert.equal(report.distinctMisconceptionCount, 2);
  assert.equal(report.rows.find((row) => row.misconceptionId === 'M1').totalCount, 2);
});

test('tekrar eden yeni yanılgı destek önceliğine dönüşür', () => {
  const report = buildV11MisconceptionDevelopmentReport([
    attempt('1', 'M1', 'KANIT_BIRLESTIRME_02'),
    attempt('2', 'M1', 'KANIT_BIRLESTIRME_02'),
    attempt('3', 'M1', 'KANIT_BIRLESTIRME_02')
  ], { windowSize: 4 });
  const row = report.rows[0];
  assert.equal(row.trendStatus, 'NEW');
  assert.equal(row.supportLevel, 'HIGH');
  assert.equal(report.activeSupportCount, 1);
});

test('önceki dönemde olup yeni dönemde görülmeyen yanılgı azalıyor sayılır', () => {
  const attempts = [
    attempt('1', 'M1', 'KANIT_BIRLESTIRME_02'),
    attempt('2', 'M1', 'KANIT_BIRLESTIRME_02'),
    attempt('3', 'M2', 'NEDEN_SONUC_01'),
    attempt('4', 'M2', 'NEDEN_SONUC_01'),
    attempt('5', 'M2', 'NEDEN_SONUC_01'),
    attempt('6', 'M2', 'NEDEN_SONUC_01'),
    attempt('7', 'M2', 'NEDEN_SONUC_01'),
    attempt('8', 'M2', 'NEDEN_SONUC_01')
  ];
  const report = buildV11MisconceptionDevelopmentReport(attempts, { windowSize: 4 });
  assert.equal(report.rows.find((row) => row.misconceptionId === 'M1').trendStatus, 'IMPROVING');
});

test('veli ve sınıf özetleri teknik kimlik göstermeden üretilir', () => {
  const attempts = [attempt('1', 'M1', 'KANIT_BIRLESTIRME_02'), attempt('2', 'M1', 'KANIT_BIRLESTIRME_02')];
  const report = buildV11MisconceptionDevelopmentReport(attempts);
  const narrative = buildV11MisconceptionNarrative(report, 'parent');
  const classSummary = buildV11ClassMisconceptionSummary([attempts, []]);
  assert.match(narrative.headline, /Çocuğunuzun|belirgin/);
  assert.equal(narrative.summary.includes('KANIT_BIRLESTIRME'), false);
  assert.equal(classSummary.studentCount, 2);
  assert.equal(classSummary.studentsWithDiagnosedErrors, 1);
});
