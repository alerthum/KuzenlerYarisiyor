// Aşama 04 — forbidden-story (Yasak Harf Hikâyesi) için gerçek Aile→İskelet→Düşünme Yolu.
// UI: select-valid → kind:'story'; diğer 3 → kind:'choice'.
// Aile = kısıt türü / üretim stratejisi / ihlal taksonomisi; yalnız harf veya konu yüzeyi ≠ yeni aile.

import { containsForbiddenLetter } from '../../engines/word-engine.js';

function pick(items, random) {
  return items[Math.floor(random() * items.length)];
}

function shuffle(list, random) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

function wrapKey(skeletonId, pathId, raw) {
  return `forbidden-story:${skeletonId}:${pathId}:${simpleHash(raw)}`;
}

const PATH_IDS = ['raw-letters', 'context-embedded', 'staged-strategy-hint'];

const TASK_TRAITS = {
  select: ['strategySelection', 'multiStepInference'],
  forced: ['informationLinking', 'conditionEvaluation'],
  spot: ['errorAnalysis', 'conditionEvaluation'],
  compare: ['strategySelection', 'usingIntermediateResultInNewDecision']
};

export const VIOLATION_TYPES = {
  LETTER: 'harf-sizması',
  SENTENCE: 'cumle-eksigi',
  LEXICON: 'kelime-cesit-eksigi',
  TOPIC: 'konu-sapmasi'
};

function upLetter(letter) {
  return String(letter).toLocaleUpperCase('tr-TR');
}

function isSafe(text, letter) {
  return !containsForbiddenLetter(text, letter);
}

function pathWrap(pathId, rawPrompt, contextHint, strategyHint) {
  if (pathId === 'raw-letters') {
    return {
      prompt: rawPrompt,
      context: contextHint || 'Yasak harfi hiç kullanma; cümle ve kelime kotasını da karşıla.'
    };
  }
  if (pathId === 'context-embedded') {
    return {
      prompt: `Yaratıcı yazı atölyesi: ${rawPrompt}`,
      context: 'Senaryodaki süslemeleri ayıkla; yasak harf ve kota kurallarına odaklan.'
    };
  }
  return {
    prompt: `${strategyHint || 'Önce yasak harfsiz kelime listesi çıkar, sonra cümleleri kur.'} ${rawPrompt}`,
    context: 'Strateji ipucu cevabı vermez; yalnız düşünme sırasını gösterir.'
  };
}

function roundStory(skeletonId, pathId, letter, topic, minSentences, minUniqueWords, random, texts) {
  const { prompt } = pathWrap(pathId, texts.raw || topic, texts.context, texts.strategy);
  const instanceNonce = Math.floor(random() * 1e9).toString(36);
  return {
    kind: 'story',
    prompt,
    forbiddenLetter: letter,
    minSentences,
    minUniqueWords,
    explanation: texts.explanation,
    questionKey: wrapKey(skeletonId, pathId, `${letter}|${topic}|${minSentences}|${minUniqueWords}|${instanceNonce}`)
  };
}

function roundChoice(skeletonId, pathId, answerText, distractors, random, texts) {
  const pool = [answerText, ...distractors];
  const unique = [...new Set(pool)];
  while (unique.length < 4) unique.push(`X${unique.length}`);
  const options = shuffle(unique.slice(0, 4), random);
  const answerIndex = options.indexOf(answerText);
  const { prompt, context } = pathWrap(pathId, texts.raw, texts.context, texts.strategy);
  const instanceNonce = Math.floor(random() * 1e9).toString(36);
  return {
    kind: 'choice',
    prompt,
    context,
    options,
    answerIndex,
    explanation: texts.explanation,
    questionKey: wrapKey(skeletonId, pathId, `${texts.raw}|${answerText}|${instanceNonce}`)
  };
}

function buildFamily(familyId, builders) {
  const ids = {
    select: `${familyId}:select-valid`,
    forced: `${familyId}:forced-fact`,
    spot: `${familyId}:spot-violation`,
    compare: `${familyId}:compare-worlds`
  };
  return {
    familyId,
    skeletons: [
      { skeletonId: ids.select, reasoningPathIds: PATH_IDS, cognitiveTraits: TASK_TRAITS.select, generate: (r, p) => builders.select(ids.select, p, r) },
      { skeletonId: ids.forced, reasoningPathIds: PATH_IDS, cognitiveTraits: TASK_TRAITS.forced, generate: (r, p) => builders.forced(ids.forced, p, r) },
      { skeletonId: ids.spot, reasoningPathIds: PATH_IDS, cognitiveTraits: TASK_TRAITS.spot, generate: (r, p) => builders.spot(ids.spot, p, r) },
      { skeletonId: ids.compare, reasoningPathIds: PATH_IDS, cognitiveTraits: TASK_TRAITS.compare, generate: (r, p) => builders.compare(ids.compare, p, r) }
    ]
  };
}

function safeWord(letter, random) {
  const pool = {
    a: ['güneş', 'deniz', 'köprü', 'çiçek', 'göl'],
    e: ['okul', 'balık', 'çocuk', 'orman', 'kitap'],
    i: ['okul', 'bahar', 'deniz', 'oyun', 'top'],
    r: ['okul', 'deniz', 'kitap', 'oyun', 'balık'],
    ş: ['okul', 'deniz', 'kitap', 'oyun', 'top'],
    ç: ['okul', 'deniz', 'kitap', 'oyun', 'bahar'],
    ğ: ['okul', 'deniz', 'kitap', 'oyun', 'top'],
    k: ['deniz', 'oyun', 'bahar', 'çiçek', 'göl'],
    n: ['okul', 'kitap', 'çiçek', 'göl', 'top']
  };
  const list = (pool[letter] || ['okul', 'deniz', 'kitap', 'oyun', 'top']).filter((w) => isSafe(w, letter));
  return pick(list.length ? list : ['ok', 'su', 'bu'], random);
}

function unsafeWord(letter, random) {
  const pool = {
    a: ['araba', 'kalem', 'masa', 'park'],
    e: ['ev', 'defter', 'kelebek', 'şehir'],
    i: ['isim', 'film', 'siniz', 'bilgisayar'],
    r: ['araba', 'park', 'renk', 'orman'],
    ş: ['ışık', 'yağış', 'kuş', 'taş'],
    ç: ['çiçek', 'uçak', 'açık', 'gece'],
    ğ: ['yağmur', 'dağ', 'öğrenci', 'doğru'],
    k: ['okul', 'kitap', 'köpek', 'park'],
    n: ['deniz', 'orman', 'gün', 'anne']
  };
  const list = (pool[letter] || [`${letter}a`, `b${letter}a`]).filter((w) => !isSafe(w, letter));
  return pick(list.length ? list : [`${letter}x`], random);
}

// ---- 1. fs-vowel-ban ----
function familyVowelBan() {
  const letters = ['a', 'e', 'i'];
  return buildFamily('fs-vowel-ban', {
    select(id, pathId, random) {
      const letter = pick(letters, random);
      const topic = `Sık ünlü “${upLetter(letter)}” yasak. Kısa bir doğa sahnesini anlat.`;
      return roundStory(id, pathId, letter, topic, 3, 12, random, {
        raw: topic,
        strategy: 'Önce yasak ünlüyü içeren kelimeleri listeden çıkar; yerine güvenli eşdeğerler koy.',
        explanation: `Ünlü yasağı (${upLetter(letter)}) planlı kaçınma ister; rastgele yazmak sızdırır.`
      });
    },
    forced(id, pathId, random) {
      const letter = pick(letters, random);
      const safe = safeWord(letter, random);
      return roundChoice(id, pathId, safe, [unsafeWord(letter, random), unsafeWord(letter, random), unsafeWord(letter, random)], random, {
        raw: `Yasak harf “${upLetter(letter)}”. Hangisi güvenli kelimedir?`,
        explanation: `“${safe}” yasak ünlüyü taşımaz.`
      });
    },
    spot(id, pathId, random) {
      const letter = pick(letters, random);
      const bad = unsafeWord(letter, random);
      return roundChoice(id, pathId, bad, [safeWord(letter, random), safeWord(letter, random), safeWord(letter, random)], random, {
        raw: `Yasak “${upLetter(letter)}”. Hangisi ihlal eder?`,
        explanation: `“${bad}” yasak ünlüyü içerir → ihlal.`
      });
    },
    compare(id, pathId, random) {
      const letter = pick(letters, random);
      const good = `${safeWord(letter, random)} ${safeWord(letter, random)}`;
      const bad = `${unsafeWord(letter, random)} ${safeWord(letter, random)}`;
      return roundChoice(id, pathId, good, [bad, unsafeWord(letter, random), 'YOK'], random, {
        raw: `Yasak “${upLetter(letter)}”. Hangisi güvenli taslaktır?`,
        explanation: `“${good}” harf sızdırmaz.`
      });
    }
  });
}

// ---- 2. fs-consonant-ban ----
function familyConsonantBan() {
  const letters = ['r', 'k', 'n'];
  return buildFamily('fs-consonant-ban', {
    select(id, pathId, random) {
      const letter = pick(letters, random);
      const topic = `Sık ünsüz “${upLetter(letter)}” yasak. Bir okul bahçesi sahnesi yaz.`;
      return roundStory(id, pathId, letter, topic, 3, 12, random, {
        raw: topic,
        strategy: `Ünsüz yasağında kök ve ekleri ayrı tara; “${upLetter(letter)}” sızdıran ekleri değiştir.`,
        explanation: `Ünsüz yasağı (${upLetter(letter)}) eklerde de sızabilir; kelime kökü kontrolü yetmez.`
      });
    },
    forced(id, pathId, random) {
      const letter = pick(letters, random);
      const safe = safeWord(letter, random);
      return roundChoice(id, pathId, safe, [unsafeWord(letter, random), unsafeWord(letter, random), unsafeWord(letter, random)], random, {
        raw: `Yasak ünsüz “${upLetter(letter)}”. Zorunlu güvenli kelime?`,
        explanation: `“${safe}” güvenlidir.`
      });
    },
    spot(id, pathId, random) {
      const letter = pick(letters, random);
      const bad = unsafeWord(letter, random);
      return roundChoice(id, pathId, bad, [safeWord(letter, random), safeWord(letter, random), safeWord(letter, random)], random, {
        raw: `Yasak “${upLetter(letter)}”. Hangi kelime ihlal?`,
        explanation: `“${bad}” ünsüz yasağını bozar.`
      });
    },
    compare(id, pathId, random) {
      const letter = pick(letters, random);
      const good = `Bugün ${safeWord(letter, random)} güzeldi.`;
      const bad = `Bugün ${unsafeWord(letter, random)} güzeldi.`;
      // ensure good is actually safe
      const goodSafe = isSafe(good, letter) ? good : `Bu ${safeWord(letter, random)} iyi.`;
      const badUnsafe = !isSafe(bad, letter) ? bad : `Bu ${unsafeWord(letter, random)} kötü.`;
      return roundChoice(id, pathId, goodSafe, [badUnsafe, unsafeWord(letter, random), 'YOK'], random, {
        raw: `Yasak “${upLetter(letter)}”. Hangisi geçerli kısa taslak?`,
        explanation: `Geçerli taslak yasak ünsüzü taşımaz.`
      });
    }
  });
}

// ---- 3. fs-soft-letter ----
function familySoftLetter() {
  const letters = ['ş', 'ç', 'ğ'];
  return buildFamily('fs-soft-letter', {
    select(id, pathId, random) {
      const letter = pick(letters, random);
      const topic = `Özel harf “${upLetter(letter)}” yasak. Bir sabah yürüyüşünü anlat.`;
      return roundStory(id, pathId, letter, topic, 3, 12, random, {
        raw: topic,
        strategy: 'Türkçe’de yumuşak/özel harfler eklerde sık çıkar; yazarken hece hece kontrol et.',
        explanation: `Ş/Ç/Ğ tipi yasak, yüzeyde az görünüp eklerde birikir.`
      });
    },
    forced(id, pathId, random) {
      const letter = pick(letters, random);
      const safe = safeWord(letter, random);
      return roundChoice(id, pathId, safe, [unsafeWord(letter, random), unsafeWord(letter, random), unsafeWord(letter, random)], random, {
        raw: `Yasak “${upLetter(letter)}”. Güvenli kelime?`,
        explanation: `“${safe}” özel harfi taşımaz.`
      });
    },
    spot(id, pathId, random) {
      const letter = pick(letters, random);
      const bad = unsafeWord(letter, random);
      return roundChoice(id, pathId, bad, [safeWord(letter, random), safeWord(letter, random), safeWord(letter, random)], random, {
        raw: `Yasak “${upLetter(letter)}”. İhlal hangisi?`,
        explanation: `“${bad}” yasak özel harfi içerir.`
      });
    },
    compare(id, pathId, random) {
      const letter = pick(letters, random);
      const good = `Bugun ${safeWord(letter, random)} gordum.`;
      const bad = `Bugün ${unsafeWord(letter, random)} gördüm.`;
      const g = isSafe(good, letter) ? good : safeWord(letter, random);
      const b = !isSafe(bad, letter) ? bad : unsafeWord(letter, random);
      return roundChoice(id, pathId, g, [b, unsafeWord(letter, random), 'YOK'], random, {
        raw: `Yasak “${upLetter(letter)}”. Hangisi daha güvenli?`,
        explanation: 'Özel harf sızdırmayan taslak geçerlidir.'
      });
    }
  });
}

// ---- 4. fs-topic-lock ----
function familyTopicLock() {
  const packs = [
    { letter: 'e', topic: 'Konu kilidi: yalnız “uzay” hakkında yaz; “e” yasak.', theme: 'uzay' },
    { letter: 'a', topic: 'Konu kilidi: yalnız “okul laboratuvarı”; “a” yasak.', theme: 'laboratuvar' },
    { letter: 'r', topic: 'Konu kilidi: yalnız “deniz feneri”; “r” yasak.', theme: 'fener' }
  ];
  return buildFamily('fs-topic-lock', {
    select(id, pathId, random) {
      const p = pick(packs, random);
      return roundStory(id, pathId, p.letter, p.topic, 3, 14, random, {
        raw: p.topic,
        strategy: 'Önce konu kelimelerini yasak harfsiz eşdeğerlerle yeniden yaz, sonra sahneyi kur.',
        explanation: 'Konu kilidi + harf yasağı birlikte iki kısıttır; yalnız birini sağlamak yetmez.'
      });
    },
    forced(id, pathId, random) {
      const p = pick(packs, random);
      const answer = p.theme;
      return roundChoice(id, pathId, answer, ['rastgele', 'konusuz', 'yasaksız'], random, {
        raw: `Bu ailede zorunlu konu anahtarı hangisi? (Yasak: ${upLetter(p.letter)})`,
        explanation: `Konu kilidi “${answer}”; harf yasağı ayrı kısıttır.`
      });
    },
    spot(id, pathId, random) {
      const p = pick(packs, random);
      return roundChoice(id, pathId, VIOLATION_TYPES.TOPIC, [VIOLATION_TYPES.LETTER, VIOLATION_TYPES.SENTENCE, VIOLATION_TYPES.LEXICON], random, {
        raw: `Öğrenci yasak harfi kullanmadan tamamen alakasız bir yemek tarifi yazdı. Ana ihlal türü?`,
        explanation: `Harf kuralı tutulmuş olsa da konu sapması → ${VIOLATION_TYPES.TOPIC}.`
      });
    },
    compare(id, pathId, random) {
      const p = pick(packs, random);
      const onTopic = `KONU:${p.theme}`;
      return roundChoice(id, pathId, onTopic, ['KONU:yemek', 'KONU:spor', 'KONU:yok'], random, {
        raw: `Yasak ${upLetter(p.letter)} + konu kilidi. Hangisi doğru konu etiketi?`,
        explanation: `${onTopic} aile kısıtına uyar.`
      });
    }
  });
}

// ---- 5. fs-dialogue-mode ----
function familyDialogueMode() {
  return buildFamily('fs-dialogue-mode', {
    select(id, pathId, random) {
      const letter = pick(['a', 'e', 'r'], random);
      const topic = `Diyalog zorunlu: iki karakter konuşsun. Yasak harf “${upLetter(letter)}”.`;
      return roundStory(id, pathId, letter, topic, 3, 14, random, {
        raw: topic,
        strategy: 'Önce tırnaklı kısa replikler yaz; yasak harfi replik içinde de tara.',
        explanation: 'Diyalog modu anlatıdan farklıdır: konuşma satırları da yasak harf denetimine girer.'
      });
    },
    forced(id, pathId, random) {
      const letter = 'e';
      const safe = `"${safeWord(letter, random)}?" dedi.`;
      const unsafe = `"${unsafeWord(letter, random)}?" dedi.`;
      const answer = isSafe(safe, letter) ? safe : `"Ok." dedi.`;
      const bad = !isSafe(unsafe, letter) ? unsafe : `"Ev." dedi.`;
      return roundChoice(id, pathId, answer, [bad, `"${unsafeWord(letter, random)}"`, 'YOK'], random, {
        raw: `Yasak “E”. Hangisi güvenli diyalog satırı?`,
        explanation: 'Replik içindeki harfler de yasaktır.'
      });
    },
    spot(id, pathId, random) {
      const letter = 'a';
      const bad = `"Merhaba!" dedi.`;
      return roundChoice(id, pathId, bad, [`"${safeWord(letter, random)}?"`, '"Hi!"', '"Ok."'], random, {
        raw: `Yasak “A”. Hangi diyalog satırı ihlal?`,
        explanation: `“${bad}” A harfini taşır.`
      });
    },
    compare(id, pathId, random) {
      const letter = 'r';
      const good = `"${safeWord(letter, random)}!" dedi.`;
      const bad = `"Parka gidelim." dedi.`;
      const g = isSafe(good, letter) ? good : '"Ok!" dedi.';
      const b = !isSafe(bad, letter) ? bad : `"${unsafeWord(letter, random)}!" dedi.`;
      return roundChoice(id, pathId, g, [b, 'anlatı-sadece', 'YOK'], random, {
        raw: `Yasak “R”. Hangisi geçerli diyalog taslağı?`,
        explanation: 'Diyalog + harf yasağı birlikte sağlanmalı.'
      });
    }
  });
}

// ---- 6. fs-first-person ----
function familyFirstPerson() {
  return buildFamily('fs-first-person', {
    select(id, pathId, random) {
      const letter = pick(['e', 'a', 'i'], random);
      const topic = `1. kişi anlat: “ben” bakış açısı. Yasak harf “${upLetter(letter)}”.`;
      return roundStory(id, pathId, letter, topic, 3, 12, random, {
        raw: topic,
        strategy: 'Özne olarak ben/benim formlarını yasak harfsiz kur; üçüncü kişiye kayma.',
        explanation: '1. kişi kısıtı anlatım bakışını değiştirir; yalnız harf yasağı yetmez.'
      });
    },
    forced(id, pathId, random) {
      return roundChoice(id, pathId, '1.KISI', ['3.KISI', '2.KISI', 'YOK'], random, {
        raw: 'Bu ailede zorunlu bakış açısı hangisi?',
        explanation: 'fs-first-person 1. kişi anlatım ister.'
      });
    },
    spot(id, pathId, random) {
      return roundChoice(id, pathId, 'O gitti.', ['Ben gittim.', 'Ben baktım.', 'Ben durdum.'], random, {
        raw: 'Yasak harf yok sayılsa bile hangisi 1. kişi kısıtını bozar?',
        explanation: '“O gitti.” üçüncü kişidir → bakış ihlali.'
      });
    },
    compare(id, pathId, random) {
      return roundChoice(id, pathId, 'Ben gördüm.', ['O gördü.', 'Sen gördün.', 'Onlar gördü.'], random, {
        raw: 'Hangisi 1. kişi anlatıma uyar?',
        explanation: '“Ben gördüm.” 1. kişidir.'
      });
    }
  });
}

// ---- 7. fs-past-tense ----
function familyPastTense() {
  return buildFamily('fs-past-tense', {
    select(id, pathId, random) {
      const letter = pick(['a', 'e', 'r'], random);
      const topic = `Geçmiş zaman baskısı: olan biteni anlat. Yasak “${upLetter(letter)}”.`;
      return roundStory(id, pathId, letter, topic, 3, 12, random, {
        raw: topic,
        strategy: 'Fiilleri geçmiş zamanda kur; yasak harfi eklerde (di/dı/miş) de tara.',
        explanation: 'Zaman kısıtı + harf yasağı birlikte plan ister.'
      });
    },
    forced(id, pathId, random) {
      return roundChoice(id, pathId, 'GECMIS', ['SIMDIKI', 'GELECEK', 'YOK'], random, {
        raw: 'Bu ailede zorunlu zaman hangisi?',
        explanation: 'fs-past-tense geçmiş zaman ister.'
      });
    },
    spot(id, pathId, random) {
      return roundChoice(id, pathId, 'Yarin gidecek.', ['Dun gitti.', 'O gun baktik.', 'Sonra durduk.'], random, {
        raw: 'Hangisi geçmiş zaman kısıtını bozar?',
        explanation: '“Yarin gidecek.” gelecek zamandır.'
      });
    },
    compare(id, pathId, random) {
      return roundChoice(id, pathId, 'Dun baktik.', ['Yarin bakariz.', 'Simdi bakiyoruz.', 'YOK'], random, {
        raw: 'Hangisi geçmiş zamanlı güvenli taslak örneğidir?',
        explanation: '“Dun baktik.” geçmiş zamandır.'
      });
    }
  });
}

// ---- 8. fs-sentence-quota ----
function familySentenceQuota() {
  return buildFamily('fs-sentence-quota', {
    select(id, pathId, random) {
      const letter = pick(['e', 'a'], random);
      const minSentences = pick([4, 5], random);
      const topic = `Yüksek cümle kotası: en az ${minSentences} cümle. Yasak “${upLetter(letter)}”.`;
      return roundStory(id, pathId, letter, topic, minSentences, 16, random, {
        raw: topic,
        strategy: 'Önce cümle iskeletlerini nokta ile ayır; sonra her cümlede yasak harfi tara.',
        explanation: 'Cümle kotası ayrı başarı ölçütüdür; harfsiz ama tek cümle yetmez.'
      });
    },
    forced(id, pathId, random) {
      const n = pick([4, 5], random);
      return roundChoice(id, pathId, String(n), ['1', '2', '9'], random, {
        raw: `Bu turda zorunlu minimum cümle sayısı ${n} ise cevap?`,
        explanation: `Kotanın kendisi ${n}.`
      });
    },
    spot(id, pathId, random) {
      return roundChoice(id, pathId, VIOLATION_TYPES.SENTENCE, [VIOLATION_TYPES.LETTER, VIOLATION_TYPES.LEXICON, VIOLATION_TYPES.TOPIC], random, {
        raw: 'Öğrenci yasak harfi kullanmadan yalnız 1 cümle yazdı (kota 4). Ana ihlal?',
        explanation: `Cümle kotası karşılanmadı → ${VIOLATION_TYPES.SENTENCE}.`
      });
    },
    compare(id, pathId, random) {
      return roundChoice(id, pathId, '4-CUMLE', ['1-CUMLE', '0-CUMLE', 'HARF-IHLALi'], random, {
        raw: 'Kota=4 iken hangi etiket geçerli taslağı tanımlar?',
        explanation: '4-CUMLE kotayı karşılar (harf ayrıca kontrol edilir).'
      });
    }
  });
}

// ---- 9. fs-lexicon-diversity ----
function familyLexiconDiversity() {
  return buildFamily('fs-lexicon-diversity', {
    select(id, pathId, random) {
      const letter = pick(['a', 'e', 'i'], random);
      const minUnique = pick([18, 20], random);
      const topic = `Yüksek kelime çeşitliliği: en az ${minUnique} farklı kelime. Yasak “${upLetter(letter)}”.`;
      return roundStory(id, pathId, letter, topic, 3, minUnique, random, {
        raw: topic,
        strategy: 'Aynı kelimeyi tekrar etme; yasak harfsiz eşanlamlı havuzu hazırla.',
        explanation: 'Kelime çeşit kotası tekrarlı kısa yazıyı reddeder.'
      });
    },
    forced(id, pathId, random) {
      const n = pick([18, 20], random);
      return roundChoice(id, pathId, String(n), ['3', '5', '50'], random, {
        raw: `Zorunlu minimum farklı kelime sayısı ${n} ise?`,
        explanation: `Çeşit kotası ${n}.`
      });
    },
    spot(id, pathId, random) {
      return roundChoice(id, pathId, VIOLATION_TYPES.LEXICON, [VIOLATION_TYPES.LETTER, VIOLATION_TYPES.SENTENCE, VIOLATION_TYPES.TOPIC], random, {
        raw: 'Harf ve cümle tamam; ama yalnız 6 farklı kelime kullanıldı (kota 18). İhlal?',
        explanation: `Kelime çeşit eksiği → ${VIOLATION_TYPES.LEXICON}.`
      });
    },
    compare(id, pathId, random) {
      return roundChoice(id, pathId, 'CESITLI', ['TEKRARLI', 'BOS', 'YOK'], random, {
        raw: 'Yüksek çeşit kotasında hangi strateji etiketi doğru?',
        explanation: 'CESITLI: farklı kelime havuzu büyütülür.'
      });
    }
  });
}

// ---- 10. fs-topic-letter-trap ----
function familyTopicLetterTrap() {
  const traps = [
    { letter: 'a', topicWord: 'okul', trapNote: '“okul” A taşımaz ama “bahar” A taşır — konu kelimesini seçerken tuzak kur' },
    { letter: 'e', topicWord: 'okul', trapNote: '“okul” E’siz; “defter” E’li tuzak' },
    { letter: 'r', topicWord: 'okul', trapNote: '“okul” R’siz; “park” R’li tuzak' }
  ];
  return buildFamily('fs-topic-letter-trap', {
    select(id, pathId, random) {
      const t = pick(traps, random);
      const topic = `Konu: “${t.topicWord}” etrafında yaz. Yasak “${upLetter(t.letter)}”. Konu kelimesi güvenli olsa da tuzak kelimelere düşme.`;
      return roundStory(id, pathId, t.letter, topic, 3, 12, random, {
        raw: topic,
        strategy: 'Konu güvenli diye çevresindeki yaygın kelimeleri körlemesine kullanma.',
        explanation: t.trapNote
      });
    },
    forced(id, pathId, random) {
      const t = pick(traps, random);
      return roundChoice(id, pathId, t.topicWord, [unsafeWord(t.letter, random), unsafeWord(t.letter, random), unsafeWord(t.letter, random)], random, {
        raw: `Yasak “${upLetter(t.letter)}”. Konu çekirdeği olarak güvenli kelime?`,
        explanation: `“${t.topicWord}” yasak harfi taşımaz.`
      });
    },
    spot(id, pathId, random) {
      const t = pick(traps, random);
      const bad = unsafeWord(t.letter, random);
      return roundChoice(id, pathId, bad, [t.topicWord, safeWord(t.letter, random), safeWord(t.letter, random)], random, {
        raw: `Yasak “${upLetter(t.letter)}”. Konu çevresindeki tuzak kelime hangisi?`,
        explanation: `“${bad}” yasak harfi sızdırır.`
      });
    },
    compare(id, pathId, random) {
      const t = pick(traps, random);
      return roundChoice(id, pathId, `KONU:${t.topicWord}`, [`TUZAK:${unsafeWord(t.letter, random)}`, 'KONU:yok', 'TUZAK:bos'], random, {
        raw: `Yasak ${upLetter(t.letter)}. Hangisi güvenli konu çekirdeği?`,
        explanation: 'Tuzak kelimeler konu gibi görünür ama harf sızdırır.'
      });
    }
  });
}

// ---- 11. fs-safe-substitution ----
function familySafeSubstitution() {
  return buildFamily('fs-safe-substitution', {
    select(id, pathId, random) {
      const letter = pick(['a', 'e'], random);
      const topic = `Kaçış/eşanlamlı stratejisi: yasak “${upLetter(letter)}” içeren kelimeleri güvenli eşdeğerle değiştirerek yaz.`;
      return roundStory(id, pathId, letter, topic, 3, 12, random, {
        raw: topic,
        strategy: 'Yasaklı kelime → güvenli eşdeğer sözlüğü kur, sonra metni yeniden yaz.',
        explanation: 'Safe substitution ayrı bir üretim stratejisidir; rastgele silmek değildir.'
      });
    },
    forced(id, pathId, random) {
      const letter = 'a';
      // map: araba -> oto (if safe)
      const answer = 'oto';
      return roundChoice(id, pathId, answer, ['araba', 'park', 'masa'], random, {
        raw: `Yasak “A”. “araba” için güvenli kaçış kelimesi hangisi olabilir?`,
        explanation: '“oto” A taşımaz; diğerleri taşır.'
      });
    },
    spot(id, pathId, random) {
      const letter = 'e';
      return roundChoice(id, pathId, 'ev→ev', ['okul→okul', 'balık→balık', 'top→top'], random, {
        raw: `Yasak “E”. Hangisi başarısız kaçış (aynı yasaklı kelime)?`,
        explanation: '“ev→ev” kaçış değildir; E hâlâ durur.'
      });
    },
    compare(id, pathId, random) {
      const letter = 'a';
      return roundChoice(id, pathId, 'araba→oto', ['araba→araba', 'park→park', 'masa→masa'], random, {
        raw: `Yasak “A”. Hangisi gerçek kaçış dönüşümüdür?`,
        explanation: 'araba→oto yasak harfi temizler.'
      });
    }
  });
}

// ---- 12. fs-violation-taxonomy ----
function familyViolationTaxonomy() {
  const samples = [
    { text: 'Yasak A iken: "Araba geldi."', error: VIOLATION_TYPES.LETTER },
    { text: 'Kota 4 cümle iken 1 cümle yazıldı (harf temiz).', error: VIOLATION_TYPES.SENTENCE },
    { text: 'Kota 18 kelime iken 5 farklı kelime (harf temiz).', error: VIOLATION_TYPES.LEXICON },
    { text: 'Konu uzay iken yemek tarifi yazıldı (harf temiz).', error: VIOLATION_TYPES.TOPIC }
  ];
  return buildFamily('fs-violation-taxonomy', {
    select(id, pathId, random) {
      const letter = pick(['a', 'e'], random);
      const topic = `İhlal türlerini ayırt etmeyi öğrenmek için temiz bir mini hikâye yaz. Yasak “${upLetter(letter)}”. En az 3 cümle, 12 farklı kelime.`;
      return roundStory(id, pathId, letter, topic, 3, 12, random, {
        raw: topic,
        strategy: 'Yazarken harf / cümle / çeşit / konu kontrollerini ayrı ayrı yap.',
        explanation: 'Dört ihlal türü choice iskeletlerinde ayrı sorulur.'
      });
    },
    forced(id, pathId, random) {
      const s = pick(samples, random);
      return roundChoice(id, pathId, s.error, Object.values(VIOLATION_TYPES).filter((e) => e !== s.error), random, {
        raw: `${s.text} Zorunlu ihlal etiketi?`,
        explanation: `→ ${s.error}`
      });
    },
    spot(id, pathId, random) {
      const s = pick(samples, random);
      return roundChoice(id, pathId, s.error, shuffle(Object.values(VIOLATION_TYPES).filter((e) => e !== s.error), random).slice(0, 3), random, {
        raw: `Durum: ${s.text} Hangi ihlal?`,
        explanation: `Doğru etiket: ${s.error}`
      });
    },
    compare(id, pathId, random) {
      const a = pick(samples, random);
      let b = pick(samples, random);
      while (b.error === a.error) b = pick(samples, random);
      const answer = `${a.error}|${b.error}`;
      const distractors = [
        `${b.error}|${a.error}`,
        `${VIOLATION_TYPES.LETTER}|${VIOLATION_TYPES.LETTER}`,
        `${VIOLATION_TYPES.TOPIC}|${VIOLATION_TYPES.TOPIC}`
      ].filter((x) => x !== answer);
      return roundChoice(id, pathId, answer, distractors.slice(0, 3), random, {
        raw: `A: ${a.text} · B: ${b.text}. Etiket çifti (A|B)?`,
        explanation: `A→${a.error}, B→${b.error}.`
      });
    }
  });
}

export const FORBIDDEN_STORY_FAMILIES = [
  familyVowelBan(),
  familyConsonantBan(),
  familySoftLetter(),
  familyTopicLock(),
  familyDialogueMode(),
  familyFirstPerson(),
  familyPastTense(),
  familySentenceQuota(),
  familyLexiconDiversity(),
  familyTopicLetterTrap(),
  familySafeSubstitution(),
  familyViolationTaxonomy()
];

export { isSafe, safeWord, unsafeWord };
