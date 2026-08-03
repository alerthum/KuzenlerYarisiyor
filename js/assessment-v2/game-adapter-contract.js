function required(value, field, id = 'game-adapter') {
  const output = String(value ?? '').trim();
  if (!output) throw new Error(`${id}: ${field} is required`);
  return output;
}

export function defineGameAdapter(input = {}) {
  const id = required(input.id, 'id');
  for (const method of ['supports', 'adapt', 'reverseCheck']) {
    if (typeof input[method] !== 'function') throw new Error(`${id}: ${method} function is required`);
  }
  return Object.freeze({
    schemaVersion: '3.0',
    id,
    gameId: required(input.gameId, 'gameId', id),
    supportedItemFormats: Object.freeze([...(input.supportedItemFormats || [])]),
    supports: input.supports,
    adapt: input.adapt,
    reverseCheck: input.reverseCheck
  });
}

export function adaptCanonicalQuestion(adapter, canonicalQuestion) {
  if (!adapter.supports(canonicalQuestion)) throw new Error(`${adapter.id}: unsupported canonical question`);
  const adapted = adapter.adapt(structuredClone(canonicalQuestion));
  if (!adapted || !adapted.gamePayload) throw new Error(`${adapter.id}: gamePayload is required`);
  const check = adapter.reverseCheck(structuredClone(canonicalQuestion), structuredClone(adapted));
  if (!check || check.ok !== true) throw new Error(`${adapter.id}: semantic round-trip failed`);
  return Object.freeze({
    ...structuredClone(adapted),
    sourceQuestionId: canonicalQuestion.id,
    gameId: adapter.gameId,
    semanticRoundTrip: Object.freeze(structuredClone(check))
  });
}
