import { assertAuthoritativeSource } from './curriculum-source-registry.js';

function slug(value) {
  return String(value ?? '')
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function course({ schoolType, grade, name, weeklyHours, sourceId, category = 'COMPULSORY' }) {
  assertAuthoritativeSource(sourceId);
  return Object.freeze({
    id: `tr.${slug(schoolType)}.g${grade}.${slug(name)}`,
    schoolYear: '2026-2027',
    schoolType,
    grade,
    courseId: slug(name),
    courseName: name,
    category,
    weeklyHours,
    sourceId,
    verificationStatus: 'SOURCE_VERIFIED'
  });
}

const PM_SOURCE = 'ttkb-primary-middle-schedule-2025';
const HS_SOURCE = 'ttkb-anatolian-high-school-schedule-2025';

const PRIMARY_MIDDLE = [
  [1, 'Türkçe', 10], [1, 'Matematik', 5], [1, 'Hayat Bilgisi', 4], [1, 'Görsel Sanatlar', 1], [1, 'Müzik', 1], [1, 'Beden Eğitimi ve Oyun', 5],
  [2, 'Türkçe', 10], [2, 'Matematik', 5], [2, 'Hayat Bilgisi', 4], [2, 'Yabancı Dil', 2], [2, 'Görsel Sanatlar', 1], [2, 'Müzik', 1], [2, 'Beden Eğitimi ve Oyun', 5],
  [3, 'Türkçe', 8], [3, 'Matematik', 5], [3, 'Hayat Bilgisi', 3], [3, 'Fen Bilimleri', 3], [3, 'Yabancı Dil', 2], [3, 'Görsel Sanatlar', 1], [3, 'Müzik', 1], [3, 'Beden Eğitimi ve Oyun', 5],
  [4, 'Türkçe', 8], [4, 'Matematik', 5], [4, 'Fen Bilimleri', 3], [4, 'Sosyal Bilgiler', 3], [4, 'Yabancı Dil', 2], [4, 'Din Kültürü ve Ahlak Bilgisi', 2], [4, 'Görsel Sanatlar', 1], [4, 'Müzik', 1], [4, 'Beden Eğitimi ve Oyun', 2], [4, 'Trafik Güvenliği', 1], [4, 'İnsan Hakları, Vatandaşlık ve Demokrasi', 2],
  [5, 'Türkçe', 6], [5, 'Matematik', 5], [5, 'Fen Bilimleri', 4], [5, 'Sosyal Bilgiler', 3], [5, 'Yabancı Dil', 3], [5, 'Din Kültürü ve Ahlak Bilgisi', 2], [5, 'Görsel Sanatlar', 1], [5, 'Müzik', 1], [5, 'Beden Eğitimi ve Spor', 2], [5, 'Bilişim Teknolojileri ve Yazılım', 2], [5, 'Rehberlik ve Yönlendirme', 1],
  [6, 'Türkçe', 6], [6, 'Matematik', 5], [6, 'Fen Bilimleri', 4], [6, 'Sosyal Bilgiler', 3], [6, 'Yabancı Dil', 3], [6, 'Din Kültürü ve Ahlak Bilgisi', 2], [6, 'Görsel Sanatlar', 1], [6, 'Müzik', 1], [6, 'Beden Eğitimi ve Spor', 2], [6, 'Bilişim Teknolojileri ve Yazılım', 2], [6, 'Rehberlik ve Yönlendirme', 1],
  [7, 'Türkçe', 5], [7, 'Matematik', 5], [7, 'Fen Bilimleri', 4], [7, 'Sosyal Bilgiler', 3], [7, 'Yabancı Dil', 4], [7, 'Din Kültürü ve Ahlak Bilgisi', 2], [7, 'Görsel Sanatlar', 1], [7, 'Müzik', 1], [7, 'Beden Eğitimi ve Spor', 2], [7, 'Teknoloji ve Tasarım', 2], [7, 'Rehberlik ve Yönlendirme', 1],
  [8, 'Türkçe', 5], [8, 'Matematik', 5], [8, 'Fen Bilimleri', 4], [8, 'T.C. İnkılap Tarihi ve Atatürkçülük', 2], [8, 'Yabancı Dil', 4], [8, 'Din Kültürü ve Ahlak Bilgisi', 2], [8, 'Görsel Sanatlar', 1], [8, 'Müzik', 1], [8, 'Beden Eğitimi ve Spor', 2], [8, 'Teknoloji ve Tasarım', 2], [8, 'Rehberlik ve Yönlendirme', 1]
].map(([grade, name, weeklyHours]) => course({ schoolType: 'ILKOKUL_ORTAOKUL_GENEL', grade, name, weeklyHours, sourceId: PM_SOURCE }));

const ANADOLU = [
  [9, 'Türk Dili ve Edebiyatı', 5], [9, 'Din Kültürü ve Ahlak Bilgisi', 2], [9, 'Tarih', 2], [9, 'Coğrafya', 2], [9, 'Matematik', 6], [9, 'Fizik', 2], [9, 'Kimya', 2], [9, 'Biyoloji', 2], [9, 'Birinci Yabancı Dil', 4], [9, 'Beden Eğitimi ve Spor', 2], [9, 'Görsel Sanatlar/Müzik', 2], [9, 'Sağlık Bilgisi ve Trafik Kültürü', 1],
  [10, 'Türk Dili ve Edebiyatı', 5], [10, 'Din Kültürü ve Ahlak Bilgisi', 2], [10, 'Tarih', 2], [10, 'Coğrafya', 2], [10, 'Matematik', 6], [10, 'Fizik', 2], [10, 'Kimya', 2], [10, 'Biyoloji', 2], [10, 'Felsefe', 2], [10, 'Birinci Yabancı Dil', 4], [10, 'Beden Eğitimi ve Spor', 2], [10, 'Görsel Sanatlar/Müzik', 2],
  [11, 'Türk Dili ve Edebiyatı', 5], [11, 'Din Kültürü ve Ahlak Bilgisi', 2], [11, 'Tarih', 2], [11, 'Felsefe', 2], [11, 'Birinci Yabancı Dil', 4], [11, 'Beden Eğitimi ve Spor', 2], [11, 'Görsel Sanatlar/Müzik', 2],
  [12, 'Türk Dili ve Edebiyatı', 5], [12, 'Din Kültürü ve Ahlak Bilgisi', 2], [12, 'T.C. İnkılap Tarihi ve Atatürkçülük', 2], [12, 'Birinci Yabancı Dil', 4], [12, 'Beden Eğitimi ve Spor/Görsel Sanatlar/Müzik', 2]
].map(([grade, name, weeklyHours]) => course({ schoolType: 'ANADOLU_LISESI', grade, name, weeklyHours, sourceId: HS_SOURCE }));

export const COURSE_SCHEDULE_REGISTRY_2026_2027 = Object.freeze([...PRIMARY_MIDDLE, ...ANADOLU]);

export const COURSE_SCHEDULE_COVERAGE = Object.freeze({
  schoolYear: '2026-2027',
  includedSchoolTypes: Object.freeze(['ILKOKUL_ORTAOKUL_GENEL', 'ANADOLU_LISESI']),
  includedCategories: Object.freeze(['COMPULSORY']),
  electives: 'NOT_YET_INGESTED',
  otherHighSchoolTypes: 'NOT_YET_INGESTED',
  completeForAllTurkishSchoolTypes: false
});

export function coursesForGrade(grade, schoolType = null) {
  const value = Number(grade);
  return COURSE_SCHEDULE_REGISTRY_2026_2027.filter(record => record.grade === value && (!schoolType || record.schoolType === schoolType));
}

export function validateCourseScheduleRegistry() {
  const duplicateIds = COURSE_SCHEDULE_REGISTRY_2026_2027.length - new Set(COURSE_SCHEDULE_REGISTRY_2026_2027.map(record => record.id)).size;
  const missingGrades = Array.from({ length: 12 }, (_, index) => index + 1).filter(grade => coursesForGrade(grade).length === 0);
  const invalidHours = COURSE_SCHEDULE_REGISTRY_2026_2027.filter(record => !Number.isInteger(record.weeklyHours) || record.weeklyHours <= 0);
  return Object.freeze({
    ok: duplicateIds === 0 && missingGrades.length === 0 && invalidHours.length === 0,
    recordCount: COURSE_SCHEDULE_REGISTRY_2026_2027.length,
    duplicateIds,
    missingGrades: Object.freeze(missingGrades),
    invalidHours: Object.freeze(invalidHours.map(record => record.id))
  });
}
