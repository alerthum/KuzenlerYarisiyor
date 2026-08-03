import { defineCurriculumOutcome, defineIngestionStatus } from '../curriculum-ingestion-contract.js';

const SOURCE_ID = 'meb-legacy-programs';
const SOURCE_DOCUMENT = 'Fen Bilimleri Dersi Öğretim Programı (3-8. Sınıflar), 2018';
const SOURCE_URL = 'https://mufredat.meb.gov.tr/Dosyalar/201812312311937-FEN%20B%C4%B0L%C4%B0MLER%C4%B0%20%C3%96%C4%9ERET%C4%B0M%20PROGRAMI2018.pdf';

const RAW = Object.freeze([
  { code: 'F.8.1.1.1', text: 'Mevsimlerin oluşumuna yönelik tahminlerde bulunur.', notes: ['Dünya’nın dönme ekseni olduğuna ve eksen eğikliğine değinilir.'], unitId: 'mevsimler-ve-iklim', unitName: 'Mevsimler ve İklim', topicId: 'mevsimlerin-olusumu', topicName: 'Mevsimlerin Oluşumu', page: 49 },
  { code: 'F.8.2.2.2', text: 'Tek karakter çaprazlamaları ile ilgili problemler çözerek sonuçlar hakkında yorum yapar.', notes: ['Çaprazlamalarda sadece bezelye karakterleri kullanılır; baskın ve çekinik gen kavramları ele alınır.'], unitId: 'dna-ve-genetik-kod', unitName: 'DNA ve Genetik Kod', topicId: 'kalitim', topicName: 'Kalıtım', page: 50 },
  { code: 'F.8.3.1.1', text: 'Katı basıncını etkileyen değişkenleri deneyerek keşfeder.', notes: ['Basınç birimi Pascal verilir; matematiksel bağıntılara girilmez.'], unitId: 'basinc', unitName: 'Basınç', topicId: 'kati-basinci', topicName: 'Katı Basıncı', page: 51 },
  { code: 'F.8.4.5.3', text: 'Maddelerin hâl değişimi ve ısınma grafiğini çizerek yorumlar.', notes: [], unitId: 'madde-ve-endustri', unitName: 'Madde ve Endüstri', topicId: 'maddenin-isi-ile-etkilesimi', topicName: 'Maddenin Isı ile Etkileşimi', page: 53 },
  { code: 'F.8.5.1.1', text: 'Basit makinelerin sağladığı avantajları örnekler üzerinden açıklar.', notes: ['Basit makinelerde işten kazanç olmadığı vurgulanır; matematiksel bağıntılara girilmez.'], unitId: 'basit-makineler', unitName: 'Basit Makineler', topicId: 'basit-makineler', topicName: 'Basit Makineler', page: 53 }
]);

export const GRADE8_SCIENCE_PILOT_OUTCOMES = Object.freeze(RAW.map(record => defineCurriculumOutcome({
  id: `tr.pre-tymm.g8.fen.${record.code.toLowerCase().replaceAll('.', '-')}`,
  grade: 8,
  schoolType: 'ILKOKUL_ORTAOKUL_GENEL',
  courseId: 'fen-bilimleri',
  courseName: 'Fen Bilimleri',
  unitId: record.unitId,
  unitName: record.unitName,
  topicId: record.topicId,
  topicName: record.topicName,
  officialOutcomeCode: record.code,
  officialOutcomeText: record.text,
  officialGuidanceNotes: record.notes,
  sourceId: SOURCE_ID,
  sourceLocator: `${SOURCE_DOCUMENT}; PDF s. ${record.page}; ${record.code}; ${SOURCE_URL}`,
  assessmentEvidenceTypes: ['single-choice', 'experiment-interpretation', 'model-based-reasoning']
})));

export const GRADE8_SCIENCE_PILOT_INGESTION_STATUS = defineIngestionStatus({
  id: 'tr-2026-2027-g8-fen-cross-pilot', schoolYear: '2026-2027', grade: 8, courseId: 'fen-bilimleri',
  status: 'PARTIAL', sourceId: SOURCE_ID, outcomeCount: GRADE8_SCIENCE_PILOT_OUTCOMES.length, lastVerifiedAt: '2026-08-03',
  blockers: ['Only five outcomes are ingested for the cross-transferability pilot.']
});

export function grade8SciencePilotOutcomeByCode(code) {
  return GRADE8_SCIENCE_PILOT_OUTCOMES.find(record => record.officialOutcomeCode === String(code ?? '').trim()) || null;
}
