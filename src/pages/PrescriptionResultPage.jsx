import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Link as LinkIcon, Shirt, Footprints, Scissors, PanelsTopLeft, Rows3 } from 'lucide-react';
import SiteHeader from '../components/SiteHeader';
import RecommendBadge from '../components/RecommendBadge';
import CoachingModal from '../components/CoachingModal';
import { types } from '../data/types';
import { typeImages } from '../data/typeImages';
import { readPrescriptionSaved } from '../lib/prescriptionStorage';
import { usePrescriptionStream, resetPrescriptionStream } from '../lib/prescriptionStream';
import { useAuth } from '../context/AuthContext';
import { LoadingScreen } from './PrescriptionPage';

// ── 공통 스타일 상수 ────────────────────────────────────────────
const SECTION_H = 'text-base font-semibold text-stone-900 tracking-tight mb-4';
const SECTION_SUB = 'text-xs tracking-widest text-stone-400 uppercase mb-2';


const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

// ── 컬러명 → hex 근사치 ─────────────────────────────────────────
const COLOR_MAP = [
  [/화이트|흰/, '#F3F1ED'],
  [/아이보리|ivory/, '#F5F0E0'],
  [/크림|cream/, '#FFF5DC'],
  [/에크루|ecru/, '#EFE6CA'],
  [/베이지|biege/, '#D4B99A'],
  [/카멜|camel/, '#C19A6B'],
  [/탄$|tan /, '#C2956C'],
  [/샌드|sand/, '#C2B280'],
  [/토프|taupe/, '#9A8578'],
  [/모카|mocha/, '#9A7259'],
  [/브라운|갈색|brown/, '#8B6347'],
  [/버건디|burgundy/, '#800020'],
  [/와인|wine/, '#722F37'],
  [/카키|khaki/, '#8B864E'],
  [/올리브|olive/, '#6B7645'],
  [/네이비|남색|navy/, '#1F3050'],
  [/블랙|검정|black/, '#1c1917'],
  [/차콜|charcoal/, '#36454F'],
  [/그레이|회색|gray|grey/, '#9E9E9E'],
  [/핑크|pink/, '#E8B4B8'],
  [/블루|파랑|blue/, '#5B7FA6'],
];
function colorNameToHex(str) {
  const lower = str.toLowerCase();
  for (const [re, hex] of COLOR_MAP) {
    if (re.test(lower)) return hex;
  }
  return null;
}

function extractColorName(str) {
  return str.replace(/\s+[—–]\s+.*$/, '').replace(/\s+-\s+.*$/, '').replace(/:\s+.*$/, '').trim();
}

function ColorSwatch({ colorStr, dim = 14 }) {
  const hex = colorNameToHex(colorStr);
  if (!hex) return <span className="text-stone-400 select-none">·</span>;
  return (
    <span
      style={{
        display: 'inline-block',
        width: dim, height: dim,
        backgroundColor: hex,
        border: '1px solid rgba(0,0,0,0.1)',
        flexShrink: 0,
        marginTop: 3,
      }}
    />
  );
}

// ── 헬퍼 함수 ──────────────────────────────────────────────────
function formatWon(amount) {
  if (!amount || isNaN(Number(amount))) return '';
  const n = Number(amount);
  if (n >= 10000) return `약 ${Math.round(n / 10000)}만원`;
  return `약 ${n.toLocaleString()}원`;
}

// TOC 요약 — 평문 앞부분 잘라냄
function tocSummary(text, len = 40) {
  if (!text) return '';
  const flat = String(text).replace(/\n+/g, ' ').trim();
  return flat.length > len ? flat.slice(0, len) : flat;
}

// TOC 요약 — 첫 문장 추출 후 단어 경계에서 자름
function tocSentence(text, max = 28) {
  if (!text) return '';
  const flat = String(text).replace(/\n+/g, ' ').trim();
  // First complete sentence ending with period + space
  const m = flat.match(/^(.+?)\.\s/);
  const sentence = m ? m[1] : flat;
  if (sentence.length <= max) return sentence.replace(/\.$/, '');
  const sub = sentence.slice(0, max);
  const sp = sub.lastIndexOf(' ');
  return sentence.slice(0, sp > max * 0.55 ? sp : max - 2) + '…';
}

function splitParagraphs(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\n/g, ' ').trim())
    .filter(Boolean);
}

function ParagraphBlock({ text, className = '', gapClassName = 'gap-3' }) {
  const paragraphs = splitParagraphs(text);
  if (!paragraphs.length) return null;
  return (
    <div className={`flex flex-col ${gapClassName}`}>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className={className}>{paragraph}</p>
      ))}
    </div>
  );
}

function SectionSkeleton({ lines = 4, headingWidth = 'w-20' }) {
  return (
    <div className="mb-10">
      <div className={`h-4 ${headingWidth} bg-stone-300 rounded animate-pulse mb-5`} />
      <div className="flex flex-col gap-2.5">
        {Array(lines).fill(0).map((_, i) => (
          <div
            key={i}
            className={`h-3 rounded animate-pulse bg-stone-200 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
          />
        ))}
      </div>
    </div>
  );
}

// ── 쇼핑 플랫폼 링크 ────────────────────────────────────────────
const SHOP_PLATFORMS = [
  { id: 'musinsa', label: '무신사', url: (q) => `https://www.musinsa.com/search/goods?keyword=${encodeURIComponent(q)}` },
  { id: '29cm',    label: '29CM',   url: (q) => `https://www.29cm.co.kr/store/search?keyword=${encodeURIComponent(q)}&sort=RECOMMENDED&page=1` },
  { id: 'kream',   label: 'KREAM',  url: (q) => `https://kream.co.kr/search?keyword=${encodeURIComponent(q)}` },
];

function ShopLinks({ keywords }) {
  const [platformId, setPlatformId] = useState('musinsa');
  if (!keywords?.length) return null;
  const platform = SHOP_PLATFORMS.find((p) => p.id === platformId);
  return (
    <div className="mt-3.5">
      {/* 플랫폼 탭 — underline 스타일 */}
      <div className="flex border-b border-stone-200 mb-2.5">
        {SHOP_PLATFORMS.map((p) => {
          const active = p.id === platformId;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setPlatformId(p.id)}
              className="px-3 py-1.5 text-[11px] tracking-wider transition-colors duration-150 relative"
              style={{
                color: active ? '#1c1917' : '#a8a29e',
                borderBottom: active ? '1.5px solid #1c1917' : '1.5px solid transparent',
                marginBottom: '-1px',
                fontWeight: active ? 500 : 400,
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>
      {/* 키워드 링크 */}
      <div className="flex flex-wrap gap-1.5">
        {keywords.map((q, i) => (
          <a
            key={i}
            href={platform.url(q)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-stone-600 border border-stone-300 px-2.5 py-1 hover:border-stone-500 hover:text-stone-900 transition-colors duration-150 leading-none"
          >
            {q} ↗
          </a>
        ))}
      </div>
    </div>
  );
}

function normalizeStylePrescription(raw) {
  if (!raw) return null;
  let source = raw;
  if (typeof source === 'string') {
    try { source = JSON.parse(source); } catch { return null; }
  }
  if (source?.report && typeof source.report === 'object') source = source.report;
  if (source?.full && typeof source.full === 'object') source = source.full;
  if (source?.direction && Array.isArray(source?.criteria)) {
    return {
      title: source.title ?? null,
      direction: source.direction ?? null,
      criteria: source.criteria ?? [],
      bodyGuide: source.bodyGuide ?? null,
      stylingFormula: source.stylingFormula ?? null,
      shopping_criteria: source.shopping_criteria ?? null,
      recommendations: source.recommendations ?? null,
      hair_grooming: source.hair_grooming ?? null,
      color_guide: source.color_guide ?? null,
      styling_snapshot: source.styling_snapshot ?? null,
      legacy: false,
    };
  }
  if (source?.problem?.headline || source?.transformation?.criteria?.length) {
    return {
      legacy: true,
      title: source.title ?? null,
      direction: null,
      criteria: source?.transformation?.criteria ?? [],
      bodyGuide: source?.problem?.headline ?? null,
      stylingFormula: null,
      recommendations: null,
    };
  }
  return null;
}

function PantsIcon({ className, strokeWidth = 1.7 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* body + waist */}
      <path d="M5 3h14v8L12 12.5 5 11V3z" />
      {/* left leg */}
      <path d="M5 11 4.5 21H11l1-8.5" />
      {/* right leg */}
      <path d="M19 11 19.5 21H13l-1-8.5" />
    </svg>
  );
}

function categoryMeta(category) {
  const normalized = String(category || '').trim();
  if (normalized.includes('하의')) return { icon: PantsIcon, label: '하의' };
  if (normalized.includes('상의')) return { icon: Shirt, label: '상의' };
  if (normalized.includes('아우터')) return { icon: PanelsTopLeft, label: '아우터' };
  if (normalized.includes('신발')) return { icon: Footprints, label: '신발' };
  if (normalized.includes('헤어')) return { icon: Scissors, label: '헤어' };
  return { icon: Rows3, label: normalized || '추천' };
}

// ── 예산 배분 시각화 ────────────────────────────────────────────
// VIZUDEN 브랜드 톤: 웜 뉴트럴 + 절제된 어센트
const BUDGET_PALETTE = ['#C49A78', '#6B9E8E', '#9B8BA6', '#B8906A', '#7A9BB5', '#8C7A6B'];

function BudgetDonutChart({ slices, totalBudget }) {
  const [activeIdx, setActiveIdx] = useState(null);
  if (!slices.length) return null;

  const cx = 100, cy = 100, ro = 88, ri = 54;

  function polarXY(angle, r) {
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  }
  function slicePath(start, end, rOuter, rInner) {
    const a0 = start * 2 * Math.PI - Math.PI / 2;
    const a1 = end   * 2 * Math.PI - Math.PI / 2;
    const o0 = polarXY(a0, rOuter), o1 = polarXY(a1, rOuter);
    const i0 = polarXY(a0, rInner), i1 = polarXY(a1, rInner);
    const large = end - start > 0.5 ? 1 : 0;
    return [
      `M ${o0.x} ${o0.y}`,
      `A ${rOuter} ${rOuter} 0 ${large} 1 ${o1.x} ${o1.y}`,
      `L ${i1.x} ${i1.y}`,
      `A ${rInner} ${rInner} 0 ${large} 0 ${i0.x} ${i0.y}`,
      'Z',
    ].join(' ');
  }
  function sliceMidLabel(start, end) {
    const mid = (start + end) / 2 * 2 * Math.PI - Math.PI / 2;
    const tr = (ro + ri) / 2;
    return { x: cx + tr * Math.cos(mid), y: cy + tr * Math.sin(mid) };
  }

  let cum = 0;
  const computed = slices.map((s) => {
    const start = cum;
    cum += s.pct;
    return { ...s, start, end: cum };
  });

  const active = activeIdx !== null ? computed[activeIdx] : null;
  const centerLabel = active
    ? {
        top: active.category,
        mid: `${Math.round(active.pct * 100)}%`,
        bot: active.won ? formatWon(active.won) : '',
      }
    : { top: '총 예산', mid: '', bot: totalBudget ? formatWon(totalBudget) : '' };

  return (
    <svg
      viewBox="0 0 200 200"
      className="w-full"
      style={{ touchAction: 'manipulation' }}
    >
      {computed.map((s, i) => {
        const expand = activeIdx === i;
        const scale = expand ? 1.04 : 1;
        const lp = sliceMidLabel(s.start, s.end);
        const showLabel = s.pct > 0.12; // 12% 이상만 내부 라벨

        return (
          <g key={i} style={{ transform: `scale(${scale})`, transformOrigin: `${cx}px ${cy}px`, transition: 'transform 0.18s ease' }}>
            <path
              d={slicePath(s.start, s.end, ro, ri)}
              fill={s.color}
              opacity={activeIdx !== null && activeIdx !== i ? 0.55 : 1}
              style={{ cursor: 'pointer', transition: 'opacity 0.18s ease' }}
              onMouseEnter={() => setActiveIdx(i)}
              onMouseLeave={() => setActiveIdx(null)}
              onTouchStart={(e) => { e.preventDefault(); setActiveIdx((prev) => prev === i ? null : i); }}
            />
          </g>
        );
      })}
      {/* 중앙 텍스트 */}
      <text x={cx} y={centerLabel.mid ? cy - 12 : cy - 7} textAnchor="middle" dominantBaseline="middle"
        fontSize="9" fill="#78716c" style={{ userSelect: 'none' }}>
        {centerLabel.top}
      </text>
      {centerLabel.mid && (
        <text x={cx} y={cy + 4} textAnchor="middle" dominantBaseline="middle"
          fontSize="11" fontWeight="700" fill="#1c1917" style={{ userSelect: 'none' }}>
          {centerLabel.mid}
        </text>
      )}
      <text x={cx} y={centerLabel.mid ? cy + 18 : cy + 9} textAnchor="middle" dominantBaseline="middle"
        fontSize={centerLabel.mid ? '9' : '11'} fontWeight={centerLabel.mid ? '400' : '700'}
        fill={centerLabel.mid ? '#78716c' : '#1c1917'} style={{ userSelect: 'none' }}>
        {centerLabel.bot}
      </text>
    </svg>
  );
}

function BudgetBreakdown({ breakdown, totalBudget }) {
  if (!Array.isArray(breakdown) || !breakdown.length) return null;
  const pctTotal = breakdown.reduce((s, b) => s + (Number(b.pct) || 0), 0) || 100;
  const slices = breakdown.map((item, i) => ({
    ...item,
    won: item.won ?? (totalBudget ? Math.round(Number(item.pct) / 100 * Number(totalBudget)) : undefined),
    pct: Number(item.pct) / pctTotal,
    color: BUDGET_PALETTE[i % BUDGET_PALETTE.length],
  }));

  return (
    <div className="mt-5 mb-2">
      <p className={SECTION_SUB}>예산 배분</p>
      {/* 도넛 차트 — 가로 full width */}
      <BudgetDonutChart slices={slices} totalBudget={totalBudget} />
      {/* 범례 */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3">
        {slices.map((item, i) => {
          const rawPct = breakdown[i];
          const wonAmt = rawPct.won ?? (totalBudget ? Math.round(Number(rawPct.pct) / 100 * Number(totalBudget)) : null);
          return (
            <div key={i} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-stone-700 font-medium">{item.category}</span>
              <span className="text-xs text-stone-400">{rawPct.pct}%{wonAmt ? ` · ${formatWon(wonAmt)}` : ''}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 프론티어 로딩 표시 (도착한 섹션 ↔ 스켈레톤 경계) ───────────
const FRONTIER_LABELS = {
  direction: {
    main: '스타일 방향 정리 중',
    subs: ['라이프스타일 패턴 파악 중', '목표 인상 설정 중', '핵심 방향 도출 중'],
  },
  criteria: {
    main: '기준 분석 중',
    subs: ['설문 맥락 교차 분석 중', '체형·직업 연결 중', '판단 기준 도출 중'],
  },
  action: {
    main: '코디 공식 생성 중',
    subs: ['실행 계획 설계 중', '아이템 시너지 검토 중', '단계별 순서 정리 중'],
  },
  formula: {
    main: '코디 공식 정리 중',
    subs: ['스타일 공식 설계 중', '아이템 시너지 검토 중', '공식 도출 중'],
  },
  snapshot: {
    main: '스타일 진단 중',
    subs: ['현재 착장 패턴 분석 중', '핏·색조합 평가 중', '개선 포인트 추출 중'],
  },
  color: {
    main: '컬러 처방 중',
    subs: ['피부톤 데이터 교차 중', '어울리는 배색 조합 중', '피할 컬러 선별 중'],
  },
  hair: {
    main: '헤어·그루밍 처방 중',
    subs: ['헤어 방향 설정 중', '그루밍 우선순위 분석 중', '라이프스타일 연결 중'],
  },
  shopping: {
    main: '쇼핑 기준서 작성 중',
    subs: ['예산 배분 계획 중', '최적 아이템 선별 중', '무신사 검색어 최적화 중'],
  },
  closing: {
    main: '마무리 문단 작성 중',
    subs: ['전체 처방 일관성 검토 중', '핵심 메시지 압축 중', '최종 정리 중'],
  },
};

function FrontierStatus({ frontierKey }) {
  const info = FRONTIER_LABELS[frontierKey];
  const [subIdx, setSubIdx] = useState(0);

  useEffect(() => { setSubIdx(0); }, [frontierKey]);

  useEffect(() => {
    if (!info) return;
    const t = setInterval(() => setSubIdx((i) => (i + 1) % info.subs.length), 3500);
    return () => clearInterval(t);
  }, [info]);

  if (!info) return null;

  return (
    <motion.div
      id="frontier-status"
      className="py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* 중앙 정렬 점 + 가로 구분선 */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 border-t border-stone-300" />
        <div className="flex gap-[7px] items-center">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="block w-2 h-2 rounded-full bg-stone-500"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.3, ease: 'easeInOut' }}
            />
          ))}
        </div>
        <div className="flex-1 border-t border-stone-300" />
      </div>
      <p className="text-sm font-semibold text-stone-700 text-center">{info.main}</p>
      <AnimatePresence mode="wait">
        <motion.p
          key={`${frontierKey}-${subIdx}`}
          className="text-sm text-stone-500 text-center mt-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {info.subs[subIdx]}
        </motion.p>
      </AnimatePresence>
    </motion.div>
  );
}

// ── 스트리밍 중 하단 고정 알림 pill ───────────────────────────────
function StreamingScrollPill({ frontierKey, onScrollToFrontier }) {
  const info = FRONTIER_LABELS[frontierKey];
  if (!info) return null;
  return (
    <motion.div
      className="fixed bottom-7 left-0 right-0 flex justify-center z-50 pointer-events-none"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.22 }}
    >
      <button
        type="button"
        onClick={onScrollToFrontier}
        className="pointer-events-auto flex items-center gap-2.5 pl-3.5 pr-4 py-2.5 rounded-full
          bg-stone-900 text-stone-100 text-xs font-medium tracking-wide
          shadow-[0_4px_20px_rgba(0,0,0,0.25)] active:scale-95 transition-transform duration-100"
      >
        {/* 아래 화살표 아이콘 */}
        <svg className="w-3 h-3 shrink-0 opacity-70" viewBox="0 0 12 12" fill="none">
          <path d="M6 1.5v9M3 7.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>{info.main}</span>
        {/* 살아있음 표시 dots */}
        <span className="flex gap-[3px] items-center ml-0.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="block w-[3px] h-[3px] rounded-full bg-stone-400"
              animate={{ opacity: [0.2, 0.9, 0.2] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.22, ease: 'easeInOut' }}
            />
          ))}
        </span>
      </button>
    </motion.div>
  );
}

// ── TOC 컴포넌트 (세로 accordion) ──────────────────────────────
function TOCBlock({ sections, onScrollTo }) {
  const [expanded, setExpanded] = useState(false);
  if (!sections.length) return null;

  return (
    <div className="mb-8 pl-4 border-l border-stone-200">
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-xs tracking-[0.2em] text-stone-400 uppercase">목차</p>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-stone-400 hover:text-stone-600 transition-colors duration-150"
        >
          {expanded ? '접기 ↑' : '펼치기 ↓'}
        </button>
      </div>

      {/* 항상 세로 목록 — collapsed: 섹션만, expanded: 섹션 + sub-items + summary */}
      <div className="flex flex-col gap-1">
        {sections.map((s, i) => {
          const mainIdx = sections.filter((x, xi) => !x.bonus && xi <= i).length;
          const isBonusFirst = s.bonus && (i === 0 || !sections[i - 1]?.bonus);
          const hasSubs = s.sub?.length > 0;
          return (
            <div key={s.id}>
              {isBonusFirst && (
                <p className="text-sm text-stone-400 mt-2 mb-0.5">보너스 제안</p>
              )}
              <button
                type="button"
                onClick={() => onScrollTo(s.id)}
                className="text-left text-sm text-stone-600 hover:text-stone-900 transition-colors duration-150 leading-relaxed"
              >
                {s.bonus
                  ? `${sections.filter((x, xi) => x.bonus && xi <= i).length}) ${s.label}`
                  : `${mainIdx}. ${s.label}`}
              </button>
              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    {hasSubs ? (
                      <div className="flex flex-col gap-1.5 mt-1 pl-3">
                        {s.sub.map((sub) => (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => onScrollTo(sub.id)}
                            className="w-full text-left text-xs text-stone-500 hover:text-stone-700 transition-colors duration-150 truncate"
                          >
                            · {sub.label}{sub.summary ? ` — ${sub.summary}` : ''}
                          </button>
                        ))}
                      </div>
                    ) : s.summary ? (
                      <p className="text-xs text-stone-400 mt-0.5 pl-3 truncate">{s.summary}</p>
                    ) : null}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 보너스 섹션 구분선 ──────────────────────────────────────────
function BonusSeparator() {
  return (
    <div className="my-10 flex items-center gap-3">
      <div className="flex-1 border-t border-stone-200" />
      <p className="text-xs tracking-[0.2em] text-stone-400 font-medium uppercase shrink-0">보너스 제안</p>
      <div className="flex-1 border-t border-stone-200" />
    </div>
  );
}

// ── 섹션 컴포넌트 ──────────────────────────────────────────────

function DirectionSection({ direction, isStreaming, num, revealDelay = 0 }) {
  if (direction === undefined && isStreaming) return <SectionSkeleton lines={3} headingWidth="w-24" />;
  if (!direction) return null;
  return (
    <motion.section
      id="section-direction"
      className="mb-8"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: revealDelay }}
    >
      <p className={SECTION_H}>{num ? `${num}. ` : ''}스타일 방향</p>
      <ParagraphBlock text={direction} className="text-sm text-stone-700 leading-relaxed" gapClassName="gap-3" />
    </motion.section>
  );
}

function CriteriaSection({ criteria, isStreaming, noTopBorder, bonusNum, revealDelay = 0 }) {
  if (criteria === undefined && isStreaming) return <SectionSkeleton lines={8} headingWidth="w-28" />;
  if (!criteria?.length) return null;
  return (
    <motion.section
      id="section-criteria"
      className={`${noTopBorder ? '' : 'border-t border-stone-200 '}pt-6 mb-8`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: revealDelay }}
    >
      <p className={SECTION_H}>{bonusNum ? `${bonusNum}) ` : ''}가져가야 할 기준</p>
      <div className="flex flex-col gap-6">
        {criteria.map((criterion, index) => (
          <div key={`${criterion.title}-${index}`} id={`section-criterion-${index}`}>
            <p className="text-sm font-medium text-stone-900 leading-snug mb-2">{index + 1}. {criterion.title}</p>
            <ParagraphBlock text={criterion.detail} className="text-sm text-stone-700 leading-relaxed" gapClassName="gap-2" />
          </div>
        ))}
      </div>
    </motion.section>
  );
}

function ActionPlanSection({ actionPlan, bonusNum }) {
  if (!actionPlan) return null;
  const items = [
    ['이번 주에 할 것', actionPlan.thisWeek],
    ['이번 달 목표', actionPlan.thisMonth],
    ['3개월 목표', actionPlan.threeMonths],
  ].filter(([, v]) => v);
  if (!items.length) return null;
  return (
    <section id="section-action" className="border-t border-stone-200 pt-6 mb-8">
      <p className={SECTION_H}>{bonusNum ? `${bonusNum}) ` : ''}실행 계획</p>
      <div className="flex flex-col gap-6">
        {items.map(([label, value], i) => (
          <div key={label} id={`section-action-${i}`}>
            <p className="text-sm font-medium text-stone-900 leading-snug mb-2">{i + 1}. {label}</p>
            <ParagraphBlock text={value} className="text-sm text-stone-600 leading-relaxed" gapClassName="gap-2" />
          </div>
        ))}
      </div>
    </section>
  );
}

function SnapshotSection({ fitPics, snapshot, num }) {
  if (!fitPics?.length && !snapshot?.level) return null;
  return (
    <section id="section-snapshot" className="border-t border-stone-200 pt-6 mb-8">
      <p className={SECTION_H}>{num ? `${num}. ` : ''}현재 스타일 진단</p>
      {fitPics?.length > 0 && (
        <div
          className={`grid gap-3 mb-5 ${fitPics.length === 1 ? 'max-w-[160px]' : ''}`}
          style={{ gridTemplateColumns: `repeat(${Math.min(fitPics.length, 3)}, minmax(0, 1fr))` }}
        >
          {fitPics.map((pic, index) => (
            <div key={`${pic?.path || pic?.name || index}`} className="border border-stone-200 p-2">
              <div className="aspect-[3/4] bg-stone-50 overflow-hidden flex items-center justify-center">
                {pic?.signedUrl
                  ? <img src={pic.signedUrl} alt={pic?.name || `사진 ${index + 1}`} className="w-full h-full object-cover" />
                  : <p className="text-[10px] text-stone-300">미리보기 없음</p>}
              </div>
            </div>
          ))}
        </div>
      )}
      {snapshot?.level && (
        <div id="section-snapshot-level" className="border border-stone-200 p-4 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs tracking-[0.18em] uppercase px-2.5 py-1 border"
              style={{ borderColor: '#1c1917', color: '#1c1917' }}>
              {snapshot.level}
            </span>
            {snapshot.level_note && (
              <p className="text-xs text-stone-500 leading-relaxed">{snapshot.level_note}</p>
            )}
          </div>
          {snapshot.dna && (
            <div>
              <p className="text-xs tracking-widest text-stone-400 uppercase mb-1.5">현재 방향</p>
              <p className="text-xs text-stone-700 leading-relaxed">{snapshot.dna}</p>
            </div>
          )}
          {snapshot.what_works && (
            <div>
              <p className="text-xs tracking-widest text-stone-400 uppercase mb-1.5">지금 잘 되고 있는 것</p>
              <p className="text-xs text-stone-700 leading-relaxed">{snapshot.what_works}</p>
            </div>
          )}
          {snapshot.quick_fix && (
            <div id="section-snapshot-quickfix" className="border-t border-stone-100 pt-3">
              <p className="text-xs tracking-widest text-stone-400 uppercase mb-1.5">지금 당장 바꿀 것</p>
              <p className="text-sm text-stone-900 leading-relaxed font-medium">{snapshot.quick_fix}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function BodySection({ bodyGuide, isStreaming }) {
  if (bodyGuide === undefined && isStreaming) return <SectionSkeleton lines={4} headingWidth="w-32" />;
  if (!bodyGuide) return null;
  return (
    <motion.section
      id="section-body"
      className="mb-10"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <p className={SECTION_H}>체형에 맞는 코디 기준</p>
      <ParagraphBlock text={bodyGuide} className="text-sm text-stone-700 leading-relaxed" gapClassName="gap-3" />
    </motion.section>
  );
}

function ColorSection({ colorGuide, isStreaming, num, revealDelay = 0 }) {
  if (colorGuide === undefined && isStreaming) return <SectionSkeleton lines={5} headingWidth="w-20" />;
  const hasBest = Array.isArray(colorGuide?.best_colors) && colorGuide.best_colors.length > 0;
  const hasOk = Array.isArray(colorGuide?.ok_colors) && colorGuide.ok_colors.length > 0;
  const hasLegacyRec = Array.isArray(colorGuide?.recommended) && colorGuide.recommended.length > 0;
  if (!colorGuide?.combo_tip && !hasBest && !hasOk && !hasLegacyRec) return null;
  return (
    <motion.section
      id="section-color"
      className="border-t border-stone-200 pt-6 mb-8"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: revealDelay }}
    >
      <p className={SECTION_H}>{num ? `${num}. ` : ''}컬러 처방</p>
      {colorGuide.combo_tip && (
        <p className="text-sm text-stone-700 leading-relaxed mb-5">{colorGuide.combo_tip}</p>
      )}
      <div className="flex flex-col gap-4">
        {/* 새 스키마: best_colors / ok_colors */}
        {hasBest && (
          <div id="section-color-rec">
            <p className={SECTION_SUB}>잘 어울리는 컬러</p>
            <div className="flex flex-col gap-1.5">
              {colorGuide.best_colors.map((color, i) => (
                <div key={`best-${i}`} className="flex items-start gap-2 text-sm text-stone-700 leading-relaxed">
                  <ColorSwatch colorStr={color} />
                  <span>{color}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {hasOk && (
          <div id={hasBest ? undefined : 'section-color-rec'}>
            <p className={SECTION_SUB}>괜찮은 컬러</p>
            <div className="flex flex-col gap-1.5">
              {colorGuide.ok_colors.map((color, i) => (
                <div key={`ok-${i}`} className="flex items-start gap-2 text-sm text-stone-600 leading-relaxed">
                  <ColorSwatch colorStr={color} />
                  <span>{color}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* 구버전 호환: recommended */}
        {!hasBest && !hasOk && hasLegacyRec && (
          <div id="section-color-rec">
            <p className={SECTION_SUB}>잘 어울리는 컬러</p>
            <div className="flex flex-col gap-1.5">
              {colorGuide.recommended.map((color, i) => (
                <div key={`rec-${i}`} className="flex items-start gap-2 text-sm text-stone-700 leading-relaxed">
                  <ColorSwatch colorStr={color} />
                  <span>{color}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {Array.isArray(colorGuide.avoid) && colorGuide.avoid.length > 0 && (
          <div id="section-color-avoid">
            <p className={SECTION_SUB}>피할 컬러</p>
            <div className="flex flex-col gap-1.5">
              {colorGuide.avoid.map((color, i) => (
                <div key={`av-${i}`} className="flex items-start gap-2 text-sm text-stone-700 leading-relaxed">
                  <ColorSwatch colorStr={color} />
                  <span>{color}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.section>
  );
}

function HairSection({ hairGrooming, isStreaming, num, revealDelay = 0 }) {
  if (hairGrooming === undefined && isStreaming) return <SectionSkeleton lines={5} headingWidth="w-28" />;
  if (!hairGrooming) return null;
  const { direction, grooming_tips, grooming_tip } = hairGrooming;
  if (!direction && !Array.isArray(grooming_tips) && !grooming_tip) return null;
  return (
    <motion.section
      id="section-hair"
      className="border-t border-stone-200 pt-6 mb-8"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: revealDelay }}
    >
      <p className={SECTION_H}>{num ? `${num}. ` : ''}헤어 & 그루밍</p>
      <div className="flex flex-col gap-5">
        {direction && (
          <div id="section-hair-direction">
            <ParagraphBlock text={direction} className="text-sm text-stone-700 leading-relaxed" gapClassName="gap-2" />
          </div>
        )}
        {Array.isArray(grooming_tips) && grooming_tips.length > 0 && (
          <div id="section-hair-grooming" className="flex flex-col gap-5">
            {grooming_tips.map((tip, i) => (
              <div key={i}>
                <p className="text-sm font-medium text-stone-900 mb-1">{tip.habit}</p>
                <p className="text-sm text-stone-600 leading-relaxed">{tip.context_why}</p>
                {tip.how_to_start && (
                  <p className="text-xs text-stone-400 leading-relaxed mt-1">→ {tip.how_to_start}</p>
                )}
              </div>
            ))}
          </div>
        )}
        {!Array.isArray(grooming_tips) && grooming_tip && (
          <p className="text-sm text-stone-600 leading-relaxed">{grooming_tip}</p>
        )}
      </div>
    </motion.section>
  );
}

function FormulaSection({ stylingFormula, formulasPartial, isStreaming, num, revealDelay = 0 }) {
  const isPartial = stylingFormula === undefined && !!formulasPartial?.length;
  const formulas = stylingFormula?.formulas ?? (isPartial ? formulasPartial : null);

  // 아직 아이템 없음 — 전체 skeleton
  if (!formulas?.length && isStreaming) return <SectionSkeleton lines={6} headingWidth="w-24" />;
  if (!formulas?.length) return null;

  return (
    <motion.section
      id="section-formula"
      className="border-t border-stone-200 pt-6 mb-8"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: revealDelay }}
    >
      <p className={SECTION_H}>{num ? `${num}. ` : ''}코디 공식</p>
      {stylingFormula?.intro && (
        <ParagraphBlock text={stylingFormula.intro} className="text-sm text-stone-600 leading-relaxed mb-5" gapClassName="gap-3" />
      )}
      <div className="flex flex-col">
        {formulas.map((formula, index) => (
          <motion.div
            key={`formula-item-${formula.title ?? index}`}
            id={`section-formula-item-${index}`}
            className="border-t border-stone-100 pt-4 pb-4 first:border-t-0 first:pt-0"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <p className="text-sm font-medium text-stone-900 leading-snug mb-2">{index + 1}. {formula.title}</p>
            <ParagraphBlock text={formula.detail} className="text-sm text-stone-600 leading-relaxed" gapClassName="gap-2" />
            <ShopLinks keywords={formula.keywords} />
          </motion.div>
        ))}
        {/* 더 생성 중 표시 — 부분 로딩 상태일 때만 */}
        {isPartial && (
          <div className="border-t border-stone-100 pt-3 pb-1 flex gap-[5px] items-center">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="block w-1.5 h-1.5 rounded-full bg-stone-300"
                animate={{ opacity: [0.2, 0.85, 0.2] }}
                transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.25, ease: 'easeInOut' }}
              />
            ))}
          </div>
        )}
      </div>
    </motion.section>
  );
}

function ShoppingSection({ shoppingCriteria, shoppingItemsPartial, legacyCategories, isStreaming, num, revealDelay = 0 }) {
  const isPartial = shoppingCriteria === undefined && !!shoppingItemsPartial?.length;
  const items = Array.isArray(shoppingCriteria?.items)
    ? shoppingCriteria.items
    : isPartial ? shoppingItemsPartial : [];

  // 아직 아이템 없음 — 전체 skeleton
  if (shoppingCriteria === undefined && !items.length && isStreaming) return <SectionSkeleton lines={7} headingWidth="w-24" />;
  if (!shoppingCriteria?.intro && !items.length && !legacyCategories?.length) return null;

  return (
    <motion.section
      id="section-shopping"
      className="border-t border-stone-200 pt-6 mb-8"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: revealDelay }}
    >
      <p className={SECTION_H}>{num ? `${num}. ` : ''}아이템 추천</p>
      {shoppingCriteria?.intro && (
        <ParagraphBlock text={shoppingCriteria.intro} className="text-sm text-stone-600 leading-relaxed mb-5" gapClassName="gap-3" />
      )}
      {!!items.length && (
        <div className="flex flex-col">
          {items.map((item, index) => {
            const meta = categoryMeta(item.category);
            const Icon = meta.icon;
            // musinsa_queries 배열 우선, 없으면 단일 musinsa_query 폴백 (구버전 호환)
            const musinsaQueries = Array.isArray(item.musinsa_queries) && item.musinsa_queries.length
              ? item.musinsa_queries
              : item.musinsa_query ? [item.musinsa_query] : [];
            return (
              <motion.div
                key={`shopping-item-${item.category ?? index}`}
                id={`section-shopping-item-${index}`}
                className="py-4 border-t border-stone-100 first:border-t-0 first:pt-0"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
              >
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Icon className="w-3.5 h-3.5 text-stone-400" strokeWidth={1.7} />
                  <p className="text-xs font-medium text-stone-600 uppercase tracking-wide">{meta.label}</p>
                </div>
                {item.recommendation && (
                  <p className="text-sm text-stone-900 font-medium leading-snug mb-2">{item.recommendation}</p>
                )}
                {item.why_this && (
                  <p className="text-sm text-stone-600 leading-relaxed mb-2">{item.why_this}</p>
                )}
                {item.look_for && (
                  <div className="mb-2.5">
                    <p className="text-[10px] tracking-widest uppercase text-stone-400 mb-1">볼 것</p>
                    <p className="text-xs text-stone-600 leading-relaxed">{item.look_for}</p>
                  </div>
                )}
                {item.avoid && (
                  <div className="mb-2.5">
                    <p className="text-[10px] tracking-widest uppercase text-stone-400 mb-1">피할 것</p>
                    <p className="text-xs text-stone-600 leading-relaxed">{item.avoid}</p>
                  </div>
                )}
                {item.budget_note && (
                  <div className="mb-1">
                    <p className="text-[10px] tracking-widest uppercase text-stone-400 mb-1">예산</p>
                    <p className="text-xs text-stone-600 leading-relaxed">{item.budget_note}</p>
                  </div>
                )}
                <ShopLinks keywords={musinsaQueries} />
              </motion.div>
            );
          })}
          {/* 더 생성 중 표시 — 부분 로딩 상태일 때만 */}
          {isPartial && (
            <div className="border-t border-stone-100 pt-3 pb-1 flex gap-[5px] items-center">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="block w-1.5 h-1.5 rounded-full bg-stone-300"
                  animate={{ opacity: [0.2, 0.85, 0.2] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.25, ease: 'easeInOut' }}
                />
              ))}
            </div>
          )}
        </div>
      )}
      <BudgetBreakdown breakdown={shoppingCriteria?.budget_breakdown} totalBudget={shoppingCriteria?.total_budget} />
      {/* 구버전 호환 */}
      {!shoppingCriteria && !!legacyCategories?.length && (
        <div className="flex flex-col gap-4">
          {legacyCategories.map((item, index) => {
            const meta = categoryMeta(item.category);
            const Icon = meta.icon;
            return (
              <div key={`${item.category}-${index}`} className="border border-stone-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="w-4 h-4 text-stone-500" strokeWidth={1.7} />
                  <p className="text-sm font-medium text-stone-900">{meta.label}</p>
                </div>
                <div className="flex flex-col gap-2">
                  {item.keywords && <p className="text-xs text-stone-500"><span className="text-stone-900">키워드:</span> {item.keywords}</p>}
                  {item.brands && <p className="text-xs text-stone-500"><span className="text-stone-900">브랜드:</span> {item.brands}</p>}
                  {item.match && <ParagraphBlock text={item.match} className="text-xs text-stone-500 leading-relaxed" gapClassName="gap-2" />}
                  {item.effect && <p className="text-xs text-stone-500"><span className="text-stone-900">기대 인상:</span> {item.effect}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.section>
  );
}

function ClosingSection({ closing, isStreaming, num, revealDelay = 0 }) {
  if (closing === undefined && isStreaming) return <SectionSkeleton lines={3} headingWidth="w-16" />;
  if (!closing) return null;
  return (
    <motion.section
      id="section-closing"
      className="border-t border-stone-200 pt-6 mb-8"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: revealDelay }}
    >
      <p className={SECTION_H}>{num ? `${num}. ` : ''}결론</p>
      <ParagraphBlock text={closing} className="text-sm text-stone-500 leading-relaxed" gapClassName="gap-3" />
    </motion.section>
  );
}

const COACHING_CHARS = ['ICMT', 'RDMT', 'RCET', 'IDET'];


function ConsultingCTASection({ navigate }) {
  const [charIdx, setCharIdx] = useState(0);
  const [showModal, setShowModal] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setCharIdx(i => (i + 1) % COACHING_CHARS.length), 3000);
    return () => clearInterval(t);
  }, []);
  const activeCode = COACHING_CHARS[charIdx];
  const activeChar = typeImages[activeCode];

  return (
    <div className="border-t border-stone-200 pt-8 pb-6">
      <p className={SECTION_H}>다음 단계</p>
      <div className="relative">
        <RecommendBadge />
        <button
          onClick={() => setShowModal(true)}
          className="w-full px-5 py-5 rounded-3xl text-left transition-all duration-150 active:scale-[0.98] flex items-center gap-4"
          style={{
            backgroundColor: '#3A3028',
            border: '1px solid #4A3E35',
            boxShadow: '0 2px 16px 0 rgba(0,0,0,0.2)',
          }}
        >
          <div className="shrink-0 flex items-center justify-center overflow-hidden" style={{ width: 52, height: 60 }}>
            <AnimatePresence mode="wait">
              <motion.img
                key={activeCode}
                src={activeChar}
                alt=""
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="object-contain object-bottom"
                style={{ height: 60, width: 52 }}
              />
            </AnimatePresence>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] tracking-[0.22em] uppercase mb-1.5" style={{ color: 'rgba(240,235,228,0.5)' }}>
              1:1 COACHING
            </p>
            <p className="text-[18px] font-medium tracking-tight leading-snug" style={{ color: '#F5F0EB' }}>
              1:1 스타일 코칭
            </p>
            <p className="mt-1 text-[12px] leading-relaxed" style={{ color: 'rgba(240,235,228,0.65)' }}>
              처방전 기준을 바탕으로 옷장·쇼핑·코디 실행까지
            </p>
          </div>
        </button>
      </div>
      <AnimatePresence>
        {showModal && <CoachingModal onClose={() => setShowModal(false)} prescriptionDone={true} />}
      </AnimatePresence>
    </div>
  );
}

// ── 메인 컴포넌트 ──────────────────────────────────────────────
export default function PrescriptionResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { reportId: paramReportId } = useParams();
  const { user } = useAuth();

  // ── 스트리밍 store 구독 ──────────────────────────────────────
  const streamData = usePrescriptionStream();
  // 스트리밍 모드: paramReportId 없거나, 있으면 store의 reportId와 일치해야 함
  const isStreamMode = (streamData.status === 'loading' || streamData.status === 'streaming' || streamData.status === 'done')
    && (!paramReportId || streamData.reportId === paramReportId);
  const isStreaming = streamData.status === 'streaming' && isStreamMode;
  // streaming 완료 후 URL 교체로 remount 될 때 loading 재표시 방지
  const [allMessagesShown, setAllMessagesShown] = useState(() => streamData.status === 'done');
  // loading phase: 상태가 loading이거나, streaming 진입했어도 메시지 미완료면 유지
  const isLoadingPhase = isStreamMode && (streamData.status === 'loading' || (streamData.status !== 'idle' && !allMessagesShown));

  // ── 발급 시각 고정 ────────────────────────────────────────────
  const [reportTime] = useState(() => new Date());

  // ── 기존 상태 ────────────────────────────────────────────────
  const [title, setTitle] = useState(location.state?.title ?? null);
  const [fromType, setFromType] = useState(location.state?.fromType ?? null);
  const [reportId, setReportId] = useState(location.state?.reportId ?? paramReportId ?? null);
  const [report, setReport] = useState(() => normalizeStylePrescription(location.state?.report));
  const [fitPics, setFitPics] = useState(() => Array.isArray(location.state?.fitPics) ? location.state.fitPics : []);
  const [loadedDetailReportId, setLoadedDetailReportId] = useState(
    Array.isArray(location.state?.fitPics) ? (location.state?.reportId ?? paramReportId ?? null) : null,
  );
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [redirected, setRedirected] = useState(false);

  // ── loading→skeleton 전환 시 stagger reveal 제어 ────────────────
  // streaming 시작 때가 아닌 loading 화면이 실제로 끝나는 순간에 트리거해야
  // 그 시점에 이미 도착한 섹션들이 순차 reveal됨
  const prevLoadingPhaseRef = useRef(isLoadingPhase);
  const staggerStartedRef = useRef(false);
  const [staggerActive, setStaggerActive] = useState(false);
  useEffect(() => {
    const wasLoading = prevLoadingPhaseRef.current;
    prevLoadingPhaseRef.current = isLoadingPhase;
    if (wasLoading && !isLoadingPhase && !staggerStartedRef.current) {
      staggerStartedRef.current = true;
      setStaggerActive(true);
      // 섹션 수(7) × 1.5s + 여유 = 12초
      const t = setTimeout(() => setStaggerActive(false), 12000);
      return () => clearTimeout(t);
    }
  }, [isLoadingPhase]);
  const sd = (i) => staggerActive ? i * 1.5 : 0;

  // 스태거 시작 시 제목·1번 섹션도 잠깐 스켈레톤 보여주기
  const [titleStaggerReady, setTitleStaggerReady] = useState(true);
  const [dirStaggerReady, setDirStaggerReady] = useState(true);
  useEffect(() => {
    if (!staggerActive) return;
    setTitleStaggerReady(false);
    setDirStaggerReady(false);
    const t1 = setTimeout(() => setTitleStaggerReady(true), 700);
    const t2 = setTimeout(() => setDirStaggerReady(true), 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [staggerActive]);

  useEffect(() => {
    const setMeta = (sel, val) => document.querySelector(sel)?.setAttribute('content', val);
    const ogImage = 'https://vizuden.com/api/og-png?page=prescription';
    const ogTitle = 'VIZUDEN — AI 스타일 처방전';
    const ogDesc = '커리어·취향·라이프스타일 기반 AI 진단. 나만의 스타일 기준을 처방받으세요.';
    document.title = ogTitle;
    setMeta('meta[property="og:title"]', ogTitle);
    setMeta('meta[property="og:description"]', ogDesc);
    setMeta('meta[property="og:image"]', ogImage);
    setMeta('meta[name="twitter:title"]', ogTitle);
    setMeta('meta[name="twitter:description"]', ogDesc);
    setMeta('meta[name="twitter:image"]', ogImage);
    return () => { document.title = 'VIZUDEN — 스타일 정체성 진단'; };
  }, []);

  // ── 스트리밍 완료 시 URL을 최종 reportId로 교체 ──────────────
  useEffect(() => {
    if (streamData.status === 'done' && streamData.reportId && !paramReportId) {
      navigate(`/prescription/result/${streamData.reportId}`, { replace: true });
    }
  }, [streamData.status, streamData.reportId, paramReportId, navigate]);

  // ── 스트리밍 중 새 섹션 도착 시 해당 섹션으로 스크롤 ─────────
  // fs가 변하면 이전 frontier에 해당하는 섹션이 막 도착했다는 의미
  const _prevFsRef = useRef(null);
  // fs는 render-time 계산이므로 effect dependency로 넘기기 위해 별도 저장
  const _fsForEffect = isStreaming ? (
    streamData.direction === undefined         ? 'direction' :
    streamData.stylingFormula === undefined    ? 'formula'   :
    streamData.shopping_criteria === undefined ? 'shopping'  :
    streamData.hair_grooming === undefined     ? 'hair'      :
    streamData.color_guide === undefined       ? 'color'     :
    streamData.styling_snapshot === undefined  ? 'snapshot'  :
    streamData.closing === undefined           ? 'closing'   :
    streamData.criteria === undefined          ? 'criteria'  :
    null
  ) : null;

  useEffect(() => {
    // 자동 스크롤 비활성화 — ref만 최신으로 유지
    _prevFsRef.current = _fsForEffect;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_fsForEffect]);

  // ── 기존 데이터 로딩 (스트리밍 모드에서는 스킵) ──────────────
  useEffect(() => {
    if (isStreamMode) return; // 스트리밍 중이면 redirect / fetch 금지

    const saved = readPrescriptionSaved();
    const nextTitle = title ?? saved?.title ?? null;
    const nextType = fromType ?? saved?.fromType ?? null;
    const nextReportId = reportId ?? saved?.reportId ?? null;
    const nextReport = report ?? normalizeStylePrescription(saved?.report);

    if (nextTitle !== title) setTitle(nextTitle);
    if (nextType !== fromType) setFromType(nextType);
    if (nextReportId !== reportId) setReportId(nextReportId);
    if (!report && nextReport) setReport(nextReport);

    const targetReportId = paramReportId || nextReportId;
    if (!targetReportId) {
      setRedirected(true);
      navigate('/', { replace: true });
      return;
    }

    if (report && targetReportId === reportId && loadedDetailReportId === targetReportId) return;

    setLoading(true);
    fetch(`/api/prescription-full?reportId=${targetReportId}`)
      .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data?.error || 'failed');
        const normalized = normalizeStylePrescription(data?.report);
        if (!normalized) throw new Error('invalid report');
        setReport(normalized);
        setTitle(data?.title ?? null);
        setReportId(targetReportId);
        setFitPics(Array.isArray(data?.fitPics) ? data.fitPics : []);
        setLoadedDetailReportId(targetReportId);
      })
      .catch(() => {
        setRedirected(true);
        navigate('/', { replace: true });
      })
      .finally(() => setLoading(false));
  }, [isStreamMode, fromType, loadedDetailReportId, navigate, paramReportId, report, reportId, title]);

  // ── display 값 — 스트리밍 vs 기존 로드 ─────────────────────
  const displayReport = isStreamMode ? streamData : report;
  const displayFitPics = isStreamMode ? (streamData.fitPics ?? []) : fitPics;
  const displayFromType = isStreamMode ? (streamData.fromType ?? fromType) : fromType;
  const displayTitle = isStreamMode ? streamData.title : title;
  const displayReportId = isStreamMode ? streamData.reportId : reportId;

  const typeResult = useMemo(() => (displayFromType ? types[displayFromType] : null), [displayFromType]);

  async function handleCopyLink() {
    try {
      const url = displayReportId
        ? `${window.location.origin}/prescription/result/${displayReportId}`
        : window.location.href;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {}
  }

  // ── 얼리 리턴 ────────────────────────────────────────────────
  if (redirected) return null;

  // 로딩 페이즈 — bar loading 화면 (메시지 모두 표시 후에만 전환)
  if (isLoadingPhase) {
    return (
      <div className="min-h-screen flex flex-col items-center px-6" style={{ backgroundColor: '#F5F2ED' }}>
        <div className="w-full max-w-sm flex flex-col">
          <SiteHeader onLogoClick={() => navigate('/')} />
          <LoadingScreen done={false} onDone={() => {}} onAllMessagesShown={() => setAllMessagesShown(true)} />
        </div>
      </div>
    );
  }

  // 스트리밍 에러
  if (isStreamMode && streamData.status === 'error') {
    const code = streamData.errorCode;

    if (code === 'quota') {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ backgroundColor: '#F5F2ED' }}>
          <p className="text-xs tracking-widest text-stone-400 uppercase mb-4">처방 마감</p>
          <h2 className="text-xl font-light text-stone-900 mb-2 leading-snug"
            style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}>
            오늘 처방 인원이<br />마감됐어요
          </h2>
          <p className="text-sm text-stone-500 leading-relaxed mb-8">초대 코드가 있으면 지금 바로 시작할 수 있어요.</p>
          <button
            onClick={() => { resetPrescriptionStream(); navigate('/prescription', { state: { showQuota: true } }); }}
            className="text-xs text-stone-600 border border-stone-300 px-5 py-3 hover:border-stone-500 transition-colors"
          >
            초대 코드 입력하기
          </button>
        </div>
      );
    }

    const errorMeta = {
      invite_invalid: { tag: '초대 코드 오류', msg: '유효하지 않은 초대 코드예요.', sub: null },
      server:         { tag: '서버 오류', msg: '서버에서 오류가 발생했어요.', sub: '잠시 후 다시 시도해주세요.' },
      client:         { tag: '요청 오류', msg: '요청을 처리할 수 없었어요.', sub: '앱을 새로고침 후 다시 시도해주세요.' },
    };
    const meta = errorMeta[code] ?? { tag: '처방전 오류', msg: '처방전 생성 중 오류가 발생했어요.', sub: '잠시 후 다시 시도해주세요.' };

    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ backgroundColor: '#F5F2ED' }}>
        <p className="text-xs tracking-widest text-stone-400 uppercase mb-4">{meta.tag}</p>
        <h2 className="text-xl font-light text-stone-900 mb-2 leading-snug"
          style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}>
          {meta.msg}
        </h2>
        {meta.sub && <p className="text-sm text-stone-400 mb-8">{meta.sub}</p>}
        {!meta.sub && <div className="mb-8" />}
        <button
          onClick={() => { resetPrescriptionStream(); navigate('/prescription'); }}
          className="text-xs text-stone-600 border border-stone-300 px-5 py-3 hover:border-stone-500 transition-colors"
        >
          다시 시도하기
        </button>
      </div>
    );
  }

  // 기존 로딩 / 빈 report (스트리밍 모드 아닐 때만)
  if (!isStreamMode && (loading || !report)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: '#F5F2ED' }}>
        <p className="text-xs tracking-widest text-stone-400 uppercase">보고서 불러오는 중...</p>
      </div>
    );
  }

  // ── 렌더링 데이터 계산 ────────────────────────────────────────
  const shoppingItems = Array.isArray(displayReport?.shopping_criteria?.items)
    ? displayReport.shopping_criteria.items : [];
  const legacyCategories = Array.isArray(displayReport?.recommendations?.practical?.categories)
    ? displayReport.recommendations.practical.categories : [];

  // 보너스 섹션 표시 여부
  const showBonusSections = isStreaming
    ? displayReport?.closing !== undefined
    : !!(displayReport?.criteria?.length || displayReport?.stylingFormula?.actionPlan);

  // TOC — 스트리밍 완료 후에만 표시
  const ap = displayReport?.stylingFormula?.actionPlan;
  const cg = displayReport?.color_guide;
  const hg = displayReport?.hair_grooming;
  const sn = displayReport?.styling_snapshot;

  // 섹션 번호 맵 — 실제 렌더 여부 기준 동적 계산 (숨겨진 섹션은 번호 skip)
  const sectionNumMap = (() => {
    const visible = [
      { id: 'section-direction', show: !!(displayReport?.direction || isStreaming) },
      { id: 'section-formula',   show: !!(displayReport?.stylingFormula?.formulas?.length || isStreaming) },
      { id: 'section-shopping',  show: !!(displayReport?.shopping_criteria?.intro || shoppingItems.length || legacyCategories.length || isStreaming) },
      { id: 'section-hair',      show: !!(hg?.direction || hg?.grooming_tips?.length || hg?.grooming_tip || isStreaming) },
      { id: 'section-color',     show: !!(cg?.combo_tip || cg?.best_colors?.length || cg?.ok_colors?.length || cg?.recommended?.length || isStreaming) },
      { id: 'section-snapshot',  show: !!(displayFitPics.length > 0 || sn?.level) }, // snapshot은 데이터 있을 때만
      { id: 'section-closing',   show: !!(displayReport?.closing || isStreaming) },
    ];
    const map = {};
    let n = 0;
    visible.forEach(({ id, show }) => { if (show) map[id] = ++n; });
    return map;
  })();
  // TOC 순서 = LLM 출력 순서 (direction → formula → shopping → hair → color → snapshot → closing)
  const tocSections = !isStreaming ? [
    displayReport?.direction && {
      id: 'section-direction', label: '스타일 방향',
      summary: displayReport.direction_label || tocSentence(displayReport.direction) || undefined,
    },
    displayReport?.stylingFormula?.formulas?.length && {
      id: 'section-formula', label: '코디 공식',
      sub: (displayReport.stylingFormula.formulas ?? []).map((f, i) => ({
        id: `section-formula-item-${i}`, label: f.title,
      })),
    },
    (displayReport?.shopping_criteria?.intro || shoppingItems.length) && {
      id: 'section-shopping', label: '아이템 추천',
      summary: displayReport?.shopping_criteria?.intro ? tocSummary(displayReport.shopping_criteria.intro) : undefined,
      sub: shoppingItems.map((item, i) => ({
        id: `section-shopping-item-${i}`, label: item.category,
        summary: item.recommendation ? tocSummary(item.recommendation, 18) : undefined,
      })),
    },
    (hg?.direction || hg?.grooming_tips?.length) && {
      id: 'section-hair', label: '헤어',
      sub: [
        hg?.direction && { id: 'section-hair-direction', label: '헤어 방향', summary: hg.direction_label || tocSentence(hg.direction) || undefined },
        hg?.grooming_tips?.length && {
          id: 'section-hair-grooming', label: '그루밍',
          summary: hg.grooming_tips[0]?.habit ? tocSummary(hg.grooming_tips[0].habit) : undefined,
        },
      ].filter(Boolean),
    },
    (cg?.combo_tip || cg?.best_colors?.length || cg?.ok_colors?.length || cg?.recommended?.length) && {
      id: 'section-color', label: '컬러',
      summary: cg?.combo_tip ? tocSummary(cg.combo_tip) : undefined,
      sub: [
        (cg?.best_colors?.length || cg?.ok_colors?.length || cg?.recommended?.length) && {
          id: 'section-color-rec', label: '잘 어울리는 컬러',
          summary: cg?.best_colors?.[0] ? cg.best_colors.map(c => extractColorName(c)).join(', ') : undefined,
        },
        cg?.avoid?.length && { id: 'section-color-avoid', label: '피할 컬러', summary: cg.avoid.map(c => extractColorName(c)).join(', ') },
      ].filter(Boolean),
    },
    (displayFitPics.length > 0 || sn?.level) && {
      id: 'section-snapshot', label: '진단',
      sub: [
        sn?.level && { id: 'section-snapshot-level', label: '스타일 레벨', summary: sn.level_note ? tocSummary(sn.level_note) : sn.level },
        sn?.quick_fix && { id: 'section-snapshot-quickfix', label: '지금 바꿀 것', summary: tocSummary(sn.quick_fix) },
      ].filter(Boolean),
    },
    // ── 보너스 섹션 (결론 앞에) ──
    displayReport?.criteria?.length && {
      id: 'section-criteria', label: '기준',
      bonus: true,
      sub: (displayReport.criteria ?? []).map((c, i) => ({
        id: `section-criterion-${i}`, label: c.title,
      })),
    },
    ap && {
      id: 'section-action', label: '실행 계획',
      bonus: true,
      sub: [
        ap.thisWeek && { id: 'section-action-0', label: '이번 주', summary: ap.thisWeek_label || tocSentence(ap.thisWeek) || undefined },
        ap.thisMonth && { id: 'section-action-1', label: '이번 달', summary: ap.thisMonth_label || tocSentence(ap.thisMonth) || undefined },
        ap.threeMonths && { id: 'section-action-2', label: '3개월', summary: ap.threeMonths_label || tocSentence(ap.threeMonths) || undefined },
      ].filter(Boolean),
    },
    displayReport?.closing && {
      id: 'section-closing', label: '결론',
      summary: displayReport.closing_label || tocSentence(displayReport.closing) || undefined,
    },
  ].filter(Boolean) : [];

  // 프론티어: LLM 출력 순서 기준 첫 번째 미도착 섹션
  // 실제 도착 순서: direction → stylingFormula → shopping_criteria → hair_grooming → color_guide → styling_snapshot → closing → criteria
  const fs = isStreaming ? (
    displayReport?.direction === undefined         ? 'direction' :
    displayReport?.stylingFormula === undefined    ? 'formula'   :
    displayReport?.shopping_criteria === undefined ? 'shopping'  :
    displayReport?.hair_grooming === undefined     ? 'hair'      :
    displayReport?.color_guide === undefined       ? 'color'     :
    displayReport?.styling_snapshot === undefined  ? 'snapshot'  :
    displayReport?.closing === undefined           ? 'closing'   :
    displayReport?.criteria === undefined          ? 'criteria'  :
    null
  ) : null;

  function scrollToSection(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const headerEl = document.querySelector('header');
    const headerHeight = headerEl ? headerEl.offsetHeight : 0;
    const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - 8;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.35 }}
      className="min-h-screen flex flex-col items-center px-6"
      style={{ backgroundColor: '#F5F2ED' }}
    >
      <div className="w-full max-w-sm flex flex-col">
        <SiteHeader onLogoClick={() => navigate('/')} />

        <div className="flex flex-col py-4 pb-28">

          {/* ── 발급 정보 헤더 ── */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-xs tracking-[0.28em] text-stone-600 uppercase font-semibold">VIZUDEN</p>
              <p className="text-xs tracking-[0.14em] text-stone-400 uppercase mt-0.5">스타일 처방전</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-stone-500">
                {reportTime.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })}
              </p>
              <p className="text-xs font-mono text-stone-400 mt-0.5">
                {reportTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
              </p>
            </div>
          </div>

          {/* ── 보고서 제목 (skeleton 포함) ── */}
          {(isStreaming && displayTitle === undefined) || !titleStaggerReady ? (
            <div className="mb-7 animate-pulse">
              <div className="h-6 w-3/4 bg-stone-200 rounded" />
              <div className="border-t border-stone-200 mt-4" />
            </div>
          ) : displayTitle ? (
            <motion.div
              className="mb-7"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="text-xl font-light text-stone-900 leading-snug"
                style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.015em' }}>
                {displayTitle}
              </h1>
              <div className="border-t border-stone-200 mt-4" />
            </motion.div>
          ) : null}

          {/* ── 타입 이미지 ── */}
          {displayFromType && typeImages[displayFromType] && (
            <div className="flex justify-center mb-6">
              <img src={typeImages[displayFromType]} alt={typeResult?.nameKo} className="w-36 h-36 object-contain" />
            </div>
          )}

          {/* ── 섹션 렌더링 ── */}
          {tocSections.length > 1 && (
            <TOCBlock sections={tocSections} onScrollTo={scrollToSection} />
          )}

          {/* 섹션 렌더 순서: direction → formula → shopping → hair → color → snapshot
               → [보너스: criteria → action] → closing (항상 맨 마지막) */}
          {isStreaming && fs === 'direction' && <FrontierStatus frontierKey="direction" />}
          {!isStreaming && !dirStaggerReady
            ? <SectionSkeleton lines={3} headingWidth="w-24" />
            : <DirectionSection direction={displayReport?.direction} isStreaming={isStreaming} num={sectionNumMap['section-direction']} revealDelay={dirStaggerReady ? 0 : sd(0)} />
          }

          {isStreaming && fs === 'formula' && !streamData.formulasPartial?.length && <FrontierStatus frontierKey="formula" />}
          <FormulaSection stylingFormula={displayReport?.stylingFormula} formulasPartial={streamData.formulasPartial} isStreaming={isStreaming} num={sectionNumMap['section-formula']} revealDelay={sd(1)} />

          {isStreaming && fs === 'shopping' && !streamData.shoppingItemsPartial?.length && <FrontierStatus frontierKey="shopping" />}
          <ShoppingSection shoppingCriteria={displayReport?.shopping_criteria} shoppingItemsPartial={streamData.shoppingItemsPartial} legacyCategories={legacyCategories} isStreaming={isStreaming} num={sectionNumMap['section-shopping']} revealDelay={sd(2)} />

          {isStreaming && fs === 'hair' && <FrontierStatus frontierKey="hair" />}
          <HairSection hairGrooming={displayReport?.hair_grooming} isStreaming={isStreaming} num={sectionNumMap['section-hair']} revealDelay={sd(3)} />

          {isStreaming && fs === 'color' && <FrontierStatus frontierKey="color" />}
          <ColorSection colorGuide={displayReport?.color_guide} isStreaming={isStreaming} num={sectionNumMap['section-color']} revealDelay={sd(4)} />

          {isStreaming && fs === 'snapshot' && <FrontierStatus frontierKey="snapshot" />}
          <SnapshotSection fitPics={displayFitPics} snapshot={displayReport?.styling_snapshot} num={sectionNumMap['section-snapshot']} />

          {/* ── 보너스 섹션 (closing 도착 후 표시) ── */}
          {showBonusSections && (
            <>
              <BonusSeparator />
              {/* BonusSeparator 바로 뒤 첫 섹션은 border 제거 */}
              <CriteriaSection criteria={displayReport?.criteria} isStreaming={isStreaming} noTopBorder bonusNum={1} revealDelay={sd(5)} />
              <ActionPlanSection actionPlan={displayReport?.stylingFormula?.actionPlan} bonusNum={displayReport?.criteria?.length ? 2 : 1} />
              {isStreaming && fs === 'criteria' && <FrontierStatus frontierKey="criteria" />}
            </>
          )}

          {/* ── 결론 — 항상 맨 마지막 ── */}
          {isStreaming && fs === 'closing' && <FrontierStatus frontierKey="closing" />}
          <ClosingSection closing={displayReport?.closing} isStreaming={isStreaming} num={sectionNumMap['section-closing']} revealDelay={sd(6)} />

          {!isStreaming && (
            <ConsultingCTASection navigate={navigate} />
          )}

        </div>
      </div>

      {/* ── Fixed bottom — 스트리밍/로딩 중 숨김 ── */}
      {!isStreaming && !loading && (
      <div className="fixed bottom-0 left-0 right-0 flex justify-center pointer-events-none z-40">
        <div className="w-full max-w-sm px-6 pb-6 pt-10 pointer-events-auto"
          style={{ background: 'linear-gradient(to top, rgba(245,242,237,0.98) 62%, rgba(245,242,237,0))' }}>
          {!user && (
            <p className="text-xs text-stone-400 text-center mb-3">저장하려면 로그인이 필요합니다</p>
          )}
          <div className="flex gap-2">
            {!user && (
              <button
                onClick={() => navigate('/auth/email', {
                  state: { nextPath: displayReportId ? `/prescription/result/${displayReportId}` : '/prescription/result' },
                })}
                className="flex-1 py-3.5 bg-stone-900 text-stone-50 text-xs tracking-widest uppercase
                  hover:bg-stone-800 active:bg-stone-700 transition-colors duration-200"
              >
                로그인 · 저장
              </button>
            )}
            <button
              type="button"
              onClick={handleCopyLink}
              className={`${!user ? 'flex-1' : 'w-full'} py-3.5 border border-stone-300 text-stone-600 text-xs tracking-widest uppercase
                flex items-center justify-center gap-2
                hover:border-stone-600 hover:text-stone-800 transition-colors duration-150`}
            >
              {copied
                ? <><Check className="w-3.5 h-3.5" strokeWidth={2} /><span>복사됨</span></>
                : <><LinkIcon className="w-3.5 h-3.5" strokeWidth={1.8} /><span>공유하기</span></>}
            </button>
          </div>
        </div>
      </div>
      )}

      {/* ── 스트리밍 중 하단 고정 scroll pill ── */}
      <AnimatePresence mode="wait">
        {isStreaming && fs && (
          <StreamingScrollPill
            key={fs}
            frontierKey={fs}
            onScrollToFrontier={() => {
              // FrontierStatus가 렌더 안 될 때(부분 아이템이 있을 때) 섹션으로 폴백
              let el = document.getElementById('frontier-status');
              if (!el) {
                const fallbackId = fs === 'formula' ? 'section-formula'
                  : fs === 'shopping' ? 'section-shopping'
                  : null;
                if (fallbackId) el = document.getElementById(fallbackId);
              }
              if (!el) return;
              const top = el.getBoundingClientRect().top + window.scrollY - 80;
              window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
