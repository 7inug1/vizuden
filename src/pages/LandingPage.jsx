import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SiteHeader from '../components/SiteHeader';
import RecommendBadge from '../components/RecommendBadge';
import { typeImages } from '../data/typeImages';
import { types } from '../data/types';
import { useReportStatus } from '../hooks/useReportStatus';
import { useNickname } from '../context/NicknameContext';
import { NicknameModal } from './HubPage';
import BetaCodeModal from '../components/BetaCodeModal';
import TranslatorStartButton from '../components/TranslatorStartButton';
import { STORAGE_KEYS, getStoredString, setStoredString } from '../lib/storage';

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
  const [showCodeModal, setShowCodeModal] = useState(false);
  const { prescription, dbTypeHistory } = useReportStatus();
  const { nickname, setNickname } = useNickname();
  const [localTypeDone, setLocalTypeDone] = useState(false);
  const [localTypeCode, setLocalTypeCode] = useState(null);
  const [showNickModal, setShowNickModal] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setCharIdx(i => (i + 1) % BUTTON_CHARS.length), 3000);
    return () => clearInterval(t);
  }, []);

  // 사이트 첫 진입 시 닉네임 소프트 프롬프트 (스킵 가능)
  useEffect(() => {
    if (nickname) return;
    if (getStoredString(STORAGE_KEYS.nicknamePromptVisits) !== null) return;
    const t = setTimeout(() => setShowNickModal(true), 900);
    return () => clearTimeout(t);
  }, [nickname]);

  function handleNickSave(name) {
    setNickname(name);
    setStoredString(STORAGE_KEYS.nicknamePromptVisits, '1');
    setShowNickModal(false);
  }
  function handleNickSkip() {
    setStoredString(STORAGE_KEYS.nicknamePromptVisits, '1');
    setShowNickModal(false);
  }

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('vizuden_type_history') || '[]');
      if (Array.isArray(raw) && raw.length > 0) {
        setLocalTypeDone(true);
        setLocalTypeCode(raw[0].code);
        return;
      }
      const single = JSON.parse(localStorage.getItem('vizuden_type'));
      if (single?.code) {
        setLocalTypeDone(true);
        setLocalTypeCode(single.code);
      }
    } catch {}
  }, []);

  const typeDone = localTypeDone || (dbTypeHistory?.length > 0);
  const typeCode = localTypeCode || dbTypeHistory?.[0]?.code;
  const prescriptionDone = prescription.done;
  const recommend = !typeDone ? 'type' : !prescriptionDone ? 'translator' : 'consulting';

  const activeCode = BUTTON_CHARS[charIdx];


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
                onClick={() => typeDone && typeCode
                  ? navigate(`/type/result/${typeCode}`, { state: { fromHistory: true } })
                  : navigate('/type/questions')
                }
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
                  {typeDone && typeCode ? (
                    <>
                      <p className="text-[11px] font-mono text-stone-400 tracking-widest mb-0.5">{typeCode}</p>
                      <p className="text-[18px] font-medium tracking-tight text-stone-800 leading-snug">
                        {types[typeCode]?.nameKo ?? '내 유형 보기'}
                      </p>
                      <p className="mt-1 text-[12px] text-stone-400 leading-relaxed">결과 보기 →</p>
                    </>
                  ) : (
                    <>
                      <p className="text-[18px] font-medium tracking-tight text-stone-800 leading-snug">
                        스타일 유형 진단
                      </p>
                      <p className="mt-1 text-[12px] text-stone-400 leading-relaxed">
                        12문항 · 1분 · 16가지 유형
                      </p>
                    </>
                  )}
                </div>
              </button>
            </div>

            {/* ② 번역서 — 다크 히어로 */}
            <div className="relative">
              {recommend === 'translator' && <RecommendBadge />}
              {/* 코드를 먼저 묻지 않는다. 하루 한도를 넘겼을 때만 제출 단계에서 받는다 */}
              <TranslatorStartButton onClick={() => navigate('/translator/questions')} />

              {/* 설문은 5분이 든다. 그전에 결과물이 어떤지 볼 수 있어야 한다 —
                  샘플로 가는 길이 베타 코드 모달 안에만 있어서, 막혀야 보였다. */}
              <button
                onClick={() => navigate('/translator/samples')}
                className="w-full mt-2 py-2.5 text-[12.5px] transition-opacity active:opacity-60"
                style={{ color: 'rgba(58,48,40,0.62)' }}
              >
                먼저 샘플 번역서 보기
                <span className="ml-1" style={{ color: 'rgba(58,48,40,0.38)' }}>
                  유태오 · 봉태규 · 스티븐 연 · 손석구
                </span>
              </button>
            </div>

            {/* ③ 1:1 코칭 — 준비 중, 임시 숨김 */}

            {/* 소셜 아이콘 — 중앙정렬 */}
            <div className="w-full flex justify-center gap-5 pt-3">
              {[
                {
                  href: 'https://instagram.com/vizuden',
                  icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                      <circle cx="12" cy="12" r="4"/>
                      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
                    </svg>
                  ),
                },
                {
                  href: 'https://www.youtube.com/@VIZUDEN',
                  icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
                      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" stroke="none"/>
                    </svg>
                  ),
                },
              ].map(({ href, icon }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors duration-150 hover:text-stone-700 active:text-stone-700"
                  style={{ color: '#78716c' }}
                >
                  {icon}
                </a>
              ))}
            </div>

            <p className="text-center text-[11px] tracking-widest uppercase pt-2" style={{ color: '#d6d3d1' }}>
              © {new Date().getFullYear()} VIZUDEN
            </p>
          </div>
        </motion.div>

      </div>

      <AnimatePresence>
        {showNickModal && (
          <NicknameModal key="nickname" onSave={handleNickSave} onSkip={handleNickSkip} />
        )}
        {showCodeModal && (
          <BetaCodeModal onClose={() => setShowCodeModal(false)} showSamplesLink />
        )}
      </AnimatePresence>

      </div>{/* max-w-sm */}
    </div>
  );
}
