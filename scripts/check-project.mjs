import { access, readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const root = fileURLToPath(new URL('../', import.meta.url));
const required = [
  'KUZENLER_AYARLARI.env', 'index.html', 'styles.css', 'server.mjs', 'sw.js', 'manifest.webmanifest', 'vercel.json',
  'js/bootstrap.js', 'js/app.js', 'js/content.js', 'js/content-v2.js', 'js/content-v3.js', 'js/content-v4.js', 'js/runtime-config.js',
  'js/state.js', 'js/storage.js', 'js/engines/word-engine.js', 'js/engines/math-engine.js',
  'js/engines/logic-engine.js', 'js/engines/learning-engine-v4.js', 'js/content-quality-v5.js', 'js/platform/firebase-platform.js', 'js/engines/paragraph-engine-v4.js', 'js/engines/social-engine.js',
  'js/engines/adaptive-engine.js', 'js/games/registry.js', 'scripts/project-config.mjs',
  'icons/icon-192.png', 'icons/icon-512.png', 'README.md', 'GELISIM_PLANI.md', 'DEPLOY_REHBERI.md',
  'ICERIK_KALITE_KURALLARI.md', 'SORU_KALITE_KAYITLARI.md', 'TEST_RAPORU.md', 'firebase/firestore.rules', 'firebase/firestore.indexes.json', 'firebase/firebase.json'
];

for (const file of required) await access(resolve(root, file));
const html = await readFile(resolve(root, 'index.html'), 'utf8');
if (!html.includes('lang="tr"') || !html.includes('/js/bootstrap.js')) throw new Error('index.html temel bağlantıları eksik.');
const manifest = JSON.parse(await readFile(resolve(root, 'manifest.webmanifest'), 'utf8'));
if (manifest.name !== 'Zihin Arenası') throw new Error(`Manifest adı yanlış: ${manifest.name}`);
const app = await readFile(resolve(root, 'js/app.js'), 'utf8');
if (!app.includes('isGameAvailableForProfile')) throw new Error('Profil-sınıf görünürlük kontrolü uygulamaya bağlanmamış.');
const engine = await readFile(resolve(root, 'js/engines/learning-engine-v4.js'), 'utf8');
const quality = await readFile(resolve(root, 'js/content-quality-v5.js'), 'utf8');
for (const family of ['path-through-checkpoint','book-owner-matching','subset-target','digit-reversal-difference']) {
  if (!quality.includes(`'${family}'`)) throw new Error(`Karantina kaydı eksik: ${family}`);
}
for (const banned of ['4’ten büyük, 8’den küçüktür', 'harfler 2–1–4–3']) {
  if (engine.includes(banned)) throw new Error(`Yasaklanan düşük değerli örnek V4 motorunda bulundu: ${banned}`);
}
const jsFiles = (await readdir(resolve(root, 'js'), { recursive: true })).filter((file) => file.endsWith('.js'));
for (const file of jsFiles) await execFileAsync(process.execPath, ['--check', resolve(root, 'js', file)]);
for (const file of ['server.mjs', ...((await readdir(resolve(root, 'scripts'))).filter((name) => name.endsWith('.mjs')).map((name) => `scripts/${name}`))]) {
  await execFileAsync(process.execPath, ['--check', resolve(root, file)]);
}
console.log(`Proje kontrolü başarılı: ${required.length} zorunlu dosya, ${jsFiles.length} JavaScript modülü ve sunucu betikleri.`);
