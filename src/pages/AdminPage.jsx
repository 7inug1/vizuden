import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import SiteHeader from '../components/SiteHeader';
import { useAuth } from '../context/AuthContext';
import { isAdminUser } from '../lib/admin';

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

function StatCard({ label, value }) {
  return (
    <div className="border border-stone-200 px-4 py-4">
      <p className="text-xs tracking-widest text-stone-400 uppercase mb-2">{label}</p>
      <p
        className="text-2xl font-light text-stone-900"
        style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}
      >
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function FeedbackList({ rows }) {
  return (
    <div className="border border-stone-200 px-4 py-4">
      <p className="text-xs tracking-widest text-stone-400 uppercase mb-4">Recent Feedback</p>
      <div className="flex flex-col gap-3">
        {rows.length === 0 ? (
          <p className="text-sm text-stone-400">기록이 없습니다.</p>
        ) : rows.map((row) => (
          <div key={row.id} className="border-b border-stone-100 pb-3 last:border-b-0 last:pb-0">
            <p
              className="text-sm text-stone-800 leading-relaxed"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {row.message}
            </p>
            <p className="text-xs text-stone-400 mt-1">
              {row.page_type || 'unknown'} · {row.category || 'uncategorized'} · {formatDateTime(row.created_at)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AccountBoard({ rows, onRowClick }) {
  return (
    <div className="border border-stone-200 px-4 py-4">
      <p className="text-xs tracking-widest text-stone-400 uppercase mb-4">Accounts</p>
      <div className="flex flex-col gap-4">
        {rows.length === 0 ? (
          <p className="text-sm text-stone-400">계정 데이터가 없습니다.</p>
        ) : rows.map((row) => {
          const clickable = !!(row.typeCode || row.latestReportId || row.latestConsultingIntakeId);
          return (
            <div
              key={row.userId}
              className={`border-b border-stone-100 pb-4 last:border-b-0 last:pb-0 ${clickable ? 'cursor-pointer' : ''}`}
              onClick={() => clickable && onRowClick(row)}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm text-stone-900">{row.displayName || '이름 없음'}</p>
                  <p className="text-xs text-stone-400 break-all">{row.email || row.userId}</p>
                </div>
                {clickable && (
                  <span className="text-[10px] text-stone-300 tracking-widest uppercase shrink-0 mt-0.5">
                    보기 →
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                <div>
                  <p className="text-stone-300 uppercase tracking-widest mb-1">Type</p>
                  <p className="text-stone-600">{row.typeCode || '없음'}{row.typeCount ? ` · ${row.typeCount}건` : ''}</p>
                </div>
                <div>
                  <p className="text-stone-300 uppercase tracking-widest mb-1">Prescription</p>
                  <p className="text-stone-600">{row.prescriptionCount ? `${row.prescriptionCount}건` : '없음'}</p>
                </div>
                <div>
                  <p className="text-stone-300 uppercase tracking-widest mb-1">Consulting</p>
                  <p className="text-stone-600">
                    {row.consultingCount ? `${row.consultingCount}건` : '없음'}
                    {row.latestConsultingStatus ? ` · ${row.latestConsultingStatus}` : ''}
                  </p>
                </div>
                <div>
                  <p className="text-stone-300 uppercase tracking-widest mb-1">Feedback</p>
                  <p className="text-stone-600">{row.feedbackCount ? `${row.feedbackCount}건` : '없음'}</p>
                </div>
              </div>
              {row.recentActivityAt && (
                <p className="text-xs text-stone-400 mt-3">
                  최근 활동 · {formatDateTime(row.recentActivityAt)}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatDateTime(ts) {
  const d = new Date(ts);
  return d.toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminPage() {
  const navigate = useNavigate();
  const { user, session, loading } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !session?.access_token || !isAdminUser(user.id)) return;

    let cancelled = false;
    fetch('/api/admin-summary', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })
      .then((response) => response.json().then((body) => ({ ok: response.ok, body })))
      .then(({ ok, body }) => {
        if (cancelled) return;
        if (!ok) {
          setError(body?.error || '불러오지 못했습니다.');
          return;
        }
        setData(body);
      })
      .catch(() => {
        if (!cancelled) setError('불러오지 못했습니다.');
      });

    return () => {
      cancelled = true;
    };
  }, [session?.access_token, user?.id]);

  if (!loading && (!user || !isAdminUser(user.id))) {
    return <Navigate to="/home" replace />;
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
        <SiteHeader onLogoClick={() => navigate('/home')} />

        <div className="flex-1 flex flex-col py-8 gap-6">
          <div>
            <p className="text-xs tracking-[0.28em] text-stone-400 uppercase mb-5">Admin</p>
            <h1
              className="text-2xl font-light text-stone-900 leading-tight"
              style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}
            >
              운영 대시보드
            </h1>
          </div>

          {!data && !error && (
            <p className="text-sm text-stone-400">불러오는 중...</p>
          )}

          {error && (
            <div className="border border-stone-200 px-4 py-4">
              <p className="text-sm text-stone-500">{error}</p>
            </div>
          )}

          {data && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Reports" value={data.counts.reports ?? 0} />
                <StatCard label="Type" value={data.counts.typeCompletions ?? 0} />
                <StatCard label="Consulting" value={data.counts.consultingIntakes ?? 0} />
                <StatCard label="Feedback" value={data.counts.feedback ?? 0} />
              </div>

              <div className="border border-stone-200 px-4 py-4">
                <p className="text-xs tracking-widest text-stone-400 uppercase mb-4">Consulting Status</p>
                <div className="flex flex-col gap-2">
                  {Object.entries(data.statusCounts || {}).length === 0 ? (
                    <p className="text-sm text-stone-400">상태 데이터가 없습니다.</p>
                  ) : Object.entries(data.statusCounts).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between text-sm text-stone-600">
                      <span>{status}</span>
                      <span className="tabular-nums">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <AccountBoard
                rows={data.accounts || []}
                onRowClick={(row) => navigate(`/admin/user/${row.userId}`, { state: { row } })}
              />

              <FeedbackList rows={data.recent.feedback} />
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
