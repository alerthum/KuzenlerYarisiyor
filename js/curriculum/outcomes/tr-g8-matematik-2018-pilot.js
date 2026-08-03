import { defineCurriculumOutcome, defineIngestionStatus } from '../curriculum-ingestion-contract.js';

const SOURCE_ID = 'meb-legacy-programs';
const SOURCE_DOCUMENT = 'Matematik Dersi Öğretim Programı (İlkokul ve Ortaokul 1-8. Sınıflar), 2018';
const SOURCE_URL = 'https://mufredat.meb.gov.tr/Dosyalar/201813017165445-MATEMAT%C4%B0K%20%C3%96%C4%9ERET%C4%B0M%20PROGRAMI%202018v.pdf';

const RAW = Object.freeze([
  { code: 'M.8.1.1.2', text: 'İki doğal sayının en büyük ortak bölenini (EBOB) ve en küçük ortak katını (EKOK) hesaplar, ilgili problemleri çözer.', notes: ['Alan ve hacim hesaplamayı gerektiren problemlere girilmez.'], unitId: 'sayilar-ve-islemler', unitName: 'Sayılar ve İşlemler', topicId: 'carpanlar-ve-katlar', topicName: 'Çarpanlar ve Katlar', page: 73 },
  { code: 'M.8.1.2.5', text: 'Çok büyük ve çok küçük sayıları bilimsel gösterimle ifade eder ve karşılaştırır.', notes: ['a sayısı pozitif, 1 veya 1’den büyük ve 10’dan küçük olacak biçimde bilimsel gösterim ele alınır.'], unitId: 'sayilar-ve-islemler', unitName: 'Sayılar ve İşlemler', topicId: 'uslu-ifadeler', topicName: 'Üslü İfadeler', page: 73 },
  { code: 'M.8.2.2.5', text: 'Doğrusal ilişki içeren gerçek hayat durumlarına ait denklem, tablo ve grafiği oluşturur ve yorumlar.', notes: [], unitId: 'cebir', unitName: 'Cebir', topicId: 'dogrusal-denklemler', topicName: 'Doğrusal Denklemler', page: 75 },
  { code: 'M.8.3.1.5', text: 'Pisagor bağıntısını oluşturur, ilgili problemleri çözer.', notes: ['Gerçek hayat uygulamaları, koordinat düzleminde uzaklık ve bir üçgenin dik olup olmadığını belirleme çalışmaları yapılır.'], unitId: 'geometri-ve-olcme', unitName: 'Geometri ve Ölçme', topicId: 'ucgenler', topicName: 'Üçgenler', page: 76 },
  { code: 'M.8.5.1.5', text: 'Basit bir olayın olma olasılığını hesaplar.', notes: ['Birden fazla olayın olma olasılığı ele alınmaz.'], unitId: 'olasilik', unitName: 'Olasılık', topicId: 'basit-olaylarin-olma-olasiligi', topicName: 'Basit Olayların Olma Olasılığı', page: 78 }
]);

export const GRADE8_MATH_PILOT_OUTCOMES = Object.freeze(RAW.map(record => defineCurriculumOutcome({
  id: `tr.pre-tymm.g8.matematik.${record.code.toLowerCase().replaceAll('.', '-')}`,
  grade: 8,
  schoolType: 'ILKOKUL_ORTAOKUL_GENEL',
  courseId: 'matematik',
  courseName: 'Matematik',
  unitId: record.unitId,
  unitName: record.unitName,
  topicId: record.topicId,
  topicName: record.topicName,
  officialOutcomeCode: record.code,
  officialOutcomeText: record.text,
  officialGuidanceNotes: record.notes,
  sourceId: SOURCE_ID,
  sourceLocator: `${SOURCE_DOCUMENT}; PDF s. ${record.page}; ${record.code}; ${SOURCE_URL}`,
  assessmentEvidenceTypes: ['single-choice', 'worked-solution', 'independent-computation']
})));

export const GRADE8_MATH_PILOT_INGESTION_STATUS = defineIngestionStatus({
  id: 'tr-2026-2027-g8-matematik-cross-pilot', schoolYear: '2026-2027', grade: 8, courseId: 'matematik',
  status: 'PARTIAL', sourceId: SOURCE_ID, outcomeCount: GRADE8_MATH_PILOT_OUTCOMES.length, lastVerifiedAt: '2026-08-03',
  blockers: ['Only five outcomes are ingested for the cross-transferability pilot.']
});

export function grade8MathPilotOutcomeByCode(code) {
  return GRADE8_MATH_PILOT_OUTCOMES.find(record => record.officialOutcomeCode === String(code ?? '').trim()) || null;
}
