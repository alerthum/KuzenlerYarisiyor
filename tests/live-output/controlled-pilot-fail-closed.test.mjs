import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameSession } from '../../js/games/registry.js';
import { controlledLiveBetaPolicySummary } from '../../js/assessment-v2/controlled-live-beta-bank.js';
import { auditLiveOutputRound } from '../../js/quality/live-output-gate.js';

const BAD_PATTERNS = [
  /Olimpiyat kulübünde çözülen bir soru:/i,
  /Sınıfta çözülen bir mantık sorusu:/i,
  /Senaryodaki sayıları ayıkla; genel kuralı bul\./i,
  /Hedef kelimenin düşünme türünü ayır/i,
  /English word lab review:/i,
  /Which choice is the violation\?/i,
  /Which world matches synonym meaning\?/i,
  /(?:^|\s)(?:WA|WB|WC|WD)(?:\s|$)/
];

const GENERIC_HINTS = [
  'Koşulları ve kanıtları tek tek ayır.',
  'Her seçeneği bütün koşullara göre yeniden kontrol et.',
  'Metindeki/verideki kanıtları sırayla ayır.',
  'Her seçeneği aynı ölçüte göre kontrol et.'
];

const profile = (grade, suffix = '') => ({
  id: `live-output-g${grade}${suffix}`,
  name: 'Canlı Çıktı Testi',
  age: grade + 6,
  grade,
  level: 10,
  skills: {}
});

const safeCells = controlledLiveBetaPolicySummary().cells.map((cell) => {
  const separator = cell.cellId.lastIndexOf(':');
  return [
    cell.cellId.slice(0, separator),
    Number(cell.cellId.slice(separator + 1)),
    cell.approvedQuestionCount,
    cell.status
  ];
});

function buildSession(gameId, grade, seed = 2026080601, seenQuestionKeys = new Set()) {
  return createGameSession(gameId, profile(grade), seed, {
    controlledLaunchPilot: true,
    completedSessionCount: 1,
    seenQuestionKeys,
    attempts: []
  });
}

test('güvenli pilot yalnız açık whitelist sorularını teslim eder', () => {
  assert.equal(controlledLiveBetaPolicySummary().cells.length, safeCells.length);
  for (const [gameId, grade, expectedCount, policyStatus] of safeCells) {
    const session = buildSession(gameId, grade);
    assert.ok(session.rounds.length > 0, `${gameId}/g${grade}: ilk oturum boş`);
    assert.ok(session.rounds.length <= expectedCount, `${gameId}/g${grade}: whitelist üstü teslim`);
    assert.equal(session.globalQualityAudit?.controlledLiveBeta?.policyStatus, policyStatus);
    assert.equal(session.globalQualityAudit?.controlledLiveBeta?.deliveredCount, session.rounds.length);
    assert.equal(session.globalQualityAudit?.premiumBank?.fallbackToLegacy, false);

    const keys = new Set();
    for (const round of session.rounds) {
      assert.equal(round.controlledLaunchPilot, true, `${gameId}/g${grade}: doğrulanmamış tur`);
      assert.equal(round.publicationStatus, 'CONTROLLED_BETA_SURFACE_APPROVED');
      assert.equal(round.liveOutputReviewedSurface, true);
      assert.equal(round.liveOutputAudit?.ok, true);
      assert.equal(keys.has(round.questionKey), false, `${gameId}/g${grade}: tekrar questionKey`);
      keys.add(round.questionKey);

      const visibleText = [round.prompt, round.context, ...(round.options || []), ...(round.hints || [])]
        .filter(Boolean)
        .join(' ');
      for (const pattern of BAD_PATTERNS) {
        assert.doesNotMatch(visibleText, pattern, `${gameId}/g${grade}: yasak canlı kalıp`);
      }
      for (const hint of round.hints || []) {
        assert.equal(GENERIC_HINTS.includes(hint), false, `${gameId}/g${grade}: genel-geçer ipucu`);
      }
      const independentAudit = auditLiveOutputRound(round, { gameId, grade });
      assert.equal(independentAudit.ok, true, `${gameId}/g${grade}:${round.questionKey}:${independentAudit.errors.join(',')}`);
    }
  }
});

test("5. sınıf İngilizce whitelist sayısı ürün adıyla tutarlı olarak tam 20’dir", () => {
  const policy = controlledLiveBetaPolicySummary().cells.find((cell) => cell.cellId === 'english-vocabulary:5');
  assert.ok(policy);
  assert.equal(policy.approvedQuestionCount, 20);
});

test('Günün 20 İngilizce Kelimesi 5–8. sınıflarda gerçekten 20 temiz soru üretir', () => {
  for (const grade of [5, 6, 7, 8]) {
    const session = buildSession('english-vocabulary', grade, 2026080611 + grade);
    assert.equal(session.rounds.length, 20);
    for (const round of session.rounds) {
      assert.match(round.prompt, /[?？]$/);
      assert.ok(round.context.length >= 35);
      assert.equal(round.options.length, 4);
      assert.ok(round.explanation.length >= 24);
      assert.ok(round.hints.every((hint) => hint.length >= 25));
      if (grade === 5) {
        assert.equal(round.prompt, 'Bağlama göre boşluğu doğru tamamlayan İngilizce kelime hangisidir?');
        assert.match(round.context, /___/);
        assert.match(round.explanation, /Doğru cümle:/);
      }
    }
  }
});

test('whitelist tüketilince eski aile veya fallback açılmaz', () => {
  for (const [gameId, grade] of safeCells) {
    const policy = controlledLiveBetaPolicySummary().cells.find((cell) => cell.cellId === `${gameId}:${grade}`);
    assert.ok(policy);
    const allApprovedKeys = new Set();

    for (let pass = 0; pass < 12 && allApprovedKeys.size < policy.approvedQuestionCount; pass += 1) {
      const next = buildSession(gameId, grade, 2026080620 + pass, allApprovedKeys);
      next.rounds.forEach((round) => allApprovedKeys.add(round.questionKey));
      assert.equal(next.globalQualityAudit?.premiumBank?.fallbackToLegacy, false);
    }
    assert.equal(allApprovedKeys.size, policy.approvedQuestionCount, `${gameId}/g${grade}: whitelist tamamı tüketilemedi`);

    const exhausted = buildSession(gameId, grade, 2026080640, allApprovedKeys);
    assert.equal(exhausted.rounds.length, 0, `${gameId}/g${grade}: fallback sızıntısı`);
    assert.equal(exhausted.globalQualityAudit?.premiumBank?.fallbackToLegacy, false);
  }
});

test('whitelist dışındaki oyun-sınıf hücreleri fail-closed döner', () => {
  const blockedCells = [
    ['paragraph-detective', 5],
    ['science-reasoning', 5],
    ['logic-station', 5],
    ['paragraph-detective', 6],
    ['olympiad-ladder', 7],
    ['lgs-foundation', 8],
    ['english-cloze', 8],
    ['forbidden-story', 7],
    ['social-citizenship', 7]
  ];
  for (const [gameId, grade] of blockedCells) {
    const session = buildSession(gameId, grade, 2026080650);
    assert.equal(session.rounds.length, 0, `${gameId}/g${grade}: doğrulanmamış içerik açıldı`);
    assert.equal(session.globalQualityAudit?.controlledLiveBeta?.policyStatus, 'BLOCKED_NOT_REVIEWED');
    assert.equal(session.globalQualityAudit?.premiumBank?.fallbackToLegacy, false);
  }
});

test('her güvenli hücrede ipuçları soruya özgüdür ve aynı soru içinde tekrar etmez', () => {
  for (const [gameId, grade] of safeCells) {
    const policy = controlledLiveBetaPolicySummary().cells.find((cell) => cell.cellId === `${gameId}:${grade}`);
    const seen = new Set();
    for (let pass = 0; pass < 12 && seen.size < policy.approvedQuestionCount; pass += 1) {
      const session = buildSession(gameId, grade, 2026080700 + pass, seen);
      for (const round of session.rounds) {
        if (seen.has(round.questionKey)) continue;
        seen.add(round.questionKey);
        const hints = round.hints || [];
        assert.equal(hints.length >= 2, true, `${gameId}/g${grade}:${round.questionKey}: ipucu eksik`);
        assert.equal(new Set(hints).size, hints.length, `${gameId}/g${grade}:${round.questionKey}: aynı ipucu tekrarlandı`);
        assert.ok(hints.join(' || ').length >= 50, `${gameId}/g${grade}:${round.questionKey}: ipucu yetersiz`);
      }
    }
    assert.equal(seen.size, policy.approvedQuestionCount, `${gameId}/g${grade}: bütün whitelist incelenemedi`);
  }
});
