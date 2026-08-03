import test from 'node:test';
import assert from 'node:assert/strict';
import { composeV11Session } from '../js/engines/v11-session-composer.js';

function r(id, family, difficulty=3, extra={}) {
  return { questionKey:id, prompt:id, skeletonId:id, skeletonFamilyId:family, difficulty, ...extra };
}

test('V11 besteci yasaklı iskeletleri aynı oturuma almaz', () => {
  const result = composeV11Session([
    r('INFO_SECME_01','INFO_SECME',1), r('INFO_SECME_02','INFO_SECME',1),
    r('BAGLAM_ANLAM_01','BAGLAM_ANLAM',2), r('METIN_YAPISI_02','METIN_YAPISI',3)
  ], { targetCount:3 });
  assert.equal(result.audit.forbiddenViolationCount, 0);
  assert.ok(!(result.rounds.some(x=>x.skeletonId==='INFO_SECME_01') && result.rounds.some(x=>x.skeletonId==='INFO_SECME_02')));
});

test('V11 besteci bilişsel aile çeşitliliğini korur', () => {
  const result = composeV11Session([
    r('INFO_SECME_01','INFO_SECME',1), r('INFO_SECME_04','INFO_SECME',1),
    r('BAGLAM_ANLAM_01','BAGLAM_ANLAM',2), r('METIN_YAPISI_02','METIN_YAPISI',3),
    r('GUVENILIRLIK_02','GUVENILIRLIK',4)
  ], { targetCount:4 });
  assert.ok(result.audit.familyCount >= 3);
  assert.equal(result.audit.balancedFamilies, true);
});

test('V11 besteci sessiz telafiyi yüzde 25 ile sınırlar', () => {
  const rounds = [
    r('KANIT_BIRLESTIRME_01','KANIT_BIRLESTIRME',3,{adaptivePlacement:true}),
    r('KANIT_BIRLESTIRME_03','KANIT_BIRLESTIRME',3,{adaptivePlacement:true}),
    r('INFO_SECME_04','INFO_SECME',1), r('BAGLAM_ANLAM_01','BAGLAM_ANLAM',2),
    r('METIN_YAPISI_02','METIN_YAPISI',3), r('GUVENILIRLIK_02','GUVENILIRLIK',4),
    r('CELISKI_KARSILASTIRMA_04','CELISKI_KARSILASTIRMA',4), r('SENTEZ_COKLU_02','SENTEZ_COKLU',5)
  ];
  const result = composeV11Session(rounds, { targetCount:8, remediationShare:0.25 });
  assert.ok(result.audit.remediationCount <= 2);
});

test('V11 besteci hedeflenen yanılgı iskeletini önceliklendirebilir', () => {
  const result = composeV11Session([
    r('KANIT_BIRLESTIRME_03','KANIT_BIRLESTIRME',3,{adaptivePlacement:true}),
    r('INFO_SECME_04','INFO_SECME',1), r('BAGLAM_ANLAM_01','BAGLAM_ANLAM',2), r('GUVENILIRLIK_02','GUVENILIRLIK',4)
  ], { targetCount:3, misconceptionInterventions:[{skeletonId:'KANIT_BIRLESTIRME_03'}] });
  assert.ok(result.rounds.some(x=>x.skeletonId==='KANIT_BIRLESTIRME_03'));
  assert.deepEqual(result.audit.targetedSkeletons, ['KANIT_BIRLESTIRME_03']);
});
