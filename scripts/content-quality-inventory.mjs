import fs from 'node:fs';
import path from 'node:path';
import { GAME_CATALOG, createGameSession } from '../js/games/registry.js';

const grades=[2,4,6,8,10,12];
const rows=[];
for(const game of GAME_CATALOG){
  for(const grade of grades){
    const age=Math.max(game.minAge||7,Math.min(game.maxAge||99,grade+5));
    const profile={id:`inventory-${game.id}-${grade}`,grade,age,skills:{}};
    try{
      const session=createGameSession(game.id,profile,`inventory-${grade}`,{completedSessionCount:0});
      const e=session.globalQualityAudit?.enforcement||{};
      rows.push({gameId:game.id,title:game.title,category:game.category,grade,generated:(e.accepted||session.rounds.length)+(e.blocked||0),published:session.rounds.length,blocked:e.blocked||0,average:session.globalQualityAudit?.average||0,complete:Boolean(e.complete),reasons:(e.rejected||[]).reduce((a,x)=>(a[x.reason]=(a[x.reason]||0)+1,a),{})});
    }catch(error){
      const message=String(error.message||error);
      if(message.includes('seçili sınıf düzeyinde kullanılamaz')) rows.push({gameId:game.id,title:game.title,category:game.category,grade,skipped:true,skipReason:message});
      else rows.push({gameId:game.id,title:game.title,category:game.category,grade,error:message});
    }
  }
}
const categorySummary=Object.values(rows.reduce((acc,row)=>{ const key=row.category||'unknown'; const item=acc[key]||{category:key,samples:0,published:0,blocked:0,incomplete:0,errors:0,averageSum:0}; if(row.skipped){ acc[key]=item; return acc; } item.samples++; item.published+=Number(row.published||0); item.blocked+=Number(row.blocked||0); item.incomplete+=row.complete?0:1; item.errors+=row.error?1:0; item.averageSum+=Number(row.average||0); acc[key]=item; return acc; },{})).map(x=>({...x,average:Math.round(x.averageSum/Math.max(1,x.samples)),priorityScore:(x.errors*100)+(x.incomplete*20)+x.blocked})).sort((a,b)=>b.priorityScore-a.priorityScore);
const outDir=path.resolve('quality-reports'); fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(path.join(outDir,'content-quality-inventory-v10.json'),JSON.stringify({generatedAt:new Date().toISOString(),categorySummary,rows},null,2));
const md=['# Zihin Arenası V10 İçerik Kalite Envanteri','','| Oyun | Sınıf | Yayın | Bloke | Ortalama | Tam |','|---|---:|---:|---:|---:|:---:|'];
md.push('', '## Öncelik Sırası', '', '| Kategori | Örnek | Yayın | Bloke | Eksik | Ortalama | Öncelik |', '|---|---:|---:|---:|---:|---:|---:|');
for(const c of categorySummary)md.push(`| ${c.category} | ${c.samples} | ${c.published} | ${c.blocked} | ${c.incomplete} | ${c.average} | ${c.priorityScore} |`);
md.push('', '## Oyun / Sınıf Ayrıntısı', '');
for(const r of rows)md.push(`| ${r.title} | ${r.grade} | ${r.published??'-'} | ${r.blocked??'-'} | ${r.average??'-'} | ${r.skipped?'ATLANDI':r.error?'HATA':r.complete?'EVET':'HAYIR'} |`);
fs.writeFileSync(path.join(outDir,'CONTENT_QUALITY_INVENTORY_V10.md'),md.join('\n'));
console.log(`Kalite envanteri oluşturuldu: ${rows.length} oyun/sınıf örneği.`);
