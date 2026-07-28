import test from 'node:test';
import assert from 'node:assert/strict';
import { GRADE_CURRICULUM, V4_PARAGRAPH_BANK, V4_QUALITY_POLICY } from '../js/content-v4.js';
import {
  createV4LogicSession,
  createV4OlympiadSession,
  createV4ParagraphSession,
  v4FamilyStats,
  validateQuestionQuality
} from '../js/engines/learning-engine-v4.js';
import { GAME_CATALOG, createGameSession, getGame, isGameAvailableForProfile } from '../js/games/registry.js';
import { loadProjectConfig } from '../scripts/project-config.mjs';

const small = { id: 'v4-small', age: 9, grade: 4, skills: {} };
const big = { id: 'v4-big', age: 13, grade: 8, skills: {} };

function assertChoiceRound(round, label) {
  assert.equal(round.options.length, 4, `${label}: 4 seçenek`);
  assert.equal(new Set(round.options).size, 4, `${label}: seçenek tekrarı`);
  assert.ok(round.options.includes(String(round.answerValue)), `${label}: cevap seçeneklerde`);
  assert.deepEqual(validateQuestionQuality(round), [], `${label}: kalite kontrolü`);
}

test('1–12. sınıf içerik omurgasının tamamı tanımlıdır', () => {
  assert.deepEqual(Object.keys(GRADE_CURRICULUM).map(Number), Array.from({ length: 12 }, (_, index) => index + 1));
  for (let grade = 1; grade <= 12; grade += 1) {
    for (const area of ['turkish', 'math', 'science', 'social', 'english']) {
      assert.ok(GRADE_CURRICULUM[grade][area]?.length, `${grade}. sınıf ${area}`);
    }
  }
});

test('V4 yüksek değerli içerik aileleri dar bir havuz değildir', () => {
  const stats = v4FamilyStats();
  assert.ok(stats.olympiadFamilies >= 28, `olimpiyat aile sayısı ${stats.olympiadFamilies}`);
  assert.ok(stats.logicFamilies >= 24, `mantık aile sayısı ${stats.logicFamilies}`);
  assert.ok(stats.paragraphFamilies >= 24, `paragraf aile sayısı ${stats.paragraphFamilies}`);
  assert.equal(new Set(V4_PARAGRAPH_BANK.map((question) => question.id)).size, V4_PARAGRAPH_BANK.length);
});

test('olimpiyat oturumları on farklı aile ve sınıf karışımı üretir', () => {
  for (const profile of [small, big]) {
    for (let seed = 1; seed <= 40; seed += 1) {
      const rounds = createV4OlympiadSession(profile, seed * 1009, 10, {});
      assert.equal(rounds.length, 10, `${profile.grade}. sınıf / ${seed}`);
      assert.equal(new Set(rounds.map((round) => round.familyId)).size, 10, 'aynı aile aynı oturumda yinelenmez');
      assert.ok(rounds.some((round) => round.curriculumRole === 'review'));
      assert.ok(rounds.some((round) => round.curriculumRole === 'current'));
      assert.ok(rounds.some((round) => round.curriculumRole === 'preview'));
      rounds.forEach((round) => assertChoiceRound(round, `${profile.grade}/${round.familyId}`));
    }
  }
});

test('zekâ oturumunda sekiz soru sekiz ayrı düşünme ailesinden gelir', () => {
  const forbiddenFragments = ['4’ten büyük, 8’den küçüktür', '2, 4, 6 ve 8 yazıyor', 'harfler 2–1–4–3'];
  for (const profile of [small, big]) {
    for (let seed = 1; seed <= 40; seed += 1) {
      const rounds = createV4LogicSession(profile, seed * 1297, 8, {});
      assert.equal(rounds.length, 8);
      assert.equal(new Set(rounds.map((round) => round.familyId)).size, 8);
      for (const round of rounds) {
        assertChoiceRound(round, `${profile.grade}/${round.familyId}`);
        const visible = `${round.context} ${round.prompt}`;
        forbiddenFragments.forEach((fragment) => assert.equal(visible.includes(fragment), false, visible));
        assert.ok(round.cognitiveDepth >= V4_QUALITY_POLICY.minCognitiveDepthForChallenge);
      }
    }
  }
});

test('paragraf oturumları sekiz ayrı okuma becerisi üretir', () => {
  for (const profile of [small, big]) {
    const rounds = createV4ParagraphSession(profile, 88771, 8, {});
    assert.equal(rounds.length, 8);
    assert.equal(new Set(rounds.map((round) => round.familyId)).size, 8);
    rounds.forEach((round) => assertChoiceRound(round, `${profile.grade}/${round.familyId}`));
  }
});

test('görülen dinamik soru anahtarı aynı profile tekrar verilmez', () => {
  for (const [factory, count] of [[createV4OlympiadSession, 10], [createV4LogicSession, 8]]) {
    const first = factory(big, 45678, count, {});
    const seen = new Set(first.map((round) => round.questionKey));
    const second = factory(big, 98765, count, { seenQuestionKeys: seen, recentFamilyIds: first.map((round) => round.familyId) });
    assert.equal(second.filter((round) => seen.has(round.questionKey)).length, 0);
  }
});

test('küçük kuzen Din ve LGS alanlarını hiçbir yerde açamaz', () => {
  for (const id of ['religion-practice', 'lgs-foundation']) {
    const game = getGame(id);
    assert.equal(isGameAvailableForProfile(game, small), false);
    assert.throws(() => createGameSession(id, small, 123), /kullanılamaz/);
    assert.equal(isGameAvailableForProfile(game, big), true);
  }
  const smallIds = GAME_CATALOG.filter((game) => isGameAvailableForProfile(game, small)).map((game) => game.id);
  assert.equal(smallIds.includes('religion-practice'), false);
  assert.equal(smallIds.includes('lgs-foundation'), false);
});

test('tek ayar dosyası yerel çalışma için okunabilir', async () => {
  const config = await loadProjectConfig();
  assert.ok(['local', 'vercel'].includes(config.mode));
  assert.ok(config.appName.length > 3);
  assert.ok(Number.isInteger(config.localPort));
  assert.ok(['local', 'firebase'].includes(config.dataProvider));
});

test('aynı profil 60 oturum boyunca aynı dinamik soruyu yeniden görmez', () => {
  const definitions = [
    ['olimpiyat', createV4OlympiadSession, 10],
    ['zekâ', createV4LogicSession, 8],
    ['paragraf', createV4ParagraphSession, 8]
  ];
  for (const profile of [small, big]) {
    for (const [label, factory, count] of definitions) {
      const seen = new Set();
      let recentFamilyIds = [];
      const timeLimits = new Set();
      for (let sessionIndex = 0; sessionIndex < 60; sessionIndex += 1) {
        const rounds = factory(profile, 190001 + sessionIndex * 7919, count, { seenQuestionKeys: seen, recentFamilyIds });
        assert.equal(rounds.length, count, `${profile.grade}. sınıf ${label} ${sessionIndex + 1}. oturum eksik`);
        assert.equal(new Set(rounds.map((round) => round.familyId)).size, count, `${label}: aynı aile aynı testte yinelendi`);
        for (const round of rounds) {
          assert.equal(seen.has(round.questionKey), false, `${label}: ${round.questionKey} yeniden soruldu`);
          seen.add(round.questionKey);
          timeLimits.add(round.timeLimit);
        }
        recentFamilyIds = rounds.map((round) => round.familyId);
      }
      assert.equal(seen.size, 60 * count, `${label}: benzersiz soru sayısı`);
      assert.ok(timeLimits.size >= 3, `${label}: soru türüne göre süre çeşitlenmiyor`);
    }
  }
});

test('V4 kritik matematik ve mantık ailelerinin sonuçları kurallarıyla uyumludur', () => {
  const profile = { id:'semantic-v4', age:11, grade:6, skills:{} };
  const seen = new Set();
  for (let seed = 1; seed <= 300; seed += 1) {
    const rounds = createV4OlympiadSession(profile, seed * 3571, 10, { seenQuestionKeys: seen });
    for (const round of rounds) {
      seen.add(round.questionKey);
      const answer = Number(round.answerValue);
      if (round.familyId === 'consecutive-sum') {
        const [, count, total] = round.context.match(/Ardışık (\d+) tek sayının toplamı (\d+)/) || [];
        assert.equal(answer, Number(total) / Number(count));
        assert.equal(answer % 2, 1);
      }
      if (round.familyId === 'rectangle-grid-count') {
        const [, rows, cols] = round.context.match(/(\d+) satır ve (\d+) sütunluk/) || [];
        assert.equal(answer, ((Number(rows)+1)*Number(rows)/2) * ((Number(cols)+1)*Number(cols)/2));
      }
      if (round.familyId === 'pigeonhole-socks') {
        const [, colors] = round.context.match(/(\d+) farklı renkte/) || [];
        const [, wanted] = round.prompt.match(/Aynı renkten (\d+) çorabı/) || [];
        assert.equal(answer, Number(colors) * (Number(wanted) - 1) + 1);
      }
      if (round.familyId === 'subset-target') {
        const [, target] = round.prompt.match(/Toplamı (\d+) yapan/) || [];
        const sums = round.options.map((option) => option.split('+').reduce((sum, value) => sum + Number(value.trim()), 0));
        assert.equal(sums.filter((sum) => sum === Number(target)).length, 1);
        assert.equal(sums[round.options.indexOf(round.answerValue)], Number(target));
      }
      if (round.familyId === 'logical-number-card') {
        const [, divisor, bound, digitTotal] = round.context.match(/(\d+) ile tam bölünüyor, (\d+) sayısından küçük ve rakamları toplamı (\d+)/) || [];
        const valid = round.options.filter((option) => {
          const value = Number(option);
          const sum = [...String(value)].reduce((total, digit) => total + Number(digit), 0);
          return value % Number(divisor) === 0 && value < Number(bound) && sum === Number(digitTotal);
        });
        assert.deepEqual(valid, [round.answerValue]);
      }
      if (round.familyId === 'magic-square-missing') assert.ok(answer >= 1, 'küçük sınıfa negatif eksik sayı üretilmemeli');
    }
  }
});

test('iç içe kutu sorularında renk değişimi ilişki zincirini bozmaz', () => {
  const profile = { id:'nested-v4', age:9, grade:4, skills:{} };
  let checked = 0;
  for (let seed = 1; seed <= 1000; seed += 1) {
    const round = createV4LogicSession(profile, seed * 1013, 8, {}).find((item) => item.familyId === 'nested-containers');
    if (!round) continue;
    const match = round.context.match(/: (\p{L}+) kutu (\p{L}+) kutunun içindedir\. (\p{L}+) kutu dolabın içindedir/u);
    assert.ok(match, round.context);
    assert.equal(match[2].toLocaleLowerCase('tr-TR'), match[3].toLocaleLowerCase('tr-TR'), 'orta kutu aynı olmalı');
    assert.equal(round.answerValue, `${match[1]} kutu dolabın içindedir.`);
    checked += 1;
  }
  assert.ok(checked >= 100, `yalnız ${checked} kutu sorusu kontrol edildi`);
});
