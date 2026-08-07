import { buildTrustedLiveRelease } from './build-trusted-live-release.mjs';
import { buildDist } from './project-config.mjs';

await buildTrustedLiveRelease();
const { config, dist } = await buildDist();
console.log(`Vercel paketi üretildi: ${dist}`);
console.log(`Uygulama: ${config.appName} • içerik sürümü ${config.contentVersion}`);
