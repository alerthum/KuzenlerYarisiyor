import { categoryLabel, categoryFiltersForProfile } from './catalog/labels.js';
import { ENGLISH_WORDS } from './content-v2.js';
import { OFFICIAL_LGS_ARCHIVE } from './content-v3.js';
import { V4_QUALITY_POLICY } from './content-v4.js';
import { RUNTIME_CONFIG } from './runtime-config.js';
import { createProactivePlan, runAiOrchestra } from './ai/orchestrator.js';
import { curriculumMatrix } from './curriculum/meb-curriculum.js';
import { socialSnapshot } from './social/league-engine.js';
import { chooseDiscoveryCard } from './engines/learning-engine-v4.js';
import { SKILLS, accuracyForAttempts, createDailyEnglishWordIds, createDailyMissionIds, levelFromXp } from './engines/adaptive-engine.js';
import { validateTargetExpression } from './engines/math-engine.js';
import { containsForbiddenLetter, validateLadder, validateWordMine } from './engines/word-engine.js';
import { GAME_CATALOG, createGameSession, getGame, isGameAvailableForProfile } from './games/registry.js';
import { loadStoredState } from './storage.js';
import {
  addProfile,
  attemptsForProfile,
  completeGameSession,
  createInitialState,
  ensureDailyPlan,
  getProfile,
  recordAttempt,
  reportQuestion,
  removeProfile,
  reportsForProfile,
  resetProgress,
  setActiveProfile,
  seenQuestionKeysForProfile,
  updateProfile,
  updateQuestionReportStatus,
  updateSettings
} from './state.js';
import {
  escapeHtml,
  formatDuration,
  formatNumber,
  sentenceCount,
  todayKey,
  uniqueWordCount
} from './utils.js';

const root = document.querySelector('#app');
const toastRoot = document.querySelector('#toast-root');
const PLATFORM = window.__KUZENLER_PLATFORM__ || { mode: 'local', role: 'local', user: null, learnerId: null, adultPreview: false };
const state = createInitialState(window.__KUZENLER_INITIAL_STATE__ || loadStoredState());
document.title = RUNTIME_CONFIG.appName;

const ui = {
  screen: state.activeProfileId ? 'dashboard' : 'profiles',
  filter: 'all',
  session: null,
  feedback: null,
  hintIndex: 0,
  roundData: {},
  timeLeft: 0,
  timerId: null,
  parentUnlocked: false,
  deferredInstallPrompt: null,
  reportModalOpen: false,
  paused: false,
  pauseStartedAt: null,
  pausedTotalMs: 0,
  toolsOpen: false,
  calculatorValue: '0',
  calculatorExpression: '',
  whiteboardOpen: false
};

const NAV_ITEMS = PLATFORM.mode === 'live'
  ? [['dashboard', '⌂', 'Ana Sayfa'], ['library', '◈', 'Oyunlar'], ['progress', '◒', 'Gelişim'], ['ranking', '🏅', 'Sıralama'], ['social', '🏆', 'Lig']]
  : [['dashboard', '⌂', 'Ana Sayfa'], ['library', '◈', 'Oyunlar'], ['progress', '◒', 'Gelişim'], ['ranking', '🏅', 'Sıralama'], ['social', '🏆', 'Lig'], ['parent', '⚙', 'Yerel Ayarlar']];

function activeProfile() {
  return getProfile(state);
}

function topbar({ back = false, compact = false } = {}) {
  return `
    <header class="topbar">
      <div class="brand">
        ${back ? '<button class="back-button" data-action="back" aria-label="Geri dön">←</button>' : '<div class="brand-mark" aria-hidden="true">⛰️</div>'}
        <div class="brand-copy">
          <p class="brand-title">${escapeHtml(RUNTIME_CONFIG.appName)}</p>
          ${compact ? '' : '<p class="brand-subtitle">Türkçe • Matematik • İngilizce • Fen • Sosyal • Zekâ • Olimpiyat</p>'}
        </div>
      </div>
      <div class="button-row" style="flex-wrap:nowrap">
        ${ui.deferredInstallPrompt ? '<button class="icon-button" data-action="install" aria-label="Uygulamayı telefona kur">⇩</button>' : ''}
        ${PLATFORM.adultPreview ? '<button class="icon-button" data-action="return-platform" aria-label="Yönetim paneline dön">⇱</button>' : ''}${state.activeProfileId && PLATFORM.mode === 'live' ? '<button class="icon-button" data-action="student-profile" aria-label="Profil ve gelişim">👤</button><button class="icon-button" data-action="student-logout" aria-label="Çıkış yap">⎋</button>' : ''}${state.activeProfileId && !back && PLATFORM.mode !== 'live' ? `<button class="icon-button" data-action="profiles" aria-label="Profil değiştir">${escapeHtml(activeProfile()?.avatar || '👤')}</button>` : ''}
      </div>
    </header>`;
}

function bottomNav() {
  if (!state.activeProfileId || ui.screen === 'game' || ui.screen === 'profiles') return '';
  return `
    <nav class="bottom-nav" aria-label="Ana menü">
      ${NAV_ITEMS.map(([screen, icon, label]) => `
        <button class="nav-button ${ui.screen === screen ? 'active' : ''}" data-action="navigate" data-screen="${screen}">
          <span class="nav-icon" aria-hidden="true">${icon}</span>
          <span>${label}</span>
        </button>`).join('')}
    </nav>`;
}

function renderProfiles() {
  return `
    <main class="app-shell">
      ${topbar()}
      <section class="hero">
        <div class="hero-content">
          <p class="hero-kicker">Kişisel öğrenme ve zihin arenası</p>
          <h1>Oyna, düşün, çözüm yolunu keşfet.</h1>
          <p>Her kuzen kendi yaşına uygun Türkçe, matematik, mantık ve olimpiyat görevleriyle ilerler. Başlamak için profilini seç.</p>
        </div>
      </section>
      <section class="profile-grid" aria-label="Çocuk profilleri">
        ${state.profiles.map((profile, index) => {
          const level = levelFromXp(profile.xp);
          return `
            <button class="profile-card" style="--profile-glow:${index === 0 ? 'rgba(34,211,238,.18)' : 'rgba(167,139,250,.2)'}" data-action="select-profile" data-profile-id="${profile.id}">
              <span class="profile-avatar" aria-hidden="true">${escapeHtml(profile.avatar)}</span>
              <h2>${escapeHtml(profile.name)}</h2>
              <p>${profile.age} yaş • ${profile.grade}. sınıf • ${escapeHtml(profile.subtitle)}</p>
              <div class="profile-meta">
                <span class="badge orange">Seviye ${level.level}</span>
                <span class="badge cyan">${formatNumber(profile.xp)} XP</span>
                <span class="badge green">🔥 ${profile.streak} gün</span>
              </div>
            </button>`;
        }).join('')}
      </section>
      <p class="center muted mt-24">İsimleri ve yaşları ebeveyn ekranından değiştirebilirsiniz. İlk ebeveyn PIN’i: <strong class="orange-text">1453</strong></p>
    </main>`;
}

function getDailyData(profile) {
  const date = todayKey();
  const seen = seenQuestionKeysForProfile(state, profile.id);
  const generatedMissions = createDailyMissionIds(profile, GAME_CATALOG, date);
  const generatedEnglish = createDailyEnglishWordIds(profile, ENGLISH_WORDS, seen, date, 20);
  const daily = ensureDailyPlan(state, profile.id, date, generatedMissions, generatedEnglish);
  const todayAttempts = attemptsForProfile(state, profile.id).filter((attempt) => attempt.date === date);
  const learnedEnglishKeys = new Set(
    todayAttempts
      .filter((attempt) => attempt.gameId === 'english-vocabulary' && attempt.questionKey)
      .map((attempt) => attempt.questionKey)
  );
  const englishLearned = daily.englishWordIds.filter((wordId) => learnedEnglishKeys.has(`english-vocabulary:${wordId}`)).length;
  return { ...daily, englishLearned };
}

function renderDashboard() {
  const profile = activeProfile();
  if (!profile) return renderProfiles();
  const level = levelFromXp(profile.xp);
  const attempts = attemptsForProfile(state, profile.id);
  const recent = attempts.slice(-20);
  const accuracy = accuracyForAttempts(recent);
  const daily = getDailyData(profile);
  const completed = daily.missionIds.filter((id) => daily.completedGameIds.includes(id)).length;
  const englishTarget = daily.englishWordIds.length || 20;
  const englishDone = daily.englishLearned >= englishTarget && englishTarget > 0;
  const scienceGame = GAME_CATALOG.find((game) => game.id === 'science-lab');
  const aiPlan = createProactivePlan(profile, attempts);
  const curriculum = curriculumMatrix(profile, attempts);

  return `
    <main class="app-shell">
      ${topbar()}
      <section class="dashboard-hero">
        <div class="welcome-card">
          <div class="welcome-row">
            <div class="welcome-avatar">${escapeHtml(profile.avatar)}</div>
            <div>
              <span class="badge orange">Seviye ${level.level}</span>
              <h1>Merhaba, ${escapeHtml(profile.name)}!</h1>
            </div>
          </div>
          <p>Bugünün dört ana görevi sabitlendi. Tamamladığın görev gün boyunca değişmeden işaretli kalır.</p>
          <div class="mt-18">
            <div class="section-header">
              <div><p>Sonraki seviyeye ilerleme</p></div>
              <strong>${Math.round(level.progress)}%</strong>
            </div>
            <div class="progress-track"><div class="progress-fill" style="width:${level.progress}%"></div></div>
          </div>
        </div>
        <div class="daily-card">
          <div class="daily-ring">${completed}/4</div>
          <div>
            <h3>Günlük ana arena</h3>
            <p>${completed === 4 ? 'Türkçe, matematik, olimpiyat ve zekâ görevlerini tamamladın.' : `${4 - completed} ana görev kaldı • yaklaşık ${state.settings.dailyMinutes} dakika`}</p>
          </div>
        </div>
      </section>


      <section class="section ai-guide-card">
        <div class="section-header">
          <div><span class="badge orange">Zihin Rehberi</span><h2>${escapeHtml(aiPlan.greeting)}</h2><p>${escapeHtml(aiPlan.summary)}</p></div>
        </div>
        <div class="ai-plan-grid">
          ${aiPlan.plan.map((item, index) => `<article class="ai-plan-item"><span>${index + 1}</span><div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.reason)}</p><small>Yaklaşık ${item.minutes} dakika</small></div></article>`).join('')}
        </div>
        <div class="curriculum-strip">
          ${curriculum.slice(0, 6).map((item) => `<div class="curriculum-chip ${item.status}"><strong>${escapeHtml(item.subject)}</strong><span>${item.attempts ? `%${item.accuracy} • ${item.attempts} soru` : 'Meydan okuma hazır'}</span></div>`).join('')}
        </div>
      </section>

      <section class="section metric-grid">
        <div class="metric-card"><div class="metric-label">Toplam XP</div><div class="metric-value">${formatNumber(profile.xp)}</div><div class="metric-note">Seviye ${level.level}</div></div>
        <div class="metric-card"><div class="metric-label">Son doğruluk</div><div class="metric-value">%${accuracy}</div><div class="metric-note">Son ${recent.length || 0} soru</div></div>
        <div class="metric-card"><div class="metric-label">Günlük seri</div><div class="metric-value">${profile.streak}</div><div class="metric-note">🔥 gün</div></div>
        <div class="metric-card"><div class="metric-label">Yıldız</div><div class="metric-value">${formatNumber(profile.stars)}</div><div class="metric-note">Doğru cevap ödülü</div></div>
      </section>

      <section class="section">
        <div class="section-header">
          <div><h2>Bugünün dört ana görevi</h2><p>Her gün bir Türkçe, bir matematik, bir olimpiyat ve bir zekâ oyunu.</p></div>
          <button class="text-button" data-action="navigate" data-screen="library">Tüm oyunlar</button>
        </div>
        <div class="mission-list">
          ${daily.missionIds.map((gameId, index) => {
            const game = getGame(gameId);
            const done = daily.completedGameIds.includes(gameId);
            return `
              <button class="mission-card ${done ? 'completed' : ''}" data-action="start-game" data-game-id="${game.id}">
                <span class="mission-icon">${game.icon}</span>
                <span>
                  <small class="mission-category">${categoryLabel(game.category)}</small>
                  <h3>${index + 1}. ${escapeHtml(game.title)}</h3>
                  <p>${escapeHtml(game.description)}</p>
                </span>
                <span class="mission-status ${done ? 'done' : ''}">${done ? '✓ Tamamlandı • Devam et' : 'Başla →'}</span>
              </button>`;
          }).join('')}
        </div>
      </section>

      <section class="section">
        <div class="section-header"><div><h2>Günlük öğrenme takviyesi</h2><p>İngilizce kelimeler zorunlu günlük ilerleme; Fen ise istediğin zaman oynayabileceğin ek ders.</p></div></div>
        <div class="supplement-grid">
          <button class="supplement-card english ${englishDone ? 'completed' : ''}" data-action="start-game" data-game-id="english-vocabulary">
            <span class="supplement-icon">🌍</span>
            <span><small>GÜNLÜK İNGİLİZCE</small><h3>${daily.englishLearned}/${englishTarget} yeni kelime</h3><p>${englishDone ? 'Günlük hedef tamamlandı. Yeni kelimelerle sınırsız devam edebilirsin.' : 'Her kelime yalnız bir kez gelir; kaldığın yerden devam edersin.'}</p></span>
            <span class="mission-status ${englishDone ? 'done' : ''}">${englishDone ? '✓ Tamam • Devam →' : 'Devam →'}</span>
          </button>
          <button class="supplement-card science" data-action="start-game" data-game-id="${scienceGame.id}">
            <span class="supplement-icon">🔬</span>
            <span><small>FEN BONUSU</small><h3>Fen Bilimleri Laboratuvarı</h3><p>Canlılar, madde, kuvvet, enerji ve deney yorumlama soruları.</p></span>
            <span class="mission-status">Oyna →</span>
          </button>
        </div>
      </section>

      <section class="section">
        <div class="section-header"><div><h2>Yeni ders alanları</h2><p>Günlük görev tamamlandıktan sonra bu alanlarda yeni sorularla aralıksız devam edebilirsin.</p></div></div>
        <div class="game-grid compact-grid">
          ${['english-cloze','english-sentence-builder','social-time-travel','social-map-skills','social-citizenship', ...(profile.grade >= 7 && profile.grade <= 8 ? ['lgs-focus','religion-practice','lgs-foundation'] : []), ...(profile.grade >= 11 ? ['tyt-focus','ayt-focus', ...((profile.examPlans||[]).includes('KPSS')?['kpss-focus']:[])] : [])].filter(id=>isGameAvailableForProfile(getGame(id),profile)).map((id) => gameCard(getGame(id), daily)).join('')}
        </div>
      </section>

      ${(() => { const social = socialSnapshot(profile, attempts); return `<section class="section panel arena-social-preview"><div class="section-header"><div><span class="badge orange">${social.league.current.icon} ${social.league.current.name} Lig</span><h2>Bu haftaki arena yolculuğun</h2><p>${social.weeklyXp} haftalık XP • ${social.dailyChallenge.solved}/${social.dailyChallenge.targetQuestions} günlük meydan okuma</p></div><button class="text-button" data-action="navigate" data-screen="social">Lig merkezini aç</button></div><div class="progress-track"><div class="progress-fill" style="width:${social.league.progress}%"></div></div></section>`; })()}

      <section class="section score-guide">
        <div class="section-header"><div><h2>Puanı nasıl kazanıyorum?</h2><p>Çocukların aldığı XP ve soru puanı artık açıkça gösterilir.</p></div></div>
        <div class="score-rule-grid">
          <div><strong>+18 XP</strong><span>Doğru cevap temel puanı</span></div>
          <div><strong>+4 × zorluk</strong><span>Zor soru bonusu</span></div>
          <div><strong>+7 XP</strong><span>İpucusuz doğru cevap</span></div>
          <div><strong>+3 XP</strong><span>40 saniye ve üzeri emek bonusu</span></div>
          <div><strong>−2 XP</strong><span>Kullanılan her ipucu</span></div>
          <div><strong>+5 XP</strong><span>Yanlışta bile öğrenme ve çaba puanı</span></div>
        </div>
        <p class="score-note">Soru skoru 100 üzerinden hesaplanır. Her ipucu 10 soru puanı azaltır. Yanlış cevapta çözümü okuduğun için düşük de olsa öğrenme puanı kazanırsın.</p>
      </section>

      <section class="section">
        <div class="section-header"><div><h2>Hızlı başlangıç</h2><p>Bugün oynadığın oyunlarda yeşil “Bugün oynandı” işareti görünür.</p></div></div>
        <div class="game-grid">
          ${GAME_CATALOG.filter((game) => isGameAvailableForProfile(game, profile)).slice(0, 6).map((game) => gameCard(game, daily)).join('')}
        </div>
      </section>
      ${bottomNav()}
    </main>`;
}

function gameCard(game, daily = null) {
  const playedToday = daily?.completedGameIds?.includes(game.id);
  const isDaily = daily?.missionIds?.includes(game.id);
  return `
    <button class="game-card ${playedToday ? 'played-today' : ''}" style="--game-color:${game.color}" data-action="start-game" data-game-id="${game.id}">
      <div class="game-card-top"><span class="game-icon">${game.icon}</span>${playedToday ? '<span class="today-badge">✓ Bugün oynandı</span>' : isDaily ? '<span class="daily-badge">Günlük görev</span>' : ''}</div>
      <h3>${escapeHtml(game.title)}</h3>
      <p>${escapeHtml(game.description)}</p>
      <span class="game-footer"><span>${categoryLabel(game.category)}</span><span>${game.duration} →</span></span>
    </button>`;
}

function renderLibrary() {
  const profile = activeProfile();
  if (!profile) return renderProfiles();
  const daily = getDailyData(profile);
  const filters = categoryFiltersForProfile(profile);
  if (!filters.some(([value]) => value === ui.filter)) ui.filter = 'all';
  const games = GAME_CATALOG.filter((game) => isGameAvailableForProfile(game, profile) && (ui.filter === 'all' || game.category === ui.filter));
  return `
    <main class="app-shell">
      ${topbar()}
      <section class="section mt-0">
        <div class="section-header"><div><h2>Oyun kütüphanesi</h2><p>${profile.grade}. sınıf öğrenme penceresine uygun ${games.length} oyun gösteriliyor. Aynı soru bu profile ikinci kez verilmez.</p></div></div>
        <div class="filter-row" role="tablist">
          ${filters.map(([value, label]) => `<button class="chip-button ${ui.filter === value ? 'active' : ''}" data-action="filter" data-filter="${value}">${label}</button>`).join('')}
        </div>
        ${profile.grade === 8 && (ui.filter === 'all' || ui.filter === 'lgs') ? `<section class="lgs-archive-card"><div><span class="badge orange">Resmî arşiv</span><h3>LGS yayımlanmış sorular: ${OFFICIAL_LGS_ARCHIVE.years}</h3><p>${escapeHtml(OFFICIAL_LGS_ARCHIVE.note)} Uygulamadaki sorular özgündür; resmî kitapçıklara aşağıdaki bağlantılardan ulaşılır.</p></div><div class="button-row"><a class="secondary-button" href="${OFFICIAL_LGS_ARCHIVE.url}" target="_blank" rel="noreferrer">Resmî sınav arşivi</a><a class="secondary-button" href="${OFFICIAL_LGS_ARCHIVE.examplesUrl}" target="_blank" rel="noreferrer">MEB örnek sorular</a></div></section>` : ''}
        <div class="game-grid mt-12">${games.map((game) => gameCard(game, daily)).join('')}</div>
      </section>
      ${bottomNav()}
    </main>`;
}

function geometryVisual(visual) {
  if (!visual) return '';
  const common = 'stroke="currentColor" stroke-width="3" fill="rgba(34,211,238,.12)"';
  if (typeof visual === 'string') {
    if (visual === 'rectangle-8-5') return `<svg viewBox="0 0 420 230" role="img" aria-label="Uzun kenarı 8, kısa kenarı 5 birim olan dikdörtgen"><rect x="70" y="45" width="280" height="140" rx="6" ${common}/><text x="210" y="215" text-anchor="middle" fill="currentColor">8 birim</text><text x="40" y="120" text-anchor="middle" fill="currentColor">5</text></svg>`;
    if (visual === 'square-6') return `<svg viewBox="0 0 360 260" role="img" aria-label="Bir kenarı 6 birim olan kare"><rect x="80" y="30" width="200" height="200" rx="6" ${common}/><text x="180" y="252" text-anchor="middle" fill="currentColor">6 birim</text></svg>`;
    if (visual === 'cut-rectangle') return `<svg viewBox="0 0 440 280" role="img"><path d="M55 35H385V235H210V150H55Z" ${common}/><text x="220" y="266" text-anchor="middle" fill="currentColor">10</text><text x="25" y="140" fill="currentColor">8</text><text x="295" y="142" fill="currentColor">4 × 3 çıkarıldı</text></svg>`;
    if (visual === 'triangle-12-7') return `<svg viewBox="0 0 440 270" role="img"><path d="M55 220L385 220L235 35Z" ${common}/><path d="M235 35V220" stroke="rgba(249,115,22,.9)" stroke-width="3" stroke-dasharray="7 7"/><text x="220" y="252" text-anchor="middle" fill="currentColor">12</text><text x="250" y="132" fill="currentColor">7</text></svg>`;
    return '';
  }
  const label = (x, y, text, anchor = 'middle') => `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="currentColor">${escapeHtml(text)}</text>`;
  if (visual.type === 'rectangle' || visual.type === 'missingRectangle') {
    return `<svg viewBox="0 0 440 260" role="img" aria-label="Dikdörtgen görseli"><rect x="75" y="45" width="290" height="150" rx="8" ${common}/>${label(220,228,`${visual.width} birim`)}${label(48,125,visual.type === 'missingRectangle' ? '? birim' : `${visual.height} birim`)}${visual.perimeter ? label(220,28,`Çevre: ${visual.perimeter}`) : ''}</svg>`;
  }
  if (visual.type === 'square') return `<svg viewBox="0 0 360 270" role="img"><rect x="80" y="30" width="200" height="200" rx="8" ${common}/>${label(180,258,`${visual.side} birim`)}</svg>`;
  if (visual.type === 'triangle' || visual.type === 'angles') return `<svg viewBox="0 0 440 280" role="img"><path d="M55 225L385 225L235 35Z" ${common}/>${visual.type === 'triangle' ? `<path d="M235 35V225" stroke="rgba(249,115,22,.9)" stroke-width="3" stroke-dasharray="7 7"/>${label(220,258,`${visual.base} birim`)}${label(258,135,`${visual.height} birim`,'start')}` : `${label(95,212,`${visual.first}°`)}${label(338,212,`${visual.second}°`)}${label(235,82,'?°')}`}</svg>`;
  if (visual.type === 'cube') return `<svg viewBox="0 0 420 300" role="img"><path d="M110 90L255 90L320 45L175 45Z M255 90V225L320 178V45 M110 90V225L255 225V90 M110 225L175 178L320 178" ${common}/>${label(185,260,`Ayrıt: ${visual.side}`)}</svg>`;
  if (visual.type === 'prism') return `<svg viewBox="0 0 450 300" role="img"><path d="M75 105L285 105L365 55L155 55Z M285 105V225L365 175V55 M75 105V225L285 225V105 M75 225L155 175L365 175" ${common}/>${label(180,260,`${visual.width}`)}${label(338,246,`${visual.depth}`)}${label(55,165,`${visual.height}`)}</svg>`;
  if (visual.type === 'trapezoid') return `<svg viewBox="0 0 440 270" role="img"><path d="M115 55H315L385 220H55Z" ${common}/><path d="M315 55V220" stroke="rgba(249,115,22,.9)" stroke-width="3" stroke-dasharray="7 7"/>${label(215,42,`${visual.a}`)}${label(220,250,`${visual.b}`)}${label(332,140,`${visual.height}`,'start')}</svg>`;
  if (visual.type === 'composite') return `<svg viewBox="0 0 450 290" role="img"><path d="M55 35H390V240H235V155H55Z" ${common}/>${label(220,274,`${visual.width}`)}${label(25,140,`${visual.height}`)}${label(310,145,`${visual.cutW} × ${visual.cutH} çıkarıldı`)}</svg>`;
  if (visual.type === 'squareGrid') {
    const size = visual.size;
    const cell = 220 / size;
    const lines = Array.from({ length: size + 1 }, (_, index) => {
      const pos = 60 + index * cell;
      return `<line x1="${pos}" y1="30" x2="${pos}" y2="250"/><line x1="60" y1="${30 + index * cell}" x2="280" y2="${30 + index * cell}"/>`;
    }).join('');
    return `<svg viewBox="0 0 340 285" role="img" aria-label="${size} çarpı ${size} kareli tablo"><g stroke="currentColor" stroke-width="2" fill="none">${lines}</g>${label(170,278,`${size} × ${size} küçük kare`)}</svg>`;
  }
  if (visual.type === 'shapeRow') return `<div class="shape-sequence" role="img" aria-label="Başlangıç şekil sırası">${visual.values.map((value) => `<span>${escapeHtml(value)}</span>`).join('')}</div>`;
  if (visual.type === 'pathGrid') {
    const rows = visual.rows || 3, cols = visual.cols || 3;
    const dots = [];
    for (let row = 0; row <= rows; row += 1) for (let col = 0; col <= cols; col += 1) dots.push(`<circle cx="${45 + col * (300 / cols)}" cy="${35 + row * (200 / rows)}" r="5"/>`);
    return `<svg viewBox="0 0 390 270" role="img" aria-label="Izgarada yol sayma görseli"><g fill="currentColor">${dots.join('')}</g>${label(195,262,'Yalnız sağa ve aşağı ilerle')}</svg>`;
  }
  return '';
}

function currentExpressionTokens() {
  ui.roundData.expressionTokens ||= [];
  return ui.roundData.expressionTokens;
}

function expressionString() {
  return currentExpressionTokens().map((token) => token.value).join(' ');
}

function renderRoundInput(round) {
  if (round.kind === 'memory') {
    const visible = ui.roundData.memoryVisible !== false;
    if (visible) {
      return `<div class="memory-stage"><p>Bu diziyi ${round.revealSeconds || 6} saniye dikkatle incele. İkili veya üçlü gruplara ayırmayı dene.</p><div class="memory-items">${round.memoryItems.map((item) => `<span>${escapeHtml(item)}</span>`).join('')}</div><button class="primary-button full-width" data-action="hide-memory">Ezberledim • Soruyu Göster</button></div>`;
    }
    return `<div class="memory-hidden-note">Dizi gizlendi. Hatırladığın sıraya göre cevapla.</div><div class="answer-grid">${round.options.map((option, index) => {
      let className = '';
      if (ui.feedback) {
        if (index === round.answerIndex) className = 'correct';
        else if (index === ui.roundData.selectedIndex) className = 'wrong';
      }
      return `<button class="answer-button ${className}" data-action="choose-answer" data-index="${index}" ${ui.feedback ? 'disabled' : ''}><span class="answer-letter">${String.fromCharCode(65 + index)}</span><span>${escapeHtml(option)}</span></button>`;
    }).join('')}</div>`;
  }

  if (round.kind === 'choice') {
    return `<div class="answer-grid">${round.options.map((option, index) => {
      let className = '';
      if (ui.feedback) {
        if (index === round.answerIndex) className = 'correct';
        else if (index === ui.roundData.selectedIndex) className = 'wrong';
      }
      return `<button class="answer-button ${className}" data-action="choose-answer" data-index="${index}" ${ui.feedback ? 'disabled' : ''}><span class="answer-letter">${String.fromCharCode(65 + index)}</span><span>${escapeHtml(option)}</span></button>`;
    }).join('')}</div>`;
  }

  if (round.kind === 'expression') {
    const tokens = currentExpressionTokens();
    const usedNumberIndexes = new Set(tokens.filter((token) => token.type === 'number').map((token) => token.numberIndex));
    const operators = ['+', '−', '×', '÷', '(', ')'];
    return `
      <div class="target-rule">${escapeHtml(round.rule)}</div>
      <div class="target-box"><span>HEDEF</span><strong>${round.target}</strong></div>
      <div class="expression-builder">
        <div class="expression-display" aria-label="Oluşturulan işlem">
          ${tokens.length ? tokens.map((token, index) => `<button class="expression-token ${token.type}" data-action="remove-expression-token" data-token-index="${index}" ${ui.feedback ? 'disabled' : ''}>${escapeHtml(token.value)}</button>`).join('') : '<span class="expression-placeholder">Aşağıdaki sayı ve işaretlere dokunarak işlemi kur.</span>'}
        </div>
        <div class="builder-section"><span class="builder-label">Sayılar — kullanılan sayıya tekrar dokunursan işlemden çıkar</span><div class="number-chip-row">
          ${round.numbers.map((number, index) => `<button class="number-chip interactive ${usedNumberIndexes.has(index) ? 'used' : ''}" data-action="toggle-expression-number" data-number-index="${index}" ${ui.feedback ? 'disabled' : ''}>${number}</button>`).join('')}
        </div></div>
        <div class="builder-section"><span class="builder-label">İşlemler ve parantezler</span><div class="operator-pad">
          ${operators.map((symbol) => `<button class="operator-button" data-action="add-expression-symbol" data-symbol="${symbol}" ${ui.feedback ? 'disabled' : ''}>${symbol}</button>`).join('')}
          <button class="operator-button utility" data-action="undo-expression" ${ui.feedback || !tokens.length ? 'disabled' : ''}>↶ Geri</button>
          <button class="operator-button utility" data-action="clear-expression" ${ui.feedback || !tokens.length ? 'disabled' : ''}>Temizle</button>
        </div></div>
      </div>`;
  }

  if (round.kind === 'wordMine') {
    const words = ui.roundData.words || [];
    return `
      <div class="target-box"><span>ANA KELİME</span><strong>${escapeHtml(round.source.toLocaleUpperCase('tr-TR'))}</strong></div>
      <div class="word-entry-row">
        <input id="word-input" class="text-input" autocomplete="off" autocapitalize="none" placeholder="Yeni kelime yaz" ${ui.feedback ? 'disabled' : ''}>
        <button data-action="add-word" aria-label="Kelimeyi ekle" ${ui.feedback ? 'disabled' : ''}>+</button>
      </div>
      <div class="word-cloud">${words.length ? words.map((item) => `<span class="word-token">${escapeHtml(item.word)} <small>+${item.score}</small></span>`).join('') : '<span class="muted">Bulduğun kelimeler burada görünecek.</span>'}</div>
      <p class="muted">Hedef: ${activeProfile().age <= 10 ? 5 : 8} kelime • Şu an ${words.length}. Doğrulanmış örnek listesiyle sınırlı değilsin; geniş sözlük de kontrol edilir.</p>`;
  }

  if (round.kind === 'wordLadder') {
    ui.roundData.ladderInputs ||= Array(Math.max(1, round.suggestedStepCount || round.steps.length || 1)).fill('');
    const inputs = ui.roundData.ladderInputs;
    return `
      <div class="ladder-help">3–6 harfli doğrulanmış kelimeler kullanılır. Örnek yola uymak zorunda değilsin; kurala uyan her yol kabul edilir.</div>
      <div class="ladder-row dynamic">
        <span class="ladder-word">${round.start}</span>
        ${inputs.map((value, index) => `<span class="ladder-arrow">→</span><input class="ladder-input" data-ladder-index="${index}" maxlength="${round.start.length}" value="${escapeHtml(value || '')}" aria-label="${index + 1}. ara kelime" ${ui.feedback ? 'disabled' : ''}>`).join('')}
        <span class="ladder-arrow">→</span><span class="ladder-word">${round.end}</span>
      </div>
      ${!ui.feedback ? `<div class="ladder-controls"><button class="secondary-button" data-action="remove-ladder-step" ${inputs.length <= (round.minSteps || 1) ? 'disabled' : ''}>− Basamak</button><span>${inputs.length} ara kelime</span><button class="secondary-button" data-action="add-ladder-step" ${inputs.length >= (round.maxSteps || 7) ? 'disabled' : ''}>+ Basamak</button></div>` : ''}`;
  }

  if (round.kind === 'wordOrder') {
    ui.roundData.wordOrderSelected ||= [];
    const selected = ui.roundData.wordOrderSelected;
    const selectedSet = new Set(selected);
    return `<div class="sentence-builder">
      <div class="sentence-target">${selected.length ? selected.map((id, index) => {
        const token = round.tokens.find((item) => item.id === id);
        return `<button class="sentence-token selected" data-action="remove-word-order-token" data-token-position="${index}" ${ui.feedback ? 'disabled' : ''}>${escapeHtml(token?.value || '')}</button>`;
      }).join('') : '<span class="expression-placeholder">Aşağıdaki kelimelere doğru sırayla dokun.</span>'}</div>
      <div class="sentence-token-pool">${round.tokens.map((token) => `<button class="sentence-token ${selectedSet.has(token.id) ? 'used' : ''}" data-action="add-word-order-token" data-token-id="${escapeHtml(token.id)}" ${ui.feedback || selectedSet.has(token.id) ? 'disabled' : ''}>${escapeHtml(token.value)}</button>`).join('')}</div>
      ${!ui.feedback && selected.length ? '<button class="text-button" data-action="clear-word-order">Cümleyi temizle</button>' : ''}
    </div>`;
  }

  if (round.kind === 'wordOrder') {
    const selectedWords = (ui.roundData.wordOrderSelected || []).map((id) => round.tokens.find((token) => token.id === id)?.value).filter(Boolean);
    if (selectedWords.length !== round.answerTokens.length) {
      showToast('Cümledeki bütün kelimeleri sıraya yerleştir.', 'error');
      return;
    }
    const correct = selectedWords.join(' ').toLocaleLowerCase('en-US') === round.answerTokens.join(' ').toLocaleLowerCase('en-US');
    finalizeRound(correct, correct ? round.explanation : `Kurulan cümle: ${selectedWords.join(' ')}. ${round.explanation}`, correct ? 100 : 25);
    return;
  }

  if (round.kind === 'story') {
    return `
      <div class="target-box"><span>YASAK HARF</span><strong>${round.forbiddenLetter.toLocaleUpperCase('tr-TR')}</strong></div>
      <div class="input-stack"><textarea id="story-input" class="story-input" placeholder="Hikâyeni buraya yaz…" ${ui.feedback ? 'disabled' : ''}>${escapeHtml(ui.roundData.story || '')}</textarea></div>
      <p class="muted">En az ${round.minSentences} cümle ve ${round.minUniqueWords} farklı kelime kullan.</p>`;
  }

  return '';
}


function selectedAnswerText(round) {
  if (round.kind === 'choice' || round.kind === 'memory') {
    const index = ui.roundData.selectedIndex;
    return Number.isInteger(index) ? `${String.fromCharCode(65 + index)}) ${round.options[index]}` : 'Henüz cevap verilmedi';
  }
  if (round.kind === 'expression') return expressionString() || 'İşlem kurulmadı';
  if (round.kind === 'wordLadder') return [round.start, ...(ui.roundData.ladderInputs || []), round.end].filter(Boolean).join(' → ');
  if (round.kind === 'wordOrder') return (ui.roundData.wordOrderSelected || []).map((id) => round.tokens.find((token) => token.id === id)?.value).filter(Boolean).join(' ');
  if (round.kind === 'wordMine') return (ui.roundData.words || []).map((item) => item.word).join(', ');
  if (round.kind === 'story') return ui.roundData.story || '';
  return '';
}

function canonicalAnswerText(round) {
  if (round.kind === 'choice' || round.kind === 'memory') return `${String.fromCharCode(65 + round.answerIndex)}) ${round.options[round.answerIndex]}`;
  if (round.kind === 'expression') return round.solution || round.explanation;
  if (round.kind === 'wordLadder') return round.explanation;
  if (round.kind === 'wordOrder') return round.answerTokens.join(' ');
  return round.explanation || '';
}

function renderDetailedOptionAnalysis(round) {
  if (!ui.feedback || !Array.isArray(round.detailedOptions) || !round.detailedOptions.length) return '';
  return `<div class="option-analysis"><h3>Seçenekleri tek tek inceleyelim</h3>${round.options.map((option, index) => {
    const isCorrect = index === round.answerIndex;
    const selected = index === ui.roundData.selectedIndex;
    return `<article class="option-analysis-row ${isCorrect ? 'correct' : ''} ${selected ? 'selected' : ''}"><strong>${String.fromCharCode(65 + index)}) ${escapeHtml(option)}</strong><p>${escapeHtml(round.detailedOptions[index] || '')}</p>${selected ? '<span class="badge orange">Senin seçimin</span>' : ''}${isCorrect ? '<span class="badge green">Doğru seçenek</span>' : ''}</article>`;
  }).join('')}</div>`;
}

function renderReportModal(round) {
  if (!ui.reportModalOpen) return '';
  return `<div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="report-title">
    <section class="report-modal">
      <div class="section-header"><div><h2 id="report-title">Soruyu bildir</h2><p>Sistem soruyu otomatik değiştirmez. Bildirim; verdiğin cevap, sistem cevabı ve notunla birlikte kaydedilir. Bu soru bu profile tekrar gösterilmez ve ebeveyn ekranında incelenir.</p></div><button class="icon-button" data-action="close-report" aria-label="Kapat">×</button></div>
      <div class="report-question-preview">${escapeHtml(round.prompt)}</div>
      <div class="form-field mt-18"><label for="report-reason">Sorundaki durum</label><select id="report-reason">
        <option value="answer-wrong">Doğru cevap veya açıklama yanlış</option>
        <option value="same-question">Aynı soru tekrar çıktı</option>
        <option value="ambiguous">Soru belirsiz ya da birden fazla cevap var</option>
        <option value="expression-error">İfade bozukluğu / soru cümlesi anlaşılmıyor</option>
        <option value="typo">Yazım veya anlatım hatası var</option>
        <option value="too-easy">Çeldiriciler çok kolay</option>
        <option value="bad-hint">İpucu belirsiz veya çözümle uyumsuz</option>
        <option value="bad-solution">Çözüm yetersiz veya anlaşılmıyor</option>
        <option value="visual-conflict">Görsel ile metin çelişiyor</option>
        <option value="other">Diğer</option>
      </select></div>
      <div class="form-field mt-18"><label for="report-note">Kısa not</label><textarea id="report-note" class="story-input compact" placeholder="Neyi yanlış gördüğünüzü yazın."></textarea></div>
      <div class="button-row mt-18"><button class="secondary-button" data-action="close-report">Vazgeç</button><button class="primary-button" data-action="save-question-report">Bildirimi Kaydet</button></div>
    </section>
  </div>`;
}


function renderTeachingSolution(round) {
  if (!ui.feedback) return '';
  const solution = round.teachingSolution;
  if (!solution) return '';
  const sections = [
    ['Soruyu sadeleştir', solution.simplify],
    ['Ana fikir', solution.mainIdea],
    ['Adım adım çözüm', Array.isArray(solution.steps) ? `<ol>${solution.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol>` : ''],
    ['Neden bu işlem?', solution.why],
    ['Kontrol', solution.check],
    ['Benzer soruda kullan', solution.transfer]
  ].filter(([,value]) => value);
  return `<section class="teaching-solution"><h3>🧭 Çözüm yolunu öğrenelim</h3>${sections.map(([title,value]) => `<div class="solution-section"><h4>${title}</h4>${String(value).startsWith('<ol>') ? value : `<p>${escapeHtml(value)}</p>`}</div>`).join('')}</section>`;
}

function renderStudentTools() {
  if (!ui.toolsOpen && !ui.whiteboardOpen) return '';
  if (ui.whiteboardOpen) return `<div class="tool-overlay" role="dialog" aria-modal="true" aria-label="Beyaz tahta">
    <section class="tool-panel whiteboard-panel"><div class="section-header"><div><h2>✍️ Beyaz Tahta</h2><p>Sorudan çıkmadan parmağınla veya farenle işlem yap.</p></div><button class="icon-button" data-action="close-tools">×</button></div>
    <canvas id="whiteboard-canvas" width="900" height="1100" aria-label="Çizim alanı"></canvas>
    <div class="button-row"><button class="secondary-button" data-action="whiteboard-clear">Temizle</button><button class="primary-button" data-action="close-tools">Soruma Dön</button></div></section></div>`;
  return `<div class="tool-overlay" role="dialog" aria-modal="true" aria-label="Soru araçları"><section class="tool-panel"><div class="section-header"><div><h2>🧰 Soru Araçları</h2><p>Hesap makinesi öğrencinin isteğiyle açılır. Kullanımı soru kaydına işlenir.</p></div><button class="icon-button" data-action="close-tools">×</button></div>
    <div class="calculator-display">${escapeHtml(ui.calculatorExpression || ui.calculatorValue)}</div>
    <div class="calculator-grid">${['7','8','9','÷','4','5','6','×','1','2','3','−','0',',','C','+'].map(k=>`<button data-action="calculator-key" data-key="${k}">${k}</button>`).join('')}<button data-action="calculator-equals" class="equals">=</button></div>
    <button class="secondary-button full-width mt-12" data-action="open-whiteboard">✍️ Beyaz Tahtayı Aç</button>
  </section></div>`;
}

function togglePause() {
  if (!ui.session || ui.feedback) return;
  if (!ui.paused) {
    ui.paused = true;
    ui.pauseStartedAt = Date.now();
    clearTimer();
  } else {
    ui.pausedTotalMs += Date.now() - (ui.pauseStartedAt || Date.now());
    ui.pauseStartedAt = null;
    ui.paused = false;
  }
  render();
}

function calculatorKey(key) {
  if (key === 'C') { ui.calculatorExpression = ''; ui.calculatorValue = '0'; render(); return; }
  const normalized = {'÷':'/','×':'*','−':'-',',':'.'}[key] || key;
  ui.calculatorExpression += normalized;
  render();
}

function calculatorEquals() {
  try {
    if (!/^[0-9+\-*/.() ]+$/.test(ui.calculatorExpression)) throw new Error('Geçersiz işlem');
    const value = Function(`"use strict"; return (${ui.calculatorExpression})`)();
    if (!Number.isFinite(value)) throw new Error('Geçersiz sonuç');
    ui.calculatorValue = String(Math.round(value * 1000000) / 1000000);
    ui.calculatorExpression = ui.calculatorValue;
    if (ui.session) ui.session.calculatorUsed = true;
  } catch { showToast('İşlem hesaplanamadı.', 'error'); }
  render();
}

function initWhiteboard() {
  const canvas = document.querySelector('#whiteboard-canvas');
  if (!canvas || canvas.dataset.ready === '1') return;
  canvas.dataset.ready = '1';
  const ctx = canvas.getContext('2d');
  ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.strokeStyle = '#172033';
  let drawing = false;
  const pos = (e) => { const r=canvas.getBoundingClientRect(); return {x:(e.clientX-r.left)*canvas.width/r.width,y:(e.clientY-r.top)*canvas.height/r.height}; };
  canvas.addEventListener('pointerdown',e=>{drawing=true;const q=pos(e);ctx.beginPath();ctx.moveTo(q.x,q.y);canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!drawing)return;const q=pos(e);ctx.lineTo(q.x,q.y);ctx.stroke();});
  canvas.addEventListener('pointerup',()=>{drawing=false;});
  canvas.addEventListener('pointercancel',()=>{drawing=false;});
}

function renderGame() {
  const session = ui.session;
  if (!session) return renderDashboard();
  if (session.completed) return renderGameResult();
  const round = session.rounds[session.currentIndex];
  const game = session.game;
  const hintText = ui.hintIndex > 0 ? round.hints?.[ui.hintIndex - 1] : '';
  const isLast = session.currentIndex === session.rounds.length - 1;
  const noHintXp = 18 + round.difficulty * 4 + 7;

  return `
    <main class="app-shell game-mode">
      <header class="game-header">
        <button class="back-button" data-action="quit-game" aria-label="Oyundan çık">←</button>
        <div class="game-header-copy"><h1>${game.icon} ${escapeHtml(game.title)}</h1><p>${categoryLabel(game.category)} • ${session.currentIndex + 1}/${session.rounds.length}</p></div>
        <div class="game-header-actions"><button class="icon-button" data-action="toggle-pause" aria-label="${ui.paused ? 'Devam et' : 'Soruyu durdur'}">${ui.paused ? '▶' : 'Ⅱ'}</button><button class="icon-button" data-action="open-tools" aria-label="Araçları aç">🧰</button><button class="icon-button" data-action="student-profile" aria-label="Profil">👤</button><button class="icon-button" data-action="student-logout" aria-label="Çıkış yap">⎋</button>${state.settings.timer ? `<div id="timer-pill" class="timer-pill ${ui.timeLeft <= 10 ? 'danger' : ''}">${formatDuration(ui.timeLeft)}</div>` : '<span class="badge cyan">Serbest</span>'}</div>
      </header>
      <div class="session-progress" style="grid-template-columns:repeat(${session.rounds.length},minmax(4px,1fr))">${session.rounds.map((_, index) => {
        const answer = session.answers[index];
        const cls = index === session.currentIndex ? 'active' : answer ? (answer.correct ? 'correct' : 'wrong') : index < session.currentIndex ? 'done' : '';
        return `<span class="session-step ${cls}"></span>`;
      }).join('')}</div>

      ${ui.paused ? `<section class="paused-card"><div class="pause-icon">Ⅱ</div><h2>Soru durduruldu</h2><p>Soru gizlendi ve süre durdu. Hazır olduğunda devam et.</p><button class="primary-button" data-action="toggle-pause">Devam Et</button></section>` : `<section class="question-card">`}
        <div class="question-meta"><span class="question-label">${escapeHtml(SKILLS[round.skill])}</span><span class="question-difficulty">${session.rewardEligible ? `Zorluk ${round.difficulty}/5 • İpucusuz doğru: +${noHintXp} XP` : `XP dışı öğrenme alanı • Zorluk ${round.difficulty}/5`}</span></div>${round.targetGrade ? `<div class="curriculum-meta"><span>${escapeHtml(V4_QUALITY_POLICY.labels[round.curriculumRole] || 'Sınıf çalışması')}</span><span>${round.targetGrade}. sınıf hedefi</span>${round.familyId ? `<span>Aile: ${escapeHtml(round.familyId)}</span>` : ''}</div>` : ''}${round.sourceLabel ? `<div class="source-label">${escapeHtml(round.sourceLabel)}</div>` : ""}
        <h2 class="question-text">${escapeHtml(round.prompt)}</h2>
        ${round.context ? `<div class="question-context">${escapeHtml(round.context)}</div>` : ''}
        ${round.visual ? `<div class="visual-stage">${geometryVisual(round.visual)}</div>` : ''}
        ${renderRoundInput(round)}
        ${hintText ? `<div class="hint-panel"><h3>💡 İpucu ${ui.hintIndex}</h3><p>${escapeHtml(hintText)}</p></div>` : ''}
        ${ui.feedback ? `<div id="feedback-anchor" class="feedback-panel ${ui.feedback.correct ? 'correct' : 'wrong'}"><h3>${ui.feedback.correct ? '✓ Doğru düşünce' : '✦ Birlikte düzeltelim'}</h3><p>${escapeHtml(ui.feedback.message)}</p><div class="feedback-score">Bu sorudan <strong>+${ui.feedback.xp} XP</strong> ve <strong>${ui.feedback.score}/100 soru puanı</strong> aldın. Bu sonuç gelişim analizine kaydedildi.</div>${session.rewardEligible ? `<div class="xp-breakdown-inline"><span>Temel <strong>+${ui.feedback.xpBreakdown.base}</strong></span><span>Zorluk <strong>+${ui.feedback.xpBreakdown.difficultyBonus}</strong></span>${ui.feedback.xpBreakdown.noHintBonus ? `<span>İpucusuz <strong>+${ui.feedback.xpBreakdown.noHintBonus}</strong></span>` : ''}${ui.feedback.xpBreakdown.persistenceBonus ? `<span>Emek <strong>+${ui.feedback.xpBreakdown.persistenceBonus}</strong></span>` : ''}${ui.feedback.xpBreakdown.hintPenalty ? `<span>İpucu <strong>−${ui.feedback.xpBreakdown.hintPenalty}</strong></span>` : ''}</div>` : ''}</div>${renderTeachingSolution(round)}${renderDetailedOptionAnalysis(round)}` : ''}
        <div class="question-action-row"><button class="secondary-button pause-question-button" data-action="toggle-pause">Ⅱ Soruyu Durdur</button><button class="report-question-button" data-action="open-report">⚑ Hatalı / Aynı Soru</button></div>
        <div id="game-actions-anchor" class="game-actions sticky-actions">
          ${!ui.feedback && round.hints?.length ? `<button class="secondary-button" data-action="hint" ${ui.hintIndex >= round.hints.length ? 'disabled' : ''}>💡 İpucu</button>` : ''}
          ${!ui.feedback && !['choice','memory'].includes(round.kind) ? `<button class="primary-button" data-action="check-answer">${round.kind === 'wordMine' ? 'Turu Bitir' : 'Cevabı Kontrol Et'}</button>` : ''}
          ${ui.feedback ? `<button class="primary-button" data-action="next-round">${isLast ? 'Sonucu Gör' : 'Sonraki Soru'} →</button>` : ''}
        </div>
      </section>
      ${renderReportModal(round)}
      ${renderStudentTools()}
    </main>`;
}

function renderGameResult() {
  const session = ui.session;
  const correctCount = session.answers.filter((answer) => answer.correct).length;
  const maxScore = session.answers.length * 100;
  const percentage = Math.round((session.score / Math.max(1, maxScore)) * 100);
  const totalXp = session.answers.reduce((sum, answer) => sum + answer.xp, 0);
  const noHintCount = session.answers.filter((answer) => answer.correct && answer.hintsUsed === 0).length;
  const xpTotals = session.answers.reduce((totals, answer) => {
    const breakdown = answer.xpBreakdown || {};
    totals.base += breakdown.base || 0;
    totals.difficulty += breakdown.difficultyBonus || 0;
    totals.noHint += breakdown.noHintBonus || 0;
    totals.persistence += breakdown.persistenceBonus || 0;
    totals.penalty += breakdown.hintPenalty || 0;
    return totals;
  }, { base: 0, difficulty: 0, noHint: 0, persistence: 0, penalty: 0 });
  const emoji = percentage >= 85 ? '🏆' : percentage >= 60 ? '🌟' : '🧭';
  const discovery = session.discoveryCard || chooseDiscoveryCard(activeProfile(), session, session.startedAt);
  session.discoveryCard = discovery;
  return `
    <main class="app-shell game-mode">
      <section class="result-panel">
        <div class="result-emoji">${emoji}</div>
        <span class="badge orange">${escapeHtml(session.game.title)}</span>
        <h1>${percentage >= 85 ? 'Harika bir tur!' : percentage >= 60 ? 'Güçlü ilerleme!' : 'Öğrenme turu tamamlandı!'}</h1>
        <p>${session.reviewMode ? 'Yeni soru havuzu tamamlandığı için kontrollü tekrar turu yaptın.' : 'Bu turdaki sorular profiline kaydedildi. Aynı oyun, yeni sorularla aralıksız devam edebilir.'}</p><p class="xp-free-note">Bu turdaki bütün cevaplar gelişim, doğruluk, hız, ipucu ve günlük çalışma analizine işlendi.</p>
        <div class="result-score">%${percentage}</div>
        <div class="summary-grid">
          <div class="metric-card"><div class="metric-label">Doğru</div><div class="metric-value">${correctCount}/${session.answers.length}</div></div>
          <div class="metric-card"><div class="metric-label">Toplam XP</div><div class="metric-value">+${totalXp}</div></div>
          <div class="metric-card"><div class="metric-label">Süre</div><div class="metric-value">${formatDuration((Date.now() - session.startedAt) / 1000)}</div></div>
        </div>
        <div class="result-breakdown">
          <div><span>Temel öğrenme XP’si</span><strong>+${xpTotals.base} XP</strong></div>
          <div><span>Zorluk bonusları</span><strong>+${xpTotals.difficulty} XP</strong></div>
          <div><span>İpucusuz doğru</span><strong>${noHintCount} soru / +${xpTotals.noHint} XP</strong></div>
          <div><span>Emek bonusu</span><strong>+${xpTotals.persistence} XP</strong></div>
          <div><span>İpucu kesintisi</span><strong>−${xpTotals.penalty} XP</strong></div>
          <div><span>Soru puanı</span><strong>${session.score}/${maxScore}</strong></div>
        </div>
        ${discovery ? `<section class="discovery-card"><span class="badge cyan">Test sonrası keşif</span><h2>${escapeHtml(discovery.title)}</h2><p>${escapeHtml(discovery.body)}</p><div class="discovery-footer"><span>${escapeHtml(discovery.author)}</span><strong>📚 ${escapeHtml(discovery.book)}</strong></div></section>` : ''}
        <div class="button-row mt-24">
          <button class="secondary-button" data-action="navigate" data-screen="dashboard">Ana Sayfa</button>
          <button class="primary-button" data-action="restart-game" data-game-id="${session.game.id}">Yeni Sorularla Oyna</button>
        </div>
      </section>
    </main>`;
}

function renderProgress() {
  const profile = activeProfile();
  if (!profile) return renderProfiles();
  const attempts = attemptsForProfile(state, profile.id);
  const recent = attempts.slice(-60);
  const level = levelFromXp(profile.xp);
  const days = Array.from({ length: 28 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (27 - index));
    const key = todayKey(date);
    return recent.filter((attempt) => attempt.date === key).length;
  });

  return `
    <main class="app-shell">
      ${topbar()}
      <section class="section mt-0">
        <div class="section-header"><div><h2>${escapeHtml(profile.name)} gelişim haritası</h2><p>Ezber değil; beceri bazlı ilerleme gösterilir.</p></div></div>
        <div class="metric-grid">
          <div class="metric-card"><div class="metric-label">Seviye</div><div class="metric-value">${level.level}</div><div class="metric-note">%${Math.round(level.progress)} ilerleme</div></div>
          <div class="metric-card"><div class="metric-label">Tamamlanan oyun</div><div class="metric-value">${profile.completedGames}</div></div>
          <div class="metric-card"><div class="metric-label">Toplam soru</div><div class="metric-value">${attempts.length}</div></div>
          <div class="metric-card"><div class="metric-label">Genel doğruluk</div><div class="metric-value">%${accuracyForAttempts(attempts)}</div></div>
        </div>
      </section>
      <section class="section panel">
        <h2>Beceri seviyeleri</h2>
        <div class="skill-list">
          ${Object.entries(SKILLS).map(([key, label], index) => {
            const value = Math.round(profile.skills[key] || 0);
            const colors = ['cyan', 'green', 'purple', ''];
            return `<div class="skill-row"><span class="skill-name">${label}</span><div class="progress-track"><div class="progress-fill ${colors[index % colors.length]}" style="width:${value}%"></div></div><span class="skill-value">${value}</span></div>`;
          }).join('')}
        </div>
      </section>
      <section class="section panel">
        <h2>Son 28 gün</h2>
        <p class="muted">Koyu kutular daha fazla soru çözülen günleri gösterir.</p>
        <div class="heatmap">${days.map((count) => `<span class="heat-day ${count >= 8 ? 'l4' : count >= 5 ? 'l3' : count >= 2 ? 'l2' : count >= 1 ? 'l1' : ''}" title="${count} soru"></span>`).join('')}</div>
      </section>
      <section class="section panel">
        <h2>Öğrenme yorumu</h2>
        ${learningInsight(profile, attempts)}
      </section>
      ${bottomNav()}
    </main>`;
}

function learningInsight(profile, attempts) {
  const skills = Object.entries(profile.skills).sort((a, b) => a[1] - b[1]);
  const weakest = skills[0];
  const strongest = skills.at(-1);
  if (!attempts.length) return '<p><strong class="orange-text">Başlangıç meydan okuması hazır.</strong> İlk çözümlerden itibaren hızın, doğruluğun ve stratejin gelişim günlüğüne işlenecek.</p>';
  return `<p><strong class="green-text">Güçlü alan:</strong> ${SKILLS[strongest[0]]} (${Math.round(strongest[1])}).</p><p><strong class="orange-text">Öncelikli alan:</strong> ${SKILLS[weakest[0]]} (${Math.round(weakest[1])}). Günlük görev motoru bu beceriyi daha sık çalıştıracak.</p>`;
}

function dateKeysBack(days, startOffset = 0) {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - startOffset - index);
    return todayKey(date);
  });
}

function profileAnalytics(profile) {
  const attempts = attemptsForProfile(state, profile.id);
  const today = todayKey();
  const weekKeys = new Set(dateKeysBack(7));
  const previousKeys = new Set(dateKeysBack(7, 7));
  const todayAttempts = attempts.filter((item) => item.date === today);
  const week = attempts.filter((item) => weekKeys.has(item.date));
  const previous = attempts.filter((item) => previousKeys.has(item.date));
  const minutes = (items) => Math.round(items.reduce((sum, item) => sum + Number(item.elapsedSeconds || 0), 0) / 60);
  const byGame = new Map();
  for (const attempt of week) {
    const row = byGame.get(attempt.gameId) || { gameId: attempt.gameId, count: 0, correct: 0, hints: 0, seconds: 0 };
    row.count += 1;
    row.correct += attempt.correct ? 1 : 0;
    row.hints += Number(attempt.hintsUsed || 0);
    row.seconds += Number(attempt.elapsedSeconds || 0);
    byGame.set(attempt.gameId, row);
  }
  const games = [...byGame.values()].sort((a, b) => b.count - a.count);
  const skills = Object.entries(profile.skills || {}).sort((a, b) => b[1] - a[1]);
  const trendBase = Math.max(1, previous.length);
  const trend = Math.round(((week.length - previous.length) / trendBase) * 100);
  return {
    attempts,
    todayAttempts,
    week,
    todayMinutes: minutes(todayAttempts),
    weekMinutes: minutes(week),
    accuracy: accuracyForAttempts(week),
    totalHints: week.reduce((sum, item) => sum + Number(item.hintsUsed || 0), 0),
    games,
    strongest: skills.slice(0, 3),
    weakest: [...skills].reverse().slice(0, 3),
    trend
  };
}

function renderAnalytics(profile) {
  const analytics = profileAnalytics(profile);
  const mostHinted = [...analytics.games].sort((a, b) => b.hints - a.hints)[0];
  return `<section class="section panel analytics-panel">
    <div class="section-header"><div><h2>${escapeHtml(profile.avatar)} ${escapeHtml(profile.name)} • Öğrenme Analizi</h2><p>Bugün ve son yedi günlük çalışma davranışı.</p></div><span class="badge ${analytics.trend >= 0 ? 'green' : 'orange'}">${analytics.trend >= 0 ? '+' : ''}${analytics.trend}% soru eğilimi</span></div>
    <div class="metric-grid analytics-metrics">
      <div class="metric-card"><div class="metric-label">Bugünkü süre</div><div class="metric-value">${analytics.todayMinutes} dk</div><div class="metric-note">${analytics.todayAttempts.length} soru</div></div>
      <div class="metric-card"><div class="metric-label">7 günlük süre</div><div class="metric-value">${analytics.weekMinutes} dk</div><div class="metric-note">${analytics.week.length} soru</div></div>
      <div class="metric-card"><div class="metric-label">7 günlük doğruluk</div><div class="metric-value">%${analytics.accuracy}</div><div class="metric-note">Doğru cevap oranı</div></div>
      <div class="metric-card"><div class="metric-label">Kullanılan ipucu</div><div class="metric-value">${analytics.totalHints}</div><div class="metric-note">${mostHinted ? `En çok: ${escapeHtml(getGame(mostHinted.gameId)?.shortTitle || mostHinted.gameId)}` : 'Henüz veri yok'}</div></div>
    </div>
    <div class="strength-grid">
      <div><h3>Güçlü alanlar</h3>${analytics.strongest.map(([skill, value]) => `<p><span>${escapeHtml(SKILLS[skill] || skill)}</span><strong class="green-text">${Math.round(value)}</strong></p>`).join('')}</div>
      <div><h3>Öncelikli gelişim alanları</h3>${analytics.weakest.map(([skill, value]) => `<p><span>${escapeHtml(SKILLS[skill] || skill)}</span><strong class="orange-text">${Math.round(value)}</strong></p>`).join('')}</div>
    </div>
    <h3 class="mt-18">Oyun bazında son 7 gün</h3>
    ${analytics.games.length ? `<div class="analytics-table-wrap"><table class="analytics-table"><thead><tr><th>Oyun</th><th>Soru</th><th>Doğruluk</th><th>İpucu</th><th>Ort. süre</th></tr></thead><tbody>${analytics.games.map((row) => `<tr><td>${escapeHtml(getGame(row.gameId)?.shortTitle || row.gameId)}</td><td>${row.count}</td><td>%${Math.round(row.correct / row.count * 100)}</td><td>${row.hints}</td><td>${Math.round(row.seconds / row.count)} sn</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-state">Bu hafta henüz çalışma yok.</div>'}
  </section>`;
}


function renderRanking() {
  const profile=activeProfile();
  const rows=Array.isArray(window.__KUZENLER_RANKINGS__)?window.__KUZENLER_RANKINGS__:[];
  const scoreSort=(a,b)=>(b.xp||0)-(a.xp||0)||(b.accuracy||0)-(a.accuracy||0)||(b.totalQuestions||0)-(a.totalQuestions||0);
  const sorted=[...rows].sort(scoreSort);
  const sameGrade=sorted.filter(row=>Number(row.grade)===Number(profile.grade));
  const sameAge=sorted.filter(row=>Number(row.age)===Number(profile.age));
  const rankOf=(list)=>list.findIndex(row=>row.learnerId===profile.id);
  const ownIndex=rankOf(sorted);
  const gradeIndex=rankOf(sameGrade);
  const ageIndex=rankOf(sameAge);
  const rankText=(index,total)=>index>=0?`${index+1} / ${total}`:`— / ${total}`;
  return `<main class="app-shell">${topbar()}<section class="section mt-0"><span class="badge orange">Kalıcı gelişim sıralaması</span><h1>Sıralama</h1><p class="muted">Her kart farklı bir karşılaştırma grubunu gösterir. Genel sıralama sistemdeki bütün öğrencileri kapsar.</p></section>
  <section class="metric-grid ranking-metrics">
    <div class="metric-card"><div class="metric-label">Tüm üyeler içinde</div><div class="metric-value">${rankText(ownIndex,sorted.length)}</div><div class="metric-note">Genel sıralama</div></div>
    <div class="metric-card"><div class="metric-label">${profile.grade}. sınıflar içinde</div><div class="metric-value">${rankText(gradeIndex,sameGrade.length)}</div><div class="metric-note">Aynı sınıf seviyesi</div></div>
    <div class="metric-card"><div class="metric-label">${profile.age} yaş grubu içinde</div><div class="metric-value">${rankText(ageIndex,sameAge.length)}</div><div class="metric-note">Aynı yaştaki öğrenciler</div></div>
  </section>
  <section class="section panel"><h2>Genel sıralama</h2><p class="muted">Toplam ${sorted.length} öğrenci.</p>${sorted.length?`<div class="analytics-table-wrap"><table class="analytics-table"><thead><tr><th>Sıra</th><th>Öğrenci</th><th>Yaş</th><th>Sınıf</th><th>XP</th><th>Doğruluk</th><th>Soru</th></tr></thead><tbody>${sorted.slice(0,100).map((row,index)=>`<tr class="${row.learnerId===profile.id?'current-row':''}"><td>${index+1}</td><td>${escapeHtml(row.displayName||row.name||'Öğrenci')}</td><td>${row.age||'—'}</td><td>${row.grade||'—'}</td><td>${formatNumber(row.xp||0)}</td><td>%${row.accuracy||0}</td><td>${row.totalQuestions||0}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty-state">Sıralama verisi ilk senkronizasyondan sonra oluşacak.</div>'}</section>${bottomNav()}</main>`;
}

function renderSocial() {
  const profile = activeProfile();
  if (!profile) return renderProfiles();
  const attempts = attemptsForProfile(state, profile.id);
  const social = socialSnapshot(profile, attempts);
  const orchestra = runAiOrchestra(profile, attempts, { aiProvider: RUNTIME_CONFIG.aiProvider || 'local' });
  const rows = Array.isArray(window.__KUZENLER_RANKINGS__) ? [...window.__KUZENLER_RANKINGS__] : [];
  const weeklyRows = rows.sort((a,b)=>Number(b.weeklyXp||b.xp||0)-Number(a.weeklyXp||a.xp||0));
  const own = weeklyRows.findIndex((row)=>row.learnerId===profile.id);
  return `<main class="app-shell">${topbar()}
    <section class="section mt-0 league-hero"><span class="badge orange">${social.seasonId} Sezonu</span><h1>${social.league.current.icon} ${social.league.current.name} Lig</h1><p>Bu hafta ${social.weeklyXp} XP topladın. ${social.league.next ? `${social.league.next.name} lige ulaşmak için ${Math.max(0,social.league.next.minXp-social.weeklyXp)} XP kaldı.` : 'En üst ligdesin.'}</p><div class="progress-track"><div class="progress-fill" style="width:${social.league.progress}%"></div></div></section>
    <section class="metric-grid">
      <div class="metric-card"><div class="metric-label">Haftalık sıra</div><div class="metric-value">${own>=0?`${own+1} / ${weeklyRows.length}`:'—'}</div><div class="metric-note">Tüm üyeler</div></div>
      <div class="metric-card"><div class="metric-label">Günlük meydan okuma</div><div class="metric-value">${Math.min(social.dailyChallenge.solved,social.dailyChallenge.targetQuestions)}/${social.dailyChallenge.targetQuestions}</div><div class="metric-note">Her soru gelişime işler</div></div>
      <div class="metric-card"><div class="metric-label">AI Koç</div><div class="metric-value">${orchestra.agents.length}</div><div class="metric-note">Hazır uzman ajan</div></div>
    </section>
    <section class="section panel"><div class="section-header"><div><h2>Rozetlerim</h2><p>Rozetler yalnız soru sayısına değil; devamlılık, çeşitlilik ve ipucusuz çözüme göre kazanılır.</p></div></div>${social.badges.length?`<div class="badge-gallery">${social.badges.map((b)=>`<article><span>${b.icon}</span><strong>${escapeHtml(b.name)}</strong><small>${escapeHtml(b.detail)}</small></article>`).join('')}</div>`:'<div class="empty-state">İlk rozetin için 10 meydan okuma sorusunu tamamla.</div>'}</section>
    <section class="section panel"><h2>Haftalık lig tablosu</h2>${weeklyRows.length?`<div class="mobile-rank-list">${weeklyRows.slice(0,30).map((row,index)=>`<article class="${row.learnerId===profile.id?'current-row':''}"><strong>#${index+1} ${escapeHtml(row.displayName||'Öğrenci')}</strong><span>${formatNumber(row.weeklyXp||row.xp||0)} XP</span><small>${row.grade||'—'}. sınıf • ${row.age||'—'} yaş</small></article>`).join('')}</div>`:'<div class="empty-state">Lig tablosu öğrenciler senkronize oldukça oluşacak.</div>'}</section>
    <section class="section panel"><h2>Güvenli sosyal yapı</h2><p class="muted">Öğrenciler birbirlerinin yalnızca görünen adını, sınıfını, yaş grubunu ve puanını görür. Mesajlaşma ve kişisel iletişim bilgileri bu sürümde kapalıdır.</p></section>
    ${bottomNav()}</main>`;
}

function renderParent() {
  if (!ui.parentUnlocked) {
    return `
      <main class="app-shell">
        ${topbar()}
        <div class="pin-screen"><section class="pin-card"><div class="pin-icon">🔐</div><h1>Yerel test ayarları</h1><p>Bu PIN yalnız aynı cihazdaki test profillerini korur; canlı veli hesabı değildir. İlk PIN: 1453.</p><input id="pin-input" type="password" inputmode="numeric" maxlength="8" placeholder="••••" aria-label="Ebeveyn PIN"><button class="primary-button full-width mt-18" data-action="unlock-parent">Giriş Yap</button></section></div>
        ${bottomNav()}
      </main>`;
  }

  const reports = state.profiles
    .flatMap((profile) => reportsForProfile(state, profile.id))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

  return `
    <main class="app-shell">
      ${topbar()}
      <section class="section mt-0">
        <div class="section-header"><div><h2>Yerel test kontrol merkezi</h2><p>Hesap sistemi kapalıdır. Bu cihazdaki demo profillerin süre, doğruluk, ipucu ve soru bildirimlerini gösterir.</p></div><button class="text-button" data-action="lock-parent">Kilitle</button></div>
      </section>
      <section class="section panel deployment-status">
        <div class="section-header"><div><h2>Zihin Arenası çalışma durumu</h2><p>Bu bilgiler <code>KUZENLER_AYARLARI.env</code> dosyasından üretilir.</p></div><span class="badge ${RUNTIME_CONFIG.mode === 'vercel' ? 'green' : 'cyan'}">${RUNTIME_CONFIG.mode === 'vercel' ? 'Vercel modu' : 'Yerel mod'}</span></div>
        <div class="metric-grid">
          <div class="metric-card"><div class="metric-label">İçerik sürümü</div><div class="metric-value">${escapeHtml(RUNTIME_CONFIG.contentVersion)}</div><div class="metric-note">Kalite kurallı soru motoru</div></div>
          <div class="metric-card"><div class="metric-label">Veri sağlayıcı</div><div class="metric-value">${escapeHtml(RUNTIME_CONFIG.dataProvider)}</div><div class="metric-note">${RUNTIME_CONFIG.dataProvider === 'firebase' ? 'Firebase hazırlık ayarı seçili' : 'Bu tarayıcıda yerel kayıt'}</div></div>
          <div class="metric-card"><div class="metric-label">Firebase</div><div class="metric-value">${RUNTIME_CONFIG.firebase?.enabled ? 'Hazırlandı' : 'Kapalı'}</div><div class="metric-note">${RUNTIME_CONFIG.firebase?.projectId ? escapeHtml(RUNTIME_CONFIG.firebase.projectId) : 'Proje kimliği girilmedi'}</div></div>
        </div>
        ${RUNTIME_CONFIG.dataProvider === 'firebase' ? '<p class="warning-note mt-12">Canlı Firebase modu seçildiğinde veli, öğretmen ve öğrenci oturumları zorunlu olarak açılır. Yerel moddaki çalışmalar bu tarayıcıda saklanır ve canlı hesap verisi sayılmaz.</p>' : '<p class="muted mt-12">Yerel mod yalnız bilgisayar ve aile içi test içindir. Canlı Vercel derlemesi DATA_PROVIDER=firebase olmadan güvenlik kontrolünden geçmez.</p>'}
      </section>
      ${state.profiles.map((profile) => renderAnalytics(profile)).join('')}
      ${state.profiles.map((profile) => `
        <section class="section panel">
          <h2>${escapeHtml(profile.avatar)} ${escapeHtml(profile.name)} profil ayarları</h2>
          <div class="form-grid">
            <div class="form-field"><label for="name-${profile.id}">Profil adı</label><input id="name-${profile.id}" data-profile-field="name" data-profile-id="${profile.id}" value="${escapeHtml(profile.name)}"></div>
            <div class="form-field"><label for="age-${profile.id}">Yaş</label><input id="age-${profile.id}" type="number" min="7" max="19" data-profile-field="age" data-profile-id="${profile.id}" value="${profile.age}"></div>
            <div class="form-field"><label for="grade-${profile.id}">Sınıf</label><select id="grade-${profile.id}" data-profile-field="grade" data-profile-id="${profile.id}">${Array.from({length:12},(_,index)=>`<option value="${index+1}" ${profile.grade===index+1?'selected':''}>${index+1}. sınıf</option>`).join('')}</select></div>
            <div class="form-field"><label for="avatar-${profile.id}">Avatar</label><select id="avatar-${profile.id}" data-profile-field="avatar" data-profile-id="${profile.id}">${['🌟','🚀','🧠','🦊','🐼','🦁','🎯','🏆'].map((avatar) => `<option ${avatar === profile.avatar ? 'selected' : ''}>${avatar}</option>`).join('')}</select></div>
            <div class="form-field"><label for="subtitle-${profile.id}">Seviye açıklaması</label><input id="subtitle-${profile.id}" data-profile-field="subtitle" data-profile-id="${profile.id}" value="${escapeHtml(profile.subtitle)}"></div>
          </div>
          <button class="secondary-button full-width mt-18" data-action="save-profile" data-profile-id="${profile.id}">Profili Kaydet</button>
        </section>`).join('')}
      <section class="section panel">
        <div class="section-header"><div><h2>Yeni çocuk / okul pilotu</h2><p>Yerel modda merkezi hesap açılmadan çoklu demo profil kullanılabilir. Şimdilik iki kuzen kullanılır; gerektiğinde yerel pilot profilleri eklenebilir.</p></div><button class="secondary-button" data-action="add-profile">+ Çocuk profili</button></div>
        <div class="form-field mt-18"><label for="student-import-list">Öğretmen isim listesi önizlemesi</label><textarea id="student-import-list" class="story-input" placeholder="Her satır: Ad Soyad;Sınıf;Yaş
Örnek: Ayşe Yılmaz;4;9"></textarea></div>
        <button class="secondary-button full-width mt-12" data-action="import-students">Listeyi yerel pilot profillerine aktar</button>
        <p class="muted mt-12">Bu alan yalnız yerel hızlı test içindir. Canlı modda gerçek öğretmen hesabı, sınıf yetkileri, toplu kayıt ve merkezi Firebase analizi kullanılır.</p>
      </section>
      <section class="section panel">
        <h2>Oyun ayarları</h2>
        <div class="switch-row"><span><strong>Ses efektleri</strong><br><small class="muted">Doğru ve yanlış cevaplarda kısa tonlar.</small></span><label class="switch"><input id="sound-setting" type="checkbox" ${state.settings.sound ? 'checked' : ''}><span></span></label></div>
        <div class="switch-row"><span><strong>Süre göstergesi</strong><br><small class="muted">Süre kapanırsa çocuk baskı olmadan çalışır.</small></span><label class="switch"><input id="timer-setting" type="checkbox" ${state.settings.timer ? 'checked' : ''}><span></span></label></div>
        <div class="form-grid mt-18">
          <div class="form-field"><label for="daily-minutes">Günlük hedef (dakika)</label><input id="daily-minutes" type="number" min="10" max="60" value="${state.settings.dailyMinutes}"></div>
          <div class="form-field"><label for="new-pin">Yeni ebeveyn PIN’i</label><input id="new-pin" type="password" inputmode="numeric" maxlength="8" placeholder="Değiştirmeyecekseniz boş bırakın"></div>
        </div>
        <button class="primary-button full-width mt-18" data-action="save-settings">Ayarları Kaydet</button>
      </section>
      <section class="section panel">
        <div class="section-header"><div><h2>Soru bildirimleri</h2><p>Bildirim otomatik düzeltme yapmaz. Soru o profile hemen kapatılır; verilen cevap ve sistem cevabı inceleme için saklanır.</p></div><span class="badge orange">${reports.length} kayıt</span></div>
        ${reports.length ? `<div class="report-list">${reports.slice(0, 50).map((report) => `<article class="report-item"><div><span class="badge cyan">${escapeHtml(report.profileName || report.profileId)}</span><span class="badge">${escapeHtml(report.gameTitle || report.gameId)}</span><span class="badge ${report.status === 'resolved' ? 'green' : report.status === 'reviewed' ? 'cyan' : 'orange'}">${escapeHtml({pending:'Bekliyor',reviewed:'İncelendi',resolved:'Düzeltildi / kapalı',dismissed:'Geçersiz'}[report.status] || report.status)}</span></div><h3>${escapeHtml(report.prompt)}</h3><p><strong>${escapeHtml({ 'answer-wrong':'Cevap yanlış', ambiguous:'Belirsiz soru', typo:'Yazım hatası', 'too-easy':'Çok kolay', other:'Diğer' }[report.reason] || report.reason)}</strong>${report.note ? ` • ${escapeHtml(report.note)}` : ''}</p><div class="report-answer-grid"><p><small>Çocuğun cevabı</small><br>${escapeHtml(report.userAnswer || 'Cevap verilmeden bildirildi')}</p><p><small>Sistemin cevabı</small><br>${escapeHtml(report.canonicalAnswer || 'Belirtilmedi')}</p></div><small>${escapeHtml(new Date(report.createdAt).toLocaleString('tr-TR'))} • Bu soru profile tekrar gösterilmeyecek.</small><div class="button-row mt-12"><button class="text-button" data-action="report-status" data-report-id="${report.id}" data-status="reviewed">İncelendi</button><button class="text-button" data-action="report-status" data-report-id="${report.id}" data-status="resolved">Düzeltildi</button><button class="text-button" data-action="report-status" data-report-id="${report.id}" data-status="dismissed">Geçersiz</button></div></article>`).join('')}</div>` : '<div class="empty-state">Henüz bildirilmiş soru yok.</div>'}
      </section>
      <section class="section panel">
        <h2>Veri yönetimi</h2>
        <p class="muted">Tüm ilerleme bu cihazın tarayıcısında saklanır. Verileri silmek geri alınamaz.</p>
        <button class="secondary-button full-width" data-action="reset-progress">Tüm ilerlemeyi sıfırla</button>
      </section>
      ${bottomNav()}
    </main>`;
}

function render() {
  clearTimer();
  if (ui.screen === 'profiles') root.innerHTML = renderProfiles();
  if (ui.screen === 'dashboard') root.innerHTML = renderDashboard();
  if (ui.screen === 'library') root.innerHTML = renderLibrary();
  if (ui.screen === 'game') root.innerHTML = renderGame();
  if (ui.screen === 'progress') root.innerHTML = renderProgress();
  if (ui.screen === 'ranking') root.innerHTML = renderRanking();
  if (ui.screen === 'social') root.innerHTML = renderSocial();
  if (ui.screen === 'parent') root.innerHTML = renderParent();
  if (ui.screen === 'game' && ui.session && !ui.session.completed && !ui.feedback && !ui.reportModalOpen && !ui.paused && !ui.toolsOpen && !ui.whiteboardOpen) startTimer();
  if (ui.whiteboardOpen) requestAnimationFrame(initWhiteboard);
}

function navigate(screen) {
  ui.screen = screen;
  ui.feedback = null;
  ui.reportModalOpen = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  render();
}

function recentFamilyIds(profileId, gameId, limit = 30) {
  return attemptsForProfile(state, profileId)
    .filter((attempt) => attempt.gameId === gameId && attempt.familyId)
    .slice(-limit)
    .map((attempt) => attempt.familyId);
}

function startGame(gameId) {
  const profile = activeProfile();
  if (!profile) return;
  const daily = getDailyData(profile);
  const seen = seenQuestionKeysForProfile(state, profile.id);
  let session = createGameSession(gameId, profile, Date.now(), {
    seenQuestionKeys: seen,
    preferredEnglishWordIds: gameId === 'english-vocabulary' ? daily.englishWordIds : [],
    recentFamilyIds: recentFamilyIds(profile.id, gameId)
  });
  if (!session.rounds.length) {
    const blocked = new Set(Object.keys(state.blockedQuestionKeys?.[profile.id] || {}));
    session = createGameSession(gameId, profile, Date.now() + 977, {
      seenQuestionKeys: blocked,
      preferredEnglishWordIds: gameId === 'english-vocabulary' ? daily.englishWordIds : [],
      recentFamilyIds: recentFamilyIds(profile.id, gameId)
    });
    session.reviewMode = true;
    if (session.rounds.length) showToast('Yeni havuz tamamlandı; daha önce görülen sorular aralıklı tekrar amacıyla yeniden karıştırıldı.', 'success');
  }
  if (!session.rounds.length) {
    showToast('Bu oyunda şu anda kullanılabilir soru kalmadı. Bildirilen sorular tekrar gösterilmez.', 'error');
    return;
  }
  session.rewardEligible = true;
  session.startedAt = session.startedAt || Date.now();
  session.sessionId = session.sessionId || `session-${profile.id}-${Date.now()}`;
  ui.session = session;
  ui.screen = 'game';
  resetRoundUi();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  render();
}

function restartGame(gameId) {
  startGame(gameId);
}

function resetRoundUi() {
  ui.feedback = null;
  ui.hintIndex = 0;
  ui.roundData = {};
  const round = ui.session?.rounds?.[ui.session.currentIndex];
  if (round?.kind === 'memory') ui.roundData.memoryVisible = true;
  ui.reportModalOpen = false;
  ui.paused = false;
  ui.pauseStartedAt = null;
  ui.pausedTotalMs = 0;
  ui.toolsOpen = false;
  ui.whiteboardOpen = false;
  ui.timeLeft = roundTimeLimit(round, ui.session?.game?.id);
  if (ui.session) ui.session.roundStartedAt = Date.now();
}

function roundTimeLimit(round, gameId) {
  if (!state.settings.timer) return 0;
  if (round?.timeLimit) return round.timeLimit;
  if (gameId === 'target-number') return activeProfile().age <= 10 ? 240 : 210;
  if (gameId === 'speed-math') return activeProfile().age <= 10 ? 30 : 24;
  if (gameId === 'word-mine') return 150;
  if (gameId === 'forbidden-story') return 240;
  if (gameId === 'word-ladder') return 150;
  if (gameId === 'olympiad-ladder') return activeProfile().age <= 10 ? 180 : 150;
  if (gameId === 'paragraph-detective' || gameId === 'problem-hunter' || gameId === 'lgs-foundation') return 150;
  if (gameId.startsWith('english-')) return 120;
  return 90;
}

function startTimer() {
  if (!state.settings.timer || ui.timeLeft <= 0) return;
  ui.timerId = setInterval(() => {
    ui.timeLeft -= 1;
    const timer = document.querySelector('#timer-pill');
    if (timer) {
      timer.textContent = formatDuration(ui.timeLeft);
      timer.classList.toggle('danger', ui.timeLeft <= 10);
    }
    if (ui.timeLeft <= 0) {
      clearTimer();
      evaluateCurrentRound(null, true);
    }
  }, 1000);
}

function clearTimer() {
  if (ui.timerId) clearInterval(ui.timerId);
  ui.timerId = null;
}

function elapsedSeconds() {
  const activePause = ui.paused && ui.pauseStartedAt ? Date.now() - ui.pauseStartedAt : 0;
  return Math.max(1, Math.round((Date.now() - ui.session.roundStartedAt - ui.pausedTotalMs - activePause) / 1000));
}

function finalizeRound(correct, message, rawScore = correct ? 100 : 25) {
  clearTimer();
  const session = ui.session;
  const round = session.rounds[session.currentIndex];
  const time = elapsedSeconds();
  const score = Math.max(0, Math.round(rawScore - ui.hintIndex * 10));
  const recorded = recordAttempt(state, {
    profileId: activeProfile().id,
    gameId: session.game.id,
    questionKey: round.questionKey,
    skill: round.skill,
    correct,
    difficulty: round.difficulty,
    hintsUsed: ui.hintIndex,
    elapsedSeconds: time,
    score,
    rewardEligible: true,
    familyId: round.familyId || null,
    cognitiveDepth: round.cognitiveDepth || round.difficulty,
    curriculumRole: round.curriculumRole || 'current',
    targetGrade: round.targetGrade || activeProfile().grade,
    qualityScore: round.qualityScore || null,
    calculatorUsed: Boolean(session.calculatorUsed),
    sessionId: session.sessionId
  });
  session.answers[session.currentIndex] = {
    correct,
    score,
    hintsUsed: ui.hintIndex,
    elapsedSeconds: time,
    xp: recorded.xp,
    xpBreakdown: recorded.xpBreakdown,
    questionKey: round.questionKey,
    familyId: round.familyId || null
  };
  session.score += score;
  ui.feedback = { correct, message, xp: recorded.xp, score, xpBreakdown: recorded.xpBreakdown };
  if (correct) {
    playTone(true);
    confetti(18);
  } else {
    playTone(false);
  }
  render();
  requestAnimationFrame(() => document.querySelector('#feedback-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
}

function evaluateCurrentRound(selectedIndex = null, timedOut = false) {
  if (ui.feedback || !ui.session) return;
  const round = ui.session.rounds[ui.session.currentIndex];
  if (timedOut) {
    finalizeRound(false, `Süre doldu. ${round.explanation}`, 15);
    return;
  }

  if (round.kind === 'choice' || round.kind === 'memory') {
    if (round.kind === 'memory' && ui.roundData.memoryVisible !== false) { showToast('Önce diziyi gizleyip soruyu açmalısın.', 'error'); return; }
    ui.roundData.selectedIndex = selectedIndex;
    const correct = selectedIndex === round.answerIndex;
    finalizeRound(correct, correct ? round.explanation : `Doğru yaklaşım: ${round.explanation}`);
    return;
  }

  if (round.kind === 'expression') {
    const expression = expressionString().trim();
    if (!expression) {
      showToast('Önce sayı ve işlem işaretlerine dokunarak bir işlem kurmalısın.', 'error');
      return;
    }
    const result = validateTargetExpression(expression, round.numbers, round.target);
    finalizeRound(result.valid, result.valid ? round.explanation : `${result.reason} Örnek çözüm: ${round.solution}`, result.valid ? 100 : 20);
    return;
  }

  if (round.kind === 'wordMine') {
    const words = ui.roundData.words || [];
    const target = activeProfile().age <= 10 ? 5 : 8;
    const correct = words.length >= target;
    const wordPoints = words.reduce((sum, item) => sum + item.score, 0);
    const normalized = Math.min(100, Math.round((words.length / target) * 70 + Math.min(30, wordPoints / 10)));
    finalizeRound(correct, `${words.length} kelime ve ${wordPoints} kelime puanı topladın. ${round.explanation}`, normalized);
    return;
  }

  if (round.kind === 'wordLadder') {
    const inputs = [...document.querySelectorAll('[data-ladder-index]')].map((input) => input.value.trim());
    ui.roundData.ladderInputs = inputs;
    const result = validateLadder(round.start, inputs, round.end, round.dictionary);
    finalizeRound(result.valid, result.valid ? `Doğru yol: ${round.explanation}` : `${result.reason} Örnek yol: ${round.explanation}`, result.valid ? 100 : 20);
    return;
  }

  if (round.kind === 'story') {
    const text = document.querySelector('#story-input')?.value?.trim() || '';
    ui.roundData.story = text;
    const forbidden = containsForbiddenLetter(text, round.forbiddenLetter);
    const sentences = sentenceCount(text);
    const unique = uniqueWordCount(text);
    const correct = !forbidden && sentences >= round.minSentences && unique >= round.minUniqueWords;
    const parts = [
      forbidden ? `“${round.forbiddenLetter.toLocaleUpperCase('tr-TR')}” harfi kullanılmış.` : 'Yasak harf kullanılmadı.',
      `${sentences}/${round.minSentences} cümle`,
      `${unique}/${round.minUniqueWords} farklı kelime`
    ];
    const rawScore = Math.min(100, (forbidden ? 0 : 45) + Math.min(25, (sentences / round.minSentences) * 25) + Math.min(30, (unique / round.minUniqueWords) * 30));
    finalizeRound(correct, parts.join(' • '), rawScore);
  }
}

function addWord() {
  if (ui.feedback) return;
  const round = ui.session.rounds[ui.session.currentIndex];
  const input = document.querySelector('#word-input');
  const value = input?.value || '';
  const used = (ui.roundData.words || []).map((item) => item.word);
  const result = validateWordMine(round.source, value, round.dictionary || round.allowed, used);
  if (!result.valid) {
    showToast(result.reason, 'error');
    playTone(false);
    return;
  }
  ui.roundData.words = [...(ui.roundData.words || []), { word: result.word, score: result.score }];
  showToast(`“${result.word}” eklendi: +${result.score}`, 'success');
  playTone(true, 0.05);
  render();
  setTimeout(() => document.querySelector('#word-input')?.focus(), 20);
}

function nextRound() {
  const session = ui.session;
  if (session.currentIndex >= session.rounds.length - 1) {
    session.completed = true;
    completeGameSession(state, activeProfile().id, session.game.id, session.score, session.rounds.length * 100);
    clearTimer();
    render();
    return;
  }
  session.currentIndex += 1;
  resetRoundUi();
  render();
  requestAnimationFrame(() => document.querySelector('.question-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
}

function showHint() {
  const round = ui.session.rounds[ui.session.currentIndex];
  if (!round.hints?.length || ui.hintIndex >= round.hints.length) return;
  ui.hintIndex += 1;
  playTone(true, 0.03);
  render();
}

function toggleExpressionNumber(numberIndex) {
  if (ui.feedback || !ui.session) return;
  const round = ui.session.rounds[ui.session.currentIndex];
  const tokens = currentExpressionTokens();
  const existingIndex = tokens.findIndex((token) => token.type === 'number' && token.numberIndex === numberIndex);
  if (existingIndex >= 0) tokens.splice(existingIndex, 1);
  else tokens.push({ type: 'number', value: String(round.numbers[numberIndex]), numberIndex });
  render();
}

function addExpressionSymbol(symbol) {
  if (ui.feedback) return;
  const normalized = symbol === '−' ? '-' : symbol;
  currentExpressionTokens().push({ type: 'symbol', value: normalized });
  render();
}

function removeExpressionToken(index) {
  if (ui.feedback) return;
  currentExpressionTokens().splice(index, 1);
  render();
}

function saveCurrentQuestionReport() {
  if (!ui.session) return;
  const round = ui.session.rounds[ui.session.currentIndex];
  const reason = document.querySelector('#report-reason')?.value || 'other';
  const note = document.querySelector('#report-note')?.value?.trim() || '';
  reportQuestion(state, {
    profileId: activeProfile().id,
    profileName: activeProfile().name,
    gameId: ui.session.game.id,
    gameTitle: ui.session.game.title,
    questionKey: round.questionKey,
    prompt: round.prompt,
    context: round.context || '',
    userAnswer: selectedAnswerText(round),
    canonicalAnswer: canonicalAnswerText(round),
    explanation: round.explanation || '',
    wasAnswered: Boolean(ui.feedback),
    wasCorrect: ui.feedback?.correct ?? null,
    responseSeconds: elapsedSeconds(),
    hintCount: ui.hintIndex || 0,
    difficulty: round.difficulty || null,
    grade: activeProfile().grade,
    reason,
    note
  });
  ui.reportModalOpen = false;
  showToast('Bildirim kaydedildi. Soru bu profile kapatıldı; otomatik içerik değişikliği yapılmadı.', 'success');
  render();
}

function showToast(message, type = '') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastRoot.replaceChildren(toast);
  setTimeout(() => toast.remove(), 2600);
}

function askUserConfirm({title='İşlemi onayla',message,confirmText='Onayla',danger=false}) {
  return new Promise((resolve) => {
    document.querySelector('#app-confirm-modal')?.remove();
    const wrapper=document.createElement('div');
    wrapper.id='app-confirm-modal';
    wrapper.className='app-confirm-backdrop';
    wrapper.innerHTML=`<section class="app-confirm-modal" role="dialog" aria-modal="true"><div class="app-confirm-icon">${danger?'⚠️':'✓'}</div><h2>${title}</h2><p>${message}</p><div class="app-confirm-actions"><button class="secondary-button" data-confirm-result="cancel">Vazgeç</button><button class="${danger?'danger-button':'primary-button'}" data-confirm-result="ok">${confirmText}</button></div></section>`;
    document.body.appendChild(wrapper);
    const finish=(result)=>{wrapper.remove();resolve(result);};
    wrapper.addEventListener('click',(event)=>{const result=event.target.closest('[data-confirm-result]')?.dataset.confirmResult;if(result)finish(result==='ok');else if(event.target===wrapper)finish(false);});
    wrapper.querySelector('[data-confirm-result="ok"]')?.focus();
  });
}

function playTone(success, duration = 0.09) {
  if (!state.settings.sound) return;
  try {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = success ? 660 : 210;
    gain.gain.setValueAtTime(0.07, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  } catch {
    // Ses API'si desteklenmiyorsa oyun sessiz devam eder.
  }
}

function confetti(count = 20) {
  const layer = document.createElement('div');
  layer.className = 'confetti';
  const colors = ['#f97316', '#22d3ee', '#a78bfa', '#34d399', '#facc15'];
  for (let index = 0; index < count; index += 1) {
    const piece = document.createElement('i');
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[index % colors.length];
    piece.style.animationDelay = `${Math.random() * 0.35}s`;
    layer.append(piece);
  }
  document.body.append(layer);
  setTimeout(() => layer.remove(), 2200);
}

function saveProfileFromForm(profileId) {
  const fields = [...document.querySelectorAll(`[data-profile-id="${profileId}"][data-profile-field]`)];
  const updates = {};
  for (const field of fields) updates[field.dataset.profileField] = ['age','grade'].includes(field.dataset.profileField) ? Number(field.value) : field.value.trim();
  if (!updates.name || updates.age < 6 || updates.age > 19 || updates.grade < 1 || updates.grade > 12) {
    showToast('Profil adı, 6–19 arası yaş ve 1–12 arası sınıf gereklidir.', 'error');
    return;
  }
  updateProfile(state, profileId, updates);
  showToast('Profil kaydedildi.', 'success');
  render();
}

function saveSettingsFromForm() {
  const pin = document.querySelector('#new-pin')?.value.trim();
  const dailyMinutes = Number(document.querySelector('#daily-minutes')?.value || 20);
  const updates = {
    sound: Boolean(document.querySelector('#sound-setting')?.checked),
    timer: Boolean(document.querySelector('#timer-setting')?.checked),
    dailyMinutes: Math.min(60, Math.max(10, dailyMinutes))
  };
  if (pin) {
    if (!/^\d{4,8}$/.test(pin)) {
      showToast('PIN 4–8 rakam olmalıdır.', 'error');
      return;
    }
    updates.parentPin = pin;
  }
  updateSettings(state, updates);
  showToast('Ayarlar kaydedildi.', 'success');
  render();
}

root.addEventListener('click', async (event) => {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action;

  if (action === 'add-profile') {
    addProfile(state, { grade: 1, age: 6 });
    showToast('Yeni çocuk profili eklendi. Adını, yaşını ve sınıfını düzenle.', 'success');
    render();
  }
  if (action === 'import-students') {
    const lines = (document.querySelector('#student-import-list')?.value || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    let added = 0;
    for (const line of lines.slice(0, 40)) {
      const [name, gradeRaw, ageRaw] = line.split(';').map((part) => part?.trim());
      const grade = Math.max(1, Math.min(12, Number(gradeRaw || 1)));
      const age = Math.max(6, Math.min(19, Number(ageRaw || grade + 5)));
      if (!name) continue;
      addProfile(state, { name, grade, age, subtitle: `${grade}. Sınıf • Okul Pilotu`, avatar: '🎯' });
      added += 1;
    }
    showToast(`${added} yerel pilot profili eklendi.`, added ? 'success' : 'error');
    render();
  }
  if (action === 'select-profile') {
    setActiveProfile(state, target.dataset.profileId);
    navigate('dashboard');
  }
  if (action === 'return-platform') { sessionStorage.removeItem('kuzenler-play-learner'); location.reload(); return; }
  if (action === 'student-profile') { if (ui.session && !ui.feedback && !await askUserConfirm({title:'Profile dön',message:'Çözülen sorular kaydedildi. Aktif tur kapatılacak.',confirmText:'Profile dön'})) return; ui.session=null; navigate('progress'); return; }
  if (action === 'student-logout') { if (!await askUserConfirm({title:'Oturumu kapat',message:'Çözülen bütün sorular kaydedildi. Bu cihazdaki öğrenci oturumu kapatılacak.',confirmText:'Çıkış yap',danger:true})) return; clearTimer(); ui.session=null; sessionStorage.removeItem('kuzenler-play-learner'); sessionStorage.removeItem('kuzenler-active-learner'); if (PLATFORM.mode==='live') { window.dispatchEvent(new CustomEvent('kuzenler:student-logout',{detail:{state}})); root.innerHTML='<main class="platform-shell auth-shell"><section class="auth-card"><h1>Oturum kapatılıyor…</h1><p>Son gelişim kayıtları Firebase’e aktarılıyor.</p></section></main>'; } else { state.activeProfileId=null; navigate('profiles'); } return; }
  if (action === 'toggle-pause') { togglePause(); return; }
  if (action === 'open-tools') { ui.toolsOpen=true; ui.whiteboardOpen=false; clearTimer(); render(); return; }
  if (action === 'close-tools') { ui.toolsOpen=false; ui.whiteboardOpen=false; render(); return; }
  if (action === 'open-whiteboard') { ui.toolsOpen=false; ui.whiteboardOpen=true; clearTimer(); render(); return; }
  if (action === 'calculator-key') { calculatorKey(target.dataset.key); return; }
  if (action === 'calculator-equals') { calculatorEquals(); return; }
  if (action === 'whiteboard-clear') { const c=document.querySelector('#whiteboard-canvas'); c?.getContext('2d')?.clearRect(0,0,c.width,c.height); return; }
  if (action === 'profiles') navigate('profiles');
  if (action === 'navigate') navigate(target.dataset.screen);
  if (action === 'filter') { ui.filter = target.dataset.filter; render(); }
  if (action === 'start-game') startGame(target.dataset.gameId);
  if (action === 'restart-game') restartGame(target.dataset.gameId);
  if (action === 'choose-answer') evaluateCurrentRound(Number(target.dataset.index));
  if (action === 'check-answer') evaluateCurrentRound();
  if (action === 'toggle-expression-number') toggleExpressionNumber(Number(target.dataset.numberIndex));
  if (action === 'add-expression-symbol') addExpressionSymbol(target.dataset.symbol);
  if (action === 'remove-expression-token') removeExpressionToken(Number(target.dataset.tokenIndex));
  if (action === 'undo-expression') { currentExpressionTokens().pop(); render(); }
  if (action === 'clear-expression') { ui.roundData.expressionTokens = []; render(); }
  if (action === 'hide-memory') { ui.roundData.memoryVisible = false; ui.session.roundStartedAt = Date.now(); ui.timeLeft = roundTimeLimit(ui.session.rounds[ui.session.currentIndex], ui.session.game.id); render(); }
  if (action === 'add-word-order-token') { ui.roundData.wordOrderSelected ||= []; if (!ui.roundData.wordOrderSelected.includes(target.dataset.tokenId)) ui.roundData.wordOrderSelected.push(target.dataset.tokenId); render(); }
  if (action === 'remove-word-order-token') { ui.roundData.wordOrderSelected ||= []; ui.roundData.wordOrderSelected.splice(Number(target.dataset.tokenPosition), 1); render(); }
  if (action === 'clear-word-order') { ui.roundData.wordOrderSelected = []; render(); }
  if (action === 'add-ladder-step') { ui.roundData.ladderInputs ||= []; ui.roundData.ladderInputs.push(''); render(); }
  if (action === 'remove-ladder-step') { ui.roundData.ladderInputs ||= []; if (ui.roundData.ladderInputs.length > 1) ui.roundData.ladderInputs.pop(); render(); }
  if (action === 'open-report') { ui.reportModalOpen = true; render(); }
  if (action === 'close-report') { ui.reportModalOpen = false; render(); }
  if (action === 'save-question-report') saveCurrentQuestionReport();
  if (action === 'add-word') addWord();
  if (action === 'hint') showHint();
  if (action === 'next-round') nextRound();
  if (action === 'quit-game') {
    if (await askUserConfirm({title:'Oyundan çık',message:'Bu tur tamamlanmadan ana sayfaya dönülecek. Verilmiş cevaplar korunur.',confirmText:'Oyundan çık',danger:true})) {
      ui.session = null;
      navigate('dashboard');
    }
  }
  if (action === 'back') navigate('dashboard');
  if (action === 'unlock-parent') {
    const pin = document.querySelector('#pin-input')?.value || '';
    if (pin === state.settings.parentPin) {
      ui.parentUnlocked = true;
      showToast('Ebeveyn alanı açıldı.', 'success');
      render();
    } else showToast('PIN doğru değil.', 'error');
  }
  if (action === 'lock-parent') { ui.parentUnlocked = false; render(); }
  if (action === 'save-profile') saveProfileFromForm(target.dataset.profileId);
  if (action === 'save-settings') saveSettingsFromForm();
  if (action === 'report-status') {
    updateQuestionReportStatus(state, target.dataset.reportId, target.dataset.status);
    showToast('Bildirim durumu güncellendi.', 'success');
    render();
  }
  if (action === 'reset-progress') {
    if (await askUserConfirm({title:'İlerlemeyi sıfırla',message:'Tüm profil ilerlemeleri, XP ve geçmiş kalıcı olarak silinecek.',confirmText:'Tümünü sıfırla',danger:true})) {
      resetProgress(state);
      ui.parentUnlocked = false;
      ui.session = null;
      ui.screen = 'profiles';
      showToast('İlerleme sıfırlandı.', 'success');
      render();
    }
  }
  if (action === 'install' && ui.deferredInstallPrompt) {
    ui.deferredInstallPrompt.prompt();
    await ui.deferredInstallPrompt.userChoice;
    ui.deferredInstallPrompt = null;
    render();
  }
});

root.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && event.target.id === 'word-input') {
    event.preventDefault();
    addWord();
  }
  if (event.key === 'Enter' && event.target.id === 'pin-input') {
    event.preventDefault();
    document.querySelector('[data-action="unlock-parent"]')?.click();
  }
});

root.addEventListener('input', (event) => {
  if (event.target.id === 'story-input') ui.roundData.story = event.target.value;
  if (event.target.matches('[data-ladder-index]')) {
    const index = Number(event.target.dataset.ladderIndex);
    ui.roundData.ladderInputs ||= [];
    ui.roundData.ladderInputs[index] = event.target.value.toLocaleUpperCase('tr-TR');
    event.target.value = ui.roundData.ladderInputs[index];
  }
});

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  ui.deferredInstallPrompt = event;
  render();
});

window.addEventListener('hashchange', () => {
  const screen = location.hash.replace('#', '');
  const allowed = PLATFORM.mode === 'live' ? ['dashboard','library','progress','ranking','social'] : ['dashboard','library','progress','ranking','social','parent'];
  if (allowed.includes(screen) && state.activeProfileId) navigate(screen);
});

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch((error) => console.warn('Service worker kaydı başarısız:', error)));
}

render();
