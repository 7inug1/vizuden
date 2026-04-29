import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { STORAGE_KEYS, getStoredBoolean, setStoredBoolean } from '../lib/storage';

const NOTICE_TITLE = 'VIZUDEN 클로즈 베타가 시작되었습니다';

export default function NoticeBar() {
  const [visible, setVisible] = useState(false);
  const barRef = useRef(null);

  useEffect(() => {
    const dismissed = getStoredBoolean(STORAGE_KEYS.noticeDismissed);
    if (!dismissed) setVisible(true);
  }, []);

  useLayoutEffect(() => {
    const h = barRef.current ? barRef.current.offsetHeight : 0;
    document.documentElement.style.setProperty('--notice-bar-height', `${h}px`);
  }, [visible]);

  function dismiss() {
    setStoredBoolean(STORAGE_KEYS.noticeDismissed, true);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      ref={barRef}
      className="w-full flex items-center gap-3 px-4 py-2.5"
      style={{ backgroundColor: '#1c1917', position: 'sticky', top: 0, zIndex: 50 }}
    >
      <p
        className="text-stone-300 flex-1 text-center"
        style={{
          fontSize: '11px',
          letterSpacing: '0.06em',
          lineHeight: 1.5,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
        }}
        title={NOTICE_TITLE}
      >
        VIZUDEN 클로즈 베타가 시작되었습니다
      </p>
      <button
        onClick={dismiss}
        className="shrink-0 text-stone-500 hover:text-stone-200 transition-colors"
        aria-label="닫기"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
