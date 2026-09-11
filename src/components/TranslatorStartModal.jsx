import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

/** "스타일 번역서" 를 눌렀을 때 나오는 두 갈래.
 *
 *  설문은 25문항·5분이 든다. 그걸 시작하기 전에 결과물이 어떤지 볼 수 있어야
 *  한다. 두 길을 같은 크기로 나란히 두어 "먼저 볼 수 있다"가 부차적으로
 *  보이지 않게 한다.
 */
const SAMPLE_FACES = ['IDMT', 'RDMT', 'ICMT', 'ICMN'];

export default function TranslatorStartModal({ onClose }) {
  const navigate = useNavigate();
  const go = (path) => { onClose?.(); navigate(path); };

  return (
    <motion.div
      key="translator-start"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0"
      style={{ backgroundColor: 'rgba(28,24,20,0.42)', backdropFilter: 'blur(3px)' }}
    >
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 24, opacity: 0 }}
        transition={{ duration: 0.22 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl p-5"
        style={{ backgroundColor: '#F5F2ED', boxShadow: '0 12px 40px rgba(0,0,0,0.25)' }}
      >
        <p className="text-[10px] tracking-[0.22em] uppercase mb-1" style={{ color: 'rgba(58,48,40,0.45)' }}>
          Style Translator
        </p>
        <h2 className="text-[17px] font-medium mb-4" style={{ color: '#2A241E', letterSpacing: '-0.01em' }}>
          어떻게 시작할까요?
        </h2>

        {/* ① 먼저 보기 */}
        <button
          onClick={() => go('/translator/samples')}
          className="w-full px-4 py-4 rounded-2xl flex items-center gap-3 mb-2.5
                     transition-all duration-150 active:scale-[0.98]"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2DACE' }}
        >
          <div className="flex shrink-0 items-center">
            {SAMPLE_FACES.map((code, i) => (
              <img
                key={code}
                src={`/characters/${code}.png`}
                alt=""
                className="w-8 h-8 object-contain rounded-full"
                style={{
                  backgroundColor: '#F5F2ED',
                  border: '1.5px solid #FFFFFF',
                  marginLeft: i === 0 ? 0 : -10,
                  zIndex: 4 - i,
                }}
              />
            ))}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[14px] font-medium" style={{ color: '#2A241E' }}>샘플 번역서 보기</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(58,48,40,0.5)' }}>
              어떤 결과가 나오는지 먼저 확인
            </p>
          </div>
          <span className="shrink-0 text-[15px]" style={{ color: 'rgba(58,48,40,0.35)' }}>→</span>
        </button>

        {/* ② 바로 시작 */}
        <button
          onClick={() => go('/translator/questions')}
          className="w-full px-4 py-4 rounded-2xl flex items-center gap-3
                     transition-all duration-150 active:scale-[0.98]"
          style={{ backgroundColor: '#3A3028', border: '1px solid #4A3E35' }}
        >
          <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
               style={{ backgroundColor: 'rgba(245,240,235,0.12)' }}>
            <span className="text-[14px]" style={{ color: '#F5F0EB' }}>✎</span>
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[14px] font-medium" style={{ color: '#F5F0EB' }}>내 번역서 만들기</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(240,235,228,0.6)' }}>
              25개 질문 · 약 5분
            </p>
          </div>
          <span className="shrink-0 text-[15px]" style={{ color: 'rgba(240,235,228,0.45)' }}>→</span>
        </button>

        <button
          onClick={onClose}
          className="w-full mt-3 py-2 text-[12.5px]"
          style={{ color: 'rgba(58,48,40,0.45)' }}
        >
          닫기
        </button>
      </motion.div>
    </motion.div>
  );
}
