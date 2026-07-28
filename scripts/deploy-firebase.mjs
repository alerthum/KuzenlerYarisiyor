import { spawn } from 'node:child_process';
import { loadProjectConfig, projectRoot } from './project-config.mjs';

const config = await loadProjectConfig();
if (!config.firebase.projectId) {
  throw new Error('KUZENLER_AYARLARI.env içinde FIREBASE_PROJECT_ID zorunludur.');
}

const command = process.platform === 'win32' ? 'firebase.cmd' : 'firebase';
const args = [
  'deploy',
  '--project', config.firebase.projectId,
  '--config', 'firebase/firebase.json',
  '--only', 'firestore:rules,firestore:indexes'
];

console.log(`Firebase kuralları yayınlanıyor: ${config.firebase.projectId}`);
const child = spawn(command, args, {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: process.platform === 'win32'
});
child.on('error', () => {
  console.error('Firebase CLI bulunamadı. Önce: npm install -g firebase-tools');
  process.exitCode = 1;
});
child.on('exit', (code) => { process.exitCode = code ?? 1; });
