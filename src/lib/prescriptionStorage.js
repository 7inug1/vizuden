const CURRENT_KEY = 'vizuden_prescription';
const CURRENT_HISTORY_KEY = 'vizuden_prescription_history';

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function readPrescriptionSaved() {
  return readJson(CURRENT_KEY, null);
}

export function writePrescriptionSaved(value) {
  localStorage.setItem(CURRENT_KEY, JSON.stringify(value));
}

export function readPrescriptionHistory() {
  const current = readJson(CURRENT_HISTORY_KEY, []);
  return Array.isArray(current) ? current : [];
}

export function writePrescriptionHistory(value) {
  localStorage.setItem(CURRENT_HISTORY_KEY, JSON.stringify(value));
}
