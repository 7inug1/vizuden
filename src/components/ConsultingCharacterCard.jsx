const TAGS = ['옷장 진단', '쇼핑 동행', '코디 완성'];

export default function ConsultingCharacterCard({ className = '' }) {
  return (
    <div
      className={className}
      style={{
        border: '1px solid #292524',
        backgroundColor: '#FAFAF9',
        display: 'flex',
        overflow: 'hidden',
        height: 162,
      }}
    >
      {/* 캐릭터 이미지 */}
      <div style={{
        width: 96, flexShrink: 0,
        backgroundColor: '#edeae5',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}>
        <img
          src="/characters/ICMT.png"
          alt=""
          aria-hidden="true"
          style={{ width: 84, objectFit: 'contain', objectPosition: 'bottom center', display: 'block' }}
        />
      </div>

      {/* 세로 구분선 */}
      <div style={{ width: 1, backgroundColor: '#292524', flexShrink: 0 }} />

      {/* 서비스 정보 */}
      <div style={{
        flex: 1, padding: '14px 14px 12px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      }}>
        <div>
          <p style={{ fontSize: '6px', letterSpacing: '0.22em', color: '#a8a29e', textTransform: 'uppercase', marginBottom: 7 }}>
            VIZUDEN · 03
          </p>
          <div style={{ height: '1px', backgroundColor: '#e7e5e4', marginBottom: 8 }} />
          <p style={{
            fontFamily: 'Georgia, serif', fontSize: '15px', fontWeight: 300,
            color: '#1c1917', letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: 6,
          }}>
            비주얼<br />컨설팅
          </p>
          <p style={{ fontSize: '6.5px', color: '#78716c', lineHeight: 1.6, letterSpacing: '0.01em' }}>
            처방전 기반 1:1 퍼스널 스타일링
          </p>
        </div>

        <div>
          <div style={{ height: '1px', backgroundColor: '#e7e5e4', marginBottom: 7 }} />
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {TAGS.map((tag) => (
              <span key={tag} style={{
                fontSize: '5.5px', letterSpacing: '0.06em', color: '#a8a29e',
                border: '1px solid #e7e5e4', padding: '2px 5px',
                whiteSpace: 'nowrap',
              }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
