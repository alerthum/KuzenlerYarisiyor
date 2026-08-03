function required(value, field, id = 'subject-engine') {
  const output = String(value ?? '').trim();
  if (!output) throw new Error(`${id}: ${field} is required`);
  return output;
}

export function defineSubjectEngine(input = {}) {
  const id = required(input.id, 'id');
  for (const method of ['plan', 'generate', 'solve', 'verifyIndependent', 'explain', 'qualityAudit']) {
    if (typeof input[method] !== 'function') throw new Error(`${id}: ${method} function is required`);
  }
  const supportedCourseIds = Object.freeze([...(input.supportedCourseIds || [])].map(value => required(value, 'supportedCourseIds', id)));
  if (!supportedCourseIds.length) throw new Error(`${id}: supportedCourseIds required`);
  return Object.freeze({
    schemaVersion: '3.0',
    id,
    domain: required(input.domain, 'domain', id),
    supportedCourseIds,
    supportedItemFormats: Object.freeze([...(input.supportedItemFormats || [])]),
    curriculumSourcePolicy: required(input.curriculumSourcePolicy || 'AUTHORITATIVE_ONLY', 'curriculumSourcePolicy', id),
    misconceptionCatalogId: required(input.misconceptionCatalogId, 'misconceptionCatalogId', id),
    styleCatalogId: required(input.styleCatalogId, 'styleCatalogId', id),
    plan: input.plan,
    generate: input.generate,
    solve: input.solve,
    verifyIndependent: input.verifyIndependent,
    explain: input.explain,
    qualityAudit: input.qualityAudit
  });
}

export function assertSubjectEngineResult(engine, canonicalQuestion) {
  const solved = engine.solve(structuredClone(canonicalQuestion));
  const independentlyVerified = engine.verifyIndependent(structuredClone(canonicalQuestion), structuredClone(solved));
  if (independentlyVerified !== true) throw new Error(`${engine.id}: independent verification failed`);
  const audit = engine.qualityAudit(structuredClone(canonicalQuestion));
  if (!audit || audit.ok !== true) throw new Error(`${engine.id}: quality audit failed`);
  return Object.freeze({ solved, independentlyVerified: true, audit: Object.freeze(structuredClone(audit)) });
}
