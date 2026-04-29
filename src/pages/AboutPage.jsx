import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader';

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const SERVICES = [
  { num: '01', label: '스타일 유형 테스트', desc: '16가지 유형 중 지금의 나를 가리키는 유형을 찾습니다.' },
  { num: '02', label: '스타일 처방전', desc: '어떤 옷이 나답고, 어떻게 입어야 더 나아 보이는지 한 번에 정리합니다.' },
  { num: '03', label: '비주얼 컨설팅', desc: '스타일 처방전에서 찾은 기준을 바탕으로, 옷장 진단부터 쇼핑과 코디 실행까지 1:1로 함께합니다.' },
];

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
        <SiteHeader onLogoClick={() => navigate('/home')} />

        <div className="flex-1 flex flex-col py-10">
          <p className="text-xs tracking-[0.28em] text-stone-400 uppercase mb-10">About</p>

          {/* 도입 */}
          <p className="text-sm text-stone-600 leading-relaxed mb-6">
            우리는 매일 옷을 고르지만, 정작 자신이 어떤 사람인지는 잘 묻지 않습니다.
          </p>
          <p className="text-sm text-stone-600 leading-relaxed mb-6">
            미디어와 플랫폼은 쉼 없이 새 아이템을 보여줍니다. 우리는 그것을 보고 사고, 입어보고, 어색함을 느끼고, 다시 삽니다. 아무리 좋은 옷이라도 자신에 대한 이해 없이 고른 선택은 반복해서 실패합니다. 결국 소비는 늘지만 나만의 스타일과는 점점 멀어집니다.
          </p>

          <div className="border-t border-stone-200 my-8" />

          {/* 출발점 */}
          <p className="text-sm text-stone-600 leading-relaxed mb-6">
            VIZUDEN은 이 지점에서 시작했습니다.
          </p>
          <p className="text-sm text-stone-600 leading-relaxed mb-6">
            개인의 스타일은 소비에서 완성되지 않습니다. 나는 어떤 사람인가, 어떻게 보이고 싶은가에 대한 이해에서 시작합니다. VIZUDEN은 그 이해가 실제 옷차림과 선택 기준으로 이어지는 상태를 중요하게 봅니다.
          </p>

          <div className="border-t border-stone-200 my-8" />

          {/* 서비스 */}
          <p className="text-sm text-stone-600 leading-relaxed mb-8">
            그 과정을 세 단계로 설계했습니다.
          </p>

          <div className="flex flex-col gap-6 mb-8">
            {SERVICES.map(({ num, label, desc }) => (
              <div key={label} className="flex gap-5">
                <span className="shrink-0 text-xs text-stone-300 tracking-widest pt-0.5">{num}</span>
                <div>
                  <p className="text-xs tracking-widest text-stone-900 uppercase mb-1.5">{label}</p>
                  <p className="text-sm text-stone-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-stone-200 my-8" />

          {/* 마무리 */}
          <p className="text-sm text-stone-600 leading-relaxed">
            어떤 옷 앞에서도 '이건 나답다, 이건 아니다'를 스스로 판단할 수 있는 상태. 자신만의 스타일 기준을 찾지 못한 채 살아가는 사람은 없어야 한다고 생각합니다. VIZUDEN은 그 기준을 찾는 과정을 함께합니다.
          </p>
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
