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
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setMessage('로그인 확인에 실패했습니다.');
          setTimeout(() => navigate('/auth', { replace: true }), 1200);
          return;
        }
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

