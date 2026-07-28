import { spawn } from 'node:child_process';
import { loadProjectConfig, validateProjectConfig, projectRoot } from './project-config.mjs';

const config = await loadProjectConfig();
const errors = validateProjectConfig(config);
if (errors.length) throw new Error(`Canlı yapılandırma hatası:\n- ${errors.join('\n- ')}`);
if (config.mode !== 'vercel') throw new Error('KUZENLER_AYARLARI.env içinde CALISMA_MODU=canli olmadan yayın başlatılmaz.');

const command = process.platform === 'win32' ? 'vercel.cmd' : 'vercel';
const env = { ...process.env };
if (config.vercel.teamId) env.VERCEL_ORG_ID = config.vercel.teamId;
if (config.vercel.projectId) env.VERCEL_PROJECT_ID = config.vercel.projectId;

console.log(`Vercel üretim yayını başlatılıyor: ${config.vercel.projectName}`);
const child = spawn(command, ['--prod'], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env
});
child.on('error', () => {
  console.error('Vercel CLI bulunamadı. Önce: npm install -g vercel ve vercel login');
  process.exitCode = 1;
});
child.on('exit', (code) => { process.exitCode = code ?? 1; });
