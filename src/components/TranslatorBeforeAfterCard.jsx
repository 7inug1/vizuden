export default function TranslatorBeforeAfterCard({ className = '' }) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        height: 180,
        position: 'relative',
        borderBottom: '1px solid #e7e5e4',
      }}
    >
      {/* BEFORE */}
      <div style={{
        flex: 1,
        backgroundColor: '#f0ede8',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* 이미지 영역 */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          position: 'relative',
          paddingTop: 12,
        }}>
          <img
            src="/characters/ghost-outline.png"
            alt=""
            aria-hidden="true"
            style={{
              height: 114,
              objectFit: 'contain',
              objectPosition: 'bottom center',
              opacity: 0.35,
              filter: 'grayscale(1)',
              display: 'block',
            }}
          />
          <span style={{
            position: 'absolute',
            top: '38%', left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: 'Georgia, serif',
            fontSize: '32px',
            fontWeight: 300,
            color: '#a8a29e',
            lineHeight: 1,
            userSelect: 'none',
          }}>
            ?
          </span>
        </div>
        {/* 라벨 */}
        <div style={{
          height: 30,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderTop: '1px solid #e7e5e4',
        }}>
          <p style={{
            fontSize: '9px', letterSpacing: '0.24em',
            color: '#a8a29e', textTransform: 'uppercase',
          }}>
            BEFORE
          </p>
        </div>
      </div>

      {/* 화살표 */}
      <div style={{
        position: 'absolute',
        left: '50%',
        top: '44%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
      }}>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
          <path d="M1 6H15M9.5 1L15 6L9.5 11" stroke="#78716c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* AFTER */}
      <div style={{
        flex: 1,
        backgroundColor: '#e8e5e0',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* 이미지 영역 */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          paddingTop: 12,
        }}>
          <img
            src="/characters/ICMT.png"
            alt=""
            aria-hidden="true"
            style={{
              height: 114,
              objectFit: 'contain',
              objectPosition: 'bottom center',
              display: 'block',
            }}
          />
        </div>
        {/* 라벨 */}
        <div style={{
          height: 30,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderTop: '1px solid #d6d3d1',
        }}>
          <p style={{
            fontSize: '9px', letterSpacing: '0.24em',
            color: '#292524', textTransform: 'uppercase',
            fontWeight: 500,
          }}>
            AFTER
          </p>
        </div>
      </div>
    </div>
  );
}
