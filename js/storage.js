const STORAGE_KEY = 'kuzenler-yarisiyor-state-v5';
const LEGACY_STORAGE_KEY = 'yokus-kuzenler-state-v2';
const LEGACY_STORAGE_KEY_2 = 'yokus-kuzenler-state-v1';

function getStorage() {
  try {
    return typeof globalThis !== 'undefined' && globalThis.localStorage ? globalThis.localStorage : null;
  } catch {
    return null;
  }
}

export function loadStoredState() {
  try {
    const storage = getStorage();
    if (!storage) return null;
    const raw = storage.getItem(STORAGE_KEY) || storage.getItem(LEGACY_STORAGE_KEY) || storage.getItem(LEGACY_STORAGE_KEY_2);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn('Kayıt okunamadı:', error);
    return null;
  }
}

export function saveStoredState(state) {
  try {
    const storage = getStorage();
    if (!storage) return false;
    const durableState = {
      version: state.version,
      profiles: state.profiles,
      settings: state.settings,
      attempts: state.attempts.slice(-5000),
      daily: state.daily,
      badges: state.badges,
      activeProfileId: state.activeProfileId,
      seenQuestions: state.seenQuestions,
      questionReports: state.questionReports.slice(-500),
      questionHealth: state.questionHealth || {},
      blockedQuestionKeys: state.blockedQuestionKeys || {},
      blockedQuestionFamilies: state.blockedQuestionFamilies || {},
      platform: state.platform || {}
    };
    storage.setItem(STORAGE_KEY, JSON.stringify(durableState));
    if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') window.dispatchEvent(new CustomEvent('kuzenler:state-saved', { detail: durableState }));
    return true;
  } catch (error) {
    console.warn('Kayıt yazılamadı:', error);
    return false;
  }
}

export function clearStoredState() {
  const storage = getStorage();
  if (!storage) return false;
  storage.removeItem(STORAGE_KEY);
  storage.removeItem(LEGACY_STORAGE_KEY);
  storage.removeItem(LEGACY_STORAGE_KEY_2);
  return true;
}
