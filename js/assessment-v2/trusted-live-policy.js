import { TRUSTED_OLYMPIAD_GRADE8_KEYS } from './trusted-authored-live-bank.js';
import { TRUSTED_G8_CORE_WAVE2_KEYS } from './trusted-authored-g8-core-wave2-bank.js';
import { TRUSTED_G8_SCIENCE_DEEP_KEYS } from './trusted-authored-g8-science-deep-bank.js';
import { TRUSTED_G8_TURKISH_DEEP_KEYS } from './trusted-authored-g8-turkish-deep-bank.js';
import { TRUSTED_G8_LOGIC_DEEP_KEYS } from './trusted-authored-g8-logic-deep-bank.js';
import { TRUSTED_G7_CORE_DEEP_KEYS } from './trusted-authored-g7-core-deep-bank.js';
import { TRUSTED_PRIORITY_4_8_KEYS } from './trusted-authored-priority-4-8-bank.js';
import { SOLVER_BACKED_PRIORITY_MATH_KEYS } from './solver-backed-priority-math-bank.js';
import { EVIDENCE_BACKED_PRIORITY_TURKISH_KEYS } from './evidence-backed-priority-turkish-bank.js';
import { EVIDENCE_BACKED_PRIORITY_SCIENCE_KEYS } from './evidence-backed-priority-science-bank.js';

/**
 * Öğrenciye açılmasına izin verilen dar ve açık soru listesi.
 *
 * Yalnız son öğrenci yüzeyi insan tarafından incelenmiş questionKey'ler bu
 * dosyaya alınır. Liste dışındaki sınıf, oyun, jeneratör ve fallback kapalıdır.
 */

const ENGLISH_68_KEYS = Object.freeze([
  'premium:2.2.0:english-vocabulary:english-vocab-context-10:1nincwq',
  'premium:2.2.0:english-vocabulary:english-vocab-context-20:8zz0iw',
  'premium:2.2.0:english-vocabulary:english-vocab-context-13:dia6wk',
  'premium:2.2.0:english-vocabulary:english-vocab-context-12:1jd1pbt',
  'premium:2.2.0:english-vocabulary:english-vocab-context-18:etmcz6',
  'premium:2.2.0:english-vocabulary:english-vocab-context-11:1nv2xpl',
  'premium:2.2.0:english-vocabulary:english-vocab-context-15:1l0olu5',
  'premium:2.2.0:english-vocabulary:english-vocab-context-19:1v8y712',
  'premium:2.2.0:english-vocabulary:english-vocab-context-17:tikvip',
  'premium:2.2.0:english-vocabulary:english-vocab-context-05:1mmtuw',
  'premium:2.2.0:english-vocabulary:english-vocab-context-08:1cag9u4',
  'premium:2.2.0:english-vocabulary:english-vocab-context-06:1ahwr0u',
  'premium:2.2.0:english-vocabulary:english-vocab-context-03:1ccqu5',
  'premium:2.2.0:english-vocabulary:english-vocab-context-16:ff8lba',
  'premium:2.2.0:english-vocabulary:english-vocab-context-09:id39dk',
  'premium:2.2.0:english-vocabulary:english-vocab-context-14:r4yz3y',
  'premium:2.2.0:english-vocabulary:english-vocab-context-01:7o6tq2',
  'premium:2.2.0:english-vocabulary:english-vocab-context-02:1c7eooa',
  'premium:2.2.0:english-vocabulary:english-vocab-context-04:5ipn0g',
  'premium:2.2.0:english-vocabulary:english-vocab-context-07:llgfc1'
]);

const ENGLISH_35_KEYS = Object.freeze([
  'premium:3.1.0:english-vocabulary:g35-en-vocab-invite-01:1m9s7sd',
  'premium:3.1.0:english-vocabulary:g35-en-vocab-protect-01:18is450',
  'premium:3.1.0:english-vocabulary:g35-en-vocab-return-01:1tsdzp4',
  'premium:3.1.0:english-vocabulary:g35-en-vocab-quiet-01:1b68m5i',
  'premium:3.1.0:english-vocabulary:g35-en-vocab-recycle-01:qi3sr8',
  'premium:3.1.0:english-vocabulary:g35-en-vocab-careful-01:zz5akb',
  'premium:3.1.0:english-vocabulary:g35-en-vocab-cloudy-01:4b7bpp',
  'premium:3.1.0:english-vocabulary:g35-en-vocab-expensive-01:wi9g3a',
  'premium:3.1.0:english-vocabulary:g35-en-vocab-across-01:1lo8tdg',
  'premium:3.1.0:english-vocabulary:g35-en-vocab-healthy-01:14j4tg5',
  'premium:3.1.0:english-vocabulary:g35-en-vocab-thirsty-01:ig5i36',
  'premium:3.1.0:english-vocabulary:g35-en-vocab-safe-01:oddhjp',
  'premium:3.1.0:english-vocabulary:g35-en-vocab-improve-01:f1ox7u',
  'premium:3.1.0:english-vocabulary:g35-en-vocab-between-01:1pwzcq2',
  'premium:3.1.0:english-vocabulary:g35-en-vocab-carry-01:107hpu5',
  'premium:3.1.0:english-vocabulary:g35-en-vocab-choose-01:1vt6hbn',
  'premium:3.1.0:english-vocabulary:g35-en-vocab-borrow-01:1m4zvsy',
  'premium:3.1.0:english-vocabulary:g35-en-vocab-crowded-01:1s8dg2s',
  'premium:3.1.0:english-vocabulary:g35-en-vocab-arrive-01:d3msku',
  'premium:3.1.0:english-vocabulary:g35-en-vocab-early-01:1urw0vy'
]);

const POLICY = Object.freeze({
  'social-time-travel:8': Object.freeze({
    label: '8. sınıf T.C. İnkılap Tarihi · Kaynak ve Neden-Sonuç',
    status: 'SAFE_PILOT_HARD_ONLY',
    keys: TRUSTED_PRIORITY_4_8_KEYS.grade8History
  }),
  'religion-practice:8': Object.freeze({
    label: '8. sınıf Din Kültürü · Gerekçeli Ahlaki Muhakeme',
    status: 'SAFE_PILOT_HARD_ONLY',
    keys: TRUSTED_PRIORITY_4_8_KEYS.grade8Religion
  }),
  'paragraph-detective:4': Object.freeze({
    label: '4. sınıf Türkçe · Kanıt Temelli Paragraf Motoru', status: 'SAFE_ENGINE_CHALLENGING', keys: EVIDENCE_BACKED_PRIORITY_TURKISH_KEYS.grade4.paragraphDetective
  }),
  'meaning-hunt:4': Object.freeze({
    label: '4. sınıf Türkçe · Bağlam ve Anlam Motoru', status: 'SAFE_ENGINE_CHALLENGING', keys: EVIDENCE_BACKED_PRIORITY_TURKISH_KEYS.grade4.meaningHunt
  }),
  'problem-hunter:4': Object.freeze({
    label: '4. sınıf Matematik · Solver Destekli Problem Motoru', status: 'SAFE_ENGINE_CHALLENGING', keys: SOLVER_BACKED_PRIORITY_MATH_KEYS.grade4.problemHunter
  }),
  'error-detective:4': Object.freeze({
    label: '4. sınıf Matematik · Solver Destekli Hata Dedektifi', status: 'SAFE_ENGINE_CHALLENGING', keys: SOLVER_BACKED_PRIORITY_MATH_KEYS.grade4.errorDetective
  }),
  'geometry-lab:4': Object.freeze({
    label: '4. sınıf Matematik · Solver Destekli Geometri Laboratuvarı', status: 'SAFE_ENGINE_CHALLENGING', keys: SOLVER_BACKED_PRIORITY_MATH_KEYS.grade4.geometryLab
  }),
  'science-reasoning:4': Object.freeze({
    label: '4. sınıf Fen Bilimleri · Kanıt ve Çıkarım Motoru', status: 'SAFE_ENGINE_CHALLENGING', keys: EVIDENCE_BACKED_PRIORITY_SCIENCE_KEYS.grade4.scienceReasoning
  }),
  'science-lab:4': Object.freeze({
    label: '4. sınıf Fen Bilimleri · Kontrollü Deney Laboratuvarı', status: 'SAFE_ENGINE_CHALLENGING', keys: EVIDENCE_BACKED_PRIORITY_SCIENCE_KEYS.grade4.scienceLab
  }),
  'social-time-travel:4': Object.freeze({
    label: '4. sınıf Sosyal Bilgiler · Harita, Kaynak ve Sorumluluk', status: 'SAFE_PILOT_CHALLENGING', keys: TRUSTED_PRIORITY_4_8_KEYS.grade4Social
  }),
  'english-vocabulary:4': Object.freeze({
    label: '4. sınıf İngilizce · Bağlamsal Kelime ve Yönerge', status: 'SAFE_PILOT_CHALLENGING', keys: TRUSTED_PRIORITY_4_8_KEYS.grade4English
  }),
  'religion-practice:4': Object.freeze({
    label: '4. sınıf Din Kültürü · Değer ve Davranış', status: 'SAFE_PILOT_CHALLENGING', keys: TRUSTED_PRIORITY_4_8_KEYS.grade4Religion
  }),
  'paragraph-detective:7': Object.freeze({
    label: '7. sınıf Türkçe · Paragraf Dedektifi',
    status: 'SAFE_PILOT_HARD_ONLY',
    keys: TRUSTED_G7_CORE_DEEP_KEYS.paragraph
  }),
  'meaning-hunt:7': Object.freeze({
    label: '7. sınıf Türkçe · Anlam Avı',
    status: 'SAFE_PILOT_HARD_ONLY',
    keys: TRUSTED_G7_CORE_DEEP_KEYS.meaning
  }),
  'problem-hunter:7': Object.freeze({
    label: '7. sınıf Matematik · Çok Adımlı Problem Avcısı',
    status: 'SAFE_PILOT_HARD_ONLY',
    keys: TRUSTED_G7_CORE_DEEP_KEYS.math
  }),
  'science-reasoning:7': Object.freeze({
    label: '7. sınıf Fen · Çoklu Kanıt ve Deney',
    status: 'SAFE_PILOT_HARD_ONLY',
    keys: TRUSTED_G7_CORE_DEEP_KEYS.science
  }),
  'paragraph-detective:8': Object.freeze({
    label: '8. sınıf Türkçe · Kanıt Temelli Paragraf Motoru',
    status: 'SAFE_ENGINE_HARD_ONLY',
    keys: EVIDENCE_BACKED_PRIORITY_TURKISH_KEYS.grade8.paragraphDetective
  }),
  'meaning-hunt:8': Object.freeze({
    label: '8. sınıf Türkçe · Bağlam ve Anlam Motoru',
    status: 'SAFE_ENGINE_HARD_ONLY',
    keys: EVIDENCE_BACKED_PRIORITY_TURKISH_KEYS.grade8.meaningHunt
  }),
  'science-reasoning:8': Object.freeze({
    label: '8. sınıf Fen · Kanıt, Veri ve Nedensellik Motoru',
    status: 'SAFE_ENGINE_HARD_ONLY',
    keys: EVIDENCE_BACKED_PRIORITY_SCIENCE_KEYS.grade8.scienceReasoning
  }),
  'science-lab:8': Object.freeze({
    label: '8. sınıf Fen · Kontrollü Deney Tasarımı Laboratuvarı',
    status: 'SAFE_ENGINE_HARD_ONLY',
    keys: EVIDENCE_BACKED_PRIORITY_SCIENCE_KEYS.grade8.scienceLab
  }),
  'problem-hunter:8': Object.freeze({
    label: '8. sınıf Matematik · Solver Destekli Problem Motoru',
    status: 'SAFE_ENGINE_HARD_ONLY',
    keys: SOLVER_BACKED_PRIORITY_MATH_KEYS.grade8.problemHunter
  }),
  'error-detective:8': Object.freeze({
    label: '8. sınıf Matematik · Solver Destekli Hata Dedektifi',
    status: 'SAFE_ENGINE_HARD_ONLY',
    keys: SOLVER_BACKED_PRIORITY_MATH_KEYS.grade8.errorDetective
  }),
  'geometry-lab:8': Object.freeze({
    label: '8. sınıf Matematik · Solver Destekli Geometri Laboratuvarı',
    status: 'SAFE_ENGINE_HARD_ONLY',
    keys: SOLVER_BACKED_PRIORITY_MATH_KEYS.grade8.geometryLab
  }),
  'logic-station:8': Object.freeze({
    label: '8. sınıf · Zekâ İstasyonu',
    status: 'SAFE_PILOT_HARD_ONLY',
    keys: TRUSTED_G8_LOGIC_DEEP_KEYS
  }),
  'olympiad-ladder:8': Object.freeze({
    label: '8. sınıf · Olimpiyat Merdiveni',
    status: 'SAFE_PILOT_HARD_ONLY',
    keys: TRUSTED_OLYMPIAD_GRADE8_KEYS
  }),
  'english-vocabulary:5': Object.freeze({
    label: '5. sınıf · Günün 20 İngilizce Kelimesi', status: 'SAFE_PILOT_REVIEWED', keys: ENGLISH_35_KEYS
  }),
  'english-vocabulary:6': Object.freeze({
    label: '6. sınıf · Günün 20 İngilizce Kelimesi', status: 'SAFE_PILOT_REVIEWED', keys: ENGLISH_68_KEYS
  }),
  'english-vocabulary:7': Object.freeze({
    label: '7. sınıf · Günün 20 İngilizce Kelimesi', status: 'SAFE_PILOT_REVIEWED', keys: ENGLISH_68_KEYS
  }),
  'english-vocabulary:8': Object.freeze({
    label: '8. sınıf · Günün 20 İngilizce Kelimesi', status: 'SAFE_PILOT_REVIEWED', keys: ENGLISH_68_KEYS
  })
});

export const TRUSTED_LIVE_POLICY_VERSION = '7.0.0';
export const TRUSTED_LIVE_CELL_POLICY = POLICY;

export function trustedLiveCell(gameId, grade) {
  return POLICY[`${gameId}:${Number(grade)}`] || null;
}

export function trustedLivePolicySummary() {
  return Object.entries(POLICY).map(([cellId, policy]) => ({
    cellId,
    label: policy.label,
    status: policy.status,
    approvedQuestionCount: policy.keys.length
  }));
}
