const MODALITY_RANK = Object.freeze({ impossible: 0, possible: 1, probable: 2, certain: 3 });
const QUANTIFIER_RANK = Object.freeze({ none: 0, one: 1, some: 2, many: 3, most: 4, all: 5 });

function asSet(value) {
  return new Set(Array.isArray(value) ? value : []);
}

function subsetOf(left, right) {
  const rightSet = asSet(right);
  return (Array.isArray(left) ? left : []).every(value => rightSet.has(value));
}

function sameCore(left = {}, right = {}) {
  return left.subject === right.subject
    && left.predicate === right.predicate
    && left.object === right.object
    && (left.polarity || 'positive') === (right.polarity || 'positive')
    && (left.relation || 'statement') === (right.relation || 'statement');
}

function propositionEntailed(option = {}, claim = {}) {
  if (!sameCore(option, claim)) return false;
  if ((MODALITY_RANK[option.modality || 'certain'] ?? 99) > (MODALITY_RANK[claim.modality || 'certain'] ?? -1)) return false;
  if ((QUANTIFIER_RANK[option.quantifier || 'all'] ?? 99) > (QUANTIFIER_RANK[claim.quantifier || 'all'] ?? -1)) return false;
  if (!subsetOf(option.scope || [], claim.scope || [])) return false;
  if (option.causeId && option.causeId !== claim.causeId) return false;
  return true;
}

function centralClaimIds(map) {
  return (map.claims || []).filter(claim => claim.centrality === 'central').map(claim => claim.id);
}

function optionPasses(task, option) {
  const map = task.evidenceMap;
  const semantic = option.semantic || {};
  switch (task.query.type) {
    case 'main-idea': {
      const central = centralClaimIds(map);
      return semantic.focus === 'central'
        && semantic.addsUnsupported !== true
        && subsetOf(central, semantic.covers || [])
        && (semantic.detailOnly || false) === false;
    }
    case 'supported-inference':
    case 'scope-control':
    case 'causal-boundary': {
      const claim = (map.claims || []).find(entry => entry.id === semantic.claimId);
      return Boolean(claim && propositionEntailed(semantic.proposition, claim.proposition));
    }
    case 'claim-evidence': {
      const evidence = (map.evidence || []).find(entry => entry.id === semantic.evidenceId);
      return Boolean(evidence && (evidence.supports || []).includes(semantic.claimId));
    }
    case 'purpose':
      return semantic.purpose === map.purpose;
    case 'attitude':
      return semantic.attitude === map.attitude;
    case 'contrast':
      return (map.contrasts || []).some(edge => edge.left === semantic.left
        && edge.right === semantic.right
        && edge.relation === semantic.relation);
    case 'paragraph-function':
      return (map.paragraphs || []).some(paragraph => paragraph.id === semantic.paragraphId
        && paragraph.function === semantic.function);
    case 'assumption': {
      const claim = (map.claims || []).find(entry => entry.id === semantic.claimId);
      const assumption = (map.assumptions || []).find(entry => entry.id === semantic.assumptionId);
      return Boolean(claim && assumption && assumption.necessary === true && (claim.requires || []).includes(assumption.id));
    }
    case 'cross-text': {
      const relation = map.crossTextRelation || {};
      return semantic.claimA === relation.claimA
        && semantic.claimB === relation.claimB
        && semantic.relation === relation.relation;
    }
    case 'evidence-strength': {
      const candidates = (map.evidence || []).filter(entry => (entry.supports || []).includes(semantic.claimId));
      const score = entry => Number(entry.directness || 0) * Number(entry.reliability || 0);
      const best = Math.max(...candidates.map(score));
      const winners = candidates.filter(entry => score(entry) === best);
      return winners.length === 1 && winners[0].id === semantic.evidenceId;
    }
    default:
      throw new Error(`unsupported reading query type: ${task.query.type}`);
  }
}

export function solveReadingEvidenceTask(task) {
  const matches = task.options.filter(option => optionPasses(task, option));
  if (matches.length !== 1) throw new Error(`reading-solver expected one answer, found ${matches.length}`);
  return matches[0];
}

function independentCoreKey(proposition = {}) {
  return [
    proposition.subject,
    proposition.predicate,
    proposition.object,
    proposition.polarity || 'positive',
    proposition.relation || 'statement'
  ].join('|');
}

function independentEntailment(option = {}, claim = {}) {
  if (independentCoreKey(option) !== independentCoreKey(claim)) return false;
  const modalityOrder = ['impossible', 'possible', 'probable', 'certain'];
  const quantifierOrder = ['none', 'one', 'some', 'many', 'most', 'all'];
  if (modalityOrder.indexOf(option.modality || 'certain') > modalityOrder.indexOf(claim.modality || 'certain')) return false;
  if (quantifierOrder.indexOf(option.quantifier || 'all') > quantifierOrder.indexOf(claim.quantifier || 'all')) return false;
  const allowedScopes = new Set(claim.scope || []);
  for (const scope of option.scope || []) if (!allowedScopes.has(scope)) return false;
  return !option.causeId || option.causeId === claim.causeId;
}

function independentValidIds(task) {
  const map = task.evidenceMap;
  const ids = [];
  for (const option of task.options) {
    const semantic = option.semantic || {};
    let valid = false;
    if (task.query.type === 'main-idea') {
      const centralIds = (map.claims || []).reduce((acc, claim) => claim.centrality === 'central' ? [...acc, claim.id] : acc, []);
      const covered = new Set(semantic.covers || []);
      valid = semantic.focus === 'central' && !semantic.addsUnsupported && !semantic.detailOnly
        && centralIds.every(id => covered.has(id));
    } else if (['supported-inference', 'scope-control', 'causal-boundary'].includes(task.query.type)) {
      const claim = (map.claims || []).find(entry => entry.id === semantic.claimId);
      valid = Boolean(claim && independentEntailment(semantic.proposition, claim.proposition));
    } else if (task.query.type === 'claim-evidence') {
      const supportPairs = new Set((map.evidence || []).flatMap(evidence => (evidence.supports || []).map(claimId => `${claimId}|${evidence.id}`)));
      valid = supportPairs.has(`${semantic.claimId}|${semantic.evidenceId}`);
    } else if (task.query.type === 'purpose') {
      valid = [semantic.purpose, map.purpose].every(Boolean) && semantic.purpose.localeCompare(map.purpose) === 0;
    } else if (task.query.type === 'attitude') {
      valid = [semantic.attitude, map.attitude].every(Boolean) && semantic.attitude.localeCompare(map.attitude) === 0;
    } else if (task.query.type === 'contrast') {
      const encoded = new Set((map.contrasts || []).map(edge => `${edge.left}>${edge.relation}>${edge.right}`));
      valid = encoded.has(`${semantic.left}>${semantic.relation}>${semantic.right}`);
    } else if (task.query.type === 'paragraph-function') {
      const encoded = new Map((map.paragraphs || []).map(paragraph => [paragraph.id, paragraph.function]));
      valid = encoded.get(semantic.paragraphId) === semantic.function;
    } else if (task.query.type === 'assumption') {
      const requiredByClaim = new Map((map.claims || []).map(claim => [claim.id, new Set(claim.requires || [])]));
      const necessary = new Set((map.assumptions || []).filter(item => item.necessary).map(item => item.id));
      valid = necessary.has(semantic.assumptionId) && requiredByClaim.get(semantic.claimId)?.has(semantic.assumptionId) === true;
    } else if (task.query.type === 'cross-text') {
      const relation = map.crossTextRelation || {};
      valid = JSON.stringify([semantic.claimA, semantic.claimB, semantic.relation])
        === JSON.stringify([relation.claimA, relation.claimB, relation.relation]);
    } else if (task.query.type === 'evidence-strength') {
      const candidates = (map.evidence || []).filter(entry => (entry.supports || []).includes(semantic.claimId));
      const sorted = [...candidates].sort((a, b) => (b.directness * b.reliability) - (a.directness * a.reliability));
      valid = sorted.length > 0
        && sorted[0].id === semantic.evidenceId
        && (sorted.length === 1 || sorted[0].directness * sorted[0].reliability > sorted[1].directness * sorted[1].reliability);
    }
    if (valid) ids.push(option.id);
  }
  return ids;
}

export function verifyReadingEvidenceAnswer(task, answer) {
  const validIds = independentValidIds(task);
  return validIds.length === 1 && validIds[0] === answer?.id;
}

export function explainReadingEvidenceDecision(task) {
  return Object.freeze(task.options.map(option => Object.freeze({
    id: option.id,
    accepted: optionPasses(task, option)
  })));
}
