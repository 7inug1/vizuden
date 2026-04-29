import { useRef, useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import { Download, Share2 } from 'lucide-react';
import SiteHeader from '../components/SiteHeader';
import AxisBar from '../components/AxisBar';
import TypeCodeDisplay from '../components/TypeCodeDisplay';
import { types } from '../data/types';
import { typeImages } from '../data/typeImages';
import { useAuth } from '../context/AuthContext';
import { useNickname } from '../context/NicknameContext';
import { useReportStatus } from '../hooks/useReportStatus';
import PrescriptionSampleCard from '../components/PrescriptionSampleCard';
import ConsultingBeforeAfterCard from '../components/ConsultingBeforeAfterCard';
import { StepNumber } from '../components/ServiceStepChrome';
import { ensureGuestSessionId, ensureTrackingSessionId } from '../lib/storage';

const TYPE_RESULT_VERSION = 'type_result.v1';

function RecommendBadge() {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{ position: 'absolute', top: '-12px', right: '12px', zIndex: 1 }}
    >
      <div style={{
        display: 'inline-flex', alignItems: 'center',
        padding: '3px 10px', border: '1px solid #1c1917',
        backgroundColor: '#F5F2ED', borderRadius: '999px',
        fontSize: '10px', letterSpacing: '0.08em', color: '#1c1917', whiteSpace: 'nowrap',
      }}>
        추천
      </div>
      <div style={{
        position: 'absolute', bottom: '-6px', right: '20px',
        width: 0, height: 0,
        borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
        borderTop: '6px solid #1c1917',
      }} />
      <div style={{
        position: 'absolute', bottom: '-4px', right: '21px',
        width: 0, height: 0,
        borderLeft: '4px solid transparent', borderRight: '4px solid transparent',
        borderTop: '5px solid #F5F2ED',
      }} />
    </motion.div>
  );
}

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export default function ResultPage() {
  const { code } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const [shared, setShared] = useState(false);
  const [saving, setSaving] = useState(false);
  const { prescription } = useReportStatus();
  const { session } = useAuth();

  const { axisScores, fromHistory } = location.state ?? {};
  const result = types[code];
  useNickname();

  if (!result) {
    navigate('/home', { replace: true });
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

  async function handleShare() {
    recordTypeEvent('share_click', { shared_view: isSharedView }, {
      duration_ms: Date.now() - enteredAtRef.current,
      position: 'sticky_share',
    });
    const url = `${window.location.origin}/type/result/${code}`;
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

          {/* 유형 이름 */}
          <div className="mb-3">
            <p className="text-[10px] tracking-[0.3em] text-stone-400 uppercase mb-1.5">나는</p>
            <h1
              className="text-[1.75rem] font-light text-stone-900 leading-[1.2]"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif', letterSpacing: '-0.01em' }}
            >
              {result.ko1}
            </h1>
            <h1
              className="text-[1.75rem] font-light text-stone-900 leading-[1.2] mb-1.5"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif', letterSpacing: '-0.01em' }}
            >
              {result.ko2}
            </h1>
            <p className="text-xs text-stone-400">{result.nameEn}</p>
          </div>

          <div className="border-t border-stone-200 mb-4" />

          {/* 유형 코드 + 스타일 DNA */}
          <div className="mb-4">
            <p className="text-[10px] tracking-widest text-stone-400 uppercase mb-3">유형 코드</p>
            <div className="mb-4">
              <TypeCodeDisplay parts={code.split('')} size="md" />
            </div>
            {axisScores?.length > 0 && (
              <>
                <div className="border-t border-stone-200 mb-3" />
                {axisScores.map((ax) => (
                  <AxisBar key={ax.axis} {...ax} />
                ))}
              </>
            )}
          </div>

          <div className="border-t border-stone-200 mb-4" />

          {/* 설명 */}
          <p className="text-sm font-light text-stone-500 leading-relaxed">
            {result.description}
          </p>

          <div className="pt-5 text-center">
            <p className="text-[10px] tracking-[0.28em] text-stone-300 uppercase">vizuden.com</p>
          </div>
        </div>
        {/* ===== 캡처 카드 끝 ===== */}

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
          <div className="px-7 pt-8 pb-2">
            <p className="text-[10px] tracking-[0.3em] text-stone-400 uppercase mb-3">다음 단계</p>
            <div className="mb-6">
              <div className="mb-4">
                <StepNumber n={!prescription.done ? '02' : '03'} status="active" />
              </div>
              {!prescription.done ? (
                <>
                  <p className="text-[10px] tracking-[0.22em] text-stone-400 uppercase mb-2">
                    Style Prescription
                  </p>
                  <h2
                    className="text-2xl font-light text-stone-900 leading-tight mb-3"
                    style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}
                  >
                    스타일 처방전
                  </h2>
                  <p className="text-sm text-stone-500 leading-relaxed mb-6" style={{ marginTop: '-0.5rem' }}>
                    어떤 옷이 나답고, 어떻게 입어야 할지 기준을 정리합니다.
                  </p>
                  <PrescriptionSampleCard />
                </>
              ) : (
                <>
                  <p className="text-[10px] tracking-[0.22em] text-stone-400 uppercase mb-2">
                    Visual Consulting
                  </p>
                  <h2
                    className="text-2xl font-light text-stone-900 leading-tight mb-3"
                    style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}
                  >
                    비주얼 컨설팅
                  </h2>
                  <p className="text-sm text-stone-500 leading-relaxed mb-6" style={{ marginTop: '-0.5rem' }}>
                    스타일 처방전에서 찾은 기준을 바탕으로, 옷장 진단부터 쇼핑과 코디 실행까지 1:1로 함께합니다.
                  </p>
                  <ConsultingBeforeAfterCard />
                </>
              )}
            </div>
            {!prescription.done ? (
              <div className="relative">
                <RecommendBadge />
                <button
                  onClick={() => {
                    recordTypeEvent('next_step_click', { target: 'prescription' }, {
                      duration_ms: Date.now() - enteredAtRef.current,
                      position: 'next_step',
                    });
                    navigate('/prescription/questions', { state: { type: code, axisScores } });
                  }}
                  className="w-full py-4 bg-stone-900 text-stone-50 text-sm tracking-widest uppercase hover:bg-stone-800 transition-colors duration-150"
                >
                  처방전 만들기
                </button>
              </div>
            ) : (
              <button
                disabled
                className="w-full py-4 bg-stone-200 text-stone-400 text-sm tracking-widest uppercase cursor-not-allowed"
              >
                준비 중
              </button>
            )}
          </div>
        )}

        <div className="mt-8 mb-10 text-center">
          <p className="text-xs text-stone-400 tracking-widest uppercase">&copy; {year} VIZUDEN</p>
        </div>

      </div>
    </motion.div>
  );
}
