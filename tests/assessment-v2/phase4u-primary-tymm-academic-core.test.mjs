import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { GRADE1_TURKISH_OUTCOMES_TYMM_2024 } from '../../js/curriculum/outcomes/tr-g1-turkce-tymm-2024.js';
import { GRADE2_TURKISH_OUTCOMES_TYMM_2024 } from '../../js/curriculum/outcomes/tr-g2-turkce-tymm-2024.js';
import { GRADE3_TURKISH_OUTCOMES_TYMM_2024 } from '../../js/curriculum/outcomes/tr-g3-turkce-tymm-2024.js';
import { GRADE1_MATH_OUTCOMES_TYMM_2024 } from '../../js/curriculum/outcomes/tr-g1-matematik-tymm-2024.js';
import { GRADE2_MATH_OUTCOMES_TYMM_2024 } from '../../js/curriculum/outcomes/tr-g2-matematik-tymm-2024.js';
import { GRADE3_MATH_OUTCOMES_TYMM_2024 } from '../../js/curriculum/outcomes/tr-g3-matematik-tymm-2024.js';
import { GRADE1_LIFE_SCIENCE_OUTCOMES_TYMM_2024 } from '../../js/curriculum/outcomes/tr-g1-hayat-bilgisi-tymm-2024.js';
import { GRADE2_LIFE_SCIENCE_OUTCOMES_TYMM_2024 } from '../../js/curriculum/outcomes/tr-g2-hayat-bilgisi-tymm-2024.js';
import { GRADE3_LIFE_SCIENCE_OUTCOMES_TYMM_2024 } from '../../js/curriculum/outcomes/tr-g3-hayat-bilgisi-tymm-2024.js';
import { GRADE1_MOVEMENT_OUTCOMES_TYMM_2024 } from '../../js/curriculum/outcomes/tr-g1-beden-egitimi-ve-oyun-tymm-2024.js';
import { GRADE2_MOVEMENT_OUTCOMES_TYMM_2024 } from '../../js/curriculum/outcomes/tr-g2-beden-egitimi-ve-oyun-tymm-2024.js';
import { GRADE3_MOVEMENT_OUTCOMES_TYMM_2024 } from '../../js/curriculum/outcomes/tr-g3-beden-egitimi-ve-oyun-tymm-2024.js';
import { CURRICULUM_SOURCES } from '../../js/curriculum/curriculum-source-registry.js';
import { PRIMARY_TYMM_SOURCE_EVIDENCE, PRIMARY_TYMM_SOURCE_EVIDENCE_AUDIT } from '../../js/curriculum/primary-tymm-source-evidence.js';
import { COURSE_SCHEDULE_REGISTRY_2026_2027 } from '../../js/curriculum/course-schedule-registry-2026-2027.js';
import { PRIMARY_TYMM_ACADEMIC_CORE_AUDIT, PRIMARY_TYMM_ACADEMIC_ENGINE_RECORDS, buildPrimaryTymmAcademicCoreTasks } from '../../js/assessment-v2/primary-tymm-academic-core-engines.js';
import { PRIMARY_TYMM_ACADEMIC_REVIEW_SAMPLE_AUDIT } from '../../js/assessment-v2/primary-tymm-academic-review-sample.js';
import { ASSESSMENT_V2_PRODUCTION_PORTFOLIO, ASSESSMENT_V2_PRODUCTION_PORTFOLIO_AUDIT } from '../../js/assessment-v2/production-portfolio.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const sets=[GRADE1_TURKISH_OUTCOMES_TYMM_2024,GRADE2_TURKISH_OUTCOMES_TYMM_2024,GRADE3_TURKISH_OUTCOMES_TYMM_2024,GRADE1_MATH_OUTCOMES_TYMM_2024,GRADE2_MATH_OUTCOMES_TYMM_2024,GRADE3_MATH_OUTCOMES_TYMM_2024,GRADE1_LIFE_SCIENCE_OUTCOMES_TYMM_2024,GRADE2_LIFE_SCIENCE_OUTCOMES_TYMM_2024,GRADE3_LIFE_SCIENCE_OUTCOMES_TYMM_2024,GRADE1_MOVEMENT_OUTCOMES_TYMM_2024,GRADE2_MOVEMENT_OUTCOMES_TYMM_2024,GRADE3_MOVEMENT_OUTCOMES_TYMM_2024];
const all=sets.flat();

test('1-3. sınıf akademik çekirdek 17/20/20, 19/25/33, 23/23/20 ve 13/12/13 çıktı taşır',()=>{
  assert.deepEqual(sets.map(rows=>rows.length),[17,20,20,19,25,33,23,23,20,13,12,13]);
  assert.equal(all.length,238);
  assert.equal(new Set(all.map(row=>row.id)).size,238);
  assert.equal(new Set(all.map(row=>`${row.grade}:${row.courseId}:${row.officialOutcomeCode}`)).size,238);
});

test('yerel resmî kaynakların SHA-256 kanıtı ve kaynak kayıtları eşleşir',()=>{
  assert.equal(PRIMARY_TYMM_SOURCE_EVIDENCE_AUDIT.ok,true);
  const sourceIds=new Set(CURRICULUM_SOURCES.map(row=>row.id));
  for(const evidence of PRIMARY_TYMM_SOURCE_EVIDENCE){
    assert.equal(sourceIds.has(evidence.sourceId),true,evidence.sourceId);
    const file=path.join(root,evidence.localDocument);
    assert.equal(fs.existsSync(file),true,file);
    const hash=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
    assert.equal(hash,evidence.sha256,evidence.localDocument);
  }
  assert.equal(all.every(row=>sourceIds.has(row.sourceId)),true);
});

test('çıktılar TYMM yönlendirmesini ve ayrıştırma temizliğini korur',()=>{
  const forbidden=/ÖĞRENME ÇIKTILARI|SÜREÇ BİLEŞENLERİ|PROGRAMLAR ARASI|^\s*$|\s{3,}/i;
  assert.equal(all.every(row=>row.programFamily==='TYMM'&&[1,2,3].includes(row.grade)),true);
  assert.equal(all.some(row=>forbidden.test(row.officialOutcomeText)),false);
  assert.equal(all.every(row=>row.officialOutcomeText.length>=12&&row.sourceLocator.includes(`${row.grade}. sınıf`)),true);
  const lookup=new Map(all.map(row=>[`${row.grade}:${row.courseId}:${row.officialOutcomeCode}`,row.officialOutcomeText]));
  assert.equal(lookup.get('1:matematik:MAT.1.3.3'),'Günlük yaşamdaki nesneleri biçimsel özelliklerine göre ayırt edebilme');
  assert.equal(lookup.get('1:matematik:MAT.1.3.4'),'Günlük yaşamda karşılaşılan geometrik yapılardaki geometrik şekilleri çözümleyebilme');
  assert.equal(lookup.get('1:matematik:MAT.1.3.5'),'Biçimsel özelliklerine göre geometrik şekilleri sınıflandırabilme');
  assert.equal(lookup.get('1:hayat-bilgisi:HB.1.1.4'),'Fiziksel özelliklerini ve temel duygularını açıklayabilme');
});

test('on iki ayrı ders motoru 238 görevi bağımsız doğrulama ve kapalı oyun sözleşmesiyle üretir',()=>{
  const tasks=buildPrimaryTymmAcademicCoreTasks();
  assert.equal(PRIMARY_TYMM_ACADEMIC_CORE_AUDIT.ok,true);
  assert.equal(PRIMARY_TYMM_ACADEMIC_ENGINE_RECORDS.length,12);
  assert.equal(tasks.length,238);
  assert.equal(new Set(tasks.map(item=>item.id)).size,238);
  assert.equal(tasks.every(item=>item.verifier.verified&&item.hints.length===3&&item.misconceptionIds.length>=3&&item.gameBindings.length===0&&item.contentStatus==='HUMAN_REVIEW_REQUIRED'),true);
  assert.equal(PRIMARY_TYMM_ACADEMIC_ENGINE_RECORDS.every(record=>record.engine.verifyIndependent(record.items[0],record.engine.solve(record.items[0]))),true);
});

test('aktif motor hücreleri ders çizelgesine bağlı ve portföy sayaçları dürüsttür',()=>{
  const cells=new Set(COURSE_SCHEDULE_REGISTRY_2026_2027.map(row=>`${row.grade}:${row.courseId}`));
  assert.equal(PRIMARY_TYMM_ACADEMIC_ENGINE_RECORDS.every(record=>cells.has(`${record.grade}:${record.courseId}`)),true);
  assert.equal(ASSESSMENT_V2_PRODUCTION_PORTFOLIO_AUDIT.ok,true,ASSESSMENT_V2_PRODUCTION_PORTFOLIO_AUDIT.errors.join('\n'));
  assert.equal(ASSESSMENT_V2_PRODUCTION_PORTFOLIO.summary.activeEngineCellCount,48);
  assert.equal(ASSESSMENT_V2_PRODUCTION_PORTFOLIO.summary.activeGradeCount,8);
  assert.equal(ASSESSMENT_V2_PRODUCTION_PORTFOLIO.summary.curriculumOutcomeRecordCount,2179);
  assert.equal(ASSESSMENT_V2_PRODUCTION_PORTFOLIO.summary.canonicalQuestionCount,2204);
  assert.equal(ASSESSMENT_V2_PRODUCTION_PORTFOLIO.summary.humanReviewQueueCount,2199);
  assert.equal(ASSESSMENT_V2_PRODUCTION_PORTFOLIO.summary.unmatchedActiveCourseCellCount,0);
});

test('24 görevlik insan inceleme örneklemi hiçbir otomatik onay veya oyun açılışı üretmez',()=>{
  assert.equal(PRIMARY_TYMM_ACADEMIC_REVIEW_SAMPLE_AUDIT.ok,true,PRIMARY_TYMM_ACADEMIC_REVIEW_SAMPLE_AUDIT.errors.join('\n'));
  assert.deepEqual(PRIMARY_TYMM_ACADEMIC_REVIEW_SAMPLE_AUDIT.metrics,{engineCount:12,itemCount:24,perEngine:2,approved:0,pending:24});
});
