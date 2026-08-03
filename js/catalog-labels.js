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
  kpss: 'KPSS'
});

export const GAME_LABELS = Object.freeze({
  'word-mine': 'Kelime Madeni',
  'word-ladder': 'Kelime Merdiveni',
  'forbidden-story': 'Yasak Harf Hikâyesi',
  'meaning-hunt': 'Anlam Avı',
  'paragraph-detective': 'Paragraf Dedektifi',
  'target-number': 'Hedef Sayı',
  'speed-math': 'Hızlı İşlem Arenası',
  'pattern-lab': 'Örüntü Laboratuvarı',
  'geometry-lab': 'Geometri Laboratuvarı',
  'problem-hunter': 'Problem Avcısı',
  'error-detective': 'Hata Dedektifi',
  'olympiad-ladder': 'Olimpiyat Merdiveni',
  'logic-station': 'Zekâ İstasyonu',
  'english-vocabulary': 'İngilizce Kelime Avı',
  'english-cloze': 'İngilizce Boşluk Avı',
  'english-sentence-builder': 'İngilizce Cümle Kurucu',
  'science-lab': 'Fen Laboratuvarı',
  'science-reasoning': 'Fen Muhakemesi',
  'experiment-detective': 'Deney Dedektifi',
  'social-time-travel': 'Zamanda Yolculuk',
  'social-map-skills': 'Harita Becerileri',
  'social-citizenship': 'Aktif Vatandaşlık',
  'religion-practice': 'Din Kültürü Çalışması',
  'lgs-foundation': 'LGS Temel Hazırlık',
  'lgs-focus': 'LGS Akıllı Çalışma',
  'tyt-focus': 'TYT Akıllı Çalışma',
  'ayt-focus': 'AYT Alan Çalışması',
  'kpss-focus': 'KPSS Genel Yetenek–Kültür'
});

export function categoryLabel(category) {
  return CATEGORY_LABELS[category] || 'Diğer';
}

export function gameLabel(gameId, fallback = '') {
  return GAME_LABELS[gameId] || fallback || 'Bilinmeyen oyun';
}


const BASE_FILTERS = Object.freeze([
  ['all', 'Tümü'], ['turkish', 'Türkçe'], ['math', 'Matematik'],
  ['english', 'İngilizce'], ['science', 'Fen'], ['social', 'Sosyal'],
  ['logic', 'Zekâ'], ['olympiad', 'Olimpiyat']
]);

export function categoryFiltersForGrade(grade) {
  const g = Number(grade || 1);
  const filters = BASE_FILTERS.map((item) => [...item]);
  if (g === 8) filters.push(['religion', 'Din'], ['lgs', 'LGS']);
  if (g === 11) filters.push(['tyt', 'TYT'], ['ayt', 'AYT']);
  if (g === 12) filters.push(['tyt', 'TYT'], ['ayt', 'AYT'], ['kpss', 'KPSS']);
  return filters;
}
