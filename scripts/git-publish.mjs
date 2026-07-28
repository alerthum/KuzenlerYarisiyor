import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadProjectConfig, projectRoot } from './project-config.mjs';

const config = await loadProjectConfig();
const remote = config.git.repositoryUrl;
const branch = config.git.defaultBranch;
if (!remote) throw new Error('KUZENLER_AYARLARI.env içinde GIT_REPOSITORY_URL doldurulmalıdır.');

function git(args, { allowFailure = false, quiet = false } = {}) {
  const result = spawnSync('git', args, {
    cwd: projectRoot,
    stdio: quiet ? 'ignore' : 'inherit',
    shell: false
  });
  if (!allowFailure && result.status !== 0) process.exit(result.status ?? 1);
  return result.status === 0;
}

if (!existsSync(join(projectRoot, '.git'))) git(['init']);
if (config.git.userName) git(['config', 'user.name', config.git.userName]);
if (config.git.userEmail) git(['config', 'user.email', config.git.userEmail]);

git(['branch', '-M', branch]);
const hasOrigin = git(['remote', 'get-url', 'origin'], { allowFailure: true, quiet: true });
git(hasOrigin ? ['remote', 'set-url', 'origin', remote] : ['remote', 'add', 'origin', remote]);

git(['add', '.']);
const committed = git(['commit', '-m', 'Kuzenler Yarışıyor v5.0.2 Windows uyumluluk düzeltmesi'], { allowFailure: true });
if (!committed) console.log('Yeni commit oluşturulmadı; değişiklik yoksa bu normaldir.');

// GitHub deposu daha önce README ile oluşturulduysa geçmişleri güvenli şekilde birleştirir.
const fetched = git(['fetch', 'origin', branch], { allowFailure: true });
if (fetched) {
  const remoteBranchExists = git(['rev-parse', '--verify', `origin/${branch}`], { allowFailure: true, quiet: true });
  if (remoteBranchExists) {
    const merged = git([
      'merge', `origin/${branch}`, '--allow-unrelated-histories', '-X', 'ours', '--no-edit'
    ], { allowFailure: true });
    if (!merged) {
      git(['merge', '--abort'], { allowFailure: true, quiet: true });
      throw new Error('GitHub geçmişi otomatik birleştirilemedi. README dışında dosya varsa önce yedekleyin.');
    }
  }
}

git(['push', '-u', 'origin', branch]);
console.log(`GitHub yayını tamamlandı: ${remote}`);
