export const PREMIUM_FAMILY_POOL_BY_GAME = Object.freeze({
  'error-detective': Object.freeze(['math-error-chain','math-reverse-check']),
  'paragraph-detective': Object.freeze(['tr-inference-evidence','tr-author-purpose']),
  'science-lab': Object.freeze(['science-variable-lab','science-data-claim']),
  'science-reasoning': Object.freeze(['science-data-claim','science-variable-lab']),
  'logic-station': Object.freeze(['logic-constraint-grid','logic-order-chain']),
  'social-time-travel': Object.freeze(['social-source-compare','social-cause-chain']),
  'religion-practice': Object.freeze(['religion-concept-situation','religion-ethical-dilemma']),
  'english-cloze': Object.freeze(['english-context-choice','english-dialogue-completion']),
  'olympiad-ladder': Object.freeze(['olympiad-invariant','olympiad-proof-strategy'])
});

export function getPremiumFamilyPool(gameId=''){
  return [...(PREMIUM_FAMILY_POOL_BY_GAME[gameId]||[])];
}

export function selectPremiumFamily({gameId,attempt=0,blockedQuestionFamilies=new Set(),usedFamilyIds=new Set()}={}){
  const pool=getPremiumFamilyPool(gameId).filter(id=>!blockedQuestionFamilies.has(id));
  if(!pool.length) return null;
  const unused=pool.filter(id=>!usedFamilyIds.has(id));
  const candidates=unused.length?unused:pool;
  return candidates[Math.abs(Number(attempt)||0)%candidates.length];
}

export function auditPremiumFamilyCoverage(){
  const entries=Object.entries(PREMIUM_FAMILY_POOL_BY_GAME).map(([gameId,families])=>({gameId,familyCount:families.length,families:[...families],multiFamily:families.length>1}));
  return {games:entries.length,multiFamilyGames:entries.filter(x=>x.multiFamily).length,entries};
}
