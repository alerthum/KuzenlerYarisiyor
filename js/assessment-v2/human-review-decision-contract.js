const DECISIONS=new Set(['APPROVE','REVISE','REJECT']);
const PII_KEYS=new Set(['name','fullName','email','phone','address','nationalId','tcKimlik']);
const DIMENSIONS=Object.freeze(['correctness','optionOrRubricQuality','ageLanguageFit','hintNonLeakage','feedbackTeachingValue','naturalness']);
function piiErrors(value,path=''){if(!value||typeof value!=='object')return[];const out=[];for(const[k,v]of Object.entries(value)){const p=path?`${path}.${k}`:k;if(PII_KEYS.has(k))out.push(`pii-forbidden:${p}`);out.push(...piiErrors(v,p));}return out;}
function text(value,field){const s=String(value??'').trim();if(!s)throw new Error(`${field}:required`);return s;}
function score(value,field){const n=Number(value);if(!Number.isInteger(n)||n<1||n>5)throw new Error(`${field}:must-be-1-5`);return n;}
export function defineHumanReviewDecision(input={}){
 const pii=piiErrors(input);if(pii.length)throw new Error(pii.join(','));
 const decision=text(input.decision,'decision');if(!DECISIONS.has(decision))throw new Error('decision:unsupported');
 const reviewerAnonId=text(input.reviewerAnonId,'reviewerAnonId');if(!/^reviewer_[a-z0-9_-]{6,80}$/i.test(reviewerAnonId))throw new Error('reviewerAnonId:not-anonymous');
 const scores=Object.fromEntries(DIMENSIONS.map(d=>[d,score(input.scores?.[d],`scores.${d}`)]));
 const criticalBlockers=Object.freeze([...(input.criticalBlockers||[])].map(String).filter(Boolean));
 if(decision==='APPROVE'&&(criticalBlockers.length||Object.values(scores).some(v=>v<4)))throw new Error('approve:quality-threshold-not-met');
 const reviewedAt=text(input.reviewedAt,'reviewedAt');if(!Number.isFinite(Date.parse(reviewedAt)))throw new Error('reviewedAt:invalid');
 return Object.freeze({schemaVersion:'1.0',reviewId:text(input.reviewId,'reviewId'),batchId:text(input.batchId,'batchId'),questionId:text(input.questionId,'questionId'),reviewerAnonId,reviewerRole:text(input.reviewerRole||'CONTENT_REVIEWER','reviewerRole'),decision,scores:Object.freeze(scores),criticalBlockers,notes:String(input.notes||'').trim(),reviewedAt});
}
export function auditHumanReviewDecisions(rows=[]){const errors=[],normalized=[];for(let i=0;i<rows.length;i++){try{normalized.push(defineHumanReviewDecision(rows[i]));}catch(e){errors.push(`${i}:${e.message}`);}}if(new Set(normalized.map(x=>x.reviewId)).size!==normalized.length)errors.push('duplicate-review-id');const pair=normalized.map(x=>`${x.questionId}:${x.reviewerAnonId}`);if(new Set(pair).size!==pair.length)errors.push('duplicate-reviewer-question');return Object.freeze({ok:errors.length===0,errors:Object.freeze(errors),rows:Object.freeze(normalized)});}
export {DIMENSIONS as HUMAN_REVIEW_DIMENSIONS};
