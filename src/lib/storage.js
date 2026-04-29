export const STORAGE_KEYS = {
  authRedirect: 'vizuden_auth_redirect',
  guestSessionId: 'vizuden_guest_session_id',
  guestMode: 'vizuden_guest_mode',
  nickname: 'vizuden_nickname',
  nicknamePromptVisits: 'vizuden_home_visits_without_nickname',
  noticeDismissed: 'vizuden_notice_dismissed_v2',
  onboardingDone: 'vizuden_onboarding_done',
  trackingSessionId: 'vizuden_tracking_session_id',
  welcomeDone: 'vizuden_welcome_done',
};

export function getStoredBoolean(key) {
  return localStorage.getItem(key) === 'true';
}

export function setStoredBoolean(key, value) {
  localStorage.setItem(key, value ? 'true' : 'false');
}

export function removeStoredValue(key) {
  localStorage.removeItem(key);
}

export function getStoredCount(key, fallback = 0) {
  const value = parseInt(localStorage.getItem(key) ?? '', 10);
  return Number.isNaN(value) ? fallback : value;
}

export function setStoredCount(key, value) {
  localStorage.setItem(key, String(value));
}

export function getStoredString(key) {
  return localStorage.getItem(key);
}

export function setStoredString(key, value) {
  localStorage.setItem(key, value);
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
  try {
    const existing = sessionStorage.getItem(STORAGE_KEYS.trackingSessionId);
    if (existing) return existing;
    const next = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(STORAGE_KEYS.trackingSessionId, next);
    return next;
  } catch {
    return ensureGuestSessionId();
  }
}
