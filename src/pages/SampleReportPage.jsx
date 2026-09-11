import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader';
import Footer from '../components/Footer';
import ErrorScreen from '../components/ErrorScreen';
import BetaCodeModal from '../components/BetaCodeModal';
import TranslatorStartButton from '../components/TranslatorStartButton';
import { C } from '../components/report/theme';
import { SHead, Lead, Body, AxisRow, MoodAccordion, RefText } from '../components/report/ui';

// 인물 메타 (보고서 데이터는 동적 로드 — persona별 청크 분리)
const PERSONAS = {
  'teo-yoo':     { name: '유태오',   label: '배우', issuedAt: '2026.05', char: 'IDMT' },
  'bong-taegyu': { name: '봉태규',   label: '배우', issuedAt: '2026.05', char: 'RDMT' },
  'steven-yeun': { name: '스티븐 연', label: '배우', issuedAt: '2026.06', char: 'ICMT' },
  'son-seokku':  { name: '손석구',   label: '배우', issuedAt: '2026.07', char: 'ICMN' },
};

function Divider() {
  return <div style={{ height: 1, background: C.line, margin: '72px 0 72px' }} />;
}

// 페이월 — 홈의 "스타일 번역서" 버튼 그대로, 클릭 시 베타 코드 모달
function Paywall({ onStart }) {
  return (
    <div>
      <div style={{ height: 160, background: `linear-gradient(to bottom, transparent, ${C.bg})`, marginTop: -160, position: 'relative', zIndex: 1, pointerEvents: 'none' }} />
      <div style={{ background: C.ink, color: '#F5F2ED', borderRadius: 22, padding: '44px 24px 28px', textAlign: 'center' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.32em', textTransform: 'uppercase', color: '#9A7259', marginBottom: 18, fontWeight: 600 }}>
          VIZUDEN STYLE TRANSLATION
        </div>
        <div style={{ fontSize: 25, fontWeight: 700, lineHeight: 1.35, letterSpacing: '-0.02em', marginBottom: 14 }}>
          이 보고서,<br />내 버전으로 받아보세요
        </div>
        <div style={{ fontSize: 14.5, color: '#a8a29e', lineHeight: 1.75, marginBottom: 26 }}>
          AI가 정체성을<br />당신의 스타일로 번역합니다
        </div>
        <TranslatorStartButton onClick={onStart} variant="light" />
        <div style={{ marginTop: 14, fontSize: 12, color: '#57514a' }}>
          현재 클로즈드 베타 운영 중 · 초대 코드 필요
        </div>
      </div>
    </div>
  );
}

export default function SampleReportPage() {
  const { personaId } = useParams();
  const navigate = useNavigate();
  const persona = PERSONAS[personaId];
  const [r, setR] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [showCode, setShowCode] = useState(false);

  // 요청한 persona 보고서만 동적 로드 (전체 번들 방지)
  useEffect(() => {
    if (!persona) return;
    let alive = true;
    setR(null); setLoadError(false);
    import(`../data/samples/${personaId}.json`)
      .then((mod) => { if (alive) setR(mod.default); })
      .catch(() => { if (alive) setLoadError(true); });
    return () => { alive = false; };
  }, [personaId, persona]);

  if (!persona) return <ErrorScreen eyebrow="Sample" title="샘플을 찾을 수 없어요" message="주소가 잘못됐거나 준비 중인 샘플입니다." />;
  if (loadError) return <ErrorScreen eyebrow="Sample" title="샘플을 불러오지 못했어요" message="잠시 후 다시 시도해주세요." />;

  const wrap = { margin: 0, background: C.bg, color: C.ink, fontFamily: '"Pretendard Variable",Pretendard,-apple-system,sans-serif', WebkitFontSmoothing: 'antialiased', lineHeight: 1.6, minHeight: '100vh' };
  const inner = { maxWidth: 660, margin: '0 auto', padding: '40px 26px 40px' };

  // 로딩 스켈레톤 (커버만)
  if (!r) return (
    <div style={wrap}>
      <SiteHeader />
      <div style={inner}>
        <div style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
          <div style={{ width: 160, height: 30, background: C.line, borderRadius: 6, margin: '20px auto 16px' }} />
          <div style={{ width: 240, height: 20, background: C.line, borderRadius: 6, margin: '0 auto 40px' }} />
          <div style={{ width: '100%', height: 120, background: C.line, borderRadius: 16 }} />
        </div>
      </div>
    </div>
  );

  const { name, label, issuedAt, char } = persona;

  return (
    <div style={wrap}>
      <SiteHeader />
      <div style={inner}>

        {/* 뒤로가기 + 인물 배지 — 같은 필 스타일 한 줄 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
        <button
          onClick={() => navigate('/translator/samples')}
          aria-label="샘플 목록"
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 42, height: 42, background: C.paper, border: `1px solid ${C.line}`, borderRadius: 999, color: C.sub, cursor: 'pointer', flexShrink: 0 }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        </button>

        {/* 인물 배지 */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: C.paper, border: `1px solid ${C.line}`, borderRadius: 999, padding: '8px 16px 8px 12px' }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#d6cfc5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>👤</div>
          <span style={{ fontSize: 13, fontWeight: 700 }}>{name}</span>
          <span style={{ fontSize: 11, color: C.sub }}>{label}</span>
          <div style={{ fontSize: 10, background: '#e8e2d9', color: C.sub, borderRadius: 999, padding: '3px 8px', marginLeft: 2, letterSpacing: '0.06em' }}>SAMPLE</div>
        </div>
        </div>

        {/* 마스트헤드 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1.5px solid ${C.ink}`, borderBottom: `1px solid ${C.line}`, padding: '9px 2px', marginBottom: 30 }}>
          <span style={{ fontFamily: 'Georgia,serif', fontSize: 11, letterSpacing: '0.22em', color: C.ink }}>STYLE TRANSLATOR</span>
          <span style={{ fontFamily: 'Georgia,serif', fontSize: 11, letterSpacing: '0.1em', color: C.sub }}>SAMPLE · {issuedAt}</span>
        </div>

        {/* 커버 */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          {char && !(r.photo?.urls?.length || r.photo?.url) && (
            <img
              src={`/characters/${char}.png`}
              alt=""
              style={{ width: 180, height: 180, objectFit: 'contain', margin: '0 auto 22px', display: 'block', filter: 'drop-shadow(0 20px 28px rgba(60,45,30,.14))' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}
          <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.25, margin: '0 0 8px' }}>{name}의 스타일 번역서</h1>
          {r.subtitle && <div style={{ fontSize: 15, fontWeight: 500, color: '#57514a', letterSpacing: '-0.01em' }}>{r.subtitle}</div>}
        </div>

        {/* 첨부 사진 — 커버 직후: 제출된 원본(관찰) → 번역(결론) 순서 */}
        {(r.photo?.urls?.length || r.photo?.url) && (
          <div style={{ margin: '30px 0 0' }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: r.photo.read ? 14 : 0 }}>
              {(r.photo.urls || [r.photo.url]).map((u, i) => (
                <div key={i} style={{ width: 140, height: 186, borderRadius: 12, overflow: 'hidden', border: `1px solid ${C.line}`, background: C.paper, flexShrink: 0, animation: 'photoPulse 1.4s ease-in-out infinite' }}>
                  <style>{`@keyframes photoPulse{0%,100%{background-color:#EDE8E0}50%{background-color:#E0D9CE}}`}</style>
                  <img src={u} alt={`사진 ${i + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onLoad={(e) => { e.target.parentElement.style.animation = 'none'; }}
                    onError={(e) => { e.target.parentElement.style.display = 'none'; }} />
                </div>
              ))}
            </div>
            {r.photo.read && (
              <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.accent, fontWeight: 600, marginBottom: 7 }}>사진에서 본 것</div>
                <div style={{ fontSize: 14.5, lineHeight: 1.7, color: '#3f3a34' }}>{r.photo.read}</div>
                {r.photo.advice && (
                  <div style={{ marginTop: 12, paddingTop: 11, borderTop: `1px dashed ${C.line}`, fontSize: 13.5, lineHeight: 1.7, color: '#3f3a34' }}>
                    <span style={{ color: C.accent, fontWeight: 700 }}>{r.photo.advice_label || '그래서, 하나만 바꾼다면'} · </span>{r.photo.advice}
                  </div>
                )}
              </div>
            )}
            {r.photo.credit && (
              <div style={{ fontSize: 10.5, color: C.faint, marginTop: 7, textAlign: 'center' }}>{r.photo.credit}</div>
            )}
          </div>
        )}

        {/* 01 Identity */}
        {(r.mirror || r.identity) && (
          <>
            <div style={{ marginTop: 56 }} />
            <section>
              <SHead num={1} eyebrow="Identity" name="당신은 이런 사람입니다" />
              {r.mirror?.lead && <Lead>{r.mirror.lead}</Lead>}
              {r.mirror?.body && <Body>{r.mirror.body}</Body>}
              {r.identity?.lead && <Lead>{r.identity.lead}</Lead>}
              {r.identity?.from_reference && (
                <div style={{ background: `${C.accent}0f`, border: `1px solid ${C.accent}33`, borderRadius: 14, padding: '16px 18px', margin: '18px 0' }}>
                  <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.accent, fontWeight: 600, marginBottom: 8 }}>추구미에서 읽은 것</div>
                  <div style={{ fontSize: 15, lineHeight: 1.75, color: '#3f3a34' }}>{r.identity.from_reference}</div>
                </div>
              )}
              {r.identity?.body && <Body>{r.identity.body}</Body>}
            </section>
          </>
        )}

        {/* 02 Direction — 어울리는 스타일까지 온전히 보이고, 그 아래 티저만 페이드 */}
        {r.direction && (
          <>
            <Divider />
            <section>
              <SHead num={2} eyebrow="Direction" name="스타일 방향" />
              {r.direction.lead && <Lead>{r.direction.lead}</Lead>}
              {r.direction.axes && (
                <div style={{ marginBottom: 24 }}>
                  <AxisRow leftLabel="캐주얼" rightLabel="포멀"    value={r.direction.axes.casual_formal} />
                  <AxisRow leftLabel="미니멀" rightLabel="맥시멀"  value={r.direction.axes.minimal_maximal} />
                  <AxisRow leftLabel="클래식" rightLabel="트렌디"  value={r.direction.axes.classic_trendy} />
                  <AxisRow leftLabel="라이트"  rightLabel="다크"    value={r.direction.axes.light_dark} />
                </div>
              )}
              {Array.isArray(r.direction.affinity) && r.direction.affinity.length > 0 && (
                <>
                  <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.sub, marginBottom: 7 }}>어울리는 스타일</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {r.direction.affinity.map((s, i) => (
                      <span key={i} style={{ fontSize: 13, padding: '5px 13px', borderRadius: 999, fontWeight: 600, background: C.ink, color: C.bg }}>{s}</span>
                    ))}
                  </div>
                </>
              )}
            </section>

            {/* 피하면 좋을 것 — 온전히 노출 */}
            {Array.isArray(r.direction.avoid) && r.direction.avoid.length > 0 && (
              <div style={{ marginTop: 22 }}>
                <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.sub, marginBottom: 7 }}>피하면 좋을 것</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {r.direction.avoid.map((s, i) => (
                    <span key={i} style={{ fontSize: 13, padding: '5px 13px', borderRadius: 999, border: '1px solid #c9bfb5', color: C.sub }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* 티저 — 3장 첫 무드 블록(대표 브랜드까지) 보여주고 그 아래서 페이드 */}
            <div style={{ position: 'relative', overflow: 'hidden', maxHeight: 620, marginTop: 56 }}>
              <SHead num={3} eyebrow="Styling" name="무드, 브랜드, 코디" />
              {r.brands?.lead && <Lead>{r.brands.lead}</Lead>}
              {/* 실제 보고서와 동일한 컴포넌트 — 브랜드 아웃링크·티어 배지·레퍼런스 탐색·무신사 스트립 포함 */}
              {r.brands?.moods?.[0] && (
                <div style={{ marginTop: 6 }}>
                  <MoodAccordion mood={r.brands.moods[0]} defaultOpen products={r.products} />
                </div>
              )}
            </div>
          </>
        )}

        {/* 페이월 */}
        <Paywall onStart={() => navigate('/translator/questions')} />

        <div style={{ marginTop: 40 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.sub, marginBottom: 10 }}>다른 인물의 번역서</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {Object.entries(PERSONAS).filter(([id]) => id !== personaId).map(([id, p]) => (
              <button
                key={id}
                onClick={() => { navigate(`/translator/${id}`); window.scrollTo(0, 0); }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: '#fff', border: `1px solid ${C.line}`, borderRadius: 14, padding: '14px 6px 12px', cursor: 'pointer' }}
              >
                <img src={`/characters/${p.char}.png`} alt="" style={{ width: 44, height: 44, objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; }} />
                <span style={{ fontSize: 12.5, fontWeight: 600, color: C.ink }}>{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        <Footer />
      </div>

      {showCode && <BetaCodeModal onClose={() => setShowCode(false)} showSamplesLink />}
    </div>
  );
}
