import { composePremiumSession } from './premium-session-composer-v10.js';

const FORBIDDEN_PAIRS = Object.freeze([
  ['INFO_SECME_01','INFO_SECME_02'],['INFO_SECME_01','INFO_SECME_03'],['INFO_SECME_02','INFO_SECME_01'],
  ['INFO_SECME_03','CELISKI_KARSILASTIRMA_01'],['INFO_SECME_05','SENTEZ_COKLU_02'],
  ['BAGLAM_ANLAM_04','METIN_YAPISI_01'],['BAGLAM_ANLAM_05','METIN_AMACI_02'],
  ['KANIT_BIRLESTIRME_02','SENTEZ_COKLU_01'],['KANIT_BIRLESTIRME_04','METIN_AMACI_01'],
  ['KANIT_BIRLESTIRME_05','CELISKI_KARSILASTIRMA_02'],['METIN_AMACI_01','METIN_AMACI_05'],
  ['METIN_AMACI_02','GUVENILIRLIK_01'],['METIN_AMACI_03','METIN_AMACI_02'],
  ['METIN_AMACI_04','CELISKI_KARSILASTIRMA_03'],['METIN_AMACI_05','METIN_AMACI_01'],
  ['METIN_YAPISI_01','METIN_YAPISI_03'],['METIN_YAPISI_03','METIN_YAPISI_01'],
  ['METIN_YAPISI_04','KANIT_BIRLESTIRME_04'],['METIN_YAPISI_05','METIN_AMACI_01'],
  ['GUVENILIRLIK_01','METIN_AMACI_02'],['GUVENILIRLIK_04','KANIT_BIRLESTIRME_04'],
  ['GUVENILIRLIK_05','GUVENILIRLIK_01'],['CELISKI_KARSILASTIRMA_01','CELISKI_KARSILASTIRMA_02'],
  ['CELISKI_KARSILASTIRMA_02','CELISKI_KARSILASTIRMA_01'],
  ['CELISKI_KARSILASTIRMA_02','INFO_SECME_03'],['CELISKI_KARSILASTIRMA_03','KANIT_BIRLESTIRME_05'],
  ['SENTEZ_COKLU_01','INFO_SECME_05'],['SENTEZ_COKLU_03','CELISKI_KARSILASTIRMA_05'],
  ['SENTEZ_COKLU_04','BAGLAM_ANLAM_05'],['SENTEZ_COKLU_05','SENTEZ_COKLU_01']
]);

const FORBIDDEN = new Set(FORBIDDEN_PAIRS.flatMap(([a,b]) => [`${a}|${b}`, `${b}|${a}`]));
const COGNITIVE_LOAD = Object.freeze({
  INFO_SECME: 1,
  BAGLAM_ANLAM: 2,
  METIN_YAPISI: 2,
  METIN_AMACI: 3,
  KANIT_BIRLESTIRME: 3,
  GUVENILIRLIK: 4,
  CELISKI_KARSILASTIRMA: 4,
  SENTEZ_COKLU: 5
});

function roundKey(round = {}) { return round.questionKey || `${round.prompt || ''}|${round.context || ''}`; }
function skeletonOf(round = {}) { return round.skeletonId || round.v11Identity?.skeletonId || null; }
function familyOf(round = {}) {
  return round.familyId
    || round.skeletonFamilyId
    || round.v11Identity?.skeletonFamilyId
    || round.questionContract?.family?.familyId
    || String(skeletonOf(round) || '').split('_').slice(0, -1).join('_')
    || null;
}
function cognitiveExperienceOf(round = {}) {
  return round.cognitiveExperienceId
    || round.premiumBlueprint?.cognitiveExperienceId
    || round.questionContract?.repeat?.cognitiveExperienceId
    || null;
}
function taskTypeOf(round = {}) {
  const skeleton = String(skeletonOf(round) || '');
  return skeleton.includes(':') ? skeleton.split(':').at(-1) : null;
}
function difficultyOf(round = {}) { return Number(round.cognitiveDepth || round.difficulty || 3); }
function loadOf(round = {}) { return COGNITIVE_LOAD[familyOf(round)] || Math.max(1, Math.min(5, difficultyOf(round))); }
function isForbidden(a, b) { const x=skeletonOf(a), y=skeletonOf(b); return Boolean(x && y && FORBIDDEN.has(`${x}|${y}`)); }

function dedupe(rounds = []) {
  const seen = new Set();
  return rounds.filter((round) => {
    const key = roundKey(round);
    if (!key || seen.has(key)) return false;
    seen.add(key); return true;
  });
}

function chooseCandidate(pool, selected, targetLoad, weakSkeletons) {
  const familyCounts = new Map();
  for (const round of selected) familyCounts.set(familyOf(round), (familyCounts.get(familyOf(round)) || 0) + 1);
  return [...pool].sort((a,b) => {
    const aForbidden = selected.some((x) => isForbidden(x,a)) ? 1 : 0;
    const bForbidden = selected.some((x) => isForbidden(x,b)) ? 1 : 0;
    if (aForbidden !== bForbidden) return aForbidden - bForbidden;
    const aRem = a.adaptivePlacement && weakSkeletons.has(skeletonOf(a)) ? -1 : 0;
    const bRem = b.adaptivePlacement && weakSkeletons.has(skeletonOf(b)) ? -1 : 0;
    if (aRem !== bRem) return aRem - bRem;
    const aFamily = familyCounts.get(familyOf(a)) || 0;
    const bFamily = familyCounts.get(familyOf(b)) || 0;
    if (aFamily !== bFamily) return aFamily - bFamily;
    return Math.abs(loadOf(a)-targetLoad) - Math.abs(loadOf(b)-targetLoad);
  })[0] || null;
}


/**
 * Eski DFS (2^n) saatlerce takılıyordu. Açgözlü seçim + sert maxAttempts.
 * Kalite gevşetilmez: aile/iskelet tekilliği ve forbidden çiftler korunur.
 */
function selectCompatibleSet(source, limit, remediationLimit, weakSkeletons, { maxAttempts = 4000 } = {}) {
  const ordered = [...source].sort((a, b) => {
    const ar = a.adaptivePlacement && weakSkeletons.has(skeletonOf(a)) ? -1 : 0;
    const br = b.adaptivePlacement && weakSkeletons.has(skeletonOf(b)) ? -1 : 0;
    if (ar !== br) return ar - br;
    return loadOf(a) - loadOf(b);
  });
  const uniqueFamiliesInSource = new Set(ordered.map(familyOf).filter(Boolean)).size;
  const uniqueSkeletonsInSource = new Set(ordered.map(skeletonOf).filter(Boolean)).size;
  const uniqueTaskTypesInSource = new Set(ordered.map(taskTypeOf).filter(Boolean)).size;
  const selected = [];
  let remediationCount = 0;
  let attempts = 0;
  for (let index = 0; index < ordered.length && selected.length < limit && attempts < maxAttempts; index += 1) {
    attempts += 1;
    const current = ordered[index];
    const canRem = !current.adaptivePlacement || remediationCount < remediationLimit;
    if (!canRem) continue;
    const fam = familyOf(current);
    const sk = skeletonOf(current);
    const familyDup = fam && selected.some((x) => familyOf(x) === fam);
    const skeletonDup = sk && selected.some((x) => skeletonOf(x) === sk);
    const taskType = taskTypeOf(current);
    const taskTypeDup = taskType && selected.some((x) => taskTypeOf(x) === taskType);
    const compatible = !selected.some((x) => isForbidden(x, current))
      && !(familyDup && uniqueFamiliesInSource >= limit)
      && !(skeletonDup && uniqueSkeletonsInSource >= limit)
      && !(taskTypeDup && uniqueTaskTypesInSource >= limit);
    if (!compatible) continue;
    selected.push(current);
    if (current.adaptivePlacement) remediationCount += 1;
  }
  return selected;
}

export function composeV11Session(rounds = [], {
  targetCount = rounds.length,
  firstExperience = false,
  remediationShare = 0.25,
  brainPolicy = null,
  misconceptionInterventions = []
} = {}) {
  const base = composePremiumSession(dedupe(rounds), { targetCount, firstExperience, remediationShare, brainPolicy });
  const source = dedupe(rounds);
  const limit = Math.min(Math.max(0, Number(targetCount || source.length)), source.length);
  const weakSkeletons = new Set(misconceptionInterventions.map((x) => x.skeletonId).filter(Boolean));
  const remediationLimit = limit ? Math.max(1, Math.floor(limit * Math.min(0.25, Math.max(0, Number(remediationShare) || 0)))) : 0;
  let selected = selectCompatibleSet(source, limit, remediationLimit, weakSkeletons);
  // Aile/iskelet/cognitiveExperience tekilliği: deneyim tekrarını doldurma için gevşetme.
  {
    const unique = [];
    const usedF = new Set();
    const usedS = new Set();
    const usedCx = new Set();
    const take = (round, { allowSkeletonDup = false, allowCxDup = false } = {}) => {
      if (unique.length >= limit) return;
      if (unique.some((x) => roundKey(x) === roundKey(round))) return;
      const f = familyOf(round);
      const s = skeletonOf(round);
      const cx = cognitiveExperienceOf(round);
      if (f && usedF.has(f)) return;
      if (!allowSkeletonDup && s && usedS.has(s)) return;
      if (!allowCxDup && cx && usedCx.has(cx)) return;
      unique.push(round);
      if (f) usedF.add(f);
      if (s) usedS.add(s);
      if (cx) usedCx.add(cx);
    };
    for (const round of selected) take(round);
    for (const round of source) take(round);
    if (unique.length < limit) {
      for (const round of [...selected, ...source]) take(round, { allowSkeletonDup: true });
    }
    // Aile ve cognitiveExperience tekrarı underfill için bile açılmaz.
    selected = unique;
  }
  let remediationCount = selected.filter(x=>x.adaptivePlacement).length;
  const rejectedForbidden = source.filter(x=>!selected.some(y=>roundKey(y)===roundKey(x)) && selected.some(y=>isForbidden(y,x))).map(x=>({
    skeletonId:skeletonOf(x),
    conflictsWith:selected.filter(y=>isForbidden(y,x)).map(skeletonOf)
  }));

  const families = selected.map(familyOf).filter(Boolean);
  const skeletons = selected.map(skeletonOf).filter(Boolean);
  const loads = selected.map(loadOf);
  const familyCounts = families.reduce((m,x)=>(m[x]=(m[x]||0)+1,m),{});
  const dominantFamilyCount = Math.max(0, ...Object.values(familyCounts));
  const forbiddenViolations = [];
  for (let i=0;i<selected.length;i++) for (let j=i+1;j<selected.length;j++) if (isForbidden(selected[i],selected[j])) forbiddenViolations.push([skeletonOf(selected[i]),skeletonOf(selected[j])]);

  return {
    rounds: selected,
    audit: {
      ...base.audit,
      schemaVersion: '11.0',
      targetCount: limit,
      producedCount: selected.length,
      skeletonCount: new Set(skeletons).size,
      familyCount: new Set(families).size,
      familyCounts,
      dominantFamilyCount,
      balancedFamilies: selected.length < 4 || dominantFamilyCount <= Math.ceil(selected.length / 2),
      cognitiveLoadCurve: loads,
      nonDecreasingLoadSteps: loads.slice(1).filter((v,i)=>v>=loads[i]).length,
      remediationCount,
      remediationLimit,
      targetedSkeletons: [...weakSkeletons],
      forbiddenViolationCount: forbiddenViolations.length,
      forbiddenViolations,
      rejectedForbidden,
      legacyPremiumAudit: base.audit
    }
  };
}

export function auditV11Session(rounds = []) {
  return composeV11Session(rounds, { targetCount: rounds.length }).audit;
}
