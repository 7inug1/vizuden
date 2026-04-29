import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import SiteHeader from '../components/SiteHeader';
import TypeSamplePreview from '../components/TypeSamplePreview';
import PrescriptionSampleCard from '../components/PrescriptionSampleCard';
import ConsultingBeforeAfterCard from '../components/ConsultingBeforeAfterCard';
import { StepLine, StepNumber } from '../components/ServiceStepChrome';
import { types } from '../data/types';
import { useReportStatus } from '../hooks/useReportStatus';

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

function RecommendBadge() {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{ position: 'absolute', top: '-12px', right: '12px', zIndex: 1 }}
    >
      <div style={{
        display: 'inline-flex', alignItems: 'center',
        padding: '3px 10px', border: '1px solid #1c1917',
        backgroundColor: '#F5F2ED', borderRadius: '999px',
        fontSize: '10px', letterSpacing: '0.08em', color: '#1c1917', whiteSpace: 'nowrap',
      }}>
        추천
      </div>
      <div style={{
        position: 'absolute', bottom: '-6px', right: '20px',
        width: 0, height: 0,
        borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
        borderTop: '6px solid #1c1917',
      }} />
      <div style={{
        position: 'absolute', bottom: '-4px', right: '21px',
        width: 0, height: 0,
        borderLeft: '4px solid transparent', borderRight: '4px solid transparent',
        borderTop: '5px solid #F5F2ED',
      }} />
    </motion.div>
  );
}

export default function ServicesPage() {
  const navigate = useNavigate();
  const [prevType, setPrevType] = useState(null);
  const [typeCount, setTypeCount] = useState(null);
  const { prescription } = useReportStatus();

  useEffect(() => {
    fetch('/api/type-count')
      .then((r) => r.json())
      .then((d) => { if (typeof d.count === 'number') setTypeCount(d.count); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    try {
      const t = JSON.parse(localStorage.getItem('vizuden_type'));
      if (t?.code && types[t.code]) setPrevType(t);
    } catch {}
  }, []);

  const recommend = !prevType
    ? 'type'
    : !prescription.done
      ? 'prescription'
      : 'consulting';

  const typeDone = !!prevType;
  const prescriptionLocked = !prevType;
  const consultingLocked = !prescription.done;

  const typeStatus = typeDone ? 'done' : recommend === 'type' ? 'active' : 'locked';
  const prescriptionStatus = prescription.done ? 'done' : recommend === 'prescription' ? 'active' : 'locked';
  const consultingStatus = recommend === 'consulting' ? 'active' : 'locked';

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
      className="min-h-screen flex flex-col items-center px-6"
      style={{ backgroundColor: '#F5F2ED' }}
    >
      <div className="w-full max-w-sm flex flex-col" style={{ minHeight: '100svh' }}>
        <SiteHeader onLogoClick={() => navigate('/home')} />

        <div className="flex-1 flex flex-col py-10">

          {/* 01 TYPE */}
          <div className="flex gap-5">
            <div className="flex flex-col items-center" style={{ width: 24 }}>
              <StepNumber n="01" status={typeStatus} />
              <StepLine locked={prescriptionLocked} />
            </div>
            <div className="flex-1 pb-10" style={{ paddingTop: 2 }}>
              <p className="text-xs tracking-[0.28em] text-stone-400 uppercase mb-5">STYLE TYPE</p>
              <h2
                className="text-2xl font-light text-stone-900 leading-tight mb-3"
                style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}
              >
                스타일 유형 테스트
              </h2>
              <p className="text-sm text-stone-500 leading-relaxed mb-6" style={{ marginTop: '-0.5rem' }}>
                16가지 유형 중 지금의 나를 가리키는 유형을 찾습니다.
              </p>
              <TypeSamplePreview className="mb-6" />
              <div className="relative">
                {recommend === 'type' && <RecommendBadge />}
                <button
                  onClick={() => navigate('/type/questions', { state: { source: 'services' } })}
                  className="w-full py-4 bg-stone-900 text-stone-50 text-sm tracking-widest uppercase
                    hover:bg-stone-800 active:bg-stone-700 transition-colors duration-200"
                >
                  유형 진단하기
                </button>
              </div>
              {typeCount !== null && typeCount >= 10 && (
                <p className="text-xs text-stone-400 tracking-wide text-center mt-3">
                  지금까지 <span className="text-stone-600">{typeCount.toLocaleString()}명</span>이 진단했습니다
                </p>
              )}
              {prevType && (
                <button
                  onClick={() => navigate(`/type/result/${prevType.code}`, { state: { fromHistory: true } })}
                  className="w-full mt-2 py-2 text-xs text-stone-400 tracking-wider
                    hover:text-stone-700 transition-colors duration-150 text-center"
                >
                  이전 결과 보기 — {prevType.code} {types[prevType.code]?.nameKo}
                </button>
              )}
            </div>
          </div>

          {/* 02 PRESCRIPTION */}
          <div className="flex gap-5">
            <div className="flex flex-col items-center" style={{ width: 24 }}>
              <StepNumber n="02" status={prescriptionStatus} />
              <StepLine locked={consultingLocked} />
            </div>
            <div className="flex-1 pb-10" style={{ paddingTop: 2 }}>
              <p className="text-xs tracking-[0.28em] text-stone-400 uppercase mb-5">STYLE PRESCRIPTION</p>
              <h2
                className="text-2xl font-light text-stone-900 leading-tight mb-3"
                style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}
              >
                스타일 처방전
              </h2>
              <p className="text-sm text-stone-500 leading-relaxed mb-6" style={{ marginTop: '-0.5rem' }}>
                어떤 옷이 나답고, 어떻게 입어야 할지 기준을 정리합니다.
              </p>
              <PrescriptionSampleCard className="mb-6" />
              <div className="relative">
                {recommend === 'prescription' && <RecommendBadge />}
                <button
                  onClick={() => navigate(prescription.done && prescription.reportId ? `/prescription/result/${prescription.reportId}` : '/prescription')}
                  className="w-full py-4 bg-stone-900 text-stone-50 text-sm tracking-widest uppercase
                    hover:bg-stone-800 active:bg-stone-700 transition-colors duration-200"
                >
                  {prescription.done ? '이전 보고서 보기' : '처방전 만들기'}
                </button>
              </div>
            </div>
          </div>

          {/* 03 CONSULTING */}
          <div className="flex gap-5">
            <div className="flex flex-col items-center" style={{ width: 24 }}>
              <StepNumber n="03" status={consultingStatus} />
            </div>
            <div className="flex-1" style={{ paddingTop: 2 }}>
              <p className="text-xs tracking-[0.28em] text-stone-400 uppercase mb-5">VISUAL CONSULTING</p>
              <h2
                className="text-2xl font-light text-stone-900 leading-tight mb-3"
                style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}
              >
                비주얼 컨설팅
              </h2>
              <p className="text-sm text-stone-500 leading-relaxed mb-6" style={{ marginTop: '-0.5rem' }}>
                스타일 처방전에서 찾은 기준을 바탕으로, 옷장 진단부터 쇼핑과 코디 실행까지 1:1로 함께합니다.
              </p>
              <ConsultingBeforeAfterCard className="mb-6" />
              <div className="relative">
                {recommend === 'consulting' && <RecommendBadge />}
                <button
                  onClick={() => !consultingLocked && navigate('/consulting/questions')}
                  disabled={consultingLocked}
                  className="w-full py-4 text-sm tracking-widest uppercase transition-colors duration-200
                    disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed
                    enabled:bg-stone-900 enabled:text-stone-50 enabled:hover:bg-stone-800 enabled:active:bg-stone-700"
                >
                  {consultingLocked ? '처방전 완료 후 신청 가능' : '신청하기'}
                </button>
              </div>
            </div>
          </div>

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
