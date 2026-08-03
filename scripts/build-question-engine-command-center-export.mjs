#!/usr/bin/env node
import {
  buildCommandCenterExport,
  EXPORT_PATH,
  formatSize
} from './lib/command-center-export.mjs';

const result = buildCommandCenterExport({ write: true });
console.log(JSON.stringify({
  ok: true,
  path: EXPORT_PATH,
  dataFreshness: result.meta.dataFreshness,
  sourceCount: result.meta.sourceCount,
  sectionCount: result.meta.sectionCount,
  exportSizeBytes: result.meta.exportSizeBytes,
  exportSize: formatSize(result.meta.exportSizeBytes),
  missingRequiredCount: result.meta.missingRequiredCount,
  runId: result.meta.runId
}, null, 2));
process.exit(result.meta.missingRequiredCount > 0 && result.meta.dataFreshness === 'PARTIAL' ? 0 : 0);
