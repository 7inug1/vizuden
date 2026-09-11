import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getAuthCallbackUrl } from '../lib/authRedirect';

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
      navigate('/', { replace: true });
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
    navigate('/', { replace: true });
  }

  return (
    <div className="min-h-svh flex flex-col justify-center" style={{ backgroundColor: '#F5F2ED' }}>

      {/* VIZUDEN 로고 */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center px-6"
      >
        <p className="text-[34px] font-medium tracking-[0.18em] text-stone-900 select-none">
          VIZUDEN
        </p>
      </motion.div>

      {/* 로고 ↔ 버튼 간격 */}
      <div style={{ height: 'clamp(24px, 5svh, 48px)' }} />

      {/* 버튼 시트 */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="w-full px-6"
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

        </div>
      </motion.div>
    </div>
  );
}
