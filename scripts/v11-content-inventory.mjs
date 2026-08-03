import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const JS_DIR = path.join(ROOT, 'js');
const OUT_DIR = path.join(ROOT, 'quality-reports');
fs.mkdirSync(OUT_DIR, { recursive: true });

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function rel(file) { return path.relative(ROOT, file).replaceAll('\\', '/'); }
function count(re, text) { return [...text.matchAll(re)].length; }
function uniq(values) { return [...new Set(values.filter(Boolean))]; }

const files = walk(JS_DIR).filter((f) => f.endsWith('.js'));
const records = [];

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const exports = uniq([...text.matchAll(/export\s+(?:const|function|class)\s+([A-Za-z0-9_]+)/g)].map((m) => m[1]));
  const familyIds = uniq([...text.matchAll(/familyId\s*:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]));
  const factoryIds = uniq([...text.matchAll(/\bid\s*:\s*['"]([^'"]+)['"]\s*,\s*(?:minGrade|minAge)/g)].map((m) => m[1]));
  const questionObjects = count(/\b(?:prompt|question)\s*:\s*['"`]/g, text);
  const optionSets = count(/\boptions\s*:\s*\[/g, text);
  const answerFields = count(/\b(?:answer|answerValue|correctAnswer)\s*:/g, text);
  const generatorFunctions = count(/\b(?:create|generate|buildRound|createRound)\s*\(/g, text);
  const contentSignals = questionObjects + optionSets + answerFields + familyIds.length + factoryIds.length + generatorFunctions;
  if (!contentSignals) continue;

  let sourceType = 'support';
  if (factoryIds.length || familyIds.length || generatorFunctions) sourceType = 'dynamic-generator';
  if (questionObjects && optionSets && answerFields) sourceType = sourceType === 'dynamic-generator' ? 'mixed' : 'static-pool';

  records.push({
    sourceFile: rel(file),
    sourceType,
    exports,
    familyIds,
    factoryIds,
    questionObjectSignals: questionObjects,
    optionSetSignals: optionSets,
    answerFieldSignals: answerFields,
    generatorFunctionSignals: generatorFunctions,
    requiresDetailedAudit: /paragraph|content|premium|exam|logic|social/i.test(file)
  });
}

const totals = {
  sourceFiles: records.length,
  staticPoolFiles: records.filter((r) => r.sourceType === 'static-pool').length,
  dynamicGeneratorFiles: records.filter((r) => r.sourceType === 'dynamic-generator').length,
  mixedFiles: records.filter((r) => r.sourceType === 'mixed').length,
  detectedFamilyIds: uniq(records.flatMap((r) => [...r.familyIds, ...r.factoryIds])).length,
  questionObjectSignals: records.reduce((s, r) => s + r.questionObjectSignals, 0),
  optionSetSignals: records.reduce((s, r) => s + r.optionSetSignals, 0),
  answerFieldSignals: records.reduce((s, r) => s + r.answerFieldSignals, 0)
};

const report = {
  schemaVersion: '11.0.0-stage2',
  generatedAt: new Date().toISOString(),
  note: 'Sayılar statik kaynak kod sinyalleridir; dinamik üreticilerin üretebileceği toplam soru sayısı değildir.',
  totals,
  records
};

fs.writeFileSync(path.join(OUT_DIR, 'V11_CONTENT_INVENTORY.json'), JSON.stringify(report, null, 2));
console.log(`V11 Content Inventory: ${totals.sourceFiles} kaynak • ${totals.detectedFamilyIds} aile/üretici kimliği • ${totals.questionObjectSignals} soru sinyali`);
