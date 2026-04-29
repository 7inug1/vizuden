const DIRECTION = '지금 당신에게 필요한 건 새 옷이 아닙니다. \'뺄 수 있는 기준\'이에요.';

const CRITERIA = [
  '새 옷 사기 전, 지금 가진 것과 3가지 이상 코디되는지 먼저 확인할 것',
  '상의는 어깨선이 딱 맞아야 합니다. 여기서만큼은 타협하지 마세요.',
  '색은 세 가지 이하로. 컬러 포인트는 딱 하나만.',
];

export default function PrescriptionSampleCard({ className = '' }) {
  const base = {
    width: 264, height: 178,
    position: 'absolute', left: '50%',
  };

  return (
    <div className={className} style={{ position: 'relative', height: 212 }}>
      {/* 뒤 종이 2 */}
      <div style={{
        ...base, top: 2,
        transform: 'translateX(-50%) rotate(4deg)',
        backgroundColor: '#e8e5e0',
        border: '1px solid #d6d3d1',
      }} />
      {/* 뒤 종이 1 */}
      <div style={{
        ...base, top: 8,
        transform: 'translateX(-50%) rotate(-2.5deg)',
        backgroundColor: '#edeae5',
        border: '1px solid #d6d3d1',
      }} />
      {/* 앞 종이 */}
      <div style={{
        ...base, top: 16,
        transform: 'translateX(-50%)',
        backgroundColor: '#FAFAF9',
        border: '1px solid #292524',
        padding: '12px 14px',
        overflow: 'hidden',
      }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
          <span style={{ fontSize: '7px', letterSpacing: '0.22em', color: '#44403c', fontWeight: 500 }}>VIZUDEN</span>
          <span style={{ fontSize: '6.5px', letterSpacing: '0.1em', color: '#a8a29e' }}>스타일 처방전</span>
        </div>
        <div style={{ height: '1px', backgroundColor: '#e7e5e4', marginBottom: 9 }} />

        {/* 스타일 방향 */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: '6px', letterSpacing: '0.16em', color: '#a8a29e', textTransform: 'uppercase', marginBottom: 5 }}>스타일 방향</div>
          <p style={{
            fontFamily: 'Georgia, serif',
            fontSize: '8px', color: '#1c1917', lineHeight: 1.6, letterSpacing: '-0.01em',
          }}>
            {DIRECTION}
          </p>
        </div>

        <div style={{ height: '1px', backgroundColor: '#e7e5e4', marginBottom: 9 }} />

        {/* 가져갈 기준 */}
        <div>
          <div style={{ fontSize: '6px', letterSpacing: '0.16em', color: '#a8a29e', textTransform: 'uppercase', marginBottom: 6 }}>가져갈 기준</div>

          {/* 1번 — 공개 */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5, marginBottom: 5 }}>
            <span style={{ fontSize: '7px', color: '#78716c', flexShrink: 0, lineHeight: 1.5 }}>→</span>
            <p style={{ fontSize: '7px', color: '#44403c', lineHeight: 1.55, letterSpacing: '0.01em' }}>{CRITERIA[0]}</p>
          </div>

          {/* 2·3번 — blur 처리 */}
          <div style={{ filter: 'blur(2.5px)', opacity: 0.55, userSelect: 'none', pointerEvents: 'none' }}>
            {CRITERIA.slice(1).map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 5, marginBottom: 5 }}>
                <span style={{ fontSize: '7px', color: '#78716c', flexShrink: 0, lineHeight: 1.5 }}>→</span>
                <p style={{ fontSize: '7px', color: '#44403c', lineHeight: 1.55, letterSpacing: '0.01em' }}>{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 하단 페이드 */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 36,
          background: 'linear-gradient(to bottom, rgba(250,250,249,0) 0%, rgba(250,250,249,0.98) 100%)',
          pointerEvents: 'none',
        }} />
      </div>
    </div>
  );
}
