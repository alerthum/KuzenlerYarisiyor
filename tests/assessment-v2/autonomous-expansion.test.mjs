import test from 'node:test';
import assert from 'node:assert/strict';
import { ASSESSMENT_V2_CANONICAL_CATALOG, ASSESSMENT_V2_CANONICAL_CATALOG_AUDIT, auditAssessmentV2CanonicalCatalog } from '../../js/assessment-v2/canonical-catalog.js';
import { ASSESSMENT_V2_HUMAN_REVIEW_QUEUE, ASSESSMENT_V2_HUMAN_REVIEW_QUEUE_AUDIT, auditAssessmentV2HumanReviewQueue } from '../../js/assessment-v2/human-review-queue.js';
import { ASSESSMENT_V2_AUTONOMOUS_EXPANSION_PLAN, ASSESSMENT_V2_AUTONOMOUS_EXPANSION_PLAN_AUDIT } from '../../js/assessment-v2/autonomous-expansion-plan.js';

test('kanonik katalog dört aktif ders motorundan 161 benzersiz görev toplar',()=>{
  assert.equal(ASSESSMENT_V2_CANONICAL_CATALOG_AUDIT.ok,true,ASSESSMENT_V2_CANONICAL_CATALOG_AUDIT.errors.join('\n'));
  assert.equal(ASSESSMENT_V2_CANONICAL_CATALOG.length,161);
  assert.deepEqual(ASSESSMENT_V2_CANONICAL_CATALOG_AUDIT.metrics.byEngine,{
    'g8:turkce':51,
    'g8:matematik':52,
    'g8:fen-bilimleri':33,
    'g5:turkce':25
  });
});

test('insan inceleme kuyruğu 5 onaylı ve 156 bekleyen görevi önceliklendirir',()=>{
  assert.equal(ASSESSMENT_V2_HUMAN_REVIEW_QUEUE_AUDIT.ok,true,ASSESSMENT_V2_HUMAN_REVIEW_QUEUE_AUDIT.errors.join('\n'));
  assert.equal(ASSESSMENT_V2_HUMAN_REVIEW_QUEUE.metrics.total,161);
  assert.equal(ASSESSMENT_V2_HUMAN_REVIEW_QUEUE.metrics.approved,5);
  assert.equal(ASSESSMENT_V2_HUMAN_REVIEW_QUEUE.metrics.pending,156);
  assert.equal(ASSESSMENT_V2_HUMAN_REVIEW_QUEUE.rows.every(row=>row.gameAdaptationAllowed===false),true);
});

test('otonom genişleme planı mühendislik kapsamı tamamlanan Matematik ile kalan açıkları ayırır',()=>{
  assert.equal(ASSESSMENT_V2_AUTONOMOUS_EXPANSION_PLAN_AUDIT.ok,true,ASSESSMENT_V2_AUTONOMOUS_EXPANSION_PLAN_AUDIT.errors.join('\n'));
  const math=ASSESSMENT_V2_AUTONOMOUS_EXPANSION_PLAN.engines.find(row=>row.courseId==='matematik');
  assert.equal(math.engineeringScopeComplete,true);
  assert.equal(math.remainingOutcomeCount,0);
  assert.equal(ASSESSMENT_V2_AUTONOMOUS_EXPANSION_PLAN.metrics.remainingOutcomeCount,148);
  assert.equal(ASSESSMENT_V2_AUTONOMOUS_EXPANSION_PLAN.backlog[0].id,'review-g8-math');
});

test('oyun bağı veya ürün hazır mutasyonu katalog ve kuyruk kapılarında RED verir',()=>{
  const catalog=structuredClone(ASSESSMENT_V2_CANONICAL_CATALOG);
  catalog[0].gameBindings.push({gameId:'forbidden'});
  assert.equal(auditAssessmentV2CanonicalCatalog(catalog).ok,false);
  const queue=structuredClone(ASSESSMENT_V2_HUMAN_REVIEW_QUEUE);
  queue.productReady=true;
  queue.rows[0].gameAdaptationAllowed=true;
  assert.equal(auditAssessmentV2HumanReviewQueue(queue).ok,false);
});
