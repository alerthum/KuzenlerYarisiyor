import { ASSESSMENT_V2_CANONICAL_CATALOG } from './canonical-catalog.js';
import { CORE_GAME_RELEASE_PROFILE } from './core-game-release-profile.js';
import { GRADE8_TURKISH_HUMAN_REVIEW_DECISIONS } from './turkish-g8-human-review-registry.js';

const freeze=value=>{
  if(Array.isArray(value))return Object.freeze(value.map(freeze));
  if(value&&typeof value==='object')return Object.freeze(Object.fromEntries(Object.entries(value).map(([k,v])=>[k,freeze(v)])));
  return value;
};
const groupOf=courseId=>{
  if(courseId==='turkce')return 'turkish';
  if(courseId==='matematik')return 'math';
  if(courseId==='fen-bilimleri')return 'science';
  if(['sosyal-bilgiler','t-c-inkilap-tarihi-ve-ataturkculuk'].includes(courseId))return 'social';
  if(['yabanci-dil','ingilizce'].includes(courseId))return 'english';
  if(courseId==='din-kulturu-ve-ahlak-bilgisi')return 'religion';
  return null;
};
const riskOf=item=>{
  const format=item.itemFormat||'';
  if(/performance|oral|essay|project|experiment|construction/i.test(format))return 'HIGH';
  if(item.content?.media||item.content?.stimulusBlocks?.some?.(block=>block?.media))return 'HIGH';
  if(item.verifier?.verified===true&&format==='single-choice')return 'LOW';
  return 'MEDIUM';
};
const score={HIGH:3,MEDIUM:2,LOW:1};
const approvedIds=new Set(GRADE8_TURKISH_HUMAN_REVIEW_DECISIONS.filter(row=>row.decision==='APPROVED_FOR_NEXT_WAVE').map(row=>row.questionId));

export function buildCoreGameReviewSprints({sprintSize=60}={}){
  const coreGrades=new Set(CORE_GAME_RELEASE_PROFILE.grades);
  const rows=ASSESSMENT_V2_CANONICAL_CATALOG
    .filter(item=>coreGrades.has(item.curriculum.grade)&&groupOf(item.curriculum.courseId))
    .map(item=>({
      questionId:item.id,grade:item.curriculum.grade,courseId:item.curriculum.courseId,
      courseGroup:groupOf(item.curriculum.courseId),outcomeIds:[...item.curriculum.outcomeIds],
      itemFormat:item.itemFormat,risk:riskOf(item),humanReviewStatus:approvedIds.has(item.id)?'APPROVED_FOR_NEXT_WAVE':(item.content?.humanReview?.status||'NOT_MEASURED'),
      gameAdaptationAllowed:approvedIds.has(item.id),
      stem:item.content?.stem||'',optionCount:item.content?.options?.length||0
    }))
    .sort((a,b)=>score[b.risk]-score[a.risk]||a.grade-b.grade||a.courseGroup.localeCompare(b.courseGroup)||a.questionId.localeCompare(b.questionId));
  const sprints=[];
  for(let index=0;index<rows.length;index+=sprintSize){
    const items=rows.slice(index,index+sprintSize);
    sprints.push({
      sprintNo:sprints.length+1,status:'HUMAN_REVIEW_REQUIRED',items,
      metrics:{itemCount:items.length,highRisk:items.filter(x=>x.risk==='HIGH').length,mediumRisk:items.filter(x=>x.risk==='MEDIUM').length,lowRisk:items.filter(x=>x.risk==='LOW').length,approved:items.filter(x=>x.gameAdaptationAllowed).length,pending:items.filter(x=>!x.gameAdaptationAllowed).length}
    });
  }
  return freeze({schemaVersion:'1.0',profileId:CORE_GAME_RELEASE_PROFILE.id,sprintSize,totalItems:rows.length,totalSprints:sprints.length,sprints,publicationAllowed:false});
}

export function auditCoreGameReviewSprints(plan=buildCoreGameReviewSprints()){
  const errors=[];
  const rows=plan.sprints.flatMap(s=>s.items);
  if(rows.length!==plan.totalItems)errors.push('item-count');
  if(new Set(rows.map(row=>row.questionId)).size!==rows.length)errors.push('duplicate-question');
  if(plan.sprints.some(s=>s.items.length>plan.sprintSize))errors.push('sprint-overflow');
  if(rows.some(row=>!['HIGH','MEDIUM','LOW'].includes(row.risk)))errors.push('risk');
  if(plan.publicationAllowed!==false)errors.push('premature-release');
  return freeze({ok:errors.length===0,errors,metrics:{totalItems:plan.totalItems,totalSprints:plan.totalSprints,approved:rows.filter(x=>x.gameAdaptationAllowed).length,pending:rows.filter(x=>!x.gameAdaptationAllowed).length}});
}

export const CORE_GAME_REVIEW_SPRINTS=buildCoreGameReviewSprints();
export const CORE_GAME_REVIEW_SPRINTS_AUDIT=auditCoreGameReviewSprints(CORE_GAME_REVIEW_SPRINTS);
