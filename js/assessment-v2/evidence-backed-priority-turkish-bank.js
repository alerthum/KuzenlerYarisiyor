import {
  generateEvidenceBackedTurkishRounds,
  evidenceBackedTurkishAudit
} from './evidence-backed-turkish-family-engine.js';
import { GRADE4_EVIDENCE_BACKED_TURKISH_FAMILIES } from './evidence-backed-g4-turkish-families.js';
import { GRADE8_EVIDENCE_BACKED_TURKISH_FAMILIES } from './evidence-backed-g8-turkish-families.js';

function cellId(round){return `${round.gameId}:${Number(round.targetGrade)}`;}
function diversify(rows){
  const cells=new Map();
  for(const round of rows){const id=cellId(round);if(!cells.has(id))cells.set(id,[]);cells.get(id).push(round);}
  const result=[];
  for(const id of [...cells.keys()].sort()){
    const remaining=[...cells.get(id)];
    let previousFamily=null;
    let previousExperience=null;
    let order=1;
    while(remaining.length){
      const familyRemaining=new Map();
      const experienceRemaining=new Map();
      for(const round of remaining){
        familyRemaining.set(round.familyId,(familyRemaining.get(round.familyId)||0)+1);
        experienceRemaining.set(round.trustedExperienceType,(experienceRemaining.get(round.trustedExperienceType)||0)+1);
      }
      const candidates=remaining.filter((round)=>round.familyId!==previousFamily&&round.trustedExperienceType!==previousExperience)
        .sort((a,b)=>(familyRemaining.get(b.familyId)-familyRemaining.get(a.familyId))
          ||(experienceRemaining.get(b.trustedExperienceType)-experienceRemaining.get(a.trustedExperienceType))
          ||String(a.familyId).localeCompare(String(b.familyId))
          ||String(a.skeletonId).localeCompare(String(b.skeletonId)));
      const chosen=candidates[0];
      if(!chosen)throw new Error(`Türkçe oturum çeşitliliği sıralaması kilitlendi: ${id}`);
      remaining.splice(remaining.indexOf(chosen),1);
      result.push(Object.freeze({...chosen,trustedSessionOrder:order++,sessionDiversityPolicy:'NO_ADJACENT_SOURCE_CASE_OR_TASK_V1',enginePublicationMode:'EVIDENCE_BACKED_FAIL_CLOSED'}));
      previousFamily=chosen.familyId;
      previousExperience=chosen.trustedExperienceType;
    }
  }
  return Object.freeze(result);
}

const rawG4=generateEvidenceBackedTurkishRounds(GRADE4_EVIDENCE_BACKED_TURKISH_FAMILIES,{seedBase:14000});
const rawG8=generateEvidenceBackedTurkishRounds(GRADE8_EVIDENCE_BACKED_TURKISH_FAMILIES,{seedBase:18000});
export const EVIDENCE_BACKED_PRIORITY_TURKISH_ROUNDS=diversify([...rawG4,...rawG8]);

function keysFor(gameId,grade){return Object.freeze(EVIDENCE_BACKED_PRIORITY_TURKISH_ROUNDS.filter((round)=>round.gameId===gameId&&Number(round.targetGrade)===Number(grade)).sort((a,b)=>a.trustedSessionOrder-b.trustedSessionOrder).map((round)=>round.questionKey));}
export const EVIDENCE_BACKED_PRIORITY_TURKISH_KEYS=Object.freeze({
  grade4:Object.freeze({paragraphDetective:keysFor('paragraph-detective',4),meaningHunt:keysFor('meaning-hunt',4)}),
  grade8:Object.freeze({paragraphDetective:keysFor('paragraph-detective',8),meaningHunt:keysFor('meaning-hunt',8)})
});

const g4Rounds=EVIDENCE_BACKED_PRIORITY_TURKISH_ROUNDS.filter((round)=>Number(round.targetGrade)===4);
const g8Rounds=EVIDENCE_BACKED_PRIORITY_TURKISH_ROUNDS.filter((round)=>Number(round.targetGrade)===8);
const g4Audit=evidenceBackedTurkishAudit(GRADE4_EVIDENCE_BACKED_TURKISH_FAMILIES,g4Rounds);
const g8Audit=evidenceBackedTurkishAudit(GRADE8_EVIDENCE_BACKED_TURKISH_FAMILIES,g8Rounds);
const adjacencyErrors=[];
for(const [id,keys] of Object.entries({
  'paragraph-detective:4':EVIDENCE_BACKED_PRIORITY_TURKISH_KEYS.grade4.paragraphDetective,
  'meaning-hunt:4':EVIDENCE_BACKED_PRIORITY_TURKISH_KEYS.grade4.meaningHunt,
  'paragraph-detective:8':EVIDENCE_BACKED_PRIORITY_TURKISH_KEYS.grade8.paragraphDetective,
  'meaning-hunt:8':EVIDENCE_BACKED_PRIORITY_TURKISH_KEYS.grade8.meaningHunt
})){
  const map=new Map(EVIDENCE_BACKED_PRIORITY_TURKISH_ROUNDS.map((round)=>[round.questionKey,round]));
  const rounds=keys.map((key)=>map.get(key));
  for(let index=1;index<rounds.length;index+=1){
    if(rounds[index-1].familyId===rounds[index].familyId)adjacencyErrors.push(`${id}:adjacent-source:${index}`);
    if(rounds[index-1].trustedExperienceType===rounds[index].trustedExperienceType)adjacencyErrors.push(`${id}:adjacent-task:${index}`);
  }
}
const errors=[...g4Audit.errors.map((e)=>`g4:${e}`),...g8Audit.errors.map((e)=>`g8:${e}`),...adjacencyErrors];
export const EVIDENCE_BACKED_PRIORITY_TURKISH_AUDIT=Object.freeze({
  ok:errors.length===0,
  errors:Object.freeze(errors),
  policy:Object.freeze({randomSentenceCompositionAllowed:false,fallbackToLegacyAllowed:false,sessionDiversityPolicy:'NO_ADJACENT_SOURCE_CASE_OR_TASK_V1'}),
  metrics:Object.freeze({
    grade4FamilyCount:GRADE4_EVIDENCE_BACKED_TURKISH_FAMILIES.length,
    grade8FamilyCount:GRADE8_EVIDENCE_BACKED_TURKISH_FAMILIES.length,
    familyCount:GRADE4_EVIDENCE_BACKED_TURKISH_FAMILIES.length+GRADE8_EVIDENCE_BACKED_TURKISH_FAMILIES.length,
    grade4RoundCount:g4Rounds.length,grade8RoundCount:g8Rounds.length,roundCount:EVIDENCE_BACKED_PRIORITY_TURKISH_ROUNDS.length,
    distinctSkeletonCount:new Set(EVIDENCE_BACKED_PRIORITY_TURKISH_ROUNDS.map((r)=>r.skeletonId)).size,
    evidenceVerifiedCount:EVIDENCE_BACKED_PRIORITY_TURKISH_ROUNDS.filter((r)=>r.evidenceProof?.verified===true).length,
    randomSentenceCompositionCount:EVIDENCE_BACKED_PRIORITY_TURKISH_ROUNDS.filter((r)=>r.engineReview?.randomSentenceComposition!==false).length,
    safeCellCount:4,supportedGameCount:2
  })
});
if(!EVIDENCE_BACKED_PRIORITY_TURKISH_AUDIT.ok)throw new Error(`Kanıt-temelli Türkçe bankası geçersiz: ${errors.join(', ')}`);
