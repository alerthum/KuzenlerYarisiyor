import { assertAuthoritativeSource } from './curriculum-source-registry.js';
import { curriculumRouteForGrade } from './curriculum-rollout-2026-2027.js';

const INGESTION_STATUSES = new Set(['NOT_STARTED', 'PARTIAL', 'COMPLETE', 'BLOCKED']);

function required(value, field, id = 'curriculum-record') {
  const output = String(value ?? '').trim();
  if (!output) throw new Error(`${id}: ${field} is required`);
  return output;
}

export function defineCurriculumOutcome(input = {}) {
  const id = required(input.id, 'id');
  const grade = Number(input.grade);
  if (!Number.isInteger(grade) || grade < 1 || grade > 12) throw new Error(`${id}: grade must be 1-12`);
  const route = curriculumRouteForGrade(grade);
  const source = assertAuthoritativeSource(input.sourceId);
  if (source.id !== route.sourceId) throw new Error(`${id}: source ${source.id} does not match active grade ${grade} route ${route.sourceId}`);
  return Object.freeze({
    id,
    schoolYear: route.schoolYear,
    programFamily: route.programFamily,
    grade,
    schoolType: required(input.schoolType || 'GENEL', 'schoolType', id),
    courseId: required(input.courseId, 'courseId', id),
    courseName: required(input.courseName, 'courseName', id),
    unitId: required(input.unitId, 'unitId', id),
    unitName: required(input.unitName, 'unitName', id),
    topicId: required(input.topicId, 'topicId', id),
    topicName: required(input.topicName, 'topicName', id),
    officialOutcomeCode: String(input.officialOutcomeCode ?? '').trim() || null,
    officialOutcomeText: required(input.officialOutcomeText, 'officialOutcomeText', id),
    officialGuidanceNotes: Object.freeze([...(input.officialGuidanceNotes || [])].map(note => required(note, 'officialGuidanceNotes[]', id))),
    sourceId: source.id,
    sourceLocator: required(input.sourceLocator, 'sourceLocator', id),
    contentFramework: Object.freeze([...(input.contentFramework || [])]),
    fieldSkills: Object.freeze([...(input.fieldSkills || [])]),
    conceptualSkills: Object.freeze([...(input.conceptualSkills || [])]),
    literacySkills: Object.freeze([...(input.literacySkills || [])]),
    assessmentEvidenceTypes: Object.freeze([...(input.assessmentEvidenceTypes || [])]),
    verificationStatus: 'SOURCE_VERIFIED'
  });
}

export function defineIngestionStatus(input = {}) {
  const id = required(input.id, 'id');
  const status = required(input.status, 'status', id);
  if (!INGESTION_STATUSES.has(status)) throw new Error(`${id}: unsupported status ${status}`);
  return Object.freeze({
    id,
    schoolYear: required(input.schoolYear, 'schoolYear', id),
    grade: Number(input.grade),
    courseId: required(input.courseId, 'courseId', id),
    status,
    sourceId: required(input.sourceId, 'sourceId', id),
    outcomeCount: Number(input.outcomeCount || 0),
    lastVerifiedAt: input.lastVerifiedAt || null,
    blockers: Object.freeze([...(input.blockers || [])])
  });
}
