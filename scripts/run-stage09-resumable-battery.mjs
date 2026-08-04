import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { STAGE09_ACTIVE_GAMES } from '../js/quality/session-composer-audit.js';

const sessionsPerGame=Number(process.argv[2]||500);
const concurrency=Math.max(1,Number(process.argv[3]||2));
const timeoutMs=Math.max(120_000,Number(process.argv[4]||900_000));
const root=path.resolve('quality-reports/stage09-resumable',String(sessionsPerGame));
fs.mkdirSync(root,{recursive:true});
const worker=path.resolve('scripts/stage09-game-battery-worker.mjs');
const finalFile=path.resolve('quality-reports',`stage09-live-platform-resumable-${sessionsPerGame}.json`);

function validCached(gameId){
  const file=path.join(root,`${gameId}.json`);
  if(!fs.existsSync(file))return null;
  try{
    const row=JSON.parse(fs.readFileSync(file,'utf8'));
    return row.gameId===gameId&&row.targetSessions===sessionsPerGame&&row.produced===sessionsPerGame?row:null;
  }catch{return null;}
}

function runOne(gameId){
  const cached=validCached(gameId);
  if(cached){console.log(`[cached] ${gameId}`);return Promise.resolve(cached);}
  return new Promise(resolve=>{
    const startedAt=Date.now();
    const child=spawn(process.execPath,[worker,gameId,String(sessionsPerGame)],{cwd:process.cwd(),stdio:['ignore','pipe','pipe']});
    let stdout='',stderr='',settled=false;
    const timer=setTimeout(()=>{if(!settled){child.kill('SIGKILL');settled=true;resolve({gameId,produced:0,targetSessions:sessionsPerGame,underfill:sessionsPerGame,semanticRepeats:0,ok:false,infrastructureError:`timeout:${timeoutMs}`,durationMs:Date.now()-startedAt});}},timeoutMs);
    child.stdout.on('data',chunk=>stdout+=chunk);
    child.stderr.on('data',chunk=>stderr+=chunk);
    child.on('close',code=>{
      if(settled)return;settled=true;clearTimeout(timer);
      let row;
      try{row=JSON.parse(stdout.trim()||'{}');}catch(error){row={gameId,produced:0,targetSessions:sessionsPerGame,underfill:sessionsPerGame,semanticRepeats:0,ok:false,infrastructureError:`worker-json:${error.message}`,stderr:stderr.slice(0,2000)};}
      if(code!==0&&row.ok!==false)row={...row,ok:false,infrastructureError:`worker-exit:${code}`,stderr:stderr.slice(0,2000)};
      row={...row,durationMs:row.durationMs??Date.now()-startedAt};
      fs.writeFileSync(path.join(root,`${gameId}.json`),JSON.stringify(row,null,2));
      console.log(`[done] ${gameId} ok=${row.ok} produced=${row.produced}/${sessionsPerGame} underfill=${row.underfill} repeats=${row.semanticRepeats} ms=${row.durationMs}`);
      resolve(row);
    });
  });
}

async function pool(ids){
  const results=[];let cursor=0;
  async function lane(){while(cursor<ids.length){const id=ids[cursor++];results.push(await runOne(id));}}
  await Promise.all(Array.from({length:Math.min(concurrency,ids.length)},()=>lane()));
  return STAGE09_ACTIVE_GAMES.map(id=>results.find(row=>row.gameId===id));
}

const startedAt=Date.now();
const results=await pool(STAGE09_ACTIVE_GAMES);
const underfill=results.reduce((sum,row)=>sum+Number(row?.underfill||0),0);
const semanticRepeats=results.reduce((sum,row)=>sum+Number(row?.semanticRepeats||0),0);
const failedGames=results.filter(row=>!row?.ok).map(row=>row?.gameId||'UNKNOWN');
const report={schemaVersion:'2.0',executionMode:'RESUMABLE_ASYNC_PROCESS_PER_GAME',sessionsPerGame,gameCount:STAGE09_ACTIVE_GAMES.length,totalSessions:sessionsPerGame*STAGE09_ACTIVE_GAMES.length,durationMs:Date.now()-startedAt,concurrency,timeoutMsPerGame:timeoutMs,results,underfill,semanticRepeats,failedGames,allGamesOnSharedComposer:true,meetsStageGate:underfill===0&&semanticRepeats===0&&failedGames.length===0,generatedAt:new Date().toISOString(),productReady:false};
fs.writeFileSync(finalFile,JSON.stringify(report,null,2));
console.log(JSON.stringify({status:report.meetsStageGate?'PASS':'RED',sessionsPerGame,gameCount:report.gameCount,totalSessions:report.totalSessions,underfill,semanticRepeats,failedGames,durationMs:report.durationMs,file:finalFile},null,2));
if(!report.meetsStageGate)process.exitCode=1;
