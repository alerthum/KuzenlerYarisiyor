import { generateEvidenceBackedScienceRounds, evidenceBackedScienceAudit } from './evidence-backed-science-family-engine.js';
import { GRADE4_EVIDENCE_BACKED_SCIENCE_FAMILIES } from './evidence-backed-g4-science-families.js';
import { GRADE8_EVIDENCE_BACKED_SCIENCE_FAMILIES } from './evidence-backed-g8-science-families.js';

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
      const familyCandidates=remaining.filter((round)=>round.familyId!==previousFamily);
      const experienceCandidates=familyCandidates.filter((round)=>round.trustedExperienceType!==previousExperience);
      const candidates=(experienceCandidates.length?experienceCandidates:familyCandidates)
        .sort((a,b)=>(familyRemaining.get(b.familyId)-familyRemaining.get(a.familyId))
          ||(experienceRemaining.get(b.trustedExperienceType)-experienceRemaining.get(a.trustedExperienceType))
          ||String(a.familyId).localeCompare(String(b.familyId))
          ||String(a.skeletonId).localeCompare(String(b.skeletonId)));
      const chosen=candidates[0];
      if(!chosen)throw new Error(`Fen oturum çeşitliliği sıralaması kilitlendi: ${id}`);
      remaining.splice(remaining.indexOf(chosen),1);
      result.push(Object.freeze({...chosen,trustedSessionOrder:order++,sessionDiversityPolicy:'NO_ADJACENT_SCIENCE_FAMILY_OR_TASK_V1',enginePublicationMode:'EVIDENCE_BACKED_FAIL_CLOSED'}));
      previousFamily=chosen.familyId;
      previousExperience=chosen.trustedExperienceType;
    }
  }
  return Object.freeze(result);
}

const rawG4=generateEvidenceBackedScienceRounds(GRADE4_EVIDENCE_BACKED_SCIENCE_FAMILIES,{seedBase:24000});
const rawG8=generateEvidenceBackedScienceRounds(GRADE8_EVIDENCE_BACKED_SCIENCE_FAMILIES,{seedBase:28000});
export const EVIDENCE_BACKED_PRIORITY_SCIENCE_ROUNDS=diversify([...rawG4,...rawG8]);

function keysFor(gameId,grade){return Object.freeze(EVIDENCE_BACKED_PRIORITY_SCIENCE_ROUNDS.filter((round)=>round.gameId===gameId&&Number(round.targetGrade)===Number(grade)).sort((a,b)=>a.trustedSessionOrder-b.trustedSessionOrder).map((round)=>round.questionKey));}
export const EVIDENCE_BACKED_PRIORITY_SCIENCE_KEYS=Object.freeze({
  grade4:Object.freeze({scienceReasoning:keysFor('science-reasoning',4),scienceLab:keysFor('science-lab',4)}),
  grade8:Object.freeze({scienceReasoning:keysFor('science-reasoning',8),scienceLab:keysFor('science-lab',8)})
});

const g4Rounds=EVIDENCE_BACKED_PRIORITY_SCIENCE_ROUNDS.filter((round)=>Number(round.targetGrade)===4);
const g8Rounds=EVIDENCE_BACKED_PRIORITY_SCIENCE_ROUNDS.filter((round)=>Number(round.targetGrade)===8);
const g4Audit=evidenceBackedScienceAudit(GRADE4_EVIDENCE_BACKED_SCIENCE_FAMILIES,g4Rounds);
const g8Audit=evidenceBackedScienceAudit(GRADE8_EVIDENCE_BACKED_SCIENCE_FAMILIES,g8Rounds);
const adjacencyErrors=[];
for(const [id,keys] of Object.entries({
  'science-reasoning:4':EVIDENCE_BACKED_PRIORITY_SCIENCE_KEYS.grade4.scienceReasoning,
  'science-lab:4':EVIDENCE_BACKED_PRIORITY_SCIENCE_KEYS.grade4.scienceLab,
  'science-reasoning:8':EVIDENCE_BACKED_PRIORITY_SCIENCE_KEYS.grade8.scienceReasoning,
  'science-lab:8':EVIDENCE_BACKED_PRIORITY_SCIENCE_KEYS.grade8.scienceLab
})){
  const map=new Map(EVIDENCE_BACKED_PRIORITY_SCIENCE_ROUNDS.map((round)=>[round.questionKey,round]));
  const rounds=keys.map((key)=>map.get(key));
  const distinctExperiences=new Set(rounds.map((round)=>round.trustedExperienceType)).size;
  for(let index=1;index<rounds.length;index+=1){
    if(rounds[index-1].familyId===rounds[index].familyId)adjacencyErrors.push(`${id}:adjacent-family:${index}`);
    if(distinctExperiences>1&&rounds[index-1].trustedExperienceType===rounds[index].trustedExperienceType)adjacencyErrors.push(`${id}:adjacent-task:${index}`);
  }
}
const errors=[...g4Audit.errors.map((e)=>`g4:${e}`),...g8Audit.errors.map((e)=>`g8:${e}`),...adjacencyErrors];
export const EVIDENCE_BACKED_PRIORITY_SCIENCE_AUDIT=Object.freeze({
  ok:errors.length===0,
  errors:Object.freeze(errors),
  policy:Object.freeze({randomSentenceCompositionAllowed:false,fallbackToLegacyAllowed:false,sessionDiversityPolicy:'NO_ADJACENT_SCIENCE_FAMILY_OR_TASK_V1'}),
  metrics:Object.freeze({
    grade4FamilyCount:GRADE4_EVIDENCE_BACKED_SCIENCE_FAMILIES.length,
    grade8FamilyCount:GRADE8_EVIDENCE_BACKED_SCIENCE_FAMILIES.length,
    familyCount:GRADE4_EVIDENCE_BACKED_SCIENCE_FAMILIES.length+GRADE8_EVIDENCE_BACKED_SCIENCE_FAMILIES.length,
    grade4RoundCount:g4Rounds.length,grade8RoundCount:g8Rounds.length,roundCount:EVIDENCE_BACKED_PRIORITY_SCIENCE_ROUNDS.length,
    distinctSkeletonCount:new Set(EVIDENCE_BACKED_PRIORITY_SCIENCE_ROUNDS.map((r)=>r.skeletonId)).size,
    evidenceVerifiedCount:EVIDENCE_BACKED_PRIORITY_SCIENCE_ROUNDS.filter((r)=>r.evidenceProof?.verified===true&&r.solverProof?.verified===true).length,
    experimentDesignCount:EVIDENCE_BACKED_PRIORITY_SCIENCE_ROUNDS.filter((r)=>r.gameId==='science-lab').length,
    reasoningCount:EVIDENCE_BACKED_PRIORITY_SCIENCE_ROUNDS.filter((r)=>r.gameId==='science-reasoning').length,
    randomSentenceCompositionCount:EVIDENCE_BACKED_PRIORITY_SCIENCE_ROUNDS.filter((r)=>r.engineReview?.randomSentenceComposition!==false).length,
    safeCellCount:4,supportedGameCount:2
  })
});
if(!EVIDENCE_BACKED_PRIORITY_SCIENCE_AUDIT.ok)throw new Error(`Kanıt-temelli Fen bankası geçersiz: ${errors.join(', ')}`);
