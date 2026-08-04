import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  ASSESSMENT_V2_PRODUCTION_PORTFOLIO,
  ASSESSMENT_V2_PRODUCTION_PORTFOLIO_AUDIT,
  auditAssessmentV2ProductionPortfolio
} from '../../js/assessment-v2/production-portfolio.js';
import { renderAssessmentV2ProductionPanelHtml } from '../../js/quality/assessment-v2-production-panel.js';

const portfolio = ASSESSMENT_V2_PRODUCTION_PORTFOLIO;

test('ürün portföyü 1-12 hedefini ve mevcut 48 ders motorunu dürüst sayaçlarla gösterir', () => {
  assert.equal(ASSESSMENT_V2_PRODUCTION_PORTFOLIO_AUDIT.ok, true, ASSESSMENT_V2_PRODUCTION_PORTFOLIO_AUDIT.errors.join('\n'));
  assert.equal(portfolio.summary.targetGradeCount, 12);
  assert.equal(portfolio.summary.courseScheduleCellCount, 112);
  assert.equal(portfolio.summary.activeEngineCellCount, 48);
  assert.equal(portfolio.summary.canonicalQuestionCount, 2204);
  assert.equal(portfolio.summary.curriculumOutcomeRecordCount, 2179);
  assert.equal(portfolio.summary.coveredOutcomeCount, 2179);
});

test('insan incelemesi, oyun uyarlaması ve ürün yayını ayrı kapılar olarak kalır', () => {
  assert.equal(portfolio.summary.humanApprovedQuestionCount, 5);
  assert.equal(portfolio.summary.humanReviewQueueCount, 2199);
  assert.equal(portfolio.summary.gameAdaptedQuestionCount, 5);
  assert.equal(portfolio.gameAdaptationAllowed, false);
  assert.equal(portfolio.productReady, false);
  assert.equal(portfolio.publicationAllowed, false);
  assert.equal(portfolio.engines.every(row => row.gameAdaptationAllowed === false), true);
});

test('ders motorları ortak üreticiye dönüşmeden alan kimliklerini korur', () => {
  assert.equal(new Set(portfolio.engines.map(row => row.engineType)).size >= 21, true);
  assert.equal(new Set(portfolio.engines.map(row => row.misconceptionCatalog)).size, 48);
  assert.equal(portfolio.architecture.sharedContractNotSharedGenerator, true);
  assert.equal(portfolio.architecture.subjectSpecificEnginesRequired, true);
});

test('program yönlendirmesi 12 sınıfı kapsar ve TYMM/önceki program ayrımını taşır', () => {
  assert.equal(portfolio.rollout.length, 12);
  assert.deepEqual(portfolio.rollout.filter(row => row.programFamily === 'PRE_TYMM').map(row => row.grade), [4, 8, 12]);
  assert.equal(portfolio.rollout.filter(row => row.programFamily === 'TYMM').length, 9);
});

test('legacy 604 içerik karantinada kalır', () => {
  assert.deepEqual(portfolio.legacy, { count: 604, status: 'UNVERIFIED_LEGACY' });
});

test('portföy mutasyonları dürüstlük denetiminde RED üretir', () => {
  const mutated = structuredClone(portfolio);
  mutated.productReady = true;
  mutated.gameAdaptationAllowed = true;
  assert.equal(auditAssessmentV2ProductionPortfolio(mutated).ok, false);
});

test('admin panel renderer kritik ürün durumunu ve motor kartlarını gösterir', () => {
  const html = renderAssessmentV2ProductionPanelHtml(portfolio);
  assert.match(html, /Ders Motorları ve Müfredat Üretim Haritası/);
  assert.match(html, /8\. sınıf/);
  assert.match(html, /Matematik/);
  assert.match(html, /Fen Bilimleri/);
  assert.match(html, /5\. sınıf/);
  assert.match(html, /productReady=false/);
  assert.match(html, /2199/);
});

test('admin platformu üretim panosunu soru motoru modülüne bağlar', () => {
  const source = fs.readFileSync(new URL('../../js/platform/firebase-platform.js', import.meta.url), 'utf8');
  assert.match(source, /renderAssessmentV2ProductionPanelHtml/);
  assert.match(source, /assessment-v2-production-dashboard\.json/);
  assert.match(source, /assessment-v2-production-panel/);
});
