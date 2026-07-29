import { hashString } from '../utils.js';

const GAME_ACADEMIC_MAP = Object.freeze({
  'target-number': { subjectId:'math', visibleCardId:'hedef-sayi', topicIds:['numbers','operations','algebraic-thinking'], skillId:'numerical-reasoning' },
  'speed-math': { subjectId:'math', visibleCardId:'hizli-islem-arenasi', topicIds:['operations','mental-math','number-sense'], skillId:'fluency' },
  'pattern-lab': { subjectId:'math', visibleCardId:'oruntu-laboratuvari', topicIds:['patterns','sequences','algebraic-thinking'], skillId:'pattern-recognition' },
  'problem-hunter': { subjectId:'math', visibleCardId:'yeni-nesil-problem-avcisi', topicIds:['ratio','percent','equations','word-problems','functions','probability','data'], skillId:'problem-solving' },
  'geometry-lab': { subjectId:'math', visibleCardId:'geometri-insa-alani', topicIds:['geometry','measurement','spatial-reasoning'], skillId:'geometry' },
  'error-detective': { subjectId:'math', visibleCardId:'yanlis-cozumu-yakala', topicIds:['error-analysis','operations','algebra','geometry'], skillId:'error-detection' },
  'logic-station': { subjectId:'intelligence', visibleCardId:'zeka-istasyonu', topicIds:['logic','conditions','ordering','deduction'], skillId:'logical-reasoning' },
  'olympiad-ladder': { subjectId:'olympiad', visibleCardId:'olimpiyat-merdiveni', topicIds:['number-theory','combinatorics','geometry','proof','inequality'], skillId:'olympiad-reasoning' },
  'word-mine': { subjectId:'turkish', visibleCardId:'kelime-madeni', topicIds:['vocabulary','word-formation'], skillId:'vocabulary' },
  'word-ladder': { subjectId:'turkish', visibleCardId:'kelime-merdiveni', topicIds:['vocabulary','word-relations'], skillId:'vocabulary' },
  'forbidden-story': { subjectId:'turkish', visibleCardId:'yasak-harf-hikayesi', topicIds:['writing','vocabulary','language-control'], skillId:'creative-writing' },
  'meaning-hunt': { subjectId:'turkish', visibleCardId:'anlam-avi', topicIds:['word-meaning','sentence-meaning'], skillId:'semantic-reasoning' },
  'paragraph-detective': { subjectId:'turkish', visibleCardId:'paragraf-dedektifi', topicIds:['main-idea','inference','evidence','reading-comprehension'], skillId:'reading' },
  'english-vocabulary': { subjectId:'english', visibleCardId:'ingilizce-kelime', topicIds:['vocabulary','meaning'], skillId:'english-vocabulary' },
  'english-cloze': { subjectId:'english', visibleCardId:'ingilizce-bosluk-avi', topicIds:['grammar','vocabulary','context'], skillId:'english-cloze' },
  'english-sentence-builder': { subjectId:'english', visibleCardId:'ingilizce-cumle-kurucu', topicIds:['word-order','grammar','sentence-building'], skillId:'english-sentence' },
  'science-lab': { subjectId:'science', visibleCardId:'fen-bilimleri-laboratuvari', topicIds:['scientific-process','physics','chemistry','biology'], skillId:'science' },
  'science-reasoning': { subjectId:'science', visibleCardId:'deney-dedektifi', topicIds:['experiment','variables','inference','graph'], skillId:'science-reasoning' },
  'social-time-travel': { subjectId:'social', visibleCardId:'zaman-yolculugu', topicIds:['history','chronology','cause-effect'], skillId:'social-reasoning' },
  'social-map-skills': { subjectId:'social', visibleCardId:'harita-ve-dunya', topicIds:['geography','maps','data'], skillId:'map-reading' },
  'social-citizenship': { subjectId:'social', visibleCardId:'aktif-vatandas', topicIds:['citizenship','rights','responsibilities'], skillId:'citizenship' },
  'lgs-focus': { subjectId:'exam', visibleCardId:'lgs-akilli-calisma', topicIds:['lgs-turkish','lgs-math','lgs-science','lgs-social'], skillId:'lgs' },
  'tyt-focus': { subjectId:'exam', visibleCardId:'tyt-akilli-calisma', topicIds:['tyt-turkish','tyt-math','tyt-science','tyt-social'], skillId:'tyt' },
  'ayt-focus': { subjectId:'exam', visibleCardId:'ayt-alan-calisma', topicIds:['ayt-math','ayt-science','ayt-literature','ayt-social'], skillId:'ayt' },
  'kpss-focus': { subjectId:'exam', visibleCardId:'kpss-genel-yetenek-kultur', topicIds:['kpss-turkish','kpss-math','kpss-history','kpss-geography','kpss-citizenship'], skillId:'kpss' }
});

function stablePick(values, seedText) {
  if (!values?.length) return 'general';
  return values[Math.abs(hashString(seedText || 'general')) % values.length];
}

export function academicDefinitionForGame(gameId) {
  return GAME_ACADEMIC_MAP[gameId] || { subjectId:'general', visibleCardId:gameId || 'general', topicIds:['general'], skillId:'general' };
}

export function normalizeAcademicAttempt(payload = {}) {
  const definition = academicDefinitionForGame(payload.gameId);
  const questionKey = payload.questionKey || `${payload.gameId || 'question'}:${hashString(payload.prompt || payload.createdAt || Date.now()).toString(36)}`;
  const topicId = payload.topicId || stablePick(definition.topicIds, questionKey);
  const questionFamilyId = payload.questionFamilyId || payload.familyId || `${payload.gameId || 'general'}:${topicId}:${payload.kind || 'choice'}`;
  return {
    ...payload,
    subjectId: payload.subjectId || definition.subjectId,
    visibleCardId: payload.visibleCardId || definition.visibleCardId,
    topicId,
    subtopicId: payload.subtopicId || topicId,
    skillId: payload.skillId || payload.skill || definition.skillId,
    learningOutcomeId: payload.learningOutcomeId || `${payload.grade || payload.targetGrade || 'all'}:${topicId}`,
    questionFamilyId,
    questionKey,
    difficulty: Math.max(1, Math.min(5, Number(payload.difficulty || 3))),
    cognitiveLevel: Math.max(1, Math.min(5, Number(payload.cognitiveLevel || payload.cognitiveDepth || payload.difficulty || 3))),
    durationSeconds: Number(payload.durationSeconds ?? payload.elapsedSeconds ?? 0),
    hintCount: Number(payload.hintCount ?? payload.hintsUsed ?? 0),
    calculatorUsed: Boolean(payload.calculatorUsed),
    pausedSeconds: Number(payload.pausedSeconds || 0),
    answeredAt: payload.answeredAt || payload.createdAt || new Date().toISOString()
  };
}

export function enrichRoundAcademicMetadata(gameId, round = {}) {
  return normalizeAcademicAttempt({ gameId, ...round });
}

export const V9_GAME_ACADEMIC_MAP = GAME_ACADEMIC_MAP;
