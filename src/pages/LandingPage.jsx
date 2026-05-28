import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SiteHeader from '../components/SiteHeader';
import RecommendBadge from '../components/RecommendBadge';
import CoachingModal from '../components/CoachingModal';
import { typeImages } from '../data/typeImages';
import { types } from '../data/types';
import { useReportStatus } from '../hooks/useReportStatus';

const CHAR_OFFSET = {
  ICEN: { img: { transform: 'translateX(8px)' } },
  IDEN: { img: { transform: 'translateX(-4px)' } },
  IDMT: { img: { transform: 'translateX(-4px)' } },
  RCEN: { img: { transform: 'translateX(-4px)' } },
  RDEN: { img: { transform: 'translateX(-4px)' } },
  RDMN: { img: { transform: 'translateX(-4px)' } },
};


const TYPE_ENTRIES = Object.entries(typeImages).map(([code, src]) => ({
  code, src, nameKo: types[code]?.nameKo || code,
}));
const REEL = [...TYPE_ENTRIES, ...TYPE_ENTRIES];
const BUTTON_CHARS = ['ICMT', 'RDMT', 'RCET', 'IDET'];


/* ─────────────────────────────────────────
   LandingPage
───────────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate();
  const [charIdx, setCharIdx] = useState(0);
  const [showConsultingModal, setShowConsultingModal] = useState(false);
  const { prescription, dbTypeHistory } = useReportStatus();
  const [localTypeDone, setLocalTypeDone] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setCharIdx(i => (i + 1) % BUTTON_CHARS.length), 3000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('vizuden_type_history') || '[]');
      if (Array.isArray(raw) && raw.length > 0) { setLocalTypeDone(true); return; }
      const single = JSON.parse(localStorage.getItem('vizuden_type'));
      if (single?.code) setLocalTypeDone(true);
    } catch {}
  }, []);

  const typeDone = localTypeDone || (dbTypeHistory?.length > 0);
  const prescriptionDone = prescription.done;
  const recommend = !typeDone ? 'type' : !prescriptionDone ? 'prescription' : 'consulting';

  const activeCode = BUTTON_CHARS[charIdx];
  const activeChar = typeImages[activeCode];

  return (
    <div className="min-h-svh flex flex-col items-center px-6" style={{ backgroundColor: '#F5F2ED' }}>
      <div className="w-full max-w-sm flex flex-col" style={{ minHeight: '100svh' }}>

      {/* 헤더 — 햄버거 + VIZUDEN + 마이페이지 */}
      <SiteHeader />

      {/* 나머지 콘텐츠 — 남은 높이에서 수직 중앙 */}
      <div className="flex-1 flex flex-col justify-center" style={{ paddingBottom: 'clamp(24px, 10svh, 72px)' }}>

        {/* 캐러셀 — max-w-sm 기준 full-width */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="w-full select-none relative"
          style={{ height: 'clamp(120px, 20svh, 160px)' }}
          onDragStart={(e) => e.preventDefault()}
        >
          <div className="overflow-hidden h-full">
            <div
              className="flex gap-4 items-end h-full"
              style={{ width: 'max-content', animation: 'reel-scroll 44s linear infinite' }}
            >
              {REEL.map((entry, i) => (
                <div key={i} className="shrink-0" style={{ width: 110 }}>
                  <img
                    src={entry.src} alt={entry.nameKo} draggable="false"
                    style={{
                      height: '100%', width: 110,
                      objectFit: 'contain', objectPosition: 'bottom center',
                      WebkitUserDrag: 'none', pointerEvents: 'none',
                      ...(CHAR_OFFSET[entry.code]?.img || {}),
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="absolute left-0 top-0 bottom-0 pointer-events-none"
            style={{ width: 48, background: 'linear-gradient(to right, #F5F2ED 10%, transparent)' }} />
          <div className="absolute right-0 top-0 bottom-0 pointer-events-none"
            style={{ width: 48, background: 'linear-gradient(to left, #F5F2ED 10%, transparent)' }} />
        </motion.div>

        {/* 캐러셀 ↔ 버튼 간격 */}
        <div style={{ height: 'clamp(20px, 4svh, 36px)' }} />

        {/* 버튼 시트 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex flex-col gap-3">

            {/* ① 유형 테스트 — 흰색 */}
            <div className="relative">
              {recommend === 'type' && <RecommendBadge />}
              <button
                onClick={() => navigate('/type/questions')}
                className="w-full px-5 py-5 rounded-3xl bg-white border border-stone-200 text-left transition-all duration-150 active:scale-[0.98] hover:border-stone-300 flex items-center gap-4"
                style={{ boxShadow: '0 1px 8px 0 rgba(0,0,0,0.06)' }}
              >
                <div className="shrink-0 flex items-center justify-center" style={{ width: 52, height: 60 }}>
                  <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
                    <line x1="21" y1="19" x2="21" y2="16" stroke="#1c1917" strokeWidth="1.2" strokeLinecap="round" opacity="0.35"/>
                    <line x1="21" y1="23" x2="21" y2="26" stroke="#1c1917" strokeWidth="1.2" strokeLinecap="round" opacity="0.35"/>
                    <line x1="19" y1="21" x2="16" y2="21" stroke="#1c1917" strokeWidth="1.2" strokeLinecap="round" opacity="0.35"/>
                    <line x1="23" y1="21" x2="26" y2="21" stroke="#1c1917" strokeWidth="1.2" strokeLinecap="round" opacity="0.35"/>
                    <circle cx="21" cy="21" r="1.8" fill="#1c1917" opacity="0.5"/>
                    <text x="21" y="12" textAnchor="middle" fontSize="9" fontWeight="600" fill="#1c1917"
                      opacity={activeCode[0] === 'I' ? 1 : 0.22} style={{ transition: 'opacity 0.3s' }}>I</text>
                    <text x="21" y="36" textAnchor="middle" fontSize="9" fontWeight="600" fill="#1c1917"
                      opacity={activeCode[0] === 'R' ? 1 : 0.22} style={{ transition: 'opacity 0.3s' }}>R</text>
                    <text x="33" y="21" textAnchor="middle" dominantBaseline="central" fontSize="9" fontWeight="600" fill="#1c1917"
                      opacity={activeCode[1] === 'C' ? 1 : 0.22} style={{ transition: 'opacity 0.3s' }}>C</text>
                    <text x="9" y="21" textAnchor="middle" dominantBaseline="central" fontSize="9" fontWeight="600" fill="#1c1917"
                      opacity={activeCode[1] === 'D' ? 1 : 0.22} style={{ transition: 'opacity 0.3s' }}>D</text>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] tracking-[0.22em] uppercase mb-1.5" style={{ color: 'rgba(28,25,23,0.3)' }}>
                    STYLE TYPE
                  </p>
                  <p className="text-[18px] font-medium tracking-tight text-stone-800 leading-snug">
                    스타일 유형 테스트
                  </p>
                  <p className="mt-1 text-[12px] text-stone-400 leading-relaxed">
                    12문항 · 1분 · 16가지 유형
                  </p>
                </div>
              </button>
            </div>

            {/* ② 처방전 — 베이지 */}
            <div className="relative">
              {recommend === 'prescription' && <RecommendBadge />}
            <button
              onClick={() => navigate('/prescription')}
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

            {/* ③ 컨설팅 — 다크 */}
            <div className="relative">
              {recommend === 'consulting' && <RecommendBadge />}
            <button
              onClick={() => setShowConsultingModal(true)}
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
                  처방전 완료 후 신청 가능
                </p>
              </div>
            </button>
            </div>

            {/* 이메일 로그인 — 텍스트 링크 */}
            <p className="w-full pt-1 pb-2 text-[12px] text-stone-400 text-center">
              이미 계정이 있으신가요?{' '}
              <button
                onClick={() => navigate('/auth/email')}
                className="underline underline-offset-2 hover:text-stone-600 transition-colors duration-150 cursor-pointer"
              >
                로그인
              </button>
            </p>
          </div>
        </motion.div>

      </div>

      <AnimatePresence>
        {showConsultingModal && (
          <CoachingModal
            onClose={() => setShowConsultingModal(false)}
            prescriptionDone={prescriptionDone}
            onNavigate={() => {
              setShowConsultingModal(false);
              navigate('/prescription');
            }}
          />
        )}
      </AnimatePresence>

      </div>{/* max-w-sm */}
    </div>
  );
}
