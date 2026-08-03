import { createGameSession } from '../js/games/registry.js';
import { buildV11MisconceptionInterventions } from '../js/engines/v11-misconception-remediation.js';

const profile = { id:'audit-stage6', name:'Denetim', age:13, grade:8, skills:{ reading:55, verbalLogic:55 } };
const base = createGameSession('paragraph-detective', profile, 11606, { seenQuestionKeys:new Set(), attempts:[] });
const target = base.rounds.find((round) => round.skeletonId);
if (!target) throw new Error('V11 iskeletli paragraf turu bulunamadı.');
const attempts = [1,2,3].map((n) => ({
  correct:false,
  questionKey:`audit-${n}`,
  skeletonId:target.skeletonId,
  skeletonFamilyId:target.skeletonFamilyId,
  misconceptionId:`${target.skeletonId}_M1`,
  misconception:'Denetim için tekrar eden yanılgı',
  createdAt:`2026-07-${20+n}T10:00:00Z`
}));
const interventions = buildV11MisconceptionInterventions(attempts);
const session = createGameSession('paragraph-detective', profile, 11606, { seenQuestionKeys:new Set(), attempts });
const audit = session.globalQualityAudit?.v11MisconceptionRemediation;
const errors = [];
if (interventions.length !== 1) errors.push('Tekrar eden yanılgı müdahaleye dönüşmedi.');
if (!audit?.enabled) errors.push('Gerçek oturum telafi denetimini etkinleştirmedi.');
if (audit?.attachedRoundCount > Math.max(1, Math.floor(session.rounds.length * 0.25))) errors.push('Telafi oranı %25 sınırını aştı.');
const attached = session.rounds.filter((round) => round.v11Remediation);
if (!attached.length) errors.push('Gerçek oturuma hedefli telafi turu bağlanmadı.');
if (attached.some((round) => !round.microLesson?.strategy || !round.microLesson?.caution)) errors.push('Mikro öğretim alanları eksik.');
console.log(`V11 Misconception Remediation Audit: ${interventions.length} müdahale • ${attached.length} telafi turu • ${errors.length} hata`);
if (errors.length) {
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
