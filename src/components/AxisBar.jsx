import Tooltip from './Tooltip';

const axisLabels = {
  motivation: {
    full: '동기',
    tooltip: {
      title: '동기 (Motivation)',
      desc: '스타일의 출발점. 나를 위해 입는가(I), 타인과의 관계를 위해 입는가(R).',
    },
    A: 'I · Intrinsic',
    B: 'R · Relational',
  },
  orientation: {
    full: '방향성',
    tooltip: {
      title: '방향성 (Orientation)',
      desc: '스타일의 형성 방식. 일관된 기준을 고수하는가(C), 다양하게 탐색하며 변화하는가(D).',
    },
    A: 'C · Convergent',
    B: 'D · Divergent',
  },
  energy: {
    full: '에너지',
    tooltip: {
      title: '에너지 (Energy)',
      desc: '스타일의 미학. 덜어내고 절제하는가(M), 더하고 표현하는가(E).',
    },
    A: 'M · Minimal',
    B: 'E · Expressive',
  },
  temporality: {
    full: '시간성',
    tooltip: {
      title: '시간성 (Temporality)',
      desc: '스타일의 기준점. 시대를 초월하는 것에서 아름다움을 찾는가(T), 지금 이 순간을 중시하는가(N).',
    },
    A: 'T · Timeless',
    B: 'N · Now',
  },
};

function QuestionIcon() {
  return (
    <svg
      data-tooltip-icon
      width="11" height="11" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      className="text-stone-400"
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
    <div className="mb-3">
      {/* 헤더: 축 이름 + 툴팁 */}
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-xs tracking-widest text-stone-400 uppercase">{label.full}</span>
        <Tooltip content={label.tooltip}>
          <QuestionIcon />
        </Tooltip>
      </div>

      {/* 바 */}
      <div className="relative w-full h-px mb-1.5" style={{ backgroundColor: '#e7e5e4' }}>
        {dominantIsA ? (
          <div
            className="absolute left-0 top-0 h-full bg-stone-800 transition-all duration-700"
            style={{ width: `${percentA}%` }}
          />
        ) : (
          <div
            className="absolute right-0 top-0 h-full bg-stone-800 transition-all duration-700"
            style={{ width: `${percentB}%` }}
          />
        )}
      </div>

      {/* 레이블: dominant에만 퍼센트 */}
      <div className="flex justify-between">
        <span className={`text-[10px] uppercase tracking-wider ${dominantIsA ? 'text-stone-700 font-medium' : 'text-stone-400'}`}>
          {label.A}{dominantIsA ? ` (${dominantPct}%)` : ''}
        </span>
        <span className={`text-[10px] uppercase tracking-wider ${!dominantIsA ? 'text-stone-700 font-medium' : 'text-stone-400'}`}>
          {label.B}{!dominantIsA ? ` (${dominantPct}%)` : ''}
        </span>
      </div>
    </div>
  );
}
