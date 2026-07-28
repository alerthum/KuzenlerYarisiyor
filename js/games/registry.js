import {
  FORBIDDEN_STORY_PROMPTS,
  MEANING_QUESTIONS,
  PARAGRAPH_QUESTIONS,
  WORD_DICTIONARY,
  WORD_LADDERS,
  WORD_MINE_SETS
} from '../content.js';
import {
  ENGLISH_WORDS,
  EXTRA_FORBIDDEN_STORY_PROMPTS,
  EXTRA_MEANING_QUESTIONS,
  EXTRA_PARAGRAPH_QUESTIONS,
  EXTRA_TURKISH_WORDS,
  EXTRA_WORD_LADDERS,
  EXTRA_WORD_MINE_SETS,
  LOGIC_QUESTIONS_V2,
  SCIENCE_QUESTIONS,
  SCIENCE_REASONING_QUESTIONS
} from '../content-v2.js';
import {
  ENGLISH_SENTENCE_ACTIVITIES,
  LADDER_WORDS_V3,
  LGS_FOUNDATION_QUESTIONS,
  OFFICIAL_LGS_ARCHIVE,
  RELIGION_QUESTIONS,
  SOCIAL_QUESTIONS,
  WORD_LADDER_PATHS_V3,
  englishExamplePair,
  englishExampleTranslation
} from '../content-v3.js';
import { difficultyFromRating } from '../engines/adaptive-engine.js';
import { isOneLetterChange } from '../engines/word-engine.js';
import { createSocialRound } from '../engines/social-engine.js';
import {
  createArithmeticRound,
  createErrorRound,
  createGeometryRound,
  createOlympiadRound,
  createPatternRound,
  createProblemRound,
  createTargetRound
} from '../engines/math-engine.js';
import { createLogicRound } from '../engines/logic-engine.js';
import { createV4LogicSession, createV4OlympiadSession, createV4ParagraphSession } from '../engines/learning-engine-v4.js';
import { hashString, pick, seededRandom, shuffle } from '../utils.js';
import { EXAM_QUESTIONS_V53 } from '../content-exams-v53.js';

const ALL_WORD_MINE_SETS = [...WORD_MINE_SETS, ...EXTRA_WORD_MINE_SETS];
const BASE_VALID_V3_LADDER_PATHS = WORD_LADDER_PATHS_V3.filter((path) => path.length >= 3 && path.every((word) => word.length === path[0].length) && path.slice(0, -1).every((word, index) => isOneLetterChange(word, path[index + 1])));
const VALID_V3_LADDER_PATHS = [...new Map(BASE_VALID_V3_LADDER_PATHS.flatMap((path) => {
  const variants = [];
  for (let start = 0; start < path.length - 2; start += 1) {
    for (let end = start + 2; end < path.length; end += 1) {
      const sub = path.slice(start, end + 1);
      variants.push(sub, [...sub].reverse());
    }
  }
  return variants;
}).map((path) => [path.join('|'), path])).values()];
const ALL_WORD_LADDERS = [...WORD_LADDERS, ...EXTRA_WORD_LADDERS];
const ALL_FORBIDDEN_PROMPTS = [...FORBIDDEN_STORY_PROMPTS, ...EXTRA_FORBIDDEN_STORY_PROMPTS];
const ALL_MEANING_QUESTIONS = [...MEANING_QUESTIONS, ...EXTRA_MEANING_QUESTIONS];
const ALL_PARAGRAPH_QUESTIONS = [...PARAGRAPH_QUESTIONS, ...EXTRA_PARAGRAPH_QUESTIONS];
const ALL_WORD_DICTIONARY = [...new Set([
  ...WORD_DICTIONARY,
  ...EXTRA_TURKISH_WORDS,
  ...ALL_WORD_MINE_SETS.flatMap((set) => [set.source, ...set.allowed]),
  ...ALL_WORD_LADDERS.flatMap((ladder) => [ladder.start, ...ladder.steps, ladder.end]),
  ...LADDER_WORDS_V3,
  ...VALID_V3_LADDER_PATHS.flat()
])];

export const GAME_CATALOG = [

  { id:'lgs-focus', title:'LGS Akıllı Çalışma', shortTitle:'LGS', category:'lgs', skill:'lgsFamiliarity', icon:'🎓', color:'rgba(251,113,133,.82)', description:'7–8. sınıf kazanımlarını yeni nesil sorularla ve açıklamalı çözümlerle çalış.', minAge:12, maxAge:14, duration:'12–18 dk', sessionLength:8 },
  { id:'tyt-focus', title:'TYT Akıllı Çalışma', shortTitle:'TYT', category:'exam', skill:'problemSolving', icon:'🧭', color:'rgba(34,211,238,.82)', description:'Türkçe, temel matematik, sosyal ve fen muhakemesini TYT düzeyinde çalış.', minAge:16, maxAge:19, duration:'15–20 dk', sessionLength:8 },
  { id:'ayt-focus', title:'AYT Alan Çalışması', shortTitle:'AYT', category:'exam', skill:'problemSolving', icon:'🎯', color:'rgba(167,139,250,.82)', description:'11–12. sınıf alan derslerinde kavram ve çok adımlı çözüm çalış.', minAge:16, maxAge:19, duration:'15–20 dk', sessionLength:8 },
  { id:'kpss-focus', title:'KPSS Genel Yetenek–Kültür', shortTitle:'KPSS', category:'exam', skill:'attention', icon:'🏛️', color:'rgba(249,115,22,.82)', description:'Genel yetenek ve genel kültür sorularını ayrı çalışma planında çöz.', minAge:17, maxAge:99, duration:'15–20 dk', sessionLength:8 },

  {
    id: 'word-mine', title: 'Kelime Madeni', shortTitle: 'Kelime Madeni', category: 'turkish', skill: 'vocabulary', icon: '⛏️',
    color: 'rgba(34, 211, 238, .75)', description: 'Uzun bir kelimenin harflerinden yeni ve anlamlı kelimeler çıkar.',
    minAge: 8, maxAge: 19, duration: '2–3 dk', sessionLength: 1
  },
  {
    id: 'word-ladder', title: 'Kelime Merdiveni', shortTitle: 'Kelime Merdiveni', category: 'turkish', skill: 'vocabulary', icon: '🪜',
    color: 'rgba(167, 139, 250, .78)', description: 'Her adımda tek harfi değiştirerek hedef kelimeye ulaş.',
    minAge: 8, maxAge: 19, duration: '8–12 dk', sessionLength: 10
  },
  {
    id: 'forbidden-story', title: 'Yasak Harf Hikâyesi', shortTitle: 'Yasak Harf', category: 'turkish', skill: 'vocabulary', icon: '✍️',
    color: 'rgba(249, 115, 22, .82)', description: 'Belirlenen harfi hiç kullanmadan yaratıcı bir mini hikâye yaz.',
    minAge: 8, maxAge: 19, duration: '4 dk', sessionLength: 1
  },
  {
    id: 'meaning-hunt', title: 'Anlam Avı', shortTitle: 'Anlam Avı', category: 'turkish', skill: 'vocabulary', icon: '🎯',
    color: 'rgba(52, 211, 153, .75)', description: 'Sözcüğün cümle içinde kazandığı gerçek veya mecaz anlamı yakala.',
    minAge: 8, maxAge: 19, duration: '4 dk', sessionLength: 5
  },
  {
    id: 'paragraph-detective', title: 'Paragraf Dedektifi', shortTitle: 'Paragraf', category: 'turkish', skill: 'reading', icon: '🔎',
    color: 'rgba(56, 189, 248, .8)', description: 'Ana düşünceyi, çıkarımı, kanıtı ve gereksiz bilgiyi metnin içinden bul.',
    minAge: 8, maxAge: 19, duration: '10–14 dk', sessionLength: 8
  },
  {
    id: 'target-number', title: 'Hedef Sayı', shortTitle: 'Hedef Sayı', category: 'math', skill: 'arithmetic', icon: '🎲',
    color: 'rgba(249, 115, 22, .82)', description: 'Tüm sayıları birer kez kullan; istediğin dört işlem ve parantezlerle hedefe ulaş.',
    minAge: 8, maxAge: 19, duration: '5 dk', sessionLength: 4
  },
  {
    id: 'speed-math', title: 'Hızlı İşlem Arenası', shortTitle: 'Hızlı İşlem', category: 'math', skill: 'arithmetic', icon: '⚡',
    color: 'rgba(250, 204, 21, .82)', description: 'Dört işlemi dikkatli ve seri biçimde çöz; hız kadar doğruluk da önemli.',
    minAge: 8, maxAge: 19, duration: '3 dk', sessionLength: 8
  },
  {
    id: 'pattern-lab', title: 'Örüntü Laboratuvarı', shortTitle: 'Örüntü', category: 'math', skill: 'patterns', icon: '🧬',
    color: 'rgba(167, 139, 250, .78)', description: 'Tek, çift ve büyüyen kurallı sayı dizilerinin gizli düzenini keşfet.',
    minAge: 8, maxAge: 19, duration: '4 dk', sessionLength: 5
  },
  {
    id: 'problem-hunter', title: 'Yeni Nesil Problem Avcısı', shortTitle: 'Problem Avcısı', category: 'math', skill: 'problemSolving', icon: '🧭',
    color: 'rgba(34, 211, 238, .78)', description: 'Uzun sorudaki önemli veriyi seç, ilişkiyi kur ve sonuca ulaş.',
    minAge: 8, maxAge: 19, duration: '7 dk', sessionLength: 5
  },
  {
    id: 'geometry-lab', title: 'Geometri İnşa Alanı', shortTitle: 'Geometri', category: 'math', skill: 'geometry', icon: '📐',
    color: 'rgba(52, 211, 153, .75)', description: 'Alan, çevre, hacim ve açı ilişkilerini dinamik görsellerle çöz.',
    minAge: 8, maxAge: 19, duration: '6 dk', sessionLength: 6
  },
  {
    id: 'error-detective', title: 'Yanlış Çözümü Yakala', shortTitle: 'Hata Avı', category: 'math', skill: 'attention', icon: '🚨',
    color: 'rgba(251, 113, 133, .82)', description: 'Çözüm satırlarını incele ve ilk matematik hatasını işaretle.',
    minAge: 8, maxAge: 19, duration: '4 dk', sessionLength: 5
  },
  {
    id: 'olympiad-ladder', title: 'Olimpiyat Merdiveni', shortTitle: 'Olimpiyat', category: 'olympiad', skill: 'olympiad', icon: '🏆',
    color: 'rgba(249, 115, 22, .86)', description: 'Kalan, sayma, tek-çift ve strateji sorularını kademeli ipuçlarıyla öğren.',
    minAge: 8, maxAge: 19, duration: '15–20 dk', sessionLength: 10
  },
  {
    id: 'logic-station', title: 'Zekâ İstasyonu', shortTitle: 'Zekâ', category: 'logic', skill: 'verbalLogic', icon: '🧠',
    color: 'rgba(167, 139, 250, .82)', description: 'Her oturumda farklı ailelerden çok koşullu sıralama, eşleştirme, kod ve çıkarım soruları çöz.',
    minAge: 8, maxAge: 19, duration: '12–16 dk', sessionLength: 8
  },
  {
    id: 'english-vocabulary', title: 'Günün 20 İngilizce Kelimesi', shortTitle: '20 İngilizce', category: 'english', skill: 'englishVocabulary', icon: '🌍',
    color: 'rgba(56, 189, 248, .82)', description: 'Her gün daha önce görmediğin 20 kelimeyi örnek cümle ve mini testle öğren.',
    minAge: 8, maxAge: 19, duration: '10–15 dk', sessionLength: 20
  },
  {
    id: 'english-cloze', title: 'İngilizce Boşluk Avı', shortTitle: 'Boşluk Avı', category: 'english', skill: 'englishGrammar', icon: '🧩',
    color: 'rgba(52, 211, 153, .82)', description: 'Cümlenin anlamına göre eksik İngilizce kelimeyi seç; Türkçe karşılığı ipucunda gör.',
    minAge: 8, maxAge: 19, duration: '8 dk', sessionLength: 10
  },
  {
    id: 'english-sentence-builder', title: 'İngilizce Cümle Kurucu', shortTitle: 'Cümle Kurucu', category: 'english', skill: 'englishGrammar', icon: '🧱',
    color: 'rgba(167, 139, 250, .82)', description: 'Karışık kelimelere sırayla dokunarak doğru İngilizce cümleyi oluştur.',
    minAge: 8, maxAge: 19, duration: '8 dk', sessionLength: 10
  },
  {
    id: 'social-time-travel', title: 'Zaman Yolculuğu', shortTitle: 'Zaman Yolculuğu', category: 'social', skill: 'socialHistory', icon: '🏺',
    color: 'rgba(249, 115, 22, .78)', description: 'Tarihî kaynak, kronoloji, kültür ve neden-sonuç sorularını çöz.',
    minAge: 8, maxAge: 19, duration: '8 dk', sessionLength: 10
  },
  {
    id: 'social-map-skills', title: 'Harita ve Dünya', shortTitle: 'Harita ve Dünya', category: 'social', skill: 'socialGeography', icon: '🗺️',
    color: 'rgba(34, 211, 238, .78)', description: 'Yön, ölçek, iklim, nüfus ve çevre ilişkilerini yorumla.',
    minAge: 8, maxAge: 19, duration: '8 dk', sessionLength: 10
  },
  {
    id: 'social-citizenship', title: 'Aktif Vatandaş', shortTitle: 'Aktif Vatandaş', category: 'social', skill: 'citizenship', icon: '🤝',
    color: 'rgba(52, 211, 153, .78)', description: 'Hak, sorumluluk, bütçe, medya okuryazarlığı ve katılım kararları ver.',
    minAge: 8, maxAge: 19, duration: '8 dk', sessionLength: 10
  },
  {
    id: 'religion-practice', title: 'Din Kültürü Öğrenme Alanı', shortTitle: 'Din Kültürü', category: 'religion', skill: 'religion', icon: '📚',
    color: 'rgba(250, 204, 21, .76)', description: 'LGS kazanımlarını açıklamalı seçeneklerle çalış. Bu bölüm XP kazandırmaz.',
    minAge: 12, maxAge: 19, duration: '10 dk', sessionLength: 10, rewardEligible: false
  },
  {
    id: 'lgs-foundation', title: 'LGS Soru Kalıbı Arşivi', shortTitle: 'LGS Kalıpları', category: 'lgs', skill: 'lgsFamiliarity', icon: '🎓',
    color: 'rgba(251, 113, 133, .78)', description: 'Tüm derslerden karışık, 5–7. sınıf temelli özgün LGS kalıpları ve ayrıntılı seçenek analizi. XP kazandırmaz.',
    minAge: 12, maxAge: 19, duration: '15 dk', sessionLength: 10, rewardEligible: false, officialArchive: OFFICIAL_LGS_ARCHIVE
  },
  {
    id: 'science-lab', title: 'Fen Bilimleri Laboratuvarı', shortTitle: 'Fen Bilimleri', category: 'science', skill: 'science', icon: '🔬',
    color: 'rgba(52, 211, 153, .82)', description: 'Madde, canlılar, kuvvet, enerji ve Dünya konularını oyunla tekrar et.',
    minAge: 8, maxAge: 19, duration: '6 dk', sessionLength: 6
  },
  {
    id: 'science-reasoning', title: 'Deney Dedektifi', shortTitle: 'Deney Dedektifi', category: 'science', skill: 'scientificReasoning', icon: '🧪',
    color: 'rgba(34, 211, 238, .78)', description: 'Deney düzeneklerini incele, değişkenleri ve bilimsel sonucu doğru yorumla.',
    minAge: 8, maxAge: 19, duration: '6 dk', sessionLength: 5
  }
];

const GRADE_RULES = {
  'word-ladder': { minGrade: 1, maxGrade: 8 },
  'religion-practice': { minGrade: 8, maxGrade: 12 },
  'lgs-foundation': { minGrade: 8, maxGrade: 8 },
  'lgs-focus': { minGrade: 7, maxGrade: 8 },
  'tyt-focus': { minGrade: 11, maxGrade: 12 },
  'ayt-focus': { minGrade: 11, maxGrade: 12 },
  'kpss-focus': { minGrade: 11, maxGrade: 12 }
};

for (const game of GAME_CATALOG) {
  const rule = GRADE_RULES[game.id] || {};
  game.minGrade = rule.minGrade ?? 1;
  game.maxGrade = rule.maxGrade ?? 12;
}

export function isGameAvailableForProfile(game, profile) {
  if (!game || !profile) return false;
  const grade = Number(profile.grade || Math.max(1, profile.age - 5));
  return game.minAge <= profile.age && game.maxAge >= profile.age && game.minGrade <= grade && game.maxGrade >= grade;
}

export function getGame(gameId) {
  return GAME_CATALOG.find((game) => game.id === gameId) || null;
}

function eligible(items, age) {
  return items.filter((item) => (item.minAge || 0) <= age && (item.maxAge || 99) >= age);
}

function questionKey(gameId, question) {
  if (question.questionKey) return question.questionKey;
  const signature = [question.prompt, question.context || '', ...(question.options || question.steps || []), question.source || '', question.target || ''].join('|');
  return `${gameId}:${hashString(signature).toString(36)}`;
}

function toChoiceRound(question, game, difficulty) {
  const options = question.options || [];
  const answerIndex = question.answerValue !== undefined
    ? options.indexOf(String(question.answerValue))
    : question.answer;
  return {
    kind: 'choice',
    prompt: question.prompt,
    context: question.context || '',
    options,
    answerIndex,
    explanation: question.explanation,
    hints: question.hints || [],
    visual: question.visual || null,
    detailedOptions: question.detailedOptions || question.optionExplanations || null,
    sourceLabel: question.sourceLabel || null,
    timeLimit: question.timeLimit || null,
    skill: game.skill,
    difficulty,
    questionKey: questionKey(game.id, question),
    familyId: question.familyId || null,
    cognitiveDepth: question.cognitiveDepth || difficulty,
    curriculumRole: question.curriculumRole || 'current',
    targetGrade: question.targetGrade || null,
    qualityScore: question.qualityScore || null
  };
}

function unseenRounds(items, game, difficulty, age, random, seen, count, mapper = (question) => question) {
  const selected = [];
  const sessionKeys = new Set();
  for (const item of shuffle(eligible(items, age), random)) {
    const round = toChoiceRound(mapper(item), game, difficulty);
    if (seen.has(round.questionKey) || sessionKeys.has(round.questionKey)) continue;
    selected.push(round);
    sessionKeys.add(round.questionKey);
    if (selected.length >= count) break;
  }
  return selected;
}

function generateUniqueRounds({ count, seed, seen, generator, convert }) {
  const rounds = [];
  const sessionKeys = new Set();
  for (let attempt = 0; rounds.length < count && attempt < count * 150; attempt += 1) {
    const generated = generator(seed + attempt * 7919);
    const round = convert(generated, attempt);
    if (!round.questionKey) throw new Error('Üretilen turda questionKey eksik.');
    if (seen.has(round.questionKey) || sessionKeys.has(round.questionKey)) continue;
    rounds.push(round);
    sessionKeys.add(round.questionKey);
  }
  return rounds;
}

function createEnglishRounds(profile, game, difficulty, random, seen, preferredIds = []) {
  const ageWords = eligible(ENGLISH_WORDS, profile.age);
  const byId = new Map(ageWords.map((word) => [word.id, word]));
  const preferred = preferredIds.map((id) => byId.get(id)).filter(Boolean);
  const preferredSet = new Set(preferred.map((word) => word.id));
  const candidates = [...preferred, ...shuffle(ageWords.filter((word) => !preferredSet.has(word.id)), random)];
  const rounds = [];

  for (const word of candidates) {
    const key = `english-vocabulary:${word.id}`;
    if (seen.has(key)) continue;
    const distractors = shuffle(ageWords.filter((item) => item.id !== word.id && item.meaning !== word.meaning), random)
      .slice(0, 3)
      .map((item) => item.meaning);
    const options = shuffle([word.meaning, ...distractors], random);
    const examplePair = englishExamplePair(word);
    const exampleTr = examplePair.turkish;
    rounds.push({
      kind: 'choice',
      prompt: `“${word.word}” kelimesinin Türkçesi hangisidir?`,
      context: 'Önce tahmin et. Cevaptan sonra İngilizce örnek cümleyi ve Türkçe anlamını birlikte göreceksin.',
      options,
      answerIndex: options.indexOf(word.meaning),
      explanation: `${word.word} = ${word.meaning}. İngilizce örnek: ${examplePair.english} Türkçesi: ${exampleTr}`,
      hints: [`Türkçe anlamı “${word.meaning[0].toLocaleUpperCase('tr-TR')}” harfiyle başlıyor.`, `Örnek cümlenin Türkçesi: ${exampleTr}`],
      visual: null, skill: game.skill, difficulty, questionKey: key, wordId: word.id,
      answerDetail: { english: examplePair.english, turkish: exampleTr }
    });
    if (rounds.length >= game.sessionLength) break;
  }
  return rounds;
}

function createEnglishActivityRounds(gameId, profile, game, difficulty, random, seen) {
  const generatedFromWords = eligible(ENGLISH_WORDS, profile.age).map((word) => {
    const pair = englishExamplePair(word);
    return { minAge: word.minAge || 8, en: pair.english, tr: pair.turkish, blank: word.word };
  });
  const items = shuffle([...ENGLISH_SENTENCE_ACTIVITIES, ...generatedFromWords], random);
  const rounds = [];
  for (const item of items) {
    if (gameId === 'english-cloze') {
      const key = `english-cloze:${hashString(item.en).toString(36)}`;
      if (seen.has(key)) continue;
      const words = item.en.replace(/[.!?]/g, '').split(/\s+/);
      const answer = item.blank;
      const candidatePool = [...new Set([...words, 'always','because','before','after','carefully','usually','quickly'])]
        .filter((word) => word.toLocaleLowerCase('en-US') !== answer.toLocaleLowerCase('en-US'));
      const candidates = shuffle(candidatePool, random).slice(0, 3);
      const options = shuffle([answer, ...candidates], random);
      const prompt = item.en.replace(new RegExp(`\\b${answer}\\b`, 'i'), '_____');
      rounds.push({ kind:'choice', prompt, context:'Boşluğa anlam ve dil bilgisi bakımından en uygun kelimeyi seç.', options, answerIndex:options.indexOf(answer), explanation:`Doğru cümle: ${item.en} Türkçesi: ${item.tr}`, hints:[`Türkçesi: ${item.tr}`, `Eksik kelime “${answer[0].toUpperCase()}” harfiyle başlar.`], skill:game.skill, difficulty, questionKey:key, timeLimit:90 });
    } else {
      const key = `english-sentence-builder:${hashString(item.en).toString(36)}`;
      if (seen.has(key)) continue;
      const answerTokens = item.en.replace(/[.!?]/g, '').split(/\s+/);
      rounds.push({ kind:'wordOrder', prompt:'Kelimelere doğru sırayla dokunarak İngilizce cümleyi kur.', context:`Türkçesi: ${item.tr}`, tokens:shuffle(answerTokens.map((value,index)=>({id:`${index}-${value}`,value})), random), answerTokens, explanation:`Doğru cümle: ${item.en} Türkçesi: ${item.tr}`, hints:[`Cümlenin Türkçesi: ${item.tr}`, `İlk kelime: ${answerTokens[0]}`], skill:game.skill, difficulty, questionKey:key, timeLimit:120 });
    }
    if (rounds.length >= game.sessionLength) break;
  }
  return rounds;
}


function intBetween(random, min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function createReligionVariant(seed) {
  const random = seededRandom(seed);
  const modes = ['tevekkul','zekat','istishare','emanet','israf','irade'];
  const mode = pick(modes, random);
  const templates = {
    tevekkul: {
      context: 'Bir öğrenci planını yapıyor, düzenli çalışıyor, eksiklerini tamamlıyor ve sınavdan sonra sonucu sakinlikle karşılıyor.',
      prompt: 'Bu davranış hangi kavramla en iyi açıklanır?', answer: 'Tevekkül',
      options: ['Tevekkül','İsraf','Gıybet','Kibir'],
      explanation: 'Tevekkül; gerekli çabayı gösterdikten sonra sonucu Allah’a bırakmaktır.',
      detailedOptions: ['Doğru: Çaba ve güven birlikte bulunur.','İsraf gereksiz tüketimdir.','Gıybet başkasının arkasından konuşmaktır.','Kibir kendini üstün görmektir.']
    },
    zekat: {
      context: `Bir mahallede ${intBetween(random, 3, 9)} aile, ihtiyaç sahipleri için düzenli yardım havuzu oluşturuyor.`,
      prompt: 'Bu davranışın toplumsal sonucu hangisidir?', answer: 'Dayanışmayı güçlendirmesi',
      options: ['Dayanışmayı güçlendirmesi','İsrafı artırması','İnsanları yalnızlaştırması','Hakları ortadan kaldırması'],
      explanation: 'Paylaşma ve yardımlaşma toplumsal dayanışmayı güçlendirir.',
      detailedOptions: ['Doğru seçenek.','Yardım israf değil, ihtiyaç sahibini desteklemedir.','Yardımlaşma insanları yakınlaştırır.','Yardımlaşma hakları ortadan kaldırmaz.']
    },
    istishare: {
      context: 'Bir ekip önemli karar öncesinde herkesin görüşünü dinliyor, kanıtları karşılaştırıyor ve ortak karar veriyor.',
      prompt: 'Bu tutum hangi kavrama örnektir?', answer: 'İstişare',
      options: ['İstişare','Önyargı','İsraf','Gıybet'],
      explanation: 'Bir konuda başkalarının görüşüne başvurmak istişaredir.',
      detailedOptions: ['Doğru seçenek.','Önyargı kanıtsız peşin hükümdür.','İsraf kaynakların gereksiz kullanımıdır.','Gıybet başkasının arkasından konuşmaktır.']
    },
    emanet: {
      context: 'Bir öğrenci ödünç aldığı kitabı temiz tutup zamanında sahibine geri veriyor.',
      prompt: 'Bu davranış hangi değeri gösterir?', answer: 'Emanete riayet',
      options: ['Emanete riayet','İsraf','Kibir','Önyargı'],
      explanation: 'Kendisine bırakılan şeyi koruyup zamanında teslim etmek emanete riayettir.',
      detailedOptions: ['Doğru seçenek.','İsraf gereksiz harcamadır.','Kibir üstünlük duygusudur.','Önyargı kanıtsız yargıdır.']
    },
    israf: {
      context: `Bir kişi ihtiyacı olmadığı hâlde kullanılabilir ${intBetween(random, 3, 8)} defteri çöpe atıyor.`,
      prompt: 'Bu davranış en çok hangi kavramla ilişkilidir?', answer: 'İsraf',
      options: ['İsraf','Tevekkül','İstişare','Sadaka'],
      explanation: 'Kullanılabilir kaynakları gereksiz yere tüketmek veya atmak israftır.',
      detailedOptions: ['Doğru seçenek.','Tevekkül çaba sonrası güvenmektir.','İstişare görüş alışverişidir.','Sadaka iyilik ve yardımdır.']
    },
    irade: {
      context: 'Bir öğrenci arkadaşlarının baskısına rağmen doğru olduğuna inandığı davranışı seçiyor.',
      prompt: 'İnsanın seçenekler arasında karar verebilme gücü hangisidir?', answer: 'İrade',
      options: ['İrade','Ecel','Rızık','Hicret'],
      explanation: 'İrade, insanın seçenekler arasında tercih yapabilme gücüdür.',
      detailedOptions: ['Doğru seçenek.','Ecel yaşamın sona erdiği vakittir.','Rızık canlıların yararlandığı nimetlerdir.','Hicret göç anlamındadır.']
    }
  };
  const item = templates[mode];
  const options = shuffle(item.options, random);
  const orderedDetails = options.map((option) => item.detailedOptions[item.options.indexOf(option)]);
  return { ...item, options, answerValue: item.answer, detailedOptions: orderedDetails, timeLimit: 120 };
}

function createLgsFoundationVariant(seed) {
  const random = seededRandom(seed);
  const mode = pick(['mathRatio','mathPattern','scienceExperiment','turkishInference','socialCause','englishDialogue'], random);
  if (mode === 'mathRatio') {
    const k = intBetween(random, 3, 9), a = intBetween(random, 2, 5), b = intBetween(random, a + 1, 8);
    const answer = b * k;
    const options = shuffle([answer, a * k, (a + b) * k, answer + k].map(String), random);
    return { subject:'Matematik', foundation:'5-7. sınıf', context:`Bir kutudaki kırmızı ve mavi taşların oranı ${a}:${b} ve kırmızı taş sayısı ${a*k}’dır.`, prompt:'Mavi taş sayısı kaçtır?', options, answerValue:String(answer), explanation:`Oranın bir birimi ${a*k} ÷ ${a} = ${k}. Mavi sayısı ${b} × ${k} = ${answer}.`, detailedOptions:options.map(o=>o===String(answer)?'Doğru: Oranın birim değeri bulunup mavi payıyla çarpılır.':'Bu değer oran birimini veya toplamı yanlış kullanır.'), timeLimit:150 };
  }
  if (mode === 'mathPattern') {
    const start=intBetween(random,2,9), diff=intBetween(random,3,8), seq=Array.from({length:4},(_,i)=>start+i*diff), answer=start+4*diff;
    const options=shuffle([answer,answer-diff,answer+1,answer+diff].map(String),random);
    return { subject:'Matematik', foundation:'5-6. sınıf', context:`${seq.join(' • ')} • ?`, prompt:'Örüntüde soru işareti yerine hangi sayı gelmelidir?', options, answerValue:String(answer), explanation:`Her adımda ${diff} ekleniyor; ${seq.at(-1)} + ${diff} = ${answer}.`, detailedOptions:options.map(o=>o===String(answer)?'Doğru: Sabit artış kuralı uygulanmıştır.':'Bu seçenek sabit artış kuralını doğru sürdürmez.'), timeLimit:100 };
  }
  if (mode === 'scienceExperiment') {
    const temperatures=[10,20,30,40], best=pick(temperatures,random); const options=temperatures.map(v=>`${v} °C`);
    return { subject:'Fen Bilimleri', foundation:'5-7. sınıf', context:`Özdeş dört bitki aynı ışık ve su miktarında, sırasıyla ${temperatures.join(', ')} °C ortamlarda tutuluyor. En hızlı büyüme ${best} °C’de ölçülüyor.`, prompt:'Bu deneyde değiştirilen bağımsız değişken hangisidir?', options:['Ortam sıcaklığı','Su miktarı','Bitki türü','Işık süresi'], answerValue:'Ortam sıcaklığı', explanation:'Deneyde yalnız sıcaklık değiştirilmiş; diğer koşullar sabit tutulmuştur.', detailedOptions:['Doğru: Araştırmacının değiştirdiği değişkendir.','Sabit tutulmuştur.','Özdeş bitkiler kullanılmıştır.','Aynı tutulmuştur.'], timeLimit:130 };
  }
  if (mode === 'turkishInference') {
    const contexts=[
      'Bir öğrenci, uzun metinleri küçük bölümlere ayırıp her bölümün yanına bir anahtar sözcük yazdığında metni daha iyi hatırladığını fark etti.',
      'Bir ekip ilk tasarımın hatalarını kaydedip ikinci tasarımda bu verileri kullandığında daha dayanıklı bir ürün elde etti.',
      'Bir mahallede yürüyüş yolları arttıkça kısa mesafelerde araç kullanımı azaldı.'
    ]; const context=pick(contexts,random);
    const options=['Planlı bir yöntem öğrenmeyi ve çözümü destekleyebilir.','İlk deneme her zaman kusursuzdur.','Bütün sorunların tek nedeni zamandır.','Kanıtları incelemek gereksizdir.'];
    return { subject:'Türkçe', foundation:'6-7. sınıf', context, prompt:'Bu parçadan çıkarılabilecek en güçlü yargı hangisidir?', options, answerValue:options[0], explanation:'Parçada yöntem veya veriye dayalı iyileştirmenin olumlu sonucu vurgulanır.', detailedOptions:['Doğru: Metindeki neden-sonuçla uyumludur.','Metin bunun tersini gösterir.','Böyle bir genelleme yoktur.','Metin kanıt ve yöntemin yararını gösterir.'], timeLimit:160 };
  }
  if (mode === 'socialCause') {
    const options=['Ulaşım olanakları ekonomik faaliyet ve göçü etkileyebilir.','Nüfus yalnız hava durumuna göre değişir.','Üretim ile ulaşım arasında ilişki yoktur.','Göç her zaman üretimi azaltır.'];
    return { subject:'Sosyal Bilgiler', foundation:'5-7. sınıf', context:'Yeni bir ulaşım hattı açılan şehirde işletme sayısı ve çevre yerleşimlerden gelen nüfus artmıştır.', prompt:'Bu olaylar arasındaki ilişkiyi en iyi açıklayan seçenek hangisidir?', options, answerValue:options[0], explanation:'Ulaşımın kolaylaşması ticareti ve iş imkânlarını artırarak göçü çekebilir.', detailedOptions:['Doğru neden-sonuç ilişkisidir.','Metinde iklimden söz edilmez.','Veriler bunun tersini gösterir.','Her zaman ifadesi ve azalma iddiası desteklenmez.'], timeLimit:150 };
  }
  const options=['I am sorry, I can’t.','Sure, I would love to.','That is a great idea.','Of course, let’s go.'];
  return { subject:'İngilizce', foundation:'5-7. sınıf', context:'Alex: “Would you like to come to the library?”\nMina: “____ I have a doctor appointment.”', prompt:'Boşluğa hangi ifade gelmelidir?', options, answerValue:options[0], explanation:'Mina bir mazeret belirttiği için daveti nazikçe reddetmelidir.', detailedOptions:['Doğru: Nazik ret ifadesidir.','Daveti kabul eder.','Olumlu değerlendirme, ret değildir.','Daveti kabul eder.'], timeLimit:120 };
}

export function createGameSession(gameId, profile, sessionSeed = Date.now(), options = {}) {
  const game = getGame(gameId);
  if (!game) throw new Error('Oyun bulunamadı.');
  if (!isGameAvailableForProfile(game, profile)) throw new Error('Bu oyun seçili sınıf düzeyinde kullanılamaz.');
  const skillRating = profile.skills?.[game.skill] || 35;
  const difficulty = difficultyFromRating(profile.age, skillRating);
  const seed = hashString(`${profile.id}-${gameId}-${sessionSeed}`);
  const random = seededRandom(seed);
  const seen = options.seenQuestionKeys instanceof Set ? options.seenQuestionKeys : new Set(options.seenQuestionKeys || []);
  let rounds = [];

  if (gameId === 'word-mine') {
    const candidates = shuffle(eligible(ALL_WORD_MINE_SETS, profile.age), random);
    const set = candidates.find((item) => !seen.has(`word-mine:${item.source.toLocaleLowerCase('tr-TR')}`));
    if (set) {
      rounds = [{
        kind: 'wordMine', source: set.source, allowed: set.allowed, dictionary: ALL_WORD_DICTIONARY,
        prompt: 'Ana kelimedeki harfleri kullanarak en fazla sayıda anlamlı kelime bul.',
        explanation: `Doğrulanmış örneklerden bazıları: ${set.allowed.slice(0, 10).join(', ')}. Liste bunlarla sınırlı değildir.`,
        hints: [`${set.allowed[0].length} harfli bir kelime: ${set.allowed[0][0].toLocaleUpperCase('tr-TR')}…`],
        skill: game.skill, difficulty, questionKey: `word-mine:${set.source.toLocaleLowerCase('tr-TR')}`
      }];
    }
  }

  if (gameId === 'word-ladder') {
    if (Number(profile.grade||0) >= 9) throw new Error('Kelime Merdiveni lise düzeyinde kalite yenilemesi tamamlanana kadar kapalıdır.');
    const pathCandidates = shuffle(VALID_V3_LADDER_PATHS.filter((path) => {
      if (profile.age <= 10) return path[0].length >= 3 && path[0].length <= 5;
      return path[0].length >= 3 && path[0].length <= 6;
    }), random);
    rounds = pathCandidates.map((path) => {
      const startWord = path[0];
      const endWord = path.at(-1);
      const suggestedSteps = path.slice(1, -1);
      return {
        kind: 'wordLadder', prompt: 'Başlangıçtan hedefe ilerle. Her adım gerçek bir kelime olsun ve yalnızca bir harf değişsin.',
        start: startWord, steps: suggestedSteps, suggestedStepCount: suggestedSteps.length, minSteps: 1, maxSteps: 6,
        end: endWord, dictionary: ALL_WORD_DICTIONARY,
        hints: [`Örnek yolun ilk ara kelimesi “${suggestedSteps[0]}” olabilir; farklı doğru yollar da kabul edilir.`],
        explanation: path.join(' → '), skill: game.skill, difficulty,
        questionKey: `word-ladder:${startWord.toLocaleLowerCase('tr-TR')}:${endWord.toLocaleLowerCase('tr-TR')}:${suggestedSteps.length}`,
        timeLimit: Math.max(100, 55 + path.length * 25)
      };
    }).filter((round) => !seen.has(round.questionKey)).slice(0, game.sessionLength);
  }

  if (gameId === 'forbidden-story') {
    const item = shuffle(eligible(ALL_FORBIDDEN_PROMPTS, profile.age), random)
      .find((prompt) => !seen.has(`forbidden-story:${hashString(`${prompt.letter}|${prompt.topic}`).toString(36)}`));
    if (item) {
      rounds = [{
        kind: 'story', prompt: item.topic, forbiddenLetter: item.letter, minSentences: item.minSentences, minUniqueWords: item.minUniqueWords,
        hints: [`Önce “${item.letter.toLocaleUpperCase('tr-TR')}” harfi içermeyen kısa kelimeleri düşün.`],
        explanation: 'Puan; yasak harfe uymak, yeterli cümle kurmak ve farklı kelimeler kullanmak üzerinden hesaplanır.',
        skill: game.skill, difficulty,
        questionKey: `forbidden-story:${hashString(`${item.letter}|${item.topic}`).toString(36)}`
      }];
    }
  }

  if (gameId === 'meaning-hunt') rounds = unseenRounds(ALL_MEANING_QUESTIONS, game, difficulty, profile.age, random, seen, game.sessionLength);
  if (gameId === 'paragraph-detective') {
    const v4Questions = createV4ParagraphSession(profile, seed, game.sessionLength, { seenQuestionKeys: seen, recentFamilyIds: options.recentFamilyIds || [] });
    rounds = v4Questions.map((question) => toChoiceRound({ ...question, detailedOptions: question.detailedOptions }, game, Math.max(2, Math.min(5, question.cognitiveDepth || difficulty))));
    if (rounds.length < game.sessionLength) {
      const occupied = new Set([...seen, ...rounds.map((round) => round.questionKey)]);
      rounds.push(...unseenRounds(ALL_PARAGRAPH_QUESTIONS, game, difficulty, profile.age, random, occupied, game.sessionLength - rounds.length));
    }
  }
  if (gameId === 'logic-station') {
    const questions = createV4LogicSession(profile, seed, game.sessionLength, {
      seenQuestionKeys: seen,
      recentFamilyIds: options.recentFamilyIds || []
    });
    rounds = questions.map((question) => toChoiceRound({
      ...question,
      familyId: question.familyId,
      cognitiveDepth: question.cognitiveDepth,
      curriculumRole: question.curriculumRole,
      targetGrade: question.targetGrade,
      qualityScore: question.qualityScore
    }, game, Math.max(3, Math.min(5, question.cognitiveDepth || difficulty))));
  }
  if (EXAM_QUESTIONS_V53[gameId]) rounds = unseenRounds(EXAM_QUESTIONS_V53[gameId], game, Math.max(3,difficulty), profile.age, random, seen, game.sessionLength);
  if (gameId === 'science-lab') rounds = unseenRounds(SCIENCE_QUESTIONS, game, difficulty, profile.age, random, seen, game.sessionLength);
  if (gameId === 'science-reasoning') rounds = unseenRounds(SCIENCE_REASONING_QUESTIONS, game, difficulty, profile.age, random, seen, game.sessionLength);
  if (gameId === 'english-vocabulary') rounds = createEnglishRounds(profile, game, difficulty, random, seen, options.preferredEnglishWordIds || []);
  if (gameId === 'english-cloze' || gameId === 'english-sentence-builder') rounds = createEnglishActivityRounds(gameId, profile, game, difficulty, random, seen);

  if (SOCIAL_QUESTIONS[gameId]) {
    rounds = unseenRounds(SOCIAL_QUESTIONS[gameId], game, difficulty, profile.age, random, seen, Math.min(game.sessionLength, SOCIAL_QUESTIONS[gameId].length));
    if (rounds.length < game.sessionLength) {
      const occupied = new Set([...seen, ...rounds.map((round) => round.questionKey)]);
      rounds.push(...generateUniqueRounds({ count: game.sessionLength - rounds.length, seed: seed + 8801, seen: occupied, generator: (roundSeed) => createSocialRound(gameId, profile.age, roundSeed), convert: (question) => toChoiceRound({ ...question, questionKey: `${gameId}:${hashString(`${question.context || ''}|${question.prompt}|${question.answerValue || question.answer}`).toString(36)}` }, game, difficulty) }));
    }
  }
  if (gameId === 'religion-practice') {
    rounds = unseenRounds(RELIGION_QUESTIONS, game, difficulty, profile.age, random, seen, Math.min(game.sessionLength, RELIGION_QUESTIONS.length), (question) => ({ ...question, detailedOptions: question.optionExplanations }));
    if (rounds.length < game.sessionLength) {
      const occupied = new Set([...seen, ...rounds.map((round) => round.questionKey)]);
      rounds.push(...generateUniqueRounds({ count: game.sessionLength - rounds.length, seed: seed + 22031, seen: occupied, generator: createReligionVariant, convert: (question) => toChoiceRound({ ...question, questionKey:`religion-practice:${hashString(`${question.context}|${question.prompt}|${question.answerValue}`).toString(36)}` }, game, difficulty) }));
    }
  }
  if (gameId === 'lgs-foundation') {
    rounds = unseenRounds(LGS_FOUNDATION_QUESTIONS, game, difficulty, profile.age, random, seen, Math.min(game.sessionLength, LGS_FOUNDATION_QUESTIONS.length), (question) => ({ ...question, context: `${question.subject} • ${question.foundation} temeli
${question.context || ''}`, detailedOptions: question.optionExplanations, sourceLabel: 'Özgün LGS soru kalıbı' }));
    if (rounds.length < game.sessionLength) {
      const occupied = new Set([...seen, ...rounds.map((round) => round.questionKey)]);
      rounds.push(...generateUniqueRounds({ count: game.sessionLength - rounds.length, seed: seed + 39019, seen: occupied, generator:createLgsFoundationVariant, convert:(question)=>toChoiceRound({ ...question, context:`${question.subject} • ${question.foundation} temeli
${question.context || ''}`, sourceLabel:'Özgün LGS soru kalıbı', questionKey:`lgs-foundation:${hashString(`${question.subject}|${question.context}|${question.prompt}|${question.answerValue}`).toString(36)}` }, game, difficulty) }));
    }
  }

  if (gameId === 'target-number') {
    rounds = generateUniqueRounds({
      count: game.sessionLength, seed, seen,
      generator: (roundSeed) => createTargetRound(profile.age, roundSeed),
      convert: (target) => ({
        kind: 'expression', prompt: 'Tüm sayıları birer kez kullanarak hedefe ulaş.',
        rule: 'Tüm sayıları birer kez kullan. +, −, ×, ÷ ve parantezlerden istediğini kullan; bütün işlem işaretlerini kullanmak zorunda değilsin.',
        ...target,
        hints: ['Önce büyük bir çarpım veya toplam oluşturmayı düşün.', `Bir çözüm düzeni: ${target.solution.replaceAll(/\d/g, '□')}`, `Örnek çözüm: ${target.solution}`],
        explanation: `${target.solution} = ${target.target}`,
        skill: game.skill, difficulty,
        questionKey: `target-number:${[...target.numbers].sort((a, b) => a - b).join(',')}:${target.target}`
      })
    });
  }

  if (gameId === 'speed-math') {
    rounds = generateUniqueRounds({
      count: game.sessionLength, seed, seen,
      generator: (roundSeed) => createArithmeticRound(profile.age, roundSeed),
      convert: (question) => ({
        kind: 'choice', prompt: `${question.prompt} işleminin sonucu kaçtır?`,
        context: 'Hızlı ol; fakat işlem önceliğini ve işaretleri kontrol et.', options: question.options,
        answerIndex: question.options.indexOf(String(question.answer)), explanation: `Doğru sonuç ${question.answer}.`, hints: [],
        skill: game.skill, difficulty, questionKey: `speed-math:${question.prompt}`
      })
    });
  }

  if (gameId === 'pattern-lab') {
    rounds = generateUniqueRounds({
      count: game.sessionLength, seed, seen,
      generator: (roundSeed) => createPatternRound(profile.age, roundSeed),
      convert: (question) => ({
        kind: 'choice', prompt: `${question.sequence.join('  •  ')}  •  ?`, context: 'Dizinin kuralını bul ve sıradaki sayıyı seç.',
        options: question.options, answerIndex: question.options.indexOf(String(question.answer)), explanation: question.rule,
        hints: ['Sayılar arasındaki farklara bak.', question.rule], skill: game.skill, difficulty,
        questionKey: `pattern-lab:${question.sequence.join(',')}`
      })
    });
  }

  if (gameId === 'geometry-lab') {
    rounds = generateUniqueRounds({
      count: game.sessionLength, seed, seen,
      generator: (roundSeed) => createGeometryRound(profile.age, roundSeed),
      convert: (question) => ({
        kind: 'choice', prompt: question.prompt, context: question.context, options: question.options,
        answerIndex: question.options.indexOf(String(question.answer)), explanation: question.explanation,
        hints: ['Şekilde verilen ölçüleri ve sorulan büyüklüğü ayır.', question.explanation.split('=')[0].trim()],
        visual: question.visual, skill: game.skill, difficulty,
        questionKey: `geometry-lab:${hashString(`${question.prompt}|${question.context}`).toString(36)}`
      })
    });
  }

  if (gameId === 'problem-hunter') {
    rounds = generateUniqueRounds({
      count: game.sessionLength, seed, seen,
      generator: (roundSeed) => createProblemRound(profile.age, roundSeed),
      convert: (question) => ({
        kind: 'choice', prompt: question.prompt, context: 'Önce verilenleri ve isteneni ayır.', options: question.options,
        answerIndex: question.options.indexOf(String(question.answer)), explanation: question.explanation,
        hints: ['Soruda istenen son büyüklüğü belirle.', question.explanation.split(';')[0]], skill: game.skill, difficulty,
        questionKey: `problem-hunter:${hashString(question.prompt).toString(36)}`
      })
    });
  }

  if (gameId === 'olympiad-ladder') {
    const questions = createV4OlympiadSession(profile, seed, game.sessionLength, {
      seenQuestionKeys: seen,
      recentFamilyIds: options.recentFamilyIds || []
    });
    rounds = questions.map((question) => ({
      kind: question.kind || 'choice',
      prompt: question.prompt,
      context: question.context || 'Küçük örnek dene, düzeni fark et ve genelle.',
      options: question.options,
      answerIndex: question.options.indexOf(String(question.answerValue)),
      explanation: question.explanation,
      visual: question.visual || null,
      hints: question.hints?.length ? question.hints : ['Soruyu küçük bir örnekle dene.', 'Verileri tablo, şekil veya kısa bir listeyle düzenle.', question.explanation],
      skill: game.skill,
      difficulty: Math.max(3, Math.min(5, question.cognitiveDepth || difficulty)),
      timeLimit: question.timeLimit,
      questionKey: question.questionKey,
      familyId: question.familyId,
      cognitiveDepth: question.cognitiveDepth,
      curriculumRole: question.curriculumRole,
      targetGrade: question.targetGrade,
      qualityScore: question.qualityScore
    }));
  }

  if (gameId === 'error-detective') {
    rounds = generateUniqueRounds({
      count: game.sessionLength, seed, seen,
      generator: (roundSeed) => createErrorRound(profile.age, roundSeed),
      convert: (question, attempt) => {
        const shuffledVariant = attempt > 20 ? `${question.prompt} (${attempt})` : question.prompt;
        return toChoiceRound({
          ...question,
          prompt: shuffledVariant,
          options: question.steps.map((step, index) => `${index + 1}. ${step}`),
          questionKey: `error-detective:${hashString(question.steps.join('|')).toString(36)}`
        }, game, difficulty);
      }
    });
  }


  const signatureSet = new Set();
  rounds = rounds.filter((round) => {
    const signature = `${round.questionKey}|${round.prompt}|${round.context||''}`.toLocaleLowerCase('tr-TR');
    if (signatureSet.has(signature)) return false;
    signatureSet.add(signature);
    if (Number(profile.grade||0) >= 4) {
      const trivialLinear = /(?:^|\s)[1-4]?x\s*[+\-]\s*\d+\s*=\s*\d+/i.test(round.prompt||'');
      const trivialPrompt = /(?:sonucu kaçtır|x kaçtır)\??$/i.test(round.prompt||'') && (round.prompt||'').length < 28 && Number(round.cognitiveDepth||round.difficulty||1) < 3;
      if (trivialLinear || trivialPrompt) return false;
    }
    return true;
  });

  return {
    id: `${gameId}-${sessionSeed}`,
    game,
    difficulty,
    rounds,
    currentIndex: 0,
    answers: [],
    score: 0,
    startedAt: Date.now(),
    roundStartedAt: Date.now(),
    completed: false,
    rewardEligible: game.rewardEligible !== false
  };
}

export const CONTENT_COUNTS = {
  englishWords: ENGLISH_WORDS.length,
  wordMineSets: ALL_WORD_MINE_SETS.length,
  wordLadders: ALL_WORD_LADDERS.length,
  meaningQuestions: ALL_MEANING_QUESTIONS.length,
  paragraphQuestions: ALL_PARAGRAPH_QUESTIONS.length,
  logicQuestions: LOGIC_QUESTIONS_V2.length,
  scienceQuestions: SCIENCE_QUESTIONS.length + SCIENCE_REASONING_QUESTIONS.length,
  englishActivities: ENGLISH_SENTENCE_ACTIVITIES.length,
  socialQuestions: Object.values(SOCIAL_QUESTIONS).flat().length,
  religionQuestions: RELIGION_QUESTIONS.length,
  lgsFoundationQuestions: LGS_FOUNDATION_QUESTIONS.length,
  wordLadderPathsV3: VALID_V3_LADDER_PATHS.length
};
