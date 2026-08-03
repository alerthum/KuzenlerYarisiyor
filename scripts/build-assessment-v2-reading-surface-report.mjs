import fs from 'node:fs';
import path from 'node:path';
import { ALL_PHASE3_READING_MODELS } from '../js/assessment-v2/reading-model-catalog.js';
import { auditReadingSurfaceModels } from '../js/assessment-v2/reading-surface-quality.js';

const audit = auditReadingSurfaceModels(ALL_PHASE3_READING_MODELS);
const report = {
  schemaVersion: '2.0',
  generatedAt: new Date().toISOString(),
  phase: 'PHASE_3R_NATURAL_SURFACE_REMEDIATION',
  productReady: false,
  previousReviewDisposition: 'REJECTED_AI_TEMPLATE_FAILURE',
  benchmarkPolicy: 'STRUCTURAL_BENCHMARK_ONLY_DO_NOT_COPY_SOURCE_TEXT',
  result: audit.ok ? 'PASS' : 'FAIL',
  metrics: audit.metrics,
  errors: audit.errors,
  samples: audit.samples
};
const out = path.join(process.cwd(), 'quality-reports', 'assessment-engine-v2-reading-surface-quality.json');
fs.writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
console.log(`reading surface quality: ${report.result}; file=${out}`);
if (!audit.ok) process.exitCode = 1;
