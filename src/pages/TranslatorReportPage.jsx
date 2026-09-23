import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader';
import { useNickname } from '../context/NicknameContext';
import { useConsultingReportStream, startStream, resetConsultingReportStream } from '../lib/translatorReportStream';
import { ensureGuestSessionId } from '../lib/storage';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';
import ErrorScreen from '../components/ErrorScreen';
import { C } from '../components/report/theme';
import {
  ActionBar, FadeIn, SHead, Lead, Body, SubSectionHead,
  AxisRow, ColorRow, catMeta,
  MoodAccordion, TpoCard, DonutChart,
  FullSkeleton, LoadingTeaser,
  StreamingScrollPill, TableOfContents, BudgetMiniWidget, DoneToast, RefText,
} from '../components/report/ui';
// STYLE TYPE 진단으로 배정된 캐릭터 코드를 읽어온다. 완료 전이면 null.
function getTypeCharacter() {
  try {
    const raw = JSON.parse(localStorage.getItem('vizuden_type_history') || '[]');
    if (Array.isArray(raw) && raw.length > 0 && raw[0]?.code) return raw[0].code;
    const single = JSON.parse(localStorage.getItem('vizuden_type'));
    if (single?.code) return single.code;
  } catch {}
  return null;
}

const PRINT_CSS = `
@page {
  margin: 12mm 10mm;
  size: A4;
}
@media print {
  .no-print { display: none !important; }
  /* 브라우저 기본 헤더/푸터(URL·날짜·페이지번호) 숨김 */
  html { margin: 0; }
  body {
    margin: 0 !important;
    background: white !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  .section-wrap { break-inside: avoid; page-break-inside: avoid; }
  /* 피드백 버튼 등 fixed 엘리먼트 모두 숨김 */
  [style*="position: fixed"], [style*="position:fixed"] { display: none !important; }
}
`;

// ── 보고서 본문 ─────────────────────────────────────────────────
function ReportBody({ r, isStreaming, nickname, fitPics = [], meta }) {
  const hasIdentity = r.identity || r.mirror;
  const hasStyle = r.direction || r.color || r.fit || r.brands || r.tpo;
  const hasConclusion = r.plan || r.closing;
  const typeChar = getTypeCharacter();

  // 스트리밍 자동 따라가기 — 기본 켜짐, 사용자가 위로 스크롤하면 중단, pill 클릭으로 재개
  const autoFollowRef = useRef(true);
  useEffect(() => {
    if (!isStreaming) return;
    autoFollowRef.current = true;
    let prevY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y < prevY - 3) autoFollowRef.current = false; // 위로 스크롤 = 사용자 개입
      prevY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    const iv = setInterval(() => {
      if (!autoFollowRef.current) return;
      // frontier(현재 로딩 지점)가 화면 72% 지점에 오도록 — 최신 텍스트가 항상 위·중간에 보임
      const anchorEl = document.getElementById('frontier-anchor');
      const target = anchorEl
        ? anchorEl.getBoundingClientRect().top + window.pageYOffset - window.innerHeight * 0.72
        : document.documentElement.scrollHeight - window.innerHeight - 120;
      if (target > window.scrollY + 16) window.scrollTo({ top: target, behavior: 'smooth' });
    }, 700);
    return () => { window.removeEventListener('scroll', onScroll); clearInterval(iv); };
  }, [isStreaming]);

  // frontier — 스트림 도착 순서(디스플레이 순서)로 "가장 멀리 온 것의 다음"을 현재 로딩 지점으로.
  // 그 너머는 렌더하지 않아 미리 구조가 드러나지 않는다.
  const SEQ = [
    { key: 'identity', present: !!(r.mirror || r.identity) },
    { key: 'direction', present: !!r.direction },
    { key: 'brands', present: !!r.brands },
    { key: 'tpo', present: !!r.tpo },
    { key: 'color', present: !!r.color },
    { key: 'fit', present: !!r.fit },
    { key: 'conclusion', present: !!(r.plan || r.closing) },
  ];
  let _lastPresent = -1;
  SEQ.forEach((s, i) => { if (s.present) _lastPresent = i; });
  // closing 본문까지 도착하면 내용상 완성 — 서버 후처리(윤문·상품)로 done이 늦어도 로딩 표시를 멈춘다.
  // (모바일에서 후처리 중 연결이 끊겨 done을 못 받아도 "마무리하는 중"에 갇히지 않게)
  const closingDone = !!(r.closing?.body);
  const frontier = isStreaming
    ? (_lastPresent < SEQ.length - 1 ? SEQ[_lastPresent + 1].key : (closingDone ? null : 'conclusion'))
    : null;

  const hasDirection = !!r.direction;
  const hasStyling = !!(r.brands || r.tpo);
  const hasColorFit = !!(r.color || r.fit);
  const showIdentity = hasIdentity || frontier === 'identity';
  const showDirection = hasDirection || frontier === 'direction';
  const showStyling = hasStyling || frontier === 'brands';
  const showColorFit = hasColorFit || frontier === 'color';
  const showConclusion = hasConclusion || frontier === 'conclusion';

  const sections = [
    // ── 01 Identity ───────────────────────────────────
    showIdentity && (
      <FadeIn key="identity">
        {!hasIdentity ? (
          <LoadingTeaser anchor={frontier === 'identity'} />
        ) : (
        <section id="sec-identity" style={{ marginTop: 0 }}>
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
          {r.mirror?.blockers_note && <Body style={{ color: C.sub }}>{r.mirror.blockers_note}</Body>}
        </section>
        )}
      </FadeIn>
    ),

    // ── 처방 — 진단 직후, 판결부터 (두괄식). 이하 모든 장은 이 세 줄의 실행 ──
    !isStreaming && Array.isArray(r.rules) && r.rules.length > 0 && (
      <FadeIn key="prescription">
        <PrescriptionCard rules={r.rules} />
      </FadeIn>
    ),

    // ── 02 스타일 방향 ─────────────────────────────────
    showDirection && (
      <FadeIn key="direction">
        {!hasDirection ? (
          <LoadingTeaser anchor={frontier === 'direction'} />
        ) : (
        <section id="sec-direction" style={{ marginTop: 0 }}>
          <SHead num={2} eyebrow="Direction" name="스타일 방향" />
          <RuleChips nums={r.rule_links?.direction} />

          {/* Direction */}
          {r.direction && <>
            {r.direction.lead && <Lead>{r.direction.lead}</Lead>}
            {r.direction.axes && (
              <div style={{ marginBottom: 24 }}>
                <AxisRow leftLabel="캐주얼" rightLabel="포멀" value={r.direction.axes.casual_formal} />
                <AxisRow leftLabel="미니멀" rightLabel="맥시멀" value={r.direction.axes.minimal_maximal} />
                <AxisRow leftLabel="클래식" rightLabel="트렌디" value={r.direction.axes.classic_trendy} />
                <AxisRow leftLabel="라이트" rightLabel="다크" value={r.direction.axes.light_dark} />
              </div>
            )}
            {Array.isArray(r.direction.affinity) && r.direction.affinity.length > 0 && (
              <>
                <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.sub, marginBottom: 7 }}>어울리는 스타일</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {r.direction.affinity.map((s, i) => <span key={i} style={{ fontSize: 13, padding: '5px 13px', borderRadius: 999, fontWeight: 600, background: C.ink, color: C.bg }}>{s}</span>)}
                </div>
              </>
            )}
            {Array.isArray(r.direction.avoid) && r.direction.avoid.length > 0 && (
              <>
                <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.sub, marginBottom: 7 }}>피하면 좋을 것</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                  {r.direction.avoid.map((s, i) => <span key={i} style={{ fontSize: 13, padding: '5px 13px', borderRadius: 999, border: `1px solid #c9bfb5`, color: C.sub }}>{s}</span>)}
                </div>
              </>
            )}
          </>}

          {/* 예산 — plan은 스트림 끝에 도착하므로 완료 후에만 (완료 시 scroll-to-top으로 자연 노출) */}
          {!isStreaming && Array.isArray(r.plan?.allocation) && r.plan.allocation.length > 0 && (
            <>
              <SubSectionHead num="2.1" name="예산" />
              <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.sub, marginBottom: 14 }}>
                총 예산 {r.plan.budget ? `${r.plan.budget.toLocaleString()}원` : ''} · 우선순위 기준
              </div>
              <DonutChart allocation={r.plan.allocation} total={r.plan.budget ?? 0} />
            </>
          )}
        </section>
        )}
      </FadeIn>
    ),

    // ── 03 무드, 브랜드, 코디 ──────────────────────────
    showStyling && (
      <FadeIn key="styling">
        {!hasStyling ? (
          <LoadingTeaser anchor={frontier === 'brands'} />
        ) : (
        <section id="sec-styling" style={{ marginTop: 0 }}>
          <SHead num={3} eyebrow="Styling" name="무드, 브랜드, 코디" />
          <RuleChips nums={r.rule_links?.styling} />

          {/* 무드 & 브랜드 */}
          {r.brands && <>
            <SubSectionHead num="3.1" name="무드 & 브랜드" />
            {r.brands.lead && <Body>{r.brands.lead}</Body>}
            {(r.brands.moods ?? []).map((mood, i) => <MoodAccordion key={i} mood={mood} defaultOpen products={r.products} />)}
          </>}

          {/* 상황별 코디 */}
          {r.tpo && <>
            <SubSectionHead num="3.2" name="상황별 코디" />
            {r.tpo.lead && <Body>{r.tpo.lead}</Body>}
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'minmax(0, 1fr)' }}>
              {(r.tpo.occasions ?? []).map((occ, i) => <TpoCard key={i} occ={occ} products={r.products} />)}
            </div>
          </>}

          {/* 코디 로딩 중 */}
          {isStreaming && frontier === 'tpo' && (
            <LoadingTeaser anchor />
          )}

          {/* 이번 주 이것부터 — plan은 스트림 끝에 도착하므로 완료 후에만 */}
          {!isStreaming && r.plan?.first_step && (
            <div style={{ marginTop: 40, background: C.ink, color: '#f5f2ed', borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#c9bdaf', opacity: 0.8, marginBottom: 7 }}>이번 주, 이것부터</div>
              <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.5 }}>{r.plan.first_step}</div>
            </div>
          )}
        </section>
        )}
      </FadeIn>
    ),

    // ── 04 컬러와 핏 ───────────────────────────────────
    showColorFit && (
      <FadeIn key="colorfit">
        {!hasColorFit ? (
          <LoadingTeaser anchor={frontier === 'color'} />
        ) : (
        <section id="sec-colorfit" style={{ marginTop: 0 }}>
          <SHead num={4} eyebrow="Color & Fit" name="컬러와 핏" />
          <RuleChips nums={r.rule_links?.colorfit} />

          {/* 컬러 */}
          {r.color && <>
            <SubSectionHead num="4.1" name="컬러" />
            {r.color.skin_tone && (
              <div style={{ textAlign: 'center', background: C.paper, border: `1px solid ${C.line}`, borderRadius: 18, padding: '26px 22px', marginBottom: 18 }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', margin: '0 auto 14px', background: 'linear-gradient(135deg,#F5C5A3,#E8A87C)', boxShadow: '0 4px 14px rgba(232,168,124,.35), inset 0 0 0 3px rgba(255,255,255,.5)' }} />
                <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.faint, marginBottom: 5 }}>Personal Color</div>
                <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: C.ink }}>{r.color.skin_tone}</div>
                {r.color.skin_tone_desc && (
                  <div style={{ fontSize: 13.5, color: C.sub, lineHeight: 1.7, marginTop: 12, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>{r.color.skin_tone_desc}</div>
                )}
              </div>
            )}
            {!r.color.skin_tone && r.color.skin_tone_desc && (
              <Body style={{ color: C.sub }}>{r.color.skin_tone_desc}</Body>
            )}
            {/* 당신의 팔레트 — 스와치 밴드 */}
            {(() => {
              const swatches = [...(r.color.base || []), ...(r.color.accent || [])].filter((c) => c?.hex).slice(0, 6);
              if (swatches.length < 2) return null;
              return (
                <div style={{ margin: '4px 0 22px' }}>
                  <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.faint, marginBottom: 10 }}>당신의 팔레트</div>
                  <div style={{ display: 'flex', borderRadius: 14, overflow: 'hidden', height: 72, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.06)' }}>
                    {swatches.map((c, i) => <div key={i} style={{ flex: 1, background: c.hex }} />)}
                  </div>
                  <div style={{ display: 'flex', marginTop: 7 }}>
                    {swatches.map((c, i) => (
                      <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10.5, color: C.sub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 2px' }}>{c.name}</div>
                    ))}
                  </div>
                </div>
              );
            })()}
            {[['코어 컬러', r.color.base], ['포인트', r.color.accent], ['피할 것', r.color.avoid]].map(([label, list]) =>
              Array.isArray(list) && list.length > 0 ? (
                <div key={label} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, letterSpacing: '0.1em', color: C.sub, marginBottom: 8 }}>{label}</div>
                  {list.map((c, i) => <ColorRow key={i} name={c.name} hex={c.hex} desc={c.desc} />)}
                </div>
              ) : null
            )}
          </>}

          {/* 핏 & 실루엣 */}
          {r.fit && <>
            <SubSectionHead num="4.2" name="핏 & 실루엣" />
            {fitPics.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: r.fit.photo_read ? 14 : 0 }}>
                  {fitPics.map((p, i) => (
                    <div key={i} style={{ width: 92, height: 120, borderRadius: 10, overflow: 'hidden', border: `1px solid ${C.line}`, background: C.paper, flexShrink: 0 }}>
                      <img src={p.signedUrl} alt={`체형 사진 ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
                {r.fit.photo_read && (
                  <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 14, padding: '14px 16px' }}>
                    <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.accent, fontWeight: 600, marginBottom: 7 }}>사진에서 본 것</div>
                    <div style={{ fontSize: 14.5, lineHeight: 1.7, color: '#3f3a34' }}>{r.fit.photo_read}</div>
                  </div>
                )}
              </div>
            )}
            {r.fit.lead && <Body>{r.fit.lead}</Body>}
            {r.fit.concern_advice && (
              <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 14, padding: '14px 16px', marginBottom: 14 }}>
                <div style={{ fontSize: 14, color: '#3f3a34', lineHeight: 1.7 }}>
                  {r.fit.concern_advice.split('\n').map((line, i) => <div key={i}>{line}</div>)}
                </div>
              </div>
            )}
            {[['상의', 'top', r.fit.top], ['하의', 'bottom', r.fit.bottom], ['아우터', 'outer', r.fit.outer]].map(([k, cat, v]) => {
              if (!v) return null;
              const { Icon } = catMeta(cat);
              return (
                <div key={k} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '13px 0', borderBottom: `1px solid ${C.line}`, fontSize: 13.5, color: '#3f3a34', lineHeight: 1.6 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: C.paper, border: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.sub, flexShrink: 0 }}>
                    <Icon size={17} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: C.sub, marginBottom: 2 }}>{k}</div>
                    <div>{v}</div>
                  </div>
                </div>
              );
            })}
          </>}

          {/* 핏 로딩 중 */}
          {isStreaming && frontier === 'fit' && (
            <LoadingTeaser anchor />
          )}
        </section>
        )}
      </FadeIn>
    ),

    // ── 05 마무리 ──────────────────────────────────────
    showConclusion && (
      <FadeIn key="conclusion">
        {!hasConclusion ? (
          <LoadingTeaser anchor={frontier === 'conclusion'} />
        ) : (
        <section id="sec-conclusion" style={{ marginTop: 0 }}>
          <SHead num={5} eyebrow="Conclusion" name="마무리" />

          {r.plan && <>
            {r.plan.lead && <Lead>{r.plan.lead}</Lead>}
            {(r.plan.keep || r.plan.fill) && (
              <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 14, padding: '16px 18px', margin: '18px 0' }}>
                {r.plan.keep && <div style={{ display: 'flex', gap: 16, fontSize: 14, lineHeight: 1.7 }}><div style={{ fontSize: 11, letterSpacing: '0.15em', color: C.accent, fontWeight: 600, width: 52, flexShrink: 0, marginTop: 2 }}>유지</div><div>{r.plan.keep}</div></div>}
                {r.plan.keep && r.plan.fill && <div style={{ height: 10 }} />}
                {r.plan.fill && <div style={{ display: 'flex', gap: 16, fontSize: 14, lineHeight: 1.7 }}><div style={{ fontSize: 11, letterSpacing: '0.15em', color: C.accent, fontWeight: 600, width: 52, flexShrink: 0, marginTop: 2 }}>채울 것</div><div>{r.plan.fill}</div></div>}
              </div>
            )}
          </>}

          {r.closing && (
            <div style={{ marginTop: r.plan ? 24 : 0 }}>
              {r.closing.statement && <Lead>{r.closing.statement}</Lead>}
              {r.closing.body && <Body>{r.closing.body}</Body>}
            </div>
          )}

          {/* 결론 — 당신을 이렇게 번역했어요 (보고서 전체의 요약 판결) */}
          {r.translation?.from && r.translation?.to && (
            <div style={{ margin: '36px 0 0', padding: '22px 22px 18px', background: C.paper, border: `1px solid ${C.line}`, borderRadius: 14 }}>
              <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.accent, fontWeight: 600, marginBottom: 16 }}>당신을 이렇게 번역했어요</div>
              <div style={{ fontSize: 10.5, letterSpacing: '0.14em', color: C.faint, fontWeight: 600, marginBottom: 6 }}>당신이라는 사람</div>
              <div style={{ fontSize: 15, color: '#57514a', lineHeight: 1.7 }}>{r.translation.from}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '15px 0' }}>
                <div style={{ flex: 1, height: 1, background: C.line }} />
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                <div style={{ flex: 1, height: 1, background: C.line }} />
              </div>
              <div style={{ fontSize: 10.5, letterSpacing: '0.14em', color: C.faint, fontWeight: 600, marginBottom: 6 }}>당신에게 맞는 스타일</div>
              <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.5, color: C.ink }}>{r.translation.to}</div>
              {r.translation.why && (
                <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px dashed ${C.line}`, fontSize: 13, color: C.sub, lineHeight: 1.65 }}>
                  <span style={{ color: C.accent, fontWeight: 600 }}>이렇게 번역한 이유 · </span><RefText text={r.translation.why} refs={r.translation.refs} />
                </div>
              )}
            </div>
          )}

          {/* 처방 되새김 — 본문은 진단 직후의 처방전 카드가 담당 */}
          {Array.isArray(r.rules) && r.rules.length > 0 && (
            <div style={{ marginTop: 28, fontSize: 13, color: C.sub, textAlign: 'center' }}>
              다 잊어도, 위의 <b style={{ color: C.ink }}>처방 세 줄</b>만 기억하세요.
            </div>
          )}

          {/* 아직 마무리 본문이 안 온 동안만 꼬리 skeleton (closing.body 도착하면 숨김) */}
          {isStreaming && !closingDone && (
            <div id="frontier-anchor" style={{ marginTop: 20, animation: 'pulse 1.5s ease-in-out infinite' }}>
              <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
              {[100, 88, 58].map((w, i) => (
                <div key={i} style={{ height: 14, background: C.line, borderRadius: 4, marginBottom: 10, width: `${w}%` }} />
              ))}
            </div>
          )}
        </section>
        )}
      </FadeIn>
    ),
  ].filter(Boolean);

  return (
    <>
      {/* 커버 — 매거진 마스트헤드 */}
      <FadeIn>
        <div style={{ padding: '6px 0 2px' }}>
          {/* 마스트헤드 바 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1.5px solid ${C.ink}`, borderBottom: `1px solid ${C.line}`, padding: '9px 2px', marginBottom: 32 }}>
            <span style={{ fontFamily: 'Georgia,serif', fontSize: 11, letterSpacing: '0.22em', color: C.ink }}>STYLE TRANSLATOR</span>
            <span style={{ fontFamily: 'Georgia,serif', fontSize: 11, letterSpacing: '0.1em', color: C.sub }}>
              {meta?.dateStr}{meta?.reportNo ? ` · No.${meta.reportNo}` : ''}
            </span>
          </div>

          {/* 캐릭터 — STYLE TYPE 완료 시에만 표시 */}
          {typeChar && (
            <img
              src={`/characters/${typeChar}.png`}
              alt="character"
              style={{ width: 200, height: 200, objectFit: 'contain', margin: '0 auto 28px', display: 'block', filter: 'drop-shadow(0 20px 28px rgba(60,45,30,.14))' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}

          {/* 타이틀 — 저장된 이름(r.nickname, 공유 링크에서도 표시) 우선, 없으면 로컬 닉네임 */}
          {(() => { const who = r?.nickname || nickname; return (
          <div style={{ textAlign: 'center', marginBottom: 20, marginTop: typeChar ? 0 : 8 }}>
            {who && (
              <div style={{ fontSize: 11, letterSpacing: '0.26em', textTransform: 'uppercase', color: C.accent, fontWeight: 600, marginBottom: 12 }}>
                Issue for {who}
              </div>
            )}
            <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.25, margin: '0 0 8px' }}>
              {who ? `${who}의 스타일 번역서` : '스타일 번역서'}
            </h1>
            {r.subtitle && (
              <div style={{ fontSize: 15, fontWeight: 500, color: '#57514a', letterSpacing: '-0.01em' }}>
                {r.subtitle}
              </div>
            )}
          </div>
          ); })()}

        </div>
      </FadeIn>

      <ActionBar isStreaming={isStreaming} />

      {/* Abstract 카드 — 스트리밍 완료 후에만. 번역 카드는 결론(마무리)으로 이동 */}
      {!isStreaming && ((r.closing?.statement || r.identity?.lead) ? (
        <FadeIn>
          <div style={{
            margin: '40px 0 0',
            padding: '14px 16px',
            background: C.paper,
            border: `1px solid ${C.line}`,
            borderRadius: 12,
          }}>
            <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.accent, fontWeight: 600, marginBottom: 5 }}>한 줄 요약</div>
            {r.closing?.statement && (
              <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.3, color: C.ink, marginBottom: r.identity?.lead ? 5 : 0 }}>
                {r.closing.statement}
              </div>
            )}
            {r.identity?.lead && (
              <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.5 }}>
                {r.identity.lead}
              </div>
            )}
          </div>
        </FadeIn>
      ) : null)}

      {!isStreaming && hasIdentity && hasStyle && hasConclusion && (
        <FadeIn><TableOfContents r={r} /></FadeIn>
      )}

      {sections.map((section, i) => (
        <div key={i} className="section-wrap" style={{ marginTop: i === 0 ? 56 : 0 }}>
          {i > 0 && <div style={{ height: 1, background: C.line, margin: '80px 0 80px' }} />}
          {section}
        </div>
      ))}

      {isStreaming && frontier && <StreamingScrollPill frontier={frontier} onReengage={() => { autoFollowRef.current = true; }} />}

      {/* 예산 미니 위젯 — 03 섹션 읽는 동안 하단 좌측 고정 (완료 후에만) */}
      {!isStreaming && Array.isArray(r.plan?.allocation) && r.plan.allocation.length > 0 && (
        <BudgetMiniWidget allocation={r.plan.allocation} total={r.plan.budget ?? 0} />
      )}

      {/* 저장 안내 배너 — 완료 후에만 */}
      {!isStreaming && <SaveReportBanner />}

      {/* copyright — 완료 후에만 */}
      {!isStreaming && (
        <div id="report-footer" style={{ marginTop: 40, paddingBottom: 40 }}>
          <Footer />
        </div>
      )}
    </>
  );
}

// 처방전 — 보고서의 판결. 진단(1장) 직후에 놓여 이하 모든 장을 종속시킨다.
function PrescriptionCard({ rules }) {
  return (
    <div style={{ background: C.paper, border: `1.5px solid ${C.ink}`, borderRadius: 4, padding: '26px 24px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderBottom: `1px solid ${C.line}`, paddingBottom: 10, marginBottom: 18 }}>
        <span style={{ fontFamily: 'Georgia,serif', fontSize: 11, letterSpacing: '0.24em', color: C.ink }}>PRESCRIPTION</span>
        <span style={{ fontSize: 11, letterSpacing: '0.08em', color: C.sub }}>다 잊어도, 이 세 가지만</span>
      </div>
      {rules.map((rule, i) => (
        <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'baseline', marginBottom: i < rules.length - 1 ? 16 : 0 }}>
          <span style={{ fontFamily: 'Georgia,serif', fontSize: 17, fontWeight: 700, color: C.accent, flexShrink: 0, lineHeight: 1 }}>{i + 1}</span>
          <span style={{ fontSize: 15.5, fontWeight: 650, lineHeight: 1.55, letterSpacing: '-0.01em', color: C.ink }}>{rule}</span>
        </div>
      ))}
      <div style={{ marginTop: 20, paddingTop: 12, borderTop: `1px dashed ${C.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 11.5, color: C.sub }}>아래 장들은 이 세 줄의 근거와 실행입니다.</span>
        <span style={{ fontFamily: 'Georgia,serif', fontSize: 10, letterSpacing: '0.3em', color: C.faint }}>VIZUDEN</span>
      </div>
    </div>
  );
}

// 장 머리의 처방 태그 — "이 장은 처방 ①·③의 실행"
function RuleChips({ nums }) {
  if (!Array.isArray(nums) || nums.length === 0) return null;
  const circ = ['①', '②', '③', '④', '⑤'];
  return (
    <div style={{ marginTop: -14, marginBottom: 20, fontSize: 11.5, letterSpacing: '0.05em', color: C.accent, fontWeight: 600 }}>
      처방 {nums.map((n) => circ[n - 1] ?? n).join('·')}의 실행
    </div>
  );
}

// 재조회 프레이밍 — "이 기기에서만 다시 볼 수 있어요. 링크 저장 또는 로그인하면 어디서든."
function SaveReportBanner() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const loggedIn = !!session?.access_token;

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };
  const goLogin = () => navigate('/auth/email', { state: { nextPath: `${window.location.pathname}${window.location.search}` } });

  if (loggedIn) {
    return (
      <div className="no-print" style={{ marginTop: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, color: C.sub }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
        이 번역서는 계정에 저장돼 어디서든 다시 볼 수 있어요.
      </div>
    );
  }
  return (
    <div className="no-print" style={{ marginTop: 72, background: C.paper, border: `1px solid ${C.line}`, borderRadius: 16, padding: '22px 20px' }}>
      <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.accent, fontWeight: 600, marginBottom: 8 }}>다시 보려면</div>
      <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em', color: C.ink, marginBottom: 6 }}>이 번역서는 이 기기에서만 다시 열려요</div>
      <div style={{ fontSize: 13.5, color: C.sub, lineHeight: 1.65, marginBottom: 16 }}>
        나중에 다시 보려면 <b style={{ color: C.ink }}>링크 주소를 저장</b>해두세요. 로그인하면 기기를 바꿔도 계정에 영구 보관돼요.
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={copyLink}
          style={{ flex: 1, padding: '13px 0', borderRadius: 12, border: `1px solid ${C.line}`, background: '#fff', color: C.ink, fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
          {copied ? '링크 복사됨 ✓' : '링크 복사'}
        </button>
        <button onClick={goLogin}
          style={{ flex: 1, padding: '13px 0', borderRadius: 12, border: 'none', background: C.ink, color: '#f3efe8', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>
          로그인하고 저장
        </button>
      </div>
    </div>
  );
}

// ── 메인 ────────────────────────────────────────────────────────
export default function TranslatorReportPage() {
  const { intakeId } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { nickname } = useNickname();
  const stream = useConsultingReportStream();
  const [storedReport, setStoredReport] = useState(null);
  const [fetchStatus, setFetchStatus] = useState('idle'); // idle | loading | ok | empty | error
  const [fitPics, setFitPics] = useState([]);
  const [generatedAt, setGeneratedAt] = useState(null);
  const [reportNo, setReportNo] = useState(null); // 실제 발행 순번 (서버 count)
  const [doneToast, setDoneToast] = useState(false);

  // 마스트헤드 메타 — 발행일 · 실제 발행 순번
  const reportMeta = (() => {
    const d = generatedAt ? new Date(generatedAt) : new Date();
    const dateStr = `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, '0')}. ${String(d.getDate()).padStart(2, '0')}`;
    return { dateStr, reportNo: reportNo != null ? String(reportNo).padStart(4, '0') : null };
  })();

  // 스트림이 이 intakeId를 위한 것인지 확인
  const isThisStream = stream.intakeId === intakeId && (stream.status === 'streaming' || stream.status === 'done');

  useEffect(() => {
    if (!intakeId) { setFetchStatus('error'); return; }

    // 데모 모드 (dev 전용) — API 호출 없이 손석구 샘플로 전체 보고서 렌더 확인
    if (intakeId === 'demo' && import.meta.env.DEV) {
      import('../data/samples/son-seokku.json').then((m) => {
        setStoredReport(m.default);
        setReportNo(1);
        setFetchStatus('ok');
      });
      return;
    }

    // 이미 스트리밍 중이면 fetch 불필요
    if (isThisStream) return;

    // Supabase에서 저장된 보고서 조회
    setFetchStatus('loading');
    const headers = { 'x-guest-session-id': ensureGuestSessionId() };
    if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000); // 15초 타임아웃
    fetch(`/api/translator-report?intakeId=${intakeId}`, { headers, signal: ctrl.signal })
      .then(r => r.json())
      .then(data => {
        clearTimeout(t);
        if (data.report) {
          setStoredReport(data.report);
          if (data.generatedAt) setGeneratedAt(data.generatedAt);
          if (data.reportNo != null) setReportNo(data.reportNo);
          setFetchStatus('ok');
        }
        else setFetchStatus('empty');
      })
      .catch(() => { clearTimeout(t); setFetchStatus('error'); });
  }, [intakeId, session?.access_token, isThisStream]);

  // 업로드한 체형 사진 (표시용) — 스트리밍 여부와 무관하게 항상 조회
  useEffect(() => {
    if (!intakeId) return;
    const headers = { 'x-guest-session-id': ensureGuestSessionId() };
    if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
    fetch(`/api/translator-intake?id=${encodeURIComponent(intakeId)}`, { headers })
      .then(r => r.json())
      .then(data => {
        const pics = (data?.item?.fit_pics || []).filter(p => p?.signedUrl);
        if (pics.length) setFitPics(pics);
      })
      .catch(() => {});
  }, [intakeId, session?.access_token]);

  // 보고서 없을 때(직접 방문·새로고침) 자동 스트리밍 시작
  useEffect(() => {
    if (fetchStatus !== 'empty' || !intakeId) return;
    if (stream.status !== 'idle') return;
    startStream(intakeId, session, ensureGuestSessionId(), nickname);
  }, [fetchStatus, intakeId, session, stream.status, nickname]);

  // 스트림 데이터를 점진적으로 파싱
  useEffect(() => {
    // 스트리밍 완료되면 storedReport로 전환 + 완성된 페이지를 위에서부터
    if (stream.status === 'done' && stream.intakeId === intakeId && stream.report) {
      setStoredReport(stream.report);
      if (stream.reportNo != null) setReportNo(stream.reportNo);
      setFetchStatus('ok');
      // 완성 레이아웃(한 줄 요약·목차·footer)이 그려진 뒤 맨 위로 + 토스트 안내
      const t = setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 350);
      setDoneToast(true);
      const t2 = setTimeout(() => setDoneToast(false), 5000);
      return () => { clearTimeout(t); clearTimeout(t2); };
    }
  }, [stream.status, stream.intakeId, stream.report, intakeId]);

  // 현재 표시할 보고서 데이터
  const isStreaming = isThisStream && stream.status === 'streaming';
  // 생성 중에는 받은 조각을, 완료 후에는 서버가 저장을 확인한 최종본(윤문 반영)을 그린다.
  // 그래야 완료 직후 화면과 나중에 다시 연 화면이 같다.
  const reportData = isStreaming ? {
    subtitle: stream.subtitle,
    translation: stream.translation,
    mirror: stream.mirror,
    identity: stream.identity,
    direction: stream.direction,
    fit: stream.fit,
    color: stream.color,
    brands: stream.brands,
    tpo: stream.tpo,
    plan: stream.plan,
    closing: stream.closing,
    products: stream.products ?? stream.report?.products,
  } : isThisStream ? stream.report : storedReport;

  const hasAnySection = reportData && Object.values(reportData).some(v => v !== undefined && v !== null);

  const wrap = { margin: 0, background: C.bg, color: C.ink, fontFamily: '"Pretendard Variable",Pretendard,-apple-system,sans-serif', WebkitFontSmoothing: 'antialiased', lineHeight: 1.6 };
  const inner = { maxWidth: 660, margin: '0 auto', padding: '40px 26px 120px' };

  if (fetchStatus === 'loading' && !isThisStream) return (
    <div style={wrap}>
      <SiteHeader />
      <div style={inner}><FullSkeleton /></div>
    </div>
  );

  // 에러 상태 — fetch 실패(error) 또는 스트림 실패. 공용 에러 화면 + 재생성 재시도.
  if (!isThisStream && (fetchStatus === 'error' || stream.status === 'error')) {
    const isGenFail = stream.status === 'error';
    return (
      <ErrorScreen
        eyebrow="Report"
        title={isGenFail ? '번역서를 만들지 못했어요' : '번역서를 불러올 수 없어요'}
        message={isGenFail
          ? '생성 중 문제가 생겼어요. 다시 시도하면 이어서 만들어드려요.'
          : '잠시 후 다시 시도하거나 홈으로 돌아가 주세요.'}
        onRetry={intakeId ? () => {
          resetConsultingReportStream();
          setFetchStatus('idle');
          startStream(intakeId, session, ensureGuestSessionId(), nickname);
        } : undefined}
        retryLabel="다시 만들기"
      />
    );
  }

  return (
    <div style={wrap}>
      <style>{PRINT_CSS}</style>
      <SiteHeader />
      <div style={inner}>
        {isStreaming && !hasAnySection ? (
          // 생성 시작 직후 — 내용이 하나도 오기 전엔 제목/마스트헤드 대신 스켈레톤만
          <FullSkeleton />
        ) : (isStreaming || hasAnySection) ? (
          <ReportBody r={reportData || {}} isStreaming={isStreaming} nickname={nickname} fitPics={fitPics} meta={reportMeta} />
        ) : null}
      </div>
      <DoneToast show={doneToast} />
    </div>
  );
}
