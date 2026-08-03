function normalize(value) {
  return String(value ?? '').toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();
}

function stableHash(value) {
  let state = 2166136261;
  for (const ch of String(value)) { state ^= ch.charCodeAt(0); state = Math.imul(state, 16777619); }
  return (state >>> 0).toString(36);
}

function assertNoSolutionLeak(rendered, graph, id) {
  const prompt = normalize(`${rendered.context || ''} ${rendered.prompt || ''}`);
  for (const step of graph.steps) {
    const action = normalize(step.action);
    if (action.length >= 8 && prompt.includes(action)) throw new Error(`${id}: solution_leak:${step.id}`);
  }
}

export function materializeItemModel(model, seedInput = {}) {
  const task = model.generateTask(structuredClone(seedInput));
  const correct = model.solve(structuredClone(task));
  if (model.verify(structuredClone(task), structuredClone(correct)) !== true) throw new Error(`${model.id}: solver_verification_failed`);
  const rendered = model.render(structuredClone(task), structuredClone(correct));
  if (!rendered || !rendered.prompt) throw new Error(`${model.id}: render_failed`);
  assertNoSolutionLeak(rendered, model.solutionGraph, model.id);

  const distractors = model.misconceptions.map((misconception) => {
    const value = misconception.apply(structuredClone(task), structuredClone(correct));
    if (model.verify(structuredClone(task), structuredClone(value)) === true) throw new Error(`${model.id}: misconception_produces_correct:${misconception.id}`);
    return Object.freeze({
      value,
      text: String(rendered.formatOption ? rendered.formatOption(value) : value),
      misconceptionId: misconception.id,
      why: misconception.description,
      feedback: misconception.feedback,
      buggyRule: misconception.buggyRule
    });
  });
  const answerText = String(rendered.formatOption ? rendered.formatOption(correct) : correct);
  const optionTexts = [answerText, ...distractors.map(d => d.text)].map(normalize);
  if (new Set(optionTexts).size !== optionTexts.length) throw new Error(`${model.id}: duplicate_or_equivalent_options`);

  const hints = model.solutionGraph.steps.map((step) => step.hint);
  const solution = model.solutionGraph.steps.map((step) => ({ id: step.id, explanation: step.evidence }));
  const surfaceFingerprint = `sf:v2:${stableHash(JSON.stringify({ context: normalize(rendered.context), prompt: normalize(rendered.prompt), task }))}`;
  return Object.freeze({
    schemaVersion: '2.0', itemModelId: model.id, domain: model.domain,
    constructId: model.construct.id, knowledgeComponents: model.construct.knowledgeComponents,
    compatibleGameIds: model.compatibleGameIds, interactionType: model.interactionType,
    context: String(rendered.context || ''), prompt: String(rendered.prompt),
    answer: correct, answerText, distractors: Object.freeze(distractors),
    hints: Object.freeze(hints), solution: Object.freeze(solution),
    structuralId: model.structuralId, cognitiveExperienceId: model.cognitiveExperienceId,
    surfaceFingerprint, solverProof: Object.freeze({ verified: true, verifier: `${model.domain}-adapter-v2` })
  });
}
