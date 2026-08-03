export const CATEGORY_LABELS = Object.freeze({
  turkish: 'Türkçe',
  math: 'Matematik',
  logic: 'Zekâ',
  olympiad: 'Olimpiyat',
  english: 'İngilizce',
  science: 'Fen Bilimleri',
  social: 'Sosyal Bilgiler',
  religion: 'Din Kültürü',
  lgs: 'LGS',
  tyt: 'TYT',
  ayt: 'AYT',
  kpss: 'KPSS',
  exam: 'Sınav Hazırlığı'
});

export function categoryLabel(category) {
  return CATEGORY_LABELS[category] || 'Diğer';
}

export function categoryFiltersForProfile(profile) {
  const grade = Number(profile?.grade || 1);
  const filters = [
    ['all', 'Tümü'], ['turkish', 'Türkçe'], ['math', 'Matematik'],
    ['english', 'İngilizce'], ['science', 'Fen'], ['social', 'Sosyal'],
    ['logic', 'Zekâ'], ['olympiad', 'Olimpiyat']
  ];
  if (grade === 8) filters.push(['religion', 'Din'], ['lgs', 'LGS']);
  if (grade === 11) filters.push(['tyt', 'TYT'], ['ayt', 'AYT']);
  if (grade >= 12) filters.push(['tyt', 'TYT'], ['ayt', 'AYT'], ['kpss', 'KPSS']);
  return filters;
}
