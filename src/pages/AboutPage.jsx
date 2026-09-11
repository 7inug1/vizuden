import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader';

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.35 }}
      className="min-h-screen flex flex-col items-center px-6"
      style={{ backgroundColor: '#F5F2ED' }}
    >
      <div className="w-full max-w-sm flex flex-col" style={{ minHeight: '100svh' }}>
        <SiteHeader onLogoClick={() => navigate('/')} />

        <div className="flex-1 flex flex-col justify-center items-center py-10">
          <p className="text-xs tracking-[0.28em] text-stone-400 uppercase mb-10">About</p>
          <div className="text-left">
            {/* 브랜드 매니페스토 — 히어로 */}
            <h1 className="text-[28px] leading-[1.35] font-semibold text-stone-900 mb-9 tracking-[-0.02em]">
              가장 나다운 스타일은<br />당신 안에서 시작됩니다.
            </h1>
            <p className="text-[16px] text-stone-500 leading-[1.8] tracking-[-0.02em] mb-6">
              우리는 스타일이 <br />유행이 아니라,<br />
              사람을 이해하는 <br />것에서 출발해야 한다고 믿습니다.
            </p>
            <p className="text-[16px] text-stone-500 leading-[1.8] tracking-[-0.02em] mb-6">
              커리어,<br />
              라이프스타일,<br />
              가치관,<br />
              그리고 추구미까지.
            </p>
            <p className="text-[16px] text-stone-800 leading-[1.8] tracking-[-0.02em]">
              당신의 스토리를<br />당신의 스타일로 번역합니다.
            </p>
          </div>
        </div>

        <div className="text-center py-8">
          <p
            className="text-xs text-stone-400 uppercase"
            style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", letterSpacing: '0.04em' }}
          >
            &copy; {new Date().getFullYear()} VIZUDEN
          </p>
        </div>
      </div>
    </motion.div>
  );
}
