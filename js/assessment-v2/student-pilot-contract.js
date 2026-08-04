const DATASET_SOURCES = new Set(['SIMULATED_FIXTURE', 'REAL_STUDENT_PILOT']);
const RESPONSE_MODES = new Set(['CHOICE', 'RUBRIC', 'MATCHING', 'INTERACTION']);
const PII_KEYS = new Set(['name','fullName','email','phone','address','tcKimlik','nationalId','birthDate']);

function requiredText(value, field) {
  const output = String(value ?? '').trim();
  if (!output) throw new Error(`${field}:required`);
  return output;
}
function finite(value, field, min = -Infinity, max = Infinity) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) throw new Error(`${field}:invalid`);
  return number;
}
function findPii(value, path = '') {
  if (!value || typeof value !== 'object') return [];
  const errors = [];
  for (const [key, child] of Object.entries(value)) {
    const next = path ? `${path}.${key}` : key;
    if (PII_KEYS.has(key)) errors.push(`pii-forbidden:${next}`);
    errors.push(...findPii(child, next));
  }
  return errors;
}

export function defineStudentPilotResponse(input = {}) {
  const pii = findPii(input);
  if (pii.length) throw new Error(pii.join(','));
  const datasetSource = requiredText(input.datasetSource, 'datasetSource');
  if (!DATASET_SOURCES.has(datasetSource)) throw new Error('datasetSource:unsupported');
  const participantAnonId = requiredText(input.participantAnonId, 'participantAnonId');
  if (!/^anon_[a-z0-9_-]{8,80}$/i.test(participantAnonId)) throw new Error('participantAnonId:not-anonymous');
  const responseMode = String(input.responseMode || 'CHOICE').trim().toUpperCase();
  if (!RESPONSE_MODES.has(responseMode)) throw new Error('responseMode:unsupported');
  const omitted = input.omitted === true;
  const selectedOptionId = omitted
    ? null
    : (responseMode === 'CHOICE' ? requiredText(input.selectedOptionId, 'selectedOptionId') : (String(input.selectedOptionId ?? '').trim() || null));
  const startedAt = requiredText(input.startedAt, 'startedAt');
  const submittedAt = requiredText(input.submittedAt, 'submittedAt');
  if (!Number.isFinite(Date.parse(startedAt)) || !Number.isFinite(Date.parse(submittedAt))) throw new Error('timestamp:invalid');
  const responseTimeMs = finite(input.responseTimeMs, 'responseTimeMs', 0, 3_600_000);
  const hintsUsed = finite(input.hintsUsed ?? 0, 'hintsUsed', 0, 20);
  const score = finite(input.score ?? 0, 'score', 0, 1000);
  const maxScore = finite(input.maxScore ?? 1, 'maxScore', 0.000001, 1000);
  return Object.freeze({
    schemaVersion: '1.0',
    responseId: requiredText(input.responseId, 'responseId'),
    pilotId: requiredText(input.pilotId, 'pilotId'),
    datasetSource,
    participantAnonId,
    itemId: requiredText(input.itemId, 'itemId'),
    gameId: requiredText(input.gameId, 'gameId'),
    grade: Math.trunc(finite(input.grade, 'grade', 1, 12)),
    responseMode,
    selectedOptionId,
    omitted,
    score,
    maxScore,
    responseTimeMs,
    hintsUsed,
    attemptNumber: Math.trunc(finite(input.attemptNumber ?? 1, 'attemptNumber', 1, 20)),
    startedAt,
    submittedAt
  });
}

export function auditStudentPilotResponses(rows = []) {
  const errors = [];
  const normalized = [];
  for (let index = 0; index < rows.length; index += 1) {
    try { normalized.push(defineStudentPilotResponse(rows[index])); }
    catch (error) { errors.push(`${index}:${error.message}`); }
  }
  if (new Set(normalized.map(row => row.responseId)).size !== normalized.length) errors.push('duplicate-response-id');
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors), rows: Object.freeze(normalized) });
}
