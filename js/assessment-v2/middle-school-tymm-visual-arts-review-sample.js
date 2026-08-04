import { MIDDLE_SCHOOL_TYMM_VISUAL_ARTS_ENGINE_RECORDS } from './middle-school-tymm-visual-arts-engines.js';
const freeze=value=>{if(Array.isArray(value))return Object.freeze(value.map(freeze));if(value&&typeof value==='object')return Object.freeze(Object.fromEntries(Object.entries(value).map(([key,val])=>[key,freeze(val)])));return value;};
function pick(items){const first=items[0],different=items.find(item=>item.itemFormat!==first.itemFormat||item.curriculum.unitId!==first.curriculum.unitId)||items[1];return [first,different];}
export function buildMiddleSchoolTymmVisualArtsReviewSample(){
  const rows=[];
  for(const record of MIDDLE_SCHOOL_TYMM_VISUAL_ARTS_ENGINE_RECORDS){for(const item of pick(record.items))rows.push({questionId:item.id,engineKey:`g${record.grade}:gorsel-sanatlar`,grade:record.grade,courseId:'gorsel-sanatlar',outcomeIds:[...item.curriculum.outcomeIds],itemFormat:item.itemFormat,context:item.content.context,stem:item.content.stem,rubricCriteria:[...(item.responseModel.rubricCriteria||[])],hints:item.hints.map(hint=>hint.text),misconceptionIds:[...item.misconceptionIds],media:item.content.media,humanReviewStatus:'NOT_MEASURED',realArtworkStatus:'REQUIRED_NOT_ATTACHED',gameAdaptationAllowed:false});}
  return freeze({schemaVersion:'1.0',generatedAt:new Date().toISOString(),status:'HUMAN_AND_REAL_ARTWORK_REVIEW_REQUIRED',metrics:{engineCount:3,itemCount:rows.length,perEngine:2,approved:0,pending:rows.length},rows});
}
export function auditMiddleSchoolTymmVisualArtsReviewSample(sample=buildMiddleSchoolTymmVisualArtsReviewSample()){
  const errors=[];if(sample.metrics.engineCount!==3)errors.push('engine-count');if(sample.metrics.itemCount!==6)errors.push('item-count');if(sample.metrics.approved!==0||sample.metrics.pending!==6)errors.push('review-leak');if(new Set(sample.rows.map(row=>row.questionId)).size!==6)errors.push('duplicate');if(sample.rows.some(row=>row.gameAdaptationAllowed!==false||row.humanReviewStatus!=='NOT_MEASURED'||row.realArtworkStatus!=='REQUIRED_NOT_ATTACHED'))errors.push('approval-asset-or-game-leak');return freeze({ok:errors.length===0,errors,metrics:sample.metrics});
}
export const MIDDLE_SCHOOL_TYMM_VISUAL_ARTS_REVIEW_SAMPLE=buildMiddleSchoolTymmVisualArtsReviewSample();
export const MIDDLE_SCHOOL_TYMM_VISUAL_ARTS_REVIEW_SAMPLE_AUDIT=auditMiddleSchoolTymmVisualArtsReviewSample(MIDDLE_SCHOOL_TYMM_VISUAL_ARTS_REVIEW_SAMPLE);
