import test from 'node:test';
import assert from 'node:assert/strict';
import { GRADE5_VISUAL_ARTS_OUTCOMES_TYMM_2024 } from '../../js/curriculum/outcomes/tr-g5-gorsel-sanatlar-tymm-2024.js';
import { GRADE6_VISUAL_ARTS_OUTCOMES_TYMM_2024 } from '../../js/curriculum/outcomes/tr-g6-gorsel-sanatlar-tymm-2024.js';
import { GRADE7_VISUAL_ARTS_OUTCOMES_TYMM_2024 } from '../../js/curriculum/outcomes/tr-g7-gorsel-sanatlar-tymm-2024.js';
import { COURSE_SCHEDULE_REGISTRY_2026_2027 } from '../../js/curriculum/course-schedule-registry-2026-2027.js';
import { MIDDLE_SCHOOL_TYMM_VISUAL_ARTS_AUDIT, MIDDLE_SCHOOL_TYMM_VISUAL_ARTS_ENGINE_RECORDS, buildMiddleSchoolTymmVisualArtsTasks } from '../../js/assessment-v2/middle-school-tymm-visual-arts-engines.js';
import { MIDDLE_SCHOOL_TYMM_VISUAL_ARTS_REVIEW_SAMPLE_AUDIT } from '../../js/assessment-v2/middle-school-tymm-visual-arts-review-sample.js';
import { ASSESSMENT_V2_PRODUCTION_PORTFOLIO, ASSESSMENT_V2_PRODUCTION_PORTFOLIO_AUDIT } from '../../js/assessment-v2/production-portfolio.js';

const sets=[GRADE5_VISUAL_ARTS_OUTCOMES_TYMM_2024,GRADE6_VISUAL_ARTS_OUTCOMES_TYMM_2024,GRADE7_VISUAL_ARTS_OUTCOMES_TYMM_2024];
const all=sets.flat();

test('5-7. sınıf Görsel Sanatlar programı her sınıfta 10 resmî çıktı taşır',()=>{assert.deepEqual(sets.map(rows=>rows.length),[10,10,10]);assert.equal(all.length,30);assert.equal(new Set(all.map(row=>`${row.grade}:${row.officialOutcomeCode}`)).size,30);});

test('5-7. sınıf çıktıları resmî TYMM Görsel Sanatlar kaynağına ve aktif program yönlendirmesine bağlıdır',()=>{assert.equal(all.every(row=>row.programFamily==='TYMM'&&[5,6,7].includes(row.grade)&&row.sourceId==='meb-tymm-visual-arts-1-8-2024'),true);assert.equal(all.some(row=>/ÖĞRENME ÇIKTILARI|SÜREÇ BİLEŞENLERİ|FARKLILAŞTIRMA|\s{3,}/i.test(row.officialOutcomeText)),false);});

test('üç ayrı ortaokul Görsel Sanatlar motoru 30 görevi gerçek eser/ürün kilidiyle üretir',()=>{const tasks=buildMiddleSchoolTymmVisualArtsTasks();assert.equal(MIDDLE_SCHOOL_TYMM_VISUAL_ARTS_AUDIT.ok,true);assert.equal(MIDDLE_SCHOOL_TYMM_VISUAL_ARTS_ENGINE_RECORDS.length,3);assert.equal(tasks.length,30);assert.equal(tasks.every(item=>item.hints.length===3&&item.misconceptionIds.length>=3&&item.content.media.status==='REAL_ARTWORK_OR_STUDENT_MATERIAL_REQUIRED'&&item.gameBindings.length===0),true);});

test('ortaokul Görsel Sanatlar hücreleri ders çizelgesine bağlı ve ürün sayaçları günceldir',()=>{const cells=new Set(COURSE_SCHEDULE_REGISTRY_2026_2027.map(row=>`${row.grade}:${row.courseId}`));assert.equal(MIDDLE_SCHOOL_TYMM_VISUAL_ARTS_ENGINE_RECORDS.every(record=>cells.has(`${record.grade}:gorsel-sanatlar`)),true);assert.equal(ASSESSMENT_V2_PRODUCTION_PORTFOLIO_AUDIT.ok,true,ASSESSMENT_V2_PRODUCTION_PORTFOLIO_AUDIT.errors.join('\n'));assert.equal(ASSESSMENT_V2_PRODUCTION_PORTFOLIO.summary.activeEngineCellCount,67);assert.equal(ASSESSMENT_V2_PRODUCTION_PORTFOLIO.summary.curriculumOutcomeRecordCount,2642);assert.equal(ASSESSMENT_V2_PRODUCTION_PORTFOLIO.summary.canonicalQuestionCount,2667);assert.equal(ASSESSMENT_V2_PRODUCTION_PORTFOLIO.summary.humanReviewQueueCount,2662);});

test('altı görevlik ortaokul Görsel Sanatlar örneklemi otomatik onay veya oyun açılışı üretmez',()=>{assert.equal(MIDDLE_SCHOOL_TYMM_VISUAL_ARTS_REVIEW_SAMPLE_AUDIT.ok,true,MIDDLE_SCHOOL_TYMM_VISUAL_ARTS_REVIEW_SAMPLE_AUDIT.errors.join('\n'));assert.deepEqual(MIDDLE_SCHOOL_TYMM_VISUAL_ARTS_REVIEW_SAMPLE_AUDIT.metrics,{engineCount:3,itemCount:6,perEngine:2,approved:0,pending:6});});
