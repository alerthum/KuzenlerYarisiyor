import fs from 'node:fs';

const required = [
  'js/engines/v11-misconception-profile.js',
  'tests/v11-stage5-misconception-persistence.test.mjs'
];
const errors = required.filter(file => !fs.existsSync(file)).map(file => `Eksik dosya: ${file}`);
const state = fs.readFileSync('js/state.js','utf8');
const app = fs.readFileSync('js/app.js','utf8');
const registry = fs.readFileSync('js/games/registry.js','utf8');

for (const [label, source, token] of [
  ['state', state, 'misconceptionProfiles'],
  ['state', state, 'updateV11MisconceptionProfile'],
  ['app', app, 'diagnoseV11ChoiceResponse'],
  ['app', app, 'misconceptionId'],
  ['registry', registry, 'optionDiagnostics'],
  ['registry', registry, 'evidenceMap']
]) {
  if (!source.includes(token)) errors.push(`${label}: ${token} entegrasyonu bulunamadı.`);
}

if (errors.length) {
  console.error(`V11 Misconception Persistence Audit: ${errors.length} hata`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('V11 Misconception Persistence Audit: cevap tanısı • kalıcı attempt • öğrenci yanılgı profili • 0 hata');
