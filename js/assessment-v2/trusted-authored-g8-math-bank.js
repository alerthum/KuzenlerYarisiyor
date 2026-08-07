import { buildGrade8MathWave1Questions } from './math-g8-wave1.js';
import { buildGrade8MathCrossPilotQuestions } from './math-g8-cross-pilot.js';

/**
 * 8. sınıf Matematik için yalnız bağımsız doğrulayıcısı PASS olan,
 * LGS_HIGH olarak tasarlanmış kanonik maddelerin canlı oyun uyarlaması.
 *
 * Bu banka jeneratör değildir. Kimlikler bilinçli olarak tek tek seçilir ve
 * trusted-live-policy whitelist'ine açıkça eklenmeden canlıya çıkamaz.
 */

const SELECTED_IDS = Object.freeze([
  'math-g8-wave1-03-exponent-rules',
  'math-g8-wave1-05-radical-combination',
  'math-g8-wave1-06-square-frame-identity',
  'math-g8-wave1-08-inequality-direction',
  'math-g8-wave1-09-triangle-inequality',
  'math-g8-wave1-11-graph-interpretation',
  'math-g8-cross-03-linear-tank',
  'math-g8-cross-05-probability-cards'
]);

const SOURCE_ITEMS = new Map(
  [...buildGrade8MathWave1Questions(), ...buildGrade8MathCrossPilotQuestions()]
    .map((item) => [item.id, item])
);

function optionDiagnostics(item) {
  const feedbackById = new Map(item.optionFeedback.map((row) => [row.optionId, row]));
  return item.content.options.map((option, optionIndex) => {
    const feedback = feedbackById.get(option.id);
    const isCorrect = option.id === item.answerKey.optionId;
    return Object.freeze({
      optionIndex,
      optionId: option.id,
      optionText: option.text,
      isCorrect,
      misconceptionId: feedback?.misconceptionId || null,
      misconception: isCorrect ? null : feedback?.text || null,
      rationale: feedback?.text || null,
      whyStudentChoosesThis: isCorrect
        ? 'Modeli kurar, işlemleri doğru yürütür ve sonucu başlangıç koşullarında doğrular.'
        : feedback?.text || 'Çözüm yolundaki belirli bir kavram yanılgısını temsil eder.'
    });
  });
}

function solutionGraph(item) {
  const authored = item.solutionGraph.map((step, index) => Object.freeze({
    step: index + 1,
    id: step.id || `s${index + 1}`,
    action: step.action,
    evidence: step.evidence
  }));
  return Object.freeze([
    ...authored,
    Object.freeze({
      step: authored.length + 1,
      id: 'independent-verification',
      action: 'sonucu bağımsız doğrulayıcıyla kontrol et',
      evidence: `${item.verifier.independentVerifierId} sonucu ve doğru seçenek kimliğini bağımsız olarak doğrulamıştır.`
    })
  ]);
}

function explanation(item, graph) {
  const body = graph
    .filter((step) => step.id !== 'independent-verification')
    .map((step, index) => `${index + 1}) ${step.action}: ${step.evidence}`)
    .join(' ');
  const correct = item.optionFeedback.find((row) => row.optionId === item.answerKey.optionId)?.text || '';
  return `${body} Sonuç: ${correct} Bağımsız doğrulayıcı, seçeneği ve model sonucunu tekrar kontrol etmiştir.`;
}

function toTrustedRound(item) {
  if (item.verifier?.verified !== true) throw new Error(`${item.id}: verifier-not-verified`);
  if (item.construct?.intendedDifficultyBand !== 'LGS_HIGH') {
    throw new Error(`${item.id}: only-LGS_HIGH-items-allowed`);
  }
  const diagnostics = optionDiagnostics(item);
  const graph = solutionGraph(item);
  const answerIndex = item.content.options.findIndex((option) => option.id === item.answerKey.optionId);
  if (answerIndex < 0) throw new Error(`${item.id}: answer-option-missing`);

  const round = {
    kind: 'choice',
    questionKey: `trusted:1.0:problem-hunter:${item.id}`,
    prompt: item.content.stem,
    context: item.content.context,
    options: Object.freeze(item.content.options.map((option) => option.text)),
    answerIndex,
    explanation: explanation(item, graph),
    hints: Object.freeze(item.hints.slice(0, 2).map((hint) => hint.text)),
    detailedOptions: Object.freeze(diagnostics.map((row) => row.isCorrect
      ? `Doğru: ${row.rationale}`
      : `Yanlış: ${row.rationale}`)),
    optionDiagnostics: Object.freeze(diagnostics),
    skill: item.construct.primarySkill,
    subjectId: 'mathematics',
    topicId: item.curriculum.topicId,
    learningOutcomeId: item.curriculum.outcomeIds[0],
    curriculumReferenceId: item.curriculum.outcomeIds[0],
    gradeBand: '8',
    difficulty: 5,
    cognitiveDepth: 4,
    reasoningStepCount: graph.length,
    cognitiveTraits: Object.freeze(['multiStepInference', 'modelConstruction', 'independentVerification']),
    familyId: `trusted-g8-math:${item.construct.primarySkill}`,
    skeletonId: `trusted-g8-math:${item.construct.cognitiveProcess}`,
    reasoningPathId: `trusted-g8-math:${item.id}`,
    solutionGraph: graph,
    cognitiveDepthEvidence: Object.freeze({
      reasoningStepCount: graph.length,
      highCognitiveTraits: ['multiStepInference', 'modelConstruction', 'independentVerification'],
      source: 'assessment-v2-canonical-item-independent-verifier'
    }),
    sourceLabel: 'Assessment Engineering V2 · 8. Sınıf Matematik Güvenli Canlı Bankası',
    premiumTier: 'PLATINUM',
    premiumQuestion: true,
    solverProof: Object.freeze({
      verified: true,
      solverId: item.verifier.solverId,
      independentVerifierId: item.verifier.independentVerifierId,
      answerOptionId: item.answerKey.optionId,
      answerValue: item.answerKey.value
    }),
    canonicalQuestionId: item.id,
    constructId: item.construct.primarySkill,
    knowledgeComponents: item.construct.knowledgeComponents,
    intendedDifficultyBand: item.construct.intendedDifficultyBand,
    requireExplicitDistractorEvidence: true,
    distractorValidation: Object.freeze({
      verified: diagnostics.filter((row) => !row.isCorrect && row.misconceptionId).length === 3,
      diagnosticCount: diagnostics.filter((row) => !row.isCorrect).length,
      distinctMisconceptions: new Set(diagnostics.map((row) => row.misconceptionId).filter(Boolean)).size,
      violations: []
    })
  };
  return Object.freeze(round);
}

export const TRUSTED_GRADE8_MATH_ROUNDS = Object.freeze(
  SELECTED_IDS.map((id) => {
    const item = SOURCE_ITEMS.get(id);
    if (!item) throw new Error(`trusted-g8-math-item-missing:${id}`);
    return toTrustedRound(item);
  })
);

export const TRUSTED_GRADE8_MATH_KEYS = Object.freeze(
  TRUSTED_GRADE8_MATH_ROUNDS.map((round) => round.questionKey)
);

export const TRUSTED_GRADE8_MATH_CANONICAL_IDS = SELECTED_IDS;
