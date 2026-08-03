import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameSession } from '../js/games/registry.js';
import { createInitialState, recordAttempt } from '../js/state.js';
import { diagnoseV11ChoiceResponse, getV11MisconceptionProfile } from '../js/engines/v11-misconception-profile.js';

test('Paragraf Dedektifi turu V11 tanı metadata alanlarını oturuma taşır', () => {
  const profile = { id:'p-v11', name:'Öğrenci', age:13, grade:8, skills:{ reading:50, verbalLogic:50 } };
  const session = createGameSession('paragraph-detective', profile, 1105, { seenQuestionKeys:new Set() });
  const round = session.rounds.find(item => item.skeletonId && Array.isArray(item.optionDiagnostics));
  assert.ok(round, 'V11 kimlikli paragraf turu bulunamadı.');
  assert.equal(round.optionDiagnostics.length, 4);
  assert.ok(round.evidenceMap?.correctAnswerEvidenceIds?.length >= 1);
});

test('yanlış seçenek seçimi gerçek yanılgı kimliğine dönüştürülür', () => {
  const round = {
    skeletonId:'KANIT_BIRLESTIRME_02',
    skeletonFamilyId:'KANIT_BIRLESTIRME',
    options:['Doğru','Yanlış A','Yanlış B','Yanlış C'],
    optionDiagnostics:[
      { optionIndex:0, optionText:'Doğru', isCorrect:true, misconceptionId:null, misconception:null },
      { optionIndex:1, optionText:'Yanlış A', isCorrect:false, misconceptionId:'KANIT_BIRLESTIRME_02_M1', misconception:'Tek kanıta odaklanma' },
      { optionIndex:2, optionText:'Yanlış B', isCorrect:false, misconceptionId:'KANIT_BIRLESTIRME_02_M2', misconception:'Kanıtları ilişkisiz değerlendirme' },
      { optionIndex:3, optionText:'Yanlış C', isCorrect:false, misconceptionId:'KANIT_BIRLESTIRME_02_M3', misconception:'Metin dışına çıkma' }
    ]
  };
  const diagnosis = diagnoseV11ChoiceResponse(round, 1, false);
  assert.equal(diagnosis.responseStatus, 'INCORRECT');
  assert.equal(diagnosis.misconceptionId, 'KANIT_BIRLESTIRME_02_M1');
  assert.equal(diagnosis.diagnosticStatus, 'MISCONCEPTION_CAPTURED');
});

test('recordAttempt yanılgıyı hem cevap kaydına hem öğrenci profiline kalıcı işler', () => {
  const state = createInitialState(null);
  const profileId = state.profiles[0].id;
  const payload = {
    profileId,
    gameId:'paragraph-detective',
    questionKey:'paragraph:test-v11',
    familyId:'distributed-evidence-dynamic',
    questionFamilyId:'distributed-evidence-dynamic',
    skill:'reading',
    correct:false,
    difficulty:4,
    hintsUsed:1,
    elapsedSeconds:70,
    skeletonId:'KANIT_BIRLESTIRME_02',
    skeletonFamilyId:'KANIT_BIRLESTIRME',
    selectedOptionIndex:2,
    selectedOptionText:'Yalnız ikinci ayrıntı yeterlidir.',
    responseStatus:'INCORRECT',
    diagnosticStatus:'MISCONCEPTION_CAPTURED',
    misconceptionId:'KANIT_BIRLESTIRME_02_M2',
    misconception:'Kanıtları ilişkisiz değerlendirme'
  };

  const first = recordAttempt(state, payload);
  const second = recordAttempt(state, { ...payload, questionKey:'paragraph:test-v11-2' });
  assert.equal(first.attempt.misconceptionId, payload.misconceptionId);
  assert.equal(second.attempt.skeletonId, payload.skeletonId);

  const profile = getV11MisconceptionProfile(state, profileId);
  assert.equal(profile.totalDiagnosedErrors, 2);
  assert.equal(profile.byMisconception[payload.misconceptionId].count, 2);
  assert.equal(profile.bySkeleton[payload.skeletonId].errorCount, 2);
  assert.deepEqual(profile.byMisconception[payload.misconceptionId].questionFamilyIds, ['distributed-evidence-dynamic']);
});

test('doğru cevap ve süre aşımı yanlış yanılgı kaydı üretmez', () => {
  const round = {
    skeletonId:'INFO_SECME_01',
    options:['Doğru','Yanlış'],
    optionDiagnostics:[
      { optionIndex:0, optionText:'Doğru', isCorrect:true },
      { optionIndex:1, optionText:'Yanlış', isCorrect:false, misconceptionId:'INFO_SECME_01_M1', misconception:'Ayrıntı sapması' }
    ]
  };
  assert.equal(diagnoseV11ChoiceResponse(round, 0, false).misconceptionId, null);
  assert.equal(diagnoseV11ChoiceResponse(round, null, true).diagnosticStatus, 'NO_RESPONSE_DIAGNOSIS');
});
