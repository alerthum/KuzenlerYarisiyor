// V11 Stage 9: çalıştırılabilir soru üretim sözleşmesi ve aday soru doğrulaması.

export function getV11Blueprint(catalog, skeletonId) {
  const list = Array.isArray(catalog) ? catalog : catalog?.blueprints;
  if (!Array.isArray(list)) throw new TypeError('V11 blueprint kataloğu geçersiz.');
  const blueprint = list.find(item => item.skeletonId === skeletonId);
  if (!blueprint) throw new Error(`V11 blueprint bulunamadı: ${skeletonId}`);
  return blueprint;
}

export function createV11ProductionContract(blueprint, { difficulty = 2, variationAxis } = {}) {
  if (!blueprint?.skeletonId) throw new TypeError('Geçerli bir V11 blueprint gereklidir.');
  const level = blueprint.difficultyContract.levels.find(item => item.level === difficulty);
  if (!level) throw new RangeError(`Geçersiz zorluk seviyesi: ${difficulty}`);
  const axes = blueprint.variationContract.realVariationAxes || [];
  const selectedAxis = variationAxis || axes[0];
  if (!selectedAxis) throw new Error(`${blueprint.skeletonId} için gerçek varyasyon ekseni bulunamadı.`);
  if (!axes.includes(selectedAxis)) throw new Error(`Blueprint dışı varyasyon ekseni kullanılamaz: ${selectedAxis}`);

  return Object.freeze({
    contractVersion: '11.0.0',
    blueprintId: blueprint.blueprintId,
    skeletonId: blueprint.skeletonId,
    familyId: blueprint.familyId,
    difficulty: level,
    selectedVariationAxis: selectedAxis,
    sourceContract: blueprint.sourceContract,
    evidenceContract: blueprint.evidenceContract,
    questionContract: blueprint.questionContract,
    optionContract: blueprint.optionContract,
    qualityGate: blueprint.qualityGate
  });
}

export function auditV11QuestionCandidate(candidate, blueprint) {
  const errors = [];
  const warnings = [];
  if (!candidate || typeof candidate !== 'object') return { accepted: false, errors: ['QUESTION_MISSING'], warnings };
  if (candidate.skeletonId !== blueprint.skeletonId) errors.push('SKELETON_ID_MISMATCH');

  const options = candidate.options || candidate.choices;
  if (!Array.isArray(options) || options.length !== blueprint.optionContract.optionCount) errors.push('OPTION_COUNT_INVALID');
  const correctIndex = Number.isInteger(candidate.correctIndex) ? candidate.correctIndex : candidate.answerIndex;
  if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= (options?.length || 0)) errors.push('CORRECT_INDEX_INVALID');

  const evidenceUnits = candidate.evidenceMap?.evidenceUnits || [];
  const minEvidence = blueprint.evidenceContract.evidenceCount.min;
  if (!blueprint.evidenceContract.allowHolisticEvidence && evidenceUnits.length < minEvidence) errors.push('EVIDENCE_COUNT_INSUFFICIENT');
  if (blueprint.evidenceContract.correctAnswerMustReferenceEvidence && !(candidate.evidenceMap?.correctAnswerEvidenceIds?.length)) errors.push('CORRECT_ANSWER_EVIDENCE_MISSING');

  const diagnostics = candidate.optionDiagnostics || [];
  const wrongDiagnostics = diagnostics.filter(x => x?.isCorrect === false && x?.misconceptionId);
  const uniqueMisconceptions = new Set(wrongDiagnostics.map(x => x.misconceptionId));
  if (uniqueMisconceptions.size !== blueprint.optionContract.distractorCount) errors.push('DISTINCT_MISCONCEPTIONS_MISSING');

  if (!candidate.variationAxis) errors.push('VARIATION_AXIS_MISSING');
  else if (!blueprint.variationContract.realVariationAxes.includes(candidate.variationAxis)) errors.push('VARIATION_AXIS_INVALID');

  const prompt = String(candidate.prompt || candidate.question || '').trim();
  if (!prompt) errors.push('QUESTION_STEM_MISSING');
  if (candidate.answerLeak === true) errors.push('ANSWER_LEAK');
  if (!candidate.explanation && !candidate.solution) warnings.push('SOLUTION_MISSING');

  return {
    accepted: errors.length === 0,
    skeletonId: blueprint.skeletonId,
    blueprintId: blueprint.blueprintId,
    errors,
    warnings
  };
}
