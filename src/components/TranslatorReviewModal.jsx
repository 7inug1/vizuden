import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import ImageDropzoneField from './ImageDropzoneField';

export default function TranslatorReviewModal({
  userId,
  intakeId,
  defaultName = '',
  onClose,
  onSubmitted,
}) {
  const [name, setName] = useState(defaultName || '');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [text, setText] = useState('');
  const [beforeFile, setBeforeFile] = useState(null);
  const [afterFile, setAfterFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('form'); // 'form' | 'success' | 'error'

  const trimmedLen = text.trim().length;
  const canSubmit = trimmedLen >= 10 && !submitting;

  function formatSubmitError(err) {
    const message = err?.message || '';
    if (
      message.includes('relation "public.reviews" does not exist') ||
      message.includes('Bucket not found') ||
      message.includes('bucket not found')
    ) {
      return '후기 저장 설정이 아직 적용되지 않았습니다. 관리자에게 문의해주세요.';
    }
    if (
      message.includes('row-level security') ||
      message.includes('new row violates row-level security') ||
      message.includes('Unauthorized')
    ) {
      return '로그인 상태를 다시 확인한 뒤 시도해주세요.';
    }
    return message || '제출에 실패했습니다';
  }

  useEffect(() => { setName(defaultName || ''); }, [defaultName]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  async function uploadImage(file, reviewId, label) {
    const ext = file.name.split('.').pop().toLowerCase();
    const path = `${userId}/${reviewId}_${label}.${ext}`;
    const { error: err } = await supabase.storage.from('review-images').upload(path, file, { upsert: true });
    if (err) throw err;
    return supabase.storage.from('review-images').getPublicUrl(path).data.publicUrl;
  }

  async function handleSubmit() {
    if (!canSubmit || !supabase) return;
    setSubmitting(true);
    setError('');
    try {
      const reviewId = crypto.randomUUID();
      const beforeUrl = beforeFile ? await uploadImage(beforeFile, reviewId, 'before') : null;
      const afterUrl = afterFile ? await uploadImage(afterFile, reviewId, 'after') : null;

      const { error: insertError } = await supabase.from('reviews').insert({
        id: reviewId,
        service: 'consulting',
        text: text.trim(),
        reviewer_name: isAnonymous ? null : (name.trim() || null),
        user_id: userId,
        consulting_intake_id: intakeId,
        before_image_url: beforeUrl,
        after_image_url: afterUrl,
      });
      if (insertError) throw insertError;
      setStatus('success');
      onSubmitted?.();
    } catch (err) {
      setError(formatSubmitError(err));
      setStatus('error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:p-6"
      style={{ backgroundColor: 'rgba(28,25,23,0.35)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-sm max-h-[88vh] overflow-y-auto border border-stone-200 p-5 shadow-lg"
        style={{ backgroundColor: '#F5F2ED' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs tracking-widest text-stone-400 uppercase mb-1">Visual Consulting</p>
            <p className="text-base font-light text-stone-900" style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.01em' }}>
              후기 남기기
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-0.5 text-stone-400 hover:text-stone-700 transition-colors duration-150"
            aria-label="닫기"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
              <line x1="4" y1="4" x2="20" y2="20" />
              <line x1="20" y1="4" x2="4" y2="20" />
            </svg>
          </button>
        </div>

        {status === 'success' ? (
          <div className="py-6 flex flex-col items-center text-center gap-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="text-stone-400">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <div>
              <p className="text-base font-light text-stone-900 mb-2" style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.01em' }}>
                후기가 접수되었습니다
              </p>
              <p className="text-xs text-stone-400 leading-relaxed">
                검토 후 서비스 페이지에 게재됩니다.<br />소중한 후기 감사합니다.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 w-full py-3 bg-stone-900 text-stone-50 text-xs tracking-widest uppercase"
            >
              닫기
            </button>
          </div>
        ) : (
          <>
            {/* 이름 */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-stone-500 tracking-wide">이름</p>
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-3 h-3 accent-stone-900"
                  />
                  <span className="text-xs text-stone-400">익명으로 공개</span>
                </label>
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름 또는 닉네임"
                maxLength={20}
                disabled={isAnonymous}
                className="w-full border border-stone-200 bg-transparent px-4 py-2.5 text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:border-stone-400 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>

            {/* 사진 — 가로 2열 */}
            <div className="mb-4">
              <p className="text-xs text-stone-500 tracking-wide mb-2">사진 <span className="text-stone-300">(선택)</span></p>
              <div className="grid grid-cols-2 gap-3">
                <ImageDropzoneField
                  label="Before"
                  file={beforeFile}
                  onChange={setBeforeFile}
                  onRemove={() => setBeforeFile(null)}
                  onError={setError}
                  compact
                />
                <ImageDropzoneField
                  label="After"
                  file={afterFile}
                  onChange={setAfterFile}
                  onRemove={() => setAfterFile(null)}
                  onError={setError}
                  compact
                />
              </div>
            </div>

            {/* 후기 내용 */}
            <div className="mb-4">
              <p className="text-xs text-stone-500 tracking-wide mb-2">후기</p>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={5}
                placeholder="컨설팅 전후 어떤 변화가 있었나요? 가장 도움됐던 조언, 실제로 달라진 것들, 인상 깊었던 순간을 구체적으로 적어주시면 다른 분들께 큰 도움이 됩니다."
                maxLength={1000}
                className="w-full resize-none border border-stone-200 bg-transparent px-4 py-3 text-sm text-stone-800 leading-relaxed placeholder:text-stone-300 focus:outline-none focus:border-stone-400 transition-colors duration-150"
              />
              <p className="text-[11px] text-right mt-1" style={{ color: trimmedLen < 10 ? '#a8a29e' : '#d6d3d1' }}>
                {trimmedLen < 10 ? `${trimmedLen}/10자 이상 입력 시 제출 가능` : `${trimmedLen}/1000`}
              </p>
            </div>

            {status === 'error' && error && (
              <div className="mb-4 border border-red-100 px-3 py-2.5">
                <p className="text-xs text-red-500 leading-relaxed">{error}</p>
                <button
                  type="button"
                  onClick={() => { setStatus('form'); setError(''); }}
                  className="text-[11px] text-stone-400 hover:text-stone-700 mt-1.5 transition-colors"
                >
                  다시 시도
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full py-3 bg-stone-900 text-stone-50 text-xs tracking-widest uppercase disabled:opacity-30 disabled:cursor-not-allowed transition-opacity duration-150"
            >
              {submitting ? '제출 중...' : '제출하기'}
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
