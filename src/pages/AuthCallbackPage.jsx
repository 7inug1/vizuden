import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { consumePostAuthRedirect, isSupabaseConfigured, user, loading } = useAuth();
  const [timedOut, setTimedOut] = useState(false);
  const redirectPathRef = useRef(null);
  const didNavigateRef = useRef(false);

  // redirect path를 마운트 시점에 한 번만 소비
  useEffect(() => {
    redirectPathRef.current = consumePostAuthRedirect() || '/home';
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // AuthContext에 user가 세팅되면 이동 — ProtectedRoute 타이밍 문제 방지
  useEffect(() => {
    if (!loading && user && !didNavigateRef.current) {
      didNavigateRef.current = true;
      navigate(redirectPathRef.current || '/home', { replace: true });
    }
  }, [loading, user, navigate]);

  // OAuth code exchange
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      navigate('/home', { replace: true });
      return;
    }

    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    if (code) {
      supabase.auth.exchangeCodeForSession(code).catch(() => {});
    }

    // 10초 안에 로그인 안 되면 실패 처리
    const timer = setTimeout(() => setTimedOut(true), 10000);
    return () => clearTimeout(timer);
  }, [isSupabaseConfigured, navigate]);

  // 타임아웃 시 /auth로 이동
  useEffect(() => {
    if (timedOut && !didNavigateRef.current) {
      didNavigateRef.current = true;
      navigate('/auth', { replace: true });
    }
  }, [timedOut, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: '#F5F2ED' }}>
      <div className="w-full max-w-sm text-center">
        <p className="text-xs tracking-[0.28em] text-stone-400 uppercase mb-4">Auth</p>
        <p className="text-sm text-stone-500 leading-relaxed">
          {timedOut ? '로그인 확인에 실패했습니다. 다시 시도해주세요.' : '로그인 정보를 확인하고 있습니다...'}
        </p>
      </div>
    </div>
  );
}
