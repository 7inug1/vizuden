import { useNavigate } from 'react-router-dom';
import SiteHeader from './SiteHeader';
import Footer from './Footer';

// 공용 에러 화면 — 상단 로고(홈), 메시지, (선택)재시도·이전·홈 버튼, 하단 copyright.
// 모든 페이지의 에러 상태를 일관되게 처리.
export default function ErrorScreen({
  eyebrow = 'Error',
  title = '문제가 발생했어요',
  message = '잠시 후 다시 시도해주세요.',
  onRetry,
  retryLabel = '다시 시도',
  showBack = true,
  showHome = true,
}) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center px-6" style={{ backgroundColor: '#F5F2ED' }}>
      <div className="w-full max-w-sm flex flex-col" style={{ minHeight: '100svh' }}>
        <SiteHeader onLogoClick={() => navigate('/')} />

        <div className="flex-1 flex flex-col justify-center py-8">
          <p className="text-xs tracking-widest text-stone-400 uppercase mb-6">{eyebrow}</p>
          <h1
            className="text-2xl font-light text-stone-900 leading-snug mb-4"
            style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}
          >
            {title}
          </h1>
          {message && <p className="text-sm text-stone-500 leading-relaxed mb-10">{message}</p>}

          <div className="flex flex-col gap-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="w-full py-4 bg-stone-900 text-stone-50 text-xs tracking-widest uppercase transition-opacity hover:opacity-90"
              >
                {retryLabel}
              </button>
            )}
            {showBack && (
              <button
                onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
                className={`w-full py-4 text-xs tracking-widest uppercase border transition-colors ${
                  onRetry
                    ? 'border-stone-300 text-stone-600 hover:border-stone-500'
                    : 'bg-stone-900 text-stone-50 border-stone-900 hover:opacity-90'
                }`}
              >
                이전으로
              </button>
            )}
            {showHome && (
              <button
                onClick={() => navigate('/')}
                className="w-full py-3 text-xs tracking-widest uppercase text-stone-400 hover:text-stone-700 transition-colors"
              >
                홈으로
              </button>
            )}
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
