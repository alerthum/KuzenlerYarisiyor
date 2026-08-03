import { ASSESSMENT_V2_HUMAN_REVIEW_QUEUE } from './human-review-queue.js';

const ENGINE_KEYS=Object.freeze([
  '8:turkce','8:matematik','8:fen-bilimleri','5:turkce','8:t-c-inkilap-tarihi-ve-ataturkculuk','8:din-kulturu-ve-ahlak-bilgisi','8:ingilizce'
]);
function key(row){return `${row.grade}:${row.courseId}`;}
function rank(row){
  let score=row.complexity*10;
  if(row.itemFormat!=='single-choice')score+=8;
  if(row.itemFormat==='interactive-simulation')score+=5;
  if(row.difficultyBand&&String(row.difficultyBand).includes('ZOR'))score+=3;
  return score;
}
export function buildRiskStratifiedReviewSample(queue=ASSESSMENT_V2_HUMAN_REVIEW_QUEUE,perEngine=10){
  const rows=[];
  for(const engineKey of ENGINE_KEYS){
    const candidates=queue.rows.filter(row=>row.reviewStatus==='HUMAN_REVIEW_REQUIRED'&&key(row)===engineKey).sort((a,b)=>rank(b)-rank(a)||a.itemFormat.localeCompare(b.itemFormat)||a.questionId.localeCompare(b.questionId,'tr'));
    const selected=[];const usedFormats=new Set();
    for(const candidate of candidates){if(selected.length>=perEngine)break;if(!usedFormats.has(candidate.itemFormat)){selected.push(candidate);usedFormats.add(candidate.itemFormat);}}
    for(const candidate of candidates){if(selected.length>=perEngine)break;if(!selected.some(x=>x.questionId===candidate.questionId))selected.push(candidate);}
    rows.push(...selected.map(row=>Object.freeze({...row,sampleEngineKey:engineKey,riskScore:rank(row),sampleReason:row.itemFormat==='single-choice'?'Çeldirici ve seçenek dengesi kalibrasyonu':'Rubrik, medya ve insan puanlama tutarlılığı kalibrasyonu'})));
  }
  return Object.freeze({schemaVersion:'1.0',generatedAt:new Date().toISOString(),status:'RISK_STRATIFIED_HUMAN_CALIBRATION_SAMPLE',productReady:false,gameAdaptationAllowed:false,metrics:Object.freeze({engineCount:ENGINE_KEYS.length,perEngine,total:rows.length,pendingSourceCount:queue.metrics.pending}),rows:Object.freeze(rows)});
}
export function auditRiskStratifiedReviewSample(sample=buildRiskStratifiedReviewSample()){
  const errors=[];if(sample.metrics.total!==70)errors.push(`total:${sample.metrics.total}`);if(new Set(sample.rows.map(r=>r.questionId)).size!==70)errors.push('duplicate');
  for(const k of ENGINE_KEYS)if(sample.rows.filter(r=>r.sampleEngineKey===k).length!==10)errors.push(`engine-count:${k}`);
  if(sample.rows.some(r=>r.reviewStatus!=='HUMAN_REVIEW_REQUIRED'||r.gameAdaptationAllowed!==false))errors.push('invalid-review-state');
  return Object.freeze({ok:errors.length===0,errors:Object.freeze(errors),metrics:sample.metrics});
}
export const ASSESSMENT_V2_RISK_REVIEW_SAMPLE=buildRiskStratifiedReviewSample();
export const ASSESSMENT_V2_RISK_REVIEW_SAMPLE_AUDIT=auditRiskStratifiedReviewSample(ASSESSMENT_V2_RISK_REVIEW_SAMPLE);
