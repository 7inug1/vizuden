import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getAuthCallbackUrl } from '../lib/authRedirect';

export default function AuthEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSupabaseConfigured, signInWithMagicLink, setPostAuthRedirect, user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const nextPath = location.state?.nextPath || '/home';
  const callbackUrl = getAuthCallbackUrl();

  useEffect(() => {
    if (!loading && user) {
      navigate('/home', { replace: true });
    }
  }, [loading, navigate, user]);

  async function handleMagicLink() {
    if (!email.trim()) return;
    try {
      setSending(true);
      setMessage('');
      setError('');
      setPostAuthRedirect(nextPath);
      await signInWithMagicLink(email.trim(), callbackUrl);
      setMessage('로그인 링크를 이메일로 보냈습니다. 메일함을 확인해주세요.');
    } catch (nextError) {
      setError(nextError.message || '이메일 로그인 링크 발송에 실패했습니다.');
    } finally {
      setSending(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      className="min-h-svh flex flex-col"
      style={{ backgroundColor: '#F5F2ED' }}
    >
      {/* 헤더 — AuthPage와 동일 */}
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-center pb-8"
        style={{ paddingTop: '8px' }}
      >
        <button
          onClick={() => navigate('/auth', { state: { nextPath } })}
          className="text-3xl tracking-[0.18em] text-stone-900 font-medium hover:text-stone-400 transition-colors duration-200"
        >
          VIZUDEN
        </button>
      </motion.header>

      {/* 콘텐츠 */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="flex-1 flex flex-col justify-center px-6 pb-16"
      >
        <div className="mx-auto w-full max-w-sm">
          <button
            onClick={() => navigate('/auth', { state: { nextPath } })}
            className="text-[11px] tracking-[0.2em] text-stone-400 uppercase mb-8 hover:text-stone-700 transition-colors duration-150"
          >
            ← 돌아가기
          </button>

          <h1
            className="text-2xl font-light text-stone-900 leading-snug mb-2"
            style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}
          >
            이메일로 시작하기
          </h1>
          <p className="text-sm text-stone-500 leading-relaxed mb-8">
            입력한 이메일로 로그인 링크를 보내드립니다.
          </p>

          <div className="flex flex-col gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleMagicLink()}
              placeholder="이메일을 입력해주세요"
              className="w-full bg-transparent border-b border-stone-300 pb-3 text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-900 transition-colors duration-150"
            />

            <button
              onClick={handleMagicLink}
              disabled={!isSupabaseConfigured || !email.trim() || sending}
              className="w-full py-4 rounded-xl bg-stone-900 text-stone-50 text-sm tracking-wider disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 active:scale-[0.98] hover:bg-stone-800"
              style={{ boxShadow: '0 2px 16px 0 rgba(0,0,0,0.13)' }}
            >
              {sending ? '보내는 중...' : '이메일 링크 받기'}
            </button>
          </div>

          {!isSupabaseConfigured && (
            <p className="text-xs text-stone-400 mt-5 leading-relaxed">
              인증 환경변수 설정 후 이메일 로그인이 활성화됩니다.
            </p>
          )}
          {message && <p className="text-xs text-stone-500 mt-5 leading-relaxed">{message}</p>}
          {error && <p className="text-xs text-red-400 mt-3 leading-relaxed">{error}</p>}
        </div>
      </motion.div>
    </motion.div>
  );
}
