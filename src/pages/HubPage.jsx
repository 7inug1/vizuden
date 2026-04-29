import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SiteHeader from '../components/SiteHeader';
import PrescriptionSampleCard from '../components/PrescriptionSampleCard';
import TypeSamplePreview from '../components/TypeSamplePreview';
import ConsultingBeforeAfterCard from '../components/ConsultingBeforeAfterCard';
import { StepNumber } from '../components/ServiceStepChrome';
import { types } from '../data/types';
import { useNickname } from '../context/NicknameContext';
import { useReportStatus } from '../hooks/useReportStatus';
import {
  STORAGE_KEYS,
  getStoredCount,
  getStoredString,
  removeStoredValue,
  setStoredCount,
} from '../lib/storage';

const WELCOME_MESSAGES = [
  '비주얼 여정을 함께 하게 되어 기쁩니다.',
  '당신의 스타일을 찾아드리겠습니다.',
  '오늘부터 기준을 만들어 봅시다.',
  '나다운 스타일, 지금부터 시작입니다.',
];

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

function isValidNickname(val) {
  return /^[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9\s]*$/.test(val);
}


/* ─────────────────────────────────────────
   RecommendBadge — 추천 말풍선
───────────────────────────────────────── */
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

/* ─────────────────────────────────────────
   WelcomeModal — 닉네임 저장 직후 인사
───────────────────────────────────────── */
export function WelcomeModal({ name, onClose }) {
  const welcomeMsg = useMemo(
    () => WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)],
    []
  );
  const closedRef = useRef(false);

  function close() {
    if (closedRef.current) return;
    closedRef.current = true;
    onClose();
  }

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
      style={{ backgroundColor: 'rgba(28,25,23,0.55)' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="w-full max-w-sm flex flex-col items-center px-8 py-12 relative overflow-hidden"
        style={{ backgroundColor: '#F5F2ED', minHeight: '260px' }}
      >
        <p className="text-xs tracking-[0.28em] text-stone-400 uppercase mb-5">반갑습니다</p>
        <h2
          className="text-2xl font-light text-stone-900 leading-snug mb-5 text-center"
          style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}
        >
          {name}님
        </h2>
        <p className="text-sm text-stone-500 leading-relaxed text-center mb-8">{welcomeMsg}</p>
        <button
          onClick={close}
          className="w-full py-4 bg-stone-900 text-stone-50 text-sm tracking-widest uppercase
            hover:bg-stone-800 active:bg-stone-700 transition-colors duration-200"
        >
          확인
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────
   NicknameModal — 닉네임 입력 폼만
───────────────────────────────────────── */
function NicknameModal({ onSave, onSkip }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => inputRef.current?.focus(), 280);
    return () => { document.body.style.overflow = ''; clearTimeout(t); };
  }, []);

  function handleChange(e) {
    const v = e.target.value;
    if (!isValidNickname(v)) { setError('한글, 영문, 숫자만 사용할 수 있습니다'); return; }
    setError('');
    setValue(v);
  }

  function handleSave() {
    const trimmed = value.trim();
    if (!trimmed || error) return;
    onSave(trimmed);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ backgroundColor: 'rgba(28,25,23,0.55)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onSkip(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="w-full max-w-sm flex flex-col items-center px-8 py-12 relative overflow-hidden"
        style={{ backgroundColor: '#F5F2ED', minHeight: '280px' }}
      >
        <p className="text-xs tracking-[0.28em] text-stone-400 uppercase mb-4">환영합니다</p>
        <h2
          className="text-xl font-light text-stone-900 text-center leading-snug mb-8"
          style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.01em' }}
        >
          어떻게 불러드릴까요?
        </h2>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          maxLength={20}
          placeholder="닉네임 또는 이름"
          className="w-full bg-transparent border-b border-stone-300 focus:border-stone-900
            text-base text-stone-900 text-center pb-2 focus:outline-none transition-colors
            duration-150 placeholder:text-stone-300 tracking-wide"
        />
        {error && <p className="text-xs text-stone-400 mt-2">{error}</p>}
        <div className="w-full mt-8 flex flex-col gap-3">
          <button
            onClick={handleSave}
            disabled={!value.trim() || !!error}
            className="w-full py-4 bg-stone-900 text-stone-50 text-sm tracking-widest uppercase
              disabled:opacity-30 disabled:cursor-not-allowed transition-opacity duration-150"
          >
            저장하기
          </button>
          <button
            onClick={onSkip}
            className="text-xs text-stone-400 text-center py-1 hover:text-stone-700 transition-colors duration-150"
          >
            나중에 하기
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function timeGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return '좋은 아침이에요';
  if (h >= 12 && h < 14) return '벌써 점심 시간이에요';
  if (h >= 14 && h < 18) return '좋은 오후입니다';
  if (h >= 18 && h < 22) return '좋은 저녁이에요';
  return '늦은 시간에 방문하셨네요';
}

const SERVICE_DATA = {
  type: {
    step: '01',
    eyebrow: 'STYLE TYPE',
    title: '스타일 유형 테스트',
    body: '16가지 유형 중 지금의 나를 가리키는 유형을 찾습니다.',
    cta: '유형 진단하기',
    path: '/type/questions',
    introText: '스타일 유형 테스트 한 번 받아보는 건 어떠세요?',
  },
  prescription: {
    step: '02',
    eyebrow: 'STYLE PRESCRIPTION',
    title: '스타일 처방전',
    body: '어떤 옷이 나답고, 어떻게 입어야 더 나아 보이는지 한 번에 정리합니다.',
    cta: '처방전 만들기',
    path: '/prescription',
    introText: '이제 나만의 기준을 만들 차례입니다.',
  },
  consulting: {
    step: '03',
    eyebrow: 'VISUAL CONSULTING',
    title: '비주얼 컨설팅',
    body: '스타일 처방전에서 찾은 기준을 바탕으로, 옷장 진단부터 쇼핑과 코디 실행까지 1:1로 함께합니다.',
    cta: '신청하기',
    path: '/consulting/questions',
    introText: '이제 1:1 컨설팅을 신청할 수 있습니다.',
  },
};

function GreetingSection({ nickname, recommend, typeCode, onNavigate, ctaLabel, typeCount }) {
  const greeting = nickname
    ? `${timeGreeting()}, ${nickname}님`
    : timeGreeting();

  const svc = SERVICE_DATA[recommend ?? 'consulting'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <div className="pt-6 pb-6">
        <p className="text-base font-light text-stone-800" style={{ letterSpacing: '-0.01em' }}>
          {greeting}
        </p>
        {svc.introText && (
          <p className="text-base text-stone-400 mt-2 leading-relaxed">{svc.introText}</p>
        )}
      </div>

      <div className="border-t border-stone-200 pt-8 pb-10">
        <div className="flex gap-5">
          <div className="flex flex-col items-center" style={{ width: 24 }}>
            <StepNumber n={svc.step} status="active" />
          </div>
          <div className="flex-1" style={{ paddingTop: 2 }}>
            <p className="text-xs tracking-[0.28em] text-stone-400 uppercase mb-5">{svc.eyebrow}</p>
            <h2
              className="text-2xl font-light text-stone-900 leading-tight mb-3"
              style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}
            >
              {svc.title}
            </h2>
            <p className="text-sm text-stone-500 leading-relaxed mb-6" style={{ marginTop: '-0.5rem' }}>
              {svc.body}
            </p>
            {recommend === 'type' && <TypeSamplePreview className="mb-6" />}
            {recommend === 'prescription' && <PrescriptionSampleCard className="mb-6" />}
            {recommend === 'consulting' && <ConsultingBeforeAfterCard className="mb-6" />}
            <div style={{ position: 'relative' }}>
              {recommend && svc.path && <RecommendBadge />}
              {svc.cta && svc.path && (
                <button
                  onClick={() => onNavigate(svc.path)}
                  className="w-full py-4 bg-stone-900 text-stone-50 text-sm tracking-widest uppercase
                    hover:bg-stone-800 active:bg-stone-700 transition-colors duration-200"
                >
                  {ctaLabel || svc.cta}
                </button>
              )}
            </div>
            {recommend === 'type' && typeCount !== null && typeCount >= 10 && (
              <p className="text-xs text-stone-400 tracking-wide text-center mt-3">
                지금까지 <span className="text-stone-600">{typeCount.toLocaleString()}명</span>이 진단했습니다
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function HubPage() {
  const navigate = useNavigate();
  const { nickname, setNickname } = useNickname();
  const [prevType, setPrevType] = useState(null);
  const [typeCount, setTypeCount] = useState(null);
  const { prescription } = useReportStatus();
  const [showNickname, setShowNickname] = useState(false);
  const initRan = useRef(false);

  useEffect(() => {
    if (initRan.current) return;
    initRan.current = true;

    try {
      const t = JSON.parse(localStorage.getItem('vizuden_type'));
      if (t?.code && types[t.code]) setPrevType(t);
    } catch {}
    try {
      const saved = getStoredString(STORAGE_KEYS.nickname);
      const nicknamePromptVisits = getStoredString(STORAGE_KEYS.nicknamePromptVisits);

      if (saved) {
        setShowNickname(false);
      } else if (nicknamePromptVisits === null) {
        setShowNickname(true);
      } else if (!saved) {
        const visits = getStoredCount(STORAGE_KEYS.nicknamePromptVisits) + 1;
        if (visits >= 3) {
          setStoredCount(STORAGE_KEYS.nicknamePromptVisits, 0);
          setShowNickname(true);
        } else {
          setStoredCount(STORAGE_KEYS.nicknamePromptVisits, visits);
        }
      }
    } catch {
      setShowNickname(true);
    }
  }, []);

  useEffect(() => {
    fetch('/api/type-count')
      .then((response) => response.json())
      .then((data) => {
        if (typeof data?.count === 'number') setTypeCount(data.count);
      })
      .catch(() => {});
  }, []);

  function handleNicknameSave(name) {
    setNickname(name);
    try { removeStoredValue(STORAGE_KEYS.nicknamePromptVisits); } catch {}
    setShowNickname(false);
  }

  function handleNicknameSkip() {
    setShowNickname(false);
    try { setStoredCount(STORAGE_KEYS.nicknamePromptVisits, 0); } catch {}
  }

  const recommend = !prevType
    ? 'type'
    : !prescription.done
      ? 'prescription'
      : 'consulting';

  function handleServiceNavigate(path) {
    if (path === '/prescription' && prescription.done && prescription.reportId) {
      navigate(`/prescription/result/${prescription.reportId}`);
      return;
    }
    if (path === '/prescription') {
      navigate('/prescription/questions');
      return;
    }
    if (path === '/type/questions') {
      navigate('/type/questions', { state: { source: 'home' } });
      return;
    }
    navigate(path);
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
      className="min-h-screen flex flex-col items-center px-6"
      style={{ backgroundColor: '#F5F2ED' }}
    >
      <div className="w-full max-w-sm flex flex-col" style={{ minHeight: '100svh' }}>
        <SiteHeader onLogoClick={() => navigate('/home')} />

        <GreetingSection
          nickname={nickname}
          recommend={recommend}
          typeCode={prevType?.code}
          onNavigate={handleServiceNavigate}
          ctaLabel={undefined}
          typeCount={typeCount}
        />

        <div className="border-t border-stone-200" />

        <div className="mt-6">
          <button
            onClick={() => navigate('/services')}
            className="text-xs tracking-widest text-stone-400 uppercase
              hover:text-stone-700 transition-colors duration-150"
          >
            서비스 전체 보기 →
          </button>
        </div>

        <div className="mt-auto text-center py-8">
          <p className="text-xs text-stone-400 tracking-widest uppercase">
            &copy; {new Date().getFullYear()} VIZUDEN
          </p>
        </div>

        <AnimatePresence>
          {showNickname && (
            <NicknameModal key="nickname" onSave={handleNicknameSave} onSkip={handleNicknameSkip} />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
