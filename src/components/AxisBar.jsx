import Tooltip from './Tooltip';

const axisLabels = {
  motivation: {
    full: '동기',
    tooltip: {
      title: '동기 (Motivation)',
      desc: '스타일의 출발점. 나를 위해 입는가(I), 타인과의 관계를 위해 입는가(R).',
    },
    A: 'I · 내면',
    B: 'R · 관계',
  },
  orientation: {
    full: '방향성',
    tooltip: {
      title: '방향성 (Orientation)',
      desc: '스타일의 형성 방식. 일관된 기준을 고수하는가(C), 다양하게 탐색하며 변화하는가(D).',
    },
    A: 'C · 일관',
    B: 'D · 다양',
  },
  energy: {
    full: '에너지',
    tooltip: {
      title: '에너지 (Energy)',
      desc: '스타일의 미학. 덜어내고 절제하는가(M), 더하고 표현하는가(E).',
    },
    A: 'M · 절제',
    B: 'E · 표현',
  },
  temporality: {
    full: '시간성',
    tooltip: {
      title: '시간성 (Temporality)',
      desc: '스타일의 기준점. 시대를 초월하는 것에서 아름다움을 찾는가(T), 지금 이 순간을 중시하는가(N).',
    },
    A: 'T · 클래식',
    B: 'N · 현재',
  },
};

function QuestionIcon() {
  return (
    <svg
      data-tooltip-icon
      width="11" height="11" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ color: '#a8a29e' }}
    >
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}

export default function AxisBar({ axis, scoreA, scoreB }) {
  const total = scoreA + scoreB;
  const percentA = total === 0 ? 50 : Math.round((scoreA / total) * 100);
  const percentB = 100 - percentA;
  const label = axisLabels[axis];
  const dominantIsA = scoreA >= scoreB;
  const dominantPct = dominantIsA ? percentA : percentB;

  return (
    /* 모든 간격을 inline style로 통일 — html2canvas 렌더와 브라우저 렌더 일치 */
    <div style={{ marginBottom: 10 }}>

      {/* 축 이름 + 툴팁 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 15 }}>
        <span style={{ fontSize: 10, letterSpacing: '0.1em', color: '#a8a29e', textTransform: 'uppercase' }}>
          {label.full}
        </span>
        <Tooltip content={label.tooltip}>
          <QuestionIcon />
        </Tooltip>
      </div>

      {/* 게이지 바 */}
      <div style={{ position: 'relative', width: '100%', height: 2, backgroundColor: '#e7e5e4', marginBottom: 3 }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            height: '100%',
            ...(dominantIsA
              ? { left: 0, width: `${percentA}%` }
              : { right: 0, width: `${percentB}%` }),
            backgroundColor: '#292524',
          }}
        />
      </div>

      {/* 레이블 — paddingBottom으로 다음 축과 간격 확보 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12 }}>
        <span style={{
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: dominantIsA ? '#44403c' : '#a8a29e',
          fontWeight: dominantIsA ? 500 : 400,
        }}>
          {label.A}{dominantIsA ? ` (${dominantPct}%)` : ''}
        </span>
        <span style={{
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: !dominantIsA ? '#44403c' : '#a8a29e',
          fontWeight: !dominantIsA ? 500 : 400,
        }}>
          {label.B}{!dominantIsA ? ` (${dominantPct}%)` : ''}
        </span>
      </div>
    </div>
  );
}
