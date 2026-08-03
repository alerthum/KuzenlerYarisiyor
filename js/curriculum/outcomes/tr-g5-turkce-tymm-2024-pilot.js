import { defineCurriculumOutcome, defineIngestionStatus } from '../curriculum-ingestion-contract.js';

const SOURCE_ID = 'meb-tymm-programs';
const SOURCE_DOCUMENT = 'Ortaokul Türkçe Dersi Öğretim Programı (5, 6, 7 ve 8. Sınıflar), Türkiye Yüzyılı Maarif Modeli, 2024';
const SOURCE_URL = 'https://tymm.meb.gov.tr/upload/program/2024programtur5678Onayli.pdf';

const RAW = Object.freeze([
  { code: 'T.O.5.5', text: 'Metinde geçen anlamını bilmediği söz varlığı unsurlarının anlamını tahmin edebilme', unitId: 'okuma', unitName: 'Okuma', topicId: 'baglamdan-anlam', topicName: 'Bağlamdan Anlam Tahmini', page: 43 },
  { code: 'T.O.5.8', text: 'Metnin derin anlamını belirlemeye yönelik basit çıkarımlar yapabilme', unitId: 'okuma', unitName: 'Okuma', topicId: 'basit-cikarim', topicName: 'Basit Çıkarım', page: 44 },
  { code: 'T.O.5.11', text: 'Metinler arası karşılaştırma yapabilme', unitId: 'okuma', unitName: 'Okuma', topicId: 'metinler-arasi-karsilastirma', topicName: 'Metinler Arası Karşılaştırma', page: 44 },
  { code: 'T.O.5.14', text: 'Öyküleyici metinlerdeki hikâye unsurlarını belirlemeye yönelik çözümleme yapabilme', unitId: 'okuma', unitName: 'Okuma', topicId: 'hikaye-unsurlari', topicName: 'Hikâye Unsurları', page: 45 },
  { code: 'T.O.5.20', text: 'Metindeki söz sanatlarını belirlemeye yönelik çözümleme yapabilme', unitId: 'okuma', unitName: 'Okuma', topicId: 'soz-sanatlari', topicName: 'Söz Sanatları', page: 46 }
]);

export const GRADE5_TURKISH_PILOT_OUTCOMES = Object.freeze(RAW.map(record => defineCurriculumOutcome({
  id: `tr.tymm.g5.turkce.${record.code.toLocaleLowerCase('tr-TR').replaceAll('.', '-')}`,
  grade: 5,
  schoolType: 'ILKOKUL_ORTAOKUL_GENEL',
  courseId: 'turkce',
  courseName: 'Türkçe',
  unitId: record.unitId,
  unitName: record.unitName,
  topicId: record.topicId,
  topicName: record.topicName,
  officialOutcomeCode: record.code,
  officialOutcomeText: record.text,
  officialGuidanceNotes: [],
  sourceId: SOURCE_ID,
  sourceLocator: `${SOURCE_DOCUMENT}; PDF s. ${record.page}; ${record.code}; ${SOURCE_URL}`,
  fieldSkills: ['okuma'],
  assessmentEvidenceTypes: ['single-choice', 'evidence-linked-reading']
})));

export const GRADE5_TURKISH_PILOT_INGESTION_STATUS = defineIngestionStatus({
  id: 'tr-2026-2027-g5-turkce-cross-pilot', schoolYear: '2026-2027', grade: 5, courseId: 'turkce',
  status: 'PARTIAL', sourceId: SOURCE_ID, outcomeCount: GRADE5_TURKISH_PILOT_OUTCOMES.length, lastVerifiedAt: '2026-08-03',
  blockers: ['Only five reading outcomes are ingested for the cross-transferability pilot.']
});

export function grade5TurkishPilotOutcomeByCode(code) {
  return GRADE5_TURKISH_PILOT_OUTCOMES.find(record => record.officialOutcomeCode === String(code ?? '').trim()) || null;
}
