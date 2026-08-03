import { RUNTIME_CONFIG } from './runtime-config.js';

const root = document.querySelector('#app');
const isLive = RUNTIME_CONFIG.mode === 'vercel';

function renderConfigurationError(reasons) {
  root.innerHTML = `
    <main class="platform-shell auth-shell">
      <section class="auth-card setup-error">
        <div class="auth-logo">⚙️</div>
        <span class="badge orange">Canlı yayın güvenlik kilidi</span>
        <h1>Firebase ayarları tamamlanmadan canlı uygulama açılmaz.</h1>
        <p>V5, Vercel modunda anonim veya yalnız tarayıcıya bağlı kullanıma izin vermez.</p>
        <ul>${reasons.map((reason) => `<li>${reason}</li>`).join('')}</ul>
        <div class="config-path">KUZENLER_AYARLARI.env</div>
        <p class="muted">Ayarları doldurduktan sonra <code>npm run check</code> ve ardından yeniden deploy çalıştırın.</p>
      </section>
    </main>`;
}

if (!isLive) {
  window.__KUZENLER_PLATFORM__ = { mode: 'local', role: 'local', user: null, learnerId: null, adultPreview: false };
  await import('./app.js');
} else {
  const missing = [];
  if (RUNTIME_CONFIG.dataProvider !== 'firebase') missing.push('DATA_PROVIDER=firebase olmalıdır.');
  if (!RUNTIME_CONFIG.firebase?.enabled) missing.push('FIREBASE_ENABLED=true olmalıdır.');
  for (const [field, label] of [['apiKey','FIREBASE_API_KEY'],['authDomain','FIREBASE_AUTH_DOMAIN'],['projectId','FIREBASE_PROJECT_ID'],['appId','FIREBASE_APP_ID']]) {
    if (!RUNTIME_CONFIG.firebase?.[field]) missing.push(`${label} doldurulmalıdır.`);
  }
  if (missing.length) renderConfigurationError(missing);
  else {
    const { startFirebasePlatform } = await import('./platform/firebase-platform.js');
    await startFirebasePlatform(RUNTIME_CONFIG);
  }
}
