import { ASSESSMENT_V2_PRODUCTION_PORTFOLIO } from './production-portfolio.js';
import { GAME_CATALOG } from '../games/registry.js';

const freeze=value=>{
  if(Array.isArray(value))return Object.freeze(value.map(freeze));
  if(value&&typeof value==='object')return Object.freeze(Object.fromEntries(Object.entries(value).map(([k,v])=>[k,freeze(v)])));
  return value;
};

export const CORE_GAME_RELEASE_GRADES=freeze([5,6,7,8]);
export const CORE_GAME_RELEASE_COURSES=freeze([
  'turkce','matematik','fen-bilimleri','sosyal-bilgiler',
  't-c-inkilap-tarihi-ve-ataturkculuk','din-kulturu-ve-ahlak-bilgisi',
  'yabanci-dil','ingilizce'
]);

const courseGroup=courseId=>{
  if(courseId==='turkce')return 'turkish';
  if(courseId==='matematik')return 'math';
  if(courseId==='fen-bilimleri')return 'science';
  if(['sosyal-bilgiler','t-c-inkilap-tarihi-ve-ataturkculuk'].includes(courseId))return 'social';
  if(['yabanci-dil','ingilizce'].includes(courseId))return 'english';
  if(courseId==='din-kulturu-ve-ahlak-bilgisi')return 'religion';
  return null;
};

const GAME_GROUPS=freeze({
  turkish:['word-mine','word-ladder','forbidden-story','meaning-hunt','paragraph-detective'],
  math:['target-number','speed-math','pattern-lab','problem-hunter','geometry-lab','error-detective','olympiad-ladder','logic-station'],
  english:['english-vocabulary','english-cloze','english-sentence-builder'],
  social:['social-time-travel','social-map-skills','social-citizenship'],
  religion:['religion-practice'],
  science:['science-lab','science-reasoning'],
  mixed:['lgs-foundation']
});

export function buildCoreGameReleaseProfile(portfolio=ASSESSMENT_V2_PRODUCTION_PORTFOLIO){
  const engines=portfolio.engines.filter(engine=>CORE_GAME_RELEASE_GRADES.includes(engine.grade)&&courseGroup(engine.courseId));
  const cells=new Set(engines.map(engine=>`${engine.grade}:${courseGroup(engine.courseId)}`));
  const requiredCells=[];
  for(const grade of CORE_GAME_RELEASE_GRADES){
    for(const group of ['turkish','math','science','social','english','religion'])requiredCells.push(`${grade}:${group}`);
  }
  const gameIds=[...Object.values(GAME_GROUPS).flat()];
  const catalogIds=new Set(GAME_CATALOG.map(game=>game.id));
  return freeze({
    schemaVersion:'1.0',
    id:'CORE_GAME_RELEASE_5_8_V1',
    title:'5–8. sınıf ana dersler ve 23 oyun çekirdek yayını',
    productScope:'FIRST_PLAYABLE_CORE',
    fullProductScopeExcludedFromBlocking:['rehberlik','gorsel-sanatlar','muzik','beden-egitimi','bilisim','trafik','insan-haklari','lise-9-12'],
    grades:CORE_GAME_RELEASE_GRADES,
    requiredCellKeys:requiredCells,
    activeCellKeys:[...cells].sort(),
    engines:engines.map(engine=>({
      id:engine.id,grade:engine.grade,courseId:engine.courseId,courseGroup:courseGroup(engine.courseId),
      officialOutcomeCount:engine.officialOutcomeCount,coveredOutcomeCount:engine.coveredOutcomeCount,
      canonicalQuestionCount:engine.canonicalQuestionCount,humanApprovedQuestionCount:engine.humanApprovedQuestionCount,
      humanReviewPending:engine.canonicalQuestionCount-engine.humanApprovedQuestionCount
    })),
    gameGroups:GAME_GROUPS,
    gameIds,
    metrics:{
      requiredCellCount:requiredCells.length,
      activeCellCount:cells.size,
      missingCellCount:requiredCells.filter(key=>!cells.has(key)).length,
      engineCount:engines.length,
      officialOutcomeCount:engines.reduce((sum,row)=>sum+row.officialOutcomeCount,0),
      coveredOutcomeCount:engines.reduce((sum,row)=>sum+row.coveredOutcomeCount,0),
      canonicalQuestionCount:engines.reduce((sum,row)=>sum+row.canonicalQuestionCount,0),
      humanApprovedQuestionCount:engines.reduce((sum,row)=>sum+row.humanApprovedQuestionCount,0),
      humanReviewPending:engines.reduce((sum,row)=>sum+row.canonicalQuestionCount-row.humanApprovedQuestionCount,0),
      requiredGameCount:23,
      routedGameCount:gameIds.filter(id=>catalogIds.has(id)).length,
      unknownGameIds:gameIds.filter(id=>!catalogIds.has(id))
    },
    publicationAllowed:false,
    productReady:false
  });
}

export function auditCoreGameReleaseProfile(profile=buildCoreGameReleaseProfile()){
  const errors=[];
  if(profile.metrics.requiredCellCount!==24)errors.push(`required-cell-count:${profile.metrics.requiredCellCount}`);
  if(profile.metrics.activeCellCount!==24)errors.push(`active-cell-count:${profile.metrics.activeCellCount}`);
  if(profile.metrics.missingCellCount!==0)errors.push(`missing-cell-count:${profile.metrics.missingCellCount}`);
  if(profile.metrics.engineCount!==24)errors.push(`engine-count:${profile.metrics.engineCount}`);
  if(profile.metrics.coveredOutcomeCount!==profile.metrics.officialOutcomeCount)errors.push('curriculum-gap');
  if(profile.metrics.routedGameCount!==23||profile.metrics.unknownGameIds.length)errors.push('game-route-gap');
  if(profile.publicationAllowed!==false||profile.productReady!==false)errors.push('premature-release');
  return freeze({ok:errors.length===0,errors,metrics:profile.metrics});
}

export const CORE_GAME_RELEASE_PROFILE=buildCoreGameReleaseProfile();
export const CORE_GAME_RELEASE_PROFILE_AUDIT=auditCoreGameReleaseProfile(CORE_GAME_RELEASE_PROFILE);
