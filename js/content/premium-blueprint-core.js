import { createPremiumChoicePack, definePremiumChoice } from './premium-question-core.js';

function text(value, field, id) {
  const out = String(value ?? '').trim();
  if (!out) throw new Error(`${id || 'premium-blueprint'}: ${field} is required`);
  return out;
}

function hash(value = '') {
  let state = 2166136261;
  for (const ch of String(value)) {
    state ^= ch.charCodeAt(0);
    state = Math.imul(state, 16777619);
  }
  return (state >>> 0).toString(36);
}

function normalize(value = '') {
  return String(value).toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();
}

function cloneData(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function freezeVariant(variant, blueprintId) {
  if (!variant || typeof variant !== 'object') throw new Error(`${blueprintId}: variant must be an object`);
  const variantId = text(variant.id, 'variant.id', blueprintId);
  return Object.freeze({ ...cloneData(variant), id: variantId });
}

export function definePremiumBlueprint({
  id,
  gameId,
  familyId,
  skeletonId,
  reasoningPathId = 'solve-verify-explain',
  subjectId,
  topicId,
  learningOutcomeId,
  gradeBand,
  difficulty = 4,
  cognitiveTraits,
  reasoningStepCount = 3,
  solutionClass = 'verified-solution',
  variants,
  render,
  solve,
  verify,
  formatAnswer,
  buildDistractors,
  buildExplanation,
  buildEvidence
}) {
  const blueprintId = text(id, 'id', id);
  for (const [name, fn] of Object.entries({ render, solve, verify, formatAnswer, buildDistractors, buildExplanation, buildEvidence })) {
    if (typeof fn !== 'function') throw new Error(`${blueprintId}: ${name} function is required`);
  }
  if (!Array.isArray(variants) || variants.length < 2) {
    throw new Error(`${blueprintId}: at least two verified variants are required`);
  }
  const frozenVariants = variants.map((variant) => freezeVariant(variant, blueprintId));
  const variantIds = frozenVariants.map((variant) => variant.id);
  if (new Set(variantIds).size !== variantIds.length) throw new Error(`${blueprintId}: variant ids must be distinct`);
  if (!Array.isArray(cognitiveTraits) || cognitiveTraits.length < 2) {
    throw new Error(`${blueprintId}: at least two cognitive traits are required`);
  }
  if (Number(reasoningStepCount) < 2) throw new Error(`${blueprintId}: reasoningStepCount must be at least two`);

  return Object.freeze({
    id: blueprintId,
    gameId: text(gameId, 'gameId', blueprintId),
    familyId: text(familyId, 'familyId', blueprintId),
    skeletonId: text(skeletonId, 'skeletonId', blueprintId),
    reasoningPathId: text(reasoningPathId, 'reasoningPathId', blueprintId),
    subjectId: text(subjectId, 'subjectId', blueprintId),
    topicId: text(topicId, 'topicId', blueprintId),
    learningOutcomeId: text(learningOutcomeId, 'learningOutcomeId', blueprintId),
    gradeBand: text(gradeBand, 'gradeBand', blueprintId),
    difficulty: Number(difficulty),
    cognitiveTraits: Object.freeze([...cognitiveTraits]),
    reasoningStepCount: Number(reasoningStepCount),
    solutionClass: text(solutionClass, 'solutionClass', blueprintId),
    variants: Object.freeze(frozenVariants),
    render,
    solve,
    verify,
    formatAnswer,
    buildDistractors,
    buildExplanation,
    buildEvidence
  });
}

function materializeBlueprintVariant(blueprint, variant) {
  const variantInput = cloneData(variant);
  const rendered = blueprint.render(cloneData(variantInput));
  if (!rendered || typeof rendered !== 'object') throw new Error(`${blueprint.id}/${variant.id}: render must return an object`);
  const solvedValue = blueprint.solve(cloneData(variantInput));
  if (blueprint.verify(cloneData(variantInput), cloneData(solvedValue)) !== true) {
    throw new Error(`${blueprint.id}/${variant.id}: solver result failed independent verification`);
  }
  const answer = text(blueprint.formatAnswer(cloneData(solvedValue), cloneData(variantInput)), 'formatted answer', `${blueprint.id}/${variant.id}`);
  const rawDistractors = blueprint.buildDistractors(cloneData(variantInput), cloneData(solvedValue));
  if (!Array.isArray(rawDistractors) || rawDistractors.length !== 3) {
    throw new Error(`${blueprint.id}/${variant.id}: exactly three distractors are required`);
  }
  const distractors = rawDistractors.map((entry, index) => {
    if (!entry || typeof entry !== 'object' || !Object.hasOwn(entry, 'value')) {
      throw new Error(`${blueprint.id}/${variant.id}: distractor ${index + 1} must carry a value for verification`);
    }
    if (blueprint.verify(cloneData(variantInput), cloneData(entry.value)) === true) {
      throw new Error(`${blueprint.id}/${variant.id}: distractor ${index + 1} also satisfies the verifier`);
    }
    return {
      text: text(entry.text, `distractor[${index}].text`, blueprint.id),
      misconceptionId: text(entry.misconceptionId, `distractor[${index}].misconceptionId`, blueprint.id),
      why: text(entry.why, `distractor[${index}].why`, blueprint.id),
      constructionRule: text(entry.constructionRule, `distractor[${index}].constructionRule`, blueprint.id)
    };
  });
  if (new Set(distractors.map((entry) => normalize(entry.text))).size !== 3) {
    throw new Error(`${blueprint.id}/${variant.id}: distractor texts must be distinct`);
  }
  if (distractors.some((entry) => normalize(entry.text) === normalize(answer))) {
    throw new Error(`${blueprint.id}/${variant.id}: distractor duplicates the verified answer`);
  }
  const explanation = text(blueprint.buildExplanation(cloneData(variantInput), cloneData(solvedValue)), 'explanation', blueprint.id);
  const evidence = blueprint.buildEvidence(cloneData(variantInput), cloneData(solvedValue));
  if (!Array.isArray(evidence) || evidence.length < 2 || evidence.some((entry) => !String(entry).trim())) {
    throw new Error(`${blueprint.id}/${variant.id}: at least two evidence steps are required`);
  }

  const structuralId = `st:premium:${hash(`${blueprint.id}|${blueprint.skeletonId}|${blueprint.reasoningPathId}`)}`;
  const cognitiveExperienceId = `cx:premium:${hash(`${blueprint.id}|${blueprint.familyId}|${blueprint.solutionClass}`)}`;
  const surfaceFingerprint = `sf:premium:${hash(`${normalize(rendered.context)}|${normalize(rendered.prompt)}|${normalize(answer)}`)}`;
  const solverProof = Object.freeze({
    verifier: 'premium-blueprint-core-v1',
    blueprintId: blueprint.id,
    variantId: variant.id,
    inputHash: hash(JSON.stringify(variantInput)),
    correctValueHash: hash(JSON.stringify(solvedValue)),
    verifiedCorrect: true,
    verifiedDistractorCount: 3
  });

  return definePremiumChoice({
    id: `${blueprint.id}:${variant.id}`,
    gameId: blueprint.gameId,
    familyId: blueprint.familyId,
    skeletonId: blueprint.skeletonId,
    reasoningPathId: blueprint.reasoningPathId,
    subjectId: blueprint.subjectId,
    topicId: blueprint.topicId,
    learningOutcomeId: blueprint.learningOutcomeId,
    gradeBand: blueprint.gradeBand,
    difficulty: blueprint.difficulty,
    prompt: text(rendered.prompt, 'render.prompt', blueprint.id),
    context: text(rendered.context, 'render.context', blueprint.id),
    answer,
    distractors,
    explanation,
    hints: Array.isArray(rendered.hints) ? rendered.hints.filter(Boolean) : [],
    cognitiveTraits: blueprint.cognitiveTraits,
    reasoningStepCount: blueprint.reasoningStepCount,
    evidence,
    blueprintId: blueprint.id,
    variantId: variant.id,
    structuralId,
    cognitiveExperienceId,
    surfaceFingerprint,
    solverProof
  });
}

export function createPremiumBlueprintPack({ version, sourceLabel, blueprints }) {
  if (!Array.isArray(blueprints) || !blueprints.length) throw new Error('premium blueprint pack must contain blueprints');
  const blueprintIds = blueprints.map((entry) => entry?.id);
  if (new Set(blueprintIds).size !== blueprintIds.length) throw new Error('premium blueprint ids must be distinct');
  const items = [];
  const instances = [];
  for (const blueprint of blueprints) {
    for (const variant of blueprint.variants) {
      const item = materializeBlueprintVariant(blueprint, variant);
      items.push(item);
      instances.push(Object.freeze({
        blueprintId: blueprint.id,
        variantId: variant.id,
        gameId: blueprint.gameId,
        structuralId: item.structuralId,
        cognitiveExperienceId: item.cognitiveExperienceId,
        surfaceFingerprint: item.surfaceFingerprint,
        verified: item.solverProof?.verifiedCorrect === true && item.solverProof?.verifiedDistractorCount === 3
      }));
    }
  }
  const choicePack = createPremiumChoicePack({ version, sourceLabel, items });
  return Object.freeze({
    ...choicePack,
    blueprintCount: blueprints.length,
    variantCount: items.length,
    validationReport: Object.freeze({
      blueprintCount: blueprints.length,
      variantCount: items.length,
      verifiedInstances: instances.filter((entry) => entry.verified).length,
      instances: Object.freeze(instances)
    })
  });
}
