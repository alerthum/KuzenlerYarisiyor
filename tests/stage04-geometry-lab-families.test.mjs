import test from 'node:test';
import assert from 'node:assert/strict';
import { GEOMETRY_LAB_FAMILIES } from '../js/content/families/geometry-lab-families.js';
import {
  FAMILY_TARGET,
  SKELETON_TARGET_PER_FAMILY,
  PATH_TARGET_PER_SKELETON,
  capacityReport,
  validateFamilyDefinition,
  generateFromFamilies
} from '../js/quality/family-skeleton-engine.js';
import { createGameSession } from '../js/games/registry.js';
import { validateQuestionContract } from '../js/quality/question-contract-v11.js';

function seededRandomLike(seedValue) {
  let seed = Number(seedValue) || 1;
  return () => {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let result = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    result = (result + Math.imul(result ^ (result >>> 7), 61 | result)) ^ result;
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

// Üretim kodundan (js/content/families/geometry-lab-families.js) TAMAMEN
// BAĞIMSIZ, her aile için formülü FARKLI bir şekilde yeniden ifade eden ikinci
// hesaplama yolları (bkz. md/arsiv/DIFF_ANALYSIS.md §6). Sayılar, üretilen prompt/context
// METNİNDEN regex ile çıkarılır — üretim kodunun iç değişkenlerine ASLA erişilmez.
const DIRECT_CHECKS = {
  'geometry-rectangle-perimeter': {
    regex: /Uzunluk (\d+) birim, genişlik (\d+) birimdir/,
    compute: ([w, h]) => w * 2 + h * 2
  },
  'geometry-rectangle-area': {
    regex: /Kenarları (\d+) ve (\d+) birimdir/,
    compute: ([w, h]) => Array.from({ length: w }, () => h).reduce((a, b) => a + b, 0)
  },
  'geometry-square-area': {
    regex: /Bir kenarı (\d+) birimdir/,
    compute: ([side]) => Array.from({ length: side }, () => side).reduce((a, b) => a + b, 0)
  },
  'geometry-square-perimeter': {
    regex: /Bir kenarı (\d+) birimdir/,
    compute: ([side]) => side + side + side + side
  },
  'geometry-triangle-area': {
    regex: /Taban (\d+), bu tabana ait yükseklik (\d+) birimdir/,
    compute: ([base, height]) => (base / 2) * height
  },
  'geometry-cube-volume': {
    regex: /Bir ayrıtı (\d+) birimdir/,
    compute: ([side]) => Math.pow(side, 3)
  },
  'geometry-prism-volume': {
    regex: /Boyutları (\d+) × (\d+) × (\d+) birimdir/,
    compute: ([w, d, h]) => [w, d, h].reduce((p, c) => p * c, 1)
  },
  'geometry-trapezoid-area': {
    regex: /Paralel kenarlar (\d+) ve (\d+), yükseklik (\d+) birimdir/,
    compute: ([a, b, height]) => (a * height + b * height) / 2
  },
  'geometry-composite-area': {
    regex: /(\d+)×(\d+) dikdörtgenden (\d+)×(\d+) dikdörtgen çıkarılmıştır/,
    compute: ([w, h, cw, ch]) => [w, h].reduce((p, c) => p * c, 1) - [cw, ch].reduce((p, c) => p * c, 1)
  },
  'geometry-triangle-angle-sum': {
    regex: /Diğer açılar (\d+)° ve (\d+)°'dir/,
    compute: ([a, b]) => 180 - (a + b)
  },
  'geometry-right-triangle-hypotenuse': {
    regex: /Dik kenarlar (\d+) ve (\d+) birimdir/,
    compute: ([a, b]) => Math.round(Math.sqrt(a * a + b * b))
  },
  'geometry-cube-surface-area': {
    regex: /Bir ayrıtı (\d+) birimdir/,
    compute: ([side]) => 6 * Math.pow(side, 2)
  }
};

const MISSING_CHECKS = {
  'geometry-rectangle-perimeter': {
    regex: /Çevre (\d+) birim, kısa kenar (\d+) birimdir/,
    compute: ([perimeter, h]) => perimeter / 2 - h
  },
  'geometry-rectangle-area': {
    regex: /Alan (\d+) birimkare, uzun kenar (\d+) birimdir/,
    compute: ([area, w]) => area / w
  },
  'geometry-square-area': {
    regex: /Alan (\d+) birimkaredir/,
    compute: ([area]) => Math.round(Math.sqrt(area))
  },
  'geometry-square-perimeter': {
    regex: /Çevre (\d+) birimdir/,
    compute: ([perimeter]) => perimeter / 4
  },
  'geometry-triangle-area': {
    regex: /Alan (\d+) birimkare, taban (\d+) birimdir/,
    compute: ([area, base]) => (area * 2) / base
  },
  'geometry-cube-volume': {
    regex: /Hacim (\d+) birimküptür/,
    compute: ([volume]) => Math.round(Math.cbrt(volume))
  },
  'geometry-prism-volume': {
    regex: /Hacim (\d+) birimküp, taban kenarları (\d+) ve (\d+) birimdir/,
    compute: ([volume, w, d]) => volume / (w * d)
  },
  'geometry-trapezoid-area': {
    regex: /Alan (\d+) birimkare, bir paralel kenar (\d+) birim, yükseklik (\d+) birimdir/,
    compute: ([area, a, height]) => (2 * area) / height - a
  },
  'geometry-composite-area': {
    regex: /Büyük dikdörtgen (\d+)×(\d+), kalan alan (\d+) birimkare, çıkarılan bölgenin bir kenarı (\d+) birimdir/,
    compute: ([w, h, area, cutW]) => (w * h - area) / cutW
  },
  'geometry-triangle-angle-sum': {
    regex: /Diğer iki açı (\d+)° ve (\d+)°'dir/,
    compute: ([a, b]) => 180 - a - b
  },
  'geometry-right-triangle-hypotenuse': {
    regex: /Hipotenüs (\d+) birim, bir dik kenar (\d+) birimdir/,
    compute: ([hyp, legA]) => Math.round(Math.sqrt(hyp * hyp - legA * legA))
  },
  'geometry-cube-surface-area': {
    regex: /Yüzey alanı (\d+) birimkaredir/,
    compute: ([surface]) => Math.round(Math.sqrt(surface / 6))
  }
};

const WRONG_CHECKS = {
  'geometry-rectangle-perimeter': { compute: ([w, h]) => w + h },
  'geometry-rectangle-area': { compute: ([w, h]) => w + w + h + h },
  'geometry-square-area': { compute: ([side]) => side + side + side + side },
  'geometry-square-perimeter': { compute: ([side]) => Math.pow(side, 2) },
  'geometry-triangle-area': { compute: ([base, height]) => base * height },
  'geometry-cube-volume': { compute: ([side]) => side * 3 },
  'geometry-prism-volume': { compute: ([w, d, h]) => w + d + h },
  'geometry-trapezoid-area': { compute: ([a, b, height]) => (a + b) * height },
  'geometry-composite-area': { compute: ([w, h, cw, ch]) => w * h + cw * ch },
  'geometry-triangle-angle-sum': { compute: ([a, b]) => 360 - (a + b) },
  'geometry-right-triangle-hypotenuse': { compute: ([a, b]) => a + b },
  'geometry-cube-surface-area': { compute: ([side]) => Math.pow(side, 3) }
};

function extractNumbers(text, regex) {
  const match = text.match(regex);
  if (!match) return null;
  return match.slice(1).map(Number);
}

test('geometry-lab ailelerinin her biri yapısal olarak geçerlidir (familyId, skeletonId, generate, reasoningPathIds, cognitiveTraits)', () => {
  for (const family of GEOMETRY_LAB_FAMILIES) {
    const result = validateFamilyDefinition(family);
    assert.ok(result.ok, `${family.familyId}: ${result.errors.join(', ')}`);
  }
});

test('geometry-lab, Aşama 04 hedeflerinin tamamına ulaşır: >=12 aile, aile başına >=4 iskelet, iskelet başına >=3 düşünme yolu', () => {
  const report = capacityReport(GEOMETRY_LAB_FAMILIES);
  assert.equal(report.familyCount, GEOMETRY_LAB_FAMILIES.length);
  assert.ok(report.familyCount >= FAMILY_TARGET, `Aile sayısı ${report.familyCount}, hedef >=${FAMILY_TARGET}`);
  assert.ok(report.meetsSkeletonTarget, `Bir ailede iskelet sayısı hedefin (>=${SKELETON_TARGET_PER_FAMILY}) altında`);
  assert.ok(report.meetsPathTarget, `Bir iskelette düşünme yolu sayısı hedefin (>=${PATH_TARGET_PER_SKELETON}) altında`);
  assert.equal(report.meetsAllTargets, true);
});

test('bütün familyId ve skeletonId değerleri global olarak benzersizdir', () => {
  const familyIds = GEOMETRY_LAB_FAMILIES.map((f) => f.familyId);
  assert.equal(new Set(familyIds).size, familyIds.length);
  const skeletonIds = GEOMETRY_LAB_FAMILIES.flatMap((f) => f.skeletons.map((s) => s.skeletonId));
  assert.equal(new Set(skeletonIds).size, skeletonIds.length);
  assert.equal(skeletonIds.length, GEOMETRY_LAB_FAMILIES.length * SKELETON_TARGET_PER_FAMILY);
});

test('direct-compute (raw-numeric yolu): her ailenin değeri, prompt/context METNİNDEN çıkarılan sayılarla, üretim kodundan bağımsız FARKLI bir formülle yeniden hesaplanınca aynı sonucu verir', () => {
  let checked = 0;
  for (const family of GEOMETRY_LAB_FAMILIES) {
    const check = DIRECT_CHECKS[family.familyId];
    assert.ok(check, `${family.familyId} için bağımsız doğrulama formülü tanımlı değil`);
    const skeleton = family.skeletons.find((s) => s.skeletonId.endsWith(':direct-compute'));
    for (let trial = 0; trial < 6; trial += 1) {
      const round = skeleton.generate(seededRandomLike(trial * 47 + family.familyId.length), 'raw-numeric');
      checked += 1;
      assert.equal(round.kind, undefined, `${family.familyId}: geometry-lab turları choice tabanlıdır, kind alanı registry.js'de eklenir`);
      const nums = extractNumbers(round.context, check.regex);
      assert.ok(nums, `${family.familyId}: context metninden sayı çıkarılamadı: "${round.context}"`);
      const independentValue = check.compute(nums);
      assert.equal(independentValue, Number(round.options[round.answerIndex]), `${family.familyId}: bağımsız hesaplama (${independentValue}) üretim sonucuyla (${round.options[round.answerIndex]}) uyuşmuyor`);
    }
  }
  assert.equal(checked, GEOMETRY_LAB_FAMILIES.length * 6);
});

test('missing-dimension-reverse (raw-numeric yolu): eksik boyut, context metninden çıkarılan sayılarla bağımsız TERS formülle yeniden hesaplanınca üretimle aynı sonucu verir', () => {
  let checked = 0;
  for (const family of GEOMETRY_LAB_FAMILIES) {
    const check = MISSING_CHECKS[family.familyId];
    assert.ok(check, `${family.familyId} için bağımsız ters-formül doğrulaması tanımlı değil`);
    const skeleton = family.skeletons.find((s) => s.skeletonId.endsWith(':missing-dimension-reverse'));
    for (let trial = 0; trial < 6; trial += 1) {
      const round = skeleton.generate(seededRandomLike(trial * 61 + family.familyId.length), 'raw-numeric');
      checked += 1;
      const nums = extractNumbers(round.context, check.regex);
      assert.ok(nums, `${family.familyId}: missing context metninden sayı çıkarılamadı: "${round.context}"`);
      const independentValue = Math.round(check.compute(nums));
      assert.equal(independentValue, Number(round.options[round.answerIndex]), `${family.familyId}: bağımsız ters hesaplama (${independentValue}) üretim sonucuyla (${round.options[round.answerIndex]}) uyuşmuyor`);
    }
  }
  assert.equal(checked, GEOMETRY_LAB_FAMILIES.length * 6);
});

test('verify-and-correct (raw-numeric yolu): arkadaşın "yanlış" sonucu bağımsız yanılgı-formülüyle teyit edilir ve doğru cevaptan FARKLIDIR', () => {
  let checked = 0;
  for (const family of GEOMETRY_LAB_FAMILIES) {
    const directCheck = DIRECT_CHECKS[family.familyId];
    const wrongCheck = WRONG_CHECKS[family.familyId];
    assert.ok(wrongCheck, `${family.familyId} için bağımsız yanılgı-formülü tanımlı değil`);
    const skeleton = family.skeletons.find((s) => s.skeletonId.endsWith(':verify-and-correct'));
    for (let trial = 0; trial < 5; trial += 1) {
      const round = skeleton.generate(seededRandomLike(trial * 83 + family.familyId.length), 'raw-numeric');
      checked += 1;
      const wrongMatch = round.prompt.match(/(-?\d+) \S+ olarak hesaplamış/);
      assert.ok(wrongMatch, `${family.familyId}: prompt içinde arkadaşın yanlış sonucu bulunamadı: "${round.prompt}"`);
      const wrongFromText = Number(wrongMatch[1]);
      const nums = extractNumbers(round.prompt, directCheck.regex);
      assert.ok(nums, `${family.familyId}: prompt içinden boyut sayıları çıkarılamadı: "${round.prompt}"`);
      const independentCorrect = directCheck.compute(nums);
      const independentWrong = wrongCheck.compute(nums);
      assert.equal(wrongFromText, independentWrong, `${family.familyId}: arkadaşın metindeki sonucu (${wrongFromText}), bağımsız yanılgı formülüyle (${independentWrong}) uyuşmuyor`);
      assert.notEqual(independentWrong, independentCorrect, `${family.familyId}: yanılgı sonucu yanlışlıkla doğru sonuca eşit çıktı`);
      assert.equal(independentCorrect, Number(round.options[round.answerIndex]), `${family.familyId}: doğru cevap seçeneği bağımsız hesaplamayla uyuşmuyor`);
      assert.ok(round.options.includes(String(wrongFromText)), `${family.familyId}: yanılgı değeri seçenekler arasında yer almalı (çeldirici olarak)`);
    }
  }
  assert.equal(checked, GEOMETRY_LAB_FAMILIES.length * 5);
});

test('compare-two-shapes (her yol): açıklamadaki A/B değerlerinin farkı, bağımsız çıkarma işlemiyle doğru cevap seçeneğine eşittir', () => {
  let checked = 0;
  for (const family of GEOMETRY_LAB_FAMILIES) {
    const skeleton = family.skeletons.find((s) => s.skeletonId.endsWith(':compare-two-shapes'));
    for (const pathId of skeleton.reasoningPathIds) {
      for (let trial = 0; trial < 4; trial += 1) {
        const round = skeleton.generate(seededRandomLike(trial * 97 + family.familyId.length + pathId.length), pathId);
        checked += 1;
        // raw-numeric/context-embedded: "A = X birim, B = Y birim. Fark = ..."
        // staged-strategy-hint: "Birinci sonuç X birim, ikinci sonuç Y birim. Fark = ..."
        const match = round.explanation.match(/A = (\d+(?:\.\d+)?) \S+, B = (\d+(?:\.\d+)?) \S+\. Fark = /)
          || round.explanation.match(/Birinci sonuç (\d+(?:\.\d+)?) \S+, ikinci sonuç (\d+(?:\.\d+)?) \S+\. Fark = /);
        assert.ok(match, `${family.familyId}: açıklamada A/B veya birinci/ikinci sonuç kalıbı bulunamadı: "${round.explanation}"`);
        const a = Number(match[1]);
        const b = Number(match[2]);
        const independentDiff = Math.abs(a - b);
        assert.equal(independentDiff, Number(round.options[round.answerIndex]), `${family.familyId}: bağımsız fark hesaplaması (${independentDiff}) üretim sonucuyla uyuşmuyor`);
      }
    }
  }
  assert.equal(checked, GEOMETRY_LAB_FAMILIES.length * PATH_TARGET_PER_SKELETON * 4);
});

test('her iskelet-yol kombinasyonunda tam olarak 4 benzersiz, negatif olmayan tam sayı seçenek üretilir (100+ seed)', () => {
  let combos = 0;
  for (const family of GEOMETRY_LAB_FAMILIES) {
    for (const skeleton of family.skeletons) {
      for (const pathId of skeleton.reasoningPathIds) {
        for (let trial = 0; trial < 5; trial += 1) {
          const round = skeleton.generate(seededRandomLike(trial * 131 + skeleton.skeletonId.length), pathId);
          combos += 1;
          assert.ok(Array.isArray(round.options) && round.options.length === 4, `${skeleton.skeletonId}/${pathId}: 4 seçenek olmalı`);
          assert.equal(new Set(round.options).size, 4, `${skeleton.skeletonId}/${pathId}: seçenekler benzersiz olmalı`);
          assert.ok(round.answerIndex >= 0 && round.answerIndex < 4, `${skeleton.skeletonId}/${pathId}: answerIndex geçersiz`);
          assert.ok(round.options.every((o) => Number.isInteger(Number(o)) && Number(o) >= 0), `${skeleton.skeletonId}/${pathId}: tüm seçenekler negatif olmayan tam sayı olmalı: ${round.options}`);
        }
      }
    }
  }
  assert.equal(combos, GEOMETRY_LAB_FAMILIES.length * SKELETON_TARGET_PER_FAMILY * PATH_TARGET_PER_SKELETON * 5);
});

test('generateFromFamilies: geometry-lab havuzundan tam bir oturum (6 tur) üretildiğinde aynı familyId/skeletonId oturum içinde tekrar etmez', () => {
  const { rounds, audit } = generateFromFamilies(GEOMETRY_LAB_FAMILIES, { seed: 646464, count: 6 });
  assert.equal(rounds.length, 6);
  assert.equal(new Set(rounds.map((r) => r.familyId)).size, 6, 'aynı aile oturum içinde iki kez seçilmemeli (havuz yeterli)');
  assert.equal(new Set(rounds.map((r) => r.skeletonId)).size, 6, 'aynı iskelet oturum içinde iki kez seçilmemeli (havuz yeterli)');
  assert.ok(audit.distinctFamiliesUsed >= 6);
  for (const round of rounds) {
    assert.ok(round.reasoningPathId, 'her tur bir reasoningPathId taşımalı');
    assert.ok(Array.isArray(round.cognitiveTraits) && round.cognitiveTraits.length >= 2, 'her tur >=2 bilişsel özellik taşımalı');
  }
});

test('CANLI ENTEGRASYON: createGameSession("geometry-lab", ...) yeni aile motorunu kullanır, questionContract EXPLICIT_MULTI_PATH işaretler', () => {
  const profile = { id: 'stage04-geometrylab-live-1', age: 11, grade: 5, skills: {} };
  const session = createGameSession('geometry-lab', profile, 909090);
  assert.equal(session.rounds.length, 6);
  const familyIds = session.rounds.map((r) => r.familyId);
  const skeletonIds = session.rounds.map((r) => r.skeletonId);
  assert.equal(new Set(familyIds).size, 6, 'canlı oturumda aynı aile iki kez seçilmemeli');
  assert.equal(new Set(skeletonIds).size, 6, 'canlı oturumda aynı iskelet iki kez seçilmemeli');
  for (const round of session.rounds) {
    assert.ok(round.familyId?.startsWith('geometry-'), 'familyId yeni aile motorundan gelmeli');
    assert.equal(round.kind, 'choice');
    const result = validateQuestionContract(round);
    assert.ok(result.ok, `questionContract eksik/hatalı: ${result.errors.join(',')}`);
    assert.equal(round.questionContract.reasoningPath.derivationMethod, 'EXPLICIT_MULTI_PATH');
    assert.ok(round.questionContract.reasoningPath.cognitiveTraits.length >= 2);
  }
});

test('CANLI ENTEGRASYON: 30 ardışık geometry-lab oturumu (farklı seed, aynı öğrenci) hiçbir turda questionKey tekrar etmez, underfill olmaz ve zamanla her 4 görev türü de kullanılır', () => {
  const profile = { id: 'stage04-geometrylab-live-2', age: 9, grade: 4, skills: {} };
  const seenQuestionKeys = new Set();
  const attempts = [];
  let immediateSkeletonRepeats = 0;
  const skeletonTaskTypesSeen = new Set();
  for (let session = 0; session < 30; session += 1) {
    const result = createGameSession('geometry-lab', profile, 2000 + session * 41, { seenQuestionKeys, attempts });
    assert.equal(result.rounds.length, 6, `oturum ${session}: 6 tur üretilmeli (underfill yok)`);
    const skeletonsThisSession = new Set();
    for (const round of result.rounds) {
      assert.ok(!seenQuestionKeys.has(round.questionKey), `questionKey ardışık oturumlar arasında tekrar etti: ${round.questionKey}`);
      seenQuestionKeys.add(round.questionKey);
      if (skeletonsThisSession.has(round.skeletonId)) immediateSkeletonRepeats += 1;
      skeletonsThisSession.add(round.skeletonId);
      const taskType = round.skeletonId.split(':').at(-1);
      skeletonTaskTypesSeen.add(taskType);
      attempts.push({ gameId: 'geometry-lab', familyId: round.familyId, skeletonId: round.skeletonId });
    }
  }
  assert.equal(immediateSkeletonRepeats, 0, 'aynı oturum içinde iskelet tekrarı olmamalı (havuz 48, oturum 6)');
  assert.equal(skeletonTaskTypesSeen.size, 4, `30 oturum boyunca 4 görev türünün (direct-compute/missing-dimension-reverse/verify-and-correct/compare-two-shapes) tamamı en az bir kez kullanılmalı, kullanılan: ${[...skeletonTaskTypesSeen].join(',')}`);
});
