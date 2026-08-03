import { composeV11Session } from '../js/engines/v11-session-composer.js';
const families=['INFO_SECME','BAGLAM_ANLAM','KANIT_BIRLESTIRME','METIN_AMACI','METIN_YAPISI','GUVENILIRLIK','CELISKI_KARSILASTIRMA','SENTEZ_COKLU'];
const rounds=families.map((family,i)=>({questionKey:`Q${i+1}`,prompt:`Q${i+1}`,skeletonId:`${family}_0${(i%5)+1}`,skeletonFamilyId:family,difficulty:Math.min(5,i+1),adaptivePlacement:i===2}));
const result=composeV11Session(rounds,{targetCount:8,remediationShare:.25,misconceptionInterventions:[{skeletonId:'KANIT_BIRLESTIRME_03'}]});
const errors=[];
if(result.audit.forbiddenViolationCount) errors.push('Yasaklı iskelet çifti bulundu.');
if(result.audit.remediationCount>result.audit.remediationLimit) errors.push('Telafi sınırı aşıldı.');
if(result.audit.familyCount<6) errors.push('Bilişsel aile çeşitliliği düşük.');
console.log(`V11 Session Composer Audit: ${result.audit.producedCount} tur • ${result.audit.familyCount} aile • ${result.audit.skeletonCount} iskelet • ${result.audit.remediationCount} telafi • ${errors.length} hata`);
if(errors.length){ errors.forEach(x=>console.error(`- ${x}`)); process.exit(1); }
