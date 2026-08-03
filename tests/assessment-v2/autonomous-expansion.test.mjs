import test from 'node:test';
import assert from 'node:assert/strict';
import { ASSESSMENT_V2_CANONICAL_CATALOG, ASSESSMENT_V2_CANONICAL_CATALOG_AUDIT, auditAssessmentV2CanonicalCatalog } from '../../js/assessment-v2/canonical-catalog.js';
import { ASSESSMENT_V2_HUMAN_REVIEW_QUEUE, ASSESSMENT_V2_HUMAN_REVIEW_QUEUE_AUDIT, auditAssessmentV2HumanReviewQueue } from '../../js/assessment-v2/human-review-queue.js';
import { ASSESSMENT_V2_AUTONOMOUS_EXPANSION_PLAN, ASSESSMENT_V2_AUTONOMOUS_EXPANSION_PLAN_AUDIT } from '../../js/assessment-v2/autonomous-expansion-plan.js';

test('kanonik katalog on iki aktif ders motorundan 717 benzersiz görev toplar',()=>{
  assert.equal(ASSESSMENT_V2_CANONICAL_CATALOG_AUDIT.ok,true,ASSESSMENT_V2_CANONICAL_CATALOG_AUDIT.errors.join('\n'));
  assert.equal(ASSESSMENT_V2_CANONICAL_CATALOG.length,717);
  assert.deepEqual(ASSESSMENT_V2_CANONICAL_CATALOG_AUDIT.metrics.byEngine,{
    'g8:turkce':96,'g8:matematik':52,'g8:fen-bilimleri':61,'g5:turkce':105,
    'g8:t-c-inkilap-tarihi-ve-ataturkculuk':33,'g8:din-kulturu-ve-ahlak-bilgisi':28,'g8:ingilizce':70,'g5:matematik':23,'g5:fen-bilimleri':28,'g5:sosyal-bilgiler':19,
    'g5:din-kulturu-ve-ahlak-bilgisi':18,'g5:yabanci-dil':184
  });
});

test('insan inceleme kuyruğu 5 onaylı ve 712 bekleyen görevi önceliklendirir',()=>{
  assert.equal(ASSESSMENT_V2_HUMAN_REVIEW_QUEUE_AUDIT.ok,true,ASSESSMENT_V2_HUMAN_REVIEW_QUEUE_AUDIT.errors.join('\n'));
  assert.equal(ASSESSMENT_V2_HUMAN_REVIEW_QUEUE.metrics.total,717);
  assert.equal(ASSESSMENT_V2_HUMAN_REVIEW_QUEUE.metrics.approved,5);
  assert.equal(ASSESSMENT_V2_HUMAN_REVIEW_QUEUE.metrics.pending,712);
  assert.equal(ASSESSMENT_V2_HUMAN_REVIEW_QUEUE.rows.every(row=>row.gameAdaptationAllowed===false),true);
});

test('otonom plan on iki aktif motorun mühendislik kapsamını tam ve insan incelemesini açık gösterir',()=>{
  assert.equal(ASSESSMENT_V2_AUTONOMOUS_EXPANSION_PLAN_AUDIT.ok,true,ASSESSMENT_V2_AUTONOMOUS_EXPANSION_PLAN_AUDIT.errors.join('\n'));
  assert.equal(ASSESSMENT_V2_AUTONOMOUS_EXPANSION_PLAN.engines.length,12);
  assert.equal(ASSESSMENT_V2_AUTONOMOUS_EXPANSION_PLAN.engines.every(row=>row.engineeringScopeComplete),true);
  assert.equal(ASSESSMENT_V2_AUTONOMOUS_EXPANSION_PLAN.metrics.remainingOutcomeCount,0);
  assert.equal(ASSESSMENT_V2_AUTONOMOUS_EXPANSION_PLAN.metrics.humanReviewQueueCount,712);
  assert.equal(ASSESSMENT_V2_AUTONOMOUS_EXPANSION_PLAN.backlog[0].id,'calibrate-risk-sample');
});

test('oyun bağı veya ürün hazır mutasyonu katalog ve kuyruk kapılarında RED verir',()=>{
  const catalog=structuredClone(ASSESSMENT_V2_CANONICAL_CATALOG);catalog[0].gameBindings.push({gameId:'forbidden'});
  assert.equal(auditAssessmentV2CanonicalCatalog(catalog).ok,false);
  const queue=structuredClone(ASSESSMENT_V2_HUMAN_REVIEW_QUEUE);queue.productReady=true;queue.rows[0].gameAdaptationAllowed=true;
  assert.equal(auditAssessmentV2HumanReviewQueue(queue).ok,false);
});
