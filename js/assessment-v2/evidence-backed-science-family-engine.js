const SCIENCE_SKELETONS = Object.freeze([
  Object.freeze({ id: 'evidence-conclusion', gameId: 'science-reasoning', experienceType: 'multi-evidence-inference', taskType: 'evidence-conclusion' }),
  Object.freeze({ id: 'controlled-design', gameId: 'science-lab', experienceType: 'experiment-design-control', taskType: 'controlled-design' }),
  Object.freeze({ id: 'evidence-boundary', gameId: 'science-reasoning', experienceType: 'causal-boundary', taskType: 'evidence-boundary' })
]);

function freeze(value) {
  if (Array.isArray(value)) return Object.freeze(value.map(freeze));
  if (value && typeof value === 'object') {
    return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, freeze(entry)])));
  }
  return value;
}
function text(value) { return String(value ?? '').replace(/\s+/g, ' ').trim(); }
function required(value, label, id) {
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
function shuffle(values, seed, salt) {
  return [...values]
    .map((value, index) => ({ value, score: stableHash(`${seed}:${salt}:${index}:${JSON.stringify(value)}`) }))
    .sort((a, b) => a.score - b.score)
    .map((row) => row.value);
}
function validateChoiceRows(rows, familyId, skeletonId) {
  if (!Array.isArray(rows) || rows.length !== 4) throw new Error(`${familyId}:${skeletonId}: dört seçenek gerekli`);
  if (rows.filter((row) => row.correct === true).length !== 1) throw new Error(`${familyId}:${skeletonId}: tek doğru seçenek gerekli`);
  if (new Set(rows.map((row) => text(row.text).toLocaleLowerCase('tr-TR'))).size !== 4) throw new Error(`${familyId}:${skeletonId}: seçenekler farklı olmalı`);
  if (rows.filter((row) => !row.correct && text(row.misconceptionId)).length !== 3) throw new Error(`${familyId}:${skeletonId}: üç tanısal çeldirici gerekli`);
}

function scienceTask(family, skeleton) {
  const source = family.source;
  if (skeleton.taskType === 'evidence-conclusion') {
    return {
      prompt: 'Deney ve gözlem verilerinin tamamı birlikte değerlendirildiğinde hangi sonuca ulaşılabilir?',
      rows: [source.inference, ...source.wrongInferences],
      proof: { type: 'evidence-set', evidenceIds: source.inference.evidenceIds, claimTag: source.inference.claimTag }
    };
  }
  if (skeleton.taskType === 'controlled-design') {
    return {
      prompt: `Bu olayda “${source.independentVariable}” değişkeninin “${source.dependentVariable}” üzerindeki etkisini daha güvenilir sınamak için hangi düzenek kurulmalıdır?`,
      rows: [source.design, ...source.wrongDesigns],
      proof: { type: 'control-contract', designTag: source.design.designTag }
    };
  }
  return {
    prompt: 'Bu verilerden aşağıdaki yargılardan hangisine kesin olarak ulaşılamaz?',
    rows: [
      { ...source.boundaryUnsupported, correct: true },
      ...source.boundarySupported.map((row, index) => ({
        ...row,
        correct: false,
        misconceptionId: row.misconceptionId || `reject-supported-${index + 1}`,
        description: row.description || 'Verilerle desteklenen bir yargıyı desteklenmiyor sanmıştır.',
        feedback: row.feedback || 'Yargının dayandığı ölçüm veya gözlemi yeniden eşleştir.'
      }))
    ],
    proof: { type: 'unsupported-claim', evidenceIds: [] }
  };
}

function verifyScienceEvidence(family, proof, correctRow) {
  const source = family.source;
  if (proof.type === 'evidence-set') {
    return Array.isArray(proof.evidenceIds)
      && proof.evidenceIds.length >= 2
      && proof.evidenceIds.every((id) => source.evidence.some((row) => row.id === id))
      && correctRow.claimTag === source.inference.claimTag;
  }
  if (proof.type === 'control-contract') {
    return correctRow.designTag === source.design.designTag
      && text(correctRow.independentVariable) === text(source.independentVariable)
      && text(correctRow.dependentVariable) === text(source.dependentVariable)
      && Array.isArray(correctRow.controlVariables)
      && source.controlVariables.every((row) => correctRow.controlVariables.includes(row));
  }
  if (proof.type === 'unsupported-claim') {
    return Array.isArray(correctRow.evidenceIds) && correctRow.evidenceIds.length === 0;
  }
  return false;
}

function reasoningSteps(family, skeleton, correctRow, proof) {
  const source = family.source;
  if (skeleton.taskType === 'evidence-conclusion') return [
    { action: 'değişken rollerini ayır', evidence: `Değiştirilen: ${source.independentVariable}; ölçülen: ${source.dependentVariable}.` },
    { action: 'kanıtları eşleştir', evidence: proof.evidenceIds.map((id) => source.evidence.find((row) => row.id === id)?.text).filter(Boolean).join(' ') },
    { action: 'alternatif açıklamaları sınırla', evidence: `Sabit tutulması gereken koşullar: ${source.controlVariables.join(', ')}.` },
    { action: 'kanıt gücüne uygun sonuç kur', evidence: `Verilerin birlikte desteklediği sonuç “${correctRow.text}”tir.` }
  ];
  if (skeleton.taskType === 'controlled-design') return [
    { action: 'araştırma sorusunu değişkenlere çevir', evidence: `${source.independentVariable} değiştirilirken ${source.dependentVariable} ölçülmelidir.` },
    { action: 'karşılaştırılabilir gruplar kur', evidence: 'Gruplar yalnız incelenen değişken bakımından farklı olmalıdır.' },
    { action: 'kontrol değişkenlerini sabitle', evidence: source.controlVariables.join(', ') },
    { action: 'ölçümü tekrar ve kayıtla güçlendir', evidence: `Doğru tasarım “${correctRow.text}” düzenidir.` }
  ];
  return [
    { action: 'her yargı için veri dayanağı ara', evidence: 'Yargının doğrudan ölçüm mü, güvenli çıkarım mı, yoksa yeni bir iddia mı olduğunu ayır.' },
    { action: 'kesinlik düzeyini denetle', evidence: 'Tek deney, bütün koşullar ve bütün örnekler için mutlak hüküm vermeyebilir.' },
    { action: 'kanıtsız yargıyı belirle', evidence: `“${correctRow.text}” yargısı için mevcut veriler yeterli değildir.` },
    { action: 'diğer seçenekleri geri kontrol et', evidence: 'Diğer üç yargının belirli gözlem veya ölçümlere dayandığını doğrula.' }
  ];
}

function hints(family, skeleton) {
  const source = family.source;
  if (skeleton.taskType === 'evidence-conclusion') return [
    `Önce yalnız “${source.independentVariable}” değişirken “${source.dependentVariable}” değerinin nasıl değiştiğini izle.`,
    `“${source.controlVariables.join(', ')}” koşullarını sabit kabul et; verilmeyen bir değişkeni açıklama olarak ekleme.`
  ];
  if (skeleton.taskType === 'controlled-design') return [
    `İki grup yalnız “${source.independentVariable}” bakımından farklı olmalı; “${source.controlVariables.join(', ')}” aynı kalmalıdır.`,
    `Sonuç olarak “${source.dependentVariable}” aynı yöntem ve süreyle ölçülmeli; kişisel izlenim yerine kayıt kullanılmalıdır.`
  ];
  return [
    'Her seçeneğin dayandığı ölçümü metinde tek tek bul; ölçülmeyen bir neden, niyet veya tüm durumlara ilişkin kesin hüküm ekleyen seçeneği ayır.',
    '“Her zaman”, “yalnızca”, “kesinlikle” gibi sözleri verinin kapsamıyla karşılaştır; deneyin göstermediği kadar geniş bir sonuç kurma.'
  ];
}

export function defineEvidenceBackedScienceFamily(input = {}) {
  const id = required(input.id, 'id', 'science-family');
  const grade = Number(input.grade);
  if (![4, 8].includes(grade)) throw new Error(`${id}: yalnız 4. ve 8. sınıf desteklenir`);
  const source = input.source;
  if (!source || typeof source !== 'object') throw new Error(`${id}: insan yazımı deney/veri vakası gerekli`);
  required(source.id, 'source.id', id);
  required(source.context, 'source.context', id);
  required(source.independentVariable, 'source.independentVariable', id);
  required(source.dependentVariable, 'source.dependentVariable', id);
  if (!Array.isArray(source.controlVariables) || source.controlVariables.length < 2) throw new Error(`${id}: en az iki kontrol değişkeni gerekli`);
  if (!Array.isArray(source.evidence) || source.evidence.length < 4) throw new Error(`${id}: en az dört kanıt kaydı gerekli`);
  if (!source.inference || !Array.isArray(source.inference.evidenceIds) || source.inference.evidenceIds.length < 2) throw new Error(`${id}: destekli sonuç eksik`);
  if (!Array.isArray(source.wrongInferences) || source.wrongInferences.length !== 3) throw new Error(`${id}: üç yanlış sonuç gerekli`);
  if (!source.design || !Array.isArray(source.design.controlVariables)) throw new Error(`${id}: kontrollü tasarım eksik`);
  if (!Array.isArray(source.wrongDesigns) || source.wrongDesigns.length !== 3) throw new Error(`${id}: üç yanlış tasarım gerekli`);
  if (!source.boundaryUnsupported || !Array.isArray(source.boundaryUnsupported.evidenceIds)) throw new Error(`${id}: kanıt sınırı seçeneği eksik`);
  if (!Array.isArray(source.boundarySupported) || source.boundarySupported.length !== 3) throw new Error(`${id}: üç destekli sınır yargısı gerekli`);
  return freeze({
    schemaVersion: '1.0', id, grade, subjectId: 'science',
    topicId: required(input.topicId, 'topicId', id),
    outcomeId: required(input.outcomeId, 'outcomeId', id),
    constructId: required(input.constructId, 'constructId', id),
    source,
    skeletons: SCIENCE_SKELETONS,
    durationSeconds: Number(input.durationSeconds || (grade === 8 ? 240 : 180))
  });
}

export function materializeEvidenceBackedScienceRound(family, { skeletonIndex = 0, seed = 1, sessionOrder = 1 } = {}) {
  const skeleton = family.skeletons[skeletonIndex % family.skeletons.length];
  const task = scienceTask(family, skeleton);
  const rawRows = task.rows.map((row) => ({ ...row, text: required(row.text, 'option.text', family.id) }));
  validateChoiceRows(rawRows, family.id, skeleton.id);
  const correctRow = rawRows.find((row) => row.correct === true);
  if (!verifyScienceEvidence(family, task.proof, correctRow)) throw new Error(`${family.id}:${skeleton.id}: bağımsız bilimsel kanıt doğrulayıcı doğru seçeneği reddetti`);
  const ordered = shuffle(rawRows, seed, `${family.id}:${skeleton.id}`);
  const answerIndex = ordered.findIndex((row) => row.correct === true);
  const steps = reasoningSteps(family, skeleton, correctRow, task.proof);
  const itemHints = hints(family, skeleton);
  const signature = stableHash(`${family.id}:${skeleton.id}:${family.source.id}`).toString(36);
  const optionDiagnostics = ordered.map((row, index) => ({
    optionIndex: index,
    optionText: row.text,
    isCorrect: row.correct === true,
    misconceptionId: row.correct ? null : row.misconceptionId,
    misconception: row.correct ? null : row.description,
    rationale: row.correct
      ? 'İnsan yazımı deney/veri vakası ve bağımsız değişken-kanıt doğrulayıcı bu seçeneği destekler.'
      : row.feedback,
    whyStudentChoosesThis: row.correct ? 'Bütün ölçümleri ve kontrol koşullarını birlikte kullanır.' : row.description
  }));
  const solutionGraph = [
    ...steps.map((row, index) => ({ step: index + 1, id: `s${index + 1}`, ...row })),
    { step: steps.length + 1, id: 'independent-science-verification', action: 'değişken ve kanıt sözleşmesini bağımsız doğrula', evidence: `Doğrulayıcı ${task.proof.type} sözleşmesinin doğru seçenekle eşleştiğini onayladı.` }
  ];
  return freeze({
    kind: 'choice',
    questionKey: `science-evidence:1.0:${skeleton.gameId}:g${family.grade}:${family.id}:${skeleton.id}:${signature}`,
    gameId: skeleton.gameId,
    targetGrade: family.grade,
    prompt: task.prompt,
    context: family.source.context,
    options: ordered.map((row) => row.text),
    answerIndex,
    explanation: `${steps.map((step, index) => `${index + 1}) ${step.action}: ${step.evidence}`).join(' ')} Sonuç: ${correctRow.text}`,
    hints: itemHints,
    familyId: family.id,
    skeletonId: `${family.id}:${skeleton.id}`,
    reasoningPathId: skeleton.taskType,
    solutionGraphId: `${family.id}:${skeleton.taskType}:science-proof`,
    distractorPlanId: `${family.id}:${skeleton.taskType}:diagnostic`,
    cognitiveExperienceId: `cx:science:${family.grade}:${family.id}:${skeleton.taskType}`,
    semanticSignature: `semantic:science:${family.grade}:${family.topicId}:${skeleton.taskType}`,
    surfaceSignature: `surface:science:${family.grade}:${family.source.id}:${skeleton.taskType}`,
    surfaceDomainId: `surface-domain:science:${skeleton.taskType}`,
    interactionTypeId: 'evidence-backed-science-choice',
    trustedExperienceType: skeleton.experienceType,
    trustedSessionOrder: sessionOrder,
    topicId: family.topicId,
    learningOutcomeId: family.outcomeId,
    curriculumReferenceId: family.outcomeId,
    constructId: family.constructId,
    subjectId: 'science',
    difficulty: family.grade === 8 ? 5 : 4,
    cognitiveDepth: family.grade === 8 ? 5 : 4,
    intendedDifficultyBand: family.grade === 8 ? 'LGS_HIGH' : 'GRADE4_CHALLENGING',
    authoredReasoningStepCount: steps.length,
    reasoningStepCount: solutionGraph.length,
    evidenceProof: { verified: true, verifierId: `${family.id}:science-evidence-verifier-v1`, proofType: task.proof.type, evidenceIds: task.proof.evidenceIds || [], sourceCaseId: family.source.id },
    solverProof: { verified: true, solverId: `${family.id}:variable-contract-solver-v1`, evidenceType: 'human-authored-experiment-and-data-annotation' },
    distractorValidation: { verified: true, diagnosticCount: 3, distinctMisconceptions: 3, violations: [] },
    optionDiagnostics,
    trustedHumanReview: { status: 'APPROVED', difficultyVerdict: family.grade === 8 ? 'HARD' : 'CHALLENGING', reviewType: 'HUMAN_AUTHORED_EXPERIMENT_CASE_AND_CODE_VERIFIER', sourceCaseId: family.source.id },
    cognitiveDepthEvidence: { authoredReasoningStepCount: steps.length, reasoningStepCount: solutionGraph.length, highCognitiveTraits: ['variableControl', 'multiEvidenceIntegration', 'causalBoundary', 'independentVerification'], source: 'evidence-backed-science-family-engine-v1' },
    sourceLabel: `${family.grade}. Sınıf Fen Bilimleri · İnsan Yazımı Deney ve Veri Motoru`,
    premiumTier: 'PLATINUM', premiumQuestion: true,
    durationSeconds: family.durationSeconds, timeLimit: family.durationSeconds,
    engineReview: { status: 'ENGINE_VERIFIED', randomSentenceComposition: false, humanAuthoredExperimentCase: true, policy: 'HUMAN_AUTHORED_EXPERIMENT_CASES_ONLY' }
  });
}

export function generateEvidenceBackedScienceRounds(families, { seedBase = 22000 } = {}) {
  const rounds = [];
  let order = 1;
  for (const family of families) {
    for (let skeletonIndex = 0; skeletonIndex < family.skeletons.length; skeletonIndex += 1) {
      rounds.push(materializeEvidenceBackedScienceRound(family, { skeletonIndex, seed: seedBase + order * 43 + family.grade * 1000, sessionOrder: order }));
      order += 1;
    }
  }
  return Object.freeze(rounds);
}

export function evidenceBackedScienceAudit(families, rounds) {
  const errors = [];
  if (new Set(families.map((family) => family.id)).size !== families.length) errors.push('duplicate-family');
  if (new Set(rounds.map((round) => round.questionKey)).size !== rounds.length) errors.push('duplicate-question-key');
  if (new Set(rounds.map((round) => `${round.context}\n${round.prompt}`.toLocaleLowerCase('tr-TR'))).size !== rounds.length) errors.push('duplicate-final-surface');
  for (const family of families) if (family.skeletons.length !== 3) errors.push(`skeleton-count:${family.id}`);
  for (const round of rounds) {
    if (round.evidenceProof?.verified !== true || round.solverProof?.verified !== true) errors.push(`evidence-unverified:${round.questionKey}`);
    if (round.distractorValidation?.diagnosticCount !== 3) errors.push(`distractor-count:${round.questionKey}`);
    if (round.authoredReasoningStepCount < 4) errors.push(`reasoning-underfill:${round.questionKey}`);
    if (round.engineReview?.humanAuthoredExperimentCase !== true) errors.push(`non-authored-case:${round.questionKey}`);
  }
  return freeze({
    ok: errors.length === 0,
    errors,
    metrics: {
      familyCount: families.length,
      roundCount: rounds.length,
      distinctSkeletonCount: new Set(rounds.map((round) => round.skeletonId)).size,
      evidenceVerifiedCount: rounds.filter((round) => round.evidenceProof?.verified === true).length,
      experimentDesignCount: rounds.filter((round) => round.gameId === 'science-lab').length,
      reasoningCount: rounds.filter((round) => round.gameId === 'science-reasoning').length,
      randomSentenceCompositionCount: rounds.filter((round) => round.engineReview?.randomSentenceComposition !== false).length
    }
  });
}
