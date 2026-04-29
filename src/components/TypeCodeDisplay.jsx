import { useState } from 'react';
import Tooltip from './Tooltip';
import { codeTooltips } from '../data/codeTooltips';

/**
 * 유형 코드 표시 컴포넌트
 * @param {Array} parts - 4개 코드 배열. null이면 미확정(—) 표시
 * @param {'sm'|'md'|'lg'|'xl'} size - 박스 크기 (기본: 'md')
 * @param {boolean} showHint - 힌트 텍스트 표시 여부
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
  const sz = SIZES[size] ?? SIZES.md;

  function handleClick(e, i) {
    e.stopPropagation();
    setOpenIdx(openIdx === i ? null : i);
  }

  // 브라우저 표시: lineHeight = box 내부 높이 → 텍스트 수직 중앙
  // 저장 이미지: onclone에서 Canvas 2D로 직접 다시 그림 (textBaseline: middle 보장)
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
  };

  return (
    <div style={{ textAlign: centered ? 'center' : 'left' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 0 }}>
        {parts.map((part, i) => (
          <div key={i} style={{ display: 'inline-flex', alignItems: 'center' }}>
            {i > 0 && (
              <span style={{
                color: '#d6d3d1',
                fontSize: sz.font,
                margin: `0 ${sz.dotGap}px`,
                userSelect: 'none',
              }}>
                ·
              </span>
            )}
            {part ? (
              <Tooltip
                content={codeTooltips[part]}
                position="bottom"
                align={i >= 3 ? 'right' : i === 2 ? 'center' : 'left'}
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
                    e.currentTarget.style.background = '#1c1917';
                    e.currentTarget.style.color = '#fafaf9';
                    e.currentTarget.style.borderColor = '#1c1917';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#292524';
                    e.currentTarget.style.borderColor = '#a8a29e';
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
      {showHint && (
        <p style={{
          fontSize: 11,
          color: '#a8a29e',
          marginTop: 6,
          textAlign: centered ? 'center' : 'left',
        }}>
          각 문자를 눌러 의미를 확인해보세요
        </p>
      )}
    </div>
  );
}
