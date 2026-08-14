import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  importZihinFactoryPilotPackage,
  validateZihinFactoryPilotPackage
} from '../../js/assessment-v2/zihin-factory-pilot-import.js';
import { renderZihinFactoryPilotModule } from '../../js/assessment-v2/zihin-factory-pilot-module.js';
import {
  ZIHIN_FACTORY_APPROVED_TR8_KEYS,
  ZIHIN_FACTORY_APPROVED_TR8_ROUNDS,
  ZIHIN_FACTORY_APPROVED_TR8_SOURCE
} from '../../js/assessment-v2/zihin-factory-approved-tr8-pilot.js';

const themes = [
  'mahalle arşivindeki fotoğraf ve ses kayıtları',
  'sulak alan gözlemindeki kuş ve bitki çizelgeleri',
  'kütüphane kullanımındaki ödünç alma ve çalışma verileri',
  'kent bahçesindeki toprak ve ürün ölçümleri',
  'müze sergisindeki nesne ve ziyaretçi notları',
  'okul korosundaki prova ve dinleyici değerlendirmeleri',
  'bisiklet yollarındaki trafik ve güvenlik gözlemleri',
  'sahil temizliğindeki atık ve gönüllü kayıtları',
  'köy pazarındaki üretici ve tüketici görüşmeleri',
  'bilim kulübündeki deney ve sonuç günlükleri',
  'tiyatro çalışmasındaki prova ve sahne düzenleri',
  'yerel gazetede haber ve okur geri bildirimleri',
  'orman yürüyüşündeki rota ve canlı çeşitliliği notları',
  'robotik takımındaki tasarım ve hata kayıtları',
  'spor şenliğindeki katılım ve dayanışma gözlemleri',
  'müzik arşivindeki ezgi ve icra karşılaştırmaları'
];

const distinctDetails = [
  'kiremit çeşme manav terzi meydan gölgelik sandık pusula',
  'sazlık balıkçıl nilüfer kamış kurbağa dürbün iskele çamur',
  'raf katalog ansiklopedi masa sessizlik ayraç lamba ödünç',
  'fesleğen kompost damla serçe kürek fide hasat çit',
  'vitrin heykel çömlek sikke rehber avlu mozaik bilet',
  'soprano nota piyano tempo soluk akort sahne alkış',
  'kask kavşak reflektör rampa fren şerit tabela pedal',
  'midye yosun şişe halat kum eldiven tekne kıyı',
  'peynir sepet tarhana tezgâh bakır kantar badem dokuma',
  'mıknatıs devre mercek pil kablo hipotez kronometre düzenek',
  'perde replik kostüm dekor kulis ışık prova makyaj',
  'manşet muhabir baskı köşe arşiv röportaj dağıtım karikatür',
  'patika kozalak ardıç mantar dere harita çınar iz',
  'sensör pervane gövde yazılım vida lehim motor prototip',
  'bayrak istasyon minder düdük parkur takım tribün madalya',
  'tambur makam plak nota ustalık kayıt ezgi dinleti'
];

const optionIds = ['A', 'B', 'C', 'D'];

function question(index) {
  const theme = themes[index];
  const detail = distinctDetails[index];
  const correctIndex = index % 4;
  const discourseStructures = ['contrast-with-qualification', 'cause-evidence-with-limit', 'problem-attempt-revision', 'change-and-continuity', 'claim-counterexample-synthesis'];
  const reasoningPaths = ['multi-source-convergence', 'exception-bounded-inference', 'chronology-causality-separation', 'evidence-weighting'];
  const genres = ['cultural-essay', 'science-observation', 'reflective-critique', 'historical-exposition', 'daily-life-analysis'];
  const correctText = `${theme} birlikte incelendiğinde farklı kanıtların ortak yönü, değişim ile sürekliliği aynı kapsam içinde açıklamaktadır.`;
  const wrong = [
    `${theme} içindeki tek bir ayrıntı, bütün süreci başka kanıta gerek kalmadan kesin biçimde açıklamakta; haftalık raporların diğer bölümlerini de gereksiz saymaktadır.`,
    `${theme} arasında görülen her farklılık, önceki uygulamaların tümüyle değersiz olduğunu kanıtlamaktadır.`,
    `${theme} üzerine yapılan karşılaştırma, kişisel bir görüşün bütün verilerden daha güvenilir olduğunu göstermektedir.`
  ];
  const optionTexts = [...wrong];
  optionTexts.splice(correctIndex, 0, correctText);
  const misconceptionIds = ['detail-as-main', 'overgeneralization', 'evidence-reversal'];
  let wrongIndex = 0;
  const optionFeedback = optionTexts.map((optionText, optionIndex) => {
    if (optionIndex === correctIndex) return {
      optionId: optionIds[optionIndex],
      correct: true,
      misconceptionId: null,
      text: `Bu seçenek ${theme} içindeki ayrı kanıtları ortak ve ölçülü bir sonuca bağlar.`
    };
    const misconceptionId = misconceptionIds[wrongIndex++];
    return {
      optionId: optionIds[optionIndex],
      correct: false,
      misconceptionId,
      text: `Bu seçenek ${theme} içindeki sınırlı bir bulguyu ${misconceptionId} yanılgısıyla metnin tamamına yayar.`
    };
  });
  return {
    schemaVersion: '3.0',
    id: `factory-tr8-pilot-${String(index + 1).padStart(2, '0')}`,
    curriculum: {
      country: 'TR', schoolYear: '2026-2027', programFamily: 'PRE_TYMM', grade: 8,
      courseId: 'turkce', unitId: 'okuma', topicId: 'ana-dusunce',
      outcomeIds: ['tr.pre-tymm.g8.turkce.t-8-3-17'], sourceIds: ['meb-grade8-turkish-program']
    },
    construct: {
      primarySkill: 'main-idea', secondarySkills: ['evidence-integration'],
      cognitiveProcess: 'integrate-and-evaluate', knowledgeComponents: ['claim', 'evidence', 'scope'],
      intendedDifficultyBand: 'LGS_HIGH'
    },
    content: {
      stimulus: `${theme} yedi hafta boyunca düzenli biçimde toplandı. İlk kayıtlar yalnız görünen değişiklikleri sıralıyordu. ${detail} başlıkları ayrı gözlem kartlarında işlendi. Sonraki haftalarda nedenleri anlamak için farklı kaynaklar karşılaştırıldı. Bazı bulgular değişimi, bazıları ise devam eden alışkanlıkları gösterdi. Ekip tek bir belgenin bütünü açıklayamayacağını fark etti. Son raporda kanıtların ortak ve ayrılan yönleri birlikte sunuldu. Böylece okurlar ölçülü bir sonuca ulaşabildi.`,
      stem: 'Bu parçanın ana düşüncesi aşağıdakilerden hangisidir?',
      options: optionTexts.map((text, optionIndex) => ({ id: optionIds[optionIndex], text })),
      humanReview: { status: 'APPROVED', batchId: 'tr8-pilot-001', gameAdaptationAllowed: true }
    },
    itemFormat: 'single-choice',
    responseModel: { optionIds, optionCount: 4 },
    answerKey: { optionId: optionIds[correctIndex] },
    solutionGraph: [
      { id: 's1', action: 'kanıt türlerini ayır', evidence: `${theme} için birden çok kayıt türü kullanılmıştır.` },
      { id: 's2', action: 'ortak ilişkiyi kur', evidence: 'Değişen ve süren özellikler birlikte karşılaştırılmıştır.' },
      { id: 's3', action: 'kapsamı denetle', evidence: 'Ana düşünce tek ayrıntıya veya kesin genellemeye indirgenmemiştir.' }
    ],
    hints: [
      { level: 1, text: 'Paragrafta karşılaştırılan farklı kanıt türlerini ayrı ayrı belirle.', revealsAnswer: false },
      { level: 2, text: 'Değişen özelliklerle devam eden özelliklerin birlikte nasıl yorumlandığına bak.', revealsAnswer: false },
      { level: 3, text: 'Tek ayrıntıyı genelleyen ve metinden daha kesin konuşan seçenekleri ele.', revealsAnswer: false }
    ],
    optionFeedback,
    misconceptionIds,
    verifier: { solverId: 'factory-reading-solver-v1', independentVerifierId: 'factory-independent-reviewer-v1', verified: true },
    styleProfile: {
      genre: genres[(index * 2 + Math.floor(index / 5)) % genres.length],
      genreId: genres[(index * 2 + Math.floor(index / 5)) % genres.length],
      voice: 'age-appropriate',
      diversityPlanId: `tr8-main-idea-diversity-${String(index + 1).padStart(2, '0')}`,
      discourseStructureId: discourseStructures[index % discourseStructures.length],
      reasoningPathId: reasoningPaths[Math.floor(index / discourseStructures.length)]
    },
    provenance: { generatedFromSourceIds: ['meb-grade8-turkish-program'], styleReferenceIds: [], copiedText: false },
    contentStatus: 'PILOT_READY'
  };
}

function reviewEvidence(questionId) {
  return {
    questionId,
    reviewerCount: 1,
    reviewerRoles: ['TURKISH_TEACHER'],
    decisions: ['APPROVE'],
    minimumScores: {
      correctness: 4, optionOrRubricQuality: 4, ageLanguageFit: 4,
      hintNonLeakage: 4, feedbackTeachingValue: 4, naturalness: 4
    }
  };
}

function approvedPackage() {
  const questions = themes.map((_, index) => question(index));
  return {
    schemaVersion: '1.0',
    kind: 'zihin-factory-approved-tr8-paragraph-pilot',
    source: {
      repository: 'alerthum/zihin-factory', factoryVersion: '0.10.1',
      jobId: '00000000-0000-4000-8000-000000000001', batchId: 'tr8-pilot-001'
    },
    target: {
      repository: 'alerthum/KuzenlerYarisiyor', grade: 8, courseId: 'turkce',
      gameId: 'paragraph-detective', familyId: 'tr8.paragraph.main-idea-synthesis.v1'
    },
    releaseGate: {
      engineeringPassCount: 20, blindReviewCount: 20, humanReviewCount: 20, humanDecisionCount: 20,
      humanApprovalCount: 16, humanApprovalRate: 0.8, exportableQuestionCount: 16,
      completeCoverage: true, pilotEligible: true
    },
    qualityEvidence: {
      semanticDuplicatePairCount: 0, longestCorrectRate: 0.25,
      correctPositionCounts: [5, 5, 5, 5], maximumObservedSimilarity: 0.42,
      structuralDuplicatePairCount: 0, distinctDiversityPlanCount: 20,
      distinctDiscourseStructureCount: 5, distinctReasoningPathCount: 4, distinctGenreCount: 5,
      maximumDiscourseStructureShare: 0.2, maximumReasoningPathShare: 0.25
    },
    approvedQuestionIds: questions.map((item) => item.id),
    reviewEvidence: questions.map((item) => reviewEvidence(item.id)),
    questions,
    exportedAt: '2026-08-14T18:00:00.000Z'
  };
}

test('approved factory package is independently validated and adapted to paragraph detective', () => {
  const imported = importZihinFactoryPilotPackage(approvedPackage());
  assert.equal(imported.audit.ok, true);
  assert.equal(imported.canonicalQuestions.length, 16);
  assert.equal(imported.rounds.length, 16);
  assert.equal(imported.rounds.every((round) => round.gameId === 'paragraph-detective'), true);
  assert.equal(imported.rounds.every((round) => round.optionDiagnostics.length === 4), true);
  assert.equal(imported.rounds.every((round) => round.trustedHumanReview.status === 'APPROVED'), true);
  assert.deepEqual(imported.rounds.map((round) => round.trustedSessionOrder), Array.from({ length: 16 }, (_, index) => index));
  assert.equal(imported.rounds.every((round) => round.trustedLivePriority === 1000), true);
  assert.equal(imported.autoPublishAllowed, false);
  assert.equal(imported.publicationStatus, 'EXPLICIT_TRUSTED_LIVE_WHITELIST_PR_REQUIRED');
});

test('a weak human score blocks the product import even if the package claims eligibility', () => {
  const input = approvedPackage();
  input.reviewEvidence[0].minimumScores.feedbackTeachingValue = 3;
  assert.throws(() => validateZihinFactoryPilotPackage(input), /human-score/);
});

test('the product rejects packages without twenty locked blind answer resolutions', () => {
  const missing = approvedPackage();
  delete missing.releaseGate.blindReviewCount;
  assert.throws(() => validateZihinFactoryPilotPackage(missing), /release-gate/);

  const short = approvedPackage();
  short.releaseGate.blindReviewCount = 19;
  assert.throws(() => validateZihinFactoryPilotPackage(short), /release-gate/);
});

test('duplicate accepted surfaces are rejected again on the product side', () => {
  const input = approvedPackage();
  input.questions[1].content = structuredClone(input.questions[0].content);
  assert.throws(() => validateZihinFactoryPilotPackage(input), /exact-question-duplicate/);
});

test('structurally repeated templates are rejected even when surface words differ', () => {
  const input = approvedPackage();
  input.questions[1].styleProfile = structuredClone(input.questions[0].styleProfile);
  assert.throws(() => validateZihinFactoryPilotPackage(input), /duplicate-diversity-plan|structural-template-duplicate/);
});

test('unexpected factory release or item family is rejected before module generation', () => {
  const wrongVersion = approvedPackage();
  wrongVersion.source.factoryVersion = '0.10.2';
  assert.throws(() => validateZihinFactoryPilotPackage(wrongVersion), /source/);

  const wrongFamily = approvedPackage();
  wrongFamily.target.familyId = 'tr8.paragraph.free-form.v1';
  assert.throws(() => validateZihinFactoryPilotPackage(wrongFamily), /target/);
});

test('renderer emits a self-validating module while the committed bank stays empty', () => {
  const source = renderZihinFactoryPilotModule(approvedPackage());
  assert.match(source, /importZihinFactoryPilotPackage\(FACTORY_PACKAGE\)/);
  assert.match(source, /00000000-0000-4000-8000-000000000001/);
  assert.match(source, /ZIHIN_FACTORY_APPROVED_TR8_ROUNDS/);
  assert.equal(ZIHIN_FACTORY_APPROVED_TR8_SOURCE, null);
  assert.deepEqual(ZIHIN_FACTORY_APPROVED_TR8_ROUNDS, []);
  assert.deepEqual(ZIHIN_FACTORY_APPROVED_TR8_KEYS, []);
});

test('the importer cannot modify the live whitelist or publish by itself', () => {
  const source = readFileSync(new URL('../../js/assessment-v2/zihin-factory-pilot-import.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /trusted-live-policy|controlled-live-beta-bank/);
  assert.doesNotMatch(source, /deploy|merge|git push/i);
  assert.match(source, /autoPublishAllowed: false/);
});
