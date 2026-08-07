const REQUIRED_SKELETON_COUNT = 3;

function freeze(value) {
  if (Array.isArray(value)) return Object.freeze(value.map((entry) => freeze(entry)));
  if (value && typeof value === 'object') {
    return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, freeze(entry)])));
  }
  return value;
}

function text(value) {
  return String(value ?? '').trim();
}

function requiredText(value, label, id) {
  const result = text(value);
  if (!result) throw new Error(`${id}: ${label} gerekli`);
  return result;
}

function stableHash(value) {
  let state = 2166136261;
  for (const ch of String(value)) {
    state ^= ch.charCodeAt(0);
    state = Math.imul(state, 16777619);
  }
  return state >>> 0;
}

function deterministicShuffle(values, seed, salt = '') {
  return [...values]
    .map((value, index) => ({ value, score: stableHash(`${seed}:${salt}:${index}:${JSON.stringify(value)}`) }))
    .sort((left, right) => left.score - right.score)
    .map((row) => row.value);
}

function defaultFormat(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (Number.isInteger(value)) return String(value);
    return value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '').replace('.', ',');
  }
  return text(value);
}

function ensureDistinctOptions(correct, distractors, formatOption, id) {
  const correctText = formatOption(correct);
  const rows = [];
  const seen = new Set([correctText.toLocaleLowerCase('tr-TR')]);
  for (const row of distractors) {
    const optionText = formatOption(row.value);
    const normalized = optionText.toLocaleLowerCase('tr-TR');
    if (!optionText || seen.has(normalized)) continue;
    seen.add(normalized);
    rows.push({ ...row, optionText });
  }
  if (rows.length !== 3) throw new Error(`${id}: üç farklı tanısal çeldirici üretilemedi`);
  return { correctText, distractors: rows };
}

function optionDiagnostics(options, answerIndex, correctRationale, distractorRows) {
  let wrongIndex = 0;
  return Object.freeze(options.map((optionText, index) => {
    if (index === answerIndex) {
      return Object.freeze({
        optionIndex: index,
        optionText,
        isCorrect: true,
        misconceptionId: null,
        misconception: null,
        rationale: correctRationale,
        whyStudentChoosesThis: 'Bütün koşulları birlikte kullanır ve bağımsız solver sonucuyla uyuşur.'
      });
    }
    const row = distractorRows[wrongIndex++];
    return Object.freeze({
      optionIndex: index,
      optionText,
      isCorrect: false,
      misconceptionId: row.id,
      misconception: row.description,
      rationale: row.feedback,
      whyStudentChoosesThis: row.description
    });
  }));
}

function directChoiceSurface({ baseSurface, correctText, distractors, seed }) {
  const optionRows = deterministicShuffle([
    { optionText: correctText, correct: true },
    ...distractors.map((row) => ({ ...row, correct: false }))
  ], seed, 'direct-options');
  return {
    context: baseSurface.context,
    prompt: baseSurface.prompt,
    options: optionRows.map((row) => row.optionText),
    answerIndex: optionRows.findIndex((row) => row.correct),
    orderedDistractors: optionRows.filter((row) => !row.correct)
  };
}

function errorDetectiveSurface({ baseSurface, correctText, distractors, seed }) {
  const studentNames = deterministicShuffle(['Ada', 'Bora', 'Ceren', 'Deniz'], seed, 'student-names');
  const statements = deterministicShuffle([
    {
      optionText: `${studentNames[0]}: Sonuç ${correctText}; çünkü ${baseSurface.correctRationale}`,
      correct: true
    },
    ...distractors.map((row, index) => ({
      ...row,
      optionText: `${studentNames[index + 1]}: Sonuç ${row.optionText}; çünkü ${row.description}`,
      correct: false
    }))
  ], seed, 'detective-options');
  return {
    context: `${baseSurface.context} Dört öğrenci aynı problemi farklı yöntemlerle çözmüştür.`,
    prompt: 'Hangi öğrencinin sonucu ve gerekçesi birlikte doğrudur?',
    options: statements.map((row) => row.optionText),
    answerIndex: statements.findIndex((row) => row.correct),
    orderedDistractors: statements.filter((row) => !row.correct)
  };
}

function geometryLabSurface({ baseSurface, correctText, distractors, seed }) {
  const optionRows = deterministicShuffle([
    { optionText: correctText, correct: true },
    ...distractors.map((row) => ({ ...row, correct: false }))
  ], seed, 'geometry-options');
  return {
    context: `${baseSurface.context} Çözüm, şeklin ölçüleri arasındaki ilişki kurulmadan yalnız görsel tahminle yapılamaz.`,
    prompt: baseSurface.geometryPrompt || baseSurface.prompt,
    options: optionRows.map((row) => row.optionText),
    answerIndex: optionRows.findIndex((row) => row.correct),
    orderedDistractors: optionRows.filter((row) => !row.correct)
  };
}

const GAME_ADAPTERS = Object.freeze({
  'problem-hunter': directChoiceSurface,
  'error-detective': errorDetectiveSurface,
  'geometry-lab': geometryLabSurface
});

export function defineSolverBackedMathFamily(input = {}) {
  const id = requiredText(input.id, 'id', 'math-family');
  const grade = Number(input.grade);
  if (![4, 8].includes(grade)) throw new Error(`${id}: yalnız 4. ve 8. sınıf desteklenir`);
  const skeletons = Array.isArray(input.skeletons) ? input.skeletons : [];
  if (skeletons.length < REQUIRED_SKELETON_COUNT) throw new Error(`${id}: en az ${REQUIRED_SKELETON_COUNT} iskelet gerekli`);
  if (typeof input.generateParameters !== 'function') throw new Error(`${id}: generateParameters gerekli`);
  if (typeof input.solve !== 'function') throw new Error(`${id}: solve gerekli`);
  if (typeof input.verify !== 'function') throw new Error(`${id}: verify gerekli`);
  if (typeof input.render !== 'function') throw new Error(`${id}: render gerekli`);
  if (!Array.isArray(input.misconceptions) || input.misconceptions.length < 3) throw new Error(`${id}: üç yanılgı gerekli`);
  if (!Array.isArray(input.gameIds) || input.gameIds.length < 1) throw new Error(`${id}: gameIds gerekli`);

  return freeze({
    schemaVersion: '5.0',
    id,
    grade,
    subjectId: 'mathematics',
    topicId: requiredText(input.topicId, 'topicId', id),
    outcomeId: requiredText(input.outcomeId, 'outcomeId', id),
    constructId: requiredText(input.constructId, 'constructId', id),
    claim: requiredText(input.claim, 'claim', id),
    knowledgeComponents: input.knowledgeComponents || [],
    deepFeatures: input.deepFeatures || [],
    gameIds: input.gameIds,
    skeletons,
    misconceptions: input.misconceptions,
    generateParameters: input.generateParameters,
    solve: input.solve,
    verify: input.verify,
    render: input.render,
    formatOption: input.formatOption || defaultFormat,
    durationSeconds: Number(input.durationSeconds || (grade === 8 ? 240 : 180))
  });
}

export function materializeSolverBackedMathRound(family, {
  seed = 1,
  skeletonIndex = 0,
  gameId = family.gameIds[0],
  sessionOrder = 1
} = {}) {
  if (!family.gameIds.includes(gameId)) throw new Error(`${family.id}: ${gameId} oyunu desteklenmiyor`);
  const adapter = GAME_ADAPTERS[gameId];
  if (!adapter) throw new Error(`${family.id}: ${gameId} adaptörü tanımlı değil`);

  const skeleton = family.skeletons[skeletonIndex % family.skeletons.length];
  const params = family.generateParameters({ seed, skeletonId: skeleton.id });
  const answer = family.solve(params);
  if (!family.verify(params, answer)) throw new Error(`${family.id}: bağımsız verifier solver sonucunu reddetti`);
  const baseSurface = family.render(params, { answer, seed, skeleton, gameId });
  const formatOption = baseSurface.formatOption || family.formatOption || defaultFormat;
  const rawDistractors = family.misconceptions.slice(0, 3).map((misconception) => ({
    id: misconception.id,
    description: misconception.description,
    feedback: misconception.feedback,
    value: misconception.apply(params, answer)
  }));
  const distinct = ensureDistinctOptions(answer, rawDistractors, formatOption, family.id);
  const adapted = adapter({
    baseSurface: { ...baseSurface, correctRationale: requiredText(baseSurface.correctRationale, 'correctRationale', family.id) },
    correctText: distinct.correctText,
    distractors: distinct.distractors,
    seed
  });
  const orderedDiagnostics = optionDiagnostics(adapted.options, adapted.answerIndex, baseSurface.correctRationale, adapted.orderedDistractors);
  const steps = (baseSurface.steps || []).map((row, index) => Object.freeze({
    step: index + 1,
    id: row.id || `s${index + 1}`,
    action: requiredText(row.action, `steps[${index}].action`, family.id),
    evidence: requiredText(row.evidence, `steps[${index}].evidence`, family.id)
  }));
  if (steps.length < 4) throw new Error(`${family.id}: en az dört çözüm adımı gerekli`);
  const hints = (baseSurface.hints || []).map(text).filter(Boolean);
  if (hints.length < 2 || hints.some((hint) => hint.length < 25)) throw new Error(`${family.id}: iki özgül ipucu gerekli`);
  const signature = stableHash(JSON.stringify({ familyId: family.id, skeletonId: skeleton.id, gameId, params })).toString(36);
  const solutionGraph = Object.freeze([
    ...steps,
    Object.freeze({
      step: steps.length + 1,
      id: 'independent-verification',
      action: 'sonucu bağımsız olarak doğrula',
      evidence: `Verifier, ${distinct.correctText} sonucunu başlangıç koşullarına geri yerleştirerek doğruladı.`
    })
  ]);
  const explanation = `${steps.map((step, index) => `${index + 1}) ${step.action}: ${step.evidence}`).join(' ')} Sonuç: ${distinct.correctText}.`;

  return Object.freeze({
    kind: 'choice',
    questionKey: `engine:5.0:${gameId}:g${family.grade}:${family.id}:${skeleton.id}:${signature}`,
    gameId,
    prompt: adapted.prompt,
    context: adapted.context,
    options: Object.freeze(adapted.options),
    answerIndex: adapted.answerIndex,
    explanation,
    hints: Object.freeze(hints.slice(0, 2)),
    detailedOptions: Object.freeze(orderedDiagnostics.map((row) => row.isCorrect ? `Doğru: ${row.rationale}` : `Yanlış: ${row.rationale}`)),
    optionDiagnostics: orderedDiagnostics,
    skill: family.constructId,
    subjectId: family.subjectId,
    topicId: family.topicId,
    learningOutcomeId: family.outcomeId,
    curriculumReferenceId: family.outcomeId,
    gradeBand: String(family.grade),
    targetGrade: family.grade,
    difficulty: family.grade === 8 ? 5 : 4,
    cognitiveDepth: family.grade === 8 ? 5 : 4,
    authoredReasoningStepCount: steps.length,
    reasoningStepCount: solutionGraph.length,
    cognitiveTraits: Object.freeze(['solverBacked', 'multiStepReasoning', 'diagnosticDistractors', 'independentVerification']),
    familyId: family.id,
    skeletonId: `${family.id}:${skeleton.id}`,
    reasoningPathId: `${family.id}:${skeleton.reasoningPathId || skeleton.id}`,
    solutionGraphId: `${family.id}:${baseSurface.solutionGraphId || 'default'}`,
    cognitiveExperienceId: `cx:${family.grade}:${family.id}:${skeleton.experienceType || skeleton.id}`,
    surfaceDomainId: `surface:${family.grade}:${skeleton.surfaceDomain || skeleton.id}`,
    interactionTypeId: gameId === 'error-detective' ? 'error-analysis-choice' : 'quantitative-choice',
    trustedExperienceType: skeleton.experienceType || skeleton.id,
    trustedSessionOrder: Number(sessionOrder),
    solutionGraph,
    cognitiveDepthEvidence: Object.freeze({
      authoredReasoningStepCount: steps.length,
      reasoningStepCount: solutionGraph.length,
      highCognitiveTraits: ['solverBacked', 'relationAnalysis', 'independentVerification'],
      source: 'solver-backed-math-family-engine-v5'
    }),
    sourceLabel: `${family.grade}. Sınıf Matematik · Solver Destekli Kazanım Motoru`,
    premiumTier: 'PLATINUM',
    premiumQuestion: true,
    canonicalQuestionId: `${family.id}:${signature}`,
    constructId: family.constructId,
    knowledgeComponents: Object.freeze([...family.knowledgeComponents]),
    intendedDifficultyBand: family.grade === 8 ? 'LGS_HIGH' : 'GRADE4_CHALLENGING',
    durationSeconds: family.durationSeconds,
    timeLimit: family.durationSeconds,
    solverProof: Object.freeze({
      verified: true,
      solverId: `${family.id}:solver-v1`,
      independentVerifierId: `${family.id}:verifier-v1`,
      evidenceType: 'independent-code-verifier',
      answerText: distinct.correctText,
      parameterSignature: signature
    }),
    requireExplicitDistractorEvidence: true,
    distractorValidation: Object.freeze({
      verified: true,
      diagnosticCount: 3,
      distinctMisconceptions: 3,
      violations: Object.freeze([])
    }),
    engineReview: Object.freeze({
      status: 'ENGINE_VERIFIED',
      finalSurfaceGateRequired: true,
      humanGoldenSampleComparisonRequired: true,
      policy: 'NO_LEGACY_FALLBACK'
    })
  });
}

export function generateSolverBackedMathRounds(families, {
  variantsPerSkeleton = 1,
  gameIds = null,
  seedBase = 1000
} = {}) {
  const rounds = [];
  let sessionOrder = 1;
  for (const family of families) {
    const supportedGames = gameIds ? family.gameIds.filter((id) => gameIds.includes(id)) : family.gameIds;
    for (const gameId of supportedGames) {
      for (let skeletonIndex = 0; skeletonIndex < family.skeletons.length; skeletonIndex += 1) {
        for (let variant = 0; variant < variantsPerSkeleton; variant += 1) {
          rounds.push(materializeSolverBackedMathRound(family, {
            seed: seedBase + family.grade * 10000 + sessionOrder * 37 + variant,
            skeletonIndex,
            gameId,
            sessionOrder
          }));
          sessionOrder += 1;
        }
      }
    }
  }
  return Object.freeze(rounds);
}

export function mathFamilyEngineAudit(families, rounds) {
  const errors = [];
  const familyIds = new Set();
  for (const family of families) {
    if (familyIds.has(family.id)) errors.push(`duplicate-family:${family.id}`);
    familyIds.add(family.id);
    if (family.skeletons.length < REQUIRED_SKELETON_COUNT) errors.push(`skeleton-underfill:${family.id}`);
  }
  const keys = rounds.map((round) => round.questionKey);
  if (new Set(keys).size !== keys.length) errors.push('duplicate-question-key');
  const surfaces = rounds.map((round) => `${round.context}\n${round.prompt}`.toLocaleLowerCase('tr-TR'));
  if (new Set(surfaces).size !== surfaces.length) errors.push('duplicate-final-surface');
  for (const round of rounds) {
    if (round.solverProof?.verified !== true) errors.push(`solver-unverified:${round.questionKey}`);
    if (round.distractorValidation?.diagnosticCount !== 3) errors.push(`distractor-count:${round.questionKey}`);
    if (Number(round.authoredReasoningStepCount || 0) < 4) errors.push(`reasoning-underfill:${round.questionKey}`);
  }
  return Object.freeze({
    ok: errors.length === 0,
    errors: Object.freeze(errors),
    metrics: Object.freeze({
      familyCount: families.length,
      roundCount: rounds.length,
      distinctFamilyCount: familyIds.size,
      distinctSkeletonCount: new Set(rounds.map((round) => round.skeletonId)).size,
      distinctExperienceCount: new Set(rounds.map((round) => round.cognitiveExperienceId)).size,
      solverVerifiedCount: rounds.filter((round) => round.solverProof?.verified === true).length
    })
  });
}
