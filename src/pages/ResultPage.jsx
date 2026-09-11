import { useRef, useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { Download, Share2 } from 'lucide-react';
import SiteHeader from '../components/SiteHeader';
import RecommendBadge from '../components/RecommendBadge';
import AxisBar from '../components/AxisBar';
import TypeCodeDisplay from '../components/TypeCodeDisplay';
import { types } from '../data/types';
import { typeImages } from '../data/typeImages';
import { useAuth } from '../context/AuthContext';
import { useNickname } from '../context/NicknameContext';
import { useReportStatus } from '../hooks/useReportStatus';
import TranslatorBeforeAfterCard from '../components/TranslatorBeforeAfterCard';
import { StepNumber } from '../components/ServiceStepChrome';
import { ensureGuestSessionId, ensureTrackingSessionId, STORAGE_KEYS, getStoredString, setStoredString } from '../lib/storage';
import { NicknameModal, WelcomeModal } from '../components/AccountModals';

const TYPE_RESULT_VERSION = 'type_result.v1';

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export default function ResultPage() {
  const { code } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cardRef = useRef(null);
  const [shared, setShared] = useState(false);
  const [saving, setSaving] = useState(false);
  const { prescription } = useReportStatus();
  const { session } = useAuth();

  const { axisScores: stateAxisScores, fromHistory } = location.state ?? {};

  // axisScores 복원 우선순위: state → URL ?s= → localStorage
  const axisScores = stateAxisScores ?? (() => {
    // URL ?s=3122 디코딩
    const s = searchParams.get('s');
    if (s && /^\d{4}$/.test(s)) {
      const axes = [
        { axis: 'motivation',   labelA: 'I', labelB: 'R' },
        { axis: 'orientation',  labelA: 'C', labelB: 'D' },
        { axis: 'energy',       labelA: 'M', labelB: 'E' },
        { axis: 'temporality',  labelA: 'T', labelB: 'N' },
      ];
      return axes.map((ax, i) => ({
        ...ax,
        scoreA: parseInt(s[i], 10),
        scoreB: 3 - parseInt(s[i], 10),
      }));
    }
    // localStorage 복원
    try {
      const history = JSON.parse(localStorage.getItem('vizuden_type_history') || '[]');
      const match = history.find(e => e.code === code);
      if (match?.axisScores) return match.axisScores;
      const single = JSON.parse(localStorage.getItem('vizuden_type') || 'null');
      if (single?.code === code && single?.axisScores) return single.axisScores;
    } catch {}
    return null;
  })();

  const result = types[code];
  const { nickname, setNickname } = useNickname();
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [welcomeName, setWelcomeName] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  const [typeStat, setTypeStat] = useState(null);
  const [statExpanded, setStatExpanded] = useState(false);

  if (!result) {
    navigate('/', { replace: true });
    return null;
  }

  const isSharedView = !axisScores && !fromHistory;
  const guestSessionIdRef = useRef(null);
  const sessionIdRef = useRef(null);
  const enteredAtRef = useRef(Date.now());

  function getTrackingHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    };
  }

  function getGuestSessionId() {
    if (!guestSessionIdRef.current) {
      guestSessionIdRef.current = ensureGuestSessionId();
    }
    return guestSessionIdRef.current;
  }

  function getTrackingSessionId() {
    if (!sessionIdRef.current) {
      sessionIdRef.current = ensureTrackingSessionId();
    }
    return sessionIdRef.current;
  }

  function recordTypeEvent(eventName, meta = null, extra = {}) {
    fetch('/api/type-events', {
      method: 'POST',
      headers: getTrackingHeaders(),
      body: JSON.stringify({
        type_code: code,
        guest_session_id: getGuestSessionId(),
        session_id: getTrackingSessionId(),
        event_name: eventName,
        page_type: 'type_result',
        source: location.state?.source || (isSharedView ? 'shared_result' : 'type_questions'),
        result_version: TYPE_RESULT_VERSION,
        meta,
        ...extra,
      }),
    }).catch(() => {});
  }

  useEffect(() => {
    const setMeta = (sel, val) => document.querySelector(sel)?.setAttribute('content', val);
    const ogImage = `https://vizuden.com/api/og-png?type=${code}`;
    const title = `VIZUDEN — ${result.ko1} ${result.ko2}`;
    document.title = title;
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', result.description);
    setMeta('meta[property="og:image"]', ogImage);
    setMeta('meta[name="twitter:title"]', title);
    setMeta('meta[name="twitter:description"]', result.description);
    setMeta('meta[name="twitter:image"]', ogImage);
    return () => { document.title = 'VIZUDEN — 스타일 정체성 진단'; };
  }, [code, result]);

  useEffect(() => {
    fetch('/api/type-count')
      .then((r) => r.json())
      .then(({ count, distribution }) => {
        if (!count) return;
        const typeCount = distribution?.[code] ?? 0;
        const pct = Math.round((typeCount / count) * 100);
        if (pct > 0) setTypeStat({ pct, total: count, distribution });
      })
      .catch(() => {});
  }, [code]);

  const recordedRef = useRef(false);
  useEffect(() => {
    if (recordedRef.current) return;
    recordedRef.current = true;
    recordTypeEvent('result_view', {
      shared_view: isSharedView,
      from_history: Boolean(fromHistory),
    }, {
      duration_ms: 0,
    });
  }, [fromHistory, code, location.pathname, isSharedView, session?.access_token]);

  // 닉네임 미설정 + 첫 결과 뷰(기록 조회·공유 뷰 제외) → 1.2초 후 모달
  useEffect(() => {
    if (isSharedView || fromHistory) return;
    if (nickname) return;
    if (getStoredString(STORAGE_KEYS.nicknamePromptVisits) !== null) return;
    const t = setTimeout(() => setShowNicknameModal(true), 1200);
    return () => clearTimeout(t);
  }, [isSharedView, fromHistory, nickname]);

  async function handleShare() {
    recordTypeEvent('share_click', { shared_view: isSharedView }, {
      duration_ms: Date.now() - enteredAtRef.current,
      position: 'sticky_share',
    });
    const scoreParam = axisScores?.length
      ? `?s=${axisScores.map(ax => Math.round(ax.scoreA)).join('')}`
      : searchParams.get('s') ? `?s=${searchParams.get('s')}` : '';
    const url = `${window.location.origin}/type/result/${code}${scoreParam}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `나는 ${result.nameKo}`,
          text: `제 스타일 유형은 ${result.nameKo}이래요! 한 번 해보실래요?`,
          url,
        });
        return;
      } catch (e) {
        if (e.name === 'AbortError') return;
      }
    }
    navigator.clipboard.writeText(url).then(() => {
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    });
  }

  async function handleSaveImage() {
    if (!cardRef.current || saving) return;
    recordTypeEvent('save_card_click', null, {
      duration_ms: Date.now() - enteredAtRef.current,
      position: 'save_card',
    });
    setSaving(true);
    try {
      await document.fonts.ready;
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: '#F5F2ED',
        onclone: (clonedDoc) => {
          clonedDoc.querySelectorAll('[data-tooltip-icon]').forEach((el) => {
            el.style.display = 'none';
          });
          clonedDoc.querySelectorAll('[data-onboarding-hint]').forEach((el) => {
            el.style.display = 'none';
          });
          clonedDoc.querySelectorAll('p').forEach((el) => {
            if (el.textContent.trim() === '나는') {
              el.style.marginBottom = '0';
            }
          });
          clonedDoc.querySelectorAll('[data-code-box]').forEach((el) => {
            const text = (el.textContent || '').trim();
            if (!text || text === '—') return;
            const w = parseInt(el.dataset.box) || 48;
            const fontSize = parseInt(el.dataset.font) || 20;
            const color = el.style.color || '#292524';
            const DPR = 3;
            const cvs = clonedDoc.createElement('canvas');
            cvs.width = w * DPR; cvs.height = w * DPR;
            cvs.style.cssText = `position:absolute;top:0;left:0;width:${w}px;height:${w}px;`;
            const ctx = cvs.getContext('2d');
            ctx.scale(DPR, DPR);
            ctx.font = `500 ${fontSize}px ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace`;
            ctx.fillStyle = color;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(text, w / 2, w / 2);
            el.style.position = 'relative'; el.style.overflow = 'hidden';
            while (el.firstChild) el.removeChild(el.firstChild);
            el.appendChild(cvs);
          });
        },
      });

      const filename = `vizuden-${code}.png`;
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      const file = new File([blob], filename, { type: 'image/png' });

      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: `나는 ${result.nameKo}` });
          return;
        } catch (e) {
          if (e.name === 'AbortError') return;
        }
      }

      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = filename; link.href = objectUrl;
      document.body.appendChild(link); link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 100);
    } catch (e) {
    } finally {
      setSaving(false);
    }
  }

  function handleNicknameSave(name) {
    setNickname(name);
    setStoredString(STORAGE_KEYS.nicknamePromptVisits, '1');
    setShowNicknameModal(false);
    setWelcomeName(name);
    setShowWelcome(true);
  }

  function handleNicknameSkip() {
    setStoredString(STORAGE_KEYS.nicknamePromptVisits, '1');
    setShowNicknameModal(false);
  }

  const year = new Date().getFullYear();

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.35 }}
      className="min-h-screen flex flex-col items-center"
      style={{ backgroundColor: '#F5F2ED' }}
    >
      <div className="w-full max-w-sm flex flex-col pb-28">

        {/* 헤더 */}
        <div className="px-7">
          <SiteHeader />
        </div>

        {/* ===== 캡처 카드 ===== */}
        <div
          ref={cardRef}
          className="px-7 pt-2 pb-5"
          style={{ backgroundColor: '#F5F2ED' }}
        >
          {/* 캐릭터 */}
          {typeImages[code] && (
            <div className="flex justify-center mb-5">
              <img
                src={typeImages[code]}
                alt="type character"
                onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }}
                className="h-36 object-contain"
              />
            </div>
          )}

          {/* 유형 이름 — 모두 inline style (html2canvas Tailwind 클래스 미적용 방지) */}
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 10, letterSpacing: '0.3em', color: '#a8a29e', textTransform: 'uppercase', marginBottom: 3 }}>
              나는
            </p>
            <h1 style={{ fontSize: 28, fontWeight: 300, color: '#1c1917', lineHeight: 1.35, letterSpacing: '-0.01em' }}>
              {result.ko1}
            </h1>
            <h1 style={{ fontSize: 28, fontWeight: 300, color: '#1c1917', lineHeight: 1.35, letterSpacing: '-0.01em', marginBottom: 4 }}>
              {result.ko2}
            </h1>
            <p style={{ fontSize: 12, color: '#a8a29e', letterSpacing: '0.01em', wordSpacing: '0.1em', lineHeight: 1.4 }}>
              {result.nameEn}
            </p>
          </div>

          <div style={{ borderTop: '1px solid #e7e5e4', marginBottom: 14 }} />

          {/* 유형 코드 + 스타일 DNA */}
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 10, letterSpacing: '0.1em', color: '#a8a29e', textTransform: 'uppercase', marginBottom: 10 }}>
              유형 코드
            </p>
            <div style={{ marginBottom: 14 }}>
              <TypeCodeDisplay parts={code.split('')} size="md" showHint />
            </div>
            {axisScores?.length > 0 && (
              <>
                <div style={{ borderTop: '1px solid #e7e5e4', marginBottom: 10 }} />
                {axisScores.map((ax) => (
                  <AxisBar key={ax.axis} {...ax} />
                ))}
              </>
            )}
          </div>

          <div style={{ borderTop: '1px solid #e7e5e4', marginBottom: 14 }} />

          {/* 설명 */}
          <p className="text-sm font-light text-stone-500 leading-relaxed">
            {result.description}
          </p>

          <div className="pt-5 text-center">
            <p className="text-[10px] tracking-[0.28em] text-stone-300 uppercase">vizuden.com</p>
          </div>
        </div>
        {/* ===== 캡처 카드 끝 ===== */}

        {/* 유형 비율 — 캡처 영역 밖, 확장 가능 */}
        {typeStat && (
          <div className="px-5 pb-3">
            <button
              onClick={() => setStatExpanded((v) => !v)}
              className="w-full text-left transition-colors duration-150"
              style={{
                backgroundColor: '#EDE8E1', border: '1px solid #DDD7CE',
                borderRadius: statExpanded ? '16px 16px 0 0' : 16,
                padding: '12px 16px',
              }}
            >
              <div className="flex items-center justify-between">
                <p style={{ fontSize: 14, color: '#1c1917', letterSpacing: '-0.01em' }}>
                  전체 중{' '}
                  <span style={{ fontWeight: 600 }}>{typeStat.pct}%</span>
                  만이{' '}
                  <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13 }}>{code}</span>
                  에 속해요!
                </p>
                <svg
                  width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="#a8a29e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transform: statExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </button>

            {/* 확장 시 전체 유형 비율 */}
            <AnimatePresence initial={false}>
              {statExpanded && (
                <motion.div
                  key="stat-expanded"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{
                    backgroundColor: '#EDE8E1', border: '1px solid #DDD7CE',
                    borderTop: 'none', borderRadius: '0 0 16px 16px',
                    padding: '8px 16px 14px',
                  }}>
                    {Object.entries(typeStat.distribution)
                      .sort((a, b) => b[1] - a[1])
                      .map(([typeCode, cnt]) => {
                        const pct = Math.round((cnt / typeStat.total) * 100);
                        const isCurrent = typeCode === code;
                        return (
                          <div key={typeCode} className="flex items-center gap-2 mb-1.5">
                            <span style={{
                              fontFamily: 'ui-monospace, monospace', fontSize: 11,
                              color: isCurrent ? '#1c1917' : '#a8a29e',
                              fontWeight: isCurrent ? 600 : 400,
                              width: 36, flexShrink: 0,
                            }}>
                              {typeCode}
                            </span>
                            <div style={{ flex: 1, height: 4, backgroundColor: '#DDD7CE', borderRadius: 2, overflow: 'hidden' }}>
                              <div style={{
                                height: '100%', borderRadius: 2,
                                backgroundColor: isCurrent ? '#1c1917' : '#C4BDB5',
                                width: `${pct}%`,
                                transition: 'width 0.4s ease',
                              }} />
                            </div>
                            <span style={{
                              fontSize: 11, width: 28, textAlign: 'right', flexShrink: 0,
                              color: isCurrent ? '#1c1917' : '#a8a29e',
                              fontWeight: isCurrent ? 600 : 400,
                            }}>
                              {pct}%
                            </span>
                          </div>
                        );
                      })}
                    <p style={{ fontSize: 10, color: '#c0bab4', marginTop: 8, letterSpacing: '0.02em' }}>
                      총 {typeStat.total.toLocaleString()}명 기준
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* sticky CTA — 본인 결과 뷰 */}
        {!isSharedView && (
          <div
            className="fixed bottom-0 left-0 right-0 flex justify-center pointer-events-none"
            style={{ zIndex: 50 }}
          >
            <div
              className="w-full max-w-sm px-6 pb-8 pt-10 pointer-events-auto"
              style={{ background: 'linear-gradient(to bottom, transparent, #F5F2ED 40%)' }}
            >
              <button
                onClick={handleSaveImage}
                disabled={saving}
                className="w-full text-center text-xs text-stone-400 tracking-wider mb-3 disabled:opacity-40 flex items-center justify-center gap-1.5 hover:text-stone-700 transition-colors duration-150"
              >
                <Download className="w-3 h-3" strokeWidth={2} />
                {saving ? '저장 중...' : '카드 저장'}
              </button>
              <button
                onClick={handleShare}
                className="w-full py-4 rounded-xl bg-stone-900 text-stone-50 text-sm tracking-wider transition-all duration-150 active:scale-[0.98] hover:bg-stone-800 flex items-center justify-center gap-2"
                style={{ boxShadow: '0 2px 20px 0 rgba(0,0,0,0.18)' }}
              >
                <Share2 className="w-[14px] h-[14px]" strokeWidth={2} />
                {shared ? '복사됨 ✓' : '공유하기'}
              </button>
            </div>
          </div>
        )}

        {/* 공유 뷰: sticky 나도 해보기 */}
        {isSharedView && (
          <div
            className="fixed bottom-0 left-0 right-0 flex justify-center pointer-events-none"
            style={{ zIndex: 50 }}
          >
            <div
              className="w-full max-w-sm px-6 pb-8 pt-10 pointer-events-auto"
              style={{ background: 'linear-gradient(to bottom, transparent, #F5F2ED 40%)' }}
            >
              <button
                onClick={() => navigate('/')}
                className="w-full py-4 rounded-xl bg-stone-900 text-stone-50 text-sm tracking-wider transition-all duration-150 active:scale-[0.98] hover:bg-stone-800"
                style={{ boxShadow: '0 2px 20px 0 rgba(0,0,0,0.18)' }}
              >
                나도 해보기
              </button>
            </div>
          </div>
        )}

        {/* Next Step */}
        {!isSharedView && (
          <div className="px-5 pt-8 pb-2">
            <p className="text-[10px] tracking-[0.3em] text-stone-400 uppercase mb-4 px-1">다음 단계</p>
            {!prescription.done ? (
              <div className="relative">
                <RecommendBadge />
                <button
                  onClick={() => {
                    recordTypeEvent('next_step_click', { target: 'prescription' }, {
                      duration_ms: Date.now() - enteredAtRef.current,
                      position: 'next_step',
                    });
                    navigate('/prescription', { state: { type: code, axisScores } });
                  }}
                  className="w-full px-5 py-5 rounded-3xl text-left transition-all duration-150 active:scale-[0.98] flex items-center gap-4"
                  style={{
                    backgroundColor: '#EDE8E1',
                    border: '1px solid #DDD7CE',
                    boxShadow: '0 1px 8px 0 rgba(0,0,0,0.05)',
                  }}
                >
                  <div className="shrink-0 flex items-center justify-center" style={{ width: 52, height: 60 }}>
                    <div style={{ position: 'relative', width: 38, height: 48, borderRadius: 4 }}>
                      <div style={{
                        position: 'absolute', top: 3, left: 3,
                        width: 35, height: 45, borderRadius: 4,
                        backgroundColor: '#D6CEC4', border: '1px solid #C0B9AF',
                      }} />
                      <div style={{
                        position: 'absolute', top: 0, left: 0,
                        width: 35, height: 45, borderRadius: 4,
                        backgroundColor: '#FAF8F5', border: '1px solid #D0C9BF',
                        display: 'flex', flexDirection: 'column',
                        padding: '6px 6px 5px', gap: 3,
                      }}>
                        <div style={{
                          fontFamily: 'Georgia, serif',
                          fontSize: 10, fontWeight: 600,
                          color: '#6B5E52', letterSpacing: '0.04em', lineHeight: 1,
                        }}>Rx</div>
                        {[100, 72, 88].map((w, i) => (
                          <div key={i} style={{
                            height: 2, borderRadius: 2, width: `${w}%`,
                            backgroundColor: i === 0 ? '#8C7B6E' : '#C8C0B8',
                          }} />
                        ))}
                        <div style={{ height: 1, backgroundColor: '#E0D9D2', marginTop: 1 }} />
                        {[60, 78].map((w, i) => (
                          <div key={i} style={{
                            height: 2, borderRadius: 2, width: `${w}%`,
                            backgroundColor: '#C8C0B8',
                          }} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] tracking-[0.22em] uppercase mb-1.5" style={{ color: 'rgba(28,25,23,0.3)' }}>
                      AI STYLE REPORT
                    </p>
                    <p className="text-[18px] font-medium tracking-tight text-stone-800 leading-snug">
                      스타일 처방전
                    </p>
                    <p className="mt-1 text-[12px] text-stone-500 leading-relaxed">
                      설문 기반 AI 진단 보고서 · 약 5분
                    </p>
                  </div>
                </button>
              </div>
            ) : (
              <div className="px-1">
                <div className="mb-4">
                  <StepNumber n="03" status="active" />
                </div>
                <p className="text-[10px] tracking-[0.22em] text-stone-400 uppercase mb-2">
                  Visual Consulting
                </p>
                <h2
                  className="text-2xl font-light text-stone-900 leading-tight mb-3"
                  style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}
                >
                  1:1 스타일 코칭
                </h2>
                <p className="text-sm text-stone-500 leading-relaxed mb-6" style={{ marginTop: '-0.5rem' }}>
                  스타일 처방전에서 찾은 기준을 바탕으로, 옷장 진단부터 쇼핑과 코디 실행까지 1:1로 함께합니다.
                </p>
                <TranslatorBeforeAfterCard />
                <button
                  disabled
                  className="w-full mt-6 py-4 bg-stone-200 text-stone-400 text-sm tracking-widest uppercase cursor-not-allowed"
                >
                  준비 중
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 mb-10 text-center">
          <p className="text-xs text-stone-400 tracking-widest uppercase">&copy; {year} VIZUDEN</p>
        </div>

      </div>

      <AnimatePresence>
        {showNicknameModal && (
          <NicknameModal
            key="nickname"
            onSave={handleNicknameSave}
            onSkip={handleNicknameSkip}
          />
        )}
        {showWelcome && (
          <WelcomeModal
            key="welcome"
            name={welcomeName}
            onClose={() => setShowWelcome(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
