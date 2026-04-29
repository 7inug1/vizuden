import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import SiteHeader from '../components/SiteHeader';
import { readPrescriptionSaved } from '../lib/prescriptionStorage';

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // verifying | error

  useEffect(() => {
    const paymentKey = searchParams.get('paymentKey');
    const orderId = searchParams.get('orderId');
    const amount = Number(searchParams.get('amount'));

    if (!paymentKey || !orderId || !amount) {
      setStatus('error');
      return;
    }

    fetch('/api/payment-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    })
      .then((r) => r.json())
      .then(({ free, full, error }) => {
        if (error || !full) { setStatus('error'); return; }

        // reportId는 orderId에서 파싱 (기존 prefix 포함 호환)
        const reportId = orderId.split('_')[1];
        const fromType = readPrescriptionSaved()?.fromType ?? null;

        // full 데이터는 state로만 전달 (localStorage 저장 안 함)
        navigate(`/prescription/result/${reportId}`, {
          replace: true,
          state: { fromType, free, full, reportId, isPaid: true },
        });
      })
      .catch(() => setStatus('error'));
  }, []);

  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center px-6" style={{ backgroundColor: '#F5F2ED' }}>
        <div className="w-full max-w-sm flex flex-col" style={{ minHeight: '100svh' }}>
          <SiteHeader onLogoClick={() => navigate('/home')} />
          <div className="flex-1 flex flex-col justify-center py-8">
            <p className="text-xs tracking-widest text-stone-400 uppercase mb-6">결제 오류</p>
            <h2 className="text-2xl font-light text-stone-900 leading-snug mb-4"
              style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}>
              결제 확인에<br />실패했습니다
            </h2>
            <p className="text-sm text-stone-500 leading-relaxed mb-10">
              결제는 완료됐을 수 있습니다.<br />고객센터로 문의해주세요.
            </p>
            <button onClick={() => {
              const saved = readPrescriptionSaved();
              if (saved?.reportId) { navigate(`/prescription/result/${saved.reportId}`, { replace: true }); return; }
              navigate('/home', { replace: true });
            }}
              className="w-full py-4 bg-stone-900 text-stone-50 text-xs tracking-widest uppercase">
              돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: '#F5F2ED' }}
    >
      <p className="text-xs tracking-widest text-stone-400 uppercase mb-4">결제 확인 중</p>
      <p className="text-sm text-stone-500">잠시만 기다려주세요...</p>
    </motion.div>
  );
}
