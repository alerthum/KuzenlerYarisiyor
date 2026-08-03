import { buildV11MisconceptionDevelopmentReport, buildV11MisconceptionNarrative } from '../js/engines/v11-misconception-report.js';

const attempts = [
  ['a1','KANIT_BIRLESTIRME_02_M2','Kanıtları ilişkisiz değerlendirme','KANIT_BIRLESTIRME_02'],
  ['a2','KANIT_BIRLESTIRME_02_M2','Kanıtları ilişkisiz değerlendirme','KANIT_BIRLESTIRME_02'],
  ['a3','NEDEN_SONUC_01_M1','Neden-sonuç yönünü ters kurma','NEDEN_SONUC_01']
].map(([id,misconceptionId,misconception,skeletonId],index)=>({
  id, correct:false, diagnosticStatus:'MISCONCEPTION_CAPTURED', misconceptionId, misconception,
  skeletonId, skeletonFamilyId:skeletonId.split('_').slice(0,-1).join('_'),
  answeredAt:new Date(2026,6,index+1).toISOString()
}));
const report=buildV11MisconceptionDevelopmentReport(attempts,{windowSize:4});
const narrative=buildV11MisconceptionNarrative(report,'teacher');
const errors=[];
if(report.diagnosedErrorCount!==3) errors.push('Tanılanmış hata sayısı yanlış.');
if(report.activeSupportCount<1) errors.push('Tekrar eden yanılgı destek alanına dönüşmedi.');
if(!narrative.headline) errors.push('Rapor anlatımı üretilemedi.');
console.log(`V11 Misconception Report Audit: ${report.diagnosedErrorCount} hata • ${report.distinctMisconceptionCount} yanılgı • ${report.activeSupportCount} aktif destek • ${errors.length} hata`);
if(errors.length){ for(const error of errors) console.error(`- ${error}`); process.exitCode=1; }
