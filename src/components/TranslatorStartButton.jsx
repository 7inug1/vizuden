// 홈·샘플 페이월 공용 — "스타일 번역서" 시작 버튼
// variant: 'dark' = 크림 배경 위 다크 버튼 (홈) / 'light' = 다크 배경 위 크림 버튼 (페이월)
export default function TranslatorStartButton({ onClick, variant = 'dark' }) {
  const light = variant === 'light';
  return (
    <button
      onClick={onClick}
      className="w-full px-5 py-5 rounded-3xl text-left transition-all duration-150 active:scale-[0.98] flex items-center gap-4"
      style={light
        ? { backgroundColor: '#EDE3D2', border: '1px solid #DECFB8', boxShadow: '0 4px 20px 0 rgba(0,0,0,0.25)' }
        : { backgroundColor: '#3A3028', border: '1px solid #4A3E35', boxShadow: '0 2px 16px 0 rgba(0,0,0,0.2)' }}
    >
      <div className="shrink-0 flex items-center justify-center" style={{ width: 52, height: 60 }}>
        <div style={{ position: 'relative', width: 38, height: 48, borderRadius: 4 }}>
          <div style={{ position: 'absolute', top: 3, left: 3, width: 35, height: 45, borderRadius: 4, backgroundColor: light ? '#CFC6BA' : '#D6CEC4', border: '1px solid #C0B9AF' }} />
          <div style={{ position: 'absolute', top: 0, left: 0, width: 35, height: 45, borderRadius: 4, backgroundColor: '#FAF8F5', border: '1px solid #D0C9BF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="26" viewBox="0 0 22 26" fill="none">
              <rect x="1" y="1" width="10" height="1.8" rx="0.9" fill="#6B5E52"/>
              <rect x="1" y="4.5" width="7" height="1.8" rx="0.9" fill="#6B5E52" opacity="0.45"/>
              <line x1="5" y1="13" x2="17" y2="13" stroke="#9C8E84" strokeWidth="1.2" strokeLinecap="round"/>
              <polyline points="14,10.2 17.2,13 14,15.8" stroke="#9C8E84" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <rect x="11" y="19.8" width="10" height="1.8" rx="0.9" fill="#6B5E52"/>
              <rect x="11" y="23.3" width="6" height="1.8" rx="0.9" fill="#6B5E52" opacity="0.45"/>
            </svg>
          </div>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] tracking-[0.22em] uppercase mb-1.5" style={{ color: light ? 'rgba(58,48,40,0.5)' : 'rgba(240,235,228,0.5)' }}>
          STYLE TRANSLATOR
        </p>
        <p className="text-[18px] font-medium tracking-tight leading-snug mb-1" style={{ color: light ? '#2A241E' : '#F5F0EB' }}>
          스타일 번역서
        </p>
        <p className="text-[12px] leading-relaxed" style={{ color: light ? 'rgba(58,48,40,0.6)' : 'rgba(240,235,228,0.65)' }}>
          25개 질문 · 약 5분 →
        </p>
      </div>
    </button>
  );
}
