import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SiteHeader from '../components/SiteHeader';
import ConsultingReviewModal from '../components/ConsultingReviewModal';
import RecommendBadge from '../components/RecommendBadge';
import CoachingModal from '../components/CoachingModal';
import { supabase } from '../lib/supabaseClient';
import { types } from '../data/types';
import { typeImages } from '../data/typeImages';
import { useAuth } from '../context/AuthContext';
import { useNickname } from '../context/NicknameContext';
import { WelcomeModal } from './HubPage';
import { STORAGE_KEYS, ensureGuestSessionId, getStoredBoolean, setStoredBoolean } from '../lib/storage';
import { readPrescriptionHistory, readPrescriptionSaved } from '../lib/prescriptionStorage';
import { getConsultingPreview } from '../lib/consultingIntake';
import { isAdminUser } from '../lib/admin';
import { useReportStatus } from '../hooks/useReportStatus';

const PAGE_SIZE = 5;
const COACHING_CHARS = ['ICMT', 'RDMT', 'RCET', 'IDET'];

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

// 닉네임: 한글·영문·숫자·공백만 허용
function isValidNickname(val) {
  return /^[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9\s]*$/.test(val);
}

const GHOST_AVATAR_SRC = '/characters/ghost-outline.png';

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}


export default function MyPage() {
  const navigate = useNavigate();
  const { user, session, isGuest } = useAuth();
  const { nickname, setNickname } = useNickname();
  const { dbPrescriptions, dbTypeHistory } = useReportStatus();
  const [typeHistory, setTypeHistory] = useState([]);
  const [prescriptionHistory, setPrescriptionHistory] = useState([]);
  const [consultingHistory, setConsultingHistory] = useState([]);
  const [typePage, setTypePage] = useState(0);
  const [prescriptionPage, setPrescriptionPage] = useState(0);
  const [consultingPage, setConsultingPage] = useState(0);
  const [unlockedIntakeId, setUnlockedIntakeId] = useState(null);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [editingNick, setEditingNick] = useState(false);
  const [nickInput, setNickInput] = useState('');
  const [nickError, setNickError] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeName, setWelcomeName] = useState('');
  const [coachingCharIdx, setCoachingCharIdx] = useState(0);
  const [showCoachingModal, setShowCoachingModal] = useState(false);
  const nickRef = useRef(null);

  useEffect(() => {
    let localType = [];
    try {
      const raw = JSON.parse(localStorage.getItem('vizuden_type_history') || '[]');
      if (Array.isArray(raw) && raw.length > 0) {
        localType = raw.filter((e) => e?.code && types[e.code]);
      } else {
        const single = JSON.parse(localStorage.getItem('vizuden_type'));
        if (single?.code && types[single.code]) localType = [single];
      }
    } catch {}
    setTypeHistory(localType);

    let localPrescription = [];
    try {
      const rawPrescription = readPrescriptionHistory();
      if (Array.isArray(rawPrescription) && rawPrescription.length > 0) {
        localPrescription = rawPrescription.filter((entry) => entry?.reportId && entry?.savedAt);
      } else {
        const single = readPrescriptionSaved();
        if (single?.reportId && single?.savedAt) localPrescription = [single];
      }
    } catch {}
    setPrescriptionHistory(localPrescription);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setCoachingCharIdx(i => (i + 1) % COACHING_CHARS.length), 3000);
    return () => clearInterval(t);
  }, []);

  // DB 데이터로 병합 (로그인 사용자, 새 기기 대응)
  useEffect(() => {
    if (dbTypeHistory && dbTypeHistory.length > 0) {
      const dbEntries = dbTypeHistory
        .filter((r) => r.code && types[r.code])
        .map((r) => ({ code: r.code, savedAt: new Date(r.createdAt).getTime() }));
      setTypeHistory(dbEntries);
    }
  }, [dbTypeHistory]);

  useEffect(() => {
    if (!dbPrescriptions) return;
    const dbEntries = dbPrescriptions.map((r) => ({
      reportId: r.id,
      title: r.title,
      preview: r.preview,
      savedAt: new Date(r.createdAt).getTime(),
      fromType: null,
    }));
    if (dbEntries.length === 0) return;
    setPrescriptionHistory((prev) => {
      const dbIds = new Set(dbEntries.map((e) => e.reportId));
      const localOnly = prev.filter((e) => !dbIds.has(e.reportId));
      return [...dbEntries, ...localOnly].sort((a, b) => b.savedAt - a.savedAt);
    });
  }, [dbPrescriptions]);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/consulting-intakes', {
      headers: {
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        'x-guest-session-id': ensureGuestSessionId(),
      },
    })
      .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
      .then(({ ok, data }) => {
        if (!ok || cancelled) return;
        setConsultingHistory(Array.isArray(data?.items) ? data.items : []);
      })
      .catch(() => {
        if (!cancelled) setConsultingHistory([]);
      });

    return () => {
      cancelled = true;
    };
  }, [session?.access_token, user?.id]);

  useEffect(() => {
    if (!user || !supabase || consultingHistory.length === 0) return;
    const unlocked = consultingHistory.find((e) => e.review_unlocked && e.status === 'completed');
    if (!unlocked) return;
    setUnlockedIntakeId(unlocked.id);
    supabase
      .from('reviews')
      .select('id')
      .eq('user_id', user.id)
      .eq('service', 'consulting')
      .maybeSingle()
      .then(({ data }) => { if (data) setReviewSubmitted(true); });
  }, [consultingHistory, user?.id]);

  useEffect(() => {
    if (editingNick && nickRef.current) nickRef.current.focus();
  }, [editingNick]);

  function handleNickChange(e) {
    const val = e.target.value;
    if (!isValidNickname(val)) {
      setNickError('한글, 영문, 숫자만 사용할 수 있습니다');
      return;
    }
    setNickError('');
    setNickInput(val);
  }

  function handleNickSave() {
    const trimmed = nickInput.trim();
    if (nickError) return;
    if (trimmed) {
      setNickname(trimmed);
      const welcomeDone = getStoredBoolean(STORAGE_KEYS.welcomeDone);
      if (!welcomeDone) {
        setStoredBoolean(STORAGE_KEYS.welcomeDone, true);
        setWelcomeName(trimmed);
        setShowWelcome(true);
      }
    }
    setEditingNick(false);
    setNickError('');
  }

  function handleNickKeyDown(e) {
    if (e.key === 'Enter') handleNickSave();
    if (e.key === 'Escape') { setEditingNick(false); setNickError(''); }
  }

  function startEdit() {
    setNickInput(nickname);
    setNickError('');
    setEditingNick(true);
  }

  const latestType = typeHistory[0] ?? null;
  const latestTypeResult = latestType ? types[latestType.code] : null;

  const recommend = typeHistory.length === 0 ? 'type' : prescriptionHistory.length === 0 ? 'prescription' : 'consulting';

  const totalTypePages = Math.ceil(typeHistory.length / PAGE_SIZE);
  const pagedTypeHistory = typeHistory.slice(typePage * PAGE_SIZE, (typePage + 1) * PAGE_SIZE);

  const totalPrescriptionPages = Math.ceil(prescriptionHistory.length / PAGE_SIZE);
  const pagedPrescriptionHistory = prescriptionHistory.slice(prescriptionPage * PAGE_SIZE, (prescriptionPage + 1) * PAGE_SIZE);
  const totalConsultingPages = Math.ceil(consultingHistory.length / PAGE_SIZE);
  const pagedConsultingHistory = consultingHistory.slice(consultingPage * PAGE_SIZE, (consultingPage + 1) * PAGE_SIZE);
  function formatDateTime(ts) {
    const d = new Date(ts);
    return d.toLocaleString('ko-KR', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const activeCoachingCode = COACHING_CHARS[coachingCharIdx];
  const activeCoachingChar = typeImages[activeCoachingCode];

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

        <div className="flex flex-col py-4 pb-16">
          {user?.email && (
            <p className="text-xs text-stone-500 mb-4 text-center">{user.email}</p>
          )}

          {!user && (
            <div className="mb-6 rounded-2xl overflow-hidden" style={{ backgroundColor: '#EDEAE5', border: '1px solid #E0DCD6' }}>
              <div className="px-5 py-5">
                <p className="text-[10px] tracking-[0.28em] text-stone-400 uppercase mb-3">Guest Mode</p>
                <p className="text-sm text-stone-600 leading-relaxed mb-5">
                  지금 결과는 이 기기에만 저장돼요. 로그인하면 어디서든 이어볼 수 있어요.
                </p>
                <button
                  onClick={() => navigate('/auth/email', { state: { nextPath: '/mypage' } })}
                  className="w-full py-3 rounded-xl text-sm font-medium tracking-wide transition-all duration-150 active:scale-[0.98]"
                  style={{ backgroundColor: '#1C1917', color: '#F5F2ED' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2C2825'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#1C1917'}
                >
                  로그인하기
                </button>
              </div>
            </div>
          )}

          {/* 캐릭터 + 호칭 + 닉네임 */}
          <div className="flex flex-col items-center pt-4 pb-8">


            {/* 캐릭터 이미지 */}
            {latestTypeResult ? (
              <motion.img
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                src={typeImages[latestType.code]}
                alt={latestTypeResult.nameKo}
                className="w-32 h-40 object-contain"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <motion.img
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                src={GHOST_AVATAR_SRC}
                alt="avatar"
                className="w-32 h-40 object-contain select-none pointer-events-none"
                draggable={false}
              />
            )}

            {/* 닉네임 */}
            {editingNick ? (
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                  <input
                    ref={nickRef}
                    value={nickInput}
                    onChange={handleNickChange}
                    onKeyDown={handleNickKeyDown}
                    maxLength={20}
                    className="text-sm text-stone-900 text-center bg-transparent border-b border-stone-800 outline-none pb-0.5 w-32 tracking-wide"
                    placeholder="닉네임 입력"
                  />
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleNickSave}
                    className="text-stone-600 hover:text-stone-900 transition-colors"
                    aria-label="저장"
                  >
                    <CheckIcon />
                  </button>
                </div>
                {nickError && (
                  <p className="text-xs text-stone-400">{nickError}</p>
                )}
              </div>
            ) : (
              <button
                onClick={startEdit}
                className="flex items-center gap-1.5 text-stone-600 hover:text-stone-900 transition-colors"
              >
                <span className="text-sm tracking-wide text-stone-700">
                  {nickname || '닉네임 없음'}
                </span>
                <EditIcon />
              </button>
            )}
          </div>

          <div className="border-t border-stone-200" />

          {/* TYPE 섹션 */}
          <div className="py-7">
            <p className="text-base font-medium text-stone-800 tracking-tight mb-5">스타일 유형</p>

            {typeHistory.length > 0 ? (
              <>
                {/* 최근 결과 — 콤팩트 카드 */}
                <button
                  onClick={() => navigate(`/type/result/${typeHistory[0].code}`, { state: { fromHistory: true } })}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl border border-stone-200 bg-white mb-5 group hover:border-stone-300 transition-all duration-150 active:scale-[0.99]"
                  style={{ boxShadow: '0 1px 4px 0 rgba(0,0,0,0.05)' }}
                >
                  <div className="shrink-0 flex items-center justify-center" style={{ width: 36, height: 44 }}>
                    {(() => {
                      const c = typeHistory[0].code;
                      return (
                        <svg width="36" height="36" viewBox="0 0 42 42" fill="none">
                          <line x1="21" y1="19" x2="21" y2="16" stroke="#1c1917" strokeWidth="1.2" strokeLinecap="round" opacity="0.35"/>
                          <line x1="21" y1="23" x2="21" y2="26" stroke="#1c1917" strokeWidth="1.2" strokeLinecap="round" opacity="0.35"/>
                          <line x1="19" y1="21" x2="16" y2="21" stroke="#1c1917" strokeWidth="1.2" strokeLinecap="round" opacity="0.35"/>
                          <line x1="23" y1="21" x2="26" y2="21" stroke="#1c1917" strokeWidth="1.2" strokeLinecap="round" opacity="0.35"/>
                          <circle cx="21" cy="21" r="1.8" fill="#1c1917" opacity="0.5"/>
                          <text x="21" y="12" textAnchor="middle" fontSize="9" fontWeight="600" fill="#1c1917">{c[0]}</text>
                          <text x="33" y="21" textAnchor="middle" dominantBaseline="central" fontSize="9" fontWeight="600" fill="#1c1917">{c[1]}</text>
                          <text x="21" y="36" textAnchor="middle" fontSize="9" fontWeight="600" fill="#1c1917">{c[2]}</text>
                          <text x="9" y="21" textAnchor="middle" dominantBaseline="central" fontSize="9" fontWeight="600" fill="#1c1917">{c[3]}</text>
                        </svg>
                      );
                    })()}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-[10px] font-mono text-stone-400 tracking-widest">{typeHistory[0].code}</p>
                    <p className="text-[14px] font-medium text-stone-800 leading-snug mt-0.5">{types[typeHistory[0].code]?.nameKo}</p>
                    <p className="text-[11px] text-stone-400 mt-0.5">{formatDateTime(typeHistory[0].savedAt)}</p>
                  </div>
                </button>

              </>
            ) : (
              <>
                <p className="text-sm text-stone-500 leading-relaxed mb-1">아직 유형 테스트를 하지 않으셨어요.</p>
                <p className="text-sm text-stone-400 leading-relaxed mb-4">내 스타일 DNA가 어떤 유형인지 지금 확인해보세요.</p>
                <div className="relative">
                  {recommend === 'type' && <RecommendBadge />}
                <button
                  onClick={() => navigate('/type/questions', { state: { source: 'mypage' } })}
                  className="w-full px-5 py-4 rounded-3xl bg-white border border-stone-200 text-left transition-all duration-150 active:scale-[0.98] hover:border-stone-300 flex items-center gap-4"
                  style={{ boxShadow: '0 1px 8px 0 rgba(0,0,0,0.06)' }}
                >
                  <div className="shrink-0 flex items-center justify-center" style={{ width: 48, height: 56 }}>
                    <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
                      <line x1="21" y1="19" x2="21" y2="16" stroke="#1c1917" strokeWidth="1.2" strokeLinecap="round" opacity="0.35"/>
                      <line x1="21" y1="23" x2="21" y2="26" stroke="#1c1917" strokeWidth="1.2" strokeLinecap="round" opacity="0.35"/>
                      <line x1="19" y1="21" x2="16" y2="21" stroke="#1c1917" strokeWidth="1.2" strokeLinecap="round" opacity="0.35"/>
                      <line x1="23" y1="21" x2="26" y2="21" stroke="#1c1917" strokeWidth="1.2" strokeLinecap="round" opacity="0.35"/>
                      <circle cx="21" cy="21" r="1.8" fill="#1c1917" opacity="0.5"/>
                      <text x="21" y="12" textAnchor="middle" fontSize="9" fontWeight="600" fill="#1c1917" opacity="0.55">I</text>
                      <text x="21" y="36" textAnchor="middle" fontSize="9" fontWeight="600" fill="#1c1917" opacity="0.55">R</text>
                      <text x="33" y="21" textAnchor="middle" dominantBaseline="central" fontSize="9" fontWeight="600" fill="#1c1917" opacity="0.55">C</text>
                      <text x="9" y="21" textAnchor="middle" dominantBaseline="central" fontSize="9" fontWeight="600" fill="#1c1917" opacity="0.55">D</text>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] tracking-[0.22em] uppercase mb-1" style={{ color: 'rgba(28,25,23,0.3)' }}>STYLE TYPE</p>
                    <p className="text-[17px] font-medium tracking-tight text-stone-800 leading-snug">스타일 유형 테스트</p>
                    <p className="mt-1 text-[12px] text-stone-400 leading-relaxed">12문항 · 1분 소요</p>
                  </div>
                </button>
                </div>
              </>
            )}
          </div>

          <div className="border-t border-stone-200" />

          {/* PRESCRIPTION 섹션 */}
          <div className="py-7">
            <p className="text-base font-medium text-stone-800 tracking-tight mb-5">스타일 처방전</p>

            {prescriptionHistory.length > 0 ? (
              <>
                {/* 최근 처방전 — 콤팩트 카드 */}
                {(() => {
                  const latest = prescriptionHistory[0];
                  const latestTitle = latest.title || '스타일 처방전';
                  const latestPreview = latest.preview || latest.free?.insight || null;
                  return (
                    <button
                      onClick={() => navigate(`/prescription/result/${latest.reportId}`)}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl mb-5 group transition-all duration-150 active:scale-[0.99]"
                      style={{ backgroundColor: '#E8E2D9', border: '1px solid #DDD7CE', boxShadow: '0 1px 4px 0 rgba(0,0,0,0.05)' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#DDD6CB'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = '#E8E2D9'}
                    >
                      <div className="shrink-0 flex items-center justify-center" style={{ width: 36, height: 44 }}>
                        <div style={{ position: 'relative', width: 28, height: 36, borderRadius: 3 }}>
                          <div style={{ position: 'absolute', top: 2, left: 2, width: 26, height: 34, borderRadius: 3, backgroundColor: '#D6CEC4', border: '1px solid #C0B9AF' }} />
                          <div style={{ position: 'absolute', top: 0, left: 0, width: 26, height: 34, borderRadius: 3, backgroundColor: '#FAF8F5', border: '1px solid #D0C9BF', display: 'flex', flexDirection: 'column', padding: '4px 4px 3px', gap: 2.5 }}>
                            <div style={{ fontFamily: 'Georgia, serif', fontSize: 7, fontWeight: 600, color: '#6B5E52', letterSpacing: '0.04em', lineHeight: 1 }}>Rx</div>
                            {[100, 70, 85].map((w, i) => (
                              <div key={i} style={{ height: 1.5, borderRadius: 2, width: `${w}%`, backgroundColor: i === 0 ? '#8C7B6E' : '#C8C0B8' }} />
                            ))}
                            <div style={{ height: 1, backgroundColor: '#E0D9D2', marginTop: 0.5 }} />
                            {[60, 80].map((w, i) => (
                              <div key={i} style={{ height: 1.5, borderRadius: 2, width: `${w}%`, backgroundColor: '#C8C0B8' }} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-[14px] font-medium text-stone-800 leading-snug">{latestTitle}</p>
                        {latestPreview && (
                          <p className="text-[11px] mt-0.5 leading-relaxed"
                            style={{ color: '#8C8278', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {latestPreview}
                          </p>
                        )}
                        <p className="text-[11px] text-stone-400 mt-0.5">
                          {latest.fromType ? `${latest.fromType} · ` : ''}{formatDateTime(latest.savedAt)}
                        </p>
                      </div>
                    </button>
                  );
                })()}

                {/* 이전 기록 */}
                {prescriptionHistory.length > 1 && (
                  <div>
                    <p className="text-[10px] tracking-[0.24em] text-stone-300 uppercase mb-2">이전 기록</p>
                    <div className="flex flex-col">
                      {prescriptionHistory.slice(1, 5).map((entry) => {
                        const entryTitle = entry.title || '스타일 처방전';
                        const entryDate = formatDateTime(entry.savedAt);
                        return (
                          <button
                            key={entry.savedAt}
                            onClick={() => navigate(`/prescription/result/${entry.reportId}`)}
                            className="flex items-center justify-between py-3 px-2 rounded-xl border-b border-stone-100 text-left group transition-all duration-150"
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#EDE9E3'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                          >
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm font-light text-stone-700 leading-tight">{entryTitle}</span>
                              <span className="text-xs font-mono text-stone-400 tabular-nums">
                                {entry.fromType ? `${entry.fromType} · ` : ''}{entryDate}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="text-sm text-stone-500 leading-relaxed mb-1">처방전을 아직 받아보지 않으셨네요.</p>
                <p className="text-sm text-stone-400 leading-relaxed mb-4">내 커리어·라이프스타일·추구미를 분석한 AI 스타일 보고서를 받아보세요.</p>
                <div className="relative">
                  {recommend === 'prescription' && <RecommendBadge />}
                <button
                  onClick={() => navigate('/prescription')}
                  className="w-full px-5 py-4 rounded-3xl text-left transition-all duration-150 active:scale-[0.98] flex items-center gap-4"
                  style={{ backgroundColor: '#E8E2D9', border: '1px solid #DDD7CE', boxShadow: '0 1px 8px 0 rgba(0,0,0,0.05)' }}
                >
                  <div className="shrink-0 flex items-center justify-center" style={{ width: 48, height: 56 }}>
                    <div style={{ position: 'relative', width: 36, height: 46, borderRadius: 4 }}>
                      <div style={{ position: 'absolute', top: 3, left: 3, width: 33, height: 43, borderRadius: 4, backgroundColor: '#E0D9CF', border: '1px solid #C8BFB3' }} />
                      <div style={{ position: 'absolute', top: 0, left: 0, width: 33, height: 43, borderRadius: 4, backgroundColor: '#FAF8F5', border: '1px solid #D6CFC6', display: 'flex', flexDirection: 'column', padding: '5px 5px 4px', gap: 3 }}>
                        <div style={{ fontFamily: 'Georgia, serif', fontSize: 9, fontWeight: 600, color: '#6B5E52', letterSpacing: '0.04em', lineHeight: 1 }}>Rx</div>
                        {[100, 75, 85].map((w, i) => (
                          <div key={i} style={{ height: 2, borderRadius: 2, width: `${w}%`, backgroundColor: i === 0 ? '#8C7B6E' : '#C8C0B8' }} />
                        ))}
                        <div style={{ height: 1, backgroundColor: '#E0D9D2', marginTop: 1 }} />
                        {[65, 80].map((w, i) => (
                          <div key={i} style={{ height: 2, borderRadius: 2, width: `${w}%`, backgroundColor: '#C8C0B8' }} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] tracking-[0.22em] uppercase mb-1" style={{ color: 'rgba(28,25,23,0.3)' }}>AI STYLE REPORT</p>
                    <p className="text-[17px] font-medium tracking-tight text-stone-800 leading-snug">스타일 처방전</p>
                    <p className="mt-1 text-[12px] leading-relaxed" style={{ color: '#8C8278' }}>스타일 진단 AI 보고서 · 약 5분 소요</p>
                  </div>
                </button>
                </div>
              </>
            )}
          </div>

          <div className="border-t border-stone-200" />

          {/* CONSULTING 섹션 */}
          <div className="py-7">
            <p className="text-base font-medium text-stone-800 tracking-tight mb-5">1:1 스타일 코칭</p>

            {consultingHistory.length > 0 ? (
              <>
                {/* 최근 신청 — 콤팩트 카드 */}
                {(() => {
                  const latest = consultingHistory[0];
                  const latestDate = formatDateTime(latest.created_at);
                  const latestPreview = getConsultingPreview(latest.answers);
                  return (
                    <button
                      onClick={() => navigate(`/consulting/intakes/${latest.id}`)}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl mb-5 group transition-all duration-150 active:scale-[0.99]"
                      style={{ backgroundColor: '#26211D', border: '1px solid #3A332D', boxShadow: '0 2px 12px 0 rgba(0,0,0,0.18)' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2E2721'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = '#26211D'}
                    >
                      <div className="shrink-0 flex items-center justify-center overflow-hidden" style={{ width: 36, height: 44 }}>
                        <AnimatePresence mode="wait">
                          <motion.img
                            key={activeCoachingCode}
                            src={activeCoachingChar}
                            alt=""
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                            className="object-contain object-bottom"
                            style={{ height: 44, width: 36 }}
                          />
                        </AnimatePresence>
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-[14px] font-medium leading-snug" style={{ color: '#F0EBE4' }}>1:1 스타일 코칭</p>
                        {latestPreview && (
                          <p className="text-[11px] mt-0.5 leading-relaxed"
                            style={{ color: 'rgba(240,235,228,0.45)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {latestPreview}
                          </p>
                        )}
                        <p className="text-[11px] mt-0.5" style={{ color: 'rgba(240,235,228,0.35)' }}>{latestDate}</p>
                      </div>
                    </button>
                  );
                })()}

                {/* 이전 기록 */}
                {consultingHistory.length > 1 && (
                  <div>
                    <p className="text-[10px] tracking-[0.24em] text-stone-300 uppercase mb-2">이전 기록</p>
                    <div className="flex flex-col">
                      {consultingHistory.slice(1, 5).map((entry) => {
                        const entryDate = formatDateTime(entry.created_at);
                        const entryPreview = getConsultingPreview(entry.answers);
                        return (
                          <button
                            key={entry.id}
                            onClick={() => navigate(`/consulting/intakes/${entry.id}`)}
                            className="flex items-center justify-between py-3 px-2 rounded-xl border-b border-stone-100 text-left group transition-all duration-150"
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#EDE9E3'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                          >
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm font-light text-stone-700 leading-tight">1:1 스타일 코칭 신청</span>
                              <span className="text-xs font-mono text-stone-400 tabular-nums">
                                {entryPreview ? `${entryPreview.slice(0, 20)}… · ` : ''}{entryDate}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {unlockedIntakeId && (
                  <div className="mt-5">
                    {reviewSubmitted ? (
                      <p className="text-xs text-stone-400 tracking-wide">후기를 보내주셨습니다. 감사합니다.</p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowReviewModal(true)}
                        className="text-xs tracking-widest text-stone-900 uppercase border-b border-stone-900 pb-px hover:text-stone-500 hover:border-stone-500 transition-colors"
                      >
                        후기 남기기 →
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="text-sm text-stone-500 leading-relaxed mb-1">아직 코칭을 신청하지 않으셨어요.</p>
                <p className="text-sm text-stone-400 leading-relaxed mb-4">나에게 맞는 스타일 방향을 전문가와 함께 잡아보세요.</p>
                <div className="relative">
                  {recommend === 'consulting' && <RecommendBadge />}
                <button
                  onClick={() => setShowCoachingModal(true)}
                  className="w-full px-5 py-4 rounded-3xl text-left transition-all duration-150 active:scale-[0.98] flex items-center gap-4"
                  style={{ backgroundColor: '#26211D', border: '1px solid #3A332D', boxShadow: '0 2px 16px 0 rgba(0,0,0,0.22)' }}
                >
                  <div className="shrink-0 flex items-center justify-center overflow-hidden" style={{ width: 48, height: 56 }}>
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={activeCoachingCode}
                        src={activeCoachingChar}
                        alt=""
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="object-contain object-bottom"
                        style={{ height: 56, width: 48 }}
                      />
                    </AnimatePresence>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] tracking-[0.22em] uppercase mb-1" style={{ color: 'rgba(240,235,228,0.4)' }}>1:1 COACHING</p>
                    <p className="text-[17px] font-medium tracking-tight leading-snug" style={{ color: '#F0EBE4' }}>1:1 스타일 코칭</p>
                    <p className="mt-1 text-[12px] leading-relaxed" style={{ color: 'rgba(240,235,228,0.45)' }}>남성 맞춤형 스타일 코칭</p>
                  </div>
                </button>
                </div>
              </>
            )}
          </div>

        </div>

        {user && isAdminUser(user.id) && (
          <div className="pb-6">
            <button
              onClick={() => navigate('/admin')}
              className="text-xs tracking-widest text-stone-900 uppercase border-b border-stone-900 pb-px hover:text-stone-500 hover:border-stone-500 transition-colors"
            >
              Admin →
            </button>
          </div>
        )}

        <div className="text-center py-8">
          <p className="text-xs text-stone-400 tracking-widest uppercase">
            &copy; {new Date().getFullYear()} VIZUDEN
          </p>
        </div>
      </div>

      <AnimatePresence>
        {showWelcome && (
          <WelcomeModal
            key="welcome"
            name={welcomeName}
            onClose={() => setShowWelcome(false)}
          />
        )}
        {showReviewModal && user && unlockedIntakeId && (
          <ConsultingReviewModal
            key="review"
            userId={user.id}
            intakeId={unlockedIntakeId}
            defaultName={nickname || user.user_metadata?.name || user.user_metadata?.full_name || ''}
            onClose={() => setShowReviewModal(false)}
            onSubmitted={() => {
              setReviewSubmitted(true);
              setShowReviewModal(false);
            }}
          />
        )}
        {showCoachingModal && (
          <CoachingModal
            key="coaching"
            onClose={() => setShowCoachingModal(false)}
            prescriptionDone={prescriptionHistory.length > 0}
            onNavigate={() => {
              setShowCoachingModal(false);
              navigate('/prescription');
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
