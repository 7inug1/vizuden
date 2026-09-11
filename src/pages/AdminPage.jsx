import { useEffect, useState, useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import SiteHeader from '../components/SiteHeader';
import { useAuth } from '../context/AuthContext';
import { isAdminUser } from '../lib/admin';
import { supabase } from '../lib/supabaseClient';
import { getConsultingStatusLabel } from '../lib/translatorIntake';

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const CONSULTING_STATUS_OPTIONS = [
  { value: 'submitted', label: getConsultingStatusLabel('submitted') },
  { value: 'contacted', label: getConsultingStatusLabel('contacted') },
  { value: 'scheduled', label: getConsultingStatusLabel('scheduled') },
  { value: 'completed', label: getConsultingStatusLabel('completed') },
  { value: 'cancelled', label: getConsultingStatusLabel('cancelled') },
];

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

function ReportButton({ intakeId, state, onGenerate }) {
  if (!intakeId) return null;
  const s = state || {};
  if (s.done) return (
    <a
      href={`/translator/report/${intakeId}`}
      target="_blank"
      rel="noreferrer"
      className="shrink-0 px-2.5 py-1 text-[10px] tracking-widest uppercase border transition-colors duration-150"
      style={{ borderColor: '#1c1917', color: '#1c1917', textDecoration: 'none' }}
      onClick={(e) => e.stopPropagation()}
    >
      보고서 보기 →
    </a>
  );
  return (
    <button
      type="button"
      disabled={s.loading}
      onClick={(e) => { e.stopPropagation(); onGenerate(intakeId); }}
      className="shrink-0 px-2.5 py-1 text-[10px] tracking-widest uppercase border transition-colors duration-150"
      style={{
        borderColor: s.error ? '#dc2626' : '#d6d3d1',
        color: s.error ? '#dc2626' : '#a8a29e',
        opacity: s.loading ? 0.5 : 1,
        cursor: s.loading ? 'not-allowed' : 'pointer',
        background: 'transparent',
      }}
    >
      {s.loading ? '생성 중…' : s.error ? '재시도' : '보고서 생성'}
    </button>
  );
}

function AccountBoard({ rows, onRowClick, onToggleUnlock, onStatusChange, onGenerateReport, reportStates }) {
  return (
    <div className="border border-stone-200 px-4 py-4">
      <p className="text-xs tracking-widest text-stone-400 uppercase mb-4">Accounts</p>
      <div className="flex flex-col gap-4">
        {rows.length === 0 ? (
          <p className="text-sm text-stone-400">계정 데이터가 없습니다.</p>
        ) : rows.map((row) => {
          const clickable = !!(row.typeCode || row.latestReportId || row.latestConsultingIntakeId);
          const canUnlockReview = row.latestConsultingStatus === 'completed';
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
                    {row.latestConsultingStatus ? ` · ${getConsultingStatusLabel(row.latestConsultingStatus)}` : ''}
                  </p>
                </div>
                <div>
                  <p className="text-stone-300 uppercase tracking-widest mb-1">Feedback</p>
                  <p className="text-stone-600">{row.feedbackCount ? `${row.feedbackCount}건` : '없음'}</p>
                </div>
              </div>
              {row.latestConsultingIntakeId && (
                <div
                  className="mt-3 flex flex-col gap-2 border-t border-stone-100 pt-3"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex items-center justify-between gap-2">
                    <select
                      value={row.latestConsultingStatus || 'submitted'}
                      onChange={(event) => onStatusChange(row.latestConsultingIntakeId, event.target.value)}
                      className="min-w-[126px] appearance-none rounded-none border border-stone-200 bg-stone-50 px-3 py-2 text-[11px] tracking-[0.08em] text-stone-700 focus:outline-none focus:border-stone-400"
                    >
                      {CONSULTING_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => onToggleUnlock(row.latestConsultingIntakeId, row.latestConsultingReviewUnlocked)}
                      disabled={!canUnlockReview}
                      className="shrink-0 px-2.5 py-1 text-[10px] tracking-widest uppercase border transition-colors duration-150"
                      style={{
                        backgroundColor: row.latestConsultingReviewUnlocked ? '#1c1917' : 'transparent',
                        color: row.latestConsultingReviewUnlocked ? '#fafaf9' : (canUnlockReview ? '#a8a29e' : '#d6d3d1'),
                        borderColor: row.latestConsultingReviewUnlocked ? '#1c1917' : '#d6d3d1',
                        opacity: canUnlockReview ? 1 : 0.55,
                        cursor: canUnlockReview ? 'pointer' : 'not-allowed',
                      }}
                    >
                      {row.latestConsultingReviewUnlocked ? '후기 열림' : '후기 열기'}
                    </button>
                  </div>
                  <div className="flex justify-end">
                    <ReportButton
                      intakeId={row.latestConsultingIntakeId}
                      state={reportStates?.[row.latestConsultingIntakeId]}
                      onGenerate={onGenerateReport}
                    />
                  </div>
                </div>
              )}
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

function GuestConsultingBoard({ rows, onToggleUnlock, onStatusChange, onGenerateReport, reportStates }) {
  return (
    <div className="border border-stone-200 px-4 py-4">
      <p className="text-xs tracking-widest text-stone-400 uppercase mb-4">Guest Consulting</p>
      <div className="flex flex-col gap-3">
        {rows.length === 0 ? (
          <p className="text-sm text-stone-400">게스트 컨설팅 신청이 없습니다.</p>
        ) : rows.map((row) => (
          <div key={row.id} className="border-b border-stone-100 pb-3 last:border-b-0 last:pb-0">
            {(() => {
              const canUnlockReview = (row.status || 'submitted') === 'completed';
              return (
            <>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-stone-700 break-all">
                  {row.guest_session_id ? `게스트 · ${row.guest_session_id.slice(0, 12)}` : '게스트'}
                </p>
                <p className="text-xs text-stone-400 mt-0.5">{formatDateTime(row.created_at)}</p>
                <div className="mt-2">
                  <select
                    value={row.status || 'submitted'}
                    onChange={(event) => onStatusChange(row.id, event.target.value)}
                    className="min-w-[112px] appearance-none rounded-none border border-stone-200 bg-stone-50 px-3 py-2 text-[11px] tracking-[0.08em] text-stone-700 focus:outline-none focus:border-stone-400"
                  >
                    {CONSULTING_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onToggleUnlock(row.id, row.review_unlocked)}
                disabled={!canUnlockReview}
                className="shrink-0 px-2.5 py-1 text-[10px] tracking-widest uppercase border transition-colors duration-150"
                style={{
                  backgroundColor: row.review_unlocked ? '#1c1917' : 'transparent',
                  color: row.review_unlocked ? '#fafaf9' : (canUnlockReview ? '#a8a29e' : '#d6d3d1'),
                  borderColor: row.review_unlocked ? '#1c1917' : '#d6d3d1',
                  opacity: canUnlockReview ? 1 : 0.55,
                  cursor: canUnlockReview ? 'pointer' : 'not-allowed',
                }}
              >
                {row.review_unlocked ? '후기 열림' : '후기 열기'}
              </button>
            </div>
            <div className="flex justify-end mt-2">
              <ReportButton
                intakeId={row.id}
                state={reportStates?.[row.id]}
                onGenerate={onGenerateReport}
              />
            </div>
            </>
              );
            })()}
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewBoard({ rows, onToggleApprove }) {
  return (
    <div className="border border-stone-200 px-4 py-4">
      <p className="text-xs tracking-widest text-stone-400 uppercase mb-4">Reviews</p>
      <div className="flex flex-col gap-4">
        {rows.length === 0 ? (
          <p className="text-sm text-stone-400">후기가 없습니다.</p>
        ) : rows.map((row) => (
          <div key={row.id} className="border-b border-stone-100 pb-4 last:border-b-0 last:pb-0">
            {(row.before_image_url || row.after_image_url) && (
              <div className="flex gap-1.5 mb-2">
                {row.before_image_url && (
                  <div className="flex-1 overflow-hidden" style={{ maxHeight: 80 }}>
                    <img src={row.before_image_url} alt="before" className="w-full h-full object-cover" />
                  </div>
                )}
                {row.after_image_url && (
                  <div className="flex-1 overflow-hidden" style={{ maxHeight: 80 }}>
                    <img src={row.after_image_url} alt="after" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            )}
            <p
              className="text-sm text-stone-700 leading-relaxed mb-1"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {row.text}
            </p>
            <div className="flex items-center justify-between mt-2 gap-2">
              <p className="text-xs text-stone-400">
                {row.reviewer_name || '익명'} · {formatDateTime(row.created_at)}
              </p>
              <button
                type="button"
                onClick={() => onToggleApprove(row.id, row.approved)}
                className="shrink-0 px-2.5 py-1 text-[10px] tracking-widest uppercase border transition-colors duration-150"
                style={{
                  backgroundColor: row.approved ? '#1c1917' : 'transparent',
                  color: row.approved ? '#fafaf9' : '#a8a29e',
                  borderColor: row.approved ? '#1c1917' : '#d6d3d1',
                }}
              >
                {row.approved ? '승인됨' : '승인'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const navigate = useNavigate();
  const { user, session, loading } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [intakes, setIntakes] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reportStates, setReportStates] = useState({}); // { [intakeId]: { loading, done, error } }

  async function handleGenerateReport(intakeId) {
    setReportStates((prev) => ({ ...prev, [intakeId]: { loading: true, done: false, error: null } }));
    try {
      const res = await fetch('/api/consulting-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ intakeId }),
      });
      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({}));
        throw new Error(msg || `HTTP ${res.status}`);
      }
      setReportStates((prev) => ({ ...prev, [intakeId]: { loading: false, done: true, error: null } }));
    } catch (err) {
      setReportStates((prev) => ({ ...prev, [intakeId]: { loading: false, done: false, error: err.message } }));
    }
  }

  const guestIntakes = useMemo(
    () => intakes.filter((row) => !row.user_id),
    [intakes]
  );

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

  useEffect(() => {
    if (!user || !isAdminUser(user.id) || !supabase) return;
    supabase
      .from('consulting_intakes')
      .select('id, created_at, user_id, guest_session_id, review_unlocked, status')
      .order('created_at', { ascending: false })
      .then(({ data: rows }) => { if (rows) setIntakes(rows); });
  }, [user?.id]);

  useEffect(() => {
    if (!user || !isAdminUser(user.id) || !supabase) return;
    supabase
      .from('reviews')
      .select('id, text, reviewer_name, before_image_url, after_image_url, approved, created_at')
      .order('created_at', { ascending: false })
      .then(({ data: rows }) => { if (rows) setReviews(rows); });
  }, [user?.id]);

  async function handleToggleUnlock(intakeId, current) {
    if (!supabase) return;
    const currentRow = intakes.find((row) => row.id === intakeId);
    const currentStatus = currentRow?.status || data?.accounts?.find((account) => account.latestConsultingIntakeId === intakeId)?.latestConsultingStatus;
    if (currentStatus !== 'completed') return;
    const { error: err } = await supabase
      .from('consulting_intakes')
      .update({ review_unlocked: !current })
      .eq('id', intakeId);
    if (!err) {
      setIntakes((prev) => prev.map((i) => i.id === intakeId ? { ...i, review_unlocked: !current } : i));
    }
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        accounts: (prev.accounts || []).map((account) => {
          if (account.latestConsultingIntakeId !== intakeId) return account;
          return {
            ...account,
            latestConsultingReviewUnlocked: !current,
          };
        }),
      };
    });
  }

  async function handleStatusChange(intakeId, nextStatus) {
    if (!supabase) return;
    const currentRow = intakes.find((row) => row.id === intakeId);
    const shouldLockReview = nextStatus !== 'completed';
    const { error: err } = await supabase
      .from('consulting_intakes')
      .update(shouldLockReview ? { status: nextStatus, review_unlocked: false } : { status: nextStatus })
      .eq('id', intakeId);
    if (!err) {
      setIntakes((prev) => prev.map((i) => i.id === intakeId ? {
        ...i,
        status: nextStatus,
        review_unlocked: shouldLockReview ? false : i.review_unlocked,
      } : i));
    }
    setData((prev) => {
      if (!prev) return prev;
      const nextRows = (prev.accounts || []).map((account) => {
        if (account.latestConsultingIntakeId !== intakeId) return account;
        return {
          ...account,
          latestConsultingStatus: nextStatus,
          latestConsultingReviewUnlocked: shouldLockReview ? false : account.latestConsultingReviewUnlocked,
        };
      });
      const nextStatusCounts = { ...(prev.statusCounts || {}) };
      const current = currentRow?.status || 'submitted';
      if (nextStatusCounts[current]) nextStatusCounts[current] -= 1;
      if (nextStatusCounts[current] <= 0) delete nextStatusCounts[current];
      nextStatusCounts[nextStatus] = (nextStatusCounts[nextStatus] || 0) + 1;
      return {
        ...prev,
        accounts: nextRows,
        statusCounts: nextStatusCounts,
      };
    });
  }

  async function handleToggleApprove(reviewId, current) {
    if (!supabase) return;
    const { error: err } = await supabase
      .from('reviews')
      .update({ approved: !current })
      .eq('id', reviewId);
    if (!err) {
      setReviews((prev) => prev.map((r) => r.id === reviewId ? { ...r, approved: !current } : r));
    }
  }

  if (!loading && (!user || !isAdminUser(user.id))) {
    return <Navigate to="/" replace />;
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
        <SiteHeader onLogoClick={() => navigate('/')} />

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
                      <span>{getConsultingStatusLabel(status)}</span>
                      <span className="tabular-nums">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <AccountBoard
                rows={data.accounts || []}
                onToggleUnlock={handleToggleUnlock}
                onStatusChange={handleStatusChange}
                onRowClick={(row) => navigate(`/admin/user/${row.userId}`, { state: { row } })}
                onGenerateReport={handleGenerateReport}
                reportStates={reportStates}
              />

              <GuestConsultingBoard
                rows={guestIntakes}
                onToggleUnlock={handleToggleUnlock}
                onStatusChange={handleStatusChange}
                onGenerateReport={handleGenerateReport}
                reportStates={reportStates}
              />

              <ReviewBoard
                rows={reviews}
                onToggleApprove={handleToggleApprove}
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
