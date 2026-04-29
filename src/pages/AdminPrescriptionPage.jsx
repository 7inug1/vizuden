import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navigate } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader';
import { useAuth } from '../context/AuthContext';
import { isAdminUser } from '../lib/admin';

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

function getAnswerText(answer) {
  if (!answer) return '—';
  if (typeof answer.answer === 'string' && answer.answer.trim()) return answer.answer;
  if (Array.isArray(answer.selected) && answer.selected.length) {
    return answer.selected.join(', ') + (answer.other ? ` / 기타: ${answer.other}` : '');
  }
  return '—';
}

export default function AdminPrescriptionPage() {
  const navigate = useNavigate();
  const { reportId } = useParams();
  const { user, session, loading } = useAuth();
  const [data, setData] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!reportId) return;
    let cancelled = false;

    fetch(`/api/prescription-full?reportId=${encodeURIComponent(reportId)}`, {
      headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
    })
      .then((r) => r.json().then((body) => ({ ok: r.ok, body })))
      .then(({ ok, body }) => {
        if (cancelled) return;
        if (!ok) { setError('불러오지 못했습니다.'); return; }
        setData(body);
      })
      .catch(() => { if (!cancelled) setError('불러오지 못했습니다.'); })
      .finally(() => { if (!cancelled) setFetching(false); });

    return () => { cancelled = true; };
  }, [reportId, session?.access_token]);

  if (!loading && (!user || !isAdminUser(user.id))) {
    return <Navigate to="/home" replace />;
  }

  const answers = Array.isArray(data?.answers) ? data.answers : [];

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
        <SiteHeader onLogoClick={() => navigate(-1)} />

        <div className="flex-1 flex flex-col py-8">
          <p className="text-xs tracking-[0.28em] text-stone-400 uppercase mb-5">Admin · Prescription</p>
          <div className="flex items-start justify-between gap-4 mb-8">
            <h1
              className="text-2xl font-light text-stone-900 leading-tight"
              style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}
            >
              {data?.title || '처방전 답변'}
            </h1>
            {data && (
              <button
                onClick={() => navigate(`/prescription/result/${reportId}`)}
                className="shrink-0 text-xs text-stone-400 tracking-widest uppercase border-b border-stone-200 pb-px hover:text-stone-700 hover:border-stone-500 transition-colors duration-150 mt-1"
              >
                결과 보기 →
              </button>
            )}
          </div>

          {fetching && <p className="text-sm text-stone-400">불러오는 중...</p>}
          {error && <p className="text-sm text-stone-500">{error}</p>}

          {!fetching && !error && answers.length === 0 && (
            <p className="text-sm text-stone-400">저장된 답변이 없습니다.</p>
          )}

          {answers.length > 0 && (
            <div className="flex flex-col gap-4">
              {answers.map((answer, i) => (
                <div key={answer.id || i} className="border-b border-stone-200 pb-4">
                  <p
                    className="text-base font-light text-stone-900 leading-snug mb-2"
                    style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.01em' }}
                  >
                    {answer.question}
                  </p>
                  <p className="text-sm text-stone-500 leading-relaxed whitespace-pre-wrap">
                    {getAnswerText(answer)}
                  </p>
                </div>
              ))}
            </div>
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
