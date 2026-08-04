import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GRADE5_MUSIC_OUTCOMES_TYMM_2024 } from '../../js/curriculum/outcomes/tr-g5-muzik-tymm-2024.js';
import { GRADE6_MUSIC_OUTCOMES_TYMM_2024 } from '../../js/curriculum/outcomes/tr-g6-muzik-tymm-2024.js';
import { GRADE7_MUSIC_OUTCOMES_TYMM_2024 } from '../../js/curriculum/outcomes/tr-g7-muzik-tymm-2024.js';
import { PRIMARY_TYMM_SOURCE_EVIDENCE } from '../../js/curriculum/primary-tymm-source-evidence.js';
import { COURSE_SCHEDULE_REGISTRY_2026_2027 } from '../../js/curriculum/course-schedule-registry-2026-2027.js';
import { MIDDLE_SCHOOL_TYMM_MUSIC_AUDIT, MIDDLE_SCHOOL_TYMM_MUSIC_ENGINE_RECORDS, buildMiddleSchoolTymmMusicTasks } from '../../js/assessment-v2/middle-school-tymm-music-engines.js';
import { MIDDLE_SCHOOL_TYMM_MUSIC_REVIEW_SAMPLE_AUDIT } from '../../js/assessment-v2/middle-school-tymm-music-review-sample.js';
import { ASSESSMENT_V2_PRODUCTION_PORTFOLIO, ASSESSMENT_V2_PRODUCTION_PORTFOLIO_AUDIT } from '../../js/assessment-v2/production-portfolio.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const sets=[GRADE5_MUSIC_OUTCOMES_TYMM_2024,GRADE6_MUSIC_OUTCOMES_TYMM_2024,GRADE7_MUSIC_OUTCOMES_TYMM_2024];const all=sets.flat();

test('5-7. sınıf Müzik programı 15, 13 ve 16 resmî çıktı taşır',()=>{assert.deepEqual(sets.map(rows=>rows.length),[15,13,16]);assert.equal(all.length,44);assert.equal(new Set(all.map(row=>`${row.grade}:${row.officialOutcomeCode}`)).size,44);});

test('Müzik 1-8 temel eğitim PDF kanıtı yerel hash ve 5-7 TYMM yönlendirmesiyle doğrulanır',()=>{const evidence=PRIMARY_TYMM_SOURCE_EVIDENCE.find(row=>row.sourceId==='meb-tymm-primary-music-1-8-2024');assert.ok(evidence);assert.deepEqual(evidence.grades,[1,2,3,5,6,7]);const file=path.join(root,evidence.localDocument);assert.equal(fs.existsSync(file),true);assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),evidence.sha256);assert.equal(evidence.status,'LOCAL_AUTHORITATIVE_EVIDENCE_VERIFIED');});

test('5-7. sınıf Müzik çıktıları ayrıştırma artığı ve kesik cümle içermez',()=>{const forbidden=/ÖĞRENME ÇIKTILARI|SÜREÇ BİLEŞENLERİ|ÖĞRENME KANITLARI|FARKLILAŞTIRMA|^[a-zçğıöşü]\)|\s{3,}/i;assert.equal(all.every(row=>row.programFamily==='TYMM'&&[5,6,7].includes(row.grade)&&row.courseId==='muzik'),true);assert.equal(all.some(row=>forbidden.test(row.officialOutcomeText)),false);assert.equal(all.every(row=>row.officialOutcomeText.length>=18&&row.sourceLocator.includes(`${row.grade}. sınıf`)),true);});

test('üç ayrı ortaokul Müzik motoru 44 görevi ses, rubrik ve insan inceleme kilidiyle üretir',()=>{const tasks=buildMiddleSchoolTymmMusicTasks();assert.equal(MIDDLE_SCHOOL_TYMM_MUSIC_AUDIT.ok,true);assert.equal(MIDDLE_SCHOOL_TYMM_MUSIC_ENGINE_RECORDS.length,3);assert.equal(tasks.length,44);assert.equal(tasks.every(item=>item.hints.length===3&&item.misconceptionIds.length>=3&&item.content.media.status==='LICENSED_OR_HUMAN_RECORDED_MUSIC_AUDIO_REQUIRED'&&item.gameBindings.length===0),true);});

test('ortaokul Müzik hücreleri ders çizelgesine bağlı ve ürün sayaçları günceldir',()=>{const cells=new Set(COURSE_SCHEDULE_REGISTRY_2026_2027.map(row=>`${row.grade}:${row.courseId}`));assert.equal(MIDDLE_SCHOOL_TYMM_MUSIC_ENGINE_RECORDS.every(record=>cells.has(`${record.grade}:muzik`)),true);assert.equal(ASSESSMENT_V2_PRODUCTION_PORTFOLIO_AUDIT.ok,true,ASSESSMENT_V2_PRODUCTION_PORTFOLIO_AUDIT.errors.join('\n'));assert.equal(ASSESSMENT_V2_PRODUCTION_PORTFOLIO.summary.activeEngineCellCount,56);assert.equal(ASSESSMENT_V2_PRODUCTION_PORTFOLIO.summary.curriculumOutcomeRecordCount,2302);assert.equal(ASSESSMENT_V2_PRODUCTION_PORTFOLIO.summary.canonicalQuestionCount,2327);assert.equal(ASSESSMENT_V2_PRODUCTION_PORTFOLIO.summary.humanReviewQueueCount,2322);});

test('altı görevlik ortaokul Müzik örneklemi otomatik onay veya oyun açılışı üretmez',()=>{assert.equal(MIDDLE_SCHOOL_TYMM_MUSIC_REVIEW_SAMPLE_AUDIT.ok,true,MIDDLE_SCHOOL_TYMM_MUSIC_REVIEW_SAMPLE_AUDIT.errors.join('\n'));assert.deepEqual(MIDDLE_SCHOOL_TYMM_MUSIC_REVIEW_SAMPLE_AUDIT.metrics,{engineCount:3,itemCount:6,perEngine:2,approved:0,pending:6});});
