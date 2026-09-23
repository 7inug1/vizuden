import { useState, useEffect } from 'react';

const INITIAL = {
  status: 'idle',      // 'idle' | 'streaming' | 'done' | 'error'
  intakeId: null,
  subtitle: undefined,
  translation: undefined,
  mirror: undefined,
  identity: undefined,
  direction: undefined,
  fit: undefined,
  color: undefined,
  brands: undefined,
  tpo: undefined,
  plan: undefined,
  closing: undefined,
  products: undefined,
};

let _state = { ...INITIAL };
const _listeners = new Set();

export function getConsultingReportStream() { return _state; }

export function setConsultingReportStream(updates) {
  _state = { ..._state, ...updates };
  _listeners.forEach((fn) => fn(_state));
}

export function resetConsultingReportStream() {
  _state = { ...INITIAL };
  _listeners.forEach((fn) => fn(_state));
}

export function useConsultingReportStream() {
  const [state, setState] = useState(_state);
  useEffect(() => {
    setState(_state);
    _listeners.add(setState);
    return () => _listeners.delete(setState);
  }, []);
  return state;
}

// ── 균형 괄호 스캐너 (완성된 객체) ──────────────────────────────
function _scanBalanced(text, startIdx) {
  let depth = 0, inStr = false, escaped = false;
  for (let i = startIdx; i < text.length; i++) {
    const ch = text[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\' && inStr) { escaped = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === '{' || ch === '[') depth++;
    else if (ch === '}' || ch === ']') { depth--; if (depth === 0) return text.slice(startIdx, i + 1); }
  }
  return null;
}

// ── 부분(미완성) JSON 복구 파서 — 스트리밍 중 실시간 표시용 ──────
// startIdx의 '{'부터 끝까지 훑으며 열린 문자열·괄호를 닫아 파싱 가능한 형태로 복구.
function _repairPartial(text, startIdx) {
  const stack = [];
  let inStr = false, escaped = false, result = '';
  let lastValidLen = 0; // 값이 안전하게 끝난 지점(} ] " 또는 콤마 직전)
  for (let i = startIdx; i < text.length; i++) {
    const ch = text[i];
    result += ch;
    if (escaped) { escaped = false; continue; }
    if (ch === '\\' && inStr) { escaped = true; continue; }
    if (ch === '"') { inStr = !inStr; if (!inStr) lastValidLen = result.length; continue; }
    if (inStr) continue;
    if (ch === '{') stack.push('}');
    else if (ch === '[') stack.push(']');
    else if (ch === '}' || ch === ']') { stack.pop(); lastValidLen = result.length; }
    else if (ch === ',') lastValidLen = result.length - 1; // 콤마 앞까지가 안전
    else if (/[0-9truefalsn.]/.test(ch)) lastValidLen = result.length; // 숫자·bool·null 진행 중
  }
  // 안전한 지점까지 자르고, 열린 문자열/괄호를 닫음
  let candidate = result;
  const tail = () => {
    let s = candidate;
    // 열린 문자열이면 닫기
    let open = false, esc = false;
    for (let i = 0; i < s.length; i++) {
      if (esc) { esc = false; continue; }
      if (s[i] === '\\' && open) { esc = true; continue; }
      if (s[i] === '"') open = !open;
    }
    if (open) s += '"';
    // 남은 콤마·콜론 정리
    s = s.replace(/[,\s]*$/, '').replace(/:\s*$/, ':null');
    // 괄호 닫기
    const st2 = [];
    let inS = false, es = false;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (es) { es = false; continue; }
      if (c === '\\' && inS) { es = true; continue; }
      if (c === '"') { inS = !inS; continue; }
      if (inS) continue;
      if (c === '{') st2.push('}');
      else if (c === '[') st2.push(']');
      else if (c === '}' || c === ']') st2.pop();
    }
    for (let i = st2.length - 1; i >= 0; i--) s += st2[i];
    return s;
  };
  // 전체 → 실패하면 안전지점까지 잘라 재시도
  for (const attempt of [candidate, candidate.slice(0, lastValidLen)]) {
    candidate = attempt;
    try { return JSON.parse(tail()); } catch {}
  }
  return null;
}

// ── 스트림 텍스트에서 섹션 추출 (완성 우선, 없으면 부분 복구) ──────
export function tryExtractSections(text) {
  const result = {};

  // 단순 문자열
  const subtitleM = text.match(/"subtitle"\s*:\s*"((?:[^"\\]|\\.)*)"/s);
  if (subtitleM) { try { result.subtitle = JSON.parse(`"${subtitleM[1]}"`); } catch {} }

  // 객체 섹션들
  for (const key of ['translation', 'mirror', 'identity', 'direction', 'fit', 'color', 'brands', 'tpo', 'plan', 'closing']) {
    const keyRe = new RegExp(`"${key}"\\s*:\\s*\\{`);
    const m = text.match(keyRe);
    if (!m) continue;
    const startIdx = text.indexOf(m[0]) + m[0].length - 1;
    const complete = _scanBalanced(text, startIdx);
    if (complete) { try { result[key] = JSON.parse(complete); continue; } catch {} }
    // 미완성이면 부분 복구로 실시간 표시
    const partial = _repairPartial(text, startIdx);
    if (partial && typeof partial === 'object') result[key] = partial;
  }

  return result;
}

// ── 스트리밍 시작 함수 (페이지 외부에서도 호출 가능) ─────────────
export async function startStream(intakeId, session, guestSessionId, nickname) {
  resetConsultingReportStream();
  setConsultingReportStream({ status: 'streaming', intakeId });

  // 타자기 스무딩 — 수신 버퍼(fullText)와 표시 길이(shownLen)를 분리해
  // 일정한 속도로 흘려보낸다. 밀리면 backlog에 비례해 가속(자연스럽게 따라잡음).
  let fullText = '';
  let shownLen = 0;
  let doneReport = null;
  let doneReportNo = null;
  let streamEnded = false;
  let errored = false;
  let productsAcc = {};

  const finalize = () => {
    clearInterval(drip);
    const parsed = tryExtractSections(fullText);
    // 서버가 저장 완료를 확인한 최종 결과만 완료로 표시
    setConsultingReportStream({ status: 'done', report: doneReport, reportNo: doneReportNo, ...parsed });
  };

  const drip = setInterval(() => {
    if (errored) { clearInterval(drip); return; }
    if (shownLen < fullText.length) {
      const backlog = fullText.length - shownLen;
      const step = Math.max(3, Math.ceil(backlog / 25));
      shownLen = Math.min(fullText.length, shownLen + step);
      const sections = tryExtractSections(fullText.slice(0, shownLen));
      if (Object.keys(sections).length > 0) setConsultingReportStream(sections);
    } else if (streamEnded) {
      finalize();
    }
  }, 50);

  try {
    const headers = { 'Content-Type': 'application/json', 'x-guest-session-id': guestSessionId || '' };
    if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

    const res = await fetch('/api/translator-report', {
      method: 'POST',
      headers,
      body: JSON.stringify({ intakeId, nickname: nickname || null }),
    });

    if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    // 모바일/anonymous에서 SSE 연결이 끊겨 reader.read()가 영구 대기하는 것 방지
    // 30초 이상 데이터 없으면 abort
    const IDLE_TIMEOUT = 30000;
    const readWithTimeout = () => new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('read timeout')), IDLE_TIMEOUT);
      reader.read().then(v => { clearTimeout(t); resolve(v); }, e => { clearTimeout(t); reject(e); });
    });

    while (true) {
      const { done, value } = await readWithTimeout();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        let event;
        try { event = JSON.parse(line.slice(6)); }
        catch { continue; } // 손상된 JSON만 건너뛴다. 서버 오류는 아래에서 처리한다.
        if (event.type === 'delta') {
          fullText += event.text;
        } else if (event.type === 'products') {
          productsAcc = { ...productsAcc, ...event.products };
          setConsultingReportStream({ products: productsAcc });
        } else if (event.type === 'done') {
          if (!event.report || typeof event.report !== 'object' || Array.isArray(event.report)) {
            throw new Error('invalid final report');
          }
          doneReport = event.report;
          doneReportNo = event.reportNo ?? null;
          streamEnded = true;
          await reader.cancel().catch(() => {}); // 저장은 이미 확인됨. 연결 정리 실패로 오류 처리하지 않는다.
          return;
        } else if (event.type === 'error') {
          throw new Error(event.error || 'stream error');
        }
      }
    }
    throw new Error("저장 완료를 확인하지 못했습니다. 페이지를 다시 열어 확인해 주세요.");
  } catch (err) {
    console.error('translator report stream error:', err);
    errored = true;
    clearInterval(drip);
    setConsultingReportStream({ status: 'error' });
  }
}
