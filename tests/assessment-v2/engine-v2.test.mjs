import test from 'node:test';
import assert from 'node:assert/strict';
import { materializeItemModel } from '../../js/assessment-v2/materialize.js';
import { evaluateV2Publication } from '../../js/assessment-v2/publication-gate.js';
import { pigeonholeModel, readingEvidenceModel, logicConstraintModel } from '../../js/assessment-v2/pilots.js';

test('matematik modeli doğru cevabı alan çözücüsüyle hesaplar ve üç gerçek hata yolu üretir', () => {
  const item = materializeItemModel(pigeonholeModel, { categories: 6, target: 5 });
  assert.equal(item.answer, 25);
  assert.deepEqual(item.distractors.map(d => d.value), [21, 24, 30]);
  assert.equal(new Set(item.distractors.map(d => d.misconceptionId)).size, 3);
  assert.equal(evaluateV2Publication(item, { gameId: 'olympiad-ladder' }).ok, true);
});

test('aynı item modelin yüzey varyantları aynı bilişsel kimliği korur', () => {
  const a = materializeItemModel(pigeonholeModel, { categories: 6, target: 5 });
  const b = materializeItemModel(pigeonholeModel, { categories: 7, target: 5 });
  assert.equal(a.structuralId, b.structuralId);
  assert.equal(a.cognitiveExperienceId, b.cognitiveExperienceId);
  assert.notEqual(a.surfaceFingerprint, b.surfaceFingerprint);
  assert.equal(evaluateV2Publication(b, { gameId: 'olympiad-ladder', previousItems: [a] }).errors.includes('cognitive_repeat'), true);
});

test('okuma modeli kanıtı aşmayan sonucu ve üç ayrı yorum hatasını üretir', () => {
  const item = materializeItemModel(readingEvidenceModel);
  assert.match(item.answerText, /ilişkili olabilir/);
  assert.equal(evaluateV2Publication(item, { gameId: 'paragraph-detective' }).ok, true);
  assert.equal(evaluateV2Publication(item, { gameId: 'science-lab' }).errors.includes('game_construct_mismatch'), true);
});

test('sözel mantık modeli tablo temsilini ve zorunluluk kanıtını taşır', () => {
  const item = materializeItemModel(logicConstraintModel);
  assert.equal(item.interactionType, 'table-choice');
  assert.equal(item.answerText, 'A, C’den önce olmak zorundadır.');
  assert.equal(evaluateV2Publication(item, { gameId: 'logic-station' }).ok, true);
});

test('bilinen yapay kalıp ve genel ipucu V2 yayın kapısında reddedilir', () => {
  const base = materializeItemModel(pigeonholeModel);
  const corrupted = { ...base, prompt: `Olimpiyat kulübünde çözülen bir soru: ${base.prompt}`, hints: ['Soruyu küçük bir örnekle dene.', ...base.hints.slice(1)] };
  const verdict = evaluateV2Publication(corrupted, { gameId: 'olympiad-ladder' });
  assert.equal(verdict.ok, false);
  assert.ok(verdict.errors.includes('artificial_wrapper'));
  assert.ok(verdict.errors.includes('generic_hint'));
});
