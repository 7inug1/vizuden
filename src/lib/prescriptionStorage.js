const CURRENT_KEY = 'vizuden_prescription';
const CURRENT_HISTORY_KEY = 'vizuden_prescription_history';

function getStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readJson(key, fallback) {
  try {
    const raw = getStorage()?.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function readPrescriptionSaved() {
  return readJson(CURRENT_KEY, null);
}

export function writePrescriptionSaved(value) {
  try {
    getStorage()?.setItem(CURRENT_KEY, JSON.stringify(value));
  } catch {}
}

export function readPrescriptionHistory() {
  const current = readJson(CURRENT_HISTORY_KEY, []);
  return Array.isArray(current) ? current : [];
}

export function writePrescriptionHistory(value) {
  try {
    getStorage()?.setItem(CURRENT_HISTORY_KEY, JSON.stringify(value));
  } catch {}
}
