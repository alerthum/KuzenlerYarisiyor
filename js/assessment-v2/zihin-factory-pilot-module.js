import { importZihinFactoryPilotPackage } from './zihin-factory-pilot-import.js';

export const ZIHIN_FACTORY_TR8_MODULE_PATH = 'js/assessment-v2/zihin-factory-approved-tr8-pilot.js';

function safeJson(value) {
  return JSON.stringify(value, null, 2)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export function renderZihinFactoryPilotModule(packageArtifact) {
  const imported = importZihinFactoryPilotPackage(packageArtifact);
  if (!imported.rounds.length) throw new Error('factory-pilot-module:empty-import');
  const source = {
    ...imported.source,
    exportedAt: String(packageArtifact.exportedAt || '')
  };
  const serialized = safeJson(packageArtifact);

  return `/**
 * GENERATED FILE — Zihin Factory approved TR8 paragraph pilot.
 * Source job: ${source.jobId}
 * Batch: ${source.batchId}
 * Factory: ${source.factoryVersion}
 *
 * Do not hand-edit question content. The committed package is revalidated at
 * module load and becomes live only through this file's explicit draft PR.
 */
import { importZihinFactoryPilotPackage } from './zihin-factory-pilot-import.js';

const FACTORY_PACKAGE = ${serialized};
const IMPORTED_PILOT = importZihinFactoryPilotPackage(FACTORY_PACKAGE);

export const ZIHIN_FACTORY_APPROVED_TR8_SOURCE = Object.freeze(${safeJson(source)});
export const ZIHIN_FACTORY_APPROVED_TR8_ROUNDS = IMPORTED_PILOT.rounds;
export const ZIHIN_FACTORY_APPROVED_TR8_KEYS = Object.freeze(
  IMPORTED_PILOT.rounds.map((round) => round.questionKey)
);
`;
}

