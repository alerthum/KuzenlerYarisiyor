import { ASSESSMENT_V2_RISK_REVIEW_SAMPLE } from './risk-stratified-review-sampler.js';
import { ASSESSMENT_V2_CANONICAL_CATALOG } from './canonical-catalog.js';
import { buildHumanReviewConsensus, requiredReviewerCount } from './human-review-consensus.js';

function freeze(value){
  if(Array.isArray(value))return Object.freeze(value.map(freeze));
  if(value&&typeof value==='object')return Object.freeze(Object.fromEntries(Object.entries(value).map(([k,v])=>[k,freeze(v)])));
  return value;
}

function taskView(item,row){
  const options=(item.content?.options||[]).map(option=>({id:option.id,text:option.text}));
  const rubric=[...(item.responseModel?.rubricCriteria||[])];
  const stimulusBlocks=item.content?.stimulusBlocks?.length
    ? [...item.content.stimulusBlocks]
    : [item.content?.stimulus||item.content?.context||''].filter(Boolean);
  return freeze({
    questionId:item.id,
    grade:item.curriculum.grade,
    courseId:item.curriculum.courseId,
    outcomeIds:[...item.curriculum.outcomeIds],
    primarySkill:item.construct?.primarySkill||null,
    difficultyBand:item.construct?.intendedDifficultyBand||null,
    itemFormat:item.itemFormat,
    complexity:row.complexity,
    riskScore:row.riskScore,
    sampleReason:row.sampleReason,
    requiredReviewerCount:requiredReviewerCount(row),
    stimulusBlocks,
    stem:item.content?.stem||item.content?.prompt||'',
    media:item.content?.media||null,
    options,
    answerKey:item.answerKey||null,
    hints:(item.hints||[]).map(h=>({level:h.level,text:h.text})),
    feedback:(item.optionFeedback||[]).map(f=>({optionId:f.optionId,correct:f.correct,text:f.text,misconceptionId:f.misconceptionId||null})),
    rubricCriteria:rubric,
    misconceptionIds:[...(item.misconceptionIds||[])],
    verifier:item.verifier||null,
    provenance:item.provenance||null
  });
}

export function buildHumanReviewBatch({sample=ASSESSMENT_V2_RISK_REVIEW_SAMPLE,catalog=ASSESSMENT_V2_CANONICAL_CATALOG,decisions=[]}={}){
  const byId=new Map(catalog.map(item=>[item.id,item]));
  const tasks=sample.rows.map(row=>{
    const item=byId.get(row.questionId);
    if(!item)throw new Error(`catalog-item-missing:${row.questionId}`);
    return taskView(item,row);
  });
  const consensus=buildHumanReviewConsensus({queueRows:sample.rows,decisions});
  return freeze({
    schemaVersion:'1.0',
    generatedAt:new Date().toISOString(),
    batchId:'PHASE4P_70',
    status:decisions.length?'HUMAN_REVIEW_DECISIONS_ANALYZED':'HUMAN_REVIEW_WORKBENCH_READY',
    productReady:false,
    publicationAllowed:false,
    gameAdaptationAllowed:false,
    instructions:{
      scoreScale:'1=zayıf, 3=revizyon gerekli, 4=iyi, 5=çok iyi',
      approvalRule:'APPROVE için altı boyutun tamamı en az 4 olmalı ve kritik engel bulunmamalıdır.',
      highRiskRule:'Karmaşıklığı 4 veya üzeri görevler iki bağımsız uzman onayı gerektirir.',
      publicationRule:'İnsan onayı yalnız oyun adaptasyonu laboratuvarını açar; yayın için gerçek öğrenci pilotu ayrıca zorunludur.'
    },
    metrics:{
      taskCount:tasks.length,
      engineCount:new Set(tasks.map(t=>`${t.grade}:${t.courseId}`)).size,
      singleReviewTaskCount:tasks.filter(t=>t.requiredReviewerCount===1).length,
      doubleReviewTaskCount:tasks.filter(t=>t.requiredReviewerCount===2).length,
      decisionCount:decisions.length,
      ...consensus.metrics
    },
    tasks,
    consensus
  });
}

export function auditHumanReviewBatch(batch=buildHumanReviewBatch()){
  const errors=[];
  if(batch.metrics.taskCount!==70)errors.push(`task-count:${batch.metrics.taskCount}`);
  if(batch.metrics.engineCount!==7)errors.push(`engine-count:${batch.metrics.engineCount}`);
  if(new Set(batch.tasks.map(t=>t.questionId)).size!==70)errors.push('duplicate-task');
  if(batch.tasks.some(t=>![1,2].includes(t.requiredReviewerCount)))errors.push('reviewer-count');
  if(batch.tasks.some(t=>!t.stem||!t.hints.length||!t.verifier?.verified))errors.push('incomplete-review-evidence');
  if(batch.productReady!==false||batch.publicationAllowed!==false||batch.gameAdaptationAllowed!==false)errors.push('premature-gate-open');
  return freeze({ok:errors.length===0,errors,metrics:batch.metrics});
}

export const ASSESSMENT_V2_PHASE4P_HUMAN_REVIEW_BATCH=buildHumanReviewBatch();
export const ASSESSMENT_V2_PHASE4P_HUMAN_REVIEW_BATCH_AUDIT=auditHumanReviewBatch(ASSESSMENT_V2_PHASE4P_HUMAN_REVIEW_BATCH);
