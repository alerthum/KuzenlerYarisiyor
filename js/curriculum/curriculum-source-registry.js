function requiredText(value, field, id = 'curriculum-source') {
  const text = String(value ?? '').trim();
  if (!text) throw new Error(`${id}: ${field} is required`);
  return text;
}

function optionalDate(value, field, id) {
  if (value == null || value === '') return null;
  const text = requiredText(value, field, id);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw new Error(`${id}: ${field} must be YYYY-MM-DD`);
  return text;
}

const SOURCE_KINDS = new Set([
  'official-curriculum',
  'official-course-schedule',
  'official-assessment-blueprint',
  'official-item-writing-guide',
  'international-assessment-framework',
  'style-reference'
]);

const USE_MODES = new Set([
  'AUTHORITATIVE_DATA',
  'ASSESSMENT_FRAMEWORK',
  'STYLE_REFERENCE_ONLY'
]);

export function defineCurriculumSource(input = {}) {
  const id = requiredText(input.id, 'id');
  const kind = requiredText(input.kind, 'kind', id);
  const useMode = requiredText(input.useMode, 'useMode', id);
  if (!SOURCE_KINDS.has(kind)) throw new Error(`${id}: unsupported kind ${kind}`);
  if (!USE_MODES.has(useMode)) throw new Error(`${id}: unsupported useMode ${useMode}`);
  return Object.freeze({
    id,
    kind,
    useMode,
    authority: requiredText(input.authority, 'authority', id),
    title: requiredText(input.title, 'title', id),
    url: requiredText(input.url, 'url', id),
    retrievedAt: optionalDate(input.retrievedAt, 'retrievedAt', id),
    effectiveFrom: optionalDate(input.effectiveFrom, 'effectiveFrom', id),
    effectiveTo: optionalDate(input.effectiveTo, 'effectiveTo', id),
    copyrightPolicy: requiredText(input.copyrightPolicy, 'copyrightPolicy', id),
    notes: String(input.notes ?? '').trim()
  });
}

export const CURRICULUM_SOURCES = Object.freeze([
  defineCurriculumSource({
    id: 'meb-tymm-programs',
    kind: 'official-curriculum',
    useMode: 'AUTHORITATIVE_DATA',
    authority: 'T.C. Millî Eğitim Bakanlığı',
    title: 'Türkiye Yüzyılı Maarif Modeli Öğretim Programları',
    url: 'https://tymm.meb.gov.tr/ogretim-programlari',
    retrievedAt: '2026-08-03',
    copyrightPolicy: 'Metadata and curriculum alignment only; preserve official wording and provenance.',
    notes: 'Primary source for TYMM learning outcomes, content framework and skill components.'
  }),
  defineCurriculumSource({
    id: 'meb-tymm-turkce-2024', kind: 'official-curriculum', useMode: 'AUTHORITATIVE_DATA', authority: 'T.C. Millî Eğitim Bakanlığı Talim ve Terbiye Kurulu Başkanlığı',
    title: 'Ortaokul Türkçe Dersi Öğretim Programı (5-8), TYMM 2024', url: 'https://tymm.meb.gov.tr/upload/program/2024programtur5678Onayli.pdf', retrievedAt: '2026-08-04',
    copyrightPolicy: 'Preserve official learning-outcome wording and provenance; produce original assessment content.', notes: 'Active source for grades 5, 6 and 7 Turkish in 2026-2027.'
  }),
  defineCurriculumSource({
    id: 'meb-tymm-matematik-5-8-2024',
    kind: 'official-curriculum', useMode: 'AUTHORITATIVE_DATA', authority: 'T.C. Millî Eğitim Bakanlığı Talim ve Terbiye Kurulu Başkanlığı',
    title: 'Ortaokul Matematik Dersi Öğretim Programı (5-8), TYMM 2024',
    url: 'https://mufredat.meb.gov.tr/Dosyalar/202582516434252-ortaokul%20matematik.pdf', retrievedAt: '2026-08-04',
    copyrightPolicy: 'Preserve official learning-outcome wording and provenance; produce original assessment content.', notes: 'Active source for grade 5 mathematics in 2026-2027.'
  }),
  defineCurriculumSource({
    id: 'meb-tymm-fen-3-8-2024', kind: 'official-curriculum', useMode: 'AUTHORITATIVE_DATA', authority: 'T.C. Millî Eğitim Bakanlığı Talim ve Terbiye Kurulu Başkanlığı',
    title: 'Fen Bilimleri Dersi Öğretim Programı (3-8), TYMM 2024', url: 'https://mufredat.meb.gov.tr/Dosyalar/2025825154137627-fen%20bilimleri.pdf', retrievedAt: '2026-08-04',
    copyrightPolicy: 'Preserve official learning-outcome wording and provenance; produce original assessment content.', notes: 'Active source for grade 5 science in 2026-2027.'
  }),
  defineCurriculumSource({
    id: 'meb-tymm-sosyal-4-7-2024', kind: 'official-curriculum', useMode: 'AUTHORITATIVE_DATA', authority: 'T.C. Millî Eğitim Bakanlığı Talim ve Terbiye Kurulu Başkanlığı',
    title: 'Sosyal Bilgiler Dersi Öğretim Programı (4-7), TYMM 2024', url: 'https://mufredat.meb.gov.tr/Dosyalar/202582516728345-sosyal%20bilgiler.pdf', retrievedAt: '2026-08-04',
    copyrightPolicy: 'Preserve official learning-outcome wording and provenance; produce original assessment content.', notes: 'Active source for grade 5 social studies in 2026-2027.'
  }),
  defineCurriculumSource({
    id: 'meb-tymm-dkab-4-8-2024', kind: 'official-curriculum', useMode: 'AUTHORITATIVE_DATA', authority: 'T.C. Millî Eğitim Bakanlığı Talim ve Terbiye Kurulu Başkanlığı',
    title: 'Din Kültürü ve Ahlak Bilgisi Dersi Öğretim Programı (4-8), TYMM 2024', url: 'https://mufredat.meb.gov.tr/Dosyalar/2025825154011486-din%20k%C3%BClt%C3%BCr%C3%BC%204_8.pdf', retrievedAt: '2026-08-04',
    copyrightPolicy: 'Preserve official learning-outcome wording and provenance; produce original assessment content.', notes: 'Active source for grade 5 DKAB in 2026-2027.'
  }),
  defineCurriculumSource({
    id: 'meb-tymm-ingilizce-2-8-2025', kind: 'official-curriculum', useMode: 'AUTHORITATIVE_DATA', authority: 'T.C. Millî Eğitim Bakanlığı Talim ve Terbiye Kurulu Başkanlığı',
    title: 'English Language Curriculum (2-8), TYMM 2025', url: 'https://mufredat.meb.gov.tr/Dosyalar/202591011405337-26-08-ekli-english-regular.pdf', retrievedAt: '2026-08-04',
    copyrightPolicy: 'Preserve official learning-outcome wording and provenance; produce original assessment content.', notes: 'Active source for grade 5 English in 2026-2027.'
  }),
  defineCurriculumSource({
    id: 'meb-fen-bilimleri-2018', kind: 'official-curriculum', useMode: 'AUTHORITATIVE_DATA', authority: 'T.C. Millî Eğitim Bakanlığı Talim ve Terbiye Kurulu Başkanlığı',
    title: 'Fen Bilimleri Dersi Öğretim Programı (3-8, 2018)', url: 'https://mufredat.meb.gov.tr/Programlar.aspx', retrievedAt: '2026-08-04',
    copyrightPolicy: 'Preserve official outcome wording and provenance; produce original assessment content.', notes: 'Local evidence copy: docs/sources/FEN_BILIMLERI_2018.pdf. Active source for grade 4 in 2026-2027.'
  }),
  defineCurriculumSource({
    id: 'meb-dkab-4-8-2018', kind: 'official-curriculum', useMode: 'AUTHORITATIVE_DATA', authority: 'T.C. Millî Eğitim Bakanlığı Talim ve Terbiye Kurulu Başkanlığı',
    title: 'Din Kültürü ve Ahlak Bilgisi Dersi Öğretim Programı (4-8, 2018)', url: 'https://mufredat.meb.gov.tr/Programlar.aspx', retrievedAt: '2026-08-04',
    copyrightPolicy: 'Preserve official outcome wording and provenance; produce original assessment content.', notes: 'Local evidence copy: docs/sources/DKAB_4_8_2018.pdf. Active source for grade 4 in 2026-2027.'
  }),
  defineCurriculumSource({
    id: 'meb-english-2-8-2018', kind: 'official-curriculum', useMode: 'AUTHORITATIVE_DATA', authority: 'T.C. Millî Eğitim Bakanlığı Talim ve Terbiye Kurulu Başkanlığı',
    title: 'İngilizce Dersi Öğretim Programı (2-8, 2018)', url: 'https://mufredat.meb.gov.tr/Programlar.aspx', retrievedAt: '2026-08-04',
    copyrightPolicy: 'Preserve official outcome wording and provenance; produce original assessment content.', notes: 'Local evidence copy: docs/sources/INGILIZCE_2_8_2018.pdf. Active source for grade 4 in 2026-2027.'
  }),
  defineCurriculumSource({
    id: 'meb-tymm-primary-turkish-1-4-2024', kind: 'official-curriculum', useMode: 'AUTHORITATIVE_DATA', authority: 'T.C. Millî Eğitim Bakanlığı Talim ve Terbiye Kurulu Başkanlığı',
    title: 'İlkokul Türkçe Dersi Öğretim Programı (1-4), TYMM', url: 'https://tymm.meb.gov.tr/ogretim-programlari', retrievedAt: '2026-08-04',
    copyrightPolicy: 'Source acquisition registry only until the official PDF is locally ingested and validated.', notes: 'Pending local evidence ingestion for grades 1-3; no outcome is activated from this registry row alone.'
  }),
  defineCurriculumSource({
    id: 'meb-tymm-primary-math-1-4-2024', kind: 'official-curriculum', useMode: 'AUTHORITATIVE_DATA', authority: 'T.C. Millî Eğitim Bakanlığı Talim ve Terbiye Kurulu Başkanlığı',
    title: 'İlkokul Matematik Dersi Öğretim Programı (1-4), TYMM', url: 'https://tymm.meb.gov.tr/ogretim-programlari', retrievedAt: '2026-08-04',
    copyrightPolicy: 'Source acquisition registry only until the official PDF is locally ingested and validated.', notes: 'Pending local evidence ingestion for grades 1-3; no outcome is activated from this registry row alone.'
  }),
  defineCurriculumSource({
    id: 'meb-tymm-life-science-1-3-2024', kind: 'official-curriculum', useMode: 'AUTHORITATIVE_DATA', authority: 'T.C. Millî Eğitim Bakanlığı Talim ve Terbiye Kurulu Başkanlığı',
    title: 'Hayat Bilgisi Dersi Öğretim Programı (1-3), TYMM', url: 'https://tymm.meb.gov.tr/ogretim-programlari', retrievedAt: '2026-08-04',
    copyrightPolicy: 'Source acquisition registry only until the official PDF is locally ingested and validated.', notes: 'Pending local evidence ingestion; no outcome is activated from this registry row alone.'
  }),
  defineCurriculumSource({
    id: 'meb-tymm-primary-arts-movement', kind: 'official-curriculum', useMode: 'AUTHORITATIVE_DATA', authority: 'T.C. Millî Eğitim Bakanlığı Talim ve Terbiye Kurulu Başkanlığı',
    title: 'Görsel Sanatlar, Müzik ve Beden Eğitimi/Oyun Öğretim Programları', url: 'https://tymm.meb.gov.tr/ogretim-programlari', retrievedAt: '2026-08-04',
    copyrightPolicy: 'Source acquisition registry only until official PDFs are locally ingested and validated.', notes: 'Pending local evidence ingestion; performance outcomes must not be fabricated or reduced to multiple choice.'
  }),
  defineCurriculumSource({
    id: 'meb-legacy-programs',
    kind: 'official-curriculum',
    useMode: 'AUTHORITATIVE_DATA',
    authority: 'T.C. Millî Eğitim Bakanlığı Talim ve Terbiye Kurulu Başkanlığı',
    title: 'Öğretim Programları Arşivi',
    url: 'https://mufredat.meb.gov.tr/Programlar.aspx',
    retrievedAt: '2026-08-03',
    copyrightPolicy: 'Metadata and curriculum alignment only; preserve official wording and provenance.',
    notes: 'Primary source for grades not yet migrated to TYMM in the active school year.'
  }),
  defineCurriculumSource({
    id: 'meb-2026-2027-rollout',
    kind: 'official-curriculum',
    useMode: 'AUTHORITATIVE_DATA',
    authority: 'T.C. Millî Eğitim Bakanlığı Antalya Ölçme Değerlendirme Merkezi',
    title: '2026-2027 Yıllık Çerçeve Planlar ve Öğretim Programları',
    url: 'https://antalyaodm.meb.gov.tr/www/yillik-cerceve-planlar-ve-ogretim-programlari/icerik/49',
    retrievedAt: '2026-08-03',
    effectiveFrom: '2026-09-01',
    effectiveTo: '2027-08-31',
    copyrightPolicy: 'Use as official rollout/version routing evidence.',
    notes: 'Routes grades 1,2,3,5,6,7,9,10,11 to TYMM and grades 4,8,12 to the previous programs.'
  }),
  defineCurriculumSource({
    id: 'ttkb-weekly-course-schedules',
    kind: 'official-course-schedule',
    useMode: 'AUTHORITATIVE_DATA',
    authority: 'T.C. Millî Eğitim Bakanlığı Talim ve Terbiye Kurulu Başkanlığı',
    title: 'Haftalık Ders Çizelgeleri',
    url: 'https://ttkb.meb.gov.tr/www/haftalik-ders-cizelgeleri/kategori/7',
    retrievedAt: '2026-08-03',
    copyrightPolicy: 'Use course names, grade placement and schedule metadata with provenance.',
    notes: 'Source of truth for which courses exist at each grade and school type.'
  }),
  defineCurriculumSource({
    id: 'ttkb-primary-middle-schedule-2025',
    kind: 'official-course-schedule',
    useMode: 'AUTHORITATIVE_DATA',
    authority: 'T.C. Millî Eğitim Bakanlığı Talim ve Terbiye Kurulu Başkanlığı',
    title: 'İlköğretim Kurumları Haftalık Ders Çizelgesi — 09/05/2025 Karar 04',
    url: 'https://ttkb.meb.gov.tr/meb_iys_dosyalar/2025_05/16094742_4nolukararilkogretimkurumlariilkokulveortaokulhaftalikderscizelgesi.pdf',
    retrievedAt: '2026-08-03',
    effectiveFrom: '2025-09-01',
    copyrightPolicy: 'Use course names, grade availability and hours with provenance.',
    notes: 'Active compulsory/elective course schedule for grades 1-8.'
  }),
  defineCurriculumSource({
    id: 'ttkb-anatolian-high-school-schedule-2025',
    kind: 'official-course-schedule',
    useMode: 'AUTHORITATIVE_DATA',
    authority: 'T.C. Millî Eğitim Bakanlığı Talim ve Terbiye Kurulu Başkanlığı',
    title: 'Anadolu Lisesi Haftalık Ders Çizelgesi — 09/05/2025 Karar 05',
    url: 'https://ttkb.meb.gov.tr/meb_iys_dosyalar/2025_05/20144001_202505.pdf',
    retrievedAt: '2026-08-03',
    effectiveFrom: '2025-09-01',
    copyrightPolicy: 'Use course names, grade availability and hours with provenance.',
    notes: 'Active schedule for Anadolu, Fen and Sosyal Bilimler high-school types; initial registry ingests Anadolu compulsory courses.'
  }),
  defineCurriculumSource({
    id: 'meb-mcq-writing-guide',
    kind: 'official-item-writing-guide',
    useMode: 'ASSESSMENT_FRAMEWORK',
    authority: 'T.C. Millî Eğitim Bakanlığı',
    title: 'Çoktan Seçmeli Soru Yazım Kılavuzu',
    url: 'https://tymm.meb.gov.tr/upload/kilavuz/coktan-secmeli-soru-yazim-kilavuzu.pdf',
    retrievedAt: '2026-08-03',
    copyrightPolicy: 'Use principles and validation criteria; do not reproduce protected examples.',
    notes: 'National item-writing reference for stem, option and review rules.'
  }),
  defineCurriculumSource({
    id: 'osym-yks-2026',
    kind: 'official-assessment-blueprint',
    useMode: 'AUTHORITATIVE_DATA',
    authority: 'Ölçme, Seçme ve Yerleştirme Merkezi',
    title: '2026 Yükseköğretim Kurumları Sınavı Kılavuzu ve Temel Soru Kitapçıkları',
    url: 'https://www.osym.gov.tr/TR,33851/2026-yuksekogretim-kurumlari-sinavi-yks-kilavuzu.html',
    retrievedAt: '2026-08-03',
    copyrightPolicy: 'Blueprint and construct analysis only; never copy protected questions.',
    notes: 'Exam blueprint and current form evidence for TYT, AYT and YDT.'
  }),
  defineCurriculumSource({
    id: 'osym-dgs-2026',
    kind: 'official-assessment-blueprint',
    useMode: 'AUTHORITATIVE_DATA',
    authority: 'Ölçme, Seçme ve Yerleştirme Merkezi',
    title: '2026 Dikey Geçiş Sınavı Kılavuzu',
    url: 'https://www.osym.gov.tr/TR,34085/2026-dgs-kilavuz-ve-basvuru-bilgileri.html',
    retrievedAt: '2026-08-03',
    copyrightPolicy: 'Blueprint and construct analysis only; never copy protected questions.',
    notes: 'Current DGS scope and test structure.'
  }),
  defineCurriculumSource({
    id: 'osym-kpss-2026',
    kind: 'official-assessment-blueprint',
    useMode: 'AUTHORITATIVE_DATA',
    authority: 'Ölçme, Seçme ve Yerleştirme Merkezi',
    title: '2026 Kamu Personel Seçme Sınavı Kılavuzları',
    url: 'https://www.osym.gov.tr/',
    retrievedAt: '2026-08-03',
    copyrightPolicy: 'Blueprint and construct analysis only; never copy protected questions.',
    notes: 'Current KPSS general ability, general culture and field-test routing.'
  }),
  defineCurriculumSource({
    id: 'oecd-pisa-2025-framework',
    kind: 'international-assessment-framework',
    useMode: 'ASSESSMENT_FRAMEWORK',
    authority: 'OECD',
    title: 'PISA 2025 Assessment and Analytical Framework',
    url: 'https://www.oecd.org/en/publications/pisa-2025-assessment-and-analytical-framework_86c36975-en.html',
    retrievedAt: '2026-08-03',
    copyrightPolicy: 'Use construct and competency frameworks; do not copy released/protected items.',
    notes: 'Reading, mathematics, science and learning-in-the-digital-world competency benchmark.'
  }),
  defineCurriculumSource({
    id: 'iea-timss-2023-framework',
    kind: 'international-assessment-framework',
    useMode: 'ASSESSMENT_FRAMEWORK',
    authority: 'IEA TIMSS & PIRLS International Study Center',
    title: 'TIMSS 2023 Assessment Frameworks',
    url: 'https://timssandpirls.bc.edu/timss2023/frameworks/index.html',
    retrievedAt: '2026-08-03',
    copyrightPolicy: 'Use content/cognitive domain frameworks; do not copy protected items.',
    notes: 'Grade 4 and grade 8 mathematics/science benchmark.'
  }),
  defineCurriculumSource({
    id: 'user-ozdebir-paragraph-sample',
    kind: 'style-reference',
    useMode: 'STYLE_REFERENCE_ONLY',
    authority: 'User-provided reference / ÖZDEBİR Yayınları',
    title: 'Sınıflandırılmış Paragraf Soru Bankası Sample',
    url: 'local://ornek_32080.pdf',
    retrievedAt: '2026-08-03',
    copyrightPolicy: 'Analyze genre, stem, option and difficulty patterns only; never reproduce text or questions.',
    notes: 'Human-authored paragraph style benchmark supplied by the user.'
  })
]);

const BY_ID = new Map(CURRICULUM_SOURCES.map(source => [source.id, source]));

export function curriculumSourceById(id) {
  return BY_ID.get(String(id ?? '').trim()) || null;
}

export function assertAuthoritativeSource(sourceId) {
  const source = curriculumSourceById(sourceId);
  if (!source) throw new Error(`unknown curriculum source: ${sourceId}`);
  if (source.useMode !== 'AUTHORITATIVE_DATA') throw new Error(`${sourceId}: source is not authoritative curriculum data`);
  return source;
}
