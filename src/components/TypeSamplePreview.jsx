import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { types } from '../data/types';
import { typeImages } from '../data/typeImages';

const SAMPLE_CODES = ['ICMT', 'IDMT', 'RCET', 'RDEN'];
const SAMPLE_META = {
  ICMT: { prompt: '이거 너무 난데? 싶어지는 타입' },
  IDMT: { prompt: '너가 보기에도 나 이 타입 같아?' },
  RCET: { prompt: '이 결과 보내면 친구가 먼저 물어볼 것 같은 타입' },
  RDEN: { prompt: '"너는 뭐 나올 것 같아?" 하고 보내기 딱 좋은 타입' },
};

export default function TypeSamplePreview({ className = '' }) {
  const sampleCodes = useMemo(
    () => SAMPLE_CODES.filter((code) => types[code] && typeImages[code]),
    []
  );
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (sampleCodes.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % sampleCodes.length);
    }, 3200);
    return () => window.clearInterval(timer);
  }, [sampleCodes.length]);

  if (!sampleCodes.length) return null;

  const activeCode = sampleCodes[activeIndex];
  const sample = types[activeCode];
  const sampleImage = typeImages[activeCode];
  const sampleMeta = SAMPLE_META[activeCode] ?? { prompt: '너는 뭐 나올 것 같아?' };

  return (
    <div className={`border border-stone-200 bg-stone-50 px-5 py-4 ${className}`}>
      <p className="text-[11px] tracking-[0.22em] text-stone-400 uppercase mb-3">Sample Result</p>

      <div className="relative min-h-[136px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCode}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="absolute inset-0 flex items-center gap-4"
          >
            <img
              src={sampleImage}
              alt={sample.nameKo}
              className="w-16 h-[100px] object-contain shrink-0"
              style={{ transform: 'translateY(-5px)' }}
            />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-mono text-stone-400 tracking-[0.2em] mb-1.5">{activeCode}</p>
              <p
                className="text-[15px] font-light text-stone-900 leading-snug mb-2"
                style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}
              >
                {sample.nameKo}
              </p>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                {sample.keywords?.slice(0, 3).join(' · ')}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={activeCode + '-prompt'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="mt-3 pt-3 border-t border-stone-200 text-xs text-stone-600 leading-relaxed"
          style={{ letterSpacing: '-0.01em' }}
        >
          {sampleMeta.prompt}
        </motion.p>
      </AnimatePresence>

      {sampleCodes.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {sampleCodes.map((code, idx) => (
            <span
              key={code}
              className="block h-1 rounded-full transition-all duration-300"
              style={{
                width: idx === activeIndex ? 16 : 5,
                backgroundColor: idx === activeIndex ? '#1c1917' : '#d6d3d1',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
