const TOPIC_LABELS = Object.freeze({
  numbers:'Sayılar', operations:'İşlemler', 'algebraic-thinking':'Cebirsel düşünme', 'mental-math':'Zihinden işlem', 'number-sense':'Sayı hissi',
  patterns:'Örüntüler', sequences:'Sayı dizileri', ratio:'Oran-orantı', percent:'Yüzde', equations:'Denklemler', 'word-problems':'Yeni nesil problemler',
  functions:'Fonksiyonlar', probability:'Olasılık', data:'Veri analizi', geometry:'Geometri', measurement:'Ölçme', 'spatial-reasoning':'Uzamsal düşünme',
  algebra:'Cebir', 'error-analysis':'Hata analizi', logic:'Mantık', conditions:'Koşullar', ordering:'Sıralama', deduction:'Çıkarım',
  'number-theory':'Sayı teorisi', combinatorics:'Kombinatorik', proof:'İspat', inequality:'Eşitsizlik', vocabulary:'Kelime bilgisi', 'word-formation':'Kelime türetme',
  'word-relations':'Kelime ilişkileri', writing:'Yazma', 'language-control':'Dil kullanımı', 'word-meaning':'Sözcükte anlam', 'sentence-meaning':'Cümlede anlam',
  'main-idea':'Ana fikir', inference:'Çıkarım', evidence:'Kanıt bulma', 'reading-comprehension':'Okuduğunu anlama', meaning:'Anlam', grammar:'Dil bilgisi',
  context:'Bağlam', 'word-order':'Kelime sırası', 'sentence-building':'Cümle kurma', 'scientific-process':'Bilimsel süreç', physics:'Fizik', chemistry:'Kimya', biology:'Biyoloji',
  experiment:'Deney', variables:'Değişkenler', graph:'Grafik yorumlama', history:'Tarih', chronology:'Kronoloji', 'cause-effect':'Neden-sonuç', geography:'Coğrafya', maps:'Harita okuma',
  citizenship:'Vatandaşlık', rights:'Haklar', responsibilities:'Sorumluluklar', general:'Genel gelişim'
});

export function topicLabel(topicId='general') {
  return TOPIC_LABELS[topicId] || String(topicId || 'Genel gelişim').replace(/[-_]/g,' ').replace(/\b\w/g, c=>c.toLocaleUpperCase('tr-TR'));
}

export const V9_TOPIC_LABELS = TOPIC_LABELS;
