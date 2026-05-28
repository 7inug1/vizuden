import { useState, useEffect } from 'react';

// ── 모듈 레벨 reactive store ────────────────────────────────────
// React Context 없이 어디서든 사용 가능.
// PrescriptionPage (언마운트 후에도 async 함수 계속 실행)에서 업데이트,
// PrescriptionResultPage에서 구독.

const INITIAL = {
  status: 'idle',           // 'idle' | 'streaming' | 'done' | 'error'
  fromType: null,
  fitPics: [],
  reportId: undefined,
  title: undefined,
  direction: undefined,
  criteria: undefined,
  bodyGuide: undefined,
  stylingFormula: undefined,
  formulasPartial: null,    // 섹션 완성 전 완료된 formula 아이템들
  shopping_criteria: undefined,
  shoppingItemsPartial: null, // 섹션 완성 전 완료된 shopping item들
  hair_grooming: undefined,
  color_guide: undefined,
  styling_snapshot: undefined,
  closing: undefined,
  errorCode: null,          // 'quota' | 'invite_invalid' | null
};

let _state = { ...INITIAL };
const _listeners = new Set();

export function getPrescriptionStream() {
  return _state;
}

export function setPrescriptionStream(updates) {
  _state = { ..._state, ...updates };
  _listeners.forEach((fn) => fn(_state));
}

export function resetPrescriptionStream() {
  _state = { ...INITIAL };
  _listeners.forEach((fn) => fn(_state));
}

export function usePrescriptionStream() {
  const [state, setState] = useState(_state);
  useEffect(() => {
    setState(_state); // 최신 상태로 동기화
    _listeners.add(setState);
    return () => _listeners.delete(setState);
  }, []);
  return state;
}

// ── 스트림 텍스트에서 완성된 JSON 섹션 추출 ────────────────────
// SSE delta가 쌓일 때마다 호출. 완성된 필드만 파싱해 반환.

export function tryExtractSections(text) {
  const result = {};

  // ① 단순 문자열 필드
  for (const key of ['title', 'direction', 'bodyGuide', 'closing']) {
    const re = new RegExp(`"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`, 's');
    const m = text.match(re);
    if (m) {
      try { result[key] = JSON.parse(`"${m[1]}"`); } catch { /* 파싱 실패 시 무시 */ }
    }
  }

  // ② 객체/배열 필드 — 균형 괄호 스캐너
  const complexKeys = {
    criteria: '[',
    stylingFormula: '{',
    shopping_criteria: '{',
    hair_grooming: '{',
    color_guide: '{',
    styling_snapshot: '{',
  };

  for (const [key, openBracket] of Object.entries(complexKeys)) {
    const keyRe = new RegExp(`"${key}"\\s*:\\s*\\${openBracket}`);
    const m = text.match(keyRe);
    if (!m) continue;
    const startIdx = text.indexOf(m[0]) + m[0].length - 1;
    const extracted = _scanBalanced(text, startIdx);
    if (extracted) {
      try { result[key] = JSON.parse(extracted); } catch { /* 파싱 실패 시 무시 */ }
    }
  }

  // ③ 부분 배열 추출 — 섹션 완성 전 아이템 단위 점진적 표시용
  if (!('stylingFormula' in result)) {
    const partial = _scanPartialObjectArray(text, 'formulas');
    if (partial !== null) result.formulasPartial = partial;
  }
  if (!('shopping_criteria' in result)) {
    const partial = _scanPartialObjectArray(text, 'items');
    if (partial !== null) result.shoppingItemsPartial = partial;
  }

  return result;
}

function _scanBalanced(text, startIdx) {
  let depth = 0;
  let inStr = false;
  let escaped = false;

  for (let i = startIdx; i < text.length; i++) {
    const ch = text[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\' && inStr) { escaped = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === '{' || ch === '[') depth++;
    else if (ch === '}' || ch === ']') {
      depth--;
      if (depth === 0) return text.slice(startIdx, i + 1);
    }
  }
  return null; // 아직 완성 안 됨
}

// 배열 내 완성된 {...} 객체들을 순서대로 추출.
// 섹션 전체가 완성되기 전에 각 아이템을 점진적으로 보여주기 위해 사용.
function _scanPartialObjectArray(text, arrayKey) {
  const keyRe = new RegExp(`"${arrayKey}"\\s*:\\s*\\[`);
  const m = text.match(keyRe);
  if (!m) return null; // 배열 시작 전

  // '[' 다음 위치
  let i = text.indexOf(m[0]) + m[0].length;
  const items = [];

  // 공백 건너뜀
  while (i < text.length && /\s/.test(text[i])) i++;

  while (i < text.length) {
    if (text[i] === ']') break; // 배열 완료
    if (text[i] === '{') {
      const obj = _scanBalanced(text, i);
      if (!obj) break; // 미완성 객체 — 여기서 멈춤
      try { items.push(JSON.parse(obj)); } catch { /* 파싱 오류 무시 */ }
      i += obj.length;
      // 콤마와 공백 건너뜀
      while (i < text.length && /[,\s]/.test(text[i])) i++;
    } else {
      i++;
    }
  }

  return items.length > 0 ? items : null;
}
