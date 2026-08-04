import test from 'node:test';
import assert from 'node:assert/strict';
import { ASSESSMENT_V2_CANONICAL_CATALOG, ASSESSMENT_V2_CANONICAL_CATALOG_AUDIT, auditAssessmentV2CanonicalCatalog } from '../../js/assessment-v2/canonical-catalog.js';
import { ASSESSMENT_V2_HUMAN_REVIEW_QUEUE, ASSESSMENT_V2_HUMAN_REVIEW_QUEUE_AUDIT, auditAssessmentV2HumanReviewQueue } from '../../js/assessment-v2/human-review-queue.js';
import { ASSESSMENT_V2_AUTONOMOUS_EXPANSION_PLAN, ASSESSMENT_V2_AUTONOMOUS_EXPANSION_PLAN_AUDIT } from '../../js/assessment-v2/autonomous-expansion-plan.js';

test('kanonik katalog altmış yedi aktif ders motorundan 2667 benzersiz görev toplar',()=>{
  assert.equal(ASSESSMENT_V2_CANONICAL_CATALOG_AUDIT.ok,true,ASSESSMENT_V2_CANONICAL_CATALOG_AUDIT.errors.join('\n'));
  assert.equal(ASSESSMENT_V2_CANONICAL_CATALOG.length,2667);
  assert.deepEqual(ASSESSMENT_V2_CANONICAL_CATALOG_AUDIT.metrics.byEngine,{
    'g8:turkce':96,'g8:matematik':52,'g8:fen-bilimleri':61,'g5:turkce':105,
    'g8:t-c-inkilap-tarihi-ve-ataturkculuk':33,'g8:din-kulturu-ve-ahlak-bilgisi':28,'g8:ingilizce':70,'g5:matematik':23,'g5:fen-bilimleri':28,'g5:sosyal-bilgiler':19,
    'g5:din-kulturu-ve-ahlak-bilgisi':18,'g5:yabanci-dil':184,
    'g6:turkce':100,'g6:matematik':24,'g6:fen-bilimleri':36,'g6:sosyal-bilgiler':18,'g6:din-kulturu-ve-ahlak-bilgisi':18,'g6:yabanci-dil':184,
    'g7:turkce':103,'g7:matematik':30,'g7:fen-bilimleri':36,'g7:sosyal-bilgiler':17,'g7:din-kulturu-ve-ahlak-bilgisi':17,'g7:yabanci-dil':191,
    'g2:yabanci-dil':138,'g3:yabanci-dil':138,'g3:fen-bilimleri':20,'g4:fen-bilimleri':43,'g4:din-kulturu-ve-ahlak-bilgisi':19,'g4:yabanci-dil':47,
    'g1:turkce':17,'g2:turkce':20,'g3:turkce':20,'g1:matematik':19,'g2:matematik':25,'g3:matematik':33,
    'g1:hayat-bilgisi':23,'g2:hayat-bilgisi':23,'g3:hayat-bilgisi':20,'g1:beden-egitimi-ve-oyun':13,'g2:beden-egitimi-ve-oyun':12,'g3:beden-egitimi-ve-oyun':13,
    'g1:gorsel-sanatlar':11,'g2:gorsel-sanatlar':11,'g3:gorsel-sanatlar':11,
    'g1:muzik':13,'g2:muzik':12,'g3:muzik':12,
    'g5:gorsel-sanatlar':10,'g6:gorsel-sanatlar':10,'g7:gorsel-sanatlar':10,
    'g5:muzik':15,'g6:muzik':13,'g7:muzik':16,
    'g5:bilisim-teknolojileri-ve-yazilim':24,'g6:bilisim-teknolojileri-ve-yazilim':25,
    'g5:beden-egitimi-ve-spor':16,'g6:beden-egitimi-ve-spor':17,'g7:beden-egitimi-ve-spor':15,
    'g4:turkce':76,'g4:matematik':71,'g4:sosyal-bilgiler':33,'g4:insan-haklari-vatandaslik-ve-demokrasi':29,
    'g4:gorsel-sanatlar':16,'g4:muzik':21,'g4:beden-egitimi-ve-oyun':25,'g4:trafik-guvenligi':21
  });
});

test('insan inceleme kuyruğu 5 onaylı ve 2662 bekleyen görevi önceliklendirir',()=>{
  assert.equal(ASSESSMENT_V2_HUMAN_REVIEW_QUEUE_AUDIT.ok,true,ASSESSMENT_V2_HUMAN_REVIEW_QUEUE_AUDIT.errors.join('\n'));
  assert.equal(ASSESSMENT_V2_HUMAN_REVIEW_QUEUE.metrics.total,2667);
  assert.equal(ASSESSMENT_V2_HUMAN_REVIEW_QUEUE.metrics.approved,5);
  assert.equal(ASSESSMENT_V2_HUMAN_REVIEW_QUEUE.metrics.pending,2662);
  assert.equal(ASSESSMENT_V2_HUMAN_REVIEW_QUEUE.rows.every(row=>row.gameAdaptationAllowed===false),true);
});

test('otonom plan altmış yedi aktif motorun mühendislik kapsamını tam ve insan incelemesini açık gösterir',()=>{
  assert.equal(ASSESSMENT_V2_AUTONOMOUS_EXPANSION_PLAN_AUDIT.ok,true,ASSESSMENT_V2_AUTONOMOUS_EXPANSION_PLAN_AUDIT.errors.join('\n'));
  assert.equal(ASSESSMENT_V2_AUTONOMOUS_EXPANSION_PLAN.engines.length,67);
  assert.equal(ASSESSMENT_V2_AUTONOMOUS_EXPANSION_PLAN.engines.every(row=>row.engineeringScopeComplete),true);
  assert.equal(ASSESSMENT_V2_AUTONOMOUS_EXPANSION_PLAN.metrics.remainingOutcomeCount,0);
  assert.equal(ASSESSMENT_V2_AUTONOMOUS_EXPANSION_PLAN.metrics.humanReviewQueueCount,2662);
  assert.equal(ASSESSMENT_V2_AUTONOMOUS_EXPANSION_PLAN.backlog[0].id,'calibrate-risk-sample');
});

test('oyun bağı veya ürün hazır mutasyonu katalog ve kuyruk kapılarında RED verir',()=>{
  const catalog=structuredClone(ASSESSMENT_V2_CANONICAL_CATALOG);catalog[0].gameBindings.push({gameId:'forbidden'});
  assert.equal(auditAssessmentV2CanonicalCatalog(catalog).ok,false);
  const queue=structuredClone(ASSESSMENT_V2_HUMAN_REVIEW_QUEUE);queue.productReady=true;queue.rows[0].gameAdaptationAllowed=true;
  assert.equal(auditAssessmentV2HumanReviewQueue(queue).ok,false);
});
