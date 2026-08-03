import { buildDist } from './project-config.mjs';

const { config, dist } = await buildDist();
console.log(`Vercel paketi üretildi: ${dist}`);
console.log(`Uygulama: ${config.appName} • içerik sürümü ${config.contentVersion}`);
