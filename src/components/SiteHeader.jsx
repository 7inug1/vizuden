import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

function PersonIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function HamburgerIcon({ open }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      {open ? (
        <>
          <line x1="4" y1="4" x2="20" y2="20" />
          <line x1="20" y1="4" x2="4" y2="20" />
        </>
      ) : (
        <>
          <line x1="3" y1="7" x2="21" y2="7" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="17" x2="21" y2="17" />
        </>
      )}
    </svg>
  );
}

const NAV_ITEMS = [
  { label: '홈',        path: '/' },
  { label: '마이페이지', path: '/mypage' },
  { label: 'About',    path: '/about' },
];

function Drawer({ open, onClose, authLabel, onAuthAction, userEmail }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  function handleNav(path) {
    onClose();
    navigate(path);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Dim overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(28,25,23,0.4)' }}
            onClick={onClose}
          />

          {/* Drawer panel */}
          <motion.nav
            key="drawer"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.28, ease: [0.32, 0, 0.18, 1] }}
            className="fixed top-0 left-0 h-full z-50 flex flex-col px-8 pt-12 pb-10"
            style={{ width: '72vw', maxWidth: '280px', backgroundColor: '#F5F2ED' }}
          >
            {/* 로고 */}
            <button
              onClick={() => handleNav('/')}
              className="text-2xl text-stone-900 font-bold mb-12 text-left hover:text-stone-400 transition-colors duration-150"
              style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", letterSpacing: '0.04em' }}
            >
              VIZUDEN
            </button>

            {/* 메뉴 항목 */}
            <div className="flex flex-col">
              {NAV_ITEMS.map(({ label, path }) => {
                const active = location.pathname === path;
                return (
                  <button
                    key={path}
                    onClick={() => handleNav(path)}
                    className="text-left py-2 text-sm tracking-wider transition-colors duration-150"
                    style={{
                      color: active ? '#1c1917' : '#a8a29e',
                      borderBottom: active ? '1px solid #1c1917' : '1px solid transparent',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                onClose();
                onAuthAction();
              }}
              className="text-left py-3 mt-6 text-sm tracking-wider text-stone-500 hover:text-stone-900 transition-colors duration-150"
            >
              {authLabel}
            </button>

            {/* 이메일 */}
            {userEmail ? (
              <p className="mt-auto text-[11px] text-stone-600 tracking-wide truncate">{userEmail}</p>
            ) : null}
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}

// 전 페이지 공용 상단 헤더
// onLogoClick: 로고 클릭 시 커스텀 동작 (없으면 기본 홈 이동)
// subtitle: 로고 아래 작은 텍스트 (랜딩 전용)
export default function SiteHeader({ onLogoClick, subtitle }) {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, isGuest, signOut } = useAuth();

  async function handleAuthAction() {
    if (user) {
      await signOut();
      navigate('/');
      return;
    }
    navigate('/auth/email', { state: { nextPath: '/mypage' } });
  }

  function handleLogoClick() {
    if (onLogoClick) {
      onLogoClick();
    } else {
      navigate('/');
    }
  }

  return (
    <>
      <header
        className="w-full grid items-center px-2"
        style={{
          gridTemplateColumns: '1fr auto 1fr',
          position: 'sticky',
          // 노티스바와 1px 겹쳐 서브픽셀 이음새(미세 간격) 제거
          top: 'calc(var(--notice-bar-height, 0px) - 1px)',
          zIndex: 40,
          backgroundColor: '#F5F2ED',
          paddingTop: '14px',
          paddingBottom: '28px',
          boxShadow: '0 -10px 0 0 #F5F2ED',
        }}
      >
        {/* 햄버거 메뉴 — 좌측 */}
        <div className="flex justify-start">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="메뉴 열기"
            className="flex items-center justify-center text-stone-600 hover:text-stone-900 transition-colors"
            style={{ height: 30, width: 34 }}
          >
            <HamburgerIcon open={false} />
          </button>
        </div>

        {/* 로고 — 중앙 */}
        <button
          onClick={handleLogoClick}
          className="flex flex-col items-center hover:opacity-60 transition-opacity duration-200"
        >
          <span
            className="text-3xl text-stone-900 font-bold leading-none"
            style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", letterSpacing: '0.04em' }}
          >
            VIZUDEN
          </span>
          {subtitle && (
            <span className="mt-0.5 text-[9px] font-light text-stone-400 tracking-[0.24em]">
              {subtitle}
            </span>
          )}
        </button>

        {/* 마이페이지 — 우측 */}
        <div className="flex justify-end">
          <button
            onClick={() => navigate('/mypage')}
            aria-label="마이페이지"
            className="flex items-center justify-center text-stone-600 hover:text-stone-900 transition-colors"
            style={{ height: 30, width: 34 }}
          >
            <PersonIcon />
          </button>
        </div>

      </header>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        authLabel={user ? '로그아웃' : '로그인'}
        onAuthAction={handleAuthAction}
        userEmail={user?.email ?? null}
      />
    </>
  );
}
