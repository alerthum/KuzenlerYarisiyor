const STORAGE_KEY = 'kuzenler-yarisiyor-state-v5';
const LEGACY_STORAGE_KEY = 'yokus-kuzenler-state-v2';
const LEGACY_STORAGE_KEY_2 = 'yokus-kuzenler-state-v1';

export function loadStoredState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY_2);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn('Kayıt okunamadı:', error);
    return null;
  }
}

export function saveStoredState(state) {
  try {
    const durableState = {
      version: state.version,
      profiles: state.profiles,
      settings: state.settings,
      attempts: state.attempts.slice(-1200),
      daily: state.daily,
      badges: state.badges,
      activeProfileId: state.activeProfileId,
      seenQuestions: state.seenQuestions,
      questionReports: state.questionReports.slice(-500),
      blockedQuestionKeys: state.blockedQuestionKeys || {},
      platform: state.platform || {}
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(durableState));
    if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') window.dispatchEvent(new CustomEvent('kuzenler:state-saved', { detail: durableState }));
  } catch (error) {
    console.warn('Kayıt yazılamadı:', error);
  }
}

export function clearStoredState() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
  localStorage.removeItem(LEGACY_STORAGE_KEY_2);
}
