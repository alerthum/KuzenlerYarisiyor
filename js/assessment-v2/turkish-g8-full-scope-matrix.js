import { GRADE_8_TURKISH_OUTCOMES_2019 } from '../curriculum/outcomes/tr-g8-turkce-2019.js';
import { buildGrade8TurkishPilot01Questions } from './turkish-g8-reading-pilot01.js';
import { buildGrade8TurkishPilot02CalibrationQuestions } from './turkish-g8-pilot02-calibration.js';
import { buildGrade8TurkishReadingLanguageWave1Questions } from './turkish-g8-reading-language-wave1.js';
import { buildGrade8TurkishVisualGrammarWave2Questions } from './turkish-g8-visual-grammar-wave2.js';

const COVERED_PILOT01_CODES = new Set([
  'T.8.3.16', 'T.8.3.17', 'T.8.3.18', 'T.8.3.23', 'T.8.3.25', 'T.8.3.29', 'T.8.3.31', 'T.8.3.32'
]);

const PILOT02_CALIBRATION_CODES = new Set([
  'T.8.3.6', 'T.8.3.7', 'T.8.3.11', 'T.8.3.21', 'T.8.3.26'
]);

const READING_LANGUAGE_WAVE1_CODES = new Set([
  'T.8.3.5', 'T.8.3.8', 'T.8.3.9', 'T.8.3.10', 'T.8.3.19', 'T.8.3.20',
  'T.8.3.22', 'T.8.3.24', 'T.8.3.28', 'T.8.3.30', 'T.8.3.34', 'T.8.3.35'
]);

const VISUAL_GRAMMAR_WAVE2_CODES = new Set([
  'T.8.3.12', 'T.8.3.27', 'T.8.3.33', 'T.8.4.18', 'T.8.4.19', 'T.8.4.20'
]);

import { buildGrade8TurkishCompletionTasks, GRADE8_TURKISH_COMPLETION_OUTCOME_CODES } from './turkish-g8-completion-wave.js';
const MODE = Object.freeze({
  AUTO_SELECTED: 'AUTO_SELECTED_RESPONSE',
  AUTO_CONSTRUCTED: 'AUTO_CONSTRUCTED_RESPONSE',
  HUMAN_PERFORMANCE: 'HUMAN_RUBRIC_PERFORMANCE',
  MULTIMODAL_SELECTED: 'MULTIMODAL_SELECTED_RESPONSE',
  HYBRID: 'HYBRID_AUTOMATED_AND_HUMAN'
});

const CHANNEL = Object.freeze({
  TEXT: 'TEXT', AUDIO: 'AUDIO', VIDEO: 'VIDEO', VISUAL: 'VISUAL',
  LIVE_SPEECH: 'LIVE_SPEECH', WRITING: 'WRITING', MIXED_MEDIA: 'MIXED_MEDIA'
});

function plan(code, {
  mode,
  channel,
  formats,
  families,
  requiresMedia = false,
  requiresHumanScoring = false,
  automatedScoringAllowed = true,
  notes = ''
}) {
  return Object.freeze({
    code,
    mode,
    channel,
    formats: Object.freeze([...formats]),
    families: Object.freeze([...families]),
    requiresMedia,
    requiresHumanScoring,
    automatedScoringAllowed,
    notes
  });
}

const P = Object.freeze([
  // Dinleme / İzleme — 14
  plan('T.8.1.1', { mode: MODE.MULTIMODAL_SELECTED, channel: CHANNEL.AUDIO, formats: ['single-choice', 'short-answer'], families: ['olay-gelisimi-tahmini', 'sonuc-tahmini'], requiresMedia: true }),
  plan('T.8.1.2', { mode: MODE.MULTIMODAL_SELECTED, channel: CHANNEL.AUDIO, formats: ['single-choice', 'short-answer'], families: ['baglamdan-kelime-anlami-dinleme', 'tahmin-sozluk-karsilastirma'], requiresMedia: true }),
  plan('T.8.1.3', { mode: MODE.HYBRID, channel: CHANNEL.AUDIO, formats: ['short-answer', 'open-response'], families: ['dinleme-ozeti', 'ana-olay-ve-ayrinti-ayirma'], requiresMedia: true, requiresHumanScoring: true }),
  plan('T.8.1.4', { mode: MODE.MULTIMODAL_SELECTED, channel: CHANNEL.AUDIO, formats: ['single-choice', 'short-answer'], families: ['dinleme-metin-ici-soru', 'dinleme-cikarim-sorusu'], requiresMedia: true }),
  plan('T.8.1.5', { mode: MODE.MULTIMODAL_SELECTED, channel: CHANNEL.AUDIO, formats: ['single-choice'], families: ['dinleme-konu-belirleme'], requiresMedia: true }),
  plan('T.8.1.6', { mode: MODE.MULTIMODAL_SELECTED, channel: CHANNEL.AUDIO, formats: ['single-choice', 'short-answer'], families: ['dinleme-ana-fikir', 'dinleme-ana-duygu'], requiresMedia: true }),
  plan('T.8.1.7', { mode: MODE.HYBRID, channel: CHANNEL.AUDIO, formats: ['multiple-select', 'short-answer', 'open-response'], families: ['dinleme-baslik-onerme', 'baslik-uygunluk-gerekcelendirme'], requiresMedia: true, requiresHumanScoring: true }),
  plan('T.8.1.8', { mode: MODE.HUMAN_PERFORMANCE, channel: CHANNEL.LIVE_SPEECH, formats: ['open-response', 'interactive-simulation'], families: ['hikaye-canlandirma', 'rol-ve-olay-orgusu-performansi'], requiresMedia: true, requiresHumanScoring: true, automatedScoringAllowed: false }),
  plan('T.8.1.9', { mode: MODE.MULTIMODAL_SELECTED, channel: CHANNEL.AUDIO, formats: ['single-choice', 'open-response'], families: ['dinleme-tutarlilik', 'celiski-ve-kanit-denetimi'], requiresMedia: true }),
  plan('T.8.1.10', { mode: MODE.HUMAN_PERFORMANCE, channel: CHANNEL.AUDIO, formats: ['open-response'], families: ['dinlenene-gorus-bildirme', 'kanitli-kisisel-degerlendirme'], requiresMedia: true, requiresHumanScoring: true, automatedScoringAllowed: false }),
  plan('T.8.1.11', { mode: MODE.MULTIMODAL_SELECTED, channel: CHANNEL.MIXED_MEDIA, formats: ['single-choice', 'open-response'], families: ['dinleme-medya-amaci', 'dinleme-kaynak-guvenilirligi'], requiresMedia: true }),
  plan('T.8.1.12', { mode: MODE.MULTIMODAL_SELECTED, channel: CHANNEL.AUDIO, formats: ['single-choice', 'matching'], families: ['dinlemede-orneklendirme', 'dinlemede-tanik-gosterme', 'dinlemede-sayisal-veri'], requiresMedia: true }),
  plan('T.8.1.13', { mode: MODE.MULTIMODAL_SELECTED, channel: CHANNEL.VIDEO, formats: ['single-choice', 'matching'], families: ['beden-dili-anlami', 'ses-tonu-jest-mimik'], requiresMedia: true }),
  plan('T.8.1.14', { mode: MODE.HUMAN_PERFORMANCE, channel: CHANNEL.AUDIO, formats: ['interactive-simulation', 'open-response'], families: ['secici-dinleme', 'not-alarak-dinleme', 'elestirel-dinleme', 'empati-kurarak-dinleme'], requiresMedia: true, requiresHumanScoring: true, automatedScoringAllowed: false }),

  // Konuşma — 7
  plan('T.8.2.1', { mode: MODE.HUMAN_PERFORMANCE, channel: CHANNEL.LIVE_SPEECH, formats: ['open-response', 'interactive-simulation'], families: ['hazirlikli-sunum', 'panel-forum-sempozyum'], requiresHumanScoring: true, automatedScoringAllowed: false }),
  plan('T.8.2.2', { mode: MODE.HUMAN_PERFORMANCE, channel: CHANNEL.LIVE_SPEECH, formats: ['open-response', 'interactive-simulation'], families: ['hazirliksiz-konusma', 'anlik-gorus-gelistirme'], requiresHumanScoring: true, automatedScoringAllowed: false }),
  plan('T.8.2.3', { mode: MODE.HUMAN_PERFORMANCE, channel: CHANNEL.LIVE_SPEECH, formats: ['interactive-simulation'], families: ['ikna-konusmasi', 'elestirel-konusma', 'empati-konusmasi', 'tartisma-stratejisi'], requiresHumanScoring: true, automatedScoringAllowed: false }),
  plan('T.8.2.4', { mode: MODE.HUMAN_PERFORMANCE, channel: CHANNEL.VIDEO, formats: ['interactive-simulation'], families: ['beden-dili-performansi', 'jest-mimik-goz-temasi'], requiresMedia: true, requiresHumanScoring: true, automatedScoringAllowed: false }),
  plan('T.8.2.5', { mode: MODE.HYBRID, channel: CHANNEL.LIVE_SPEECH, formats: ['single-choice', 'open-response'], families: ['baglama-uygun-kelime-secimi', 'anlam-duzeltme-konusma'], requiresHumanScoring: true }),
  plan('T.8.2.6', { mode: MODE.HYBRID, channel: CHANNEL.LIVE_SPEECH, formats: ['matching', 'open-response'], families: ['yabanci-sozcuk-turkce-karsilik', 'konusma-dil-sadelestirme'], requiresHumanScoring: true }),
  plan('T.8.2.7', { mode: MODE.HYBRID, channel: CHANNEL.LIVE_SPEECH, formats: ['single-choice', 'open-response'], families: ['gecis-baglanti-ifadesi-konusma', 'mantiksal-akis-konusma'], requiresHumanScoring: true }),

  // Okuma — 35
  plan('T.8.3.1', { mode: MODE.HUMAN_PERFORMANCE, channel: CHANNEL.TEXT, formats: ['interactive-simulation'], families: ['noktalama-vurgulu-okuma', 'sesli-okuma-akicilik'], requiresHumanScoring: true, automatedScoringAllowed: false }),
  plan('T.8.3.2', { mode: MODE.HUMAN_PERFORMANCE, channel: CHANNEL.TEXT, formats: ['interactive-simulation'], families: ['ture-uygun-okuma', 'siir-ve-edebi-metin-seslendirme'], requiresHumanScoring: true, automatedScoringAllowed: false }),
  plan('T.8.3.3', { mode: MODE.MULTIMODAL_SELECTED, channel: CHANNEL.VISUAL, formats: ['single-choice', 'short-answer'], families: ['farkli-yazi-karakteri-okuma', 'tipografik-cozumleme'], requiresMedia: true }),
  plan('T.8.3.4', { mode: MODE.HYBRID, channel: CHANNEL.TEXT, formats: ['interactive-simulation', 'open-response'], families: ['goz-atarak-okuma', 'not-alarak-okuma', 'ozetleyerek-okuma', 'elestirel-okuma'], requiresHumanScoring: true }),
  plan('T.8.3.5', { mode: MODE.AUTO_SELECTED, channel: CHANNEL.TEXT, formats: ['single-choice', 'short-answer'], families: ['baglamdan-kelime-anlami', 'deyim-sozluk-karsilastirma'] }),
  plan('T.8.3.6', { mode: MODE.AUTO_SELECTED, channel: CHANNEL.TEXT, formats: ['single-choice', 'matching'], families: ['deyimin-metne-katkisi', 'atasozunun-islevi', 'ozdeyis-ve-dusunceyi-destekleme'] }),
  plan('T.8.3.7', { mode: MODE.AUTO_SELECTED, channel: CHANNEL.TEXT, formats: ['single-choice', 'matching'], families: ['benzetme', 'kisilestirme', 'konusturma', 'karsitlik', 'abartma', 'soz-sanati-etkisi'] }),
  plan('T.8.3.8', { mode: MODE.AUTO_SELECTED, channel: CHANNEL.TEXT, formats: ['single-choice', 'drag-drop'], families: ['anlatim-bozuklugu-tespit', 'anlam-ve-dilbilgisi-duzeltme'] }),
  plan('T.8.3.9', { mode: MODE.AUTO_SELECTED, channel: CHANNEL.TEXT, formats: ['single-choice', 'matching'], families: ['fiilimsi-islevi', 'fiilimsi-turu-ve-anlam-katkisi'] }),
  plan('T.8.3.10', { mode: MODE.AUTO_SELECTED, channel: CHANNEL.TEXT, formats: ['single-choice', 'drag-drop'], families: ['gecis-ifadesi-islevi', 'baglanti-ifadesi-anlam-katkisi'] }),
  plan('T.8.3.11', { mode: MODE.AUTO_SELECTED, channel: CHANNEL.TEXT, formats: ['single-choice', 'matching'], families: ['oykuleme', 'betimleme', 'aciklama', 'tartisma', 'karma-anlatim-bicimi'] }),
  plan('T.8.3.12', { mode: MODE.MULTIMODAL_SELECTED, channel: CHANNEL.VISUAL, formats: ['single-choice', 'short-answer'], families: ['gorsel-basliktan-konu-tahmini'], requiresMedia: true }),
  plan('T.8.3.13', { mode: MODE.HYBRID, channel: CHANNEL.TEXT, formats: ['short-answer', 'open-response', 'ordering'], families: ['okuma-ozeti', 'ana-ve-yardimci-bilgi-secimi'], requiresHumanScoring: true }),
  plan('T.8.3.14', { mode: MODE.AUTO_SELECTED, channel: CHANNEL.TEXT, formats: ['single-choice', 'short-answer'], families: ['metin-ici-soru', 'metin-disi-baglanti-sorusu'] }),
  plan('T.8.3.15', { mode: MODE.HUMAN_PERFORMANCE, channel: CHANNEL.TEXT, formats: ['open-response'], families: ['metne-soru-yazma', 'ust-duzey-soru-uretme'], requiresHumanScoring: true, automatedScoringAllowed: false }),
  plan('T.8.3.16', { mode: MODE.AUTO_SELECTED, channel: CHANNEL.TEXT, formats: ['single-choice'], families: ['metin-konusu'] }),
  plan('T.8.3.17', { mode: MODE.AUTO_SELECTED, channel: CHANNEL.TEXT, formats: ['single-choice', 'short-answer'], families: ['ana-fikir', 'ana-duygu'] }),
  plan('T.8.3.18', { mode: MODE.AUTO_SELECTED, channel: CHANNEL.TEXT, formats: ['single-choice', 'multiple-select'], families: ['yardimci-dusunce', 'ulasilamaz-yargi'] }),
  plan('T.8.3.19', { mode: MODE.HYBRID, channel: CHANNEL.TEXT, formats: ['single-choice', 'short-answer'], families: ['baslik-belirleme', 'alternatif-baslik-gerekcelendirme'], requiresHumanScoring: true }),
  plan('T.8.3.20', { mode: MODE.AUTO_SELECTED, channel: CHANNEL.TEXT, formats: ['single-choice', 'matching', 'ordering'], families: ['olay-orgusu', 'zaman-mekan', 'sahis-kadrosu', 'anlatici'] }),
  plan('T.8.3.21', { mode: MODE.AUTO_SELECTED, channel: CHANNEL.TEXT, formats: ['single-choice', 'open-response'], families: ['yazar-bakis-acisi', 'oznel-nesnel', 'ayrintiya-dayali-yorum'] }),
  plan('T.8.3.22', { mode: MODE.HUMAN_PERFORMANCE, channel: CHANNEL.TEXT, formats: ['open-response', 'multiple-select'], families: ['soruna-alternatif-cozum', 'cozum-kanitlama'], requiresHumanScoring: true, automatedScoringAllowed: false }),
  plan('T.8.3.23', { mode: MODE.AUTO_SELECTED, channel: CHANNEL.TEXT, formats: ['single-choice', 'matching'], families: ['iki-metin-karsilastirma', 'ceviri-baski-karsilastirma'] }),
  plan('T.8.3.24', { mode: MODE.AUTO_SELECTED, channel: CHANNEL.TEXT, formats: ['single-choice', 'matching'], families: ['gercek-kurgusal-ayrimi', 'metin-ici-kanit'] }),
  plan('T.8.3.25', { mode: MODE.AUTO_SELECTED, channel: CHANNEL.TEXT, formats: ['single-choice', 'multiple-select'], families: ['neden-sonuc', 'amac-sonuc', 'kosul', 'karsilastirma', 'benzetme', 'orneklendirme', 'nesnel-oznel', 'duygu-cikarimi'] }),
  plan('T.8.3.26', { mode: MODE.AUTO_SELECTED, channel: CHANNEL.TEXT, formats: ['single-choice', 'matching'], families: ['fikra-kose-yazisi', 'makale', 'deneme', 'roman', 'destan', 'tur-karsilastirma'] }),
  plan('T.8.3.27', { mode: MODE.MULTIMODAL_SELECTED, channel: CHANNEL.VISUAL, formats: ['single-choice', 'open-response'], families: ['karikatur-yorumlama', 'cizgi-roman-yorumlama', 'gorsel-haber-yorumu'], requiresMedia: true }),
  plan('T.8.3.28', { mode: MODE.MULTIMODAL_SELECTED, channel: CHANNEL.VISUAL, formats: ['single-choice', 'matching'], families: ['koyu-italik-islevi', 'punto-renk-vurgu', 'alt-cizgi-vurgusu'], requiresMedia: true }),
  plan('T.8.3.29', { mode: MODE.AUTO_SELECTED, channel: CHANNEL.MIXED_MEDIA, formats: ['single-choice', 'multiple-select'], families: ['medya-amaci', 'ikna-bilgilendirme-eglendirme', 'olay-yorumlama'] }),
  plan('T.8.3.30', { mode: MODE.HYBRID, channel: CHANNEL.MIXED_MEDIA, formats: ['interactive-simulation', 'open-response'], families: ['arama-stratejisi', 'kaynak-secme', 'anahtar-kelime-kullanma'], requiresMedia: true, requiresHumanScoring: true }),
  plan('T.8.3.31', { mode: MODE.AUTO_SELECTED, channel: CHANNEL.MIXED_MEDIA, formats: ['single-choice', 'multiple-select'], families: ['kaynak-guvenilirligi', 'blog-ve-kisisel-sayfa', 'edu-gov-kaynak', 'yontem-ve-orneklem'] }),
  plan('T.8.3.32', { mode: MODE.MULTIMODAL_SELECTED, channel: CHANNEL.VISUAL, formats: ['single-choice', 'short-answer'], families: ['grafik-yorumlama', 'tablo-yorumlama', 'cizelge-karsilastirma'], requiresMedia: true }),
  plan('T.8.3.33', { mode: MODE.MULTIMODAL_SELECTED, channel: CHANNEL.MIXED_MEDIA, formats: ['single-choice', 'matching', 'open-response'], families: ['edebi-metin-film-karsilastirma', 'kahraman-mekan-zaman-olay'], requiresMedia: true }),
  plan('T.8.3.34', { mode: MODE.AUTO_SELECTED, channel: CHANNEL.TEXT, formats: ['single-choice', 'matching'], families: ['orneklendirme', 'tanimlama', 'karsilastirma', 'tanik-gosterme', 'sayisal-veri'] }),
  plan('T.8.3.35', { mode: MODE.AUTO_SELECTED, channel: CHANNEL.TEXT, formats: ['ordering', 'single-choice', 'drag-drop'], families: ['islem-basamagi-siralama', 'kullanim-kilavuzu-uygulama'] }),

  // Yazma — 20
  plan('T.8.4.1', { mode: MODE.HUMAN_PERFORMANCE, channel: CHANNEL.WRITING, formats: ['open-response'], families: ['siir-yazma', 'imge-ritim-duygu'], requiresHumanScoring: true, automatedScoringAllowed: false }),
  plan('T.8.4.2', { mode: MODE.HUMAN_PERFORMANCE, channel: CHANNEL.WRITING, formats: ['open-response'], families: ['bilgilendirici-metin-yazma', 'kanitli-gorus', 'giris-gelisme-sonuc'], requiresHumanScoring: true, automatedScoringAllowed: false }),
  plan('T.8.4.3', { mode: MODE.HUMAN_PERFORMANCE, channel: CHANNEL.WRITING, formats: ['open-response'], families: ['hikaye-yazma', 'serim-dugum-cozum', 'zaman-mekan-kurgusu'], requiresHumanScoring: true, automatedScoringAllowed: false }),
  plan('T.8.4.4', { mode: MODE.HUMAN_PERFORMANCE, channel: CHANNEL.WRITING, formats: ['open-response', 'interactive-simulation'], families: ['yaratici-yazma', 'elestirel-yazma', 'duyudan-hareketle-yazma', 'kavram-havuzu-yazma'], requiresHumanScoring: true, automatedScoringAllowed: false }),
  plan('T.8.4.5', { mode: MODE.HUMAN_PERFORMANCE, channel: CHANNEL.WRITING, formats: ['open-response', 'drag-drop'], families: ['grafik-ve-tabloyla-yaziyi-destekleme'], requiresMedia: true, requiresHumanScoring: true, automatedScoringAllowed: false }),
  plan('T.8.4.6', { mode: MODE.HYBRID, channel: CHANNEL.WRITING, formats: ['ordering', 'open-response'], families: ['islem-basamaklarini-yazma', 'yordamsal-metin'], requiresHumanScoring: true }),
  plan('T.8.4.7', { mode: MODE.HUMAN_PERFORMANCE, channel: CHANNEL.WRITING, formats: ['open-response'], families: ['deyim-atasozu-ozdeyisle-zenginlestirme'], requiresHumanScoring: true, automatedScoringAllowed: false }),
  plan('T.8.4.8', { mode: MODE.HUMAN_PERFORMANCE, channel: CHANNEL.WRITING, formats: ['open-response'], families: ['mizahi-metin-yazma', 'uygun-mizah-ogesi'], requiresHumanScoring: true, automatedScoringAllowed: false }),
  plan('T.8.4.9', { mode: MODE.HUMAN_PERFORMANCE, channel: CHANNEL.WRITING, formats: ['open-response'], families: ['anlatim-bicimiyle-yazma', 'karma-anlatim-uygulama'], requiresHumanScoring: true, automatedScoringAllowed: false }),
  plan('T.8.4.10', { mode: MODE.HYBRID, channel: CHANNEL.WRITING, formats: ['drag-drop', 'open-response'], families: ['yabanci-kelimeyi-turkcelestirme-yazma'], requiresHumanScoring: true }),
  plan('T.8.4.11', { mode: MODE.HYBRID, channel: CHANNEL.WRITING, formats: ['interactive-simulation', 'short-answer'], families: ['form-doldurma', 'yonerge-alan-eslestirme'], requiresHumanScoring: true }),
  plan('T.8.4.12', { mode: MODE.HUMAN_PERFORMANCE, channel: CHANNEL.WRITING, formats: ['open-response'], families: ['haber-metni', 'gunluk', 'ani'], requiresHumanScoring: true, automatedScoringAllowed: false }),
  plan('T.8.4.13', { mode: MODE.HYBRID, channel: CHANNEL.WRITING, formats: ['short-answer', 'open-response'], families: ['yaziya-baslik-belirleme', 'baslik-icerik-uyumu'], requiresHumanScoring: true }),
  plan('T.8.4.14', { mode: MODE.HUMAN_PERFORMANCE, channel: CHANNEL.WRITING, formats: ['open-response'], families: ['arastirma-raporu-yazma', 'kaynak-gosterme', 'taslak-ve-bolumleme'], requiresHumanScoring: true, automatedScoringAllowed: false }),
  plan('T.8.4.15', { mode: MODE.HYBRID, channel: CHANNEL.WRITING, formats: ['drag-drop', 'open-response'], families: ['gecis-baglanti-ifadesi-yazma', 'metin-akisi-duzenleme'], requiresHumanScoring: true }),
  plan('T.8.4.16', { mode: MODE.HYBRID, channel: CHANNEL.WRITING, formats: ['drag-drop', 'open-response'], families: ['yazim-noktalama-duzeltme', 'anlatim-bozuklugu-duzeltme', 'oz-duzenleme'], requiresHumanScoring: true }),
  plan('T.8.4.17', { mode: MODE.HUMAN_PERFORMANCE, channel: CHANNEL.WRITING, formats: ['interactive-simulation', 'open-response'], families: ['hedef-kitleye-gore-paylasma', 'yayinlama-etik-ve-duzen'], requiresHumanScoring: true, automatedScoringAllowed: false }),
  plan('T.8.4.18', { mode: MODE.AUTO_SELECTED, channel: CHANNEL.TEXT, formats: ['single-choice', 'matching', 'drag-drop'], families: ['cumle-ogeleri', 'oge-islevi'] }),
  plan('T.8.4.19', { mode: MODE.AUTO_SELECTED, channel: CHANNEL.TEXT, formats: ['single-choice', 'matching'], families: ['cumle-turu-anlam', 'yapi-yuklem-yerine-gore-cumle'] }),
  plan('T.8.4.20', { mode: MODE.AUTO_SELECTED, channel: CHANNEL.TEXT, formats: ['single-choice', 'drag-drop'], families: ['fiilde-cati-anlam-katkisi', 'etken-edilgen-anlam-farki'] })
]);

const PLAN_BY_CODE = new Map(P.map(entry => [entry.code, entry]));

function coverageStatus(code) {
  if (COVERED_PILOT01_CODES.has(code)) return 'PILOT01_ENGINEERING_COVERED';
  if (PILOT02_CALIBRATION_CODES.has(code)) return 'PILOT02_ENGINEERING_COVERED_HUMAN_REVIEW_REQUIRED';
  if (READING_LANGUAGE_WAVE1_CODES.has(code)) return 'READING_LANGUAGE_WAVE1_ENGINEERING_COVERED_HUMAN_REVIEW_REQUIRED';
  if (VISUAL_GRAMMAR_WAVE2_CODES.has(code)) return 'VISUAL_GRAMMAR_WAVE2_ENGINEERING_COVERED_HUMAN_REVIEW_REQUIRED';
  if (GRADE8_TURKISH_COMPLETION_OUTCOME_CODES.includes(code)) return 'FULL_SCOPE_COMPLETION_ENGINEERING_COVERED_HUMAN_REVIEW_REQUIRED';
  return 'PLANNED_NOT_IMPLEMENTED';
}

function existingCanonicalCountByCode() {
  const counts = new Map();
  for (const item of [...buildGrade8TurkishPilot01Questions(), ...buildGrade8TurkishPilot02CalibrationQuestions(), ...buildGrade8TurkishReadingLanguageWave1Questions(), ...buildGrade8TurkishVisualGrammarWave2Questions(), ...buildGrade8TurkishCompletionTasks()]) {
    const outcomeId = item.curriculum.outcomeIds[0];
    const outcome = GRADE_8_TURKISH_OUTCOMES_2019.find(row => row.id === outcomeId);
    if (!outcome) continue;
    const code = outcome.officialOutcomeCode;
    counts.set(code, (counts.get(code) || 0) + 1);
  }
  return counts;
}

export function buildGrade8TurkishFullScopeMatrix() {
  const counts = existingCanonicalCountByCode();
  return Object.freeze(GRADE_8_TURKISH_OUTCOMES_2019.map(outcome => {
    const spec = PLAN_BY_CODE.get(outcome.officialOutcomeCode);
    if (!spec) throw new Error(`missing assessment plan: ${outcome.officialOutcomeCode}`);
    return Object.freeze({
      outcomeId: outcome.id,
      outcomeCode: outcome.officialOutcomeCode,
      outcomeText: outcome.officialOutcomeText,
      guidanceNotes: outcome.officialGuidanceNotes,
      domainId: outcome.unitId,
      domainName: outcome.unitName,
      topicId: outcome.topicId,
      topicName: outcome.topicName,
      sourceId: outcome.sourceId,
      sourceLocator: outcome.sourceLocator,
      assessmentMode: spec.mode,
      assessmentChannel: spec.channel,
      recommendedItemFormats: spec.formats,
      questionFamilies: spec.families,
      requiresMedia: spec.requiresMedia,
      requiresHumanScoring: spec.requiresHumanScoring,
      automatedScoringAllowed: spec.automatedScoringAllowed,
      implementationStatus: coverageStatus(outcome.officialOutcomeCode),
      existingCanonicalItemCount: counts.get(outcome.officialOutcomeCode) || 0,
      notes: spec.notes
    });
  }));
}

export function auditGrade8TurkishFullScopeMatrix(matrix = buildGrade8TurkishFullScopeMatrix()) {
  const errors = [];
  const officialCodes = new Set(GRADE_8_TURKISH_OUTCOMES_2019.map(row => row.officialOutcomeCode));
  const matrixCodes = matrix.map(row => row.outcomeCode);
  if (matrix.length !== 76) errors.push(`matrix-count:${matrix.length}`);
  if (new Set(matrixCodes).size !== 76) errors.push('duplicate-outcome-code');
  for (const code of officialCodes) if (!matrixCodes.includes(code)) errors.push(`missing-outcome:${code}`);
  for (const row of matrix) {
    if (!row.recommendedItemFormats.length) errors.push(`missing-format:${row.outcomeCode}`);
    if (!row.questionFamilies.length) errors.push(`missing-family:${row.outcomeCode}`);
    if (row.requiresHumanScoring && row.assessmentMode === MODE.AUTO_SELECTED) errors.push(`mode-scoring-conflict:${row.outcomeCode}`);
    if (!row.automatedScoringAllowed && !row.requiresHumanScoring) errors.push(`automation-without-human:${row.outcomeCode}`);
  }
  const domainCounts = Object.fromEntries(['dinleme-izleme', 'konusma', 'okuma', 'yazma'].map(domainId => [domainId, matrix.filter(row => row.domainId === domainId).length]));
  if (domainCounts['dinleme-izleme'] !== 14) errors.push(`domain-count:dinleme-izleme:${domainCounts['dinleme-izleme']}`);
  if (domainCounts.konusma !== 7) errors.push(`domain-count:konusma:${domainCounts.konusma}`);
  if (domainCounts.okuma !== 35) errors.push(`domain-count:okuma:${domainCounts.okuma}`);
  if (domainCounts.yazma !== 20) errors.push(`domain-count:yazma:${domainCounts.yazma}`);

  const statusCounts = Object.fromEntries([...new Set(matrix.map(row => row.implementationStatus))].map(status => [status, matrix.filter(row => row.implementationStatus === status).length]));
  const modeCounts = Object.fromEntries([...new Set(matrix.map(row => row.assessmentMode))].map(mode => [mode, matrix.filter(row => row.assessmentMode === mode).length]));
  const humanScoredCount = matrix.filter(row => row.requiresHumanScoring).length;
  const mediaRequiredCount = matrix.filter(row => row.requiresMedia).length;
  const selectedResponseEligibleCount = matrix.filter(row => row.recommendedItemFormats.includes('single-choice')).length;
  const implementedItemCount = matrix.reduce((sum, row) => sum + row.existingCanonicalItemCount, 0);

  return Object.freeze({
    ok: errors.length === 0,
    errors: Object.freeze(errors),
    metrics: Object.freeze({
      outcomeCount: matrix.length,
      domainCounts: Object.freeze(domainCounts),
      statusCounts: Object.freeze(statusCounts),
      modeCounts: Object.freeze(modeCounts),
      humanScoredCount,
      mediaRequiredCount,
      selectedResponseEligibleCount,
      implementedOutcomeCount: matrix.filter(row => row.existingCanonicalItemCount > 0).length,
      implementedItemCount,
      uncoveredOutcomeCount: matrix.filter(row => row.existingCanonicalItemCount === 0).length,
      productReady: false
    })
  });
}

export const GRADE8_TURKISH_FULL_SCOPE_MATRIX = buildGrade8TurkishFullScopeMatrix();
export const GRADE8_TURKISH_FULL_SCOPE_AUDIT = auditGrade8TurkishFullScopeMatrix(GRADE8_TURKISH_FULL_SCOPE_MATRIX);
export const GRADE8_TURKISH_PILOT02_CALIBRATION_CODES = Object.freeze([...PILOT02_CALIBRATION_CODES]);
export const GRADE8_TURKISH_PILOT01_COVERED_CODES = Object.freeze([...COVERED_PILOT01_CODES]);
export const GRADE8_TURKISH_READING_LANGUAGE_WAVE1_CODES = Object.freeze([...READING_LANGUAGE_WAVE1_CODES]);
export const GRADE8_TURKISH_VISUAL_GRAMMAR_WAVE2_CODES = Object.freeze([...VISUAL_GRAMMAR_WAVE2_CODES]);
