import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GRADE1_VISUAL_ARTS_OUTCOMES_TYMM_2024 } from '../../js/curriculum/outcomes/tr-g1-gorsel-sanatlar-tymm-2024.js';
import { GRADE2_VISUAL_ARTS_OUTCOMES_TYMM_2024 } from '../../js/curriculum/outcomes/tr-g2-gorsel-sanatlar-tymm-2024.js';
import { GRADE3_VISUAL_ARTS_OUTCOMES_TYMM_2024 } from '../../js/curriculum/outcomes/tr-g3-gorsel-sanatlar-tymm-2024.js';
import { CURRICULUM_SOURCES } from '../../js/curriculum/curriculum-source-registry.js';
import { PRIMARY_TYMM_SOURCE_EVIDENCE, PRIMARY_TYMM_SOURCE_EVIDENCE_AUDIT } from '../../js/curriculum/primary-tymm-source-evidence.js';
import { COURSE_SCHEDULE_REGISTRY_2026_2027 } from '../../js/curriculum/course-schedule-registry-2026-2027.js';
import { PRIMARY_TYMM_VISUAL_ARTS_AUDIT, PRIMARY_TYMM_VISUAL_ARTS_ENGINE_RECORDS, buildPrimaryTymmVisualArtsTasks } from '../../js/assessment-v2/primary-tymm-visual-arts-engines.js';
import { PRIMARY_TYMM_VISUAL_ARTS_REVIEW_SAMPLE_AUDIT } from '../../js/assessment-v2/primary-tymm-visual-arts-review-sample.js';
import { ASSESSMENT_V2_PRODUCTION_PORTFOLIO, ASSESSMENT_V2_PRODUCTION_PORTFOLIO_AUDIT } from '../../js/assessment-v2/production-portfolio.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const sets=[GRADE1_VISUAL_ARTS_OUTCOMES_TYMM_2024,GRADE2_VISUAL_ARTS_OUTCOMES_TYMM_2024,GRADE3_VISUAL_ARTS_OUTCOMES_TYMM_2024];
const all=sets.flat();

test('1-3. sınıf Görsel Sanatlar programı her sınıfta 11 resmî çıktı taşır',()=>{
  assert.deepEqual(sets.map(rows=>rows.length),[11,11,11]);
  assert.equal(all.length,33);
  assert.equal(new Set(all.map(row=>row.id)).size,33);
  assert.equal(new Set(all.map(row=>`${row.grade}:${row.officialOutcomeCode}`)).size,33);
});

test('Görsel Sanatlar kaynağı yerel PDF hash kanıtı ve resmî kaynak kaydıyla eşleşir',()=>{
  assert.equal(PRIMARY_TYMM_SOURCE_EVIDENCE_AUDIT.ok,true);
  const evidence=PRIMARY_TYMM_SOURCE_EVIDENCE.find(row=>row.sourceId==='meb-tymm-visual-arts-1-8-2024');
  assert.ok(evidence);
  assert.equal(CURRICULUM_SOURCES.some(row=>row.id===evidence.sourceId&&row.useMode==='AUTHORITATIVE_DATA'),true);
  const file=path.join(root,evidence.localDocument);
  assert.equal(fs.existsSync(file),true);
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),evidence.sha256);
});

test('Görsel Sanatlar çıktıları ayrıştırma artığı, kesik cümle veya yanlış program yönlendirmesi içermez',()=>{
  const forbidden=/ÖĞRENME ÇIKTILARI|SÜREÇ BİLEŞENLERİ|ÖĞRENME KANITLARI|FARKLILAŞTIRMA|\s{3,}|^[a-zçğıöşü]\)/i;
  assert.equal(all.every(row=>row.programFamily==='TYMM'&&[1,2,3].includes(row.grade)&&row.courseId==='gorsel-sanatlar'),true);
  assert.equal(all.some(row=>forbidden.test(row.officialOutcomeText)),false);
  assert.equal(all.every(row=>row.officialOutcomeText.length>=18&&row.sourceLocator.includes(`${row.grade}. sınıf`)),true);
});

test('üç ayrı Görsel Sanatlar motoru 33 görevi gerçek eser/ürün ve insan inceleme kilidiyle üretir',()=>{
  const tasks=buildPrimaryTymmVisualArtsTasks();
  assert.equal(PRIMARY_TYMM_VISUAL_ARTS_AUDIT.ok,true);
  assert.equal(PRIMARY_TYMM_VISUAL_ARTS_ENGINE_RECORDS.length,3);
  assert.equal(tasks.length,33);
  assert.equal(tasks.every(item=>item.hints.length===3&&item.misconceptionIds.length>=3&&item.gameBindings.length===0&&item.contentStatus==='HUMAN_REVIEW_REQUIRED'),true);
  assert.equal(tasks.every(item=>item.content.media.status==='REAL_ARTWORK_OR_STUDENT_MATERIAL_REQUIRED'),true);
  assert.equal(PRIMARY_TYMM_VISUAL_ARTS_ENGINE_RECORDS.every(record=>record.engine.verifyIndependent(record.items[0],record.engine.solve(record.items[0]))),true);
});

test('Görsel Sanatlar motor hücreleri ders çizelgesine bağlı ve ürün sayaçları günceldir',()=>{
  const cells=new Set(COURSE_SCHEDULE_REGISTRY_2026_2027.map(row=>`${row.grade}:${row.courseId}`));
  assert.equal(PRIMARY_TYMM_VISUAL_ARTS_ENGINE_RECORDS.every(record=>cells.has(`${record.grade}:gorsel-sanatlar`)),true);
  assert.equal(ASSESSMENT_V2_PRODUCTION_PORTFOLIO_AUDIT.ok,true,ASSESSMENT_V2_PRODUCTION_PORTFOLIO_AUDIT.errors.join('\n'));
  assert.equal(ASSESSMENT_V2_PRODUCTION_PORTFOLIO.summary.activeEngineCellCount,45);
  assert.equal(ASSESSMENT_V2_PRODUCTION_PORTFOLIO.summary.curriculumOutcomeRecordCount,2142);
  assert.equal(ASSESSMENT_V2_PRODUCTION_PORTFOLIO.summary.canonicalQuestionCount,2167);
  assert.equal(ASSESSMENT_V2_PRODUCTION_PORTFOLIO.summary.humanReviewQueueCount,2162);
  assert.equal(ASSESSMENT_V2_PRODUCTION_PORTFOLIO.summary.unmatchedActiveCourseCellCount,0);
});

test('altı görevlik Görsel Sanatlar örneklemi otomatik onay veya oyun açılışı üretmez',()=>{
  assert.equal(PRIMARY_TYMM_VISUAL_ARTS_REVIEW_SAMPLE_AUDIT.ok,true,PRIMARY_TYMM_VISUAL_ARTS_REVIEW_SAMPLE_AUDIT.errors.join('\n'));
  assert.deepEqual(PRIMARY_TYMM_VISUAL_ARTS_REVIEW_SAMPLE_AUDIT.metrics,{engineCount:3,itemCount:6,perEngine:2,approved:0,pending:6});
});
