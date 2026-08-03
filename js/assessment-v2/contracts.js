const REQUIRED_DOMAINS = new Set(['mathematics', 'reading', 'logic', 'science', 'language', 'social', 'visual', 'open-task']);

function requiredText(value, name, id = 'item-model') {
  const out = String(value ?? '').trim();
  if (!out) throw new Error(`${id}: ${name} is required`);
  return out;
}

function requiredArray(value, name, min = 1, id = 'item-model') {
  if (!Array.isArray(value) || value.length < min) throw new Error(`${id}: ${name} requires at least ${min} entries`);
  return Object.freeze(value.map((entry) => typeof entry === 'string' ? requiredText(entry, name, id) : Object.freeze({ ...entry })));
}

function stableHash(value) {
  let state = 2166136261;
  for (const ch of String(value)) {
    state ^= ch.charCodeAt(0);
    state = Math.imul(state, 16777619);
  }
  return (state >>> 0).toString(36);
}

export function defineConstruct(input = {}) {
  const id = requiredText(input.id, 'construct.id');
  return Object.freeze({
    id,
    gradeRange: Object.freeze([Number(input.gradeRange?.[0]), Number(input.gradeRange?.[1])]),
    subjectId: requiredText(input.subjectId, 'construct.subjectId', id),
    curriculumOutcomeIds: requiredArray(input.curriculumOutcomeIds, 'construct.curriculumOutcomeIds', 1, id),
    knowledgeComponents: requiredArray(input.knowledgeComponents, 'construct.knowledgeComponents', 1, id),
    claim: requiredText(input.claim, 'construct.claim', id)
  });
}

export function defineSolutionGraph(input = {}, id = 'item-model') {
  const steps = requiredArray(input.steps, 'solutionGraph.steps', 2, id).map((step, index) => Object.freeze({
    id: requiredText(step.id, `solutionGraph.steps[${index}].id`, id),
    action: requiredText(step.action, `solutionGraph.steps[${index}].action`, id),
    dependsOn: Object.freeze(Array.isArray(step.dependsOn) ? [...step.dependsOn] : []),
    evidence: requiredText(step.evidence, `solutionGraph.steps[${index}].evidence`, id),
    hint: requiredText(step.hint, `solutionGraph.steps[${index}].hint`, id)
  }));
  const ids = new Set(steps.map((step) => step.id));
  for (const step of steps) for (const dep of step.dependsOn) if (!ids.has(dep)) throw new Error(`${id}: unknown dependency ${dep}`);
  return Object.freeze({ steps: Object.freeze(steps) });
}

export function defineMisconception(input = {}, id = 'item-model') {
  return Object.freeze({
    id: requiredText(input.id, 'misconception.id', id),
    description: requiredText(input.description, 'misconception.description', id),
    buggyRule: requiredText(input.buggyRule, 'misconception.buggyRule', id),
    feedback: requiredText(input.feedback, 'misconception.feedback', id),
    apply: typeof input.apply === 'function' ? input.apply : (() => { throw new Error(`${id}: misconception.apply required`); })
  });
}

export function defineItemModel(input = {}) {
  const id = requiredText(input.id, 'id');
  const domain = requiredText(input.domain, 'domain', id);
  if (!REQUIRED_DOMAINS.has(domain)) throw new Error(`${id}: unsupported domain ${domain}`);
  if (typeof input.generateTask !== 'function') throw new Error(`${id}: generateTask required`);
  if (typeof input.solve !== 'function') throw new Error(`${id}: solve required`);
  if (typeof input.verify !== 'function') throw new Error(`${id}: verify required`);
  if (typeof input.render !== 'function') throw new Error(`${id}: render required`);
  const construct = defineConstruct(input.construct);
  const solutionGraph = defineSolutionGraph(input.solutionGraph, id);
  const misconceptions = requiredArray(input.misconceptions, 'misconceptions', 3, id).map((m) => defineMisconception(m, id));
  const misconceptionIds = misconceptions.map((m) => m.id);
  if (new Set(misconceptionIds).size !== misconceptionIds.length) throw new Error(`${id}: misconception ids must be distinct`);
  const deepFeatures = requiredArray(input.deepFeatures, 'deepFeatures', 1, id);
  const surfaceFeatures = Object.freeze(Array.isArray(input.surfaceFeatures) ? [...input.surfaceFeatures] : []);
  const compatibleGameIds = requiredArray(input.compatibleGameIds, 'compatibleGameIds', 1, id);
  const structuralId = `st:v2:${stableHash(JSON.stringify({ domain, construct: construct.id, deepFeatures, solution: solutionGraph.steps.map(s => s.action) }))}`;
  const cognitiveExperienceId = `cx:v2:${stableHash(JSON.stringify({ construct: construct.knowledgeComponents, deepFeatures, misconceptions: misconceptionIds }))}`;
  return Object.freeze({
    schemaVersion: '2.0', id, domain, construct, solutionGraph, misconceptions,
    deepFeatures, surfaceFeatures, compatibleGameIds,
    interactionType: requiredText(input.interactionType || 'choice', 'interactionType', id),
    generateTask: input.generateTask, solve: input.solve, verify: input.verify, render: input.render,
    structuralId, cognitiveExperienceId
  });
}
