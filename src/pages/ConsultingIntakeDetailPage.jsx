import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import SiteHeader from '../components/SiteHeader';
import { useAuth } from '../context/AuthContext';
import { ensureGuestSessionId } from '../lib/storage';
import {
  getConsentItems,
  getConsultingResponseText,
  getFitPicCount,
} from '../lib/consultingIntake';

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

function formatDateTime(ts) {
  const d = new Date(ts);
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ConsultingIntakeDetailPage() {
  const navigate = useNavigate();
  const { intakeId } = useParams();
  const { session } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/consulting-intake-detail?id=${encodeURIComponent(intakeId)}`, {
      headers: {
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        'x-guest-session-id': ensureGuestSessionId(),
      },
    })
      .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (!ok || !data?.item) {
          setError('저장된 답변을 불러오지 못했습니다.');
          return;
        }
        setItem(data.item);
      })
      .catch(() => {
        if (!cancelled) setError('저장된 답변을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [intakeId, session?.access_token]);

  const answers = Array.isArray(item?.answers) ? item.answers : [];
  const fitPics = Array.isArray(item?.fit_pics) ? item.fit_pics : [];
  const consentItems = getConsentItems(item?.consents);

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

        <div className="flex-1 flex flex-col py-8">
          <p className="text-xs tracking-[0.28em] text-stone-400 uppercase mb-5">03 VISUAL CONSULTING</p>
          <h1
            className="text-2xl font-light text-stone-900 leading-tight mb-3"
            style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}
          >
            내가 남긴 컨설팅 답변
          </h1>

          {loading ? (
            <p className="text-sm text-stone-400">불러오는 중...</p>
          ) : error ? (
            <div className="border border-stone-200 px-4 py-5">
              <p className="text-sm text-stone-500 leading-relaxed mb-4">{error}</p>
              <button
                onClick={() => navigate('/mypage')}
                className="text-xs tracking-widest text-stone-900 uppercase border-b border-stone-900 pb-px"
              >
                마이페이지로 돌아가기
              </button>
            </div>
          ) : (
            <>
              <div className="border border-stone-200 px-4 py-4 mb-6">
                <p className="text-xs tracking-widest text-stone-400 uppercase mb-2">Submitted</p>
                <p className="text-sm text-stone-700">{formatDateTime(item.created_at)}</p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-stone-500">
                  <div>
                    <p className="tracking-widest text-stone-300 uppercase mb-1">Fit Pics</p>
                    <p>{getFitPicCount(fitPics)}장</p>
                  </div>
                  <div>
                    <p className="tracking-widest text-stone-300 uppercase mb-1">Consent</p>
                    <p>{consentItems.length ? `${consentItems.length}개 동의` : '없음'}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {answers.map((answer) => (
                  <div key={answer.id} className="border-b border-stone-200 pb-4">
                    <p
                      className="text-base font-light text-stone-900 leading-snug mb-2"
                      style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.01em' }}
                    >
                      {answer.question}
                    </p>
                    <p className="text-sm text-stone-500 leading-relaxed whitespace-pre-wrap">
                      {getConsultingResponseText(answer)}
                    </p>
                  </div>
                ))}
              </div>

              {fitPics.length > 0 && (
                <div className="mt-8 border-t border-stone-200 pt-6">
                  <p className="text-xs tracking-widest text-stone-400 uppercase mb-3">첨부한 사진</p>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {fitPics.map((pic, index) => (
                      <div key={`${pic?.path || pic?.name || index}`} className="border border-stone-200 p-2">
                        <div className="aspect-[3/4] bg-stone-50 overflow-hidden flex items-center justify-center mb-2">
                          {pic?.signedUrl ? (
                            <img
                              src={pic.signedUrl}
                              alt={pic?.name || `사진 ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <p className="text-[10px] text-stone-300">미리보기 없음</p>
                          )}
                        </div>
                        <p className="text-xs text-stone-500 break-all">
                          {pic?.name || pic?.path || `사진 ${index + 1}`}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-2">
                    {fitPics.map((pic, index) => (
                      <a
                        key={`link-${pic?.path || pic?.name || index}`}
                        href={pic?.signedUrl || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className={`text-sm break-all ${pic?.signedUrl ? 'text-stone-500 hover:text-stone-900 transition-colors' : 'text-stone-300 pointer-events-none'}`}
                      >
                        {pic?.name || pic?.path || `사진 ${index + 1}`}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {consentItems.length > 0 && (
                <div className="mt-8 border-t border-stone-200 pt-6">
                  <p className="text-xs tracking-widest text-stone-400 uppercase mb-3">동의 항목</p>
                  <div className="flex flex-col gap-2">
                    {consentItems.map((itemText) => (
                      <p key={itemText} className="text-sm text-stone-500">{itemText}</p>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
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
