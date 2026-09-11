import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageSquareText, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ensureGuestSessionId } from '../lib/storage';
import { readPrescriptionSaved } from '../lib/prescriptionStorage';

const CATEGORY_OPTIONS = [
  { id: 'bug', label: '버그/오류' },
  { id: 'content', label: '내용 피드백' },
  { id: 'usability', label: '사용성' },
  { id: 'other', label: '기타' },
];

function getPageType(pathname) {
  if (pathname === '/') return 'home';
  if (pathname === '/services') return 'services';
  if (pathname === '/mypage') return 'mypage';
  if (pathname === '/type') return 'home';
  if (pathname === '/type/questions') return 'type_questions';
  if (/^\/type\/result\/[^/]+$/.test(pathname)) return 'type_result';
  if (pathname === '/prescription' || pathname === '/prescription/questions') return 'prescription_questions';
  if (/^\/prescription\/result\/[^/]+$/.test(pathname)) return 'prescription_result';
  if (pathname === '/consulting' || pathname === '/identity') return 'translator_landing';
  if (pathname === '/prescription/payment/success') return 'prescription_payment_success';
  if (pathname === '/prescription/payment/fail') return 'prescription_payment_fail';
  return 'other';
}

function getRouteContext(pathname, state) {
  const reportMatch = pathname.match(/^\/prescription\/result\/([^/]+)$/);
  const typeResultMatch = pathname.match(/^\/type\/result\/([^/]+)$/);

  let typeCode = typeResultMatch?.[1] ?? state?.fromType ?? state?.type ?? null;
  let reportId = reportMatch?.[1] ?? state?.reportId ?? null;
  let isPaid = typeof state?.isPaid === 'boolean' ? state.isPaid : null;

  const savedPrescription = readPrescriptionSaved();
  if (!typeCode && pathname.startsWith('/prescription')) {
    typeCode = savedPrescription?.fromType ?? null;
  }
  if (!reportId && pathname.startsWith('/prescription')) {
    reportId = savedPrescription?.reportId ?? null;
  }
  if (isPaid == null && pathname.startsWith('/prescription')) {
    isPaid = savedPrescription?.isPaid ?? null;
  }

  return {
    pathname,
    pageType: getPageType(pathname),
    reportId,
    typeCode,
    isPaid,
  };
}

function FeedbackModal({ context, guestSessionId, onClose, userId }) {
  const [category, setCategory] = useState('content');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('form');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const canSubmit = message.trim().length >= 5 && message.trim().length <= 1000;

  async function handleSubmit() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setErrorMsg('');
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          message: message.trim(),
          pathname: context.pathname,
          pageType: context.pageType,
          reportId: context.reportId,
          typeCode: context.typeCode,
          isPaid: context.isPaid,
          userId,
          guestSessionId,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || '저장에 실패했습니다');
      setStatus('success');
    } catch (error) {
      setStatus('error');
      setErrorMsg(error?.message || '저장에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6"
      style={{ backgroundColor: 'rgba(28,25,23,0.35)' }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-sm border border-stone-200 bg-stone-50 p-5 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-xs tracking-widest text-stone-400 uppercase mb-2">Feedback</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 transition-colors duration-150"
            aria-label="피드백 닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {status === 'success' ? (
          <div>
            <p className="text-sm text-stone-600 leading-relaxed mb-5">피드백이 전송되었습니다.</p>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 bg-stone-900 text-stone-50 text-xs tracking-widest uppercase"
            >
              확인
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              {CATEGORY_OPTIONS.map((option) => {
                const selected = category === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setCategory(option.id)}
                    className="px-3 py-2 text-xs tracking-wide border transition-colors duration-150"
                    style={{
                      backgroundColor: selected ? '#1c1917' : 'transparent',
                      color: selected ? '#fafaf9' : '#57534e',
                      borderColor: selected ? '#1c1917' : '#d6d3d1',
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={5}
              placeholder="불편했던 점이나 개선되었으면 하는 점을 적어주세요."
              className="w-full resize-none border border-stone-200 bg-transparent px-4 py-3 text-sm text-stone-800 leading-relaxed placeholder:text-stone-300 focus:outline-none focus:border-stone-400 transition-colors duration-150"
            />

            <div className="flex items-center justify-between mt-2 mb-4">
              <p className="text-[11px] text-stone-400">현재 페이지 문맥이 함께 저장됩니다.</p>
              <p className="text-[11px]" style={{ color: message.trim().length < 5 ? '#a8a29e' : '#d6d3d1' }}>
                {message.trim().length < 5 ? `${message.trim().length}/5자 이상 입력 시 전송 가능` : `${message.trim().length}/1000`}
              </p>
            </div>

            {status === 'error' && errorMsg ? (
              <p className="text-xs text-red-600 mb-4">{errorMsg}</p>
            ) : null}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="w-full py-3 bg-stone-900 text-stone-50 text-xs tracking-widest uppercase disabled:opacity-30 disabled:cursor-not-allowed transition-opacity duration-150"
            >
              {submitting ? '저장 중' : '피드백 보내기'}
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function FloatingFeedbackButton() {
  const location = useLocation();
  const { isGuest, user } = useAuth();
  const [open, setOpen] = useState(false);

  const hidden =
    location.pathname === '/' ||
    location.pathname === '/auth/email' ||
    location.pathname === '/auth/callback';

  const context = useMemo(
    () => (hidden ? null : getRouteContext(location.pathname, location.state)),
    [hidden, location.pathname, location.state]
  );

  if (hidden) return null;

  const userId = user?.id ?? null;
  const guestSessionId = !userId && isGuest ? ensureGuestSessionId() : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-stone-900 text-stone-50 shadow-lg transition-transform duration-150 hover:scale-[1.02] sm:right-6 sm:bottom-6"
        aria-label="피드백 보내기"
      >
        <MessageSquareText className="w-5 h-5" strokeWidth={1.8} />
      </button>
      <AnimatePresence>
        {open ? (
          <FeedbackModal
            context={context}
            guestSessionId={guestSessionId}
            onClose={() => setOpen(false)}
            userId={userId}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}
