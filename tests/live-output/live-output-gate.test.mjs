import test from 'node:test';
import assert from 'node:assert/strict';
import { auditLiveOutputRound, normalizeTrustedLiveRound } from '../../js/quality/live-output-gate.js';

function validRound(overrides = {}) {
  return {
    kind: 'choice',
    questionKey: 'test:valid:1',
    prompt: 'Bütün koşullara göre kesinlikle doğru olan seçenek hangisidir?',
    context: 'A, B’den önce; C ise B’den hemen sonra yer almaktadır. D son sırada değildir.',
    options: ['A – B – C – D', 'D – A – B – C', 'A – D – B – C', 'B – C – A – D'],
    answerIndex: 2,
    explanation: 'A, B’den önce gelir; C B’nin hemen sonundadır ve D son sırada değildir. Yalnız üçüncü seçenek üç koşulu birlikte sağlar.',
    hints: ['Her koşulu ayrı bir tablo satırına dönüştür ve birlikte uygula.', 'Seçenekleri tek tek deneyip ilk çelişki oluşan seçeneği ele.'],
    reasoningStepCount: 3,
    ...overrides
  };
}

test('son ekran kapısı anlamlı choice turunu kabul eder', () => {
  const audit = auditLiveOutputRound(validRound(), { gameId: 'logic-station', grade: 8 });
  assert.equal(audit.ok, true);
  assert.deepEqual(audit.errors, []);
});

test('yasak kalıp, kod seçenek, tekrar seçenek ve genel ipucu kritik hatadır', () => {
  const audit = auditLiveOutputRound(validRound({
    prompt: 'Sınıfta çözülen bir mantık sorusu: Hangisi doğrudur?',
    options: ['WA', 'WB', 'WB', 'WD'],
    hints: ['Koşulları ve kanıtları tek tek ayır.', 'Her seçeneği bütün koşullara göre yeniden kontrol et.']
  }), { gameId: 'logic-station', grade: 8 });
  assert.equal(audit.ok, false);
  assert.ok(audit.errors.includes('FORBIDDEN_SURFACE_PATTERN'));
  assert.ok(audit.errors.includes('CONTEXT_FREE_CODE_OPTION'));
  assert.ok(audit.errors.includes('DUPLICATE_OPTIONS'));
  assert.ok(audit.errors.includes('GENERIC_HINT'));
});

test('matematiksel artı ve eksi işaretleri seçenek farklılığında korunur', () => {
  const audit = auditLiveOutputRound(validRound({
    questionKey: 'math:operators',
    context: 'Bir depoda 180 litre su vardır ve her dakika 3 litre su eksilmektedir.',
    prompt: 'Kalan suyu doğru modelleyen denklem hangisidir?',
    options: ['V = 180 + 3t', 'V = 180 − 3t', 'V = 3t − 180', 'V = 180 − t/3'],
    answerIndex: 1,
    explanation: 'Her dakika üç litre azalma olduğu için başlangıç miktarından 3t çıkarılır ve V = 180 − 3t modeli elde edilir.'
  }), { gameId: 'problem-hunter', grade: 8 });
  assert.equal(audit.ok, true, audit.errors.join(','));
});

test('5. sınıf İngilizce boşluk sorusu tek ve anlaşılır öğrenme biçimine dönüştürülür', () => {
  const round = normalizeTrustedLiveRound({
    kind: 'choice', questionKey: 'en:g5:test',
    prompt: 'Rangers ___ the turtles.',
    context: 'Rangers keep visitors away from turtle nests and stop people from touching the eggs.',
    options: ['protect', 'follow', 'invite', 'collect'], answerIndex: 0,
    explanation: 'The actions keep the turtles safe.', reasoningStepCount: 2
  }, { gameId: 'english-vocabulary', grade: 5 });
  assert.equal(round.prompt, 'Bağlama göre boşluğu doğru tamamlayan İngilizce kelime hangisidir?');
  assert.match(round.context, /Rangers ___ the turtles\./);
  assert.match(round.explanation, /Doğru cümle: “Rangers protect the turtles\.”/);
  assert.equal(auditLiveOutputRound(round, { gameId: 'english-vocabulary', grade: 5 }).ok, true);
});
