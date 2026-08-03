/**
 * Genel Müfredat Grafı — gameId/ders/sınav grubundan bağımsız merkezi veri modeli.
 * Ders listesi ve kazanımlar veri odaklı genişler; ortak motora hardcode bağlanmaz.
 */

export const CURRICULUM_GRAPH_VERSION = '1.0.0';
export const CURRICULUM_COUNTRY = 'TR';
export const CURRICULUM_VERSION_DEFAULT = 'MEB-2024';

/** Desteklenen ders kataloğu (oyun kimliğine bağlı değil). */
export const SUBJECT_CATALOG = Object.freeze([
  { id: 'matematik', label: 'Matematik' },
  { id: 'turkce', label: 'Türkçe' },
  { id: 'turk-dili-edebiyati', label: 'Türk Dili ve Edebiyatı' },
  { id: 'ingilizce', label: 'İngilizce' },
  { id: 'fen-bilimleri', label: 'Fen Bilimleri' },
  { id: 'fizik', label: 'Fizik' },
  { id: 'kimya', label: 'Kimya' },
  { id: 'biyoloji', label: 'Biyoloji' },
  { id: 'hayat-bilgisi', label: 'Hayat Bilgisi' },
  { id: 'sosyal-bilgiler', label: 'Sosyal Bilgiler' },
  { id: 'tarih', label: 'Tarih' },
  { id: 'cografya', label: 'Coğrafya' },
  { id: 'inkilap-tarihi', label: 'T.C. İnkılap Tarihi ve Atatürkçülük' },
  { id: 'din-kulturu', label: 'Din Kültürü ve Ahlak Bilgisi' },
  { id: 'felsefe', label: 'Felsefe' }
]);

export const GRADE_RANGE = Object.freeze({ min: 1, max: 12 });

function slug(value = '') {
  return String(value)
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function gradeBandOf(grade) {
  const g = Number(grade);
  if (g <= 2) return '1-2';
  if (g <= 4) return '3-4';
  if (g <= 6) return '5-6';
  if (g <= 8) return '7-8';
  if (g <= 10) return '9-10';
  return '11-12';
}

function examGroupsFor(grade, subjectId) {
  const g = Number(grade);
  const groups = [];
  if (g === 8) groups.push('LGS');
  if (g >= 11) groups.push('TYT');
  if (g === 12 && ['matematik', 'fizik', 'kimya', 'biyoloji', 'turk-dili-edebiyati'].includes(subjectId)) {
    groups.push('AYT');
  }
  if (g === 12 && subjectId === 'ingilizce') groups.push('YDT');
  return groups;
}

/**
 * @returns {object} curriculumSkill kaydı
 */
export function makeCurriculumSkill(partial = {}) {
  const grade = Number(partial.grade || 0);
  const subject = partial.subject || '';
  const subjectId = partial.subjectId || slug(subject);
  const unit = partial.unit || 'genel';
  const topic = partial.topic || 'genel';
  const subtopic = partial.subtopic || '';
  const learningOutcome = partial.learningOutcome || `${subject} / ${unit} / ${topic}`;
  const curriculumSkillId = partial.curriculumSkillId
    || `tr.${subjectId}.g${grade}.${slug(unit)}.${slug(topic)}${subtopic ? `.${slug(subtopic)}` : ''}`;

  return {
    curriculumSkillId,
    country: partial.country || CURRICULUM_COUNTRY,
    curriculumVersion: partial.curriculumVersion || CURRICULUM_VERSION_DEFAULT,
    grade,
    gradeBand: partial.gradeBand || gradeBandOf(grade),
    subject,
    subjectId,
    unit,
    topic,
    subtopic,
    learningOutcome,
    prerequisiteSkillIds: [...(partial.prerequisiteSkillIds || [])],
    examGroups: [...(partial.examGroups || examGroupsFor(grade, subjectId))],
    supportedQuestionTypes: [...(partial.supportedQuestionTypes || ['choice'])],
    supportedGames: [...(partial.supportedGames || [])],
    cognitiveTargets: [...(partial.cognitiveTargets || [])],
    difficultyRange: [...(partial.difficultyRange || [3, 5])],
    sourceReferences: [...(partial.sourceReferences || [])]
  };
}

/** Temsilî çekirdek kazanımlar — coverage matrisi için tohum; genişletilebilir. */
function seedSkills() {
  const seeds = [];
  const add = (grade, subject, unit, topic, games = [], cognitive = [], exams = null) => {
    seeds.push(makeCurriculumSkill({
      grade,
      subject,
      unit,
      topic,
      supportedGames: games,
      cognitiveTargets: cognitive,
      examGroups: exams
    }));
  };

  // 1–4
  add(1, 'Matematik', 'Sayılar', 'Doğal sayılar', ['speed-math', 'target-number'], ['routine-to-reasoning']);
  add(1, 'Türkçe', 'Okuma', 'Kelime anlamı', ['word-mine', 'meaning-hunt'], ['vocabulary']);
  add(1, 'Hayat Bilgisi', 'Okul', 'Kurallar', ['social-citizenship'], ['civic']);
  add(4, 'Matematik', 'Kesirler', 'Birim kesir', ['problem-hunter', 'error-detective'], ['multi-step']);
  add(4, 'Türkçe', 'Okuma', 'Ana düşünce', ['paragraph-detective', 'meaning-hunt'], ['inference']);
  add(4, 'Fen Bilimleri', 'Madde', 'Hal değişimi', ['science-lab', 'science-reasoning'], ['evidence']);
  add(4, 'Sosyal Bilgiler', 'Çevre', 'Yerleşim', ['social-map-skills'], ['spatial']);
  add(4, 'İngilizce', 'Vocabulary', 'Daily words', ['english-vocabulary'], ['lexical']);

  // 5–8
  add(6, 'Matematik', 'Oran', 'Oran-orantı', ['problem-hunter', 'lgs-foundation'], ['multi-step']);
  add(8, 'Matematik', 'Cebir', 'Doğrusal denklem', ['problem-hunter', 'lgs-foundation', 'olympiad-ladder'], ['algebraic']);
  add(8, 'Türkçe', 'Anlama', 'Çıkarım', ['paragraph-detective', 'lgs-foundation'], ['inference']);
  add(8, 'Fen Bilimleri', 'Kuvvet', 'Hareket', ['science-reasoning', 'lgs-foundation'], ['variable-control']);
  add(8, 'İngilizce', 'Pragmatics', 'Speech acts', ['english-sentence-builder', 'lgs-foundation'], ['pragmatic']);
  add(8, 'T.C. İnkılap Tarihi ve Atatürkçülük', 'Kurtuluş', 'Milli mücadele', ['social-time-travel'], ['historical']);
  add(8, 'Din Kültürü ve Ahlak Bilgisi', 'İbadet', 'Temel kavramlar', ['religion-practice'], ['conceptual']);

  // 9–12
  add(10, 'Matematik', 'Fonksiyonlar', 'Fonksiyon grafiği', ['problem-hunter', 'olympiad-ladder'], ['multi-step'], ['TYT']);
  add(10, 'Türk Dili ve Edebiyatı', 'Şiir', 'Şekil-anlam', ['paragraph-detective', 'meaning-hunt'], ['literary'], ['TYT']);
  add(10, 'Fizik', 'Hareket', 'Düzgün hareket', ['science-reasoning'], ['model'], ['TYT']);
  add(10, 'Kimya', 'Atom', 'Periyodik özellik', ['science-lab'], ['classification'], ['TYT']);
  add(10, 'Biyoloji', 'Hücre', 'Organel işlevi', ['science-lab'], ['systems'], ['TYT']);
  add(10, 'Tarih', 'Çağlar', 'İlkçağ', ['social-time-travel'], ['chronology']);
  add(10, 'Coğrafya', 'İklim', 'İklim elemanları', ['social-map-skills'], ['spatial']);
  add(10, 'Felsefe', 'Bilgi', 'Doğruluk', ['logic-station'], ['argument']);
  add(12, 'Matematik', 'TYT', 'Problem çözme', ['problem-hunter', 'olympiad-ladder'], ['multi-step'], ['TYT', 'AYT']);
  add(12, 'Türk Dili ve Edebiyatı', 'TYT', 'Paragraf', ['paragraph-detective'], ['inference'], ['TYT']);
  add(12, 'Fizik', 'AYT', 'Elektrik', ['science-reasoning'], ['multi-step'], ['AYT']);
  add(12, 'İngilizce', 'YDT', 'Reading', ['english-cloze', 'english-vocabulary'], ['reading'], ['YDT']);

  return seeds;
}

let _graph = null;

export function getCurriculumGraph() {
  if (_graph) return _graph;
  const skills = seedSkills();
  const byId = new Map(skills.map((s) => [s.curriculumSkillId, s]));
  const subjects = SUBJECT_CATALOG.map((s) => s.label);
  const grades = Array.from({ length: 12 }, (_, i) => i + 1);
  _graph = {
    version: CURRICULUM_GRAPH_VERSION,
    country: CURRICULUM_COUNTRY,
    curriculumVersion: CURRICULUM_VERSION_DEFAULT,
    subjects,
    subjectCatalog: SUBJECT_CATALOG,
    grades,
    skills,
    byId,
    skillCount: skills.length,
    subjectsCovered: new Set(skills.map((s) => s.subject)).size,
    gradesCovered: new Set(skills.map((s) => s.grade)).size
  };
  return _graph;
}

export function skillsForGradeSubject(grade, subject) {
  const g = Number(grade);
  const sub = String(subject || '');
  return getCurriculumGraph().skills.filter((s) => s.grade === g
    && (s.subject === sub || s.subjectId === slug(sub)));
}

export function skillsForGame(gameId) {
  return getCurriculumGraph().skills.filter((s) => (s.supportedGames || []).includes(gameId));
}

export function listCoverageCells() {
  const graph = getCurriculumGraph();
  const cells = [];
  for (const skill of graph.skills) {
    cells.push({
      grade: skill.grade,
      gradeBand: skill.gradeBand,
      subject: skill.subject,
      unit: skill.unit,
      topic: skill.topic,
      curriculumSkillId: skill.curriculumSkillId,
      supportedGames: skill.supportedGames,
      examGroups: skill.examGroups
    });
  }
  return cells;
}

export default getCurriculumGraph;
