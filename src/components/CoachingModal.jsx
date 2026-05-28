import { useEffect } from 'react';
import { motion } from 'framer-motion';

const FEATURES = [
  { icon: '💬', label: '온라인 컨설팅', desc: '카카오톡 기반 1:1 스타일 진단' },
  { icon: '🛍', label: '쇼핑', desc: '처방전 기반 실제 아이템 선별' },
  { icon: '👔', label: '코디 가이드', desc: '상황별 완성 코디 제안' },
  { icon: '📩', label: '커뮤니티 초대', desc: '애프터 케어 및 평생 커뮤니티 입장' },
];

export default function CoachingModal({ onClose, prescriptionDone = false, onNavigate }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ backgroundColor: 'rgba(28,25,23,0.5)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.22 }}
        className="w-full relative"
        style={{ maxWidth: 400, backgroundColor: '#F5F2ED', borderRadius: '20px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-5 text-stone-400 hover:text-stone-700 transition-colors duration-150"
          aria-label="닫기"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <line x1="4" y1="4" x2="20" y2="20" /><line x1="20" y1="4" x2="4" y2="20" />
          </svg>
        </button>

        <div className="px-6 pb-8 pt-6">
          <p className="text-[10px] tracking-[0.28em] uppercase mb-3 text-stone-400">
            1:1 STYLE COACHING
          </p>
          <h2
            className="text-[26px] font-medium leading-tight mb-2 text-stone-900"
            style={{ letterSpacing: '-0.02em' }}
          >
            1:1 스타일 코칭
          </h2>
          <p className="text-[14px] leading-relaxed mb-6 text-stone-500">
            옷장 진단부터 실제 쇼핑 코디 실행까지, 스타일 디렉터와 1:1로 함께합니다.
          </p>

          <div className="flex flex-col gap-3 mb-8">
            {FEATURES.map(({ icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <span className="text-[18px] mt-0.5">{icon}</span>
                <div>
                  <p className="text-[13px] font-medium text-stone-900">{label}</p>
                  <p className="text-[12px] mt-0.5 text-stone-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] leading-relaxed mb-4 text-stone-400">
            코칭 세션 신청 전 스타일 처방전이 선행돼야 합니다.
          </p>

          {prescriptionDone ? (
            <button
              disabled
              className="w-full py-4 rounded-2xl text-[14px] font-medium tracking-wide cursor-not-allowed"
              style={{ backgroundColor: '#e7e5e4', color: '#a8a29e' }}
            >
              준비 중
            </button>
          ) : (
            <button
              onClick={onNavigate}
              className="w-full py-4 rounded-2xl text-[14px] font-medium tracking-wide transition-all duration-150 active:scale-[0.98]"
              style={{ backgroundColor: '#1c1917', color: '#F5F2ED' }}
            >
              스타일 처방전 먼저 받기
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
