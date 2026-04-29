import { useNavigate, useSearchParams } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader';
import { readPrescriptionSaved } from '../lib/prescriptionStorage';

export default function PaymentFailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const message = searchParams.get('message') || '결제가 취소됐거나 오류가 발생했습니다.';

  function handleBack() {
    const saved = readPrescriptionSaved();
    if (saved?.reportId) {
      navigate(`/prescription/result/${saved.reportId}`, { replace: true });
      return;
    }
    navigate('/home', { replace: true });
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-6" style={{ backgroundColor: '#F5F2ED' }}>
      <div className="w-full max-w-sm flex flex-col" style={{ minHeight: '100svh' }}>
        <SiteHeader onLogoClick={() => navigate('/home')} />
        <div className="flex-1 flex flex-col justify-center py-8">
          <p className="text-xs tracking-widest text-stone-400 uppercase mb-6">결제 실패</p>
          <h2 className="text-2xl font-light text-stone-900 leading-snug mb-4"
            style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}>
            결제가<br />완료되지 않았습니다
          </h2>
          <p className="text-sm text-stone-500 leading-relaxed mb-10">{message}</p>
          <button
            onClick={handleBack}
            className="w-full py-4 bg-stone-900 text-stone-50 text-xs tracking-widest uppercase"
          >
            보고서로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}
