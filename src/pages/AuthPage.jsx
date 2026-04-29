import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { typeImages } from '../data/typeImages';
import { types } from '../data/types';
import { getAuthCallbackUrl } from '../lib/authRedirect';

const CHAR_OFFSET = {
  ICEN: { img: { transform: 'translateX(8px)' } },
  IDEN: { img: { transform: 'translateX(-4px)' } },
  IDMT: { img: { transform: 'translateX(-4px)' } },
  RCEN: { img: { transform: 'translateX(-4px)' } },
  RDEN: { img: { transform: 'translateX(-4px)' } },
  RDMN: { img: { transform: 'translateX(-4px)' } },
};

const TYPE_ENTRIES = Object.entries(typeImages).map(([code, src]) => ({
  code,
  src,
  nameKo: types[code]?.nameKo || code,
}));
const REEL = [...TYPE_ENTRIES, ...TYPE_ENTRIES];

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
      <path fill="#4285F4" d="M21.82 12.25c0-.79-.07-1.54-.2-2.25H12v4.26h5.5a4.7 4.7 0 0 1-2.04 3.08v2.56h3.3c1.93-1.78 3.06-4.4 3.06-7.65Z" />
      <path fill="#34A853" d="M12 22c2.76 0 5.08-.92 6.77-2.49l-3.3-2.56c-.92.62-2.08.99-3.47.99-2.67 0-4.94-1.8-5.75-4.22H2.84v2.64A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.25 13.72A6 6 0 0 1 5.93 12c0-.6.11-1.17.32-1.72V7.64H2.84A10 10 0 0 0 2 12c0 1.61.39 3.13 1.08 4.36l3.17-2.64Z" />
      <path fill="#EA4335" d="M12 6.06c1.5 0 2.84.52 3.9 1.53l2.92-2.92C17.07 3.04 14.76 2 12 2A10 10 0 0 0 2.84 7.64l3.41 2.64c.81-2.42 3.08-4.22 5.75-4.22Z" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
      <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 8l10 6 10-6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSupabaseConfigured, signInWithGoogle, continueAsGuest, setPostAuthRedirect, user, loading } = useAuth();
  const nextPath = location.state?.nextPath || '/home';
  const callbackUrl = getAuthCallbackUrl();
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (!loading && user) {
      navigate('/home', { replace: true });
    }
  }, [loading, navigate, user]);

  function storeNextPath() {
    setPostAuthRedirect(nextPath);
  }

  async function handleGoogle() {
    setAuthError(null);
    try {
      storeNextPath();
      await signInWithGoogle(callbackUrl);
    } catch {
      setAuthError('로그인에 실패했습니다. 다시 시도해주세요.');
    }
  }

  function handleGuest() {
    continueAsGuest();
    navigate('/home', { replace: true });
  }

  return (
    <div className="min-h-svh flex flex-col" style={{ backgroundColor: '#F5F2ED' }}>
      {/* 상단: 캐러셀 영역 */}
      <div className="flex flex-col">
        {/* 브랜드 */}
        <motion.header
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center pb-8"
          style={{ paddingTop: '8px' }}
        >
          <span className="text-3xl tracking-[0.18em] text-stone-900 font-medium select-none">
            VIZUDEN
          </span>
        </motion.header>

        {/* 캐러셀 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full select-none relative mt-6"
          style={{ height: 160 }}
          onDragStart={(e) => e.preventDefault()}
        >
          <div className="overflow-hidden h-full">
            <div
              className="flex gap-4 items-end h-full"
              style={{
                width: 'max-content',
                animation: 'reel-scroll 44s linear infinite',
              }}
            >
              {REEL.map((entry, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center shrink-0"
                  style={{ width: 110 }}
                >
                  <img
                    src={entry.src}
                    alt={entry.nameKo}
                    draggable="false"
                    style={{
                      height: 154,
                      width: 110,
                      objectFit: 'contain',
                      objectPosition: 'bottom center',
                      WebkitUserDrag: 'none',
                      pointerEvents: 'none',
                      ...(CHAR_OFFSET[entry.code]?.img || {}),
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
          <div
            className="absolute left-0 top-0 bottom-0 pointer-events-none"
            style={{ width: 64, background: 'linear-gradient(to right, #F5F2ED 10%, transparent)' }}
          />
          <div
            className="absolute right-0 top-0 bottom-0 pointer-events-none"
            style={{ width: 64, background: 'linear-gradient(to left, #F5F2ED 10%, transparent)' }}
          />
        </motion.div>

        {/* 카피 */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="text-center mt-6 mb-2 text-lg font-light text-stone-600"
          style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}
        >
          드디어, 나한테 맞는 걸 알았다
        </motion.p>
      </div>

      {/* 하단: 버튼 시트 */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="w-full px-6 pb-8 pt-4"
        style={{
          background: 'linear-gradient(to bottom, transparent, #F5F2ED 12%)',
        }}
      >
        <div className="mx-auto max-w-sm flex flex-col gap-3">
          {/* 구글 */}
          <button
            onClick={handleGoogle}
            disabled={!isSupabaseConfigured}
            className="w-full py-4 rounded-xl bg-stone-900 text-stone-50 text-sm tracking-wider disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 transition-all duration-150 active:scale-[0.98] hover:bg-stone-800"
            style={{ boxShadow: '0 2px 16px 0 rgba(0,0,0,0.13)' }}
          >
            <GoogleIcon />
            <span>구글로 시작하기</span>
          </button>

          {authError && (
            <p className="text-xs text-red-500 text-center -mt-1">{authError}</p>
          )}

          {/* 이메일 */}
          <button
            onClick={() => navigate('/auth/email', { state: { nextPath } })}
            disabled={!isSupabaseConfigured}
            className="w-full py-4 rounded-xl bg-white border border-stone-200 text-stone-800 text-sm tracking-wider disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 transition-all duration-150 active:scale-[0.98] hover:border-stone-400"
            style={{ boxShadow: '0 1px 4px 0 rgba(0,0,0,0.06)' }}
          >
            <EmailIcon />
            <span>이메일로 시작하기</span>
          </button>

          {/* 구분선 */}
          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-stone-200" />
            <span className="text-[10px] tracking-[0.22em] text-stone-400 uppercase">or</span>
            <div className="flex-1 h-px bg-stone-200" />
          </div>

          {/* 게스트 */}
          <button
            onClick={handleGuest}
            className="w-full py-3 text-stone-500 text-sm tracking-wide transition-colors duration-150 hover:text-stone-800"
          >
            게스트로 먼저 둘러보기 →
          </button>

          <p className="text-[11px] text-stone-400 text-center leading-relaxed -mt-1">
            결과는 현재 브라우저에 저장됩니다
          </p>
        </div>
      </motion.div>
    </div>
  );
}
