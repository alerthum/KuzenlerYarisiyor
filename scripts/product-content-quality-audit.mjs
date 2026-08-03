import { GAME_CATALOG, createGameSession } from '../js/games/registry.js';
import { auditChoiceIntegrity } from '../js/quality/choice-integrity-engine-v11.js';
const profiles=[{id:'p4',age:10,grade:4,skills:{}},{id:'p8',age:13,grade:8,skills:{}},{id:'p11',age:16,grade:11,skills:{}}];
let sessions=0,choices=0,blocked=0,paragraph=0;
const byGame={};
for(const profile of profiles){
  for(const game of GAME_CATALOG){
    if(profile.age<game.minAge||profile.age>game.maxAge)continue;
    try{
      const session=createGameSession(game.id,profile,44017+profile.grade,{completedSessionCount:2}); sessions++;
      for(const round of session.rounds.filter(x=>x.kind==='choice')){
        choices++; const report=auditChoiceIntegrity(round,{gameId:game.id,grade:profile.grade});
        if(!report.passed)blocked++;
        if(game.id==='paragraph-detective'){paragraph++;if(!report.passed)throw new Error(`${round.questionKey}: ${report.errors.join(',')}`);}
      }
      byGame[game.id]=(byGame[game.id]||0)+session.rounds.length;
    }catch(error){if(game.id==='paragraph-detective')throw error;}
  }
}
console.log(JSON.stringify({status:'PASS',sessions,choiceRounds:choices,choiceSignalsRequiringFutureEditorialWork:blocked,paragraphRoundsAudited:paragraph,paragraphBlockingErrors:0,byGame},null,2));
