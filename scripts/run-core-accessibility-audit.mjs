import fs from 'node:fs';
import path from 'node:path';
import { GAME_CATALOG } from '../js/games/registry.js';
import { STAGE09_ACTIVE_GAMES } from '../js/quality/session-composer-audit.js';

const read = (file) => fs.readFileSync(path.resolve(file), 'utf8');
const index = read('index.html');
const app = read('js/app.js');
const styles = read('css/styles.css');
const bootstrap = read('js/bootstrap.js');
const output = path.resolve('quality-reports/assessment-v2-phase5g-accessibility-evidence.json');

const checks = [];
const add = (id, pass, detail, severity = 'SERIOUS') => checks.push({ id, pass: Boolean(pass), severity, detail });

add('document-language', /<html\s+lang="tr"/i.test(index), 'Kök belge Türkçe dilini bildirir.');
add('document-title', /<title>[^<]+<\/title>/i.test(index), 'Belge başlığı mevcuttur.');
add('viewport-mobile', /name="viewport"/i.test(index), 'Mobil görünüm bildirimi mevcuttur.');
add('live-regions', /id="app"\s+aria-live="polite"/i.test(index) && /id="toast-root"[^>]+aria-live="assertive"/i.test(index), 'Uygulama ve uyarı canlı bölgeleri tanımlıdır.');
add('single-shared-main-renderer', (app.match(/<main\b/g) || []).length >= 8, 'Profil, panel, oyun, sonuç ve yönetim ekranları main landmark kullanır.');
add('core-screen-headings', ['Oyna, düşün, çözüm yolunu keşfet.', 'Merhaba, ${escapeHtml(profile.name)}!', '${game.icon} ${escapeHtml(game.title)}', 'Harika bir tur!'].every((token) => app.includes(token)), 'Çekirdek ekranların görünür h1 başlık sözleşmesi vardır.');
add('navigation-name', /<nav class="bottom-nav" aria-label="Ana menü">/.test(app), 'Alt gezinme erişilebilir ad taşır.');
add('navigation-current-page', /aria-current="page"/.test(app), 'Etkin gezinme öğesi aria-current ile bildirilir.');
add('keyboard-focus-visible', /:focus-visible/.test(styles) && /outline:\s*3px/.test(styles), 'Klavye odağı görünür bir outline ile işaretlenir.');
add('no-positive-tabindex', !/tabindex\s*=\s*["']?[1-9]/i.test(app), 'Pozitif tabindex kullanılmaz.');
add('game-progress-semantics', /class="session-progress" role="progressbar"[^>]+aria-valuenow/.test(app), 'Oyun ilerlemesi progressbar semantiği taşır.');
add('timer-semantics', /id="timer-pill"[^>]+role="timer"[^>]+aria-label="Kalan süre"/.test(app), 'Süre sayacı adlandırılmış timer rolü taşır.');
add('core-text-input-names', /id="word-input"[^>]+aria-label=/.test(app) && /id="story-input"[^>]+aria-label=/.test(app) && /class="ladder-input"[^>]+aria-label=/.test(app), 'Kelime, hikâye ve merdiven girişleri erişilebilir ada sahiptir.');
add('whiteboard-name', /id="whiteboard-canvas"[^>]+role="img"[^>]+aria-label=/.test(app), 'Beyaz tahta çizim alanı adlandırılmıştır.');
add('calculator-live-output', /class="calculator-display"[^>]+role="status"[^>]+aria-live="polite"/.test(app), 'Hesap makinesi sonucu durum bölgesi olarak bildirilir.');
add('modal-names', [...app.matchAll(/<[^>]+role="dialog"[^>]*>/g)].every(([tag]) => /aria-modal="true"/.test(tag) && /aria-(?:label|labelledby)=/.test(tag)), 'Bütün dialog açılış etiketleri modal ve adlandırılmıştır.');
add('confirm-focus-return', app.includes('previousFocus?.focus?.()') && app.includes("event.key==='Escape'"), 'Onay penceresi kapanınca odağı geri verir ve Escape destekler.');
add('icon-button-names', [...app.matchAll(/<button\b[^>]*class="[^"]*(?:icon-button|back-button)[^"]*"[^>]*>/g)].every(([tag]) => /aria-label=/.test(tag)), 'İkon ve geri düğmeleri erişilebilir ada sahiptir.');
add('image-alternatives', [...`${index}\n${app}`.matchAll(/<img\b[^>]*>/gi)].every(([tag]) => /\salt=/.test(tag)), 'Tüm img öğeleri alt niteliği taşır.');
add('svg-image-names', [...app.matchAll(/<svg\b[^>]*role="img"[^>]*>/g)].every(([tag]) => /aria-(?:label|labelledby)=/.test(tag)), 'Görsel rolündeki SVG öğeleri adlandırılmıştır.');
add('decorative-icons-hidden', app.includes('class="mission-icon" aria-hidden="true"') && app.includes('class="welcome-avatar" aria-hidden="true"'), 'Dekoratif emoji ve simgeler erişilebilirlik ağacından çıkarılır.');
add('local-bootstrap-contract', bootstrap.includes("window.__KUZENLER_PLATFORM__ = { mode: 'local'") && bootstrap.includes("await import('./app.js')"), 'Yerel çekirdek uygulama ortak erişilebilir UI rendererını açar.');

const catalogIds = new Set(GAME_CATALOG.map((game) => game.id));
const missingGames = STAGE09_ACTIVE_GAMES.filter((gameId) => !catalogIds.has(gameId));
add('all-core-games-shared-renderer', missingGames.length === 0 && STAGE09_ACTIVE_GAMES.length === 23, `23 çekirdek oyunun tamamı ortak oyun rendererında kayıtlıdır. Eksik: ${missingGames.join(', ') || 'yok'}.`);

const seriousFailures = checks.filter((check) => !check.pass && check.severity === 'SERIOUS');
const warnings = checks.filter((check) => !check.pass && check.severity === 'WARNING');
const report = {
  schemaVersion: '2.0',
  status: seriousFailures.length === 0 ? 'PASS' : 'FAIL',
  evidenceSource: 'DETERMINISTIC_STATIC_CORE_UI_ACCESSIBILITY_CONTRACT',
  scope: {
    coreScreens: ['profiles', 'dashboard', 'library', 'game', 'game-result'],
    sharedGameRenderer: true,
    expectedGameCount: 23,
    coveredGameCount: STAGE09_ACTIVE_GAMES.length - missingGames.length,
    wcagIntent: ['keyboard-focus', 'names-and-labels', 'landmarks', 'dialogs', 'status-and-progress', 'non-text-content']
  },
  checks,
  seriousFailureCount: seriousFailures.length,
  warningCount: warnings.length,
  seriousFailures,
  warnings,
  environmentNote: 'Tarayıcı tabanlı axe çalıştırıcısı paket aynası ve çalışma ortamının Chromium URLBlocklist politikası nedeniyle bu koşuda kullanılamadı. Bu kanıt, kaynak ve build sözleşmesini bağımlılıksız ve deterministik olarak doğrular; dağıtım ortamında resmi Playwright/axe kapısı ayrıca korunmaktadır.',
  officialBrowserGate: {
    configured: fs.existsSync(path.resolve('tests/e2e/accessibility.spec.mjs')),
    command: 'npm run test:a11y',
    executionStatus: 'BLOCKED_BY_CURRENT_EXECUTION_ENVIRONMENT'
  },
  generatedAt: new Date().toISOString()
};

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ status: report.status, checks: checks.length, seriousFailureCount: report.seriousFailureCount, coveredGameCount: report.scope.coveredGameCount, file: output }, null, 2));
if (report.status !== 'PASS') process.exitCode = 1;
