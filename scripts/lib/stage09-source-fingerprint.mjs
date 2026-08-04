import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const EXTRA_FILES = Object.freeze([
  'package.json',
  'scripts/stage09-game-battery-worker.mjs',
  'scripts/run-stage09-sharded-battery.mjs',
  'scripts/lib/stage09-source-fingerprint.mjs'
]);

function collectFiles(directory, suffix = '.js') {
  const rows = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) rows.push(...collectFiles(full, suffix));
    else if (entry.isFile() && entry.name.endsWith(suffix)) rows.push(full);
  }
  return rows;
}

export function buildStage09SourceFingerprint(rootDir = process.cwd()) {
  const absoluteRoot = path.resolve(rootDir);
  const files = [
    ...collectFiles(path.join(absoluteRoot, 'js')),
    ...EXTRA_FILES.map((file) => path.join(absoluteRoot, file))
  ]
    .filter((file, index, all) => fs.existsSync(file) && all.indexOf(file) === index)
    .sort((a, b) => a.localeCompare(b));

  const hash = crypto.createHash('sha256');
  for (const file of files) {
    const relative = path.relative(absoluteRoot, file).replaceAll(path.sep, '/');
    hash.update(relative);
    hash.update('\0');
    hash.update(fs.readFileSync(file));
    hash.update('\0');
  }

  return Object.freeze({
    algorithm: 'sha256',
    fingerprint: hash.digest('hex'),
    fileCount: files.length,
    files: Object.freeze(files.map((file) => path.relative(absoluteRoot, file).replaceAll(path.sep, '/')))
  });
}
