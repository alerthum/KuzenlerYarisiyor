export const MEB_CURRICULUM_VERSION = '2026.1';

const CORE = {
  1: ['Türkçe', 'Matematik', 'Hayat Bilgisi'],
  2: ['Türkçe', 'Matematik', 'Hayat Bilgisi'],
  3: ['Türkçe', 'Matematik', 'Hayat Bilgisi', 'Fen Bilimleri', 'İngilizce'],
  4: ['Türkçe', 'Matematik', 'Fen Bilimleri', 'Sosyal Bilgiler', 'İngilizce', 'Din Kültürü'],
  5: ['Türkçe', 'Matematik', 'Fen Bilimleri', 'Sosyal Bilgiler', 'İngilizce', 'Din Kültürü'],
  6: ['Türkçe', 'Matematik', 'Fen Bilimleri', 'Sosyal Bilgiler', 'İngilizce', 'Din Kültürü'],
  7: ['Türkçe', 'Matematik', 'Fen Bilimleri', 'Sosyal Bilgiler', 'İngilizce', 'Din Kültürü'],
  8: ['Türkçe', 'Matematik', 'Fen Bilimleri', 'T.C. İnkılap Tarihi', 'İngilizce', 'Din Kültürü'],
  9: ['Türk Dili ve Edebiyatı', 'Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Tarih', 'Coğrafya', 'İngilizce'],
  10: ['Türk Dili ve Edebiyatı', 'Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Tarih', 'Coğrafya', 'Felsefe', 'İngilizce'],
  11: ['Türk Dili ve Edebiyatı', 'Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Tarih', 'Coğrafya', 'Felsefe', 'İngilizce', 'TYT'],
  12: ['Türk Dili ve Edebiyatı', 'Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Tarih', 'Coğrafya', 'Felsefe', 'İngilizce', 'TYT', 'AYT', 'KPSS']
};

export const SKILL_DOMAINS = {
  Türkçe: ['okuduğunu anlama', 'ana düşünce', 'çıkarım', 'sözcük bilgisi', 'dil bilgisi', 'yazma'],
  Matematik: ['sayılar', 'işlemler', 'problem çözme', 'cebir', 'geometri', 'veri ve olasılık'],
  'Fen Bilimleri': ['bilimsel süreç', 'canlılar', 'madde', 'kuvvet ve enerji', 'Dünya ve evren'],
  İngilizce: ['kelime', 'okuma', 'dinleme', 'cümle kurma', 'diyalog', 'dil bilgisi'],
  'Sosyal Bilgiler': ['tarih', 'coğrafya', 'vatandaşlık', 'medya okuryazarlığı'],
  TYT: ['Türkçe muhakeme', 'temel matematik', 'problem', 'geometri', 'sosyal', 'fen'],
  AYT: ['alan matematiği', 'edebiyat', 'fizik', 'kimya', 'biyoloji', 'tarih', 'coğrafya'],
  KPSS: ['genel yetenek Türkçe', 'genel yetenek matematik', 'tarih', 'coğrafya', 'vatandaşlık']
};

export function subjectsForGrade(grade) {
  return CORE[Math.max(1, Math.min(12, Number(grade || 1)))] || CORE[1];
}

export function automaticExamPlans(grade) {
  const value = Number(grade || 1);
  if (value === 8) return ['LGS'];
  if (value === 11) return ['YKS'];
  if (value === 12) return ['YKS', 'KPSS'];
  return [];
}

export function curriculumMatrix(profile, attempts = []) {
  const subjects = subjectsForGrade(profile.grade);
  return subjects.map((subject) => {
    const token = subject.toLocaleLowerCase('tr-TR').split(' ')[0];
    const related = attempts.filter((attempt) => String(attempt.subject || attempt.category || attempt.gameTitle || '').toLocaleLowerCase('tr-TR').includes(token));
    const correct = related.filter((attempt) => attempt.correct).length;
    const accuracy = related.length ? Math.round(correct * 100 / related.length) : 0;
    return {
      subject,
      attempts: related.length,
      accuracy,
      status: related.length < 5 ? 'başlanmadı' : accuracy < 60 ? 'kritik' : accuracy < 80 ? 'gelişiyor' : 'güçlü'
    };
  });
}
