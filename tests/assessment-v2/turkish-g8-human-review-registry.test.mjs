import test from 'node:test';
import assert from 'node:assert/strict';
import { GRADE8_TURKISH_HUMAN_REVIEW_DECISIONS, auditGrade8TurkishHumanReviewRegistry } from '../../js/assessment-v2/turkish-g8-human-review-registry.js';

test('kullanıcının kabul ettiği Pilot-02 beşlisi insan inceleme kaydına işlenir', () => {
  const audit = auditGrade8TurkishHumanReviewRegistry();
  assert.equal(audit.ok, true, audit.errors.join('\n'));
  assert.equal(GRADE8_TURKISH_HUMAN_REVIEW_DECISIONS.length, 5);
  assert.equal(GRADE8_TURKISH_HUMAN_REVIEW_DECISIONS.every(row => row.decision === 'APPROVED_FOR_NEXT_WAVE'), true);
});

test('tam ders kapsamı tamamlanmadan insan onayı oyun adaptasyonunu açmaz', () => {
  assert.equal(GRADE8_TURKISH_HUMAN_REVIEW_DECISIONS.every(row => row.gameAdaptationAllowed === false), true);
});
