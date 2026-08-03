import { COURSE_SCHEDULE_REGISTRY_2026_2027 } from '../curriculum/course-schedule-registry-2026-2027.js';
import { CURRICULUM_ROLLOUT_2026_2027 } from '../curriculum/curriculum-rollout-2026-2027.js';
import { GRADE_8_TURKISH_OUTCOMES_2019 } from '../curriculum/outcomes/tr-g8-turkce-2019.js';
import { GRADE8_MATH_PILOT_OUTCOMES } from '../curriculum/outcomes/tr-g8-matematik-2018-pilot.js';
import { GRADE8_SCIENCE_PILOT_OUTCOMES } from '../curriculum/outcomes/tr-g8-fen-2018-pilot.js';
import { GRADE5_TURKISH_PILOT_OUTCOMES } from '../curriculum/outcomes/tr-g5-turkce-tymm-2024-pilot.js';
import {
  GRADE8_TURKISH_FULL_SCOPE_AUDIT,
  GRADE8_TURKISH_FULL_SCOPE_MATRIX
} from './turkish-g8-full-scope-matrix.js';
import { buildGrade8TurkishPilot01Questions } from './turkish-g8-reading-pilot01.js';
import { buildGrade8TurkishPilot02CalibrationQuestions } from './turkish-g8-pilot02-calibration.js';
import { buildGrade8TurkishReadingLanguageWave1Questions } from './turkish-g8-reading-language-wave1.js';
import { buildGrade8TurkishVisualGrammarWave2Questions } from './turkish-g8-visual-grammar-wave2.js';
import { buildGrade8MathCrossPilotQuestions } from './math-g8-cross-pilot.js';
import { buildGrade8ScienceCrossPilotQuestions } from './science-g8-cross-pilot.js';
import { buildGrade5TurkishCrossPilotQuestions } from './turkish-g5-cross-pilot.js';
import { GRADE8_TURKISH_HUMAN_REVIEW_DECISIONS } from './turkish-g8-human-review-registry.js';
import { QUESTION_ARCHITECTURE_POLICY } from './question-architecture-policy.js';

export const ASSESSMENT_V2_TARGET_STATEMENT = '1–12. sınıf, tüm dersler ve ilgili merkezî sınavlar için müfredata bağlı ayrı ders motorları; doğrulanmış sorular oyunlara en son uyarlanır.';

const LEGACY_QUARANTINE_COUNT = 604;

function frozenArray(rows) {
  return Object.freeze(rows.map(row => Object.freeze(row)));
}

function percent(part, total) {
  return total > 0 ? Number(((part / total) * 100).toFixed(1)) : null;
}

function engineRow({
  id,
  grade,
  courseId,
  courseName,
  programFamily,
  curriculumStatus,
  officialOutcomeCount,
  ingestedOutcomeCount,
  coveredOutcomeCount,
  items,
  approvedQuestionIds = [],
  engineStatus,
  engineType,
  verifierType,
  misconceptionCatalog,
  nextAction,
  blockers = []
}) {
  const approved = new Set(approvedQuestionIds);
  const humanApprovedQuestionCount = items.filter(item => approved.has(item.id)).length;
  return Object.freeze({
    id,
    grade,
    courseId,
    courseName,
    programFamily,
    curriculumStatus,
    officialOutcomeCount,
    ingestedOutcomeCount,
    coveredOutcomeCount,
    courseCoveragePercent: officialOutcomeCount == null ? null : percent(coveredOutcomeCount, officialOutcomeCount),
    ingestionPercent: officialOutcomeCount == null ? null : percent(ingestedOutcomeCount, officialOutcomeCount),
    canonicalQuestionCount: items.length,
    humanApprovedQuestionCount,
    humanReviewQueueCount: items.length - humanApprovedQuestionCount,
    gameAdaptedQuestionCount: 0,
    gameAdaptationAllowed: false,
    engineStatus,
    engineType,
    verifierType,
    misconceptionCatalog,
    nextAction,
    blockers: Object.freeze([...blockers])
  });
}

export function buildAssessmentV2ProductionPortfolio() {
  const grade8TurkishItems = [
    ...buildGrade8TurkishPilot01Questions(),
    ...buildGrade8TurkishPilot02CalibrationQuestions(),
    ...buildGrade8TurkishReadingLanguageWave1Questions(),
    ...buildGrade8TurkishVisualGrammarWave2Questions()
  ];
  const grade8MathItems = buildGrade8MathCrossPilotQuestions();
  const grade8ScienceItems = buildGrade8ScienceCrossPilotQuestions();
  const grade5TurkishItems = buildGrade5TurkishCrossPilotQuestions();
  const approvedTurkishIds = GRADE8_TURKISH_HUMAN_REVIEW_DECISIONS.map(row => row.questionId);

  const engines = frozenArray([
    engineRow({
      id: 'tr-g8-turkce-v2',
      grade: 8,
      courseId: 'turkce',
      courseName: 'Türkçe',
      programFamily: 'PRE_TYMM',
      curriculumStatus: 'FULL_SCOPE_INGESTED',
      officialOutcomeCount: GRADE_8_TURKISH_OUTCOMES_2019.length,
      ingestedOutcomeCount: GRADE8_TURKISH_FULL_SCOPE_MATRIX.length,
      coveredOutcomeCount: GRADE8_TURKISH_FULL_SCOPE_AUDIT.metrics.implementedOutcomeCount,
      items: grade8TurkishItems,
      approvedQuestionIds: approvedTurkishIds,
      engineStatus: 'EXPANDING',
      engineType: 'semantic-evidence + grammar + visual-reading',
      verifierType: 'independent semantic/constraint verification',
      misconceptionCatalog: 'tr-g8-turkish-domain-misconceptions',
      nextAction: 'Kalan 45 kazanımı dinleme, konuşma, yazma ve eksik okuma dalgalarıyla kapat.',
      blockers: ['45 kazanım henüz kanonik soru veya performans göreviyle kapsanmadı.', 'İnsan inceleme kuyruğu tamamlanmadı.']
    }),
    engineRow({
      id: 'tr-g8-matematik-v2',
      grade: 8,
      courseId: 'matematik',
      courseName: 'Matematik',
      programFamily: 'PRE_TYMM',
      curriculumStatus: 'PILOT_OUTCOMES_ONLY',
      officialOutcomeCount: null,
      ingestedOutcomeCount: GRADE8_MATH_PILOT_OUTCOMES.length,
      coveredOutcomeCount: GRADE8_MATH_PILOT_OUTCOMES.length,
      items: grade8MathItems,
      engineStatus: 'PILOT_VALIDATED',
      engineType: 'symbolic/numeric solver-backed',
      verifierType: 'independent alternate algorithm',
      misconceptionCatalog: 'tr-g8-math-pilot-misconceptions',
      nextAction: '8. sınıf Matematik tam resmî kapsam matrisini çıkar ve ünite dalgalarını başlat.',
      blockers: ['Tam ders kazanım aktarımı henüz yapılmadı.', 'İnsan gözle kalibrasyonu yapılmadı.']
    }),
    engineRow({
      id: 'tr-g8-fen-v2',
      grade: 8,
      courseId: 'fen-bilimleri',
      courseName: 'Fen Bilimleri',
      programFamily: 'PRE_TYMM',
      curriculumStatus: 'PILOT_OUTCOMES_ONLY',
      officialOutcomeCount: null,
      ingestedOutcomeCount: GRADE8_SCIENCE_PILOT_OUTCOMES.length,
      coveredOutcomeCount: GRADE8_SCIENCE_PILOT_OUTCOMES.length,
      items: grade8ScienceItems,
      engineStatus: 'PILOT_VALIDATED',
      engineType: 'model/experiment/data reasoning',
      verifierType: 'evidence-constraint + scientific model verification',
      misconceptionCatalog: 'tr-g8-science-pilot-misconceptions',
      nextAction: '8. sınıf Fen Bilimleri tam resmî kapsam matrisini çıkar ve ünite dalgalarını başlat.',
      blockers: ['Tam ders kazanım aktarımı henüz yapılmadı.', 'İnsan gözle kalibrasyonu yapılmadı.']
    }),
    engineRow({
      id: 'tr-g5-turkce-v2',
      grade: 5,
      courseId: 'turkce',
      courseName: 'Türkçe',
      programFamily: 'TYMM',
      curriculumStatus: 'PILOT_OUTCOMES_ONLY',
      officialOutcomeCount: null,
      ingestedOutcomeCount: GRADE5_TURKISH_PILOT_OUTCOMES.length,
      coveredOutcomeCount: GRADE5_TURKISH_PILOT_OUTCOMES.length,
      items: grade5TurkishItems,
      engineStatus: 'PILOT_VALIDATED',
      engineType: 'age-calibrated semantic evidence',
      verifierType: 'independent evidence intersection',
      misconceptionCatalog: 'tr-g5-turkish-pilot-misconceptions',
      nextAction: '5. sınıf Türkçe TYMM tam öğrenme çıktısı matrisini çıkar ve yaşa özel dalgaları başlat.',
      blockers: ['Tam ders öğrenme çıktısı aktarımı henüz yapılmadı.', 'İnsan gözle kalibrasyonu yapılmadı.']
    })
  ]);

  const questionCount = engines.reduce((sum, row) => sum + row.canonicalQuestionCount, 0);
  const approvedCount = engines.reduce((sum, row) => sum + row.humanApprovedQuestionCount, 0);
  const ingestedOutcomeCount = engines.reduce((sum, row) => sum + row.ingestedOutcomeCount, 0);
  const coveredOutcomeCount = engines.reduce((sum, row) => sum + row.coveredOutcomeCount, 0);
  const uniqueCourseCells = new Set(COURSE_SCHEDULE_REGISTRY_2026_2027.map(row => `${row.grade}:${row.courseId}`));
  const activeGrades = new Set(engines.map(row => row.grade));

  const portfolio = {
    schemaVersion: '1.0',
    generatedAt: new Date().toISOString(),
    target: ASSESSMENT_V2_TARGET_STATEMENT,
    status: 'FOUNDATION_AND_PILOTS_IN_PROGRESS',
    productReady: false,
    publicationAllowed: false,
    gameAdaptationAllowed: false,
    legacy: Object.freeze({ count: LEGACY_QUARANTINE_COUNT, status: 'UNVERIFIED_LEGACY' }),
    architecture: Object.freeze({
      policyVersion: QUESTION_ARCHITECTURE_POLICY.version,
      pipelineOrder: QUESTION_ARCHITECTURE_POLICY.pipelineOrder,
      sharedContractNotSharedGenerator: true,
      subjectSpecificEnginesRequired: true
    }),
    summary: Object.freeze({
      targetGradeCount: 12,
      activeGradeCount: activeGrades.size,
      courseScheduleCellCount: uniqueCourseCells.size,
      activeEngineCellCount: engines.length,
      activeEngineCellPercent: percent(engines.length, uniqueCourseCells.size),
      curriculumOutcomeRecordCount: ingestedOutcomeCount,
      coveredOutcomeCount,
      canonicalQuestionCount: questionCount,
      humanApprovedQuestionCount: approvedCount,
      humanReviewQueueCount: questionCount - approvedCount,
      gameAdaptedQuestionCount: 0,
      legacyQuarantineCount: LEGACY_QUARANTINE_COUNT
    }),
    rollout: frozenArray(CURRICULUM_ROLLOUT_2026_2027.map(row => ({
      grade: row.grade,
      programFamily: row.programFamily,
      status: row.programVersionStatus
    }))),
    engines,
    pipeline: frozenArray([
      { id: 'curriculum', label: 'Resmî müfredat', status: 'IN_PROGRESS', note: 'Sınıf ve ders bazında sürüm yönlendirmesi zorunlu.' },
      { id: 'subject-engine', label: 'Derse özel motor', status: 'IN_PROGRESS', note: 'Ortak üretici yok; ortak sözleşme var.' },
      { id: 'canonical-content', label: 'Kanonik soru/görev', status: 'IN_PROGRESS', note: `${questionCount} doğrulanan mühendislik nesnesi mevcut.` },
      { id: 'human-review', label: 'İnsan kalibrasyonu', status: approvedCount === questionCount ? 'PASS' : 'BLOCKED', note: `${approvedCount} onaylı, ${questionCount - approvedCount} inceleme bekliyor.` },
      { id: 'game-adaptation', label: 'Oyun uyarlaması', status: 'LOCKED', note: 'Tam kapsam ve insan onayı öncesinde açılamaz.' },
      { id: 'student-pilot', label: 'Öğrenci pilotu', status: 'NOT_STARTED', note: 'Madde analizi ve çeldirici performansı henüz ölçülmedi.' },
      { id: 'publication', label: 'Yayın', status: 'LOCKED', note: 'productReady=false.' }
    ]),
    nextMilestones: frozenArray([
      { order: 1, id: 'g8-math-full-scope', title: '8. sınıf Matematik tam kapsam matrisi', reason: 'Çapraz pilot doğrulandı; ders ölçeğine geçilmeli.' },
      { order: 2, id: 'g8-science-full-scope', title: '8. sınıf Fen Bilimleri tam kapsam matrisi', reason: 'Deney/model motoru ders ölçeğine genişletilmeli.' },
      { order: 3, id: 'g5-turkish-full-scope', title: '5. sınıf Türkçe TYMM tam kapsam matrisi', reason: 'Yaş düzeyi aktarımı pilot sınırından çıkarılmalı.' },
      { order: 4, id: 'g8-turkish-remaining', title: '8. sınıf Türkçe kalan 45 kazanım', reason: 'Tam kapsam kayıtlı; içerik boşlukları dalgalarla kapanmalı.' },
      { order: 5, id: 'human-review-ledger', title: 'İnsan inceleme iş akışı', reason: '61 soru onay bekliyor; oyun kilidi bu kuyrukla bağlı.' }
    ])
  };
  return Object.freeze(portfolio);
}

export function auditAssessmentV2ProductionPortfolio(portfolio = buildAssessmentV2ProductionPortfolio()) {
  const errors = [];
  if (portfolio.summary.targetGradeCount !== 12) errors.push('target-grade-count');
  if (portfolio.summary.courseScheduleCellCount !== 112) errors.push(`course-cell-count:${portfolio.summary.courseScheduleCellCount}`);
  if (portfolio.engines.length !== 4) errors.push(`engine-count:${portfolio.engines.length}`);
  if (new Set(portfolio.engines.map(row => row.id)).size !== portfolio.engines.length) errors.push('duplicate-engine-id');
  if (portfolio.summary.canonicalQuestionCount !== 66) errors.push(`question-count:${portfolio.summary.canonicalQuestionCount}`);
  if (portfolio.summary.curriculumOutcomeRecordCount !== 91) errors.push(`outcome-record-count:${portfolio.summary.curriculumOutcomeRecordCount}`);
  if (portfolio.summary.coveredOutcomeCount !== 46) errors.push(`covered-outcome-count:${portfolio.summary.coveredOutcomeCount}`);
  if (portfolio.summary.humanApprovedQuestionCount !== 5) errors.push(`approved-count:${portfolio.summary.humanApprovedQuestionCount}`);
  if (portfolio.summary.humanReviewQueueCount !== 61) errors.push(`review-queue:${portfolio.summary.humanReviewQueueCount}`);
  if (portfolio.productReady !== false || portfolio.publicationAllowed !== false) errors.push('product-ready-leak');
  if (portfolio.gameAdaptationAllowed !== false || portfolio.summary.gameAdaptedQuestionCount !== 0) errors.push('game-adaptation-leak');
  if (portfolio.legacy.count !== 604 || portfolio.legacy.status !== 'UNVERIFIED_LEGACY') errors.push('legacy-policy');
  if (portfolio.rollout.length !== 12) errors.push(`rollout-count:${portfolio.rollout.length}`);
  if (!portfolio.engines.every(row => row.gameAdaptationAllowed === false)) errors.push('engine-game-lock');
  if (!portfolio.architecture.sharedContractNotSharedGenerator) errors.push('shared-generator-policy');
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors), metrics: portfolio.summary });
}

export const ASSESSMENT_V2_PRODUCTION_PORTFOLIO = buildAssessmentV2ProductionPortfolio();
export const ASSESSMENT_V2_PRODUCTION_PORTFOLIO_AUDIT = auditAssessmentV2ProductionPortfolio(ASSESSMENT_V2_PRODUCTION_PORTFOLIO);
