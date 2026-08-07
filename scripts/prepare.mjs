import { buildTrustedLiveRelease } from './build-trusted-live-release.mjs';
import { loadProjectConfig, writeRuntimeConfig, validateProjectConfig } from './project-config.mjs';

const config = await loadProjectConfig();
const errors = validateProjectConfig(config);
if (errors.length) throw new Error(`Yapılandırma hatası:\n- ${errors.join('\n- ')}`);
await writeRuntimeConfig(config);
await buildTrustedLiveRelease();
console.log(`Ayarlar hazır: ${config.appName} • mod=${config.mode} • veri=${config.dataProvider}`);
