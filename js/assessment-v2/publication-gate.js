function norm(v) { return String(v ?? '').toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim(); }
const BANNED_GENERIC_HINTS = new Set(['soruyu küçük bir örnekle dene.', 'verileri tablo veya kısa listeyle düzenle.']);
const ARTIFICIAL_WRAPPERS = ['olimpiyat kulübünde çözülen bir soru:', 'senaryodaki sayıları ayıkla; genel kuralı bul.'];

export function evaluateV2Publication(item, { gameId, previousItems = [] } = {}) {
  const errors = [];
  if (item?.solverProof?.verified !== true) errors.push('solver_not_verified');
  if (!Array.isArray(item?.distractors) || item.distractors.length !== 3) errors.push('three_distractors_required');
  if (new Set((item?.distractors || []).map(d => d.misconceptionId)).size !== 3) errors.push('distinct_misconceptions_required');
  const fullPrompt = norm(`${item?.context || ''} ${item?.prompt || ''}`);
  if (ARTIFICIAL_WRAPPERS.some(w => fullPrompt.includes(w))) errors.push('artificial_wrapper');
  if ((item?.hints || []).some(h => BANNED_GENERIC_HINTS.has(norm(h)))) errors.push('generic_hint');
  if ((item?.solution || []).length < 2) errors.push('solution_graph_too_shallow');
  if (gameId && !item?.compatibleGameIds?.includes(gameId)) errors.push('game_construct_mismatch');
  if (previousItems.some(prev => prev.cognitiveExperienceId === item.cognitiveExperienceId)) errors.push('cognitive_repeat');
  if (!item?.constructId || !item?.knowledgeComponents?.length) errors.push('construct_missing');
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}
