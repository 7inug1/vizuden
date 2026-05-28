import { motion } from 'framer-motion';

export default function RecommendBadge() {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{ position: 'absolute', top: '-12px', right: '12px', zIndex: 1 }}
    >
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center',
          padding: '3px 10px', border: '1px solid #1c1917',
          backgroundColor: '#F5F2ED', borderRadius: '999px',
          fontSize: '10px', letterSpacing: '0.08em', color: '#1c1917', whiteSpace: 'nowrap',
        }}>추천</div>

        {/*
          말꼬리: SVG로 상단 선 없이 좌우만 그림.
          fill이 pill 하단 border(1px)를 덮어 seam 완전 제거.
          bottom:-6px → SVG top이 pill outer-bottom에 딱 맞음.
          overflow:visible로 y=-1(pill 내부 1px) 커버.
        */}
        <svg
          width="10" height="6"
          viewBox="0 0 10 6"
          style={{
            position: 'absolute',
            bottom: '-6px',
            right: '16px',
            display: 'block',
            overflow: 'visible',
          }}
        >
          <path d="M-0.5,-1 L10.5,-1 L5,6 Z" fill="#F5F2ED" />
          <line x1="0" y1="-1" x2="5" y2="6" stroke="#1c1917" strokeWidth="1" />
          <line x1="10" y1="-1" x2="5" y2="6" stroke="#1c1917" strokeWidth="1" />
        </svg>
      </div>
    </motion.div>
  );
}
