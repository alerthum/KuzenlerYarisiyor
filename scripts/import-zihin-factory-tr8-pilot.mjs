import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  renderZihinFactoryPilotModule,
  ZIHIN_FACTORY_TR8_MODULE_PATH
} from '../js/assessment-v2/zihin-factory-pilot-module.js';

function argument(name, fallback = '') {
  const index = process.argv.indexOf(name);
  return index >= 0 ? String(process.argv[index + 1] || '') : fallback;
}

function repositoryPath(value, field) {
  const root = resolve(process.cwd());
  const target = resolve(root, value);
  const rel = relative(root, target);
  if (!rel || rel.startsWith('..') || rel.includes(':')) throw new Error(`${field}:outside-repository`);
  return target;
}

export function unwrapFactoryApprovedPackage(response) {
  if (response?.ok === false) {
    throw new Error(`factory-approved-package:${String(response.error || 'request-failed')}`);
  }
  const artifact = response?.package ?? response;
  if (!artifact || typeof artifact !== 'object') throw new Error('factory-approved-package:missing-package');
  return artifact;
}

export async function importPilotFile({ inputPath, outputPath = ZIHIN_FACTORY_TR8_MODULE_PATH } = {}) {
  if (!inputPath) throw new Error('input:required');
  const input = resolve(process.cwd(), inputPath);
  const output = repositoryPath(outputPath, 'output');
  const response = JSON.parse(await readFile(input, 'utf8'));
  const artifact = unwrapFactoryApprovedPackage(response);
  const moduleSource = renderZihinFactoryPilotModule(artifact);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, moduleSource, 'utf8');
  return Object.freeze({
    outputPath: relative(resolve(process.cwd()), output).replaceAll('\\', '/'),
    jobId: String(artifact.source?.jobId || ''),
    batchId: String(artifact.source?.batchId || ''),
    approvedQuestionCount: Array.isArray(artifact.questions) ? artifact.questions.length : 0
  });
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const result = await importPilotFile({
    inputPath: argument('--input'),
    outputPath: argument('--output', ZIHIN_FACTORY_TR8_MODULE_PATH)
  });
  process.stdout.write(`${JSON.stringify(result)}\n`);
}
