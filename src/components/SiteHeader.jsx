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
  { label: '홈',        path: '/home' },
  { label: '서비스',    path: '/services' },
  { label: '마이페이지', path: '/mypage' },
  { label: 'About',    path: '/about' },
];

function Drawer({ open, onClose, authLabel, onAuthAction }) {
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
            <p className="text-2xl tracking-[0.18em] text-stone-900 font-medium mb-12">
              VIZUDEN
            </p>

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

            {/* 닫기 */}
            <button
              onClick={onClose}
              className="mt-auto text-xs text-stone-400 tracking-widest uppercase
                hover:text-stone-700 transition-colors duration-150 text-left"
            >
              닫기
            </button>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}

// 전 페이지 공용 상단 헤더
// onLogoClick: 로고 클릭 시 커스텀 동작 (없으면 기본 홈 이동)
export default function SiteHeader({ onLogoClick }) {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, isGuest, signOut } = useAuth();

  async function handleAuthAction() {
    if (user) {
      await signOut();
      navigate('/home');
      return;
    }
    navigate('/auth', { state: { nextPath: '/mypage' } });
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
        className="w-full relative flex items-center justify-center pb-8"
        style={{
          position: 'sticky',
          top: 'var(--notice-bar-height, 0px)',
          zIndex: 40,
          backgroundColor: '#F5F2ED',
          paddingTop: '8px',
          boxShadow: '0 -8px 0 0 #F5F2ED',
        }}
      >
        {/* 햄버거 — 좌측 */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="absolute left-0 text-stone-900 hover:text-stone-400 transition-colors duration-200"
          aria-label="메뉴 열기"
        >
          <HamburgerIcon open={false} />
        </button>

        {/* 로고 — 중앙 */}
        <button
          onClick={handleLogoClick}
          className="text-3xl tracking-[0.18em] text-stone-900
            hover:text-stone-400 transition-colors duration-200 font-medium"
        >
          VIZUDEN
        </button>

        {/* 프로필 — 우측 */}
        <button
          onClick={() => navigate('/mypage')}
          className="absolute right-0 text-stone-900 hover:text-stone-400 transition-colors duration-200"
          aria-label="마이페이지"
        >
          <PersonIcon />
        </button>
      </header>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        authLabel={user ? '로그아웃' : isGuest ? '로그인 / 회원가입' : '로그인 / 회원가입'}
        onAuthAction={handleAuthAction}
      />
    </>
  );
}
