import {
  buildGrade5MathFullScopeTasks,
  buildGrade5ScienceFullScopeTasks,
  buildGrade5SocialFullScopeTasks,
  buildGrade5DkabFullScopeTasks,
  buildGrade5EnglishFullScopeTasks
} from './grade5-core-full-scope-engines.js';

const freeze=value=>{
  if(Array.isArray(value))return Object.freeze(value.map(freeze));
  if(value&&typeof value==='object')return Object.freeze(Object.fromEntries(Object.entries(value).map(([k,v])=>[k,freeze(v)])));
  return value;
};

const ENGINE_SOURCES=Object.freeze([
  ['g5:matematik',buildGrade5MathFullScopeTasks()],
  ['g5:fen-bilimleri',buildGrade5ScienceFullScopeTasks()],
  ['g5:sosyal-bilgiler',buildGrade5SocialFullScopeTasks()],
  ['g5:din-kulturu-ve-ahlak-bilgisi',buildGrade5DkabFullScopeTasks()],
  ['g5:yabanci-dil',buildGrade5EnglishFullScopeTasks()]
]);

function pickDiverse(items,count=5){
  const selected=[];
  const formats=new Set();
  const units=new Set();
  for(const item of items){
    const unit=item.curriculum.unitId;
    if(selected.length<count&&( !formats.has(item.itemFormat)||!units.has(unit))){selected.push(item);formats.add(item.itemFormat);units.add(unit);}
  }
  for(const item of items)if(selected.length<count&&!selected.some(x=>x.id===item.id))selected.push(item);
  return selected.slice(0,count);
}

export function buildGrade5CoreReviewSample(){
  const rows=[];
  for(const [engineKey,items] of ENGINE_SOURCES){
    for(const item of pickDiverse(items,5)){
      rows.push({
        questionId:item.id,engineKey,grade:item.curriculum.grade,courseId:item.curriculum.courseId,
        outcomeIds:[...item.curriculum.outcomeIds],itemFormat:item.itemFormat,
        primarySkill:item.construct.primarySkill,difficultyBand:item.construct.intendedDifficultyBand,
        context:item.content.context,stem:item.content.stem,
        rubricCriteria:[...(item.responseModel.rubricCriteria||[])],hints:item.hints.map(h=>h.text),
        misconceptionIds:[...item.misconceptionIds],humanReviewStatus:'NOT_MEASURED',gameAdaptationAllowed:false,
        requiredChecks:['curriculum-alignment','domain-correctness','age-language-fit','rubric-observability','hint-non-leakage','media-provenance-and-accessibility']
      });
    }
  }
  return freeze({schemaVersion:'1.0',generatedAt:new Date().toISOString(),status:'HUMAN_REVIEW_REQUIRED',metrics:{engineCount:5,itemCount:rows.length,perEngine:5,approved:0,pending:rows.length},rows});
}

export function auditGrade5CoreReviewSample(sample=buildGrade5CoreReviewSample()){
  const errors=[];
  if(sample.metrics.engineCount!==5)errors.push(`engine-count:${sample.metrics.engineCount}`);
  if(sample.metrics.itemCount!==25)errors.push(`item-count:${sample.metrics.itemCount}`);
  if(sample.metrics.approved!==0||sample.metrics.pending!==25)errors.push('human-review-leak');
  if(new Set(sample.rows.map(r=>r.questionId)).size!==25)errors.push('duplicate-item');
  for(const [engineKey] of ENGINE_SOURCES)if(sample.rows.filter(r=>r.engineKey===engineKey).length!==5)errors.push(`per-engine:${engineKey}`);
  if(sample.rows.some(r=>r.gameAdaptationAllowed!==false||r.humanReviewStatus!=='NOT_MEASURED'))errors.push('gate-leak');
  return freeze({ok:errors.length===0,errors,metrics:sample.metrics});
}

export const GRADE5_CORE_REVIEW_SAMPLE=buildGrade5CoreReviewSample();
export const GRADE5_CORE_REVIEW_SAMPLE_AUDIT=auditGrade5CoreReviewSample(GRADE5_CORE_REVIEW_SAMPLE);
