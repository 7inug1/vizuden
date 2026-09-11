import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import SiteHeader from '../components/SiteHeader';
import ErrorScreen from '../components/ErrorScreen';
import { useNickname } from '../context/NicknameContext';

const CREAM = '#F5F2ED';
const DARK  = '#1c1917';

// ── 컬러명 → hex ────────────────────────────────────────────────
const COLOR_MAP = [
  [/화이트|흰/, '#F3F1ED'],
  [/아이보리|ivory/, '#F5F0E0'],
  [/크림|cream/, '#FFF5DC'],
  [/에크루|ecru/, '#EFE6CA'],
  [/베이지|beige/, '#D4B99A'],
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
  [/화이트/, '#F3F1ED'],
];
function colorNameToHex(str) {
  const lower = str.toLowerCase();
  for (const [re, hex] of COLOR_MAP) {
    if (re.test(lower)) return hex;
  }
  return null;
}
function ColorSwatch({ colorStr }) {
  const hex = colorNameToHex(colorStr);
  if (!hex) return null;
  const isDark = hex === '#1c1917' || hex === '#1F3050' || hex === '#36454F' || hex === '#722F37' || hex === '#800020';
  return (
    <span
      style={{
        display: 'inline-block', width: 12, height: 12,
        backgroundColor: hex,
        border: isDark ? 'none' : '1px solid rgba(0,0,0,0.12)',
        borderRadius: 2, flexShrink: 0, marginTop: 1,
      }}
    />
  );
}

// ── 예산 파이 차트 ───────────────────────────────────────────────
const BUDGET_PALETTE = ['#C49A78', '#6B9E8E', '#9B8BA6', '#B8906A', '#7A9BB5', '#8C7A6B'];

function formatWon(amount) {
  if (!amount || isNaN(Number(amount))) return '';
  const n = Number(amount);
  if (n >= 10000) return `약 ${Math.round(n / 10000)}만원`;
  return `약 ${n.toLocaleString()}원`;
}

function BudgetDonutChart({ slices, totalBudget }) {
  const [activeIdx, setActiveIdx] = useState(null);
  if (!slices.length) return null;
  const cx = 100, cy = 100, ro = 88, ri = 54;
  function polarXY(angle, r) { return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }; }
  function slicePath(start, end, rOuter, rInner) {
    const a0 = start * 2 * Math.PI - Math.PI / 2;
    const a1 = end * 2 * Math.PI - Math.PI / 2;
    const o0 = polarXY(a0, rOuter), o1 = polarXY(a1, rOuter);
    const i0 = polarXY(a0, rInner), i1 = polarXY(a1, rInner);
    const large = end - start > 0.5 ? 1 : 0;
    return [`M ${o0.x} ${o0.y}`, `A ${rOuter} ${rOuter} 0 ${large} 1 ${o1.x} ${o1.y}`, `L ${i1.x} ${i1.y}`, `A ${rInner} ${rInner} 0 ${large} 0 ${i0.x} ${i0.y}`, 'Z'].join(' ');
  }
  let cum = 0;
  const computed = slices.map((s) => { const start = cum; cum += s.pct; return { ...s, start, end: cum }; });
  const active = activeIdx !== null ? computed[activeIdx] : null;
  const centerLabel = active
    ? { top: active.category, mid: `${Math.round(active.pct * 100)}%`, bot: active.won ? formatWon(active.won) : '' }
    : { top: '예산 배분', mid: '', bot: totalBudget ? formatWon(totalBudget) : '' };
  return (
    <svg viewBox="0 0 200 200" style={{ width: '100%', touchAction: 'manipulation' }}>
      {computed.map((s, i) => {
        const scale = activeIdx === i ? 1.04 : 1;
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
      <text x={cx} y={centerLabel.mid ? cy - 12 : cy - 7} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#78716c" style={{ userSelect: 'none' }}>{centerLabel.top}</text>
      {centerLabel.mid && <text x={cx} y={cy + 4} textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="700" fill="#1c1917" style={{ userSelect: 'none' }}>{centerLabel.mid}</text>}
      <text x={cx} y={centerLabel.mid ? cy + 18 : cy + 9} textAnchor="middle" dominantBaseline="middle" fontSize={centerLabel.mid ? '9' : '11'} fontWeight={centerLabel.mid ? '400' : '700'} fill={centerLabel.mid ? '#78716c' : '#1c1917'} style={{ userSelect: 'none' }}>{centerLabel.bot}</text>
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
    <div className="mt-2">
      <BudgetDonutChart slices={slices} totalBudget={totalBudget} />
      <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3">
        {slices.map((item, i) => {
          const wonAmt = breakdown[i].won ?? (totalBudget ? Math.round(Number(breakdown[i].pct) / 100 * Number(totalBudget)) : null);
          return (
            <div key={i} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-stone-700 font-medium">{item.category}</span>
              <span className="text-xs text-stone-400">{breakdown[i].pct}%{wonAmt ? ` · ${formatWon(wonAmt)}` : ''}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 쇼핑 플랫폼 탭 링크 ─────────────────────────────────────────
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
    <div className="mt-3">
      <div className="flex" style={{ borderBottom: '1px solid #e7e5e4', marginBottom: 8 }}>
        {SHOP_PLATFORMS.map((p) => {
          const active = p.id === platformId;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setPlatformId(p.id)}
              style={{
                padding: '4px 10px', fontSize: 11, letterSpacing: '0.06em',
                color: active ? '#1c1917' : '#a8a29e',
                borderBottom: active ? '1.5px solid #1c1917' : '1.5px solid transparent',
                marginBottom: -1, fontWeight: active ? 500 : 400,
                background: 'none', border: 'none', borderBottom: active ? '1.5px solid #1c1917' : '1.5px solid transparent',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {keywords.map((q, i) => (
          <a
            key={i}
            href={platform.url(q)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-stone-600 border border-stone-300 px-2.5 py-1 hover:border-stone-500 hover:text-stone-900 transition-colors leading-none"
          >
            {q} ↗
          </a>
        ))}
      </div>
    </div>
  );
}

const SAMPLE_PERSONA = {
  name: '유태오',
  avatar: '/characters/IDMT.png',
};

const SAMPLE_ANSWERS = [
  {
    question: '살면서 가장 큰 영향을 준 경험이나 환경은 무엇인가요?',
    answer: '독일에서 자라면서 운동선수가 될 거라고 생각했어요. 육상이었는데, 갭이어 때 뉴욕에 갔다가 리 스트라스버그 연기학교를 우연히 알게 됐어요.\n\n3개월만 다녀보자 했는데, 2주째 수업에서 감정이 완전히 터져버렸거든요. 그때까지 몸으로만 살아왔던 것 같은데, 처음으로 내 안에 뭔가 있다는 걸 알았어요. 그게 다 바꿔놨죠.',
  },
  {
    question: '지금 어떤 방향으로 나아가고 있나요?',
    answer: '언어나 국경, 장르에 갇히지 않는 배우가 되고 싶어요. 독일에서 시작해서 미국, 영국, 한국까지 왔는데, 어디서든 내 이야기를 할 수 있는 사람이고 싶은 거죠.\n\n사람들이 "집이 어디예요?" 물어보면 솔직히 잘 모르겠어요. 어딘가에 뿌리내리는 것보다, 어디서든 내가 될 수 있는 게 더 중요해진 것 같아요.',
  },
  {
    question: '스타일을 바꾸고 싶다고 느낀 계기가 있었나요?',
    answer: '무명 시절이 꽤 길었는데, 그때 계속 뭔가 안 맞는다는 느낌이 있었어요. 내가 살아온 방식이나 가고 싶은 방향이 옷에는 전혀 안 담기는 것 같아서요. 어딘가에 소속된 사람처럼 보이거나, 반대로 아무것도 아닌 것처럼 보이거나 — 그 사이에 계속 끼어 있는 느낌이었어요.',
  },
  {
    question: '지금 스타일에서 가장 맞지 않는 부분은?',
    answer: '그냥 노마드처럼 살아왔는데, 옷은 그게 전혀 안 보여요. 독일에서 자라고, 텍사스 목장에서 일하고, 뉴욕이랑 런던 거쳐서 한국에 온 사람인데, 그게 하나도 안 드러나는 것 같아서 계속 걸렸어요.',
  },
  {
    question: '스타일이 닮고 싶은 인물이 있나요?',
    answer: '딱 떠오르는 인물은 없는데, 굳이 고르자면 제리 로렌조요. 옷을 만드는 사람이기도 하지만, 그 사람이 살아온 방식이나 표현하는 방식이 좋아요. 설명 안 하는데 다 보이는 그런 느낌이요.',
  },
  {
    question: '좋아하거나 관심 있는 브랜드가 있나요?',
    answer: 'Fear of God이랑 Stetson이요. Fear of God은 어두운 미니멀리즘 — 어디에도 속하지 않는데 어디서든 완성된 느낌이 있잖아요.\n\nStetson은 텍사스 목장에서 처음 봤을 때 "이게 내 거다" 싶었어요. 기능 때문에 집어들었는데 나중엔 그게 정체성이 됐어요.',
  },
  {
    question: '직업과 주로 있는 환경은?',
    answer: '배우예요. 촬영장, 해외 스케줄, 이동이 계속 반복되는 생활이에요. 어디서든 입어야 하고, 어디서든 나여야 하는 상황이다 보니까요.',
  },
  {
    question: '키, 몸무게, 체형을 알려주세요',
    answer: '186cm에 80kg 정도예요. 어깨가 넓고 팔다리가 좀 긴 편이에요.',
  },
];

const SAMPLE_ISSUED_AT = new Date('2026-05-28T14:32:07');


// 응답 내용에서 캐릭터 코드 추론 (character 필드 없을 때 fallback)
function inferCharacter(result) {
  const allText = [
    result.title,
    result.translation?.archetype,
    result.translation?.logic,
    ...(result.direction?.keywords ?? []),
    ...(result.identity?.keywords ?? []),
  ].filter(Boolean).join(' ').toLowerCase();

  const relaxed = /따뜻|편안|실용|클린|캐주얼|자연스|소프트|베이직|깔끔/.test(allText);
  const intense = /조용|내면|절제|구조적|미니멀|수트|테일러|권위|quiet/.test(allText);
  const diverse = /독창|헤리티지|실험|빈티지|워크웨어|아방|해체|자유|창의|복합/.test(allText);
  const classic = /클래식|정통|모노크롬|심플|기본|정제|타임리스/.test(allText);

  const first = relaxed && !intense ? 'R' : 'I';
  const second = diverse && !classic ? 'D' : 'C';
  return `${first}${second}MT`;
}

const SAMPLE_MAP = {};

const SAMPLE_NAMES = ['유태오', '봉태규', '스티븐 연'];
const SAMPLE_NAMES_LABEL = SAMPLE_NAMES.join(' · ');

export default function TranslatorResultPage() {
  const { reportId, personaId } = useParams();
  const location                = useLocation();
  const { nickname }            = useNickname();

  const navigate    = useNavigate();
  const isSample    = !!personaId;
  const sampleEntry = isSample ? (SAMPLE_MAP[personaId] ?? null) : null;
  const [result, setResult]           = useState(isSample ? (sampleEntry?.result ?? null) : (location.state?.result ?? null));
  const [loading, setLoading]         = useState(!isSample && !location.state?.result);
  const [error, setError]             = useState(null);
  const [issuedAt, setIssuedAt]       = useState(() =>
    isSample ? (sampleEntry?.issuedAt ?? null) : (location.state?.createdAt ? new Date(location.state.createdAt) : null)
  );
  const [answersOpen, setAnswersOpen] = useState(false);

  useEffect(() => {
    if (result) return;
    fetch(`/api/translator?reportId=${reportId}`)
      .then(async (r) => {
        const text = await r.text();
        let data;
        try { data = JSON.parse(text); } catch { throw new Error(`서버 오류 (${r.status})`); }
        if (!r.ok || data.error) throw new Error(data.error || `HTTP ${r.status}`);
        return data;
      })
      .then(({ result: r, createdAt }) => {
        setResult(r);
        if (createdAt) setIssuedAt(new Date(createdAt));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [reportId, result]);

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: CREAM }}>
        <SiteHeader />
        <div className="flex items-center justify-center pt-20">
          <p className="text-xs tracking-widest text-stone-400 uppercase">번역서 불러오는 중…</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <ErrorScreen
        eyebrow="Report"
        title="결과를 찾을 수 없어요"
        message="주소가 잘못됐거나 만료된 번역서일 수 있어요."
      />
    );
  }

  const { translation, direction } = result;
  const persona       = isSample ? result?.persona : null;
  const displayName   = persona?.name ?? nickname;
  const answers       = result?.answers ?? [];
  const characterCode = result.character || inferCharacter(result);
  const characterSrc  = isSample
    ? (persona?.avatar ?? `/characters/${characterCode}.png`)
    : `/characters/${characterCode}.png`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen"
      style={{ backgroundColor: CREAM }}
    >
      <div className="w-full max-w-sm mx-auto px-6 flex flex-col">
        <SiteHeader />

        <div className="pb-28">

          {/* ── 발급 헤더 ── */}
          <div className="flex items-start justify-between mb-8 pt-2">
            <div>
              <p className="text-xs tracking-[0.28em] text-stone-600 uppercase font-semibold">VIZUDEN</p>
              <p className="text-xs tracking-[0.14em] text-stone-400 uppercase mt-0.5">Style Translator</p>
            </div>
            {issuedAt && (
              <div className="text-right">
                <p className="text-xs text-stone-500">
                  {issuedAt.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                </p>
                <p className="text-xs font-mono text-stone-400 mt-0.5">
                  {issuedAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                </p>
              </div>
            )}
          </div>

          {/* ── 타이틀 헤더 ── */}
          <div className="mb-8 text-center">
            {characterSrc && (
              <img src={characterSrc} alt="" className="w-20 h-20 object-contain mx-auto mb-4" />
            )}
            {displayName ? (
              <>
                <h1 className="text-3xl font-medium text-stone-900 leading-tight mb-1">{displayName}</h1>
                <p className="text-xs tracking-[0.2em] text-stone-400 uppercase mb-4">님의 스타일 번역서</p>
              </>
            ) : (
              <p className="text-xs tracking-[0.2em] text-stone-400 uppercase mb-4">스타일 번역서</p>
            )}
            <p style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }} className="text-2xl font-normal text-stone-700 leading-tight mb-3">
              {result.title || '—'}
            </p>
            {translation?.archetype && (
              <p className="text-xs text-stone-400 tracking-wide">{translation.archetype}</p>
            )}
          </div>

          {/* ── 스타일 키워드 ── */}
          {direction?.keywords?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8 justify-center">
              {direction.keywords.map((kw) => (
                <span key={kw} className="text-xs px-3 py-1.5 border border-stone-300 text-stone-600" style={{ letterSpacing: '0.04em' }}>{kw}</span>
              ))}
            </div>
          )}

          {/* ── 설문 답변 버튼 (샘플 전용) ── */}
          {isSample && answers.length > 0 && (
            <div className="mb-8">
              <button type="button" onClick={() => setAnswersOpen(true)} className="w-full px-4 py-3 text-center" style={{ backgroundColor: DARK }}>
                <span className="text-xs tracking-widest uppercase" style={{ color: CREAM, letterSpacing: '0.1em' }}>설문 답변 보기</span>
              </button>
            </div>
          )}

          {/* ── 설문 답변 모달 ── */}
          {answersOpen && <AnswersModal answers={answers} onClose={() => setAnswersOpen(false)} />}

          {/* ── 01 예산 배분 ── */}
          {result.execution?.budget_breakdown?.length > 0 && (
            <SectionBlock num="01" sub="Budget" label="예산 배분">
              <BudgetBreakdown breakdown={result.execution.budget_breakdown} totalBudget={result.execution.total_budget} />
              {result.execution.budget_note && (
                <p className="text-xs text-stone-400 mt-4 leading-relaxed">{result.execution.budget_note}</p>
              )}
            </SectionBlock>
          )}

          {/* ── 02 추천 무드 & 브랜드 ── */}
          {direction?.moods?.length > 0 && (
            <SectionBlock num="02" sub="Direction" label="추천 무드 & 브랜드">
              <div className="flex flex-col gap-8">
                {direction.moods.map((mood, i) => (
                  <MoodSection key={i} mood={mood} moodIndex={i} />
                ))}
              </div>
            </SectionBlock>
          )}

          {/* ── 03 쇼핑 추천 ── */}
          {direction?.moods?.some(m => m.brands?.some(b => b.products?.length)) && (
            <SectionBlock num="03" sub="Shopping" label="쇼핑 추천">
              <div className="flex flex-col gap-6">
                {direction.moods.map((mood, mi) =>
                  mood.brands?.filter(b => b.products?.length).map((brand, bi) => (
                    <div key={`${mi}-${bi}`}>
                      <p className="text-xs text-stone-400 tracking-[0.06em] mb-2">{mood.label} · {brand.name}</p>
                      <ShopLinks keywords={brand.products} />
                    </div>
                  ))
                )}
              </div>
            </SectionBlock>
          )}

          {/* ── 04 마치며 ── */}
          {result.closing && (
            <SectionBlock num="04" sub="Closing" label="마치며">
              <Paragraphs text={result.closing} className="text-sm text-stone-600 leading-relaxed" />
            </SectionBlock>
          )}

          {/* 샘플 목록으로 */}
          {isSample && (
            <button
              onClick={() => navigate('/translators')}
              className="w-full px-5 py-5 rounded-3xl text-left transition-all duration-150 active:scale-[0.98] flex items-center gap-4 mt-4"
              style={{ backgroundColor: '#EDE8E1', border: '1px solid #DDD7CE', boxShadow: '0 1px 8px 0 rgba(0,0,0,0.05)' }}
            >
              <div className="shrink-0 flex items-center justify-center" style={{ width: 52, height: 60 }}>
                <div style={{ position: 'relative', width: 38, height: 48, borderRadius: 4 }}>
                  <div style={{ position: 'absolute', top: 3, left: 3, width: 35, height: 45, borderRadius: 4, backgroundColor: '#D6CEC4', border: '1px solid #C0B9AF' }} />
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
                <p className="text-[10px] tracking-[0.22em] uppercase mb-1.5" style={{ color: 'rgba(28,25,23,0.3)' }}>Style Translator</p>
                <p className="text-[18px] font-medium tracking-tight text-stone-800 leading-snug">샘플 번역서 목록으로 돌아가기</p>
                <p className="text-[12px] text-stone-400 mt-1">{SAMPLE_NAMES_LABEL}</p>
              </div>
            </button>
          )}

        </div>
      </div>
    </motion.div>
  );
}

function AnswersModal({ answers, onClose }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ backgroundColor: 'rgba(28,25,23,0.5)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.22 }}
        className="w-full relative flex flex-col"
        style={{ maxWidth: 400, maxHeight: '80vh', backgroundColor: CREAM, borderRadius: 20, overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-5 text-stone-400 hover:text-stone-700 transition-colors"
          aria-label="닫기"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <line x1="4" y1="4" x2="20" y2="20"/><line x1="20" y1="4" x2="4" y2="20"/>
          </svg>
        </button>

        {/* 헤더 */}
        <div className="px-6 pt-6 pb-4 shrink-0">
          <p className="text-[10px] tracking-[0.28em] uppercase text-stone-400 mb-1">Sample Answers</p>
          <h2 className="text-lg font-semibold text-stone-900" style={{ letterSpacing: '-0.02em' }}>설문 답변</h2>
        </div>

        <div className="mx-6 border-t border-stone-200 shrink-0" />

        {/* 답변 목록 */}
        <div className="overflow-y-auto px-6 py-5 flex flex-col gap-6">
          {answers.map((a, i) => (
            <div key={i}>
              <p className="text-xs text-stone-400 mb-2"><span className="font-semibold mr-1.5">Q.</span>{a.question}</p>
              <Paragraphs
                text={a.answer || '(미입력)'}
                className="text-sm text-stone-800 leading-relaxed"
                prefix={<span className="font-semibold">A. </span>}
              />
            </div>
          ))}
          <div className="h-2" />
        </div>
      </motion.div>
    </motion.div>
  );
}

function Section({ label, children }) {
  return (
    <div className="mb-10">
      <div className="border-t border-stone-100 mb-5 pt-6">
        <p className="text-xs tracking-[0.2em] text-stone-400 uppercase">{label}</p>
      </div>
      {children}
    </div>
  );
}

function SectionBlock({ num, sub, label, children }) {
  return (
    <div className="mb-14">
      <div className="flex items-start gap-4 mb-5">
        <span style={{
          fontFamily: 'Georgia, serif',
          fontSize: 52,
          lineHeight: 1,
          color: '#d6d0c8',
          letterSpacing: '-0.03em',
          userSelect: 'none',
          minWidth: 54,
          marginTop: -4,
        }}>{num}</span>
        <div>
          <p style={{ fontSize: 10, letterSpacing: '0.2em', color: '#a8a29e', textTransform: 'uppercase', marginBottom: 4 }}>{sub}</p>
          <p style={{ fontSize: 14, fontWeight: 500, color: '#44403c', letterSpacing: '-0.01em' }}>{label}</p>
        </div>
      </div>
      <div style={{ borderTop: '1px solid #e7e5e4', marginBottom: 20 }} />
      {children}
    </div>
  );
}

// 무드 카드 배경 팔레트 (에디토리얼 다크 톤)
const MOOD_BG = [
  { bg: '#1C1410', accent: '#C49A78' },
  { bg: '#0D1824', accent: '#6B9E8E' },
  { bg: '#141414', accent: '#9B8BA6' },
];

function MoodVisualCard({ mood, moodIndex }) {
  const palette = MOOD_BG[moodIndex % MOOD_BG.length];
  const pinterestQ = encodeURIComponent(mood.pinterest || mood.label);
  const igTag = encodeURIComponent((mood.instagram || mood.label).replace(/\s+/g, '').replace(/[()[\]]/g, ''));
  return (
    <div style={{ backgroundColor: palette.bg, padding: '20px' }}>
      <p style={{ color: palette.accent, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 8 }}>
        Mood
      </p>
      <p style={{ color: '#FAF8F5', fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: mood.description ? 8 : 16 }}>
        {mood.label}
      </p>
      {mood.description && (
        <p style={{ color: 'rgba(250,248,245,0.72)', fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}>
          {mood.description}
        </p>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <a
          href={`https://www.pinterest.com/search/pins/?q=${pinterestQ}`}
          target="_blank" rel="noopener noreferrer"
          style={{ flex: 1, minHeight: 44, backgroundColor: 'rgba(255,255,255,0.09)', color: 'rgba(250,248,245,0.8)', fontSize: 11, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.14)' }}
        >
          <FaviconImg domain="pinterest.com" alt="Pinterest" size={11} />
          Pinterest
        </a>
        <a
          href={`https://www.instagram.com/explore/tags/${igTag}/`}
          target="_blank" rel="noopener noreferrer"
          style={{ flex: 1, minHeight: 44, backgroundColor: 'rgba(255,255,255,0.09)', color: 'rgba(250,248,245,0.8)', fontSize: 11, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.14)' }}
        >
          <FaviconImg domain="instagram.com" alt="Instagram" size={11} />
          Instagram
        </a>
      </div>
    </div>
  );
}

function SubLabel({ children }) {
  return (
    <p className="text-xs tracking-widest text-stone-400 uppercase mb-3">{children}</p>
  );
}

function Paragraphs({ text, className, prefix }) {
  if (!text) return null;
  const parts = text.split('\n\n').filter(Boolean);
  return (
    <>
      {parts.map((p, i) => (
        <p key={i} className={className} style={{ marginBottom: i < parts.length - 1 ? '0.9em' : 0 }}>
          {i === 0 && prefix && prefix}
          {p}
        </p>
      ))}
    </>
  );
}

function MoodSection({ mood, moodIndex = 0 }) {
  const [openMap, setOpenMap] = useState(() =>
    Object.fromEntries((mood.brands ?? []).map((_, i) => [i, true]))
  );

  return (
    <div>
      <MoodVisualCard mood={mood} moodIndex={moodIndex} />

      {/* 브랜드 목록 */}
      {mood.brands?.map((brand, i) => {
        const isOpen = !!openMap[i];
        const isLast = i === mood.brands.length - 1;
        const instagramTag = encodeURIComponent(brand.name.replace(/\s+/g, '').replace(/[()[\]]/g, ''));
        return (
          <div
            key={brand.name}
            style={{
              backgroundColor: '#fafaf9',
              borderLeft: '1px solid #e7e5e4',
              borderRight: '1px solid #e7e5e4',
              borderBottom: isLast ? '1px solid #e7e5e4' : 'none',
              borderTop: '1px solid #ece9e4',
            }}
          >
            {/* 브랜드 헤더 — 항상 보임 */}
            <button
              onClick={() => setOpenMap(prev => ({ ...prev, [i]: !prev[i] }))}
              className="w-full flex items-center justify-between px-4 py-3.5 text-left"
            >
              <p className="text-sm font-semibold text-stone-900" style={{ letterSpacing: '-0.01em' }}>
                {brand.name}
              </p>
              <span
                className="text-stone-400 shrink-0 transition-transform duration-200"
                style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </span>
            </button>

            {/* 브랜드 상세 — 열렸을 때만 */}
            {isOpen && (
              <div className="pb-5">
                {/* reason */}
                <p className="text-xs text-stone-500 leading-relaxed px-4 pt-0 pb-4">{brand.reason}</p>

                {/* 레퍼런스 탐색 */}
                <div style={{ borderTop: '1px solid #ece9e4' }} className="px-4 pt-4 pb-4">
                  <p className="text-[10px] text-stone-400 tracking-[0.1em] uppercase mb-2.5">레퍼런스 탐색</p>
                  <div className="flex gap-2">
                    {[
                      { href: `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(brand.name + ' men style')}`, domain: 'pinterest.com', label: 'Pinterest' },
                      { href: `https://www.instagram.com/explore/tags/${instagramTag}/`, domain: 'instagram.com', label: 'Instagram' },
                    ].map(({ href, domain, label }) => (
                      <a
                        key={label}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 text-[11px] text-stone-500 hover:text-stone-700 hover:bg-white transition-colors"
                        style={{ border: '1px solid #e7e5e4', minHeight: 38 }}
                      >
                        <FaviconImg domain={domain} alt={label} />
                        <span>{label}</span>
                      </a>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function BrandCard({ brand, index, total }) {
  const q = encodeURIComponent(brand.name);
  const instagramTag = encodeURIComponent(brand.name.replace(/\s+/g, '').replace(/[()[\]]/g, ''));
  const isLast = index === total - 1;

  return (
    <div
      className="bg-white px-4 pt-4 pb-5"
      style={{
        borderTop: '1px solid #e7e5e4',
        borderLeft: '1px solid #e7e5e4',
        borderRight: '1px solid #e7e5e4',
        borderBottom: isLast ? '1px solid #e7e5e4' : 'none',
      }}
    >
      <p className="text-sm font-semibold text-stone-900 mb-2" style={{ letterSpacing: '-0.01em' }}>
        {brand.name}
      </p>

      <p className="text-xs text-stone-500 leading-relaxed mb-4">{brand.reason}</p>

      {/* 레퍼런스 탐색 */}
      <p className="text-[10px] text-stone-400 tracking-[0.08em] uppercase mb-2">레퍼런스 탐색</p>
      <div className="flex gap-2 mb-4">
        {[
          { href: `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(brand.name + ' men style')}`, domain: 'pinterest.com', label: 'Pinterest' },
          { href: `https://www.instagram.com/explore/tags/${instagramTag}/`, domain: 'instagram.com', label: 'Instagram' },
        ].map(({ href, domain, label }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-1 text-[11px] text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors"
            style={{ border: '1px solid #e7e5e4' }}
          >
            <FaviconImg domain={domain} alt={label} />
            <span>{label}</span>
          </a>
        ))}
      </div>

      {/* 무신사 제품 검색 */}
      {brand.products?.length > 0 && (
        <>
          <p className="text-[10px] text-stone-400 tracking-[0.08em] uppercase mb-2">무신사에서 검색</p>
          <div className="flex flex-wrap gap-1.5">
            {brand.products.map((product) => (
              <a
                key={product}
                href={`https://www.musinsa.com/search/goods?keyword=${encodeURIComponent(product)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-stone-500 border border-stone-200 px-2.5 py-1 hover:border-stone-800 hover:text-stone-800 transition-colors"
              >
                <FaviconImg domain="musinsa.com" alt="무신사" />
                <span>{product}</span>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── 아이콘 ────────────────────────────────────────────────────

function FaviconImg({ domain, alt, size = 14 }) {
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
      alt={alt}
      width={size}
      height={size}
      style={{ display: 'inline-block', borderRadius: '2px' }}
    />
  );
}
