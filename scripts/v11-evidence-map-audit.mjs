import { createDynamicParagraphSession, paragraphFamilyStats } from '../js/engines/paragraph-engine-v4.js';

const profiles = [
  { id: 'v11-audit-g3', grade: 3, age: 8 },
  { id: 'v11-audit-g6', grade: 6, age: 11 },
  { id: 'v11-audit-g8', grade: 8, age: 13 },
  { id: 'v11-audit-g12', grade: 12, age: 17 }
];

const byFamily = new Map();
for (let cycle = 0; cycle < 50 && byFamily.size < paragraphFamilyStats().dynamicFamilies; cycle += 1) {
  for (const profile of profiles) {
    const rounds = createDynamicParagraphSession(profile, `v11-stage4-${cycle}-${profile.grade}`, 16);
    for (const round of rounds) byFamily.set(round.familyId, round);
  }
}

const errors = [];
for (const [familyId, round] of byFamily) {
  if (!round.evidenceMap?.evidenceUnits?.length) errors.push(`${familyId}: evidenceUnits yok`);
  if (!round.evidenceMap?.correctAnswerEvidenceIds?.length) errors.push(`${familyId}: doğru cevap kanıt bağı yok`);
  if (round.optionDiagnostics?.length !== 4) errors.push(`${familyId}: 4 seçenek tanısı yok`);
  if (round.optionDiagnostics?.filter(item => item.isCorrect).length !== 1) errors.push(`${familyId}: tek doğru seçenek tanısı yok`);
  if (round.misconceptionMap?.length !== 3) errors.push(`${familyId}: 3 yanılgı eşleştirmesi yok`);
  if (round.misconceptionMap?.some(item => !item.misconception || !item.misconceptionId)) errors.push(`${familyId}: eksik yanılgı kimliği`);
}

if (byFamily.size !== paragraphFamilyStats().dynamicFamilies) {
  errors.push(`Tüm aileler üretilemedi: ${byFamily.size}/${paragraphFamilyStats().dynamicFamilies}`);
}

if (errors.length) {
  console.error(`V11 Evidence Map Audit başarısız (${errors.length} hata):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`V11 Evidence Map Audit: ${byFamily.size} aile • ${byFamily.size * 4} seçenek tanısı • ${byFamily.size * 3} yanılgı eşleştirmesi • 0 hata`);
