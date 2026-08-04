import { ASSESSMENT_V2_CANONICAL_CATALOG } from './canonical-catalog.js';
import { GRADE8_TURKISH_HUMAN_REVIEW_DECISIONS } from './turkish-g8-human-review-registry.js';

const approvedIds=new Set(GRADE8_TURKISH_HUMAN_REVIEW_DECISIONS.map(row=>row.questionId));
const priorityByCourse=Object.freeze({'matematik':1,'fen-bilimleri':2,'t-c-inkilap-tarihi-ve-ataturkculuk':3,'din-kulturu-ve-ahlak-bilgisi':4,'ingilizce':5,'yabanci-dil':5,'sosyal-bilgiler':6,'turkce':7});

function reviewComplexity(item){
  let score=1;
  if(item.itemFormat!=='single-choice')score+=3;
  if(item.curriculum.courseId==='matematik'&&item.itemFormat==='interactive-simulation')score+=3;
  if(item.curriculum.courseId==='fen-bilimleri')score+=1;
  if(item.content?.stimulusBlocks?.length>1)score+=1;
  if(item.responseModel?.rubricCriteria?.length)score+=2;
  return score;
}

function reviewRow(item,index){
  const approved=approvedIds.has(item.id);
  const complexity=reviewComplexity(item);
  return Object.freeze({
    order:index+1,
    questionId:item.id,
    grade:item.curriculum.grade,
    courseId:item.curriculum.courseId,
    outcomeIds:Object.freeze([...item.curriculum.outcomeIds]),
    itemFormat:item.itemFormat,
    primarySkill:item.construct?.primarySkill||null,
    difficultyBand:item.construct?.intendedDifficultyBand||null,
    reviewStatus:approved?'APPROVED_FOR_NEXT_WAVE':'HUMAN_REVIEW_REQUIRED',
    gameAdaptationAllowed:false,
    complexity,
    requiredChecks:Object.freeze([
      'correctness-and-independent-verification',
      'option-or-rubric-quality',
      'age-and-language-fit',
      'hint-non-leakage',
      'feedback-teaching-value',
      'game-adaptation-remains-locked'
    ])
  });
}

export function buildAssessmentV2HumanReviewQueue(items=ASSESSMENT_V2_CANONICAL_CATALOG){
  const rows=items.map(reviewRow).sort((a,b)=>{
    if(a.reviewStatus!==b.reviewStatus)return a.reviewStatus==='HUMAN_REVIEW_REQUIRED'?-1:1;
    const ap=priorityByCourse[a.courseId]??9,bp=priorityByCourse[b.courseId]??9;
    if(ap!==bp)return ap-bp;
    if(a.grade!==b.grade)return b.grade-a.grade;
    if(a.complexity!==b.complexity)return b.complexity-a.complexity;
    return a.questionId.localeCompare(b.questionId,'tr');
  }).map((row,index)=>Object.freeze({...row,order:index+1}));
  const pending=rows.filter(row=>row.reviewStatus==='HUMAN_REVIEW_REQUIRED');
  return Object.freeze({
    schemaVersion:'1.0',
    generatedAt:new Date().toISOString(),
    status:'HUMAN_REVIEW_BLOCKING_GAME_ADAPTATION',
    productReady:false,
    gameAdaptationAllowed:false,
    metrics:Object.freeze({total:rows.length,approved:rows.length-pending.length,pending:pending.length,highComplexityPending:pending.filter(row=>row.complexity>=4).length}),
    rows:Object.freeze(rows)
  });
}

export function auditAssessmentV2HumanReviewQueue(queue=buildAssessmentV2HumanReviewQueue()){
  const errors=[];
  if(queue.metrics.total!==2134)errors.push(`total:${queue.metrics.total}`);
  if(queue.metrics.approved!==5)errors.push(`approved:${queue.metrics.approved}`);
  if(queue.metrics.pending!==2129)errors.push(`pending:${queue.metrics.pending}`);
  if(new Set(queue.rows.map(row=>row.questionId)).size!==queue.rows.length)errors.push('duplicate-question');
  if(queue.rows.some(row=>row.gameAdaptationAllowed!==false))errors.push('game-open');
  if(queue.productReady!==false||queue.gameAdaptationAllowed!==false)errors.push('product-ready-leak');
  return Object.freeze({ok:errors.length===0,errors:Object.freeze(errors),metrics:queue.metrics});
}

export const ASSESSMENT_V2_HUMAN_REVIEW_QUEUE=buildAssessmentV2HumanReviewQueue();
export const ASSESSMENT_V2_HUMAN_REVIEW_QUEUE_AUDIT=auditAssessmentV2HumanReviewQueue(ASSESSMENT_V2_HUMAN_REVIEW_QUEUE);
