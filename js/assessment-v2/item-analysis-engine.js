import { auditStudentPilotResponses } from './student-pilot-contract.js';

const round = (value, digits = 4) => Number(Number(value || 0).toFixed(digits));
const mean = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
function median(values) {
  if (!values.length) return 0;
  const ordered = [...values].sort((a,b) => a-b);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2;
}
function normalizedScore(row, descriptor) {
  if (descriptor.itemFormat === 'single-choice') return !row.omitted && row.selectedOptionId === descriptor.correctOptionId ? 1 : 0;
  return Math.max(0, Math.min(1, Number(row.score || 0) / Math.max(0.000001, Number(row.maxScore || 1))));
}
function abilityByParticipant(rows, descriptorsById) {
  const map = new Map();
  for (const row of rows) {
    const descriptor = descriptorsById.get(row.itemId);
    if (!descriptor) continue;
    const entry = map.get(row.participantAnonId) || [];
    entry.push({ itemId: row.itemId, score: normalizedScore(row, descriptor) });
    map.set(row.participantAnonId, entry);
  }
  return map;
}
function discriminationForItem(itemRows, itemId, abilityMap, descriptor) {
  const scored = itemRows.map(row => {
    const other = (abilityMap.get(row.participantAnonId) || []).filter(entry => entry.itemId !== itemId);
    return { row, ability: mean(other.map(entry => entry.score)), itemScore: normalizedScore(row, descriptor) };
  }).sort((a,b) => a.ability - b.ability);
  if (scored.length < 12) return { value: null, upperSize: 0, lowerSize: 0, reason: 'sample-below-12' };
  const groupSize = Math.max(3, Math.floor(scored.length * 0.27));
  const lower = scored.slice(0, groupSize);
  const upper = scored.slice(-groupSize);
  return { value: round(mean(upper.map(x=>x.itemScore)) - mean(lower.map(x=>x.itemScore))), upperSize: upper.length, lowerSize: lower.length, reason: null };
}
function distractorAnalysis(rows, descriptor) {
  if (descriptor.itemFormat !== 'single-choice') return [];
  const answered = rows.filter(row => !row.omitted);
  return descriptor.optionIds.map(optionId => {
    const count = answered.filter(row => row.selectedOptionId === optionId).length;
    const rate = answered.length ? count / answered.length : 0;
    const correct = optionId === descriptor.correctOptionId;
    return Object.freeze({ optionId, correct, count, selectionRate: round(rate), functional: correct ? true : count >= 3 && rate >= 0.05 });
  });
}
function classify(metrics, { realEvidence, thresholds }) {
  const flags=[];
  if(metrics.uniqueParticipantCount<thresholds.minParticipants)flags.push('insufficient-participants');
  if(metrics.responseCount<thresholds.minResponsesPerItem)flags.push('insufficient-responses');
  if(metrics.difficultyIndex<thresholds.minDifficulty||metrics.difficultyIndex>thresholds.maxDifficulty)flags.push('difficulty-out-of-band');
  if(metrics.discriminationIndex==null||metrics.discriminationIndex<thresholds.minDiscrimination)flags.push('low-discrimination');
  if(metrics.omissionRate>thresholds.maxOmissionRate)flags.push('high-omission');
  if(metrics.nonFunctionalDistractorCount>thresholds.maxNonFunctionalDistractors)flags.push('nonfunctional-distractors');
  if(!realEvidence)flags.push('simulated-data-not-publishable');
  const technicalFlags=flags.filter(flag=>flag!=='simulated-data-not-publishable');
  const status=technicalFlags.length?'PILOT_REVIEW_REQUIRED':(realEvidence?'PILOT_PASS':'SIMULATION_ENGINE_PASS');
  return {status,flags};
}

export const DEFAULT_ITEM_ANALYSIS_THRESHOLDS = Object.freeze({
  minParticipants:100,
  minResponsesPerItem:80,
  minDifficulty:0.2,
  maxDifficulty:0.9,
  minDiscrimination:0.2,
  maxOmissionRate:0.1,
  maxNonFunctionalDistractors:1
});

export function analyzeStudentPilot({ pilotId, responses = [], itemDescriptors = [], thresholds = DEFAULT_ITEM_ANALYSIS_THRESHOLDS } = {}) {
  const responseAudit = auditStudentPilotResponses(responses);
  const errors=[...responseAudit.errors];
  const descriptorsById=new Map(itemDescriptors.map(item=>[item.itemId,item]));
  if(descriptorsById.size!==itemDescriptors.length)errors.push('duplicate-item-descriptor');
  for(const descriptor of itemDescriptors){
    if(!descriptor.itemId||!descriptor.gameId||!descriptor.itemFormat)errors.push(`descriptor-invalid:${descriptor.itemId||'unknown'}`);
    if(descriptor.itemFormat==='single-choice'&&(!descriptor.correctOptionId||!Array.isArray(descriptor.optionIds)||descriptor.optionIds.length<3))errors.push(`descriptor-choice-invalid:${descriptor.itemId}`);
  }
  for(const row of responseAudit.rows)if(!descriptorsById.has(row.itemId))errors.push(`response-item-missing:${row.itemId}`);
  const datasetSources=[...new Set(responseAudit.rows.map(row=>row.datasetSource))];
  const realEvidence=datasetSources.length===1&&datasetSources[0]==='REAL_STUDENT_PILOT';
  const abilityMap=abilityByParticipant(responseAudit.rows,descriptorsById);
  const items=[];
  for(const descriptor of itemDescriptors){
    const itemRows=responseAudit.rows.filter(row=>row.itemId===descriptor.itemId);
    const uniqueParticipantCount=new Set(itemRows.map(row=>row.participantAnonId)).size;
    const scores=itemRows.map(row=>normalizedScore(row,descriptor));
    const distractors=distractorAnalysis(itemRows,descriptor);
    const discrimination=discriminationForItem(itemRows,descriptor.itemId,abilityMap,descriptor);
    const metrics={
      itemId:descriptor.itemId,
      gameId:descriptor.gameId,
      itemFormat:descriptor.itemFormat,
      responseCount:itemRows.length,
      uniqueParticipantCount,
      difficultyIndex:round(mean(scores)),
      discriminationIndex:discrimination.value,
      discriminationUpperGroupSize:discrimination.upperSize,
      discriminationLowerGroupSize:discrimination.lowerSize,
      omissionRate:round(itemRows.length?itemRows.filter(row=>row.omitted).length/itemRows.length:0),
      hintUseRate:round(itemRows.length?itemRows.filter(row=>row.hintsUsed>0).length/itemRows.length:0),
      averageResponseTimeMs:Math.round(mean(itemRows.map(row=>row.responseTimeMs))),
      medianResponseTimeMs:Math.round(median(itemRows.map(row=>row.responseTimeMs))),
      distractors:Object.freeze(distractors),
      nonFunctionalDistractorCount:distractors.filter(row=>!row.correct&&!row.functional).length
    };
    const classification=classify(metrics,{realEvidence,thresholds});
    items.push(Object.freeze({...metrics,status:classification.status,flags:Object.freeze(classification.flags)}));
  }
  const technicalPass=items.length>0&&items.every(item=>item.status==='PILOT_PASS'||item.status==='SIMULATION_ENGINE_PASS');
  return Object.freeze({
    schemaVersion:'1.0',
    pilotId:String(pilotId||'').trim(),
    generatedAt:new Date().toISOString(),
    datasetSources:Object.freeze(datasetSources),
    evidenceType:realEvidence?'REAL_STUDENT_PILOT':'SIMULATED_OR_MIXED',
    productReady:false,
    publicationAllowed:false,
    status:errors.length?'INVALID_DATA':(technicalPass?(realEvidence?'PILOT_PASS':'SIMULATION_ENGINE_PASS'):'PILOT_REVIEW_REQUIRED'),
    metrics:Object.freeze({responseCount:responseAudit.rows.length,participantCount:new Set(responseAudit.rows.map(row=>row.participantAnonId)).size,itemCount:items.length,technicalPassItemCount:items.filter(item=>item.status==='PILOT_PASS'||item.status==='SIMULATION_ENGINE_PASS').length}),
    thresholds:Object.freeze({...thresholds}),
    items:Object.freeze(items),
    errors:Object.freeze([...new Set(errors)])
  });
}
