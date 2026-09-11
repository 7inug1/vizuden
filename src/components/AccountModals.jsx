import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';

/* 로그인·진입 시점에 뜨는 계정 모달 둘.
   HubPage 안에 살고 있었는데 HubPage 자체는 라우트에서 빠졌고
   이 둘만 랜딩·마이페이지·결과·처방·문항 5곳에서 쓰고 있었다. */


const WELCOME_MESSAGES = [
  '비주얼 여정을 함께 하게 되어 기쁩니다.',
  '당신의 스타일을 찾아드리겠습니다.',
  '오늘부터 기준을 만들어 봅시다.',
  '나다운 스타일, 지금부터 시작입니다.',
];

function isValidNickname(val) {
  return /^[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9\s]*$/.test(val);
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
export function NicknameModal({ onSave, onSkip }) {
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
      onClick={(e) => { if (e.target === e.currentTarget) onSkip?.(); }}
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
          {onSkip && (
            <button
              onClick={onSkip}
              className="text-xs text-stone-400 text-center py-1 hover:text-stone-700 transition-colors duration-150"
            >
              나중에 하기
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
