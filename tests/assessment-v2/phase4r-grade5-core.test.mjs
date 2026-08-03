import test from 'node:test';
import assert from 'node:assert/strict';
import { CURRICULUM_SOURCES } from '../../js/curriculum/curriculum-source-registry.js';
import { COURSE_SCHEDULE_REGISTRY_2026_2027 } from '../../js/curriculum/course-schedule-registry-2026-2027.js';
import { GRADE5_MATH_OUTCOMES_TYMM_2024 } from '../../js/curriculum/outcomes/tr-g5-matematik-tymm-2024.js';
import { GRADE5_SCIENCE_OUTCOMES_TYMM_2024 } from '../../js/curriculum/outcomes/tr-g5-fen-tymm-2024.js';
import { GRADE5_SOCIAL_OUTCOMES_TYMM_2024 } from '../../js/curriculum/outcomes/tr-g5-sosyal-tymm-2024.js';
import { GRADE5_DKAB_OUTCOMES_TYMM_2024 } from '../../js/curriculum/outcomes/tr-g5-dkab-tymm-2024.js';
import { GRADE5_ENGLISH_OUTCOMES_TYMM_2025 } from '../../js/curriculum/outcomes/tr-g5-ingilizce-tymm-2025.js';
import { GRADE5_CORE_FULL_SCOPE_AUDIT,buildGrade5MathFullScopeTasks,buildGrade5ScienceFullScopeTasks,buildGrade5SocialFullScopeTasks,buildGrade5DkabFullScopeTasks,buildGrade5EnglishFullScopeTasks } from '../../js/assessment-v2/grade5-core-full-scope-engines.js';
import { GRADE5_CORE_REVIEW_SAMPLE_AUDIT } from '../../js/assessment-v2/grade5-core-review-sample.js';
import { ASSESSMENT_V2_PRODUCTION_PORTFOLIO } from '../../js/assessment-v2/production-portfolio.js';

const groups=[GRADE5_MATH_OUTCOMES_TYMM_2024,GRADE5_SCIENCE_OUTCOMES_TYMM_2024,GRADE5_SOCIAL_OUTCOMES_TYMM_2024,GRADE5_DKAB_OUTCOMES_TYMM_2024,GRADE5_ENGLISH_OUTCOMES_TYMM_2025];
const tasks=[...buildGrade5MathFullScopeTasks(),...buildGrade5ScienceFullScopeTasks(),...buildGrade5SocialFullScopeTasks(),...buildGrade5DkabFullScopeTasks(),...buildGrade5EnglishFullScopeTasks()];

test('5. sınıf çekirdek TYMM kazanımları resmî kapsamda 23/28/19/18/184 kayıt taşır',()=>{
  assert.deepEqual(groups.map(x=>x.length),[23,28,19,18,184]);
  assert.equal(groups.flat().length,272);
  assert.equal(groups.flat().every(x=>x.grade===5&&x.programFamily==='TYMM'),true);
  assert.equal(groups.flat().every(x=>x.source?.authority==='MEB_TTKB'),true);
});

test('çıktı metinlerinde PDF ayrıştırma artığı bulunmaz',()=>{
  const forbidden=/Ders Kodu|SÜREÇ BİLEŞENLERİ|ÖĞRENME ÇIKTILARI|PROGRAMLAR ARASI|Students Students/i;
  assert.equal(groups.flat().some(x=>forbidden.test(x.officialOutcomeText)),false);
  assert.equal(groups.flat().every(x=>x.officialOutcomeText.length>=12),true);
});

test('beş ayrı ders motoru 272 görevi bağımsız doğrulama ve yayın kilidiyle kapsar',()=>{
  assert.equal(GRADE5_CORE_FULL_SCOPE_AUDIT.ok,true);
  assert.equal(tasks.length,272);
  assert.equal(new Set(tasks.map(x=>x.id)).size,272);
  assert.equal(new Set(tasks.flatMap(x=>x.curriculum.outcomeIds)).size,272);
  assert.equal(tasks.every(x=>x.verifier.verified&&x.contentStatus==='HUMAN_REVIEW_REQUIRED'&&x.gameBindings.length===0),true);
  assert.equal(tasks.every(x=>x.hints.length===3&&x.misconceptionIds.length>=3),true);
});

test('5. sınıf İngilizce motoru ders çizelgesindeki yabancı dil hücresiyle eşleşir',()=>{
  assert.equal(GRADE5_ENGLISH_OUTCOMES_TYMM_2025.every(x=>x.courseId==='yabanci-dil'),true);
  assert.equal(COURSE_SCHEDULE_REGISTRY_2026_2027.some(x=>x.grade===5&&x.courseId==='yabanci-dil'),true);
  assert.equal(ASSESSMENT_V2_PRODUCTION_PORTFOLIO.summary.unmatchedActiveCourseCellCount,0);
});

test('beş resmî kaynak kayıtlı, yetkili ve AUTHORITATIVE_DATA modundadır',()=>{
  const ids=['meb-tymm-matematik-5-8-2024','meb-tymm-fen-3-8-2024','meb-tymm-sosyal-4-7-2024','meb-tymm-dkab-4-8-2024','meb-tymm-ingilizce-2-8-2025'];
  const rows=ids.map(id=>CURRICULUM_SOURCES.find(x=>x.id===id));
  assert.equal(rows.every(Boolean),true);
  assert.equal(rows.every(x=>x.kind==='official-curriculum'&&x.useMode==='AUTHORITATIVE_DATA'),true);
});

test('25 görevlik 5. sınıf çekirdek inceleme örneklemi otomatik onay üretmez',()=>{
  assert.equal(GRADE5_CORE_REVIEW_SAMPLE_AUDIT.ok,true,GRADE5_CORE_REVIEW_SAMPLE_AUDIT.errors.join('\n'));
  assert.equal(GRADE5_CORE_REVIEW_SAMPLE_AUDIT.metrics.pending,25);
});
