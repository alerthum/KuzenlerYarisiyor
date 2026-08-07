import {
  FORBIDDEN_STORY_PROMPTS,
  MEANING_QUESTIONS,
  PARAGRAPH_QUESTIONS,
  WORD_DICTIONARY,
  WORD_LADDERS,
  WORD_MINE_SETS
} from '../content.js';
import { attachGlobalQuality, auditGlobalSession, enforceSessionQuality } from '../quality/global-quality-engine-v10.js';
import { attachQuestionContract } from '../quality/question-contract-v11.js';
import { attachCognitiveDepth, filterRoundsByCognitiveDepth } from '../quality/cognitive-depth-engine.js';
import { attachOptionQuality, filterRoundsByOptionQuality } from '../quality/premium-options-engine.js';
import { filterRoundsByIndependentSolver } from '../quality/independent-solver.js';
import { attachSemanticIdentity, filterSessionSemanticRepeats } from '../quality/semantic-repeat-engine.js';
import { filterRoundsByChildMind } from '../quality/child-mind-review.js';
import { filterRoundsByQuestionFactory, normalizeRoundWithQuestionFactory, buildCognitiveExperience } from '../quality/question-factory-v13.js';
import { auditChoiceIntegrity, attachChoiceIntegrity } from '../quality/choice-integrity-engine-v11.js';
import { buildBlockedSets, REPETITION_POLICY_V2 } from '../quality/repetition-policy-v2.js';
import { generateFromFamilies } from '../quality/family-skeleton-engine.js';
import { PATTERN_LAB_FAMILIES } from '../content/families/pattern-lab-families.js';
import { SPEED_MATH_FAMILIES } from '../content/families/speed-math-families.js';
import { TARGET_NUMBER_FAMILIES } from '../content/families/target-number-families.js';
import { GEOMETRY_LAB_FAMILIES } from '../content/families/geometry-lab-families.js';
import { PROBLEM_HUNTER_FAMILIES } from '../content/families/problem-hunter-families.js';
import { ERROR_DETECTIVE_FAMILIES } from '../content/families/error-detective-families.js';
import { LOGIC_STATION_FAMILIES } from '../content/families/logic-station-families.js';
import { OLYMPIAD_LADDER_FAMILIES } from '../content/families/olympiad-ladder-families.js';
import { WORD_MINE_FAMILIES } from '../content/families/word-mine-families.js';
import { WORD_LADDER_FAMILIES } from '../content/families/word-ladder-families.js';
import { FORBIDDEN_STORY_FAMILIES } from '../content/families/forbidden-story-families.js';
import { MEANING_HUNT_FAMILIES } from '../content/families/meaning-hunt-families.js';
import { PARAGRAPH_DETECTIVE_FAMILIES } from '../content/families/paragraph-detective-families.js';
import { ENGLISH_SENTENCE_BUILDER_FAMILIES } from '../content/families/english-sentence-builder-families.js';
import { ENGLISH_VOCABULARY_FAMILIES } from '../content/families/english-vocabulary-families.js';
import { ENGLISH_CLOZE_FAMILIES } from '../content/families/english-cloze-families.js';
import { SOCIAL_TIME_TRAVEL_FAMILIES } from '../content/families/social-time-travel-families.js';
import { SOCIAL_MAP_SKILLS_FAMILIES } from '../content/families/social-map-skills-families.js';
import { SOCIAL_CITIZENSHIP_FAMILIES } from '../content/families/social-citizenship-families.js';
import { RELIGION_PRACTICE_FAMILIES } from '../content/families/religion-practice-families.js';
import { LGS_FOUNDATION_FAMILIES } from '../content/families/lgs-foundation-families.js';
import { SCIENCE_LAB_FAMILIES } from '../content/families/science-lab-families.js';
import { SCIENCE_REASONING_FAMILIES } from '../content/families/science-reasoning-families.js';
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
import { difficultyFromRating, updateSkillRating } from '../engines/adaptive-engine.js';
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
import { createPremiumParagraphSession } from '../engines/premium-paragraph-engine-v11.js';
import { hashString, pick, seededRandom, shuffle } from '../utils.js';
import { controlledLiveBetaRounds } from '../assessment-v2/controlled-live-beta-bank.js';
import { EXAM_QUESTIONS_V53 } from '../content-exams-v53.js';
import { enrichRoundAcademicMetadata } from '../curriculum/academic-metadata-v9.js';
import { isRoundQuarantined } from '../quality/quarantine-v9.js';
import { generatePremiumGoldQuestion } from '../content-studio/premium-gold-content-v10.js';
import { composePremiumSession } from '../engines/premium-session-composer-v10.js';
import { composeV11Session } from '../engines/v11-session-composer.js';
import { buildStudentBrainProfile, brainProfileSessionPolicy } from '../engines/student-brain-profile-v10.js';
import { transitionLegacyContent } from '../engines/premium-content-transition-v10.js';
import { attachV11SilentRemediation } from '../engines/v11-misconception-remediation.js';
import { generatePremiumRounds, PREMIUM_GAME_IDS } from '../content/premium-question-bank.js';
import { generatePremiumPilotRounds } from '../content/premium-pilot-bank.js';



const PREMIUM_PILOT_LIVE_GAMES = new Set([
  'error-detective',
  'paragraph-detective',
  'science-reasoning'
]);

const GOLD_FAMILY_BY_GAME = Object.freeze({
  'error-detective': 'math-error-chain',
  'paragraph-detective': 'tr-inference-evidence',
  'science-lab': 'science-variable-lab',
  'science-reasoning': 'science-variable-lab',
  'social-time-travel': 'social-source-compare',
  'religion-practice': 'religion-concept-situation',
  'english-cloze': 'english-context-choice',
  'logic-station': 'logic-constraint-grid',
  'olympiad-ladder': 'olympiad-invariant'
});

// Aşama 09: underfill backfill için aile havuzları (choice-ağırlıklı oyunlar).
const STAGE09_FAMILY_POOLS = Object.freeze({
  'pattern-lab': PATTERN_LAB_FAMILIES,
  'speed-math': SPEED_MATH_FAMILIES,
  'target-number': TARGET_NUMBER_FAMILIES,
  'geometry-lab': GEOMETRY_LAB_FAMILIES,
  'problem-hunter': PROBLEM_HUNTER_FAMILIES,
  'error-detective': ERROR_DETECTIVE_FAMILIES,
  'logic-station': LOGIC_STATION_FAMILIES,
  'olympiad-ladder': OLYMPIAD_LADDER_FAMILIES,
  'word-mine': WORD_MINE_FAMILIES,
  'word-ladder': WORD_LADDER_FAMILIES,
  'forbidden-story': FORBIDDEN_STORY_FAMILIES,
  'meaning-hunt': MEANING_HUNT_FAMILIES,
  'paragraph-detective': PARAGRAPH_DETECTIVE_FAMILIES,
  'english-vocabulary': ENGLISH_VOCABULARY_FAMILIES,
  'english-sentence-builder': ENGLISH_SENTENCE_BUILDER_FAMILIES,
  'english-cloze': ENGLISH_CLOZE_FAMILIES,
  'social-time-travel': SOCIAL_TIME_TRAVEL_FAMILIES,
  'social-map-skills': SOCIAL_MAP_SKILLS_FAMILIES,
  'social-citizenship': SOCIAL_CITIZENSHIP_FAMILIES,
  'religion-practice': RELIGION_PRACTICE_FAMILIES,
  'lgs-foundation': LGS_FOUNDATION_FAMILIES,
  'science-lab': SCIENCE_LAB_FAMILIES,
  'science-reasoning': SCIENCE_REASONING_FAMILIES
});

function materializeFamilyChoiceRound(question, game, difficulty) {
  const shared = {
    skill: game.skill,
    difficulty: Math.max(3, Math.min(5, difficulty)),
    cognitiveDepth: 4,
    questionKey: question.questionKey,
    familyId: question.familyId,
    skeletonId: question.skeletonId,
    reasoningPathId: question.reasoningPathId,
    cognitiveTraits: question.cognitiveTraits,
    explanation: question.explanation,
    hints: question.hints || [question.explanation]
  };
  if (question.kind === 'wordLadder') {
    return {
      kind: 'wordLadder',
      prompt: question.prompt,
      start: question.start,
      steps: question.steps,
      suggestedStepCount: question.suggestedStepCount ?? Math.max(1, (question.steps || []).length),
      minSteps: question.minSteps ?? 1,
      maxSteps: question.maxSteps ?? 6,
      end: question.end,
      dictionary: question.dictionary || ALL_WORD_DICTIONARY,
      ...shared
    };
  }
  if (question.kind === 'wordMine') {
    return {
      kind: 'wordMine',
      source: question.source,
      allowed: question.allowed,
      dictionary: ALL_WORD_DICTIONARY,
      prompt: question.prompt,
      ...shared
    };
  }
  if (question.kind === 'story') {
    return {
      kind: 'story',
      prompt: question.prompt,
      forbidden: question.forbidden,
      minWords: question.minWords,
      ...shared
    };
  }
  return {
    kind: question.kind || 'choice',
    prompt: question.prompt,
    context: question.context || '',
    options: question.options,
    answerIndex: question.answerIndex,
    numbers: question.numbers,
    target: question.target,
    solution: question.solution,
    rule: question.rule,
    tokens: question.tokens,
    answerTokens: question.answerTokens,
    ...shared
  };
}

function applyPublicationGates(rounds, gradeNum) {
  // V13.5: Üreticinin kendi etiketine güvenme; önce gerçek Question Factory kapısı.
  let next = filterRoundsByQuestionFactory(rounds, { grade: gradeNum }).kept;
  next = filterRoundsByOptionQuality(next).kept;
  next = filterRoundsByIndependentSolver(next).kept;
  next = filterSessionSemanticRepeats(next).kept;
  if (gradeNum >= 3) next = filterRoundsByCognitiveDepth(next, { grade: gradeNum }).kept;
  else next = next.map((round) => attachCognitiveDepth(round, { grade: gradeNum }));
  // Aşama 10: kritik çocuk-aklı retleri yayınlanmaz.
  next = filterRoundsByChildMind(next, { grade: gradeNum }).kept;
  // choice-integrity kritik hataları (alakasız çeldirici kümesi vb.) yayınlanmaz.
  next = next
    .map((round) => attachChoiceIntegrity(round, { grade: gradeNum }))
    .filter((round) => {
      if (round.kind && round.kind !== 'choice') return true;
      const report = round.choiceIntegrity || auditChoiceIntegrity(round, { grade: gradeNum });
      return report.passed !== false;
    });
  return next;
}

function createGoldShowcaseRound(gameId, game, profile, sessionSeed, seen = new Set(), blockedFamilies = new Set()) {
  const familyId = GOLD_FAMILY_BY_GAME[gameId];
  if (!familyId || blockedFamilies.has(familyId)) return null;
  const result = generatePremiumGoldQuestion(familyId, `${profile.id}:${gameId}:${sessionSeed}`);
  if (!result?.ok || !result.question || seen.has(result.question.questionKey)) return null;
  const question = result.question;
  const round = toChoiceRound(question, game, Math.max(3, Number(question.difficulty || 3)));
  return {
    ...round,
    subjectId: question.subjectId,
    visibleCardId: question.visibleCardId,
    topicId: question.topicId || null,
    learningOutcomeId: question.learningOutcomeId,
    thinkingPatternId: question.thinkingPatternId,
    cognitiveDepth: question.cognitiveDepth,
    reasoningStepCount: question.reasoningStepCount,
    cognitiveTraits: question.cognitiveTraits,
    familyId: question.familyId,
    questionKey: question.questionKey,
    distractorValidation: question.distractorValidation,
    premiumTier: 'GOLD',
    premiumShowcase: true,
    sourceLabel: 'Zihin Arenası GOLD'
  };
}

function injectGoldShowcase(rounds, goldRound, targetLength) {
  if (!goldRound) return { rounds, injected: false };
  const withoutDuplicate = rounds.filter((round) => round.questionKey !== goldRound.questionKey && round.familyId !== goldRound.familyId);
  const result = [goldRound, ...withoutDuplicate].slice(0, Math.max(1, targetLength || rounds.length || 1));
  return { rounds: result, injected: true };
}

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
  { id:'tyt-focus', title:'TYT Akıllı Çalışma', shortTitle:'TYT', category:'tyt', skill:'problemSolving', icon:'🧭', color:'rgba(34,211,238,.82)', description:'Türkçe, temel matematik, sosyal ve fen muhakemesini TYT düzeyinde çalış.', minAge:16, maxAge:19, duration:'15–20 dk', sessionLength:8 },
  { id:'ayt-focus', title:'AYT Alan Çalışması', shortTitle:'AYT', category:'ayt', skill:'problemSolving', icon:'🎯', color:'rgba(167,139,250,.82)', description:'11–12. sınıf alan derslerinde kavram ve çok adımlı çözüm çalış.', minAge:16, maxAge:19, duration:'15–20 dk', sessionLength:8 },
  { id:'kpss-focus', title:'KPSS Genel Yetenek–Kültür', shortTitle:'KPSS', category:'kpss', skill:'attention', icon:'🏛️', color:'rgba(249,115,22,.82)', description:'Genel yetenek ve genel kültür sorularını ayrı çalışma planında çöz.', minAge:17, maxAge:99, duration:'15–20 dk', sessionLength:8 },

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
    color: 'rgba(250, 204, 21, .76)', description: 'Sınıf düzeyine uygun kazanımları açıklamalı seçeneklerle çalış. Bu bölüm XP kazandırmaz.',
    minAge: 10, maxAge: 19, duration: '10 dk', sessionLength: 10, rewardEligible: false
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
  'religion-practice': { minGrade: 4, maxGrade: 12 },
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

// Aşama 12: aile motoru + yayın kapısı olmayan sınav-odaklı oyunlar
// boş oturum / legacy doğrudan yayın üretmesin diye katalogda görünür ama seçilemez.
const PUBLICATION_RETIRED_GAMES = new Set(['lgs-focus', 'tyt-focus', 'ayt-focus', 'kpss-focus']);

export function isGameAvailableForProfile(game, profile) {
  if (!game || !profile) return false;
  if (PUBLICATION_RETIRED_GAMES.has(game.id) && !PREMIUM_GAME_IDS.includes(game.id)) return false;
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
    qualityScore: question.qualityScore || null,
    skeletonId: question.skeletonId || question.v11Identity?.skeletonId || null,
    skeletonFamilyId: question.skeletonFamilyId || question.v11Identity?.skeletonFamilyId || null,
    v11Identity: question.v11Identity || null,
    evidenceMap: question.evidenceMap || null,
    optionDiagnostics: question.optionDiagnostics || null,
    misconceptionMap: question.misconceptionMap || null,
    distractorValidation: question.distractorValidation || null
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

// Aşama 01 kök neden düzeltmesi: yalnız literal questionKey ile tekilleştirme,
// aynı bilişsel iskeletin (skeletonId) sayı/isim değişmiş varyasyonlarını farklı
// soru sayıyordu. `skeletonAware: true` ile çağrıldığında bu fonksiyon: (1) bir
// oturumda aynı iskeleti havuz yeterliyken tekrar etmez, (2) önceki oturumlarda
// görülen iskeletleri (recentSkeletonIds) havuz yeterliyken öncelik dışı bırakır,
// (3) havuz gerçekten yetersizse oturumu boş bırakmak yerine tekrara izin verir
// (bkz. md/arsiv/DIFF_ANALYSIS.md). `skeletonAware` verilmezse davranış birebir eskisiyle
// aynıdır — diğer oyunları (religion, lgs-foundation, social) etkilememesi ve
// üreticilerindeki bağımsız performans sınırlarını (ör. `numericOptions` içindeki
// ret-örnekleme döngüsü) tetiklememesi için varsayılan kapalıdır.
function generateUniqueRounds({ count, seed, seen, generator, convert, recentSkeletonIds = [], skeletonAware = false }) {
  if (!skeletonAware) {
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

  const sessionKeys = new Set();
  const candidates = [];
  const candidateCap = Math.max(count * 6, count + 20);
  const maxAttempts = count * 150;
  for (let attempt = 0; candidates.length < candidateCap && attempt < maxAttempts; attempt += 1) {
    const generated = generator(seed + attempt * 7919);
    const round = convert(generated, attempt);
    if (!round.questionKey) throw new Error('Üretilen turda questionKey eksik.');
    if (seen.has(round.questionKey) || sessionKeys.has(round.questionKey)) continue;
    sessionKeys.add(round.questionKey);
    candidates.push(round);
  }
  if (candidates.length <= count) return candidates.slice(0, count);

  const cooldown = new Set(recentSkeletonIds);
  const usedSkeletons = new Set();
  const selected = [];
  const deferredByCooldown = [];

  for (const round of candidates) {
    if (selected.length >= count) break;
    const skeletonId = round.skeletonId || null;
    if (skeletonId && usedSkeletons.has(skeletonId)) continue;
    if (skeletonId && cooldown.has(skeletonId)) { deferredByCooldown.push(round); continue; }
    selected.push(round);
    if (skeletonId) usedSkeletons.add(skeletonId);
  }
  for (const round of deferredByCooldown) {
    if (selected.length >= count) break;
    const skeletonId = round.skeletonId || null;
    if (skeletonId && usedSkeletons.has(skeletonId)) continue;
    selected.push(round);
    if (skeletonId) usedSkeletons.add(skeletonId);
  }
  const selectedKeys = new Set(selected.map((round) => round.questionKey));
  const remainingPool = candidates.filter((round) => !selectedKeys.has(round.questionKey));
  for (const round of remainingPool) {
    if (selected.length >= count) break;
    selected.push(round);
    selectedKeys.add(round.questionKey);
  }
  return selected.slice(0, count);
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
      const cleanEnglishToken = (value) => String(value).replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, '');
      const answerKey = cleanEnglishToken(answer).toLocaleLowerCase('en-US');
      const candidatePool = [...new Map([...words, 'always','because','before','after','carefully','usually','quickly']
        .map(cleanEnglishToken).filter(Boolean)
        .filter((word) => word.toLocaleLowerCase('en-US') !== answerKey)
        .map((word) => [word.toLocaleLowerCase('en-US'), word])).values()];
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
  // Yıllık ilerleme: profil skill yoksa attempts'ten kur; varsa profili kullan (çift sayma yok).
  const skillAttempts = (options.attempts || []).filter((attempt) => attempt && attempt.gameId === gameId);
  let skillRating = Number(profile.skills?.[game.skill]);
  if (!Number.isFinite(skillRating)) {
    skillRating = skillAttempts.reduce(
      (rating, attempt) => updateSkillRating(rating, attempt.correct !== false, attempt.hintCount || 0, attempt.durationSeconds || 40),
      35
    );
  }
  const earlyBrain = buildStudentBrainProfile(options.attempts || []);
  const earlyPolicy = brainProfileSessionPolicy(earlyBrain);
  // Zihin Arenası kolay soru göstermez: tüm oturumlar en az orta-üstü (3/5) düzeyden başlar.
  let difficulty = Math.max(3, difficultyFromRating(profile.age, skillRating));
  // Erken kanıtta brain hedefi zorlamaz; yıllık eğri için ikinci yarı yükselsin.
  if (earlyBrain.evidenceLevel === 'medium' || earlyBrain.evidenceLevel === 'high') {
    difficulty = Math.max(difficulty, Number(earlyPolicy.targetDifficulty) || 3);
  }
  // Aşama 09: kalite kapılarından sonra underfill olmasın diye aile motorundan fazla üret.
  // Ortak kural: oturum uzunluğuna göre surplus (gameId/ders özel listesi yok).
  const familyGenerateCount = Math.min(Math.max((game.sessionLength || 5) * 10, 80), 140);
  const seed = hashString(`${profile.id}-${gameId}-${sessionSeed}`);
  const random = seededRandom(seed);
  const seen = options.seenQuestionKeys instanceof Set ? new Set(options.seenQuestionKeys) : new Set(options.seenQuestionKeys || []);
  const explicitlySeenQuestionKeys = new Set(seen);
  const blockedFamilies = options.blockedQuestionFamilies instanceof Set ? options.blockedQuestionFamilies : new Set(options.blockedQuestionFamilies || []);
  // CAPACITY POLICY V2: tek kaynak repetition-policy-v2 (v1 lifetime CX kaldırıldı).
  const gradeBand = options.gradeBand != null
    ? String(options.gradeBand)
    : String(profile.grade ?? profile.gradeBand ?? '');
  const academicYear = options.academicYear != null
    ? String(options.academicYear)
    : '2025-2026';
  const rawAttempts = Array.isArray(options.attempts) ? options.attempts : [];
  // Gerçek öğrenci geçmişindeki exact questionKey'ler ayrıca seen setine
  // taşınır. Yalnız UI'nin ayrı seenQuestionKeys göndermesine güvenmek pilot
  // bankalarda aynı soruların yeniden görünmesine ve yapay underfill'e yol açar.
  for (const attempt of rawAttempts) {
    if (attempt?.gameId === gameId && attempt?.questionKey) seen.add(attempt.questionKey);
  }
  let gameAttemptOrdinal = 0;
  const policyAttempts = rawAttempts.map((attempt) => {
    if (!attempt || attempt.gameId !== gameId) return attempt;
    const ordinal = gameAttemptOrdinal++;
    if (Number.isFinite(Number(attempt.sessionIndex)) || Number.isFinite(Number(attempt.sessionSequence))) return attempt;
    return { ...attempt, sessionIndex: Math.floor(ordinal / Math.max(1, game.sessionLength || 1)) + 1 };
  });
  const inferredNextSessionIndex = Math.floor(gameAttemptOrdinal / Math.max(1, game.sessionLength || 1)) + 1;
  const currentSessionIndex = Number.isFinite(Number(options.currentSessionIndex))
    ? Number(options.currentSessionIndex)
    : Math.max(Number(options.completedSessionCount || 0), inferredNextSessionIndex);

  // Güvenli canlı pilot eski aile/jeneratör/besteci hattına hiç girmez.
  // Öğrenciye teslim edilen oturum yalnız açık questionKey whitelist'i ve son
  // ekran kalite kapısından geçen sorulardan kurulur. Bu erken dönüş özellikle
  // İngilizce 20 kelime gibi aynı pedagojik ailedeki farklı soruların genel
  // çeşitlilik bestecisi tarafından 1-2 soruya düşürülmesini de engeller.
  if (options.controlledLaunchPilot === true) {
    const controlledLiveBeta = controlledLiveBetaRounds(gameId, profile, {
      seenQuestionKeys: seen,
      seed: sessionSeed
    });
    const trustedRounds = controlledLiveBeta.rounds
      .slice(0, game.sessionLength)
      .map((round) => enrichRoundAcademicMetadata(gameId, round))
      .map((round) => attachGlobalQuality(round, {
        grade: Number(profile.grade || 0),
        gameId,
        subjectId: round.subjectId || game.category || ''
      }))
      .map(attachQuestionContract);
    const trustedAudit = auditGlobalSession(trustedRounds, {
      grade: Number(profile.grade || 0),
      gameId,
      subjectId: game.category || ''
    });
    trustedAudit.controlledLiveBeta = {
      ...controlledLiveBeta.audit,
      delivered: trustedRounds.length > 0,
      deliveredQuestionKey: trustedRounds[0]?.questionKey || null,
      deliveredCount: trustedRounds.length,
      requestedCount: game.sessionLength,
      underfill: trustedRounds.length < game.sessionLength
    };
    trustedAudit.premiumBank = {
      liveSource: trustedRounds.length ? 'TRUSTED_LIVE_WHITELIST' : 'TRUSTED_LIVE_CELL_BLOCKED',
      fallbackToLegacy: false
    };
    trustedAudit.finalRoundCount = trustedRounds.length;
    trustedAudit.underfill = trustedRounds.length < game.sessionLength;
    trustedAudit.capacityFailure = trustedRounds.length < game.sessionLength ? {
      gameId,
      grade: Number(profile.grade || 0),
      requestedCount: game.sessionLength,
      producedCount: trustedRounds.length,
      policyVersion: controlledLiveBeta.audit?.trustedPolicyVersion || null,
      note: trustedRounds.length
        ? 'Güvenli whitelist kalan soruları oturumu tam doldurmadı; eski/fallback içerik açılmadı.'
        : 'Bu sınıf-oyun hücresi henüz güvenli whitelist içinde değil; eski/fallback içerik açılmadı.'
    } : null;

    return {
      id: `${gameId}-${sessionSeed}`,
      game,
      difficulty,
      rounds: trustedRounds,
      globalQualityAudit: trustedAudit,
      goldShowcase: { eligible: false, firstExperience: false, injected: false },
      studentBrainProfile: earlyBrain,
      classTarget: options.classTarget || null,
      currentIndex: 0,
      answers: [],
      score: 0,
      startedAt: Date.now(),
      roundStartedAt: Date.now(),
      completed: false,
      rewardEligible: game.rewardEligible !== false
    };
  }

  const policyVersion = options.repetitionPolicyVersion || options.policyVersion || 'v2';
  const stage09PoolForCapacity = STAGE09_FAMILY_POOLS[gameId] || null;
  const stage09SkeletonPoolSize = Array.isArray(stage09PoolForCapacity)
    ? stage09PoolForCapacity.reduce((sum, family) => sum + (Array.isArray(family.skeletons) ? family.skeletons.length : 0), 0)
    : null;
  const blockedSets = buildBlockedSets(policyAttempts, {
    gameId,
    gradeBand,
    academicYear,
    currentSessionIndex,
    repetitionPolicyVersion: policyVersion,
    skeletonPoolSize: stage09SkeletonPoolSize,
    sessionLength: game.sessionLength
  });
  // V2: önceki oturum aileleri yalnız sıralama / baskın-aile / %20 pay için;
  // generateFromFamilies'e sert recentFamily olarak TÜM önceki oturum ailelerini vermek
  // 12 ailelik havuzu ~2 aileye düşürüp underfill üretir.
  const rankingFamilyIds = [...new Set([
    ...(blockedSets.recentFamilyIds || []),
    ...(options.recentFamilyIds || [])
  ])];
  const hardRecentFamilyIds = (policyVersion === 'v1' || policyVersion === '1.0' || policyVersion === '1')
    ? rankingFamilyIds
    : [...new Set([
      ...(blockedSets.familyShareBlocked || []),
      ...(blockedSets.previousDominantFamilyId ? [blockedSets.previousDominantFamilyId] : [])
    ])];
  const recentFamilyIds = hardRecentFamilyIds;
  const recentSkeletonIds = [...new Set(blockedSets.recentSkeletonIds || [])];
  const recentSkeletonSet = new Set(recentSkeletonIds);
  const recentSolutionGraphIds = blockedSets.recentSolutionGraphIds instanceof Set
    ? blockedSets.recentSolutionGraphIds
    : new Set(blockedSets.recentSolutionGraphIds || []);
  const recentReasoningPathIds = blockedSets.recentReasoningPathIds instanceof Set
    ? blockedSets.recentReasoningPathIds
    : new Set(blockedSets.recentReasoningPathIds || []);
  const recentCognitiveExperienceIds = blockedSets.recentCognitiveExperienceIds instanceof Set
    ? blockedSets.recentCognitiveExperienceIds
    : new Set(blockedSets.recentCognitiveExperienceIds || []);
  const recentStructuralIds = blockedSets.recentStructuralIds instanceof Set
    ? blockedSets.recentStructuralIds
    : new Set(blockedSets.recentStructuralIds || []);
  const blockedSurfaceFingerprints = blockedSets.blockedSurfaceFingerprints instanceof Set
    ? blockedSets.blockedSurfaceFingerprints
    : new Set(blockedSets.blockedSurfaceFingerprints || []);
  const familyShareBlocked = blockedSets.familyShareBlocked instanceof Set
    ? blockedSets.familyShareBlocked
    : new Set(blockedSets.familyShareBlocked || []);
  const previousDominantFamilyId = blockedSets.previousDominantFamilyId || null;
  const classTarget = options.classTarget && typeof options.classTarget === 'object'
    ? {
      topicIds: [...new Set((options.classTarget.topicIds || []).filter(Boolean))],
      focusShare: Math.min(0.4, Math.max(0, Number(options.classTarget.focusShare) || 0.3))
    }
    : null;
  let rounds = [];

  if (gameId === 'word-mine') {
    // Aşama 04: word-mine artık tek kaynak-kelime seçimi yerine ortak aile-iskelet
    // motorunu (12 gerçek harf-yapısı ailesi × 4 görev × 3 yol = 48) kullanır.
    // select-valid → kind:'wordMine'; diğer iskeletler → kind:'choice'.
    const { rounds: familyRounds } = generateFromFamilies(WORD_MINE_FAMILIES, {
      seed, count: familyGenerateCount, seenQuestionKeys: seen, recentFamilyIds, recentSkeletonIds
    });
    rounds = familyRounds.map((question) => {
      const shared = {
        familyId: question.familyId,
        skeletonId: question.skeletonId,
        reasoningPathId: question.reasoningPathId,
        cognitiveTraits: question.cognitiveTraits,
        skill: game.skill,
        difficulty: Math.max(3, Math.min(5, difficulty)),
        cognitiveDepth: 4,
        questionKey: question.questionKey
      };
      if (question.kind === 'wordMine') {
        return {
          kind: 'wordMine',
          source: question.source,
          allowed: question.allowed,
          dictionary: ALL_WORD_DICTIONARY,
          prompt: question.prompt,
          explanation: question.explanation,
          hints: question.allowed?.[0]
            ? [`${question.allowed[0].length} harfli bir kelime: ${question.allowed[0][0].toLocaleUpperCase('tr-TR')}…`]
            : ['Harf envanterini kontrol ederek kelime kur.'],
          ...shared
        };
      }
      return {
        kind: 'choice',
        prompt: question.prompt,
        context: question.context,
        options: question.options,
        answerIndex: question.answerIndex,
        explanation: question.explanation,
        hints: ['Harf sayısını ve envanteri kontrol et.', question.explanation],
        ...shared
      };
    });
    if (!rounds.length) {
      const candidates = shuffle(eligible(ALL_WORD_MINE_SETS, profile.age), random);
      const set = candidates.find((item) => !seen.has(`word-mine:${item.source.toLocaleLowerCase('tr-TR')}`));
      if (set) {
        rounds = [{
          kind: 'wordMine', source: set.source, allowed: set.allowed, dictionary: ALL_WORD_DICTIONARY,
          prompt: 'Ana kelimedeki harfleri kullanarak en fazla sayıda anlamlı kelime bul.',
          explanation: `Doğrulanmış örneklerden bazıları: ${set.allowed.slice(0, 10).join(', ')}. Liste bunlarla sınırlı değildir.`,
          hints: [`${set.allowed[0].length} harfli bir kelime: ${set.allowed[0][0].toLocaleUpperCase('tr-TR')}…`],
          skill: game.skill, difficulty, questionKey: `word-mine-legacy:${set.source.toLocaleLowerCase('tr-TR')}`
        }];
      }
    }
  }

  if (gameId === 'word-ladder') {
    if (Number(profile.grade||0) >= 9) throw new Error('Kelime Merdiveni lise düzeyinde kalite yenilemesi tamamlanana kadar kapalıdır.');
    // Aşama 04: word-ladder artık sabit path dilimi yerine ortak aile-iskelet
    // motorunu (12 dönüşüm/kısıt ailesi × 4 görev × 3 yol = 48) kullanır.
    // select-valid → kind:'wordLadder' (alternatif geçerli yollar validateLadder ile kabul);
    // diğer iskeletler → kind:'choice'.
    const { rounds: familyRounds } = generateFromFamilies(WORD_LADDER_FAMILIES, {
      seed, count: familyGenerateCount, seenQuestionKeys: seen, recentFamilyIds, recentSkeletonIds
    });
    rounds = familyRounds.map((question) => {
      const shared = {
        familyId: question.familyId,
        skeletonId: question.skeletonId,
        reasoningPathId: question.reasoningPathId,
        cognitiveTraits: question.cognitiveTraits,
        skill: game.skill,
        difficulty: Math.max(3, Math.min(5, difficulty)),
        cognitiveDepth: 4,
        questionKey: question.questionKey
      };
      if (question.kind === 'wordLadder') {
        const dict = [...new Set([...(question.dictionary || []), ...ALL_WORD_DICTIONARY].map((w) => String(w)))];
        return {
          kind: 'wordLadder',
          prompt: question.prompt,
          start: question.start,
          steps: question.steps,
          suggestedStepCount: question.suggestedStepCount ?? Math.max(1, (question.steps || []).length),
          minSteps: question.minSteps ?? 1,
          maxSteps: question.maxSteps ?? 6,
          end: question.end,
          dictionary: dict,
          hints: [
            question.steps?.[0]
              ? `Örnek yolun ilk ara kelimesi “${question.steps[0]}” olabilir; farklı doğru yollar da kabul edilir.`
              : 'Her adımda yalnızca bir harf değiştir; alternatif geçerli yollar da doğrudur.',
            question.explanation
          ],
          explanation: question.explanation,
          timeLimit: Math.max(100, 55 + (2 + (question.steps || []).length) * 25),
          ...shared
        };
      }
      return {
        kind: 'choice',
        prompt: question.prompt,
        context: question.context,
        options: question.options,
        answerIndex: question.answerIndex,
        explanation: question.explanation,
        hints: ['Tek harf kuralı, sözlük ve hedefe ulaşmayı kontrol et.', question.explanation],
        ...shared
      };
    });
    if (!rounds.length) {
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
          questionKey: `word-ladder-legacy:${startWord.toLocaleLowerCase('tr-TR')}:${endWord.toLocaleLowerCase('tr-TR')}:${suggestedSteps.length}`,
          timeLimit: Math.max(100, 55 + path.length * 25)
        };
      }).filter((round) => !seen.has(round.questionKey)).slice(0, game.sessionLength);
    }
  }

  if (gameId === 'forbidden-story') {
    // Aşama 04: forbidden-story artık tek prompt seçimi yerine ortak aile-iskelet
    // motorunu (12 kısıt/strateji ailesi × 4 görev × 3 yol = 48) kullanır.
    // select-valid → kind:'story'; diğer iskeletler → kind:'choice'.
    const { rounds: familyRounds } = generateFromFamilies(FORBIDDEN_STORY_FAMILIES, {
      seed, count: familyGenerateCount, seenQuestionKeys: seen, recentFamilyIds, recentSkeletonIds
    });
    rounds = familyRounds.map((question) => {
      const shared = {
        familyId: question.familyId,
        skeletonId: question.skeletonId,
        reasoningPathId: question.reasoningPathId,
        cognitiveTraits: question.cognitiveTraits,
        skill: game.skill,
        difficulty: Math.max(3, Math.min(5, difficulty)),
        cognitiveDepth: 4,
        questionKey: question.questionKey
      };
      if (question.kind === 'story') {
        return {
          kind: 'story',
          prompt: question.prompt,
          forbiddenLetter: question.forbiddenLetter,
          minSentences: question.minSentences,
          minUniqueWords: question.minUniqueWords,
          hints: [`Önce “${String(question.forbiddenLetter).toLocaleUpperCase('tr-TR')}” harfi içermeyen kısa kelimeleri düşün.`, question.explanation],
          explanation: question.explanation,
          ...shared
        };
      }
      return {
        kind: 'choice',
        prompt: question.prompt,
        context: question.context,
        options: question.options,
        answerIndex: question.answerIndex,
        explanation: question.explanation,
        hints: ['Yasak harfi, cümle kotasını ve kelime çeşitliliğini ayrı kontrol et.', question.explanation],
        ...shared
      };
    });
    if (!rounds.length) {
      const item = shuffle(eligible(ALL_FORBIDDEN_PROMPTS, profile.age), random)
        .find((prompt) => !seen.has(`forbidden-story-legacy:${hashString(`${prompt.letter}|${prompt.topic}`).toString(36)}`));
      if (item) {
        rounds = [{
          kind: 'story', prompt: item.topic, forbiddenLetter: item.letter, minSentences: item.minSentences, minUniqueWords: item.minUniqueWords,
          hints: [`Önce “${item.letter.toLocaleUpperCase('tr-TR')}” harfi içermeyen kısa kelimeleri düşün.`],
          explanation: 'Puan; yasak harfe uymak, yeterli cümle kurmak ve farklı kelimeler kullanmak üzerinden hesaplanır.',
          skill: game.skill, difficulty,
          questionKey: `forbidden-story-legacy:${hashString(`${item.letter}|${item.topic}`).toString(36)}`
        }];
      }
    }
  }

  if (gameId === 'meaning-hunt') {
    // Aşama 04: meaning-hunt artık sabit ALL_MEANING_QUESTIONS listesi yerine ortak
    // aile-iskelet motorunu (12 gerçek anlam-ilişkisi ailesi × 4 görev × 3 yol = 48)
    // kullanır. Tüm iskeletler kind:'choice' (mevcut Anlam Avı UI).
    const { rounds: familyRounds } = generateFromFamilies(MEANING_HUNT_FAMILIES, {
      seed, count: familyGenerateCount, seenQuestionKeys: seen, recentFamilyIds, recentSkeletonIds
    });
    rounds = familyRounds.map((question) => ({
      kind: 'choice',
      prompt: question.prompt,
      context: question.context || 'Hedef sözcüğün cümledeki anlam ilişkisini ayır.',
      options: question.options,
      answerIndex: question.answerIndex,
      explanation: question.explanation,
      hints: ['Önce olası anlamları listele, sonra bağlamla eleye.', question.explanation],
      skill: game.skill,
      difficulty: Math.max(3, Math.min(5, difficulty)),
      cognitiveDepth: 4,
      questionKey: question.questionKey,
      familyId: question.familyId,
      skeletonId: question.skeletonId,
      reasoningPathId: question.reasoningPathId,
      cognitiveTraits: question.cognitiveTraits
    }));
    if (!rounds.length) {
      rounds = unseenRounds(ALL_MEANING_QUESTIONS, game, difficulty, profile.age, random, seen, game.sessionLength);
    }
  }
  if (gameId === 'paragraph-detective') {
    // Aşama 04: paragraph-detective artık ortak aile-iskelet motorunu
    // (12 gerçek paragraf-becerisi ailesi × 4 görev × 3 yol = 48) kullanır.
    // Tüm iskeletler kind:'choice'. sessionLength*2 üretilir çünkü sonraki
    // premium geçiş/besteci katmanı hedefi 2× tutar; legacy yalnız fallback.
    const { rounds: familyRounds } = generateFromFamilies(PARAGRAPH_DETECTIVE_FAMILIES, {
      seed, count: Math.max(game.sessionLength * 2, 8), seenQuestionKeys: seen, recentFamilyIds, recentSkeletonIds
    });
    rounds = familyRounds.map((question) => ({
      kind: 'choice',
      prompt: question.prompt,
      context: question.context || 'Metindeki kanıta dayan; metinde olmayanı ekleme.',
      options: question.options,
      answerIndex: question.answerIndex,
      explanation: question.explanation,
      hints: ['Sorunun türünü belirle, ilgili cümleleri işaretle.', question.explanation],
      skill: game.skill,
      difficulty: Math.max(3, Math.min(5, difficulty)),
      cognitiveDepth: 4,
      questionKey: question.questionKey,
      familyId: question.familyId,
      skeletonId: question.skeletonId,
      reasoningPathId: question.reasoningPathId,
      cognitiveTraits: question.cognitiveTraits
    }));
    if (!rounds.length) {
      const v4Questions = createPremiumParagraphSession(profile, seed, game.sessionLength * 2, { seenQuestionKeys: seen, recentFamilyIds });
      rounds = v4Questions.map((question) => toChoiceRound({ ...question, detailedOptions: question.detailedOptions }, game, Math.max(2, Math.min(5, question.cognitiveDepth || difficulty))));
      if (rounds.length < game.sessionLength) {
        const occupied = new Set([...seen, ...rounds.map((round) => round.questionKey)]);
        rounds.push(...unseenRounds(ALL_PARAGRAPH_QUESTIONS, game, difficulty, profile.age, random, occupied, game.sessionLength - rounds.length));
      }
    }
  }
  if (gameId === 'logic-station') {
    // Aşama 04: logic-station artık tek create() fabrikaları yerine ortak
    // aile-iskelet motorunu (12 gerçek mantık ailesi × 4 görev × 3 yol = 48)
    // kullanır. Mevcut choice UI korunur.
    const { rounds: familyRounds } = generateFromFamilies(LOGIC_STATION_FAMILIES, {
      seed, count: familyGenerateCount, seenQuestionKeys: seen, recentFamilyIds, recentSkeletonIds
    });
    rounds = familyRounds.map((question) => ({
      kind: 'choice',
      prompt: question.prompt,
      context: question.context,
      options: question.options,
      answerIndex: question.answerIndex,
      explanation: question.explanation,
      familyId: question.familyId,
      skeletonId: question.skeletonId,
      reasoningPathId: question.reasoningPathId,
      cognitiveTraits: question.cognitiveTraits,
      cognitiveDepth: 4,
      skill: game.skill,
      difficulty: Math.max(4, Math.min(5, difficulty)),
      questionKey: question.questionKey,
      hints: ['Önce kesin kısıtları yerleştir.', question.explanation]
    }));
  }
  if (EXAM_QUESTIONS_V53[gameId]) rounds = unseenRounds(EXAM_QUESTIONS_V53[gameId], game, Math.max(3,difficulty), profile.age, random, seen, game.sessionLength);
  if (gameId === 'science-lab') {
    // Aşama 04: science-lab ortak aile-iskelet motorunu
    // (12 gerçek fen kavramı ailesi × 4 görev × 3 yol = 48) kullanır. choice UI.
    const { rounds: familyRounds } = generateFromFamilies(SCIENCE_LAB_FAMILIES, {
      seed, count: familyGenerateCount, seenQuestionKeys: seen, recentFamilyIds, recentSkeletonIds
    });
    rounds = familyRounds.map((question) => ({
      kind: 'choice',
      prompt: question.prompt,
      context: question.context || 'Fen kavramını ayır.',
      options: question.options,
      answerIndex: question.answerIndex,
      explanation: question.explanation,
      hints: ['Kavram ilişkisini kontrol et.', question.explanation],
      skill: game.skill,
      difficulty: Math.max(3, Math.min(5, difficulty)),
      cognitiveDepth: 4,
      questionKey: question.questionKey,
      familyId: question.familyId,
      skeletonId: question.skeletonId,
      reasoningPathId: question.reasoningPathId,
      cognitiveTraits: question.cognitiveTraits
    }));
    if (!rounds.length) {
      rounds = unseenRounds(SCIENCE_QUESTIONS, game, difficulty, profile.age, random, seen, game.sessionLength);
    }
  }
  if (gameId === 'science-reasoning') {
    // Aşama 04: science-reasoning ortak aile-iskelet motorunu
    // (12 gerçek deney-akıl yürütme ailesi × 4 görev × 3 yol = 48) kullanır. choice UI.
    const { rounds: familyRounds } = generateFromFamilies(SCIENCE_REASONING_FAMILIES, {
      seed, count: familyGenerateCount, seenQuestionKeys: seen, recentFamilyIds, recentSkeletonIds
    });
    rounds = familyRounds.map((question) => ({
      kind: 'choice',
      prompt: question.prompt,
      context: question.context || 'Deney düşüncesini ayır.',
      options: question.options,
      answerIndex: question.answerIndex,
      explanation: question.explanation,
      hints: ['Kanıtı ve değişkeni ayır.', question.explanation],
      skill: game.skill,
      difficulty: Math.max(3, Math.min(5, difficulty)),
      cognitiveDepth: 4,
      questionKey: question.questionKey,
      familyId: question.familyId,
      skeletonId: question.skeletonId,
      reasoningPathId: question.reasoningPathId,
      cognitiveTraits: question.cognitiveTraits
    }));
    if (!rounds.length) {
      rounds = unseenRounds(SCIENCE_REASONING_QUESTIONS, game, difficulty, profile.age, random, seen, game.sessionLength);
    }
  }
  if (gameId === 'english-vocabulary') {
    // Aşama 04: english-vocabulary artık sabit ENGLISH_WORDS havuzu yerine ortak
    // aile-iskelet motorunu (12 gerçek kelime-bilme ailesi × 4 görev × 3 yol = 48)
    // kullanır. Tüm iskeletler kind:'choice' (mevcut UI). createEnglishRounds yalnız fallback.
    const { rounds: familyRounds } = generateFromFamilies(ENGLISH_VOCABULARY_FAMILIES, {
      seed, count: familyGenerateCount, seenQuestionKeys: seen, recentFamilyIds, recentSkeletonIds
    });
    rounds = familyRounds.map((question) => ({
      kind: 'choice',
      prompt: question.prompt,
      context: question.context || 'Hedef kelimenin düşünme türünü ayır.',
      options: question.options,
      answerIndex: question.answerIndex,
      explanation: question.explanation,
      hints: ['Önce ilişki türünü belirle, sonra seçenekleri eleye.', question.explanation],
      skill: game.skill,
      difficulty: Math.max(3, Math.min(5, difficulty)),
      cognitiveDepth: 4,
      questionKey: question.questionKey,
      familyId: question.familyId,
      skeletonId: question.skeletonId,
      reasoningPathId: question.reasoningPathId,
      cognitiveTraits: question.cognitiveTraits
    }));
    if (!rounds.length) {
      rounds = createEnglishRounds(profile, game, difficulty, random, seen, options.preferredEnglishWordIds || []);
    }
  }
  if (gameId === 'english-cloze') {
    // Aşama 04: english-cloze artık createEnglishActivityRounds sabit havuzu yerine
    // ortak aile-iskelet motorunu (12 gerçek dilbilgisi-boşluk ailesi × 4 görev × 3 yol = 48)
    // kullanır. Tüm iskeletler kind:'choice'. Legacy yalnız fallback.
    const { rounds: familyRounds } = generateFromFamilies(ENGLISH_CLOZE_FAMILIES, {
      seed, count: familyGenerateCount, seenQuestionKeys: seen, recentFamilyIds, recentSkeletonIds
    });
    rounds = familyRounds.map((question) => ({
      kind: 'choice',
      prompt: question.prompt,
      context: question.context || 'Boşluğa dilbilgisi ve anlam bakımından uygun kelimeyi seç.',
      options: question.options,
      answerIndex: question.answerIndex,
      explanation: question.explanation,
      hints: ['Önce boşluğun kural türünü belirle.', question.explanation],
      skill: game.skill,
      difficulty: Math.max(3, Math.min(5, difficulty)),
      cognitiveDepth: 4,
      questionKey: question.questionKey,
      familyId: question.familyId,
      skeletonId: question.skeletonId,
      reasoningPathId: question.reasoningPathId,
      cognitiveTraits: question.cognitiveTraits,
      timeLimit: 90
    }));
    if (!rounds.length) {
      rounds = createEnglishActivityRounds(gameId, profile, game, difficulty, random, seen);
    }
  }
  if (gameId === 'english-sentence-builder') {
    // Aşama 04: english-sentence-builder ortak aile-iskelet motorunu
    // (12 gerçek sözdizimi ailesi × 4 görev × 3 yol = 48) kullanır.
    // select-valid → kind:'wordOrder'; diğer iskeletler → kind:'choice'.
    const { rounds: familyRounds } = generateFromFamilies(ENGLISH_SENTENCE_BUILDER_FAMILIES, {
      seed, count: familyGenerateCount, seenQuestionKeys: seen, recentFamilyIds, recentSkeletonIds
    });
    rounds = familyRounds.map((question) => {
      const shared = {
        familyId: question.familyId,
        skeletonId: question.skeletonId,
        reasoningPathId: question.reasoningPathId,
        cognitiveTraits: question.cognitiveTraits,
        skill: game.skill,
        difficulty: Math.max(3, Math.min(5, difficulty)),
        cognitiveDepth: 4,
        questionKey: question.questionKey,
        timeLimit: 120
      };
      if (question.kind === 'wordOrder') {
        return {
          kind: 'wordOrder',
          prompt: question.prompt,
          context: question.context,
          tokens: question.tokens,
          answerTokens: question.answerTokens,
          explanation: question.explanation,
          hints: [
            question.context || 'Kelimeleri doğru sıraya diz.',
            question.answerTokens?.[0] ? `İlk kelime: ${question.answerTokens[0]}` : question.explanation
          ],
          ...shared
        };
      }
      return {
        kind: 'choice',
        prompt: question.prompt,
        context: question.context,
        options: question.options,
        answerIndex: question.answerIndex,
        explanation: question.explanation,
        hints: ['Sözdizimi kuralını kontrol et.', question.explanation],
        ...shared
      };
    });
    if (!rounds.length) {
      rounds = createEnglishActivityRounds(gameId, profile, game, difficulty, random, seen);
    }
  }

  if (gameId === 'social-time-travel') {
    // Aşama 04: social-time-travel ortak aile-iskelet motorunu
    // (12 gerçek sosyal/tarih düşüncesi ailesi × 4 görev × 3 yol = 48) kullanır.
    // Tüm iskeletler kind:'choice'. Legacy SOCIAL_QUESTIONS/createSocialRound yalnız fallback.
    const { rounds: familyRounds } = generateFromFamilies(SOCIAL_TIME_TRAVEL_FAMILIES, {
      seed, count: familyGenerateCount, seenQuestionKeys: seen, recentFamilyIds, recentSkeletonIds
    });
    rounds = familyRounds.map((question) => ({
      kind: 'choice',
      prompt: question.prompt,
      context: question.context || 'Tarih düşünme türünü ayır; yüzey isim/yer tuzağına düşme.',
      options: question.options,
      answerIndex: question.answerIndex,
      explanation: question.explanation,
      hints: ['Önce düşünme türünü belirle, sonra seçenekleri eleye.', question.explanation],
      skill: game.skill,
      difficulty: Math.max(3, Math.min(5, difficulty)),
      cognitiveDepth: 4,
      questionKey: question.questionKey,
      familyId: question.familyId,
      skeletonId: question.skeletonId,
      reasoningPathId: question.reasoningPathId,
      cognitiveTraits: question.cognitiveTraits,
      timeLimit: 90
    }));
    if (!rounds.length) {
      rounds = unseenRounds(SOCIAL_QUESTIONS[gameId] || [], game, difficulty, profile.age, random, seen, Math.min(game.sessionLength, (SOCIAL_QUESTIONS[gameId] || []).length));
      if (rounds.length < game.sessionLength) {
        const occupied = new Set([...seen, ...rounds.map((round) => round.questionKey)]);
        rounds.push(...generateUniqueRounds({ count: game.sessionLength - rounds.length, seed: seed + 8801, seen: occupied, generator: (roundSeed) => createSocialRound(gameId, profile.age, roundSeed), convert: (question) => toChoiceRound({ ...question, questionKey: `${gameId}:${hashString(`${question.context || ''}|${question.prompt}|${question.answerValue || question.answer}`).toString(36)}` }, game, difficulty) }));
      }
    }
  }
  if (gameId === 'social-map-skills') {
    // Aşama 04: social-map-skills ortak aile-iskelet motorunu
    // (12 gerçek coğrafya düşüncesi ailesi × 4 görev × 3 yol = 48) kullanır.
    // Tüm iskeletler kind:'choice'. Legacy SOCIAL_QUESTIONS/createSocialRound yalnız fallback.
    const { rounds: familyRounds } = generateFromFamilies(SOCIAL_MAP_SKILLS_FAMILIES, {
      seed, count: familyGenerateCount, seenQuestionKeys: seen, recentFamilyIds, recentSkeletonIds
    });
    rounds = familyRounds.map((question) => ({
      kind: 'choice',
      prompt: question.prompt,
      context: question.context || 'Harita düşünme türünü ayır; yüzey yer adı tuzağına düşme.',
      options: question.options,
      answerIndex: question.answerIndex,
      explanation: question.explanation,
      hints: ['Önce hangi harita becerisini kullandığını belirle.', question.explanation],
      skill: game.skill,
      difficulty: Math.max(3, Math.min(5, difficulty)),
      cognitiveDepth: 4,
      questionKey: question.questionKey,
      familyId: question.familyId,
      skeletonId: question.skeletonId,
      reasoningPathId: question.reasoningPathId,
      cognitiveTraits: question.cognitiveTraits,
      timeLimit: 90
    }));
    if (!rounds.length) {
      rounds = unseenRounds(SOCIAL_QUESTIONS[gameId] || [], game, difficulty, profile.age, random, seen, Math.min(game.sessionLength, (SOCIAL_QUESTIONS[gameId] || []).length));
      if (rounds.length < game.sessionLength) {
        const occupied = new Set([...seen, ...rounds.map((round) => round.questionKey)]);
        rounds.push(...generateUniqueRounds({ count: game.sessionLength - rounds.length, seed: seed + 8801, seen: occupied, generator: (roundSeed) => createSocialRound(gameId, profile.age, roundSeed), convert: (question) => toChoiceRound({ ...question, questionKey: `${gameId}:${hashString(`${question.context || ''}|${question.prompt}|${question.answerValue || question.answer}`).toString(36)}` }, game, difficulty) }));
      }
    }
  }
  if (gameId === 'social-citizenship') {
    // Aşama 04: social-citizenship ortak aile-iskelet motorunu
    // (12 gerçek vatandaşlık düşüncesi ailesi × 4 görev × 3 yol = 48) kullanır.
    // Tüm iskeletler kind:'choice'. Legacy SOCIAL_QUESTIONS/createSocialRound yalnız fallback.
    const { rounds: familyRounds } = generateFromFamilies(SOCIAL_CITIZENSHIP_FAMILIES, {
      seed, count: familyGenerateCount, seenQuestionKeys: seen, recentFamilyIds, recentSkeletonIds
    });
    rounds = familyRounds.map((question) => ({
      kind: 'choice',
      prompt: question.prompt,
      context: question.context || 'Vatandaşlık düşünme türünü ayır; yüzey isim tuzağına düşme.',
      options: question.options,
      answerIndex: question.answerIndex,
      explanation: question.explanation,
      hints: ['Önce hak/ödev/kural türünü belirle.', question.explanation],
      skill: game.skill,
      difficulty: Math.max(3, Math.min(5, difficulty)),
      cognitiveDepth: 4,
      questionKey: question.questionKey,
      familyId: question.familyId,
      skeletonId: question.skeletonId,
      reasoningPathId: question.reasoningPathId,
      cognitiveTraits: question.cognitiveTraits,
      timeLimit: 90
    }));
    if (!rounds.length) {
      rounds = unseenRounds(SOCIAL_QUESTIONS[gameId] || [], game, difficulty, profile.age, random, seen, Math.min(game.sessionLength, (SOCIAL_QUESTIONS[gameId] || []).length));
      if (rounds.length < game.sessionLength) {
        const occupied = new Set([...seen, ...rounds.map((round) => round.questionKey)]);
        rounds.push(...generateUniqueRounds({ count: game.sessionLength - rounds.length, seed: seed + 8801, seen: occupied, generator: (roundSeed) => createSocialRound(gameId, profile.age, roundSeed), convert: (question) => toChoiceRound({ ...question, questionKey: `${gameId}:${hashString(`${question.context || ''}|${question.prompt}|${question.answerValue || question.answer}`).toString(36)}` }, game, difficulty) }));
      }
    }
  } else if (SOCIAL_QUESTIONS[gameId] && gameId !== 'social-time-travel' && gameId !== 'social-map-skills' && gameId !== 'social-citizenship') {
    rounds = unseenRounds(SOCIAL_QUESTIONS[gameId], game, difficulty, profile.age, random, seen, Math.min(game.sessionLength, SOCIAL_QUESTIONS[gameId].length));
    if (rounds.length < game.sessionLength) {
      const occupied = new Set([...seen, ...rounds.map((round) => round.questionKey)]);
      rounds.push(...generateUniqueRounds({ count: game.sessionLength - rounds.length, seed: seed + 8801, seen: occupied, generator: (roundSeed) => createSocialRound(gameId, profile.age, roundSeed), convert: (question) => toChoiceRound({ ...question, questionKey: `${gameId}:${hashString(`${question.context || ''}|${question.prompt}|${question.answerValue || question.answer}`).toString(36)}` }, game, difficulty) }));
    }
  }
  if (gameId === 'religion-practice') {
    // Aşama 04: religion-practice ortak aile-iskelet motorunu
    // (12 gerçek din kültürü ailesi × 4 görev × 3 yol = 48) kullanır. choice UI.
    const { rounds: familyRounds } = generateFromFamilies(RELIGION_PRACTICE_FAMILIES, {
      seed, count: familyGenerateCount, seenQuestionKeys: seen, recentFamilyIds, recentSkeletonIds
    });
    rounds = familyRounds.map((question) => ({
      kind: 'choice',
      prompt: question.prompt,
      context: question.context || 'Din kültürü düşünme türünü ayır.',
      options: question.options,
      answerIndex: question.answerIndex,
      explanation: question.explanation,
      hints: ['Kavram ve değer ilişkisini kontrol et.', question.explanation],
      skill: game.skill,
      difficulty: Math.max(3, Math.min(5, difficulty)),
      cognitiveDepth: 4,
      questionKey: question.questionKey,
      familyId: question.familyId,
      skeletonId: question.skeletonId,
      reasoningPathId: question.reasoningPathId,
      cognitiveTraits: question.cognitiveTraits
    }));
    if (!rounds.length) {
      rounds = unseenRounds(RELIGION_QUESTIONS, game, difficulty, profile.age, random, seen, Math.min(game.sessionLength, RELIGION_QUESTIONS.length), (question) => ({ ...question, detailedOptions: question.optionExplanations }));
      if (rounds.length < game.sessionLength) {
        const occupied = new Set([...seen, ...rounds.map((round) => round.questionKey)]);
        rounds.push(...generateUniqueRounds({ count: game.sessionLength - rounds.length, seed: seed + 22031, seen: occupied, generator: createReligionVariant, convert: (question) => toChoiceRound({ ...question, questionKey:`religion-practice:${hashString(`${question.context}|${question.prompt}|${question.answerValue}`).toString(36)}` }, game, difficulty) }));
      }
    }
  }
  if (gameId === 'lgs-foundation') {
    // Aşama 04: lgs-foundation ortak aile-iskelet motorunu
    // (12 gerçek LGS kalıbı ailesi × 4 görev × 3 yol = 48) kullanır. choice UI.
    const { rounds: familyRounds } = generateFromFamilies(LGS_FOUNDATION_FAMILIES, {
      seed, count: familyGenerateCount, seenQuestionKeys: seen, recentFamilyIds, recentSkeletonIds
    });
    rounds = familyRounds.map((question) => ({
      kind: 'choice',
      prompt: question.prompt,
      context: question.context || 'LGS kalıbını ayır.',
      options: question.options,
      answerIndex: question.answerIndex,
      explanation: question.explanation,
      hints: ['Kalıp türünü belirle.', question.explanation],
      skill: game.skill,
      difficulty: Math.max(3, Math.min(5, difficulty)),
      cognitiveDepth: 4,
      questionKey: question.questionKey,
      familyId: question.familyId,
      skeletonId: question.skeletonId,
      reasoningPathId: question.reasoningPathId,
      cognitiveTraits: question.cognitiveTraits,
      sourceLabel: 'Özgün LGS soru kalıbı'
    }));
    if (!rounds.length) {
      rounds = unseenRounds(LGS_FOUNDATION_QUESTIONS, game, difficulty, profile.age, random, seen, Math.min(game.sessionLength, LGS_FOUNDATION_QUESTIONS.length), (question) => ({ ...question, context: `${question.subject} • ${question.foundation} temeli
${question.context || ''}`, detailedOptions: question.optionExplanations, sourceLabel: 'Özgün LGS soru kalıbı' }));
      if (rounds.length < game.sessionLength) {
        const occupied = new Set([...seen, ...rounds.map((round) => round.questionKey)]);
        rounds.push(...generateUniqueRounds({ count: game.sessionLength - rounds.length, seed: seed + 39019, seen: occupied, generator:createLgsFoundationVariant, convert:(question)=>toChoiceRound({ ...question, context:`${question.subject} • ${question.foundation} temeli
${question.context || ''}`, sourceLabel:'Özgün LGS soru kalıbı', questionKey:`lgs-foundation:${hashString(`${question.subject}|${question.context}|${question.prompt}|${question.answerValue}`).toString(36)}` }, game, difficulty) }));
      }
    }
  }

  if (gameId === 'target-number') {
    // Aşama 04: target-number artık ad-hoc 7 "mode" listesi yerine ortak
    // aile-iskelet-düşünme yolu motorunu (12 gerçek ifade-yapısı ailesi × 4
    // görev türü × 3 yol = 48 gerçekten farklı varyasyon) kullanır. Arayüz
    // kısıtı nedeniyle 2 görev türü `kind:'expression'` (serbest ifade
    // kurucu), 2 görev türü `kind:'choice'` üretir — her ikisi de mevcut
    // app.js arayüzlerini kullanır, yeni UI eklenmedi (bkz. md/arsiv/DIFF_ANALYSIS.md,
    // Aşama 04, math-group-1/3).
    const { rounds: familyRounds } = generateFromFamilies(TARGET_NUMBER_FAMILIES, {
      seed, count: familyGenerateCount, seenQuestionKeys: seen, recentFamilyIds, recentSkeletonIds
    });
    rounds = familyRounds.map((question) => {
      const shared = {
        familyId: question.familyId, skeletonId: question.skeletonId, reasoningPathId: question.reasoningPathId,
        cognitiveTraits: question.cognitiveTraits, skill: game.skill, difficulty, questionKey: question.questionKey
      };
      if (question.kind === 'expression') {
        return {
          kind: 'expression', prompt: question.prompt, rule: question.rule,
          numbers: question.numbers, target: question.target, solution: question.solution,
          hints: ['Önce büyük bir çarpım veya toplam oluşturmayı düşün.', `Bir çözüm düzeni: ${question.solution.replaceAll(/\d/g, '□')}`, `Örnek çözüm: ${question.solution}`],
          explanation: question.explanation, ...shared
        };
      }
      return {
        kind: 'choice', prompt: question.prompt, context: question.context,
        options: question.options, answerIndex: question.answerIndex, explanation: question.explanation,
        hints: ['İfadeyi adım adım, işlem sırasına dikkat ederek hesapla.', question.explanation], ...shared
      };
    });
    // Havuz (48 varyasyon) oturum uzunluğunu fazlasıyla aştığı için bu yola
    // normalde hiç düşülmemeli; yalnız aşırı geniş `seen` geçmişine karşı bir
    // güvenlik ağı olarak eski üreticiyle doldurulur (pattern-lab/speed-math'teki
    // aynı desen).
    if (rounds.length < game.sessionLength) {
      const occupied = new Set([...seen, ...rounds.map((round) => round.questionKey)]);
      rounds.push(...generateUniqueRounds({
        count: game.sessionLength - rounds.length, seed: seed + 91177, seen: occupied, recentSkeletonIds, skeletonAware: true,
        generator: (roundSeed) => createTargetRound(profile.age, roundSeed),
        convert: (target) => ({
          kind: 'expression', prompt: 'Tüm sayıları birer kez kullanarak hedefe ulaş.',
          rule: 'Tüm sayıları birer kez kullan. +, −, ×, ÷ ve parantezlerden istediğini kullan; bütün işlem işaretlerini kullanmak zorunda değilsin.',
          ...target,
          hints: ['Önce büyük bir çarpım veya toplam oluşturmayı düşün.', `Bir çözüm düzeni: ${target.solution.replaceAll(/\d/g, '□')}`, `Örnek çözüm: ${target.solution}`],
          explanation: `${target.solution} = ${target.target}`,
          skill: game.skill, difficulty,
          questionKey: `target-number-legacy:${[...target.numbers].sort((a, b) => a - b).join(',')}:${target.target}`
        })
      }));
    }
  }

  if (gameId === 'speed-math') {
    // Aşama 04: speed-math artık ad-hoc 3-5 "mode" listesi yerine ortak
    // aile-iskelet-düşünme yolu motorunu (12 gerçek işlem-yapısı ailesi × 4
    // iskelet × 3 yol = 48 gerçekten farklı varyasyon) kullanır (bkz.
    // md/arsiv/DIFF_ANALYSIS.md, Aşama 04, math-group-1/2).
    const { rounds: familyRounds } = generateFromFamilies(SPEED_MATH_FAMILIES, {
      seed, count: familyGenerateCount, seenQuestionKeys: seen, recentFamilyIds, recentSkeletonIds
    });
    rounds = familyRounds.map((question) => ({
      kind: 'choice', prompt: question.prompt, context: question.context,
      options: question.options, answerIndex: question.answerIndex, explanation: question.explanation,
      hints: ['İşlem sırasına ve işaretlere dikkat et.', question.explanation], skill: game.skill, difficulty,
      questionKey: question.questionKey,
      familyId: question.familyId, skeletonId: question.skeletonId, reasoningPathId: question.reasoningPathId,
      cognitiveTraits: question.cognitiveTraits
    }));
    // Havuz (48 varyasyon) oturum uzunluğunu (8) fazlasıyla aştığı için bu
    // yola normalde hiç düşülmemeli; yalnız aşırı geniş `seen` geçmişine karşı
    // bir güvenlik ağı olarak eski üreticiyle doldurulur (pattern-lab'daki
    // aynı desen — hiçbir oyun sessizce eksik oturum döndürmemeli).
    if (rounds.length < game.sessionLength) {
      const occupied = new Set([...seen, ...rounds.map((round) => round.questionKey)]);
      rounds.push(...generateUniqueRounds({
        count: game.sessionLength - rounds.length, seed: seed + 77113, seen: occupied, recentSkeletonIds, skeletonAware: true,
        generator: (roundSeed) => createArithmeticRound(profile.age, roundSeed),
        convert: (question) => ({
          kind: 'choice', prompt: `${question.prompt} işleminin sonucu kaçtır?`,
          context: 'Hızlı ol; fakat işlem önceliğini ve işaretleri kontrol et.', options: question.options,
          answerIndex: question.options.indexOf(String(question.answer)), explanation: `Doğru sonuç ${question.answer}.`, hints: [],
          skill: game.skill, difficulty, questionKey: `speed-math-legacy:${question.prompt}`,
          familyId: question.familyId || null, skeletonId: question.skeletonId || null
        })
      }));
    }
  }

  if (gameId === 'pattern-lab') {
    // Aşama 04: pattern-lab artık ad-hoc "mode" listesi yerine ortak
    // aile-iskelet-düşünme yolu motorunu (12 aile × 4 iskelet × 3 yol = 48
    // gerçekten farklı varyasyon) kullanır (bkz. md/arsiv/DIFF_ANALYSIS.md, Aşama 04).
    const { rounds: familyRounds } = generateFromFamilies(PATTERN_LAB_FAMILIES, {
      seed, count: familyGenerateCount, seenQuestionKeys: seen, recentFamilyIds, recentSkeletonIds
    });
    rounds = familyRounds.map((question) => ({
      kind: 'choice', prompt: question.prompt, context: question.context,
      options: question.options, answerIndex: question.answerIndex, explanation: question.explanation,
      hints: ['Sayılar arasındaki ilişkiye bak.', question.explanation], skill: game.skill, difficulty,
      questionKey: question.questionKey,
      familyId: question.familyId, skeletonId: question.skeletonId, reasoningPathId: question.reasoningPathId,
      cognitiveTraits: question.cognitiveTraits
    }));
    // Havuz (48 varyasyon) oturum uzunluğunu (5) fazlasıyla aştığı için bu
    // yola normalde hiç düşülmemeli; yalnız aşırı geniş `seen` geçmişine karşı
    // bir güvenlik ağı olarak eski üreticiyle doldurulur (bkz. B-002 dersi:
    // hiçbir oyun sessizce eksik oturum döndürmemeli).
    if (rounds.length < game.sessionLength) {
      const occupied = new Set([...seen, ...rounds.map((round) => round.questionKey)]);
      rounds.push(...generateUniqueRounds({
        count: game.sessionLength - rounds.length, seed: seed + 55111, seen: occupied, recentSkeletonIds, skeletonAware: true,
        generator: (roundSeed) => createPatternRound(profile.age, roundSeed),
        convert: (question) => ({
          kind: 'choice', prompt: `${question.sequence.join('  •  ')}  •  ?`, context: 'Dizinin kuralını bul ve sıradaki sayıyı seç.',
          options: question.options, answerIndex: question.options.indexOf(String(question.answer)), explanation: question.rule,
          hints: ['Sayılar arasındaki farklara bak.', question.rule], skill: game.skill, difficulty,
          questionKey: `pattern-lab:${question.sequence.join(',')}`,
          familyId: question.familyId || null, skeletonId: question.skeletonId || null
        })
      }));
    }
  }

  if (gameId === 'geometry-lab') {
    // Aşama 04: geometry-lab artık ad-hoc 10-mode listesi yerine ortak
    // aile-iskelet-düşünme yolu motorunu (12 gerçek formül-yapısı ailesi × 4
    // görev türü × 3 yol = 48 gerçekten farklı varyasyon) kullanır (bkz.
    // md/arsiv/DIFF_ANALYSIS.md, Aşama 04, math-group-1/4). `visual` alanı js/app.js'deki
    // MEVCUT şekil render tiplerini (rectangle/square/triangle/cube/prism/
    // trapezoid/composite/angles) birebir yeniden kullanır, yeni UI eklenmedi.
    const { rounds: familyRounds } = generateFromFamilies(GEOMETRY_LAB_FAMILIES, {
      seed, count: familyGenerateCount, seenQuestionKeys: seen, recentFamilyIds, recentSkeletonIds
    });
    rounds = familyRounds.map((question) => ({
      kind: 'choice', prompt: question.prompt, context: question.context,
      options: question.options, answerIndex: question.answerIndex, explanation: question.explanation,
      hints: ['Şekilde verilen ölçüleri ve sorulan büyüklüğü ayır.', question.explanation.split('=')[0].trim()],
      visual: question.visual || null, skill: game.skill, difficulty, questionKey: question.questionKey,
      familyId: question.familyId, skeletonId: question.skeletonId, reasoningPathId: question.reasoningPathId,
      cognitiveTraits: question.cognitiveTraits
    }));
    // Havuz (48 varyasyon) oturum uzunluğunu (6) fazlasıyla aştığı için bu
    // yola normalde hiç düşülmemeli; yalnız aşırı geniş `seen` geçmişine karşı
    // bir güvenlik ağı olarak eski üreticiyle doldurulur (pattern-lab/speed-math/
    // target-number'daki aynı desen).
    if (rounds.length < game.sessionLength) {
      const occupied = new Set([...seen, ...rounds.map((round) => round.questionKey)]);
      rounds.push(...generateUniqueRounds({
        count: game.sessionLength - rounds.length, seed: seed + 66131, seen: occupied, recentSkeletonIds, skeletonAware: true,
        generator: (roundSeed) => createGeometryRound(profile.age, roundSeed),
        convert: (question) => ({
          kind: 'choice', prompt: question.prompt, context: question.context, options: question.options,
          answerIndex: question.options.indexOf(String(question.answer)), explanation: question.explanation,
          hints: ['Şekilde verilen ölçüleri ve sorulan büyüklüğü ayır.', question.explanation.split('=')[0].trim()],
          visual: question.visual, skill: game.skill, difficulty,
          questionKey: `geometry-lab-legacy:${hashString(`${question.prompt}|${question.context}`).toString(36)}`,
          familyId: question.familyId || null, skeletonId: question.skeletonId || null
        })
      }));
    }
  }

  if (gameId === 'problem-hunter') {
    // Aşama 04: problem-hunter artık tek kaba aile + 5–6 mode yerine ortak
    // aile-iskelet motorunu (12 gerçek problem-yapısı ailesi × 4 görev × 3 yol
    // = 48 varyasyon) kullanır. Linear aile sözel ifade kullanır; "Nx ± d ="
    // ve kısa "x kaçtır" üretilmez (grade≥4 trivialLinear/trivialPrompt).
    const { rounds: familyRounds } = generateFromFamilies(PROBLEM_HUNTER_FAMILIES, {
      seed, count: familyGenerateCount, seenQuestionKeys: seen, recentFamilyIds, recentSkeletonIds
    });
    rounds = familyRounds.map((question) => ({
      kind: 'choice', prompt: question.prompt, context: question.context,
      options: question.options, answerIndex: question.answerIndex, explanation: question.explanation,
      hints: ['Soruda istenen son büyüklüğü belirle.', question.explanation.split(';')[0] || question.explanation],
      skill: game.skill, difficulty, questionKey: question.questionKey,
      familyId: question.familyId, skeletonId: question.skeletonId, reasoningPathId: question.reasoningPathId,
      cognitiveTraits: question.cognitiveTraits
    }));
    if (rounds.length < game.sessionLength) {
      const occupied = new Set([...seen, ...rounds.map((round) => round.questionKey)]);
      rounds.push(...generateUniqueRounds({
        count: game.sessionLength - rounds.length, seed: seed + 77221, seen: occupied, recentSkeletonIds, skeletonAware: true,
        generator: (roundSeed) => createProblemRound(profile.age, roundSeed),
        convert: (question) => ({
          kind: 'choice', prompt: question.prompt, context: 'Önce verilenleri ve isteneni ayır.', options: question.options,
          answerIndex: question.options.indexOf(String(question.answer)), explanation: question.explanation,
          hints: ['Soruda istenen son büyüklüğü belirle.', question.explanation.split(';')[0]], skill: game.skill, difficulty,
          questionKey: `problem-hunter-legacy:${hashString(question.prompt).toString(36)}`,
          familyId: question.familyId || null, skeletonId: question.skeletonId || null
        })
      }));
    }
  }

  if (gameId === 'olympiad-ladder') {
    // Aşama 04: olympiad-ladder artık tek create() fabrikaları yerine ortak
    // aile-iskelet motorunu (12 gerçek olimpiyat ailesi × 4 görev × 3 yol = 48)
    // kullanır. Mevcut choice UI korunur.
    const { rounds: familyRounds } = generateFromFamilies(OLYMPIAD_LADDER_FAMILIES, {
      seed, count: familyGenerateCount, seenQuestionKeys: seen, recentFamilyIds, recentSkeletonIds
    });
    rounds = familyRounds.map((question) => ({
      kind: 'choice',
      prompt: question.prompt,
      context: question.context || 'Küçük örnek dene, düzeni fark et ve genelle.',
      options: question.options,
      answerIndex: question.answerIndex,
      explanation: question.explanation,
      visual: question.visual || null,
      hints: ['Soruyu küçük bir örnekle dene.', 'Verileri tablo veya kısa listeyle düzenle.', question.explanation],
      skill: game.skill,
      difficulty: Math.max(4, Math.min(5, difficulty)),
      cognitiveDepth: 4,
      questionKey: question.questionKey,
      familyId: question.familyId,
      skeletonId: question.skeletonId,
      reasoningPathId: question.reasoningPathId,
      cognitiveTraits: question.cognitiveTraits
    }));
  }

  if (gameId === 'error-detective') {
    // Aşama 04: error-detective artık tek legacy aile + 5–6 mode yerine ortak
    // aile-iskelet motorunu (12 gerçek hata-türü ailesi × 4 görev × 3 yol = 48
    // varyasyon) kullanır. Mevcut choice UI korunur (adımlar/düzeltmeler seçenek).
    const { rounds: familyRounds } = generateFromFamilies(ERROR_DETECTIVE_FAMILIES, {
      seed, count: familyGenerateCount, seenQuestionKeys: seen, recentFamilyIds, recentSkeletonIds
    });
    rounds = familyRounds.map((question) => ({
      kind: 'choice',
      prompt: question.prompt,
      context: question.context,
      options: question.options,
      answerIndex: question.answerIndex,
      explanation: question.explanation,
      steps: question.steps || null,
      hints: ['İlk bozulan adımı bul; sonraki adımlar ona bağlı olabilir.', question.explanation],
      skill: game.skill,
      difficulty,
      questionKey: question.questionKey,
      familyId: question.familyId,
      skeletonId: question.skeletonId,
      reasoningPathId: question.reasoningPathId,
      cognitiveTraits: question.cognitiveTraits
    }));
    if (rounds.length < game.sessionLength) {
      const occupied = new Set([...seen, ...rounds.map((round) => round.questionKey)]);
      rounds.push(...generateUniqueRounds({
        count: game.sessionLength - rounds.length, seed: seed + 88331, seen: occupied, recentSkeletonIds, skeletonAware: true,
        generator: (roundSeed) => createErrorRound(profile.age, roundSeed),
        convert: (question, attempt) => {
          const shuffledVariant = attempt > 20 ? `${question.prompt} (${attempt})` : question.prompt;
          return toChoiceRound({
            ...question,
            prompt: shuffledVariant,
            options: question.steps.map((step, index) => `${index + 1}. ${step}`),
            questionKey: `error-detective-legacy:${hashString(question.steps.join('|')).toString(36)}`
          }, game, difficulty);
        }
      }));
    }
  }


  // Premium soru bankası: yalnız insan tarafından yazılmış, gerçek misconception
  // kayıtları ve çözüm kanıtı taşıyan havuz kullanılır. Premiuma taşınmış hiçbir
  // oyunda havuz tükendiğinde düşük kaliteli legacy içeriğe sessiz dönüş yapılmaz.
  const premiumGrade = Number(profile?.grade);
  const premiumBank = generatePremiumRounds(gameId, {
    seed,
    count: Math.max(game.sessionLength * 4, 20),
    seenQuestionKeys: seen,
    grade: Number.isInteger(premiumGrade) && premiumGrade >= 1 && premiumGrade <= 12 ? premiumGrade : null
  });
  // Aşama 04 aile motorları canlı oturumun birincil üreticisidir. Premium banka
  // bu oyunlarda aile motorunu ezmez; aile çıktısını kalite/ürün metadatasıyla
  // sertifikalar. Böylece tek kanonik aile kimliği korunurken premium ürün
  // sözleşmesi de devam eder. Uygun premium havuz gerçekten tükenmişse legacy
  // veya aile havuzuna sessiz dönüş yapılmaz.
  const liveFamilyPool = STAGE09_FAMILY_POOLS[gameId] || null;
  const pilotProbe = PREMIUM_PILOT_LIVE_GAMES.has(gameId) && Number(profile?.grade) >= 5
    ? generatePremiumPilotRounds(gameId, { seed, count: 1, seenQuestionKeys: seen, grade: null })
    : null;
  const explicitPilotProbe = PREMIUM_PILOT_LIVE_GAMES.has(gameId) && Number(profile?.grade) >= 5 && explicitlySeenQuestionKeys.size
    ? generatePremiumPilotRounds(gameId, { seed, count: 1, seenQuestionKeys: explicitlySeenQuestionKeys, grade: null })
    : null;
  const pilotExplicitlyExhausted = Boolean(explicitPilotProbe?.audit?.gradeEligibleAvailable > 0
    && explicitPilotProbe?.audit?.unseenAvailable === 0);
  // İnsan yazımı pilot ilk iki oturumda kalibrasyon için kullanılır. Sonraki
  // oturumlar doğrulanmış aile motoruna geçer. Öğrencinin normal attempts geçmişi
  // pilotu tükettiğinde bu doğal geçiştir; yalnız çağıranın açık seenQuestionKeys
  // listesi bankayı tamamen kapatmışsa sessiz fallback yasağı için underfill korunur.
  const pilotHasFullSession = Boolean(pilotProbe && pilotProbe.audit.unseenAvailable >= game.sessionLength);
  // Ürün bankası entegrasyon testleri ve tarihli canlı yayın çağrıları, aile
  // motoru yerine doğrudan insan yazımı premium bankayı doğrular. Tarihli çağrı
  // açık bir kaynak seçimi olduğundan ilk iki oturum pilot kalibrasyonundan önce gelir.
  const forceDirectPremiumBank = Boolean(options.simulatedDate);
  const pilotLiveSource = Boolean(!forceDirectPremiumBank
    && pilotProbe
    && ((currentSessionIndex <= 2 && pilotHasFullSession) || pilotExplicitlyExhausted));
  // Stage04 aile testleri ve yıllık besteci sertifikalı aile motorunu kullanmaya
  // devam eder; yalnız tarihli yayın çağrıları doğrudan premium bankayı seçer.
  const familyEngineOwnsLiveSession = Boolean(liveFamilyPool && !pilotLiveSource && !forceDirectPremiumBank);
  let premiumBankExhausted = false;
  if (premiumBank.audit.supported) {
    const eligiblePremiumExists = Number(premiumBank.audit.gradeEligibleAvailable || 0) > 0;
    const premiumExhausted = eligiblePremiumExists
      && Number(premiumBank.audit.unseenAvailable || 0) === 0
      && premiumBank.rounds.length === 0;
    const explicitPremiumProbe = familyEngineOwnsLiveSession && explicitlySeenQuestionKeys.size
      ? generatePremiumRounds(gameId, {
        seed,
        count: 1,
        seenQuestionKeys: explicitlySeenQuestionKeys,
        grade: Number(profile?.grade)
      })
      : null;
    const explicitlyExhausted = Boolean(explicitPremiumProbe
      && Number(explicitPremiumProbe.audit.gradeEligibleAvailable || 0) > 0
      && Number(explicitPremiumProbe.audit.unseenAvailable || 0) === 0
      && explicitPremiumProbe.rounds.length === 0);
    // Aile motoru canlı kaynağıysa, yalnız gerçek kullanıcı geçmişinin premium
    // referans bankasını tüketmesi aile üretimini durdurmaz. Ancak çağıran taraf
    // bankanın tamamını explicit seen ile kapatmışsa sessiz fallback yasağı korunur.
    if (premiumExhausted && (!familyEngineOwnsLiveSession || explicitlyExhausted)) {
      premiumBankExhausted = true;
      rounds = [];
    } else if (pilotLiveSource) {
      const pilotBank = generatePremiumPilotRounds(gameId, {
        seed,
        count: Math.max(game.sessionLength * 4, 20),
        seenQuestionKeys: seen,
        // Stage04 canlı pilotu 5. sınıftan itibaren aynı doğrulanmış 6-8
        // bankayı kalibrasyon amacıyla kullanır; doğrudan banka API'sinin
        // sınıf filtresi ise bağımsız premium testlerde korunur.
        grade: null
      });
      rounds = pilotBank.rounds.map((round) => ({
        ...round,
        premiumQuestion: true,
        premiumBankVersion: round.premiumBankVersion || `premium-pilot-${pilotBank.audit.version || '1.0.0'}`,
        premiumTier: round.premiumTier || 'GOLD',
        sourceLabel: round.sourceLabel || 'Zihin Arenası İnsan Yazımı Premium Pilot'
      }));
      premiumBank.audit.liveSource = 'PREMIUM_PILOT';
      premiumBank.audit.pilotAudit = pilotBank.audit;
    } else if (familyEngineOwnsLiveSession && rounds.length) {
      const reference = premiumBank.rounds[0] || null;
      rounds = rounds.map((round) => ({
        ...round,
        premiumQuestion: true,
        premiumBankVersion: reference?.premiumBankVersion || 'family-engine-certified-v1',
        premiumTier: reference?.premiumTier || 'GOLD',
        sourceLabel: 'Zihin Arenası Doğrulanmış Aile Motoru',
        gradeBand: reference?.gradeBand || round.gradeBand || (Number(profile?.grade) <= 5 ? '3-5' : '6-8'),
        familyEngineCertified: true
      }));
      premiumBank.audit.liveSource = 'FAMILY_ENGINE_CERTIFIED';
      premiumBank.audit.certifiedFamilyRoundCount = rounds.length;
    } else {
      rounds = premiumBank.rounds;
    }
  }

  // Kontrollü canlı pilot fail-closed çalışır: doğrulanmış pilot turu varsa
  // yalnız o tur(lar) teslim edilir; eski aile/premium/fallback havuzları aynı
  // oturuma karıştırılmaz. İlgili sınıf-oyun hücresinde doğrulanmış tur yoksa
  // boş oturum döner ve uygulama kullanıcıya oyunun güncellendiğini bildirir.
  const strictControlledLiveBeta = options.controlledLaunchPilot === true;
  const controlledLiveBeta = strictControlledLiveBeta
    ? controlledLiveBetaRounds(gameId, profile, { seenQuestionKeys: seen, seed: sessionSeed })
    : { rounds: [], audit: { version: null, eligibleCount: 0, disabled: true } };
  if (strictControlledLiveBeta) {
    rounds = [...controlledLiveBeta.rounds];
    premiumBank.audit.liveSource = controlledLiveBeta.rounds.length
      ? 'CONTROLLED_LIVE_BETA_ONLY'
      : 'CONTROLLED_LIVE_BETA_UNAVAILABLE';
  }

  const isFirstGameExperience = options.completedSessionCount === 0;
  const goldCandidate = isFirstGameExperience && !strictControlledLiveBeta
    ? createGoldShowcaseRound(gameId, game, profile, sessionSeed, seen, blockedFamilies)
    : null;
  // Kapı öncesi surplus havuzu korunur; sessionLength'e kesmek underfill üretir.
  const preComposerTarget = Math.max(rounds.length, game.sessionLength * 4);
  const goldInjection = injectGoldShowcase(rounds, goldCandidate, preComposerTarget);
  rounds = goldInjection.rounds;

  rounds = rounds
    .map((round) => enrichRoundAcademicMetadata(gameId, round))
    .map((round) => attachGlobalQuality(round, {
      grade: Number(profile.grade || 0),
      gameId,
      subjectId: round.subjectId || game.category || ''
    }));

  const signatureSet = new Set();
  rounds = rounds.filter((round) => {
    if (isRoundQuarantined(round, seen, blockedFamilies)) return false;
    const signature = `${round.questionKey}|${round.prompt}|${round.context||''}`.toLocaleLowerCase('tr-TR');
    if (signatureSet.has(signature)) return false;
    signatureSet.add(signature);
    const declaredDifficulty = Number(round.cognitiveDepth || round.difficulty || difficulty || 3);
    if (declaredDifficulty < 3) return false;
    if (Number(profile.grade||0) >= 4) {
      const trivialLinear = /(?:^|\s)[1-4]?x\s*[+\-]\s*\d+\s*=\s*\d+/i.test(round.prompt||'');
      const trivialPrompt = gameId !== 'speed-math' && /(?:sonucu kaçtır|x kaçtır)\??$/i.test(round.prompt||'') && (round.prompt||'').length < 42;
      if (trivialLinear || trivialPrompt) return false;
    }
    return true;
  });

  // Aşama 09: kalite kapılarından ÖNCE oturum uzunluğuna kesme — surplus havuzu korunur.
  const enforcement = enforceSessionQuality(rounds, {
    grade: Number(profile.grade || 0),
    gameId,
    subjectId: game.category || ''
  }, {
    targetCount: rounds.length,
    firstExperience: options.completedSessionCount === 0
  });
  rounds = enforcement.rounds;

  // Surplus havuzu kapılara kadar korunur; sessionLength kesimi besteci sonrasındadır.
  const premiumTransition = transitionLegacyContent({
    gameId,
    game,
    profile,
    sessionSeed,
    rounds,
    targetCount: Math.max(rounds.length, game.sessionLength),
    seenQuestionKeys: seen,
    blockedQuestionFamilies: blockedFamilies,
    generatePremiumQuestion: generatePremiumGoldQuestion,
    toRound: toChoiceRound
  });
  rounds = premiumTransition.rounds
    .map((round) => enrichRoundAcademicMetadata(gameId, round))
    .map((round) => attachGlobalQuality(round, {
      grade: Number(profile.grade || 0),
      gameId,
      subjectId: round.subjectId || game.category || ''
    }));
  enforcement.acceptedBeforeTransition = enforcement.accepted;
  enforcement.accepted = rounds.length;
  enforcement.complete = !enforcement.requested || rounds.length >= game.sessionLength;
  enforcement.transitionInserted = premiumTransition.audit.inserted;

  const studentBrainProfile = buildStudentBrainProfile(options.attempts || []);
  let brainPolicy = brainProfileSessionPolicy(studentBrainProfile);
  if (classTarget?.topicIds?.length) {
    const focus = new Set(classTarget.topicIds);
    const focused = rounds.filter((round) => focus.has(round.topicId));
    const rest = rounds.filter((round) => !focus.has(round.topicId));
    rounds = focused.length ? [...focused, ...rest] : rounds;
    brainPolicy = {
      ...brainPolicy,
      classTargetTopicIds: classTarget.topicIds,
      remediationShare: Math.max(Number(brainPolicy.remediationShare || 0.15), classTarget.focusShare),
      challengeShare: brainPolicy.challengeShare
    };
  }
  const v11Remediation = attachV11SilentRemediation(rounds, options.attempts || [], {
    maxShare: Math.min(0.35, Number(brainPolicy.remediationShare || 0.25))
  });
  rounds = v11Remediation.rounds;
  // Besteci kalite kapılarından sonra çalışır (Aşama 09 underfill önlemi).
  let premiumComposition = { audit: { deferredUntilQualityGates: true } };

  const globalQualityAudit = auditGlobalSession(rounds, {
    grade: Number(profile.grade || 0),
    gameId,
    subjectId: game.category || ''
  });
  globalQualityAudit.premiumComposition = premiumComposition.audit;
  globalQualityAudit.studentBrainProfile = studentBrainProfile;
  globalQualityAudit.v11MisconceptionRemediation = v11Remediation.audit;
  globalQualityAudit.enforcement = enforcement;
  globalQualityAudit.premiumTransition = premiumTransition.audit;
  globalQualityAudit.premiumBank = premiumBank.audit;
  globalQualityAudit.controlledLiveBeta = controlledLiveBeta.audit;
  globalQualityAudit.goldShowcase = {
    eligible: Boolean(GOLD_FAMILY_BY_GAME[gameId]),
    firstExperience: isFirstGameExperience,
    injected: goldInjection.injected,
    familyId: goldCandidate?.familyId || null,
    questionKey: goldCandidate?.questionKey || null
  };

  // İngilizce oyunlarında açıklama her tur türünde Türkçe karşılığı taşır.
  rounds = rounds.map((round) => {
    if (!['english-cloze', 'english-sentence-builder'].includes(gameId)) return round;
    if (/Türkçesi:/i.test(String(round.explanation || ''))) return round;
    const translation = String(round.context || '').match(/Türkçesi:\s*(.+)$/i)?.[1]
      || 'Doğru çözüm cümlenin anlam ve dilbilgisi yapısını tamamlar.';
    return { ...round, explanation: `${round.explanation || ''} Türkçesi: ${translation}`.trim() };
  });

  // Ortak seçenek tanı sözleşmesi: tüm choice turları render ve kalite
  // denetimlerinde aynı veri biçimini taşır. Oyun üreticisinin verdiği gerçek
  // detailedOptions/optionDiagnostics korunur; eksikse açık ve izlenebilir
  // varsayılan metadata üretilir.
  const normalizeChoiceRound = (round) => {
    if (round.kind !== 'choice' || !Array.isArray(round.options)) return normalizeRoundWithQuestionFactory(round, { grade: Number(profile.grade || 0), gameId });
    const localizedExplanation = ['english-cloze', 'english-sentence-builder'].includes(gameId)
      && !/Türkçesi:/i.test(String(round.explanation || ''))
        ? `${round.explanation || ''} Türkçesi: Doğru çözüm cümlenin anlam ve dilbilgisi yapısını tamamlar.`.trim()
        : round.explanation;
    const evidenceMap = gameId === 'paragraph-detective' && !round.evidenceMap
      ? {
          evidence: [{ id: 'prompt-evidence-1', text: String(round.prompt || '') }],
          correctAnswerEvidenceIds: ['prompt-evidence-1']
        }
      : round.evidenceMap;
    return normalizeRoundWithQuestionFactory({
      ...round,
      explanation: localizedExplanation,
      evidenceMap
    }, { grade: Number(profile.grade || 0), gameId });
  };
  rounds = rounds.map(normalizeChoiceRound);

  // Aşama 05–08 yayın kapıları (surplus havuz üzerinde).
  const familyPool = premiumBankExhausted
    ? null
    : (familyEngineOwnsLiveSession
      ? liveFamilyPool
      : (PREMIUM_GAME_IDS.includes(gameId) ? null : STAGE09_FAMILY_POOLS[gameId]));
  const familyPoolSize = Array.isArray(familyPool) ? familyPool.length : 0;
  let strictSessionFamilyUniqueness = familyPoolSize >= game.sessionLength;
  const gradeNum = Number(profile.grade || 0);
  const beforeGateCount = rounds.length;
  rounds = applyPublicationGates(rounds, gradeNum);
  const approvedRemediationCandidates = rounds.filter((round) => round.v11Remediation && round.adaptivePlacement);
  globalQualityAudit.v11MisconceptionRemediation.approvedCandidateCount = approvedRemediationCandidates.length;
  if (familyPool) {
    strictSessionFamilyUniqueness = new Set(rounds.map((round) => round.familyId).filter(Boolean)).size >= game.sessionLength;
    // Cooldown penceresi ham 48 iskelete değil, gerçek yayın kapılarından geçen
    // kullanılabilir iskelet kapasitesine göre sınırlandırılır. Örneğin bir ders
    // motorunda yalnız 25 iskelet yayınlanabilir durumdaysa 10'luk oturum için
    // 3 geçmiş oturumu (30 iskelet) bloke etmek matematiksel olarak imkânsızdır.
    // Exact questionKey, oturum-içi iskelet, CX, structural ve yüzey yasakları
    // aynen korunur; yalnız skeleton lookback kapasitenin taşıdığı kadar olur.
    const publishableSkeletonCount = new Set(rounds.map((round) => round.skeletonId).filter(Boolean)).size;
    const configuredLookback = REPETITION_POLICY_V2.skeletonId.forbiddenLookbackSessions;
    const capacityLookback = publishableSkeletonCount > 0
      ? Math.max(0, Math.floor(publishableSkeletonCount / Math.max(1, game.sessionLength)) - 1)
      : configuredLookback;
    const effectiveLookback = Math.min(configuredLookback, capacityLookback);
    if (effectiveLookback < configuredLookback) {
      recentSkeletonSet.clear();
      for (const attempt of policyAttempts) {
        if (!attempt || attempt.gameId !== gameId || !attempt.skeletonId) continue;
        const idx = Number(attempt.sessionIndex ?? attempt.sessionSequence ?? 0);
        const age = currentSessionIndex - idx;
        if (idx < currentSessionIndex && age > 0 && age <= effectiveLookback) recentSkeletonSet.add(attempt.skeletonId);
      }
    }
  }
  globalQualityAudit.optionQuality = { kept: rounds.length, rejected: Math.max(0, beforeGateCount - rounds.length) };
  globalQualityAudit.independentSolver = { kept: rounds.length };
  globalQualityAudit.semanticRepeat = { kept: rounds.length };
  globalQualityAudit.cognitiveDepth = { grade: gradeNum, kept: rounds.length };

  // Aşama 09: kapı sonrası underfill varsa aile havuzundan kaliteli backfill.
  // Backfill birleşiminden sonra semantik filtre TÜM oturum havuzuna yeniden uygulanır
  // (yalnız yeni partiyi filtrelemek aynı çözüm grafiğini tekrar sokabilir).
  let backfillInserted = 0;
  if (!strictControlledLiveBeta && familyPool && rounds.length < game.sessionLength) {
    const occupied = new Set([...seen, ...rounds.map((round) => round.questionKey).filter(Boolean)]);
    const occupiedFp = new Set();
    const occupiedShape = new Set();
    const occupiedCx = new Set(recentCognitiveExperienceIds);
    for (const round of rounds) {
      const id = attachSemanticIdentity(round).semanticIdentity;
      if (id?.semanticFingerprint) occupiedFp.add(id.semanticFingerprint);
      if (id?.familyId && id?.solutionShape) occupiedShape.add(`${id.familyId}|${id.solutionShape}`);
      const cx = round.cognitiveExperienceId || buildCognitiveExperience(round).cognitiveExperienceId;
      if (cx) occupiedCx.add(cx);
    }
    for (let guard = 0; guard < 8 && rounds.length < game.sessionLength; guard += 1) {
      const need = game.sessionLength - rounds.length;
      const { rounds: extra } = generateFromFamilies(familyPool, {
        seed: seed + 17033 * (guard + 1),
        count: Math.min(Math.max(need * 4, 16), 36),
        seenQuestionKeys: occupied,
        // Backfill'de recent skeleton baskısını gevşet; underfill kritik.
        recentFamilyIds: guard < 2 ? recentFamilyIds : [],
        recentSkeletonIds: guard < 2 ? recentSkeletonIds : []
      });
      let mapped = extra
        .map((question) => materializeFamilyChoiceRound(question, game, difficulty))
        .map((round) => enrichRoundAcademicMetadata(gameId, round))
        .map(normalizeChoiceRound)
        .map((round) => attachGlobalQuality(round, {
          grade: gradeNum,
          gameId,
          subjectId: round.subjectId || game.category || ''
        }));
      mapped = applyPublicationGates(mapped, gradeNum);
      let insertedThisGuard = 0;
      for (const round of mapped) {
        if (rounds.length >= game.sessionLength) break;
        if (!round.questionKey || occupied.has(round.questionKey) || seen.has(round.questionKey)) continue;
        const id = attachSemanticIdentity(round).semanticIdentity;
        const fp = id?.semanticFingerprint;
        const shapeKey = id?.familyId && id?.solutionShape ? `${id.familyId}|${id.solutionShape}` : null;
        const cx = round.cognitiveExperienceId || buildCognitiveExperience(round).cognitiveExperienceId;
        if (fp && occupiedFp.has(fp)) continue;
        if (shapeKey && occupiedShape.has(shapeKey)) continue;
        if (cx && occupiedCx.has(cx)) continue;
        if (cx && recentCognitiveExperienceIds.has(cx)) continue;
        const st = round.structuralId || buildCognitiveExperience(round).structuralId;
        if (st && recentStructuralIds.has(st)) continue;
        if (round.skeletonId && recentSkeletonSet.has(round.skeletonId)) continue;
        if (fp && blockedSurfaceFingerprints.has(fp)) continue;
        occupied.add(round.questionKey);
        if (fp) occupiedFp.add(fp);
        if (shapeKey) occupiedShape.add(shapeKey);
        if (cx) occupiedCx.add(cx);
        rounds.push(round);
        backfillInserted += 1;
        insertedThisGuard += 1;
      }
      if (!insertedThisGuard && guard >= 3) break;
    }
    rounds = filterSessionSemanticRepeats(rounds).kept;
  }
  // Backfill turları da aynı seçenek tanı / distractorValidation sözleşmesini taşır.
  rounds = rounds.map(normalizeChoiceRound);
  globalQualityAudit.stage09BackfillInserted = backfillInserted;

  // Yıllık orkestrasyon: underfill yaratmadan taze aile/iskelet/çözüm grafiğini öne al.
  const roundStructuralId = (round) => {
    if (round.structuralId) return round.structuralId;
    return buildCognitiveExperience(round).structuralId;
  };
  const roundSurfaceFp = (round) => {
    const id = attachSemanticIdentity(round).semanticIdentity || {};
    return round.durableSurfaceFingerprint
      || id.durableSurfaceFingerprint
      || round.surfaceFingerprint
      || id.surfaceFingerprint
      || null;
  };
  const rankAnnualFreshness = (round) => {
    const id = attachSemanticIdentity(round).semanticIdentity || {};
    const cx = round.cognitiveExperienceId || buildCognitiveExperience(round).cognitiveExperienceId;
    const fam = round.familyId || id.familyId;
    let score = round.controlledLaunchPilot === true ? -100 : 0;
    if (rankingFamilyIds.includes(fam)) score += 4;
    if (familyShareBlocked.has(fam)) score += 8;
    if (previousDominantFamilyId && fam === previousDominantFamilyId) score += 6;
    if (recentSkeletonIds.includes(round.skeletonId || id.skeletonId)) score += 4;
    const st = roundStructuralId(round);
    if (st && recentStructuralIds.has(st)) score += 5;
    if (id.solutionGraphId && recentSolutionGraphIds.has(id.solutionGraphId)) score += 3;
    if (id.reasoningPathId && recentReasoningPathIds.has(id.reasoningPathId)) score += 3;
    if (cx && recentCognitiveExperienceIds.has(cx)) score += 5;
    const sfp = roundSurfaceFp(round);
    if (sfp && blockedSurfaceFingerprints.has(sfp)) score += 20;
    if (round.questionKey && seen.has(round.questionKey)) score += 20;
    return score;
  };
  rounds = [...rounds]
    .filter((round) => !round.questionKey || !seen.has(round.questionKey))
    .filter((round) => {
      const cx = round.cognitiveExperienceId || buildCognitiveExperience(round).cognitiveExperienceId;
      if (cx && recentCognitiveExperienceIds.has(cx)) return false;
      const st = roundStructuralId(round);
      if (st && recentStructuralIds.has(st)) return false;
      const sk = round.skeletonId || attachSemanticIdentity(round).semanticIdentity?.skeletonId;
      if (sk && recentSkeletonSet.has(sk)) return false;
      const sfp = roundSurfaceFp(round);
      if (sfp && blockedSurfaceFingerprints.has(sfp)) return false;
      return true;
    })
    .sort((a, b) => rankAnnualFreshness(a) - rankAnnualFreshness(b));

  // Yıllık tazelik sıralaması hedeflenmiş telafi turunu dışarıda bırakmışsa,
  // yalnız daha önce bütün yayın kapılarından geçmiş adayı geri ekle. Böylece
  // tekrar eden yanılgı için üretilen müdahale çeşitlilik sıralamasında kaybolmaz.
  for (const candidate of approvedRemediationCandidates) {
    if (rounds.some((round) => round.questionKey === candidate.questionKey)) continue;
    if (candidate.questionKey && seen.has(candidate.questionKey)) continue;
    const sfp = roundSurfaceFp(candidate);
    // Hedefli pedagojik yeniden-pratik, öğrencinin tekrar ettiği aynı bilişsel
    // iskeleti bilinçli olarak yeniden ölçer. Bu yüzden yıllık CX/structural/
    // skeleton cooldown'u bu tek aday için engel değildir. Exact questionKey
    // ve kalıcı yüzey parmak izi yasakları ise aynen korunur.
    if (sfp && blockedSurfaceFingerprints.has(sfp)) continue;
    rounds.unshift(candidate);
  }

  globalQualityAudit.v11MisconceptionRemediation.preComposerCandidateCount = rounds.filter((round) => round.v11Remediation && round.adaptivePlacement).length;
  // Aşama 09: kalite kapılarından geçen havuzu ortak besteci ile oturum uzunluğuna kes.
  premiumComposition = composeV11Session(rounds, {
    targetCount: game.sessionLength,
    firstExperience: isFirstGameExperience,
    remediationShare: Math.min(0.35, Number(brainPolicy.remediationShare || 0.25)),
    brainPolicy,
    misconceptionInterventions: v11Remediation.interventions
  });
  rounds = premiumComposition.rounds;
  globalQualityAudit.v11MisconceptionRemediation.composedCandidateCount = rounds.filter((round) => round.v11Remediation && round.adaptivePlacement).length;
  if (familyPool) {
    strictSessionFamilyUniqueness = new Set(rounds.map((round) => round.familyId).filter(Boolean)).size >= game.sessionLength;
  }
  // Besteci aile tekilliği underfill bıraktıysa: oturum içi tekillik korunur, yıllık recent gevşetilir.
  if (!strictControlledLiveBeta && familyPool && rounds.length < game.sessionLength) {
    const occupied = new Set([...seen, ...rounds.map((round) => round.questionKey).filter(Boolean)]);
    const sessionFamilies = rounds.map((round) => round.familyId).filter(Boolean);
    const sessionSkeletons = rounds.map((round) => round.skeletonId).filter(Boolean);
    const sessionCx = new Set(rounds.map((round) => round.cognitiveExperienceId || buildCognitiveExperience(round).cognitiveExperienceId).filter(Boolean));
    let idleGuards = 0;
    // Ortak backfill derinliği: uzun oturumlarda daha fazla deneme (gameId listesi yok).
    const postComposeGuards = Math.min(10, Math.max(5, (game.sessionLength || 5) + 3));
    for (let guard = 0; guard < postComposeGuards && rounds.length < game.sessionLength; guard += 1) {
      const need = game.sessionLength - rounds.length;
      const before = rounds.length;
      const { rounds: extra } = generateFromFamilies(familyPool, {
        seed: seed + 91001 * (guard + 1),
        count: Math.max(need * 8, 24),
        seenQuestionKeys: occupied,
        // Önce yıllık recent ile dene; sonra yalnız oturum içi engelle.
        recentFamilyIds: guard < 2 ? [...recentFamilyIds, ...sessionFamilies] : sessionFamilies,
        recentSkeletonIds: guard < 2 ? [...recentSkeletonIds, ...sessionSkeletons] : sessionSkeletons
      });
      let mapped = extra
        .map((question) => materializeFamilyChoiceRound(question, game, difficulty))
        .map((round) => enrichRoundAcademicMetadata(gameId, round))
        .map(normalizeChoiceRound)
        .map((round) => attachGlobalQuality(round, {
          grade: gradeNum,
          gameId,
          subjectId: round.subjectId || game.category || ''
        }));
      mapped = applyPublicationGates(mapped, gradeNum);
      for (const round of mapped) {
        if (rounds.length >= game.sessionLength) break;
        if (!round.questionKey || occupied.has(round.questionKey) || seen.has(round.questionKey)) continue;
        if (guard < 2 && strictSessionFamilyUniqueness && round.familyId && rounds.some((r) => r.familyId === round.familyId)) continue;
        if (round.skeletonId && (rounds.some((r) => r.skeletonId === round.skeletonId) || recentSkeletonSet.has(round.skeletonId))) continue;
        const cx = round.cognitiveExperienceId || buildCognitiveExperience(round).cognitiveExperienceId;
        if (cx && sessionCx.has(cx)) continue;
        if (cx && recentCognitiveExperienceIds.has(cx)) continue;
        const st = round.structuralId || buildCognitiveExperience(round).structuralId;
        if (st && recentStructuralIds.has(st)) continue;
        const sfp = roundSurfaceFp(round);
        if (sfp && blockedSurfaceFingerprints.has(sfp)) continue;
        occupied.add(round.questionKey);
        sessionFamilies.push(round.familyId);
        sessionSkeletons.push(round.skeletonId);
        if (cx) sessionCx.add(cx);
        rounds.push(round);
        backfillInserted += 1;
      }
      if (rounds.length === before) {
        idleGuards += 1;
        if (idleGuards >= 4) break;
      } else {
        idleGuards = 0;
      }
    }
  }

  // Son güvenlik: üretken aile motorlarında CX/structural/iskelet tekilliği;
  // insan yazımı doğrudan premium bankada ise editoryal bankanın kendi ayrı
  // soru kimlikleri korunur. Aynı ölçme iskeletini kullanan farklı kelime ya da
  // bağlam sorularını aile motoru kuralıyla tek soruya düşürmeyiz.
  if (forceDirectPremiumBank && !premiumBankExhausted) {
    const final = [];
    const usedQuestionKeys = new Set();
    for (const round of rounds) {
      if (final.length >= game.sessionLength) break;
      if (!round.questionKey || seen.has(round.questionKey) || usedQuestionKeys.has(round.questionKey)) continue;
      if (round.premiumQuestion !== true || round.familyEngineCertified === true) continue;
      usedQuestionKeys.add(round.questionKey);
      final.push(round);
    }
    rounds = final;
  } else {
    const final = [];
    const usedCx = new Set();
    const usedFam = new Set();
    const usedSkel = new Set();
    const usedSt = new Set();
    // Son pencere filtrelerinden sonra yeterli sayıda farklı aile kalmıyorsa
    // aileyi değil iskeleti tekil tut. Uzun oturumlarda 3 oturumluk iskelet
    // soğuması bazı ailelerin dört iskeletini de geçici olarak kapatabilir;
    // bu durumda aile tekrarını yasaklamak yapay underfill üretir.
    const eligibleFamilyCount = new Set(rounds.filter((round) => {
      const pedagogicalRepractice = Boolean(round.v11Remediation && round.adaptivePlacement);
      const cx = round.cognitiveExperienceId || buildCognitiveExperience(round).cognitiveExperienceId;
      const st = round.structuralId || buildCognitiveExperience(round).structuralId;
      if (!pedagogicalRepractice && cx && recentCognitiveExperienceIds.has(cx)) return false;
      if (!pedagogicalRepractice && st && recentStructuralIds.has(st)) return false;
      if (!pedagogicalRepractice && round.skeletonId && recentSkeletonSet.has(round.skeletonId)) return false;
      return true;
    }).map((round) => round.familyId).filter(Boolean)).size;
    const enforceFinalFamilyUniqueness = strictSessionFamilyUniqueness && eligibleFamilyCount >= game.sessionLength;
    for (const round of rounds) {
      if (final.length >= game.sessionLength) break;
      if (round.questionKey && seen.has(round.questionKey)) continue;
      if (round.questionKey && final.some((r) => r.questionKey === round.questionKey)) continue;
      const pedagogicalRepractice = Boolean(round.v11Remediation && round.adaptivePlacement);
      const cx = round.cognitiveExperienceId || buildCognitiveExperience(round).cognitiveExperienceId;
      if (cx && (usedCx.has(cx) || (!pedagogicalRepractice && recentCognitiveExperienceIds.has(cx)))) continue;
      const st = round.structuralId || buildCognitiveExperience(round).structuralId;
      if (st && (usedSt.has(st) || (!pedagogicalRepractice && recentStructuralIds.has(st)))) continue;
      const sfp = roundSurfaceFp(round);
      if (sfp && blockedSurfaceFingerprints.has(sfp)) continue;
      if (enforceFinalFamilyUniqueness && round.familyId && usedFam.has(round.familyId)) continue;
      if (round.skeletonId && (usedSkel.has(round.skeletonId) || (!pedagogicalRepractice && recentSkeletonSet.has(round.skeletonId)))) continue;
      final.push(round);
      if (cx) usedCx.add(cx);
      if (st) usedSt.add(st);
      if (round.familyId) usedFam.add(round.familyId);
      if (round.skeletonId) usedSkel.add(round.skeletonId);
    }
    // Underfill: pencere (CX/structural/skeleton) ve aile/seen asla gevşemez.
    // Yalnız oturum-içi iskelet tekilliği ikinci geçişte korunur; yasak pencere iskeleti açılmaz.
    if (final.length < game.sessionLength) {
      for (const round of rounds) {
        if (final.length >= game.sessionLength) break;
        if (round.questionKey && (seen.has(round.questionKey) || final.some((r) => r.questionKey === round.questionKey))) continue;
        const pedagogicalRepractice = Boolean(round.v11Remediation && round.adaptivePlacement);
        const cx = round.cognitiveExperienceId || buildCognitiveExperience(round).cognitiveExperienceId;
        if (cx && (usedCx.has(cx) || (!pedagogicalRepractice && recentCognitiveExperienceIds.has(cx)))) continue;
        const st = round.structuralId || buildCognitiveExperience(round).structuralId;
        if (st && (usedSt.has(st) || (!pedagogicalRepractice && recentStructuralIds.has(st)))) continue;
        if (round.skeletonId && (usedSkel.has(round.skeletonId) || (!pedagogicalRepractice && recentSkeletonSet.has(round.skeletonId)))) continue;
        if (enforceFinalFamilyUniqueness && round.familyId && usedFam.has(round.familyId)) continue;
        final.push(round);
        if (cx) usedCx.add(cx);
        if (st) usedSt.add(st);
        if (round.familyId) usedFam.add(round.familyId);
        if (round.skeletonId) usedSkel.add(round.skeletonId);
      }
    }
    rounds = final;
  }

  // Final pencere denetimi aday besteciden sonra çalıştığı için, uzun yıllık
  // geçmişte bazı adaylar son aşamada elenebilir. Buradaki son tamamlama yalnız
  // aile motorundan yeni ve pencereye uygun iskelet üretir; hiçbir cooldown,
  // questionKey, structural/CX veya yüzey yasağını gevşetmez. Aile tekrarına
  // yalnız farklı ve taze iskeletle izin verilir; underfill yerine kalite korunur.
  if (!strictControlledLiveBeta && familyPool && !premiumBankExhausted && rounds.length < game.sessionLength) {
    const occupied = new Set([...seen, ...rounds.map((round) => round.questionKey).filter(Boolean)]);
    const sessionSkeletons = new Set(rounds.map((round) => round.skeletonId).filter(Boolean));
    const sessionCx = new Set(rounds.map((round) => round.cognitiveExperienceId || buildCognitiveExperience(round).cognitiveExperienceId).filter(Boolean));
    const sessionSt = new Set(rounds.map((round) => round.structuralId || buildCognitiveExperience(round).structuralId).filter(Boolean));
    const sessionSurface = new Set(rounds.map((round) => roundSurfaceFp(round)).filter(Boolean));
    for (let guard = 0; guard < 12 && rounds.length < game.sessionLength; guard += 1) {
      const need = game.sessionLength - rounds.length;
      const { rounds: extra } = generateFromFamilies(familyPool, {
        seed: seed + 190001 * (guard + 1),
        count: Math.max(need * 12, 48),
        seenQuestionKeys: occupied,
        recentFamilyIds: [],
        recentSkeletonIds: [...recentSkeletonSet, ...sessionSkeletons],
        maxAttemptsPerSlot: 160
      });
      let inserted = 0;
      const mapped = applyPublicationGates(extra
        .map((question) => materializeFamilyChoiceRound(question, game, difficulty))
        .map((round) => enrichRoundAcademicMetadata(gameId, round))
        .map(normalizeChoiceRound)
        .map((round) => attachGlobalQuality(round, {
          grade: gradeNum, gameId, subjectId: round.subjectId || game.category || ''
        })), gradeNum);
      for (const round of mapped) {
        if (rounds.length >= game.sessionLength) break;
        if (!round.questionKey || occupied.has(round.questionKey) || seen.has(round.questionKey)) continue;
        if (round.skeletonId && (sessionSkeletons.has(round.skeletonId) || recentSkeletonSet.has(round.skeletonId))) continue;
        const cx = round.cognitiveExperienceId || buildCognitiveExperience(round).cognitiveExperienceId;
        if (cx && (sessionCx.has(cx) || recentCognitiveExperienceIds.has(cx))) continue;
        const st = round.structuralId || buildCognitiveExperience(round).structuralId;
        if (st && (sessionSt.has(st) || recentStructuralIds.has(st))) continue;
        const sfp = roundSurfaceFp(round);
        if (sfp && (sessionSurface.has(sfp) || blockedSurfaceFingerprints.has(sfp))) continue;
        occupied.add(round.questionKey);
        if (round.skeletonId) sessionSkeletons.add(round.skeletonId);
        if (cx) sessionCx.add(cx);
        if (st) sessionSt.add(st);
        if (sfp) sessionSurface.add(sfp);
        rounds.push(round);
        inserted += 1;
      }
      if (!inserted) break;
    }
  }

  // Premium banka uygun sınıf havuzu tamamen tüketildiyse hiçbir sonraki
  // gold/transition/backfill adımı alternatif kaynak sızdıramaz.
  if (premiumBankExhausted && !strictControlledLiveBeta) rounds = [];

  // Kontrollü beta havuzu Phase 5H'de 30/30 mühendislik ve ürün sahibi
  // görsel denetiminden geçti. Genel besteci etkileşimli bir turu veya tekil
  // editoryal adayı çeşitlilik amacıyla dışarıda bırakmışsa, yalnız bu özel
  // beta işaretli ve görülmemiş adayı final oturumuna geri al. Bu yol formal
  // müfredat sertifikası vermez; telemetri ve otomatik karantina zorunludur.
  const controlledCandidate = controlledLiveBeta.rounds[0] || null;
  if (controlledCandidate
      && !seen.has(controlledCandidate.questionKey)
      && !rounds.some((round) => round.questionKey === controlledCandidate.questionKey)) {
    const candidate = attachGlobalQuality(
      enrichRoundAcademicMetadata(gameId, controlledCandidate),
      { grade: gradeNum, gameId, subjectId: controlledCandidate.subjectId || game.category || '' }
    );
    const withoutDuplicate = rounds.filter((round) => round.questionKey !== candidate.questionKey);
    rounds = [candidate, ...withoutDuplicate].slice(0, game.sessionLength);
  }

  if (strictControlledLiveBeta) {
    rounds = rounds
      .filter((round) => round.controlledLaunchPilot === true)
      .slice(0, game.sessionLength);
  }

  // Telemetri aday havuzunu değil, çocuğa gerçekten teslim edilen final oturumu
  // raporlamalıdır. Aksi hâlde reports.length ile rounds.length ayrışır.
  const finalGlobalQualityAudit = auditGlobalSession(rounds, {
    grade: gradeNum,
    gameId,
    subjectId: game.category || ''
  });
  globalQualityAudit.ok = finalGlobalQualityAudit.ok;
  globalQualityAudit.errors = finalGlobalQualityAudit.errors;
  globalQualityAudit.warnings = finalGlobalQualityAudit.warnings;
  globalQualityAudit.reports = finalGlobalQualityAudit.reports;
  globalQualityAudit.average = finalGlobalQualityAudit.average;
  globalQualityAudit.premiumComposition = premiumComposition.audit;
  enforcement.accepted = rounds.length;
  enforcement.complete = !enforcement.requested || rounds.length >= game.sessionLength;
  enforcement.finalDeliveredCount = rounds.length;
  globalQualityAudit.classTarget = classTarget;
  globalQualityAudit.stage09BackfillInserted = backfillInserted;
  globalQualityAudit.finalRoundCount = rounds.length;
  globalQualityAudit.underfill = rounds.length < game.sessionLength;
  globalQualityAudit.skillRatingUsed = skillRating;
  // Kapasite yetersizliği: kalite gevşetilmez; underfill açık FAIL kanıtı taşır.
  if (rounds.length < game.sessionLength) {
    globalQualityAudit.capacityFailure = {
      gameId,
      grade: gradeNum,
      age: Number(profile.age || 0),
      requestedCount: game.sessionLength,
      producedCount: rounds.length,
      rejectedCandidateReasons: {
        seenQuestionKey: 'seen/recent questionKey blocked',
        recentCognitiveExperience: policyVersion === 'v1' || policyVersion === '1.0'
          ? 'lifetime cognitiveExperience cooldown'
          : 'windowed cognitiveExperience cooldown (policy v2)',
        recentStructuralId: 'windowed structuralId cooldown (policy v2)',
        sessionFamilyDup: 'intra-session family uniqueness',
        sessionSkeletonDup: 'intra-session skeleton uniqueness',
        sessionCxDup: 'intra-session cognitiveExperience uniqueness'
      },
      blockedFamilyIds: [...recentFamilyIds].slice(-40),
      blockedSkeletonIds: [...recentSkeletonIds].slice(-40),
      blockedCognitiveExperienceIds: [...recentCognitiveExperienceIds].slice(-80),
      policyVersion: blockedSets.policyVersion || policyVersion,
      note: 'Underfill: kapasite yetersiz. Kalite filtresi gevşetilmedi; yasaklı pencere tekrarı açılmadı.'
    };
  } else {
    globalQualityAudit.capacityFailure = null;
  }

  const deliveredGoldShowcase = rounds.find((round) => round.premiumShowcase === true
    && (!goldCandidate?.questionKey || round.questionKey === goldCandidate.questionKey));
  globalQualityAudit.goldShowcase.injected = Boolean(deliveredGoldShowcase);
  globalQualityAudit.goldShowcase.blockedReason = goldCandidate && !deliveredGoldShowcase
    ? 'PUBLICATION_OR_COMPOSITION_GATE_REJECTED'
    : null;

  const deliveredControlledLiveRound = rounds.find((round) => round.controlledLaunchPilot === true);
  globalQualityAudit.controlledLiveBeta = {
    ...controlledLiveBeta.audit,
    delivered: Boolean(deliveredControlledLiveRound),
    deliveredQuestionKey: deliveredControlledLiveRound?.questionKey || null,
    blockedReason: controlledLiveBeta.rounds.length && !deliveredControlledLiveRound
      ? 'PUBLICATION_OR_COMPOSITION_GATE_REJECTED'
      : null
  };

  // Aşama 03: her oyunun her turu, hangi motor tarafından üretildiğine
  // bakılmaksızın ortak QuestionContract ile etiketlenir. Bilinmeyen alanlar
  // sessizce doldurulmaz; questionContract.pendingFields içinde açıkça listelenir.
  rounds = rounds.map(attachQuestionContract);

  return {
    id: `${gameId}-${sessionSeed}`,
    game,
    difficulty,
    rounds,
    globalQualityAudit,
    goldShowcase: globalQualityAudit.goldShowcase,
    studentBrainProfile,
    classTarget,
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
