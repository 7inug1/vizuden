import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import SiteHeader from '../components/SiteHeader';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35 }}
      className="min-h-screen flex flex-col items-center px-6"
      style={{ backgroundColor: '#F5F2ED' }}
    >
      <div className="w-full max-w-sm flex flex-col" style={{ minHeight: '100svh' }}>
        <SiteHeader onLogoClick={() => navigate('/home')} />

        <div className="flex-1 flex flex-col justify-center py-8">
          <p className="text-xs tracking-widest text-stone-400 uppercase mb-6">404</p>
          <h1
            className="text-2xl font-light text-stone-900 leading-snug mb-4"
            style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}
          >
            페이지를 찾을 수<br />없습니다
          </h1>
          <p className="text-sm text-stone-500 leading-relaxed mb-10">
            주소가 잘못됐거나 삭제된 페이지입니다.
          </p>
          <button
            onClick={() => navigate('/home')}
            className="w-full py-4 bg-stone-900 text-stone-50 text-xs tracking-widest uppercase"
          >
            홈으로
          </button>
        </div>

        <div className="text-center py-8">
          <p className="text-xs text-stone-400 tracking-widest uppercase">
            &copy; {new Date().getFullYear()} VIZUDEN
          </p>
        </div>
      </div>
    </motion.div>
  );
}
