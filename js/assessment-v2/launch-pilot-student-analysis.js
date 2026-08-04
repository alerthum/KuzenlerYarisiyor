import { analyzeStudentPilot } from './item-analysis-engine.js';
import { auditStudentPilotResponses } from './student-pilot-contract.js';
import { ASSESSMENT_V2_LAUNCH_PILOT_MANIFEST, launchPilotItemDescriptors } from './launch-pilot-manifest.js';

const freeze = (value) => {
  if (Array.isArray(value)) return Object.freeze(value.map(freeze));
  if (value && typeof value === 'object') return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, child]) => [key, freeze(child)])));
  return value;
};

export function auditLaunchPilotStudentResponses(rows = [], manifest = ASSESSMENT_V2_LAUNCH_PILOT_MANIFEST) {
  const base = auditStudentPilotResponses(rows);
  const errors = [...base.errors];
  const descriptors = new Map(manifest.items.map((item) => [item.itemId, item]));
  const participantItemPairs = [];
  for (const row of base.rows) {
    const descriptor = descriptors.get(row.itemId);
    if (!descriptor) {
      errors.push(`unexpected-item:${row.itemId}`);
      continue;
    }
    if (row.pilotId !== manifest.pilotId) errors.push(`pilot-mismatch:${row.responseId}`);
    if (row.datasetSource !== manifest.datasetSourceRequired) errors.push(`dataset-source:${row.responseId}`);
    if (row.gameId !== descriptor.gameId) errors.push(`game-mismatch:${row.responseId}`);
    if (row.grade !== descriptor.grade) errors.push(`grade-mismatch:${row.responseId}`);
    if (row.responseMode !== descriptor.responseMode) errors.push(`response-mode-mismatch:${row.responseId}`);
    participantItemPairs.push(`${row.participantAnonId}:${row.itemId}`);
  }
  if (new Set(participantItemPairs).size !== participantItemPairs.length) errors.push('duplicate-participant-item-response');
  const participantCounts = new Map();
  for (const row of base.rows) participantCounts.set(row.participantAnonId, (participantCounts.get(row.participantAnonId) || 0) + 1);
  for (const [participantId, count] of participantCounts) {
    if (count > manifest.sampling.itemsPerParticipant) errors.push(`participant-over-assigned:${participantId}:${count}`);
  }
  const itemCounts = Object.fromEntries(manifest.items.map((item) => [item.itemId, base.rows.filter((row) => row.itemId === item.itemId).length]));
  return freeze({
    ok: errors.length === 0,
    errors: [...new Set(errors)],
    rows: base.rows,
    metrics: {
      responseCount: base.rows.length,
      participantCount: participantCounts.size,
      itemCountWithResponses: Object.values(itemCounts).filter((count) => count > 0).length,
      participantResponseCountMin: participantCounts.size ? Math.min(...participantCounts.values()) : 0,
      participantResponseCountMax: participantCounts.size ? Math.max(...participantCounts.values()) : 0,
      itemResponseCountMin: Math.min(...Object.values(itemCounts)),
      itemResponseCountMax: Math.max(...Object.values(itemCounts))
    },
    itemCounts
  });
}

export function analyzeLaunchPilotStudentResponses({
  rows = [],
  manifest = ASSESSMENT_V2_LAUNCH_PILOT_MANIFEST,
  thresholds
} = {}) {
  const protocolAudit = auditLaunchPilotStudentResponses(rows, manifest);
  const analysis = analyzeStudentPilot({
    pilotId: manifest.pilotId,
    responses: protocolAudit.rows,
    itemDescriptors: launchPilotItemDescriptors(),
    thresholds
  });
  const errors = [...new Set([...protocolAudit.errors, ...analysis.errors])];
  return freeze({
    ...analysis,
    status: errors.length ? 'INVALID_DATA' : analysis.status,
    protocolAudit,
    errors
  });
}
