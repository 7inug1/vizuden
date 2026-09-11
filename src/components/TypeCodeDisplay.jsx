import { useState, useEffect, useRef } from 'react';
import Tooltip from './Tooltip';
import { codeTooltips } from '../data/codeTooltips';

/**
 * 유형 코드 표시 컴포넌트
 * @param {Array} parts - 4개 코드 배열. null이면 미확정(—) 표시
 * @param {'sm'|'md'|'lg'|'xl'} size - 박스 크기 (기본: 'md')
 * @param {boolean} showHint - 온보딩 힌트 표시 여부
 * @param {boolean} centered - 중앙정렬 여부
 */

const SIZES = {
  sm: { box: 22, font: 11, dotGap: 8 },
  md: { box: 30, font: 13, dotGap: 10 },
  lg: { box: 38, font: 15, dotGap: 12 },
  xl: { box: 48, font: 20, dotGap: 12 },
};

export default function TypeCodeDisplay({ parts, size = 'md', showHint = false, centered = false }) {
  const [openIdx, setOpenIdx] = useState(null);
  const [hintVisible, setHintVisible] = useState(false);
  const hintTimerRef = useRef(null);
  const sz = SIZES[size] ?? SIZES.md;

  // 마운트 후 0.5s 딜레이로 hint fade-in
  useEffect(() => {
    if (!showHint) return;
    hintTimerRef.current = setTimeout(() => setHintVisible(true), 500);
    return () => clearTimeout(hintTimerRef.current);
  }, [showHint]);

  function dismissHint() {
    clearTimeout(hintTimerRef.current);
    setHintVisible(false);
  }

  function handleClick(e, i) {
    e.stopPropagation();
    setOpenIdx(openIdx === i ? null : i);
    if (hintVisible) dismissHint();
  }

  const baseBoxStyle = {
    display: 'inline-block',
    width: sz.box,
    height: sz.box,
    boxSizing: 'border-box',
    flexShrink: 0,
    textAlign: 'center',
    fontSize: sz.font,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontWeight: 500,
    lineHeight: `${sz.box - 2}px`,
    overflow: 'hidden',
    userSelect: 'none',
    transition: 'border-color 0.15s, background 0.15s',
  };

  // 힌트 화살표 left — 첫 번째 박스 중앙
  const arrowLeft = sz.box / 2 - 4;

  return (
    <div style={{
      textAlign: centered ? 'center' : 'left',
      position: 'relative',
      display: 'inline-block',
    }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 0 }}>
        {parts.map((part, i) => (
          <div key={i} style={{ display: 'inline-flex', alignItems: 'center' }}>
            {i > 0 && (
              <span style={{ width: sz.dotGap, display: 'inline-block' }} />
            )}
            {part ? (
              <Tooltip
                content={codeTooltips[part]}
                position="bottom"
                align={i >= 2 ? 'center' : 'left'}
                forceOpen={openIdx === i}
                onClose={() => setOpenIdx(null)}
                suppressHover={openIdx !== null && openIdx !== i}
              >
                <div
                  role="button"
                  tabIndex={0}
                  data-code-box
                  data-box={sz.box}
                  data-font={sz.font}
                  onClick={(e) => handleClick(e, i)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(e, i); }}
                  style={{
                    ...baseBoxStyle,
                    border: '1px solid #a8a29e',
                    color: '#292524',
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#292524';
                    e.currentTarget.style.background = 'rgba(41,37,36,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#a8a29e';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {part}
                </div>
              </Tooltip>
            ) : (
              <div data-code-box data-box={sz.box} data-font={sz.font} style={{
                ...baseBoxStyle,
                border: '1px solid #e7e5e4',
                color: '#a8a29e',
              }}>
                —
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 온보딩 힌트 — 툴팁 스타일 + X */}
      {showHint && (
        <div
          data-onboarding-hint
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: centered ? '50%' : 0,
            transform: centered
              ? `translateX(-50%) translateY(${hintVisible ? 0 : -4}px)`
              : `translateY(${hintVisible ? 0 : -4}px)`,
            zIndex: 80,
            backgroundColor: '#1c1917',
            padding: '7px 8px 7px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap',
            boxShadow: '0 10px 28px rgba(28,25,23,0.28)',
            ring: '1px solid rgba(68,64,60,0.8)',
            opacity: hintVisible ? 1 : 0,
            transition: 'opacity 0.3s, transform 0.3s',
            pointerEvents: hintVisible ? 'auto' : 'none',
          }}
        >
          {/* 위쪽 화살표 — 첫 번째 박스 중앙 */}
          <span style={{
            position: 'absolute',
            bottom: '100%',
            left: centered ? '50%' : arrowLeft,
            transform: centered ? 'translateX(-50%)' : 'none',
            width: 0, height: 0,
            borderLeft: '4px solid transparent',
            borderRight: '4px solid transparent',
            borderBottom: '4px solid #1c1917',
          }} />

          <span style={{
            fontSize: 11,
            color: '#d6d3d1',
            letterSpacing: '0.02em',
            lineHeight: 1.4,
          }}>
            각 코드를 탭하면 의미를 확인할 수 있어요
          </span>

          {/* X 버튼 */}
          <button
            onClick={(e) => { e.stopPropagation(); dismissHint(); }}
            style={{
              color: '#78716c',
              fontSize: 15,
              lineHeight: 1,
              padding: '2px 3px',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#d6d3d1'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#78716c'; }}
            aria-label="힌트 닫기"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
