import test from 'node:test';
import assert from 'node:assert/strict';
import { GRADE2_ENGLISH_OUTCOMES_TYMM_2025 } from '../../js/curriculum/outcomes/tr-g2-ingilizce-tymm-2025.js';
import { GRADE3_ENGLISH_OUTCOMES_TYMM_2025 } from '../../js/curriculum/outcomes/tr-g3-ingilizce-tymm-2025.js';
import { GRADE3_SCIENCE_OUTCOMES_TYMM_2024 } from '../../js/curriculum/outcomes/tr-g3-fen-tymm-2024.js';
import { GRADE4_SCIENCE_OUTCOMES_2018 } from '../../js/curriculum/outcomes/tr-g4-fen-2018.js';
import { GRADE4_DKAB_OUTCOMES_2018 } from '../../js/curriculum/outcomes/tr-g4-dkab-2018.js';
import { GRADE4_ENGLISH_OUTCOMES_2018 } from '../../js/curriculum/outcomes/tr-g4-ingilizce-2018.js';
import { CURRICULUM_SOURCES } from '../../js/curriculum/curriculum-source-registry.js';
import { COURSE_SCHEDULE_REGISTRY_2026_2027 } from '../../js/curriculum/course-schedule-registry-2026-2027.js';
import { PRIMARY_BRIDGE_CORE_AUDIT, PRIMARY_BRIDGE_ENGINE_RECORDS, buildPrimaryBridgeCoreTasks } from '../../js/assessment-v2/primary-bridge-core-engines.js';
import { PRIMARY_BRIDGE_REVIEW_SAMPLE_AUDIT } from '../../js/assessment-v2/primary-bridge-review-sample.js';
import { ASSESSMENT_V2_PRODUCTION_PORTFOLIO } from '../../js/assessment-v2/production-portfolio.js';

const sets=[GRADE2_ENGLISH_OUTCOMES_TYMM_2025,GRADE3_ENGLISH_OUTCOMES_TYMM_2025,GRADE3_SCIENCE_OUTCOMES_TYMM_2024,GRADE4_SCIENCE_OUTCOMES_2018,GRADE4_DKAB_OUTCOMES_2018,GRADE4_ENGLISH_OUTCOMES_2018];
const all=sets.flat();

test('ilkokul köprü fazı 138/138/20/43/19/47 resmî çıktı taşır',()=>{
  assert.deepEqual(sets.map(x=>x.length),[138,138,20,43,19,47]);
  assert.equal(all.length,405);
  assert.equal(new Set(all.map(x=>x.id)).size,405);
  assert.equal(new Set(all.map(x=>`${x.grade}:${x.courseId}:${x.officialOutcomeCode}`)).size,405);
});

test('2 ve 3. sınıf İngilizce her temada resmî 23 kodluk beceri setini korur',()=>{
  const expected=['L1','L2','L3','L4','P1','R1','R2','R3','R4','V1','G1','S1','S2','S3','S4','S5','S6','W1','W2','W3','W4','W5','W6'];
  for(const [grade,rows] of [[2,GRADE2_ENGLISH_OUTCOMES_TYMM_2025],[3,GRADE3_ENGLISH_OUTCOMES_TYMM_2025]]){
    const units=new Set(rows.map(x=>x.unitId));assert.equal(units.size,6);
    for(const unit of units){const tokens=rows.filter(x=>x.unitId===unit).map(x=>x.officialOutcomeCode.split('.').at(-1)).sort();assert.deepEqual(tokens,[...expected].sort(),`g${grade}:${unit}`);}
  }
});

test('resmî metinlerde ayrıştırma artığı, kesik İngilizce cümlesi veya kaynak boşluğu yoktur',()=>{
  const forbidden=/SÜREÇ BİLEŞENLERİ|ÖĞRENME ÇIKTILARI|Students Students|\bdislik$|\bdrin$|\band$/i;
  assert.equal(all.some(x=>forbidden.test(x.officialOutcomeText)),false);
  const english=[...GRADE2_ENGLISH_OUTCOMES_TYMM_2025,...GRADE3_ENGLISH_OUTCOMES_TYMM_2025,...GRADE4_ENGLISH_OUTCOMES_2018];
  const turkish=[...GRADE3_SCIENCE_OUTCOMES_TYMM_2024,...GRADE4_SCIENCE_OUTCOMES_2018,...GRADE4_DKAB_OUTCOMES_2018];
  assert.equal(english.every(x=>x.officialOutcomeText.length>=18&&(/[.!?]$/.test(x.officialOutcomeText)||/[”"]$/.test(x.officialOutcomeText))),true);
  assert.equal(turkish.every(x=>x.officialOutcomeText.length>=18&&!/-$/.test(x.officialOutcomeText)),true);
  const sourceIds=new Set(CURRICULUM_SOURCES.map(x=>x.id));assert.equal(all.every(x=>sourceIds.has(x.sourceId)),true);
});

test('program yönlendirmesi 2-3 TYMM ve 4 önceki program olarak kalır',()=>{
  assert.equal(GRADE2_ENGLISH_OUTCOMES_TYMM_2025.every(x=>x.programFamily==='TYMM'),true);
  assert.equal([...GRADE3_ENGLISH_OUTCOMES_TYMM_2025,...GRADE3_SCIENCE_OUTCOMES_TYMM_2024].every(x=>x.programFamily==='TYMM'),true);
  assert.equal([...GRADE4_SCIENCE_OUTCOMES_2018,...GRADE4_DKAB_OUTCOMES_2018,...GRADE4_ENGLISH_OUTCOMES_2018].every(x=>x.programFamily==='PRE_TYMM'),true);
});

test('altı köprü motoru 405 görevi bağımsız doğrulama ve kapalı oyun sözleşmesiyle üretir',()=>{
  const items=buildPrimaryBridgeCoreTasks();
  assert.equal(PRIMARY_BRIDGE_CORE_AUDIT.ok,true);
  assert.equal(PRIMARY_BRIDGE_ENGINE_RECORDS.length,6);
  assert.equal(items.length,405);
  assert.equal(new Set(items.map(x=>x.id)).size,405);
  assert.equal(items.every(x=>x.verifier.verified&&x.hints.length===3&&x.misconceptionIds.length>=3&&x.gameBindings.length===0&&x.contentStatus==='HUMAN_REVIEW_REQUIRED'),true);
  assert.equal(PRIMARY_BRIDGE_ENGINE_RECORDS.every(r=>r.engine.verifyIndependent(r.items[0],r.engine.solve(r.items[0]))),true);
});

test('aktif köprü motorları ders çizelgesi hücreleriyle eşleşir ve kapsam sayaçları dürüsttür',()=>{
  const cells=new Set(COURSE_SCHEDULE_REGISTRY_2026_2027.map(x=>`${x.grade}:${x.courseId}`));
  assert.equal(PRIMARY_BRIDGE_ENGINE_RECORDS.every(r=>cells.has(`${r.grade}:${r.courseId}`)),true);
  assert.equal(ASSESSMENT_V2_PRODUCTION_PORTFOLIO.summary.activeEngineCellCount,51);
  assert.equal(ASSESSMENT_V2_PRODUCTION_PORTFOLIO.summary.canonicalQuestionCount,2234);
  assert.equal(ASSESSMENT_V2_PRODUCTION_PORTFOLIO.summary.unmatchedActiveCourseCellCount,0);
});

test('18 görevlik köprü inceleme örneklemi otomatik insan onayı üretmez',()=>{
  assert.equal(PRIMARY_BRIDGE_REVIEW_SAMPLE_AUDIT.ok,true,PRIMARY_BRIDGE_REVIEW_SAMPLE_AUDIT.errors.join('\n'));
  assert.deepEqual(PRIMARY_BRIDGE_REVIEW_SAMPLE_AUDIT.metrics,{engineCount:6,itemCount:18,perEngine:3,approved:0,pending:18});
});
