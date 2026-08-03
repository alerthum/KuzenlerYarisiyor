export const QUESTION_ARCHITECTURE_POLICY = Object.freeze({
  version: '3.0',
  pipelineOrder: Object.freeze([
    'AUTHORITATIVE_CURRICULUM',
    'SUBJECT_SPECIFIC_CONTENT_ENGINE',
    'INDEPENDENT_ANSWER_VERIFICATION',
    'PEDAGOGICAL_FEEDBACK',
    'QUALITY_GATES',
    'GAME_ADAPTATION',
    'SEMANTIC_ROUND_TRIP',
    'HUMAN_PILOT',
    'PUBLICATION'
  ]),
  invariants: Object.freeze({
    contentBeforeGame: true,
    sharedContractNotSharedGenerator: true,
    authoritativeOutcomeRequired: true,
    fakeOutcomeCodesForbidden: true,
    copiedReferenceQuestionsForbidden: true,
    gameMayNotChangeAnswerSemantics: true,
    allOptionsRequireFeedback: true,
    hintsMustBeProgressive: true,
    independentVerifierRequired: true,
    humanPilotRequiredForPublication: true
  }),
  prohibitedShortcuts: Object.freeze([
    'FORCE_EVERY_OUTCOME_INTO_DAILY_LIFE_SCENARIO',
    'USE_ONE_GLOBAL_DISTRACTOR_RECIPE_FOR_ALL_SUBJECTS',
    'CHOOSE_OPTION_COUNT_FROM_GRADE_ALONE',
    'LABEL_LLM_SELF_CHECK_AS_INDEPENDENT_VERIFICATION',
    'MARK_ENGINEERING_PASS_AS_PRODUCT_READY',
    'COPY_PUBLISHER_OR_EXAM_QUESTIONS'
  ])
});

export function validateQuestionArchitecturePolicy(policy = QUESTION_ARCHITECTURE_POLICY) {
  const requiredInvariants = [
    'contentBeforeGame',
    'sharedContractNotSharedGenerator',
    'authoritativeOutcomeRequired',
    'gameMayNotChangeAnswerSemantics',
    'allOptionsRequireFeedback',
    'hintsMustBeProgressive',
    'independentVerifierRequired',
    'humanPilotRequiredForPublication'
  ];
  return Object.freeze({
    ok: requiredInvariants.every(key => policy.invariants?.[key] === true),
    requiredInvariants: Object.freeze(requiredInvariants)
  });
}
