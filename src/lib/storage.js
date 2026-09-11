export const STORAGE_KEYS = {
  authRedirect: 'vizuden_auth_redirect',
  translatorAccessCode: 'vizuden_translator_access_code',
  guestSessionId: 'vizuden_guest_session_id',
  guestMode: 'vizuden_guest_mode',
  nickname: 'vizuden_nickname',
  nicknamePromptVisits: 'vizuden_home_visits_without_nickname',
  noticeDismissed: 'vizuden_notice_dismissed_v2',
  onboardingDone: 'vizuden_onboarding_done',
  prescriptionAccessCode: 'vizuden_access_code',
  trackingSessionId: 'vizuden_tracking_session_id',
  welcomeDone: 'vizuden_welcome_done',
};

function safeGetStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function safeGetSessionStorage() {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function getStoredBoolean(key) {
  const storage = safeGetStorage();
  return storage?.getItem(key) === 'true';
}

export function setStoredBoolean(key, value) {
  const storage = safeGetStorage();
  storage?.setItem(key, value ? 'true' : 'false');
}

export function removeStoredValue(key) {
  const storage = safeGetStorage();
  storage?.removeItem(key);
}

export function getStoredCount(key, fallback = 0) {
  const storage = safeGetStorage();
  const value = parseInt(storage?.getItem(key) ?? '', 10);
  return Number.isNaN(value) ? fallback : value;
}

export function setStoredCount(key, value) {
  const storage = safeGetStorage();
  storage?.setItem(key, String(value));
}

export function getStoredString(key) {
  const storage = safeGetStorage();
  return storage?.getItem(key) ?? null;
}

export function setStoredString(key, value) {
  const storage = safeGetStorage();
  storage?.setItem(key, value);
}

export function getStoredSessionString(key) {
  const storage = safeGetSessionStorage();
  return storage?.getItem(key) ?? null;
}

export function setStoredSessionString(key, value) {
  const storage = safeGetSessionStorage();
  storage?.setItem(key, value);
}

export function removeStoredSessionValue(key) {
  const storage = safeGetSessionStorage();
  storage?.removeItem(key);
}

export function ensureGuestSessionId() {
  const existing = getStoredString(STORAGE_KEYS.guestSessionId);
  if (existing) return existing;
  const next = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `guest_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  setStoredString(STORAGE_KEYS.guestSessionId, next);
  return next;
}

export function ensureTrackingSessionId() {
  const existing = getStoredSessionString(STORAGE_KEYS.trackingSessionId);
  if (existing) return existing;
  const next = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  setStoredSessionString(STORAGE_KEYS.trackingSessionId, next);
  return getStoredSessionString(STORAGE_KEYS.trackingSessionId) ?? ensureGuestSessionId();
}
