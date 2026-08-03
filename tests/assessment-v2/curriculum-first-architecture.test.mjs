import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CURRICULUM_SOURCES,
  assertAuthoritativeSource,
  curriculumSourceById
} from '../../js/curriculum/curriculum-source-registry.js';
import {
  CURRICULUM_ROLLOUT_2026_2027,
  curriculumRouteForGrade,
  validateRolloutCoverage
} from '../../js/curriculum/curriculum-rollout-2026-2027.js';
import { defineCanonicalQuestion } from '../../js/assessment-v2/canonical-question-contract.js';
import { defineSubjectEngine } from '../../js/assessment-v2/subject-engine-contract.js';
import { defineGameAdapter } from '../../js/assessment-v2/game-adapter-contract.js';
import {
  produceCanonicalQuestion,
  bindQuestionToGame
} from '../../js/assessment-v2/question-production-pipeline.js';
import {
  QUESTION_ARCHITECTURE_POLICY,
  validateQuestionArchitecturePolicy
} from '../../js/assessment-v2/question-architecture-policy.js';
import { defineCurriculumOutcome } from '../../js/curriculum/curriculum-ingestion-contract.js';

function generatedQuestion(overrides = {}) {
  return {
    id: 'tr-g8-turkce-main-idea-demo',
    curriculum: {
      country: 'TR',
      schoolYear: '2026-2027',
      programFamily: 'PRE_TYMM',
      grade: 8,
      courseId: 'turkce',
      unitId: 'okuma',
      topicId: 'ana-dusunce',
      outcomeIds: ['legacy-tur8-okuma-ana-dusunce'],
      sourceIds: ['meb-legacy-programs']
    },
    construct: {
      primarySkill: 'main-idea',
      secondarySkills: ['scope-control'],
      cognitiveProcess: 'analysis',
      knowledgeComponents: ['claim', 'support', 'scope'],
      intendedDifficultyBand: 'LGS_MEDIUM'
    },
    content: {
      stimulus: 'Özgün ve kaynak metni kopyalamayan bir paragraf.',
      stem: 'Bu parçanın ana düşüncesi hangisidir?',
      options: ['A', 'B', 'C', 'D']
    },
    itemFormat: 'single-choice',
    responseModel: { optionIds: ['A', 'B', 'C', 'D'] },
    answerKey: { optionId: 'D' },
    solutionGraph: [
      { id: 's1', action: 'central-claim', evidence: 'Ana iddiayı belirle.' },
      { id: 's2', action: 'scope-check', evidence: 'Seçenek kapsamını karşılaştır.' }
    ],
    hints: [
      { level: 1, text: 'Parçanın bütününü kapsayan yargıyı ara.' },
      { level: 2, text: 'Ayrıntı ile ana yargıyı ayır.' }
    ],
    optionFeedback: [
      { optionId: 'A', correct: false, misconceptionId: 'detail-as-main' },
      { optionId: 'B', correct: false, misconceptionId: 'overgeneralization' },
      { optionId: 'C', correct: false, misconceptionId: 'topic-only' },
      { optionId: 'D', correct: true, misconceptionId: null }
    ],
    misconceptionIds: ['detail-as-main', 'overgeneralization', 'topic-only'],
    verifier: {
      solverId: 'reading-claim-graph-v1',
      independentVerifierId: 'reading-option-entailment-v1',
      verified: true
    },
    styleProfile: { genre: 'essay', voice: 'reflective' },
    provenance: {
      generatedFromSourceIds: ['meb-legacy-programs'],
      styleReferenceIds: ['user-ozdebir-paragraph-sample']
    },
    contentStatus: 'ENGINEERING_VERIFIED',
    ...overrides
  };
}

test('kaynak kayıtları yetkili veri ile yalnız biçem referansını birbirinden ayırır', () => {
  assert.equal(new Set(CURRICULUM_SOURCES.map(source => source.id)).size, CURRICULUM_SOURCES.length);
  assert.equal(assertAuthoritativeSource('meb-tymm-programs').useMode, 'AUTHORITATIVE_DATA');
  assert.equal(curriculumSourceById('user-ozdebir-paragraph-sample').useMode, 'STYLE_REFERENCE_ONLY');
  assert.throws(() => assertAuthoritativeSource('user-ozdebir-paragraph-sample'), /not authoritative/);
});

test('2026-2027 program yönlendirmesi 12 sınıfı eksiksiz ve sürüm bilinçli kapsar', () => {
  const result = validateRolloutCoverage();
  assert.equal(result.ok, true);
  assert.equal(CURRICULUM_ROLLOUT_2026_2027.length, 12);
  assert.equal(curriculumRouteForGrade(3).programFamily, 'TYMM');
  assert.equal(curriculumRouteForGrade(7).programFamily, 'TYMM');
  assert.equal(curriculumRouteForGrade(11).programFamily, 'TYMM');
  assert.equal(curriculumRouteForGrade(4).programFamily, 'PRE_TYMM');
  assert.equal(curriculumRouteForGrade(8).programFamily, 'PRE_TYMM');
  assert.equal(curriculumRouteForGrade(12).programFamily, 'PRE_TYMM');
});

test('kanonik soru oyun bilgisinden bağımsızdır ve pedagojik destek taşır', () => {
  const item = defineCanonicalQuestion(generatedQuestion());
  assert.deepEqual(item.gameBindings, []);
  assert.equal(item.hints.length, 2);
  assert.equal(item.optionFeedback.length, 4);
  assert.equal(item.provenance.copiedText, false);
  assert.equal(item.verifier.verified, true);
});

test('mimari politika içerik önce oyun sonra ilkesini zorunlu tutar', () => {
  const audit = validateQuestionArchitecturePolicy();
  assert.equal(audit.ok, true);
  assert.equal(QUESTION_ARCHITECTURE_POLICY.invariants.contentBeforeGame, true);
  assert.equal(QUESTION_ARCHITECTURE_POLICY.invariants.sharedContractNotSharedGenerator, true);
  assert.equal(QUESTION_ARCHITECTURE_POLICY.invariants.humanCalibrationBeforeScale, true);
  assert.equal(QUESTION_ARCHITECTURE_POLICY.invariants.canonicalApprovalBeforeGame, true);
  assert.equal(QUESTION_ARCHITECTURE_POLICY.prohibitedShortcuts.includes('USE_ONE_GLOBAL_DISTRACTOR_RECIPE_FOR_ALL_SUBJECTS'), true);
});

test('ders motoru kanonik soruyu üretir ve bağımsız doğrulamadan geçirir', () => {
  const engine = defineSubjectEngine({
    id: 'reading-engine-demo',
    domain: 'reading',
    supportedCourseIds: ['turkce'],
    supportedItemFormats: ['single-choice'],
    misconceptionCatalogId: 'reading-misconceptions-v1',
    styleCatalogId: 'reading-styles-v1',
    plan: request => ({ request, constructId: 'main-idea' }),
    generate: () => generatedQuestion({ curriculum: { ...generatedQuestion().curriculum, schoolYear: undefined, programFamily: undefined } }),
    solve: item => item.answerKey.optionId,
    verifyIndependent: (item, answer) => answer === item.answerKey.optionId && item.verifier.independentVerifierId !== item.verifier.solverId,
    explain: item => item.solutionGraph,
    qualityAudit: item => ({ ok: item.optionFeedback.length === item.content.options.length })
  });

  const result = produceCanonicalQuestion({
    request: { grade: 8, courseId: 'turkce', outcomeId: 'legacy-tur8-okuma-ana-dusunce' },
    subjectEngine: engine
  });
  assert.equal(result.canonical.curriculum.programFamily, 'PRE_TYMM');
  assert.equal(result.proof.independentlyVerified, true);
  assert.equal(result.canonical.gameBindings.length, 0);
});

test('oyun adaptörü cevabın anlamını değiştirmeden ayrı çıktı üretir', () => {
  const canonical = defineCanonicalQuestion(generatedQuestion());
  const adapter = defineGameAdapter({
    id: 'paragraph-detective-adapter-v1',
    gameId: 'paragraph-detective',
    supportedItemFormats: ['single-choice'],
    supports: item => item.itemFormat === 'single-choice' && item.curriculum.courseId === 'turkce',
    adapt: item => ({
      gamePayload: {
        passage: item.content.stimulus,
        question: item.content.stem,
        options: item.content.options,
        correctOptionId: item.answerKey.optionId
      }
    }),
    reverseCheck: (item, adapted) => ({
      ok: adapted.gamePayload.correctOptionId === item.answerKey.optionId
        && adapted.gamePayload.question === item.content.stem,
      answerPreserved: adapted.gamePayload.correctOptionId === item.answerKey.optionId,
      stemPreserved: adapted.gamePayload.question === item.content.stem
    })
  });
  const adapted = bindQuestionToGame({ canonicalQuestion: canonical, gameAdapter: adapter });
  assert.equal(adapted.gameId, 'paragraph-detective');
  assert.equal(adapted.semanticRoundTrip.ok, true);
  assert.equal(canonical.gameBindings.length, 0);
});

test('anlamı bozan oyun adaptasyonu reddedilir', () => {
  const canonical = defineCanonicalQuestion(generatedQuestion());
  const badAdapter = defineGameAdapter({
    id: 'bad-adapter',
    gameId: 'bad-game',
    supportedItemFormats: ['single-choice'],
    supports: () => true,
    adapt: item => ({ gamePayload: { correctOptionId: item.answerKey.optionId === 'D' ? 'A' : 'D' } }),
    reverseCheck: (item, adapted) => ({ ok: adapted.gamePayload.correctOptionId === item.answerKey.optionId })
  });
  assert.throws(() => bindQuestionToGame({ canonicalQuestion: canonical, gameAdapter: badAdapter }), /semantic round-trip failed/);
});

test('kazanım kaydı etkin sınıf sürümüne uymayan kaynaktan oluşturulamaz', () => {
  const valid = defineCurriculumOutcome({
    id: 'tr-g8-turkce-demo-outcome',
    grade: 8,
    courseId: 'turkce',
    courseName: 'Türkçe',
    unitId: 'okuma',
    unitName: 'Okuma',
    topicId: 'ana-dusunce',
    topicName: 'Ana düşünce',
    officialOutcomeText: 'Kaynakta doğrulanacak örnek kayıt.',
    sourceId: 'meb-legacy-programs',
    sourceLocator: 'Program/PDF/page-or-section'
  });
  assert.equal(valid.programFamily, 'PRE_TYMM');
  assert.throws(() => defineCurriculumOutcome({
    ...valid,
    id: 'invalid-source-route',
    sourceId: 'meb-tymm-programs'
  }), /does not match active grade/);
});

import {
  COURSE_SCHEDULE_COVERAGE,
  coursesForGrade,
  validateCourseScheduleRegistry
} from '../../js/curriculum/course-schedule-registry-2026-2027.js';

test('zorunlu ders kayıtları 1-12. sınıfları resmî çizelge kaynaklarıyla kapsar', () => {
  const audit = validateCourseScheduleRegistry();
  assert.equal(audit.ok, true);
  assert.deepEqual(audit.missingGrades, []);
  assert.equal(coursesForGrade(1, 'ILKOKUL_ORTAOKUL_GENEL').some(course => course.courseName === 'Hayat Bilgisi'), true);
  assert.equal(coursesForGrade(8, 'ILKOKUL_ORTAOKUL_GENEL').some(course => course.courseName === 'T.C. İnkılap Tarihi ve Atatürkçülük'), true);
  assert.equal(coursesForGrade(10, 'ANADOLU_LISESI').some(course => course.courseName === 'Felsefe'), true);
  assert.equal(coursesForGrade(12, 'ANADOLU_LISESI').some(course => course.courseName === 'T.C. İnkılap Tarihi ve Atatürkçülük'), true);
  assert.equal(COURSE_SCHEDULE_COVERAGE.completeForAllTurkishSchoolTypes, false);
  assert.equal(COURSE_SCHEDULE_COVERAGE.electives, 'NOT_YET_INGESTED');
});

import {
  GRADE_8_TURKISH_INGESTION_STATUS,
  GRADE_8_TURKISH_OUTCOMES_2019,
  grade8TurkishOutcomeAudit,
  grade8TurkishOutcomeByCode
} from '../../js/curriculum/outcomes/tr-g8-turkce-2019.js';

test('8. sınıf Türkçe programındaki 76 kazanım resmî metin ve sayfa konumuyla kaydedilir', () => {
  const audit = grade8TurkishOutcomeAudit();
  assert.equal(audit.ok, true);
  assert.equal(audit.outcomeCount, 76);
  assert.deepEqual(audit.domainCounts, {
    'dinleme-izleme': 14,
    konusma: 7,
    okuma: 35,
    yazma: 20
  });
  assert.equal(GRADE_8_TURKISH_INGESTION_STATUS.status, 'COMPLETE');
  assert.equal(GRADE_8_TURKISH_OUTCOMES_2019.every(record => record.sourceId === 'meb-legacy-programs'), true);
});

test('8. sınıf Türkçe paragraf motoru resmî okuma kazanımlarına kodla bağlanabilir', () => {
  const mainIdea = grade8TurkishOutcomeByCode('T.8.3.17');
  const inference = grade8TurkishOutcomeByCode('T.8.3.25');
  const media = grade8TurkishOutcomeByCode('T.8.3.29');
  const sourceReliability = grade8TurkishOutcomeByCode('T.8.3.31');
  const chart = grade8TurkishOutcomeByCode('T.8.3.32');

  assert.equal(mainIdea.officialOutcomeText, 'Metnin ana fikrini/ana duygusunu belirler.');
  assert.match(inference.officialGuidanceNotes.join(' '), /Neden-sonuç/);
  assert.match(media.officialGuidanceNotes.join(' '), /ikna etme/);
  assert.match(sourceReliability.officialGuidanceNotes.join(' '), /edu/);
  assert.equal(chart.topicId, 'anlama');
  assert.match(chart.sourceLocator, /s\. 49/);
});
