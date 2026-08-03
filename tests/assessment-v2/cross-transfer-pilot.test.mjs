import test from 'node:test';
import assert from 'node:assert/strict';
import { produceCanonicalQuestion } from '../../js/assessment-v2/question-production-pipeline.js';
import {
  GRADE8_MATH_CROSS_PILOT_IDS,
  auditGrade8MathCrossPilotCatalog,
  auditGrade8MathCrossPilotQuestion,
  buildGrade8MathCrossPilotQuestions,
  grade8MathCrossPilotEngine
} from '../../js/assessment-v2/math-g8-cross-pilot.js';
import {
  GRADE8_SCIENCE_CROSS_PILOT_IDS,
  auditGrade8ScienceCrossPilotCatalog,
  auditGrade8ScienceCrossPilotQuestion,
  buildGrade8ScienceCrossPilotQuestions,
  grade8ScienceCrossPilotEngine
} from '../../js/assessment-v2/science-g8-cross-pilot.js';
import {
  GRADE5_TURKISH_CROSS_PILOT_IDS,
  auditGrade5TurkishCrossPilotCatalog,
  auditGrade5TurkishCrossPilotQuestion,
  buildGrade5TurkishCrossPilotQuestions,
  grade5TurkishCrossPilotEngine
} from '../../js/assessment-v2/turkish-g5-cross-pilot.js';
import { GRADE8_MATH_PILOT_OUTCOMES } from '../../js/curriculum/outcomes/tr-g8-matematik-2018-pilot.js';
import { GRADE8_SCIENCE_PILOT_OUTCOMES } from '../../js/curriculum/outcomes/tr-g8-fen-2018-pilot.js';
import { GRADE5_TURKISH_PILOT_OUTCOMES } from '../../js/curriculum/outcomes/tr-g5-turkce-tymm-2024-pilot.js';

const mathItems = buildGrade8MathCrossPilotQuestions();
const scienceItems = buildGrade8ScienceCrossPilotQuestions();
const turkishItems = buildGrade5TurkishCrossPilotQuestions();

test('çapraz pilot üç ayrı ders motorunda 5+5+5 yeni soru üretir', () => {
  assert.equal(auditGrade8MathCrossPilotCatalog(mathItems).ok, true);
  assert.equal(auditGrade8ScienceCrossPilotCatalog(scienceItems).ok, true);
  assert.equal(auditGrade5TurkishCrossPilotCatalog(turkishItems).ok, true);
  assert.equal(mathItems.length, 5);
  assert.equal(scienceItems.length, 5);
  assert.equal(turkishItems.length, 5);
  assert.equal(new Set([...mathItems, ...scienceItems, ...turkishItems].map(item => item.id)).size, 15);
});

test('pilot kazanımları aktif program sürümüne doğru yönlenir', () => {
  assert.equal(GRADE8_MATH_PILOT_OUTCOMES.every(row => row.programFamily === 'PRE_TYMM'), true);
  assert.equal(GRADE8_SCIENCE_PILOT_OUTCOMES.every(row => row.programFamily === 'PRE_TYMM'), true);
  assert.equal(GRADE5_TURKISH_PILOT_OUTCOMES.every(row => row.programFamily === 'TYMM'), true);
  assert.equal(new Set(GRADE8_MATH_PILOT_OUTCOMES.map(row => row.officialOutcomeCode)).size, 5);
  assert.equal(new Set(GRADE8_SCIENCE_PILOT_OUTCOMES.map(row => row.officialOutcomeCode)).size, 5);
  assert.equal(new Set(GRADE5_TURKISH_PILOT_OUTCOMES.map(row => row.officialOutcomeCode)).size, 5);
});

test('matematik soruları alan çözücüsü ve farklı bağımsız algoritmayla doğrulanır', () => {
  for (const questionId of GRADE8_MATH_CROSS_PILOT_IDS) {
    const result = produceCanonicalQuestion({ request: { grade: 8, courseId: 'matematik', questionId }, subjectEngine: grade8MathCrossPilotEngine });
    assert.equal(result.proof.independentlyVerified, true, questionId);
    assert.equal(result.proof.solved.optionId, result.canonical.answerKey.optionId, questionId);
    assert.notEqual(result.canonical.verifier.solverId, result.canonical.verifier.independentVerifierId);
  }
});

test('fen soruları model kuralı ve kanıt-kısıt doğrulayıcısıyla birleşir', () => {
  for (const questionId of GRADE8_SCIENCE_CROSS_PILOT_IDS) {
    const result = produceCanonicalQuestion({ request: { grade: 8, courseId: 'fen-bilimleri', questionId }, subjectEngine: grade8ScienceCrossPilotEngine });
    assert.equal(result.proof.independentlyVerified, true, questionId);
    assert.equal(result.proof.solved.optionId, result.canonical.answerKey.optionId, questionId);
  }
});

test('5. sınıf Türkçe soruları yaş düzeyinde çoklu kanıt ve dengeli çeldirici kullanır', () => {
  for (const questionId of GRADE5_TURKISH_CROSS_PILOT_IDS) {
    const result = produceCanonicalQuestion({ request: { grade: 5, courseId: 'turkce', questionId }, subjectEngine: grade5TurkishCrossPilotEngine });
    const audit = auditGrade5TurkishCrossPilotQuestion(result.canonical);
    assert.equal(result.proof.independentlyVerified, true, questionId);
    assert.equal(audit.ok, true, `${questionId}: ${audit.errors.join(', ')}`);
    assert.equal(audit.metrics.blindOptionCueRisk, 0, questionId);
    assert.equal(result.canonical.content.requiredEvidenceIds.length >= 3, true, questionId);
  }
});

test('üç motorun yanılgı katalogları ve alan kimlikleri birbirinden ayrıdır', () => {
  assert.notEqual(grade8MathCrossPilotEngine.domain, grade8ScienceCrossPilotEngine.domain);
  assert.notEqual(grade8MathCrossPilotEngine.misconceptionCatalogId, grade8ScienceCrossPilotEngine.misconceptionCatalogId);
  assert.notEqual(grade8ScienceCrossPilotEngine.misconceptionCatalogId, grade5TurkishCrossPilotEngine.misconceptionCatalogId);
  assert.notEqual(grade8MathCrossPilotEngine.id, grade5TurkishCrossPilotEngine.id);
});

test('15 sorunun tamamı insan incelemesi öncesinde oyun adaptasyonuna kapalıdır', () => {
  for (const item of [...mathItems, ...scienceItems, ...turkishItems]) {
    assert.equal(item.contentStatus, 'HUMAN_REVIEW_REQUIRED');
    assert.equal(item.content.humanReview.status, 'NOT_MEASURED');
    assert.equal(item.content.humanReview.gameAdaptationAllowed, false);
    assert.equal(item.gameBindings.length, 0);
    assert.deepEqual(item.hints.map(hint => hint.level), [1, 2, 3]);
    assert.equal(item.optionFeedback.length, 4);
  }
});

test('matematik doğru değeri bozulunca bağımsız doğrulama RED verir', () => {
  const item = structuredClone(mathItems[0]);
  item.answerKey.optionId = 'A';
  const audit = auditGrade8MathCrossPilotQuestion(item);
  assert.equal(audit.ok, false);
  assert.equal(audit.errors.includes('independent-verification'), true);
});

test('fen sorusuna ikinci tam destekli seçenek eklenince doğrulama RED verir', () => {
  const item = structuredClone(scienceItems[0]);
  const second = item.content.optionSemantics.find(entry => entry.id === 'A');
  second.support = [...item.content.requiredEvidenceIds];
  second.contradictions = [];
  const audit = auditGrade8ScienceCrossPilotQuestion(item);
  assert.equal(audit.ok, false);
  assert.equal(audit.errors.includes('independent-verification'), true);
});

test('5. sınıf Türkçe doğru seçeneğinden kanıt eksiltilince doğrulama RED verir', () => {
  const item = structuredClone(turkishItems[0]);
  const correct = item.content.optionSemantics.find(entry => entry.correct);
  correct.support = correct.support.slice(0, 1);
  const audit = auditGrade5TurkishCrossPilotQuestion(item);
  assert.equal(audit.ok, false);
  assert.equal(audit.errors.includes('independent-verification'), true);
});
