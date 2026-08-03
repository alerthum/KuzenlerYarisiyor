import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canBuildWord,
  isOneLetterChange,
  normalizeTurkish,
  validateLadder,
  validateWordMine
} from '../js/engines/word-engine.js';

const dictionary = ['kale', 'kare', 'pare', 'bal', 'dal', 'dil'];

test('Türkçe küçük harf dönüşümü doğru çalışır', () => {
  assert.equal(normalizeTurkish('  İSTANBUL! '), 'istanbul');
  assert.equal(normalizeTurkish('IŞIK'), 'ışık');
});

test('kelime yalnızca ana kelimenin harflerinden kurulabilir', () => {
  assert.equal(canBuildWord('arkadaşlık', 'şarkı'), true);
  assert.equal(canBuildWord('arkadaşlık', 'kitap'), false);
  assert.equal(canBuildWord('masa', 'masal'), false);
});

test('kelime madeni tekrarı ve geçersiz harfi reddeder', () => {
  assert.equal(validateWordMine('arkadaşlık', 'şarkı', ['şarkı'], []).valid, true);
  assert.equal(validateWordMine('arkadaşlık', 'şarkı', ['şarkı'], ['şarkı']).valid, false);
  assert.equal(validateWordMine('arkadaşlık', 'kitap', ['kitap'], []).valid, false);
});

test('kelime merdiveninde tam bir harf değişir', () => {
  assert.equal(isOneLetterChange('KALE', 'KARE'), true);
  assert.equal(isOneLetterChange('KALE', 'PARE'), false);
  assert.equal(isOneLetterChange('BAL', 'DAL'), true);
});

test('kelime merdiveni zinciri doğrulanır', () => {
  assert.equal(validateLadder('KALE', ['KARE'], 'PARE', dictionary).valid, true);
  assert.equal(validateLadder('KALE', ['PARE'], 'PARE', dictionary).valid, false);
});
