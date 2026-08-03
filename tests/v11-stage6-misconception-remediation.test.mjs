import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameSession } from '../js/games/registry.js';
import {
  attachV11SilentRemediation,
  buildV11MisconceptionInterventions,
  microLessonForV11Misconception
} from '../js/engines/v11-misconception-remediation.js';

const repeatedAttempts = [
  { correct:false, questionKey:'q1', skeletonId:'KANIT_BIRLESTIRME_02', skeletonFamilyId:'KANIT_BIRLESTIRME', misconceptionId:'KANIT_BIRLESTIRME_02_M2', misconception:'Kanıtları ilişkisiz değerlendirme', createdAt:'2026-07-28T10:00:00Z' },
  { correct:false, questionKey:'q2', skeletonId:'KANIT_BIRLESTIRME_02', skeletonFamilyId:'KANIT_BIRLESTIRME', misconceptionId:'KANIT_BIRLESTIRME_02_M2', misconception:'Kanıtları ilişkisiz değerlendirme', createdAt:'2026-07-29T10:00:00Z' }
];

test('tekrar eden yanılgı hedefli müdahaleye dönüşür; tek hata dönüşmez', () => {
  const plan = buildV11MisconceptionInterventions(repeatedAttempts);
  assert.equal(plan.length, 1);
  assert.equal(plan[0].misconceptionId, 'KANIT_BIRLESTIRME_02_M2');
  assert.equal(buildV11MisconceptionInterventions(repeatedAttempts.slice(0, 1)).length, 0);
});

test('yanılgı mikro öğretimi kısa strateji, örnek ve dikkat noktası taşır', () => {
  const intervention = buildV11MisconceptionInterventions(repeatedAttempts)[0];
  const lesson = microLessonForV11Misconception(intervention);
  assert.equal(lesson.type, 'V11_MISCONCEPTION_MICRO_TEACHING');
  assert.ok(lesson.strategy.length > 30);
  assert.ok(lesson.example.length > 20);
  assert.ok(lesson.caution.length > 20);
  assert.ok(lesson.durationMinutes <= 4);
});

test('sessiz telafi yalnız hedef iskelete bağlanır ve oturumun yüzde 25ini aşmaz', () => {
  const rounds = [
    { questionKey:'r1', skeletonId:'KANIT_BIRLESTIRME_02' },
    { questionKey:'r2', skeletonId:'KANIT_BIRLESTIRME_02' },
    { questionKey:'r3', skeletonId:'INFO_SECME_01' },
    { questionKey:'r4', skeletonId:'METIN_YAPISI_01' },
    { questionKey:'r5', skeletonId:'GUVENILIRLIK_01' },
    { questionKey:'r6', skeletonId:'CELISKI_KARSILASTIRMA_01' },
    { questionKey:'r7', skeletonId:'NEDEN_SONUC_01' },
    { questionKey:'r8', skeletonId:'SENTEZ_DEGERLENDIRME_01' }
  ];
  const result = attachV11SilentRemediation(rounds, repeatedAttempts);
  const attached = result.rounds.filter((round) => round.adaptiveReason === 'V11_REPEATED_MISCONCEPTION');
  assert.equal(attached.length, 1);
  assert.ok(attached.length <= Math.floor(rounds.length * 0.25));
  assert.equal(attached[0].skeletonId, 'KANIT_BIRLESTIRME_02');
  assert.equal(attached[0].microLesson.misconceptionId, 'KANIT_BIRLESTIRME_02_M2');
});

test('gerçek paragraf oturumu tekrar eden yanılgıya göre sessiz telafi denetimi taşır', () => {
  const profile = { id:'p-stage6', name:'Öğrenci', age:13, grade:8, skills:{ reading:50, verbalLogic:50 } };
  const base = createGameSession('paragraph-detective', profile, 1606, { seenQuestionKeys:new Set(), attempts:[] });
  const targetRound = base.rounds.find((round) => round.skeletonId);
  assert.ok(targetRound);
  const attempts = [
    { ...repeatedAttempts[0], skeletonId:targetRound.skeletonId, skeletonFamilyId:targetRound.skeletonFamilyId, misconceptionId:`${targetRound.skeletonId}_M1` },
    { ...repeatedAttempts[1], skeletonId:targetRound.skeletonId, skeletonFamilyId:targetRound.skeletonFamilyId, misconceptionId:`${targetRound.skeletonId}_M1` }
  ];
  const adapted = createGameSession('paragraph-detective', profile, 1606, { seenQuestionKeys:new Set(), attempts });
  const audit = adapted.globalQualityAudit.v11MisconceptionRemediation;
  assert.equal(audit.enabled, true);
  assert.ok(audit.attachedRoundCount <= Math.max(1, Math.floor(adapted.rounds.length * 0.25)));
  const remediated = adapted.rounds.filter((round) => round.v11Remediation);
  assert.ok(remediated.length >= 1);
  assert.ok(remediated.every((round) => round.microLesson?.type === 'V11_MISCONCEPTION_MICRO_TEACHING'));
});
