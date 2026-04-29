import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import SiteHeader from '../components/SiteHeader';
import { useAuth } from '../context/AuthContext';
import { isAdminUser } from '../lib/admin';
import { Navigate } from 'react-router-dom';

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

function formatDateTime(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleString('ko-KR', {
    month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function ResultCard({ label, available, onClick, meta }) {
  return (
    <div
      className={`border border-stone-200 px-4 py-4 ${available ? 'cursor-pointer hover:border-stone-400 transition-colors duration-150' : 'opacity-40'}`}
      onClick={available ? onClick : undefined}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs tracking-widest text-stone-400 uppercase">{label}</p>
        {available && <span className="text-xs text-stone-400">보기 →</span>}
      </div>
      {meta && (
        <p className="text-sm text-stone-600 mt-2 leading-snug">{meta}</p>
      )}
      {!available && (
        <p className="text-xs text-stone-400 mt-2">없음</p>
      )}
    </div>
  );
}

export default function AdminUserPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = useParams();
  const { user, loading } = useAuth();

  const row = location.state?.row ?? null;

  if (!loading && (!user || !isAdminUser(user.id))) {
    return <Navigate to="/home" replace />;
  }

  if (!row) {
    return <Navigate to="/admin" replace />;
  }

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
        <SiteHeader onLogoClick={() => navigate('/admin')} />

        <div className="flex-1 flex flex-col py-8 gap-6">
          <div>
            <p className="text-xs tracking-[0.28em] text-stone-400 uppercase mb-5">Admin · User</p>
            <h1
              className="text-2xl font-light text-stone-900 leading-tight mb-1"
              style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}
            >
              {row.displayName || '이름 없음'}
            </h1>
            <p className="text-sm text-stone-400 break-all">{row.email || userId}</p>
            {row.recentActivityAt && (
              <p className="text-xs text-stone-300 mt-2">
                최근 활동 · {formatDateTime(row.recentActivityAt)}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <ResultCard
              label="01 Type Result"
              available={!!row.typeCode}
              meta={row.typeCode ? `${row.typeCode}${row.typeCount > 1 ? ` · ${row.typeCount}건` : ''}` : null}
              onClick={() => navigate(`/type/result/${row.typeCode}`)}
            />
            <ResultCard
              label="02 Style Prescription"
              available={!!row.latestReportId}
              meta={row.latestPrescriptionTitle || (row.latestReportId ? '처방전 있음' : null)}
              onClick={() => navigate(`/admin/prescription/${row.latestReportId}`)}
            />
            <ResultCard
              label="03 Consulting Intake"
              available={!!row.latestConsultingIntakeId}
              meta={row.latestConsultingStatus || (row.latestConsultingIntakeId ? '신청 있음' : null)}
              onClick={() => navigate(`/consulting/intakes/${row.latestConsultingIntakeId}`)}
            />
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
