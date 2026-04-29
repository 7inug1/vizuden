import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SiteHeader from '../components/SiteHeader';
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
  const [editingNick, setEditingNick] = useState(false);
  const [nickInput, setNickInput] = useState('');
  const [nickError, setNickError] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeName, setWelcomeName] = useState('');
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

        <div className="flex flex-col py-4 pb-16">
          {!user && isGuest && (
            <div className="mb-6 border border-stone-200 px-4 py-4">
              <p className="text-xs tracking-widest text-stone-400 uppercase mb-2">Guest Mode</p>
              <p className="text-sm text-stone-500 leading-relaxed mb-4">
                현재 결과는 이 브라우저에만 저장됩니다. 로그인하면 계정에 보존하고 다른 기기에서도 이어볼 수 있습니다.
              </p>
              <button
                onClick={() => navigate('/auth', { state: { nextPath: '/mypage' } })}
                className="text-xs tracking-widest text-stone-900 uppercase border-b border-stone-900 pb-px hover:text-stone-500 hover:border-stone-500 transition-colors"
              >
                로그인하기 →
              </button>
            </div>
          )}

          {/* 캐릭터 + 호칭 + 닉네임 */}
          <div className="flex flex-col items-center pt-4 pb-8">

            {/* 유형 호칭 — 캐릭터 위 */}
            {latestTypeResult && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="text-center mb-3"
              >
                <p className="text-xs font-mono text-stone-300 tracking-widest mb-1">
                  {latestType.code}
                </p>
                <p
                  className="text-base font-light text-stone-700"
                  style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}
                >
                  {latestTypeResult.nameKo}
                </p>
              </motion.div>
            )}

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
            <p className="text-xs tracking-[0.28em] text-stone-400 uppercase mb-5">① 스타일 유형</p>

            {typeHistory.length > 0 ? (
              <>
                <div className="flex flex-col gap-px">
                  {pagedTypeHistory.map((entry) => {
                    const typeRes = types[entry.code];
                    if (!typeRes) return null;
                    const dateStr = formatDateTime(entry.savedAt);
                    return (
                      <button
                        key={entry.savedAt}
                        onClick={() => navigate(`/type/result/${entry.code}`, { state: { fromHistory: true } })}
                        className="flex items-center justify-between py-3.5 border-b border-stone-100
                          text-left hover:bg-stone-50 -mx-1 px-1 transition-colors group"
                      >
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-light text-stone-800 leading-tight">
                            {typeRes.nameKo}
                          </span>
                          <span className="text-xs font-mono text-stone-400 tabular-nums">
                            {entry.code} · {dateStr}
                          </span>
                        </div>
                        <span className="text-stone-300 group-hover:text-stone-500 transition-colors text-xs">→</span>
                      </button>
                    );
                  })}
                </div>

                {totalTypePages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <button onClick={() => setTypePage((p) => Math.max(0, p - 1))} disabled={typePage === 0}
                      className="text-xs text-stone-400 uppercase tracking-wider disabled:opacity-30 hover:text-stone-900 transition-colors">
                      ← 이전
                    </button>
                    <span className="text-xs text-stone-400 tabular-nums">{typePage + 1} / {totalTypePages}</span>
                    <button onClick={() => setTypePage((p) => Math.min(totalTypePages - 1, p + 1))} disabled={typePage === totalTypePages - 1}
                      className="text-xs text-stone-400 uppercase tracking-wider disabled:opacity-30 hover:text-stone-900 transition-colors">
                      다음 →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div>
                <p className="text-sm text-stone-400 leading-relaxed mb-5">아직 유형 진단을 하지 않았습니다.</p>
                <button onClick={() => navigate('/type/questions', { state: { source: 'mypage' } })}
                  className="text-xs tracking-widest text-stone-900 uppercase border-b border-stone-900 pb-px hover:text-stone-500 hover:border-stone-500 transition-colors">
                  유형 진단하기 →
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-stone-200" />

          {/* PRESCRIPTION 섹션 */}
          <div className="py-7">
            <p className="text-xs tracking-[0.28em] text-stone-400 uppercase mb-5">② 스타일 처방전</p>

            {prescriptionHistory.length > 0 ? (
              <>
                <div className="flex flex-col gap-px">
                  {pagedPrescriptionHistory.map((entry) => {
                    const dateStr = formatDateTime(entry.savedAt);
                    const title = entry.title || '스타일 처방전';
                    const preview = entry.preview || entry.free?.insight || null;
                    return (
                      <button
                        key={entry.savedAt}
                        onClick={() => navigate(`/prescription/result/${entry.reportId}`)}
                        className="flex items-start justify-between py-4 border-b border-stone-100
                          text-left hover:bg-stone-50 -mx-1 px-1 transition-colors group"
                      >
                        <div className="flex flex-col gap-1.5 flex-1 pr-3">
                          <span className="text-sm font-light text-stone-800 leading-snug">
                            {title}
                          </span>
                          {preview && (
                            <span
                              className="text-xs text-stone-400 leading-relaxed"
                              style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {preview}
                            </span>
                          )}
                          <span className="text-xs font-mono text-stone-300 tabular-nums">
                            {entry.fromType ? `${entry.fromType} · ` : ''}{dateStr}
                          </span>
                        </div>
                        <span className="text-stone-300 group-hover:text-stone-500 transition-colors text-xs shrink-0 mt-0.5">→</span>
                      </button>
                    );
                  })}
                </div>

                {totalPrescriptionPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <button onClick={() => setPrescriptionPage((p) => Math.max(0, p - 1))} disabled={prescriptionPage === 0}
                      className="text-xs text-stone-400 uppercase tracking-wider disabled:opacity-30 hover:text-stone-900 transition-colors">
                      ← 이전
                    </button>
                    <span className="text-xs text-stone-400 tabular-nums">{prescriptionPage + 1} / {totalPrescriptionPages}</span>
                    <button onClick={() => setPrescriptionPage((p) => Math.min(totalPrescriptionPages - 1, p + 1))} disabled={prescriptionPage === totalPrescriptionPages - 1}
                      className="text-xs text-stone-400 uppercase tracking-wider disabled:opacity-30 hover:text-stone-900 transition-colors">
                      다음 →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div>
                <p className="text-sm text-stone-400 leading-relaxed mb-5">
                  아직 스타일 처방전 보고서가 없습니다.
                </p>
                <button
                  onClick={() => navigate('/prescription')}
                  className="text-xs tracking-widest text-stone-900 uppercase border-b border-stone-900 pb-px hover:text-stone-500 hover:border-stone-500 transition-colors"
                >
                  처방전 만들기 →
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-stone-200" />

          {/* CONSULTING 섹션 */}
          <div className="py-7">
            <p className="text-xs tracking-[0.28em] text-stone-400 uppercase mb-5">③ 비주얼 컨설팅</p>

            {consultingHistory.length > 0 ? (
              <>
                <div className="flex flex-col gap-px">
                  {pagedConsultingHistory.map((entry) => {
                    const dateStr = formatDateTime(entry.created_at);
                    const preview = getConsultingPreview(entry.answers);
                    return (
                      <button
                        key={entry.id}
                        onClick={() => navigate(`/consulting/intakes/${entry.id}`)}
                        className="flex items-start justify-between py-4 border-b border-stone-100
                          text-left hover:bg-stone-50 -mx-1 px-1 transition-colors group"
                      >
                        <div className="flex flex-col gap-1.5 flex-1 pr-3">
                          <span className="text-sm font-light text-stone-800 leading-snug">
                            비주얼 컨설팅 사전 답변
                          </span>
                          {preview && (
                            <span
                              className="text-xs text-stone-400 leading-relaxed"
                              style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {preview}
                            </span>
                          )}
                          <span className="text-xs font-mono text-stone-300 tabular-nums">
                            {dateStr}
                          </span>
                        </div>
                        <span className="text-stone-300 group-hover:text-stone-500 transition-colors text-xs shrink-0 mt-0.5">→</span>
                      </button>
                    );
                  })}
                </div>

                {totalConsultingPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <button onClick={() => setConsultingPage((p) => Math.max(0, p - 1))} disabled={consultingPage === 0}
                      className="text-xs text-stone-400 uppercase tracking-wider disabled:opacity-30 hover:text-stone-900 transition-colors">
                      ← 이전
                    </button>
                    <span className="text-xs text-stone-400 tabular-nums">{consultingPage + 1} / {totalConsultingPages}</span>
                    <button onClick={() => setConsultingPage((p) => Math.min(totalConsultingPages - 1, p + 1))} disabled={consultingPage === totalConsultingPages - 1}
                      className="text-xs text-stone-400 uppercase tracking-wider disabled:opacity-30 hover:text-stone-900 transition-colors">
                      다음 →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div>
                <p className="text-sm text-stone-400 leading-relaxed mb-5">
                  아직 비주얼 컨설팅 사전 답변이 없습니다.
                </p>
                <button
                  onClick={() => navigate('/services')}
                  className="text-xs tracking-widest text-stone-900 uppercase border-b border-stone-900 pb-px hover:text-stone-500 hover:border-stone-500 transition-colors"
                >
                  서비스 보러가기 →
                </button>
              </div>
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

        <div className="text-center py-8 mt-auto">
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
      </AnimatePresence>
    </motion.div>
  );
}
