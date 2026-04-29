import { forwardRef } from 'react';

// html2canvas 캡처 전용 카드 — 화면 밖에 렌더링
// flex centering 대신 lineHeight/textAlign 방식으로 html2canvas 호환성 확보
// 한국어는 Noto Sans KR 사용
const ShareCard = forwardRef(function ShareCard({ type, result }, ref) {
  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top: 0,
        left: '-9999px',
        width: '360px',
        backgroundColor: '#F5F2ED',
        padding: '32px',
        boxSizing: 'border-box',
        fontFamily: '"Noto Sans KR", "Apple SD Gothic Neo", sans-serif',
      }}
    >
      {/* 내부 카드 */}
      <div style={{
        backgroundColor: '#FDFAF6',
        border: '1px solid #e7e5e4',
        padding: '32px',
        marginBottom: '0',
      }}>
        {/* 로고 */}
        <div style={{
          fontSize: '10px',
          letterSpacing: '0.25em',
          color: '#a8a29e',
          marginBottom: '28px',
          fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
          fontWeight: '400',
          textTransform: 'uppercase',
        }}>
          Vizuden
        </div>

        {/* 나는 */}
        <div style={{
          fontSize: '10px',
          letterSpacing: '0.15em',
          color: '#a8a29e',
          marginBottom: '6px',
          fontFamily: '"Noto Sans KR", sans-serif',
          fontWeight: '400',
          textTransform: 'uppercase',
        }}>
          나는
        </div>

        {/* 유형명 한국어 */}
        <div style={{
          fontSize: '26px',
          fontWeight: '300',
          color: '#111111',
          letterSpacing: '-0.02em',
          marginBottom: '4px',
          lineHeight: '1.25',
          fontFamily: '"Noto Sans KR", sans-serif',
        }}>
          {result.nameKo}
        </div>

        {/* 유형명 영어 */}
        <div style={{
          fontSize: '12px',
          color: '#a8a29e',
          marginBottom: '24px',
          fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
          fontWeight: '300',
          letterSpacing: '0.01em',
        }}>
          {result.nameEn}
        </div>

        {/* 유형 코드 박스 */}
        <div style={{ marginBottom: '20px', lineHeight: '1' }}>
          {type.split('-').map((code, i) => (
            <span key={code} style={{
              display: 'inline-block',
              border: '1px solid #d6d3d1',
              padding: '4px 9px',
              fontSize: '11px',
              color: '#78716c',
              fontFamily: '"Courier New", Courier, monospace',
              letterSpacing: '0.06em',
              marginRight: i < 3 ? '6px' : '0',
              verticalAlign: 'middle',
            }}>
              {code}
            </span>
          ))}
        </div>

        {/* 설명 */}
        <div style={{
          fontSize: '12px',
          color: '#57534e',
          lineHeight: '1.8',
          fontFamily: '"Noto Sans KR", sans-serif',
          fontWeight: '300',
        }}>
          {result.description}
        </div>

        {/* 키워드 */}
        <div style={{ marginTop: '20px' }}>
          {result.keywords.map((kw, i) => (
            <span key={kw} style={{
              display: 'inline-block',
              fontSize: '11px',
              color: '#78716c',
              fontFamily: '"Noto Sans KR", sans-serif',
              fontWeight: '400',
              borderBottom: '1px solid #a8a29e',
              paddingBottom: '1px',
              marginRight: i < result.keywords.length - 1 ? '12px' : '0',
            }}>
              {kw}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
});

export default ShareCard;
