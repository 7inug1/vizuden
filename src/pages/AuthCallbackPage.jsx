import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { consumePostAuthRedirect, isSupabaseConfigured } = useAuth();
  const [message, setMessage] = useState('로그인 정보를 확인하고 있습니다...');

  useEffect(() => {
    async function resolveAuth() {
      if (!isSupabaseConfigured || !supabase) {
        setMessage('Supabase 인증 설정이 없어 홈으로 이동합니다.');
        setTimeout(() => navigate('/home', { replace: true }), 800);
        return;
      }

      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');

      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }

      // AuthContext가 세션 변경을 반영하기 전에 보호 라우트가 먼저 돌면 /auth로 튕길 수 있다.
      // 실제 세션이 잡힐 때까지 짧게 대기한 뒤 이동한다.
      let resolvedSession = null;
      for (let i = 0; i < 10; i += 1) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          resolvedSession = data.session;
          break;
        }
        await new Promise((resolve) => window.setTimeout(resolve, 120));
      }

      if (!resolvedSession) {
        setMessage('로그인 확인에 시간이 조금 더 필요합니다. 다시 시도해주세요.');
        setTimeout(() => navigate('/auth', { replace: true }), 1200);
        return;
      }

      const redirect = consumePostAuthRedirect() || '/home';
      navigate(redirect, { replace: true });
    }

    resolveAuth();
  }, [consumePostAuthRedirect, isSupabaseConfigured, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: '#F5F2ED' }}>
      <div className="w-full max-w-sm text-center">
        <p className="text-xs tracking-[0.28em] text-stone-400 uppercase mb-4">Auth</p>
        <p className="text-sm text-stone-500 leading-relaxed">{message}</p>
      </div>
    </div>
  );
}
