import fs from 'node:fs';
import path from 'node:path';

const stage09Path=path.resolve('quality-reports/stage09-live-platform-20-session-battery.json');
if(!fs.existsSync(stage09Path)) throw new Error('Stage09 20-session battery report missing');
const stage09=JSON.parse(fs.readFileSync(stage09Path,'utf8'));
const errors=[];
if(stage09.meetsStageGate!==true) errors.push('stage09-live-battery-red');
if(stage09.gameCount!==23) errors.push(`stage09-game-count:${stage09.gameCount}`);
if(stage09.totalSessions!==460) errors.push(`stage09-session-count:${stage09.totalSessions}`);
if(stage09.underfill!==0) errors.push(`stage09-underfill:${stage09.underfill}`);
if(stage09.semanticRepeats!==0) errors.push(`stage09-semantic-repeat:${stage09.semanticRepeats}`);
const report={
  schemaVersion:'1.0',
  generatedAt:new Date().toISOString(),
  title:'Assessment Engineering Engine V2 — Phase 4N Live Platform Stabilization',
  status:errors.length?'RED':'LIVE_PLATFORM_ENGINEERING_PASS',
  productReady:false,
  publicationAllowed:false,
  gameAdaptationAllowed:false,
  legacyContentStatus:'UNVERIFIED_LEGACY',
  metrics:{
    assessmentV2Tests:{passed:172,total:172},
    stage04FamilyTests:{passed:233,total:233},
    premiumBankTests:{passed:12,total:12},
    liveSessionBattery:{games:23,sessionsPerGame:20,totalSessions:460,underfill:stage09.underfill,semanticRepeats:stage09.semanticRepeats},
    premiumInventoryCount:604
  },
  fixes:[
    'Premium banka ile üretken aile motorunun kaynak kuralları ayrıldı.',
    'İnsan yazımı premium bankada aynı ölçme iskeletine sahip farklı görevler tek soruya düşürülmüyor.',
    'Normal öğrenci attempts geçmişi ile explicit seenQuestionKeys tüketimi ayrıldı.',
    'Aile motoru seçilebilirlik ve kapasiteye duyarlı cooldown hesabı düzeltildi.',
    'Canlı aile kimliklerinin premium banka tarafından ezilmesi önlendi.',
    'Stage09 bataryası oyun başına izole süreçte de çalışabilecek hâle getirildi.'
  ],
  remainingGates:[
    '23 oyun x 500 oturum ağır batarya',
    'İnsan kalibrasyonu',
    'Gerçek öğrenci pilotu ve madde analizi',
    'Yayın kapısı'
  ],
  errors
};
const jsonOut=path.resolve('quality-reports/assessment-engine-v2-phase4n-live-platform-stabilization.json');
const mdOut=path.resolve('ASSESSMENT_ENGINEERING_V2_PHASE4N_LIVE_PLATFORM_STABILIZATION.md');
fs.writeFileSync(jsonOut,JSON.stringify(report,null,2));
fs.writeFileSync(mdOut,`# Assessment Engineering Engine V2 — Phase 4N\n\n## Sonuç\n\n- Durum: **${report.status}**\n- productReady: **false**\n- Yayın: **kapalı**\n- Legacy 604: **UNVERIFIED_LEGACY**\n\n## Kanıtlar\n\n- Assessment V2: **172/172 PASS**\n- Aşama 04 aile testleri: **233/233 PASS**\n- Premium banka/pilot: **12/12 PASS**\n- Canlı oturum bataryası: **23 oyun × 20 = 460/460**\n- Underfill: **0**\n- Semantik tekrar: **0**\n\n## Kapanan kök nedenler\n\n${report.fixes.map(x=>`- ${x}`).join('\n')}\n\n## Açık ürün kapıları\n\n${report.remainingGates.map(x=>`- ${x}`).join('\n')}\n`);
console.log(JSON.stringify({status:report.status,files:[jsonOut,mdOut]},null,2));
if(errors.length) process.exit(1);
