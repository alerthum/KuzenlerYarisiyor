import { hashString, seededRandom } from '../utils.js';
import { ASSESSMENT_V2_GAME_ADAPTATION_LAB } from './game-adaptation-lab.js';
import { defineStudentPilotResponse } from './student-pilot-contract.js';

export function assessmentV2PilotItemDescriptors(rows=ASSESSMENT_V2_GAME_ADAPTATION_LAB){
  return Object.freeze(rows.map(row=>Object.freeze({
    itemId:row.adapted.sourceQuestionId,
    gameId:row.adapted.gameId,
    itemFormat:'single-choice',
    correctOptionId:row.adapted.gamePayload.correctOptionId,
    optionIds:Object.freeze(row.adapted.gamePayload.options.map(option=>option.id))
  })));
}

export function buildSimulatedStudentPilotFixture({participantCount=120,pilotId='ASSESSMENT_V2_SIMULATION_001'}={}){
  const descriptors=assessmentV2PilotItemDescriptors();
  const itemDifficulty=[0.18,0.28,0.38,0.48,0.58];
  const rows=[];
  for(let participantIndex=0;participantIndex<participantCount;participantIndex+=1){
    const ability=(participantIndex+0.5)/participantCount;
    for(let itemIndex=0;itemIndex<descriptors.length;itemIndex+=1){
      const descriptor=descriptors[itemIndex];
      const random=seededRandom(hashString(`${pilotId}:${participantIndex}:${descriptor.itemId}`));
      const probability=Math.max(0.12,Math.min(0.96,0.34+0.72*ability-itemDifficulty[itemIndex]*0.32));
      const omitted=random()<0.025;
      const correct=!omitted&&random()<probability;
      const wrongOptions=descriptor.optionIds.filter(id=>id!==descriptor.correctOptionId);
      const selectedOptionId=omitted?null:(correct?descriptor.correctOptionId:wrongOptions[Math.floor(random()*wrongOptions.length)]);
      const responseTimeMs=Math.round(28000+itemIndex*5500+(1-ability)*22000+random()*9000);
      const startedAt=new Date(Date.UTC(2026,7,4,8,participantIndex%60,itemIndex)).toISOString();
      const submittedAt=new Date(Date.parse(startedAt)+responseTimeMs).toISOString();
      rows.push(defineStudentPilotResponse({
        responseId:`sim_${participantIndex}_${itemIndex}`,
        pilotId,
        datasetSource:'SIMULATED_FIXTURE',
        participantAnonId:`anon_sim_${String(participantIndex).padStart(4,'0')}`,
        itemId:descriptor.itemId,
        gameId:descriptor.gameId,
        grade:8,
        selectedOptionId,
        omitted,
        score:correct?1:0,
        maxScore:1,
        responseTimeMs,
        hintsUsed:random()<(0.35-ability*0.2)?1:0,
        attemptNumber:1,
        startedAt,
        submittedAt
      }));
    }
  }
  return Object.freeze({pilotId,datasetSource:'SIMULATED_FIXTURE',descriptors,rows:Object.freeze(rows)});
}
